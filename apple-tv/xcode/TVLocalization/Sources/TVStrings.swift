import Foundation

public enum TVStringKey: String, CaseIterable {
    case brand
    case home
    case posts
    case quran
    case tadabbur
    case athar
    case hadith
    case dua
    case prayer
    case library
    case language
    case choose
    case subtitle
    case settings
    case back
    case close
    case ready
    case active
    case note
    case readGerman
    case awaiting
    case fallbackNotice
    case sources
    case open
    case loading
    case search
    case source
    case meaning
    case verse
    case narrator
    case grading
    case originalArabic
    case retry
}

public final class TVStrings: ObservableObject {
    @Published public private(set) var packs: [String: [String: String]] = [:]
    @Published public private(set) var failed = false
    private let site: URL
    private let session: URLSession

    public init(site: URL = URL(string: "https://dar-al-tawhid.de")!, session: URLSession = .shared) {
        self.site = site
        self.session = session
    }

    public func text(_ key: TVStringKey, locale: String) -> String {
        if let value = packs[locale]?[key.rawValue], !value.isEmpty { return value }
        if let german = packs["de"]?[key.rawValue], !german.isEmpty { return german }
        return key.rawValue
    }

    public func load() async {
        if let local = bundled() {
            apply(local)
            return
        }
        do {
            let remote = site.appendingPathComponent("apple-tv/i18n/ui.json")
            let (data, response) = try await session.data(from: remote)
            guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
                throw URLError(.badServerResponse)
            }
            apply(try JSONDecoder().decode(TVUIFile.self, from: data))
        } catch {
            failed = true
        }
    }

    private func bundled() -> TVUIFile? {
        let candidates: [URL?] = [
            Bundle.main.url(forResource: "ui", withExtension: "json", subdirectory: "i18n"),
            Bundle.main.url(forResource: "ui", withExtension: "json")
        ]
        #if SWIFT_PACKAGE
        var urls = candidates
        urls.insert(Bundle.module.url(forResource: "ui", withExtension: "json"), at: 0)
        #else
        let urls = candidates
        #endif
        for url in urls {
            guard let url, let data = try? Data(contentsOf: url),
                  let file = try? JSONDecoder().decode(TVUIFile.self, from: data) else { continue }
            return file
        }
        return nil
    }

    private func apply(_ file: TVUIFile) {
        packs = file.strings
        failed = false
    }
}

private struct TVUIFile: Decodable {
    var strings: [String: [String: String]]
}
