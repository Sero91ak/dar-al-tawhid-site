import SwiftUI

enum DARNextLanguage: String, CaseIterable, Identifiable {
    case arabic = "ar"
    case german = "de"
    case english = "en"
    case turkish = "tr"
    case urdu = "ur"
    case bosnian = "bs"
    case albanian = "sq"
    case french = "fr"
    case indonesian = "id"

    var id: Self { self }
    var locale: Locale { Locale(identifier: rawValue) }
    var isRTL: Bool { self == .arabic || self == .urdu }

    var title: String {
        switch self {
        case .arabic: "العربية"
        case .german: "Deutsch"
        case .english: "English"
        case .turkish: "Türkçe"
        case .urdu: "اردو"
        case .bosnian: "Bosanski"
        case .albanian: "Shqip"
        case .french: "Français"
        case .indonesian: "Bahasa Indonesia"
        }
    }
}
