import AVFoundation
import MediaPlayer
import Observation

struct QuranAudioTrack: Identifiable, Sendable, Equatable {
    let id: String
    let surahNumber: Int
    let ayahNumber: Int?
    let surahTitle: String
    let reciterName: String
    let sourceURL: URL
    let isOfflineAvailable: Bool
}

enum QuranAudioRepeatMode: Sendable, Equatable {
    case off
    case track
    case ayah
}

enum QuranAudioInterruptionPolicy {
    static func shouldResume(wasPlaying: Bool, systemAllowsResume: Bool) -> Bool {
        wasPlaying && systemAllowsResume
    }
}

struct QuranAudioInterruptionState: Equatable, Sendable {
    private(set) var wasPlayingBeforeInterruption = false

    mutating func interruptionBegan(isPlaying: Bool) {
        wasPlayingBeforeInterruption = wasPlayingBeforeInterruption || isPlaying
    }

    mutating func interruptionEnded(systemAllowsResume: Bool) -> Bool {
        defer { wasPlayingBeforeInterruption = false }
        return QuranAudioInterruptionPolicy.shouldResume(
            wasPlaying: wasPlayingBeforeInterruption,
            systemAllowsResume: systemAllowsResume
        )
    }

    mutating func cancelResume() {
        wasPlayingBeforeInterruption = false
    }
}

@MainActor
@Observable
final class QuranAudioEngine {
    private(set) var currentTrack: QuranAudioTrack?
    private(set) var isPlaying = false
    private(set) var currentTime: TimeInterval = 0
    private(set) var duration: TimeInterval = 0
    private(set) var lastError: String?
    private(set) var playlist: [QuranAudioTrack] = []
    private(set) var playlistIndex = 0
    private(set) var availableReciters: [QuranAudioReciter] = []
    private(set) var selectedReciterID = QuranAudioSourceAdapter.defaultReciter
    var playbackRate = 1.0 {
        didSet { player?.rate = isPlaying ? Float(playbackRate) : 0 }
    }
    var repeatMode: QuranAudioRepeatMode = .off

    private var player: AVPlayer?
    private var timeObserver: Any?
    private var endObserver: NSObjectProtocol?
    private var sleepTask: Task<Void, Never>?
    private var remoteCommandsConfigured = false
    private var interruptionObserver: NSObjectProtocol?
    private var interruptionState = QuranAudioInterruptionState()

    func load(_ track: QuranAudioTrack) {
        playlist = [track]
        playlistIndex = 0
        loadTrack(track)
    }

    func loadSurah(surah: Int, reciterID: String, adapter: QuranAudioSourceAdapter = .shared) async {
        do {
            selectedReciterID = reciterID
            let tracks = try await adapter.tracks(surah: surah, reciterID: reciterID)
            guard !tracks.isEmpty else {
                lastError = "Für diese Sūrah wurde keine geprüfte Audioquelle gefunden."
                return
            }
            playlist = tracks
            playlistIndex = 0
            loadTrack(tracks[0])
        } catch {
            lastError = "Audioquellen konnten nicht geladen werden: \(error.localizedDescription)"
        }
    }

    func loadReciters(adapter: QuranAudioSourceAdapter = .shared) async {
        do {
            availableReciters = try await adapter.reciters()
        } catch {
            lastError = "Rezitatoren konnten nicht geladen werden: \(error.localizedDescription)"
        }
    }

    func selectReciter(_ reciterID: String) async {
        guard let surahNumber = currentTrack?.surahNumber else {
            selectedReciterID = reciterID
            return
        }
        await loadSurah(surah: surahNumber, reciterID: reciterID)
    }

    func nextAyah() {
        guard playlistIndex + 1 < playlist.count else { return }
        playlistIndex += 1
        loadTrack(playlist[playlistIndex])
        play()
    }

    func previousAyah() {
        if currentTime > 3 {
            seek(to: 0)
            return
        }
        guard playlistIndex > 0 else { return }
        playlistIndex -= 1
        loadTrack(playlist[playlistIndex])
        play()
    }

    private func loadTrack(_ track: QuranAudioTrack) {
        guard track.sourceURL.isFileURL || track.sourceURL.scheme != nil else {
            lastError = "Die Audioquelle ist ungültig."
            return
        }

        removeObservers()
        interruptionState.cancelResume()
        currentTrack = track
        currentTime = 0
        duration = 0
        lastError = nil
        let item = AVPlayerItem(url: track.sourceURL)
        player = AVPlayer(playerItem: item)
        player?.automaticallyWaitsToMinimizeStalling = true
        addObservers(for: item)
        configureNowPlaying()
    }

    func play() {
        guard let player else {
            lastError = "Keine Qurʾān-Audioquelle geladen."
            return
        }

        do {
            try configureAudioSession()
            player.playImmediately(atRate: Float(playbackRate))
            isPlaying = true
            updateNowPlaying()
        } catch {
            lastError = "Audio konnte nicht gestartet werden: \(error.localizedDescription)"
        }
    }

    func pause() {
        interruptionState.cancelResume()
        player?.pause()
        isPlaying = false
        updateNowPlaying()
    }

