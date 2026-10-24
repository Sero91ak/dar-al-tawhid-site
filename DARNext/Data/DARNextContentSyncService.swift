import Foundation

struct DARNextContentManifest: Codable, Sendable, Equatable {
    let version: String
    let requiredStatic: [String]
    let requiredData: [String]
}

enum DARNextContentSyncError: LocalizedError {
    case invalidEndpoint
    case invalidResponse
    case invalidManifest
    case unavailable

    var errorDescription: String? {
        switch self {
        case .invalidEndpoint:
            "Der zentrale DAR-Content-Endpunkt ist ungültig."
        case .invalidResponse:
            "Der zentrale DAR-Content-Endpunkt antwortet ungültig."
        case .invalidManifest:
            "Das zentrale DAR-Manifest ist ungültig."
        case .unavailable:
            "Der zentrale DAR-Content ist vorübergehend nicht erreichbar."
        }
    }
}

actor DARNextContentSyncService {
    private let session: URLSession
    private let manifestURL = URL(string: "https://dar-al-tawhid.de/data/offline-content-manifest.json")
    private let cacheURL: URL
    private var etag: String?

    init(session: URLSession = .shared) {
        self.session = session
        let applicationSupport = FileManager.default.urls(
            for: .applicationSupportDirectory,
            in: .userDomainMask
        ).first ?? FileManager.default.temporaryDirectory
        let directory = applicationSupport.appendingPathComponent("DARNext", isDirectory: true)
        try? FileManager.default.createDirectory(
            at: directory,
            withIntermediateDirectories: true
        )
        cacheURL = directory.appendingPathComponent("content-manifest.json")
    }

    func refresh() async throws -> DARNextContentManifest {
        guard let manifestURL else {
            throw DARNextContentSyncError.invalidEndpoint
        }

        var request = URLRequest(url: manifestURL)
        request.cachePolicy = .reloadRevalidatingCacheData
        if let etag {
            request.setValue(etag, forHTTPHeaderField: "If-None-Match")
        }

        do {
            let (data, response) = try await session.data(for: request)
            guard let httpResponse = response as? HTTPURLResponse else {
                throw DARNextContentSyncError.invalidResponse
            }

            if httpResponse.statusCode == 304 {
                return try cachedManifest()
            }

            guard (200...299).contains(httpResponse.statusCode) else {
                throw DARNextContentSyncError.invalidResponse
            }

            if let responseETag = httpResponse.value(forHTTPHeaderField: "ETag") {
                etag = responseETag
            }

            let manifest = try JSONDecoder().decode(DARNextContentManifest.self, from: data)
            guard !manifest.version.isEmpty,
                  !manifest.requiredStatic.isEmpty,
                  !manifest.requiredData.isEmpty,
                  manifest.requiredStatic.allSatisfy(validRelativePath),
                  manifest.requiredData.allSatisfy(validRelativePath)
            else {
                throw DARNextContentSyncError.invalidManifest
            }
            try data.write(to: cacheURL, options: .atomic)
            return manifest
        } catch let error as DARNextContentSyncError {
            if let cached = try? cachedManifest() {
                return cached
            }
            throw error
        } catch {
            if let cached = try? cachedManifest() {
                return cached
            }
            throw DARNextContentSyncError.unavailable
        }
    }

    private func cachedManifest() throws -> DARNextContentManifest {
        guard let data = try? Data(contentsOf: cacheURL) else {
            throw DARNextContentSyncError.unavailable
        }
        return try JSONDecoder().decode(DARNextContentManifest.self, from: data)
    }

    private func validRelativePath(_ path: String) -> Bool {
        !path.isEmpty && !path.hasPrefix("/") && !path.contains("..")
    }
}
