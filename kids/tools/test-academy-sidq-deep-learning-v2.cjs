#!/usr/bin/env node
"use strict";
/* Editorial pilot contract. It does not authorize publication or TTS spending. */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const data=JSON.parse(fs.readFileSync(path.resolve(__dirname,"../akademie/editorial-pilots/sidq-deep-learning-v2.json"),"utf8"));
assert.equal(data.lessonId,"sidq");
assert.equal(data.status,"editorial-draft-not-live");
assert.equal(data.immutable.audioGenerationsAllowed,false);
assert.equal(data.immutable.existingRecordsPreserved,true);
assert.equal(data.source.quran.surah,9);assert.equal(data.source.quran.ayah,119);
assert.equal(data.source.hadith.number,"2607a");
assert.ok(data.source.quran.arabic.includes("الصَّادِقِينَ"));
assert.ok(data.source.hadith.arabicExcerpt.includes("الصِّدْقَ"));
assert.equal(data.source.quran.recitationPolicy.includes("no synthesized TTS"),true);
assert.equal(data.pronunciation.generationStatus,"PENDING_APPROVAL_NO_CREDITS_SPENT");
assert.equal(Object.keys(data.ages).length,3);
const titles=[];
for(const [age,lesson] of Object.entries(data.ages)){
 assert.ok(["4-5","6-8","9-10"].includes(age));
 assert.equal(lesson.stages.length,5);
 assert.ok(lesson.goal.length>45);
 lesson.stages.forEach((stage,i)=>{
  assert.equal(stage.step,i+1);
  assert.ok(stage.teacher.length>40,"Missing teacher narrative "+age+"/"+i);
  assert.ok(stage.prompt.length>25,"Missing thinking prompt "+age+"/"+i);
  if(i===2)assert.equal(stage.hadithSource===undefined||stage.hadithSource==="Muslim 2607a",true);
 });
 const test=lesson.stages[3];
 assert.ok(test.options.length>=2);
 assert.ok(test.options.every(s=>s.length>=20));
 assert.ok(test.correctOption>=0&&test.correctOption<test.options.length);
 assert.ok(test.feedback.length>=25&&test.hint.length>=25);
 assert.ok(lesson.stages[4].teachBack.length>=25);
 titles.push(lesson.stages[3].prompt);
}
assert.equal(new Set(titles).size,3);
for(const gate of Object.values(data.releases))assert.equal(gate,false);
console.log("PASS: Ṣidq deep-learning draft 3 ages × 5 stages, 2 primary sources, 3 distinct problem-solving situations, no paid voice and no release claims.");
