#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const ids=["tawhid-allah-allein-danken","iman-gute-taten-verantwortung","ikhlas-aufrichtigkeit-aussenwirkung","akhlaq-ruhig-beim-verlieren"];
const topics={"tawhid-allah-allein-danken":"Allah allein danken","iman-gute-taten-verantwortung":"Gute Taten und Verantwortung","ikhlas-aufrichtigkeit-aussenwirkung":"Aufrichtigkeit von Außenwirkung unterscheiden","akhlaq-ruhig-beim-verlieren":"Ruhig bleiben beim Verlieren"};
const voice=JSON.parse(read("kids/data/academy-voice-editorial-159-162-delta-v1.json"));
assert.deepEqual(voice.supersedesContextForLessonIds,ids);
assert.equal(voice.contexts.length,76);
assert.equal(voice.generateCreditsUsed,0);
assert.equal(voice.requiresMergeIntoCanonicalVoicePlanBeforeGeneration,true);
assert.equal(voice.status,"text-only-not-generated-not-approved");
const base={};for(const id of ids)base[id]={id,topic:topics[id],ageText:{"4-5":{},"6-8":{},"9-10":{}},questions:{"4-5":[1],"6-8":[2],"9-10":[3]},sourceAudit:{scientificApproval:false}};
const ctx={window:{DARKidsAcademyCurriculum:base,DARKidsAcademyCurriculumEditorial155158:true}};
vm.runInNewContext(read("kids/akademie/curriculum-editorial-159-162-v1.js"),ctx,{filename:"editorial-159-162"});
const edited=ctx.window.DARKidsAcademyCurriculum;
assert.equal(ctx.window.DARKidsAcademyCurriculumEditorial159162.ageVersionCount,12);
assert.equal(ctx.window.DARKidsAcademyCurriculumEditorial159162.scientificApproval,false);
assert.equal(ctx.window.DARKidsAcademyCurriculumEditorial159162.audioGenerated,false);
const index=read("kids/akademie/index.html");
const old=index.indexOf("curriculum-editorial-155-158-v1.js"),now=index.indexOf("curriculum-editorial-159-162-v1.js");
assert.ok(old>=0&&now>old,"Wrong script order or missing index reference");
assert.equal(index.indexOf("curriculum-editorial-159-162-v1.js",now+1),-1,"Duplicate script");
for(const id of ids){
 const d=edited[id];assert.equal(d.sourceAudit.scientificApproval,false);
 assert.deepEqual(d.questions,base[id].questions,"Existing quiz must remain unchanged");
 const intros=new Set();
 for(const age of ["4-5","6-8","9-10"]){
  const a=d.ageText[age];assert.equal(a.lines.length,4);assert.ok(a.goal&&a.situation&&a.practice&&a.evidence&&a.summary);
  assert.equal(a.intro,a.lines.join(" "));assert.equal(a.audioScript,topics[id]+". "+a.intro);
  assert.ok(!intros.has(a.intro),"Age copies must be distinct");intros.add(a.intro);
  assert.doesNotMatch(a.intro,/Keine Freigabe für Besucher|synthetische Rezitation|Masterstimme|Audiotest|QA-Hinweis|wissenschaftliche Freigabe/i);
  const get=(kind,i)=>voice.contexts.find(x=>x.lessonId===id&&x.age===age&&x.kind===kind&&(i===undefined||x.index===i));
  assert.equal(get("intro")?.text,a.intro);assert.equal(get("audio")?.text,a.audioScript);
  for(let i=0;i<4;i++)assert.equal(get("line",i)?.text,a.lines[i]);
 }
 assert.equal(voice.contexts.find(x=>x.lessonId===id&&x.age==="all"&&x.kind==="summary")?.text,d.ageText["4-5"].audioScript);
}
process.stdout.write("PASS: 4 lessons / 12 ages / 76 ungenerated text contexts / 0 approvals / loader order checked\n");
