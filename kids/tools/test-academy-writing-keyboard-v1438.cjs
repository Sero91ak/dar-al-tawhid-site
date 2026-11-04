#!/usr/bin/env node
"use strict";
/* Historical V1438 regression entry point, replaced with privacy-first
   KIDS Academy answer test. No browser permission or child data is touched. */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const page=read("kids/akademie/index.html"),portal=read("kids/kids-academy-portal-v1421.js");
assert.ok(!page.includes('id="answer"')&&!page.includes('id="openWrite"')&&!page.includes('id="openVoice"'),"No child writing controls may be rendered");
assert.ok(!page.includes('id="mic"')&&!page.includes('id="voicePlayback"'),"No child voice recording controls may be rendered");
for(const blocked of ["getUserMedia","MediaRecorder","beginVoiceRecording","finishRecording","kids-academy-writing-keyboard-v1438","mode(\"voice\")","mode(\"text\")"])
 assert.ok(!page.includes(blocked),"Child recording or free answer code remains: "+blocked);
assert.ok(page.includes('id="choices"')&&page.includes('id="check"')&&page.includes('id="choiceAudioHelp"'),"Button answers and listening must remain");

assert.ok(page.includes('function playRecitation(')&&page.includes('function speak(index,custom)'),'Teacher audio and Qurʾān playback must remain');
assert.ok(page.includes('const VERSION="academy-v4"')&&page.includes('function readDraft()')&&page.includes('function saveDraft('),"Existing child progress schema must remain");
assert.ok(page.includes('KIDS_LESSON_CAPSULE_RESTORE_V1446')&&page.includes('id="stageSurface"'),"Original scroll layout must remain");
assert.ok(!page.includes('lessonScrollport.appendChild(lessonActions)'),"Original lesson navigation must not be reparented");
new vm.Script(portal,{filename:"kids-academy-portal-v1421.js"});
const s=page.indexOf("function academySelectableQuestion(");
const e=page.indexOf("\nconst questions=()=>",s);
assert.ok(s>0&&e>s,"Runtime button adapter missing");
const ctx=vm.createContext({});
vm.runInContext(page.slice(s,e)+"\nglobalThis.convert=academySelectableQuestion;",ctx,{timeout:2500});
const convert=ctx.convert;
const scriptFiles=["curriculum-v1.js","curriculum-v2.js","curriculum-v22.js","curriculum-v25.js","curriculum-v26.js","curriculum-v27.js","curriculum-v28.js","curriculum-v29.js"];
const shared=vm.createContext({window:{},console});
for(const name of scriptFiles)vm.runInContext(read("kids/akademie/"+name),shared,{timeout:4500,filename:name});
const exercisesStart=page.indexOf("const exercises={");
const exercisesEnd=page.indexOf("\nlet id=",exercisesStart);
assert.ok(exercisesStart>0&&exercisesEnd>exercisesStart,"Inline Ṣidq questions missing");
vm.runInContext(page.slice(exercisesStart,exercisesEnd)+"\nglobalThis.inline=exercises;",shared);
const ages=["4-5","6-8","9-10"],lessons=Object.values(shared.window.DARKidsAcademyCurriculum||{});
assert.ok(lessons.length>=60,"Complete Academy curriculum not loaded");
let checked=0,adapted=0;
const oversized=[],writePrompts=[],writeHints=[];
function verify(q,lesson,age){
 const normalized=convert(q,lesson,age);checked++;
 if(normalized.options.some(v=>v.length>180))oversized.push({
  lessonId:lesson?.id||"sidq",age,question:q.prompt,
  longestOption:Math.max(...normalized.options.map(v=>v.length)),
  proposedCorrect:normalized.options[normalized.correct]});
 if(/\b(?:schreibe|tippe\s+ein|sprich\s+ein|formuliere\s+frei)\b/i.test(normalized.prompt))
  writePrompts.push({lessonId:lesson?.id||"sidq",age,prompt:normalized.prompt});
 if(/\b(?:schreibe|tippe\s+ein|sprich\s+ein)\b/i.test(normalized.hint||""))
  writeHints.push({lessonId:lesson?.id||"sidq",age,hint:normalized.hint});

 assert.equal(normalized.type,"choice","A child question has no button answer: "+lesson?.id+" "+age);
 assert.ok(Array.isArray(normalized.options)&&normalized.options.length>=2&&normalized.options.length<=5,"Missing selectable answers");
 assert.ok(Number.isInteger(normalized.correct)&&normalized.correct>=0&&normalized.correct<normalized.options.length,"Missing correct option");
 assert.ok(normalized.options.every(x=>typeof x==="string"&&x.trim()),"Blank button text");
 assert.equal(new Set(normalized.options.map(x=>x.trim())).size,normalized.options.length,"Duplicated button answers");
 if(q.type==="text"){
  adapted++;
  assert.equal(normalized.adaptedFromText,true,"Previous free text question must be editorially flagged");
  assert.equal(normalized.correct,0,"Existing answer model must be the canonical right option");
  const sourceModel=q.sample||q.explain||lesson?.sample||lesson?.goal;
  if(normalized.options[0]!==sourceModel){
   assert.ok(sourceModel.length>180&&lesson?.quran?.meaning,"Only long source comparisons may be shortened");
   assert.equal(normalized.options[0],String(lesson.quran.meaning).trim(),"Canonical Quran meaning must remain exact");
   assert.equal(normalized.explain,q.explain||sourceModel,"Full source context must remain in feedback");
   assert.ok(normalized.prompt.includes("Qurʾān"),"Short answer must ask which statement is from Quran");
  }else assert.equal(normalized.options[0],sourceModel,"Answer model must be preserved");
 }else assert.equal(normalized.correct,q.correct,"Previously graded choice must not change");
}
for(const lesson of lessons)for(const age of ages)for(const q of lesson.questions?.[age]||[])verify(q,lesson,age);
for(const age of ages)for(const q of shared.inline[age]||[])verify(q,null,age);
assert.equal(checked,528,"Existing 66 Academy lessons must retain 528 questions");
assert.equal(adapted,198,"All 195 modular and 3 Sidq typed questions must be adapted to buttons");
assert.equal(oversized.length,0,"No child answer button may exceed 180 characters");
console.log("PASS KIDS privacy and answer buttons: "+checked+" questions, "+adapted+" legacy open questions adapted; no child text entry or microphone; layout and progress preserved.");
console.log("EDITORIAL UX AUDIT: "+oversized.length+" oversized buttons, "+writePrompts.length+
 " obsolete writing prompts, "+writeHints.length+" obsolete writing hints.");
for(const row of oversized.slice(0,12))console.log("LONG_BUTTON_REVIEW "+JSON.stringify(row));
for(const row of writePrompts.slice(0,12))console.log("WRITE_PROMPT_REVIEW "+JSON.stringify(row));
for(const row of writeHints.slice(0,12))console.log("WRITE_HINT_REVIEW "+JSON.stringify(row));

