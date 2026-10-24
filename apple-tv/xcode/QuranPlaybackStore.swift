import Foundation
import AVFoundation
import Combine

@MainActor
final class QuranPlaybackStore: NSObject, ObservableObject, AVAudioPlayerDelegate {
    @Published private(set) var surah: QuranSynchronizedSurah?
    @Published private(set) var currentIndex = 0
    @Published private(set) var isLoading = false
    @Published private(set) var isPlaying = false
    @Published private(set) var errorMessage: String?
    private var isPlaybackBlocked = false
    private var wantsAutoplay = false

    private let contentService: QuranContentService
    private let player = AVQueuePlayer()
    private var localAudioPlayer: AVAudioPlayer?
    private var cancellables = Set<AnyCancellable>()
    private var queuedItemIndices: [ObjectIdentifier: Int] = [:]
    private let queueDepth = 3
    private var operationGeneration = 0
    private var playGeneration = 0
    private var playbackRepairAttempts = 0
    private var activePlaybackGeneration = 0

    private static let lastSurahKey = "dar.appleTV.quran.lastSurah"
    private static let lastAyahKey = "dar.appleTV.quran.lastAyah"
    private static let resumePlaybackKey = "dar.appleTV.quran.resumePlayback"

    var shouldResumePlayback: Bool {
        (UserDefaults.standard.object(forKey: Self.resumePlaybackKey) as? Bool) ?? true
    }

