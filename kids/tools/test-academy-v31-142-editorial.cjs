#!/usr/bin/env node
"use strict";
/* TAWḤĪD KIDS 208/624 – editorial-content contract, NO PUBLIC/VOICE RELEASE.
 * This test intentionally rejects activation and protects 66 existing lessons.
 */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../..");
const load=relative=>fs.readFileSync(path.join(root,relative),"utf8");
const roadmap=JSON.parse(load("kids/data/academy-expansion-roadmap-v23.json"));
const year=JSON.parse(load("kids/data/academy-year-52weeks-v1.json"));
const chunks=["67-90","91-114","115-138","139-162","163-186","187-208"];
const ctx=vm.createContext({window:{}});
for(const part of chunks)new vm.Script(load("kids/akademie/editorial-v31/curriculum-v31-"+part+".js"),{filename:part}).runInContext(ctx,{timeout:12000});
const lessons=Object.values(ctx.window.DARKidsAcademyEditorialV31||{});
const existingVersions=["v1","v2","v22","v25","v26","v27","v28","v29"];
for(const version of existingVersions)new vm.Script(load("kids/akademie/curriculum-"+version+".js"),{filename:"prior-"+version}).runInContext(ctx,{timeout:12000});
const actualExisting=Object.values(ctx.window.DARKidsAcademyCurriculum||{});
assert.equal(actualExisting.length,65,"Existing 65 curriculum lessons must remain present");
const oldQuestionCount=actualExisting.reduce((n,l)=>n+["4-5","6-8","9-10"].reduce((sum,age)=>sum+l.questions[age].length,0),0);
assert.equal(oldQuestionCount,520,"Existing questions must remain unchanged in count");

assert.equal(lessons.length,142);
assert.equal(roadmap.plannedUnits.length,142);
const oldNames=new Set([...roadmap.existingLessonSlots.map(x=>x.lessonId),...actualExisting.map(x=>x.id)]);
const seen=new Set();
const ages={"4-5":2,"6-8":3,"9-10":3};
let qCount=0,ageVariants=0,newSourceVerses=new Set(),unapproved=0;
for(let i=0;i<lessons.length;i++){
 const x=lessons[i],p=roadmap.plannedUnits[i];
 assert.equal(x.editorialSlot,p.editorialSlot,"Editorial slot changed");
 assert.equal(x.topic,p.title,"Roadmap topic changed");
 assert.equal(x.week,p.week,"Week mismatch");
 assert.equal(x.weekday,p.weekday,"Weekday mismatch");
 assert.ok(!oldNames.has(x.id)&&!seen.has(x.id),"Existing or duplicate ID "+x.id);
 seen.add(x.id);
 assert.equal(x.contentStatus,"complete-editorial-draft-not-released");
 assert.equal(x.voiceApproved,false);
 assert.equal(x.reviewerApproved,false);
 assert.equal(x.releaseGate.reviewerApproved,false);
 assert.equal(x.releaseGate.childAppUnlocked,false);
 assert.equal(x.releaseGate.voiceApproved,false);
 assert.equal(x.releaseGate.quranSourceSpecificMatchApproved,false);
 assert.equal(x.releaseGate.hadithSourceSpecificMatchApproved,false);
 assert.ok(x.sourceAudit?.quranUrl?.startsWith("https://quran.com/"));
 assert.ok(x.sourceAudit?.hadithUrl?.startsWith("https://"));
 // Older drafts reuse an existing lesson. Corrected lessons can instead have
 // a new, explicitly pending primary-source pairing; do not fabricate an anchor.
 const inheritedAnchor=typeof x.sourceAudit?.sourceAnchorLessonId==="string"&&x.sourceAudit.sourceAnchorLessonId.length>0;
 const newPendingPrimaryPair=x.sourceAudit?.sourceAnchorLessonId===null&&
  x.sourceAudit?.sourceScope?.startsWith("Individuell neu zugeordneter Primärbeleg")&&
  x.sourceAudit?.sourceSpecificReview==="pending-independent-scholarly-check"&&
  x.sourceAudit?.verifiedDate===null&&x.sourceAudit?.hasNewIndependentHadithVerification===false;
 assert.ok(inheritedAnchor||newPendingPrimaryPair,"Source anchor or pending primary-source review required "+x.id);
 assert.ok(x.quran?.arabic?.trim()&&x.quran?.meaning?.trim()&&x.hadith?.text?.trim());
 assert.ok(x.quran.label&&x.hadith.source);
 if(x.sourceAudit.sourceSpecificReview==="pending-independent-scholarly-check")unapproved++;
 newSourceVerses.add(x.quran.surah+":"+x.quran.ayah);
 for(const [age,count] of Object.entries(ages)){
  ageVariants++;
  assert.equal(x.ageText[age].lines.length,4,"Age lines "+x.id+" "+age);
  assert.ok(x.ageText[age].intro&&x.ageText[age].evidence,"Teacher evidence "+x.id);
  const qs=x.questions[age];
  assert.equal(qs.length,count,"Question count "+x.id+" "+age);
  assert.equal(new Set(qs.map(q=>q.prompt)).size,count,"Duplicate lesson questions "+x.id);
  for(const q of qs){
   qCount++;
   assert.ok(q.prompt&&q.hint,"No prompt/hint "+x.id);
   if(q.type==="choice"){
    assert.ok(q.options?.length>=2&&q.options?.length<=3);
    assert.equal(new Set(q.options).size,q.options.length,"Duplicate options "+x.id);
    assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.options.length);
    assert.ok(q.explain,"No explanation "+x.id);
   }else {assert.equal(q.type,"text");assert.ok(q.sample,"No sample answer "+x.id);}
  }
 }
}

