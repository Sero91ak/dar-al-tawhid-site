import Foundation

struct KidsStory: Identifiable, Hashable {
    let id: String
    let title: String
    let summary: String
    let category: String
    let durationLabel: String
    let narrationText: String
    let audioResource: String?
    let isOriginalStory: Bool
}

struct LearnCard: Identifiable, Hashable {
    let id: String
    let title: String
    let subtitle: String
    let symbol: String
    let tintName: String
}

enum QuizAnswerStyle: String, Hashable {
    case yesNo
    case choice
}

struct KidsQuizAnswer: Identifiable, Hashable {
    let id: String
    let title: String
    let symbol: String
    let isCorrect: Bool
}

struct KidsQuizQuestion: Identifiable, Hashable {
    let id: String
    let ageBand: AgeBand
    let question: String
    let sceneSymbol: String
    let style: QuizAnswerStyle
    let answers: [KidsQuizAnswer]
    let successText: String
    let retryText: String
}

struct KidsStoryQuestionAnswer: Identifiable, Hashable {
    let id: String
    let title: String
    let isCorrect: Bool
}

struct KidsStoryQuestion: Identifiable, Hashable {
    let id: String
    let storyID: String
    let ageBand: AgeBand
    let question: String
    let answers: [KidsStoryQuestionAnswer]
    let successText: String
    let retryText: String
}

