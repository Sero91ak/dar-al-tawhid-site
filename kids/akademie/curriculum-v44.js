/* DĀR AL TAWḤĪD KIDS AKADEMI · V44
 * Individuelle altersbezogene Quizkorrekturen Slots 159–165, 167–170.
 * Quellengeprüfte Fiqh-Lektion 166 bleibt unverändert. KEINE FREIGABE.
 */
(function(){
"use strict";
const prior=window.DARKidsAcademyCurriculum;
if(!prior||!window.DARKidsAcademyCurriculumV43)throw Error("V44 requires V43");
const c=(prompt,right,wrong,hint,explain,pos=0)=>({type:"choice",prompt,options:pos?[wrong,right]:[right,wrong],correct:pos,hint,explain});
const t=(prompt,sample,hint,explain)=>({type:"text",prompt,sample,hint,explain});
const revisions={
"tawhid-allah-allein-danken":{
"4-5":[
c("Dir gelingt etwas Schönes. Wem danken wir für Seine Gaben?","Allah.","Einem ausgedachten Gott.","Denke an unseren Schöpfer.","Mā schāʾ Allāh! Allah verdient unseren Dank."),
c("Jemand hat dir geholfen. Was kannst du ihm sagen?","Danke.","Das war nichts, geh weg.","Wir danken auch den Menschen.","Allāhumma bārik! Du bist freundlich.",1)],
"6-8":[
c("Was erinnert Qurʾān 16:53 über unsere Gaben?","Die Gaben, die wir haben, kommen von Allah.","Alle Gaben kommen nur aus unserer Kraft.","Denke an Allahs Gnade.","Mā schāʾ Allāh! Wir erkennen Allahs Gaben."),
c("Du schaffst eine Aufgabe und jemand hat dir geholfen. Was passt?","Allah danken und auch der helfenden Person danken.","Die Hilfe anderer verleugnen.","Beides passt zusammen.","Richtig! Dankbarkeit schließt andere Menschen nicht aus.",1),
t("Nenne etwas Schönes von heute und eine passende Form des Dankes.","Ich konnte lernen und sage Allah dafür Dank; meiner Lehrperson sage ich Danke.","Ein kleines Beispiel genügt.","Allāhumma bārik! Du siehst das Gute.")],
"9-10":[
t("Welche Aussage über Gaben steht in Qurʾān 16:53?","Was wir an Gnade haben, ist von Allah; in Not rufen die Menschen zu Ihm.","Nenne den Inhalt des Verses.","Mā schāʾ Allāh! Du kennst die Stelle."),
c("Was wäre ein falscher Gegensatz?","Ich muss mich zwischen Dank an Allah und Dank an einen menschlichen Helfer entscheiden.","Ich kann Allah danken und Menschen danken.","Beides gehört zu einem respektvollen Umgang.","Richtig! Gute Umgangsformen bleiben bestehen."),
t("Wie unterscheidest du den Vers von unserem Schulbeispiel?","Der Vers lehrt die Herkunft der Gaben von Allah; die gelungene Schulaufgabe ist unser Beispiel für Dankbarkeit.","Quelle und Beispiel trennen.","Allāhumma bārik! Du bleibst genau.")]
},
"iman-gute-taten-verantwortung":{
"4-5":[
c("Du versprichst, dein Heft einzupacken. Was ist gut?","Ich packe es ein.","Ich werfe es absichtlich weg.","Tu, was du zusagst.","Mā schāʾ Allāh! Du hältst dein kleines Versprechen."),
c("Wenn du etwas vergessen hast, was hilft?","Ehrlich sagen und es nachholen, wenn möglich.","Lügen und andere beschuldigen.","Ein Fehler kann verbessert werden.","Allāhumma bārik! Ehrlichkeit ist gut.",1)],
"6-8":[
c("Welche Handlungen nennt Qurʾān 2:177 neben dem Glauben?","Unter anderem Hilfe, Gebet, Zakāh und das Halten von Versprechen.","Nur das Sammeln von Spielsachen.","Achte auf Handeln und Glauben.","Mā schāʾ Allāh! Güte zeigt sich auch in Taten."),
c("Du hast versprochen, jemandem das Buch zurückzugeben. Was ist verantwortungsvoll?","Es zurückgeben oder ehrlich um mehr Zeit bitten.","Es verstecken und behaupten, du hättest es nie gehabt.","Zusage und Ehrlichkeit.","Richtig! Verantwortung darf ehrlich sein.",1),
t("Nenne ein kleines Versprechen, das du heute halten kannst.","Ich räume nach dem Malen meine Stifte auf.","Wähle etwas Machbares.","Allāhumma bārik! Das ist konkret.")],
"9-10":[
t("Was zeigt Qurʾān 2:177 über das Verhältnis von Glauben und Verhalten?","Der Vers erwähnt Glaubensgrundlagen und konkrete gute Handlungen, etwa Hilfe und das Halten von Versprechen.","Nenne beide Seiten.","Mā schāʾ Allāh! Du erkennst den Zusammenhang."),
c("Welche Haltung passt NICHT zur Lektion?","Große Versprechen machen, die man bewusst nie einhalten möchte.","Eine kleine Zusage sorgfältig erfüllen.","Zuverlässigkeit zählt.","Richtig! Eine kleine verlässliche Handlung ist besser."),
t("Warum ist das Einpacken eines Hefts nur eine Unterrichtsübung?","Der Vers nennt allgemein gute Taten und das Einhalten von Versprechen; das Heft ist unser Alltagsbeispiel.","Allgemeine Lehre und Beispiel unterscheiden.","Allāhumma bārik! Das ist sauber getrennt.")]
},
"ikhlas-aufrichtigkeit-aussenwirkung":{
"4-5":[
c("Du hilfst beim Aufräumen. Was ist schön?","Du hilfst, auch wenn niemand klatscht.","Du hilfst nur, wenn alle dich anschauen.","Eine gute Tat braucht keinen Applaus.","Mā schāʾ Allāh! Du hilfst freundlich."),
c("Was solltest du nach dem Helfen vermeiden?","Andere kleinmachen.","Jemandem Danke sagen.","Gute Taten sind kein Wettbewerb.","Allāhumma bārik! Du behandelst andere gut.",1)],
"6-8":[
c("Wovor warnt Qurʾān 2:264 im Zusammenhang mit Gaben?","Andere durch Vorhaltung oder verletzende Worte herabzusetzen.","Freundlich und diskret zu helfen.","Achte auf die verletzende Vorhaltung.","Mā schāʾ Allāh! Gutes Tun und gute Worte gehören zusammen."),
c("Warum hilfst du besser nicht nur für Lob?","Weil die Absicht wichtig ist und Hilfe nicht zum Prahlen dient.","Weil wir andere später daran erinnern sollen, wie viel sie uns schulden.","Denke an Ikhlāṣ.","Richtig! Aufrichtigkeit bedeutet nicht prahlen.",1),
t("Wie hilfst du einem Kind, ohne es vor anderen bloßzustellen?","Ich reiche ihm unauffällig ein Blatt und verlange keinen Dank vor der Gruppe.","Kleine Rücksicht genügt.","Allāhumma bārik! So hilfst du mit Würde.")],
"9-10":[
t("Was kritisiert der gelesene Vers Qurʾān 2:264?","Gaben durch verletzende Vorhaltung zunichtemachen und aus Ansehen handeln.","Nenne Handlung und Absicht.","Mā schāʾ Allāh! Du kennst beide Aspekte."),
c("Welche Aussage überschreitet die Möglichkeit der Lehrperson?","Sie könne mit Sicherheit die verborgene Absicht jedes Kindes bestimmen.","Man kann über eigenes Verhalten nachdenken.","Nur Allah kennt die inneren Absichten vollkommen.","Richtig! Wir verurteilen niemandes verborgenes Herz."),
t("Warum ist unser Aufräumbeispiel keine genaue Verserzählung?","Der Vers spricht von Gaben, Vorhaltung und Absicht; die Aufräumsituation ist eine kindgerechte Anwendung.","Quelle und Didaktik unterscheiden.","Allāhumma bārik! Du erklärst nachvollziehbar.")]
},
"akhlaq-ruhig-beim-verlieren":{
"4-5":[
c("Du hast ein Spiel verloren. Was kannst du freundlich sagen?","Gut gespielt.","Ihr seid alle gemein.","Wir können ruhig sprechen.","Mā schāʾ Allāh! Das ist fair."),
c("Darfst du enttäuscht sein?","Ja, und trotzdem freundlich bleiben.","Nein, du musst so tun, als ob du nichts fühlst.","Gefühle sind erlaubt.","Allāhumma bārik! Freundlich sein und traurig sein geht zusammen.",1)],
"6-8":[
c("Welche Stärke nennt Qurʾān 3:134?","Den Zorn zurückhalten und anderen verzeihen.","Immer laut werden, wenn man verliert.","Denk an Selbstbeherrschung.","Mā schāʾ Allāh! Wut muss niemanden verletzen."),
c("Du ärgerst dich über das Spielergebnis. Was hilft?","Kurz durchatmen und respektvoll sprechen.","Das Spielzeug werfen.","Sicherheit geht vor.","Richtig! Ruhig werden ist eine gute Übung.",1),
t("Formuliere einen freundlichen Satz nach einem verlorenen Spiel.","Gut gespielt! Ich war enttäuscht, aber ich versuche es noch einmal.","Du darfst dein Gefühl nennen.","Allāhumma bārik! Das ist ehrlich und höflich.")],
"9-10":[
t("Welche Eigenschaften der Menschen werden in Qurʾān 3:134 hervorgehoben?","Sie geben in verschiedenen Lebenslagen, beherrschen ihren Zorn und verzeihen.","Nenne die im Vers enthaltenen Eigenschaften.","Mā schāʾ Allāh! Das passt genau."),
c("Was wäre ein falsches Unterrichtsziel?","Kinder müssten Enttäuschung grundsätzlich verstecken und dürften nie Hilfe holen.","Kinder können mit Ärger umgehen, ohne zu verletzen.","Gefühle sind nicht dasselbe wie schädliches Handeln.","Richtig! Emotionsregulation ist kein Schweigegebot."),
t("Wie unterscheidest du den Vers vom Beispiel mit einem Brettspiel?","Der Vers nennt Tugenden; das Brettspiel ist nur die gewählte Alltagssituation, um ruhiges Verhalten zu üben.","Vers und Beispiel auseinanderhalten.","Allāhumma bārik! Das ist klar.")]
},
"adab-nach-dem-essen-dankbar":{
"4-5":[
c("Du hast gegessen. Was passt?","Wir sind dankbar.","Wir werfen absichtlich mit dem Essen.","Denke an Allahs Gaben.","Mā schāʾ Allāh! Dankbarkeit ist schön."),
c("Wie kannst du beim Abräumen helfen?","Einen leichten Teller tragen, wenn Erwachsene es erlauben.","Heißes Geschirr ohne Hilfe tragen.","Achte auf deine Sicherheit.","Allāhumma bārik! Du hilfst vorsichtig.",1)],
"6-8":[
c("Was fordert Qurʾān 16:114 im Zusammenhang mit Essen?","Erlaubtes und Gutes essen und Allah für Seine Gaben danken.","Lebensmittel verachten.","Denk an Essen und Dank.","Mā schāʾ Allāh! Der Vers erinnert an Dankbarkeit."),
c("Die Eltern bitten dich, einen leichten Becher zu bringen. Was machst du?","Du hilfst ruhig, wenn es sicher ist.","Du greifst nach heißen Töpfen.","Nur sichere Hilfe ist sinnvoll.","Richtig! Rücksicht und Sicherheit passen zusammen.",1),
t("Nenne eine Form, Dankbarkeit nach dem Essen zu zeigen.","Ich danke Allah und helfe beim Abräumen, wenn es möglich ist.","Eine kleine Handlung genügt.","Allāhumma bārik! Das ist freundlich.")],
"9-10":[
t("Welche zwei Gedanken verbindet Qurʾān 16:114?","Erlaubte und gute Nahrung und Dankbarkeit gegenüber Allah.","Nenne beide Aspekte.","Mā schāʾ Allāh! Du verstehst die Verbindung."),
c("Welche Behauptung ist aus dieser Stelle allein nicht belegt?","Eine bestimmte fest vorgeschriebene Nach-dem-Essen-Formel mit genauer Hadithnummer.","Dass wir für Allahs Gaben dankbar sein sollen.","Ein Ritual braucht eigenen Nachweis.","Richtig! Eine genaue Formel darf nicht erfunden werden."),
t("Warum ist ruhiges Abräumen eine Übung, kein Verswortlaut?","Der Vers fordert zum Dank auf; das Abräumen ist eine zusätzliche Umgangsübung für die Familie.","Quelle und Anwendung trennen.","Allāhumma bārik! Du bist quellentreu.")]
},
"tarbiyah-nach-fehlern-weiterlernen":{
"4-5":[
c("Ein Wort ist falsch geschrieben. Was kannst du machen?","Ich versuche es ruhig noch einmal.","Ich darf nie wieder lernen.","Fehler sind erlaubt.","Mā schāʾ Allāh! Ein neuer Versuch hilft."),
c("Wenn die Aufgabe schwer ist, darfst du Hilfe holen?","Ja.","Nein, niemand darf mir helfen.","Zusammen lernen ist gut.","Allāhumma bārik! Du darfst fragen.",1)],
"6-8":[
c("Was wiederholt Qurʾān 94:5–6?","Mit der Schwierigkeit kommt Erleichterung.","Nach einem Fehler ist alles hoffnungslos.","Achte auf die Wiederholung.","Mā schāʾ Allāh! Der Vers ermutigt."),
c("Ein Wort gelingt nicht. Was ist eine gute Reaktion?","Langsam üben und um Hilfe fragen, wenn nötig.","Das Heft zerreißen.","Ein zweiter Versuch kann helfen.","Richtig! Du darfst dazulernen.",1),
t("Welche kleine Hilfe möchtest du beim nächsten Fehler nutzen?","Ich lese das Wort langsam und frage meine Lehrperson.","Ein erreichbarer Schritt reicht.","Allāhumma bārik! Das ist ein guter Plan.")],
"9-10":[
t("Welche Aussage steht in Qurʾān 94:5–6 zweimal?","Mit der Schwierigkeit kommt Erleichterung.","Nenne den wiederholten Sinn.","Mā schāʾ Allāh! Du kennst die Verse."),
c("Was wäre eine unzulässige Garantie aus diesem Vers?","Jede Schulaufgabe werde sofort und ohne weiteres Lernen gelöst.","Wir dürfen auf Erleichterung hoffen.","Hoffnung ist keine bestimmte Frist.","Richtig! Der Vers ist keine Notengarantie."),
t("Wie überträgst du die Verse auf einen Lernfehler, ohne die Quelle zu verändern?","Die Verse ermutigen zu Hoffnung; ich mache deshalb einen neuen Versuch und frage bei Bedarf nach Hilfe.","Trenne Bedeutung und persönliche Übung.","Allāhumma bārik! Du handelst sinnvoll.")]
},
"nafs-nicht-jeden-wunsch-sofort":{
"4-5":[
c("Du möchtest sofort ein neues Spielzeug. Was ist gut?","Ich frage ruhig und warte auf eine Antwort.","Ich reiße es aus dem Regal.","Warten darf man üben.","Mā schāʾ Allāh! Du fragst höflich."),
c("Darfst du enttäuscht sein, wenn es heute nicht geht?","Ja.","Nein, ich muss immer glücklich tun.","Deine Gefühle sind erlaubt.","Allāhumma bārik! Du kannst trotzdem freundlich bleiben.",1)],
"6-8":[
c("Wozu mahnt Qurʾān 17:29 mit dem Bild der Hand?","Zu einem maßvollen Umgang, nicht zu Geiz oder Maßlosigkeit.","Zu jedem Kauf, den man spontan möchte.","Achte auf beide Extreme.","Mā schāʾ Allāh! Der Vers mahnt zur Mitte."),
c("Du möchtest ein Spielzeug, hast aber nichts abgesprochen. Was passt?","Erst fragen und überlegen, ob es gebraucht wird.","Etwas ohne Erlaubnis mitnehmen.","Denke nach vor dem Handeln.","Richtig! Warten kann klug sein.",1),
t("Formuliere einen freundlichen Satz, wenn ein Wunsch warten muss.","Ich möchte das gern, aber ich kann warten und später noch einmal fragen.","Ein Satz genügt.","Allāhumma bārik! Du übst Geduld.")],
"9-10":[
t("Welche beiden Extreme stellt Qurʾān 17:29 anhand der Hand gegenüber?","Geiziges Festhalten und verschwenderisches Ausgeben.","Erkläre beide Enden des Bildes.","Mā schāʾ Allāh! Du hast die Mahnung verstanden."),
c("Welche Behauptung wäre mehr als der Vers konkret festlegt?","Jedes Kind müsse genau sieben Tage vor jedem Kauf warten.","Der Vers ermutigt zu Maßhalten.","Eine genaue Wartefrist steht hier nicht.","Richtig! Die Warteübung ist unsere Anwendung."),
t("Wie hilft das Bild der Hand bei eigenen Wünschen?","Ich denke nach, ob etwas nötig oder sinnvoll ist, statt sofort alles zu verlangen.","Erkläre das Maßhalten.","Allāhumma bārik! Du übst Selbststeuerung.")]
},
"tawhid-bedeutung-ibadah":{
"4-5":[
c("Was ist ein Beispiel für ʿIbādah?","Zu Allah beten.","Um ein Glas Wasser bitten.","Denke an Allah dienen.","Mā schāʾ Allāh! Ṣalāh ist Anbetung."),
c("Wenn du Mama um ein Glas Wasser bittest, betest du dann Mama an?","Nein.","Ja, immer.","Gewöhnliche Hilfe ist etwas anderes.","Allāhumma bārik! Du unterscheidest richtig.",1)],
"6-8":[
c("Wofür wurden Menschen und Jinn laut Qurʾān 51:56 erschaffen?","Damit sie Allah dienen.","Damit sie Menschen anbeten.","Denk an ʿIbādah.","Mā schāʾ Allāh! Allah zu dienen ist unser Ziel."),
c("Welche Unterscheidung ist wichtig?","Allah anzubeten ist etwas anderes als einen Menschen um normale Hilfe zu bitten.","Jede Bitte an Menschen ist automatisch Anbetung.","Denke an das Glas Wasser.","Richtig! Nicht jede Bitte ist ein Gottesdienst.",1),
t("Nenne ein Beispiel für Anbetung und eines für gewöhnliche Hilfe.","Ṣalāh ist Anbetung Allahs. Jemanden um einen Stift bitten ist gewöhnliche Hilfe.","Zwei unterschiedliche Beispiele genügen.","Allāhumma bārik! Du trennst die Begriffe.")],
"9-10":[
t("Welche Grundbestimmung nennt Qurʾān 51:56?","Allah hat die Jinn und Menschen erschaffen, damit sie Ihm dienen.","Nenne den Versinhalt.","Mā schāʾ Allāh! Du kennst die Quelle."),
c("Welche pauschale Behauptung ist falsch?","Jede normale Bitte um eine im Alltag mögliche Hilfe sei automatisch Anbetung des Menschen.","Gebet ist ʿIbādah für Allah.","Gewöhnliches Handeln und Anbetung unterscheiden.","Richtig! Man muss den Charakter einer Handlung beachten."),
t("Erkläre einem jüngeren Kind den Unterschied zwischen Gebet und einer Bitte um Wasser.","Beim Gebet wenden wir uns in Anbetung an Allah. Bei der Bitte um Wasser fragen wir einen Menschen nach gewöhnlicher Hilfe.","Nenne die zwei Arten.","Allāhumma bārik! Das ist verständlich.")]
},
"iman-qadar":{
"4-5":[
c("Weiß Allah, was geschieht?","Ja.","Nein.","Denke an Allahs Wissen.","Mā schāʾ Allāh! Allah weiß."),
c("Ist ein Kind schuld an jedem Unglück, das geschieht?","Nein.","Ja, immer.","Niemand darf Kinder ohne Grund beschuldigen.","Allāhumma bārik! Wir beschuldigen niemanden grundlos.",1)],
"6-8":[
c("Was sagt Qurʾān 54:49?","Allah hat jedes Ding in einem Maß erschaffen.","Allah weiß nichts über die Welt.","Denke an al-Qadar.","Mā schāʾ Allāh! Der Vers spricht vom Maß."),
c("Ein Ausflug fällt wegen des Wetters aus. Was ist angemessen?","Wir dürfen traurig sein und machen niemandem grundlos Vorwürfe.","Wir beschuldigen ein Kind als Ursache.","Wetter ist kein Fehler eines Kindes.","Richtig! Gefühle sind erlaubt.",1),
t("Formuliere einen ruhigen Satz, wenn etwas nicht wie geplant klappt.","Ich bin traurig, aber wir können schauen, was jetzt möglich ist.","Keine Schuldzuweisung.","Allāhumma bārik! Du bleibst freundlich.")],
"9-10":[
t("Welche Aussage zu al-Qadar enthält Qurʾān 54:49?","Allah hat jedes Ding in einem bestimmten Maß erschaffen.","Nenne den Sinn des kurzen Verses.","Mā schāʾ Allāh! Du kennst die Stelle."),
c("Welche Schlussfolgerung darf daraus nicht gezogen werden?","Dass ein betroffenes Kind ohne Belege Schuld an einem Unglück trägt.","Dass Allah Wissen und Bestimmung zukommen.","Kinderschutz bleibt wichtig.","Richtig! Qadar ist kein Vorwand für Schuldzuweisung."),
t("Wie erklärst du al-Qadar altersgerecht, ohne Ursachen zu erfinden?","Allahs Wissen und Bestimmung sind umfassend; wir kennen nicht alle Gründe eines Ereignisses und behandeln Menschen gerecht.","Keine Spekulation über verborgenes Wissen.","Allāhumma bārik! Du bleibst vorsichtig.")]
},
"ikhlas-wochenrueckblick":{
"4-5":[
c("Woran kannst du nach einer guten Tat denken?","Für wen ich sie getan habe.","Wie ich andere deswegen auslache.","Denke an Aufrichtigkeit.","Mā schāʾ Allāh! Deine Absicht ist wichtig."),
c("Muss ein Kind seine geheimen Gedanken vor allen erzählen?","Nein.","Ja, immer.","Jeder darf still nachdenken.","Allāhumma bārik! Du darfst für dich nachdenken.",1)],
"6-8":[
c("Wozu ruft Qurʾān 39:2 auf?","Allah aufrichtig zu dienen.","Nur wegen des Lobes anderer zu handeln.","Denke an Ikhlāṣ.","Mā schāʾ Allāh! Aufrichtigkeit gehört zum Glauben."),
c("Wie machen wir einen freundlichen Wochenrückblick?","Wir denken ruhig nach, ohne andere zu bewerten.","Wir bewerten laut die geheimen Absichten anderer Kinder.","Niemand kennt alle Herzen.","Richtig! Du darfst still überlegen.",1),
t("Nenne eine gute Tat, über deren Absicht du allein nachdenken könntest.","Ich habe geholfen und kann mich still fragen, warum.","Du musst sie niemandem verraten.","Allāhumma bārik! Innere Reflexion ist gut.")],
"9-10":[
t("Was bedeutet die Aufforderung zur Aufrichtigkeit in Qurʾān 39:2?","Allah in der Religion aufrichtig zu dienen, statt religiöse Taten nur für das Ansehen zu tun.","Erkläre Ikhlāṣ.","Mā schāʾ Allāh! Du erkennst die Lehre."),
c("Welche Unterrichtspraxis ist unangebracht?","Kinder zu öffentlichen Geständnissen über ihre geheimen Absichten drängen.","Freiwillig still über die eigene Motivation nachdenken.","Privatsphäre und Würde achten.","Richtig! Inneres lässt sich nicht durch Gruppendruck messen."),
t("Wie unterscheidest du Ikhlāṣ vom Wunsch nach Anerkennung im Alltag?","Ich darf mich über ein Lob freuen, aber die religiöse Handlung soll nicht nur für die Anerkennung anderer geschehen.","Eine sachliche Unterscheidung genügt.","Allāhumma bārik! Du denkst differenziert.")]
},
"akhlaq-freude-fuer-andere":{
"4-5":[
c("Ein Kind zeigt dir sein Bild. Was kannst du sagen?","Schön gemacht!","Wie hässlich!","Freundliche Worte tun gut.","Mā schāʾ Allāh! Du freust dich mit."),
c("Musst du ein anderes Bild schlechtmachen, um deines zu loben?","Nein.","Ja, immer.","Beide Kinder dürfen sich freuen.","Allāhumma bārik! Wir vergleichen nicht verletzend.",1)],
"6-8":[
c("Welche Gemeinschaft beschreibt Qurʾān 49:10?","Die Glaubenden sind Geschwister.","Wir sollen uns gegenseitig verspotten.","Achte auf Geschwisterlichkeit.","Mā schāʾ Allāh! Gemeinschaft verbindet."),
c("Ein anderes Kind bekommt Lob. Was ist eine gute Reaktion?","Ich freue mich mit und gratuliere.","Ich lache es deshalb aus.","Freude muss kein Wettbewerb sein.","Richtig! Ein Glückwunsch ist freundlich.",1),
t("Formuliere einen Glückwunsch, der niemanden abwertet.","Mā schāʾ Allāh, du hast dir Mühe gegeben!","Ein ehrlicher Satz genügt.","Allāhumma bārik! Du bist wertschätzend.")],
"9-10":[
t("Welche Aussage enthält Qurʾān 49:10?","Der Vers beschreibt die Glaubenden als Geschwister und ruft zum Friedenstiften auf.","Nenne den Inhalt des Verses.","Mā schāʾ Allāh! Du bleibst beim Text."),
c("Welche Behauptung ist nicht wörtlich Teil des Verses?","Dass Kinder sich beim Zeichnen immer gegenseitig gratulieren müssen.","Dass die Glaubenden Geschwister sind.","Die Zeichenstunde ist unser Beispiel.","Richtig! Die konkrete Übung ist selbst erstellt."),
t("Wie übst du Freude für andere, ohne den Qurʾān-Wortlaut zu verändern?","Ich gratuliere ehrlich zu einer Leistung und erkläre, dass dies ein Beispiel für gutes Miteinander ist.","Lehre und Anwendung unterscheiden.","Allāhumma bārik! Du hast es verstanden.")]
}
};
const ages=["4-5","6-8","9-10"],ids=Object.keys(revisions);
if(ids.length!==11)throw Error("V44 expects 11 curated lessons");
const next={...prior};
for(const [id,blocks] of Object.entries(revisions)){
 const old=prior[id];if(!old||old.sourceAudit?.scientificApproval!==false)throw Error("V44 unknown/approved "+id);
 for(const age of ages){const questions=blocks[age],wanted=age==="4-5"?2:3;
  if(!Array.isArray(questions)||questions.length!==wanted)throw Error("V44 invalid count "+id+"/"+age);
  for(const q of questions)if(!q.prompt||!q.hint||!q.explain||q.type==="choice"&&(q.options?.length!==2||![0,1].includes(q.correct))||q.type==="text"&&!q.sample)throw Error("V44 invalid question "+id+"/"+age);
 }
 next[id]={...old,questions:{...old.questions,...blocks}};
}
window.DARKidsAcademyCurriculum=Object.freeze(next);
window.DARKidsAcademyCurriculumV44=Object.freeze({
 version:"20261014-v44",revisedSlots:[159,160,161,162,163,164,165,167,168,169,170],
 ids,questionCount:88,approvedAgeVersions:0,religiousSourcesVerified:false,voiceRecordingsApproved:false
});
})();
