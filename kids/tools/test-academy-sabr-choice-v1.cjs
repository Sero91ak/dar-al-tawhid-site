#!/usr/bin/env node
"use strict";
// Read-only Ṣabr age-specific projected lesson test. No paid audio.
const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const path=require("node:path");
const ROOT=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
const sandbox=vm.createContext({window:{}});
new vm.Script(read("kids/akademie/curriculum-v1.js")).runInContext(sandbox);
new vm.Script(read("kids/akademie/answer-choice-only-v1.js")).runInContext(sandbox);
const lesson=sandbox.window.DARKidsAcademyCurriculum["akhlaq-sabr"];
const choice=sandbox.window.DARKidsAcademyChoiceOnlyV1;
assert.equal(lesson.quran.surah,2);
assert.equal(lesson.quran.ayah,153);
assert.match(lesson.hadith.source,/1469/);
const required={
 "6-8":{
  1:"Wie kannst du Geduld im Alltag zeigen?"
 },
 "9-10":{
  1:"Was zeigt Geduld, wenn etwas nicht sofort gelingt?",
  2:"Was lehren Qurʾān 2:153 und der Ḥadīṯ über Geduld?"
 }
};
for(const age of ["4-5","6-8","9-10"]){
 const originals=lesson.questions[age];
 const output=choice.project(lesson,age,originals);
 assert.equal(output.length,originals.length);
 assert.ok(output.every(q=>q.type==="choice"&&q.correct===0&&q.options.length>=2));
 for(let i=0;i<output.length;i++){
  const q=output[i];
  assert.ok(q.prompt.length>6&&q.options.every(s=>s.length>5&&s.length<=180));
  assert.ok(!q.options.some(s=>/müssen genau denselben Wortlaut|Gegenteil des Gelernten|Aussage passt nicht zum/.test(s)),
   "Unrelated source or editorial filler cannot be shown to children");
  if(required[age]?.[i]){
   assert.equal(q.prompt,required[age][i]);
   assert.equal(q.approvedForAudio,false,
    "Pre-publication Ṣabr edits must not pretend new V4 clips exist");
  }
  assert.equal(originals[i].type,i===0?"choice":originals[i].type,
   "Projection must not change canonical curriculum");
 }
}
assert.equal(lesson.questions["9-10"][2].type,"text");
const again=choice.project(lesson,"9-10",lesson.questions["9-10"]);
assert.ok(again===choice.project(lesson,"9-10",lesson.questions["9-10"]),
 "Projection must be stable for saved review sessions");
console.log("SABR CHOICE QA PASS: 3 age bands, 3 real child-specific adapted questions, canonical sources intact, no synthetic audio");
