import AVFoundation
import SwiftUI
import UIKit

extension Notification.Name {
    static let kidsIntroDidFinish = Notification.Name("KidsIntroDidFinish")
}

final class KidsNativeIntroController: ObservableObject {
    @Published var isVisible = true

    let player: AVPlayer
    private var hideWork: DispatchWorkItem?
    private var endedObserver: NSObjectProtocol?
    private var timeObserver: Any?
    private var didStart = false

    init() {
        if let bundled = Bundle.main.url(forResource: "intro-ios", withExtension: "mp4") {
            player = AVPlayer(url: bundled)
        } else {
            player = AVPlayer(url: URL(string: "https://dar-al-tawhid.de/kids/assets/kids-cinema/intro-ios.mp4?v=1")!)
        }
        player.isMuted = false
        player.actionAtItemEnd = .pause
    }

    func start() {
        guard !didStart else { return }
        didStart = true
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.playback, mode: .moviePlayback, options: [])
        try? session.setActive(true)
        player.play()

        endedObserver = NotificationCenter.default.addObserver(
            forName: .AVPlayerItemDidPlayToEndTime,
            object: nil,
            queue: .main
        ) { [weak self] note in
            guard let self else { return }
            if note.object as? AVPlayerItem === self.player.currentItem || self.player.currentItem == nil {
                self.finish()
            }
        }

        timeObserver = player.addPeriodicTimeObserver(
            forInterval: CMTime(seconds: 0.25, preferredTimescale: 600),
            queue: .main
        ) { [weak self] time in
            guard let self, self.isVisible else { return }
            guard let item = self.player.currentItem else { return }
            let duration = item.duration.seconds
            let current = time.seconds
            if duration.isFinite, duration > 0, current >= duration - 0.35 {
                self.finish()
            }
        }

        let work = DispatchWorkItem { [weak self] in
            self?.finish()
        }
        hideWork = work
        DispatchQueue.main.asyncAfter(deadline: .now() + 14, execute: work)
    }

    func finish() {
        guard isVisible else { return }
        hideWork?.cancel()
        if let timeObserver {
            player.removeTimeObserver(timeObserver)
            self.timeObserver = nil
        }
        player.pause()
        withAnimation(.easeInOut(duration: 0.28)) {
            isVisible = false
        }
        if let endedObserver {
            NotificationCenter.default.removeObserver(endedObserver)
        }
        endedObserver = nil
        NotificationCenter.default.post(name: .kidsIntroDidFinish, object: nil)
    }
}

private struct KidsIntroPlayerView: UIViewRepresentable {
    let player: AVPlayer

    func makeUIView(context: Context) -> PlayerView {
        let view = PlayerView()
        view.playerLayer.player = player
        view.playerLayer.videoGravity = .resizeAspectFill
        return view
    }

    func updateUIView(_ uiView: PlayerView, context: Context) {
        uiView.playerLayer.player = player
    }

    final class PlayerView: UIView {
        override class var layerClass: AnyClass { AVPlayerLayer.self }
        var playerLayer: AVPlayerLayer { layer as! AVPlayerLayer }
    }
}

struct KidsNativeIntroOverlay: View {
    @ObservedObject var controller: KidsNativeIntroController

    var body: some View {
        ZStack {
            Color(red: 0.03, green: 0.07, blue: 0.11)
            KidsIntroPlayerView(player: controller.player)
                .ignoresSafeArea()
        }
        .ignoresSafeArea()
        .onAppear {
            controller.start()
        }
        .onTapGesture {
            controller.finish()
        }
        .accessibilityAddTraits(.isButton)
        .accessibilityLabel("Intro überspringen")
    }
}

struct KidsRootView: View {
    @StateObject private var intro = KidsNativeIntroController()

    var body: some View {
        ZStack {
            KidsWebAppView()
                .ignoresSafeArea()
            if intro.isVisible {
                KidsNativeIntroOverlay(controller: intro)
                    .transition(.opacity)
                    .zIndex(2)
            }
        }
        .background(Color(red: 12 / 255, green: 38 / 255, blue: 54 / 255))
    }
}
