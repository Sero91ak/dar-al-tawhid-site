import Foundation

struct DarPrayerSlot: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let time: String
}

struct DarIslamicEvent: Codable, Identifiable, Hashable {
    let id: String
    let title: String
    let hijriDate: String
    let gregorianDate: String
    let daysUntil: Int
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
    var fajrAngle: Double
    var asrFactor: Double
    var hijriLabel: String
    var qiblaDegrees: Double
    var prayers: [DarPrayerSlot]
    var canonicalPrayerDays: [DarCanonicalPrayerDay]
    var lastPrayerSyncAt: Date?
    var prayerTimeZone: String
    var nextPrayerName: String
    var nextPrayerTime: String
    var nextPrayerRemaining: String
    var recommendationTitle: String
    var recommendationBody: String
    var postTitle: String
    var postSnippet: String
    var postCategory: String
    var postSource: String
    var ayahArabic: String
    var ayahGerman: String
    var ayahTranslit: String
    var ayahRef: String
    var duaTitle: String
    var duaText: String
    var duaGerman: String
    var duaTranslit: String
    var duaCategory: String
    var duaSource: String
    var updatedAt: Date
    var duaId: String
    var postId: String
    var gregorianLabel: String
    var hijriDay: String
    var hijriMonthYear: String
    var islamicEvents: [DarIslamicEvent]

    var dailyOpenHash: String {
        if postId.isEmpty { return "#home" }
        return "#post/\(postId)"
    }

    var duaOpenHash: String {
        if duaId.isEmpty { return "#duas" }
        return "#dua/\(duaId)"
    }

    var ayahOpenHash: String {
        DarDeepLink.quranHash(fromRef: ayahRef) ?? "#quran"
    }

    var calendarOpenHash: String { "#calendar" }

    static let empty = DarWidgetSnapshot(
        themeId: "dark",
        inkHex: "",
        goldHex: "",
        textHex: "",
        mutedHex: "",
        cityLabel: "Standort folgt",
        latitude: 52.5200,
        longitude: 13.4050,
        fajrAngle: 12,
        asrFactor: 1,
        hijriLabel: "",
        qiblaDegrees: 136.3,
        prayers: [],
        nextPrayerName: "Gebetszeiten",
        nextPrayerTime: "—",
        nextPrayerRemaining: "",
        recommendationTitle: "Heute",
        recommendationBody: "Öffne die App für den heutigen Beitrag.",
        postTitle: "",
        postSnippet: "",
        postCategory: "",
        postSource: "",
        ayahArabic: "",
        ayahGerman: "",
        ayahTranslit: "",
        ayahRef: "",
        duaTitle: "Duʿāʾ",
        duaText: "Öffne die App für geprüfte Bittgebete.",
        duaGerman: "",
        duaTranslit: "",
        duaCategory: "",
        duaSource: "",
        updatedAt: Date(timeIntervalSince1970: 0),
        duaId: "",
        postId: "",
        gregorianLabel: "",
        hijriDay: "",
        hijriMonthYear: "",
        islamicEvents: []
    )

    enum CodingKeys: String, CodingKey {
        case themeId, inkHex, goldHex, textHex, mutedHex
        case cityLabel, latitude, longitude, fajrAngle, asrFactor, hijriLabel
        case qiblaDegrees, prayers, canonicalPrayerDays, lastPrayerSyncAt, prayerTimeZone
        case nextPrayerName, nextPrayerTime, nextPrayerRemaining
        case recommendationTitle, recommendationBody
        case postTitle, postSnippet, postCategory, postSource
        case ayahArabic, ayahGerman, ayahTranslit, ayahRef
        case duaTitle, duaText, duaGerman, duaTranslit, duaCategory, duaSource
        case updatedAt, duaId, postId
        case gregorianLabel, hijriDay, hijriMonthYear, islamicEvents
    }

