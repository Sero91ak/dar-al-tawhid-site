import Foundation
import SwiftUI
import WidgetKit
import AppIntents

// DAT DESIGN V3.3 — distinct per-theme metadata colors, sharper original logo, title/body hierarchy.
// This extension reads the existing dar.widget.snapshot.v2 data contract.
// It does not reuse any of the removed Fresh widget views or providers.


// Each widget defaults to the reference design; “Automatisch” follows the app theme.
enum DATPremiumLook: String, AppEnum {
    case darAlLayl, automatisch, klassischHell, pergament, eisgold, salbeiElfenbein
    case petrol, klassischDunkel, sanftElegant, royalNachtblau, bordeauxRoyalPremium

    static var typeDisplayRepresentation = TypeDisplayRepresentation(name: "Widget-Erscheinungsbild")
    static var caseDisplayRepresentations: [DATPremiumLook: DisplayRepresentation] = [
        .darAlLayl: "Dār al-Layl",
        .automatisch: "Wie in der App",
        .klassischHell: "Klassisch Hell",
        .pergament: "Pergament",
        .eisgold: "Eisgold",
        .salbeiElfenbein: "Salbei Elfenbein",
        .petrol: "Petrol",
        .klassischDunkel: "Klassisch Dunkel",
        .sanftElegant: "Sanft Elegant",
        .royalNachtblau: "Royal Nachtblau",
        .bordeauxRoyalPremium: "Bordeaux Royal Premium"
    ]
}

struct DATPremiumIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "Widget-Erscheinungsbild"
    @Parameter(title: "Erscheinungsbild") var look: DATPremiumLook?
    // Kept for WidgetKit configuration migration. Only the standard view is exposed.
    @Parameter(title: "Gebetsansicht", default: .nextPrayer) var prayerMode: DATPrayerWidgetMode

    init() {
        self.look = .salbeiElfenbein
        self.prayerMode = .nextPrayer
    }
}

enum DATPrayerWidgetMode: String, AppEnum {
    case nextPrayer = "next-prayer"

    static var typeDisplayRepresentation = TypeDisplayRepresentation(name: "Gebetsansicht")
    static var caseDisplayRepresentations: [DATPrayerWidgetMode: DisplayRepresentation] = [
        .nextPrayer: "Standard"
    ]
}

private struct DATPrayer: Decodable {
    let name: String
    let time: String
}

private struct DATSnapshot: Decodable {
    var themeId: String = "salbeiElfenbein"
    var inkHex: String = ""
    var goldHex: String = ""
    var textHex: String = ""
    var mutedHex: String = ""
    var cityLabel: String = "Standort wird ermittelt …"
    var timeZoneIdentifier: String = "Europe/Berlin"
    var hijriLabel: String = ""
    var qiblaDegrees: Double?
    var prayers: [DATPrayer] = []
    var nextPrayerName: String = ""
    var nextPrayerTime: String = ""
    var ayahGerman: String = ""
    var ayahRef: String = ""
    var tadabburGerman: String = ""
    var duaTitle: String = ""
    var duaGerman: String = ""
    var duaCategory: String = ""
    var duaSource: String = ""
    var weatherTemperature: Double?
    var weatherSymbolName: String = ""
    var weatherCondition: String = ""
    var updatedAt: Date?

    enum CodingKeys: String, CodingKey {
        case themeId, inkHex, goldHex, textHex, mutedHex
        case cityLabel, timeZoneIdentifier, hijriLabel, qiblaDegrees, prayers
        case nextPrayerName, nextPrayerTime, ayahGerman, ayahRef, tadabburGerman
        case duaTitle, duaGerman, duaCategory, duaSource, weatherTemperature
        case weatherSymbolName, weatherCondition, updatedAt
    }

    init() {}
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        themeId = try c.decodeIfPresent(String.self, forKey: .themeId) ?? "salbeiElfenbein"
        inkHex = try c.decodeIfPresent(String.self, forKey: .inkHex) ?? ""
        goldHex = try c.decodeIfPresent(String.self, forKey: .goldHex) ?? ""
        textHex = try c.decodeIfPresent(String.self, forKey: .textHex) ?? ""
        mutedHex = try c.decodeIfPresent(String.self, forKey: .mutedHex) ?? ""
        cityLabel = try c.decodeIfPresent(String.self, forKey: .cityLabel) ?? "Standort wird ermittelt …"
        timeZoneIdentifier = try c.decodeIfPresent(String.self, forKey: .timeZoneIdentifier) ?? "Europe/Berlin"
        hijriLabel = try c.decodeIfPresent(String.self, forKey: .hijriLabel) ?? ""
        qiblaDegrees = try c.decodeIfPresent(Double.self, forKey: .qiblaDegrees)
        prayers = try c.decodeIfPresent([DATPrayer].self, forKey: .prayers) ?? []
        nextPrayerName = try c.decodeIfPresent(String.self, forKey: .nextPrayerName) ?? ""
        nextPrayerTime = try c.decodeIfPresent(String.self, forKey: .nextPrayerTime) ?? ""
        ayahGerman = try c.decodeIfPresent(String.self, forKey: .ayahGerman) ?? ""
        ayahRef = try c.decodeIfPresent(String.self, forKey: .ayahRef) ?? ""
        tadabburGerman = try c.decodeIfPresent(String.self, forKey: .tadabburGerman) ?? ""
        duaTitle = try c.decodeIfPresent(String.self, forKey: .duaTitle) ?? ""
        duaGerman = try c.decodeIfPresent(String.self, forKey: .duaGerman) ?? ""
        duaCategory = try c.decodeIfPresent(String.self, forKey: .duaCategory) ?? ""
        duaSource = try c.decodeIfPresent(String.self, forKey: .duaSource) ?? ""
        weatherTemperature = try c.decodeIfPresent(Double.self, forKey: .weatherTemperature)
        weatherSymbolName = try c.decodeIfPresent(String.self, forKey: .weatherSymbolName) ?? ""
        weatherCondition = try c.decodeIfPresent(String.self, forKey: .weatherCondition) ?? ""
        updatedAt = try c.decodeIfPresent(Date.self, forKey: .updatedAt)
    }

    var timeZone: TimeZone { TimeZone(identifier: timeZoneIdentifier) ?? .current }
    var ready: Bool { !prayers.isEmpty }
    var place: String {
        let value = cityLabel.trimmingCharacters(in: .whitespacesAndNewlines)
        if value.isEmpty || value.localizedCaseInsensitiveContains("ermittelt") || value == "Berlin (Standard)" || value.allSatisfy({ $0.isNumber || $0 == " " }) {
            return "—"
        }
        return value
    }
}

private struct DATEntry: TimelineEntry {
    let date: Date
    let snapshot: DATSnapshot
    let look: DATPremiumLook
    let prayerMode: DATPrayerWidgetMode

    init(
        date: Date,
        snapshot: DATSnapshot,
        look: DATPremiumLook,
        prayerMode: DATPrayerWidgetMode = .nextPrayer
    ) {
        self.date = date
        self.snapshot = snapshot
        self.look = look
        self.prayerMode = prayerMode
    }
}

private struct DATProvider: AppIntentTimelineProvider {
    typealias Intent = DATPremiumIntent

    func placeholder(in context: Context) -> DATEntry {
        // Widget-Auswahl und StandBy verwenden diesen Eintrag, bevor die
        // App-Group-Daten gelesen werden. Ein leerer Snapshot führt dort zu
        // scheinbar weißen/leeren Karten.
        DATEntry(date: .now, snapshot: .preview, look: .salbeiElfenbein)
    }
    func snapshot(for configuration: DATPremiumIntent, in context: Context) async -> DATEntry {
        let snapshot = load()
        return DATEntry(
            date: .now,
            snapshot: snapshot.ready ? snapshot : .preview,
            look: configuration.look ?? .salbeiElfenbein,
            prayerMode: configuration.prayerMode
        )
    }
    func timeline(for configuration: DATPremiumIntent, in context: Context) async -> Timeline<DATEntry> {
        let now = Date()
        let loaded = load()
        let snapshot = loaded.ready ? loaded : .preview
        var entries = [DATEntry(
            date: now,
            snapshot: snapshot,
                look: configuration.look ?? .salbeiElfenbein
        )]
        if let next = DATClock.next(snapshot, at: now)?.when, next > now {
            entries.append(DATEntry(
                date: next,
                snapshot: snapshot,
                look: configuration.look ?? .salbeiElfenbein,
                prayerMode: configuration.prayerMode
            ))
        }
        return Timeline(entries: entries, policy: .after(now.addingTimeInterval(900)))
    }
    fileprivate func load() -> DATSnapshot {
        guard let bytes = UserDefaults(suiteName: "group.de.daraltawhid.app")?
            .data(forKey: "dar.widget.snapshot.v2"),
              let value = try? JSONDecoder().decode(DATSnapshot.self, from: bytes)
        else {
            // The iPad Simulator may run the extension without an installed
            // App Group entitlement. Never return an empty snapshot here:
            // WidgetKit would then present a blank/black widget in the gallery.
            // A real device still uses the shared location/prayer snapshot.
            return .preview
        }
        return value
    }
}

private struct DATClassicProvider: TimelineProvider {
    typealias Entry = DATEntry

    func placeholder(in context: Context) -> DATEntry {
        DATEntry(date: .now, snapshot: .preview, look: .salbeiElfenbein)
    }

    func getSnapshot(in context: Context, completion: @escaping (DATEntry) -> Void) {
        let snapshot = DATProvider().load()
        completion(DATEntry(date: .now, snapshot: snapshot.ready ? snapshot : .preview, look: .salbeiElfenbein))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<DATEntry>) -> Void) {
        let now = Date()
        let loaded = DATProvider().load()
        let snapshot = loaded.ready ? loaded : .preview
        var entries = [DATEntry(date: now, snapshot: snapshot, look: .salbeiElfenbein)]
        if let next = DATClock.next(snapshot, at: now)?.when, next > now {
            entries.append(DATEntry(date: next, snapshot: snapshot, look: .salbeiElfenbein))
        }
        completion(Timeline(entries: entries, policy: .after(now.addingTimeInterval(900))))
    }
}

/// Stable provider for widgets that do not need a per-widget user intent.
/// The selected appearance is read from the shared app snapshot, which keeps
/// WidgetKit's gallery registration deterministic and avoids blank cards when
/// AppIntents metadata is unavailable during widget discovery.
private struct DATStaticProvider: TimelineProvider {
    func placeholder(in context: Context) -> DATEntry {
        DATEntry(date: .now, snapshot: .preview, look: .automatisch)
    }

    func getSnapshot(in context: Context, completion: @escaping (DATEntry) -> Void) {
        let snapshot = DATProvider().load()
        completion(DATEntry(date: .now, snapshot: snapshot.ready ? snapshot : .preview, look: .automatisch))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<DATEntry>) -> Void) {
        let now = Date()
        let loaded = DATProvider().load()
        let snapshot = loaded.ready ? loaded : .preview
        var entries = [DATEntry(date: now, snapshot: snapshot, look: .automatisch)]
        if let next = DATClock.next(snapshot, at: now)?.when, next > now {
            entries.append(DATEntry(date: next, snapshot: snapshot, look: .automatisch))
        }
        completion(Timeline(entries: entries, policy: .after(now.addingTimeInterval(900))))
    }
}

private struct DATPalette {
    let bg: Color
    let fg: Color
    let accent: Color
    let muted: Color
    let divider: Color
    let calendarTint: Color
    let weatherTint: Color
    let hijriTint: Color

    init(_ s: DATSnapshot, scheme: ColorScheme, look: DATPremiumLook) {
        let name = (look == .automatisch ? s.themeId : look.rawValue).lowercased()
        let isSage = name.contains("salbei") || name.contains("elfenbein")
        let isIceGold = name.contains("eisgold")
        let isDarAlLayl = name.contains("darallayl") || name.contains("dar-al-layl")
        let isDark = name.contains("dunkel") || name.contains("night") || name.contains("nacht") || name.contains("layl") || name.contains("royal") || name.contains("bordeaux") || name.contains("petrol") || name == "dark" || (name.contains("auto") && scheme == .dark)
        if isDarAlLayl {
            // Dār al-Layl uses the app's black-and-gold palette.
            bg = Color(red: 0.035, green: 0.039, blue: 0.031)
        } else if name.contains("bordeaux") {
            bg = Color(red: 0.10, green: 0.018, blue: 0.035)
        } else if name.contains("nachtblau") || name.contains("navy") {
            bg = Color(red: 0.035, green: 0.075, blue: 0.15)
        } else if name.contains("petrol") {
            bg = Color(red: 0.035, green: 0.14, blue: 0.15)
        } else if name.contains("sanft") {
            bg = Color(red: 0.93, green: 0.86, blue: 0.84)
        } else if isSage {
            bg = Color(red: 0.91, green: 0.93, blue: 0.88)
        } else if isIceGold {
            bg = Color(red: 0.88, green: 0.92, blue: 0.95)
        } else if isDark {
            bg = Color(red: 0.075, green: 0.077, blue: 0.070)
        } else {
            bg = Color(red: 0.94, green: 0.925, blue: 0.875)
        }
        // Explicit selection uses its own readable palette. App hex colors are
        // only applied when the user selected “Wie in der App”.
        let useAppColors = look == .automatisch
        fg = (useAppColors ? Color(datHex: s.textHex) : nil) ?? (isDarAlLayl ? Color(red: 0.949, green: 0.922, blue: 0.867) : (isSage ? Color(red: 0.11, green: 0.18, blue: 0.16) : (isIceGold ? Color(red: 0.12, green: 0.15, blue: 0.18) : (isDark ? Color(red: 0.95, green: 0.91, blue: 0.80) : Color(red: 0.15, green: 0.14, blue: 0.12)))))
        accent = (useAppColors ? Color(datHex: s.goldHex) : nil) ?? (isDarAlLayl ? Color(red: 0.784, green: 0.663, blue: 0.404) : (isSage ? Color(red: 0.20, green: 0.39, blue: 0.30) : (isIceGold ? Color(red: 0.52, green: 0.42, blue: 0.24) : (isDark ? Color(red: 0.84, green: 0.72, blue: 0.47) : Color(red: 0.46, green: 0.34, blue: 0.18)))))
        muted = (useAppColors ? Color(datHex: s.mutedHex) : nil) ?? (isDarAlLayl ? Color(red: 0.663, green: 0.616, blue: 0.533) : (isSage ? Color(red: 0.34, green: 0.43, blue: 0.38) : (isIceGold ? Color(red: 0.29, green: 0.34, blue: 0.39) : (isDark ? Color(red: 0.69, green: 0.65, blue: 0.55) : Color(red: 0.40, green: 0.37, blue: 0.32)))))
        divider = accent.opacity(isDark ? 0.29 : 0.24)

        // Consistent meaning, different refined colors in EVERY widget look.
        // Calendar = warm, weather = cool, Hijri = subdued complementary tint.
        // Avoids the neon green in the dark Dār al-Layl palette.
        if name.contains("bordeaux") {
            calendarTint = Color(red: 0.90, green: 0.71, blue: 0.56)
            weatherTint = Color(red: 0.64, green: 0.78, blue: 0.87)
            hijriTint = Color(red: 0.85, green: 0.67, blue: 0.77)
        } else if name.contains("nachtblau") || name.contains("navy") {
            calendarTint = Color(red: 0.87, green: 0.71, blue: 0.45)
            weatherTint = Color(red: 0.55, green: 0.78, blue: 0.96)
            hijriTint = Color(red: 0.75, green: 0.71, blue: 0.92)
        } else if name.contains("petrol") {
            calendarTint = Color(red: 0.90, green: 0.73, blue: 0.51)
            weatherTint = Color(red: 0.53, green: 0.82, blue: 0.83)
            hijriTint = Color(red: 0.74, green: 0.76, blue: 0.87)
        } else if name.contains("sanft") {
            calendarTint = Color(red: 0.56, green: 0.29, blue: 0.22)
            weatherTint = Color(red: 0.28, green: 0.44, blue: 0.54)
            hijriTint = Color(red: 0.46, green: 0.32, blue: 0.49)
        } else if name.contains("layl") {
            calendarTint = Color(red: 0.86, green: 0.73, blue: 0.50)
            weatherTint = Color(red: 0.78, green: 0.72, blue: 0.60)
            hijriTint = Color(red: 0.68, green: 0.62, blue: 0.52)
        } else if name.contains("dunkel") || name == "dark" {
            calendarTint = Color(red: 0.85, green: 0.68, blue: 0.41)
            weatherTint = Color(red: 0.54, green: 0.74, blue: 0.78)
            hijriTint = Color(red: 0.69, green: 0.72, blue: 0.86)
        } else if name.contains("eisgold") {
            calendarTint = Color(red: 0.57, green: 0.42, blue: 0.23)
            weatherTint = Color(red: 0.27, green: 0.51, blue: 0.66)
            hijriTint = Color(red: 0.44, green: 0.47, blue: 0.64)
        } else if name.contains("pergament") {
            calendarTint = Color(red: 0.51, green: 0.32, blue: 0.16)
            weatherTint = Color(red: 0.34, green: 0.48, blue: 0.56)
            hijriTint = Color(red: 0.51, green: 0.43, blue: 0.57)
        } else if name.contains("klassischhell") || name.contains("klassisch") {
            calendarTint = Color(red: 0.52, green: 0.37, blue: 0.20)
            weatherTint = Color(red: 0.27, green: 0.47, blue: 0.61)
            hijriTint = Color(red: 0.47, green: 0.38, blue: 0.56)
        } else if isDark {
            calendarTint = Color(red: 0.86, green: 0.72, blue: 0.47)
            weatherTint = Color(red: 0.57, green: 0.77, blue: 0.85)
            hijriTint = Color(red: 0.72, green: 0.68, blue: 0.82)
        } else {
            calendarTint = Color(red: 0.49, green: 0.35, blue: 0.18)
            weatherTint = Color(red: 0.26, green: 0.45, blue: 0.59)
            hijriTint = Color(red: 0.47, green: 0.37, blue: 0.54)
        }
    }
}

private extension Color {
    init?(datHex raw: String) {
        let value = raw.trimmingCharacters(in: .whitespacesAndNewlines)
            .trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        guard value.count == 6, let n = UInt32(value, radix: 16) else { return nil }
        self.init(red: Double((n >> 16) & 255) / 255,
                  green: Double((n >> 8) & 255) / 255,
                  blue: Double(n & 255) / 255)
    }
}

private extension Image {
    @ViewBuilder
    func datFullColorWidgetImage() -> some View {
        if #available(iOS 18.0, *) {
            self.widgetAccentedRenderingMode(.fullColor)
        } else {
            self
        }
    }
}

private enum DATClock {
    static func events(_ snapshot: DATSnapshot, relativeTo now: Date) -> [(name: String, time: String, when: Date)] {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = snapshot.timeZone
        let day = cal.dateComponents([.year, .month, .day], from: now)
        return snapshot.prayers.compactMap { prayer in
            let values = prayer.time.split(separator: ":").compactMap { Int($0) }
            guard values.count == 2, (0...23).contains(values[0]), (0...59).contains(values[1]) else { return nil }
            var comps = day
            comps.hour = values[0]
            comps.minute = values[1]
            guard let date = cal.date(from: comps) else { return nil }
            return (name: prayer.name, time: prayer.time, when: date)
        }.sorted { $0.when < $1.when }
    }
    static func isSunrise(_ name: String) -> Bool {
        let n = name.lowercased()
        return n.contains("sunrise") || n.contains("sonnenaufgang") || n.contains("shuruq") || n.contains("schurūq")
    }
    static func sunrise(_ s: DATSnapshot) -> String? {
        s.prayers.first(where: { isSunrise($0.name) })?.time
    }
    static func current(_ s: DATSnapshot, at date: Date) -> (name: String, time: String)? {
        events(s, relativeTo: date).filter { !isSunrise($0.name) && $0.when <= date }
            .last.map { ($0.name, $0.time) }
    }
    static func next(_ s: DATSnapshot, at date: Date) -> (name: String, time: String, when: Date)? {
        if let event = events(s, relativeTo: date).first(where: { !isSunrise($0.name) && $0.when > date }) {
            return event
        }
        // After ʿIshāʾ, only use tomorrow’s Fajr if the host app provided
        // a verified next-prayer time. Today's Fajr must not be advertised as exact tomorrow.
        let n = s.nextPrayerName.lowercased()
        guard n.contains("fajr") || n.contains("fadschr"),
              !s.nextPrayerTime.isEmpty else { return nil }
        let parts = s.nextPrayerTime.split(separator: ":").compactMap { Int($0) }
        guard parts.count == 2, (0...23).contains(parts[0]), (0...59).contains(parts[1]) else { return nil }
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = s.timeZone
        guard let tomorrow = cal.date(byAdding: .day, value: 1, to: cal.startOfDay(for: date)) else { return nil }
        var comps = cal.dateComponents([.year, .month, .day], from: tomorrow)
        comps.hour = parts[0]
        comps.minute = parts[1]
        guard let when = cal.date(from: comps), when > date else { return nil }
        return (name: s.nextPrayerName, time: s.nextPrayerTime, when: when)
    }
    static func nextName(_ s: DATSnapshot, at date: Date) -> String {
        next(s, at: date)?.name ?? (s.nextPrayerName.isEmpty ? "Nächstes Gebet" : s.nextPrayerName)
    }
    static func nextTime(_ s: DATSnapshot, at date: Date) -> String {
        next(s, at: date)?.time ?? (s.nextPrayerTime.isEmpty ? "—" : s.nextPrayerTime)
    }

    static func remainingText(_ s: DATSnapshot, at date: Date) -> String {
        guard let next = next(s, at: date) else { return "—" }
        let totalMinutes = max(0, Int(next.when.timeIntervalSince(date) / 60))
        let hours = totalMinutes / 60
        let minutes = totalMinutes % 60
        if hours > 0 {
            return minutes == 0 ? "IN \(hours) STD" : "IN \(hours) STD \(minutes) MIN"
        }
        return "IN \(minutes) MIN"
    }

    static func compactRemainingText(_ s: DATSnapshot, at date: Date) -> String {
        guard let next = next(s, at: date) else { return "—" }
        let totalMinutes = max(0, Int(next.when.timeIntervalSince(date) / 60))
        let hours = totalMinutes / 60
        let minutes = totalMinutes % 60
        if hours > 0 {
            return minutes == 0 ? "\(hours) Std" : "\(hours) Std \(minutes) Min"
        }
        return "\(minutes) Min"
    }
}

private enum DATWeatherSymbol {
    static func name(_ suppliedName: String, timeZone: TimeZone, date: Date = .now) -> String {
        let isNight = Calendar.current.dateComponents(in: timeZone, from: date).hour.map { $0 < 6 || $0 >= 18 } ?? false
        let supplied = suppliedName.isEmpty ? (isNight ? "cloud.moon" : "cloud.sun") : suppliedName
        guard isNight else { return supplied }

        switch supplied {
        case "cloud.sun": return "cloud.moon"
        case "cloud.sun.fill": return "cloud.moon.fill"
        case "sun.max": return "moon.stars"
        case "sun.max.fill": return "moon.stars.fill"
        case "sun.haze": return "moon.haze"
        case "sun.haze.fill": return "moon.haze.fill"
        default: return supplied
        }
    }
}

private enum DATPrayerName {
    static func display(_ raw: String) -> String {
        switch raw.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() {
        case "fajr", "fadschr": return "Fajr"
        case "dhuhr", "zuhr", "dohr": return "Ẓuhr"
        case "asr", "ʿasr", "aṣr": return "ʿAṣr"
        case "maghrib", "maġrib", "magrib": return "Maghrib"
        case "isha", "ʿisha", "ischa", "ischā": return "ʿIshāʾ"
        default: return raw
        }
    }

    static func matches(_ lhs: String, _ rhs: String) -> Bool {
        display(lhs) == display(rhs)
    }
}

private enum DATWidgetText {
    // Truncate on a word boundary for deliberately condensed small widgets.
    static func short(_ input: String, max characters: Int) -> String {
        let value = input.trimmingCharacters(in: .whitespacesAndNewlines)
        guard value.count > characters else { return value }
        let part = String(value.prefix(characters - 1))
        let words = part.split(separator: " ")
        let result = words.count > 1 ? words.dropLast().joined(separator: " ") : part
        return result + "…"
    }
}

private struct DATHeader: View {
    let snapshot: DATSnapshot
    let palette: DATPalette
    let small: Bool
    var medium: Bool = false
    var subtitle: String? = nil
    var showWeather: Bool = false
    var showDateStack: Bool = false

