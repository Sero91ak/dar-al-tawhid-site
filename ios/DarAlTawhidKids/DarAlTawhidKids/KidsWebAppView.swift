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
        configuration.userContentController.add(context.coordinator, name: "darKidsScreenAwake")

#if KIDS_CREATOR_TEST
        let officialMarker = ""
#else
        let officialMarker = "window.DAR_OFFICIAL_IOS_APP=true;window.DAR_KIDS_NATIVE_START=true;"
#endif
        let bridge = """
        (function(){
          try{
            window.DAR_KIDS_IOS_APP=true;
            window.DAR_IOS_NATIVE_APP=true;
            \(officialMarker)
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
        // Keep playback/user-agent compatibility, but never use this marker
        // as proof of owner authorization on the website.
#if KIDS_CREATOR_TEST
        configuration.applicationNameForUserAgent = "DarAlTawhidKids-iOS CreatorTest"
        configuration.userContentController.addUserScript(
            WKUserScript(
                source: "window.DAR_KIDS_TEST_CONTAINER=true;document.documentElement.setAttribute('data-kids-container','creator-test');",
                injectionTime: .atDocumentStart,
                forMainFrameOnly: true
            )
        )
#else
        configuration.applicationNameForUserAgent = "DarAlTawhidKids-iOS"
#endif

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
        private var readingKeepsScreenAwake = false
#if !KIDS_CREATOR_TEST
        private var visitorProgressObservation: NSKeyValueObservation?
#endif
#if KIDS_CREATOR_TEST
        private var pendingCreatorTab: String?
#endif

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
                selector: #selector(appDidEnterBackground),
                name: UIApplication.didEnterBackgroundNotification,
                object: nil
            )
#if KIDS_CREATOR_TEST
            NotificationCenter.default.addObserver(
                self,
                selector: #selector(creatorNavigate(_:)),
                name: Notification.Name("DarKidsCreatorNavigate"),
                object: nil
            )
#else
            NotificationCenter.default.addObserver(
                self,
                selector: #selector(retryVisitorInitialLoad(_:)),
                name: Notification.Name("DarKidsVisitorRetryInitialLoad"),
                object: nil
            )
            // WebKit's real load estimate never reaches 100 before the page is verified.
            visitorProgressObservation = webView.observe(\.estimatedProgress, options: [.new]) { [weak self] page, _ in
                guard let self = self, !self.hasPresentedInitialPage else { return }
                let fraction = min(0.95, max(0.0, page.estimatedProgress))
                DispatchQueue.main.async {
                    NotificationCenter.default.post(
                        name: Notification.Name("DarKidsVisitorLoadProgress"),
                        object: fraction
                    )
                }
            }
#endif
        }

        deinit {
#if !KIDS_CREATOR_TEST
            visitorProgressObservation?.invalidate()
#endif
            NotificationCenter.default.removeObserver(self)
            DispatchQueue.main.async {
                UIApplication.shared.isIdleTimerDisabled = false
            }
            webView?.configuration.userContentController.removeScriptMessageHandler(forName: "darKidsNowPlaying")
            webView?.configuration.userContentController.removeScriptMessageHandler(forName: "darKidsScreenAwake")
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

#if !KIDS_CREATOR_TEST
        @objc private func retryVisitorInitialLoad(_ notice: Notification) {
            guard let page = webView else { return }
            loadKidsHome(in: page)
        }
#endif

#if KIDS_CREATOR_TEST
        // The native menu never grants creator permissions. Only navigation
        // to existing KIDS modules on the separate test Worker is permitted.
        @objc private func creatorNavigate(_ notice: Notification) {
            guard let key = notice.object as? String,
                  ["home", "quran", "stories", "dua", "parents", "academy", "console", "quiz-v4"].contains(key),
                  let page = webView else { return }
            if key == "quiz-v4" {
                // Strict native TEST-only route. No visitor app/web cookies and
                // no review MP3s copied to public or Creator staging assets.
                // The separate Dar Test Worker holds all genuine 450 × 4 clips.
                pendingCreatorTab = "quiz-v4"
                page.load(URLRequest(
                    url: KidsAppShell.v4AuditionURL,
                    cachePolicy: .reloadIgnoringLocalCacheData,
                    timeoutInterval: 30
                ))
                return
            }
            if key == "console" {
                guard let url = URL(string: "https://dar-al-tawhid-kids-creator.sero91ak.workers.dev/kids/test-console/index.html") else { return }
                pendingCreatorTab = nil
                page.load(URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 30))
                return
            }
            if key == "academy" {
                guard let url = URL(string: "https://dar-al-tawhid-kids-creator.sero91ak.workers.dev/kids/akademie/index.html") else { return }
                pendingCreatorTab = nil
                page.load(URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 30))
                return
            }
            let target = key == "home" ? "today" : key
            let onHome = page.url?.host?.lowercased() == "dar-al-tawhid-kids-creator.sero91ak.workers.dev"
                && ["/kids/start", "/kids/start.html", "/kids/", "/kids"].contains(page.url?.path ?? "")
            if onHome {
                activateCreatorTab(target, in: page)
            } else {
                pendingCreatorTab = target
                loadKidsHome(in: page)
            }
        }

        private func activateCreatorTab(_ key: String, in page: WKWebView) {
            // Values come from the hardcoded whitelist, not from a web parameter.
            let query: String
            if key == "quiz-v4" {
                // Only after the separate test page completed its initial load.
                // The Test host's JS loads its genuine V4 review manifest and
                // provides independent touch controls for all four segments.
                query = "try{if(window.openKidsQuizHub){window.openKidsQuizHub()}else{document.getElementById('openQuizButton')?.click()}}catch(e){document.getElementById('openQuizButton')?.click()}"
            } else if key == "dua" {
                query = "document.getElementById('openDuaButton')?.click()"
            } else {
                query = "document.querySelector('.bottom-nav .nav-btn[data-target=\"\(key)\"]')?.click()"
            }
            page.evaluateJavaScript("try{\(query)}catch(e){}", completionHandler: nil)
        }
#endif

        @objc private func appDidBecomeActive() {
            UIApplication.shared.isIdleTimerDisabled = readingKeepsScreenAwake
            guard hasKidsNowPlaying else { return }
            webView?.evaluateJavaScript(
                "try{if(window.DARKidsAudioRemote&&DARKidsAudioRemote.openCurrent)DARKidsAudioRemote.openCurrent()}catch(e){}",
                completionHandler: nil
            )
        }

        @objc private func appDidEnterBackground() {
            UIApplication.shared.isIdleTimerDisabled = false
        }

        private func applyKidsScreenAwake(_ body: [String: Any]) {
            let enabled = body["enabled"] as? Bool == true
            readingKeepsScreenAwake = enabled
            DispatchQueue.main.async {
                UIApplication.shared.isIdleTimerDisabled = enabled
            }
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
            let body = message.body as? [String: Any] ?? [:]
            switch message.name {
            case "darKidsNowPlaying":
                applyKidsNowPlaying(body)
            case "darKidsScreenAwake":
                applyKidsScreenAwake(body)
            default:
                break
            }
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
#if KIDS_CREATOR_TEST
            if let tab = pendingCreatorTab {
                pendingCreatorTab = nil
                activateCreatorTab(tab, in: webView)
            }
#endif
            guard !hasPresentedInitialPage else { return }
            hasPresentedInitialPage = true
#if !KIDS_CREATOR_TEST
            // Do not claim success for a blank/error page or an intermediate redirect.
            webView.evaluateJavaScript(
                "Boolean(document.getElementById('view-today') && document.querySelector('#view-today .hero'))"
            ) { value, _ in
                DispatchQueue.main.async {
                    NotificationCenter.default.post(
                        name: Notification.Name((value as? Bool == true)
                            ? "DarKidsVisitorPageLoaded" : "DarKidsVisitorLoadFailed"),
                        object: nil
                    )
                }
            }
#endif
            UIView.animate(
                withDuration: 0.28,
                delay: 0,
                options: [.allowUserInteraction, .beginFromCurrentState, .curveEaseOut]
            ) {
                webView.alpha = 1
            }
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
#if !KIDS_CREATOR_TEST
            // A canceled request can be a normal redirect/retry; do not dismiss progress
            // or prematurely mark the initial page as presented.
            if (error as NSError).code == NSURLErrorCancelled { return }
            if !hasPresentedInitialPage {
                NotificationCenter.default.post(name: Notification.Name("DarKidsVisitorLoadFailed"), object: nil)
            }
#endif
            presentWebView(webView)
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
#if !KIDS_CREATOR_TEST
            // A canceled request can be a normal redirect/retry; do not dismiss progress
            // or prematurely mark the initial page as presented.
            if (error as NSError).code == NSURLErrorCancelled { return }
            if !hasPresentedInitialPage {
                NotificationCenter.default.post(name: Notification.Name("DarKidsVisitorLoadFailed"), object: nil)
            }
#endif
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

            if scheme == "daraltawhidkids" || scheme == "daraltawhidkidstest" {
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
#if KIDS_CREATOR_TEST
                // CRITICAL: never enter the public visitor host even if an
                // absolute /kids/ deep link is embedded in the test document.
                if !KidsAppShell.isOwnHost(url) {
                    decisionHandler(.cancel)
                    webView.load(URLRequest(
                        url: KidsAppShell.inAppURL(from: url),
                        cachePolicy: .reloadIgnoringLocalCacheData,
                        timeoutInterval: 30
                    ))
                    return
                }
#endif
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
