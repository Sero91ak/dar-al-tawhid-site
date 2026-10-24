import SwiftUI

struct ReadingBookmarkButton: View {
    let id: String
    let kind: ReadingContentKind
    let title: String

    @State private var isBookmarked = false

    var body: some View {
        Button {
            Task {
                let store = ReadingStateStore.shared
                if isBookmarked {
                    try? await store.removeBookmark(id: id)
                } else {
                    try? await store.bookmark(
                        ReadingBookmark(id: id, kind: kind, title: title, location: nil, updatedAt: .now)
                    )
                }
                isBookmarked.toggle()
            }
        } label: {
            Image(systemName: isBookmarked ? "bookmark.fill" : "bookmark")
        }
        .accessibilityLabel(isBookmarked ? "Lesezeichen entfernen" : "Lesezeichen speichern")
        .task {
            isBookmarked = (try? await ReadingStateStore.shared.isBookmarked(id: id)) ?? false
        }
    }
}
