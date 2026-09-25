import Foundation

struct PronunciationRule: Decodable {
    let stringToReplace: String
    let alias: String
    let ipa: String?

    enum CodingKeys: String, CodingKey {
        case stringToReplace = "string_to_replace"
        case alias
        case ipa
    }
}

private struct PronunciationPayload: Decodable {
    let rules: [PronunciationRule]
}

final class PronunciationLexicon {
    static let shared = PronunciationLexicon()

    private let buckets: [Character: [PronunciationRule]]

    private init(bundle: Bundle = .main) {
        let loaded = Self.loadRules(bundle: bundle)
        let rules = loaded.isEmpty ? Self.fallbackRules : loaded
        buckets = Dictionary(grouping: rules) { rule in
            rule.stringToReplace.first ?? " "
        }.mapValues { rules in
            rules.sorted { lhs, rhs in
                lhs.stringToReplace.count > rhs.stringToReplace.count
            }
        }
    }

    func prepareForNarration(_ text: String) -> String {
        guard !text.isEmpty else { return text }

        var output = ""
        var index = text.startIndex

        while index < text.endIndex {
            let character = text[index]
            var matched = false

            if let candidates = buckets[character] {
                for rule in candidates where !rule.stringToReplace.isEmpty {
                    guard text[index...].hasPrefix(rule.stringToReplace) else { continue }
                    output += rule.alias.isEmpty ? rule.stringToReplace : rule.alias
                    index = text.index(index, offsetBy: rule.stringToReplace.count)
                    matched = true
                    break
                }
            }

            if !matched {
                output.append(character)
                index = text.index(after: index)
            }
        }

        return output
    }

    func pronunciation(for term: String) -> PronunciationRule? {
        guard let first = term.first else { return nil }
        return buckets[first]?.first(where: { $0.stringToReplace == term })
    }

    private static func loadRules(bundle: Bundle) -> [PronunciationRule] {
        guard let url = bundle.url(forResource: "pronunciation-rules", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let payload = try? JSONDecoder().decode(PronunciationPayload.self, from: data)
        else {
            return []
        }
        return payload.rules
    }

    private static let fallbackRules: [PronunciationRule] = [
        .init(stringToReplace: "DĀR AL TAWḤĪD", alias: "Daar al Tauhiid", ipa: "daːr al tawˈħiːd"),
        .init(stringToReplace: "Tawḥīd", alias: "Tauhiid", ipa: "tawˈħiːd"),
        .init(stringToReplace: "ʿAqīdah", alias: "A-qiidah", ipa: "ʕaˈqiːda"),
        .init(stringToReplace: "Qurʾān", alias: "Qur-aan", ipa: "qurˈʔaːn"),
        .init(stringToReplace: "Mūsā", alias: "Muusaa", ipa: "muːsaː"),
        .init(stringToReplace: "Hārūn", alias: "Haaruun", ipa: "haːruːn"),
        .init(stringToReplace: "Firʿawn", alias: "Fir-aun", ipa: "firʕawn"),
        .init(stringToReplace: "Muḥammad", alias: "Muhammad", ipa: "muħammad"),
        .init(stringToReplace: "ʿalayhi s-salām", alias: "Alaihis-Salaam", ipa: "ʕalajhis.salaːm"),
        .init(stringToReplace: "ṣallā llāhu ʿalayhi wa-sallam", alias: "Sallallaahu alaihi wa sallam", ipa: nil)
    ]
}
