#!/usr/bin/env node
"use strict";
/* Source- and learning-invariants for TAWḤĪD KIDS. Not an independent human fatwā or ḥadīṯ-isnād review. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"../akademie");
const versions=["v1","v2","v22","v25","v26","v27","v28","v29"];
const context={window:{}},data=[];
for(const version of versions){
 const source=fs.readFileSync(path.join(root,"curriculum-"+version+".js"),"utf8");
 assert.ok(!source.includes("https://dorar.net/hadith/sharh/127209"),"Misleading secondary isnād link: "+version);
 vm.runInNewContext(source,context,{timeout:10000,filename:"curriculum-"+version+".js"});
 data.push(source);
}
const course=Object.values(context.window.DARKidsAcademyCurriculum),ages=["4-5","6-8","9-10"];
assert.equal(course.length,65,"Curriculum lesson count");
assert.equal(new Set(course.map(l=>l.id)).size,65,"Duplicate lesson IDs");
let questions=0,wudu=0,lessonsWithAgeText=0;
const map=new Map(course.map(l=>[l.id,l]));
for(const lesson of course){
 assert.ok(lesson.quran?.arabic?.trim(),"Missing Qurʾān Arabic: "+lesson.id);
 assert.ok(lesson.quran?.meaning?.trim(),"Missing Qurʾān meaning: "+lesson.id);
 assert.ok(Number.isInteger(lesson.quran.surah)&&Number.isInteger(lesson.quran.ayah),"Bad Quran reference: "+lesson.id);
 assert.ok(lesson.hadith?.source?.startsWith("Ṣaḥīḥ "),"Check ḥadīṯ source: "+lesson.id);
 assert.ok(lesson.hadith?.text?.trim(),"Missing Sunnah paraphrase: "+lesson.id);
 assert.ok(lesson.sourceAudit?.hadithUrl===undefined||/^https:\/\/(sunnah.com|dorar.net)\//.test(lesson.sourceAudit.hadithUrl),"Unrecognized Hadith source host: "+lesson.id);
 assert.notEqual(lesson.voiceApproved,true,"Audio must remain closed: "+lesson.id);
 if(lesson.ageText)lessonsWithAgeText++;
 for(const age of ages){
  assert.ok(lesson.ageText?.[age]?.lines?.length===4,"Missing age-specific teaching: "+lesson.id+" "+age);
  assert.equal(lesson.questions[age].length,age==="4-5"?2:3);
  const seen=new Set();
  for(const q of lesson.questions[age]){
   questions++;
   assert.ok(!seen.has(q.prompt),"Duplicate question within age: "+lesson.id+" "+age);
   seen.add(q.prompt);
   assert.ok(q.prompt?.trim()&&q.hint?.trim());
   assert.ok(q.type==="choice"||q.type==="text");
   if(q.type==="choice"){
    assert.ok(q.options?.length>=2&&q.options.length<=3);
    assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.options.length);
    assert.ok(q.explain?.trim());
   }else assert.ok(q.sample?.trim());
  }
 }
 if(lesson.quran.surah===5&&lesson.quran.ayah===6){
  wudu++;
  if(lesson.quran.arabic.includes("وَأَرْجُلَكُمْ")){
   assert.ok(lesson.quran.meaning.includes("Waschen der Füße"),"Wash feet clearly: "+lesson.id);
   assert.ok(lesson.quran.excerpt,"Partial verse 5:6 not labeled excerpt");
  }
 }
}
assert.equal(questions,520);
assert.equal(lessonsWithAgeText,65);
assert.equal(wudu,5);
assert.ok(map.get("aqidah-ikhlas-warum-gutes-tun").sourceAudit.hadithUrl.includes("/3429"),"Incorrect intention source");
assert.ok(map.get("adab-morgen-dhikr").sourceAudit.practiceNote.includes("kein verpflichtendes Pensum"),"Morning ḏikr obligation misrepresented");
assert.ok(map.get("aqidah-iman-die-engel").hadith.source.includes("8a"),"Missing Jibrīl primary support");
const inline=fs.readFileSync(path.join(root,"index.html"),"utf8");
assert.ok(inline.includes("const exercises="),"Eight intro Ṣidq questions missing: review separately");
console.log("PASS: 65 curriculum entries, 520 stable questions, three bands, 34 verse-reference categories, 5:6 foot washing, Ḥadīṯ intention-source correction, no new audio.");
console.log("LIMIT: automated structural/source-link checks cannot grade isnāds, tafsīr variants, complete Arabic diacritics or make a religious-fatwā certification.");
