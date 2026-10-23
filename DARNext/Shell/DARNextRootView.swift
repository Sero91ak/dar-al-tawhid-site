import SwiftUI

struct DARNextRootView: View {
    let environment: AppEnvironment

    var body: some View {
        RootShell(environment: environment)
            .environment(\.darTheme, .premium)
    }
}