    init(
        themeId: String, inkHex: String, goldHex: String, textHex: String, mutedHex: String,
        cityLabel: String, latitude: Double, longitude: Double, fajrAngle: Double, asrFactor: Double,
        hijriLabel: String, qiblaDegrees: Double, prayers: [DarPrayerSlot],
        nextPrayerName: String, nextPrayerTime: String, nextPrayerRemaining: String,
        recommendationTitle: String, recommendationBody: String,
        postTitle: String, postSnippet: String, postCategory: String, postSource: String,
        ayahArabic: String, ayahGerman: String, ayahTranslit: String, ayahRef: String,
        duaTitle: String, duaText: String, duaGerman: String, duaTranslit: String,
        duaCategory: String, duaSource: String, updatedAt: Date, duaId: String, postId: String,
        gregorianLabel: String, hijriDay: String, hijriMonthYear: String,
        islamicEvents: [DarIslamicEvent],
        canonicalPrayerDays: [DarCanonicalPrayerDay] = [],
        lastPrayerSyncAt: Date? = nil,
        prayerTimeZone: String = "Europe/Berlin"
    ) {
        self.themeId = themeId
        self.inkHex = inkHex
        self.goldHex = goldHex
        self.textHex = textHex
        self.mutedHex = mutedHex
        self.cityLabel = cityLabel
        self.latitude = latitude
        self.longitude = longitude
        self.fajrAngle = fajrAngle
        self.asrFactor = asrFactor
        self.hijriLabel = hijriLabel
        self.qiblaDegrees = qiblaDegrees
        self.prayers = prayers
        self.canonicalPrayerDays = canonicalPrayerDays
        self.lastPrayerSyncAt = lastPrayerSyncAt
        self.prayerTimeZone = prayerTimeZone
        self.nextPrayerName = nextPrayerName
        self.nextPrayerTime = nextPrayerTime
        self.nextPrayerRemaining = nextPrayerRemaining
        self.recommendationTitle = recommendationTitle
        self.recommendationBody = recommendationBody
        self.postTitle = postTitle
        self.postSnippet = postSnippet
        self.postCategory = postCategory
        self.postSource = postSource
        self.ayahArabic = ayahArabic
        self.ayahGerman = ayahGerman
        self.ayahTranslit = ayahTranslit
        self.ayahRef = ayahRef
        self.duaTitle = duaTitle
        self.duaText = duaText
        self.duaGerman = duaGerman
        self.duaTranslit = duaTranslit
        self.duaCategory = duaCategory
        self.duaSource = duaSource
        self.updatedAt = updatedAt
        self.duaId = duaId
        self.postId = postId
        self.gregorianLabel = gregorianLabel
        self.hijriDay = hijriDay
        self.hijriMonthYear = hijriMonthYear
        self.islamicEvents = islamicEvents
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        themeId = try c.decodeIfPresent(String.self, forKey: .themeId) ?? "dark"
        inkHex = try c.decodeIfPresent(String.self, forKey: .inkHex) ?? ""
        goldHex = try c.decodeIfPresent(String.self, forKey: .goldHex) ?? ""
        textHex = try c.decodeIfPresent(String.self, forKey: .textHex) ?? ""
        mutedHex = try c.decodeIfPresent(String.self, forKey: .mutedHex) ?? ""
        cityLabel = try c.decodeIfPresent(String.self, forKey: .cityLabel) ?? "Standort folgt"
        latitude = try c.decodeIfPresent(Double.self, forKey: .latitude) ?? 52.52
        longitude = try c.decodeIfPresent(Double.self, forKey: .longitude) ?? 13.405
        fajrAngle = try c.decodeIfPresent(Double.self, forKey: .fajrAngle) ?? 12
        asrFactor = try c.decodeIfPresent(Double.self, forKey: .asrFactor) ?? 1
        hijriLabel = try c.decodeIfPresent(String.self, forKey: .hijriLabel) ?? ""
        qiblaDegrees = try c.decodeIfPresent(Double.self, forKey: .qiblaDegrees) ?? 136.3
        prayers = try c.decodeIfPresent([DarPrayerSlot].self, forKey: .prayers) ?? []
        canonicalPrayerDays = try c.decodeIfPresent([DarCanonicalPrayerDay].self, forKey: .canonicalPrayerDays) ?? []
        lastPrayerSyncAt = try c.decodeIfPresent(Date.self, forKey: .lastPrayerSyncAt)
        prayerTimeZone = try c.decodeIfPresent(String.self, forKey: .prayerTimeZone) ?? "Europe/Berlin"
        nextPrayerName = try c.decodeIfPresent(String.self, forKey: .nextPrayerName) ?? "Gebetszeiten"
        nextPrayerTime = try c.decodeIfPresent(String.self, forKey: .nextPrayerTime) ?? "—"
        nextPrayerRemaining = try c.decodeIfPresent(String.self, forKey: .nextPrayerRemaining) ?? ""
        recommendationTitle = try c.decodeIfPresent(String.self, forKey: .recommendationTitle) ?? "Heute"
        recommendationBody = try c.decodeIfPresent(String.self, forKey: .recommendationBody) ?? ""
        postTitle = try c.decodeIfPresent(String.self, forKey: .postTitle) ?? ""
        postSnippet = try c.decodeIfPresent(String.self, forKey: .postSnippet) ?? ""
        postCategory = try c.decodeIfPresent(String.self, forKey: .postCategory) ?? ""
        postSource = try c.decodeIfPresent(String.self, forKey: .postSource) ?? ""
        ayahArabic = try c.decodeIfPresent(String.self, forKey: .ayahArabic) ?? ""
        ayahGerman = try c.decodeIfPresent(String.self, forKey: .ayahGerman) ?? ""
        ayahTranslit = try c.decodeIfPresent(String.self, forKey: .ayahTranslit) ?? ""
        ayahRef = try c.decodeIfPresent(String.self, forKey: .ayahRef) ?? ""
        duaTitle = try c.decodeIfPresent(String.self, forKey: .duaTitle) ?? "Duʿāʾ"
        duaText = try c.decodeIfPresent(String.self, forKey: .duaText) ?? ""
        duaGerman = try c.decodeIfPresent(String.self, forKey: .duaGerman) ?? ""
        duaTranslit = try c.decodeIfPresent(String.self, forKey: .duaTranslit) ?? ""
        duaCategory = try c.decodeIfPresent(String.self, forKey: .duaCategory) ?? ""
        duaSource = try c.decodeIfPresent(String.self, forKey: .duaSource) ?? ""
        updatedAt = try c.decodeIfPresent(Date.self, forKey: .updatedAt) ?? Date(timeIntervalSince1970: 0)
        duaId = try c.decodeIfPresent(String.self, forKey: .duaId) ?? ""
        postId = try c.decodeIfPresent(String.self, forKey: .postId) ?? ""
        gregorianLabel = try c.decodeIfPresent(String.self, forKey: .gregorianLabel) ?? ""
        hijriDay = try c.decodeIfPresent(String.self, forKey: .hijriDay) ?? ""
        hijriMonthYear = try c.decodeIfPresent(String.self, forKey: .hijriMonthYear) ?? ""
        islamicEvents = try c.decodeIfPresent([DarIslamicEvent].self, forKey: .islamicEvents) ?? []
    }
}

