#!/usr/bin/env node
"use strict";
/* V30 regression: zero TTS, zero child account writes, immutable school gating. */
const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict"),path=require("node:path");
const ROOT=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
const ctx=vm.createContext({window:{}});
for(const name of ["v1","v2","v22","v25","v26","v27","v28","v29","v30"]){
 const f="kids/akademie/curriculum-"+name+".js";
 new vm.Script(read(f),{filename:f}).runInContext(ctx,{timeout:4000});
}
new vm.Script(read("kids/akademie/school-progress-v11.js")).runInContext(ctx,{timeout:4000});
const curriculum=ctx.window.DARKidsAcademyCurriculum,pack=ctx.window.DARKidsAcademyCurriculumV30;
const ids=["adab-gespraechspartner-ausreden-lassen","akhlaq-tarbiyah-aufgaben-kleine-schritte","akhlaq-nafs-enttaeuschung-verarbeiten","fiqh-wudu-wasser-sparen"];
assert.equal(Object.keys(curriculum).length,69);
assert.deepEqual(Array.from(pack.ids),ids);
assert.equal(pack.voiceRecordingsApproved,false);
for(const id of ids){
 const l=curriculum[id];
 assert.equal(l.id,id);assert.equal(l.voiceApproved,false);
 assert.equal(l.sourceAudit.authenticity,"Ṣaḥīḥ");
 assert.equal(l.sourceAudit.hadithMeaningIsParaphrase,true);
 assert.equal(l.sourceAudit.directLinkChecked,true);
 assert.ok(l.sourceAudit.hadithUrl.startsWith("https://dorar.net/"));
 assert.ok(l.quran.arabic&&l.quran.ayah&&typeof l.quran.excerpt==="boolean");
 for(const age of ["4-5","6-8","9-10"]){
  assert.equal(l.ageText[age].lines.length,4);
  assert.ok(l.ageText[age].intro&&l.ageText[age].evidence);
  assert.ok(l.questions[age].length>=2);
  for(const q of l.questions[age]){assert.ok(q.prompt&&q.hint);if(q.type==="choice")assert.equal(q.correct,0)}
 }
}
const year=JSON.parse(read("kids/data/academy-year-52weeks-v1.json"));
const roadmap=JSON.parse(read("kids/data/academy-expansion-roadmap-v23.json"));
const slots=year.weeks.flatMap(w=>w.days).filter(d=>d.mode==="new");
assert.equal(year.weeks.length,52);assert.equal(slots.length,208);
assert.equal(slots.filter(d=>!!d.lessonId).length,70);
assert.deepEqual(slots.slice(66,70).map(d=>d.lessonId),ids);
assert.equal(year.goals.currentlyInCatalog,70);assert.equal(year.goals.additionalAuthenticallyVerifiedLessonsNeeded,138);
assert.equal(roadmap.existingLessonSlots.length,70);assert.equal(roadmap.plannedUnits.length,138);
assert.ok(roadmap.plannedUnits.every(x=>x.releaseGate.childAppUnlocked===false));
const topics={akhlaq:["sidq","akhlaq-sabr","akhlaq-amanah"],adab:["adab-salam","adab-worte","adab-respekt"],fiqh:["fiqh-taharah","fiqh-wudu","fiqh-salah"],aqidah:["aqidah-tawhid","aqidah-iman","aqidah-ikhlas"]};
for(const l of Object.values(curriculum))if(!topics[l.subject].includes(l.id))topics[l.subject].push(l.id);
const school=ctx.window.DARKidsAcademySchool,ordered=Array.from(school.sequence(topics));
assert.equal(ordered.length,70);assert.deepEqual(ordered.slice(-4),ids);
const s=school.evaluate({topics,now:new Date(2026,9,12,12)});
assert.equal(s.active,ordered[0]);assert.equal(s.access(ids[0]),"locked");
const html=read("kids/akademie/index.html"),offline=read("kids/item-offline-v1.js");
assert.ok(html.includes("curriculum-v30.js?v=20261012-30"));
assert.ok(html.includes("school-progress-v11.js?v=20261012-31"));
assert.ok(offline.includes("curriculum-v30.js?v=20261012-30"));
const voice=JSON.parse(read("kids/data/academy-voice-plan-v30.json"));
assert.equal(voice.lessonCount,4);assert.equal(voice.phraseCount,72);
assert.equal(voice.creditsUsed,0);
assert.ok(voice.phrases.every(p=>p.reviewStatus==="not-generated"&&!p.url&&p.voiceApproved===false));
console.log("KIDS V30 PASS: 70 lessons; 208 slots; 138 protected outlines; 12 age texts; 72 pending voice phrases; zero credits.");
