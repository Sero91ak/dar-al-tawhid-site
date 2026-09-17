import SwiftUI

@MainActor
struct QuranTabView: View {
    @StateObject private var reciterStore = QuranReciterSelectionStore()
    @StateObject private var playbackStore = QuranPlaybackStore()

    @State private var surahs: [QuranSurahSummary] = []
    @State private var isLoadingSurahs = false
    @State private var showSurahPicker = false

    private let contentService = QuranContentService.shared

    var body: some View {
        ZStack {
            background

            VStack(spacing: 28) {
                header

                Divider()
                    .opacity(0.35)

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
                Color.black,
                Color.black.opacity(0.94),
                Color.black
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
                    .font(.system(size: 23, weight: .bold, design: .rounded))
                    .tracking(2.8)

                if let surah = playbackStore.surah {
                    Text("\(surah.englishName) · Āyah \(playbackStore.currentAyahNumber) von \(playbackStore.verseCount)")
                        .font(.callout)
                        .foregroundStyle(.secondary)
                } else {
                    Text("Arabisch · Deutsch · Rezitation")
                        .font(.callout)
                        .foregroundStyle(.secondary)
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
                .frame(minWidth: 230)
            }
            .disabled(surahs.isEmpty)

            QuranReciterPickerButton(store: reciterStore)
        }
    }

    private func verseView(_ verse: QuranSynchronizedVerse) -> some View {
        ScrollView {
            VStack(spacing: 34) {
                Spacer(minLength: 24)

                Text(verse.arabicText)
                    .font(.system(size: 58, weight: .medium, design: .serif))
                    .multilineTextAlignment(.center)
                    .lineSpacing(18)
                    .frame(maxWidth: 1450)
                    .environment(\.layoutDirection, .rightToLeft)
                    .id("arabic-\(verse.id)")

                HStack(spacing: 16) {
                    Rectangle()
                        .frame(height: 1)
                        .opacity(0.3)

                    Text("ĀYAH \(verse.numberInSurah)")
                        .font(.caption.weight(.bold))
                        .tracking(2.2)
                        .foregroundStyle(.secondary)
                        .fixedSize()

                    Rectangle()
                        .frame(height: 1)
                        .opacity(0.3)
                }
                .frame(maxWidth: 1180)

                Text(verse.germanText)
                    .font(.system(size: 29, weight: .regular, design: .serif))
                    .multilineTextAlignment(.center)
                    .lineSpacing(9)
                    .frame(maxWidth: 1250)
                    .id("german-\(verse.id)")

                Text("Deutsche Übersetzung: \(QuranContentService.germanTranslationName)")
                    .font(.caption)
                    .foregroundStyle(.tertiary)

                Spacer(minLength: 28)
            }
            .frame(maxWidth: .infinity)
        }
        .animation(.easeInOut(duration: 0.28), value: verse.id)
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
                .font(.headline)
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
                    .font(.callout.weight(.semibold))
                    .lineLimit(1)

                Text("Die nächste Āyah erscheint automatisch nach Ende der Rezitation.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }

    private var loadingView: some View {
        VStack(spacing: 22) {
            ProgressView()
                .controlSize(.large)
            Text("Qurʾān wird vorbereitet …")
                .foregroundStyle(.secondary)
        }
    }

    private func errorView(_ message: String) -> some View {
        VStack(spacing: 20) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 42))
            Text(message)
                .font(.headline)
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
        if !reciterStore.loadFinished {
            await reciterStore.load()
        }

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
            ScrollView {
                LazyVGrid(columns: columns, spacing: 22) {
                    ForEach(surahs) { surah in
                        Button {
                            onSelect(surah)
                        } label: {
                            HStack(spacing: 16) {
                                Text("\(surah.number)")
                                    .font(.title3.monospacedDigit().weight(.bold))
                                    .frame(width: 48)

                                VStack(alignment: .leading, spacing: 6) {
                                    Text(surah.englishName)
                                        .font(.headline)
                                        .lineLimit(1)

                                    Text(surah.name)
                                        .font(.title3)
                                        .lineLimit(1)
                                        .environment(\.layoutDirection, .rightToLeft)

                                    Text("\(surah.numberOfAyahs) Āyāt")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }

                                Spacer(minLength: 4)

                                if surah.number == selectedSurah {
                                    Image(systemName: "checkmark.circle.fill")
                                }
                            }
                            .frame(maxWidth: .infinity, minHeight: 112, alignment: .leading)
                            .padding(.horizontal, 18)
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.bordered)
                    }
                }
                .padding(.horizontal, 54)
                .padding(.vertical, 36)
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
}

#if DEBUG
#Preview {
    QuranTabView()
}
#endif
