import Foundation

enum DARNextDeepLinkDestination {
    case home
    case quran
    case more

    static func from(_ url: URL) -> Self {
        if url.fragment?.localizedCaseInsensitiveContains("quran") == true ||
            url.host?.localizedCaseInsensitiveContains("quran") == true {
            return .quran
        }

        if url.fragment?.localizedCaseInsensitiveContains("home") == true ||
            url.host?.localizedCaseInsensitiveContains("home") == true {
            return .home
        }

        if url.fragment?.localizedCaseInsensitiveContains("prayer") == true ||
            url.fragment?.localizedCaseInsensitiveContains("dua") == true ||
            url.fragment?.localizedCaseInsensitiveContains("qibla") == true ||
            url.fragment?.localizedCaseInsensitiveContains("calendar") == true ||
            url.host?.localizedCaseInsensitiveContains("more") == true {
            return .more
        }

        return .home
    }
}
