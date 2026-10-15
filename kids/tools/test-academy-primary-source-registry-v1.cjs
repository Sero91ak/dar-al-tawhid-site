#!/usr/bin/env node
"use strict";
/* Protected draft: factual completeness and unique source-link regression.
 * Does not grant scientific approval and does not change any data.
 */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../..");
const file=JSON.parse(fs.readFileSync(path.join(root,"kids-akademie/research/SOURCE_REGISTRY.json"),"utf8"));
assert.ok(Array.isArray(file.sources),"Source registry must contain sources array");
const ids=new Set();
for(const src of file.sources){
 assert.ok(src.sourceId&&typeof src.sourceId==="string","Every source needs ID");
 assert.ok(!ids.has(src.sourceId),"Duplicate sourceId: "+src.sourceId);
 ids.add(src.sourceId);
}
const required={
"fiqh-salah-gebet-lernen":{"SRC-CORE30-BUKHARI-631":["dorar.net","12044"]},
"aqidah-ikhlas-gute-absichten":{"SRC-CORE12-TABARI-4233":["islamweb.net","50/4233"],"SRC-BANK-001":["dorar.net","3429"]},
"adab-essen-bismillah":{"SRC-CORE35-BUKHARI-5376":["dorar.net","14362"]},
"akhlaq-tiere-barmherzigkeit":{"SRC-CORE36-BUKHARI-2363":["dorar.net","72367"]},
"adab-respekt-eltern-zuhoren":{"SRC-CORE10-IBNKATHIR-1005":["islamweb.net","49/1005"],"SRC-CORE10-BUKHARI-5971":["dorar.net","151125"]},
"fiqh-salah-allah-gedenken":{"SRC-CORE30-ZAJJAJ-1714":["islamweb.net","233/1714"]},
"aqidah-ikhlas-gutes-ohne-lob":{"SRC-CORE12-TABARI-4233":["islamweb.net","50/4233"],"SRC-BANK-001":["dorar.net","3429"]},
"adab-respekt-hilfsbereit-sein":{"SRC-CORE10-IBNKATHIR-1005":["islamweb.net","49/1005"],"SRC-CORE10-BUKHARI-5971":["dorar.net","151125"]},
"akhlaq-amanah-mein-versprechen":{"SRC-CORE9-IBNALJAWZI-1676":["islamweb.net","ID=1676"],"SRC-CORE9-BUKHARI-33":["dorar.net","5952"]},
"adab-worte-erst-nachdenken":{"SRC-CORE6-TABARI-3021":["islamweb.net","50/3021"],"SRC-CORE6-BUKHARI-6018":["dorar.net","4361"]},
"fiqh-wudu-kopf-und-fu-e":{"SRC-FIQH27-MUGHNI-141":["islamweb.net","15/141"],"SRC-FIQH27-MUGHNI-149":["islamweb.net","15/149"]},
"aqidah-iman-die-gesandten":{"SRC-CORE8-MUSLIM-8":["dorar.net","63778"]},
"akhlaq-sabr-geduldig-warten":{"SRC-CORE5-IBNKATHIR-184":["islamweb.net","49/184"]},
"adab-salam-salam-erwidern":{"SRC-CORE2-QURTUBI-1095":["islamweb.net","48/1095"]},
"fiqh-taharah-saubere-kleidung":{"SRC-FIQH15-MUGHNI-783":["gcp.islamweb.net","15/783"]},
"aqidah-tawhid-allah-ist-einer":{"SRC-V38-112-1":["islamweb.net","49/1984"]},
"sidq":{"SRC-CORE1-IBNKATHIR-698":["islamweb.net","49/698"],"SRC-CORE1-MUSLIM-2607":["dorar.net","10209"]},
"aqidah-iman":{"SRC-CORE8-IBNATIYYAH-21":["islamweb.net","207/21"],"SRC-CORE8-MUSLIM-8":["dorar.net","63778"]},
"adab-worte":{"SRC-CORE6-TABARI-3021":["islamweb.net","50/3021"],"SRC-CORE6-BUKHARI-6018":["dorar.net","4361"]},
"akhlaq-sabr":{"SRC-CORE5-IBNKATHIR-184":["islamweb.net","49/184"],"SRC-CORE5-TABARI-467":["islamweb.net","50/467"],"SRC-CORE5-BUKHARI-1469":["dorar.net","7038"]},
"akhlaq-amanah":{"SRC-CORE9-IBNALJAWZI-1676":["islamweb.net","ID=1676"],"SRC-CORE9-BUKHARI-33":["dorar.net","5952"]},
"adab-respekt":{"SRC-CORE10-IBNKATHIR-1005":["islamweb.net","49/1005"],"SRC-CORE10-BUKHARI-5971":["dorar.net","151125"]},
"aqidah-ikhlas":{"SRC-CORE12-TABARI-4233":["islamweb.net","50/4233"]},
"adab-salam":{
 "SRC-CORE2-QURTUBI-1095":["islamweb.net","48/1095"],
 "SRC-CORE2-MUSLIM-54":["islamweb.net","1/152"]
},
"aqidah-tawhid":{
 "SRC-V38-112-1":["islamweb.net","49/1984"],
 "SRC-CORE4-BUKHARI-2856":["dorar.net","11568"]
},
"fiqh-gebetsplatz-vorbereiten":{
 "SRC-FIQH118-BUKHARI-335":["dorar.net","335"],
 "SRC-FIQH118-MUGHNI-784":["islamweb.net","15/784"],
 "SRC-FIQH118-MUGHNI-786":["islamweb.net","15/786"],
 "SRC-FIQH118-MUGHNI-808":["islamweb.net","15/808"]
},
"fiqh-gebetszeiten-kennenlernen":{
 "SRC-FIQH130-MUGHNI-425":["islamweb.net","15/425"],
 "SRC-FIQH130-MUGHNI-428":["islamweb.net","15/428"],
 "SRC-FIQH130-MUGHNI-429":["islamweb.net","15/429"]
},
"fiqh-namen-der-fuenf-gebete":{
 "SRC-FIQH142-MUSLIM-612":["islamweb.net","1/1036"],
 "SRC-FIQH142-MUGHNI-425":["islamweb.net","15/425"]
},
"fiqh-absicht-zum-gebet":{
 "SRC-FIQH154-MUGHNI-542":["islamweb.net","15/542"]
},
"fiqh-takbirat-al-ihram":{
 "SRC-FIQH174-MUGHNI-533":["islamweb.net","15/533"]
},
"fiqh-quran-rezitation-im-gebet":{
 "SRC-FIQH180-MUGHNI-553":["islamweb.net","15/553"]
},
"fiqh-ruku-kennenlernen":{
 "SRC-FIQH186-MUGHNI-570":["islamweb.net","15/570"]
},
"fiqh-sujud":{
 "SRC-FIQH198-MUGHNI-592":["islamweb.net","15/592"]
},
"fiqh-aus-dem-ruku-aufrichten":{
 "SRC-FIQH192-MUGHNI-574":["islamweb.net","15/574"]
},
"fiqh-zwischen-niederwerfungen-sitzen":{
 "SRC-FIQH201-MUGHNI-599":["islamweb.net","15/599"],
 "SRC-FIQH201-MUGHNI-602":["islamweb.net","15/602"]
},
"fiqh-tashahhud":{
 "SRC-FIQH204-MUGHNI-611":["islamweb.net","15/611"],
 "SRC-FIQH204-MUGHNI-618":["islamweb.net","15/618"]
},
"fiqh-taslim":{
 "SRC-FIQH205-MUGHNI-621":["islamweb.net","15/621"]
},
"fiqh-ramadan-fasten":{
 "SRC-FIQH207-MUGHNI-1713":["islamweb.net","15/1713"]
},
"fiqh-zakah-und-hajj":{
 "SRC-FIQH208-MUGHNI-1386":["islamweb.net","15/1386"],
 "SRC-FIQH208-MUGHNI-1754":["islamweb.net","15/1754"],
 "SRC-FIQH208-MUGHNI-1800":["islamweb.net","15/1800"]
},
"fiqh-fehler-beim-ueben":{
 "SRC-FIQH206-MUGHNI-729":["islamweb.net","15/729"]
}};
assert.equal(file.sourceCount,file.sources.length,"sourceCount metadata must match actual source IDs");

