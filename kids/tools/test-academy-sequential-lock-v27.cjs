#!/usr/bin/env node
"use strict";
/* Immutable Kids learning-order regression: curriculum, locked upcoming lessons,
 * completion of all quiz questions, stale draft bypass, and owner reading archive.
 * No network, account changes, TTS or release approval.
 */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const ROOT=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
const scripts=["v1","v2","v22","v25","v26","v27","v28","v29","v30","v31","v32","v33","v34","v35","v36","v37","v38"].map(x=>"kids/akademie/curriculum-"+x+".js");
const sandbox={window:{}};vm.createContext(sandbox);
for(const p of scripts)new vm.Script(read(p),{filename:p}).runInContext(sandbox,{timeout:20000});
new vm.Script(read("kids/akademie/school-progress-v11.js")).runInContext(sandbox,{timeout:4000});
const curriculum=sandbox.window.DARKidsAcademyCurriculum;
assert.equal(Object.keys(curriculum).length,207);
const topics={akhlaq:["sidq","akhlaq-sabr","akhlaq-amanah"],adab:["adab-salam","adab-worte","adab-respekt"],fiqh:["fiqh-taharah","fiqh-wudu","fiqh-salah"],aqidah:["aqidah-tawhid","aqidah-iman","aqidah-ikhlas"]};
for(const item of Object.values(curriculum)){
 const group=topics[item.subject];assert.ok(group,"Unknown subject "+item.subject);
 if(!group.includes(item.id))group.push(item.id);
 for(const age of ["4-5","6-8","9-10"]){
  assert.ok(item.questions?.[age]?.length>0,"Missing age questions "+item.id+" "+age);
 }
 assert.ok(item.quran?.surah&&item.hadith?.source,"Missing evidence "+item.id);
}
const school=sandbox.window.DARKidsAcademySchool;
const ids=Array.from(school.sequence(topics));
assert.equal(ids.length,208);assert.equal(new Set(ids).size,208);
const newIds=Array.from(sandbox.window.DARKidsAcademyCurriculumV27.ids);
assert.deepEqual(ids.slice(-158,-150),newIds,"V27 must preserve slots 51-58");
const v28Ids=Array.from(sandbox.window.DARKidsAcademyCurriculumV28.ids);
assert.deepEqual(ids.slice(-150,-146),v28Ids,"V28 must append exactly after V27 without shifting old progress");
for(const id of v28Ids){const item=curriculum[id];assert.ok(item?.sourceAudit?.hadithUrl?.startsWith("https://dorar.net/"),id+" must have verified direct link");assert.equal(item.voiceApproved,false);assert.equal(item.sourceAudit.hadithMeaningIsParaphrase,true);assert.equal(item.ageText["4-5"].lines.length,4);}
const v29Ids=Array.from(sandbox.window.DARKidsAcademyCurriculumV29.ids);
assert.deepEqual(ids.slice(-146,-142),v29Ids,"V29 must append without shifting existing learning progress");
for(const lessonId of v29Ids){
 const l=curriculum[lessonId];assert.ok(l?.sourceAudit?.hadithUrl?.startsWith("https://dorar.net/"));
 assert.equal(l.voiceApproved,false);assert.equal(l.sourceAudit.hadithMeaningIsParaphrase,true);
 for(const age of ["4-5","6-8","9-10"])assert.ok(l.ageText[age]?.lines?.length===4&&l.questions[age]?.length>=2,lessonId+" age "+age);
}
for(const newId of newIds){const l=curriculum[newId];assert.ok(l&&l.sourceAudit.hadithUrl.startsWith("https://dorar.net/hadith/sharh/"));assert.equal(l.sourceAudit.hadithMeaningIsParaphrase,true);assert.equal(l.voiceApproved,false);assert.equal(l.quran.excerpt,true);}
const v30Ids=Array.from(sandbox.window.DARKidsAcademyCurriculumV30.ids);
assert.deepEqual(ids.slice(-142,-138),v30Ids,"V30 must append after V29 without shifting old child progress");
for(const id of v30Ids){const l=curriculum[id];assert.ok(l?.sourceAudit?.hadithUrl?.startsWith("https://dorar.net/hadith/sharh/"));assert.equal(l.voiceApproved,false);for(const age of ["4-5","6-8","9-10"])assert.ok(l.ageText?.[age]?.lines?.length===4&&l.questions?.[age]?.length>=2);}
const v31Ids=Array.from(sandbox.window.DARKidsAcademyCurriculumV31.ids);
assert.deepEqual(ids.slice(-138,-134),v31Ids,"V31 must append after V30 without shifting old progress");
for(const id of v31Ids){const l=curriculum[id];assert.ok(l?.sourceAudit?.hadithUrl?.startsWith("https://dorar.net/hadith/sharh/"));assert.equal(l.voiceApproved,false);for(const age of ["4-5","6-8","9-10"])assert.ok(l.ageText?.[age]?.lines?.length===4&&l.questions?.[age]?.length>=2);}
const v32Ids=Array.from(sandbox.window.DARKidsAcademyCurriculumV32.ids);
assert.deepEqual(ids.slice(-134,-130),v32Ids,'V32 should append without moving child progress');
for(const id of v32Ids){const l=curriculum[id];assert.ok(l?.sourceAudit?.hadithUrl?.startsWith('https://dorar.net/'));assert.equal(l.voiceApproved,false);for(const a of ['4-5','6-8','9-10'])assert.ok(l.ageText[a]?.lines?.length===4&&l.questions[a]?.length>=2);}
const v33Ids=Array.from(sandbox.window.DARKidsAcademyCurriculumV33.ids);
assert.deepEqual(ids.slice(-130,-126),v33Ids,'V33 must append after V32 without shifting child progress');
for(const id of v33Ids){const l=curriculum[id];assert.ok(l?.sourceAudit?.hadithUrl?.startsWith('https://dorar.net/hadith/sharh/'));assert.equal(l.voiceApproved,false);for(const a of ['4-5','6-8','9-10'])assert.ok(l.ageText[a]?.lines?.length===4&&l.questions[a]?.length>=2);}
const v34Ids=Array.from(sandbox.window.DARKidsAcademyCurriculumV34.ids);
assert.deepEqual(ids.slice(-126,-122),v34Ids,'V34 must append without changing child progress');
for(const id of v34Ids){const l=curriculum[id];assert.ok(l?.sourceAudit?.hadithUrl?.startsWith('https://dorar.net/'));assert.equal(l.voiceApproved,false);for(const a of ['4-5','6-8','9-10'])assert.ok(l.ageText[a]?.lines?.length===4&&l.questions[a]?.length>=2);}
const v34Audio=JSON.parse(read('kids/data/academy-voice-plan-v34.json'));
assert.ok(v34Audio.policy.quranArabicExcludedFromSyntheticNarration);
assert.ok(!v34Audio.phrases.some(x=>x.contexts.some(c=>c.lessonId==='quran-al-falaq-kennenlernen')&&/[\u0600-\u06ff]/.test(x.text)),'Do not stage synthetic Quran recitation');
const v35Ids=Array.from(sandbox.window.DARKidsAcademyCurriculumV35.ids);
assert.deepEqual(ids.slice(-122,-118),v35Ids,'V35 must append after V34 without shifting existing records');
for(const id of v35Ids){const l=curriculum[id];assert.ok(l?.sourceAudit?.hadithUrl?.startsWith('https://dorar.net/hadith/sharh/'));assert.equal(l.voiceApproved,false);for(const age of ['4-5','6-8','9-10'])assert.ok(l.ageText[age]?.lines?.length===4&&l.questions[age]?.length>=2);}
const v36Ids=Array.from(sandbox.window.DARKidsAcademyCurriculumV36.ids);
assert.deepEqual(ids.slice(-118,-114),v36Ids,'V36 must append after V35 without shifting existing records');
for(const id of v36Ids){const l=curriculum[id];assert.ok(l?.sourceAudit?.hadithUrl?.startsWith('https://www.islamweb.net/'));assert.equal(l.sourceAudit.dorarReRead,false);assert.equal(l.voiceApproved,false);for(const age of ['4-5','6-8','9-10'])assert.ok(l.ageText[age]?.lines?.length===4&&l.questions[age]?.length>=2);}
const v37Ids=Array.from(sandbox.window.DARKidsAcademyCurriculumV37.ids);
assert.deepEqual(ids.slice(-114,-111),v37Ids,'V37 must append after V36 without shifting existing records');
for(const id of v37Ids){const l=curriculum[id];assert.ok(l?.sourceAudit?.hadithUrl?.startsWith('https://www.islamweb.net/'));assert.equal(l.sourceAudit.dorarReRead,false);assert.equal(l.voiceApproved,false);for(const age of ['4-5','6-8','9-10'])assert.ok(l.ageText[age]?.lines?.length===4&&l.questions[age]?.length>=2);}
const monday=new Date(2026,9,12,10),tuesday=new Date(2026,9,13,10),wednesday=new Date(2026,9,14,10);
const first=ids[0],second=ids[1],last=ids.at(-1);
const run=(when,records={},drafts={})=>school.evaluate({topics,records,drafts,now:when});
const original=run(monday);
assert.equal(original.active,first);assert.equal(original.access(second),"locked");assert.equal(original.access(last),"locked");
const completedAt=new Date(2026,9,12,9).getTime(),records={[first]:{completedAt,firstCompletedAt:completedAt}};
assert.equal(run(monday,records).access(second),"locked","No same-day second lesson");
assert.equal(run(tuesday,records).access(second),"new","Next lesson unlocks on next school day");
assert.equal(run(wednesday,records).access(second),"locked","Wednesday is for review");
const rogueDraft={[second]:{savedAt:new Date(2026,9,11,12).getTime(),step:2,qIndex:1}};
assert.equal(run(monday,{},rogueDraft).access(second),"locked","Later draft must never skip incomplete first lesson");
const validDraft={[first]:{savedAt:new Date(2026,9,11,12).getTime(),step:2,qIndex:1}};
assert.equal(run(monday,{},validDraft).access(first),"resume");
const app=read("kids/akademie/index.html");
assert.ok(app.includes("score.done<questions().length"),"Lesson completion cannot skip questions");
assert.ok(app.includes("if(!finished||score.done<questions().length||questions().length===0)return;"),"Storage must reject unfinished lesson");
assert.ok(app.includes("school-progress-v11.js?v=20261012-30"),"New progression runtime must be cache-busted");
for(const version of ["v1","v2","v22","v25","v26","v27","v28"])assert.ok(app.includes("/kids/akademie/curriculum-"+version+".js"),"Missing release pack "+version);
const year=JSON.parse(read("kids/data/academy-year-52weeks-v1.json"));
assert.equal(year.goals.currentlyInCatalog,208);assert.equal(year.goals.additionalAuthenticallyVerifiedLessonsNeeded,0);
assert.equal(year.weeks.length,52);
assert.deepEqual(year.weeks.flatMap(w=>w.days).filter(day=>day.editorialSlot>=59&&day.editorialSlot<=62)
 .map(day=>day.lessonId),v28Ids,"Released V28 IDs must occupy exactly year slots 59–62");
