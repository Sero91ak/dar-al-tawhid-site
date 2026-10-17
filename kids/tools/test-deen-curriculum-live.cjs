#!/usr/bin/env node
"use strict";
/* Public KIDS Dīn layout release gate. No draft masters in visitor builds. */
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const master=JSON.parse(read("kids/data/deen-lessons.json"));
const curriculum=JSON.parse(read("kids/data/deen-curriculum-v1.json"));
const code=read("kids/deen-lessons.js");
const css=read("kids/deen-curriculum-v1.css");
const offline=read("kids/item-offline-v1.js");
const expected=["was-ist-tawhid","was-ist-iman","asma-wa-sifat","was-ist-ibadah","adab-und-akhlaq","al-akhirah"];
assert.deepEqual(master.items.map(x=>x.id),expected,"Do not change existing six canonical masters");
assert.deepEqual(curriculum.categories.map(x=>x.id),expected,"Category order changed");
const lessons=curriculum.categories.flatMap(g=>g.lessons);
assert.equal(lessons.length,30,"Must show six groups of five");
assert.ok(curriculum.categories.every(g=>g.lessons.length===5),"Every category requires five lessons");
assert.equal(new Set(lessons.map(x=>x.id)).size,30,"Duplicate lesson ID");
assert.ok(curriculum.categories.every(g=>g.lessons[0].id===g.id),"Original first lesson must remain");
assert.equal(lessons.filter(x=>x.status==="existing").length,6,"Six original lessons expected");
assert.equal(lessons.filter(x=>x.status==="planned").length,24,"24 unfinished lessons must stay locked");
assert.equal(lessons.filter(x=>x.status==="review").length,0,"Research drafts cannot be released publicly");
assert.ok(lessons.filter(x=>x.status!=="existing").every(x=>!x.masterStoryText&&!x.scripts&&!x.audio&&!x.sourceRefs&&!x.sourceLinks),"Do not publish unapproved source text or audio");
assert.ok(master.items.every(x=>x.masterStoryText.length>1500&&x.sourceRefs.length>=3),"Original teaching sources missing");
for(const l of lessons) for(const key of ["cover","hero"]){
  if(!l[key])continue;
  const u=l[key].split("?")[0];
  assert.ok(u.startsWith("/kids/assets/"),"Use local permanent artwork only");
  assert.ok(fs.statSync(path.join(root,u.slice(1))).size>1000,"Missing permanent artwork: "+u);
}
assert.ok(css.includes('.app[data-gender="girl"]')&&css.includes(".dl-lessons-grid"),"Girl and responsive layout must remain");
assert.ok(code.includes('(lesson.status==="existing"||lesson.status==="published")'),"Visitor runtime must allow only explicitly released master texts");
assert.ok(code.includes("function openCategory(")&&code.includes("function libraryBack("),"Category navigation absent");
assert.ok(!code.includes("installSwipeBack("),"Swipe navigation forbidden");
new vm.Script(code,{filename:"kids/deen-lessons.js"});
const shells=["kids/index.html","kids/start.html","kids/shell.html"].map(read);
assert.ok(shells.every(x=>x===shells[0]),"The 3 KIDS HTML shells must remain identical");
assert.ok(shells[0].includes("/kids/deen-lessons.js?v=12"),"KIDS Dīn runtime version missing");
assert.ok(shells[0].includes("/kids/item-offline-v1.js?v=5"),"Offline KIDS runtime version missing");
assert.ok(offline.includes("/kids/data/deen-curriculum-v1.json?v=2")&&offline.includes("/kids/deen-lessons.js?v=12"),"Lesson download must cache exact public data");
console.log("PASS: production Dīn 6×5, original texts, 24 locked, images, girl/boy layouts, offline and shells");
