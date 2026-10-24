import SwiftUI

struct LearningModulesView: View {
    let repository: LocalContentRepository

    @Environment(\.darTheme) private var theme
    @State private var modules: [LearningModule] = []
    @State private var errorMessage: String?

    var body: some View {
        List(modules) { module in
            NavigationLink {
                LearningModuleDetailView(module: module)
            } label: {
                VStack(alignment: .leading, spacing: 5) {
                    Text(module.title).font(.headline)
                    Text(module.category).font(.caption.weight(.semibold)).foregroundStyle(.tint)
                    Text(module.summary).font(.subheadline).foregroundStyle(.secondary)
                }
                .padding(.vertical, 4)
            }
        }
        .navigationTitle("Studium")
        .overlay {
            if let errorMessage {
                ContentUnavailableView("Studienmodule nicht verfügbar", systemImage: "books.vertical", description: Text(errorMessage))
            } else if modules.isEmpty {
                ProgressView("Studienmodule werden geladen …")
            }
        }
        .task {
            do {
                modules = try await repository.learningModules()
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}

private struct LearningModuleDetailView: View {
    let module: LearningModule

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text(module.title).font(.system(.largeTitle, design: .serif).weight(.bold))
                Label(module.category, systemImage: "checkmark.seal.fill").foregroundStyle(.tint)
                Text(module.body).font(.body).lineSpacing(5)
                Divider()
                LabeledContent("Quelle", value: module.source)
                LabeledContent("Status", value: module.status)
            }
            .padding(20)
        }
        .navigationTitle("Quelle")
    }
}
