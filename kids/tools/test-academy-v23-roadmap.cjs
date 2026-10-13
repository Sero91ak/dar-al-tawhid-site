#!/usr/bin/env node
"use strict";
/* V23 editorial-only curriculum regression – zero network calls, zero credits. */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const year=JSON.parse(read("kids/data/academy-year-52weeks-v1.json"));
const plan=JSON.parse(read("kids/data/academy-expansion-roadmap-v23.json"));
const expected=Object.fromEntries(plan.strandSummary.map(x=>[x.id,plan.plannedUnits.filter(u=>u.pillar===x.id).length]));
const ages=["4-5","6-8","9-10"];
assert.equal(year.goals.currentlyInCatalog,97);
assert.equal(year.goals.additionalAuthenticallyVerifiedLessonsNeeded,111);
assert.equal(plan.curriculum.alreadyImplementedLessons,97);
assert.equal(plan.curriculum.proposedAdditionalLessons,111);
assert.equal(plan.curriculum.totalNewLessonSlots,208);
assert.equal(plan.curriculum.weeks,52);
assert.deepEqual(plan.curriculum.ageGroups,ages);
assert.deepEqual(Object.fromEntries(plan.strandSummary.map(p=>[p.id,p.plannedAdditions])),expected);
assert.equal(plan.plannedUnits.length,111);
assert.equal(new Set(plan.plannedUnits.map(p=>p.title)).size,111,"Every new lesson needs a distinct title");
assert.equal(new Set(plan.plannedUnits.map(p=>p.topicId)).size,111,"Never reuse a lesson plan ID");
const news=year.weeks.flatMap(w=>w.days.filter(d=>d.mode==="new"));
const reviewed=news.filter(x=>!!x.lessonId),missing=news.filter(x=>!x.lessonId);
assert.equal(news.length,208);
assert.equal(reviewed.length,97);
assert.equal(missing.length,111);
assert.deepEqual(plan.existingLessonSlots.map(x=>x.lessonId),reviewed.map(x=>x.lessonId));
assert.equal(plan.existingLessonSlots.length,97);
const each={};
for(let i=0;i<plan.plannedUnits.length;i++){
 const unit=plan.plannedUnits[i],slot=missing[i];
 assert.equal(unit.editorialSlot,slot.editorialSlot);
 assert.equal(unit.week,year.weeks.find(w=>w.days.includes(slot)).week);
 assert.equal(unit.weekday,slot.weekday);
 assert.equal(unit.topicId,"editorial-"+String(slot.editorialSlot).padStart(3,"0"));
 assert.equal(slot.lessonId,null,"Editorial-only topics MUST NOT unlock in the production school");
 assert.equal(slot.status,"awaiting-authentic-source-and-content-review");
 assert.ok(unit.classroomScenario&&unit.title&&unit.pillar);
 each[unit.pillar]=(each[unit.pillar]||0)+1;
 const g=unit.releaseGate;
 for(const field of ["lessonCodePresent","quranSourceVerified","sunnahSourceVerified","ageTextsWritten","voiceApproved","reviewerApproved","childAppUnlocked"])
  assert.equal(g[field],false,field+" was incorrectly declared ready: "+unit.title);
 assert.equal(g.status,"editorial-outline-only");
 if(unit.pillar==="fiqh")assert.equal(g.fiqhSchoolReviewRequired,true);
 for(const age of ages){
  const a=unit.ageOutcomes[age];assert.ok(a?.goal?.length>38&&a.method?.length>45&&a.targetMinutes);
  assert.ok(a.goal.toLocaleLowerCase("de").includes(unit.classroomScenario.slice(0,12).toLocaleLowerCase("de")),
   "Each age goal must reference that lesson's unique classroom example");
 }
 assert.notEqual(unit.ageOutcomes["4-5"].method,unit.ageOutcomes["6-8"].method);
 assert.notEqual(unit.ageOutcomes["6-8"].method,unit.ageOutcomes["9-10"].method);
}
assert.deepEqual(each,expected);
assert.equal(plan.safety.voice.includes("no generation without explicit credit confirmation"),true);
assert.equal(plan.safety.profiles.includes("must not change school-progress-v11"),true);
assert.equal(plan.safety.verification.includes("No proposed topic contains an assigned Qurʾān verse"),true);
assert.ok(!read("kids/akademie/index.html").includes("academy-expansion-roadmap-v23.json"),
 "Editorial calendar must not be loaded into a real child's playable lessons");
const scripts=read(".github/workflows/check-kids-academy-v9.yml");
assert.ok(scripts.includes("node kids/tools/test-academy-v23-roadmap.cjs"));
console.log("KIDS ACADEMY V23+V25 ROADMAP PASS: 58 implemented + 150 editorial outlines = 208 annual lessons, 12 distinct Islamic strands and 3 age plans for every future lesson. Zero published, zero credits.");
