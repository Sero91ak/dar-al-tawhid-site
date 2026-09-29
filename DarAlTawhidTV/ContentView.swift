//
//  ContentView.swift
//  DarAlTawhidTV
//
//  Created by Serhat Abu Malik on 16.09.26.
//

import SwiftUI
import Foundation

struct ContentView: View {
    @State private var snapshot = TVSnapshotStore.load()

    var body: some View {
        TimelineView(.periodic(from: .now, by: 1)) { context in
            let live = TVSnapshotStore.refresh(snapshot, date: context.date)
            TVPrayerDashboard(snapshot: live, date: context.date)
        }
        .task {
            snapshot = TVSnapshotStore.load()
        }
    }
}

private struct TVPrayerDashboard: View {
    let snapshot: TVSnapshot
    let date: Date

    private var nextTarget: TVPrayerTarget {
        TVPrayerEngine.nextTarget(from: snapshot.prayers, now: date)
    }

    var body: some View {
        ZStack {
            TVStyle.background

            GeometryReader { geo in
                let safeWidth = min(geo.size.width - 160, 1760)
                VStack(spacing: 34) {
                    header

                    HStack(alignment: .stretch, spacing: 34) {
                        mainCountdown
                            .frame(width: safeWidth * 0.55)

                        VStack(spacing: 24) {
                            prayerList
                            dailyCard
                        }
                        .frame(width: safeWidth * 0.45)
                    }

                    footer
                }
                .frame(width: safeWidth)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .ignoresSafeArea()
    }

    private var header: some View {
        HStack(alignment: .center) {
            HStack(spacing: 24) {
                TVBrandMark()
                    .frame(width: 92, height: 92)

                VStack(alignment: .leading, spacing: 7) {
                    Text("DĀR AL TAWḤĪD")
                        .font(.system(size: 44, weight: .bold, design: .rounded))
                        .foregroundStyle(TVStyle.gold)
                    Text(snapshot.cityLabel)
                        .font(.system(size: 28, weight: .semibold, design: .rounded))
                        .foregroundStyle(TVStyle.cream.opacity(0.76))
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 6) {
                Text(date, format: .dateTime.hour().minute())
                    .font(.system(size: 62, weight: .bold, design: .rounded).monospacedDigit())
                    .foregroundStyle(.white)
                Text(TVPrayerEngine.fullDateLabel(for: date))
                    .font(.system(size: 24, weight: .semibold, design: .rounded))
                    .foregroundStyle(TVStyle.cream.opacity(0.72))
            }
        }
    }

    private var mainCountdown: some View {
        VStack(alignment: .leading, spacing: 26) {
            HStack {
                TVPill(text: TVPrayerEngine.hijriLabel(for: date), symbol: "moon.stars.fill")
                TVPill(text: "Nächstes Gebet", symbol: "clock.fill")
            }

            Spacer(minLength: 0)

            VStack(alignment: .leading, spacing: 8) {
                Text("\(TVPrayerEngine.cleanName(nextTarget.name)) in")
                    .font(.system(size: 52, weight: .semibold, design: .rounded))
                    .foregroundStyle(TVStyle.cream.opacity(0.84))
                    .lineLimit(1)
                    .minimumScaleFactor(0.75)

                Text(nextTarget.target ?? date, style: .timer)
                    .font(.system(size: 150, weight: .heavy, design: .rounded).monospacedDigit())
                    .foregroundStyle(TVStyle.gold)
                    .lineLimit(1)
                    .minimumScaleFactor(0.48)
            }

            HStack(alignment: .firstTextBaseline, spacing: 20) {
                Text(nextTarget.time)
                    .font(.system(size: 82, weight: .bold, design: .rounded).monospacedDigit())
                    .foregroundStyle(.white)
                    .lineLimit(1)
                Text(TVPrayerEngine.cleanName(nextTarget.name))
                    .font(.system(size: 34, weight: .bold, design: .rounded))
                    .foregroundStyle(TVStyle.gold)
                    .lineLimit(1)
            }

            Spacer(minLength: 0)
        }
        .padding(44)
        .background(TVStyle.panel)
        .overlay(RoundedRectangle(cornerRadius: 46).stroke(TVStyle.gold.opacity(0.20), lineWidth: 1.2))
        .clipShape(RoundedRectangle(cornerRadius: 46))
    }

    private var prayerList: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text("Gebetszeiten heute")
                .font(.system(size: 31, weight: .bold, design: .rounded))
                .foregroundStyle(TVStyle.gold)

            VStack(spacing: 12) {
                ForEach(snapshot.prayers.filter { $0.id != "sunrise" }) { prayer in
                    TVPrayerRow(
                        prayer: prayer,
                        isActive: prayer.id == nextTarget.id
                    )
                }
            }
        }
        .padding(32)
        .background(TVStyle.panel.opacity(0.78))
        .clipShape(RoundedRectangle(cornerRadius: 34))
    }

    private var dailyCard: some View {
        let item = TVDailyRotator.item(snapshot: snapshot, date: date)
        return VStack(alignment: .leading, spacing: 14) {
            HStack {
                Text(item.label)
                    .font(.system(size: 22, weight: .bold, design: .rounded))
                    .foregroundStyle(TVStyle.gold)
                Spacer()
                Image(systemName: item.symbol)
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(TVStyle.gold)
            }

            Text(item.title)
                .font(.system(size: 31, weight: .bold, design: .serif))
                .foregroundStyle(TVStyle.cream)
                .lineLimit(2)
                .minimumScaleFactor(0.78)

            Text(item.body)
                .font(.system(size: 24, weight: .semibold, design: .rounded))
                .foregroundStyle(TVStyle.cream.opacity(0.82))
                .lineLimit(4)
                .minimumScaleFactor(0.72)

            if !item.footer.isEmpty {
                Text(item.footer)
                    .font(.system(size: 19, weight: .semibold, design: .rounded))
                    .foregroundStyle(TVStyle.cream.opacity(0.52))
                    .lineLimit(1)
                    .minimumScaleFactor(0.75)
            }
        }
        .padding(32)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(TVStyle.panel.opacity(0.62))
        .clipShape(RoundedRectangle(cornerRadius: 34))
    }

    private var footer: some View {
        HStack {
            Text("Live aktualisiert")
            Circle().fill(TVStyle.gold).frame(width: 8, height: 8)
            Text("DĀR AL TAWḤĪD TV")
            Spacer()
            Text("Stand \(TVPrayerEngine.timeLabel(for: snapshot.updatedAt))")
        }
        .font(.system(size: 20, weight: .semibold, design: .rounded))
        .foregroundStyle(TVStyle.cream.opacity(0.55))
    }
}

private struct TVPrayerRow: View {
    let prayer: TVPrayerSlot
    let isActive: Bool

