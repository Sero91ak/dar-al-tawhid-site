#!/usr/bin/env node
/** Read-only coverage inventory for desktop, adult TEST and public visitor/PWA UI.
 * Counts phrases only, not verified complete pages or religious content.
 */
"use strict";
const fs=require("node:fs");
const data=p=>JSON.parse(fs.readFileSync(p,"utf8"));
const locales=data("desktop-preview/i18n-core-v1/locales.json").locales;
const test=data("test/i18n/adult-ui-locales-seven.json").translations;
const publicTr=data("assets/i18n/adult-ui-de-tr.json").entries;
const codes=Object.keys(locales),testKeys=Object.keys(test.tr||{}),publicKeys=Object.keys(publicTr||{});
const union=new Set([...testKeys,...publicKeys]);
const onlyTest=testKeys.filter(k=>!Object.hasOwn(publicTr,k)),onlyPublic=publicKeys.filter(k=>!Object.hasOwn(test.tr||{},k));
const rows=codes.map(code=>({
 code,language:locales[code].name,desktopNavigationKeys:Object.keys(locales[code].messages||{}).length,
 navigationStatus:locales[code].uiAvailability||"unreleased",
 testUIPhrases:code==="de"?null:Object.keys(test[code]||{}).length,
 publicVisitorUIPhrases:code==="de"?null:code==="tr"?publicKeys.length:0,
 publicPublishedLanguage:code==="de"||code==="tr",
 totalPageCoverageVerified:false,
 religiousEditorialTranslationReleased:false
}));
if(codes.length!==9||!codes.every(x=>rows.find(r=>r.code===x)))throw Error("Invalid 9-language registry");
if(rows.some(r=>r.desktopNavigationKeys<30))throw Error("Desktop core language entries missing");
if(!rows.find(r=>r.code==="fr"&&r.navigationStatus==="coming_soon")||
   !rows.find(r=>r.code==="es"&&r.navigationStatus==="coming_soon"))
  throw Error("Unreviewed FR/ES must remain disabled");
const report={
 timestamp:"2026-10-22",scope:"adult UI only – counts do not certify full localization",
 registeredLocales:codes,uniqueGermanUIStringsAcrossTestAndVisitor:union.size,
 testCommonGermanUIStrings:testKeys.length,publicTurkishGermanUIStrings:publicKeys.length,
 overlappingGermanUIStrings:testKeys.length-onlyTest.length,
 missingPublicTurkishFromTest:onlyTest.length,missingTestTurkishFromPublic:onlyPublic.length,
 missingPublicExamples:onlyTest.slice(0,25),missingTestExamples:onlyPublic.slice(0,15),languages:rows,
 editorialGate:"Canonical Qurʾān, Ḥadīṯ, Duʿāʾ, sources and authored articles must be reviewed separately."
};
console.log(JSON.stringify(report,null,2));
if(process.env.GITHUB_STEP_SUMMARY){
 const lines=["## Neun-Sprachen-Abdeckung – Erwachsenen-UI",
  "Registriert: **"+codes.length+"**. Achtung: Texteinträge sind kein Nachweis vollständiger Unterseiten.",
  "| Sprache | Desktop-Schlüssel | Test-UI | Besucher-UI | Auswahl |",
  "|---|---:|---:|---:|---|",
  ...rows.map(r=>"| "+r.language+" | "+r.desktopNavigationKeys+" | "+(r.testUIPhrases??"Original")+" | "+(r.publicVisitorUIPhrases??"Original")+" | "+r.navigationStatus+" |"),
  "Gemeinsame Test-/Besucher-Phrasen: **"+report.overlappingGermanUIStrings+"**. Nur Test: **"+onlyTest.length+"**. Nur Besucher: **"+onlyPublic.length+"**.",
  "Keine ungeprüften religiösen Inhalte veröffentlichen."
 ];
 fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,lines.join("\n")+"\n");
}
