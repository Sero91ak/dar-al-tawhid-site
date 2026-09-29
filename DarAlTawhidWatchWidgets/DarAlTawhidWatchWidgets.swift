import WidgetKit
import SwiftUI

struct DarWatchEntry: TimelineEntry {
    let date: Date
    let snapshot: WatchSnapshot
}

struct DarWatchProvider: TimelineProvider {
    func placeholder(in context: Context) -> DarWatchEntry {
        DarWatchEntry(date: Date(), snapshot: WatchSnapshotStore.refresh(.fallback))
    }

    func getSnapshot(in context: Context, completion: @escaping (DarWatchEntry) -> Void) {
        completion(DarWatchEntry(date: Date(), snapshot: WatchSnapshotStore.load()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<DarWatchEntry>) -> Void) {
        let now = Date()
        let base = WatchSnapshotStore.load()
        var entries: [DarWatchEntry] = []
        for second in stride(from: 0, through: 120, by: 30) {
            let date = now.addingTimeInterval(Double(second))
            entries.append(DarWatchEntry(date: date, snapshot: WatchSnapshotStore.refresh(base, date: date)))
        }
        for minute in stride(from: 3, through: 60, by: 3) {
            let date = now.addingTimeInterval(Double(minute * 60))
            entries.append(DarWatchEntry(date: date, snapshot: WatchSnapshotStore.refresh(base, date: date)))
        }
        let target = WatchPrayerEngine.nextTarget(from: base.prayers, now: now).target
        completion(Timeline(entries: entries, policy: .after(target ?? now.addingTimeInterval(1800))))
    }
}

private struct WatchCountdownView: View {
    let entry: DarWatchEntry
    var size: CGFloat

    var body: some View {
        if let target = WatchPrayerEngine.nextTarget(from: entry.snapshot.prayers, now: entry.date).target, target > entry.date {
            Text(timerInterval: entry.date...target, countsDown: true)
                .font(.system(size: size, weight: .semibold, design: .rounded).monospacedDigit())
                .foregroundStyle(WatchStyle.gold)
                .lineLimit(1)
                .minimumScaleFactor(0.38)
        } else {
            Text("0:00")
                .font(.system(size: size, weight: .semibold, design: .rounded).monospacedDigit())
                .foregroundStyle(WatchStyle.gold)
        }
    }
}

private struct WatchBackground<Content: View>: View {
    let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        content
            .containerBackground(for: .widget) {
                ZStack {
                    WatchStyle.ink
                    LinearGradient(colors: [WatchStyle.panel, .clear], startPoint: .topLeading, endPoint: .bottomTrailing)
                    RadialGradient(colors: [WatchStyle.gold.opacity(0.18), .clear], center: .topLeading, startRadius: 2, endRadius: 90)
                }
            }
    }
}

private struct WatchBrand: View {
    var body: some View {
        HStack(spacing: 4) {
            Image("BrandMark")
                .resizable()
                .scaledToFit()
                .frame(width: 17, height: 17)
            Text("DĀR AL TAWḤĪD")
                .font(.system(size: 9.5, weight: .bold, design: .rounded))
                .foregroundStyle(WatchStyle.gold)
                .lineLimit(1)
                .minimumScaleFactor(0.5)
        }
    }
}

private struct WatchPrayerFace: View {
    let entry: DarWatchEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        let snap = entry.snapshot
        let name = WatchStyle.cleanName(snap.nextPrayerName)
        Group {
            if family == .accessoryCircular {
                VStack(spacing: 1) {
                    Text(WatchStyle.tinyName(name).uppercased())
                        .font(.system(size: 9, weight: .bold, design: .rounded))
                    Text(snap.nextPrayerTime)
                        .font(.system(size: 12, weight: .semibold, design: .rounded).monospacedDigit())
                    WatchCountdownView(entry: entry, size: 8.4)
                }
                .widgetAccentable()
            } else if family == .accessoryInline {
                Text("\(name) \(snap.nextPrayerTime) · \(WatchPrayerEngine.countdownText(from: snap.prayers, now: entry.date))")
                    .widgetAccentable()
            } else if family == .accessoryCorner {
                VStack(spacing: 0) {
                    Text(WatchStyle.tinyName(name).uppercased())
                        .font(.system(size: 8.5, weight: .bold, design: .rounded))
                    Text(snap.nextPrayerTime)
                        .font(.system(size: 10, weight: .semibold, design: .rounded).monospacedDigit())
                }
                .widgetAccentable()
            } else {
                WatchBackground {
                    VStack(alignment: .leading, spacing: 3) {
                        WatchBrand()
                        HStack(alignment: .firstTextBaseline, spacing: 4) {
                            Text("\(name) in")
                                .font(.system(size: 10.5, weight: .semibold, design: .rounded))
                                .foregroundStyle(WatchStyle.cream)
                                .lineLimit(1)
                                .minimumScaleFactor(0.65)
                            Spacer(minLength: 2)
                            Text(snap.nextPrayerTime)
                                .font(.system(size: 10.5, weight: .semibold, design: .rounded).monospacedDigit())
                                .foregroundStyle(WatchStyle.muted)
                        }
                        WatchCountdownView(entry: entry, size: 17)
                    }
                    .padding(.horizontal, 3)
                }
            }
        }
        .widgetURL(URL(string: "daraltawhid://prayer"))
    }
}

