import Foundation

enum DarWidgetStore {
    static var defaults: UserDefaults {
        UserDefaults(suiteName: DarWidgetKeys.appGroup) ?? .standard
    }

    static func load() -> DarWidgetSnapshot {
        guard let data = defaults.data(forKey: DarWidgetKeys.snapshot),
              let snap = try? JSONDecoder().decode(DarWidgetSnapshot.self, from: data) else {
            return DarDailyContent.refresh(DarWidgetSnapshot.empty)
        }
        return snap
    }

    static func save(_ snapshot: DarWidgetSnapshot) {
        if let data = try? JSONEncoder().encode(snapshot) {
            defaults.set(data, forKey: DarWidgetKeys.snapshot)
        }
    }

    static func setPendingDestination(_ dest: DarDeepLink.Destination) {
        defaults.set(dest.webHash, forKey: DarWidgetKeys.pendingDestination)
    }

    static func peekPendingDestination() -> DarDeepLink.Destination? {
        guard let raw = defaults.string(forKey: DarWidgetKeys.pendingDestination), !raw.isEmpty else { return nil }
        return .hash(raw)
    }

    static func consumePendingDestination() -> DarDeepLink.Destination? {
        let dest = peekPendingDestination()
        defaults.removeObject(forKey: DarWidgetKeys.pendingDestination)
        return dest
    }
}
