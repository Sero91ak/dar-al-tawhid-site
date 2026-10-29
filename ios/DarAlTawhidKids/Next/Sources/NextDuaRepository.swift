import Foundation
import SwiftUI
import AVFoundation
import Observation

struct NextDuaDocument: Decodable {
    let items: [NextDuaItem]
}

struct NextDuaItem: Decodable, Identifiable {
    let itemId: String
    let canonicalId: String?
    let title: String
    let arabic: String
    let transliteration: String
    let meaning: String
    let source: String
    let verification: String
    let audioStatus: String?
    let directAudioReady: Bool?
    let audioGermanUrl: String?
    let audioArabicUrl: String?
    let audioArabicSlowUrl: String?

    var id: String { canonicalId ?? itemId }

    private enum CodingKeys: String, CodingKey {
        case itemId = "id"
        case canonicalId
        case title
        case arabic
        case transliteration
        case meaning
        case source
        case verification
        case audioStatus
        case directAudioReady
        case audioGermanUrl
        case audioArabicUrl
        case audioArabicSlowUrl
    }
}

struct NextDuaRepository {
    let bundle: Bundle

    init(bundle: Bundle = NextAppResources.bundle) {
        self.bundle = bundle
    }

    func loadDuas() throws -> [NextDuaItem] {
        guard let url = bundle.url(forResource: "dua-kids", withExtension: "json") else {
            throw NextContentError.missingResource("dua-kids.json")
        }
        do {
            let document = try JSONDecoder().decode(NextDuaDocument.self, from: Data(contentsOf: url))
            let verified = document.items.filter { $0.verification == "verified" }
            guard !verified.isEmpty, Set(verified.map(\.id)).count == verified.count else {
                throw NextContentError.noApprovedItems
            }
            return verified
        } catch let error as NextContentError {
            throw error
        } catch {
            throw NextContentError.invalidData
        }
    }
}

struct NextDuaLibraryView: View {
    let openWebContent: () -> Void
    @State private var items: [NextDuaItem] = []
    @State private var selectedIndex = 0
    @State private var errorMessage: String?
    @State private var audioService = NextAudioService()

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            if let errorMessage {
                Text(errorMessage)
                    .font(.subheadline)
                    .foregroundStyle(NextDesign.gold)
            } else if items.isEmpty {
                ProgressView("Duʿāʾ wird geladen …")
                    .tint(NextDesign.gold)
            } else {
                Picker("Duʿāʾ auswählen", selection: $selectedIndex) {
                    ForEach(Array(items.enumerated()), id: \.offset) { index, item in
                        Text(item.title).tag(index)
                    }
                }
                .accessibilityLabel("Duʿāʾ auswählen")

                let item = items[selectedIndex]
                VStack(alignment: .leading, spacing: 12) {
                    Text(item.arabic)
                        .font(.system(size: 30, weight: .regular, design: .serif))
                        .frame(maxWidth: .infinity, alignment: .trailing)
                        .environment(\.layoutDirection, .rightToLeft)
                        .foregroundStyle(NextDesign.cream)
                        .accessibilityLabel("Arabischer Text: \(item.arabic)")
                    Text(item.transliteration)
                        .font(.headline)
                        .foregroundStyle(NextDesign.gold)
                    Text(item.meaning)
                        .font(.body)
                        .foregroundStyle(NextDesign.cream.opacity(0.86))
                    Text(item.source)
                        .font(.caption)
                        .foregroundStyle(NextDesign.cream.opacity(0.62))
                    Label(
                        item.directAudioReady == true ? "Originalaudio im Manifest vorhanden" : "Audiozustand prüfen",
                        systemImage: item.directAudioReady == true ? "waveform" : "exclamationmark.triangle"
                    )
                    .font(.caption)
                        .foregroundStyle(item.directAudioReady == true ? NextDesign.petrol : NextDesign.gold)

                    HStack(spacing: 10) {
                        audioButton(title: "Deutsch", path: item.audioGermanUrl)
                        audioButton(title: "Arabisch", path: item.audioArabicUrl)
                        audioButton(title: "Langsam", path: item.audioArabicSlowUrl)
                    }
                    if let audioError = audioService.errorMessage {
                        Text(audioError)
                            .font(.caption)
                            .foregroundStyle(NextDesign.gold)
                            .accessibilityLabel("Audiofehler: \(audioError)")
                    }
                }
                .padding(16)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 18))

                NextActionCard(
                    title: "Bestehende Lernfunktionen öffnen",
                    detail: "Wort-, Langsam- und Mitsprechfunktionen bleiben bis zur Audio-Owner-Abnahme im Hybridbereich.",
                    symbol: "waveform.and.mic",
                    accent: NextDesign.gold,
                    action: openWebContent
                )
            }
        }
        .task { await loadDuas() }
        .onChange(of: selectedIndex) { _, _ in
            audioService.stop()
        }
        .onDisappear {
            audioService.stop()
        }
    }

    @ViewBuilder
    private func audioButton(title: String, path: String?) -> some View {
        if let path, !path.isEmpty {
            Button {
                if audioService.isPlaying {
                    audioService.stop()
                } else {
                    audioService.play(path: path)
                }
            } label: {
                Label(title, systemImage: audioService.isPlaying ? "stop.circle" : "play.circle")
                    .font(.caption.weight(.semibold))
            }
            .buttonStyle(.bordered)
            .tint(NextDesign.gold)
            .accessibilityLabel(audioService.isPlaying ? "Audio stoppen" : "\(title)-Audio abspielen")
        }
    }

    private func loadDuas() async {
        do {
            items = try NextDuaRepository().loadDuas()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

/// Native audio owner for resources explicitly declared by the verified KIDS manifest.
/// It deliberately has no speech synthesis or generated-audio fallback.
@Observable
final class NextAudioService {
    private(set) var isPlaying = false
    private(set) var errorMessage: String?

    @ObservationIgnored
    private var player: AVPlayer?
    @ObservationIgnored
    private var completionObserver: NSObjectProtocol?

    func play(path: String) {
        stop()
        errorMessage = nil
        guard let url = resolvedURL(path) else {
            errorMessage = "Die freigegebene Audioquelle ist ungültig oder fehlt."
            return
        }
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .spokenAudio)
            try AVAudioSession.sharedInstance().setActive(true)
        } catch let error {
            errorMessage = "Audio konnte nicht gestartet werden: \(error.localizedDescription)"
            return
        }
        let item = AVPlayerItem(url: url)
        completionObserver = NotificationCenter.default.addObserver(
            forName: .AVPlayerItemDidPlayToEndTime,
            object: item,
            queue: .main
        ) { [weak self] _ in
            self?.isPlaying = false
        }
        let nextPlayer = AVPlayer(playerItem: item)
        player = nextPlayer
        nextPlayer.play()
        isPlaying = true
    }

    func stop() {
        player?.pause()
        player = nil
        isPlaying = false
        if let completionObserver {
            NotificationCenter.default.removeObserver(completionObserver)
            self.completionObserver = nil
        }
    }

    private func resolvedURL(_ path: String) -> URL? {
        if let absolute = URL(string: path), absolute.scheme != nil {
            return absolute
        }
        return URL(string: path, relativeTo: KidsAppShell.launchURL)?.absoluteURL
    }
}