private struct WatchPrayerListFace: View {
    let entry: DarWatchEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        let snap = entry.snapshot
        let slots = Array(snap.prayers.filter { $0.id != "sunrise" }.prefix(family == .accessoryRectangular ? 3 : 2))
        Group {
            if family == .accessoryInline {
                Text(slots.map { "\(WatchStyle.tinyName($0.name)) \($0.time)" }.joined(separator: " · "))
                    .widgetAccentable()
            } else {
                WatchBackground {
                    VStack(alignment: .leading, spacing: 2) {
                        WatchBrand()
                        ForEach(slots) { slot in
                            HStack(spacing: 4) {
                                Text(WatchStyle.tinyName(slot.name))
                                    .font(.system(size: 10.5, weight: slot.id == snap.nextPrayerId ? .bold : .medium, design: .rounded))
                                    .lineLimit(1)
                                    .minimumScaleFactor(0.62)
                                Spacer(minLength: 2)
                                Text(slot.time)
                                    .font(.system(size: 11, weight: .semibold, design: .rounded).monospacedDigit())
                                    .lineLimit(1)
                            }
                            .foregroundStyle(slot.id == snap.nextPrayerId ? WatchStyle.gold : WatchStyle.cream)
                        }
                    }
                    .padding(.horizontal, 3)
                }
            }
        }
        .widgetURL(URL(string: "daraltawhid://prayer"))
    }
}

private struct WatchHijriFace: View {
    let entry: DarWatchEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        let parts = WatchPrayerEngine.hijriParts(for: entry.date)
        let month = WatchPrayerEngine.monthName(parts.month)
        Group {
            if family == .accessoryCircular || family == .accessoryCorner {
                VStack(spacing: 0) {
                    Text("\(parts.day)")
                        .font(.system(size: family == .accessoryCorner ? 14 : 18, weight: .semibold, design: .serif))
                    Text(month)
                        .font(.system(size: 8.3, weight: .semibold, design: .serif))
                        .lineLimit(1)
                        .minimumScaleFactor(0.45)
                }
                .widgetAccentable()
            } else if family == .accessoryInline {
                Text("\(parts.day). \(month) \(parts.year) AH")
                    .widgetAccentable()
            } else {
                WatchBackground {
                    HStack(spacing: 5) {
                        WatchBrand()
                        Spacer(minLength: 2)
                        VStack(alignment: .trailing, spacing: 0) {
                            Text("\(parts.day). \(month)")
                                .font(.system(size: 12, weight: .semibold, design: .serif))
                                .lineLimit(1)
                                .minimumScaleFactor(0.55)
                            Text("\(parts.year) AH")
                                .font(.system(size: 10, weight: .medium, design: .rounded).monospacedDigit())
                                .foregroundStyle(WatchStyle.muted)
                        }
                    }
                    .foregroundStyle(WatchStyle.gold)
                    .padding(.horizontal, 3)
                }
            }
        }
        .widgetURL(URL(string: "daraltawhid://calendar"))
    }
}

