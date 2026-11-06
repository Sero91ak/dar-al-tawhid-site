#!/usr/bin/env node
"use strict";
/* Read-only, zero-credit inventory of current Kids Academy curriculum speech.
 * Does not generate, approve, or publish recordings. */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),crypto=require("node:crypto");
const root=path.resolve(__dirname,"../..");
const files=["curriculum-v1.js","curriculum-v2.js","curriculum-v22.js","curriculum-v25.js","curriculum-v26.js","curriculum-v27.js","curriculum-v28.js","curriculum-v29.js"];
const win={};const ctx=vm.createContext({window:win,console});
for(const name of files)vm.runInContext(fs.readFileSync(path.join(root,"kids/akademie",name),"utf8"),ctx,{filename:name,timeout:5000});
vm.runInContext(fs.readFileSync(path.join(root,"kids/akademie/answer-choice-only-v1.js"),"utf8"),ctx,{filename:"answer-choice-only-v1.js",timeout:5000});
const html=fs.readFileSync(path.join(root,"kids/akademie/index.html"),"utf8");
const start=html.indexOf("const exercises=");
const end=html.indexOf("\nlet id=",start);
if(start<0||end<0)throw Error("Inline Sidq question source not found");
vm.runInContext(html.slice(start,end).replace(/^const exercises=/,"window.__sidqExercises="),ctx,{filename:"inline-sidq-exercises",timeout:5000});
const sidqQuestions=win.__sidqExercises;
if(!sidqQuestions||!["4-5","6-8","9-10"].every(a=>Array.isArray(sidqQuestions[a])))throw Error("Inline Sidq age coverage incomplete");
const lessons=win.DARKidsAcademyCurriculum||{};
const archive=JSON.parse(fs.readFileSync(path.join(root,"kids/data/academy-voice-plan-v9.json"),"utf8"));
const publicAudio=JSON.parse(fs.readFileSync(path.join(root,"kids/data/academy-audio.json"),"utf8"));
const ages=["4-5","6-8","9-10"];
const phrases=new Map(),issues=[];
const sourceStats={quranRecitationExcluded:true,syntheticQuranAudioCount:0,ageProfiles:["4-5","6-8","9-10"],genderProfiles:["boy","girl"]};
function add(raw,id,age,kind){
 const value=String(raw||"").normalize("NFC").replace(/\s+/g," ").trim();
 if(!value)return;
 if(/[\u0600-\u06ff]/.test(value)){issues.push({id,age,kind,code:"arabic_in_narration_requires_separate_fusha_review",text:value});return;}
 if(!phrases.has(value))phrases.set(value,{text:value,sha256:crypto.createHash("sha256").update(value).digest("hex"),contexts:[]});
 phrases.get(value).contexts.push({id,age,kind});
}
let questionCount=0,invalidChoices=0;
for(const [id,l] of Object.entries(lessons)){
 for(const [kind,val] of [["lead",l.lead],["goal",l.goal],["sample",l.sample],["hadith-explanation",l.hadith?.text],["quran-meaning",l.quran?.meaning]])add(val,id,"all",kind);
 for(const line of l.lines||[])add(line,id,"all","lesson-line");
 for(const age of ages){
  const original=l.questions?.[age]||[];
  const qs=win.DARKidsAcademyChoiceOnlyV1.project(l,age,original);
  if(!qs.length)issues.push({id,age,code:"missing_questions"});
  for(const q of qs){
   questionCount++;add(q.prompt,id,age,"question");
   if(q.type==="choice"){
    if(q.needsHumanEditorialReview)issues.push({id,age,code:"adapted_choice_requires_editorial_review",prompt:q.prompt});
    if(!Array.isArray(q.options)||q.options.length<2||!Number.isInteger(q.correct)||q.correct<0||q.correct>=q.options.length)invalidChoices++;
    for(const opt of q.options||[])add(opt,id,age,"answer-option");
    if(q.adaptedFromText&&q.approvedForAudio!==false)issues.push({id,age,code:"adapted_audio_gate_mismatch"});
   }else issues.push({id,age,code:"legacy_nonchoice_source",type:q.type});
   add(q.explain,id,age,"explanation");add(q.hint,id,age,"hint");
  }
 }
}
for(const age of ages){
 const qs=win.DARKidsAcademyChoiceOnlyV1.project(null,age,sidqQuestions[age]);
 for(const q of qs){
  questionCount++;
  add(q.prompt,"sidq",age,"question");
  for(const opt of q.options||[])add(opt,"sidq",age,"answer-option");
  add(q.explain,"sidq",age,"explanation");
  add(q.hint,"sidq",age,"hint");
  if(q.needsHumanEditorialReview)issues.push({id:"sidq",age,code:"adapted_choice_requires_editorial_review",prompt:q.prompt});
  if(!Array.isArray(q.options)||q.options.length<2||!Number.isInteger(q.correct)||q.correct<0||q.correct>=q.options.length)invalidChoices++;
 }
}
const old=new Set((archive.phrases||[]).map(x=>x.text));
const publicEntries=publicAudio.entries||{};
const output={
 schemaVersion:1,mode:"read-only-zero-credit",notHumanApproved:true,sourceStats,
 lessonCount:Object.keys(lessons).length+1,inlineSidqIncluded:true,
 ageVersions:(Object.keys(lessons).length+1)*ages.length,questionCount,invalidChoices,
 uniqueCandidatePhrases:phrases.size,archivedExactPhraseMatches:[...phrases.keys()].filter(x=>old.has(x)).length,
 newOrChangedVsArchive:[...phrases.keys()].filter(x=>!old.has(x)).length,
 publicManifestExactMatches:[...phrases.keys()].filter(x=>Object.hasOwn(publicEntries,x)).length,
 publicApprovedV4ExactMatches:[...phrases.keys()].filter(x=>publicEntries[x]?.modelId==="eleven_v4"&&publicEntries[x]?.approvedForPlayback===true).length,
 issues,phrases:[...phrases.values()]
};
if(process.argv.includes("--summary")){const {phrases:_,...summary}=output;console.log(JSON.stringify(summary,null,2));}
else console.log(JSON.stringify(output,null,2));
if(invalidChoices||output.lessonCount!==66||output.ageVersions!==198||!questionCount)process.exitCode=1;
