import SwiftUI
import UIKit
import WebKit
import PDFKit

final class InsetAwareWebView: WKWebView {
    var onInsetsChange: (() -> Void)?

    override func safeAreaInsetsDidChange() {
        super.safeAreaInsetsDidChange()
        onInsetsChange?()
    }
}

final class GradientBackdropView: UIView {
    override class var layerClass: AnyClass { CAGradientLayer.self }

    private var gradientLayer: CAGradientLayer {
        layer as! CAGradientLayer
    }

    override init(frame: CGRect) {
        super.init(frame: frame)
        gradientLayer.startPoint = CGPoint(x: 0.5, y: 0.0)
        gradientLayer.endPoint = CGPoint(x: 0.5, y: 1.0)
        gradientLayer.locations = [0.0, 0.22, 0.62, 1.0]
        let boot = UIColor(red: 0.02, green: 0.02, blue: 0.01, alpha: 1.0)
        updateColors(top: boot, mid: boot, bottom: boot)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    func updateColors(top: UIColor, mid: UIColor? = nil, bottom: UIColor) {
        // Theme-only gradient: no foreign navy/blue blend tints.
        let resolvedMid = mid ?? blendedColor(from: top, to: bottom, ratio: 0.45)
        gradientLayer.startPoint = CGPoint(x: 0.5, y: 0.0)
        gradientLayer.endPoint = CGPoint(x: 0.5, y: 1.0)
        gradientLayer.locations = [0.0, 0.22, 0.62, 1.0]
        gradientLayer.colors = [
            top.cgColor,
            top.cgColor,
            resolvedMid.cgColor,
            bottom.cgColor
        ]
    }

    private func blendedColor(from: UIColor, to: UIColor, ratio: CGFloat) -> UIColor {
        var fromRed: CGFloat = 0
        var fromGreen: CGFloat = 0
        var fromBlue: CGFloat = 0
        var fromAlpha: CGFloat = 0
        var toRed: CGFloat = 0
        var toGreen: CGFloat = 0
        var toBlue: CGFloat = 0
        var toAlpha: CGFloat = 0
        guard from.getRed(&fromRed, green: &fromGreen, blue: &fromBlue, alpha: &fromAlpha),
              to.getRed(&toRed, green: &toGreen, blue: &toBlue, alpha: &toAlpha) else {
            return from
        }
        let clampedRatio = min(1, max(0, ratio))
        return UIColor(
            red: fromRed + (toRed - fromRed) * clampedRatio,
            green: fromGreen + (toGreen - fromGreen) * clampedRatio,
            blue: fromBlue + (toBlue - fromBlue) * clampedRatio,
            alpha: fromAlpha + (toAlpha - fromAlpha) * clampedRatio
        )
    }
}

struct WebAppView: UIViewRepresentable {
    var destination: DarDeepLink.Destination? = nil

    private enum AppEnvironment {
        case staging
        case live
    }