    func stop() {
        interruptionState.cancelResume()
        player?.pause()
        player?.seek(to: .zero)
        currentTime = 0
        isPlaying = false
        updateNowPlaying()
    }

    func seek(to time: TimeInterval) {
        let target = max(0, min(time, duration > 0 ? duration : time))
        player?.seek(to: CMTime(seconds: target, preferredTimescale: 600))
        currentTime = target
        updateNowPlaying()
    }

    func setSleepTimer(minutes: Int?) {
        sleepTask?.cancel()
        guard let minutes, minutes > 0 else { return }

        sleepTask = Task { [weak self] in
            try? await Task.sleep(for: .seconds(minutes * 60))
            guard !Task.isCancelled else { return }
            await MainActor.run { self?.pause() }
        }
    }

    private func configureAudioSession() throws {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playback, mode: .spokenAudio, options: [.allowAirPlay])
        try session.setActive(true)
        configureRemoteCommands()
        configureInterruptionObserver()
    }

    private func configureInterruptionObserver() {
        guard interruptionObserver == nil else { return }
        interruptionObserver = NotificationCenter.default.addObserver(
            forName: AVAudioSession.interruptionNotification,
            object: AVAudioSession.sharedInstance(),
            queue: .main
        ) { [weak self] notification in
            guard let rawType = notification.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
                  let type = AVAudioSession.InterruptionType(rawValue: rawType) else { return }
            let rawOptions = notification.userInfo?[AVAudioSessionInterruptionOptionKey] as? UInt ?? 0
            let systemAllowsResume = AVAudioSession.InterruptionOptions(rawValue: rawOptions).contains(.shouldResume)

            Task { @MainActor [weak self] in
                guard let self else { return }
                switch type {
                case .began:
                    self.interruptionState.interruptionBegan(isPlaying: self.isPlaying)
                    self.player?.pause()
                    self.isPlaying = false
                    self.updateNowPlaying()
                case .ended:
                    let shouldResume = self.interruptionState.interruptionEnded(systemAllowsResume: systemAllowsResume)
                    if shouldResume {
                        self.play()
                    } else {
                        self.isPlaying = false
                        self.updateNowPlaying()
                    }
                @unknown default:
                    self.interruptionState.cancelResume()
                    self.isPlaying = false
                    self.updateNowPlaying()
                }
            }
        }
    }

    private func addObservers(for item: AVPlayerItem) {
        timeObserver = player?.addPeriodicTimeObserver(
            forInterval: CMTime(seconds: 0.25, preferredTimescale: 600),
            queue: .main
        ) { [weak self] time in
            Task { @MainActor in
                guard let self else { return }
                self.currentTime = time.seconds.isFinite ? max(0, time.seconds) : 0
                self.duration = item.duration.seconds.isFinite ? max(0, item.duration.seconds) : 0
                self.updateNowPlaying()
            }
        }

        endObserver = NotificationCenter.default.addObserver(
            forName: .AVPlayerItemDidPlayToEndTime,
            object: item,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in self?.handlePlaybackEnded() }
        }
    }

    private func handlePlaybackEnded() {
        switch repeatMode {
        case .off:
            if playlistIndex + 1 < playlist.count {
                playlistIndex += 1
                loadTrack(playlist[playlistIndex])
                play()
            } else {
                isPlaying = false
            }
        case .track:
            seek(to: 0)
            play()
        case .ayah:
            seek(to: 0)
            play()
        }
        updateNowPlaying()
    }

    private func configureRemoteCommands() {
        guard !remoteCommandsConfigured else { return }
        remoteCommandsConfigured = true
        let center = MPRemoteCommandCenter.shared()
        center.playCommand.addTarget { [weak self] _ in
            Task { @MainActor in self?.play() }
            return .success
        }
        center.pauseCommand.addTarget { [weak self] _ in
            Task { @MainActor in self?.pause() }
            return .success
        }
        center.skipForwardCommand.addTarget { [weak self] _ in
            Task { @MainActor in self?.seek(to: (self?.currentTime ?? 0) + 15) }
            return .success
        }
        center.skipBackwardCommand.addTarget { [weak self] _ in
            Task { @MainActor in self?.seek(to: (self?.currentTime ?? 0) - 15) }
            return .success
        }
    }

    private func configureNowPlaying() {
        guard let track = currentTrack else { return }
        MPNowPlayingInfoCenter.default().nowPlayingInfo = [
            MPMediaItemPropertyTitle: track.surahTitle,
            MPMediaItemPropertyArtist: track.reciterName,
            MPMediaItemPropertyAlbumTitle: "DĀR NEXT Qurʾān",
            MPMediaItemPropertyPlaybackDuration: duration
        ]
    }

    private func updateNowPlaying() {
        guard var info = MPNowPlayingInfoCenter.default().nowPlayingInfo else { return }
        info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = currentTime
        info[MPNowPlayingInfoPropertyPlaybackRate] = isPlaying ? playbackRate : 0
        info[MPMediaItemPropertyPlaybackDuration] = duration
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }

    private func removeObservers() {
        if let timeObserver, let player { player.removeTimeObserver(timeObserver) }
        if let endObserver { NotificationCenter.default.removeObserver(endObserver) }
        timeObserver = nil
        endObserver = nil
    }
}
