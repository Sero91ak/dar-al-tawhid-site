import Foundation
import SwiftUI
import Observation

struct NextQuizDocument: Decodable {
    let items: [NextQuizItem]
}

struct NextQuizItem: Decodable, Identifiable {
    let id: String
    let number: Int
    let ageBand: String
    let ageMin: Int
    let ageMax: Int
    let category: String
    let question: String
    let answers: [NextQuizAnswer]
    let success: String
    let retry: String
    let explanation: String
    let sourceType: String
    let source: String
    let status: String
    let reviewStatus: String
    let verification: String
}

struct NextQuizAnswer: Decodable, Identifiable {
    let id: String
    let label: String
    let correct: Bool
}

private final class NextResourceBundleToken: NSObject {}

enum NextAppResources {
    static let bundle = Bundle(for: NextResourceBundleToken.self)
}

enum NextContentError: LocalizedError, Equatable {
    case missingResource(String)
    case invalidData
    case noApprovedItems

    var errorDescription: String? {
        switch self {
        case .missingResource(let name): "Die Inhaltsdatei \(name) wurde nicht gefunden."
        case .invalidData: "Die Inhaltsdatei konnte nicht sicher gelesen werden."
        case .noApprovedItems: "Es wurden keine freigegebenen Lerninhalte gefunden."
        }
    }
}

struct NextContentRepository {
    let bundle: Bundle

    init(bundle: Bundle = NextAppResources.bundle) {
        self.bundle = bundle
    }

    func loadQuiz() throws -> [NextQuizItem] {
        guard let url = bundle.url(forResource: "quiz-kids", withExtension: "json") else {
            throw NextContentError.missingResource("quiz-kids.json")
        }
        do {
            let document = try JSONDecoder().decode(NextQuizDocument.self, from: Data(contentsOf: url))
            let approved = document.items.filter {
                $0.status == "published" &&
                $0.reviewStatus == "approved" &&
                $0.verification == "approved"
            }
            guard !approved.isEmpty,
                  Set(approved.map(\.id)).count == approved.count else {
                throw NextContentError.noApprovedItems
            }
            return approved.sorted { $0.number < $1.number }
        } catch let error as NextContentError {
            throw error
        } catch {
            throw NextContentError.invalidData
        }
    }
}

struct NextQuizAudioEntry: Decodable {
    let url: String
}

struct NextQuizAudioManifest: Decodable {
    let entries: [String: NextQuizAudioEntry]

    func path(for item: NextQuizItem) -> String? {
        let prompt = item.question + " " + item.answers.enumerated().map {
            "Antwort \($0.offset + 1): \($0.element.label)."
        }.joined(separator: " ")
        return entries[prompt]?.url
    }

    func path(for feedback: String) -> String? {
        entries[feedback]?.url
    }
}

struct NextQuizAudioRepository {
    let bundle: Bundle

    init(bundle: Bundle = NextAppResources.bundle) {
        self.bundle = bundle
    }

    func loadManifest() throws -> NextQuizAudioManifest {
        guard let url = bundle.url(forResource: "quiz-audio", withExtension: "json") else {
            throw NextContentError.missingResource("quiz-audio.json")
        }
        do {
            return try JSONDecoder().decode(NextQuizAudioManifest.self, from: Data(contentsOf: url))
        } catch {
            throw NextContentError.invalidData
        }
    }
}

struct NextQuizSession {
    enum Phase: Equatable {
        case idle
        case question
        case answered(correct: Bool)
        case completed
        case failed(String)
    }

    private(set) var items: [NextQuizItem] = []
    private(set) var index = 0
    private(set) var phase: Phase = .idle

    var currentItem: NextQuizItem? {
        guard items.indices.contains(index) else { return nil }
        return items[index]
    }

    mutating func start(items: [NextQuizItem]) {
        self.items = items
        index = 0
        phase = items.isEmpty ? .failed("Keine Fragen verfügbar.") : .question
    }

    mutating func answer(id: String) {
        guard phase == .question, let item = currentItem,
              let answer = item.answers.first(where: { $0.id == id }) else { return }
        phase = .answered(correct: answer.correct)
    }

    mutating func advance() {
        guard case .answered = phase else { return }
        if index + 1 < items.count {
            index += 1
            phase = .question
        } else {
            phase = .completed
        }
    }

    mutating func retry() {
        guard case .answered(correct: false) = phase else { return }
        phase = .question
    }
}

