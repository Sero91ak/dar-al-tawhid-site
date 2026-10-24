import SwiftUI

@main
struct DARNextApp: App {
    @State private var environment = AppEnvironment()

    var body: some Scene {
        WindowGroup {
            DARNextRootView(environment: environment)
        }
    }
}
