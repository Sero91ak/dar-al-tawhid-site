import Combine
import Foundation

final class DarAppRouter: ObservableObject {
    @Published var destination: DarDeepLink.Destination?
    @Published var webURL: URL?
    @Published var openNonce = UUID()

    func open(_ url: URL) {
        openPush(
            type: DarDeepLink.destination(from: url).rawValue,
            postId: DarAppShell.postId(from: url),
            url: url.absoluteString
        )
    }

    func openShortcut(_ destination: DarDeepLink.Destination) {
        _ = DarQuickActions.consume()
        webURL = nil
        self.destination = destination
        openNonce = UUID()
    }

    func openPendingQuickAction() {
        guard let destination = DarQuickActions.consume() else { return }
        webURL = nil
        self.destination = destination
        openNonce = UUID()
    }

    func openPush(type: String, postId: String, url: String) {
        let cleanType = type.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        let cleanPost = postId.trimmingCharacters(in: .whitespacesAndNewlines)
        if let exact = DarDeepLink.Destination(rawValue: cleanType),
           ["prayer", "qibla", "quran", "duas", "more", "search", "jummah", "home"].contains(cleanType) {
            apply(exact, webURL: nil)
            return
        }
        let mapped = mapPushType(cleanType)
        if mapped != .home {
            apply(mapped, webURL: nil)
            return
        }
        if !cleanPost.isEmpty, cleanPost != "nil", cleanPost != "<null>" {
            let target = DarAppShell.inAppURL(
                from: URL(string: "https://dar-al-tawhid.de/?post=\(cleanPost)#post/\(cleanPost)")!
            )
            apply(.home, webURL: target)
            return
        }
        if let parsed = URL(string: url), DarAppShell.isOwnHost(parsed) {
            let target = DarAppShell.inAppURL(from: parsed)
            let dest = hashDestination(target) ?? DarDeepLink.destination(from: parsed)
            apply(dest, webURL: dest == .home || dest == .qibla ? nil : target)
            return
        }
        apply(mapped, webURL: mapped == .home ? nil : DarAppShell.hashed(mapped.webHash))
    }

    private func apply(_ dest: DarDeepLink.Destination, webURL: URL?) {
        self.webURL = webURL
        destination = dest
        DarQuickActions.set(dest)
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