const childrenHadith=[["SRC-CORE35-BUKHARI-5376","ʿUmar ibn Abī Salamah","5376","2022","adab-essen-bismillah"],
["SRC-CORE36-BUKHARI-2363","Abū Hurayrah","2363","2244","akhlaq-tiere-barmherzigkeit"]];
for(const [sourceId,narrator,number,muslim,lesson] of childrenHadith){
 const src=file.sources.find(x=>x.sourceId===sourceId);
 assert.ok(src,"Missing verified authentic teaching source: "+sourceId);
 assert.equal(src.narrator,narrator);
 assert.match(src.number,new RegExp(number));
 assert.match(src.number,new RegExp(muslim));
 assert.equal(src.verificationStatus,"primary-report-direct-read-2026-10-14");
 assert.ok(src.lessonIds?.includes(lesson));
 assert.ok(src.arabic&&src.directLink&&src.authenticityNote&&src.safeApplication);
 assert.match(src.safeApplication,/Kinder|Kind/);
 assert.notEqual(src.verificationStatus,"scientifically-approved");
}
assert.match(file.sources.find(x=>x.sourceId==="SRC-CORE35-BUKHARI-5376").arabic,/يَا غُلَامُ/);
assert.match(file.sources.find(x=>x.sourceId==="SRC-CORE36-BUKHARI-2363").arabic,/كَبِدٍ/);
// These four original IDs span multiple curriculum packages, not only v2.
// Use the canonical 208-slot ledger so later originals are not false negatives.
const originalLessons=JSON.parse(fs.readFileSync(path.join(root,"kids-akademie/LESSON_STATUS.json"),"utf8")).lessons;
const originalIds=new Set(originalLessons.map(lesson=>lesson.lessonId));
assert.equal(originalLessons.length,208,"Source registry must resolve into all 208 original lessons");
for(const id of ["fiqh-salah-gebet-lernen","aqidah-ikhlas-gute-absichten","adab-essen-bismillah","akhlaq-tiere-barmherzigkeit"]){
 assert.ok(originalIds.has(id),"Source must refer to original 208-slot curriculum ID "+id);
}


