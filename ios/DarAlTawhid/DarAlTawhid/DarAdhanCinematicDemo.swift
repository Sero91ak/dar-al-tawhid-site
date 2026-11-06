//
//  DarAdhanCinematicDemo.swift
//  DĀR AL TAWḤĪD — isolated, simulator-only cinematic acceptance demo.
//  No alarm scheduling, no push changes, no changes to the live web layout.
//  Source videos are NOT embedded here: import the five owned Runway MP4s
//  through the demo's Files picker after installing the simulator build.
//
#if DEBUG
import SwiftUI
import UIKit
import AVFoundation
import AVKit
import UniformTypeIdentifiers

enum DarCinematicPrayer: String, CaseIterable, Identifiable {
    case fajr, dhuhr, asr, maghrib, isha
    var id: String { rawValue }

    var latin: String {
        switch self {
        case .fajr: return "Faǧr"
        case .dhuhr: return "Ẓuhr"
        case .asr: return "ʿAṣr"
        case .maghrib: return "Maġrib"
        case .isha: return "ʿIšāʾ"
        }
    }

    var arabic: String {
        switch self {
        case .fajr: return "الفَجْر"
        case .dhuhr: return "الظُّهْر"
        case .asr: return "العَصْر"
        case .maghrib: return "المَغْرِب"
        case .isha: return "العِشَاء"
        }
    }

    var top: Color {
        switch self {
        case .fajr: return Color(red: 0.025, green: 0.053, blue: 0.16)
        case .dhuhr: return Color(red: 0.27, green: 0.23, blue: 0.15)
        case .asr: return Color(red: 0.19, green: 0.12, blue: 0.085)
        case .maghrib: return Color(red: 0.22, green: 0.07, blue: 0.09)
        case .isha: return Color(red: 0.016, green: 0.037, blue: 0.085)
        }
    }

    var bottom: Color {
        switch self {
        case .fajr: return Color(red: 0.12, green: 0.13, blue: 0.24)
        case .dhuhr: return Color(red: 0.50, green: 0.36, blue: 0.20)
        case .asr: return Color(red: 0.46, green: 0.28, blue: 0.11)
        case .maghrib: return Color(red: 0.42, green: 0.17, blue: 0.09)
        case .isha: return Color(red: 0.04, green: 0.08, blue: 0.13)
        }
    }

    var localName: String { "dar-adhan-" + rawValue }
}

// All imported movie assets remain in the Simulator app container.
// This store never writes to the repository, Photos, web server or user documents.
@MainActor
final class DarCinematicMediaStore: ObservableObject {
    @Published private(set) var version = 0

    private var directory: URL {
        let root = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        return root.appendingPathComponent("DarAdhanCinematic", isDirectory: true)
    }

    func movie(for prayer: DarCinematicPrayer) -> URL? {
        // An explicitly imported movie can override the bundled original.
        let local = directory.appendingPathComponent(prayer.localName + ".mp4")
        if FileManager.default.fileExists(atPath: local.path) { return local }
        // Both iOS visitor app (DEBUG only) and standalone QA app bundle the
        // exact same CinematicMedia folder from ios/DarAlTawhid/Shared/.
        return Bundle.main.url(
            forResource: prayer.localName,
            withExtension: "mp4",
            subdirectory: "CinematicMedia"
        ) ?? Bundle.main.url(forResource: prayer.localName, withExtension: "mp4")
    }

    func importMovie(_ source: URL, for prayer: DarCinematicPrayer) throws {
        let allowed = ["mp4", "mov", "m4v"]
        guard allowed.contains(source.pathExtension.lowercased()) else {
            throw DarCinematicImportError.invalidFormat
        }
        let scoped = source.startAccessingSecurityScopedResource()
        defer { if scoped { source.stopAccessingSecurityScopedResource() } }
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        let destination = directory.appendingPathComponent(prayer.localName + ".mp4")
        let temp = directory.appendingPathComponent(UUID().uuidString + "." + source.pathExtension)
        defer { try? FileManager.default.removeItem(at: temp) }
        try FileManager.default.copyItem(at: source, to: temp)
        let asset = AVURLAsset(url: temp)
        guard !asset.tracks(withMediaType: .video).isEmpty else {
            throw DarCinematicImportError.invalidFormat
        }
        if FileManager.default.fileExists(atPath: destination.path) {
            try FileManager.default.removeItem(at: destination)
        }
        try FileManager.default.moveItem(at: temp, to: destination)
        version += 1
    }
}

