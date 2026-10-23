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

struct UnconfiguredKnowledgeAssistantTransport: KnowledgeAssistantTransport {
    func answer(prompt: String, sources: [AssistantSourceReference]) async throws -> String {
        throw AssistantError.notConfigured
    }
}

enum AssistantError: LocalizedError {
    case notConfigured

    var errorDescription: String? {
        "Der serverseitige Wissensdienst ist für DAR NEXT noch nicht konfiguriert."
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

    init(repository: LocalContentRepository, transport: any KnowledgeAssistantTransport = UnconfiguredKnowledgeAssistantTransport()) {
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
