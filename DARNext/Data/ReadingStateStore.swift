import Foundation

actor ReadingStateStore {
    static let shared = ReadingStateStore()

    private let fileURL: URL
    private var bookmarks: [String: ReadingBookmark] = [:]
    private var progress: [String: ReadingProgress] = [:]
    private var loaded = false

    init(fileManager: FileManager = .default) {
        let directory = fileManager.urls(for: .applicationSupportDirectory, in: .userDomainMask).first?
            .appendingPathComponent("DARNext", isDirectory: true)
            ?? fileManager.temporaryDirectory.appendingPathComponent("DARNext", isDirectory: true)
        try? fileManager.createDirectory(at: directory, withIntermediateDirectories: true)
        fileURL = directory.appendingPathComponent("reading-state.json")
    }

    func bookmark(_ bookmark: ReadingBookmark) throws {
        try loadIfNeeded()
        bookmarks[bookmark.id] = bookmark
        try persist()
    }

    func removeBookmark(id: String) throws {
        try loadIfNeeded()
        bookmarks.removeValue(forKey: id)
        try persist()
    }

    func isBookmarked(id: String) throws -> Bool {
        try loadIfNeeded()
        return bookmarks[id] != nil
    }

    func allBookmarks() throws -> [ReadingBookmark] {
        try loadIfNeeded()
        return bookmarks.values.sorted { $0.updatedAt > $1.updatedAt }
    }

    func record(_ value: ReadingProgress) throws {
        try loadIfNeeded()
        progress[value.id] = value
        try persist()
    }

    func progress(for id: String) throws -> ReadingProgress? {
        try loadIfNeeded()
        return progress[id]
    }

    private func loadIfNeeded() throws {
        guard !loaded else { return }
        loaded = true
        guard let data = try? Data(contentsOf: fileURL) else { return }
        let state = try JSONDecoder().decode(PersistedState.self, from: data)
        bookmarks = state.bookmarks
        progress = state.progress
    }

    private func persist() throws {
        let state = PersistedState(bookmarks: bookmarks, progress: progress)
        let data = try JSONEncoder().encode(state)
        try data.write(to: fileURL, options: .atomic)
    }

    private struct PersistedState: Codable {
        let bookmarks: [String: ReadingBookmark]
        let progress: [String: ReadingProgress]
    }
}
