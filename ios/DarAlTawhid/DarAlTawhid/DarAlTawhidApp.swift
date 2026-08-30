import SwiftUI
import UIKit

@main
struct DarAlTawhidApp: App {
    @StateObject private var router = DarAppRouter()

    init() {
        // Boot surface = loading theme ink until live page theme arrives.
        // Architecture: ThemeBackground ignoresSafeArea; content stays inset in WebAppView.
        UIWindow.appearance().backgroundColor = .black
        let snap = DarDailyContent.refresh(DarWidgetStore.load())
        DarWidgetStore.save(snap)
        Task.detached {
            let live = DarDailyContent.refresh(DarWidgetStore.load(), fetchLiveDaily: true)
            DarWidgetStore.save(live)
        }
    }

    var body: some Scene {
        WindowGroup {
            WebAppView(destination: router.destination)
                .ignoresSafeArea()
                .background(Color.clear)
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
