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
    static let settingsKey = "dar.ios.web.prayer.settings"
    private static let deviceIdKey = "dar.ios.push.device.id"
    private static var didBoot = false
    #if !targetEnvironment(macCatalyst)
    private static let clickListener = DarOneSignalClickListener()
    private static let foregroundListener = DarOneSignalForegroundListener()
    #endif

    static func bootstrap(launchOptions: [UIApplication.LaunchOptionsKey: Any]?) {
        #if targetEnvironment(macCatalyst)
        syncPermissionToWeb()
        #else
        guard !didBoot else { return }
        didBoot = true
        #if DEBUG
        OneSignal.Debug.setLogLevel(.LL_VERBOSE)
        #else
        OneSignal.Debug.setLogLevel(.LL_WARN)
        #endif
        OneSignal.initialize(oneSignalAppId, withLaunchOptions: launchOptions)
        OneSignal.Notifications.addClickListener(clickListener)
        OneSignal.Notifications.addForegroundLifecycleListener(foregroundListener)
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
        #endif
    }

    /// Called from the web button „Benachrichtigungen erneut aktivieren“.
    static func requestAuthorization() {
        optInAfterPermission(fallbackToSettings: true)
    }

    private static func optInAfterPermission(fallbackToSettings: Bool) {
        #if !targetEnvironment(macCatalyst)
        OneSignal.Notifications.requestPermission({ granted in
            if granted {
                OneSignal.User.pushSubscription.optIn()
            }
            DispatchQueue.main.async {
                syncPermissionToWeb()
                if granted {
                    Task { await publishSubscriptionToWebAndServer() }
                }
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

    static func syncWithServerThenScheduleLocalFallback() {
        requestAuthorization()
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
            let sub = await waitForSubscriptionId() ?? lastSubscriptionId()
            guard !sub.isEmpty else { return }
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
        if let live = OneSignal.User.pushSubscription.id, !live.isEmpty {
            return live
        }
        #endif
        return UserDefaults.standard.string(forKey: lastSubKey) ?? ""
    }

    static func pushToken() -> String {
        #if !targetEnvironment(macCatalyst)
        return OneSignal.User.pushSubscription.token ?? ""
        #else
        return ""
        #endif
    }

    private static func publishSubscriptionToWebAndServer() async {
        #if !targetEnvironment(macCatalyst)
        guard let subscriptionId = await waitForSubscriptionId() else {
            await MainActor.run {
                NotificationCenter.default.post(name: .darNativePushReady, object: nil)
                syncPermissionToWeb()
            }
            return
        }
        UserDefaults.standard.set(subscriptionId, forKey: lastSubKey)
        let token = OneSignal.User.pushSubscription.token
        let settings = UserDefaults.standard.dictionary(forKey: settingsKey) ?? [:]
        await saveSupabaseRegistration(subscriptionId: subscriptionId, token: token, settings: settings)
        OneSignal.User.addTags([
            "dar_push": "true",
            "platform": "ios",
            "dar_app": "true",
            "reminders_enabled": "true",
            "dar_client": "native_ios",
            "push_site": "dar-al-tawhid"
        ])
        await MainActor.run {
            NotificationCenter.default.post(name: .darNativePushReady, object: nil)
            syncPermissionToWeb()
        }
        #endif
    }

    private static func saveSupabaseRegistration(subscriptionId: String, token: String?, settings: [String: Any]) async {
        let tz = TimeZone.current.identifier
        var body: [String: Any] = [
            "device_id": deviceId(),
            "subscription_id": subscriptionId,
            "timezone": tz.isEmpty ? "Europe/Berlin" : tz,
            "push_opted_in": true,
            "user_agent": "DAR-iOS-native",
            "last_synced_at": ISO8601DateFormatter().string(from: Date())
        ]
        if let token, !token.isEmpty { body["push_token"] = token }
        if let dua = settings["dailyDua"] { body["daily_dua_enabled"] = bool(dua) }
        if let rec = settings["dailyRecommendation"] { body["daily_recommendation_enabled"] = bool(rec) }
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
        if let id = OneSignal.User.pushSubscription.id, !id.isEmpty { return id }
        for _ in 0..<24 {
            try? await Task.sleep(nanoseconds: 250_000_000)
            if let id = OneSignal.User.pushSubscription.id, !id.isEmpty { return id }
        }
        return OneSignal.User.pushSubscription.id
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
#endif