    var body: some View {
        HStack(spacing: 16) {
            RoundedRectangle(cornerRadius: 4)
                .fill(isActive ? TVStyle.gold : TVStyle.cream.opacity(0.16))
                .frame(width: 8, height: 44)

            Text(TVPrayerEngine.cleanName(prayer.name))
                .font(.system(size: isActive ? 31 : 27, weight: isActive ? .heavy : .bold, design: .rounded))
                .foregroundStyle(isActive ? TVStyle.gold : TVStyle.cream.opacity(0.82))
                .lineLimit(1)

            Spacer(minLength: 16)

            Text(prayer.time)
                .font(.system(size: isActive ? 36 : 31, weight: .heavy, design: .rounded).monospacedDigit())
                .foregroundStyle(isActive ? .white : TVStyle.cream.opacity(0.78))
                .lineLimit(1)
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 22)
                .fill(isActive ? TVStyle.gold.opacity(0.13) : Color.black.opacity(0.12))
        )
    }
}

private struct TVPill: View {
    let text: String
    let symbol: String

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: symbol)
            Text(text)
                .lineLimit(1)
                .minimumScaleFactor(0.72)
        }
        .font(.system(size: 22, weight: .bold, design: .rounded))
        .foregroundStyle(TVStyle.cream)
        .padding(.horizontal, 18)
        .padding(.vertical, 10)
        .background(Capsule().fill(Color.black.opacity(0.24)))
    }
}

