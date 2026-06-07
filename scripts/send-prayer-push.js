#!/usr/bin/env node
/* DAR AL TAWḤID – standortbasierte OneSignal-Gebetszeiten-Automatisierung
   GitHub Actions liest OneSignal-Subscriptions, prüft Nutzer-Tags und plant Pushs pro Standort. */

const APP_ID = process.env.ONESIGNAL_APP_ID || "786d7cd6-0455-4434-ab14-0c10a7bc6b1e";
const API_KEY = process.env.ONESIGNAL_API_KEY || process.env.ONESIGNAL_APP_API_KEY;
const SITE_URL = process.env.SITE_URL || "https://dar-al-tawhid.de/#prayer";

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

  return [
    { key: "fajr", name: "Fajr", time: fajr },
    { key: "dhuhr", name: "Dhuhr", time: dhuhr },
    { key: "asr", name: "ʿAṣr", time: asr },
    { key: "maghrib", name: "Maghrib", time: maghrib },
    { key: "isha", name: "ʿIshāʾ", time: isha }
  ];
}

async function fetchSubscriptions() {
  const all = [];
  let offset = 0;
  const limit = 300;

  while (true) {
    const url =
      `https://onesignal.com/api/v1/players?app_id=${encodeURIComponent(APP_ID)}&limit=${limit}&offset=${offset}`;

    const res = await fetch(url, {
      headers: {
        "Authorization": `Basic ${API_KEY}`
      }
    });

    const text = await res.text();

    if (!res.ok) {
      throw new Error(`OneSignal Subscriptions Fehler ${res.status}: ${text}`);
    }

    const data = JSON.parse(text);
    const players = Array.isArray(data.players) ? data.players : [];

    all.push(...players);

    if (players.length < limit) break;

    offset += limit;
  }

  return all;
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

    map.get(key).subscriptionIds.push(user.id);
  }

  return Array.from(map.values());
}

async function sendOneSignalToSubscriptions(group, prayer, sendAfter) {
  const ids = group.subscriptionIds.slice(0, 2000);

  const body = {
    app_id: APP_ID,
    target_channel: "push",
    include_player_ids: ids,
    headings: {
      de: `Gebetszeit: ${prayer.name}`,
      en: `Prayer time: ${prayer.name}`
    },
    contents: {
      de: `${prayer.name} ist eingetreten. DAR AL TAWḤID`,
      en: `${prayer.name} time has entered. DAR AL TAWḤID`
    },
    url: SITE_URL,
    isAnyWeb: true,
    send_after: sendAfter.toISOString()
  };

  const res = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Authorization": `Key ${API_KEY}`
    },
    body: JSON.stringify(body)
  });

  const text = await res.text();

  if (!res.ok) {
    console.error(`OneSignal Sendefehler ${res.status}:`, text);
    process.exitCode = 1;
    return;
  }

  console.log(
    `Geplant: ${prayer.name} ${formatHour(prayer.time)} | ${ids.length} Nutzer | ${group.timeZone} → ${text}`
  );
}

(async function main() {
  const now = new Date();

  console.log("Lese OneSignal-Subscriptions mit Gebetszeiten-Tags...");

  const players = await fetchSubscriptions();
  const users = getPrayerUsers(players);
  const groups = groupUsers(users);

  console.log(`Subscriptions gesamt: ${players.length}`);
  console.log(`Gebetszeiten-Nutzer mit Standort: ${users.length}`);
  console.log(`Standort-Gruppen: ${groups.length}`);

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
      if (prayer.time == null) continue;

      const sendAfter = makeUtcDateFromLocal(localDate, prayer.time, group.timeZone);

      if (sendAfter.getTime() <= now.getTime() + 2 * 60 * 1000) {
        console.log(`Übersprungen, bereits vorbei: ${prayer.name} ${formatHour(prayer.time)} | ${group.timeZone}`);
        continue;
      }

      await sendOneSignalToSubscriptions(group, prayer, sendAfter);
    }
  }
})();
