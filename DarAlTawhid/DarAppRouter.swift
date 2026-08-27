import Combine
import Foundation

final class DarAppRouter: ObservableObject {
    @Published var destination: DarDeepLink.Destination?
    @Published var webURL: URL?

    func open(_ url: URL) {
        destination = DarDeepLink.destination(from: url)
        DarWidgetStore.setPendingDestination(destination ?? .home)
    }

    func openPush(type: String, postId: String, url: String) {
        let cleanPost = postId.trimmingCharacters(in: .whitespacesAndNewlines)
        if !cleanPost.isEmpty, cleanPost != "nil" {
            webURL = URL(string: "https://dar-al-tawhid.de/?post=\(cleanPost)#post/\(cleanPost)")
            return
        }
        if let parsed = URL(string: url), let host = parsed.host, host.contains("dar-al-tawhid.de") {
            webURL = parsed
            return
        }
        if type.contains("prayer") {
            destination = .prayer
            DarWidgetStore.setPendingDestination(.prayer)
        }
    }
}
