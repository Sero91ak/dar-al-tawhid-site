import SwiftUI

struct IslamicHubView: View {
    let repository: LocalContentRepository

    @Environment(\.darTheme) private var theme

    private let columns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12)
    ]

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 22) {
                header
                ibadahSection
                prayerSection
                knowledgeSection
                toolsSection
            }
            .padding(.horizontal, 18)
            .padding(.top, 12)
            .padding(.bottom, 110)
        }
        .scrollIndicators(.hidden)
        .background(theme.backgroundGradient.ignoresSafeArea())
        .navigationTitle("Wissen")
        .toolbarColorScheme(.dark, for: .navigationBar)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 7) {
            Text("Dein Weg des Wissens")
                .font(.system(.largeTitle, design: .serif).weight(.bold))
                .foregroundStyle(theme.cream)
            Text("Qurʾān, Duʿāʾ, Erinnerung und geprüfte Beiträge an einem Ort.")
                .font(.subheadline)
                .foregroundStyle(theme.secondaryText)
        }
    }

    private var ibadahSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionTitle("ʿIbādah", systemImage: "moon.stars.fill")
            LazyVGrid(columns: columns, spacing: 12) {
                NavigationLink { DuaView(repository: repository) } label: {
                    DARFeatureTile(title: "Duʿāʾ", subtitle: "Bittgebete", systemImage: "hands.sparkles.fill", tint: theme.gold)
                }
                NavigationLink { QuranView(repository: repository) } label: {
                    DARFeatureTile(title: "Qurʾān", subtitle: "Lesen & hören", systemImage: "book.closed.fill", tint: theme.emerald)
                }
                NavigationLink { QuizView(repository: repository) } label: {
                    DARFeatureTile(title: "Wissensquiz", subtitle: "Lernen & festigen", systemImage: "questionmark.circle.fill", tint: .purple)
                }
                NavigationLink { DashboardAssistantView(repository: repository) } label: {
                    DARFeatureTile(title: "AI Assistant", subtitle: "Quellengebundene Hilfe", systemImage: "sparkles", tint: .indigo)
                }
            }
            .buttonStyle(.plain)
        }
    }

    private var prayerSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionTitle("Gebet & Orientierung", systemImage: "location.north.circle.fill")
            LazyVGrid(columns: columns, spacing: 12) {
                NavigationLink { PrayerView() } label: {
                    DARFeatureTile(title: "Gebetszeiten", subtitle: "Standort & Erinnerungen", systemImage: "clock.fill", tint: theme.gold)
                }
                NavigationLink { QiblaView() } label: {
                    DARFeatureTile(title: "Qibla", subtitle: "Ausrichtung zur Kaʿba", systemImage: "location.north.fill", tint: .orange)
                }
                NavigationLink { IslamicCalendarView() } label: {
                    DARFeatureTile(title: "Kalender", subtitle: "Hijri & Gregorianisch", systemImage: "calendar", tint: .teal)
                }
                NavigationLink { DhikrView() } label: {
                    DARFeatureTile(title: "Dhikr", subtitle: "Zähler & Erinnerung", systemImage: "circle.grid.cross.fill", tint: .pink)
                }
            }
            .buttonStyle(.plain)
        }
    }

    private var knowledgeSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionTitle("Wissen & Quellen", systemImage: "scroll.fill")
            NavigationLink { PostsView(repository: repository) } label: {
                DARFeatureRow(title: "Beiträge", subtitle: "Qurʾān, Sunnah und Āṯār", systemImage: "text.book.closed.fill", tint: theme.emerald)
            }
            .buttonStyle(.plain)
            NavigationLink { LibraryView(repository: repository) } label: {
                DARFeatureRow(title: "Bibliothek", subtitle: "Verifizierte Bücher und Publikationen", systemImage: "books.vertical.fill", tint: theme.gold)
            }
            .buttonStyle(.plain)
        }
    }

    private var toolsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionTitle("Werkzeuge", systemImage: "square.grid.2x2.fill")
            NavigationLink { SearchView(repository: repository) } label: {
                DARFeatureRow(title: "Globale Suche", subtitle: "Alle geprüften Inhalte durchsuchen", systemImage: "magnifyingglass", tint: .blue)
            }
            .buttonStyle(.plain)
            Text("Alle Bereiche bleiben in derselben geprüften, lokalen DAR-Architektur und können unabhängig voneinander erweitert werden.")
                .font(.footnote)
                .foregroundStyle(theme.secondaryText)
                .padding(.top, 2)
        }
    }

    private func sectionTitle(_ title: String, systemImage: String) -> some View {
        Label(title, systemImage: systemImage)
            .font(.headline)
            .foregroundStyle(theme.cream)
    }
}

private struct DARFeatureTile: View {
    @Environment(\.darTheme) private var theme

    let title: String
    let subtitle: String
    let systemImage: String
    let tint: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Image(systemName: systemImage)
                .font(.system(size: 22, weight: .semibold))
                .foregroundStyle(.white)
                .frame(width: 46, height: 46)
                .background(tint.opacity(0.82), in: RoundedRectangle(cornerRadius: 15, style: .continuous))
            Text(title)
                .font(.headline)
                .foregroundStyle(theme.cream)
            Text(subtitle)
                .font(.caption)
                .foregroundStyle(theme.secondaryText)
                .lineLimit(2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(15)
        .background(.white.opacity(0.07), in: RoundedRectangle(cornerRadius: 22, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .strokeBorder(.white.opacity(0.11), lineWidth: 1)
        }
    }
}

private struct DARFeatureRow: View {
    @Environment(\.darTheme) private var theme

    let title: String
    let subtitle: String
    let systemImage: String
    let tint: Color

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: systemImage)
                .font(.system(size: 18, weight: .semibold))
                .foregroundStyle(.white)
                .frame(width: 44, height: 44)
                .background(tint.opacity(0.82), in: Circle())

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                    .foregroundStyle(theme.cream)
                Text(subtitle)
                    .font(.subheadline)
                    .foregroundStyle(theme.secondaryText)
            }

            Spacer()
            Image(systemName: "chevron.right")
                .font(.caption.weight(.bold))
                .foregroundStyle(theme.secondaryText)
        }
        .padding(14)
        .background(.white.opacity(0.065), in: RoundedRectangle(cornerRadius: 20, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .strokeBorder(.white.opacity(0.1), lineWidth: 1)
        }
    }
}
