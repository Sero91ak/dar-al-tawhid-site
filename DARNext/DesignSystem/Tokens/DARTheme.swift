import SwiftUI

struct DARTheme {
    let emerald: Color
    let deepNavy: Color
    let cream: Color
    let gold: Color
    let secondaryText: Color

    static let premium = DARTheme(
        emerald: Color(red: 0.05, green: 0.27, blue: 0.22),
        deepNavy: Color(red: 0.04, green: 0.08, blue: 0.16),
        cream: Color(red: 0.97, green: 0.94, blue: 0.86),
        gold: Color(red: 0.78, green: 0.62, blue: 0.30),
        secondaryText: Color.white.opacity(0.68)
    )
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
