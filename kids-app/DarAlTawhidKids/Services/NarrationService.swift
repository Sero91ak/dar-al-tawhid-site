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

    func play(story: KidsStory) {
        stop()

        if let resource = story.audioResource,
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
                // Entwicklungs-Fallback unten.
            }
        }

        let preparedText = PronunciationLexicon.shared.prepareForNarration(story.narrationText)
        let utterance = AVSpeechUtterance(string: preparedText)
        utterance.voice = AVSpeechSynthesisVoice(language: "de-DE")
        utterance.rate = 0.43
        utterance.pitchMultiplier = 0.94
        utterance.preUtteranceDelay = 0.2
        utterance.postUtteranceDelay = 0.15
        isUsingFallbackVoice = true
        isPlaying = true
        synthesizer.speak(utterance)
    }

    func speakFeedback(_ text: String, ageBand: AgeBand) {
        stop()
        let preparedText = PronunciationLexicon.shared.prepareForNarration(text)
        let utterance = AVSpeechUtterance(string: preparedText)
        utterance.voice = AVSpeechSynthesisVoice(language: "de-DE")
        utterance.rate = ageBand == .age4to5 ? 0.40 : 0.44
        utterance.pitchMultiplier = 0.96
        utterance.preUtteranceDelay = 0.08
        utterance.postUtteranceDelay = 0.08
        isUsingFallbackVoice = true
        isPlaying = true
        synthesizer.speak(utterance)
    }

    func preparedNarrationText(_ text: String) -> String {
        PronunciationLexicon.shared.prepareForNarration(text)
    }

    func stop() {
        if synthesizer.isSpeaking {
            synthesizer.stopSpeaking(at: .immediate)
        }
        audioPlayer?.stop()
        audioPlayer = nil
        isPlaying = false
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
