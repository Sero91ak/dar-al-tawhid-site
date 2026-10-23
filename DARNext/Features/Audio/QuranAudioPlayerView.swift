import SwiftUI

struct QuranMiniPlayer: View {
    @Bindable var engine: QuranAudioEngine
    @State private var showingFullPlayer = false

    var body: some View {
        Button { showingFullPlayer = true } label: {
            HStack(spacing: 12) {
                Image(systemName: engine.isPlaying ? "waveform" : "pause.fill")
                    .foregroundStyle(.white)
                VStack(alignment: .leading, spacing: 2) {
                    Text(engine.currentTrack?.surahTitle ?? "Qurʾān")
                        .font(.subheadline.weight(.semibold))
                        .lineLimit(1)
                    Text(engine.currentTrack?.reciterName ?? "Rezitation")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Button {
                    engine.isPlaying ? engine.pause() : engine.play()
                } label: {
                    Image(systemName: engine.isPlaying ? "pause.fill" : "play.fill")
                        .frame(width: 36, height: 36)
                }
                .buttonStyle(.borderedProminent)
                .tint(.white.opacity(0.18))
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(.ultraThinMaterial, in: Capsule())
            .overlay(Capsule().stroke(.white.opacity(0.18)))
        }
        .buttonStyle(.plain)
        .sheet(isPresented: $showingFullPlayer) {
            QuranFullPlayer(engine: engine)
        }
    }
}

struct QuranFullPlayer: View {
    @Bindable var engine: QuranAudioEngine
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Spacer()
                Image(systemName: "waveform.circle.fill")
                    .font(.system(size: 88))
                    .foregroundStyle(.tint)
                Text(engine.currentTrack?.surahTitle ?? "Qurʾān")
                    .font(.system(.largeTitle, design: .serif).weight(.bold))
                Text(engine.currentTrack?.reciterName ?? "Rezitation")
                    .foregroundStyle(.secondary)

                VStack(spacing: 8) {
                    Slider(value: Binding(
                        get: { engine.currentTime },
                        set: { engine.seek(to: $0) }
                    ), in: 0...max(engine.duration, 1))
                    HStack {
                        Text(format(engine.currentTime))
                        Spacer()
                        Text(format(engine.duration))
                    }
                    .font(.caption.monospacedDigit())
                    .foregroundStyle(.secondary)
                }

                HStack(spacing: 28) {
                    Button { engine.previousAyah() } label: { Image(systemName: "backward.end.fill") }
                    Button { engine.isPlaying ? engine.pause() : engine.play() } label: {
                        Image(systemName: engine.isPlaying ? "pause.circle.fill" : "play.circle.fill")
                            .font(.system(size: 58))
                    }
                    Button { engine.nextAyah() } label: { Image(systemName: "forward.end.fill") }
                }
                .buttonStyle(.plain)

                HStack {
                    if !engine.availableReciters.isEmpty {
                        Picker("Rezitator", selection: Binding(
                            get: { engine.selectedReciterID },
                            set: { value in Task { await engine.selectReciter(value) } }
                        )) {
                            ForEach(engine.availableReciters) { reciter in
                                Text(reciter.englishName).tag(reciter.id)
                            }
                        }
                        .pickerStyle(.menu)
                    }
                    Picker("Geschwindigkeit", selection: $engine.playbackRate) {
                        Text("0,75×").tag(0.75)
                        Text("1×").tag(1.0)
                        Text("1,25×").tag(1.25)
                        Text("1,5×").tag(1.5)
                    }
                    .pickerStyle(.menu)
                    Picker("Wiederholung", selection: $engine.repeatMode) {
                        Text("Aus").tag(QuranAudioRepeatMode.off)
                        Text("Āyah").tag(QuranAudioRepeatMode.ayah)
                        Text("Track").tag(QuranAudioRepeatMode.track)
                    }
                    .pickerStyle(.menu)
                }
                Spacer()
            }
            .padding(24)
            .navigationTitle("Audio")
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Fertig") { dismiss() } } }
            .task { await engine.loadReciters() }
        }
    }

    private func format(_ time: TimeInterval) -> String {
        guard time.isFinite else { return "0:00" }
        return String(format: "%d:%02d", Int(time) / 60, Int(time) % 60)
    }
}
