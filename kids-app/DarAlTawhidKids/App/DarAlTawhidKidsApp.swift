import SwiftUI

@main
struct DarAlTawhidKidsApp: App {
    @StateObject private var appState = AppState()
    @StateObject private var progress = ProgressStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(appState)
                .environmentObject(progress)
                .preferredColorScheme(.dark)
        }
    }
}
