#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const ROOT=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
const sandbox=vm.createContext({window:{}});
new vm.Script(read("kids/akademie/curriculum-v1.js")).runInContext(sandbox);
new vm.Script(read("kids/akademie/answer-choice-only-v1.js")).runInContext(sandbox);
const lesson=sandbox.window.DARKidsAcademyCurriculum["akhlaq-amanah"];
const choices=sandbox.window.DARKidsAcademyChoiceOnlyV1;
assert.equal(lesson.quran.surah,23);
assert.equal(lesson.quran.ayah,8);
assert.match(lesson.hadith.source,/33/);
assert.equal(lesson.hadith.text,"Der Prophet ﷺ warnte davor, anvertraute Dinge zu verraten.");
const required={
 "6-8":{1:["Wie gehst du mit etwas um, das dir anvertraut wurde?",
   "Ich behandle es sorgfältig und gebe es zuverlässig zurück.",
   "Ich gebe es ohne Erlaubnis an andere weiter."]},
 "9-10":{
  1:["Wie zeigst du Amānah, wenn du jemandem etwas versprochen hast?",
     "Ich halte mein Versprechen und bin zuverlässig.",
     "Ich ignoriere das Versprechen, sobald es schwierig wird."],
  2:["Was lehren Qurʾān 23:8 und Sunnah über anvertraute Dinge?",
     "Wir sollen anvertraute Dinge schützen und unsere Versprechen einhalten.",
     "Anvertraute Dinge darf man ohne Rücksprache weitergeben."]
 }
};
for(const age of ["4-5","6-8","9-10"]){
 const source=lesson.questions[age];
 const projected=choices.project(lesson,age,source);
 assert.equal(projected.length,source.length);
 for(let i=0;i<projected.length;i++){
  const q=projected[i];
  assert.equal(q.type,"choice","No child writing/speaking allowed");
  assert.equal(q.options.length,2);
  assert.ok(q.options.every(x=>x.length>5&&x.length<=180));
  assert.equal(q.correct,0);
  assert.ok(!/müssen genau denselben Wortlaut|Gegenteil des Gelernten/.test(q.options.join(" ")),
   "No generic editorial filler in child answers");
  if(required[age]?.[i]){
   assert.equal(q.prompt,required[age][i][0]);
   assert.equal(q.options[0],required[age][i][1]);
   assert.equal(q.options[1],required[age][i][2]);
   assert.equal(q.approvedForAudio,false);
  }
 }
 assert.equal(choices.project(lesson,age,source),projected,"Stable child memory reference");
}
assert.equal(lesson.questions["6-8"][1].type,"text","Source never mutated");
assert.equal(lesson.questions["9-10"][1].type,"text","Source never mutated");
assert.equal(lesson.questions["9-10"][2].type,"text","Source never mutated");
console.log("AMANAH CHOICE QA PASS: three age bands, Quran 23:8, Bukhari 33, exactly three child adaptations, no microphone/typing");
