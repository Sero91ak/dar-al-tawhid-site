import SwiftUI
import WidgetKit

@available(iOSApplicationExtension 18.0, *)
struct DarPrayerControlWidget: ControlWidget {
    var body: some ControlWidgetConfiguration {
        StaticControlConfiguration(kind: "de.daraltawhid.control.prayer") {
            ControlWidgetButton(action: OpenPrayerIntent()) {
                Label("Gebetszeiten", systemImage: "clock")
            }
        }
        .displayName("Gebetszeiten")
        .description("Öffnet die Gebetszeiten in DĀR AL TAWḤĪD.")
    }
}

@available(iOSApplicationExtension 18.0, *)
struct DarQiblaControlWidget: ControlWidget {
    var body: some ControlWidgetConfiguration {
        StaticControlConfiguration(kind: "de.daraltawhid.control.qibla") {
            ControlWidgetButton(action: OpenQiblaIntent()) {
                Label("Qibla", systemImage: "location.north.circle")
            }
        }
        .displayName("Qibla")
        .description("Öffnet den Qibla-Kompass in DĀR AL TAWḤĪD.")
    }
}
