import SwiftUI

private enum DarAlLaylQuranCardStyle {
    static let cornerRadius: CGFloat = 32
    static let primaryText = Color(red: 0.94, green: 0.89, blue: 0.78)
    static let secondaryText = Color(red: 0.72, green: 0.66, blue: 0.54)
    static let mutedText = Color(red: 0.58, green: 0.55, blue: 0.48)
    static let goldLine = Color(red: 0.76, green: 0.60, blue: 0.32)
    static let cardTop = Color(red: 0.055, green: 0.075, blue: 0.13)
    static let cardBottom = Color(red: 0.025, green: 0.035, blue: 0.07)
    static let cardStroke = Color(red: 0.70, green: 0.56, blue: 0.30)
    static let pageTop = Color(red: 0.018, green: 0.026, blue: 0.052)
    static let pageBottom = Color(red: 0.006, green: 0.010, blue: 0.024)
}

@MainActor
struct QuranTabView: View {
    @StateObject private var reciterStore = QuranReciterSelectionStore()
    @StateObject private var playbackStore = QuranPlaybackStore()
    @StateObject private var tadabburStore = TVQuranTadabburStore.shared

    @State private var surahs: [QuranSurahSummary] = []
    @State private var isLoadingSurahs = false
    @State private var showSurahPicker = false

    private let contentService = QuranContentService.shared

