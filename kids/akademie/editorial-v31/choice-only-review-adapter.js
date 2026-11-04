/* TAWḤĪD KIDS Academy 208 — V31 button review projection.
 * Do not include in visitor-facing production before 142 source/editorial gates pass.
 * Original 142 lesson drafts and 52-week child state are never mutated.
 */
(function(root){
"use strict";
const origin=root.DARKidsAcademyEditorialV31;
if(!origin)throw new Error("Editorial V31 source must load first");
const ages=["4-5","6-8","9-10"];
const review={};
let adapted=0;
function normalize(x){return String(x==null?"":x).normalize("NFC").trim()}
function convert(q,lesson,age){
 if(q.type==="choice")return Object.freeze({...q,options:Object.freeze([...q.options])});
 if(q.type!=="text")throw new Error("Unexpected input mode for "+lesson.id);
 const correct=normalize(q.sample);
 if(!correct)throw new Error("Missing example answer "+lesson.id+" "+age);
 const prompt=String(q.prompt||"");
 const isSource=prompt.startsWith("Was lehrt Qurʾān")||prompt.startsWith("Was steht in der Sunnah");
 const isTeach=prompt.startsWith("Wie erklärst du");
 const isExample=prompt.startsWith("Beschreibe mit eigenen Worten");
 const newPrompt=isSource?
  "Welche Antwort unterscheidet den Qurʾān-Vers von der Sunnah richtig?":
  isTeach?"Welche Erklärung mit einer Rückfrage passt zu „"+lesson.topic+"“?":
  isExample?"Welche Antwort zeigt eine passende Alltagsübung zu „"+lesson.topic+"“?":
  "Welche Aussage passt zur Lernfrage über „"+lesson.topic+"“?";
 let wrong;
 if(isSource){
  wrong="Unsere frei erfundene Unterrichtsübung ist selbst ein wörtliches Offenbarungszitat.";
 }else if(isTeach){
  wrong="Ich erkläre das Thema nicht und stelle auch keine Rückfrage.";
 }else{
  const candidate=(lesson.questions?.[age]||[]).filter(item=>item.type==="choice")
   .flatMap(item=>item.options.filter((text,i)=>i!==item.correct))
   .map(normalize).find(text=>text&&text!==correct);
  wrong=candidate||"Ich beachte unsere Lernübung nicht.";
 }
 if(!wrong||wrong===correct)throw new Error("Invalid alternative for "+lesson.id);
 adapted++;
 return Object.freeze({
  type:"choice",prompt:newPrompt,options:Object.freeze([correct,wrong]),correct:0,
  hint:q.hint,explain:correct,sample:q.sample,
  editorialReviewStatus:"pending-human-review",
  adaptedFromText:true,originalPrompt:q.prompt,approvedForChildApp:false,
  approvedForAudio:false
 });
}
for(const [id,lesson] of Object.entries(origin)){
 if(lesson.releaseGate?.childAppUnlocked!==false||lesson.voiceApproved!==false||
    lesson.reviewerApproved!==false)
  throw new Error("Unapproved content release gate "+id);
 const questions={};
 for(const age of ages)questions[age]=Object.freeze(
  (lesson.questions?.[age]||[]).map(q=>convert(q,lesson,age)));
 review[id]=Object.freeze({...lesson,questions:Object.freeze(questions),
  reviewerApproved:false,voiceApproved:false});
}
if(Object.keys(review).length!==142||adapted!==426)throw new Error("V31 choice-only review count mismatch");
root.DARKidsAcademyEditorialV31ButtonReview=Object.freeze(review);
root.DARKidsAcademyV31ButtonReviewMeta=Object.freeze({
 lessons:142,ageVersions:426,questionCount:1136,adaptedFromText:426,
 approvedForChildApp:false,approvedForAudio:false,
 originalEditorialDraftsUntouched:true});
})(window);
