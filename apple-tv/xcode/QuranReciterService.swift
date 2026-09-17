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

private extension String {
    var nonEmpty: String? {
        let value = trimmingCharacters(in: .whitespacesAndNewlines)
        return value.isEmpty ? nil : value
    }

    var reciterSearchKey: String {
        folding(options: [.diacriticInsensitive, .caseInsensitive], locale: Locale(identifier: "en_US_POSIX"))
            .lowercased()
            .replacingOccurrences(of: "-", with: "")
            .replacingOccurrences(of: "_", with: "")
            .replacingOccurrences(of: " ", with: "")
            .replacingOccurrences(of: ".", with: "")
            .replacingOccurrences(of: "'", with: "")
            .replacingOccurrences(of: "’", with: "")
    }
}

private struct CuratedReciterProfile {
    let displayName: String
    let preferredIdentifiers: [String]
    let matchTokens: [String]

    func matches(_ edition: QuranReciterEdition) -> Bool {
        let identifier = edition.identifier.reciterSearchKey
        let englishName = edition.englishName.reciterSearchKey
        return preferredIdentifiers.contains { identifier == $0.reciterSearchKey }
            || matchTokens.contains { token in
                let key = token.reciterSearchKey
                return identifier.contains(key) || englishName.contains(key)
            }
    }
}

enum QuranReciterNames {
    /// Curated Apple-TV selection. One audio edition per reciter, in this exact UI order.
    static let curated: [CuratedReciterProfile] = [
        .init(displayName: "Mišārī Rāšid al-ʿAfāsī", preferredIdentifiers: ["ar.alafasy"], matchTokens: ["alafasy", "mishary"]),
        .init(displayName: "ʿAbd ar-Raḥmān as-Sudays", preferredIdentifiers: ["ar.sudais", "ar.abdurrahmaansudais", "ar.abdulrahmansudais"], matchTokens: ["sudais", "sudays"]),
        .init(displayName: "Saʿūd aš-Šuraym", preferredIdentifiers: ["ar.shuraim", "ar.shuraym", "ar.saoodshuraym"], matchTokens: ["shuraim", "shuraym"]),
        .init(displayName: "Māhir al-Muʿayqlī", preferredIdentifiers: ["ar.mahermuaiqly", "ar.maheralmueaqly"], matchTokens: ["mahermuaiqly", "muaiqly", "muayqli"]),
        .init(displayName: "Muḥammad Ṣiddīq al-Minšāwī", preferredIdentifiers: ["ar.minshawi"], matchTokens: ["minshawi", "minshaw"]),
        .init(displayName: "ʿAbd al-Bāsiṭ ʿAbd aṣ-Ṣamad", preferredIdentifiers: ["ar.abdulbasit", "ar.abdulbasitmurattal", "ar.abdulsamad"], matchTokens: ["abdulbasit", "abdulsamad"]),
        .init(displayName: "Maḥmūd Ḫalīl al-Ḥuṣarī", preferredIdentifiers: ["ar.husary"], matchTokens: ["husary", "hussary"]),
        .init(displayName: "ʿAlī al-Ḥuḏayfī", preferredIdentifiers: ["ar.hudhaify"], matchTokens: ["hudhaify", "huthaify"]),
        .init(displayName: "Muḥammad Ayyūb", preferredIdentifiers: ["ar.muhammadayoub", "ar.muhammadayyoub"], matchTokens: ["muhammadayoub", "muhammadayyoub"]),
        .init(displayName: "Aḥmad ibn ʿAlī al-ʿAǧamī", preferredIdentifiers: ["ar.ajamy", "ar.ahmedajamy"], matchTokens: ["ajamy", "ajmi"]),
        .init(displayName: "Muḥammad Ǧibrīl", preferredIdentifiers: ["ar.muhammadjibreel", "ar.jibreel"], matchTokens: ["jibreel", "jebril"]),
        .init(displayName: "Saʿd al-Ġāmidī", preferredIdentifiers: ["ar.saadalghamdi", "ar.saadghamdi"], matchTokens: ["ghamdi"]),
        .init(displayName: "Abū Bakr aš-Šāṭirī", preferredIdentifiers: ["ar.shaatree", "ar.shatri"], matchTokens: ["shatri", "shaatree"]),
        .init(displayName: "Hānī ar-Rifāʿī", preferredIdentifiers: ["ar.hanirifai", "ar.rifai"], matchTokens: ["hanirifai", "rifai"]),
        .init(displayName: "ʿAbdullāh Baṣfar", preferredIdentifiers: ["ar.abdullahbasfar", "ar.basfar"], matchTokens: ["basfar"]),
        .init(displayName: "Fāris ʿAbbād", preferredIdentifiers: ["ar.faresabbad", "ar.fares"], matchTokens: ["faresabbad", "fares", "farisabbad"]),
        .init(displayName: "Yāsir ad-Dawsarī", preferredIdentifiers: ["ar.yasserdossari", "ar.yasirdosari"], matchTokens: ["yasseraddossari", "yasserdossari", "dosari", "dossari"]),
        .init(displayName: "Nāṣir al-Qaṭāmī", preferredIdentifiers: ["ar.nasseralqatami", "ar.qatami"], matchTokens: ["qatami"]),
        .init(displayName: "Ṣalāḥ al-Budayr", preferredIdentifiers: ["ar.salahalbudair", "ar.salahbudair"], matchTokens: ["budair", "budayr"]),
        .init(displayName: "Ibrāhīm al-Aḫḍar", preferredIdentifiers: ["ar.ibrahimakhbar", "ar.ibrahimalakhdar"], matchTokens: ["ibrahimakh", "alakhdar", "alakhdar"])
    ]

