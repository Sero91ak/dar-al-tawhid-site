#!/usr/bin/env node
"use strict";
/* Deterministic first-lesson V4 queue. Never synthesizes speech or spends credits.
 * Reads live 4–5, 6–8, 9–10 copy and the exact display-order answer audio.
 * Older V9/V18 source plans remain immutable. */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const html=read("kids/akademie/index.html");
function extract(token){
 const at=html.indexOf(token);
 if(at<0)throw Error("Missing live Academy source: "+token);
 const start=html.indexOf("{",at+token.length);
 if(start<0)throw Error("Unclosed source: "+token);
 let depth=0,quote="",escaped=false;
 for(let i=start;i<html.length;i++){
  const ch=html[i];
  if(quote){
   if(escaped)escaped=false;
   else if(ch==="\\")escaped=true;
   else if(ch===quote)quote="";
   continue;
  }
  if(ch==='"'||ch==="'"){quote=ch;continue}
  if(ch==="{")depth++;
  else if(ch==="}"&&!--depth){
   const literal=html.slice(start,i+1).replace(/([,{]\s*)([A-Za-z_$][\w$]*):/g,'$1"$2":');
   return JSON.parse(literal);
  }
 }
 throw Error("Unclosed live Academy source: "+token);
}
const ui=extract("const AGE_UI=Object.freeze(");
const teaching=extract("const AGE_EXPLANATIONS=Object.freeze(");
const questionSets=extract("const exercises=");
const voice=JSON.parse(read("kids/data/academy-voice-policy-v10.json"));
const staged=JSON.parse(read("kids/data/academy-audio-staging-sidq-v4-20261111.json"));
const ages=["4-5","6-8","9-10"];
const phrases=new Map();
function add(raw,kind,age="all",profile="both",questionIndex=null){
 const text=String(raw||"").normalize("NFC").replace(/\s+/g," ").trim();
 if(!text)return;
 if(text.length>700)throw Error("Speech segment too long: "+kind);
 let p=phrases.get(text);
 const priority=kind==="greeting"||kind==="address"?0:kind==="narration"||kind==="summary"?1:kind==="question"?2:3;
 if(!p){
  p={text,languageCode:"de",voiceId:voice.voiceIdentity.voiceId,modelId:"eleven_v4",
     voiceSettingsProfile:"kids_story",priority,contexts:[]};
  phrases.set(text,p);
 }
 p.priority=Math.min(p.priority,priority);
 const context={lessonId:"sidq",kind,age,profile};
 if(questionIndex!==null)context.questionIndex=questionIndex;
 if(!p.contexts.some(x=>JSON.stringify(x)===JSON.stringify(context)))p.contexts.push(context);
}
function visibleAnswers(question,index,lessonScope){
 const n=question.options.length;
 let hash=2166136261;
 const seed=lessonScope+":"+question.prompt;
 for(let i=0;i<seed.length;i++){hash^=seed.charCodeAt(i);hash=Math.imul(hash,16777619)}
 const offset=((hash>>>0)+index)%n;
 return question.options.map((_,visibleIndex)=>question.options[(visibleIndex+offset)%n]);
}
const full="As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh.";
add(full,"greeting");
add("Liebe Schwester.","address","all","girl");
add("Lieber Bruder.","address","all","boy");
for(const age of ages){
 const u=ui[age],a=teaching[age],questions=questionSets[age];
 assert.ok(u&&a&&Array.isArray(a.lines)&&a.lines.length===4&&
   Array.isArray(a.recap)&&a.recap.length===3&&Array.isArray(questions)&&questions.length>=2,
   "Incomplete first lesson "+age);
 add(u.welcomeNext,"greeting",age);
 add(u.welcomeBody,"narration",age);
 add(a.lead,"narration",age);
 a.lines.forEach(line=>add(line,"narration",age));
 add(a.evidence,"narration",age);
 a.recap.forEach(line=>add(line,"summary",age));
 for(const [qIndex,q] of questions.entries()){
  if(q.type!=="choice"||!Array.isArray(q.options)||q.options.length<2)
   throw Error("An unapproved text-input question remains in age "+age);
  add(q.prompt,"question",age,"both",qIndex);
  const ordered=visibleAnswers(q,qIndex,"sidq:"+age);
  ordered.forEach((answer,visibleIndex)=>add("Antwort "+(visibleIndex+1)+": "+answer,
    "answer",age,"both",qIndex));
  add(q.hint,"hint",age,"both",qIndex);
  add(q.explain,"explanation",age,"both",qIndex);
 }
}
add("Wahrhaftigkeit führt zur Rechtschaffenheit, und Rechtschaffenheit führt zum Paradies.","narration");
let pending=0,ready=0;
const rows=[...phrases.values()].sort((a,b)=>a.priority-b.priority||a.text.localeCompare(b.text,"de"));
for(const p of rows){
 if(staged.entries[p.text]?.approvedForPlayback===false&&
    staged.entries[p.text]?.modelId==="eleven_v4"){
  p.status="staged-technical-passed-awaiting-human-review";
  p.recordedSha256=staged.entries[p.text].sha256;
  ready++;
 }else{
  p.status="not-generated";
  pending++;
 }
}
const plan={
 schemaVersion:1,version:"academy-sidq-v4-final-source-voice-plan-v30-20261111",
 lessonId:"sidq",ageKeys:ages,
 genderProfiles:["boy","girl"],
 modelId:"eleven_v4",voiceId:voice.voiceIdentity.voiceId,
 source:"kids/akademie/index.html",
 policy:{publicApproved:false,stagingOnly:true,noTextInput:true,
   quranAudio:"human-recitation-only",humanFushaHearingRequired:true,
   displayOrderedAnswerAudio:true,globalUnsafeArabicDictionaryNotAttached:true},
 counts:{ageVersions:3,questions:ages.reduce((sum,a)=>sum+questionSets[a].length,0),
   uniquePhrases:rows.length,stagedV4:ready,unrecorded:pending,publicApproved:0},
 phrases:rows
};
const output=JSON.stringify(plan,null,2)+"\n";
const destination=path.join(root,"kids/data/academy-sidq-v4-voice-plan-v30.json");
if(process.argv.includes("--check")){
 assert.equal(fs.readFileSync(destination,"utf8"),output,
  "First-lesson V4 queue is stale; regenerate from real live ages before billing");
}else fs.writeFileSync(destination,output,"utf8");
console.log("PASS Ṣidq V30: "+plan.counts.uniquePhrases+" exact phrases, 3 age versions, "+
 plan.counts.questions+" choice questions, "+ready+" staged, "+pending+" to record; 0 credits");
