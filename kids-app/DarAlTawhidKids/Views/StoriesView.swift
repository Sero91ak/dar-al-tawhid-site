import SwiftUI

struct StoriesView: View {
    @EnvironmentObject private var progress: ProgressStore
    @State private var selectedStory: KidsStory?

    var body: some View {
        NavigationStack {
            ZStack {
                KidsAmbientBackground()

                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 14) {
                        VStack(alignment: .leading, spacing: 5) {
                            Text("Geschichten")
                                .font(.system(size: 30, weight: .bold, design: .rounded))
                                .foregroundStyle(KidsTheme.cream)
                            Text("Kurze Hörgeschichten. Kein endloses Weiterlaufen.")
                                .font(.system(size: 15, weight: .medium, design: .rounded))
                                .foregroundStyle(.white.opacity(0.62))
                        }
                        .padding(.bottom, 6)

                        ForEach(SampleContent.stories) { story in
                            Button {
                                selectedStory = story
                            } label: {
                                KidsCard {
                                    HStack(spacing: 14) {
                                        ZStack {
                                            RoundedRectangle(cornerRadius: 20, style: .continuous)
                                                .fill(KidsTheme.gold.opacity(0.13))
                                                .frame(width: 68, height: 76)
                                            Image(systemName: progress.isCompleted(story) ? "checkmark.circle.fill" : "headphones")
                                                .font(.system(size: 26))
                                                .foregroundStyle(KidsTheme.gold)
                                        }

                                        VStack(alignment: .leading, spacing: 5) {
                                            Text(story.title)
                                                .font(.system(size: 19, weight: .bold, design: .rounded))
                                                .foregroundStyle(KidsTheme.cream)
                                            Text(story.category)
                                                .font(.caption.weight(.semibold))
                                                .foregroundStyle(KidsTheme.sage)
                                            Text(story.durationLabel)
                                                .font(.caption)
                                                .foregroundStyle(.white.opacity(0.5))
                                        }

                                        Spacer()
                                        Image(systemName: "chevron.right")
                                            .foregroundStyle(.white.opacity(0.35))
                                    }
                                }
                            }
                            .buttonStyle(.plain)
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
}
