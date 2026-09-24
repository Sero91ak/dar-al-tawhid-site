import Foundation

@MainActor
final class ProgressStore: ObservableObject {
    @Published private(set) var completedStoryIDs: Set<String> = []
    @Published private(set) var quizCorrectTotal: Int = 0
    @Published private(set) var dailyCompletedSteps: Set<String> = []

    private let key = "kids.completedStories"
    private let quizKey = "kids.quiz.correctTotal"

    private var dailyKey: String {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        return "kids.daily.\(formatter.string(from: .now))"
    }

    init() {
        let saved = UserDefaults.standard.stringArray(forKey: key) ?? []
        completedStoryIDs = Set(saved)
        quizCorrectTotal = UserDefaults.standard.integer(forKey: quizKey)
        dailyCompletedSteps = Set(UserDefaults.standard.stringArray(forKey: dailyKey) ?? [])
    }

    func markStoryComplete(_ story: KidsStory) {
        completedStoryIDs.insert(story.id)
        UserDefaults.standard.set(Array(completedStoryIDs), forKey: key)
        markDailyStepComplete("story")
    }

    func isCompleted(_ story: KidsStory) -> Bool {
        completedStoryIDs.contains(story.id)
    }

    func addQuizCorrect(_ count: Int) {
        guard count > 0 else { return }
        quizCorrectTotal += count
        UserDefaults.standard.set(quizCorrectTotal, forKey: quizKey)
        markDailyStepComplete("quiz")
    }

    func markDailyStepComplete(_ step: String) {
        dailyCompletedSteps.insert(step)
        UserDefaults.standard.set(Array(dailyCompletedSteps), forKey: dailyKey)
    }

    func isDailyStepComplete(_ step: String) -> Bool {
        dailyCompletedSteps.contains(step)
    }
}
