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
  assert.ok(html.includes('data-preview-release="V17.0-voice-sandbox-20261011"'));
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

/* Global Academy answer-mode regression: current 66 public lessons (65 JS +
 * inline Ṣidq), including the 6–8 Salām screen, remain selectable only.
 * This does not unlock any editorial V31 lessons or alter learning records. */
const choiceContext=vm.createContext({window:{}});
for(const version of ["v1","v2","v22","v25","v26","v27","v28","v29"]){
 const filename="kids/akademie/curriculum-"+version+".js";
 new vm.Script(read(filename),{filename}).runInContext(choiceContext);
}
const answerAdapter="kids/akademie/answer-choice-only-v1.js";
new vm.Script(read(answerAdapter),{filename:answerAdapter}).runInContext(choiceContext);
const lessons65=choiceContext.window.DARKidsAcademyCurriculum;
const choiceOnly=choiceContext.window.DARKidsAcademyChoiceOnlyV1;
assert.equal(Object.keys(lessons65).length,65);
assert.equal(choiceOnly.noChildTextOrVoiceCollection,true);
let totalChoiceQuestions=0,adaptedTextQuestions=0;
for(const lesson of Object.values(lessons65))for(const age of ["4-5","6-8","9-10"]){
 const raw=lesson.questions[age],projected=choiceOnly.project(lesson,age,raw);
 assert.equal(projected.length,raw.length);
 assert.equal(choiceOnly.project(lesson,age,raw),projected,"Stable projection cache");
 for(let index=0;index<raw.length;index++){
  const question=projected[index];
  totalChoiceQuestions++;
  assert.equal(question.type,"choice");
  assert(Array.isArray(question.options)&&question.options.length>=2);
  assert(Number.isInteger(question.correct)&&question.correct>=0&&question.correct<question.options.length);
  assert(question.options.every(s=>typeof s==="string"&&s.length>0&&s.length<=180));
  assert.equal(new Set(question.options).size,question.options.length);
  if(raw[index].type==="text"){
   adaptedTextQuestions++;
   assert.equal(question.adaptedFromText,true);
   assert.equal(question.approvedForAudio,false);
   assert.equal(question.needsHumanEditorialReview,true);
   assert.equal(raw[index].type,"text","Canonical source remains untouched");
  }else assert.equal(question,raw[index],"Existing approved choice preserved");
 }
}
assert.equal(totalChoiceQuestions,520);
assert.equal(adaptedTextQuestions,195);
const sidqStart=main.indexOf("const exercises={"),sidqEnd=main.indexOf("\nlet id=",sidqStart);
assert(sidqStart>0&&sidqEnd>sidqStart);
new vm.Script(main.slice(sidqStart,sidqEnd)+"\nglobalThis.sidq=exercises;").runInContext(choiceContext);
const sidq=choiceContext.sidq;
let sidqAdapted=0;
for(const age of ["4-5","6-8","9-10"]){
 const projected=choiceOnly.project(null,age,sidq[age]);
 assert(projected.every(q=>q.type==="choice"));
 sidqAdapted+=projected.filter(q=>q.adaptedFromText).length;
}
assert.equal(sidqAdapted,3);
const salam=choiceOnly.project(lessons65["adab-salam"],"6-8",lessons65["adab-salam"].questions["6-8"]);
assert.equal(salam.length,3);
assert(salam.every(q=>q.type==="choice"));
assert.match(salam[0].prompt,/As-Salāmu/);
assert.equal(salam[0].options[salam[0].correct],"Ich grüße freundlich zurück.");
assert(!main.includes('id="answerOptions"')&&!main.includes('id="answerExtra"'));
assert(!main.includes('id="openWrite"')&&!main.includes('id="openVoice"'));
assert(!main.includes('<textarea id="answer"')&&!main.includes('id="voicePlayback"'));
assert(!main.includes('getUserMedia')&&!main.includes('MediaRecorder'));
assert(!main.includes('function beginVoiceRecording('));
assert(!main.includes('data-academy-typing="true"'));
assert(main.includes('function mode(){'));
assert(main.includes('mode("choices");'));
assert(main.includes('DARKidsAcademyChoiceOnlyV1.project'));
assert(main.includes('answer-choice-only-v1.js?v=20261105-02'));
assert(main.includes('id="kids-academy-choice-only-v2"'));
assert(!main.includes('$("#answerModeCaption").textContent=q.type==="choice"?'));
console.log("PASS: 65 released curriculum lessons + Ṣidq: 523 choice questions; all 198 text prompts projected without editing source, including 6–8 Salām.");