private struct WatchQiblaFace: View {
    let entry: DarWatchEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        let degrees = entry.snapshot.qiblaDegrees
        Group {
            if family == .accessoryCircular || family == .accessoryCorner {
                VStack(spacing: 1) {
                    Image(systemName: "location.north.fill")
                        .rotationEffect(.degrees(degrees))
                    Text(String(format: "%.0f°", degrees))
                        .font(.system(size: 11, weight: .bold, design: .rounded).monospacedDigit())
                }
                .widgetAccentable()
            } else if family == .accessoryInline {
                Text(String(format: "Qibla %.0f°", degrees))
                    .widgetAccentable()
            } else {
                WatchBackground {
                    HStack(spacing: 7) {
                        Image(systemName: "location.north.fill")
                            .font(.system(size: 17, weight: .semibold))
                            .foregroundStyle(WatchStyle.gold)
                            .rotationEffect(.degrees(degrees))
                            .frame(width: 26, height: 26)
                            .background(Circle().fill(WatchStyle.panel))
                        VStack(alignment: .leading, spacing: 0) {
                            Text("Qibla")
                                .font(.system(size: 11, weight: .semibold, design: .serif))
                                .foregroundStyle(WatchStyle.cream)
                            Text(String(format: "%.0f° Mekka", degrees))
                                .font(.system(size: 12, weight: .semibold, design: .rounded).monospacedDigit())
                                .foregroundStyle(WatchStyle.gold)
                                .lineLimit(1)
                                .minimumScaleFactor(0.60)
                        }
                    }
                    .padding(.horizontal, 3)
                }
            }
        }
        .widgetURL(URL(string: "daraltawhid://qibla"))
    }
}

struct PrayerWatchWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "de.daraltawhid.watch.prayer", provider: DarWatchProvider()) { entry in
            WatchPrayerFace(entry: entry)
        }
        .configurationDisplayName("Gebetszeiten")
        .description("Nächstes Gebet mit Live-Countdown.")
        .supportedFamilies(Self.families)
    }

    static var families: [WidgetFamily] {
        [.accessoryCircular, .accessoryRectangular, .accessoryInline, .accessoryCorner]
    }
}

struct PrayerListWatchWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "de.daraltawhid.watch.prayer.list", provider: DarWatchProvider()) { entry in
            WatchPrayerListFace(entry: entry)
        }
        .configurationDisplayName("Gebetszeiten Liste")
        .description("Mehrere Gebetszeiten auf der Apple Watch.")
        .supportedFamilies([.accessoryRectangular, .accessoryInline])
    }
}

struct HijriWatchWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "de.daraltawhid.watch.hijri", provider: DarWatchProvider()) { entry in
            WatchHijriFace(entry: entry)
        }
        .configurationDisplayName("Islamischer Kalender")
        .description("Hidschra-Datum auf der Apple Watch.")
        .supportedFamilies(PrayerWatchWidget.families)
    }
}

struct QiblaWatchWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "de.daraltawhid.watch.qibla", provider: DarWatchProvider()) { entry in
            WatchQiblaFace(entry: entry)
        }
        .configurationDisplayName("Qibla")
        .description("Qibla-Richtung auf der Apple Watch.")
        .supportedFamilies(PrayerWatchWidget.families)
    }
}

private enum WatchStyle {
    static let gold = Color(red: 0.90, green: 0.78, blue: 0.50)
    static let cream = Color(red: 0.94, green: 0.90, blue: 0.80)
    static let muted = Color(red: 0.70, green: 0.66, blue: 0.56)
    static let ink = Color(red: 0.03, green: 0.04, blue: 0.04)
    static let panel = Color.white.opacity(0.08)
    static let line = Color.white.opacity(0.13)

    static func cleanName(_ name: String) -> String {
        let lower = name.lowercased()
        if lower.contains("fajr") || lower.contains("fair") { return "Fajr" }
        if lower.contains("dhuhr") || lower.contains("zuhr") { return "Dhuhr" }
        if lower.contains("asr") || lower.contains("aṣr") { return "Asr" }
        if lower.contains("maghrib") { return "Maghrib" }
        if lower.contains("isha") || lower.contains("ishā") { return "Isha" }
        return name
    }

    static func tinyName(_ name: String) -> String {
        let clean = cleanName(name)
        return clean == "Maghrib" ? "Mgb" : clean
    }
}

private struct WatchPrayerSlot: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let time: String
}

private struct WatchSnapshot: Codable {
    var cityLabel: String
    var latitude: Double
    var longitude: Double
    var fajrAngle: Double
    var asrFactor: Double
    var qiblaDegrees: Double
    var prayers: [WatchPrayerSlot]
    var nextPrayerId: String
    var nextPrayerName: String
    var nextPrayerTime: String
    var updatedAt: Date

    static let fallback = WatchSnapshot(
        cityLabel: "Standort freigegeben",
        latitude: 52.52,
        longitude: 13.405,
        fajrAngle: 12,
        asrFactor: 1,
        qiblaDegrees: 136,
        prayers: WatchPrayerEngine.times(for: Date(), lat: 52.52, lng: 13.405),
        nextPrayerId: "dhuhr",
        nextPrayerName: "Dhuhr",
        nextPrayerTime: "13:02",
        updatedAt: Date()
    )
}

