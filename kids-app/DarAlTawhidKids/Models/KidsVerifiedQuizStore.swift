import Foundation

private struct BundledQuizPayload: Decodable {
    let policy: BundledQuizPolicy
    let items: [BundledQuizItem]
}

private struct BundledQuizPolicy: Decodable {
    let status: String
}

private struct BundledQuizItem: Decodable {
    let id: String
    let canonicalQuizId: String
    let ageMin: Int
    let ageMax: Int
    let scene: String
    let category: String
    let question: String
    let answers: [BundledQuizAnswer]
    let success: String
    let retry: String
    let source: String
    let canonicalStatus: String
    let canonicalReviewStatus: String
    let verification: String
}

private struct BundledQuizAnswer: Decodable {
    let id: String
    let label: String
    let correct: Bool
}

enum KidsVerifiedQuizStore {
    private static let payload: BundledQuizPayload? = {
        guard
            let url = Bundle.main.url(forResource: "quiz-kids", withExtension: "json"),
            let data = try? Data(contentsOf: url),
            let decoded = try? JSONDecoder().decode(BundledQuizPayload.self, from: data),
            decoded.policy.status == "approved-only"
        else {
            return nil
        }

        let allStrict = decoded.items.allSatisfy {
            $0.verification == "approved" &&
            $0.canonicalStatus == "published" &&
            $0.canonicalReviewStatus == "approved" &&
            !$0.canonicalQuizId.isEmpty &&
            !$0.source.isEmpty
        }

        return allStrict ? decoded : nil
    }()

    static var isReady: Bool {
        payload != nil
    }

    static func questions(for ageBand: AgeBand) -> [KidsQuizQuestion] {
        guard let payload else { return [] }
        let band = ageBand.numericRange

        return payload.items
            .filter {
                $0.ageMin <= band.lowerBound &&
                $0.ageMax >= band.upperBound
            }
            .map { item in
                KidsQuizQuestion(
                    id: item.id,
                    ageBand: ageBand,
                    question: item.question,
                    sceneSymbol: symbol(for: item.scene),
                    style: item.answers.count == 2 ? .yesNo : .choice,
                    answers: item.answers.enumerated().map { offset, answer in
                        KidsQuizAnswer(
                            id: answer.id,
                            title: answer.label,
                            symbol: answerSymbol(
                                label: answer.label,
                                offset: offset,
                                ageBand: ageBand
                            ),
                            isCorrect: answer.correct
                        )
                    },
                    successText: item.success,
                    retryText: item.retry
                )
            }
    }

    static func dailySession(for ageBand: AgeBand, date: Date = .now) -> [KidsQuizQuestion] {
        let all = questions(for: ageBand)
        guard !all.isEmpty else { return [] }

        let limit: Int
        switch ageBand {
        case .age4to5: limit = 3
        case .age6to8: limit = 4
        case .age9to10: limit = 5
        }

        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyyMMdd"
        let daySeed = Int(formatter.string(from: date)) ?? 0

        let sorted = all.sorted { lhs, rhs in
            stableRank(lhs.id, seed: daySeed) < stableRank(rhs.id, seed: daySeed)
        }
        return Array(sorted.prefix(limit))
    }

    static func source(for questionID: String) -> String? {
        payload?.items.first(where: { $0.id == questionID })?.source
    }

    static func canonicalID(for questionID: String) -> String? {
        payload?.items.first(where: { $0.id == questionID })?.canonicalQuizId
    }

    private static func stableRank(_ value: String, seed: Int) -> UInt64 {
        var hash: UInt64 = 1469598103934665603
        for byte in "\(seed)|\(value)".utf8 {
            hash ^= UInt64(byte)
            hash &*= 1099511628211
        }
        return hash
    }

    private static func symbol(for scene: String) -> String {
        switch scene {
        case "📖": return "book.closed.fill"
        case "🌙": return "moon.stars.fill"
        case "💬": return "bubble.left.and.bubble.right.fill"
        case "🍽️": return "fork.knife"
        case "☾": return "moon.fill"
        case "📚": return "books.vertical.fill"
        case "🪙": return "circle.hexagongrid.fill"
        case "🏠": return "house.fill"
        case "🌴": return "leaf.fill"
        case "⭐": return "star.fill"
        case "🤝": return "hand.raised.fill"
        case "🔉": return "speaker.wave.2.fill"
        case "🤲": return "hand.raised.fill"
        case "🚪": return "door.left.hand.open"
        case "💧": return "drop.fill"
        case "🕌": return "building.columns.fill"
        case "🔐": return "lock.fill"
        default: return "sparkles"
        }
    }

    private static func answerSymbol(label: String, offset: Int, ageBand: AgeBand) -> String {
        let normalized = label.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        if ageBand == .age4to5 {
            if normalized == "ja" { return "checkmark" }
            if normalized == "nein" { return "xmark" }
        }

        let symbols = ["1.circle.fill", "2.circle.fill", "3.circle.fill", "4.circle.fill"]
        return symbols.indices.contains(offset) ? symbols[offset] : "circle.fill"
    }
}
