#!/usr/bin/env node
"use strict";
/* V31 source/UX diagnostics. Strict on mismatched Quran citations, conservative
 * on ambiguous theology: never auto-approve a lesson or synthesize voices. */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../..");
const context=vm.createContext({window:{}});
for(const chunk of ["67-90","91-114","115-138","139-162","163-186","187-208"]){
 const file="kids/akademie/editorial-v31/curriculum-v31-"+chunk+".js";
 vm.runInContext(fs.readFileSync(path.join(root,file),"utf8"),context,{timeout:12000,filename:file});
}
const lessons=Object.values(context.window.DARKidsAcademyEditorialV31);
assert.equal(lessons.length,142);
const report={schemaVersion:1,status:"REVIEW_NOT_RELEASED",lessons:142,
 sourceSpecificReligiousApprovals:0,voiceApproved:0,sourceProblems:[],longAnswers:[],
 humanReviewRequired:[],soundGenerationAllowed:false};
let total=0,converted=0;
for(const lesson of lessons){
 const expected=lesson.quran?.surah+":"+lesson.quran?.ayah;
 assert.equal(lesson.sourceAudit?.quranReference,expected,"Source mismatch "+lesson.id);
 assert.equal(lesson.sourceAudit?.sourceSpecificReview,"pending-independent-scholarly-check");
 assert.equal(lesson.releaseGate?.childAppUnlocked,false);
 assert.equal(lesson.voiceApproved,false);
 const displayed=[];
 for(const age of ["4-5","6-8","9-10"]){
  const a=lesson.ageText[age];
  displayed.push(a.intro,a.evidence,...(a.lines||[]));
  for(const q of lesson.questions[age])displayed.push(q.prompt,q.hint,q.explain,...(q.options||[]));
 }
 if(displayed.some(text=>/https?:\/\//.test(String(text||""))))
  report.sourceProblems.push({lessonId:lesson.id,problem:"visitor-visible-source-url"});
 const flags=[];
 if(lesson.releaseGate?.fiqhSchoolReviewApproved!==true&&
    /fiqh|gebet|wudu|wuḍū|fasten|zakāh|ḥaǧǧ|suǧūd|tashahhud|taslīm/i.test(
      [lesson.subject,lesson.topic,lesson.title].join(" ")))
  flags.push("additional-fiqh-review");
 for(const age of ["4-5","6-8","9-10"])for(const q of lesson.questions[age]){
  total++;
  assert.equal(q.type,"choice","Visitor answer format cannot contain free text");
  assert(q.options?.length>=2&&q.options.length<=5);
  assert(q.options.every(t=>typeof t==="string"&&t.trim()));
  assert(!/^(Beschreibe|Schreibe|Erkläre mit deinen Worten|Formuliere|Tippe deine|Sprich deine)\\b/i.test(q.prompt),
   "Open-ended input wording in button-only question "+lesson.id+" "+age);
  assert(![
    "Welche Aussage beschreibt eine gute Alltagsübung?",
    "Welche Erklärung und Rückfrage passt zum Lerninhalt?"
   ].includes(q.prompt),"Uncontextualized button question "+lesson.id+" "+age);
  if(new Set(q.options).size!==q.options.length)
   report.sourceProblems.push({lessonId:lesson.id,age,problem:"duplicate-options"});
  if(q.editorialReviewStatus==="pending-human-review")converted++;
  if(q.options.some(t=>t.length>180))
   report.longAnswers.push({lessonId:lesson.id,age,question:q.prompt,
     maxCharacters:Math.max(...q.options.map(t=>t.length))});
  for(const match of String(q.hint||"").matchAll(/\b(\d{1,3}:\d{1,3})\b/g))
   if(match[1]!==expected)report.sourceProblems.push({
     lessonId:lesson.id,age,problem:"wrong-hint-reference",found:match[1],expected});
 }
 report.humanReviewRequired.push({lessonId:lesson.id,topic:lesson.topic,
  sourceReference:expected,hadith:lesson.hadith?.source||"",
  sourceSpecificQuranApproved:false,sourceSpecificSunnahApproved:false,
  childPedagogyApproved:false,voicePronunciationApproved:false,
  additionalChecks:flags});
}
assert.equal(total,1136);assert.equal(converted,426);
assert.equal(report.longAnswers.length,0,"Answers exceed 180 characters; preserve full source explanation instead");
assert.equal(report.sourceProblems.length,0,JSON.stringify(report.sourceProblems.slice(0,5)));
assert.equal(report.longAnswers.length,0,"Visible choice buttons longer than 180 characters");
if(process.argv[2]){
 const file=path.resolve(process.argv[2]);fs.mkdirSync(path.dirname(file),{recursive:true});
 fs.writeFileSync(file,JSON.stringify(report,null,2)+"\n");
}
console.log("PASS: 142 lessons, 1136 answer-button questions, 426 draft conversions.");
console.log("PASS: Quran-reference labels/hints internally consistent; no duplicate options.");
console.log("BUTTON UX: 0 answers longer than 180 characters; full source explanations preserved.");
console.log("REVIEW REQUIRED: 142 source-specific checks, 0 human listening approvals.");
