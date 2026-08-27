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
            DarPrayerSlot(id: "sunrise", name: "Sonnenaufgang", time: clock(angle: -0.833, rising: true)),
            DarPrayerSlot(id: "dhuhr", name: "Dhuhr", time: {
                let solarNoon = 12 - lng / 15 - eqt / 60 + tzHours
                return format(solarNoon + 2.0 / 60.0)
            }()),
            DarPrayerSlot(id: "asr", name: "Asr", time: asrClock()),
            DarPrayerSlot(id: "maghrib", name: "Maghrib", time: clock(angle: -0.833, rising: false)),
            DarPrayerSlot(id: "isha", name: "Isha", time: clock(angle: -17, rising: false))
        ]
    }

    static func next(from slots: [DarPrayerSlot], now: Date = Date(), timeZone: TimeZone = .current) -> (name: String, time: String, remaining: String) {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = timeZone
        let nowMin = cal.component(.hour, from: now) * 60 + cal.component(.minute, from: now)
        let named = slots.filter { $0.id != "sunrise" }
        for slot in named {
            let target = minutes(slot.time)
            if target > nowMin {
                return (slot.name, slot.time, remainingLabel(from: target - nowMin))
            }
        }
        if let fajr = named.first {
            let target = minutes(fajr.time) + 24 * 60
            return (fajr.name, fajr.time, remainingLabel(from: target - nowMin))
        }
        return ("Gebet", "—", "")
    }

    static func remainingMinutes(from slots: [DarPrayerSlot], now: Date = Date(), timeZone: TimeZone = .current) -> Int {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = timeZone
        let nowMin = cal.component(.hour, from: now) * 60 + cal.component(.minute, from: now)
        let named = slots.filter { $0.id != "sunrise" }
        for slot in named {
            let target = minutes(slot.time)
            if target > nowMin { return max(0, target - nowMin) }
        }
        if let fajr = named.first {
            return max(0, minutes(fajr.time) + 24 * 60 - nowMin)
        }
        return 0
    }

    /// 0...1 how far we are from the previous prayer toward the next.
    static func intervalProgress(from slots: [DarPrayerSlot], now: Date = Date(), timeZone: TimeZone = .current) -> Double {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = timeZone
        let nowMin = cal.component(.hour, from: now) * 60 + cal.component(.minute, from: now)
        let named = slots.filter { $0.id != "sunrise" }
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

    private static func minutes(_ hhmm: String) -> Int {
        let parts = hhmm.split(separator: ":")
        guard parts.count == 2, let h = Int(parts[0]), let m = Int(parts[1]) else { return 0 }
        return h * 60 + m
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
