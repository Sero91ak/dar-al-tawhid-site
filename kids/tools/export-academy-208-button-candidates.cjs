#!/usr/bin/env node
"use strict";
/* REVIEW-ONLY exporter: 621 previously open questions tracked as button choices.
 * Nothing is written to child-app data; 0 ElevenLabs credits. */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const ctx=vm.createContext({window:{}});
for(const v of ["v1","v2","v22","v25","v26","v27","v28","v29"])
 vm.runInContext(read("kids/akademie/curriculum-"+v+".js"),ctx,{timeout:12000});
for(const part of ["67-90","91-114","115-138","139-162","163-186","187-208"])
 vm.runInContext(read("kids/akademie/editorial-v31/curriculum-v31-"+part+".js"),ctx,{timeout:12000});
const legacy=Object.values(ctx.window.DARKidsAcademyCurriculum);
const drafts=Object.values(ctx.window.DARKidsAcademyEditorialV31);
const rows=[],ages=["4-5","6-8","9-10"];
for(const [lessons,isDraft] of [[legacy,false],[drafts,true]])for(const lesson of lessons)
 for(const age of ages)for(let i=0;i<lesson.questions[age].length;i++){
  const q=lesson.questions[age][i];
  const previouslyText=q.type==="text";
  const converted=q.type==="choice"&&q.editorialReviewStatus==="pending-human-review"&&!!q.legacyPrompt;
  if(!previouslyText&&!converted)continue;
  const sourceCorrect=String(converted?q.options[q.correct]:(q.sample||"")).trim();
  const wrongOptions=lesson.questions[age].filter(x=>x.type==="choice")
   .flatMap(x=>x.options.filter((_,i)=>i!==x.correct));
  const wrong=converted?q.options.find((t,j)=>j!==q.correct):
   wrongOptions.find(t=>String(t).trim()&&String(t).trim()!==sourceCorrect)||
   "Ich ignoriere die Lernregel und überlege nicht.";
  let buttonPrompt=String(q.prompt);
  if(previouslyText&&/^(Erkläre|Beschreibe|Entwirf|Nenne|Formuliere)/i.test(buttonPrompt))
   buttonPrompt="Welche Aussage beantwortet die Lernfrage zum Thema „"+lesson.topic+"“?";
  else if(previouslyText&&/^Wie erklärst du/.test(buttonPrompt))
   buttonPrompt="Welche Erklärung passt zum Thema „"+lesson.topic+"“?";
  rows.push({lessonId:lesson.id,age,questionIndex:i+1,topic:lesson.topic,
   source:isDraft?"NEW_142_DRAFT":"EXISTING_66",
   originalPrompt:q.legacyPrompt||q.prompt,proposedButtonPrompt:buttonPrompt,
   options:[sourceCorrect,wrong],correctOption:0,
   review:{islamicSourceChecked:false,ageAppropriateChecked:false,
    wrongOptionChecked:false,audioApproved:false,childAppApproved:false},
   flags:{longCorrectAnswer:sourceCorrect.length>180,
    genericWrongAnswer:/ignoriere die Lernregel/.test(wrong)},
   quran:lesson.quran?.label||null,hadith:lesson.hadith?.source||null});
 }
assert.equal(rows.length,621);
assert.equal(rows.filter(x=>x.source==="EXISTING_66").length,195);
assert.equal(rows.filter(x=>x.source==="NEW_142_DRAFT").length,426);
const target=process.argv[2];
if(target){
 const output=path.resolve(target);
 fs.mkdirSync(path.dirname(output),{recursive:true});
 fs.writeFileSync(output,JSON.stringify({mode:"EDITORIAL_REVIEW_ONLY",generatedAudio:0,
  releasedLessons:0,rows},null,2)+"\n","utf8");
}
console.log("REVIEW QUEUE: 621 proposed button questions; 195 old + 426 new.");
console.log("NO AUTO-APPROVAL: source, distractor, age and spoken script review pending.");
