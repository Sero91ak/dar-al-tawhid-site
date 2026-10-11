#!/usr/bin/env node
"use strict";
/* Reproducible lesson 46–50 Serhat-V4 spoken script queue: zero credits. */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
const policy=JSON.parse(fs.readFileSync(path.join(ROOT,"kids/data/academy-voice-policy-v10.json"),"utf8"));
if(policy.production.modelId!=="eleven_v4"||policy.production.profile!=="kids_story"||policy.voiceIdentity.voiceId!=="DkU7j9uO4ZEtLD2iRZSH")throw Error("Master identity changed");
const box={window:{DARKidsAcademyCurriculum:{"akhlaq-nafs-gutes-herz":{}}}};
vm.runInNewContext(fs.readFileSync(path.join(ROOT,"kids/akademie/curriculum-v26.js"),"utf8"),box,{filename:"curriculum-v26.js",timeout:2500});
const l=Object.values(box.window.DARKidsAcademyCurriculum).filter(t=>t.sourceAudit);
if(l.length!==5)throw Error("V26 requires five verified lesson objects");
const map=new Map();
function add(value,id,kind,age="all"){
 const t=String(value||"").normalize("NFC").replace(/\s+/g," ").trim();
 if(!t)return;if(t.length>700)throw Error("Too long "+id);
 if(!map.has(t))map.set(t,{text:t,lang:"de-DE",voiceProfileId:"serhat-owner-voice-2026",modelId:"eleven_v4",priority:3,reviewStatus:"not-generated",contexts:[]});
 const r=map.get(t);r.priority=Math.min(r.priority,kind==="narration"||kind==="summary"?1:kind==="question"?2:3);
 if(!r.contexts.some(c=>c.lessonId===id&&c.kind===kind&&c.age===age))r.contexts.push({lessonId:id,kind,age});
}
for(const o of l){
 add(o.lead,o.id,"narration");add(o.goal,o.id,"summary");add(o.hadith.text,o.id,"narration");
 add(o.quran.meaning+" "+o.hadith.text,o.id,"summary");add(o.sample,o.id,"summary");
 for(const age of ["4-5","6-8","9-10"]){
  const a=o.ageText[age];add(a.intro,o.id,"narration",age);
  a.lines.forEach(t=>add(t,o.id,"narration",age));add(a.evidence,o.id,"narration",age);
  for(const q of o.questions[age]){add(q.prompt,o.id,"question",age);if(q.type==="choice")q.options.forEach((t,i)=>add("Antwort "+(i+1)+": "+t,o.id,"answer",age))}
 }
}
const plan={schemaVersion:1,version:"academy-voice-plan-v26-20261012",voiceProfileId:"serhat-owner-voice-2026",voiceName:"Serhat Abu Malik – Master",modelId:"eleven_v4",purpose:"Five verified Qurʾān/Ṣaḥīḥ lessons with three distinct age scripts, awaiting exact owner V4 audio; no generated files.",
policy:{nativeTtsFallback:false,arabicQuranRecitationIsSeparate:true,reviewRequiredBeforePublicPlayback:true,autoPublishUnreviewed:false},
lessonCount:5,curriculumIds:l.map(t=>t.id),phraseCount:map.size,
phrases:[...map.values()].sort((a,b)=>a.priority-b.priority||a.text.localeCompare(b.text,"de"))};
fs.writeFileSync(path.join(ROOT,"kids/data/academy-voice-plan-v26.json"),JSON.stringify(plan,null,2)+"\n","utf8");
console.log("KIDS V26 VOICE QUEUE: "+plan.lessonCount+" verified lessons, "+plan.phraseCount+" phrases; 0 credits, 0 approved recordings.");
