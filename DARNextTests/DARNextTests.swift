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
    func deepLinksRouteQuizAndPostsToTheirPrimaryTabs() {
        #expect(DARNextDeepLinkDestination.from(URL(string: "darnext://quiz")!) == .quiz)
        #expect(DARNextDeepLinkDestination.from(URL(string: "darnext://posts")!) == .posts)
        #expect(DARNextDeepLinkDestination.from(URL(string: "darnext://feed/latest")!) == .posts)
        #expect(DARNextDeepLinkDestination.from(URL(string: "https://daraltawhid.de/#recent")!) == .posts)
        #expect(DARNextDeepLinkDestination.from(URL(string: "darnext://quran")!) == .quran)
        #expect(DARNextDeepLinkDestination.from(URL(string: "darnext://qibla")!) == .more)
    }

    @Test
    func quizQuestionsAreApprovedAdultContent() async throws {
        let questions = try await LocalContentRepository().quizQuestions()

        #expect(questions.count == 600)
        #expect(questions.allSatisfy { $0.isApprovedAdultContent })
        #expect(questions.allSatisfy { $0.correctIndex >= 0 && $0.correctIndex < $0.answers.count })
    }

    @Test
    func postQuizContextPrefersAnExactTopicMatch() {
        let post = Post(
            id: "post",
            date: nil,
            title: "Post",
            category: "Adab",
            topic: "Brüderlichkeit",
            scholar: nil,
            book: nil,
            source: nil,
            canonicalQSourceNumber: nil,
            body: ""
        )
        let questions = [
            quizQuestion(id: "broad", category: "Adab", topic: "Gutes Benehmen"),
            quizQuestion(id: "exact", category: "Adab", topic: "Brüderlichkeit")
        ]

        let context = PostQuizContext.resolve(post: post, questions: questions)

        #expect(context?.match == .topic)
        #expect(context?.topic == "Brüderlichkeit")
        #expect(context?.category == nil)
        #expect(context?.questionCount == 1)
    }

    @Test
    func postQuizContextUsesCategoryOnlyWhenNoExactTopicExists() {
        let post = Post(
            id: "post",
            date: nil,
            title: "Post",
            category: "Fiqh",
            topic: "Gebetsvorbereitung",
            scholar: nil,
            book: nil,
            source: nil,
            canonicalQSourceNumber: nil,
            body: ""
        )
        let questions = [
            quizQuestion(id: "category-match", category: "Fiqh", topic: "Wuḍūʾ"),
            quizQuestion(id: "unapproved", category: "Fiqh", topic: "Gebetsvorbereitung", approved: false)
        ]

        let context = PostQuizContext.resolve(post: post, questions: questions)

        #expect(context?.match == .category)
        #expect(context?.category == "Fiqh")
        #expect(context?.topic == nil)
        #expect(context?.questionCount == 1)
    }

    @Test
    func postQuizContextIsUnavailableWithoutApprovedExactData() {
        let post = Post(
            id: "post",
            date: nil,
            title: "Post",
            category: "Akhlaq",
            topic: "Nachbarschaft",
            scholar: nil,
            book: nil,
            source: nil,
            canonicalQSourceNumber: nil,
            body: ""
        )

        #expect(PostQuizContext.resolve(
            post: post,
            questions: [quizQuestion(id: "draft", category: "Akhlaq", topic: "Nachbarschaft", approved: false)]
        ) == nil)
    }

    @Test
    func localAssistantAbstainsWhenSearchFindsNoSource() async throws {
        let answer = try await LocalKnowledgeAssistantTransport().answer(
            prompt: "Qurʾān 49:10",
            sources: []
        )

        #expect(answer.contains("kein passender Treffer"))
        #expect(answer.contains("keine religiöse Antwort"))
        #expect(!answer.contains("Quellen gefunden"))
    }

    @Test
    func localAssistantNamesOnlyRetrievedSourcesWithoutClaimingAnAIAnswer() async throws {
        let source = AssistantSourceReference(
            id: "quran-49-10",
            title: "Al-Ḥujurāt 49:10",
            kind: .quran,
            sourceID: "Qurʾān 49:10"
        )
        let answer = try await LocalKnowledgeAssistantTransport().answer(
            prompt: "Brüderlichkeit",
            sources: [source]
        )

        #expect(answer.contains("Al-Ḥujurāt 49:10"))
        #expect(answer.contains("erstellt noch keine eigenständige religiöse Antwort"))
    }

    private func quizQuestion(
        id: String,
        category: String,
        topic: String,
        approved: Bool = true
    ) -> QuizQuestion {
        QuizQuestion(
            id: id,
            question: "Question",
            category: category,
            topic: topic,
            level: "Anfänger",
            answers: ["A", "B"],
            correctIndex: 0,
            explanation: nil,
            source: "Qurʾān 1:1",
            status: approved ? "published" : "draft",
            reviewStatus: approved ? "approved" : "pending",
            sourceChecked: approved
        )
    }

    @Test
    func primaryTabOrderMatchesAdultNavigationContract() {
        #expect(DARNextTab.allCases.map(\.title) == ["Start", "Quiz", "Beiträge", "Qurʾān", "Mehr"])
    }
}