struct NextQuizView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var session = NextQuizSession()
    @State private var loading = true
    @State private var errorMessage: String?
    @State private var audioManifest: NextQuizAudioManifest?
    @State private var audioService = NextAudioService()
    @AppStorage("kids.next.quiz.completedRounds") private var completedRounds = 0

    var body: some View {
        NavigationStack {
            Group {
                if loading {
                    ProgressView("Quiz wird geladen …")
                } else if let errorMessage {
                    ContentUnavailableView(
                        "Quiz nicht verfügbar",
                        systemImage: "exclamationmark.triangle",
                        description: Text(errorMessage)
                    )
                } else if let item = session.currentItem {
                    quizContent(item)
                } else if session.phase == .completed {
                    ContentUnavailableView(
                        "Runde abgeschlossen",
                        systemImage: "checkmark.seal.fill",
                        description: Text("Abgeschlossene Runden auf diesem Gerät: \(completedRounds).")
                    )
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .padding(20)
            .background(NextDesign.night.ignoresSafeArea())
            .foregroundStyle(NextDesign.cream)
            .navigationTitle("Quiz")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Schließen") { dismiss() }
                }
            }
        }
        .task { await loadQuiz() }
        .onDisappear {
            audioService.stop()
        }
    }

    @ViewBuilder
    private func quizContent(_ item: NextQuizItem) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Text("Frage \(item.number)")
                    .font(.headline)
                    .foregroundStyle(NextDesign.gold)
                if let path = audioManifest?.path(for: item) {
                    audioButton(title: "Frage anhören", path: path)
                } else {
                    Text("Für diese Frage ist kein exakter Audio-Manifesttreffer belegt.")
                        .font(.caption)
                        .foregroundStyle(NextDesign.cream.opacity(0.65))
                }
                VStack(alignment: .leading, spacing: 6) {
                    Text("Rundenfortschritt: \(session.index + 1) von \(session.items.count)")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(NextDesign.cream.opacity(0.78))
                    ProgressView(
                        value: Double(session.index + 1),
                        total: Double(max(session.items.count, 1))
                    )
                    .tint(NextDesign.gold)
                    .accessibilityValue("\(session.index + 1) von \(session.items.count)")
                }
                Text(item.question)
                    .font(.title2.weight(.semibold))
                ForEach(item.answers) { answer in
                    Button {
                        session.answer(id: answer.id)
                    } label: {
                        Text(answer.label)
                            .frame(maxWidth: .infinity, minHeight: 56, alignment: .leading)
                            .padding(.horizontal, 16)
                            .background(Color.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 16))
                    }
                    .buttonStyle(.plain)
                    .disabled(session.phase != .question)
                }
                if case .answered(let correct) = session.phase {
                    Text(correct ? item.success : item.retry)
                        .font(.headline)
                        .foregroundStyle(correct ? .green : NextDesign.gold)
                    if let path = audioManifest?.path(for: correct ? item.success : item.retry) {
                        audioButton(title: "Rückmeldung anhören", path: path)
                    }
                    Text(item.explanation)
                        .font(.body)
                    Button(correct ? "Weiter" : "Nochmal versuchen") {
                        if correct {
                            let isFinalItem = session.index + 1 == session.items.count
                            audioService.stop()
                            session.advance()
                            if isFinalItem {
                                completedRounds += 1
                            }
                        } else {
                            audioService.stop()
                            session.retry()
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(NextDesign.gold)
                }
            }
            .frame(maxWidth: 640, alignment: .leading)
        }
    }

    @ViewBuilder
    private func audioButton(title: String, path: String) -> some View {
        Button {
            if audioService.isPlaying {
                audioService.stop()
            } else {
                audioService.play(path: path)
            }
        } label: {
            Label(title, systemImage: audioService.isPlaying ? "stop.circle" : "play.circle")
                .font(.caption.weight(.semibold))
        }
        .buttonStyle(.bordered)
        .tint(NextDesign.gold)
        .accessibilityLabel(audioService.isPlaying ? "Audio stoppen" : "\(title)-Audio abspielen")
        .disabled(path.isEmpty)
    }

    private func loadQuiz() async {
        do {
            let items = try NextContentRepository().loadQuiz()
            session.start(items: items)
            audioManifest = try? NextQuizAudioRepository().loadManifest()
        } catch {
            errorMessage = error.localizedDescription
            session = NextQuizSession()
        }
        loading = false
    }
}
