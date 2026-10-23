import SwiftUI

struct DashboardView: View {
    let repository: LocalContentRepository
    @State private var snapshot: DashboardSnapshot?
    @State private var errorMessage: String?
    @State private var isLoading = true
    @State private var isSearchPresented = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                welcomeHeader

                if let snapshot {
                    if let verse = snapshot.verse {
                        verseCard(verse)
                    }
                    if let recommendation = snapshot.recommendation {
                        recommendationCard(recommendation)
                    }
                    sourceStatusCard
                } else if isLoading {
                    ProgressView("Geprüfte Inhalte werden geladen …")
                        .frame(maxWidth: .infinity, minHeight: 220)
                } else {
                    ContentUnavailableView(
                        "Inhalte nicht verfügbar",
                        systemImage: "externaldrive.badge.xmark",
                        description: Text(errorMessage ?? "Die lokale DAR-Bibliothek konnte nicht gelesen werden.")
                    )
                    .frame(maxWidth: .infinity, minHeight: 220)
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 18)
            .padding(.bottom, 160)
        }
        .scrollIndicators(.hidden)
        .background {
            LinearGradient(
                colors: [Color(red: 0.03, green: 0.18, blue: 0.15), Color(red: 0.02, green: 0.07, blue: 0.12)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
        }
        .navigationTitle("DĀR AL TAWḤĪD")
        .toolbarColorScheme(.dark, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    isSearchPresented = true
                } label: {
                    Image(systemName: "magnifyingglass.circle.fill")
                }
                .accessibilityLabel("DAR-Bibliothek durchsuchen")
            }
            ToolbarItem(placement: .topBarTrailing) {
                NavigationLink {
                    DashboardAssistantView(repository: repository)
                } label: {
                    Image(systemName: "text.bubble.fill")
                }
                .accessibilityLabel("Wissensassistent")
            }
        }
        .sheet(isPresented: $isSearchPresented) {
            NavigationStack {
                SearchView(repository: repository)
            }
        }
        .task {
            do {
                snapshot = try await repository.dashboardSnapshot()
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }

    private var welcomeHeader: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Assalāmu ʿalaykum wa raḥmatullāhi wa barakātuh")
                .font(.subheadline.weight(.medium))
                .foregroundStyle(.white.opacity(0.74))
            Text("Willkommen bei DĀR AL TAWḤĪD")
                .font(.system(.largeTitle, design: .serif).weight(.bold))
                .foregroundStyle(.white)
            Text("Beiträge nach Qurʾān, Sunnah und Āṯār")
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.62))
        }
        .accessibilityElement(children: .combine)
    }

    private var sourceStatusCard: some View {
        DARGlassCard {
            Label("Lokale geprüfte Bibliothek", systemImage: "checkmark.shield")
                .font(.headline)
                .foregroundStyle(.white)
            Text("Dashboard-Inhalte stammen aus dem DAR-NEXT-Ressourcenbestand. Gebetszeiten bleiben ausgeblendet, bis ein Standortdienst echte Daten liefert.")
                .font(.footnote)
                .foregroundStyle(.white.opacity(0.72))
        }
    }

    private func verseCard(_ verse: VerseSummary) -> some View {
        DARGlassCard {
            VStack(alignment: .leading, spacing: 12) {
                Label("Tages-Āyah", systemImage: "quote.opening")
                    .font(.headline)
                    .foregroundStyle(.white)
                Text(verse.arabicText)
                    .font(.system(size: 28, design: .serif))
                    .frame(maxWidth: .infinity, alignment: .trailing)
                    .environment(\.layoutDirection, .rightToLeft)
                    .foregroundStyle(.white)
                Text(verse.translation)
                    .font(.body)
                    .foregroundStyle(.white.opacity(0.78))
                Text(verse.reference)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(Color(red: 0.86, green: 0.71, blue: 0.36))
            }
        }
    }

    private func recommendationCard(_ recommendation: Recommendation) -> some View {
        DARGlassCard {
            VStack(alignment: .leading, spacing: 10) {
                Text("Aus der Bibliothek")
                    .font(.headline)
                    .foregroundStyle(.white)
                Text(recommendation.title)
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(.white)
                Text("\(recommendation.category) · \(recommendation.sourceID)")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.white.opacity(0.62))
            }
        }
    }
}
