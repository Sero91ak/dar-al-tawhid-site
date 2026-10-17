#!/usr/bin/env node
"use strict";
/* Creator-only release gate: never overwrite the six canonical Dīn masters. */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict"),vm=require("node:vm");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const original=JSON.parse(read("kids/data/deen-lessons.json"));
const cur=JSON.parse(read("kids/data/deen-curriculum-v1.json"));
const js=read("kids/deen-lessons.js"),css=read("kids/deen-curriculum-v1.css");
const expected=["was-ist-tawhid","was-ist-iman","asma-wa-sifat","was-ist-ibadah","adab-und-akhlaq","al-akhirah"];
assert.deepEqual(original.items.map(x=>x.id),expected,"Original Dīn category order must never change");
assert.deepEqual(cur.categories.map(x=>x.id),expected,"Six teaching categories must stay in canonical order");
assert.ok(original.items.every(x=>x.masterStoryText?.length>1500&&x.sourceRefs?.length>=3),"Original canonical texts or evidence were removed");
assert.ok(cur.categories.every(g=>g.lessons.length===5),"Each category must contain five distinct lessons");
const all=cur.categories.flatMap(g=>g.lessons);
assert.equal(all.length,30,"Exactly 30 planned lessons required");
assert.equal(new Set(all.map(x=>x.id)).size,30,"Lesson ids must be globally unique");
const existing=all.filter(x=>x.status==="existing"),review=all.filter(x=>x.status==="review"),planned=all.filter(x=>x.status==="planned");
assert.equal(existing.length,6,"Original six canonical lessons must remain first in each category");
assert.ok(cur.categories.every(g=>g.lessons[0].id===g.id&&g.lessons[0].status==="existing"),"First lesson must be the existing canonical master");
assert.equal(review.length,4,"Four Tawḥīd master drafts expected");
assert.equal(planned.length,20,"Twenty additional titles must remain unapproved metadata only");
for(const lesson of review){
 assert.ok(lesson.masterStoryText?.length>1600,"Master text is incomplete: "+lesson.id);
 assert.ok(lesson.sourceRefs?.length>=3,"Missing primary evidence: "+lesson.id);
 assert.ok(lesson.masterStoryText.startsWith("As-Salāmu"),"Missing intro: "+lesson.id);
 assert.ok(lesson.masterStoryText.endsWith("Barakātuh."),"Missing outro: "+lesson.id);
 assert.ok(lesson.audio==null||!lesson.audio.url,"No synthetic audio can be published from an unapproved draft");
}
for(const lesson of planned){
 assert.ok(!lesson.masterStoryText&&!lesson.audio,"Never publish unapproved lesson text or audio: "+lesson.id);
}
for(const lesson of all){
 for(const key of ["cover","hero"]){
  if(!lesson[key])continue;
  const url=lesson[key].split("?")[0];
  assert.ok(url.startsWith("/kids/assets/"),"External temporary artwork URL forbidden: "+lesson.id);
  assert.ok(fs.existsSync(path.join(root,url.slice(1))),"Missing stable image: "+url);
 }
}
assert.ok(css.includes('.app[data-gender="girl"]')&&css.includes('.dl-lessons-grid'),"Girl-theme or lesson layout CSS missing");
assert.ok(js.includes("function openCategory(")&&js.includes("function libraryBack("),"Navigation missing");
assert.ok(!js.includes("installSwipeBack("),"Do not introduce swipe-back gesture");
new vm.Script(js,{filename:"kids/deen-lessons.js"});
const shells=["kids/index.html","kids/start.html","kids/shell.html"].map(read);
assert.ok(shells.every(x=>x===shells[0]),"Three KIDS HTML shells must match exactly");
assert.ok(shells[0].includes("/kids/deen-lessons.js?v=9"),"Dīn JS cache bust missing");
console.log("Dīn Creator gate PASS: 6 preserved categories, 30 topics, 10 existing/draft texts, 20 locked topics, permanent artworks, boy/girl style, synchronized shells");
