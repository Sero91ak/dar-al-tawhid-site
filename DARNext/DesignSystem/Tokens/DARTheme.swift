import SwiftUI

enum DARAppearanceMode: String, CaseIterable, Identifiable, Sendable {
    case nightLibrary
    case parchmentReader
    case deepBlueBrass

    var id: String { rawValue }

    var title: String {
        switch self {
        case .nightLibrary:
            "Nachtbibliothek"
        case .parchmentReader:
            "Pergament-Leser"
        case .deepBlueBrass:
            "Tiefblau & Messing"
        }
    }

    var theme: DARTheme {
        switch self {
        case .nightLibrary:
            DARTheme.nightLibrary
        case .parchmentReader:
            DARTheme.parchmentReader
        case .deepBlueBrass:
            DARTheme.deepBlueBrass
        }
    }
}

struct DARTheme: Sendable {
    let nightInk: Color
    let deepEmerald: Color
    let antiqueGold: Color
    let parchment: Color
    let inkBrown: Color
    let readerInk: Color
    let mutedText: Color
    let surface: Color
    let usesDarkNavigation: Bool

    static let nightLibrary = DARTheme(
        nightInk: Color(hex: "091B20"),
        deepEmerald: Color(hex: "16372F"),
        antiqueGold: Color(hex: "C7A66C"),
        parchment: Color(hex: "F1E6D2"),
        inkBrown: Color(hex: "76604F"),
        readerInk: Color(hex: "18221F"),
        mutedText: Color.white.opacity(0.68),
        surface: Color.white.opacity(0.075),
        usesDarkNavigation: true
    )

    static let parchmentReader = DARTheme(
        nightInk: Color(hex: "18221F"),
        deepEmerald: Color(hex: "16372F"),
        antiqueGold: Color(hex: "9A7137"),
        parchment: Color(hex: "F1E6D2"),
        inkBrown: Color(hex: "76604F"),
        readerInk: Color(hex: "18221F"),
        mutedText: Color(hex: "76604F").opacity(0.82),
        surface: Color(hex: "E7D7BC").opacity(0.64),
        usesDarkNavigation: false
    )

    static let deepBlueBrass = DARTheme(
        nightInk: Color(hex: "091B20"),
        deepEmerald: Color(hex: "16372F"),
        antiqueGold: Color(hex: "C7A66C"),
        parchment: Color(hex: "F1E6D2"),
        inkBrown: Color(hex: "76604F"),
        readerInk: Color(hex: "18221F"),
        mutedText: Color.white.opacity(0.72),
        surface: Color.white.opacity(0.09),
        usesDarkNavigation: true
    )

    // Compatibility aliases for existing DARNext surfaces.
    var emerald: Color { deepEmerald }
    var deepNavy: Color { nightInk }
    var cream: Color { parchment }
    var gold: Color { antiqueGold }
    var goldLight: Color { antiqueGold.lighter(by: 0.22) }
    var secondaryText: Color { mutedText }

    var backgroundGradient: LinearGradient {
        LinearGradient(
            colors: [deepEmerald.opacity(0.92), nightInk, Color.black.opacity(0.98)],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    var royalGradient: LinearGradient {
        LinearGradient(
            colors: [goldLight, antiqueGold, Color(hex: "76501F")],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    // Existing code uses this name for card fills.
    static let premium = nightLibrary
}

private struct DARThemeKey: EnvironmentKey {
    static let defaultValue = DARTheme.nightLibrary
}

extension EnvironmentValues {
    var darTheme: DARTheme {
        get { self[DARThemeKey.self] }
        set { self[DARThemeKey.self] = newValue }
    }
}

private extension Color {
    init(hex: String) {
        let normalized = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        let value = UInt64(normalized, radix: 16) ?? 0
        self.init(
            red: Double((value >> 16) & 0xFF) / 255,
            green: Double((value >> 8) & 0xFF) / 255,
            blue: Double(value & 0xFF) / 255
        )
    }

    func lighter(by amount: Double) -> Color {
        Color(
            red: min(1, amount + 0.65),
            green: min(1, amount + 0.55),
            blue: min(1, amount + 0.35)
        )
    }
}
