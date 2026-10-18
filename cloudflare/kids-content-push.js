// Kids-only OneSignal integration. No fallbacks to adult app configuration.
const KIDS_APP_ID = "f8d837a0-406a-4a8a-8c6a-e0c2f8bc2766";

function key(env) {
  return String(env.ONESIGNAL_KIDS_API_KEY || "")
    .replace(/\s+/g, "")
    .trim();
}

function appId(env) {
  return String(env.ONESIGNAL_KIDS_APP_ID || "").trim();
}

function kidsBase(env) {
  return String(env.KIDS_APP_URL || "https://dar-al-tawhid.de/kids/start").replace(/\/$/, "");
}

function ageGroupsFor(item) {
  const groups = [
    { label: "4–5", min: 4, max: 5 },
    { label: "6–8", min: 6, max: 8 },
    { label: "9–10", min: 9, max: 10 }
  ];
  return groups.filter((g) => Number(item?.ageMin || 0) <= g.max && Number(item?.ageMax || 99) >= g.min).map((g) => g.label);
}

async function uuid(seed) {
  const bytes = new TextEncoder().encode(String(seed || ""));
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  const hex = [...digest.slice(0, 16)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    "5" + hex.slice(13, 16),
    ((parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0") + hex.slice(18, 20),
    hex.slice(20, 32)
  ].join("-");
}

function copyFor(item) {
  const kind = String(item?.kind || "story");
  const titleMap = {
    story: "Neue Kindergeschichte",
    quiz: "Neues Kids-Quiz",
    game: "Neues Kids-Spiel",
    lesson: "Neue Kids-Lerneinheit"
  };
  return {
    title: String(item?.push?.title || titleMap[kind] || "Neuer Kids-Inhalt").trim(),
    body: String(item?.push?.body || item?.title || "Etwas Neues wartet auf dich.").trim()
  };
}

function launchUrl(env, item) {
  const u = new URL(kidsBase(env));
  u.searchParams.set("content", String(item?.id || ""));
  u.searchParams.set("kind", String(item?.kind || "story"));
  if (item?.kind === "story") u.searchParams.set("view", "stories");
  if (item?.kind === "quiz") u.searchParams.set("view", "quiz");
  if (item?.kind === "game") u.searchParams.set("view", "games");
  return u.toString();
}

const SUPABASE_KIDS_URL = "https://djyfkttjbdraynuxrzno.supabase.co";
const AUDIENCE_PAGE_SIZE = 500;
const MAX_VERIFIED_DEVICES = 10000;

// Only the database's service-role-only, already verified and parent-enabled
// Kids registrations are permitted to receive a content notification. Never
// rely on client-controlled OneSignal tags as proof of guardian authorization.
async function readVerifiedAudience(env, item) {
  const secret = String(env.SUPABASE_KIDS_SERVICE_ROLE_KEY || "").trim();
  if (!secret) {
    return { ids: [], error: "Kids-Supabase-Dienstschlüssel fehlt" };
  }
  const groups = ageGroupsFor(item);
  if (!groups.length) {
    return { ids: [], error: "Keine passende Altersstufe" };
  }
  const headers = { apikey: secret, Accept: "application/json" };
  if (secret.startsWith("eyJ")) headers.Authorization = `Bearer ${secret}`;
  const ids = new Set();
  for (let offset = 0; offset < MAX_VERIFIED_DEVICES; offset += AUDIENCE_PAGE_SIZE) {
    const url = new URL(SUPABASE_KIDS_URL + "/rest/v1/kids_push_subscriptions");
    url.searchParams.set("select", "onesignal_subscription_id");
    url.searchParams.set("content_enabled", "eq.true");
    url.searchParams.set("parent_consent_verified_at", "not.is.null");
    url.searchParams.set("consent_revoked_at", "is.null");
    url.searchParams.set("kids_age_band", `in.(${groups.join(",")})`);
    const response = await fetch(url.toString(), {
      headers: {
        ...headers,
        Range: `${offset}-${offset + AUDIENCE_PAGE_SIZE - 1}`
      },
      cache: "no-store"
    });
    if (!response.ok) {
      return { ids: [], error: `Kids-Supabase-Lesezugriff fehlgeschlagen (${response.status})` };
    }
    const data = await response.json().catch(() => null);
    if (!Array.isArray(data)) {
      return { ids: [], error: "Kids-Supabase-Antwort ungültig" };
    }
    for (const row of data) {
      const id = String(row?.onesignal_subscription_id || "").trim();
      if (/^[a-f0-9-]{30,50}$/i.test(id)) ids.add(id);
    }
    if (data.length < AUDIENCE_PAGE_SIZE) return { ids: [...ids], error: "" };
  }
  // Never silently drop registered recipients when hitting the safety cap.
  return { ids: [], error: "Kids-Audience-Limit erreicht; Versand angehalten" };
}

export async function sendKidsContentPush(env, item) {
  if (!item || item?.push?.enabled === false) {
    return { sent: false, skipped: true, reason: "Push für diesen Inhalt deaktiviert" };
  }
  // Both credentials must be explicitly set for the Kids app.
  // A disabled/misconfigured lane must never attempt an adult notification.
  const id = appId(env);
  if (id !== KIDS_APP_ID) {
    return { sent: false, skipped: true, reason: "Kids-OneSignal App-ID fehlt oder ist falsch" };
  }
  const apiKey = key(env);
  if (!apiKey) return { sent: false, skipped: true, reason: "Kids-OneSignal API-Key fehlt" };

  const audience = await readVerifiedAudience(env, item);
  if (audience.error) {
    return { sent: false, skipped: true, reason: audience.error };
  }
  if (!audience.ids.length) {
    return { sent: false, skipped: true, reason: "Keine serverseitig bestätigte Elternfreigabe vorhanden" };
  }
  const copy = copyFor(item);
  const url = launchUrl(env, item);
  const revision = item.publishedRevision || item.revision || 1;
  const seed = `kids-content:${item.id}:r${revision}`;
  let recipients = 0;
  const notificationIds = [];
  const errors = [];
  // OneSignal does not permit combining subscription IDs and tag filters.
  // The strict authorization decision therefore happens before this call.
  for (let offset = 0; offset < audience.ids.length; offset += AUDIENCE_PAGE_SIZE) {
    const index = offset / AUDIENCE_PAGE_SIZE;
    const payload = {
      app_id: id,
      target_channel: "push",
      include_subscription_ids: audience.ids.slice(offset, offset + AUDIENCE_PAGE_SIZE),
      headings: { de: copy.title, en: copy.title },
      contents: { de: copy.body, en: copy.body },
      url,
      data: {
        type: "kids_content",
        contentId: item.id,
        kind: item.kind,
        title: item.title,
        ageMin: item.ageMin,
        ageMax: item.ageMax,
        url,
        publishedAt: item.publishedAt
      },
      idempotency_key: await uuid(`${seed}:batch:${index}`),
      chrome_web_icon: "https://dar-al-tawhid.de/kids/icons/icon-192.png?v=logo28",
      chrome_web_badge: "https://dar-al-tawhid.de/notification-badge-96.png?v=3",
      firefox_icon: "https://dar-al-tawhid.de/kids/icons/icon-192.png?v=logo28",
      name: `kids-content-${item.id}-r${revision}-batch-${index}`
    };
    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        Authorization: `Key ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    const messageId = String(result?.id || "");
    if (!response.ok || !messageId) {
      errors.push({ batch: index, status: response.status });
      continue;
    }
    notificationIds.push(messageId);
    recipients += Number(result?.recipients || 0);
  }
  return {
    sent: recipients > 0,
    prepared: true,
    recipients,
    notificationId: notificationIds[0] || "",
    notificationIds,
    url,
    errors: errors.length ? errors : null,
    reason: recipients > 0 ? "" : "Keine bestätigte Kids-Push-Zustellung"
  };
}

export function kidsPushPreview(env, item) {
  const copy = copyFor(item);
  return {
    ...copy,
    url: launchUrl(env, item),
    ageGroups: ageGroupsFor(item),
    filters: [],
    targeting: "supabase_verified_parent_subscriptions_only"
  };
}
