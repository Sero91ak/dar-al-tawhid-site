import SwiftUI

struct DuaView: View {
    let repository: LocalContentRepository

    @Environment(\.darTheme) private var theme
    @State private var duas: [Dua] = []
    @State private var errorMessage: String?

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 14) {
                if duas.isEmpty, let errorMessage {
                    ContentUnavailableView("Duʿāʾ nicht verfügbar", systemImage: "hands.sparkles", description: Text(errorMessage))
                        .frame(maxWidth: .infinity, minHeight: 220)
                } else if duas.isEmpty {
                    ProgressView("Duʿāʾ werden geladen …")
                        .tint(theme.goldLight)
                        .frame(maxWidth: .infinity, minHeight: 220)
                } else {
                    Text("\(duas.count) überlieferte Duʿāʾ")
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(theme.secondaryText)

                    ForEach(duas) { dua in
                        NavigationLink {
                            DuaDetailView(dua: dua)
                        } label: {
                            duaCard(dua)
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
        .navigationTitle("Duʿāʾ")
        .toolbarColorScheme(.dark, for: .navigationBar)
        .task {
            do {
                duas = try await repository.duas()
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }

    private func duaCard(_ dua: Dua) -> some View {
        DARGlassCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Label(dua.category ?? "Duʿāʾ", systemImage: "hands.sparkles.fill")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(theme.goldLight)
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(theme.secondaryText)
                }

                Text(dua.title)
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(theme.cream)

                Text(dua.arabic)
                    .font(.system(size: 24, design: .serif))
                    .foregroundStyle(theme.cream)
                    .frame(maxWidth: .infinity, alignment: .trailing)
                    .lineLimit(2)
                    .environment(\.layoutDirection, .rightToLeft)
            }
        }
    }
}

private struct DuaDetailView: View {
    @Environment(\.darTheme) private var theme
    let dua: Dua

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text(dua.title)
                    .font(.system(.largeTitle, design: .serif).weight(.bold))
                    .foregroundStyle(theme.cream)

                if let occasion = dua.occasion, !occasion.isEmpty {
                    Label(occasion, systemImage: "clock")
                        .font(.subheadline)
                        .foregroundStyle(theme.goldLight)
                }

                DARGlassCard(emphasized: true) {
                    Text(dua.arabic)
                        .font(.system(size: 30, design: .serif))
                        .foregroundStyle(theme.cream)
                        .frame(maxWidth: .infinity, alignment: .trailing)
                        .environment(\.layoutDirection, .rightToLeft)
                }

                VStack(alignment: .leading, spacing: 10) {
                    Text("Umschrift")
                        .font(.headline)
                        .foregroundStyle(theme.goldLight)
                    Text(dua.transliteration)
                        .font(.body.italic())
                        .foregroundStyle(theme.secondaryText)
                }

                VStack(alignment: .leading, spacing: 10) {
                    Text("Bedeutung")
                        .font(.headline)
                        .foregroundStyle(theme.goldLight)
                    Text(dua.german)
                        .font(.body)
                        .foregroundStyle(theme.cream.opacity(0.9))
                        .lineSpacing(5)
                        .textSelection(.enabled)
                }

                Label(dua.source, systemImage: "checkmark.seal.fill")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(theme.goldLight)
            }
            .padding(18)
            .padding(.bottom, 80)
        }
        .scrollIndicators(.hidden)
        .background(theme.backgroundGradient.ignoresSafeArea())
        .navigationTitle("Duʿāʾ")
        .toolbarColorScheme(.dark, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                ShareLink(
                    item: "\(dua.title)\n\n\(dua.arabic)\n\n\(dua.german)\n\n\(dua.source)"
                ) {
                    Image(systemName: "square.and.arrow.up")
                }
                .accessibilityLabel("Duʿāʾ teilen")
            }
        }
    }
}
