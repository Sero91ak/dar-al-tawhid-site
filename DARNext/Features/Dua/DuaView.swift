import SwiftUI

struct DuaView: View {
    let repository: LocalContentRepository
    @State private var duas: [Dua] = []
    @State private var errorMessage: String?

    var body: some View {
        List(duas) { dua in
            NavigationLink {
                DuaDetailView(dua: dua)
            } label: {
                VStack(alignment: .leading, spacing: 5) {
                    Text(dua.title)
                        .font(.headline)
                    Text(dua.category ?? "Duʿāʾ")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .navigationTitle("Duʿāʾ")
        .overlay {
            if duas.isEmpty, let errorMessage {
                ContentUnavailableView("Duʿāʾ nicht verfügbar", systemImage: "hands.sparkles", description: Text(errorMessage))
            } else if duas.isEmpty {
                ProgressView("Duʿāʾ werden geladen …")
            }
        }
        .task {
            do {
                duas = try await repository.duas()
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}

private struct DuaDetailView: View {
    let dua: Dua

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Text(dua.title)
                    .font(.system(.largeTitle, design: .serif).weight(.bold))
                Text(dua.arabic)
                    .font(.system(size: 30, design: .serif))
                    .frame(maxWidth: .infinity, alignment: .trailing)
                    .environment(\.layoutDirection, .rightToLeft)
                Text(dua.transliteration)
                    .font(.body.italic())
                Text(dua.german)
                    .font(.body)
                Label(dua.source, systemImage: "checkmark.seal")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .padding()
        }
        .navigationTitle("Duʿāʾ")
    }
}
