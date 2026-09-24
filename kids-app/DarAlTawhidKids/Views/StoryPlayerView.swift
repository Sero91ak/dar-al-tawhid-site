import SwiftUI

struct StoryPlayerView: View {
    let story: KidsStory

    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var progress: ProgressStore
    @StateObject private var narration = NarrationService()

    @State private var showQuestion = false
    @State private var selectedAnswerID: String?
    @State private var questionPassed = false
    @State private var questionFeedback = ""
    @State private var questionPositive = false

    private var storyQuestion: KidsStoryQuestion? {
        SampleContent.storyQuestion(for: story, ageBand: appState.ageBand)
    }

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
                        narration.stop()
                        resetQuestionState()
                        showQuestion = true
                    } label: {
                        Label(
                            progress.isCompleted(story) ? "Frage noch einmal" : "Frage beantworten",
                            systemImage: progress.isCompleted(story) ? "checkmark.circle.fill" : "questionmark.circle.fill"
                        )
                        .font(.system(size: 15, weight: .bold, design: .rounded))
                        .foregroundStyle(KidsTheme.cream.opacity(0.82))
                        .frame(maxWidth: .infinity)
                        .frame(minHeight: 48)
                        .background(.white.opacity(0.055), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                    }
                    .buttonStyle(.plain)
                }
                .padding(18)
                .padding(.bottom, 8)
            }
        }
        .interactiveDismissDisabled(narration.isPlaying)
        .sheet(isPresented: $showQuestion) {
            questionSheet
        }
        .onDisappear {
            narration.stop()
        }
    }

    @ViewBuilder
    private var questionSheet: some View {
        if let question = storyQuestion {
            ZStack {
                KidsAmbientBackground()

                ScrollView {
                    VStack(spacing: 18) {
                        HStack {
                            Button {
                                narration.stop()
                                showQuestion = false
                            } label: {
                                Image(systemName: "xmark")
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundStyle(KidsTheme.cream)
                                    .frame(width: 44, height: 44)
                                    .background(.white.opacity(0.08), in: Circle())
                            }

                            Spacer()

                            Text("Hast du gut zugehört?")
                                .font(.system(size: 16, weight: .bold, design: .rounded))
                                .foregroundStyle(KidsTheme.gold)

                            Spacer()
                            Color.clear.frame(width: 44, height: 44)
                        }

                        Image(systemName: "questionmark.bubble.fill")
                            .font(.system(size: appState.ageBand == .age4to5 ? 64 : 52))
                            .foregroundStyle(KidsTheme.gold)
                            .frame(width: 130, height: 130)
                            .background(KidsTheme.gold.opacity(0.08), in: Circle())

                        Text(question.question)
                            .font(.system(
                                size: appState.ageBand == .age4to5 ? 30 : 24,
                                weight: .bold,
                                design: .rounded
                            ))
                            .foregroundStyle(KidsTheme.cream)
                            .multilineTextAlignment(.center)
                            .minimumScaleFactor(0.8)

                        Button {
                            narration.speakFeedback(question.question, ageBand: appState.ageBand)
                        } label: {
                            Label("Frage anhören", systemImage: "speaker.wave.2.fill")
                                .font(.system(size: 14, weight: .bold, design: .rounded))
                                .foregroundStyle(KidsTheme.gold)
                                .padding(.horizontal, 16)
                                .frame(minHeight: 44)
                                .background(KidsTheme.gold.opacity(0.10), in: Capsule())
                        }
                        .buttonStyle(.plain)

                        VStack(spacing: 10) {
                            ForEach(question.answers) { answer in
                                Button {
                                    chooseStoryAnswer(answer, in: question)
                                } label: {
                                    HStack {
                                        Text(answer.title)
                                            .font(.system(
                                                size: appState.ageBand == .age4to5 ? 21 : 17,
                                                weight: .bold,
                                                design: .rounded
                                            ))
                                            .multilineTextAlignment(.leading)

                                        Spacer()

                                        if questionPassed && answer.isCorrect {
                                            Image(systemName: "checkmark.circle.fill")
                                                .font(.system(size: 24))
                                                .foregroundStyle(Color.green.opacity(0.9))
                                        }
                                    }
                                    .foregroundStyle(KidsTheme.cream)
                                    .padding(.horizontal, 16)
                                    .frame(maxWidth: .infinity)
                                    .frame(minHeight: appState.ageBand == .age4to5 ? 76 : 62)
                                    .background(storyAnswerBackground(answer), in: RoundedRectangle(cornerRadius: 20, style: .continuous))
                                    .overlay {
                                        RoundedRectangle(cornerRadius: 20, style: .continuous)
                                            .stroke(storyAnswerBorder(answer), lineWidth: 1)
                                    }
                                }
                                .buttonStyle(.plain)
                                .disabled(questionPassed)
                            }
                        }

                        if !questionFeedback.isEmpty {
                            Text(questionFeedback)
                                .font(.system(size: 15, weight: .bold, design: .rounded))
                                .foregroundStyle(questionPositive ? Color.green.opacity(0.9) : Color.red.opacity(0.85))
                                .multilineTextAlignment(.center)
                        }

                        if questionPassed {
                            Button {
                                narration.stop()
                                showQuestion = false
                            } label: {
                                Label("Fertig", systemImage: "checkmark.circle.fill")
                                    .font(.system(size: 18, weight: .bold, design: .rounded))
                                    .foregroundStyle(KidsTheme.deepNight)
                                    .frame(maxWidth: .infinity)
                                    .frame(minHeight: 58)
                                    .background(KidsTheme.gold, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(18)
                    .padding(.bottom, 30)
                }
                .scrollIndicators(.hidden)
            }
            .onAppear {
                Task { @MainActor in
                    try? await Task.sleep(for: .milliseconds(200))
                    narration.speakFeedback(question.question, ageBand: appState.ageBand)
                }
            }
        } else {
            ZStack {
                KidsAmbientBackground()
                Text("Für diese Geschichte ist noch keine Frage hinterlegt.")
                    .foregroundStyle(KidsTheme.cream)
                    .multilineTextAlignment(.center)
                    .padding(24)
            }
        }
    }

    private func chooseStoryAnswer(_ answer: KidsStoryQuestionAnswer, in question: KidsStoryQuestion) {
        guard !questionPassed else { return }
        selectedAnswerID = answer.id

        if answer.isCorrect {
            questionPassed = true
            questionPositive = true
            questionFeedback = "✓ \(question.successText)"
            progress.markStoryComplete(story)
            narration.speakFeedback(question.successText, ageBand: appState.ageBand)
        } else {
            questionPositive = false
            questionFeedback = question.retryText
            narration.speakFeedback(question.retryText, ageBand: appState.ageBand)

            Task { @MainActor in
                try? await Task.sleep(for: .seconds(1.2))
                if !questionPassed {
                    selectedAnswerID = nil
                    questionFeedback = ""
                }
            }
        }
    }

    private func storyAnswerBackground(_ answer: KidsStoryQuestionAnswer) -> Color {
        if questionPassed && answer.isCorrect {
            return Color.green.opacity(0.14)
        }
        if selectedAnswerID == answer.id && !questionPositive {
            return Color.red.opacity(0.14)
        }
        return .white.opacity(0.055)
    }

    private func storyAnswerBorder(_ answer: KidsStoryQuestionAnswer) -> Color {
        if questionPassed && answer.isCorrect {
            return Color.green.opacity(0.34)
        }
        if selectedAnswerID == answer.id && !questionPositive {
            return Color.red.opacity(0.34)
        }
        return .white.opacity(0.09)
    }

    private func resetQuestionState() {
        selectedAnswerID = nil
        questionPassed = false
        questionFeedback = ""
        questionPositive = false
    }
}
