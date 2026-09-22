import SwiftUI

struct HadithRecord: Codable, Identifiable {
    let id: String
    let recordType: String?
    let categoryLabel: String?
    let language: String
    let narratorLine: String
    let speakerLabel: String
    let textMarkdown: String
    let source: String

    let sourceBook: String?
    let sourceVolume: String?
    let sourcePage: String?
    let sourceChapter: String?
    let sourceSection: String?
    let sourceHadithNumber: String?
    let sourceEdition: String?

    let grade: String
    let verificationNote: String?

    let sharhStatus: String?
    let sharhText: String?
    let sharhLanguage: String?
    let sharhScholar: String?
    let sharhBook: String?
    let sharhVolume: String?
    let sharhPage: String?
    let sharhChapter: String?
    let sharhSection: String?
    let sharhEdition: String?
    let sharhReference: String?
}

extension HadithRecord {
    /// Alte Datensätze ohne `recordType` sind prophetische Ḥadīṯe.
    var normalizedRecordType: String {
        (recordType ?? "hadith").lowercased()
    }

    var normalizedSharhStatus: String {
        (sharhStatus ?? "missing").lowercased()
    }

    var hasVerifiedSharh: Bool {
        normalizedSharhStatus == "verified" && !(sharhText?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ?? true)
    }

    /// Verbindliche Bezeichnung für den Apple-TV-Kopfbereich.
    /// Niemals "ḤADĪṮ" fest im View hardcoden.
    var displayTypeLabel: String {
        if let label = categoryLabel?.trimmingCharacters(in: .whitespacesAndNewlines), !label.isEmpty {
            return label
        }

        switch normalizedRecordType {
        case "athar":
            let combined = [narratorLine, speakerLabel, grade, source, verificationNote ?? ""]
                .joined(separator: " ")
                .lowercased()

            if combined.contains("ṣaḥāb") || combined.contains("sahab") || combined.contains("gefährte") || combined.contains("gefährten") {
                return "ṢAḤĀBAH-ATHAR"
            }

            if combined.contains("salaf") || combined.contains("tābi") || combined.contains("tabi") || combined.contains("imām") || combined.contains("rahimah") || combined.contains("رحمه") {
                return "SALAF-AUSSAGE"
            }

            return "ĀṮAR"
        case "dua":
            return "DUʿĀʾ"
        case "hadith":
            return "ḤADĪṮ"
        default:
            return normalizedRecordType.uppercased()
        }
    }

    var displayedSource: String {
        let structured = [
            sourceBook,
            formattedPart("Band", sourceVolume),
            formattedPart("S.", sourcePage),
            sourceChapter,
            sourceSection,
            formattedPart("Ḥadīṯ Nr.", sourceHadithNumber),
            sourceEdition
        ]
        .compactMap { $0?.trimmingCharacters(in: .whitespacesAndNewlines) }
        .filter { !$0.isEmpty }
        .joined(separator: " · ")

        return structured.isEmpty ? source : structured
    }

    var displayedSharhSource: String? {
        let structured = [
            sharhScholar,
            sharhBook,
            formattedPart("Band", sharhVolume),
            formattedPart("S.", sharhPage),
            sharhChapter,
            sharhSection,
            sharhEdition,
            sharhReference
        ]
        .compactMap { $0?.trimmingCharacters(in: .whitespacesAndNewlines) }
        .filter { !$0.isEmpty }
        .joined(separator: " · ")

        return structured.isEmpty ? nil : structured
    }

    private func formattedPart(_ prefix: String, _ value: String?) -> String? {
        guard let value = value?.trimmingCharacters(in: .whitespacesAndNewlines), !value.isEmpty else {
            return nil
        }
        return "\(prefix) \(value)"
    }

    /// Robuste tvOS-Darstellung: Markdown-Steuerzeichen werden niemals sichtbar ausgegeben.
    /// **Text** = fett, *Text* = kursiv/geschwungen.
    var attributedHadith: AttributedString {
        HadithInlineFormatter.attributedString(from: textMarkdown)
    }

    var attributedSharh: AttributedString? {
        guard hasVerifiedSharh, let sharhText else { return nil }
        return HadithInlineFormatter.attributedString(from: sharhText)
    }
}

/// Wiederverwendbare Typ-Kennzeichnung für den rechten oberen Bereich des Bildschirmschoners.
/// Beispiel: ḤADĪṮ / ṢAḤĀBAH-ATHAR / SALAF-AUSSAGE / ĀṮAR.
struct AppleTVContentTypeLabel: View {
    let record: HadithRecord

    var body: some View {
        Text(record.displayTypeLabel)
            .font(.system(size: 30, weight: .semibold, design: .serif))
            .tracking(1.2)
            .accessibilityLabel(record.displayTypeLabel)
    }
}

enum HadithInlineFormatter {
    static func attributedString(from markdown: String) -> AttributedString {
        var result = AttributedString()
        var buffer = ""
        var isBold = false
        var isItalic = false
        var index = markdown.startIndex

        func appendBuffer() {
            guard !buffer.isEmpty else { return }
            var part = AttributedString(buffer)

            if isBold && isItalic {
                part.font = .system(size: 38, weight: .bold, design: .serif).italic()
            } else if isBold {
                part.font = .system(size: 38, weight: .bold, design: .default)
            } else if isItalic {
                part.font = .system(size: 38, weight: .medium, design: .serif).italic()
            } else {
                part.font = .system(size: 38, weight: .regular, design: .default)
            }

            result.append(part)
            buffer.removeAll(keepingCapacity: true)
        }

        while index < markdown.endIndex {
            let character = markdown[index]

            if character == "*" {
                let next = markdown.index(after: index)

                if next < markdown.endIndex, markdown[next] == "*" {
                    appendBuffer()
                    isBold.toggle()
                    index = markdown.index(after: next)
                    continue
                }

                appendBuffer()
                isItalic.toggle()
                index = next
                continue
            }

            buffer.append(character)
            index = markdown.index(after: index)
        }

        appendBuffer()
        return result
    }
}
