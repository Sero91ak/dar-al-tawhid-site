import Combine
import Foundation

final class DarAppRouter: ObservableObject {
    @Published var destination: DarDeepLink.Destination?
    @Published var webURL: URL?
    @Published var openNonce = UUID()

    func open(_ url: URL) {
        webURL = nil
        destination = DarDeepLink.destination(from: url)
        DarWidgetStore.setPendingDestination(destination ?? .home)
        openNonce = UUID()
        NotificationCenter.default.post(
            name: .darOpenPush,
            object: nil,
            userInfo: ["type": destination?.rawValue ?? "home", "postId": "", "url": ""]
        )
    }

    func openPush(type: String, postId: String, url: String) {
        let cleanType = type.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        let cleanPost = postId.trimmingCharacters(in: .whitespacesAndNewlines)
        if !cleanPost.isEmpty, cleanPost != "nil", cleanPost != "<null>" {
            webURL = URL(string: "https://dar-al-tawhid.de/?post=\(cleanPost)#post/\(cleanPost)")
            openNonce = UUID()
            return
        }
        if let parsed = URL(string: url), let host = parsed.host, host.contains("dar-al-tawhid.de") {
            webURL = parsed
            if let dest = hashDestination(parsed) {
                destination = dest
                DarWidgetStore.setPendingDestination(dest)
            }
            openNonce = UUID()
            return
        }
        let dest = mapPushType(cleanType)
        destination = dest
        webURL = nil
        DarWidgetStore.setPendingDestination(dest)
        openNonce = UUID()
    }

    func clearWebURL() {
        webURL = nil
    }

    private func hashDestination(_ url: URL) -> DarDeepLink.Destination? {
        guard let fragment = url.fragment?.lowercased() else { return nil }
        let head = fragment.split(separator: "/").first.map(String.init) ?? fragment
        return DarDeepLink.Destination(rawValue: head) ?? {
            if head.contains("prayer") || head.contains("gebet") { return .prayer }
            if head.contains("qibla") { return .qibla }
            if head.contains("quran") { return .quran }
            if head.contains("dua") { return .duas }
            if head.contains("jum") { return .jummah }
            if head.contains("search") { return .search }
            if head.contains("more") || head.contains("mehr") { return .more }
            return nil
        }()
    }

    private func mapPushType(_ type: String) -> DarDeepLink.Destination {
        if type.contains("qibla") { return .qibla }
        if type.contains("quran") || type.contains("ayah") || type.contains("surah") { return .quran }
        if type.contains("dua") { return .duas }
        if type.contains("jum") { return .jummah }
        if type.contains("search") { return .search }
        if type.contains("more") || type.contains("mehr") { return .more }
        if type.contains("prayer") || type.contains("salah") || type.contains("fajr")
            || type.contains("dhuhr") || type.contains("asr") || type.contains("maghrib")
            || type.contains("isha") || type.contains("tahajjud") { return .prayer }
        if type.contains("post") || type.contains("daily") || type.contains("recommend") { return .home }
        return .home
    }
}
