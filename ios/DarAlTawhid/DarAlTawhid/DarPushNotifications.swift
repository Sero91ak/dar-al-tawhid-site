import Foundation
import UIKit
import UserNotifications

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
    private static let lastRegisteredTokenKey = "dar.ios.registered.apns.token"
    private static let welcomeSentForSub = "dar.ios.welcome.sent."
    private static var registerInFlight = false

    static func bootstrap(launchOptions: [UIApplication.LaunchOptionsKey: Any]?) {
        clearStaleApnsAsSubscriptionId()
        guard !didBoot else {
            Task { await publishSubscriptionToWebAndServer() }
            return
        }
        didBoot = true
        UNUserNotificationCenter.current().delegate = DarPushCenter.shared
        optInAfterPermission(fallbackToSettings: false)
        NotificationCenter.default.addObserver(
            forName: UIApplication.didBecomeActiveNotification,
            object: nil,
            queue: .main
        ) { _ in
            Task { await publishSubscriptionToWebAndServer() }
        }
    }

    static func requestAuthorization() {
        optInAfterPermission(fallbackToSettings: true)
    }

    static func syncWithServerThenScheduleLocalFallback() {
        optInAfterPermission(fallbackToSettings: false)
    }

    private static func optInAfterPermission(fallbackToSettings: Bool) {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
            DispatchQueue.main.async {
                if granted {
                    UIApplication.shared.registerForRemoteNotifications()
                }
                syncPermissionToWeb()
                Task { await publishSubscriptionToWebAndServer() }
            }
            if !granted, fallbackToSettings, let url = URL(string: UIApplication.openSettingsURLString) {
                DispatchQueue.main.async {
                    UIApplication.shared.open(url)
                }
            }
        }
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
            await publishSubscriptionToWebAndServer(forceRegister: true)
            guard let sub = await waitForSubscriptionId(timeoutSeconds: 30) else { return }
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

    static func didRegister(deviceToken: Data) {
        let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        guard let clean = sanitizedApnsToken(token) else { return }
        UserDefaults.standard.set(clean, forKey: lastTokenKey)
        Task { await publishSubscriptionToWebAndServer() }
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
        sanitizedSubscriptionId(UserDefaults.standard.string(forKey: lastSubKey)) ?? ""
    }

    static func pushToken() -> String {
        sanitizedApnsToken(UserDefaults.standard.string(forKey: lastTokenKey)) ?? ""
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

    static func publishSubscriptionToWebAndServer(forceRegister: Bool = false) async {
        guard let token = sanitizedApnsToken(UserDefaults.standard.string(forKey: lastTokenKey)) else {
            await MainActor.run {
                NotificationCenter.default.post(name: .darNativePushReady, object: nil)
                syncPermissionToWeb()
            }
            return
        }

        let settings = UserDefaults.standard.dictionary(forKey: settingsKey) ?? [:]
        guard let subscriptionId = await ensureOneSignalSubscription(
            token: token,
            settings: settings,
            forceRegister: forceRegister
        ) else {
            await MainActor.run {
                NotificationCenter.default.post(name: .darNativePushReady, object: nil)
                syncPermissionToWeb()
            }
            return
        }

        UserDefaults.standard.set(subscriptionId, forKey: lastSubKey)
        await saveSupabaseRegistration(subscriptionId: subscriptionId, token: token, settings: settings)
        await sendWelcomePushIfNeeded(subscriptionId: subscriptionId)
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
    }

    private static func ensureOneSignalSubscription(
        token: String,
        settings: [String: Any],
        forceRegister: Bool = false
    ) async -> String? {
        let cached = sanitizedSubscriptionId(UserDefaults.standard.string(forKey: lastSubKey))
        let lastRegistered = UserDefaults.standard.string(forKey: lastRegisteredTokenKey)
        if !forceRegister, let cached, lastRegistered == token {
            return cached
        }
        if registerInFlight {
            return await waitForSubscriptionId()
        }
        registerInFlight = true
        defer { registerInFlight = false }

        let payload: [String: Any] = [
            "deviceId": deviceId(),
            "pushToken": token,
            "production": true,
            "deviceOs": UIDevice.current.systemVersion,
            "tags": reminderTags(settings)
        ]
        guard JSONSerialization.isValidJSONObject(payload),
              let bodyData = try? JSONSerialization.data(withJSONObject: payload) else {
            return cached
        }
        var req = URLRequest(url: URL(string: "\(workerURL)/api/prayer/register-native")!)
        req.httpMethod = "POST"
        req.httpBody = bodyData
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        guard let (data, response) = try? await URLSession.shared.data(for: req),
              let http = response as? HTTPURLResponse,
              (200..<300).contains(http.statusCode),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let subscriptionId = sanitizedSubscriptionId(json["subscriptionId"] as? String) else {
            return sanitizedSubscriptionId(UserDefaults.standard.string(forKey: lastSubKey))
        }
        UserDefaults.standard.set(subscriptionId, forKey: lastSubKey)
        UserDefaults.standard.set(token, forKey: lastRegisteredTokenKey)
        return subscriptionId
    }

    private static func sendWelcomePushIfNeeded(subscriptionId: String) async {
        let key = welcomeSentForSub + subscriptionId
        if UserDefaults.standard.bool(forKey: key) { return }
        let ok = await postJSON("\(workerURL)/api/push/welcome", body: [
            "subscriptionId": subscriptionId,
            "attempt": "once"
        ])
        if ok {
            UserDefaults.standard.set(true, forKey: key)
        }
    }

    private static func reminderTags(_ settings: [String: Any]) -> [String: String] {
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
        return tags
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

    private static func waitForSubscriptionId(timeoutSeconds: Int = 10) async -> String? {
        if let id = sanitizedSubscriptionId(UserDefaults.standard.string(forKey: lastSubKey)) { return id }
        let attempts = max(1, timeoutSeconds * 4)
        for _ in 0..<attempts {
            try? await Task.sleep(nanoseconds: 250_000_000)
            if let id = sanitizedSubscriptionId(UserDefaults.standard.string(forKey: lastSubKey)) { return id }
        }
        return sanitizedSubscriptionId(UserDefaults.standard.string(forKey: lastSubKey))
    }

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

final class DarPushCenter: NSObject, UNUserNotificationCenterDelegate {
    static let shared = DarPushCenter()

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .sound, .badge])
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        DarPushNotifications.openFromNotification(userInfo: response.notification.request.content.userInfo)
        completionHandler()
    }
}
