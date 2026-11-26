/**
 * Kurmanci and Sorani delivery for subscriptions tagged dar_app_locale.
 * One directory page only. An incomplete page returns null and the caller
 * keeps the existing send, so nobody is dropped and nobody is added twice.
 * Does not calculate prayer times, read a location, or create a segment.
 */
const PAGE_LIMIT = 300;
let cache = { at: 0, sets: undefined };

export function localesFromUsers(users) {
  const sets = { ku: new Set(), ckb: new Set() };
  for (const user of Array.isArray(users) ? users : []) {
    const tags = user?.properties?.tags || user?.tags || {};
    const locale = String(tags.dar_app_locale || "").toLowerCase();
    if (locale !== "ku" && locale !== "ckb") continue;
    const subs = user.subscriptions || [];
    for (const sub of subs) {
      const id = String(sub?.id || "").trim();
      if (id) sets[locale].add(id);
    }
  }
  return sets;
}

export function partitionSubscriptionIds(ids, sets) {
  const list = (Array.isArray(ids) ? ids : []).map((id) => String(id || "").trim()).filter(Boolean);
  if (!sets) return [{ locale: null, ids: list }];
  const ku = [];
  const ckb = [];
  const rest = [];
  for (const id of list) {
    if (sets.ku?.has(id)) ku.push(id);
    else if (sets.ckb?.has(id)) ckb.push(id);
    else rest.push(id);
  }
  const parts = [];
  if (rest.length) parts.push({ locale: null, ids: rest });
  if (ku.length) parts.push({ locale: "ku", ids: ku });
  if (ckb.length) parts.push({ locale: "ckb", ids: ckb });
  return parts.length ? parts : [{ locale: null, ids: [] }];
}

export function localeForSubscription(id, sets) {
  const key = String(id || "").trim();
  if (!sets || !key) return null;
  if (sets.ku?.has(key)) return "ku";
  if (sets.ckb?.has(key)) return "ckb";
  return null;
}

export function localeDeliveryBody(base, spec) {
  const next = {
    ...base,
    include_subscription_ids: spec.ids.slice(),
    headings: spec.headings,
    contents: spec.contents,
    name: spec.name
  };
  next.idempotency_key = spec.key;
  return next;
}

export async function loadAppLocaleSets(env, fetchImpl = fetch) {
  if (cache.sets !== undefined && Date.now() - cache.at < 4 * 60 * 1000) return cache.sets;
  const appId = String(env?.ONESIGNAL_APP_ID || "786d7cd6-0455-4434-ab14-0c10a7bc6b1e").trim();
  const key = String(env?.ONESIGNAL_API_KEY_NEW || env?.ONESIGNAL_API_KEY || "").replace(/\s+/g, "").replace(/^(Key|Basic)/i, "").trim();
  if (!key) {
    cache = { at: Date.now(), sets: null };
    return null;
  }
  const response = await fetchImpl(`https://api.onesignal.com/apps/${encodeURIComponent(appId)}/users?limit=${PAGE_LIMIT}`, {
    headers: { Authorization: `Key ${key}` }
  });
  if (!response.ok) {
    cache = { at: Date.now(), sets: null };
    return null;
  }
  const payload = await response.json();
  const users = payload?.users || [];
  if (users.length >= PAGE_LIMIT || payload?.next_cursor) {
    cache = { at: Date.now(), sets: null };
    return null;
  }
  const sets = localesFromUsers(users);
  cache = { at: Date.now(), sets };
  return sets;
}
