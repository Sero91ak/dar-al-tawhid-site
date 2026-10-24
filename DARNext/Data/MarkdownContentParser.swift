import Foundation

struct MarkdownContentParser: Sendable {
    func parseDua(id: String, markdown: String) -> Dua? {
        let parsed = parse(markdown)
        guard let title = parsed.frontMatter["title"],
              let arabic = parsed.sections["Arabisch"],
              let transliteration = parsed.sections["Lautschrift"],
              let german = parsed.sections["Deutsch"],
              let source = parsed.sections["Quelle"] else {
            return nil
        }

        return Dua(
            id: parsed.frontMatter["id"] ?? id,
            order: Int(parsed.frontMatter["order"] ?? ""),
            type: parsed.frontMatter["type"],
            category: parsed.frontMatter["cat"],
            title: title,
            occasion: parsed.frontMatter["occasion"],
            arabic: arabic,
            transliteration: transliteration,
            german: german,
            source: source
        )
    }

    func parsePost(id: String, markdown: String) -> Post? {
        let parsed = parse(markdown)
        guard let title = parsed.frontMatter["title"] else { return nil }

        let body = parsed.body.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !body.isEmpty else { return nil }

        return Post(
            id: parsed.frontMatter["id"] ?? id,
            date: parsed.frontMatter["date"],
            title: title,
            category: parsed.frontMatter["category"],
            topic: parsed.frontMatter["topic"],
            scholar: parsed.frontMatter["scholar"],
            book: parsed.frontMatter["book"],
            source: parsed.frontMatter["source"],
            canonicalQSourceNumber: Int(parsed.frontMatter["canonicalQSourceNumber"] ?? parsed.frontMatter["qSourceNumber"] ?? ""),
            body: body
        )
    }

    private func parse(_ markdown: String) -> ParsedMarkdown {
        let lines = markdown.components(separatedBy: .newlines)
        var frontMatter: [String: String] = [:]
        var sections: [String: String] = [:]
        var bodyLines: [String] = []
        var inFrontMatter = false
        var inBody = false
        var currentSection: String?

        for line in lines {
            if line == "---" && !inFrontMatter && !inBody {
                inFrontMatter = true
                continue
            }

            if line == "---" && inFrontMatter {
                inFrontMatter = false
                inBody = true
                continue
            }

            if inFrontMatter, let separator = line.firstIndex(of: ":") {
                let key = String(line[..<separator]).trimmingCharacters(in: .whitespaces)
                let value = String(line[line.index(after: separator)...])
                    .trimmingCharacters(in: .whitespaces)
                    .trimmingCharacters(in: CharacterSet(charactersIn: String(UnicodeScalar(34))))
                frontMatter[key] = value
                continue
            }

            if inBody {
                if line.hasPrefix("## ") {
                    let section = String(line.dropFirst(3)).trimmingCharacters(in: .whitespaces)
                    currentSection = section
                    sections[section] = ""
                } else if let currentSection {
                    sections[currentSection, default: ""].append(line + "\n")
                } else {
                    bodyLines.append(line)
                }
            }
        }

        return ParsedMarkdown(
            frontMatter: frontMatter,
            sections: sections.mapValues { $0.trimmingCharacters(in: .whitespacesAndNewlines) },
            body: bodyLines.joined(separator: "\n")
        )
    }
}

private struct ParsedMarkdown: Sendable {
    let frontMatter: [String: String]
    let sections: [String: String]
    let body: String
}
