import Foundation

struct DarPrayerSlot: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let time: String
}

struct DarWidgetSnapshot: Codable, Equatable {
    var cityLabel: String
    var latitude: Double
    var longitude: Double
    var qiblaDegrees: Double
    var prayers: [DarPrayerSlot]
    var nextPrayerName: String
    var nextPrayerTime: String
    var recommendationTitle: String
    var recommendationBody: String
    var ayahArabic: String
    var ayahRef: String
    var duaTitle: String
    var duaText: String
    var updatedAt: Date
    var duaId: String
    var postId: String

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

    static let empty = DarWidgetSnapshot(
        cityLabel: "Standort folgt",
        latitude: 52.5200,
        longitude: 13.4050,
        qiblaDegrees: 136.3,
        prayers: [],
        nextPrayerName: "Gebetszeiten",
        nextPrayerTime: "—",
        recommendationTitle: "Heute",
        recommendationBody: "Öffne die App für den heutigen Beitrag.",
        ayahArabic: "",
        ayahRef: "",
        duaTitle: "Duʿāʾ",
        duaText: "Öffne die App für geprüfte Bittgebete.",
        updatedAt: Date(timeIntervalSince1970: 0),
        duaId: "",
        postId: ""
    )
}

enum DarWidgetKeys {
    static let appGroup = "group.de.daraltawhid.app"
    static let snapshot = "dar.widget.snapshot.v2"
    static let pendingDestination = "dar.widget.pending.hash"
}
