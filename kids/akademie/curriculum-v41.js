/* DĀR AL TAWḤĪD KIDS AKADEMI · V41
 * Individuelle Lernfragen für Unterricht 123–134 mit getrennter Vers- und Übungszuordnung.
 * Keine wissenschaftliche Freigabe und keine Audioerzeugung.
 */
(function(){
"use strict";
const prior=window.DARKidsAcademyCurriculum;
if(!prior||!window.DARKidsAcademyCurriculumV40)return;
const c=(prompt,right,wrong,hint,explain,position=0)=>({type:"choice",prompt,
 options:position===0?[right,wrong]:[wrong,right],correct:position,hint,explain});
const t=(prompt,sample,hint,explain)=>({type:"text",prompt,sample,hint,explain});
const revisions={
"tawhid-allahs-wissen":{
"4-5":[
 c("Du versteckst einen kleinen Stein hinter deinem Rücken. Weiß Allah davon?","Ja.","Nein.","Denke an Allahs Wissen.","Mā schāʾ Allāh! Allahs Wissen ist nicht wie unser Wissen."),
 c("Können Menschen immer alles sehen?","Nein.","Ja, alles.","Denke an den versteckten Stein.","Allāhumma bārik! Menschen sehen nicht alles, Allah weiß es.",1)],
"6-8":[
 c("Was lehrt Qurʾān 6:59 über Allahs Wissen?","Er weiß auch von Verborgenem und von einem fallenden Blatt.","Er erfährt nur, was wir laut sagen.","Denke an das Bild des fallenden Blattes.","Mā schāʾ Allāh! Das Wissen Allahs umfasst auch Verborgenes."),
 c("Was zeigt unser Beispiel mit dem versteckten Stein?","Menschen können etwas übersehen; Allahs Wissen ist nicht so begrenzt.","Allah kann nur sehen, was Kinder sehen.","Der Stein ist eine Unterrichtsübung.","Richtig! Die Übung erklärt einen Unterschied.",1),
 t("Nenne eine Sache, die Menschen manchmal nicht sehen, die Allah aber kennt.","Ein Stein hinter meinem Rücken ist für andere Kinder versteckt, Allah weiß davon.","Ein einfaches Beispiel reicht.","Allāhumma bārik! Du hast den Sinn verstanden.")],
"9-10":[
 t("Was meint das Verborgene in der Aussage aus Qurʾān 6:59?","Allah verfügt über das Wissen des Verborgenen; im Vers wird betont, dass auch ein fallendes Blatt Seinem Wissen nicht entgeht.","Nenne eine Aussage aus dem Vers.","Mā schāʾ Allāh! Du bleibst beim Text."),
 c("Was wäre aus diesem Vers nicht begründet?","Ein Mensch könne aus eigener Kraft alles Verborgene wissen.","Allah weiß, was Menschen nicht sehen.","Menschen besitzen nicht Allahs Wissen.","Richtig! Vermeide unzulässige Gleichsetzungen.",0),
 t("Warum ist unser Spiel mit dem versteckten Stein nur eine Lernhilfe?","Es macht den Unterschied zwischen menschlichem Sehen und Allahs Wissen anschaulich; es ist kein eigener Versbericht.","Trenne Beispiel und Offenbarung.","Allāhumma bārik! Du erkennst die Grenze der Didaktik.") ]
},
"iman-allen-gesandten-respekt":{
"4-5":[
 c("Wie sagen wir die Namen der Gesandten?","Mit Respekt.","Als Schimpfwort.","Wir sprechen freundlich über die Gesandten.","Mā schāʾ Allāh! Das ist respektvoll."),
 c("Dürfen wir einen Propheten verspotten?","Nein.","Ja, wenn andere lachen.","Denke an unseren respektvollen Umgang.","Richtig! Über Allahs Gesandte sprechen wir gut.",1)],
"6-8":[
 c("Woran erinnert Qurʾān 2:136 uns?","An den Glauben an Allahs Gesandte ohne Ausschluss.","An das Verspotten einzelner Propheten.","Denke an die gemeinsame Achtung.","Mā schāʾ Allāh! Alle bestätigten Gesandten verdienen Respekt."),
 c("Ein Kind spricht einen Prophetnamen achtlos aus. Was kannst du tun?","Den Namen ruhig und respektvoll wiederholen.","Das Kind vor allen laut bloßstellen.","Sei selbst ein freundliches Vorbild.","Richtig! Respekt zeigen statt beschämen.",1),
 t("Nenne eine respektvolle Weise, von Mūsā oder ʿĪsā zu sprechen.","Mūsā, Friede sei mit ihm, war ein Gesandter Allahs.","Ein kurzer Satz genügt.","Allāhumma bārik! Du sprichst würdig.")],
"9-10":[
 t("Was ist die gemeinsame Lehre der Stunden 112 und 124 aus Qurʾān 2:136?","Wir glauben an die von Allah gesandten Propheten und sollen keinen von ihnen als Gesandten zurückweisen oder verächtlich machen.","Es ist dieselbe Stelle mit vertieftem Adab-Schwerpunkt.","Mā schāʾ Allāh! Du erkennst den gemeinsamen Beleg."),
 c("Was tun wir, wenn eine zusätzliche Prophetengeschichte nicht belegt ist?","Wir lassen sie offen, bis eine geeignete Quelle geprüft wurde.","Wir erzählen sie als sichere Offenbarung.","Respekt bedeutet auch, wahrheitsgemäß zu berichten.","Richtig! Das schützt die Überlieferung.",0),
 t("Wie kannst du jüngeren Kindern Achtung für Gesandte vermitteln?","Ich nenne ihre Namen freundlich und erkläre, dass wir an Allahs Gesandte glauben.","Vermeide Spott oder Leistungsdruck.","Allāhumma bārik! Das ist ein gutes Vorbild.") ]
},
"ikhlas-kleine-taten-wertvoll":{
"4-5":[
 c("Ein anderer verliert einen Stift. Was ist eine kleine gute Tat?","Ich hebe ihn auf und gebe ihn zurück.","Ich verstecke ihn.","Eine kleine Hilfe ist wertvoll.","Mā schāʾ Allāh! Freundliche Hilfe zählt."),
 c("Muss eine gute Tat immer ganz groß sein?","Nein.","Ja, sonst zählt sie nie.","Denke an den Stift.","Allāhumma bārik! Auch kleine Taten sind wichtig.",1)],
"6-8":[
 c("Was sagt Qurʾān 99:7 über ein sehr kleines gutes Werk?","Wer Gutes vom Gewicht eines Stäubchens tut, wird es sehen.","Nur große Heldentaten werden erwähnt.","Denke an das Stäubchen im Vers.","Mā schāʾ Allāh! Kleine gute Taten werden nicht übersehen."),
 c("Warum heben wir den Stift auf, ohne andere schlechtzumachen?","Weil wir helfen wollen, nicht prahlen.","Weil niemand danken darf.","Achte auf die Absicht.","Richtig! Gutes Tun braucht keinen Wettbewerb.",1),
 t("Nenne eine kleine Hilfe, die du heute sicher leisten könntest.","Ich kann einer Person einen heruntergefallenen Stift zurückgeben.","Einfach und freundlich reicht.","Allāhumma bārik! Das ist eine passende Übung.")],
"9-10":[
 t("Wieso eignet sich Qurʾān 99:7 als Grundlage, um den Wert kleiner guter Taten zu erklären?","Der Vers sagt, dass selbst eine gute Tat im Gewicht eines Stäubchens gesehen wird.","Bleibe bei der Bedeutung des Verses.","Mā schāʾ Allāh! Du erläuterst die Aussage ohne Übertreibung."),
 c("Welche Haltung passt besser zur Lektion?","Eine kleine Hilfe tun, auch wenn niemand lobt.","Nur helfen, wenn es Preise gibt.","Denke an den Sinn von Aufrichtigkeit.","Richtig! Hilfe soll nicht vom Lob abhängen.",0),
 t("Unterscheide den Qurʾān-Vers von unserem Beispiel mit dem Stift.","Der Vers spricht von kleinsten guten Taten. Der aufgehobene Stift ist nur unser Alltagsbeispiel.","Was sagt der Vers, was haben wir erfunden?","Allāhumma bārik! Du ordnest beides richtig ein.") ]
},
"akhlaq-bescheiden-bleiben":{
"4-5":[
 c("Du löst ein Rätsel. Welcher Satz ist freundlich?","Schön, dass es geklappt hat.","Ihr seid alle dumm.","Freude ohne Spott ist gut.","Mā schāʾ Allāh! Du darfst dich freuen, ohne andere abzuwerten."),
 c("Wie sprechen wir mit Menschen, wenn wir stolz sind?","Freundlich und bescheiden.","Mit bösen Namen.","Denke an gute Worte.","Richtig! Bescheidenheit zeigt sich in unserer Sprache.",1)],
"6-8":[
 c("Wie beschreibt Qurʾān 25:63 die Diener des Allerbarmers?","Als Menschen, die bescheiden gehen und friedlich antworten.","Als Menschen, die andere anschreien sollen.","Denke an den Umgang mit anderen.","Mā schāʾ Allāh! Der Vers lobt Bescheidenheit."),
 c("Was kannst du nach einem Erfolg sagen?","Ich freue mich, dass ich es geschafft habe.","Ihr könnt alle weniger als ich.","Feiere ohne Herabsetzung.","Allāhumma bārik! Deine Freude darf freundlich sein.",1),
 t("Formuliere einen bescheidenen Satz nach einer gelungenen Aufgabe.","Ich freue mich, dass ich die Aufgabe lösen konnte, und danke für die Hilfe.","Sprich über dich, ohne andere kleinzumachen.","Sehr gut! Das ist bescheiden.")],
"9-10":[
 t("Welche zwei Verhaltensweisen nennt Qurʾān 25:63?","Bescheidenes Gehen auf der Erde und friedliche Worte als Antwort auf Unwissende.","Nenne die im Vers angeführten Eigenschaften.","Mā schāʾ Allāh! Du hast die beiden Seiten erfasst."),
 c("Wie kannst du Anerkennung annehmen, ohne eingebildet zu werden?","Danke sagen und andere nicht herabsetzen.","Andere verspotten, um überlegen zu wirken.","Respekt für andere bleibt bestehen.","Richtig! Bescheidenheit verbietet keine Freude.",0),
 t("Warum ist eine friedliche Antwort nicht dasselbe wie Nachgeben bei Unrecht?","Ich kann respektvoll sprechen und trotzdem eine klare Grenze setzen oder Hilfe holen.","Frieden und Schutz passen zusammen.","Allāhumma bārik! Du achtest auf die Sicherheit.") ]
},
"adab-mit-gaesten-freundlich":{
"4-5":[
 c("Ein Gast kommt. Was kannst du freundlich sagen?","Assalāmu ʿalaikum.","Geh weg!","Ein guter Gruß ist freundlich.","Mā schāʾ Allāh! Ein Gruß ist eine schöne Begrüßung."),
 c("Darfst du einfach in die Tasche des Gastes schauen?","Nein.","Ja, ohne zu fragen.","Wir respektieren die Sachen anderer.","Richtig! Auch Gäste haben Privatsphäre.",1)],
"6-8":[
 c("Wessen geehrte Gäste werden im behandelten Qurʾān-Vers 51:24 erwähnt?","Die Gäste Ibrāhīms.","Die Gäste eines unbekannten Königs.","Denke an den genannten Gesandten.","Mā schāʾ Allāh! Ibrāhīm wird in der Stelle erwähnt."),
 c("Welche Begrüßung ist als unsere Alltagsübung freundlich?","Einen Gast ruhig grüßen und Platz machen.","Ohne Erlaubnis in seine Tasche greifen.","Adab zeigt sich in kleinen Handlungen.","Richtig! Respekt ist wichtig.",1),
 t("Nenne eine sichere kleine Hilfe für Gäste, nachdem du gefragt hast.","Ich kann mit Erlaubnis ein Glas Wasser bringen.","Eltern entscheiden, was du übernehmen darfst.","Allāhumma bārik! Du hilfst umsichtig.")],
"9-10":[
 t("Welche Information bietet Qurʾān 51:24 zu Beginn der Erzählung?","Der Vers fragt nach der Geschichte der geehrten Gäste Ibrāhīms.","Bleibe beim gelesenen Vers.","Mā schāʾ Allāh! Du erfindest keine weiteren Einzelheiten."),
 c("Was ist eine pädagogische Anwendung und kein wörtlicher Verssatz?","Einen Gast grüßen, nachfragen und seine Privatsphäre achten.","Die Erwähnung von Ibrāhīms geehrten Gästen.","Trenne Erzählung und Verhalten.","Richtig! Das Beispiel dient unserem Adab.",0),
 t("Wie kannst du Gäste freundlich aufnehmen, ohne deine eigenen Grenzen zu verlieren?","Ich grüße freundlich, helfe nach Absprache und lasse private Gegenstände unberührt.","Freundlichkeit und Grenzen gehören zusammen.","Allāhumma bārik! Das ist ein guter Umgang.") ]
},
"tarbiyah-lernen-und-pausen":{
"4-5":[
 c("Nach konzentriertem Lernen bist du müde. Was hilft?","Eine kurze Pause mit Wasser und Bewegung.","Dich selbst ausschimpfen.","Pausen können guttun.","Mā schāʾ Allāh! Eine Pause darf zum Lernen gehören."),
 c("Ist eine kurze Pause ein Zeichen, dass du schlecht lernst?","Nein.","Ja.","Lernen braucht manchmal Erholung.","Allāhumma bārik! Du darfst freundlich mit dir umgehen.",1)],
"6-8":[
 c("Was sagt Qurʾān 2:286 über die Belastung einer Seele?","Allah auferlegt ihr nicht mehr, als sie tragen kann.","Niemand darf jemals müde sein.","Achte auf die Aussage im Vers.","Mā schāʾ Allāh! Der Vers spricht über das Maß der Belastung."),
 c("Was ist eine sinnvolle Lernübung für den Alltag?","Nach einer Lernzeit kurz Pause machen.","Ohne Unterbrechung weiterlernen, obwohl man erschöpft ist.","Wir üben einen guten Rhythmus.","Richtig! Wir achten auf unser Können.",1),
 t("Beschreibe eine kleine Pause zwischen zwei Lernabschnitten.","Ich stehe auf, trinke Wasser und setze mich danach wieder zum Lernen.","Nenne einen sicheren Schritt.","Allāhumma bārik! Das ist gut planbar.")],
"9-10":[
 t("Warum ist unsere konkrete Pausenregel eine Unterrichtsanwendung und kein wörtlicher Befehl von Qurʾān 2:286?","Der Vers behandelt das Maß der Belastung und Verantwortung. Eine Lernpause von einigen Minuten ist unsere hilfreiche Organisationsregel.","Trenne Verssinn und Unterrichtsplan.","Mā schāʾ Allāh! Du hast beides unterschieden."),
 c("Was wäre ein ausgewogener Lernplan?","Eine realistische Lernzeit mit einer kurzen Pause danach.","Ohne Rücksicht auf Erschöpfung immer weitermachen.","Lernen soll verlässlich und machbar bleiben.","Richtig! Ein Plan hilft ohne unnötigen Druck.",0),
 t("Wie würdest du einem jüngeren Kind erklären, dass es nach einem Fehler eine Pause braucht?","Ich sage freundlich: Wir versuchen es gleich noch einmal; erst trinken wir Wasser und ruhen kurz aus.","Geduld statt Beschämung.","Allāhumma bārik! Das ist eine gute Unterstützung.") ]
},
"nafs-fehler-bereuen":{
"4-5":[
 c("Du hast ein hartes Wort gesagt. Was kannst du sagen?","Es tut mir leid.","Das war lustig, ich mache es wieder.","Entschuldigen kann helfen.","Mā schāʾ Allāh! Du kannst etwas wiedergutmachen."),
 c("Darfst du nach einem Fehler wieder Gutes tun?","Ja.","Nein, nie wieder.","Allahs Barmherzigkeit gibt Hoffnung.","Allāhumma bārik! Jeder darf sich bessern.",1)],
"6-8":[
 c("Wozu ermutigt Qurʾān 39:53?","Nicht an Allahs Barmherzigkeit zu verzweifeln.","Zu glauben, dass Vergebung nie möglich sei.","Denke an Barmherzigkeit.","Mā schāʾ Allāh! Der Vers gibt Hoffnung."),
 c("Wie kannst du nach einem verletzenden Wort handeln?","Dich entschuldigen und versuchen, den Fehler wiedergutzumachen.","Dasselbe Wort noch einmal wiederholen.","Reue hat mit besserem Handeln zu tun.","Richtig! Du kannst Verantwortung übernehmen.",1),
 t("Formuliere einen freundlichen Satz nach einem eigenen Fehler.","Es tut mir leid, dass ich das gesagt habe. Ich werde es besser machen.","Sei klar und ohne Ausreden.","Allāhumma bārik! Das ist ein guter Anfang.")],
"9-10":[
 t("Welche Botschaft gibt Qurʾān 39:53 Menschen, die Fehler gemacht haben?","Sie sollen nicht an Allahs Barmherzigkeit verzweifeln; Allah wird als vergebend und barmherzig beschrieben.","Erkläre den Hoffnungssinn des Verses.","Mā schāʾ Allāh! Du hast die Aussage verstanden."),
 c("Welcher Schritt zeigt echte Verantwortung nach einem Fehler?","Fehler eingestehen und, wenn möglich, wiedergutmachen.","Andere beschuldigen und nichts ändern.","Verantwortung ohne Selbstbeschämung.","Richtig! Ein neuer guter Schritt ist wichtig.",0),
 t("Wie würdest du einem Freund Mut machen, der einen Fehler bereut?","Ich sage: Du darfst um Verzeihung bitten und versuchen, es besser zu machen. Lass uns Hilfe holen, wenn du sie brauchst.","Hoffnung und praktische Hilfe verbinden.","Allāhumma bārik! Das ist eine freundliche Antwort.") ]
},
"fiqh-gebetszeiten-kennenlernen":{
"4-5":[
 c("Welcher Teil des Tages wird im Vers ausdrücklich genannt?","Die Morgenfrühe.","Die Mittagspause in der Schule.","Denke an den Morgen.","Mā schāʾ Allāh! Der Vers nennt die Morgenfrühe."),
 c("Wo findest du einen Gebetszeitenplan?","Bei deiner Familie oder in einem passenden Plan.","Nur in einem Märchen.","Wir dürfen Erwachsene fragen.","Allāhumma bārik! Du kannst gemeinsam nachschauen.",1)],
"6-8":[
 c("Welche Tageszeiten werden in Qurʾān 17:78 angesprochen?","Vom Neigen der Sonne bis zur Nacht und die Morgenfrühe.","Nur ein Sonntagvormittag.","Denk an Sonne, Nacht und Morgen.","Mā schāʾ Allāh! Diese Zeitangaben stehen in der Stelle."),
 c("Woher kommt die vollständige Benennung der fünf täglichen Gebete in unserem heutigen Unterricht?","Nicht allein aus dieser einen Verszeile; dafür braucht es weitere Belege.","Der Vers enthält alle fünf vollständigen Gebetsnamen als Liste.","Das Unterrichtsmaterial nennt die Grenze.","Richtig! Wir unterscheiden diese Stelle von der vollständigen Lehre.",0),
 t("Wie kannst du in einem Gebetsplan die Morgenzeit suchen?","Ich suche den Eintrag für das Morgengebet und lasse ihn mir erklären.","Du musst keine ungesicherten Zeitangaben erraten.","Allāhumma bārik! So lernst du schrittweise.")],
"9-10":[
 t("Was wird in Qurʾān 17:78 über die Gebetszeiten genannt?","Die Stelle spricht vom Neigen der Sonne bis zur Dunkelheit der Nacht und von der Lesung der Morgenfrühe.","Bleibe bei den im Vers gedruckten Angaben.","Mā schāʾ Allāh! Du hast die Zeitbilder erkannt."),
 c("Warum dürfen wir aus dieser einen Stelle allein keine vollständige hanbalitische Gebetszeiten-Tabelle ableiten?","Die genauen Zuordnungen und Detailregeln brauchen weitere authentische Belege und Fiqh-Prüfung.","Weil der Vers gar nichts mit Gebet zu tun hätte.","Diese Stunde ist nur ein Einstieg.","Richtig! Wir erfinden keine Detailgrenzen.",0),
 t("Wie kannst du einen jüngeren Lernenden mit einem Gebetszeitenplan vertraut machen?","Ich zeige ihm mit Hilfe eines Erwachsenen den Morgen- und Abendbereich und erkläre, dass die genauen Zeiten verlässlich ermittelt werden.","Es geht um Orientierung, nicht um Schätzung.","Allāhumma bārik! Das ist ein sicherer Einstieg.") ]
},
"quran-tajwid-hoeren":{
"4-5":[
 c("Wie hören wir einer echten Qurʾān-Rezitation zu?","Ruhig und aufmerksam.","Indem wir laut dazwischenrufen.","Denke an respektvolles Zuhören.","Mā schāʾ Allāh! Wir hören achtsam zu."),
 c("Dürfen wir beim Lernen langsam werden?","Ja.","Nein.","Lernen braucht Zeit.","Allāhumma bārik! Ruhe kann beim Verstehen helfen.",1)],
"6-8":[
 c("Was fordert Qurʾān 73:4 im behandelten Teil?","Den Qurʾān deutlich vorzutragen.","Die Wörter absichtlich zu verschlucken.","Denke an tartīl.","Mā schāʾ Allāh! Tartīl wird mit deutlichem Vortrag verbunden."),
 c("Welche Aufnahme wäre geeignet, wenn wir eine Rezitation hören?","Eine echte menschliche Qurʾān-Rezitation aus verlässlicher Quelle.","Eine erfundene Computerrezitation, die sich als Original ausgibt.","Die Echtheit der Rezitation ist wichtig.","Richtig! Wir erfinden keinen Qurʾān-Ton.",1),
 t("Wie unterscheidet sich verständliches Sprechen von hastigem Murmeln?","Beim deutlichen Sprechen kann ich Wörter besser hören und verstehen.","Denke an die zwei deutschen Beispielsätze.","Allāhumma bārik! Du hörst genau hin.")],
"9-10":[
 t("Wie wird tartīl in der behandelten Erklärung zu Qurʾān 73:4 beschrieben?","Als bedächtiges und deutliches Vortragen des Qurʾān.","Erkläre die Eigenschaft, ohne Regeln zu erfinden.","Mā schāʾ Allāh! Du hast den Verssinn getroffen."),
 c("Was gehört nicht zu einem zuverlässigen Qurʾān-Audiounterricht?","Eine frei erfundene KI-Rezitation als echten Qurʾān-Vortrag auszugeben.","Einer echten Rezitation achtsam zuzuhören.","Quellen und Aufnahmen müssen verlässlich sein.","Richtig! Der Wortlaut darf nicht verfälscht werden.",0),
 t("Warum ist unser deutscher Vergleich von schnell und deutlich gesprochener Sprache nur eine Lernhilfe?","Weil Qurʾān 73:4 vom Qurʾān-Vortrag spricht und unsere deutschen Übungssätze den Unterschied nur hörbar machen sollen.","Unterscheide Originalthema und Übung.","Allāhumma bārik! Du trennst beides.") ]
},
"sirah-muhammad-in-makkah":{
"4-5":[
 c("Mit welchem Wort beginnt der behandelte Sinn von Qurʾān 96:1?","Lies.","Laufe.","Denke an den Versbeginn.","Mā schāʾ Allāh! Der Vers beginnt mit der Aufforderung „Lies“."),
 c("Wer hat die Menschen erschaffen?","Allah.","Ein Schulbuch.","Denke an deinen Herrn.","Allāhumma bārik! Allah ist der Schöpfer.",1)],
"6-8":[
 c("Was sagt der behandelte Qurʾān-Vers 96:1?","Lies im Namen deines Herrn, der erschaffen hat.","Schreibe eine erfundene Geschichte.","Denke an den Anfang der Offenbarung.","Mā schāʾ Allāh! So lautet der Verssinn."),
 c("Was vermeiden wir in dieser Stunde?","Unbelegte Einzelheiten über ein Ereignis dazuzuerfinden.","Den behandelten Vers richtig zu benennen.","Bleibe bei der gelesenen Stelle.","Richtig! Eine Geschichte braucht Belege.",0),
 t("Was würdest du einem jüngeren Kind über diesen Vers erklären?","Allah befiehlt im Vers, im Namen des Herrn zu lesen, der erschaffen hat.","Erkläre ohne erfundene Szenen.","Allāhumma bārik! Das ist verständlich.")],
"9-10":[
 t("Welche zwei Aussagen umfasst der behandelte Vers 96:1?","Die Aufforderung zu lesen im Namen des Herrn und die Aussage, dass Er erschaffen hat.","Nenne beide Teile.","Mā schāʾ Allāh! Du hast den Versbeginn vollständig erklärt."),
 c("Wieso zeigen wir in dieser Stunde keine angeblich authentische Szene aus einer Höhle?","Weil die behandelte Seite dafür hier keine geprüfte ausführliche Geschichte liefert.","Weil es niemals historische Berichte darüber geben kann.","Gelesenes und ungeprüfte Details trennen.","Richtig! Wir bleiben bei unserem Beleg.",0),
 t("Was unterscheidet unsere Sīrah-Einführung von einer erfundenen Geschichte?","Wir benennen Qurʾān 96:1 und halten andere Einzelheiten offen, bis wir eine echte Quelle geprüft haben.","Sprich über den Nachweis.","Allāhumma bārik! Das ist sorgsames Erzählen.") ]
},
"dua-nach-dem-essen-danken":{
"4-5":[
 c("Was kannst du nach dem Essen tun?","Allah danken.","Andere wegen des Essens beschimpfen.","Denke an Dankbarkeit.","Mā schāʾ Allāh! Dank gehört Allah."),
 c("Wer hat für dich gekocht? Was passt?","Der Person freundlich danken.","So tun, als habe sie nichts getan.","Wir sind auch Menschen gegenüber dankbar.","Allāhumma bārik! Ein Dankeschön ist gut.",1)],
"6-8":[
 c("Wozu ruft Qurʾān 2:172 im behandelten Sinn auf?","Von guten Gaben zu essen und Allah dankbar zu sein.","Dankbarkeit immer zu vergessen.","Denke an die Gaben Allahs.","Mā schāʾ Allāh! Der Vers verbindet Gaben mit Dank."),
 c("Was ist unsere kurze Übung nach dem Essen?","Mit eigenen deutschen Worten Allah danken.","Eine unbekannte arabische Pflichtformel erfinden.","Wir bleiben bei dem Sinn.","Richtig! Wir erfinden kein festes Duʿāʾ.",0),
 t("Nenne eine schlichte Bitte oder einen Dank nach dem Essen auf Deutsch.","Allah, ich danke Dir für dieses Essen.","Ein kurzer Dank genügt.","Allāhumma bārik! Du hast Dankbarkeit ausgedrückt.")],
"9-10":[
 t("Welche zwei Handlungen werden in Qurʾān 2:172 verbunden?","Von den guten Gaben zu essen und Allah dafür zu danken.","Nenne Versorgung und Dank.","Mā schāʾ Allāh! Du hast die Verbindung erkannt."),
 c("Was ist in unserer Stunde korrekt?","Eine deutsche Dankübung ausführen, ohne sie als überlieferte feste Formel zu bezeichnen.","Einen beliebigen eigenen Satz als nummerierten Hadith ausgeben.","Vers und Übung werden getrennt.","Richtig! Die Herkunft der Worte bleibt ehrlich.",1),
 t("Wie kannst du Dank zu Allah und zu einem Menschen nach dem Essen unterscheiden?","Ich danke Allah für die Gaben und bedanke mich bei der Person, die das Essen zubereitet hat.","Beide Arten von Dank sind möglich.","Allāhumma bārik! Das ist eine gute Alltagsanwendung.") ]
},
"family-kranken-und-aelteren-helfen":{
"4-5":[
 c("Die Großmutter braucht ein Glas Wasser. Was kannst du tun?","Mit Erlaubnis ein Glas Wasser bringen.","Ohne Erlaubnis gefährliche Medikamente holen.","Hilfe muss sicher sein.","Mā schāʾ Allāh! Das ist eine liebevolle kleine Hilfe."),
 c("Eine kranke Person braucht medizinische Hilfe. Wer muss helfen?","Eine geeignete erwachsene Person.","Ein kleines Kind ganz allein.","Manche Aufgaben sind nur für Erwachsene.","Allāhumma bārik! Du holst verantwortliche Hilfe.",1)],
"6-8":[
 c("Wen nennt Qurʾān 4:36 unter den Menschen, denen Gutes erwiesen werden soll?","Unter anderem Eltern, Verwandte, Bedürftige und Nachbarn.","Nur Menschen, die uns etwas schenken.","Denke an die im Vers genannten Gruppen.","Mā schāʾ Allāh! Der Vers mahnt zu gutem Umgang."),
 c("Welche Aufgabe ist für ein Kind eher geeignet?","Nach Absprache Wasser bringen.","Ohne Aufsicht fremde Arznei geben.","Frage vorher eine erwachsene Person.","Richtig! Helfen muss sicher sein.",1),
 t("Nenne eine freundliche, sichere Hilfe für einen älteren Menschen.","Ich frage, ob ich ein Glas Wasser holen oder etwas Leichtes tragen darf.","Die Person und die Eltern dürfen zustimmen.","Allāhumma bārik! Das ist rücksichtsvoll.")],
"9-10":[
 t("Welche sozialen Beziehungen erwähnt Qurʾān 4:36 im Zusammenhang mit gutem Verhalten?","Der Vers nennt Eltern, Verwandte, Waisen, Bedürftige und Nachbarn neben weiteren Gruppen.","Bleibe bei der gelesenen Aufzählung.","Mā schāʾ Allāh! Du hast den Zusammenhang erfasst."),
 c("Was ist verantwortungsvolles Helfen bei Krankheit?","Kleine sichere Aufgaben anbieten und medizinische Entscheidungen Erwachsenen überlassen.","Auf eigene Faust Medikamente verteilen.","Kinder müssen nicht die Verantwortung von Erwachsenen tragen.","Richtig! Sicherheit ist wichtiger als Übereifer.",1),
 t("Wie kannst du helfen, ohne einen kranken Menschen unter Druck zu setzen?","Ich frage, was gebraucht wird, biete eine kleine sichere Hilfe an und akzeptiere ein Nein.","Rücksicht und Grenzen gehören zusammen.","Allāhumma bārik! Du hast verantwortungsvoll gedacht.") ]
}
};
const ids=Object.keys(revisions),ages=["4-5","6-8","9-10"];
if(ids.length!==12)throw Error("V41 expected 12 revised lessons");
const deferredFiqh=new Set(["fiqh-gebetszeiten-kennenlernen"]); 
const next={...prior};
for(const [id,blocks] of Object.entries(revisions)){
 if(deferredFiqh.has(id))continue; // V38 source-checked fiqh quiz takes priority
 const old=prior[id];
 if(!old||old.sourceAudit?.scientificApproval!==false)throw Error("V41 invalid lesson "+id);
 for(const age of ages){
  const quiz=blocks[age];
  if(!Array.isArray(quiz)||quiz.length!==(age==="4-5"?2:3))throw Error("V41 count "+id+"/"+age);
  for(const q of quiz)if(!q.prompt||!q.hint||!q.explain||
   (q.type==="choice"&&(q.options?.length!==2||![0,1].includes(q.correct)))||
   (q.type==="text"&&!q.sample))throw Error("V41 bad question "+id+"/"+age);
 }
 next[id]={...old,questions:{...old.questions,...blocks}};
}
window.DARKidsAcademyCurriculum=Object.freeze(next);
window.DARKidsAcademyCurriculumV41=Object.freeze({
 version:"20261014-v41",revisedSlots:[123,124,125,126,127,128,129,131,132,133,134],
 ids:ids.filter(id=>!deferredFiqh.has(id)),approvedAgeVersions:0,religiousSourcesVerified:false,voiceRecordingsApproved:false
});
})();