enum SampleContent {
    static let storyQuestions: [KidsStoryQuestion] = [
        KidsStoryQuestion(
            id: "coin-45",
            storyID: "adab-found-coin",
            ageBand: .age4to5,
            question: "Soll Adam die gefundene Münze einfach behalten?",
            answers: [
                KidsStoryQuestionAnswer(id: "yes", title: "Ja", isCorrect: false),
                KidsStoryQuestionAnswer(id: "no", title: "Nein", isCorrect: true)
            ],
            successText: "Richtig. Die Münze gehört jemand anderem.",
            retryText: "Denk noch einmal an die Geschichte."
        ),
        KidsStoryQuestion(
            id: "coin-68",
            storyID: "adab-found-coin",
            ageBand: .age6to8,
            question: "Was war die ehrliche Handlung?",
            answers: [
                KidsStoryQuestionAnswer(id: "owner", title: "Nach dem Besitzer suchen", isCorrect: true),
                KidsStoryQuestionAnswer(id: "keep", title: "Die Münze behalten", isCorrect: false)
            ],
            successText: "Richtig. Adam suchte nach dem Besitzer.",
            retryText: "Hör noch einmal: Wem gehörte die Münze?"
        ),
        KidsStoryQuestion(
            id: "coin-910",
            storyID: "adab-found-coin",
            ageBand: .age9to10,
            question: "Was zeigt Adams Verhalten am besten?",
            answers: [
                KidsStoryQuestionAnswer(id: "honesty", title: "Ehrlichkeit auch ohne Zuschauer", isCorrect: true),
                KidsStoryQuestionAnswer(id: "praise", title: "Nur helfen, wenn jemand zusieht", isCorrect: false),
                KidsStoryQuestionAnswer(id: "mine", title: "Gefundene Dinge gehören automatisch mir", isCorrect: false)
            ],
            successText: "Richtig. Ehrlichkeit gilt auch, wenn niemand zusieht.",
            retryText: "Denk an die Botschaft der Geschichte."
        ),
        KidsStoryQuestion(
            id: "water-45",
            storyID: "adab-water",
            ageBand: .age4to5,
            question: "War es gut, dass Maryam ihrer Schwester Wasser gab?",
            answers: [
                KidsStoryQuestionAnswer(id: "yes", title: "Ja", isCorrect: true),
                KidsStoryQuestionAnswer(id: "no", title: "Nein", isCorrect: false)
            ],
            successText: "Ja. Helfen ist gutes Benehmen.",
            retryText: "Denk an das Lächeln ihrer Schwester."
        ),
        KidsStoryQuestion(
            id: "water-68",
            storyID: "adab-water",
            ageBand: .age6to8,
            question: "Was lernte Maryam?",
            answers: [
                KidsStoryQuestionAnswer(id: "help", title: "Aufmerksam sein und helfen", isCorrect: true),
                KidsStoryQuestionAnswer(id: "self", title: "Nur an sich selbst denken", isCorrect: false)
            ],
            successText: "Richtig. Kleine Hilfe kann viel bedeuten.",
            retryText: "Was hat Maryam für ihre Schwester getan?"
        ),
        KidsStoryQuestion(
            id: "water-910",
            storyID: "adab-water",
            ageBand: .age9to10,
            question: "Welche Aussage passt zur Geschichte?",
            answers: [
                KidsStoryQuestionAnswer(id: "small", title: "Gutes Benehmen zeigt sich oft in kleinen Handlungen", isCorrect: true),
                KidsStoryQuestionAnswer(id: "praise", title: "Gute Taten zählen nur mit Lob", isCorrect: false),
                KidsStoryQuestionAnswer(id: "ask", title: "Man hilft nur nach Aufforderung", isCorrect: false)
            ],
            successText: "Richtig. Kleine gute Handlungen gehören zu gutem Adab.",
            retryText: "Denk an die kleine Handlung am Tisch."
        ),
        KidsStoryQuestion(
            id: "helper-45",
            storyID: "adab-quiet-helper",
            ageBand: .age4to5,
            question: "War es gut, dass Yusuf aufgeräumt hat?",
            answers: [
                KidsStoryQuestionAnswer(id: "yes", title: "Ja", isCorrect: true),
                KidsStoryQuestionAnswer(id: "no", title: "Nein", isCorrect: false)
            ],
            successText: "Richtig. Yusuf half, obwohl niemand ihn lobte.",
            retryText: "Denk noch einmal an die Bücher und Stifte."
        ),
        KidsStoryQuestion(
            id: "helper-68",
            storyID: "adab-quiet-helper",
            ageBand: .age6to8,
            question: "Warum half Yusuf?",
            answers: [
                KidsStoryQuestionAnswer(id: "good", title: "Weil die gute Tat selbst wichtig ist", isCorrect: true),
                KidsStoryQuestionAnswer(id: "praise", title: "Nur damit er gelobt wird", isCorrect: false)
            ],
            successText: "Richtig. Er erwartete keinen Applaus.",
            retryText: "Was sagte Yusuf über gute Taten?"
        ),
        KidsStoryQuestion(
            id: "helper-910",
            storyID: "adab-quiet-helper",
            ageBand: .age9to10,
            question: "Welche Haltung zeigt Yusuf?",
            answers: [
                KidsStoryQuestionAnswer(id: "quiet", title: "Gutes tun ohne Lob zu erwarten", isCorrect: true),
                KidsStoryQuestionAnswer(id: "teacher", title: "Nur helfen, wenn die Lehrerin zusieht", isCorrect: false),
                KidsStoryQuestionAnswer(id: "others", title: "Arbeit immer anderen überlassen", isCorrect: false)
            ],
            successText: "Richtig. Eine gute Tat braucht keinen Applaus.",
            retryText: "Denk an die Botschaft am Ende."
        )
    ]

    static func storyQuestion(for story: KidsStory, ageBand: AgeBand) -> KidsStoryQuestion? {
        storyQuestions.first { $0.storyID == story.id && $0.ageBand == ageBand }
    }

