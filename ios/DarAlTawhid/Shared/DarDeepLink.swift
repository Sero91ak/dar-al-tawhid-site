import Foundation
import os

private let quranDeeplinkLog = Logger(subsystem: "de.daraltawhid.app", category: "QuranDeeplink")

enum DarDeepLink {
    static let scheme = "daraltawhid"
    static let testScheme = "dar-test"
    static let adminScheme = "dar-admin"

    static func logIncoming(_ url: URL, source: String) {
        let dest = destination(from: url)
        let admin = isAdminURL(url)
        quranDeeplinkLog.info("[QURAN_DEEPLINK] incoming url: \(url.absoluteString, privacy: .public)")
        quranDeeplinkLog.info("[QURAN_DEEPLINK] source: \(source, privacy: .public)")
        quranDeeplinkLog.info("[QURAN_DEEPLINK] resolved app: \(admin ? "dar-admin-BLOCKED" : "dar-test", privacy: .public)")
        quranDeeplinkLog.info("[QURAN_DEEPLINK] resolved route: \(dest.rawValue, privacy: .public)")
        if admin {
            quranDeeplinkLog.error("[QURAN_DEEPLINK] blocked admin open")
        }
    }

    static func isAdminURL(_ url: URL) -> Bool {
        if (url.scheme ?? "").lowercased() == adminScheme { return true }
        let path = url.path.lowercased()
        if path == "/admin" || path.hasPrefix("/admin/") { return true }
        let host = (url.host ?? "").lowercased()
        if host.contains("admin") && host.contains("dar") { return true }
        return false
    }

    static func isQuranPlayerHash(_ raw: String) -> Bool {
        let head = raw.trimmingCharacters(in: .whitespacesAndNewlines)
            .trimmingCharacters(in: CharacterSet(charactersIn: "#"))
            .lowercased()
        return head == "quran-player" || head.hasPrefix("quran-player/")
    }

    enum Destination: Equatable {
        case home
        case prayer
        case qibla
        case quran
        case quranPlayer
        case duas
        case more
        case search
        case jummah
        case hash(String)

        var rawValue: String {
            switch self {
            case .home: return "home"
            case .prayer: return "prayer"
            case .qibla: return "qibla"
            case .quran: return "quran"
            case .quranPlayer: return "quran-player"
            case .duas: return "duas"
            case .more: return "more"
            case .search: return "search"
            case .jummah: return "jummah"
            case .hash(let raw):
                let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
                if trimmed.hasPrefix("#") { return String(trimmed.dropFirst()) }
                return trimmed
            }
        }

        init?(rawValue: String) {
            let raw = rawValue.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
            if DarDeepLink.isQuranPlayerHash(raw) {
                self = .quranPlayer
                return
            }
            switch raw {
            case "home": self = .home
            case "prayer": self = .prayer
            case "qibla": self = .qibla
            case "quran": self = .quran
            case "quran-player", "quranplayer": self = .quranPlayer
            case "duas", "dua": self = .duas
            case "more": self = .more
            case "search": self = .search
            case "jummah": self = .jummah
            default: return nil
            }
        }

        var webHash: String {
            switch self {
            case .home: return "#home"
            case .prayer, .qibla: return "#prayer"
            case .quran: return "#quran"
            case .quranPlayer:
                let stored = UserDefaults.standard.string(forKey: "darQuranPlayerResumeHashV1") ?? "#quran-player"
                return stored.hasPrefix("#") ? stored : "#\(stored)"
            case .duas: return "#duas"
            case .more: return "#more"
            case .search: return "#home"
            case .jummah: return "#jummah"
            case .hash(let raw):
                let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
                if trimmed.isEmpty { return "#home" }
                if DarDeepLink.isQuranPlayerHash(trimmed) {
                    let hash = trimmed.hasPrefix("#") ? trimmed : "#\(trimmed)"
                    UserDefaults.standard.set(hash, forKey: "darQuranPlayerResumeHashV1")
                    return hash
                }
                return trimmed.hasPrefix("#") ? trimmed : "#\(trimmed)"
            }
        }

        var openHint: String {
            switch self {
            case .qibla: return "qibla"
            case .search: return "search"
            case .quranPlayer: return "quran-player"
            default: return ""
            }
        }

        var url: URL {
            var components = URLComponents()
            components.scheme = DarDeepLink.testScheme
            components.host = "quran-player"
            if self == .quranPlayer {
                components.queryItems = [
                    URLQueryItem(name: "sourceApp", value: "dar-test"),
                    URLQueryItem(name: "targetRoute", value: "quran-player")
                ]
                return components.url ?? URL(string: "\(DarDeepLink.testScheme)://quran-player")!
            }
            components.scheme = DarDeepLink.scheme
            components.host = "open"
            components.queryItems = [URLQueryItem(name: "h", value: rawValue)]
            return components.url ?? URL(string: "\(DarDeepLink.scheme)://home")!
        }
    }

