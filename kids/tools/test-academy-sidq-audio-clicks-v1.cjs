#!/usr/bin/env node
"use strict";
/* Actual child "Hören" button -> exact canonical recording tests.
 * This test never synthesizes, uploads or publishes audio; it detects missing
 * on-click keys and disallows unrelated editorial/source scripts.
 */
const assert=require("node:assert/strict");
const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const ROOT=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
const page=read("kids/akademie/index.html");
const sourcePlan=JSON.parse(read("kids/data/academy-sidq-voice-plan-v18.json"));
const pub=JSON.parse(read("kids/data/academy-audio.json"));
const glossaryPlan=JSON.parse(read("kids/data/academy-vocabulary-voice-plan-v24.json"));
const sandbox=vm.createContext({window:{}});
new vm.Script(read("kids/akademie/term-coach-v24.js"),{filename:"term-coach-v24.js"}).runInContext(sandbox);
new vm.Script(read("kids/akademie/answer-choice-only-v1.js"),{filename:"answer-choice-only-v1.js"}).runInContext(sandbox);
const coach=sandbox.window.DARKidsAcademyTermCoach;
const choiceOnly=sandbox.window.DARKidsAcademyChoiceOnlyV1;
const srcStart=page.indexOf("const exercises={");
const srcEnd=page.indexOf("\n};",srcStart);
assert.ok(srcStart>0&&srcEnd>srcStart);
new vm.Script(page.slice(srcStart,srcEnd+3)+"\nthis.__sidqExercises=exercises;").runInContext(sandbox);
const exercises=sandbox.__sidqExercises,ages=["4-5","6-8","9-10"];
assert.deepEqual(Object.keys(exercises),ages);
const lesson={id:"sidq",title:"Ṣidq – Wahrhaftigkeit",topic:"Wahrhaftigkeit",lead:"Wahrhaftigkeit verstehen",
 quran:{label:"Qurʾān 9:119"},hadith:{text:"Ṣidq",source:"Ṣaḥīḥ Muslim 2607a"}};
const voiceRecords=new Set(Object.keys(pub.entries||{}));
const missing=[];
for(const age of ages){
 const projected=choiceOnly.project(lesson,age,exercises[age]);
 for(const q of projected){
  assert.equal(q.type,"choice","Every visible answer is selectable, never a text field");
  assert.ok(!q.prompt.includes("Welche Aussage verbindet Qurʾān und Sunnah zum Thema"),
   "No generic fake source question in Ṣidq");
  assert.ok(!q.options.some(x=>x.includes("Qurʾān-Vers und der Ḥadīṯ müssen genau denselben Wortlaut")),
   "Remove unrelated artificial source-response filler");
  if(!voiceRecords.has(q.prompt))missing.push({kind:"question",age,text:q.prompt});
  for(let i=0;i<q.options.length;i++){
   const text="Antwort "+(i+1)+": "+q.options[i];
   if(!voiceRecords.has(text))missing.push({kind:"answer",age,text});
  }
 }
 const school=coach.termsFor(lesson,age,7,"lesson").map(x=>x.id);
 assert.ok(school.includes("sidq"),"Child's classroom must explain Ṣidq");
 assert.ok(!school.includes("quran")&&!school.includes("sunnah"),
  "Source terms must not be injected into the unrelated explanation card");
 const source=coach.termsFor(lesson,age,7,"sources").map(x=>x.id);
 assert.ok(source.includes("quran")&&source.includes("sunnah"),
  "Both Qurʾān and Sunnah explanations are available on the source page");
 for(const name of ["sidq","quran","sunnah"]){
  const item=coach.entries.find(t=>t.id===name);
  assert.ok(item);
  const text=coach.phrase(item,age);
  assert.ok(glossaryPlan.phrases.some(x=>x.text===text),
   "Missing canonical age-specific glossary voice text "+name+"/"+age);
  if(!voiceRecords.has(text))missing.push({kind:"glossary",termId:name,age,text});
 }
}
assert.ok(page.includes('speak(3,["Antwort "+(i+1)+": "+t])'),
 "Voice index must remain the ORIGINAL recording ID after choices rotate");
assert.ok(!page.includes('speak(3,["Antwort "+(visibleIndex+1)+": "+t])'),
 "Never request nonexistent shuffled answer ID");
assert.ok(page.includes('const spokenProfileAddress=gender==="girl"?"Liebe Schwester.":"Lieber Bruder."'),
 "Real child profile names must not invent unrecorded greeting audio");
assert.ok(page.includes('focusPieces(4)[focusPages[4]].querySelector("p").textContent'),
 "Recap must not read numbered headings in place of recorded paragraph");
assert.ok(page.includes('{...options,section:"sources"}'),
 "Source glossary must use only evidence-related words");
const glossaryCode=read("kids/akademie/term-coach-v24.js");
assert.ok(!glossaryCode.includes('source.textContent="Lernbezug: "'),
 "Never display editorial source review boilerplate to children");
assert.equal(sourcePlan.phraseCount,57);
const fromPlan=sourcePlan.phrases.map(x=>x.text);
assert.ok(!missing.some(x=>x.kind==="answer"&&fromPlan.includes(x.text)),
 "An already recorded canonical answer must NEVER be falsely classified missing");
// A release must be atomic: exactly 14 missing before import or exactly zero
// missing after the 14 SHA-verified V4 binaries have been imported.
assert.ok([0,14].includes(new Set(missing.map(x=>x.text)).size),
 "Ṣidq playback cannot be partially published or lose a recorded child text");
const grouped={question:0,answer:0,glossary:0};
for(const x of new Map(missing.map(x=>[x.text,x])).values())grouped[x.kind]++;
if(missing.length){
 assert.deepEqual(grouped,{question:1,answer:4,glossary:9},
  "The approved pending Ṣidq gap set must remain exactly 1+4+9");
}else{
 assert.equal(Object.values(pub.entries).filter(x=>x.sourceLessonId==="sidq").length,72,
  "14 actual V4 click audios must be present before marking Ṣidq click coverage complete");
}
console.log(JSON.stringify({
 status:"PASS",scope:"sidq",ages,
 missingVisibleAudioTextCount:missing.length,
 missingByType:Object.fromEntries(["question","answer","glossary"].map(k=>[k,missing.filter(x=>x.kind===k).length])),
 pendingUniqueVoiceTexts:[...new Set(missing.map(x=>x.text))].length,
 globalOwnerFallbackEnabled:false,
 warning:"Missing clips require real signed-generation media import and SHA-256 verification before publication"
}));
