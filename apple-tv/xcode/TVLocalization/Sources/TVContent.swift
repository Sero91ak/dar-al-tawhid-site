import Foundation

public enum TVContentSection: String, CaseIterable, Identifiable {
    case posts
    case quran
    case tadabbur
    case athar
    case hadith
    case dua

    public var id: String { rawValue }

    public var stringKey: TVStringKey {
        switch self {
        case .posts: return .posts
        case .quran: return .quran
        case .tadabbur: return .tadabbur
        case .athar: return .athar
        case .hadith: return .hadith
        case .dua: return .dua
        }
    }
}

public struct TVResolvedText: Equatable {
    public var text: String
    public var locale: String
    public var review: String
    public var usedFallback: Bool
}

public struct TVLibraryRow: Identifiable, Equatable {
    public var id: String
    public var title: String
    public var detail: String
    public var source: String
    public var review: String
    public var usedFallback: Bool
    /// Technical key only. Never place this in a visible title or source line.
    public var showsInternalId: Bool { false }
}

public struct TVQuranVerseView: Equatable {
    public var reference: String
    public var arabic: String
    public var meaning: TVResolvedText
    public var transliterationIsNotATranslation: Bool { true }
}

public struct TVDuaView: Identifiable, Equatable {
    public var id: String
    public var arabic: String
    public var title: String
    public var occasion: String
    public var meaning: TVResolvedText
    public var source: String
}

/// Loads the same adult packs the website already uses.
/// Missing religious text stays German. Nothing in this type writes a new translation.
@MainActor
public final class TVContentClient: ObservableObject {
    public static let transliterationIsNotATranslation = true

    @Published public private(set) var rows: [TVLibraryRow] = []
    @Published public private(set) var verses: [TVQuranVerseView] = []
    @Published public private(set) var duas: [TVDuaView] = []
    @Published public private(set) var loading = false
    @Published public private(set) var errorMessage: String?
    @Published public private(set) var germanPostCount: Int?
    @Published public private(set) var corpusCount: Int?
    private var generation = 0

    private let site: URL
    private let session: URLSession
    private var hadithPacks: [String: [String: HadithItem]] = [:]
    private var contentPacks: [String: ContentPack] = [:]
    private var shell: [ShellRecord]?
    private var canonicalDuas: [DuaRecord]?
    private var quranCache: [CachedVerse]?

    public init(site: URL = URL(string: "https://dar-al-tawhid.de")!, session: URLSession = .shared) {
        self.site = site
        self.session = session
    }

    public func reload(_ section: TVContentSection, locale: String) async {
        generation += 1
        let token = generation
        loading = true
        errorMessage = nil
        rows = []
        verses = []
        duas = []
        corpusCount = nil
        germanPostCount = nil
        do {
            switch section {
            case .posts:
                rows = try await loadPosts(locale)
            case .quran:
                verses = try await loadQuran(locale)
            case .tadabbur:
                rows = try await loadTadabbur(locale)
            case .hadith:
                rows = try await loadLibrary(locale, recordType: "hadith")
            case .athar:
                rows = try await loadLibrary(locale, recordType: "athar")
            case .dua:
                duas = try await loadDuas(locale)
            }
        } catch is CancellationError {
        } catch {
            if token == generation { errorMessage = error.localizedDescription }
        }
        if token == generation { loading = false }
    }

    public static func overlay(german: String, translated: String?, locale: String) -> TVResolvedText {
        let original = german.trimmingCharacters(in: .whitespacesAndNewlines)
        let next = translated?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if locale == "de" || next.isEmpty {
            return TVResolvedText(text: original, locale: "de", review: locale == "de" ? "original" : "fallback-de", usedFallback: locale != "de")
        }
        return TVResolvedText(text: next, locale: locale, review: "machine-translation-owner-approved", usedFallback: false)
    }

    private func loadPosts(_ locale: String) async throws -> [TVLibraryRow] {
        if locale == "de" {
            let index: PostIndex = try await get("content/posts/posts-index.json")
            germanPostCount = index.count
            return []
        }
        germanPostCount = nil
        let pack = try await contentPack(locale)
        corpusCount = pack.posts.count
        return pack.posts.keys.sorted().map { id in
            let item = pack.posts[id]
            let resolved = Self.overlay(german: "", translated: item?.title, locale: locale)
            return TVLibraryRow(
                id: "post:" + id,
                title: plain(item?.title ?? ""),
                detail: plain(item?.body ?? ""),
                source: "",
                review: resolved.review,
                usedFallback: item?.title == nil
            )
        }
    }

