import SwiftUI

struct RootShell: View {
    let environment: AppEnvironment
    let audioEngine: QuranAudioEngine

    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    @AppStorage("darnext.appearanceMode") private var appearanceModeRawValue = DARAppearanceMode.nightLibrary.rawValue
    @State private var selectedTab = DARNextTab.start

    private var appearanceMode: DARAppearanceMode {
        DARAppearanceMode(rawValue: appearanceModeRawValue) ?? .nightLibrary
    }

    var body: some View {
        Group {
            if horizontalSizeClass == .regular {
                DARNextRegularShell(
                    environment: environment,
                    audioEngine: audioEngine,
                    selectedTab: $selectedTab
                )
            } else {
                DARNextPhoneShell(
                    environment: environment,
                    audioEngine: audioEngine,
                    selectedTab: $selectedTab
                )
            }
        }
        .environment(\.darTheme, appearanceMode.theme)
        .tint(appearanceMode.theme.antiqueGold)
        .onOpenURL { url in
            switch DARNextDeepLinkDestination.from(url) {
            case .quran:
                selectedTab = .quran
            case .more:
                selectedTab = .more
            case .home:
                selectedTab = .start
            }
        }
    }
}

private struct DARNextPhoneShell: View {
    let environment: AppEnvironment
    let audioEngine: QuranAudioEngine
    @Binding var selectedTab: DARNextTab

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                DashboardView(repository: environment.container.contentRepository)
            }
            .tabItem { Label("Start", systemImage: "sparkles") }
            .tag(DARNextTab.start)

            NavigationStack {
                QuranView(repository: environment.container.contentRepository)
            }
            .tabItem { Label("Qurʾān", systemImage: "book.closed.fill") }
            .tag(DARNextTab.quran)

            NavigationStack {
                PostsView(repository: environment.container.contentRepository)
            }
            .tabItem { Label("Beiträge", systemImage: "text.book.closed.fill") }
            .tag(DARNextTab.posts)

            NavigationStack {
                DashboardAssistantView(repository: environment.container.contentRepository)
            }
            .tabItem { Label("AI", systemImage: "sparkles") }
            .tag(DARNextTab.assistant)

            NavigationStack {
                MoreView(repository: environment.container.contentRepository)
            }
            .tabItem { Label("Mehr", systemImage: "ellipsis") }
            .tag(DARNextTab.more)
        }
        .environment(audioEngine)
        .safeAreaInset(edge: .bottom, spacing: 8) {
            DARNextMiniPlayer(audioEngine: audioEngine)
        }
    }
}

private struct DARNextRegularShell: View {
    let environment: AppEnvironment
    let audioEngine: QuranAudioEngine
    @Binding var selectedTab: DARNextTab

    var body: some View {
        NavigationSplitView {
            List {
                ForEach(DARNextTab.allCases) { tab in
                    Button {
                        selectedTab = tab
                    } label: {
                        Label(tab.title, systemImage: tab.systemImage)
                            .foregroundStyle(.primary)
                    }
                    .buttonStyle(.plain)
                }
            }
            .navigationTitle("DĀR AL TAWḤĪD")
            .scrollContentBackground(.hidden)
        } detail: {
            NavigationStack {
                DARNextDestination(
                    tab: selectedTab,
                    repository: environment.container.contentRepository
                )
            }
        }
        .environment(audioEngine)
        .safeAreaInset(edge: .bottom, spacing: 8) {
            DARNextMiniPlayer(audioEngine: audioEngine)
        }
    }
}

private struct DARNextDestination: View {
    let tab: DARNextTab
    let repository: LocalContentRepository

    @ViewBuilder
    var body: some View {
        switch tab {
        case .start:
            DashboardView(repository: repository)
        case .quran:
            QuranView(repository: repository)
        case .posts:
            PostsView(repository: repository)
        case .assistant:
            DashboardAssistantView(repository: repository)
        case .more:
            MoreView(repository: repository)
        }
    }
}

private struct DARNextMiniPlayer: View {
    let audioEngine: QuranAudioEngine

    var body: some View {
        if audioEngine.currentTrack != nil {
            QuranMiniPlayer(engine: audioEngine)
                .padding(.horizontal, 12)
        }
    }
}

private enum DARNextTab: Hashable, CaseIterable, Identifiable {
    case start
    case quran
    case posts
    case assistant
    case more

    var id: Self { self }

