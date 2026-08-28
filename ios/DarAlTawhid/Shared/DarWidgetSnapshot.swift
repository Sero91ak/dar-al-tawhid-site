import Foundation

struct DarPrayerSlot: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let time: String
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
        if s.count > 72 {
            let end = s.index(s.startIndex, offsetBy: 69)
            s = String(s[..<end]) + "…"
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
    var ayahGerman: String
    var ayahTranslit: String
    var ayahRef: String
    var duaTitle: String
    var duaGerman: String
    var duaTranslit: String
    var duaCategory: String
    var duaSource: String
    var updatedAt: Date

    var postSourceLine: String { DarSourceFormat.display(postSource, fallback: postCategory) }
    var duaSourceLine: String { DarSourceFormat.display(duaSource, fallback: duaCategory) }

    static let empty = DarWidgetSnapshot(
        themeId: "dark",
        inkHex: "",
        goldHex: "",
        textHex: "",
        mutedHex: "",
        cityLabel: "Berlin (Standard)",
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
        recommendationTitle: "Heute empfohlen",
        recommendationBody: "Öffne die App für den heutigen Beitrag.",
        postTitle: "",
        postSnippet: "",
        postCategory: "",
        postSource: "",
        ayahGerman: "",
        ayahTranslit: "",
        ayahRef: "",
        duaTitle: "Duʿāʾ des Tages",
        duaGerman: "Öffne die App für geprüfte Bittgebete.",
        duaTranslit: "",
        duaCategory: "",
        duaSource: "",
        updatedAt: Date(timeIntervalSince1970: 0)
    )

    enum CodingKeys: String, CodingKey {
        case themeId, inkHex, goldHex, textHex, mutedHex, cityLabel, latitude, longitude, fajrAngle, asrFactor, hijriLabel, qiblaDegrees, prayers
        case nextPrayerName, nextPrayerTime, nextPrayerRemaining
        case recommendationTitle, recommendationBody
        case postTitle, postSnippet, postCategory, postSource
        case ayahGerman, ayahTranslit, ayahRef
        case duaTitle, duaGerman, duaTranslit, duaCategory, duaSource
        case updatedAt
    }

    init(
        themeId: String, inkHex: String, goldHex: String, textHex: String, mutedHex: String,
        cityLabel: String, latitude: Double, longitude: Double, fajrAngle: Double, asrFactor: Double,
        hijriLabel: String, qiblaDegrees: Double,
        prayers: [DarPrayerSlot], nextPrayerName: String, nextPrayerTime: String, nextPrayerRemaining: String,
        recommendationTitle: String, recommendationBody: String, postTitle: String, postSnippet: String,
        postCategory: String, postSource: String = "", ayahGerman: String, ayahTranslit: String, ayahRef: String, duaTitle: String,
        duaGerman: String, duaTranslit: String, duaCategory: String, duaSource: String = "", updatedAt: Date
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
        self.ayahGerman = ayahGerman
        self.ayahTranslit = ayahTranslit
        self.ayahRef = ayahRef
        self.duaTitle = duaTitle
        self.duaGerman = duaGerman
        self.duaTranslit = duaTranslit
        self.duaCategory = duaCategory
        self.duaSource = duaSource
        self.updatedAt = updatedAt
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        themeId = try c.decodeIfPresent(String.self, forKey: .themeId) ?? "dark"
        inkHex = try c.decodeIfPresent(String.self, forKey: .inkHex) ?? ""
        goldHex = try c.decodeIfPresent(String.self, forKey: .goldHex) ?? ""
        textHex = try c.decodeIfPresent(String.self, forKey: .textHex) ?? ""
        mutedHex = try c.decodeIfPresent(String.self, forKey: .mutedHex) ?? ""
        cityLabel = try c.decodeIfPresent(String.self, forKey: .cityLabel) ?? "Berlin (Standard)"
        latitude = try c.decodeIfPresent(Double.self, forKey: .latitude) ?? 52.52
        longitude = try c.decodeIfPresent(Double.self, forKey: .longitude) ?? 13.405
        fajrAngle = try c.decodeIfPresent(Double.self, forKey: .fajrAngle) ?? 12
        asrFactor = try c.decodeIfPresent(Double.self, forKey: .asrFactor) ?? 1
        hijriLabel = try c.decodeIfPresent(String.self, forKey: .hijriLabel) ?? ""
        qiblaDegrees = try c.decodeIfPresent(Double.self, forKey: .qiblaDegrees) ?? 136.3
        prayers = try c.decodeIfPresent([DarPrayerSlot].self, forKey: .prayers) ?? []
        nextPrayerName = try c.decodeIfPresent(String.self, forKey: .nextPrayerName) ?? "Gebet"
        nextPrayerTime = try c.decodeIfPresent(String.self, forKey: .nextPrayerTime) ?? "—"
        nextPrayerRemaining = try c.decodeIfPresent(String.self, forKey: .nextPrayerRemaining) ?? ""
        recommendationTitle = try c.decodeIfPresent(String.self, forKey: .recommendationTitle) ?? "Heute empfohlen"
        recommendationBody = try c.decodeIfPresent(String.self, forKey: .recommendationBody) ?? ""
        postTitle = try c.decodeIfPresent(String.self, forKey: .postTitle) ?? ""
        postSnippet = try c.decodeIfPresent(String.self, forKey: .postSnippet) ?? ""
        postCategory = try c.decodeIfPresent(String.self, forKey: .postCategory) ?? ""
        postSource = try c.decodeIfPresent(String.self, forKey: .postSource) ?? ""
        ayahGerman = try c.decodeIfPresent(String.self, forKey: .ayahGerman) ?? ""
        ayahTranslit = try c.decodeIfPresent(String.self, forKey: .ayahTranslit) ?? ""
        ayahRef = try c.decodeIfPresent(String.self, forKey: .ayahRef) ?? ""
        duaTitle = try c.decodeIfPresent(String.self, forKey: .duaTitle) ?? "Duʿāʾ des Tages"
        duaGerman = try c.decodeIfPresent(String.self, forKey: .duaGerman) ?? ""
        duaTranslit = try c.decodeIfPresent(String.self, forKey: .duaTranslit) ?? ""
        duaCategory = try c.decodeIfPresent(String.self, forKey: .duaCategory) ?? ""
        duaSource = try c.decodeIfPresent(String.self, forKey: .duaSource) ?? ""
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
        try c.encode(fajrAngle, forKey: .fajrAngle)
        try c.encode(asrFactor, forKey: .asrFactor)
        try c.encode(hijriLabel, forKey: .hijriLabel)
        try c.encode(qiblaDegrees, forKey: .qiblaDegrees)
        try c.encode(prayers, forKey: .prayers)
        try c.encode(nextPrayerName, forKey: .nextPrayerName)
        try c.encode(nextPrayerTime, forKey: .nextPrayerTime)
        try c.encode(nextPrayerRemaining, forKey: .nextPrayerRemaining)
        try c.encode(recommendationTitle, forKey: .recommendationTitle)
        try c.encode(recommendationBody, forKey: .recommendationBody)
        try c.encode(postTitle, forKey: .postTitle)
        try c.encode(postSnippet, forKey: .postSnippet)
        try c.encode(postCategory, forKey: .postCategory)
        try c.encode(postSource, forKey: .postSource)
        try c.encode(ayahGerman, forKey: .ayahGerman)
        try c.encode(ayahTranslit, forKey: .ayahTranslit)
        try c.encode(ayahRef, forKey: .ayahRef)
        try c.encode(duaTitle, forKey: .duaTitle)
        try c.encode(duaGerman, forKey: .duaGerman)
        try c.encode(duaTranslit, forKey: .duaTranslit)
        try c.encode(duaCategory, forKey: .duaCategory)
        try c.encode(duaSource, forKey: .duaSource)
        try c.encode(updatedAt, forKey: .updatedAt)
    }
}

enum DarWidgetKeys {
    static let appGroup = "group.de.daraltawhid.app"
    static let snapshot = "dar.widget.snapshot.v2"
    static let pendingDestination = "dar.widget.pending.destination"
    static let pendingNonce = "dar.widget.pending.nonce"
}
