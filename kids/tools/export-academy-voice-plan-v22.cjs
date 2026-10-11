#!/usr/bin/env node
"use strict";
/* V22 exact voice plan for four authentic age-tiered lessons. ZERO billable calls. */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../.."),POLICY=JSON.parse(fs.readFileSync(path.join(ROOT,"kids/data/academy-voice-policy-v10.json"),"utf8"));
if(POLICY.voiceIdentity.voiceId!=="DkU7j9uO4ZEtLD2iRZSH"||POLICY.production.modelId!=="eleven_v4"||POLICY.production.profile!=="kids_story")throw Error("Master identity/profile changed");
const sandbox={window:{DARKidsAcademyCurriculum:{"aqidah-ikhlas-gute-absichten":{},"fiqh-salah-gebet-lernen":{}}}};
vm.runInNewContext(fs.readFileSync(path.join(ROOT,"kids/akademie/curriculum-v22.js"),"utf8"),sandbox,{timeout:2000});
const catalog=sandbox.window.DARKidsAcademyCurriculum;
const ids=Object.keys(catalog).filter(id=>!!catalog[id].sourceAudit);
if(ids.length!==4)throw Error("V22 must have exactly 4 audited lessons");
const rows=new Map(),VOICE="serhat-owner-voice-2026",MODEL="eleven_v4";
const normalize=s=>String(s||"").normalize("NFC").replace(/\s+/g," ").trim();
function add(s,lessonId,kind,age="all"){
 const text=normalize(s);if(!text)return;
 if(text.length>700)throw Error("Too long voice request "+lessonId);
 if(!rows.has(text))rows.set(text,{text,lang:"de-DE",voiceProfileId:VOICE,modelId:MODEL,priority:3,reviewStatus:"not-generated",contexts:[]});
 const r=rows.get(text),ctx={lessonId,kind,age};
 r.priority=Math.min(r.priority,kind==="narration"||kind==="summary"?1:kind==="question"?2:3);
 if(!r.contexts.some(c=>c.lessonId===lessonId&&c.kind===kind&&c.age===age))r.contexts.push(ctx);
}
for(const id of ids){
 const l=catalog[id];
 add(l.lead,id,"narration");add(l.goal,id,"summary");add(l.hadith.text,id,"narration");
 add(l.quran.meaning+" "+l.hadith.text,id,"summary");add(l.sample,id,"summary");
 for(const age of ["4-5","6-8","9-10"]){
  const teaching=l.ageText[age];add(teaching.intro,id,"narration",age);
  teaching.lines.forEach(x=>add(x,id,"narration",age));add(teaching.evidence,id,"narration",age);
  for(const q of l.questions[age]){
   add(q.prompt,id,"question",age);
   if(q.type==="choice")q.options.forEach((answer,i)=>add("Antwort "+(i+1)+": "+answer,id,"answer",age));
  }
 }
}
const output={schemaVersion:1,version:"academy-voice-plan-v22-20261011",voiceProfileId:VOICE,voiceName:"Serhat Abu Malik – Master",modelId:MODEL,
 purpose:"Prepared exact-match V22 German teaching; NOT GENERATED, never speech synthesis fallback",
 policy:{nativeTtsFallback:false,arabicQuranRecitationIsSeparate:true,reviewRequiredBeforePublicPlayback:true,autoPublishUnreviewed:false},
 lessonCount:ids.length,curriculumIds:ids,phraseCount:rows.size,
 phrases:[...rows.values()].sort((a,b)=>a.priority-b.priority||a.text.localeCompare(b.text,"de"))};
const outputPath=path.join(ROOT,"kids/data/academy-voice-plan-v22.json");
fs.writeFileSync(outputPath,JSON.stringify(output,null,2)+"\n","utf8");
console.log("KIDS V22 ZERO CREDITS:",output.lessonCount,"lessons,",output.phraseCount,"new exact texts, all awaiting approval.");
