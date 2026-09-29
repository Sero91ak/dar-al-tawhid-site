import SwiftUI
import UIKit
import WebKit

struct KidsWebAppView: UIViewRepresentable {
    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []
        configuration.websiteDataStore = .default()
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true

        let bridge = """
        (function(){
          try{
            window.DAR_KIDS_IOS_APP=true;
            window.DAR_IOS_NATIVE_APP=true;
            window.DAR_OFFICIAL_IOS_APP=true;
            var root=document.documentElement;
            if(root){
              root.classList.add("dar-ios-native-app","kids-ios-app");
            }
          }catch(e){}
        })();
        """
        configuration.userContentController.addUserScript(
            WKUserScript(source: bridge, injectionTime: .atDocumentStart, forMainFrameOnly: true)
        )
        let autoplay = """
        (function(){
          function kick(){
            var v=document.getElementById("kidsCinemaV79");
            if(!v)return;
            v.muted=true;
            v.defaultMuted=true;
            v.autoplay=true;
            v.playsInline=true;
            v.setAttribute("muted","");
            v.setAttribute("playsinline","");
            v.setAttribute("webkit-playsinline","");
            var p=v.play();
            if(p&&p.catch)p.catch(function(){});
          }
          kick();
          document.addEventListener("DOMContentLoaded",kick);
          window.addEventListener("load",kick);
          setInterval(kick,300);
        })();
        """
        configuration.userContentController.addUserScript(
            WKUserScript(source: autoplay, injectionTime: .atDocumentEnd, forMainFrameOnly: true)
        )
        configuration.applicationNameForUserAgent = "DarAlTawhidKids-iOS"

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.bounces = false
        webView.allowsBackForwardNavigationGestures = false
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 12 / 255, green: 38 / 255, blue: 54 / 255, alpha: 1)
        webView.scrollView.backgroundColor = webView.backgroundColor
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.alpha = 1
        context.coordinator.loadKidsHome(in: webView)
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        private var hasPresentedInitialPage = false

        private func kickIntroPlayback(_ webView: WKWebView) {
            let js = """
            (function(){
              var v=document.getElementById("kidsCinemaV79");
              if(!v)return;
              v.muted=true;v.defaultMuted=true;v.autoplay=true;v.playsInline=true;
              v.setAttribute("muted","");v.setAttribute("playsinline","");
              var p=v.play();
              if(p&&p.catch)p.catch(function(){});
            })();
            """
            webView.evaluateJavaScript(js, completionHandler: nil)
        }


        func loadKidsHome(in webView: WKWebView) {
            webView.alpha = 1
            hasPresentedInitialPage = false
            webView.load(
                URLRequest(
                    url: KidsAppShell.launchURL,
                    cachePolicy: .reloadIgnoringLocalCacheData,
                    timeoutInterval: 30
                )
            )
        }

        func webView(_ webView: WKWebView, didCommit navigation: WKNavigation!) {
            kickIntroPlayback(webView)
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            kickIntroPlayback(webView)
            guard !hasPresentedInitialPage else { return }
            hasPresentedInitialPage = true
            UIView.animate(
                withDuration: 0.28,
                delay: 0,
                options: [.allowUserInteraction, .beginFromCurrentState, .curveEaseOut]
            ) {
                webView.alpha = 1
            }
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            presentWebView(webView)
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            presentWebView(webView)
        }

        private func presentWebView(_ webView: WKWebView) {
            guard !hasPresentedInitialPage else { return }
            hasPresentedInitialPage = true
            webView.alpha = 1
        }

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
            if scheme == "about" || scheme == "blob" || scheme == "data" {
                decisionHandler(.allow)
                return
            }

            if navigationAction.targetFrame?.isMainFrame == false {
                decisionHandler(.allow)
                return
            }

            if KidsAppShell.isKidsURL(url) {
                decisionHandler(.allow)
                return
            }

            if KidsAppShell.isOwnHost(url) {
                decisionHandler(.cancel)
                loadKidsHome(in: webView)
                return
            }

            if scheme == "tel" || scheme == "mailto" {
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
                return
            }

            // Keep the Kids shell. Do not hand http(s) to Safari.
            decisionHandler(.cancel)
        }

        func webView(
            _ webView: WKWebView,
            createWebViewWith configuration: WKWebViewConfiguration,
            for navigationAction: WKNavigationAction,
            windowFeatures: WKWindowFeatures
        ) -> WKWebView? {
            guard let url = navigationAction.request.url else { return nil }
            if KidsAppShell.isKidsURL(url) || KidsAppShell.isOwnHost(url) {
                webView.load(URLRequest(url: KidsAppShell.inAppURL(from: url), cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 30))
            }
            return nil
        }
    }
}
