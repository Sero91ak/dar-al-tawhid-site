import AppIntents
import Foundation

enum DarWidgetLook: String, AppEnum {
    // Keep the previous raw values so existing widget configurations migrate safely.
    case app = "app"
    case automatisch = "automatisch"
    case klassischHell = "klassisch-hell"
    case pergament = "pergament"
    case eisgold = "eisgold"
    case petrol = "petrol"
    case klassischDunkel = "tinte"
    case salbeiElfenbein = "salbeiElfenbein"
    case sanftElegant = "soft"
    case royalNachtblau = "royal"
    case bordeauxRoyalPremium = "bordeaux"
    case darAlLayl = "dar-al-layl"

    static var typeDisplayRepresentation: TypeDisplayRepresentation = "Erscheinungsbild"

    static var caseDisplayRepresentations: [DarWidgetLook: DisplayRepresentation] = [
        .app: "App-Design",
        .automatisch: "Automatisch",
        .klassischHell: "Klassisch Hell",
        .pergament: "Pergament",
        .eisgold: "Eisgold",
        .petrol: "Petrol",
        .klassischDunkel: "Klassisch Dunkel",
        .salbeiElfenbein: "Salbei Elfenbein",
        .sanftElegant: "Sanft Elegant",
        .royalNachtblau: "Royal Nachtblau",
        .bordeauxRoyalPremium: "Bordeaux Royal Premium",
        .darAlLayl: "Dār al-Layl"
    ]
}

struct OpenPrayerIntent: AppIntent {
    static var title: LocalizedStringResource = "Gebetszeiten öffnen"
    static var description = IntentDescription("Öffnet die Gebetszeiten in DĀR AL TAWḤĪD.")
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
