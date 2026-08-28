import AppIntents
import WidgetKit

struct DarWidgetColorIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "DAR AL TAWḤĪD"
    static var description = IntentDescription("Farbe für das Home-Screen-Widget.")

    @Parameter(title: "Farbe", default: .eisgold)
    var look: DarWidgetLook

    func perform() async throws -> some IntentResult {
        .result()
    }
}
