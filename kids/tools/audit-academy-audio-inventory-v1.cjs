#!/usr/bin/env node
"use strict";
/* Read-only, zero-credit inventory of current Kids Academy curriculum speech.
 * Does not generate, approve, or publish recordings. */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),crypto=require("node:crypto");
const root=path.resolve(__dirname,"../..");
const files=["curriculum-v1.js","curriculum-v2.js","curriculum-v22.js","curriculum-v25.js","curriculum-v26.js","curriculum-v27.js","curriculum-v28.js","curriculum-v29.js"];
const win={};const ctx=vm.createContext({window:win,console});
for(const name of files)vm.runInContext(fs.readFileSync(path.join(root,"kids/akademie",name),"utf8"),ctx,{filename:name,timeout:5000});
const lessons=win.DARKidsAcademyCurriculum||{};
const archive=JSON.parse(fs.readFileSync(path.join(root,"kids/data/academy-voice-plan-v9.json"),"utf8"));
const publicAudio=JSON.parse(fs.readFileSync(path.join(root,"kids/data/academy-audio.json"),"utf8"));
const ages=["4-5","6-8","9-10"];
const phrases=new Map(),issues=[];
function add(raw,id,age,kind){
 const value=String(raw||"").normalize("NFC").replace(/\s+/g," ").trim();
 if(!value)return;
 if(/[\u0600-\u06ff]/.test(value)){issues.push({id,age,kind,code:"arabic_in_narration_requires_separate_fusha_review"});return;}
 if(!phrases.has(value))phrases.set(value,{text:value,sha256:crypto.createHash("sha256").update(value).digest("hex"),contexts:[]});
 phrases.get(value).contexts.push({id,age,kind});
}
let questionCount=0,invalidChoices=0;
for(const [id,l] of Object.entries(lessons)){
 for(const [kind,val] of [["lead",l.lead],["goal",l.goal],["sample",l.sample],["hadith-explanation",l.hadith?.text],["quran-meaning",l.quran?.meaning]])add(val,id,"all",kind);
 for(const line of l.lines||[])add(line,id,"all","lesson-line");
 for(const age of ages){
  const qs=l.questions?.[age]||[];
  if(!qs.length)issues.push({id,age,code:"missing_questions"});
  for(const q of qs){
   questionCount++;add(q.prompt,id,age,"question");
   if(q.type==="choice"){
    if(!Array.isArray(q.options)||q.options.length<2||!Number.isInteger(q.correct)||q.correct<0||q.correct>=q.options.length)invalidChoices++;
    for(const opt of q.options||[])add(opt,id,age,"answer-option");
   }else issues.push({id,age,code:"legacy_nonchoice_source",type:q.type});
   add(q.explain,id,age,"explanation");add(q.hint,id,age,"hint");
  }
 }
}
const old=new Set((archive.phrases||[]).map(x=>x.text));
const publicEntries=publicAudio.entries||{};
const output={
 schemaVersion:1,mode:"read-only-zero-credit",notHumanApproved:true,
 lessonCount:Object.keys(lessons).length,inlineSidqNotIncluded:true,
 ageVersions:Object.keys(lessons).length*ages.length,questionCount,invalidChoices,
 uniqueCandidatePhrases:phrases.size,archivedExactPhraseMatches:[...phrases.keys()].filter(x=>old.has(x)).length,
 newOrChangedVsArchive:[...phrases.keys()].filter(x=>!old.has(x)).length,
 publicManifestExactMatches:[...phrases.keys()].filter(x=>Object.hasOwn(publicEntries,x)).length,
 publicApprovedV4ExactMatches:[...phrases.keys()].filter(x=>publicEntries[x]?.modelId==="eleven_v4"&&publicEntries[x]?.approvedForPlayback===true).length,
 issues,phrases:[...phrases.values()]
};
if(process.argv.includes("--summary")){const {phrases:_,...summary}=output;console.log(JSON.stringify(summary,null,2));}
else console.log(JSON.stringify(output,null,2));
if(invalidChoices)process.exitCode=1;
