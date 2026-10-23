import Foundation

enum DarPrayerEngine {
    private static let kaabaLat = 21.4225
    private static let kaabaLng = 39.8262

    static func qiblaDegrees(lat: Double, lng: Double) -> Double {
        let φ1 = lat * .pi / 180
        let φ2 = kaabaLat * .pi / 180
        let Δλ = (kaabaLng - lng) * .pi / 180
        let y = sin(Δλ) * cos(φ2)
        let x = cos(φ1) * sin(φ2) - sin(φ1) * cos(φ2) * cos(Δλ)
        var deg = atan2(y, x) * 180 / .pi
        if deg < 0 { deg += 360 }
        return (deg * 10).rounded() / 10
    }

    static func times(for date: Date, lat: Double, lng: Double, timeZone: TimeZone = .current) -> [DarPrayerSlot] {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = timeZone
        let doy = Double(cal.ordinality(of: .day, in: .year, for: date) ?? 1)
        let tzHours = Double(timeZone.secondsFromGMT(for: date)) / 3600
        let decl = 23.45 * sin(.pi / 180 * (360.0 / 365.0) * (284 + doy))
        let eqt = equationOfTime(doy)
        let latR = lat * .pi / 180
        let decR = decl * .pi / 180

        func clock(angle: Double, rising: Bool) -> String {
            let a = angle * .pi / 180
            let cosH = (sin(a) - sin(latR) * sin(decR)) / (cos(latR) * cos(decR))
            let clamped = min(1, max(-1, cosH))
            let h = acos(clamped) * 180 / .pi / 15
            let solarNoon = 12 - lng / 15 - eqt / 60 + tzHours
            let t = rising ? solarNoon - h : solarNoon + h
            return format(t)
        }

        func asrClock() -> String {
            let shadow = 1.0
            let angle = atan(1.0 / (shadow + tan(abs(latR - decR)))) * 180 / .pi
            return clock(angle: 90 - angle, rising: false)
        }

        return [
            DarPrayerSlot(id: "fajr", name: "Fajr", time: clock(angle: -18, rising: true)),
            DarPrayerSlot(id: "sunrise", name: "Sunrise", time: clock(angle: -0.833, rising: true)),
            DarPrayerSlot(id: "dhuhr", name: "Dhuhr", time: {
                let solarNoon = 12 - lng / 15 - eqt / 60 + tzHours
                return format(solarNoon + 2.0 / 60.0)
            }()),
            DarPrayerSlot(id: "asr", name: "Asr", time: asrClock()),
            DarPrayerSlot(id: "maghrib", name: "Maghrib", time: clock(angle: -0.833, rising: false)),
            DarPrayerSlot(id: "isha", name: "Isha", time: clock(angle: -17, rising: false))
        ]
    }

    static func next(from slots: [DarPrayerSlot], now: Date = Date(), timeZone: TimeZone = .current) -> (name: String, time: String) {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = timeZone
        let nowMin = cal.component(.hour, from: now) * 60 + cal.component(.minute, from: now)
        let named = slots.filter { $0.id != "sunrise" }
        for slot in named {
            if minutes(slot.time) > nowMin {
                return (slot.name, slot.time)
            }
        }
        if let fajr = named.first {
            return (fajr.name, fajr.time)
        }
        return ("Gebet", "—")
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

    struct DayRow: Identifiable {
        let id: String
        let date: Date
        let tag: String
        let fajr: String
        let maghrib: String
        let duration: String
    }

    static func dayRows(from snap: DarWidgetSnapshot, start: Date = Date(), count: Int = 4) -> [DayRow] {
        let timeZone = TimeZone.current
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = timeZone
        let isRamadan = hijriParts(for: start).month == 9
        var rows: [DayRow] = []
        for offset in 0..<max(0, count) {
            guard let day = cal.date(byAdding: .day, value: offset, to: cal.startOfDay(for: start)) else { continue }
            let prayers = times(for: day, lat: snap.latitude, lng: snap.longitude, timeZone: timeZone)
            let fajr = prayers.first(where: { $0.id == "fajr" })?.time ?? "--:--"
            let maghrib = prayers.first(where: { $0.id == "maghrib" })?.time ?? "--:--"
            let duration = fastDuration(fajr: fajr, maghrib: maghrib, on: day, timeZone: timeZone)
            rows.append(DayRow(
                id: "\(offset)-\(fajr)-\(maghrib)",
                date: day,
                tag: weekdayTag(day),
                fajr: fajr,
                maghrib: maghrib,
                duration: isRamadan ? duration : maghrib
            ))
        }
        return rows
    }

    static func hijriParts(for date: Date = Date()) -> (day: Int, month: Int, year: Int) {
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
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "de_DE")
        formatter.dateFormat = "EE dd. MMM"
        return formatter.string(from: date)
    }

    static func hijriShort(for date: Date = Date()) -> String {
        let parts = hijriParts(for: date)
        return "\(parts.day). \(hijriMonthShort(parts.month)) \(parts.year)"
    }

    static func hijriLabel(for date: Date = Date()) -> String {
        let parts = hijriParts(for: date)
        return "\(parts.day). \(hijriMonth(parts.month)) \(parts.year)"
    }

    private static func minutes(_ hhmm: String) -> Int {
        let parts = hhmm.split(separator: ":")
        guard parts.count == 2, let h = Int(parts[0]), let m = Int(parts[1]) else { return 0 }
        return h * 60 + m
    }

    private static func weekdayTag(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "de_DE")
        formatter.dateFormat = "EE dd."
        return formatter.string(from: date)
    }

    private static func fastDuration(fajr: String, maghrib: String, on day: Date, timeZone: TimeZone) -> String {
        guard let start = date(for: DarPrayerSlot(id: "fajr", name: "Fajr", time: fajr), on: day, timeZone: timeZone),
              let end = date(for: DarPrayerSlot(id: "maghrib", name: "Maghrib", time: maghrib), on: day, timeZone: timeZone) else { return "—" }
        let total = max(0, Int(end.timeIntervalSince(start)))
        let hours = total / 3600
        let minutes = (total % 3600) / 60
        if hours > 0 && minutes > 0 { return "\(hours)h \(minutes)m" }
        if hours > 0 { return "\(hours)h" }
        return "\(minutes)m"
    }

    private static func date(for slot: DarPrayerSlot, on day: Date, timeZone: TimeZone) -> Date? {
        let parts = slot.time.split(separator: ":")
        guard parts.count == 2, let hour = Int(parts[0]), let minute = Int(parts[1]) else { return nil }
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = timeZone
        var components = cal.dateComponents([.year, .month, .day], from: day)
        components.hour = hour
        components.minute = minute
        components.second = 0
        return cal.date(from: components)
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

    private static func format(_ decimalHours: Double) -> String {
        var h = decimalHours.truncatingRemainder(dividingBy: 24)
        if h < 0 { h += 24 }
        let hour = Int(h)
        let minute = Int((h - Double(hour)) * 60)
        return String(format: "%02d:%02d", hour, minute)
    }

    private static func equationOfTime(_ doy: Double) -> Double {
        let b = 2 * .pi * (doy - 81) / 365
        return 9.87 * sin(2 * b) - 7.53 * cos(b) - 1.5 * sin(b)
    }
}
