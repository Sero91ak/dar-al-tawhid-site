/**
 * Cloudflare Worker – Gebetszeiten-Push-Scheduler
 * Läuft per Cron und Admin-Anstoß direkt im Worker (ohne GitHub workflow_dispatch).
 */

const DEFAULT_ONESIGNAL_APP_ID = "786d7cd6-0455-4434-ab14-0c10a7bc6b1e";
const DEFAULT_SITE_URL = "https://dar-al-tawhid.de/#prayer";
const DEFAULT_PRAYER_STATUS_PATH = "content/admin/prayer-push-status.json";
const DEFAULT_SUPABASE_URL = "https://djyfkttjbdraynuxrzno.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqeWZrdHRqYmRyYXludXhyem5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NjE1MTUsImV4cCI6MjA5NjQzNzUxNX0.PUzkuxpJVWeW64nSAVW61KqYDE5k1d4sAir2unXKjxw";

const DEFAULT_PRAYER_ADVANCE_MINUTES = 15;
const SCHEDULE_LOOKAHEAD_MINUTES = 26 * 60;
const SCHEDULE_GRACE_MINUTES = 15;
const KV_STATUS_KEY = "prayer:status";
const KV_USERS_KEY = "prayer:users";
const KV_ERROR_LOG_KEY = "prayer:errorlog";
const KV_SENT_PREFIX = "prayer:sent:";
const REFERENCE_LOCATION = { lat: 50.6256, lon: 6.9491, city: "Rheinbach", timeZone: "Europe/Berlin" };

const PRAYER_NOTIFICATION_MESSAGES = {
  default: [
    "Das Gebet zu seiner Zeit gehört zu den liebsten Taten bei Allah.",
    "Nimm dir jetzt bewusst Zeit für dein Gebet.",
    "Bewahre dein Gebet und erinnere dich an Allah."
  ],
  fajr: [
    "Beginne deinen Tag mit dem Gebet und dem Gedenken an Allah.",
    "Fajr ist eingetreten. Starte den Tag mit Gehorsam gegenüber Allah.",
    "Der Tag beginnt mit einer großen Gelegenheit zum Gebet."
  ],
  asr: [
    "Bewahre dieses Gebet – verliere nicht deine gewaltige Gelegenheit.",
    "ʿAṣr ist eingetreten. Achte besonders auf dieses Gebet.",
    "Halte am ʿAṣr-Gebet fest und bewahre deine Zeit."
  ],
  isha: [
    "Schließe deinen Tag mit Gehorsam gegenüber Allah ab.",
    "ʿIshāʾ ist eingetreten. Beende den Tag mit Gebet und Ruhe.",
    "Nimm dir am Ende des Tages Zeit für dein Gebet."
  ],
  tahajjud: [
    "Die letzte Nachtzeit ist eine Gelegenheit für Duʿāʾ, Reue und Nähe zu Allah.",
    "Steh für Allah auf, auch wenn es nur wenige Rakʿāt sind.",
    "Nutze die Stille der Nacht für Bittgebet und Nähe zu Allah."
  ]
};

function oneSignalApiKey(env) {
  return String(env.ONESIGNAL_API_KEY_NEW || env.ONESIGNAL_API_KEY || "")
    .replace(/\s+/g, "")
    .replace(/^(Key|Basic)/i, "")
    .trim();
}

function siteOrigin(env) {
  return String(env.SITE_URL || DEFAULT_SITE_URL).replace(/#.*$/, "").replace(/\/$/, "");
}

function withNotificationIcons(payload, env) {
  const origin = siteOrigin(env);
  const icon = `${origin}/notification-icon-192.png?v=2`;
  const badge = `${origin}/notification-badge-96.png?v=2`;
  return { ...payload, chrome_web_icon: icon, chrome_web_badge: badge, firefox_icon: icon };
}

function toRad(d) { return d * Math.PI / 180; }
function toDeg(r) { return r * 180 / Math.PI; }
function fixAngle(a) { return ((a % 360) + 360) % 360; }
function fixHour(h) { return ((h % 24) + 24) % 24; }

function getLocalParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(date);
  const obj = {};
  for (const p of parts) obj[p.type] = p.value;
  return {
    year: Number(obj.year),
    month: Number(obj.month),
    day: Number(obj.day),
    hour: Number(obj.hour),
    minute: Number(obj.minute),
    second: Number(obj.second)
  };
}

function getTimeZoneOffsetMinutes(date, timeZone) {
  const local = getLocalParts(date, timeZone);
  const utcAsLocal = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second);
  return Math.round((utcAsLocal - date.getTime()) / 60000);
}

function makeUtcDateFromLocal(localDate, hourDecimal, timeZone) {
  const h = Math.floor(fixHour(hourDecimal));
  const m = Math.round((fixHour(hourDecimal) - h) * 60);
  const minutes = h * 60 + m;
  const localMidnightUtcGuess = Date.UTC(localDate.year, localDate.month - 1, localDate.day, 0, 0, 0);
  const guess = new Date(localMidnightUtcGuess + minutes * 60000);
  const offset = getTimeZoneOffsetMinutes(guess, timeZone);
  return new Date(localMidnightUtcGuess + minutes * 60000 - offset * 60000);
}

function todayLocalDate(timeZone) {
  const p = getLocalParts(new Date(), timeZone);
  return { year: p.year, month: p.month, day: p.day };
}

function dayOfYearFromLocal(localDate) {
  const start = Date.UTC(localDate.year, 0, 0);
  const current = Date.UTC(localDate.year, localDate.month - 1, localDate.day);
  return Math.floor((current - start) / 86400000);
}

