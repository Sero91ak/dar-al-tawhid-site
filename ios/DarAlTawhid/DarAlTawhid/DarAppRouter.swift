import Combine
import Foundation

final class DarAppRouter: ObservableObject {
    @Published var destination: DarDeepLink.Destination?

    func open(_ url: URL) {
        destination = DarDeepLink.destination(from: url)
        DarWidgetStore.setPendingDestination(destination ?? .home)
    }
}
