import SwiftUI
import WidgetKit
import AppIntents

@available(iOSApplicationExtension 18.0, *)
struct DarPrayerControlWidget: ControlWidget {
    var body: some ControlWidgetConfiguration {
        StaticControlConfiguration(kind: "de.daraltawhid.control.prayer") {
            ControlWidgetButton(action: OpenPrayerIntent()) {
                Label("Gebet", systemImage: "moon.stars.fill")
            }
        }
        .displayName("Nächstes Gebet")
        .description("Öffnet die Gebetszeiten.")
    }
}

@available(iOSApplicationExtension 18.0, *)
struct DarQiblaControlWidget: ControlWidget {
    var body: some ControlWidgetConfiguration {
        StaticControlConfiguration(kind: "de.daraltawhid.control.qibla") {
            ControlWidgetButton(action: OpenQiblaIntent()) {
                Label("Qibla", systemImage: "location.north.line.fill")
            }
        }
        .displayName("Qibla")
        .description("Öffnet den Kompass nach Mekka.")
    }
}
