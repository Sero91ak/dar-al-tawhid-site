import SwiftUI
import WebKit

struct RootShell: View {
    let environment: AppEnvironment
    let audioEngine: QuranAudioEngine
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
        .environment(audioEngine)
        .safeAreaInset(edge: .bottom, spacing: 8) {
            if audioEngine.currentTrack != nil {
                QuranMiniPlayer(engine: audioEngine)
                    .padding(.horizontal, 12)
            }
        }
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
            Section("Vollständige Originalinhalte · online") {
                NavigationLink {
                    DARNextOriginalWebView(title: "DĀR AL TAWḤĪD", path: "/")
                } label: {
                    Label("Komplette Web-App", systemImage: "globe")
                }
                NavigationLink {
                    DARNextOriginalWebView(title: "Quellen & Nachweise", path: "/q/")
                } label: {
                    Label("Quellen und Originalnachweise", systemImage: "checkmark.seal")
                }
                NavigationLink {
                    DARNextOriginalWebView(title: "Wissensbereich", path: "/lernen/wissen-adab/")
                } label: {
                    Label("Lernbereiche", systemImage: "books.vertical.fill")
                }
                NavigationLink {
                    DARNextOriginalWebView(title: "TAWḤĪD KIDS", path: "/kids/")
                } label: {
                    Label("Kinderinhalte im Web", systemImage: "figure.child")
                }
            }
            Label("Offline-Bibliothek aktiv", systemImage: "internaldrive")
            Label("Gebetszeiten benötigen Standortfreigabe", systemImage: "location")
                .foregroundStyle(.secondary)
        }
        .navigationTitle("Mehr")
    }
}

// Content bridge only: Keep DARNext's native shell and bundled offline material intact.
// This view opens the complete, canonical website content in-app without copying
// private data, publishing to visitors, or changing other Xcode targets.
private struct DARNextOriginalWebView: View {
    let title: String
    let path: String
    @State private var loadingError: String?

    private var contentURL: URL {
        URL(string: "https://dar-al-tawhid.de" + path)!
    }

    var body: some View {
        VStack(spacing: 0) {
            if let loadingError {
                ContentUnavailableView(
                    "Online-Inhalte nicht erreichbar",
                    systemImage: "wifi.exclamationmark",
                    description: Text(loadingError + "\nDeine lokalen DARNext-Bereiche bleiben offline verfügbar.")
                )
            } else {
                DARNextWebsiteContainer(url: contentURL, loadingError: $loadingError)
            }
        }
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
    }
}

private struct DARNextWebsiteContainer: UIViewRepresentable {
    let url: URL
    @Binding var loadingError: String?

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        configuration.websiteDataStore = .default()
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.load(URLRequest(url: url, cachePolicy: .useProtocolCachePolicy, timeoutInterval: 30))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        // Do not reload when SwiftUI updates; retain web navigation and playback.
    }

    final class Coordinator: NSObject, WKNavigationDelegate {
        var parent: DARNextWebsiteContainer

        init(_ parent: DARNextWebsiteContainer) {
            self.parent = parent
        }

        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
        ) {
            guard let destination = navigationAction.request.url else {
                decisionHandler(.cancel)
                return
            }
            if destination.scheme == "https",
               ["dar-al-tawhid.de", "www.dar-al-tawhid.de"].contains(destination.host?.lowercased() ?? "") {
                decisionHandler(.allow)
            } else if navigationAction.navigationType == .linkActivated {
                UIApplication.shared.open(destination)
                decisionHandler(.cancel)
            } else {
                decisionHandler(.cancel)
            }
        }

        func webView(
            _ webView: WKWebView,
            didFailProvisionalNavigation navigation: WKNavigation!,
            withError error: Error
        ) {
            parent.loadingError = error.localizedDescription
        }

        func webView(
            _ webView: WKWebView,
            didFail navigation: WKNavigation!,
            withError error: Error
        ) {
            parent.loadingError = error.localizedDescription
        }
    }
}
