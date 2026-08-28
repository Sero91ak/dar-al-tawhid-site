import SwiftUI
import WidgetKit
import UIKit
import UserNotifications

final class DarAppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        UNUserNotificationCenter.current().delegate = self
        DarPushNotifications.bootstrap(launchOptions: launchOptions)
        if let item = launchOptions?[.shortcutItem] as? UIApplicationShortcutItem {
            Self.handleShortcut(item)
        }
        return true
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        let dest = DarDeepLink.destination(from: url)
        DarWidgetStore.setPendingDestination(dest)
        NotificationCenter.default.post(
            name: .darOpenPush,
            object: nil,
            userInfo: ["type": dest.rawValue, "postId": "", "url": ""]
        )
        return true
    }

    func application(
        _ application: UIApplication,
        performActionFor shortcutItem: UIApplicationShortcutItem,
        completionHandler: @escaping (Bool) -> Void
    ) {
        Self.handleShortcut(shortcutItem)
        completionHandler(true)
    }

    private static func handleShortcut(_ item: UIApplicationShortcutItem) {
        DarHaptics.play(.medium)
        let dest: DarDeepLink.Destination
        switch item.type {
        case "de.daraltawhid.app.prayer": dest = .prayer
        case "de.daraltawhid.app.qibla": dest = .qibla
        case "de.daraltawhid.app.quran": dest = .quran
        case "de.daraltawhid.app.duas": dest = .duas
        default: dest = .home
        }
        DarWidgetStore.setPendingDestination(dest)
        NotificationCenter.default.post(
            name: .darOpenPush,
            object: nil,
            userInfo: ["type": dest.rawValue, "postId": "", "url": dest.url.absoluteString]
        )
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            DarPushNotifications.syncWithServerThenScheduleLocalFallback()
        }
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .sound, .list])
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        DarPushNotifications.openFromNotification(userInfo: response.notification.request.content.userInfo)
        DarHaptics.play(.selection)
        completionHandler()
    }
}

@main
struct DarAlTawhidApp: App {
    @UIApplicationDelegateAdaptor(DarAppDelegate.self) private var appDelegate
    @Environment(\.scenePhase) private var scenePhase
    @StateObject private var router = DarAppRouter()

    init() {
        // Boot surface = loading theme ink until live page theme arrives.
        // Architecture: ThemeBackground ignoresSafeArea; content stays inset in WebAppView.
        let bootInk = UIColor(red: 0.02, green: 0.02, blue: 0.01, alpha: 1.0)
        UIWindow.appearance().backgroundColor = bootInk
    }

    var body: some Scene {
        WindowGroup {
            WebAppView(destination: router.destination, openURL: router.webURL, openNonce: router.openNonce)
                .ignoresSafeArea() // theme/webview chrome only; content padded via global iOS scaffold CSS
                .background(Color(red: 0.02, green: 0.02, blue: 0.01))
                .onOpenURL { url in
                    router.open(url)
                }
                .onReceive(NotificationCenter.default.publisher(for: .darOpenPush)) { note in
                    let info = note.userInfo ?? [:]
                    router.openPush(
                        type: String(describing: info["type"] ?? ""),
                        postId: String(describing: info["postId"] ?? ""),
                        url: String(describing: info["url"] ?? "")
                    )
                }
                .onAppear {
                    DispatchQueue.main.async {
                        let snap = DarDailyContent.refresh(DarWidgetStore.load())
                        DarWidgetStore.save(snap, reload: false)
                    }
                }
                .onChange(of: scenePhase) { phase in
                    if phase == .active {
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
                            if let pending = DarWidgetStore.consumePendingDestination() {
                                router.destination = pending
                                router.openNonce = UUID()
                            }
                            DarPushNotifications.syncWithServerThenScheduleLocalFallback()
                            WidgetCenter.shared.reloadAllTimelines()
                        }
                    }
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
