#!/usr/bin/env node
"use strict";
/* Source binding QA, not theological, medical or scientific approval. */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const registry=JSON.parse(read("kids-akademie/research/SOURCE_REGISTRY.json"));
const lessons=JSON.parse(read("kids-akademie/LESSON_STATUS.json")).lessons;
assert.equal(registry.sourceCount,registry.sources.length);
assert.equal(new Set(registry.sources.map(s=>s.sourceId)).size,registry.sources.length);
const expected={
"aqidah-ikhlas-gute-lernabsicht":["SRC-V38-98-5","SRC-BANK-001"],
"akhlaq-geschwister-fair-teilen":["SRC-V38-16-90","SRC-CORE56-IBNKATHIR-323"],
"adab-privatsphaere-andere-achten":["SRC-V38-24-27","SRC-CORE55-MUSLIM-2153"],
"akhlaq-tarbiyah-sachen-pflegen":["SRC-V38-17-29","SRC-CORE56-IBNKATHIR-323"]
};
let count=0;
for(const [id,names] of Object.entries(expected)){
 assert.ok(lessons.some(x=>x.lessonId===id),"Missing lesson "+id);
 for(const name of names){
  const source=registry.sources.find(x=>x.sourceId===name);
  assert.ok(source?.lessonIds?.includes(id),"Missing source link "+id+"/"+name);
  assert.ok(source.directLink.startsWith("https://"));
  assert.ok(/(?:islamweb\.net|dorar\.net)\//.test(source.directLink));
  assert.ok(source.arabic&&source.authenticityNote&&source.safeApplication);
  assert.notEqual(source.verificationStatus,"scientifically-approved");
  count++;
 }
}
const muslim=registry.sources.find(x=>x.sourceId==="SRC-CORE55-MUSLIM-2153");
assert.equal(muslim.number,"2153");
assert.ok(muslim.directLink.includes("/428"));
assert.match(muslim.authenticityNote,/Muslim 2153/);
const amanah=registry.sources.find(x=>x.sourceId==="SRC-CORE56-IBNKATHIR-323");
assert.match(amanah.locus,/4:58/);
assert.match(amanah.authenticityNote,/AUSZUG/);
assert.equal(registry.sources.filter(x=>x.sourceId===amanah.sourceId).length,1);
assert.ok(amanah.lessonIds.includes("akhlaq-geschwister-fair-teilen")&&amanah.lessonIds.includes("akhlaq-tarbiyah-sachen-pflegen"));
process.stdout.write("PASS 53–56: 4 lesson IDs / "+count+" source links / "+registry.sourceCount+" unique sources. Scholarly approval separate.\n");
