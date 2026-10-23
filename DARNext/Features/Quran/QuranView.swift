import SwiftUI

struct QuranView: View {
    let repository: LocalContentRepository
    @State private var catalog: QuranCatalog?
    @State private var errorMessage: String?

    var body: some View {
        List {
            if let catalog {
                Section {
                    Text("114 Sūren · \(catalog.updated)")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
                ForEach(catalog.surahs) { surah in
                    NavigationLink(value: surah.id) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(surah.transliteration)
                                .font(.headline)
                            Text("\(surah.name) · \(surah.totalVerses) Āyāt")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            } else if let errorMessage {
                ContentUnavailableView("Qurʾān nicht verfügbar", systemImage: "book.closed", description: Text(errorMessage))
            } else {
                ProgressView("Qurʾān-Katalog wird geladen …")
            }
        }
        .navigationTitle("Qurʾān")
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
    @State private var surah: QuranSurah?
    @State private var errorMessage: String?

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
            if let surah {
                LazyVStack(alignment: .leading, spacing: 16) {
                    Text(surah.transliteration)
                        .font(.system(.largeTitle, design: .serif).weight(.bold))
                    Text(surah.name)
                        .font(.title2)
                        .frame(maxWidth: .infinity, alignment: .trailing)
                        .environment(\.layoutDirection, .rightToLeft)
                    ForEach(surah.verses) { ayah in
                        VStack(alignment: .leading, spacing: 10) {
                            Text(ayah.arabicText)
                                .font(.system(size: 27, design: .serif))
                                .frame(maxWidth: .infinity, alignment: .trailing)
                                .environment(\.layoutDirection, .rightToLeft)
                            Text(ayah.germanTranslation)
                                .font(.body)
                            Text("Qurʾān \(surah.id):\(ayah.id)")
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(.secondary)
                        }
                        .id(ayah.id)
                        .padding(.vertical, 8)
                    }
                }
                .padding()
            } else if let errorMessage {
                ContentUnavailableView("Sūrah nicht verfügbar", systemImage: "exclamationmark.triangle", description: Text(errorMessage))
            } else {
                ProgressView("Sūrah wird geladen …")
            }
            }
            .task(id: surah?.id) {
                guard let focusAyah, surah != nil else { return }
                await Task.yield()
                withAnimation { proxy.scrollTo(focusAyah, anchor: .center) }
            }
        }
        .navigationTitle("Qurʾān \(number)")
        .task {
            do {
                surah = try await repository.quranSurah(number: number)
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}
