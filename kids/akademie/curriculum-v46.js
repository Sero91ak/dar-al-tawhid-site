/* DĀR AL TAWḤĪD KIDS AKADEMI V46 · age-based quizzes for slots 183–194.
 * Fiqh slots 186 and 192 deliberately excluded pending specific source audit.
 * Draft-only questions; no independent religious approval, audio or deployment.
 */
(function(){
"use strict";
const prior=window.DARKidsAcademyCurriculum;
if(!prior||!window.DARKidsAcademyCurriculumV45)throw Error("V46 needs V45");
const c=(prompt,right,wrong,hint,explain,pos=0)=>({type:"choice",prompt,options:pos?[wrong,right]:[right,wrong],correct:pos,hint,explain});
const t=(prompt,sample,hint,explain)=>({type:"text",prompt,sample,hint,explain});
const revisions={
"akhlaq-hilfsbereitschaft-ohne-druck":{
"4-5":[
c("Jemand bittet dich, auf eine sehr hohe Mauer zu klettern. Was tust du?","Ich sage Nein und hole eine erwachsene Person.","Ich muss gefährlich klettern.","Deine Sicherheit zählt.","Mā schāʾ Allāh! Hilfe darf dich nicht gefährden."),
c("Darfst du bei einer gefährlichen Bitte Nein sagen?","Ja.","Nein, niemals.","Grenzen sind wichtig.","Allāhumma bārik! Du kannst Hilfe holen.",1)],
"6-8":[
c("Wozu ermutigt Qurʾān 5:2?","Zur Hilfe im Guten, nicht bei Übertretungen.","Dazu, bei gefährlichen Mutproben mitzumachen.","Achte auf gute Zusammenarbeit.","Mā schāʾ Allāh! Gute Hilfe ist sicher."),
c("Der Ball liegt auf einer hohen Mauer. Was ist am besten?","Abstand halten und einen Erwachsenen fragen.","Ohne Schutz hinaufsteigen.","Hilfe heißt nicht Selbstgefährdung.","Richtig! Du setzt eine sichere Grenze.",1),
t("Wie sagst du freundlich Nein zu einer gefährlichen Bitte?","Ich möchte helfen, aber das ist gefährlich. Ich hole eine erwachsene Person.","Eine klare Grenze reicht.","Allāhumma bārik! Du schützt dich.")],
"9-10":[
t("Welchen Gegensatz nennt Qurʾān 5:2?","Einander bei Gutem und Gottesfurcht unterstützen, nicht bei Sünde und Übertretung.","Nenne beide Seiten.","Mā schāʾ Allāh! Du kennst den Grundsatz."),
c("Welche Aussage ist falsch?","Ein Kind müsse jede verlangte Hilfe leisten, auch wenn es sich dabei verletzt.","Eine gefährliche Bitte darf abgelehnt werden.","Sicherheit gehört zur Hilfe.","Richtig! Niemand muss sich verletzen."),
t("Was ist aus dem Vers, was ist unser Schutzbeispiel?","Der Vers spricht von Zusammenarbeit im Guten; die hohe Mauer ist ein erfundenes Beispiel, das sicheres Nein-Sagen übt.","Quelle und Didaktik trennen.","Allāhumma bārik! Du unterscheidest sorgfältig.")]
},
"adab-beim-unterricht-aufmerksam":{
"4-5":[
c("Jemand liest Qurʾān. Was ist passend?","Ich höre aufmerksam zu.","Ich rufe absichtlich dazwischen.","Denke an den gelesenen Vers.","Mā schāʾ Allāh! Du hörst zu."),
c("Du hast nach dem Lesen eine Frage. Was kannst du machen?","Freundlich fragen.","Das lesende Kind verspotten.","Fragen sind erlaubt.","Allāhumma bārik! Du wartest ab.",1)],
"6-8":[
c("Was fordert Qurʾān 7:204 beim Vortragen des Qurʾān?","Zuhören und still sein.","Andere absichtlich unterbrechen.","Achte auf den konkreten Anlass.","Mā schāʾ Allāh! Wir achten den Qurʾān."),
c("Wir hören im Unterricht einen normalen deutschen Erklärungssatz. Welche Gewohnheit ist freundlich?","Nicht unterbrechen und danach fragen.","Andere ausschreien.","Dies ist unsere Unterrichtsübung.","Richtig! Rücksicht hilft beim Lernen.",1),
t("Formuliere eine Frage nach dem Zuhören.","Darf ich fragen, was dieses Wort bedeutet?","Höflich und kurz.","Allāhumma bārik! Das ist gute Lernhaltung.")],
"9-10":[
t("Für welche Situation gilt die Aussage in Qurʾān 7:204 ausdrücklich?","Wenn der Qurʾān vorgetragen wird, sollen die Zuhörenden aufmerksam sein und schweigen.","Nenne den Anlass des Verses.","Mā schāʾ Allāh! Du unterscheidest den Rahmen."),
c("Was wäre eine ungerechtfertigte Verallgemeinerung?","Der Vers verbiete einem Kind in jedem Unterricht jede Nachfrage.","Aufmerksames Zuhören ist wichtig.","Fragen im Unterricht bleiben möglich.","Richtig! Man darf die Aussage nicht überdehnen."),
t("Wieso ist das Warten bei einem deutschen Erklärungssatz nur eine gute Gewohnheit?","Qurʾān 7:204 spricht ausdrücklich von Qurʾān-Vortrag; die ruhige Klassenregel ist eine eigene didaktische Übertragung.","Vers und Regel unterscheiden.","Allāhumma bārik! Das ist präzise.")]
},
"nafs-schuldgefuehle-ohne-angstbilder":{
"4-5":[
c("Du hast einen Fehler gemacht und fühlst dich bedrückt. Was hilft?","Mit einer vertrauten erwachsenen Person sprechen.","Den Fehler für immer allein verstecken.","Hilfe darf man holen.","Mā schāʾ Allāh! Du kannst darüber reden."),
c("Ist nach einem Fehler jede Hoffnung verloren?","Nein.","Ja.","Allahs Barmherzigkeit ist wichtig.","Allāhumma bārik! Ein Neubeginn ist möglich.",1)],
"6-8":[
c("Wozu ruft Qurʾān 39:53 auf?","Nicht an Allahs Barmherzigkeit zu verzweifeln.","Kinder mit Angstbildern zu erschrecken.","Denke an die Barmherzigkeit.","Mā schāʾ Allāh! Der Vers schenkt Hoffnung."),
c("Ein Kind hat gelogen und hat Angst, es zu sagen. Was ist ein guter Schritt?","Einer vertrauten erwachsenen Person die Wahrheit sagen und Hilfe annehmen.","Immer weiter lügen, weil es nun sowieso zu spät sei.","Wahrheit und Hilfe gehören zusammen.","Richtig! Das Kind muss nicht allein bleiben.",1),
t("Wie könnte ein freundlicher Satz nach einem Fehler lauten?","Ich habe etwas Falsches gesagt. Bitte hilf mir, es wieder gutzumachen.","Der Satz soll Hilfe ermöglichen.","Allāhumma bārik! Du übernimmst Verantwortung.")],
"9-10":[
t("Welche Hoffnung vermittelt Qurʾān 39:53?","Menschen sollen nicht an Allahs Barmherzigkeit verzweifeln.","Nenne die Kernbotschaft.","Mā schāʾ Allāh! Du beachtest die Ermutigung."),
c("Welche Deutung wäre pädagogisch gefährlich?","Ein Kind müsse wegen jedes Fehlers allein bleiben und dürfe keine Hilfe suchen.","Ein Kind kann einen Fehler zugeben und Hilfe bekommen.","Kinderschutz bleibt wichtig.","Richtig! Niemand wird isoliert."),
t("Wie unterscheidest du den Vers von der Hilfsregel?","Der Vers spricht von Allahs Barmherzigkeit; die Ansprache einer vertrauenswürdigen erwachsenen Person ist unsere zusätzliche Schutzübung.","Quelle und Schutzidee trennen.","Allāhumma bārik! Du erkennst die Ebenen.")]
},
"tawhid-vertrauen-und-bemuehen":{
"4-5":[
c("Du lernst ein schweres Wort. Was kannst du machen?","Üben und Allah um Hilfe bitten.","Jedes Lernen sofort aufgeben.","Tu, was du kannst.","Mā schāʾ Allāh! Du bleibst dran."),
c("Wenn du es noch nicht schaffst, darfst du Unterstützung holen?","Ja.","Nein.","Gemeinsam lernen ist gut.","Allāhumma bārik! Du fragst.",1)],
"6-8":[
c("Was nennt Qurʾān 2:45 als Hilfen?","Geduld und Gebet.","Andere zu beschuldigen.","Denk an den Vers.","Mā schāʾ Allāh! Geduld und Gebet werden genannt."),
c("Ein Wort gelingt nicht. Was macht das Kind im Beispiel?","Es übt geduldig und bittet Allah um Hilfe.","Es überspringt jede Übung.","Anstrengung und Bitte passen zusammen.","Richtig! Du kannst erneut üben.",1),
t("Nenne einen Plan zum Lernen eines schwierigen Wortes.","Ich lese langsam, wiederhole und frage bei Bedarf, während ich Allah um Hilfe bitte.","Ein erreichbarer Plan reicht.","Allāhumma bārik! Das ist gut durchdacht.")],
"9-10":[
t("Welche zwei Hilfen enthält Qurʾān 2:45 ausdrücklich?","Geduld und Gebet.","Beide Worte aus dem Vers nennen.","Mā schāʾ Allāh! Du kennst den Beleg."),
c("Welche Behauptung ist aus diesem Vers nicht abzuleiten?","Jedes Gebet garantiert eine sofortige perfekte Schulnote.","Wir dürfen Allah im Gebet um Hilfe bitten.","Kein Schulnotensystem steht im Vers.","Richtig! Kein falsches Versprechen."),
t("Wie kannst du tawakkul und eigenes Bemühen in der Übung verbinden?","Ich tue meinen Teil beim Lernen und vertraue dabei auf Allah, statt untätig zu bleiben.","Anwendung und Vers unterscheiden.","Allāhumma bārik! Das ist ausgewogen.")]
},
"iman-fragen-stellen":{
"4-5":[
c("Du verstehst ein Glaubenswort nicht. Was darfst du tun?","Fragen.","Dich dafür schämen.","Fragen ist erlaubt.","Mā schāʾ Allāh! Gute Fragen helfen."),
c("Wen kannst du fragen?","Eine vertrauenswürdige, kundige Lehrperson.","Jemanden, der einfach etwas erfindet.","Wissen ist wichtig.","Allāhumma bārik! Du suchst Erklärung.",1)],
"6-8":[
c("Welche Aufforderung enthält Qurʾān 21:7?","Fragt die Wissenden, wenn ihr nicht wisst.","Erfindet Antworten, wenn ihr nicht wisst.","Achte auf den Vers.","Mā schāʾ Allāh! Wissen darf man erfragen."),
c("Die Antwort ist unklar. Was ist richtig?","Freundlich nachfragen oder warten, bis sie geprüft ist.","So tun, als wüsstest du alles.","Geduld beim Lernen.","Richtig! Du darfst nachfragen.",1),
t("Formuliere eine höfliche Frage zu einem unbekannten Wort.","Kannst du mir erklären, was dieses Wort bedeutet?","Ein kurzer Satz genügt.","Allāhumma bārik! Das ist respektvoll.")],
"9-10":[
t("In welchem Zusammenhang enthält Qurʾān 21:7 die Aufforderung zum Fragen?","Der Vers spricht über frühere Gesandte und fordert zum Fragen der Leute des Wissens auf, wenn man etwas nicht weiß.","Nenne den Kontext.","Mā schāʾ Allāh! Du beachtest das Umfeld."),
c("Welche Folgerung wäre falsch?","Jede beliebige ungeprüfte Antwort sei automatisch richtig.","Man darf Wissen bei geeigneten Menschen suchen.","Fragen allein bestätigt keine falsche Aussage.","Richtig! Die Antwort braucht Sachkenntnis."),
t("Wie gehst du mit zwei widersprüchlichen Erklärungen um?","Ich frage ruhig nach ihren Belegen und lasse eine sachkundige Person die Frage klären.","Kein Streit nötig.","Allāhumma bārik! Du suchst verlässliches Wissen.")]
},
"akhlaq-mut-zur-wahrheit":{
"4-5":[
c("Du hast einen Stift genommen. Was ist mutig und richtig?","Ich sage die Wahrheit.","Ich gebe einem anderen Kind die Schuld.","Ehrlich bleiben.","Mā schāʾ Allāh! Du sagst die Wahrheit."),
c("Kannst du die Wahrheit höflich sagen?","Ja.","Nein, man muss schreien.","Freundliche Worte helfen.","Allāhumma bārik! Du bleibst ruhig.",1)],
"6-8":[
c("Was fordert Qurʾān 33:70?","Allah zu fürchten und richtige, aufrichtige Worte zu sprechen.","Andere mit Lügen zu beschuldigen.","Denke an gerades Sprechen.","Mā schāʾ Allāh! Der Vers ruft zu guten Worten auf."),
c("Du bemerkst deinen eigenen Fehler. Was passt?","Du gibst ihn ruhig zu und bittest um Hilfe zur Wiedergutmachung.","Du beschuldigst absichtlich eine andere Person.","Wahrheit ohne Beschämung.","Richtig! Das ist verantwortungsvoll.",1),
t("Sage einen höflichen wahren Satz nach einem kleinen Fehler.","Ich habe den Stift genommen, das war nicht richtig. Es tut mir leid.","Sei ehrlich und ruhig.","Allāhumma bārik! Das ist aufrichtig.")],
"9-10":[
t("Welche Aufforderungen verbindet Qurʾān 33:70?","Gottesfurcht und das Sprechen eines geraden, zutreffenden Wortes.","Beide Teile nennen.","Mā schāʾ Allāh! Du erkennst die Forderung."),
c("Welche Unterrichtsweise wäre problematisch?","Ein Kind vor allen öffentlich vorführen, um ein Geständnis zu erzwingen.","Ein Kind ruhig zum ehrlichen Gespräch einladen.","Wahrheit ist kein Vorwand für Bloßstellung.","Richtig! Ehrlichkeit und Würde gehören zusammen."),
t("Wie übst du Mut zur Wahrheit und bleibst dabei freundlich?","Ich beschreibe ehrlich, was ich getan habe, und biete Wiedergutmachung an, ohne andere zu beschuldigen.","Wahr, konkret, ohne Anschuldigung.","Allāhumma bārik! Das ist verantwortungsvoll.")]
},
"adab-aeltere-respektvoll":{
"4-5":[
c("Großmutter stellt dir eine Frage. Wie antwortest du?","Freundlich.","Mit einem bösen Wort.","Achte auf guten Umgang.","Mā schāʾ Allāh! Du sprichst respektvoll."),
c("Darfst du sagen, wenn du etwas nicht verstanden hast?","Ja, freundlich.","Nein, niemals.","Respekt und Fragen passen zusammen.","Allāhumma bārik! Du darfst nachfragen.",1)],
"6-8":[
c("Was lehrt Qurʾān 17:23 ausdrücklich über die Eltern, besonders im Alter?","Freundlich zu ihnen zu sein und sie nicht anzufahren.","Sie absichtlich herabzusetzen.","Achte auf die Eltern im Vers.","Mā schāʾ Allāh! Eltern verdienen guten Umgang."),
c("Wie können wir anderen älteren Menschen respektvoll begegnen?","Freundlich sprechen und bei Bedarf helfen.","Sie wegen Langsamkeit auslachen.","Respekt im Alltag.","Richtig! Du zeigst Rücksicht.",1),
t("Formuliere eine höfliche Antwort auf eine Frage deiner Großmutter.","Gern, ich erkläre es dir. Einen Moment bitte.","Ruhig und freundlich.","Allāhumma bārik! Das ist liebevoll.")],
"9-10":[
t("Welche konkrete Verhaltensregel nennt Qurʾān 17:23 gegenüber alten Eltern?","Nicht einmal ungeduldig 'Uff' sagen oder sie anfauchen; stattdessen respektvoll sprechen.","Nenne die konkrete Mahnung.","Mā schāʾ Allāh! Du bleibst beim Text."),
c("Welche Behauptung wäre zu pauschal?","Respekt vor Eltern bedeute, dass ein Kind bei Gefahr keine Hilfe holen dürfe.","Mit Eltern freundlich sprechen.","Schutz und Achtung sind vereinbar.","Richtig! Kinderschutz bleibt bestehen."),
t("Wie unterscheiden sich Versanweisung und unser Großmutterbeispiel?","Der Vers spricht besonders von den Eltern; die freundliche Antwort an die Großmutter ist eine weitere Umgangsübung.","Original und Anwendung trennen.","Allāhumma bārik! Du differenzierst.")]
},
"nafs-istighfar":{
"4-5":[
c("Wen bitten wir um Vergebung?","Allah.","Unser Spielzeug.","Denke an die Vergebung.","Mā schāʾ Allāh! Wir wenden uns an Allah."),
c("Musst du eine von uns erfundene Zahl an Wiederholungen erreichen?","Nein.","Ja, unbedingt.","Wir erfinden keine Vorschrift.","Allāhumma bārik! Du darfst aufrichtig bitten.",1)],
"6-8":[
c("Wozu ruft Qurʾān 71:10 auf?","Den Herrn um Vergebung zu bitten.","Eine Strafe für jedes Versprechen auszudenken.","Denke an istighfār.","Mā schāʾ Allāh! Allahs Vergebung erbitten ist wichtig."),
c("Was wäre eine gute Bitte in eigenen Worten?","O Allah, vergib mir.","Ich verlange, dass alle anderen schuld sind.","Aufrichtig und einfach.","Richtig! Du darfst Allah bitten.",1),
t("Erkläre das Wort Istighfār.","Das bedeutet, Allah um Vergebung zu bitten.","Ein kurzer Satz genügt.","Allāhumma bārik! Du kannst es erklären.")],
"9-10":[
t("Welche Aufforderung steht in Qurʾān 71:10?","Bittet euren Herrn um Vergebung, denn Er ist vergebend.","Nenne den Versinhalt.","Mā schāʾ Allāh! Du kennst den Beleg."),
c("Welche Zahl lässt sich aus diesem Vers allein verbindlich ableiten?","Keine konkrete Wiederholungszahl.","Eine beliebige erfundene Zahl als Pflicht.","Achte auf die Beleggrenze.","Richtig! Eine genaue Zahl braucht einen eigenen Nachweis."),
t("Worin besteht der Unterschied zwischen Vers und Übung?","Der Vers ruft zum Istighfār auf; unser einzelnes deutsches Beispiel ist keine vorgeschriebene feste Formel.","Quelle und didaktische Übung trennen.","Allāhumma bārik! Das ist quellentreu.")]
},
"tawhid-mit-eigenen-worten":{
"4-5":[
c("Wie ist Allah?","Allah ist Einer.","Allah ist wie ein gemalter Gegenstand.","Denk an Sūrat al-Iḫlāṣ.","Mā schāʾ Allāh! Allah ist Einer."),
c("Müssen wir Allah malen, um zu lernen?","Nein.","Ja.","Wir erklären mit Worten.","Allāhumma bārik! Du kannst den Sinn sagen.",1)],
"6-8":[
c("Was lehrt Sūrat al-Iḫlāṣ?","Allah ist Einer, und niemand ist Ihm gleich.","Allah ist ein Geschöpf.","Achte auf die vier Verse.","Mā schāʾ Allāh! Tawḥīd ist klar."),
c("Du sollst einem jüngeren Kind Tawḥīd erklären. Was passt?","Allah allein ist Gott, nichts Erschaffenes ist Ihm gleich.","Alle Gegenstände seien andere Götter.","Sprich einfach und respektvoll.","Richtig! Das ist verständlich.",1),
t("Formuliere einen kurzen eigenen deutschen Satz über Allahs Einzigkeit.","Allah ist Einer und niemand ist Ihm gleich.","Bleibe beim Sinn der Sūrah.","Allāhumma bārik! Du hast es verstanden.")],
"9-10":[
t("Welche Lehren nennt Qurʾān 112:1–4 über Allah?","Allah ist Einer; niemand ist Ihm gleich; Er zeugt nicht und wurde nicht gezeugt.","Nenne die Kernaussagen.","Mā schāʾ Allāh! Du gibst den Sinn wieder."),
c("Welcher Satz würde der Quelle widersprechen?","Allah sei einem erschaffenen Wesen völlig gleich.","Allah ist einzigartig.","Keine Gleichsetzung mit Geschöpfen.","Richtig! Das lehnt die Sūrah ab."),
t("Wie erklärt man den Vers in eigenen Worten, ohne den arabischen Wortlaut zu verändern?","Ich sage auf Deutsch, dass Allah einzig und unvergleichlich ist, und kennzeichne das als Erklärung.","Original und Paraphrase unterscheiden.","Allāhumma bārik! Das ist akkurat.")]
},
"iman-sechs-glaubenssaeulen":{
"4-5":[
c("Was nennt Qurʾān 2:285?","Glauben an Allah und Seine Engel.","Eine erfundene Prophetengeschichte.","Denke an den Vers.","Mā schāʾ Allāh! Die Engel werden genannt."),
c("Gehören Allahs Gesandte zum Glauben?","Ja.","Nein.","Die Gesandten stehen im Vers.","Allāhumma bārik! Das hast du erkannt.",1)],
"6-8":[
c("Welche vier Glaubensinhalte nennt Qurʾān 2:285 ausdrücklich?","Allah, Engel, Bücher und Gesandte.","Nur vier Namen von erfundenen Städten.","Achte auf den Vers.","Mā schāʾ Allāh! Du kennst die vier Begriffe."),
c("Darf man so tun, als hätte die Stelle selbst bereits alle sechs Säulen namentlich aufgelistet?","Nein, die fehlenden zwei erfordern einen weiteren Beleg.","Ja, ohne weitere Quelle.","Vers und vollständige Lehrliste unterscheiden.","Richtig! Wir fügen dem Vers nichts hinzu.",1),
t("Nenne zwei der im Vers erwähnten Glaubensinhalte.","Der Glaube an Allah und Seine Engel.","Zwei genügen.","Allāhumma bārik! Du erinnerst dich.")],
"9-10":[
t("Welche Glaubensinhalte nennt der gelesene Wortlaut von Qurʾān 2:285?","Glauben an Allah, Seine Engel, Seine Bücher und Seine Gesandten.","Nenne die vier ausdrücklich vorkommenden.","Mā schāʾ Allāh! Du bleibst exakt beim Text."),
c("Welche Begründung wäre quellenkritisch ungenau?","Alle sechs Säulen einschließlich al-Qadar würden in diesem einzelnen Vers vollständig aufgezählt.","Der Vers nennt vier ausdrücklich gelesene Begriffe.","Für die vollständige Sechserliste ist eine weitere Quelle nötig.","Richtig! Wir unterscheiden Unterrichtsliste und Vers."),
t("Wie würdest du die vollständige Sechserliste wissenschaftlich sauber weiterlernen?","Ich lerne die vier Inhalte aus 2:285 und suche für die weiteren Inhalte geprüfte Qurʾān- und authentische Sunnah-Belege, statt sie in diesen Vers hineinzulesen.","Prüfen statt ergänzen.","Allāhumma bārik! Das ist gewissenhaft.")]
}
};
const ages=["4-5","6-8","9-10"],ids=Object.keys(revisions);
if(ids.length!==10)throw Error("V46 expects 10 unique lesson quizzes");
const next={...prior};
for(const [id,blocks] of Object.entries(revisions)){
 const old=prior[id];if(!old||old.sourceAudit?.scientificApproval!==false)throw Error("V46 unknown/approved "+id);
 for(const age of ages){const qs=blocks[age],wanted=age==="4-5"?2:3;
  if(!Array.isArray(qs)||qs.length!==wanted)throw Error("V46 invalid count "+id+"/"+age);
  for(const q of qs)if(!q.prompt||!q.hint||!q.explain||q.type==="choice"&&(q.options?.length!==2||![0,1].includes(q.correct))||q.type==="text"&&!q.sample)throw Error("V46 invalid question "+id+"/"+age);
 }
 next[id]={...old,questions:{...old.questions,...blocks}};
}
window.DARKidsAcademyCurriculum=Object.freeze(next);
window.DARKidsAcademyCurriculumV46=Object.freeze({
 version:"20261014-v46",revisedSlots:[183,184,185,187,188,189,190,191,193,194],
 ids,questionCount:80,approvedAgeVersions:0,religiousSourcesVerified:false,voiceRecordingsApproved:false
});
})();
