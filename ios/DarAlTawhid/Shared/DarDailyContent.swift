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

    private struct DailyFile: Decodable {
        struct Item: Decodable {
            let id: String?
            let title: String?
            let snippet: String?
            let category: String?
        }
        let dua: Item?
        let recommendation: Item?
    }

    private static let cards: [Card] = [
        Card(
            ayahArabic: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
            ayahRef: "al-Fātiḥah 1:5",
            duaTitle: "Morgenduʿāʾ",
            duaText: "Allāhumma bika aṣbaḥnā wa bika amsaynā.",
            recTitle: "Heute",
            recBody: "Lies die Fātiḥah bewusst und öffne den heutigen Beitrag."
        ),
        Card(
            ayahArabic: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
            ayahRef: "ar-Raʿd 13:28",
            duaTitle: "Ruhe",
            duaText: "Hasbunallāhu wa niʿma l-wakīl.",
            recTitle: "Heute",
            recBody: "Ein Āyah zur Beruhigung des Herzens."
        ),
        Card(
            ayahArabic: "فَاذْكُرُونِي أَذْكُرْكُمْ",
            ayahRef: "al-Baqarah 2:152",
            duaTitle: "Dhikr",
            duaText: "Subḥānallāh, al-ḥamdu lillāh, Allāhu akbar.",
            recTitle: "Heute",
            recBody: "Kurzer Dhikr vor dem nächsten Gebet."
        ),
        Card(
            ayahArabic: "وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ",
            ayahRef: "Hūd 11:88",
            duaTitle: "Tawfīq",
            duaText: "Allāhumma innī asʾaluka l-ʿafwa wal-ʿāfiyah.",
            recTitle: "Heute",
            recBody: "Bitte um Tawfīq — und lies den heutigen Beitrag."
        )
    ]

    static func refresh(_ base: DarWidgetSnapshot, date: Date = Date(), fetchLiveDaily: Bool = false) -> DarWidgetSnapshot {
        var snap = base
        let keptDuaId = snap.duaId
        let keptPostId = snap.postId
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
        snap.duaId = keptDuaId
        snap.postId = keptPostId
        if fetchLiveDaily, let live = fetchDailyFile() {
            if let dua = live.dua {
                snap.duaId = dua.id ?? snap.duaId
                if let title = dua.title, !title.isEmpty { snap.duaTitle = title }
                if let snippet = dua.snippet, !snippet.isEmpty { snap.duaText = snippet }
            }
            if let rec = live.recommendation {
                snap.postId = rec.id ?? snap.postId
                if let title = rec.title, !title.isEmpty { snap.recommendationTitle = title }
                if let snippet = rec.snippet, !snippet.isEmpty {
                    snap.recommendationBody = snippet
                } else if let title = rec.title, !title.isEmpty {
                    snap.recommendationBody = title
                }
            }
        }
        snap.updatedAt = date
        if snap.cityLabel.isEmpty || snap.cityLabel == "Standort folgt" {
            snap.cityLabel = "Berlin (Standard)"
        }
        return snap
    }

    private static func fetchDailyFile() -> DailyFile? {
        guard let url = URL(string: "https://dar-al-tawhid.de/content/updates/daily.json") else { return nil }
        var request = URLRequest(url: url)
        request.timeoutInterval = 4
        request.cachePolicy = .reloadIgnoringLocalCacheData
        let sem = DispatchSemaphore(value: 0)
        var result: DailyFile?
        URLSession.shared.dataTask(with: request) { data, _, _ in
            defer { sem.signal() }
            guard let data else { return }
            result = try? JSONDecoder().decode(DailyFile.self, from: data)
        }.resume()
        _ = sem.wait(timeout: .now() + 4.5)
        return result
    }
}
