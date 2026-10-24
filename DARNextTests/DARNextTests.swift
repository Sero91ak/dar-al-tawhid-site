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

    @Test
    func canonicalQRegistryIsBoundAndValidated() async throws {
        let registry = try await LocalContentRepository().qRegistry()

        #expect(registry.baseDomain == "dar-al-tawhid.de")
        #expect(registry.prefix == "/q/")
        #expect(registry.links.count >= 40)
        #expect(registry.nextNumber > (registry.links.map(\.number).max() ?? 0))
        #expect(registry.links.allSatisfy { $0.shortPath == "/q/\($0.number)/" })
    }

    @Test
    func verifiedLearningModulesAreAvailable() async throws {
        let modules = try await LocalContentRepository().learningModules()

        #expect(modules.contains { $0.category == "Tafsīr" })
        #expect(modules.contains { $0.category == "Ḥadīṯ" })
        #expect(modules.contains { $0.category == "Frauenmodul" })
        #expect(modules.allSatisfy { $0.status == "verified" })
    }

    @Test
    func readingStatePersistsBookmarkAndProgress() async throws {
        let store = ReadingStateStore(fileManager: FileManager.default)
        let id = "test-reading-state"
        try await store.removeBookmark(id: id)
        try await store.bookmark(ReadingBookmark(id: id, kind: .post, title: "Test", location: nil, updatedAt: .now))
        try await store.record(ReadingProgress(id: id, kind: .post, position: 0.5, location: "Mitte", updatedAt: .now))

        #expect(try await store.isBookmarked(id: id))
        #expect(try await store.progress(for: id)?.position == 0.5)
        try await store.removeBookmark(id: id)
    }
}
