#!/usr/bin/env node
/* DAR AL TAWḤID – standortbasierte OneSignal-Gebetszeiten-Automatisierung
   GitHub Actions liest OneSignal-Subscriptions, prüft Nutzer-Tags und plant Pushs pro Standort. */

const APP_ID = process.env.ONESIGNAL_APP_ID || "786d7cd6-0455-4434-ab14-0c10a7bc6b1e";
const API_KEY = process.env.ONESIGNAL_APP_API_KEY;
const SITE_URL = process.env.SITE_URL || "https://dar-al-tawhid.de/#prayer";
const crypto = require("crypto");
const {
  withNotificationIcons,
  postOneSignalNotification
} = require("./lib/onesignal-push");
const DEFAULT_PRAYER_ADVANCE_MINUTES = Number(process.env.PRAYER_ADVANCE_MINUTES || 15);
const SCHEDULE_LOOKAHEAD_MINUTES = Number(process.env.PRAYER_SCHEDULE_LOOKAHEAD_MINUTES || (26 * 60));
const SCHEDULE_GRACE_MINUTES = Number(process.env.PRAYER_SCHEDULE_GRACE_MINUTES || 15);
const SUPABASE_URL = String(process.env.SUPABASE_URL || "https://djyfkttjbdraynuxrzno.supabase.co").replace(/\/$/, "");
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqeWZrdHRqYmRyYXludXhyem5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NjE1MTUsImV4cCI6MjA5NjQzNzUxNX0.PUzkuxpJVWeW64nSAVW61KqYDE5k1d4sAir2unXKjxw";
const ONESIGNAL_AUTH_KEY = String(API_KEY || "")
  .replace(/\s+/g, "")
  .replace(/^(Key|Basic)/i, "")
  .trim();

if (!API_KEY) {
  console.error("Fehlt: GitHub Secret ONESIGNAL_APP_API_KEY");
  process.exit(1);
}

async function fetchOneSignalJson(url, options = {}) {
  let last = null;

  for (const authMode of ["Key", "Basic"]) {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `${authMode} ${ONESIGNAL_AUTH_KEY}`
      }
    });
    const text = await res.text();

    if (res.ok) {
      return text ? JSON.parse(text) : {};
    }

    last = new Error(`OneSignal ${res.status} (${authMode}): ${text}`);
  }

  throw last || new Error("OneSignal API request failed");
}

function toRad(d) {
  return d * Math.PI / 180;
}

function toDeg(r) {
  return r * 180 / Math.PI;
}

function fixAngle(a) {
  return ((a % 360) + 360) % 360;
}

function fixHour(h) {
  return ((h % 24) + 24) % 24;
}

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

  const utcAsLocal = Date.UTC(
    local.year,
    local.month - 1,
    local.day,
    local.hour,
    local.minute,
    local.second
  );

  return Math.round((utcAsLocal - date.getTime()) / 60000);
}

function makeUtcDateFromLocal(localDate, hourDecimal, timeZone) {
  const h = Math.floor(fixHour(hourDecimal));
  const m = Math.round((fixHour(hourDecimal) - h) * 60);
  const minutes = h * 60 + m;

  const localMidnightUtcGuess = Date.UTC(
    localDate.year,
    localDate.month - 1,
    localDate.day,
    0,
    0,
    0
  );

  const guess = new Date(localMidnightUtcGuess + minutes * 60000);
  const offset = getTimeZoneOffsetMinutes(guess, timeZone);

  return new Date(localMidnightUtcGuess + minutes * 60000 - offset * 60000);
}

function todayLocalDate(timeZone) {
  const now = new Date();
  const p = getLocalParts(now, timeZone);

  return {
    year: p.year,
    month: p.month,
    day: p.day
  };
}

function dayOfYearFromLocal(localDate) {
  const start = Date.UTC(localDate.year, 0, 0);
  const current = Date.UTC(localDate.year, localDate.month - 1, localDate.day);

  return Math.floor((current - start) / 86400000);
}

function addLocalDays(localDate, days) {
  const d = new Date(Date.UTC(localDate.year, localDate.month - 1, localDate.day + days));
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate()
  };
}

