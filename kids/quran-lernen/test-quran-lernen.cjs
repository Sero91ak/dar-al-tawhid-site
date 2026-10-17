#!/usr/bin/env node
"use strict";
/* Isolated KIDS Creator Quran learning preflight. No visitor or workbook mutations. */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const catalog=JSON.parse(read("kids/quran-lernen/catalog.json"));
const syllabus=JSON.parse(read("kids/quran-lernen/suren.json"));
const html=read("kids/quran-lernen/index.html");
const css=read("kids/quran-lernen/styles.css");
const js=read("kids/quran-lernen/app.js");
const shells=["kids/index.html","kids/shell.html","kids/start.html"].map(read);
assert.equal(shells[0],shells[1],"KIDS shell and index diverged");
assert.equal(shells[0],shells[2],"KIDS start and index diverged");
assert.ok(catalog.environment==="kids-creator-staging","Creator-only scope required");
assert.ok(!/\b(quiz|workbook|arbeitsheft)\b/i.test(js),"Quran must not manipulate Academy or workbook");
assert.ok(catalog.items.length>=14,"Expected short surahs and additional selected ayat");
const byId=new Map(catalog.items.map(x=>[x.id,x]));
assert.equal(byId.size,catalog.items.length,"Duplicate lesson IDs");
for(const n of [1,103,105,106,108,109,110,112,113,114])assert.ok(byId.has(String(n)),"Required surah "+n);
for(const id of ["2-255","2-285-286","20-114","14-41"])assert.ok(byId.has(id),"Missing extra ayat "+id);
const canon=(id)=>JSON.parse(read("content/quran/"+String(id).padStart(3,"0")+".json"));
let verses=0,words=0,mapped=0;
for(const item of catalog.items){
 assert.ok([1,2,14,20,97,103,105,106,107,108,109,110,111,112,113,114].includes(item.surah),"Unexpected surah "+item.surah);
 assert.ok(item.verses?.length,"No verses: "+item.id);
 assert.equal(typeof item.explanationAudioVerified,"boolean");
 assert.equal(item.explanationAudioVerified,false,"Premature master audio approval");
 assert.equal(item.sababAnNuzulVerified,false,"Revelation cause not source-audited");
 const src=canon(item.surah);
 assert.equal(src.name,item.arabic,"Arabic surah name mismatch: "+item.id);
 const seen=new Set();
 for(const v of item.verses){
  const original=src.verses.find(z=>z.id===v.id);
  assert.ok(original,"Nonexistent ayah "+item.surah+":"+v.id);
  assert.ok(!seen.has(v.id),"Duplicate ayah "+item.surah+":"+v.id);seen.add(v.id);
  assert.equal(v.ar,original.ar,"Quran Arabic text changed "+item.surah+":"+v.id);
  assert.equal(v.de,original.de,"Canonical German translation changed "+item.surah+":"+v.id);
  if(item.surah===105&&v.id===3)assert.equal(v.tr,"wa-arsala ʿalayhim ṭayran abābīla","Corrected al-Fīl transliteration must not regress to corrupted source markup");
  else assert.equal(v.tr,original.tr_academic||original.tr_readable,"Transliteration changed "+item.surah+":"+v.id);
  assert.ok(!/[<>]/.test(v.tr),"Markup in display transliteration "+item.surah+":"+v.id);
  assert.ok(Array.isArray(v.words)&&v.words.length,"No word tiles "+item.surah+":"+v.id);
  assert.equal(v.words.map(w=>w.ar).join(" "),v.ar.trim(),"Arabic words changed "+item.surah+":"+v.id);
  for(const w of v.words){
   assert.equal(typeof w.ar,"string");
   assert.ok(w.meaning===null||(typeof w.meaning==="string"&&w.meaning.trim()),"Invalid word meaning");
   if(w.meaning)mapped++;
   words++;
  }
  verses++;
 }
}
for(const src of syllabus.surahs){
 const item=byId.get(String(src.id));assert.ok(item,"Syllabus has unknown surah "+src.id);
 assert.equal(src.verses.length,item.verses.length,"Two Quran data sources differ in ayah counts "+src.id);
}
new vm.Script(js,{filename:"kids/quran-lernen/app.js"});
for(const id of ["ql-hero-title","ql-catalog","ql-lesson","ql-word-tiles","ql-audio","ql-play","ql-meaning","ql-secure"])
 assert.ok(html.includes('id="'+id+'"'),"Missing Quran learning UI control "+id);
for(const snippet of ['html[data-gender="girl"]','--hero-image:','@media(max-width:600px)'])
 assert.ok(css.includes(snippet),"Missing profile/viewport CSS "+snippet);
for(const snippet of ["kids.quran-lernen.v1.","Husary_128kbps","audio.addEventListener(\"ended\"","localStorage.setItem(key()","Intl.Segmenter"])
 assert.ok(js.includes(snippet),"Missing isolated progress/reciter/word handler "+snippet);
for(const shell of shells){
 assert.ok(shell.includes('/kids/quran-lernen/index.html'),"KIDS Test home has no Quran learning entry");
 assert.ok(shell.includes('/kids/akademie/index.html'),"Academy entry missing");
 const nav=shell.match(/<nav class="bottom-nav"[^>]*>([\s\S]*?)<\/nav>/i);
 assert.ok(nav,"Bottom nav missing");
 assert.ok(!/data-target="quran"/.test(nav[1]),"Quran must not occupy the bottom tab");
 assert.ok(/Lernen/.test(nav[1]),"Academy must retain learning navigation");
}
assert.ok(html.includes("Die deutsche Tafsīr-Aufnahme wird nach Quellenprüfung ergänzt"),"No honest master-audio pending label");
assert.ok(html.includes("Offenbarungsanlass:"),"No sabab-an-nuzul caution");
console.log("PASS KIDS CREATOR QURAN V1: "+catalog.items.length+" units, "+verses+" ayat, "+mapped+"/"+words+" reviewed word positions; profile palette, navigation and canonical Quran fidelity protected.");
