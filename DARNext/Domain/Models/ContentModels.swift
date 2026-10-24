import Foundation

struct QuranSurah: Codable, Identifiable, Hashable, Sendable {
    let id: Int
    let name: String
    let transliteration: String
    let type: String
    let totalVerses: Int
    let verses: [QuranAyah]

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case transliteration
        case type
        case totalVerses = "total_verses"
        case verses
    }
}

struct QuranAyah: Codable, Identifiable, Hashable, Sendable {
    let id: Int
    let arabicText: String
    let transliteration: String?
    let readableTransliteration: String?
    let academicTransliteration: String?
    let germanTranslation: String

    enum CodingKeys: String, CodingKey {
        case id
        case arabicText = "ar"
        case transliteration = "tr"
        case readableTransliteration = "tr_readable"
        case academicTransliteration = "tr_academic"
        case germanTranslation = "de"
    }

    var sourceID: String {
        "quran:\(id)"
    }

    var sourceURL: String {
        "/q/\(id)"
    }
}

struct QuranCatalog: Codable, Sendable {
    let updated: String
    let arabic: String
    let surahs: [QuranCatalogEntry]
}

struct QuranCatalogEntry: Codable, Identifiable, Hashable, Sendable {
    let id: Int
    let name: String
    let transliteration: String
    let type: String
    let totalVerses: Int

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case transliteration
        case type
        case totalVerses = "total_verses"
    }
}

struct Dua: Identifiable, Hashable, Sendable {
    let id: String
    let order: Int?
    let type: String?
    let category: String?
    let title: String
    let occasion: String?
    let arabic: String
    let transliteration: String
    let german: String
    let source: String
}

struct Post: Identifiable, Hashable, Sendable {
    let id: String
    let date: String?
    let title: String
    let category: String?
    let topic: String?
    let scholar: String?
    let book: String?
    let source: String?
    let canonicalQSourceNumber: Int?
    let body: String

    var sourceURL: String? {
        guard let canonicalQSourceNumber else { return nil }
        return "/q/\(canonicalQSourceNumber)/"
    }
}

struct QuizQuestion: Codable, Identifiable, Hashable, Sendable {
    let id: String
    let question: String
    let category: String?
    let topic: String?
    let level: String?
    let answers: [String]
    let correctIndex: Int
    let explanation: String?
    let source: String?
    let status: String?
    let reviewStatus: String?
    let sourceChecked: Bool?

    enum CodingKeys: String, CodingKey {
        case id
        case question
        case category
        case topic
        case level
        case answers
        case correctIndex
        case explanation
        case source
        case status
        case reviewStatus
        case sourceChecked
    }

    var isApprovedAdultContent: Bool {
        status == "published" && reviewStatus == "approved" && sourceChecked == true
    }
}

struct LibraryBook: Codable, Identifiable, Hashable, Sendable {
    let id: String
    let title: String
    let author: String?
    let category: String?
    let aliases: [String]?
    let verification: String?
    let postIDs: [String]?
    let quotedScholars: [String]?
    let coverURL: String?

    enum CodingKeys: String, CodingKey {
        case id
        case title
        case author
        case category
        case aliases
        case verification
        case postIDs = "postIds"
        case quotedScholars
        case coverURL = "coverUrl"
    }
}

struct LibraryPublication: Codable, Identifiable, Hashable, Sendable {
    let id: String
    let slug: String?
    let title: String
    let transliteratedTitle: String?
    let description: String?
    let category: String?
    let topic: String?
    let editor: String?
    let publisher: String?
    let language: String?
    let version: String?
    let publishedAt: String?
    let updatedAt: String?
    let pageCount: Int?
    let fileSize: String?
    let fileHash: String?
    let coverURL: String?
    let pdfURL: String?
    let downloadEnabled: Bool?
    let offlineEnabled: Bool?
    let status: String?
    let sources: [String]?

    enum CodingKeys: String, CodingKey {
        case id
        case slug
        case title
        case transliteratedTitle
        case description
        case category
        case topic
        case editor
        case publisher
        case language
        case version
        case publishedAt
        case updatedAt
        case pageCount
        case fileSize
        case fileHash
        case coverURL = "coverUrl"
        case pdfURL = "pdfUrl"
        case downloadEnabled
        case offlineEnabled
        case status
        case sources
    }
}

enum SearchDocumentKind: String, CaseIterable, Identifiable, Codable, Sendable {
    case quran = "Qurʾān"
    case post = "Beiträge"
    case dua = "Duʿāʾ"
    case library = "Bibliothek"

    var id: String { rawValue }
}

struct SearchDocument: Identifiable, Hashable, Codable, Sendable {
    let id: String
    let kind: SearchDocumentKind
    let title: String
    let preview: String
    let sourceID: String
}
