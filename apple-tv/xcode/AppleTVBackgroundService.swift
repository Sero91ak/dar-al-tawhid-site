import Foundation

struct AppleTVBackgroundCatalog: Codable {
    let schemaVersion: String
    let target: String
    let selection: AppleTVBackgroundSelection
    let backgrounds: [AppleTVBackgroundItem]
}

struct AppleTVBackgroundSelection: Codable {
    let mode: String
    let selectedId: String
    let allowUserSelection: Bool
    let rotation: AppleTVBackgroundRotation
}

struct AppleTVBackgroundRotation: Codable {
    let enabled: Bool
    let intervalMinutes: Int
}

struct AppleTVBackgroundItem: Codable, Identifiable {
    let id: String
    let title: String
    let status: String
    let kind: String
    let fit: String
    let source: AppleTVBackgroundSource
    let video: AppleTVBackgroundVideo

    var isActive: Bool { status == "active" }
}

struct AppleTVBackgroundSource: Codable {
    let type: String
    let chunkDirectory: String?
    let chunkCount: Int?
    let fileExtension: String?
    let directPath: String?
    let bundleResource: String?
}

struct AppleTVBackgroundVideo: Codable {
    let codec: String
    let container: String
    let width: Int
    let height: Int
    let frameRate: Int
    let durationSeconds: Int
    let loop: Bool
    let muted: Bool
}

actor AppleTVBackgroundService {
    static let shared = AppleTVBackgroundService()

    private let decoder = JSONDecoder()

    func loadCatalog() async throws -> AppleTVBackgroundCatalog {
        let descriptor = try await AppleTVContentRegistry.shared.backgroundDescriptor()
        guard let descriptor else { throw URLError(.fileDoesNotExist) }

        let url = AppleTVContentEnvironment.rootURL
            .appendingPathComponent(descriptor.catalogPath)

        return try await fetchJSON(url)
    }

    func selectedBackground() async throws -> AppleTVBackgroundItem {
        let catalog = try await loadCatalog()
        let active = catalog.backgrounds.filter(\.isActive)
        guard !active.isEmpty else { throw URLError(.resourceUnavailable) }

        if catalog.selection.rotation.enabled,
           catalog.selection.mode == "rotation" {
            let minutes = max(1, catalog.selection.rotation.intervalMinutes)
            let bucket = Int(Date().timeIntervalSince1970 / Double(minutes * 60))
            return active[bucket % active.count]
        }

        if let selected = active.first(where: { $0.id == catalog.selection.selectedId }) {
            return selected
        }

        return active[0]
    }

    func localVideoURL(for item: AppleTVBackgroundItem) async throws -> URL {
        let ext = item.source.fileExtension ?? "mp4"
        let cached = try cacheURL(for: item.id, ext: ext)

        if FileManager.default.fileExists(atPath: cached.path) {
            return cached
        }

        switch item.source.type {
        case "bundle":
            guard let resource = item.source.bundleResource,
                  let url = Bundle.main.url(forResource: resource, withExtension: ext) else {
                throw URLError(.fileDoesNotExist)
            }
            return url

        case "direct":
            guard let directPath = item.source.directPath else {
                throw URLError(.badURL)
            }
            let remote = AppleTVContentEnvironment.rootURL.appendingPathComponent(directPath)
            let data = try await fetchData(remote)
            try data.write(to: cached, options: .atomic)
            return cached

        case "base64Chunks":
            guard let directory = item.source.chunkDirectory,
                  let count = item.source.chunkCount,
                  count > 0 else {
                throw URLError(.cannotParseResponse)
            }

            var encoded = Data()
            for index in 1...count {
                let filename = String(format: "part-%03d.b64", index)
                let url = AppleTVContentEnvironment.rootURL
                    .appendingPathComponent(directory)
                    .appendingPathComponent(filename)
                encoded.append(try await fetchData(url))
            }

            guard let text = String(data: encoded, encoding: .utf8),
                  let videoData = Data(base64Encoded: text, options: .ignoreUnknownCharacters) else {
                throw URLError(.cannotDecodeContentData)
            }

            try videoData.write(to: cached, options: .atomic)
            return cached

        default:
            throw URLError(.unsupportedURL)
        }
    }

    func selectedLocalVideoURL() async throws -> URL {
        try await localVideoURL(for: selectedBackground())
    }

    private func fetchJSON<T: Decodable>(_ url: URL) async throws -> T {
        let data = try await fetchData(url)
        return try decoder.decode(T.self, from: data)
    }

    private func fetchData(_ url: URL) async throws -> Data {
        var request = URLRequest(url: url)
        request.cachePolicy = .reloadRevalidatingCacheData
        request.timeoutInterval = 30

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse,
              (200...299).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
        return data
    }

    private func cacheURL(for id: String, ext: String) throws -> URL {
        let root = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("DarAlTawhidAppleTV/Backgrounds", isDirectory: true)
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        return root.appendingPathComponent("\(id).\(ext)")
    }
}
