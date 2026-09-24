import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var progress: ProgressStore
    @State private var selectedStory: KidsStory?

    private var storyOfTheDay: KidsStory {
        SampleContent.stories[Calendar.current.component(.day, from: .now) % SampleContent.stories.count]
    }

    var body: some View {
        NavigationStack {
            ZStack {
                KidsAmbientBackground()

                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        header
                        welcomeCard
                        storyCard
                        quickLearning
                        pauseNote
                    }
                    .padding(.horizontal, 18)
                    .padding(.top, 14)
                    .padding(.bottom, 36)
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
        VStack(alignment: .leading, spacing: 5) {
            Text("DĀR AL TAWḤĪD")
                .font(.system(size: 13, weight: .semibold, design: .serif))
                .tracking(2.2)
                .foregroundStyle(KidsTheme.gold)

            Text("Meine Kinderwelt")
                .font(.system(size: 30, weight: .bold, design: .rounded))
                .foregroundStyle(KidsTheme.cream)
        }
    }

    private var welcomeCard: some View {
        KidsCard {
            HStack(spacing: 14) {
                ZStack {
                    Circle()
                        .fill(KidsTheme.sky.opacity(0.18))
                        .frame(width: 58, height: 58)
                    Image(systemName: "moon.stars.fill")
                        .font(.system(size: 24))
                        .foregroundStyle(KidsTheme.sky)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text("Heute ganz in Ruhe")
                        .font(.system(size: 19, weight: .bold, design: .rounded))
                        .foregroundStyle(KidsTheme.cream)
                    Text("Alter (appState.ageBand.rawValue) · ungefähr (appState.dailyMinutes) Minuten")
                        .font(.system(size: 14, weight: .medium, design: .rounded))
                        .foregroundStyle(.white.opacity(0.66))
                }
                Spacer()
            }
        }
    }

    private var storyCard: some View {
        Button {
            selectedStory = storyOfTheDay
        } label: {
            KidsCard {
                VStack(alignment: .leading, spacing: 14) {
                    HStack {
                        Text("GESCHICHTE DES TAGES")
                            .font(.caption.weight(.bold))
                            .tracking(1.3)
                            .foregroundStyle(KidsTheme.gold)
                        Spacer()
                        Text(storyOfTheDay.durationLabel)
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(.white.opacity(0.6))
                    }

                    Text(storyOfTheDay.title)
                        .font(.system(size: 25, weight: .bold, design: .rounded))
                        .foregroundStyle(KidsTheme.cream)

                    Text(storyOfTheDay.summary)
                        .font(.system(size: 16, weight: .medium, design: .rounded))
                        .foregroundStyle(.white.opacity(0.76))
                        .multilineTextAlignment(.leading)

                    HStack {
                        Image(systemName: progress.isCompleted(storyOfTheDay) ? "checkmark.circle.fill" : "play.circle.fill")
                        Text(progress.isCompleted(storyOfTheDay) ? "Noch einmal hören" : "Jetzt hören")
                            .fontWeight(.bold)
                        Spacer()
                    }
                    .foregroundStyle(KidsTheme.gold)
                }
            }
        }
        .buttonStyle(.plain)
    }

    private var quickLearning: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Heute noch")
                .font(.system(size: 21, weight: .bold, design: .rounded))
                .foregroundStyle(KidsTheme.cream)

            HStack(spacing: 12) {
                smallTile("Duʿāʾ", "hands.sparkles.fill", KidsTheme.sky)
                smallTile("Eine Frage", "questionmark.bubble.fill", KidsTheme.peach)
            }
        }
    }

    private func smallTile(_ title: String, _ symbol: String, _ tint: Color) -> some View {
        Button {
            appState.selectedTab = .learn
        } label: {
            KidsCard {
                VStack(alignment: .leading, spacing: 18) {
                    Image(systemName: symbol)
                        .font(.system(size: 25))
                        .foregroundStyle(tint)
                    Text(title)
                        .font(.system(size: 17, weight: .bold, design: .rounded))
                        .foregroundStyle(KidsTheme.cream)
                    Text("kurz lernen")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.white.opacity(0.55))
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .buttonStyle(.plain)
    }

    private var pauseNote: some View {
        Text("Du musst nicht alles heute machen. Ein bisschen Wissen mit Ruhe ist genug.")
            .font(.system(size: 14, weight: .medium, design: .rounded))
            .foregroundStyle(.white.opacity(0.52))
            .multilineTextAlignment(.center)
            .frame(maxWidth: .infinity)
            .padding(.top, 4)
    }
}
