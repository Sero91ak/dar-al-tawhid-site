import Foundation
import AVFoundation
import Combine

/// tvOS Qurʾān playback: enqueue and buffer upcoming verses BEFORE the active item ends.
/// AVQueuePlayer advances independently of the UI; the displayed verse follows currentItem.
@MainActor
final class QuranPlaybackStore: ObservableObject {
    @Published private(set) var surah: QuranSynchronizedSurah?
    @Published private(set) var currentIndex = 0
    @Published private(set) var isLoading = false
    @Published private(set) var isPlaying = false
    @Published private(set) var errorMessage: String?

    private struct QueuedVerse {
        let surah: QuranSynchronizedSurah
        let index: Int
    }

    private let contentService: QuranContentService
    private let player = AVQueuePlayer()
    private var cancellables = Set<AnyCancellable>()
    private var queuedVerses: [ObjectIdentifier: QueuedVerse] = [:]
    private var queueTailSurah: QuranSynchronizedSurah?
    private var queueTailIndex = -1
    private var nextSurahReady: QuranSynchronizedSurah?
    private var nextSurahTask: Task<Void, Never>?
    private var loadSerial = 0
    private var queueSerial = 0
    private var isRebuildingQueue = false
    private var recoveringQueue = false
    private var selectedReciter = "ar.alafasy"
    private let aheadCount = 5

    private static let lastSurahKey = "dar.appleTV.quran.lastSurah"
    private static let lastAyahKey = "dar.appleTV.quran.lastAyah"

    init(contentService: QuranContentService = .shared) {
        self.contentService = contentService
        player.actionAtItemEnd = .advance
        player.automaticallyWaitsToMinimizeStalling = true

        // This event is emitted when playback truly changes to a queued item.
        // Do NOT await AVPlayerItemDidPlayToEndTime and call replaceCurrentItem.
        player.publisher(for: \.currentItem, options: [.new])
            .receive(on: DispatchQueue.main)
            .sink { [weak self] item in
                self?.handleCurrentItem(item)
            }
            .store(in: &cancellables)
    }

    var currentVerse: QuranSynchronizedVerse? {
        guard let verses = surah?.verses, verses.indices.contains(currentIndex) else { return nil }
        return verses[currentIndex]
    }

    var verseCount: Int { surah?.verses.count ?? 0 }
    var currentAyahNumber: Int { currentVerse?.numberInSurah ?? 0 }
    var canGoPrevious: Bool { currentIndex > 0 }
    var canGoNext: Bool {
        guard let verses = surah?.verses else { return false }
        return currentIndex + 1 < verses.count
    }

    var savedSurahNumber: Int {
        let value = UserDefaults.standard.integer(forKey: Self.lastSurahKey)
        return (1...114).contains(value) ? value : 1
    }

    func load(
        surah number: Int,
        reciterIdentifier: String,
        restoreSavedAyah: Bool = false,
        autoPlay: Bool = false
    ) async {
        guard (1...114).contains(number) else { return }
        stop()
        let request = loadSerial
        isLoading = true
        errorMessage = nil
        selectedReciter = reciterIdentifier

        do {
            let loaded = try await contentService.loadSynchronizedSurah(
                surah: number, reciterIdentifier: reciterIdentifier
            )
            guard request == loadSerial else { return }
            surah = loaded
            if restoreSavedAyah, number == savedSurahNumber {
                let savedAyah = UserDefaults.standard.integer(forKey: Self.lastAyahKey)
                currentIndex = loaded.verses.firstIndex { $0.numberInSurah == savedAyah } ?? 0
            } else {
                currentIndex = 0
            }
            persistReadingPosition()
            isLoading = false
            rebuildQueue(autoPlay: autoPlay)
        } catch {
            guard request == loadSerial else { return }
            isLoading = false
            errorMessage = "Qurʾān-Inhalt konnte momentan nicht geladen werden."
        }
    }

    func changeReciter(to identifier: String) async {
        guard let currentSurah = surah else {
            await load(surah: savedSurahNumber, reciterIdentifier: identifier, restoreSavedAyah: true)
            return
        }
        let ayahToKeep = currentVerse?.numberInSurah ?? 1
        let resume = isPlaying
        stop()
        let request = loadSerial
        selectedReciter = identifier
        isLoading = true
        errorMessage = nil
        do {
            let reloaded = try await contentService.loadSynchronizedSurah(
                surah: currentSurah.number, reciterIdentifier: identifier
            )
            guard request == loadSerial else { return }
            surah = reloaded
            currentIndex = reloaded.verses.firstIndex { $0.numberInSurah == ayahToKeep } ?? 0
            persistReadingPosition()
            isLoading = false
            rebuildQueue(autoPlay: resume)
        } catch {
            guard request == loadSerial else { return }
            isLoading = false
            errorMessage = "Die gewählte Rezitation konnte momentan nicht geladen werden."
        }
    }

    func togglePlayPause() {
        if isPlaying { pause() } else { playCurrent() }
    }