    var body: some View {
        HStack(alignment: .center, spacing: small ? 7 : (medium ? 8 : 10)) {
            // Asset rebuilt from the ORIGINAL app logo at retina-safe resolution.
            Image("BrandMark")
                .resizable()
                .interpolation(.high)
                // Preserve the original logo colors in iOS 18/27 tinted and
                // transparent Home Screen rendering modes.
                .datFullColorWidgetImage()
                .scaledToFit()
                .opacity(0.96)
                .frame(width: small ? 30 : (medium ? 34 : 42), height: small ? 30 : (medium ? 34 : 42))
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 1) {
                Text("DĀR AL TAWḤĪD")
                    .font(.system(size: small ? 12 : (medium ? 15.5 : 17), weight: .bold, design: .serif))
                    .lineLimit(1)
                    .minimumScaleFactor(0.78)
                Text(subtitle ?? snapshot.place)
                    .font(.system(size: small ? 10.5 : (medium ? 11.2 : 12.2), weight: .medium))
                    .foregroundStyle(palette.muted)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
            Spacer(minLength: 0)
            if showDateStack {
                VStack(alignment: .trailing, spacing: 2) {
                    HStack(spacing: 4) {
                        DATEmojiIcon(emoji: "🗓️", size: 13)
                        Text(Date(), format: .dateTime.weekday(.abbreviated).day().month(.abbreviated))
                    }
                    HStack(spacing: 4) {
                        DATEmojiIcon(emoji: "🌙", size: 13)
                        Text(snapshot.hijriLabel.isEmpty ? "Hijri-Datum folgt" : snapshot.hijriLabel)
                    }
                }
                .font(.system(size: medium ? 10.5 : 11, weight: .medium, design: .rounded))
                .foregroundStyle(palette.muted)
                .lineLimit(1)
                .minimumScaleFactor(0.72)
            } else if showWeather, let temperature = snapshot.weatherTemperature {
                HStack(spacing: 3) {
                    DATEmojiIcon(emoji: "⛅️", size: 14)
                    Text(String(format: "%.0f °C", temperature))
                        .foregroundStyle(palette.weatherTint)
                }
                .font(.system(size: 11, weight: .medium, design: .rounded))
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            }
        }
        .foregroundStyle(palette.fg)
        .padding(.leading, 2)
    }
}

private struct DATRule: View {
    let color: Color
    var body: some View {
        Rectangle().fill(color).frame(height: 0.7)
    }
}

private struct DATEmojiIcon: View {
    let emoji: String
    let size: CGFloat

    var body: some View {
        Text(emoji)
            .font(.system(size: size))
            .frame(width: size + 4, height: size + 4)
            .minimumScaleFactor(0.8)
            .accessibilityHidden(true)
    }
}

private struct DATMetaRow: View {
    let entry: DATEntry
    let p: DATPalette
    var compact: Bool = false

    private var weather: String {
        guard let temp = entry.snapshot.weatherTemperature else { return "—" }
        return String(format: "%.0f°", temp)
    }

    var body: some View {
        Group {
            if compact {
                // Small widgets: two breathing rows instead of one miniature three-column line.
                VStack(alignment: .leading, spacing: 3) {
                    HStack(spacing: 5) {
                        DATEmojiIcon(emoji: "🗓️", size: 12)
                        Text(Date(), format: .dateTime.weekday(.abbreviated).day().month(.abbreviated))
                            .lineLimit(1).minimumScaleFactor(0.9)
                        Spacer(minLength: 4)
                        DATEmojiIcon(emoji: "⛅️", size: 13)
                        Text(weather).monospacedDigit().foregroundStyle(p.weatherTint)
                    }
                    HStack(spacing: 5) {
                        DATEmojiIcon(emoji: "🌙", size: 12)
                        Text(entry.snapshot.hijriLabel.isEmpty ? "Hiǧrī-Datum folgt" : entry.snapshot.hijriLabel)
                            .lineLimit(1).minimumScaleFactor(0.88)
                        Spacer(minLength: 0)
                    }
                }
                .font(.system(size: 9.7, weight: .medium, design: .rounded))
            } else {
                // Medium/large: date, Hijri and weather each get a stable position.
                HStack(spacing: 8) {
                    HStack(spacing: 4) {
                        DATEmojiIcon(emoji: "🗓️", size: 13)
                        Text(Date(), format: .dateTime.weekday(.abbreviated).day().month(.abbreviated))
                            .lineLimit(1).minimumScaleFactor(0.92)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    HStack(spacing: 4) {
                        DATEmojiIcon(emoji: "🌙", size: 13)
                        Text(entry.snapshot.hijriLabel.isEmpty ? "Hiǧrī —" : entry.snapshot.hijriLabel)
                            .lineLimit(1).minimumScaleFactor(0.88)
                    }
                    .frame(maxWidth: .infinity, alignment: .center)
                    HStack(spacing: 4) {
                        DATEmojiIcon(emoji: "⛅️", size: 14)
                        Text(weather).monospacedDigit().foregroundStyle(p.weatherTint)
                    }
                    .frame(maxWidth: 64, alignment: .trailing)
                }
                .font(.system(size: 10.5, weight: .medium, design: .rounded))
            }
        }
        .foregroundStyle(p.muted)
    }
}

private struct DATBottomDetails: View {
    let entry: DATEntry
    let p: DATPalette
    var body: some View {
        HStack(spacing: 6) {
            DATEmojiIcon(emoji: "🗓️", size: 12)
            Text(Date(), format: .dateTime.weekday(.abbreviated).day().month(.abbreviated))
                .lineLimit(1).minimumScaleFactor(0.75)
            Spacer(minLength: 2)
            if !entry.snapshot.hijriLabel.isEmpty {
                DATEmojiIcon(emoji: "🌙", size: 12)
                Text(entry.snapshot.hijriLabel)
                    .lineLimit(1).minimumScaleFactor(0.7)
            }
        }
        .font(.system(size: 9.4, weight: .medium, design: .rounded))
        .foregroundStyle(p.muted)
    }
}

private struct DATTimer: View {
    let snapshot: DATSnapshot
    let date: Date
    let fontSize: CGFloat

    var body: some View {
        Text(DATClock.nextTime(snapshot, at: date))
            .font(.system(size: fontSize, weight: .medium, design: .rounded))
            .monospacedDigit()
            .lineLimit(1)
            .minimumScaleFactor(0.65)
    }
}

private struct DATCompactPrayerInfo: View {
    let entry: DATEntry
    let p: DATPalette

    var body: some View {
        HStack(spacing: 4) {
            HStack(spacing: 3) {
                DATEmojiIcon(emoji: "⛅️", size: 13)
                Text(DATClock.sunrise(entry.snapshot) ?? "—")
                    .monospacedDigit()
                    .lineLimit(1)
                    .minimumScaleFactor(0.72)
                    .font(.system(size: 9.2, weight: .bold, design: .rounded))
                    .foregroundStyle(p.fg)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            HStack(spacing: 3) {
                DATEmojiIcon(emoji: "🗓️", size: 12)
                Text(entry.date, format: .dateTime.weekday(.abbreviated).day().month(.abbreviated).locale(Locale(identifier: "de_DE")))
                    .foregroundStyle(Color(red: 0.62, green: 0.22, blue: 0.18))
                    .lineLimit(1)
                    .minimumScaleFactor(0.78)
                    .font(.system(size: 10.2, weight: .bold, design: .rounded))
            }
            .layoutPriority(2)
            .frame(maxWidth: .infinity, alignment: .center)
            .overlay(alignment: .bottom) {
                Rectangle()
                    .fill(p.divider.opacity(0.65))
                    .frame(height: 0.7)
                    .padding(.horizontal, 5)
            }
            HStack(spacing: 3) {
                Image(systemName: DATWeatherSymbol.name(entry.snapshot.weatherSymbolName, timeZone: entry.snapshot.timeZone))
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(p.weatherTint)
                if let temperature = entry.snapshot.weatherTemperature {
                    Text("\(temperature, specifier: "%.0f")°")
                        .monospacedDigit()
                        .font(.system(size: 9.2, weight: .bold, design: .rounded))
                        .foregroundStyle(p.calendarTint)
                } else {
                    Text("—")
                }
            }
            .padding(.leading, 3)
            .frame(maxWidth: .infinity, alignment: .trailing)
        }
        .font(.system(size: 8.9, weight: .medium, design: .rounded))
        .foregroundStyle(p.muted)
        .lineLimit(1)
    }
}

private struct DATCountdownCapsule: View {
    let snapshot: DATSnapshot
    let date: Date
    let p: DATPalette
    let fontSize: CGFloat

    var body: some View {
        Text(DATClock.remainingText(snapshot, at: date))
            .font(.system(size: fontSize, weight: .semibold, design: .rounded))
            .monospacedDigit()
            .lineLimit(1)
            .fixedSize(horizontal: true, vertical: false)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(p.bg.opacity(0.72), in: Capsule())
            .overlay(Capsule().stroke(p.divider.opacity(0.9), lineWidth: 0.7))
    }
}

private struct DATMinuteCountdown: View {
    let snapshot: DATSnapshot
    let date: Date
    let fontSize: CGFloat

    var body: some View {
        TimelineView(.periodic(from: date, by: 60)) { context in
            Text(DATClock.compactRemainingText(snapshot, at: context.date))
                .font(.system(size: fontSize, weight: .medium, design: .rounded))
                .monospacedDigit()
                .lineLimit(1)
                .minimumScaleFactor(0.65)
        }
    }
}

// Ref 1: small prayer card, sunrise/hijri/weather, central countdown, bottom capsule.
private struct DATSmallPrayerView: View {
    let entry: DATEntry
    let p: DATPalette

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            DATHeader(snapshot: entry.snapshot, palette: p, small: true)
            DATRule(color: p.divider.opacity(0.74))
            DATCompactPrayerInfo(entry: entry, p: p)
            VStack(spacing: 2) {
                Text("\(DATClock.nextName(entry.snapshot, at: entry.date)) in")
                    .font(.system(size: 18, weight: .semibold, design: .serif))
                    .foregroundStyle(p.calendarTint)
                    .lineLimit(1).minimumScaleFactor(0.78)
                Group {
                    DATMinuteCountdown(snapshot: entry.snapshot, date: entry.date, fontSize: 26)
                }
                .frame(maxWidth: .infinity, alignment: .center)
                .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            VStack(spacing: 1) {
                HStack(spacing: 3) {
                    DATEmojiIcon(emoji: "🕌", size: 11)
                    Text("Gebetszeit")
                }
                .font(.system(size: 9.5, weight: .medium, design: .rounded))
                .foregroundStyle(p.muted)
                HStack(spacing: 5) {
                    Text(DATClock.nextName(entry.snapshot, at: entry.date))
                        .font(.system(size: 14, weight: .semibold, design: .serif))
                        .lineLimit(1)
                        .minimumScaleFactor(0.72)
                        .fixedSize(horizontal: true, vertical: false)
                    Text(DATClock.nextTime(entry.snapshot, at: entry.date))
                        .font(.system(size: 15.5, weight: .semibold, design: .serif))
                        .monospacedDigit()
                        .lineLimit(1)
                        .minimumScaleFactor(0.72)
                        .fixedSize(horizontal: true, vertical: false)
                }
                .fixedSize(horizontal: true, vertical: false)
            }
            .frame(maxWidth: .infinity)
            .padding(.horizontal, 7)
            .padding(.vertical, 2.5)
            .background(p.fg.opacity(0.12), in: RoundedRectangle(cornerRadius: 8))
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(p.divider.opacity(0.66), lineWidth: 0.75))
            .padding(.horizontal, 18)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 7)
        .foregroundStyle(p.fg)
        .containerBackground(p.bg, for: .widget)
    }
}

private struct DATMediumPrayerView: View {
    let entry: DATEntry
    let p: DATPalette

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            DATHeader(snapshot: entry.snapshot, palette: p, small: true)
            DATRule(color: p.divider.opacity(0.74))
            DATMetaRow(entry: entry, p: p)
            HStack(alignment: .center, spacing: 12) {
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 3) {
                        DATEmojiIcon(emoji: "🕌", size: 11)
                        Text("NÄCHSTES GEBET")
                    }
                    .font(.system(size: 9.4, weight: .bold, design: .rounded))
                    .tracking(0.8).foregroundStyle(p.muted)
                    Text(DATClock.nextName(entry.snapshot, at: entry.date))
                        .font(.system(size: 20.5, weight: .semibold, design: .serif))
                        .foregroundStyle(p.accent)
                        .lineLimit(1).minimumScaleFactor(0.82)
                    HStack(alignment: .firstTextBaseline, spacing: 7) {
                        DATTimer(snapshot: entry.snapshot, date: entry.date, fontSize: 23)
                        Text(DATClock.nextTime(entry.snapshot, at: entry.date))
                            .font(.system(size: 11.2, weight: .medium, design: .rounded))
                            .foregroundStyle(p.muted)
                            .monospacedDigit().lineLimit(1)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                Rectangle().fill(p.divider.opacity(0.7))
                    .frame(width: 1, height: 72)
                VStack(alignment: .leading, spacing: 5) {
                    Text("SONNENAUFGANG")
                        .font(.system(size: 8.7, weight: .bold, design: .rounded))
                        .tracking(0.6)
                        .foregroundStyle(p.muted)
                        .lineLimit(1)
                        .minimumScaleFactor(0.88)
                    Text(DATClock.sunrise(entry.snapshot) ?? "—")
                        .font(.system(size: 18.5, weight: .semibold, design: .rounded))
                        .foregroundStyle(p.fg)
                        .monospacedDigit()
                    DATRule(color: p.divider.opacity(0.5))
                    Text(entry.snapshot.place)
                        .font(.system(size: 10.6, weight: .medium, design: .rounded))
                        .foregroundStyle(p.muted)
                        .lineLimit(1).minimumScaleFactor(0.84)
                }
                .frame(width: 116, alignment: .leading)
            }
            .frame(maxHeight: .infinity)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .foregroundStyle(p.fg)
        .containerBackground(p.bg, for: .widget)
    }
}

private struct DATTimesView: View {
    let entry: DATEntry
    let p: DATPalette

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            DATHeader(snapshot: entry.snapshot, palette: p, small: true)
            DATRule(color: p.divider.opacity(0.70))
            DATMetaRow(entry: entry, p: p)
            DATRule(color: p.divider.opacity(0.50))
            if entry.snapshot.prayers.isEmpty {
                Spacer(minLength: 0)
                HStack(spacing: 8) {
                    Image(systemName: "clock.badge.exclamationmark")
                        .foregroundStyle(p.accent)
                    Text("Gebetszeiten werden aus der App geladen")
                        .lineLimit(2)
                }
                .font(.system(size: 12, weight: .medium, design: .serif))
                .foregroundStyle(p.muted)
                .frame(maxWidth: .infinity, alignment: .center)
                Spacer(minLength: 0)
            } else {
                VStack(spacing: 0) {
                    ForEach(Array(entry.snapshot.prayers.prefix(6).enumerated()), id: \.offset) { index, prayer in
                        HStack(spacing: 7) {
                            Capsule()
                                .fill(prayer.name == DATClock.nextName(entry.snapshot, at: entry.date) ? p.accent : Color.clear)
                                .frame(width: 2, height: 10)
                            Text(prayer.name)
                                .lineLimit(1).minimumScaleFactor(0.88)
                            Spacer(minLength: 2)
                            Text(prayer.time)
                                .monospacedDigit().lineLimit(1)
                        }
                        .font(.system(size: 11.1, weight: .medium, design: .serif))
                        .foregroundStyle(prayer.name == DATClock.nextName(entry.snapshot, at: entry.date) ? p.accent : p.fg)
                        .frame(height: 14.3)
                        if index < min(entry.snapshot.prayers.count, 6) - 1 {
                            DATRule(color: p.divider.opacity(0.25))
                        }
                    }
                }
                .frame(maxHeight: .infinity, alignment: .top)
            }
        }
        .padding(.horizontal, 13)
        .padding(.vertical, 8)
        .foregroundStyle(p.fg)
        .containerBackground(p.bg, for: .widget)
    }
}

private struct DATOverviewHeader: View {
    let entry: DATEntry
    let p: DATPalette

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            HStack(alignment: .center, spacing: 9) {
                Image("BrandMark")
                    .resizable()
                    .interpolation(.high)
                    .datFullColorWidgetImage()
                    .scaledToFit()
                    .opacity(0.96)
                    .frame(width: 36, height: 36)
                    .accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 2) {
                    Text("DĀR AL TAWḤĪD")
                        .font(.system(size: 17, weight: .bold, design: .serif))
                        .lineLimit(1)
                        .minimumScaleFactor(0.78)
                    Text(entry.snapshot.place)
                        .font(.system(size: 14, weight: .medium, design: .serif))
                        .foregroundStyle(p.muted)
                        .lineLimit(1)
                        .minimumScaleFactor(0.78)
                }
            }
            Spacer(minLength: 4)
            VStack(alignment: .trailing, spacing: 2) {
                if let temperature = entry.snapshot.weatherTemperature {
                    HStack(spacing: 3) {
                        Image(systemName: DATWeatherSymbol.name(entry.snapshot.weatherSymbolName, timeZone: entry.snapshot.timeZone))
                        Text("\(temperature, specifier: "%.0f")°")
                            .monospacedDigit()
                            .foregroundStyle(p.calendarTint)
                    }
                    .foregroundStyle(p.weatherTint)
                }
                Text(entry.date, format: .dateTime.weekday(.wide).day().month(.wide))
                    .font(.system(size: 13.5, weight: .medium, design: .serif))
                    .foregroundStyle(p.muted)
                    .lineLimit(1)
                    .minimumScaleFactor(0.76)
            }
        }
        .foregroundStyle(p.fg)
    }
}

private struct DATOverviewView: View {
    let entry: DATEntry
    let p: DATPalette
    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            DATOverviewHeader(entry: entry, p: p)
            DATRule(color: p.divider)
            HStack(alignment: .top, spacing: 8) {
                VStack(alignment: .center, spacing: 1) {
                    Text("AKTUELLES GEBET")
                        .font(.system(size: 8, weight: .bold, design: .rounded))
                        .tracking(1.05)
                        .foregroundStyle(p.muted)
                        .lineLimit(1)
                        .minimumScaleFactor(0.75)
                    Text(DATClock.current(entry.snapshot, at: entry.date)?.name ?? "—")
                        .font(.system(size: 20, weight: .semibold, design: .serif))
                        .foregroundStyle(p.accent)
                        .lineLimit(1)
                        .minimumScaleFactor(0.75)
                    Text(DATClock.current(entry.snapshot, at: entry.date)?.time ?? "—")
                        .font(.system(size: 22, weight: .medium, design: .serif))
                        .monospacedDigit()
                }
                .frame(maxWidth: .infinity, alignment: .top)
                Rectangle()
                    .fill(p.divider)
                    .frame(width: 1, height: 55)
                VStack(alignment: .center, spacing: 1) {
                    Text("NÄCHSTES GEBET")
                        .font(.system(size: 8, weight: .bold, design: .rounded))
                        .tracking(1.05)
                        .foregroundStyle(p.muted)
                        .lineLimit(1)
                        .minimumScaleFactor(0.75)
                    Text(DATClock.nextName(entry.snapshot, at: entry.date))
                        .font(.system(size: 20, weight: .semibold, design: .serif))
                        .foregroundStyle(p.accent)
                        .lineLimit(1)
                        .minimumScaleFactor(0.75)
                    Text(DATClock.nextTime(entry.snapshot, at: entry.date))
                        .font(.system(size: 22, weight: .medium, design: .serif))
                        .monospacedDigit()
                        .foregroundStyle(p.fg)
                        .lineLimit(1)
                    DATCountdownCapsule(snapshot: entry.snapshot, date: entry.date, p: p, fontSize: 14)
                        .fixedSize(horizontal: true, vertical: true)
                }
                .frame(maxWidth: .infinity, alignment: .top)
            }
            .frame(maxWidth: .infinity, alignment: .top)
            .padding(.horizontal, 8)
            .padding(.vertical, 2)
            .background(p.accent.opacity(0.045), in: RoundedRectangle(cornerRadius: 17))
            .overlay(RoundedRectangle(cornerRadius: 17).stroke(p.divider, lineWidth: 0.8))
            DATRule(color: p.divider)
            Text("QURʾĀN · TAGESVERS")
                .font(.system(size: 10, weight: .bold, design: .rounded)).tracking(1.5)
                .foregroundStyle(p.accent)
            Text(entry.snapshot.ayahGerman.isEmpty ? "Öffne die App für den heutigen Vers." : entry.snapshot.ayahGerman)
                .font(.system(size: 18.5, weight: .medium, design: .serif))
                .lineLimit(5).lineSpacing(2).minimumScaleFactor(0.72)
                .layoutPriority(1)
            Text(entry.snapshot.ayahRef)
                .font(.system(size: 10.5, weight: .medium, design: .serif))
                .foregroundStyle(p.muted)
                .lineLimit(1)
            DATRule(color: p.divider)
            Text("TADABBUR ZUM VERS")
                .font(.system(size: 10, weight: .bold, design: .rounded)).tracking(1.5)
                .foregroundStyle(p.accent)
            Text(entry.snapshot.tadabburGerman.isEmpty ? "Öffne die App für den Tadabbur." : entry.snapshot.tadabburGerman)
                .font(.system(size: 15.8, weight: .medium, design: .serif))
                .lineLimit(5).lineSpacing(2).minimumScaleFactor(0.72)
                .layoutPriority(1)
            Spacer(minLength: 0)
        }
        .padding(14)
        .foregroundStyle(p.fg)
        .containerBackground(p.bg, for: .widget)
    }
}

// Ref 5: static north-relative qibla bearing; live heading belongs in the app.
private struct DATQiblaView: View {
    let entry: DATEntry
    let p: DATPalette
    @Environment(\.widgetFamily) private var family

    var body: some View {
        let degrees = entry.snapshot.qiblaDegrees.flatMap { value in
            value.isFinite && (0..<360).contains(value) ? value : nil
        }
        if family == .systemLarge || family == .systemExtraLarge {
            DATQiblaLargeView(entry: entry, p: p, degrees: degrees)
        } else {
        VStack(alignment: .leading, spacing: 4) {
            // The Qibla card shares the exact same header grid as the prayer card.
            DATHeader(
                snapshot: entry.snapshot,
                palette: p,
                small: true,
                subtitle: "Standort freigeben"
            )
            DATRule(color: p.divider.opacity(0.74))

            HStack(spacing: 5) {
                Text("LIVE · QIBLA")
                    .font(.system(size: 7.5, weight: .bold, design: .rounded))
                    .tracking(1.0)
                    .foregroundStyle(p.muted)
                Spacer(minLength: 0)
                HStack(spacing: 3) {
                    Text("ÖFFNEN")
                        .font(.system(size: 6.5, weight: .bold, design: .rounded))
                        .tracking(0.7)
                    Image(systemName: "arrow.up.right")
                        .font(.system(size: 7, weight: .bold))
                }
                .foregroundStyle(p.accent)
            }

            HStack(spacing: 7) {
                ZStack {
                    Circle()
                        .fill(p.bg.opacity(0.78))
                        .overlay(Circle().stroke(p.divider, lineWidth: 1.1))
                    Circle()
                        .stroke(p.divider.opacity(0.55), lineWidth: 0.7)
                        .padding(5)
                    Circle()
                        .stroke(p.divider.opacity(0.28), lineWidth: 0.6)
                        .padding(11)

                    Text("N")
                        .font(.system(size: 6.5, weight: .bold, design: .rounded))
                        .foregroundStyle(p.accent)
                        .offset(y: -16)
                    Text("E")
                        .font(.system(size: 6, weight: .semibold, design: .rounded))
                        .foregroundStyle(p.muted)
                        .offset(x: 16)
                    Text("S")
                        .font(.system(size: 6, weight: .semibold, design: .rounded))
                        .foregroundStyle(p.muted)
                        .offset(y: 16)
                    Text("W")
                        .font(.system(size: 6, weight: .semibold, design: .rounded))
                        .foregroundStyle(p.muted)
                        .offset(x: -16)

                    Image(systemName: "location.north.fill")
                        .font(.system(size: 20, weight: .bold))
                        .rotationEffect(.degrees(degrees ?? 0))
                        .foregroundStyle(p.accent)
                    Circle()
                        .fill(p.fg)
                        .frame(width: 4.5, height: 4.5)
                }
                .frame(width: 56, height: 56)

                VStack(alignment: .leading, spacing: 1) {
                    Text("QIBLA")
                        .font(.system(size: 8, weight: .bold, design: .rounded))
                        .tracking(1.0)
                        .foregroundStyle(p.muted)
                    Text(degrees.map { String(format: "%.0f°", $0) } ?? "—")
                        .font(.system(size: 23, weight: .semibold, design: .serif))
                        .monospacedDigit()
                        .foregroundStyle(p.accent)
                    Text("Makkah")
                        .font(.system(size: 12.5, weight: .semibold, design: .serif))
                        .foregroundStyle(p.fg)
                }
                .frame(width: 70, alignment: .leading)
                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
            .padding(.vertical, 1)

            Spacer(minLength: 0)

            HStack(spacing: 4) {
                Text("NÄCHSTES")
                    .font(.system(size: 6.5, weight: .bold, design: .rounded))
                    .tracking(0.65)
                    .foregroundStyle(p.muted)
                    .fixedSize(horizontal: true, vertical: false)
                Text(DATClock.nextName(entry.snapshot, at: entry.date))
                    .font(.system(size: 11, weight: .semibold, design: .serif))
                    .foregroundStyle(p.fg)
                    .lineLimit(1)
                    .minimumScaleFactor(0.72)
                    .fixedSize(horizontal: true, vertical: false)
                Text(DATClock.nextTime(entry.snapshot, at: entry.date))
                    .font(.system(size: 11.5, weight: .semibold, design: .rounded))
                    .monospacedDigit()
                    .foregroundStyle(p.accent)
                    .fixedSize(horizontal: true, vertical: false)
            }
            .fixedSize(horizontal: true, vertical: true)
            .padding(.horizontal, 6)
            .padding(.vertical, 3.5)
            .background(p.fg.opacity(0.14), in: Capsule())
            .overlay(Capsule().stroke(p.divider, lineWidth: 0.8))
            .frame(maxWidth: .infinity, alignment: .center)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 7)
        .foregroundStyle(p.fg)
        .containerBackground(p.bg, for: .widget)
        }
    }
}

private struct DATQiblaLargeView: View {
    let entry: DATEntry
    let p: DATPalette
    let degrees: Double?

