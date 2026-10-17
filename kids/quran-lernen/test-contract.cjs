#!/usr/bin/env node
"use strict";
/* Separate KIDS Quran creator preview contract.
   Run: node kids/quran-lernen/test-contract.cjs
   Does not publish, modify child profiles, or play paid/generated audio.
*/
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const ROOT=path.resolve(__dirname,"..","..");
const read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
const shells=["kids/index.html","kids/shell.html","kids/start.html"].map(read);
assert.equal(shells[0],shells[1],"Kids shell files must be identical");
assert.equal(shells[1],shells[2],"Kids start must match shell");
assert.ok(shells[0].includes('href="/kids/quran-lernen/index.html"'),"Quran link missing on Home");
assert.ok(shells[0].includes('href="/kids/akademie/index.html"'),"Original Academy entry missing");
assert.ok(shells[0].includes('home-card.css?v=1'),"Quran home palette stylesheet missing");
assert.ok(!/nav-btn[^>]*data-target="quran-lernen"/.test(shells[0]),"Do not create a bottom Quran learning tab");
const page=read("kids/quran-lernen/index.html"),css=read("kids/quran-lernen/styles.css"),js=read("kids/quran-lernen/app.js"),catalog=JSON.parse(read("kids/quran-lernen/catalog.json"));
new vm.Script(js,{filename:"quran-lernen/app.js"});
assert.equal(catalog.environment,"kids-creator-staging");
assert.equal(catalog.items.length,17);
assert.equal(catalog.items.filter(x=>x.category==="surah").length,13);
assert.equal(catalog.items.filter(x=>x.category==="ayah").length,4);
assert.equal(catalog.items.reduce((n,x)=>n+x.verses.length,0),68);
assert.ok(css.includes('html[data-gender="girl"]')&&css.includes("quran-home-v1053.jpg"),"Gender design missing");
assert.ok(page.includes('id="ql-audio"')&&page.includes('id="ql-word-tiles"')&&page.includes('id="ql-progress-track"'),"Learning parts missing");
assert.ok(page.includes("disabled>Audio folgt"),"Unverified master narration must remain disabled");
assert.ok(js.includes("Husary_128kbps")&&js.includes('addEventListener("ended"'),"Human recitation and actual end tracking required");
assert.ok(js.includes('"kids.quran-lernen.v1."'),"Per-child progress missing");
assert.ok(js.includes("r.days")&&js.includes(">=3"),"Three practice days gate missing");
const ids=[...page.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,"Duplicate HTML id");
const queried=[...js.matchAll(/\$\("([^"]+)"\)/g)].map(m=>m[1]);
for(const id of queried)assert.ok(ids.includes(id),"Missing HTML id: "+id);
let words=0,approvedWordMeanings=0;
for(const item of catalog.items){
 assert.ok(item.image.startsWith("/kids/assets/"),"Only approved local art: "+item.id);
 assert.ok(item.verses.length,"No empty lesson: "+item.id);
 for(const verse of item.verses){
  assert.ok(verse.ar&&verse.de&&Array.isArray(verse.words));
  const original=JSON.parse(read("content/quran/"+String(item.surah).padStart(3,"0")+".json"));
  const canonical=original.verses.find(v=>v.id===verse.id);
  assert.ok(canonical,"Missing canonical ayah "+item.surah+":"+verse.id);
  assert.equal(verse.ar,canonical.ar,"Original Arabic must be unchanged "+item.surah+":"+verse.id);
  assert.equal(verse.de,canonical.de,"Canonical German text must be unchanged "+item.surah+":"+verse.id);
  assert.equal(verse.words.map(w=>w.ar).join(" "),verse.ar.trim(),"Quran words must roundtrip "+item.surah+":"+verse.id);
  words+=verse.words.length;approvedWordMeanings+=verse.words.filter(w=>w.meaning!==null).length;
 }
}
assert.equal(words,425);
assert.equal(approvedWordMeanings,111,"Unreviewed words must remain pending");
console.log("PASS: isolated Quran creator preview; 3 shells; 17 entries, 68 ayat, 425 original tokens, 111 tentative meanings; no visitor write");
