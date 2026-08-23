import SwiftUI
import UIKit

@main
struct DarAlTawhidApp: App {
    @StateObject private var router = DarAppRouter()

    init() {
        // Boot surface = loading theme ink until live page theme arrives.
        // Architecture: ThemeBackground ignoresSafeArea; content stays inset in WebAppView.
        let bootInk = UIColor(red: 0.02, green: 0.02, blue: 0.01, alpha: 1.0)
        UIWindow.appearance().backgroundColor = bootInk
        let snap = DarDailyContent.refresh(DarWidgetStore.load())
        DarWidgetStore.save(snap)
    }

    var body: some Scene {
        WindowGroup {
            WebAppView(destination: router.destination)
                .ignoresSafeArea() // theme/webview chrome only; content padded via global iOS scaffold CSS
                .background(Color(red: 0.02, green: 0.02, blue: 0.01))
                .onOpenURL { url in
                    router.open(url)
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
