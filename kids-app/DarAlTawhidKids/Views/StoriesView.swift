import SwiftUI

struct StoriesView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var progress: ProgressStore
    @State private var selectedStory: KidsStory?

    var body: some View {
        NavigationStack {
            ZStack {
                KidsAmbientBackground()

                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 14) {
                        header
                        ageModeCard

                        ForEach(SampleContent.stories) { story in
                            storyCard(story)
                        }
                    }
                    .padding(18)
                    .padding(.bottom, 28)
                }
                .scrollIndicators(.hidden)
            }
            .toolbar(.hidden, for: .navigationBar)
            .sheet(item: $selectedStory) { story in
                StoryPlayerView(story: story)
            }
        }
    }

    private var header: some View {
        HStack(alignment: .top, spacing: 14) {
            VStack(alignment: .leading, spacing: 5) {
                Text("Geschichten")
                    .font(.system(size: 30, weight: .bold, design: .rounded))
                    .foregroundStyle(KidsTheme.cream)

                Text("Qurʾān-basiert · kurz · kindgerecht")
                    .font(.system(size: 15, weight: .medium, design: .rounded))
                    .foregroundStyle(.white.opacity(0.62))
            }

            Spacer()

            Button {
                appState.selectedTab = .parents
            } label: {
                Image(systemName: "slider.horizontal.3")
                    .font(.system(size: 17, weight: .bold))
                    .foregroundStyle(KidsTheme.gold)
                    .frame(width: 44, height: 44)
                    .background(
                        Circle()
                            .fill(Color.white.opacity(0.07))
                            .overlay(
                                Circle().stroke(KidsTheme.gold.opacity(0.2), lineWidth: 1)
                            )
                    )
            }
            .accessibilityLabel("Alter einstellen")
        }
        .padding(.bottom, 2)
    }

    private var ageModeCard: some View {
        KidsCard {
            HStack(spacing: 12) {
                ZStack {
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .fill(KidsTheme.gold.opacity(0.12))
                        .frame(width: 50, height: 50)

                    Image(systemName: appState.ageBand.showsStoryReading ? "book.and.wrench.fill" : "headphones")
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundStyle(KidsTheme.gold)
                }

                VStack(alignment: .leading, spacing: 3) {
                    Text("(appState.ageBand.rawValue) Jahre")
                        .font(.system(size: 15, weight: .bold, design: .rounded))
                        .foregroundStyle(KidsTheme.cream)

                    Text(appState.ageBand.storyModeLabel)
                        .font(.system(size: 13, weight: .semibold, design: .rounded))
                        .foregroundStyle(.white.opacity(0.58))
                }

                Spacer()

                Text("ÄNDERN")
                    .font(.caption2.weight(.heavy))
                    .tracking(0.7)
                    .foregroundStyle(KidsTheme.gold)
            }
            .contentShape(Rectangle())
            .onTapGesture {
                appState.selectedTab = .parents
            }
        }
    }

    @ViewBuilder
    private func storyCard(_ story: KidsStory) -> some View {
        let version = story.version(for: appState.ageBand)

        Button {
            selectedStory = story
        } label: {
            KidsCard {
                VStack(spacing: 0) {
                    ZStack(alignment: .bottomLeading) {
                        Image(story.coverAsset)
                            .resizable()
                            .scaledToFill()
                            .frame(maxWidth: .infinity)
                            .frame(height: appState.ageBand == .age4to5 ? 180 : 150)
                            .clipped()

                        LinearGradient(
                            colors: [.clear, KidsTheme.deepNight.opacity(0.92)],
                            startPoint: .top,
                            endPoint: .bottom
                        )

                        VStack(alignment: .leading, spacing: 5) {
                            Text(story.title)
                                .font(.system(size: appState.ageBand == .age4to5 ? 24 : 21, weight: .bold, design: .rounded))
                                .foregroundStyle(KidsTheme.cream)

                            HStack(spacing: 7) {
                                Image(systemName: "headphones")
                                Text(version.durationLabel)
                                Text("·")
                                Text(appState.ageBand.storyModeLabel)
                            }
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(.white.opacity(0.72))
                        }
                        .padding(14)

                        if progress.isCompleted(story) {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 25))
                                .foregroundStyle(KidsTheme.gold)
                                .padding(13)
                                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topTrailing)
                        }
                    }
                    .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))

                    if appState.ageBand.showsStoryReading {
                        VStack(alignment: .leading, spacing: 5) {
                            Text(story.category)
                                .font(.caption.weight(.bold))
                                .foregroundStyle(KidsTheme.sage)

                            Text(story.summary)
                                .font(.system(size: 14, weight: .medium, design: .rounded))
                                .foregroundStyle(.white.opacity(0.7))
                                .multilineTextAlignment(.leading)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.top, 12)
                    }
                }
            }
        }
        .buttonStyle(.plain)
    }
}
