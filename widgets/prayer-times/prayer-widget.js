/**
 * DAR AL TAWḤĪD – Prayer times widget adapter + renderer
 * Isolated from main app. Errors stay inside this module.
 */
(function (global) {
  "use strict";

  const VERSION = "prayer-widget-v1";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function safeCall(fn, fallback) {
    try {
      return fn();
    } catch (e) {
      try {
        if (global.DarWidgetLog) global.DarWidgetLog.error("safeCall", e);
      } catch (_) {}
      return typeof fallback === "function" ? fallback() : fallback;
    }
  }

  function parseHHMM(str, baseDate) {
    const m = String(str || "").match(/^(\d{2}):(\d{2})$/);
    if (!m) return null;
    const d = new Date(baseDate);
    d.setHours(Number(m[1]), Number(m[2]), 0, 0);
    return d;
  }

  function dayListFromPacket(day) {
    return [
      { key: "fajr", name: "Fajr", display: day.fajr },
      { key: "sunrise", name: "Sonnenaufgang", display: day.sunrise },
      { key: "dhuhr", name: "Ẓuhr", display: day.dhuhr },
      { key: "asr", name: "ʿAṣr", display: day.asr },
      { key: "maghrib", name: "Maghrib", display: day.maghrib },
      { key: "isha", name: "ʿIshāʾ", display: day.isha }
    ];
  }

  function resolveNextFromDay(day, now, math, settings, cache) {
    const list = dayListFromPacket(day).filter((p) => p.key !== "sunrise");
    for (const p of list) {
      const d = parseHHMM(p.display, now);
      if (d && d > now) {
        return { key: p.key, name: p.name, display: p.display, date: d, tomorrow: false };
      }
    }
    // After ʿIshāʾ → tomorrow Fajr from cache or live math
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tKey = (global.DarWidgetStorage && global.DarWidgetStorage.dateKey)
      ? global.DarWidgetStorage.dateKey(tomorrow)
      : null;
    let fajrDisplay = null;
    if (tKey && cache && cache.days && cache.days[tKey]) {
      fajrDisplay = cache.days[tKey].fajr;
    }
    if (!fajrDisplay && math && settings) {
      const times = math.calculateDayTimes(tomorrow, Number(settings.lat), Number(settings.lon), {
        angle: settings.angle,
        asrFactor: settings.asrFactor
      });
      const fajr = times.find((x) => x.key === "fajr");
      fajrDisplay = fajr ? math.formatHour(fajr.time) : null;
    }
    const d = parseHHMM(fajrDisplay || "05:00", tomorrow);
    return {
      key: "fajr",
      name: "Fajr",
      display: fajrDisplay || "--:--",
      date: d || tomorrow,
      tomorrow: true
    };
  }

  function buildSnapshot(now) {
    const storage = global.DarWidgetStorage;
    const math = global.DarPrayerMath;
    const n = now instanceof Date ? now : new Date();

    if (!storage || !math) {
      return { state: "error", message: "setup" };
    }

    const settings = storage.readAppPrayerSettings();
    if (!storage.hasLocation(settings)) {
      return { state: "no_location", settings };
    }

    let dayResult = storage.getDay(n);
    if (!dayResult.ok) {
      // Try live calc + sync (no network needed for times)
      try {
        storage.syncCache(math);
        dayResult = storage.getDay(n);
      } catch (e) {
        dayResult = { ok: false, day: null, cache: storage.getCache() };
      }
    }

    if (!dayResult.ok || !dayResult.day) {
      // Last resort: compute today live without writing
      try {
        const times = math.calculateDayTimes(n, Number(settings.lat), Number(settings.lon), {
          angle: Number(settings.angle || 12),
          asrFactor: Number(settings.asrFactor || 1)
        });
        const day = { date: storage.dateKey(n) };
        times.forEach((t) => { day[t.key] = math.formatHour(t.time); });
        if (!storage.isValidDayPacket(day)) {
          return { state: "no_data", settings, cache: storage.getCache() };
        }
        dayResult = { ok: true, day, cache: storage.getCache() };
      } catch (e) {
        return { state: "no_data", settings, cache: storage.getCache() };
      }
    }

    const cache = dayResult.cache || storage.getCache();
    const next = resolveNextFromDay(dayResult.day, n, math, settings, cache);
    const remain = math.remainingMs(next.date, n);
    const countdown = math.formatCountdown(remain);

    return {
      state: "ready",
      settings,
      cache,
      day: dayResult.day,
      times: dayListFromPacket(dayResult.day),
      next,
      countdown,
      remainMs: remain,
      city: cache.city || settings.city || "Standort",
      lastSyncAt: cache.lastSyncAt || null,
      now: n
    };
  }

  function formatDateDe(date) {
    try {
      return date.toLocaleDateString("de-DE", {
        weekday: "short",
        day: "2-digit",
        month: "long",
        year: "numeric"
      });
    } catch (e) {
      return "";
    }
  }

  function renderCompact(snap, fallback, appPath) {
    if (snap.state === "no_location") return fallback.locationNeeded(appPath);
    if (snap.state !== "ready") return fallback.setupNeeded(appPath);
    return `<div class="pw-size-compact" aria-live="polite">
      <div class="pw-brand">DAR AL TAWḤĪD</div>
      <div class="pw-label">Nächstes Gebet</div>
      <div class="pw-next-name">${esc(snap.next.name)}</div>
      <div class="pw-next-time">${esc(snap.next.display)}</div>
      <div class="pw-countdown">noch ${esc(snap.countdown)}</div>
    </div>`;
  }

  function renderMedium(snap, fallback, appPath) {
    if (snap.state === "no_location") return fallback.locationNeeded(appPath);
    if (snap.state !== "ready") return fallback.setupNeeded(appPath);
    const rows = snap.times.map((t) => {
      const active = t.key === snap.next.key ? " is-next" : "";
      return `<div class="pw-row${active}"><span class="pw-name">${esc(t.name)}</span><span class="pw-time">${esc(t.display)}</span></div>`;
    }).join("");
    return `<div class="pw-size-medium" aria-live="polite">
      <div class="pw-brand">DAR AL TAWḤĪD</div>
      <div class="pw-next-block">
        <div class="pw-label">Nächstes Gebet</div>
        <div class="pw-next-line"><b>${esc(snap.next.name)}</b><span>${esc(snap.next.display)}</span></div>
        <div class="pw-countdown">noch ${esc(snap.countdown)}</div>
      </div>
      <div class="pw-list">${rows}</div>
    </div>`;
  }

  function renderLarge(snap, fallback, appPath) {
    if (snap.state === "no_location") return fallback.locationNeeded(appPath);
    if (snap.state !== "ready") return fallback.setupNeeded(appPath);
    const rows = snap.times.map((t) => {
      const active = t.key === snap.next.key ? " is-next" : "";
      return `<div class="pw-row${active}"><span class="pw-name">${esc(t.name)}</span><span class="pw-time">${esc(t.display)}</span></div>`;
    }).join("");
    const stale = fallback.staleHint(snap.lastSyncAt);
    return `<div class="pw-size-large" aria-live="polite">
      <div class="pw-brand">DAR AL TAWḤĪD</div>
      <div class="pw-meta"><span>${esc(formatDateDe(snap.now))}</span><span>${esc(snap.city)}</span></div>
      <div class="pw-next-block">
        <div class="pw-label">Nächstes Gebet</div>
        <div class="pw-next-line"><b>${esc(snap.next.name)}</b><span>${esc(snap.next.display)}</span></div>
        <div class="pw-countdown">noch ${esc(snap.countdown)}</div>
      </div>
      <div class="pw-list">${rows}</div>
      ${stale}
    </div>`;
  }

  function render(size, snap, fallback, appPath) {
    const s = String(size || "medium").toLowerCase();
    if (s === "compact") return renderCompact(snap, fallback, appPath);
    if (s === "large") return renderLarge(snap, fallback, appPath);
    return renderMedium(snap, fallback, appPath);
  }

  /**
   * Mount widget into a host element. Returns a controller with destroy().
   * Never throws to the caller.
   */
  function mount(host, options) {
    const opts = options || {};
    const storage = global.DarWidgetStorage;
    const themeApi = global.DarWidgetTheme;
    const fallback = global.DarWidgetFallback;
    const math = global.DarPrayerMath;

    if (!host || !storage || !themeApi || !fallback || !math) {
      return { destroy() {}, refresh() {} };
    }

    let destroyed = false;
    let timer = null;
    const size = opts.size || storage.getConfig().size || "medium";
    const appPath = opts.appPath || "/#prayer";

    function paint() {
      if (destroyed) return;
      safeCall(() => {
        const cfg = storage.getConfig();
        const appTheme = storage.readAppTheme();
        const theme = themeApi.getTheme(cfg.themeMode, appTheme);
        themeApi.applyCssVars(host, theme);
        host.classList.add("dar-prayer-widget");
        host.setAttribute("data-pw-size", size);

        // Ensure cache exists (local calc, no GPS)
        if (storage.hasLocation(storage.readAppPrayerSettings())) {
          const cache = storage.getCache();
          const todayKey = storage.dateKey(new Date());
          if (!cache.days || !cache.days[todayKey]) {
            storage.syncCache(math);
          }
        }

        const snap = buildSnapshot(new Date());
        host.innerHTML = render(size, snap, fallback, appPath);
      }, () => {
        host.innerHTML = fallback.setupNeeded(appPath);
      });
    }

    function tick() {
      if (destroyed) return;
      paint();
      timer = setTimeout(tick, 30000); // 30s local countdown refresh – no network
    }

    paint();
    timer = setTimeout(tick, 30000);

    const onTheme = () => { if (!destroyed) paint(); };
    try {
      document.addEventListener("dar-theme-change", onTheme);
      window.addEventListener("storage", onTheme);
    } catch (e) {}

    return {
      refresh: paint,
      destroy() {
        destroyed = true;
        if (timer) clearTimeout(timer);
        try {
          document.removeEventListener("dar-theme-change", onTheme);
          window.removeEventListener("storage", onTheme);
        } catch (e) {}
      },
      version: VERSION
    };
  }

  global.DarPrayerWidget = {
    VERSION,
    buildSnapshot,
    render,
    mount,
    esc
  };
})(typeof window !== "undefined" ? window : globalThis);
