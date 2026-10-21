"use strict";
/**
 * DĀR Zentrum: read-only push locale resolver / NOT a production sender.
 * No OneSignal calls, timers, geo changes, subscriptions or publishing.
 * This isolated module is activated only after the protected push lanes
 * have separately passed the owner's password/approval gates.
 */
const crypto = require("node:crypto");
const path = require("node:path");
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
function appLocaleTagPatch(appLocale, registry = registryDefault) {
  return { dar_app_locale: normalizeAppLocale(appLocale, registry) };
}

function approvedCopy(copies, code, registry) {
  if (!localeCodes(registry).includes(code)) return null;
  const item = copies && copies[code];
  if (!item || typeof item !== "object") return null;
  const state = String(item.status || item.state || "");
  if (!(state === "approved" || (code === registry.defaultLocale && state === "canonical"))) return null;
  if (!String(item.title || "").trim() || !String(item.body || "").trim()) return null;
  return item;
}

function fillParams(str, params) {
  return String(str).replace(/\{([A-Za-z_]+)\}/g, (_whole, token) => {
    if (!Object.prototype.hasOwnProperty.call(params, token)) {
      throw new Error("Unresolved push placeholder: " + token);
    }
    return String(params[token]);
  });
}

function resolvePushCopy({ copies, appLocale, registry = registryDefault, params = {} }) {
  const requested = normalizeAppLocale(appLocale, registry);
  const selected = approvedCopy(copies, requested, registry);
  const fallback = approvedCopy(copies, registry.defaultLocale, registry);
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
  } else if (!String(event.contentId || "").trim()) {
    throw new Error("Daily/post push requires canonical contentId");
  }
  return kind;
}

function resolveRecipientPush({ event, copies, subscription, registry = registryDefault }) {
  const kind = validateEvent(event);
  const subId = String(subscription && (subscription.subscription_id || subscription.subscriptionId) || "").trim();
  if (!subId) throw new Error("Missing subscriptionId");
  const appLocale = subscription.app_locale || subscription.appLocale || registry.defaultLocale;
  const params = {
    time: event.time || "",
    minutes: event.minutes === undefined ? "" : Number(event.minutes),
    prayer: event.prayerKey || ""
  };
  const resolved = resolvePushCopy({ copies, appLocale, registry, params });
  const url = canonicalUrl(event);
  const contentId = String(event.contentId || "").trim();
  const dedupeSeed = [kind, event.eventKey, contentId, subId].join("|");
  // The locale is deliberately not in this key: switching app language
  // must never re-send the same event to the same subscription.
  const data = {
    type: kind === "prayer" ? "prayer" : kind,
    nav: kind === "prayer" ? "prayer" : kind === "daily_dua" ? "dua" : "post",
    content_id: contentId || undefined,
    prayer_key: event.prayerKey || undefined,
    reminder_type: kind === "prayer" ? "prayer_" + event.mode : undefined,
    app_locale: resolved.requestedLocale,
    copy_locale: resolved.usedLocale,
    q_number: event.qNumber || undefined,
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
    // Server must supply the newest subscription row first, if duplicates
    // exist. Never create multiple messages from duplicate registrations.
    if (!unique.has(sid)) unique.set(sid, row);
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
  localeCodes, normalizeAppLocale, appLocaleTagPatch, resolvePushCopy,
  idempotencyUuid, canonicalUrl, resolveRecipientPush, buildPreview
};