enum DarWidgetKeys {
    static let appGroup = "group.de.daraltawhid.app"
    static let snapshot = "dar.widget.snapshot.v2"
    static let pendingDestination = "dar.widget.pending.hash"
}


// Absolute instants are decoded once from the WebApp/GitHub JSON. All consumers
// (iPhone, iPad, WidgetKit and ActivityKit) share the same serialized Date values.
struct DarCanonicalPrayerDay: Codable, Equatable {
    struct Location: Codable, Equatable {
        let name: String
        let latitude: Double
        let longitude: Double
    }
    struct Method: Codable, Equatable {
        let fajrAngle: Double
        let asrFactor: Double
    }
    struct Instant: Codable, Equatable {
        let name: String
        let dateTime: Date
    }

    let schemaVersion: Int
    let date: String
    let generatedAt: Date
    let timeZone: String
    let location: Location
    let method: Method?
    let prayers: [String: Instant]

    static let order = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]
    static let fivePrayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"]

    var isValid: Bool {
        guard schemaVersion == 1,
              let zone = TimeZone(identifier: timeZone),
              location.latitude.isFinite, location.longitude.isFinite,
              abs(location.latitude) <= 90, abs(location.longitude) <= 180,
              generatedAt.timeIntervalSinceNow < 300,
              prayers.count >= 6,
              method.map({ $0.fajrAngle.isFinite && $0.asrFactor.isFinite && $0.fajrAngle > 0 && $0.asrFactor > 0 }) ?? true
        else { return false }
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = zone
        formatter.dateFormat = "yyyy-MM-dd"
        guard let parsedDay = formatter.date(from: date),
              formatter.string(from: parsedDay) == date else { return false }
        var previous = Date.distantPast
        for key in Self.order {
            guard let instant = prayers[key],
                  !instant.name.isEmpty,
                  formatter.string(from: instant.dateTime) == date,
                  instant.dateTime > previous else { return false }
            previous = instant.dateTime
        }
        return true
    }

    func matches(_ snapshot: DarWidgetSnapshot) -> Bool {
        guard isValid, snapshot.prayerTimeZone == timeZone,
              abs(location.latitude - snapshot.latitude) < 0.0001,
              abs(location.longitude - snapshot.longitude) < 0.0001 else { return false }
        guard let method else { return true }
        return abs(method.fajrAngle - snapshot.fajrAngle) < 0.001
            && abs(method.asrFactor - snapshot.asrFactor) < 0.001
    }

    func slots() -> [DarPrayerSlot] {
        guard isValid, let zone = TimeZone(identifier: timeZone) else { return [] }
        let clock = DateFormatter()
        clock.calendar = Calendar(identifier: .gregorian)
        clock.locale = Locale(identifier: "de_DE")
        clock.timeZone = zone
        clock.dateFormat = "HH:mm"
        return Self.order.compactMap { key in
            guard let p = prayers[key] else { return nil }
            return DarPrayerSlot(id: key, name: p.name, time: clock.string(from: p.dateTime))
        }
    }
}

extension DarWidgetSnapshot {
    func prayerDay(at now: Date = Date()) -> DarCanonicalPrayerDay? {
        canonicalPrayerDays.first { day in
            guard day.matches(self), let zone = TimeZone(identifier: day.timeZone) else { return false }
            let dayFormatter = DateFormatter()
            dayFormatter.calendar = Calendar(identifier: .gregorian)
            dayFormatter.locale = Locale(identifier: "en_US_POSIX")
            dayFormatter.timeZone = zone
            dayFormatter.dateFormat = "yyyy-MM-dd"
            return day.date == dayFormatter.string(from: now)
        }
    }

    func nextAbsolutePrayer(after now: Date = Date()) -> (id: String, name: String, target: Date)? {
        canonicalPrayerDays
            .filter { $0.matches(self) }
            .flatMap { day in
                DarCanonicalPrayerDay.fivePrayers.compactMap { key -> (id: String, name: String, target: Date)? in
                    guard let prayer = day.prayers[key], prayer.dateTime > now else { return nil }
                    return (id: key, name: prayer.name, target: prayer.dateTime)
                }
            }
            .min { $0.target < $1.target }
    }
}
