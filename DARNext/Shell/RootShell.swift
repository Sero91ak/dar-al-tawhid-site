import SwiftUI

struct RootShell: View {
    let environment: AppEnvironment
    @State private var selectedTab = RootTab.start

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                DashboardView(repository: environment.container.contentRepository)
            }
            .tabItem { Label("Start", systemImage: "sparkles") }
            .tag(RootTab.start)

            NavigationStack {
                QuranView(repository: environment.container.contentRepository)
            }
            .tabItem { Label("Qurʾān", systemImage: "book.closed") }
            .tag(RootTab.quran)

            NavigationStack {
                PostsView(repository: environment.container.contentRepository)
            }
            .tabItem { Label("Beiträge", systemImage: "text.alignleft") }
            .tag(RootTab.posts)

            NavigationStack {
                KnowledgeView(repository: environment.container.contentRepository)
            }
            .tabItem { Label("Wissen", systemImage: "graduationcap") }
            .tag(RootTab.knowledge)

            NavigationStack {
                MoreView(repository: environment.container.contentRepository)
            }
            .tabItem { Label("Mehr", systemImage: "ellipsis") }
            .tag(RootTab.more)
        }
        .tint(.white)
    }
}

private enum RootTab: Hashable {
    case start
    case quran
    case posts
    case knowledge
    case more
}

private struct KnowledgeView: View {
    let repository: LocalContentRepository

    var body: some View {
        List {
            NavigationLink("Duʿāʾ") {
                DuaView(repository: repository)
            }
            Label("Quellengebundene Inhalte", systemImage: "checkmark.shield")
                .foregroundStyle(.secondary)
        }
        .navigationTitle("Wissen")
    }
}

private struct MoreView: View {
    let repository: LocalContentRepository

    var body: some View {
        List {
            NavigationLink {
                SearchView(repository: repository)
            } label: {
                Label("Globale Suche", systemImage: "magnifyingglass")
            }
            NavigationLink {
                LibraryView(repository: repository)
            } label: {
                Label("Bibliothek", systemImage: "books.vertical")
            }
            NavigationLink {
                QuizView(repository: repository)
            } label: {
                Label("Wissensquiz", systemImage: "questionmark.circle")
            }
            Label("Offline-Bibliothek aktiv", systemImage: "internaldrive")
            Label("Gebetszeiten benötigen Standortfreigabe", systemImage: "location")
                .foregroundStyle(.secondary)
        }
        .navigationTitle("Mehr")
    }
}
