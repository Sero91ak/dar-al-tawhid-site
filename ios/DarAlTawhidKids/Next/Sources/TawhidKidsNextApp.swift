import SwiftUI
import UIKit

/// Dedicated simulator-only shell. Shared Kids native bridge remains unchanged.
/// This is the SAFE BASELINE, not a claim that all modules are SwiftUI-native.
@main
struct TawhidKidsNextApp: App {
    init() {
        let canvas = UIColor(red: 12.0 / 255.0, green: 38.0 / 255.0, blue: 54.0 / 255.0, alpha: 1)
        UIWindow.appearance().backgroundColor = canvas
    }

    var body: some Scene {
        WindowGroup {
            KidsRootView()
        }
    }
}
