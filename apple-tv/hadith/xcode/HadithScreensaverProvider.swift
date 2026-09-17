import Foundation

actor HadithScreensaverProvider {
    static let shared = HadithScreensaverProvider()

    /// Liefert den nächsten Ḥadīṯ gemäß der zentralen GitHub-Rotationsregel.
    /// Keine Wiederholung, bevor alle aktuell verfügbaren IDs einmal gezeigt wurden.
    func nextHadith() async throws -> HadithRecord? {
        let hadiths = try await HadithRemoteService.shared.loadAllHadith()
        guard !hadiths.isEmpty else { return nil }

        let byID = Dictionary(uniqueKeysWithValues: hadiths.map { ($0.id, $0) })
        let ids = hadiths.map(\.id).sorted()
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
