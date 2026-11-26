import SwiftUI

/// Language picker and the six content sections, using the adult translation packs.
/// Present this from the existing tvOS target. It does not replace playback or the screensaver.
public struct TVLocalizationRootView: View {
    @StateObject private var store: TVLocaleStore
    @StateObject private var strings = TVStrings()
    @StateObject private var content = TVContentClient()
    @State private var section: TVContentSection = .posts
    @FocusState private var languageFocus: String?

    public init(store: TVLocaleStore = .shared) {
        _store = StateObject(wrappedValue: store)
    }

    public var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 28) {
                header
                languageRow
                sectionRow
                contentArea
            }
            .padding(48)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        }
        .environment(\.layoutDirection, store.layoutDirection)
        .task { await strings.load() }
        .task(id: reloadToken) { await content.reload(section, locale: store.code) }
    }

    private var reloadToken: String { store.code + ":" + section.rawValue }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(strings.text(.brand, locale: store.code))
                .font(.caption)
            Text(strings.text(.language, locale: store.code))
                .font(.largeTitle)
            Text(strings.text(.subtitle, locale: store.code))
                .font(.body)
                .foregroundStyle(.secondary)
        }
    }

    private var languageRow: some View {
        ScrollView(.horizontal) {
            HStack(spacing: 16) {
                ForEach(TVLocale.all) { locale in
                    Button {
                        store.select(locale.code)
                    } label: {
                        VStack(alignment: .leading, spacing: 6) {
                            Text(locale.name)
                                .environment(\.layoutDirection, locale.layoutDirection)
                            Text(store.code == locale.code ? strings.text(.active, locale: store.code) : strings.text(.ready, locale: store.code))
                                .font(.caption)
                        }
                        .frame(minWidth: 220, alignment: .leading)
                    }
                    .buttonStyle(.card)
                    .focused($languageFocus, equals: locale.code)
                }
            }
        }
        .onAppear { languageFocus = store.code }
    }

    private var sectionRow: some View {
        ScrollView(.horizontal) {
            HStack(spacing: 16) {
                ForEach(TVContentSection.allCases) { item in
                    Button {
                        section = item
                    } label: {
                        Text(strings.text(item.stringKey, locale: store.code))
                            .frame(minWidth: 180)
                    }
                    .buttonStyle(.card)
                }
            }
        }
    }

    @ViewBuilder
    private var contentArea: some View {
        if content.loading && content.rows.isEmpty && content.verses.isEmpty && content.duas.isEmpty {
            Text(strings.text(.loading, locale: store.code))
        } else if let message = content.errorMessage {
            VStack(alignment: .leading, spacing: 16) {
                Text(message)
                Button(strings.text(.retry, locale: store.code)) {
                    Task { await content.reload(section, locale: store.code) }
                }
                .buttonStyle(.card)
            }
        } else if section == .quran {
            quranList
        } else if section == .dua {
            duaList
        } else if section == .posts && store.code == "de" {
            Text(strings.text(.readGerman, locale: store.code))
            if let count = content.germanPostCount {
                Text(strings.text(.posts, locale: store.code) + " · \(count)")
            }
        } else {
            libraryList
        }
    }

    private var libraryList: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 22) {
                if let total = content.corpusCount {
                    Text("\(content.rows.count) / \(total)")
                        .font(.caption)
                }
                if content.rows.contains(where: \.usedFallback) {
                    Text(strings.text(.fallbackNotice, locale: store.code))
                        .font(.callout)
                }
                ForEach(content.rows) { row in
                    VStack(alignment: .leading, spacing: 8) {
                        Text(row.title).font(.headline)
                        Text(row.detail).lineLimit(4)
                        if !row.source.isEmpty {
                            Text(strings.text(.source, locale: store.code) + ": " + row.source)
                                .font(.caption)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .focusable()
                }
            }
        }
    }

    private var quranList: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 22) {
                if store.code != "de" {
                    Text(strings.text(.fallbackNotice, locale: store.code))
                        .font(.callout)
                }
                ForEach(content.verses, id: \.reference) { verse in
                    VStack(alignment: .leading, spacing: 8) {
                        Text(verse.reference).font(.caption)
                        Text(verse.arabic)
                            .font(.title3)
                            .environment(\.layoutDirection, .rightToLeft)
                        Text(strings.text(.meaning, locale: store.code))
                            .font(.caption)
                        Text(verse.meaning.text)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .focusable()
                }
            }
        }
    }

    private var duaList: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 22) {
                ForEach(content.duas) { dua in
                    VStack(alignment: .leading, spacing: 8) {
                        Text(dua.title).font(.headline)
                        Text(dua.arabic)
                            .environment(\.layoutDirection, .rightToLeft)
                        Text(strings.text(.meaning, locale: store.code))
                            .font(.caption)
                        Text(dua.meaning.text)
                        if dua.meaning.usedFallback {
                            Text(strings.text(.fallbackNotice, locale: store.code))
                                .font(.caption)
                        }
                        if !dua.source.isEmpty {
                            Text(dua.source).font(.caption)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .focusable()
                }
            }
        }
    }
}
