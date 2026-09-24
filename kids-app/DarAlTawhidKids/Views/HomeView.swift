import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var progress: ProgressStore
    @State private var selectedStory: KidsStory?
    @State private var showQuiz = false
    @State private var showDua = false

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
                        dailyJourneyCard
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
            .navigationDestination(isPresented: $showQuiz) {
                QuizView()
            }
            .navigationDestination(isPresented: $showDua) {
                DuaView()
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
                    Text("Alter \(appState.ageBand.rawValue) · ungefähr \(appState.dailyMinutes) Minuten")
                        .font(.system(size: 14, weight: .medium, design: .rounded))
                        .foregroundStyle(.white.opacity(0.66))
                }
                Spacer()
            }
        }
    }

    private var dailyJourneyCard: some View {
        let storyDone = progress.isDailyStepComplete("story")
        let duaDone = progress.isDailyStepComplete("dua")
        let quizDone = progress.isDailyStepComplete("quiz")

        let doneCount: Int
        let totalCount: Int
        let finished: Bool

        switch appState.ageBand {
        case .age4to5:
            doneCount = [duaDone, storyDone].filter { $0 }.count
            totalCount = 2
            finished = duaDone && storyDone
        case .age6to8:
            doneCount = [storyDone, duaDone, quizDone].filter { $0 }.count
            totalCount = 3
            finished = storyDone && duaDone && quizDone
        case .age9to10:
            doneCount = [storyDone, duaDone, quizDone].filter { $0 }.count
            totalCount = 3
            finished = storyDone && duaDone && quizDone
        }

        return KidsCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Text("DEINE HEUTIGE REISE")
                        .font(.caption.weight(.bold))
                        .tracking(1.2)
                        .foregroundStyle(KidsTheme.gold)

                    Spacer()

                    Text("\(doneCount)/\(totalCount)")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(finished ? KidsTheme.sage : .white.opacity(0.48))
                }

                if appState.ageBand == .age4to5 {
                    journeyStep(
                        number: 1,
                        title: "Ein Duʿāʾ",
                        subtitle: "hören & verstehen",
                        symbol: "hand.raised.fill",
                        done: duaDone
                    ) {
                        showDua = true
                    }

                    journeyStep(
                        number: 2,
                        title: "Eine Geschichte",
                        subtitle: "zuhören & verstehen",
                        symbol: "headphones",
                        done: storyDone
                    ) {
                        selectedStory = storyOfTheDay
                    }
                } else {
                    journeyStep(
                        number: 1,
                        title: "Eine Geschichte",
                        subtitle: "zuhören & verstehen",
                        symbol: "headphones",
                        done: storyDone
                    ) {
                        selectedStory = storyOfTheDay
                    }

                    journeyStep(
                        number: 2,
                        title: "Ein Duʿāʾ",
                        subtitle: "lernen & verstehen",
                        symbol: "hand.raised.fill",
                        done: duaDone
                    ) {
                        showDua = true
                    }

                    journeyStep(
                        number: 3,
                        title: "Ein kleines Quiz",
                        subtitle: "hören & auswählen",
                        symbol: "star.fill",
                        done: quizDone
                    ) {
                        showQuiz = true
                    }
                }

                Text(finished ? "Für heute geschafft. Sehr schön." : "Ein kleiner Schritt nach dem anderen reicht.")
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                    .foregroundStyle(finished ? KidsTheme.sage : .white.opacity(0.52))
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.top, 2)
            }
        }
    }

    private func journeyStep(
        number: Int,
        title: String,
        subtitle: String,
        symbol: String,
        done: Bool,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            HStack(spacing: 12) {
                ZStack {
                    RoundedRectangle(cornerRadius: 13, style: .continuous)
                        .fill(done ? KidsTheme.sage.opacity(0.18) : .white.opacity(0.07))
                        .frame(width: 40, height: 40)

                    if done {
                        Image(systemName: "checkmark")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundStyle(KidsTheme.sage)
                    } else {
                        Text("\(number)")
                            .font(.system(size: 14, weight: .bold, design: .rounded))
                            .foregroundStyle(KidsTheme.gold)
                    }
                }

                Image(systemName: symbol)
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(done ? KidsTheme.sage : KidsTheme.gold)
                    .frame(width: 24)

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.system(size: 16, weight: .bold, design: .rounded))
                        .foregroundStyle(KidsTheme.cream)
                    Text(subtitle)
                        .font(.caption.weight(.medium))
                        .foregroundStyle(.white.opacity(0.5))
                }

                Spacer()

                Image(systemName: done ? "checkmark.circle.fill" : "chevron.right")
                    .foregroundStyle(done ? KidsTheme.sage : .white.opacity(0.34))
            }
            .padding(11)
            .background(.white.opacity(0.04), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        }
        .buttonStyle(.plain)
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
                duaTile
                quizTile
            }
        }
    }

    private var duaTile: some View {
        NavigationLink {
            DuaView()
        } label: {
            KidsCard {
                VStack(alignment: .leading, spacing: 18) {
                    Image(systemName: "hand.raised.fill")
                        .font(.system(size: 25))
                        .foregroundStyle(KidsTheme.sky)

                    Text("Meine Duʿāʾ")
                        .font(.system(size: 17, weight: .bold, design: .rounded))
                        .foregroundStyle(KidsTheme.cream)

                    Text("geprüft · hören · lernen")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.white.opacity(0.55))
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .buttonStyle(.plain)
    }

    private var quizTile: some View {
        NavigationLink {
            QuizView()
        } label: {
            KidsCard {
                VStack(alignment: .leading, spacing: 18) {
                    Image(systemName: "star.fill")
                        .font(.system(size: 25))
                        .foregroundStyle(KidsTheme.peach)

                    Text("Quiz spielen")
                        .font(.system(size: 17, weight: .bold, design: .rounded))
                        .foregroundStyle(KidsTheme.cream)

                    Text(appState.ageBand == .age4to5 ? "hören & tippen" : "hören & auswählen")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.white.opacity(0.55))
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .buttonStyle(.plain)
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
