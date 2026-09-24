import Foundation

struct KidsDuaAnswer: Identifiable, Hashable {
    let id: String
    let title: String
    let isCorrect: Bool
}

struct KidsDua: Identifiable, Hashable {
    let id: String
    let ageMin: Int
    let ageMax: Int
    let title: String
    let childPrompt: String
    let arabic: String
    let transliteration: String
    let meaning: String
    let source: String
    let sourceURL: URL?
    let symbol: String
    let scene: String
    let question: String
    let answers: [KidsDuaAnswer]
}

extension AgeBand {
    var numericRange: ClosedRange<Int> {
        switch self {
        case .age4to5: return 4...5
        case .age6to8: return 6...8
        case .age9to10: return 9...10
        }
    }
}

enum KidsDuaContent {
    static let verified: [KidsDua] = [
        KidsDua(
            id: "dua-knowledge",
            ageMin: 4,
            ageMax: 10,
            title: "Wenn ich lerne",
            childPrompt: "Bitte Allah um mehr Wissen.",
            arabic: "رَّبِّ زِدْنِي عِلْمًا",
            transliteration: "Rabbi zidnī ʿilmā.",
            meaning: "Mein Herr, mehre mein Wissen.",
            source: "Qurʾān, Ṭā-Hā 20:114",
            sourceURL: nil,
            symbol: "books.vertical.fill",
            scene: "learn",
            question: "Wann passt dieses Duʿāʾ besonders gut?",
            answers: [
                KidsDuaAnswer(id: "learn", title: "Beim Lernen", isCorrect: true),
                KidsDuaAnswer(id: "hide", title: "Wenn ich etwas verstecken will", isCorrect: false)
            ]
        ),
        KidsDua(
            id: "dua-parents",
            ageMin: 6,
            ageMax: 10,
            title: "Für meine Eltern",
            childPrompt: "Bitte Allah um Vergebung für dich, deine Eltern und die Gläubigen.",
            arabic: "رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ",
            transliteration: "Rabbanā-ghfir lī wa li-wālidayya wa li-l-muʾminīna yawma yaqūmu-l-ḥisāb.",
            meaning: "Unser Herr, vergib mir und meinen Eltern und den Gläubigen am Tag, an dem die Abrechnung stattfindet.",
            source: "Qurʾān, Ibrāhīm 14:41",
            sourceURL: nil,
            symbol: "heart.fill",
            scene: "family",
            question: "Für wen bitten wir in diesem Duʿāʾ auch um Vergebung?",
            answers: [
                KidsDuaAnswer(id: "parents", title: "Für unsere Eltern", isCorrect: true),
                KidsDuaAnswer(id: "self", title: "Nur für uns selbst", isCorrect: false)
            ]
        ),
        KidsDua(
            id: "dua-protection",
            ageMin: 7,
            ageMax: 10,
            title: "Allah um Schutz bitten",
            childPrompt: "Wenn du Schutz vor Einflüsterungen suchst.",
            arabic: "رَبِّ أَعُوذُ بِكَ مِنْ هَمَزَاتِ الشَّيَاطِينِ وَأَعُوذُ بِكَ رَبِّ أَن يَحْضُرُونِ",
            transliteration: "Rabbi aʿūdhu bika min hamazāti-sh-shayāṭīn, wa aʿūdhu bika rabbi an yaḥḍurūn.",
            meaning: "Mein Herr, ich suche Zuflucht bei Dir vor den Einflüsterungen der Shayāṭīn, und ich suche Zuflucht bei Dir, mein Herr, davor, dass sie bei mir anwesend sind.",
            source: "Qurʾān, al-Muʾminūn 23:97–98",
            sourceURL: nil,
            symbol: "moon.stars.fill",
            scene: "night",
            question: "Bei wem suchen wir Schutz?",
            answers: [
                KidsDuaAnswer(id: "allah", title: "Bei Allah", isCorrect: true),
                KidsDuaAnswer(id: "charms", title: "Bei Glücksbringern", isCorrect: false)
            ]
        ),
        KidsDua(
            id: "dua-sleep",
            ageMin: 4,
            ageMax: 10,
            title: "Vor dem Schlafen",
            childPrompt: "Dieses Duʿāʾ sagte der Prophet ﷺ, wenn er sich zum Schlafen legte.",
            arabic: "اللَّهُمَّ بِاسْمِكَ أَحْيَا وَأَمُوتُ",
            transliteration: "Allāhumma bismika aḥyā wa amūt.",
            meaning: "O Allah, in Deinem Namen lebe ich und sterbe ich.",
            source: "Ṣaḥīḥ al-Buḫārī, Nr. 7394",
            sourceURL: URL(string: "https://dorar.net/h/q5F8hPon"),
            symbol: "moon.fill",
            scene: "sleep",
            question: "Wann sagen wir dieses Duʿāʾ?",
            answers: [
                KidsDuaAnswer(id: "sleep", title: "Vor dem Schlafen", isCorrect: true),
                KidsDuaAnswer(id: "play", title: "Vor dem Spielen", isCorrect: false)
            ]
        ),
        KidsDua(
            id: "dua-wake",
            ageMin: 4,
            ageMax: 10,
            title: "Nach dem Aufwachen",
            childPrompt: "Nach dem Aufwachen loben wir Allah.",
            arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
            transliteration: "Al-ḥamdu lillāhi-lladhī aḥyānā baʿda mā amātanā wa ilayhi-n-nushūr.",
            meaning: "Alles Lob gehört Allah, Der uns lebendig gemacht hat, nachdem Er uns sterben ließ; und zu Ihm ist die Auferstehung.",
            source: "Ṣaḥīḥ al-Buḫārī, Nr. 7394",
            sourceURL: URL(string: "https://dorar.net/h/q5F8hPon"),
            symbol: "sun.max.fill",
            scene: "morning",
            question: "Was machen wir mit diesem Duʿāʾ?",
            answers: [
                KidsDuaAnswer(id: "praise", title: "Wir loben Allah nach dem Aufwachen", isCorrect: true),
                KidsDuaAnswer(id: "toy", title: "Wir bitten um ein Spielzeug", isCorrect: false)
            ]
        ),
        KidsDua(
            id: "dua-eating",
            ageMin: 4,
            ageMax: 10,
            title: "Vor dem Essen",
            childPrompt: "Bevor du isst, nenne Allahs Namen.",
            arabic: "بِسْمِ اللَّهِ",
            transliteration: "Bismillāh.",
            meaning: "Im Namen Allahs.",
            source: "Jāmiʿ at-Tirmiḏī, Nr. 1858; Ḥadīṯ ḥasan ṣaḥīḥ",
            sourceURL: URL(string: "https://dorar.net/h/b1RqSELr"),
            symbol: "fork.knife",
            scene: "food",
            question: "Was sagen wir vor dem Essen?",
            answers: [
                KidsDuaAnswer(id: "bismillah", title: "Bismillāh", isCorrect: true),
                KidsDuaAnswer(id: "nothing", title: "Nichts", isCorrect: false)
            ]
        ),
        KidsDua(
            id: "dua-afiyah",
            ageMin: 8,
            ageMax: 10,
            title: "Um Vergebung und Wohlergehen",
            childPrompt: "Eine kurze tägliche Bitte um Vergebung und Wohlergehen.",
            arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ",
            transliteration: "Allāhumma innī asʾaluka-l-ʿafwa wa-l-ʿāfiyata fi-d-dunyā wa-l-ākhirah.",
            meaning: "O Allah, ich bitte Dich um Vergebung und Wohlergehen im Diesseits und im Jenseits.",
            source: "Sunan Abī Dāwūd, Nr. 5074; Sunan Ibn Māǧah, Nr. 3871",
            sourceURL: nil,
            symbol: "sparkles",
            scene: "morning",
            question: "Worum bitten wir Allah in diesem Duʿāʾ?",
            answers: [
                KidsDuaAnswer(id: "afiyah", title: "Um Vergebung und Wohlergehen", isCorrect: true),
                KidsDuaAnswer(id: "better", title: "Darum, besser als andere zu sein", isCorrect: false)
            ]
        )
    ]

    static func available(for ageBand: AgeBand) -> [KidsDua] {
        verified.filter { dua in
            ageBand.numericRange.overlaps(dua.ageMin...dua.ageMax)
        }
    }
}
