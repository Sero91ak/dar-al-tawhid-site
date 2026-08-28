import SwiftUI
import UIKit

struct DarWidgetPalette {
    var id: String
    var ink: Color
    var panel: Color
    var gold: Color
    var cream: Color
    var muted: Color
    var line: Color
    var darkText: Bool

    var brandInk: Color { darkText ? cream : gold }
    var timeInk: Color { darkText ? cream : gold }
}

enum DarWidgetTheme {
    static let brandName = "DAR AL TAWḤĪD"

    static func palette(for snap: DarWidgetSnapshot, look: DarWidgetLook = .eisgold) -> DarWidgetPalette {
        switch look {
        case .app:
            return named(snap.themeId)
        case .eisgold:
            return iceGold()
        case .tinte:
            return named("dark")
        case .pergament:
            return named("light")
        case .royal:
            return named("royal")
        case .bordeaux:
            return named("bordeaux")
        }
    }

    /// Ice-white / ice-blue field, gold strokes, near-black ink.
    static func iceGold() -> DarWidgetPalette {
        DarWidgetPalette(
            id: "eisgold",
            ink: Color(hex: "#EDF6FF")!,
            panel: Color(hex: "#F8FCFF")!,
            gold: Color(hex: "#C8A95A")!,
            cream: Color(hex: "#142033")!,
            muted: Color(hex: "#637083")!,
            line: Color(hex: "#C8A95A")!.opacity(0.34),
            darkText: true
        )
    }

    private static func named(_ id: String) -> DarWidgetPalette {
        switch id {
        case "eisgold":
            return iceGold()
        case "light":
            return DarWidgetPalette(id: id,
                ink: Color(hex: "#F4EEE2")!, panel: Color(hex: "#FFF8EB")!,
                gold: Color(hex: "#7A5A28")!, cream: Color(hex: "#1C1610")!,
                muted: Color(hex: "#5C5142")!, line: Color(hex: "#7A5A28")!.opacity(0.28), darkText: true)
        case "soft":
            return DarWidgetPalette(id: id,
                ink: Color(hex: "#F2E6E2")!, panel: Color(hex: "#FFF8F1")!,
                gold: Color(hex: "#7D5368")!, cream: Color(hex: "#24181E")!,
                muted: Color(hex: "#5A4A50")!, line: Color(hex: "#7D5368")!.opacity(0.26), darkText: true)
        case "royal":
            return DarWidgetPalette(id: id,
                ink: Color(hex: "#07162C")!, panel: Color(hex: "#0D1F3D")!,
                gold: Color(hex: "#EFD78E")!, cream: Color(hex: "#FFF2C6")!,
                muted: Color(hex: "#CBBF9F")!, line: Color(hex: "#EFD78E")!.opacity(0.28), darkText: false)
        case "dar-al-layl":
            return DarWidgetPalette(id: id,
                ink: Color(hex: "#090D0B")!, panel: Color(hex: "#0E1310")!,
                gold: Color(hex: "#D8C18B")!, cream: Color(hex: "#F1EDE3")!,
                muted: Color(hex: "#8C938C")!, line: Color(hex: "#A88B4F")!.opacity(0.22), darkText: false)
        case "aurora":
            return DarWidgetPalette(id: id,
                ink: Color(hex: "#050C09")!, panel: Color(hex: "#071A14")!,
                gold: Color(hex: "#E7D59D")!, cream: Color(hex: "#F6F1E3")!,
                muted: Color(hex: "#A8B8B0")!, line: Color(hex: "#D8BE7A")!.opacity(0.24), darkText: false)
        case "bordeaux":
            return DarWidgetPalette(id: id,
                ink: Color(hex: "#140B0C")!, panel: Color(hex: "#211315")!,
                gold: Color(hex: "#D6BE84")!, cream: Color(hex: "#F7EED8")!,
                muted: Color(hex: "#D1C1A8")!, line: Color(hex: "#D6BE84")!.opacity(0.26), darkText: false)
        default:
            return DarWidgetPalette(id: "dark",
                ink: Color(hex: "#080806")!, panel: Color(hex: "#12100C")!,
                gold: Color(hex: "#D6BE84")!, cream: Color(hex: "#F8EFD4")!,
                muted: Color(hex: "#B8A98A")!, line: Color(hex: "#D6BE84")!.opacity(0.22), darkText: false)
        }
    }
}

extension Color {
    init?(hex: String) {
        var raw = hex.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        if raw.hasPrefix("#") { raw.removeFirst() }
        guard raw.count == 6, let value = UInt64(raw, radix: 16) else { return nil }
        self.init(
            red: Double((value >> 16) & 0xFF) / 255,
            green: Double((value >> 8) & 0xFF) / 255,
            blue: Double(value & 0xFF) / 255
        )
    }
}
