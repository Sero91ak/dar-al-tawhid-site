#!/usr/bin/env node
"use strict";

/* Read-only guard for the 54 newly redigierten lessons. No network, TTS or deploy.
 * Audits what children can see or hear, not the internal sourceAudit metadata.
 */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const groups=["155-158","159-162","163-166","167-170","171-174","175-178",
 "179-182","183-186","187-190","191-194","195-198","199-202","203-205","206-208"];
const ages=["4-5","6-8","9-10"];
const internal=/scientificApproval|fiqhHumanReviewNeeded|sourceAudit|QA[- ]Hinweis|Keine Freigabe für Besucher|nicht für Besucher|Masterstimme|Audio-?test|synthetische Rezitation|\bStaging\b|\bDebug\b|\bTODO\b|\bPreview\b|\bMock[- ]?(?:Text|Daten)|\bTTS[- ]?Test\b/i;
const ledger=JSON.parse(read("kids-akademie/LESSON_STATUS.json")).lessons;
const byId=new Map(ledger.map(x=>[x.lessonId,x]));
const html=read("kids/akademie/index.html");
const seenIds=new Map();
const problems=[];
let ageCount=0,voiceCount=0;
const check=(ok,msg)=>{if(!ok)problems.push(msg)};
function extractDrafts(text,group){
 const marker="const drafts=",p=text.indexOf(marker);
 assert.ok(p>=0,group+" missing drafts object");
 const start=text.indexOf("{",p+marker.length);
 let quoted=false,escape=false,level=0;
 for(let i=start;i<text.length;i++){
  const ch=text[i];
  if(quoted){if(escape)escape=false;else if(ch==="\\")escape=true;else if(ch==='"')quoted=false;continue}
  if(ch==='"'){quoted=true;continue}
  if(ch==="{")level++;
  if(ch==="}"&&--level===0)return JSON.parse(text.slice(start,i+1));
 }
 throw new Error(group+": unterminated drafts JSON");
}
let predecessor="";
for(const group of groups){
 const jsFile="kids/akademie/curriculum-editorial-"+group+"-v1.js";
 const voiceFile="kids/data/academy-voice-editorial-"+group+"-delta-v1.json";
 const drafts=extractDrafts(read(jsFile),group);
 const voice=JSON.parse(read(voiceFile));
 const ids=Object.keys(drafts),needed=group==="203-205"||group==="206-208"?3:4;
 check(ids.length===needed,group+": incorrect lesson count");
 const scriptName="curriculum-editorial-"+group+"-v1.js";
 const at=html.indexOf(scriptName);
 check(at>=0,group+": not registered in academy preview");
 check(at>=0&&html.indexOf(scriptName,at+1)<0,group+": duplicate script tag");
 check(!predecessor||at>predecessor,group+": incorrect loader order");
 predecessor=at;
 check(JSON.stringify(voice.supersedesContextForLessonIds)===JSON.stringify(ids),group+": ID mismatch between voice and lessons");
 check(voice.generateCreditsUsed===0&&voice.status==="text-only-not-generated-not-approved",group+": voice must remain ungenerated");
 check(voice.requiresMergeIntoCanonicalVoicePlanBeforeGeneration===true,group+": missing voice approval barrier");
 check(voice.contexts.length===ids.length*19,group+": wrong number of voice contexts");
 voiceCount+=voice.contexts.length;
 for(const id of ids){
  check(!seenIds.has(id),id+": duplicated by another editorial module");
  seenIds.set(id,group);
  const status=byId.get(id);
  check(!!status,id+": missing from 208-slot ledger");
  if(status){const [low,high]=group.split("-").map(Number);check(status.slot>=low&&status.slot<=high,id+": wrong lesson slot");}
  const variants=drafts[id],distinct=new Set();
  check(ages.every(a=>!!variants[a]),id+": not all ages present");
  for(const age of ages){
   const d=variants[age];
   if(!d)continue;
   ageCount++;
   const lines=d.lines||[];
   check(lines.length===4,id+"/"+age+": needs four distinct instructional paragraphs");
   const intro=lines.join(" ");
   check(intro.length>220,id+"/"+age+": narration suspiciously short");
   check(!distinct.has(intro),id+": identical age versions");
   distinct.add(intro);
   for(const field of ["goal","situation","practice","evidence","summary"]){
    check(typeof d[field]==="string"&&d[field].trim().length>15,id+"/"+age+": missing "+field);
   }
   for(const [field,value] of Object.entries(d)){
    const content=Array.isArray(value)?value.join(" "):String(value||"");
    check(!internal.test(content),id+"/"+age+": internal term in child field "+field);
   }
   const contexts=voice.contexts.filter(x=>x.lessonId===id&&x.age===age);
   check(contexts.length===6,id+"/"+age+": voice contexts should be intro, audio and four lines");
   check(contexts.filter(x=>x.kind==="intro").length===1&&contexts.find(x=>x.kind==="intro")?.text===intro,id+"/"+age+": intro mismatch");
   check(contexts.filter(x=>x.kind==="audio").length===1&&contexts.find(x=>x.kind==="audio")?.text.endsWith(intro),id+"/"+age+": audio narration mismatch");
   for(let k=0;k<4;k++){
    check(contexts.filter(x=>x.kind==="line"&&x.index===k).length===1&&contexts.find(x=>x.kind==="line"&&x.index===k)?.text===lines[k],id+"/"+age+": line "+k+" voice mismatch");
   }
   for(const x of contexts){check(!internal.test(String(x.text||"")),id+"/"+age+": internal text in speaking "+x.kind);}
  }
  const summary=voice.contexts.filter(x=>x.lessonId===id&&x.age==="all"&&x.kind==="summary");
  check(summary.length===1,id+": must have one all-age summary");
  check(summary[0]?.text.endsWith(variants["4-5"]?.lines?.join(" ")||"INVALID"),id+": global voice summary out of sync");
 }
}
const intended=ledger.filter(x=>x.slot>=155&&x.slot<=208);
check(intended.length===54,"unexpected slot range 155–208");
for(const slot of intended)check(seenIds.has(slot.lessonId),"missing individual editorial "+slot.slot);
check(seenIds.size===54,"expected 54 individual lessons");
check(ageCount===162,"expected 162 distinct age drafts");
check(voiceCount===1026,"expected exactly 1026 spoken text contexts");
for(const expected of [
 ["curriculum-editorial-187-190-v1.js","Qurʾān 17:23–24"],
 ["curriculum-editorial-191-194-v1.js","Qurʾān 71:10"],
 ["curriculum-editorial-191-194-v1.js","Qurʾān 2:285"],
 ["curriculum-editorial-191-194-v1.js","Qurʾān 112:1–4"]
]){
 check(read("kids/akademie/"+expected[0]).includes(expected[1]),"corrected verse span missing: "+expected[1]);
}
if(problems.length){console.error("FAILED: "+problems.length+" visitor-copy integrity findings");for(const p of problems)console.error("- "+p);process.exitCode=1}
else console.log("PASS visitor copy: 54 lessons / 162 distinct age drafts / 1026 ungenerated voice text contexts; no internal child terms or source-span regressions");
