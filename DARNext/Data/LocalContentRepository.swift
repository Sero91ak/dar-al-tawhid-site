import Foundation

actor LocalContentRepository: ContentRepository {
    private let resources: ContentResourceStore
    private let parser = MarkdownContentParser()
    private var quranCatalogCache: QuranCatalog?
    private var quranCache: [Int: QuranSurah] = [:]
    private var duasCache: [Dua]?
    private var postsCache: [Post]?
    private var booksCache: [LibraryBook]?
    private var publicationsCache: [LibraryPublication]?
    private var quizCache: [QuizQuestion]?
    private var searchIndexCache: [IndexedSearchDocument]?

    init(resources: ContentResourceStore = ContentResourceStore()) {
        self.resources = resources
    }

    func dashboardSnapshot() async throws -> DashboardSnapshot {
        let verse = try quranSurah(number: 1).verses.first
        let posts = try posts()
        return DashboardSnapshot(
            nextPrayer: nil,
            verse: verse.map {
                VerseSummary(
                    arabicText: $0.arabicText,
                    translation: $0.germanTranslation,
                    reference: "Qurʾān 1:\($0.id)"
                )
            },
            recommendation: posts.first.map {
                Recommendation(title: $0.title, category: $0.category ?? "Beitrag", sourceID: $0.id)
            },
            continueReading: nil
        )
    }

    func quranCatalog() throws -> QuranCatalog {
        if let quranCatalogCache { return quranCatalogCache }
        let catalog = try resources.quranCatalog()
        try ContentImportValidator.validate(catalog: catalog)
        quranCatalogCache = catalog
        return catalog
    }

    func quranSurah(number: Int) throws -> QuranSurah {
        if let cached = quranCache[number] { return cached }
        let surah = try resources.quranSurah(number: number)
        try ContentImportValidator.validate(surah: surah)
        quranCache[number] = surah
        return surah
    }

    func duas() throws -> [Dua] {
        if let duasCache { return duasCache }
        let values = try markdownResources()
            .filter { $0.deletingPathExtension().lastPathComponent.hasPrefix("dua-") }
            .compactMap { url -> Dua? in
                guard let markdown = try? String(contentsOf: url, encoding: .utf8) else { return nil }
                return parser.parseDua(id: url.deletingPathExtension().lastPathComponent, markdown: markdown)
            }
            .sorted { ($0.order ?? Int.max) < ($1.order ?? Int.max) }
        duasCache = values
        return values
    }

    func posts() throws -> [Post] {
        if let postsCache { return postsCache }
        let values = try markdownResources()
            .filter { !$0.deletingPathExtension().lastPathComponent.hasPrefix("dua-") }
            .compactMap { url -> Post? in
                guard let markdown = try? String(contentsOf: url, encoding: .utf8) else { return nil }
                return parser.parsePost(id: url.deletingPathExtension().lastPathComponent, markdown: markdown)
            }
            .sorted { ($0.date ?? "") > ($1.date ?? "") }
        postsCache = values
        return values
    }

    func quizQuestions() throws -> [QuizQuestion] {
        if let quizCache { return quizCache }
        let values = try resources.quizQuestions().filter(\.isApprovedAdultContent)
        quizCache = values
        return values
    }

    func libraryBooks() throws -> [LibraryBook] {
        if let booksCache { return booksCache }
        let values = try resources.libraryBooks().filter { $0.verification == "verified" }
        booksCache = values
        return values
    }

    func libraryPublications() throws -> [LibraryPublication] {
        if let publicationsCache { return publicationsCache }
        let values = try resources.libraryPublications().filter {
            $0.status != "withdrawn" && $0.offlineEnabled == true
        }
        publicationsCache = values
        return values
    }

    func search(query: String, kinds: Set<SearchDocumentKind> = Set(SearchDocumentKind.allCases)) throws -> [SearchDocument] {
        let normalizedQuery = normalized(query)
        guard !normalizedQuery.isEmpty else { return [] }

        let index = try searchIndex()
        return index.lazy
            .filter { kinds.contains($0.document.kind) }
            .compactMap { entry -> (SearchDocument, Int)? in
                let matchedFields = entry.normalizedFields.filter { $0.localizedStandardContains(normalizedQuery) }
                guard !matchedFields.isEmpty else { return nil }
                return (entry.document, matchedFields.count)
            }
            .sorted { lhs, rhs in
                if lhs.1 != rhs.1 { return lhs.1 > rhs.1 }
                return lhs.0.id < rhs.0.id
            }
            .map(\.0)
    }

    private struct IndexedSearchDocument: Codable, Sendable {
        let document: SearchDocument
        let normalizedFields: [String]
    }

    private func normalized(_ value: String) -> String {
        let withoutQuranicMarks = value.unicodeScalars.filter { scalar in
            switch scalar.value {
            case 0x0610...0x061A, 0x064B...0x065F, 0x0670, 0x06D6...0x06ED, 0x08D3...0x08FF:
                return false
            default:
                return true
            }
        }
        let folded = String(String.UnicodeScalarView(withoutQuranicMarks))
            .precomposedStringWithCanonicalMapping
            .folding(options: [.diacriticInsensitive, .caseInsensitive], locale: Locale(identifier: "en_US_POSIX"))
        return folded.components(separatedBy: .nonBaseCharacters).joined()
            .replacingOccurrences(of: "أ", with: "ا")
            .replacingOccurrences(of: "إ", with: "ا")
            .replacingOccurrences(of: "آ", with: "ا")
            .replacingOccurrences(of: "ٱ", with: "ا")
            .replacingOccurrences(of: "ؤ", with: "و")
            .replacingOccurrences(of: "ئ", with: "ي")
            .replacingOccurrences(of: "ى", with: "ي")
            .split(whereSeparator: { $0.isWhitespace }).joined(separator: " ")
    }

    private func searchIndex() throws -> [IndexedSearchDocument] {
        if let searchIndexCache { return searchIndexCache }

        let fingerprint = try searchIndexFingerprint()
        let fileURL = try searchIndexURL()
        if let data = try? Data(contentsOf: fileURL),
           let envelope = try? JSONDecoder().decode(SearchIndexEnvelope.self, from: data),
           envelope.fingerprint == fingerprint {
            searchIndexCache = envelope.documents
            return envelope.documents
        }

        let documents = try buildSearchIndex()
        searchIndexCache = documents
        let envelope = SearchIndexEnvelope(fingerprint: fingerprint, documents: documents)
        if let data = try? JSONEncoder().encode(envelope) {
            try? data.write(to: fileURL, options: .atomic)
        }
        return documents
    }

    private struct SearchIndexEnvelope: Codable, Sendable {
        let fingerprint: String
        let documents: [IndexedSearchDocument]
    }

    private func buildSearchIndex() throws -> [IndexedSearchDocument] {
        var documents: [IndexedSearchDocument] = []
        let catalog = try quranCatalog()
        for surah in catalog.surahs {
            documents.append(indexed(SearchDocument(id: "quran-surah-\(surah.id)", kind: .quran, title: surah.transliteration, preview: surah.name, sourceID: "quran:\(surah.id)"), fields: [surah.name, surah.transliteration]))
            let fullSurah = try quranSurah(number: surah.id)
            documents += fullSurah.verses.map { ayah in
                indexed(SearchDocument(id: "quran-\(surah.id)-\(ayah.id)", kind: .quran, title: "Qurʾān \(surah.id):\(ayah.id)", preview: ayah.germanTranslation, sourceID: ayah.sourceID), fields: [ayah.arabicText, ayah.germanTranslation, ayah.transliteration ?? ""])
            }
        }
        documents += try posts().map { post in
            indexed(SearchDocument(id: post.id, kind: .post, title: post.title, preview: post.category ?? "Beitrag", sourceID: post.id), fields: [post.title, post.body, post.category ?? "", post.topic ?? ""])
        }
        documents += try duas().map { dua in
            indexed(SearchDocument(id: dua.id, kind: .dua, title: dua.title, preview: dua.source, sourceID: dua.id), fields: [dua.title, dua.arabic, dua.transliteration, dua.german, dua.source])
        }
        documents += try libraryBooks().map { book in
            indexed(SearchDocument(id: book.id, kind: .library, title: book.title, preview: book.author ?? book.category ?? "Buch", sourceID: book.id), fields: [book.title, book.author ?? "", book.category ?? ""])
        }
        documents += try libraryPublications().map { publication in
            indexed(SearchDocument(id: publication.id, kind: .library, title: publication.title, preview: publication.category ?? "Publikation", sourceID: publication.id), fields: [publication.title, publication.description ?? "", publication.category ?? "", publication.topic ?? ""])
        }
        return documents
    }

    private func indexed(_ document: SearchDocument, fields: [String]) -> IndexedSearchDocument {
        IndexedSearchDocument(document: document, normalizedFields: fields.map(normalized))
    }

    private func searchIndexFingerprint() throws -> String {
        let resourceURL = try searchIndexURL()
        let catalog = try quranCatalog()
        let markdownFingerprint = try markdownResources()
            .sorted { $0.path < $1.path }
            .map { url in
                let modified = (try? url.resourceValues(forKeys: [.contentModificationDateKey]).contentModificationDate?.timeIntervalSince1970) ?? 0
                return "\(url.lastPathComponent):\(modified)"
            }
            .joined(separator: ",")
        return "v3|\(catalog.updated)|\(catalog.surahs.count)|\(markdownFingerprint)|\(resourceURL.path)"
    }

    private func searchIndexURL() throws -> URL {
        let fileManager = FileManager.default
        guard let directory = fileManager.urls(for: .applicationSupportDirectory, in: .userDomainMask).first else {
            throw ContentResourceError.missingResource("Suchindex-Verzeichnis")
        }
        let directoryURL = directory.appendingPathComponent("DARNext", isDirectory: true)
        try fileManager.createDirectory(at: directoryURL, withIntermediateDirectories: true)
        return directoryURL.appendingPathComponent("search-index.json")
    }

    private func markdownResources() throws -> [URL] {
        guard let root = resources.bundle.resourceURL else {
            throw ContentResourceError.missingResource("Markdown-Ressourcen")
        }

        return try FileManager.default.contentsOfDirectory(at: root, includingPropertiesForKeys: nil)
            .filter { $0.pathExtension == "md" }
    }
}
