#!/usr/bin/env node
"use strict";
/* Scientific/source index regression only: NOT scholarly approval or publication. */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const reg=JSON.parse(read("kids-akademie/research/SOURCE_REGISTRY.json"));
assert.equal(reg.sourceCount,reg.sources.length);
assert.equal(new Set(reg.sources.map(s=>s.sourceId)).size,reg.sources.length);
const lessons={
"aqidah-ikhlas-warum-gutes-tun":["SRC-V38-98-5","SRC-BANK-001"],
"akhlaq-wut-ruhig-bleiben":["SRC-V38-3-134","SRC-CORE42-BUKHARI-6114"],
"adab-erlaubnis-anklopfen":["SRC-V38-24-27","SRC-CORE43-BUKHARI-6245"],
"akhlaq-tarbiyah-sanft-lernen":["SRC-CORE44-BUKHARI-69"],
"akhlaq-nafs-gutes-herz":["SRC-CORE45-IBNKATHIR-1958","SRC-CORE45-MUSLIM-2564"],
"fiqh-reinheit-unterscheiden":["SRC-FIQH23-MUGHNI-132","SRC-FIQH23-MUGHNI-135","SRC-CORE46-IBNKATHIR-376","SRC-CORE46-MUSLIM-223"],
"aqidah-quran-allahs-wort":["SRC-V38-2-2","SRC-CORE47-BUKHARI-5027"],
"aqidah-sirah-adam-erschoepfung":["SRC-CORE48-IBNABIHATIM-353","SRC-CORE48-BUKHARI-3326"]};
const v25=read("kids/akademie/curriculum-v25.js"),v26=read("kids/akademie/curriculum-v26.js");
let count=0;
for(const [id,refs] of Object.entries(lessons)){
 assert.ok(v25.includes('"'+id+'"')||v26.includes('"'+id+'"'),"Catalog must contain "+id);
 for(const name of refs){
  const s=reg.sources.find(x=>x.sourceId===name);
  assert.ok(s?.lessonIds?.includes(id),"Missing source binding "+id+"/"+name);
  assert.ok(s.directLink?.startsWith("https://"),"Missing direct URL "+name);
  assert.ok(s.arabic&&s.authenticityNote&&s.safeApplication);
  assert.notEqual(s.verificationStatus,"scientifically-approved");
  count++;
 }
}
const numberTests=[
["SRC-CORE42-BUKHARI-6114","6114"],
["SRC-CORE43-BUKHARI-6245","6245"],
["SRC-CORE44-BUKHARI-69","69"],
["SRC-CORE45-MUSLIM-2564","2564"],
["SRC-CORE46-MUSLIM-223","223"],
["SRC-CORE47-BUKHARI-5027","5027"],
["SRC-CORE48-BUKHARI-3326","3326"]
];
for(const [id,num] of numberTests){
 const s=reg.sources.find(x=>x.sourceId===id);
 assert.ok(s?.number.split(";")[0].trim()===num,"Incorrect hadith number "+id);
}
assert.equal(reg.sources.find(s=>s.sourceId==="SRC-CORE43-BUKHARI-6245").verificationStatus,"parallel-report-crossreferenced-2026-10-14");
assert.match(reg.sources.find(s=>s.sourceId==="SRC-CORE43-BUKHARI-6245").authenticityNote,/Parallel|nicht/);
assert.equal(reg.sources.find(s=>s.sourceId==="SRC-FIQH23-MUGHNI-132").work,"al-Mughnī");
assert.equal(reg.sources.find(s=>s.sourceId==="SRC-FIQH23-MUGHNI-135").work,"al-Mughnī");
assert.match(reg.sources.find(s=>s.sourceId==="SRC-CORE46-MUSLIM-223").safeApplication,/rituell|Ṭahārah/);
process.stdout.write("PASS 41-48 source bindings: 8 lesson IDs / "+count+" links / "+reg.sourceCount+" unique refs. Approval remains separate.\n");
