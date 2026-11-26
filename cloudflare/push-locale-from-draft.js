/**
 * Locale maps for adult pushes from the already approved draft.
 * Does not schedule, calculate prayer times, opt in, or send.
 * ku/ckb stay out of the OneSignal language map. Recipients with those
 * app languages keep language=de and the tag dar_app_locale.
 */
import draft from "../desktop-preview/i18n-core-v1/push-copy-nine-languages-draft.json" with { type: "json" };
import { dailyMessage, prayerMessage } from "./push-nine-language-copy.js";

export function withEnglishFallback(map) {
  const headings = { ...(map?.headings || {}) };
  const contents = { ...(map?.contents || {}) };
  const deHeading = headings.de || headings.en || "";
  const deContent = contents.de || contents.en || "";
  if (!headings.de) headings.de = deHeading;
  if (!contents.de) contents.de = deContent;
  if (!headings.en) headings.en = headings.de;
  if (!contents.en) contents.en = contents.de;
  return { headings, contents };
}

export function prayerLocaleCopy(prayerKey, mode, advanceMinutes, time) {
  return withEnglishFallback(prayerMessage(draft, prayerKey, mode, advanceMinutes, time));
}

export function dailyLocaleCopy(kind) {
  return withEnglishFallback(dailyMessage(draft, kind));
}

export function assertSingleTestSubscription(ids) {
  const list = [...new Set((Array.isArray(ids) ? ids : []).map((id) => String(id || "").trim()).filter(Boolean))];
  if (list.length !== 1) {
    throw new Error("Push-Sprachtest erlaubt genau eine Subscription und keinen Broadcast");
  }
  return list[0];
}
