import Foundation

struct HadithSeriesIndex: Codable {
    let series: String
    let count: Int
    let firstId: String
    let lastId: String
    let files: [String]
}

actor HadithRemoteService {
    static let shared = HadithRemoteService()

    // Staging-Branch ohne Slash, damit raw.githubusercontent.com stabil genutzt werden kann.
    private let baseURL = URL(string: "https://raw.githubusercontent.com/Sero91ak/dar-al-tawhid-site/apple-tv-hadith-staging/apple-tv/hadith")!
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()

    func loadSeries(_ series: String = "001-050") async throws -> [HadithRecord] {
        do {
            let remote = try await fetchSeries(series)
            try saveCache(remote, series: series)
            return remote
        } catch {
            if let cached = try? loadCache(series: series), !cached.isEmpty {
                return cached
            }
            throw error
        }
    }

    private func fetchSeries(_ series: String) async throws -> [HadithRecord] {
        let indexURL = baseURL
            .appendingPathComponent("series")
            .appendingPathComponent(series)
            .appendingPathComponent("index.json")

        let index: HadithSeriesIndex = try await fetchJSON(indexURL)
        var records: [HadithRecord] = []
        records.reserveCapacity(index.files.count)

        for file in index.files {
            let url = baseURL
                .appendingPathComponent("series")
                .appendingPathComponent(series)
                .appendingPathComponent(file)
            let record: HadithRecord = try await fetchJSON(url)
            records.append(record)
        }

        return records
    }

    private func fetchJSON<T: Decodable>(_ url: URL) async throws -> T {
        var request = URLRequest(url: url)
        request.cachePolicy = .reloadRevalidatingCacheData
        request.timeoutInterval = 20

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse,
              (200...299).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
        return try decoder.decode(T.self, from: data)
    }

    private func cacheURL(series: String) throws -> URL {
        let root = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("DarAlTawhidHadith", isDirectory: true)
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        return root.appendingPathComponent("series-\(series).json")
    }

    private func saveCache(_ records: [HadithRecord], series: String) throws {
        let data = try encoder.encode(records)
        try data.write(to: cacheURL(series: series), options: .atomic)
    }

    private func loadCache(series: String) throws -> [HadithRecord] {
        let data = try Data(contentsOf: cacheURL(series: series))
        return try decoder.decode([HadithRecord].self, from: data)
    }
}
