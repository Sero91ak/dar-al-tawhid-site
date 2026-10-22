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
/* Candidate classifications are review queues, not authorization to translate.
 * A bibliographic title can appear inside a button. Keep those titles in the
 * report without pretending they are missing app chrome translations. */
const selfNames=new Set(Object.values(pack.names));
const runtimeNumeric=/^(?:[0-9]{1,7} (?:Ergebnisse|Funktionen|Veröffentlichungen|Beiträge|Seiten|Themenbereiche|Aussagen|gemerkt)|[0-9]{1,3}(?:[.,][0-9])?% Trefferquote|[0-9]{1,5}[/][0-9]{1,5} gewählt|[0-9]{1,4} Āyāt · (?:Mekkanisch|Medinensisch)|[0-9]{1,4} Sūren · [0-9]{1,6} Āyāt|(?:Familie|Tawḥīd|Fiqh|ʿAqīdah|Sunnah|Qurʾān), [0-9]{1,7} Veröffentlichungen|Sūrenbereich wechseln, aktuell [0-9]{1,3}[–-][0-9]{1,3}|Duʿāʾ (?:[01][0-9]|2[0-3]):[0-5][0-9] · Empfehlung (?:[01][0-9]|2[0-3]):[0-5][0-9])$/;
const sourceOnlyRoutes=new Set(["books","bibliothek","propheten","quran"]);
const preservedBrands=new Set(["Instagram","Telegram","WhatsApp","by Serhat Abu Malik"]);
const editorialFragments=new Set([", authentischer","und den","Wissen aus"]);
const runtimeShortDate=/^(?:Mo|Di|Mi|Do|Fr|Sa|So)\., [0-9]{2}\.[0-9]{2}\.[0-9]{2}$/;
const dynamicCityStatus=/^Standort gespeichert: [^<>\r\n]{2,90}$/;
const dynamicWeatherStatus=/^(?:Wetter für [^<>\r\n]{2,90} wird geladen …|Wetter · [^:<>\r\n]{2,90}: (?:-?[0-9]{1,2} °C · (?:Klar|Leicht bewölkt|Nebel|Regen|Schnee|Schauer|Schneeschauer|Gewitter)|derzeit nicht verfügbar))$/;
const dynamicResearchHits=/^Weitere [0-9]{1,4} Treffer anzeigen$/;
const terminologyReview=new Set([
 "Adab und Tazkiyah","Āthār und Ḥadīṯ","Fiqh und Uṣūl",
 "ʿAqīdah und Sunnah","ʿAqīdah und Widerlegungen",
 "Kufr und Ṭāghūt","Biografien und Āthār","Biografien und Tārīkh",
 "Wissen und Adab","Rijāl und Biografien","Tawḥīd & ʿAqīdah"
]);
function candidateCategory(label,routes){
 if(selfNames.has(label))return "language-name-preserve";
 if(preservedBrands.has(label))return "brand-or-signature-preserve";
 if(editorialFragments.has(label))return "editorial-fragment-review";
 if(runtimeShortDate.test(label))return "dynamic-runtime-covered";
 if(dynamicCityStatus.test(label))return "dynamic-runtime-covered";
 if(dynamicWeatherStatus.test(label)||dynamicResearchHits.test(label))return "dynamic-runtime-covered";
 if(runtimeNumeric.test(label))return "dynamic-runtime-covered";
 if(/^\d|\d{1,2}:\d{2}(?:\s|$)|\b\d{1,2}\.\d{1,2}\.\d{4}\b/.test(label))
  return "dynamic-value-review";
 if(terminologyReview.has(label))return "religious-taxonomy-review";
 const onlyContentRoutes=routes.length>0&&routes.every(route=>sourceOnlyRoutes.has(route));
 if(onlyContentRoutes)return "source-or-name-review";
 if((/^(?:Allah allein anbeten\.|Tawḥīd im Mittelpunkt\.|Muslim, Ṣaḥīḥ Muslim,)/.test(label))||
   (/^(?:Qurʾān · Sunnah|Folgt für mehr Wissen)/.test(label)&&label.length>45))
  return "editorial-copy-review";
 return "interface-review";
}
if(process.argv.includes("--self-test")){
 const assert=require("node:assert/strict");
 assert.equal(candidateCategory("Bosanski",["home","more"]),"language-name-preserve");
 assert.equal(candidateCategory("0 gemerkt",["quiz"]),"dynamic-runtime-covered");
 assert.equal(candidateCategory("0% Trefferquote",["quiz"]),"dynamic-runtime-covered");
 assert.equal(candidateCategory("5/5 gewählt",["settings"]),"dynamic-runtime-covered");
 assert.equal(candidateCategory("07:24 Uhr",["home"]),"dynamic-value-review");
 assert.equal(candidateCategory("109 Āyāt · Mekkanisch",["quran"]),"dynamic-runtime-covered");
 assert.equal(candidateCategory("114 Sūren · 6236 Āyāt",["quran"]),"dynamic-runtime-covered");
 assert.equal(candidateCategory("Tawḥīd, 24 Veröffentlichungen",["bibliothek"]),"dynamic-runtime-covered");
 assert.equal(candidateCategory("Sūrenbereich wechseln, aktuell 01–20",["quran"]),"dynamic-runtime-covered");
 assert.equal(candidateCategory("Duʿāʾ 09:00 · Empfehlung 12:00",["prayer"]),"dynamic-runtime-covered");
 assert.equal(candidateCategory("Do., 22.10.26",["home"]),"dynamic-runtime-covered");
 assert.equal(candidateCategory("Standort gespeichert: Bonn",["settings"]),"dynamic-runtime-covered");
 assert.equal(candidateCategory("Wetter für Bonn wird geladen …",["home"]),"dynamic-runtime-covered");
 assert.equal(candidateCategory("Wetter · Bonn: 18 °C · Leicht bewölkt",["home"]),"dynamic-runtime-covered");
 assert.equal(candidateCategory("Weitere 3 Treffer anzeigen",["search"]),"dynamic-runtime-covered");
 assert.equal(candidateCategory("Standort gespeichert: <script>",["settings"]),"interface-review");
 assert.equal(candidateCategory("Instagram",["home"]),"brand-or-signature-preserve");
 assert.equal(candidateCategory("by Serhat Abu Malik",["home"]),"brand-or-signature-preserve");
 assert.equal(candidateCategory("und den",["home"]),"editorial-fragment-review");
 assert.equal(candidateCategory("al-Adab al-Mufrad",["books"]),"source-or-name-review");
 assert.equal(candidateCategory("Aḍwāʾ al-Bayān öffnen",["books"]),"source-or-name-review");
 assert.equal(candidateCategory("Adab und Tazkiyah",["books"]),"religious-taxonomy-review");
 assert.equal(candidateCategory("Einstellungen öffnen",["settings"]),"interface-review");
 console.log("PASS: audit classifies language autonyms, numeric status, source titles and app UI separately");
}
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
 missing.push({de:row.de,routes:[...row.routes].sort(),missingLocales,reviewCategory:candidateCategory(row.de,[...row.routes]),candidateOnly:true});
}
missing.sort((a,b)=>b.routes.length-a.routes.length||a.de.localeCompare(b.de,"de"));
const coverage={};
for(const code of targets){
 const missingCount=missing.filter(item=>item.missingLocales.includes(code)).length;
 coverage[code]={checkedUiCandidates:unique.size,covered:unique.size-missingCount,
  missing:missingCount,percent:unique.size?
   Math.round((unique.size-missingCount)*10000/unique.size)/100:100};
}
const reviewCategoryCounts={};
for(const candidate of missing)
 reviewCategoryCounts[candidate.reviewCategory]=(reviewCategoryCounts[candidate.reviewCategory]||0)+1;
