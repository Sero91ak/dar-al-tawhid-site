import SwiftUI

struct DARNextRootView: View {
    let environment: AppEnvironment

    var body: some View {
        RootShell(environment: environment, audioEngine: environment.audioEngine)
            .environment(\.darTheme, .premium)
            .task {
                await environment.refreshContentManifest()
            }
    }
}
