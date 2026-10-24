import Foundation

nonisolated struct QuranSurahSummary: Codable, Identifiable, Hashable {
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

nonisolated struct QuranTextAyah: Codable, Identifiable, Hashable {
    let number: Int
    let text: String
    let numberInSurah: Int

    var id: Int { number }
}

nonisolated struct QuranSynchronizedVerse: Codable, Identifiable, Hashable {
    let globalNumber: Int
    let numberInSurah: Int
    let arabicText: String
    let transliterationText: String
    let germanText: String
    let audioURLString: String

    var id: Int { globalNumber }

    var audioURL: URL? {
        URL(string: audioURLString)
    }
}

nonisolated struct QuranSynchronizedSurah: Codable, Hashable {
    let number: Int
    let arabicName: String
    let englishName: String
    let germanTranslationName: String
    let reciterIdentifier: String
    let verses: [QuranSynchronizedVerse]
}

nonisolated struct QuranReaderVerse: Equatable {
    let reference: String
    let arabic: String
    let german: String
}

private nonisolated struct QuranSurahListResponse: Decodable {
    let code: Int
    let status: String
    let data: [QuranSurahSummary]
}

private nonisolated struct QuranTextSurahResponse: Decodable {
    let code: Int
    let status: String
    let data: QuranTextSurahData
}

private nonisolated struct QuranTextSurahData: Decodable {
    let number: Int
    let name: String
    let englishName: String
    let englishNameTranslation: String
    let ayahs: [QuranTextAyah]
}

actor QuranContentService {
    static let shared = QuranContentService()

    static let arabicEdition = "quran-uthmani"
    static let transliterationEdition = "en.transliteration"
    static let germanEdition = "de.bubenheim"
    static let germanTranslationName = "Bubenheim & Elyas"

    private let session: URLSession
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()

    init(session: URLSession = .shared) {
        self.session = session
    }

    func loadSurahList() async throws -> [QuranSurahSummary] {
        let cached: [QuranSurahSummary]? = try? load(filename: "quran-surah-list.json")
        do {
            let url = URL(string: "https://dar-al-tawhid.de/quran-text/surah-list.json")!
            let response: QuranSurahListResponse = try await fetch(url)
            guard response.data.count == 114 else {
                throw URLError(.cannotParseResponse)
            }
            try? save(response.data, filename: "quran-surah-list.json")
            return response.data
        } catch {
            if let cached, !cached.isEmpty {
                return cached
            }
            throw error
        }
    }

    func loadReaderVerse(reference: String) async throws -> QuranReaderVerse {
        let parts = reference.split(separator: ":")
        guard parts.count == 2,
              let surah = Int(parts[0]),
              let ayah = Int(parts[1].split(separator: "-").first ?? "") else {
            throw URLError(.badURL)
        }

        async let arabicResponse: QuranTextSurahResponse = fetch(textURL(surah: surah, edition: Self.arabicEdition))
        async let germanResponse: QuranTextSurahResponse = fetch(textURL(surah: surah, edition: Self.germanEdition))
        let (arabic, german) = try await (arabicResponse, germanResponse)
        guard let arabicAyah = arabic.data.ayahs.first(where: { $0.numberInSurah == ayah }),
              let germanAyah = german.data.ayahs.first(where: { $0.numberInSurah == ayah }) else {
            throw URLError(.cannotParseResponse)
        }

        return QuranReaderVerse(
            reference: reference,
            arabic: arabicAyah.text,
            german: germanAyah.text
        )
    }

    func loadSynchronizedSurah(
        surah: Int,
        reciterIdentifier: String,
        reciterService: QuranReciterService = .shared
    ) async throws -> QuranSynchronizedSurah {
        guard (1...114).contains(surah) else { throw URLError(.badURL) }

        let cacheName = "quran-surah-v2-\(surah)-\(safeFilename(reciterIdentifier)).json"
        let cached: QuranSynchronizedSurah? = try? load(filename: cacheName)
        if let cached, !cached.verses.isEmpty {
            // Repair older cache entries that may still contain obsolete provider URLs.
            let repaired = canonicalizeAudioURLs(in: cached, reciterIdentifier: reciterIdentifier)
            try? save(repaired, filename: cacheName)
            return repaired
        }

        do {
            async let arabicResponse: QuranTextSurahResponse = fetch(textURL(surah: surah, edition: Self.arabicEdition))
            async let transliterationResponse: QuranTextSurahResponse = fetch(textURL(surah: surah, edition: Self.transliterationEdition))
            async let germanResponse: QuranTextSurahResponse = fetch(textURL(surah: surah, edition: Self.germanEdition))
            async let audioResponse = reciterService.loadSurahAudio(surah: surah, reciterIdentifier: reciterIdentifier)

            let (arabic, transliteration, german, audio) = try await (arabicResponse, transliterationResponse, germanResponse, audioResponse)
            guard arabic.code == 200, transliteration.code == 200, german.code == 200, !audio.isEmpty else {
                throw URLError(.cannotParseResponse)
            }

            let transliterationByAyah = Dictionary(uniqueKeysWithValues: transliteration.data.ayahs.map { ($0.numberInSurah, $0) })
            let germanByAyah = Dictionary(uniqueKeysWithValues: german.data.ayahs.map { ($0.numberInSurah, $0) })
            let audioByAyah = Dictionary(uniqueKeysWithValues: audio.map { ($0.numberInSurah, $0) })

            let verses = arabic.data.ayahs.compactMap { arabicAyah -> QuranSynchronizedVerse? in
                guard let transliterationAyah = transliterationByAyah[arabicAyah.numberInSurah],
                      let germanAyah = germanByAyah[arabicAyah.numberInSurah],
                      let audioAyah = audioByAyah[arabicAyah.numberInSurah],
                      let audioURL = audioAyah.audio,
                      URL(string: audioURL) != nil else {
                    return nil
                }

                return QuranSynchronizedVerse(
                    globalNumber: arabicAyah.number,
                    numberInSurah: arabicAyah.numberInSurah,
                    arabicText: arabicAyah.text,
                    transliterationText: transliterationAyah.text,
                    germanText: germanAyah.text,
                    audioURLString: audioAyah.audio ?? canonicalAudioURL(
                        edition: reciterIdentifier,
                        surah: surah,
                        ayah: arabicAyah.numberInSurah,
                        globalAyah: arabicAyah.number
                    )
                )
            }

            guard verses.count == arabic.data.ayahs.count,
                  verses.count == transliteration.data.ayahs.count,
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
            if let cached, !cached.verses.isEmpty {
                let repaired = canonicalizeAudioURLs(in: cached, reciterIdentifier: reciterIdentifier)
                try? save(repaired, filename: cacheName)
                return repaired
            }
            throw error
        }
    }

    private func textURL(surah: Int, edition: String) -> URL {
        let safeEdition = edition.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? edition
        return URL(string: "https://dar-al-tawhid.de/quran-text/\(safeEdition)/surah/\(surah).json")!
    }

    private func fetch<T: Decodable>(_ url: URL) async throws -> T {
        var request = URLRequest(url: url)
        request.cachePolicy = .reloadIgnoringLocalCacheData
        request.setValue("no-cache", forHTTPHeaderField: "Cache-Control")
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

    private func canonicalizeAudioURLs(
        in surah: QuranSynchronizedSurah,
        reciterIdentifier: String
    ) -> QuranSynchronizedSurah {
        let verses = surah.verses.map { verse in
            QuranSynchronizedVerse(
                globalNumber: verse.globalNumber,
                numberInSurah: verse.numberInSurah,
                arabicText: verse.arabicText,
                transliterationText: verse.transliterationText,
                germanText: verse.germanText,
                audioURLString: preservedLocalAudioURL(
                    from: verse.audioURLString,
                    edition: reciterIdentifier,
                    surah: surah.number,
                    ayah: verse.numberInSurah,
                    globalAyah: verse.globalNumber
                )
            )
        }

        return QuranSynchronizedSurah(
            number: surah.number,
            arabicName: surah.arabicName,
            englishName: surah.englishName,
            germanTranslationName: surah.germanTranslationName,
            reciterIdentifier: reciterIdentifier,
            verses: verses
        )
    }

    private func preservedLocalAudioURL(
        from existing: String,
        edition: String,
        surah: Int,
        ayah: Int,
        globalAyah: Int
    ) -> String {
        if let url = URL(string: existing),
           url.isFileURL,
           FileManager.default.fileExists(atPath: url.path) {
            return existing
        }
        return canonicalAudioURL(
            edition: edition,
            surah: surah,
            ayah: ayah,
            globalAyah: globalAyah
        )
    }

    private func canonicalAudioURL(
        edition: String,
        surah: Int,
        ayah: Int,
        globalAyah: Int
    ) -> String {
        let folders: [String: String] = [
            "ar.alafasy": "Alafasy_128kbps",
            "ar.abdurrahmaansudais": "Abdurrahmaan_As-Sudais_192kbps",
            "ar.saoodshuraym": "Saood_ash-Shuraym_128kbps",
            "ar.husary": "Husary_128kbps",
            "ar.husarymujawwad": "Husary_Mujawwad_128kbps",
            "ar.minshawi": "Minshawy_Murattal_128kbps",
            "ar.minshawimujawwad": "Minshawy_Mujawwad_192kbps",
            "ar.abdulbasitmurattal": "Abdul_Basit_Murattal_192kbps",
            "ar.abdulbasitmujawwad": "Abdul_Basit_Mujawwad_128kbps",
            "ar.abdullahbasfar": "Abdullah_Basfar_192kbps",
            "ar.ahmedajamy": "Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah.net",
            "ar.hanirifai": "Hani_Rifai_192kbps",
            "ar.hudhaify": "Hudhaify_128kbps",
            "ar.mahermuaiqly": "MaherAlMuaiqly128kbps",
            "ar.muhammadayyoub": "Muhammad_Ayyoub_128kbps",
            "ar.muhammadjibreel": "Muhammad_Jibreel_128kbps",
            "ar.shaatree": "Abu_Bakr_Ash-Shaatree_128kbps",
            "ar.yasseraldossari": "Yasser_Ad-Dussary_128kbps",
            "ar.aymanswoaid": "Ayman_Sowaid_64kbps"
        ]

        if let folder = folders[edition] {
            return String(
                format: "https://everyayah.com/data/%@/%03d%03d.mp3",
                folder,
                surah,
                ayah
            )
        }

        let encodedEdition = edition.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? edition
        return "https://dar-al-tawhid.de/quran-audio/\(encodedEdition)/\(globalAyah).mp3"
    }

    private func safeFilename(_ value: String) -> String {
        value.replacingOccurrences(of: "/", with: "-")
            .replacingOccurrences(of: ":", with: "-")
            .replacingOccurrences(of: " ", with: "-")
    }
}
