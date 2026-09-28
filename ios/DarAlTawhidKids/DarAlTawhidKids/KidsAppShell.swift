import Foundation

enum KidsAppShell {
    static let hosts: Set<String> = [
        "dar-al-tawhid.de",
        "www.dar-al-tawhid.de"
    ]

    static let launchURL = URL(string: "https://dar-al-tawhid.de/test/kids/start")!

    static func isKidsURL(_ url: URL) -> Bool {
        let scheme = url.scheme?.lowercased() ?? ""
        if scheme == "daraltawhidkids" { return true }
        guard let host = url.host?.lowercased(), hosts.contains(host) else { return false }
        let path = url.path.lowercased()
        return path == "/test/kids" || path.hasPrefix("/test/kids/")
    }

    static func inAppURL(from incoming: URL) -> URL {
        if incoming.scheme?.lowercased() == "daraltawhidkids" {
            return launchURL
        }
        if isKidsURL(incoming) {
            var components = URLComponents(url: incoming, resolvingAgainstBaseURL: false) ?? URLComponents()
            components.scheme = "https"
            components.host = "dar-al-tawhid.de"
            return components.url ?? launchURL
        }
        return launchURL
    }
}
