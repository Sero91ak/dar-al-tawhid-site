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
        case "type-creme-ar", "appicon", "creme-navy", "seal-creme", "default", "primary":
            return nil
        case "emblem-nachtblau", "appiconemblemnachtblau":
            return "AppIconEmblemNachtblau"
        case "emblem-schwarzgold", "appiconemblemschwarzgold":
            return "AppIconEmblemSchwarzgold"
        case "emblem-creme-petrol", "appiconemblemcremepetrol":
            return "AppIconEmblemCremePetrol"
        default:
            return nil
        }
    }

    private static let alternateNames: Set<String> = [
        "AppIconEmblemNachtblau",
        "AppIconEmblemSchwarzgold",
        "AppIconEmblemCremePetrol"
    ]
}
