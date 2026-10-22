#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs");
const draft=JSON.parse(fs.readFileSync("test/i18n/adult-ui-fr-es-navigation-drafts.json","utf8"));
const catalog=JSON.parse(fs.readFileSync("desktop-preview/i18n-core-v1/locales.json","utf8"));
const released=JSON.parse(fs.readFileSync("test/i18n/adult-ui-locales-seven.json","utf8"));
assert.equal(draft.scope,"adult-test-navigation-drafts-only");
assert.equal(draft.availableForSelection,false);
assert.equal(draft.noPaidProvider,true);
assert.equal(draft.excludesCanonicalContent,true);
assert.deepEqual(draft.locales,["fr","es"]);
for(const locale of draft.locales){
 const original=catalog.locales.de.messages,target=catalog.locales[locale].messages;
 const items=draft.translations[locale]||{};
 assert.equal(Object.keys(items).length,39,locale+" navigation coverage changed unexpectedly");
 assert.notEqual(catalog.locales[locale].uiAvailability,"navigation_preview","Unreviewed FR/ES must not be released");
 for(const [key,german] of Object.entries(original)){
  assert.equal(items[german],target[key],locale+" source alignment "+key);
  assert.ok(items[german].trim());
 }
 assert.equal(released.availableLocales.includes(locale),false,"Unreviewed locale cannot be active");
}
console.log("PASS staged FR/ES: 39 existing navigation drafts per language, not released");
