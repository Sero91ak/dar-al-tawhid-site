// onesignal:managed v1 — TAWḤĪD KIDS only; never initialize the adults' OneSignal app.
import Foundation
import UIKit
import LocalAuthentication
import OneSignalFramework

final class KidsPushAppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        KidsPushNotifications.bootstrap(launchOptions: launchOptions)
        return true
    }
}

enum KidsPushNotifications {
    static let appID = "f8d837a0-406a-4a8a-8c6a-e0c2f8bc2766"
    private static let parentOptInKey = "dar.kids.push.parent.enabled.v1"
    private static let preferencesKey = "dar.kids.push.parent.settings.v1"
    private static let ageGroupKey = "dar.kids.push.parent.age.v1"
    private static var didBootstrap = false
    private static let clickListener = KidsPushClickListener()

    static var parentEnabled: Bool {
        UserDefaults.standard.bool(forKey: parentOptInKey)
    }

    static func bootstrap(launchOptions: [UIApplication.LaunchOptionsKey: Any]?) {
        #if KIDS_CREATOR_TEST
        // The creator/test app has a different bundle identifier. Do not use
        // production OneSignal or register this test installation with APNs.
        return
        #else
        guard !didBootstrap else { return }
        didBootstrap = true
        OneSignal.initialize(appID, withLaunchOptions: launchOptions)
        OneSignal.Notifications.addClickListener(clickListener)
        if !parentEnabled {
            OneSignal.User.pushSubscription.optOut()
        }
        // Parent opt-in is per installation and can be revoked at any time.
        refreshTags()
        #endif
    }

    static func requestParentActivation(_ completion: @escaping (Bool) -> Void) {
        #if KIDS_CREATOR_TEST
        completion(false)
        #else
        // No permission prompt at app start. Require a deliberate parental
        // action and device-owner authentication first.
        let context = LAContext()
        var error: NSError?
        guard context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error) else {
            completion(false)
            return
        }
        context.evaluatePolicy(
            .deviceOwnerAuthentication,
            localizedReason: "Als Erziehungsberechtigte(r) TAWḤĪD KIDS-Benachrichtigungen freigeben"
        ) { approved, _ in
            DispatchQueue.main.async {
                guard approved else {
                    completion(false)
                    return
                }
                OneSignal.Notifications.requestPermission({ granted in
                    DispatchQueue.main.async {
                        UserDefaults.standard.set(granted, forKey: parentOptInKey)
                        if granted {
                            OneSignal.User.pushSubscription.optIn()
                        } else {
                            OneSignal.User.pushSubscription.optOut()
                        }
                        refreshTags()
                        completion(granted)
                    }
                }, fallbackToSettings: true)
            }
        }
        #endif
    }

    static func revokeParentActivation() {
        UserDefaults.standard.set(false, forKey: parentOptInKey)
        #if !KIDS_CREATOR_TEST
        OneSignal.User.pushSubscription.optOut()
        refreshTags()
        #endif
    }

    static func applyParentPreferences(_ values: [String: Any], ageGroup: String) {
        guard parentEnabled else { return }
        var settings: [String: Bool] = [:]
        for channel in ["prayer", "learning", "quiz", "content"] {
            settings[channel] = values[channel] as? Bool == true
        }
        UserDefaults.standard.set(settings, forKey: preferencesKey)
        let allowed = ["4–5", "6–8", "9–10"]
        UserDefaults.standard.set(allowed.contains(ageGroup) ? ageGroup : "unset", forKey: ageGroupKey)
        refreshTags()
    }

    private static func refreshTags() {
        #if !KIDS_CREATOR_TEST
        let consent = parentEnabled
        let settings = UserDefaults.standard.dictionary(forKey: preferencesKey) as? [String: Bool] ?? [:]
        let age = UserDefaults.standard.string(forKey: ageGroupKey) ?? "unset"
        let flag = { (key: String) -> String in
            consent && settings[key] == true ? "yes" : "no"
        }
        OneSignal.User.addTags([
            "dar_kids": "true",
            "dar_client": "native_ios",
            "kids_parent_push_consent": consent ? "yes" : "no",
            "kids_prayer_push": flag("prayer"),
            "kids_learning_push": flag("learning"),
            "kids_quiz_push": flag("quiz"),
            "kids_content_push": flag("content"),
            "kids_age": age
        ])
        #endif
    }
}

final class KidsPushClickListener: NSObject, OSNotificationClickListener {
    func onClick(event: OSNotificationClickEvent) {
        let data = event.notification.additionalData ?? [:]
        let candidate = (data["url"] as? String)
            ?? event.result.url
            ?? event.notification.launchURL
        guard let urlString = candidate,
              let url = URL(string: urlString),
              KidsAppShell.isKidsURL(url) else { return }
        DispatchQueue.main.async {
            NotificationCenter.default.post(
                name: .kidsOpenPush,
                object: url
            )
        }
    }
}

extension Notification.Name {
    static let kidsOpenPush = Notification.Name("darKidsOpenPush")
}
