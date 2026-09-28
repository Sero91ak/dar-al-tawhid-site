import SwiftUI

@main
struct DarAlTawhidKidsApp: App {
    init() {
        UIWindow.appearance().backgroundColor = UIColor(red: 12 / 255, green: 38 / 255, blue: 54 / 255, alpha: 1)
    }

    var body: some Scene {
        WindowGroup {
            KidsWebView()
                .ignoresSafeArea()
                .background(Color(red: 12 / 255, green: 38 / 255, blue: 54 / 255))
        }
    }
}
