import SwiftUI
import UIKit

final class DarAppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        DarInAppOpenGuard.install()
        DarPushNotifications.bootstrap(launchOptions: launchOptions)
        return true
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        DarPushNotifications.didRegister(deviceToken: deviceToken)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {}
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
