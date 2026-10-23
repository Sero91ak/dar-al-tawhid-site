import Foundation

struct DashboardSnapshot: Sendable {
    let nextPrayer: PrayerSummary?
    let verse: VerseSummary?
    let recommendation: Recommendation?
    let continueReading: ReadingProgress?
}

struct PrayerSummary: Identifiable, Sendable {
    let id = UUID()
    let name: String
    let time: String
    let locationLabel: String
}

struct VerseSummary: Identifiable, Sendable {
    let id = UUID()
    let arabicText: String
    let translation: String
    let reference: String
}

struct Recommendation: Identifiable, Sendable {
    let id = UUID()
    let title: String
    let category: String
    let sourceID: String
}

struct ReadingProgress: Identifiable, Sendable {
    let id = UUID()
    let title: String
    let detail: String
    let progress: Double
}
