import SwiftUI

struct QuranView: View {
    let repository: LocalContentRepository

    @Environment(\.darTheme) private var theme
    @State private var catalog: QuranCatalog?
    @State private var errorMessage: String?

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 14) {
                if let catalog {
                    Text("114 Sūren")
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(theme.secondaryText)

                    ForEach(catalog.surahs) { surah in
                        NavigationLink(value: surah.id) {
                            HStack(spacing: 14) {
                                Text("\(surah.id)")
                                    .font(.system(.headline, design: .serif))
                                    .foregroundStyle(theme.goldLight)
                                    .frame(width: 42, height: 42)
                                    .background(theme.deepNavy.opacity(0.72), in: Circle())

                                VStack(alignment: .leading, spacing: 4) {
                                    Text(surah.transliteration)
                                        .font(.headline)
                                        .foregroundStyle(theme.cream)
                                    Text("\(surah.name) · \(surah.totalVerses) Āyāt")
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
                        .buttonStyle(.plain)
                    }
                } else if let errorMessage {
                    ContentUnavailableView("Qurʾān nicht verfügbar", systemImage: "book.closed", description: Text(errorMessage))
                        .frame(maxWidth: .infinity, minHeight: 220)
                } else {
                    ProgressView("Qurʾān-Katalog wird geladen …")
                        .tint(theme.goldLight)
                        .frame(maxWidth: .infinity, minHeight: 220)
                }
            }
            .padding(.horizontal, 18)
            .padding(.top, 12)
            .padding(.bottom, 110)
        }
        .scrollIndicators(.hidden)
        .background(theme.backgroundGradient.ignoresSafeArea())
        .navigationTitle("Qurʾān")
        .toolbarColorScheme(.dark, for: .navigationBar)
        .navigationDestination(for: Int.self) { number in
            QuranSurahView(repository: repository, number: number)
        }
        .task {
            do {
                catalog = try await repository.quranCatalog()
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}

struct QuranSurahView: View {
    let repository: LocalContentRepository
    let number: Int
    var focusAyah: Int? = nil

    @Environment(\.darTheme) private var theme
    @Environment(QuranAudioEngine.self) private var audioEngine
    @State private var surah: QuranSurah?
    @State private var errorMessage: String?
    @State private var transliterationMode = QuranTransliterationMode.readable

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 14) {
                    if let surah {
                        VStack(alignment: .leading, spacing: 6) {
                            Text(surah.transliteration)
                                .font(.system(.largeTitle, design: .serif).weight(.bold))
                                .foregroundStyle(theme.cream)
                            Text(surah.name)
                                .font(.title3)
                                .foregroundStyle(theme.goldLight)
                                .frame(maxWidth: .infinity, alignment: .trailing)
                                .environment(\.layoutDirection, .rightToLeft)
                        }
                        .padding(.bottom, 6)

                        ForEach(surah.verses) { ayah in
                            DARGlassCard {
                                VStack(alignment: .leading, spacing: 12) {
                                    Text(ayah.arabicText)
                                        .font(.system(size: 27, design: .serif))
                                        .foregroundStyle(theme.cream)
                                        .frame(maxWidth: .infinity, alignment: .trailing)
                                        .environment(\.layoutDirection, .rightToLeft)
                                    if transliterationMode != .hidden {
                                        Text(transliterationMode.value(for: ayah))
                                            .font(.subheadline)
                                            .foregroundStyle(theme.goldLight)
                                    }
                                    Text(ayah.germanTranslation)
                                        .font(.body)
                                        .foregroundStyle(theme.secondaryText)
                                    Text("Qurʾān \(surah.id):\(ayah.id)")
                                        .font(.caption.weight(.semibold))
                                        .foregroundStyle(theme.goldLight)
                                }
                            }
                            .contentShape(Rectangle())
                            .onTapGesture {
                                Task {
                                    try? await ReadingStateStore.shared.record(
                                        ReadingProgress(
                                            id: "quran-\(surah.id)",
                                            kind: .quran,
                                            position: Double(ayah.id) / Double(max(surah.totalVerses, 1)),
                                            location: "Qurʾān \(surah.id):\(ayah.id)",
                                            updatedAt: .now
                                        )
                                    )
                                }
                            }
                            .id(ayah.id)
                        }
                    } else if let errorMessage {
                        ContentUnavailableView("Sūrah nicht verfügbar", systemImage: "exclamationmark.triangle", description: Text(errorMessage))
                            .frame(maxWidth: .infinity, minHeight: 220)
                    } else {
                        ProgressView("Sūrah wird geladen …")
                            .tint(theme.goldLight)
                            .frame(maxWidth: .infinity, minHeight: 220)
                    }
                }
                .padding(.horizontal, 18)
                .padding(.top, 12)
                .padding(.bottom, 110)
            }
            .scrollIndicators(.hidden)
            .task(id: surah?.id) {
                guard let focusAyah, surah != nil else { return }
                await Task.yield()
                withAnimation { proxy.scrollTo(focusAyah, anchor: .center) }
            }
        }
        .background(theme.backgroundGradient.ignoresSafeArea())
        .navigationTitle("Qurʾān \(number)")
        .toolbarColorScheme(.dark, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                ReadingBookmarkButton(id: "quran-\(number)", kind: .quran, title: "Qurʾān \(number)")
            }
            ToolbarItem(placement: .topBarTrailing) {
                Picker("Transliteration", selection: $transliterationMode) {
                    ForEach(QuranTransliterationMode.allCases) { mode in
                        Text(mode.title).tag(mode)
                    }
                }
                .pickerStyle(.menu)
                .accessibilityLabel("Transliteration auswählen")
            }
            ToolbarItem(placement: .primaryAction) {
                Button {
                    Task {
                        await audioEngine.loadSurah(surah: number, reciterID: QuranAudioSourceAdapter.defaultReciter)
                        audioEngine.play()
                    }
                } label: {
                    Label("Audio starten", systemImage: "play.circle.fill")
                }
                .accessibilityLabel("Sūrah-Audio starten")
            }
        }
        .task {
            do {
                surah = try await repository.quranSurah(number: number)
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}

private enum QuranTransliterationMode: String, CaseIterable, Identifiable {
    case hidden
    case readable
    case academic

    var id: Self { self }

    var title: String {
        switch self {
        case .hidden: "Ohne Lautschrift"
        case .readable: "Lesbare Lautschrift"
        case .academic: "Akademische Lautschrift"
        }
    }

    func value(for ayah: QuranAyah) -> String {
        switch self {
        case .hidden: ""
        case .readable: ayah.readableTransliteration ?? ayah.transliteration ?? ""
        case .academic: ayah.academicTransliteration ?? ayah.transliteration ?? ""
        }
    }
}