    init(contentService: QuranContentService = .shared) {
        self.contentService = contentService
        super.init()
        player.volume = 1.0
        localAudioPlayer?.volume = 1.0
        player.automaticallyWaitsToMinimizeStalling = true

        NotificationCenter.default.publisher(for: .AVPlayerItemDidPlayToEndTime)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] notification in
                guard let self, let endedItem = notification.object as? AVPlayerItem else {
                    return
                }
                // AVQueuePlayer may already expose the next item when this fires.
                // Identify the completed Āyah by identity, not by currentItem.
                self.advanceAfterPlayback(endedItem: endedItem)
            }
            .store(in: &cancellables)

        NotificationCenter.default.publisher(for: .AVPlayerItemFailedToPlayToEndTime)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] notification in
                guard let self, let failedItem = notification.object as? AVPlayerItem,
                      failedItem === self.player.currentItem,
                      let failedIndex = self.queuedItemIndices[ObjectIdentifier(failedItem)] else {
                    return
                }
                self.restartQueue(at: failedIndex)
            }
            .store(in: &cancellables)
    }

    var currentVerse: QuranSynchronizedVerse? {
        guard let verses = surah?.verses, verses.indices.contains(currentIndex) else {
            return nil
        }
        return verses[currentIndex]
    }

    var verseCount: Int {
        surah?.verses.count ?? 0
    }

    var currentAyahNumber: Int {
        currentVerse?.numberInSurah ?? 0
    }

    var currentSurahNumber: Int {
        surah?.number ?? savedSurahNumber
    }

    var currentSurahTitle: String {
        guard let surah else { return "Qurʾān" }
        return "\(String(format: "%03d", surah.number)) · \(surah.englishName)"
    }

    var reciterName: String {
        guard let identifier = surah?.reciterIdentifier else { return "Qurʾān-Rezitator" }
        return QuranReciterNames.displayName(for: identifier) ?? identifier
    }

    var statusText: String {
        if isLoading { return "Qurʾān wird geladen" }
        return isPlaying ? "Qurʾān läuft" : "Qurʾān pausiert"
    }

    var canGoPrevious: Bool {
        currentIndex > 0
    }

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
        if autoPlay {
            wantsAutoplay = true
        }
        operationGeneration += 1
        let generation = operationGeneration
        stopPlayer()
        isLoading = true
        errorMessage = nil

        do {
            let loaded = try await contentService.loadSynchronizedSurah(
                surah: number,
                reciterIdentifier: reciterIdentifier
            )
            guard generation == operationGeneration else { return }
            surah = loaded

            if restoreSavedAyah, number == savedSurahNumber {
                let savedAyah = UserDefaults.standard.integer(forKey: Self.lastAyahKey)
                if let savedIndex = loaded.verses.firstIndex(where: { $0.numberInSurah == savedAyah }) {
                    currentIndex = savedIndex
                } else {
                    currentIndex = 0
                }
            } else {
                currentIndex = 0
            }

            persistReadingPosition()
            isLoading = false
            errorMessage = nil

            if autoPlay, !isPlaybackBlocked {
                playCurrent()
            }
        } catch {
            isLoading = false
            if surah == nil {
                errorMessage = "Qurʾān-Texte sind ohne Internet erst nach dem ersten erfolgreichen Laden verfügbar."
            }
        }
    }

    func changeReciter(to identifier: String) async {
        UserDefaults.standard.set(identifier, forKey: "dar.appleTV.quran.selectedReciter")
        operationGeneration += 1
        let generation = operationGeneration
        guard let currentSurah = surah else {
            await load(surah: savedSurahNumber, reciterIdentifier: identifier, restoreSavedAyah: true)
            return
        }

        let ayahToKeep = currentVerse?.numberInSurah ?? 1
        let shouldResume = isPlaying
        stopPlayer()
        isLoading = true
        errorMessage = nil

        do {
            let reloaded = try await contentService.loadSynchronizedSurah(
                surah: currentSurah.number,
                reciterIdentifier: identifier
            )
            guard generation == operationGeneration else { return }
            surah = reloaded
            currentIndex = reloaded.verses.firstIndex(where: { $0.numberInSurah == ayahToKeep }) ?? 0
            persistReadingPosition()
            isLoading = false
            errorMessage = nil

            if shouldResume, !isPlaybackBlocked {
                playCurrent()
            }
        } catch {
            isLoading = false
            if surah == nil {
                errorMessage = "Die gewählte Rezitation ist offline nicht gespeichert."
            }
        }
    }

    func togglePlayPause() {
        if isPlaying {
            pause()
            return
        }

        isPlaybackBlocked = false
        wantsAutoplay = true

        if currentVerse == nil {
            let reciterIdentifier = surah?.reciterIdentifier
                ?? UserDefaults.standard.string(forKey: "dar.appleTV.quran.selectedReciter")
                ?? QuranReciterService.defaultIdentifier
            Task { @MainActor [weak self] in
                guard let self else { return }
                await load(
                    surah: currentSurahNumber,
                    reciterIdentifier: reciterIdentifier,
                    restoreSavedAyah: true,
                    autoPlay: true
                )
            }
            return
        }

        playCurrent()
    }

    func setPlaybackBlocked(_ blocked: Bool) {
        isPlaybackBlocked = blocked
        if blocked {
            pauseForOverlay()
        } else if wantsAutoplay, currentVerse != nil, !isPlaying {
            playCurrent()
        }
    }

    func playCurrent() {
        wantsAutoplay = true
        UserDefaults.standard.set(true, forKey: Self.resumePlaybackKey)
        guard let verse = currentVerse, verse.audioURL != nil else {
            isPlaying = false
            errorMessage = "Für diesen Rezitator ist für diesen Vers keine MP3 hinterlegt."
            return
        }

        playGeneration += 1
        let generation = playGeneration
        activePlaybackGeneration = generation
        playbackRepairAttempts = 0
        Task { @MainActor [weak self] in
            guard let self else { return }
            await TVAudioSession.activate()
            guard generation == playGeneration else { return }

            localAudioPlayer?.stop()
            localAudioPlayer = nil
            player.volume = 1.0

            // Resume the existing queue when possible. Rebuild only after an
            // explicit navigation or when no item has been prepared yet.
            let hasPreparedCurrentItem = player.currentItem.map {
                queuedItemIndices[ObjectIdentifier($0)] == currentIndex
            } ?? false
            if !hasPreparedCurrentItem {
                player.removeAllItems()
                queuedItemIndices.removeAll()
                enqueueItems(startingAt: currentIndex)
            }

            guard generation == playGeneration, player.currentItem != nil else {
                isPlaying = false
                errorMessage = "Qurʾān-Audio konnte nicht vorbereitet werden."
                return
            }
            player.play()
            isPlaying = true
            errorMessage = nil
            persistReadingPosition()
        }
    }

    private func enqueueItems(startingAt index: Int) {
        guard let verses = surah?.verses, verses.indices.contains(index) else { return }
        var lastItem = player.items().last
        let end = min(index + queueDepth, verses.count)

        for itemIndex in index..<end where !queuedItemIndices.values.contains(itemIndex) {
            guard let url = verses[itemIndex].audioURL else { continue }
            let item = AVPlayerItem(url: url)
            item.preferredForwardBufferDuration = 8
            player.insert(item, after: lastItem)
            queuedItemIndices[ObjectIdentifier(item)] = itemIndex
            lastItem = item
        }
    }

    private func restartQueue(at index: Int) {
        guard wantsAutoplay, !isPlaybackBlocked else { return }
        playbackRepairAttempts += 1
        player.pause()
        player.removeAllItems()
        queuedItemIndices.removeAll()
        currentIndex = index
        enqueueItems(startingAt: index)
        player.play()
        isPlaying = player.currentItem != nil
        errorMessage = isPlaying ? nil : "Qurʾān-Audio konnte nicht abgespielt werden."
    }

    func pause() {
        wantsAutoplay = false
        UserDefaults.standard.set(false, forKey: Self.resumePlaybackKey)
        playGeneration += 1
        localAudioPlayer?.pause()
        player.pause()
        isPlaying = false
    }

    func pauseForOverlay() {
        playGeneration += 1
        localAudioPlayer?.pause()
        player.pause()
        isPlaying = false
    }

    func stop() {
        operationGeneration += 1
        stopPlayer()
    }

    private func stopPlayer() {
        playGeneration += 1
        localAudioPlayer?.stop()
        localAudioPlayer = nil
        player.pause()
        player.removeAllItems()
        queuedItemIndices.removeAll()
        isPlaying = false
    }

    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        guard player === localAudioPlayer else { return }
        isPlaying = false
    }

    func previous() {
        guard canGoPrevious else { return }
        let shouldPlay = isPlaying
        stopPlayer()
        currentIndex -= 1
        persistReadingPosition()
        if shouldPlay { playCurrent() }
    }

    func next() {
        guard canGoNext else { return }
        let shouldPlay = isPlaying
        stopPlayer()
        currentIndex += 1
        persistReadingPosition()
        if shouldPlay { playCurrent() }
    }

    func selectSurah(_ number: Int) {
        let clamped = min(max(number, 1), 114)
        let reciterIdentifier = surah?.reciterIdentifier
            ?? UserDefaults.standard.string(forKey: "dar.appleTV.quran.selectedReciter")
            ?? QuranReciterService.defaultIdentifier

        Task {
            await load(
                surah: clamped,
                reciterIdentifier: reciterIdentifier,
                restoreSavedAyah: false,
                autoPlay: true
            )
        }
    }

    func previousSurah() {
        selectSurah(currentSurahNumber - 1)
    }

    func nextSurah() {
        selectSurah(currentSurahNumber + 1)
    }

    func selectAyah(numberInSurah: Int, autoPlay: Bool = false) {
        guard let verses = surah?.verses,
              let index = verses.firstIndex(where: { $0.numberInSurah == numberInSurah }) else {
            return
        }

        stopPlayer()
        currentIndex = index
        persistReadingPosition()
        if autoPlay { playCurrent() }
    }

    private func advanceAfterPlayback(endedItem: AVPlayerItem) {
        guard let endedIndex = queuedItemIndices.removeValue(forKey: ObjectIdentifier(endedItem)) else {
            return
        }
        guard !isPlaybackBlocked else {
            isPlaying = false
            return
        }
        guard let verses = surah?.verses else {
            isPlaying = false
            return
        }

        if endedIndex + 1 < verses.count {
            // The next item is already in AVQueuePlayer, so this is a render-only
            // update. Audio continues without pause, replace, seek, or restart.
            currentIndex = endedIndex + 1
            persistReadingPosition()
            enqueueItems(startingAt: endedIndex + 1)
            isPlaying = player.currentItem != nil
            return
        }

        guard let currentSurah = surah, currentSurah.number < 114 else {
            isPlaying = false
            player.removeAllItems()
            queuedItemIndices.removeAll()
            return
        }
        let reciterIdentifier = currentSurah.reciterIdentifier

        Task { @MainActor [weak self] in
            guard let self, !isPlaybackBlocked else { return }
            await load(
                surah: currentSurah.number + 1,
                reciterIdentifier: reciterIdentifier,
                restoreSavedAyah: false,
                autoPlay: true
            )
        }
    }

    private func persistReadingPosition() {
        guard let surah, let verse = currentVerse else { return }
        UserDefaults.standard.set(surah.number, forKey: Self.lastSurahKey)
        UserDefaults.standard.set(verse.numberInSurah, forKey: Self.lastAyahKey)
    }
}

