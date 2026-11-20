import Observation
import SwiftUI

struct AssistantSourceReference: Identifiable, Hashable, Sendable {
    let id: String
    let title: String
    let kind: SearchDocumentKind
    let sourceID: String
}

struct AssistantMessage: Identifiable, Hashable, Sendable {
    let id = UUID()
    let isUser: Bool
    let text: String
    let sources: [AssistantSourceReference]
}

protocol KnowledgeAssistantTransport: Sendable {
    func answer(prompt: String, sources: [AssistantSourceReference]) async throws -> String
}

struct LocalKnowledgeAssistantTransport: KnowledgeAssistantTransport {
    func answer(prompt: String, sources: [AssistantSourceReference]) async throws -> String {
        let matchingSources = sources.filter { !$0.sourceID.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
        guard !matchingSources.isEmpty else {
            return "In der lokalen DAR-Bibliothek wurde kein passender Treffer gefunden. Deshalb formuliere ich dazu keine religiöse Antwort."
        }

        let titles = matchingSources.prefix(3).map(\.title).joined(separator: "; ")
        return "Die lokale Suche hat passende Inhalte gefunden: \(titles). Dieser Prototyp erstellt noch keine eigenständige religiöse Antwort. Öffne die Fundstellen und prüfe den jeweiligen Originaltext."
    }
}

@MainActor
@Observable
final class DashboardAssistantModel {
    var prompt = ""
    private(set) var messages: [AssistantMessage] = []
    private(set) var isLoading = false
    private(set) var errorMessage: String?

    private let repository: LocalContentRepository
    private let transport: any KnowledgeAssistantTransport

    init(repository: LocalContentRepository, transport: any KnowledgeAssistantTransport = LocalKnowledgeAssistantTransport()) {
        self.repository = repository
        self.transport = transport
    }

    func send() async {
        let query = prompt.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !query.isEmpty, !isLoading else { return }
        prompt = ""
        errorMessage = nil
        isLoading = true
        defer { isLoading = false }

        do {
            let documents = try await repository.search(query: query)
            let sources = documents.prefix(5).map {
                AssistantSourceReference(id: $0.id, title: $0.title, kind: $0.kind, sourceID: $0.sourceID)
            }
            messages.append(AssistantMessage(isUser: true, text: query, sources: []))
            let answer = try await transport.answer(prompt: query, sources: sources)
            messages.append(AssistantMessage(isUser: false, text: answer, sources: sources))
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct DashboardAssistantView: View {
    private let repository: LocalContentRepository
    @State private var model: DashboardAssistantModel

    init(repository: LocalContentRepository) {
        self.repository = repository
        _model = State(initialValue: DashboardAssistantModel(repository: repository))
    }

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 14) {
                    Text("Lokaler Recherche-Prototyp: zeigt passende DAR-NEXT-Suchtreffer, erstellt aber keine eigenständige KI-Antwort. Prüfe Originaltext und Fundstelle.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                    ForEach(model.messages) { message in
                        VStack(alignment: message.isUser ? .trailing : .leading, spacing: 8) {
                            Text(message.text)
                                .padding(12)
                                .background(message.isUser ? Color.accentColor.opacity(0.18) : Color.secondary.opacity(0.12), in: RoundedRectangle(cornerRadius: 16))
                            ForEach(message.sources) { source in
                                NavigationLink {
                                    AssistantSourceDestinationView(repository: repository, source: source)
                                } label: {
                                    HStack(alignment: .top, spacing: 10) {
                                        Image(systemName: "doc.text.magnifyingglass")
                                            .foregroundStyle(.tint)
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text("\(source.kind.rawValue): \(source.title)")
                                                .font(.subheadline.weight(.semibold))
                                                .multilineTextAlignment(.leading)
                                            Text(source.sourceID)
                                                .font(.caption)
                                                .foregroundStyle(.secondary)
                                        }
                                        Spacer(minLength: 0)
                                        Image(systemName: "arrow.up.right")
                                            .font(.caption.weight(.semibold))
                                            .foregroundStyle(.secondary)
                                    }
                                    .padding(12)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                                    .contentShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                                }
                                .buttonStyle(.plain)
                                .accessibilityIdentifier("assistant-source-\(source.id)")
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: message.isUser ? .trailing : .leading)
                    }
                    if let errorMessage = model.errorMessage {
                        Label(errorMessage, systemImage: "exclamationmark.triangle")
                            .font(.footnote)
                            .foregroundStyle(.orange)
                    }
                }
                .padding()
            }
            HStack {
                TextField("Frage zu geprüften Inhalten", text: $model.prompt, axis: .vertical)
                    .textFieldStyle(.roundedBorder)
                Button { Task { await model.send() } } label: {
                    Image(systemName: model.isLoading ? "hourglass" : "arrow.up.circle.fill")
                }
                .disabled(model.prompt.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || model.isLoading)
            }
            .padding()
        }
        .navigationTitle("Wissensassistent")
    }
}