private struct TVBrandMark: View {
    var body: some View {
        ZStack {
            Circle()
                .fill(
                    RadialGradient(
                        colors: [TVStyle.gold.opacity(0.24), Color.black.opacity(0.38)],
                        center: .center,
                        startRadius: 8,
                        endRadius: 56
                    )
                )
            Circle()
                .stroke(TVStyle.gold.opacity(0.55), lineWidth: 2)
            Text("دار")
                .font(.system(size: 31, weight: .bold, design: .serif))
                .foregroundStyle(TVStyle.cream)
        }
    }
}

private enum TVStyle {
    static let gold = Color(red: 0.91, green: 0.78, blue: 0.50)
    static let cream = Color(red: 0.95, green: 0.91, blue: 0.82)
    static let ink = Color(red: 0.018, green: 0.026, blue: 0.024)

    static var background: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(red: 0.015, green: 0.022, blue: 0.020),
                    Color(red: 0.035, green: 0.052, blue: 0.043),
                    Color(red: 0.006, green: 0.008, blue: 0.008)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            RadialGradient(
                colors: [gold.opacity(0.12), .clear],
                center: .topLeading,
                startRadius: 40,
                endRadius: 900
            )
        }
    }

    static var panel: some ShapeStyle {
        LinearGradient(
            colors: [Color.white.opacity(0.105), Color.white.opacity(0.045)],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }
}

private struct TVDailyItem {
    let label: String
    let symbol: String
    let title: String
    let body: String
    let footer: String
}

private enum TVDailyRotator {
    static func item(snapshot: TVSnapshot, date: Date) -> TVDailyItem {
        let items = [
            TVDailyItem(
                label: "Duʿāʾ des Tages",
                symbol: "hands.sparkles.fill",
                title: clean(snapshot.duaTitle, fallback: "Duʿāʾ des Tages"),
                body: clean(snapshot.duaGerman, fallback: "Allah genügt uns, und Er ist der beste Sachwalter."),
                footer: clean(snapshot.duaSource, fallback: snapshot.duaCategory)
            ),
            TVDailyItem(
                label: "Āyah",
                symbol: "book.closed.fill",
                title: clean(snapshot.ayahRef, fallback: "Gedenken Allahs"),
                body: clean(snapshot.ayahGerman, fallback: "Wahrlich, durch das Gedenken Allahs kommen die Herzen zur Ruhe."),
                footer: clean(snapshot.ayahTranslit, fallback: "")
            ),
            TVDailyItem(
                label: "Heute empfohlen",
                symbol: "sparkles",
                title: clean(snapshot.postTitle, fallback: snapshot.recommendationTitle),
                body: clean(snapshot.postSnippet, fallback: snapshot.recommendationBody),
                footer: clean(snapshot.postSource, fallback: snapshot.postCategory)
            )
        ].filter { !$0.body.isEmpty }

        guard !items.isEmpty else {
            return TVDailyItem(
                label: "Heute",
                symbol: "sparkles",
                title: "DĀR AL TAWḤĪD",
                body: "Öffne die iPhone-App, um aktuelle Beiträge und Inhalte zu laden.",
                footer: ""
            )
        }

        let second = Calendar.current.component(.second, from: date)
        return items[(second / 20) % items.count]
    }

    private static func clean(_ value: String?, fallback: String) -> String {
        let raw = (value ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        let result = raw.isEmpty ? fallback.trimmingCharacters(in: .whitespacesAndNewlines) : raw
        return result.replacingOccurrences(of: "📝 ", with: "")
            .replacingOccurrences(of: "🖋️ ", with: "")
            .replacingOccurrences(of: "📖 ", with: "")
    }
}

private struct TVPrayerSlot: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let time: String
}

private struct TVPrayerTarget {
    let id: String
    let name: String
    let time: String
    let target: Date?
}

