#!/usr/bin/env node
"use strict";
const fs=require("node:fs");
const crypto=require("node:crypto");
const path=require("node:path");
const ROOT=path.resolve(__dirname,"..");
const read=name=>JSON.parse(fs.readFileSync(path.join(ROOT,name),"utf8"));
const SALAM="As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh.";
const OUTRO="Und Allah, subḥānahu wa taʿālā, weiß es am besten.\n\nMöge Allah, subḥānahu wa taʿālā, uns nützliches Wissen schenken, euren Īmān stärken und euch al-Firdaws al-Aʿlā, die höchste Stufe des Paradieses schenken.\n\n"+SALAM;
let checked=0;
function check(text,id){
  if(typeof text!=="string"||!text.startsWith(SALAM.slice(0,-1)))throw Error(id+": full opening Salām missing");
  if(!text.endsWith(OUTRO))throw Error(id+": required closing differs");
  if(text.split(OUTRO).length!==2)throw Error(id+": duplicated closing");
  checked++;
}
const deen=read("kids/data/deen-lessons.json").items;
if(deen.length!==6)throw Error("Unexpected Dīn primary lesson count");
for(const item of deen){
  check(item.masterStoryText,"Dīn:"+item.id);
  for(const age of ["4-5","6-8","9-10"]){
    if(item.scripts?.[age]!==item.masterStoryText)throw Error(item.id+": different age master "+age);
  }
  if(Object.values(item.audio||{}).some(a=>a&&a.url))throw Error(item.id+": audio present; re-check exact parity before edits");
}
const curriculum=read("kids/data/deen-curriculum-v1.json");
const followUps=curriculum.categories.flatMap(c=>(c.lessons||[]).filter(l=>l.masterStoryText));
if(followUps.length!==24)throw Error("Unexpected Dīn follow-up count");
for(const l of followUps)check(l.masterStoryText,"Dīn:"+l.id);
const salaf=read("kids/data/salaf-library-v1.json").items;
if(salaf.length!==34)throw Error("Unexpected Salaf story count");
for(const item of salaf){
  check(item.masterStoryText,"Salaf:"+item.id);
  const master=item.audioMaster;
  if(!master?.url){
    if(master!=null)throw Error(item.id+": incomplete Salaf audioMaster; use null before approval");
    continue;
  }
  if(item.verification!=="approved"||item.editorialRelease!==true)
    throw Error(item.id+": unreleased story must never receive a public recording");
  if(master.modelId!=="eleven_v4"||master.voiceId!=="DkU7j9uO4ZEtLD2iRZSH"||
     master.voiceProfileId!=="serhat-owner-voice-2026"||master.profile!=="kids_story")
    throw Error(item.id+": Salaf wrong master voice/model");
  if(master.humanListeningApproved!==true||master.approvedForPlayback!==true||
     master.releaseEnabled!==true||master.languageCode!=="de"||
     master.globalArabicDictionaryApplied!==false)
    throw Error(item.id+": public Salaf audio lacks confirmed language-isolated human listening approval");
  const approval=master.approvalEvidence||{};
  if(!approval.reviewer||!approval.reviewedAt||approval.germanPronunciationPassed!==true||
     approval.fushaTermsPassed!==true||approval.iphonePlaybackPassed!==true||
     approval.ipadPlaybackPassed!==true||approval.textAudioParityPassed!==true)
    throw Error(item.id+": missing real hearing, German/Fuṣḥā or iOS/iPad QA evidence");
  const textHash=crypto.createHash("sha256").update(item.masterStoryText,"utf8").digest("hex");
  if(master.textSha256!==textHash)
    throw Error(item.id+": recording no longer matches the exact master text");
  const expected="/kids/audio/salaf/"+item.id+".m4a";
  const url=new URL(master.url,"https://dar-al-tawhid.de");
  if(url.origin!=="https://dar-al-tawhid.de"||url.pathname!==expected)
    throw Error(item.id+": public Salaf audio path must be canonical");
  const file=path.join(ROOT,url.pathname.slice(1));
  if(!fs.existsSync(file)||fs.statSync(file).size<8000)
    throw Error(item.id+": approved audio file missing");
  const fileSha=crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  if(master.sha256!==fileSha)
    throw Error(item.id+": audio SHA256 changed after hearing approval");
  const paragraphs=item.masterStoryText.split(/\n{2,}/).filter(Boolean);
  const cues=master.timings;
  if(!Array.isArray(cues)||cues.length!==paragraphs.length)
    throw Error(item.id+": no exact paragraph count for read-along timing");
  let previous=-1;
  for(let n=0;n<cues.length;n++){
    const t=cues[n],start=Number(t?.start),end=Number(t?.end);
    if(t?.paragraphIndex!==n||!Number.isFinite(start)||!Number.isFinite(end)||
       start<0||start<=previous||end<start)
      throw Error(item.id+": invalid Salaf aligned paragraph "+n);
    previous=start;
  }
}
const other=read("kids/data/stories-authentic.json");
if(other.items.length!==4)throw Error("Unexpected authentic story count");
if(other.policy?.storyTextStandard?.outro!==OUTRO)throw Error("Shared story standard differs");
for(const item of other.items)check(item.text,"Story:"+item.id);
// Voice Studio is a separate release lane and is checked in its own PR.\nconsole.log("Master closing v2: "+checked+" verified texts; single-master parity intact.");
