import SwiftUI

struct DarWidgetPalette {
    var id: String
    var ink: Color
    var panel: Color
    var gold: Color
    var cream: Color
    var muted: Color
    var line: Color
}

enum DarWidgetTheme {
    static func palette(for snap: DarWidgetSnapshot) -> DarWidgetPalette {
        var base = named(snap.themeId)
        if let ink = Color(hex: snap.inkHex) { base.ink = ink; base.panel = ink.opacity(0.92) }
        if let gold = Color(hex: snap.goldHex) { base.gold = gold; base.line = gold.opacity(0.28) }
        if let cream = Color(hex: snap.textHex) { base.cream = cream }
        if let muted = Color(hex: snap.mutedHex) { base.muted = muted }
        return base
    }

    private static func named(_ id: String) -> DarWidgetPalette {
        switch id {
        case "light":
            return DarWidgetPalette(id: id,
                ink: Color(hex: "#F7F0DF")!, panel: Color(hex: "#FFF8EB")!,
                gold: Color(hex: "#8A6530")!, cream: Color(hex: "#2F2418")!,
                muted: Color(hex: "#6B5D47")!, line: Color(hex: "#8A6530")!.opacity(0.28))
        case "soft":
            return DarWidgetPalette(id: id,
                ink: Color(hex: "#F2E6E2")!, panel: Color(hex: "#FFF8F1")!,
                gold: Color(hex: "#7D5368")!, cream: Color(hex: "#34232C")!,
                muted: Color(hex: "#715F65")!, line: Color(hex: "#7D5368")!.opacity(0.26))
        case "royal":
            return DarWidgetPalette(id: id,
                ink: Color(hex: "#07162C")!, panel: Color(hex: "#0D1F3D")!,
                gold: Color(hex: "#EFD78E")!, cream: Color(hex: "#FFF2C6")!,
                muted: Color(hex: "#CBBF9F")!, line: Color(hex: "#EFD78E")!.opacity(0.28))
        case "dar-al-layl":
            return DarWidgetPalette(id: id,
                ink: Color(hex: "#090D0B")!, panel: Color(hex: "#0E1310")!,
                gold: Color(hex: "#D8C18B")!, cream: Color(hex: "#F1EDE3")!,
                muted: Color(hex: "#8C938C")!, line: Color(hex: "#A88B4F")!.opacity(0.22))
        case "aurora":
            return DarWidgetPalette(id: id,
                ink: Color(hex: "#050C09")!, panel: Color(hex: "#071A14")!,
                gold: Color(hex: "#E7D59D")!, cream: Color(hex: "#F6F1E3")!,
                muted: Color(hex: "#A8B8B0")!, line: Color(hex: "#D8BE7A")!.opacity(0.24))
        case "bordeaux":
            return DarWidgetPalette(id: id,
                ink: Color(hex: "#140B0C")!, panel: Color(hex: "#211315")!,
                gold: Color(hex: "#D6BE84")!, cream: Color(hex: "#F7EED8")!,
                muted: Color(hex: "#D1C1A8")!, line: Color(hex: "#D6BE84")!.opacity(0.26))
        default:
            return DarWidgetPalette(id: "dark",
                ink: Color(hex: "#080806")!, panel: Color(hex: "#12100C")!,
                gold: Color(hex: "#D6BE84")!, cream: Color(hex: "#F8EFD4")!,
                muted: Color(hex: "#B8A98A")!, line: Color(hex: "#D6BE84")!.opacity(0.22))
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
