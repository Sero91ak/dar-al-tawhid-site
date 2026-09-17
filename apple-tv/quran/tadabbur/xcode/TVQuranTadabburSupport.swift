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
    let coveragePath: String
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

        do {
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

            entriesByReference = Dictionary(
                uniqueKeysWithValues: merged.map { ($0.reference, $0) }
            )
            isLoaded = true

            let data = try JSONEncoder().encode(merged)
            try data.write(to: cacheURL, options: .atomic)
        } catch {
            // Keep last valid cache. Never replace it with partial/invalid remote data.
            isLoaded = !entriesByReference.isEmpty
        }
    }

    func entry(for reference: String) -> TVQuranTadabbur? {
        entriesByReference[reference]
    }

    private func loadCache() {
        guard let data = try? Data(contentsOf: cacheURL),
              let cached = try? JSONDecoder().decode([TVQuranTadabbur].self, from: data),
              (try? validate(cached, expectedCount: nil)) != nil
        else { return }

        entriesByReference = Dictionary(
            uniqueKeysWithValues: cached.map { ($0.reference, $0) }
        )
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
            guard !entry.text.isEmpty,
                  !entry.narrator.isEmpty,
                  !entry.generation.isEmpty,
                  !entry.source.isEmpty,
                  !entry.grading.isEmpty else {
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

struct TVQuranTadabburCard: View {
    let reference: String
    let tadabbur: TVQuranTadabbur?

    private let gold = Color(red: 0.82, green: 0.70, blue: 0.40)

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("TADABBUR")
                    .font(.caption.weight(.semibold))
                    .tracking(1.5)
                    .foregroundStyle(gold)

                Spacer()

                if let tadabbur {
                    Text(tadabbur.generation)
                        .font(.caption.weight(.medium))
                        .foregroundStyle(gold.opacity(0.88))
                }
            }

            if let tadabbur {
                Text("„\(tadabbur.text)“")
                    .font(.title3)
                    .lineLimit(3)
                    .minimumScaleFactor(0.84)
                    .fixedSize(horizontal: false, vertical: true)

                HStack(spacing: 7) {
                    Text(tadabbur.narrator).fontWeight(.semibold)
                    Text("·")
                    Text(tadabbur.source)
                }
                .font(.footnote)
                .foregroundStyle(.secondary)
                .lineLimit(1)
                .minimumScaleFactor(0.82)

                HStack(spacing: 8) {
                    Text("Qurʾān \(reference)")
                    Text("·")
                    Text("Einstufung: \(tadabbur.grading)")
                }
                .font(.caption)
                .foregroundStyle(.secondary.opacity(0.85))
            } else {
                Text(TVQuranTadabburStore.fallbackText)
                    .font(.body)
                    .foregroundStyle(.secondary)
                    .lineLimit(3)
            }
        }
        .padding(.vertical, 14)
        .padding(.horizontal, 18)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(.ultraThinMaterial.opacity(0.42))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(gold.opacity(0.22), lineWidth: 1)
        )
        .accessibilityElement(children: .combine)
    }
}