    // Always the visitor app (live). Staging/test is not used for this Xcode wrapper.
    private static let environment: AppEnvironment = .live
    private static let stagingURL = URL(string: "https://dar-al-tawhid.de/test/?env=staging&source=ios-testflight#home")!
    private static let liveURL = URL(string: "https://dar-al-tawhid.de/#home")!
    private static let launchURL: URL = {
        switch environment {
        case .staging:
            return stagingURL
        case .live:
            return liveURL
        }
    }()
    private static let allowedHosts: Set<String> = [
        "dar-al-tawhid.de",
        "www.dar-al-tawhid.de"
    ]

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> UIView {
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        // Do not wipe WKWebsiteDataStore on launch — that cancels/breaks the first page load.
        let userContentController = WKUserContentController()
        userContentController.add(context.coordinator, name: "darLibraryReader")
        userContentController.add(context.coordinator, name: "darAppearance")
        userContentController.add(context.coordinator, name: "darWidgetSnapshot")
        let iosNativeTabsBoot = """
        (function(){
          try{
            var root=document.documentElement;
            if(!root)return;
            root.classList.add("dar-ios-native-app");
            root.classList.add("dar-ios-native-tabs");
            root.classList.remove("dar-soft-booting");
          }catch(e){}
        })();
        """
        userContentController.addUserScript(
            WKUserScript(
                source: iosNativeTabsBoot,
                injectionTime: .atDocumentStart,
                forMainFrameOnly: true
            )
        )
        let iosViewportPolish = """
        (function(){
          if(window.__darIosViewportPolishInstalled)return;
          window.__darIosViewportPolishInstalled=true;
          window.__DAR_IOS_BUILD__="0.22-web-parity-v665";
          /* Web assets (full-edge-appearance-polish + parity force + soft-boot) own layout.
             iOS only supplies native safe-area vars, compact layout, and status-bar top inset. */
          function cssText(){
            return [
              "html.dar-ios-native-app{",
              "  --dar-ios-theme-bg:var(--theme-page-bg,var(--theme-feed-bg,var(--quran-page-bg,var(--outer-bg-flat,var(--bg,#050504)))));",
              "}",
              "html.dar-ios-native-app #dar-soft-boot{display:none!important;visibility:hidden!important;}",
              "html.dar-ios-native-app.dar-soft-booting,",
              "html.dar-ios-native-app.dar-soft-booting body{overflow:visible!important;}",
              "html.dar-ios-native-app #bottomNav,",
              "html.dar-ios-native-app #bottomNav.bottom-nav,",
              "html.dar-ios-native-app .bottom-nav,",
              "html.dar-ios-native-app #appChromeDock #bottomNav.bottom-nav,",
              "html.dar-ios-native-app.dar-soft-booting #bottomNav,",
              "html.dar-ios-native-app.dar-soft-booting .bottom-nav,",
              "html.dar-ios-native-app.dar-soft-booting .home-discover,",
              "html.dar-ios-native-app.dar-soft-booting .home-v380{",
              "  visibility:visible!important;",
              "  opacity:1!important;",
              "  pointer-events:auto!important;",
              "  display:flex!important;",
              "}",
              "html.dar-ios-native-app body.is-home-route,",
              "html.dar-ios-native-app body.is-area-route:not(.is-feed-fullscreen),",
              "html.dar-ios-native-app body.is-more-route,",
              "html.dar-ios-native-app body.is-quiz-route{",
              "  padding-top:max(8px,var(--safe-top),var(--dar-native-safe-top,0px)) !important;",
              "}",
              "html.dar-ios-native-app body.is-feed-fullscreen{",
              "  padding-top:max(0px,var(--safe-top),var(--dar-native-safe-top,0px)) !important;",
              "}",
              "html.dar-ios-native-app body.is-quran-overview #appView,",
              "html.dar-ios-native-app body.is-quran-overview #appView.view{",
              "  padding-top:max(6px,env(safe-area-inset-top,0px),var(--dar-native-safe-top,0px)) !important;",
              "}",
              "html.dar-ios-native-app body.has-bottom-nav{",
              "  padding-bottom:calc(var(--bottom-navigation-height,64px) + max(var(--safe-bottom),env(safe-area-inset-bottom,0px),var(--dar-native-safe-bottom,0px)) + 28px) !important;",
              "}",
              "html.dar-ios-native-app #bottomNav.bottom-nav,html.dar-ios-native-app .bottom-nav{",
              "  bottom:max(14px,calc(max(var(--safe-bottom),env(safe-area-inset-bottom,0px),var(--dar-native-safe-bottom,0px)) + 8px)) !important;",
              "}",
              "html.dar-ios-native-tabs #bottomNav,",
              "html.dar-ios-native-tabs #bottomNav.bottom-nav,",
              "html.dar-ios-native-tabs .bottom-nav,",
              "html.dar-ios-native-tabs #appChromeDock #bottomNav.bottom-nav{",
              "  display:none!important;",
              "  visibility:hidden!important;",
              "}"
            ].join("\\n");
          }
          function ensureStyle(){
            var root=document.documentElement;
            var style=document.getElementById("dar-ios-viewport-polish");
            if(!style){
              style=document.createElement("style");
              style.id="dar-ios-viewport-polish";
            }
            style.textContent=cssText();
            if(root){
              root.classList.add("dar-ios-native-app");
              root.classList.remove("dar-soft-booting");
              root.style.removeProperty("background-color");
              if(root.getAttribute("data-layout")==="medium"||root.getAttribute("data-layout")==="expanded"){
                root.setAttribute("data-layout","compact");
              }
            }
            if(document.body)document.body.classList.add("dar-ios-native-app");
            if(document.head)document.head.appendChild(style);
            var feedForce=document.getElementById("dar-ios-parity-edge-force-v665")||document.getElementById("dar-ios-parity-edge-force-v659")||document.getElementById("dar-ios-parity-edge-force-v658")||document.getElementById("dar-ios-parity-edge-force-v657")||document.getElementById("dar-ios-parity-edge-force-v656")||document.getElementById("dar-ios-parity-edge-force-v655")||document.getElementById("dar-ios-parity-edge-force-v654")||document.getElementById("dar-ios-parity-edge-force-v653")||document.getElementById("dar-ios-parity-edge-force-v652")||document.getElementById("dar-ios-parity-edge-force-v651")||document.getElementById("dar-ios-parity-edge-force-v650")||document.getElementById("dar-ios-parity-edge-force-v649")||document.getElementById("dar-ios-parity-edge-force-v648")||document.getElementById("full-edge-feed-force-v645")||document.getElementById("full-edge-feed-force-v644");
            if(feedForce&&document.head)document.head.appendChild(feedForce);
            try{
              var sb=document.getElementById("dar-soft-boot");
              if(sb&&sb.parentNode)sb.parentNode.removeChild(sb);
              if(typeof window.__darSoftBootFinish==="function")window.__darSoftBootFinish();
            }catch(e){}
          }
          function pinFeedNodes(){
            if(!document.body||!document.body.classList.contains("is-feed-fullscreen"))return;
            var nodes=document.querySelectorAll(".sf-app,.sf-top,.sf-filters,.sf-feed,.sf-post,.sf-post--image-feed,#premiumFeedMount,.pf-mount-root");
            for(var i=0;i<nodes.length;i++){
              var el=nodes[i];
              el.style.setProperty("width","100%","important");
              el.style.setProperty("max-width","100%","important");
              el.style.setProperty("margin-left","0px","important");
              el.style.setProperty("margin-right","0px","important");
            }
            var gutters=document.querySelectorAll(".sf-top,.sf-filters,.sf-feed");
            for(var j=0;j<gutters.length;j++){
              gutters[j].style.setProperty("padding-left","max(8px,env(safe-area-inset-left,0px))","important");
              gutters[j].style.setProperty("padding-right","max(8px,env(safe-area-inset-right,0px))","important");
            }
          }
          window.__darIosEnsureViewportPolish=function(){
            ensureStyle();
            pinFeedNodes();
          };
          if(document.readyState==="loading"){
            document.addEventListener("DOMContentLoaded", window.__darIosEnsureViewportPolish, {once:true});
          } else {
            window.__darIosEnsureViewportPolish();
          }
          window.addEventListener("pageshow", window.__darIosEnsureViewportPolish);
          window.addEventListener("hashchange", function(){ setTimeout(window.__darIosEnsureViewportPolish, 30); });
          try{
            var mo=new MutationObserver(function(muts){
              var need=false;
              for(var i=0;i<muts.length;i++){
                var m=muts[i];
                if(m.type==="childList"){ need=true; break; }
                if(m.type==="attributes"&&m.attributeName==="class"){ need=true; break; }
              }
              if(!need)return;
              clearTimeout(window.__darIosFeedPinTimer);
              window.__darIosFeedPinTimer=setTimeout(window.__darIosEnsureViewportPolish, 60);
            });
            mo.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});
          }catch(e){}
        })();
        """

        let libraryReaderBridge = """
        (function(){
          if(window.__darLibraryReaderBridgeInstalled)return;
          window.__darLibraryReaderBridgeInstalled=true;
          function postSlug(slug){
            if(!slug)return;
            try{
              window.webkit.messageHandlers.darLibraryReader.postMessage({
                slug: String(slug),
                href: String(window.location.href||""),
                source: "button"
              });
            }catch(e){}
          }
          function slugFromHash(hash){
            var raw=String(hash||window.location.hash||"");
            if(raw.charAt(0)==="#")raw=raw.slice(1);
            var parts=raw.split("/").filter(Boolean);
            if(parts.length>=3&&parts[0]==="bibliothek"&&parts[parts.length-1]==="lesen"){
              return parts.slice(1,-1).join("/");
            }
            return "";
          }
          function postCurrent(){
            var slug=slugFromHash();
            if(!slug)return;
            try{
              window.webkit.messageHandlers.darLibraryReader.postMessage({
                slug: slug,
                href: String(window.location.href||""),
                source: "hash"
              });
            }catch(e){}
          }
          window.addEventListener("hashchange", function(){ setTimeout(postCurrent, 30); });
          document.addEventListener("click", function(ev){
            var btn=ev.target&&ev.target.closest?ev.target.closest("[data-library-read]"):null;
            if(btn){
              var slug=btn.getAttribute("data-library-read")||"";
              if(slug){
                ev.preventDefault();
                ev.stopPropagation();
                ev.stopImmediatePropagation&&ev.stopImmediatePropagation();
                postSlug(slug);
                return;
              }
            }
            setTimeout(postCurrent, 80);
          }, true);
          window.addEventListener("load", function(){ setTimeout(postCurrent, 120); });
          setTimeout(postCurrent, 300);
        })();
        """
        let iosLibraryDetailPolish = """
        (function(){
          if(window.__darIosLibraryDetailPolishInstalled)return;
          window.__darIosLibraryDetailPolishInstalled=true;
          function ensureStyle(){
            var style=document.getElementById("dar-ios-library-detail-polish");
            if(!style){
              style=document.createElement("style");
              style.id="dar-ios-library-detail-polish";
            }
            style.textContent = [
              "html.dar-ios-native-app body .lib-page.lib-detail{",
              "  padding-top: 0 !important;",
              "}",
              "html.dar-ios-native-app body .lib-page.lib-detail .lib-detail-hero.lib-detail-hero-compact{",
              "  margin-top: 0 !important;",
              "  padding-top: 8px !important;",
              "  gap: 18px !important;",
              "}",
              "html.dar-ios-native-app body .lib-page.lib-detail .lib-detail-cover{",
              "  margin-top: 18px !important;",
              "}",
              "html.dar-ios-native-app body .lib-page.lib-detail .lib-detail-copy{",
              "  padding-top: 8px !important;",
              "}",
              "html.dar-ios-native-app body .lib-page.lib-detail .lib-actions.lib-actions-compact{",
              "  margin-top: 14px !important;",
              "}",
              "@media (max-width: 520px){",
              "  html.dar-ios-native-app body .lib-page.lib-detail .lib-detail-hero.lib-detail-hero-compact{",
              "    padding-top: 6px !important;",
              "  }",
              "  html.dar-ios-native-app body .lib-page.lib-detail .lib-detail-cover{",
              "    margin-top: 14px !important;",
              "  }",
              "}"
            ].join("\\n");
            if(document.head)document.head.appendChild(style);
          }
          if(document.readyState === "loading"){
            document.addEventListener("DOMContentLoaded", ensureStyle, { once:true });
          } else {
            ensureStyle();
          }
          window.addEventListener("pageshow", ensureStyle);
          window.addEventListener("hashchange", function(){ setTimeout(ensureStyle, 40); });
        })();
        """
        userContentController.addUserScript(
            WKUserScript(
                source: iosViewportPolish,
                injectionTime: .atDocumentEnd,
                forMainFrameOnly: true
            )
        )
        userContentController.addUserScript(
            WKUserScript(
                source: libraryReaderBridge,
                injectionTime: .atDocumentEnd,
                forMainFrameOnly: true
            )
        )
        userContentController.addUserScript(
            WKUserScript(
                source: iosLibraryDetailPolish,
                injectionTime: .atDocumentEnd,
                forMainFrameOnly: true
            )
        )
        let appearanceBridge = """
        (function(){
          function toHex(value){
            if(!value)return "";
            var raw=String(value).trim();
            if(!raw)return "";
            if(raw.charAt(0)==="#")return raw;
            var match=raw.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/i);
            if(!match)return "";
            function part(index){
              return Math.max(0,Math.min(255,parseInt(match[index],10)||0)).toString(16).padStart(2,"0");
            }
            return "#" + part(1) + part(2) + part(3);
          }
          function firstSolidColor(selectors){
            for(var i=0;i<selectors.length;i++){
              var element=document.querySelector(selectors[i]);
              if(!element)continue;
              var style=getComputedStyle(element);
              var color=toHex(style.backgroundColor);
              if(color && color !== "#00000000")return color;
            }
            return "";
          }
          function firstVariableColor(targets, names){
            for(var i=0;i<targets.length;i++){
              var element=targets[i];
              if(!element)continue;
              var style=getComputedStyle(element);
              for(var j=0;j<names.length;j++){
                var color=toHex(style.getPropertyValue(names[j]));
                if(color)return color;
              }
            }
            return "";
          }
          function publishAppearance(){
            // Theme-only: never inject hardcoded navy/blue route palettes.
            var roots=[document.body, document.documentElement, document.querySelector('.app'), document.querySelector('#appShell'), document.querySelector('#appView')];
            var topColor=firstVariableColor(roots, [
              "--theme-page-bg",
              "--theme-feed-bg",
              "--ilm-page-bg",
              "--page-cover-mid",
              "--page-cover",
              "--outer-bg-flat",
              "--bg2",
              "--bg"
            ]);
            if(!topColor){
              topColor=firstSolidColor([".sf-top", ".lib-page", "#appView > .view-head", "#appView > .view", "body", "html"]);
            }
            var midColor=firstVariableColor(roots, [
              "--theme-feed-bg",
              "--page-cover-mid",
              "--theme-page-bg",
              "--ilm-page-bg",
              "--page-cover",
              "--bg2",
              "--bg"
            ]);
            if(!midColor){
              midColor=firstSolidColor(["#appView > .view-head", ".sf-top", ".lib-page", "#appView > .view", "body"]) || topColor;
            }
            var bottomColor=firstVariableColor(roots, [
              "--outer-bg-flat",
              "--theme-page-bg",
              "--ilm-page-bg",
              "--theme-feed-bg",
              "--page-cover",
              "--bg2",
              "--bg"
            ]);
            if(!bottomColor){
              bottomColor=firstSolidColor(["#appView > .view", ".lib-page", "body", "html"]) || topColor;
            }
            var boot="#050504";
            try{
              window.webkit.messageHandlers.darAppearance.postMessage({
                top: topColor || boot,
                mid: midColor || topColor || boot,
                bottom: bottomColor || topColor || boot
              });
            }catch(e){}
          }
          if(window.__darAppearanceBridgeInstalled){
            if(window.__darPublishAppearance)window.__darPublishAppearance();
            return;
          }
          window.__darAppearanceBridgeInstalled=true;
          window.__darPublishAppearance=function(){
            setTimeout(publishAppearance, 40);
            setTimeout(publishAppearance, 180);
            setTimeout(publishAppearance, 420);
            setTimeout(publishAppearance, 820);
          };
          if(document.readyState==="loading"){
            document.addEventListener("DOMContentLoaded", window.__darPublishAppearance, { once:true });
          } else {
            window.__darPublishAppearance();
          }
          window.addEventListener("pageshow", window.__darPublishAppearance);
          window.addEventListener("hashchange", function(){ setTimeout(window.__darPublishAppearance, 60); });
        })();
        """
        userContentController.addUserScript(
            WKUserScript(
                source: appearanceBridge,
                injectionTime: .atDocumentEnd,
                forMainFrameOnly: true
            )
        )
        let widgetBridge = """
        (function(){
          function send(){
            try{
              var raw=localStorage.getItem("darPrayerSettingsV1");
              var s=raw?JSON.parse(raw):{};
              if(window.webkit&&window.webkit.messageHandlers&&window.webkit.messageHandlers.darWidgetSnapshot){
                window.webkit.messageHandlers.darWidgetSnapshot.postMessage({
                  lat:s.lat,
                  lon:s.lon,
                  city:s.city||""
                });
              }
            }catch(e){}
          }
          send();
          setTimeout(send,800);
          setTimeout(send,2400);
          setInterval(send,120000);
        })();
        """
        userContentController.addUserScript(
            WKUserScript(
                source: widgetBridge,
                injectionTime: .atDocumentEnd,
                forMainFrameOnly: true
            )
        )
        configuration.userContentController = userContentController

        let bootInk = UIColor(red: 0.02, green: 0.02, blue: 0.01, alpha: 1.0)
        let containerView = UIView(frame: .zero)
        containerView.backgroundColor = bootInk

        let backdropView = GradientBackdropView(frame: .zero)
        backdropView.translatesAutoresizingMaskIntoConstraints = false
        backdropView.updateColors(top: bootInk, mid: bootInk, bottom: bootInk)
        containerView.addSubview(backdropView)

        let webView = InsetAwareWebView(frame: .zero, configuration: configuration)
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.backgroundColor = bootInk
        webView.allowsBackForwardNavigationGestures = true
        webView.isOpaque = true
        webView.backgroundColor = bootInk
        webView.customUserAgent = "DarAlTawhid-iOS-TestFlight/0.24-native-tabs"
        webView.onInsetsChange = { [weak coordinator = context.coordinator] in
            coordinator?.updateViewportInsets()
        }
        containerView.addSubview(webView)

        let tabBar = DarNativeTabBar()
        tabBar.translatesAutoresizingMaskIntoConstraints = false
        tabBar.onSelect = { [weak coordinator = context.coordinator] id in
            coordinator?.openNativeTab(id)
        }
        containerView.addSubview(tabBar)

        NSLayoutConstraint.activate([
            backdropView.topAnchor.constraint(equalTo: containerView.topAnchor),
            backdropView.leadingAnchor.constraint(equalTo: containerView.leadingAnchor),
            backdropView.trailingAnchor.constraint(equalTo: containerView.trailingAnchor),
            backdropView.bottomAnchor.constraint(equalTo: containerView.bottomAnchor),
            webView.topAnchor.constraint(equalTo: containerView.topAnchor),
            webView.leadingAnchor.constraint(equalTo: containerView.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: containerView.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: tabBar.topAnchor, constant: -8),
            tabBar.leadingAnchor.constraint(equalTo: containerView.safeAreaLayoutGuide.leadingAnchor, constant: 12),
            tabBar.trailingAnchor.constraint(equalTo: containerView.safeAreaLayoutGuide.trailingAnchor, constant: -12),
            tabBar.bottomAnchor.constraint(equalTo: containerView.safeAreaLayoutGuide.bottomAnchor, constant: -8),
            tabBar.heightAnchor.constraint(equalToConstant: 62)
        ])
        context.coordinator.attach(
            webView,
            backdropView: backdropView,
            containerView: containerView,
            tabBar: tabBar
        )
        webView.load(URLRequest(url: Self.launchURL))
        return containerView
    }