enum DarCinematicImportError: LocalizedError {
    case invalidFormat
    var errorDescription: String? {
        "Bitte eine gültige MP4-, M4V- oder MOV-Videodatei auswählen."
    }
}

// Reuses AVPlayerLooper; the video track is always muted.
// This engine is independent from the audio engine and the app's push scheduler.
private final class DarCinematicLoopHost: UIView {
    private var queue: AVQueuePlayer?
    private var looper: AVPlayerLooper?
    private var videoLayer: AVPlayerLayer?
    private var sourceURL: URL?

    func configure(url: URL?, active: Bool, gravity: AVLayerVideoGravity) {
        if sourceURL != url {
            queue?.pause()
            videoLayer?.removeFromSuperlayer()
            videoLayer = nil
            looper = nil
            queue = nil
            sourceURL = url

            if let url {
                let player = AVQueuePlayer()
                player.isMuted = true
                player.actionAtItemEnd = .none
                let looping = AVPlayerLooper(player: player, templateItem: AVPlayerItem(url: url))
                let surface = AVPlayerLayer(player: player)
                surface.videoGravity = gravity
                layer.addSublayer(surface)
                queue = player
                looper = looping
                videoLayer = surface
            }
        }
        videoLayer?.videoGravity = gravity
        if active { queue?.play() } else { queue?.pause() }
        setNeedsLayout()
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        videoLayer?.frame = bounds
    }

    func stop() { queue?.pause() }
}

private struct DarCinematicLoopSurface: UIViewRepresentable {
    let url: URL?
    let active: Bool
    let gravity: AVLayerVideoGravity

    func makeUIView(context: Context) -> DarCinematicLoopHost {
        let view = DarCinematicLoopHost()
        view.configure(url: url, active: active, gravity: gravity)
        return view
    }

    func updateUIView(_ view: DarCinematicLoopHost, context: Context) {
        view.configure(url: url, active: active, gravity: gravity)
    }

    static func dismantleUIView(_ view: DarCinematicLoopHost, coordinator: ()) {
        view.stop()
    }
}

// Simulator playback is user-initiated and does not claim to wake a killed app.
// Real Adhan recordings come from the project's existing public audio catalog.
@MainActor
private final class DarCinematicAudioPreview: ObservableObject {
    @Published var isPlaying = false
    @Published var errorText: String?
    private var player: AVPlayer?
    private var finishObserver: NSObjectProtocol?

    func toggle(prayer: DarCinematicPrayer) {
        if isPlaying { stop(); return }
        let file = prayer == .fajr
            ? "Adhan_Fajr_Al_Haram_Al_Maki_%28%D8%A3%D8%B0%D8%A7%D9%86_%D8%A7%D9%84%D9%81%D8%AC%D8%B1_%D8%A7%D9%84%D8%AD%D8%B1%D9%85_%D8%A7%D9%84%D9%85%D9%83%D9%8A%29.mp3"
            : "Mishary_Al_Afasy_-_HQ_%28%D9%85%D8%B4%D8%A7%D8%B1%D9%8A_%D8%A7%D9%84%D8%B9%D9%81%D8%A7%D8%B3%D9%8A%29.mp3"
        guard let url = URL(string: "https://dar-al-tawhid.de/adhan/" + file) else { return }
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
            try AVAudioSession.sharedInstance().setActive(true)
            let audio = AVPlayer(url: url)
            player = audio
            errorText = nil
            if let item = audio.currentItem {
                finishObserver = NotificationCenter.default.addObserver(
                    forName: .AVPlayerItemDidPlayToEndTime,
                    object: item, queue: .main
                ) { [weak self] _ in
                    Task { @MainActor [weak self] in self?.stop() }
                }
            }
            audio.play()
            isPlaying = true
        } catch {
            errorText = "Audio konnte nicht gestartet werden: " + error.localizedDescription
        }
    }

    func stop() {
        player?.pause()
        player = nil
        if let finishObserver {
            NotificationCenter.default.removeObserver(finishObserver)
            self.finishObserver = nil
        }
        isPlaying = false
    }
}

