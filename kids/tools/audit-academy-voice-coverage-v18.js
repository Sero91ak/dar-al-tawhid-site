#!/usr/bin/env node
"use strict";
/* V18 zero-credit audio-coverage audit. Never generates, publishes or replaces audio.
 * New/revised lessons become visible to CI as missing exact Serhat V4 recordings.
 * Quranic Arabic remains original recitation, not synthetic narration.
 */
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto"),vm=require("node:vm");
const ROOT=path.resolve(__dirname,"../..");
const VOICE="DkU7j9uO4ZEtLD2iRZSH",PROFILE="serhat-owner-voice-2026",MODEL="eleven_v4",SETTINGS="kids_story";
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),"utf8"));
const normalize=t=>String(t||"").normalize("NFC").replace(/\s+/g," ").trim();
function validV4(entry){
 return !!(entry&&entry.url&&entry.voiceId===VOICE&&entry.voiceProfileId===PROFILE&&
  entry.modelId===MODEL&&entry.voiceSettingsProfile===SETTINGS&&
  entry.sourceVoice==="authorized-owner-voice"&&entry.sourceSpeaker==="Serhat Abu Malik"&&
  entry.sameAsApprovedKidsStoryProfile===true);
}
function verifiedAsset(entry){
 if(!validV4(entry)||!/^[0-9a-f]{64}$/.test(entry.sha256||""))return false;
 const rel=String(entry.url).split("?")[0].replace(/^\/+/, "");
 if(!rel.startsWith("kids/assets/kids-academy-audio/")||rel.includes(".."))return false;
 const filename=path.join(ROOT,rel);
 if(!fs.existsSync(filename)||!fs.statSync(filename).isFile())return false;
 return crypto.createHash("sha256").update(fs.readFileSync(filename)).digest("hex")===entry.sha256;
}
function curriculumIds(){
 const sandbox={window:{}};
 for(const filename of ["kids/akademie/curriculum-v1.js","kids/akademie/curriculum-v2.js","kids/akademie/curriculum-v22.js","kids/akademie/curriculum-v25.js","kids/akademie/curriculum-v26.js"]){
  vm.runInNewContext(fs.readFileSync(path.join(ROOT,filename),"utf8"),sandbox,{filename,timeout:1500});
 }
 return Object.keys(sandbox.window.DARKidsAcademyCurriculum||{});
}
function audit(){
 const policy=read("kids/data/academy-voice-policy-v10.json");
 if(policy.voiceIdentity.voiceId!==VOICE||policy.production.modelId!==MODEL||
    policy.production.profile!==SETTINGS||policy.costControls.autoPublishWithoutOwnerReview!==false)
   throw Error("Voice production or manual approval policy has changed");
 const main=read("kids/data/academy-voice-plan-v9.json");
 const sidq=read("kids/data/academy-sidq-voice-plan-v18.json");
 const next=read("kids/data/academy-voice-plan-v22.json");
 const vocabulary=read("kids/data/academy-vocabulary-voice-plan-v24.json");
 const v25=read("kids/data/academy-voice-plan-v25.json");
 const v26=read("kids/data/academy-voice-plan-v26.json");
 if(main.modelId!==MODEL||sidq.modelId!==MODEL||main.voiceProfileId!==PROFILE||
    sidq.voiceProfileId!==PROFILE||sidq.voiceSettingsProfile!==SETTINGS||
    next.modelId!==MODEL||next.voiceProfileId!==PROFILE||
    vocabulary.modelId!==MODEL||vocabulary.voiceProfileId!==PROFILE||vocabulary.voiceSettingsProfile!==SETTINGS||
    v25.modelId!==MODEL||v25.voiceProfileId!==PROFILE||
    v26.modelId!==MODEL||v26.voiceProfileId!==PROFILE)throw Error("Unauthorized plan voice");
 const knownLessonIds=curriculumIds();
 const knownLessonSet=new Set([...knownLessonIds,"sidq"]);
 const phrases=new Map(),coveredLessons=new Set();
 for(const plan of [main,sidq,next,v25,v26,vocabulary]){
  if(!Array.isArray(plan.phrases)||plan.phraseCount!==plan.phrases.length)throw Error("Invalid voice plan");
  for(const p of plan.phrases){
   if(p.modelId!==MODEL||p.voiceProfileId!==PROFILE)throw Error("Voice identity changed for: "+p.text);
   const key=normalize(p.text);
   if(!key||key!==p.text)throw Error("Noncanonical exact voice phrase");
   if(!phrases.has(key))phrases.set(key,{text:key,priority:p.priority,contexts:[]});
   const item=phrases.get(key);
   item.priority=Math.min(item.priority,Number.isFinite(Number(p.priority))?Number(p.priority):3);
   for(const c of p.contexts||[]){
    if(!c.lessonId||!c.kind)throw Error("Voice phrase lacks lesson/step attribution: "+key);
    if(knownLessonSet.has(c.lessonId))coveredLessons.add(c.lessonId);
    if(!item.contexts.some(x=>JSON.stringify(x)===JSON.stringify(c)))item.contexts.push(c);
   }
  }
 }
 const lessons=knownLessonIds;
 const uncoveredLessons=lessons.filter(id=>!coveredLessons.has(id));
 if(!coveredLessons.has("sidq"))uncoveredLessons.unshift("sidq");
 const publicCatalog=read("kids/data/academy-audio.json");
 const stagedPaths=[
  "kids/data/academy-audio-staging-v9.json",
  "kids/data/academy-audio-staging-v9-expansion.json",
  "kids/data/academy-audio-staging-sidq-v18.json"
 ];
 const staging=stagedPaths.filter(p=>fs.existsSync(path.join(ROOT,p))).map(read);
 const rows=[...phrases.values()].sort((a,b)=>a.priority-b.priority||a.text.localeCompare(b.text,"de"));
 const totals={approved:0,stagedAwaitingReview:0,needsRecording:0};
 for(const row of rows){
  const approved=publicCatalog.entries?.[row.text];
  const matchesPublic=approved?.approvedForPlayback===true&&verifiedAsset(approved);
  const staged=staging.map(x=>x.stagingOnly===true?x.entries?.[row.text]:null)
   .find(e=>e?.approvedForPlayback===false&&verifiedAsset(e));
  row.state=matchesPublic?"approved":staged?"stagedAwaitingReview":"needsRecording";
  if(matchesPublic)row.asset=approved.url;
  if(staged&&!matchesPublic)row.stagingAsset=staged.url;
  totals[row.state]++;
 }
 return {
  schemaVersion:1,id:"kids-academy-voice-coverage-v18",voiceId:VOICE,modelId:MODEL,voiceSettingsProfile:SETTINGS,
  policy:{generatesAudio:false,usesCredits:false,autoPublishes:false,requiresHumanReview:true},
  catalogLessonCount:lessons.length+1,coveredLessonCount:coveredLessons.size,
  vocabularyTerms:vocabulary.termCount,vocabularyVoicePhrases:vocabulary.phraseCount,
  uncoveredLessons,uniquePhrases:rows.length,totals,rows
 };
}
if(require.main===module){
 try{
  const result=audit();
  console.log("KIDS ACADEMY V18 (0 credits): "+result.catalogLessonCount+" lessons, "+
    result.uniquePhrases+" distinct phrases, "+result.totals.approved+" approved V4, "+
    result.totals.stagedAwaitingReview+" staged V4, "+result.totals.needsRecording+" missing V4.");
  for(const item of result.rows.filter(x=>x.state==="needsRecording").slice(0,4)){
   console.log("NEXT:",item.contexts[0]?.lessonId||"unknown","/",item.contexts[0]?.kind||"unknown","–",item.text);
  }
  const i=process.argv.indexOf("--output");
  if(i!==-1){
   if(!process.argv[i+1])throw Error("Missing --output file path");
   fs.writeFileSync(path.resolve(process.argv[i+1]),JSON.stringify(result,null,2)+"\n","utf8");
  }
  if(result.uncoveredLessons.length){
   console.error("NEW LESSONS REQUIRE AN UPDATED VOICE PLAN: "+result.uncoveredLessons.join(", "));
   process.exitCode=1;
  }
 }catch(err){console.error("KIDS ACADEMY V18 AUDIT FAILED:",err.message);process.exitCode=1}
}
module.exports={audit,validV4,normalize};