    func updateUIView(_ view: UIView, context: Context) {
        guard let route = destination else { return }
        context.coordinator.navigate(to: route)
    }

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
        private struct LibraryPublication: Decodable {
            let id: String?
            let slug: String?
            let title: String?
            let pdfUrl: String?
        }

        private weak var webView: WKWebView?
        private weak var backdropView: GradientBackdropView?
        private weak var containerView: UIView?
        private weak var nativeChromeBar: DarNativeTabBar?
        private weak var loadingOverlay: UIView?
        private var pageSurfaceColor = UIColor(red: 0.02, green: 0.02, blue: 0.01, alpha: 1.0)
        private weak var loadingLabel: UILabel?
        private weak var loadingProgressFill: UIView?
        private weak var loadingProgressTrack: UIView?
        private weak var loadingProgressValueLabel: UILabel?
        private weak var loadingProgressWidthConstraint: NSLayoutConstraint?
        private var didShowErrorState = false
        private var hasCompletedInitialLoad = false
        private var loadTimeoutWorkItem: DispatchWorkItem?
        private var loadingProgressTimer: Timer?
        private var loadingProgressValue: CGFloat = 0
        private var isBootLoadingVisible = false
        private var hideLoadingWorkItem: DispatchWorkItem?
        private var presentedLibrarySlug: String?
        private var libraryCatalogCache: [LibraryPublication] = []
        private var libraryCatalogTask: Task<[LibraryPublication], Error>?
        private var viewportInsets: UIEdgeInsets = .zero
        private var viewportInsetWorkItem: DispatchWorkItem?
        private var lastAppliedTopInset: CGFloat = -1
        private var lastAppearanceKey: String = ""
        private var lastOpenedDestination: DarDeepLink.Destination?
        private let errorHTML = """
        <!doctype html>
        <html lang="de">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
          <style>
            html, body { height: 100%; margin: 0; background: #080806; color: #f5f0dc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
            main { min-height: 100%; display: grid; place-items: center; padding: 32px; box-sizing: border-box; text-align: center; }
            h1 { margin: 0 0 12px; font-size: 24px; font-weight: 700; letter-spacing: 0; }
            p { margin: 0; max-width: 420px; color: rgba(245, 240, 220, .72); line-height: 1.55; font-size: 15px; }
            button { margin-top: 18px; min-height: 46px; padding: 0 18px; border-radius: 999px; border: 1px solid rgba(215, 184, 110, .35); background: linear-gradient(180deg, rgba(29, 53, 74, .96), rgba(12, 28, 40, .98)); color: #f5f0dc; font: 700 14px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
          </style>
        </head>
        <body>
          <main>
            <section>
              <h1>DAR AL TAWḤĪD</h1>
              <p>Die App konnte gerade nicht geladen werden. Bitte pruefe deine Internetverbindung und oeffne die App erneut.</p>
              <button type="button" onclick="window.location.href='\(WebAppView.launchURL.absoluteString)'">Erneut laden</button>
            </section>
          </main>
        </body>
        </html>
        """

