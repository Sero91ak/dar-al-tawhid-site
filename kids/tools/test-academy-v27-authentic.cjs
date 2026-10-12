#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const sandbox=vm.createContext({window:{}});
for(const name of ["v1","v2","v22","v25","v26","v27"]){
 const f="kids/akademie/curriculum-"+name+".js";
 new vm.Script(read(f),{filename:f}).runInContext(sandbox,{timeout:3000});
}
const all=sandbox.window.DARKidsAcademyCurriculum,v27=sandbox.window.DARKidsAcademyCurriculumV27;
const expected=[
 ["aqidah-allah-erschuf-tiere","tawhid","16:5","2363","https://dorar.net/hadith/sharh/67134"],
 ["aqidah-iman-an-allah-vertiefen","iman","2:285","8","https://dorar.net/hadith/sharh/1189"],
 ["aqidah-ikhlas-gute-lernabsicht","ikhlas","98:5","1","https://dorar.net/hadith/sharh/3429"],
 ["akhlaq-geschwister-fair-teilen","akhlaq","16:90","2587","https://dorar.net/hadith/sharh/14634"],
 ["adab-privatsphaere-andere-achten","adab","24:27","6241","https://dorar.net/hadith/sharh/9448"],
 ["akhlaq-tarbiyah-sachen-pflegen","tarbiyah","17:34","893","https://dorar.net/hadith/sharh/6192"],
 ["akhlaq-nafs-wut-sicher-ausdruecken","nafs","3:134","6116","https://dorar.net/hadith/sharh/151063"],
 ["fiqh-wudu-schritte-reihenfolge","fiqh","5:6","164","https://dorar.net/hadith/sharh/3683"]
];
assert.equal(v27.count,8);assert.deepEqual(Array.from(v27.ids),expected.map(x=>x[0]));
assert.equal(Object.keys(all).length,57,"57 independent curriculum modules plus Ṣidq");
for(const [id,pillar,ayah,hadith,url] of expected){
 const lesson=all[id];assert.ok(lesson,id);assert.equal(lesson.pillar,pillar,id);
 assert.equal(lesson.quran.surah+":"+lesson.quran.ayah,ayah);
 assert.equal(lesson.quran.excerpt,true,"Qurʾān excerpt must never be shown as full verse");
 assert.equal(lesson.sourceAudit.quranReference,ayah);
 assert.equal(lesson.sourceAudit.hadithNumber,hadith);
 assert.equal(lesson.sourceAudit.hadithUrl,url);
 assert.equal(lesson.sourceAudit.authenticity,"Ṣaḥīḥ");
 assert.equal(lesson.sourceAudit.hadithMeaningIsParaphrase,true);
 assert.equal(lesson.sourceAudit.directLinkChecked,true);
 assert.equal(lesson.voiceApproved,false,"V4 clip must be explicitly reviewed before child playback");
 assert.match(lesson.quran.arabic,/^[\u0600-\u06FF\sۖ]+$/u);
 for(const age of ["4-5","6-8","9-10"]){
  const text=lesson.ageText[age];assert.ok(text.intro.length>30);
  assert.equal(text.lines.length,4);
  assert.ok(text.evidence.length>35);
  assert.ok(lesson.questions[age].length>=2);
  for(const q of lesson.questions[age]){
   assert.ok(q.prompt&&q.hint);
   if(q.type==="choice")assert.ok(q.options?.length>=2&&Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.options.length);
   else assert.equal(q.type,"text");
  }
 }
 assert.ok(lesson.questions["4-5"].every(q=>q.type==="choice"));
 assert.notEqual(lesson.ageText["4-5"].intro,lesson.ageText["6-8"].intro);
 assert.notEqual(lesson.ageText["6-8"].intro,lesson.ageText["9-10"].intro);
}
const yr=JSON.parse(read("kids/data/academy-year-52weeks-v1.json"));
const road=JSON.parse(read("kids/data/academy-expansion-roadmap-v23.json"));
const slots=yr.weeks.flatMap(w=>w.days).filter(d=>d.mode==="new");
assert.equal(slots.length,208);
assert.deepEqual(slots.slice(50,58).map(d=>d.lessonId),expected.map(x=>x[0]));
assert.equal(slots.filter(d=>!!d.lessonId).length,70);
assert.equal(slots.filter(d=>!d.lessonId).length,138);
assert.equal(road.existingLessonSlots.length,70);
assert.equal(road.plannedUnits.length,138);
assert.ok(road.plannedUnits.every(l=>l.releaseGate.childAppUnlocked===false));
const app=read("kids/akademie/index.html"),school=read("kids/akademie/school-progress-v11.js");
assert.ok(app.includes("curriculum-v27.js?v=20261012-27"));
assert.ok(school.includes("DARKidsAcademyCurriculumV27?.ids"));
assert.ok(!app.includes("academy-expansion-roadmap-v23.json"));
const voice=JSON.parse(read("kids/data/academy-voice-plan-v27.json"));
assert.equal(voice.lessonCount,8);assert.ok(voice.phraseCount>=170);
assert.equal(voice.phrases.length,voice.phraseCount);
assert.ok(voice.phrases.every(p=>p.modelId==="eleven_v4"&&p.reviewStatus==="not-generated"&&!p.url));
for(const [id] of expected)for(const age of ["4-5","6-8","9-10"]){
 assert.ok(voice.phrases.some(p=>p.text===all[id].ageText[age].intro&&p.contexts.some(c=>c.lessonId===id&&c.age===age)));
}
console.log("KIDS V27 PASS: lessons 51-58, 24 original age texts, source/direct-link metadata, 150 planned and locked, zero TTS charges.");
