import assert from "node:assert/strict";
import { assertSingleTestSubscription, dailyLocaleCopy, prayerLocaleCopy } from "../cloudflare/push-locale-from-draft.js";

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

console.log("OK push locale map: en key present, ku/ckb omitted, single-subscription guard holds, no send");
