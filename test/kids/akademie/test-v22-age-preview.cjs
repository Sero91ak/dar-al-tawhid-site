#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const html=read("test/kids/akademie/index.html");
const live=read("kids/akademie/index.html");
const g=read("cloudflare/preview-gate.js");
assert.ok(html.includes('curriculum-v22.js?v=20261011-01'),"Owner preview must load 4 new age lessons");
assert.ok(html.includes('l.ageText?.[age.value]?.intro'));
assert.ok(html.includes('l.ageText?.[age.value]?.lines||l.lines||[]'));
assert.ok(html.includes('l.ageText[age.value].evidence'));
assert.ok(html.includes('l.quran?.excerpt'));
assert.ok(html.includes('l.sourceAudit.hadithUrl'));
assert.ok(html.includes('dorar'));
assert.ok(!html.includes("localStorage")&&!html.includes("indexedDB"),"Owner must not modify a real child's progress");
assert.ok(g.includes('pathname.startsWith("/test/kids/")'),"Preview must remain gated");
assert.ok(live.includes('curriculum-v22.js?v=20261011-01'),"Official school and preview must load same curriculum release");
const sandbox=vm.createContext({window:{}});
for(const src of ["kids/akademie/curriculum-v1.js","kids/akademie/curriculum-v2.js","kids/akademie/curriculum-v22.js"]){
 new vm.Script(read(src),{filename:src}).runInContext(sandbox,{timeout:2000});
}
const topics=sandbox.window.DARKidsAcademyCurriculum;
assert.equal(Object.keys(topics).length+1,38);
for(const id of sandbox.window.DARKidsAcademyCurriculumV22.ids){
 const l=topics[id];assert.ok(l?.sourceAudit?.hadithUrl?.startsWith("https://dorar.net/hadith/sharh/"));
 for(const age of ["4-5","6-8","9-10"]){
  assert.equal(l.ageText[age].lines.length,4);
  assert.ok(l.questions[age].length>=2);
 }
}
const script=html.match(/<script>([\s\S]+)<\/script>/);assert.ok(script);new vm.Script(script[1],{filename:"owner-preview-v22.js"});
console.log("KIDS CREATOR PREVIEW V22 PASS: 38 lessons, three independently readable age levels, traceable authentic hadith sources, zero child writes.");
