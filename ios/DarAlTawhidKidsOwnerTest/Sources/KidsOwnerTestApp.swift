import SwiftUI
import WebKit
import SafariServices

private enum OwnerTestConfig {
    static let host = "dar-al-tawhid-kids-owner-test.sero91ak.workers.dev"
    static let launchURL = URL(string: "https://dar-al-tawhid-kids-owner-test.sero91ak.workers.dev/kids/start")!
    static func isAllowed(_ url: URL) -> Bool {
        url.scheme?.lowercased() == "https" &&
        url.host?.lowercased() == host &&
        (url.path == "/kids" || url.path.hasPrefix("/kids/") ||
         url.path.hasPrefix("/quran-audio/") ||
         url.path.hasPrefix("/desktop-preview/assets/kids-academy-"))
    }
}

@main
struct KidsOwnerTestApp: App {
    var body: some Scene {
        WindowGroup { OwnerTestLoginView() }
    }
}

struct OwnerTestLoginView: View {
    @State private var username = ""
    @State private var password = ""
    @State private var loggedIn = false
    @State private var errorText: String?

    var body: some View {
        ZStack {
            Color(red: 0.035, green: 0.14, blue: 0.19).ignoresSafeArea()
            if loggedIn {
                VStack(spacing: 0) {
                    HStack {
                        Label("KIDS · ERSTELLER TEST", systemImage: "checkmark.shield")
                            .font(.caption.bold()).foregroundStyle(.yellow)
                        Spacer()
                        Button("Abmelden") {
                            loggedIn = false
                            password = ""
                            errorText = nil
                        }.font(.caption)
                    }
                    .padding(.horizontal, 16).padding(.vertical, 8)
                    .background(Color(red: 0.07, green: 0.21, blue: 0.25))
                    OwnerKidsWebView(username: username, password: password) { reason in
                        errorText = reason
                    }
                    if let errorText {
                        Text(errorText).font(.caption).foregroundStyle(.orange)
                            .padding(8)
                    }
                }
            } else {
                VStack(spacing: 18) {
                    Image(systemName: "shield.lefthalf.filled")
                        .font(.system(size: 44)).foregroundStyle(.yellow)
                    Text("TAWḤĪD KIDS TEST").font(.title2.bold())
                    Text("Geschützter Erstellerzugang. Getrennt von der Kinder-App.")
                        .multilineTextAlignment(.center).foregroundStyle(.white.opacity(0.75))
                    TextField("Ersteller-Benutzername", text: $username)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .textContentType(.username)
                        .padding(13).background(.white.opacity(0.1))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    SecureField("Test-Passwort", text: $password)
                        .textContentType(.password)
                        .padding(13).background(.white.opacity(0.1))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    Button("Test-App öffnen") { loggedIn = true }
                        .buttonStyle(.borderedProminent)
                        .disabled(username.isEmpty || password.isEmpty)
                }
                .foregroundStyle(.white)
                .padding(24)
                .frame(maxWidth: 440)
            }
        }
    }
}

private struct OwnerKidsWebView: UIViewRepresentable {
    let username: String
    let password: String
    let onError: (String) -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator(username: username, password: password, onError: onError)
    }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.allowsInlineMediaPlayback = true
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        configuration.applicationNameForUserAgent = "DarAlTawhidKidsOwnerTest-iOS"
        let web = WKWebView(frame: .zero, configuration: configuration)
        web.navigationDelegate = context.coordinator
        web.isOpaque = true
        web.backgroundColor = UIColor(red: 9/255, green: 37/255, blue: 48/255, alpha: 1)
        web.load(URLRequest(url: OwnerTestConfig.launchURL,cachePolicy:.reloadIgnoringLocalCacheData))
        return web
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate {
        private let username: String
        private let password: String
        private let onError: (String) -> Void

        init(username: String, password: String, onError: @escaping (String) -> Void) {
            self.username = username
            self.password = password
            self.onError = onError
        }

        func webView(_ webView: WKWebView, didReceive challenge: URLAuthenticationChallenge,
                     completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
            guard challenge.protectionSpace.host.lowercased() == OwnerTestConfig.host,
                  challenge.protectionSpace.authenticationMethod == NSURLAuthenticationMethodHTTPBasic
            else {
                completionHandler(.performDefaultHandling, nil)
                return
            }
            if challenge.previousFailureCount > 0 {
                onError("Zugangsdaten wurden abgelehnt. Bitte abmelden und erneut anmelden.")
                completionHandler(.cancelAuthenticationChallenge, nil)
                return
            }
            completionHandler(.useCredential,
                              URLCredential(user: username, password: password, persistence: .forSession))
        }

        func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = action.request.url else {
                decisionHandler(.cancel); return
            }
            if OwnerTestConfig.isAllowed(url) {
                decisionHandler(.allow)
            } else {
                // No silent fallback to live. External content opens outside the app.
                decisionHandler(.cancel)
                if url.scheme == "https" {
                    DispatchQueue.main.async { UIApplication.shared.open(url) }
                }
            }
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!,
                     withError error: Error) {
            onError("Testseite konnte nicht geladen werden: " + error.localizedDescription)
        }
    }
}
