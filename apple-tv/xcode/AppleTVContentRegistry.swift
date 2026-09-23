import Foundation

struct AppleTVContentCatalog: Codable {
    let project: String
    let schemaVersion: String
    let language: String
    let defaultModule: String
    let remoteContentSync: AppleTVRemoteContentSyncPolicy?
    let screensaver: AppleTVScreensaverDescriptor?
    let backgrounds: AppleTVBackgroundDescriptor?
    let quran: AppleTVQuranDescriptor?
    let modules: [AppleTVContentModule]
}

struct AppleTVRemoteContentSyncPolicy: Codable {
    let enabled: Bool
    let rule: String?
    let checkOnAppStart: Bool
    let checkOnForeground: Bool
    let checkOnAppleTVWake: Bool
    let minimumRefreshIntervalHours: Int
    let offlineCache: Bool
    let atomicCacheActivation: Bool
    let keepLastGoodCacheOnError: Bool
}

struct AppleTVScreensaverDescriptor: Codable {
    let enabled: Bool
    let status: String?
    let catalogPath: String?
    let rotationConfigPath: String
    let remoteLoad: Bool?
    let offlineCache: Bool?
    let fallbackRequired: Bool?

    var isActive: Bool { enabled && (status == nil || status == "active") }
}

struct AppleTVBackgroundDescriptor: Codable {
    let status: String
    let target: String
    let catalogPath: String
    let selectionMode: String
    let allowUserSelection: Bool

    var isActive: Bool { status == "active" && target == "tvOS-only" }
}

struct AppleTVQuranDescriptor: Codable {
    let reader: AppleTVQuranReaderDescriptor?
    let audio: AppleTVQuranAudioDescriptor?
    let tadabbur: AppleTVQuranTadabburDescriptor?
}

struct AppleTVQuranReaderDescriptor: Codable {
    let status: String
    let target: String
    let view: String
    let arabicEdition: String
    let germanEdition: String
    let germanTranslationName: String
    let syncMode: String
    let autoAdvance: Bool
    let persistLastPosition: Bool
    let remoteLoad: Bool
    let offlineCache: Bool

    var isActive: Bool { status == "active" && target == "tvOS-only" }
}

struct AppleTVQuranAudioDescriptor: Codable {
    let status: String
    let target: String
    let catalogPath: String
    let remoteLoad: Bool
    let offlineCache: Bool
    let fallbackRequired: Bool

    var isActive: Bool { status == "active" && target == "tvOS-only" }
}

struct AppleTVQuranTadabburDescriptor: Codable {
    let status: String
    let target: String
    let rootPath: String
    let catalogPath: String
    let schemaPath: String?
    let entriesPath: String?
    let entriesIndexPath: String?
    let coveragePath: String?
    let remoteLoad: Bool
    let offlineCache: Bool
    let fallbackRequired: Bool

    var isActive: Bool { status == "active" && target == "tvOS-only" }
}

struct AppleTVContentModule: Codable, Identifiable {
    let id: String
    let title: String
    let status: String
    let recordType: String
    let rootPath: String
    let catalogPath: String
    let schemaPath: String?
    let remoteLoad: Bool
    let offlineCache: Bool
    let sortOrder: Int
    let scope: String?
    let requiresModule: String?

    var isActive: Bool { status == "active" }
    var isPlanned: Bool { status == "planned" }
    var canRemoteSync: Bool { remoteLoad && offlineCache }
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

    func remoteContentSyncPolicy() async throws -> AppleTVRemoteContentSyncPolicy? {
        let catalog = try await loadCatalog()
        return catalog.remoteContentSync
    }

    func activeModules() async throws -> [AppleTVContentModule] {
        let catalog = try await loadCatalog()
        return catalog.modules
            .filter(\.isActive)
            .sorted { $0.sortOrder < $1.sortOrder }
    }

    func syncableModules(includePlanned: Bool = true) async throws -> [AppleTVContentModule] {
        let catalog = try await loadCatalog()
        return catalog.modules
            .filter { module in
                module.canRemoteSync && (module.isActive || (includePlanned && module.isPlanned))
            }
            .sorted { $0.sortOrder < $1.sortOrder }
    }

    func module(id: String) async throws -> AppleTVContentModule? {
        let catalog = try await loadCatalog()
        return catalog.modules.first { $0.id == id }
    }

    func screensaverDescriptor() async throws -> AppleTVScreensaverDescriptor? {
        let catalog = try await loadCatalog()
        guard let descriptor = catalog.screensaver, descriptor.isActive else {
            return nil
        }
        return descriptor
    }

    func backgroundDescriptor() async throws -> AppleTVBackgroundDescriptor? {
        let catalog = try await loadCatalog()
        guard let descriptor = catalog.backgrounds, descriptor.isActive else {
            return nil
        }
        return descriptor
    }

    func quranReaderDescriptor() async throws -> AppleTVQuranReaderDescriptor? {
        let catalog = try await loadCatalog()
        guard let descriptor = catalog.quran?.reader, descriptor.isActive else {
            return nil
        }
        return descriptor
    }

    func quranAudioDescriptor() async throws -> AppleTVQuranAudioDescriptor? {
        let catalog = try await loadCatalog()
        guard let descriptor = catalog.quran?.audio, descriptor.isActive else {
            return nil
        }
        return descriptor
    }

    func quranTadabburDescriptor() async throws -> AppleTVQuranTadabburDescriptor? {
        let catalog = try await loadCatalog()
        guard let descriptor = catalog.quran?.tadabbur, descriptor.isActive else {
            return nil
        }
        return descriptor
    }

    nonisolated func url(forRelativePath path: String) -> URL {
        AppleTVContentEnvironment.rootURL.appendingPathComponent(path)
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
