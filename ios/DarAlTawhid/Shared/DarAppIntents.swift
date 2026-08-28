import AppIntents
import Foundation

enum DarWidgetLook: String, AppEnum {
    case eisgold
    case tinte
    case pergament
    case royal
    case bordeaux
    case app

    static var typeDisplayRepresentation: TypeDisplayRepresentation = "Farbe"

    static var caseDisplayRepresentations: [DarWidgetLook: DisplayRepresentation] = [
        .eisgold: "Eisgold",
        .tinte: "Tinte",
        .pergament: "Pergament",
        .royal: "Royal",
        .bordeaux: "Bordeaux",
        .app: "App-Thema"
    ]
}

struct OpenPrayerIntent: AppIntent {
    static var title: LocalizedStringResource = "Gebetszeiten öffnen"
    static var description = IntentDescription("Öffnet die Gebetszeiten in DAR AL TAWḤĪD.")
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

struct OpenHomeIntent: AppIntent {
    static var title: LocalizedStringResource = "Start öffnen"
    static var openAppWhenRun = true

    func perform() async throws -> some IntentResult {
        DarWidgetStore.setPendingDestination(.home)
        return .result()
    }
}

struct OpenJummahIntent: AppIntent {
    static var title: LocalizedStringResource = "Jumuʿah öffnen"
    static var openAppWhenRun = true

    func perform() async throws -> some IntentResult {
        DarWidgetStore.setPendingDestination(.jummah)
        return .result()
    }
}
