import Foundation
import UIKit
import UserNotifications

enum DarPushNotifications {
    private static let tokenKey = "dar.push.token"

    static func deviceId() -> String { UIDevice.current.identifierForVendor?.uuidString ?? "" }
    static func lastSubscriptionId() -> String { UserDefaults.standard.string(forKey: tokenKey) ?? "" }
    static func pushToken() -> String { UserDefaults.standard.string(forKey: tokenKey) ?? "" }

    static func bootstrap(launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) {
        UNUserNotificationCenter.current().delegate = DarPushCenter.shared
        requestAuthorization()
    }

    static func requestAuthorization() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
            DispatchQueue.main.async {
                if granted {
                    UIApplication.shared.registerForRemoteNotifications()
                }
                NotificationCenter.default.post(name: .darNativePushReady, object: nil)
                syncPermissionToWeb()
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

    static func syncWithServerThenScheduleLocalFallback() {}

    static func applyWebPrayerSettings(_ body: [String: Any]) {
        requestAuthorization()
    }

    static func showTest(title: String, body: String, type: String, prayer: String, mode: String) {
        requestAuthorization()
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: trigger)
        UNUserNotificationCenter.current().add(request, withCompletionHandler: nil)
    }

    static func openFromNotification(userInfo: [AnyHashable: Any]) {
        NotificationCenter.default.post(
            name: .darOpenPush,
            object: nil,
            userInfo: [
                "type": String(describing: userInfo["type"] ?? ""),
                "postId": String(describing: userInfo["postId"] ?? ""),
                "url": String(describing: userInfo["url"] ?? "")
            ]
        )
    }

    static func didRegister(deviceToken: Data) {
        let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        UserDefaults.standard.set(token, forKey: tokenKey)
        NotificationCenter.default.post(name: .darNativePushReady, object: nil)
    }
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

extension Notification.Name {
    static let darOpenPush = Notification.Name("darOpenPush")
    static let darNativePushReady = Notification.Name("darNativePushReady")
    static let darNativePushPermission = Notification.Name("darNativePushPermission")
}
