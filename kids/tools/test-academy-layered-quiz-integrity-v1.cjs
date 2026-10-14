#!/usr/bin/env node
"use strict";
/**
 * Read-only integration regression for the academy's layered V38+ quiz revisions.
 * Discovers overlay scripts from the actual lesson page, not from an old hard-coded list.
 * No network, audio generation, file writes, publishing or approval mutations.
 * Run: node kids/tools/test-academy-layered-quiz-integrity-v1.cjs
 */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
const html=read("kids/akademie/index.html");
const overlays=[...html.matchAll(/<script\s+src="\/kids\/akademie\/curriculum-v(\d+)\.js[^"]*"\s*><\/script>/g)]
 .map(m=>Number(m[1])).filter(v=>v>=38);
assert.ok(overlays.length>0&&overlays[0]===38,"V38 must be loaded");
assert.deepEqual(overlays,[...new Set(overlays)],"No repeated curriculum modules");
for(let i=1;i<overlays.length;i++)
 assert.equal(overlays[i],overlays[i-1]+1,"A loaded quiz overlay version is missing");

const raw=read("kids/akademie/curriculum-v38.js");
const start=raw.indexOf("{",raw.indexOf("const additions="));
const marker="\n};\nfor(const [id,l]";
const stop=raw.indexOf(marker,start);
assert.ok(start>0&&stop>start,"Cannot locate V38 lesson additions");
const base=JSON.parse(raw.slice(start,stop+2));
assert.equal(Object.keys(base).length,111,"V38 must supply 111 lessons");
const ages=["4-5","6-8","9-10"];
const context={window:{DARKidsAcademyCurriculum:Object.freeze({...base}),DARKidsAcademyCurriculumV38:Object.freeze({count:111})}};
const revisions=new Set();
const stages=[];
for(const version of overlays.slice(1)){
 const filename="kids/akademie/curriculum-v"+version+".js";
 assert.ok(fs.existsSync(path.join(ROOT,filename)),"Missing loaded overlay "+filename);
 vm.runInNewContext(read(filename),context,{filename,timeout:10000});
 const stage=context.window["DARKidsAcademyCurriculumV"+version];
 assert.ok(stage,"Missing overlay marker V"+version);
 assert.equal(stage.approvedAgeVersions,0,"V"+version+" improperly approves child lessons");
 assert.equal(stage.religiousSourcesVerified,false,"V"+version+" claims religious verification");
 assert.equal(stage.voiceRecordingsApproved,false,"V"+version+" claims approved speech");
 const slots=Array.from(stage.revisedSlots||[]);
 assert.ok(slots.length>0,"V"+version+" has no declared revised slots");
 const ids=Array.from(stage.ids||[]);
 assert.equal(ids.length,slots.length,"V"+version+" slot/id mismatch");
 const current=context.window.DARKidsAcademyCurriculum;
 assert.equal(Object.keys(current).length,111,"V"+version+" changed lesson count");
 for(const id of ids){
  assert.ok(base[id]&&current[id],"V"+version+" has unknown lesson ID "+id);
  assert.equal(current[id].id,base[id].id,"Lesson ID changed: "+id);
  assert.equal(current[id].quran.arabic,base[id].quran.arabic,"Qur'an wording changed in quiz overlay: "+id);
  assert.equal(JSON.stringify(current[id].sourceAudit),JSON.stringify(base[id].sourceAudit),"Source audit mutated: "+id);
  assert.equal(JSON.stringify(current[id].ageText),JSON.stringify(base[id].ageText),"Age teaching changed in quiz overlay: "+id);
  assert.equal(current[id].sourceAudit.scientificApproval,false,"Unapproved lesson marked approved: "+id);
  assert.ok(!revisions.has(id),"Multiple quiz overlays overwrite the same lesson: "+id);
  revisions.add(id);
 }
 stages.push({version,lessons:ids.length,slots});
}
const final=context.window.DARKidsAcademyCurriculum;
let questionCount=0,choiceCount=0;
const banned=/keine freigabe für besucher|keine synthetische rezitation|wissenschaftliche freigabe|computerstimme|in diesem Paket gibt es keine Aufnahme|bezeichnungen der App|der gespeicherte (?:Text|Auszug)/i;
for(const [id,lesson] of Object.entries(final)){
 assert.equal(lesson.sourceAudit.scientificApproval,false,"Unexpected religious approval: "+id);
 for(const age of ages){
  const quiz=lesson.questions?.[age];
  assert.ok(Array.isArray(quiz)&&quiz.length===(age==="4-5"?2:3),"Quiz size "+id+"/"+age);
  for(const q of quiz){
   assert.ok(q.prompt?.trim()&&q.hint?.trim()&&q.explain?.trim(),"Incomplete question "+id+"/"+age);
   assert.ok(!banned.test(JSON.stringify(q)),"Editorial metadata in quiz "+id+"/"+age);
   if(q.type==="choice"){
    assert.ok(Array.isArray(q.options)&&q.options.length===2,"Wrong choice count "+id+"/"+age);
    assert.ok(q.options[0]!==q.options[1]&&[0,1].includes(q.correct),"Invalid answer index "+id+"/"+age);
    choiceCount++;
   }else if(q.type==="text"){
    assert.ok(q.sample?.trim(),"Missing text-answer example "+id+"/"+age);
   }else throw Error("Unsupported quiz question type: "+id+"/"+age+"/"+q.type);
   questionCount++;
  }
 }
}
assert.equal(questionCount,888,"V38-Vn must preserve 888 questions");
console.log("KIDS layered quiz integrity OK:",JSON.stringify({
 overlays:overlays.slice(1),revisedLessons:revisions.size,totalV38Lessons:Object.keys(final).length,
 ageVariants:Object.keys(final).length*3,questions:questionCount,multipleChoice:choiceCount,
 religiousApprovals:0,recordingsGenerated:0
}));
