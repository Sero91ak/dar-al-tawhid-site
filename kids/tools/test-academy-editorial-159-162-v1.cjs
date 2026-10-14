#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const ids=["tawhid-allah-allein-danken","iman-gute-taten-verantwortung","ikhlas-aufrichtigkeit-aussenwirkung","akhlaq-ruhig-beim-verlieren"];
const topics={"tawhid-allah-allein-danken":"Allah allein danken","iman-gute-taten-verantwortung":"Gute Taten und Verantwortung","ikhlas-aufrichtigkeit-aussenwirkung":"Aufrichtigkeit von Außenwirkung unterscheiden","akhlaq-ruhig-beim-verlieren":"Ruhig bleiben beim Verlieren"};
const V=JSON.parse(read("kids/data/academy-voice-editorial-159-162-delta-v1.json"));
assert.deepEqual(V.supersedesContextForLessonIds,ids);
assert.equal(V.contexts.length,76);
assert.equal(V.generateCreditsUsed,0);
assert.equal(V.status,"text-only-not-generated-not-approved");
assert.equal(V.requiresMergeIntoCanonicalVoicePlanBeforeGeneration,true);
const base={};for(const id of ids)base[id]={id,topic:topics[id],quran:{surah:1,ayah:1,arabic:"unchanged"},questions:{"4-5":[1],"6-8":[2],"9-10":[3]},ageText:{"4-5":{},"6-8":{},"9-10":{}},sourceAudit:{scientificApproval:false}};
const w={DARKidsAcademyCurriculum:base,DARKidsAcademyCurriculumEditorial155158:{scientificApproval:false}};
vm.runInNewContext(read("kids/akademie/curriculum-editorial-159-162-v1.js"),{window:w},{filename:"editorial-159-162"});
const after=w.DARKidsAcademyCurriculum;
assert.equal(w.DARKidsAcademyCurriculumEditorial159162.ageVersionCount,12);
assert.equal(w.DARKidsAcademyCurriculumEditorial159162.scientificApproval,false);
assert.equal(w.DARKidsAcademyCurriculumEditorial159162.audioGenerated,false);
const page=read("kids/akademie/index.html");
const a=page.indexOf("curriculum-editorial-155-158-v1.js"),b=page.indexOf("curriculum-editorial-159-162-v1.js");
assert.ok(a>=0&&b>a);
assert.equal(page.indexOf("curriculum-editorial-159-162-v1.js",b+1),-1);
for(const id of ids){
 const lesson=after[id];
 assert.equal(lesson.sourceAudit.scientificApproval,false);
 assert.deepEqual(lesson.questions,base[id].questions);
 assert.deepEqual(lesson.quran,base[id].quran);
 const unique=new Set();
 for(const age of ["4-5","6-8","9-10"]){
  const d=lesson.ageText[age],intro=d.lines.join(" ");
  assert.equal(d.lines.length,4);
  assert.ok(d.goal&&d.situation&&d.practice&&d.evidence&&d.summary);
  assert.equal(d.intro,intro);
  assert.equal(d.audioScript,topics[id]+". "+intro);
  assert.ok(!unique.has(intro));unique.add(intro);
  assert.doesNotMatch(intro,/Keine Freigabe für Besucher|synthetische Rezitation|Masterstimme|QA-Hinweis|Audiotest|wissenschaftliche Freigabe/i);
  const get=(kind,i)=>V.contexts.find(x=>x.lessonId===id&&x.age===age&&x.kind===kind&&(i===undefined||x.index===i));
  assert.equal(get("intro")?.text,intro);
  assert.equal(get("audio")?.text,d.audioScript);
  for(let i=0;i<4;i++)assert.equal(get("line",i)?.text,d.lines[i]);
 }
 assert.equal(V.contexts.find(x=>x.lessonId===id&&x.age==="all"&&x.kind==="summary")?.text,lesson.ageText["4-5"].audioScript);
}
process.stdout.write("PASS: 159-162 / 12 ages / 76 ungenerated voice contexts / unchanged Quran and quizzes / script order / 0 approvals\n");
