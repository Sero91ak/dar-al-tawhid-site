import Foundation

struct ScreensaverRotationConfig: Codable {
    let schemaVersion: String
    let mode: String
    let persistProgress: Bool
    let storage: String
    let cyclePolicy: CyclePolicy
    let futureModuleMixing: FutureModuleMixing

    struct CyclePolicy: Codable {
        let showEveryItemBeforeRepeat: Bool
        let shuffleEachCycle: Bool
        let crossCycleCooldownCount: Int
        let preventImmediateRepeat: Bool
        let newItemsPolicy: String
        let removedItemsPolicy: String
    }

    struct FutureModuleMixing: Codable {
        let enabled: Bool
        let strategy: String
        let weights: [String: Int]
    }
}

struct ScreensaverRotationState: Codable {
    var cycleNumber: Int
    var remainingQueue: [String]
    var shownIDs: [String]
    var recentCooldownIDs: [String]
    var catalogFingerprint: String
}

actor ScreensaverRotationService {
    static let shared = ScreensaverRotationService()

    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()
    private var memoryConfig: ScreensaverRotationConfig?
    private var memoryConfigLoadedAt: Date?

    /// tvOS garantiert keinen dauerhaften Dateispeicher (Application Support/Caches
    /// können gelöscht werden). UserDefaults bleibt über Neustarts erhalten.
    private static let stateDefaultsKey = "dar.appleTV.screensaver.rotationState.v2"
    private static let configRefreshInterval: TimeInterval = 6 * 60 * 60

    static let builtInConfig = ScreensaverRotationConfig(
        schemaVersion: "builtin",
        mode: "shuffleBag",
        persistProgress: true,
        storage: "userDefaults",
        cyclePolicy: .init(
            showEveryItemBeforeRepeat: true,
            shuffleEachCycle: true,
            crossCycleCooldownCount: 20,
            preventImmediateRepeat: true,
            newItemsPolicy: "appendToRemainingAndReshuffle",
            removedItemsPolicy: "dropFromState"
        ),
        futureModuleMixing: .init(enabled: false, strategy: "weighted", weights: ["hadith": 1])
    )

    /// Liefert die nächste Content-ID für den Bildschirmschoner.
    /// Wirft nie wegen Netz oder Speicher: Konfiguration fällt auf Cache bzw.
    /// eingebaute Regel zurück, der Fortschritt wird in UserDefaults gehalten.
    func nextID(availableIDs: [String], catalogFingerprint: String) async throws -> String? {
        let config = await currentConfig()
        let available = Array(Set(availableIDs)).sorted()
        guard !available.isEmpty else { return nil }

        var state = loadState() ?? ScreensaverRotationState(
            cycleNumber: 0,
            remainingQueue: [],
            shownIDs: [],
            recentCooldownIDs: [],
            catalogFingerprint: catalogFingerprint
        )

        reconcile(
            state: &state,
            availableIDs: available,
            catalogFingerprint: catalogFingerprint,
            config: config
        )

        if state.remainingQueue.isEmpty {
            if state.shownIDs.isEmpty {
                state.cycleNumber = max(state.cycleNumber, 1)
                state.remainingQueue = config.cyclePolicy.shuffleEachCycle
                    ? available.shuffled()
                    : available
            } else {
                startNextCycle(state: &state, availableIDs: available, config: config)
            }
        }

        guard !state.remainingQueue.isEmpty else { return nil }

        if config.cyclePolicy.preventImmediateRepeat,
           let last = state.shownIDs.last ?? state.recentCooldownIDs.last,
           state.remainingQueue.first == last,
           state.remainingQueue.count > 1,
           let swapIndex = state.remainingQueue.dropFirst().firstIndex(where: { $0 != last }) {
            state.remainingQueue.swapAt(0, swapIndex)
        }

        let next = state.remainingQueue.removeFirst()
        state.shownIDs.append(next)

        let cooldownCount = max(0, config.cyclePolicy.crossCycleCooldownCount)
        if cooldownCount > 0 {
            state.recentCooldownIDs = Array(state.shownIDs.suffix(cooldownCount))
        } else {
            state.recentCooldownIDs = []
        }

        saveState(state)
        return next
    }

    /// Optional für Diagnose/UI: aktueller persistierter Rotationsstand.
    func currentState() -> ScreensaverRotationState? {
        loadState()
    }

    /// Nur für bewusste Tests/Debugging verwenden, nicht beim normalen App-Start.
    func resetProgress() throws {
        UserDefaults.standard.removeObject(forKey: Self.stateDefaultsKey)
        for url in [try? stateURL(), try? legacyStateURL()].compactMap({ $0 }) {
            if FileManager.default.fileExists(atPath: url.path) {
                try FileManager.default.removeItem(at: url)
            }
        }
    }

    private func currentConfig() async -> ScreensaverRotationConfig {
        if let memoryConfig,
           let loadedAt = memoryConfigLoadedAt,
           Date().timeIntervalSince(loadedAt) < Self.configRefreshInterval {
            return memoryConfig
        }
        if let loaded = try? await loadConfig() {
            memoryConfig = loaded
            memoryConfigLoadedAt = Date()
            return loaded
        }
        let fallback = memoryConfig ?? (try? loadConfigCache()) ?? Self.builtInConfig
        memoryConfig = fallback
        // Offline nicht bei jeder Karte erneut auf das Netz warten: in 10 Minuten wieder versuchen.
        memoryConfigLoadedAt = Date().addingTimeInterval(-(Self.configRefreshInterval - 10 * 60))
        return fallback
    }

    private func reconcile(
        state: inout ScreensaverRotationState,
        availableIDs: [String],
        catalogFingerprint: String,
        config: ScreensaverRotationConfig
    ) {
        let availableSet = Set(availableIDs)

        // Entfernte Inhalte vollständig aus dem Zustand entfernen.
        state.remainingQueue.removeAll { !availableSet.contains($0) }
        state.shownIDs.removeAll { !availableSet.contains($0) }
        state.recentCooldownIDs.removeAll { !availableSet.contains($0) }

        // Doppelte IDs im Zustand verhindern, Reihenfolge dabei bewahren.
        state.remainingQueue = deduplicated(state.remainingQueue)
        state.shownIDs = deduplicated(state.shownIDs)

        let known = Set(state.remainingQueue).union(state.shownIDs)
        let newIDs = availableIDs.filter { !known.contains($0) }

        // Neue Inhalte werden in die noch offene Queue aufgenommen.
        // Bereits gezeigte Inhalte bleiben bis zum Zyklusende gesperrt.
        if !newIDs.isEmpty {
            state.remainingQueue.append(contentsOf: newIDs)
            if config.cyclePolicy.newItemsPolicy == "appendToRemainingAndReshuffle" {
                state.remainingQueue.shuffle()
            }
        }

        state.catalogFingerprint = catalogFingerprint
    }

    private func startNextCycle(
        state: inout ScreensaverRotationState,
        availableIDs: [String],
        config: ScreensaverRotationConfig
    ) {
        let cooldownCount = min(
            max(0, config.cyclePolicy.crossCycleCooldownCount),
            max(0, availableIDs.count - 1)
        )

        let recent = Array(state.shownIDs.suffix(cooldownCount))
        let recentSet = Set(recent)

        var preferred = availableIDs.filter { !recentSet.contains($0) }
        var cooled = availableIDs.filter { recentSet.contains($0) }

        if config.cyclePolicy.shuffleEachCycle {
            preferred.shuffle()
            cooled.shuffle()
        }

        // Die letzten N Inhalte des vorherigen Zyklus dürfen nach Möglichkeit
        // nicht in den ersten N Positionen des neuen Zyklus erscheinen.
        let protectedPrefixCount = min(cooldownCount, preferred.count)
        let protectedPrefix = Array(preferred.prefix(protectedPrefixCount))
        var rest = Array(preferred.dropFirst(protectedPrefixCount)) + cooled

        if config.cyclePolicy.shuffleEachCycle {
            rest.shuffle()
        }

        state.cycleNumber += 1
        state.remainingQueue = protectedPrefix + rest
        state.shownIDs = []
        state.recentCooldownIDs = recent

        // Zusätzliche Schutzschicht gegen unmittelbare Wiederholung bei kleinen Datenmengen.
        if config.cyclePolicy.preventImmediateRepeat,
           let lastPrevious = recent.last,
           state.remainingQueue.first == lastPrevious,
           state.remainingQueue.count > 1,
           let swapIndex = state.remainingQueue.dropFirst().firstIndex(where: { $0 != lastPrevious }) {
            state.remainingQueue.swapAt(0, swapIndex)
        }
    }

    private func deduplicated(_ values: [String]) -> [String] {
        var seen = Set<String>()
        return values.filter { seen.insert($0).inserted }
    }

    private func loadConfig() async throws -> ScreensaverRotationConfig {
        do {
            let catalog = try await AppleTVContentRegistry.shared.loadCatalog()
            let path = catalog.screensaver?.rotationConfigPath ?? "screensaver/rotation.json"
            if let cachedURL = try? await RemoteContentSyncService.shared.cachedFileURL(
                relativeCatalogPath: catalog.screensaver?.catalogPath ?? "screensaver/catalog.json",
                filePath: (path as NSString).lastPathComponent
            ), FileManager.default.fileExists(atPath: cachedURL.path) {
                let data = try Data(contentsOf: cachedURL)
                let config = try decoder.decode(ScreensaverRotationConfig.self, from: data)
                try saveConfigCache(config)
                return config
            }

            let url = AppleTVContentEnvironment.rootURL.appendingPathComponent(path)
            let config: ScreensaverRotationConfig = try await fetchJSON(url)
            try saveConfigCache(config)
            return config
        } catch {
            if let cached = try? loadConfigCache() {
                return cached
            }
            throw error
        }
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

    private func stateURL() throws -> URL {
        let root = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("DarAlTawhidAppleTV", isDirectory: true)
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        return root.appendingPathComponent("screensaver-rotation-state.json")
    }

    private func legacyStateURL() throws -> URL {
        FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("DarAlTawhidAppleTV", isDirectory: true)
            .appendingPathComponent("screensaver-rotation-state.json")
    }

    private func saveState(_ state: ScreensaverRotationState) {
        guard let data = try? encoder.encode(state) else { return }
        UserDefaults.standard.set(data, forKey: Self.stateDefaultsKey)
        if let url = try? stateURL() {
            try? data.write(to: url, options: .atomic)
        }
    }

    private func loadState() -> ScreensaverRotationState? {
        if let data = UserDefaults.standard.data(forKey: Self.stateDefaultsKey),
           let state = try? decoder.decode(ScreensaverRotationState.self, from: data) {
            return state
        }
        for url in [try? stateURL(), try? legacyStateURL()].compactMap({ $0 }) {
            if let data = try? Data(contentsOf: url),
               let state = try? decoder.decode(ScreensaverRotationState.self, from: data) {
                UserDefaults.standard.set(data, forKey: Self.stateDefaultsKey)
                return state
            }
        }
        return nil
    }

    private func configCacheURL() throws -> URL {
        let root = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("DarAlTawhidAppleTV", isDirectory: true)
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        return root.appendingPathComponent("screensaver-rotation-config.json")
    }

    private func saveConfigCache(_ config: ScreensaverRotationConfig) throws {
        let data = try encoder.encode(config)
        try data.write(to: configCacheURL(), options: .atomic)
    }

    private func loadConfigCache() throws -> ScreensaverRotationConfig {
        let data = try Data(contentsOf: configCacheURL())
        return try decoder.decode(ScreensaverRotationConfig.self, from: data)
    }
}
