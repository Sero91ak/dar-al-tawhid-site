import AppIntents
import ActivityKit
import Foundation

struct DarWidgetColorIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "Erscheinungsbild"
    static var description = IntentDescription("Wählt das Erscheinungsbild des Widgets.")

    @Parameter(title: "Darstellung", default: .automatisch)
    var look: DarWidgetLook
}

struct DarPrayerLiveAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        let prayerName: String
        let city: String
        let targetDate: Date
    }
}
