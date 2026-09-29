import SwiftUI

struct ContentView: View {
    @State private var snapshot = WatchSnapshotStore.load()

    var body: some View {
        TimelineView(.periodic(from: .now, by: 1)) { context in
            let live = WatchSnapshotStore.refresh(snapshot, date: context.date)
            ScrollView {
                VStack(alignment: .leading, spacing: 10) {
                    WatchHeader(snapshot: live)

                    VStack(alignment: .leading, spacing: 4) {
                        Text(WatchPrayerEngine.headline(for: live.nextPrayerName))
                            .font(.system(size: 14, weight: .semibold, design: .rounded))
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                            .minimumScaleFactor(0.75)
                        WatchCountdown(snapshot: live, date: context.date, size: 30)
                        Text(live.nextPrayerTime)
                            .font(.system(size: 14, weight: .medium, design: .rounded).monospacedDigit())
                            .foregroundStyle(WatchStyle.cream)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(12)
                    .background(RoundedRectangle(cornerRadius: 18).fill(WatchStyle.panel))

                    HStack(spacing: 6) {
                        WatchChip(text: "☀︎ \(WatchPrayerEngine.sunriseTime(from: live.prayers))")
                        WatchChip(text: WatchPrayerEngine.hijriLabel(for: context.date))
                    }

                    VStack(spacing: 7) {
                        ForEach(live.prayers.filter { $0.id != "sunrise" }) { slot in
                            HStack(spacing: 6) {
                                RoundedRectangle(cornerRadius: 2)
                                    .fill(slot.id == live.nextPrayerId ? WatchStyle.gold : WatchStyle.line)
                                    .frame(width: 3, height: 16)
                                Text(WatchStyle.cleanName(slot.name))
                                    .font(.system(size: 15, weight: slot.id == live.nextPrayerId ? .semibold : .medium, design: .rounded))
                                    .lineLimit(1)
                                    .minimumScaleFactor(0.75)
                                Spacer(minLength: 8)
                                Text(slot.time)
                                    .font(.system(size: 16, weight: .semibold, design: .rounded).monospacedDigit())
                                    .lineLimit(1)
                            }
                            .foregroundStyle(slot.id == live.nextPrayerId ? WatchStyle.gold : WatchStyle.cream)
                        }
                    }
                    .padding(12)
                    .background(RoundedRectangle(cornerRadius: 18).fill(WatchStyle.panel.opacity(0.65)))

                    HStack(spacing: 10) {
                        Label(String(format: "Qibla %.0f°", live.qiblaDegrees), systemImage: "location.north.fill")
                            .rotationEffect(.degrees(0))
                        Spacer()
                        Text(live.cityLabel)
                            .lineLimit(1)
                            .minimumScaleFactor(0.65)
                    }
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundStyle(WatchStyle.muted)
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 6)
            }
            .background(WatchStyle.ink.ignoresSafeArea())
        }
        .onAppear {
            snapshot = WatchSnapshotStore.load()
        }
    }
}

private struct WatchHeader: View {
    let snapshot: WatchSnapshot

    var body: some View {
        HStack(spacing: 8) {
            Image("BrandMark")
                .resizable()
                .scaledToFit()
                .frame(width: 34, height: 34)
            VStack(alignment: .leading, spacing: 1) {
                Text("DĀR AL TAWḤĪD")
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .foregroundStyle(WatchStyle.gold)
                    .lineLimit(1)
                    .minimumScaleFactor(0.65)
                Text(snapshot.cityLabel)
                    .font(.system(size: 11, weight: .medium, design: .rounded))
                    .foregroundStyle(WatchStyle.muted)
                    .lineLimit(1)
                    .minimumScaleFactor(0.65)
            }
        }
    }
}

private struct WatchChip: View {
    let text: String

    var body: some View {
        Text(text)
            .font(.system(size: 11, weight: .semibold, design: .rounded).monospacedDigit())
            .lineLimit(1)
            .minimumScaleFactor(0.6)
            .foregroundStyle(WatchStyle.cream)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(Capsule().fill(Color.black.opacity(0.26)))
    }
}

private struct WatchCountdown: View {
    let snapshot: WatchSnapshot
    let date: Date
    let size: CGFloat

    var body: some View {
        if let target = WatchPrayerEngine.nextTarget(from: snapshot.prayers, now: date).target, target > date {
            Text(timerInterval: date...target, countsDown: true)
                .font(.system(size: size, weight: .semibold, design: .rounded).monospacedDigit())
                .foregroundStyle(WatchStyle.gold)
                .lineLimit(1)
                .minimumScaleFactor(0.42)
        } else {
            Text("0:00")
                .font(.system(size: size, weight: .semibold, design: .rounded).monospacedDigit())
                .foregroundStyle(WatchStyle.gold)
        }
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
    static func headline(for name: String) -> String {
        let cleaned = WatchStyle.cleanName(name)
        return "\(cleaned) in"
    }

    static func sunriseTime(from slots: [WatchPrayerSlot]) -> String {
        slots.first(where: { $0.id == "sunrise" })?.time ?? "--:--"
    }

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

    static func hijriLabel(for date: Date) -> String {
        var cal = Calendar(identifier: .islamicUmmAlQura)
        cal.timeZone = TimeZone(identifier: "Asia/Riyadh") ?? .current
        let day = cal.component(.day, from: date)
        let month = monthName(cal.component(.month, from: date))
        let year = cal.component(.year, from: date)
        return "\(day). \(month) \(year)"
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

    private static func monthName(_ month: Int) -> String {
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

#Preview {
    ContentView()
}
