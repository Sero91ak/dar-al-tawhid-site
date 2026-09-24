import SwiftUI

struct StoryPlayerView: View {
    let story: KidsStory

    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var progress: ProgressStore
    @StateObject private var narration = NarrationService()

    private var version: KidsStoryVersion {
        story.version(for: appState.ageBand)
    }

    var body: some View {
        ZStack {
            KidsAmbientBackground()

            ScrollView {
                VStack(spacing: 18) {
                    hero
                    audioCard

                    if appState.ageBand.showsStoryReading {
                        readingCard
                    }

                    if appState.ageBand.showsStorySources {
                        sourcesCard
                    }

                    completionButton
                }
                .padding(.horizontal, 18)
                .padding(.top, 10)
                .padding(.bottom, 34)
            }
            .scrollIndicators(.hidden)
        }
        .interactiveDismissDisabled(narration.isPlaying)
        .onDisappear {
            narration.stop()
        }
    }

    private var hero: some View {
        ZStack(alignment: .topLeading) {
            Image(story.coverAsset)
                .resizable()
                .scaledToFill()
                .frame(maxWidth: .infinity)
                .frame(height: appState.ageBand == .age4to5 ? 340 : 300)
                .clipped()

            LinearGradient(
                colors: [.black.opacity(0.08), .clear, KidsTheme.deepNight.opacity(0.95)],
                startPoint: .top,
                endPoint: .bottom
            )

            Button {
                narration.stop()
                dismiss()
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(KidsTheme.cream)
                    .frame(width: 44, height: 44)
                    .background(Circle().fill(Color.black.opacity(0.34)))
            }
            .padding(12)

            VStack(alignment: .leading, spacing: 7) {
                Text(story.category.uppercased())
                    .font(.caption2.weight(.heavy))
                    .tracking(1.1)
                    .foregroundStyle(KidsTheme.gold)

                Text(story.title)
                    .font(.system(size: appState.ageBand == .age4to5 ? 34 : 31, weight: .bold, design: .rounded))
                    .foregroundStyle(KidsTheme.cream)

                HStack(spacing: 7) {
                    Text(version.durationLabel)
                    Text("·")
                    Text("(appState.ageBand.rawValue) Jahre")
                    Text("·")
                    Text(appState.ageBand.storyModeLabel)
                }
                .font(.caption.weight(.semibold))
                .foregroundStyle(.white.opacity(0.68))
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomLeading)
            .padding(18)
        }
        .clipShape(RoundedRectangle(cornerRadius: 30, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 30, style: .continuous)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
    }

    private var audioCard: some View {
        KidsCard {
            VStack(spacing: 14) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("HÖRGESCHICHTE")
                            .font(.caption2.weight(.heavy))
                            .tracking(1.1)
                            .foregroundStyle(KidsTheme.gold)
                        Text(appState.ageBand == .age4to5 ? "Einfach antippen und zuhören." : "Erst hören – danach kannst du lesen.")
                            .font(.system(size: 14, weight: .medium, design: .rounded))
                            .foregroundStyle(.white.opacity(0.62))
                    }
                    Spacer()
                    Image(systemName: narration.isPlaying ? "waveform" : "headphones")
                        .font(.system(size: 27, weight: .light))
                        .foregroundStyle(KidsTheme.gold)
                        .symbolEffect(.variableColor.iterative, options: .repeating, isActive: narration.isPlaying)
                }

                Button {
                    if narration.isPlaying {
                        narration.stop()
                    } else {
                        narration.play(story: story, ageBand: appState.ageBand)
                    }
                } label: {
                    HStack(spacing: 10) {
                        Image(systemName: narration.isPlaying ? "stop.fill" : "play.fill")
                        Text(narration.isPlaying ? "Stopp" : "Geschichte hören")
                            .fontWeight(.bold)
                    }
                    .foregroundStyle(KidsTheme.deepNight)
                    .frame(maxWidth: .infinity)
                    .frame(height: appState.ageBand == .age4to5 ? 68 : 58)
                    .background(
                        RoundedRectangle(cornerRadius: 22, style: .continuous)
                            .fill(KidsTheme.gold)
                    )
                }
            }
        }
    }

    private var readingCard: some View {
        KidsCard {
            VStack(alignment: .leading, spacing: 14) {
                Label(
                    appState.ageBand == .age6to7 ? "Kurz mitlesen" : "Die Geschichte lesen",
                    systemImage: "book.pages.fill"
                )
                .font(.system(size: 20, weight: .bold, design: .rounded))
                .foregroundStyle(KidsTheme.cream)

                ForEach(Array(version.readingParagraphs.enumerated()), id: \.offset) { _, paragraph in
                    Text(paragraph)
                        .font(.system(
                            size: appState.ageBand == .age6to7 ? 18 : 17,
                            weight: .medium,
                            design: .rounded
                        ))
                        .lineSpacing(6)
                        .foregroundStyle(.white.opacity(0.82))
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
        }
    }

    private var sourcesCard: some View {
        KidsCard {
            VStack(alignment: .leading, spacing: 12) {
                Label("Wo steht das?", systemImage: "text.book.closed.fill")
                    .font(.system(size: 19, weight: .bold, design: .rounded))
                    .foregroundStyle(KidsTheme.cream)

                Text("Die Erzählung folgt diesen Qurʾān-Stellen. Es werden keine erfundenen Ereignisse als Teil der Geschichte ausgegeben.")
                    .font(.system(size: 13, weight: .medium, design: .rounded))
                    .foregroundStyle(.white.opacity(0.58))

                ForEach(story.sources) { source in
                    HStack(spacing: 10) {
                        Image(systemName: "bookmark.fill")
                            .foregroundStyle(KidsTheme.gold)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(source.label)
                                .font(.caption.weight(.bold))
                                .foregroundStyle(KidsTheme.sage)
                            Text(source.reference)
                                .font(.system(size: 15, weight: .bold, design: .rounded))
                                .foregroundStyle(KidsTheme.cream)
                        }
                        Spacer()
                    }
                    .padding(.vertical, 4)
                }
            }
        }
    }

    private var completionButton: some View {
        Button {
            progress.markStoryComplete(story)
        } label: {
            Label(
                progress.isCompleted(story) ? "Schon geschafft" : "Als gehört markieren",
                systemImage: progress.isCompleted(story) ? "checkmark.circle.fill" : "circle"
            )
            .font(.system(size: 15, weight: .bold, design: .rounded))
            .foregroundStyle(progress.isCompleted(story) ? KidsTheme.gold : KidsTheme.cream.opacity(0.78))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
        }
        .disabled(progress.isCompleted(story))
    }
}
