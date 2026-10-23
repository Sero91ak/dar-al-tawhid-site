import Observation

@MainActor
@Observable
final class AppEnvironment {
    let container: DependencyContainer

    init() {
        container = DependencyContainer.live()
    }
}