// The purpose of ṣalāh in 20:14 requires its own classical interpretation; it is not a full Fiqh chapter.
const prayerRemembrance=file.sources.find(x=>x.sourceId==="SRC-CORE30-ZAJJAJ-1714");
assert.ok(prayerRemembrance,"Missing original az-Zajjāj source for slot 30");
assert.equal(prayerRemembrance.work,"Maʿānī al-Qurʾān wa-Iʿrābuh");
assert.equal(prayerRemembrance.volume,"3");
assert.equal(prayerRemembrance.page,"352");
assert.match(prayerRemembrance.locus,/20:14/);
assert.match(prayerRemembrance.arabic,/وَأَقِمِ الصَّلَاةَ لِذِكْرِي/);
assert.match(prayerRemembrance.authenticityNote,/kein vollständiges hanbalitisches Gebetsrecht/);
assert.equal(prayerRemembrance.verificationStatus,"primary-page-direct-read-2026-10-14");
assert.ok(prayerRemembrance.lessonIds.includes("fiqh-salah-allah-gedenken"));
assert.notEqual(prayerRemembrance.verificationStatus,"scientifically-approved");
const supplementalCurriculum=fs.readFileSync(path.join(root,"kids/akademie/curriculum-v2.js"),"utf8");
for(const id of ["adab-respekt-eltern-zuhoren","fiqh-salah-allah-gedenken","aqidah-ikhlas-gutes-ohne-lob","adab-respekt-hilfsbereit-sein"]){
 assert.ok(supplementalCurriculum.includes('"'+id+'"'),"Missing existing lesson; must not create a duplicate: "+id);
}


