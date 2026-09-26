const DEFAULT_APP_ID = "786d7cd6-0455-4434-ab14-0c10a7bc6b1e";

function key(env) {
  return String(env.ONESIGNAL_API_KEY_NEW || env.ONESIGNAL_API_KEY || env.ONESIGNAL_APP_API_KEY || "")
    .replace(/\s+/g, "")
    .trim();
}

function appId(env) {
  return String(env.ONESIGNAL_APP_ID || DEFAULT_APP_ID).trim();
}

function kidsBase(env) {
  return String(env.KIDS_APP_URL || "https://dar-al-tawhid.de/test/kids/start").replace(/\/$/, "");
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

function audienceFilters(item) {
  const groups = ageGroupsFor(item);
  const filters = [
    { field: "tag", key: "dar_kids", relation: "=", value: "true" }
  ];
  if (!groups.length) return filters;

  // OneSignal: AND zwischen Kids-Tag und geklammerter Alters-OR-Gruppe.
  filters.push({ operator: "AND" });
  groups.forEach((label, index) => {
    if (index) filters.push({ operator: "OR" });
    filters.push({ field: "tag", key: "kids_age", relation: "=", value: label });
  });
  return filters;
}

export async function sendKidsContentPush(env, item) {
  if (!item || item?.push?.enabled === false) {
    return { sent: false, skipped: true, reason: "Push für diesen Inhalt deaktiviert" };
  }
  const apiKey = key(env);
  if (!apiKey) return { sent: false, skipped: true, reason: "OneSignal API-Key fehlt" };
  const id = appId(env);
  if (!id) return { sent: false, skipped: true, reason: "OneSignal App-ID fehlt" };

  const copy = copyFor(item);
  const url = launchUrl(env, item);
  const seed = `kids-content:${item.id}:r${item.publishedRevision || item.revision || 1}`;
  const payload = {
    app_id: id,
    target_channel: "push",
    filters: audienceFilters(item),
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
    idempotency_key: await uuid(seed),
    chrome_web_icon: "https://dar-al-tawhid.de/test/kids/icons/icon-192.png?v=logo28",
    chrome_web_badge: "https://dar-al-tawhid.de/notification-badge-96.png?v=3",
    firefox_icon: "https://dar-al-tawhid.de/test/kids/icons/icon-192.png?v=logo28",
    name: `kids-content-${item.id}-r${item.publishedRevision || item.revision || 1}`
  };

  const res = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      Authorization: `Key ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  const recipients = Number(data?.recipients || 0);
  const notificationId = String(data?.id || "").trim();
  const errors = data?.errors || null;
  const sent = res.ok && Boolean(notificationId) && recipients > 0;
  return {
    sent,
    prepared: true,
    httpStatus: res.status,
    recipients,
    notificationId,
    url,
    filters: payload.filters,
    errors,
    reason: sent ? "" : (errors ? JSON.stringify(errors) : recipients === 0 ? "Keine passende Kids-Push-Zielgruppe" : `OneSignal ${res.status}`)
  };
}

export function kidsPushPreview(env, item) {
  const copy = copyFor(item);
  return {
    ...copy,
    url: launchUrl(env, item),
    ageGroups: ageGroupsFor(item),
    filters: audienceFilters(item)
  };
}
