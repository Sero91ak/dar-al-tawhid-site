import Foundation

private struct LibraryBookContainer: Decodable {
    let books: [LibraryBook]
}

private struct LibraryPublicationContainer: Decodable {
    let publications: [LibraryPublication]
}

enum ContentResourceError: LocalizedError {
    case missingResource(String)
    case invalidResource(String)
    case unsupportedResource(String)

    var errorDescription: String? {
        switch self {
        case .missingResource(let name):
            return "DAR-NEXT-Ressource fehlt: \(name)"
        case .invalidResource(let name):
            return "DAR-NEXT-Ressource ist ungültig: \(name)"
        case .unsupportedResource(let name):
            return "DAR-NEXT-Ressource wird nicht unterstützt: \(name)"
        }
    }
}

struct ContentResourceStore: Sendable {
    let bundle: Bundle

    init(bundle: Bundle = .main) {
        self.bundle = bundle
    }

    func data(relativePath: String) throws -> Data {
        guard let root = bundle.resourceURL else {
            throw ContentResourceError.missingResource(relativePath)
        }

        let url = root.appendingPathComponent(relativePath)
        guard FileManager.default.fileExists(atPath: url.path) else {
            throw ContentResourceError.missingResource(relativePath)
        }

        return try Data(contentsOf: url)
    }

    func quranCatalog() throws -> QuranCatalog {
        try decode(QuranCatalog.self, path: "surahs.json")
    }

    func quranSurah(number: Int) throws -> QuranSurah {
        try decode(QuranSurah.self, path: String(format: "%03d.json", number))
    }

    func quizQuestions() throws -> [QuizQuestion] {
        try decode([QuizQuestion].self, path: "quiz-questions.json")
    }

    func libraryBooks() throws -> [LibraryBook] {
        try decode(LibraryBookContainer.self, path: "books-library.json").books
    }

    func libraryPublications() throws -> [LibraryPublication] {
        try decode(LibraryPublicationContainer.self, path: "library-publications.json").publications
    }

    private func decode<T: Decodable>(_ type: T.Type, path: String) throws -> T {
        do {
            return try JSONDecoder().decode(T.self, from: data(relativePath: path))
        } catch {
            throw ContentResourceError.invalidResource("\(path): \(error.localizedDescription)")
        }
    }
}
