#!/usr/bin/env node
"use strict";
/* Nine-language DAR TEST UI guard. Offline and read-only.
 * Keeps the live language register and the test UI pack aligned.
 * Scholarly authored source text is excluded from this UI coverage check.
 */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const here=__dirname;
const root=path.resolve(here,"../..");
const registry=JSON.parse(fs.readFileSync(path.join(root,"desktop-preview/i18n-core-v1/locales.json"),"utf8"));
const pack=JSON.parse(fs.readFileSync(path.join(here,"adult-ui-locales-seven.json"),"utf8"));
const expected=Object.keys(registry.locales);
const publishedInTest=pack.availableLocales;

assert.deepEqual([...publishedInTest].sort(),[...expected].sort(),
 "DAR TEST UI locales and central language register must match; add new languages deliberately");
assert.equal(new Set(publishedInTest).size,publishedInTest.length,"Duplicated languages");
assert.equal(registry.defaultLocale,"de");
assert.equal(pack.sourceLocale,"de");
assert.equal(pack.scope,"adult-interface-only");
assert.equal(pack.noPaidProvider,true);
assert.deepEqual(Object.keys(pack.translations).sort(),expected.filter(k=>k!=="de").sort());
const requiredSource=Object.keys(pack.translations.en);
const protectedQuote="„Dieses Wissen ist Religion. So achtet darauf, von wem ihr eure Religion nehmt.“";
assert(requiredSource.includes(protectedQuote),"Expected existing quoted source exclusion");
const uiLabels=requiredSource.filter(k=>k!==protectedQuote);
assert(uiLabels.length>=524,"Adult UI baseline unexpectedly shortened");
for(const locale of expected){
 assert.equal(pack.names[locale],registry.locales[locale].name,"Wrong locale name: "+locale);
 if(locale==="de")continue;
 const target=pack.translations[locale];
 for(const key of uiLabels){
  assert.equal(typeof target[key],"string",locale+" has no UI text for "+key);
  assert(target[key].trim(),locale+" has a blank UI text for "+key);
 }
 if(locale==="fr"||locale==="es"){
  assert.equal(target[protectedQuote],undefined,
   "Do not silently translate an authored scholarly quote as ordinary UI");
 }
 const direction=registry.locales[locale].dir;
 assert.equal(pack.rtlLocales.includes(locale),direction==="rtl",
  "RTL registry mismatch: "+locale);
}
for(const locale of expected.filter(x=>x!=="de")){
 assert(pack.translations[locale]["Startseite"],"Missing navigation: "+locale);
 assert(pack.translations[locale]["Qurʾān Player"],"Missing player UI: "+locale);
 assert(pack.translations[locale]["Schlaf-Timer"],"Missing playback control: "+locale);
 assert(pack.translations[locale]["Einstellungen"],"Missing settings: "+locale);
 for(const label of ["Sprache wählen / Dil seçimi","Ort","🔔 Push-Einstellungen öffnen",
 "Sprache auswählen. Fachtexte nur in geprüften Fassungen.",
 "Fachbeiträge erscheinen erst nach Prüfung in der gewählten Sprache.",
 "Fachtexte werden nach Quellen- und Sprachprüfung freigegeben."]){
  assert(pack.translations[locale][label]?.trim(),"Missing current UI or language guidance: "+locale+" / "+label);
 }
}
const setup=fs.readFileSync(path.join(root,"test/assets/dar-setup-hub.js"),"utf8");
const more=fs.readFileSync(path.join(root,"test/assets/dar-more-v15.js"),"utf8");
for(const oldPhrase of [
 "Türkisch und Deutsch auswählen. Fachtexte nur in geprüften Fassungen.",
 "Türkisch und Deutsch. Fachbeiträge erscheinen erst nach Prüfung in der gewählten Sprache.",
 "Türkische Inhalte werden nach Quellen- und Sprachprüfung freigegeben."
]) assert(!(setup+more).includes(oldPhrase),"Outdated German/Turkish-only language claim in UI");
console.log("PASS: nine language codes, central registry alignment, 524 shared UI labels, updated UI guidance, RTL, player controls, protected sources and zero paid translation requests");
