import SwiftUI

struct StoryPlayerView: View {
    let story: KidsStory

    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var progress: ProgressStore
    @StateObject private var narration = NarrationService()

    var body: some View {
        ZStack {
            KidsAmbientBackground()

            VStack(spacing: 0) {
                HStack {
                    Button {
                        narration.stop()
                        dismiss()
                    } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundStyle(KidsTheme.cream)
                            .frame(width: 44, height: 44)
                            .background(Circle().fill(Color.white.opacity(0.08)))
                    }

                    Spacer()

                    Text(story.durationLabel)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.white.opacity(0.55))
                }
                .padding(.horizontal, 18)
                .padding(.top, 10)

                Spacer()

                VStack(spacing: 18) {
                    ZStack {
                        Circle()
                            .fill(KidsTheme.gold.opacity(0.10))
                            .frame(width: 180, height: 180)
                        Circle()
                            .stroke(KidsTheme.gold.opacity(0.22), lineWidth: 1)
                            .frame(width: 146, height: 146)
                        Image(systemName: narration.isPlaying ? "waveform" : "headphones")
                            .font(.system(size: 48, weight: .light))
                            .foregroundStyle(KidsTheme.gold)
                            .symbolEffect(.variableColor.iterative, options: .repeating, isActive: narration.isPlaying)
                    }

                    VStack(spacing: 7) {
                        Text(story.title)
                            .font(.system(size: 30, weight: .bold, design: .rounded))
                            .foregroundStyle(KidsTheme.cream)
                            .multilineTextAlignment(.center)

                        Text(story.category)
                            .font(.system(size: 14, weight: .bold, design: .rounded))
                            .foregroundStyle(KidsTheme.sage)
                    }

                    if narration.isUsingFallbackVoice {
                        Text("Entwicklungsstimme · später durch die feste KI-Erzählstimme ersetzt")
                            .font(.caption.weight(.medium))
                            .foregroundStyle(.white.opacity(0.48))
                            .multilineTextAlignment(.center)
                    }
                }
                .padding(.horizontal, 26)

                Spacer()

                VStack(spacing: 12) {
                    Button {
                        if narration.isPlaying {
                            narration.stop()
                        } else {
                            narration.play(story: story)
                        }
                    } label: {
                        HStack(spacing: 10) {
                            Image(systemName: narration.isPlaying ? "stop.fill" : "play.fill")
                            Text(narration.isPlaying ? "Stopp" : "Geschichte hören")
                                .fontWeight(.bold)
                        }
                        .foregroundStyle(KidsTheme.deepNight)
                        .frame(maxWidth: .infinity)
                        .frame(height: 58)
                        .background(
                            RoundedRectangle(cornerRadius: 22, style: .continuous)
                                .fill(KidsTheme.gold)
                        )
                    }

                    Button {
                        progress.markStoryComplete(story)
                    } label: {
                        Label(
                            progress.isCompleted(story) ? "Schon geschafft" : "Als gehört markieren",
                            systemImage: progress.isCompleted(story) ? "checkmark.circle.fill" : "circle"
                        )
                        .font(.system(size: 15, weight: .bold, design: .rounded))
                        .foregroundStyle(KidsTheme.cream.opacity(0.78))
                    }
                    .disabled(progress.isCompleted(story))
                }
                .padding(18)
                .padding(.bottom, 8)
            }
        }
        .interactiveDismissDisabled(narration.isPlaying)
        .onDisappear {
            narration.stop()
        }
    }
}
