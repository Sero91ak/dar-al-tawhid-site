import Foundation
import ActivityKit

struct DarPrayerAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        var prayerName: String
        var prayerTime: String
        var remaining: String
        var city: String
        var endsAt: Date
    }

    var city: String
}

enum DarPrayerLive {
    static func sync(from snap: DarWidgetSnapshot) {
        #if !WIDGET_EXTENSION
        if #available(iOS 16.2, *) {
            Task { await update(snap: snap) }
        }
        #endif
    }

    #if !WIDGET_EXTENSION
    @available(iOS 16.2, *)
    private static func update(snap: DarWidgetSnapshot) async {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }
        let city = snap.cityLabel
        var ends = Date().addingTimeInterval(45 * 60)
        if let slot = snap.prayers.first(where: { $0.name == snap.nextPrayerName }),
           let fire = DarPrayerEngine.date(for: slot, on: Date()) {
            ends = fire > Date() ? fire : fire.addingTimeInterval(24 * 3600)
        }
        let state = DarPrayerAttributes.ContentState(
            prayerName: snap.nextPrayerName,
            prayerTime: snap.nextPrayerTime,
            remaining: snap.nextPrayerRemaining,
            city: city,
            endsAt: ends
        )
        if let current = Activity<DarPrayerAttributes>.activities.first {
            await current.update(ActivityContent(state: state, staleDate: ends.addingTimeInterval(120)))
            return
        }
        _ = try? Activity.request(
            attributes: DarPrayerAttributes(city: city),
            content: ActivityContent(state: state, staleDate: ends.addingTimeInterval(120)),
            pushType: nil
        )
    }
    #endif
}
