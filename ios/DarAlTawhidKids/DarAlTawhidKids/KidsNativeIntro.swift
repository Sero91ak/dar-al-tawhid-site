import SwiftUI
import UIKit
import AVFoundation

// KIDS_NATIVE_CLEAN_START_V2: visitor always runs the original full-screen app.
// Creator controls compile ONLY with KIDS_CREATOR_TEST and cannot leak into App Store.
// KIDS_NATIVE_PARALLEL_START_V3
// Keep the approved movie in front while the real homepage loads underneath.
// Never reveal a placeholder between the last video frame and the painted page.
struct KidsRootView: View {
    @State private var webHomeReady = false
    @State private var introCompleted = false
    @State private var showIntro = true
#if KIDS_CREATOR_TEST
    @State private var showCreatorPanel = false
#endif

    private var parallelStart: some View {
        ZStack {
            KidsWebAppView(onHomeReady: {
                webHomeReady = true
            })
            .ignoresSafeArea()

            if showIntro {
                KidsIntroMovieView(onFinished: {
                    introCompleted = true
                })
                .ignoresSafeArea()
                .allowsHitTesting(false)
                .transition(.opacity)
            }
        }
        .background(Color(red: 12.0 / 255, green: 38.0 / 255, blue: 54.0 / 255))
        .onChange(of: webHomeReady) { _ in revealReadyPage() }
        .onChange(of: introCompleted) { _ in revealReadyPage() }
    }

    private func revealReadyPage() {
        guard webHomeReady, introCompleted, showIntro else { return }
        // A short crossfade hides any difference in final-frame color.
        withAnimation(.easeOut(duration: 0.12)) {
            showIntro = false
        }
    }

#if KIDS_CREATOR_TEST
    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            parallelStart

            Button {
                showCreatorPanel = true
            } label: {
                Label("TEST", systemImage: "wrench.adjustable")
                    .font(.system(size: 14, weight: .heavy, design: .rounded))
                    .padding(.horizontal, 13)
                    .padding(.vertical, 10)
                    .foregroundStyle(Color(red: 0.08, green: 0.16, blue: 0.22))
                    .background(Color(red: 0.93, green: 0.81, blue: 0.59))
                    .clipShape(Capsule())
                    .overlay(Capsule().stroke(Color.white.opacity(0.6), lineWidth: 1))
                    .shadow(color: .black.opacity(0.35), radius: 9, y: 3)
            }
            .accessibilityLabel("KIDS Ersteller-Übersicht öffnen")
            .padding(.trailing, 13)
            .padding(.bottom, 102)
        }
        .sheet(isPresented: $showCreatorPanel) {
            KidsCreatorPanel { destination in
                showCreatorPanel = false
                DispatchQueue.main.async {
                    NotificationCenter.default.post(
                        name: Notification.Name("DarKidsCreatorNavigate"),
                        object: destination
                    )
                }
            }
            .presentationDetents([.medium, .large])
            .presentationDragIndicator(.visible)
        }
    }
#else
    var body: some View {
        parallelStart
    }
#endif
}

/// An AVPlayerLayer, not VideoPlayer: no controls, system overlays or extra taps.
/// The final video frame remains visible after playback until the web home
/// confirms it is ready. Asset is bundled once; no video network request.
private struct KidsIntroMovieView: UIViewRepresentable {
    let onFinished: () -> Void

    func makeUIView(context: Context) -> KidsIntroMovieLayer {
        let view = KidsIntroMovieLayer()
        view.onFinished = onFinished
        view.start()
        return view
    }

    func updateUIView(_ view: KidsIntroMovieLayer, context: Context) {
        view.onFinished = onFinished
    }
}

private final class KidsIntroMovieLayer: UIView {
    var onFinished: (() -> Void)?
    private var player: AVPlayer?
    private var endObserver: NSObjectProtocol?

    override static var layerClass: AnyClass { AVPlayerLayer.self }

