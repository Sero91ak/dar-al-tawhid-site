import SwiftUI

enum DATWidgetTheme: String, Codable, CaseIterable {
    case blackGold
    case forestGold
    case royalNavy
    case burgundy
    case cream
    case iceLight
}

struct DATWidgetPalette {
    let background: Color
    let primaryText: Color
    let secondaryText: Color
    let accent: Color
    let divider: Color
    let subtleDivider: Color
    let marker: Color
    let secondaryBackground: Color

    static func palette(for theme: DATWidgetTheme) -> DATWidgetPalette {
        switch theme {
        case .blackGold:
            return DATWidgetPalette(background: Color(hex: "#090A08"), primaryText: Color(hex: "#F2EBDD"), secondaryText: Color(hex: "#A99D88"), accent: Color(hex: "#C8A967"), divider: Color(hex: "#C8A967").opacity(0.36), subtleDivider: Color(hex: "#C8A967").opacity(0.18), marker: Color(hex: "#80755F").opacity(0.55), secondaryBackground: Color(hex: "#11130F"))
        case .forestGold:
            return DATWidgetPalette(background: Color(hex: "#0C2420"), primaryText: Color(hex: "#F0E8D5"), secondaryText: Color(hex: "#AAB9A9"), accent: Color(hex: "#C7A968"), divider: Color(hex: "#C7A968").opacity(0.34), subtleDivider: Color(hex: "#C7A968").opacity(0.17), marker: Color(hex: "#708A7A").opacity(0.58), secondaryBackground: Color(hex: "#12332D"))
        case .royalNavy:
            return DATWidgetPalette(background: Color(hex: "#09172B"), primaryText: Color(hex: "#F1E8D0"), secondaryText: Color(hex: "#ABB7C7"), accent: Color(hex: "#C6A967"), divider: Color(hex: "#C6A967").opacity(0.34), subtleDivider: Color(hex: "#C6A967").opacity(0.17), marker: Color(hex: "#71829B").opacity(0.56), secondaryBackground: Color(hex: "#10233F"))
        case .burgundy:
            return DATWidgetPalette(background: Color(hex: "#1A0D10"), primaryText: Color(hex: "#F1E8D8"), secondaryText: Color(hex: "#C6AFA5"), accent: Color(hex: "#C9A86A"), divider: Color(hex: "#C9A86A").opacity(0.34), subtleDivider: Color(hex: "#C9A86A").opacity(0.17), marker: Color(hex: "#987C75").opacity(0.58), secondaryBackground: Color(hex: "#2A151A"))
        case .cream:
            return DATWidgetPalette(background: Color(hex: "#EFE7D7"), primaryText: Color(hex: "#211A14"), secondaryText: Color(hex: "#675A4A"), accent: Color(hex: "#7B5B2D"), divider: Color(hex: "#7B5B2D").opacity(0.42), subtleDivider: Color(hex: "#7B5B2D").opacity(0.20), marker: Color(hex: "#998873").opacity(0.55), secondaryBackground: Color(hex: "#E5DAC6"))
        case .iceLight:
            return DATWidgetPalette(background: Color(hex: "#EAF3F8"), primaryText: Color(hex: "#142333"), secondaryText: Color(hex: "#607283"), accent: Color(hex: "#9A7735"), divider: Color(hex: "#9A7735").opacity(0.38), subtleDivider: Color(hex: "#9A7735").opacity(0.19), marker: Color(hex: "#8295A0").opacity(0.52), secondaryBackground: Color(hex: "#E1EDF3"))
        }
    }
}

private extension Color {
    init(hex: String) {
        let value = UInt64(hex.dropFirst(), radix: 16) ?? 0
        self.init(red: Double((value >> 16) & 0xFF) / 255, green: Double((value >> 8) & 0xFF) / 255, blue: Double(value & 0xFF) / 255)
    }
}
