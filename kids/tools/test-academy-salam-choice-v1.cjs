#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const ROOT=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
const sandbox=vm.createContext({window:{}});
new vm.Script(read("kids/akademie/curriculum-v1.js")).runInContext(sandbox);
new vm.Script(read("kids/akademie/answer-choice-only-v1.js")).runInContext(sandbox);
const lesson=sandbox.window.DARKidsAcademyCurriculum["adab-salam"];
const choices=sandbox.window.DARKidsAcademyChoiceOnlyV1;
assert.equal(lesson.quran.surah,4);
assert.equal(lesson.quran.ayah,86);
assert.match(lesson.hadith.source,/54a/);
const full="As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh";
const expected={
 "6-8":{1:["Wie antwortest du auf den islamischen Friedensgruß?",
   "Ich sage: Wa ʿalaykumu s-salām wa raḥmatullāhi wa barakātuh.",
   "Ich ignoriere den Gruß absichtlich."]},
 "9-10":{
  1:["Warum verbreiten wir den Salām untereinander?",
   "Wir wünschen Frieden und begegnen einander freundlich und respektvoll.",
   "Wir grüßen nur, wenn wir dafür eine Belohnung von Menschen bekommen."],
  2:["Was lehren Qurʾān 4:86 und die Sunnah über den Friedensgruß?",
   "Wir beantworten den Gruß mindestens gleichwertig und verbreiten den Salām.",
   "Einen freundlichen Gruß soll man absichtlich unbeantwortet lassen."]
 }
};
for(const age of ["4-5","6-8","9-10"]){
 const original=lesson.questions[age],out=choices.project(lesson,age,original);
 assert.equal(out.length,original.length);
 assert.ok(out[0].prompt.includes(full),"Never remove or shorten the full spoken Salām");
 for(let i=0;i<out.length;i++){
  const q=out[i];
  assert.equal(q.type,"choice");
  assert.equal(q.correct,0);
  assert.equal(q.options.length,2);
  assert.ok(q.options.every(x=>x.length>=5&&x.length<=180));
  assert.ok(!q.options.some(x=>/müssen genau denselben Wortlaut|Gegenteil des Gelernten/.test(x)));
  if(expected[age]?.[i]){
   assert.equal(q.prompt,expected[age][i][0]);
   assert.equal(q.options[0],expected[age][i][1]);
   assert.equal(q.options[1],expected[age][i][2]);
   assert.equal(q.approvedForAudio,false,"Editorial flag is not a substitute for actual billed audio");
  }
 }
 assert.equal(choices.project(lesson,age,original),out,"Child progress context must be stable");
}
for(const age of ["6-8","9-10"])assert.equal(lesson.questions[age][1].type,"text","Source editorial curriculum must remain untouched");
console.log("SALAM AGE-CHOICES PASS: Quran 4:86, Sahih Muslim 54a, full Arabic Salām, 3 age tiers, no writing/speaking");
