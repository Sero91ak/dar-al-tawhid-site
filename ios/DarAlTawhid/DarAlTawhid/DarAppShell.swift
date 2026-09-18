import Foundation

enum DarAppShell {
    /// Native iOS is the live shell. Test lives only at /test/ until explicitly released.
    static let usesStagingWeb = false

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
        if scheme == DarDeepLink.scheme { return true }
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

    /// Map any DAR URL onto this app's own web shell (never /test/ in the live native app).
    static func inAppURL(from incoming: URL) -> URL {
        let source = sourceURL(from: incoming) ?? incoming
        if source.scheme == DarDeepLink.scheme {
            let dest = DarDeepLink.destination(from: source)
            return hashed(dest.webHash)
        }
        guard isOwnHost(source) else { return launchURL }

        var components = URLComponents(url: source, resolvingAgainstBaseURL: false) ?? URLComponents()
        components.scheme = "https"
        components.host = "dar-al-tawhid.de"
        components.port = nil
        var path = components.path
        if usesStagingWeb {
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
