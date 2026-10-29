#!/usr/bin/env node
"use strict";
/* Academy-only editorial regression: remove obvious nonsense answers and
 * reference-guessing prompts without changing learning progress IDs, sources
 * or claiming any religious or pedagogical HUMAN approval. */
const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const paths=["v1","v2","v22","v25","v26","v27","v28","v29"].map(v=>"kids/akademie/curriculum-"+v+".js");
const window={};const context=vm.createContext({window,console});
for(const p of paths)vm.runInContext(fs.readFileSync(p,"utf8"),context,{filename:p,timeout:5000});
const lessons=window.DARKidsAcademyCurriculum;
assert.equal(Object.keys(lessons).length,65,"Keep 65 existing modules; separate Ṣidq is inline");
const all=[];
for(const [id,l]of Object.entries(lessons)){
 assert.equal(l.id,id);
 assert(l.quran?.surah&&l.quran.ayah&&l.hadith?.source,"Keep original Qurʾān/Ḥadīṯ sources");
 for(const age of ["4-5","6-8","9-10"]){
  assert(Array.isArray(l.questions?.[age]));
  for(const [i,q]of l.questions[age].entries()){
   all.push({id,age,i,...q});
   if(q.type==="choice")assert(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.options.length);
  }
 }
}
assert.equal(all.length,520,"No question lost");
const selected={
 "quran-al-fatihah-kennenlernen":["4-5","6-8","9-10"],
 "adab-privatsphaere-andere-achten":["9-10"],
 "dua-abend-dhikr-lernen":["6-8"],
 "family-geschwister-unterstuetzen":["6-8"],
 "akhlaq-fehler-ehrlich-zugeben":["6-8","9-10"]
};
for(const [id,ages]of Object.entries(selected)){
 assert(lessons[id],"Missing prior lesson "+id);
 for(const age of ages)assert(lessons[id].questions[age].length>=2);
}
const stale=["Ein Tiername","Ich suche meinen Schuh","Eine Spielregel","Eine frei erfundene Geschichte über eine andere Sūrah","Was sagt Qurʾān 24:27 direkt?","Was sagt Qurʾān 33:41?","Was lehrt Qurʾān 5:2?","Was lehrt Qurʾān 33:70?","Worauf bezieht sich al-Buḫārī 4474?"];
for(const str of stale)assert(!all.some(q=>q.prompt?.includes(str)||q.options?.some(v=>v.includes(str))),"Undeveloped question remains: "+str);
assert(lessons["quran-al-fatihah-kennenlernen"].questions["4-5"][0].options[1]==="Al-Iḫlāṣ");
assert(lessons["quran-al-fatihah-kennenlernen"].questions["4-5"][1].options[1]==="Ich bitte Allah um Hilfe.");
assert(lessons["quran-al-fatihah-kennenlernen"].questions["9-10"][0].prompt.includes("besondere Stellung"));
assert(lessons["adab-privatsphaere-andere-achten"].questions["9-10"][0].prompt.includes("fremden Raum"));
assert(lessons["family-geschwister-unterstuetzen"].questions["6-8"][0].prompt.includes("gegenseitig unterstützen"));
assert(lessons["dua-abend-dhikr-lernen"].questions["6-8"][2].prompt.includes("Was bedeutet"));
assert(lessons["akhlaq-fehler-ehrlich-zugeben"].questions["6-8"][0].prompt.includes("beachten"));
console.log("PASS: 520 academy questions remain structurally valid; meaning-first edits and stronger distractors present; all lesson IDs and source references untouched.");