        func attach(
            _ webView: WKWebView,
            backdropView: GradientBackdropView,
            containerView: UIView,
            tabBar: DarNativeTabBar
        ) {
            self.webView = webView
            self.backdropView = backdropView
            self.containerView = containerView
            self.nativeChromeBar = tabBar
            installLoadingOverlay(on: containerView)
            containerView.bringSubviewToFront(tabBar)
            applySurfaceColor(pageSurfaceColor)
            showLoadingOverlay(subtitle: "App wird geladen")
            updateViewportInsets()
            DispatchQueue.main.async { [weak self] in
                self?.updateViewportInsets()
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) { [weak self] in
                self?.updateViewportInsets()
            }
            NotificationCenter.default.addObserver(
                self,
                selector: #selector(appDidBecomeActive),
                name: UIApplication.didBecomeActiveNotification,
                object: nil
            )
        }

        deinit {
            loadingProgressTimer?.invalidate()
            webView?.configuration.userContentController.removeScriptMessageHandler(forName: "darLibraryReader")
            webView?.configuration.userContentController.removeScriptMessageHandler(forName: "darAppearance")
            webView?.configuration.userContentController.removeScriptMessageHandler(forName: "darWidgetSnapshot")
            NotificationCenter.default.removeObserver(self)
        }

        func openNativeTab(_ id: String) {
            let dest: DarDeepLink.Destination
            switch id {
            case "quiz": dest = .home
            case "feed": dest = .home
            case "quran": dest = .quran
            case "more": dest = .more
            default: dest = .home
            }
            let hash: String
            switch id {
            case "quiz": hash = "#quiz"
            case "feed": hash = "#feed"
            case "quran": hash = "#quran"
            case "more": hash = "#more"
            default: hash = "#home"
            }
            lastOpenedDestination = dest
            webView?.evaluateJavaScript("location.hash=\(Self.jsString(hash));", completionHandler: nil)
            nativeChromeBar?.select(id: id)
        }

        func navigate(to destination: DarDeepLink.Destination, force: Bool = false) {
            guard force || lastOpenedDestination != destination else { return }
            lastOpenedDestination = destination
            let hash = destination.webHash
            webView?.evaluateJavaScript("location.hash=\(Self.jsString(hash));", completionHandler: nil)
        }

        private static func jsString(_ value: String) -> String {
            let escaped = value
                .replacingOccurrences(of: "\\", with: "\\\\")
                .replacingOccurrences(of: "\"", with: "\\\"")
            return "\"\(escaped)\""
        }

        func applyWidgetPayload(_ body: [String: Any]) {
            var snap = DarWidgetStore.load()
            if let lat = body["lat"] as? Double, let lon = body["lon"] as? Double,
               lat.isFinite, lon.isFinite {
                snap.latitude = lat
                snap.longitude = lon
            } else if let lat = (body["lat"] as? NSNumber)?.doubleValue,
                      let lon = (body["lon"] as? NSNumber)?.doubleValue,
                      lat.isFinite, lon.isFinite, abs(lat) > 0.01 {
                snap.latitude = lat
                snap.longitude = lon
            }
            if let city = body["city"] as? String, !city.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                snap.cityLabel = city
            }
            DarWidgetStore.save(DarDailyContent.refresh(snap))
        }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            if message.name == "darWidgetSnapshot" {
                if let body = message.body as? [String: Any] {
                    applyWidgetPayload(body)
                }
                return
            }
            if message.name == "darAppearance" {
                guard let body = message.body as? [String: Any] else { return }
                applyAppearance(
                    topHex: body["top"] as? String,
                    midHex: body["mid"] as? String,
                    bottomHex: body["bottom"] as? String
                )
                return
            }

            guard message.name == "darLibraryReader" else { return }
            guard let body = message.body as? [String: Any] else { return }
            guard let rawSlug = body["slug"] as? String else { return }
            let slug = rawSlug.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !slug.isEmpty else { return }
            guard presentedLibrarySlug != slug else { return }

            let href = (body["href"] as? String).flatMap(URL.init(string:))
            let sourceURL = href ?? webView?.url
            guard let sourceURL else { return }