    private func loadQuran(_ locale: String) async throws -> [TVQuranVerseView] {
        if quranCache == nil {
            var cached: [CachedVerse] = []
            cached.reserveCapacity(6236)
            let origin = site
            let clientSession = self.session
            var next = 1
            while next <= 114 {
                let upper = min(next + 5, 115)
                let chunk = Array(next..<upper)
                let files: [QuranFile] = try await withThrowingTaskGroup(of: (Int, QuranFile).self) { group in
                    for number in chunk {
                        group.addTask {
                            let name = String(format: "content/quran/%03d.json", number)
                            let file: QuranFile = try await Self.fetch(site: origin, path: name, session: clientSession)
                            return (number, file)
                        }
                    }
                    var found: [(Int, QuranFile)] = []
                    for try await item in group { found.append(item) }
                    return found.sorted { $0.0 < $1.0 }.map(\.1)
                }
                for (offset, file) in files.enumerated() {
                    let surah = chunk[offset]
                    for verse in file.verses {
                        cached.append(CachedVerse(reference: "\(surah):\(verse.id)", arabic: verse.ar, german: verse.de ?? ""))
                    }
                }
                next = upper
            }
            quranCache = cached
        }
        let cached = quranCache ?? []
        corpusCount = cached.count
        return cached.map { verse in
            TVQuranVerseView(reference: verse.reference, arabic: verse.arabic, meaning: Self.overlay(german: verse.german, translated: nil, locale: locale))
        }
    }

    private func loadTadabbur(_ locale: String) async throws -> [TVLibraryRow] {
        let index: TadabburIndex = try await get("apple-tv/quran/tadabbur/entries-index.json")
        corpusCount = index.totalVerifiedEntries
        let file: TadabburFile = try await get("apple-tv/quran/tadabbur/entries.json")
        return file.entries.map { entry in
            let text = Self.overlay(german: entry.text, translated: nil, locale: locale)
            return TVLibraryRow(
                id: "tadabbur:" + entry.reference,
                title: entry.reference + " · " + entry.narrator,
                detail: plain(text.text),
                source: entry.source,
                review: text.review,
                usedFallback: text.usedFallback
            )
        }
    }

    private func loadLibrary(_ locale: String, recordType: String) async throws -> [TVLibraryRow] {
        let records = try await library().filter { $0.recordType == recordType }
        let pack = locale == "de" ? [:] : try await hadithPack(locale)
        corpusCount = records.count
        return records.map { record in
            let item = pack[record.id]
            let text = Self.overlay(german: record.textMarkdown, translated: item?.text, locale: locale)
            let speaker = item?.speaker?.isEmpty == false ? item?.speaker : record.speakerLabel
            return TVLibraryRow(
                id: record.recordType + ":" + record.id,
                title: plain(speaker ?? record.narratorLine),
                detail: plain(text.text),
                source: record.source,
                review: text.review,
                usedFallback: text.usedFallback
            )
        }
    }

    private func loadDuas(_ locale: String) async throws -> [TVDuaView] {
        let records = try await duaRecords()
        let pack = locale == "de" ? nil : try await contentPack(locale)
        corpusCount = records.count
        return records.map { record in
            let item = pack?.duas[record.id] ?? pack.flatMap { matchDua($0, record) }
            let meaning = Self.overlay(german: record.de, translated: item?.meaning, locale: locale)
            return TVDuaView(
                id: record.id,
                arabic: record.ar,
                title: plain(item?.title ?? record.title),
                occasion: plain(item?.occasion ?? record.occasion ?? ""),
                meaning: meaning,
                source: record.src ?? ""
            )
        }
    }

    private func matchDua(_ pack: ContentPack, _ record: DuaRecord) -> DuaItem? {
        let meaning = norm(record.de)
        let title = norm(record.title)
        return pack.duaByMeaning[meaning] ?? pack.duaByMeaning[title]
    }

