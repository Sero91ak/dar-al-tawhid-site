import SwiftUI
import Foundation

struct PostsView: View {
    let repository: LocalContentRepository

    @Environment(\.darTheme) private var theme
    @State private var posts: [Post] = []
    @State private var errorMessage: String?

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 14) {
                if posts.isEmpty, let errorMessage {
                    ContentUnavailableView("Beiträge nicht verfügbar", systemImage: "text.alignleft", description: Text(errorMessage))
                        .frame(maxWidth: .infinity, minHeight: 220)
                } else if posts.isEmpty {
                    ProgressView("Beiträge werden geladen …")
                        .tint(theme.goldLight)
                        .frame(maxWidth: .infinity, minHeight: 220)
                } else {
                    Text("\(posts.count) geprüfte Beiträge")
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(theme.secondaryText)

                    ForEach(posts) { post in
                        NavigationLink {
                            PostDetailView(post: post)
                        } label: {
                            postCard(post)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .padding(.horizontal, 18)
            .padding(.top, 12)
            .padding(.bottom, 110)
        }
        .scrollIndicators(.hidden)
        .background(theme.backgroundGradient.ignoresSafeArea())
        .navigationTitle("Beiträge")
        .toolbarColorScheme(.dark, for: .navigationBar)
        .task {
            do {
                posts = try await repository.posts()
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }

    private func postCard(_ post: Post) -> some View {
        DARGlassCard {
            VStack(alignment: .leading, spacing: 10) {
                HStack(alignment: .top, spacing: 12) {
                    Image(systemName: "scroll.fill")
                        .foregroundStyle(theme.royalGradient)
                        .frame(width: 38, height: 38)
                        .background(theme.deepNavy.opacity(0.72), in: Circle())

                    VStack(alignment: .leading, spacing: 5) {
                        Text(post.title)
                            .font(.headline)
                            .foregroundStyle(theme.cream)
                            .multilineTextAlignment(.leading)
                        Text(post.category ?? "Beitrag")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(theme.goldLight)
                    }

                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(theme.secondaryText)
                }

                if let topic = post.topic, !topic.isEmpty {
                    Text(topic)
                        .font(.subheadline)
                        .foregroundStyle(theme.secondaryText)
                        .lineLimit(2)
                }

                if let source = post.source, !source.isEmpty {
                    Label(source, systemImage: "checkmark.seal.fill")
                        .font(.caption)
                        .foregroundStyle(theme.secondaryText)
                }
            }
        }
    }
}

private struct PostDetailView: View {
    @Environment(\.darTheme) private var theme
    let post: Post

    @State private var isSourceSheetPresented = false

    private func cleanMarkdown(_ text: String) -> String {
        text.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private var readerText: AttributedString {
        (try? AttributedString(markdown: post.body, options: .init(interpretedSyntax: .full))) ?? AttributedString(cleanMarkdown(post.body))
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Text(post.title)
                    .font(.system(.largeTitle, design: .serif).weight(.bold))
                    .foregroundStyle(theme.cream)

                HStack(spacing: 10) {
                    if let category = post.category {
                        detailPill(category, systemImage: "tag.fill")
                    }
                    if let date = post.date {
                        detailPill(date, systemImage: "calendar")
                    }
                }

                if let source = post.source {
                    Label(source, systemImage: "checkmark.seal.fill")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(theme.goldLight)
                }

                Text(readerText)
                    .font(.body)
                    .foregroundStyle(theme.cream.opacity(0.9))
                    .textSelection(.enabled)
                    .lineSpacing(5)

                sourcePanel
            }
            .padding(18)
            .padding(.bottom, 80)
        }
        .scrollIndicators(.hidden)
        .background(theme.backgroundGradient.ignoresSafeArea())
        .navigationTitle("Beitrag")
        .toolbarColorScheme(.dark, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                ShareLink(item: shareText) {
                    Image(systemName: "square.and.arrow.up")
                }
                .accessibilityLabel("Beitrag teilen")
            }
            ToolbarItem(placement: .topBarTrailing) {
                Button { isSourceSheetPresented = true } label: {
                    Image(systemName: "checkmark.seal")
                }
                .accessibilityLabel("Quellenangaben anzeigen")
            }
        }
        .sheet(isPresented: $isSourceSheetPresented) {
            NavigationStack {
                SourceSheet(post: post)
            }
            .presentationDetents([.medium, .large])
        }
    }

    private var sourcePanel: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Quellenstatus", systemImage: post.sourceURL == nil ? "questionmark.circle" : "checkmark.seal.fill")
                .font(.headline)
                .foregroundStyle(post.sourceURL == nil ? theme.secondaryText : theme.goldLight)
            Text(post.sourceURL == nil ? "Die kanonische Q-Registry-Zuordnung ist für diesen Beitrag noch nicht im DARNext-Datensatz hinterlegt." : "Kanonische Q-Quelle verbunden.")
                .font(.footnote)
                .foregroundStyle(theme.secondaryText)
            if let source = post.source, !source.isEmpty {
                Text(source)
                    .font(.footnote)
                    .foregroundStyle(theme.cream.opacity(0.9))
                    .textSelection(.enabled)
            }
        }
        .padding(14)
        .background(.white.opacity(0.06), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private var shareText: String {
        var value = "\(post.title)\n\n\(cleanMarkdown(post.body))"
        if let sourceURL = post.sourceURL {
            value += "\n\nhttps://dar-al-tawhid.de\(sourceURL)"
        } else {
            value += "\n\nQuellenkarte: noch nicht aus der kanonischen Q-Registry zugeordnet"
        }
        return value
    }

    private struct SourceSheet: View {
        @Environment(\.darTheme) private var theme
        let post: Post

        var body: some View {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Label("Wissenschaftliche Quellenangabe", systemImage: "checkmark.seal.fill")
                        .font(.title3.weight(.semibold))
                        .foregroundStyle(theme.goldLight)
                    Text(post.title)
                        .font(.headline)
                        .foregroundStyle(theme.cream)
                    if let scholar = post.scholar, !scholar.isEmpty {
                        detailRow("Verfasser / Überlieferer", scholar)
                    }
                    if let book = post.book, !book.isEmpty {
                        detailRow("Werk", book)
                    }
                    if let source = post.source, !source.isEmpty {
                        detailRow("Fundstelle", source)
                    }
                    detailRow("Q-Registry", post.sourceURL.map { "https://dar-al-tawhid.de\($0)" } ?? "Noch nicht zugeordnet")
                }
                .padding(20)
            }
            .background(theme.backgroundGradient.ignoresSafeArea())
            .navigationTitle("Quelle")
            .toolbarColorScheme(.dark, for: .navigationBar)
        }

        private func detailRow(_ label: String, _ value: String) -> some View {
            VStack(alignment: .leading, spacing: 4) {
                Text(label.uppercased())
                    .font(.caption.weight(.bold))
                    .foregroundStyle(theme.goldLight)
                Text(value)
                    .font(.body)
                    .foregroundStyle(theme.cream)
                    .textSelection(.enabled)
            }
        }
    }

    private func detailPill(_ title: String, systemImage: String) -> some View {
        Label(title, systemImage: systemImage)
            .font(.caption.weight(.semibold))
            .foregroundStyle(theme.secondaryText)
            .padding(.horizontal, 10)
            .padding(.vertical, 7)
            .background(.white.opacity(0.08), in: Capsule())
    }
}
