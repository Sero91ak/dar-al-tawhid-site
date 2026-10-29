#!/usr/bin/env node
"use strict";
/* TAWḤĪD KIDS: academy-only structure and question-quality inventory.
 * Does not edit files, grade religion, or call paid TTS. Source audit warning
 * counts are redactional review queues, NOT verified theological errors. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const root=path.resolve(__dirname,"../..");
const files=[
 "kids/akademie/curriculum-v1.js","kids/akademie/curriculum-v2.js",
 "kids/akademie/curriculum-v22.js","kids/akademie/curriculum-v25.js",
 "kids/akademie/curriculum-v26.js","kids/akademie/curriculum-v27.js",
 "kids/akademie/curriculum-v28.js","kids/akademie/curriculum-v29.js"
];
const win={},context=vm.createContext({window:win,console});
const norm=s=>String(s||"").normalize("NFKC").replace(/\s+/g," ").trim().toLocaleLowerCase("de");
const warnings=[],errors=[],counts={lessons:0,ages:{"4-5":0,"6-8":0,"9-10":0},questions:0,choice:0,text:0,canonicalCorrectFirst:0,transferPrompts:0,weakDistractors:0,contextlessReferences:0,missingExplanation:0,missingSourceAudit:0};
const warn=(kind,id,age,index,message)=>warnings.push({kind,lessonId:id,age,questionIndex:index,message});
const error=(id,age,index,message)=>errors.push({lessonId:id,age,questionIndex:index,message});
for(const file of files){
 const code=fs.readFileSync(path.join(root,file),"utf8");
 vm.runInContext(code,context,{filename:file,timeout:3500});
}
const lessons=win.DARKidsAcademyCurriculum||{};
counts.lessons=Object.keys(lessons).length;
if(counts.lessons<65)error("*","*",0,"Expected at least 65 modular lessons plus inlined Ṣidq lesson");
const weak=/\b(?:ein tiername|einen schuh|meinen schuh|eine spielregel|ausgedachte regel|frei erfundene geschichte|absichtlich schaden|lügen, wenn|mein spielzeug fliegt)\b/i;
const sourceOnly=/^(?:was|welche(?:r|s)?|wovon|wo)\b.*\b(?:sūrah|sura|qurʾān|āyah|vers|al-buḫārī|muslim)\s*\d+\s*[:/]\s*\d+/i;
const transfer=/\b(?:warum|wie würdest|was würdest|was kannst|wie kannst|erklär|vergleiche|unterschied|alltag|beispiel|gemeinsam|handeln|entscheide|was bedeutet)\b/i;
for(const [id,lesson]of Object.entries(lessons)){
 if(lesson.id!==id)error(id,"*",0,"Lesson ID mismatch");
 if(!lesson.quran?.surah||!lesson.quran?.ayah)error(id,"*",0,"No concrete Qurʾān reference");
 if(!lesson.hadith?.source)error(id,"*",0,"No attributed Ḥadīṯ source");
 if(!lesson.sourceAudit&&(!lesson.sourceLesson)){counts.missingSourceAudit++;warn("source_review",id,"*",0,"No structured sourceAudit; source must be manually inspected before speech");}
 for(const age of ["4-5","6-8","9-10"]){
  const questions=lesson.questions?.[age];
  if(!Array.isArray(questions)||questions.length<2){error(id,age,0,"Missing at least two age-level questions");continue}
  counts.ages[age]++;
  questions.forEach((q,i)=>{
   counts.questions++;
   if(!q||typeof q.prompt!=="string"||norm(q.prompt).length<8){error(id,age,i,"No readable complete question");return}
   const prompt=norm(q.prompt);
   if(transfer.test(prompt))counts.transferPrompts++;
   if(sourceOnly.test(prompt)){counts.contextlessReferences++;warn("bare_reference",id,age,i,"Question appears to ask for a citation without explaining its meaning");}
   if(q.type==="choice"){
     counts.choice++;
     if(!Array.isArray(q.options)||q.options.length<2||q.options.length>5){error(id,age,i,"Need 2–5 answer choices");return}
     if(!Number.isInteger(q.correct)||q.correct<0||q.correct>=q.options.length){error(id,age,i,"Invalid canonical correct index");return}
     if(new Set(q.options.map(norm)).size!==q.options.length)error(id,age,i,"Duplicate answer options");
     if(q.correct===0)counts.canonicalCorrectFirst++;
     if(q.options.some(v=>weak.test(String(v)))){counts.weakDistractors++;warn("implausible_distractor",id,age,i,"Distractor seems obviously silly or irrelevant; replace after editorial source review");}
     if(!String(q.explain||"").trim()){counts.missingExplanation++;warn("missing_explanation",id,age,i,"No explicit right-answer explanation");}
   }else if(q.type==="text"){
     counts.text++;
     if(!String(q.sample||q.explain||"").trim())error(id,age,i,"Open answer needs a grounded example for self-comparison");
   }else error(id,age,i,"Unrecognised exercise type");
   if(!String(q.hint||"").trim())warn("missing_hint",id,age,i,"No optional, non-revealing hint");
   if(q.prompt.length>290)warn("long_question",id,age,i,"Question wording too long; editorial age-level check needed");
  });
 }
}
const report={
 schemaVersion:1,system:"TAWHID_KIDS_ACADEMY_PEDAGOGY_AUDIT_V1",
 auditIsHumanIslamicCertification:false,
 scope:"65 modular academy lessons + separate inlined Ṣidq; not 450-question Quiz World",
 sourceFiles:files,counts,errorCount:errors.length,warningCount:warnings.length,
 errors,warnings,
 requiredHumanReviews:[
  "Verify Qurʾān original + correct meaning and Ḥadīṯ classification/reference",
  "Rewrite silly distractors and number-only recall questions",
  "Verify how each age level can understand, apply, explain, retain and teach",
  "Listen to original V4 German/Fuṣḥā and confirm iOS/iPad prior to paid release",
  "No automated generation and no claimed human approval"
 ]
};
console.log(JSON.stringify(report,null,2));
if(process.argv.includes("--strict-content")&&warnings.length){
 console.error("BLOCK: editorial warning review pending for "+warnings.length+" items");
 process.exitCode=2;
}else if(errors.length)process.exitCode=1;
