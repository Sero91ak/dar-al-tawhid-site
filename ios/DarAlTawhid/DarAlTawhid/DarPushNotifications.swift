import Foundation
import UserNotifications
import UIKit
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
    private static let welcomeSentKey = "dar.ios.welcome.push.v3"
    private static let deviceIdKey = "dar.ios.push.device.id"
    private static let prayerPrefix = "dar.prayer."
    private static let jummahPrefix = "dar.jummah."
    private static var didBoot = false
    private static let clickListener = DarOneSignalClickListener()

    static func bootstrap(launchOptions: [UIApplication.LaunchOptionsKey: Any]?) {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
            DispatchQueue.main.async {
                if granted {
                    UIApplication.shared.registerForRemoteNotifications()
                }
                sendLocalWelcomeIfNeeded()
                scheduleJummahLocal()
                if granted {
                    reschedulePrayers()
                }
            }
        }
        #if !targetEnvironment(macCatalyst)
        guard !didBoot else { return }
        didBoot = true
        OneSignal.Debug.setLogLevel(.LL_WARN)
        OneSignal.initialize(oneSignalAppId, withLaunchOptions: launchOptions)
        OneSignal.Notifications.addClickListener(clickListener)
        OneSignal.User.pushSubscription.optIn()
        UIApplication.shared.registerForRemoteNotifications()
        OneSignal.login(deviceId())
        OneSignal.User.addTags([
            "dar_push": "true",
            "post_notifications": "true",
            "platform": "ios",
            "push_site": "dar-al-tawhid",
            "watch_mirroring": "true"
        ])
        OneSignal.Notifications.requestPermission({ granted in
            DispatchQueue.main.async {
                UIApplication.shared.registerForRemoteNotifications()
                sendLocalWelcomeIfNeeded()
                if granted {
                    syncWithServerThenScheduleLocalFallback()
                }
            }
        }, fallbackToSettings: true)
        #endif
    }

    static func showTest(title: String, body: String, type: String, prayer: String = "dhuhr", mode: String = "entry") {
        let content = UNMutableNotificationContent()
        content.title = title.isEmpty ? "[Test] DAR AL TAWḤĪD" : title
        content.body = body.isEmpty ? "Test-Benachrichtigung. Wenn du das siehst, sind Mitteilungen aktiv." : body
        content.sound = .default
        content.userInfo = ["dar": type, "type": type]
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 0.4, repeats: false)
        UNUserNotificationCenter.current().add(
            UNNotificationRequest(identifier: "dar.test.\(UUID().uuidString)", content: content, trigger: trigger)
        )
        Task {
            #if !targetEnvironment(macCatalyst)
            let sub = await waitForSubscriptionId() ?? lastSubscriptionId()
            guard !sub.isEmpty else { return }
            UserDefaults.standard.set(sub, forKey: lastSubKey)
            _ = await postJSON("\(workerURL)/api/prayer/test", body: [
                "subscriptionId": sub,
                "prayer": prayer.isEmpty ? "dhuhr" : prayer,
                "mode": mode.isEmpty ? "entry" : mode,
                "advanceMinutes": "0"
            ])
            #endif
        }
    }

    static func syncWithServerThenScheduleLocalFallback() {
        Task {
            let registered = await registerWithDarPushPipeline()
            await MainActor.run {
                NotificationCenter.default.post(name: .darNativePushReady, object: nil)
                sendLocalWelcomeIfNeeded()
                scheduleJummahLocal()
                let settings = storedWebSettings()
                let reminderOn = bool(settings["reminder"])
                if registered, reminderOn {
                    cancelLocalPrayers()
                } else if reminderOn {
                    reschedulePrayers()
                } else {
                    cancelLocalPrayers()
                }
            }
        }
    }

    static func reschedulePrayers() {
        let settings = storedWebSettings()
        scheduleJummahLocal()
        guard bool(settings["reminder"]) else {
            cancelLocalPrayers()
            return
        }
        if let sub = UserDefaults.standard.string(forKey: lastSubKey), !sub.isEmpty {
            cancelLocalPrayers()
            return
        }
        var snap = DarDailyContent.refresh(DarWidgetStore.load())
        if let lat = number(settings["lat"]), let lon = number(settings["lon"]) {
            snap.latitude = lat
            snap.longitude = lon
        }
        DarWidgetStore.save(snap, reload: false)
        let center = UNUserNotificationCenter.current()
        center.getPendingNotificationRequests { pending in
            let stale = pending.filter { $0.identifier.hasPrefix(prayerPrefix) }.map(\.identifier)
            center.removePendingNotificationRequests(withIdentifiers: stale)
            schedulePrayers(from: snap)
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
        NotificationCenter.default.post(
            name: .darOpenPush,
            object: nil,
            userInfo: ["type": val("type"), "postId": val("postId").isEmpty ? val("slug") : val("postId"), "url": val("url")]
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

    static func applyWebPrayerSettings(_ raw: [String: Any]) {
        let clean = plistDictionary(raw)
        if PropertyListSerialization.propertyList(clean, isValidFor: .binary) {
            UserDefaults.standard.set(clean, forKey: settingsKey)
        }
        var snap = DarWidgetStore.load()
        if let lat = number(clean["lat"]), let lon = number(clean["lon"]) {
            snap.latitude = lat
            snap.longitude = lon
        }
        if let city = clean["city"] as? String, !city.isEmpty { snap.cityLabel = city }
        if let angle = number(clean["angle"]) { snap.fajrAngle = angle }
        if let asr = number(clean["asrFactor"]) { snap.asrFactor = asr }
        DarWidgetStore.save(DarDailyContent.refresh(snap))
        scheduleJummahLocal()
        Task {
            let ok = await registerWithDarPushPipeline()
            await MainActor.run {
                if ok, bool(clean["reminder"]) {
                    cancelLocalPrayers()
                } else if bool(clean["reminder"]) {
                    reschedulePrayers()
                } else {
                    cancelLocalPrayers()
                }
            }
        }
    }

    /// WKWebView JSON often includes NSNull for lat/lon; UserDefaults rejects that.
    private static func plistDictionary(_ raw: [String: Any]) -> [String: Any] {
        var out: [String: Any] = [:]
        for (key, value) in raw {
            if let nested = plistValue(value) {
                out[key] = nested
            }
        }
        return out
    }

    private static func plistValue(_ value: Any) -> Any? {
        if value is NSNull { return nil }
        if value is String || value is NSNumber || value is Date || value is Data || value is Bool {
            return value
        }
        if let dict = value as? [String: Any] {
            return plistDictionary(dict)
        }
        if let array = value as? [Any] {
            return array.compactMap { plistValue($0) }
        }
        return String(describing: value)
    }

    static func storedWebSettings() -> [String: Any] {
        UserDefaults.standard.dictionary(forKey: settingsKey) ?? [:]
    }

    static func lastSubscriptionId() -> String {
        UserDefaults.standard.string(forKey: lastSubKey) ?? ""
    }

    static func pushToken() -> String {
        #if !targetEnvironment(macCatalyst)
        return OneSignal.User.pushSubscription.token ?? ""
        #else
        return ""
        #endif
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

    private static func registerWithDarPushPipeline() async -> Bool {
        #if targetEnvironment(macCatalyst)
        return false
        #else
        guard let subscriptionId = await waitForSubscriptionId() else { return false }
        UserDefaults.standard.set(subscriptionId, forKey: lastSubKey)
        let token = OneSignal.User.pushSubscription.token
        let settings = storedWebSettings()
        await saveSupabaseRegistration(subscriptionId: subscriptionId, token: token, settings: settings)
        await postJSON("\(workerURL)/api/push/welcome", body: ["subscriptionId": subscriptionId])
        if bool(settings["reminder"]) {
            await postJSON("\(workerURL)/api/prayer/schedule-now", body: ["subscriptionId": subscriptionId])
        }
        let locOk = number(settings["lat"]) != nil && number(settings["lon"]) != nil && bool(settings["locationGranted"] ?? settings["reminder"])
        var tags: [String: String] = [
            "dar_push": "true",
            "post_notifications": "true",
            "platform": "ios",
            "push_site": "dar-al-tawhid",
            "watch_mirroring": "true",
            "daily_dua_notifications": bool(settings["dailyDua"] ?? true) ? "true" : "false",
            "daily_recommendation_notifications": bool(settings["dailyRecommendation"] ?? true) ? "true" : "false",
            "jummah_notifications": bool(settings["jummahNotifications"]) ? "true" : "false",
            "prayer_notifications": bool(settings["reminder"]) && locOk ? "true" : "false"
        ]
        if locOk, let lat = number(settings["lat"]), let lon = number(settings["lon"]) {
            tags["prayer_lat"] = String(format: "%.5f", lat)
            tags["prayer_lon"] = String(format: "%.5f", lon)
            tags["prayer_advance_minutes"] = String(Int(number(settings["advanceMinutes"]) ?? 15))
            tags["prayer_tahajjud_mode"] = String(settings["tahajjudMode"] as? String ?? "off")
        }
        OneSignal.User.addTags(tags)
        return true
        #endif
    }

    private static func saveSupabaseRegistration(subscriptionId: String, token: String?, settings: [String: Any]) async {
        let tz = TimeZone.current.identifier
        let reminder = bool(settings["reminder"])
        let locGranted = bool(settings["locationGranted"]) || reminder
        let lat = number(settings["lat"])
        let lon = number(settings["lon"])
        let hasLoc = locGranted && lat != nil && lon != nil
        let snap = DarWidgetStore.load()
        var body: [String: Any] = [
            "device_id": deviceId(),
            "subscription_id": subscriptionId,
            "timezone": tz.isEmpty ? "Europe/Berlin" : tz,
            "daily_dua_enabled": settings["dailyDua"] == nil ? true : bool(settings["dailyDua"]),
            "daily_recommendation_enabled": settings["dailyRecommendation"] == nil ? true : bool(settings["dailyRecommendation"]),
            "push_opted_in": true,
            "user_agent": "DAR-iOS-native",
            "last_synced_at": ISO8601DateFormatter().string(from: Date()),
            "enabled": reminder && hasLoc,
            "city": (settings["city"] as? String).flatMap { $0.isEmpty ? nil : $0 } ?? snap.cityLabel,
            "method_angle": number(settings["angle"]) ?? 12,
            "asr_factor": number(settings["asrFactor"]) ?? 1,
            "advance_minutes": Int(number(settings["advanceMinutes"]) ?? 15),
            "tahajjud_mode": settings["tahajjudMode"] as? String ?? "off",
            "jummah_notifications": bool(settings["jummahNotifications"]),
            "jummah_use_manual_time": bool(settings["jummahUseManualTime"]),
            "jummah_manual_time": settings["jummahManualTime"] as? String ?? "13:30",
            "jummah_morning_time": settings["jummahMorningTime"] as? String ?? "09:00",
            "jummah_advance_minutes": Int(number(settings["jummahAdvanceMinutes"]) ?? 30)
        ]
        if let token, !token.isEmpty {
            body["push_token"] = token
        } else {
            body["push_token"] = NSNull()
        }
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
        if let existing = UserDefaults.standard.string(forKey: lastSubKey), !existing.isEmpty {
            if let live = OneSignal.User.pushSubscription.id, !live.isEmpty {
                return live
            }
        }
        for _ in 0..<20 {
            if let id = OneSignal.User.pushSubscription.id, !id.isEmpty {
                return id
            }
            try? await Task.sleep(nanoseconds: 250_000_000)
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

    private static func sendLocalWelcomeIfNeeded() {
        if UserDefaults.standard.bool(forKey: welcomeSentKey) { return }
        let content = UNMutableNotificationContent()
        content.title = "As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh"
        content.body = "Willkommen bei DAR AL TAWḤĪD. Neue Beiträge und Gebetszeiten kommen als Mitteilung — auch auf die Apple Watch."
        content.sound = .default
        content.userInfo = ["dar": "welcome", "type": "welcome"]
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 2, repeats: false)
        UNUserNotificationCenter.current().add(
            UNNotificationRequest(identifier: "dar.welcome.v3", content: content, trigger: trigger)
        )
        UserDefaults.standard.set(true, forKey: welcomeSentKey)
    }

    private static func cancelLocalPrayers() {
        UNUserNotificationCenter.current().getPendingNotificationRequests { pending in
            let ids = pending.filter { $0.identifier.hasPrefix(prayerPrefix) }.map(\.identifier)
            UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: ids)
        }
    }

    private static func scheduleJummahLocal() {
        let settings = storedWebSettings()
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: [
            "\(jummahPrefix)khutbah",
            "\(jummahPrefix)morning"
        ])
        guard bool(settings["jummahNotifications"]) else { return }
        let advance = Int(number(settings["jummahAdvanceMinutes"]) ?? 30)
        let khutbah = settings["jummahManualTime"] as? String ?? "13:30"
        let morning = settings["jummahMorningTime"] as? String ?? "09:00"
        enqueueWeekly(
            weekday: 6,
            hhmm: khutbah,
            advanceMinutes: advance,
            id: "\(jummahPrefix)khutbah",
            title: "Jumuʿah",
            body: "Die Freitagsgebetszeit nähert sich."
        )
        enqueueWeekly(
            weekday: 6,
            hhmm: morning,
            advanceMinutes: 0,
            id: "\(jummahPrefix)morning",
            title: "Jumuʿah",
            body: "Heute ist Freitag — gedenke der Jumuʿah."
        )
    }

    private static func enqueueWeekly(weekday: Int, hhmm: String, advanceMinutes: Int, id: String, title: String, body: String) {
        let parts = hhmm.split(separator: ":")
        guard parts.count >= 2, let hour = Int(parts[0]), let minute = Int(parts[1]) else { return }
        var total = hour * 60 + minute - advanceMinutes
        while total < 0 { total += 24 * 60 }
        var comps = DateComponents()
        comps.weekday = weekday
        comps.hour = total / 60
        comps.minute = total % 60
        comps.second = 0
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        content.userInfo = ["dar": "jummah", "type": "jummah"]
        let trigger = UNCalendarNotificationTrigger(dateMatching: comps, repeats: true)
        UNUserNotificationCenter.current().add(UNNotificationRequest(identifier: id, content: content, trigger: trigger))
    }

    private static func schedulePrayers(from snap: DarWidgetSnapshot) {
        let minutes = Int(number(storedWebSettings()["advanceMinutes"]) ?? 15)
        let center = UNUserNotificationCenter.current()
        let now = Date()
        let cal = Calendar.current
        var queued = 0
        for dayOffset in 0..<4 {
            guard let day = cal.date(byAdding: .day, value: dayOffset, to: now) else { continue }
            let slots = DarPrayerEngine.times(for: day, lat: snap.latitude, lng: snap.longitude)
            for slot in slots where slot.id != "sunrise" {
                guard let fire = DarPrayerEngine.date(for: slot, on: day) else { continue }
                if fire > now, queued < 50 {
                    enqueue(slot: slot, fire: fire, advance: false, minutes: minutes, into: center)
                    queued += 1
                }
                let advance = fire.addingTimeInterval(TimeInterval(-minutes * 60))
                if advance > now, queued < 50 {
                    enqueue(slot: slot, fire: advance, advance: true, minutes: minutes, into: center)
                    queued += 1
                }
            }
        }
    }

    private static func enqueue(slot: DarPrayerSlot, fire: Date, advance: Bool, minutes: Int, into center: UNUserNotificationCenter) {
        let content = UNMutableNotificationContent()
        if advance {
            content.title = "\(slot.name) in \(minutes) Min"
            content.body = "\(slot.name) um \(slot.time)."
        } else {
            content.title = "\(slot.name) ist eingetreten"
            content.body = "Es ist Zeit für \(slot.name) (\(slot.time))."
        }
        content.sound = .default
        content.userInfo = ["dar": "prayer", "type": "prayer"]
        var comps = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: fire)
        comps.second = 0
        let trigger = UNCalendarNotificationTrigger(dateMatching: comps, repeats: false)
        let suffix = advance ? "adv" : "on"
        let id = "\(prayerPrefix)\(slot.id).\(suffix).\(comps.year ?? 0)-\(comps.month ?? 0)-\(comps.day ?? 0)"
        center.add(UNNotificationRequest(identifier: id, content: content, trigger: trigger))
    }
}

extension Notification.Name {
    static let darOpenPush = Notification.Name("darOpenPush")
    static let darNativePushReady = Notification.Name("darNativePushReady")
}

#if !targetEnvironment(macCatalyst)
final class DarOneSignalClickListener: NSObject, OSNotificationClickListener {
    func onClick(event: OSNotificationClickEvent) {
        let extra = event.notification.additionalData ?? [:]
        var info: [AnyHashable: Any] = [:]
        extra.forEach { info[$0] = $1 }
        if let type = extra["type"] { info["type"] = type }
        DarPushNotifications.openFromNotification(userInfo: info)
    }
}
#else
final class DarOneSignalClickListener: NSObject {}
#endif
