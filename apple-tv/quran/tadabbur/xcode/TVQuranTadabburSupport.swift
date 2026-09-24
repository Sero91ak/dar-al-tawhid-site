import Foundation
import SwiftUI

struct TVQuranTadabbur: Codable, Hashable {
    let reference: String
    let text: String
    let narrator: String
    let generation: String
    let source: String
    let grading: String
    let relation: String?
    let note: String?
}

private struct TadabburCatalog: Codable {
    let entriesCount: Int
    let entriesIndexPath: String
    let entriesPaths: [String]?
    let coveragePath: String?
    let fallback: TadabburFallback?
}

private struct TadabburFallback: Codable {
    let enabled: Bool
    let text: String
}

private struct TadabburEntriesIndex: Codable {
    let totalVerifiedEntries: Int
    let files: [TadabburIndexFile]
}

private struct TadabburIndexFile: Codable {
    let path: String
    let count: Int
}

private struct TadabburEnvelope: Codable {
    let entries: [TVQuranTadabbur]
}

@MainActor
final class TVQuranTadabburStore: ObservableObject {
    static let shared = TVQuranTadabburStore()

    static let fallbackText =
        "Für diesen Vers liegt derzeit keine geprüfte Salaf-Überlieferung vor."

    @Published private(set) var entriesByReference: [String: TVQuranTadabbur] = [:]
    @Published private(set) var isLoaded = false
    @Published private(set) var loadedCount = 0

    private let relativeCatalogPath = "quran/tadabbur/catalog.json"
    private let baseURL = URL(
        string: "https://raw.githubusercontent.com/Sero91ak/dar-al-tawhid-site/apple-tv-hadith-staging/apple-tv/quran/tadabbur/"
    )!

    private let cacheURL: URL = {
        FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("tv-quran-tadabbur-cache.json")
    }()

    private init() {}

    func load() async {
        loadCache()

        _ = await RemoteContentSyncService.shared.syncCatalog(relativeCatalogPath: relativeCatalogPath)

        do {
            let merged = try loadFromRemoteContentCache()
            try activate(entries: merged)
            return
        } catch {
            // Fall through to direct remote load, then legacy cache.
        }

        do {
            let merged = try await loadFromRemote()
            try activate(entries: merged)
        } catch {
            // Keep last valid cache. Never replace it with partial/invalid remote data.
            isLoaded = !entriesByReference.isEmpty
            loadedCount = entriesByReference.count
        }
    }

    func entry(for reference: String) -> TVQuranTadabbur? {
        entriesByReference[reference]
    }

    private func loadFromRemoteContentCache() throws -> [TVQuranTadabbur] {
        let catalogURL = try RemoteContentSyncService.shared.cachedFileURL(
            relativeCatalogPath: relativeCatalogPath,
            filePath: "catalog.json"
        )
        let catalogData = try Data(contentsOf: catalogURL)
        let catalog = try JSONDecoder().decode(TadabburCatalog.self, from: catalogData)

        let indexURL = try RemoteContentSyncService.shared.cachedFileURL(
            relativeCatalogPath: relativeCatalogPath,
            filePath: catalog.entriesIndexPath
        )
        let indexData = try Data(contentsOf: indexURL)
        let index = try JSONDecoder().decode(TadabburEntriesIndex.self, from: indexData)

        var merged: [TVQuranTadabbur] = []
        merged.reserveCapacity(index.totalVerifiedEntries)

        for file in index.files {
            let fileURL = try RemoteContentSyncService.shared.cachedFileURL(
                relativeCatalogPath: relativeCatalogPath,
                filePath: file.path
            )
            let data = try Data(contentsOf: fileURL)
            let envelope = try JSONDecoder().decode(TadabburEnvelope.self, from: data)
            guard envelope.entries.count == file.count else {
                throw TadabburError.countMismatch(file.path)
            }
            merged.append(contentsOf: envelope.entries)
        }

        try validate(merged, expectedCount: catalog.entriesCount)
        return merged
    }

    private func loadFromRemote() async throws -> [TVQuranTadabbur] {
        let catalog: TadabburCatalog = try await loadJSON("catalog.json")
        let index: TadabburEntriesIndex = try await loadJSON(catalog.entriesIndexPath)

        var merged: [TVQuranTadabbur] = []
        merged.reserveCapacity(index.totalVerifiedEntries)

        for file in index.files {
            let envelope: TadabburEnvelope = try await loadJSON(file.path)
            guard envelope.entries.count == file.count else {
                throw TadabburError.countMismatch(file.path)
            }
            merged.append(contentsOf: envelope.entries)
        }

        try validate(merged, expectedCount: catalog.entriesCount)
        return merged
    }

    private func activate(entries: [TVQuranTadabbur]) throws {
        let byReference = Dictionary(uniqueKeysWithValues: entries.map { ($0.reference, $0) })
        entriesByReference = byReference
        loadedCount = byReference.count
        isLoaded = true

        let data = try JSONEncoder().encode(entries)
        try data.write(to: cacheURL, options: .atomic)
    }

