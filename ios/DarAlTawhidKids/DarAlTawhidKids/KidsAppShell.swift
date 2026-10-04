import Foundation

enum KidsAppShell {
    static let hosts: Set<String> = [
        "dar-al-tawhid.de",
        "www.dar-al-tawhid.de"
    ]

    static let launchURL = URL(string: "https://dar-al-tawhid.de/kids/start?kv=kids-shell-v42-sahabiyyat1112")!

    static func isOwnHost(_ url: URL) -> Bool {
        guard let host = url.host?.lowercased() else { return false }
        return hosts.contains(host)
    }

    static func isKidsURL(_ url: URL) -> Bool {
        let scheme = url.scheme?.lowercased() ?? ""
        if scheme == "daraltawhidkids" { return true }
        guard isOwnHost(url) else { return false }
        let path = url.path.lowercased()
        return path == "/kids" || path.hasPrefix("/kids/") || path == "/test/kids" || path.hasPrefix("/test/kids/")
    }

    static func inAppURL(from incoming: URL) -> URL {
        if incoming.scheme?.lowercased() == "daraltawhidkids" {
            return launchURL
        }
        if isKidsURL(incoming) {
            var components = URLComponents(url: incoming, resolvingAgainstBaseURL: false) ?? URLComponents()
            components.scheme = "https"
            components.host = "dar-al-tawhid.de"
            let path = components.path
            if path.hasPrefix("/test/kids") {
                components.path = "/kids" + String(path.dropFirst("/test/kids".count))
            }
            return components.url ?? launchURL
        }
        return launchURL
    }
}