    static let quizQuestions: [KidsQuizQuestion] = [
        KidsQuizQuestion(
            id: "q45-creation",
            ageBand: .age4to5,
            question: "Allah hat den Mond und die Sterne erschaffen. Stimmt das?",
            sceneSymbol: "moon.stars.fill",
            style: .yesNo,
            answers: [
                KidsQuizAnswer(id: "yes", title: "Ja", symbol: "checkmark", isCorrect: true),
                KidsQuizAnswer(id: "no", title: "Nein", symbol: "xmark", isCorrect: false)
            ],
            successText: "Ja. Allah ist der Schöpfer.",
            retryText: "Hör noch einmal gut zu."
        ),
        KidsQuizQuestion(
            id: "q45-eating",
            ageBand: .age4to5,
            question: "Sagen wir vor dem Essen Bismillāh?",
            sceneSymbol: "fork.knife",
            style: .yesNo,
            answers: [
                KidsQuizAnswer(id: "yes", title: "Ja", symbol: "checkmark", isCorrect: true),
                KidsQuizAnswer(id: "no", title: "Nein", symbol: "xmark", isCorrect: false)
            ],
            successText: "Richtig. Vor dem Essen sagen wir Bismillāh.",
            retryText: "Versuch es noch einmal."
        ),
        KidsQuizQuestion(
            id: "q45-honesty",
            ageBand: .age4to5,
            question: "Darf ich etwas behalten, das einem anderen Kind gehört?",
            sceneSymbol: "circle.hexagongrid.fill",
            style: .yesNo,
            answers: [
                KidsQuizAnswer(id: "yes", title: "Ja", symbol: "checkmark", isCorrect: false),
                KidsQuizAnswer(id: "no", title: "Nein", symbol: "xmark", isCorrect: true)
            ],
            successText: "Richtig. Was anderen gehört, geben wir zurück.",
            retryText: "Denk an Ehrlichkeit und versuch es noch einmal."
        ),
        KidsQuizQuestion(
            id: "q45-water",
            ageBand: .age4to5,
            question: "Benutzen wir Wasser für Wuḍūʾ?",
            sceneSymbol: "drop.fill",
            style: .yesNo,
            answers: [
                KidsQuizAnswer(id: "yes", title: "Ja", symbol: "checkmark", isCorrect: true),
                KidsQuizAnswer(id: "no", title: "Nein", symbol: "xmark", isCorrect: false)
            ],
            successText: "Sehr gut. Für Wuḍūʾ benutzen wir Wasser.",
            retryText: "Hör die Frage noch einmal."
        ),
        KidsQuizQuestion(
            id: "q68-salah",
            ageBand: .age6to8,
            question: "Wie viele Pflichtgebete beten Muslime jeden Tag?",
            sceneSymbol: "building.columns.fill",
            style: .choice,
            answers: [
                KidsQuizAnswer(id: "five", title: "Fünf", symbol: "5.circle.fill", isCorrect: true),
                KidsQuizAnswer(id: "two", title: "Zwei", symbol: "2.circle.fill", isCorrect: false)
            ],
            successText: "Richtig. Es sind fünf Pflichtgebete.",
            retryText: "Noch nicht. Hör die Frage noch einmal."
        ),
        KidsQuizQuestion(
            id: "q68-fatiha",
            ageBand: .age6to8,
            question: "Welche Sūrah lesen wir in jeder Rakʿah des Gebets?",
            sceneSymbol: "book.closed.fill",
            style: .choice,
            answers: [
                KidsQuizAnswer(id: "fatiha", title: "al-Fātiḥah", symbol: "book.fill", isCorrect: true),
                KidsQuizAnswer(id: "falaq", title: "al-Falaq", symbol: "sun.max.fill", isCorrect: false)
            ],
            successText: "Richtig. al-Fātiḥah gehört in jede Rakʿah.",
            retryText: "Versuch es noch einmal."
        ),
        KidsQuizQuestion(
            id: "q68-adab",
            ageBand: .age6to8,
            question: "Was ist besser, wenn jemand Hilfe braucht?",
            sceneSymbol: "hand.raised.fill",
            style: .choice,
            answers: [
                KidsQuizAnswer(id: "help", title: "Helfen", symbol: "sparkles", isCorrect: true),
                KidsQuizAnswer(id: "ignore", title: "Wegschauen", symbol: "arrow.up.right", isCorrect: false)
            ],
            successText: "Sehr gut. Wir versuchen zu helfen.",
            retryText: "Denk an gutes Benehmen."
        ),
        KidsQuizQuestion(
            id: "q68-quran",
            ageBand: .age6to8,
            question: "Ist der Qurʾān die Rede Allahs?",
            sceneSymbol: "book.closed.fill",
            style: .yesNo,
            answers: [
                KidsQuizAnswer(id: "yes", title: "Ja", symbol: "checkmark", isCorrect: true),
                KidsQuizAnswer(id: "no", title: "Nein", symbol: "xmark", isCorrect: false)
            ],
            successText: "Richtig. Der Qurʾān ist die Rede Allahs.",
            retryText: "Hör noch einmal genau zu."
        ),
        KidsQuizQuestion(
            id: "q910-fatiha7",
            ageBand: .age9to10,
            question: "Wie viele Āyāt hat Sūrah al-Fātiḥah?",
            sceneSymbol: "book.closed.fill",
            style: .choice,
            answers: [
                KidsQuizAnswer(id: "seven", title: "Sieben", symbol: "7.circle.fill", isCorrect: true),
                KidsQuizAnswer(id: "five", title: "Fünf", symbol: "5.circle.fill", isCorrect: false),
                KidsQuizAnswer(id: "nine", title: "Neun", symbol: "9.circle.fill", isCorrect: false)
            ],
            successText: "Richtig. al-Fātiḥah hat sieben Āyāt.",
            retryText: "Noch nicht. Versuch es erneut."
        ),
        KidsQuizQuestion(
            id: "q910-ikhlas",
            ageBand: .age9to10,
            question: "Welche Sūrah beginnt mit Qul huwa Allāhu aḥad?",
            sceneSymbol: "sparkles",
            style: .choice,
            answers: [
                KidsQuizAnswer(id: "ikhlas", title: "al-Iḫlāṣ", symbol: "book.fill", isCorrect: true),
                KidsQuizAnswer(id: "nas", title: "an-Nās", symbol: "moon.fill", isCorrect: false),
                KidsQuizAnswer(id: "fil", title: "al-Fīl", symbol: "diamond.fill", isCorrect: false)
            ],
            successText: "Richtig. Das ist Sūrah al-Iḫlāṣ.",
            retryText: "Hör die Frage noch einmal."
        ),
        KidsQuizQuestion(
            id: "q910-prayers",
            ageBand: .age9to10,
            question: "Welches Gebet hat drei Farḍ-Rakʿāt?",
            sceneSymbol: "building.columns.fill",
            style: .choice,
            answers: [
                KidsQuizAnswer(id: "maghrib", title: "Maġrib", symbol: "sun.horizon.fill", isCorrect: true),
                KidsQuizAnswer(id: "fajr", title: "Faǧr", symbol: "sunrise.fill", isCorrect: false),
                KidsQuizAnswer(id: "asr", title: "ʿAṣr", symbol: "sun.max.fill", isCorrect: false)
            ],
            successText: "Richtig. Maġrib hat drei Farḍ-Rakʿāt.",
            retryText: "Versuch es noch einmal."
        ),
        KidsQuizQuestion(
            id: "q910-trust",
            ageBand: .age9to10,
            question: "Du findest etwas, das dir nicht gehört. Was ist die richtige Handlung?",
            sceneSymbol: "magnifyingglass.circle.fill",
            style: .choice,
            answers: [
                KidsQuizAnswer(id: "owner", title: "Nach dem Besitzer suchen", symbol: "magnifyingglass", isCorrect: true),
                KidsQuizAnswer(id: "keep", title: "Einfach behalten", symbol: "arrow.down", isCorrect: false),
                KidsQuizAnswer(id: "hide", title: "Verstecken", symbol: "square.fill", isCorrect: false)
            ],
            successText: "Richtig. Ehrlichkeit bedeutet, das Eigentum anderer zu achten.",
            retryText: "Denk an Ehrlichkeit und versuch es noch einmal."
        )
    ]

