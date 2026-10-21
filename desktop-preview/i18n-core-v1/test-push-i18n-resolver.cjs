#!/usr/bin/env node
"use strict";
/**
 * Offline fixtures. No OneSignal API, credentials, subscriptions or push sends.
 * Run: node desktop-preview/i18n-core-v1/test-push-i18n-resolver.cjs
 */
const assert = require("node:assert/strict");
const test = require("node:test");
const {localeCodes, normalizeAppLocale, appLocaleTagPatch,
  resolvePushCopy, resolveRecipientPush, buildPreview} = require("./push-i18n-resolver.cjs");
const registry = require("./locales.json");

const copies = Object.fromEntries(localeCodes(registry).map((code) => [
  code, {status: code === "de" ? "canonical" : "approved",
    title: "T-" + code + " {minutes}", body: "B-" + code + " {time}",sourceHash:"sha-1"}
]));
const baseEvent = {
  type: "prayer", eventKey: "2026-10-22|Europe/Berlin|fajr|advance|05:30",
  prayerKey: "fajr", mode: "advance", minutes: 10, time: "05:30", environment:"test"
};
const postEvent = {
  type: "new_post", eventKey: "post:readable-article|revision-1",
  contentId: "post:readable-article", qNumber: 271, sourceHash:"sha-1", environment:"test"
};

test("nine adult languages, Arabic and Soranî RTL", () => {
  assert.equal(localeCodes(registry).length, 9);
  assert.equal(registry.locales.ar.dir, "rtl");
  assert.equal(registry.locales.ckb.dir, "rtl");
  assert.equal(normalizeAppLocale("fr-FR"), "fr");
  assert.equal(normalizeAppLocale("es_ES"), "es");
  assert.equal(normalizeAppLocale("ckb"), "ckb");
  assert.deepEqual(appLocaleTagPatch("ku"), {dar_app_locale:"ku"});
});

test("each explicitly chosen app language is resolved, not OS language", () => {
  for (const locale of localeCodes(registry)) {
    const m = resolveRecipientPush({
      event: baseEvent, copies,
      subscription:{push_opted_in:true,enabled:true,app_environment:"test",subscription_id: "sub-" + locale, app_locale: locale, os_locale:"de"}
    });
    assert.equal(m.appLocale, locale);
    assert.equal(m.copyLocale, locale);
    assert.equal(m.fallback, false);
    assert.equal(m.payload.contents.en, "B-" + locale + " 05:30");
    assert.deepEqual(m.payload.include_subscription_ids, ["sub-" + locale]);
  }
});

test("approved fallback never publishes unreviewed text", () => {
  const restricted = {...copies, fr:{status:"draft", title:"DO NOT SEND", body:"DO NOT SEND"}};
  const m = resolveRecipientPush({
    event: baseEvent, copies:restricted,
    subscription:{push_opted_in:true,enabled:true,app_environment:"test",subscriptionId:"recipient",appLocale:"fr"}
  });
  assert.equal(m.fallback,true);
  assert.equal(m.copyLocale,"de");
  assert.equal(m.payload.contents.en,"B-de 05:30");
  assert.notEqual(m.payload.headings.en, "DO NOT SEND");
});

test("stale source hash blocks translation even when marked approved", () => {
  const versioned = {
    ...copies,
    de:{...copies.de,sourceHash:"new-revision"},
    fr:{...copies.fr,sourceHash:"old-revision"}
  };
  const msg = resolveRecipientPush({
    event:{...postEvent,sourceHash:"new-revision"},
    copies:versioned, subscription:{push_opted_in:true,enabled:true,app_environment:"test",subscription_id:"s",app_locale:"fr"}
  });
  assert.equal(msg.copyLocale,"de");
  assert.equal(msg.fallback,true);
  const approved = resolveRecipientPush({
    event:{...postEvent,sourceHash:"new-revision"},
    copies:{...versioned,fr:{...versioned.fr,sourceHash:"new-revision"}},
    subscription:{push_opted_in:true,enabled:true,app_environment:"test",subscription_id:"s",app_locale:"fr"}
  });
  assert.equal(approved.copyLocale,"fr");
});

test("deduplicate by subscription; retry/language change does not resend", () => {
  const p = buildPreview({
    event:baseEvent,copies,
    registrations:[
      {subscription_id:"same",push_opted_in:true,enabled:true,app_environment:"test",app_locale:"fr"},
      {subscription_id:"same",push_opted_in:true,enabled:true,app_environment:"test",app_locale:"en"},
      {subscription_id:"other",push_opted_in:true,enabled:true,app_environment:"test",app_locale:"es"}
    ]
  });
  assert.equal(p.sent,false);
  assert.equal(p.uniqueRecipients,2);
  assert.equal(p.messages[0].copyLocale,"fr");
  assert.equal(p.messages[1].copyLocale,"es");
  const first = resolveRecipientPush({event:baseEvent,copies,subscription:{push_opted_in:true,enabled:true,app_environment:"test",subscription_id:"same",app_locale:"fr"}});
  const switched = resolveRecipientPush({event:baseEvent,copies,subscription:{push_opted_in:true,enabled:true,app_environment:"test",subscription_id:"same",app_locale:"en"}});
  assert.equal(first.payload.idempotency_key,switched.payload.idempotency_key);
  assert.match(first.payload.idempotency_key,/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-a[0-9a-f]{3}-[0-9a-f]{12}$/);
});

