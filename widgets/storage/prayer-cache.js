/**
 * DAR AL TAWḤĪD – Widget local storage (isolated namespace)
 * Stores up to 60 days of prayer times. Never touches main-app keys except
 * read-only access to darPrayerSettingsV1 for location/method parity.
 */
(function (global) {
  "use strict";

  const VERSION = "widget-storage-v1";
  const CACHE_KEY = "darWidgetPrayerCacheV1";
  const CONFIG_KEY = "darWidgetConfigV1";
  const APP_PRAYER_SETTINGS_KEY = "darPrayerSettingsV1";
  const APP_THEME_KEY = "darThemeV1";
  const DAYS = 60;

  function safeJsonGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch (e) {
      return fallback;
    }
  }

  function safeJsonSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  function defaultConfig() {
    return {
      enabled: false,
      themeMode: "auto", // auto | light | dark | royal
      size: "medium", // compact | medium | large
      version: VERSION,
      lastResetAt: null
    };
  }

  function getConfig() {
    return { ...defaultConfig(), ...safeJsonGet(CONFIG_KEY, {}) };
  }

  function setConfig(patch) {
    const next = { ...getConfig(), ...patch, version: VERSION };
    safeJsonSet(CONFIG_KEY, next);
    return next;
  }

  function resetWidgetOnly() {
    try { localStorage.removeItem(CACHE_KEY); } catch (e) {}
    safeJsonSet(CONFIG_KEY, { ...defaultConfig(), lastResetAt: new Date().toISOString() });
    return getConfig();
  }

  /** Read-only mirror of main-app prayer settings (location + method). */
  function readAppPrayerSettings() {
    const base = {
      city: "",
      lat: null,
      lon: null,
      angle: 12,
      asrFactor: 1,
      locationGranted: false
    };
    const saved = safeJsonGet(APP_PRAYER_SETTINGS_KEY, null);
    return saved ? { ...base, ...saved } : base;
  }

  function hasLocation(settings) {
    return Number.isFinite(Number(settings.lat)) &&
      Number.isFinite(Number(settings.lon)) &&
      settings.locationGranted === true;
  }

  function readAppTheme() {
    const t = String(safeJsonGet(APP_THEME_KEY, "dark") || "dark").toLowerCase();
    if (t === "light" || t === "soft") return "light";
    if (t === "royal") return "royal";
    return "dark";
  }

  function dateKey(date) {
    const d = date instanceof Date ? date : new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function emptyCache() {
    return {
      version: VERSION,
      timezone: "",
      city: "",
      lat: null,
      lon: null,
      angle: 12,
      asrFactor: 1,
      lastSyncAt: null,
      days: {}
    };
  }

  function getCache() {
    const raw = safeJsonGet(CACHE_KEY, null);
    if (!raw || typeof raw !== "object") return emptyCache();
    return { ...emptyCache(), ...raw, days: raw.days && typeof raw.days === "object" ? raw.days : {} };
  }

  function isValidDayPacket(day) {
    if (!day || typeof day !== "object") return false;
    const keys = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];
    for (const k of keys) {
      const v = day[k];
      if (typeof v !== "string" || !/^\d{2}:\d{2}$/.test(v)) return false;
    }
    // Chronological soft check: convert to minutes
    const toMin = (t) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    const seq = keys.map((k) => toMin(day[k]));
    for (let i = 1; i < seq.length; i++) {
      if (seq[i] < seq[i - 1]) return false;
    }
    return true;
  }

  function buildDayPacket(date, lat, lon, options, math) {
    const times = math.calculateDayTimes(date, lat, lon, options);
    const packet = { date: dateKey(date) };
    times.forEach((t) => {
      packet[t.key] = math.formatHour(t.time);
    });
    return packet;
  }

  /**
   * Generate and store up to 60 days from today.
   * Only replaces cache if every day validates.
   */
  function syncCache(math) {
    const settings = readAppPrayerSettings();
    if (!hasLocation(settings)) {
      return { ok: false, reason: "no_location", cache: getCache() };
    }
    if (!math || typeof math.calculateDayTimes !== "function") {
      return { ok: false, reason: "no_math", cache: getCache() };
    }

    const lat = Number(settings.lat);
    const lon = Number(settings.lon);
    const options = { angle: Number(settings.angle || 12), asrFactor: Number(settings.asrFactor || 1) };
    const days = {};
    const base = new Date();
    base.setHours(12, 0, 0, 0);

    for (let i = 0; i < DAYS; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const packet = buildDayPacket(d, lat, lon, options, math);
      if (!isValidDayPacket(packet)) {
        return { ok: false, reason: "invalid_day", cache: getCache() };
      }
      days[packet.date] = packet;
    }

    let timezone = "";
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch (e) {
      timezone = "";
    }

    const next = {
      version: VERSION,
      timezone,
      city: String(settings.city || ""),
      lat,
      lon,
      angle: options.angle,
      asrFactor: options.asrFactor,
      lastSyncAt: new Date().toISOString(),
      days
    };

    const saved = safeJsonSet(CACHE_KEY, next);
    return { ok: saved, reason: saved ? "ok" : "storage_full", cache: saved ? next : getCache() };
  }

  function getDay(date) {
    const cache = getCache();
    const key = dateKey(date);
    const day = cache.days[key];
    if (isValidDayPacket(day)) return { ok: true, day, cache };
    return { ok: false, day: null, cache };
  }

  global.DarWidgetStorage = {
    VERSION,
    DAYS,
    CACHE_KEY,
    CONFIG_KEY,
    getConfig,
    setConfig,
    resetWidgetOnly,
    readAppPrayerSettings,
    hasLocation,
    readAppTheme,
    dateKey,
    getCache,
    isValidDayPacket,
    syncCache,
    getDay,
    safeJsonGet,
    safeJsonSet
  };
})(typeof window !== "undefined" ? window : globalThis);