    private var direction: String {
        guard let degrees else { return "—" }
        let names = ["N", "NO", "O", "SO", "S", "SW", "W", "NW"]
        let index = Int((degrees + 22.5) / 45.0) % names.count
        return names[index]
    }

    private var nextName: String {
        DATClock.nextName(entry.snapshot, at: entry.date)
    }

    private var currentName: String? {
        DATClock.current(entry.snapshot, at: entry.date)?.name
    }

    private var countdownProgress: Double {
        let events = DATClock.events(entry.snapshot, relativeTo: entry.date)
        guard let next = DATClock.next(entry.snapshot, at: entry.date),
              let start = events.last(where: { !$0.name.lowercased().contains("sunrise") && !$0.name.lowercased().contains("sonnenaufgang") && $0.when <= entry.date })?.when,
              next.when > start else { return 0 }
        return min(1, max(0, entry.date.timeIntervalSince(start) / next.when.timeIntervalSince(start)))
    }

    private var prayerRows: [[DATPrayer]] {
        let visible = Array(entry.snapshot.prayers.prefix(6))
        return [Array(visible.prefix(3)), Array(visible.dropFirst(3).prefix(3))]
    }

    @ViewBuilder
    private func prayerCell(_ prayer: DATPrayer, isLast: Bool) -> some View {
        let isNext = DATPrayerName.matches(prayer.name, nextName)
        let isCurrent = !isNext && currentName.map { DATPrayerName.matches(prayer.name, $0) } == true
        VStack(spacing: 2) {
            Text(DATPrayerName.display(prayer.name))
                .font(.system(size: 12, weight: isNext || isCurrent ? .bold : .semibold, design: .serif))
                .lineLimit(1)
                .minimumScaleFactor(0.62)
            Text(prayer.time)
                .font(.system(size: 15, weight: isNext || isCurrent ? .bold : .semibold, design: .rounded))
                .monospacedDigit()
        }
        .foregroundStyle(isNext ? p.calendarTint : p.fg)
        .frame(maxWidth: .infinity)
        .padding(.vertical, 5)
        .background(
            isNext ? p.calendarTint.opacity(0.18) : (isCurrent ? p.accent.opacity(0.16) : p.bg.opacity(0.18)),
            in: RoundedRectangle(cornerRadius: 8)
        )
        .overlay {
            if isNext {
                RoundedRectangle(cornerRadius: 8).stroke(p.calendarTint.opacity(0.72), lineWidth: 0.8)
            } else if isCurrent {
                RoundedRectangle(cornerRadius: 8).stroke(p.accent.opacity(0.38), lineWidth: 0.7)
            }
        }
        .overlay(alignment: .trailing) {
            if !isLast {
                Rectangle()
                    .fill(p.calendarTint.opacity(0.42))
                    .frame(width: 0.7, height: 26)
                    .offset(x: 3)
            }
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            HStack(alignment: .center, spacing: 8) {
                Image("BrandMark")
                    .resizable()
                    .interpolation(.high)
                    .datFullColorWidgetImage()
                    .scaledToFit()
                    .frame(width: 36, height: 36)
                    .accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 0) {
                    Text("DĀR AL TAWḤĪD")
                        .font(.system(size: 16.5, weight: .bold, design: .serif))
                        .lineLimit(1)
                        .minimumScaleFactor(0.72)
                    Text(entry.snapshot.place)
                        .font(.system(size: 11.5, weight: .medium, design: .rounded))
                        .foregroundStyle(p.muted)
                        .lineLimit(1)
                }
                Spacer(minLength: 4)
                VStack(alignment: .trailing, spacing: 2) {
                    if let temperature = entry.snapshot.weatherTemperature {
                        HStack(spacing: 3) {
                            Image(systemName: DATWeatherSymbol.name(entry.snapshot.weatherSymbolName, timeZone: entry.snapshot.timeZone))
                                .foregroundStyle(p.weatherTint)
                            Text("\(temperature, specifier: "%.0f")°")
                                .foregroundStyle(p.calendarTint)
                        }
                        .font(.system(size: 12, weight: .bold, design: .rounded))
                    }
                    Text(entry.date, format: .dateTime.weekday(.abbreviated).day().month(.abbreviated).locale(Locale(identifier: "de_DE")))
                        .font(.system(size: 10.5, weight: .semibold, design: .rounded))
                        .foregroundStyle(p.calendarTint)
                        .lineLimit(1)
                        .minimumScaleFactor(0.65)
                    HStack(spacing: 4) {
                        DATEmojiIcon(emoji: "🌙", size: 13)
                        Text(entry.snapshot.hijriLabel.isEmpty ? "Hijri-Datum folgt" : entry.snapshot.hijriLabel)
                    }
                    .font(.system(size: 10, weight: .medium, design: .rounded))
                    .foregroundStyle(p.hijriTint)
                }
            }
            .padding(.top, 2)
            HStack {
                if let qiblaURL = URL(string: "daraltawhid://qibla") {
                    Link(destination: qiblaURL) {
                        Text("LIVE-QIBLA ↗")
                            .font(.system(size: 9, weight: .bold, design: .rounded))
                            .tracking(0.9)
                            .foregroundStyle(p.accent)
                    }
                }
                Spacer(minLength: 4)
            }
            DATRule(color: p.divider.opacity(0.75))

            HStack(spacing: 16) {
                ZStack {
                    Circle()
                        .fill(p.bg.opacity(0.8))
                        .overlay(Circle().stroke(p.divider, lineWidth: 1.3))
                    Circle().stroke(p.divider.opacity(0.55), lineWidth: 0.8).padding(9)
                    Circle().stroke(p.divider.opacity(0.3), lineWidth: 0.7).padding(20)
                    Text("N").font(.system(size: 9, weight: .bold)).foregroundStyle(p.accent).offset(y: -29)
                    Text("E").font(.system(size: 8, weight: .semibold)).foregroundStyle(p.muted).offset(x: 29)
                    Text("S").font(.system(size: 8, weight: .semibold)).foregroundStyle(p.muted).offset(y: 29)
                    Text("W").font(.system(size: 8, weight: .semibold)).foregroundStyle(p.muted).offset(x: -29)
                    Image(systemName: "location.north.fill")
                        .font(.system(size: 37, weight: .bold))
                        .rotationEffect(.degrees(degrees ?? 0))
                        .foregroundStyle(p.accent)
                    Circle().fill(p.fg).frame(width: 7, height: 7)
                }
                .frame(width: 112, height: 112)

                VStack(alignment: .leading, spacing: 2) {
                    Text("RICHTUNG ZUR KAʿBAH")
                        .font(.system(size: 10, weight: .bold, design: .rounded))
                        .tracking(1.0)
                        .foregroundStyle(p.muted)
                    Text(degrees.map { String(format: "%.0f°", $0) } ?? "—")
                        .font(.system(size: 36, weight: .semibold, design: .serif))
                        .monospacedDigit()
                        .foregroundStyle(p.accent)
                    Text("\(direction) · Makkah")
                        .font(.system(size: 17, weight: .semibold, design: .serif))
                        .foregroundStyle(p.fg)
                    Text(entry.snapshot.place)
                        .font(.system(size: 13, weight: .medium, design: .rounded))
                        .foregroundStyle(p.fg)
                        .lineLimit(1)
                        .padding(.horizontal, 7)
                        .padding(.vertical, 3)
                        .background(p.accent.opacity(0.12), in: Capsule())
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .frame(maxWidth: .infinity)

            DATRule(color: p.divider.opacity(0.75))
            VStack(spacing: 4) {
                ForEach(Array(prayerRows.enumerated()), id: \.offset) { _, row in
                    HStack(spacing: 4) {
                        ForEach(Array(row.enumerated()), id: \.offset) { index, prayer in
                            prayerCell(prayer, isLast: index == row.count - 1)
                        }
                    }
                }
            }

            DATRule(color: p.divider.opacity(0.75))
            VStack(alignment: .leading, spacing: 3) {
                HStack(alignment: .lastTextBaseline, spacing: 8) {
                    VStack(alignment: .leading, spacing: 0) {
                        Text("NÄCHSTES GEBET")
                            .font(.system(size: 8.5, weight: .bold, design: .rounded))
                            .tracking(0.8)
                            .foregroundStyle(p.muted)
                        Text(DATPrayerName.display(DATClock.nextName(entry.snapshot, at: entry.date)))
                            .font(.system(size: 20, weight: .semibold, design: .serif))
                            .foregroundStyle(p.accent)
                            .lineLimit(1)
                    }
                    Spacer(minLength: 3)
                    HStack(alignment: .lastTextBaseline, spacing: 7) {
                        Text(DATClock.nextTime(entry.snapshot, at: entry.date))
                            .font(.system(size: 23, weight: .bold, design: .rounded))
                            .monospacedDigit()
                            .foregroundStyle(p.calendarTint)
                        DATMinuteCountdown(snapshot: entry.snapshot, date: entry.date, fontSize: 11)
                            .foregroundStyle(p.calendarTint)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 3)
                            .background(p.calendarTint.opacity(0.11), in: Capsule())
                            .overlay(Capsule().stroke(p.calendarTint.opacity(0.48), lineWidth: 0.7))
                    }
                }
                GeometryReader { proxy in
                    ZStack(alignment: .leading) {
                        Rectangle().fill(p.calendarTint.opacity(0.28)).frame(height: 0.8)
                        Rectangle()
                            .fill(LinearGradient(colors: [p.calendarTint.opacity(0.35), p.calendarTint, p.calendarTint.opacity(0.72)], startPoint: .leading, endPoint: .trailing))
                            .frame(width: proxy.size.width * countdownProgress, height: 1.4)
                        Circle().fill(p.calendarTint).frame(width: 4, height: 4).offset(x: max(0, proxy.size.width * countdownProgress - 2))
                    }
                }
                .frame(height: 5)
            }
            .padding(.top, 1)

        }
        .padding(14)
        .foregroundStyle(p.fg)
        .containerBackground(p.bg, for: .widget)
        .widgetURL(URL(string: "daraltawhid://qibla"))
    }
}

// Refs 6–8: distinct type scale/flow for each dua family.
private struct DATDuaView: View {
    let entry: DATEntry
    let p: DATPalette
    let family: WidgetFamily

    private var small: Bool { family == .systemSmall }
    private var medium: Bool { family == .systemMedium }
    private var large: Bool { family == .systemLarge }
    private var heading: String {
        entry.snapshot.duaTitle.isEmpty ? "Duʿāʾ des Tages" : entry.snapshot.duaTitle
    }
    private var content: String {
        entry.snapshot.duaGerman.isEmpty ? "Das heutige Bittgebet wird aus der App geladen." : entry.snapshot.duaGerman
    }
    private var sourceLabel: String {
        let source = entry.snapshot.duaSource.trimmingCharacters(in: .whitespacesAndNewlines)
        let fallback = entry.snapshot.duaCategory.trimmingCharacters(in: .whitespacesAndNewlines)
        let value = source.isEmpty ? fallback : source
        guard !value.isEmpty else { return "Quelle: Überliefertes Bittgebet" }
        return value.localizedCaseInsensitiveContains("quelle") ? value : "Quelle: \(value)"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: small ? 7 : (medium ? 6 : 12)) {
            DATHeader(
                snapshot: entry.snapshot,
                palette: p,
                small: small,
                medium: medium,
                subtitle: "Duʿāʾ",
                showDateStack: !small
            )
            if !small {
                DATRule(color: p.divider.opacity(0.72))
            }
            if !small {
                HStack(spacing: 6) {
                    Capsule().fill(p.accent).frame(width: 13, height: 2)
                    Text("BITTGEBET")
                        .font(.system(size: 9.2, weight: .bold, design: .rounded))
                        .tracking(1.15)
                        .foregroundStyle(p.muted)
                }
            }
            Text(heading)
                .font(.system(size: small ? 15.4 : (large ? 17.8 : (medium ? 16.5 : 18)), weight: .bold, design: .serif))
                .foregroundStyle(p.accent)
                .lineLimit(small ? 2 : 2)
                .minimumScaleFactor(0.72)
            if !small {
                DATRule(color: p.divider.opacity(0.52))
            }
            Text(content)
                .font(.system(size: small ? 12.2 : (large ? 14.2 : (medium ? 13.2 : 14.2)), weight: .regular, design: .serif))
                .foregroundStyle(p.fg)
                .lineLimit(nil)
                .lineSpacing(large ? 2 : (medium ? 1 : 2))
                .minimumScaleFactor(0.62)
                .allowsTightening(true)
                .frame(maxWidth: .infinity, alignment: .leading)
            Spacer(minLength: 0)
            if large {
                DATRule(color: p.divider.opacity(0.58))
            }
            HStack(spacing: 5) {
                Image(systemName: "book.closed")
                Text(sourceLabel)
                    .lineLimit(1)
                    .minimumScaleFactor(0.72)
            }
            .font(.system(size: small ? 9 : (large ? 10.5 : (medium ? 10 : 9.8)), weight: .medium, design: .serif))
            .foregroundStyle(p.muted)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, small ? 12 : (large ? 18 : (medium ? 14 : 16)))
        .padding(.vertical, small ? 11 : (large ? 18 : (medium ? 10 : 13)))
        .foregroundStyle(p.fg)
        .containerBackground(p.bg, for: .widget)
    }
}

private struct DATAyahView: View {
    let entry: DATEntry
    let p: DATPalette
    let family: WidgetFamily
    private var small: Bool { family == .systemSmall }
    private var large: Bool { family == .systemLarge }
    private var verse: String {
        entry.snapshot.ayahGerman.isEmpty ? "Der heutige Qurʾān-Vers wird aus der App geladen." : entry.snapshot.ayahGerman
    }

    var body: some View {
        VStack(alignment: .leading, spacing: small ? 8 : 12) {
            DATHeader(snapshot: entry.snapshot, palette: p, small: small, subtitle: "Āya des Tages")
            DATRule(color: p.divider)
            if !small {
                DATBottomDetails(entry: entry, p: p)
                DATRule(color: p.divider.opacity(0.45))
            }
            if !small {
                HStack(spacing: 6) {
                    Capsule().fill(p.accent).frame(width: 13, height: 2)
                    Text("QURʾĀN · TAGESVERS")
                        .font(.system(size: 9.2, weight: .bold, design: .rounded))
                        .tracking(1.1)
                        .foregroundStyle(p.accent)
                }
            }
            Text(small ? DATWidgetText.short(verse, max: 130) : verse)
                .font(.system(size: small ? 16 : 22, weight: .medium, design: .serif))
                .foregroundStyle(p.fg)
                .lineLimit(small ? 5 : 7)
                .lineSpacing(small ? 1 : 4)
                .minimumScaleFactor(0.82)
            if !small && !entry.snapshot.tadabburGerman.isEmpty {
                DATRule(color: p.divider.opacity(0.65))
                Text("GEDANKE ZUM VERS")
                    .font(.system(size: 9.2, weight: .bold, design: .rounded))
                    .tracking(1.2)
                    .foregroundStyle(p.muted)
                Text(entry.snapshot.tadabburGerman)
                    .font(.system(size: 14.2, weight: .medium, design: .serif))
                    .lineSpacing(2)
                    .lineLimit(3)
                    .minimumScaleFactor(0.75)
            }
            Spacer(minLength: 0)
            if !small {
                DATRule(color: p.divider.opacity(0.58))
            }
            if !entry.snapshot.ayahRef.isEmpty {
                Text(entry.snapshot.ayahRef)
                    .font(.system(size: small ? 10.3 : 12, weight: .medium, design: .serif))
                    .foregroundStyle(p.muted)
                    .lineLimit(2)
            }
        }
        .padding(.horizontal, small ? 12 : (large ? 18 : 16))
        .padding(.vertical, small ? 11 : (large ? 18 : 13))
        .foregroundStyle(p.fg)
        .containerBackground(p.bg, for: .widget)
    }
}

private struct DATPrayerHost: View {
    let entry: DATEntry
    @Environment(\.widgetFamily) private var family
    @Environment(\.colorScheme) private var scheme
    var body: some View {
        let p = DATPalette(entry.snapshot, scheme: scheme, look: entry.look)
        if family == .systemSmall {
            DATSmallPrayerView(entry: entry, p: p)
        } else {
            DATMediumPrayerView(entry: entry, p: p)
        }
    }
}

private struct DATPrayerFeatureView: View {
    let entry: DATEntry
    let p: DATPalette
    let title: String
    let emoji: String
    let value: String
    let tint: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            DATHeader(snapshot: entry.snapshot, palette: p, small: true)
            DATRule(color: p.divider.opacity(0.74))

            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 5) {
                    HStack(spacing: 5) {
                        DATEmojiIcon(emoji: emoji, size: 16)
                        Text(title)
                            .font(.system(size: 9, weight: .bold, design: .rounded))
                            .tracking(0.7)
                            .foregroundStyle(p.muted)
                    }
                    Text(value)
                        .font(.system(size: 21, weight: .semibold, design: .rounded))
                        .foregroundStyle(tint)
                        .lineLimit(1)
                        .minimumScaleFactor(0.72)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                Rectangle()
                    .fill(p.divider.opacity(0.7))
                    .frame(width: 1, height: 58)

                VStack(alignment: .leading, spacing: 4) {
                    Text("NÄCHSTES GEBET")
                        .font(.system(size: 9, weight: .bold, design: .rounded))
                        .tracking(0.7)
                        .foregroundStyle(p.muted)
                    Text(DATClock.nextName(entry.snapshot, at: entry.date))
                        .font(.system(size: 18, weight: .semibold, design: .serif))
                        .foregroundStyle(p.accent)
                        .lineLimit(1)
                    Text(DATClock.nextTime(entry.snapshot, at: entry.date))
                        .font(.system(size: 19, weight: .bold, design: .rounded))
                        .monospacedDigit()
                        .foregroundStyle(p.fg)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .frame(maxHeight: .infinity, alignment: .center)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .foregroundStyle(p.fg)
        .containerBackground(p.bg, for: .widget)
    }
}

private struct DATTimesHost: View {
    let entry: DATEntry
    @Environment(\.colorScheme) private var scheme
    var body: some View { DATTimesView(entry: entry, p: DATPalette(entry.snapshot, scheme: scheme, look: entry.look)) }
}

private struct DATOverviewHost: View {
    let entry: DATEntry
    @Environment(\.colorScheme) private var scheme
    var body: some View { DATOverviewRuntimeView(entry: entry, p: DATPalette(entry.snapshot, scheme: scheme, look: entry.look)) }
}

// Runtime-safe overview host. The gallery and Home Screen can render this view
// without depending on the more complex preview-only layout tree.
private struct DATOverviewRuntimeView: View {
    let entry: DATEntry
    let p: DATPalette

    private var current: (name: String, time: String)? {
        DATClock.current(entry.snapshot, at: entry.date)
    }

    private var next: (name: String, time: String, when: Date)? {
        DATClock.next(entry.snapshot, at: entry.date)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            DATOverviewHeader(entry: entry, p: p)
            DATRule(color: p.divider)

            HStack(alignment: .top, spacing: 22) {
                VStack(alignment: .center, spacing: 1) {
                    Text("AKTUELLES GEBET")
                        .font(.system(size: 8, weight: .bold, design: .rounded))
                        .tracking(1)
                        .foregroundStyle(p.muted)
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                    Text(current?.name ?? "—")
                        .font(.system(size: 19, weight: .semibold, design: .serif))
                        .foregroundStyle(p.accent)
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                    Text(current?.time ?? "—")
                        .font(.system(size: 22, weight: .medium, design: .rounded))
                        .monospacedDigit()
                        .lineLimit(1)
                }
                .frame(maxWidth: .infinity, alignment: .top)

                VStack(alignment: .center, spacing: 1) {
                    Text("NÄCHSTES GEBET")
                        .font(.system(size: 8, weight: .bold, design: .rounded))
                        .tracking(1)
                        .foregroundStyle(p.muted)
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                    Text(next?.name ?? entry.snapshot.nextPrayerName)
                        .font(.system(size: 19, weight: .semibold, design: .serif))
                        .foregroundStyle(p.accent)
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                    HStack(alignment: .firstTextBaseline, spacing: 8) {
                        Text(next?.time ?? entry.snapshot.nextPrayerTime)
                            .font(.system(size: 22, weight: .medium, design: .rounded))
                            .monospacedDigit()
                            .lineLimit(1)
                        if next != nil {
                            DATCountdownCapsule(snapshot: entry.snapshot, date: entry.date, p: p, fontSize: 11)
                                .fixedSize(horizontal: true, vertical: true)
                        }
                    }
                    .fixedSize(horizontal: true, vertical: false)
                }
                .frame(maxWidth: .infinity, alignment: .top)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 7)
            .background(p.accent.opacity(0.045), in: RoundedRectangle(cornerRadius: 18))
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(p.divider, lineWidth: 0.8))

            DATRule(color: p.divider)
            Text("QURʾĀN · TAGESVERS")
                .font(.system(size: 10, weight: .bold, design: .rounded))
                .tracking(1.4)
                .foregroundStyle(p.accent)
            Text(entry.snapshot.ayahGerman.isEmpty ? "Öffne die App für den heutigen Vers." : entry.snapshot.ayahGerman)
                .font(.system(size: 17.5, weight: .medium, design: .serif))
                .lineLimit(3)
                .lineSpacing(2)
                .minimumScaleFactor(0.75)
            Text(entry.snapshot.ayahRef.isEmpty ? "" : entry.snapshot.ayahRef)
                .font(.system(size: 10, weight: .medium, design: .serif))
                .foregroundStyle(p.muted)
                .lineLimit(1)

            DATRule(color: p.divider)
            Text("TADABBUR ZUM VERS")
                .font(.system(size: 10, weight: .bold, design: .rounded))
                .tracking(1.4)
                .foregroundStyle(p.accent)
            Text(entry.snapshot.tadabburGerman.isEmpty ? "Öffne die App für den Tadabbur." : entry.snapshot.tadabburGerman)
                .font(.system(size: 15, weight: .medium, design: .serif))
                .lineLimit(3)
                .lineSpacing(2)
                .minimumScaleFactor(0.75)
            Spacer(minLength: 0)
        }
        .padding(14)
        .foregroundStyle(p.fg)
        .containerBackground(p.bg, for: .widget)
    }
}

private struct DATQiblaHost: View {
    let entry: DATEntry
    @Environment(\.colorScheme) private var scheme
    var body: some View {
        DATQiblaView(entry: entry, p: DATPalette(entry.snapshot, scheme: scheme, look: entry.look))
            .widgetURL(URL(string: "daraltawhid://qibla"))
    }
}

private struct DATDuaHost: View {
    let entry: DATEntry
    @Environment(\.widgetFamily) private var family
    @Environment(\.colorScheme) private var scheme
    var body: some View { DATDuaView(entry: entry, p: DATPalette(entry.snapshot, scheme: scheme, look: entry.look), family: family) }
}

private struct DATAyahHost: View {
    let entry: DATEntry
    @Environment(\.widgetFamily) private var family
    @Environment(\.colorScheme) private var scheme
    var body: some View { DATAyahView(entry: entry, p: DATPalette(entry.snapshot, scheme: scheme, look: entry.look), family: family) }
}

struct DATPrayerWidget: Widget {
    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: "dat.premium.prayer", intent: DATPremiumIntent.self, provider: DATProvider()) { entry in
            DATPrayerHost(entry: entry)
        }
        .configurationDisplayName("DĀR AL TAWḤĪD · Royal Prayer")
        .description("Gebetszeiten, nächstes Gebet und Countdown")
        .contentMarginsDisabled()
        .containerBackgroundRemovable()
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
struct DATPrayerTimesWidget: Widget {
    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: "dat.premium.times", intent: DATPremiumIntent.self, provider: DATProvider()) { entry in
            DATTimesHost(entry: entry)
        }
        .configurationDisplayName("DĀR AL TAWḤĪD · Royal Prayer · Zeiten")
        .description("Alle fünf Gebetszeiten auf einen Blick")
        .contentMarginsDisabled()
        .containerBackgroundRemovable()
        .supportedFamilies([.systemMedium])
    }
}
struct DATOverviewWidget: Widget {
    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: "dat.premium.overview", intent: DATPremiumIntent.self, provider: DATProvider()) { entry in
            DATOverviewHost(entry: entry)
        }
        .configurationDisplayName("DĀR AL TAWḤĪD · Royal Dashboard")
        .description("Gebete, Qurʾān und Tadabbur")
        .contentMarginsDisabled()
        .containerBackgroundRemovable()
        .supportedFamilies([.systemLarge, .systemExtraLarge])
    }
}
struct DATQiblaWidget: Widget {
    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: "dat.premium.qibla", intent: DATPremiumIntent.self, provider: DATProvider()) { entry in
            DATQiblaHost(entry: entry)
        }
        .configurationDisplayName("DĀR AL TAWḤĪD · Qibla")
        .description("Qibla-Richtung aus gespeicherten Standortdaten")
        .contentMarginsDisabled()
        .containerBackgroundRemovable()
        .supportedFamilies([.systemSmall, .systemLarge, .systemExtraLarge])
    }
}
struct DATDuaWidget: Widget {
    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: "dat.premium.dua", intent: DATPremiumIntent.self, provider: DATProvider()) { entry in
            DATDuaHost(entry: entry)
        }
        .configurationDisplayName("DĀR AL TAWḤĪD · Royal Duʿāʾ")
        .description("Authentisches Bittgebet mit Quelle")
        .contentMarginsDisabled()
        .containerBackgroundRemovable()
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .systemExtraLarge])
    }
}
struct DATAyahWidget: Widget {
    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: "dat.premium.ayah", intent: DATPremiumIntent.self, provider: DATProvider()) { entry in
            DATAyahHost(entry: entry)
        }
        .configurationDisplayName("DĀR AL TAWḤĪD · Royal Qurʾān & Tadabbur")
        .description("Qurʾān-Vers, Übersetzung und Quellenangabe")
        .contentMarginsDisabled()
        .containerBackgroundRemovable()
        .supportedFamilies([.systemLarge, .systemExtraLarge])
    }
}

