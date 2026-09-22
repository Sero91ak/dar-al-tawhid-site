import Foundation

struct DarRamadanSeriesDocument: Codable, Sendable {
    let schemaVersion: Int
    let id: String
    let environment: String
    let publicationState: String
    let title: String
    let subtitle: String
    let timezone: String
    let activationMode: String
    let startDate: String?
    let plannedDays: Int
    let actualDays: Int?
    let seriesState: String
    let testMode: DarRamadanTestMode
    let days: [DarRamadanDay]
}

struct DarRamadanTestMode: Codable, Sendable {
    let enabled: Bool
    let overrideDay: Int?
    let allowManualStepping: Bool
}

struct DarRamadanDay: Codable, Identifiable, Sendable {
    var id: Int { day }
    let day: Int
    let slug: String
    let title: String
    let contentStatus: String
    let summary: String
}

enum DarRamadanClock {
    static func currentDay(
        for series: DarRamadanSeriesDocument,
        now: Date = Date()
    ) -> Int? {
        if series.testMode.enabled, let override = series.testMode.overrideDay {
            return min(max(override, 1), 30)
        }

        guard let startDate = series.startDate else { return nil }
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: series.timezone) ?? .current

        let parts = startDate.split(separator: "-").compactMap { Int($0) }
        guard parts.count == 3 else { return nil }

        var components = DateComponents()
        components.calendar = calendar
        components.timeZone = calendar.timeZone
        components.year = parts[0]
        components.month = parts[1]
        components.day = parts[2]

        guard let start = calendar.date(from: components) else { return nil }

        let today = calendar.startOfDay(for: now)
        let startDay = calendar.startOfDay(for: start)
        guard let offset = calendar.dateComponents([.day], from: startDay, to: today).day else {
            return nil
        }

        let day = offset + 1
        let finalDay = series.actualDays ?? series.plannedDays
        guard day >= 1, day <= finalDay else { return nil }
        return day
    }

    static func day(
        _ number: Int,
        in series: DarRamadanSeriesDocument
    ) -> DarRamadanDay? {
        series.days.first { $0.day == number }
    }
}
