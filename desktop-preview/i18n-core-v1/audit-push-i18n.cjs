#!/usr/bin/env node
"use strict";
/**
 * Read-only audit of the DĀR APP OneSignal draft inventory.
 * A new registry language becomes a missing translation task automatically.
 * NEVER creates, updates or sends an actual OneSignal notification.
 */
const fs=require("node:fs");
const path=require("node:path");
const {localeCodes}=require("./push-i18n-resolver.cjs");
const registry=require("./locales.json");
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,"onesignal-nine-language-drafts.json"),"utf8"));
const manuscripts=JSON.parse(fs.readFileSync(path.join(__dirname,"push-copy-nine-languages-draft.json"),"utf8"));
const expected=[
  ...["fajr","dhuhr","asr","maghrib","isha"].flatMap(key=>["prayer_"+key+"_entry","prayer_"+key+"_advance"]),
  "prayer_tahajjud_entry",
  "daily_dua","daily_recommendation","daily_ayah","new_post"
];
const codes=localeCodes(registry);
const snapshot=manifest.snapshotLocales||[];
const templates=manifest.templates||{};
const missingTemplateKeys=expected.filter(k=>!templates[k]);
const unknownTemplateKeys=Object.keys(templates).filter(k=>!expected.includes(k));
const missingLanguageReviews=codes.filter(c=>!snapshot.includes(c));
const retiredLanguages=snapshot.filter(c=>!codes.includes(c));
const duplicateTemplateIds=Object.values(templates)
  .map(v=>String(v.id||"")).filter((id,i,a)=>!id||a.indexOf(id)!==i);
const manuscriptPairs=Object.values(manuscripts.copy||{}).reduce((sum,messages)=>sum+Object.keys(messages).length,0);
const missingManuscripts=codes.flatMap(code=>
 expected.filter(key=>!manuscripts.copy?.[code]?.[key]).map(key=>code+":"+key));
const unreviewedManuscripts=codes.flatMap(code=>
 expected.filter(key=>manuscripts.copy?.[code]?.[key]?.status!=="approved").map(key=>code+":"+key));
const report={
  kind:"DĀR OneSignal editorial-only template audit",
  actualRegisteredLocales:codes,
  catalogCount:codes.length,
  expectedTemplates:expected.length,
  registeredTemplates:Object.keys(templates).length,
  missingTemplateKeys,
  unknownTemplateKeys,
  missingLanguageReviews,
  retiredLanguages,
  duplicateTemplateIds,
  manuscriptPairs,
  missingManuscripts,
  unreviewedManuscripts,
  approvedManuscripts:manuscriptPairs-unreviewedManuscripts.length,
  templatesRequireReview:Object.entries(templates)
    .filter(([,v])=>v.reviewState!=="approved").map(([k])=>k),
  safeToActivate:false,
  nonSending:true,
  note:"Neither copied text nor its OneSignal publication status is verified by this offline audit."
};
process.stdout.write(JSON.stringify(report,null,2)+"\n");
if(missingTemplateKeys.length||unknownTemplateKeys.length||duplicateTemplateIds.length||missingManuscripts.length)process.exitCode=1;
