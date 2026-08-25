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
        // Widget extension is not embedded in the TestFlight app; skip timeline reloads.
    }

    static func setPendingDestination(_ dest: DarDeepLink.Destination) {
        defaults.set(dest.rawValue, forKey: DarWidgetKeys.pendingDestination)
    }

    static func consumePendingDestination() -> DarDeepLink.Destination? {
        guard let raw = defaults.string(forKey: DarWidgetKeys.pendingDestination) else { return nil }
        defaults.removeObject(forKey: DarWidgetKeys.pendingDestination)
        return DarDeepLink.Destination(rawValue: raw)
    }
}
