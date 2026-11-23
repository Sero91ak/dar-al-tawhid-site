#!/usr/bin/env node
"use strict";
/* Full V31 editorial quality audit. NO AUDIO / NO RELIGIOUS APPROVAL.
 * Baselines are upper limits: future edits may reduce, never increase, the
 * known generic-template debt. This is not a semantic or scholarly proof.
 */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),context=vm.createContext({window:{}});
for(const chunk of ["67-90","91-114","115-138","139-162","163-186","187-208"]){
 const filename="kids/akademie/editorial-v31/curriculum-v31-"+chunk+".js";
 vm.runInContext(fs.readFileSync(path.join(root,filename),"utf8"),context,{filename,timeout:12000});
}
const lessons=Object.values(context.window.DARKidsAcademyEditorialV31||{});
assert.equal(lessons.length,142,"Full V31 content inventory missing");
const ages=["4-5","6-8","9-10"];
const genericPrompt=/Was ist bei „|Wir üben „|Welche Erklärung zeigt, wie du|Welche Erklärung mit Rückfrage passt|Was darfst du beim Lernen über/;
const genericWrong=/Ich überspringe den vereinbarten Schritt|Ich mache etwas anderes, ohne darüber nachzudenken|So tun, als hätte ich alles verstanden|Ich erkläre nichts und stelle keine Rückfrage/;
const genericIntro=/Unser eigenes Beispiel:|Wir üben heute:/;
const grammar=/^Wir üben (?:eine|ein|den|die|das|seine) [^.]*\b(?:kennenlernen|zuordnen|erklären|erzählen)\.$/i;
const report={schemaVersion:1,kind:"KIDS_ACADEMY_V31_EDITORIAL_QUALITY_AUDIT",
 status:"BLOCK_AUDIO_AND_CHILD_RELEASE_UNTIL_CONTENT_AND_SOURCES_APPROVED",
 summary:{lessons:142,ageVersions:0,questions:0,lessonTemplates:0,genericQuestionPrompts:0,
 genericWrongAnswerOptions:0,grammaticalTemplateLines:0,questionTextsRepeatedAcrossLessons:0,
 sourcesSpecificIndependentlyApproved:0,voiceApproved:0,lessonsWithAuditFlags:0},
 lessons:[],highFrequencyQuestionPrompts:[]};
const promptFrequency=new Map();
for(const lesson of lessons){
 const flags=[],byAge={};
 assert.equal(lesson.reviewerApproved,false,"Do not silently approve "+lesson.id);
 assert.equal(lesson.voiceApproved,false,"Do not silently approve audio "+lesson.id);
 assert.equal(lesson.releaseGate?.childAppUnlocked,false,"Do not publish "+lesson.id);
 assert.equal(lesson.sourceAudit?.sourceSpecificReview,"pending-independent-scholarly-check");
 for(const age of ages){
  report.summary.ageVersions++;
  const a=lesson.ageText?.[age];
  assert(a&&a.lines?.length===4&&Array.isArray(lesson.questions?.[age]),"Bad lesson "+lesson.id+" "+age);
  const count={genericPrompts:0,genericWrongOptions:0,grammarLines:0,boilerplateLines:0};
  for(const line of a.lines){
   if(genericIntro.test(line))count.boilerplateLines++;
   if(grammar.test(line))count.grammarLines++;
  }
  for(const q of lesson.questions[age]){
   report.summary.questions++;
   const prompt=String(q.prompt||"");promptFrequency.set(prompt,(promptFrequency.get(prompt)||0)+1);
   if(genericPrompt.test(prompt))count.genericPrompts++;
   if((q.options||[]).some(t=>genericWrong.test(t)))count.genericWrongOptions++;
   assert.equal(q.type,"choice","No free-text inputs permitted");
   assert(q.options?.length>=2 && q.options.every(t=>typeof t==="string"&&t.length<=180),
    "No oversized/empty buttons: "+lesson.id+" "+age);
   assert(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.options.length);
   assert(!q.options.some(t=>/https?:\/\//.test(t)),"No source URL in button");
  }
  if(count.boilerplateLines)flags.push("template-lesson-prose");
  if(count.genericPrompts)flags.push("generic-question");
  if(count.genericWrongOptions)flags.push("implausible-distractor");
  if(count.grammarLines)flags.push("ungrammatical-learner-sentence");
  if(count.boilerplateLines||count.genericPrompts||count.genericWrongOptions||count.grammarLines)byAge[age]=count;
  report.summary.genericQuestionPrompts+=count.genericPrompts;
  report.summary.genericWrongAnswerOptions+=count.genericWrongOptions;
  report.summary.grammaticalTemplateLines+=count.grammarLines;
 }
 if(flags.includes("template-lesson-prose"))report.summary.lessonTemplates++;
 if(flags.length)report.summary.lessonsWithAuditFlags++;
 report.lessons.push({id:lesson.id,slot:lesson.editorialSlot,topic:lesson.topic,
  quranReference:lesson.sourceAudit.quranReference,hadithSource:lesson.hadith?.source,
  sourceReview:"pending",audioReview:"pending",
  flags:[...new Set(flags)],byAge});
}
assert.equal(report.summary.ageVersions,426);
assert.equal(report.summary.questions,1136);
const repeated=[...promptFrequency].filter(([_,n])=>n>1).sort((a,b)=>b[1]-a[1]);
report.highFrequencyQuestionPrompts=repeated.slice(0,25).map(([text,count])=>({text,count}));
report.summary.questionTextsRepeatedAcrossLessons=repeated.reduce((n,[_,count])=>n+count,0);
const ceilings={lessonTemplates:124,genericQuestionPrompts:598,genericWrongAnswerOptions:576,grammaticalTemplateLines:2};
for(const [metric,ceiling] of Object.entries(ceilings))
 assert(report.summary[metric]<=ceiling,
  "Quality regression "+metric+": "+report.summary[metric]+" exceeds "+ceiling);
for(const id of ["120","132","143","144","155","156"]){
 const entry=report.lessons.find(x=>x.id==="academy-"+id);
 assert(entry&&entry.flags.length===0,"Priority correction regressed "+id+": "+JSON.stringify(entry?.flags));
}
if(process.argv[2]){
 const dest=path.resolve(process.argv[2]);fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,JSON.stringify(report,null,2)+"\n","utf8");
}
console.log("QUALITY INVENTORY: "+report.summary.lessons+" V31 lessons / "+
 report.summary.ageVersions+" age variants / "+report.summary.questions+" questions.");
console.log("OPEN EDITORIAL DEBT: "+report.summary.lessonTemplates+" template lessons; "+
 report.summary.genericQuestionPrompts+" generic prompts; "+
 report.summary.genericWrongAnswerOptions+" weak distractors; "+
 report.summary.grammaticalTemplateLines+" grammatical template lines.");
console.log("PASS: six rewritten priority lessons remain specific; all 142 sources/audio still gated.");
console.log("ZERO CREDITS: inspection only; no ElevenLabs connection or public app changes.");
