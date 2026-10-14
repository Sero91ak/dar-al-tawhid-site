#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const ids=["tawhid-bedeutung-ibadah","iman-qadar","ikhlas-wochenrueckblick","akhlaq-freude-fuer-andere"];
const topics={
 "tawhid-bedeutung-ibadah":"Die Bedeutung von ʿIbādah",
 "iman-qadar":"Īmān an al-Qadar",
 "ikhlas-wochenrueckblick":"Ikhlāṣ im Wochenrückblick",
 "akhlaq-freude-fuer-andere":"Freude für andere empfinden"
};
const v=JSON.parse(read("kids/data/academy-voice-editorial-167-170-delta-v1.json"));
assert.deepEqual(v.supersedesContextForLessonIds,ids);
assert.equal(v.contexts.length,76);
assert.equal(v.status,"text-only-not-generated-not-approved");
assert.equal(v.generateCreditsUsed,0);
assert.equal(v.requiresMergeIntoCanonicalVoicePlanBeforeGeneration,true);
const base={};
for(const id of ids)base[id]={
 id,topic:topics[id],quran:{surah:1,ayah:1,label:"unchanged"},
 questions:{"4-5":[1],"6-8":[2],"9-10":[3]},
 ageText:{"4-5":{},"6-8":{},"9-10":{}},
 sourceAudit:{scientificApproval:false}
};
const w={DARKidsAcademyCurriculum:base,DARKidsAcademyCurriculumEditorial163166:{scientificApproval:false}};
vm.runInNewContext(read("kids/akademie/curriculum-editorial-167-170-v1.js"),{window:w},{filename:"editorial-167-170"});
const next=w.DARKidsAcademyCurriculum;
assert.equal(w.DARKidsAcademyCurriculumEditorial167170.ageVersionCount,12);
assert.equal(w.DARKidsAcademyCurriculumEditorial167170.scientificApproval,false);
assert.equal(w.DARKidsAcademyCurriculumEditorial167170.audioGenerated,false);
const h=read("kids/akademie/index.html");
const p=h.indexOf("curriculum-editorial-163-166-v1.js"),q=h.indexOf("curriculum-editorial-167-170-v1.js");
assert.ok(p>0&&q>p,"scripts must load in sequence");
assert.equal(h.indexOf("curriculum-editorial-167-170-v1.js",q+1),-1,"script must not be duplicated");
for(const id of ids){
 const obj=next[id];
 assert.ok(obj&&obj.sourceAudit.scientificApproval===false);
 assert.equal(obj.questions,base[id].questions,"quiz object must be unchanged");
 assert.equal(obj.quran,base[id].quran,"original Quran data must be unchanged");
 const distinct=new Set();
 for(const age of ["4-5","6-8","9-10"]){
  const d=obj.ageText[age],intro=d.lines.join(" ");
  assert.equal(d.lines.length,4);
  assert.ok(d.goal&&d.situation&&d.practice&&d.evidence&&d.summary);
  assert.equal(d.intro,intro);
  assert.equal(d.audioScript,topics[id]+". "+intro);
  assert.ok(!distinct.has(intro),"age versions should differ");distinct.add(intro);
  assert.doesNotMatch(intro,/Keine Freigabe für Besucher|synthetische Rezitation|Masterstimme|QA-Hinweis|Audiotest|wissenschaftliche Freigabe/i);
  const get=(kind,i)=>v.contexts.find(x=>x.lessonId===id&&x.age===age&&x.kind===kind&&(i===undefined||x.index===i));
  assert.equal(get("intro")?.text,intro);
  assert.equal(get("audio")?.text,d.audioScript);
  for(let i=0;i<4;i++)assert.equal(get("line",i)?.text,d.lines[i]);
 }
 assert.equal(v.contexts.find(x=>x.lessonId===id&&x.age==="all"&&x.kind==="summary")?.text,obj.ageText["4-5"].audioScript);
}
process.stdout.write("PASS: 167-170 / 12 distinct ages / 76 ungenerated voice text contexts / no released sources / correct loader order\n");