// Early-curriculum source-bindings 25–28: quellentreue Hanbali Wuḍūʾ distinction.
const headSource=file.sources.find(x=>x.sourceId==="SRC-FIQH27-MUGHNI-141");
const feetSource=file.sources.find(x=>x.sourceId==="SRC-FIQH27-MUGHNI-149");
assert.ok(headSource&&feetSource,"Missing classical Fiqh source for Wuḍūʾ lesson 27");
assert.equal(headSource.page,"87");
assert.equal(feetSource.page,"90–92");
assert.equal(headSource.number,"166");
assert.equal(feetSource.number,"175");
assert.equal(headSource.verificationStatus,"primary-page-direct-read-2026-10-14");
assert.equal(feetSource.verificationStatus,"primary-page-direct-read-2026-10-14");
assert.match(headSource.arabic,/مَسْحُ الرَّأْسِ/);
assert.match(feetSource.arabic,/غَسْلُ الرِّجْلَيْنِ/);
assert.match(headSource.authenticityNote,/unterschiedliche/);
assert.match(feetSource.safeApplication,/Kind/);
for(const x of [headSource,feetSource]){
 assert.equal(x.work,"al-Mughnī");
 assert.ok(x.lessonIds.includes("fiqh-wudu-kopf-und-fu-e"));
 assert.ok(x.authenticityNote&&x.safeApplication&&x.checkedBy);
 assert.notEqual(x.verificationStatus,"scientifically-approved");
}
const coreV2=fs.readFileSync(path.join(root,"kids/akademie/curriculum-v2.js"),"utf8");
for(const id of ["akhlaq-amanah-mein-versprechen","adab-worte-erst-nachdenken","fiqh-wudu-kopf-und-fu-e","aqidah-iman-die-gesandten"]){
 assert.ok(coreV2.includes('"' + id + '"'),"Missing original lesson ID, should not create a duplicate: "+id);
}

const checkedGarmentSource=file.sources.find(s=>s.sourceId==="SRC-FIQH15-MUGHNI-783");
assert.equal(checkedGarmentSource?.volume,"1");
assert.equal(checkedGarmentSource?.page,"401");
assert.ok(checkedGarmentSource.arabic.includes("الطَّهَارَةُ مِنَ النَّجَاسَةِ"));
assert.equal(checkedGarmentSource.verificationStatus,"primary-page-direct-read-2026-10-14");
assert.ok(checkedGarmentSource.authenticityNote.includes("Ausnahmen"),"Do not imply full Fiqh approval");

