#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict"),vm=require("node:vm");
const base=path.resolve(__dirname,"..");
const html=fs.readFileSync(path.join(base,"akademie/index.html"),"utf8");
const seq=["curriculum-editorial-151-153-v1.js","curriculum-editorial-154-v1.js","term-coach-v24.js"];
for(const file of seq)assert(html.includes(file),"missing script "+file);
assert(html.indexOf(seq[0])<html.indexOf(seq[1])&&html.indexOf(seq[1])<html.indexOf(seq[2]),"wrong load order");
const id="fiqh-absicht-zum-gebet";
const original={topic:"Die Absicht zum Gebet",quran:{surah:6,ayah:162,label:"Qurʾān 6:162",arabic:"original-too-long"},sourceAudit:{scientificApproval:false,fiqhHumanReviewNeeded:true,note:"original"},questions:{unchanged:true},ageText:{"4-5":{lines:[]},"6-8":{lines:[]},"9-10":{lines:[]}}};
const win={DARKidsAcademyCurriculum:{[id]:original},DARKidsAcademyCurriculumEditorial151153:{ageVersionCount:9}};
vm.runInNewContext(fs.readFileSync(path.join(base,"akademie",seq[1]),"utf8"),{window:win});
const out=win.DARKidsAcademyCurriculum[id],gate=win.DARKidsAcademyCurriculumEditorial154;
assert.equal(gate.ageVersionCount,3);
assert.equal(out.questions.unchanged,true);
assert.equal(out.sourceAudit.scientificApproval,false);
assert.equal(out.sourceAudit.fiqhHumanReviewNeeded,true);
assert.equal(out.quran.surah,6);
assert.equal(out.quran.ayah,162);
assert.equal(out.quran.excerpt,false);
assert.equal(out.quran.arabic,"قُلْ إِنَّ صَلَاتِي وَنُسُكِي وَمَحْيَايَ وَمَمَاتِي لِلَّهِ رَبِّ الْعَالَمِينَ");
assert(!out.quran.arabic.includes("لَا شَرِيكَ لَهُ"),"6:163 incorrectly appended");
const voice=JSON.parse(fs.readFileSync(path.join(base,"data/academy-voice-editorial-154-delta-v1.json"),"utf8"));
assert.equal(voice.contexts.length,19);
assert.equal(voice.generateCreditsUsed,0);
assert.equal(voice.requiresMergeIntoCanonicalVoicePlanBeforeGeneration,true);
for(const age of ["4-5","6-8","9-10"]){
 const lesson=out.ageText[age],intro=lesson.lines.join(" "),audio=original.topic+". "+intro;
 assert.equal(lesson.lines.length,4);
 assert.equal(lesson.intro,intro);
 assert.equal(lesson.audioScript,audio);
 for(const [kind,text] of [["intro",intro],["audio",audio]])assert(voice.contexts.some(x=>x.lessonId===id&&x.age===age&&x.kind===kind&&x.text===text),age+" "+kind);
 lesson.lines.forEach((text,index)=>assert(voice.contexts.some(x=>x.lessonId===id&&x.age===age&&x.kind==="line"&&x.index===index&&x.text===text),age+" line "+index));
}
console.log("Fiqh 154: exact Qurʾān 6:162, original lesson IDs/quizzes preserved, 3 ages, 19 matching text contexts, 0 scientific approvals.");
