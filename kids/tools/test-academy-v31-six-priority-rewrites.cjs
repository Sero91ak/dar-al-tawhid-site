#!/usr/bin/env node
"use strict";
/* Regression for six independently re-authored Academy V31 lessons.
 * Protects source pairing and substantive learning while retaining every release gate.
 * Source-specific Islamic and phonetic human review STILL REQUIRED. */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),ctx=vm.createContext({window:{}});
for(const part of ["67-90","91-114","115-138","139-162","163-186","187-208"]){
 const p="kids/akademie/editorial-v31/curriculum-v31-"+part+".js";
 vm.runInContext(fs.readFileSync(path.join(root,p),"utf8"),ctx,{filename:p,timeout:12000});
}
const all=ctx.window.DARKidsAcademyEditorialV31;
assert.equal(Object.keys(all).length,142);
const expected={
 "120":["21:107",5376,"Barmherzigkeit"],
 "132":["96:1",3,"Offenbarung"],
 "143":["33:21",631,"Vorbild"],
 "144":["9:40",3653,"Hiǧrah"],
 "155":["4:59",3461,"Ḥadīṯ"],
 "156":["9:100",3651,"Ṣaḥābah"]
};
let questions=0,ages=0,converted=0;
for(const [id,[verse,hadith,focus]] of Object.entries(expected)){
 const l=all["academy-"+id];
 assert(l,"Missing critical lesson "+id);
 assert.equal(l.quran.surah+":"+l.quran.ayah,verse,"Wrong source "+id);
 assert(l.hadith.source.includes(String(hadith)),"Wrong Hadith "+id);
 assert(l.title.includes(focus)||l.topic.includes(focus),"Topic changed "+id);
 assert.equal(l.sourceAudit.quranReference,verse);
 assert.equal(l.sourceAudit.quranUrl,"https://quran.com/"+verse.replace(":","/"));
 assert.equal(l.sourceAudit.sourceAnchorLessonId,null,"No false inherited source anchor "+id);
 assert.equal(l.sourceAudit.sourceSpecificReview,"pending-independent-scholarly-check");
 assert.equal(l.sourceAudit.verifiedDate,null);
 assert.equal(l.sourceAudit.hasNewIndependentHadithVerification,false);
 assert.equal(l.reviewerApproved,false);
 assert.equal(l.voiceApproved,false);
 assert.equal(l.releaseGate.childAppUnlocked,false);
 assert.equal(l.releaseGate.voiceApproved,false);
 const text=[l.lead,l.goal,l.hadith.text];
 for(const [age,n] of [["4-5",2],["6-8",3],["9-10",3]]){
  const a=l.ageText[age],qs=l.questions[age];
  assert.equal(a.lines.length,4);
  assert.equal(qs.length,n);
  ages++;text.push(a.intro,a.evidence,...a.lines);
  for(const [i,q] of qs.entries()){
   questions++;
   assert.equal(q.type,"choice");
   assert(q.options.length>=2&&q.options.length<=3);
   assert.equal(q.correct,0);
   assert(q.options.every(x=>typeof x==="string"&&x.length<=180));
   assert.equal(new Set(q.options).size,q.options.length);
   assert(q.prompt&&q.explain&&q.hint);
   if(q.editorialReviewStatus==="pending-human-review")converted++;
   text.push(q.prompt,...q.options,q.explain,q.hint);
  }
 }
 assert(!text.some(t=>/https?:\/\//.test(t)),"No source URLs in child UI");
 assert(!text.some(t=>/Ich mache etwas anderes, ohne darüber nachzudenken|Was ist bei „|Wir üben (?:den|eine|ein|seine) .* kennenlernen/.test(t)),"Generic placeholder survived "+id);
}
assert.equal(ages,18);
assert.equal(questions,48);
assert.equal(converted,18);
console.log("PASS: six corrected topics / 18 age variants / 48 specific answer-buttons.");
console.log("PASS: Makkah first revelation (96:1 / Bukhari 3) and Hijrah (9:40 / Bukhari 3653) are distinct.");
console.log("PASS: no fabricated source-approval and all child-app/audio gates stay closed.");
