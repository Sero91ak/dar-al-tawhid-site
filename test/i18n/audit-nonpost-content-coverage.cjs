#!/usr/bin/env node
"use strict";
/* Inventory only: source-aware translation worklist BEFORE the posts stage.
 * Never invent verse meanings, modify Qurʾān or count transliteration as Turkish.
 * Staged metadata; a translation is publishable only after source-hash review. */
const fs=require("fs"),path=require("path"),assert=require("assert/strict");
const root=path.resolve(__dirname,"../..");
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),"utf8"));
const surahFiles=fs.readdirSync(path.join(root,"content/quran")).filter(f=>/^\\d{3}\\.json$/.test(f));
let totalVerses=0,withArabic=0,withGermanMeaning=0;
const verseIds=new Set();
for(const file of surahFiles){
 const doc=read("content/quran/"+file);
 assert(Array.isArray(doc.verses),"Invalid verses in "+file);
 for(const verse of doc.verses){
  const id=doc.id+":"+verse.id;
  assert(!verseIds.has(id),"Duplicate verse "+id);verseIds.add(id);
  totalVerses++;if(verse.ar?.trim())withArabic++;
  if(verse.de?.trim())withGermanMeaning++;
 }
}
const prophetIndex=read("test/data/prophets/index.json");
const prophets=[...(prophetIndex.prophets||[]),...(prophetIndex.disputed||[]),
 ...(prophetIndex.furtherPersons||[])];
const seen=new Set();
let availableProfiles=0,refCount=0,familyCount=0,timelineCount=0,statementCount=0;
for(const p of prophets){
 if(!p?.id||!p.profileFile||seen.has(p.id))continue;seen.add(p.id);
 const full=path.join(root,"test/data/prophets",p.profileFile);
 if(!fs.existsSync(full))continue;
 const profile=JSON.parse(fs.readFileSync(full,"utf8"));
 availableProfiles++;
 refCount+=(profile.quranRefs||[]).length;
 familyCount+=(profile.family||[]).length;
 timelineCount+=(profile.timeline||[]).length;
 statementCount+=(profile.statements?.quran||[]).length+(profile.statements?.sunnah||[]).length;
}
const duas=read("content/duas/duas.json");
const titles=read("test/i18n/adult-visible-title-drafts-seven.json");
const foundDuas=duas.filter(d=>titles.records["dua:"+d.id]).length;
const languages=["tr","en","ar","ku","ckb","bs"];
const published=path.join(root,"content/i18n/published");
const verifiedLocales=languages.filter(l=>fs.existsSync(path.join(published,l,"manifest.json")));
console.log("NONPOST CONTENT COVERAGE",JSON.stringify({
 scope:"DAR TEST; editorial inventory only",
 quran:{surahs:surahFiles.length,verses:totalVerses,withArabic,withGermanMeaning,
  untranslatedTargetSlots:totalVerses*languages.length,
  important:"tr/tr_readable/tr_academic fields are pronunciation, NEVER Turkish meanings"},
 prophets:{profiles:availableProfiles,quranReferences:refCount,familyRecords:familyCount,
  lifeEvents:timelineCount,statementRecords:statementCount},
 duas:{canonical:duas.length,visibleHeadingDrafts:foundDuas,
  meaningTranslationsNotImpliedByHeadingDrafts:true},
 approvedTranslationManifestLocales:verifiedLocales,
 posts:"intentionally deferred",
 commercialTranslationCalls:0
}));
