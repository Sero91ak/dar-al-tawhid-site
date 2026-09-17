import Foundation
import Combine

struct QuranReciterEdition: Codable, Identifiable, Hashable {
    let identifier: String
    let language: String
    let name: String
    let englishName: String
    let format: String
    let type: String
    let direction: String?

    var id: String { identifier }

    var displayName: String {
        QuranReciterNames.preferred[identifier] ?? englishName.nonEmpty ?? name
    }

    var styleName: String {
        let normalizedIdentifier = identifier.lowercased()
        let normalizedType = type.lowercased()

        if normalizedIdentifier.contains("mujawwad") {
            return "Muǧawwad"
        }

        switch normalizedType {
        case "mujawwad": return "Muǧawwad"
        case "murattal": return "Murattal"
        case "muallim": return "Muʿallim"
        case "versebyverse": return "Āyah für Āyah"
        default: return "Rezitation"
        }
    }
}

private extension String {
    var nonEmpty: String? {
        let value = trimmingCharacters(in: .whitespacesAndNewlines)
        return value.isEmpty ? nil : value
    }
}

enum QuranReciterNames {
    static let preferred: [String: String] = [
        "ar.alafasy": "Mišārī Rāšid al-ʿAfāsī",
        "ar.sudais": "ʿAbd ar-Raḥmān as-Sudays",
        "ar.shuraim": "Saʿūd aš-Šuraym",
        "ar.husary": "Maḥmūd Ḫalīl al-Ḥuṣarī",
        "ar.minshawi": "Muḥammad Ṣiddīq al-Minšāwī",
        "ar.minshawimujawwad": "Muḥammad Ṣiddīq al-Minšāwī",
        "ar.abdulbasit": "ʿAbd al-Bāsiṭ ʿAbd aṣ-Ṣamad",
        "ar.abdulbasitmujawwad": "ʿAbd al-Bāsiṭ ʿAbd aṣ-Ṣamad",
        "ar.ajamy": "Aḥmad ibn ʿAlī al-ʿAǧamī",
        "ar.muhammadayoub": "Muḥammad Ayyūb",
        "ar.hudhaify": "ʿAlī al-Ḥuḏayfī",
        "ar.muhammadjibreel": "Muḥammad Ǧibrīl"
    ]
}

private struct QuranEditionsResponse: Decodable {
    let code: Int
    let status: String
    let data: [QuranReciterEdition]
}

struct QuranAyahAudio: Decodable, Identifiable, Hashable {
    let number: Int
    let numberInSurah: Int
    let audio: String?
    let audioSecondary: [String]?

    var id: Int { number }

    var primaryAudioURL: URL? {
        guard let audio else { return nil }
        return URL(string: audio)
    }
}

private struct QuranSurahAudioResponse: Decodable {
    let code: Int
    let status: String
    let data: QuranSurahAudioData
}

private struct QuranSurahAudioData: Decodable {
    let number: Int
    let name: String
    let englishName: String
    let ayahs: [QuranAyahAudio]
}

