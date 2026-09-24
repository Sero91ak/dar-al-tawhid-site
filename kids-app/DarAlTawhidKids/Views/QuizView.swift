import AVFoundation
import SwiftUI

@MainActor
private final class QuizNarrator: ObservableObject {
    private let synthesizer = AVSpeechSynthesizer()

    func speak(_ text: String, ageBand: AgeBand) {
        synthesizer.stopSpeaking(at: .immediate)
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = AVSpeechSynthesisVoice(language: "de-DE")
        utterance.rate = ageBand == .age4to5 ? 0.40 : 0.44
        utterance.pitchMultiplier = 0.96
        utterance.preUtteranceDelay = 0.08
        synthesizer.speak(utterance)
    }

    func stop() {
        synthesizer.stopSpeaking(at: .immediate)
    }
}

struct QuizView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var progress: ProgressStore
    @Environment(\.dismiss) private var dismiss

    @StateObject private var narrator = QuizNarrator()
    @State private var index = 0
    @State private var correctCount = 0
    @State private var selectedAnswerID: String?
    @State private var isAnsweredCorrectly = false
    @State private var feedback = ""
    @State private var feedbackIsPositive = false
    @State private var didStoreResult = false

    private var questions: [KidsQuizQuestion] {
        SampleContent.quizQuestions(for: appState.ageBand)
    }

    private var question: KidsQuizQuestion? {
        guard questions.indices.contains(index) else { return nil }
        return questions[index]
    }

    private var isFinished: Bool {
        !questions.isEmpty && index >= questions.count
    }

    var body: some View {
        ZStack {
            KidsAmbientBackground()

            if questions.isEmpty {
                emptyState
            } else if isFinished {
                finishState
            } else if let question {
                questionView(question)
            }
        }
        .toolbar(.hidden, for: .navigationBar)
        .onAppear {
            speakCurrentQuestion()
        }
        .onDisappear {
            narrator.stop()
        }
        .onChange(of: index) { _, _ in
            selectedAnswerID = nil
            isAnsweredCorrectly = false
            feedback = ""
            feedbackIsPositive = false
            speakCurrentQuestion()
        }
    }

    private func questionView(_ question: KidsQuizQuestion) -> some View {
        ScrollView {
            VStack(spacing: appState.ageBand == .age4to5 ? 20 : 16) {
                topBar
                progressDots
                scene(question)
                listenButton(question)
                questionText(question)
                answerGrid(question)

                if !feedback.isEmpty {
                    Text(feedback)
                        .font(.system(
                            size: appState.ageBand == .age4to5 ? 18 : 15,
                            weight: .bold,
                            design: .rounded
                        ))
                        .foregroundStyle(feedbackIsPositive ? Color.green.opacity(0.9) : Color.red.opacity(0.85))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 12)
                }

                if isAnsweredCorrectly {
                    Button {
                        index += 1
                    } label: {
                        Label(
                            index + 1 >= questions.count ? "Quiz beenden" : "Weiter",
                            systemImage: "arrow.right.circle.fill"
                        )
                        .font(.system(size: 18, weight: .bold, design: .rounded))
                        .foregroundStyle(Color(red: 0.06, green: 0.12, blue: 0.17))
                        .frame(maxWidth: .infinity)
                        .frame(minHeight: 58)
                        .background(KidsTheme.gold, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 18)
            .padding(.top, 14)
            .padding(.bottom, 34)
        }
        .scrollIndicators(.hidden)
    }

    private var topBar: some View {
        HStack {
            Button {
                narrator.stop()
                dismiss()
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(KidsTheme.cream)
                    .frame(width: 44, height: 44)
                    .background(.white.opacity(0.08), in: Circle())
            }
            .buttonStyle(.plain)

            Spacer()

            VStack(spacing: 2) {
                Text("Mein Quiz")
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .foregroundStyle(KidsTheme.cream)
                Text("\(appState.ageBand.rawValue) Jahre")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.white.opacity(0.52))
            }

            Spacer()
            Color.clear.frame(width: 44, height: 44)
        }
    }

    private var progressDots: some View {
        HStack(spacing: 7) {
            ForEach(questions.indices, id: \.self) { i in
                Circle()
                    .fill(i < index ? Color.green.opacity(0.82) : (i == index ? KidsTheme.gold : .white.opacity(0.15)))
                    .frame(width: 9, height: 9)
                    .overlay {
                        if i == index {
                            Circle()
                                .stroke(KidsTheme.gold.opacity(0.25), lineWidth: 5)
                                .frame(width: 17, height: 17)
                        }
                    }
            }
        }
        .padding(.vertical, 4)
    }

    private func scene(_ question: KidsQuizQuestion) -> some View {
        ZStack {
            RoundedRectangle(cornerRadius: 30, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [
                            Color(red: 0.18, green: 0.36, blue: 0.48),
                            Color(red: 0.35, green: 0.56, blue: 0.53),
                            Color(red: 0.70, green: 0.52, blue: 0.35)
                        ],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
                .frame(minHeight: appState.ageBand == .age4to5 ? 220 : 190)

            Circle()
                .fill(KidsTheme.gold.opacity(0.16))
                .frame(width: 120, height: 120)

            Image(systemName: question.sceneSymbol)
                .font(.system(size: appState.ageBand == .age4to5 ? 72 : 60))
                .foregroundStyle(KidsTheme.cream)
        }
        .overlay {
            RoundedRectangle(cornerRadius: 30, style: .continuous)
                .stroke(.white.opacity(0.10))
        }
    }

    private func spokenPrompt(for question: KidsQuizQuestion) -> String {
        if appState.ageBand == .age4to5 {
            return question.question + " Ja oder Nein?"
        }
        let choices = question.answers.enumerated()
            .map { "Antwort \($0.offset + 1): \($0.element.title)." }
            .joined(separator: " ")
        return question.question + " " + choices
    }

    private func listenButton(_ question: KidsQuizQuestion) -> some View {
        Button {
            narrator.speak(spokenPrompt(for: question), ageBand: appState.ageBand)
        } label: {
            Label("Frage anhören", systemImage: "speaker.wave.2.fill")
                .font(.system(size: 14, weight: .bold, design: .rounded))
                .foregroundStyle(KidsTheme.gold)
                .padding(.horizontal, 16)
                .frame(minHeight: 44)
                .background(KidsTheme.gold.opacity(0.10), in: Capsule())
        }
        .buttonStyle(.plain)
    }

    private func questionText(_ question: KidsQuizQuestion) -> some View {
        Text(question.question)
            .font(.system(
                size: appState.ageBand == .age4to5 ? 32 : (appState.ageBand == .age6to8 ? 27 : 24),
                weight: .bold,
                design: .rounded
            ))
            .foregroundStyle(KidsTheme.cream)
            .multilineTextAlignment(.center)
            .minimumScaleFactor(0.78)
            .padding(.horizontal, 8)
    }

    private func answerGrid(_ question: KidsQuizQuestion) -> some View {
        VStack(spacing: 11) {
            ForEach(question.answers) { answer in
                Button {
                    choose(answer, in: question)
                } label: {
                    HStack(spacing: 15) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 16, style: .continuous)
                                .fill(.white.opacity(0.07))
                                .frame(width: 52, height: 52)

                            Image(systemName: answer.symbol)
                                .font(.system(size: 23, weight: .bold))
                        }

                        Text(answer.title)
                            .font(.system(
                                size: appState.ageBand == .age4to5 ? 22 : 18,
                                weight: .bold,
                                design: .rounded
                            ))
                            .multilineTextAlignment(.leading)

                        Spacer()

                        if isAnsweredCorrectly && answer.isCorrect {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundStyle(Color.green.opacity(0.9))
                                .font(.system(size: 24))
                        }
                    }
                    .foregroundStyle(KidsTheme.cream)
                    .padding(.horizontal, 15)
                    .frame(maxWidth: .infinity)
                    .frame(minHeight: appState.ageBand == .age4to5 ? 88 : 72)
                    .background(answerBackground(answer), in: RoundedRectangle(cornerRadius: 22, style: .continuous))
                    .overlay {
                        RoundedRectangle(cornerRadius: 22, style: .continuous)
                            .stroke(answerBorder(answer), lineWidth: 1)
                    }
                }
                .buttonStyle(.plain)
                .disabled(isAnsweredCorrectly)
            }
        }
    }

    private func answerBackground(_ answer: KidsQuizAnswer) -> Color {
        if isAnsweredCorrectly && answer.isCorrect {
            return Color.green.opacity(0.14)
        }
        if selectedAnswerID == answer.id && !feedbackIsPositive {
            return Color.red.opacity(0.14)
        }
        return .white.opacity(0.06)
    }

    private func answerBorder(_ answer: KidsQuizAnswer) -> Color {
        if isAnsweredCorrectly && answer.isCorrect {
            return Color.green.opacity(0.34)
        }
        if selectedAnswerID == answer.id && !feedbackIsPositive {
            return Color.red.opacity(0.34)
        }
        return .white.opacity(0.09)
    }

    private var finishState: some View {
        VStack(spacing: 18) {
            Spacer()

            Image(systemName: "star.fill")
                .font(.system(size: 72))
                .foregroundStyle(KidsTheme.gold)

            Text("Quiz geschafft!")
                .font(.system(size: 32, weight: .bold, design: .rounded))
                .foregroundStyle(KidsTheme.cream)

            Text("Du hast \(correctCount) von \(questions.count) Fragen richtig gelöst.")
                .font(.system(size: 16, weight: .medium, design: .rounded))
                .foregroundStyle(.white.opacity(0.66))
                .multilineTextAlignment(.center)

            Button {
                storeResultIfNeeded()
                index = 0
                correctCount = 0
                didStoreResult = false
            } label: {
                Label("Noch einmal spielen", systemImage: "arrow.clockwise")
                    .font(.system(size: 17, weight: .bold, design: .rounded))
                    .foregroundStyle(Color(red: 0.06, green: 0.12, blue: 0.17))
                    .frame(maxWidth: .infinity)
                    .frame(minHeight: 58)
                    .background(KidsTheme.gold, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 24)

            Button("Fertig") {
                storeResultIfNeeded()
                dismiss()
            }
            .font(.system(size: 16, weight: .bold, design: .rounded))
            .foregroundStyle(.white.opacity(0.62))
            .padding(.top, 4)

            Spacer()
        }
        .padding(18)
        .onAppear {
            storeResultIfNeeded()
            narrator.speak("Sehr gut. Du hast das Quiz geschafft.", ageBand: appState.ageBand)
        }
    }

    private var emptyState: some View {
        VStack(spacing: 14) {
            Image(systemName: "questionmark.circle")
                .font(.system(size: 52))
                .foregroundStyle(KidsTheme.gold)
            Text("Für diese Altersstufe sind noch keine Quizfragen vorhanden.")
                .foregroundStyle(KidsTheme.cream)
                .multilineTextAlignment(.center)
        }
        .padding(24)
    }

    private func choose(_ answer: KidsQuizAnswer, in question: KidsQuizQuestion) {
        guard !isAnsweredCorrectly else { return }
        selectedAnswerID = answer.id

        if answer.isCorrect {
            correctCount += 1
            isAnsweredCorrectly = true
            feedbackIsPositive = true
            feedback = "✓ \(question.successText)"
            narrator.speak(question.successText, ageBand: appState.ageBand)
        } else {
            feedbackIsPositive = false
            feedback = question.retryText
            narrator.speak(question.retryText, ageBand: appState.ageBand)

            Task { @MainActor in
                try? await Task.sleep(for: .seconds(1.3))
                if !isAnsweredCorrectly {
                    selectedAnswerID = nil
                    feedback = ""
                }
            }
        }
    }

    private func speakCurrentQuestion() {
        guard let question else { return }
        Task { @MainActor in
            try? await Task.sleep(for: .milliseconds(250))
            narrator.speak(spokenPrompt(for: question), ageBand: appState.ageBand)
        }
    }

    private func storeResultIfNeeded() {
        guard !didStoreResult else { return }
        didStoreResult = true
        progress.addQuizCorrect(correctCount)
    }
}