    static func destination(from url: URL) -> Destination {
        if isAdminURL(url) {
            return .quranPlayer
        }
        let scheme = (url.scheme ?? "").lowercased()
        if scheme == testScheme {
            let host = (url.host ?? "").lowercased()
            if host == "quran-player" || isQuranPlayerHash(url.path) || queryValue("route", in: url) == "quran-player" {
                rememberPlayerQuery(url)
                return .quranPlayer
            }
            if let h = queryValue("h", in: url), isQuranPlayerHash(h) {
                UserDefaults.standard.set("#\(h.trimmingCharacters(in: CharacterSet(charactersIn: "#")))", forKey: "darQuranPlayerResumeHashV1")
                return .quranPlayer
            }
        }
        if scheme == DarDeepLink.scheme || scheme == testScheme {
            if let fromInApp = destinationFromInApp(url) {
                return fromInApp
            }
            if url.host == "open" || url.path == "/open" {
                if let hash = queryValue("h", in: url), !hash.isEmpty {
                    if isQuranPlayerHash(hash) {
                        UserDefaults.standard.set("#\(hash.trimmingCharacters(in: CharacterSet(charactersIn: "#")))", forKey: "darQuranPlayerResumeHashV1")
                        return .quranPlayer
                    }
                    if let semantic = Destination(rawValue: hash) {
                        return semantic
                    }
                    return .hash(hash)
                }
            }
            let host = (url.host ?? url.path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))).lowercased()
            if isQuranPlayerHash(host) { return .quranPlayer }
            switch host {
            case "home": return .home
            case "prayer": return .prayer
            case "qibla": return .qibla
            case "quran": return .quran
            case "quran-player": return .quranPlayer
            case "duas", "dua": return .duas
            case "more": return .more
            case "search": return .search
            case "jummah": return .jummah
            default: break
            }
        }
        if let fragment = url.fragment, !fragment.isEmpty {
            if isQuranPlayerHash(fragment) {
                UserDefaults.standard.set("#\(fragment.trimmingCharacters(in: CharacterSet(charactersIn: "#")))", forKey: "darQuranPlayerResumeHashV1")
                return .quranPlayer
            }
            if let semantic = Destination(rawValue: fragment.split(separator: "/").first.map(String.init) ?? fragment) {
                return semantic
            }
            return .hash(fragment)
        }
        return .home
    }

    static func rememberPlayerQuery(_ url: URL) {
        let surah = queryValue("surah", in: url)
        let ayah = queryValue("ayah", in: url)
        if let s = surah, let a = ayah, Int(s) != nil, Int(a) != nil {
            UserDefaults.standard.set("#quran-player/\(s)/\(a)", forKey: "darQuranPlayerResumeHashV1")
        }
        if let qari = queryValue("qari", in: url), !qari.isEmpty {
            UserDefaults.standard.set(qari, forKey: "darQuranPlayerResumeQariV1")
        }
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
        if isAdminURL(srcURL) { return .quranPlayer }
        if let fragment = srcURL.fragment, !fragment.isEmpty {
            if isQuranPlayerHash(fragment) { return .quranPlayer }
            return .hash(fragment)
        }
        if isSiteHost(srcURL.host) {
            return .home
        }
        return .home
    }

    static func queryValue(_ name: String, in url: URL) -> String? {
        let items = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems
        guard let raw = items?.first(where: { $0.name == name })?.value else { return nil }
        return raw.removingPercentEncoding ?? raw
    }

    private static func isSiteHost(_ host: String?) -> Bool {
        let h = (host ?? "").lowercased()
        return h == "dar-al-tawhid.de" || h == "www.dar-al-tawhid.de"
    }
}

enum DarQuickActions {
    private static let lock = NSLock()
    private static var stored: DarDeepLink.Destination?

    static func set(_ destination: DarDeepLink.Destination) {
        lock.lock()
        stored = destination
        lock.unlock()
        DarWidgetStore.setPendingDestination(destination)
    }

    static func peek() -> DarDeepLink.Destination? {
        lock.lock()
        let value = stored
        lock.unlock()
        return value
    }

    static func consume() -> DarDeepLink.Destination? {
        lock.lock()
        let value = stored
        stored = nil
        lock.unlock()
        return value ?? DarWidgetStore.consumePendingDestination()
    }
}
