#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const ids=["tawhid-vertrauen-und-bemuehen","iman-fragen-stellen","akhlaq-mut-zur-wahrheit","adab-aeltere-respektvoll"];
const topics={"tawhid-vertrauen-und-bemuehen":"Allah vertrauen und sich bemühen","iman-fragen-stellen":"Fragen zum Īmān stellen","akhlaq-mut-zur-wahrheit":"Mut zur Wahrheit","adab-aeltere-respektvoll":"Ältere respektvoll ansprechen"};
const V=JSON.parse(read("kids/data/academy-voice-editorial-187-190-delta-v1.json"));
assert.deepEqual(V.supersedesContextForLessonIds,ids);assert.equal(V.contexts.length,76);
assert.equal(V.generateCreditsUsed,0);assert.equal(V.status,"text-only-not-generated-not-approved");
const base={};for(const id of ids)base[id]={id,topic:topics[id],ageText:{"4-5":{},"6-8":{},"9-10":{}},questions:{"4-5":[1],"6-8":[2],"9-10":[3]},sourceAudit:{scientificApproval:false}};
const w={DARKidsAcademyCurriculum:base,DARKidsAcademyCurriculumEditorial183186:true};
vm.runInNewContext(read("kids/akademie/curriculum-editorial-187-190-v1.js"),{window:w});
const actual=w.DARKidsAcademyCurriculum;
assert.equal(w.DARKidsAcademyCurriculumEditorial187190.ageVersionCount,12);
const html=read("kids/akademie/index.html"),p=html.indexOf("curriculum-editorial-183-186-v1.js"),n=html.indexOf("curriculum-editorial-187-190-v1.js");
assert.ok(p>=0&&n>p);assert.equal(html.indexOf("curriculum-editorial-187-190-v1.js",n+1),-1);
for(const id of ids){const lesson=actual[id];assert.equal(lesson.sourceAudit.scientificApproval,false);assert.deepEqual(lesson.questions,base[id].questions);
 const found=new Set();
 for(const age of ["4-5","6-8","9-10"]){const d=lesson.ageText[age],intro=d.lines.join(" ");
  assert.equal(d.lines.length,4);assert.ok(d.goal&&d.situation&&d.practice&&d.evidence&&d.summary);
  assert.equal(d.intro,intro);assert.equal(d.audioScript,topics[id]+". "+intro);
  assert.ok(!found.has(intro));found.add(intro);
  assert.doesNotMatch(intro,/scientificApproval|fiqhHumanReviewNeeded|QA-Hinweis|synthetische Rezitation|Masterstimme|Keine Freigabe für Besucher/i);
  const get=(kind,i)=>V.contexts.find(x=>x.lessonId===id&&x.age===age&&x.kind===kind&&(i===undefined||x.index===i));
  assert.equal(get("intro")?.text,intro);assert.equal(get("audio")?.text,d.audioScript);
  for(let i=0;i<4;i++)assert.equal(get("line",i)?.text,d.lines[i]);
 }
 assert.equal(V.contexts.find(x=>x.lessonId===id&&x.age==="all"&&x.kind==="summary")?.text,lesson.ageText["4-5"].audioScript);
}
process.stdout.write("PASS: 187–190 / 12 ages / 76 no-credit voices / unchanged quiz IDs / no approval\n");