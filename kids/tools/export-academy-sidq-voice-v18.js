#!/usr/bin/env node
"use strict";
/**
 * Ṣidq V18: reproducible exact-string inventory for the Academy foundation lesson.
 * The original V9 manifest contains 33 curriculum lessons, not the standalone Ṣidq
 * lesson. This inventory is additional, NEVER a replacement for those 454 phrases.
 * No synthesis, account state, public audio manifest or secrets are touched.
 */
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"../..");
const html=fs.readFileSync(path.join(root,"kids/akademie/index.html"),"utf8");
const policy=JSON.parse(fs.readFileSync(path.join(root,"kids/data/academy-voice-policy-v10.json"),"utf8"));
if(policy.production.modelId!=="eleven_v4"||policy.production.profile!=="kids_story"||
   policy.voiceIdentity.voiceProfileId!=="serhat-owner-voice-2026")throw Error("Unapproved voice configuration");
function extract(token){
 const begin=html.indexOf(token);
 if(begin<0)throw Error("Missing source "+token);
 const start=html.indexOf("{",begin+token.length);
 if(start<0)throw Error("Missing data block "+token);
 let depth=0,inString=false,escaped=false,end=-1;
 for(let i=start;i<html.length;i++){
  const c=html[i];
  if(inString){if(escaped)escaped=false;else if(c==="\\")escaped=true;else if(c==='"')inString=false;continue}
  if(c==='"'){inString=true;continue}
  if(c==="{")depth++;
  if(c==="}"&&!--depth){end=i+1;break}
 }
 if(end<0)throw Error("Unclosed source "+token);
 const literal=html.slice(start,end)
  .replace(/([,{]\s*)([A-Za-z_$][\w$]*):/g,'$1"$2":');
 return JSON.parse(literal);
}
const ui=extract("const AGE_UI=Object.freeze(");
const teaching=extract("const AGE_EXPLANATIONS=Object.freeze(");
const exercises=extract("const exercises=");
const ageKeys=["4-5","6-8","9-10"];
const phrases=new Map();
function add(text,kind,age="all",profile="both"){
 const s=String(text||"").normalize("NFC").replace(/\s+/g," ").trim();
 if(!s)return;
 if(s.length>700)throw Error("Phrase too long: "+kind);
 const priority=kind==="greeting"?0:kind==="narration"?1:kind==="question"?2:3;
 if(!phrases.has(s))phrases.set(s,{
  text:s,lang:"de-DE",voiceProfileId:"serhat-owner-voice-2026",
  modelId:"eleven_v4",priority,reviewStatus:"not-generated",contexts:[]
 });
 const v=phrases.get(s);v.priority=Math.min(v.priority,priority);
 if(!v.contexts.some(c=>c.kind===kind&&c.age===age&&c.profile===profile))
  v.contexts.push({lessonId:"sidq",kind,age,profile});
}
const salams={girl:"As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh.",
 boy:"As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh."};
for(const [profile,salam] of Object.entries(salams))add(salam,"greeting","all",profile);
// Anrede ist ein eigener Sprachbaustein, nie Teil eines verkürzten Salām.
add("Liebe Schwester.","address","all","girl");
add("Lieber Bruder.","address","all","boy");
for(const age of ageKeys){
 const u=ui[age],e=teaching[age],questions=exercises[age];
 if(!u?.welcomeNext||!u?.welcomeBody||!Array.isArray(e?.lines)||e.lines.length!==4||
    !e.evidence||!Array.isArray(e.recap)||e.recap.length!==3||
    !Array.isArray(questions)||!questions.length)throw Error("Ṣidq teaching source incomplete: "+age);
 add(u.welcomeNext,"greeting",age);
 add(u.welcomeBody,"narration",age);
 add(e.lead,"narration",age);
 e.lines.forEach(s=>add(s,"narration",age));
 add(e.evidence,"narration",age);
 e.recap.forEach(s=>add(s,"summary",age));
 questions.forEach(q=>{
  add(q.prompt,"question",age);
  if(q.type==="choice")q.options.forEach((a,i)=>add("Antwort "+(i+1)+": "+a,"answer",age));
 });
}
// Exactly the text spoken by the standalone Hadith listen control.
add("Wahrhaftigkeit führt zur Rechtschaffenheit, und Rechtschaffenheit führt zum Paradies.","narration","all");
const audio=JSON.parse(fs.readFileSync(path.join(root,"kids/data/academy-audio-staging-v9.json"),"utf8"));
if(audio.modelId!=="eleven_v4"||audio.voiceSettingsProfile!=="kids_story"||
   !audio.stagingOnly||Object.keys(audio.entries||{}).length!==4)throw Error("Original four-clip pilot changed");
for(const t of Object.keys(audio.entries))if(!phrases.has(t))throw Error("Pilot phrase absent from inventory: "+t);
const entries=[...phrases.values()].sort((a,b)=>a.priority-b.priority||a.text.localeCompare(b.text,"de"));
const output={
 schemaVersion:1,version:"academy-sidq-voice-plan-v18-20261011",
 voiceProfileId:"serhat-owner-voice-2026",voiceName:"Serhat Abu Malik – Master",
 modelId:"eleven_v4",voiceSettingsProfile:"kids_story",
 lessonId:"sidq",lessonCount:1,ageKeys,phraseCount:entries.length,
 additionalTo:"kids/data/academy-voice-plan-v9.json",
 existingPilotCount:Object.keys(audio.entries).length,
 policy:{stagingOnly:true,reviewRequiredBeforePublicPlayback:true,autoPublishUnreviewed:false,nativeTtsFallback:false},
 phrases:entries
};
const file=path.join(root,"kids/data/academy-sidq-voice-plan-v18.json");
if(process.argv.includes("--check")){
 const current=JSON.parse(fs.readFileSync(file,"utf8"));
 if(JSON.stringify(current)!==JSON.stringify(output))throw Error("Ṣidq V18 inventory out of sync");
}else fs.writeFileSync(file,JSON.stringify(output,null,2)+"\n","utf8");
console.log("ṢIDQ V18 VOICE PLAN",output.phraseCount,"unique foundation phrases + 454 V9 phrases; 4 unreleased pilot recordings");
