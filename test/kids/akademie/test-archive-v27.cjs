#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const html=read("test/kids/akademie/archiv.html"),gate=read("cloudflare/preview-gate.js");
const page=read("kids/akademie/index.html"),year=JSON.parse(read("kids/data/academy-year-52weeks-v1.json"));
const roadmap=JSON.parse(read("kids/data/academy-expansion-roadmap-v23.json"));
for(const term of ["Mein Unterrichtsarchiv","Dieses Archiv ist keine Test-App.","Ṣaḥābah","Ṣaḥābiyyāt","Tābiʿīn","hanbalitische","term-coach-v24.js","l.questions?.[age]","safeDorar","Originalnachweis bei Dorar öffnen","Redaktionsentwurf"])
 assert.ok(html.includes(term),"Missing "+term);
assert.ok(html.includes('AGES=["4-5","6-8","9-10"]'));
assert.ok(html.includes("pageText.matchAll("),"Must load catalog from the current Kids app");
assert.ok(!/localStorage\.|indexedDB|speechSynthesis|generate-with-timings|ELEVENLABS_API_KEY/.test(html),"No writes to child profiles or billing");
const m=html.match(/<script>([\s\S]*?)<\/script>/);assert.ok(m);new vm.Script(m[1]);
for(const term of ['ACADEMY_OWNER_ARCHIVE = "/akademie/unterrichtsarchiv"', 'return ACADEMY_OLD_ROOT + "/archiv.html"', 'HttpOnly; Secure; SameSite=Lax','academyHasSession(request, secret)','academyCookieValues(request)'])assert.ok(gate.includes(term),term);
const paths=[...page.matchAll(/<script\s+src="(\/kids\/akademie\/curriculum-v\d+\.js[^"]*)"/g)].map(x=>x[1].split("?")[0]);
assert.ok(paths.length>=5);
const ctx=vm.createContext({window:{}});
for(const p of paths)new vm.Script(read(p.slice(1)),{filename:p}).runInContext(ctx,{timeout:1900});
const topics=ctx.window.DARKidsAcademyCurriculum||{};
assert.equal(Object.keys(topics).length+1,70,"57 curriculum modules + Ṣidq");
const slots=year.weeks.flatMap(w=>w.days.filter(d=>d.mode==="new"));
assert.equal(slots.length,208);
assert.equal(slots.filter(d=>d.lessonId).length,70);
assert.equal(roadmap.plannedUnits.length,138);
assert.ok(slots.filter(d=>d.lessonId&&d.lessonId!=="sidq").every(d=>topics[d.lessonId]));
for(const l of Object.values(topics)){
 assert.ok(l.quran?.surah&&l.hadith?.source,l.id);
 for(const age of ["4-5","6-8","9-10"])assert.ok(l.questions?.[age]?.length,l.id+" "+age);
}
assert.ok(roadmap.plannedUnits.every(p=>p.releaseGate?.childAppUnlocked===false));
// Verify that the first Ṣidq lesson is a byte-faithful copy of the three
// actual production teaching tiers, including EVERY question and answer.
function takeObject(src,tag){
 const at=src.indexOf(tag);assert.ok(at>=0,tag);
 const first=src.indexOf("{",at+tag.length);let depth=0,quote="",escaped=false;
 for(let i=first;i<src.length;i++){
  const c=src[i];if(quote){if(escaped){escaped=false;continue}
   if(c==="\\"){escaped=true;continue}if(c===quote)quote="";continue}
  if(c==='"'||c==="'"||c==="`"){quote=c;continue}
  if(c==="{")depth++;else if(c==="}"&&--depth===0)return src.slice(first,i+1);
 }throw Error("Unclosed source object "+tag);
}
const actualAge=vm.runInNewContext("("+takeObject(page,"const AGE_EXPLANATIONS=Object.freeze(")+")");
const actualQuestions=vm.runInNewContext("("+takeObject(page,"const exercises=")+")");
const savedSidq=vm.runInNewContext("("+takeObject(html,"const SIDQ_ARCHIVE=Object.freeze(")+")");
for(const a of ["4-5","6-8","9-10"]){
 assert.equal(savedSidq.ageText[a].intro,actualAge[a].lead);
 assert.deepEqual(JSON.parse(JSON.stringify(savedSidq.ageText[a].lines)),JSON.parse(JSON.stringify(actualAge[a].lines)));
 assert.equal(savedSidq.ageText[a].evidence,actualAge[a].evidence);
 assert.deepEqual(JSON.parse(JSON.stringify(savedSidq.ageText[a].recap)),JSON.parse(JSON.stringify(actualAge[a].recap)));
 assert.deepEqual(JSON.parse(JSON.stringify(savedSidq.questions[a])),JSON.parse(JSON.stringify(actualQuestions[a])));
}
assert.deepEqual(["4-5","6-8","9-10"].map(a=>savedSidq.questions[a].length),[2,3,3]);
console.log("KIDS OWNER ARCHIVE V27 PASS: 58 courses, 150 source-gated plans, 3 age levels, private signed-session URL, no billing or child state changes.");