    private func contentPack(_ locale: String) async throws -> ContentPack {
        if let cached = contentPacks[locale] { return cached }
        let pack: ContentPack = try await get("assets/i18n/content/\(locale).json")
        contentPacks[locale] = pack
        return pack
    }

    private func hadithPack(_ locale: String) async throws -> [String: HadithItem] {
        if let cached = hadithPacks[locale] { return cached }
        let pack: HadithFile = try await get("assets/i18n/content/hadith-\(locale).json")
        hadithPacks[locale] = pack.items
        return pack.items
    }

    private func library() async throws -> [ShellRecord] {
        if let shell { return shell }
        let file: ShellFile = try await get("apple-tv/hadith/library-shell.json")
        shell = file.records
        return file.records
    }

    private func duaRecords() async throws -> [DuaRecord] {
        if let canonicalDuas { return canonicalDuas }
        let records: [DuaRecord] = try await get("content/duas/duas.json")
        canonicalDuas = records
        return records
    }

    private func get<T: Decodable>(_ path: String) async throws -> T {
        try await Self.fetch(site: site, path: path, session: session)
    }

    private nonisolated static func fetch<T: Decodable>(site: URL, path: String, session: URLSession) async throws -> T {
        let url = site.appendingPathComponent(path)
        let (data, response) = try await session.data(from: url)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }
        return try JSONDecoder().decode(T.self, from: data)
    }

    private func plain(_ value: String) -> String {
        value
            .replacingOccurrences(of: "**", with: "")
            .replacingOccurrences(of: "*", with: "")
            .replacingOccurrences(of: #"HAD-\d{4}"#, with: "", options: .regularExpression)
    }

    private func norm(_ value: String) -> String {
        plain(value).split { $0.isWhitespace }.joined(separator: " ")
    }
}

private struct PostIndex: Decodable { var count: Int }

private struct HadithFile: Decodable { var items: [String: HadithItem] }
private struct HadithItem: Decodable {
    var text: String?
    var narrator: String?
    var speaker: String?
    var sharh: String?
}

private struct ContentPack: Decodable {
    var posts: [String: PostItem]
    var duas: [String: DuaItem]
    var duaByMeaning: [String: DuaItem]

    private enum CodingKeys: String, CodingKey { case posts, duas, duaByMeaning }

    init(from decoder: Decoder) throws {
        let box = try decoder.container(keyedBy: CodingKeys.self)
        posts = try box.decodeIfPresent([String: PostItem].self, forKey: .posts) ?? [:]
        duas = try box.decodeIfPresent([String: DuaItem].self, forKey: .duas) ?? [:]
        duaByMeaning = try box.decodeIfPresent([String: DuaItem].self, forKey: .duaByMeaning) ?? [:]
    }
}

private struct PostItem: Decodable { var title: String?; var body: String? }
private struct DuaItem: Decodable { var title: String?; var occasion: String?; var meaning: String? }

private struct ShellFile: Decodable { var records: [ShellRecord] }
private struct ShellRecord: Decodable {
    var id: String
    var recordType: String
    var narratorLine: String
    var speakerLabel: String?
    var textMarkdown: String
    var source: String
}

private struct CachedVerse {
    var reference: String
    var arabic: String
    var german: String
}

private struct TadabburIndex: Decodable { var totalVerifiedEntries: Int }

private struct QuranFile: Decodable { var verses: [QuranVerse] }
private struct QuranVerse: Decodable {
    var id: Int
    var ar: String
    var de: String?
    /// Lautschrift in content/quran. This is not a Turkish meaning.
    var transliteration: String?
    var transliterationIsNotATranslation: Bool { true }

    private enum CodingKeys: String, CodingKey { case id, ar, de, transliteration = "tr" }
}

private struct TadabburFile: Decodable { var entries: [TadabburEntry] }
private struct TadabburEntry: Decodable {
    var reference: String
    var text: String
    var narrator: String
    var source: String
}

private struct DuaRecord: Decodable {
    var id: String
    var title: String
    var occasion: String?
    var ar: String
    var de: String
    var src: String?
    /// Lautschrift. Not the Turkish translation.
    var transliteration: String?
    var transliterationIsNotATranslation: Bool { true }

    private enum CodingKeys: String, CodingKey {
        case id, title, occasion, ar, de, src
        case transliteration = "tr"
    }
}
