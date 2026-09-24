import SwiftUI

enum KidsTab: Hashable {
    case today
    case stories
    case learn
    case parents
}

enum AgeBand: String, CaseIterable, Identifiable, Hashable {
    case age4to5 = "4–5"
    case age6to8 = "6–8"
    case age9to10 = "9–10"

    var id: String { rawValue }

    var subtitle: String {
        switch self {
        case .age4to5: return "viel hören · kurze Einheiten"
        case .age6to8: return "hören · verstehen · mitmachen"
        case .age9to10: return "verstehen · anwenden · vertiefen"
        }
    }
}

@MainActor
final class AppState: ObservableObject {
    @Published var selectedTab: KidsTab = .today
    @Published var ageBand: AgeBand {
        didSet { UserDefaults.standard.set(ageBand.rawValue, forKey: "kids.ageBand") }
    }
    @Published var dailyMinutes: Int {
        didSet { UserDefaults.standard.set(dailyMinutes, forKey: "kids.dailyMinutes") }
    }

    init() {
        let savedAge = UserDefaults.standard.string(forKey: "kids.ageBand")
        ageBand = AgeBand(rawValue: savedAge ?? "") ?? .age6to8

        let savedMinutes = UserDefaults.standard.integer(forKey: "kids.dailyMinutes")
        dailyMinutes = savedMinutes == 0 ? 12 : savedMinutes
    }
}