assert.ok(main.includes('school-progress-v11.js?v=20261012-30'));
assert.ok(main.includes('function academySchoolState(){'));
assert.ok(main.includes('academySchoolState().access(chosen)'));
const pilot=JSON.parse(read("kids/data/academy-v12-audio-pilot-request.json"));
assert.equal(pilot.modelId,"eleven_v4");
assert.equal(pilot.voiceSettingsProfile,"kids_story");
assert.equal(pilot.maxClips,4);
assert.equal(pilot.maxPreparedCharacters,420);
assert.equal(pilot.stagingOnly,true);
assert.equal(pilot.exactPhrases.length,4);
const academyHtml=read("kids/akademie/index.html");
assert.ok(!academyHtml.includes('pilot-audio-v13.js?v=20261010-voicefix-v16'),"Visitor Academy must not load unapproved pilot audio");
assert.ok(!academyHtml.includes('data-academy-pilot="0"'),"Visitor Academy must not contain QA pilot buttons");

// The standalone academy header must not be part of the home/subject scrollport.
const academyFixedShell='body:not([data-academy-view="lesson"]):not([data-embedded="true"])';
assert.ok(academyHtml.includes('html:has('+academyFixedShell+')'));
assert.ok(academyHtml.includes(academyFixedShell+' > main.wrap > .academy-header.kids-detail-appbar'));
assert.ok(academyHtml.includes(academyFixedShell+' > main.wrap > #academyHome.academy-home:not([hidden])'));
assert.ok(academyHtml.includes(academyFixedShell+' > main.wrap > #academySubject.subject-detail:not([hidden])'));
assert.ok(academyHtml.includes('overscroll-behavior-y:contain!important;-webkit-overflow-scrolling:touch'));
assert.ok(academyHtml.includes('function scrollAcademyViewTop(){'));
assert.equal(academyHtml.split('updateAcademyAppbar();scrollAcademyViewTop()').length-1,3);
// Existing focus lesson keeps its own stageSurface-only scrolling.
assert.ok(academyHtml.includes('body[data-academy-view="lesson"] #lessonMain #stageSurface'));
// Full-bleed hero regression: the scrollport must not clip 100vw imagery.
assert.ok(academyHtml.includes("V7.6.3 · Full-bleed academy covers"));
assert.ok(academyHtml.includes("width:100vw!important;min-width:100vw!important;max-width:100vw!important;"));
assert.ok(academyHtml.includes("margin-left:calc(50% - 50vw)!important;"));
assert.ok(academyHtml.includes("--academy-scroll-inset-left:max(12px,env(safe-area-inset-left,0px))"));
assert.ok(academyHtml.includes("padding-left:max(var(--academy-scroll-inset-left),calc((100vw - 980px)/2))!important;"));
assert.ok(academyHtml.includes('body[data-profile="girl"] .academy-home > .overview-hero::after'));
assert.ok(academyHtml.includes("body .academy-home > .overview-hero::before"));
assert.ok(academyHtml.includes('body:not([data-academy-view="lesson"]):not([data-embedded="true"]) > main.wrap{\\n overflow:visible!important;'.replace('\\n','\n')));
assert.ok(academyHtml.includes('background:linear-gradient(to bottom,transparent 0%,var(--base) 100%)!important;'));
assert.ok(academyHtml.includes("isAcademyStoryMaster"));
assert.ok(academyHtml.includes('entry.modelId==="eleven_v4"'));
assert.ok(academyHtml.includes('setTimeout(resolve,9000)'));
const ownerScript=read("kids/owner-voice.js");
assert.ok(ownerScript.includes('get("voicePilot")==="1"'));
assert.ok(ownerScript.includes('entry.approvedForPlayback===false'));
const annual=JSON.parse(read("kids/data/academy-year-52weeks-v1.json"));
assert.equal(annual.weeks.length,52);
assert.equal(annual.goals.newLessonSlots,208);
assert.ok(Number.isInteger(annual.goals.currentlyInCatalog)&&annual.goals.currentlyInCatalog>=58&&annual.goals.currentlyInCatalog<=208);
assert.equal(annual.goals.additionalAuthenticallyVerifiedLessonsNeeded,208-annual.goals.currentlyInCatalog);
const allSlots=annual.weeks.flatMap(week=>week.days);
assert.equal(allSlots.length,364);
assert.equal(allSlots.filter(x=>x.mode==="new").length,208);
assert.equal(allSlots.filter(x=>x.mode==="review").length,104);
assert.equal(allSlots.filter(x=>x.mode==="flexible").length,52);
assert.equal(allSlots.filter(x=>x.mode==="new"&&x.lessonId).length,annual.goals.currentlyInCatalog);
assert.equal(allSlots.filter(x=>x.mode==="new"&&!x.lessonId).length,annual.goals.additionalAuthenticallyVerifiedLessonsNeeded);
assert.ok(allSlots.filter(x=>x.mode==="new"&&!x.lessonId).every(x=>x.status==="awaiting-authentic-source-and-content-review"));
console.log(`KIDS ACADEMY V9.1+V22 VERIFIED: ${annual.goals.currentlyInCatalog} catalog lessons, 208 yearly new-lesson slots, ${annual.goals.additionalAuthenticallyVerifiedLessonsNeeded} gated pending sources, weekly 4/2/1, legacy V9 voice plan preserved.`);

// Creator voice preview must never overwrite or impersonate a real child account.
require("./test-kids-academy-creator-voice-sandbox-v17.js");
