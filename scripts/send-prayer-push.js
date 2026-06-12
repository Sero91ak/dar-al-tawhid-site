#!/usr/bin/env node
/* DAR AL TAWḤID – standortbasierte OneSignal-Gebetszeiten-Automatisierung
   GitHub Actions liest OneSignal-Subscriptions, prüft Nutzer-Tags und plant Pushs pro Standort. */

const APP_ID = process.env.ONESIGNAL_APP_ID || "786d7cd6-0455-4434-ab14-0c10a7bc6b1e";
const API_KEY = process.env.ONESIGNAL_API_KEY_NEW || process.env.ONESIGNAL_API_KEY || process.env.ONESIGNAL_APP_API_KEY;
const SITE_URL = process.env.SITE_URL || "https://dar-al-tawhid.de/#prayer";
const {
  withNotificationIcons,
  postOneSignalNotification
} = require("./lib/onesignal-push");
const PRAYER_ADVANCE_MINUTES = Number(process.env.PRAYER_ADVANCE_MINUTES || 15);

if (!API_KEY) {
  console.error("Fehlt: ONESIGNAL_API_KEY");
  process.exit(1);
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

function calculatePrayerTimes(localDate, lat, lon, timeZone, methodAngle, asrFactor) {
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

  if (maghrib != null && fajrNext != null) {
    const maghribUtc = makeUtcDateFromLocal(localDate, maghrib, timeZone);
    const fajrUtc = makeUtcDateFromLocal(tomorrow, fajrNext, timeZone);

    if (fajrUtc > maghribUtc) {
      const startUtc = new Date(
        maghribUtc.getTime() + ((fajrUtc.getTime() - maghribUtc.getTime()) * 2 / 3)
      );

      prayers.push({
        key: "tahajjud",
        name: "Taḥajjud",
        time: null,
        sendAfter: startUtc
      });
    }
  }

  return prayers;
}

async function fetchLegacyPlayers() {
  // OneSignal v2 API Key unterstützt keinen GET /players Zugriff.
  // Wir senden stattdessen direkt über Filter-basierte OneSignal Notifications.
  console.log("[Info] OneSignal v2 API: Subscriptions-Read deaktiviert, verwende Filter-basiertes Senden.");
  return [];
}

async function fetchUserByAlias(aliasLabel, aliasId) {
  const url = `https://api.onesignal.com/apps/${encodeURIComponent(APP_ID)}/users/by/${encodeURIComponent(aliasLabel)}/${encodeURIComponent(aliasId)}`;

  async function tryAuth(authHeader) {
    const res = await fetch(url, {
      headers: { Authorization: authHeader }
    });
    if (!res.ok) return { user: null, status: res.status, text: await res.text() };
    return { user: JSON.parse(await res.text()), status: res.status, text: "" };
  }

  const keyResult = await tryAuth(`Key ${API_KEY}`);
  if (keyResult.user) return keyResult.user;

  const basicResult = await tryAuth(`Basic ${API_KEY}`);
  if (basicResult.user) return basicResult.user;

  return null;
}

async function fetchUserByExternalId(externalId) {
  return fetchUserByAlias("external_id", externalId);
}

async function fetchUserBySubscriptionId(subscriptionId) {
  const url = `https://api.onesignal.com/apps/${encodeURIComponent(APP_ID)}/subscriptions/${encodeURIComponent(subscriptionId)}/user`;

  async function tryAuth(authHeader) {
    const res = await fetch(url, {
      headers: { Authorization: authHeader }
    });
    if (!res.ok) return null;
    return JSON.parse(await res.text());
  }

  return (await tryAuth(`Key ${API_KEY}`)) || (await tryAuth(`Basic ${API_KEY}`));
}

function extractUserTags(user) {
  if (!user) return {};
  const tags = user?.properties?.tags;
  return tags && typeof tags === "object" ? { ...tags } : {};
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
  const players = await fetchLegacyPlayers();
  const enriched = [];
  let userFetchMisses = 0;
  let taggedUsers = 0;

  for (const player of players) {
    const resolved = await resolvePlayerTags(player);
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

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    const key = [
      lat.toFixed(3),
      lon.toFixed(3),
      timeZone,
      methodAngle,
      asrFactor
    ].join("|");

    if (!map.has(key)) {
      map.set(key, {
        lat,
        lon,
        timeZone,
        methodAngle,
        asrFactor,
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

function prayerNotificationCopy(prayer, mode) {
  const isTahajjud = prayer.key === "tahajjud";
  const timeLabel = prayer.time == null ? "" : formatHour(prayer.time);

  if (mode === "advance") {
    return {
      headings: {
        de: `Nächstes Gebet: ${prayer.name}`,
        en: `Next prayer: ${prayer.name}`
      },
      contents: {
        de: isTahajjud
          ? `In ${PRAYER_ADVANCE_MINUTES} Min beginnt das letzte Drittel der Nacht. DAR AL TAWḤID`
          : `In ${PRAYER_ADVANCE_MINUTES} Min · ${timeLabel} Uhr. DAR AL TAWḤID`,
        en: isTahajjud
          ? `Last third of the night begins in ${PRAYER_ADVANCE_MINUTES} min. DAR AL TAWḤID`
          : `In ${PRAYER_ADVANCE_MINUTES} min · ${timeLabel}. DAR AL TAWḤID`
      }
    };
  }

  return {
    headings: {
      de: isTahajjud ? "Taḥajjud · letztes Drittel" : `Gebetszeit: ${prayer.name}`,
      en: isTahajjud ? "Tahajjud · last third of night" : `Prayer time: ${prayer.name}`
    },
    contents: {
      de: isTahajjud
        ? "Letztes Drittel der Nacht – Zeit für Taḥajjud bis Fajr. DAR AL TAWḤID"
        : `${prayer.name} ist eingetreten. DAR AL TAWḤID`,
      en: isTahajjud
        ? "Last third of the night – time for Tahajjud until Fajr. DAR AL TAWḤID"
        : `${prayer.name} time has entered. DAR AL TAWḤID`
    }
  };
}

async function sendOneSignalToSubscriptions(group, prayer, sendAfter, mode = "entry") {
  const copy = prayerNotificationCopy(prayer, mode);

  // Filter-basiertes Senden: OneSignal filtert intern nach Tags
  // Das funktioniert mit dem v2 API Key
  const body = withNotificationIcons({
    app_id: APP_ID,
    target_channel: "push",
    filters: [
      { field: "tag", key: "prayer_notifications", relation: "=", value: "true" }
    ],
    headings: copy.headings,
    contents: copy.contents,
    url: SITE_URL,
    isAnyWeb: true,
    send_after: sendAfter.toISOString()
  }, SITE_URL);

  try {
    const result = await postOneSignalNotification(body, API_KEY, { retries: 3 });
    const timeLabel = prayer.time == null
      ? sendAfter.toISOString()
      : formatHour(prayer.time);

    console.log(
      `Geplant (${mode}): ${prayer.name} ${timeLabel} | ${group.timeZone} → ${result.text}`
    );
  } catch (err) {
    console.error(`OneSignal Sendefehler:`, err.message || err);
    process.exitCode = 1;
  }
}

const DEFAULT_CITIES = [
  { name: "Berlin", lat: 52.52, lon: 13.405, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Hamburg", lat: 53.551, lon: 9.994, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "München", lat: 48.135, lon: 11.582, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Köln", lat: 50.937, lon: 6.96, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Frankfurt", lat: 50.11, lon: 8.682, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Stuttgart", lat: 48.776, lon: 9.177, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Düsseldorf", lat: 51.227, lon: 6.773, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Dortmund", lat: 51.513, lon: 7.465, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Essen", lat: 51.455, lon: 7.011, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Leipzig", lat: 51.34, lon: 12.373, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Bremen", lat: 53.079, lon: 8.801, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Dresden", lat: 51.05, lon: 13.737, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Hannover", lat: 52.375, lon: 9.732, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Nürnberg", lat: 49.452, lon: 11.077, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Duisburg", lat: 51.434, lon: 6.762, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Bochum", lat: 51.481, lon: 7.216, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Wuppertal", lat: 51.256, lon: 7.149, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Bielefeld", lat: 52.021, lon: 8.532, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Bonn", lat: 50.737, lon: 7.098, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Münster", lat: 51.962, lon: 7.626, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Karlsruhe", lat: 49.007, lon: 8.404, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Mannheim", lat: 49.487, lon: 8.466, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Augsburg", lat: 48.371, lon: 10.898, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Wiesbaden", lat: 50.082, lon: 8.24, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Gelsenkirchen", lat: 51.518, lon: 7.085, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Mönchengladbach", lat: 51.181, lon: 6.442, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Braunschweig", lat: 52.264, lon: 10.526, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Chemnitz", lat: 50.828, lon: 12.921, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Kiel", lat: 54.323, lon: 10.123, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Aachen", lat: 50.776, lon: 6.083, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Halle", lat: 51.483, lon: 11.967, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Magdeburg", lat: 52.12, lon: 11.628, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Freiburg", lat: 47.999, lon: 7.842, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Krefeld", lat: 51.338, lon: 6.587, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Lübeck", lat: 53.875, lon: 10.686, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Oberhausen", lat: 51.496, lon: 6.863, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Erfurt", lat: 50.979, lon: 11.03, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Mainz", lat: 50.0, lon: 8.271, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Rostock", lat: 54.092, lon: 12.099, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Kassel", lat: 51.312, lon: 9.49, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Hagen", lat: 51.367, lon: 7.483, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Saarbrücken", lat: 49.233, lon: 7.0, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Hamm", lat: 51.679, lon: 7.818, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Mülheim", lat: 51.432, lon: 6.88, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Potsdam", lat: 52.398, lon: 13.066, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Ludwigshafen", lat: 49.487, lon: 8.445, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Oldenburg", lat: 53.144, lon: 8.225, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Leverkusen", lat: 51.046, lon: 7.0, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Osnabrück", lat: 52.273, lon: 8.048, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Solingen", lat: 51.171, lon: 7.084, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Heidelberg", lat: 49.399, lon: 8.692, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Herne", lat: 51.543, lon: 7.219, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Neuss", lat: 51.2, lon: 6.694, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Darmstadt", lat: 49.871, lon: 8.65, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Paderborn", lat: 51.719, lon: 8.754, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Regensburg", lat: 49.013, lon: 12.102, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Ingolstadt", lat: 48.766, lon: 11.425, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Würzburg", lat: 49.791, lon: 9.953, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Fürth", lat: 49.476, lon: 10.989, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Wolfsburg", lat: 52.422, lon: 10.786, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Offenbach", lat: 50.102, lon: 8.766, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Ulm", lat: 48.401, lon: 9.988, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Heilbronn", lat: 49.143, lon: 9.21, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Pforzheim", lat: 48.894, lon: 8.697, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Göttingen", lat: 51.534, lon: 9.935, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Bottrop", lat: 51.522, lon: 6.935, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Reutlingen", lat: 48.491, lon: 9.21, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Koblenz", lat: 50.356, lon: 7.599, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Bremerhaven", lat: 53.539, lon: 8.581, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Erlangen", lat: 49.591, lon: 11.006, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Bergisch Gladbach", lat: 50.993, lon: 7.125, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Trier", lat: 49.749, lon: 6.637, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Tübingen", lat: 48.522, lon: 9.053, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Villingen-Schwenningen", lat: 48.063, lon: 8.455, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Worms", lat: 49.634, lon: 8.35, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Siegen", lat: 50.875, lon: 8.023, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Mörfelden-Walldorf", lat: 49.994, lon: 8.576, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Friedrichshafen", lat: 47.653, lon: 9.48, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Gronau", lat: 52.212, lon: 7.042, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Lünen", lat: 51.616, lon: 7.529, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Marl", lat: 51.658, lon: 7.091, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Velbert", lat: 51.345, lon: 7.047, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Rheine", lat: 52.283, lon: 7.44, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Gladbeck", lat: 51.571, lon: 6.985, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Düren", lat: 50.803, lon: 6.489, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Dülmen", lat: 51.83, lon: 7.28, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Langenfeld", lat: 51.1, lon: 6.948, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Rheinbach", lat: 50.683, lon: 7.201, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 },
  { name: "Lohne", lat: 52.667, lon: 8.238, timeZone: "Europe/Berlin", methodAngle: 12, asrFactor: 1 }
];

(async function main() {
  const now = new Date();

  console.log("Berechne Gebetszeiten für deutsche Städte und sende Pushs...");

  // OneSignal v2 API Key kann keine Subscriptions lesen, daher senden wir filter-basiert
  // an alle Nutzer mit prayer_notifications=true
  const groups = DEFAULT_CITIES;

  console.log(`Städte-Gruppen: ${groups.length}`);

  for (const group of groups) {
    const localDate = todayLocalDate(group.timeZone);

    const prayers = calculatePrayerTimes(
      localDate,
      group.lat,
      group.lon,
      group.timeZone,
      group.methodAngle,
      group.asrFactor
    );

    for (const prayer of prayers) {
      const entryAt = prayer.sendAfter
        ? prayer.sendAfter
        : prayer.time == null
          ? null
          : makeUtcDateFromLocal(localDate, prayer.time, group.timeZone);

      if (!entryAt) continue;

      const schedules = [
        { mode: "entry", sendAfter: entryAt }
      ];

      if (prayer.key !== "sunrise") {
        const advanceAt = new Date(entryAt.getTime() - PRAYER_ADVANCE_MINUTES * 60 * 1000);
        schedules.push({ mode: "advance", sendAfter: advanceAt });
      }

      for (const schedule of schedules) {
        if (schedule.sendAfter.getTime() <= now.getTime() + 2 * 60 * 1000) {
          const label = prayer.time == null ? prayer.name : formatHour(prayer.time);
          console.log(`Übersprungen, bereits vorbei (${schedule.mode}): ${prayer.name} ${label} | ${group.name}`);
          continue;
        }

        await sendOneSignalToSubscriptions(group, prayer, schedule.sendAfter, schedule.mode);
      }
    }
  }

  console.log("Gebetszeiten-Pushs erfolgreich geplant.");
})();
