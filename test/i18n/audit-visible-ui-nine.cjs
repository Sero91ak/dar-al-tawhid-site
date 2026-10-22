#!/usr/bin/env node
"use strict";
/**
 * DĀR TEST nine-language UI gap inventory.
 * READ-ONLY; 0 API calls. Sources are suggestions for human review, NOT
 * permission to translate religious text or publish an unapproved edition.
 * Supports the 15-route Selenium UI scan when it exists, and the previously
 * recorded Turkish candidate index as an offline fallback.
 */
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"../..");
const registry=JSON.parse(fs.readFileSync(path.join(root,"desktop-preview/i18n-core-v1/locales.json"),"utf8"));
const pack=JSON.parse(fs.readFileSync(path.join(__dirname,"adult-ui-locales-seven.json"),"utf8"));
const generated=JSON.parse(fs.readFileSync(path.join(__dirname,"ui-tr.generated.json"),"utf8"));
const candidateFile=path.join(__dirname,"qa/ui-candidates.json");
const scanned=fs.existsSync(candidateFile)?JSON.parse(fs.readFileSync(candidateFile,"utf8")):null;
if(scanned&&(
 scanned.schemaVersion!==1||scanned.scope!=="adult-test-ui-only"||
 !Array.isArray(scanned.routes)||!Array.isArray(scanned.candidates)
))throw Error("Invalid UI scan: refuse to report untrusted inventory");
const candidateRows=scanned?
 scanned.candidates.map(item=>({de:item.de,routes:item.routes||[],count:item.count||1,origin:"browser-ui-candidate"})):
 Object.keys(generated.entries).map(de=>({de,routes:[],count:1,origin:"existing-static-candidate"}));
const whitespace=s=>String(s||"").replace(/\s+/g," ").trim();
const sourceLike=s=>{
 if(!s||s.length>180||/[\u0600-\u06ff<>]/.test(s))return true;
 if(/^[„“"«].+[”"»]$/.test(s)||/[﴿﴾]/.test(s))return true;
 if(/\b(Quelle:|Quellenangabe:|Sunan |Ṣaḥīḥ |Musnad |Tārīkh |Isnād:|Überlieferte Aussage:)/i.test(s))return true;
 if(/^(DĀR AL TAWḤĪD|Tawḥīd|Sunnah|Fiqh|ʿAqīdah|Ḥadīṯ|Qurʾān|Āthār)$/i.test(s))return true;
 // Do not assume that source-like category descriptions are safe to auto-translate.
 if(s.length>105&&/(Qurʾān|Sunnah|Ḥadīṯ|Ṣaḥāb|Gelehrte|Āthār|Prophet)/i.test(s))return true;
 return false;
};
const targets=Object.keys(registry.locales).filter(code=>code!=="de");
const unique=new Map();
for(const row of candidateRows){
 const de=whitespace(row.de);
 if(de.length<2||sourceLike(de))continue;
 const hit=unique.get(de);
 if(hit){hit.count+=(row.count||1);for(const r of row.routes||[])hit.routes.add(r);}
 else unique.set(de,{de,count:row.count||1,routes:new Set(row.routes||[]),origin:row.origin});
}
const missing=[];
let fullyCovered=0;
for(const row of unique.values()){
 const missingLocales=targets.filter(code=>!pack.translations[code]?.[row.de]?.trim());
 if(!missingLocales.length){fullyCovered++;continue;}
 missing.push({de:row.de,routes:[...row.routes].sort(),missingLocales,candidateOnly:true});
}
missing.sort((a,b)=>b.routes.length-a.routes.length||a.de.localeCompare(b.de,"de"));
const coverage={};
for(const code of targets){
 const missingCount=missing.filter(item=>item.missingLocales.includes(code)).length;
 coverage[code]={checkedUiCandidates:unique.size,covered:unique.size-missingCount,
  missing:missingCount,percent:unique.size?
   Math.round((unique.size-missingCount)*10000/unique.size)/100:100};
}
const report={schemaVersion:1,scope:"adult-test-ui-audit-not-publishing",
 sourceLocale:"de",registeredLanguages:Object.keys(registry.locales),
 scanSource:scanned?"15-route-browser-scan":"stored-Turkish-ui-candidate-index",
 scanRoutes:scanned?.routes||[],scanErrors:scanned?.errors||[],
 auditedCandidates:unique.size,fullyCoveredInAllTargetLocales:fullyCovered,
 languageCoverage:coverage,untranslatedCandidates:missing,
 notes:"Review each candidate as UI before adding translations. Source texts, citations, Quran, Hadith and authored posts must not be auto-translated. No paid provider is contacted."};
if(process.argv.includes("--write-report")){
 const output=path.join(__dirname,"qa/ui-gaps-nine.json");
 fs.mkdirSync(path.dirname(output),{recursive:true});
 fs.writeFileSync(output,JSON.stringify(report,null,2)+"\n");
 console.log("Wrote "+output);
}
console.log(JSON.stringify(report,null,2));