    private var videoLayer: AVPlayerLayer {
        layer as! AVPlayerLayer
    }

    func start() {
        backgroundColor = UIColor(red: 12 / 255, green: 38 / 255, blue: 54 / 255, alpha: 1)
        videoLayer.videoGravity = .resizeAspectFill
        guard let url = Bundle.main.url(forResource: "intro-ios", withExtension: "mp4") else {
            // Never block the whole app when a development bundle omits the video.
            DispatchQueue.main.async { [weak self] in self?.onFinished?() }
            return
        }

        let movie = AVPlayer(url: url)
        movie.isMuted = true
        movie.actionAtItemEnd = .pause
        videoLayer.player = movie
        player = movie
        endObserver = NotificationCenter.default.addObserver(
            forName: .AVPlayerItemDidPlayToEndTime,
            object: movie.currentItem,
            queue: .main
        ) { [weak self] _ in
            self?.onFinished?()
        }
        movie.play()
    }

    deinit {
        if let endObserver { NotificationCenter.default.removeObserver(endObserver) }
        player?.pause()
    }
}

#if KIDS_CREATOR_TEST
private struct KidsCreatorPanel: View {
    let navigate: (String) -> Void

    private let gold = Color(red: 0.93, green: 0.81, blue: 0.59)
    private let night = Color(red: 0.05, green: 0.14, blue: 0.20)

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Eigene iOS-Test-App · getrennte Testdaten")
                        .font(.subheadline)
                        .foregroundStyle(Color.white.opacity(0.84))
                    Text("Hier prüfst du die komplette vorhandene KIDS-Oberfläche. Unterrichtssperren sind noch nicht zentral für den Ersteller freigegeben.")
                        .font(.footnote)
                        .foregroundStyle(Color.white.opacity(0.88))

                    button("Prüfzentrale · Jahresplan & alle Bereiche", "square.grid.2x2.fill", "console")
                    button("Startseite & Testprofile", "house.fill", "home")
                    button("Qurʾān", "book.closed.fill", "quran")
                    button("Hörbücher & Prophetengeschichten", "headphones", "stories")
                    button("Duʿāʾ", "heart.text.square.fill", "dua")
                    button("Elternbereich", "person.2.fill", "parents")
                    button("Akademie · 38 vorhandene Lektionen", "graduationcap.fill", "academy")

                    Divider().overlay(gold.opacity(0.4))
                    Text("Prüfen → Änderungen besprechen → nur nach deiner Freigabe veröffentlichen.")
                        .font(.footnote)
                        .foregroundStyle(gold)
                    Text("Noch offen: echte Ersteller-Freigaben für gesperrte Lektionen und unabhängiger Test-Build vor der Besucher-App. Kein automatisches Live-Publishing.")
                        .font(.caption)
                        .foregroundStyle(Color.white.opacity(0.70))
                }
                .padding(17)
            }
            .background(night)
            .navigationTitle("KIDS TEST")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(night, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
        }
        .tint(gold)
    }

    private func button(_ title: String, _ symbol: String, _ destination: String) -> some View {
        Button {
            navigate(destination)
        } label: {
            HStack(spacing: 11) {
                Image(systemName: symbol)
                    .frame(width: 23)
                    .foregroundStyle(gold)
                Text(title)
                    .multilineTextAlignment(.leading)
                    .foregroundStyle(.white)
                Spacer(minLength: 8)
                Image(systemName: "chevron.right")
                    .foregroundStyle(gold)
            }
            .padding(13)
            .frame(maxWidth: .infinity, minHeight: 49, alignment: .leading)
            .background(Color.white.opacity(0.07))
            .clipShape(RoundedRectangle(cornerRadius: 13))
            .overlay(RoundedRectangle(cornerRadius: 13).stroke(gold.opacity(0.35)))
        }
        .buttonStyle(.plain)
    }
}
#endif
