import Foundation

enum ReadingContentKind: String, Codable, CaseIterable, Sendable {
    case quran
    case post
    case book
}

struct ReadingBookmark: Codable, Hashable, Sendable, Identifiable {
    let id: String
    let kind: ReadingContentKind
    let title: String
    let location: String?
    let updatedAt: Date
}

struct ReadingProgress: Codable, Hashable, Sendable {
    let id: String
    let kind: ReadingContentKind
    let position: Double
    let location: String?
    let updatedAt: Date
}

struct QRegistry: Codable, Sendable {
    let version: Int
    let updatedAt: String
    let baseDomain: String
    let prefix: String
    let nextNumber: Int
    let links: [QRegistryLink]
}

struct QRegistryLink: Codable, Hashable, Sendable, Identifiable {
    let number: Int
    let shortPath: String
    let targetPath: String
    let title: String
    let topic: String?
    let speaker: String?
    let postReference: String?
    let statementSummary: String?
    let sourceLabel: String?
    let status: String?
    let createdAt: String?

    var id: Int { number }
    var url: URL? { URL(string: "https://dar-al-tawhid.de/q/\(number)/") }
}

struct LearningModule: Codable, Hashable, Sendable, Identifiable {
    let id: String
    let title: String
    let category: String
    let summary: String
    let source: String
    let status: String
    let language: String
    let body: String
}
