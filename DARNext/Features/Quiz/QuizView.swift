import SwiftUI

struct QuizView: View {
    let repository: LocalContentRepository
    @State private var questions: [QuizQuestion] = []
    @State private var selectedCategory: String
    @State private var selectedTopic: String?
    @State private var selectedLevel = "Alle"
    @State private var roundLength = 10
    @State private var isStarting = false
    @State private var errorMessage: String?

    init(
        repository: LocalContentRepository,
        initialCategory: String? = nil,
        initialTopic: String? = nil
    ) {
        self.repository = repository
        _selectedCategory = State(initialValue: initialCategory ?? "Alle")
        _selectedTopic = State(initialValue: initialTopic)
    }

    private var approvedQuestions: [QuizQuestion] {
        questions.filter { $0.isApprovedAdultContent }
    }

    private var categories: [String] {
        ["Alle"] + Set(approvedQuestions.compactMap(\.category)).sorted()
    }

    private var topics: [String] {
        let categoryQuestions = approvedQuestions.filter {
            selectedCategory == "Alle" || $0.category == selectedCategory
        }
        return Set(categoryQuestions.compactMap(\.topic)).sorted()
    }

    private var levels: [String] {
        ["Alle"] + Set(approvedQuestions.compactMap(\.level)).sorted()
    }

    private var filteredQuestions: [QuizQuestion] {
        approvedQuestions.filter { question in
            (selectedCategory == "Alle" || question.category == selectedCategory)
                && (selectedTopic == nil || question.topic == selectedTopic)
                && (selectedLevel == "Alle" || question.level == selectedLevel)
        }
    }

    var body: some View {
        Form {
            Section("Lernrunde") {
                Picker("Kategorie", selection: $selectedCategory) {
                    ForEach(categories, id: \.self, content: Text.init)
                }
                .accessibilityIdentifier("quiz-category-filter")
                Picker("Thema", selection: $selectedTopic) {
                    Text("Alle").tag(Optional<String>.none)
                    ForEach(topics, id: \.self) { topic in
                        Text(topic).tag(Optional(topic))
                    }
                }
                .accessibilityIdentifier("quiz-topic-filter")
                Picker("Schwierigkeit", selection: $selectedLevel) {
                    ForEach(levels, id: \.self, content: Text.init)
                }
                Picker("Fragen", selection: $roundLength) {
                    Text("10 Fragen").tag(10)
                    Text("20 Fragen").tag(20)
                }
            }

            Section {
                NavigationLink {
                    QuizRoundView(
                        questions: filteredQuestions,
                        roundLength: roundLength
                    )
                } label: {
                    Label("Lernrunde starten", systemImage: "play.fill")
                }
                .disabled(filteredQuestions.isEmpty || isStarting)
            }

            if let errorMessage {
                Section {
                    Text(errorMessage)
                        .foregroundStyle(.red)
                }
            }
        }
        .navigationTitle("Wissensquiz")
        .onChange(of: selectedCategory) { _ in
            selectedTopic = nil
        }
        .overlay {
            if questions.isEmpty && errorMessage == nil {
                ProgressView("Freigegebene Fragen werden geladen …")
            }
        }
        .task {
            do {
                isStarting = true
                questions = try await repository.quizQuestions()
                if !categories.contains(selectedCategory) {
                    selectedCategory = "Alle"
                }
                if let selectedTopic, !topics.contains(selectedTopic) {
                    self.selectedTopic = nil
                }
            } catch {
                errorMessage = error.localizedDescription
            }
            isStarting = false
        }
    }
}

private struct QuizRoundView: View {
    let questions: [QuizQuestion]
    let roundLength: Int
    @State private var roundQuestions: [QuizQuestion] = []
    @State private var index = 0
    @State private var selectedAnswer: Int?
    @State private var score = 0
    @State private var isFinished = false

    private var currentQuestion: QuizQuestion? {
        guard index < roundQuestions.count else { return nil }
        return roundQuestions[index]
    }

