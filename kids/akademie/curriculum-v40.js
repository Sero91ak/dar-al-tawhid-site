/* DĀR AL TAWḤĪD KIDS AKADEMI · V40
 * Individuelle, altersgerechte Lernfragen für Slots 111–122; Prüfstatus unverändert.
 * Wissenschaftliche Freigabe ist nicht erteilt. Keine Audio- oder Live-Änderungen.
 */
(function(){
"use strict";
const prior=window.DARKidsAcademyCurriculum;
if(!prior||!window.DARKidsAcademyCurriculumV39)return;
const c=(prompt,right,wrong,hint,explain,position=0)=>({
 type:"choice",prompt,options:position===0?[right,wrong]:[wrong,right],correct:position,hint,explain
});
const t=(prompt,sample,hint,explain)=>({type:"text",prompt,sample,hint,explain});
const revisions={
"tawhid-allah-kennt-unser-handeln":{
"4-5":[
 c("Du hilfst, ohne dass jemand zuschaut. Wer weiß davon?","Allah.","Niemand kann davon wissen.","Denke an Allahs Wissen.","Mā schāʾ Allāh! Allah weiß von unserem Handeln."),
 c("Musst du für jede gute Tat gelobt werden?","Nein, ich darf auch still Gutes tun.","Ja, sonst ist die Tat wertlos.","Eine kleine Hilfe zählt auch ohne Applaus.","Allāhumma bārik! Hilfsbereitschaft braucht keine Bühne.",1)],
"6-8":[
 c("Was lehrt Qurʾān 67:13 über Allah?","Allah weiß auch, was Menschen verbergen.","Allah kennt nur laut gesprochene Worte.","Denke an die heimliche und laute Rede im Vers.","Mā schāʾ Allāh! Allahs Wissen wird im Vers betont."),
 c("Welche Tat passt zu unserer Alltagssituation?","Einen Stift wegräumen, auch wenn niemand zuschaut.","Nur dann helfen, wenn es dafür Lob gibt.","Du kannst Gutes unbemerkt tun.","Richtig! Deine Absicht ist wichtig.",1),
 t("Nenne eine kleine gute Tat, die du tun kannst, ohne davon zu erzählen.","Ich kann jemandem heimlich einen verlorenen Gegenstand zurücklegen.","Es muss nichts Großes sein.","Allāhumma bārik! Solche Hilfen können den Alltag verbessern.")],
"9-10":[
 t("Erkläre den Sinn von Qurʾān 67:13 in eigenen Worten.","Ob Menschen ihre Rede verbergen oder offen sprechen, Allah weiß darüber Bescheid und kennt, was im Inneren ist.","Denke an verborgene und hörbare Rede.","Mā schāʾ Allāh! Du bleibst bei der Aussage des Verses."),
 c("Welche Aussage wäre überzogen?","Kein Mensch kann etwas von mir wissen, deshalb darf ich alles.","Allah kennt auch meine verborgenen Gedanken.","Achte darauf, was wir daraus nicht ableiten.","Richtig! Allahs Wissen ist keine Erlaubnis, anderen zu schaden.",0),
 t("Wie kannst du eine gute Tat ohne Erwartung auf Lob tun?","Ich helfe beim Aufräumen, auch wenn die Lehrperson es nicht bemerkt.","Wähle eine sichere Alltagshilfe.","Allāhumma bārik! Das ist eine praktische Anwendung.") ]
},
"iman-gesandte":{
"4-5":[
 c("Hat Allah Gesandte zu den Menschen geschickt?","Ja.","Nein.","Denke an die Propheten, die wir kennen.","Mā schāʾ Allāh! Wir glauben an Allahs Gesandte."),
 c("Wie sprechen wir über die Gesandten?","Mit Respekt.","Mit bösen Spitznamen.","Respekt passt zum Glauben.","Allāhumma bārik! Das ist ein guter Umgang.",1)],
"6-8":[
 c("Was sagt Qurʾān 2:136 über Allahs Gesandte?","Wir glauben an die genannten Gesandten und schließen keinen aus.","Wir glauben nur an einen und verspotten die anderen.","Achte auf die Aussage über die Gesandten.","Mā schāʾ Allāh! Der Vers spricht davon, keinen auszuschließen."),
 c("Wer ist ein Gesandter, der im Qurʾān genannt wird?","Mūsā, Friede sei mit ihm.","Eine selbst erfundene Gestalt.","Erinnere dich an bekannte Namen aus dem Qurʾān.","Richtig! Mūsā ist einer der Gesandten.",1),
 t("Nenne einen respektvollen Satz über Allahs Gesandte.","Wir glauben an Allahs Gesandte und sprechen über sie in guten Worten.","Die Namen behandeln wir mit Respekt.","Allāhumma bārik! Du hast den Sinn gut ausgedrückt.")],
"9-10":[
 t("Erkläre, was „Wir machen zwischen keinem Seiner Gesandten einen Unterschied“ im Zusammenhang von Qurʾān 2:136 bedeutet.","Wir nehmen den Glauben an die Gesandten ernst und weisen keinen von ihnen als Gesandten Allahs zurück.","Trenne Glauben und bloße Lieblingsgeschichte.","Mā schāʾ Allāh! Du hast den Kern des Verses erfasst."),
 c("Welche Haltung passt zu dieser Stelle?","Alle von Allah bestätigten Gesandten respektieren.","Einen Propheten aus Spott ablehnen.","Denke an den Glauben an die Gesandten.","Richtig! Respekt ist wichtig.",0),
 t("Warum sollten wir bei Prophetengeschichten keine Details erfinden?","Weil wir Wahres über die Gesandten erzählen möchten und zusätzliche Angaben eigens belegt werden müssen.","Erinnere dich an Quellen und Geschichten.","Allāhumma bārik! Damit bleibt der Unterricht zuverlässig.") ]
},
"ikhlas-gute-absicht-erneuern":{
"4-5":[
 c("Du möchtest deiner Familie helfen. Für wen kannst du es mit guter Absicht tun?","Für Allah.","Nur damit alle dich bewundern.","Denke an Ikhlāṣ.","Mā schāʾ Allāh! Wir möchten aufrichtig handeln."),
 c("Du wirst abgelenkt. Was kannst du tun?","Ruhig wieder mit der guten Tat anfangen.","Aufgeben und andere beschuldigen.","Fehler dürfen passieren.","Allāhumma bārik! Du kannst es erneut versuchen.",1)],
"6-8":[
 c("Was steht im Sinn von Qurʾān 98:5 im Mittelpunkt?","Allah aufrichtig dienen.","Andere nur für Lob beeindrucken.","Was bedeutet Ikhlāṣ?","Mā schāʾ Allāh! Ikhlāṣ bedeutet Aufrichtigkeit."),
 c("Du vergisst beim Helfen dein gutes Ziel. Was passt?","Dich neu daran erinnern und weiterhelfen.","Alle Hilfe sofort abbrechen.","Eine gute Absicht darfst du erneuern.","Richtig! Du kannst weitermachen.",1),
 t("Formuliere eine einfache gute Absicht vor einer erlaubten Hilfe.","Ich möchte für Allah etwas Gutes tun und helfe jetzt beim Aufräumen.","Nenne die Absicht und die Handlung.","Allāhumma bārik! Du hast beides verbunden.")],
"9-10":[
 t("Welche Verbindung stellt Qurʾān 98:5 zwischen Aufrichtigkeit und Anbetung her?","Der Vers spricht davon, Allah aufrichtig zu dienen, und nennt dabei auch Gebet und Zakāh.","Denke an den gelesenen Versinhalt.","Mā schāʾ Allāh! Du hast die Aussage korrekt zusammengefasst."),
 c("Welche Haltung ist ein Beispiel für eine erneuerte gute Absicht?","Ich kehre zu einer hilfreichen Tat zurück, obwohl ich kurz abgelenkt war.","Ich helfe nur weiter, wenn mich jemand lobt.","Wofür möchte ich die Tat tun?","Richtig! Das ist eine passende Übung.",0),
 t("Warum ist es hilfreich, vor einer Tat das eigene Ziel zu bedenken?","Weil ich bewusster und aufrichtiger handeln kann, statt nur Anerkennung zu suchen.","Unterscheide Absicht und Lob.","Allāhumma bārik! Du hast die praktische Bedeutung erklärt.") ]
},
"akhlaq-dankbarkeit-zeigen":{
"4-5":[
 c("Jemand gibt dir ein Glas Wasser. Was passt?","Danke sagen.","Die Person anschreien.","Ein freundliches Wort hilft.","Mā schāʾ Allāh! Danke ist ein freundliches Wort."),
 c("Wem danken wir für Seine Gaben?","Allah.","Nur unserem Spielzeug.","Denk an die Dankbarkeit gegenüber Allah.","Allāhumma bārik! Wir danken Allah.",1)],
"6-8":[
 c("Was verspricht Allah im behandelten Teil von Qurʾān 14:7 den Dankbaren?","Er wird ihnen mehr geben.","Dankbarkeit hat überhaupt keinen Wert.","Denke an die Zusage im Vers.","Mā schāʾ Allāh! Der Vers betont den Dank."),
 c("Was kannst du tun, wenn jemand dir hilft?","Dich freundlich bedanken.","So tun, als hätte niemand geholfen.","Wie fühlt sich Dankbarkeit im Alltag an?","Richtig! Danke zeigt Wertschätzung.",0),
 t("Nenne eine Gabe Allahs und einen passenden Dank im Alltag.","Allah schenkt uns Wasser; ich bin dankbar und gehe achtsam damit um.","Du kannst etwas ganz Einfaches nennen.","Allāhumma bārik! So verbindest du Wissen und Handlung.")],
"9-10":[
 t("Was sagt die Zusage in Qurʾān 14:7 über Dankbarkeit aus?","Allah spricht davon, den Dankbaren mehr zu geben.","Nenne die Zusage, ohne eine eigene genaue Art der Mehrung zu erfinden.","Mā schāʾ Allāh! Du gibst den gelesenen Sinn wieder."),
 c("Was passt zu dankbarem Verhalten?","Die Hilfe eines anderen Menschen anerkennen und Allah dankbar sein.","Menschen nie danken, weil nur Allah etwas geben kann.","Dank zu Menschen und zu Allah schließen sich nicht aus.","Richtig! Beides hat seinen Platz.",1),
 t("Warum ist Dankbarkeit mehr als nur das Wort „Danke“?","Weil ich Gaben erkenne, nicht selbstverständlich nehme und sorgsam damit umgehe.","Nenne einen Gedanken und eine Handlung.","Allāhumma bārik! Das ist eine sinnvolle Alltagsanwendung.") ]
},
"adab-quran-sorgfaeltig-behandeln":{
"4-5":[
 c("Wo legst du ein Qurʾān-Exemplar achtsam hin?","An einen sauberen, sicheren Platz.","Mitten in den Schmutz.","Denk an unseren Umgang mit dem Buch.","Mā schāʾ Allāh! Wir behandeln das Buch sorgfältig."),
 c("Wie blätterst du darin?","Vorsichtig.","Indem du Seiten zerreißt.","Das Buch soll heil bleiben.","Richtig! Wir gehen achtsam mit den Seiten um.",1)],
"6-8":[
 c("Welche Übung gehört zur Stunde?","Ein Qurʾān-Exemplar ordentlich schließen und sauber aufbewahren.","Es absichtlich auf den Boden werfen.","Was zeigt Sorgfalt?","Mā schāʾ Allāh! Das ist respektvoll."),
 c("Welche Aussage wäre eine ungeprüfte Überdehnung von Qurʾān 56:79?","Dieser eine Vers allein lege jede einzelne Fiqh-Regel zur Berührung eines Muṣḥaf fest.","Der Vers erwähnt die Gereinigten.","Die genaue Rechtsfrage braucht eigene Prüfung.","Richtig! Tafsīr und detaillierte Fiqh-Regeln dürfen wir nicht vermischen.",0),
 t("Wie könntest du einem jüngeren Kind einen respektvollen Umgang mit dem Muṣḥaf zeigen?","Ich blättere ruhig und lege das Exemplar an einen sauberen Platz.","Zeige es freundlich statt streng.","Allāhumma bārik! So lernen Kinder gemeinsam.")],
"9-10":[
 t("Was steht im behandelten Teil von Qurʾān 56:79, und welche zusätzliche Erklärung nennt die Tafsīr-Seite?","Der Vers spricht davon, dass ihn nur die Gereinigten berühren; die Tafsīr-Seite nennt dabei auch die Deutung auf das Buch im Himmel.","Achte auf den Wortlaut und die Auslegung.","Mā schāʾ Allāh! Du hast zwischen Text und Tafsīr unterschieden."),
 c("Wieso treffen wir in dieser Stunde keine detaillierte hanbalitische Entscheidung über Berührung des Muṣḥaf?","Dafür müssen passende Fiqh-Quellen gesondert überprüft werden.","Weil Sauberkeit niemals wichtig wäre.","Diese Stunde lehrt zuerst Adab.","Richtig! Die Rechtsprüfung bleibt separat.",0),
 t("Welche Umgangsregel könnt ihr als freundliche Übung gemeinsam einhalten?","Wir legen Qurʾān-Exemplare sauber ab und blättern sorgsam.","Es geht um Rücksicht, nicht um erfundene Rechtsurteile.","Allāhumma bārik! Das ist eine gute Gruppenregel.") ]
},
"tarbiyah-sichere-regeln-zu-hause":{
"4-5":[
 c("Die Herdplatte ist heiß. Was machst du?","Ich bleibe weg und sage einer erwachsenen Person Bescheid.","Ich fasse sie neugierig an.","Heiße Dinge können verletzen.","Mā schāʾ Allāh! Abstand schützt dich."),
 c("Darfst du eine Sicherheitsregel nachfragen, wenn du sie nicht verstehst?","Ja.","Nein, Fragen sind immer verboten.","Fragen können helfen, sicher zu bleiben.","Allāhumma bārik! Du darfst nachfragen.",1)],
"6-8":[
 c("Welche Hausregel schützt vor Verbrennungen?","Die heiße Herdplatte nicht berühren.","An der heißen Herdplatte spielen.","Denke an eine echte Gefahr.","Richtig! Sicherheit ist wichtig."),
 c("Welches Thema erwähnt Qurʾān 2:195 im gelesenen Zusammenhang?","Geben auf Allahs Weg, nicht ins Verderben stürzen und Gutes tun.","Eine genaue Liste aller Küchenregeln.","Unterscheide den Vers von unserer Hausübung.","Mā schāʾ Allāh! Du bleibst bei der Quelle.",1),
 t("Nenne eine Sicherheitsregel zu Hause und warum sie sinnvoll ist.","Ich fasse keine heiße Herdplatte an, damit ich mich nicht verbrenne.","Nenne Regel und Grund.","Allāhumma bārik! Du hast die Regel verstanden.")],
"9-10":[
 t("Warum ist unsere Regel zur heißen Herdplatte eine Alltagsanwendung und kein wörtlicher Inhalt von Qurʾān 2:195?","Der Vers behandelt Ausgeben, sich nicht ins Verderben stürzen und Gutes tun. Das Herd-Beispiel ist eine pädagogische Sicherheitsregel.","Trenne den konkreten Küchenfall von der Versstelle.","Mā schāʾ Allāh! Genau so vermeiden wir Quellenfehler."),
 c("Eine Regel erscheint dir unklar. Was hilft?","Nachfragen, warum sie schützt, und bei Gefahr Abstand halten.","Sie einfach ignorieren, bis etwas passiert.","Sicherheit geht vor.","Richtig! Fragen und Vorsicht passen zusammen.",0),
 t("Entwickle zwei kindgerechte Sicherheitsregeln für zu Hause.","Heiße Flächen nicht anfassen; bei gefährlichen Dingen zuerst eine erwachsene Person holen.","Formuliere konkrete und ungefährliche Regeln.","Allāhumma bārik! Das sind nützliche Regeln.") ]
},
"nafs-ungeduld-bemerken":{
"4-5":[
 c("Du musst kurz warten. Was hilft?","Ruhig atmen und stehen bleiben.","Andere wegschubsen.","Wir üben das Warten.","Mā schāʾ Allāh! Du kannst ruhig bleiben."),
 c("Du wirst ungeduldig. Was kannst du dir sagen?","Ich versuche es noch einmal in Ruhe.","Ich darf niemanden mehr fragen.","Geduld kann man üben.","Allāhumma bārik! Ein kleiner Schritt genügt.",1)],
"6-8":[
 c("Was wird in Qurʾān 70:5 angesprochen?","Schöne Geduld.","Dass man andere schubsen soll.","Denke an den Sinn der Stelle.","Mā schāʾ Allāh! Es geht um Geduld."),
 c("Du stehst in einer Warteschlange. Was ist rücksichtsvoll?","Warten, ohne andere zu drängen.","Jemanden zur Seite stoßen.","Dein Körper kann ruhig bleiben.","Richtig! So schützt du auch andere.",1),
 t("Nenne einen Satz, der dir beim Warten helfen kann.","Ich warte ruhig. Ich bin gleich an der Reihe.","Sag es freundlich zu dir selbst.","Allāhumma bārik! Damit kannst du Geduld üben.")],
"9-10":[
 t("An wen richtet sich die Mahnung zu schöner Geduld in Qurʾān 70:5 nach der behandelten Erklärung?","An den Propheten ﷺ in einer Situation der Ablehnung durch sein Volk.","Denke an den geschichtlichen Zusammenhang der Stelle.","Mā schāʾ Allāh! Du erkennst den Verskontext."),
 c("Was ist unsere eigene Lernübung dazu?","In einer Warteschlange ruhig bleiben und niemanden schubsen.","Behaupten, im Vers werde eine Schulwarteschlange genannt.","Kontext und Anwendung sind verschieden.","Richtig! Wir wenden Geduld an, ohne die Geschichte zu erfinden.",1),
 t("Was kannst du tun, wenn du merkst, dass dich die Ungeduld zum Drängeln bringt?","Ich halte kurz inne, lasse die Hände ruhig und sage: Ich kann warten.","Nenne einen sicheren, machbaren Schritt.","Allāhumma bārik! Du hast eine gute Strategie.") ]
},
"fiqh-gebetsplatz-vorbereiten":{
"4-5":[
 c("Wie kannst du deinen Platz zum Gebetsüben vorbereiten?","Eine saubere Unterlage ruhig hinlegen.","Spielzeug wild herumwerfen.","Wir üben in Ruhe.","Mā schāʾ Allāh! Ein ordentlicher Platz hilft."),
 c("Wenn du etwas nicht weißt, wen darfst du fragen?","Eine Lehrperson oder deine Eltern.","Niemanden.","Fragen sind beim Lernen erlaubt.","Allāhumma bārik! Gemeinsam lernen ist gut.",1)],
"6-8":[
 c("Was betont Qurʾān 2:238?","Die Gebete zu bewahren und demütig vor Allah zu stehen.","Eine bestimmte Teppichfarbe.","Halte dich an den Sinn des Verses.","Mā schāʾ Allāh! Der Vers handelt vom Gebet."),
 c("Was ist unsere vorbereitende Übung?","Mit Erlaubnis einen ruhigen Platz freiräumen.","Ohne zu fragen Möbel herumtragen.","Bleibe bei sicheren Handgriffen.","Richtig! Wir bereiten den Platz sicher vor.",1),
 t("Beschreibe einen kleinen Schritt vor dem Gebetsüben.","Ich räume mit Erlaubnis Spielzeug beiseite und lege eine saubere Unterlage hin.","Wir üben nur die Vorbereitung.","Allāhumma bārik! Du hast eine passende Übung genannt.")],
"9-10":[
 t("Was sagt Qurʾān 2:238 über das Gebet, und was gehört erst zu unserer Praxisübung?","Der Vers fordert zum Bewahren der Gebete und zu demütigem Stehen auf. Einen Platz freizuräumen ist unsere zusätzliche Übung.","Unterscheide Vers und Vorbereitung.","Mā schāʾ Allāh! Du erfindest keine Detailregel."),
 c("Eine Person fragt nach einer genauen hanbalitischen Pflicht für die Gebetsunterlage. Wie gehen wir vor?","Die passende Fiqh-Quelle gesondert prüfen, statt aus dieser Übung eine Pflicht zu machen.","Eine Pflicht einfach behaupten.","Nicht jede gute Übung ist automatisch ein Rechtsurteil.","Richtig! Präzision ist beim Fiqh wichtig.",1),
 t("Welche drei Eigenschaften sollte ein ruhiger Übungsplatz haben?","Er ist sicher, nach Möglichkeit sauber und so vorbereitet, dass niemand gestört wird.","Beschreibe einen machbaren Ort.","Allāhumma bārik! Das ist eine hilfreiche Vorbereitung.") ]
},
"quran-arabisch-und-uebersetzung":{
"4-5":[
 c("Welche Worte sind der Qurʾān?","Die arabischen Verse.","Unsere frei erzählte deutsche Geschichte.","Denk an die zwei Textzeilen.","Mā schāʾ Allāh! Der Qurʾān ist arabisch offenbart."),
 c("Warum erklären wir ihn auch auf Deutsch?","Damit wir seinen Sinn besser verstehen.","Damit wir neue arabische Verse erfinden.","Wir lernen das Verstehen.","Allāhumma bārik! Eine Erklärung hilft beim Lernen.",1)],
"6-8":[
 c("Was sagt Qurʾān 1:2 sinngemäß?","Alles Lob gehört Allah, dem Herrn der Welten.","Alles Lob gehört einem unbekannten Herrscher.","Denke an die Sūrat al-Fātiḥah.","Mā schāʾ Allāh! Der Vers preist Allah."),
 c("Welche Aussage unterscheidet Text und Erklärung richtig?","Die arabischen Worte sind der Qurʾān; Deutsch hilft uns, den Sinn zu verstehen.","Jede deutsche Umschreibung ist ein neuer arabischer Vers.","Beides hat eine andere Aufgabe.","Richtig! Wir verwechseln die Sprachen nicht.",1),
 t("Erkläre einem Freund, wozu die deutsche Erläuterung dient.","Sie hilft uns, den Sinn der arabischen Qurʾān-Worte zu verstehen.","Denk an Übersetzen und Erklären.","Allāhumma bārik! Du hast es klar gesagt.")],
"9-10":[
 t("Welche Information steht in Qurʾān 1:2, und wie wird sie in unserer deutschen Erklärung wiedergegeben?","Der Vers lobt Allah als Herrn der Welten; die deutsche Erklärung gibt den Sinn dieser Worte wieder.","Trenne Wortlaut und Sinnwiedergabe.","Mā schāʾ Allāh! Du hast die Stelle verstanden."),
 c("Warum sollten wir bei einer deutschen Umschreibung nicht behaupten, sie sei der arabische Qurʾān-Wortlaut?","Weil eine Sinnwiedergabe nicht dieselben Worte wie der arabische Originaltext ist.","Weil Deutsch keine Erklärungen erlaubt.","Achte auf die Form des ursprünglichen Textes.","Richtig! Eine Erläuterung ersetzt den Wortlaut nicht.",0),
 t("Nenne den Vorteil und eine Grenze einer deutschen Sinnwiedergabe.","Sie hilft beim Verstehen, kann aber den arabischen Originalwortlaut nicht ersetzen.","Ein Vorteil und eine Grenze reichen.","Allāhumma bārik! Du kannst Quellen sorgfältig unterscheiden.") ]
},
"sirah-muhammad-barmherziger-lehrer":{
"4-5":[
 c("Wie wird der Prophet ﷺ im behandelten Vers im Umgang beschrieben?","Mild und barmherzig.","Absichtlich grob zu allen.","Denke an freundliches Reden.","Mā schāʾ Allāh! Der Vers hebt die Milde hervor."),
 c("Ein Kind hat eine Frage. Wie kannst du reagieren?","Es freundlich ausreden lassen.","Es sofort auslachen.","Freundlichkeit zeigt sich im Zuhören.","Allāhumma bārik! Zuhören ist eine schöne Übung.",1)],
"6-8":[
 c("Was wird in Qurʾān 3:159 über den Umgang des Propheten ﷺ gesagt?","Er war durch Allahs Barmherzigkeit mild zu den Menschen.","Er sollte die Menschen grundsätzlich grob behandeln.","Denke an die im Vers genannte Barmherzigkeit.","Mā schāʾ Allāh! Der Vers hebt Milde hervor."),
 c("Was passt zu dieser Lehre im Klassenzimmer?","Ein anderes Kind ausreden lassen.","Es bei einem Fehler beschämen.","Wie ist ein freundlicher Ton?","Richtig! Wir können achtsam miteinander sprechen.",1),
 t("Formuliere einen freundlichen Satz für ein Kind, das etwas nicht verstanden hat.","Du kannst noch einmal fragen. Wir üben das zusammen.","Helfen statt beschämen.","Allāhumma bārik! Das ist eine passende Übung.")],
"9-10":[
 t("Welche Eigenschaften werden im Zusammenhang mit Qurʾān 3:159 genannt?","Milde durch Allahs Barmherzigkeit, Verzeihen, das Bitten um Vergebung und Beratung.","Bleibe bei dem gelesenen Vers.","Mā schāʾ Allāh! Du hast die Merkmale erfasst."),
 c("Warum erzählen wir zu diesem Vers keine frei erfundene Szene aus der Kindheit des Propheten ﷺ?","Weil die behandelte Stelle eine solche Szene nicht belegt.","Weil der Prophet nie mit Menschen sprach.","Versinhalt und Geschichte müssen belegt sein.","Richtig! Eine gute Lehre braucht keine erfundene Erzählung.",1),
 t("Wie könntest du die Milde des Propheten ﷺ im Umgang mit jemandem nachahmen, der sich verspricht?","Ich bleibe freundlich, lasse den anderen ausreden und helfe ohne Spott.","Nenne zwei Verhaltensweisen.","Allāhumma bārik! Du hast den Verssinn sinnvoll angewendet.") ]
},
"dua-in-schwierigen-momenten":{
"4-5":[
 c("Du weißt bei einer Aufgabe nicht weiter. Was kannst du tun?","Allah um Hilfe bitten und deine Lehrperson fragen.","Niemanden fragen und weinen müssen.","Du darfst zwei Wege der Hilfe nutzen.","Mā schāʾ Allāh! Bittgebet und Fragen passen zusammen."),
 c("Wen rufen wir im Duʿāʾ an?","Allah.","Ein Spielzeug.","Denk an den Versanfang.","Allāhumma bārik! Duʿāʾ richtet sich an Allah.",1)],
"6-8":[
 c("Wozu ruft Allah im Beginn von Qurʾān 40:60 auf?","Ihn anzurufen und zu bitten.","Andere Kinder auszulachen.","Denke an die Worte „Ruft Mich an“.","Mā schāʾ Allāh! Die Stelle ermuntert zum Duʿāʾ."),
 c("Was machst du, wenn du bei etwas wirklich Hilfe brauchst?","Ich bitte Allah und spreche mit einer geeigneten erwachsenen Person.","Ich sage niemandem Bescheid.","Bei Gefahr ist echte Unterstützung wichtig.","Richtig! Hilfe suchen gehört dazu.",1),
 t("Bilde eine kurze Bitte in einfachen Worten für eine schwierige Aufgabe.","Mein Herr, gib mir Ruhe und hilf mir, mich zu bemühen.","Du darfst eigene deutsche Worte verwenden.","Allāhumma bārik! Das ist eine passende Bitte.")],
"9-10":[
 t("Gib den Sinn des Beginns von Qurʾān 40:60 wieder.","Allah fordert dazu auf, Ihn anzurufen, und spricht von der Erhörung des Bittgebets.","Halte dich an den Beginn der Stelle.","Mā schāʾ Allāh! Du hast den Versanfang erkannt."),
 c("Was ist verantwortungsvoll, wenn ein Kind in einer ernsten Notsituation ist?","Allah bitten und sofort sichere menschliche Hilfe holen.","Nur beten und jede andere Hilfe vermeiden.","Gebet ersetzt nicht den Schutz.","Richtig! Bei Gefahr ist Hilfe wichtig.",1),
 t("Warum gehört zu einer Bitte um Hilfe auch eigenes Bemühen, wenn es möglich ist?","Ich bitte Allah und tue zugleich die erlaubten Schritte, etwa die Lehrperson um Erklärung zu bitten.","Nenne ein Beispiel aus dem Unterricht.","Allāhumma bārik! Du denkst an Bitte und Handeln.") ]
},
"family-gemeinsam-in-der-moschee":{
"4-5":[
 c("Zwei Kinder möchten denselben Platz. Was passt?","Wir rücken freundlich zusammen, wenn genug Raum da ist.","Wir stoßen uns gegenseitig.","Rücksicht tut allen gut.","Mā schāʾ Allāh! Zusammenrücken ist freundlich."),
 c("Jemand braucht Platz zum Gehen. Was kannst du tun?","Ein Stück zur Seite gehen.","Den Weg absichtlich versperren.","Denke an die anderen Menschen.","Allāhumma bārik! Du machst Platz.",1)],
"6-8":[
 c("Was erwähnt Qurʾān 24:36 im behandelten Teil?","Häuser, in denen Allahs Name genannt und Er gepriesen wird.","Ein Spielplatz mit Wettkampfregeln.","Denke an den Ort des Gedenkens.","Mā schāʾ Allāh! Der Vers spricht vom Gedenken Allahs."),
 c("Wie üben wir Rücksicht in einem gemeinsamen Raum?","Platz machen und andere nicht schubsen.","Unseren Platz mit Gewalt verteidigen.","Was wäre freundlich für alle?","Richtig! So lernen wir gemeinsam.",1),
 t("Zwei Kinder wollen denselben Platz. Schlage eine friedliche Lösung vor.","Wir fragen freundlich, ob wir zusammenrücken oder einen anderen Platz finden können.","Denke an beide Kinder.","Allāhumma bārik! Du hast eine faire Lösung gefunden.")],
"9-10":[
 t("Was sagt Qurʾān 24:36, und was ist die zusätzliche Alltagsübung unserer Stunde?","Der Vers spricht von Orten, in denen Allahs Name genannt und Er gepriesen wird. Zusammenrücken und Platz machen ist unsere Rücksichtnahme als Übung.","Unterscheide Vers und Praxis.","Mā schāʾ Allāh! Du ordnest Quelle und Beispiel richtig zu."),
 c("Wie reagierst du bei einem Platzkonflikt in einem Lernraum am besten?","Ich spreche freundlich und suche eine Lösung, bei der niemand gedrängt wird.","Ich schubse, damit ich gewinne.","Gemeinsam lernen braucht Rücksicht.","Richtig! Eine friedliche Lösung hilft allen.",1),
 t("Formuliere zwei einfache Regeln für rücksichtsvollen Umgang in der Moschee.","Wir lassen andere ruhig vorbei und sprechen freundlich, wenn wir Platz brauchen.","Konkrete und freundliche Regeln.","Allāhumma bārik! Du kannst sie direkt anwenden.") ]
}
};
const ages=["4-5","6-8","9-10"];
const ids=Object.keys(revisions);
if(ids.length!==12)throw Error("V40 requires 12 lesson entries");
const updated={...prior};
for(const [id,blocks] of Object.entries(revisions)){
 const existing=prior[id];
 if(!existing||existing.sourceAudit?.scientificApproval!==false)
  throw Error("V40 missing or approved lesson "+id);
 for(const age of ages){
  const qs=blocks[age];const expected=age==="4-5"?2:3;
  if(!Array.isArray(qs)||qs.length!==expected)throw Error("V40 missing age quiz "+id+"/"+age);
  for(const q of qs){
   if(!q.prompt||!q.explain||!q.hint||
      (q.type==="choice"&&(q.options?.length!==2||![0,1].includes(q.correct)))||
      (q.type==="text"&&!q.sample))throw Error("V40 malformed quiz "+id+"/"+age);
  }
 }
 updated[id]={...existing,questions:{...existing.questions,...blocks}};
}
window.DARKidsAcademyCurriculum=Object.freeze(updated);
window.DARKidsAcademyCurriculumV40=Object.freeze({
 version:"20261014-v40",revisedSlots:[111,112,113,114,115,116,117,118,119,120,121,122],
 ids,approvedAgeVersions:0,religiousSourcesVerified:false,voiceRecordingsApproved:false
});
})();