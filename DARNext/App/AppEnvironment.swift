import Observation

@MainActor
@Observable
final class AppEnvironment {
    let container: DependencyContainer
    let audioEngine = QuranAudioEngine()

    init() {
        container = DependencyContainer.live()
    }
}
