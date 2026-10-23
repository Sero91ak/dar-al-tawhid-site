import SwiftUI
import PDFKit

struct LibraryView: View {
    let repository: LocalContentRepository
    @State private var books: [LibraryBook] = []
    @State private var publications: [LibraryPublication] = []
    @State private var searchText = ""
    @State private var errorMessage: String?

    private var filteredBooks: [LibraryBook] {
        guard !searchText.isEmpty else { return books }
        return books.filter {
            [$0.title, $0.author ?? "", $0.category ?? ""].joined(separator: " ")
                .localizedStandardContains(searchText)
        }
    }

    private var filteredPublications: [LibraryPublication] {
        guard !searchText.isEmpty else { return publications }
        return publications.filter {
            [$0.title, $0.description ?? "", $0.category ?? "", $0.topic ?? ""].joined(separator: " ")
                .localizedStandardContains(searchText)
        }
    }

    var body: some View {
        List {
            if let errorMessage {
                ContentUnavailableView("Bibliothek nicht verfügbar", systemImage: "books.vertical", description: Text(errorMessage))
            } else {
                Section("Bücher") {
                    ForEach(filteredBooks) { book in
                        NavigationLink {
                            LibraryBookDetailView(book: book)
                        } label: {
                            LibraryBookRow(book: book)
                        }
                    }
                }

                Section("Veröffentlichungen") {
                    ForEach(filteredPublications) { publication in
                        NavigationLink {
                            LibraryPublicationDetailView(publication: publication)
                        } label: {
                            LibraryPublicationRow(publication: publication)
                        }
                    }
                }
            }
        }
        .searchable(text: $searchText, prompt: "Bibliothek durchsuchen")
        .navigationTitle("Bibliothek")
        .overlay {
            if books.isEmpty && publications.isEmpty && errorMessage == nil {
                ProgressView("Bibliothek wird geladen …")
            }
        }
        .task {
            do {
                async let loadedBooks = repository.libraryBooks()
                async let loadedPublications = repository.libraryPublications()
                books = try await loadedBooks
                publications = try await loadedPublications
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}

private struct LibraryBookRow: View {
    let book: LibraryBook

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "book.closed.fill")
                .font(.title2)
                .foregroundStyle(.tint)
                .frame(width: 44, height: 56)
                .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 10))
            VStack(alignment: .leading, spacing: 4) {
                Text(book.title)
                    .font(.headline)
                Text(book.author ?? "Autor nicht angegeben")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Text(book.category ?? "Verifiziert")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }
}

private struct LibraryPublicationRow: View {
    let publication: LibraryPublication

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "doc.richtext.fill")
                .font(.title2)
                .foregroundStyle(.tint)
                .frame(width: 44, height: 56)
                .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 10))
            VStack(alignment: .leading, spacing: 4) {
                Text(publication.title)
                    .font(.headline)
                Text(publication.category ?? "Publikation")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Text(publication.pageCount.map { "\($0) Seiten" } ?? "PDF-Metadaten vorhanden")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }
}

private struct LibraryBookDetailView: View {
    let book: LibraryBook

    var body: some View {
        List {
            Section {
                Text(book.title)
                    .font(.title2.weight(.semibold))
                if let author = book.author {
                    LabeledContent("Autor", value: author)
                }
                if let category = book.category {
                    LabeledContent("Kategorie", value: category)
                }
                LabeledContent("Prüfstatus", value: book.verification ?? "unbekannt")
            }
            Section("Quellenbezug") {
                if let postIDs = book.postIDs, !postIDs.isEmpty {
                    Text("Verknüpfte Beiträge: \(postIDs.count)")
                }
                if let scholars = book.quotedScholars, !scholars.isEmpty {
                    Text(scholars.joined(separator: ", "))
                }
            }
            Section {
                Text("Für dieses Buch ist im DAR-NEXT-Bundle derzeit kein lokales PDF hinterlegt.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
        .navigationTitle("Buch")
    }
}

private struct LibraryPublicationDetailView: View {
    let publication: LibraryPublication

    var body: some View {
        List {
            Section {
                Text(publication.title)
                    .font(.title2.weight(.semibold))
                if let description = publication.description, !description.isEmpty {
                    Text(description)
                }
                if let category = publication.category {
                    LabeledContent("Kategorie", value: category)
                }
                if let editor = publication.editor {
                    LabeledContent("Redaktion", value: editor)
                }
                if let pages = publication.pageCount {
                    LabeledContent("Umfang", value: "\(pages) Seiten")
                }
                if let version = publication.version {
                    LabeledContent("Version", value: version)
                }
            }
            Section("Offline-Status") {
                Label(
                    publication.offlineEnabled == true ? "Offline vorgesehen" : "Offline nicht freigegeben",
                    systemImage: publication.offlineEnabled == true ? "checkmark.circle" : "xmark.circle"
                )
                if let hash = publication.fileHash {
                    Text("Datei-Hash: \(hash)")
                        .font(.caption)
                        .textSelection(.enabled)
                }
                Text("Das PDF wird erst angezeigt, wenn die geprüfte lokale Datei verfügbar ist.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
        .navigationTitle("Publikation")
    }
}

struct PDFReaderView: UIViewRepresentable {
    let url: URL

    func makeUIView(context: Context) -> PDFView {
        let view = PDFView()
        view.autoScales = true
        view.displayMode = .singlePageContinuous
        view.document = PDFDocument(url: url)
        return view
    }

    func updateUIView(_ view: PDFView, context: Context) {
        view.document = PDFDocument(url: url)
    }
}
