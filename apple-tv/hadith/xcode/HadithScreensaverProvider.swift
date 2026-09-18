import Foundation

actor HadithScreensaverProvider {
    static let shared = HadithScreensaverProvider()

    /// Liefert den nächsten Apple-TV-Bildschirmschoner-Beitrag:
    /// Ḥadīṯ, Āṯar oder Salaf-Aussage aus dem registrierten Ḥadīṯ-/Āṯār-Katalog.
    /// Keine Wiederholung, bevor alle aktuell verfügbaren IDs einmal gezeigt wurden.
    func nextHadith() async throws -> HadithRecord? {
        try await nextContent()
    }

    /// Neutrale Bezeichnung für neue Screensaver-Views.
    /// Bezieht ausdrücklich auch Āṯār und Salaf-Aussagen ein.
    func nextContent() async throws -> HadithRecord? {
        let records = try await HadithRemoteService.shared.loadAllHadith()
        guard !records.isEmpty else { return nil }

        let byID = Dictionary(uniqueKeysWithValues: records.map { ($0.id, $0) })
        let ids = records.map(\.id).sorted()
        let fingerprint = ids.joined(separator: "|")

        guard let nextID = try await ScreensaverRotationService.shared.nextID(
            availableIDs: ids,
            catalogFingerprint: fingerprint
        ) else {
            return nil
        }

        return byID[nextID]
    }
}
