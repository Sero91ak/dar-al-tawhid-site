#!/usr/bin/env node
"use strict";
/* Immutable Kids learning-order regression: curriculum, locked upcoming lessons,
 * completion of all quiz questions, stale draft bypass, and owner reading archive.
 * No network, account changes, TTS or release approval.
 */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const ROOT=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
const scripts=["v1","v2","v22","v25","v26","v27"].map(x=>"kids/akademie/curriculum-"+x+".js");
const sandbox={window:{}};vm.createContext(sandbox);
for(const p of scripts)new vm.Script(read(p),{filename:p}).runInContext(sandbox,{timeout:4000});
new vm.Script(read("kids/akademie/school-progress-v11.js")).runInContext(sandbox,{timeout:4000});
const curriculum=sandbox.window.DARKidsAcademyCurriculum;
assert.equal(Object.keys(curriculum).length,57);
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
assert.equal(ids.length,58);assert.equal(new Set(ids).size,58);
const newIds=Array.from(sandbox.window.DARKidsAcademyCurriculumV27.ids);
assert.deepEqual(ids.slice(-8),newIds,"V27 must append after unchanged 50 historical lessons");
for(const newId of newIds){const l=curriculum[newId];assert.ok(l&&l.sourceAudit.hadithUrl.startsWith("https://dorar.net/hadith/sharh/"));assert.equal(l.sourceAudit.hadithMeaningIsParaphrase,true);assert.equal(l.voiceApproved,false);assert.equal(l.quran.excerpt,true);}
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
assert.ok(app.includes("school-progress-v11.js?v=20261012-28"),"New progression runtime must be cache-busted");
for(const version of ["v1","v2","v22","v25","v26","v27"])assert.ok(app.includes("/kids/akademie/curriculum-"+version+".js"),"Missing release pack "+version);
const year=JSON.parse(read("kids/data/academy-year-52weeks-v1.json"));
assert.equal(year.goals.currentlyInCatalog,58);assert.equal(year.goals.additionalAuthenticallyVerifiedLessonsNeeded,150);
assert.equal(year.weeks.length,52);
const archive=read("kids/unterrichtsarchiv.html"),prefix="const ARCHIVE_SNAPSHOT=";
const start=archive.indexOf(prefix);assert.ok(start>0,"Embedded archive catalog missing");
const finish=archive.indexOf("\nfunction populateArchive(",start);assert.ok(finish>start);
const data=JSON.parse(archive.slice(start+prefix.length,finish).trim().replace(/;$/,""));
assert.equal(Object.keys(data.catalog).length,57);assert.equal(data.roadmap.plannedUnits.length,150);
assert.equal(data.year.weeks.length,52);
assert.ok(archive.includes("populateArchive(ARCHIVE_SNAPSHOT.year"),"Archive must show offline snapshot before network requests");
console.log("KIDS OK: 58 ordered lessons, 24 new age texts, 150 unproduced plans, strict locks, completion guards, offline-safe archive.");
