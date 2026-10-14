/* DĀR AL TAWḤĪD KIDS AKADEMI · V43
 * Individuelle altersgerechte Quizkorrektur für Slots 147–153 und 155–158.
 * Fiqh 154 wurde bereits unabhängig überarbeitet und bleibt unverändert.
 * Entwurf; keine Quellenfreigabe, kein Audio, keine Veröffentlichung.
 */
(function(){
"use strict";
const prior=window.DARKidsAcademyCurriculum;
if(!prior||!window.DARKidsAcademyCurriculumV42)throw Error("V43 requires V42");
const c=(prompt,right,wrong,hint,explain,pos=0)=>({type:"choice",prompt,options:pos?[wrong,right]:[right,wrong],correct:pos,hint,explain});
const t=(prompt,sample,hint,explain)=>({type:"text",prompt,sample,hint,explain});
const revisions={
"tawhid-rahman-rahim":{
"4-5":[
c("Wen nennen wir ar-Raḥmān und ar-Raḥīm?","Allah.","Eine erfundene Figur.","Denke an die schönen Namen.","Mā schāʾ Allāh! Das sind Namen Allahs."),
c("Wofür steht Barmherzigkeit in unserem Unterricht?","Für Güte und Erbarmen.","Dafür, andere auszulachen.","Denk an Freundlichkeit.","Allāhumma bārik! Allahs Barmherzigkeit lernen wir mit Achtung kennen.",1)],
"6-8":[
c("Welche beiden Namen stehen in der Basmala?","Ar-Raḥmān und ar-Raḥīm.","Faǧr und Ẓuhr.","Denk an Qurʾān 1:1.","Mā schāʾ Allāh! Wir lernen beide Namen Allahs."),
c("Wie lernen wir neue Namen Allahs?","Aus Qurʾān und zuverlässig überlieferter Sunnah.","Indem wir schöne Wörter beliebig zu Namen erklären.","Bei Namen brauchen wir Belege.","Richtig! Achtsames Lernen schützt vor Erfindungen.",1),
t("Wie erklärst du einem jüngeren Kind ar-Raḥmān und ar-Raḥīm?","Es sind Namen Allahs, die uns an Seine Barmherzigkeit erinnern.","Eine kurze, respektvolle Erklärung genügt.","Allāhumma bārik! Das ist freundlich erklärt.")],
"9-10":[
t("Welcher Text steht in der Stunde zu Qurʾān 1:1 im Mittelpunkt?","Die Basmala: Im Namen Allahs, des Allerbarmers, des Barmherzigen.","Erkenne die beiden Namen.","Mā schāʾ Allāh! Du erkennst den Versinhalt."),
c("Was wäre ohne eigenen Beleg falsch?","Eine selbst erfundene Bezeichnung als gesicherten Namen Allahs auszugeben.","Die beiden im Unterricht genannten Namen zu erklären.","Wissen braucht Belege.","Richtig! Namen Allahs werden nicht frei erfunden."),
t("Was ist der Unterschied zwischen dem Namen und deiner Erklärung?","Der Name ar-Raḥmān steht im überlieferten Wortlaut; 'Allah ist barmherzig' ist meine deutsche Erklärung des Sinns.","Original und Erklärung unterscheiden.","Allāhumma bārik! Du ordnest beides korrekt ein.")]
},
"iman-juengster-tag":{
"4-5":[
c("Was gehört zum Īmān?","Der Glaube an den Jüngsten Tag.","Dass wir uns Gruselbilder ausdenken.","Denk an Allahs Gerechtigkeit.","Mā schāʾ Allāh! Wir glauben an den Jüngsten Tag."),
c("Brauchen wir gruselige Bilder, um das zu lernen?","Nein.","Ja, unbedingt.","Wir lernen ruhig und verständlich.","Allāhumma bārik! Angstbilder sind nicht nötig.",1)],
"6-8":[
c("Was nennt Qurʾān 2:177 neben dem Glauben an Allah?","Auch den Glauben an den Jüngsten Tag, die Engel, die Offenbarung und die Propheten.","Nur die Farbe der Kleidung.","Achte auf die Glaubensinhalte.","Mā schāʾ Allāh! Der Vers nennt mehrere Glaubensinhalte."),
c("Was passt zu einer guten Unterrichtsstunde über den Jüngsten Tag?","Den Glaubensinhalt ruhig erklären, ohne Kinder zu erschrecken.","Schreckensbilder ausmalen und Kinder beschämen.","Wir wollen verstehen.","Sehr gut! Lernen soll sicher bleiben.",1),
t("Nenne einen Glaubensinhalt aus Qurʾān 2:177.","Wir glauben an Allah und den Jüngsten Tag.","Ein Beispiel reicht.","Allāhumma bārik! Du erinnerst dich.")],
"9-10":[
t("Welche Glaubensgegenstände nennt der gelesene Teil von Qurʾān 2:177?","Allah, den Jüngsten Tag, die Engel, das Buch und die Propheten.","Nenne die Gruppen aus dem Vers.","Mā schāʾ Allāh! Du kennst die Aussage."),
c("Welche Aussage lässt sich aus diesem gelesenen Teil nicht als Einzelbeschreibung ableiten?","Eine von uns ausgedachte Szene mit genauen Geräuschen und Farben.","Dass Glaube an den Jüngsten Tag genannt wird.","Die Quelle enthält keine solche Filmszene.","Richtig! Wir erfinden keine Angstgeschichte."),
t("Wie kannst du jüngeren Kindern den Glauben an den Jüngsten Tag erklären?","Wir glauben, dass es ihn gibt und Allah gerecht ist, ohne unbelegte Einzelheiten als Vers auszugeben.","Erkläre ohne Drohbilder.","Allāhumma bārik! Das ist sorgfältig.")]
},
"ikhlas-gemeinsame-aufgaben":{
"4-5":[
c("Vier Kinder bauen zusammen. Was ist gerecht?","Alle dürfen mithelfen.","Einer macht alles und verspottet die anderen.","Gemeinsam ist das Schlüsselwort.","Mā schāʾ Allāh! Ihr könnt euch die Arbeit teilen."),
c("Soll nur ein Kind für die Arbeit aller gelobt werden?","Nein.","Ja, immer.","Denke an alle, die mitgeholfen haben.","Allāhumma bārik! Du siehst die Arbeit anderer.",1)],
"6-8":[
c("Was erinnert Qurʾān 5:2 uns beim gemeinsamen Helfen?","Helft einander im Guten.","Helft euch gegenseitig beim Ärgern.","Denke an gute Zusammenarbeit.","Mā schāʾ Allāh! Gute Hilfe verbindet."),
c("Ein Kind möchte den Erfolg nur für sich beanspruchen. Was wäre besser?","Die Beiträge aller Kinder anerkennen.","Die anderen absichtlich ausschließen.","Jeder Beitrag verdient Respekt.","Richtig! Ihr könnt euch gemeinsam freuen.",1),
t("Nenne eine Aufgabe, die Kinder gerecht teilen könnten.","Zwei Kinder sammeln die Stifte, zwei legen das Papier bereit.","Jeder kann etwas beitragen.","Allāhumma bārik! Ihr arbeitet zusammen.")],
"9-10":[
t("Was bedeutet Zusammenarbeit im Guten in Qurʾān 5:2 für unsere Aufgabe?","Wir helfen einander bei sinnvollen Handlungen, statt uns über andere zu stellen.","Beziehe die Regel auf das Gruppenprojekt.","Mā schāʾ Allāh! Das passt zum Vers."),
c("Welche Handlung widerspricht der Teamübung?","Die Arbeit anderer als eigene Leistung ausgeben.","Allen Beteiligten danken.","Aufrichtigkeit und Fairness sind gefragt.","Richtig! Gute Zusammenarbeit braucht Ehrlichkeit."),
t("Welche Trennung ist bei der Lektion wichtig?","Der Vers fordert Hilfe im Guten; das gemeinsame Bild mit Namenskarten ist unsere eigene Unterrichtsübung.","Quelle und Beispiel unterscheiden.","Allāhumma bārik! Du bleibst quellentreu.")]
},
"akhlaq-versoehnung-nach-streit":{
"4-5":[
c("Zwei Kinder streiten um ein Buch. Was hilft?","Ruhig sprechen und Hilfe holen.","Weiter daran zerren.","Wir wollen niemanden verletzen.","Mā schāʾ Allāh! Ein ruhiges Gespräch hilft."),
c("Muss ein Kind Gemeinheit ertragen, nur damit Frieden ist?","Nein.","Ja.","Sicher bleiben ist wichtig.","Allāhumma bārik! Schutz geht vor erzwungener Versöhnung.",1)],
"6-8":[
c("Wozu fordert Qurʾān 49:10 auf?","Unter Glaubenden Frieden zu stiften.","Andere Kinder dauerhaft auszugrenzen.","Der Vers spricht von Geschwistern.","Mā schāʾ Allāh! Friedenstiften ist wichtig."),
c("Nach einem Streit möchte ein Kind noch Abstand. Was tun wir?","Die Grenze achten und eine erwachsene Person helfen lassen.","Das Kind sofort zur Umarmung zwingen.","Versöhnung kann Zeit brauchen.","Richtig! Niemand wird zur Nähe gezwungen.",1),
t("Was könntest du nach einem kleinen Streit höflich sagen?","Ich möchte es klären. Können wir ruhig darüber sprechen?","Ein friedlicher Satz genügt.","Allāhumma bārik! Das ist respektvoll.")],
"9-10":[
t("Welche Verbindung stellt Qurʾān 49:10 her?","Die Glaubenden werden als Geschwister beschrieben, und es wird zum Friedenstiften aufgerufen.","Nenne Gemeinschaft und Handlung.","Mā schāʾ Allāh! Du hast den Kern."),
c("Welche Deutung ist für Kinderschutz unzulässig?","Ein betroffenes Kind müsse bei wiederholtem Übergriff schweigen und sofort verzeihen.","Erwachsene können helfen, ein Unrecht zu beenden.","Frieden ist keine Pflicht zum Erdulden.","Richtig! Sicherheit und klare Grenzen bleiben wichtig."),
t("Beschreibe einen sicheren Weg vom Streit zur Versöhnung.","Wir hören einander zu, achten Grenzen und holen bei anhaltendem Streit eine vertrauenswürdige erwachsene Person dazu.","Frieden ohne Zwang.","Allāhumma bārik! Du schützt die Beteiligten.")]
},
"adab-weniger-verschwenden":{
"4-5":[
c("Wie füllen wir beim Essen den Teller?","Wir nehmen erst so viel, wie wir essen können.","Wir häufen Essen auf, um es wegzuwerfen.","Du kannst später nachnehmen.","Mā schāʾ Allāh! Du gehst achtsam mit Essen um."),
c("Darfst du später etwas nachnehmen, wenn du noch Hunger hast?","Ja.","Nein, niemals.","Nimm zuerst wenig.","Allāhumma bārik! So muss weniger verschwendet werden.",1)],
"6-8":[
c("Wovor warnt Qurʾān 6:141?","Vor Maßlosigkeit.","Vor jeder Frucht.","Denke an die Worte 'nicht maßlos'.","Mā schāʾ Allāh! Allah mahnt zu Maßhalten."),
c("Ein Kind schöpft sich sehr viel Essen und kann es nicht aufessen. Was lernt es?","Beim nächsten Mal zuerst weniger nehmen.","Noch mehr aufladen.","Lernen ohne Beschämung.","Richtig! Kleine Portionen und Nachnehmen helfen.",1),
t("Nenne eine freundliche Idee gegen Essensverschwendung.","Ich nehme eine kleinere Portion und frage bei Bedarf nach mehr.","Etwas, das du selbst tun kannst.","Allāhumma bārik! Das ist praktisch.")],
"9-10":[
t("Was nennt Qurʾān 6:141 neben Früchten als Verhaltensregel?","Von der Frucht essen und nicht maßlos sein.","Erkläre die Mahnung.","Mā schāʾ Allāh! Du erkennst Maßhalten."),
c("Welche Schlussfolgerung ist NICHT aus der Stunde abzuleiten?","Kinder müssten sich bei jedem übrig gebliebenen Bissen schämen.","Wir können bewusst mit Lebensmitteln umgehen.","Schutz vor Beschämung ist wichtig.","Richtig! Wir lernen vernünftiges Verhalten."),
t("Wie würdest du jüngeren Kindern das 'klein anfangen, bei Hunger nachnehmen' erklären?","So bleibt Essen nicht unnötig übrig, und du kannst dich trotzdem satt essen.","Alltag und Vers verbinden.","Allāhumma bārik! Du erklärst gut.")]
},
"tarbiyah-verantwortung-uebernehmen":{
"4-5":[
c("Du hast versprochen, Becher auf den Tisch zu stellen. Was tust du?","Ich erledige die Aufgabe.","Ich verstecke die Becher.","Eine kleine Aufgabe zählt.","Mā schāʾ Allāh! Du bist zuverlässig."),
c("Wenn du etwas allein nicht tragen kannst, was ist gut?","Um Hilfe bitten.","Dich dadurch verletzen.","Kleine Aufgaben sollen sicher sein.","Allāhumma bārik! Du kennst deine Grenzen.",1)],
"6-8":[
c("Was erwähnt Qurʾān 90:17 neben dem Glauben?","Einander Geduld und Barmherzigkeit empfehlen.","Andere absichtlich unter Druck setzen.","Denke an Geduld und Mitgefühl.","Mā schāʾ Allāh! Der Vers verbindet beide."),
c("Welche Aufgabe zeigt rücksichtsvolle Verantwortung?","Ein kleines Versprechen erfüllen und um Hilfe bitten, wenn nötig.","Andere zu gefährlichen Tätigkeiten zwingen.","Achte auf Machbarkeit.","Richtig! Gute Verantwortung kennt Grenzen.",1),
t("Welche kleine Aufgabe möchtest du zuverlässig übernehmen?","Ich stelle die Trinkbecher auf den Tisch und prüfe danach, ob alle da sind.","Wähle eine sichere Aufgabe.","Allāhumma bārik! Das kannst du planen.")],
"9-10":[
t("Welche Aufforderungen zur gegenseitigen Unterstützung stehen in Qurʾān 90:17?","Einander zur Geduld und zur Barmherzigkeit raten.","Nenne die beiden Eigenschaften.","Mā schāʾ Allāh! Du hast beide erkannt."),
c("Was widerspricht der Barmherzigkeit in unserer Übung?","Ein jüngeres Kind mit einer zu schweren Aufgabe allein lassen.","Eine kleine Aufgabe gemeinsam bewältigen.","Unterstützung ist wichtig.","Richtig! Verantwortlichkeit bedeutet auch helfen."),
t("Wie unterscheidest du den Qurʾān-Vers von der Becherübung?","Der Vers nennt Geduld und Barmherzigkeit; das Bereitstellen der Becher ist ein selbst gewähltes Beispiel.","Trenne Quelle und Didaktik.","Allāhumma bārik! Gute Quellenarbeit.")]
},
"nafs-eigene-gedanken-pruefen":{
"4-5":[
c("Dein Stift ist weg. Darfst du gleich behaupten, jemand habe ihn genommen?","Nein, erst freundlich nachfragen.","Ja, ohne etwas zu wissen.","Du weißt es noch nicht.","Mā schāʾ Allāh! Du fragst fair."),
c("Welcher Satz ist besser?","Ich weiß es noch nicht. Ich frage.","Du hast ihn bestimmt gestohlen.","Denke an freundliche Fragen.","Allāhumma bārik! Du vermeidest eine falsche Anschuldigung.",1)],
"6-8":[
c("Wovor warnt Qurʾān 49:12 unter anderem?","Vor viel Verdacht, Ausspähen und übler Nachrede.","Vor jeder höflichen Nachfrage.","Achte auf die drei Handlungen.","Mā schāʾ Allāh! Der Vers mahnt zur Vorsicht."),
c("Ein anderer sitzt neben deinem fehlenden Stift. Was wäre fair?","Ruhig fragen, ob jemand den Stift gesehen hat.","Laut beschuldigen, obwohl du es nicht weißt.","Vermutung ist noch kein Wissen.","Richtig! Eine Nachfrage ist besser.",1),
t("Formuliere eine Frage, die niemanden beschuldigt.","Hast du zufällig meinen Stift gesehen?","Ohne Vorwurf sprechen.","Allāhumma bārik! Das ist höflich.")],
"9-10":[
t("Welche drei Handlungen behandelt Qurʾān 49:12?","Unbegründeten Verdacht, das Ausspähen anderer und üble Nachrede.","Fasse den Vers knapp zusammen.","Mā schāʾ Allāh! Du erkennst die Verbote."),
c("Welche Behauptung überschreitet unser Wissen?","Jemanden allein wegen einer Vermutung als Dieb bezeichnen.","Nach verlorenen Sachen fragen.","Unterscheide Verdacht und Tatsache.","Richtig! Vermutungen sind kein Beweis."),
t("Wie kannst du einem Gerücht freundlich widersprechen?","Wir wissen nicht, ob das stimmt. Lasst uns niemanden beschuldigen oder schlecht über ihn reden.","Kein Bloßstellen nötig.","Allāhumma bārik! Das schützt Menschen.")]
},
"quran-woher-stammt-ein-hadith":{
"4-5":[
c("Ist ein Qurʾān-Vers dasselbe wie ein Ḥadīṯ?","Nein.","Ja, jeder Satz ist ein Qurʾān-Vers.","Es gibt verschiedene Quellen.","Mā schāʾ Allāh! Du kannst sie unterscheiden."),
c("Wenn wir einen Bericht nicht kennen, was tun wir?","Wir fragen nach einer Quelle.","Wir erfinden eine Nummer.","Wahrheit ist wichtig.","Allāhumma bārik! Du prüfst erst.",1)],
"6-8":[
c("Was ist ein Ḥadīṯ?","Ein überlieferter Bericht über den Propheten ﷺ.","Ein neuer Qurʾān-Vers, den wir selbst schreiben.","Qurʾān und Bericht unterscheiden.","Mā schāʾ Allāh! Hadithe werden überliefert."),
c("Jemand nennt eine Hadithnummer, aber hat keine Quelle. Was ist sinnvoll?","Den Bericht und die Quelle prüfen.","Die Nummer als sicher verbreiten.","Nachfragen ist gut.","Richtig! Genauigkeit schützt unser Wissen.",1),
t("Erkläre den Unterschied zwischen Qurʾān und Ḥadīṯ.","Ein Qurʾān-Vers gehört zu Allahs offenbartem Buch; ein Ḥadīṯ ist eine überlieferte Nachricht über den Propheten ﷺ.","Einfach und verständlich.","Allāhumma bārik! Das ist klar.")],
"9-10":[
t("Welche Aussage über das Sprechen des Propheten steht in Qurʾān 53:3–4 im Zusammenhang der Offenbarung?","Der Prophet ﷺ spricht die Offenbarung nicht aus eigener Neigung; der Text nennt die eingegebene Offenbarung.","Bleibe beim Sinn der Verse.","Mā schāʾ Allāh! Du beachtest den Zusammenhang."),
c("Was folgt NICHT daraus, dass der Prophet ﷺ unser Vorbild ist?","Jeder beliebige ihm zugeschriebene Bericht sei ohne Prüfung authentisch.","Authentische Überlieferungen sind wichtig.","Berichte müssen nach ihrer Überlieferung beurteilt werden.","Richtig! Ein Bericht braucht Nachweis."),
t("Warum benötigen Hadithe eigene Quellenangaben?","Damit Wortlaut, Überlieferer und Zuverlässigkeit nachvollzogen werden können; wir erfinden keine Nummer.","Unterscheide Behauptung und Beleg.","Allāhumma bārik! Du prüfst gewissenhaft.")]
},
"sirah-sahabah-vorbild":{
"4-5":[
c("Wer gehörte zu den ersten Muslimen, die ausgewandert sind?","Die Muhāǧirūn.","Eine erfundene Gruppe.","Denk an Auswanderer.","Mā schāʾ Allāh! Wir lernen ihre Bezeichnung."),
c("Wer waren die Anṣār?","Die Helfer.","Ein Name für ein Spielzeug.","Sie halfen den Ausgewanderten.","Allāhumma bārik! Du kennst beide Namen.",1)],
"6-8":[
c("Welche beiden frühen Gruppen nennt Qurʾān 9:100?","Die vorangehenden Auswanderer und Helfer.","Nur die Bewohner einer erfundenen Stadt.","Denk an Muhāǧirūn und Anṣār.","Mā schāʾ Allāh! Beide werden erwähnt."),
c("Was tun wir, wenn uns eine spannende Gefährtengeschichte ohne Quelle erzählt wird?","Wir lassen sie erst prüfen.","Wir nennen sie sofort einen sicheren Bericht.","Respekt bedeutet wahrheitsgemäß erzählen.","Richtig! Wir erfinden keine Sīrah."),
t("Was bedeuten die Wörter Muhāǧirūn und Anṣār?","Muhāǧirūn bedeutet Auswanderer, Anṣār bedeutet Helfer.","Du kannst beide Begriffe erklären.","Allāhumma bārik! Du kennst sie.")],
"9-10":[
t("Was lobt Qurʾān 9:100 an den ersten Vorangehenden?","Der Vers nennt die frühen Auswanderer und Helfer sowie die, die ihnen auf gute Weise folgen, und Allahs Wohlgefallen an ihnen.","Nenne die Gruppen.","Mā schāʾ Allāh! Du erkennst die Qurʾān-Aussage."),
c("Welche Darstellung wäre für eine quellentreue Sīrah-Stunde falsch?","Ein erfundenes Einzelabenteuer als überlieferte Ṣaḥābah-Geschichte ausgeben.","Die Bezeichnungen Auswanderer und Helfer erklären.","Keine Erfindungen über Personen.","Richtig! Quellen verdienen Sorgfalt."),
t("Wie vermittelst du einem jüngeren Kind die beiden Gruppen ohne neue Legende?","Ich erkläre: Einige frühe Muslime wanderten aus; andere halfen ihnen. Der Vers nennt beide Gruppen.","Erkläre die Begriffe.","Allāhumma bārik! Du bleibst beim Vers.")]
},
"dua-adhkar-ohne-zwang":{
"4-5":[
c("Dürfen wir Allah mit guten Worten gedenken?","Ja.","Nein, niemals.","Wir erinnern uns an Allah.","Mā schāʾ Allāh! Dhikr ist etwas Schönes."),
c("Ein Kind möchte heute lieber zuhören. Was ist liebevoll?","Es darf im Unterricht zuhören.","Wir machen uns darüber lustig.","Niemand wird bloßgestellt.","Allāhumma bārik! Freundlichkeit hilft beim Lernen.",1)],
"6-8":[
c("Wozu fordert Qurʾān 33:41 auf?","Allah häufig zu gedenken.","Andere Kinder wegen Fehlern auszulachen.","Denke an Dhikr.","Mā schāʾ Allāh! Allahs Gedenken ist wichtig."),
c("Ein Kind kennt die Worte noch nicht gut. Was hilft?","Ruhig erklären und ohne Beschämung üben.","Das Kind vor allen unter Druck setzen.","Kinder lernen unterschiedlich schnell.","Richtig! Geduld gehört zum Unterricht.",1),
t("Wie kannst du freundlich eine kurze Erinnerung an Allah in deinen Tag einbauen?","Ich sage ein bekanntes Lob Allahs oder höre aufmerksam zu.","Wähle einen kurzen bekannten Ausdruck.","Allāhumma bārik! Du denkst an Allah.")],
"9-10":[
t("Welche zeitlichen Hinweise zum Gedenken und Preisen Allahs stehen in Qurʾān 33:41–42?","Häufig an Allah denken und Ihn morgens und abends preisen.","Nenne die Zeitangaben.","Mā schāʾ Allāh! Du erkennst den Zusammenhang."),
c("Welche Unterrichtshaltung ist pädagogisch unangebracht?","Ein unsicheres Kind wegen eines Aussprachefehlers öffentlich beschämen.","Einen Ausdruck freundlich vormachen.","Korrektur soll unterstützend sein.","Richtig! Freundlichkeit hilft beim Lernen."),
t("Was unterscheidet die Qurʾān-Aufforderung von unserer Klassenübung?","Der Qurʾān ruft zum Dhikr auf; das ruhige Zuhören oder Nachsprechen ist unsere Unterrichtsform, keine erfundene Pflichtformel.","Original und Übung unterscheiden.","Allāhumma bārik! Du formulierst präzise.")]
},
"family-gemeinschaft-gutes":{
"4-5":[
c("Was ist eine gute Hilfe in der Gemeinschaft?","Gemeinsam mit Erwachsenen sicher aufräumen.","Unbekannte scharfe Gegenstände anfassen.","Denke an sichere Aufgaben.","Mā schāʾ Allāh! Helfen soll sicher sein."),
c("Wenn du etwas Gefährliches entdeckst, was tust du?","Ich hole eine erwachsene Person.","Ich nehme es allein mit.","Sicherheit zuerst.","Allāhumma bārik! Du holst Hilfe.",1)],
"6-8":[
c("Was befiehlt Qurʾān 16:90 unter anderem?","Gerechtigkeit und gutes Handeln.","Andere absichtlich ungerecht behandeln.","Denk an ʿadl und iḥsān.","Mā schāʾ Allāh! Wir streben nach Gerechtigkeit."),
c("Was passt zu einer gemeinschaftlichen Aufgabe?","Erwachsene um Erlaubnis bitten und eine sichere Tätigkeit wählen.","Unbekannte Abfälle ohne Schutz anfassen.","Hilfe darf niemanden gefährden.","Sehr gut! Verantwortliche Erwachsene unterstützen.",1),
t("Nenne eine sichere gemeinschaftliche Hilfe.","Ich sortiere mit meiner Familie sauberes Papier zum Recycling.","Etwas Einfaches und Erlaubtes.","Allāhumma bārik! Das hilft anderen.")],
"9-10":[
t("Welche positiven Handlungen nennt Qurʾān 16:90?","Allah gebietet Gerechtigkeit, gutes Handeln und Geben an Verwandte.","Nenne den positiven Teil des Verses.","Mā schāʾ Allāh! Du fasst die Gebote zusammen."),
c("Welche Handlung verfehlt die Schutzregel unserer Klassenübung?","Ohne Erlaubnis gefährliche Abfälle auf einer Straße einsammeln.","Eine sichere gemeinsame Aufgabe planen.","Schutz und Hilfe gehören zusammen.","Richtig! Selbstgefährdung ist keine Pflicht."),
t("Wie trennst du Quelle und selbst erfundenes Gemeinschaftsbeispiel?","Qurʾān 16:90 nennt Gerechtigkeit und Güte. Das Sortieren sauberer Gegenstände ist eine praktische Unterrichtsidee.","Beleg und Anwendung auseinanderhalten.","Allāhumma bārik! Das ist sorgfältig.")]
}
};
const ages=["4-5","6-8","9-10"],ids=Object.keys(revisions);
if(ids.length!==11)throw Error("V43 expected 11 curated lesson quizzes");
const next={...prior};
for(const [id,blocks] of Object.entries(revisions)){
 const old=prior[id];
 if(!old||old.sourceAudit?.scientificApproval!==false)throw Error("V43 unknown/approved lesson "+id);
 for(const age of ages){
  const qs=blocks[age],expected=age==="4-5"?2:3;
  if(!Array.isArray(qs)||qs.length!==expected)throw Error("V43 wrong question count "+id+"/"+age);
  for(const q of qs)if(!q.prompt||!q.hint||!q.explain||
   (q.type==="choice"&&(q.options?.length!==2||![0,1].includes(q.correct)))||
   (q.type==="text"&&!q.sample))throw Error("V43 invalid question "+id+"/"+age);
 }
 next[id]={...old,questions:{...old.questions,...blocks}};
}
window.DARKidsAcademyCurriculum=Object.freeze(next);
window.DARKidsAcademyCurriculumV43=Object.freeze({
 version:"20261014-v43",revisedSlots:[147,148,149,150,151,152,153,155,156,157,158],
 ids,questionCount:88,approvedAgeVersions:0,religiousSourcesVerified:false,voiceRecordingsApproved:false
});
})();
