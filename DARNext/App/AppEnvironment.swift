import Foundation
import Observation

@MainActor
@Observable
final class AppEnvironment {
    let container: DependencyContainer
    let audioEngine = QuranAudioEngine()
    let contentSync = DARNextContentSyncService()

    private(set) var contentManifest: DARNextContentManifest?
    private(set) var contentSyncError: String?

    init() {
        container = DependencyContainer.live()
    }

    func refreshContentManifest() async {
        do {
            contentManifest = try await contentSync.refresh()
            contentSyncError = nil
        } catch {
            contentSyncError = error.localizedDescription
        }
    }
}