const indexedOnly=["SRC-FIQH201-MUGHNI-599","SRC-FIQH201-MUGHNI-602","SRC-FIQH205-MUGHNI-621","SRC-FIQH207-MUGHNI-1713","SRC-FIQH208-MUGHNI-1386","SRC-FIQH206-MUGHNI-729","SRC-FIQH208-MUGHNI-1754","SRC-FIQH208-MUGHNI-1800","SRC-FIQH204-MUGHNI-611","SRC-FIQH204-MUGHNI-618","SRC-FIQH174-MUGHNI-533","SRC-FIQH186-MUGHNI-570","SRC-FIQH192-MUGHNI-574"];
for(const id of indexedOnly){
 const e=file.sources.find(x=>x.sourceId===id);
 assert.ok(e,"Indexed primary-source gap missing: "+id);
 assert.equal(e.verificationStatus,"primary-index-excerpt-cross-checked-2026-10-14-direct-fetch-unavailable");
 assert.match(e.checkedBy,/nicht möglich|nicht verfügbar/,"source access limitation must not be concealed");
 assert.ok(e.safeApplication&&e.authenticityNote&&e.arabic,"record must give original fragment and child-safe scope");
 assert.notEqual(e.verificationStatus,"scientifically-approved");
}
const directlyReadSujud=file.sources.find(x=>x.sourceId==="SRC-FIQH198-MUGHNI-592");
assert.ok(directlyReadSujud,"Directly read classical Sujud source must be registered");
assert.equal(directlyReadSujud.verificationStatus,"primary-page-direct-read-2026-10-14");
assert.match(directlyReadSujud.checkedBy,/Direkter öffentlicher Abruf/);
assert.match(directlyReadSujud.arabic,/أمرت بالسجود على سبعة أعظم/);
assert.match(directlyReadSujud.authenticityNote,/nicht gesondert nachgeprüft/);
assert.match(directlyReadSujud.safeApplication,/Bei Schmerzen/);
assert.notEqual(directlyReadSujud.verificationStatus,"scientifically-approved");
const earlyPrimary=[
 ["SRC-CORE2-QURTUBI-1095","primary-page-direct-read-2026-10-14"],
 ["SRC-CORE2-MUSLIM-54","primary-page-direct-read-2026-10-14"],
 ["SRC-CORE4-BUKHARI-2856","primary-report-direct-read-2026-10-14"]
];
for(const [id,status] of earlyPrimary){const src=file.sources.find(x=>x.sourceId===id);
 assert.ok(src,"Early-core primary-source gap: "+id);
 assert.equal(src.verificationStatus,status,"Direct reading needs exact honest status: "+id);
 assert.ok(src.checkedBy&&src.authenticityNote&&src.safeApplication&&src.arabic,"Source evidence metadata incomplete: "+id);
 assert.notEqual(src.verificationStatus,"scientifically-approved");
}
const imanTafsir=file.sources.find(x=>x.sourceId==="SRC-CORE8-IBNATIYYAH-21");
const imanHadith=file.sources.find(x=>x.sourceId==="SRC-CORE8-MUSLIM-8");
assert.ok(imanTafsir&&imanHadith,"Slot 8 requires separated Quran and authentic Sunnah");
assert.equal(imanTafsir.locus,"Qurʾān 2:3");
assert.equal(imanTafsir.verificationStatus,"primary-page-direct-read-2026-10-14");
assert.match(imanTafsir.arabic,/بِالْغَيْبِ/);
assert.equal(imanHadith.narrator,"ʿUmar ibn al-Ḫaṭṭāb");
assert.match(imanHadith.number,/8/);
assert.match(imanHadith.arabic,/بِالْقَدَرِ/);
assert.equal(imanHadith.verificationStatus,"hadith-edition-direct-citation-verified-2026-10-15");
assert.equal(imanHadith.checkedOn,"2026-10-15");
assert.match(imanHadith.checkedBy,/Muslim 8/);
assert.match(imanHadith.safeApplication,/Kinder|Kind/);
assert.notEqual(imanHadith.verificationStatus,"scientifically-approved");
const sidqTafsir=file.sources.find(x=>x.sourceId==="SRC-CORE1-IBNKATHIR-698");
const sidqHadith=file.sources.find(x=>x.sourceId==="SRC-CORE1-MUSLIM-2607");
assert.ok(sidqTafsir&&sidqHadith,"First lesson needs separate Quran/Tafsir and Sunnah evidence");
assert.equal(sidqTafsir.locus,"Qurʾān 9:119");
assert.equal(sidqTafsir.verificationStatus,"primary-page-direct-read-2026-10-14");
assert.match(sidqTafsir.arabic,/الصَّادِقِينَ/);
assert.equal(sidqHadith.narrator,"ʿAbdullāh ibn Masʿūd");
assert.match(sidqHadith.number,/2607/);
assert.match(sidqHadith.number,/6094/);
assert.equal(sidqHadith.verificationStatus,"primary-report-direct-read-2026-10-14");
assert.match(sidqHadith.arabic,/الصِّدْقَ/);
assert.match(sidqHadith.safeApplication,/Kinder|Kind/);
assert.notEqual(sidqHadith.verificationStatus,"scientifically-approved");
const goodSpeechHadith=file.sources.find(x=>x.sourceId==="SRC-CORE6-BUKHARI-6018");
assert.ok(goodSpeechHadith,"Directly checked Sunni hadith 6018 missing");
assert.equal(goodSpeechHadith.number,"6018");
assert.equal(goodSpeechHadith.narrator,"Abū Hurayrah");
assert.equal(goodSpeechHadith.verificationStatus,"primary-report-direct-read-2026-10-14");
assert.match(goodSpeechHadith.arabic,/فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ/);
assert.match(goodSpeechHadith.safeApplication,/Kind/);
const parentRespectHadith=file.sources.find(x=>x.sourceId==="SRC-CORE10-BUKHARI-5971");
assert.ok(parentRespectHadith,"Missing directly checked parental-respect Sunnah source");
assert.equal(parentRespectHadith.number,"5971");
assert.equal(parentRespectHadith.narrator,"Abū Hurayrah");
assert.equal(parentRespectHadith.verificationStatus,"primary-report-direct-read-2026-10-14");
assert.ok(parentRespectHadith.arabic.includes("أُمُّكَ")&&parentRespectHadith.arabic.includes("أَبُوكَ"));
assert.match(parentRespectHadith.authenticityNote,/Auszug|Ellipse/);
assert.match(parentRespectHadith.safeApplication,/gefährlichen/);
const newlyReadEarly=["SRC-CORE6-TABARI-3021","SRC-CORE9-IBNALJAWZI-1676","SRC-CORE10-IBNKATHIR-1005","SRC-CORE12-TABARI-4233"];
for(const id of newlyReadEarly){
 const src=file.sources.find(x=>x.sourceId===id);
 assert.ok(src,"Missing direct classical early source: "+id);
 assert.equal(src.verificationStatus,"primary-page-direct-read-2026-10-14");
 assert.ok(src.checkedBy&&src.authenticityNote&&src.safeApplication&&src.arabic,"Incomplete early source metadata: "+id);
 assert.match(src.authenticityNote,/nicht|nicht allein|eigenst\u00e4ndig|gesondert/i,"Must distinguish Quran source and hadith status");
 assert.notEqual(src.verificationStatus,"scientifically-approved");
}
const ikhlas=file.sources.find(x=>x.sourceId==="SRC-V38-112-1");
assert.ok(ikhlas?.lessonIds?.includes("aqidah-tawhid"),"Reuse original Sūrah 112 source rather than duplicate");
assert.equal(ikhlas.locus,"Qurʾān 112:1–4");
const newCore=[
 ["SRC-CORE5-IBNKATHIR-184","akhlaq-sabr","Qurʾān 2:153","primary-page-direct-read-2026-10-14"],
 ["SRC-CORE5-TABARI-467","akhlaq-sabr","Qurʾān 2:153","primary-page-direct-read-2026-10-14"],
 ["SRC-CORE5-BUKHARI-1469","akhlaq-sabr",null,"primary-report-direct-read-2026-10-14"],
 ["SRC-CORE9-BUKHARI-33","akhlaq-amanah",null,"primary-report-direct-read-2026-10-14"],
 ["SRC-BANK-001","aqidah-ikhlas",null,"primary-report-direct-read-2026-10-14"]
];
for(const [sourceId,lessonId,locus,verificationStatus] of newCore){
 const src=file.sources.find(x=>x.sourceId===sourceId);
 assert.ok(src,"Missing directly checked early source: "+sourceId);
 assert.ok(src.lessonIds.includes(lessonId),"Wrong lesson link: "+sourceId);
 if(locus)assert.equal(src.locus,locus,"Incorrect Quran verse for "+sourceId);
 assert.equal(src.verificationStatus,verificationStatus,"Verification status is not an approval: "+sourceId);
 assert.equal(src.checkedOn,"2026-10-14");
 assert.ok(src.narrator||src.author,"Reporter or original author required: "+sourceId);
 assert.ok(src.arabic&&src.directLink&&src.authenticityNote&&src.safeApplication,"Missing direct source metadata: "+sourceId);
 assert.ok(src.safeApplication.match(/Kind|Kinder/),"Child safety boundary missing: "+sourceId);
 assert.notEqual(src.verificationStatus,"scientifically-approved");
}
assert.equal(file.sources.find(s=>s.sourceId==="SRC-CORE5-BUKHARI-1469").narrator,"Abū Saʿīd al-Ḫudrī");
assert.match(file.sources.find(s=>s.sourceId==="SRC-CORE5-BUKHARI-1469").number,/1469/);
assert.equal(file.sources.find(s=>s.sourceId==="SRC-CORE9-BUKHARI-33").narrator,"Abū Hurayrah");
assert.match(file.sources.find(s=>s.sourceId==="SRC-CORE9-BUKHARI-33").arabic,/اؤْتُمِنَ/);
assert.match(file.sources.find(s=>s.sourceId==="SRC-BANK-001").number,/1/);
assert.equal(file.sources.filter(s=>s.sourceId==="SRC-BANK-001").length,1,"Reuse hadith bank 1 without duplication");
// Cross-check actually loaded early lesson overlays with the primary reports.
const vm=require("node:vm");
const browser={window:{}};
for(const script of ["kids/akademie/curriculum-v1.js","kids/akademie/curriculum-editorial-core-002-005-v1.js","kids/akademie/curriculum-editorial-core-006-009-v1.js","kids/akademie/curriculum-editorial-core-010-012-v1.js"]){
 vm.runInNewContext(fs.readFileSync(path.join(root,script),"utf8"),browser,{filename:script});
}
const earlyLessonCheck=[
 ["akhlaq-sabr",2,153,"1469","SRC-CORE5-BUKHARI-1469"],
 ["akhlaq-amanah",23,8,"33","SRC-CORE9-BUKHARI-33"],
 ["aqidah-ikhlas",39,11,"1","SRC-BANK-001"]
];
for(const [lessonId,surah,ayah,number,sourceId] of earlyLessonCheck){
 const lesson=browser.window.DARKidsAcademyCurriculum[lessonId];
 assert.ok(lesson,"Missing loaded early curriculum "+lessonId);
 assert.equal(lesson.quran.surah,surah,"Misattributed surah on loaded early lesson "+lessonId);
 assert.equal(lesson.quran.ayah,ayah,"Misattributed ayah on loaded early lesson "+lessonId);
 assert.match(lesson.hadith.source,new RegExp("Nr\\.\\s*"+number+"(?:\\D|$)"),"Wrong hadith number on "+lessonId);
 const src=file.sources.find(x=>x.sourceId===sourceId);
 assert.ok(src?.lessonIds?.includes(lessonId),"Primary hadith source and actual early lesson are disconnected "+lessonId);
 for(const age of ["4-5","6-8","9-10"]){
  const version=lesson.ageText?.[age];
  assert.ok(version?.lines?.length===4,"Incomplete actual child-age lesson "+lessonId+"/"+age);
  assert.ok(version.evidence?.includes(number)||age==="4-5","Older child lesson should cite the verified primary hadith number "+lessonId+"/"+age);
  const visible=[version.lines.join(" "),version.evidence,version.summary].join(" ");
  assert.doesNotMatch(visible,/scientificApproval|fiqhHumanReviewNeeded|Masterstimme|Keine Freigabe für Besucher|QA-Hinweis/i,"Internal QA text leaked into child content");
 }
 assert.equal(lesson.sourceAudit?.scientificApproval,false,"Never mark early primary-source checks as final scholarly approval");
}
let count=0;
for(const [lessonId,expected] of Object.entries(required)){
 for(const [id,[host,fragment]] of Object.entries(expected)){
  const ref=file.sources.find(x=>x.sourceId===id);
  assert.ok(ref,"Required source missing: "+id);
  assert.ok(ref.lessonIds?.includes(lessonId),"Wrong lesson link: "+id);
  assert.ok(ref.directLink?.startsWith("https://"),"Direct link missing HTTPS: "+id);
  assert.equal(new URL(ref.directLink).hostname.replace("www.",""),host,"Domain mismatch: "+id);
  assert.ok(ref.directLink.includes(fragment)||String(ref.number).includes(fragment),"Unexpected source page/number: "+id);
  assert.ok(ref.arabic&&ref.authenticityNote&&ref.safeApplication,"Unexplained source: "+id);
  assert.notEqual(ref.verificationStatus,"scientifically-approved","Source lookup != final approval");
  count++;
 }
}
process.stdout.write("PASS source registry: "+file.sources.length+" unique source IDs; "+count+" referenced evidence items / "+Object.keys(required).length+" Fiqh lessons; no scientific approval implied\n");
