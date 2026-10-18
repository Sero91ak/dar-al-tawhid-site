#!/usr/bin/env node
"use strict";
/* KIDS Akademie: read-only check for core lessons 006–009; never generates audio or deploys. */
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const JS=read("kids/akademie/curriculum-editorial-core-006-009-v1.js");
function extractDrafts(t){
 const marker="const drafts=",p=t.indexOf(marker);
 assert.ok(p>=0,"editorial drafts missing");
 const start=t.indexOf("{",p+marker.length);assert.ok(start>=0);
 let quote=false,escaped=false,depth=0;
 for(let i=start;i<t.length;i++){
  const x=t[i];
  if(quote){if(escaped)escaped=false;else if(x==="\\")escaped=true;else if(x==='"')quote=false;continue}
  if(x==='"'){quote=true;continue}
  if(x==="{")depth++;
  else if(x==="}"&&--depth===0)return JSON.parse(t.slice(start,i+1));
 }
 throw Error("Incomplete editorial drafts");
}
const D=extractDrafts(JS),V=JSON.parse(read("kids/data/academy-voice-editorial-core-006-009-delta-v1.json"));
const names=["adab-worte","fiqh-wudu","aqidah-iman","akhlaq-amanah"];
assert.deepEqual(new Set(Object.keys(D)),new Set(names));
assert.equal(V.contexts.length,76);
assert.equal(V.generateCreditsUsed,0);
assert.equal(V.status,"text-only-not-generated-not-approved");
assert.equal(V.requiresMergeIntoCanonicalVoicePlanBeforeGeneration,true);
const source=JSON.parse(read("kids-akademie/research/SOURCE_REGISTRY.json")).sources.find(x=>x.sourceId==="SRC-CORE8-MUSLIM-8");
assert.ok(source&&source.lessonIds.includes("aqidah-iman"),"Muslim 8 must be tied to Iman lesson");
assert.ok(source.directLink.includes("dorar.net/hadith/sharh/25545"),"Arabic Muslim 8 proof link changed");
for(const [id,versions] of Object.entries(D)){
 for(const age of ["4-5","6-8","9-10"]){
  const d=versions[age],intro=d.lines.join(" ");
  assert.equal(d.lines.length,4);
  const c=V.contexts.filter(x=>x.lessonId===id&&x.age===age);
  assert.equal(c.length,6,"missing voice contexts "+id+"/"+age);
  assert.equal(c.find(x=>x.kind==="intro")?.text,intro);
  assert.ok(c.find(x=>x.kind==="audio")?.text.endsWith(intro));
  for(let i=0;i<4;i++)assert.equal(c.find(x=>x.kind==="line"&&x.index===i)?.text,d.lines[i]);
  assert.doesNotMatch([d.goal,d.evidence,d.situation,d.practice,d.summary,...d.lines].join(" "),/scientificApproval|fiqhHumanReviewNeeded|QA-Hinweis|Masterstimme|Keine Freigabe für Besucher/i);
 }
 assert.equal(V.contexts.find(x=>x.lessonId===id&&x.age==="all"&&x.kind==="summary")?.text,V.contexts.find(x=>x.lessonId===id&&x.age==="4-5"&&x.kind==="audio")?.text);
}
const iman=D["aqidah-iman"];
for(const age of ["4-5","6-8","9-10"]){
 assert.match(iman[age].evidence,/Ṣaḥīḥ Muslim 8(?:\s|,|\()/,"must use verified numbering Muslim 8 in age "+age);
 assert.doesNotMatch([iman[age].evidence,...iman[age].lines,iman[age].practice].join(" "),/Muslim 8a/,"undefined English numbering convention in child sources");
}
const index=read("kids/akademie/index.html"),needle="curriculum-editorial-core-006-009-v1.js",pos=index.indexOf(needle);
assert.ok(pos>=0);assert.equal(index.indexOf(needle,pos+1),-1);
console.log("PASS: core 006–009; 12 age texts, 76 ungenerated voice contexts, authentic Muslim 8 source ID/URL and exact child citation; no approvals/audio.");
