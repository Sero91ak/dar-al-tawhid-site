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

enum SampleContent {
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
        LearnCard(id: "dua", title: "Meine Duʿāʾ", subtitle: "für meinen Alltag", symbol: "hands.sparkles.fill", tintName: "sky"),
        LearnCard(id: "din", title: "Mein Dīn", subtitle: "kurz und verständlich", symbol: "moon.stars.fill", tintName: "sage"),
        LearnCard(id: "quiz", title: "Quiz", subtitle: "hören · überlegen · antworten", symbol: "questionmark.bubble.fill", tintName: "peach")
    ]
}
