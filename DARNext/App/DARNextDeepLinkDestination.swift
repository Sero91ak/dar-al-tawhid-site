import Foundation

enum DARNextDeepLinkDestination: Equatable {
    case home
    case quiz
    case quran
    case posts
    case more

    static func from(_ url: URL) -> Self {
        let route = [url.host, url.path, url.fragment]
            .compactMap { $0 }
            .joined(separator: "/")
            .removingPercentEncoding ?? ""

        if route.localizedCaseInsensitiveContains("quran") {
            return .quran
        }

        if route.localizedCaseInsensitiveContains("quiz") {
            return .quiz
        }

        if ["posts", "post", "feed", "recent", "beitraege", "beiträge"]
            .contains(where: route.localizedCaseInsensitiveContains) {
            return .posts
        }

        if ["prayer", "dua", "qibla", "calendar", "more"]
            .contains(where: route.localizedCaseInsensitiveContains) {
            return .more
        }

        return .home
    }
}
