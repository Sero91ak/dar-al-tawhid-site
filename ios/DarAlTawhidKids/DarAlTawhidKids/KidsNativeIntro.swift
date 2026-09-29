import AVFoundation
import SwiftUI

final class KidsNativeIntroController: ObservableObject {
    @Published var isVisible = true

    private let voiceURL = URL(string: "https://dar-al-tawhid.de/kids/assets/kids-cinema/intro-voice-serhat-soft.m4a?v=87")!
    private var voicePlayer: AVPlayer?
    private var hideWork: DispatchWorkItem?
    private var endedObserver: NSObjectProtocol?
    private var didStart = false

    func start() {
        guard !didStart else { return }
        didStart = true
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.playback, mode: .spokenAudio, options: [])
        try? session.setActive(true)

        let player = AVPlayer(url: voiceURL)
        voicePlayer = player
        player.play()

        endedObserver = NotificationCenter.default.addObserver(
            forName: .AVPlayerItemDidPlayToEndTime,
            object: player.currentItem,
            queue: .main
        ) { [weak self] _ in
            self?.finish()
        }

        let work = DispatchWorkItem { [weak self] in
            self?.finish()
        }
        hideWork = work
        DispatchQueue.main.asyncAfter(deadline: .now() + 8.4, execute: work)
    }

    func finish() {
        guard isVisible else { return }
        hideWork?.cancel()
        voicePlayer?.pause()
        withAnimation(.easeInOut(duration: 0.55)) {
            isVisible = false
        }
        if let endedObserver {
            NotificationCenter.default.removeObserver(endedObserver)
        }
        endedObserver = nil
    }
}

struct KidsNativeIntroOverlay: View {
    @ObservedObject var controller: KidsNativeIntroController
    @State private var markIn = false
    @State private var sealIn = false
    @State private var glow = false
    @State private var drift = false

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(red: 0.07, green: 0.17, blue: 0.26),
                    Color(red: 0.04, green: 0.10, blue: 0.16),
                    Color(red: 0.02, green: 0.05, blue: 0.08)
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            RadialGradient(
                colors: [
                    Color(red: 0.89, green: 0.74, blue: 0.45).opacity(0.22),
                    Color.clear
                ],
                center: .center,
                startRadius: 20,
                endRadius: 280
            )
            .scaleEffect(glow ? 1.18 : 0.92)
            .opacity(glow ? 1 : 0.55)

            VStack(spacing: 28) {
                ZStack {
                    Circle()
                        .stroke(Color(red: 0.89, green: 0.74, blue: 0.45).opacity(0.28), lineWidth: 1)
                        .frame(width: 236, height: 236)
                        .scaleEffect(glow ? 1.08 : 0.96)
                    Image("KidsBrandMark")
                        .resizable()
                        .scaledToFit()
                        .frame(width: 168, height: 168)
                        .clipShape(RoundedRectangle(cornerRadius: 38, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 38, style: .continuous)
                                .stroke(Color(red: 0.95, green: 0.86, blue: 0.64).opacity(0.45), lineWidth: 1)
                        )
                        .shadow(color: Color(red: 0.89, green: 0.74, blue: 0.45).opacity(0.35), radius: 28, y: 10)
                        .scaleEffect(sealIn ? (drift ? 1.05 : 1.0) : 0.82)
                        .opacity(sealIn ? 1 : 0)
                }

                VStack(spacing: 8) {
                    Text("DĀR AL TAWḤĪD")
                        .font(.system(size: 15, weight: .semibold, design: .serif))
                        .tracking(4.4)
                        .foregroundColor(Color(red: 0.95, green: 0.89, blue: 0.75))
                    Text("Kids")
                        .font(.system(size: 42, weight: .bold, design: .rounded))
                        .tracking(3.2)
                        .foregroundColor(Color(red: 1, green: 0.91, blue: 0.72))
                }
                .opacity(markIn ? 1 : 0)
                .offset(y: markIn ? 0 : 18)
            }
        }
        .ignoresSafeArea()
        .onAppear {
            controller.start()
            withAnimation(.spring(response: 0.78, dampingFraction: 0.72)) {
                sealIn = true
                markIn = true
            }
            withAnimation(.easeInOut(duration: 2.8).repeatForever(autoreverses: true)) {
                glow = true
            }
            withAnimation(.easeInOut(duration: 7.6)) {
                drift = true
            }
        }
    }
}

struct KidsRootView: View {
    @StateObject private var intro = KidsNativeIntroController()

    var body: some View {
        ZStack {
            KidsWebAppView()
            if intro.isVisible {
                KidsNativeIntroOverlay(controller: intro)
                    .transition(.opacity)
                    .allowsHitTesting(false)
            }
        }
        .ignoresSafeArea()
        .background(Color(red: 12 / 255, green: 38 / 255, blue: 54 / 255))
    }
}
