#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const ROOT=path.resolve(__dirname,"../..");
const lib=JSON.parse(fs.readFileSync(path.join(ROOT,"kids-audio-review-library-v1.json"),"utf8"));
const acc=JSON.parse(fs.readFileSync(path.join(ROOT,"kids/data/academy-audio.json"),"utf8"));
const page=fs.readFileSync(path.join(ROOT,"salaf-v4-33-hoeren-20261028.html"),"utf8");
assert.equal(lib.schemaVersion,1);
assert.ok(Array.isArray(lib.sections));
const academy=lib.sections.find(s=>s.id==="academy");
const deen=lib.sections.find(s=>s.id==="deen");
assert.ok(academy,"Akademie-Abschnitt fehlt");
assert.ok(deen,"Den-Dīn-Abschnitt fehlt");
assert.equal(academy.title,"Akademie / Lernbereich");
assert.equal(academy.entries.length,Object.keys(acc.entries).length);
assert.ok(academy.entries.length>=1903,"Akademie muss alle Clips enthalten");
assert.equal(deen.title,"Den Dīn lernen");
assert.equal(deen.entries.length,30);
const url=/^\/kids\/assets\/[a-zA-Z0-9/_-]+\.(mp3|m4a|aac|ogg|wav)(\?[a-zA-Z0-9=&._-]+)?$/i;
for(const e of academy.entries.concat(deen.entries)){
  assert.ok(url.test(e.url), "ungültige Audio-URL "+e.url);
  assert.ok(e.title&&e.title.length>0,"Titel fehlt");
  assert.ok(e.group&&e.group.length>0,"Gruppierung nach Lektion fehlt: "+e.id);
}
const academyGroups=new Set(academy.entries.map(e=>e.group));
assert.ok(academyGroups.size>=90,"Gruppen nach Bereich/Lektion fehlen");
assert.ok([...academyGroups].some(g=>g.includes("Ṣidq")));
assert.ok([...academyGroups].some(g=>g.includes("ʿAqīdah")||g.includes("Aqidah")));
const deenGroups=new Set(deen.entries.map(e=>e.group));
assert.equal(deenGroups.size,6);
assert.ok(page.includes('id="lesson-groups"')&&page.includes("renderGroups()"),"Hörseite muss Lektionsfilter anzeigen");
assert.ok(page.includes('e.group'),"Hörseite muss group-Feld aus dem Index lesen");
console.log("KIDS OK: review library academy="+academy.entries.length+" groups="+academyGroups.size+" deen="+deen.entries.length);