/// Stores the selected reciter's MP3 files locally and supplies them to AVAudioPlayer.
@MainActor
final class QuranOfflinePackStore: ObservableObject {
    static let shared = QuranOfflinePackStore()

    struct Progress: Equatable {
        let completed: Int
        let total: Int
        let isDownloading: Bool

        var label: String {
            isDownloading ? "Lädt \(completed)/\(total)" : "Gespeichert"
        }
    }

    @Published private(set) var progress: [String: Progress] = [:]
    private var downloadTasks: [String: Task<Void, Never>] = [:]
    private let session = URLSession(configuration: .ephemeral)

    func localURL(edition: String, ayah: Int) -> URL {
        let root = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("DarAlTawhidQuranOffline", isDirectory: true)
        try? FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        return root.appendingPathComponent("\(safe(edition))-\(ayah).mp3")
    }

    func ensureLocalAudio(edition: String, ayah: Int, remoteURL: URL?) async -> URL? {
        let destination = localURL(edition: edition, ayah: ayah)
        if FileManager.default.fileExists(atPath: destination.path) {
            return destination
        }

        let url = remoteURL ?? directURL(edition: edition, ayah: ayah)
        do {
            let (data, response) = try await session.data(from: url)
            guard let http = response as? HTTPURLResponse,
                  (200...299).contains(http.statusCode),
                  data.count > 800 else {
                return nil
            }
            try data.write(to: destination, options: .atomic)
            return destination
        } catch {
            return nil
        }
    }

