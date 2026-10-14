#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const v=JSON.parse(read("kids/data/academy-voice-editorial-151-153-delta-v1.json"));
const ids=["adab-weniger-verschwenden","tarbiyah-verantwortung-uebernehmen","nafs-eigene-gedanken-pruefen"];
const topics={
 "adab-weniger-verschwenden":"Weniger verschwenden beim Essen",
 "tarbiyah-verantwortung-uebernehmen":"Für andere Verantwortung übernehmen",
 "nafs-eigene-gedanken-pruefen":"Eigene Gedanken prüfen"
};
assert.deepEqual(v.supersedesContextForLessonIds,ids);
assert.equal(v.status,"text-only-not-generated-not-approved");
assert.equal(v.generateCreditsUsed,0);
assert.equal(v.requiresMergeIntoCanonicalVoicePlanBeforeGeneration,true);
assert.equal(v.contexts.length,57);
const base={};
for(const id of ids)base[id]={id,topic:topics[id],ageText:{"4-5":{},"6-8":{},"9-10":{}},
 sourceAudit:{scientificApproval:false,editorialScopeNote:""}};
const window={DARKidsAcademyCurriculum:base,DARKidsAcademyCurriculumEditorial147150:true};
vm.runInNewContext(read("kids/akademie/curriculum-editorial-151-153-v1.js"),{window},{filename:"editorial-151-153"});
assert.equal(window.DARKidsAcademyCurriculumEditorial151153.ageVersionCount,9);
assert.equal(window.DARKidsAcademyCurriculumEditorial151153.scientificApproval,false);
assert.equal(window.DARKidsAcademyCurriculumEditorial151153.audioGenerated,false);
const index=read("kids/akademie/index.html");
const before=index.indexOf("curriculum-editorial-147-150-v1.js");
const after=index.indexOf("curriculum-editorial-151-153-v1.js");
assert.ok(before>0&&after>before,"Scripts missing or wrong order");
assert.equal(index.indexOf("curriculum-editorial-151-153-v1.js",after+1),-1,"Duplicate script tag");
for(const id of ids){
 const l=window.DARKidsAcademyCurriculum[id];
 assert.equal(l.sourceAudit.scientificApproval,false,"Scientific release not allowed");
 const seen=new Set();
 for(const age of ["4-5","6-8","9-10"]){
  const d=l.ageText[age];
  assert.equal(d.lines.length,4,"Exactly four sections per age");
  assert.ok(d.goal&&d.situation&&d.practice&&d.evidence&&d.summary,"Missing pedagogical structure");
  assert.equal(d.intro,d.lines.join(" "));
  assert.equal(d.audioScript,topics[id]+". "+d.intro);
  assert.doesNotMatch(d.intro,/Keine Freigabe für Besucher|synthetische Rezitation|Masterstimme|QA-Hinweis|Audiotest/i);
  assert.ok(!seen.has(d.intro),"Different ages must not be identical");seen.add(d.intro);
  const get=(kind,i)=>v.contexts.find(x=>x.lessonId===id&&x.age===age&&x.kind===kind&&(i===undefined||x.index===i));
  assert.equal(get("intro")?.text,d.intro,id+"/"+age+" intro");
  assert.equal(get("audio")?.text,d.audioScript,id+"/"+age+" audio");
  for(let i=0;i<4;i++)assert.equal(get("line",i)?.text,d.lines[i],id+"/"+age+"/"+i);
 }
 const summary=v.contexts.find(x=>x.lessonId===id&&x.age==="all"&&x.kind==="summary");
 assert.equal(summary?.text,l.ageText["4-5"].audioScript,id+" summary");
}
process.stdout.write("PASS: 3 lessons / 9 ages / 57 ungenerated contexts / 0 scientific approvals / proper script order\\n");