            Task { [weak self] in
                guard let self else { return }
                do {
                    let publication = try await self.fetchLibraryPublication(slug: slug, from: sourceURL)
                    guard let publication else { return }
                    await MainActor.run {
                        self.presentLibraryPDF(for: publication, slug: slug, sourceURL: sourceURL)
                    }
                } catch {
                    await MainActor.run {
                        self.presentSimpleAlert(
                            title: "PDF konnte nicht geoeffnet werden",
                            message: "Bitte versuche es erneut oder oeffne die PDF spaeter."
                        )
                    }
                }
            }
        }

        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
        ) {
            guard let url = navigationAction.request.url else {
                decisionHandler(.allow)
                return
            }

            if shouldOpenExternally(url) {
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
                return
            }

            if isAllowedInternalURL(url) {
                decisionHandler(.allow)
                return
            }

            if navigationAction.navigationType == .linkActivated {
                UIApplication.shared.open(url)
                decisionHandler(.cancel)
                return
            }

            decisionHandler(.allow)
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            guard !isCancelledNavigation(error) else { return }
            showLoadError(in: webView)
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            guard !isCancelledNavigation(error) else { return }
            showLoadError(in: webView)
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            showLoadingOverlay(subtitle: "App wird geladen")
            scheduleLoadTimeout(for: webView)
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            guard let currentURL = webView.url, isAllowedInternalURL(currentURL) else { return }
            loadTimeoutWorkItem?.cancel()
            hasCompletedInitialLoad = true
            didShowErrorState = false
            hideLoadingOverlay()
            lastAppliedTopInset = -1
            updateViewportInsets()
            // Appearance after overlay finishes, so boot screen stays visible until 100%.
            handlePossibleLibraryReaderRoute(currentURL)
            if let pending = DarWidgetStore.consumePendingDestination() {
                navigate(to: pending, force: true)
            }
        }

        func updateViewportInsets() {
            viewportInsetWorkItem?.cancel()
            let work = DispatchWorkItem { [weak self] in
                self?.applyViewportInsetsNow()
            }
            viewportInsetWorkItem = work
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.05, execute: work)
        }

        private func applyViewportInsetsNow() {
            guard let webView else { return }
            let resolvedInsets = resolvedSafeAreaInsets(for: webView)
            viewportInsets = resolvedInsets

            if webView.scrollView.contentInset != .zero {
                webView.scrollView.contentInset = .zero
            }
            if webView.scrollView.verticalScrollIndicatorInsets != .zero {
                webView.scrollView.verticalScrollIndicatorInsets = .zero
            }
            webView.scrollView.backgroundColor = pageSurfaceColor

            let topInset = max(resolvedInsets.top, 59)
            if abs(topInset - lastAppliedTopInset) < 0.5, lastAppliedTopInset >= 0 {
                return
            }
            lastAppliedTopInset = topInset

            let top = String(format: "%.2f", topInset)
            let right = String(format: "%.2f", resolvedInsets.right)
            let bottom = String(format: "%.2f", resolvedInsets.bottom)
            let left = String(format: "%.2f", resolvedInsets.left)
            let js = """
            (function(){
              var root=document.documentElement;
              var body=document.body;
              if(!root)return;
              root.classList.add("dar-ios-native-app");
              root.style.setProperty("--dar-native-safe-top","\(top)px");
              root.style.setProperty("--safe-top","\(top)px");
              var bottomNative=\(bottom);
              if(bottomNative > 1){
                root.style.setProperty("--dar-native-safe-bottom", bottomNative.toFixed(2) + "px");
                root.style.setProperty("--safe-bottom", bottomNative.toFixed(2) + "px");
              } else {
                root.style.removeProperty("--dar-native-safe-bottom");
                root.style.removeProperty("--safe-bottom");
              }
              root.style.setProperty("--dar-ios-safe-left","\(left)px");
              root.style.setProperty("--dar-ios-safe-right","\(right)px");
              if(body)body.classList.add("dar-ios-native-app");
              if(typeof window.__darIosEnsureViewportPolish==="function"){
                window.__darIosEnsureViewportPolish();
              }
              var meta=document.querySelector('meta[name="viewport"]');
              if(meta){
                var content=String(meta.getAttribute("content")||"");
                if(content.indexOf("viewport-fit=cover")===-1){
                  meta.setAttribute("content", content + (content?",":"") + "viewport-fit=cover");
                }
              }
            })();
            """
            webView.evaluateJavaScript(js, completionHandler: nil)
        }

        private func refreshAppearanceBridge() {
            webView?.evaluateJavaScript(
                "window.__darPublishAppearance && window.__darPublishAppearance();",
                completionHandler: nil
            )
        }

        private func applySurfaceColor(_ color: UIColor) {
            pageSurfaceColor = color
            backdropView?.updateColors(top: color, mid: color, bottom: color)
            containerView?.backgroundColor = color
            webView?.scrollView.backgroundColor = color
            webView?.backgroundColor = color
            webView?.isOpaque = true
            if #available(iOS 15.0, *) {
                webView?.underPageBackgroundColor = color
            }
            webView?.window?.backgroundColor = color
            // Keep boot overlay ink while loading, otherwise theme updates hide the progress UI.
            if !isBootLoadingVisible {
                loadingOverlay?.backgroundColor = color
            }
        }

        private func applyAppearance(topHex: String?, midHex: String?, bottomHex: String?) {
            let key = "\(topHex ?? "")|\(midHex ?? "")|\(bottomHex ?? "")"
            guard key != lastAppearanceKey else { return }
            lastAppearanceKey = key
            let topColor = color(from: topHex) ?? pageSurfaceColor
            let midColor = color(from: midHex) ?? topColor
            let bottomColor = color(from: bottomHex) ?? topColor
            applySurfaceColor(topColor)
            backdropView?.updateColors(top: topColor, mid: midColor, bottom: bottomColor)
        }

        private func color(from hex: String?) -> UIColor? {
            guard var hex else { return nil }
            hex = hex.trimmingCharacters(in: .whitespacesAndNewlines)
            guard hex.hasPrefix("#") else { return nil }
            let normalized = String(hex.dropFirst())
            guard normalized.count == 6, let value = Int(normalized, radix: 16) else { return nil }
            return UIColor(
                red: CGFloat((value >> 16) & 0xFF) / 255.0,
                green: CGFloat((value >> 8) & 0xFF) / 255.0,
                blue: CGFloat(value & 0xFF) / 255.0,
                alpha: 1.0
            )
        }

        private func resolvedSafeAreaInsets(for webView: WKWebView) -> UIEdgeInsets {
            if let windowInsets = webView.window?.safeAreaInsets, windowInsets.top > 0 {
                return windowInsets
            }

            if let sceneInsets = UIApplication.shared.connectedScenes
                .compactMap({ $0 as? UIWindowScene })
                .flatMap({ $0.windows })
                .first(where: \.isKeyWindow)?
                .safeAreaInsets,
               sceneInsets.top > 0 {
                return sceneInsets
            }

            return webView.safeAreaInsets
        }

        func webView(
            _ webView: WKWebView,
            createWebViewWith configuration: WKWebViewConfiguration,
            for navigationAction: WKNavigationAction,
            windowFeatures: WKWindowFeatures
        ) -> WKWebView? {
            guard let url = navigationAction.request.url else { return nil }

            if shouldOpenExternally(url) {
                UIApplication.shared.open(url)
                return nil
            }

            if isAllowedInternalURL(url) {
                webView.load(URLRequest(url: url))
                return nil
            }

            UIApplication.shared.open(url)
            return nil
        }

        private func isAllowedInternalURL(_ url: URL) -> Bool {
            if url.scheme == "about" {
                return true
            }

            guard
                let host = url.host?.lowercased(),
                let scheme = url.scheme?.lowercased()
            else {
                return false
            }

            return (scheme == "https" || scheme == "http") && WebAppView.allowedHosts.contains(host)
        }

        private func shouldOpenExternally(_ url: URL) -> Bool {
            guard let scheme = url.scheme?.lowercased() else { return false }
            return ["mailto", "tel", "maps", "itms-apps", "itmss"].contains(scheme)
        }

        private func handlePossibleLibraryReaderRoute(_ url: URL) {
            guard let slug = libraryReaderSlug(from: url) else { return }
            guard presentedLibrarySlug != slug else { return }

            Task { [weak self] in
                guard let self else { return }
                do {
                    let publication = try await self.fetchLibraryPublication(slug: slug, from: url)
                    guard let publication else { return }
                    await MainActor.run {
                        self.presentLibraryPDF(for: publication, slug: slug, sourceURL: url)
                    }
                } catch {
                    await MainActor.run {
                        self.presentSimpleAlert(
                            title: "PDF konnte nicht geoeffnet werden",
                            message: "Bitte versuche es erneut oder oeffne die PDF spaeter."
                        )
                    }
                }
            }
        }

        private func libraryReaderSlug(from url: URL) -> String? {
            guard let fragment = url.fragment?.removingPercentEncoding else { return nil }
            let parts = fragment.split(separator: "/").map(String.init)
            guard parts.count >= 3 else { return nil }
            guard parts.first == "bibliothek", parts.last == "lesen" else { return nil }
            return parts.dropFirst().dropLast().joined(separator: "/")
        }

        private func libraryCatalogURL(for url: URL) -> URL? {
            guard let host = url.host else { return nil }
            let path = url.path.lowercased().contains("/test/") ? "/test/data/library-publications.json" : "/data/library-publications.json"
            var components = URLComponents()
            components.scheme = url.scheme ?? "https"
            components.host = host
            components.path = path
            return components.url
        }

        private func fetchLibraryPublication(slug: String, from url: URL) async throws -> LibraryPublication? {
            let normalizedSlug = slug.trimmingCharacters(in: .whitespacesAndNewlines)
            if let cached = libraryCatalogCache.first(where: {
                ($0.slug ?? $0.id ?? "").trimmingCharacters(in: .whitespacesAndNewlines) == normalizedSlug
            }) {
                return cached
            }

            let publications: [LibraryPublication]
            if let task = libraryCatalogTask {
                publications = try await task.value
            } else {
                let task = Task<[LibraryPublication], Error> {
                    guard let catalogURL = libraryCatalogURL(for: url) else { return [] }
                    let (data, _) = try await URLSession.shared.data(from: catalogURL)
                    struct CatalogPayload: Decodable { let publications: [LibraryPublication]? }
                    let decoded = try JSONDecoder().decode(CatalogPayload.self, from: data)
                    return decoded.publications ?? []
                }
                libraryCatalogTask = task
                publications = try await task.value
                libraryCatalogTask = nil
                libraryCatalogCache = publications
            }

            return publications.first(where: {
                ($0.slug ?? $0.id ?? "").trimmingCharacters(in: .whitespacesAndNewlines) == normalizedSlug
            })
        }

        @MainActor
        private func presentLibraryPDF(for publication: LibraryPublication, slug: String, sourceURL: URL) {
            guard let rawPDFPath = publication.pdfUrl?.trimmingCharacters(in: .whitespacesAndNewlines), !rawPDFPath.isEmpty else {
                presentSimpleAlert(title: "PDF fehlt", message: "Zu dieser Veroeffentlichung wurde keine PDF gefunden.")
                return
            }
            guard let host = sourceURL.host else { return }

            let pdfURL: URL? = {
                if rawPDFPath.hasPrefix("http://") || rawPDFPath.hasPrefix("https://") {
                    return URL(string: rawPDFPath)
                }
                var components = URLComponents()
                components.scheme = sourceURL.scheme ?? "https"
                components.host = host
                components.path = rawPDFPath.hasPrefix("/") ? rawPDFPath : "/\(rawPDFPath)"
                return components.url
            }()

            guard let pdfURL else {
                presentSimpleAlert(title: "PDF ungueltig", message: "Die PDF-Adresse konnte nicht aufgebaut werden.")
                return
            }

            guard let presenter = topViewController() else { return }
            if presenter.presentedViewController is LibraryPDFViewController { return }

            let viewer = LibraryPDFViewController(
                pdfURL: pdfURL,
                titleText: publication.title ?? "PDF",
                onClose: { [weak self] in
                    guard let self else { return }
                    self.presentedLibrarySlug = nil
                    self.navigateBackToLibraryDetail(slug: slug)
                }
            )
            let nav = UINavigationController(rootViewController: viewer)
            nav.modalPresentationStyle = .fullScreen
            let pageBlue = UIColor(red: 0.04, green: 0.08, blue: 0.16, alpha: 1.0)
            let appearance = UINavigationBarAppearance()
            appearance.configureWithOpaqueBackground()
            appearance.backgroundColor = pageBlue
            appearance.titleTextAttributes = [
                .foregroundColor: UIColor(red: 0.96, green: 0.93, blue: 0.82, alpha: 1.0)
            ]
            nav.navigationBar.standardAppearance = appearance
            nav.navigationBar.scrollEdgeAppearance = appearance
            nav.navigationBar.compactAppearance = appearance
            nav.navigationBar.tintColor = UIColor(red: 0.92, green: 0.84, blue: 0.62, alpha: 1.0)
            nav.navigationBar.isTranslucent = false
            nav.view.backgroundColor = pageBlue
            presentedLibrarySlug = slug
            presenter.present(nav, animated: true)
        }

        @MainActor
        private func navigateBackToLibraryDetail(slug: String) {
            guard let webView else { return }
            let escapedSlug = slug
                .replacingOccurrences(of: "\\", with: "\\\\")
                .replacingOccurrences(of: "'", with: "\\'")
            let js = "window.location.hash = '#bibliothek/\(escapedSlug)';"
            webView.evaluateJavaScript(js, completionHandler: nil)
        }

        @MainActor
        private func presentSimpleAlert(title: String, message: String) {
            guard let presenter = topViewController() else { return }
            let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "OK", style: .default))
            presenter.present(alert, animated: true)
        }

        @MainActor
        private func topViewController(base: UIViewController? = nil) -> UIViewController? {
            let root = base
                ?? webView?.window?.rootViewController
                ?? UIApplication.shared.connectedScenes
                    .compactMap { $0 as? UIWindowScene }
                    .flatMap { $0.windows }
                    .first(where: \.isKeyWindow)?
                    .rootViewController

            if let nav = root as? UINavigationController {
                return topViewController(base: nav.visibleViewController)
            }
            if let tab = root as? UITabBarController, let selected = tab.selectedViewController {
                return topViewController(base: selected)
            }
            if let presented = root?.presentedViewController {
                return topViewController(base: presented)
            }
            return root
        }

        @objc
        private func appDidBecomeActive() {
            guard let webView else { return }
            updateViewportInsets()

            if didShowErrorState {
                showLoadingOverlay(subtitle: "Erneut laden")
                webView.load(URLRequest(url: WebAppView.launchURL))
            }
        }

        private func showLoadError(in webView: WKWebView) {
            loadTimeoutWorkItem?.cancel()
            didShowErrorState = true
            hideLoadingOverlay()
            webView.loadHTMLString(errorHTML, baseURL: nil)
        }

        private func isCancelledNavigation(_ error: Error) -> Bool {
            let nsError = error as NSError
            return nsError.domain == NSURLErrorDomain && nsError.code == NSURLErrorCancelled
        }

        private func scheduleLoadTimeout(for webView: WKWebView) {
            loadTimeoutWorkItem?.cancel()

            let workItem = DispatchWorkItem { [weak self, weak webView] in
                guard let self, let webView, !self.hasCompletedInitialLoad, !self.didShowErrorState else { return }
                self.showLoadError(in: webView)
            }

            loadTimeoutWorkItem = workItem
            DispatchQueue.main.asyncAfter(deadline: .now() + 25, execute: workItem)
        }

        private func installLoadingOverlay(on host: UIView) {
            let overlay = UIView(frame: host.bounds)
            overlay.translatesAutoresizingMaskIntoConstraints = false
            overlay.backgroundColor = UIColor(red: 0.02, green: 0.02, blue: 0.01, alpha: 1.0)
            overlay.isUserInteractionEnabled = true
            overlay.isHidden = true
            overlay.alpha = 0
            overlay.layer.zPosition = 10_000
            overlay.clipsToBounds = false

            let stack = UIStackView()
            stack.translatesAutoresizingMaskIntoConstraints = false
            stack.axis = .vertical
            stack.alignment = .center
            stack.spacing = 22

            let emblem = UIImageView(image: UIImage(named: "BrandMark"))
            emblem.translatesAutoresizingMaskIntoConstraints = false
            emblem.contentMode = .scaleAspectFit
            emblem.clipsToBounds = true
            emblem.layer.cornerRadius = 74
            emblem.layer.borderWidth = 1
            emblem.layer.borderColor = UIColor(red: 0.83, green: 0.71, blue: 0.43, alpha: 0.36).cgColor
            emblem.backgroundColor = UIColor(red: 0.98, green: 0.97, blue: 0.94, alpha: 0.98)
            emblem.layer.shadowColor = UIColor.black.cgColor
            emblem.layer.shadowOpacity = 0.18
            emblem.layer.shadowRadius = 16
            emblem.layer.shadowOffset = CGSize(width: 0, height: 10)

            let title = UILabel()
            title.translatesAutoresizingMaskIntoConstraints = false
            title.text = "DAR AL TAWḤĪD"
            title.textColor = UIColor(red: 0.96, green: 0.93, blue: 0.82, alpha: 1.0)
            title.font = UIFont.systemFont(ofSize: 34, weight: .bold)
            title.textAlignment = .center

            let kicker = UILabel()
            kicker.translatesAutoresizingMaskIntoConstraints = false
            kicker.text = "Quran • Sunnah • Athar"
            kicker.textColor = UIColor(red: 0.80, green: 0.72, blue: 0.52, alpha: 1.0)
            kicker.font = UIFont.systemFont(ofSize: 16, weight: .semibold)
            kicker.textAlignment = .center

            let progressWrap = UIView()
            progressWrap.translatesAutoresizingMaskIntoConstraints = false

            let progressTrack = UIView()
            progressTrack.translatesAutoresizingMaskIntoConstraints = false
            progressTrack.backgroundColor = UIColor(red: 0.19, green: 0.16, blue: 0.10, alpha: 0.95)
            progressTrack.layer.cornerRadius = 0
            progressTrack.layer.borderWidth = 0
            progressTrack.backgroundColor = UIColor(red: 0.79, green: 0.66, blue: 0.42, alpha: 0.16)

            let progressGlow = UIView()
            progressGlow.translatesAutoresizingMaskIntoConstraints = false
            progressGlow.backgroundColor = UIColor(red: 0.92, green: 0.84, blue: 0.62, alpha: 1.0)
            progressGlow.layer.cornerRadius = 0
            progressGlow.layer.shadowColor = UIColor(red: 0.92, green: 0.84, blue: 0.62, alpha: 1.0).cgColor
            progressGlow.layer.shadowOpacity = 0.22
            progressGlow.layer.shadowRadius = 3
            progressGlow.layer.shadowOffset = CGSize(width: 0, height: 0)

            let progressShine = UIView()
            progressShine.translatesAutoresizingMaskIntoConstraints = false
            progressShine.backgroundColor = UIColor(white: 1.0, alpha: 0.34)
            progressShine.layer.cornerRadius = 0.5

            let subtitle = UILabel()
            subtitle.translatesAutoresizingMaskIntoConstraints = false
            subtitle.text = "App wird geladen"
            subtitle.textColor = UIColor(red: 0.76, green: 0.74, blue: 0.68, alpha: 1.0)
            subtitle.font = UIFont.systemFont(ofSize: 16, weight: .medium)
            subtitle.textAlignment = .center

            let progressValue = UILabel()
            progressValue.translatesAutoresizingMaskIntoConstraints = false
            progressValue.text = "0%"
            progressValue.textColor = UIColor(red: 0.88, green: 0.81, blue: 0.64, alpha: 0.96)
            progressValue.font = UIFont.monospacedDigitSystemFont(ofSize: 16, weight: .semibold)
            progressValue.textAlignment = .center

            progressWrap.addSubview(progressTrack)
            progressTrack.addSubview(progressGlow)
            progressGlow.addSubview(progressShine)

            let progressWidthConstraint = progressGlow.widthAnchor.constraint(equalToConstant: 0)

            stack.addArrangedSubview(emblem)
            stack.addArrangedSubview(title)
            stack.addArrangedSubview(kicker)
            stack.addArrangedSubview(progressWrap)
            stack.addArrangedSubview(subtitle)
            stack.addArrangedSubview(progressValue)

            overlay.addSubview(stack)
            host.addSubview(overlay)
            host.bringSubviewToFront(overlay)

            NSLayoutConstraint.activate([
                overlay.topAnchor.constraint(equalTo: host.topAnchor),
                overlay.leadingAnchor.constraint(equalTo: host.leadingAnchor),
                overlay.trailingAnchor.constraint(equalTo: host.trailingAnchor),
                overlay.bottomAnchor.constraint(equalTo: host.bottomAnchor, constant: 48),
                emblem.widthAnchor.constraint(equalToConstant: 148),
                emblem.heightAnchor.constraint(equalToConstant: 148),
                stack.centerXAnchor.constraint(equalTo: overlay.centerXAnchor),
                stack.centerYAnchor.constraint(equalTo: overlay.centerYAnchor, constant: -36),
                stack.leadingAnchor.constraint(greaterThanOrEqualTo: overlay.leadingAnchor, constant: 24),
                stack.trailingAnchor.constraint(lessThanOrEqualTo: overlay.trailingAnchor, constant: -24),
                progressWrap.widthAnchor.constraint(equalToConstant: 280),
                progressTrack.leadingAnchor.constraint(equalTo: progressWrap.leadingAnchor),
                progressTrack.trailingAnchor.constraint(equalTo: progressWrap.trailingAnchor),
                progressTrack.topAnchor.constraint(equalTo: progressWrap.topAnchor),
                progressTrack.bottomAnchor.constraint(equalTo: progressWrap.bottomAnchor),
                progressTrack.heightAnchor.constraint(equalToConstant: 6),
                progressGlow.leadingAnchor.constraint(equalTo: progressTrack.leadingAnchor),
                progressGlow.topAnchor.constraint(equalTo: progressTrack.topAnchor),
                progressGlow.bottomAnchor.constraint(equalTo: progressTrack.bottomAnchor),
                progressWidthConstraint,
                progressShine.centerYAnchor.constraint(equalTo: progressGlow.centerYAnchor),
                progressShine.leadingAnchor.constraint(equalTo: progressGlow.leadingAnchor, constant: 2),
                progressShine.trailingAnchor.constraint(equalTo: progressGlow.trailingAnchor, constant: -2),
                progressShine.heightAnchor.constraint(equalToConstant: 1)
            ])

            self.loadingOverlay = overlay
            self.loadingLabel = subtitle
            self.loadingProgressFill = progressGlow
            self.loadingProgressTrack = progressTrack
            self.loadingProgressValueLabel = progressValue
            self.loadingProgressWidthConstraint = progressWidthConstraint
        }

        private func raiseNativeChrome() {
            guard let host = containerView, let bar = nativeChromeBar else { return }
            host.bringSubviewToFront(bar)
        }

        private func showLoadingOverlay(subtitle: String) {
            hideLoadingWorkItem?.cancel()
            let bootInk = UIColor(red: 0.02, green: 0.02, blue: 0.01, alpha: 1.0)
            isBootLoadingVisible = true
            loadingLabel?.text = subtitle
            guard let overlay = loadingOverlay else { return }
            overlay.backgroundColor = bootInk
            overlay.isHidden = false
            overlay.isUserInteractionEnabled = true
            overlay.alpha = 1
            containerView?.bringSubviewToFront(overlay)
            raiseNativeChrome()
            webView?.alpha = 0.001
            startLoadingProgress()
        }

        private func hideLoadingOverlay() {
            guard let overlay = loadingOverlay else { return }
            hideLoadingWorkItem?.cancel()
            finishLoadingProgress()
            overlay.isUserInteractionEnabled = false
            webView?.isUserInteractionEnabled = true
            let work = DispatchWorkItem { [weak self] in
                guard let self else { return }
                UIView.animate(withDuration: 0.28, delay: 0, options: [.curveEaseOut]) {
                    overlay.alpha = 0
                    self.webView?.alpha = 1
                } completion: { _ in
                    overlay.isHidden = true
                    overlay.isUserInteractionEnabled = false
                    self.webView?.isUserInteractionEnabled = true
                    self.isBootLoadingVisible = false
                    self.refreshAppearanceBridge()
                }
            }
            hideLoadingWorkItem = work
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.35, execute: work)
        }

        private func startLoadingProgress() {
            loadingProgressTimer?.invalidate()
            loadingProgressValue = 0
            applyLoadingProgress(0)

            let timer = Timer.scheduledTimer(withTimeInterval: 0.06, repeats: true) { [weak self] timer in
                guard let self else {
                    timer.invalidate()
                    return
                }

                if self.loadingProgressValue >= 0.94 {
                    timer.invalidate()
                    return
                }

                let remaining = max(0, 0.94 - self.loadingProgressValue)
                let step = max(0.004, remaining * 0.065)
                self.loadingProgressValue = min(0.94, self.loadingProgressValue + step)
                self.applyLoadingProgress(self.loadingProgressValue)
            }

            loadingProgressTimer = timer
            RunLoop.main.add(timer, forMode: .common)
        }

        private func finishLoadingProgress() {
            loadingProgressTimer?.invalidate()
            loadingProgressTimer = nil
            loadingProgressValue = 1
            applyLoadingProgress(1)
        }

        private func applyLoadingProgress(_ value: CGFloat) {
            let clamped = max(0, min(1, value))
            let fullWidth: CGFloat = 280
            loadingProgressWidthConstraint?.constant = fullWidth * clamped
            loadingProgressValueLabel?.text = "\(Int(round(clamped * 100)))%"

            UIView.animate(withDuration: 0.14, delay: 0, options: [.curveEaseOut, .beginFromCurrentState]) {
                self.loadingOverlay?.layoutIfNeeded()
            } completion: { _ in
                self.applyNobleLineMask()
            }
            applyNobleLineMask()
        }

        private func applyNobleLineMask() {
            guard let track = loadingProgressTrack else { return }
            track.layoutIfNeeded()
            let size = track.bounds.size
            guard size.width > 1, size.height > 1 else { return }
            let path = UIBezierPath()
            path.move(to: CGPoint(x: 0, y: size.height * 0.06))
            path.addLine(to: CGPoint(x: size.width, y: size.height * 0.36))
            path.addLine(to: CGPoint(x: size.width, y: size.height * 0.64))
            path.addLine(to: CGPoint(x: 0, y: size.height * 0.94))
            path.close()
            let mask = CAShapeLayer()
            mask.path = path.cgPath
            track.layer.mask = mask
        }
    }
}

