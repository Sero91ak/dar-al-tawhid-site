#!/usr/bin/env node
"use strict";
/* Reuse one Qur'an meaning by canonical surah:ayah across all Prophet profiles.
 * This is a ZERO-COST REVIEW INVENTORY, NOT a Qur'an translation generator.
 * Arabic scripture / existing German meanings are never overwritten.
 */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),directory=path.join(root,"data/prophets");
const langs=["tr","en","ar","ku","ckb","bs"];
const files=fs.readdirSync(directory).filter(x=>x.endsWith(".json")&&!/^(?:index|phase|block|global)/.test(x));
const references=new Map(),profiles=[];
for(const filename of files){
 const item=JSON.parse(fs.readFileSync(path.join(directory,filename),"utf8"));
 if(!item.id||!Array.isArray(item.quranRefs))continue;
 let count=0;
 for(const ref of item.quranRefs){
  const surah=Number(ref.surah),ayah=Number(ref.ayah),end=Number(ref.ayahEnd||ref.ayah);
  if(!Number.isInteger(surah)||surah<1||surah>114||!Number.isInteger(ayah)||ayah<1||ayah>286||
    !Number.isInteger(end)||end<ayah||end>286)throw Error("Invalid verse reference in "+filename);
  // Expand reference ranges only to map each canonical verse once across profiles.
  for(let verse=ayah;verse<=end;verse++){
   const key=surah+":"+verse;
   let entry=references.get(key);
   if(!entry){entry={verseKey:key,surah,ayah:verse,profiles:[],coverage:{"de":"canonical-reference-only"}};references.set(key,entry)}
   if(!entry.profiles.includes(item.id))entry.profiles.push(item.id);
  }
  count++;
 }
 profiles.push({id:item.id,file:filename,sourceStatus:item.profileStatus||null,referenceRanges:count});
}
const entries=[...references.values()].sort((a,b)=>a.surah-b.surah||a.ayah-b.ayah);
for(const e of entries){for(const lang of langs)e.coverage[lang]="requires-source-verified-meaning"}
const report={schemaVersion:1,scope:"prophets-quran-verse-review-queue",originalArabicPreserved:true,
  originalGermanPreserved:true,publishAllowed:false,paidApiCalls:0,
  notice:"The repository has canonical Quran references but this inventory does NOT claim translations exist. Do not display invented or unreviewed meanings.",
  languages:["de",...langs],profileCount:profiles.length,uniqueVerseCount:entries.length,
  profiles,verses:entries};
assert(report.profileCount>15,"Too few prophet profiles");
assert(report.uniqueVerseCount>100,"Too few canonical verse references");
const out=path.join(root,"test/i18n/qa/prophets-verse-translation-queue.json");
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(report,null,2)+"\n");
console.log("PASS: "+profiles.length+" prophet profiles, "+entries.length+
  " unique canonical verse references queued once, six-language source review required; 0 paid requests");
