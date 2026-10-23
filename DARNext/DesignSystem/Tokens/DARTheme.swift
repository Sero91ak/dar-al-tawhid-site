import SwiftUI

struct DARTheme {
    let emerald: Color
    let deepNavy: Color
    let cream: Color
    let gold: Color
    let goldLight: Color
    let secondaryText: Color
    let surface: Color

    static let premium = DARTheme(
        emerald: Color(red: 0.05, green: 0.27, blue: 0.22),
        deepNavy: Color(red: 0.025, green: 0.055, blue: 0.11),
        cream: Color(red: 0.97, green: 0.94, blue: 0.86),
        gold: Color(red: 0.78, green: 0.62, blue: 0.30),
        goldLight: Color(red: 0.93, green: 0.80, blue: 0.48),
        secondaryText: Color.white.opacity(0.68),
        surface: Color.white.opacity(0.075)
    )

    var backgroundGradient: LinearGradient {
        LinearGradient(
            colors: [emerald.opacity(0.92), deepNavy, Color.black.opacity(0.98)],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    var royalGradient: LinearGradient {
        LinearGradient(
            colors: [goldLight, gold, Color(red: 0.47, green: 0.30, blue: 0.10)],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }
}

private struct DARThemeKey: EnvironmentKey {
    static let defaultValue = DARTheme.premium
}

extension EnvironmentValues {
    var darTheme: DARTheme {
        get { self[DARThemeKey.self] }
        set { self[DARThemeKey.self] = newValue }
    }
}
