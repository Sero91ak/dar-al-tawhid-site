import Foundation

enum DarDeepLink {
    static let scheme = "daraltawhid"

    enum Destination: Equatable {
        case home
        case prayer
        case qibla
        case quran
        case duas
        case more
        case hash(String)

        var webHash: String {
            switch self {
            case .home: return "#home"
            case .prayer, .qibla: return "#prayer"
            case .quran: return "#quran"
            case .duas: return "#duas"
            case .more: return "#more"
            case .hash(let raw):
                let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
                if trimmed.isEmpty { return "#home" }
                return trimmed.hasPrefix("#") ? trimmed : "#\(trimmed)"
            }
        }

        var url: URL {
            var components = URLComponents()
            components.scheme = DarDeepLink.scheme
            components.host = "open"
            let path = String(webHash.dropFirst())
            components.queryItems = [URLQueryItem(name: "h", value: path)]
            return components.url ?? URL(string: "\(DarDeepLink.scheme)://home")!
        }
    }

    static func destination(from url: URL) -> Destination {
        if url.scheme == scheme {
            if let fromInApp = destinationFromInApp(url) {
                return fromInApp
            }
            if url.host == "open" || url.path == "/open" {
                if let hash = queryValue("h", in: url), !hash.isEmpty {
                    return .hash(hash)
                }
            }
            let host = (url.host ?? url.path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))).lowercased()
            switch host {
            case "home": return .home
            case "prayer": return .prayer
            case "qibla": return .qibla
            case "quran": return .quran
            case "duas", "dua": return .duas
            case "more": return .more
            default: break
            }
        }
        if isSiteHost(url.host), let fragment = url.fragment, !fragment.isEmpty {
            return .hash(fragment)
        }
        if let fragment = url.fragment, !fragment.isEmpty {
            return .hash(fragment)
        }
        return .home
    }

    static func quranHash(fromRef ref: String) -> String? {
        let pattern = #"(\d+)\s*:\s*(\d+)"#
        guard let regex = try? NSRegularExpression(pattern: pattern) else { return nil }
        let ns = ref as NSString
        let range = NSRange(location: 0, length: ns.length)
        guard let match = regex.firstMatch(in: ref, range: range),
              match.numberOfRanges >= 3 else { return nil }
        let surah = ns.substring(with: match.range(at: 1))
        let ayah = ns.substring(with: match.range(at: 2))
        guard Int(surah) != nil, Int(ayah) != nil else { return nil }
        return "#quran-surah/\(surah)/\(ayah)"
    }

    private static func destinationFromInApp(_ url: URL) -> Destination? {
        let host = (url.host ?? "").lowercased()
        let path = url.path.lowercased()
        guard host == "in-app" || path.contains("in-app") else { return nil }
        guard let src = queryValue("src", in: url),
              let srcURL = URL(string: src) else { return .home }
        if let fragment = srcURL.fragment, !fragment.isEmpty {
            return .hash(fragment)
        }
        if isSiteHost(srcURL.host) {
            return .home
        }
        return .home
    }

    private static func queryValue(_ name: String, in url: URL) -> String? {
        let items = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems
        guard let raw = items?.first(where: { $0.name == name })?.value else { return nil }
        return raw.removingPercentEncoding ?? raw
    }

    private static func isSiteHost(_ host: String?) -> Bool {
        let h = (host ?? "").lowercased()
        return h == "dar-al-tawhid.de" || h == "www.dar-al-tawhid.de"
    }
}
