#!/usr/bin/env node
"use strict";
/* Draft-only integrity test for Taslim child text and deferred voice plan. No audio generated. */
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"../..");
const curriculum=fs.readFileSync(path.join(root,"kids/akademie/curriculum-v38.js"),"utf8");
const start=curriculum.indexOf("{",curriculum.indexOf("const additions="));
let depth=0,quote=false,escaped=false,end=-1;
for(let i=start;i<curriculum.length;i++){
 const ch=curriculum[i];
 if(quote){if(escaped)escaped=false;else if(ch==="\\")escaped=true;else if(ch==='"')quote=false;}
 else if(ch==='"')quote=true;else if(ch==="{")depth++;else if(ch==="}"&&--depth===0){end=i+1;break;}
}
assert.ok(end>start,"V38 additions must parse");
const lessons=JSON.parse(curriculum.slice(start,end));
const lesson=lessons["fiqh-taslim"];
assert.ok(lesson&&lesson.sourceAudit.fiqhHumanReviewNeeded===true&&lesson.sourceAudit.scientificApproval===false);
assert.equal(lesson.quran.surah,4);
assert.equal(lesson.quran.ayah,86);
const voice=JSON.parse(fs.readFileSync(path.join(root,"kids/data/academy-voice-plan-v38.json"),"utf8"));
assert.equal(voice.policy.generateCreditsUsed,0);
assert.equal(voice.phraseCount,voice.phrases.length);
const records=voice.phrases.filter(p=>p.contexts?.some(c=>c.lessonId==="fiqh-taslim"));
const textSet=new Set(records.map(x=>x.text));
assert.ok(records.length>0,"Taslim text expected in deferred voice plan");
const broken=/Wir haben ihn auf dieser Seite(?: nicht als)?\./;
for(const age of ["4-5","6-8","9-10"]){
 const block=lesson.ageText[age];
 assert.ok(!broken.test(JSON.stringify(block)),"incomplete child script: "+age);
 assert.ok(textSet.has(block.intro),"intro missing from voice plan: "+age);
 assert.ok(textSet.has(block.audioScript),"audio text missing from voice plan: "+age);
 for(const line of block.lines)assert.ok(textSet.has(line),"teaching line missing from voice plan: "+age);
}
for(const entry of records)assert.ok(!broken.test(entry.text),"truncated deferred voice text");
console.log("PASS: Fiqh 205 child copy and 3-age deferred voice texts are coherent; Qurʾān 4:86 not a ritual proof, sources unapproved, credits 0.");
