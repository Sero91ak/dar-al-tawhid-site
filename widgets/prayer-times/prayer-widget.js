/**
 * DAR AL TAWḤĪD – Prayer times widget adapter + renderer
 * Isolated from main app. Errors stay inside this module.
 * Phase 3: Apple small + Android resizable density layouts.
 */
(function (global) {
  "use strict";

  const VERSION = "prayer-widget-v2";

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
      try {
        storage.syncCache(math);
        dayResult = storage.getDay(n);
      } catch (e) {
        dayResult = { ok: false, day: null, cache: storage.getCache() };
      }
    }

    if (!dayResult.ok || !dayResult.day) {
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

  function getLayout(size, density) {
    const sizes = global.DarWidgetSizes;
    if (sizes && density) return sizes.layoutForDensity(density);
    const s = sizes ? sizes.normalizeSize(size) : String(size || "medium");
    if (s === "apple-small" || s === "compact") {
      return sizes ? sizes.layoutForDensity("xs") : {
        showBrand: false, showBrandShort: true, showNextLabel: false,
        showCountdown: true, showList: false, showSunrise: false, showMeta: false, showStale: false
      };
    }
    if (s === "apple-medium") {
      return sizes ? sizes.layoutForDensity("sm") : {
        showBrand: true, showBrandShort: true, showNextLabel: true,
        showCountdown: true, showList: false, showSunrise: false, showMeta: false, showStale: false
      };
    }
    if (s === "large" || s === "apple-large") {
      return sizes ? sizes.layoutForDensity("lg") : {
        showBrand: true, showList: true, showMeta: true, showSunrise: true,
        showCountdown: true, showNextLabel: true, showStale: true, showBrandShort: false, compactRows: false
      };
    }
    return sizes ? sizes.layoutForDensity("md") : {
      showBrand: true, showList: true, showCountdown: true, showNextLabel: true,
      showSunrise: false, showMeta: false, showStale: false, showBrandShort: false, compactRows: true
    };
  }

  function renderRows(snap, layout) {
    let times = snap.times || [];
    if (!layout.showSunrise) times = times.filter((t) => t.key !== "sunrise");
    return times.map((t) => {
      const active = t.key === snap.next.key ? " is-next" : "";
      return `<div class="pw-row${active}"><span class="pw-name">${esc(t.name)}</span><span class="pw-time">${esc(t.display)}</span></div>`;
    }).join("");
  }

  function renderAppleSmall(snap, fallback, appPath) {
    if (snap.state === "no_location") return fallback.locationNeeded(appPath);
    if (snap.state !== "ready") return fallback.setupNeeded(appPath);
    return `<div class="pw-size-apple-small" aria-live="polite">
      <div class="pw-brand pw-brand-mini">DAR</div>
      <div class="pw-next-name">${esc(snap.next.name)}</div>
      <div class="pw-next-time">${esc(snap.next.display)}</div>
      <div class="pw-countdown">noch ${esc(snap.countdown)}</div>
    </div>`;
  }

  function renderByLayout(snap, fallback, appPath, layout, sizeClass) {
    if (snap.state === "no_location") return fallback.locationNeeded(appPath);
    if (snap.state !== "ready") return fallback.setupNeeded(appPath);

    const brand = layout.showBrandShort && !layout.showBrand
      ? `<div class="pw-brand pw-brand-mini">DAR</div>`
      : (layout.showBrand ? `<div class="pw-brand">DAR AL TAWḤĪD</div>` : "");
    const label = layout.showNextLabel ? `<div class="pw-label">Nächstes Gebet</div>` : "";
    const meta = layout.showMeta
      ? `<div class="pw-meta"><span>${esc(formatDateDe(snap.now))}</span><span>${esc(snap.city)}</span></div>`
      : "";
    const list = layout.showList
      ? `<div class="pw-list${layout.compactRows ? " is-compact" : ""}">${renderRows(snap, layout)}</div>`
      : "";
    const stale = layout.showStale ? fallback.staleHint(snap.lastSyncAt) : "";
    const countdown = layout.showCountdown
      ? `<div class="pw-countdown">noch ${esc(snap.countdown)}</div>`
      : "";

    if (!layout.showList) {
      return `<div class="${esc(sizeClass)}" aria-live="polite">
        ${brand}${meta}${label}
        <div class="pw-next-name">${esc(snap.next.name)}</div>
        <div class="pw-next-time">${esc(snap.next.display)}</div>
        ${countdown}
      </div>`;
    }

    return `<div class="${esc(sizeClass)}" aria-live="polite">
      ${brand}${meta}
      <div class="pw-next-block">
        ${label}
        <div class="pw-next-line"><b>${esc(snap.next.name)}</b><span>${esc(snap.next.display)}</span></div>
        ${countdown}
      </div>
      ${list}
      ${stale}
    </div>`;
  }

  function render(size, snap, fallback, appPath, density) {
    const sizes = global.DarWidgetSizes;
    const s = sizes ? sizes.normalizeSize(size) : String(size || "medium").toLowerCase();
    if (s === "apple-small") return renderAppleSmall(snap, fallback, appPath);
    if (s === "apple-medium") {
      return renderByLayout(snap, fallback, appPath, getLayout("apple-medium"), "pw-size-apple-medium");
    }
    if (s === "apple-large") {
      return renderByLayout(snap, fallback, appPath, getLayout("apple-large"), "pw-size-apple-large");
    }
    if (s === "android" || density) {
      const d = density || (sizes ? sizes.densityFromBox(180, 180) : "sm");
      return renderByLayout(snap, fallback, appPath, getLayout("android", d), "pw-size-android pw-density-" + d);
    }
    if (s === "compact") {
      return renderByLayout(snap, fallback, appPath, getLayout("compact"), "pw-size-compact");
    }
    if (s === "large") {
      return renderByLayout(snap, fallback, appPath, getLayout("large"), "pw-size-large");
    }
    return renderByLayout(snap, fallback, appPath, getLayout("medium"), "pw-size-medium");
  }

  function ensureCache() {
    const storage = global.DarWidgetStorage;
    const math = global.DarPrayerMath;
    if (!storage || !math) return;
    if (!storage.hasLocation(storage.readAppPrayerSettings())) return;
    const cache = storage.getCache();
    const todayKey = storage.dateKey(new Date());
    if (!cache.days || !cache.days[todayKey]) storage.syncCache(math);
  }

  function mount(host, options) {
    const opts = options || {};
    const storage = global.DarWidgetStorage;
    const themeApi = global.DarWidgetTheme;
    const fallback = global.DarWidgetFallback;
    const math = global.DarPrayerMath;
    const sizes = global.DarWidgetSizes;

    if (!host || !storage || !themeApi || !fallback || !math) {
      return { destroy() {}, refresh() {} };
    }

    let destroyed = false;
    let timer = null;
    let unsub = null;
    let observer = null;
    let currentDensity = opts.density || null;
    const size = sizes ? sizes.normalizeSize(opts.size || storage.getConfig().size || "medium") : (opts.size || "medium");
    const appPath = opts.appPath || "/#prayer";
    const resizable = !!opts.resizable || size === "android";

    function applyTheme() {
      const cfg = storage.getConfig();
      const appTheme = storage.readAppTheme();
      const theme = themeApi.getTheme(cfg.themeMode, appTheme);
      themeApi.applyCssVars(host, theme);
    }

    function paint() {
      if (destroyed) return;
      safeCall(() => {
        applyTheme();
        host.classList.add("dar-prayer-widget");
        host.setAttribute("data-pw-size", size);
        if (currentDensity) host.setAttribute("data-pw-density", currentDensity);
        else host.removeAttribute("data-pw-density");
        ensureCache();
        const snap = buildSnapshot(new Date());
        host.innerHTML = render(size, snap, fallback, appPath, currentDensity);
      }, () => {
        host.innerHTML = fallback.setupNeeded(appPath);
      });
    }

    function updateDensityFromHost() {
      if (!sizes || !resizable) return;
      const rect = host.getBoundingClientRect();
      const next = sizes.densityFromBox(rect.width, rect.height);
      if (next !== currentDensity) {
        currentDensity = next;
        paint();
      }
    }

    function tick() {
      if (destroyed) return;
      paint();
      timer = setTimeout(tick, 30000);
    }

    if (resizable) {
      host.classList.add("is-resizable");
      const cfg = storage.getConfig();
      if (!currentDensity) currentDensity = cfg.androidDensity || "sm";
      if (cfg.androidWidth) host.style.width = cfg.androidWidth + "px";
      else if (!host.style.width) host.style.width = "180px";
      if (cfg.androidHeight) host.style.height = cfg.androidHeight + "px";
      else if (!host.style.height) host.style.height = "180px";
      try {
        observer = new ResizeObserver(() => {
          if (destroyed) return;
          const rect = host.getBoundingClientRect();
          storage.setConfig({
            androidWidth: Math.round(rect.width),
            androidHeight: Math.round(rect.height),
            androidDensity: sizes ? sizes.densityFromBox(rect.width, rect.height) : "sm"
          });
          updateDensityFromHost();
        });
        observer.observe(host);
      } catch (e) {
        observer = null;
      }
    }

    paint();
    if (resizable) updateDensityFromHost();
    timer = setTimeout(tick, 30000);

    const onTheme = () => { if (!destroyed) paint(); };
    try {
      document.addEventListener("dar-theme-change", onTheme);
      window.addEventListener("storage", onTheme);
    } catch (e) {}

    if (global.DarWidgetBridge) {
      unsub = global.DarWidgetBridge.subscribe(() => { if (!destroyed) paint(); });
    }

    return {
      refresh: paint,
      destroy() {
        destroyed = true;
        if (timer) clearTimeout(timer);
        if (observer) try { observer.disconnect(); } catch (e) {}
        if (typeof unsub === "function") try { unsub(); } catch (e) {}
        try {
          document.removeEventListener("dar-theme-change", onTheme);
          window.removeEventListener("storage", onTheme);
        } catch (e) {}
      },
      version: VERSION,
      getDensity() { return currentDensity; }
    };
  }

  global.DarPrayerWidget = {
    VERSION,
    buildSnapshot,
    render,
    mount,
    esc,
    getLayout
  };
})(typeof window !== "undefined" ? window : globalThis);
