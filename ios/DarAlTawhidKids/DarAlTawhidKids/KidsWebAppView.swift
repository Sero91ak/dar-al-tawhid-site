import SwiftUI
import UIKit
import WebKit
import AVFoundation
import MediaPlayer

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
        configuration.userContentController.add(context.coordinator, name: "darKidsNowPlaying")

        let bridge = """
        (function(){
          try{
            window.DAR_KIDS_IOS_APP=true;
            window.DAR_IOS_NATIVE_APP=true;
            window.DAR_OFFICIAL_IOS_APP=true;
            window.DAR_KIDS_NATIVE_NOW_PLAYING=true;
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
        configuration.applicationNameForUserAgent = "DarAlTawhidKids-iOS"

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.bounces = false
        webView.allowsBackForwardNavigationGestures = false
        webView.isOpaque = true
        webView.backgroundColor = UIColor(red: 12 / 255, green: 38 / 255, blue: 54 / 255, alpha: 1)
        webView.scrollView.backgroundColor = webView.backgroundColor
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.alpha = 1

        context.coordinator.attach(webView)
        context.coordinator.loadKidsHome(in: webView)
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
        private weak var webView: WKWebView?
        private var hasPresentedInitialPage = false
        private var remoteCommandsReady = false
        private var nowPlayingArt: UIImage?
        private var nowPlayingArtURL = ""
        private var hasKidsNowPlaying = false
        private var currentDeepLink = ""

        func attach(_ webView: WKWebView) {
            self.webView = webView
            NotificationCenter.default.addObserver(
                self,
                selector: #selector(appDidBecomeActive),
                name: UIApplication.didBecomeActiveNotification,
                object: nil
            )
            NotificationCenter.default.addObserver(
                self,
                selector: #selector(introDidFinish),
                name: .kidsIntroDidFinish,
                object: nil
            )
        }

        @objc private func introDidFinish() {
            guard let webView else { return }
            webView.alpha = 1
            let path = webView.url?.path.lowercased() ?? ""
            if path.isEmpty || webView.url?.scheme == "about" {
                loadKidsHome(in: webView)
            }
        }

        deinit {
            NotificationCenter.default.removeObserver(self)
            webView?.configuration.userContentController.removeScriptMessageHandler(forName: "darKidsNowPlaying")
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

        @objc private func appDidBecomeActive() {
            guard hasKidsNowPlaying else { return }
            webView?.evaluateJavaScript(
                "try{if(window.DARKidsAudioRemote&&DARKidsAudioRemote.openCurrent)DARKidsAudioRemote.openCurrent()}catch(e){}",
                completionHandler: nil
            )
        }

        private func configurePlaybackSession() {
            let session = AVAudioSession.sharedInstance()
            do {
                try session.setCategory(.playback, mode: .spokenAudio, options: [.allowAirPlay, .allowBluetoothA2DP])
                try session.setActive(true)
            } catch {
                // WKWebView audio may still play; Now Playing should not crash the app if activation fails.
            }
        }

        private func applyKidsNowPlaying(_ body: [String: Any]) {
            if (body["clear"] as? Bool) == true {
                hasKidsNowPlaying = false
                currentDeepLink = ""
                MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
                nowPlayingArt = nil
                nowPlayingArtURL = ""
                return
            }

            configurePlaybackSession()
            installRemoteCommandsIfNeeded()
            UIApplication.shared.beginReceivingRemoteControlEvents()

            let title = body["title"] as? String ?? "Geschichte"
            let artist = body["artist"] as? String ?? "DĀR AL TAWḤĪD Kids"
            let album = body["album"] as? String ?? "Kinder-Hörbuch"
            let elapsed = (body["elapsed"] as? NSNumber)?.doubleValue
                ?? Double(body["elapsed"] as? String ?? "")
                ?? 0
            let duration = (body["duration"] as? NSNumber)?.doubleValue
                ?? Double(body["duration"] as? String ?? "")
                ?? 0
            let playing = body["playing"] as? Bool == true
            let artwork = body["artwork"] as? String ?? ""
            let deepLink = body["deepLink"] as? String ?? ""

            hasKidsNowPlaying = true
            currentDeepLink = deepLink
            if !deepLink.isEmpty {
                UserDefaults.standard.set(deepLink, forKey: "darKidsNowPlayingDeepLink")
            }

            var info: [String: Any] = [
                MPMediaItemPropertyTitle: title,
                MPMediaItemPropertyArtist: artist,
                MPMediaItemPropertyAlbumTitle: album,
                MPNowPlayingInfoPropertyElapsedPlaybackTime: max(0, elapsed),
                MPNowPlayingInfoPropertyPlaybackRate: playing ? 1.0 : 0.0,
                MPNowPlayingInfoPropertyMediaType: MPNowPlayingInfoMediaType.audio.rawValue
            ]
            if duration > 0 {
                info[MPMediaItemPropertyPlaybackDuration] = duration
            }
            if let image = nowPlayingArt, nowPlayingArtURL == artwork {
                info[MPMediaItemPropertyArtwork] = MPMediaItemArtwork(boundsSize: image.size) { _ in image }
            }
            MPNowPlayingInfoCenter.default().nowPlayingInfo = info

            guard !artwork.isEmpty, artwork != nowPlayingArtURL, let url = URL(string: artwork) else {
                return
            }
            nowPlayingArtURL = artwork
            nowPlayingArt = nil
            URLSession.shared.dataTask(with: url) { [weak self] data, _, _ in
                guard let self, let data, let image = UIImage(data: data), self.nowPlayingArtURL == artwork else { return }
                DispatchQueue.main.async {
                    self.nowPlayingArt = image
                    var next = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? info
                    next[MPMediaItemPropertyArtwork] = MPMediaItemArtwork(boundsSize: image.size) { _ in image }
                    MPNowPlayingInfoCenter.default().nowPlayingInfo = next
                }
            }.resume()
        }

        private func installRemoteCommandsIfNeeded() {
            guard !remoteCommandsReady else { return }
            remoteCommandsReady = true

            let center = MPRemoteCommandCenter.shared()
            center.playCommand.isEnabled = true
            center.pauseCommand.isEnabled = true
            center.skipBackwardCommand.isEnabled = true
            center.skipForwardCommand.isEnabled = true
            center.changePlaybackPositionCommand.isEnabled = true
            center.skipBackwardCommand.preferredIntervals = [15]
            center.skipForwardCommand.preferredIntervals = [15]

            center.playCommand.addTarget { [weak self] _ in
                self?.evaluateAudioJS("try{if(window.DARKidsAudioRemote)DARKidsAudioRemote.play()}catch(e){}")
                return .success
            }
            center.pauseCommand.addTarget { [weak self] _ in
                self?.evaluateAudioJS("try{if(window.DARKidsAudioRemote)DARKidsAudioRemote.pause()}catch(e){}")
                return .success
            }
            center.skipBackwardCommand.addTarget { [weak self] event in
                let interval = (event as? MPSkipIntervalCommandEvent)?.interval ?? 15
                self?.evaluateAudioJS("try{if(window.DARKidsAudioRemote)DARKidsAudioRemote.seekBy(-\(interval))}catch(e){}")
                return .success
            }
            center.skipForwardCommand.addTarget { [weak self] event in
                let interval = (event as? MPSkipIntervalCommandEvent)?.interval ?? 15
                self?.evaluateAudioJS("try{if(window.DARKidsAudioRemote)DARKidsAudioRemote.seekBy(\(interval))}catch(e){}")
                return .success
            }
            center.changePlaybackPositionCommand.addTarget { [weak self] event in
                guard let position = (event as? MPChangePlaybackPositionCommandEvent)?.positionTime else {
                    return .commandFailed
                }
                self?.evaluateAudioJS("try{if(window.DARKidsAudioRemote)DARKidsAudioRemote.seekTo(\(position))}catch(e){}")
                return .success
            }
        }

        private func evaluateAudioJS(_ source: String) {
            DispatchQueue.main.async { [weak self] in
                self?.webView?.evaluateJavaScript(source, completionHandler: nil)
            }
        }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard message.name == "darKidsNowPlaying" else { return }
            applyKidsNowPlaying(message.body as? [String: Any] ?? [:])
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
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

            if scheme == "daraltawhidkids" {
                decisionHandler(.cancel)
                webView.load(
                    URLRequest(
                        url: KidsAppShell.inAppURL(from: url),
                        cachePolicy: .reloadIgnoringLocalCacheData,
                        timeoutInterval: 30
                    )
                )
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
                webView.load(
                    URLRequest(
                        url: KidsAppShell.inAppURL(from: url),
                        cachePolicy: .reloadIgnoringLocalCacheData,
                        timeoutInterval: 30
                    )
                )
            }
            return nil
        }
    }
}
