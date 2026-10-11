#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
const policy=JSON.parse(fs.readFileSync(path.join(ROOT,"kids/data/academy-voice-policy-v10.json"),"utf8"));
if(policy.production.modelId!=="eleven_v4"||policy.production.profile!=="kids_story"||policy.voiceIdentity.voiceId!=="DkU7j9uO4ZEtLD2iRZSH")throw Error("Masterstimme nicht autorisiert");
const sandbox={window:{DARKidsAcademyCurriculum:{"aqidah-dua-allah-bitten":{}}}};
vm.runInNewContext(fs.readFileSync(path.join(ROOT,"kids/akademie/curriculum-v25.js"),"utf8"),sandbox,{filename:"curriculum-v25.js",timeout:2000});
const lessons=Object.values(sandbox.window.DARKidsAcademyCurriculum).filter(l=>l.sourceAudit);
if(lessons.length!==7)throw Error("V25 pack must contain 7 lessons");
const phrases=new Map();
function add(text,id,kind,age="all"){
 const s=String(text||"").normalize("NFC").replace(/\s+/g," ").trim();if(!s)return;if(s.length>700)throw Error("too long "+id);
 if(!phrases.has(s))phrases.set(s,{text:s,lang:"de-DE",voiceProfileId:"serhat-owner-voice-2026",modelId:"eleven_v4",priority:3,reviewStatus:"not-generated",contexts:[]});
 const p=phrases.get(s);p.priority=Math.min(p.priority,kind==="narration"||kind==="summary"?1:kind==="question"?2:3);
 if(!p.contexts.some(x=>x.lessonId===id&&x.kind===kind&&x.age===age))p.contexts.push({lessonId:id,kind,age});
}
for(const l of lessons){
 add(l.lead,l.id,"narration");add(l.goal,l.id,"summary");add(l.hadith.text,l.id,"narration");
 add(l.quran.meaning+" "+l.hadith.text,l.id,"summary");add(l.sample,l.id,"summary");
 for(const age of ["4-5","6-8","9-10"]){
  const a=l.ageText[age];add(a.intro,l.id,"narration",age);a.lines.forEach(x=>add(x,l.id,"narration",age));add(a.evidence,l.id,"narration",age);
  for(const q of l.questions[age]){add(q.prompt,l.id,"question",age);
   if(q.type==="choice")q.options.forEach((o,i)=>add("Antwort "+(i+1)+": "+o,l.id,"answer",age));
  }
 }
}
const plan={schemaVersion:1,version:"academy-voice-plan-v25-20261011",voiceProfileId:"serhat-owner-voice-2026",voiceName:"Serhat Abu Malik – Master",modelId:"eleven_v4",
 purpose:"Seven source-reviewed German age-tier lesson scripts; zero synthesized or approved recordings.",
 policy:{nativeTtsFallback:false,arabicQuranRecitationIsSeparate:true,reviewRequiredBeforePublicPlayback:true,autoPublishUnreviewed:false},
 lessonCount:lessons.length,curriculumIds:lessons.map(l=>l.id),phraseCount:phrases.size,
 phrases:[...phrases.values()].sort((a,b)=>a.priority-b.priority||a.text.localeCompare(b.text,"de"))};
fs.writeFileSync(path.join(ROOT,"kids/data/academy-voice-plan-v25.json"),JSON.stringify(plan,null,2)+"\n","utf8");
console.log("KIDS V25 ZERO CREDIT:",plan.lessonCount,"lessons,",plan.phraseCount,"exact audio scripts.");
