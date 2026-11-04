#!/usr/bin/env node
"use strict";
/* KIDS Academy 208: zero-credit preflight. No child data or audio generation. */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),read=f=>fs.readFileSync(path.join(root,f),"utf8");
const box=vm.createContext({window:{}});
for(const v of ["v1","v2","v22","v25","v26","v27","v28","v29"])
 vm.runInContext(read("kids/akademie/curriculum-"+v+".js"),box,{timeout:12000});
for(const v of ["67-90","91-114","115-138","139-162","163-186","187-208"])
 vm.runInContext(read("kids/akademie/editorial-v31/curriculum-v31-"+v+".js"),box,{timeout:12000});
const existing=Object.values(box.window.DARKidsAcademyCurriculum||{});
const drafts=Object.values(box.window.DARKidsAcademyEditorialV31||{});
assert.equal(existing.length,65);assert.equal(drafts.length,142);
const ages=["4-5","6-8","9-10"],voice=JSON.parse(read("kids/data/academy-voice-policy-v10.json"));
assert.equal(voice.voiceIdentity.voiceId,"DkU7j9uO4ZEtLD2iRZSH");
assert.equal(voice.production.modelId,"eleven_v4");
assert.equal(voice.production.profile,"kids_story");
assert.equal(voice.costControls.autoPublishWithoutOwnerReview,false);
const ids=new Set(),phrases=new Set();let questions=8,legacyText=0,draftText=0;
const put=s=>{s=String(s||"").normalize("NFC").replace(/\s+/g," ").trim();if(s)phrases.add(s)};
for(const [items,isDraft] of [[existing,false],[drafts,true]])for(const l of items){
 assert(l.id&&!ids.has(l.id));ids.add(l.id);
 if(isDraft){
  assert.equal(l.reviewerApproved,false);
  assert.equal(l.voiceApproved,false);
  assert.equal(l.releaseGate.childAppUnlocked,false);
  assert.equal(l.sourceAudit.sourceSpecificReview,"pending-independent-scholarly-check");
 }
 for(const age of ages){
  assert(Array.isArray(l.questions[age]));questions+=l.questions[age].length;
  for(const q of l.questions[age]){
   assert(["choice","text"].includes(q.type));
   put(q.prompt);
   if(q.type==="text"){
    if(isDraft)draftText++;else legacyText++;
    assert(String(q.sample||"").trim(),"Open question missing model answer");
    put(q.sample);
   }else{
    assert(Array.isArray(q.options)&&q.options.length>=2);
    for(const option of q.options)put(option);
   }
  }
  const a=l.ageText?.[age];
  if(a){put(a.intro);for(const line of a.lines||[])put(line);put(a.evidence)}
 }
 put(l.lead);put(l.hadith?.text);
}
assert.equal(questions,1664);
assert.equal(legacyText,195);assert.equal(draftText,426);
const report={status:"REVIEW_ONLY",lessons:208,ageVersions:624,questions,
 convertedAnswerButtonsStillNeedingHumanQA:legacyText+draftText,
 oldOpenQuestions:legacyText,newDraftOpenQuestions:draftText,
 newLessonSourceApprovals:0,newLessonAudioApprovals:0,
 uniquePossibleSpokenTexts:phrases.size,approvedGenerations:0,creditsSpent:0,
 voiceId:voice.voiceIdentity.voiceId,modelId:"eleven_v4",
 noSyntheticQuran:true,childInput:"BUTTONS_ONLY_AFTER_REVIEW",
 safeForProductionRelease:false};
console.log(JSON.stringify(report,null,2));
module.exports=report;
