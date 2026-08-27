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
        }
    }

    static func fetchDaily() async -> (postTitle: String, postSnippet: String, postCategory: String, duaTitle: String, duaGerman: String, duaCategory: String)? {
        guard let url = URL(string: "https://dar-al-tawhid.de/content/updates/daily.json") else { return nil }
        var request = URLRequest(url: url, timeoutInterval: 8)
        request.cachePolicy = .reloadIgnoringLocalCacheData
        do {
            let (data, _) = try await URLSession.shared.data(for: request)
            let file = try JSONDecoder().decode(DailyFile.self, from: data)
            return (
                postTitle: file.recommendation?.title ?? "",
                postSnippet: file.recommendation?.snippet ?? "",
                postCategory: [file.recommendation?.category, file.recommendation?.scholar].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " · "),
                duaTitle: file.dua?.title ?? "Duʿāʾ des Tages",
                duaGerman: file.dua?.snippet ?? "",
                duaCategory: file.dua?.category ?? ""
            )
        } catch {
            return nil
        }
    }

    static func applyLive(_ live: (postTitle: String, postSnippet: String, postCategory: String, duaTitle: String, duaGerman: String, duaCategory: String), to snap: DarWidgetSnapshot) -> DarWidgetSnapshot {
        var next = snap
        if !live.postTitle.isEmpty {
            next.postTitle = live.postTitle
            next.postSnippet = live.postSnippet
            next.postCategory = live.postCategory
            next.recommendationTitle = "Heute empfohlen"
            next.recommendationBody = live.postSnippet.isEmpty ? live.postTitle : live.postSnippet
        }
        if !live.duaGerman.isEmpty {
            next.duaTitle = live.duaTitle
            next.duaGerman = live.duaGerman
            next.duaCategory = live.duaCategory
        }
        return next
    }
}