enum DATClockStyle: String, AppEnum {
    case digital
    case analog

    static var typeDisplayRepresentation = TypeDisplayRepresentation(name: "Uhrendesign")
    static var caseDisplayRepresentations: [DATClockStyle: DisplayRepresentation] = [
        .digital: "Digital",
        .analog: "Analog"
    ]
}

struct DATClockIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "Royal Clock"
    @Parameter(title: "Uhrendesign", default: .digital) var style: DATClockStyle
}

private struct DATClockEntry: TimelineEntry {
    let date: Date
    let snapshot: DATSnapshot
    let style: DATClockStyle
}

private struct DATClockProvider: AppIntentTimelineProvider {
    typealias Entry = DATClockEntry
    typealias Intent = DATClockIntent

    func placeholder(in context: Context) -> DATClockEntry {
        DATClockEntry(date: .now, snapshot: .preview, style: .digital)
    }

    func snapshot(for configuration: DATClockIntent, in context: Context) async -> DATClockEntry {
        DATClockEntry(date: .now, snapshot: DATProvider().load(), style: configuration.style)
    }

    func timeline(for configuration: DATClockIntent, in context: Context) async -> Timeline<DATClockEntry> {
        let now = Date()
        let snapshot = DATProvider().load()
        return Timeline(
            entries: [DATClockEntry(date: now, snapshot: snapshot.ready ? snapshot : .preview, style: configuration.style)],
            policy: .after(now.addingTimeInterval(900))
        )
    }
}

private struct DATRoyalClockView: View {
    let entry: DATClockEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            Text(entry.date, format: .dateTime.weekday(.wide).day().month(.wide))
                .font(.system(size: 10, weight: .medium, design: .rounded))
                .foregroundStyle(DATClassicPalette.muted)
                .lineLimit(1)
                .minimumScaleFactor(0.7)

            if entry.style == .analog {
                DATRoyalAnalogClock(date: entry.date)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                Text(entry.date, style: .time)
                    .font(.system(size: family == .systemMedium ? 42 : 34, weight: .semibold, design: .rounded))
                    .monospacedDigit()
                    .foregroundStyle(DATClassicPalette.cream)
                    .minimumScaleFactor(0.65)
                    .frame(maxWidth: .infinity, alignment: .center)
            }

            HStack(spacing: 5) {
                Text("NÄCHSTES GEBET")
                    .font(.system(size: 8, weight: .bold, design: .rounded))
                    .tracking(0.7)
                    .foregroundStyle(DATClassicPalette.muted)
                Spacer(minLength: 2)
                Text(entry.snapshot.nextPrayerName.isEmpty ? "—" : entry.snapshot.nextPrayerName)
                    .foregroundStyle(DATClassicPalette.gold)
                Text(entry.snapshot.nextPrayerTime.isEmpty ? "—" : entry.snapshot.nextPrayerTime)
                    .monospacedDigit()
            }
            .font(.system(size: 10, weight: .medium, design: .rounded))
            .lineLimit(1)
            .minimumScaleFactor(0.65)
        }
        .padding(12)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .containerBackground(for: .widget) {
            DATClassicBackground()
        }
        .widgetURL(URL(string: "daraltawhid://prayer"))
    }
}

private struct DATRoyalAnalogClock: View {
    let date: Date

    var body: some View {
        GeometryReader { proxy in
            let size = min(proxy.size.width, proxy.size.height)
            ZStack {
                Circle()
                    .fill(DATClassicPalette.ink.opacity(0.78))
                    .overlay(Circle().stroke(DATClassicPalette.gold.opacity(0.7), lineWidth: 1))
                ForEach(0..<12, id: \.self) { tick in
                    Capsule()
                        .fill(DATClassicPalette.muted)
                        .frame(width: tick.isMultiple(of: 3) ? 2 : 1, height: tick.isMultiple(of: 3) ? 8 : 5)
                        .offset(y: -size * 0.39)
                        .rotationEffect(.degrees(Double(tick) * 30))
                }
                DATRoyalClockHand(angle: handAngle(component: .hour), length: size * 0.25, width: 3)
                DATRoyalClockHand(angle: handAngle(component: .minute), length: size * 0.34, width: 2)
                Circle()
                    .fill(DATClassicPalette.gold)
                    .frame(width: 6, height: 6)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .aspectRatio(1, contentMode: .fit)
    }

    private func handAngle(component: Calendar.Component) -> Angle {
        let calendar = Calendar.current
        let value = Double(calendar.component(component, from: date))
        if component == .hour {
            return .degrees((value.truncatingRemainder(dividingBy: 12)) * 30)
        }
        return .degrees(value * 6)
    }
}

private struct DATRoyalClockHand: View {
    let angle: Angle
    let length: CGFloat
    let width: CGFloat

    var body: some View {
        Capsule()
            .fill(DATClassicPalette.gold)
            .frame(width: width, height: length)
            .offset(y: -length / 2)
            .rotationEffect(angle)
    }
}

private struct DATRoyalCalendarView: View {
    let entry: DATEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            Text("KALENDER")
                .font(.system(size: 9, weight: .bold, design: .rounded))
                .tracking(1)
                .foregroundStyle(DATClassicPalette.muted)
            Text(entry.date, format: .dateTime.weekday(.wide))
                .font(.system(size: 20, weight: .semibold, design: .serif))
                .foregroundStyle(DATClassicPalette.cream)
            Text(entry.date, format: .dateTime.day().month(.wide).year())
                .font(.system(size: 16, weight: .medium, design: .rounded))
                .foregroundStyle(DATClassicPalette.gold)
            if !entry.snapshot.hijriLabel.isEmpty {
                Rectangle()
                    .fill(DATClassicPalette.line)
                    .frame(height: 0.7)
                Text(entry.snapshot.hijriLabel)
                    .font(.system(size: 12, weight: .medium, design: .serif))
                    .foregroundStyle(DATClassicPalette.muted)
                    .lineLimit(2)
            }
            Spacer(minLength: 0)
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .containerBackground(for: .widget) {
            DATClassicBackground()
        }
        .widgetURL(URL(string: "daraltawhid://calendar"))
    }
}

private struct DATRoyalWeatherView: View {
    let entry: DATEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            HStack {
                Text("WETTER")
                    .font(.system(size: 9, weight: .bold, design: .rounded))
                    .tracking(1)
                    .foregroundStyle(DATClassicPalette.muted)
                Spacer(minLength: 4)
                Image(systemName: DATWeatherSymbol.name(entry.snapshot.weatherSymbolName, timeZone: entry.snapshot.timeZone))
                    .foregroundStyle(DATClassicPalette.weather)
            }
            Text(entry.snapshot.weatherTemperature.map { String(format: "%.0f°", $0) } ?? "—")
                .font(.system(size: 34, weight: .semibold, design: .rounded))
                .monospacedDigit()
                .foregroundStyle(DATClassicPalette.cream)
            Text(entry.snapshot.weatherCondition.isEmpty ? "Wetterdaten folgen" : entry.snapshot.weatherCondition)
                .font(.system(size: 13, weight: .medium, design: .serif))
                .foregroundStyle(DATClassicPalette.muted)
                .lineLimit(1)
            Spacer(minLength: 0)
            Text(entry.snapshot.place)
                .font(.system(size: 11, weight: .medium, design: .rounded))
                .foregroundStyle(DATClassicPalette.gold)
                .lineLimit(1)
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .containerBackground(for: .widget) {
            DATClassicBackground()
        }
        .widgetURL(URL(string: "daraltawhid://weather"))
    }
}

struct DATRoyalClockWidget: Widget {
    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: "dat.royal.clock", intent: DATClockIntent.self, provider: DATClockProvider()) { entry in
            DATRoyalClockView(entry: entry)
        }
        .configurationDisplayName("DĀR AL TAWḤĪD · Royal Clock")
        .description("Digitale oder analoge Uhr mit nächstem Gebet")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .systemExtraLarge])
        .contentMarginsDisabled()
        .containerBackgroundRemovable()
    }
}

struct DATRoyalCalendarWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "dat.royal.calendar", provider: DATStaticProvider()) { entry in
            DATRoyalCalendarView(entry: entry)
        }
        .configurationDisplayName("DĀR AL TAWḤĪD · Royal Calendar")
        .description("Gregorianisches und Hiǧrī-Datum")
        .supportedFamilies([.systemSmall, .systemLarge, .systemExtraLarge])
        .contentMarginsDisabled()
        .containerBackgroundRemovable()
    }
}

struct DATRoyalWeatherWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "dat.royal.weather", provider: DATStaticProvider()) { entry in
            DATRoyalWeatherView(entry: entry)
        }
        .configurationDisplayName("DĀR AL TAWḤĪD · Royal Weather")
        .description("Temperatur, Wetterzustand und Standort")
        .supportedFamilies([.systemSmall, .systemLarge, .systemExtraLarge])
        .contentMarginsDisabled()
        .containerBackgroundRemovable()
    }
}

@main
struct DATPremiumWidgetBundle: WidgetBundle {
    var body: some Widget {
        DATPrayerWidget()
        DATPrayerTimesWidget()
        DATOverviewWidget()
        DATQiblaWidget()
        DATDuaWidget()
        DATAyahWidget()
        DATRoyalQuranWidget()
        DATClassicPrayerWidget()
    }
}

struct DATRoyalQuranWidget: Widget {
    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: "dat.royal.quran-player", intent: DATPremiumIntent.self, provider: DATProvider()) { entry in
            DATRoyalQuranWidgetView(entry: entry)
        }
        .configurationDisplayName("DĀR AL TAWḤĪD · Royal Qurʾān Player")
        .description("Sūrah, Rezitator und schneller Zugang zur Night-Player-Ansicht")
        .supportedFamilies([.systemSmall, .systemExtraLarge])
        .contentMarginsDisabled()
        .containerBackgroundRemovable()
    }
}

private struct DATRoyalQuranWidgetView: View {
    let entry: DATEntry

    var body: some View {
        let palette = DATPalette(entry.snapshot, scheme: .dark, look: .royalNachtblau)
        VStack(alignment: .leading, spacing: 7) {
            HStack {
                Image(systemName: "book.closed.fill")
                    .foregroundStyle(palette.accent)
                Text("QURʾĀN PLAYER")
                    .font(.system(size: 9, weight: .bold, design: .rounded))
                    .tracking(1)
                    .foregroundStyle(palette.muted)
                Spacer()
                if let playerURL = URL(string: "daraltawhid://quran") {
                    Link(destination: playerURL) {
                        Image(systemName: "play.fill")
                            .font(.system(size: 9, weight: .semibold))
                            .foregroundStyle(palette.accent)
                    }
                }
            }

            Text(entry.snapshot.ayahRef.isEmpty ? "Royal Night Player" : entry.snapshot.ayahRef)
                .font(.system(size: 20, weight: .semibold, design: .serif))
                .foregroundStyle(palette.fg)
                .lineLimit(1)
                .minimumScaleFactor(0.7)

            Text(entry.snapshot.ayahGerman.isEmpty ? "Qurʾān-Rezitation" : entry.snapshot.ayahGerman)
                .font(.system(size: 11, weight: .regular, design: .serif))
                .foregroundStyle(palette.fg.opacity(0.78))
                .lineLimit(3)

            Spacer(minLength: 0)
            Rectangle()
                .fill(palette.divider)
                .frame(height: 0.7)
            Text("Tippen für den Night Player")
                .font(.system(size: 9, weight: .medium, design: .rounded))
                .foregroundStyle(palette.accent)
                .lineLimit(1)
        }
        .padding(14)
        .containerBackground(palette.bg, for: .widget)
        .widgetURL(URL(string: "daraltawhid://quran"))
    }
}

// MARK: - DĀR AL TAWḤĪD · Klassisch

private enum DATClassicPalette {
    static let ink = Color(red: 0.055, green: 0.047, blue: 0.040)
    static let cream = Color(red: 0.97, green: 0.93, blue: 0.83)
    static let gold = Color(red: 0.80, green: 0.68, blue: 0.43)
    static let muted = Color(red: 0.76, green: 0.71, blue: 0.61)
    static let sunrise = Color(red: 0.93, green: 0.72, blue: 0.34)
    static let weather = Color(red: 0.52, green: 0.78, blue: 0.88)
    static let line = Color(red: 0.80, green: 0.68, blue: 0.43).opacity(0.32)
}

private struct DATClassicBackground: View {
    var body: some View {
        GeometryReader { proxy in
            ZStack {
                DATClassicPalette.ink
                Image("ClassicBooks")
                    .resizable()
                    .scaledToFill()
                    .frame(width: proxy.size.width, height: proxy.size.height)
                    .clipped()
                    .opacity(0.38)
                LinearGradient(
                    colors: [
                        DATClassicPalette.ink.opacity(0.94),
                        DATClassicPalette.ink.opacity(0.82),
                        DATClassicPalette.ink.opacity(0.58)
                    ],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            }
            .frame(width: proxy.size.width, height: proxy.size.height)
            .clipped()
        }
    }
}

private struct DATClassicBrand: View {
    let compact: Bool
    var large: Bool = false

    var body: some View {
        HStack(spacing: compact ? 6 : 9) {
            Image("BrandMark")
                .resizable()
                .interpolation(.high)
                .datFullColorWidgetImage()
                .scaledToFit()
                .opacity(0.96)
                .frame(width: compact ? 24 : (large ? 30 : 38), height: compact ? 24 : (large ? 30 : 38))
                .accessibilityHidden(true)
            Text("DĀR AL TAWḤĪD")
                .font(.system(size: compact ? 9 : (large ? 13 : 14.5), weight: .semibold, design: .serif))
                .tracking(compact ? 0 : 0.25)
                .lineLimit(1)
                .minimumScaleFactor(0.72)
                .foregroundStyle(DATClassicPalette.cream)
            Spacer(minLength: 0)
        }
    }
}

private struct DATClassicMeta: View {
    let snapshot: DATSnapshot

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: "mappin.and.ellipse")
            Text(snapshot.place)
                .lineLimit(1)
                .minimumScaleFactor(0.72)
            Spacer(minLength: 3)
            if let temperature = snapshot.weatherTemperature {
                Image(systemName: DATWeatherSymbol.name(snapshot.weatherSymbolName, timeZone: snapshot.timeZone))
                    .foregroundStyle(DATClassicPalette.weather)
                Text("\(temperature, specifier: "%.0f")°")
                    .monospacedDigit()
                    .foregroundStyle(DATClassicPalette.weather)
            }
        }
        .font(.system(size: 9.5, weight: .regular, design: .serif))
        .foregroundStyle(DATClassicPalette.muted)
        .lineLimit(1)
    }
}

private struct DATClassicPrayerRows: View {
    let prayers: [DATPrayer]
    let nextName: String
    let compact: Bool

    private var visiblePrayers: [DATPrayer] {
        prayers.filter { prayer in
            let name = prayer.name.lowercased()
            return !name.contains("sunrise") && !name.contains("sonnenaufgang") && !name.contains("shuruq") && !name.contains("schurūq")
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            ForEach(Array(visiblePrayers.prefix(5).enumerated()), id: \.offset) { index, prayer in
                HStack(spacing: 6) {
                    Text(DATPrayerName.display(prayer.name))
                        .lineLimit(1)
                        .minimumScaleFactor(0.74)
                    Spacer(minLength: 4)
                    Text(prayer.time)
                        .monospacedDigit()
                        .lineLimit(1)
                }
                .font(.system(size: compact ? 10.5 : 17.0, weight: DATPrayerName.matches(prayer.name, nextName) ? .semibold : .regular, design: .serif))
                .foregroundStyle(DATPrayerName.matches(prayer.name, nextName) ? DATClassicPalette.gold : DATClassicPalette.cream)
                .padding(.horizontal, DATPrayerName.matches(prayer.name, nextName) ? 5 : 0)
                .padding(.vertical, compact ? 2.5 : 3.5)
                .background(DATPrayerName.matches(prayer.name, nextName) ? DATClassicPalette.gold.opacity(0.14) : .clear)
                .clipShape(RoundedRectangle(cornerRadius: 4))
                if index < min(visiblePrayers.count, 5) - 1 {
                    Rectangle()
                        .fill(DATClassicPalette.line.opacity(compact ? 0.55 : 0.8))
                        .frame(height: 0.7)
                }
            }
        }
    }
}

private struct DATClassicPrayerView: View {
    let entry: DATEntry
    @Environment(\.widgetFamily) private var family

    private var snapshot: DATSnapshot { entry.snapshot }
    private var configured: Bool {
        !snapshot.prayers.isEmpty && !snapshot.nextPrayerName.isEmpty && !snapshot.nextPrayerTime.isEmpty
    }

    private var nextTarget: (name: String, time: String, when: Date)? {
        guard configured else { return nil }
        return DATClock.next(snapshot, at: entry.date)
    }

    private var nextTitle: String {
        nextTarget?.name ?? (configured ? snapshot.nextPrayerName : "Gebetszeiten öffnen")
    }

    private var nextTimeText: String {
        nextTarget?.time ?? (configured ? snapshot.nextPrayerTime : "")
    }

    @ViewBuilder
    private func nextTime(fontSize: CGFloat) -> some View {
        if configured {
            Text(nextTimeText)
                .font(.system(size: fontSize, weight: .medium, design: .serif))
                .monospacedDigit()
                .foregroundStyle(DATClassicPalette.cream)
                .lineLimit(1)
                .minimumScaleFactor(0.68)
        } else {
            Text("Keine Gebetszeiten verfügbar")
                .font(.system(.caption, design: .serif))
                .foregroundStyle(DATClassicPalette.muted)
                .lineLimit(2)
                .minimumScaleFactor(0.75)
        }
    }

    @ViewBuilder
    private func countdown(fontSize: CGFloat) -> some View {
        if nextTarget != nil {
            TimelineView(.periodic(from: entry.date, by: 60)) { context in
                Text(DATClock.compactRemainingText(snapshot, at: context.date))
                    .font(.system(size: fontSize, weight: .medium, design: .serif))
                    .monospacedDigit()
                    .foregroundStyle(DATClassicPalette.gold)
                    .lineLimit(1)
                    .minimumScaleFactor(0.65)
            }
        }
    }

    private var smallLayout: some View {
        VStack(alignment: .leading, spacing: 4) {
            Spacer(minLength: 0)
            Text("NÄCHSTES GEBET")
                .font(.system(size: 9, weight: .medium, design: .serif))
                .tracking(0.7)
                .foregroundStyle(DATClassicPalette.muted)
            Text(nextTitle)
                .font(.system(size: 21, weight: .semibold, design: .serif))
                .foregroundStyle(DATClassicPalette.gold)
                .lineLimit(1)
                .minimumScaleFactor(0.62)
            nextTime(fontSize: 24)
            countdown(fontSize: 11)
        }
    }

    private var mediumLayout: some View {
        HStack(alignment: .center, spacing: 13) {
            VStack(alignment: .leading, spacing: 5) {
                Text("Nächstes Gebet")
                    .font(.system(.caption, design: .serif))
                    .foregroundStyle(DATClassicPalette.muted)
                Text(nextTitle)
                    .font(.system(size: 22, weight: .semibold, design: .serif))
                    .foregroundStyle(DATClassicPalette.gold)
                    .lineLimit(1)
                    .minimumScaleFactor(0.62)
                nextTime(fontSize: 24)
                countdown(fontSize: 11)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            Rectangle()
                .fill(DATClassicPalette.line)
                .frame(width: 0.5)
            DATClassicPrayerRows(prayers: snapshot.prayers, nextName: nextTitle, compact: true)
                .frame(maxWidth: .infinity)
        }
    }

    private var largeLayout: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .firstTextBaseline) {
                Text("Nächstes Gebet")
                    .font(.system(size: 13, weight: .medium, design: .serif))
                    .foregroundStyle(DATClassicPalette.muted)
                Spacer(minLength: 4)
                Text(entry.date, format: .dateTime.day().month(.abbreviated).year())
                    .font(.system(size: 12, weight: .medium, design: .serif))
                    .foregroundStyle(DATClassicPalette.muted)
            }
            Text(nextTitle)
                .font(.system(size: 38, weight: .semibold, design: .serif))
                .foregroundStyle(DATClassicPalette.gold)
                .lineLimit(1)
                .minimumScaleFactor(0.68)
            HStack(alignment: .firstTextBaseline, spacing: 10) {
                nextTime(fontSize: 40)
                Spacer(minLength: 0)
                if nextTarget != nil {
                    HStack(spacing: 7) {
                        Text("NOCH")
                            .font(.system(size: 9, weight: .bold, design: .serif))
                            .tracking(1.0)
                            .foregroundStyle(DATClassicPalette.muted)
                        countdown(fontSize: 16)
                    }
                    .padding(.horizontal, 9)
                    .padding(.vertical, 3)
                    .background(DATClassicPalette.ink.opacity(0.90))
                    .overlay(
                        RoundedRectangle(cornerRadius: 7)
                            .stroke(DATClassicPalette.line, lineWidth: 0.8)
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 7))
                }
            }
            Rectangle()
                .fill(DATClassicPalette.line)
                .frame(height: 0.8)
            DATClassicPrayerRows(prayers: snapshot.prayers, nextName: nextTitle, compact: false)
            Rectangle()
                .fill(DATClassicPalette.line)
                .frame(height: 0.8)
            HStack(spacing: 10) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("STANDORT")
                        .font(.system(size: 7.5, weight: .bold, design: .rounded))
                        .tracking(0.8)
                    Text(snapshot.place)
                        .font(.system(size: 15.5, weight: .medium, design: .serif))
                        .lineLimit(1)
                        .minimumScaleFactor(0.72)
                        .foregroundStyle(DATClassicPalette.cream)
                    if !snapshot.hijriLabel.isEmpty {
                        Text(snapshot.hijriLabel)
                            .font(.system(size: 10, weight: .medium, design: .serif))
                            .lineLimit(1)
                            .minimumScaleFactor(0.62)
                            .foregroundStyle(DATClassicPalette.gold.opacity(0.92))
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                Rectangle()
                    .fill(DATClassicPalette.line)
                    .frame(width: 0.7, height: 31)
                VStack(alignment: .center, spacing: 2) {
                    Text("SONNENAUFGANG")
                        .font(.system(size: 7.5, weight: .bold, design: .rounded))
                        .tracking(0.8)
                        .lineLimit(1)
                        .minimumScaleFactor(0.55)
                    Text(DATClock.sunrise(snapshot) ?? "—")
                        .font(.system(size: 16, weight: .semibold, design: .serif))
                        .monospacedDigit()
                        .foregroundStyle(DATClassicPalette.sunrise)
                }
                .frame(maxWidth: .infinity, alignment: .center)
                Rectangle()
                    .fill(DATClassicPalette.line)
                    .frame(width: 0.7, height: 31)
                VStack(alignment: .center, spacing: 2) {
                    Text("WETTER")
                        .font(.system(size: 7.5, weight: .bold, design: .rounded))
                        .tracking(0.8)
                    if let temperature = snapshot.weatherTemperature {
                        HStack(spacing: 3) {
                            Image(systemName: DATWeatherSymbol.name(snapshot.weatherSymbolName, timeZone: snapshot.timeZone))
                                .foregroundStyle(DATClassicPalette.weather)
                            Text("\(temperature, specifier: "%.0f")°")
                                .monospacedDigit()
                        }
                        .font(.system(size: 16, weight: .semibold, design: .serif))
                            .monospacedDigit()
                            .foregroundStyle(DATClassicPalette.weather)
                    } else {
                        Text("—")
                    }
                }
                .frame(maxWidth: .infinity, alignment: .center)
            }
            .font(.system(size: 11, weight: .medium, design: .serif))
            .foregroundStyle(DATClassicPalette.muted)
        }
    }

    private var extraLargeLayout: some View {
        GeometryReader { proxy in
            let width = proxy.size.width
            let columnSpacing = min(max(width * 0.04, 16), 32)
            let titleSize = min(max(width * 0.075, 30), 42)
            let timeSize = min(max(width * 0.072, 30), 40)

            VStack(alignment: .leading, spacing: 10) {
                Text(entry.date, format: .dateTime.weekday(.wide).day().month(.wide).year())
                    .font(.system(.caption, design: .serif))
                    .foregroundStyle(DATClassicPalette.muted)
                    .lineLimit(1)
                    .minimumScaleFactor(0.72)
                HStack(alignment: .top, spacing: columnSpacing) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Nächstes Gebet")
                            .font(.system(.subheadline, design: .serif))
                            .foregroundStyle(DATClassicPalette.muted)
                        Text(nextTitle)
                            .font(.system(size: titleSize, weight: .semibold, design: .serif))
                            .foregroundStyle(DATClassicPalette.gold)
                            .lineLimit(1)
                            .minimumScaleFactor(0.62)
                        nextTime(fontSize: timeSize)
                        countdown(fontSize: min(max(width * 0.032, 14), 18))
                        Text(snapshot.place)
                            .font(.system(.caption, design: .serif))
                            .foregroundStyle(DATClassicPalette.muted)
                            .lineLimit(1)
                            .minimumScaleFactor(0.72)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    Rectangle()
                        .fill(DATClassicPalette.line)
                        .frame(width: 0.5)
                    VStack(alignment: .leading, spacing: 7) {
                        DATClassicPrayerRows(prayers: snapshot.prayers, nextName: nextTitle, compact: false)
                        if !snapshot.hijriLabel.isEmpty {
                            Rectangle()
                                .fill(DATClassicPalette.line)
                                .frame(height: 0.5)
                            Text(snapshot.hijriLabel)
                                .font(.system(.caption, design: .serif))
                                .foregroundStyle(DATClassicPalette.muted)
                                .lineLimit(2)
                                .minimumScaleFactor(0.72)
                        }
                        if let temperature = snapshot.weatherTemperature {
                            Text("Wetter \(temperature, specifier: "%.0f")°")
                                .font(.system(.caption, design: .serif))
                                .foregroundStyle(DATClassicPalette.muted)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                Spacer(minLength: 0)
            }
            .frame(width: proxy.size.width, height: proxy.size.height, alignment: .topLeading)
        }
    }

    var body: some View {
        Group {
            if family == .accessoryInline {
                Text(configured ? "\(nextTitle) · \(nextTimeText)" : "Gebetszeiten öffnen")
                    .widgetAccentable()
            } else if family == .accessoryCircular {
                VStack(spacing: 2) {
                    Text(configured ? snapshot.nextPrayerName : "Gebet")
                        .font(.system(size: 10, weight: .semibold, design: .serif))
                        .lineLimit(1)
                        .minimumScaleFactor(0.55)
                    Text(configured ? nextTimeText : "—")
                        .font(.system(size: 13, weight: .semibold, design: .rounded))
                        .monospacedDigit()
                }
                .widgetAccentable()
            } else if family == .accessoryRectangular {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Nächstes Gebet")
                        .font(.system(.caption2, design: .serif))
                    Text(configured ? "\(nextTitle) · \(nextTimeText)" : "Gebetszeiten öffnen")
                        .font(.system(.subheadline, design: .serif).weight(.semibold))
                        .lineLimit(1)
                        .minimumScaleFactor(0.65)
                }
                .widgetAccentable()
            } else {
                VStack(alignment: .leading, spacing: family == .systemLarge ? 6 : 9) {
                    DATClassicBrand(compact: family == .systemSmall, large: family == .systemLarge)
                    if family == .systemSmall || family == .systemMedium {
                        DATClassicMeta(snapshot: snapshot)
                    }
                    if family == .systemSmall {
                        smallLayout
                    } else if family == .systemMedium {
                        mediumLayout
                    } else if family == .systemExtraLarge {
                        extraLargeLayout
                    } else {
                        largeLayout
                    }
                }
                .padding(family == .systemSmall ? 12 : (family == .systemLarge ? 11 : 16))
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                .containerBackground(for: .widget) {
                    DATClassicBackground()
                }
            }
        }
        .widgetURL(URL(string: "daraltawhid://prayer"))
    }
}