private struct TVSnapshot: Codable {
    var cityLabel: String
    var latitude: Double
    var longitude: Double
    var fajrAngle: Double
    var asrFactor: Double
    var prayers: [TVPrayerSlot]
    var nextPrayerName: String
    var nextPrayerTime: String
    var recommendationTitle: String
    var recommendationBody: String
    var postTitle: String
    var postSnippet: String
    var postCategory: String
    var postSource: String
    var ayahGerman: String
    var ayahTranslit: String
    var ayahRef: String
    var duaTitle: String
    var duaGerman: String
    var duaTranslit: String
    var duaCategory: String
    var duaSource: String
    var updatedAt: Date

    static let fallback = TVSnapshot(
        cityLabel: "Rheinbach",
        latitude: 50.6259,
        longitude: 6.9492,
        fajrAngle: 12,
        asrFactor: 1,
        prayers: TVPrayerEngine.times(for: Date(), lat: 50.6259, lng: 6.9492),
        nextPrayerName: "Gebet",
        nextPrayerTime: "--:--",
        recommendationTitle: "Heute empfohlen",
        recommendationBody: "DĀR AL TAWḤĪD TV zeigt Gebetszeiten und Tagesinhalte.",
        postTitle: "Heute im Fokus",
        postSnippet: "Nutze die iPhone-App, um aktuelle Beiträge mit Apple TV zu synchronisieren.",
        postCategory: "Heute",
        postSource: "",
        ayahGerman: "Wahrlich, durch das Gedenken Allahs kommen die Herzen zur Ruhe.",
        ayahTranslit: "Ala bi-dhikrillahi tatma'innu l-qulub.",
        ayahRef: "ar-Ra'd 13:28",
        duaTitle: "Duʿāʾ des Tages",
        duaGerman: "Allah genügt uns, und Er ist der beste Sachwalter.",
        duaTranslit: "Hasbunallahu wa ni'ma l-wakil.",
        duaCategory: "Tawakkul",
        duaSource: "",
        updatedAt: Date()
    )
}

private enum TVSnapshotStore {
    static let appGroup = "group.de.daraltawhid.app"
    static let key = "dar.widget.snapshot.v2"

    static func load() -> TVSnapshot {
        guard let defaults = UserDefaults(suiteName: appGroup),
              let data = defaults.data(forKey: key),
              let decoded = try? JSONDecoder().decode(TVSnapshot.self, from: data) else {
            return refresh(.fallback)
        }
        return refresh(decoded)
    }

    static func refresh(_ snapshot: TVSnapshot, date: Date = Date()) -> TVSnapshot {
        var copy = snapshot
        if copy.prayers.isEmpty || !Calendar.current.isDate(copy.updatedAt, inSameDayAs: date) {
            copy.prayers = TVPrayerEngine.times(
                for: date,
                lat: copy.latitude,
                lng: copy.longitude,
                angle: copy.fajrAngle,
                asrFactor: copy.asrFactor
            )
        }
        let next = TVPrayerEngine.nextTarget(from: copy.prayers, now: date)
        copy.nextPrayerName = next.name
        copy.nextPrayerTime = next.time
        return copy
    }
}

private enum TVPrayerEngine {
    static func cleanName(_ name: String) -> String {
        let lower = name.lowercased()
        if lower.contains("fajr") || lower.contains("fair") { return "Fajr" }
        if lower.contains("dhuhr") || lower.contains("zuhr") { return "Dhuhr" }
        if lower.contains("asr") || lower.contains("aṣr") { return "Asr" }
        if lower.contains("maghrib") { return "Maghrib" }
        if lower.contains("isha") || lower.contains("ishā") { return "Isha" }
        return name
    }

    static func nextTarget(from slots: [TVPrayerSlot], now: Date = Date()) -> TVPrayerTarget {
        let named = slots.filter { $0.id != "sunrise" && $0.id != "tahajjud" }
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = .current
        let dayStart = cal.startOfDay(for: now)

        for slot in named {
            if let slotDate = date(for: slot, on: dayStart), slotDate > now {
                return TVPrayerTarget(id: slot.id, name: cleanName(slot.name), time: slot.time, target: slotDate)
            }
        }

        if let first = named.first,
           let tomorrow = cal.date(byAdding: .day, value: 1, to: dayStart),
           let slotDate = date(for: first, on: tomorrow) {
            return TVPrayerTarget(id: first.id, name: cleanName(first.name), time: first.time, target: slotDate)
        }

        return TVPrayerTarget(id: "", name: "Gebet", time: "--:--", target: nil)
    }

