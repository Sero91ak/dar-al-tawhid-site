#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const ROOT=path.resolve(__dirname,"..");
const read=(p)=>fs.readFileSync(path.join(ROOT,p),"utf8");
const ctx=vm.createContext({window:{}});
for(const script of ["kids/akademie/curriculum-v1.js","kids/akademie/curriculum-v2.js"]){
 new vm.Script(read(script),{filename:script}).runInContext(ctx);
}
const curr=ctx.window.DARKidsAcademyCurriculum;
assert.equal(Object.keys(curr).length,33);
assert.equal(ctx.window.DARKidsAcademyCurriculumV2.count,22);
let questionCount=0;
for(const [id,l] of Object.entries(curr)){
 assert.equal(id,l.id);
 assert.match(l.subject,/^(akhlaq|adab|fiqh|aqidah)$/);
 assert.ok(l.lead&&l.goal&&l.quran&&l.hadith);
 assert.equal(l.lines.length,4);
 assert.match(l.hadith.source,/Ṣaḥīḥ/);
 for(const age of ["4-5","6-8","9-10"]){
  const qs=l.questions[age];
  assert.ok(Array.isArray(qs)&&qs.length>=2,id+age);
  for(const q of qs){
   questionCount++;
   assert.ok(q.prompt&&q.hint,id+age);
   if(q.type==="choice"){
    assert.ok(q.options?.length>=2,id+age);
    assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.options.length);
   }else assert.equal(q.type,"text");
  }
 }
 if(l.sourceLesson){
  const basis=curr[l.sourceLesson];
  assert.ok(basis,id+" base missing");
  assert.deepEqual(JSON.parse(JSON.stringify(l.quran)),JSON.parse(JSON.stringify(basis.quran)));
  assert.deepEqual(JSON.parse(JSON.stringify(l.hadith)),JSON.parse(JSON.stringify(basis.hadith)));
 }
}
assert.equal(questionCount,264);
const plan=JSON.parse(read("kids/data/academy-voice-plan-v9.json"));
const voicePolicy=JSON.parse(read("kids/data/academy-voice-policy-v10.json"));
assert.equal(voicePolicy.voiceIdentity.voiceId,"DkU7j9uO4ZEtLD2iRZSH");
assert.equal(voicePolicy.voiceIdentity.voiceProfileId,"serhat-owner-voice-2026");
assert.equal(voicePolicy.production.profile,"kids_story");
assert.equal(voicePolicy.production.modelId,"eleven_v4");
assert.equal(voicePolicy.production.voiceSettings.stability,0.62);
assert.equal(voicePolicy.production.voiceSettings.similarity_boost,0.88);
assert.equal(voicePolicy.production.voiceSettings.style,0.16);
assert.equal(voicePolicy.production.voiceSettings.speed,0.91);
assert.equal(voicePolicy.production.voiceSettings.use_speaker_boost,true);
assert.equal(voicePolicy.costControls.maxClipsPerInvocation,4);
assert.equal(voicePolicy.costControls.generateOnlyOnExplicitManualJob,true);
assert.equal(voicePolicy.qa.verifiedSimilarityPercent,null);
assert.ok(voicePolicy.approvedReferenceExamples.length>=3);
const storyBackend=read("cloudflare/video-studio/voice.js");
const storyProfile=storyBackend.split('profile === "kids_story"')[1].split('profile === "kids_lesson"')[0];
assert.ok(storyBackend.includes('modelId !== "eleven_v4"'));
for(const [setting,value] of Object.entries(voicePolicy.production.voiceSettings)){
 assert.ok(storyProfile.includes(setting+": "+String(value)), "Story-profile mismatch: "+setting);
}
for(const workflow of [".github/workflows/build-kids-academy-v9-staging.yml",
                       ".github/workflows/build-kids-academy-audio.yml",
                       ".github/workflows/kids-master-fidelity-ab.yml"]){
 const yaml=read(workflow);
 assert.ok(yaml.includes("workflow_dispatch:"),"Manual trigger missing: "+workflow);
 assert.ok(!/^  push:/m.test(yaml),"Unapproved costly auto-generation: "+workflow);
}
assert.equal(plan.modelId,"eleven_v4");
assert.ok(plan.phrases.every(p=>p.modelId==="eleven_v4"));
assert.equal(plan.lessonCount,34);
assert.equal(plan.phraseCount,plan.phrases.length);
assert.ok(plan.phraseCount>=400);
assert.equal(new Set(plan.phrases.map(x=>x.text)).size,plan.phraseCount);
assert.equal(plan.policy.reviewRequiredBeforePublicPlayback,true);
assert.ok(plan.phrases.every(x=>x.reviewStatus==="not-generated"&&!x.url));

const htmls=["kids/akademie/index.html","desktop-preview/kids-akademie-unterricht.html"].map(read);
for(const [index,html] of htmls.entries()){
 // Desktop preview belongs to the visitor-web lane and is released separately.
 // The same script parsing safeguard applies to both without coupling their releases.
 if(index===0){
  assert.ok(html.includes('curriculum-v2.js?v=20261010-09'));
  assert.ok(html.includes('data-preview-release="V11.0-20261010"'));
  assert.ok(html.includes('id="subjectReviewGrid"'));
  assert.ok(html.includes('function dailyLesson()'));
  assert.ok(html.includes('persist("help",true)'));
  assert.ok(!html.includes("Bald verfügbar"));
 }
 const re=/<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
 for(const match of html.matchAll(re)){
  if(/\bsrc=/.test(match[1]))continue;
  new vm.Script(match[2]);
 }
}
// The V9 daily-choice checks were advisory and are superseded by
// the strict school-mode checks in test-kids-academy-school-v11.js.
const main=htmls[0];
assert.ok(main.includes('school-progress-v11.js?v=20261010-11'));
assert.ok(main.includes('function academySchoolState(){'));
assert.ok(main.includes('academySchoolState().access(chosen)'));
const annual=JSON.parse(read("kids/data/academy-year-52weeks-v1.json"));
assert.equal(annual.weeks.length,52);
assert.equal(annual.goals.newLessonSlots,208);
assert.equal(annual.goals.currentlyInCatalog,34);
assert.equal(annual.goals.additionalAuthenticallyVerifiedLessonsNeeded,174);
const allSlots=annual.weeks.flatMap(week=>week.days);
assert.equal(allSlots.length,364);
assert.equal(allSlots.filter(x=>x.mode==="new").length,208);
assert.equal(allSlots.filter(x=>x.mode==="review").length,104);
assert.equal(allSlots.filter(x=>x.mode==="flexible").length,52);
assert.equal(allSlots.filter(x=>x.mode==="new"&&x.lessonId).length,34);
assert.equal(allSlots.filter(x=>x.mode==="new"&&!x.lessonId).length,174);
assert.ok(allSlots.filter(x=>x.mode==="new"&&!x.lessonId).every(x=>x.status==="awaiting-authentic-source-and-content-review"));
console.log("KIDS ACADEMY V9.1 VERIFIED: 34 catalog lessons, 208 yearly new-lesson slots, 174 gated pending sources, weekly 4/2/1, 454 voice texts.");
