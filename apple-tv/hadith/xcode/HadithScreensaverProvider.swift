import Foundation

actor HadithScreensaverProvider {
    static let shared = HadithScreensaverProvider()

    private var records: [HadithRecord] = []
    private var loadedAt: Date?
    private var refreshTask: Task<Void, Never>?

    /// Katalog wird höchstens alle 6 Stunden im Hintergrund erneuert.
    /// Der Kartenwechsel wartet nie auf GitHub.
    private static let refreshInterval: TimeInterval = 6 * 60 * 60

    /// Liefert den nächsten Apple-TV-Bildschirmschoner-Beitrag:
    /// Ḥadīṯ, Āṯar oder Salaf-Aussage aus dem registrierten Ḥadīṯ-/Āṯār-Katalog.
    /// Keine Wiederholung, bevor alle aktuell verfügbaren IDs einmal gezeigt wurden.
    func nextHadith() async throws -> HadithRecord? {
        try await nextContent()
    }

    /// Neutrale Bezeichnung für neue Screensaver-Views.
    /// Bezieht ausdrücklich auch Āṯār und Salaf-Aussagen ein.
    func nextContent() async throws -> HadithRecord? {
        if records.isEmpty {
            await reload()
        } else if isStale {
            scheduleBackgroundRefresh()
        }
        guard !records.isEmpty else { return nil }

        var byID: [String: HadithRecord] = [:]
        for record in records where byID[record.id] == nil {
            byID[record.id] = record
        }
        let ids = byID.keys.sorted()
        let fingerprint = ids.joined(separator: "|")

        guard let nextID = try await ScreensaverRotationService.shared.nextID(
            availableIDs: ids,
            catalogFingerprint: fingerprint
        ) else {
            return nil
        }

        return byID[nextID]
    }

    private var isStale: Bool {
        guard let loadedAt else { return true }
        return Date().timeIntervalSince(loadedAt) > Self.refreshInterval
    }

    private func reload() async {
        if let loaded = try? await HadithRemoteService.shared.loadAllHadith(), !loaded.isEmpty {
            records = loaded
            loadedAt = Date()
        }
    }

    private func scheduleBackgroundRefresh() {
        guard refreshTask == nil else { return }
        refreshTask = Task { [weak self] in
            await self?.reload()
            await self?.finishRefresh()
        }
    }

    private func finishRefresh() {
        refreshTask = nil
        if loadedAt == nil || isStale {
            loadedAt = Date()
        }
    }
}
