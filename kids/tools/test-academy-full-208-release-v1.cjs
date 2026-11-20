#!/usr/bin/env node
"use strict";
/* Complete 208-lesson Academy plan, current V28/V29 missing voice plans,
 * and one-topic-at-a-time owner V4 release sequence. STRICTLY ZERO CREDITS.
 * Editorial outlines never count as lesson code or generated audio.
 */
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto"),vm=require("node:vm");
const assert=require("node:assert/strict");
const ROOT=path.resolve(__dirname,"../..");
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),"utf8"));
const text=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
const normalize=x=>String(x||"").normalize("NFC").replace(/\s+/g," ").trim();
const roster=read("kids/data/academy-full-release-sequence-v1.json");
const roadmap=read("kids/data/academy-expansion-roadmap-v23.json");
const year=read("kids/data/academy-year-52weeks-v1.json");
assert.equal(roster.summary.totalPlannedLessonSlots,208);
assert.equal(roster.summary.existingLessonCode,66);
assert.equal(roster.summary.additionalEditorialOutlinesNotYetInApp,142);
assert.equal(roster.summary.sourceVoicePlansCoverExisting,66);
assert.equal(roster.publicationContract.oneCompleteTopicThenLive,true);
assert.equal(roster.publicationContract.doNotAdvanceUntilProductionConfirmed,true);
assert.equal(roster.publicationContract.zeroRegenerationOfExistingProviderAudio,true);
assert.equal(roster.publicationContract.noAutoSyntheticQuranRecitation,true);
assert.equal(roster.publicationContract.voiceId,"DkU7j9uO4ZEtLD2iRZSH");
assert.deepEqual(roster.publicationContract.threeAgeGroups,["4-5","6-8","9-10"]);
assert.equal(roster.existingLessons.length,66);
assert.equal(roster.futureEditorial.length,142);
assert.equal(new Set(roster.existingLessons.map(x=>x.lessonId)).size,66);
assert.equal(new Set([...roster.existingLessons,...roster.futureEditorial].map(x=>x.editorialSlot)).size,208);
assert.deepEqual(roster.existingLessons.slice(0,3).map(x=>x.lessonId),["sidq","akhlaq-sabr","akhlaq-amanah"]);
assert.equal(roster.existingLessons[0].liveConfirmed,false);
assert.equal(roster.summary.actualOriginalsImportedForSidq,76);
assert.equal(roster.existingLessons[0].productionStatus,"real-v4-audio-imported-prepared-not-live");
const world=vm.createContext({window:{}});
for(const id of ["v1","v2","v22","v25","v26","v27","v28","v29"]){
 const file="kids/akademie/curriculum-"+id+".js";
 new vm.Script(text(file),{filename:file}).runInContext(world,{timeout:4000});
}
const actual=world.window.DARKidsAcademyCurriculum;
assert.equal(Object.keys(actual).length,65,"65 script-backed lessons + the special Ṣidq module");
for(const entry of roster.existingLessons){
 const slot=roadmap.existingLessonSlots.find(x=>x.editorialSlot===entry.editorialSlot);
 assert.equal(slot?.lessonId,entry.lessonId,"The source editorial slot cannot be replaced");
 assert.equal(entry.hasTextToSpeechPlan,true,"Every existing lesson needs source-mapped voice text");
 assert.ok(entry.distinctPhrasesInVoicePlans>=12,"Too few vocal script phrases "+entry.lessonId);
 if(entry.lessonId!=="sidq"){
  assert.ok(actual[entry.lessonId],"A released classroom lesson must exist in live code");
  assert.ok(entry.ageCoverage["4-5"]>0&&entry.ageCoverage["6-8"]>0&&entry.ageCoverage["9-10"]>0);
 }
}
const originalTopics=year.weeks.flatMap(x=>x.days).filter(d=>d.mode==="new");
assert.equal(originalTopics.length,208);
assert.equal(originalTopics.filter(x=>x.lessonId).length,66);
assert.equal(originalTopics.filter(x=>!x.lessonId).length,142);
assert.deepEqual(roadmap.plannedUnits.map(x=>x.editorialSlot),roster.futureEditorial.map(x=>x.editorialSlot));
for(let i=0;i<roster.futureEditorial.length;i++){
 const planned=roster.futureEditorial[i],original=roadmap.plannedUnits[i];
 assert.equal(planned.editorialSlot,original.editorialSlot);
 assert.equal(planned.topicId,original.topicId);
 assert.equal(planned.title,original.title);
 assert.equal(planned.pillar,original.pillar);
 assert.equal(planned.lessonCodeExists,false);
 assert.equal(planned.recordingAllowed,false);
 assert.equal(planned.releaseAllowed,false);
 assert.equal(original.releaseGate.childAppUnlocked,false);
 if(Object.hasOwn(actual,planned.topicId))throw Error("An editorial outline was incorrectly unlocked as a child lesson");
}