    func toggleDownload(edition: String) {
        if let task = downloadTasks[edition] {
            task.cancel()
            downloadTasks[edition] = nil
            progress[edition] = Progress(completed: progress[edition]?.completed ?? 0, total: 6236, isDownloading: false)
            return
        }

        progress[edition] = Progress(completed: 0, total: 6236, isDownloading: true)
        downloadTasks[edition] = Task { @MainActor [weak self] in
            guard let self else { return }
            var completed = 0

            for ayah in 1...6236 {
                guard !Task.isCancelled else { break }
                if await self.ensureLocalAudio(
                    edition: edition,
                    ayah: ayah,
                    remoteURL: self.directURL(edition: edition, ayah: ayah)
                ) != nil {
                    completed += 1
                }
                self.progress[edition] = Progress(
                    completed: completed,
                    total: 6236,
                    isDownloading: true
                )
            }

            self.progress[edition] = Progress(
                completed: completed,
                total: 6236,
                isDownloading: false
            )
            self.downloadTasks[edition] = nil
        }
    }

    func removeDownload(edition: String) {
        downloadTasks[edition]?.cancel()
        downloadTasks[edition] = nil

        let root = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("DarAlTawhidQuranOffline", isDirectory: true)
        let prefix = "\(safe(edition))-"
        if let files = try? FileManager.default.contentsOfDirectory(at: root, includingPropertiesForKeys: nil) {
            for file in files where file.lastPathComponent.hasPrefix(prefix) {
                try? FileManager.default.removeItem(at: file)
            }
        }
        progress[edition] = nil
    }

    private func directURL(edition: String, ayah: Int) -> URL {
        let encodedEdition = edition.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? edition
        return URL(string: "https://dar-al-tawhid.de/quran-audio/\(encodedEdition)/\(ayah).mp3")!
    }

    private func safe(_ value: String) -> String {
        value.replacingOccurrences(of: "/", with: "-")
            .replacingOccurrences(of: ":", with: "-")
            .replacingOccurrences(of: " ", with: "-")
    }
}