function sunTimeForAngle(localDate, lat, lon, angle, morning, timeZone) {
  const N = dayOfYearFromLocal(localDate);
  const lngHour = lon / 15;
  const t = N + (((morning ? 6 : 18) - lngHour) / 24);

  const M = (0.9856 * t) - 3.289;

  let L =
    M +
    (1.916 * Math.sin(toRad(M))) +
    (0.020 * Math.sin(toRad(2 * M))) +
    282.634;

  L = fixAngle(L);

  let RA = toDeg(Math.atan(0.91764 * Math.tan(toRad(L))));
  RA = fixAngle(RA);

  const Lquadrant = Math.floor(L / 90) * 90;
  const RAquadrant = Math.floor(RA / 90) * 90;

  RA = (RA + (Lquadrant - RAquadrant)) / 15;

  const sinDec = 0.39782 * Math.sin(toRad(L));
  const cosDec = Math.cos(Math.asin(sinDec));

  const zenith = 90 + angle;

  const cosH =
    (Math.cos(toRad(zenith)) - (sinDec * Math.sin(toRad(lat)))) /
    (cosDec * Math.cos(toRad(lat)));

  if (cosH > 1 || cosH < -1) return null;

  let H = morning
    ? 360 - toDeg(Math.acos(cosH))
    : toDeg(Math.acos(cosH));

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

  const angle = toDeg(
    Math.atan(1 / (factor + Math.tan(toRad(Math.abs(lat - dec)))))
  );

  const cosH =
    (Math.sin(toRad(angle)) - Math.sin(toRad(lat)) * Math.sin(toRad(dec))) /
    (Math.cos(toRad(lat)) * Math.cos(toRad(dec)));

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
        prayers.push({
          key: "tahajjud",
          name: "Taḥajjud",
          time: null,
          sendAfter: startUtc
        });
      }
    }
  }

  return prayers;
}

async function fetchLegacyPlayers() {
  const all = [];
  let offset = 0;
  const limit = 300;

  while (true) {
    const url =
      `https://onesignal.com/api/v1/players?app_id=${encodeURIComponent(APP_ID)}&limit=${limit}&offset=${offset}`;

    const data = await fetchOneSignalJson(url);
    const players = Array.isArray(data.players) ? data.players : [];

    all.push(...players);

    if (players.length < limit) break;

    offset += limit;
  }

  return all;
}

function normalizeUserRecord(user) {
  const subscriptions = extractWebPushSubscriptionIds(user);
  const tags = extractUserTags(user);
  const externalId =
    user?.identity?.external_id ||
    user?.aliases?.external_id ||
    user?.external_id ||
    null;

  return {
    id: subscriptions[0] || user?.id || user?.onesignal_id || externalId,
    external_user_id: externalId,
    invalid_identifier: false,
    notification_types: 1,
    tags,
    subscriptionIds: subscriptions
  };
}

async function fetchAppUsers() {
  const all = [];
  let offset = 0;
  const limit = 300;

  while (true) {
    const url =
      `https://api.onesignal.com/apps/${encodeURIComponent(APP_ID)}/users?limit=${limit}&offset=${offset}`;

    const data = await fetchOneSignalJson(url);
    const users = Array.isArray(data.users)
      ? data.users
      : Array.isArray(data.items)
        ? data.items
        : Array.isArray(data)
          ? data
          : [];

    all.push(...users.map(normalizeUserRecord));

    if (users.length < limit) break;

    offset += limit;
  }

  return all;
}

async function fetchUserByAlias(aliasLabel, aliasId) {
  const url = `https://api.onesignal.com/apps/${encodeURIComponent(APP_ID)}/users/by/${encodeURIComponent(aliasLabel)}/${encodeURIComponent(aliasId)}`;
  try {
    return await fetchOneSignalJson(url);
  } catch (err) {
    return null;
  }
}

async function fetchUserByExternalId(externalId) {
  return fetchUserByAlias("external_id", externalId);
}

async function fetchUserBySubscriptionId(subscriptionId) {
  const url = `https://api.onesignal.com/apps/${encodeURIComponent(APP_ID)}/subscriptions/${encodeURIComponent(subscriptionId)}/user`;
  try {
    return await fetchOneSignalJson(url);
  } catch (err) {
    return null;
  }
}

