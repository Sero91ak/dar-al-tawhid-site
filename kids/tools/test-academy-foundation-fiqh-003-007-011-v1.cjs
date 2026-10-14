#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const ids=["fiqh-taharah","fiqh-wudu","fiqh-salah"];
const topic={"fiqh-taharah":"Reinheit","fiqh-wudu":"Wuḍūʾ","fiqh-salah":"Gebet"};
const w={};
vm.runInNewContext(read("kids/akademie/curriculum-v1.js"),{window:w},{filename:"curriculum-v1"});
const originals={};for(const id of ids){const l=w.DARKidsAcademyCurriculum[id];assert.ok(l);originals[id]=l;}
vm.runInNewContext(read("kids/akademie/curriculum-foundation-fiqh-003-007-011-v1.js"),{window:w},{filename:"foundational-fiqh"});
const meta=w.DARKidsAcademyCurriculumFoundationFiqh003007011,after=w.DARKidsAcademyCurriculum;
assert.equal(meta.ageVersionCount,9);assert.equal(meta.scientificApproval,false);assert.equal(meta.audioGenerated,false);assert.equal(meta.liveApproved,false);
const V=JSON.parse(read("kids/data/academy-voice-foundation-fiqh-003-007-011-delta-v1.json"));
assert.deepEqual(V.supersedesContextForLessonIds,ids);assert.equal(V.contexts.length,57);assert.equal(V.generateCreditsUsed,0);
assert.equal(V.status,"text-only-not-generated-not-approved");assert.equal(V.requiresMergeIntoCanonicalVoicePlanBeforeGeneration,true);
const html=read("kids/akademie/index.html"),tag="curriculum-foundation-fiqh-003-007-011-v1.js",pos=html.indexOf(tag);
assert.ok(pos>html.indexOf("curriculum-editorial-206-208-v1.js"),"must load after all editorial overlays");
assert.equal(html.indexOf(tag,pos+1),-1,"only load once");
let checks=0;
for(const id of ids){
 const l=after[id],old=originals[id];assert.ok(l&&l!==old);
 assert.equal(l.id,id);assert.equal(l.questions,old.questions,"quizzes and progress IDs unchanged");
 assert.equal(l.quran,old.quran,"original Quran untouched");assert.equal(l.hadith,old.hadith,"Hadith attribution unchanged");
 assert.equal(l.sourceAudit.scientificApproval,false);assert.equal(l.sourceAudit.fiqhHumanReviewNeeded,true);
 const distinct=new Set();
 for(const age of ["4-5","6-8","9-10"]){
  const d=l.ageText[age],joined=d.lines.join(" ");
  assert.equal(d.lines.length,4);assert.ok(d.goal&&d.situation&&d.practice&&d.evidence&&d.summary);
  assert.equal(d.intro,joined);assert.equal(d.audioScript,topic[id]+". "+joined);
  assert.ok(!distinct.has(joined));distinct.add(joined);
  assert.doesNotMatch([d.goal,joined,d.situation,d.practice,d.evidence,d.summary].join(" "),/scientificApproval|fiqhHumanReviewNeeded|sourceAudit|Masterstimme|QA-Hinweis|Keine Freigabe für Besucher|Audiotest|synthetische Rezitation/i);
  const get=(kind,i)=>V.contexts.find(x=>x.lessonId===id&&x.age===age&&x.kind===kind&&(i===undefined||x.index===i));
  assert.equal(get("intro")?.text,joined);assert.equal(get("audio")?.text,d.audioScript);
  for(let j=0;j<4;j++)assert.equal(get("line",j)?.text,d.lines[j]);
  checks++;
 }
 assert.equal(V.contexts.find(x=>x.lessonId===id&&x.age==="all"&&x.kind==="summary")?.text,l.ageText["4-5"].audioScript);
}
assert.equal(originals["fiqh-wudu"].quran.excerpt,true,"Quran 5:6 must remain visibly excerpted");
process.stdout.write("PASS foundation Fiqh: "+ids.length+" lessons, "+checks+" independent age texts, "+V.contexts.length+" ungenerated contexts, source bindings and original quizzes preserved. No approval/deploy.\n");