struct DarAdhanCinematicDemo: View {
    let onClose: () -> Void

    @State private var prayer: DarCinematicPrayer = .fajr
    @State private var showFilePicker = false
    @State private var status: String?
    @StateObject private var media = DarCinematicMediaStore()
    @StateObject private var audio = DarCinematicAudioPreview()
    @Environment(\.scenePhase) private var scenePhase
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private let gold = Color(red: 0.86, green: 0.72, blue: 0.46)
    private let cream = Color(red: 0.975, green: 0.965, blue: 0.93)

    var body: some View {
        GeometryReader { geo in
            let wide = geo.size.width > geo.size.height && geo.size.width >= 650
            let movie = media.movie(for: prayer)
            let playingVideo = movie != nil && scenePhase == .active && !reduceMotion
            ZStack {
                LinearGradient(colors: [prayer.top, prayer.bottom, prayer.top],
                               startPoint: .topLeading, endPoint: .bottomTrailing)
                    .ignoresSafeArea()

                if let movie {
                    DarCinematicLoopSurface(url: movie, active: playingVideo,
                                             gravity: wide ? .resizeAspect : .resizeAspectFill)
                        .id(prayer.rawValue + String(media.version))
                        .ignoresSafeArea()
                        .accessibilityHidden(true)
                } else {
                    RadialGradient(colors: [gold.opacity(0.30), prayer.bottom.opacity(0.23), .clear],
                                   center: UnitPoint(x: 0.67, y: 0.75),
                                   startRadius: 1, endRadius: geo.size.width * 0.85)
                        .ignoresSafeArea()
                }

                LinearGradient(
                    stops: [.init(color: .black.opacity(0.64), location: 0),
                            .init(color: .black.opacity(0.25), location: 0.30),
                            .init(color: .black.opacity(0.48), location: 0.70),
                            .init(color: .black.opacity(0.86), location: 1)],
                    startPoint: .top, endPoint: .bottom
                ).ignoresSafeArea()

                VStack(spacing: 0) {
                    HStack {
                        Text("DĀR AL TAWḤĪD")
                            .font(.system(size: 12, weight: .semibold, design: .serif))
                            .tracking(2.4)
                            .foregroundStyle(gold)
                        Spacer(minLength: 10)
                        Button(action: { audio.stop(); onClose() }) {
                            Image(systemName: "xmark")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundStyle(cream)
                                .frame(width: 44, height: 44)
                                .background(.black.opacity(0.36), in: Circle())
                        }
                        .accessibilityLabel("Cinematic-Vorschau schließen")
                    }

                    Spacer(minLength: 10)

                    if wide {
                        HStack(alignment: .center, spacing: 30) {
                            prayerText(width: geo.size.width * 0.47)
                                .frame(maxWidth: .infinity, alignment: .leading)
                            controls(isWide: true, hasVideo: movie != nil)
                                .frame(maxWidth: .infinity)
                        }
                    } else {
                        prayerText(width: geo.size.width - 44)
                        Spacer(minLength: 22)
                        controls(isWide: false, hasVideo: movie != nil)
                    }

                    Spacer(minLength: 12)

                    HStack {
                        Text("SIMULATOR · TESTMODUS")
                            .font(.system(size: 9, weight: .medium))
                            .tracking(1.1)
                            .foregroundStyle(cream.opacity(0.58))
                        Spacer()
                        Text(movie == nil ? "Noch kein Video importiert" : "Originalvideo · Endlosschleife")
                            .font(.system(size: 10))
                            .foregroundStyle(gold.opacity(0.90))
                    }
                }
                .padding(.horizontal, wide ? 42 : 22)
                .padding(.top, 10)
                .padding(.bottom, 10)
                .frame(maxWidth: 1100)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .preferredColorScheme(.dark)
        .fileImporter(isPresented: $showFilePicker, allowedContentTypes: [.movie], allowsMultipleSelection: false) { result in
            switch result {
            case .success(let urls):
                guard let url = urls.first else { return }
                do {
                    try media.importMovie(url, for: prayer)
                    status = "Video für " + prayer.latin + " erfolgreich importiert."
                } catch {
                    status = error.localizedDescription
                }
            case .failure(let error):
                status = error.localizedDescription
            }
        }
        .onChange(of: prayer) { _ in
            audio.stop()
            status = nil
        }
        .onDisappear { audio.stop() }
    }

    private func prayerText(width: CGFloat) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("حَانَ وَقْتُ الصَّلَاةِ")
                .font(.system(size: min(20, max(15, width * 0.045)), weight: .regular))
                .foregroundStyle(gold)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
            Text(prayer.arabic)
                .font(.system(size: min(66, max(33, width * 0.135)), weight: .medium))
                .foregroundStyle(cream)
                .lineLimit(1)
                .minimumScaleFactor(0.65)
                .shadow(color: .black.opacity(0.7), radius: 8)
            Text(prayer.latin)
                .font(.system(size: min(34, max(22, width * 0.074)), weight: .semibold, design: .serif))
                .foregroundStyle(cream)
            Rectangle()
                .fill(gold.opacity(0.72))
                .frame(width: 62, height: 1)
                .padding(.vertical, 5)
            Text("Die Gebetszeit ist eingetreten.")
                .font(.system(size: min(19, max(15, width * 0.043)), weight: .medium))
                .foregroundStyle(cream)
                .fixedSize(horizontal: false, vertical: true)
            Text("Der Gebetsruf erinnert an das Gebet.")
                .font(.system(size: min(15, max(12, width * 0.033))))
                .foregroundStyle(cream.opacity(0.8))
                .fixedSize(horizontal: false, vertical: true)
        }
        .accessibilityElement(children: .combine)
    }