    private func loadCache() {
        guard let data = try? Data(contentsOf: cacheURL),
              let cached = try? JSONDecoder().decode([TVQuranTadabbur].self, from: data),
              (try? validate(cached, expectedCount: nil)) != nil
        else { return }

        entriesByReference = Dictionary(
            uniqueKeysWithValues: cached.map { ($0.reference, $0) }
        )
        loadedCount = entriesByReference.count
        isLoaded = true
    }

    private func loadJSON<T: Decodable>(_ relativePath: String) async throws -> T {
        let url = baseURL.appendingPathComponent(relativePath)
        let (data, response) = try await URLSession.shared.data(from: url)
        guard let http = response as? HTTPURLResponse,
              (200...299).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
        return try JSONDecoder().decode(T.self, from: data)
    }

    private func validate(_ entries: [TVQuranTadabbur], expectedCount: Int?) throws {
        if let expectedCount, entries.count != expectedCount {
            throw TadabburError.totalCountMismatch
        }

        var seen = Set<String>()
        let regex = try NSRegularExpression(pattern: #"^[0-9]{1,3}:[0-9]{1,3}$"#)

        for entry in entries {
            let range = NSRange(entry.reference.startIndex..<entry.reference.endIndex, in: entry.reference)
            guard regex.firstMatch(in: entry.reference, range: range) != nil else {
                throw TadabburError.invalidReference(entry.reference)
            }
            guard seen.insert(entry.reference).inserted else {
                throw TadabburError.duplicateReference(entry.reference)
            }
            guard !entry.text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
                  !entry.narrator.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
                  !entry.generation.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
                  !entry.source.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
                  !entry.grading.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
                throw TadabburError.incompleteEntry(entry.reference)
            }
        }
    }

    enum TadabburError: Error {
        case invalidReference(String)
        case duplicateReference(String)
        case incompleteEntry(String)
        case countMismatch(String)
        case totalCountMismatch
    }
}

private enum TVQuranTadabburCardStyle {
    static let cornerRadius: CGFloat = 24
    static let primaryText = Color(red: 0.94, green: 0.89, blue: 0.78)
    static let secondaryText = Color(red: 0.72, green: 0.66, blue: 0.54)
    static let mutedText = Color(red: 0.58, green: 0.55, blue: 0.48)
    static let gold = Color(red: 0.76, green: 0.60, blue: 0.32)
    static let cardTop = Color(red: 0.050, green: 0.070, blue: 0.125)
    static let cardBottom = Color(red: 0.022, green: 0.032, blue: 0.064)
}

struct TVQuranTadabburCard: View {
    let reference: String
    let tadabbur: TVQuranTadabbur?

    var body: some View {
        VStack(alignment: .leading, spacing: 11) {
            HStack(alignment: .firstTextBaseline) {
                Text("TADABBUR")
                    .font(.system(size: 15, weight: .semibold, design: .serif))
                    .tracking(1.6)
                    .foregroundStyle(TVQuranTadabburCardStyle.gold)

                Spacer()

                if let tadabbur {
                    Text(tadabbur.generation)
                        .font(.system(size: 14, weight: .medium, design: .serif))
                        .foregroundStyle(TVQuranTadabburCardStyle.gold.opacity(0.88))
                }
            }

            if let tadabbur {
                Text("„\(tadabbur.text)“")
                    .font(.system(size: 22, weight: .regular, design: .serif))
                    .foregroundStyle(TVQuranTadabburCardStyle.primaryText)
                    .lineSpacing(6)
                    .lineLimit(3)
                    .minimumScaleFactor(0.84)
                    .fixedSize(horizontal: false, vertical: true)

                HStack(spacing: 7) {
                    Text(tadabbur.narrator)
                        .fontWeight(.semibold)
                    Text("·")
                    Text(tadabbur.source)
                }
                .font(.system(size: 14, weight: .regular, design: .serif))
                .foregroundStyle(TVQuranTadabburCardStyle.secondaryText)
                .lineLimit(1)
                .minimumScaleFactor(0.82)

                HStack(spacing: 8) {
                    Text("Qurʾān \(reference)")
                    Text("·")
                    Text("Einstufung: \(tadabbur.grading)")
                }
                .font(.system(size: 13, weight: .regular, design: .serif))
                .foregroundStyle(TVQuranTadabburCardStyle.mutedText)
            } else {
                Text(TVQuranTadabburStore.fallbackText)
                    .font(.system(size: 19, weight: .regular, design: .serif))
                    .foregroundStyle(TVQuranTadabburCardStyle.secondaryText)
                    .lineSpacing(5)
                    .lineLimit(3)
            }
        }
        .padding(.vertical, 17)
        .padding(.horizontal, 20)
        .background(cardBackground)
        .overlay(cardBorder)
        .accessibilityElement(children: .combine)
    }

    private var cardBackground: some View {
        RoundedRectangle(cornerRadius: TVQuranTadabburCardStyle.cornerRadius, style: .continuous)
            .fill(
                LinearGradient(
                    colors: [
                        TVQuranTadabburCardStyle.cardTop,
                        TVQuranTadabburCardStyle.cardBottom
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
    }

    private var cardBorder: some View {
        RoundedRectangle(cornerRadius: TVQuranTadabburCardStyle.cornerRadius, style: .continuous)
            .stroke(TVQuranTadabburCardStyle.gold.opacity(0.24), lineWidth: 1)
    }
}
