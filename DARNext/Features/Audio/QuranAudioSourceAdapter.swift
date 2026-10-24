import Foundation

struct QuranAudioReciter: Identifiable, Codable, Hashable, Sendable {
    let id: String
    let arabicName: String
    let englishName: String
    let style: String
}

actor QuranAudioSourceAdapter {
    static let shared = QuranAudioSourceAdapter()
    static let defaultReciter = "ar.alafasy"

    private let session: URLSession
    private let decoder = JSONDecoder()

    init(session: URLSession = .shared) {
        self.session = session
    }

    func reciters() async throws -> [QuranAudioReciter] {
        let url = URL(string: "https://dar-al-tawhid.de/data/quran-reciters.json")!
        let (data, response) = try await session.data(from: url)
        try validate(response)
        let payload = try decoder.decode(ReciterPayload.self, from: data)
        return payload.reciters.map {
            QuranAudioReciter(
                id: $0.edition,
                arabicName: $0.name,
                englishName: $0.englishName ?? $0.name,
                style: $0.style ?? "Murattal"
            )
        }
    }

    func tracks(surah: Int, reciterID: String) async throws -> [QuranAudioTrack] {
        guard (1...114).contains(surah) else { throw URLError(.badURL) }
        let encoded = reciterID.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? reciterID
        let url = URL(string: "https://dar-al-tawhid.de/quran-audio/\(encoded)/surah/\(surah).json")!
        let (data, response) = try await session.data(from: url)
        try validate(response)
        let payload = try decoder.decode(SurahAudioPayload.self, from: data)
        return payload.data.ayahs.compactMap { ayah in
            guard let audio = ayah.audio, let sourceURL = URL(string: audio) else { return nil }
            return QuranAudioTrack(
                id: "\(reciterID):quran:\(ayah.number)",
                surahNumber: surah,
                ayahNumber: ayah.numberInSurah,
                surahTitle: payload.data.name,
                reciterName: reciterID,
                sourceURL: sourceURL,
                isOfflineAvailable: false
            )
        }
    }

    private func validate(_ response: URLResponse) throws {
        guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
    }
}

private struct ReciterPayload: Decodable {
    let reciters: [Reciter]
}

private struct Reciter: Decodable {
    let edition: String
    let name: String
    let englishName: String?
    let style: String?
}

private struct SurahAudioPayload: Decodable {
    let data: SurahAudioData
}

private struct SurahAudioData: Decodable {
    let name: String
    let ayahs: [AyahAudio]
}

private struct AyahAudio: Decodable {
    let number: Int
    let numberInSurah: Int
    let audio: String?
}
