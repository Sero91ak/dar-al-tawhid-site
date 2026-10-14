#!/usr/bin/env node
"use strict";
/* Regression: editorial 130–146 is PR-only, audio deltas are text-only, no public release. */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../..");
const blocks=["130","131-133","134-137","138-141","142","143-146"];
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const ageKeys=["4-5","6-8","9-10"];
const contextsByBlock=new Map(),base=Object.create(null),allIds=[];
for(const b of blocks){
 const v=JSON.parse(read("kids/data/academy-voice-editorial-"+b+"-delta-v1.json"));
 assert.equal(v.generateCreditsUsed,0,"No credits allowed: "+b);
 assert.equal(v.status,"text-only-not-generated-not-approved",b);
 assert.equal(v.requiresMergeIntoCanonicalVoicePlanBeforeGeneration,true,b);
 assert.equal(v.contexts.length,v.supersedesContextForLessonIds.length*19,b+" context count");
 contextsByBlock.set(b,v);
 for(const id of v.supersedesContextForLessonIds){
  assert.ok(!base[id],"Duplicate lesson id: "+id);
  allIds.push(id);
  const intro=v.contexts.find(x=>x.lessonId===id&&x.age==="4-5"&&x.kind==="intro").text;
  const audio=v.contexts.find(x=>x.lessonId===id&&x.age==="4-5"&&x.kind==="audio").text;
  assert.ok(audio.endsWith(intro),"Audio doesn't end with intro: "+id);
  const topic=audio.slice(0,-intro.length-2);
  base[id]={id,topic,quran:{arabic:"يَاأَيُّهَا يَابَنِيَّ"},hadith:{},
   sourceAudit:{scientificApproval:false,fiqhHumanReviewNeeded:true},
   ageText:{"4-5":{},"6-8":{},"9-10":{}}};
 }
}
const browser={DARKidsAcademyCurriculum:base,DARKidsAcademyCurriculumEditorial127129:true};
const index=read("kids/akademie/index.html");
let prev=index.indexOf("curriculum-editorial-127-129-v1.js");
assert.ok(prev>0,"Missing editorial predecessor 127–129");
assert.ok(!index.includes("curriculum-editorial-130-133-v1.js"),"Duplicate 130–133 script remains");
for(const b of blocks){
 const f="curriculum-editorial-"+b+"-v1.js";
 const tag='<script src="/kids/akademie/'+f;
 const p=index.indexOf(tag);
 assert.ok(p>prev,"Wrong dependency order for "+b);
 assert.equal(index.indexOf(tag,p+1),-1,"Duplicate script tag "+b);
 prev=p;
 vm.runInNewContext(read("kids/akademie/"+f),{window:browser},{filename:f});
 const v=contextsByBlock.get(b);
 for(const id of v.supersedesContextForLessonIds){
  const l=browser.DARKidsAcademyCurriculum[id];
  assert.ok(l,"Missing lesson "+id);
  assert.equal(l.sourceAudit.scientificApproval,false,"Unexpected scholarly approval "+id);
  if(id.startsWith("fiqh-"))assert.equal(l.sourceAudit.fiqhHumanReviewNeeded,true,"Fiqh gate "+id);
  for(const age of ageKeys){
   const d=l.ageText[age];
   assert.ok(d&&d.lines.length===4,"Missing four lines: "+id+"/"+age);
   const get=(kind,index)=>v.contexts.find(x=>x.lessonId===id&&x.age===age&&x.kind===kind&&(index===undefined||x.index===index));
   assert.equal(d.intro,get("intro")?.text,"Intro mismatch "+id+"/"+age);
   assert.equal(d.audioScript,get("audio")?.text,"Audio mismatch "+id+"/"+age);
   for(let i=0;i<4;i++)assert.equal(d.lines[i],get("line",i)?.text,"Line mismatch "+id+"/"+age+"/"+i);
   assert.doesNotMatch(d.intro,/Keine Freigabe für Besucher|synthetische Rezitation|Masterstimme testen|Audiotest|QA-Hinweis/i,"Internal text visible "+id+"/"+age);
  }
  const summary=v.contexts.find(x=>x.lessonId===id&&x.age==="all"&&x.kind==="summary");
  assert.ok(summary&&summary.text.length>50,"Missing summary voice context "+id);
 }
}
assert.equal(allIds.length,17,"Expected editorial lessons 130–146");
assert.equal(new Set(allIds).size,17,"Duplicate id in editorial block");
process.stdout.write("PASS: "+allIds.length+" lessons, "+allIds.length*3+" ages, "+allIds.length*19+" ungenerated text contexts, 0 audio, 0 approvals; index order valid.\n");
