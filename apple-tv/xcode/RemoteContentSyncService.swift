import Foundation

struct RemoteAreaCatalog: Codable {
    struct Fallback: Codable {
        let enabled: Bool
        let text: String
    }

    struct SyncPolicy: Codable {
        let checkOnAppStart: Bool?
        let checkOnForeground: Bool?
        let checkOnAppleTVWake: Bool?
        let checkOnHadithOpen: Bool?
        let minimumRefreshIntervalHours: Int?
        let atomicCacheActivation: Bool?
        let keepLastGoodCacheOnError: Bool?
    }

    let project: String?
    let schemaVersion: String
    let contentType: String
    let status: String?
    let remoteLoad: Bool
    let offlineCache: Bool
    let contentVersion: Int?
    let entriesCount: Int
    let lastUpdated: String?
    let entriesIndexPath: String?
    let entriesPaths: [String]
    let fallback: Fallback?
    let syncPolicy: SyncPolicy?
}

struct RemoteEntriesIndex: Codable {
    let schemaVersion: String
    let totalVerifiedEntries: Int?
    let totalEntries: Int?
    let entriesCount: Int?
    let files: [RemoteIndexedFile]
}

struct RemoteIndexedFile: Codable {
    let path: String
    let count: Int
}

enum RemoteContentSyncTrigger: String {
    case appStart
    case foreground
    case appleTVWake
    case contentOpen
    case screensaverStart
    case hadithOpen
    case manual
}

struct RemoteContentSyncReport {
    let startedAt: Date
    let finishedAt: Date
    let syncedCatalogs: [String]
    let failedCatalogs: [String]

    var isClean: Bool { failedCatalogs.isEmpty }
}

