#!/usr/bin/env node
"use strict";
/* Zero-credit, source-preserving V31 child-privacy review contract. */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../..");
const box=vm.createContext({window:{}});
function load(rel){const txt=fs.readFileSync(path.join(root,rel),"utf8");
 vm.runInContext(txt,box,{timeout:10000,filename:rel});}
for(const c of ["67-90","91-114","115-138","139-162","163-186","187-208"])
 load("kids/akademie/editorial-v31/curriculum-v31-"+c+".js");
const original=box.window.DARKidsAcademyEditorialV31;
assert.equal(Object.keys(original).length,142);
const before=JSON.stringify(original);
load("kids/akademie/editorial-v31/choice-only-review-adapter.js");
assert.equal(JSON.stringify(original),before,"Raw source content mutated");
const projected=box.window.DARKidsAcademyEditorialV31ButtonReview;
const meta=box.window.DARKidsAcademyV31ButtonReviewMeta;
assert.equal(meta.questionCount,1136);assert.equal(meta.adaptedFromText,426);
assert.equal(meta.approvedForChildApp,false);assert.equal(meta.approvedForAudio,false);
let questions=0,converted=0,excessive=0,duplicates=0,unreviewed=0;
for(const [id,lesson] of Object.entries(projected)){
 assert.equal(lesson.releaseGate.childAppUnlocked,false);
 assert.equal(lesson.voiceApproved,false);assert.equal(lesson.reviewerApproved,false);
 for(const age of ["4-5","6-8","9-10"]){
  const source=original[id].questions[age],qs=lesson.questions[age];
  assert.equal(qs.length,age==="4-5"?2:3);
  for(let i=0;i<qs.length;i++){
   const q=qs[i],old=source[i];questions++;
   assert.equal(q.type,"choice");
   assert(Array.isArray(q.options)&&q.options.length>=2);
   assert(q.options.every(x=>typeof x==="string"&&x.trim()));
   assert(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.options.length);
   if(new Set(q.options).size!==q.options.length)duplicates++;
   if(q.options.some(t=>t.length>180))excessive++;
   if(old.type==="text"){
    converted++;assert.equal(q.adaptedFromText,true);
    assert.equal(q.options[0],old.sample);
    assert.equal(q.originalPrompt,old.prompt);
    assert.equal(q.approvedForChildApp,false);assert.equal(q.approvedForAudio,false);
    if(q.editorialReviewStatus==="pending-human-review")unreviewed++;
    assert(!/mit eigenen Worten|Formuliere eine Rückfrage/i.test(q.prompt),
     "Not a button-ready prompt: "+id+" "+age);
   }else assert.equal(q.correct,old.correct,"Prior answer index changed");
  }
 }
}
assert.equal(questions,1136);assert.equal(converted,426);assert.equal(unreviewed,426);
assert.equal(duplicates,0,"Duplicate choices in button review projection");
console.log("PASS: 142 V31 drafts, 1136 button questions, 426 open converted, 0 source mutations.");
console.log("FLAG: "+excessive+" candidate questions contain buttons over 180 characters.");
console.log("NO AUDIO, NO RELEASE: all 142 remain source/pedagogy/voice gated.");
