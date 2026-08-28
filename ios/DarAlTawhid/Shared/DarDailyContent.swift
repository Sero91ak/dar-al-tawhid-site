import Foundation

enum DarDailyContent {
    private struct AyahCard {
        let german: String
        let translit: String
        let ref: String
    }

    private static let ayahs: [AyahCard] = [
        AyahCard(
            german: "Dir allein dienen wir, und Dich allein bitten wir um Hilfe.",
            translit: "Iyyāka naʿbudu wa iyyāka nastaʿīn.",
            ref: "al-Fātiḥah 1:5"
        ),
        AyahCard(
            german: "Wahrlich, durch das Gedenken Allahs kommen die Herzen zur Ruhe.",
            translit: "Alā bi-dhikrillāhi taṭmaʾinnu l-qulūb.",
            ref: "ar-Raʿd 13:28"
        ),
        AyahCard(
            german: "Gedenket Meiner, so gedenke Ich eurer.",
            translit: "Fadhkurūnī adhkurkum.",
            ref: "al-Baqarah 2:152"
        ),
        AyahCard(
            german: "Und mein Erfolg kommt nur von Allah.",
            translit: "Wa mā tawfīqī illā billāh.",
            ref: "Hūd 11:88"
        ),
        AyahCard(
            german: "Allah genügt als Beschützer, und Allah genügt als Helfer.",
            translit: "Wa kafā billāhi waliyyan wa kafā billāhi naṣīrā.",
            ref: "an-Nisāʾ 4:45"
        )
    ]

    static func refresh(_ base: DarWidgetSnapshot, date: Date = Date()) -> DarWidgetSnapshot {
        var snap = base
        let angle = snap.fajrAngle == 0 ? 12 : snap.fajrAngle
        let asr = snap.asrFactor == 0 ? 1 : snap.asrFactor
        let prayers = DarPrayerEngine.times(
            for: date,
            lat: snap.latitude,
            lng: snap.longitude,
            angle: angle,
            asrFactor: asr
        )
        let next = DarPrayerEngine.next(from: prayers, now: date)
        snap.prayers = prayers
        snap.nextPrayerName = next.name
        snap.nextPrayerTime = next.time
        snap.nextPrayerRemaining = next.remaining
        snap.qiblaDegrees = DarPrayerEngine.qiblaDegrees(lat: snap.latitude, lng: snap.longitude)
        snap.hijriLabel = DarPrayerEngine.hijriLabel(for: date)
        let day = Calendar.current.ordinality(of: .day, in: .year, for: date) ?? 1
        let ayah = ayahs[day % ayahs.count]
        if snap.ayahGerman.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            snap.ayahGerman = ayah.german
            snap.ayahTranslit = ayah.translit
            snap.ayahRef = ayah.ref
        }
        if snap.duaGerman.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            snap.duaTitle = "Duʿāʾ des Tages"
            snap.duaGerman = "Allah genügt uns, und Er ist der beste Sachwalter."
            snap.duaTranslit = "Ḥasbunallāhu wa niʿma l-wakīl."
            snap.duaCategory = "Tawakkul"
        }
        if snap.postTitle.isEmpty {
            snap.recommendationTitle = "Heute empfohlen"
            snap.recommendationBody = "Öffne die App für den geprüften Tagesbeitrag."
        }
        snap.updatedAt = date
        if snap.cityLabel.isEmpty || snap.cityLabel == "Standort folgt" {
            snap.cityLabel = "Berlin (Standard)"
        }
        if snap.themeId.isEmpty { snap.themeId = "dark" }
        return snap
    }
}
