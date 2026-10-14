#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const ids=["akhlaq-fuersorge-fuer-kranke","adab-anderen-platz-machen","fiqh-zwischen-niederwerfungen-sitzen","akhlaq-guter-charakter-rueckblick"];
const topics={"akhlaq-fuersorge-fuer-kranke":"Fürsorge für Kranke","adab-anderen-platz-machen":"Anderen Platz machen","fiqh-zwischen-niederwerfungen-sitzen":"Zwischen zwei Niederwerfungen sitzen","akhlaq-guter-charakter-rueckblick":"Guter Charakter im Wochenrückblick"};
const V=JSON.parse(read("kids/data/academy-voice-editorial-199-202-delta-v1.json"));
assert.deepEqual(V.supersedesContextForLessonIds,ids);
assert.equal(V.contexts.length,76);assert.equal(V.generateCreditsUsed,0);
assert.equal(V.status,"text-only-not-generated-not-approved");
assert.equal(V.requiresMergeIntoCanonicalVoicePlanBeforeGeneration,true);
const before={};for(const id of ids)before[id]={id,topic:topics[id],quran:{label:"previous",arabic:"previous"},questions:{"4-5":[1],"6-8":[2],"9-10":[3]},ageText:{"4-5":{},"6-8":{},"9-10":{}},sourceAudit:{scientificApproval:false}};
const w={DARKidsAcademyCurriculum:before,DARKidsAcademyCurriculumEditorial195198:{scientificApproval:false}};
vm.runInNewContext(read("kids/akademie/curriculum-editorial-199-202-v1.js"),{window:w},{filename:"editorial-199-202"});
const after=w.DARKidsAcademyCurriculum,meta=w.DARKidsAcademyCurriculumEditorial199202;
assert.equal(meta.ageVersionCount,12);assert.equal(meta.scientificApproval,false);assert.equal(meta.audioGenerated,false);
const index=read("kids/akademie/index.html"),a=index.indexOf("curriculum-editorial-195-198-v1.js"),b=index.indexOf("curriculum-editorial-199-202-v1.js");
assert.ok(a>=0&&b>a);assert.equal(index.indexOf("curriculum-editorial-199-202-v1.js",b+1),-1);
for(const id of ids){
 const v=after[id],seen=new Set();
 assert.equal(v.sourceAudit.scientificApproval,false);
 assert.equal(v.questions,before[id].questions);
 assert.equal(v.quran,before[id].quran);
 if(id==="fiqh-zwischen-niederwerfungen-sitzen")assert.equal(v.sourceAudit.fiqhHumanReviewNeeded,true);
 for(const age of ["4-5","6-8","9-10"]){
  const d=v.ageText[age],intro=d.lines.join(" ");
  assert.equal(d.lines.length,4);assert.ok(d.goal&&d.situation&&d.practice&&d.evidence&&d.summary);
  assert.equal(d.intro,intro);assert.equal(d.audioScript,topics[id]+". "+intro);
  assert.ok(!seen.has(intro));seen.add(intro);
  for(const t of [d.intro,d.evidence,d.summary])assert.doesNotMatch(t,/scientificApproval|fiqhHumanReviewNeeded|QA-Hinweis|Masterstimme|Keine Freigabe für Besucher/i);
  const get=(kind,i)=>V.contexts.find(x=>x.lessonId===id&&x.age===age&&x.kind===kind&&(i===undefined||x.index===i));
  assert.equal(get("intro")?.text,intro);assert.equal(get("audio")?.text,d.audioScript);
  for(let i=0;i<4;i++)assert.equal(get("line",i)?.text,d.lines[i]);
 }
 assert.equal(V.contexts.find(x=>x.lessonId===id&&x.age==="all"&&x.kind==="summary")?.text,v.ageText["4-5"].audioScript);
}
console.log("PASS: 199–202 / 12 ages / 76 ungenerated audio texts / original IDs, quizzes and Quran / fiqh review guard");
