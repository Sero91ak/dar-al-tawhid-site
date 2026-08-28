import Foundation

enum DarDeepLink {
    static let scheme = "daraltawhid"

    enum Destination: String {
        case home
        case prayer
        case qibla
        case quran
        case duas
        case more
        case search
        case jummah

        var webHash: String {
            switch self {
            case .home: return "#home"
            case .prayer, .qibla: return "#prayer"
            case .quran: return "#quran"
            case .duas: return "#duas"
            case .more: return "#more"
            case .search: return "#home"
            case .jummah: return "#jummah"
            }
        }

        var openHint: String {
            switch self {
            case .qibla: return "qibla"
            case .search: return "search"
            default: return ""
            }
        }

        var url: URL {
            URL(string: "\(DarDeepLink.scheme)://\(rawValue)")!
        }
    }

    static func destination(from url: URL) -> Destination {
        if url.scheme == scheme {
            return Destination(rawValue: url.host ?? url.path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))) ?? .home
        }
        if let fragment = url.fragment, let dest = Destination(rawValue: fragment) {
            return dest
        }
        return .home
    }
}
