import SwiftUI
import UIKit
import WebKit
import AVFoundation
import MediaPlayer
import UserNotifications

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
        configuration.userContentController.add(context.coordinator, name: "darKidsCreatorSplashReady")
        configuration.userContentController.add(context.coordinator, name: "darKidsTestNotifications")
#endif

#if KIDS_CREATOR_TEST
        let officialMarker = ""
#else
        let officialMarker = "window.DAR_OFFICIAL_IOS_APP=true;"
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
#if KIDS_CREATOR_TEST
        // Prevent the bright WKWebView first frame while the image-led test boot loads.
        webView.isOpaque = false
#else
        webView.isOpaque = true
#endif
        webView.backgroundColor = UIColor(red: 12 / 255, green: 38 / 255, blue: 54 / 255, alpha: 1)
        webView.scrollView.backgroundColor = webView.backgroundColor
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.alpha = 1

#if KIDS_CREATOR_TEST
        // Local notification test banners also appear while KIDS TEST is foregrounded.
        UNUserNotificationCenter.current().delegate = context.coordinator
#endif
        context.coordinator.attach(webView)
        context.coordinator.loadKidsHome(in: webView)
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler, UNUserNotificationCenterDelegate {
        private weak var webView: WKWebView?
        private var hasPresentedInitialPage = false
        private var remoteCommandsReady = false
        private var nowPlayingArt: UIImage?
        private var nowPlayingArtURL = ""
        private var hasKidsNowPlaying = false
        private var currentDeepLink = ""
        private var readingKeepsScreenAwake = false
#if KIDS_CREATOR_TEST
        private var pendingCreatorTab: String?
        private var loadProgressObservation: NSKeyValueObservation?
        private var kidsPrayerScheduleRevision = 0
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
            NotificationCenter.default.addObserver(
                self,
                selector: #selector(retryInitialLoad(_:)),
                name: Notification.Name("DarKidsCreatorRetryInitialLoad"),
                object: nil
            )
            // Actual WebKit estimated page-loading progress, capped below 100%
            // until didFinish confirms a completed navigation.
            loadProgressObservation = webView.observe(\.estimatedProgress, options: [.new]) { [weak self] page, _ in
                let fraction = min(0.95, max(0.0, page.estimatedProgress))
                DispatchQueue.main.async { [weak self] in
                    guard self != nil else { return }
                    NotificationCenter.default.post(
                        name: Notification.Name("DarKidsCreatorLoadProgress"),
                        object: fraction
                    )
                }
            }
#endif
        }

        deinit {
            NotificationCenter.default.removeObserver(self)
            DispatchQueue.main.async {
                UIApplication.shared.isIdleTimerDisabled = false
            }
            webView?.configuration.userContentController.removeScriptMessageHandler(forName: "darKidsNowPlaying")
            webView?.configuration.userContentController.removeScriptMessageHandler(forName: "darKidsScreenAwake")
#if KIDS_CREATOR_TEST
            loadProgressObservation?.invalidate()
            webView?.configuration.userContentController.removeScriptMessageHandler(forName: "darKidsCreatorSplashReady")
            webView?.configuration.userContentController.removeScriptMessageHandler(forName: "darKidsTestNotifications")
#endif
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

#if KIDS_CREATOR_TEST
        @objc private func retryInitialLoad(_ notice: Notification) {
            guard let page = webView else { return }
            loadKidsHome(in: page)
        }

        // The native menu never grants creator permissions. Only navigation
        // to existing KIDS modules on the separate test Worker is permitted.
        @objc private func creatorNavigate(_ notice: Notification) {
            guard let key = notice.object as? String,
                  ["home", "quran", "stories", "dua", "parents", "academy", "console"].contains(key),
                  let page = webView else { return }
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
            if key == "dua" {
                query = "document.getElementById('openDuaButton')?.click()"
            } else {
                query = "document.querySelector('.bottom-nav .nav-btn[data-target=\"\(key)\"]')?.click()"
            }
            page.evaluateJavaScript("try{\(query)}catch(e){}", completionHandler: nil)
        }
#endif

        @objc private func appDidBecomeActive() {
#if KIDS_CREATOR_TEST
            // Refresh local Salah reminders on the next foreground visit.
            kidsTestNotifyStatus()
#endif
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

#if KIDS_CREATOR_TEST
        private func kidsTestNotifyResponse(_ status: String, message: String? = nil) {
            let detail: [String: String] = ["status": status, "message": message ?? ""]
            guard let data = try? JSONSerialization.data(withJSONObject: detail),
                  let json = String(data: data, encoding: .utf8) else { return }
            DispatchQueue.main.async { [weak self] in
                self?.webView?.evaluateJavaScript(
                    "window.dispatchEvent(new CustomEvent('dar-kids-test-native-notifications',{detail:\(json)}))",
                    completionHandler: nil
                )
            }
        }

        private func kidsTestNotifyStatus(_ message: String? = nil) {
            UNUserNotificationCenter.current().getNotificationSettings { [weak self] settings in
                let name: String
                switch settings.authorizationStatus {
                case .authorized, .provisional, .ephemeral: name = "granted"
                case .denied: name = "denied"
                default: name = "notDetermined"
                }
                self?.kidsTestNotifyResponse(name, message: message)
            }
        }

        private func handleKidsTestNotify(_ message: WKScriptMessage, body: [String: Any]) {
            guard message.frameInfo.isMainFrame,
                  webView?.url?.host?.lowercased() == "dar-al-tawhid-kids-creator.sero91ak.workers.dev",
                  let action = body["action"] as? String else { return }
            let center = UNUserNotificationCenter.current()
            switch action {
            case "status":
                kidsTestNotifyStatus()
            case "request":
                // The system prompt is only triggered by a parent's explicit button tap.
                center.requestAuthorization(options: [.alert, .badge, .sound]) { [weak self] _, _ in
                    self?.kidsTestNotifyStatus()
                }
            case "test":
                center.getNotificationSettings { [weak self] settings in
                    guard settings.authorizationStatus == .authorized ||
                          settings.authorizationStatus == .provisional else {
                        self?.kidsTestNotifyStatus("Zuerst iOS-Benachrichtigungen erlauben.")
                        return
                    }
                    let content = UNMutableNotificationContent()
                    content.title = "TAWḤĪD KIDS · Test"
                    content.body = "Die lokale iOS-Benachrichtigung funktioniert."
                    content.sound = .default
                    let request = UNNotificationRequest(
                        identifier: "kids.creator.parent.test." + UUID().uuidString,
                        content: content,
                        trigger: UNTimeIntervalNotificationTrigger(timeInterval: 5, repeats: false)
                    )
                    center.add(request) { [weak self] error in
                        self?.kidsTestNotifyStatus(error == nil
                            ? "Eine lokale Testmitteilung ist für fünf Sekunden später geplant."
                            : "Die Testmitteilung konnte nicht eingerichtet werden.")
                    }
                }
            case "syncSchedule":
                // Creator-only local reminders, never APNs or OneSignal.
                // Restrict notifications to real calculated timestamps, at most 48h.
                let rows = body["schedule"] as? [[String: Any]] ?? []
                guard rows.count <= 14 else { return }
                var planned: [(id: String, request: UNNotificationRequest)] = []
                let now = Date()
                var calendar = Calendar(identifier: .gregorian)
                calendar.timeZone = TimeZone(secondsFromGMT: 0)!
                let allowedKeys: Set<String> = ["fajr", "dhuhr", "asr", "maghrib", "isha"]
                for row in rows {
                    guard let key = row["key"] as? String,
                          allowedKeys.contains(key),
                          let day = row["day"] as? String,
                          day.range(of: #"^\d{4}-\d{2}-\d{2}$"#, options: .regularExpression) != nil,
                          let label = row["label"] as? String,
                          let epoch = (row["epoch"] as? NSNumber)?.doubleValue,
                          epoch.isFinite,
                          let advance = (row["advance"] as? NSNumber)?.intValue,
                          [0, 5, 10, 15, 30].contains(advance) else { continue }
                    let time = Date(timeIntervalSince1970: epoch / 1000)
                    guard time.timeIntervalSince(now) >= 60,
                          time.timeIntervalSince(now) <= 48 * 3600 else { continue }
                    let content = UNMutableNotificationContent()
                    content.title = "TAWḤĪD KIDS · " + label
                    content.body = advance == 0
                        ? "Es ist Zeit für dein Gebet."
                        : "In " + String(advance) + " Minuten beginnt dein Gebet."
                    content.sound = .default
                    var components = calendar.dateComponents(
                        [.year, .month, .day, .hour, .minute], from: time)
                    components.timeZone = TimeZone(secondsFromGMT: 0)
                    let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
                    let id = "kids.creator.salah." + key + "." + day
                    planned.append((
                        id: id,
                        request: UNNotificationRequest(
                            identifier: id, content: content, trigger: trigger)
                    ))
                }
                kidsPrayerScheduleRevision += 1
                let revision = kidsPrayerScheduleRevision
                center.getPendingNotificationRequests { [weak self] requests in
                    DispatchQueue.main.async { [weak self] in
                        guard let self,
                              self.kidsPrayerScheduleRevision == revision else { return }
                        let old = requests.map(\.identifier).filter {
                            $0.hasPrefix("kids.creator.salah.")
                        }
                        center.removePendingNotificationRequests(withIdentifiers: old)
                        for item in planned {
                            center.add(item.request) { _ in }
                        }
                        self.kidsTestNotifyStatus(
                            String(planned.count) +
                            " lokale Gebetserinnerungen für die nächsten 48 Stunden geplant.")
                    }
                }
            case "openSettings":
                DispatchQueue.main.async {
                    if let url = URL(string: UIApplication.openSettingsURLString) {
                        UIApplication.shared.open(url)
                    }
                }
            default:
                break
            }
        }

        func userNotificationCenter(
            _ center: UNUserNotificationCenter,
            willPresent notification: UNNotification,
            withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
        ) {
            completionHandler([.banner, .list, .sound])
        }
#endif

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
#if KIDS_CREATOR_TEST
            case "darKidsTestNotifications":
                handleKidsTestNotify(message, body: body)
            case "darKidsCreatorSplashReady":
                // Fired only after the first illustrated web splash frame is ready.
                DispatchQueue.main.async {
                    NotificationCenter.default.post(name: Notification.Name("DarKidsCreatorSplashReady"), object: nil)
                }
#endif
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
#if KIDS_CREATOR_TEST
            NotificationCenter.default.post(
                name: Notification.Name("DarKidsCreatorPageLoaded"),
                object: nil
            )
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
#if KIDS_CREATOR_TEST
            if (error as NSError).code != NSURLErrorCancelled && !hasPresentedInitialPage {
                NotificationCenter.default.post(name: Notification.Name("DarKidsCreatorLoadFailed"), object: nil)
            }
#endif
            presentWebView(webView)
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
#if KIDS_CREATOR_TEST
            if (error as NSError).code != NSURLErrorCancelled && !hasPresentedInitialPage {
                NotificationCenter.default.post(name: Notification.Name("DarKidsCreatorLoadFailed"), object: nil)
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
