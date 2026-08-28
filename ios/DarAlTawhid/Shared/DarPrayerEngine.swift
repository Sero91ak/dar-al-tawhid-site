import Foundation

enum DarPrayerEngine {
    private static let kaabaLat = 21.4225241
    private static let kaabaLng = 39.8261818

    static func qiblaDegrees(lat: Double, lng: Double) -> Double {
        let φ1 = lat * .pi / 180
        let φ2 = kaabaLat * .pi / 180
        let Δλ = (kaabaLng - lng) * .pi / 180
        let y = sin(Δλ) * cos(φ2)
        let x = cos(φ1) * sin(φ2) - sin(φ1) * cos(φ2) * cos(Δλ)
        var deg = atan2(y, x) * 180 / .pi
        if deg < 0 { deg += 360 }
        return deg.truncatingRemainder(dividingBy: 360)
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
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = timeZone
        let nowMin = cal.component(.hour, from: now) * 60 + cal.component(.minute, from: now)
        let named = slots.filter { $0.id != "sunrise" && $0.id != "tahajjud" }
        for slot in named {
            let target = minutes(slot.time)
            if target > nowMin {
                return (slot.name, slot.time, remainingLabel(from: target - nowMin))
            }
        }
        if let fajr = named.first {
            return (fajr.name, fajr.time, remainingLabel(from: minutes(fajr.time) + 24 * 60 - nowMin))
        }
        return ("Gebet", "—", "")
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

    static func remainingLabel(from totalMinutes: Int) -> String {
        let minutes = max(0, totalMinutes)
        let hours = minutes / 60
        let mins = minutes % 60
        if hours > 0 && mins > 0 { return "in \(hours) Std \(mins) Min" }
        if hours > 0 { return "in \(hours) Std" }
        if mins <= 1 { return "jetzt" }
        return "in \(mins) Min"
    }

    static func hijriLabel(for date: Date = Date()) -> String {
        let parts = hijriParts(for: date)
        return "\(parts.day). \(hijriMonth(parts.month)) \(parts.year)"
    }

    static func hijriShort(for date: Date = Date()) -> String {
        let parts = hijriParts(for: date)
        return "\(parts.day). \(hijriMonthShort(parts.month)) \(parts.year)"
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
