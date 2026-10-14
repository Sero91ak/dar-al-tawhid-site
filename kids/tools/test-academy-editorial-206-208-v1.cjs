#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const ids=["fiqh-fehler-beim-ueben","fiqh-ramadan-fasten","fiqh-zakah-und-hajj"];
const titles={"fiqh-fehler-beim-ueben":"Fehler beim Üben des Gebets","fiqh-ramadan-fasten":"Ramaḍān und Fasten kennenlernen","fiqh-zakah-und-hajj":"Zakāh und Ḥaǧǧ als Säulen"};
const voice=JSON.parse(read("kids/data/academy-voice-editorial-206-208-delta-v1.json"));
assert.deepEqual(voice.supersedesContextForLessonIds,ids);
assert.equal(voice.contexts.length,57);assert.equal(voice.generateCreditsUsed,0);
assert.equal(voice.status,"text-only-not-generated-not-approved");
assert.equal(voice.requiresMergeIntoCanonicalVoicePlanBeforeGeneration,true);
const base={};for(const id of ids)base[id]={
 id,topic:titles[id],quran:{surah:1,ayah:1,arabic:"original",label:"original"},
 questions:{"4-5":[1],"6-8":[2],"9-10":[3]},
 ageText:{"4-5":{},"6-8":{},"9-10":{}},
 sourceAudit:{scientificApproval:false,fiqhHumanReviewNeeded:true}
};
const w={DARKidsAcademyCurriculum:base,DARKidsAcademyCurriculumEditorial203205:{scientificApproval:false}};
vm.runInNewContext(read("kids/akademie/curriculum-editorial-206-208-v1.js"),{window:w},{filename:"editorial-206-208"});
const next=w.DARKidsAcademyCurriculum,meta=w.DARKidsAcademyCurriculumEditorial206208;
assert.equal(meta.ageVersionCount,9);assert.equal(meta.scientificApproval,false);
assert.equal(meta.audioGenerated,false);assert.equal(meta.liveApproved,false);
const html=read("kids/akademie/index.html");
const a=html.indexOf("curriculum-editorial-203-205-v1.js"),b=html.indexOf("curriculum-editorial-206-208-v1.js");
assert.ok(a>=0&&b>a,"must load after 203–205");
assert.equal(html.indexOf("curriculum-editorial-206-208-v1.js",b+1),-1,"must load exactly once");
for(const id of ids){
 const l=next[id],distinct=new Set();assert.ok(l,"missing lesson");
 assert.equal(l.sourceAudit.scientificApproval,false);
 assert.equal(l.sourceAudit.fiqhHumanReviewNeeded,true);
 assert.deepEqual(l.questions,base[id].questions);
 assert.deepEqual(l.quran,base[id].quran);
 for(const age of ["4-5","6-8","9-10"]){
  const d=l.ageText[age],intro=d.lines.join(" ");
  assert.equal(d.lines.length,4);
  assert.ok(d.goal&&d.situation&&d.practice&&d.evidence&&d.summary);
  assert.equal(d.intro,intro);
  assert.equal(d.audioScript,titles[id]+". "+intro);
  assert.ok(!distinct.has(intro),"age variants must be different");distinct.add(intro);
  assert.doesNotMatch([d.intro,d.evidence,d.practice,d.situation,d.summary].join(" "),
   /Keine Freigabe für Besucher|synthetische Rezitation|Masterstimme|QA-Hinweis|Audiotest|scientificApproval|fiqhHumanReviewNeeded|Debug|Staging/i);
  const get=(kind,i)=>voice.contexts.find(x=>x.lessonId===id&&x.age===age&&x.kind===kind&&(i===undefined||x.index===i));
  assert.equal(get("intro")?.text,intro);assert.equal(get("audio")?.text,d.audioScript);
  for(let i=0;i<4;i++)assert.equal(get("line",i)?.text,d.lines[i]);
 }
 assert.equal(voice.contexts.find(x=>x.lessonId===id&&x.age==="all"&&x.kind==="summary")?.text,l.ageText["4-5"].audioScript);
}
const zak=next["fiqh-zakah-und-hajj"].ageText;
assert.match(zak["6-8"].lines[1],/Vermögen eines Kindes/);
assert.match(zak["9-10"].lines[1],/Vormund/);
assert.match(zak["9-10"].evidence,/15\/1386/);
assert.match(zak["9-10"].evidence,/15\/1754/);
assert.match(zak["9-10"].evidence,/15\/1800/);
process.stdout.write("PASS: 206–208 / 9 age drafts / 57 voice contexts / minors' Zakat vs Hajj / 0 audio, 0 approvals\n");
