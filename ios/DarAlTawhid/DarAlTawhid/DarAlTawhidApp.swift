import SwiftUI
import UIKit

final class DarAppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        DarInAppOpenGuard.install()
        DarPushNotifications.bootstrap(launchOptions: launchOptions)
        if let shortcut = launchOptions?[.shortcutItem] as? UIApplicationShortcutItem,
           let destination = shortcutDestination(for: shortcut.type) {
            DarQuickActions.set(destination)
            return false
        }
        return true
    }

    func application(
        _ application: UIApplication,
        performActionFor shortcutItem: UIApplicationShortcutItem,
        completionHandler: @escaping (Bool) -> Void
    ) {
        guard let destination = shortcutDestination(for: shortcutItem.type) else {
            completionHandler(false)
            return
        }
        DarQuickActions.set(destination)
        NotificationCenter.default.post(
            name: .darOpenShortcut,
            object: nil,
            userInfo: ["destination": destination.rawValue]
        )
        completionHandler(true)
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        DarPushNotifications.didRegister(deviceToken: deviceToken)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {}

    private func shortcutDestination(for type: String) -> DarDeepLink.Destination? {
        switch type.lowercased().split(separator: ".").last.map(String.init) {
        case "prayer": return .prayer
        case "qibla": return .qibla
        case "quran": return .quran
        case "duas", "dua": return .duas
        default: return nil
        }
    }
}

extension Notification.Name {
    static let darOpenShortcut = Notification.Name("darOpenShortcut")
}

@main
struct DarAlTawhidApp: App {
    @UIApplicationDelegateAdaptor(DarAppDelegate.self) private var appDelegate
    @StateObject private var router = DarAppRouter()

    init() {
        let bootInk = UIColor(red: 0.02, green: 0.02, blue: 0.01, alpha: 1.0)
        UIWindow.appearance().backgroundColor = bootInk
        let snap = DarDailyContent.refresh(DarWidgetStore.load())
        DarWidgetStore.save(snap)
        Task.detached {
            let live = DarDailyContent.refresh(DarWidgetStore.load(), fetchLiveDaily: true)
            DarWidgetStore.save(live)
        }
    }

    var body: some Scene {
        WindowGroup {
            WebAppView(destination: router.destination, openURL: router.webURL, openNonce: router.openNonce)
                .ignoresSafeArea()
                .background(Color(red: 0.02, green: 0.02, blue: 0.01))
                .onOpenURL { url in
                    router.open(url)
                }
                .onAppear {
                    router.openPendingQuickAction()
                }
                .onReceive(NotificationCenter.default.publisher(for: .darOpenShortcut)) { note in
                    guard let raw = note.userInfo?["destination"] as? String,
                          let destination = DarDeepLink.Destination(rawValue: raw) else { return }
                    router.openShortcut(destination)
                }
                .onReceive(NotificationCenter.default.publisher(for: .darOpenPush)) { note in
                    let info = note.userInfo ?? [:]
                    router.openPush(
                        type: String(describing: info["type"] ?? ""),
                        postId: String(describing: info["postId"] ?? ""),
                        url: String(describing: info["url"] ?? "")
                    )
                }
        }
        #if os(macOS) || targetEnvironment(macCatalyst)
        .defaultSize(width: 1100, height: 780)
        #endif
        .commands {
            CommandGroup(replacing: .newItem) {}
        }
    }
}