    var body: some View {
        Group {
            if isFinished {
                QuizResultView(score: score, total: roundQuestions.count) {
                    resetRound()
                }
            } else if let question = currentQuestion {
                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        ProgressView(value: Double(index + 1), total: Double(roundQuestions.count))
                        Text("Frage \(index + 1) von \(roundQuestions.count)")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(.secondary)
                            .accessibilityIdentifier("quiz-round-question-count")
                        Text(question.question)
                            .font(.title2.weight(.semibold))
                            .accessibilityIdentifier("quiz-round-question-title")

                        ForEach(Array(question.answers.enumerated()), id: \.offset) { answer in
                            Button {
                                answerQuestion(answer.offset)
                            } label: {
                                HStack(alignment: .top, spacing: 12) {
                                    Image(systemName: answerIcon(answer.offset))
                                    Text(answer.element)
                                        .frame(maxWidth: .infinity, alignment: .leading)
                                }
                                .padding()
                                .background(answerBackground(answer.offset), in: RoundedRectangle(cornerRadius: 18))
                            }
                            .buttonStyle(.plain)
                            .accessibilityIdentifier("quiz-answer-\(question.id)-\(answer.offset)")
                            .disabled(selectedAnswer != nil)
                        }

                        if let selectedAnswer {
                            VStack(alignment: .leading, spacing: 8) {
                                Label(
                                    selectedAnswer == question.correctIndex ? "Richtig" : "Nicht richtig",
                                    systemImage: selectedAnswer == question.correctIndex ? "checkmark.circle.fill" : "xmark.circle.fill"
                                )
                                .font(.headline)
                                .foregroundStyle(selectedAnswer == question.correctIndex ? .green : .red)
                                .accessibilityIdentifier("quiz-answer-feedback")
                                if let explanation = question.explanation {
                                    Text(explanation)
                                        .font(.body)
                                }
                                if let source = question.source {
                                    Text(source)
                                        .font(.caption.weight(.semibold))
                                        .foregroundStyle(.secondary)
                                        .accessibilityIdentifier("quiz-answer-source")
                                }
                                Button("Nächste Frage") {
                                    nextQuestion()
                                }
                                .buttonStyle(.borderedProminent)
                            }
                            .padding()
                            .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 18))
                        }
                    }
                    .padding()
                }
            } else {
                ContentUnavailableView("Keine passenden Fragen", systemImage: "questionmark.circle")
            }
        }
        .navigationTitle("Lernrunde")
        .task {
            if roundQuestions.isEmpty {
                roundQuestions = Array(questions.shuffled().prefix(roundLength))
            }
        }
    }

    private func answerQuestion(_ answer: Int) {
        selectedAnswer = answer
        if answer == currentQuestion?.correctIndex {
            score += 1
        }
    }

    private func nextQuestion() {
        if index + 1 >= roundQuestions.count {
            isFinished = true
        } else {
            index += 1
            selectedAnswer = nil
        }
    }

    private func resetRound() {
        roundQuestions = Array(questions.shuffled().prefix(roundLength))
        index = 0
        selectedAnswer = nil
        score = 0
        isFinished = false
    }

    private func answerIcon(_ answer: Int) -> String {
        guard let selectedAnswer else { return "circle" }
        if answer == currentQuestion?.correctIndex { return "checkmark.circle.fill" }
        if answer == selectedAnswer { return "xmark.circle.fill" }
        return "circle"
    }

    private func answerBackground(_ answer: Int) -> Color {
        guard let selectedAnswer else { return Color.secondary.opacity(0.12) }
        if answer == currentQuestion?.correctIndex { return Color.green.opacity(0.22) }
        if answer == selectedAnswer { return Color.red.opacity(0.22) }
        return Color.secondary.opacity(0.08)
    }
}

private struct QuizResultView: View {
    let score: Int
    let total: Int
    let restart: () -> Void

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "rosette")
                .font(.system(size: 56))
                .foregroundStyle(.tint)
            Text("Runde abgeschlossen")
                .font(.title.bold())
            Text("\(score) von \(total) richtig")
                .font(.title2)
            Button("Neue Runde", action: restart)
                .buttonStyle(.borderedProminent)
        }
        .padding()
        .navigationTitle("Ergebnis")
    }
}
