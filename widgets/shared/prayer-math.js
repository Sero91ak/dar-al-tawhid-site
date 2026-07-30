/**
 * DAR AL TAWḤĪD – Shared prayer-time math
 * Same NOAA-style solar calculation as the main app.
 * Isolated module: no DOM, no global app state.
 */
(function (global) {
  "use strict";

  const VERSION = "prayer-math-v1";

  function toRad(d) { return d * Math.PI / 180; }
  function toDeg(r) { return r * 180 / Math.PI; }
  function fixAngle(a) { return ((a % 360) + 360) % 360; }
  function fixHour(h) { return ((h % 24) + 24) % 24; }
  function dayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    return Math.floor((date - start) / 86400000);
  }

  function sunTimeForAngle(date, lat, lon, angle, morning) {
    const N = dayOfYear(date);
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
    let cosH = (Math.cos(toRad(zenith)) - (sinDec * Math.sin(toRad(lat)))) / (cosDec * Math.cos(toRad(lat)));
    if (cosH > 1 || cosH < -1) return null;
    let H = morning ? 360 - toDeg(Math.acos(cosH)) : toDeg(Math.acos(cosH));
    H = H / 15;
    const T = H + RA - (0.06571 * t) - 6.622;
    const UT = T - lngHour;
    const tz = -date.getTimezoneOffset() / 60;
    return fixHour(UT + tz);
  }

  function solarNoon(date, lat, lon) {
    const sunrise = sunTimeForAngle(date, lat, lon, 0.833, true);
    const sunset = sunTimeForAngle(date, lat, lon, 0.833, false);
    if (sunrise == null || sunset == null) return 12;
    return fixHour((sunrise + sunset) / 2);
  }

  function declinationApprox(date) {
    const N = dayOfYear(date);
    return 23.45 * Math.sin(toRad((360 / 365) * (284 + N)));
  }

  function asrTime(date, lat, lon, factor) {
    const noon = solarNoon(date, lat, lon);
    const dec = declinationApprox(date);
    const angle = toDeg(Math.atan(1 / (factor + Math.tan(toRad(Math.abs(lat - dec))))));
    const cosH = (Math.sin(toRad(angle)) - Math.sin(toRad(lat)) * Math.sin(toRad(dec))) /
      (Math.cos(toRad(lat)) * Math.cos(toRad(dec)));
    if (cosH > 1 || cosH < -1) return noon + 4;
    const H = toDeg(Math.acos(cosH)) / 15;
    return fixHour(noon + H);
  }

  function formatHour(h) {
    if (h == null || Number.isNaN(h)) return "--:--";
    const hh = Math.floor(fixHour(h));
    const mm = Math.round((fixHour(h) - hh) * 60);
    const add = mm >= 60 ? 1 : 0;
    const finalH = (hh + add) % 24;
    const finalM = mm >= 60 ? 0 : mm;
    return String(finalH).padStart(2, "0") + ":" + String(finalM).padStart(2, "0");
  }

  function dateFromHour(base, h) {
    const d = new Date(base);
    d.setHours(0, 0, 0, 0);
    d.setMinutes(Math.round(fixHour(h) * 60));
    return d;
  }

  /** Same prayer set as the main app (labels + angle rules). */
  function calculateDayTimes(date, lat, lon, options) {
    const angle = Number((options && options.angle) || 12);
    const asrFactor = Number((options && options.asrFactor) || 1);
    const fajr = sunTimeForAngle(date, lat, lon, angle, true);
    const sunrise = sunTimeForAngle(date, lat, lon, 0.833, true);
    const dhuhr = solarNoon(date, lat, lon);
    const asr = asrTime(date, lat, lon, asrFactor);
    const maghrib = sunTimeForAngle(date, lat, lon, 0.833, false);
    const isha = sunTimeForAngle(date, lat, lon, angle, false);
    return [
      { key: "fajr", name: "Fajr", time: fajr },
      { key: "sunrise", name: "Sonnenaufgang", time: sunrise },
      { key: "dhuhr", name: "Ẓuhr", time: dhuhr },
      { key: "asr", name: "ʿAṣr", time: asr },
      { key: "maghrib", name: "Maghrib", time: maghrib },
      { key: "isha", name: "ʿIshāʾ", time: isha }
    ];
  }

  function nextPrayer(date, lat, lon, options) {
    const now = date instanceof Date ? date : new Date();
    const today = calculateDayTimes(now, lat, lon, options).filter((p) => p.key !== "sunrise");
    for (const p of today) {
      const d = dateFromHour(now, p.time);
      if (d > now) return { ...p, date: d, tomorrow: false, display: formatHour(p.time) };
    }
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const fajr = calculateDayTimes(tomorrow, lat, lon, options).find((p) => p.key === "fajr");
    if (!fajr || fajr.time == null) {
      return { key: "none", name: "—", date: now, tomorrow: false, display: "--:--" };
    }
    return {
      ...fajr,
      date: dateFromHour(tomorrow, fajr.time),
      tomorrow: true,
      display: formatHour(fajr.time)
    };
  }

  /** Countdown as HH:MM (no seconds required by spec). */
  function formatCountdown(ms) {
    if (!Number.isFinite(ms) || ms < 0) ms = 0;
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
  }

  function remainingMs(targetDate, now) {
    const n = now instanceof Date ? now : new Date();
    const t = targetDate instanceof Date ? targetDate : new Date(targetDate);
    return Math.max(0, t.getTime() - n.getTime());
  }

  global.DarPrayerMath = {
    VERSION,
    toRad,
    toDeg,
    fixAngle,
    fixHour,
    dayOfYear,
    sunTimeForAngle,
    solarNoon,
    asrTime,
    formatHour,
    dateFromHour,
    calculateDayTimes,
    nextPrayer,
    formatCountdown,
    remainingMs
  };
})(typeof window !== "undefined" ? window : globalThis);
