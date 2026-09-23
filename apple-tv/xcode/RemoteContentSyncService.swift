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

    struct Series: Codable {
        let id: String?
        let status: String?
        let count: Int?
        let firstId: String?
        let lastId: String?
        let plannedLastId: String?
        let indexPath: String?
        let screensaverIncluded: Bool?
        let readyThrough: String?
    }

    let project: String?
    let schemaVersion: String
    let language: String?
    let contentType: String?
    let status: String?
    let target: String?
    let remoteLoad: Bool?
    let offlineCache: Bool?
    let contentVersion: Int?
    let entriesCount: Int?
    let totalCount: Int?
    let latestId: String?
    let nextId: String?
    let currentSeries: String?
    let lastUpdated: String?
    let entriesIndexPath: String?
    let entriesPaths: [String]?
    let series: [Series]?
    let fallback: Fallback?
    let syncPolicy: SyncPolicy?

    var shouldRemoteLoad: Bool { remoteLoad ?? true }
    var shouldOfflineCache: Bool { offlineCache ?? true }

    var effectiveContentType: String {
        if let contentType { return contentType }
        if totalCount != nil || series != nil { return "hadith" }
        return "generic"
    }

    var effectiveEntriesCount: Int {
        if let entriesCount { return entriesCount }
        if let totalCount { return totalCount }
        if let series { return series.compactMap(\.count).reduce(0, +) }
        return entriesPaths?.count ?? 0
    }

    var indexPaths: [String] {
        var paths: [String] = []
        if let entriesIndexPath { paths.append(entriesIndexPath) }
        if let series {
            paths.append(contentsOf: series.compactMap(\.indexPath))
        }
        return orderedUnique(paths)
    }

    var contentPaths: [String] {
        var paths = entriesPaths ?? []
        paths.append(contentsOf: indexPaths)
        return orderedUnique(paths)
    }

    private func orderedUnique(_ values: [String]) -> [String] {
        var seen = Set<String>()
        var output: [String] = []
        for value in values where seen.insert(value).inserted {
            output.append(value)
        }
        return output
    }
}

struct RemoteEntriesIndex: Codable {
    let schemaVersion: String?
    let totalVerifiedEntries: Int?
    let totalEntries: Int?
    let entriesCount: Int?
    let files: [RemoteIndexedFile]?
}

struct RemoteIndexedFile: Codable {
    let path: String
    let count: Int?
}

struct RemoteSeriesIndex: Codable {
    let series: String?
    let count: Int?
    let firstId: String?
    let lastId: String?
    let plannedLastId: String?
    let files: [String]?
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

            if let audio = rootCatalog.quran?.audio, audio.remoteLoad, audio.offlineCache {
                let path = audio.catalogPath
                if await syncCatalog(relativeCatalogPath: path) { synced.append(path) } else { failed.append(path) }
            }

            if let tadabbur = rootCatalog.quran?.tadabbur, tadabbur.remoteLoad, tadabbur.offlineCache {
                let path = tadabbur.catalogPath
                if await syncCatalog(relativeCatalogPath: path) { synced.append(path) } else { failed.append(path) }
            }

            if let screensaver = rootCatalog.screensaver,
               screensaver.isActive,
               screensaver.remoteLoad != false,
               screensaver.offlineCache != false,
               let path = screensaver.catalogPath {
                if await syncCatalog(relativeCatalogPath: path) { synced.append(path) } else { failed.append(path) }
            }

            for module in rootCatalog.modules where module.remoteLoad && module.offlineCache {
                let path = module.catalogPath
                if await syncCatalog(relativeCatalogPath: path) { synced.append(path) } else { failed.append(path) }
            }

            if let backgrounds = rootCatalog.backgrounds, backgrounds.isActive {
                let path = backgrounds.catalogPath
                if await syncCatalog(relativeCatalogPath: path) { synced.append(path) } else { failed.append(path) }
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

            guard catalog.shouldRemoteLoad, catalog.shouldOfflineCache else {
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

            var downloaded = Set<String>()
            var queue = catalog.contentPaths

            while let relativeFilePath = queue.first {
                queue.removeFirst()
                guard downloaded.insert(relativeFilePath).inserted else { continue }

                let data = try await downloadFile(
                    relativeFilePath: relativeFilePath,
                    catalogDirectory: catalogDirectory,
                    stagingDirectory: stagingDirectory
                )

                for nestedPath in nestedContentPaths(from: data, indexPath: relativeFilePath) where !downloaded.contains(nestedPath) {
                    queue.append(nestedPath)
                }
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

    private func downloadFile(relativeFilePath: String, catalogDirectory: String, stagingDirectory: URL) async throws -> Data {
        let remoteRelativePath = join(catalogDirectory, relativeFilePath)
        let remoteURL = registry.url(forRelativePath: remoteRelativePath)
        let data = try await fetchData(remoteURL)
        let localURL = stagingDirectory.appendingPathComponent(relativeFilePath)
        try fileManager.createDirectory(at: localURL.deletingLastPathComponent(), withIntermediateDirectories: true)
        try data.write(to: localURL, options: .atomic)
        return data
    }

    private func nestedContentPaths(from data: Data, indexPath: String) -> [String] {
        var nested: [String] = []
        let indexDirectory = (indexPath as NSString).deletingLastPathComponent

        if let seriesIndex = try? decoder.decode(RemoteSeriesIndex.self, from: data), let files = seriesIndex.files {
            nested.append(contentsOf: files.map { join(indexDirectory, $0) })
        }

        if let entriesIndex = try? decoder.decode(RemoteEntriesIndex.self, from: data), let files = entriesIndex.files {
            nested.append(contentsOf: files.map(\.path))
        }

        return orderedUnique(nested)
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
        guard !catalog.effectiveContentType.isEmpty else { throw URLError(.cannotParseResponse) }
        guard catalog.effectiveEntriesCount >= 0 else { throw URLError(.cannotParseResponse) }

        for filePath in catalog.contentPaths {
            let fileURL = directory.appendingPathComponent(filePath)
            guard fileManager.fileExists(atPath: fileURL.path) else {
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
        guard !child.isEmpty else { return base }
        return base + "/" + child
    }

    private func orderedUnique(_ values: [String]) -> [String] {
        var seen = Set<String>()
        var output: [String] = []
        for value in values where seen.insert(value).inserted {
            output.append(value)
        }
        return output
    }
}
