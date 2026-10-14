/* DĀR AL TAWḤĪD KIDS AKADEMI · V45
 * Neue altersgetrennte Quizfragen Slots 171–182 (ohne Fiqh 174 und 180).
 * Quellen- und Freigabefelder unberührt. Noch Entwurf.
 */
(function(){
"use strict";
const prior=window.DARKidsAcademyCurriculum;
if(!prior||!window.DARKidsAcademyCurriculumV44)throw Error("V45 requires V44");
const c=(prompt,right,wrong,hint,explain,pos=0)=>({type:"choice",prompt,options:pos?[wrong,right]:[right,wrong],correct:pos,hint,explain});
const t=(prompt,sample,hint,explain)=>({type:"text",prompt,sample,hint,explain});
const revisions={
"adab-mit-essen-nicht-spielen":{
"4-5":[
c("Du hast ein Stück Brot. Was ist achtsam?","Ich esse es oder gebe es zurück.","Ich werfe es durch das Zimmer.","Essen ist kein Wurfspiel.","Mā schāʾ Allāh! Du gehst respektvoll mit Nahrung um."),
c("Wenn du satt bist, was kannst du tun?","Ich sage Bescheid.","Ich zerdrücke Essen absichtlich.","Satt sein ist erlaubt.","Allāhumma bārik! Du musst nicht weiterspielen.",1)],
"6-8":[
c("Welche Mahnung steht in Qurʾān 7:31 auch über Essen und Trinken?","Esst und trinkt, aber seid nicht maßlos.","Werft Lebensmittel umher.","Achte auf das Maß.","Mā schāʾ Allāh! Maßhalten gilt auch beim Essen."),
c("Du willst mit Essen spielen. Was kannst du stattdessen tun?","Das Essen auf dem Teller lassen und später mit Spielsachen spielen.","Brot absichtlich auf den Boden werfen.","Es gibt andere Spielsachen.","Richtig! Du gehst sorgfältig mit Nahrung um.",1),
t("Nenne eine freundliche Regel für den Esstisch.","Wir werfen kein Essen und sagen Bescheid, wenn wir satt sind.","Ein Satz genügt.","Allāhumma bārik! Das hilft am Tisch.")],
"9-10":[
t("Welchen Grundsatz zu Essen und Trinken nennt Qurʾān 7:31?","Essen und trinken ist erlaubt, aber wir sollen dabei nicht maßlos handeln.","Erkläre die Mahnung des Verses.","Mā schāʾ Allāh! Du kennst den Grundsatz."),
c("Welche Angabe ist nur unsere Unterrichtsregel, kein wörtliches Verszitat?","Wir spielen nicht mit dem Brot auf dem Teller.","Wir sollen nicht maßlos sein.","Trenne Versinhalt und Tischübung.","Richtig! Das Beispiel veranschaulicht die Mahnung."),
t("Warum soll niemand wegen eines Missgeschicks beim Essen beschämt werden?","Die Stunde geht um achtsames Verhalten; ein versehentliches Verschütten ist kein absichtliches Spiel.","Unterscheide Versehen und Absicht.","Allāhumma bārik! Du gehst gerecht mit Fehlern um.")]
},
"tarbiyah-selbststaendigkeit":{
"4-5":[
c("Du möchtest Schuhe anziehen. Was probierst du?","Ich beginne mit einem Schritt.","Ich sage sofort: Ich kann gar nichts.","Klein anfangen hilft.","Mā schāʾ Allāh! Du darfst es üben."),
c("Wenn der Knoten schwer ist, was ist richtig?","Ich frage nach Hilfe.","Ich muss ihn allein schaffen, auch wenn ich nicht kann.","Hilfe gehört zum Lernen.","Allāhumma bārik! Du kennst deinen nächsten Schritt.",1)],
"6-8":[
c("Woran erinnert Qurʾān 94:7–8?","Sich nach einer Aufgabe sinnvoll anzustrengen und sich dem Herrn zuzuwenden.","Kinder zu überfordern.","Achte auf Bemühen.","Mā schāʾ Allāh! Wir lernen, dranzubleiben."),
c("Du kannst einen Schuh selbst anziehen, der andere Knoten ist noch schwer. Was passt?","Den ersten Schritt selbst tun und für den Knoten Hilfe holen.","Niemals um Hilfe bitten dürfen.","Schritt für Schritt lernen.","Richtig! Selbstständig heißt nicht allein gelassen.",1),
t("Teile eine einfache Aufgabe in zwei Schritte.","Erst lege ich das Buch bereit, dann lese ich eine Seite.","Wähle etwas, das du schaffen kannst.","Allāhumma bārik! Du planst klug.")],
"9-10":[
t("Welche zwei Handlungsrichtungen enthalten Qurʾān 94:7–8?","Sich nach dem Freiwerden anzustrengen und das Verlangen auf den Herrn zu richten.","Nenne beide Anweisungen.","Mā schāʾ Allāh! Du bleibst beim Vers."),
c("Was darf aus dem Vers nicht gefolgert werden?","Ein Kind müsse jede schwierige Aufgabe ohne Hilfe bewältigen.","Kinder können altersgerecht Verantwortung lernen.","Lernen kennt Grenzen.","Richtig! Hilfe holen ist erlaubt."),
t("Wie machst du aus der Mahnung eine realistische Lernübung?","Ich wähle eine Aufgabe, teile sie in Schritte und bitte bei Bedarf um Unterstützung.","Schutz und Selbstständigkeit verbinden.","Allāhumma bārik! Das ist machbar.")]
},
"nafs-stille-und-sammlung":{
"4-5":[
c("Was machst du vor dem Lesen?","Ich sitze einen Moment ruhig.","Ich reiße andere Bücher weg.","Ein ruhiger Anfang hilft.","Mā schāʾ Allāh! Du bereitest dich vor."),
c("Wenn ein Kind noch unruhig ist, was hilft?","Freundlich unterstützen.","Vor allen auslachen.","Wir üben ohne Beschämung.","Allāhumma bārik! Geduld ist wichtig.",1)],
"6-8":[
c("Woran erinnert Qurʾān 7:205?","An das Gedenken Allahs in Demut, ohne laute Rede.","Dass wir im Unterricht Kinder einschüchtern sollen.","Achte auf ruhiges Gedenken.","Mā schāʾ Allāh! Der Vers ruft zum Gedenken auf."),
c("Vor dem Lesen sind die Kinder noch unruhig. Was ist eine gute Übung?","Kurz zur Ruhe kommen und die Bücher leise öffnen.","Alle anderen laut anfahren.","Freundlich anfangen.","Richtig! Stille kann man lernen.",1),
t("Nenne eine Sache, die dir beim ruhigen Lesen hilft.","Ich lege alles bereit und atme einmal ruhig, bevor ich lese.","Eine einfache Handlung reicht.","Allāhumma bārik! Du lernst bewusst.")],
"9-10":[
t("Welche Eigenschaften des Gedenkens nennt Qurʾān 7:205?","Gedenken in sich selbst, demütig und ohne laute Rede, morgens und abends.","Nenne die Merkmale.","Mā schāʾ Allāh! Du hast sie erkannt."),
c("Was wäre eine unangemessene Anwendung?","Kinder zwingen, minutenlang völlig bewegungslos zu bleiben.","Einen kurzen ruhigen Beginn anbieten.","Übungen müssen altersgerecht sein.","Richtig! Der Vers setzt keine solche Unterrichtsstrafe fest."),
t("Wie unterscheidest du Gedenken von unserer Stilleübung?","Der Vers spricht vom Gedenken Allahs; das kurze ruhige Sitzen vor dem Lesen ist unsere eigene Lernhilfe.","Quelle und Gewohnheit unterscheiden.","Allāhumma bārik! Du bleibst präzise.")]
},
"tawhid-im-alltag":{
"4-5":[
c("Wen beten wir an?","Allah allein.","Einen Menschen.","Denk an Sūrat al-Fātiḥah.","Mā schāʾ Allāh! Anbetung gehört Allah."),
c("Wenn du einen Stift brauchst, darfst du ein anderes Kind fragen?","Ja.","Nein, das wäre immer Anbetung.","Gewöhnliche Hilfe ist etwas anderes.","Allāhumma bārik! Du unterscheidest gut.",1)],
"6-8":[
c("Was sagen wir in Qurʾān 1:5?","Dich allein beten wir an, und Dich allein bitten wir um Hilfe.","Wir beten alle Geschöpfe an.","Denk an die Fātiḥah.","Mā schāʾ Allāh! Der Vers erklärt Tawḥīd."),
c("Wobei ist es richtig, eine Person um Hilfe zu bitten?","Wenn du einen schweren Knoten nicht lösen kannst.","Um sie als Gott anzubeten.","Alltagshilfe ist keine Anbetung.","Richtig! Gewöhnliche Hilfe ist erlaubt.",1),
t("Nenne ein Beispiel für Anbetung und eines für Alltagshilfe.","Ich bete zu Allah. Meinen Freund frage ich nach einem Stift.","Unterscheide beide Arten.","Allāhumma bārik! Du hast es verstanden.")],
"9-10":[
t("Welche beiden Aussagen verbindet Qurʾān 1:5?","Anbetung allein für Allah und das Bitten Allahs um Hilfe.","Beide Aussagen nennen.","Mā schāʾ Allāh! Du kennst den Vers."),
c("Welche falsche Gleichsetzung sollten wir vermeiden?","Jemanden um Wasser zu bitten sei automatisch Anbetung dieses Menschen.","Allah allein anzubeten.","Bedingungen einer Handlung beachten.","Richtig! Nicht jede Bitte ist Anbetung."),
t("Warum hilft das Beispiel 'Stift von einem Mitschüler'?","Es zeigt, dass eine gewöhnliche Bitte um mögliche Hilfe an einen Menschen nicht dasselbe wie die Anbetung Allahs ist.","Unterscheide Gottesanbetung und Alltag.","Allāhumma bārik! Das ist klar.")]
},
"iman-bemuehen-und-vertrauen":{
"4-5":[
c("Du hast morgen eine Lernaufgabe. Was kannst du tun?","Üben und Allah um Hilfe bitten.","Gar nichts tun und andere anschreien.","Üben und bitten passt zusammen.","Mā schāʾ Allāh! Du bemühst dich."),
c("Wenn etwas schwer ist, darfst du fragen?","Ja.","Nein, niemals.","Geduld heißt nicht ohne Hilfe bleiben.","Allāhumma bārik! Du holst Unterstützung.",1)],
"6-8":[
c("Worin sollen wir laut Qurʾān 2:45 Hilfe suchen?","In Geduld und Gebet.","Im Verletzen anderer.","Denke an beide Wege.","Mā schāʾ Allāh! Der Vers nennt Geduld und Gebet."),
c("Was passt zur Unterrichtsübung vor einer Prüfung?","Die Aufgabe ansehen, üben und Allah um Hilfe bitten.","Auf Lernen vollständig verzichten.","Tu, was dir möglich ist.","Richtig! Bitte und Bemühen ergänzen einander.",1),
t("Wie bereitest du dich auf eine kleine Übung vor?","Ich lese meine Aufgabe noch einmal, frage bei Unsicherheit nach und bitte Allah um Hilfe.","Ein realistischer Plan genügt.","Allāhumma bārik! Du gehst gut vor.")],
"9-10":[
t("Welche zwei Hilfen nennt Qurʾān 2:45 ausdrücklich?","Geduld und Gebet.","Beide aus dem Vers nennen.","Mā schāʾ Allāh! Du kennst die Stelle."),
c("Welche Schlussfolgerung wäre unbegründet?","Nach einem Bittgebet brauche ich niemals mehr zu lernen.","Ich darf Allah um Hilfe bitten und mich bemühen.","Der Vers ersetzt nicht jedes Handeln.","Richtig! Kein falsches Erfolgsversprechen."),
t("Warum ist das Lesen vor einer Prüfung ein eigenes Lernbeispiel?","Der Vers lehrt Geduld und Gebet; das Wiederholen der Aufgabe ist eine sinnvolle praktische Anwendung.","Vers und Praxis auseinanderhalten.","Allāhumma bārik! Das ist quellentreu.")]
},
"akhlaq-unterschiedliche-menschen":{
"4-5":[
c("Ein Kind spricht eine andere Sprache. Wie begrüßt du es?","Freundlich.","Mit Spott.","Menschen sind verschieden.","Mā schāʾ Allāh! Dein Gruß ist freundlich."),
c("Dürfen wir jemanden wegen seines Aussehens beleidigen?","Nein.","Ja, immer.","Jeder Mensch hat Würde.","Allāhumma bārik! Du schützt andere.",1)],
"6-8":[
c("Was nennt Qurʾān 30:22 als Zeichen Allahs?","Die Verschiedenheit der Sprachen und Farben.","Nur eine einzige erlaubte Sprache.","Achte auf Allahs Zeichen.","Mā schāʾ Allāh! Unterschiedlichkeit ist erwähnt."),
c("Eine Mitschülerin spricht ein Wort anders aus. Was machst du?","Ich höre freundlich zu und helfe bei Bedarf.","Ich lache sie aus.","Rücksicht statt Spott.","Richtig! Du behandelst sie respektvoll.",1),
t("Formuliere einen freundlichen Gruß für ein neues Kind.","Assalāmu ʿalaikum, schön, dass du da bist.","Keine Frage, die bloßstellt.","Allāhumma bārik! Du heißt es willkommen.")],
"9-10":[
t("Welche Unterschiede nennt Qurʾān 30:22 als Zeichen Allahs?","Verschiedene Sprachen und Farben, neben der Erschaffung der Himmel und Erde.","Nenne den Versinhalt.","Mā schāʾ Allāh! Du kennst die Stelle."),
c("Welche Haltung widerspricht dem Unterricht?","Menschen wegen Sprache oder Aussehen gering schätzen.","Verschiedenheit respektvoll wahrnehmen.","Denke an Menschenwürde.","Richtig! Herabsetzung ist falsch."),
t("Wie kannst du reagieren, wenn jemand wegen seiner Sprache verspottet wird?","Ich mache nicht mit, zeige Respekt und hole bei fortgesetztem Spott eine vertrauenswürdige erwachsene Person.","Kinderschutz und Respekt verbinden.","Allāhumma bārik! Das ist gut.") ]
},
"adab-trinken-mit-guten-sitten":{
"4-5":[
c("Wie gehst du mit deinem Glas um?","Ruhig und vorsichtig.","Ich verspritze Wasser absichtlich.","Wasser ist ein Geschenk.","Mā schāʾ Allāh! Du achtest darauf."),
c("Wenn etwas aus Versehen verschüttet wird, was hilft?","Bescheid sagen und sicher helfen.","Das Kind laut beschimpfen.","Ein Versehen darf passieren.","Allāhumma bārik! Du reagierst freundlich.",1)],
"6-8":[
c("Woran erinnert Qurʾān 16:10?","Allah lässt Wasser herabkommen, von dem wir trinken.","Wir sollen Wasser absichtlich verschwenden.","Denk an das Geschenk Wasser.","Mā schāʾ Allāh! Wasser ist eine Gabe Allahs."),
c("Du möchtest trinken. Was ist eine ruhige Unterrichtsübung?","Das Glas sicher halten und behutsam absetzen.","Das Wasser nach anderen werfen.","Es ist eine Umgangsübung.","Richtig! Vorsicht ist gut.",1),
t("Wie kannst du im Alltag mit Trinkwasser achtsam sein?","Ich fülle mir nur so viel ein, wie ich trinken möchte.","Ein kleines Beispiel genügt.","Allāhumma bārik! Du gehst sorgsam damit um.")],
"9-10":[
t("Worauf verweist Qurʾān 16:10 im Zusammenhang mit Wasser?","Allah sendet Wasser vom Himmel herab, von dem Menschen trinken.","Erkläre den Verskern.","Mā schāʾ Allāh! Du kennst den Beleg."),
c("Welche Behauptung wäre ohne weiteren Beleg unzulässig?","Dass eine bestimmte Griffhaltung am Glas durch 16:10 ausdrücklich vorgeschrieben ist.","Dass Wasser eine Gabe Allahs ist.","Wasser und Umgangsübung unterscheiden.","Richtig! Wir erfinden kein Ritual."),
t("Warum ist behutsames Absetzen des Glases eine Übung, kein Verszitat?","Der Vers erklärt Allahs Gabe des Wassers; die Griff- und Trinkübung ist unsere eigene Didaktik.","Original und Praxis trennen.","Allāhumma bārik! Das ist genau.")]
},
"nafs-wertschaetzend-mit-sich":{
"4-5":[
c("Du hast etwas gut geschafft. Was darfst du sagen?","Ich freue mich darüber.","Alle anderen sind schlecht.","Freude ohne Herabsetzung.","Mā schāʾ Allāh! Du darfst dich freuen."),
c("Was tust du, wenn jemand etwas noch nicht kann?","Ich helfe freundlich.","Ich lache es aus.","Jeder lernt.","Allāhumma bārik! Du bist rücksichtsvoll.",1)],
"6-8":[
c("Was lehrt Qurʾān 17:70 über die Kinder Adams?","Allah hat ihnen Würde verliehen.","Nur manche dürfen freundlich behandelt werden.","Denk an menschliche Würde.","Mā schāʾ Allāh! Menschen haben Würde."),
c("Welcher Satz ist gut über dich selbst?","Ich habe geübt und etwas dazugelernt.","Alle anderen sind wertlos.","Kein Vergleich nötig.","Richtig! Du kannst dich freuen, ohne abzuwerten.",1),
t("Nenne eine Fähigkeit von dir ohne Vergleich mit anderen.","Ich kann freundlich grüßen und dabei auf andere achten.","Ein kleiner Satz reicht.","Allāhumma bārik! Das ist wertschätzend.")],
"9-10":[
t("Was nennt Qurʾān 17:70 als Ehre der Kinder Adams?","Allah hat sie gewürdigt und ihnen gute Dinge gegeben.","Den Sinn des Verses nennen.","Mā schāʾ Allāh! Du verstehst die Aussage."),
c("Welche Aussage passt nicht zur Menschenwürde?","Ein Kind sei wertlos, weil es etwas noch nicht kann.","Menschen können Verschiedenes lernen.","Würde ist keine Schulnote.","Richtig! Können ist nicht dasselbe wie Wert."),
t("Wie erklärst du den Zusammenhang von Selbstachtung und Rücksicht?","Ich darf meine Fähigkeiten wahrnehmen, ohne deshalb andere gering zu schätzen.","Beide Seiten verbinden.","Allāhumma bārik! Das ist ausgewogen.")]
},
"tawhid-keine-goettliche-macht-fuer-geschoepfe":{
"4-5":[
c("Wie viele Götter gibt es?","Allah ist Einer.","Es gibt viele gleiche Götter.","Denk an Sūrat al-Iḫlāṣ.","Mā schāʾ Allāh! Allah ist Einer."),
c("Ist die Sonne ein zweiter Gott?","Nein.","Ja.","Sie ist erschaffen.","Allāhumma bārik! Anbetung gehört Allah.",1)],
"6-8":[
c("Was lehrt Sūrat al-Iḫlāṣ über Allah?","Allah ist Einer, niemand ist Ihm gleich.","Ein erschaffenes Ding ist Allah gleich.","Denke an die vier Verse.","Mā schāʾ Allāh! Das ist Tawḥīd."),
c("Ein Kind sieht ein Amulett. Was soll es nicht glauben?","Dass der Gegenstand unabhängig göttliche Macht besitzt.","Dass Gegenstände erschaffen sind.","Nur Allah ist Gott.","Richtig! Geschaffenes ist kein Gott.",1),
t("Erkläre einfach, warum ein erschaffenes Ding nicht Allah ist.","Allah ist einzig, und kein Geschöpf ist Ihm gleich.","Bleib bei Sūrat al-Iḫlāṣ.","Allāhumma bārik! Du erklärst klar.")],
"9-10":[
t("Nenne zwei Aussagen aus Qurʾān 112:1–4 über Allah.","Allah ist Einer und niemand ist Ihm gleich; Er zeugt nicht und wurde nicht gezeugt.","Zwei Aussagen genügen.","Mā schāʾ Allāh! Du kennst den Wortlaut."),
c("Welche Gleichsetzung widerspricht der Sūrah?","Ein Bild oder Stern sei ein zweiter Gott neben Allah.","Allah ist Einer.","Geschöpfe sind nicht Gott.","Richtig! Tawḥīd schließt solche Gleichsetzung aus."),
t("Wie würdest du einem jüngeren Kind die Einzigkeit Allahs erklären?","Allah ist Einer. Alles Erschaffene ist von Ihm abhängig und kein Geschöpf ist Ihm gleich.","Einfach und ohne Angstbilder.","Allāhumma bārik! Das ist verständlich.")]
},
"iman-glaube-und-gute-worte":{
"4-5":[
c("Wie kannst du an der Tür freundlich sein?","Mit einem guten Gruß.","Mit einer Beleidigung.","Freundliche Worte zählen.","Mā schāʾ Allāh! Dein Gruß ist schön."),
c("Wenn du dich beim Sprechen vertust, darfst du neu anfangen?","Ja.","Nein, alle müssen mich auslachen.","Gute Worte kann man üben.","Allāhumma bārik! Jeder lernt.",1)],
"6-8":[
c("Woran erinnert Qurʾān 2:83 auch beim Umgang mit Menschen?","Gutes zu den Menschen zu sagen.","Andere absichtlich zu beschimpfen.","Achte auf die guten Worte.","Mā schāʾ Allāh! Freundlichkeit gehört zum Glauben."),
c("Ein Kind wartet an der Tür. Welcher Satz passt?","Assalāmu ʿalaikum, kann ich helfen?","Geh weg, du bist langsam.","Denke an Rücksicht.","Richtig! Du sprichst höflich.",1),
t("Nenne ein gutes Wort, das du heute sagen könntest.","Danke, dass du mir geholfen hast.","Ein einfacher Satz genügt.","Allāhumma bārik! Das ist freundlich.")],
"9-10":[
t("Welche Handlungen zählt Qurʾān 2:83 unter anderem auf?","Allah allein dienen, Eltern Gutes tun und freundlich zu Menschen sprechen.","Nenne drei Teile.","Mā schāʾ Allāh! Du erkennst den Zusammenhang."),
c("Welche Vorstellung widerspricht der Lektion?","Gute Worte seien völlig unwichtig, solange jemand nur von Glauben spricht.","Glauben soll mit gutem Verhalten einhergehen.","Achte auf Wort und Tat.","Richtig! Freundliche Worte gehören dazu."),
t("Wie kannst du jemanden freundlich korrigieren, ohne ihn bloßzustellen?","Ich spreche ruhig unter vier Augen und biete Hilfe an, statt ihn vor allen auszulachen.","Beachte Würde und Sicherheit.","Allāhumma bārik! Das ist gute Umgangsform.")]
}
};
const ages=["4-5","6-8","9-10"],ids=Object.keys(revisions);
if(ids.length!==10)throw Error("V45 expected ten curated lessons");
const next={...prior};
for(const [id,blocks] of Object.entries(revisions)){
 const old=prior[id];if(!old||old.sourceAudit?.scientificApproval!==false)throw Error("V45 unknown/approved lesson "+id);
 for(const age of ages){
  const questions=blocks[age],count=age==="4-5"?2:3;
  if(!Array.isArray(questions)||questions.length!==count)throw Error("V45 bad count "+id+"/"+age);
  for(const q of questions)if(!q.prompt||!q.hint||!q.explain||q.type==="choice"&&(q.options?.length!==2||![0,1].includes(q.correct))||q.type==="text"&&!q.sample)throw Error("V45 invalid question "+id+"/"+age);
 }
 next[id]={...old,questions:{...old.questions,...blocks}};
}
window.DARKidsAcademyCurriculum=Object.freeze(next);
window.DARKidsAcademyCurriculumV45=Object.freeze({
 version:"20261014-v45",revisedSlots:[171,172,173,175,176,177,178,179,181,182],
 ids,questionCount:80,approvedAgeVersions:0,religiousSourcesVerified:false,voiceRecordingsApproved:false
});
})();
