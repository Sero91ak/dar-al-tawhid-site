import Foundation
import AVFoundation
import Combine

@MainActor
final class QuranPlaybackStore: ObservableObject {
    @Published private(set) var surah: QuranSynchronizedSurah?
    @Published private(set) var currentIndex = 0
    @Published private(set) var isLoading = false
    @Published private(set) var isPlaying = false
    @Published private(set) var errorMessage: String?

    private let contentService: QuranContentService
    private let player = AVPlayer()
    private var cancellables = Set<AnyCancellable>()
    private var itemStatusObservation: NSKeyValueObservation?
    private var triedFallbackForIndex: Int?
    private var resumeAfterInterruption = false

    private static let lastSurahKey = "dar.appleTV.quran.lastSurah"
    private static let lastAyahKey = "dar.appleTV.quran.lastAyah"

    init(contentService: QuranContentService = .shared) {
        self.contentService = contentService
        player.isMuted = false
        player.volume = 1.0

        NotificationCenter.default.publisher(for: .AVPlayerItemDidPlayToEndTime)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] notification in
                guard let self,
                      let endedItem = notification.object as? AVPlayerItem,
                      endedItem === self.player.currentItem else {
                    return
                }
                self.advanceAfterPlayback()
            }
            .store(in: &cancellables)

        NotificationCenter.default.publisher(for: .AVPlayerItemFailedToPlayToEndTime)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] notification in
                guard let self,
                      let failedItem = notification.object as? AVPlayerItem,
                      failedItem === self.player.currentItem else {
                    return
                }
                self.handleItemFailure()
            }
            .store(in: &cancellables)

        NotificationCenter.default.publisher(for: AVAudioSession.interruptionNotification)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] notification in
                self?.handleInterruption(notification)
            }
            .store(in: &cancellables)

        NotificationCenter.default.publisher(for: AVAudioSession.mediaServicesWereResetNotification)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] _ in
                guard let self else { return }
                self.activateAudioSession()
                if self.isPlaying { self.playCurrent() }
            }
            .store(in: &cancellables)
    }

    /// tvOS only routes AVPlayer output to the TV/HomePod when the shared
    /// session is active in a playback category. Other audio in the app (e.g.
    /// the Aḏān) may deactivate or re-categorise the shared session, so it is
    /// re-asserted before every Āyah.
    private func activateAudioSession() {
        let session = AVAudioSession.sharedInstance()
        do {
            if session.category != .playback || session.mode != .default {
                try session.setCategory(.playback, mode: .default, options: [])
            }
            try session.setActive(true)
        } catch {
            try? session.setCategory(.playback)
            try? session.setActive(true)
        }
        player.isMuted = false
        player.volume = 1.0
    }

    private func handleInterruption(_ notification: Notification) {
        guard let info = notification.userInfo,
              let rawType = info[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: rawType) else {
            return
        }

        switch type {
        case .began:
            resumeAfterInterruption = isPlaying
            player.pause()
        case .ended:
            guard resumeAfterInterruption else { return }
            resumeAfterInterruption = false
            activateAudioSession()
            if player.currentItem != nil {
                player.play()
                isPlaying = true
            } else {
                playCurrent()
            }
        @unknown default:
            break
        }
    }

    private func handleItemFailure() {
        guard let verse = currentVerse else { return }

        if triedFallbackForIndex != currentIndex,
           let fallback = Self.fallbackAudioURL(for: verse.audioURLString) {
            triedFallbackForIndex = currentIndex
            startItem(url: fallback)
            return
        }

        advanceAfterPlayback()
    }

    private static func fallbackAudioURL(for urlString: String) -> URL? {
        guard urlString.contains("/audio/128/") else { return nil }
        return URL(string: urlString.replacingOccurrences(of: "/audio/128/", with: "/audio/64/"))
    }

    private func startItem(url: URL) {
        activateAudioSession()
        let item = AVPlayerItem(url: url)
        let itemID = ObjectIdentifier(item)
        itemStatusObservation = item.observe(\.status, options: [.new]) { [weak self] observedItem, _ in
            guard observedItem.status == .failed else { return }
            Task { @MainActor [weak self] in
                guard let self,
                      let current = self.player.currentItem,
                      ObjectIdentifier(current) == itemID else { return }
                self.handleItemFailure()
            }
        }
        player.replaceCurrentItem(with: item)
        player.play()
        isPlaying = true
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
        stop()
        isLoading = true
        errorMessage = nil

        do {
            let loaded = try await contentService.loadSynchronizedSurah(
                surah: number,
                reciterIdentifier: reciterIdentifier
            )
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

            if autoPlay {
                playCurrent()
            }
        } catch {
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
        let shouldResume = isPlaying
        stop()
        isLoading = true
        errorMessage = nil

        do {
            let reloaded = try await contentService.loadSynchronizedSurah(
                surah: currentSurah.number,
                reciterIdentifier: identifier
            )
            surah = reloaded
            currentIndex = reloaded.verses.firstIndex(where: { $0.numberInSurah == ayahToKeep }) ?? 0
            persistReadingPosition()
            isLoading = false

            if shouldResume {
                playCurrent()
            }
        } catch {
            isLoading = false
            errorMessage = "Die gewählte Rezitation konnte momentan nicht geladen werden."
        }
    }

    func togglePlayPause() {
        if isPlaying {
            pause()
        } else {
            playCurrent()
        }
    }

    func playCurrent() {
        guard let verse = currentVerse,
              let url = verse.audioURL else {
            isPlaying = false
            return
        }

        triedFallbackForIndex = nil
        startItem(url: url)
        persistReadingPosition()
    }

    func pause() {
        player.pause()
        isPlaying = false
    }

    func stop() {
        player.pause()
        player.replaceCurrentItem(with: nil)
        isPlaying = false
    }

    func previous() {
        guard canGoPrevious else { return }
        let shouldPlay = isPlaying
        stop()
        currentIndex -= 1
        persistReadingPosition()
        if shouldPlay { playCurrent() }
    }

    func next() {
        guard canGoNext else { return }
        let shouldPlay = isPlaying
        stop()
        currentIndex += 1
        persistReadingPosition()
        if shouldPlay { playCurrent() }
    }

    func selectAyah(numberInSurah: Int, autoPlay: Bool = false) {
        guard let verses = surah?.verses,
              let index = verses.firstIndex(where: { $0.numberInSurah == numberInSurah }) else {
            return
        }

        stop()
        currentIndex = index
        persistReadingPosition()
        if autoPlay { playCurrent() }
    }

    private func advanceAfterPlayback() {
        guard let verses = surah?.verses else {
            isPlaying = false
            return
        }

        if currentIndex + 1 < verses.count {
            currentIndex += 1
            persistReadingPosition()
            playCurrent()
        } else {
            isPlaying = false
            player.replaceCurrentItem(with: nil)
        }
    }

    private func persistReadingPosition() {
        guard let surah, let verse = currentVerse else { return }
        UserDefaults.standard.set(surah.number, forKey: Self.lastSurahKey)
        UserDefaults.standard.set(verse.numberInSurah, forKey: Self.lastAyahKey)
    }
}