/* Editorial review is real progress only when the 35 individually redrafted
 * lessons cease using the old generic placeholder and retain their specific
 * source links. No human approval or public activation is inferred. */
const editorialById=new Map(lessons.map(l=>[l.id,l]));
const phase35=["070","071","072","073","075","076","077","082","083","084","085","086","087","088","094","098","099","110","120","132","143","144","155","156","198","199","200","201","202","203","204","205","206","207","208"];
assert.equal(phase35.length,35);
const rewritten35=new Set(phase35.map(n=>"academy-"+n));
const counts={generic:0,rewritten:0};
for(const l of lessons){
 if(l.ageText["4-5"].lines[0].startsWith("Wir lernen heute:"))counts.generic++;
 else counts.rewritten++;
 if(!rewritten35.has(l.id))continue;
 assert(!l.ageText["4-5"].lines.some(s=>s.startsWith("Wir lernen heute:")||s.startsWith("Wir üben ")),"Still generic age 4-5 in "+l.id);
 for(const age of ["4-5","6-8","9-10"]){
  assert(!l.questions[age].some(q=>q.prompt.startsWith("Welche Erklärung mit Rückfrage passt")||
   q.prompt.startsWith("Eine Person behauptet, unser Beispiel zu")),
   "Still placeholder questions "+l.id+" "+age);
  for(const q of l.questions[age]){
   assert.equal(q.type,"choice","All rewritten lessons must use answer buttons "+l.id);
   assert(q.options.every(opt=>opt.trim().length>0),"Empty rewritten answer choice "+l.id);
   if(age==="4-5")assert(q.options.every(opt=>opt.length<=120),"Age 4-5 answer too long "+l.id);
  }
 }
 assert.equal(l.sourceAudit.sourceSpecificReview,"pending-independent-scholarly-check");
 assert.equal(l.releaseGate.childAppUnlocked,false);
}
assert.equal(counts.rewritten,35,"Editorial count drift: do not claim more rewritten lessons than exist");
assert.equal(counts.generic,107);
const correctedPrimary={
 "academy-084":["2:127","https://sunnah.com/bukhari:3365"],
 "academy-087":["39:53","https://sunnah.com/bukhari:5999"],
 "academy-094":["5:6","https://sunnah.com/bukhari:159"],
 "academy-110":["24:27","https://sunnah.com/bukhari:6245"],
 "academy-200":["58:11","https://sunnah.com/bukhari:6270"],
 "academy-201":["20:14","https://sunnah.com/bukhari:757"],
 "academy-206":["20:14","https://sunnah.com/bukhari:757"]
};
for(const [id,[q,hadith]] of Object.entries(correctedPrimary)){
 const l=editorialById.get(id);
 assert(l,"Corrected lesson missing "+id);
 assert.equal(l.sourceAudit.quranReference,q);
 assert.equal(l.sourceAudit.hadithUrl,hadith);
 assert.equal(l.sourceAudit.sourceAnchorLessonId,null,"Independent sources cannot pretend legacy anchor "+id);
}
console.log("PASS: 35 individually rewritten V31 lessons, 107 still generic. All corrected primary sources and child safety locks remain review-only.");

assert.equal(qCount,1136);
assert.equal(ageVariants,426);
assert.equal(unapproved,142);
assert.equal(year.goals.currentlyInCatalog,66,"Do not silently update released count");
assert.equal(year.goals.additionalAuthenticallyVerifiedLessonsNeeded,142,"Pending content still gated");
assert.equal(year.weeks.flatMap(w=>w.days).filter(x=>x.mode==="new"&&!x.lessonId).length,142,"Do not unlock school days");
const html=load("kids/akademie/index.html");
assert.ok(!html.includes("curriculum-v31-67-90.js"),"Editorial draft must NOT load into children app");
assert.equal(208,year.goals.currentlyInCatalog+lessons.length);
assert.equal(624,66*3+ageVariants);
assert.equal(1664,528+qCount);
console.log("PASS: 142 complete structured editorial drafts, 426 new age-variants and 1136 questions.");
console.log("PASS: 65 existing curriculum JS lessons plus separate Ṣidq = 66; together with 142 editorial lessons = 208 and 624 ages / 1664 questions.");
console.log("PASS: 52-week school plan preserved; all 142 entries remain locked, no altered child progress or audio generation.");
console.log("NOT RELEASED: thematic source anchors need per-lesson Islamic-source and pedagogical approval.");
