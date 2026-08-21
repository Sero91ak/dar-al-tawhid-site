import SwiftUI
import UIKit

@main
struct DarAlTawhidApp: App {
    init() {
        // Boot surface = loading theme ink until live page theme arrives.
        // Architecture: ThemeBackground ignoresSafeArea; content stays inset in WebAppView.
        let bootInk = UIColor(red: 0.02, green: 0.02, blue: 0.01, alpha: 1.0)
        UIWindow.appearance().backgroundColor = bootInk
    }

    var body: some Scene {
        WindowGroup {
            WebAppView()
                .ignoresSafeArea() // theme/webview chrome only; content padded via global iOS scaffold CSS
                .background(Color(red: 0.02, green: 0.02, blue: 0.01))
        }
    }
}
