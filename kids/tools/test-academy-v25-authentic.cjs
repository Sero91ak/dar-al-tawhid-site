#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const box=vm.createContext({window:{}});
for(const file of ["kids/akademie/curriculum-v1.js","kids/akademie/curriculum-v2.js","kids/akademie/curriculum-v22.js","kids/akademie/curriculum-v25.js"])
 new vm.Script(read(file),{filename:file}).runInContext(box,{timeout:2000});
const all=box.window.DARKidsAcademyCurriculum,v25=box.window.DARKidsAcademyCurriculumV25;
const seven=[
 ["aqidah-tawhid-recht-allahs","tawhid","51:56","2856","https://dorar.net/hadith/sharh/11568",false],
 ["aqidah-iman-sechs-grundlagen","iman","2:285","8","https://dorar.net/hadith/sharh/1189",true],
 ["aqidah-ikhlas-warum-gutes-tun","ikhlas","98:5","1","https://dorar.net/hadith/sharh/127209",true],
 ["akhlaq-wut-ruhig-bleiben","akhlaq","3:134","6114","https://dorar.net/hadith/sharh/151201",true],
 ["adab-erlaubnis-anklopfen","adab","24:27","6245","https://dorar.net/hadith/sharh/209262",true],
 ["akhlaq-tarbiyah-sanft-lernen","tarbiyah","20:132","69","https://dorar.net/hadith/sharh/61",true],
 ["akhlaq-nafs-gutes-herz","nafs","91:9","2564","https://dorar.net/hadith/sharh/207905",false]
];
assert.equal(Object.keys(all).length,44);
assert.equal(v25.count,7);
assert.deepEqual(Array.from(v25.ids),seven.map(x=>x[0]));
assert.deepEqual(Object.values(v25.pillars),seven.map(x=>x[1]));
for(const [id,pillar,ayah,hadith,url,excerpt] of seven){
 const x=all[id];assert.equal(x.id,id);assert.equal(x.pillar,pillar);
 assert.equal(x.quran.surah+":"+x.quran.ayah,ayah);assert.equal(x.quran.excerpt,excerpt);
 assert.equal(x.sourceAudit.quranTextType,excerpt?"excerpt":"complete");
 assert.equal(x.sourceAudit.hadithUrl,url);assert.equal(x.sourceAudit.hadithNumber,hadith);
 assert.match(x.hadith.source,new RegExp("Nr\\. "+hadith+"(?![0-9])"));
 assert.ok(x.hadith.text&&!x.hadith.text.includes("Er sagte wörtlich"),"German narration must stay clearly a paraphrase");
 assert.match(x.quran.arabic,/^[\u0600-\u06FF\s]+$/);
 assert.ok(x.sourceAudit.authenticity==="Ṣaḥīḥ");
 for(const age of ["4-5","6-8","9-10"]){
  assert.equal(x.ageText[age].lines.length,4,id+" "+age);
  assert.ok(x.ageText[age].intro&&x.ageText[age].evidence);
  const q=x.questions[age];assert.ok(q.length>=2);
  for(const question of q){
   assert.ok(question.prompt&&question.hint);
   if(question.type==="choice")assert.ok(question.options.length>=2&&question.correct>=0&&question.correct<question.options.length);
   else assert.equal(question.type,"text");
  }
 }
 assert.ok(x.questions["4-5"].every(q=>q.type==="choice"));
 assert.notEqual(x.ageText["4-5"].intro,x.ageText["6-8"].intro);
 assert.notEqual(x.ageText["6-8"].intro,x.ageText["9-10"].intro);
}
const voice=JSON.parse(read("kids/data/academy-voice-plan-v25.json"));
assert.equal(voice.lessonCount,7);
assert.equal(voice.modelId,"eleven_v4");
assert.equal(voice.voiceProfileId,"serhat-owner-voice-2026");
assert.ok(voice.phraseCount>=190);
assert.equal(voice.phraseCount,voice.phrases.length);
assert.equal(new Set(voice.phrases.map(x=>x.text)).size,voice.phraseCount);
assert.ok(voice.phrases.every(x=>x.reviewStatus==="not-generated"&&!x.url));
for(const [id] of seven){
 const x=all[id];for(const age of ["4-5","6-8","9-10"])
  assert.ok(voice.phrases.some(p=>p.text===x.ageText[age].intro&&p.contexts.some(c=>c.lessonId===id&&c.age===age)));
}
const year=JSON.parse(read("kids/data/academy-year-52weeks-v1.json"));
const slots=year.weeks.flatMap(w=>w.days).filter(d=>d.mode==="new");
assert.equal(slots.length,208);
assert.deepEqual(slots.filter(x=>x.editorialSlot>=39&&x.editorialSlot<=45).map(x=>x.lessonId),seven.map(x=>x[0]));
assert.equal(year.goals.currentlyInCatalog,58);assert.equal(year.goals.additionalAuthenticallyVerifiedLessonsNeeded,150);
assert.equal(slots.filter(x=>!x.lessonId).length,150);
assert.ok(slots.filter(x=>!x.lessonId).every(x=>x.status==="awaiting-authentic-source-and-content-review"));
assert.ok(read("kids/akademie/index.html").includes('curriculum-v25.js?v=20261011-01'));
assert.ok(read("kids/akademie/school-progress-v11.js").includes("DARKidsAcademyCurriculumV25?.ids"));
assert.ok(read("kids/tools/audit-academy-voice-coverage-v18.js").includes('academy-voice-plan-v25.json'));
console.log("KIDS ACADEMY V25 PASS: 7 new direct-Qurʾān + Ṣaḥīḥ source-checked lessons, 21 age lessons, "+voice.phraseCount+" untouched voice requests, 58/208 catalog, 150 gated.");