const reviewFirst=missing.filter(x=>x.reviewCategory==="interface-review").slice(0,45)
 .map(x=>({de:x.de,routes:x.routes}));
const report={schemaVersion:1,scope:"adult-test-ui-audit-not-publishing",
 sourceLocale:"de",registeredLanguages:Object.keys(registry.locales),
 scanSource:scanned?"15-route-browser-scan":"stored-Turkish-ui-candidate-index",
 scanRoutes:scanned?.routes||[],scanErrors:scanned?.errors||[],
 auditedCandidates:unique.size,fullyCoveredInAllTargetLocales:fullyCovered,
 languageCoverage:coverage,reviewCategoryCounts,reviewFirst,untranslatedCandidates:missing,
 notes:"Counts describe unmatched strings in the shared static UI pack, NOT a measured percentage of fully localized interface screens. Some are language autonyms, dynamic values, source titles or terms already handled by another runtime. Review each candidate as UI before adding translations. Qurʾān, ḥadīṯ, citations and authored posts must not be auto-translated. No paid provider is contacted."};
if(process.argv.includes("--write-report")){
 const output=path.join(__dirname,"qa/ui-gaps-nine.json");
 fs.mkdirSync(path.dirname(output),{recursive:true});
 fs.writeFileSync(output,JSON.stringify(report,null,2)+"\n");
 console.log("Wrote "+output);
}
// The full report is written to the runner only when explicitly requested.
if(process.argv.includes("--full"))console.log(JSON.stringify(report,null,2));
else console.log(JSON.stringify({scanSource:report.scanSource,scanRoutes:report.scanRoutes,
 auditedCandidates:report.auditedCandidates,fullyCoveredInAllTargetLocales:report.fullyCoveredInAllTargetLocales,
 catalogMissingCandidates:report.untranslatedCandidates.length,
 runtimeHandledDynamicCandidates:report.reviewCategoryCounts["dynamic-runtime-covered"]||0,
 reviewCategoryCounts:report.reviewCategoryCounts,
 reviewFirst:report.reviewFirst,scanErrors:report.scanErrors,notes:report.notes},null,2));
