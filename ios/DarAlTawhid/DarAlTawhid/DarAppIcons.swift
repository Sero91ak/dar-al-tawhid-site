import UIKit

enum DarAppIcons {
    static func set(_ name: String) {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        let mapped = resolve(trimmed)
        DispatchQueue.main.async {
            guard UIApplication.shared.supportsAlternateIcons else { return }
            if UIApplication.shared.alternateIconName == mapped { return }
            UIApplication.shared.setAlternateIconName(mapped)
        }
    }

    private static func resolve(_ name: String) -> String? {
        if name.isEmpty { return nil }
        if alternateNames.contains(name) { return name }
        switch name.lowercased() {
        case "creme-navy", "appicon", "default", "primary", "klassisch", "classic":
            return nil
        case "minimal-creme", "appiconminimalcreme":
            return "AppIconMinimalCreme"
        case "graphit-silber", "appicongraphitsilber":
            return "AppIconGraphitSilber"
        case "schwarz-gold", "appiconschwarzgold":
            return "AppIconSchwarzGold"
        case "stein-optik", "appiconsteinoptik":
            return "AppIconSteinOptik"
        case "tiefes-gruen", "tiefes-grün", "appicontiefesgruen":
            return "AppIconTiefesGruen"
        case "bordeaux", "appiconbordeaux":
            return "AppIconBordeaux"
        case "elfenbein", "appiconelfenbein":
            return "AppIconElfenbein"
        case "mitternacht-blau", "appiconmitternachtblau":
            return "AppIconMitternachtBlau"
        default:
            return nil
        }
    }

    private static let alternateNames: Set<String> = [
        "AppIconMinimalCreme",
        "AppIconGraphitSilber",
        "AppIconSchwarzGold",
        "AppIconSteinOptik",
        "AppIconTiefesGruen",
        "AppIconBordeaux",
        "AppIconElfenbein",
        "AppIconMitternachtBlau",
    ]
}