    var title: String {
        switch self {
        case .start: "Start"
        case .quran: "Qurʾān"
        case .posts: "Beiträge"
        case .assistant: "AI"
        case .more: "Mehr"
        }
    }

    var systemImage: String {
        switch self {
        case .start: "sparkles"
        case .quran: "book.closed.fill"
        case .posts: "text.book.closed.fill"
        case .assistant: "sparkles"
        case .more: "ellipsis"
        }
    }
}

private struct MoreView: View {
    let repository: LocalContentRepository

    @Environment(\.darTheme) private var theme
    @AppStorage("darnext.appearanceMode") private var appearanceModeRawValue = DARAppearanceMode.nightLibrary.rawValue

    private var appearanceMode: DARAppearanceMode {
        DARAppearanceMode(rawValue: appearanceModeRawValue) ?? .nightLibrary
    }

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 14) {
                NavigationLink {
                    IslamicHubView(repository: repository)
                } label: {
                    moreCard(
                        title: "Islamische Bereiche",
                        subtitle: "Duʿāʾ, Quiz, Bibliothek, Suche und weitere Module",
                        systemImage: "moon.stars.fill",
                        tint: theme.gold
                    )
                }
                .buttonStyle(.plain)

                NavigationLink {
                    DuaView(repository: repository)
                } label: {
                    moreCard(
                        title: "Duʿāʾ",
                        subtitle: "Überlieferte Bittgebete mit Arabisch und Bedeutung",
                        systemImage: "hands.sparkles.fill",
                        tint: theme.emerald
                    )
                }
                .buttonStyle(.plain)

                NavigationLink {
                    LibraryView(repository: repository)
                } label: {
                    moreCard(
                        title: "Bibliothek",
                        subtitle: "Verifizierte Bücher und Publikationen",
                        systemImage: "books.vertical.fill",
                        tint: .indigo
                    )
                }
                .buttonStyle(.plain)

                NavigationLink {
                    QuizView(repository: repository)
                } label: {
                    moreCard(
                        title: "Wissensquiz",
                        subtitle: "Freigegebene Fragen zum Lernen",
                        systemImage: "questionmark.circle.fill",
                        tint: .purple
                    )
                }
                .buttonStyle(.plain)

                NavigationLink {
                    SearchView(repository: repository)
                } label: {
                    moreCard(
                        title: "Globale Suche",
                        subtitle: "Qurʾān, Beiträge, Duʿāʾ und Bibliothek",
                        systemImage: "magnifyingglass",
                        tint: .blue
                    )
                }
                .buttonStyle(.plain)

                appearanceCard
            }
            .padding(.horizontal, 18)
            .padding(.top, 14)
            .padding(.bottom, 110)
        }
        .scrollIndicators(.hidden)
        .background(theme.backgroundGradient.ignoresSafeArea())
        .navigationTitle("Mehr")
        .toolbarColorScheme(.dark, for: .navigationBar)
    }

    private var appearanceCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Erscheinungsbild", systemImage: "circle.lefthalf.filled")
                .font(.headline)
                .foregroundStyle(theme.cream)

            Picker("Erscheinungsbild", selection: $appearanceModeRawValue) {
                ForEach(DARAppearanceMode.allCases) { mode in
                    Text(mode.title).tag(mode.rawValue)
                }
            }
            .pickerStyle(.menu)
            .tint(theme.goldLight)
            .accessibilityLabel("DARNext Erscheinungsbild")
        }
        .padding(16)
        .background(.white.opacity(0.065), in: RoundedRectangle(cornerRadius: 22, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .strokeBorder(.white.opacity(0.11), lineWidth: 1)
        }
    }

    private func moreCard(title: String, subtitle: String, systemImage: String, tint: Color) -> some View {
        HStack(spacing: 14) {
            Image(systemName: systemImage)
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(.white)
                .frame(width: 48, height: 48)
                .background(tint.opacity(0.82), in: Circle())

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                    .foregroundStyle(theme.cream)
                Text(subtitle)
                    .font(.subheadline)
                    .foregroundStyle(theme.secondaryText)
                    .lineLimit(2)
            }

            Spacer()
            Image(systemName: "chevron.right")
                .font(.caption.weight(.bold))
                .foregroundStyle(theme.secondaryText)
        }
        .padding(16)
        .background(.white.opacity(0.065), in: RoundedRectangle(cornerRadius: 22, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .strokeBorder(.white.opacity(0.11), lineWidth: 1)
        }
    }
}
