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
        case qiblaDegrees, prayers, nextPrayerName, nextPrayerTime, nextPrayerRemaining
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
        islamicEvents: [DarIslamicEvent]
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