    static func date(for slot: TVPrayerSlot, on day: Date) -> Date? {
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
        return "\(day). \(month) \(year) AH"
    }

    static func fullDateLabel(for date: Date) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "de_DE")
        formatter.dateFormat = "EEEE, d. MMMM yyyy"
        return formatter.string(from: date)
    }

    static func timeLabel(for date: Date) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "de_DE")
        formatter.dateFormat = "HH:mm"
        return formatter.string(from: date)
    }

    static func times(for date: Date, lat: Double, lng: Double, angle: Double = 12, asrFactor: Double = 1) -> [TVPrayerSlot] {
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
            TVPrayerSlot(id: "fajr", name: "Fajr", time: formatHour(fajr)),
            TVPrayerSlot(id: "sunrise", name: "Sonnenaufgang", time: formatHour(sunrise)),
            TVPrayerSlot(id: "dhuhr", name: "Dhuhr", time: formatHour(dhuhr)),
            TVPrayerSlot(id: "asr", name: "Asr", time: formatHour(asr)),
            TVPrayerSlot(id: "maghrib", name: "Maghrib", time: formatHour(maghrib)),
            TVPrayerSlot(id: "isha", name: "Isha", time: formatHour(isha))
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
        let lQuadrant = floor(l / 90) * 90
        let raQuadrant = floor(ra / 90) * 90
        ra = (ra + lQuadrant - raQuadrant) / 15
        let sinDec = 0.39782 * sin(rad(l))
        let cosDec = cos(asin(sinDec))
        let cosH = (cos(rad(90 + angle)) - (sinDec * sin(rad(lat)))) / (cosDec * cos(rad(lat)))
        guard cosH >= -1, cosH <= 1 else { return nil }
        let h = (morning ? 360 - deg(acos(cosH)) : deg(acos(cosH))) / 15
        let localMean = h + ra - (0.06571 * t) - 6.622
        let utc = localMean - lngHour
        return fixHour(utc + Double(timeZone.secondsFromGMT(for: date)) / 3600)
    }

    private static func solarNoon(sunrise: Double?, sunset: Double?) -> Double? {
        guard let sunrise, let sunset else { return nil }
        return fixHour((sunrise + sunset) / 2)
    }

    private static func asrTime(_ date: Date, lat: Double, noon: Double?, factor: Double) -> Double? {
        guard let noon else { return nil }
        let declination = solarDeclination(date)
        let angle = deg(atan(1 / (factor + tan(abs(rad(lat - declination))))))
        return sunTime(date, lat: lat, lon: 0, angle: 90 - angle, morning: false).map { _ in fixHour(noon + 3.5) }
    }

    private static func formatHour(_ hour: Double?) -> String {
        guard let hour, hour.isFinite else { return "--:--" }
        let total = Int(round(fixHour(hour) * 60))
        let h = (total / 60) % 24
        let m = total % 60
        return String(format: "%02d:%02d", h, m)
    }

    private static func solarDeclination(_ date: Date) -> Double {
        let n = Double(dayOfYear(date, timeZone: .current))
        return 23.45 * sin(rad(360 / 365 * (284 + n)))
    }

    private static func dayOfYear(_ date: Date, timeZone: TimeZone) -> Int {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = timeZone
        return cal.ordinality(of: .day, in: .year, for: date) ?? 1
    }

    private static func rad(_ value: Double) -> Double { value * .pi / 180 }
    private static func deg(_ value: Double) -> Double { value * 180 / .pi }
    private static func fixAngle(_ value: Double) -> Double {
        let result = value.truncatingRemainder(dividingBy: 360)
        return result < 0 ? result + 360 : result
    }
    private static func fixHour(_ value: Double) -> Double {
        let result = value.truncatingRemainder(dividingBy: 24)
        return result < 0 ? result + 24 : result
    }
}

#Preview {
    ContentView()
}
