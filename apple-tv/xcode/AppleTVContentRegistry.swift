import Foundation

struct AppleTVContentCatalog: Codable {
    let project: String
    let schemaVersion: String
    let language: String
    let defaultModule: String
    let modules: [AppleTVContentModule]
}

struct AppleTVContentModule: Codable, Identifiable {
    let id: String
    let title: String
    let status: String
    let recordType: String
    let rootPath: String
    let catalogPath: String
    let schemaPath: String
    let remoteLoad: Bool
    let offlineCache: Bool
    let sortOrder: Int
    let scope: String?

    var isActive: Bool { status == "active" }
}

enum AppleTVContentEnvironment {
    static let branch = "apple-tv-hadith-staging"
    static let rootURL = URL(string: "https://raw.githubusercontent.com/Sero91ak/dar-al-tawhid-site/\(branch)/apple-tv")!
}

actor AppleTVContentRegistry {
    static let shared = AppleTVContentRegistry()

    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()

    func loadCatalog() async throws -> AppleTVContentCatalog {
        do {
            let remote: AppleTVContentCatalog = try await fetchJSON(
                AppleTVContentEnvironment.rootURL.appendingPathComponent("catalog.json")
            )
            try saveCache(remote)
            return remote
        } catch {
            if let cached = try? loadCache() {
                return cached
            }
            throw error
        }
    }

    func activeModules() async throws -> [AppleTVContentModule] {
        let catalog = try await loadCatalog()
        return catalog.modules
            .filter(\.isActive)
            .sorted { $0.sortOrder < $1.sortOrder }
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

    private func cacheURL() throws -> URL {
        let root = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("DarAlTawhidAppleTV", isDirectory: true)
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        return root.appendingPathComponent("content-catalog.json")
    }

    private func saveCache(_ catalog: AppleTVContentCatalog) throws {
        try encoder.encode(catalog).write(to: cacheURL(), options: .atomic)
    }

    private func loadCache() throws -> AppleTVContentCatalog {
        let data = try Data(contentsOf: cacheURL())
        return try decoder.decode(AppleTVContentCatalog.self, from: data)
    }
}
