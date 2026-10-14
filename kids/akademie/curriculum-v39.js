/* DĀR AL TAWḤĪD KIDS AKADEMI · V39
 * Redaktionell individuell ausgearbeitete Quizfragen 99–110.
 * Nur Unterrichtsfragen; Quellenmetadaten, IDs, Lernfortschritt und Audio unverändert.
 * Wissenschaftliche Freigabe: weiterhin NEIN.
 */
(function(){
"use strict";
const prior=window.DARKidsAcademyCurriculum;
if(!prior || !window.DARKidsAcademyCurriculumV38) return;
const c=(prompt,right,wrong,hint,explain,position=0)=>({
  type:"choice",prompt,options:position===0?[right,wrong]:[wrong,right],
  correct:position,hint,explain
});
const t=(prompt,sample,hint,explain)=>({type:"text",prompt,sample,hint,explain});
const revisions={
"tawhid-allah-hoert-bittgebete":{
 "4-5":[
 c("Wen dürfen wir im Duʿāʾ um Hilfe bitten?","Allah.","Nur ein Spielzeug.","Denke an unser Bittgebet.","Mā schāʾ Allāh! Duʿāʾ bedeutet, Allah zu bitten."),
 c("Du hast Angst vor etwas. Was kannst du tun?","Allah bitten und einer vertrauenswürdigen erwachsenen Person davon erzählen.","Ganz allein bleiben und nichts sagen.","Bitten und Hilfe holen gehören zusammen.","Allāhumma bārik! Wir bitten Allah und holen Hilfe von Menschen, wenn wir sie brauchen.",1)],
 "6-8":[
 c("Was lehrt Qurʾān 2:186 über Allah?","Allah ist nah und erhört die Bitte des Bittenden.","Allah hört nur laute Worte.","Erinnere dich an die Aussage des Verses.","Richtig! Allah nennt Sich nah und spricht über das Bittgebet."),
 c("Was passt zum Duʿāʾ?","Du darfst Allah auch ganz leise bitten.","Eine Bitte zählt nur, wenn alle zuhören.","Denke an das Kind vor dem Gespräch.","Allāhumma bārik! Ein Bittgebet braucht keine Bühne.",1),
 t("Ein Gespräch macht dir Sorgen. Formuliere eine kurze, erlaubte Bitte an Allah.","Mein Herr, hilf mir, ruhig und ehrlich zu sprechen.","Du kannst eigene einfache Worte benutzen.","Gut überlegt! Die Bitte wird nicht zu einer erfundenen festgelegten Formel.")],
 "9-10":[
 t("Erkläre den Zusammenhang von Allahs Nähe und unserem Bittgebet in Qurʾān 2:186.","Allah beschreibt Sich als nah und spricht davon, die Bitte des Bittenden zu erhören; wir dürfen Ihn aufrichtig bitten.","Halte dich an den Sinn der gelesenen Stelle.","Mā schāʾ Allāh! Du hast den Zusammenhang erklärt, ohne etwas hinzuzufügen."),
 c("Ein Kind bittet Allah um Schutz, ist aber gerade in Gefahr. Was ist richtig?","Es bittet Allah und holt sofort Hilfe von vertrauenswürdigen Erwachsenen.","Es wartet allein, weil es schon gebetet hat.","Gebet ersetzt nicht notwendige Hilfe.","Richtig! Vertrauen auf Allah und menschliche Hilfe schließen sich nicht aus.",1),
 t("Nenne ein Beispiel für ein Duʿāʾ im Alltag und eine passende eigene Handlung.","Vor einer schwierigen Aufgabe bitte ich Allah um Hilfe und bereite mich sorgfältig vor.","Bitte und eigenes Bemühen können zusammengehören.","Allāhumma bārik! So bleibt die Übung lebensnah.") ]
},
"iman-quran-als-offenbarung":{
 "4-5":[
 c("Was ist der Qurʾān?","Allahs Buch.","Ein selbst erfundenes Märchenbuch.","Wir haben es heute gelernt.","Mā schāʾ Allāh! Der Qurʾān ist Allahs offenbartes Buch."),
 c("Du siehst ein Qurʾān-Buch auf dem Boden. Was passt?","Du bittest eine erwachsene Person um Hilfe und legst es achtsam an einen sauberen Platz.","Du benutzt es als Spielzeug.","Denke an einen achtsamen Umgang.","Sehr gut! Wir behandeln das Qurʾān-Exemplar respektvoll.",1)],
 "6-8":[
 c("Was erfahren wir aus dem Beginn von Qurʾān 2:2?","Der Qurʾān wird als das Buch bezeichnet, an dem kein Zweifel ist.","Dort wird ein beliebiges Schulbuch beschrieben.","Denke an den gelesenen Versbeginn.","Mā schāʾ Allāh! Wir bleiben beim tatsächlich behandelten Verssinn."),
 c("Was ist eine Āyah?","Ein Vers aus dem Qurʾān.","Ein Titel auf dem Stundenplan.","Erinnere dich an den erklärten Begriff.","Richtig! Āyah bedeutet hier Qurʾān-Vers.",1),
 t("Wie kannst du zeigen, dass du mit einem Qurʾān-Exemplar achtsam umgehst?","Ich bewahre es sauber auf und blättere vorsichtig darin.","Denke an den Umgang mit einem wertvollen Buch.","Allāhumma bārik! Das ist eine passende Alltagsübung.")],
 "9-10":[
 t("Erkläre den Unterschied zwischen dem Qurʾān selbst und unserer deutschen Erklärung im Unterricht.","Der Qurʾān ist die Offenbarung. Unsere deutsche Wiedergabe erläutert den Sinn und ist nicht mit dem arabischen Wortlaut gleichzusetzen.","Was ist Originaltext, was ist Erklärung?","Mā schāʾ Allāh! So gehen wir sorgfältig mit dem Wortlaut um."),
 c("Welche Aussage gehört zum gelesenen Anfang von Qurʾān 2:2?","Das Buch, an dem kein Zweifel ist.","Die Geschichte eines unbekannten Königs.","Erinnere dich an den Beginn des Verses.","Richtig! Diese Aussage gehört zur behandelten Stelle.",1),
 t("Was würdest du einem jüngeren Kind über Respekt vor dem Qurʾān erklären?","Ich erkläre, dass es Allahs Buch ist, und zeige ruhig, wie wir sorgfältig damit umgehen.","Ein Beispiel aus dem Alltag reicht.","Allāhumma bārik! Eine gute Erklärung ist freundlich und verständlich.") ]
},
"ikhlas-nicht-mit-guten-taten-prahlen":{
 "4-5":[
 c("Du hast beim Aufräumen geholfen. Welcher Satz ist freundlich?","Ich freue mich, dass ich helfen konnte.","Ich bin besser als alle anderen.","Denke an freundliche Worte.","Mā schāʾ Allāh! Helfen ist gut; andere kleinmachen nicht."),
 c("Was vermeiden wir beim Erzählen von guten Taten?","Mit uns selbst zu prahlen.","Andere freundlich anzulächeln.","Woran erinnert uns diese Stunde?","Allāhumma bārik! Wir müssen uns nicht über andere stellen.",1)],
 "6-8":[
 c("Wovor warnt Qurʾān 31:18?","Vor Hochmut und Prahlerei.","Vor dem Helfen zu Hause.","Denke an Luqmāns Ermahnung.","Richtig! Der Vers mahnt zu Bescheidenheit."),
 c("Was könnte ein Kind nach dem gemeinsamen Aufräumen sagen?","Gemeinsam ging es schneller, danke!","Nur ich war gut, ihr wart schlecht.","Kann ein Satz andere würdigen?","Mā schāʾ Allāh! Das ist ein wertschätzender Satz.",1),
 t("Formuliere „Ich bin der Beste, ihr seid langsam“ freundlich um.","Ich habe gern mitgeholfen; wir haben zusammen viel geschafft.","Vermeide den Vergleich mit anderen.","Allāhumma bārik! Deine Worte machen niemanden klein.")],
 "9-10":[
 t("Was kritisiert Qurʾān 31:18, und was bedeutet das für unseren Umgang mit anderen?","Der Vers kritisiert eingebildetes Verhalten und Prahlerei. Wir sollten eigene Leistungen nicht benutzen, um andere abzuwerten.","Erkläre die Mahnung und ein Beispiel.","Mā schāʾ Allāh! Du verbindest den Verssinn mit dem Alltag."),
 c("Welche Reaktion zeigt eher Bescheidenheit?","Ich danke für die Hilfe und freue mich über das gemeinsame Ergebnis.","Ich vergleiche mich ständig, damit andere schlechter wirken.","Achte darauf, wie mit anderen gesprochen wird.","Richtig! Bescheidenheit zeigt sich auch in der Sprache.",1),
 t("Ist es falsch, sich über eine gelungene Arbeit zu freuen? Erkläre den Unterschied zur Prahlerei.","Freude an einer gelungenen Tat ist nicht dasselbe wie das Herabsetzen anderer oder eingebildetes Auftreten.","Unterscheide Freude und Überheblichkeit.","Allāhumma bārik! Genau diese Unterscheidung hilft.") ]
},
"akhlaq-verzeihen-und-grenzen":{
 "4-5":[
 c("Jemand entschuldigt sich für ein Versehen. Was kannst du sagen?","Danke für deine Entschuldigung.","Ich darf nie sagen, wenn etwas wehgetan hat.","Darfst du deine Gefühle sagen?","Mā schāʾ Allāh! Du kannst freundlich reagieren und trotzdem eine Grenze haben."),
 c("Jemand macht immer weiter, obwohl du Stopp sagst. Was tust du?","Ich hole eine vertrauenswürdige erwachsene Person.","Ich muss das allein aushalten.","Deine Sicherheit ist wichtig.","Richtig! Verzeihen bedeutet nicht, Unrecht zu ertragen.",1)],
 "6-8":[
 c("Was hebt Qurʾān 42:40 hervor?","Den Wert von Verzeihen und gutem Friedenstiften.","Dass Kinder jedes Unrecht geheim halten sollen.","Denke an die Bedeutung der Stelle.","Mā schāʾ Allāh! Verzeihen und etwas in Ordnung bringen werden gewürdigt."),
 c("Welche zwei Sätze passen zusammen?","Ich kann verzeihen. Bitte hör trotzdem damit auf.","Wenn ich verzeihe, darf ich nie wieder Nein sagen.","Verzeihen und Grenzen schützen einander.","Richtig! Ein freundliches Nein bleibt erlaubt.",1),
 t("Ein anderes Kind verletzt immer wieder deine Grenze. Wen kannst du einschalten?","Ich erzähle einer vertrauten erwachsenen Person, was wiederholt passiert.","Du musst nicht allein eine Lösung finden.","Allāhumma bārik! Schutz hat Vorrang vor erzwungener Versöhnung.")],
 "9-10":[
 t("Erkläre, wie Verzeihen und Grenzen zusammenpassen.","Ich kann einen Fehler verzeihen und trotzdem klar sagen, dass eine Handlung nicht wieder passieren darf.","Nenne beide Teile.","Mā schāʾ Allāh! Beides kann gleichzeitig richtig sein."),
 c("Was ist bei wiederholter Gemeinheit wichtiger als ein erzwungenes „Vertragt euch“?","Dass eine verantwortliche erwachsene Person die Situation sicher beendet.","Dass das betroffene Kind schweigt.","Wer trägt Verantwortung für Schutz?","Richtig! Die Verantwortung liegt nicht allein beim betroffenen Kind.",1),
 t("Welche Haltung aus Qurʾān 42:40 könnte nach einem echten, sicheren Ausgleich helfen?","Verzeihen und aufrichtige Versöhnung können wertvoll sein, wenn das Unrecht beendet ist und niemand unter Druck gesetzt wird.","Achte auf Sicherheit und Freiwilligkeit.","Allāhumma bārik! Du hast die Grenze der Alltagsübung beachtet.") ]
},
"adab-ruecksicht-in-der-moschee":{
 "4-5":[
 c("Andere beten in der Moschee. Wie bewegst du dich?","Ruhig und achtsam.","Laut rufend mitten durch die Betenden.","Denke an einen ruhigen Gebetsraum.","Mā schāʾ Allāh! So nehmen wir Rücksicht."),
 c("Was machst du mit deinen Schuhen?","Ich stelle sie ordentlich hin, wo es vorgesehen ist.","Ich werfe sie anderen vor die Füße.","Was hilft den anderen Menschen?","Allāhumma bārik! Ordnung ist rücksichtsvoll.",1)],
 "6-8":[
 c("Welches Verhalten zeigt Rücksicht im Gebetsraum?","Leise gehen und andere nicht stören.","Zwischen Betenden herumrennen.","Überlege, was anderen beim Gebet hilft.","Richtig! Die Ruhe ist unsere praktische Übung."),
 c("Was erwähnt Qurʾān 7:31 ausdrücklich?","Zierde beim Moscheebesuch sowie Maßhalten beim Essen und Trinken.","Die genaue Aufbewahrung aller Schuhe.","Unterscheide Versinhalt und unsere Übung.","Mā schāʾ Allāh! So erfinden wir keine neue Versangabe.",1),
 t("Was könntest du einem jüngeren Kind freundlich sagen, das in der Moschee laut wird?","Hier beten Menschen. Komm, wir gehen gemeinsam ruhig und sprechen leise.","Sprich freundlich statt zu beschämen.","Allāhumma bārik! Rücksicht beginnt bei deinem eigenen Ton.")],
 "9-10":[
 t("Was gehört tatsächlich zum Sinn von Qurʾān 7:31, und was ist unsere zusätzliche Adab-Übung?","Der Vers erwähnt Zierde bei der Moschee sowie Essen, Trinken und Maßhalten. Leises Gehen ist unsere praktische Rücksichtnahme.","Trenne Vers und Unterrichtsübung.","Mā schāʾ Allāh! Gute Quellenarbeit gehört zum Lernen."),
 c("Wie hilft Rücksicht verschiedenen Menschen in der Moschee?","Sie erleichtert Ruhe, Gebet und gegenseitigen Respekt.","Sie gibt uns das Recht, andere laut zurechtzuweisen.","Denke an das gemeinsame Miteinander.","Richtig! Wir helfen statt zu stören.",1),
 t("Entwirf zwei einfache, freundliche Regeln für euren Moscheebesuch.","Wir stellen die Schuhe ordentlich ab und sprechen im Gebetsbereich leise.","Formuliere konkrete, machbare Schritte.","Allāhumma bārik! Das lässt sich gemeinsam üben.") ]
},
"tarbiyah-eigene-grenzen-respektieren":{
 "4-5":[
 c("Du möchtest bei einem Spiel nicht mitmachen. Was darfst du sagen?","Nein, das möchte ich nicht.","Ich muss mitmachen, auch wenn es mir Angst macht.","Dein Nein ist wichtig.","Mā schāʾ Allāh! Du darfst eine Grenze sagen."),
 c("Jemand hört nicht auf, dich zu drängen. Wer hilft?","Eine erwachsene Person, der ich vertraue.","Niemand, ich muss alles geheim halten.","Denke an Mama, Papa oder eine andere sichere Bezugsperson.","Richtig! Hilfe holen ist mutig und richtig.",1)],
 "6-8":[
 c("Ein Kind sagt deutlich „Nein“. Was ist eine gute Reaktion?","Seine Grenze respektieren.","Es so lange überreden, bis es nachgibt.","Wie möchtest du selbst behandelt werden?","Mā schāʾ Allāh! Grenzen gelten für alle."),
 c("Was lernst du aus unserer Schutzübung?","Bei Druck oder Angst darfst du eine Vertrauensperson holen.","Du musst allein alles lösen.","Denke an deinen Hilfesatz.","Richtig! Erwachsene sind für den Schutz mitverantwortlich.",1),
 t("Formuliere einen kurzen Satz, um bei einem unangenehmen Spiel Hilfe zu holen.","Ich möchte das nicht. Bitte hör auf. Ich sage es einer erwachsenen Person, der ich vertraue.","Du brauchst keine lange Erklärung.","Allāhumma bārik! Ein klarer Satz kann helfen.")],
 "9-10":[
 t("Welche Aussage wird in Qurʾān 4:148 behandelt, und was ist unsere ergänzende Schutzregel?","Der Vers spricht über das Äußern schlechter Rede und den Fall, dass jemandem Unrecht geschieht. Unser Nein-Sagen und Hilfeholen ist eine pädagogische Schutzregel.","Unterscheide Qurʾān-Inhalt und Kinderschutzanwendung.","Mā schāʾ Allāh! Du trennst die Grundlagen korrekt."),
 c("Jemand erzählt dir, dass er unter Druck gesetzt wird. Was ist verantwortungsvoll?","Zuhören und gemeinsam eine sichere erwachsene Vertrauensperson einschalten.","Auf Geheimhaltung bestehen.","Dein Verhalten soll Schutz ermöglichen.","Richtig! Betroffene müssen nicht allein bleiben.",1),
 t("Nenne zwei Dinge, die du tun kannst, wenn deine Grenze nicht respektiert wird.","Klar Nein sagen, Abstand suchen und einer vertrauten erwachsenen Person Bescheid sagen.","Denke an Worte und an Hilfe.","Allāhumma bārik! Du hast konkrete Schutzschritte genannt.") ]
},
"nafs-neid-erkennen":{
 "4-5":[
 c("Ein anderes Kind bekommt ein neues Buch. Was kannst du sagen?","Ich freue mich für dich.","Du darfst das nicht haben.","Denke an das Gute, das du anderen gönnst.","Mā schāʾ Allāh! Du kannst dich für andere freuen."),
 c("Du bemerkst Neid. Was hilft als kleiner Schritt?","Ich darf mich beruhigen und um Allahs Schutz bitten.","Ich muss mich selbst schlecht nennen.","Ein Gefühl macht dich nicht zu einem schlechten Kind.","Richtig! Wir gehen freundlich mit uns und anderen um.",1)],
 "6-8":[
 c("Wovor suchen wir in Qurʾān 113:5 Schutz?","Vor dem Übel des Neiders, wenn er neidet.","Vor der Freude eines anderen Kindes.","Denke an den gelesenen Vers.","Mā schāʾ Allāh! Es geht um den Schutz vor dem Übel des Neides."),
 c("Welcher Gedanke hilft, wenn jemand etwas Schönes bekommt?","Ich darf mich mitfreuen, auch wenn ich selbst etwas wünsche.","Ich muss dem anderen sein Geschenk wegnehmen.","Was wäre freundlich und gerecht?","Allāhumma bārik! Gönnen lässt sich üben.",1),
 t("Beschreibe einen kleinen Schritt, mit dem du Neid freundlich begegnen kannst.","Ich sage innerlich: Ich gönne es dir, und bitte Allah um ein gutes Herz.","Du musst dich nicht beschämen.","Sehr gut! Wir lernen einen Umgang mit dem Gefühl.")],
 "9-10":[
 t("Erkläre ḥasad in einfachen Worten und nenne eine faire Reaktion.","Ḥasad ist Neid, bei dem man jemandem das Gute nicht gönnt. Ich kann bewusst eine freundliche Reaktion wählen.","Denke an Begriff und Verhalten.","Mā schāʾ Allāh! Du erklärst und wendest das Thema an."),
 c("Was wird in Qurʾān 113:5 ausdrücklich erwähnt?","Schutz vor dem Übel eines Neiders, wenn er neidet.","Eine Liste von Spielsachen, die niemand bekommen darf.","Bleibe bei der Stelle.","Richtig! Der Vers ist kurz und klar.",1),
 t("Ein Freund bekommt eine Auszeichnung und du bist neidisch. Wie handelst du, ohne dich selbst zu beschämen?","Ich bemerke mein Gefühl, gratuliere ehrlich und konzentriere mich auf mein eigenes Bemühen.","Gefühl und Handlung sind nicht dasselbe.","Allāhumma bārik! Das ist ein reifer Umgang mit Neid.") ]
},
"fiqh-reinheit-der-gebetskleidung":{
 "4-5":[
 c("Dein Oberteil ist deutlich schmutzig. Was passt zur Unterrichtsübung?","Ich sage Bescheid und nehme, wenn möglich, saubere Kleidung.","Ich verstecke den Schmutz und frage niemanden.","Denk an Reinheit und Hilfe.","Mā schāʾ Allāh! Sauberkeit üben wir in Ruhe."),
 c("Du weißt nicht, ob etwas gewaschen werden soll. Was tust du?","Ich frage eine erwachsene Person.","Ich erfinde selbst eine strenge neue Regel.","Bei Fragen dürfen wir Hilfe holen.","Sehr gut! Du musst die Rechtsfrage nicht selbst lösen.",1)],
 "6-8":[
 c("Welcher Satz gehört zu Qurʾān 74:4?","Und deine Kleider, reinige sie.","Und vergesst alle Gebete.","Denke an den gelesenen Vers.","Mā schāʾ Allāh! Wir haben den Wortlaut sinngemäß besprochen."),
 c("Wie üben wir vor einem Gebet achtsam zu sein?","Wir prüfen unsere Kleidung und fragen bei Unsicherheit nach.","Wir erklären anderen ohne Wissen, ihr Gebet sei ungültig.","Die genaue Rechtsregel ist noch nicht geprüft.","Richtig! Sorgfalt bedeutet nicht, neue Urteile zu erfinden.",1),
 t("Nenne einen kleinen Schritt für saubere Gebetskleidung.","Ich schaue nach deutlichem Schmutz und wechsle gegebenenfalls mit Hilfe die Kleidung.","Es geht um eine Übung, nicht um ein neues Rechtsurteil.","Allāhumma bārik! Das ist ein vorsichtiger, praktischer Schritt.")],
 "9-10":[
 t("Was lehrt Qurʾān 74:4, und weshalb ergibt sich daraus allein noch keine vollständige hanbalitische Fiqh-Regel?","Der Vers spricht vom Reinigen der Kleider. Die genauen Voraussetzungen und Rechtsfolgen des Gebets müssen gesondert anhand geeigneter Fiqh-Quellen geprüft werden.","Trenne Textaussage und juristische Einzelregel.","Richtig! Du ergänzt keine ungeprüften Rechtsfolgen."),
 c("Eine Freundin fragt, ob ein bestimmter Fleck das Gebet ungültig macht. Was ist korrekt?","Eine sachkundige erwachsene Person fragen, statt ein Urteil zu erfinden.","Ohne Nachweis sofort die Ungültigkeit erklären.","Wir kennen hier nicht jede Fiqh-Einzelheit.","Mā schāʾ Allāh! Fragen ist genauer als Raten.",1),
 t("Welche praktische Vorbereitung aus unserer Stunde ist für Kinder sinnvoll?","Vor dem Üben nach Sauberkeit schauen und bei Unsicherheit Eltern oder Lehrpersonen fragen.","Beschreibe eine sichere Übung.","Allāhumma bārik! Du hast Praxis und Quellenprüfung getrennt.") ]
},
"quran-respektvoll-auswendig-lernen":{
 "4-5":[
 c("Du lernst einen kleinen Satz. Was hilft dir?","Ruhig und aufmerksam wiederholen.","So schnell sprechen, dass du nichts verstehst.","Wir üben ohne Eile.","Mā schāʾ Allāh! Langsam üben kann helfen."),
 c("Du versprichst dich einmal. Was ist richtig?","Ich darf es freundlich noch einmal versuchen.","Ich muss mich dafür schämen.","Lernen braucht Geduld.","Sehr gut! Du darfst in deinem Tempo lernen.",1)],
 "6-8":[
 c("An wen richtet sich Qurʾān 75:16 im unmittelbaren Zusammenhang?","An den Propheten ﷺ beim Empfang der Offenbarung.","An eine Schulklasse beim Diktat.","Der Vers hat einen eigenen Offenbarungszusammenhang.","Mā schāʾ Allāh! Wir verwechseln Verskontext und unsere Übung nicht."),
 c("Was üben wir daraus im Unterricht zusätzlich?","Einen kurzen deutschen Merksatz ruhig wiederholen.","Neue arabische Verse selbst erfinden.","Unsere Lernübung ist eine didaktische Anwendung.","Richtig! Der Merksatz ist kein Qurʾān-Vers.",1),
 t("Wie kannst du dir beim Lernen helfen, wenn du zu schnell sprichst?","Ich halte kurz an und wiederhole einen Satz langsam und deutlich.","Denke an einen kleinen Schritt.","Allāhumma bārik! So übst du geduldig.")],
 "9-10":[
 t("Was sagt Qurʾān 75:16 im Zusammenhang der Offenbarung, und was ist nur unsere Lernübung?","Der Vers richtet sich an den Propheten ﷺ und spricht davon, beim Empfang der Offenbarung nicht eilig die Zunge zu bewegen. Wir übertragen das nicht als neuen Rechtsbefehl, sondern üben ruhig.","Achte auf ursprüngliche Ansprache und Didaktik.","Mā schāʾ Allāh! Du trennst Offenbarungskontext und Übung."),
 c("Warum wiederholen wir im Unterricht heute keinen selbst erfundenen arabischen Vers?","Weil der Wortlaut des Qurʾān nicht erfunden oder verändert wird.","Weil man beim Lernen nie sprechen darf.","Halte dich an überlieferte Texte.","Richtig! Wir können einen deutschen Merksatz üben.",1),
 t("Nenne eine freundliche Lernstrategie, wenn ein Kind beim Wiederholen Fehler macht.","Wir geben ihm Zeit, lassen es einen kurzen Abschnitt ruhig wiederholen und beschämen es nicht.","Lernen ohne Leistungsdruck.","Allāhumma bārik! Ein ruhiger Lernraum hilft.") ]
},
"sirah-isa-als-gesandter":{
 "4-5":[
 c("Wer ist ʿĪsā, Friede sei mit ihm?","Ein Gesandter Allahs.","Ein erfundener König.","Denke an die Qurʾān-Stelle.","Mā schāʾ Allāh! ʿĪsā ist einer der Gesandten Allahs."),
 c("Wie sprechen wir über einen Propheten?","Mit Respekt.","Mit Spott.","Wir behandeln die Gesandten ehrenvoll.","Allāhumma bārik! Respektvolle Worte sind wichtig.",1)],
 "6-8":[
 c("Wie nennt Qurʾān 4:171 ʿĪsā?","Einen Gesandten Allahs.","Den Verfasser des Qurʾān.","Wir halten uns an den gelesenen Vers.","Mā schāʾ Allāh! Diese Bezeichnung steht im Vers."),
 c("Wie heißt ʿĪsās Mutter?","Maryam.","Ḫadīǧah.","Den Namen nennt die Qurʾān-Stelle.","Richtig! Im Vers wird Maryam erwähnt.",1),
 t("Wie antwortest du einem Kind, das fragt, wer ʿĪsā war?","ʿĪsā, Friede sei mit ihm, war ein Gesandter Allahs und der Sohn Maryams.","Erkläre kurz und respektvoll.","Allāhumma bārik! Das ist eine klare Antwort.")],
 "9-10":[
 t("Welche zwei Angaben macht Qurʾān 4:171 ausdrücklich über ʿĪsā?","Er ist der Sohn Maryams und ein Gesandter Allahs.","Bleibe bei den im Vers genannten Angaben.","Mā schāʾ Allāh! Du hast beides erkannt."),
 c("Was sollten wir bei einer Erklärung zu ʿĪsā vermeiden?","Erfundene Geschichten, die in der behandelten Quelle nicht belegt sind.","Eine respektvolle Nennung seines Namens.","Wissen und Vermutung trennen.","Richtig! Eine belegte Erklärung braucht keine Ausschmückung.",1),
 t("Wieso ist es sinnvoll, zwischen Qurʾān-Aussage und erzählter Zusatzgeschichte zu unterscheiden?","Weil wir nur als Offenbarung ausgeben dürfen, was tatsächlich aus ihr stammt; weitere Geschichten müssen eigens geprüft werden.","Die Zuordnung schützt vor Fehlern.","Allāhumma bārik! Das ist ein wichtiger Umgang mit Quellen.") ]
},
"dua-fuer-eltern-gutes-erbitten":{
 "4-5":[
 c("Um was bitten wir Allah für unsere Eltern?","Um Barmherzigkeit.","Darum, immer Recht zu bekommen.","Denke an die Bitte aus dem Vers.","Mā schāʾ Allāh! Wir bitten Allah um Barmherzigkeit."),
 c("Wie können wir die Bitte heute lernen?","Zuerst ihren Sinn in einfachen Worten verstehen.","Einen unbekannten Text erfinden.","Wir lernen in unserem Tempo.","Sehr gut! Verstehen gehört zum Lernen.",1)],
 "6-8":[
 c("Welcher Wunsch steht in der Bitte aus Qurʾān 17:24?","Mein Herr, erbarme Dich ihrer.","Mein Herr, mache mich immer zum Sieger.","Erinnere dich an die Barmherzigkeit.","Mā schāʾ Allāh! Die Bitte handelt von Barmherzigkeit."),
 c("Was passt zum Lernen eines Duʿāʾ?","Den Sinn aufmerksam verstehen und ruhig sprechen.","Andere Kinder auslachen, wenn sie sich versprechen.","Wir unterstützen einander.","Allāhumma bārik! Jeder darf im eigenen Tempo lernen.",1),
 t("Formuliere den Sinn der Bitte für deine Eltern auf Deutsch.","Mein Herr, schenke meinen Eltern Barmherzigkeit, wie sie mich klein aufgezogen haben.","Bleibe beim Sinn von Qurʾān 17:24.","Mā schāʾ Allāh! Das gibt den Inhalt wieder.")],
 "9-10":[
 t("Welche zwei Gedanken verbindet die Bitte in Qurʾān 17:24?","Barmherzigkeit gegenüber den Eltern und Erinnerung daran, dass sie einen klein aufgezogen haben.","Achte auf Bitte und Begründung.","Mā schāʾ Allāh! Du erkennst den Aufbau des Verses."),
 c("Was ist beim Erklären der arabischen Bitte besonders wichtig?","Den genauen arabischen Wortlaut von unserer deutschen Sinndeutung unterscheiden.","Eine eigene arabische Formel als Qurʾān ausgeben.","Vermeide erfundene Originaltexte.","Richtig! Eine Erklärung ist keine neue Offenbarung.",1),
 t("Wie kannst du einem jüngeren Kind die Bedeutung der Bitte erklären?","Wir bitten Allah darum, unseren Eltern Barmherzigkeit zu schenken.","Verwende einfache und freundliche Worte.","Allāhumma bārik! Das ist gut verständlich.") ]
},
"family-nein-sagen-persoenliche-sicherheit":{
 "4-5":[
 c("Du möchtest nicht umarmt werden. Was darfst du sagen?","Nein, ich möchte das nicht.","Ich darf niemals Nein sagen.","Dein Körper und deine Grenze sind wichtig.","Mā schāʾ Allāh! Ein Nein darf respektiert werden."),
 c("Eine Person hört nicht auf. Was tust du?","Ich gehe zu einer erwachsenen Person, der ich vertraue.","Ich behalte alles für mich.","Hilfe holen ist richtig.","Allāhumma bārik! Du musst nicht allein bleiben.",1)],
 "6-8":[
 c("Was ist eine gute Reaktion, wenn jemand eine Umarmung ablehnt?","Das Nein respektieren.","Trotzdem festhalten.","Jede Person hat Grenzen.","Richtig! Wir respektieren ein Nein."),
 c("Was üben wir in dieser Stunde?","Einen klaren Hilfesatz und den Weg zur Vertrauensperson.","Unangenehme Berührungen nachspielen.","Die Übung soll sicher sein.","Mā schāʾ Allāh! Wir spielen keine Grenzverletzung nach.",1),
 t("Was könntest du einer erwachsenen Vertrauensperson sagen, wenn dir eine Berührung unangenehm war?","Ich wollte das nicht. Ich habe Nein gesagt. Bitte hilf mir.","Sag es in einfachen, klaren Worten.","Allāhumma bārik! Du darfst Hilfe verlangen.")],
 "9-10":[
 t("Was lehrt der behandelte Vers 4:148, und welche Schutzregel ergänzen wir für die Kinder?","Der Vers spricht über schlechte Rede und davon, dass jemandem Unrecht geschehen ist. Die Regel, bei unangenehmer Berührung Nein zu sagen und Hilfe zu holen, ist unsere Kinderschutzanwendung.","Verwechsle Schutzübung nicht mit einem wörtlichen Verssatz.","Mā schāʾ Allāh! Du trennst die Aussagen sorgfältig."),
 c("Eine betroffene Person erzählt dir von einer Grenzverletzung. Wie reagierst du?","Ich nehme sie ernst und helfe ihr, eine sichere erwachsene Vertrauensperson zu erreichen.","Ich verlange, dass sie die Sache geheim hält.","Niemand soll mit Unrecht allein bleiben.","Richtig! Zuhören und sichere Hilfe sind wichtig.",1),
 t("Nenne zwei sichere Schritte, wenn eine persönliche Grenze missachtet wird.","Klar Nein sagen, mich entfernen, wenn möglich, und einer vertrauten erwachsenen Person berichten.","Die betroffene Person trägt keine Schuld.","Allāhumma bārik! Du hast gute Schutzschritte erklärt.") ]
}
};
const ages=["4-5","6-8","9-10"];
const expectedKeys=Object.keys(revisions);
if(expectedKeys.length!==12)throw Error("V39 expected 12 lesson revisions");
const changed={...prior};
for(const [id,blocks] of Object.entries(revisions)){
 const original=prior[id];
 if(!original||!original.sourceAudit||original.sourceAudit.scientificApproval!==false)
  throw Error("V39 cannot safely revise "+id);
 for(const age of ages){
  const qs=blocks[age];const want=age==="4-5"?2:3;
  if(!Array.isArray(qs)||qs.length!==want)throw Error("V39 quiz count "+id+"/"+age);
  for(const q of qs)if(!q.prompt||!q.hint||!q.explain||
   (q.type==="choice"&&(!Array.isArray(q.options)||q.options.length!==2||![0,1].includes(q.correct)))||
   (q.type==="text"&&!q.sample))throw Error("V39 malformed question "+id+"/"+age);
 }
 changed[id]={...original,questions:{...original.questions,...blocks}};
}
window.DARKidsAcademyCurriculum=Object.freeze(changed);
window.DARKidsAcademyCurriculumV39=Object.freeze({
 version:"20261014-v39",revisedSlots:[99,100,101,102,103,104,105,106,107,108,109,110],
 ids:expectedKeys,approvedAgeVersions:0,religiousSourcesVerified:false,
 voiceRecordingsApproved:false
});
})();