    func playCurrent() {
        guard currentVerse?.audioURL != nil else { isPlaying = false; return }
        if let item = player.currentItem,
           let entry = queuedVerses[ObjectIdentifier(item)],
           entry.surah.number == surah?.number,
           entry.index == currentIndex {
            isPlaying = true
            player.play()  // Resume, never restart the verse after a user pause.
        } else {
            rebuildQueue(autoPlay: true)
        }
        persistReadingPosition()
    }

    func pause() {
        player.pause()
        isPlaying = false
    }

    func stop() {
        loadSerial += 1
        queueSerial += 1
        isPlaying = false
        nextSurahTask?.cancel()
        nextSurahTask = nil
        nextSurahReady = nil
        isRebuildingQueue = true
        player.pause()
        player.removeAllItems()
        queuedVerses.removeAll()
        queueTailSurah = nil
        queueTailIndex = -1
        isRebuildingQueue = false
        recoveringQueue = false
    }

    func previous() {
        guard canGoPrevious else { return }
        let resume = isPlaying
        currentIndex -= 1
        persistReadingPosition()
        rebuildQueue(autoPlay: resume)
    }

    func next() {
        guard canGoNext else { return }
        let resume = isPlaying
        currentIndex += 1
        persistReadingPosition()
        rebuildQueue(autoPlay: resume)
    }

    func selectAyah(numberInSurah: Int, autoPlay: Bool = false) {
        guard let verses = surah?.verses,
              let index = verses.firstIndex(where: { $0.numberInSurah == numberInSurah }) else { return }
        currentIndex = index
        persistReadingPosition()
        rebuildQueue(autoPlay: autoPlay)
    }

    private func rebuildQueue(autoPlay: Bool) {
        guard let model = surah, model.verses.indices.contains(currentIndex) else {
            isPlaying = false
            return
        }
        queueSerial += 1
        nextSurahTask?.cancel()
        nextSurahTask = nil
        nextSurahReady = nil
        isRebuildingQueue = true
        player.pause()
        player.removeAllItems()
        queuedVerses.removeAll()
        queueTailSurah = model
        queueTailIndex = currentIndex - 1
        fillQueue()
        isRebuildingQueue = false
        isPlaying = autoPlay && player.currentItem != nil
        if isPlaying { player.play() }
        prefetchFollowingSurah(after: model)
    }

    private func fillQueue() {
        guard var tail = queueTailSurah else { return }
        while player.items().count < aheadCount {
            if queueTailIndex + 1 >= tail.verses.count {
                guard let following = nextSurahReady,
                      following.number == (tail.number % 114) + 1,
                      following.reciterIdentifier == selectedReciter else { break }
                tail = following
                queueTailSurah = tail
                queueTailIndex = -1
                nextSurahReady = nil
                prefetchFollowingSurah(after: tail)
            }
            let index = queueTailIndex + 1
            guard tail.verses.indices.contains(index),
                  let url = tail.verses[index].audioURL else { break }
            let item = AVPlayerItem(url: url)
            item.preferredForwardBufferDuration = 8
            let after = player.items().last
            guard player.canInsert(item, after: after) else { break }
            queuedVerses[ObjectIdentifier(item)] = QueuedVerse(surah: tail, index: index)
            player.insert(item, after: after)
            queueTailIndex = index
        }
    }

    private func prefetchFollowingSurah(after model: QuranSynchronizedSurah) {
        nextSurahTask?.cancel()
        let token = queueSerial
        let nextNumber = model.number % 114 + 1
        let reciter = selectedReciter
        nextSurahTask = Task { [weak self] in
            guard let self else { return }
            let result = try? await self.contentService.loadSynchronizedSurah(
                surah: nextNumber, reciterIdentifier: reciter
            )
            guard !Task.isCancelled,
                  token == self.queueSerial,
                  reciter == self.selectedReciter,
                  let result else { return }
            self.nextSurahReady = result
            self.fillQueue()
        }
    }

    private func handleCurrentItem(_ item: AVPlayerItem?) {
        guard !isRebuildingQueue else { return }
        guard let item else {
            // Only an actually drained queue may trigger a recovery load.
            guard isPlaying, !isLoading, player.currentItem == nil,
                  !recoveringQueue else { return }
            recoveringQueue = true
            guard let model = surah else { isPlaying = false; return }
            Task { [weak self] in
                guard let self else { return }
                await self.load(
                    surah: model.number % 114 + 1,
                    reciterIdentifier: self.selectedReciter,
                    autoPlay: true
                )
            }
            return
        }
        guard item === player.currentItem,
              let entry = queuedVerses[ObjectIdentifier(item)] else { return }
        if surah?.number != entry.surah.number || currentIndex != entry.index {
            surah = entry.surah
            currentIndex = entry.index
            persistReadingPosition()
        }
        // Refill behind the playing item so the next ayah is ready ahead of time.
        fillQueue()
    }

    private func persistReadingPosition() {
        guard let surah, let verse = currentVerse else { return }
        UserDefaults.standard.set(surah.number, forKey: Self.lastSurahKey)
        UserDefaults.standard.set(verse.numberInSurah, forKey: Self.lastAyahKey)
    }
}