private final class LibraryPDFViewController: UIViewController {
    private let pdfURL: URL
    private let titleText: String
    private let onClose: () -> Void
    private let pdfView = PDFView()
    private let spinner = UIActivityIndicatorView(style: .large)
    private var loadTask: Task<Void, Never>?

    init(pdfURL: URL, titleText: String, onClose: @escaping () -> Void) {
        self.pdfURL = pdfURL
        self.titleText = titleText
        self.onClose = onClose
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0.04, green: 0.08, blue: 0.16, alpha: 1.0)
        title = titleText
        overrideUserInterfaceStyle = .dark

        navigationItem.leftBarButtonItem = UIBarButtonItem(
            title: "Zurueck",
            style: .plain,
            target: self,
            action: #selector(closeTapped)
        )

        pdfView.translatesAutoresizingMaskIntoConstraints = false
        pdfView.autoScales = true
        pdfView.displayMode = .singlePageContinuous
        pdfView.displayDirection = .vertical
        pdfView.backgroundColor = .clear
        view.addSubview(pdfView)

        spinner.translatesAutoresizingMaskIntoConstraints = false
        spinner.color = UIColor(red: 0.92, green: 0.84, blue: 0.62, alpha: 1.0)
        spinner.startAnimating()
        view.addSubview(spinner)

