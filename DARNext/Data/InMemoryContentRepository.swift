import Foundation

struct InMemoryContentRepository: ContentRepository {
    func dashboardSnapshot() async throws -> DashboardSnapshot {
        DashboardSnapshot(
            nextPrayer: PrayerSummary(
                name: "ʿAṣr",
                time: "16:42",
                locationLabel: "Standort für Gebetszeiten aktivieren"
            ),
            verse: VerseSummary(
                arabicText: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
                translation: "Gewiss, mit der Erschwernis ist Erleichterung.",
                reference: "Qurʾān 94:6"
            ),
            recommendation: Recommendation(
                title: "Die Bedeutung aufrichtiger Absicht",
                category: "Beitrag",
                sourceID: "post:dar-next-demo-001"
            ),
            continueReading: ReadingProgress(
                title: "Qurʾān fortsetzen",
                detail: "Sūrat al-Baqarah · Āyah 21",
                progress: 0.42
            )
        )
    }
}