test("privacy and lane isolation fail closed", () => {
  const base={subscription_id:"approved-recipient",push_opted_in:true,enabled:true,app_environment:"test",app_locale:"en"};
  const attempt=(subscription,event=baseEvent)=>resolveRecipientPush({event,copies,subscription});
  assert.throws(()=>attempt({...base,push_opted_in:false}),/opt-in/);
  assert.throws(()=>attempt({...base,enabled:false}),/opt-in/);
  assert.throws(()=>attempt({...base,app_environment:"production"}),/environment mismatch/);
  assert.throws(()=>attempt(base,{...baseEvent,environment:""}),/target environment/);
  assert.throws(()=>attempt(base,{...baseEvent,environment:"production"}),/environment mismatch/);
  assert.throws(()=>attempt(base,{type:"daily_dua",contentId:"dua:1",sourceHash:"sha-1",eventKey:"daily|2026-10-22",environment:"test"}),/not enabled/);
  const daily=attempt({...base,daily_dua_enabled:true},{type:"daily_dua",contentId:"dua:1",sourceHash:"sha-1",eventKey:"daily|2026-10-22",environment:"test"});
  assert.match(daily.payload.url,/#dua/);
  assert.throws(()=>attempt(base,{type:"daily_recommendation",contentId:"post:2",sourceHash:"sha-1",eventKey:"daily|2026-10-22",environment:"test"}),/not enabled/);
});

test("one content ID and URL independent of 9 translations", () => {
  const fr = resolveRecipientPush({event:postEvent,copies,subscription:{push_opted_in:true,enabled:true,app_environment:"test",subscription_id:"one",app_locale:"fr"}});
  const es = resolveRecipientPush({event:postEvent,copies,subscription:{push_opted_in:true,enabled:true,app_environment:"test",subscription_id:"two",app_locale:"es"}});
  assert.equal(fr.payload.data.content_id,postEvent.contentId);
  assert.equal(fr.payload.data.q_number,271);
  assert.equal(fr.payload.data.source_url,"https://dar-al-tawhid.de/q/271/");
  assert.equal(fr.payload.data.source_url,es.payload.data.source_url);
  assert.equal(fr.payload.url,es.payload.url);
  assert.equal(fr.payload.url,"https://dar-al-tawhid.de/#post/post%3Areadable-article");
});

test("source revision, independent Āyah opt-in and exact target time",()=>{
 const subscription={subscription_id:"s",app_locale:"en",push_opted_in:true,enabled:true,app_environment:"test"};
 const attempt=(event)=>resolveRecipientPush({event,copies,subscription});
 assert.throws(()=>attempt({...postEvent,sourceHash:""}),/source revision/);
 assert.throws(()=>attempt({...baseEvent,time:"unknown"}),/HH:MM/);
 assert.throws(()=>attempt({type:"daily_ayah",contentId:"ayah:1",sourceHash:"sha-1",
  eventKey:"ayah|2026-10-22",environment:"test"}),/verified destination/);
});

test("new 10th language is automatically accepted from registry", () => {
  const extended = { ...registry,
    locales:{...registry.locales,it:{name:"Italiano",dir:"ltr",messages:{}}}
  };
  const m = resolvePushCopy({
    registry:extended,copies:{...copies,it:{status:"approved",title:"Preghiera",body:"Ora"}},
    appLocale:"it"
  });
  assert.equal(localeCodes(extended).length,10);
  assert.equal(m.title,"Preghiera");
  assert.equal(m.fallback,false);
});

test("invalid prayer windows and missing IDs fail closed", () => {
  assert.throws(() => resolveRecipientPush({
    event:{...baseEvent,minutes:1573},copies,subscription:{push_opted_in:true,enabled:true,app_environment:"test",subscription_id:"x"}
  }),/Invalid advance/);
  assert.throws(() => resolveRecipientPush({
    event:{type:"daily_dua",eventKey:"2026-10-22"},
    copies,subscription:{push_opted_in:true,enabled:true,app_environment:"test",subscription_id:"x"}
  }),/contentId/);
  assert.throws(() => resolveRecipientPush({
    event:baseEvent,copies:{fr:{status:"draft",title:"draft",body:"draft"}},
    subscription:{push_opted_in:true,enabled:true,app_environment:"test",subscription_id:"x",appLocale:"fr"}
  }),/No approved/);
});
