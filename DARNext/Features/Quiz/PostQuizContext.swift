import Foundation

enum PostQuizContextMatch: Equatable, Sendable {
    case topic
    case category
}

struct PostQuizContext: Equatable, Sendable {
    let category: String?
    let topic: String?
    let questionCount: Int
    let match: PostQuizContextMatch

    static func resolve(post: Post, questions: [QuizQuestion]) -> PostQuizContext? {
        let approvedQuestions = questions.filter { $0.isApprovedAdultContent }

        if let topic = normalized(post.topic) {
            let exactTopicQuestions = approvedQuestions.filter {
                normalized($0.topic) == topic
            }
            if !exactTopicQuestions.isEmpty {
                return PostQuizContext(
                    category: nil,
                    topic: topic,
                    questionCount: exactTopicQuestions.count,
                    match: .topic
                )
            }
        }

        if let category = normalized(post.category) {
            let categoryQuestions = approvedQuestions.filter {
                normalized($0.category) == category
            }
            if !categoryQuestions.isEmpty {
                return PostQuizContext(
                    category: category,
                    topic: nil,
                    questionCount: categoryQuestions.count,
                    match: .category
                )
            }
        }

        return nil
    }

    private static func normalized(_ value: String?) -> String? {
        guard let value else { return nil }
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }
}