    private func controls(isWide: Bool, hasVideo: Bool) -> some View {
        VStack(spacing: 13) {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(DarCinematicPrayer.allCases) { item in
                        Button(item.latin) { prayer = item }
                            .font(.system(size: 13, weight: prayer == item ? .semibold : .regular))
                            .padding(.horizontal, 13)
                            .padding(.vertical, 10)
                            .background(prayer == item ? gold.opacity(0.22) : .black.opacity(0.27),
                                        in: Capsule())
                            .overlay(Capsule().stroke(prayer == item ? gold : cream.opacity(0.18), lineWidth: 1))
                            .foregroundStyle(cream)
                    }
                }
            }
            .accessibilityLabel("Gebetszeit auswählen")

            HStack(spacing: 10) {
                Button {
                    audio.toggle(prayer: prayer)
                } label: {
                    Label(audio.isPlaying ? "Adhān stoppen" : "Adhān anhören",
                          systemImage: audio.isPlaying ? "stop.fill" : "play.fill")
                        .font(.system(size: 13, weight: .semibold))
                        .frame(maxWidth: .infinity, minHeight: 42)
                }
                .buttonStyle(.plain)
                .foregroundStyle(cream)
                .background(gold.opacity(0.24), in: RoundedRectangle(cornerRadius: 11))
                .overlay(RoundedRectangle(cornerRadius: 11).stroke(gold.opacity(0.7), lineWidth: 1))

                Button { showFilePicker = true } label: {
                    Label(hasVideo ? "Video ersetzen" : "Video importieren", systemImage: "square.and.arrow.down")
                        .font(.system(size: 13, weight: .semibold))
                        .frame(maxWidth: .infinity, minHeight: 42)
                }
                .buttonStyle(.plain)
                .foregroundStyle(cream)
                .background(.black.opacity(0.35), in: RoundedRectangle(cornerRadius: 11))
                .overlay(RoundedRectangle(cornerRadius: 11).stroke(cream.opacity(0.24), lineWidth: 1))
            }

            if let message = status ?? audio.errorText {
                Text(message)
                    .font(.system(size: 12))
                    .foregroundStyle(cream.opacity(0.86))
                    .multilineTextAlignment(.center)
            }
            if !hasVideo {
                Text("Für die Originalanimation die passende Runway-MP4-Datei importieren.")
                    .font(.system(size: 12))
                    .foregroundStyle(cream.opacity(0.7))
                    .multilineTextAlignment(.center)
            }
        }
        .frame(maxWidth: isWide ? 460 : 520)
    }
}
#endif
