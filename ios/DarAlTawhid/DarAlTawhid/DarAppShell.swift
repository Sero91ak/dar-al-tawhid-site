import Foundation
import MediaPlayer

enum DarAppShell {
    /// iOS-Test-Webbesucher-App: Web-Shell unter /test/, nicht Admin, nicht Live-Besucher.
    static let usesStagingWeb = true

    static let hosts: Set<String> = [
        "dar-al-tawhid.de",
        "www.dar-al-tawhid.de"
    ]

    static let liveURL = URL(string: "https://dar-al-tawhid.de/#home")!
    static let stagingURL = URL(string: "https://dar-al-tawhid.de/test/?env=staging&source=ios-native#home")!

    static var launchURL: URL {
        usesStagingWeb ? stagingURL : liveURL
    }

    static func isOwnHost(_ url: URL) -> Bool {
        let scheme = url.scheme?.lowercased() ?? ""
        if scheme == DarDeepLink.scheme || scheme == DarDeepLink.testScheme { return true }
        guard let host = url.host?.lowercased() else { return false }
        return (scheme == "https" || scheme == "http") && hosts.contains(host)
    }

    static func postId(from url: URL) -> String {
        let items = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems ?? []
        if let post = items.first(where: { $0.name == "post" })?.value, !post.isEmpty {
            return post
        }
        let fragment = url.fragment ?? ""
        let parts = fragment.split(separator: "/").map(String.init)
        if parts.count >= 2, parts[0] == "post" { return parts[1] }
        return ""
    }

    static func sourceURL(from incoming: URL) -> URL? {
        if incoming.scheme == DarDeepLink.scheme {
            let items = URLComponents(url: incoming, resolvingAgainstBaseURL: false)?.queryItems ?? []
            if let encoded = items.first(where: { $0.name == "src" || $0.name == "u" })?.value,
               let decoded = encoded.removingPercentEncoding,
               let nested = URL(string: decoded) {
                return nested
            }
        }
        return incoming
    }

    /// Map any DAR URL onto this app's Test web shell. Never /admin.
    static func inAppURL(from incoming: URL) -> URL {
        let source = sourceURL(from: incoming) ?? incoming
        if DarDeepLink.isAdminURL(source) {
            return hashed(DarDeepLink.Destination.quranPlayer.webHash)
        }
        let scheme = (source.scheme ?? "").lowercased()
        if scheme == DarDeepLink.scheme || scheme == DarDeepLink.testScheme {
            let dest = DarDeepLink.destination(from: source)
            return hashed(dest.webHash)
        }
        guard isOwnHost(source) else { return launchURL }

        var components = URLComponents(url: source, resolvingAgainstBaseURL: false) ?? URLComponents()
        components.scheme = "https"
        components.host = "dar-al-tawhid.de"
        components.port = nil
        var path = components.path
        if path == "/admin" || path.hasPrefix("/admin/") {
            return hashed(DarDeepLink.Destination.quranPlayer.webHash)
        }
        if usesStagingWeb {
            if path.hasPrefix("/admin") {
                return hashed(DarDeepLink.Destination.quranPlayer.webHash)
            }
            if !path.hasPrefix("/test") {
                path = "/test" + (path == "/" || path.isEmpty ? "/" : path)
            }
        } else if path.hasPrefix("/test/") {
            path = String(path.dropFirst("/test".count))
            if path.isEmpty { path = "/" }
        } else if path == "/test" {
            path = "/"
        }
        components.path = path.isEmpty ? "/" : path
        if let fragment = components.fragment, DarDeepLink.isQuranPlayerHash(fragment) {
            UserDefaults.standard.set("#\(fragment.trimmingCharacters(in: CharacterSet(charactersIn: "#")))", forKey: "darQuranPlayerResumeHashV1")
        }
        if let url = components.url { return url }
        return launchURL
    }

    static func hashed(_ hash: String) -> URL {
        var components = URLComponents(url: launchURL, resolvingAgainstBaseURL: false) ?? URLComponents()
        let clean = hash.hasPrefix("#") ? String(hash.dropFirst()) : hash
        components.fragment = clean
        return components.url ?? launchURL
    }
}

enum DarQuranNowPlaying {
    private static var installed = false
    private static var evalJS: ((String) -> Void)?

    static func install(eval: @escaping (String) -> Void) {
        evalJS = eval
        guard !installed else { return }
        installed = true
        let center = MPRemoteCommandCenter.shared()
        center.playCommand.isEnabled = true
        center.pauseCommand.isEnabled = true
        center.nextTrackCommand.isEnabled = true
        center.previousTrackCommand.isEnabled = true
        center.playCommand.addTarget { _ in
            evalJS?(
                """
                (function(){
                  try{
                    if(window.DARQuranPlayer&&DARQuranPlayer.open)DARQuranPlayer.open();
                    if(window.DARQuranAudio&&DARQuranAudio.resume)DARQuranAudio.resume();
                    console.log('[QURAN_DEEPLINK] opened full player: remote-play');
                  }catch(e){}
                })();
                """
            )
            return .success
        }
        center.pauseCommand.addTarget { _ in
            evalJS?("try{if(window.DARQuranAudio)DARQuranAudio.pause()}catch(e){}")
            return .success
        }
        center.nextTrackCommand.addTarget { _ in
            evalJS?("try{if(window.DARQuranAudio)DARQuranAudio.nextAyah()}catch(e){}")
            return .success
        }
        center.previousTrackCommand.addTarget { _ in
            evalJS?("try{if(window.DARQuranAudio)DARQuranAudio.previousAyah()}catch(e){}")
            return .success
        }
        center.togglePlayPauseCommand.isEnabled = true
        center.togglePlayPauseCommand.addTarget { _ in
            evalJS?(
                """
                (function(){
                  try{
                    if(window.DARQuranPlayer&&DARQuranPlayer.open)DARQuranPlayer.open();
                    var a=document.getElementById('darQuranPlayerAudio');
                    if(!a)return;
                    if(a.paused){if(window.DARQuranAudio)DARQuranAudio.resume()}else{if(window.DARQuranAudio)DARQuranAudio.pause()}
                  }catch(e){}
                })();
                """
            )
            return .success
        }
    }

    static func update(_ body: [String: Any]) {
        var info: [String: Any] = [:]
        info[MPMediaItemPropertyTitle] = body["title"] as? String ?? "Qurʾān"
        info[MPMediaItemPropertyArtist] = body["artist"] as? String ?? "Dar Test"
        info[MPMediaItemPropertyAlbumTitle] = "Dar Test"
        if let elapsed = body["elapsed"] as? Double {
            info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = elapsed
        }
        if let duration = body["duration"] as? Double {
            info[MPMediaItemPropertyPlaybackDuration] = duration
        }
        let playing = (body["playing"] as? Bool) == true
        info[MPNowPlayingInfoPropertyPlaybackRate] = playing ? 1.0 : 0.0
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }

    static func clear() {
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
    }
}