    static func quizQuestions(for ageBand: AgeBand) -> [KidsQuizQuestion] {
        quizQuestions.filter { $0.ageBand == ageBand }
    }

    static let stories: [KidsStory] = [
        KidsStory(
            id: "adab-found-coin",
            title: "Die gefundene Münze",
            summary: "Eine kurze Geschichte über Ehrlichkeit – auch wenn niemand zusieht.",
            category: "Adab · frei verfasst",
            durationLabel: "ca. 3 Min.",
            narrationText: """
            Auf dem Heimweg entdeckte Adam neben einer Bank eine glänzende Münze. Er hob sie auf und sah sich um. Niemand schien sie zu suchen.

            Für einen Moment dachte Adam: Ich könnte sie einfach behalten. Dann erinnerte er sich daran, dass ein Muslim ehrlich sein soll – nicht nur dann, wenn andere Menschen zuschauen.

            Adam ging zurück zu dem kleinen Laden neben dem Platz. Er fragte den Besitzer, ob jemand nach einer verlorenen Münze gesucht habe. Der Mann lächelte und sagte: Gerade eben war ein älterer Mann hier. Er hatte bemerkt, dass ihm etwas aus der Tasche gefallen war.

            Adam wartete einen Augenblick. Kurz darauf kam der Mann zurück. Als Adam ihm die Münze gab, war der Mann sehr erleichtert.

            Auf dem Heimweg hatte Adam keine neue Münze in der Tasche. Aber er hatte etwas Wertvolleres gelernt: Ehrlichkeit bedeutet, das Richtige zu tun, auch wenn man etwas anderes tun könnte.

            Denk einmal nach: Was würdest du tun, wenn du etwas findest, das dir nicht gehört?
            """,
            audioResource: nil,
            isOriginalStory: true
        ),
        KidsStory(
            id: "adab-water",
            title: "Das Glas Wasser",
            summary: "Eine kleine Geschichte darüber, anderen aufmerksam zu helfen.",
            category: "Adab · frei verfasst",
            durationLabel: "ca. 2 Min.",
            narrationText: """
            Maryam saß mit ihrer Familie am Tisch. Alle unterhielten sich. Da bemerkte sie, dass ihre kleine Schwester nach dem Wasser greifen wollte, aber nicht herankam.

            Maryam hätte einfach weiteressen können. Stattdessen nahm sie die Kanne, schenkte ihrer Schwester ein Glas ein und stellte es vorsichtig vor sie.

            Es war nur eine kleine Handlung. Niemand klatschte. Niemand gab ihr einen Preis. Aber ihre Schwester lächelte.

            Maryam verstand: Gutes Benehmen besteht oft aus kleinen Dingen. Aufmerksam sein. Helfen. Freundlich sprechen. Und nicht immer darauf warten, dass jemand einen darum bittet.

            Welche kleine gute Sache kannst du heute für jemanden tun?
            """,
            audioResource: nil,
            isOriginalStory: true
        ),
        KidsStory(
            id: "adab-quiet-helper",
            title: "Der leise Helfer",
            summary: "Gutes tun, ohne dafür gelobt werden zu müssen.",
            category: "Adab · frei verfasst",
            durationLabel: "ca. 3 Min.",
            narrationText: """
            Nach dem Unterricht lagen einige Bücher und Stifte auf dem Boden. Die meisten Kinder gingen schon zur Tür.

            Yusuf blieb stehen. Ohne etwas zu sagen, sammelte er die Stifte ein und legte die Bücher zurück an ihren Platz.

            Sein Freund fragte: Warum machst du das? Die Lehrerin sieht dich doch gar nicht.

            Yusuf antwortete: Eine gute Sache wird nicht erst gut, wenn jemand mich dafür lobt.

            Gemeinsam räumten beide den Rest auf. Am nächsten Morgen war der Raum ordentlich und niemand wusste, wer geholfen hatte.

            Manchmal sind die schönsten guten Taten diejenigen, für die wir keinen Applaus erwarten.
            """,
            audioResource: nil,
            isOriginalStory: true
        )
    ]

    static let learnCards: [LearnCard] = [
        LearnCard(id: "quran", title: "Mein Qurʾān", subtitle: "hören · wiederholen · lernen", symbol: "book.closed.fill", tintName: "gold"),
        LearnCard(id: "dua", title: "Meine Duʿāʾ", subtitle: "für meinen Alltag", symbol: "hand.raised.fill", tintName: "sky"),
        LearnCard(id: "din", title: "Mein Dīn", subtitle: "kurz und verständlich", symbol: "moon.stars.fill", tintName: "sage"),
        LearnCard(id: "quiz", title: "Quiz", subtitle: "hören · überlegen · antworten", symbol: "questionmark.bubble.fill", tintName: "peach")
    ]
}