private struct DATClassicPrayerWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(
            kind: "dat.classic.prayer",
            provider: DATClassicProvider()
        ) { entry in
            DATClassicPrayerView(entry: entry)
        }
        .configurationDisplayName("DĀR AL TAWḤĪD · Klassisch")
        .description("Historische Bücher, nächstes Gebet und Gebetszeiten")
        .supportedFamilies([
            .systemSmall,
            .systemMedium,
            .systemLarge,
            .systemExtraLarge,
            .accessoryInline,
            .accessoryCircular,
            .accessoryRectangular
        ])
        .contentMarginsDisabled()
        .containerBackgroundRemovable()
    }
}

private extension DATSnapshot {
    static var preview: DATSnapshot {
        var value = DATSnapshot()
        value.cityLabel = "Berlin"
        value.timeZoneIdentifier = "Europe/Berlin"
        value.hijriLabel = "15 Rabīʿ ath-Thānī 1448"
        value.prayers = [
            DATPrayer(name: "Fajr", time: "05:42"),
            DATPrayer(name: "Ẓuhr", time: "12:58"),
            DATPrayer(name: "ʿAṣr", time: "16:21"),
            DATPrayer(name: "Maġrib", time: "18:47"),
            DATPrayer(name: "ʿIshāʾ", time: "20:16")
        ]
        value.nextPrayerName = "ʿAṣr"
        value.nextPrayerTime = "16:21"
        value.qiblaDegrees = 126
        value.ayahGerman = "Dir allein dienen wir, und Dich allein bitten wir um Hilfe."
        value.ayahRef = "al-Fātiḥah 1:5"
        value.tadabburGerman = "Der Diener richtet seine Anbetung allein an Allah und bittet Ihn allein um Hilfe."
        value.weatherTemperature = 14
        value.weatherCondition = "Bewölkt"
        value.weatherSymbolName = "cloud.sun"
        value.updatedAt = .now
        return value
    }
}

#if DEBUG
#Preview("Klassisch · Small", as: .systemSmall, widget: {
    DATClassicPrayerWidget()
}, timeline: {
    DATEntry(date: .now, snapshot: .preview, look: .salbeiElfenbein)
})

#Preview("Klassisch · Medium", as: .systemMedium, widget: {
    DATClassicPrayerWidget()
}, timeline: {
    DATEntry(date: .now, snapshot: .preview, look: .salbeiElfenbein)
})

#Preview("Klassisch · Large", as: .systemLarge, widget: {
    DATClassicPrayerWidget()
}, timeline: {
    DATEntry(date: .now, snapshot: .preview, look: .salbeiElfenbein)
})

#Preview("Klassisch · iPad Extra Large", as: .systemExtraLarge, widget: {
    DATClassicPrayerWidget()
}, timeline: {
    DATEntry(date: .now, snapshot: .preview, look: .salbeiElfenbein)
})

#Preview("Premium · Gebet Small", as: .systemSmall, widget: {
    DATPrayerWidget()
}, timeline: {
    DATEntry(date: .now, snapshot: .preview, look: .salbeiElfenbein)
})

#Preview("Premium · Übersicht Large", as: .systemLarge, widget: {
    DATOverviewWidget()
}, timeline: {
    DATEntry(date: .now, snapshot: .preview, look: .salbeiElfenbein)
})

#Preview("Premium · Qibla Small", as: .systemSmall, widget: {
    DATQiblaWidget()
}, timeline: {
    DATEntry(date: .now, snapshot: .preview, look: .salbeiElfenbein)
})

#Preview("Premium · Duʿāʾ Small", as: .systemSmall, widget: {
    DATDuaWidget()
}, timeline: {
    DATEntry(date: .now, snapshot: .preview, look: .salbeiElfenbein)
})

#Preview("Premium · Āya Small", as: .systemSmall, widget: {
    DATAyahWidget()
}, timeline: {
    DATEntry(date: .now, snapshot: .preview, look: .salbeiElfenbein)
})
#endif
// Restored standard widget dependency: Shared/DarWidgetSnapshot.swift

import Foundation

extension Notification.Name {
    static let datShowWeatherAttribution = Notification.Name("dat.show.weather.attribution")
}

struct DarPrayerSlot: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let time: String
}

struct DarIslamicCalendarRow: Codable, Identifiable, Hashable {
    let id: String
    let gregorianDate: String
    let hijriDate: String
    let weekday: String
}

struct DarWeatherDay: Codable, Equatable, Identifiable {
    let date: Date
    let highTemperature: Double
    let lowTemperature: Double
    let symbolName: String

    var id: Date { date }
}

enum DarSourceFormat {
    static func display(_ raw: String, fallback: String = "") -> String {
        var s = raw
        for token in ["📝 ", "🖋️ ", "📖 "] {
            s = s.replacingOccurrences(of: token, with: "")
        }
        s = s.trimmingCharacters(in: .whitespacesAndNewlines)
        if s.isEmpty { s = fallback.trimmingCharacters(in: .whitespacesAndNewlines) }
        if let idx = s.firstIndex(of: ";") {
            s = String(s[..<idx]).trimmingCharacters(in: .whitespaces)
        }
        return s
    }
}

struct DarWidgetSnapshot: Codable, Equatable {
    var themeId: String
    var inkHex: String
    var goldHex: String
    var textHex: String
    var mutedHex: String
    var cityLabel: String
    var latitude: Double
    var longitude: Double
    var timeZoneIdentifier: String
    var fajrAngle: Double
    var asrFactor: Double
    var calculationMethodIdentifier: String
    var hijriAdjustment: Int
    var hijriLabel: String
    var calendarRows: [DarIslamicCalendarRow]
    var qiblaDegrees: Double
    var prayers: [DarPrayerSlot]
    var nextPrayerName: String
    var nextPrayerTime: String
    var nextPrayerRemaining: String
    var recommendationTitle: String
    var recommendationBody: String
    var postTitle: String
    var postSnippet: String
    var postId: String
    var postCategory: String
    var postSource: String
    var ayahGerman: String
    var ayahTranslit: String
    var ayahRef: String
    var tadabburGerman: String
    var duaTitle: String
    var duaGerman: String
    var duaTranslit: String
    var duaId: String
    var duaCategory: String
    var duaSource: String
    var weatherTemperature: Double?
    var weatherCode: Int?
    var weatherCondition: String
    var weatherSymbolName: String
    var weatherUpdatedAt: Date?
    var weatherForecast: [DarWeatherDay]
    var updatedAt: Date

    var postSourceLine: String { DarSourceFormat.display(postSource, fallback: postCategory) }
    var duaSourceLine: String { DarSourceFormat.display(duaSource, fallback: duaCategory) }
    var locationTimeZone: TimeZone { TimeZone(identifier: timeZoneIdentifier) ?? .current }

    /// Never present the seeded Berlin label as if it were the device location.
    /// The native location service replaces it after permission and geocoding.
    var displayCityLabel: String {
        let value = cityLabel.trimmingCharacters(in: .whitespacesAndNewlines)
        if value.isEmpty || value.localizedCaseInsensitiveContains("ermittelt") || value == "Berlin (Standard)" || value.allSatisfy({ $0.isNumber || $0 == " " }) {
            return "—"
        }
        return value
    }

    static let empty = DarWidgetSnapshot(
        themeId: "salbeiElfenbein",
        inkHex: "",
        goldHex: "",
        textHex: "",
        mutedHex: "",
        cityLabel: "Standort wird ermittelt …",
        latitude: 52.5200,
        longitude: 13.4050,
        timeZoneIdentifier: "Europe/Berlin",
        fajrAngle: 12,
        asrFactor: 1,
        calculationMethodIdentifier: "dar-noaa",
        hijriAdjustment: 0,
        hijriLabel: "",
        qiblaDegrees: 126.0,
        prayers: [],
        nextPrayerName: "Gebetszeiten",
        nextPrayerTime: "—",
        nextPrayerRemaining: "",
        recommendationTitle: "Heute empfohlen",
        recommendationBody: "Öffne die App für den heutigen Beitrag.",
        postTitle: "",
        postSnippet: "",
        postId: "",
        postCategory: "",
        postSource: "",
        ayahGerman: "",
        ayahTranslit: "",
        ayahRef: "",
        tadabburGerman: "",
        duaTitle: "Duʿāʾ des Tages",
        duaGerman: "Öffne die App für geprüfte Bittgebete.",
        duaTranslit: "",
        duaId: "",
        duaCategory: "",
        duaSource: "",
        updatedAt: Date(timeIntervalSince1970: 0)
    )

    enum CodingKeys: String, CodingKey {
        case themeId, inkHex, goldHex, textHex, mutedHex, cityLabel, latitude, longitude, timeZoneIdentifier, fajrAngle, asrFactor, calculationMethodIdentifier, hijriAdjustment, hijriLabel, calendarRows, qiblaDegrees, prayers
        case nextPrayerName, nextPrayerTime, nextPrayerRemaining
        case recommendationTitle, recommendationBody
        case postTitle, postSnippet, postId, postCategory, postSource
        case ayahGerman, ayahTranslit, ayahRef, tadabburGerman
        case duaTitle, duaGerman, duaTranslit, duaId, duaCategory, duaSource
        case weatherTemperature, weatherCode, weatherCondition, weatherSymbolName, weatherUpdatedAt, weatherForecast
        case updatedAt
    }

    init(
        themeId: String, inkHex: String, goldHex: String, textHex: String, mutedHex: String,
        cityLabel: String, latitude: Double, longitude: Double, timeZoneIdentifier: String = TimeZone.current.identifier, fajrAngle: Double, asrFactor: Double,
        calculationMethodIdentifier: String = "dar-noaa", hijriAdjustment: Int = 0,
        hijriLabel: String, calendarRows: [DarIslamicCalendarRow] = [], qiblaDegrees: Double,
        prayers: [DarPrayerSlot], nextPrayerName: String, nextPrayerTime: String, nextPrayerRemaining: String,
        recommendationTitle: String, recommendationBody: String, postTitle: String, postSnippet: String, postId: String = "",
        postCategory: String, postSource: String = "", ayahGerman: String, ayahTranslit: String, ayahRef: String, tadabburGerman: String = "", duaTitle: String,
        duaGerman: String, duaTranslit: String, duaId: String = "", duaCategory: String, duaSource: String = "", updatedAt: Date,
        weatherTemperature: Double? = nil, weatherCode: Int? = nil,
        weatherCondition: String = "", weatherSymbolName: String = "", weatherUpdatedAt: Date? = nil,
        weatherForecast: [DarWeatherDay] = []
    ) {
        self.themeId = themeId
        self.inkHex = inkHex
        self.goldHex = goldHex
        self.textHex = textHex
        self.mutedHex = mutedHex
        self.cityLabel = cityLabel
        self.latitude = latitude
        self.longitude = longitude
        self.timeZoneIdentifier = timeZoneIdentifier
        self.fajrAngle = fajrAngle
        self.asrFactor = asrFactor
        self.calculationMethodIdentifier = calculationMethodIdentifier
        self.hijriAdjustment = hijriAdjustment
        self.hijriLabel = hijriLabel
        self.calendarRows = calendarRows
        self.qiblaDegrees = qiblaDegrees
        self.prayers = prayers
        self.nextPrayerName = nextPrayerName
        self.nextPrayerTime = nextPrayerTime
        self.nextPrayerRemaining = nextPrayerRemaining
        self.recommendationTitle = recommendationTitle
        self.recommendationBody = recommendationBody
        self.postTitle = postTitle
        self.postSnippet = postSnippet
        self.postId = postId
        self.postCategory = postCategory
        self.postSource = postSource
        self.ayahGerman = ayahGerman
        self.ayahTranslit = ayahTranslit
        self.ayahRef = ayahRef
        self.tadabburGerman = tadabburGerman
        self.duaTitle = duaTitle
        self.duaGerman = duaGerman
        self.duaTranslit = duaTranslit
        self.duaId = duaId
        self.duaCategory = duaCategory
        self.duaSource = duaSource
        self.weatherTemperature = weatherTemperature
        self.weatherCode = weatherCode
        self.weatherCondition = weatherCondition
        self.weatherSymbolName = weatherSymbolName
        self.weatherUpdatedAt = weatherUpdatedAt
        self.weatherForecast = weatherForecast
        self.updatedAt = updatedAt
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        themeId = try c.decodeIfPresent(String.self, forKey: .themeId) ?? "salbeiElfenbein"
        inkHex = try c.decodeIfPresent(String.self, forKey: .inkHex) ?? ""
        goldHex = try c.decodeIfPresent(String.self, forKey: .goldHex) ?? ""
        textHex = try c.decodeIfPresent(String.self, forKey: .textHex) ?? ""
        mutedHex = try c.decodeIfPresent(String.self, forKey: .mutedHex) ?? ""
        cityLabel = try c.decodeIfPresent(String.self, forKey: .cityLabel) ?? "Standort wird ermittelt …"
        latitude = try c.decodeIfPresent(Double.self, forKey: .latitude) ?? 52.52
        longitude = try c.decodeIfPresent(Double.self, forKey: .longitude) ?? 13.405
        timeZoneIdentifier = try c.decodeIfPresent(String.self, forKey: .timeZoneIdentifier) ?? TimeZone.current.identifier
        fajrAngle = try c.decodeIfPresent(Double.self, forKey: .fajrAngle) ?? 12
        asrFactor = try c.decodeIfPresent(Double.self, forKey: .asrFactor) ?? 1
        calculationMethodIdentifier = try c.decodeIfPresent(String.self, forKey: .calculationMethodIdentifier) ?? "dar-noaa"
        hijriAdjustment = try c.decodeIfPresent(Int.self, forKey: .hijriAdjustment) ?? 0
        hijriLabel = try c.decodeIfPresent(String.self, forKey: .hijriLabel) ?? ""
        calendarRows = try c.decodeIfPresent([DarIslamicCalendarRow].self, forKey: .calendarRows) ?? []
        qiblaDegrees = try c.decodeIfPresent(Double.self, forKey: .qiblaDegrees) ?? 126.0
        prayers = try c.decodeIfPresent([DarPrayerSlot].self, forKey: .prayers) ?? []
        nextPrayerName = try c.decodeIfPresent(String.self, forKey: .nextPrayerName) ?? "Gebet"
        nextPrayerTime = try c.decodeIfPresent(String.self, forKey: .nextPrayerTime) ?? "—"
        nextPrayerRemaining = try c.decodeIfPresent(String.self, forKey: .nextPrayerRemaining) ?? ""
        recommendationTitle = try c.decodeIfPresent(String.self, forKey: .recommendationTitle) ?? "Heute empfohlen"
        recommendationBody = try c.decodeIfPresent(String.self, forKey: .recommendationBody) ?? ""
        postTitle = try c.decodeIfPresent(String.self, forKey: .postTitle) ?? ""
        postSnippet = try c.decodeIfPresent(String.self, forKey: .postSnippet) ?? ""
        postId = try c.decodeIfPresent(String.self, forKey: .postId) ?? ""
        postCategory = try c.decodeIfPresent(String.self, forKey: .postCategory) ?? ""
        postSource = try c.decodeIfPresent(String.self, forKey: .postSource) ?? ""
        ayahGerman = try c.decodeIfPresent(String.self, forKey: .ayahGerman) ?? ""
        ayahTranslit = try c.decodeIfPresent(String.self, forKey: .ayahTranslit) ?? ""
        ayahRef = try c.decodeIfPresent(String.self, forKey: .ayahRef) ?? ""
        tadabburGerman = try c.decodeIfPresent(String.self, forKey: .tadabburGerman) ?? ""
        duaTitle = try c.decodeIfPresent(String.self, forKey: .duaTitle) ?? "Duʿāʾ des Tages"
        duaGerman = try c.decodeIfPresent(String.self, forKey: .duaGerman) ?? ""
        duaTranslit = try c.decodeIfPresent(String.self, forKey: .duaTranslit) ?? ""
        duaId = try c.decodeIfPresent(String.self, forKey: .duaId) ?? ""
        duaCategory = try c.decodeIfPresent(String.self, forKey: .duaCategory) ?? ""
        duaSource = try c.decodeIfPresent(String.self, forKey: .duaSource) ?? ""
        weatherTemperature = try c.decodeIfPresent(Double.self, forKey: .weatherTemperature)
        weatherCode = try c.decodeIfPresent(Int.self, forKey: .weatherCode)
        weatherCondition = try c.decodeIfPresent(String.self, forKey: .weatherCondition) ?? ""
        weatherSymbolName = try c.decodeIfPresent(String.self, forKey: .weatherSymbolName) ?? ""
        weatherUpdatedAt = try c.decodeIfPresent(Date.self, forKey: .weatherUpdatedAt)
        weatherForecast = try c.decodeIfPresent([DarWeatherDay].self, forKey: .weatherForecast) ?? []
        updatedAt = try c.decodeIfPresent(Date.self, forKey: .updatedAt) ?? Date()
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(themeId, forKey: .themeId)
        try c.encode(inkHex, forKey: .inkHex)
        try c.encode(goldHex, forKey: .goldHex)
        try c.encode(textHex, forKey: .textHex)
        try c.encode(mutedHex, forKey: .mutedHex)
        try c.encode(cityLabel, forKey: .cityLabel)
        try c.encode(latitude, forKey: .latitude)
        try c.encode(longitude, forKey: .longitude)
        try c.encode(timeZoneIdentifier, forKey: .timeZoneIdentifier)
        try c.encode(fajrAngle, forKey: .fajrAngle)
        try c.encode(asrFactor, forKey: .asrFactor)
        try c.encode(calculationMethodIdentifier, forKey: .calculationMethodIdentifier)
        try c.encode(hijriAdjustment, forKey: .hijriAdjustment)
        try c.encode(hijriLabel, forKey: .hijriLabel)
        try c.encode(calendarRows, forKey: .calendarRows)
        try c.encode(qiblaDegrees, forKey: .qiblaDegrees)
        try c.encode(prayers, forKey: .prayers)
        try c.encode(nextPrayerName, forKey: .nextPrayerName)
        try c.encode(nextPrayerTime, forKey: .nextPrayerTime)
        try c.encode(nextPrayerRemaining, forKey: .nextPrayerRemaining)
        try c.encode(recommendationTitle, forKey: .recommendationTitle)
        try c.encode(recommendationBody, forKey: .recommendationBody)
        try c.encode(postTitle, forKey: .postTitle)
        try c.encode(postSnippet, forKey: .postSnippet)
        try c.encode(postId, forKey: .postId)
        try c.encode(postCategory, forKey: .postCategory)
        try c.encode(postSource, forKey: .postSource)
        try c.encode(ayahGerman, forKey: .ayahGerman)
        try c.encode(ayahTranslit, forKey: .ayahTranslit)
        try c.encode(ayahRef, forKey: .ayahRef)
        try c.encode(tadabburGerman, forKey: .tadabburGerman)
        try c.encode(duaTitle, forKey: .duaTitle)
        try c.encode(duaGerman, forKey: .duaGerman)
        try c.encode(duaTranslit, forKey: .duaTranslit)
        try c.encode(duaId, forKey: .duaId)
        try c.encode(duaCategory, forKey: .duaCategory)
        try c.encode(duaSource, forKey: .duaSource)
        try c.encodeIfPresent(weatherTemperature, forKey: .weatherTemperature)
        try c.encodeIfPresent(weatherCode, forKey: .weatherCode)
        try c.encode(weatherCondition, forKey: .weatherCondition)
        try c.encode(weatherSymbolName, forKey: .weatherSymbolName)
        try c.encodeIfPresent(weatherUpdatedAt, forKey: .weatherUpdatedAt)
        try c.encode(weatherForecast, forKey: .weatherForecast)
        try c.encode(updatedAt, forKey: .updatedAt)
    }
}

enum DarWidgetKeys {
    static let appGroup = "group.de.daraltawhid.app"
    static let snapshot = "dar.widget.snapshot.v2"
    static let pendingDestination = "dar.widget.pending.destination"
    static let pendingNonce = "dar.widget.pending.nonce"
    static let nativeLocationResolved = "dar.widget.native.location.resolved"
}


// Restored standard widget dependency: Shared/DarWidgetStore.swift

import Foundation
import WidgetKit

enum DarWidgetStore {
    static var defaults: UserDefaults {
        // On a simulator or a development install without a signed App Group,
        // suiteName: returns a non-functional store and logs “client is not entitled”.
        // Use the app-local store in that case so location detection still works
        // immediately; on a correctly signed device the shared group remains active.
        if FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: DarWidgetKeys.appGroup
        ) == nil {
            return .standard
        }
        return UserDefaults(suiteName: DarWidgetKeys.appGroup) ?? .standard
    }

    static func load() -> DarWidgetSnapshot {
        guard let data = defaults.data(forKey: DarWidgetKeys.snapshot),
              let snap = try? JSONDecoder().decode(DarWidgetSnapshot.self, from: data) else {
            return DarDailyContent.refresh(DarWidgetSnapshot.empty)
        }
        return snap
    }

    static func save(_ snapshot: DarWidgetSnapshot, reload: Bool = true) {
        if let data = try? JSONEncoder().encode(snapshot) {
            defaults.set(data, forKey: DarWidgetKeys.snapshot)
        }
        if reload {
            WidgetCenter.shared.reloadAllTimelines()
        }
    }

    static func setPendingDestination(_ dest: DarDeepLink.Destination) {
        defaults.set(dest.rawValue, forKey: DarWidgetKeys.pendingDestination)
        defaults.set(UUID().uuidString, forKey: DarWidgetKeys.pendingNonce)
    }

    static func consumePendingDestination() -> DarDeepLink.Destination? {
        guard let raw = defaults.string(forKey: DarWidgetKeys.pendingDestination) else { return nil }
        defaults.removeObject(forKey: DarWidgetKeys.pendingDestination)
        return DarDeepLink.Destination(rawValue: raw)
    }
}


// Restored standard widget dependency: Shared/DarDailyContent.swift

import Foundation

