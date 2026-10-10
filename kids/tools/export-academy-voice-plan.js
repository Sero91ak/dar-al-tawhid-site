#!/usr/bin/env node
"use strict";
/* Reproducible, non-billing Academy voice production manifest.
 * Builds exact spoken German phrases from both shipped lesson packs;
 * Qurʾān Arabic remains real recitation, never ElevenLabs generated.
 * Pending entries are NOT playable until a separately reviewed audio
 * manifest contains their exact key and an approved Serhat recording.
 */
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
const context={window:{}};
for(const file of ["kids/akademie/curriculum-v1.js","kids/akademie/curriculum-v2.js"]){
 vm.runInNewContext(fs.readFileSync(path.join(ROOT,file),"utf8"),context,{filename:file,timeout:1200});
}
const all=context.window.DARKidsAcademyCurriculum||{};
const lessons=Object.values(all);
if(lessons.length!==33)throw Error("Expected 33 curriculum entries plus the existing Ṣidq lesson; got "+lessons.length);
const unique=new Map();
function add(s,lessonId,kind,age="all"){
 const text=String(s||"").normalize("NFC").replace(/\\s+/g," ").trim();
 if(!text)return;
 if(text.length>700)throw Error("Too long voice request "+lessonId);
 const key=text;
 if(!unique.has(key))unique.set(key,{text,lang:"de-DE",voiceProfileId:"serhat-owner-voice-2026",modelId:"eleven_flash_v2_5",priority:3,reviewStatus:"not-generated",contexts:[]});
 const item=unique.get(key);
 const priority=kind==="narration"||kind==="summary"?1:kind==="question"?2:3;
 item.priority=Math.min(item.priority,priority);
 const context={lessonId,kind,age};
 if(!item.contexts.some(x=>x.lessonId===lessonId&&x.kind===kind&&x.age===age))item.contexts.push(context);
}
for(const lesson of lessons){
 const id=lesson.id;
 add(lesson.lead,id,"narration");
 add(lesson.lead+" "+lesson.goal,id,"narration");
 lesson.lines.forEach(line=>add(line,id,"narration"));
 add(lesson.hadith.text,id,"narration");
 add("Qurʾān: "+lesson.quran.meaning+" Sunnah: "+lesson.hadith.text,id,"narration");
 add(lesson.goal,id,"summary");
 add(lesson.quran.meaning+" "+lesson.hadith.text,id,"summary");
 add(lesson.sample,id,"summary");
 for(const age of ["4-5","6-8","9-10"]){
  const questions=lesson.questions?.[age]||[];
  if(!questions.length)throw Error("No questions "+id+" "+age);
  questions.forEach(q=>{
   add(q.prompt,id,"question",age);
   if(q.type==="choice")q.options.forEach((answer,i)=>add("Antwort "+(i+1)+": "+answer,id,"answer",age));
  });
 }
}
const output={
 schemaVersion:1,
 version:"academy-voice-plan-v9-20261010",
 voiceProfileId:"serhat-owner-voice-2026",
 voiceName:"Serhat Abu Malik – Master",
 modelId:"eleven_flash_v2_5",
 purpose:"German exact-match speech recording inventory; no generated audio URLs are claimed.",
 policy:{nativeTtsFallback:false,arabicQuranRecitationIsSeparate:true,reviewRequiredBeforePublicPlayback:true,autoPublishUnreviewed:false},
 lessonCount:lessons.length+1,
 curriculumIds:lessons.map(x=>x.id),
 phraseCount:unique.size,
 phrases:[...unique.values()].sort((a,b)=>a.priority-b.priority||a.text.localeCompare(b.text,"de"))
};
const filename=path.join(ROOT,"kids/data/academy-voice-plan-v9.json");
fs.writeFileSync(filename,JSON.stringify(output,null,2)+"\\n","utf8");
console.log("ACADEMY VOICE PLAN:",output.lessonCount,"lessons /",output.phraseCount,"unique German phrases; all pending human approval");
