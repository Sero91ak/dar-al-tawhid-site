/* DĀR AL TAWḤĪD KIDS · Vertiefungskatalog V2 (22 thematisch eigenständige Übungseinheiten).
 * Qurʾān- und Ḥadīṯ-Belege werden ausschließlich von den geprüften V1-Grundlagen
 * übernommen. Die hier ausgearbeiteten Alltagssituationen sind didaktische
 * Anwendungen, keine zusätzlichen religiösen Originalzitate.
 * Texte sind als Audioproduktionsvorlage verfügbar, ohne eine Aufnahme vorzutäuschen.
 */
(()=>{
 "use strict";
 const previous=window.DARKidsAcademyCurriculum;
 if(!previous || !previous["akhlaq-sabr"] || !previous["aqidah-ikhlas"])return;
 const modules=[
 {
  "id": "akhlaq-sabr-geduldig-warten",
  "sourceId": "akhlaq-sabr",
  "topic": "Geduldig warten",
  "title": "Geduldig warten · Warten ohne Streit",
  "lead": "Ich lerne ruhig zu bleiben, wenn ich warten muss.",
  "goal": "Ich kann warten, ohne andere anzuschreien.",
  "lines": [
   "Manchmal bin ich noch nicht an der Reihe.",
   "Ich darf sagen, dass mir Warten schwerfällt.",
   "Ich bleibe freundlich und versuche es erneut.",
   "Geduld üben wir jeden Tag."
  ],
  "prompt": "Du wartest auf dein Spielzeug.",
  "right": "Ich warte ruhig und frage freundlich.",
  "wrong": "Ich reiße es einem anderen Kind weg."
 },
 {
  "id": "akhlaq-sabr-nicht-aufgeben",
  "sourceId": "akhlaq-sabr",
  "topic": "Nicht aufgeben",
  "title": "Nicht aufgeben · Geduld beim Üben",
  "lead": "Auch schwierige Dinge darf ich Schritt für Schritt lernen.",
  "goal": "Ich kann bei einem Fehler erneut üben.",
  "lines": [
   "Nicht alles klappt beim ersten Versuch.",
   "Ein Fehler ist eine Gelegenheit zu lernen.",
   "Ich darf um Hilfe bitten.",
   "Dann versuche ich es noch einmal."
  ],
  "prompt": "Eine Aufgabe klappt beim ersten Mal nicht.",
  "right": "Ich bitte um Hilfe und probiere es erneut.",
  "wrong": "Ich werfe alles wütend weg."
 },
 {
  "id": "akhlaq-amanah-geliehene-dinge",
  "sourceId": "akhlaq-amanah",
  "topic": "Geliehene Dinge",
  "title": "Geliehene Dinge · Amānah im Alltag",
  "lead": "Anvertraute Sachen behandle ich sorgfältig.",
  "goal": "Ich gebe Geliehenes verlässlich zurück.",
  "lines": [
   "Eine Sache gehört manchmal jemand anderem.",
   "Ich frage, bevor ich sie benutze.",
   "Ich achte darauf, dass sie heil bleibt.",
   "Ich gebe sie wie vereinbart zurück."
  ],
  "prompt": "Du bekommst ein Buch ausgeliehen.",
  "right": "Ich behandle es sorgfältig und gebe es zurück.",
  "wrong": "Ich behalte es heimlich."
 },
 {
  "id": "akhlaq-amanah-mein-versprechen",
  "sourceId": "akhlaq-amanah",
  "topic": "Mein Versprechen",
  "title": "Mein Versprechen · Zuverlässig sein",
  "lead": "Ich überlege gut, bevor ich etwas verspreche.",
  "goal": "Ich bemühe mich, Zusagen einzuhalten.",
  "lines": [
   "Andere Menschen verlassen sich auf mein Wort.",
   "Deshalb verspreche ich nichts leichtfertig.",
   "Wenn etwas nicht klappt, sage ich es ehrlich.",
   "So lernen wir, zuverlässig zu sein."
  ],
  "prompt": "Du hast versprochen, beim Aufräumen zu helfen.",
  "right": "Ich halte meine Zusage oder erkläre ehrlich ein Problem.",
  "wrong": "Ich tue so, als hätte ich nie etwas gesagt."
 },
 {
  "id": "adab-salam-salam-erwidern",
  "sourceId": "adab-salam",
  "topic": "Salām erwidern",
  "title": "Salām erwidern · Freundlich antworten",
  "lead": "Auf einen Gruß antworte ich freundlich.",
  "goal": "Ich übe eine gute Antwort auf den Salām.",
  "lines": [
   "Jemand sagt freundlich Salām zu mir.",
   "Ich höre zu und antworte freundlich.",
   "Der Friedensgruß verbindet uns.",
   "Wir grüßen ohne Spott."
  ],
  "prompt": "Jemand grüßt dich mit Salām.",
  "right": "Ich antworte freundlich mit Salām.",
  "wrong": "Ich mache mich über den Gruß lustig."
 },
 {
  "id": "adab-salam-zuerst-gru-en",
  "sourceId": "adab-salam",
  "topic": "Zuerst grüßen",
  "title": "Zuerst grüßen · Frieden verbreiten",
  "lead": "Mit einem freundlichen Gruß kann ich beginnen.",
  "goal": "Ich grüße Menschen höflich.",
  "lines": [
   "Ein Gruß kann Freude schenken.",
   "Ich beginne freundlich, wenn es passt.",
   "Ich spreche den Gruß deutlich.",
   "Danach höre ich aufmerksam zu."
  ],
  "prompt": "Du triffst eine bekannte Person.",
  "right": "Ich begrüße sie freundlich.",
  "wrong": "Ich beleidige sie zur Begrüßung."
 },
 {
  "id": "adab-worte-bei-streit-sprechen",
  "sourceId": "adab-worte",
  "topic": "Bei Streit sprechen",
  "title": "Bei Streit sprechen · Freundliche Worte",
  "lead": "Auch wenn ich verärgert bin, wähle ich gute Worte.",
  "goal": "Ich spreche ohne Beleidigungen.",
  "lines": [
   "Manchmal sind zwei Menschen anderer Meinung.",
   "Ich darf ruhig sagen, was ich denke.",
   "Ich muss niemanden beleidigen.",
   "Gute Worte helfen uns, wieder zuzuhören."
  ],
  "prompt": "Du bist mit einem Freund uneinig.",
  "right": "Ich sage ruhig, was ich meine.",
  "wrong": "Ich beschimpfe meinen Freund."
 },
 {
  "id": "adab-worte-erst-nachdenken",
  "sourceId": "adab-worte",
  "topic": "Erst nachdenken",
  "title": "Erst nachdenken · Schön sprechen",
  "lead": "Vor dem Sprechen überlege ich, ob meine Worte gut sind.",
  "goal": "Ich lerne, unnötige verletzende Worte zu vermeiden.",
  "lines": [
   "Worte können trösten oder verletzen.",
   "Ich denke vor dem Sprechen nach.",
   "Ich sage etwas Gutes, wenn ich kann.",
   "Sonst darf ich erst einmal schweigen."
  ],
  "prompt": "Dir fällt ein gemeiner Satz ein.",
  "right": "Ich denke nach und sage etwas Freundliches.",
  "wrong": "Ich verletze jemanden absichtlich."
 },
 {
  "id": "adab-respekt-eltern-zuhoren",
  "sourceId": "adab-respekt",
  "topic": "Eltern zuhören",
  "title": "Eltern zuhören · Mit Respekt sprechen",
  "lead": "Ich übe, meinen Eltern freundlich zu antworten.",
  "goal": "Ich antworte respektvoll, auch wenn ich müde bin.",
  "lines": [
   "Manchmal bitten mich meine Eltern um etwas.",
   "Ich höre aufmerksam zu.",
   "Ich spreche freundlich und ehrlich.",
   "Wenn ich Hilfe brauche, bitte ich darum."
  ],
  "prompt": "Dein Vater bittet dich um Hilfe.",
  "right": "Ich antworte freundlich und höre zu.",
  "wrong": "Ich schreie ihn absichtlich an."
 },
 {
  "id": "adab-respekt-hilfsbereit-sein",
  "sourceId": "adab-respekt",
  "topic": "Hilfsbereit sein",
  "title": "Hilfsbereit sein · Für andere da sein",
  "lead": "In der Familie kann ich mit kleinen Dingen helfen.",
  "goal": "Ich bemerke, wenn jemand Unterstützung braucht.",
  "lines": [
   "Es gibt viele kleine Aufgaben zu Hause.",
   "Ich kann fragen, ob ich helfen darf.",
   "Freundliche Worte sind dabei wichtig.",
   "So zeigen wir Fürsorge im Alltag."
  ],
  "prompt": "Deine Mutter trägt mehrere leichte Sachen.",
  "right": "Ich frage freundlich, ob ich helfen kann.",
  "wrong": "Ich lache sie aus."
 },
 {
  "id": "fiqh-taharah-saubere-kleidung",
  "sourceId": "fiqh-taharah",
  "topic": "Saubere Kleidung",
  "title": "Saubere Kleidung · Reinheit beachten",
  "lead": "Für den Alltag und das Gebet achte ich auf Sauberkeit.",
  "goal": "Ich lerne, warum saubere Kleidung wichtig ist.",
  "lines": [
   "Meine Kleidung soll sauber sein.",
   "Wenn etwas schmutzig ist, melde ich es.",
   "Ich bitte bei Bedarf um Hilfe.",
   "Sauberkeit ist etwas Gutes."
  ],
  "prompt": "Du bemerkst Schmutz an deinem Ärmel.",
  "right": "Ich sage es und reinige ihn, wenn es möglich ist.",
  "wrong": "Ich verteile den Schmutz absichtlich."
 },
 {
  "id": "fiqh-taharah-sauberer-lernplatz",
  "sourceId": "fiqh-taharah",
  "topic": "Sauberer Lernplatz",
  "title": "Sauberer Lernplatz · Ordnung und Reinheit",
  "lead": "Ich halte meinen Platz so sauber, wie ich kann.",
  "goal": "Ich übe sorgsamen Umgang mit meiner Umgebung.",
  "lines": [
   "Nach dem Spielen liegen manchmal Sachen herum.",
   "Ich räume meinen Platz auf.",
   "Ich achte auf Sauberkeit.",
   "Dabei kann ich um Hilfe bitten."
  ],
  "prompt": "Nach dem Basteln liegen Papierschnipsel herum.",
  "right": "Ich helfe beim Aufräumen.",
  "wrong": "Ich werfe noch mehr auf den Boden."
 },
 {
  "id": "fiqh-wudu-gesicht-und-arme",
  "sourceId": "fiqh-wudu",
  "topic": "Gesicht und Arme",
  "title": "Gesicht und Arme · Wuḍūʾ kennenlernen",
  "lead": "Der Qurʾān nennt Glieder der Gebetswaschung.",
  "goal": "Ich erkenne Gesicht und Arme als Teile des Wuḍūʾ.",
  "lines": [
   "Vor dem Gebet lernen wir Wuḍūʾ.",
   "Der Qurʾān nennt das Gesicht.",
   "Er nennt auch die Arme.",
   "Wir lernen die Handlung Schritt für Schritt."
  ],
  "prompt": "Welches Körperteil wird in Qurʾān 5:6 ausdrücklich erwähnt?",
  "right": "Das Gesicht gehört zum Wuḍūʾ.",
  "wrong": "Die Haare müssen abgeschnitten werden."
 },
 {
  "id": "fiqh-wudu-kopf-und-fu-e",
  "sourceId": "fiqh-wudu",
  "topic": "Kopf und Füße",
  "title": "Kopf und Füße · Wuḍūʾ verstehen",
  "lead": "Ich höre aufmerksam zu, welche Glieder genannt werden.",
  "goal": "Ich erkenne das Streichen über den Kopf.",
  "lines": [
   "Im Qurʾān wird auch der Kopf genannt.",
   "Wir lernen das Streichen über den Kopf.",
   "Wir lernen außerdem die Reinigung der Füße.",
   "Praktische Übungen machen wir mit Anleitung."
  ],
  "prompt": "Was gehört laut Qurʾān 5:6 zur Gebetswaschung?",
  "right": "Über den Kopf streichen.",
  "wrong": "Den Kopf mit Seife schrubben."
 },
 {
  "id": "fiqh-salah-allah-gedenken",
  "sourceId": "fiqh-salah",
  "topic": "Allah gedenken",
  "title": "Allah gedenken · Warum wir beten",
  "lead": "Im Gebet wenden wir uns Allah zu.",
  "goal": "Ich verstehe, warum das Gebet wichtig ist.",
  "lines": [
   "Wir lernen das Gebet langsam.",
   "Im Gebet gedenken wir Allahs.",
   "Der Prophet ﷺ zeigte uns das Gebet.",
   "Wir üben die Schritte mit Anleitung."
  ],
  "prompt": "Woran denken wir im Gebet?",
  "right": "Wir gedenken Allahs.",
  "wrong": "Wir beten nur zum Zeitvertreib."
 },
 {
  "id": "fiqh-salah-gebet-lernen",
  "sourceId": "fiqh-salah",
  "topic": "Gebet lernen",
  "title": "Gebet lernen · Vom Propheten lernen",
  "lead": "Wir lernen das Gebet nach der Sunnah.",
  "goal": "Ich übe das Gebet Schritt für Schritt.",
  "lines": [
   "Der Prophet ﷺ zeigte das Gebet.",
   "Wir schauen uns seine Lehre an.",
   "Wir üben die Bewegungen mit Begleitung.",
   "Wenn etwas schwerfällt, üben wir weiter."
  ],
  "prompt": "Woher lernen wir die Gebetspraxis?",
  "right": "Aus der authentischen Sunnah des Propheten ﷺ.",
  "wrong": "Wir erfinden die Gebetsschritte selbst."
 },
 {
  "id": "aqidah-tawhid-allah-ist-einer",
  "sourceId": "aqidah-tawhid",
  "topic": "Allah ist Einer",
  "title": "Allah ist Einer · Tawḥīd verstehen",
  "lead": "Sūrat al-Ikhlāṣ lehrt uns, dass Allah Einer ist.",
  "goal": "Ich lerne, dass nur Allah angebetet wird.",
  "lines": [
   "Allah ist Einer.",
   "Wir beten Allah allein an.",
   "Wir gesellen Ihm nichts bei.",
   "Das nennen wir Tawḥīd."
  ],
  "prompt": "Wer allein wird angebetet?",
  "right": "Allah allein.",
  "wrong": "Wir beten beliebige Dinge an."
 },
 {
  "id": "aqidah-tawhid-nur-allah-anbeten",
  "sourceId": "aqidah-tawhid",
  "topic": "Nur Allah anbeten",
  "title": "Nur Allah anbeten · Allahs Recht",
  "lead": "Die Anbetung gehört Allah allein.",
  "goal": "Ich erkenne die Bedeutung des Tawḥīd im Gebet.",
  "lines": [
   "Wir wenden uns im Gebet an Allah.",
   "Niemand hat das Recht, neben Ihm angebetet zu werden.",
   "Der Prophet ﷺ lehrte uns Allahs Recht.",
   "Wir lernen Tawḥīd mit Qurʾān und Sunnah."
  ],
  "prompt": "Wem gilt unsere Anbetung?",
  "right": "Allah allein.",
  "wrong": "Einem geschaffenen Gegenstand."
 },
 {
  "id": "aqidah-iman-die-engel",
  "sourceId": "aqidah-iman",
  "topic": "Die Engel",
  "title": "Die Engel · Grundlagen des Īmān",
  "lead": "Der Prophet ﷺ nannte den Glauben an die Engel.",
  "goal": "Ich kann die Engel als einen Bestandteil des Īmān nennen.",
  "lines": [
   "Īmān bedeutet Glaube.",
   "Der Prophet ﷺ erklärte seine Grundlagen.",
   "Dazu gehört der Glaube an Allahs Engel.",
   "Wir lernen die Grundlagen Schritt für Schritt."
  ],
  "prompt": "Was gehört zu den Grundlagen des Īmān?",
  "right": "Der Glaube an die Engel.",
  "wrong": "Der Glaube nur an Spielzeug."
 },
 {
  "id": "aqidah-iman-die-gesandten",
  "sourceId": "aqidah-iman",
  "topic": "Die Gesandten",
  "title": "Die Gesandten · Glaube an Gesandte",
  "lead": "Zum Īmān gehört der Glaube an Allahs Gesandte.",
  "goal": "Ich kenne einen weiteren Bestandteil des Īmān.",
  "lines": [
   "Allah sandte Gesandte.",
   "Der Glaube an sie gehört zum Īmān.",
   "Wir hören auf die Botschaft des Propheten ﷺ.",
   "Dabei lernen wir aus Qurʾān und Sunnah."
  ],
  "prompt": "Was gehört zum Īmān?",
  "right": "Der Glaube an Allahs Gesandte.",
  "wrong": "Nur die eigenen Wünsche entscheiden."
 },
 {
  "id": "aqidah-ikhlas-gutes-ohne-lob",
  "sourceId": "aqidah-ikhlas",
  "topic": "Gutes ohne Lob",
  "title": "Gutes ohne Lob · Aufrichtig helfen",
  "lead": "Gute Taten sollen nicht nur dem Lob anderer dienen.",
  "goal": "Ich helfe mit guter Absicht.",
  "lines": [
   "Jemand braucht vielleicht Hilfe.",
   "Ich helfe nicht nur, damit alle mich loben.",
   "Allah kennt meine Absicht.",
   "Ich bemühe mich um Aufrichtigkeit."
  ],
  "prompt": "Du hilfst beim Aufräumen und niemand sieht es.",
  "right": "Ich helfe trotzdem mit guter Absicht.",
  "wrong": "Ich helfe nur, wenn ich gelobt werde."
 },
 {
  "id": "aqidah-ikhlas-gute-absichten",
  "sourceId": "aqidah-ikhlas",
  "topic": "Gute Absichten",
  "title": "Gute Absichten · Warum ich etwas tue",
  "lead": "Die Absicht gehört zu unseren guten Taten.",
  "goal": "Ich denke darüber nach, warum ich Gutes tue.",
  "lines": [
   "Vor einer guten Tat kann ich nachdenken.",
   "Warum möchte ich das tun?",
   "Ich möchte Allah aufrichtig dienen.",
   "Ich muss nicht mit meinen Taten angeben."
  ],
  "prompt": "Du möchtest etwas Gutes tun.",
  "right": "Ich bemühe mich um eine aufrichtige Absicht.",
  "wrong": "Ich tue es nur, um damit anzugeben."
 }
];
 function createLesson(s){
  const base=previous[s.sourceId];
  if(!base)throw new Error("Academy source lesson missing: "+s.sourceId);
  const hint="Denke daran: "+base.goal;
  const explanation=s.right+" "+base.goal;
  const choice=(q,opts,correct=0)=>({type:"choice",prompt:q,options:opts,correct,hint,explain:explanation});
  const ask=choice(s.prompt,[s.right,s.wrong]);
  const age4=[ask,choice("Was möchtest du dir merken?",[s.goal,s.wrong])];
  const age6=[ask,{type:"text",prompt:"Wie kannst du das heute selbst üben?",sample:s.goal,hint},choice("Wo finden wir eine Grundlage für dieses Thema?",["Im Qurʾān und in der authentischen Sunnah.","Nur in ausgedachten Regeln."],0)];
  const age9=[ask,{type:"text",prompt:"Erkläre deine Entscheidung anhand einer Alltagssituation.",sample:s.goal+" "+s.right,hint},{type:"text",prompt:"Welchen Bezug hat dieses Thema zu Qurʾān "+base.quran.surah+":"+base.quran.ayah+" und der genannten Sunnah?",sample:"Der Qurʾān lehrt: "+base.quran.meaning+" Die Sunnah erklärt: "+base.hadith.text,hint}];
  return Object.freeze({
   id:s.id,subject:base.subject,topic:s.topic,title:s.title,
   lead:s.lead,goal:s.goal,quran:base.quran,hadith:base.hadith,
   lines:s.lines,hint,sample:s.goal,sourceLesson:s.sourceId,
   questions:{"4-5":age4,"6-8":age6,"9-10":age9}
  });
 }
 const additions=Object.fromEntries(modules.map(s=>[s.id,createLesson(s)]));
 window.DARKidsAcademyCurriculum=Object.freeze({...previous,...additions});
 window.DARKidsAcademyCurriculumV2=Object.freeze({version:"20261010-v2",count:modules.length,ids:modules.map(x=>x.id)});
})();