    static func displayName(for identifier: String) -> String? {
        curated.first { profile in
            profile.preferredIdentifiers.contains {
                $0.reciterSearchKey == identifier.reciterSearchKey
            }
        }?.displayName
    }
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

    /// Loads the provider catalogue, but exposes only the curated 20 Apple-TV reciters.
    /// One edition is selected per person so users never see 200+ technical variants.
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
    func loadSurahAudio(surah: Int, reciterIdentifier: String) async throws -> [QuranAyahAudio] {
        guard (1...114).contains(surah) else { throw URLError(.badURL) }
        let encodedEdition = reciterIdentifier.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? reciterIdentifier
        let url = URL(string: "https://api.alquran.cloud/v1/surah/\(surah)/\(encodedEdition)")!
        let response: QuranSurahAudioResponse = try await fetch(url)
        return response.data.ayahs
    }

    private func normalized(_ editions: [QuranReciterEdition]) -> [QuranReciterEdition] {
        let arabicAudio = editions.filter {
            $0.format.lowercased() == "audio" && $0.language.lowercased() == "ar"
        }

        var result: [QuranReciterEdition] = []
        var usedIdentifiers = Set<String>()

        for profile in QuranReciterNames.curated {
            let candidates = arabicAudio.filter(profile.matches)
            guard !candidates.isEmpty else { continue }

            let selected = candidates.sorted { lhs, rhs in
                editionRank(lhs, profile: profile) < editionRank(rhs, profile: profile)
            }.first!

            if usedIdentifiers.insert(selected.identifier).inserted {
                result.append(selected)
            }
        }

        return Array(result.prefix(20))
    }

    private func editionRank(_ edition: QuranReciterEdition, profile: CuratedReciterProfile) -> Int {
        let identifier = edition.identifier.reciterSearchKey

        if let exactIndex = profile.preferredIdentifiers.firstIndex(where: {
            $0.reciterSearchKey == identifier
        }) {
            return exactIndex
        }

        var score = 100
        if identifier.contains("mujawwad") { score += 30 }
        if identifier.contains("muallim") { score += 20 }
        if identifier.contains("translation") { score += 50 }
        score += edition.identifier.count
        return score
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
        .init(identifier: "ar.mahermuaiqly", language: "ar", name: "ماهر المعيقلي", englishName: "Maher Al Muaiqly", format: "audio", type: "murattal", direction: nil),
        .init(identifier: "ar.minshawi", language: "ar", name: "محمد صديق المنشاوي", englishName: "Mohamed Siddiq al-Minshawi", format: "audio", type: "murattal", direction: nil),
        .init(identifier: "ar.abdulbasit", language: "ar", name: "عبد الباسط عبد الصمد", englishName: "Abdul Basit Abdul Samad", format: "audio", type: "murattal", direction: nil),
        .init(identifier: "ar.husary", language: "ar", name: "محمود خليل الحصري", englishName: "Mahmoud Khalil Al-Husary", format: "audio", type: "murattal", direction: nil),
        .init(identifier: "ar.hudhaify", language: "ar", name: "علي الحذيفي", englishName: "Ali Al-Hudhaify", format: "audio", type: "murattal", direction: nil),
        .init(identifier: "ar.muhammadayoub", language: "ar", name: "محمد أيوب", englishName: "Muhammad Ayyoub", format: "audio", type: "murattal", direction: nil),
        .init(identifier: "ar.ajamy", language: "ar", name: "أحمد العجمي", englishName: "Ahmed Al-Ajmy", format: "audio", type: "murattal", direction: nil),
        .init(identifier: "ar.muhammadjibreel", language: "ar", name: "محمد جبريل", englishName: "Muhammad Jibreel", format: "audio", type: "murattal", direction: nil),
        .init(identifier: "ar.saadalghamdi", language: "ar", name: "سعد الغامدي", englishName: "Saad Al-Ghamdi", format: "audio", type: "murattal", direction: nil),
        .init(identifier: "ar.shaatree", language: "ar", name: "أبو بكر الشاطري", englishName: "Abu Bakr Al-Shatri", format: "audio", type: "murattal", direction: nil),
        .init(identifier: "ar.hanirifai", language: "ar", name: "هاني الرفاعي", englishName: "Hani Ar-Rifai", format: "audio", type: "murattal", direction: nil),
        .init(identifier: "ar.abdullahbasfar", language: "ar", name: "عبد الله بصفر", englishName: "Abdullah Basfar", format: "audio", type: "murattal", direction: nil),
        .init(identifier: "ar.faresabbad", language: "ar", name: "فارس عباد", englishName: "Fares Abbad", format: "audio", type: "murattal", direction: nil),
        .init(identifier: "ar.yasserdossari", language: "ar", name: "ياسر الدوسري", englishName: "Yasser Al-Dosari", format: "audio", type: "murattal", direction: nil),
        .init(identifier: "ar.nasseralqatami", language: "ar", name: "ناصر القطامي", englishName: "Nasser Al-Qatami", format: "audio", type: "murattal", direction: nil),
        .init(identifier: "ar.salahalbudair", language: "ar", name: "صلاح البدير", englishName: "Salah Al-Budair", format: "audio", type: "murattal", direction: nil),
        .init(identifier: "ar.ibrahimakhbar", language: "ar", name: "إبراهيم الأخضر", englishName: "Ibrahim Al-Akhdar", format: "audio", type: "murattal", direction: nil)
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
