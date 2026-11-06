#!/usr/bin/env node
"use strict";
/* Four additional source-specific educational rewrites, still NOT released. */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),ctx=vm.createContext({window:{}});
for(const c of ["67-90","91-114","115-138","139-162","163-186","187-208"]){
 const p="kids/akademie/editorial-v31/curriculum-v31-"+c+".js";
 vm.runInContext(fs.readFileSync(path.join(root,p),"utf8"),ctx,{filename:p,timeout:12000});
}
const all=ctx.window.DARKidsAcademyEditorialV31;
const cases={"070":["5:6",201],"076":["82:11",3208],"082":["5:6",135],"098":["42:41",2442]};
let count=0,converted=0;
for(const [id,[quran,hadith]] of Object.entries(cases)){
 const l=all["academy-"+id];
 assert(l);
 assert.equal(l.sourceAudit.quranReference,quran);
 assert(l.hadith.source.includes(String(hadith)));
 assert.equal(l.sourceAudit.sourceSpecificReview,"pending-independent-scholarly-check");
 assert.equal(l.sourceAudit.sourceAnchorLessonId,null);
 assert.equal(l.reviewerApproved,false);
 assert.equal(l.voiceApproved,false);
 assert.equal(l.releaseGate.childAppUnlocked,false);
 assert.equal(l.releaseGate.quranSourceSpecificMatchApproved,false);
 assert.equal(l.releaseGate.hadithSourceSpecificMatchApproved,false);
 assert.equal(l.releaseGate.voiceApproved,false);
 for(const age of ["4-5","6-8","9-10"]){
  const a=l.ageText[age],qs=l.questions[age],n=age==="4-5"?2:3;
  assert.equal(a.lines.length,4);
  assert.equal(qs.length,n);
  const visible=[a.intro,a.evidence,...a.lines];
  for(const q of qs){
   count++;visible.push(q.prompt,q.hint,q.explain,...q.options);
   assert.equal(q.type,"choice");
   assert.equal(q.options.length,2);
   assert.equal(q.correct,0);
   assert.equal(new Set(q.options).size,q.options.length);
   assert(q.options.every(x=>x.length<=180));
   if(q.editorialReviewStatus==="pending-human-review")converted++;
  }
  assert(!visible.some(t=>/https?:\/\//.test(String(t))));
  assert(!visible.some(t=>/Was ist bei „|Wir üben „.*“\. Welche Handlung/.test(String(t))),"Generic template remains "+id);
 }
}
assert.equal(count,32);
assert.equal(converted,12);
console.log("PASS: 4 rewritten sensitive lessons, 12 age texts, 32 specific choice questions.");
console.log("PASS: source pairings and release gates preserved; no human review or paid audio claimed.");
