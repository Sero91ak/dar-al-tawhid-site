#!/usr/bin/env node
"use strict";
/*
 * End-to-end offline fixture: 9 simulated consented TEST subscriptions.
 * In-memory APPROVED statuses are a TEST FIXTURE ONLY and are NEVER
 * written to the manuscript file, OneSignal or Supabase.
 */
const assert=require("node:assert/strict");
const {localeCodes,buildPreview}=require("./push-i18n-resolver.cjs");
const manuscripts=require("./push-copy-nine-languages-draft.json");
const registry=require("./locales.json");
const languages=localeCodes(registry);
const event={type:"prayer",eventKey:"fixture-only|fajr|advance|06:15|10",
  environment:"test",prayerKey:"fajr",mode:"advance",time:"06:15",minutes:10};
const copies=Object.fromEntries(languages.map(code=>{
 const draft=manuscripts.copy[code].prayer_fajr_advance;
 return [code,{title:draft.title,body:draft.body,status:"approved"}];
}));
const registrations=languages.map((code,i)=>({
 subscription_id:"TEST_ONLY_SYNTHETIC_"+String(i).padStart(2,"0"),
 app_locale:code, enabled:true,push_opted_in:true,app_environment:"test"
}));
const report=buildPreview({event,copies,registrations,registry});
assert.equal(report.dryRun,true);
assert.equal(report.sent,false);
assert.equal(report.uniqueRecipients,languages.length);
assert.equal(report.fallbackCount,0);
assert.deepEqual(report.messages.map(m=>m.copyLocale),languages);
assert.equal(new Set(report.messages.map(m=>m.payload.idempotency_key)).size,languages.length);
assert.equal(report.messages.every(m=>m.payload.contents.en.includes("10") &&
  m.payload.contents.en.includes("06:15")),true);
assert.equal(report.messages.every(m=>m.payload.url==="https://dar-al-tawhid.de/#prayer"),true);
const redact=report.messages.map(m=>({locale:m.copyLocale,
 title:m.payload.headings.en,body:m.payload.contents.en}));
process.stdout.write(JSON.stringify({
 dryRun:true,productionSending:false,mode:"isolated-fixture",
 syntheticSubscriptions:registrations.length,localeCount:languages.length,
 uniquenessVerified:true,duplicateRecipientCount:0,
 syntheticApprovedInMemoryOnly:true,liveTemplatesStillDraft:true,
 examples:redact
},null,2)+"\n");
