/* DĀR AL TAWḤĪD KIDS AKADEMI V47 · age-based quiz revision slots 195–203.
 * Source-dependent Fiqh 198 and 201 remain unchanged.
 * V47 is a draft, not a release/approval or audio job.
 */
(function(){
"use strict";
const prior=window.DARKidsAcademyCurriculum;
if(!prior||!window.DARKidsAcademyCurriculumV46)throw Error("V47 requires V46");
const c=(prompt,right,wrong,hint,explain,pos=0)=>({type:"choice",prompt,options:pos?[wrong,right]:[right,wrong],correct:pos,hint,explain});
const t=(prompt,sample,hint,explain)=>({type:"text",prompt,sample,hint,explain});
const revisions={
"akhlaq-verantwortung-fuer-worte":{
"4-5":[
c("Du hast einen bösen Namen gesagt. Was kannst du tun?","Es ehrlich zugeben und dich entschuldigen.","Den Namen immer wieder rufen.","Freundlich und ehrlich sein.","Mā schāʾ Allāh! Du willst es besser machen."),
c("Was soll mit einem verletzenden Spitznamen geschehen?","Wir benutzen ihn nicht weiter.","Wir sagen ihn jeden Tag.","Denke an die Gefühle anderer.","Allāhumma bārik! Du schützt andere.",1)],
"6-8":[
c("Was verbietet Qurʾān 49:11 unter anderem?","Spott und verletzende Spitznamen.","Jemandem eine höfliche Frage zu stellen.","Denke an gute Worte.","Mā schāʾ Allāh! Der Vers schützt vor Herabsetzung."),
c("Du hast jemanden ausgelacht. Was ist ein guter nächster Schritt?","Aufhören, Verantwortung übernehmen und dich entschuldigen.","Es als Spaß abtun und weitermachen.","Eine Entschuldigung braucht Veränderung.","Richtig! Du kannst Unrecht beenden.",1),
t("Formuliere eine aufrichtige Entschuldigung ohne Ausrede.","Das war gemein von mir. Es tut mir leid. Ich benutze diesen Namen nicht mehr.","Nenne, was du ändern wirst.","Allāhumma bārik! Du übernimmst Verantwortung.")],
"9-10":[
t("Welche Arten verletzender Rede behandelt Qurʾān 49:11?","Spott, gegenseitige Herabsetzung und verletzende Namen.","Nenne die Formen aus dem Vers.","Mā schāʾ Allāh! Du kennst die Mahnung."),
c("Welche Entschuldigung wäre unvollständig?","Es tut mir leid, aber ich werde dich weiter so nennen.","Ich höre auf und verwende den Namen nicht mehr.","Worte und Handlungen sollen zusammenpassen.","Richtig! Entschuldigung bedeutet auch Verhaltensänderung."),
t("Was ist Versinhalt, was unsere Unterrichtsübung?","Der Vers verbietet Spott und verletzende Namen. Eine persönliche Entschuldigung zu formulieren ist unsere Anwendung.","Trenne Qurʾān-Wortlaut und Übung.","Allāhumma bārik! Du bleibst quellentreu.")]
},
"adab-juengere-freundlich":{
"4-5":[
c("Ein jüngeres Kind braucht Platz auf der Treppe. Was tust du?","Ich lasse es sicher vorbei.","Ich dränge es weg.","Denke an seine Sicherheit.","Mā schāʾ Allāh! Du bist rücksichtsvoll."),
c("Darfst du einem kleineren Kind helfen, ohne es anzufassen?","Ja.","Nein, man muss es immer festhalten.","Fragen und Platz machen können reichen.","Allāhumma bārik! Du respektierst seine Grenzen.",1)],
"6-8":[
c("Woran erinnert Qurʾān 49:10?","Glaubende sind Geschwister; wir sollen Frieden stiften.","Jüngere sollen immer übergangen werden.","Denke an Geschwisterlichkeit.","Mā schāʾ Allāh! Rücksicht gehört zum guten Miteinander."),
c("Ein kleineres Kind geht langsam. Wie reagierst du?","Warten oder freundlich Hilfe anbieten, ohne zu ziehen.","Es am Arm gegen seinen Willen zerren.","Achte auf Zustimmung.","Richtig! Niemand wird gedrängt.",1),
t("Formuliere ein freundliches Hilfsangebot.","Soll ich dir helfen, oder möchtest du es allein versuchen?","Fragen statt zwingen.","Allāhumma bārik! Das achtet Grenzen.")],
"9-10":[
t("Welchen Gemeinschaftsgedanken vermittelt Qurʾān 49:10?","Die Glaubenden sind Geschwister und sollen Frieden untereinander fördern.","Nenne beide Aspekte.","Mā schāʾ Allāh! Du verstehst die Stelle."),
c("Welche Handlung widerspricht der Schutzregel?","Ein jüngeres Kind ohne Anlass festhalten oder schubsen.","Einem Kind Platz lassen.","Grenzen achten.","Richtig! Hilfe ist kein Zwang."),
t("Warum ist das Treppenbeispiel eine Anwendung, kein berichtetes Ereignis?","Der Vers spricht von Geschwisterlichkeit; das Beispiel zeigt, wie man im Alltag mit jüngeren Kindern rücksichtsvoll sein kann.","Quelle und Unterricht unterscheiden.","Allāhumma bārik! Du ordnest die Ebenen.")]
},
"nafs-herz-mit-guten-taten":{
"4-5":[
c("Welche kleine gute Tat kannst du heute tun?","Freundlich grüßen.","Jemanden absichtlich auslachen.","Kleine Hilfe zählt.","Mā schāʾ Allāh! Du kannst Gutes tun."),
c("Musst du alle guten Taten vor anderen aufzählen?","Nein.","Ja, immer.","Aufrichtigkeit ist wichtig.","Allāhumma bārik! Nicht alles muss erzählt werden.",1)],
"6-8":[
c("Was nennt Qurʾān 98:5 unter anderem?","Allah aufrichtig dienen, Gebet und Zakāh.","Andere wegen fehlendem Lob verspotteten.","Denke an den Vers.","Mā schāʾ Allāh! Die Aufrichtigkeit steht im Mittelpunkt."),
c("Du möchtest eine gute Tat eine Woche lang üben. Was passt?","Jeden Tag eine kleine erlaubte Hilfe versuchen.","Andere dazu zwingen, ihre Taten offenzulegen.","Kleine Schritte und freiwilliges Lernen.","Richtig! Niemand muss über sein Inneres berichten.",1),
t("Nenne eine kleine freiwillige Tat für eine Woche.","Ich grüße freundlich und helfe, wenn ich es sicher kann.","Einfach und ohne Wettbewerb.","Allāhumma bārik! Du planst etwas Gutes.")],
"9-10":[
t("Welche religiösen Handlungen nennt Qurʾān 98:5 in unserem Lernabschnitt?","Allah aufrichtig dienen, das Gebet verrichten und die Zakāh geben.","Nenne die drei Kernelemente.","Mā schāʾ Allāh! Du kennst den Vers."),
c("Welche Praxis passt NICHT zum Ikhlāṣ-Unterricht?","Kinder öffentlich danach bewerten, wie aufrichtig ihre Herzen seien.","Ein Kind kann freiwillig eine kleine gute Tat üben.","Über verborgene Absichten urteilen wir nicht.","Richtig! Aufrichtigkeit ist kein öffentlicher Wettkampf."),
t("Was ist der Unterschied zwischen dem Vers und unserem Wochenplan?","Der Vers nennt Aufrichtigkeit und Handlungen; der Wochenplan ist eine selbst gewählte pädagogische Übung.","Quelle und Aufgabe trennen.","Allāhumma bārik! Du differenzierst.")]
},
"akhlaq-fuersorge-fuer-kranke":{
"4-5":[
c("Ein krankes Geschwisterkind möchte ein Buch. Was kannst du tun?","Mit Erlaubnis das Buch bringen.","Ohne Erlaubnis Medikamente geben.","Denke an sichere Hilfe.","Mā schāʾ Allāh! Du bist fürsorglich."),
c("Wer entscheidet über Medikamente?","Erwachsene und medizinische Fachleute.","Ein Kind allein.","Sicherheit geht vor.","Allāhumma bārik! Du holst Hilfe.",1)],
"6-8":[
c("Wozu ermutigt Qurʾān 4:36 im Umgang mit Menschen?","Zu gutem Umgang mit Eltern, Verwandten und Bedürftigen.","Dazu, hilfsbedürftige Menschen zu verspotten.","Denke an Fürsorge.","Mā schāʾ Allāh! Gute Hilfe ist wichtig."),
c("Ein Kranker braucht Ruhe. Was ist eine gute Hilfe?","Fragen, ob ein Buch gewünscht ist, und Ruhe respektieren.","Ohne Fragen eine lange, laute Besuchsrunde machen.","Rücksicht gehört zur Fürsorge.","Richtig! Die Person darf Nein sagen.",1),
t("Nenne eine sichere Hilfe, die Kinder für kranke Angehörige anbieten können.","Ich kann auf Wunsch Wasser holen und es einem Erwachsenen geben.","Keine medizinischen Aufgaben übernehmen.","Allāhumma bārik! Du hilfst umsichtig.")],
"9-10":[
t("Welche Gruppen werden in Qurʾān 4:36 zum guten Umgang genannt?","Unter anderem Eltern, Verwandte, Waisen, Bedürftige und Nachbarn.","Nenne einige ausdrücklich erwähnte.","Mā schāʾ Allāh! Du liest aufmerksam."),
c("Welche Tätigkeit ist keine sichere Kinderaufgabe ohne Erwachsenen?","Eigenmächtig Medikamente dosieren.","Ein gewünschtes Buch bringen.","Krankheitsversorgung braucht Verantwortung.","Richtig! Medizin bleibt bei Erwachsenen und Fachleuten."),
t("Warum ist das Buchbringen eine Unterrichtsanwendung und kein spezieller Hadith über Krankenbesuche?","Der Vers fordert Güte im Umgang; die konkrete Hilfe mit dem Buch ist ein einfaches Beispiel, keine vorgegebene Überlieferung.","Original und Beispiel trennen.","Allāhumma bārik! Das ist quellentreu.")]
},
"adab-anderen-platz-machen":{
"4-5":[
c("Ein weiteres Kind möchte sich zu euch setzen. Was ist freundlich?","Ein bisschen Platz machen.","Es wegschubsen.","Alle sollen sicher sitzen.","Mā schāʾ Allāh! Du rückst freundlich."),
c("Wenn du keinen Platz mehr hast, was kannst du tun?","Eine erwachsene Person um Hilfe bitten.","Andere heimlich vom Stuhl drängen.","Fragen ist erlaubt.","Allāhumma bārik! Du bleibst rücksichtsvoll.",1)],
"6-8":[
c("Welche Aufforderung steht in Qurʾān 58:11?","Macht Raum, wenn euch gesagt wird, in der Versammlung Raum zu machen.","Verdrängt alle anderen aus der Runde.","Achte auf den Sitzkreis.","Mā schāʾ Allāh! Rücksicht macht Gemeinschaft möglich."),
c("Der Sitzkreis ist sehr eng. Was ist sinnvoll?","Zusammenrücken und sicher Platz schaffen.","Ein Kind ohne Vorwarnung ziehen.","Niemand wird gestoßen.","Richtig! Du denkst an alle.",1),
t("Wie sagst du höflich, dass du Platz machst?","Setz dich gern dazu. Ich rücke etwas.","Freundlich und einfach.","Allāhumma bārik! Du heißt andere willkommen.")],
"9-10":[
t("Welche zwei Anweisungen enthält Qurʾān 58:11 für Versammlungen?","Raum schaffen, wenn darum gebeten wird, und sich erheben, wenn dazu aufgefordert wird.","Beide Teile nennen.","Mā schāʾ Allāh! Du kennst den Vers."),
c("Welche Handlung ist keine gute Umsetzung?","Ein Kind grob zur Seite schieben, um Platz zu erzwingen.","Freundlich zusammenrücken.","Achte auf Sicherheit.","Richtig! Raum schaffen heißt nicht stoßen."),
t("Wie erklärst du den Vers mit einem realistischen Beispiel?","Wenn jemand zum Sitzkreis kommt, können wir freundlich zusammenrücken, sofern es sicher ist.","Erkläre Quelle und Situation.","Allāhumma bārik! Du vermittelst den Sinn.")]
},
"akhlaq-guter-charakter-rueckblick":{
"4-5":[
c("Was ist eine freundliche Entscheidung?","Jemandem bei einem kleinen Problem helfen.","Ein Kind auslachen.","Denk an guten Charakter.","Mā schāʾ Allāh! Freundlichkeit zählt."),
c("Müssen wir behaupten, so vollkommen wie der Prophet ﷺ zu sein?","Nein.","Ja.","Er ist ein Vorbild, kein Wettbewerb.","Allāhumma bārik! Du darfst dazulernen.",1)],
"6-8":[
c("Was sagt Qurʾān 68:4 zum Propheten ﷺ?","Er besitzt einen großartigen Charakter.","Sein Charakter wird im Vers kritisiert.","Denke an das Vorbild.","Mā schāʾ Allāh! Der Vers lobt seinen Charakter."),
c("Du blickst auf deine Woche zurück. Was passt?","Eine kleine freundliche Tat wahrnehmen und weiterlernen.","Dich über Kinder lustig machen, die Fehler hatten.","Ohne Vergleiche lernen.","Richtig! Dein Rückblick darf freundlich sein.",1),
t("Nenne eine konkrete freundliche Entscheidung aus dem Alltag.","Ich habe jemandem zugehört, statt ihn zu unterbrechen.","Ein kleiner Schritt genügt.","Allāhumma bārik! Das ist gutes Verhalten.")],
"9-10":[
t("Welche Aussage enthält Qurʾān 68:4?","Allah lobt den großartigen Charakter des Propheten ﷺ.","Nenne den Kern des Verses.","Mā schāʾ Allāh! Du bleibst bei der Quelle."),
c("Welche Deutung wäre unbegründet?","Kinder müssten sich als genauso vollkommen wie der Prophet ﷺ darstellen.","Der Prophet ﷺ hat einen vorbildlichen Charakter.","Ein Vorbild ist kein Bloßstellungsmaßstab.","Richtig! Niemand soll beschämt werden."),
t("Warum ist unser Wochenrückblick kein überlieferter Prophetenbericht?","Qurʾān 68:4 lobt seinen Charakter; das eigene Beispiel aus der Woche ist unsere persönliche Unterrichtsübung.","Vers und eigene Situation unterscheiden.","Allāhumma bārik! Du trennst sauber.")]
},
"adab-digital":{
"4-5":[
c("Du möchtest eine Nachricht schreiben. Was ist freundlich?","Ein gutes Wort.","Einen bösen Spitznamen.","Auch am Bildschirm zählen Worte.","Mā schāʾ Allāh! Du schreibst freundlich."),
c("Wenn eine Nachricht dich verletzt, darfst du Hilfe holen?","Ja.","Nein, niemals.","Du musst das nicht allein lösen.","Allāhumma bārik! Du holst Unterstützung.",1)],
"6-8":[
c("Was verbietet Qurʾān 49:11?","Spott und verletzende Spitznamen.","Höfliche Nachrichten.","Denke an gute Worte.","Mā schāʾ Allāh! Auch digital dürfen wir nicht verspotten."),
c("Ein anderer schickt einen bösen Spitznamen. Was tust du?","Nicht mitmachen und einer vertrauten erwachsenen Person Bescheid sagen.","Den Spitznamen an alle weiterleiten.","Schutz vor Weiterverbreitung.","Richtig! Du stoppst die Gemeinheit.",1),
t("Formuliere eine freundliche Nachricht statt einer gemeinen.","Ich bin gerade verärgert. Können wir später ruhig sprechen?","Ruhig und ohne Spott.","Allāhumma bārik! Das ist achtsam.")],
"9-10":[
t("Welche Grundregel aus Qurʾān 49:11 gilt auch für digitale Kommunikation?","Kein Spott und keine verletzenden Namen; die konkrete Bildschirmtechnik steht nicht im Vers.","Trenne Grundsatz und modernes Beispiel.","Mā schāʾ Allāh! Du erkennst die Übertragung."),
c("Welche Reaktion wäre riskant, wenn ein Kind online verletzt wird?","Die verletzende Nachricht mit bösem Kommentar breit weiterverbreiten.","Vertrauenswürdigen Erwachsenen um Hilfe bitten.","Verstärkung des Angriffs vermeiden.","Richtig! Schutz geht vor Gegenangriff."),
t("Warum ist der Begriff digitale Nachricht eine Unterrichtsanwendung?","Der Vers spricht über verletzende Rede allgemein; unsere Nachricht ist ein modernes Beispiel, kein wörtlicher Versgegenstand.","Original und Anwendung unterscheiden.","Allāhumma bārik! Das ist korrekt.")]
}
};
const ages=["4-5","6-8","9-10"],ids=Object.keys(revisions);
if(ids.length!==7)throw Error("V47 expected seven curated lessons");
const next={...prior};
for(const [id,blocks] of Object.entries(revisions)){
 const old=prior[id];if(!old||old.sourceAudit?.scientificApproval!==false)throw Error("V47 unknown/approved lesson "+id);
 for(const age of ages){const qs=blocks[age],want=age==="4-5"?2:3;
  if(!Array.isArray(qs)||qs.length!==want)throw Error("V47 bad count "+id+"/"+age);
  for(const q of qs)if(!q.prompt||!q.hint||!q.explain||q.type==="choice"&&(q.options?.length!==2||![0,1].includes(q.correct))||q.type==="text"&&!q.sample)throw Error("V47 invalid question "+id+"/"+age);
 }
 next[id]={...old,questions:{...old.questions,...blocks}};
}
window.DARKidsAcademyCurriculum=Object.freeze(next);
window.DARKidsAcademyCurriculumV47=Object.freeze({
 version:"20261014-v47",revisedSlots:[195,196,197,199,200,202,203],
 ids,questionCount:56,approvedAgeVersions:0,religiousSourcesVerified:false,voiceRecordingsApproved:false
});
})();
