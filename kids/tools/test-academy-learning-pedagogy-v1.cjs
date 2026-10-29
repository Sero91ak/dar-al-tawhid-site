#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const html=fs.readFileSync("kids/akademie/index.html","utf8");
const start=html.indexOf("function academyDisplayChoices(q,index,lessonScope=\"\"){");
const end=html.indexOf("\nfunction showQuestion(){",start);
assert(start>=0&&end>start,"Academy question-order function missing");
const sandbox=vm.createContext({});
vm.runInContext(html.slice(start,end)+"\nglobalThis.order=academyDisplayChoices;",sandbox,{timeout:3000});
const order=sandbox.order;
for(const n of [2,3,4,5]){
 const q={prompt:"Lernfrage über eine Bedeutung",options:Array.from({length:n},(_,i)=>"Antwort "+i)};
 for(let j=0;j<n*2;j++){
  const shuffled=Array.from(order(q,j));
  assert.equal(shuffled.length,n);
  assert.deepEqual(shuffled.map(x=>x.originalIndex).sort((a,b)=>a-b),q.options.map((_,i)=>i));
  for(const x of shuffled)assert.equal(x.text,q.options[x.originalIndex]);
 }
 assert.notEqual(order(q,0,"akhlāq:sidq")[0].originalIndex,order(q,1,"akhlāq:sidq")[0].originalIndex,"Following questions must not have one frozen display position");
 const positions=new Set(Array.from({length:35},(_,k)=>order(q,0,"lesson-"+k+":6-8")[0].originalIndex));
 assert(positions.size>1,"Different lessons must not share one predictable correct-answer position");
 assert.deepEqual(Array.from(order(q,0,"lesson-fixed:6-8")).map(x=>x.originalIndex),Array.from(order(q,0,"lesson-fixed:6-8")).map(x=>x.originalIndex),"Same question must retain stable order across retries");
}
assert(html.includes('choice=i;'),"Correctness must map to canonical answer index");
assert(html.includes('q.type==="choice")academyDisplayChoices(q,qIndex,activeLessonId+":"+age).forEach(({text:t,originalIndex:i},visibleIndex)=>'),"Display order does not feed quiz");
assert(html.includes('speak(3,["Antwort "+(visibleIndex+1)+": "+t]);'),"Spoken answer numbering must match the visual order");
assert(!html.includes('"Das war noch nicht die gesuchte Antwort. "+q.explain'),"First wrong attempt cannot disclose the answer");
assert(html.includes('score.unverified=(Number(score.unverified)||0)+1;'),"Non-graded free answers must be recorded as unverified");
assert(html.includes('unverifiedAnswerCount:Number(score.unverified)||0'),"Persist unverified counts without resetting prior records");
assert(html.includes('score.choices>score.correct||score.neededHelp>0||(Number(score.unverified)||0)>0'),"Do not promote non-assessed answers to secure repetition");
assert(html.includes('unverified:val(d.score.unverified)'),"Reading old drafts must default to zero while preserving ungraded answers");
assert(html.includes('unverified:Number(score.unverified)||0'),"Draft saving must preserve ungraded answers across app restarts");
assert(html.includes('id="academyTeachBackPrompt"')&&html.includes('const teach=$("#academyTeachBackPrompt")'),"Recap must invite age-adapted explanation and peer teaching");
assert(html.includes('const VERSION="academy-v4"'),"Keep existing progress storage namespace");
const doc=fs.readFileSync("kids/akademie/LEARNING_ACADEMY_PEDAGOGY_MASTER_V1.md","utf8");
for(const marker of ["Qurʾān","Ṣaḥīḥ al-Buḫārī","4–5 Jahre","6–8 Jahre","9–10 Jahre","Weitergeben","Sprechsegment","Freigabegate"]){
 assert(doc.includes(marker),"Teaching standard missing "+marker);
}
console.log("PASS: academy answers seeded by lesson/age, stable on retry without changing canonical correctness, spoken numbering matches, no first-error solution leak, no unverified credit, progress namespace intact");
