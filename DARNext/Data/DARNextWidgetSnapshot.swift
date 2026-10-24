import Foundation

struct DARNextPrayerSlot: Codable, Identifiable, Hashable, Sendable {
    let id: String
    let name: String
    let time: String
}

struct DARNextCalendarRow: Codable, Identifiable, Hashable, Sendable {
    let id: String
    let gregorianDate: String
    let hijriDate: String
    let weekday: String
}

struct DARNextWidgetSnapshot: Decodable, Sendable {
    let cityLabel: String
    let hijriLabel: String
    let calendarRows: [DARNextCalendarRow]
    let qiblaDegrees: Double
    let prayers: [DARNextPrayerSlot]
    let nextPrayerName: String
    let nextPrayerTime: String
    let nextPrayerRemaining: String
    let postTitle: String
    let postSnippet: String
    let postCategory: String
    let postSource: String
    let ayahGerman: String
    let ayahTranslit: String
    let ayahRef: String
    let duaTitle: String
    let duaGerman: String
    let duaTranslit: String
    let duaCategory: String
    let duaSource: String
    let weatherTemperature: Double?
    let weatherCondition: String
    let weatherSymbolName: String

    static let empty = DARNextWidgetSnapshot(
        cityLabel: "",
        hijriLabel: "",
        calendarRows: [],
        qiblaDegrees: 126,
        prayers: [],
        nextPrayerName: "Gebetszeiten",
        nextPrayerTime: "—",
        nextPrayerRemaining: "",
        postTitle: "",
        postSnippet: "",
        postCategory: "",
        postSource: "",
        ayahGerman: "",
        ayahTranslit: "",
        ayahRef: "",
        duaTitle: "",
        duaGerman: "",
        duaTranslit: "",
        duaCategory: "",
        duaSource: "",
        weatherTemperature: nil,
        weatherCondition: "",
        weatherSymbolName: ""
    )

    init(
        cityLabel: String,
        hijriLabel: String,
        calendarRows: [DARNextCalendarRow],
        qiblaDegrees: Double,
        prayers: [DARNextPrayerSlot],
        nextPrayerName: String,
        nextPrayerTime: String,
        nextPrayerRemaining: String,
        postTitle: String,
        postSnippet: String,
        postCategory: String,
        postSource: String,
        ayahGerman: String,
        ayahTranslit: String,
        ayahRef: String,
        duaTitle: String,
        duaGerman: String,
        duaTranslit: String,
        duaCategory: String,
        duaSource: String,
        weatherTemperature: Double?,
        weatherCondition: String,
        weatherSymbolName: String
    ) {
        self.cityLabel = cityLabel
        self.hijriLabel = hijriLabel
        self.calendarRows = calendarRows
        self.qiblaDegrees = qiblaDegrees
        self.prayers = prayers
        self.nextPrayerName = nextPrayerName
        self.nextPrayerTime = nextPrayerTime
        self.nextPrayerRemaining = nextPrayerRemaining
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
        self.weatherTemperature = weatherTemperature
        self.weatherCondition = weatherCondition
        self.weatherSymbolName = weatherSymbolName
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        cityLabel = try container.decodeIfPresent(String.self, forKey: .cityLabel) ?? ""
        hijriLabel = try container.decodeIfPresent(String.self, forKey: .hijriLabel) ?? ""
        calendarRows = try container.decodeIfPresent([DARNextCalendarRow].self, forKey: .calendarRows) ?? []
        qiblaDegrees = try container.decodeIfPresent(Double.self, forKey: .qiblaDegrees) ?? 126
        prayers = try container.decodeIfPresent([DARNextPrayerSlot].self, forKey: .prayers) ?? []
        nextPrayerName = try container.decodeIfPresent(String.self, forKey: .nextPrayerName) ?? "Gebetszeiten"
        nextPrayerTime = try container.decodeIfPresent(String.self, forKey: .nextPrayerTime) ?? "—"
        nextPrayerRemaining = try container.decodeIfPresent(String.self, forKey: .nextPrayerRemaining) ?? ""
        postTitle = try container.decodeIfPresent(String.self, forKey: .postTitle) ?? ""
        postSnippet = try container.decodeIfPresent(String.self, forKey: .postSnippet) ?? ""
        postCategory = try container.decodeIfPresent(String.self, forKey: .postCategory) ?? ""
        postSource = try container.decodeIfPresent(String.self, forKey: .postSource) ?? ""
        ayahGerman = try container.decodeIfPresent(String.self, forKey: .ayahGerman) ?? ""
        ayahTranslit = try container.decodeIfPresent(String.self, forKey: .ayahTranslit) ?? ""
        ayahRef = try container.decodeIfPresent(String.self, forKey: .ayahRef) ?? ""
        duaTitle = try container.decodeIfPresent(String.self, forKey: .duaTitle) ?? ""
        duaGerman = try container.decodeIfPresent(String.self, forKey: .duaGerman) ?? ""
        duaTranslit = try container.decodeIfPresent(String.self, forKey: .duaTranslit) ?? ""
        duaCategory = try container.decodeIfPresent(String.self, forKey: .duaCategory) ?? ""
        duaSource = try container.decodeIfPresent(String.self, forKey: .duaSource) ?? ""
        weatherTemperature = try container.decodeIfPresent(Double.self, forKey: .weatherTemperature)
        weatherCondition = try container.decodeIfPresent(String.self, forKey: .weatherCondition) ?? ""
        weatherSymbolName = try container.decodeIfPresent(String.self, forKey: .weatherSymbolName) ?? ""
    }

    private enum CodingKeys: String, CodingKey {
        case cityLabel, hijriLabel, calendarRows, qiblaDegrees, prayers
        case nextPrayerName, nextPrayerTime, nextPrayerRemaining
        case postTitle, postSnippet, postCategory, postSource
        case ayahGerman, ayahTranslit, ayahRef
        case duaTitle, duaGerman, duaTranslit, duaCategory, duaSource
        case weatherTemperature, weatherCondition, weatherSymbolName
    }
}

enum DARNextWidgetStore {
    private static let appGroup = "group.de.daraltawhid.app"
    private static let snapshotKey = "dar.widget.snapshot.v2"

    static func load() -> DARNextWidgetSnapshot {
        let defaults = UserDefaults(suiteName: appGroup) ?? .standard
        guard let data = defaults.data(forKey: snapshotKey),
              let snapshot = try? JSONDecoder().decode(DARNextWidgetSnapshot.self, from: data) else {
            return .empty
        }
        return snapshot
    }
}