enum DarDailyContent {
    private struct AyahCard {
        let german: String
        let translit: String
        let ref: String
    }

    private struct DuaCard {
        let title: String
        let german: String
        let translit: String
        let category: String
    }

    private static let tadabburByReference: [String: String] = [
        "al-Fātiḥah 1:5": "Der Diener richtet seine Anbetung allein an Allah und bittet Ihn allein um Hilfe.",
        "ar-Raʿd 13:28": "Wahre Ruhe entsteht durch ein Herz, das Allah gedenkt und sich Ihm anvertraut.",
        "al-Baqarah 2:152": "Wer Allah aufrichtig gedenkt, gewinnt Seine besondere Erwähnung und Hilfe.",
        "Hūd 11:88": "Der Diener bemüht sich aufrichtig, doch der Erfolg kommt allein von Allah. Deshalb verbindet er Handeln mit Tawakkul.",
        "an-Nisāʾ 4:45": "Allah genügt Seinen Dienern als Beschützer. Das Vertrauen auf Ihn schenkt dem Herzen Standhaftigkeit."
    ]

    private static let ayahs: [AyahCard] = [
        AyahCard(
            german: "Dir allein dienen wir, und Dich allein bitten wir um Hilfe.",
            translit: "Iyyāka naʿbudu wa iyyāka nastaʿīn.",
            ref: "al-Fātiḥah 1:5"
        ),
        AyahCard(
            german: "Wahrlich, durch das Gedenken Allahs kommen die Herzen zur Ruhe.",
            translit: "Alā bi-dhikrillāhi taṭmaʾinnu l-qulūb.",
            ref: "ar-Raʿd 13:28"
        ),
        AyahCard(
            german: "Gedenket Meiner, so gedenke Ich eurer.",
            translit: "Fadhkurūnī adhkurkum.",
            ref: "al-Baqarah 2:152"
        ),
        AyahCard(
            german: "Und mein Erfolg kommt nur von Allah.",
            translit: "Wa mā tawfīqī illā billāh.",
            ref: "Hūd 11:88"
        ),
        AyahCard(
            german: "Allah genügt als Beschützer, und Allah genügt als Helfer.",
            translit: "Wa kafā billāhi waliyyan wa kafā billāhi naṣīrā.",
            ref: "an-Nisāʾ 4:45"
        )
    ]

    private static let duas: [DuaCard] = [
        DuaCard(title: "Bitte um Barmherzigkeit", german: "Unser Herr, schenke uns Barmherzigkeit von Dir und bereite uns in unserer Angelegenheit einen rechten Weg.", translit: "", category: "Qurʾān, al-Kahf 18:10"),
        DuaCard(title: "Bitte um Rechtleitung", german: "Unser Herr, lass unsere Herzen nicht abschweifen, nachdem Du uns rechtgeleitet hast.", translit: "", category: "Āl ʿImrān 3:8"),
        DuaCard(title: "Bitte um Gutes", german: "Unser Herr, gib uns Gutes im Diesseits und Gutes im Jenseits und bewahre uns vor der Strafe des Feuers.", translit: "", category: "al-Baqarah 2:201")
    ]

    static func refreshForWatch(_ base: DarWidgetSnapshot, date: Date = Date()) -> DarWidgetSnapshot {
        var snap = refresh(base, date: date)
        let day = Calendar.current.ordinality(of: .day, in: .year, for: date) ?? 1
        let ayah = ayahs[day % ayahs.count]
        if snap.ayahRef.isEmpty || ayahs.contains(where: { $0.ref == snap.ayahRef }) {
            snap.ayahGerman = ayah.german
            snap.ayahTranslit = ayah.translit
            snap.ayahRef = ayah.ref
        }
        snap.tadabburGerman = tadabburByReference[snap.ayahRef] ?? ""
        if snap.duaId.isEmpty || snap.duaId.hasPrefix("watch-fallback-") {
            let dua = duas[day % duas.count]
            snap.duaTitle = dua.title
            snap.duaGerman = dua.german
            snap.duaTranslit = dua.translit
            snap.duaCategory = dua.category
            snap.duaSource = dua.category
            snap.duaId = "watch-fallback-\(day)"
        }
        return snap
    }

    static func refresh(_ base: DarWidgetSnapshot, date: Date = Date()) -> DarWidgetSnapshot {
        var snap = base
        let angle = snap.fajrAngle == 0 ? 12 : snap.fajrAngle
        let asr = snap.asrFactor == 0 ? 1 : snap.asrFactor
        let prayers = DarPrayerEngine.times(
            for: date,
            lat: snap.latitude,
            lng: snap.longitude,
            angle: angle,
            asrFactor: asr,
            timeZone: snap.locationTimeZone
        )
        let next = DarPrayerEngine.next(from: prayers, now: date, timeZone: snap.locationTimeZone)
        snap.prayers = prayers
        snap.nextPrayerName = next.name
        snap.nextPrayerTime = next.time
        snap.nextPrayerRemaining = next.remaining
        snap.qiblaDegrees = DarPrayerEngine.qiblaDegrees(lat: snap.latitude, lng: snap.longitude)
        snap.hijriLabel = DarPrayerEngine.hijriLabel(for: date)
        snap.calendarRows = DarPrayerEngine.islamicCalendarRows(
            from: date,
            count: 30,
            timeZone: snap.locationTimeZone
        )
        let day = Calendar.current.ordinality(of: .day, in: .year, for: date) ?? 1
        let ayah = ayahs[day % ayahs.count]
        if snap.ayahGerman.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            snap.ayahGerman = ayah.german
            snap.ayahTranslit = ayah.translit
            snap.ayahRef = ayah.ref
        }
        snap.tadabburGerman = tadabburByReference[snap.ayahRef] ?? ""
        if snap.duaGerman.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            snap.duaTitle = "Duʿāʾ des Tages"
            snap.duaGerman = "Allah genügt uns, und Er ist der beste Sachwalter."
            snap.duaTranslit = "Ḥasbunallāhu wa niʿma l-wakīl."
            snap.duaCategory = "Tawakkul"
        }
        if snap.postTitle.isEmpty {
            snap.recommendationTitle = "Heute empfohlen"
            snap.recommendationBody = "Öffne die App für den geprüften Tagesbeitrag."
        }
        snap.updatedAt = date
        if snap.cityLabel.isEmpty {
            snap.cityLabel = "Standort wird ermittelt …"
        }
        if snap.themeId.isEmpty { snap.themeId = "salbeiElfenbein" }
        return snap
    }
}

import Foundation

/// All remotely managed content areas use the same catalog contract.
nonisolated enum RemoteContentArea: String, CaseIterable, Codable, Sendable {
    case quranTadabbur = "quran/tadabbur"
    case hadith = "hadith"
    case hadithSharh = "hadith/sharh"
    case screensaver = "screensaver"
    case dua = "dua"
    case series = "series"
    case athar = "athar"

    var contentType: String {
        switch self {
        case .quranTadabbur: return "quran-tadabbur"
        case .hadith: return "hadith"
        case .hadithSharh: return "hadith-sharh"
        case .screensaver: return "screensaver"
        case .dua: return "dua"
        case .series: return "series"
        case .athar: return "athar"
        }
    }
}

nonisolated struct RemoteContentFallback: Codable, Sendable {
    let enabled: Bool
    let text: String

    init(enabled: Bool = true, text: String = "Dieser Inhalt ist derzeit nicht verfügbar.") {
        self.enabled = enabled
        self.text = text
    }
}

nonisolated struct RemoteContentCatalog: Codable, Sendable {
    let schemaVersion: String
    let contentType: String
    let contentVersion: Int?
    let entriesCount: Int
    let entriesPaths: [String]
    let entriesIndexPath: String?
    let fallback: RemoteContentFallback
    let remoteLoad: Bool
    let offlineCache: Bool
    let lastUpdated: String?
    let minAppVersion: String?

    init(
        schemaVersion: String,
        contentType: String,
        entriesCount: Int,
        entriesPaths: [String],
        entriesIndexPath: String?,
        fallback: RemoteContentFallback,
        remoteLoad: Bool,
        offlineCache: Bool,
        lastUpdated: String?,
        minAppVersion: String?
    ) {
        self.schemaVersion = schemaVersion
        self.contentType = contentType
        self.contentVersion = nil
        self.entriesCount = entriesCount
        self.entriesPaths = entriesPaths
        self.entriesIndexPath = entriesIndexPath
        self.fallback = fallback
        self.remoteLoad = remoteLoad
        self.offlineCache = offlineCache
        self.lastUpdated = lastUpdated
        self.minAppVersion = minAppVersion
    }

    init(from decoder: Decoder) throws {
        let values = try decoder.container(keyedBy: CodingKeys.self)
        schemaVersion = try values.decodeIfPresent(String.self, forKey: .schemaVersion) ?? "1.0"
        contentType = try values.decodeIfPresent(String.self, forKey: .contentType) ?? "unknown"
        contentVersion = try values.decodeFlexibleInt(forKey: .contentVersion)
        entriesCount = try values.decodeFlexibleInt(forKey: .entriesCount) ?? 0
        entriesIndexPath = try values.decodeIfPresent(String.self, forKey: .entriesIndexPath)
        let directPaths = try values.decodeIfPresent([String].self, forKey: .entriesPaths) ?? []
        if let entriesPath = try values.decodeIfPresent(String.self, forKey: .entriesPath) {
            entriesPaths = directPaths + (directPaths.contains(entriesPath) ? [] : [entriesPath])
        } else {
            entriesPaths = directPaths
        }
        fallback = try values.decodeIfPresent(RemoteContentFallback.self, forKey: .fallback) ?? RemoteContentFallback()
        remoteLoad = try values.decodeIfPresent(Bool.self, forKey: .remoteLoad) ?? true
        offlineCache = try values.decodeIfPresent(Bool.self, forKey: .offlineCache) ?? true
        lastUpdated = try values.decodeIfPresent(String.self, forKey: .lastUpdated)
        minAppVersion = try values.decodeIfPresent(String.self, forKey: .minAppVersion)
    }

    private enum CodingKeys: String, CodingKey {
        case schemaVersion, contentType, contentVersion, entriesCount, entriesPaths, entriesPath
        case entriesIndexPath, fallback, remoteLoad, offlineCache, lastUpdated, minAppVersion
    }

    func encode(to encoder: Encoder) throws {
        var values = encoder.container(keyedBy: CodingKeys.self)
        try values.encode(schemaVersion, forKey: .schemaVersion)
        try values.encode(contentType, forKey: .contentType)
        try values.encodeIfPresent(contentVersion, forKey: .contentVersion)
        try values.encode(entriesCount, forKey: .entriesCount)
        try values.encode(entriesPaths, forKey: .entriesPaths)
        try values.encodeIfPresent(entriesIndexPath, forKey: .entriesIndexPath)
        try values.encode(fallback, forKey: .fallback)
        try values.encode(remoteLoad, forKey: .remoteLoad)
        try values.encode(offlineCache, forKey: .offlineCache)
        try values.encodeIfPresent(lastUpdated, forKey: .lastUpdated)
        try values.encodeIfPresent(minAppVersion, forKey: .minAppVersion)
    }

    var allDataPaths: [String] {
        var result = entriesPaths
        if let entriesIndexPath, !entriesIndexPath.isEmpty, !result.contains(entriesIndexPath) {
            result.append(entriesIndexPath)
        }
        return result.filter { !$0.isEmpty }.reduce(into: []) { paths, path in
            if !paths.contains(path) {
                paths.append(path)
            }
        }
    }

    var isValid: Bool {
        !schemaVersion.isEmpty &&
        !contentType.isEmpty &&
        entriesCount >= 0 &&
        allDataPaths.allSatisfy { !$0.hasPrefix("/") && !$0.contains("..") }
    }
}

private extension KeyedDecodingContainer {
    nonisolated func decodeFlexibleInt(forKey key: Key) throws -> Int? {
        if let value = try decodeIfPresent(Int.self, forKey: key) {
            return value
        }
        if let value = try decodeIfPresent(String.self, forKey: key) {
            return Int(value)
        }
        return nil
    }
}

nonisolated enum RemoteContentEnvironment: Sendable {
    case production
    case staging

    static var current: Self {
        #if DEBUG
        if UserDefaults.standard.bool(forKey: "DarRemoteContentStaging") {
            return .staging
        }
        #endif
        return .production
    }

    var rootURL: URL {
        switch self {
        case .production:
            return URL(string: "https://dar-al-tawhid.de/apple-tv")!
        case .staging:
            return URL(string: "https://raw.githubusercontent.com/Sero91ak/dar-al-tawhid-site/apple-tv-hadith-staging/apple-tv")!
        }
    }

    var candidateRoots: [URL] {
        switch self {
        case .production:
            return [
                URL(string: "https://dar-al-tawhid.de/apple-tv")!,
                URL(string: "https://raw.githubusercontent.com/Sero91ak/dar-al-tawhid-site/main/apple-tv")!,
                URL(string: "https://raw.githubusercontent.com/Sero91ak/dar-al-tawhid-site/apple-tv-hadith-staging/apple-tv")!
            ]
        case .staging:
            return [rootURL]
        }
    }
}

nonisolated struct RemoteContentRefreshResult: Sendable {
    let area: RemoteContentArea
    let catalog: RemoteContentCatalog?
    let loadedPaths: [String]
    let failedPaths: [String]
    let usedOfflineCache: Bool
}

/// One actor owns catalog fetching, validation and disk persistence for every content area.
///
/// A refresh is additive: a bad or missing remote file never removes a previously
/// cached file. This makes partial deployments and temporary network failures safe.
actor RemoteContentService {
    static let shared = RemoteContentService()

    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()
    private let fileManager = FileManager.default
    private var catalogMemory: [RemoteContentArea: RemoteContentCatalog] = [:]
    private var refreshTasks: [RemoteContentArea: Task<RemoteContentRefreshResult, Never>] = [:]

    func refreshAll() async {
        await withTaskGroup(of: Void.self) { group in
            for area in RemoteContentArea.allCases {
                group.addTask {
                    _ = await self.refresh(area: area)
                }
            }
        }
    }

    func refresh(area: RemoteContentArea) async -> RemoteContentRefreshResult {
        if let task = refreshTasks[area] {
            return await task.value
        }

        let task = Task { [weak self] in
            guard let self else {
                return RemoteContentRefreshResult(area: area, catalog: nil, loadedPaths: [], failedPaths: [], usedOfflineCache: true)
            }
            return await self.performRefresh(area: area)
        }
        refreshTasks[area] = task
        let result = await task.value
        refreshTasks[area] = nil
        return result
    }

    func catalog(for area: RemoteContentArea) async -> RemoteContentCatalog? {
        if let catalog = catalogMemory[area] {
            return catalog
        }
        if let cached = loadCachedCatalog(for: area) {
            catalogMemory[area] = cached
            return cached
        }
        return nil
    }

    /// Returns cached and/or newly downloaded JSON payloads in catalog order.
    /// Consumers decode each payload into their own domain model.
    func loadPayloads(for area: RemoteContentArea) async -> [Data] {
        let result = await refresh(area: area)
        guard let catalog = result.catalog else { return [] }
        return catalog.allDataPaths.compactMap { path in
            loadCachedPayload(path: path, area: area)
        }
    }

    func loadPayload<T: Decodable>(_ type: T.Type, path: String, area: RemoteContentArea) async -> T? {
        guard let data = loadCachedPayload(path: path, area: area) else { return nil }
        return try? decoder.decode(type, from: data)
    }

    private func performRefresh(area: RemoteContentArea) async -> RemoteContentRefreshResult {
        let cachedCatalog = await catalog(for: area)
        var catalog = cachedCatalog
        var usedOfflineCache = false

        if let remoteCatalog = try? await fetchCatalog(for: area), remoteCatalog.isValid {
            if cachedCatalog == nil || isNewer(remoteCatalog, than: cachedCatalog!) {
                // Keep the remote catalog staged in memory until every payload
                // has been downloaded and validated successfully.
                catalog = remoteCatalog
            }
        } else {
            usedOfflineCache = true
        }

        guard let catalog, catalog.isValid else {
            return RemoteContentRefreshResult(area: area, catalog: nil, loadedPaths: [], failedPaths: [], usedOfflineCache: true)
        }

        guard catalog.remoteLoad else {
            return RemoteContentRefreshResult(area: area, catalog: catalog, loadedPaths: [], failedPaths: [], usedOfflineCache: usedOfflineCache)
        }

        var loadedPaths: [String] = []
        var failedPaths: [String] = []
        await withTaskGroup(of: (String, Data?).self) { group in
            for path in catalog.allDataPaths {
                group.addTask {
                    do {
                        let data = try await self.fetchData(for: area, path: path)
                        _ = try JSONSerialization.jsonObject(with: data)
                        return (path, data)
                    } catch {
                        return (path, nil)
                    }
                }
            }

            for await (path, data) in group {
                if let data {
                    self.savePayload(data, path: path, area: area)
                    loadedPaths.append(path)
                } else if self.loadCachedPayload(path: path, area: area) != nil {
                    loadedPaths.append(path)
                } else {
                    failedPaths.append(path)
                }
            }
        }

        var activeCatalog = catalog
        if failedPaths.isEmpty,
           cachedCatalog == nil || isNewer(catalog, than: cachedCatalog!) {
            // Payloads are complete before the catalog pointer is replaced.
            // A failed deployment therefore leaves the previous snapshot active.
            saveCatalog(catalog, for: area)
            catalogMemory[area] = catalog
        } else if !failedPaths.isEmpty,
                  let cachedCatalog {
            activeCatalog = cachedCatalog
        }

        if !failedPaths.isEmpty {
            log("Remote \(area.rawValue): unavailable paths \(failedPaths.joined(separator: ", "))")
        }
        return RemoteContentRefreshResult(
            area: area,
            catalog: activeCatalog,
            loadedPaths: loadedPaths.sorted(),
            failedPaths: failedPaths.sorted(),
            usedOfflineCache: usedOfflineCache || loadedPaths.count != activeCatalog.allDataPaths.count
        )
    }

    private func fetchCatalog(for area: RemoteContentArea) async throws -> RemoteContentCatalog {
        var lastError: Error = URLError(.badServerResponse)
        for root in RemoteContentEnvironment.current.candidateRoots {
            do {
                let data = try await fetchData(url: root
                    .appendingPathComponent(area.rawValue)
                    .appendingPathComponent("catalog.json"))
                let catalog = try decoder.decode(RemoteContentCatalog.self, from: data)
                guard catalog.isValid else { throw URLError(.cannotParseResponse) }
                return catalog
            } catch {
                lastError = error
            }
        }
        throw lastError
    }

    private func fetchData(for area: RemoteContentArea, path: String) async throws -> Data {
        var lastError: Error = URLError(.badServerResponse)
        for root in RemoteContentEnvironment.current.candidateRoots {
            do {
                return try await fetchData(url: root
                    .appendingPathComponent(area.rawValue)
                    .appendingPathComponent(path))
            } catch {
                lastError = error
            }
        }
        throw lastError
    }

    private func fetchData(url: URL) async throws -> Data {
        var request = URLRequest(url: url)
        request.cachePolicy = .reloadIgnoringLocalCacheData
        request.setValue("no-cache", forHTTPHeaderField: "Cache-Control")
        request.timeoutInterval = 15
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
        return data
    }

    private func isNewer(_ remote: RemoteContentCatalog, than local: RemoteContentCatalog) -> Bool {
        if let remoteVersion = remote.contentVersion,
           let localVersion = local.contentVersion,
           remoteVersion != localVersion {
            return remoteVersion > localVersion
        }

        if let remoteDate = parsedDate(remote.lastUpdated),
           let localDate = parsedDate(local.lastUpdated),
           remoteDate != localDate {
            return remoteDate > localDate
        }

        return remote.entriesCount != local.entriesCount ||
            remote.allDataPaths != local.allDataPaths ||
            remote.contentVersion != local.contentVersion
    }

    private func parsedDate(_ value: String?) -> Date? {
        guard let value else { return nil }
        let formatter = ISO8601DateFormatter()
        return formatter.date(from: value)
    }

    private func validateJSON(_ data: Data) throws {
        _ = try JSONSerialization.jsonObject(with: data)
    }

    private func cacheDirectory(for area: RemoteContentArea) -> URL {
        let root = fileManager.urls(for: .cachesDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("DarAlTawhidRemoteContent", isDirectory: true)
            .appendingPathComponent(area.rawValue.replacingOccurrences(of: "/", with: "-"), isDirectory: true)
        try? fileManager.createDirectory(at: root, withIntermediateDirectories: true)
        return root
    }

    private func catalogURL(for area: RemoteContentArea) -> URL {
        cacheDirectory(for: area).appendingPathComponent("catalog.json")
    }

    private func payloadURL(path: String, area: RemoteContentArea) -> URL {
        let safeName = path.replacingOccurrences(of: "/", with: "__")
        return cacheDirectory(for: area).appendingPathComponent(safeName)
    }

    private func saveCatalog(_ catalog: RemoteContentCatalog, for area: RemoteContentArea) {
        guard let data = try? encoder.encode(catalog) else { return }
        try? data.write(to: catalogURL(for: area), options: .atomic)
    }

    private func loadCachedCatalog(for area: RemoteContentArea) -> RemoteContentCatalog? {
        guard let data = try? Data(contentsOf: catalogURL(for: area)),
              let catalog = try? decoder.decode(RemoteContentCatalog.self, from: data),
              catalog.isValid else {
            return nil
        }
        return catalog
    }

    private func savePayload(_ data: Data, path: String, area: RemoteContentArea) {
        try? data.write(to: payloadURL(path: path, area: area), options: .atomic)
    }

    private func loadCachedPayload(path: String, area: RemoteContentArea) -> Data? {
        try? Data(contentsOf: payloadURL(path: path, area: area))
    }

    private func log(_ message: String) {
        #if DEBUG
        print("[DAR][RemoteContent] (message)")
        #endif
    }
}


// Restored standard widget dependency: Shared/DarWidgetRemote.swift

// Restored standard widget dependency: Shared/DarWidgetTheme.swift

import SwiftUI
import Foundation

enum DarWidgetRemote {
    private struct DailyFile: Decodable {
        let recommendation: Item?
        let dua: Item?
        struct Item: Decodable {
            let id: String?
            let title: String?
            let snippet: String?
            let category: String?
            let scholar: String?
            let file: String?
            let source: String?
        }
    }

    struct LiveContent {
        var postId: String
        var postTitle: String
        var postSnippet: String
        var postCategory: String
        var postSource: String
        var duaId: String
        var duaTitle: String
        var duaGerman: String
        var duaCategory: String
        var duaSource: String
    }

    static func fetchDaily() async -> LiveContent? {
        guard let url = URL(string: "https://dar-al-tawhid.de/content/updates/daily.json") else { return nil }
        var request = URLRequest(url: url, timeoutInterval: 8)
        request.cachePolicy = .reloadIgnoringLocalCacheData
        do {
            let (data, _) = try await URLSession.shared.data(for: request)
            let file = try JSONDecoder().decode(DailyFile.self, from: data)
            var postSource = file.recommendation?.source ?? ""
            if postSource.isEmpty, let md = file.recommendation?.file, !md.isEmpty {
                postSource = await fetchFrontmatter(from: "https://dar-al-tawhid.de/content/posts/\(md)", keys: ["source", "src"]) ?? ""
            }
            var duaText = file.dua?.snippet ?? ""
            var duaSource = file.dua?.source ?? ""
            if let duaId = file.dua?.id, !duaId.isEmpty {
                let duaURL = "https://dar-al-tawhid.de/content/duas/\(duaId).md"
                if let fullText = await fetchDocumentBody(from: duaURL), !fullText.isEmpty {
                    duaText = fullText
                }
                if duaSource.isEmpty {
                    duaSource = await fetchFrontmatter(
                        from: duaURL,
                        keys: ["src", "source", "reference", "ref", "quelle"]
                    ) ?? ""
                }
            }
            return LiveContent(
                postId: file.recommendation?.id ?? "",
                postTitle: file.recommendation?.title ?? "",
                postSnippet: file.recommendation?.snippet ?? "",
                postCategory: [file.recommendation?.category, file.recommendation?.scholar].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " · "),
                postSource: DarSourceFormat.display(postSource, fallback: [file.recommendation?.scholar, file.recommendation?.category].compactMap { $0 }.joined(separator: " · ")),
                duaId: file.dua?.id ?? "",
                duaTitle: file.dua?.title ?? "Duʿāʾ des Tages",
                duaGerman: cleanedText(duaText),
                duaCategory: file.dua?.category ?? "",
                duaSource: DarSourceFormat.display(duaSource, fallback: file.dua?.category ?? "")
            )
        } catch {
            return nil
        }
    }

    static func applyLive(_ live: LiveContent, to snap: DarWidgetSnapshot) -> DarWidgetSnapshot {
        var next = snap
        if !live.postTitle.isEmpty {
            next.postTitle = live.postTitle
            next.postSnippet = live.postSnippet
            next.postId = live.postId
            next.postCategory = live.postCategory
            next.postSource = live.postSource
            next.recommendationTitle = "Heute empfohlen"
            next.recommendationBody = live.postSnippet.isEmpty ? live.postTitle : live.postSnippet
        }
        if !live.duaGerman.isEmpty {
            next.duaTitle = live.duaTitle
            next.duaGerman = live.duaGerman
            next.duaId = live.duaId
            next.duaCategory = live.duaCategory
            next.duaSource = live.duaSource
        }
        return next
    }

    private static func fetchFrontmatter(from urlString: String, keys: [String]) async -> String? {
        guard let url = URL(string: urlString) else { return nil }
        var request = URLRequest(url: url, timeoutInterval: 8)
        request.cachePolicy = .reloadIgnoringLocalCacheData
        guard let (data, response) = try? await URLSession.shared.data(for: request),
              let http = response as? HTTPURLResponse,
              (200..<300).contains(http.statusCode),
              let text = String(data: data, encoding: .utf8) else { return nil }
        let block = frontmatter(in: text)
        for key in keys {
            if let value = yamlValue(key, in: block), !value.isEmpty {
                return value
            }
        }
        return nil
    }

    private static func fetchDocumentBody(from urlString: String) async -> String? {
        guard let url = URL(string: urlString) else { return nil }
        var request = URLRequest(url: url, timeoutInterval: 8)
        request.cachePolicy = .reloadIgnoringLocalCacheData
        guard let (data, response) = try? await URLSession.shared.data(for: request),
              let http = response as? HTTPURLResponse,
              (200..<300).contains(http.statusCode),
              let text = String(data: data, encoding: .utf8) else { return nil }

        guard text.hasPrefix("---") else {
            return text.trimmingCharacters(in: .whitespacesAndNewlines)
        }
        let rest = text.dropFirst(3)
        guard let end = rest.range(of: "\n---") else {
            return text.trimmingCharacters(in: .whitespacesAndNewlines)
        }
        return String(rest[end.upperBound...]).trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private static func cleanedText(_ value: String) -> String {
        value
            .replacingOccurrences(of: "...", with: "")
            .replacingOccurrences(of: "…", with: "")
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private static func frontmatter(in text: String) -> String {
        guard text.hasPrefix("---") else { return "" }
        let rest = text.dropFirst(3)
        guard let end = rest.range(of: "\n---") else { return String(rest) }
        return String(rest[..<end.lowerBound])
    }

    private static func yamlValue(_ key: String, in yaml: String) -> String? {
        for line in yaml.split(separator: "\n") {
            let raw = String(line)
            guard raw.trimmingCharacters(in: .whitespaces).hasPrefix("\(key):") else { continue }
            var value = raw.split(separator: ":", maxSplits: 1).dropFirst().joined(separator: ":")
            value = value.trimmingCharacters(in: .whitespacesAndNewlines)
            if value.hasPrefix("\"") && value.hasSuffix("\"") && value.count >= 2 {
                value = String(value.dropFirst().dropLast())
            }
            return value
        }
        return nil
    }
}

// Restored standard widget dependency: Shared/DarDeepLink.swift
import Foundation

enum DarDeepLink {
    static let scheme = "daraltawhid"

    enum Destination: String {
        case home
        case prayer
        case qibla
        case quran
        case duas
        case calendar
        case more
        case setup
        case search
        case jummah

        var webHash: String {
            switch self {
            case .home: return "#home"
            case .prayer, .qibla: return "#prayer"
            case .quran: return "#quran/tadabbur"
            case .duas: return "#duas"
            case .calendar: return "#calendar"
            case .more, .setup: return "#more"
            case .search: return "#home"
            case .jummah: return "#jummah"
            }
        }

        var openHint: String {
            switch self {
            case .qibla: return "qibla"
            case .calendar: return "calendar"
            case .setup: return "setup"
            case .search: return "search"
            default: return ""
            }
        }

        var url: URL {
            URL(string: "\(DarDeepLink.scheme)://\(rawValue)")!
        }
    }

    static func inAppURL(for source: URL) -> URL {
        var allowed = CharacterSet.urlQueryAllowed
        allowed.remove(charactersIn: "&+=?#")
        let encoded = source.absoluteString.addingPercentEncoding(withAllowedCharacters: allowed) ?? source.absoluteString
        return URL(string: "\(scheme)://in-app?src=\(encoded)") ?? Destination.home.url
    }

    static func destination(from url: URL) -> Destination {
        if url.scheme == scheme {
            let host = url.host ?? url.path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
            if host == "in-app" {
                let items = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems ?? []
                if let encoded = items.first(where: { $0.name == "src" || $0.name == "u" })?.value,
                   let decoded = encoded.removingPercentEncoding,
                   let nested = URL(string: decoded) {
                    return destination(from: nested)
                }
                return .home
            }
            return Destination(rawValue: host) ?? .home
        }
        if let fragment = url.fragment?.lowercased() {
            let head = fragment.split(separator: "/").first.map(String.init) ?? fragment
            if let dest = Destination(rawValue: head) { return dest }
            if head.contains("setup") || head.contains("einrichtung") || head.contains("settings") || head.contains("einstellung") { return .setup }
            if head.contains("qibla") { return .qibla }
            if head.contains("quran") { return .quran }
            if head.contains("dua") { return .duas }
            if head.contains("calendar") || head.contains("kalender") || head.contains("hijri") || head.contains("hidschra") { return .calendar }
            if head.contains("prayer") || head.contains("gebet") { return .prayer }
        }
        return .home
    }
}

enum DarQuickActions {
    private static let lock = NSLock()
    private static var stored: DarDeepLink.Destination?

    static func set(_ destination: DarDeepLink.Destination) {
        lock.lock()
        stored = destination
        lock.unlock()
        DarWidgetStore.setPendingDestination(destination)
    }

    static func peek() -> DarDeepLink.Destination? {
        lock.lock()
        let value = stored
        lock.unlock()
        return value
    }

    static func consume() -> DarDeepLink.Destination? {
        lock.lock()
        let value = stored
        stored = nil
        lock.unlock()
        return value ?? DarWidgetStore.consumePendingDestination()
    }
}



struct DarWidgetPalette {
    var id: String
    var ink: Color
    var panel: Color
    var gold: Color
    var cream: Color
    var muted: Color
    var line: Color
}

enum DarWidgetTheme {
    static func palette(for snap: DarWidgetSnapshot) -> DarWidgetPalette {
        var base = named(snap.themeId)
        if let ink = Color(hex: snap.inkHex) { base.ink = ink; base.panel = ink.opacity(0.92) }
        if let gold = Color(hex: snap.goldHex) { base.gold = gold; base.line = gold.opacity(0.28) }
        if let cream = Color(hex: snap.textHex) { base.cream = cream }
        if let muted = Color(hex: snap.mutedHex) { base.muted = muted }
        return base
    }

    private static func named(_ id: String) -> DarWidgetPalette {
        switch id {
        case "light":
            return DarWidgetPalette(id: id,
                ink: Color(hex: "#F7F0DF")!, panel: Color(hex: "#FFF8EB")!,
                gold: Color(hex: "#8A6530")!, cream: Color(hex: "#2F2418")!,
                muted: Color(hex: "#6B5D47")!, line: Color(hex: "#8A6530")!.opacity(0.28))
        case "salbeiElfenbein", "salbei-elfenbein", "sage-ivory":
            return DarWidgetPalette(
                id: id,
                ink: Color(hex: "#B0BFA3")!,
                panel: Color(hex: "#FAF5E6")!,
                gold: Color(hex: "#7B6338")!,
                cream: Color(hex: "#1B211A")!,
                muted: Color(hex: "#64705F")!,
                line: Color(hex: "#7B6338")!.opacity(0.28)
            )
        case "soft":
            return DarWidgetPalette(id: id,
                ink: Color(hex: "#F2E6E2")!, panel: Color(hex: "#FFF8F1")!,
                gold: Color(hex: "#7D5368")!, cream: Color(hex: "#34232C")!,
                muted: Color(hex: "#715F65")!, line: Color(hex: "#7D5368")!.opacity(0.26))
        case "royal":
            return DarWidgetPalette(id: id,
                ink: Color(hex: "#07162C")!, panel: Color(hex: "#0D1F3D")!,
                gold: Color(hex: "#EFD78E")!, cream: Color(hex: "#FFF2C6")!,
                muted: Color(hex: "#CBBF9F")!, line: Color(hex: "#EFD78E")!.opacity(0.28))
        case "dar-al-layl":
            return DarWidgetPalette(id: id,
                ink: Color(hex: "#090D0B")!, panel: Color(hex: "#0E1310")!,
                gold: Color(hex: "#D8C18B")!, cream: Color(hex: "#F1EDE3")!,
                muted: Color(hex: "#8C938C")!, line: Color(hex: "#A88B4F")!.opacity(0.22))
        case "aurora":
            return DarWidgetPalette(id: id,
                ink: Color(hex: "#050C09")!, panel: Color(hex: "#071A14")!,
                gold: Color(hex: "#E7D59D")!, cream: Color(hex: "#F6F1E3")!,
                muted: Color(hex: "#A8B8B0")!, line: Color(hex: "#D8BE7A")!.opacity(0.24))
        case "bordeaux":
            return DarWidgetPalette(id: id,
                ink: Color(hex: "#0B0608")!, panel: Color(hex: "#150B0E")!,
                gold: Color(hex: "#D6BE84")!, cream: Color(hex: "#F7EED8")!,
                muted: Color(hex: "#D1C1A8")!, line: Color(hex: "#D6BE84")!.opacity(0.26))
        default:
            return named("salbeiElfenbein")
        }
    }
}

extension Color {
    init?(hex: String) {
        var raw = hex.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        if raw.hasPrefix("#") { raw.removeFirst() }
        guard raw.count == 6, let value = UInt64(raw, radix: 16) else { return nil }
        self.init(
            red: Double((value >> 16) & 0xFF) / 255,
            green: Double((value >> 8) & 0xFF) / 255,
            blue: Double(value & 0xFF) / 255
        )
    }
}


// Restored standard widget views. The widget-target migration had removed these
// registrations from the active extension, which left the iPad gallery with only
// a single placeholder-style card.

import SwiftUI
import WidgetKit

struct DarEntry: TimelineEntry {
    let date: Date
    let snapshot: DarWidgetSnapshot
}

private enum Face {
    static func brand(_ n: CGFloat) -> Font { .system(size: n, weight: .semibold) }
    static func hero(_ n: CGFloat) -> Font { .system(size: n, weight: .medium, design: .rounded) }
    static func title(_ n: CGFloat) -> Font { .system(size: n, weight: .semibold, design: .serif) }
    static func text(_ n: CGFloat) -> Font { .system(size: n, weight: .regular, design: .serif) }
    static func ui(_ n: CGFloat) -> Font { .system(size: n, weight: .medium) }
    static func micro() -> Font { .system(size: 9, weight: .semibold) }
}

struct WidgetChrome<Content: View>: View {
    let palette: DarWidgetPalette
    let content: Content

    init(palette: DarWidgetPalette, @ViewBuilder content: () -> Content) {
        self.palette = palette
        self.content = content()
    }

    var body: some View {
        content
            .padding(familyPadding)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .widgetBackground(palette)
    }

    private var familyPadding: CGFloat { 10 }
}

struct BrandLine: View {
    let palette: DarWidgetPalette
    let title: String

    var body: some View {
        HStack(spacing: 6) {
            Text("DAR AL TAWḤID")
                .font(Face.brand(10))
                .tracking(0.4)
                .foregroundStyle(palette.gold)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            Text(title)
                .font(Face.micro())
                .foregroundStyle(palette.muted)
                .lineLimit(1)
                .minimumScaleFactor(0.75)
                .padding(.horizontal, 7)
                .padding(.vertical, 3)
                .background(palette.gold.opacity(0.12))
                .clipShape(Capsule())
            Spacer(minLength: 0)
        }
    }
}

private struct DarAura: View {
    let palette: DarWidgetPalette
    var body: some View {
        ZStack {
            palette.ink
            LinearGradient(
                colors: [palette.gold.opacity(0.14), Color.clear],
                startPoint: .topLeading,
                endPoint: .center
            )
            LinearGradient(
                colors: [Color.clear, palette.panel.opacity(0.55)],
                startPoint: .center,
                endPoint: .bottom
            )
        }
    }
}

extension View {
    @ViewBuilder
    func widgetBackground(_ palette: DarWidgetPalette) -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            containerBackground(for: .widget) { DarAura(palette: palette) }
        } else {
            background(DarAura(palette: palette))
        }
    }
}

