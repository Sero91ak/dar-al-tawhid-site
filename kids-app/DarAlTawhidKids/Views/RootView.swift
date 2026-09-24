import SwiftUI

struct RootView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        TabView(selection: $appState.selectedTab) {
            HomeView()
                .tag(KidsTab.today)
                .tabItem {
                    Label("Heute", systemImage: "sun.max.fill")
                }

            StoriesView()
                .tag(KidsTab.stories)
                .tabItem {
                    Label("Geschichten", systemImage: "headphones")
                }

            LearnView()
                .tag(KidsTab.learn)
                .tabItem {
                    Label("Lernen", systemImage: "sparkles")
                }

            ParentsView()
                .tag(KidsTab.parents)
                .tabItem {
                    Label("Eltern", systemImage: "lock.shield.fill")
                }
        }
        .tint(KidsTheme.gold)
    }
}
