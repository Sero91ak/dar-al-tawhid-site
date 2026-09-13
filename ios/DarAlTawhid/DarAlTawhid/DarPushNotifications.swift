import Foundation
import UIKit
import UserNotifications
#if !targetEnvironment(macCatalyst)
import OneSignalFramework
#endif

enum DarPushNotifications {
    static let oneSignalAppId = "786d7cd6-0455-4434-ab14-0c10a7bc6b1e"
    static let workerURL = "https://dar-admin-publisher.sero91ak.workers.dev"
    static let supabaseURL = "https://djyfkttjbdraynuxrzno.supabase.co"
    static let supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqeWZrdHRqYmRyYXludXhyem5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NjE1MTUsImV4cCI6MjA5NjQzNzUxNX0.PUzkuxpJVWeW64nSAVW61KqYDE5k1d4sAir2unXKjxw"

    static let lastSubKey = "dar.ios.onesignal.subscription.id"
    static let lastTokenKey = "dar.ios.apns.token"
    static let settingsKey = "dar.ios.web.prayer.settings"
    private static let deviceIdKey = "dar.ios.push.device.id"
    private static let staleTokenKey = "dar.push.token"
    private static var didBoot = false
    private static var lastScheduleAt: TimeInterval = 0
    #if !targetEnvironment(macCatalyst)
    private static let clickListener = DarOneSignalClickListener()
    private static let foregroundListener = DarOneSignalForegroundListener()
    private static let subscriptionObserver = DarOneSignalSubscriptionObserver()
    #endif

    static func bootstrap(launchOptions: [UIApplication.LaunchOptionsKey: Any]?) {
        clearStaleApnsAsSubscriptionId()
        #if targetEnvironment(macCatalyst)
        syncPermissionToWeb()
        #else
        guard !didBoot else {
            Task { await publishSubscriptionToWebAndServer() }
            return
        }
        didBoot = true
        #if DEBUG
        OneSignal.Debug.setLogLevel(.LL_VERBOSE)
        #else
        OneSignal.Debug.setLogLevel(.LL_WARN)
        #endif
        OneSignal.initialize(oneSignalAppId, withLaunchOptions: launchOptions)
        OneSignal.Notifications.addClickListener(clickListener)
        OneSignal.Notifications.addForegroundLifecycleListener(foregroundListener)
        OneSignal.User.pushSubscription.addObserver(subscriptionObserver)
        OneSignal.login(deviceId())
        OneSignal.User.addTags([
            "dar_push": "true",
            "platform": "ios",
            "dar_app": "true",
            "dar_client": "native_ios",
            "dar_surface": "native",
            "push_site": "dar-al-tawhid"
        ])
        optInAfterPermission(fallbackToSettings: false)
        NotificationCenter.default.addObserver(
            forName: UIApplication.didBecomeActiveNotification,
            object: nil,
            queue: .main
        ) { _ in
            Task { await publishSubscriptionToWebAndServer() }
        }
        #endif
    }

    static func requestAuthorization() {
        optInAfterPermission(fallbackToSettings: true)
    }

    static func syncWithServerThenScheduleLocalFallback() {
        optInAfterPermission(fallbackToSettings: false)
    }

    private static func optInAfterPermission(fallbackToSettings: Bool) {
        #if !targetEnvironment(macCatalyst)
        OneSignal.Notifications.requestPermission({ granted in
            if granted {
                OneSignal.User.pushSubscription.optIn()
            }
            DispatchQueue.main.async {
                syncPermissionToWeb()
                Task { await publishSubscriptionToWebAndServer() }
            }
        }, fallbackToSettings: fallbackToSettings)
        #else
        syncPermissionToWeb()
        #endif
    }