private struct CountdownRing: View {
    let progress: Double
    let palette: DarWidgetPalette
    let size: CGFloat

    var body: some View {
        ZStack {
            Circle()
                .stroke(palette.gold.opacity(0.14), lineWidth: 4)
            Circle()
                .trim(from: 0, to: min(1, max(0.04, progress)))
                .stroke(
                    palette.gold,
                    style: StrokeStyle(lineWidth: 4, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
        }
        .frame(width: size, height: size)
    }
}

private struct PrayerChip: View {
    let slot: DarPrayerSlot
    let active: Bool
    let palette: DarWidgetPalette

    var body: some View {
        HStack {
            Text(slot.name)
                .font(Face.ui(12.5))
            Spacer()
            Text(slot.time)
                .font(Face.ui(12.5))
        }
        .foregroundStyle(active ? palette.gold : palette.cream.opacity(0.78))
        .padding(.horizontal, active ? 8 : 0)
        .padding(.vertical, active ? 5 : 2)
        .background(active ? palette.gold.opacity(0.14) : Color.clear)
        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
    }
}

private enum PrayerLock {
    static func shortName(_ name: String) -> String {
        let n = name.lowercased()
        if n.contains("fajr") { return "FAJR" }
        if n.contains("dhuhr") || n.contains("zuhr") { return "DHUHR" }
        if n.contains("asr") { return "ASR" }
        if n.contains("maghrib") { return "MGRB" }
        if n.contains("isha") { return "ISHA" }
        if n.contains("shur") || n.contains("sunrise") || n.contains("sonne") { return "SHUR" }
        return String(name.prefix(5)).uppercased()
    }

    static func symbol(_ name: String) -> String {
        let n = name.lowercased()
        if n.contains("fajr") { return "sunrise.fill" }
        if n.contains("dhuhr") { return "sun.max.fill" }
        if n.contains("asr") { return "sun.haze.fill" }
        if n.contains("maghrib") { return "sunset.fill" }
        if n.contains("isha") { return "moon.stars.fill" }
        return "moon.stars.fill"
    }
}

struct LockCirclePrayer: View {
    let snap: DarWidgetSnapshot
    let date: Date

    var body: some View {
        let progress = DarPrayerEngine.intervalProgress(from: snap.prayers, now: date)
        ZStack {
            AccessoryWidgetBackground()
            Gauge(value: min(1, max(0.04, progress))) {
                EmptyView()
            }
            .gaugeStyle(.accessoryCircularCapacity)
            .widgetAccentable()
            VStack(spacing: 0) {
                Image(systemName: PrayerLock.symbol(snap.nextPrayerName))
                    .font(.system(size: 9, weight: .semibold))
                    .widgetAccentable()
                Text(PrayerLock.shortName(snap.nextPrayerName))
                    .font(.system(size: 9, weight: .heavy, design: .rounded))
                    .tracking(0.4)
                    .lineLimit(1)
                    .minimumScaleFactor(0.6)
                    .widgetAccentable()
                Text(snap.nextPrayerTime)
                    .font(.system(size: 11, weight: .bold, design: .rounded).monospacedDigit())
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
            }
            .offset(y: 1)
        }
        .widgetURL(DarDeepLink.Destination.prayer.url)
    }
}

struct LockBarPrayer: View {
    let snap: DarWidgetSnapshot
    let date: Date

    var body: some View {
        let progress = DarPrayerEngine.intervalProgress(from: snap.prayers, now: date)
        HStack(spacing: 8) {
            Gauge(value: min(1, max(0.04, progress))) {
                Image(systemName: PrayerLock.symbol(snap.nextPrayerName))
            }
            .gaugeStyle(.accessoryCircularCapacity)
            .frame(width: 36, height: 36)
            .widgetAccentable()
            VStack(alignment: .leading, spacing: 1) {
                Text(snap.nextPrayerName)
                    .font(.system(size: 13, weight: .semibold, design: .serif))
                    .lineLimit(1)
                    .minimumScaleFactor(0.75)
                    .widgetAccentable()
                Text("\(snap.nextPrayerTime)  ·  \(snap.nextPrayerRemaining)")
                    .font(.system(size: 11, weight: .medium, design: .rounded).monospacedDigit())
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
            }
            Spacer(minLength: 0)
        }
        .widgetURL(DarDeepLink.Destination.prayer.url)
    }
}

struct LockInlinePrayer: View {
    let snap: DarWidgetSnapshot

    var body: some View {
        ViewThatFits(in: .horizontal) {
            Label("\(snap.nextPrayerName)  \(snap.nextPrayerTime)  ·  \(snap.nextPrayerRemaining)", systemImage: PrayerLock.symbol(snap.nextPrayerName))
            Label("\(snap.nextPrayerName)  \(snap.nextPrayerTime)", systemImage: PrayerLock.symbol(snap.nextPrayerName))
            Text("\(PrayerLock.shortName(snap.nextPrayerName)) \(snap.nextPrayerTime)")
        }
        .widgetAccentable()
        .widgetURL(DarDeepLink.Destination.prayer.url)
    }
}

struct LockBarPrayerStrip: View {
    let snap: DarWidgetSnapshot

    var body: some View {
        let slots = snap.prayers.filter { $0.id != "sunrise" }.prefix(5)
        HStack(spacing: 5) {
            ForEach(Array(slots)) { slot in
                VStack(spacing: 1) {
                    Text(PrayerLock.shortName(slot.name))
                        .font(.system(size: 8, weight: .bold, design: .rounded))
                        .lineLimit(1)
                        .minimumScaleFactor(0.6)
                        .opacity(slot.name == snap.nextPrayerName ? 1 : 0.55)
                    Text(slot.time)
                        .font(.system(size: 10, weight: .semibold, design: .rounded).monospacedDigit())
                        .lineLimit(1)
                        .minimumScaleFactor(0.65)
                        .opacity(slot.name == snap.nextPrayerName ? 1 : 0.55)
                }
                .frame(maxWidth: .infinity)
            }
        }
        .widgetURL(DarDeepLink.Destination.prayer.url)
    }
}

struct PrayerTimerView: View {
    let entry: DarEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        let p = DarWidgetTheme.palette(for: entry.snapshot)
        let snap = entry.snapshot
        if family == .accessoryCircular {
            LockCirclePrayer(snap: snap, date: entry.date)
        } else if family == .accessoryRectangular {
            LockBarPrayer(snap: snap, date: entry.date)
        } else if family == .accessoryInline {
            LockInlinePrayer(snap: snap)
        } else {
        let slots = snap.prayers.filter { $0.id != "sunrise" }
        let progress = DarPrayerEngine.intervalProgress(from: snap.prayers, now: entry.date)
        WidgetChrome(palette: p) {
            VStack(alignment: .leading, spacing: 8) {
                BrandLine(palette: p, title: "Gebet")
                if family == .systemSmall {
                    HStack(spacing: 8) {
                        ZStack {
                            CountdownRing(progress: progress, palette: p, size: 64)
                            VStack(spacing: 0) {
                                Text(snap.nextPrayerName)
                                    .font(Face.micro())
                                    .foregroundStyle(p.muted)
                                    .lineLimit(1)
                                    .minimumScaleFactor(0.7)
                                Text(snap.nextPrayerTime)
                                    .font(Face.hero(15))
                                    .foregroundStyle(p.gold)
                                    .lineLimit(1)
                                    .minimumScaleFactor(0.7)
                            }
                        }
                        VStack(alignment: .leading, spacing: 3) {
                            Text(snap.nextPrayerRemaining)
                                .font(Face.ui(12))
                                .foregroundStyle(p.cream)
                                .lineLimit(2)
                                .minimumScaleFactor(0.75)
                            Text(snap.cityLabel)
                                .font(Face.micro())
                                .foregroundStyle(p.muted)
                                .lineLimit(2)
                                .minimumScaleFactor(0.7)
                        }
                    }
                } else {
                    HStack(alignment: .center, spacing: 14) {
                        ZStack {
                            CountdownRing(progress: progress, palette: p, size: family == .systemLarge || extraLarge ? 96 : 84)
                            VStack(spacing: 1) {
                                Text(snap.nextPrayerName)
                                    .font(Face.ui(11))
                                    .foregroundStyle(p.muted)
                                    .lineLimit(1)
                                Text(snap.nextPrayerTime)
                                    .font(Face.hero(extraLarge || family == .systemLarge ? 22 : 18))
                                    .foregroundStyle(p.gold)
                                    .lineLimit(1)
                                    .minimumScaleFactor(0.75)
                            }
                        }
                        VStack(alignment: .leading, spacing: 2) {
                            ForEach(family == .systemMedium ? slots : snap.prayers) { slot in
                                PrayerChip(slot: slot, active: slot.name == snap.nextPrayerName, palette: p)
                            }
                        }
                    }
                }
            }
        }
        .widgetURL(DarDeepLink.Destination.prayer.url)
        }
    }

    private var extraLarge: Bool {
        if #available(iOSApplicationExtension 17.0, *) {
            return family == .systemExtraLarge
        }
        return false
    }
}

struct PrayerListView: View {
    let entry: DarEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        let p = DarWidgetTheme.palette(for: entry.snapshot)
        let snap = entry.snapshot
        if family == .accessoryRectangular {
            LockBarPrayerStrip(snap: snap)
        } else if family == .accessoryInline {
            let slots = snap.prayers.filter { $0.id != "sunrise" }.prefix(3)
            let line = slots.map { "\(PrayerLock.shortName($0.name)) \($0.time)" }.joined(separator: " · ")
            Text(line)
                .widgetAccentable()
                .widgetURL(DarDeepLink.Destination.prayer.url)
        } else {
        let slots = family == .systemSmall ? snap.prayers.filter { $0.id != "sunrise" } : snap.prayers
        WidgetChrome(palette: p) {
            VStack(alignment: .leading, spacing: 6) {
                BrandLine(palette: p, title: "Zeiten")
                ForEach(slots) { slot in
                    PrayerChip(slot: slot, active: slot.name == snap.nextPrayerName, palette: p)
                }
                if family != .systemSmall {
                    Text("\(snap.nextPrayerRemaining)  ·  \(snap.cityLabel)")
                        .font(Face.ui(11))
                        .foregroundStyle(p.muted)
                }
            }
        }
        .widgetURL(DarDeepLink.Destination.prayer.url)
        }
    }
}

struct PrayerDayView: View {
    let entry: DarEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        let p = DarWidgetTheme.palette(for: entry.snapshot)
        let snap = entry.snapshot
        WidgetChrome(palette: p) {
            VStack(alignment: .leading, spacing: 8) {
                BrandLine(palette: p, title: snap.cityLabel)
                if family != .systemSmall {
                    Text("\(snap.nextPrayerName)  \(snap.nextPrayerTime)")
                        .font(Face.hero(20))
                        .foregroundStyle(p.gold)
                    Text(snap.nextPrayerRemaining)
                        .font(Face.ui(12))
                        .foregroundStyle(p.muted)
                }
                let columns = family == .systemSmall ? 2 : 3
                LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: columns), spacing: 8) {
                    ForEach(snap.prayers) { slot in
                        VStack(alignment: .leading, spacing: 1) {
                            Text(slot.name)
                                .font(Face.micro())
                                .foregroundStyle(p.muted)
                            Text(slot.time)
                                .font(Face.hero(family == .systemSmall ? 17 : 19))
                                .foregroundStyle(slot.name == snap.nextPrayerName ? p.gold : p.cream)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(8)
                        .background(slot.name == snap.nextPrayerName ? p.gold.opacity(0.12) : p.gold.opacity(0.04))
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    }
                }
            }
        }
        .widgetURL(DarDeepLink.Destination.prayer.url)
    }
}

struct QiblaCompassView: View {
    let entry: DarEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        let p = DarWidgetTheme.palette(for: entry.snapshot)
        let deg = entry.snapshot.qiblaDegrees
        if family == .accessoryCircular {
            ZStack {
                AccessoryWidgetBackground()
                Image(systemName: "location.north.fill")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(.primary)
                    .rotationEffect(.degrees(deg))
            }
            .widgetURL(DarDeepLink.Destination.qibla.url)
        } else {
            WidgetChrome(palette: p) {
                VStack(alignment: .leading, spacing: 8) {
                    BrandLine(palette: p, title: "Qibla")
                    HStack(spacing: 12) {
                        ZStack {
                            Circle().stroke(p.gold.opacity(0.12), lineWidth: 8)
                            Image(systemName: "location.north.fill")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundStyle(p.gold)
                                .rotationEffect(.degrees(deg))
                        }
                        .frame(width: 64, height: 64)
                        VStack(alignment: .leading, spacing: 3) {
                            Text(String(format: "%.0f°", deg))
                                .font(Face.hero(26))
                                .foregroundStyle(p.gold)
                                .lineLimit(1)
                                .minimumScaleFactor(0.7)
                            Text("Mekka")
                                .font(Face.ui(13))
                                .foregroundStyle(p.cream)
                            Text(entry.snapshot.cityLabel)
                                .font(Face.micro())
                                .foregroundStyle(p.muted)
                                .lineLimit(2)
                                .minimumScaleFactor(0.7)
                        }
                    }
                }
            }
            .widgetURL(DarDeepLink.Destination.qibla.url)
        }
    }
}

