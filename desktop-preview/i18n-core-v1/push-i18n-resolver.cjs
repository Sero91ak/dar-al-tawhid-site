"use strict";
/**
 * DĀR Zentrum: read-only push locale resolver / NOT a production sender.
 * No OneSignal calls, timers, geo changes, subscriptions or publishing.
 * This isolated module is activated only after the protected push lanes
 * have separately passed the owner's password/approval gates.
 */
const crypto = require("node:crypto");
const registryDefault = require("./locales.json");

function localeCodes(registry = registryDefault) {
  if (!registry || !registry.locales || typeof registry.locales !== "object") {
    throw new Error("Missing central locale registry");
  }
  const codes = Object.keys(registry.locales);
  if (!codes.includes(registry.defaultLocale)) {
    throw new Error("Locale registry has no defaultLocale");
  }
  return codes;
}

function normalizeAppLocale(value, registry = registryDefault) {
  const codes = localeCodes(registry);
  const input = String(value || "").trim().toLowerCase().replace(/_/g, "-");
  if (codes.includes(input)) return input;
  // BCP-47 variants are allowed only when their base is registered.
  const base = input.split("-")[0];
  return codes.includes(base) ? base : registry.defaultLocale;
}

/**
 * Only the explicit APP preference counts. Never use OneSignal/OS
 * language as the requested language after an in-app selection.
 */
function appLocaleRecord(subscriptionId, appLocale, registry = registryDefault) {
  const id = String(subscriptionId || "").trim();
  if (!id) throw new Error("Subscription ID required");
  // NOT a OneSignal.User tag, which can be shared across devices.
  return { subscription_id: id, app_locale: normalizeAppLocale(appLocale, registry) };
}

function approvedCopy(copies, code, registry, expectedHash = "") {
  if (!localeCodes(registry).includes(code)) return null;
  const item = copies && copies[code];
  if (!item || typeof item !== "object") return null;
  if (expectedHash && String(item.sourceHash || "") !== expectedHash) return null;
  const state = String(item.status || item.state || "");
  if (!(state === "approved" || (code === registry.defaultLocale && state === "canonical"))) return null;
  if (!String(item.title || "").trim() || !String(item.body || "").trim()) return null;
  return item;
}

function fillParams(str, params) {
  const result = String(str).replace(/\{([A-Za-z_]+)\}/g, (_whole, token) => {
    if (!Object.prototype.hasOwnProperty.call(params, token)) {
      throw new Error("Unresolved push placeholder: " + token);
    }
    return String(params[token]);
  });
  if (/\{[^{}]*\}/.test(result)) throw new Error("Push contains unresolved placeholder");
  return result;
}

function resolvePushCopy({ copies, appLocale, registry = registryDefault, params = {}, sourceHash = "" }) {
  const requested = normalizeAppLocale(appLocale, registry);
  const selected = approvedCopy(copies, requested, registry, sourceHash);
  const fallback = approvedCopy(copies, registry.defaultLocale, registry, sourceHash);
  if (!selected && !fallback) throw new Error("No approved canonical push copy");
  const active = selected || fallback;
  const used = selected ? requested : registry.defaultLocale;
  return {
    requestedLocale: requested,
    usedLocale: used,
    fallback: used !== requested,
    title: fillParams(active.title, params),
    body: fillParams(active.body, params)
  };
}

function idempotencyUuid(seed) {
  const digest = crypto.createHash("sha256").update(seed).digest("hex");
  // Deterministic, UUID-v4-shaped key, preserving idempotency across retries.
  return digest.slice(0, 8) + "-" + digest.slice(8, 12) + "-4" +
    digest.slice(13, 16) + "-a" + digest.slice(17, 20) + "-" + digest.slice(20, 32);
}

function canonicalUrl(event) {
  const id = String(event.contentId || "").trim();
  if (event.type === "prayer") return "https://dar-al-tawhid.de/#prayer";
  if (!id) throw new Error("Non-prayer event requires canonical contentId");
  if (event.type === "daily_dua") return "https://dar-al-tawhid.de/#dua/" + encodeURIComponent(id);
  if (event.type === "daily_ayah") return String(event.deepLink);
  return "https://dar-al-tawhid.de/#post/" + encodeURIComponent(id);
}

