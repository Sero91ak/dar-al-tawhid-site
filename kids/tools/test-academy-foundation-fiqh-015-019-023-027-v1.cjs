#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const ids=["fiqh-taharah-saubere-kleidung","fiqh-taharah-sauberer-lernplatz","fiqh-wudu-gesicht-und-arme","fiqh-wudu-kopf-und-fu-e"];
const topics={"fiqh-taharah-saubere-kleidung":"Saubere Kleidung","fiqh-taharah-sauberer-lernplatz":"Sauberer Lernplatz","fiqh-wudu-gesicht-und-arme":"Gesicht und Arme","fiqh-wudu-kopf-und-fu-e":"Kopf und Füße"};
const w={};const ctx={window:w};
vm.runInNewContext(read("kids/akademie/curriculum-v1.js"),ctx,{filename:"v1"});
vm.runInNewContext(read("kids/akademie/curriculum-v2.js"),ctx,{filename:"v2"});
const original={};for(const id of ids){const l=w.DARKidsAcademyCurriculum[id];assert.ok(l);original[id]=l;}
vm.runInNewContext(read("kids/akademie/curriculum-foundation-fiqh-003-007-011-v1.js"),ctx,{filename:"first-foundation-fiqh"});
vm.runInNewContext(read("kids/akademie/curriculum-foundation-fiqh-015-019-023-027-v1.js"),ctx,{filename:"second-foundation-fiqh"});
const m=w.DARKidsAcademyCurriculumFoundationFiqh015019023027;
assert.equal(m.ageVersionCount,12);assert.equal(m.scientificApproval,false);assert.equal(m.audioGenerated,false);assert.equal(m.liveApproved,false);
const V=JSON.parse(read("kids/data/academy-voice-foundation-fiqh-015-019-023-027-delta-v1.json"));
assert.deepEqual(V.supersedesContextForLessonIds,ids);
assert.equal(V.contexts.length,76);assert.equal(V.generateCreditsUsed,0);
assert.equal(V.status,"text-only-not-generated-not-approved");assert.equal(V.requiresMergeIntoCanonicalVoicePlanBeforeGeneration,true);
const html=read("kids/akademie/index.html");
const first=html.indexOf("curriculum-foundation-fiqh-003-007-011-v1.js"),second=html.indexOf("curriculum-foundation-fiqh-015-019-023-027-v1.js");
assert.ok(first>=0&&second>first);assert.equal(html.indexOf("curriculum-foundation-fiqh-015-019-023-027-v1.js",second+1),-1);
let ageCount=0;for(const id of ids){
 const l=w.DARKidsAcademyCurriculum[id],base=original[id],seen=new Set();assert.ok(l&&l!==base);
 assert.equal(l.id,id);assert.equal(l.questions,base.questions);assert.equal(l.quran,base.quran);assert.equal(l.hadith,base.hadith);
 assert.equal(l.sourceAudit.scientificApproval,false);assert.equal(l.sourceAudit.fiqhHumanReviewNeeded,true);
 if(id.startsWith("fiqh-wudu"))assert.equal(l.quran.excerpt,true,"V1 Quran 5:6 excerpt marker must survive");
 for(const age of ["4-5","6-8","9-10"]){
  const d=l.ageText[age],intro=d.lines.join(" ");assert.equal(d.lines.length,4);
  assert.ok(d.goal&&d.situation&&d.practice&&d.evidence&&d.summary);
  assert.equal(d.intro,intro);assert.equal(d.audioScript,topics[id]+". "+intro);
  assert.ok(!seen.has(intro));seen.add(intro);
  assert.doesNotMatch([d.goal,intro,d.evidence,d.practice,d.summary].join(" "),/scientificApproval|fiqhHumanReviewNeeded|sourceAudit|Masterstimme|QA-Hinweis|Keine Freigabe für Besucher|Audiotest|synthetische Rezitation/i);
  const get=(kind,i)=>V.contexts.find(x=>x.lessonId===id&&x.age===age&&x.kind===kind&&(i===undefined||x.index===i));
  assert.equal(get("intro")?.text,intro);assert.equal(get("audio")?.text,d.audioScript);
  for(let i=0;i<4;i++)assert.equal(get("line",i)?.text,d.lines[i]);
  ageCount++;
 }
 assert.equal(V.contexts.find(x=>x.lessonId===id&&x.age==="all"&&x.kind==="summary")?.text,l.ageText["4-5"].audioScript);
}
assert.equal(ageCount,12);
process.stdout.write("PASS Fiqh slots 15/19/23/27: 12 independent ages, 76 zero-credit contexts, original Quran excerpts and quizzes unchanged. No scientific approval.\n");