    static func syncPermissionToWeb() {
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            let status: String
            switch settings.authorizationStatus {
            case .authorized, .provisional, .ephemeral: status = "granted"
            case .denied: status = "denied"
            default: status = "default"
            }
            DispatchQueue.main.async {
                NotificationCenter.default.post(
                    name: .darNativePushPermission,
                    object: nil,
                    userInfo: ["status": status]
                )
            }
        }
    }

    static func applyWebPrayerSettings(_ raw: [String: Any]) {
        let clean = plistDictionary(raw)
        if PropertyListSerialization.propertyList(clean, isValidFor: .binary) {
            UserDefaults.standard.set(clean, forKey: settingsKey)
        }
        Task { await publishSubscriptionToWebAndServer() }
    }

    static func showTest(title: String, body: String, type: String, prayer: String = "dhuhr", mode: String = "entry") {
        requestAuthorization()
        Task {
            guard let sub = await waitForSubscriptionId() else { return }
            _ = await postJSON("\(workerURL)/api/prayer/test", body: [
                "subscriptionId": sub,
                "prayer": prayer.isEmpty ? "dhuhr" : prayer,
                "mode": mode.isEmpty ? "entry" : mode,
                "advanceMinutes": "0"
            ])
        }
    }

    static func openFromNotification(userInfo: [AnyHashable: Any]) {
        let nested = (userInfo["custom"] as? [String: Any])?["a"] as? [String: Any]
        let additional = userInfo["additionalData"] as? [String: Any]
        func val(_ key: String) -> String {
            if let v = nested?[key] { return String(describing: v) }
            if let v = additional?[key] { return String(describing: v) }
            if let v = userInfo[key] { return String(describing: v) }
            return ""
        }
        let postId = [val("content_id"), val("postId"), val("slug")].first { !$0.isEmpty && $0 != "nil" } ?? ""
        let url = [val("url"), val("launchURL")].first { !$0.isEmpty } ?? ""
        NotificationCenter.default.post(
            name: .darOpenPush,
            object: nil,
            userInfo: [
                "type": val("type").isEmpty ? val("nav") : val("type"),
                "postId": postId,
                "url": url
            ]
        )
    }

    static func deviceId() -> String {
        if let existing = UserDefaults.standard.string(forKey: deviceIdKey), !existing.isEmpty {
            return existing
        }
        let id = "ios-" + UUID().uuidString.lowercased()
        UserDefaults.standard.set(id, forKey: deviceIdKey)
        return id
    }

    static func lastSubscriptionId() -> String {
        #if !targetEnvironment(macCatalyst)
        if let live = sanitizedSubscriptionId(OneSignal.User.pushSubscription.id) {
            return live
        }
        #endif
        return sanitizedSubscriptionId(UserDefaults.standard.string(forKey: lastSubKey)) ?? ""
    }

    static func pushToken() -> String {
        #if !targetEnvironment(macCatalyst)
        if let live = sanitizedApnsToken(OneSignal.User.pushSubscription.token) {
            return live
        }
        #endif
        return sanitizedApnsToken(UserDefaults.standard.string(forKey: lastTokenKey)) ?? ""
    }

    static func sanitizedSubscriptionId(_ raw: String?) -> String? {
        let value = (raw ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        guard isOneSignalUUID(value) else { return nil }
        return value
    }

    static func sanitizedApnsToken(_ raw: String?) -> String? {
        let value = (raw ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        guard isLikelyApnsToken(value) else { return nil }
        return value
    }

    static func isOneSignalUUID(_ value: String) -> Bool {
        let pattern = #"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"#
        return value.range(of: pattern, options: .regularExpression) != nil
    }

    static func isLikelyApnsToken(_ value: String) -> Bool {
        let hex = value.replacingOccurrences(of: " ", with: "")
        guard hex.count >= 64, hex.range(of: "^[0-9a-fA-F]+$", options: .regularExpression) != nil else {
            return false
        }
        return !isOneSignalUUID(hex)
    }

    private static func clearStaleApnsAsSubscriptionId() {
        if let stale = UserDefaults.standard.string(forKey: lastSubKey), !isOneSignalUUID(stale) {
            UserDefaults.standard.removeObject(forKey: lastSubKey)
        }
        if let oldToken = UserDefaults.standard.string(forKey: staleTokenKey) {
            if isLikelyApnsToken(oldToken) {
                UserDefaults.standard.set(oldToken, forKey: lastTokenKey)
            }
            UserDefaults.standard.removeObject(forKey: staleTokenKey)
        }
    }

    static func publishSubscriptionToWebAndServer() async {
        #if !targetEnvironment(macCatalyst)
        guard let subscriptionId = await waitForSubscriptionId() else {
            await MainActor.run {
                NotificationCenter.default.post(name: .darNativePushReady, object: nil)
                syncPermissionToWeb()
            }
            return
        }
        UserDefaults.standard.set(subscriptionId, forKey: lastSubKey)
        let token = sanitizedApnsToken(OneSignal.User.pushSubscription.token)
        if let token { UserDefaults.standard.set(token, forKey: lastTokenKey) }
        let settings = UserDefaults.standard.dictionary(forKey: settingsKey) ?? [:]
        await saveSupabaseRegistration(subscriptionId: subscriptionId, token: token, settings: settings)
        applyReminderTags(settings)
        if bool(settings["reminder"]), number(settings["lat"]) != nil, number(settings["lon"]) != nil {
            let now = Date().timeIntervalSince1970
            if now - lastScheduleAt > 20 {
                lastScheduleAt = now
                _ = await postJSON("\(workerURL)/api/prayer/schedule-now", body: ["subscriptionId": subscriptionId])
            }
        }
        await MainActor.run {
            NotificationCenter.default.post(name: .darNativePushReady, object: nil)
            syncPermissionToWeb()
        }
        #endif
    }

    private static func applyReminderTags(_ settings: [String: Any]) {
        #if !targetEnvironment(macCatalyst)
        let locOk = number(settings["lat"]) != nil && number(settings["lon"]) != nil
        var tags: [String: String] = [
            "dar_push": "true",
            "platform": "ios",
            "dar_app": "true",
            "dar_client": "native_ios",
            "push_site": "dar-al-tawhid",
            "reminders_enabled": bool(settings["reminder"]) || bool(settings["dailyDua"] ?? true) || bool(settings["dailyRecommendation"] ?? true) ? "true" : "false",
            "daily_dua_enabled": bool(settings["dailyDua"] ?? true) ? "true" : "false",
            "daily_recommended_enabled": bool(settings["dailyRecommendation"] ?? true) ? "true" : "false",
            "prayer_reminders_enabled": bool(settings["reminder"]) && locOk ? "true" : "false",
            "prayer_notifications": bool(settings["reminder"]) && locOk ? "true" : "false"
        ]
        if locOk, let lat = number(settings["lat"]), let lon = number(settings["lon"]) {
            tags["prayer_lat"] = String(format: "%.5f", lat)
            tags["prayer_lon"] = String(format: "%.5f", lon)
            tags["prayer_advance_minutes"] = String(Int(number(settings["advanceMinutes"]) ?? 15))
        }
        OneSignal.User.addTags(tags)
        #endif
    }

    private static func saveSupabaseRegistration(subscriptionId: String, token: String?, settings: [String: Any]) async {
        let tz = TimeZone.current.identifier
        let reminder = bool(settings["reminder"])
        let locGranted = bool(settings["locationGranted"]) || reminder
        let lat = number(settings["lat"])
        let lon = number(settings["lon"])
        let hasLoc = locGranted && lat != nil && lon != nil
        var body: [String: Any] = [
            "device_id": deviceId(),
            "subscription_id": subscriptionId,
            "timezone": tz.isEmpty ? "Europe/Berlin" : tz,
            "daily_dua_enabled": settings["dailyDua"] == nil ? true : bool(settings["dailyDua"]),
            "daily_recommendation_enabled": settings["dailyRecommendation"] == nil ? true : bool(settings["dailyRecommendation"]),
            "daily_dua_time": settings["dailyDuaTime"] as? String ?? "09:00",
            "daily_recommendation_time": settings["dailyRecommendationTime"] as? String ?? "12:00",
            "push_opted_in": true,
            "user_agent": "DAR-iOS-native",
            "last_synced_at": ISO8601DateFormatter().string(from: Date()),
            "enabled": reminder && hasLoc,
            "city": settings["city"] as? String ?? "",
            "method_angle": number(settings["angle"]) ?? 12,
            "asr_factor": number(settings["asrFactor"]) ?? 1,
            "advance_minutes": Int(number(settings["advanceMinutes"]) ?? 15),
            "tahajjud_mode": settings["tahajjudMode"] as? String ?? "off",
            "jummah_notifications": bool(settings["jummahNotifications"])
        ]
        if let token { body["push_token"] = token } else { body["push_token"] = NSNull() }
        if hasLoc, let lat, let lon {
            body["lat"] = lat
            body["lon"] = lon
        }
        guard let data = try? JSONSerialization.data(withJSONObject: body) else { return }
        var req = URLRequest(url: URL(string: "\(supabaseURL)/rest/v1/prayer_push_registrations?on_conflict=device_id")!)
        req.httpMethod = "POST"
        req.httpBody = data
        req.setValue(supabaseAnonKey, forHTTPHeaderField: "apikey")
        req.setValue("Bearer \(supabaseAnonKey)", forHTTPHeaderField: "Authorization")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("resolution=merge-duplicates,return=minimal", forHTTPHeaderField: "Prefer")
        _ = try? await URLSession.shared.data(for: req)
    }

    #if !targetEnvironment(macCatalyst)
    private static func waitForSubscriptionId() async -> String? {
        if let id = sanitizedSubscriptionId(OneSignal.User.pushSubscription.id) { return id }
        for _ in 0..<40 {
            try? await Task.sleep(nanoseconds: 250_000_000)
            if let id = sanitizedSubscriptionId(OneSignal.User.pushSubscription.id) { return id }
        }
        return sanitizedSubscriptionId(OneSignal.User.pushSubscription.id)
    }
    #endif

    @discardableResult
    private static func postJSON(_ url: String, body: [String: Any]) async -> Bool {
        guard JSONSerialization.isValidJSONObject(body),
              let data = try? JSONSerialization.data(withJSONObject: body) else { return false }
        var req = URLRequest(url: URL(string: url)!)
        req.httpMethod = "POST"
        req.httpBody = data
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        guard let (_, res) = try? await URLSession.shared.data(for: req),
              let http = res as? HTTPURLResponse else { return false }
        return (200..<300).contains(http.statusCode)
    }

    private static func bool(_ value: Any?) -> Bool {
        if let b = value as? Bool { return b }
        if let n = value as? NSNumber { return n.boolValue }
        if let s = value as? String { return s == "true" || s == "1" }
        return false
    }

    private static func number(_ value: Any?) -> Double? {
        if let d = value as? Double { return d }
        if let n = value as? NSNumber { return n.doubleValue }
        if let s = value as? String { return Double(s) }
        return nil
    }

    private static func plistDictionary(_ raw: [String: Any]) -> [String: Any] {
        var out: [String: Any] = [:]
        for (key, value) in raw {
            if let nested = plistValue(value) { out[key] = nested }
        }
        return out
    }

    private static func plistValue(_ value: Any) -> Any? {
        if value is NSNull { return nil }
        if value is String || value is NSNumber || value is Date || value is Data || value is Bool {
            return value
        }
        if let dict = value as? [String: Any] { return plistDictionary(dict) }
        if let array = value as? [Any] { return array.compactMap { plistValue($0) } }
        return String(describing: value)
    }
}

extension Notification.Name {
    static let darOpenPush = Notification.Name("darOpenPush")
    static let darNativePushReady = Notification.Name("darNativePushReady")
    static let darNativePushPermission = Notification.Name("darNativePushPermission")
}

#if !targetEnvironment(macCatalyst)
final class DarOneSignalClickListener: NSObject, OSNotificationClickListener {
    func onClick(event: OSNotificationClickEvent) {
        let extra = event.notification.additionalData ?? [:]
        var info: [AnyHashable: Any] = [:]
        extra.forEach { info[$0] = $1 }
        if let launch = event.notification.launchURL, info["url"] == nil {
            info["url"] = launch
        }
        if let clickURL = event.result.url, info["url"] == nil {
            info["url"] = clickURL
        }
        DarPushNotifications.openFromNotification(userInfo: info)
    }
}

final class DarOneSignalForegroundListener: NSObject, OSNotificationLifecycleListener {
    func onWillDisplay(event: OSNotificationWillDisplayEvent) {
        event.notification.display()
    }
}

final class DarOneSignalSubscriptionObserver: NSObject, OSPushSubscriptionObserver {
    func onPushSubscriptionDidChange(state: OSPushSubscriptionChangedState) {
        Task { await DarPushNotifications.publishSubscriptionToWebAndServer() }
    }
}
#endif