function validateEvent(event) {
  if (!event || typeof event !== "object") throw new Error("Missing event");
  const kind = String(event.type || "");
  if (!["prayer", "daily_dua", "daily_recommendation", "daily_ayah", "new_post"].includes(kind)) {
    throw new Error("Unsupported push type: " + kind);
  }
  if (!String(event.eventKey || "").trim()) {
    throw new Error("Missing stable eventKey (date, prayer/time/mode or publication)");
  }
  if (kind === "prayer") {
    if (!["fajr", "dhuhr", "asr", "maghrib", "isha", "tahajjud"].includes(event.prayerKey)) {
      throw new Error("Invalid prayer key");
    }
    if (!["entry", "advance"].includes(event.mode)) throw new Error("Invalid prayer mode");
    if (event.mode === "advance" && ![5, 10, 15].includes(Number(event.minutes))) {
      throw new Error("Invalid advance window; only 5/10/15 minutes allowed");
    }
    if (event.mode === "advance" && !/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(String(event.time || ""))) {
      throw new Error("Prayer prewarning requires a computed HH:MM target time");
    }
  } else {
    if (!String(event.contentId || "").trim()) {
      throw new Error("Daily/post push requires canonical contentId");
    }
    if (!String(event.sourceHash || "").trim()) {
      throw new Error("Non-prayer push requires canonical source revision");
    }
    if (kind === "daily_ayah" && (event.routeVerified !== true ||
        !/^https:\/\/dar-al-tawhid\.de\/#quran(?:\/|$)/.test(String(event.deepLink || "")))) {
      throw new Error("Daily Āyah needs a verified Qurʾān destination and independent opt-in");
    }
  }
  return kind;
}

function resolveRecipientPush({ event, copies, subscription, registry = registryDefault }) {
  const kind = validateEvent(event);
  const subId = String(subscription && (subscription.subscription_id || subscription.subscriptionId) || "").trim();
  if (!subId) throw new Error("Missing subscriptionId");
  // Fail closed. The actual channel-specific consent and OneSignal status
  // must ALSO be rechecked by the protected production sender before sending.
  if (subscription.enabled !== true || subscription.push_opted_in !== true) {
    throw new Error("Missing active push opt-in for subscription");
  }
  if (!["test", "production"].includes(String(event.environment || ""))) {
    throw new Error("Missing explicit target environment");
  }
  if (String(subscription.app_environment || "") !== event.environment) {
    throw new Error("Subscription environment mismatch");
  }
  if (kind === "daily_dua" && subscription.daily_dua_enabled !== true) {
    throw new Error("Daily Duʿāʾ not enabled");
  }
  if (kind === "daily_recommendation" && subscription.daily_recommendation_enabled !== true) {
    throw new Error("Daily recommendation not enabled");
  }
  if (kind === "daily_ayah" && subscription.daily_ayah_enabled !== true) {
    throw new Error("Daily Āyah not independently opted in");
  }
  const appLocale = subscription.app_locale || subscription.appLocale || registry.defaultLocale;
  const params = {
    time: event.time || "",
    minutes: event.minutes === undefined ? "" : Number(event.minutes),
    prayer: event.prayerKey || ""
  };
  const resolved = resolvePushCopy({ copies, appLocale, registry, params, sourceHash: String(event.sourceHash || "") });
  const url = canonicalUrl(event);
  const contentId = String(event.contentId || "").trim();
  const qNum = Number(event.qNumber);
  const hasQ = event.qNumber !== undefined && event.qNumber !== null && String(event.qNumber).trim() !== "";
  if (hasQ && (!Number.isSafeInteger(qNum) || qNum <= 0)) {
    throw new Error("Unverified or invalid canonical Q number");
  }
  const qUrl = hasQ ? "https://dar-al-tawhid.de/q/" + qNum + "/" : undefined;
  const dedupeSeed = [kind, event.eventKey, contentId, subId].join("|");
  // The locale is deliberately not in this key: switching app language
  // must never re-send the same event to the same subscription.
  const data = {
    type: kind === "prayer" ? "prayer" : kind,
    nav: kind === "prayer" ? "prayer" : kind === "daily_dua" ? "dua" : kind === "daily_ayah" ? "quran" : "post",
    content_id: contentId || undefined,
    prayer_key: event.prayerKey || undefined,
    reminder_type: kind === "prayer" ? "prayer_" + event.mode : undefined,
    app_locale: resolved.requestedLocale,
    copy_locale: resolved.usedLocale,
    q_number: hasQ ? qNum : undefined,
    source_url: qUrl,
    url
  };
  return {
    subscriptionId: subId,
    appLocale: resolved.requestedLocale,
    copyLocale: resolved.usedLocale,
    fallback: resolved.fallback,
    // A single, already localized copy per subscription. "en" is only
    // OneSignal's required default payload key, NOT the user's app language.
    payload: {
      target_channel: "push",
      include_subscription_ids: [subId],
      headings: { en: resolved.title },
      contents: { en: resolved.body },
      url,
      web_url: url,
      data,
      idempotency_key: idempotencyUuid(dedupeSeed)
    }
  };
}

function buildPreview({ event, copies, registrations, registry = registryDefault }) {
  const rows = Array.isArray(registrations) ? registrations : [];
  const unique = new Map();
  for (const row of rows) {
    const sid = String(row && (row.subscription_id || row.subscriptionId) || "").trim();
    if (!sid) continue;
    // Newest registration wins. A newer opt-out MUST override an old opt-in.
    const previous = unique.get(sid);
    const updated = Date.parse(String(row.last_synced_at || row.created_at || "")) || 0;
    const old = Date.parse(String(previous?.last_synced_at || previous?.created_at || "")) || 0;
    if (!previous || updated > old) unique.set(sid, row);
  }
  const messages = [...unique.values()].map((subscription) =>
    resolveRecipientPush({ event, copies, subscription, registry }));
  return {
    dryRun: true, sent: false, localeCount: localeCodes(registry).length,
    inputCount: rows.length, uniqueRecipients: messages.length,
    fallbackCount: messages.filter((m) => m.fallback).length, messages
  };
}

module.exports = {
  localeCodes, normalizeAppLocale, appLocaleRecord, resolvePushCopy,
  idempotencyUuid, canonicalUrl, resolveRecipientPush, buildPreview
};
