import Foundation
import Testing
@testable import DARNext

@MainActor
struct DARNextTests {
    @Test
    func realRepositoryProvidesVerifiedDashboardContent() async throws {
        let snapshot = try await LocalContentRepository().dashboardSnapshot()

        #expect(snapshot.nextPrayer == nil)
        #expect(snapshot.verse?.reference == "Qurʾān 1:1")
        #expect(snapshot.recommendation != nil)
    }

    @Test
    func quranCatalogHasCanonicalShape() async throws {
        let catalog = try await LocalContentRepository().quranCatalog()

        #expect(catalog.surahs.count == 114)
        #expect(catalog.surahs.first?.id == 1)
        #expect(catalog.surahs.last?.id == 114)
    }

    @Test
    func quranAudioInterruptionResumesOnlyWhenPlaybackWasActiveAndAllowed() {
        #expect(QuranAudioInterruptionPolicy.shouldResume(wasPlaying: true, systemAllowsResume: true))
        #expect(!QuranAudioInterruptionPolicy.shouldResume(wasPlaying: false, systemAllowsResume: true))
        #expect(!QuranAudioInterruptionPolicy.shouldResume(wasPlaying: true, systemAllowsResume: false))
    }

    @Test
    func pauseRetainsGlobalQuranPlayerStateButStopResetsIt() {
        let engine = QuranAudioEngine()
        let track = QuranAudioTrack(
            id: "quran-1-1",
            surahNumber: 1,
            ayahNumber: 1,
            surahTitle: "Al-Fātiḥah",
            reciterName: "Test",
            sourceURL: URL(fileURLWithPath: "/tmp/darnext-stop-test.mp3"),
            isOfflineAvailable: false
        )

        engine.load(track)
        engine.seek(to: 12)
        engine.pause()

        #expect(engine.currentTrack == track)
        #expect(engine.playlist == [track])
        #expect(engine.currentTime == 12)

        engine.stop()

        #expect(engine.currentTrack == nil)
        #expect(engine.playlist.isEmpty)
        #expect(engine.playlistIndex == 0)
        #expect(engine.currentTime == 0)
        #expect(engine.duration == 0)
        #expect(!engine.isPlaying)
    }

    @Test
    func globalQuranPlayerOnlyOwnsItsNowPlayingMetadata() {
        let globalInfo: [String: Any] = [
            QuranAudioNowPlayingOwnership.ownerKey: QuranAudioNowPlayingOwnership.globalPlayer
        ]
        let learningInfo: [String: Any] = [
            QuranAudioNowPlayingOwnership.ownerKey: "learning-player"
        ]
        let unownedInfo: [String: Any] = ["title": "Other audio"]

        #expect(QuranAudioNowPlayingOwnership.belongsToGlobalPlayer(globalInfo))
        #expect(!QuranAudioNowPlayingOwnership.belongsToGlobalPlayer(learningInfo))
        #expect(!QuranAudioNowPlayingOwnership.belongsToGlobalPlayer(unownedInfo))
    }

    @Test
    func quranAudioInterruptionStateRemembersPlaybackAcrossRepeatedBeginNotifications() {
        var state = QuranAudioInterruptionState()
        state.interruptionBegan(isPlaying: true)
        state.interruptionBegan(isPlaying: false)

        #expect(state.interruptionEnded(systemAllowsResume: true))
        #expect(!state.interruptionEnded(systemAllowsResume: true))
    }

    @Test
    func quranAudioInterruptionStateHonorsPauseOrStopDuringInterruption() {
        var state = QuranAudioInterruptionState()
        state.interruptionBegan(isPlaying: true)
        state.cancelResume()

        #expect(!state.interruptionEnded(systemAllowsResume: true))
    }

    @Test
    func adultContentCollectionsAreAvailable() async throws {
        let repository = LocalContentRepository()

        #expect(try await repository.duas().isEmpty == false)
        #expect(try await repository.posts().isEmpty == false)
        #expect(try await repository.quizQuestions().isEmpty == false)
    }

    @Test
    func libraryAndSearchUseVerifiedContent() async throws {
        let repository = LocalContentRepository()

        let books = try await repository.libraryBooks()
        let publications = try await repository.libraryPublications()
        let results = try await repository.search(query: "Qurʾān")
        let arabicResults = try await repository.search(query: "ٱلْحَمْدُ")
        let regressionResults = try await repository.search(query: "الحمد")
        let abbreviatedResults = try await repository.search(query: "ٱلحد")
        let unmarkedResults = try await repository.search(query: "الحمد")

        #expect(books.count == 87)
        #expect(publications.count == 40)
        #expect(results.isEmpty == false)
        #expect(results.allSatisfy { !$0.sourceID.isEmpty })
        #expect(arabicResults.contains { $0.id == "quran-1-2" })
        #expect(regressionResults.count == 28)
        #expect(regressionResults.contains { $0.id == "quran-1-2" })
        #expect(unmarkedResults.contains { $0.id == "quran-1-2" })
        #expect(abbreviatedResults.isEmpty == false)
    }

    @Test
    func quizQuestionsAreApprovedAdultContent() async throws {
        let questions = try await LocalContentRepository().quizQuestions()

        #expect(questions.count == 600)
        #expect(questions.allSatisfy { $0.isApprovedAdultContent })
        #expect(questions.allSatisfy { $0.correctIndex >= 0 && $0.correctIndex < $0.answers.count })
    }

}
