#!/usr/bin/env node
"use strict";
/* Regression for early V2 source-to-lesson traceability. This grants no scientific approval. */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),read=x=>fs.readFileSync(path.join(root,x),"utf8");
const register=JSON.parse(read("kids-akademie/research/SOURCE_REGISTRY.json"));
assert.equal(register.sourceCount,register.sources.length);
assert.equal(new Set(register.sources.map(s=>s.sourceId)).size,register.sources.length);
const required={
 "akhlaq-sabr-nicht-aufgeben":["SRC-CORE5-IBNKATHIR-184","SRC-CORE5-BUKHARI-1469"],
 "adab-salam-zuerst-gru-en":["SRC-CORE2-MUSLIM-54"],
 "fiqh-taharah-sauberer-lernplatz":["SRC-CORE19-BUKHARI-2989"],
 "aqidah-tawhid-nur-allah-anbeten":["SRC-V38-51-56","SRC-CORE4-BUKHARI-2856"],
 "akhlaq-amanah-geliehene-dinge":["SRC-CORE9-IBNALJAWZI-1676","SRC-CORE9-BUKHARI-33"],
 "adab-worte-bei-streit-sprechen":["SRC-CORE6-TABARI-3021","SRC-CORE6-BUKHARI-6018"],
 "fiqh-wudu-gesicht-und-arme":["SRC-FIQH23-MUGHNI-132","SRC-FIQH23-MUGHNI-135"],
 "aqidah-iman-die-engel":["SRC-CORE8-MUSLIM-8"]
};
const v2=read("kids/akademie/curriculum-v2.js");
let verified=0;
for(const [lessonId,refs] of Object.entries(required)){
 assert.ok(v2.includes('"id": "'+lessonId+'"'),"Missing V2 lesson "+lessonId);
 for(const id of refs){
  const src=register.sources.find(s=>s.sourceId===id);
  assert.ok(src,"Missing source "+id);
  assert.ok(src.lessonIds.includes(lessonId),"Unlinked evidence "+lessonId+" / "+id);
  assert.ok(src.directLink&&src.directLink.startsWith("https://"));
  assert.ok(src.arabic&&src.authenticityNote&&src.safeApplication);
  assert.notEqual(src.verificationStatus,"scientifically-approved");
  verified++;
 }
}
const street=register.sources.find(s=>s.sourceId==="SRC-CORE19-BUKHARI-2989");
assert.equal(street.narrator,"Abū Hurayrah");
assert.match(street.number,/2989/);
assert.match(street.number,/1009/);
assert.match(street.authenticityNote,/nicht die rituelle|nicht über ritualrechtliche/i);
assert.match(street.safeApplication,/Kinder/);
const face=register.sources.find(s=>s.sourceId==="SRC-FIQH23-MUGHNI-132");
const arms=register.sources.find(s=>s.sourceId==="SRC-FIQH23-MUGHNI-135");
assert.equal(face.work,"al-Mughnī");
assert.equal(arms.work,"al-Mughnī");
assert.equal(face.number,"156");
assert.equal(arms.number,"160");
assert.equal(face.page,"83");
assert.equal(arms.page,"85");
assert.match(face.safeApplication,/Kinder/);
assert.match(arms.safeApplication,/Kinder/);
const angels=register.sources.find(s=>s.sourceId==="SRC-CORE8-MUSLIM-8");
assert.match(angels.arabic,/مَلَائِكَتِهِ/);
process.stdout.write("PASS early primary-source bindings 17-24: 8 original V2 lesson IDs; "+verified+" traceable sources; "+register.sources.length+" unique registry entries; no scientific approval\n");
