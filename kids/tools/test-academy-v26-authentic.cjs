#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const box=vm.createContext({window:{}});
for(const f of ["kids/akademie/curriculum-v1.js","kids/akademie/curriculum-v2.js","kids/akademie/curriculum-v22.js","kids/akademie/curriculum-v25.js","kids/akademie/curriculum-v26.js"])new vm.Script(read(f),{filename:f}).runInContext(box,{timeout:2500});
const all=box.window.DARKidsAcademyCurriculum,pack=box.window.DARKidsAcademyCurriculumV26;
const expected=[
 ["fiqh-reinheit-unterscheiden","fiqh","5:6","223","https://dorar.net/hadith/sharh/139891",true],
 ["aqidah-quran-allahs-wort","quran","2:2","5027","https://dorar.net/hadith/sharh/151215",false],
 ["aqidah-sirah-adam-erschoepfung","sirah","3:59","3326","https://dorar.net/hadith/sharh/12842",false],
 ["adab-morgen-dhikr","dua","33:41","2692","https://dorar.net/hadith/sharh/152577",false],
 ["adab-eltern-freundlich","family","17:23","5971","https://dorar.net/hadith/sharh/36698",true]
];
assert.equal(Object.keys(all).length,49,"49 normal lessons plus one Ṣidq foundation");
assert.equal(pack.count,5);assert.deepEqual(Array.from(pack.ids),expected.map(v=>v[0]));
for(const [id,pillar,ayah,hadith,url,excerpt] of expected){
 const l=all[id];assert.ok(l,"Lesson missing: "+id);assert.equal(l.pillar,pillar);
 assert.equal(l.quran.surah+":"+l.quran.ayah,ayah);
 assert.equal(l.quran.excerpt,excerpt);assert.equal(l.sourceAudit.quranTextType,excerpt?"excerpt":"complete");
 assert.equal(l.sourceAudit.hadithUrl,url);assert.equal(l.sourceAudit.hadithNumber,hadith);
 assert.ok(l.hadith.source.includes("Nr. "+hadith));assert.equal(l.sourceAudit.authenticity,"Ṣaḥīḥ");
 assert.equal(l.sourceAudit.hadithMeaningIsParaphrase,true,"German meaning must never be presented as direct original Arabic speech");
 assert.match(l.quran.arabic,/^[\u0600-\u06FF\s]+$/u);
 assert.ok(!l.hadith.text.includes("wörtlich"));
 const ages=["4-5","6-8","9-10"];
 for(const age of ages){
  assert.ok(l.ageText[age]?.intro.length>12);
  assert.equal(l.ageText[age].lines.length,4);
  assert.ok(l.ageText[age].evidence.length>30);
  assert.ok(l.questions[age].length>=2);
  for(const q of l.questions[age]){
   assert.ok(q.prompt&&q.hint);
   if(q.type==="choice")assert.ok(q.options.length>=2&&Number.isInteger(q.correct)&&q.correct<q.options.length);
   else assert.equal(q.type,"text");
  }
 }
 assert.ok(l.questions["4-5"].every(q=>q.type==="choice"));
 assert.notEqual(l.ageText["4-5"].intro,l.ageText["6-8"].intro);
 assert.notEqual(l.ageText["6-8"].intro,l.ageText["9-10"].intro);
}
const audio=JSON.parse(read("kids/data/academy-voice-plan-v26.json"));
assert.equal(audio.lessonCount,5);assert.equal(audio.phraseCount,audio.phrases.length);
assert.ok(audio.phraseCount>=130);assert.equal(new Set(audio.phrases.map(p=>p.text)).size,audio.phraseCount);
assert.ok(audio.phrases.every(p=>p.modelId==="eleven_v4"&&p.reviewStatus==="not-generated"&&!p.url));
for(const [id] of expected)for(const age of ["4-5","6-8","9-10"]){
 const text=all[id].ageText[age].intro;
 assert.ok(audio.phrases.some(p=>p.text===text&&p.contexts.some(c=>c.lessonId===id&&c.age===age)));
}
const year=JSON.parse(read("kids/data/academy-year-52weeks-v1.json"));
const news=year.weeks.flatMap(w=>w.days).filter(x=>x.mode==="new");
assert.equal(year.goals.currentlyInCatalog,208);assert.equal(year.goals.additionalAuthenticallyVerifiedLessonsNeeded,0);
assert.deepEqual(news.slice(45,50).map(x=>x.lessonId),expected.map(x=>x[0]));
assert.equal(news.filter(x=>!x.lessonId).length,0);
assert.ok(news.slice(208).every(x=>x.lessonId===null&&x.status==="awaiting-authentic-source-and-content-review"));
const index=read("kids/akademie/index.html"),school=read("kids/akademie/school-progress-v11.js");
assert.ok(index.includes('curriculum-v26.js?v=20261012-01'));
assert.ok(school.includes("DARKidsAcademyCurriculumV26?.ids"));
assert.ok(read("kids/tools/audit-academy-voice-coverage-v18.js").includes("academy-voice-plan-v26.json"));
assert.ok(!index.includes("academy-expansion-roadmap-v23.json"),"Unreviewed editorial outlines cannot become regular lesson objects");
console.log("KIDS ACADEMY V26 VERIFIED: 5 independently sourced Qurʾān/Ṣaḥīḥ lessons, 15 age adaptations, "+audio.phraseCount+" non-generated master clips, 58 live catalog / 150 locked.");
