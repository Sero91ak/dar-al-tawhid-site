#!/usr/bin/env node

const fs = require("node:fs");
const crypto = require("node:crypto");

const APP_ID = process.env.ONESIGNAL_APP_ID || "786d7cd6-0455-4434-ab14-0c10a7bc6b1e";
const API_KEY = String(
  process.env.ONESIGNAL_API_KEY_NEW ||
  process.env.ONESIGNAL_API_KEY ||
  process.env.ONESIGNAL_APP_API_KEY ||
  ""
).replace(/\s+/g, "").replace(/^(Key|Basic)/i, "").trim();
const SITE_URL = String(process.env.SITE_URL || "https://dar-al-tawhid.de").replace(/\/$/, "");
const SUPABASE_URL = "https://djyfkttjbdraynuxrzno.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqeWZrdHRqYmRyYXludXhyem5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NjE1MTUsImV4cCI6MjA5NjQzNzUxNX0.PUzkuxpJVWeW64nSAVW61KqYDE5k1d4sAir2unXKjxw";
const TOKEN = String(process.env.DAILY_REPAIR_TOKEN || "daily-live-repair-2026-07-22-v2");

if (!API_KEY) {
  console.error("Kein OneSignal API-Key in GitHub Secrets gefunden.");
  process.exit(1);
}

const daily = JSON.parse(fs.readFileSync("content/updates/daily.json", "utf8"));
const config = JSON.parse(fs.readFileSync("content/admin/daily-push.json", "utf8"));
const dateKey = String(daily.date || "").trim();
if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
  throw new Error("daily.json enthält kein gültiges Datum");
}
if (!daily.dua?.id || !daily.recommendation?.id) {
  throw new Error("daily.json enthält nicht beide Tagesinhalte");
}

function uuidFrom(seed) {
  const bytes = Buffer.from(crypto.createHash("sha256").update(seed).digest().subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function supabase(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch (_) {}
  if (!response.ok) throw new Error(`Supabase ${response.status}: ${text.slice(0, 300)}`);
  return json;
}

async function loadRows() {
  const select = [
    "device_id",
    "subscription_id",
    "daily_dua_enabled",
    "daily_recommendation_enabled",
    "app_environment",
    "enabled",
    "push_opted_in"
  ].join(",");
  const query = [
    "enabled=eq.true",
    "push_opted_in=eq.true",
    "app_environment=eq.production",
    "subscription_id=not.is.null",
    `select=${select}`
  ].join("&");
  const rows = await supabase(`prayer_push_registrations?${query}`);
  const map = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    const sid = String(row.subscription_id || "").trim();
    if (sid) map.set(sid, row);
  }
  return [...map.values()];
}

async function patchRow(row, fields) {
  const filter = row.device_id
    ? `device_id=eq.${encodeURIComponent(row.device_id)}`
    : `subscription_id=eq.${encodeURIComponent(row.subscription_id)}`;
  await supabase(`prayer_push_registrations?${filter}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ ...fields, last_synced_at: new Date().toISOString() })
  });
}

function payload(kind, item, subscriptionId) {
  const isDua = kind === "dua";
  const section = isDua ? config.dailyDua : config.recommendation;
  const title = String(section?.title || (isDua ? "Duʿāʾ des Tages" : "Heute empfohlen"));
  const itemTitle = String(item.title || "").trim();
  const snippet = String(item.snippet || "").trim();
  const body = [itemTitle, snippet].filter(Boolean).join(snippet ? " – " : "");
  const url = isDua
    ? `${SITE_URL}/#dua/${encodeURIComponent(item.id)}`
    : `${SITE_URL}/#post/${encodeURIComponent(item.id)}`;
  const idempotencyKey = uuidFrom(["daily-emergency", TOKEN, kind, dateKey, item.id, subscriptionId].join("|"));

  return {
    app_id: APP_ID,
    target_channel: "push",
    include_subscription_ids: [subscriptionId],
    headings: { de: title, en: title },
    contents: { de: body, en: body },
    url,
    isAnyWeb: true,
    idempotency_key: idempotencyKey,
    name: `daily-emergency-${kind}-${dateKey}-${TOKEN}`.slice(0, 128),
    data: {
      type: isDua ? "daily_dua" : "daily_recommendation",
      content_id: item.id,
      date: dateKey,
      source: "github-daily-live-repair",
      repair_token: TOKEN
    },
    chrome_web_icon: `${SITE_URL}/notification-icon-192.png?v=2`,
    chrome_web_badge: `${SITE_URL}/notification-badge-96.png?v=2`,
    firefox_icon: `${SITE_URL}/notification-icon-192.png?v=2`
  };
}

async function sendOne(kind, item, row) {
  const response = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Key ${API_KEY}`
    },
    body: JSON.stringify(payload(kind, item, row.subscription_id))
  });
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch (_) {}
  if (!response.ok) throw new Error(`OneSignal ${response.status}: ${text.slice(0, 300)}`);

  const invalid = data?.errors?.invalid_subscription_ids || data?.errors?.invalid_player_ids || [];
  const isInvalid = Array.isArray(invalid) && invalid.map(String).includes(String(row.subscription_id));
  const notificationId = String(data.id || "").trim();
  if (isInvalid || !notificationId) {
    await patchRow(row, {
      enabled: false,
      push_opted_in: false,
      daily_dua_enabled: false,
      daily_recommendation_enabled: false,
      jummah_notifications: false,
      daily_push_error: isInvalid
        ? "OneSignal-Subscription ungültig – Push in der App erneut aktivieren."
        : "OneSignal hat für diese Subscription keine Nachricht erstellt."
    });
    return { accepted: false, invalid: true };
  }

  const fields = kind === "dua"
    ? { last_dua_push_date: dateKey, last_dua_content_id: item.id, daily_push_error: null }
    : { last_recommendation_push_date: dateKey, last_recommendation_content_id: item.id, daily_push_error: null };
  await patchRow(row, fields);
  return { accepted: true, invalid: false };
}

(async () => {
  const rows = await loadRows();
  if (!rows.length) throw new Error("Keine aktiven Produktions-Subscriptions gefunden");

  const summary = {
    token: TOKEN,
    date: dateKey,
    rows: rows.length,
    dua: { accepted: 0, invalid: 0, errors: 0 },
    recommendation: { accepted: 0, invalid: 0, errors: 0 }
  };

  for (const [kind, item] of [["dua", daily.dua], ["recommendation", daily.recommendation]]) {
    for (const row of rows) {
      try {
        const result = await sendOne(kind, item, row);
        if (result.accepted) summary[kind].accepted += 1;
        if (result.invalid) summary[kind].invalid += 1;
      } catch (error) {
        summary[kind].errors += 1;
        await patchRow(row, { daily_push_error: String(error.message || error).slice(0, 240) }).catch(() => {});
        console.error(`${kind} Fehler:`, error.message || error);
      }
    }
  }

  console.log(JSON.stringify(summary, null, 2));
  fs.writeFileSync("daily-live-repair-result.json", `${JSON.stringify(summary, null, 2)}\n`);

  if (summary.dua.accepted < 1 || summary.recommendation.accepted < 1) {
    process.exitCode = 1;
  }
})();