        NSLayoutConstraint.activate([
            pdfView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            pdfView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            pdfView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            pdfView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            spinner.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            spinner.centerYAnchor.constraint(equalTo: view.centerYAnchor)
        ])

        loadTask = Task { [weak self] in
            await self?.loadPDF()
        }
    }

    override func viewDidDisappear(_ animated: Bool) {
        super.viewDidDisappear(animated)
        if isBeingDismissed || navigationController?.isBeingDismissed == true {
            onClose()
        }
    }

    deinit {
        loadTask?.cancel()
    }

    override var preferredStatusBarStyle: UIStatusBarStyle { .lightContent }

    @objc
    private func closeTapped() {
        dismiss(animated: true) { [onClose] in
            onClose()
        }
    }

    @MainActor
    private func showFailure() {
        spinner.stopAnimating()
        let label = UILabel()
        label.translatesAutoresizingMaskIntoConstraints = false
        label.text = "PDF konnte nicht geladen werden."
        label.textColor = UIColor(red: 0.96, green: 0.93, blue: 0.82, alpha: 1.0)
        label.font = .systemFont(ofSize: 16, weight: .semibold)
        label.textAlignment = .center
        label.numberOfLines = 0
        view.addSubview(label)
        NSLayoutConstraint.activate([
            label.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 24),
            label.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -24),
            label.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            label.centerYAnchor.constraint(equalTo: view.centerYAnchor)
        ])
    }

    private func loadPDF() async {
        do {
            let (data, _) = try await URLSession.shared.data(from: pdfURL)
            guard !Task.isCancelled else { return }
            guard let document = PDFDocument(data: data) else {
                await MainActor.run { self.showFailure() }
                return
            }
            await MainActor.run {
                self.pdfView.document = document
                self.spinner.stopAnimating()
            }
        } catch {
            guard !Task.isCancelled else { return }
            await MainActor.run { self.showFailure() }
        }
    }
}
