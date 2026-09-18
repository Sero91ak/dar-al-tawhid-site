import SwiftUI
import AVFoundation

@MainActor
struct AppleTVAnimatedBackgroundView: View {
    @State private var videoURL: URL?
    @State private var loadFailed = false

    var body: some View {
        ZStack {
            Color.black

            if let videoURL {
                LoopingBackgroundPlayer(url: videoURL)
                    .ignoresSafeArea()
                    .transition(.opacity)
            }
        }
        .task {
            do {
                videoURL = try await AppleTVBackgroundService.shared.selectedLocalVideoURL()
            } catch {
                loadFailed = true
            }
        }
    }
}

private struct LoopingBackgroundPlayer: UIViewRepresentable {
    let url: URL

    func makeUIView(context: Context) -> PlayerLayerView {
        let view = PlayerLayerView()
        view.configure(url: url)
        return view
    }

    func updateUIView(_ uiView: PlayerLayerView, context: Context) {
        uiView.configure(url: url)
    }

    static func dismantleUIView(_ uiView: PlayerLayerView, coordinator: ()) {
        uiView.stop()
    }
}

private final class PlayerLayerView: UIView {
    private let player = AVQueuePlayer()
    private var looper: AVPlayerLooper?
    private var configuredURL: URL?

    override class var layerClass: AnyClass { AVPlayerLayer.self }

    private var playerLayer: AVPlayerLayer {
        layer as! AVPlayerLayer
    }

    override init(frame: CGRect) {
        super.init(frame: frame)
        player.isMuted = true
        player.actionAtItemEnd = .none
        playerLayer.player = player
        playerLayer.videoGravity = .resizeAspectFill
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    func configure(url: URL) {
        guard configuredURL != url else { return }
        configuredURL = url

        player.removeAllItems()
        let item = AVPlayerItem(url: url)
        looper = AVPlayerLooper(player: player, templateItem: item)
        player.play()
    }

    func stop() {
        player.pause()
        looper?.disableLooping()
        looper = nil
        player.removeAllItems()
    }
}
