#!/usr/bin/env node
"use strict";
/* Visitor KIDS Dīn release gate - prohibit publishing unapproved religious scripts. */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict"),vm=require("node:vm");
const read=p=>fs.readFileSync(path.resolve(__dirname,"../..",p),"utf8");
const base=JSON.parse(read("kids/data/deen-lessons.json")),cur=JSON.parse(read("kids/data/deen-curriculum-v1.json"));
const expected=["was-ist-tawhid","was-ist-iman","asma-wa-sifat","was-ist-ibadah","adab-und-akhlaq","al-akhirah"];
assert.deepEqual(base.items.map(x=>x.id),expected,"Original Dīn masters changed");
assert.deepEqual(cur.categories.map(x=>x.id),expected,"Dīn categories changed");
const all=cur.categories.flatMap(g=>g.lessons);
assert.equal(all.length,30,"30 Dīn cards required");
assert.equal(new Set(all.map(x=>x.id)).size,30,"Unique IDs required");
for(const g of cur.categories){assert.equal(g.lessons.length,5);assert.equal(g.lessons[0].id,g.id);}
assert.equal(all.filter(l=>l.status==="existing").length,6,"Only 6 original lessons published");
assert.equal(all.filter(l=>l.status==="published").length,24,"24 newly sourced lessons must be published");
assert.equal(all.filter(l=>l.status==="planned").length,0,"No Dīn lesson may remain locked");

function assertApprovedMasterAudio(l){
  const a=l.audio||{};
  assert.ok(a&&typeof a==="object"&&a.url,"Missing master audio: "+l.id);
  assert.equal(a.approvedForPlayback,true,"Unapproved Dīn audio: "+l.id);
  assert.equal(a.releaseEnabled,true,"Dīn audio not release-enabled: "+l.id);
  assert.equal(typeof a.liveConfirmed,"boolean","liveConfirmed must be an explicit boolean: "+l.id);
  assert.ok(typeof a.sha256==="string"&&/^[0-9a-f]{64}$/.test(a.sha256),"Missing audio hash: "+l.id);
  const loc=path.resolve(__dirname,"../..",String(a.url).replace(/^\/+/, ""));
  assert.ok(fs.existsSync(loc),"Missing Dīn audio file: "+a.url);
  const digest=require("node:crypto").createHash("sha256").update(fs.readFileSync(loc)).digest("hex");
  assert.equal(digest,a.sha256,"Dīn audio hash mismatch: "+l.id);
}

for(const l of all){
 if(l.status==="existing"){
  assert.ok(!l.masterStoryText,"Keep original lesson text in canonical master JSON: "+l.id);
  assertApprovedMasterAudio(l);
 }else{
  assert.equal(l.status,"published","No unreleased Dīn lesson: "+l.id);
  assert.ok(typeof l.masterStoryText==="string"&&l.masterStoryText.length>1600,"Missing independent master text: "+l.id);
  assert.ok(Array.isArray(l.sourceRefs)&&l.sourceRefs.length>=3&&Array.isArray(l.sourceLinks)&&l.sourceLinks.length===l.sourceRefs.length,"Incorrect source refs: "+l.id);
  assert.ok(l.sourceLinks.every(u=>/^https:\/\/(quran\.com|sunnah\.com)\//.test(u)),"Source outside primary collections: "+l.id);
  assertApprovedMasterAudio(l);
 }
 for(const k of ["cover","hero"]){
  const url=String(l[k]||"").split("?")[0];if(!url)continue;
  assert.ok(url.startsWith("/kids/assets/"),"Temporary remote image forbidden");
  assert.ok(fs.existsSync(path.resolve(__dirname,"../..",url.slice(1))),"Missing fixed lesson artwork: "+url);
 }
}
const js=read("kids/deen-lessons.js"),off=read("kids/item-offline-v1.js"),sw=read("kids/sw.js"),css=read("kids/deen-curriculum-v1.css");
new vm.Script(js);new vm.Script(off);
assert.ok(js.includes('(lesson.status==="existing"||lesson.status==="published")'),"Drafts must be inaccessible");
assert.ok(js.includes("function openCategory(")&&js.includes("function libraryBack("),"Two-level Dīn navigation missing");
assert.ok(css.includes('.app[data-gender="girl"]')&&css.includes(".dl-lessons-grid"),"Child palettes or cards missing");
for(const p of ["/kids/deen-lessons.js?v=14","/kids/data/deen-curriculum-v1.json?v=20261126-v4-fill","/kids/deen-curriculum-v1.css?v=1"]){
 assert.ok(off.includes(p),"Dīn offline pack incomplete: "+p);
}
const shells=["kids/index.html","kids/start.html","kids/shell.html"].map(read);
const v=JSON.parse(read("kids/version.json"));
const swVersion=String(v.visualSystem.serviceWorkerCache||"").replace(/^v/,"");
assert.match(swVersion,/^\d+$/,"Invalid Kids SW cache version");
assert.ok(shells.every(s=>s===shells[0]),"KIDS shells differ");
for(const p of ["/kids/deen-lessons.js?v=14","/kids/item-offline-v1.js?v=6","/kids/sw.js?v="+swVersion]){
 assert.ok(shells[0].includes(p),"Outdated KIDS shell reference: "+p);
}
assert.ok(sw.includes('dar-al-tawhid-kids-v'+swVersion),"Missing new SW cache");
assert.ok(sw.includes('/kids/data/deen-curriculum-v1.json?v=20261126-v4-fill'),"Curriculum not cached");
assert.equal(v.visualSystem.serviceWorkerCache,"v"+swVersion,"SW version metadata mismatch");
console.log("Dīn visitor QA passed: 6 original masters + 24 published and sourced readings, profiles, 3 shells, offline and service worker");