private enum WatchSnapshotStore {
    static let appGroup = "group.de.daraltawhid.app"
    static let key = "dar.widget.snapshot.v2"

    static func load() -> WatchSnapshot {
        guard let defaults = UserDefaults(suiteName: appGroup),
              let data = defaults.data(forKey: key),
              let decoded = try? JSONDecoder().decode(WatchSnapshot.self, from: data) else {
            return refresh(.fallback)
        }
        return refresh(decoded)
    }

    static func refresh(_ snapshot: WatchSnapshot, date: Date = Date()) -> WatchSnapshot {
        var copy = snapshot
        if copy.prayers.isEmpty {
            copy.prayers = WatchPrayerEngine.times(for: date, lat: copy.latitude, lng: copy.longitude, angle: copy.fajrAngle, asrFactor: copy.asrFactor)
        }
        let next = WatchPrayerEngine.nextTarget(from: copy.prayers, now: date)
        copy.nextPrayerId = next.id
        copy.nextPrayerName = next.name
        copy.nextPrayerTime = next.time
        return copy
    }
}

private enum WatchPrayerEngine {
    static func nextTarget(from slots: [WatchPrayerSlot], now: Date = Date()) -> (id: String, name: String, time: String, target: Date?) {
        let named = slots.filter { $0.id != "sunrise" && $0.id != "tahajjud" }
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = .current
        let dayStart = cal.startOfDay(for: now)
        for slot in named {
            if let slotDate = date(for: slot, on: dayStart), slotDate > now {
                return (slot.id, WatchStyle.cleanName(slot.name), slot.time, slotDate)
            }
        }
        if let first = named.first,
           let tomorrow = cal.date(byAdding: .day, value: 1, to: dayStart),
           let slotDate = date(for: first, on: tomorrow) {
            return (first.id, WatchStyle.cleanName(first.name), first.time, slotDate)
        }
        return ("", "Gebet", "--:--", nil)
    }

    static func countdownText(from slots: [WatchPrayerSlot], now: Date) -> String {
        guard let target = nextTarget(from: slots, now: now).target else { return "0:00" }
        let seconds = max(0, Int(target.timeIntervalSince(now)))
        let h = seconds / 3600
        let m = (seconds % 3600) / 60
        let s = seconds % 60
        return h > 0 ? String(format: "%d:%02d:%02d", h, m, s) : String(format: "%d:%02d", m, s)
    }

    static func date(for slot: WatchPrayerSlot, on day: Date) -> Date? {
        let parts = slot.time.split(separator: ":")
        guard parts.count == 2, let hour = Int(parts[0]), let minute = Int(parts[1]) else { return nil }
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = .current
        var comps = cal.dateComponents([.year, .month, .day], from: day)
        comps.hour = hour
        comps.minute = minute
        comps.second = 0
        return cal.date(from: comps)
    }

    static func hijriParts(for date: Date) -> (day: Int, month: Int, year: Int) {
        var cal = Calendar(identifier: .islamicUmmAlQura)
        cal.timeZone = TimeZone(identifier: "Asia/Riyadh") ?? .current
        return (cal.component(.day, from: date), cal.component(.month, from: date), cal.component(.year, from: date))
    }

    static func monthName(_ month: Int) -> String {
        switch month {
        case 1: return "Muharram"
        case 2: return "Safar"
        case 3: return "Rabi I"
        case 4: return "Rabi II"
        case 5: return "Dschumada I"
        case 6: return "Dschumada II"
        case 7: return "Radschab"
        case 8: return "Shaban"
        case 9: return "Ramadan"
        case 10: return "Shawwal"
        case 11: return "Dhul Qada"
        case 12: return "Dhul Hidscha"
        default: return "Hijri"
        }
    }

    static func sunriseTime(from slots: [WatchPrayerSlot]) -> String {
        slots.first(where: { $0.id == "sunrise" })?.time ?? "--:--"
    }