    var body: some View {
        ZStack {
            background

            VStack(spacing: 28) {
                header

                Rectangle()
                    .fill(DarAlLaylQuranCardStyle.goldLine.opacity(0.30))
                    .frame(height: 1)

                Group {
                    if playbackStore.isLoading {
                        loadingView
                    } else if let errorMessage = playbackStore.errorMessage {
                        errorView(errorMessage)
                    } else if let verse = playbackStore.currentVerse {
                        verseView(verse)
                    } else {
                        loadingView
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)

                playerControls
            }
            .padding(.horizontal, 72)
            .padding(.vertical, 44)
        }
        .task {
            await prepare()
        }
        .onChange(of: reciterStore.selectedIdentifier) { _, newIdentifier in
            guard reciterStore.loadFinished else { return }
            Task {
                await playbackStore.changeReciter(to: newIdentifier)
            }
        }
        .sheet(isPresented: $showSurahPicker) {
            QuranSurahPickerSheet(
                surahs: surahs,
                selectedSurah: playbackStore.surah?.number ?? playbackStore.savedSurahNumber
            ) { surah in
                showSurahPicker = false
                Task {
                    await playbackStore.load(
                        surah: surah.number,
                        reciterIdentifier: reciterStore.selectedIdentifier,
                        restoreSavedAyah: false,
                        autoPlay: false
                    )
                }
            }
        }
    }

    private var background: some View {
        LinearGradient(
            colors: [
                DarAlLaylQuranCardStyle.pageTop,
                Color.black.opacity(0.96),
                DarAlLaylQuranCardStyle.pageBottom
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
        .ignoresSafeArea()
    }

    private var header: some View {
        HStack(spacing: 22) {
            VStack(alignment: .leading, spacing: 5) {
                Text("QURʾĀN")
                    .font(.system(size: 24, weight: .bold, design: .serif))
                    .tracking(3.0)
                    .foregroundStyle(DarAlLaylQuranCardStyle.primaryText)

                if let surah = playbackStore.surah {
                    Text("\(surah.englishName) · Āyah \(playbackStore.currentAyahNumber) von \(playbackStore.verseCount)")
                        .font(.system(size: 17, weight: .regular, design: .serif))
                        .foregroundStyle(DarAlLaylQuranCardStyle.secondaryText)
                } else {
                    Text("Arabisch · Deutsch · Rezitation")
                        .font(.system(size: 17, weight: .regular, design: .serif))
                        .foregroundStyle(DarAlLaylQuranCardStyle.secondaryText)
                }
            }

            Spacer()

            Button {
                showSurahPicker = true
            } label: {
                HStack(spacing: 12) {
                    Image(systemName: "book.closed")
                    Text(playbackStore.surah.map { "Sūrah \($0.number)" } ?? "Sūrah wählen")
                        .lineLimit(1)
                    Image(systemName: "chevron.down")
                        .font(.caption.weight(.bold))
                }
                .font(.system(size: 18, weight: .semibold, design: .serif))
                .frame(minWidth: 230)
                .foregroundStyle(DarAlLaylQuranCardStyle.primaryText)
            }
            .disabled(surahs.isEmpty)

            QuranReciterPickerButton(store: reciterStore)
        }
    }

    private func verseView(_ verse: QuranSynchronizedVerse) -> some View {
        let reference = "\(playbackStore.surah?.number ?? playbackStore.savedSurahNumber):\(verse.numberInSurah)"
        let tadabbur = tadabburStore.entry(for: reference)

        return ScrollView {
            VStack(spacing: 30) {
                Text(verse.arabicText)
                    .font(.system(size: 60, weight: .medium, design: .serif))
                    .foregroundStyle(DarAlLaylQuranCardStyle.primaryText)
                    .multilineTextAlignment(.center)
                    .lineSpacing(20)
                    .frame(maxWidth: 1450)
                    .environment(\.layoutDirection, .rightToLeft)
                    .id("arabic-\(verse.id)")

                HStack(spacing: 16) {
                    Rectangle()
                        .fill(DarAlLaylQuranCardStyle.goldLine.opacity(0.42))
                        .frame(height: 1)

                    Text("ĀYAH \(verse.numberInSurah)")
                        .font(.system(size: 14, weight: .bold, design: .serif))
                        .tracking(2.4)
                        .foregroundStyle(DarAlLaylQuranCardStyle.goldLine.opacity(0.90))
                        .fixedSize()

                    Rectangle()
                        .fill(DarAlLaylQuranCardStyle.goldLine.opacity(0.42))
                        .frame(height: 1)
                }
                .frame(maxWidth: 1180)

                Text(verse.germanText)
                    .font(.system(size: 30, weight: .regular, design: .serif))
                    .foregroundStyle(DarAlLaylQuranCardStyle.primaryText.opacity(0.92))
                    .multilineTextAlignment(.center)
                    .lineSpacing(10)
                    .frame(maxWidth: 1250)
                    .id("german-\(verse.id)")

                Text("Deutsche Übersetzung: \(QuranContentService.germanTranslationName)")
                    .font(.system(size: 14, weight: .regular, design: .serif))
                    .foregroundStyle(DarAlLaylQuranCardStyle.mutedText)

                TVQuranTadabburCard(reference: reference, tadabbur: tadabbur)
                    .frame(maxWidth: 1180)
                    .padding(.top, 2)
            }
            .frame(maxWidth: .infinity)
            .padding(.horizontal, 54)
            .padding(.vertical, 52)
            .background(quranCardBackground)
            .overlay(quranCardBorder)
            .shadow(color: .black.opacity(0.38), radius: 28, x: 0, y: 18)
            .padding(.horizontal, 10)
            .padding(.vertical, 20)
        }
        .animation(.easeInOut(duration: 0.28), value: verse.id)
    }

    private var quranCardBackground: some View {
        RoundedRectangle(cornerRadius: DarAlLaylQuranCardStyle.cornerRadius, style: .continuous)
            .fill(
                LinearGradient(
                    colors: [
                        DarAlLaylQuranCardStyle.cardTop,
                        DarAlLaylQuranCardStyle.cardBottom
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
    }

    private var quranCardBorder: some View {
        RoundedRectangle(cornerRadius: DarAlLaylQuranCardStyle.cornerRadius, style: .continuous)
            .stroke(
                LinearGradient(
                    colors: [
                        DarAlLaylQuranCardStyle.cardStroke.opacity(0.52),
                        DarAlLaylQuranCardStyle.cardStroke.opacity(0.16)
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                ),
                lineWidth: 1.2
            )
    }

    private var playerControls: some View {
        HStack(spacing: 28) {
            Button {
                playbackStore.previous()
            } label: {
                Label("Vorherige Āyah", systemImage: "backward.end.fill")
            }
            .disabled(!playbackStore.canGoPrevious || playbackStore.isLoading)

            Button {
                playbackStore.togglePlayPause()
            } label: {
                Label(
                    playbackStore.isPlaying ? "Pause" : "Rezitation starten",
                    systemImage: playbackStore.isPlaying ? "pause.fill" : "play.fill"
                )
                .font(.system(size: 19, weight: .semibold, design: .serif))
                .frame(minWidth: 220)
            }
            .disabled(playbackStore.currentVerse == nil || playbackStore.isLoading)

            Button {
                playbackStore.next()
            } label: {
                Label("Nächste Āyah", systemImage: "forward.end.fill")
            }
            .disabled(!playbackStore.canGoNext || playbackStore.isLoading)

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                Text(reciterStore.selectedReciter?.displayName ?? "Qurʾān-Rezitator")
                    .font(.system(size: 17, weight: .semibold, design: .serif))
                    .foregroundStyle(DarAlLaylQuranCardStyle.primaryText)
                    .lineLimit(1)

                Text("Die nächste Āyah erscheint automatisch nach Ende der Rezitation.")
                    .font(.system(size: 13, weight: .regular, design: .serif))
                    .foregroundStyle(DarAlLaylQuranCardStyle.secondaryText)
            }
        }
    }

    private var loadingView: some View {
        VStack(spacing: 22) {
            ProgressView()
                .controlSize(.large)
            Text("Qurʾān wird vorbereitet …")
                .font(.system(size: 20, weight: .regular, design: .serif))
                .foregroundStyle(DarAlLaylQuranCardStyle.secondaryText)
        }
    }

    private func errorView(_ message: String) -> some View {
        VStack(spacing: 20) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 42))
                .foregroundStyle(DarAlLaylQuranCardStyle.goldLine)
            Text(message)
                .font(.system(size: 22, weight: .semibold, design: .serif))
                .foregroundStyle(DarAlLaylQuranCardStyle.primaryText)
            Button("Erneut versuchen") {
                Task {
                    await playbackStore.load(
                        surah: playbackStore.surah?.number ?? playbackStore.savedSurahNumber,
                        reciterIdentifier: reciterStore.selectedIdentifier,
                        restoreSavedAyah: true
                    )
                }
            }
        }
    }

    private func prepare() async {
        async let reciterLoad: Void = reciterStore.loadFinished ? () : reciterStore.load()
        async let tadabburLoad: Void = tadabburStore.load()
        _ = await (reciterLoad, tadabburLoad)

        if surahs.isEmpty && !isLoadingSurahs {
            isLoadingSurahs = true
            surahs = (try? await contentService.loadSurahList()) ?? []
            isLoadingSurahs = false
        }

        if playbackStore.surah == nil {
            await playbackStore.load(
                surah: playbackStore.savedSurahNumber,
                reciterIdentifier: reciterStore.selectedIdentifier,
                restoreSavedAyah: true,
                autoPlay: false
            )
        }
    }
}

@MainActor
private struct QuranSurahPickerSheet: View {
    let surahs: [QuranSurahSummary]
    let selectedSurah: Int
    let onSelect: (QuranSurahSummary) -> Void

    @Environment(\.dismiss) private var dismiss

    private let columns = [
        GridItem(.flexible(), spacing: 22),
        GridItem(.flexible(), spacing: 22),
        GridItem(.flexible(), spacing: 22)
    ]

    var body: some View {
        NavigationStack {
            ZStack {
                LinearGradient(
                    colors: [
                        DarAlLaylQuranCardStyle.pageTop,
                        DarAlLaylQuranCardStyle.pageBottom
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()

                ScrollView {
                    LazyVGrid(columns: columns, spacing: 22) {
                        ForEach(surahs) { surah in
                            Button {
                                onSelect(surah)
                            } label: {
                                surahCard(surah)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal, 54)
                    .padding(.vertical, 36)
                }
            }
            .navigationTitle("Sūrah auswählen")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Schließen") {
                        dismiss()
                    }
                }
            }
        }
    }

    private func surahCard(_ surah: QuranSurahSummary) -> some View {
        HStack(spacing: 16) {
            Text("\(surah.number)")
                .font(.system(size: 24, weight: .bold, design: .serif).monospacedDigit())
                .foregroundStyle(DarAlLaylQuranCardStyle.goldLine.opacity(0.94))
                .frame(width: 48)

            VStack(alignment: .leading, spacing: 6) {
                Text(surah.englishName)
                    .font(.system(size: 19, weight: .semibold, design: .serif))
                    .foregroundStyle(DarAlLaylQuranCardStyle.primaryText)
                    .lineLimit(1)

                Text(surah.name)
                    .font(.system(size: 24, weight: .medium, design: .serif))
                    .foregroundStyle(DarAlLaylQuranCardStyle.primaryText.opacity(0.94))
                    .lineLimit(1)
                    .environment(\.layoutDirection, .rightToLeft)

                Text("\(surah.numberOfAyahs) Āyāt")
                    .font(.system(size: 13, weight: .regular, design: .serif))
                    .foregroundStyle(DarAlLaylQuranCardStyle.secondaryText)
            }

            Spacer(minLength: 4)

            if surah.number == selectedSurah {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(DarAlLaylQuranCardStyle.goldLine)
            }
        }
        .frame(maxWidth: .infinity, minHeight: 112, alignment: .leading)
        .padding(.horizontal, 18)
        .background(quranPickerCardBackground)
        .overlay(quranPickerCardBorder)
        .contentShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
    }

    private var quranPickerCardBackground: some View {
        RoundedRectangle(cornerRadius: 24, style: .continuous)
            .fill(
                LinearGradient(
                    colors: [
                        DarAlLaylQuranCardStyle.cardTop,
                        DarAlLaylQuranCardStyle.cardBottom
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
    }

    private var quranPickerCardBorder: some View {
        RoundedRectangle(cornerRadius: 24, style: .continuous)
            .stroke(DarAlLaylQuranCardStyle.cardStroke.opacity(0.30), lineWidth: 1)
    }
}

#if DEBUG
#Preview {
    QuranTabView()
}
#endif
