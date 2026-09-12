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
        case "type-anthrazit-ar", "appicon", "default", "primary":
            return nil
        case "emblem-nachtblau", "appiconemblemnachtblau":
            return "AppIconEmblemNachtblau"
        case "emblem-schwarzgold", "appiconemblemschwarzgold":
            return "AppIconEmblemSchwarzgold"
        case "emblem-creme-petrol", "appiconemblemcremepetrol":
            return "AppIconEmblemCremePetrol"
        case "type-creme-ar", "appicontypecremear":
            return "AppIconTypeCremeAr"
        case "type-creme", "appicontypecreme":
            return "AppIconTypeCreme"
        case "type-weiss-ar", "appicontypeweissar":
            return "AppIconTypeWeissAr"
        case "type-schwarz-rund", "appicontypeschwarzrund":
            return "AppIconTypeSchwarzRund"
        case "type-anthrazit-fein", "appicontypeanthrazitfein":
            return "AppIconTypeAnthrazitFein"
        case "type-schwarz-ar", "appicontypeschwarzar":
            return "AppIconTypeSchwarzAr"
        case "type-schwarz", "appicontypeschwarz":
            return "AppIconTypeSchwarz"
        case "type-navy-ar", "appicontypenavyar":
            return "AppIconTypeNavyAr"
        case "type-navy", "appicontypenavy":
            return "AppIconTypeNavy"
        case "type-bordeaux-ar", "appicontypebordeauxar":
            return "AppIconTypeBordeauxAr"
        case "type-bordeaux", "appicontypebordeaux":
            return "AppIconTypeBordeaux"
        case "type-gruen-ar", "appicontypegruenar":
            return "AppIconTypeGruenAr"
        case "type-gruen", "appicontypegruen":
            return "AppIconTypeGruen"
        case "type-schwarz-ar2", "appicontypeschwarzar2":
            return "AppIconTypeSchwarzAr2"
        default:
            return nil
        }
    }

    private static let alternateNames: Set<String> = [
        "AppIconEmblemNachtblau",
        "AppIconEmblemSchwarzgold",
        "AppIconEmblemCremePetrol",
        "AppIconTypeCremeAr",
        "AppIconTypeCreme",
        "AppIconTypeWeissAr",
        "AppIconTypeSchwarzRund",
        "AppIconTypeAnthrazitFein",
        "AppIconTypeSchwarzAr",
        "AppIconTypeSchwarz",
        "AppIconTypeNavyAr",
        "AppIconTypeNavy",
        "AppIconTypeBordeauxAr",
        "AppIconTypeBordeaux",
        "AppIconTypeGruenAr",
        "AppIconTypeGruen",
        "AppIconTypeSchwarzAr2"
    ]
}
