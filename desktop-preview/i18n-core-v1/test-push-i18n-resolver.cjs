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
    title: "T-" + code + " {minutes}", body: "B-" + code + " {time}"}
]));
const baseEvent = {
  type: "prayer", eventKey: "2026-10-22|Europe/Berlin|fajr|advance|05:30",
  prayerKey: "fajr", mode: "advance", minutes: 10, time: "05:30"
};
const postEvent = {
  type: "new_post", eventKey: "post:readable-article|revision-1",
  contentId: "post:readable-article", qNumber: 271
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
      subscription: {subscription_id: "sub-" + locale, app_locale: locale, os_locale:"de"}
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
    subscription:{subscriptionId:"recipient",appLocale:"fr"}
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
    copies:versioned, subscription:{subscription_id:"s",app_locale:"fr"}
  });
  assert.equal(msg.copyLocale,"de");
  assert.equal(msg.fallback,true);
  const approved = resolveRecipientPush({
    event:{...postEvent,sourceHash:"new-revision"},
    copies:{...versioned,fr:{...versioned.fr,sourceHash:"new-revision"}},
    subscription:{subscription_id:"s",app_locale:"fr"}
  });
  assert.equal(approved.copyLocale,"fr");
});

test("deduplicate by subscription; retry/language change does not resend", () => {
  const p = buildPreview({
    event:baseEvent,copies,
    registrations:[
      {subscription_id:"same",app_locale:"fr"},
      {subscription_id:"same",app_locale:"en"},
      {subscription_id:"other",app_locale:"es"}
    ]
  });
  assert.equal(p.sent,false);
  assert.equal(p.uniqueRecipients,2);
  assert.equal(p.messages[0].copyLocale,"fr");
  assert.equal(p.messages[1].copyLocale,"es");
  const first = resolveRecipientPush({event:baseEvent,copies,subscription:{subscription_id:"same",app_locale:"fr"}});
  const switched = resolveRecipientPush({event:baseEvent,copies,subscription:{subscription_id:"same",app_locale:"en"}});
  assert.equal(first.payload.idempotency_key,switched.payload.idempotency_key);
  assert.match(first.payload.idempotency_key,/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-a[0-9a-f]{3}-[0-9a-f]{12}$/);
});

test("one content ID and URL independent of 9 translations", () => {
  const fr = resolveRecipientPush({event:postEvent,copies,subscription:{subscription_id:"one",app_locale:"fr"}});
  const es = resolveRecipientPush({event:postEvent,copies,subscription:{subscription_id:"two",app_locale:"es"}});
  assert.equal(fr.payload.data.content_id,postEvent.contentId);
  assert.equal(fr.payload.data.q_number,271);
  assert.equal(fr.payload.url,es.payload.url);
  assert.equal(fr.payload.url,"https://dar-al-tawhid.de/#post/post%3Areadable-article");
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
    event:{...baseEvent,minutes:1573},copies,subscription:{subscription_id:"x"}
  }),/Invalid advance/);
  assert.throws(() => resolveRecipientPush({
    event:{type:"daily_dua",eventKey:"2026-10-22"},
    copies,subscription:{subscription_id:"x"}
  }),/contentId/);
  assert.throws(() => resolveRecipientPush({
    event:baseEvent,copies:{fr:{status:"draft",title:"draft",body:"draft"}},
    subscription:{subscription_id:"x",appLocale:"fr"}
  }),/No approved/);
});
