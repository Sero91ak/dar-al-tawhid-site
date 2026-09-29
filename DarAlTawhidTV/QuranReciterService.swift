import Foundation
import Combine

nonisolated struct QuranReciterEdition: Codable, Identifiable, Hashable {
    let identifier: String
    let language: String
    let name: String
    let englishName: String
    let format: String
    let type: String
    let direction: String?

    var id: String { identifier }

    var displayName: String {
        QuranReciterNames.displayName(for: identifier) ?? englishName.nonEmpty ?? name
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

private nonisolated extension String {
    var nonEmpty: String? {
        let value = trimmingCharacters(in: .whitespacesAndNewlines)
        return value.isEmpty ? nil : value
    }
}

nonisolated enum QuranReciterNames {
    static let preferred: [String: String] = [
        "ar.alafasy": "Mišārī Rāšid al-ʿAfāsī",
        "ar.abdurrahmaansudais": "ʿAbd ar-Raḥmān as-Sudays",
        "ar.saoodshuraym": "Saʿūd aš-Šuraym",
        "ar.husary": "Maḥmūd Ḫalīl al-Ḥuṣarī",
        "ar.husarymujawwad": "Maḥmūd Ḫalīl al-Ḥuṣarī",
        "ar.minshawi": "Muḥammad Ṣiddīq al-Minšāwī",
        "ar.minshawimujawwad": "Muḥammad Ṣiddīq al-Minšāwī",
        "ar.abdulbasitmurattal": "ʿAbd al-Bāsiṭ ʿAbd aṣ-Ṣamad",
        "ar.abdulbasitmujawwad": "ʿAbd al-Bāsiṭ ʿAbd aṣ-Ṣamad",
        "ar.abdullahbasfar": "ʿAbdullāh Baṣfar",
        "ar.ahmedajamy": "Aḥmad ibn ʿAlī al-ʿAǧamī",
        "ar.hanirifai": "Hānī ar-Rifāʿī",
        "ar.muhammadayyoub": "Muḥammad Ayyūb",
        "ar.hudhaify": "ʿAlī al-Ḥuḏayfī",
        "ar.mahermuaiqly": "Māhir al-Muʿayqlī",
        "ar.muhammadjibreel": "Muḥammad Ǧibrīl",
        "ar.shaatree": "Abū Bakr aš-Šāṭirī",
        "ar.yasseraldossari": "Yāsir ad-Dawsarī",
        "ar.aymanswoaid": "Ayman Suwayd"
    ]

    static func displayName(for identifier: String) -> String? {
        if let exact = preferred[identifier] { return exact }

        let parts = identifier.split(separator: "-", omittingEmptySubsequences: false)
        guard let suffix = parts.last,
              !suffix.isEmpty,
              suffix.allSatisfy(\.isNumber) else { return nil }

        return preferred[parts.dropLast().joined(separator: "-")]
    }
}

private nonisolated struct QuranEditionsResponse: Decodable {
    let code: Int
    let status: String
    let data: [QuranReciterEdition]
}

private nonisolated struct QuranRemoteCatalog: Decodable {
    let reciters: [QuranRemoteReciter]

    enum CodingKeys: String, CodingKey {
        case reciters
        case data
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        if let listed = try container.decodeIfPresent([QuranRemoteReciter].self, forKey: .reciters),
           !listed.isEmpty {
            reciters = listed
        } else {
            reciters = try container.decode([QuranRemoteReciter].self, forKey: .data)
        }
    }
}

private nonisolated struct QuranRemoteReciter: Decodable {
    let name: String
    let edition: String
    let style: String?

    enum CodingKeys: String, CodingKey {
        case name
        case edition
        case style
        case identifier
        case englishName
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let english = try container.decodeIfPresent(String.self, forKey: .englishName)
        name = try container.decodeIfPresent(String.self, forKey: .name) ?? english ?? "Qurʾān"
        edition = try container.decodeIfPresent(String.self, forKey: .edition)
            ?? container.decode(String.self, forKey: .identifier)
        style = try container.decodeIfPresent(String.self, forKey: .style)
    }
}

nonisolated struct QuranAyahAudio: Codable, Identifiable, Hashable {
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

private nonisolated struct QuranSurahAudioResponse: Decodable {
    let code: Int
    let status: String
    let data: QuranSurahAudioData
}

private nonisolated struct QuranSurahAudioData: Decodable {
    let number: Int
    let name: String
    let englishName: String
    let ayahs: [QuranAyahAudio]
}

actor QuranReciterService {
    static let shared = QuranReciterService()

    static let catalogURL = URL(string: "https://dar-al-tawhid.de/data/quran-reciters.json")!
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
            let catalog: QuranRemoteCatalog = try await fetch(Self.catalogURL)
            let reciters = catalog.reciters.map {
                QuranReciterEdition(
                    identifier: $0.edition,
                    language: "ar",
                    name: $0.name,
                    englishName: $0.name,
                    format: "audio",
                    type: $0.style ?? "versebyverse",
                    direction: nil
                )
            }
            guard !reciters.isEmpty else { throw URLError(.cannotParseResponse) }
            try? saveCache(reciters)
            return reciters
        } catch {
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
    }

    /// Returns the verse-by-verse audio URLs for a Sūrah and selected edition.
    /// The provider supplies the real audio URL for each Āyah, so the app does
    /// not need to guess a bitrate or construct MP3 URLs itself.
    func loadSurahAudio(surah: Int, reciterIdentifier: String) async throws -> [QuranAyahAudio] {
        guard (1...114).contains(surah) else { throw URLError(.badURL) }
        let cacheName = "quran-audio-\(surah)-\(reciterIdentifier.replacingOccurrences(of: "/", with: "-")).json"
        let cached: [QuranAyahAudio]? = {
            guard let url = try? cacheRoot().appendingPathComponent(cacheName),
                  let data = try? Data(contentsOf: url) else { return nil }
            return try? decoder.decode([QuranAyahAudio].self, from: data)
        }()
        if let cached, !cached.isEmpty {
            return await QuranAudioDiskPack.shared.prepare(ayahs: cached, edition: reciterIdentifier)
        }

        do {
            let encodedEdition = reciterIdentifier.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? reciterIdentifier
            let proxy = URL(string: "https://dar-al-tawhid.de/quran-audio/\(encodedEdition)/surah/\(surah).json")!
            let response: QuranSurahAudioResponse = try await fetch(proxy)
            guard response.code == 200, !response.data.ayahs.isEmpty else {
                throw URLError(.cannotParseResponse)
            }
            if let cacheURL = try? cacheRoot().appendingPathComponent(cacheName),
               let data = try? encoder.encode(response.data.ayahs) {
                try? data.write(to: cacheURL, options: .atomic)
            }
            let packed = await QuranAudioDiskPack.shared.prepare(ayahs: response.data.ayahs, edition: reciterIdentifier)
            return packed
        } catch {
            if let cached, !cached.isEmpty {
                return await QuranAudioDiskPack.shared.prepare(ayahs: cached, edition: reciterIdentifier)
            }
            throw error
        }
    }

    private func normalized(_ editions: [QuranReciterEdition]) -> [QuranReciterEdition] {
        var uniqueIdentifiers: [String: QuranReciterEdition] = [:]

        for edition in editions {
            let isArabicAudio = edition.format.lowercased() == "audio"
                && edition.language.lowercased() == "ar"
            let isAyahCompatible = edition.type.lowercased() != "surahbysurah"

            guard isArabicAudio, isAyahCompatible else { continue }
            uniqueIdentifiers[edition.identifier] = edition
        }

        // The Apple-TV edition deliberately exposes these 17 complete Qurrāʾ.
        // Live metadata replaces bundled metadata, but a partial provider response
        // can never remove one of the curated reciters from the picker.
        return Self.fallbackReciters.map { fallback in
            uniqueIdentifiers[fallback.identifier] ?? fallback
        }
    }

    private func fetch<T: Decodable>(_ url: URL) async throws -> T {
        var request = URLRequest(url: url)
        request.cachePolicy = .reloadIgnoringLocalCacheData
        request.setValue("no-cache", forHTTPHeaderField: "Cache-Control")
        request.timeoutInterval = 20

        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse,
              (200...299).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
        return try decoder.decode(T.self, from: data)
    }

    private func cacheRoot() throws -> URL {
        let root = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("DarAlTawhidAppleTV", isDirectory: true)
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        return root
    }

    private func cacheURL() throws -> URL {
        try cacheRoot().appendingPathComponent("quran-reciters.json")
    }

    private func saveCache(_ reciters: [QuranReciterEdition]) throws {
        try encoder.encode(reciters).write(to: cacheURL(), options: .atomic)
    }

    private func loadCache() throws -> [QuranReciterEdition] {
        let data = try Data(contentsOf: cacheURL())
        return try decoder.decode([QuranReciterEdition].self, from: data)
    }

    static let fallbackReciters: [QuranReciterEdition] = [
        .init(identifier: "ar.alafasy", language: "ar", name: "مشاري راشد العفاسي", englishName: "Mishary Rashid Alafasy", format: "audio", type: "versebyverse", direction: nil),
        .init(identifier: "ar.abdurrahmaansudais", language: "ar", name: "عبدالرحمن السديس", englishName: "Abdurrahmaan As-Sudais", format: "audio", type: "versebyverse", direction: nil),
        .init(identifier: "ar.saoodshuraym", language: "ar", name: "سعود الشريم", englishName: "Saood bin Ibraaheem Ash-Shuraym", format: "audio", type: "versebyverse", direction: nil),
        .init(identifier: "ar.husary", language: "ar", name: "محمود خليل الحصري", englishName: "Husary", format: "audio", type: "versebyverse", direction: nil),
        .init(identifier: "ar.husarymujawwad", language: "ar", name: "محمود خليل الحصري (المجود)", englishName: "Husary (Mujawwad)", format: "audio", type: "versebyverse", direction: nil),
        .init(identifier: "ar.minshawi", language: "ar", name: "محمد صديق المنشاوي", englishName: "Minshawi", format: "audio", type: "versebyverse", direction: nil),
        .init(identifier: "ar.minshawimujawwad", language: "ar", name: "محمد صديق المنشاوي (المجود)", englishName: "Minshawy (Mujawwad)", format: "audio", type: "versebyverse", direction: nil),
        .init(identifier: "ar.abdulbasitmurattal", language: "ar", name: "عبد الباسط عبد الصمد", englishName: "Abdul Basit", format: "audio", type: "versebyverse", direction: nil),
        .init(identifier: "ar.abdulbasitmujawwad", language: "ar", name: "عبد الباسط عبد الصمد (المجود)", englishName: "Abdul Basit (Mujawwad)", format: "audio", type: "versebyverse", direction: nil),
        .init(identifier: "ar.abdullahbasfar", language: "ar", name: "عبد الله بصفر", englishName: "Abdullah Basfar", format: "audio", type: "versebyverse", direction: nil),
        .init(identifier: "ar.ahmedajamy", language: "ar", name: "أحمد بن علي العجمي", englishName: "Ahmed ibn Ali al-Ajamy", format: "audio", type: "versebyverse", direction: nil),
        .init(identifier: "ar.hanirifai", language: "ar", name: "هاني الرفاعي", englishName: "Hani Rifai", format: "audio", type: "versebyverse", direction: nil),
        .init(identifier: "ar.hudhaify", language: "ar", name: "علي بن عبدالرحمن الحذيفي", englishName: "Hudhaify", format: "audio", type: "versebyverse", direction: nil),
        .init(identifier: "ar.mahermuaiqly", language: "ar", name: "ماهر المعيقلي", englishName: "Maher Al Muaiqly", format: "audio", type: "versebyverse", direction: nil),
        .init(identifier: "ar.muhammadayyoub", language: "ar", name: "محمد أيوب", englishName: "Muhammad Ayyoub", format: "audio", type: "versebyverse", direction: nil),
        .init(identifier: "ar.muhammadjibreel", language: "ar", name: "محمد جبريل", englishName: "Muhammad Jibreel", format: "audio", type: "versebyverse", direction: nil),
        .init(identifier: "ar.shaatree", language: "ar", name: "أبو بكر الشاطري", englishName: "Abu Bakr Ash-Shaatree", format: "audio", type: "versebyverse", direction: nil),
        .init(identifier: "ar.yasseraldossari", language: "ar", name: "ياسر الدوسري", englishName: "Yasser Al-Dosari", format: "audio", type: "versebyverse", direction: nil),
        .init(identifier: "ar.aymanswoaid", language: "ar", name: "أيمن سويد", englishName: "Ayman Sowaid", format: "audio", type: "versebyverse", direction: nil)
    ]
}

@MainActor
final class QuranReciterSelectionStore: ObservableObject {
    @Published private(set) var reciters: [QuranReciterEdition] = QuranReciterService.fallbackReciters
    @Published private(set) var isLoading = false
    @Published private(set) var loadFinished = false
    @Published var selectedIdentifier: String {
        didSet {
            UserDefaults.standard.set(selectedIdentifier, forKey: Self.selectionKey)
        }
    }

    @Published private(set) var downloadingIdentifiers: Set<String> = []

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

    func download(_ reciter: QuranReciterEdition) {
        guard !downloadingIdentifiers.contains(reciter.identifier) else { return }
        downloadingIdentifiers.insert(reciter.identifier)
        Task { @MainActor [weak self] in
            await QuranAudioDiskPack.shared.downloadReciter(reciter.identifier)
            self?.downloadingIdentifiers.remove(reciter.identifier)
        }
    }

    func audioForSurah(_ surah: Int) async throws -> [QuranAyahAudio] {
        try await service.loadSurahAudio(surah: surah, reciterIdentifier: selectedIdentifier)
    }
}
