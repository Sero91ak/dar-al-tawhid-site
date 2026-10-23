import SwiftUI
import Foundation

struct PostsView: View {
    let repository: LocalContentRepository
    @State private var posts: [Post] = []
    @State private var errorMessage: String?

    var body: some View {
        List(posts) { post in
            NavigationLink {
                PostDetailView(post: post)
            } label: {
                VStack(alignment: .leading, spacing: 5) {
                    Text(post.title)
                        .font(.headline)
                    Text(post.category ?? "Beitrag")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .navigationTitle("Beiträge")
        .overlay {
            if posts.isEmpty, let errorMessage {
                ContentUnavailableView("Beiträge nicht verfügbar", systemImage: "text.alignleft", description: Text(errorMessage))
            } else if posts.isEmpty {
                ProgressView("Beiträge werden geladen …")
            }
        }
        .task {
            do {
                posts = try await repository.posts()
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}

private struct PostDetailView: View {
    private func cleanMarkdown(_ text: String) -> String {
        text
            .replacingOccurrences(of: "**", with: "")
            .replacingOccurrences(of: "\n>", with: "\n")
            .replacingOccurrences(of: "\n#", with: "\n")
    }

    let post: Post

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text(post.title)
                    .font(.system(.largeTitle, design: .serif).weight(.bold))
                if let source = post.source {
                    Label(source, systemImage: "checkmark.seal")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                Text(cleanMarkdown(post.body))
                    .font(.body)
                    .textSelection(.enabled)
            }
            .padding()
        }
        .navigationTitle("Beitrag")
    }
}