private struct AssistantSourceDestinationView: View {
    let repository: LocalContentRepository
    let source: AssistantSourceReference

    @State private var didLoad = false
    @State private var errorMessage: String?
    @State private var post: Post?
    @State private var dua: Dua?
    @State private var book: LibraryBook?
    @State private var publication: LibraryPublication?

    @ViewBuilder
    private var destination: some View {
        switch source.kind {
        case .quran:
            if let location = AssistantQuranLocation(sourceID: source.id) {
                QuranSurahView(repository: repository, number: location.surah, focusAyah: location.ayah)
            } else {
                QuranView(repository: repository)
            }
        case .post:
            if let post {
                PostDetailView(post: post, repository: repository)
            } else {
                unavailableSource
            }
        case .dua:
            if let dua {
                DuaDetailView(dua: dua)
            } else {
                unavailableSource
            }
        case .library:
            if let book {
                LibraryBookDetailView(book: book)
            } else if let publication {
                LibraryPublicationDetailView(publication: publication)
            } else {
                unavailableSource
            }
        }
    }

    private var unavailableSource: some View {
        ContentUnavailableView(
            "Quelle nicht verfügbar",
            systemImage: "doc.questionmark",
            description: Text("Der Suchtreffer ist in der lokalen Bibliothek nicht mehr vorhanden.")
        )
    }

    var body: some View {
        Group {
            if !didLoad {
                ProgressView("Quelle wird geöffnet …")
            } else if let errorMessage {
                ContentUnavailableView(
                    "Quelle nicht verfügbar",
                    systemImage: "externaldrive.badge.xmark",
                    description: Text(errorMessage)
                )
            } else {
                destination
            }
        }
        .task(id: source.id) {
            await loadSource()
        }
        .accessibilityIdentifier("assistant-source-destination")
    }

    @MainActor
    private func loadSource() async {
        guard !didLoad else { return }
        do {
            switch source.kind {
            case .quran:
                break
            case .post:
                post = try await repository.posts().first { $0.id == source.id }
            case .dua:
                dua = try await repository.duas().first { $0.id == source.id }
            case .library:
                book = try await repository.libraryBooks().first { $0.id == source.id }
                if book == nil {
                    publication = try await repository.libraryPublications().first { $0.id == source.id }
                }
            }
        } catch {
            errorMessage = error.localizedDescription
        }
        didLoad = true
    }
}

struct AssistantQuranLocation: Equatable, Sendable {
    let surah: Int
    let ayah: Int?

    init?(sourceID: String) {
        let parts = sourceID.split(separator: "-")
        guard parts.first == "quran" else { return nil }

        if parts.count == 3, parts[1] == "surah", let surah = Int(parts[2]) {
            self.surah = surah
            self.ayah = nil
            return
        }

        guard parts.count >= 2, let surah = Int(parts[1]) else { return nil }
        self.surah = surah
        self.ayah = parts.count >= 3 ? Int(parts[2]) : nil
    }
}