actor QuranReciterService {
    static let shared = QuranReciterService()

    static let editionsURL = URL(string: "https://api.alquran.cloud/v1/edition/format/audio")!
    static let defaultIdentifier = "ar.alafasy"

    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()
    private let session: URLSession

    init(session: URLSession = .shared) {
        self.session = session
    }

    /// Loads the authoritative live list of Arabic audio editions.
    /// Network is preferred so newly added reciters appear automatically.
    /// If the provider is temporarily unavailable, the last successful list
    /// is loaded from the local tvOS cache, then the bundled fallback list.
    func loadReciters() async -> [QuranReciterEdition] {
        do {
            let response: QuranEditionsResponse = try await fetch(Self.editionsURL)
            let reciters = normalized(response.data)
            guard !reciters.isEmpty else { throw URLError(.cannotParseResponse) }
            try? saveCache(reciters)
            return reciters
        } catch {
            if let cached = try? loadCache(), !cached.isEmpty {
                return normalized(cached)
            }
            return normalized(Self.fallbackReciters)
        }
    }

    /// Returns the verse-by-verse audio URLs for a Sūrah and selected edition.
    /// The provider supplies the real audio URL for each Āyah, so the app does
    /// not need to guess a bitrate or construct MP3 URLs itself.
    func loadSurahAudio(surah: Int, reciterIdentifier: String) async throws -> [QuranAyahAudio] {
        guard (1...114).contains(surah) else { throw URLError(.badURL) }
        let encodedEdition = reciterIdentifier.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? reciterIdentifier
        let url = URL(string: "https://api.alquran.cloud/v1/surah/\(surah)/\(encodedEdition)")!
        let response: QuranSurahAudioResponse = try await fetch(url)
        return response.data.ayahs
    }

    private func normalized(_ editions: [QuranReciterEdition]) -> [QuranReciterEdition] {
        var unique: [String: QuranReciterEdition] = [:]

        for edition in editions where edition.format.lowercased() == "audio" && edition.language.lowercased() == "ar" {
            unique[edition.identifier] = edition
        }

        return unique.values.sorted {
            let lhs = $0.displayName.localizedCaseInsensitiveCompare($1.displayName)
            if lhs == .orderedSame {
                return $0.styleName.localizedCaseInsensitiveCompare($1.styleName) == .orderedAscending
            }
            return lhs == .orderedAscending
        }
    }

    private func fetch<T: Decodable>(_ url: URL) async throws -> T {
        var request = URLRequest(url: url)
        request.cachePolicy = .reloadRevalidatingCacheData
        request.timeoutInterval = 20

        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse,
              (200...299).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
        return try decoder.decode(T.self, from: data)
    }

    private func cacheURL() throws -> URL {
        let root = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("DarAlTawhidAppleTV", isDirectory: true)
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        return root.appendingPathComponent("quran-reciters.json")
    }

    private func saveCache(_ reciters: [QuranReciterEdition]) throws {
        try encoder.encode(reciters).write(to: cacheURL(), options: .atomic)
    }

    private func loadCache() throws -> [QuranReciterEdition] {
        let data = try Data(contentsOf: cacheURL())
        return try decoder.decode([QuranReciterEdition].self, from: data)
    }

    static let fallbackReciters: [QuranReciterEdition] = [
        .init(identifier: "ar.alafasy", language: "ar", name: "مشاري راشد العفاسي", englishName: "Mishary Rashid Alafasy", format: "audio", type: "murattal", direction: nil),
        .init(identifier: "ar.sudais", language: "ar", name: "عبدالرحمن السديس", englishName: "Abdul Rahman Al-Sudais", format: "audio", type: "murattal", direction: nil),
        .init(identifier: "ar.shuraim", language: "ar", name: "سعود الشريم", englishName: "Saud Al-Shuraim", format: "audio", type: "murattal", direction: nil),
        .init(identifier: "ar.husary", language: "ar", name: "محمود خليل الحصري", englishName: "Mahmoud Khalil Al-Husary", format: "audio", type: "murattal", direction: nil),
        .init(identifier: "ar.minshawi", language: "ar", name: "محمد صديق المنشاوي", englishName: "Mohamed Siddiq al-Minshawi", format: "audio", type: "murattal", direction: nil),
        .init(identifier: "ar.minshawimujawwad", language: "ar", name: "محمد صديق المنشاوي", englishName: "Mohamed Siddiq al-Minshawi", format: "audio", type: "mujawwad", direction: nil),
        .init(identifier: "ar.abdulbasit", language: "ar", name: "عبد الباسط عبد الصمد", englishName: "Abdul Basit Abdul Samad", format: "audio", type: "murattal", direction: nil),
        .init(identifier: "ar.abdulbasitmujawwad", language: "ar", name: "عبد الباسط عبد الصمد", englishName: "Abdul Basit Abdul Samad", format: "audio", type: "mujawwad", direction: nil),
        .init(identifier: "ar.ajamy", language: "ar", name: "أحمد بن علي العجمي", englishName: "Ahmed ibn Ali al-Ajamy", format: "audio", type: "murattal", direction: nil),
        .init(identifier: "ar.muhammadayoub", language: "ar", name: "محمد أيوب", englishName: "Muhammad Ayyoub", format: "audio", type: "murattal", direction: nil),
        .init(identifier: "ar.hudhaify", language: "ar", name: "علي بن عبدالرحمن الحذيفي", englishName: "Ali Al-Hudhaify", format: "audio", type: "murattal", direction: nil),
        .init(identifier: "ar.muhammadjibreel", language: "ar", name: "محمد جبريل", englishName: "Muhammad Jibreel", format: "audio", type: "murattal", direction: nil)
    ]
}

@MainActor
final class QuranReciterSelectionStore: ObservableObject {
    @Published private(set) var reciters: [QuranReciterEdition] = []
    @Published private(set) var isLoading = false
    @Published private(set) var loadFinished = false
    @Published var selectedIdentifier: String {
        didSet {
            UserDefaults.standard.set(selectedIdentifier, forKey: Self.selectionKey)
        }
    }

    private static let selectionKey = "dar.appleTV.quran.selectedReciter"
    private let service: QuranReciterService

    init(service: QuranReciterService = .shared) {
        self.service = service
        selectedIdentifier = UserDefaults.standard.string(forKey: Self.selectionKey)
            ?? QuranReciterService.defaultIdentifier
    }

    var selectedReciter: QuranReciterEdition? {
        reciters.first { $0.identifier == selectedIdentifier }
    }

    func load() async {
        guard !isLoading else { return }
        isLoading = true
        let available = await service.loadReciters()
        reciters = available

        if !available.contains(where: { $0.identifier == selectedIdentifier }) {
            selectedIdentifier = available.first(where: { $0.identifier == QuranReciterService.defaultIdentifier })?.identifier
                ?? available.first?.identifier
                ?? QuranReciterService.defaultIdentifier
        }

        isLoading = false
        loadFinished = true
    }

    func select(_ reciter: QuranReciterEdition) {
        selectedIdentifier = reciter.identifier
    }

    func audioForSurah(_ surah: Int) async throws -> [QuranAyahAudio] {
        try await service.loadSurahAudio(surah: surah, reciterIdentifier: selectedIdentifier)
    }
}
