import SwiftUI

enum KidsTab: Hashable {
    case today
    case stories
    case learn
    case parents
}

enum AgeBand: String, CaseIterable, Identifiable, Hashable {
    case age4to5 = "4–5"
    case age6to7 = "6–7"
    case age8to10 = "8–10"

    var id: String { rawValue }

    var subtitle: String {
        switch self {
        case .age4to5:
            return "nur hören · große Bilder · kein Lesetext"
        case .age6to7:
            return "hören · kurzer Lesetext · einfache Sätze"
        case .age8to10:
            return "hören · selbst lesen · Quellen entdecken"
        }
    }

    var storyModeLabel: String {
        switch self {
        case .age4to5: return "Nur Audio"
        case .age6to7: return "Audio + kurz lesen"
        case .age8to10: return "Audio + lesen + Quellen"
        }
    }

    var showsStoryReading: Bool {
        self != .age4to5
    }

    var showsStorySources: Bool {
        self == .age8to10
    }

    var narrationRate: Float {
        switch self {
        case .age4to5: return 0.40
        case .age6to7: return 0.42
        case .age8to10: return 0.44
        }
    }
}

@MainActor
final class AppState: ObservableObject {
    @Published var selectedTab: KidsTab = .today
    @Published var ageBand: AgeBand {
        didSet {
            UserDefaults.standard.set(ageBand.rawValue, forKey: "kids.ageBand")
        }
    }
    @Published var dailyMinutes: Int {
        didSet {
            UserDefaults.standard.set(dailyMinutes, forKey: "kids.dailyMinutes")
        }
    }

    init() {
        let savedAge = UserDefaults.standard.string(forKey: "kids.ageBand")
        switch savedAge {
        case AgeBand.age4to5.rawValue:
            ageBand = .age4to5
        case "6–8", AgeBand.age6to7.rawValue:
            ageBand = .age6to7
        case "9–10", AgeBand.age8to10.rawValue:
            ageBand = .age8to10
        default:
            ageBand = .age6to7
        }

        let savedMinutes = UserDefaults.standard.integer(forKey: "kids.dailyMinutes")
        dailyMinutes = savedMinutes == 0 ? 12 : savedMinutes
    }
}
