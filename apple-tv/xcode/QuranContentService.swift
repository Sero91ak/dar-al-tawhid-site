import Foundation

struct QuranSurahSummary: Codable, Identifiable, Hashable {
    let number: Int
    let name: String
    let englishName: String
    let englishNameTranslation: String
    let numberOfAyahs: Int
    let revelationType: String

    var id: Int { number }

    var displayTitle: String {
        "\(number). \(englishName)"
    }
}

struct QuranTextAyah: Codable, Identifiable, Hashable {
    let number: Int
    let text: String
    let numberInSurah: Int

    var id: Int { number }
}

struct QuranSynchronizedVerse: Codable, Identifiable, Hashable {
    let globalNumber: Int
    let numberInSurah: Int
    let arabicText: String
    let germanText: String
    let audioURLString: String

    var id: Int { globalNumber }

    var audioURL: URL? {
        URL(string: audioURLString)
    }
}

struct QuranSynchronizedSurah: Codable, Hashable {
    let number: Int
    let arabicName: String
    let englishName: String
    let germanTranslationName: String
    let reciterIdentifier: String
    let verses: [QuranSynchronizedVerse]
}

private struct QuranSurahListResponse: Decodable {
    let code: Int
    let status: String
    let data: [QuranSurahSummary]
}

private struct QuranTextSurahResponse: Decodable {
    let code: Int
    let status: String
    let data: QuranTextSurahData
}

private struct QuranTextSurahData: Decodable {
    let number: Int
    let name: String
    let englishName: String
    let englishNameTranslation: String
    let ayahs: [QuranTextAyah]
}

actor QuranContentService {
    static let shared = QuranContentService()

    static let arabicEdition = "quran-uthmani"
    static let germanEdition = "de.bubenheim"
    static let germanTranslationName = "Bubenheim & Elyas"

    private let session: URLSession
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()

    init(session: URLSession = .shared) {
        self.session = session
    }

    func loadSurahList() async throws -> [QuranSurahSummary] {
        do {
            let url = URL(string: "https://api.alquran.cloud/v1/surah")!
            let response: QuranSurahListResponse = try await fetch(url)
            guard response.data.count == 114 else {
                throw URLError(.cannotParseResponse)
            }
            try? save(response.data, filename: "quran-surah-list.json")
            return response.data
        } catch {
            if let cached: [QuranSurahSummary] = try? load(filename: "quran-surah-list.json"), !cached.isEmpty {
                return cached
            }
            throw error
        }
    }

    func loadSynchronizedSurah(
        surah: Int,
        reciterIdentifier: String,
        reciterService: QuranReciterService = .shared
    ) async throws -> QuranSynchronizedSurah {
        guard (1...114).contains(surah) else { throw URLError(.badURL) }

        let cacheName = "quran-surah-\(surah)-\(safeFilename(reciterIdentifier)).json"

        do {
            async let arabicResponse: QuranTextSurahResponse = fetch(textURL(surah: surah, edition: Self.arabicEdition))
            async let germanResponse: QuranTextSurahResponse = fetch(textURL(surah: surah, edition: Self.germanEdition))
            async let audioResponse = reciterService.loadSurahAudio(surah: surah, reciterIdentifier: reciterIdentifier)

            let (arabic, german, audio) = try await (arabicResponse, germanResponse, audioResponse)

            let germanByAyah = Dictionary(uniqueKeysWithValues: german.data.ayahs.map { ($0.numberInSurah, $0) })
            let audioByAyah = Dictionary(uniqueKeysWithValues: audio.map { ($0.numberInSurah, $0) })

            let verses = arabic.data.ayahs.compactMap { arabicAyah -> QuranSynchronizedVerse? in
                guard let germanAyah = germanByAyah[arabicAyah.numberInSurah],
                      let audioAyah = audioByAyah[arabicAyah.numberInSurah],
                      let audioURL = audioAyah.audio,
                      URL(string: audioURL) != nil else {
                    return nil
                }

                return QuranSynchronizedVerse(
                    globalNumber: arabicAyah.number,
                    numberInSurah: arabicAyah.numberInSurah,
                    arabicText: arabicAyah.text,
                    germanText: germanAyah.text,
                    audioURLString: audioURL
                )
            }

            guard verses.count == arabic.data.ayahs.count,
                  verses.count == german.data.ayahs.count,
                  verses.count == audio.count,
                  !verses.isEmpty else {
                throw URLError(.cannotParseResponse)
            }

            let synchronized = QuranSynchronizedSurah(
                number: surah,
                arabicName: arabic.data.name,
                englishName: arabic.data.englishName,
                germanTranslationName: Self.germanTranslationName,
                reciterIdentifier: reciterIdentifier,
                verses: verses
            )

            try? save(synchronized, filename: cacheName)
            return synchronized
        } catch {
            if let cached: QuranSynchronizedSurah = try? load(filename: cacheName), !cached.verses.isEmpty {
                return cached
            }
            throw error
        }
    }

    private func textURL(surah: Int, edition: String) -> URL {
        let safeEdition = edition.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? edition
        return URL(string: "https://api.alquran.cloud/v1/surah/\(surah)/\(safeEdition)")!
    }

    private func fetch<T: Decodable>(_ url: URL) async throws -> T {
        var request = URLRequest(url: url)
        request.cachePolicy = .reloadRevalidatingCacheData
        request.timeoutInterval = 25

        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse,
              (200...299).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
        return try decoder.decode(T.self, from: data)
    }

    private func cacheRoot() throws -> URL {
        let root = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("DarAlTawhidAppleTV/Quran", isDirectory: true)
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        return root
    }

    private func save<T: Encodable>(_ value: T, filename: String) throws {
        let url = try cacheRoot().appendingPathComponent(filename)
        try encoder.encode(value).write(to: url, options: .atomic)
    }

    private func load<T: Decodable>(filename: String) throws -> T {
        let url = try cacheRoot().appendingPathComponent(filename)
        let data = try Data(contentsOf: url)
        return try decoder.decode(T.self, from: data)
    }

    private func safeFilename(_ value: String) -> String {
        value.replacingOccurrences(of: "/", with: "-")
            .replacingOccurrences(of: ":", with: "-")
            .replacingOccurrences(of: " ", with: "-")
    }
}