function addLocalDays(localDate, days) {
  const d = new Date(Date.UTC(localDate.year, localDate.month - 1, localDate.day + days));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

function sunTimeForAngle(localDate, lat, lon, angle, morning, timeZone) {
  const N = dayOfYearFromLocal(localDate);
  const lngHour = lon / 15;
  const t = N + (((morning ? 6 : 18) - lngHour) / 24);
  const M = (0.9856 * t) - 3.289;
  let L = M + (1.916 * Math.sin(toRad(M))) + (0.020 * Math.sin(toRad(2 * M))) + 282.634;
  L = fixAngle(L);
  let RA = toDeg(Math.atan(0.91764 * Math.tan(toRad(L))));
  RA = fixAngle(RA);
  const Lquadrant = Math.floor(L / 90) * 90;
  const RAquadrant = Math.floor(RA / 90) * 90;
  RA = (RA + (Lquadrant - RAquadrant)) / 15;
  const sinDec = 0.39782 * Math.sin(toRad(L));
  const cosDec = Math.cos(Math.asin(sinDec));
  const zenith = 90 + angle;
  const cosH = (Math.cos(toRad(zenith)) - (sinDec * Math.sin(toRad(lat)))) / (cosDec * Math.cos(toRad(lat)));
  if (cosH > 1 || cosH < -1) return null;
  let H = morning ? 360 - toDeg(Math.acos(cosH)) : toDeg(Math.acos(cosH));
  H = H / 15;
  const T = H + RA - (0.06571 * t) - 6.622;
  const UT = T - lngHour;
  const localMidday = makeUtcDateFromLocal(localDate, 12, timeZone);
  const tzOffsetHours = getTimeZoneOffsetMinutes(localMidday, timeZone) / 60;
  return fixHour(UT + tzOffsetHours);
}

function solarNoon(localDate, lat, lon, timeZone) {
  const sunrise = sunTimeForAngle(localDate, lat, lon, 0.833, true, timeZone);
  const sunset = sunTimeForAngle(localDate, lat, lon, 0.833, false, timeZone);
  if (sunrise == null || sunset == null) return 12;
  return fixHour((sunrise + sunset) / 2);
}

function declinationApprox(localDate) {
  const N = dayOfYearFromLocal(localDate);
  return 23.45 * Math.sin(toRad((360 / 365) * (284 + N)));
}

function asrTime(localDate, lat, lon, factor, timeZone) {
  const noon = solarNoon(localDate, lat, lon, timeZone);
  const dec = declinationApprox(localDate);
  const angle = toDeg(Math.atan(1 / (factor + Math.tan(toRad(Math.abs(lat - dec))))));
  const cosH = (Math.sin(toRad(angle)) - Math.sin(toRad(lat)) * Math.sin(toRad(dec))) / (Math.cos(toRad(lat)) * Math.cos(toRad(dec)));
  if (cosH > 1 || cosH < -1) return fixHour(noon + 4);
  const H = toDeg(Math.acos(cosH)) / 15;
  return fixHour(noon + H);
}

function formatHour(h) {
  let total = Math.round(fixHour(h) * 60);
  total = ((total % 1440) + 1440) % 1440;
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function normalizeAdvanceMinutes(value) {
  const n = Number(value);
  return [5, 10, 15].includes(n) ? n : DEFAULT_PRAYER_ADVANCE_MINUTES;
}

function normalizeTahajjudMode(value) {
  const v = String(value || "off");
  return ["off", "before30", "before60", "before90", "lastThird", "true"].includes(v)
    ? (v === "true" ? "lastThird" : v)
    : "off";
}

function tahajjudStartForMode(maghribUtc, fajrUtc, mode) {
  if (mode === "off" || !(fajrUtc > maghribUtc)) return null;
  if (mode === "before30") return new Date(fajrUtc.getTime() - 30 * 60000);
  if (mode === "before60") return new Date(fajrUtc.getTime() - 60 * 60000);
  if (mode === "before90") return new Date(fajrUtc.getTime() - 90 * 60000);
  return new Date(maghribUtc.getTime() + ((fajrUtc.getTime() - maghribUtc.getTime()) * 2 / 3));
}

function calculatePrayerTimes(localDate, lat, lon, timeZone, methodAngle, asrFactor, tahajjudMode = "off") {
  const fajr = sunTimeForAngle(localDate, lat, lon, methodAngle, true, timeZone);
  const dhuhr = solarNoon(localDate, lat, lon, timeZone);
  const asr = asrTime(localDate, lat, lon, asrFactor, timeZone);
  const maghrib = sunTimeForAngle(localDate, lat, lon, 0.833, false, timeZone);
  const isha = sunTimeForAngle(localDate, lat, lon, methodAngle, false, timeZone);

  const prayers = [
    { key: "fajr", name: "Fajr", time: fajr },
    { key: "dhuhr", name: "Dhuhr", time: dhuhr },
    { key: "asr", name: "ʿAṣr", time: asr },
    { key: "maghrib", name: "Maghrib", time: maghrib },
    { key: "isha", name: "ʿIshāʾ", time: isha }
  ];

  const tomorrow = addLocalDays(localDate, 1);
  const fajrNext = sunTimeForAngle(tomorrow, lat, lon, methodAngle, true, timeZone);
  const normalizedTahajjud = normalizeTahajjudMode(tahajjudMode);

  if (normalizedTahajjud !== "off" && maghrib != null && fajrNext != null) {
    const maghribUtc = makeUtcDateFromLocal(localDate, maghrib, timeZone);
    const fajrUtc = makeUtcDateFromLocal(tomorrow, fajrNext, timeZone);
    if (fajrUtc > maghribUtc) {
      const startUtc = tahajjudStartForMode(maghribUtc, fajrUtc, normalizedTahajjud);
      if (startUtc) {
        const startParts = getLocalParts(startUtc, timeZone);
        const timeDecimal = fixHour(startParts.hour + startParts.minute / 60 + startParts.second / 3600);
        prayers.push({ key: "tahajjud", name: "Taḥajjud", time: timeDecimal, sendAfter: startUtc });
      }
    }
  }

  return prayers;
}

async function fetchOneSignalJson(env, url, options = {}) {
  const apiKey = oneSignalApiKey(env);
  if (!apiKey) throw new Error("OneSignal API Key fehlt am Worker");

  let last = null;
  for (const authMode of ["Key", "Basic"]) {
    const res = await fetch(url, {
      ...options,
      headers: { ...(options.headers || {}), Authorization: `${authMode} ${apiKey}` }
    });
    const text = await res.text();
    if (res.ok) return text ? JSON.parse(text) : {};
    last = new Error(`OneSignal ${res.status} (${authMode}): ${text.slice(0, 240)}`);
  }
  throw last || new Error("OneSignal API request failed");
}

function normalizeUserRecord(user) {
  const subscriptions = extractWebPushSubscriptionIds(user);
  const tags = extractUserTags(user);
  const externalId = user?.identity?.external_id || user?.aliases?.external_id || user?.external_id || null;
  return {
    id: subscriptions[0] || user?.id || user?.onesignal_id || externalId,
    external_user_id: externalId,
    invalid_identifier: false,
    notification_types: 1,
    tags,
    subscriptionIds: subscriptions
  };
}

async function fetchAppUsers(env, appId) {
  const all = [];
  let offset = 0;
  const limit = 300;
  while (true) {
    const url = `https://api.onesignal.com/apps/${encodeURIComponent(appId)}/users?limit=${limit}&offset=${offset}`;
    const data = await fetchOneSignalJson(env, url);
    const users = Array.isArray(data.users) ? data.users : Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : [];
    all.push(...users.map(normalizeUserRecord));
    if (users.length < limit) break;
    offset += limit;
  }
  return all;
}

async function fetchLegacyPlayers(env, appId) {
  const all = [];
  let offset = 0;
  const limit = 300;
  while (true) {
    const url = `https://onesignal.com/api/v1/players?app_id=${encodeURIComponent(appId)}&limit=${limit}&offset=${offset}`;
    const data = await fetchOneSignalJson(env, url);
    const players = Array.isArray(data.players) ? data.players : [];
    all.push(...players);
    if (players.length < limit) break;
    offset += limit;
  }
  return all;
}

async function fetchUserByAlias(env, appId, aliasLabel, aliasId) {
  const url = `https://api.onesignal.com/apps/${encodeURIComponent(appId)}/users/by/${encodeURIComponent(aliasLabel)}/${encodeURIComponent(aliasId)}`;
  try {
    return await fetchOneSignalJson(env, url);
  } catch (err) {
    return null;
  }
}

async function fetchUserBySubscriptionId(env, appId, subscriptionId) {
  const url = `https://api.onesignal.com/apps/${encodeURIComponent(appId)}/subscriptions/${encodeURIComponent(subscriptionId)}/user`;
  try {
    return await fetchOneSignalJson(env, url);
  } catch (err) {
    return null;
  }
}

function extractUserTags(user) {
  if (!user) return {};
  for (const tags of [user?.properties?.tags, user?.tags, user?.properties?.custom_tags, user?.custom_tags]) {
    if (tags && typeof tags === "object") return { ...tags };
  }
  return {};
}

function extractWebPushSubscriptionIds(user) {
  const subs = Array.isArray(user?.subscriptions) ? user.subscriptions : [];
  return subs
    .filter((s) => {
      const type = String(s?.type || "").toLowerCase();
      return type.includes("web") || type.includes("chrome") || type.includes("safari") || type.includes("mozilla");
    })
    .filter((s) => s.enabled !== false && s.invalid_identifier !== true)
    .map((s) => s.id)
    .filter(Boolean);
}

async function resolvePlayerTags(env, appId, player) {
  let tags = { ...(player.tags || {}) };
  let subscriptionIds = [player.id].filter(Boolean);
  const externalId = player.external_user_id || player.external_id;
  let user = null;

  if (externalId) user = await fetchUserByAlias(env, appId, "external_id", externalId);
  if (!extractUserTags(user).prayer_lat && player.id) {
    const bySub = await fetchUserBySubscriptionId(env, appId, player.id);
    if (bySub) user = bySub;
  }
  if (user) {
    tags = { ...tags, ...extractUserTags(user) };
    const webIds = extractWebPushSubscriptionIds(user);
    if (webIds.length) subscriptionIds = webIds;
  }
  return { tags, subscriptionIds, externalId };
}

function hasPrayerTags(tags) {
  if (!tags || typeof tags !== "object") return false;
  const active = tags.prayer_notifications === "true" || tags.prayer_notifications === true;
  return Boolean(active && tags.prayer_lat && tags.prayer_lon && tags.prayer_timezone);
}

async function enrichPlayerTags(env, appId, player) {
  let tags = { ...(player.tags || {}) };
  let subscriptionIds = player.subscriptionIds?.length
    ? player.subscriptionIds.filter(Boolean)
    : [player.id].filter(Boolean);

  if (!hasPrayerTags(tags) && subscriptionIds.length) {
    const resolved = await resolvePlayerTags(env, appId, {
      id: subscriptionIds[0],
      tags,
      external_user_id: player.external_user_id || player.external_id,
      external_id: player.external_user_id || player.external_id
    });
    tags = { ...tags, ...resolved.tags };
    if (resolved.subscriptionIds?.length) subscriptionIds = resolved.subscriptionIds;
  }

  return { tags, subscriptionIds };
}

async function fetchSubscriptions(env) {
  const appId = String(env.ONESIGNAL_APP_ID || DEFAULT_ONESIGNAL_APP_ID).trim();
  const bySub = new Map();
  const sources = [];
  let tagResolveCount = 0;

  try {
    const legacy = await fetchLegacyPlayers(env, appId);
    if (legacy.length) {
      sources.push("legacy");
      for (const player of legacy) {
        const before = hasPrayerTags(player.tags);
        const enriched = await enrichPlayerTags(env, appId, {
          ...player,
          subscriptionIds: [player.id].filter(Boolean)
        });
        if (!before && hasPrayerTags(enriched.tags)) tagResolveCount += 1;
        const id = enriched.subscriptionIds[0] || player.id;
        if (!id) continue;
        bySub.set(id, {
          ...player,
          id,
          tags: enriched.tags,
          subscriptionIds: enriched.subscriptionIds
        });
      }
    }
  } catch (err) {
    // try users API below
  }

  try {
    const users = await fetchAppUsers(env, appId);
    if (users.length) {
      sources.push("users");
      for (const player of users) {
        const ids = player.subscriptionIds?.length ? player.subscriptionIds : [player.id].filter(Boolean);
        for (const id of ids) {
          if (!id) continue;
          const existing = bySub.get(id);
          const merged = {
            ...(existing || player),
            id,
            tags: { ...(existing?.tags || {}), ...(player.tags || {}) },
            subscriptionIds: [id],
            external_user_id: player.external_user_id || player.external_id || existing?.external_user_id
          };
          const before = hasPrayerTags(merged.tags);
          const enriched = await enrichPlayerTags(env, appId, merged);
          if (!before && hasPrayerTags(enriched.tags)) tagResolveCount += 1;
          bySub.set(id, { ...merged, tags: enriched.tags, subscriptionIds: enriched.subscriptionIds });
        }
      }
    }
  } catch (err) {
    if (!bySub.size) throw err;
  }

  if (!bySub.size) {
    throw new Error("Keine OneSignal-Subscriptions lesbar");
  }

  return {
    players: Array.from(bySub.values()),
    source: sources.join("+") || "none",
    tagResolveCount
  };
}

function getPrayerUsers(players) {
  return players.filter((p) => {
    const tags = p.tags || {};
    const active = tags.prayer_notifications === "true" || tags.prayer_notifications === true;
    const hasLocation = tags.prayer_lat && tags.prayer_lon && tags.prayer_timezone;
    const subscriptionIds = p.subscriptionIds?.length ? p.subscriptionIds.filter(Boolean) : [p.id].filter(Boolean);
    const subscribed = subscriptionIds.length > 0 && p.invalid_identifier !== true && p.notification_types !== -2;
    return active && hasLocation && subscribed;
  });
}

function groupUsers(users) {
  const map = new Map();
  for (const user of users) {
    const tags = user.tags || {};
    const lat = Number(tags.prayer_lat);
    const lon = Number(tags.prayer_lon);
    const timeZone = String(tags.prayer_timezone || "Europe/Berlin");
    const methodAngle = Number(tags.prayer_method === "12deg" ? 12 : tags.prayer_method || 12);
    const asrFactor = Number(tags.prayer_asr_factor || 1);
    const advanceMinutes = normalizeAdvanceMinutes(tags.prayer_advance_minutes);
    const tahajjudMode = normalizeTahajjudMode(tags.prayer_tahajjud_mode || tags.prayer_tahajjud);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    const key = [lat.toFixed(3), lon.toFixed(3), timeZone, methodAngle, asrFactor, advanceMinutes, tahajjudMode].join("|");
    if (!map.has(key)) {
      map.set(key, { lat, lon, timeZone, methodAngle, asrFactor, advanceMinutes, tahajjudMode, subscriptionIds: [] });
    }
    const ids = user.subscriptionIds?.length ? user.subscriptionIds : [user.id].filter(Boolean);
    for (const id of ids) {
      if (id && !map.get(key).subscriptionIds.includes(id)) map.get(key).subscriptionIds.push(id);
    }
  }
  return Array.from(map.values());
}

async function fetchSupabasePrayerRegistrations(env) {
  const apiPath =
    "/rest/v1/prayer_push_registrations?enabled=eq.true&select=device_id,subscription_id,lat,lon,timezone,method_angle,asr_factor,advance_minutes,tahajjud_mode,city,last_synced_at";

  const candidates = [];
  const envUrl = String(env.SUPABASE_URL || "").replace(/\/$/, "");
  const envKey = String(env.SUPABASE_ANON_KEY || env.SUPABASE_KEY || "").trim();
  if (envUrl && envKey) candidates.push({ url: envUrl, key: envKey, label: "env" });
  candidates.push({ url: DEFAULT_SUPABASE_URL, key: DEFAULT_SUPABASE_ANON_KEY, label: "default" });

  const seen = new Set();
  let lastError = null;

  for (const candidate of candidates) {
    const sig = `${candidate.url}|${candidate.key.slice(0, 12)}`;
    if (seen.has(sig)) continue;
    seen.add(sig);

    try {
      const res = await fetch(`${candidate.url}${apiPath}`, {
        headers: {
          apikey: candidate.key,
          Authorization: `Bearer ${candidate.key}`,
          Accept: "application/json"
        }
      });
      const text = await res.text();
      if (!res.ok) {
        lastError = `${candidate.label}: HTTP ${res.status} ${text.slice(0, 160)}`;
        continue;
      }
      const rows = text ? JSON.parse(text) : [];
      if (!Array.isArray(rows)) {
        lastError = `${candidate.label}: ungültige Antwort`;
        continue;
      }
      const registrations = rows
        .filter((row) => row.subscription_id && Number.isFinite(Number(row.lat)) && Number.isFinite(Number(row.lon)))
        .map((row) => ({
          id: row.subscription_id,
          external_user_id: row.device_id,
          invalid_identifier: false,
          notification_types: 1,
          subscriptionIds: [row.subscription_id],
          tags: {
            prayer_notifications: "true",
            prayer_lat: String(row.lat),
            prayer_lon: String(row.lon),
            prayer_timezone: String(row.timezone || "Europe/Berlin"),
            prayer_method: String(row.method_angle || 12),
            prayer_asr_factor: String(row.asr_factor || 1),
            prayer_advance_minutes: String(row.advance_minutes || DEFAULT_PRAYER_ADVANCE_MINUTES),
            prayer_tahajjud_mode: String(row.tahajjud_mode || "off")
          },
          source: "supabase",
          last_synced_at: row.last_synced_at || null
        }));
      return {
        registrations,
        meta: {
          ok: true,
          source: candidate.label,
          url: candidate.url,
          count: registrations.length
        }
      };
    } catch (err) {
      lastError = `${candidate.label}: ${err.message || String(err)}`;
    }
  }

  return {
    registrations: [],
    meta: { ok: false, error: lastError || "Supabase nicht erreichbar", count: 0 }
  };
}

function mergePrayerPlayers(oneSignalPlayers, supabaseRegistrations) {
  const bySub = new Map();
  for (const player of oneSignalPlayers) {
    const ids = player.subscriptionIds?.length ? player.subscriptionIds : [player.id].filter(Boolean);
    for (const id of ids) {
      if (!id) continue;
      bySub.set(id, { ...player, tags: { ...(player.tags || {}) }, subscriptionIds: [id] });
    }
  }
  for (const player of supabaseRegistrations) {
    const id = player.subscriptionIds?.[0] || player.id;
    if (!id) continue;
    const existing = bySub.get(id);
    const tags = { ...(existing?.tags || {}), ...(player.tags || {}) };
    if (!tags.prayer_lat && player.tags?.prayer_lat) Object.assign(tags, player.tags);
    if (!tags.prayer_notifications && player.tags?.prayer_notifications) tags.prayer_notifications = player.tags.prayer_notifications;
    bySub.set(id, { ...(existing || player), tags, subscriptionIds: [id], source: existing ? "merged" : "supabase" });
  }
  return Array.from(bySub.values());
}

function filterGroupsBySubscription(groups, subscriptionId) {
  const sid = String(subscriptionId || "").trim();
  if (!sid) return groups;
  return groups
    .map((group) => ({ ...group, subscriptionIds: group.subscriptionIds.filter((id) => id === sid) }))
    .filter((group) => group.subscriptionIds.length > 0);
}

function formatHourFromUtcDate(date, timeZone) {
  const parts = getLocalParts(date, timeZone);
  return formatHour(parts.hour + parts.minute / 60 + parts.second / 3600);
}

function pickPrayerMessage(prayer, sendAfter, group) {
  const list = PRAYER_NOTIFICATION_MESSAGES[prayer.key] || PRAYER_NOTIFICATION_MESSAGES.default;
  const seed = `${prayer.key}|${sendAfter.toISOString()}|${group.timeZone}|${group.lat.toFixed(3)}|${group.lon.toFixed(3)}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash + seed.charCodeAt(i)) % 9973;
  return list[hash % list.length];
}

function prayerTimeLabel(prayer, sendAfter, timeZone) {
  if (prayer.time != null) return formatHour(prayer.time);
  if (sendAfter && timeZone) return formatHourFromUtcDate(sendAfter, timeZone);
  return "--:--";
}

function prayerNotificationTitle(prayer, mode, group) {
  if (prayer.key === "tahajjud") {
    const advanceMinutes = normalizeAdvanceMinutes(group?.advanceMinutes);
    return mode === "advance" ? `Taḥajjud in ${advanceMinutes} Min` : "Taḥajjud-Erinnerung";
  }
  const advanceMinutes = normalizeAdvanceMinutes(group?.advanceMinutes);
  return mode === "advance" ? `${prayer.name} in ${advanceMinutes} Min` : `${prayer.name} ist eingetreten`;
}

function prayerNotificationCopy(prayer, mode, group) {
  const isTahajjud = prayer.key === "tahajjud";
  const timeLabel = prayer.time == null ? "" : formatHour(prayer.time);
  const advanceMinutes = normalizeAdvanceMinutes(group?.advanceMinutes);

  if (mode === "advance") {
    return {
      headings: {
        de: prayerNotificationTitle(prayer, mode, group),
        en: prayerNotificationTitle(prayer, mode, group)
      },
      contents: {
        de: isTahajjud
          ? "Taḥajjud-Erinnerung ist bald."
          : `In ${advanceMinutes} Min · ${timeLabel} Uhr.`,
        en: isTahajjud
          ? "Taḥajjud-Erinnerung ist bald."
          : `In ${advanceMinutes} Min · ${timeLabel} Uhr.`
      }
    };
  }

  return {
    headings: {
      de: prayerNotificationTitle(prayer, mode, group),
      en: prayerNotificationTitle(prayer, mode, group)
    },
    contents: {
      de: isTahajjud
        ? "Die letzte Nachtzeit ist eine Gelegenheit für Duʿāʾ, Reue und Nähe zu Allah."
        : "",
      en: isTahajjud
        ? "Die letzte Nachtzeit ist eine Gelegenheit für Duʿāʾ, Reue und Nähe zu Allah."
        : ""
    }
  };
}

function scheduleIdentity(group, prayer, sendAfter, mode) {
  return ["prayer", mode, prayer.key, sendAfter.toISOString(), group.lat.toFixed(3), group.lon.toFixed(3), group.timeZone, group.methodAngle, group.asrFactor, group.advanceMinutes, group.tahajjudMode].join("|");
}

async function deterministicUuid(seed) {
  const data = new TextEncoder().encode(seed);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(hash.slice(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function postOneSignalNotification(env, body) {
  const apiKey = oneSignalApiKey(env);
  if (!apiKey) throw new Error("OneSignal API Key fehlt am Worker");

  let lastError = "Unbekannter Fehler";
  for (const authMode of ["Key", "Basic"]) {
    const res = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `${authMode} ${apiKey}`
      },
      body: JSON.stringify(body)
    });
    const text = await res.text();
    if (res.ok) {
      let parsed = {};
      try { parsed = text ? JSON.parse(text) : {}; } catch (e) {}
      return { ok: true, status: res.status, text, parsed, recipients: parsed.recipients || parsed.id || null };
    }
    lastError = `OneSignal ${res.status} (${authMode}): ${text.slice(0, 240)}`;
  }
  throw new Error(lastError);
}

function prayerKv(env) {
  return env.PRAYER_PUSH_KV || null;
}

async function wasPushAlreadySent(env, identity) {
  const kv = prayerKv(env);
  if (!kv) return false;
  return Boolean(await kv.get(`${KV_SENT_PREFIX}${identity}`));
}

async function markPushSent(env, identity, sendAfter) {
  const kv = prayerKv(env);
  if (!kv) return;
  const ttl = Math.max(3600, Math.ceil((sendAfter.getTime() - Date.now()) / 1000) + 86400);
  await kv.put(`${KV_SENT_PREFIX}${identity}`, new Date().toISOString(), { expirationTtl: ttl });
}

async function readStoredPrayerStatus(env) {
  const kv = prayerKv(env);
  if (!kv) return null;
  try {
    const raw = await kv.get(KV_STATUS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

export async function readPrayerPushStatusFromKv(env) {
  return readStoredPrayerStatus(env);
}

async function writeStoredPrayerStatus(env, report) {
  const kv = prayerKv(env);
  if (!kv) return { saved: false, reason: "PRAYER_PUSH_KV nicht gebunden" };
  try {
    await kv.put(KV_STATUS_KEY, JSON.stringify(report));
    return { saved: true, storage: "kv" };
  } catch (err) {
    return { saved: false, reason: err.message || String(err) };
  }
}

async function appendErrorLog(env, entry) {
  const kv = prayerKv(env);
  if (!kv) return;
  try {
    const raw = await kv.get(KV_ERROR_LOG_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.unshift({ at: new Date().toISOString(), ...entry });
    await kv.put(KV_ERROR_LOG_KEY, JSON.stringify(list.slice(0, 50)));
  } catch (err) {
    // ignore KV log failures
  }
}

function buildUserRegistry(players, users) {
  return users.map((user) => {
    const tags = user.tags || {};
    const subscriptionId = (user.subscriptionIds?.[0] || user.id || "").trim();
    const advanceMinutes = normalizeAdvanceMinutes(tags.prayer_advance_minutes);
    return {
      subscriptionId,
      location: {
        lat: tags.prayer_lat || null,
        lon: tags.prayer_lon || null,
        city: tags.prayer_city || null
      },
      timezone: tags.prayer_timezone || null,
      pushActive: tags.prayer_notifications === "true" || tags.prayer_notifications === true,
      advanceReminderActive: advanceMinutes > 0,
      advanceMinutes,
      tahajjudMode: normalizeTahajjudMode(tags.prayer_tahajjud_mode || tags.prayer_tahajjud),
      source: user.source || "onesignal"
    };
  }).filter((row) => row.subscriptionId);
}

async function storeUserRegistry(env, registry) {
  const kv = prayerKv(env);
  if (!kv) return;
  try {
    await kv.put(KV_USERS_KEY, JSON.stringify({ updatedAt: new Date().toISOString(), users: registry }));
  } catch (err) {
    // ignore
  }
}

function computeNextPlannedPush(groups, now = new Date()) {
  let next = null;
  for (const group of groups) {
    const localDate = todayLocalDate(group.timeZone);
    const localDates = [localDate, addLocalDays(localDate, 1)];
    for (const dateForSchedule of localDates) {
      const prayers = calculatePrayerTimes(
        dateForSchedule,
        group.lat,
        group.lon,
        group.timeZone,
        group.methodAngle,
        group.asrFactor,
        group.tahajjudMode
      );
      for (const prayer of prayers) {
        const entryAt = prayer.sendAfter
          ? prayer.sendAfter
          : prayer.time == null
            ? null
            : makeUtcDateFromLocal(dateForSchedule, prayer.time, group.timeZone);
        if (!entryAt) continue;
        const schedules = [{ mode: "entry", sendAfter: entryAt }];
        if (prayer.key !== "sunrise" && prayer.key !== "tahajjud") {
          schedules.push({
            mode: "advance",
            sendAfter: new Date(entryAt.getTime() - normalizeAdvanceMinutes(group.advanceMinutes) * 60 * 1000)
          });
        }
        for (const schedule of schedules) {
          if (schedule.sendAfter <= now) continue;
          if (!next || schedule.sendAfter < next.sendAfter) {
            next = {
              prayer: prayer.name,
              key: prayer.key,
              mode: schedule.mode,
              sendAfter: schedule.sendAfter.toISOString(),
              time: prayer.time == null ? null : formatHour(prayer.time),
              timeZone: group.timeZone
            };
          }
        }
      }
    }
  }
  return next;
}

async function sendOneSignalToSubscriptions(env, group, prayer, sendAfter, mode, stats) {
  const ids = group.subscriptionIds.slice(0, 2000);
  if (!ids.length) return;

  const identity = scheduleIdentity(group, prayer, sendAfter, mode);
  if (await wasPushAlreadySent(env, identity)) {
    if (stats) stats.duplicates += 1;
    return;
  }

  const copy = prayerNotificationCopy(prayer, mode, group);
  if (mode === "entry") {
    const message = pickPrayerMessage(prayer, sendAfter, group);
    copy.contents.de = message;
    copy.contents.en = message;
  }
  const siteUrl = String(env.SITE_URL || DEFAULT_SITE_URL);
  const appId = String(env.ONESIGNAL_APP_ID || DEFAULT_ONESIGNAL_APP_ID).trim();
  const idempotencyKey = await deterministicUuid(scheduleIdentity(group, prayer, sendAfter, mode));

  const body = withNotificationIcons({
    app_id: appId,
    target_channel: "push",
    include_subscription_ids: ids,
    headings: copy.headings,
    contents: copy.contents,
    url: siteUrl,
    isAnyWeb: true,
    idempotency_key: idempotencyKey
  }, env);

  if (sendAfter.getTime() - Date.now() > 30 * 1000) {
    body.send_after = sendAfter.toISOString();
  }

  const timeLabel = prayer.time == null ? sendAfter.toISOString() : formatHour(prayer.time);

  try {
    const result = await postOneSignalNotification(env, body);
    await markPushSent(env, identity, sendAfter);
    if (stats) {
      stats.scheduled += 1;
      stats.sentToday = stats.sentToday || [];
      stats.sentToday.push({
        identity,
        prayer: prayer.key,
        mode,
        sendAfter: sendAfter.toISOString(),
        at: new Date().toISOString()
      });
      stats.recipients += ids.length;
      stats.planned.push({
        prayer: prayer.name,
        key: prayer.key,
        mode,
        time: timeLabel,
        sendAfter: sendAfter.toISOString(),
        recipients: ids.length,
        timeZone: group.timeZone
      });
      stats.oneSignalResponses.push({
        prayer: prayer.key,
        mode,
        recipients: ids.length,
        response: String(result.text || "").slice(0, 240)
      });
    }
    return result;
  } catch (err) {
    if (stats) {
      stats.errors += 1;
      stats.errorDetails = stats.errorDetails || [];
      stats.errorDetails.push(`${mode} ${prayer.name}: ${err.message || String(err)}`);
    }
    throw err;
  }
}

function localDateKey(date, timeZone) {
  const p = getLocalParts(date, timeZone);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

function buildTodayPrayerOverview(planned, skippedPastDetails, reference = REFERENCE_LOCATION) {
  const localDate = todayLocalDate(reference.timeZone);
  const dateKey = localDateKey(new Date(), reference.timeZone);
  const prayers = calculatePrayerTimes(localDate, reference.lat, reference.lon, reference.timeZone, 12, 1, "off");
  const keys = ["fajr", "dhuhr", "asr", "maghrib", "isha", "tahajjud"];
  const overview = {};

  for (const key of keys) {
    const ref = prayers.find((p) => p.key === key);
    const time = ref?.time == null ? null : formatHour(ref.time);
    const advancePlanned = planned.filter((p) => p.key === key && p.mode === "advance" && localDateKey(new Date(p.sendAfter), reference.timeZone) === dateKey);
    const entryPlanned = planned.filter((p) => p.key === key && p.mode === "entry" && localDateKey(new Date(p.sendAfter), reference.timeZone) === dateKey);
    const skipped = skippedPastDetails.filter((p) => p.key === key);
    const advanceRecipients = advancePlanned.reduce((sum, p) => sum + (p.recipients || 0), 0);
    const entryRecipients = entryPlanned.reduce((sum, p) => sum + (p.recipients || 0), 0);

    overview[key] = {
      name: ref?.name || key,
      time,
      advance: {
        status: advancePlanned.length ? "geplant" : skipped.some((s) => s.mode === "advance") ? "übersprungen" : "nicht geplant",
        sendAfter: advancePlanned[0]?.sendAfter || skipped.find((s) => s.mode === "advance")?.sendAfter || null,
        recipients: advanceRecipients,
        count: advancePlanned.length
      },
      entry: {
        status: entryPlanned.length ? "geplant" : skipped.some((s) => s.mode === "entry") ? "übersprungen" : "nicht geplant",
        sendAfter: entryPlanned[0]?.sendAfter || skipped.find((s) => s.mode === "entry")?.sendAfter || null,
        recipients: entryRecipients,
        count: entryPlanned.length
      }
    };
  }

  return { date: dateKey, reference: `${reference.city} · ${reference.timeZone}`, prayers: overview };
}

function buildPrayerDiagnostics(overview) {
  const keys = ["fajr", "dhuhr", "asr", "maghrib", "isha", "tahajjud"];
  const diagnostics = {};
  keys.forEach((key) => {
    const p = overview?.prayers?.[key];
    if (!p) return;
    const entryOk = p.entry?.status === "geplant";
    const advanceOk = p.advance?.status === "geplant";
    let answer;
    if (entryOk && advanceOk) {
      answer = `${p.name} ${p.time}: Vorab und Gebetszeit geplant (${p.entry.recipients} Empfänger).`;
    } else if (entryOk) {
      answer = `${p.name} ${p.time}: Gebetszeit geplant, Vorab ${p.advance?.status || "offen"}.`;
    } else if (p.entry?.status === "übersprungen") {
      answer = `${p.name} ${p.time}: übersprungen – Scheduler zu spät oder Zeitfenster vorbei.`;
    } else {
      answer = `${p.name} ${p.time || "--:--"}: nicht geplant – keine Empfänger oder außerhalb des Fensters.`;
    }
    diagnostics[key] = { name: p.name, time: p.time, advance: p.advance, entry: p.entry, answer };
  });
  return diagnostics;
}

async function writePrayerPushStatus(env, report, deps) {
  const { githubGet, githubPut, base64ToUtf8, utf8ToBase64 } = deps;
  const owner = env.GITHUB_OWNER || "Sero91ak";
  const repo = env.GITHUB_REPO || "dar-al-tawhid-site";
  const branch = env.GITHUB_BRANCH || "main";
  const statusPath = env.PRAYER_STATUS_PATH || DEFAULT_PRAYER_STATUS_PATH;
  const content = `${JSON.stringify(report, null, 2)}\n`;

  if (!env.GITHUB_TOKEN) {
    return { saved: false, reason: "GITHUB_TOKEN fehlt – Status nur im Worker-Lauf" };
  }

  try {
    const existing = await githubGet(env, owner, repo, statusPath, branch);
    await githubPut(env, owner, repo, statusPath, content, `Prayer push status ${report.updatedAt}`, branch, existing?.sha);
    return { saved: true, path: statusPath };
  } catch (err) {
    return { saved: false, reason: err.message || String(err) };
  }
}

/**
 * Haupt-Scheduler: liest Nutzer, plant Pushs, schreibt Status.
 */
export async function runPrayerPushScheduler(env, options = {}, deps = {}) {
  const subscriptionId = String(options.subscriptionId || options.subscription_id || "").trim();
  const force = Boolean(options.force);
  const lookaheadMinutes = Number(env.PRAYER_SCHEDULE_LOOKAHEAD_MINUTES || SCHEDULE_LOOKAHEAD_MINUTES);
  const graceMinutes = Number(env.PRAYER_SCHEDULE_GRACE_MINUTES || SCHEDULE_GRACE_MINUTES);

  if (!oneSignalApiKey(env)) {
    return {
      ok: false,
      triggered: false,
      schedulerStatus: "error",
      reason: "OneSignal API Key fehlt am Worker – Gebetszeiten-Scheduler kann nicht senden.",
      lastError: "ONESIGNAL_API_KEY_NEW fehlt"
    };
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - graceMinutes * 60 * 1000);
  const windowEnd = new Date(now.getTime() + lookaheadMinutes * 60 * 1000);
  const stats = {
    scheduled: 0,
    skippedPast: 0,
    skippedWindow: 0,
    duplicates: 0,
    recipients: 0,
    errors: 0,
    planned: [],
    skippedPastDetails: [],
    oneSignalResponses: [],
    errorDetails: []
  };

  let oneSignalPlayers = [];
  let oneSignalSource = "users";
  let oneSignalTagResolveCount = 0;
  try {
    const result = await fetchSubscriptions(env);
    oneSignalPlayers = result.players;
    oneSignalSource = result.source;
    oneSignalTagResolveCount = result.tagResolveCount || 0;
  } catch (err) {
    return {
      ok: false,
      triggered: false,
      schedulerStatus: "error",
      reason: `OneSignal-Subscriptions nicht lesbar: ${err.message || err}`,
      lastError: err.message || String(err)
    };
  }

  const supabaseResult = await fetchSupabasePrayerRegistrations(env);
  const supabaseRegistrations = supabaseResult.registrations || [];
  const supabaseMeta = supabaseResult.meta || { ok: false, count: 0 };
  const players = mergePrayerPlayers(oneSignalPlayers, supabaseRegistrations);
  const users = getPrayerUsers(players);
  let groups = groupUsers(users);

  if (subscriptionId) {
    groups = filterGroupsBySubscription(groups, subscriptionId);
  }

  const taggedCount = players.filter((p) => p.tags?.prayer_notifications === "true" && p.tags?.prayer_lat).length;

  for (const group of groups) {
    const localDate = todayLocalDate(group.timeZone);
    const localDates = [addLocalDays(localDate, -1), localDate, addLocalDays(localDate, 1), addLocalDays(localDate, 2)];
    const plannedInRun = new Set();

    for (const dateForSchedule of localDates) {
      const prayers = calculatePrayerTimes(
        dateForSchedule,
        group.lat,
        group.lon,
        group.timeZone,
        group.methodAngle,
        group.asrFactor,
        group.tahajjudMode
      );

      for (const prayer of prayers) {
        const entryAt = prayer.sendAfter
          ? prayer.sendAfter
          : prayer.time == null
            ? null
            : makeUtcDateFromLocal(dateForSchedule, prayer.time, group.timeZone);

        if (!entryAt) continue;

        const schedules = [{ mode: "entry", sendAfter: entryAt }];
        if (prayer.key !== "sunrise" && prayer.key !== "tahajjud") {
          const advanceAt = new Date(entryAt.getTime() - normalizeAdvanceMinutes(group.advanceMinutes) * 60 * 1000);
          schedules.push({ mode: "advance", sendAfter: advanceAt });
        }

        for (const schedule of schedules) {
          const identity = scheduleIdentity(group, prayer, schedule.sendAfter, schedule.mode);
          if (plannedInRun.has(identity)) {
            stats.duplicates += 1;
            continue;
          }
          plannedInRun.add(identity);

          if (schedule.sendAfter < windowStart) {
            stats.skippedPast += 1;
            stats.skippedPastDetails.push({
              key: prayer.key,
              prayer: prayer.name,
              mode: schedule.mode,
              sendAfter: schedule.sendAfter.toISOString(),
              time: prayer.time == null ? prayer.name : formatHour(prayer.time),
              timeZone: group.timeZone,
              reason: "vorbei"
            });
            continue;
          }

          if (schedule.sendAfter > windowEnd) {
            stats.skippedWindow += 1;
            continue;
          }

          try {
            await sendOneSignalToSubscriptions(env, group, prayer, schedule.sendAfter, schedule.mode, stats);
          } catch (err) {
            // errors counted in sendOneSignalToSubscriptions
          }
        }
      }
    }
  }

  const userRegistry = buildUserRegistry(players, users);
  await storeUserRegistry(env, userRegistry);
  const nextPlannedPush = computeNextPlannedPush(groups, now);
  const todayOverview = buildTodayPrayerOverview(stats.planned, stats.skippedPastDetails);
  const prayerDiagnostics = buildPrayerDiagnostics(todayOverview);
  const maghribDiag = prayerDiagnostics.maghrib || todayOverview.prayers.maghrib || null;
  const sentTodayCount = (stats.sentToday || []).length;

  const lastError = stats.errors
    ? (stats.errorDetails?.[0] || "OneSignal API Fehler beim Planen")
    : (users.length === 0
      ? (supabaseMeta.ok
        ? `Keine aktiven Registrierungen (Supabase: ${supabaseMeta.count}, OneSignal mit Tags: ${taggedCount})`
        : `Keine Nutzer gefunden. Supabase-Fehler: ${supabaseMeta.error || "unbekannt"}`)
      : null);

  const statusReport = {
    updatedAt: new Date().toISOString(),
    ok: stats.errors === 0 && users.length > 0,
    schedulerStatus: stats.errors ? "error" : users.length ? "success" : "warning",
    schedulerEngine: "cloudflare-worker-cron",
    cronIntervalMinutes: 5,
    lastCronRun: new Date().toISOString(),
    nextPlannedPush,
    sentTodayCount,
    userRegistry: userRegistry.slice(0, 100),
    windowStart: windowStart.toISOString(),
    windowEnd: windowEnd.toISOString(),
    graceMinutes,
    lookaheadMinutes,
    subscriptionsTotal: players.length,
    subscriptionsOneSignal: oneSignalPlayers.length,
    subscriptionsSupabase: supabaseRegistrations.length,
    oneSignalSource,
    oneSignalTagResolveCount,
    supabaseMeta,
    usersWithLocation: users.length,
    usersWithActivePush: users.length,
    locationGroups: groups.length,
    scheduled: stats.scheduled,
    recipients: stats.recipients,
    skippedPast: stats.skippedPast,
    skippedWindow: stats.skippedWindow,
    duplicates: stats.duplicates,
    errors: stats.errors,
    lastError,
    today: todayOverview,
    prayerDiagnostics,
    maghribDiagnostic: maghribDiag ? {
      plannedAdvance: maghribDiag.advance?.status,
      plannedEntry: maghribDiag.entry?.status,
      time: maghribDiag.time,
      advanceRecipients: maghribDiag.advance?.recipients,
      entryRecipients: maghribDiag.entry?.recipients,
      answer: maghribDiag.answer || ""
    } : null,
    planned: stats.planned.slice(0, 80),
    skippedPastDetails: stats.skippedPastDetails.slice(0, 40),
    oneSignalResponses: stats.oneSignalResponses.slice(0, 20)
  };

  const kvWrite = await writeStoredPrayerStatus(env, statusReport);
  let statusWrite = kvWrite;
  if (deps.githubGet && deps.githubPut && env.GITHUB_TOKEN) {
    const ghWrite = await writePrayerPushStatus(env, statusReport, deps);
    statusWrite = { ...kvWrite, github: ghWrite };
  }
  if (stats.errors) {
    await appendErrorLog(env, {
      errors: stats.errors,
      details: stats.errorDetails?.slice(0, 5) || [],
      scheduled: stats.scheduled
    });
  }

  const reason = stats.errors
    ? `Scheduler-Fehler: ${stats.errorDetails?.[0] || "OneSignal-Fehler"} – ${stats.scheduled} Pushs geplant, ${stats.errors} Fehler`
    : users.length === 0
      ? "Scheduler lief, aber keine Nutzer mit aktivem Gebets-Push und Standort gefunden. Kein Gebets-Push wurde geplant."
      : `Scheduler erfolgreich: ${stats.scheduled} Pushs geplant für ${stats.recipients} Empfänger in ${groups.length} Gruppen`;

  return {
    ok: stats.errors === 0,
    triggered: true,
    schedulerStatus: statusReport.schedulerStatus,
    reason,
    status: statusReport,
    statusWrite,
    usersWithLocation: users.length,
    usersWithActivePush: users.length,
    locationGroups: groups.length,
    scheduled: stats.scheduled,
    recipients: stats.recipients,
    errors: stats.errors,
    lastError,
    taggedCount,
    force
  };
}
