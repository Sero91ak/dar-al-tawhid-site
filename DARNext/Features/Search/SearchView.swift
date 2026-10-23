import SwiftUI

struct SearchView: View {
    let repository: LocalContentRepository
    @State private var query = ""
    @State private var selectedKind: SearchDocumentKind?
    @State private var results: [SearchDocument] = []
    @State private var errorMessage: String?
    @State private var searchTask: Task<Void, Never>?

    private var filteredResults: [SearchDocument] {
        guard let selectedKind else { return results }
        return results.filter { $0.kind == selectedKind }
    }

    var body: some View {
        List {
            Section {
                Picker("Bereich", selection: $selectedKind) {
                    Text("Alle").tag(nil as SearchDocumentKind?)
                    ForEach(SearchDocumentKind.allCases) { kind in
                        Text(kind.rawValue).tag(kind as SearchDocumentKind?)
                    }
                }
                .pickerStyle(.menu)
            }

            if let errorMessage {
                ContentUnavailableView("Suche nicht verfügbar", systemImage: "magnifyingglass", description: Text(errorMessage))
            } else if query.isEmpty {
                ContentUnavailableView("Suche starten", systemImage: "magnifyingglass", description: Text("Qurʾān, Beiträge, Duʿāʾs und Bibliothek durchsuchen."))
            } else if filteredResults.isEmpty {
                ContentUnavailableView("Keine Treffer", systemImage: "text.magnifyingglass", description: Text("Für diese Eingabe wurde kein geprüfter Inhalt gefunden."))
            } else {
                Section("\(filteredResults.count) Treffer") {
                    ForEach(filteredResults) { result in
                        NavigationLink {
                            SearchDestinationView(repository: repository, result: result)
                        } label: {
                            VStack(alignment: .leading, spacing: 4) {
                                Label(result.title, systemImage: icon(for: result.kind))
                                    .font(.headline)
                                Text(result.preview)
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                                Text(result.sourceID)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }
            }
        }
        .searchable(text: $query, prompt: "DAR-Bibliothek durchsuchen")
        .navigationTitle("Suche")
        .onChange(of: query) {
            runSearch()
        }
        .onChange(of: selectedKind) {
            runSearch()
        }
        .onDisappear {
            searchTask?.cancel()
        }
    }

    private func runSearch() {
        searchTask?.cancel()
        errorMessage = nil

        guard !query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            results = []
            return
        }

        let requestedQuery = query
        let requestedKinds = selectedKind.map { [$0] } ?? Set(SearchDocumentKind.allCases)
        searchTask = Task {
            do {
                try await Task.sleep(for: .milliseconds(250))
                try Task.checkCancellation()
                let newResults = try await repository.search(query: requestedQuery, kinds: requestedKinds)
                try Task.checkCancellation()
                results = newResults
            } catch is CancellationError {
                // An interrupted query is expected while the user is typing.
            } catch {
                guard !Task.isCancelled else { return }
                errorMessage = error.localizedDescription
            }
        }
        /*
         The repository is an actor, so index construction and matching stay
         off the main actor. Cancellation also prevents stale results from
         replacing a newer query.
         */
    }

    private func icon(for kind: SearchDocumentKind) -> String {
        switch kind {
        case .quran: return "book.closed"
        case .post: return "text.alignleft"
        case .dua: return "hands.sparkles"
        case .library: return "books.vertical"
        }
    }
}

private struct SearchDestinationView: View {
    let repository: LocalContentRepository
    let result: SearchDocument

    var body: some View {
        switch result.kind {
        case .quran:
            if let location = QuranSearchLocation(documentID: result.id) {
                QuranSurahView(repository: repository, number: location.surah, focusAyah: location.ayah)
            } else {
                QuranView(repository: repository)
            }
        case .post:
            PostsView(repository: repository)
        case .dua:
            DuaView(repository: repository)
        case .library:
            LibraryView(repository: repository)
        }
    }
}

private struct QuranSearchLocation {
    let surah: Int
    let ayah: Int?

    init?(documentID: String) {
        let parts = documentID.split(separator: "-")
        guard parts.count >= 2, parts[0] == "quran", let surah = Int(parts[1]) else { return nil }
        self.surah = surah
        self.ayah = parts.count >= 3 ? Int(parts[2]) : nil
    }
}
