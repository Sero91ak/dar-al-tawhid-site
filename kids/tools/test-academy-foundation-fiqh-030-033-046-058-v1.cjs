#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const ids=["fiqh-salah-allah-gedenken","fiqh-salah-gebet-lernen","fiqh-reinheit-unterscheiden","fiqh-wudu-schritte-reihenfolge"];
const titles={"fiqh-salah-allah-gedenken":"Allah gedenken","fiqh-salah-gebet-lernen":"Gebet lernen","fiqh-reinheit-unterscheiden":"Reinheit und Sauberkeit","fiqh-wudu-schritte-reihenfolge":"Wuḍūʾ in der richtigen Reihenfolge"};
const orig={};
for(const id of ids)orig[id]={id,topic:titles[id],quran:{arabic:"unchanged",label:"original",excerpt:id==="fiqh-wudu-schritte-reihenfolge"},hadith:{source:"original"},questions:{"4-5":[{right:"yes"}],"6-8":[{right:"yes"}],"9-10":[{right:"yes"}]},ageText:{"4-5":{intro:"old"},"6-8":{intro:"old"},"9-10":{intro:"old"}},sourceAudit:{scientificApproval:false}};
const w={DARKidsAcademyCurriculum:orig,DARKidsAcademyCurriculumFoundationFiqh015019023027:{version:"prior",scientificApproval:false}};
vm.runInNewContext(read("kids/akademie/curriculum-foundation-fiqh-030-033-046-058-v1.js"),{window:w},{filename:"foundation-fiqh-030-033-046-058"});
const next=w.DARKidsAcademyCurriculum,meta=w.DARKidsAcademyCurriculumFoundationFiqh030033046058;
assert.ok(meta);assert.equal(meta.ageVersionCount,12);assert.equal(meta.scientificApproval,false);assert.equal(meta.audioGenerated,false);assert.equal(meta.liveApproved,false);
const V=JSON.parse(read("kids/data/academy-voice-foundation-fiqh-030-033-046-058-delta-v1.json"));
assert.deepEqual(V.supersedesContextForLessonIds,ids);assert.equal(V.contexts.length,76);
assert.equal(V.status,"text-only-not-generated-not-approved");assert.equal(V.generateCreditsUsed,0);
assert.equal(V.requiresMergeIntoCanonicalVoicePlanBeforeGeneration,true);
const html=read("kids/akademie/index.html"),pre=html.indexOf("curriculum-foundation-fiqh-015-019-023-027-v1.js"),at=html.indexOf("curriculum-foundation-fiqh-030-033-046-058-v1.js");
assert.ok(pre>=0&&at>pre,"must load after earlier Fiqh overlays");
assert.equal(html.indexOf("curriculum-foundation-fiqh-030-033-046-058-v1.js",at+1),-1);
let ageCount=0;
for(const id of ids){
 const l=next[id],b=orig[id];assert.ok(l&&l!==b);
 assert.equal(l.id,id);assert.equal(l.quran,b.quran);assert.equal(l.hadith,b.hadith);
 assert.equal(l.questions,b.questions);assert.equal(l.sourceAudit.scientificApproval,false);
 assert.equal(l.sourceAudit.fiqhHumanReviewNeeded,true);
 const seen=new Set();
 for(const age of ["4-5","6-8","9-10"]){
  const d=l.ageText[age],intro=d.lines.join(" ");assert.equal(d.lines.length,4);
  assert.ok(d.goal&&d.evidence&&d.situation&&d.practice&&d.summary);
  assert.equal(d.intro,intro);assert.equal(d.audioScript,titles[id]+". "+intro);
  assert.ok(!seen.has(intro),"same age text");seen.add(intro);
  assert.doesNotMatch([d.goal,intro,d.evidence,d.situation,d.practice,d.summary].join(" "),/scientificApproval|fiqhHumanReviewNeeded|sourceAudit|Masterstimme|QA-Hinweis|Keine Freigabe für Besucher|Audiotest|synthetische Rezitation/i);
  const get=(kind,i)=>V.contexts.find(x=>x.lessonId===id&&x.age===age&&x.kind===kind&&(i===undefined||x.index===i));
  assert.equal(get("intro")?.text,intro);assert.equal(get("audio")?.text,d.audioScript);
  for(let j=0;j<4;j++)assert.equal(get("line",j)?.text,d.lines[j]);
  ageCount++;
 }
 assert.equal(V.contexts.find(x=>x.lessonId===id&&x.age==="all"&&x.kind==="summary")?.text,l.ageText["4-5"].audioScript);
}
assert.equal(ageCount,12);
process.stdout.write("PASS: early Fiqh 30/33/46/58; 12 age variants; 76 text contexts; original reference/quiz mock objects unchanged, no signoff or audio.\n");
