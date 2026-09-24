import Foundation

struct KidsStoryVersion: Hashable {
    let durationLabel: String
    let narrationText: String
    let readingParagraphs: [String]
}

struct StorySource: Identifiable, Hashable {
    let id: String
    let label: String
    let reference: String
}

struct KidsStory: Identifiable {
    let id: String
    let title: String
    let summary: String
    let category: String
    let coverAsset: String
    let versions: [AgeBand: KidsStoryVersion]
    let audioResources: [AgeBand: String]
    let sources: [StorySource]
    let isOriginalStory: Bool

    func version(for ageBand: AgeBand) -> KidsStoryVersion {
        versions[ageBand]
            ?? versions[.age8to10]
            ?? versions[.age6to7]
            ?? versions[.age4to5]
            ?? KidsStoryVersion(durationLabel: "ca. 3 Min.", narrationText: "", readingParagraphs: [])
    }

    func audioResource(for ageBand: AgeBand) -> String? {
        audioResources[ageBand]
    }
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
            id: "nuh-arche",
            title: "Nūḥ und die Arche",
            summary: "Nūḥ ruft sein Volk zum Tawḥīd, bleibt geduldig und gehorcht Allah.",
            category: "Prophetengeschichte · Qurʾān",
            coverAsset: "StoryNuhArche",
            versions: [
                .age4to5: KidsStoryVersion(
                    durationLabel: "ca. 3 Min.",
                    narrationText: """
                    Nūḥ war ein Prophet Allahs. Allah sandte ihn zu seinem Volk. Nūḥ sagte den Menschen immer wieder: Betet nur Allah an.

                    Viele wollten nicht hören. Trotzdem blieb Nūḥ geduldig. Er sprach am Tag und in der Nacht zu den Menschen und gab nicht einfach auf.

                    Dann befahl Allah Nūḥ, ein großes Schiff zu bauen. Nūḥ gehorchte. Während er baute, machten sich Menschen über ihn lustig. Aber Nūḥ wusste: Allahs Befehl ist wichtiger als das Gerede der Menschen.

                    Als Allahs Befehl kam, stiegen Nūḥ und die Gläubigen in die Arche. Das Wasser stieg und das Schiff fuhr über große Wellen. Allah rettete Nūḥ und die Gläubigen.

                    Später ging das Wasser zurück.

                    Wir lernen: Nūḥ blieb geduldig. Er vertraute Allah und gehorchte Ihm. Auch wenn andere lachen oder etwas nicht verstehen, halten wir uns an das, was Allah liebt.
                    """,
                    readingParagraphs: []
                ),
                .age6to7: KidsStoryVersion(
                    durationLabel: "ca. 4 Min.",
                    narrationText: """
                    Allah sandte den Propheten Nūḥ zu seinem Volk. Seine Botschaft war klar: Die Menschen sollten Allah allein anbeten.

                    Nūḥ rief sie am Tag und in der Nacht. Er erinnerte sie daran, Allah um Vergebung zu bitten. Viele Menschen lehnten seine Botschaft ab. Trotzdem blieb Nūḥ geduldig und verlangte keinen Lohn von ihnen.

                    Später offenbarte Allah ihm, dass nur diejenigen glauben würden, die bereits glaubten. Dann bekam Nūḥ einen besonderen Auftrag: Er sollte unter Allahs Aufsicht eine Arche bauen.

                    Nūḥ begann mit dem Bau. Wenn Menschen vorbeikamen, verspotteten sie ihn. Doch Nūḥ ließ sich nicht davon abhalten. Er wusste, dass Allahs Versprechen wahr ist.

                    Als die Flut kam, stiegen Nūḥ und die Gläubigen in die Arche. Das Schiff fuhr durch gewaltige Wellen. Allah rettete die Gläubigen.

                    Die Geschichte von Nūḥ lehrt uns Tawḥīd, Geduld und Gehorsam. Wahrheit wird nicht falsch, nur weil viele Menschen sie ablehnen.
                    """,
                    readingParagraphs: [
                        "Allah sandte Nūḥ zu seinem Volk. Er rief die Menschen dazu auf, nur Allah anzubeten.",
                        "Viele lehnten seine Botschaft ab. Trotzdem blieb Nūḥ geduldig.",
                        "Allah befahl ihm, eine Arche zu bauen. Als die Flut kam, rettete Allah Nūḥ und die Gläubigen.",
                        "Lehre: Wir vertrauen auf Allah und bleiben beim Richtigen."
                    ]
                ),
                .age8to10: KidsStoryVersion(
                    durationLabel: "ca. 5 Min.",
                    narrationText: """
                    Allah sandte Nūḥ zu seinem Volk mit einer klaren Botschaft: Dient Allah allein. Nūḥ warnte die Menschen davor, andere neben Allah anzubeten.

                    Der Qurʾān berichtet, dass Nūḥ sein Volk am Tag und in der Nacht rief. Er versuchte verschiedene Wege, um sie zu erreichen, und forderte sie auf, Allah um Vergebung zu bitten.

                    Viele aus seinem Volk weigerten sich. Nūḥ verlangte keinen Lohn von ihnen und wies die Gläubigen nicht ab, nur weil andere sie gering achteten.

                    Dann offenbarte Allah Nūḥ, dass niemand mehr glauben würde außer denjenigen, die bereits glaubten. Allah befahl ihm, die Arche unter Seiner Aufsicht zu bauen.

                    Während Nūḥ baute, verspotteten ihn führende Leute seines Volkes. Nūḥ blieb standhaft. Als Allahs Befehl kam, stiegen die Gläubigen in die Arche.

                    Das Schiff fuhr durch Wellen, die im Qurʾān wie Berge beschrieben werden. Einer von Nūḥs Söhnen lehnte es ab, mitzukommen. Er glaubte, ein Berg könne ihn schützen. Nūḥ erklärte ihm, dass niemand vor Allahs Befehl geschützt ist, außer wem Allah Barmherzigkeit erweist.

                    Nach der Flut ließ Allah das Wasser zurückgehen.

                    Diese Geschichte zeigt: Tawḥīd war die zentrale Botschaft Nūḥs. Geduld bedeutet, auch dann am Richtigen festzuhalten, wenn Menschen spotten. Und Verwandtschaft allein rettet niemanden – entscheidend sind Īmān und Gehorsam gegenüber Allah.
                    """,
                    readingParagraphs: [
                        "Nūḥ rief sein Volk zum Tawḥīd. Der Qurʾān berichtet, dass er sie am Tag und in der Nacht zu Allah rief.",
                        "Viele lehnten ihn ab. Allah befahl ihm schließlich, die Arche unter Seiner Aufsicht zu bauen.",
                        "Während des Baus wurde Nūḥ verspottet. Er blieb trotzdem gehorsam und standhaft.",
                        "Als die Flut kam, rettete Allah Nūḥ und die Gläubigen.",
                        "Lehre: Tawḥīd, Geduld, Gehorsam und Vertrauen auf Allah stehen über der Meinung der Menschen."
                    ]
                )
            ],
            audioResources: [:],
            sources: [
                StorySource(id: "nuh-11", label: "Qurʾān", reference: "Hūd 11:25–49"),
                StorySource(id: "nuh-71", label: "Qurʾān", reference: "Nūḥ 71:1–28")
            ],
            isOriginalStory: false
        ),
        KidsStory(
            id: "ibrahim-feuer",
            title: "Ibrāhīm und das Feuer",
            summary: "Ibrāhīm hält am Tawḥīd fest und Allah macht das Feuer kühl und sicher.",
            category: "Prophetengeschichte · Qurʾān",
            coverAsset: "StoryIbrahimFeuer",
            versions: [
                .age4to5: KidsStoryVersion(
                    durationLabel: "ca. 3 Min.",
                    narrationText: """
                    Ibrāhīm war ein Prophet Allahs. Er wusste, dass nur Allah angebetet werden darf.

                    Sein Volk betete Götzen an. Ibrāhīm wollte ihnen zeigen, dass diese Götzen nicht sprechen und niemandem helfen können.

                    Als die Menschen sahen, dass ihre Götzen zerbrochen waren, wurden sie sehr wütend. Statt Allah allein anzubeten, wollten sie Ibrāhīm bestrafen.

                    Sie beschlossen, ihn in ein großes Feuer zu werfen.

                    Aber Allah ist der Herr über alles. Allah befahl dem Feuer, für Ibrāhīm kühl und sicher zu sein. Das Feuer schadete ihm nicht.

                    Wir lernen: Nur Allah verdient Anbetung. Ibrāhīm blieb bei der Wahrheit, auch als andere gegen ihn waren. Und er vertraute darauf, dass Allah ihn beschützen kann.
                    """,
                    readingParagraphs: []
                ),
                .age6to7: KidsStoryVersion(
                    durationLabel: "ca. 4 Min.",
                    narrationText: """
                    Ibrāhīm rief sein Volk zum Tawḥīd. Er erklärte ihnen, dass ihre Götzen nicht hören, nicht sprechen und niemandem helfen können.

                    Der Qurʾān berichtet, dass Ibrāhīm die Götzen zerbrach und den größten stehen ließ. Als die Menschen zurückkamen, fragten sie, wer das getan hatte.

                    Ibrāhīm machte ihnen klar, dass ihre Götzen nicht einmal sprechen konnten. Für einen Moment erkannten die Menschen ihren Fehler. Trotzdem wollten sie ihre Gewohnheit nicht aufgeben.

                    Statt die Wahrheit anzunehmen, beschlossen sie, Ibrāhīm zu verbrennen.

                    Doch Allah befahl dem Feuer, für Ibrāhīm kühl und sicher zu sein. So rettete Allah Seinen Propheten.

                    Die Geschichte zeigt: Nur Allah wird angebetet. Eine Gewohnheit wird nicht richtig, nur weil viele Menschen sie tun. Ibrāhīm blieb mutig und vertraute auf Allah.
                    """,
                    readingParagraphs: [
                        "Ibrāhīm rief sein Volk dazu auf, Allah allein anzubeten.",
                        "Er zeigte ihnen, dass ihre Götzen weder sprechen noch helfen können.",
                        "Die Menschen wollten Ibrāhīm verbrennen. Allah machte das Feuer für ihn kühl und sicher.",
                        "Lehre: Tawḥīd und Wahrheit stehen über blinder Gewohnheit."
                    ]
                ),
                .age8to10: KidsStoryVersion(
                    durationLabel: "ca. 5 Min.",
                    narrationText: """
                    Ibrāhīm lebte unter Menschen, die Götzen verehrten. Im Qurʾān fragte er sein Volk, warum sie sich diesen Bildwerken hingaben. Ihre Antwort war, dass sie ihre Vorfahren dabei gefunden hatten.

                    Ibrāhīm machte ihnen deutlich, dass Tradition allein kein Beweis für Wahrheit ist.

                    Der Qurʾān berichtet, dass Ibrāhīm die Götzen zerbrach und den größten von ihnen stehen ließ. Als sein Volk zurückkam, war es empört.

                    Ibrāhīm lenkte ihre Aufmerksamkeit darauf, dass die Götzen nicht einmal sprechen konnten. Für einen Moment erkannten die Menschen selbst, dass sie im Unrecht waren. Doch sie kehrten zu ihrer Ablehnung zurück.

                    Schließlich beschlossen sie, Ibrāhīm zu verbrennen und damit ihre Götter zu unterstützen.

                    Allah machte ihren Plan zunichte. Er befahl dem Feuer, kühl und sicher für Ibrāhīm zu sein. Das Feuer gehorchte seinem Schöpfer.

                    Die Geschichte enthält starke Lehren: Tawḥīd bedeutet, Allah allein anzubeten. Alte Gewohnheit ist kein Beweis. Und die Schöpfung besitzt keine unabhängige Macht neben Allah. Ibrāhīm blieb klar und standhaft, obwohl die Mehrheit gegen ihn stand.
                    """,
                    readingParagraphs: [
                        "Ibrāhīm stellte den Götzendienst seines Volkes in Frage. Die Menschen beriefen sich auf ihre Vorfahren.",
                        "Er zeigte ihnen, dass die Götzen weder sprechen noch sich selbst schützen konnten.",
                        "Trotzdem beschlossen die Menschen, Ibrāhīm zu verbrennen.",
                        "Allah befahl dem Feuer, kühl und sicher zu sein.",
                        "Lehre: Wahrheit wird durch Beweise erkannt, nicht durch die Zahl ihrer Anhänger."
                    ]
                )
            ],
            audioResources: [:],
            sources: [
                StorySource(id: "ibrahim-21", label: "Qurʾān", reference: "al-Anbiyāʾ 21:51–70")
            ],
            isOriginalStory: false
        ),
        KidsStory(
            id: "musa-meer",
            title: "Mūsā und das Meer",
            summary: "Mūsā vertraut auf Allah, und Allah öffnet einen Weg durch das Meer.",
            category: "Prophetengeschichte · Qurʾān",
            coverAsset: "StoryMusaMeer",
            versions: [
                .age4to5: KidsStoryVersion(
                    durationLabel: "ca. 3 Min.",
                    narrationText: """
                    Mūsā war ein Prophet Allahs. Allah befahl ihm, mit den gläubigen Menschen in der Nacht aufzubrechen.

                    Firʿawn und seine Soldaten verfolgten sie.

                    Bald standen die Gläubigen vor dem Meer. Hinter ihnen kamen die Verfolger immer näher. Einige hatten Angst.

                    Mūsā vertraute auf Allah. Er wusste, dass Allah ihn führen würde.

                    Dann befahl Allah Mūsā, mit seinem Stock auf das Meer zu schlagen. Mūsā gehorchte.

                    Das Meer teilte sich. Zwischen den Wassermassen entstand ein Weg. Mūsā und die Gläubigen gingen sicher hindurch.

                    Allah rettete sie.

                    Wir lernen: Auch wenn etwas sehr schwierig aussieht, ist Allah zu allem fähig. Wir tun das Richtige, gehorchen Allah und vertrauen auf Ihn.
                    """,
                    readingParagraphs: []
                ),
                .age6to7: KidsStoryVersion(
                    durationLabel: "ca. 4 Min.",
                    narrationText: """
                    Allah befahl Mūsā, mit Banū Isrāʾīl in der Nacht aufzubrechen. Mūsā gehorchte und führte die Gläubigen fort.

                    Firʿawn sammelte seine Leute und verfolgte sie. Vor Mūsā und den Gläubigen lag das Meer, hinter ihnen kam die Armee immer näher.

                    Einige fürchteten, nun eingeholt zu werden. Mūsā blieb voller Vertrauen auf Allah. Er wusste, dass sein Herr ihn rechtleiten würde.

                    Allah offenbarte ihm, mit seinem Stock auf das Meer zu schlagen. Mūsā gehorchte. Das Meer teilte sich und ein trockener Weg entstand.

                    Mūsā und die Gläubigen gingen hindurch. Firʿawn und seine Leute folgten. Allah rettete die Gläubigen.

                    Die Geschichte zeigt: Tawakkul bedeutet nicht, nichts zu tun. Mūsā handelte nach Allahs Befehl und vertraute dabei auf Allah.
                    """,
                    readingParagraphs: [
                        "Mūsā führte die Gläubigen auf Allahs Befehl fort. Firʿawn verfolgte sie.",
                        "Vor ihnen lag das Meer. Mūsā vertraute darauf, dass Allah ihn führen würde.",
                        "Allah ließ das Meer auseinandergehen und die Gläubigen gingen sicher hindurch.",
                        "Lehre: Wir handeln richtig und vertrauen dabei auf Allah."
                    ]
                ),
                .age8to10: KidsStoryVersion(
                    durationLabel: "ca. 5 Min.",
                    narrationText: """
                    Allah hatte Mūsā zu Firʿawn gesandt. Firʿawn blieb hochmütig und unterdrückte Banū Isrāʾīl.

                    Schließlich befahl Allah Mūsā, Seine Diener in der Nacht fortzuführen. Mūsā gehorchte und zog mit ihnen weg.

                    Firʿawn verfolgte sie mit seinen Truppen. Als beide Gruppen einander sehen konnten, gerieten einige aus Mūsās Begleitung in Sorge. Vor ihnen lag das Meer, hinter ihnen rückte die Armee näher.

                    Mūsā antwortete mit Tawakkul. Im Qurʾān erklärt er sinngemäß, dass sein Herr mit ihm sei und ihn rechtleiten werde.

                    Darauf offenbarte Allah ihm, mit seinem Stock auf das Meer zu schlagen. Mūsā gehorchte. Das Meer teilte sich. Der Qurʾān beschreibt die getrennten Wassermassen wie gewaltige Berge.

                    Mūsā und die Gläubigen gingen hindurch. Firʿawn und seine Truppen folgten. Allah rettete Mūsā und diejenigen mit ihm.

                    Diese Geschichte zeigt, wie Īmān, Gehorsam und Tawakkul zusammengehören. Der Stock selbst besaß keine besondere Kraft. Allah war es, der das Meer teilte.

                    Wir nutzen erlaubte Mittel, aber unser Herz hängt nicht an den Mitteln. Es vertraut auf Allah.
                    """,
                    readingParagraphs: [
                        "Mūsā führte Banū Isrāʾīl auf Allahs Befehl in der Nacht fort. Firʿawn verfolgte sie.",
                        "Vor ihnen lag das Meer. Mūsā blieb überzeugt, dass Allah ihn rechtleiten würde.",
                        "Allah befahl ihm, mit seinem Stock auf das Meer zu schlagen. Das Meer teilte sich.",
                        "Mūsā und die Gläubigen gingen hindurch und Allah rettete sie.",
                        "Lehre: Tawakkul verbindet Vertrauen auf Allah mit Gehorsam und richtigem Handeln."
                    ]
                )
            ],
            audioResources: [:],
            sources: [
                StorySource(id: "musa-20", label: "Qurʾān", reference: "Ṭā-Hā 20:77–79"),
                StorySource(id: "musa-26", label: "Qurʾān", reference: "aš-Šuʿarāʾ 26:52–68")
            ],
            isOriginalStory: false
        ),
        KidsStory(
            id: "yusuf-geduld",
            title: "Yūsuf und die Geduld",
            summary: "Yūsuf erlebt schwere Prüfungen, bleibt Allah treu und vergibt seinen Brüdern.",
            category: "Prophetengeschichte · Qurʾān",
            coverAsset: "StoryYusufGeduld",
            versions: [
                .age4to5: KidsStoryVersion(
                    durationLabel: "ca. 4 Min.",
                    narrationText: """
                    Yūsuf war ein Prophet Allahs. Als er jung war, erzählte er seinem Vater von einem besonderen Traum.

                    Einige seiner Brüder wurden eifersüchtig. Sie nahmen Yūsuf mit und warfen ihn in einen Brunnen.

                    Doch Allah ließ Yūsuf nicht verloren gehen. Reisende kamen vorbei und fanden ihn. So kam Yūsuf später nach Ägypten.

                    Dort wurde Yūsuf erneut geprüft. Jemand wollte ihn zu etwas Falschem bringen. Yūsuf suchte Schutz bei Allah und wollte die Sünde nicht tun.

                    Später kam Yūsuf ins Gefängnis, obwohl er nichts Böses tun wollte. Auch dort vergaß er Allah nicht.

                    Allah gab Yūsuf Wissen. Später bekam er eine wichtige Aufgabe im Land.

                    Viele Jahre danach traf Yūsuf seine Brüder wieder. Sie wussten nun, dass sie ihm Unrecht getan hatten. Yūsuf vergab ihnen.

                    Wir lernen: Schwierige Zeiten bedeuten nicht, dass Allah einen Menschen vergessen hat. Yūsuf blieb geduldig, hielt sich von Sünde fern und vergab, als er dazu in der Lage war.
                    """,
                    readingParagraphs: []
                ),
                .age6to7: KidsStoryVersion(
                    durationLabel: "ca. 5 Min.",
                    narrationText: """
                    Yūsuf erzählte seinem Vater Yaʿqūb von einem besonderen Traum. Einige seiner Brüder wurden eifersüchtig.

                    Sie beschlossen, Yūsuf in einen Brunnen zu werfen. Später kamen Reisende vorbei und fanden ihn. So kam Yūsuf nach Ägypten.

                    Als er älter wurde, gab Allah ihm Wissen und Urteilskraft. Dann wurde Yūsuf zu einer Sünde verleitet. Er suchte Schutz bei Allah und hielt sich vom Verbotenen fern.

                    Später kam Yūsuf ins Gefängnis. Auch dort nutzte er die Gelegenheit, um zum Tawḥīd zu rufen. Er erklärte anderen, dass die Anbetung Allah allein gehört.

                    Der König hatte später einen besonderen Traum. Yūsuf deutete ihn und gab einen klugen Plan für die kommenden Jahre.

                    Yūsuf wollte seine Unschuld klären lassen. Danach erhielt er eine wichtige Verantwortung im Land.

                    Später kamen seine Brüder zu ihm. Am Ende gab Yūsuf sich zu erkennen. Seine Brüder wussten, dass sie Unrecht getan hatten. Yūsuf entschied sich für Vergebung.

                    Diese Geschichte zeigt Geduld, Reinheit, Tawḥīd und Vergebung.
                    """,
                    readingParagraphs: [
                        "Yūsufs Brüder wurden eifersüchtig und warfen ihn in einen Brunnen.",
                        "Yūsuf kam nach Ägypten und wurde später schwer geprüft. Er blieb Allah treu.",
                        "Im Gefängnis rief Yūsuf zum Tawḥīd. Später erhielt er eine wichtige Aufgabe.",
                        "Als seine Brüder wiederkamen, vergab Yūsuf ihnen."
                    ]
                ),
                .age8to10: KidsStoryVersion(
                    durationLabel: "ca. 6 Min.",
                    narrationText: """
                    Sūrat Yūsuf erzählt eine zusammenhängende Geschichte voller Prüfungen und Lehren.

                    Yūsuf sah als junger Mensch im Traum elf Sterne sowie Sonne und Mond. Sein Vater Yaʿqūb erkannte die besondere Bedeutung und riet ihm, den Traum nicht seinen Brüdern zu erzählen.

                    Einige Brüder waren eifersüchtig. Sie warfen Yūsuf schließlich in einen Brunnen. Reisende fanden ihn und nahmen ihn mit. So gelangte Yūsuf nach Ägypten.

                    Dort wuchs er heran, und Allah gab ihm Urteilskraft und Wissen. Dann wurde Yūsuf mit einer schweren Versuchung geprüft. Die Frau des Hauses wollte ihn zu einer Sünde verleiten. Yūsuf suchte Schutz bei Allah und hielt sich vom Verbotenen fern.

                    Yūsuf kam später ins Gefängnis. Dort traf er zwei Männer, die Träume gesehen hatten. Bevor er ihre Träume erklärte, nutzte er die Gelegenheit für Daʿwah und rief sie zum Tawḥīd.

                    Später hatte der König einen Traum. Yūsuf deutete ihn und erklärte, dass zunächst Jahre guter Ernte kommen würden und danach schwere Jahre. Er gab auch einen Plan, wie Vorräte bewahrt werden sollten.

                    Als der König Yūsuf aus dem Gefängnis holen wollte, bestand Yūsuf zunächst darauf, dass die frühere Beschuldigung geklärt wurde. Seine Unschuld wurde deutlich.

                    Danach erhielt Yūsuf Verantwortung im Land. Später kamen seine Brüder zu ihm. Nach mehreren Begegnungen gab Yūsuf sich zu erkennen. Die Brüder wussten nun, dass sie ihm Unrecht getan hatten.

                    Yūsuf hätte sich rächen können. Stattdessen vergab er ihnen.

                    Die Geschichte zeigt verschiedene Formen von Ṣabr: Geduld bei Unrecht, Geduld gegenüber Versuchung, Geduld in Gefangenschaft und Geduld in Macht. Sie zeigt außerdem, dass Tawḥīd auch in schwierigen Situationen nicht zu einem Nebenthema wird.
                    """,
                    readingParagraphs: [
                        "Yūsufs Brüder waren eifersüchtig und warfen ihn in einen Brunnen. Reisende fanden ihn und brachten ihn nach Ägypten.",
                        "Yūsuf hielt sich von einer schweren Sünde fern und kam später ins Gefängnis.",
                        "Im Gefängnis rief er zum Tawḥīd und deutete Träume. Später deutete er auch den Traum des Königs.",
                        "Nachdem seine Unschuld deutlich geworden war, erhielt Yūsuf Verantwortung im Land.",
                        "Als er seine Brüder wiedertraf, vergab er ihnen. Die Geschichte zeigt Ṣabr, Tawḥīd, Reinheit und Vergebung."
                    ]
                )
            ],
            audioResources: [:],
            sources: [
                StorySource(id: "yusuf-12", label: "Qurʾān", reference: "Yūsuf 12:4–101")
            ],
            isOriginalStory: false
        )
    ]

    static let learnCards: [LearnCard] = [
        LearnCard(id: "quran", title: "Mein Qurʾān", subtitle: "hören · wiederholen · lernen", symbol: "book.closed.fill", tintName: "gold"),
        LearnCard(id: "dua", title: "Meine Duʿāʾ", subtitle: "für meinen Alltag", symbol: "hands.sparkles.fill", tintName: "sky"),
        LearnCard(id: "din", title: "Mein Dīn", subtitle: "kurz und verständlich", symbol: "moon.stars.fill", tintName: "sage"),
        LearnCard(id: "quiz", title: "Quiz", subtitle: "hören · überlegen · antworten", symbol: "questionmark.bubble.fill", tintName: "peach")
    ]
}
