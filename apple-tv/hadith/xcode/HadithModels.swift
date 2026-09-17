import SwiftUI

struct HadithRecord: Codable, Identifiable {
    let id: String
    let recordType: String?
    let language: String
    let narratorLine: String
    let speakerLabel: String
    let textMarkdown: String
    let source: String
    let grade: String
    let verificationNote: String?
}

extension HadithRecord {
    /// Alte Datensätze ohne `recordType` sind prophetische Ḥadīṯe.
    var normalizedRecordType: String {
        (recordType ?? "hadith").lowercased()
    }

    /// Verbindliche Bezeichnung für den Apple-TV-Kopfbereich.
    /// Niemals "ḤADĪṮ" fest im View hardcoden.
    var displayTypeLabel: String {
        switch normalizedRecordType {
        case "athar":
            return "ĀṮAR"
        case "dua":
            return "DUʿĀʾ"
        case "hadith":
            return "ḤADĪṮ"
        default:
            return normalizedRecordType.uppercased()
        }
    }

    /// Robuste tvOS-Darstellung: Markdown-Steuerzeichen werden niemals sichtbar ausgegeben.
    /// **Text** = fett, *Text* = kursiv/geschwungen.
    var attributedHadith: AttributedString {
        HadithInlineFormatter.attributedString(from: textMarkdown)
    }
}

/// Wiederverwendbare Typ-Kennzeichnung für den rechten oberen Bereich des Bildschirmschoners.
/// Beispiel: ḤADĪṮ / ĀṮAR / DUʿĀʾ.
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