const vocal=(s,lessonId,kind,age,registry)=>{
 const normalized=normalize(s);
 if(!normalized)return;
 const key=[normalized,lessonId,kind,age].join("\0");
 registry.add(key);
};
const checks=[];
for(const version of ["v28","v29"]){
 const src="kids/akademie/curriculum-"+version+".js";
 const planned=read("kids/data/academy-voice-plan-"+version+".json");
 const sourceText=text(src);
 const expectedBlob=crypto.createHash("sha1").update("blob "+Buffer.byteLength(sourceText)+"\0"+sourceText).digest("hex");
 assert.equal(planned.sourceGitBlobSha,expectedBlob,"Original source file changed: "+src);
 assert.equal(planned.lessonCount,4);
 assert.equal(planned.phrases.length,planned.phraseCount);
 const validIds=Array.from(world.window["DARKidsAcademyCurriculum"+version.toUpperCase()].ids);
 assert.deepEqual(planned.curriculumIds,validIds);
 const expectedContexts=new Set();
 for(const id of validIds){
  const lesson=actual[id];
  assert.ok(lesson&&lesson.voiceApproved===false&&lesson.sourceAudit?.hadithUrl);
  const add=(v,k,a="all")=>vocal(v,id,k,a,expectedContexts);
  add(lesson.lead,"narration");
  add(lesson.goal,"summary");
  add(lesson.hadith.text,"narration");
  add(lesson.quran.meaning+" "+lesson.hadith.text,"summary");
  add(lesson.sample,"summary");
  for(const age of ["4-5","6-8","9-10"]){
   const body=lesson.ageText[age];
   assert.equal(body.lines.length,4);
   add(body.intro,"narration",age);
   body.lines.forEach(x=>add(x,"narration",age));
   add(body.evidence,"narration",age);
   for(const q of lesson.questions[age]){
    add(q.prompt,"question",age);
    if(q.type==="choice")q.options.forEach((opt,i)=>add("Antwort "+(i+1)+": "+opt,"answer",age));
   }
  }
 }
 const actualContexts=new Set();
 for(const phrase of planned.phrases){
  assert.equal(phrase.voiceProfileId,"serhat-owner-voice-2026");
  assert.equal(phrase.modelId,"eleven_v4");
  assert.equal(phrase.reviewStatus,"not-generated");
  assert.ok(!phrase.url);
  assert.equal(phrase.text,normalize(phrase.text));
  for(const c of phrase.contexts)vocal(phrase.text,c.lessonId,c.kind,c.age,actualContexts);
 }
 assert.deepEqual([...actualContexts].sort(),[...expectedContexts].sort(),"Voice plan must exactly reflect all currently rendered age-tier texts");
 checks.push([version,planned.phraseCount,validIds.length]);
}
assert.deepEqual(checks,[["v28",164,4],["v29",163,4]]);
const prior=read("kids/data/academy-topic-batches/release-state-v1.json");
assert.equal(prior.currentTopic,"sidq");
assert.equal(prior.liveConfirmed,false);
assert.equal(prior.newCompletedElevenLabsGenerations,76);
assert.equal(prior.originalAudioFilesImportedToGitHub,0);
assert.equal(prior.sourceOriginalsDownloadedToICloudCount,76);
assert.equal(prior.sourceOriginalsVerifiedCount,76);
assert.equal(prior.preparedLessonAudioCount,58);
assert.equal(prior.fullyCertifiedCount,58);
assert.equal(prior.status,"prepared-for-live-deployment");
assert.equal(prior.liveConfirmed,false);
assert.equal(prior.nextTopicLocked,true);
require("node:child_process").execFileSync("node",[
  "kids/tools/verify-academy-audio-manifest-hashes-v1.cjs"
],{cwd:ROOT,stdio:"inherit"});
console.log("KIDS ACADEMY 208 PASS: 66 real lessons with voice plans, 142 editorial outlines locked; Ṣidq 76 originals imported and 58/58 audio prepared, not live; V28/V29 plans preserved.");
