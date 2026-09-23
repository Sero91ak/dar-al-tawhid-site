import Foundation

/// Zentrale Brücke zwischen App-Lifecycle und RemoteContentSyncService.
/// Diese Datei soll in App-Start, ScenePhase/Foreground, Apple-TV-Wake und Debug/Admin-Refresh eingebunden werden.
/// Ziel: Nutzer erhalten neue Inhalte und Korrekturen automatisch, ohne App-Update.
actor RemoteContentSyncCoordinator {
    static let shared = RemoteContentSyncCoordinator()

    private var lastSyncByTrigger: [RemoteContentSyncTrigger: Date] = [:]
    private var lastGlobalSync: Date?
    private var minimumRefreshInterval: TimeInterval = 6 * 60 * 60

    /// Beim App-Start aufrufen.
    func appDidStart() async -> RemoteContentSyncReport {
        await syncIfAllowed(trigger: .appStart, force: true)
    }

    /// Beim Zurückkehren aus dem Hintergrund aufrufen.
    func appDidEnterForeground() async -> RemoteContentSyncReport? {
        await syncIfPolicyAllows(trigger: .foreground)
    }

    /// Bei Apple-TV-Wake/Standby-Rückkehr aufrufen.
    func appleTVDidWake() async -> RemoteContentSyncReport? {
        await syncIfPolicyAllows(trigger: .appleTVWake)
    }

    /// Beim Öffnen von Qurʾān, Ḥadīṯ, Šarḥ, Screensaver, Duʿāʾ oder Serien aufrufen.
    func contentAreaDidOpen() async -> RemoteContentSyncReport? {
        await syncIfPolicyAllows(trigger: .contentOpen)
    }

    /// Beim Öffnen eines Ḥadīṯes aufrufen, damit Šarḥ-Katalog und HAD-Korrekturen aktuell sind.
    func hadithDidOpen() async -> RemoteContentSyncReport? {
        await syncIfPolicyAllows(trigger: .hadithOpen)
    }

    /// Nur Debug/Admin/Refresh-Button.
    func manualRefresh() async -> RemoteContentSyncReport {
        await syncIfAllowed(trigger: .manual, force: true)
    }

    private func syncIfPolicyAllows(trigger: RemoteContentSyncTrigger) async -> RemoteContentSyncReport? {
        do {
            let policy = try await AppleTVContentRegistry.shared.remoteContentSyncPolicy()
            guard policy?.enabled ?? true else { return nil }

            if let hours = policy?.minimumRefreshIntervalHours, hours > 0 {
                minimumRefreshInterval = TimeInterval(hours * 60 * 60)
            }

            switch trigger {
            case .foreground:
                guard policy?.checkOnForeground ?? true else { return nil }
            case .appleTVWake:
                guard policy?.checkOnAppleTVWake ?? true else { return nil }
            case .appStart:
                guard policy?.checkOnAppStart ?? true else { return nil }
            default:
                break
            }

            return await syncIfAllowed(trigger: trigger, force: false)
        } catch {
            return await syncIfAllowed(trigger: trigger, force: false)
        }
    }

    private func syncIfAllowed(trigger: RemoteContentSyncTrigger, force: Bool) async -> RemoteContentSyncReport {
        if !force, !shouldSyncNow(trigger: trigger) {
            let now = Date()
            return RemoteContentSyncReport(
                startedAt: now,
                finishedAt: now,
                syncedCatalogs: [],
                failedCatalogs: []
            )
        }

        let report = await RemoteContentSyncService.shared.syncAll(trigger: trigger)
        let finished = report.finishedAt
        lastSyncByTrigger[trigger] = finished
        lastGlobalSync = finished
        return report
    }

    private func shouldSyncNow(trigger: RemoteContentSyncTrigger) -> Bool {
        let now = Date()
        let interval = max(60, minimumRefreshInterval)

        if let lastForTrigger = lastSyncByTrigger[trigger], now.timeIntervalSince(lastForTrigger) < interval {
            return false
        }

        if let lastGlobalSync, now.timeIntervalSince(lastGlobalSync) < interval / 2 {
            return false
        }

        return true
    }
}
