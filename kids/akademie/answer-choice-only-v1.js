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
  const correct=compact(q.sample||q.explain||lesson?.sample||lesson?.goal);
  if(!correct)throw Error("Missing answer for "+title+"/"+age+"/"+index);
  const alternatives=(lesson?.questions?.[age]||[])
   .filter(other=>other&&other.type==="choice"&&Array.isArray(other.options))
   .flatMap(other=>other.options.filter((_,i)=>i!==other.correct).map(clean))
   .filter(t=>t&&t!==correct&&t.length<=170);
  let wrong=sourcePrompt?
   "Der Qurʾān-Vers und der Ḥadīṯ müssen genau denselben Wortlaut haben.":
   alternatives[0]||"Das Gegenteil des Gelernten ist richtig.";
  if(wrong===correct)wrong="Die Aussage passt nicht zum gezeigten Qurʾān- und Sunnah-Beleg.";
  const prompt=sourcePrompt?
    "Welche Aussage verbindet Qurʾān und Sunnah zum Thema „"+title+"“ richtig?":
    /^(?:Erkläre|Beschreibe|Formuliere|Schreibe|Sprich|Tippe)\b/u.test(originalPrompt)?
     "Welche Antwort passt zu „"+title+"“ im Alltag?":originalPrompt;
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
