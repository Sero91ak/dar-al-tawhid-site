import SwiftUI
import UIKit

@main
struct DarAlTawhidKidsApp: App {
    init() {
        let night = UIColor(red: 12 / 255, green: 38 / 255, blue: 54 / 255, alpha: 1)
        UIWindow.appearance().backgroundColor = night
    }

    var body: some Scene {
        WindowGroup {
            KidsRootView()
        }
    }
}
