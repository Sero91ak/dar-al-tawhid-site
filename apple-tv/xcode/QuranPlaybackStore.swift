import Foundation
import AVFoundation
import Combine

private final class QuranAudioPlayerDelegate: NSObject, AVAudioPlayerDelegate {
    var onFinish: (() -> Void)?
    var onDecodeError: (() -> Void)?

    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        onFinish?()
    }

    func audioPlayerDecodeErrorDidOccur(_ player: AVAudioPlayer, error: Error?) {
        onDecodeError?()
    }
}

@MainActor
final class QuranPlaybackStore: ObservableObject {
    @Published private(set) var surah: QuranSynchronizedSurah?
    @Published private(set) var currentIndex = 0
    @Published private(set) var isLoading = false
    @Published private(set) var isPlaying = false
    @Published private(set) var errorMessage: String?

    private let contentService: QuranContentService
    private let playerDelegate = QuranAudioPlayerDelegate()
    private var audioPlayer: AVAudioPlayer?
    private var playTask: Task<Void, Never>?
    private var cancellables = Set<AnyCancellable>()
    private var triedFallbackForIndex: Int?
    private var resumeAfterInterruption = false
    private var generation = 0

    private static let lastSurahKey = "dar.appleTV.quran.lastSurah"
    private static let lastAyahKey = "dar.appleTV.quran.lastAyah"

    init(contentService: QuranContentService = .shared) {
        self.contentService = contentService
        playerDelegate.onFinish = { [weak self] in
            Task { @MainActor in
                self?.advanceAfterPlayback()
            }
        }
        playerDelegate.onDecodeError = { [weak self] in
            Task { @MainActor in
                self?.handleItemFailure()
            }
        }
        prepareSpeaker()

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
                self.prepareSpeaker()
                if self.isPlaying { self.playCurrent() }
            }
            .store(in: &cancellables)
    }

    /// Tonausgang der Apple-TV-App einschalten (auch Simulator → Mac-Lautsprecher).
    func prepareSpeaker() {
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(.playback, mode: .default, options: [])
            try session.setActive(true)
        } catch {
            try? session.setCategory(.playback)
            try? session.setActive(true)
        }
        audioPlayer?.volume = 1
        audioPlayer?.isMeteringEnabled = false
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
            audioPlayer?.pause()
        case .ended:
            guard resumeAfterInterruption else { return }
            resumeAfterInterruption = false
            prepareSpeaker()
            if let audioPlayer, audioPlayer.play() {
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

        if triedFallbackForIndex != currentIndex {
            triedFallbackForIndex = currentIndex
            if let original = verse.audioURL,
               original.absoluteString != (Self.siteAudioURL(edition: surah?.reciterIdentifier, verse: verse)?.absoluteString ?? "") {
                startDownloadAndPlay(url: original)
                return
            }
            if let fallback = Self.fallbackAudioURL(for: verse.audioURLString) {
                startDownloadAndPlay(url: fallback)
                return
            }
        }

        advanceAfterPlayback()
    }

    private static func siteAudioURL(edition: String?, verse: QuranSynchronizedVerse) -> URL? {
        guard let edition, !edition.isEmpty, verse.globalNumber >= 1 else { return nil }
        return URL(string: "https://dar-al-tawhid.de/quran-audio/\(edition)/\(verse.globalNumber).mp3")
    }

    private static func fallbackAudioURL(for urlString: String) -> URL? {
        if urlString.contains("dar-al-tawhid.de/quran-audio/") {
            return nil
        }
        guard urlString.contains("/audio/128/") else { return nil }
        return URL(string: urlString.replacingOccurrences(of: "/audio/128/", with: "/audio/64/"))
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
        prepareSpeaker()
        if isPlaying {
            pause()
            return
        }
        if let audioPlayer, audioPlayer.currentTime > 0.05, audioPlayer.currentTime < audioPlayer.duration {
            if audioPlayer.play() {
                isPlaying = true
                return
            }
        }
        playCurrent()
    }

    func playCurrent() {
        guard let verse = currentVerse else {
            isPlaying = false
            return
        }

        let url = Self.siteAudioURL(edition: surah?.reciterIdentifier, verse: verse)
            ?? verse.audioURL
        guard let url else {
            isPlaying = false
            return
        }

        triedFallbackForIndex = nil
        persistReadingPosition()
        startDownloadAndPlay(url: url)
    }

    private func startDownloadAndPlay(url: URL) {
        playTask?.cancel()
        generation += 1
        let token = generation
        isPlaying = true
        playTask = Task { [weak self] in
            await self?.downloadAndPlay(url: url, token: token)
        }
    }

    private func downloadAndPlay(url: URL, token: Int) async {
        prepareSpeaker()

        do {
            var request = URLRequest(url: url)
            request.cachePolicy = .returnCacheDataElseLoad
            request.timeoutInterval = 25
            let (data, response) = try await URLSession.shared.data(for: request)
            guard token == generation, !Task.isCancelled else { return }
            guard let http = response as? HTTPURLResponse,
                  (200...299).contains(http.statusCode),
                  data.count > 64 else {
                handleItemFailure()
                return
            }

            audioPlayer?.stop()
            let player = try AVAudioPlayer(data: data)
            player.delegate = playerDelegate
            player.volume = 1
            player.prepareToPlay()
            audioPlayer = player
            prepareSpeaker()
            guard player.play() else {
                handleItemFailure()
                return
            }
            isPlaying = true
        } catch {
            guard token == generation, !Task.isCancelled else { return }
            handleItemFailure()
        }
    }

    func pause() {
        audioPlayer?.pause()
        isPlaying = false
    }

    func stop() {
        playTask?.cancel()
        playTask = nil
        generation += 1
        audioPlayer?.stop()
        audioPlayer = nil
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
            audioPlayer?.stop()
            audioPlayer = nil
        }
    }

    private func persistReadingPosition() {
        guard let surah, let verse = currentVerse else { return }
        UserDefaults.standard.set(surah.number, forKey: Self.lastSurahKey)
        UserDefaults.standard.set(verse.numberInSurah, forKey: Self.lastAyahKey)
    }
}
