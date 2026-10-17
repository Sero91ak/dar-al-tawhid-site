#!/usr/bin/env node
"use strict";
/* Production Dīn visitor gate: no unapproved classroom text may leak. */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict"),vm=require("node:vm");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const cur=JSON.parse(read("kids/data/deen-curriculum-v1.json"));
const orig=JSON.parse(read("kids/data/deen-lessons.json"));
const ids=["was-ist-tawhid","was-ist-iman","asma-wa-sifat","was-ist-ibadah","adab-und-akhlaq","al-akhirah"];
assert.deepEqual(orig.items.map(x=>x.id),ids,"Six protected original lessons changed");
assert.deepEqual(cur.categories.map(x=>x.id),ids,"Original category identity changed");
const all=cur.categories.flatMap(g=>g.lessons||[]);
assert.equal(all.length,30,"Exactly 30 lesson cards required");
assert.equal(new Set(all.map(x=>x.id)).size,30,"Lesson IDs cannot repeat");
for(const g of cur.categories){
 assert.equal(g.lessons.length,5,"Category must have five lessons");
 assert.equal(g.lessons[0].id,g.id,"First item must remain original lesson");
}
assert.equal(all.filter(x=>x.status==="existing").length,6,"Only six released master texts");
assert.equal(all.filter(x=>x.status==="planned").length,24,"Exactly 24 locked preview topics");
for(const l of all){
 for(const key of ["masterStoryText","scripts","audio","sourceRefs","sourceLinks","reviewNotes","voiceProduction"]){
  assert.ok(!l[key],"Public metadata contains review content: "+l.id+" / "+key);
 }
 for(const kind of ["cover","hero"]){
  const val=String(l[kind]||"").split("?")[0];
  if(!val)continue;
  assert.ok(val.startsWith("/kids/assets/"),"No remote temporary asset allowed: "+l.id);
  assert.ok(fs.existsSync(path.join(root,val.substring(1))),"Missing stable image: "+val);
 }
}
const code=read("kids/deen-lessons.js"),offline=read("kids/item-offline-v1.js");
const css=read("kids/deen-curriculum-v1.css"),sw=read("kids/sw.js");
new vm.Script(code,{filename:"kids/deen-lessons.js"});
new vm.Script(offline,{filename:"kids/item-offline-v1.js"});
assert.ok(code.includes('(lesson.status==="existing"||lesson.status==="published")'),"Only released texts can open");
assert.ok(code.includes("function openCategory(")&&code.includes("function libraryBack("),"Nested category navigation missing");
assert.ok(css.includes('.app[data-gender="girl"]')&&css.includes("dl-lessons-grid"),"Separate girl palette or lesson cards missing");
for(const u of ["/kids/deen-lessons.js?v=12","/kids/deen-curriculum-v1.css?v=1","/kids/data/deen-curriculum-v1.json?v=3"]){
 assert.ok(offline.includes(u),"Missing per-lesson offline resource "+u);
}
const shells=["kids/index.html","kids/start.html","kids/shell.html"].map(read);
assert.ok(shells.every(s=>s===shells[0]),"All three KIDS shells must match");
for(const url of ["/kids/deen-lessons.js?v=12","/kids/item-offline-v1.js?v=5","/kids/sw.js?v=1442"]){
 assert.ok(shells[0].includes(url),"Wrong version in KIDS shell "+url);
}
assert.ok(sw.includes('dar-al-tawhid-kids-v1442'),"Service-worker cache not refreshed");
assert.ok(sw.includes("/kids/data/deen-curriculum-v1.json?v=3"),"Curriculum not in offline pre-cache");
const version=JSON.parse(read("kids/version.json"));
assert.equal(version.visualSystem.serviceWorkerCache,"v1442","Service-worker cache metadata mismatch");
assert.equal(version.visualSystem.deenPublicMasterCount,6,"Published master count mismatch");
console.log("KIDS Dīn visitor QA OK: 6 unchanged masters, 30 lesson cards, 24 protected previews, boy/girl styles, offline v5 and SW v1442");
