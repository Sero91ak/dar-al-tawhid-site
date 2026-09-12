import SwiftUI
import UIKit
import WebKit

/// Clean iOS shell. The live visitor app is the only source for layout,
/// navigation and content; native code only provides platform bridges.
struct WebAppView: UIViewRepresentable {
    var destination: DarDeepLink.Destination? = nil
    var openURL: URL? = nil
    var openNonce = UUID()

    private static let messageNames = [
        "darNative",
        "darPushSettings",
        "darPushTest",
        "darAppIcon",
        "darHaptic"
    ]

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> UIView {
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        configuration.websiteDataStore = .default()
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true

        let contentController = WKUserContentController()
        Self.messageNames.forEach {
            contentController.add(context.coordinator, name: $0)
        }
        contentController.addUserScript(
            WKUserScript(
                source: Self.nativeBootBridge,
                injectionTime: .atDocumentStart,
                forMainFrameOnly: true
            )
        )
        contentController.addUserScript(
            WKUserScript(
                source: Self.nativeOnlyFooterStyle,
                injectionTime: .atDocumentEnd,
                forMainFrameOnly: true
            )
        )
        contentController.addUserScript(
            WKUserScript(
                source: Self.nativeQuickAccessBridge,
                injectionTime: .atDocumentEnd,
                forMainFrameOnly: true
            )
        )
        configuration.userContentController = contentController

        let host = UIView()
        host.backgroundColor = UIColor(red: 0.02, green: 0.02, blue: 0.01, alpha: 1)

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.backgroundColor = host.backgroundColor
        webView.isOpaque = false
        webView.scrollView.backgroundColor = host.backgroundColor
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.allowsBackForwardNavigationGestures = true
        webView.customUserAgent = "DarAlTawhid-iOS/1.0 WKWebView"
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        if #available(iOS 16.4, *) {
            webView.isInspectable = true
        }

