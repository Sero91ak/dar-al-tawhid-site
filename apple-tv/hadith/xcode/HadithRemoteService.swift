import Foundation

struct HadithCatalog: Codable {
    let project: String
    let schemaVersion: String
    let language: String
    let authenticOnly: Bool
    let totalCount: Int
    let currentSeries: String
    let latestId: String
    let nextId: String
    let series: [HadithCatalogSeries]
}

struct HadithCatalogSeries: Codable {
    let id: String
    let count: Int
    let firstId: String
    let lastId: String
    let indexPath: String
}

struct HadithSeriesIndex: Codable {
    let series: String
    let count: Int
    let firstId: String
    let lastId: String
    let files: [String]
}

actor HadithRemoteService {
    static let shared = HadithRemoteService()

    private let baseURL = AppleTVContentEnvironment.rootURL.appendingPathComponent("hadith")
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()

    /// Lädt automatisch alle im GitHub-Ḥadīṯ-Katalog registrierten Serien.
    /// Neue 50er-Blöcke benötigen keinen neuen App-Code, solange catalog.json aktualisiert wird.
    func loadAllHadith() async throws -> [HadithRecord] {
        do {
            let catalog: HadithCatalog = try await fetchJSON(
                baseURL.appendingPathComponent("catalog.json")
            )

            var all: [HadithRecord] = []
            all.reserveCapacity(catalog.totalCount)

            for series in catalog.series {
                let records = try await fetchSeries(series.id)
                all.append(contentsOf: records)
            }

            let ordered = all.sorted { $0.id < $1.id }
            try saveAllCache(ordered)
            return ordered
        } catch {
            if let cached = try? loadAllCache(), !cached.isEmpty {
                return cached
            }
            throw error
        }
    }

    /// Optional: lädt nur eine bestimmte Serie, z. B. 001-050.
    func loadSeries(_ series: String) async throws -> [HadithRecord] {
        do {
            let remote = try await fetchSeries(series)
            try saveSeriesCache(remote, series: series)
            return remote
        } catch {
            if let cached = try? loadSeriesCache(series: series), !cached.isEmpty {
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

        return records.sorted { $0.id < $1.id }
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

    private func cacheRoot() throws -> URL {
        let root = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("DarAlTawhidHadith", isDirectory: true)
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        return root
    }

    private func allCacheURL() throws -> URL {
        try cacheRoot().appendingPathComponent("all-hadith.json")
    }

    private func seriesCacheURL(_ series: String) throws -> URL {
        try cacheRoot().appendingPathComponent("series-\(series).json")
    }

    private func saveAllCache(_ records: [HadithRecord]) throws {
        try encoder.encode(records).write(to: allCacheURL(), options: .atomic)
    }

    private func loadAllCache() throws -> [HadithRecord] {
        let data = try Data(contentsOf: allCacheURL())
        return try decoder.decode([HadithRecord].self, from: data)
    }

    private func saveSeriesCache(_ records: [HadithRecord], series: String) throws {
        try encoder.encode(records).write(to: seriesCacheURL(series), options: .atomic)
    }

    private func loadSeriesCache(series: String) throws -> [HadithRecord] {
        let data = try Data(contentsOf: seriesCacheURL(series))
        return try decoder.decode([HadithRecord].self, from: data)
    }
}
