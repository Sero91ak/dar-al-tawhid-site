import Foundation
import ActivityKit

struct DarPrayerAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        var prayerName: String
        var prayerTime: String
        var remaining: String
        var city: String
        var themeId: String
        var endsAt: Date
    }

    var city: String
}
