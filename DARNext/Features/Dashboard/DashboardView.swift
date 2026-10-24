import SwiftUI

struct DashboardView: View {
    let repository: LocalContentRepository

    @Environment(\.darTheme) private var theme
    @State private var snapshot: DashboardSnapshot?
    @State private var errorMessage: String?
    @State private var isLoading = true
    @State private var isSearchPresented = false
    @State private var widgetSnapshot = DARNextWidgetSnapshot.empty

    private let quickActionColumns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12)
    ]

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 22) {
                welcomeHeader
                royalHero

                quickActions
                prayerCard
                calendarCard
                dailyContentCards

                if let snapshot {
                    if let verse = snapshot.verse {
                        verseCard(verse)
                    }
                    if let recommendation = snapshot.recommendation {
                        recommendationCard(recommendation)
                    }
                } else if isLoading {
                    ProgressView("Geprüfte Inhalte werden geladen …")
                        .tint(theme.goldLight)
                        .frame(maxWidth: .infinity, minHeight: 120)
                } else {
                    ContentUnavailableView(
                        "Inhalte nicht verfügbar",
                        systemImage: "externaldrive.badge.xmark",
                        description: Text(errorMessage ?? "Die lokale DAR-Bibliothek konnte nicht gelesen werden.")
                    )
                    .frame(maxWidth: .infinity, minHeight: 180)
                }

                sourceStatusCard
            }
            .padding(.horizontal, 18)
            .padding(.top, 12)
            .padding(.bottom, 120)
        }
        .scrollIndicators(.hidden)
        .background(theme.backgroundGradient.ignoresSafeArea())
        .navigationTitle("DĀR AL TAWḤĪD")
        .toolbarColorScheme(.dark, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { isSearchPresented = true } label: {
                    Image(systemName: "magnifyingglass")
                }
                .accessibilityLabel("DAR-Bibliothek durchsuchen")
            }
        }
        .sheet(isPresented: $isSearchPresented) {
            NavigationStack { SearchView(repository: repository) }
        }
        .task {
            widgetSnapshot = DARNextWidgetStore.load()
            do {
                snapshot = try await repository.dashboardSnapshot()
            } catch {
                errorMessage = error.localizedDescription
            }
            isLoading = false
        }
    }

    private var welcomeHeader: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Assalāmu ʿalaykum")
                .font(.subheadline.weight(.medium))
                .foregroundStyle(theme.goldLight)
            Text("Willkommen zurück")
                .font(.system(.largeTitle, design: .serif).weight(.bold))
                .foregroundStyle(theme.cream)
            Text("Wissen, Erinnerung und Orientierung nach Qurʾān und Sunnah.")
                .font(.subheadline)
                .foregroundStyle(theme.secondaryText)
        }
        .accessibilityElement(children: .combine)
    }

    private var royalHero: some View {
        DARGlassCard(emphasized: true) {
            HStack(alignment: .center, spacing: 16) {
                DARNextRemoteImage(
                    url: DARNextMedia.heroMobile,
                    fallbackSystemImage: "moon.stars.fill",
                    contentMode: .fill
                )
                .frame(width: 66, height: 66)
                .clipShape(Circle())
                .overlay {
                    Circle().strokeBorder(theme.gold.opacity(0.55), lineWidth: 1)
                }

                VStack(alignment: .leading, spacing: 5) {
                    Text("DĀR NEXT")
                        .font(.caption.weight(.bold))
                        .tracking(2)
                        .foregroundStyle(theme.goldLight)
                    Text("Eine ruhige Quelle für dein tägliches Streben.")
                        .font(.title3.weight(.semibold))
                        .foregroundStyle(theme.cream)
                    Text("Geprüfte Inhalte · Offline verfügbar")
                        .font(.caption)
                        .foregroundStyle(theme.secondaryText)
                }
                Spacer(minLength: 0)
            }
        }
    }

    private var quickActions: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionTitle("Schnellzugriff", systemImage: "square.grid.2x2.fill")
            LazyVGrid(columns: quickActionColumns, spacing: 16) {
                NavigationLink { PostsView(repository: repository) } label: {
                    DARQuickAction(title: "Beiträge", systemImage: "text.book.closed.fill", tint: theme.emerald, mediaURL: DARNextMedia.posts)
                }
                NavigationLink { DuaView(repository: repository) } label: {
                    DARQuickAction(title: "Duʿāʾ", systemImage: "hands.sparkles.fill", tint: theme.gold, mediaURL: DARNextMedia.dua)
                }
                NavigationLink { QuranView(repository: repository) } label: {
                    DARQuickAction(title: "Qurʾān", systemImage: "book.closed.fill", tint: Color.indigo, mediaURL: DARNextMedia.quran)
                }
                NavigationLink { DashboardAssistantView(repository: repository) } label: {
                    DARQuickAction(title: "Assistant", systemImage: "sparkles", tint: Color.purple)
                }
                NavigationLink { PrayerView() } label: {
                    DARQuickAction(title: "Gebet", systemImage: "clock.fill", tint: theme.gold, mediaURL: DARNextMedia.prayer)
                }
                NavigationLink { QiblaView() } label: {
                    DARQuickAction(title: "Qibla", systemImage: "location.north.fill", tint: .orange, mediaURL: DARNextMedia.qibla)
                }
                NavigationLink { IslamicCalendarView() } label: {
                    DARQuickAction(title: "Kalender", systemImage: "calendar", tint: .teal, mediaURL: DARNextMedia.calendar)
                }
                NavigationLink { DhikrView() } label: {
                    DARQuickAction(title: "Dhikr", systemImage: "circle.grid.cross.fill", tint: .pink)
                }
            }
            .buttonStyle(.plain)
        }
    }

    private func sectionTitle(_ title: String, systemImage: String) -> some View {
        Label(title, systemImage: systemImage)
            .font(.headline)
            .foregroundStyle(theme.cream)
    }

    private var prayerCard: some View {
        DARGlassCard(emphasized: true) {
            VStack(alignment: .leading, spacing: 12) {
                sectionTitle("Gebetszeiten", systemImage: "clock.fill")
                HStack(alignment: .firstTextBaseline) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(widgetSnapshot.nextPrayerName)
                            .font(.title3.weight(.semibold))
                            .foregroundStyle(theme.cream)
                        Text(widgetSnapshot.nextPrayerTime)
                            .font(.system(size: 32, weight: .bold, design: .rounded))
                            .foregroundStyle(theme.goldLight)
                    }
                    Spacer()
                    if !widgetSnapshot.nextPrayerRemaining.isEmpty {
                        Text(widgetSnapshot.nextPrayerRemaining)
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(theme.secondaryText)
                    }
                }
                if !widgetSnapshot.prayers.isEmpty {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 10) {
                            ForEach(widgetSnapshot.prayers) { prayer in
                                VStack(spacing: 3) {
                                    Text(prayer.name)
                                        .font(.caption2.weight(.semibold))
                                        .foregroundStyle(theme.secondaryText)
                                    Text(prayer.time)
                                        .font(.caption.weight(.bold))
                                        .foregroundStyle(theme.cream)
                                }
                                .padding(.horizontal, 10)
                                .padding(.vertical, 8)
                                .background(.white.opacity(0.07), in: Capsule())
                            }
                        }
                    }
                } else {
                    Text("Standortfreigabe aktiviert die aktuellen Gebetszeiten und Erinnerungen.")
                        .font(.footnote)
                        .foregroundStyle(theme.secondaryText)
                }
            }
        }
    }

    private var calendarCard: some View {
        DARGlassCard {
            VStack(alignment: .leading, spacing: 10) {
                sectionTitle("Islamischer Kalender", systemImage: "calendar")
                if let today = widgetSnapshot.calendarRows.first {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(today.hijriDate)
                                .font(.title3.weight(.semibold))
                                .foregroundStyle(theme.cream)
                            Text(today.gregorianDate)
                                .font(.subheadline)
                                .foregroundStyle(theme.secondaryText)
                        }
                        Spacer()
                        Text(today.weekday)
                            .font(.caption.weight(.bold))
                            .foregroundStyle(theme.goldLight)
                    }
                } else {
                    Text(widgetSnapshot.hijriLabel.isEmpty ? "Hijri-Datum wird vorbereitet." : widgetSnapshot.hijriLabel)
                        .font(.subheadline)
                        .foregroundStyle(theme.secondaryText)
                }
            }
        }
    }

    private var dailyContentCards: some View {
        VStack(alignment: .leading, spacing: 14) {
            if !widgetSnapshot.postTitle.isEmpty {
                DARGlassCard {
                    VStack(alignment: .leading, spacing: 9) {
                        sectionTitle(widgetSnapshot.postCategory.isEmpty ? "Beitrag des Tages" : widgetSnapshot.postCategory, systemImage: "text.book.closed.fill")
                        Text(widgetSnapshot.postTitle)
                            .font(.title3.weight(.semibold))
                            .foregroundStyle(theme.cream)
                        if !widgetSnapshot.postSnippet.isEmpty {
                            Text(widgetSnapshot.postSnippet)
                                .font(.subheadline)
                                .foregroundStyle(theme.secondaryText)
                                .lineLimit(3)
                        }
                        if !widgetSnapshot.postSource.isEmpty {
                            Label(widgetSnapshot.postSource, systemImage: "checkmark.seal.fill")
                                .font(.caption)
                                .foregroundStyle(theme.goldLight)
                        }
                    }
                }
            }

            if !widgetSnapshot.duaTitle.isEmpty || !widgetSnapshot.duaGerman.isEmpty {
                DARGlassCard {
                    VStack(alignment: .leading, spacing: 9) {
                        sectionTitle(widgetSnapshot.duaCategory.isEmpty ? "Duʿāʾ des Tages" : widgetSnapshot.duaCategory, systemImage: "hands.sparkles.fill")
                        if !widgetSnapshot.duaTitle.isEmpty {
                            Text(widgetSnapshot.duaTitle)
                                .font(.title3.weight(.semibold))
                                .foregroundStyle(theme.cream)
                        }
                        if !widgetSnapshot.duaGerman.isEmpty {
                            Text(widgetSnapshot.duaGerman)
                                .font(.body)
                                .foregroundStyle(theme.secondaryText)
                                .lineLimit(4)
                        }
                        if !widgetSnapshot.duaSource.isEmpty {
                            Label(widgetSnapshot.duaSource, systemImage: "checkmark.seal.fill")
                                .font(.caption)
                                .foregroundStyle(theme.goldLight)
                        }
                    }
                }
            }

            if !widgetSnapshot.weatherCondition.isEmpty || widgetSnapshot.weatherTemperature != nil {
                DARGlassCard {
                    HStack(spacing: 14) {
                        Image(systemName: widgetSnapshot.weatherSymbolName.isEmpty ? "cloud.sun.fill" : widgetSnapshot.weatherSymbolName)
                            .font(.system(size: 28))
                            .foregroundStyle(theme.goldLight)
                        VStack(alignment: .leading, spacing: 4) {
                            Text(widgetSnapshot.cityLabel.isEmpty ? "Standort" : widgetSnapshot.cityLabel)
                                .font(.headline)
                                .foregroundStyle(theme.cream)
                            Text(widgetSnapshot.weatherCondition.isEmpty ? "Wetter" : widgetSnapshot.weatherCondition)
                                .font(.subheadline)
                                .foregroundStyle(theme.secondaryText)
                        }
                        Spacer()
                        if let temperature = widgetSnapshot.weatherTemperature {
                            Text("\(temperature, specifier: "%.0f")°")
                                .font(.system(size: 28, weight: .bold, design: .rounded))
                                .foregroundStyle(theme.cream)
                        }
                    }
                }
            }
        }
    }

    private var sourceStatusCard: some View {
        DARGlassCard {
            Label("Geprüfte DAR-Bibliothek", systemImage: "checkmark.shield.fill")
                .font(.headline)
                .foregroundStyle(theme.cream)
            Text("Beiträge, Duʿāʾ, Qurʾān und Wissensinhalte werden aus dem lokalen Ressourcenbestand geladen. Push- und Backend-Anbindungen bleiben davon getrennt.")
                .font(.footnote)
                .foregroundStyle(theme.secondaryText)
        }
    }

    private func verseCard(_ verse: VerseSummary) -> some View {
        DARGlassCard {
            VStack(alignment: .leading, spacing: 12) {
                sectionTitle("Tages-Āyah", systemImage: "quote.opening")
                Text(verse.arabicText)
                    .font(.system(size: 28, design: .serif))
                    .frame(maxWidth: .infinity, alignment: .trailing)
                    .environment(\.layoutDirection, .rightToLeft)
                    .foregroundStyle(theme.cream)
                Text(verse.translation)
                    .font(.body)
                    .foregroundStyle(theme.secondaryText)
                Text(verse.reference)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(theme.goldLight)
            }
        }
    }

    private func recommendationCard(_ recommendation: Recommendation) -> some View {
        DARGlassCard {
            VStack(alignment: .leading, spacing: 10) {
                sectionTitle("Neu aus der Bibliothek", systemImage: "scroll.fill")
                Text(recommendation.title)
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(theme.cream)
                Text("\(recommendation.category) · \(recommendation.sourceID)")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(theme.secondaryText)
            }
        }
    }
}