    static func times(for date: Date, lat: Double, lng: Double, angle: Double = 12, asrFactor: Double = 1) -> [WatchPrayerSlot] {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = .current
        let day = cal.startOfDay(for: date)
        let fajr = sunTime(day, lat: lat, lon: lng, angle: angle, morning: true)
        let sunrise = sunTime(day, lat: lat, lon: lng, angle: 0.833, morning: true)
        let maghrib = sunTime(day, lat: lat, lon: lng, angle: 0.833, morning: false)
        let isha = sunTime(day, lat: lat, lon: lng, angle: angle, morning: false)
        let dhuhr = solarNoon(sunrise: sunrise, sunset: maghrib)
        let asr = asrTime(day, lat: lat, noon: dhuhr, factor: asrFactor)
        return [
            WatchPrayerSlot(id: "fajr", name: "Fajr", time: formatHour(fajr)),
            WatchPrayerSlot(id: "sunrise", name: "Sonnenaufgang", time: formatHour(sunrise)),
            WatchPrayerSlot(id: "dhuhr", name: "Dhuhr", time: formatHour(dhuhr)),
            WatchPrayerSlot(id: "asr", name: "Asr", time: formatHour(asr)),
            WatchPrayerSlot(id: "maghrib", name: "Maghrib", time: formatHour(maghrib)),
            WatchPrayerSlot(id: "isha", name: "Isha", time: formatHour(isha))
        ]
    }

    private static func sunTime(_ date: Date, lat: Double, lon: Double, angle: Double, morning: Bool) -> Double? {
        let timeZone = TimeZone.current
        let n = Double(dayOfYear(date, timeZone: timeZone))
        let lngHour = lon / 15
        let t = n + (((morning ? 6.0 : 18.0) - lngHour) / 24)
        let m = (0.9856 * t) - 3.289
        var l = m + (1.916 * sin(rad(m))) + (0.020 * sin(rad(2 * m))) + 282.634
        l = fixAngle(l)
        var ra = deg(atan(0.91764 * tan(rad(l))))
        ra = fixAngle(ra)
        ra = (ra + (floor(l / 90) * 90 - floor(ra / 90) * 90)) / 15
        let sinDec = 0.39782 * sin(rad(l))
        let cosDec = cos(asin(sinDec))
        let cosH = (cos(rad(90 + angle)) - (sinDec * sin(rad(lat)))) / (cosDec * cos(rad(lat)))
        if cosH > 1 || cosH < -1 { return nil }
        let h = (morning ? 360 - deg(acos(cosH)) : deg(acos(cosH))) / 15
        let local = h + ra - (0.06571 * t) - 6.622 - lngHour + Double(timeZone.secondsFromGMT(for: date)) / 3600
        return fixHour(local)
    }

    private static func solarNoon(sunrise: Double?, sunset: Double?) -> Double {
        guard let sunrise, let sunset else { return 12 }
        return fixHour((sunrise + sunset) / 2)
    }

    private static func asrTime(_ date: Date, lat: Double, noon: Double, factor: Double) -> Double {
        let dec = 23.45 * sin(rad((360.0 / 365.0) * (284 + Double(dayOfYear(date, timeZone: .current)))))
        let angle = deg(atan(1 / (factor + tan(rad(abs(lat - dec))))))
        let cosH = (sin(rad(angle)) - sin(rad(lat)) * sin(rad(dec))) / (cos(rad(lat)) * cos(rad(dec)))
        if cosH > 1 || cosH < -1 { return noon + 4 }
        return fixHour(noon + deg(acos(cosH)) / 15)
    }

    private static func dayOfYear(_ date: Date, timeZone: TimeZone) -> Int {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = timeZone
        return cal.ordinality(of: .day, in: .year, for: date) ?? 1
    }

    private static func formatHour(_ hour: Double?) -> String {
        guard let hour else { return "--:--" }
        let fixed = fixHour(hour)
        var hh = Int(floor(fixed))
        var mm = Int((fixed - Double(hh)) * 60 + 0.5)
        if mm >= 60 { hh = (hh + 1) % 24; mm = 0 }
        return String(format: "%02d:%02d", hh, mm)
    }

    private static func rad(_ d: Double) -> Double { d * .pi / 180 }
    private static func deg(_ r: Double) -> Double { r * 180 / .pi }
    private static func fixAngle(_ a: Double) -> Double { (a.truncatingRemainder(dividingBy: 360) + 360).truncatingRemainder(dividingBy: 360) }
    private static func fixHour(_ h: Double) -> Double { (h.truncatingRemainder(dividingBy: 24) + 24).truncatingRemainder(dividingBy: 24) }
}

#Preview(as: .accessoryRectangular) {
    PrayerWatchWidget()
} timeline: {
    DarWatchEntry(date: .now, snapshot: WatchSnapshotStore.refresh(.fallback))
}
