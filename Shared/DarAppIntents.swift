import AppIntents
import Foundation

struct OpenPrayerIntent: AppIntent {
    static var title: LocalizedStringResource = "Gebetszeiten öffnen"
    static var description = IntentDescription("Öffnet die Gebetszeiten in DAR AL TAWḤID.")
    static var openAppWhenRun = true

    func perform() async throws -> some IntentResult {
        DarWidgetStore.setPendingDestination(.prayer)
        return .result()
    }
}

struct OpenQiblaIntent: AppIntent {
    static var title: LocalizedStringResource = "Qibla öffnen"
    static var description = IntentDescription("Öffnet den Qibla-Kompass.")
    static var openAppWhenRun = true

    func perform() async throws -> some IntentResult {
        DarWidgetStore.setPendingDestination(.qibla)
        return .result()
    }
}

struct OpenQuranIntent: AppIntent {
    static var title: LocalizedStringResource = "Qurʾān öffnen"
    static var openAppWhenRun = true

    func perform() async throws -> some IntentResult {
        DarWidgetStore.setPendingDestination(.quran)
        return .result()
    }
}

struct OpenDuasIntent: AppIntent {
    static var title: LocalizedStringResource = "Duʿāʾ öffnen"
    static var openAppWhenRun = true

    func perform() async throws -> some IntentResult {
        DarWidgetStore.setPendingDestination(.duas)
        return .result()
    }
}
