import Foundation

@MainActor
final class ProgressStore: ObservableObject {
    @Published private(set) var completedStoryIDs: Set<String> = []
    @Published private(set) var quizCorrectTotal: Int = 0

    private let key = "kids.completedStories"
    private let quizKey = "kids.quiz.correctTotal"

    init() {
        let saved = UserDefaults.standard.stringArray(forKey: key) ?? []
        completedStoryIDs = Set(saved)
        quizCorrectTotal = UserDefaults.standard.integer(forKey: quizKey)
    }

    func markStoryComplete(_ story: KidsStory) {
        completedStoryIDs.insert(story.id)
        UserDefaults.standard.set(Array(completedStoryIDs), forKey: key)
    }

    func isCompleted(_ story: KidsStory) -> Bool {
        completedStoryIDs.contains(story.id)
    }

    func addQuizCorrect(_ count: Int) {
        guard count > 0 else { return }
        quizCorrectTotal += count
        UserDefaults.standard.set(quizCorrectTotal, forKey: quizKey)
    }
}
