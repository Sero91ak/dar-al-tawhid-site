/* DĀR AL TAWḤĪD KIDS AKADEMI · V42
 * Kindgerechte, thematisch individuelle Quizredaktion: Slots 135–141 und 143–146.
 * Slot 142 bleibt beim gesondert geprüften V38-Fiqh-Quiz.
 * Redaktioneller Entwurf; keine religiöse Freigabe, keine Audioerzeugung.
 */
(function(){
"use strict";
const prior=window.DARKidsAcademyCurriculum;
if(!prior||!window.DARKidsAcademyCurriculumV41)throw Error("V42 requires V41");
const c=(prompt,right,wrong,hint,explain,pos=0)=>({type:"choice",prompt,options:pos?[wrong,right]:[right,wrong],correct:pos,hint,explain});
const t=(prompt,sample,hint,explain)=>({type:"text",prompt,sample,hint,explain});
const revisions={
"tawhid-schoene-namen-allahs":{
"4-5":[
c("Was lernen wir über Allahs Namen?","Allah hat wunderschöne Namen.","Wir erfinden neue Namen für Allah.","Wir bleiben beim Vers.","Mā schāʾ Allāh! Qurʾān 7:180 spricht von Allahs schönsten Namen."),
c("Wie dürfen wir Allah anrufen?","Mit einem Seiner schönen Namen.","Nur mit einem erfundenen Namen.","Denk an unsere Bitte.","Allāhumma bārik! Wir rufen Allah mit Seinen Namen an.",1)],
"6-8":[
c("Was lehrt Qurʾān 7:180?","Allah gehören die schönsten Namen; wir dürfen Ihn damit anrufen.","Jeder ausgedachte Beiname ist ein gesicherter Name Allahs.","Achte auf den Wortlaut.","Mā schāʾ Allāh! Allahs Namen lernen wir aus verlässlichen Offenbarungsquellen."),
c("Du hörst den Namen ar-Raḥmān. Was ist ein passender nächster Schritt?","Nach seiner Bedeutung fragen und Allah damit anrufen.","Ohne Beleg eine neue Liste von Namen schreiben.","Bleibe beim bekannten Namen.","Sehr gut! Du fragst nach der Bedeutung und lernst sorgfältig.",1),
t("Wozu benutzen wir Allahs schöne Namen im Bittgebet?","Wir können Allah mit einem gesichert überlieferten schönen Namen anrufen.","Ein kurzer Satz genügt.","Allāhumma bārik! Du verbindest Namen und Duʿāʾ.")],
"9-10":[
t("Welche Aufforderung steht in Qurʾān 7:180?","Allah gehören die schönsten Namen; ruft Ihn mit ihnen an.","Nenne den Sinn des Verses.","Mā schāʾ Allāh! Das ist der Kern unserer Stunde."),
c("Welche Aussage ginge über unseren Beleg hinaus?","Einen neuen Namen ohne Quelle als Namen Allahs festlegen.","Einen im Vers genannten Namen respektvoll erklären.","Denke an sichere Belege.","Richtig! Ein Name wird nicht durch Fantasie zur Offenbarung."),
t("Wie erklärst du einem jüngeren Kind, warum wir Namen nicht einfach erfinden?","Wir wollen über Allah nur sagen, was durch Qurʾān oder zuverlässige Sunnah belegt ist.","Unterscheide Wissen und Vermutung.","Allāhumma bārik! Das ist sorgsames Lernen.")]
},
"iman-letzter-gesandter":{
"4-5":[
c("Wie heißt der letzte Prophet?","Muḥammad ﷺ.","Ein erfundener Name.","Erinnere dich an den Namen.","Mā schāʾ Allāh! Muḥammad ﷺ ist Allahs Gesandter."),
c("Was können wir nach seinem Namen sagen?","Ṣallallāhu ʿalaihi wa-sallam.","Ein Schimpfwort.","Wir sprechen mit Respekt.","Allāhumma bārik! Du ehrst den Propheten.",1)],
"6-8":[
c("Wie bezeichnet Qurʾān 33:40 Muḥammad ﷺ?","Als Gesandten Allahs und Siegel der Propheten.","Als einen Gesandten, nach dem neue Propheten folgen.","Achte auf das Wort Siegel.","Mā schāʾ Allāh! Der Vers nennt ihn das Siegel der Propheten."),
c("Ein Kind fragt, ob nach ihm weitere Propheten kommen. Welche Antwort passt?","Nein, Muḥammad ﷺ ist der letzte Prophet.","Ja, wir dürfen neue Propheten erfinden.","Denk an Qurʾān 33:40.","Sehr gut! So lernen wir die Aussage des Verses.",1),
t("Sage einen respektvollen Satz über den Gesandten.","Muḥammad ﷺ ist der Gesandte Allahs und der letzte Prophet.","Name und Eigenschaft genügen.","Allāhumma bārik! Das ist gut wiedergegeben.")],
"9-10":[
t("Welche beiden Bezeichnungen für Muḥammad ﷺ nennt Qurʾān 33:40?","Gesandter Allahs und Siegel der Propheten.","Nenne beide Teile.","Mā schāʾ Allāh! Du hast den Text genau beachtet."),
c("Was dürfen wir ohne weitere Quelle nicht aus dieser Stelle ableiten?","Eine genaue Jahreszahl aus der Sīrah.","Dass er das Siegel der Propheten ist.","Der Vers nennt keine Jahreszahl.","Richtig! Die Quelle muss zur Behauptung passen."),
t("Was bedeutet das Wort 'Siegel' in der Stunde?","Mit Muḥammad ﷺ ist die Reihe der Propheten abgeschlossen; nach ihm kommt kein weiterer Prophet.","Erkläre ohne erfundene Geschichte.","Allāhumma bārik! Du erklärst den Glaubensinhalt klar.")]
},
"ikhlas-dua-aufrichtig":{
"4-5":[
c("Was passt zu einer ehrlichen Bitte an Allah?","Ich bitte aufrichtig.","Ich sage etwas, das ich gar nicht meine.","Denke an dein Herz.","Mā schāʾ Allāh! Duʿāʾ darf ehrlich sein."),
c("Du bittest um Hilfe beim Lernen. Was tust du außerdem?","Ich bemühe mich beim Lernen.","Ich muss deshalb nie üben.","Bittgebet und Mühe passen zusammen.","Allāhumma bārik! Wir bitten und bemühen uns.",1)],
"6-8":[
c("Was ist der Kern der gelesenen Stelle Qurʾān 40:60?","Allah fordert dazu auf, Ihn anzurufen.","Eine Prüfung besteht immer ohne eigenes Lernen.","Denke an die Aufforderung im Vers.","Mā schāʾ Allāh! Allah ermutigt zum Bittgebet."),
c("Ein Kind bittet um gutes Lernen. Was zeigt aufrichtige Absicht?","Es bittet Allah und übt weiter.","Es möchte ohne Übung anderen überlegen sein.","Aufrichtig heißt nicht prahlen.","Richtig! Duʿāʾ ersetzt nicht unser Bemühen.",1),
t("Formuliere eine eigene erlaubte Bitte und eine passende kleine Tat.","O Allah, hilf mir beim Verstehen. Ich höre zu und übe.","Die Tat gehört zu deiner Bitte.","Allāhumma bārik! Bitte und Handlung passen zusammen.")],
"9-10":[
t("Welchen Aufruf an die Menschen enthält Qurʾān 40:60?","Allah ruft dazu auf, Ihn anzurufen, und verheißt Erhörung.","Bleibe bei der Aussage des Verses.","Mā schāʾ Allāh! Du erkennst den Bezug zum Duʿāʾ."),
c("Welche Aussage wäre eine Übertreibung?","Ein Bittgebet garantiert sofort die von mir gewünschte Schulnote.","Wir dürfen Allah aufrichtig bitten.","Verwechsle Hoffnung nicht mit einer Garantie für Noten.","Richtig! Der Vers ist keine Formel für Schulnoten."),
t("Warum gehört eigenes Bemühen zur Unterrichtsübung?","Ich bitte Allah um Hilfe und tue zugleich, was mir beim Lernen möglich ist; diese Übung ist keine wörtliche Versformulierung.","Trenne Offenbarung und Lernbeispiel.","Allāhumma bārik! Du ordnest die Ebenen sauber.")]
},
"akhlaq-schaden-abwenden":{
"4-5":[
c("Du siehst etwas Spitzes auf der Treppe. Was machst du?","Ich sage einer erwachsenen Person Bescheid.","Ich fasse es an, obwohl es gefährlich ist.","Hilfe holen ist mutig.","Mā schāʾ Allāh! Du denkst an die Sicherheit."),
c("Soll ein Kind eine gefährliche Sache allein beseitigen?","Nein, es holt Hilfe.","Ja, auch wenn es sich dabei verletzt.","Schütze dich und andere.","Allāhumma bārik! Erwachsene können helfen.",1)],
"6-8":[
c("Wozu ruft der gelesene Teil von Qurʾān 5:2 auf?","Zur Zusammenarbeit im Guten, nicht zum Helfen bei Unrecht.","Zum Zuschauen, wenn andere in Gefahr sind.","Achte auf die Zusammenarbeit.","Mā schāʾ Allāh! Wir helfen einander beim Guten."),
c("Auf der Treppe liegt ein gefährlicher Gegenstand. Was ist verantwortungsvoll?","Abstand halten und eine erwachsene Person warnen.","Den Gegenstand ausprobieren.","Gefahr zuerst melden.","Sehr gut! Helfen heißt nicht, sich selbst zu verletzen.",1),
t("Nenne eine kleine sichere Hilfe für andere.","Ich sage einer Aufsichtsperson, dass etwas Spitzes im Weg liegt.","Gefahr erkennen, Abstand halten, melden.","Allāhumma bārik! Das ist umsichtig.")],
"9-10":[
t("Welche zwei Arten der Zusammenarbeit unterscheidet Qurʾān 5:2?","Einander bei Rechtschaffenheit und Gottesfurcht helfen, nicht bei Sünde und Übertretung.","Nenne beide Seiten.","Mā schāʾ Allāh! Du hast den Gegensatz verstanden."),
c("Welche Übung passt NICHT zur Schutzregel dieser Stunde?","Mit bloßen Händen nach einer unbekannten gefährlichen Sache greifen.","Eine Aufsichtsperson auf eine Gefahr aufmerksam machen.","Schutz geht vor Mutproben.","Richtig! Verantwortung bedeutet nicht unnötiges Risiko."),
t("Warum ist das Treppenbeispiel keine einzelne Überlieferung über die Ṣaḥābah?","Es ist eine erfundene Alltagssituation zum Verständnis des Qurʾān-Grundsatzes, kein überlieferter Bericht.","Unterscheide Vers und Didaktik.","Allāhumma bārik! Du unterscheidest die Quellenarten.")]
},
"adab-als-gast":{
"4-5":[
c("Du möchtest eine Nachbarwohnung betreten. Was machst du zuerst?","Ich klopfe an und warte.","Ich renne einfach hinein.","Andere Häuser haben eine Tür und Regeln.","Mā schāʾ Allāh! Du wartest auf Erlaubnis."),
c("Was passt zu einem freundlichen Besuch?","Grüßen und um Erlaubnis fragen.","Ohne Antwort hineingehen.","Respekt vor den Bewohnern.","Allāhumma bārik! Du grüßt freundlich.",1)],
"6-8":[
c("Was lehrt Qurʾān 24:27 über fremde Wohnungen?","Vor dem Eintreten um Erlaubnis fragen und die Bewohner grüßen.","Jede Wohnung ohne Fragen betreten.","Achte auf beide Schritte.","Mā schāʾ Allāh! Erlaubnis und Gruß gehören zusammen."),
c("Es öffnet niemand. Was machst du?","Ich warte oder gehe wieder und frage später.","Ich gehe durch eine offene Tür hinein.","Niemand hat Erlaubnis gegeben.","Richtig! Du respektierst den privaten Raum.",1),
t("Sage einen freundlichen Satz, wenn du zu Besuch kommst.","Assalāmu ʿalaikum. Darf ich hereinkommen?","Gruß und Frage verbinden.","Allāhumma bārik! Das ist höflich.")],
"9-10":[
t("Welche zwei Handlungen verbindet Qurʾān 24:27?","Erlaubnis einholen und die Bewohner begrüßen, bevor man fremde Häuser betritt.","Nenne beide Handlungen.","Mā schāʾ Allāh! Du kennst den Sinn der Stelle."),
c("Ein Freund lässt dich ohne Wissen der Eltern herein. Was ist sinnvoll?","Auf die Erlaubnis der zuständigen Erwachsenen achten.","Sich im Haus überall umsehen.","Respektiere die Privatsphäre.","Richtig! Besucher handeln rücksichtsvoll."),
t("Wieso ist die Übung 'anklopfen, warten, grüßen' ein gutes Beispiel?","Sie veranschaulicht die im Vers genannte Erlaubnis und den Gruß im Alltag.","Verbinde Text und Alltag.","Allāhumma bārik! Der Zusammenhang ist klar.")]
},
"tarbiyah-bildschirme-bewusst":{
"4-5":[
c("Die vereinbarte Bildschirmzeit ist vorbei. Was tust du?","Ich lege das Gerät weg.","Ich halte es heimlich fest.","Denke an die Abmachung.","Mā schāʾ Allāh! Du hältst dein Wort."),
c("Welche Beschäftigung kannst du danach wählen?","Ein Buch anschauen.","Die Abmachung heimlich umgehen.","Es gibt viele schöne Tätigkeiten.","Allāhumma bārik! Du findest etwas anderes.",1)],
"6-8":[
c("Wozu mahnt Qurʾān 17:36?","Nicht blind dem zu folgen, wovon man kein Wissen hat.","Alles ungeprüft weiterzuleiten.","Denke an Wissen und Verantwortung.","Mā schāʾ Allāh! Wir prüfen, bevor wir folgen."),
c("Dir wird ein seltsames Video gezeigt. Was ist ein guter nächster Schritt?","Bei Unsicherheit einen vertrauenswürdigen Erwachsenen fragen.","Es ohne Nachdenken an alle senden.","Nicht alles im Netz stimmt.","Richtig! Erst verstehen, dann handeln.",1),
t("Was tust du nach einer vereinbarten Bildschirmzeit?","Ich beende die Nutzung und spiele oder lese etwas anderes.","Nenne eine konkrete Alternative.","Allāhumma bārik! Du planst bewusst.")],
"9-10":[
t("Welche Fähigkeiten nennt Qurʾān 17:36 als Bereiche unserer Verantwortung?","Gehör, Augenlicht und Herz werden in dem Vers genannt.","Nenne die drei Bereiche.","Mā schāʾ Allāh! Du erinnerst dich an den Vers."),
c("Was wäre NICHT unmittelbar als Wortlaut von 17:36 belegt?","Eine bestimmte Anzahl erlaubter Bildschirmminuten.","Die Mahnung, nichts ohne Wissen zu verfolgen.","Trenne Versinhalt und Familienvereinbarung.","Richtig! Die Zeitregel ist unsere Alltagspraxis, nicht eine Verszahl."),
t("Wie setzt du den Gedanken des Verses bei Videos um?","Ich frage nach der Quelle, glaube nicht alles sofort und bespreche Unsicheres mit einem vertrauenswürdigen Erwachsenen.","Prüfen statt nachmachen.","Allāhumma bārik! Du handelst achtsam.")]
},
"nafs-hoffnung-barmherzigkeit":{
"4-5":[
c("Du machst einen Fehler beim Lernen. Was kannst du tun?","Ich versuche es noch einmal.","Ich darf nie wieder üben.","Fehler gehören zum Lernen.","Mā schāʾ Allāh! Du darfst weiterlernen."),
c("Ist nach einem Fehler immer alles verloren?","Nein.","Ja, ich kann nichts mehr ändern.","Denk an einen neuen Anfang.","Allāhumma bārik! Du kannst umkehren und es besser machen.",1)],
"6-8":[
c("Was sagt Yaʿqūb zu seinen Söhnen im Qurʾān 12:87?","Sie sollen suchen und nicht an Allahs Erleichterung verzweifeln.","Sie sollen alle Hoffnung aufgeben.","Denke an die Aufforderung des Vaters.","Mā schāʾ Allāh! Die Stelle ermutigt zur Hoffnung."),
c("Eine Aufgabe gelingt beim ersten Versuch nicht. Was passt zu unserer Übung?","Hilfe erbitten und den nächsten Schritt versuchen.","Sich selbst als wertlos bezeichnen.","Hoffnung führt zum nächsten Schritt.","Sehr gut! Üben ist erlaubt.",1),
t("Nenne einen kleinen Schritt nach einem Fehler.","Ich frage ruhig nach Hilfe und versuche die Aufgabe erneut.","Wähle einen erreichbaren Schritt.","Allāhumma bārik! Das ist hoffnungsvoll.")],
"9-10":[
t("In welcher Situation fällt die Ermutigung aus Qurʾān 12:87?","Yaʿqūb spricht zu seinen Söhnen und fordert sie auf, nach Yūsuf und seinem Bruder zu suchen und nicht an Allahs Erleichterung zu verzweifeln.","Nenne den Kontext der Sūrah.","Mā schāʾ Allāh! Du beachtest den Zusammenhang."),
c("Welche Behauptung würde die Stelle überdehnen?","Dass jede schwierige Schulaufgabe ohne Arbeit automatisch gelöst wird.","Dass Menschen die Hoffnung nicht verlieren sollen.","Hoffnung ist keine Sofortgarantie.","Richtig! Wir dürfen Hoffnung und Mühe verbinden."),
t("Warum ist das Beispiel mit der Hausaufgabe eine eigene Unterrichtsübung?","Der Qurʾān berichtet die Worte Yaʿqūbs; die Hausaufgabe ist nur ein kindgerechtes Beispiel für erneutes Bemühen.","Trenne Bericht und Anwendung.","Allāhumma bārik! Du liest quellentreu.")]
},
"quran-was-bedeutet-sunnah":{
"4-5":[
c("Wer ist unser gutes Vorbild im Islam?","Der Prophet Muḥammad ﷺ.","Jede erfundene Figur.","Denk an den Gesandten.","Mā schāʾ Allāh! Wir lernen vom Propheten."),
c("Dürfen wir Geschichten über den Propheten erfinden?","Nein.","Ja, wenn sie schön klingen.","Wir wollen die Wahrheit erzählen.","Allāhumma bārik! Überlieferungen sollen zuverlässig sein.",1)],
"6-8":[
c("Was lehrt Qurʾān 33:21 über den Gesandten Allahs?","Er ist ein schönes Vorbild.","Man darf beliebige Geschichten über ihn erfinden.","Achte auf den Vers.","Mā schāʾ Allāh! Der Prophet ﷺ ist unser Vorbild."),
c("Jemand erzählt eine ungewöhnliche Geschichte als Hadith. Was kannst du tun?","Freundlich nach einer zuverlässigen Quelle fragen.","Sie sofort als sicher weiterverbreiten.","Gute Absicht ersetzt keine Quelle.","Richtig! Wir prüfen einen Bericht.",1),
t("Erkläre das Wort Sunnah einfach.","Die Sunnah umfasst die überlieferte Lebensweise und das Vorbild des Propheten ﷺ.","Ein verständlicher Satz genügt.","Allāhumma bārik! Du kannst es erklären.")],
"9-10":[
t("Welche Grundlage für das prophetische Vorbild bietet Qurʾān 33:21?","Im Gesandten Allahs liegt ein schönes Vorbild für diejenigen, die auf Allah und den Jüngsten Tag hoffen und Allah häufig gedenken.","Beziehe dich auf den Vers.","Mā schāʾ Allāh! Du nennst die Aussage passend."),
c("Was reicht allein NICHT aus, um eine konkrete Sunnah-Handlung als überliefert zu bezeichnen?","Ein nur ausgedachtes Beispiel ohne Überlieferung.","Ein zuverlässig belegter Bericht.","Frage nach dem Beleg einer Handlung.","Richtig! Vorbild und konkrete Belege müssen unterschieden werden."),
t("Warum behaupten wir zu Qurʾān 33:21 nicht automatisch eine Hadithnummer?","Der Vers begründet das Vorbild des Propheten, aber eine bestimmte Hadithnummer braucht einen eigenen geprüften Beleg.","Qurʾān-Stelle und Hadithnachweis unterscheiden.","Allāhumma bārik! Das ist sorgfältig.")]
},
"sirah-hijrah-madinah":{
"4-5":[
c("Was gehört zur Hiǧrah-Geschichte aus unserem Vers?","Der Prophet ﷺ und sein Begleiter waren in einer Höhle.","Eine von uns erfundene Fluchtstrecke.","Denke an den Ort im Vers.","Mā schāʾ Allāh! Der Vers erwähnt die Höhle."),
c("Welcher Trostsatz wird im Vers genannt?","Sei nicht traurig, Allah ist mit uns.","Niemand darf um Hilfe bitten.","Denk an die Worte in der Höhle.","Allāhumma bārik! Du hast den Trostsatz gelernt.",1)],
"6-8":[
c("Welche Stelle spricht von den zwei Menschen in der Höhle?","Qurʾān 9:40.","Qurʾān 24:27.","Denke an unsere Hiǧrah-Stunde.","Mā schāʾ Allāh! Qurʾān 9:40 beschreibt die Situation."),
c("Was steht im gelesenen Vers als Trost?","Sei nicht traurig, Allah ist mit uns.","Wir können die ganze Route aus diesem Satz berechnen.","Achte auf die Worte, nicht auf Fantasie.","Richtig! Der Trostsatz gehört zum Vers.",1),
t("Nenne eine Tatsache aus dem Vers, ohne die Reise auszuschmücken.","Der Prophet ﷺ war mit einem Gefährten in einer Höhle.","Ein belegtes Detail genügt.","Allāhumma bārik! Du erzählst quellentreu.")],
"9-10":[
t("Welche Situation schildert Qurʾān 9:40?","Der Prophet ﷺ war als einer von zweien mit seinem Gefährten in der Höhle und sagte: Sei nicht traurig, Allah ist mit uns.","Nenne Ort und Trostsatz.","Mā schāʾ Allāh! Das fasst die Stelle zusammen."),
c("Welche Angabe darf aus dem einzelnen Vers nicht als detailliert belegte Route ausgegeben werden?","Jeder Rastplatz der gesamten Reise.","Die Erwähnung der Höhle.","Der Vers ist keine vollständige Wegkarte.","Richtig! Quellen können verschieden ausführlich sein."),
t("Wie unterscheidest du sichere Versangaben von einer zusätzlichen Sīrah-Erzählung?","Der Höhlenaufenthalt und Trostsatz stehen in 9:40. Weitere Reisedetails benötigen eigene geprüfte Belege.","Nenne, wofür ein zweiter Beleg nötig wäre.","Allāhumma bārik! Du achtest auf Quellen.")]
},
"dua-beim-verlassen-des-hauses":{
"4-5":[
c("Worum können wir Allah bitten, wenn wir hinausgehen?","Um einen guten und wahrhaftigen Ausgang.","Darum, andere zu ärgern.","Denk an etwas Gutes.","Mā schāʾ Allāh! Eine gute Bitte ist erlaubt."),
c("Dürfen wir Allah auch in eigenen Worten bitten?","Ja.","Nein, wir dürfen nie eigene Worte benutzen.","Duʿāʾ kann eine ehrliche Bitte sein.","Allāhumma bārik! Du kannst aufrichtig bitten.",1)],
"6-8":[
c("Welche Bitte kommt in Qurʾān 17:80 vor?","Um einen wahrhaftigen Eingang und Ausgang und Allahs Hilfe.","Um ein erfundenes Reiseabzeichen.","Denk an Eingang und Ausgang.","Mā schāʾ Allāh! Der Vers enthält ein Bittgebet."),
c("Ist 17:80 in dieser Stunde schon als fester Wortlaut einer speziellen Hausverlassen-Sunnah nachgewiesen?","Nein, das ist hier nicht belegt.","Ja, ohne weitere Überlieferung.","Die Quelle ist ein Qurʾān-Vers.","Richtig! Wir trennen den Vers von anderen Duʿāʾ-Überlieferungen.",1),
t("Sage eine kurze erlaubte eigene Bitte beim Hinausgehen.","O Allah, begleite mich zu Gutem und beschütze mich.","Eine persönliche Bitte genügt.","Allāhumma bārik! Du darfst Allah bitten.")],
"9-10":[
t("Welche drei Elemente enthält das Bittgebet aus Qurʾān 17:80?","Einen wahrhaftigen Eingang, einen wahrhaftigen Ausgang und helfende Unterstützung von Allah.","Achte auf die drei Teile.","Mā schāʾ Allāh! Du hast die Teile erkannt."),
c("Welche Schlussfolgerung wäre ohne weiteren Hadithbeleg unzulässig?","Das sei bereits die speziell festgelegte Sunnah-Formel für jedes Verlassen der Wohnung.","Der Vers enthält eine Bitte an Allah.","Für eine bestimmte Ritualformel braucht es einen Beleg.","Richtig! Wir führen keine zusätzliche Regel ein."),
t("Wie kannst du die Bitte im Alltag anwenden, ohne einen festen Brauch zu erfinden?","Ich verstehe den Qurʾān-Vers und kann Allah um einen guten Weg bitten, ohne zu behaupten, dass dies eine vorgeschriebene Formel beim Hinausgehen sei.","Trenne allgemeine Bitte und festes Ritual.","Allāhumma bārik! Das ist quellentreu.")]
},
"family-unterschiedliche-herkunft":{
"4-5":[
c("Ein neues Kind spricht eine andere Sprache. Was ist freundlich?","Ich grüße es.","Ich lache über seine Sprache.","Jedes Kind verdient Respekt.","Mā schāʾ Allāh! Dein Gruß ist freundlich."),
c("Dürfen wir jemanden wegen seiner Herkunft verspotten?","Nein.","Ja, wenn andere mitlachen.","Denke an die Freundlichkeit.","Allāhumma bārik! Wir achten andere Menschen.",1)],
"6-8":[
c("Warum nennt Qurʾān 49:13 verschiedene Völker und Stämme?","Damit Menschen einander kennenlernen.","Damit wir Menschen nach Herkunft herabsetzen.","Achte auf das Ziel im Vers.","Mā schāʾ Allāh! Vielfalt soll zum Kennenlernen führen."),
c("Ein neues Kind kennt manche Wörter noch nicht. Wie hilfst du?","Ich erkläre sie freundlich und lasse ihm Zeit.","Ich stelle es vor allen bloß.","Biete Hilfe ohne Beschämung.","Sehr gut! Du behandelst das Kind mit Würde.",1),
t("Formuliere eine freundliche Begrüßung für ein neues Kind.","Assalāmu ʿalaikum. Schön, dass du da bist. Wie heißt du?","Ohne Fragen, die bloßstellen.","Allāhumma bārik! Du bist willkommen heißend.")],
"9-10":[
t("Welchen Sinn nennt Qurʾān 49:13 für unterschiedliche Völker und Stämme?","Damit Menschen einander kennenlernen; der Vers nennt Gottesfurcht als Maßstab der Ehre bei Allah.","Nenne beide Aussagen.","Mā schāʾ Allāh! Du verbindest Herkunft und Würde richtig."),
c("Welche Aussage widerspricht der Botschaft unserer Stunde?","Eine Familie sei allein wegen ihrer Herkunft mehr wert.","Menschen können unterschiedliche Sprachen sprechen.","Herkunft ist keine Einladung zu Spott.","Richtig! Respekt gilt allen Menschen."),
t("Wie reagierst du, wenn jemand einen neuen Mitschüler wegen seines Akzents auslacht?","Ich mache nicht mit, begegne dem Kind freundlich und hole bei wiederholter Gemeinheit Unterstützung von Erwachsenen.","Achte auf Sicherheit und Würde.","Allāhumma bārik! Du schützt andere vor Spott.")]
}
};
const ages=["4-5","6-8","9-10"],ids=Object.keys(revisions);
if(ids.length!==11)throw Error("V42 expected 11 curated revisions");
const next={...prior};
for(const [id,blocks] of Object.entries(revisions)){
 const old=prior[id];
 if(!old||old.sourceAudit?.scientificApproval!==false)throw Error("V42 unknown/approved lesson "+id);
 for(const age of ages){
  const quiz=blocks[age],want=age==="4-5"?2:3;
  if(!Array.isArray(quiz)||quiz.length!==want)throw Error("V42 expected "+want+" questions: "+id+"/"+age);
  for(const q of quiz)if(!q.prompt||!q.hint||!q.explain||
   (q.type==="choice"&&(q.options?.length!==2||![0,1].includes(q.correct)))||
   (q.type==="text"&&!q.sample))throw Error("V42 invalid question: "+id+"/"+age);
 }
 next[id]={...old,questions:{...old.questions,...blocks}};
}
window.DARKidsAcademyCurriculum=Object.freeze(next);
window.DARKidsAcademyCurriculumV42=Object.freeze({
 version:"20261014-v42",revisedSlots:[135,136,137,138,139,140,141,143,144,145,146],
 ids,questionCount:ids.length*8,approvedAgeVersions:0,religiousSourcesVerified:false,voiceRecordingsApproved:false
});
})();
