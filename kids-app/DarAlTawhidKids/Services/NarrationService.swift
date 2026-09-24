import AVFoundation
import SwiftUI

@MainActor
final class NarrationService: NSObject, ObservableObject, AVSpeechSynthesizerDelegate, AVAudioPlayerDelegate {
    @Published private(set) var isPlaying = false
    @Published private(set) var isUsingFallbackVoice = false

    private let synthesizer = AVSpeechSynthesizer()
    private var audioPlayer: AVAudioPlayer?

    override init() {
        super.init()
        synthesizer.delegate = self
    }

    func play(story: KidsStory, ageBand: AgeBand) {
        stop()

        if let resource = story.audioResource(for: ageBand),
           let url = Bundle.main.url(forResource: resource, withExtension: "mp3", subdirectory: "Audio") {
            do {
                try AVAudioSession.sharedInstance().setCategory(.playback, mode: .spokenAudio, options: [.duckOthers])
                try AVAudioSession.sharedInstance().setActive(true)
                audioPlayer = try AVAudioPlayer(contentsOf: url)
                audioPlayer?.delegate = self
                audioPlayer?.prepareToPlay()
                audioPlayer?.play()
                isUsingFallbackVoice = false
                isPlaying = true
                return
            } catch {
                // Fällt kontrolliert auf die lokale iOS-Stimme zurück.
            }
        }

        let version = story.version(for: ageBand)
        let utterance = AVSpeechUtterance(string: version.narrationText)
        utterance.voice = preferredGermanVoice()
        utterance.rate = ageBand.narrationRate
        utterance.pitchMultiplier = 0.97
        utterance.preUtteranceDelay = 0.15
        utterance.postUtteranceDelay = 0.12

        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .spokenAudio, options: [.duckOthers])
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            // Die Sprachausgabe kann auch ohne explizite Aktivierung funktionieren.
        }

        isUsingFallbackVoice = true
        isPlaying = true
        synthesizer.speak(utterance)
    }

    func stop() {
        if synthesizer.isSpeaking || synthesizer.isPaused {
            synthesizer.stopSpeaking(at: .immediate)
        }
        audioPlayer?.stop()
        audioPlayer = nil
        isPlaying = false
    }

    private func preferredGermanVoice() -> AVSpeechSynthesisVoice? {
        let germanVoices = AVSpeechSynthesisVoice.speechVoices()
            .filter { $0.language.lowercased().hasPrefix("de") }

        return germanVoices.max { left, right in
            left.quality.rawValue < right.quality.rawValue
        } ?? AVSpeechSynthesisVoice(language: "de-DE")
    }

    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        isPlaying = false
    }

    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
        isPlaying = false
    }

    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        isPlaying = false
    }
}
