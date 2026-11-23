/* TAWḤĪD KIDS — choice-only answer projection for released Academy lessons.
 * Read-only: never mutate the original lesson, question IDs, progress, or audio assets.
 * No browser recording, no microphone, no text inputs, no TTS generation.
 * Existing open prompts are converted to reviewable multiple-choice questions.
 */
(function(root){
 "use strict";
 const cache=new WeakMap();
 const clean=x=>String(x==null?"":x).normalize("NFC").replace(/\s+/g," ").trim();
 const compact=(value,max=170)=>{
  const text=clean(value);
  if(text.length<=max)return text;
  const sentences=text.split(/(?<=[.!?])\s+/);
  const first=sentences[0]||"";
  if(first.length>=26&&first.length<=max)return first;
  const clipped=text.slice(0,max);
  const space=clipped.lastIndexOf(" ");
  return (space>90?clipped.slice(0,space):clipped).replace(/[\s.,;:]+$/,"")+" …";
 };
 function projectQuestion(q,lesson,age,index){
  if(!q||typeof q!=="object")throw Error("Invalid Academy question");
  if(q.type==="choice"){
   if(!Array.isArray(q.options)||q.options.length<2||
      !Number.isInteger(q.correct)||q.correct<0||q.correct>=q.options.length)
     throw Error("Invalid Academy answer choices");
   return q;
  }
  if(q.type!=="text")throw Error("Unknown Academy question type");
  const title=clean(lesson?.topic)||"unser Thema";
  const originalPrompt=clean(q.prompt);
  const sourcePrompt=/Qurʾān|Ḥadīṯ|Sunnah|Verses|Überlieferung|Lehrgedanke|Beleg/.test(originalPrompt);
  let correct=compact(q.sample||q.explain||lesson?.sample||lesson?.goal);
  if(!correct)throw Error("Missing answer for "+title+"/"+age+"/"+index);
  const alternatives=(lesson?.questions?.[age]||[])
   .filter(other=>other&&other.type==="choice"&&Array.isArray(other.options))
   .flatMap(other=>other.options.filter((_,i)=>i!==other.correct).map(clean))
   .filter(t=>t&&t!==correct&&t.length<=170);
  let wrong=sourcePrompt?
   "Der Qurʾān-Vers und der Ḥadīṯ müssen genau denselben Wortlaut haben.":
   alternatives[0]||"Das Gegenteil des Gelernten ist richtig.";
  if(wrong===correct)wrong="Die Aussage passt nicht zum gezeigten Qurʾān- und Sunnah-Beleg.";
  let prompt=sourcePrompt?
    "Welche Aussage verbindet Qurʾān und Sunnah zum Thema „"+title+"“ richtig?":
    /^(?:Erkläre|Beschreibe|Formuliere|Schreibe|Sprich|Tippe)\b/u.test(originalPrompt)?
     "Welche Antwort passt zu „"+title+"“ im Alltag?":originalPrompt;
  // Ṣidq is a real released child lesson, not an editorial question template.
  // Keep its age-specific original evidence and everyday situations. Generic
  // substitutions about unrelated Qurʾān/Ḥadīṯ wording are not child content.
  if(lesson?.id==="sidq"){
    if(age==="6-8"&&index===1){
      prompt=originalPrompt;
      wrong="Ich verstecke den Fehler.";
    }else if(age==="9-10"&&index===1){
      prompt="Warum gehört Wahrhaftigkeit zu einem guten Charakter?";
      wrong="Wahrheit spielt beim guten Charakter keine Rolle.";
    }else if(age==="9-10"&&index===2){
      prompt=originalPrompt;
      wrong="Ein Versehen und eine absichtliche Lüge sind dasselbe.";
    }
  }
  // Ṣabr: source-linked questions must be real child pedagogy, not generic
  // notes about the wording of a verse versus a hadith.
  // The old unadapted source questions stay in the immutable curriculum.
  if(lesson?.id==="akhlaq-sabr"){
    if(age==="6-8"&&index===1){
      prompt="Wie kannst du Geduld im Alltag zeigen?";
      correct="Ich bleibe freundlich und übe weiter, auch wenn etwas nicht sofort klappt.";
      wrong="Ich schimpfe, sobald ich warten muss.";
    }else if(age==="9-10"&&index===1){
      prompt="Was zeigt Geduld, wenn etwas nicht sofort gelingt?";
      correct="Ich bleibe ruhig, bitte um Hilfe und versuche es erneut.";
      wrong="Ich gebe sofort auf und werde gemein.";
    }else if(age==="9-10"&&index===2){
      prompt="Was lehren Qurʾān 2:153 und der Ḥadīṯ über Geduld?";
      correct="Allah ist mit den Geduldigen. Wer sich um Geduld bemüht, dem gibt Allah Geduld.";
      wrong="Geduld spielt keine Rolle, wenn etwas schwierig wird.";
    }
  }
  const result={...q,type:"choice",prompt,options:[correct,wrong],correct:0,
   explain:clean(q.sample||q.explain||lesson?.goal||correct),
   hint:clean(q.hint||lesson?.hint||"Denke an unseren Unterricht."),
   originalPrompt,adaptedFromText:true,needsHumanEditorialReview:true,
   approvedForAudio:false};
  if(result.options.length!==2||result.options.some(t=>!t||t.length>180))
   throw Error("Unusable choice-only answer for "+title+"/"+age+"/"+index);
  return Object.freeze(result);
 }
 function project(lesson,age,originalQuestions){
  if(!Array.isArray(originalQuestions))return [];
  const existing=cache.get(originalQuestions);
  if(existing)return existing;
  const output=Object.freeze(originalQuestions.map((q,i)=>projectQuestion(q,lesson,age,i)));
  cache.set(originalQuestions,output);
  return output;
 }
 root.DARKidsAcademyChoiceOnlyV1=Object.freeze({project,projectQuestion,version:"academy-choice-only-v1",noChildTextOrVoiceCollection:true});
})(window);