function extractUserTags(user) {
  if (!user) return {};
  const candidates = [
    user?.properties?.tags,
    user?.tags,
    user?.properties?.custom_tags,
    user?.custom_tags
  ];

  for (const tags of candidates) {
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

async function resolvePlayerTags(player) {
  let tags = { ...(player.tags || {}) };
  let subscriptionIds = [player.id].filter(Boolean);
  const externalId = player.external_user_id || player.external_id;
  let user = null;

  if (externalId) {
    user = await fetchUserByExternalId(externalId);
  }

  if (!extractUserTags(user).prayer_lat && player.id) {
    const bySub = await fetchUserBySubscriptionId(player.id);
    if (bySub) user = bySub;
  }

  if (user) {
    tags = { ...tags, ...extractUserTags(user) };
    const webIds = extractWebPushSubscriptionIds(user);
    if (webIds.length) subscriptionIds = webIds;
  }

  return { tags, subscriptionIds, externalId };
}

async function fetchSubscriptions() {
  let players = [];
  let source = "users";

  try {
    players = await fetchAppUsers();
  } catch (err) {
    console.warn(`Neue OneSignal-User-Liste nicht lesbar, Legacy-Fallback: ${err.message || err}`);
    source = "legacy";
    players = await fetchLegacyPlayers();
  }

  const enriched = [];
  let userFetchMisses = 0;
  let taggedUsers = 0;

  for (const player of players) {
    const resolved = source === "users"
      ? {
          tags: player.tags || {},
          subscriptionIds: player.subscriptionIds && player.subscriptionIds.length
            ? player.subscriptionIds
            : [player.id].filter(Boolean),
          externalId: player.external_user_id || player.external_id
        }
      : await resolvePlayerTags(player);

    if (resolved.tags.prayer_notifications === "true" && resolved.tags.prayer_lat) {
      taggedUsers += 1;
    } else if (resolved.externalId || player.id) {
      userFetchMisses += 1;
    }

    enriched.push({
      ...player,
      tags: resolved.tags,
      subscriptionIds: resolved.subscriptionIds
    });
  }

  console.log(`OneSignal-Quelle: ${source}`);
  console.log(`Tag-Auflösung: ${taggedUsers} mit Gebets-Tags, ${userFetchMisses} ohne Tags trotz Subscription`);

  return enriched;
}

function getPrayerUsers(players) {
  return players.filter(p => {
    const tags = p.tags || {};

    const active =
      tags.prayer_notifications === "true" ||
      tags.prayer_notifications === true;

    const hasLocation =
      tags.prayer_lat &&
      tags.prayer_lon &&
      tags.prayer_timezone;

    const subscribed =
      p.invalid_identifier !== true &&
      p.notification_types !== -2;

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

    const key = [
      lat.toFixed(3),
      lon.toFixed(3),
      timeZone,
      methodAngle,
      asrFactor,
      advanceMinutes,
      tahajjudMode
    ].join("|");

    if (!map.has(key)) {
      map.set(key, {
        lat,
        lon,
        timeZone,
        methodAngle,
        asrFactor,
        advanceMinutes,
        tahajjudMode,
        subscriptionIds: []
      });
    }

    const ids = user.subscriptionIds && user.subscriptionIds.length
      ? user.subscriptionIds
      : [user.id].filter(Boolean);

    for (const id of ids) {
      if (id && !map.get(key).subscriptionIds.includes(id)) {
        map.get(key).subscriptionIds.push(id);
      }
    }
  }

  return Array.from(map.values());
}

async function fetchSupabasePrayerRegistrations() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log("Supabase-Registrierungen: nicht konfiguriert");
    return [];
  }

  const url =
    `${SUPABASE_URL}/rest/v1/prayer_push_registrations?enabled=eq.true&select=device_id,subscription_id,lat,lon,timezone,method_angle,asr_factor,advance_minutes,tahajjud_mode,city,last_synced_at`;

  try {
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    const text = await res.text();

    if (!res.ok) {
      console.warn(`Supabase-Registrierungen nicht lesbar (${res.status}): ${text.slice(0, 240)}`);
      return [];
    }

    const rows = text ? JSON.parse(text) : [];

    if (!Array.isArray(rows)) return [];

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

    console.log(`Supabase-Registrierungen: ${registrations.length} aktiv`);
    return registrations;
  } catch (err) {
    console.warn(`Supabase-Registrierungen Fehler: ${err.message || err}`);
    return [];
  }
}

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

function pickPrayerMessage(prayer, sendAfter, group) {
  const list = PRAYER_NOTIFICATION_MESSAGES[prayer.key] || PRAYER_NOTIFICATION_MESSAGES.default;
  const seed = `${prayer.key}|${sendAfter.toISOString()}|${group.timeZone}|${group.lat.toFixed(3)}|${group.lon.toFixed(3)}`;
  const hash = crypto.createHash("sha256").update(seed).digest();
  return list[hash[0] % list.length];
}

function prayerNotificationTitle(prayer, mode, group) {
  if (prayer.key === "tahajjud") {
    return "Taḥajjud-Erinnerung";
  }

  const advanceMinutes = normalizeAdvanceMinutes(group?.advanceMinutes);
  return mode === "advance"
    ? `${prayer.name} in ${advanceMinutes} Min`
    : `${prayer.name} ist eingetreten`;
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

function deterministicUuid(seed) {
  const bytes = Buffer.from(crypto.createHash("sha256").update(seed).digest().subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function scheduleIdentity(group, prayer, sendAfter, mode) {
  return [
    "prayer",
    mode,
    prayer.key,
    sendAfter.toISOString(),
    group.lat.toFixed(3),
    group.lon.toFixed(3),
    group.timeZone,
    group.methodAngle,
    group.asrFactor,
    group.advanceMinutes,
    group.tahajjudMode
  ].join("|");
}

async function sendOneSignalToSubscriptions(group, prayer, sendAfter, mode = "entry") {
  const ids = group.subscriptionIds.slice(0, 2000);

  if (!ids.length) return;

  const copy = prayerNotificationCopy(prayer, mode, group);
  if (mode === "entry") {
    const message = pickPrayerMessage(prayer, sendAfter, group);
    copy.contents.de = message;
    copy.contents.en = message;
  }

  const body = withNotificationIcons({
    app_id: APP_ID,
    target_channel: "push",
    include_subscription_ids: ids,
    headings: copy.headings,
    contents: copy.contents,
    url: SITE_URL,
    isAnyWeb: true,
    idempotency_key: deterministicUuid(scheduleIdentity(group, prayer, sendAfter, mode))
  }, SITE_URL);

  if (sendAfter.getTime() - Date.now() > 60 * 1000) {
    body.send_after = sendAfter.toISOString();
  }

  try {
    const result = await postOneSignalNotification(body, API_KEY, { retries: 3 });
    const timeLabel = prayer.time == null
      ? sendAfter.toISOString()
      : formatHour(prayer.time);

    console.log(
      `Geplant (${mode}): ${prayer.name} ${timeLabel} | ${ids.length} Nutzer | ${group.timeZone} → ${result.text}`
    );
  } catch (err) {
    console.error(`OneSignal Sendefehler:`, err.message || err);
    process.exitCode = 1;
  }
}

(async function main() {
  const now = new Date();
  const windowStart = new Date(now.getTime() - SCHEDULE_GRACE_MINUTES * 60 * 1000);
  const windowEnd = new Date(now.getTime() + SCHEDULE_LOOKAHEAD_MINUTES * 60 * 1000);

  console.log("Lese OneSignal-Subscriptions mit Gebetszeiten-Tags...");
  console.log(`Planungsfenster: ${windowStart.toISOString()} bis ${windowEnd.toISOString()}`);

  const oneSignalPlayers = await fetchSubscriptions();
  const supabaseRegistrations = await fetchSupabasePrayerRegistrations();
  const players = [...oneSignalPlayers, ...supabaseRegistrations];
  const users = getPrayerUsers(players);
  const groups = groupUsers(users);

  console.log(`Subscriptions gesamt: ${players.length} (${oneSignalPlayers.length} OneSignal, ${supabaseRegistrations.length} Supabase)`);
  console.log(`Gebetszeiten-Nutzer mit Standort: ${users.length}`);
  console.log(`Standort-Gruppen: ${groups.length}`);

  if (!users.length && players.length) {
    const sample = players.find((p) => p.external_user_id || p.external_id) || players[0];
    console.log("Hinweis: Keine prayer_tags gefunden. Beispiel-Subscription:", JSON.stringify({
      id: sample.id,
      external_user_id: sample.external_user_id || sample.external_id || null,
      tags: sample.tags || {}
    }));
  }

  for (const group of groups) {
    const localDate = todayLocalDate(group.timeZone);
    const localDates = [
      addLocalDays(localDate, -1),
      localDate,
      addLocalDays(localDate, 1),
      addLocalDays(localDate, 2)
    ];
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

        const schedules = [
          { mode: "entry", sendAfter: entryAt }
        ];

        if (prayer.key !== "sunrise" && prayer.key !== "tahajjud") {
          const advanceAt = new Date(entryAt.getTime() - normalizeAdvanceMinutes(group.advanceMinutes) * 60 * 1000);
          schedules.push({ mode: "advance", sendAfter: advanceAt });
        }

        for (const schedule of schedules) {
          const identity = scheduleIdentity(group, prayer, schedule.sendAfter, schedule.mode);
          if (plannedInRun.has(identity)) continue;
          plannedInRun.add(identity);

          if (schedule.sendAfter < windowStart) {
            const label = prayer.time == null ? prayer.name : formatHour(prayer.time);
            console.log(`Übersprungen, bereits vorbei (${schedule.mode}): ${prayer.name} ${label} | ${group.timeZone}`);
            continue;
          }

          if (schedule.sendAfter > windowEnd) {
            continue;
          }

          await sendOneSignalToSubscriptions(group, prayer, schedule.sendAfter, schedule.mode);
        }
      }
    }
  }
})();