assert.deepEqual(year.weeks.flatMap(w=>w.days).filter(d=>d.editorialSlot>=63&&d.editorialSlot<=66).map(d=>d.lessonId),v29Ids,"V29 slot mapping");
assert.deepEqual(year.weeks.flatMap(w=>w.days).filter(d=>d.editorialSlot>=67&&d.editorialSlot<=70).map(d=>d.lessonId),v30Ids,"V30 slot mapping");
assert.deepEqual(year.weeks.flatMap(w=>w.days).filter(d=>d.editorialSlot>=71&&d.editorialSlot<=74).map(d=>d.lessonId),v31Ids,"V31 slot mapping");
assert.deepEqual(year.weeks.flatMap(w=>w.days).filter(d=>d.editorialSlot>=75&&d.editorialSlot<=78).map(d=>d.lessonId),v32Ids,"V32 slot mapping");
assert.deepEqual(year.weeks.flatMap(w=>w.days).filter(d=>d.editorialSlot>=79&&d.editorialSlot<=82).map(d=>d.lessonId),v33Ids,"V33 slot mapping");
assert.deepEqual(year.weeks.flatMap(w=>w.days).filter(d=>d.editorialSlot>=83&&d.editorialSlot<=86).map(d=>d.lessonId),v34Ids,"V34 slot mapping");
assert.deepEqual(year.weeks.flatMap(w=>w.days).filter(d=>d.editorialSlot>=87&&d.editorialSlot<=90).map(d=>d.lessonId),v35Ids,"V35 slot mapping");
assert.deepEqual(year.weeks.flatMap(w=>w.days).filter(d=>d.editorialSlot>=91&&d.editorialSlot<=94).map(d=>d.lessonId),v36Ids,"V36 slot mapping");
assert.deepEqual(year.weeks.flatMap(w=>w.days).filter(d=>d.editorialSlot>=95&&d.editorialSlot<=97).map(d=>d.lessonId),v37Ids,"V37 slot mapping");
const archive=read("kids/unterrichtsarchiv.html"),prefix="const ARCHIVE_SNAPSHOT=";
const start=archive.indexOf(prefix);assert.ok(start>0,"Embedded archive catalog missing");
const finish=archive.indexOf("\nfunction populateArchive(",start);assert.ok(finish>start);
const data=JSON.parse(archive.slice(start+prefix.length,finish).trim().replace(/;$/,""));
assert.equal(Object.keys(data.catalog).length,207);assert.equal(data.roadmap.plannedUnits.length,0);
assert.equal(data.year.weeks.length,52);
assert.ok(archive.includes("populateArchive(ARCHIVE_SNAPSHOT.year"),"Archive must show offline snapshot before network requests");
const v38Ids=Array.from(sandbox.window.DARKidsAcademyCurriculumV38.ids);
assert.deepEqual(ids.slice(-111),v38Ids,'V38 must append after V37 without shifting existing records');
for(const id of v38Ids){const l=curriculum[id];assert.ok(l?.sourceAudit?.hadithUrl?.startsWith('https://www.islamweb.net/'));assert.equal(l.sourceAudit.dorarReRead,false);assert.equal(l.voiceApproved,false);for(const age of ['4-5','6-8','9-10'])assert.ok(l.ageText[age]?.lines?.length===4&&l.questions[age]?.length>=2);}
assert.deepEqual(year.weeks.flatMap(w=>w.days).filter(d=>d.editorialSlot>=98&&d.editorialSlot<=208).map(d=>d.lessonId),v38Ids,"V38 slot mapping");
console.log("KIDS OK: 208 ordered lessons; no future topic left empty; all three age bands, no new audio approvals.");
