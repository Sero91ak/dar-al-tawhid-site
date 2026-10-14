#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),read=x=>fs.readFileSync(path.join(root,x),"utf8");
const ids=["fiqh-wudu-wasser-sparen","fiqh-wann-wudu-noetig","fiqh-wudu-waschen-und-streichen","fiqh-reinheit-der-gebetskleidung"];
const topics={"fiqh-wudu-wasser-sparen":"Wasser beim Wuḍūʾ sparen","fiqh-wann-wudu-noetig":"Wann braucht man Wuḍūʾ?","fiqh-wudu-waschen-und-streichen":"Wuḍūʾ: Waschen und Streichen unterscheiden","fiqh-reinheit-der-gebetskleidung":"Reinheit der Gebetskleidung"};
const V=JSON.parse(read("kids/data/academy-voice-foundation-fiqh-070-082-094-106-delta-v1.json"));
assert.deepEqual(V.supersedesContextForLessonIds,ids);
assert.equal(V.contexts.length,76);assert.equal(V.generateCreditsUsed,0);
assert.equal(V.status,"text-only-not-generated-not-approved");
assert.equal(V.requiresMergeIntoCanonicalVoicePlanBeforeGeneration,true);
const before={};
for(const id of ids)before[id]={id,topic:topics[id],quran:{surah:5,ayah:6,arabic:"original",excerpt:true},hadith:{reference:"original"},questions:{"4-5":[1],"6-8":[2],"9-10":[3]},ageText:{"4-5":{},"6-8":{},"9-10":{}},sourceAudit:{scientificApproval:false}};
const w={DARKidsAcademyCurriculum:before,DARKidsAcademyCurriculumFoundationFiqh030033046058:{scientificApproval:false}};
vm.runInNewContext(read("kids/akademie/curriculum-foundation-fiqh-070-082-094-106-v1.js"),{window:w},{filename:"foundation-fiqh-070-082-094-106"});
const next=w.DARKidsAcademyCurriculum,m=w.DARKidsAcademyCurriculumFoundationFiqh070082094106;
assert.equal(m.ageVersionCount,12);assert.equal(m.scientificApproval,false);assert.equal(m.liveApproved,false);assert.equal(m.audioGenerated,false);
const html=read("kids/akademie/index.html");
const p=html.indexOf("curriculum-foundation-fiqh-030-033-046-058-v1.js"),q=html.indexOf("curriculum-foundation-fiqh-070-082-094-106-v1.js");
assert.ok(p>=0&&q>p,"foundation modules must load in order");
assert.equal(html.indexOf("curriculum-foundation-fiqh-070-082-094-106-v1.js",q+1),-1,"no double-load");
let n=0;
for(const id of ids){
 const a=next[id],orig=before[id],distinct=new Set();
 assert.ok(a&&a.id===id);assert.equal(a.questions,orig.questions);assert.equal(a.quran,orig.quran);assert.equal(a.hadith,orig.hadith);
 assert.equal(a.sourceAudit.scientificApproval,false);assert.equal(a.sourceAudit.fiqhHumanReviewNeeded,true);
 for(const age of ["4-5","6-8","9-10"]){
  const d=a.ageText[age],intro=d.lines.join(" ");assert.equal(d.lines.length,4);
  assert.ok(d.goal&&d.situation&&d.practice&&d.evidence&&d.summary);assert.equal(d.intro,intro);
  assert.equal(d.audioScript,topics[id]+". "+intro);
  assert.ok(!distinct.has(intro));distinct.add(intro);
  assert.doesNotMatch([d.goal,intro,d.situation,d.practice,d.evidence,d.summary].join(" "),/Masterstimme|QA-Hinweis|Keine Freigabe für Besucher|synthetische Rezitation|scientificApproval|fiqhHumanReviewNeeded|sourceAudit|Audiotest/i);
  const get=(kind,i)=>V.contexts.find(x=>x.lessonId===id&&x.age===age&&x.kind===kind&&(i===undefined||x.index===i));
  assert.equal(get("intro")?.text,intro);assert.equal(get("audio")?.text,d.audioScript);
  for(let i=0;i<4;i++)assert.equal(get("line",i)?.text,d.lines[i]);
  n++;
 }
 assert.equal(V.contexts.find(x=>x.lessonId===id&&x.age==="all"&&x.kind==="summary")?.text,a.ageText["4-5"].audioScript);
}
assert.equal(n,12);
process.stdout.write("PASS Fiqh 70/82/94/106: 12 independent age drafts, 76 voice texts, original Quran/Hadith/quizzes preserved, 0 approvals/audio.\n");
