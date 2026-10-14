#!/usr/bin/env node
"use strict";
/* Confirms existing lesson IDs and indexed evidence only. Never grants release approval. */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const x=JSON.parse(read("kids-akademie/research/SOURCE_REGISTRY.json"));
assert.equal(x.sourceCount,x.sources.length);
assert.equal(x.sources.length,new Set(x.sources.map(z=>z.sourceId)).size);
const list={
"fiqh-salah-gebet-lernen":["SRC-CORE30-TABARI-3226","SRC-CORE30-BUKHARI-631"],
"aqidah-ikhlas-gute-absichten":["SRC-CORE12-TABARI-4233","SRC-BANK-001"],
"adab-essen-bismillah":["SRC-V38-7-31","SRC-CORE35-BUKHARI-5376"],
"akhlaq-tiere-barmherzigkeit":["SRC-CORE36-BUKHARI-2363","SRC-CORE36-IBNKATHIR-638"],
"adab-nachbarn-gutes":["SRC-V38-4-36","SRC-CORE37-BUKHARI-6014"],
"aqidah-dua-allah-bitten":["SRC-V38-1-5","SRC-CORE38-BUKHARI-6340"],
"aqidah-tawhid-recht-allahs":["SRC-V38-51-56","SRC-CORE4-BUKHARI-2856"],
"aqidah-iman-sechs-grundlagen":["SRC-CORE8-MUSLIM-8"]};
const v2=read("kids/akademie/curriculum-v2.js"),v22=read("kids/akademie/curriculum-v22.js"),v25=read("kids/akademie/curriculum-v25.js");
let linked=0;
for(const [id,refs] of Object.entries(list)){
 assert.ok([v2,v22,v25].some(s=>s.includes('"'+id+'"')),"Early lesson missing from catalog "+id);
 for(const ref of refs){const s=x.sources.find(t=>t.sourceId===ref);
  assert.ok(s&&s.lessonIds?.includes(id),"Missing source or binding "+id+" -> "+ref);
  assert.ok(s.directLink?.startsWith("https://"),"Source missing direct link "+ref);
  assert.ok(s.arabic&&s.authenticityNote&&s.safeApplication,"Source missing source text or distinctions "+ref);
  assert.notEqual(s.verificationStatus,"scientifically-approved");
  linked++;
 }
}
for(const [id,number,narrator] of [["SRC-CORE35-BUKHARI-5376","5376","ʿUmar ibn Abī Salamah"],["SRC-CORE36-BUKHARI-2363","2363","Abū Hurayrah"],["SRC-CORE37-BUKHARI-6014","6014","ʿĀʾišah, Umm al-Muʾminīn"],["SRC-CORE38-BUKHARI-6340","6340","Abū Hurayrah"]]){
 const s=x.sources.find(z=>z.sourceId===id);
 assert.ok(s&&s.number.includes(number));
 assert.equal(s.narrator,narrator);
 assert.equal(s.verificationStatus,"primary-report-direct-read-2026-10-14");
 assert.ok(s.checkedBy.includes("Dorar"));
 assert.match(s.safeApplication,/Kind/);
}
const tafsir=x.sources.find(s=>s.sourceId==="SRC-CORE36-IBNKATHIR-638");
assert.ok(tafsir?.directLink.includes("quran.ksu.edu.sa/tafseer/katheer/sura6-aya38.html"));
assert.match(tafsir.arabic,/أُمَمٌ/);
assert.ok(!x.sources.find(s=>s.sourceId==="SRC-CORE37-BUKHARI-6014").locus.includes("ﷺ?"));
process.stdout.write("PASS 33–40: 8 lesson IDs, "+linked+" bindings, "+x.sourceCount+" unique sources; 0 scientific approvals claimed\n");
