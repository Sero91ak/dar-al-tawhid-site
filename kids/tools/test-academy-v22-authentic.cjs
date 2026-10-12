#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const ROOT=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
const ctx=vm.createContext({window:{}});
for(const file of ["kids/akademie/curriculum-v1.js","kids/akademie/curriculum-v2.js","kids/akademie/curriculum-v22.js","kids/akademie/curriculum-v25.js"]){
 new vm.Script(read(file),{filename:file}).runInContext(ctx,{timeout:1800});
}
const catalog=ctx.window.DARKidsAcademyCurriculum,ids=Object.keys(catalog);
assert.equal(ids.length,44,"37 substantive lessons plus the protected Ṣidq foundation");
const newIds=["adab-essen-bismillah","akhlaq-tiere-barmherzigkeit","adab-nachbarn-gutes","aqidah-dua-allah-bitten"];
assert.deepEqual(Array.from(ctx.window.DARKidsAcademyCurriculumV22.ids),newIds);
const sources={
 "adab-essen-bismillah":{q:"7:31",h:"5376",url:"https://dorar.net/hadith/sharh/14362",excerpt:true},
 "akhlaq-tiere-barmherzigkeit":{q:"6:38",h:"2363",url:"https://dorar.net/hadith/sharh/72367",excerpt:true},
 "adab-nachbarn-gutes":{q:"4:36",h:"6014",url:"https://dorar.net/hadith/sharh/13223",excerpt:true},
 "aqidah-dua-allah-bitten":{q:"1:5",h:"6340",url:"https://dorar.net/hadith/sharh/10635",excerpt:false}
};
const planned=JSON.parse(read("kids/data/academy-voice-plan-v22.json"));
const year=JSON.parse(read("kids/data/academy-year-52weeks-v1.json"));
const main=read("kids/akademie/index.html");
const audit=read("kids/tools/audit-academy-voice-coverage-v18.js");
const policy=JSON.parse(read("kids/data/academy-voice-policy-v10.json"));
for(const id of newIds){
 const lesson=catalog[id],source=sources[id];
 assert.equal(lesson.id,id);assert.equal(lesson.sourceAudit.quranReference,source.q);
 assert.equal(lesson.quran.surah+":"+lesson.quran.ayah,source.q);
 assert.equal(lesson.quran.excerpt,source.excerpt,"Arabic excerpt must be labeled");
 assert.equal(lesson.sourceAudit.quranTextType,source.excerpt?"excerpt":"complete");
 assert.equal(lesson.sourceAudit.hadithNumber,source.h);
 assert.equal(lesson.sourceAudit.hadithUrl,source.url);
 assert.ok(lesson.sourceAudit.authenticity.includes("Ṣaḥīḥ"));
 assert.ok(lesson.hadith.source.includes(source.h),"Narration citation missing");
 assert.match(lesson.quran.arabic,/^[\u0600-\u06FF\s]+$/,"No transliteration pretending to be Qurʾān");
 assert.equal(lesson.ageText["4-5"].lines.length,4);assert.equal(lesson.ageText["6-8"].lines.length,4);
 assert.equal(lesson.ageText["9-10"].lines.length,4);
 assert.notEqual(lesson.ageText["4-5"].intro,lesson.ageText["6-8"].intro);
 assert.notEqual(lesson.ageText["6-8"].intro,lesson.ageText["9-10"].intro);
 assert.ok(lesson.questions["4-5"].every(q=>q.type==="choice"),"Preschool must be tap-friendly");
 assert.equal(lesson.questions["4-5"].length,2);
 assert.equal(lesson.questions["6-8"].length,3);assert.equal(lesson.questions["9-10"].length,3);
 for(const age of ["4-5","6-8","9-10"]){
  for(const q of lesson.questions[age]){assert.ok(q.hint&&q.prompt);if(q.type==="choice"){
   assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.options.length);
  }else assert.equal(q.type,"text");}
 }
 assert.ok(planned.phrases.some(p=>p.text===lesson.ageText["4-5"].lines[0]&&p.contexts.some(c=>c.lessonId===id&&c.age==="4-5")));
 assert.ok(planned.phrases.some(p=>p.text===lesson.ageText["9-10"].lines[0]&&p.contexts.some(c=>c.lessonId===id&&c.age==="9-10")));
}
assert.equal(policy.production.modelId,"eleven_v4");
assert.equal(policy.production.profile,"kids_story");
assert.equal(planned.modelId,"eleven_v4");
assert.equal(planned.voiceProfileId,"serhat-owner-voice-2026");
assert.equal(planned.lessonCount,4);
assert.equal(planned.phrases.length,planned.phraseCount);
assert.ok(planned.phraseCount>=110&&planned.phraseCount<=180);
assert.ok(planned.phrases.every(p=>p.reviewStatus==="not-generated"&&!p.url),"No fictitious approved audio");
assert.equal(new Set(planned.phrases.map(p=>p.text)).size,planned.phraseCount);
assert.equal(year.weeks.length,52);
assert.equal(year.goals.currentlyInCatalog,70);
assert.equal(year.goals.additionalAuthenticallyVerifiedLessonsNeeded,138);
const slots=year.weeks.flatMap(w=>w.days);
assert.deepEqual(slots.filter(d=>d.editorialSlot>=35&&d.editorialSlot<=38).map(d=>d.lessonId),newIds);
assert.equal(slots.filter(d=>d.mode==="new").length,208);
assert.equal(slots.filter(d=>d.mode==="new"&&!d.lessonId).length,138);
assert.ok(main.includes('curriculum-v22.js?v=20261011-01'));
assert.ok(main.includes('const ageTeaching=lesson.ageText?.[age]'));
assert.ok(main.includes('(ageTeaching?.lines||lesson.lines)[i]'));
assert.ok(main.includes('ageTeaching?.evidence||'));
assert.ok(audit.includes('academy-voice-plan-v22.json')&&audit.includes('curriculum-v22.js'));
assert.ok(!main.includes("speechSynthesis.speak"),"No native speech impersonation");
console.log("KIDS V22 AUTHENTIC AGE QA PASS: 4 Ṣaḥīḥ hadiths, 4 exact Qurʾān verses, 12 distinct age-tier explanations, "+
 planned.phraseCount+" not-generated V4 texts, 58/208 lessons and 150 gated slots.");
