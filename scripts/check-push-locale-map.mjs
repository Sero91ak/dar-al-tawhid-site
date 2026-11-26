import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { assertSingleTestSubscription, dailyLocaleCopy, dailyIndividualTitle, prayerLocaleCopy, prayerIndividualCopy } from "../cloudflare/push-locale-from-draft.js";
import { jummahLocale, jummahIndividual, localizedNotification, chromePack, individualChrome } from "../cloudflare/push-locale-chrome.js";
import { localesFromUsers, localeDeliveryBody, partitionSubscriptionIds } from "../cloudflare/push-app-locale-delivery.js";
import { prayerTestLocaleCopy } from "../cloudflare/prayer-push-admin.js";

const prayer = prayerLocaleCopy("fajr", "entry", 15, "05:12");
assert.equal(typeof prayer.headings.en, "string");
assert.equal(typeof prayer.headings.de, "string");
assert.ok(prayer.headings.en.length > 0);
assert.ok(prayer.contents.en.length > 0);
assert.equal(prayer.included_segments, undefined);
for (const code of ["de", "en", "tr", "ar", "bs", "fr", "es"]) {
  assert.ok(prayer.headings[code], "missing heading " + code);
  assert.ok(prayer.contents[code], "missing content " + code);
}
assert.equal(prayer.headings.ku, undefined);
assert.equal(prayer.headings.ckb, undefined);

const daily = dailyLocaleCopy("daily_dua");
assert.ok(daily.headings.en && daily.headings.de && daily.contents.en);

assert.throws(() => assertSingleTestSubscription([]));
assert.throws(() => assertSingleTestSubscription(["a", "b"]));
assert.equal(assertSingleTestSubscription(["test-subscription"]), "test-subscription");

for (const name of ["quiz", "prophets", "zakat", "libraryFocus", "libraryPdf", "news", "welcome"]) {
  const pack = chromePack(name);
  for (const part of [pack.title, pack.body].filter(Boolean)) {
    assert.ok(part.en && part.de, name);
  }
}
const jummah = jummahLocale("morning", { title: "x", body: "y" });
assert.ok(jummah.headings.en.startsWith("🕌"));
assert.equal(jummah.headings.ku, undefined);
const same = localizedNotification("Titel", "Text", null, null);
assert.equal(same.contents.en, "Text");
assert.equal(same.headings.ar, "Titel");

const ku = prayerIndividualCopy("ku", "fajr", "entry", 15, "05:12");
assert.equal(ku.headings.de, ku.headings.en);
assert.ok(ku.headings.en.includes("Fajr"));
assert.equal(ku.headings.tr, undefined);
assert.equal(prayerIndividualCopy("en", "fajr", "entry", 15, "05:12"), null);
const ckbTitle = dailyIndividualTitle("ckb", "daily_dua");
assert.ok(ckbTitle.length > 0);
const sets = localesFromUsers([{ properties: { tags: { dar_app_locale: "ku" } }, subscriptions: [{ id: "ku-1" }] }, { properties: { tags: { dar_app_locale: "ckb" } }, subscriptions: [{ id: "ckb-1" }] }]);
const parts = partitionSubscriptionIds(["ku-1", "plain", "ckb-1", "ku-1"], sets);
assert.deepEqual(parts.map((part) => part.locale), [null, "ku", "ckb"]);
assert.deepEqual(parts[0].ids, ["plain"]);
assert.deepEqual(parts[1].ids, ["ku-1", "ku-1"]);
const sibling = localeDeliveryBody({ include_subscription_ids: ["ku-1", "plain"], headings: { de: "A" }, name: "prayer-main" }, {
  ids: ["ku-1"], headings: ku.headings, contents: ku.contents, name: "prayer-main-ku", key: "locale-key"
});
assert.deepEqual(sibling.include_subscription_ids, ["ku-1"]);
assert.equal(sibling.idempotency_key, "locale-key");
assert.notEqual(sibling.name, "prayer-main");
const jummahKu = jummahIndividual("ku", "morning");
assert.ok(jummahKu.headings.en.startsWith("🕌"));
assert.ok(individualChrome("welcome", "ckb").body.length > 0);
const adminKu = prayerTestLocaleCopy("maghrib", "entry", 15, "ku");
assert.equal(adminKu.headings.de, adminKu.headings.en);
const adminDe = prayerTestLocaleCopy("maghrib", "entry", 15, "");
assert.ok(adminDe.headings.en && adminDe.headings.ar);

const forbidden = /latitude|longitude|\bgeolocation\b|\bqibla\b|included_segments|idempotency_key|idempotencyKey|computePublicPrayerTimes|\basrFactor\b|\bfajrAngle\b|locationGranted|CLLocation|requestGeolocation|\bsunTime\b|tzOffset|ADVANCE_COPY_VERSION|DAILY_PUSH_ID_VERSION|\bcron\b/;
const diff = execFileSync("git", ["diff", "-U0", "origin/main", "--",
  "cloudflare",
  "ios/DarAlTawhid/DarAlTawhid/DarPushNotifications.swift",
  "ios/DarAlTawhid/DarAlTawhid/WebAppView.swift",
  "android",
  "scripts/send-news-push.js",
  "scripts/send-quiz-focus-push.js",
  "scripts/send-prophets-focus-push.js",
  "scripts/send-zakat-focus-push.js",
  "scripts/send-library-publication-push.js",
  "scripts/send-library-focus-push.js",
  "scripts/send-daily-content-push.js",
  "scripts/send-daily-live-repair.js",
  "scripts/send-post-push.js",
  "scripts/push-locale-chrome.cjs"
], { encoding: "utf8" });
let file = "";
const bad = [];
for (const line of diff.split("\n")) {
  if (line.startsWith("+++ b/")) file = line.slice(6);
  if (!/^[+](?![+])/.test(line) || !forbidden.test(line)) continue;
  const localeKeyOnly = file.endsWith("cloudflare/push-app-locale-delivery.js") && /idempotency_key/.test(line);
  if (localeKeyOnly) continue;
  bad.push(file + " " + line);
}
assert.deepEqual(bad, [], bad.join("\n"));
const names = execFileSync("git", ["diff", "--name-only", "origin/main"], { encoding: "utf8" });
assert.equal(names.split("\n").some((file) => file.startsWith("kids/")), false);

console.log("OK push locale map: en key present, ku/ckb omitted, single-subscription guard holds, no prayer-math/segment/idempotency/kids diff, no send");
