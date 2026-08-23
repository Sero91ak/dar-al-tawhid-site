import Foundation

enum DarDailyContent {
    private struct Card {
        let ayahArabic: String
        let ayahRef: String
        let duaTitle: String
        let duaText: String
        let recTitle: String
        let recBody: String
    }

    private static let cards: [Card] = [
        Card(
            ayahArabic: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
            ayahRef: "al-Fātiḥah 1:5",
            duaTitle: "Morgenduʿāʾ",
            duaText: "Allāhumma bika aṣbaḥnā wa bika amsaynā.",
            recTitle: "Heute",
            recBody: "Lies die Fātiḥah bewusst und öffne den Feed für den Tagesbeitrag."
        ),
        Card(
            ayahArabic: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
            ayahRef: "ar-Raʿd 13:28",
            duaTitle: "Ruhe",
            duaText: "Hasbunallāhu wa niʿma l-wakīl.",
            recTitle: "Heute",
            recBody: "Ein Āyah zur Beruhigung des Herzens — dann Qibla und Gebetszeit prüfen."
        ),
        Card(
            ayahArabic: "فَاذْكُرُونِي أَذْكُرْكُمْ",
            ayahRef: "al-Baqarah 2:152",
            duaTitle: "Dhikr",
            duaText: "Subḥānallāh, al-ḥamdu lillāh, Allāhu akbar.",
            recTitle: "Heute",
            recBody: "Kurzer Dhikr vor dem nächsten Gebet. Tippen öffnet die App."
        ),
        Card(
            ayahArabic: "وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ",
            ayahRef: "Hūd 11:88",
            duaTitle: "Tawfīq",
            duaText: "Allāhumma innī asʾaluka l-ʿafwa wal-ʿāfiyah.",
            recTitle: "Heute",
            recBody: "Bitte um Tawfīq — und lies den heutigen Beitrag in der App."
        )
    ]

    static func refresh(_ base: DarWidgetSnapshot, date: Date = Date()) -> DarWidgetSnapshot {
        var snap = base
        let prayers = DarPrayerEngine.times(for: date, lat: snap.latitude, lng: snap.longitude)
        let next = DarPrayerEngine.next(from: prayers, now: date)
        snap.prayers = prayers
        snap.nextPrayerName = next.name
        snap.nextPrayerTime = next.time
        snap.qiblaDegrees = DarPrayerEngine.qiblaDegrees(lat: snap.latitude, lng: snap.longitude)
        let day = Calendar.current.ordinality(of: .day, in: .year, for: date) ?? 1
        let card = cards[day % cards.count]
        snap.ayahArabic = card.ayahArabic
        snap.ayahRef = card.ayahRef
        snap.duaTitle = card.duaTitle
        snap.duaText = card.duaText
        snap.recommendationTitle = card.recTitle
        snap.recommendationBody = card.recBody
        snap.updatedAt = date
        if snap.cityLabel.isEmpty || snap.cityLabel == "Standort folgt" {
            snap.cityLabel = "Berlin (Standard)"
        }
        return snap
    }
}
