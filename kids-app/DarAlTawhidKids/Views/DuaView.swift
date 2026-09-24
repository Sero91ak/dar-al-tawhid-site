import SwiftUI

struct DuaView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var progress: ProgressStore
    @Environment(\.dismiss) private var dismiss
    @StateObject private var narration = NarrationService()

    @State private var index = 0
    @State private var selectedAnswerID: String?
    @State private var feedback = ""
    @State private var passed = false
    @State private var feedbackPositive = false

    private var duas: [KidsDua] {
        KidsDuaContent.available(for: appState.ageBand)
    }

    private var dua: KidsDua? {
        guard duas.indices.contains(index) else { return nil }
        return duas[index]
    }

    var body: some View {
        ZStack {
            KidsAmbientBackground()

            if let dua {
                ScrollView {
                    VStack(spacing: 16) {
                        topBar
                        scene(dua)

                        Label("GEPRÜFT", systemImage: "checkmark.shield.fill")
                            .font(.system(size: 11, weight: .bold, design: .rounded))
                            .tracking(1)
                            .foregroundStyle(KidsTheme.sage)
                            .padding(.horizontal, 12)
                            .frame(minHeight: 34)
                            .background(KidsTheme.sage.opacity(0.09), in: Capsule())

                        Text(dua.title)
                            .font(.system(
                                size: appState.ageBand == .age4to5 ? 31 : 27,
                                weight: .bold,
                                design: .rounded
                            ))
                            .foregroundStyle(KidsTheme.cream)
                            .multilineTextAlignment(.center)

                        Text(dua.childPrompt)
                            .font(.system(size: 15, weight: .medium, design: .rounded))
                            .foregroundStyle(.white.opacity(0.62))
                            .multilineTextAlignment(.center)

                        Text(dua.arabic)
                            .font(.system(size: appState.ageBand == .age4to5 ? 42 : 35, weight: .regular))
                            .foregroundStyle(.white)
                            .multilineTextAlignment(.center)
                            .environment(\.layoutDirection, .rightToLeft)
                            .lineSpacing(8)
                            .padding(.horizontal, 4)

                        if appState.ageBand != .age4to5 {
                            Text(dua.transliteration)
                                .font(.system(size: 14, weight: .medium, design: .serif))
                                .italic()
                                .foregroundStyle(KidsTheme.gold.opacity(0.88))
                                .multilineTextAlignment(.center)
                        }

                        Text(dua.meaning)
                            .font(.system(size: 15, weight: .medium, design: .rounded))
                            .foregroundStyle(.white.opacity(0.78))
                            .multilineTextAlignment(.center)
                            .padding(14)
                            .frame(maxWidth: .infinity)
                            .background(.white.opacity(0.045), in: RoundedRectangle(cornerRadius: 20, style: .continuous))

                        Button {
                            narration.speakFeedback(
                                dua.childPrompt + " " + dua.meaning,
                                ageBand: appState.ageBand
                            )
                        } label: {
                            Label("Erklärung hören", systemImage: "speaker.wave.2.fill")
                                .font(.system(size: 16, weight: .bold, design: .rounded))
                                .foregroundStyle(KidsTheme.deepNight)
                                .frame(maxWidth: .infinity)
                                .frame(minHeight: 56)
                                .background(KidsTheme.gold, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
                        }
                        .buttonStyle(.plain)

                        questionCard(dua)

                        if appState.ageBand != .age4to5 {
                            VStack(spacing: 4) {
                                Text("Quelle")
                                    .font(.caption.weight(.bold))
                                    .foregroundStyle(.white.opacity(0.42))
                                Text(dua.source)
                                    .font(.caption.weight(.medium))
                                    .foregroundStyle(.white.opacity(0.48))
                                    .multilineTextAlignment(.center)

                                if let sourceURL = dua.sourceURL {
                                    Link("Nachweis öffnen", destination: sourceURL)
                                        .font(.caption.weight(.bold))
                                        .foregroundStyle(KidsTheme.sage)
                                }
                            }
                            .padding(.top, 4)
                        }

                        HStack(spacing: 10) {
                            Button {
                                previous()
                            } label: {
                                Label("Zurück", systemImage: "chevron.left")
                                    .frame(maxWidth: .infinity)
                                    .frame(minHeight: 50)
                                    .background(.white.opacity(0.055), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                            }

                            Button {
                                next()
                            } label: {
                                Label("Nächstes", systemImage: "chevron.right")
                                    .frame(maxWidth: .infinity)
                                    .frame(minHeight: 50)
                                    .background(.white.opacity(0.055), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                            }
                        }
                        .font(.system(size: 14, weight: .bold, design: .rounded))
                        .foregroundStyle(KidsTheme.cream.opacity(0.78))
                        .buttonStyle(.plain)
                    }
                    .padding(.horizontal, 18)
                    .padding(.top, 14)
                    .padding(.bottom, 34)
                }
                .scrollIndicators(.hidden)
            } else {
                Text("Für diese Altersstufe ist gerade kein geprüftes Duʿāʾ verfügbar.")
                    .foregroundStyle(KidsTheme.cream)
                    .multilineTextAlignment(.center)
                    .padding(24)
            }
        }
        .toolbar(.hidden, for: .navigationBar)
        .onAppear {
            loadState()
            speakIfNeeded()
        }
        .onChange(of: index) { _, _ in
            loadState()
            speakIfNeeded()
        }
        .onDisappear {
            narration.stop()
        }
    }

    private var topBar: some View {
        HStack {
            Button {
                narration.stop()
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
                Text("Meine Duʿāʾ")
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .foregroundStyle(KidsTheme.cream)
                Text(duas.isEmpty ? "geprüft" : "\(index + 1) von \(duas.count)")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.white.opacity(0.5))
            }

            Spacer()
            Color.clear.frame(width: 44, height: 44)
        }
    }

    private func scene(_ dua: KidsDua) -> some View {
        ZStack {
            RoundedRectangle(cornerRadius: 30, style: .continuous)
                .fill(sceneGradient(dua.scene))
                .frame(minHeight: appState.ageBand == .age4to5 ? 220 : 185)

            Circle()
                .fill(KidsTheme.gold.opacity(0.12))
                .frame(width: 130, height: 130)

            Image(systemName: dua.symbol)
                .font(.system(size: appState.ageBand == .age4to5 ? 66 : 54))
                .foregroundStyle(KidsTheme.cream)
        }
        .overlay {
            RoundedRectangle(cornerRadius: 30, style: .continuous)
                .stroke(.white.opacity(0.10))
        }
    }

    private func sceneGradient(_ scene: String) -> LinearGradient {
        let colors: [Color]
        switch scene {
        case "sleep", "night":
            colors = [
                Color(red: 0.07, green: 0.15, blue: 0.27),
                Color(red: 0.15, green: 0.25, blue: 0.40),
                Color(red: 0.34, green: 0.30, blue: 0.41)
            ]
        case "morning":
            colors = [
                Color(red: 0.31, green: 0.50, blue: 0.64),
                Color(red: 0.82, green: 0.62, blue: 0.36),
                Color(red: 0.84, green: 0.72, blue: 0.48)
            ]
        case "food":
            colors = [
                Color(red: 0.28, green: 0.44, blue: 0.35),
                Color(red: 0.58, green: 0.45, blue: 0.31),
                Color(red: 0.72, green: 0.57, blue: 0.39)
            ]
        default:
            colors = [
                Color(red: 0.18, green: 0.36, blue: 0.48),
                Color(red: 0.35, green: 0.54, blue: 0.51),
                Color(red: 0.63, green: 0.52, blue: 0.36)
            ]
        }

        return LinearGradient(colors: colors, startPoint: .top, endPoint: .bottom)
    }

    private func questionCard(_ dua: KidsDua) -> some View {
        VStack(spacing: 10) {
            Text(dua.question)
                .font(.system(
                    size: appState.ageBand == .age4to5 ? 23 : 18,
                    weight: .bold,
                    design: .rounded
                ))
                .foregroundStyle(KidsTheme.cream)
                .multilineTextAlignment(.center)

            ForEach(dua.answers) { answer in
                Button {
                    choose(answer, in: dua)
                } label: {
                    HStack {
                        Text(answer.title)
                            .font(.system(
                                size: appState.ageBand == .age4to5 ? 20 : 16,
                                weight: .bold,
                                design: .rounded
                            ))
                            .multilineTextAlignment(.leading)
                        Spacer()

                        if passed && answer.isCorrect {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundStyle(Color.green.opacity(0.9))
                        }
                    }
                    .foregroundStyle(KidsTheme.cream)
                    .padding(.horizontal, 15)
                    .frame(maxWidth: .infinity)
                    .frame(minHeight: appState.ageBand == .age4to5 ? 72 : 58)
                    .background(answerBackground(answer), in: RoundedRectangle(cornerRadius: 19, style: .continuous))
                    .overlay {
                        RoundedRectangle(cornerRadius: 19, style: .continuous)
                            .stroke(answerBorder(answer), lineWidth: 1)
                    }
                }
                .buttonStyle(.plain)
                .disabled(passed)
            }

            if !feedback.isEmpty {
                Text(feedback)
                    .font(.system(size: 14, weight: .bold, design: .rounded))
                    .foregroundStyle(feedbackPositive ? Color.green.opacity(0.9) : Color.red.opacity(0.85))
                    .multilineTextAlignment(.center)
            }
        }
        .padding(.top, 6)
    }

    private func choose(_ answer: KidsDuaAnswer, in dua: KidsDua) {
        guard !passed else { return }
        selectedAnswerID = answer.id

        if answer.isCorrect {
            passed = true
            feedbackPositive = true
            feedback = "✓ Richtig. Sehr gut!"
            progress.markDuaComplete(dua.id)
            narration.speakFeedback("Richtig. Sehr gut.", ageBand: appState.ageBand)
        } else {
            feedbackPositive = false
            feedback = "Noch nicht. Hör die Erklärung noch einmal."
            narration.speakFeedback(feedback, ageBand: appState.ageBand)

            Task { @MainActor in
                try? await Task.sleep(for: .seconds(1.1))
                if !passed {
                    selectedAnswerID = nil
                    feedback = ""
                }
            }
        }
    }

    private func answerBackground(_ answer: KidsDuaAnswer) -> Color {
        if passed && answer.isCorrect {
            return Color.green.opacity(0.14)
        }
        if selectedAnswerID == answer.id && !feedbackPositive {
            return Color.red.opacity(0.14)
        }
        return .white.opacity(0.055)
    }

    private func answerBorder(_ answer: KidsDuaAnswer) -> Color {
        if passed && answer.isCorrect {
            return Color.green.opacity(0.34)
        }
        if selectedAnswerID == answer.id && !feedbackPositive {
            return Color.red.opacity(0.34)
        }
        return .white.opacity(0.09)
    }

    private func loadState() {
        guard let dua else { return }
        selectedAnswerID = nil
        feedback = progress.isDuaComplete(dua.id) ? "✓ Schon gelernt" : ""
        feedbackPositive = progress.isDuaComplete(dua.id)
        passed = progress.isDuaComplete(dua.id)
    }

    private func speakIfNeeded() {
        guard let dua, !progress.isDuaComplete(dua.id) else { return }
        Task { @MainActor in
            try? await Task.sleep(for: .milliseconds(250))
            narration.speakFeedback(
                dua.childPrompt + " " + dua.meaning,
                ageBand: appState.ageBand
            )
        }
    }

    private func next() {
        guard !duas.isEmpty else { return }
        index = (index + 1) % duas.count
    }

    private func previous() {
        guard !duas.isEmpty else { return }
        index = (index - 1 + duas.count) % duas.count
    }
}
