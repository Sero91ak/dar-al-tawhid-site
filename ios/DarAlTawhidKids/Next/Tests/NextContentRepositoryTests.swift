import Testing
@testable import TawhidKidsNext

@Test("Quiz session retries an incorrect answer without changing the question")
func quizSessionRetriesIncorrectAnswer() {
    let item = NextQuizItem(
        id: "test-1",
        number: 1,
        ageBand: "4-6",
        ageMin: 4,
        ageMax: 6,
        category: "Test",
        question: "Testfrage",
        answers: [
            NextQuizAnswer(id: "wrong", label: "Falsch", correct: false),
            NextQuizAnswer(id: "right", label: "Richtig", correct: true)
        ],
        success: "Richtig",
        retry: "Noch einmal",
        explanation: "Erklärung",
        sourceType: "Test",
        source: "Testquelle",
        status: "published",
        reviewStatus: "approved",
        verification: "approved"
    )
    var session = NextQuizSession()
    session.start(items: [item])
    session.answer(id: "wrong")
    #expect(session.phase == .answered(correct: false))
    session.retry()
    #expect(session.phase == .question)
    #expect(session.currentItem?.id == "test-1")
}

@Test("Quiz session completes after the final correct answer")
func quizSessionCompletes() {
    let item = NextQuizItem(
        id: "test-2",
        number: 2,
        ageBand: "9-10",
        ageMin: 9,
        ageMax: 10,
        category: "Test",
        question: "Testfrage",
        answers: [NextQuizAnswer(id: "right", label: "Richtig", correct: true)],
        success: "Richtig",
        retry: "Noch einmal",
        explanation: "Erklärung",
        sourceType: "Test",
        source: "Testquelle",
        status: "published",
        reviewStatus: "approved",
        verification: "approved"
    )
    var session = NextQuizSession()
    session.start(items: [item])
    session.answer(id: "right")
    session.advance()
    #expect(session.phase == .completed)
}

@Test("Quiz repository exposes the complete approved and unique canonical corpus")
func approvedQuizCorpusIsComplete() throws {
    let items = try NextContentRepository().loadQuiz()
    #expect(items.count == 900)
    #expect(Set(items.map(\.id)).count == 900)
    #expect(items.allSatisfy {
        $0.status == "published" &&
        $0.reviewStatus == "approved" &&
        $0.verification == "approved"
    })
    #expect(Dictionary(grouping: items, by: \.ageBand).mapValues(\.count) == [
        "4-6": 300,
        "7-8": 300,
        "9-10": 300
    ])
}

@Test("Dua repository exposes all verified canonical items")
func verifiedDuaCorpusIsComplete() throws {
    let items = try NextDuaRepository().loadDuas()
    #expect(items.count == 120)
    #expect(Set(items.map(\.id)).count == 120)
    #expect(items.allSatisfy { $0.verification == "verified" })
    #expect(items.allSatisfy {
        $0.audioGermanUrl != nil && $0.audioArabicUrl != nil && $0.audioArabicSlowUrl != nil
    })
}

@Test("Quiz audio manifest decodes the canonical entries")
func quizAudioManifestLoads() throws {
    let manifest = try NextQuizAudioRepository().loadManifest()
    #expect(manifest.entries.count == 1_884)
    #expect(manifest.entries.values.allSatisfy { !$0.url.isEmpty })
    let items = try NextContentRepository().loadQuiz()
    #expect(items.filter { manifest.path(for: $0) != nil }.count == 613)
}
