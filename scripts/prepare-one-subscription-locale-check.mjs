/**
 * Builds one prayer-push payload for a single subscription.
 * Does not call OneSignal and does not send.
 * Usage: node scripts/prepare-one-subscription-locale-check.mjs <subscription-id> [ku|ckb|de]
 */
import { assertSingleTestSubscription, prayerIndividualCopy, prayerLocaleCopy } from "../cloudflare/push-locale-from-draft.js";

const id = String(process.argv[2] || process.env.DAR_TEST_SUBSCRIPTION_ID || "").trim();
if (!id) {
  console.error("Keine Subscription-ID. Aufruf: node scripts/prepare-one-subscription-locale-check.mjs <id> [ku|ckb|de]");
  process.exit(1);
}
const subscriptionId = assertSingleTestSubscription([id]);
const locale = String(process.argv[3] || "ku").toLowerCase();
const copy = locale === "ku" || locale === "ckb"
  ? prayerIndividualCopy(locale, "fajr", "entry", 15, "05:12")
  : prayerLocaleCopy("fajr", "entry", 15, "05:12");
const payload = {
  include_subscription_ids: [subscriptionId],
  headings: copy.headings,
  contents: copy.contents
};
if (payload.included_segments || payload.include_subscription_ids.length !== 1) {
  throw new Error("Einzeltest ist kein Broadcast");
}
console.log(JSON.stringify(payload, null, 2));