        host.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: host.topAnchor),
            webView.leadingAnchor.constraint(equalTo: host.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: host.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: host.bottomAnchor)
        ])

        context.coordinator.attach(webView: webView, host: host)
        webView.load(URLRequest(url: DarAppShell.launchURL, cachePolicy: .useProtocolCachePolicy))
        return host
    }

    func updateUIView(_ uiView: UIView, context: Context) {
        guard context.coordinator.lastOpenNonce != openNonce else { return }
        context.coordinator.lastOpenNonce = openNonce
        if let openURL {
            context.coordinator.open(DarAppShell.inAppURL(from: openURL))
        } else if let destination {
            context.coordinator.open(destination)
        }
    }

    static func dismantleUIView(_ uiView: UIView, coordinator: Coordinator) {
        coordinator.detach()
    }

    private static var nativeBootBridge: String {
        let device = DarPushNotifications.deviceId()
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "\"", with: "\\\"")
        return """
        (function(){
          try{
            window.DAR_IOS_NATIVE_APP=true;
            window.DAR_IOS_NATIVE_PUSH=true;
            window.DAR_IOS_DEVICE_ID="\(device)";
            try{localStorage.setItem("darPushExternalIdV1",window.DAR_IOS_DEVICE_ID)}catch(e){}
            window.Notification=window.Notification||function(){};
            window.__darPushPermission=window.__darPushPermission||"default";
            try{
              Object.defineProperty(window.Notification,"permission",{
                configurable:true,
                get:function(){return window.__darPushPermission||"default"}
              });
            }catch(e){}
            window.Notification.requestPermission=function(){
              try{webkit.messageHandlers.darNative.postMessage({type:"notifications"})}catch(e){}
              return Promise.resolve(window.__darPushPermission||"default");
            };
          }catch(e){}
        })();
        """
    }

    /// This is the only native visual override: install controls do not belong
    /// inside an already installed iOS app.
    private static let nativeOnlyFooterStyle = """
    (function(){
      if(document.getElementById("dar-ios-clean-shell-style"))return;
      var style=document.createElement("style");
      style.id="dar-ios-clean-shell-style";
      style.textContent=[
        "html body #footerAppSave,html body .footer-app-save,html body .footer-action-save{display:none!important;visibility:hidden!important;}",
        "html body .footer .footer-actions,html body.is-home-route .footer .footer-actions{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;width:min(430px,calc(100% - 16px))!important;max-width:430px!important;margin-left:auto!important;margin-right:auto!important;justify-content:center!important;}"
      ].join("\\n");
      (document.head||document.documentElement).appendChild(style);
    })();
    """

    private static let nativeQuickAccessBridge = """
    (function(){
      if(window.__darIosDirectQuickAccess)return;
      window.__darIosDirectQuickAccess=true;

      function closeMenu(){
        try{
          if(typeof closeQuickAccessMenu==="function")closeQuickAccessMenu();
        }catch(e){}
      }

      function openPushSettings(){
        try{
          if(typeof navigate==="function")navigate("more");
          else location.hash="#more";
        }catch(e){location.hash="#more"}

        var attempts=0;
        function reveal(){
          attempts++;
          var toggle=document.getElementById("prayerPushAccordionToggle");
          var body=document.getElementById("prayerPushSettingsBody");
          if(toggle){
            try{
              if(typeof setPrayerPushAccordionOpen==="function"){
                setPrayerPushAccordionOpen(true);
                if(typeof updatePrayerPushAccordionUi==="function")updatePrayerPushAccordionUi(true);
              }else if(toggle.getAttribute("aria-expanded")!=="true"){
                toggle.click();
              }
              (body||toggle).scrollIntoView({behavior:"smooth",block:"center"});
            }catch(e){}
            return;
          }
          if(attempts<12)setTimeout(reveal,80);
        }
        setTimeout(reveal,20);
      }

      document.addEventListener("click",function(event){
        var button=event.target&&event.target.closest
          ?event.target.closest("#quickAccessMenu [data-qa-action]")
          :null;
        if(!button)return;
        var action=button.getAttribute("data-qa-action");
        if(action!=="orient"&&action!=="saved"&&action!=="remind")return;
        event.preventDefault();
        event.stopPropagation();
        if(event.stopImmediatePropagation)event.stopImmediatePropagation();
        closeMenu();
        try{
          if(action==="orient"){
            if(typeof openQiblaFromFloat==="function")openQiblaFromFloat();
            else location.hash="#qibla";
          }else if(action==="saved"){
            if(typeof navigate==="function")navigate("saved");
            else location.hash="#saved";
          }else{
            openPushSettings();
          }
        }catch(e){}
      },true);
    })();
    """

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
        weak var webView: WKWebView?
        weak var host: UIView?
        var lastOpenNonce: UUID?

        private var pendingURL: URL?
        private var pendingDestination: DarDeepLink.Destination?
        private var loadingOverlay: UIView?
        private var progressLabel: UILabel?
        private var progressWidth: NSLayoutConstraint?
        private var progressTimer: Timer?
        private var progress: CGFloat = 0

        func attach(webView: WKWebView, host: UIView) {
            self.webView = webView
            self.host = host
            installLoadingOverlay(in: host)
            showLoading()
            DarNativePermissions.shared.attach(webView: webView)
            NotificationCenter.default.addObserver(
                self,
                selector: #selector(injectNativePushBridge),
                name: .darNativePushReady,
                object: nil
            )
            NotificationCenter.default.addObserver(
                self,
                selector: #selector(applyPushPermission(_:)),
                name: .darNativePushPermission,
                object: nil
            )
            DarPushNotifications.requestAuthorization()
        }

        func detach() {
            progressTimer?.invalidate()
            NotificationCenter.default.removeObserver(self)
            guard let controller = webView?.configuration.userContentController else { return }
            WebAppView.messageNames.forEach {
                controller.removeScriptMessageHandler(forName: $0)
            }
        }

        func open(_ destination: DarDeepLink.Destination) {
            guard let webView, webView.url != nil else {
                pendingDestination = destination
                return
            }
            pendingDestination = nil
            let directHash = destination == .qibla ? "#qibla" : destination.webHash
            let script = """
            (function(){
              var destination=\(Self.jsString(destination.rawValue));
              var hash=\(Self.jsString(directHash));
              try{
                if(destination==="qibla"){
                  if(typeof openQiblaFromFloat==="function"){
                    openQiblaFromFloat();
                    return;
                  }
                  if(typeof navigate==="function"){
                    navigate("qibla");
                    return;
                  }
                }
                if(typeof navigate==="function"){
                  navigate(destination);
                  return;
                }
              }catch(e){}
              window.location.hash=hash;
            })();
            """
            webView.evaluateJavaScript(script)
        }

        func open(_ url: URL) {
            guard let webView, webView.url != nil else {
                pendingURL = url
                return
            }
            pendingURL = nil
            webView.load(URLRequest(url: url))
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            showLoading()
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            finishLoading()
            injectNativePushBridge()
            if let url = pendingURL {
                pendingURL = nil
                open(url)
            } else if let destination = pendingDestination {
                pendingDestination = nil
                open(destination)
            }
        }

        func webView(
            _ webView: WKWebView,
            didFail navigation: WKNavigation!,
            withError error: Error
        ) {
            guard (error as NSError).code != NSURLErrorCancelled else { return }
            finishLoading()
        }

        func webView(
            _ webView: WKWebView,
            didFailProvisionalNavigation navigation: WKNavigation!,
            withError error: Error
        ) {
            guard (error as NSError).code != NSURLErrorCancelled else { return }
            finishLoading()
        }

        func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
            showLoading()
            webView.reload()
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
            if url.scheme?.lowercased() == DarDeepLink.scheme {
                open(DarDeepLink.destination(from: url))
                decisionHandler(.cancel)
                return
            }
            if DarAppShell.isOwnHost(url) {
                decisionHandler(.allow)
                return
            }
            let scheme = url.scheme?.lowercased() ?? ""
            if ["http", "https", "mailto", "tel", "sms"].contains(scheme) {
                UIApplication.shared.open(url)
            }
            decisionHandler(.cancel)
        }

        @available(iOS 15.0, *)
        func webView(
            _ webView: WKWebView,
            requestGeolocationPermissionFor origin: WKSecurityOrigin,
            initiatedByFrame frame: WKFrameInfo,
            decisionHandler: @escaping (WKPermissionDecision) -> Void
        ) {
            DarNativePermissions.shared.decideGeolocation(decisionHandler)
        }

        func userContentController(
            _ userContentController: WKUserContentController,
            didReceive message: WKScriptMessage
        ) {
            let body = message.body as? [String: Any] ?? [:]
            switch message.name {
            case "darNative":
                DarNativePermissions.shared.handleWebMessage(message.body)
            case "darPushSettings":
                DarPushNotifications.applyWebPrayerSettings(body)
            case "darPushTest":
                DarPushNotifications.showTest(
                    title: String(describing: body["title"] ?? "[Test] DĀR AL TAWḤĪD"),
                    body: String(describing: body["body"] ?? "Test-Benachrichtigung"),
                    type: String(describing: body["type"] ?? "prayer"),
                    prayer: String(describing: body["prayer"] ?? ""),
                    mode: String(describing: body["mode"] ?? "")
                )
            case "darAppIcon":
                DarAppIcons.set(body["name"] as? String ?? body["id"] as? String ?? "")
            case "darHaptic":
                DarHaptics.play(raw: body["style"] as? String ?? "light")
            default:
                break
            }
        }

        @objc private func applyPushPermission(_ note: Notification) {
            let status = String(describing: note.userInfo?["status"] ?? "default")
            webView?.evaluateJavaScript(
                "window.__darPushPermission=\(Self.jsString(status));",
                completionHandler: nil
            )
            injectNativePushBridge()
        }

        @objc private func injectNativePushBridge() {
            let subscription = DarPushNotifications.lastSubscriptionId()
            let token = DarPushNotifications.pushToken()
            let device = DarPushNotifications.deviceId()
            let script = """
            (function(){
              window.DAR_IOS_NATIVE_APP=true;
              window.DAR_IOS_NATIVE_PUSH=true;
              window.DAR_IOS_ONESIGNAL_ID=\(Self.jsString(subscription));
              window.DAR_IOS_PUSH_TOKEN=\(Self.jsString(token));
              window.DAR_IOS_DEVICE_ID=\(Self.jsString(device));
              try{if(window.DAR_IOS_DEVICE_ID)localStorage.setItem("darPushExternalIdV1",window.DAR_IOS_DEVICE_ID)}catch(e){}
              function state(){
                return {
                  ready:true,
                  optedIn:(window.__darPushPermission==="granted"),
                  subscriptionId:window.DAR_IOS_ONESIGNAL_ID||"",
                  token:window.DAR_IOS_PUSH_TOKEN||"",
                  os:window.OneSignal||{}
                };
              }
              window.hasNotificationApi=function(){return true};
              window.getNotificationPermission=function(){return window.__darPushPermission||"default"};
              window.waitForPushSubscriptionReady=function(){return Promise.resolve(state())};
              window.waitForPushOptIn=function(){return window.Notification.requestPermission().then(function(p){return p==="granted"})};
              window.ensureOneSignalPushSubscription=window.waitForPushOptIn;
              window.ensureOneSignalServiceWorkerReady=function(){return Promise.resolve(null)};
              window.getOneSignalServiceWorkerRegistration=function(){return Promise.resolve(null)};
              if(typeof readOneSignalPushSubscriptionState==="function"){
                readOneSignalPushSubscriptionState=state;
              }
              if(typeof currentOneSignalPushIds==="function"){
                currentOneSignalPushIds=function(){
                  return {
                    externalId:window.DAR_IOS_DEVICE_ID||"",
                    subscriptionId:window.DAR_IOS_ONESIGNAL_ID||"",
                    token:window.DAR_IOS_PUSH_TOKEN||""
                  };
                };
              }
            })();
            """
            webView?.evaluateJavaScript(script, completionHandler: nil)
        }

        private func installLoadingOverlay(in host: UIView) {
            let overlay = UIView()
            overlay.translatesAutoresizingMaskIntoConstraints = false
            overlay.backgroundColor = UIColor(red: 0.02, green: 0.02, blue: 0.01, alpha: 1)
            overlay.layer.zPosition = 10_000

            let stack = UIStackView()
            stack.translatesAutoresizingMaskIntoConstraints = false
            stack.axis = .vertical
            stack.alignment = .center
            stack.spacing = 20

            let mark = UIImageView(image: UIImage(named: "BrandMark"))
            mark.translatesAutoresizingMaskIntoConstraints = false
            mark.contentMode = .scaleAspectFit
            mark.layer.cornerRadius = 74
            mark.clipsToBounds = true
            mark.layer.borderWidth = 1
            mark.layer.borderColor = UIColor(red: 0.79, green: 0.66, blue: 0.42, alpha: 0.45).cgColor

            let title = UILabel()
            title.attributedText = NSAttributedString(
                string: "DĀR AL TAWḤĪD",
                attributes: [
                    .font: UIFont(name: "Georgia-Bold", size: 34)
                        ?? UIFont.systemFont(ofSize: 34, weight: .bold),
                    .foregroundColor: UIColor(red: 0.83, green: 0.71, blue: 0.42, alpha: 1),
                    .kern: 2.04
                ]
            )
            title.textAlignment = .center

            let subtitle = UILabel()
            subtitle.text = "Quran • Sunnah • Athar"
            subtitle.font = .systemFont(ofSize: 15, weight: .semibold)
            subtitle.textColor = UIColor(red: 0.76, green: 0.72, blue: 0.62, alpha: 1)

            let track = UIView()
            track.translatesAutoresizingMaskIntoConstraints = false
            track.backgroundColor = UIColor(red: 0.79, green: 0.66, blue: 0.42, alpha: 0.16)
            track.layer.cornerRadius = 3
            track.clipsToBounds = true

            let fill = UIView()
            fill.translatesAutoresizingMaskIntoConstraints = false
            fill.backgroundColor = UIColor(red: 0.93, green: 0.84, blue: 0.56, alpha: 1)
            fill.layer.cornerRadius = 3
            track.addSubview(fill)
            let width = fill.widthAnchor.constraint(equalToConstant: 0)

            let label = UILabel()
            label.text = "0%"
            label.font = .monospacedDigitSystemFont(ofSize: 16, weight: .semibold)
            label.textColor = UIColor(red: 0.88, green: 0.81, blue: 0.64, alpha: 0.96)

            [mark, title, subtitle, track, label].forEach(stack.addArrangedSubview)
            overlay.addSubview(stack)
            host.addSubview(overlay)

            NSLayoutConstraint.activate([
                overlay.topAnchor.constraint(equalTo: host.topAnchor),
                overlay.leadingAnchor.constraint(equalTo: host.leadingAnchor),
                overlay.trailingAnchor.constraint(equalTo: host.trailingAnchor),
                overlay.bottomAnchor.constraint(equalTo: host.bottomAnchor),
                stack.centerXAnchor.constraint(equalTo: overlay.centerXAnchor),
                stack.centerYAnchor.constraint(equalTo: overlay.centerYAnchor, constant: -30),
                stack.leadingAnchor.constraint(greaterThanOrEqualTo: overlay.leadingAnchor, constant: 24),
                stack.trailingAnchor.constraint(lessThanOrEqualTo: overlay.trailingAnchor, constant: -24),
                mark.widthAnchor.constraint(equalToConstant: 148),
                mark.heightAnchor.constraint(equalToConstant: 148),
                track.widthAnchor.constraint(equalToConstant: 280),
                track.heightAnchor.constraint(equalToConstant: 6),
                fill.leadingAnchor.constraint(equalTo: track.leadingAnchor),
                fill.topAnchor.constraint(equalTo: track.topAnchor),
                fill.bottomAnchor.constraint(equalTo: track.bottomAnchor),
                width
            ])

            loadingOverlay = overlay
            progressLabel = label
            progressWidth = width
        }

        private func showLoading() {
            guard let overlay = loadingOverlay else { return }
            progressTimer?.invalidate()
            progress = 0
            updateProgress(0)
            overlay.alpha = 1
            overlay.isHidden = false
            host?.bringSubviewToFront(overlay)
            let timer = Timer.scheduledTimer(withTimeInterval: 0.06, repeats: true) { [weak self] timer in
                guard let self else {
                    timer.invalidate()
                    return
                }
                let remaining = max(0, 0.94 - self.progress)
                self.progress = min(0.94, self.progress + max(0.004, remaining * 0.065))
                self.updateProgress(self.progress)
                if self.progress >= 0.94 {
                    timer.invalidate()
                }
            }
            progressTimer = timer
            RunLoop.main.add(timer, forMode: .common)
        }

        private func finishLoading() {
            progressTimer?.invalidate()
            progressTimer = nil
            updateProgress(1)
            guard let overlay = loadingOverlay else { return }
            UIView.animate(withDuration: 0.28, delay: 0.25, options: [.curveEaseOut]) {
                overlay.alpha = 0
            } completion: { _ in
                overlay.isHidden = true
            }
        }

        private func updateProgress(_ value: CGFloat) {
            let clamped = min(1, max(0, value))
            progressWidth?.constant = 280 * clamped
            progressLabel?.text = "\(Int((clamped * 100).rounded()))%"
            UIView.animate(withDuration: 0.12) {
                self.loadingOverlay?.layoutIfNeeded()
            }
        }

        private static func jsString(_ value: String) -> String {
            let data = try? JSONSerialization.data(withJSONObject: [value])
            guard let data,
                  let json = String(data: data, encoding: .utf8),
                  json.count >= 2 else { return "\"\"" }
            return String(json.dropFirst().dropLast())
        }
    }
}
