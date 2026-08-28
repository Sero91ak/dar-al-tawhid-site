import Foundation

enum DarWidgetRemote {
    private struct DailyFile: Decodable {
        let recommendation: Item?
        let dua: Item?
        struct Item: Decodable {
            let id: String?
            let title: String?
            let snippet: String?
            let category: String?
            let scholar: String?
            let file: String?
            let source: String?
        }
    }

    struct LiveContent {
        var postTitle: String
        var postSnippet: String
        var postCategory: String
        var postSource: String
        var duaTitle: String
        var duaGerman: String
        var duaCategory: String
        var duaSource: String
    }

    static func fetchDaily() async -> LiveContent? {
        guard let url = URL(string: "https://dar-al-tawhid.de/content/updates/daily.json") else { return nil }
        var request = URLRequest(url: url, timeoutInterval: 8)
        request.cachePolicy = .reloadIgnoringLocalCacheData
        do {
            let (data, _) = try await URLSession.shared.data(for: request)
            let file = try JSONDecoder().decode(DailyFile.self, from: data)
            var postSource = file.recommendation?.source ?? ""
            if postSource.isEmpty, let md = file.recommendation?.file, !md.isEmpty {
                postSource = await fetchFrontmatter(from: "https://dar-al-tawhid.de/content/posts/\(md)", keys: ["source", "src"]) ?? ""
            }
            var duaSource = file.dua?.source ?? ""
            if duaSource.isEmpty, let duaId = file.dua?.id, !duaId.isEmpty {
                duaSource = await fetchFrontmatter(
                    from: "https://dar-al-tawhid.de/content/duas/\(duaId).md",
                    keys: ["src", "source"]
                ) ?? ""
            }
            return LiveContent(
                postTitle: file.recommendation?.title ?? "",
                postSnippet: file.recommendation?.snippet ?? "",
                postCategory: [file.recommendation?.category, file.recommendation?.scholar].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " · "),
                postSource: DarSourceFormat.display(postSource, fallback: [file.recommendation?.scholar, file.recommendation?.category].compactMap { $0 }.joined(separator: " · ")),
                duaTitle: file.dua?.title ?? "Duʿāʾ des Tages",
                duaGerman: file.dua?.snippet ?? "",
                duaCategory: file.dua?.category ?? "",
                duaSource: DarSourceFormat.display(duaSource, fallback: file.dua?.category ?? "")
            )
        } catch {
            return nil
        }
    }

    static func applyLive(_ live: LiveContent, to snap: DarWidgetSnapshot) -> DarWidgetSnapshot {
        var next = snap
        if !live.postTitle.isEmpty {
            next.postTitle = live.postTitle
            next.postSnippet = live.postSnippet
            next.postCategory = live.postCategory
            next.postSource = live.postSource
            next.recommendationTitle = "Heute empfohlen"
            next.recommendationBody = live.postSnippet.isEmpty ? live.postTitle : live.postSnippet
        }
        if !live.duaGerman.isEmpty {
            next.duaTitle = live.duaTitle
            next.duaGerman = live.duaGerman
            next.duaCategory = live.duaCategory
            next.duaSource = live.duaSource
        }
        return next
    }

    private static func fetchFrontmatter(from urlString: String, keys: [String]) async -> String? {
        guard let url = URL(string: urlString) else { return nil }
        var request = URLRequest(url: url, timeoutInterval: 8)
        request.cachePolicy = .reloadIgnoringLocalCacheData
        guard let (data, response) = try? await URLSession.shared.data(for: request),
              let http = response as? HTTPURLResponse,
              (200..<300).contains(http.statusCode),
              let text = String(data: data, encoding: .utf8) else { return nil }
        let block = frontmatter(in: text)
        for key in keys {
            if let value = yamlValue(key, in: block), !value.isEmpty {
                return value
            }
        }
        return nil
    }

    private static func frontmatter(in text: String) -> String {
        guard text.hasPrefix("---") else { return "" }
        let rest = text.dropFirst(3)
        guard let end = rest.range(of: "\n---") else { return String(rest) }
        return String(rest[..<end.lowerBound])
    }

    private static func yamlValue(_ key: String, in yaml: String) -> String? {
        for line in yaml.split(separator: "\n") {
            let raw = String(line)
            guard raw.trimmingCharacters(in: .whitespaces).hasPrefix("\(key):") else { continue }
            var value = raw.split(separator: ":", maxSplits: 1).dropFirst().joined(separator: ":")
            value = value.trimmingCharacters(in: .whitespacesAndNewlines)
            if value.hasPrefix("\"") && value.hasSuffix("\"") && value.count >= 2 {
                value = String(value.dropFirst().dropLast())
            }
            return value
        }
        return nil
    }
}
