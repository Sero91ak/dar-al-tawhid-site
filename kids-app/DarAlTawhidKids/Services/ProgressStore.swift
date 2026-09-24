import Foundation

@MainActor
final class ProgressStore: ObservableObject {
    @Published private(set) var completedStoryIDs: Set<String> = []

    private let key = "kids.completedStories"

    init() {
        let saved = UserDefaults.standard.stringArray(forKey: key) ?? []
        completedStoryIDs = Set(saved)
    }

    func markStoryComplete(_ story: KidsStory) {
        completedStoryIDs.insert(story.id)
        UserDefaults.standard.set(Array(completedStoryIDs), forKey: key)
    }

    func isCompleted(_ story: KidsStory) -> Bool {
        completedStoryIDs.contains(story.id)
    }
}
