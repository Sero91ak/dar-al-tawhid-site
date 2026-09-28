import SwiftUI
import WebKit

enum KidsAppShell {
    static let hosts: Set<String> = ["dar-al-tawhid.de", "www.dar-al-tawhid.de"]
    static let launchURL = URL(string: "https://dar-al-tawhid.de/test/kids/start")!

    static func isKidsURL(_ url: URL) -> Bool {
        guard let host = url.host?.lowercased(), hosts.contains(host) else { return false }
        let path = url.path
        return path == "/test/kids" || path.hasPrefix("/test/kids/")
    }
}

struct KidsWebView: UIViewRepresentable {
    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.defaultWebpagePreferences.allowsContentJavaScript = true
        if #available(iOS 15.0, *) {
            config.limitsNavigationsToAppBoundDomains = false
        }

        let controller = WKUserContentController()
        controller.addUserScript(
            WKUserScript(
                source: """
                (function(){
                  try{
                    window.DAR_KIDS_IOS_NATIVE_APP=true;
                    window.DAR_IOS_NATIVE_APP=true;
                    var root=document.documentElement;
                    if(root){root.classList.add("dar-kids-ios-native-app","dar-ios-native-app")}
                  }catch(e){}
                })();
                """,
                injectionTime: .atDocumentStart,
                forMainFrameOnly: true
            )
        )
        config.userContentController = controller
        config.applicationNameForUserAgent = "DarAlTawhidKids-iOS"

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.bounces = false
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 12 / 255, green: 38 / 255, blue: 54 / 255, alpha: 1)
        webView.load(URLRequest(url: KidsAppShell.launchURL, cachePolicy: .useProtocolCachePolicy, timeoutInterval: 30))
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
        ) {
            guard let url = navigationAction.request.url else {
                decisionHandler(.cancel)
                return
            }
            let scheme = url.scheme?.lowercased() ?? ""
            if scheme == "http" || scheme == "https" {
                if KidsAppShell.isKidsURL(url) || KidsAppShell.hosts.contains(url.host?.lowercased() ?? "") {
                    if KidsAppShell.isKidsURL(url) {
                        decisionHandler(.allow)
                        return
                    }
                    // Stay in the Kids shell; do not open the adult site in this app.
                    if url.path.hasPrefix("/test/kids") {
                        decisionHandler(.allow)
                        return
                    }
                    decisionHandler(.cancel)
                    webView.load(URLRequest(url: KidsAppShell.launchURL))
                    return
                }
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
                return
            }
            if scheme == "tel" || scheme == "mailto" {
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
                return
            }
            decisionHandler(.allow)
        }

        func webView(
            _ webView: WKWebView,
            createWebViewWith configuration: WKWebViewConfiguration,
            for navigationAction: WKNavigationAction,
            windowFeatures: WKWindowFeatures
        ) -> WKWebView? {
            if let url = navigationAction.request.url {
                if KidsAppShell.isKidsURL(url) {
                    webView.load(URLRequest(url: url))
                } else {
                    UIApplication.shared.open(url)
                }
            }
            return nil
        }
    }
}
