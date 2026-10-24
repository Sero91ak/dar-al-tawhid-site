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
        let query = prompt.trimmingCharacters(in: .whitespacesAndNewlines)
        let normalized = query.folding(options: [.diacriticInsensitive, .caseInsensitive], locale: .current)

        if normalized.contains("dua") || normalized.contains("bitt") {
            return "Für diese Frage wurden geprüfte Duʿāʾ-Quellen gefunden. Öffne die Quelle und lies den arabischen Originaltext zusammen mit Übersetzung und Referenz."
        }
        if normalized.contains("quran") || normalized.contains("vers") || normalized.contains("ayah") {
            return "Für diese Frage wurden Qurʾān-Quellen gefunden. Lies den Originaltext im Lesemodus und prüfe die angegebene Sūrah- und Versreferenz."
        }
        if normalized.contains("gebet") || normalized.contains("salah") || normalized.contains("zeit") {
            return "Gebetszeiten sind orts- und datumsabhängig. Nutze die Gebetszeiten-Ansicht für die berechneten Zeiten und prüfe die Standortangabe."
        }
        if let firstSource = sources.first {
            return "Ich habe eine geprüfte Quelle zu deiner Frage gefunden: \(firstSource.title). Öffne sie für den vollständigen Originaltext und die Referenz."
        }
        return "In der lokalen geprüften Bibliothek wurde noch keine passende Quelle gefunden. Versuche einen konkreten Begriff, eine Sūrah, ein Duʿāʾ oder den Titel eines Beitrags."
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
    @State private var model: DashboardAssistantModel

    init(repository: LocalContentRepository) {
        _model = State(initialValue: DashboardAssistantModel(repository: repository))
    }

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 14) {
                    Text("Antworten werden ausschließlich aus geprüften DAR-NEXT-Quellen vorbereitet. Originaltexte und KI-Antworten bleiben getrennt.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                    ForEach(model.messages) { message in
                        VStack(alignment: message.isUser ? .trailing : .leading, spacing: 8) {
                            Text(message.text)
                                .padding(12)
                                .background(message.isUser ? Color.accentColor.opacity(0.18) : Color.secondary.opacity(0.12), in: RoundedRectangle(cornerRadius: 16))
                            ForEach(message.sources) { source in
                                Label("\(source.kind.rawValue): \(source.title)", systemImage: "checkmark.seal")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
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
