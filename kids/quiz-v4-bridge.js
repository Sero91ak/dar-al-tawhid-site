/* DĀR AL TAWḤĪD KIDS — V4 Quiz speech contract 2026-10-13.
   Deterministic keys, shared by kids/tools/quiz_joy_v4_script.py.
   No browser synthesis, no secret, no remote generation on play.
   New V4 assets are preferred only when a real manifest clip is ready. */
(function(root){
"use strict";
var yesNoGuidance=[
  "Was meinst du? Wenn du glaubst, dass es stimmt, wähle Ja. Wenn nicht, wähle Nein.",
  "Überlege kurz. Ist das richtig? Dann tippe auf Ja. Wenn nicht, auf Nein.",
  "Du darfst in Ruhe nachdenken. Wähle Ja, wenn du meinst, es stimmt. Sonst Nein.",
  "Hör gut zu. Was denkst du? Wähle Ja für richtig oder Nein für nicht richtig.",
  "Jetzt bist du dran. Wenn es stimmt, wähle Ja. Wenn es nicht stimmt, Nein."
];
var youngOpen=[
  "Komm, wir probieren eine Wissensfrage.",
  "Hör einmal aufmerksam zu.",
  "Schau, was du schon alles weißt.",
  "Du darfst mitdenken."
];
var olderOpen=[
  "Hör dir die Frage und die Antworten in Ruhe an.",
  "Überlege kurz, bevor du dich entscheidest.",
  "Mal sehen, was du zu diesem Thema weißt.",
  "Nimm dir Zeit für deine Antwort."
];
var good={
 "4-6":["Mā schāʾ Allāh! Das heißt: Was Allah gewollt hat. Sehr gut gemacht!","Allāhumma bārik! O Allah, schenke Segen. Du hast richtig geantwortet!","Mā schāʾ Allāh! Möge Allah dein Wissen segnen. Du lernst immer mehr!","Al-ḥamdu lillāh! Alles Lob gebührt Allah. Das hast du gut erkannt!","Mā schāʾ Allāh! Deine Antwort ist richtig. Schön, wie du dazulernst!"],
 "7-8":["Mā schāʾ Allāh! Das bedeutet: Was Allah gewollt hat. Dein Wissen wächst!","Allāhumma bārik! O Allah, schenke Segen. Du hast gut nachgedacht!","Mā schāʾ Allāh! Möge Allah dein Wissen segnen. Richtig geantwortet!","Al-ḥamdu lillāh! Alles Lob gebührt Allah. Du lernst mit jeder Frage mehr!","Mā schāʾ Allāh! Du hast aufmerksam überlegt. Mach weiter so!"],
 "9-10":["Mā schāʾ Allāh! Du lernst den Dīn, deine Religion, immer besser kennen!","Allāhumma bārik! O Allah, schenke Segen. Du hast die passende Antwort gefunden!","Mā schāʾ Allāh! Möge Allah dein Wissen segnen. Gut durchdacht!","Al-ḥamdu lillāh! Alles Lob gebührt Allah. Du vertiefst dein Wissen!","Mā schāʾ Allāh! Du hast richtig entschieden. Vertiefe dein Wissen weiter!"]
};
var retry={
 "4-6":["Das war noch nicht richtig. Versuch es noch einmal in Ruhe.","Macht nichts, du darfst noch einmal nachdenken.","Schau dir die Antworten noch einmal an. Probiere es wieder.","Noch nicht ganz. Höre aufmerksam zu und versuche es erneut.","Nimm dir Zeit. Du kannst noch einmal wählen."],
 "7-8":["Noch nicht richtig. Schau dir die Antworten noch einmal an.","Überlege noch einmal. Du darfst es erneut versuchen.","Diese Antwort passt noch nicht. Nimm dir Zeit.","Versuche es noch einmal. Hör gut auf die Frage.","Denk noch einmal in Ruhe nach."],
 "9-10":["Diese Antwort passt noch nicht. Überlege noch einmal.","Vergleiche die Antworten erneut und versuche es noch einmal.","Das war noch nicht richtig. Denk in Ruhe darüber nach.","Lass dir einen Moment Zeit und wähle erneut.","Schau noch einmal genau auf die Fragestellung."]
};
function norm(t){return String(t==null?"":t).replace(/\s+/g," ").trim()}
function answerLine(label,n){label=norm(label);return "Antwort "+n+": "+label+(/[.!?؟]$/.test(label)?"":".")}
function yesNo(q){var a=(q.answers||[]).map(function(x){return norm(x.label).toLocaleLowerCase("de-DE")});return a.length===2&&a.indexOf("ja")>=0&&a.indexOf("nein")>=0}
function speech(q){
 if(!q||!q.ageBand||!good[q.ageBand])return null;
 var n=Number(q.number)||0,b=q.ageBand,title=norm(q.question),explanation=norm(q.explanation),answers=q.answers||[];
 if(!title||!explanation||!answers.length)return null;
 var options=answers.map(function(a,i){return answerLine(a.label,i+1)}).join(" "),question;
 if(b==="4-6"&&yesNo(q))question=youngOpen[n%youngOpen.length]+" "+title+" "+yesNoGuidance[n%yesNoGuidance.length];
 else if(b==="4-6")question=youngOpen[n%youngOpen.length]+" "+title+" "+options+" Welche Antwort passt deiner Meinung nach?";
 else if(b==="7-8")question=olderOpen[n%olderOpen.length]+" "+title+" "+options+" Wähle die Antwort, die du für richtig hältst.";
 else question=title+" "+options+" Überlege und wähle die beste Antwort.";
 return {questionAudioText:norm(question),
         correctAudioText:good[b][n%good[b].length],
         retryAudioText:retry[b][n%retry[b].length],
         explanationAudioText:norm("Das merken wir uns: "+explanation)};
}
function has(text){return !!(text&&root.DARKidsOwnerVoice&&typeof root.DARKidsOwnerVoice.has==="function"&&root.DARKidsOwnerVoice.has(text))}
function pick(q,kind,legacy){
 var s=speech(q);var v=s&&s[kind];
 return v&&has(v)?v:String(legacy||"");
}
root.DARKidsQuizV4={version:"quiz-academy-praise-v4-20261013",speech:speech,has:has,pick:pick};
})(window);
