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
        applyCalendar(to: &snap, date: date)
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

    private static func applyCalendar(to snap: inout DarWidgetSnapshot, date: Date) {
        var hijri = Calendar(identifier: .islamicUmmAlQura)
        hijri.timeZone = .current
        let parts = hijri.dateComponents([.day, .month, .year], from: date)
        let month = max(1, min(12, parts.month ?? 1))
        let months = [
            "Muḥarram", "Ṣafar", "Rabīʿ al-Awwal", "Rabīʿ ath-Thānī",
            "Jumādā al-Ūlā", "Jumādā ath-Thāniyah", "Rajab", "Shaʿbān",
            "Ramaḍān", "Shawwāl", "Dhū al-Qaʿdah", "Dhū al-Ḥijjah"
        ]
        snap.hijriDay = String(parts.day ?? 1)
        snap.hijriMonthYear = "\(months[month - 1]) \(parts.year ?? 0) AH"
        snap.hijriLabel = "\(snap.hijriDay). \(snap.hijriMonthYear)"

        let gregorian = DateFormatter()
        gregorian.locale = Locale(identifier: "de_DE")
        gregorian.dateFormat = "EEEE, d. MMMM yyyy"
        snap.gregorianLabel = gregorian.string(from: date)
        snap.islamicEvents = upcomingIslamicEvents(from: date, calendar: hijri, months: months)
    }

    private static func upcomingIslamicEvents(
        from date: Date,
        calendar: Calendar,
        months: [String]
    ) -> [DarIslamicEvent] {
        let definitions: [(String, String, Int, Int)] = [
            ("ramadan", "Beginn Ramaḍān", 9, 1),
            ("eid-fitr", "ʿĪd al-Fiṭr", 10, 1),
            ("arafah", "Tag von ʿArafah", 12, 9),
            ("eid-adha", "ʿĪd al-Aḍḥā", 12, 10),
            ("new-year", "Islamisches Neujahr", 1, 1),
            ("ashura", "ʿĀshūrāʾ", 1, 10)
        ]
        let today = Calendar.current.startOfDay(for: date)
        let currentYear = calendar.component(.year, from: date)
        let gregorian = DateFormatter()
        gregorian.locale = Locale(identifier: "de_DE")
        gregorian.dateFormat = "d. MMMM yyyy"

        return [currentYear, currentYear + 1]
            .flatMap { year in
                definitions.compactMap { id, title, month, day -> (Date, DarIslamicEvent)? in
                    var components = DateComponents()
                    components.calendar = calendar
                    components.timeZone = calendar.timeZone
                    components.year = year
                    components.month = month
                    components.day = day
                    components.hour = 12
                    guard let eventDate = calendar.date(from: components) else { return nil }
                    let eventDay = Calendar.current.startOfDay(for: eventDate)
                    let days = Calendar.current.dateComponents([.day], from: today, to: eventDay).day ?? 0
                    guard days >= 0 else { return nil }
                    let event = DarIslamicEvent(
                        id: "\(id)-\(year)",
                        title: title,
                        hijriDate: "\(day). \(months[month - 1]) \(year) AH",
                        gregorianDate: gregorian.string(from: eventDate),
                        daysUntil: days
                    )
                    return (eventDate, event)
                }
            }
            .sorted { $0.0 < $1.0 }
            .prefix(8)
            .map(\.1)
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