struct TodayContentView: View {
    let entry: DarEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        let p = DarWidgetTheme.palette(for: entry.snapshot)
        let snap = entry.snapshot
        WidgetChrome(palette: p) {
            VStack(alignment: .leading, spacing: 7) {
                BrandLine(palette: p, title: "Heute")
                Text(snap.postTitle.isEmpty ? "Tagesbeitrag" : snap.postTitle)
                    .font(Face.title(family == .systemSmall ? 15 : 18))
                    .foregroundStyle(p.cream)
                    .lineLimit(family == .systemSmall ? 3 : 2)
                if family != .systemSmall {
                    Text(snap.recommendationBody)
                        .font(Face.text(14))
                        .foregroundStyle(p.muted)
                        .lineLimit(family == .systemLarge ? 5 : 3)
                }
                if family == .systemLarge {
                    Text(snap.duaGerman)
                        .font(Face.text(14))
                        .foregroundStyle(p.cream.opacity(0.9))
                        .lineLimit(3)
                }
                Spacer(minLength: 0)
                if !snap.postCategory.isEmpty {
                    Text(snap.postCategory)
                        .font(Face.micro())
                        .foregroundStyle(p.gold)
                }
            }
        }
        .widgetURL(DarDeepLink.Destination.home.url)
    }
}

struct AyahContentView: View {
    let entry: DarEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        let p = DarWidgetTheme.palette(for: entry.snapshot)
        let snap = entry.snapshot
        WidgetChrome(palette: p) {
            VStack(alignment: .leading, spacing: 7) {
                BrandLine(palette: p, title: "Āyah")
                Text(snap.ayahGerman)
                    .font(Face.text(family == .systemSmall ? 14.5 : 16.5))
                    .foregroundStyle(p.cream)
                    .lineLimit(family == .systemSmall ? 4 : 5)
                    .minimumScaleFactor(0.82)
                if family != .systemSmall, !snap.ayahTranslit.isEmpty {
                    Text(snap.ayahTranslit)
                        .font(Face.ui(12))
                        .foregroundStyle(p.muted)
                        .lineLimit(2)
                }
                Spacer(minLength: 0)
                Text(snap.ayahRef)
                    .font(Face.micro())
                    .foregroundStyle(p.gold)
            }
        }
        .widgetURL(DarDeepLink.Destination.quran.url)
    }
}

struct DuaContentView: View {
    let entry: DarEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        let p = DarWidgetTheme.palette(for: entry.snapshot)
        let snap = entry.snapshot
        WidgetChrome(palette: p) {
            VStack(alignment: .leading, spacing: 7) {
                BrandLine(palette: p, title: "Duʿāʾ")
                if family != .systemSmall {
                    Text(snap.duaTitle)
                        .font(Face.title(16))
                        .foregroundStyle(p.cream)
                        .lineLimit(2)
                }
                Text(snap.duaGerman)
                    .font(Face.text(family == .systemSmall ? 14.5 : 15.5))
                    .foregroundStyle(p.cream)
                    .lineLimit(family == .systemSmall ? 5 : 6)
                    .minimumScaleFactor(0.82)
                if family != .systemSmall, !snap.duaTranslit.isEmpty {
                    Text(snap.duaTranslit)
                        .font(Face.ui(12))
                        .foregroundStyle(p.muted)
                        .lineLimit(2)
                }
            }
        }
        .widgetURL(DarDeepLink.Destination.duas.url)
    }
}


import SwiftUI
import WidgetKit

struct DarTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> DarEntry {
        DarEntry(date: Date(), snapshot: DarDailyContent.refresh(DarWidgetStore.load()))
    }

    func getSnapshot(in context: Context, completion: @escaping (DarEntry) -> Void) {
        completion(placeholder(in: context))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<DarEntry>) -> Void) {
        Task {
            var snap = DarWidgetStore.load()
            if let live = await DarWidgetRemote.fetchDaily() {
                snap = DarWidgetRemote.applyLive(live, to: snap)
            }
            snap = DarDailyContent.refresh(snap)
            DarWidgetStore.save(snap, reload: false)
            let now = Date()
            var entries: [DarEntry] = []
            for minute in 0..<30 {
                let date = now.addingTimeInterval(Double(minute * 60))
                let liveSnap = DarDailyContent.refresh(snap, date: date)
                entries.append(DarEntry(date: date, snapshot: liveSnap))
            }
            let next = Calendar.current.date(byAdding: .minute, value: 30, to: now) ?? now.addingTimeInterval(1800)
            completion(Timeline(entries: entries, policy: .after(next)))
        }
    }
}

struct PrayerTimerWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "de.daraltawhid.widget.prayer.timer", provider: DarTimelineProvider()) { entry in
            PrayerTimerView(entry: entry)
        }
        .configurationDisplayName("DĀR AL TAWḤĪD · Nächstes Gebet")
        .description("Homescreen, über der Uhr, kleine Kreise und breite Leiste auf dem Sperrbildschirm.")
        .supportedFamilies(Self.timerFamilies)
    }

    private static var timerFamilies: [WidgetFamily] {
        var families: [WidgetFamily] = [.systemSmall, .systemMedium, .accessoryCircular, .accessoryRectangular, .accessoryInline]
        if #available(iOSApplicationExtension 17.0, *) {
            families.append(.systemExtraLarge)
        }
        return families
    }
}

struct PrayerListWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "de.daraltawhid.widget.prayer.list", provider: DarTimelineProvider()) { entry in
            PrayerListView(entry: entry)
        }
        .configurationDisplayName("DĀR AL TAWḤĪD · Gebetszeiten")
        .description("Fajr bis Isha als Liste — mittel, groß, iPad und Sperrbildschirm-Leiste.")
        .supportedFamilies(Self.listFamilies)
    }

    private static var listFamilies: [WidgetFamily] {
        var families: [WidgetFamily] = [.systemMedium, .systemLarge, .accessoryRectangular, .accessoryInline]
        if #available(iOSApplicationExtension 17.0, *) {
            families.append(.systemExtraLarge)
        }
        return families
    }
}

struct PrayerDayWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "de.daraltawhid.widget.prayer.day", provider: DarTimelineProvider()) { entry in
            PrayerDayView(entry: entry)
        }
        .configurationDisplayName("DĀR AL TAWḤĪD · Tagesgebetszeiten")
        .description("Alle Gebetszeiten des Tages als Kacheln.")
        .supportedFamilies(Self.dayFamilies)
    }

    private static var dayFamilies: [WidgetFamily] {
        var families: [WidgetFamily] = [.systemLarge]
        if #available(iOSApplicationExtension 17.0, *) {
            families.append(.systemExtraLarge)
        }
        return families
    }
}

struct QiblaWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "de.daraltawhid.widget.qibla", provider: DarTimelineProvider()) { entry in
            QiblaCompassView(entry: entry)
        }
        .configurationDisplayName("DĀR AL TAWḤĪD · Qibla")
        .description("Richtung nach Mekka vom letzten Standort. Live-Kompass nur in der App, ohne Dauermessung.")
        .supportedFamilies([.systemSmall, .accessoryCircular])
    }
}

struct TodayWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "de.daraltawhid.widget.today", provider: DarTimelineProvider()) { entry in
            TodayContentView(entry: entry)
        }
        .configurationDisplayName("DĀR AL TAWḤĪD · Heute empfohlen")
        .description("Aktueller Beitrag.")
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}

struct AyahWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "de.daraltawhid.widget.ayah", provider: DarTimelineProvider()) { entry in
            AyahContentView(entry: entry)
        }
        .configurationDisplayName("DĀR AL TAWḤĪD · Āyah des Tages")
        .description("Deutscher Wortlaut und Lautschrift.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct DuaWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "de.daraltawhid.widget.dua", provider: DarTimelineProvider()) { entry in
            DuaContentView(entry: entry)
        }
        .configurationDisplayName("DĀR AL TAWḤĪD · Duʿāʾ des Tages")
        .description("Aktuelles Bittgebet auf Deutsch.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// Restored standard widget dependency: Shared/DarPrayerEngine.swift
import Foundation

enum DarPrayerEngine {
    static let manualQiblaDegrees = 126.0

    /// Keeps the product's manual Qibla bearing unless a different value is supplied.
    static func qiblaDegrees(lat: Double, lng: Double, manualDegrees: Double? = nil) -> Double {
        _ = lat
        _ = lng
        return normalizedDegrees(manualDegrees ?? manualQiblaDegrees)
    }

    /// Calculates the true initial bearing from a location to the Kaaba.
    static func automaticQiblaDegrees(lat: Double, lng: Double) -> Double {
        let kaabaLatitude = 21.4225 * .pi / 180
        let kaabaLongitude = 39.8262 * .pi / 180
        let latitude = lat * .pi / 180
        let longitude = lng * .pi / 180
        let deltaLongitude = kaabaLongitude - longitude
        let y = sin(deltaLongitude) * cos(kaabaLatitude)
        let x = cos(latitude) * sin(kaabaLatitude)
            - sin(latitude) * cos(kaabaLatitude) * cos(deltaLongitude)
        return normalizedDegrees(atan2(y, x) * 180 / .pi)
    }

    private static func normalizedDegrees(_ degrees: Double) -> Double {
        let normalized = degrees.truncatingRemainder(dividingBy: 360)
        return normalized >= 0 ? normalized : normalized + 360
    }

    /// Same NOAA / zenith math as dar-al-tawhid.de (`sunTimeForAngle`, angle 12°, Asr factor 1).
    static func times(
        for date: Date,
        lat: Double,
        lng: Double,
        angle: Double = 12,
        asrFactor: Double = 1,
        timeZone: TimeZone = .current
    ) -> [DarPrayerSlot] {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = timeZone
        let local = cal.dateComponents([.year, .month, .day], from: date)
        guard let day = cal.date(from: local) else { return [] }
        let fajrH = sunTimeForAngle(day, lat: lat, lon: lng, angle: angle, morning: true, timeZone: timeZone)
        let sunriseH = sunTimeForAngle(day, lat: lat, lon: lng, angle: 0.833, morning: true, timeZone: timeZone)
        let maghribH = sunTimeForAngle(day, lat: lat, lon: lng, angle: 0.833, morning: false, timeZone: timeZone)
        let ishaH = sunTimeForAngle(day, lat: lat, lon: lng, angle: angle, morning: false, timeZone: timeZone)
        let dhuhrH = solarNoon(sunrise: sunriseH, sunset: maghribH)
        let asrH = asrTime(day, lat: lat, lon: lng, noon: dhuhrH, factor: asrFactor)
        return [
            DarPrayerSlot(id: "fajr", name: "Fajr", time: formatHour(fajrH)),
            DarPrayerSlot(id: "sunrise", name: "Sonnenaufgang", time: formatHour(sunriseH)),
            DarPrayerSlot(id: "dhuhr", name: "Dhuhr", time: formatHour(dhuhrH)),
            DarPrayerSlot(id: "asr", name: "ʿAṣr", time: formatHour(asrH)),
            DarPrayerSlot(id: "maghrib", name: "Maghrib", time: formatHour(maghribH)),
            DarPrayerSlot(id: "isha", name: "ʿIshāʾ", time: formatHour(ishaH))
        ]
    }

    static func next(from slots: [DarPrayerSlot], now: Date = Date(), timeZone: TimeZone = .current) -> (name: String, time: String, remaining: String) {
        let target = nextTarget(from: slots, now: now, timeZone: timeZone)
        guard let end = target.target else {
            return (target.name, target.time, "")
        }
        let seconds = max(0, Int(end.timeIntervalSince(now)))
        return (target.name, target.time, remainingLabel(from: seconds))
    }

    static func nextTarget(
        from slots: [DarPrayerSlot],
        now: Date = Date(),
        timeZone: TimeZone = .current
    ) -> (name: String, time: String, target: Date?) {
        let named = slots.filter { $0.id != "sunrise" && $0.id != "tahajjud" }
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = timeZone
        let dayStart = cal.startOfDay(for: now)

        for slot in named {
            guard let slotDate = date(for: slot, on: dayStart, timeZone: timeZone), slotDate > now else { continue }
            return (slot.name, slot.time, slotDate)
        }

        if let fajr = named.first,
           let tomorrow = cal.date(byAdding: .day, value: 1, to: dayStart),
           let slotDate = date(for: fajr, on: tomorrow, timeZone: timeZone) {
            return (fajr.name, fajr.time, slotDate)
        }
        return ("Gebet", "—", nil)
    }

    static func countdownHeadline(for prayerName: String, on date: Date = Date()) -> String {
        let isRamadan = hijriParts(for: date).month == 9
        let lower = prayerName.lowercased()
        if isRamadan && lower.contains("maghrib") { return "Iftar in" }
        if lower.contains("fajr") { return "Fajr in" }
        if lower.contains("dhuhr") || lower.contains("zuhr") { return "Dhuhr in" }
        if lower.contains("asr") || lower.contains("aṣr") { return "ʿAṣr in" }
        if lower.contains("maghrib") { return "Maghrib in" }
        if lower.contains("isha") || lower.contains("ishā") { return "ʿIshāʾ in" }
        return "\(prayerName) in"
    }

    static func sunriseTime(from slots: [DarPrayerSlot]) -> String {
        slots.first(where: { $0.id == "sunrise" })?.time ?? "--:--"
    }

    static func weekdayTag(_ date: Date) -> String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "de_DE")
        f.dateFormat = "EE dd."
        return f.string(from: date)
    }

    struct DayRow: Identifiable {
        let id: String
        let date: Date
        let tag: String
        let fajr: String
        let maghrib: String
        let duration: String
    }

    static func dayRows(
        from snap: DarWidgetSnapshot,
        start: Date = Date(),
        count: Int = 4
    ) -> [DayRow] {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = snap.locationTimeZone
        let angle = snap.fajrAngle == 0 ? 12 : snap.fajrAngle
        let asr = snap.asrFactor == 0 ? 1 : snap.asrFactor
        let isRamadan = hijriParts(for: start).month == 9
        var rows: [DayRow] = []
        for offset in 0..<count {
            guard let day = cal.date(byAdding: .day, value: offset, to: cal.startOfDay(for: start)) else { continue }
            let prayers = times(
                for: day,
                lat: snap.latitude,
                lng: snap.longitude,
                angle: angle,
                asrFactor: asr,
                timeZone: snap.locationTimeZone
            )
            let fajr = prayers.first(where: { $0.id == "fajr" })?.time ?? "--:--"
            let maghrib = prayers.first(where: { $0.id == "maghrib" })?.time ?? "--:--"
            let duration = fastDuration(fajr: fajr, maghrib: maghrib, on: day, timeZone: snap.locationTimeZone)
            rows.append(
                DayRow(
                    id: "\(offset)-\(fajr)-\(maghrib)",
                    date: day,
                    tag: weekdayTag(day),
                    fajr: fajr,
                    maghrib: maghrib,
                    duration: isRamadan ? duration : maghrib
                )
            )
        }
        return rows
    }

    static func islamicCalendarRows(from start: Date = Date(), count: Int = 30, timeZone: TimeZone = .current) -> [DarIslamicCalendarRow] {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = timeZone
        let weekdayFormatter = DateFormatter()
        weekdayFormatter.locale = Locale(identifier: "de_DE")
        weekdayFormatter.dateFormat = "EEE"
        return (0..<count).compactMap { offset in
            guard let date = calendar.date(byAdding: .day, value: offset, to: calendar.startOfDay(for: start)) else {
                return nil
            }
            let gregorian = gregorianShort(date)
            let hijri = hijriLabel(for: date)
            return DarIslamicCalendarRow(
                id: ISO8601DateFormatter().string(from: date),
                gregorianDate: gregorian,
                hijriDate: hijri,
                weekday: weekdayFormatter.string(from: date).capitalized
            )
        }
    }

    private static func fastDuration(fajr: String, maghrib: String, on day: Date, timeZone: TimeZone) -> String {
        guard
            let start = date(for: DarPrayerSlot(id: "fajr", name: "Fajr", time: fajr), on: day, timeZone: timeZone),
            let end = date(for: DarPrayerSlot(id: "maghrib", name: "Maghrib", time: maghrib), on: day, timeZone: timeZone)
        else { return "—" }
        let total = max(0, Int(end.timeIntervalSince(start)))
        let hours = total / 3600
        let mins = (total % 3600) / 60
        if hours > 0 && mins > 0 { return "\(hours)h \(mins)m" }
        if hours > 0 { return "\(hours)h" }
        return "\(mins)m"
    }

    static func remainingMinutes(from slots: [DarPrayerSlot], now: Date = Date(), timeZone: TimeZone = .current) -> Int {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = timeZone
        let nowMin = cal.component(.hour, from: now) * 60 + cal.component(.minute, from: now)
        let named = slots.filter { $0.id != "sunrise" && $0.id != "tahajjud" }
        for slot in named {
            let target = minutes(slot.time)
            if target > nowMin { return max(0, target - nowMin) }
        }
        if let fajr = named.first {
            return max(0, minutes(fajr.time) + 24 * 60 - nowMin)
        }
        return 0
    }

    static func intervalProgress(from slots: [DarPrayerSlot], now: Date = Date(), timeZone: TimeZone = .current) -> Double {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = timeZone
        let nowMin = cal.component(.hour, from: now) * 60 + cal.component(.minute, from: now)
        let named = slots.filter { $0.id != "sunrise" && $0.id != "tahajjud" }
        guard named.count >= 2 else { return 0 }
        var prev = minutes(named.last!.time) - 24 * 60
        var next = minutes(named.first!.time) + 24 * 60
        for slot in named {
            let t = minutes(slot.time)
            if t <= nowMin { prev = t }
            if t > nowMin {
                next = t
                break
            }
        }
        let span = Double(max(1, next - prev))
        return min(1, max(0, Double(nowMin - prev) / span))
    }

    static func date(for slot: DarPrayerSlot, on day: Date, timeZone: TimeZone = .current) -> Date? {
        let parts = slot.time.split(separator: ":")
        guard parts.count == 2, let hour = Int(parts[0]), let minute = Int(parts[1]) else { return nil }
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = timeZone
        var comps = cal.dateComponents([.year, .month, .day], from: day)
        comps.hour = hour
        comps.minute = minute
        comps.second = 0
        return cal.date(from: comps)
    }

    static func remainingLabel(from totalSeconds: Int) -> String {
        let seconds = max(0, totalSeconds)
        if seconds <= 60 { return seconds <= 5 ? "jetzt" : "in \(seconds)s" }
        let minutes = seconds / 60
        let hours = minutes / 60
        let mins = minutes % 60
        if hours > 0 && mins > 0 { return "in \(hours) Std \(mins) Min" }
        if hours > 0 { return "in \(hours) Std" }
        if mins <= 1 { return "jetzt" }
        return "in \(mins) Min"
    }

    static func countdownClock(from totalSeconds: Int) -> String {
        let seconds = max(0, totalSeconds)
        let hours = seconds / 3600
        let mins = (seconds % 3600) / 60
        let secs = seconds % 60
        if hours > 0 {
            return String(format: "%d:%02d:%02d", hours, mins, secs)
        }
        return String(format: "%d:%02d", mins, secs)
    }

    static func hijriLabel(for date: Date = Date()) -> String {
        let parts = hijriParts(for: date)
        return "\(parts.day). \(hijriMonth(parts.month)) \(parts.year)"
    }

    static func hijriShort(for date: Date = Date()) -> String {
        let parts = hijriParts(for: date)
        return "\(parts.day). \(hijriMonthShort(parts.month)) \(parts.year)"
    }

    static func hijriMonthName(_ month: Int) -> String {
        hijriMonth(month)
    }

    /// Umm al-Qura (Saudi-official). Midday in Riyadh avoids Maghrib/midnight off-by-one.
    static func hijriParts(for date: Date) -> (day: Int, month: Int, year: Int) {
        var cal = Calendar(identifier: .islamicUmmAlQura)
        cal.timeZone = TimeZone(identifier: "Asia/Riyadh") ?? TimeZone(secondsFromGMT: 3 * 3600)!
        var greg = Calendar(identifier: .gregorian)
        greg.timeZone = cal.timeZone
        let ymd = greg.dateComponents([.year, .month, .day], from: date)
        var noon = DateComponents()
        noon.year = ymd.year
        noon.month = ymd.month
        noon.day = ymd.day
        noon.hour = 12
        noon.minute = 0
        let anchor = greg.date(from: noon) ?? date
        return (
            day: cal.component(.day, from: anchor),
            month: cal.component(.month, from: anchor),
            year: cal.component(.year, from: anchor)
        )
    }

    static func gregorianShort(_ date: Date = Date()) -> String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "de_DE")
        f.dateFormat = "EE dd. MMM"
        return f.string(from: date).replacingOccurrences(of: ".", with: ".")
    }

    static func gregorianLong(_ date: Date = Date()) -> String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "de_DE")
        f.dateFormat = "EEEE, d. MMMM yyyy"
        return f.string(from: date)
    }

    private static func hijriMonth(_ month: Int) -> String {
        switch month {
        case 1: return "Muḥarram"
        case 2: return "Ṣafar"
        case 3: return "Rabīʿ I"
        case 4: return "Rabīʿ II"
        case 5: return "Dschumādā I"
        case 6: return "Dschumādā II"
        case 7: return "Radschab"
        case 8: return "Shaʿbān"
        case 9: return "Ramaḍān"
        case 10: return "Shawwāl"
        case 11: return "Dhū l-Qaʿda"
        case 12: return "Dhū l-Ḥidscha"
        default: return "—"
        }
    }

    private static func hijriMonthShort(_ month: Int) -> String {
        switch month {
        case 1: return "Muḥarram"
        case 2: return "Ṣafar"
        case 3: return "Rabīʿ I"
        case 4: return "Rabīʿ II"
        case 5: return "Dschum. I"
        case 6: return "Dschum. II"
        case 7: return "Radschab"
        case 8: return "Shaʿbān"
        case 9: return "Ramaḍān"
        case 10: return "Shawwāl"
        case 11: return "Dhū Qaʿda"
        case 12: return "Dhū Ḥidscha"
        default: return "—"
        }
    }

    private static func sunTimeForAngle(
        _ date: Date,
        lat: Double,
        lon: Double,
        angle: Double,
        morning: Bool,
        timeZone: TimeZone
    ) -> Double? {
        let N = Double(dayOfYear(date, timeZone: timeZone))
        let lngHour = lon / 15
        let t = N + (((morning ? 6.0 : 18.0) - lngHour) / 24)
        let M = (0.9856 * t) - 3.289
        var L = M + (1.916 * sin(rad(M))) + (0.020 * sin(rad(2 * M))) + 282.634
        L = fixAngle(L)
        var RA = deg(atan(0.91764 * tan(rad(L))))
        RA = fixAngle(RA)
        let Lq = floor(L / 90) * 90
        let RAq = floor(RA / 90) * 90
        RA = (RA + (Lq - RAq)) / 15
        let sinDec = 0.39782 * sin(rad(L))
        let cosDec = cos(asin(sinDec))
        let zenith = 90 + angle
        let cosH = (cos(rad(zenith)) - (sinDec * sin(rad(lat)))) / (cosDec * cos(rad(lat)))
        if cosH > 1 || cosH < -1 { return nil }
        var H = morning ? 360 - deg(acos(cosH)) : deg(acos(cosH))
        H = H / 15
        let T = H + RA - (0.06571 * t) - 6.622
        let UT = T - lngHour
        let tz = Double(timeZone.secondsFromGMT(for: date)) / 3600
        return fixHour(UT + tz)
    }

    private static func solarNoon(sunrise: Double?, sunset: Double?) -> Double {
        guard let sunrise, let sunset else { return 12 }
        return fixHour((sunrise + sunset) / 2)
    }

    private static func asrTime(_ date: Date, lat: Double, lon: Double, noon: Double, factor: Double) -> Double {
        _ = lon
        let N = Double(dayOfYear(date, timeZone: .current))
        let dec = 23.45 * sin(rad((360.0 / 365.0) * (284 + N)))
        let angle = deg(atan(1 / (factor + tan(rad(abs(lat - dec))))))
        let cosH = (sin(rad(angle)) - sin(rad(lat)) * sin(rad(dec))) / (cos(rad(lat)) * cos(rad(dec)))
        if cosH > 1 || cosH < -1 { return noon + 4 }
        let H = deg(acos(cosH)) / 15
        return fixHour(noon + H)
    }

    private static func dayOfYear(_ date: Date, timeZone: TimeZone) -> Int {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = timeZone
        return cal.ordinality(of: .day, in: .year, for: date) ?? 1
    }

    private static func formatHour(_ hour: Double?) -> String {
        guard let hour, hour.isFinite else { return "--:--" }
        let h = fixHour(hour)
        var hh = Int(floor(h))
        var mm = Int((h - Double(hh) * 1.0) * 60 + 0.5)
        if mm >= 60 {
            hh = (hh + 1) % 24
            mm = 0
        }
        return String(format: "%02d:%02d", hh, mm)
    }

    private static func minutes(_ hhmm: String) -> Int {
        let parts = hhmm.split(separator: ":")
        guard parts.count == 2, let h = Int(parts[0]), let m = Int(parts[1]) else { return 0 }
        return h * 60 + m
    }

    private static func rad(_ d: Double) -> Double { d * .pi / 180 }
    private static func deg(_ r: Double) -> Double { r * 180 / .pi }
    private static func fixAngle(_ a: Double) -> Double { (a.truncatingRemainder(dividingBy: 360) + 360).truncatingRemainder(dividingBy: 360) }
    private static func fixHour(_ h: Double) -> Double { (h.truncatingRemainder(dividingBy: 24) + 24).truncatingRemainder(dividingBy: 24) }
}
