#!/usr/bin/env node
"use strict";
// KIDS TEST Quran-learning regression gate. Does not alter any child data.
const fs=require("node:fs");
const path=require("node:path");
const assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const catalog=JSON.parse(read("kids/quran-lernen/catalog.json"));
const itemIds=new Set();
assert.equal(catalog.environment,"kids-creator-staging","No visitor publication without editorial review");
assert.ok(Array.isArray(catalog.items)&&catalog.items.length>=17);
const surahs=catalog.items.filter(item=>item.category==="surah");
const selected=catalog.items.filter(item=>item.category!=="surah");
assert.ok(surahs.length>=13&&selected.length>=4,"Expected initial learning breadth");
let verses=0,mapped=0;
for(const item of catalog.items){
 assert.ok(!itemIds.has(item.id),"Duplicate Quran practice item "+item.id);
 itemIds.add(item.id);
 assert.ok(item.image&&item.title&&item.overview&&item.source);
 assert.ok(item.explanationAudioVerified===false,"Unreviewed owner narration must not appear playable");
 const source=JSON.parse(read("content/quran/"+String(item.surah).padStart(3,"0")+".json"));
 for(const ayah of item.verses){
  const canonical=source.verses.find(v=>v.id===ayah.id);
  assert.ok(canonical,"Missing canonical Arabic "+item.id+":"+ayah.id);
  assert.equal(ayah.ar,canonical.ar,"Arabic text changed "+item.id+":"+ayah.id);
  assert.ok(ayah.de&&ayah.tr,"Translation/transliteration missing");
  assert.ok(!/[<>#\\]/.test(ayah.tr),"Invalid transliteration markup "+item.id+":"+ayah.id);
  const tokens=ayah.ar.trim().split(/\s+/u);
  assert.deepEqual(ayah.words.map(w=>w.ar),tokens,"Word segmentation mismatch "+item.id+":"+ayah.id);
  mapped+=ayah.words.filter(w=>typeof w.meaning==="string"&&w.meaning.trim()).length;
  verses++;
 }
}
const shell=read("kids/start.html");
assert.equal(shell,read("kids/index.html"),"Kids entry shells must remain identical");
assert.equal(shell,read("kids/shell.html"),"Kids entry shells must remain identical");
assert.ok(shell.includes("/kids/quran-lernen/index.html"),"Kids home must open separate Quran learning");
assert.ok(!shell.includes('<button class="nav-btn" data-target="quran">'),"No Quran bottom tab");
assert.ok(read("kids/akademie/index.html").includes("kids-quran-academy-link"),"Academy entry missing");
const html=read("kids/quran-lernen/index.html");
const js=read("kids/quran-lernen/app.js");
const css=read("kids/quran-lernen/styles.css");
new (require("node:vm").Script)(js,{filename:"kids/quran-lernen/app.js"});
for(const id of ["ql-audio","ql-word-tiles","ql-progress-fill","ql-secure","ql-prev","ql-next"])assert.ok(html.includes('id="'+id+'"'),"Missing learner control "+id);
for(const fragment of ["Intl.Segmenter","localStorage.setItem(key()","function fallback()"])assert.ok(js.includes(fragment),"Missing learner implementation "+fragment);
assert.ok(css.includes('html[data-gender="girl"]'),"Girl design palette missing");
assert.ok(js.includes("meaning?\"Bedeutung: \""),"Reviewed word meanings must be displayed");
console.log("PASS KIDS TEST Quran V1:",surahs.length,"Sūren,",selected.length,"extra groups,",verses,"canonical Āyāt,",mapped,"word meanings; shells and scripts valid");