actor RemoteContentSyncService {
    static let shared = RemoteContentSyncService()

    private let registry: AppleTVContentRegistry
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()
    private let fileManager = FileManager.default

    init(registry: AppleTVContentRegistry = .shared) {
        self.registry = registry
    }

    func syncAll(trigger: RemoteContentSyncTrigger) async -> RemoteContentSyncReport {
        let startedAt = Date()
        var synced: [String] = []
        var failed: [String] = []

        do {
            let rootCatalog = try await registry.loadCatalog()

            if let policy = rootCatalog.remoteContentSync, policy.enabled == false {
                return RemoteContentSyncReport(startedAt: startedAt, finishedAt: Date(), syncedCatalogs: [], failedCatalogs: [])
            }

            if let tadabbur = rootCatalog.quran?.tadabbur, tadabbur.remoteLoad, tadabbur.offlineCache {
                let ok = await syncCatalog(relativeCatalogPath: tadabbur.catalogPath)
                ok ? synced.append(tadabbur.catalogPath) : failed.append(tadabbur.catalogPath)
            }

            if let screensaver = rootCatalog.screensaver,
               screensaver.isActive,
               screensaver.remoteLoad != false,
               screensaver.offlineCache != false,
               let catalogPath = screensaver.catalogPath {
                let ok = await syncCatalog(relativeCatalogPath: catalogPath)
                ok ? synced.append(catalogPath) : failed.append(catalogPath)
            }

            for module in rootCatalog.modules where module.remoteLoad && module.offlineCache {
                let ok = await syncCatalog(relativeCatalogPath: module.catalogPath)
                ok ? synced.append(module.catalogPath) : failed.append(module.catalogPath)
            }
        } catch {
            failed.append("apple-tv/catalog.json")
        }

        return RemoteContentSyncReport(
            startedAt: startedAt,
            finishedAt: Date(),
            syncedCatalogs: synced,
            failedCatalogs: failed
        )
    }

    func syncCatalog(relativeCatalogPath: String) async -> Bool {
        do {
            let catalogURL = registry.url(forRelativePath: relativeCatalogPath)
            let catalog: RemoteAreaCatalog = try await fetchJSON(catalogURL)

            guard catalog.remoteLoad, catalog.offlineCache else {
                return true
            }

            let catalogDirectory = (relativeCatalogPath as NSString).deletingLastPathComponent
            let stagingDirectory = try cacheRoot()
                .appendingPathComponent("staging", isDirectory: true)
                .appendingPathComponent(catalogDirectory, isDirectory: true)
            let activeDirectory = try cacheRoot()
                .appendingPathComponent("active", isDirectory: true)
                .appendingPathComponent(catalogDirectory, isDirectory: true)

            try prepareEmptyDirectory(stagingDirectory)

            try encoder.encode(catalog).write(
                to: stagingDirectory.appendingPathComponent("catalog.json"),
                options: .atomic
            )

            if let indexPath = catalog.entriesIndexPath {
                let indexRelativePath = join(catalogDirectory, indexPath)
                let indexURL = registry.url(forRelativePath: indexRelativePath)
                let indexData = try await fetchData(indexURL)
                try indexData.write(to: stagingDirectory.appendingPathComponent(indexPath), options: .atomic)
            }

            for entryPath in catalog.entriesPaths {
                let entryRelativePath = join(catalogDirectory, entryPath)
                let entryURL = registry.url(forRelativePath: entryRelativePath)
                let entryData = try await fetchData(entryURL)
                let localURL = stagingDirectory.appendingPathComponent(entryPath)
                try fileManager.createDirectory(at: localURL.deletingLastPathComponent(), withIntermediateDirectories: true)
                try entryData.write(to: localURL, options: .atomic)
            }

            try validate(catalog: catalog, directory: stagingDirectory)
            try activate(stagingDirectory: stagingDirectory, activeDirectory: activeDirectory)
            return true
        } catch {
            return false
        }
    }

    func cachedFileURL(relativeCatalogPath: String, filePath: String) throws -> URL {
        let catalogDirectory = (relativeCatalogPath as NSString).deletingLastPathComponent
        return try cacheRoot()
            .appendingPathComponent("active", isDirectory: true)
            .appendingPathComponent(catalogDirectory, isDirectory: true)
            .appendingPathComponent(filePath)
    }

    private func fetchJSON<T: Decodable>(_ url: URL) async throws -> T {
        let data = try await fetchData(url)
        return try decoder.decode(T.self, from: data)
    }

    private func fetchData(_ url: URL) async throws -> Data {
        var request = URLRequest(url: url)
        request.cachePolicy = .reloadRevalidatingCacheData
        request.timeoutInterval = 25

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse,
              (200...299).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
        return data
    }

    private func validate(catalog: RemoteAreaCatalog, directory: URL) throws {
        guard !catalog.schemaVersion.isEmpty else { throw URLError(.cannotParseResponse) }
        guard !catalog.contentType.isEmpty else { throw URLError(.cannotParseResponse) }

        if let indexPath = catalog.entriesIndexPath {
            let indexURL = directory.appendingPathComponent(indexPath)
            guard fileManager.fileExists(atPath: indexURL.path) else {
                throw URLError(.fileDoesNotExist)
            }
        }

        for entryPath in catalog.entriesPaths {
            let entryURL = directory.appendingPathComponent(entryPath)
            guard fileManager.fileExists(atPath: entryURL.path) else {
                throw URLError(.fileDoesNotExist)
            }
        }
    }

    private func activate(stagingDirectory: URL, activeDirectory: URL) throws {
        let parent = activeDirectory.deletingLastPathComponent()
        try fileManager.createDirectory(at: parent, withIntermediateDirectories: true)

        let backup = activeDirectory.deletingLastPathComponent()
            .appendingPathComponent(activeDirectory.lastPathComponent + ".previous", isDirectory: true)

        if fileManager.fileExists(atPath: backup.path) {
            try fileManager.removeItem(at: backup)
        }

        if fileManager.fileExists(atPath: activeDirectory.path) {
            try fileManager.moveItem(at: activeDirectory, to: backup)
        }

        do {
            try fileManager.moveItem(at: stagingDirectory, to: activeDirectory)
        } catch {
            if fileManager.fileExists(atPath: backup.path), !fileManager.fileExists(atPath: activeDirectory.path) {
                try? fileManager.moveItem(at: backup, to: activeDirectory)
            }
            throw error
        }
    }

    private func prepareEmptyDirectory(_ directory: URL) throws {
        if fileManager.fileExists(atPath: directory.path) {
            try fileManager.removeItem(at: directory)
        }
        try fileManager.createDirectory(at: directory, withIntermediateDirectories: true)
    }

    private func cacheRoot() throws -> URL {
        let root = fileManager.urls(for: .cachesDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("DarAlTawhidRemoteContent", isDirectory: true)
        try fileManager.createDirectory(at: root, withIntermediateDirectories: true)
        return root
    }

    private func join(_ base: String, _ child: String) -> String {
        guard !base.isEmpty else { return child }
        return base + "/" + child
    }
}
