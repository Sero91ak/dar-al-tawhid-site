#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const ids=["adab-digital","fiqh-tashahhud","fiqh-taslim"];
const titles={"adab-digital":"Digitalen Adab üben","fiqh-tashahhud":"Tashahhud als Gebetsbestandteil","fiqh-taslim":"Den Gebetsabschluss kennenlernen"};
const voice=JSON.parse(read("kids/data/academy-voice-editorial-203-205-delta-v1.json"));
assert.deepEqual(voice.supersedesContextForLessonIds,ids);
assert.equal(voice.contexts.length,57);assert.equal(voice.generateCreditsUsed,0);
assert.equal(voice.status,"text-only-not-generated-not-approved");
const base={};for(const id of ids)base[id]={id,topic:titles[id],quran:{surah:1,ayah:1,arabic:"unchanged"},questions:{"4-5":[1],"6-8":[2],"9-10":[3]},ageText:{"4-5":{},"6-8":{},"9-10":{}},sourceAudit:{scientificApproval:false}};
const w={DARKidsAcademyCurriculum:base,DARKidsAcademyCurriculumEditorial199202:{scientificApproval:false}};
vm.runInNewContext(read("kids/akademie/curriculum-editorial-203-205-v1.js"),{window:w});
const out=w.DARKidsAcademyCurriculum,meta=w.DARKidsAcademyCurriculumEditorial203205;
assert.equal(meta.ageVersionCount,9);assert.equal(meta.scientificApproval,false);assert.equal(meta.audioGenerated,false);
const html=read("kids/akademie/index.html");
const a=html.indexOf("curriculum-editorial-199-202-v1.js"),b=html.indexOf("curriculum-editorial-203-205-v1.js");
assert.ok(a>=0&&b>a);assert.equal(html.indexOf("curriculum-editorial-203-205-v1.js",b+1),-1);
for(const id of ids){
 const l=out[id],unique=new Set();assert.equal(l.sourceAudit.scientificApproval,false);
 assert.deepEqual(l.questions,base[id].questions);assert.deepEqual(l.quran,base[id].quran);
 if(id.startsWith("fiqh-"))assert.equal(l.sourceAudit.fiqhHumanReviewNeeded,true);
 for(const age of ["4-5","6-8","9-10"]){
  const v=l.ageText[age],t=v.lines.join(" ");assert.equal(v.lines.length,4);
  assert.ok(v.goal&&v.situation&&v.practice&&v.evidence&&v.summary);
  assert.equal(v.intro,t);assert.equal(v.audioScript,titles[id]+". "+t);
  assert.ok(!unique.has(t));unique.add(t);
  assert.doesNotMatch([v.intro,v.evidence,v.practice,v.summary].join(" "),/scientificApproval|fiqhHumanReviewNeeded|Keine Freigabe für Besucher|Masterstimme|QA-Hinweis/i);
  const ctx=(kind,i)=>voice.contexts.find(x=>x.lessonId===id&&x.age===age&&x.kind===kind&&(i===undefined||x.index===i));
  assert.equal(ctx("intro")?.text,t);assert.equal(ctx("audio")?.text,v.audioScript);
  for(let i=0;i<4;i++)assert.equal(ctx("line",i)?.text,v.lines[i]);
 }
 assert.equal(voice.contexts.find(x=>x.lessonId===id&&x.age==="all"&&x.kind==="summary")?.text,l.ageText["4-5"].audioScript);
}
process.stdout.write("PASS: 203–205, nine age drafts, 57 ungenerated voice contexts, Fiqh holds, loader and quiz unchanged\n");
