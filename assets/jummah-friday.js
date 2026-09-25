/* DAR_JUMMAH_FRIDAY_SHARED_V1
 * DĀR AL TAWḤĪD – gemeinsamer Jumuʿah-Freitag-Bereich (iOS, PWA, Web, Test).
 * UI aus der freigegebenen Test-Referenz JUMMAH_FRIDAY_MODE_V6, ohne Redesign.
 * Serie kalendergebunden über data/jummah-series.json. Keine LocalStorage-„gesehen“-Zählung.
 */
(function (global) {
  "use strict";

  var HOME_ID = "darJummahFridayHome";
  var DETAIL_ID = "darJummahFridayDetail";
  var STYLE_ID = "darJummahFridayStyle";
  var STATUS_ID = "darJummahSeriesStatus";
  var WARN_ID = "darJummahSeriesWarn";
  var CACHE_KEY = "darJummahSeriesCacheV1";
  var WARN_STORE_KEY = "darJummahSeriesWarnFlagsV1";
  var SERIES_URL = "/data/jummah-series.json";
  var timer = null, observer = null, seriesPack = null, seriesLoad = null;

  var FALLBACK_EPISODE = {
    id: "jummah-w01",
    weekNumber: 1,
    title: "Tawḥīd – Warum wir erschaffen wurden",
    category: "freitagsimpuls",
    lead: "Allah allein zu dienen ist die Grundlage jeder ʿIbādah. Qurʾān 51:56.",
    content: "Der Mensch wurde erschaffen, um Allah allein zu dienen. Tawḥīd ist die Grundlage jeder ʿIbādah und richtet Herz und Handeln allein auf Allah aus.",
    quote: "Allah hat Jinn und Menschen erschaffen, damit sie Ihm dienen. Der Kern dieser ʿIbādah ist Tawḥīd: Allah allein anzubeten und Ihm nichts beizugesellen.",
    body: "Der Prophet ﷺ erklärte Muʿādh ibn Jabal رضي الله عنه, dass Allahs Recht über Seine Diener darin besteht, dass sie Ihn allein anbeten und Ihm nichts beigesellen. Dazu gehören Duʿāʾ, Hoffnung, Furcht, Liebe, Vertrauen und alle Formen der ʿIbādah.\n\nTawḥīd ist damit nicht nur ein Wissenskapitel, sondern die Grundlage des gesamten Dīn und die wichtigste Vorbereitung auf die Begegnung mit Allah.",
    sources: ["Qurʾān 51:56", "Ṣaḥīḥ al-Buḫārī 7373", "Ṣaḥīḥ Muslim 30"],
    status: "verified",
    verified: true,
    active: true,
    publishDate: "2026-09-25",
    activationDate: "2026-09-25"
  };

  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function isTestApp() {
    try {
      if (typeof global.isTestAppPath === "function") return !!global.isTestAppPath();
    } catch (e) {}
    try {
      var p = String(location.pathname || "");
      return p.indexOf("/test/") === 0 || p === "/test";
    } catch (e2) {
      return false;
    }
  }

  function readPrayerSettings() {
    try { if (typeof global.getPrayerSettings === "function") return global.getPrayerSettings() || {}; } catch (e) {}
    try { return JSON.parse(localStorage.getItem("darPrayerSettingsV1") || "{}"); } catch (e2) { return {}; }
  }

  function timeZone(s) {
    try {
      return String((s && (s.timeZone || s.timezone)) || Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Berlin");
    } catch (e) {
      return "Europe/Berlin";
    }
  }

  function isFriday(s) {
    try {
      return new Intl.DateTimeFormat("en-US", { timeZone: timeZone(s), weekday: "short" }).format(new Date()) === "Fri";
    } catch (e) {
      return new Date().getDay() === 5;
    }
  }

  function ymdInTz(date, tz) {
    try {
      return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
    } catch (e) {
      var d = date instanceof Date ? date : new Date();
      return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    }
  }

  function weekdayInTz(date, tz) {
    try {
      return new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(date);
    } catch (e) {
      return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
    }
  }

  function ymdToUtcMs(ymd) {
    var p = String(ymd || "").split("-");
    if (p.length < 3) return NaN;
    return Date.UTC(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 12, 0, 0);
  }

  function addDaysYmd(ymd, days) {
    var ms = ymdToUtcMs(ymd);
    if (!Number.isFinite(ms)) return ymd;
    var d = new Date(ms + Number(days) * 86400000);
    return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0") + "-" + String(d.getUTCDate()).padStart(2, "0");
  }

  function daysBetweenYmd(a, b) {
    return Math.round((ymdToUtcMs(b) - ymdToUtcMs(a)) / 86400000);
  }

  function currentFridayYmd(now, tz) {
    var cursor = new Date(now.getTime());
    for (var i = 0; i < 8; i++) {
      if (weekdayInTz(cursor, tz) === "Fri") return ymdInTz(cursor, tz);
      cursor = new Date(cursor.getTime() - 86400000);
    }
    return ymdInTz(now, tz);
  }

  function nextFridayYmd(now, tz) {
    var today = ymdInTz(now, tz);
    if (weekdayInTz(now, tz) === "Fri") return addDaysYmd(today, 7);
    var cur = currentFridayYmd(now, tz);
    var n = addDaysYmd(cur, 7);
    return n;
  }

  function prayerDate(base, p) {
    if (!p) return null;
    try {
      if (typeof global.prayerEventDate === "function") {
        var d = global.prayerEventDate(base, p);
        if (d instanceof Date && !isNaN(d)) return d;
      }
    } catch (e) {}
    if (p.eventDate) {
      var x = new Date(p.eventDate);
      if (!isNaN(x)) return x;
    }
    var h = Number(p.time);
    if (!Number.isFinite(h)) return null;
    var d2 = new Date(base), hh = Math.floor(h), mm = Math.round((h - hh) * 60);
    d2.setHours(hh, mm, 0, 0);
    return d2;
  }

  function prayerWindow(s) {
    var out = { asr: null, maghrib: null, lastStart: null };
    try {
      if (typeof global.hasPrayerLocation === "function" && !global.hasPrayerLocation(s)) return out;
      if (typeof global.calculatePrayerTimes !== "function") return out;
      var base = new Date(), list = global.calculatePrayerTimes(base, s) || [];
      out.asr = prayerDate(base, list.find(function (p) { return p.key === "asr"; }));
      out.maghrib = prayerDate(base, list.find(function (p) { return p.key === "maghrib"; }));
      if (out.maghrib) {
        var technical = new Date(out.maghrib.getTime() - 60 * 60000);
        out.lastStart = (out.asr && out.asr > technical) ? out.asr : technical;
      }
    } catch (e) {}
    return out;
  }

  function fmt(d, s) {
    if (!(d instanceof Date) || isNaN(d)) return "—";
    try {
      return new Intl.DateTimeFormat("de-DE", { timeZone: timeZone(s), hour: "2-digit", minute: "2-digit" }).format(d);
    } catch (e) {
      return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
    }
  }

  function fmtDateDe(ymd, tz) {
    try {
      var ms = ymdToUtcMs(ymd);
      if (!Number.isFinite(ms)) return ymd || "—";
      return new Intl.DateTimeFormat("de-DE", { timeZone: tz || "UTC", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(ms));
    } catch (e) {
      return ymd || "—";
    }
  }

  function defaultPack() {
    return {
      seriesId: "jummah-friday-series",
      seriesStart: "2026-09-25",
      episodes: [FALLBACK_EPISODE]
    };
  }

  function normalizePack(raw) {
    var pack = raw && typeof raw === "object" ? raw : defaultPack();
    var episodes = Array.isArray(pack.episodes) ? pack.episodes.slice() : [];
    episodes.sort(function (a, b) { return Number(a.weekNumber || 0) - Number(b.weekNumber || 0); });
    return {
      seriesId: String(pack.seriesId || "jummah-friday-series"),
      seriesStart: String(pack.seriesStart || (episodes[0] && episodes[0].activationDate) || "2026-09-25"),
      title: pack.title || "Jumuʿah-Freitagsimpulse",
      episodes: episodes
    };
  }

  function readCachedPack() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      return normalizePack(JSON.parse(raw));
    } catch (e) {
      return null;
    }
  }

  function writeCachedPack(pack) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(pack)); } catch (e) {}
  }

  function ensureSeries() {
    if (seriesPack) return Promise.resolve(seriesPack);
    if (seriesLoad) return seriesLoad;
    var cached = readCachedPack();
    if (cached && cached.episodes && cached.episodes.length) seriesPack = cached;
    seriesLoad = fetch(SERIES_URL, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("series");
      return r.json();
    }).then(function (json) {
      seriesPack = normalizePack(json);
      writeCachedPack(seriesPack);
      return seriesPack;
    }).catch(function () {
      if (!seriesPack) seriesPack = cached || defaultPack();
      return seriesPack;
    });
    return seriesLoad;
  }

  function episodeByWeek(pack, week) {
    var list = (pack && pack.episodes) || [];
    for (var i = 0; i < list.length; i++) {
      if (Number(list[i].weekNumber) === Number(week)) return list[i];
    }
    return null;
  }

  function lastVerifiedEpisode(pack, upToWeek) {
    var list = (pack && pack.episodes) || [];
    var found = null;
    for (var i = 0; i < list.length; i++) {
      var ep = list[i];
      var w = Number(ep.weekNumber || 0);
      if (upToWeek && w > upToWeek) continue;
      if (ep.verified === true || ep.status === "verified" || ep.active === true) found = ep;
    }
    return found || FALLBACK_EPISODE;
  }

  function episodeIsReady(ep) {
    if (!ep) return false;
    if (ep.verified === true || ep.status === "verified") return String(ep.title || "").trim() !== "";
    return false;
  }

  function resolveDisplayEpisode(pack, week) {
    var ep = episodeByWeek(pack, week);
    if (episodeIsReady(ep)) return { episode: ep, fromSeries: true, missing: false };
    return { episode: lastVerifiedEpisode(pack, week), fromSeries: false, missing: true };
  }

  function getJummahSeriesStatus(nowOpt, settingsOpt) {
    var s = settingsOpt || readPrayerSettings();
    var tz = timeZone(s);
    var now = nowOpt instanceof Date ? nowOpt : new Date();
    var pack = seriesPack || readCachedPack() || defaultPack();
    var episodes = pack.episodes || [];
    var total = episodes.length;
    var start = pack.seriesStart || "2026-09-25";
    var today = ymdInTz(now, tz);
    var thisFri = currentFridayYmd(now, tz);
    var elapsedWeeks = Math.floor(daysBetweenYmd(start, thisFri) / 7);
    var currentWeek = elapsedWeeks + 1;
    if (currentWeek < 1) currentWeek = 1;
    var lastEpisodeDate = total ? addDaysYmd(start, (total - 1) * 7) : start;
    var daysUntilSeriesEnd = daysBetweenYmd(today, lastEpisodeDate);
    if (!Number.isFinite(daysUntilSeriesEnd)) daysUntilSeriesEnd = 0;
    var remainingEpisodes = Math.max(0, total - currentWeek);
    var currentEpisode = episodeByWeek(pack, currentWeek);
    var nextEpisode = episodeByWeek(pack, currentWeek + 1);
    var seriesStatus = "ok";
    if (daysUntilSeriesEnd < 0 || (total > 0 && currentWeek > total)) seriesStatus = "expired";
    else if (remainingEpisodes <= 1 || daysUntilSeriesEnd <= 1) seriesStatus = "critical";
    else if (remainingEpisodes <= 2 || daysUntilSeriesEnd <= 3) seriesStatus = "urgent";
    else if (daysUntilSeriesEnd <= 7) seriesStatus = "warning7";
    else if (remainingEpisodes <= 4 || daysUntilSeriesEnd <= 28) seriesStatus = "prepare";
    return {
      seriesId: pack.seriesId,
      timeZone: tz,
      today: today,
      currentEpisode: currentEpisode,
      currentWeek: currentWeek,
      totalEpisodes: total,
      remainingEpisodes: remainingEpisodes,
      nextEpisode: nextEpisode || null,
      lastEpisodeDate: lastEpisodeDate,
      nextSwitchDate: nextFridayYmd(now, tz),
      daysUntilSeriesEnd: daysUntilSeriesEnd,
      seriesStatus: seriesStatus,
      seriesStart: start,
      missingCurrent: !episodeIsReady(currentEpisode)
    };
  }

  function currentState() {
    var s = readPrayerSettings(), fri = isFriday(s), w = prayerWindow(s), now = new Date();
    var st = getJummahSeriesStatus(now, s);
    var resolved = resolveDisplayEpisode(seriesPack || readCachedPack() || defaultPack(), st.currentWeek);
    return {
      settings: s,
      friday: fri,
      window: w,
      ended: !!(fri && w.maghrib && now >= w.maghrib),
      last: !!(fri && w.lastStart && w.maghrib && now >= w.lastStart && now < w.maghrib),
      series: st,
      impulse: resolved
    };
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = [
      ".dar-jf-home,.dar-jf-detail{--jf-accent:var(--gold2,#c9a96a);--jf-text:var(--ink,var(--cream,#f6f0e2));--jf-muted:var(--muted,#9f9a90);--jf-line:var(--line2,var(--line,rgba(128,128,128,.22)));--jf-surface:var(--card,transparent);color:var(--jf-text)}",
      ".dar-jf-home{position:relative;margin:16px 0 20px;padding:0;border:1px solid var(--jf-line);border-radius:21px;background:var(--jf-surface);box-shadow:none;overflow:hidden}",
      ".dar-jf-home:before{content:'';position:absolute;left:0;top:0;bottom:0;width:2px;background:var(--jf-accent);opacity:.7;pointer-events:none}",
      ".dar-jf-inner{position:relative;padding:16px 17px 13px}",
      ".dar-jf-kicker{font-size:9px;letter-spacing:.17em;text-transform:uppercase;color:var(--jf-accent);font-weight:900}",
      ".dar-jf-home h2,.dar-jf-detail h2,.dar-jf-detail h3{font-family:var(--serif,Georgia,serif);color:var(--jf-text);margin:5px 0 7px;line-height:1.14}",
      ".dar-jf-home h2{font-size:clamp(22px,5.3vw,29px);max-width:760px}",
      ".dar-jf-home p,.dar-jf-detail p{margin:0;color:var(--jf-muted);line-height:1.53}",
      ".dar-jf-lead{font-size:13px!important;max-width:760px}",
      ".dar-jf-source{display:block;margin-top:6px;color:var(--jf-muted);font-size:9.8px;line-height:1.4}",
      ".dar-jf-home-stack{margin-top:13px;border-top:1px solid var(--jf-line)}",
      ".dar-jf-home-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px 14px;align-items:center;padding:11px 0;border-bottom:1px solid var(--jf-line)}",
      ".dar-jf-home-item__copy{min-width:0}",
      ".dar-jf-home-item__label{display:block;margin-bottom:3px;color:var(--jf-accent);font-size:8.8px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}",
      ".dar-jf-home-item__title{display:block;color:var(--jf-text);font-size:13px;font-weight:900;line-height:1.35}",
      ".dar-jf-home-item__text{display:block;margin-top:3px;color:var(--jf-muted);font-size:10.8px;line-height:1.43}",
      ".dar-jf-home-item.is-salawat{display:block;padding:15px 0 16px}",
      ".dar-jf-home-item.is-salawat .dar-jf-home-item__label{font-size:10px;letter-spacing:.13em;margin-bottom:6px}",
      ".dar-jf-home-item.is-salawat .dar-jf-home-item__title{font-size:15px;line-height:1.3}",
      ".dar-jf-salawat{margin-top:10px;padding:10px 11px 9px;border:1px solid color-mix(in srgb,var(--jf-line) 92%,transparent);border-radius:13px;background:color-mix(in srgb,var(--jf-accent) 4%,transparent)}",
      ".dar-jf-salawat__salla{display:block;color:var(--jf-accent);font-size:13px;font-weight:900;line-height:1.35;letter-spacing:.01em}",
      ".dar-jf-salawat__latin{display:block;margin-top:5px;color:var(--jf-text);font-size:16px;font-weight:900;line-height:1.42;letter-spacing:.002em}",
      ".dar-jf-salawat__de{display:block;margin-top:5px;color:var(--jf-muted);font-size:11.3px;line-height:1.46}",
      ".dar-jf-salawat__source{display:block;margin-top:6px;color:var(--jf-muted);font-size:9.4px;line-height:1.35}",
      ".dar-jf-salawat__hint{display:block;margin-bottom:3px;color:var(--jf-accent);font-size:8.7px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}",
      ".dar-jf-home-item__time{min-width:74px;text-align:right}",
      ".dar-jf-home-item__time b{display:block;color:var(--jf-text);font-size:15px;line-height:1.1}",
      ".dar-jf-home-item__time span{display:block;margin-top:3px;color:var(--jf-muted);font-size:8.7px;letter-spacing:.08em;text-transform:uppercase}",
      ".dar-jf-home-item.is-active .dar-jf-home-item__label,.dar-jf-home-item.is-active .dar-jf-home-item__time b{color:var(--jf-accent)}",
      ".dar-jf-more-wrap{margin-top:4px;padding-top:14px;border-top:1px solid var(--jf-line)}",
      ".dar-jf-more{width:100%;min-height:64px;display:grid;grid-template-columns:minmax(0,1fr) 40px;align-items:center;gap:14px;padding:11px 12px 11px 14px;border:1px solid color-mix(in srgb,var(--jf-line) 92%,transparent);border-radius:16px;background:color-mix(in srgb,var(--jf-surface) 88%,transparent);color:var(--jf-text);font:inherit;text-align:left;cursor:pointer;box-shadow:inset 0 1px 0 rgba(255,255,255,.018)}",
      ".dar-jf-more-copy{display:block;min-width:0;padding-right:2px}",
      ".dar-jf-more-title{display:block;color:var(--jf-text);font-size:12.5px;font-weight:900;line-height:1.28}",
      ".dar-jf-more small{display:block;margin-top:3px;color:var(--jf-muted);font-size:9.8px;font-weight:600;line-height:1.35}",
      ".dar-jf-more-arrow{width:38px;height:38px;display:grid;place-items:center;align-self:center;justify-self:end;border:1px solid color-mix(in srgb,var(--jf-line) 96%,transparent);border-radius:50%;color:var(--jf-accent);font-size:20px;font-weight:500;line-height:1;transform:none}",
      ".dar-jf-more:hover{border-color:color-mix(in srgb,var(--jf-accent) 36%,var(--jf-line))}",
      ".dar-jf-more:active .dar-jf-more-arrow{transform:translateX(1px)}",
      ".dar-jf-detail{margin:14px 0 4px;border-top:1px solid var(--jf-line)}",
      ".dar-jf-section{padding:18px 2px;border-bottom:1px solid var(--jf-line)}",
      ".dar-jf-section:last-child{border-bottom:0}",
      ".dar-jf-detail h2{font-size:clamp(23px,5.5vw,30px)}",
      ".dar-jf-detail h3{font-size:18px}",
      ".dar-jf-detail-lead{font-size:13.5px!important;max-width:720px}",
      ".dar-jf-facts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));margin-top:14px;border-top:1px solid var(--jf-line);border-bottom:1px solid var(--jf-line)}",
      ".dar-jf-fact{padding:12px 10px}",
      ".dar-jf-fact:nth-child(odd){border-right:1px solid var(--jf-line)}",
      ".dar-jf-fact span{display:block;color:var(--jf-muted);font-size:9.5px;letter-spacing:.11em;text-transform:uppercase;font-weight:850;margin-bottom:3px}",
      ".dar-jf-fact b{display:block;color:var(--jf-text);font-size:13px;font-weight:850}",
      ".dar-jf-callout{padding:14px 0;border-bottom:1px solid var(--jf-line)}",
      ".dar-jf-callout:last-child{border-bottom:0}",
      ".dar-jf-callout strong{display:block;color:var(--jf-text);font-size:13.5px;margin-bottom:5px}",
      ".dar-jf-callout p{font-size:13px}",
      ".dar-jf-khutbah blockquote{margin:12px 0;padding:1px 0 1px 13px;border-left:2px solid color-mix(in srgb,var(--jf-accent) 64%,transparent);color:var(--jf-text);line-height:1.62;font-size:13.5px}",
      ".dar-jf-khutbah p{margin:10px 0;font-size:13px}",
      ".dar-jf-note{font-size:10.5px!important;margin-top:10px!important;color:var(--jf-muted)!important}",
      "html[data-theme='light'] .dar-jf-home,html[data-theme='soft'] .dar-jf-home{background:color-mix(in srgb,var(--card,#fff) 96%,transparent)}",
      "html[data-theme='royal'] .dar-jf-home,html[data-theme='bordeaux'] .dar-jf-home,html[data-theme='dar-al-layl'] .dar-jf-home,html[data-theme='dark'] .dar-jf-home{background:color-mix(in srgb,var(--card,#111) 92%,transparent)}",
      "@media(max-width:560px){.dar-jf-home{margin:14px 0 18px;border-radius:19px}.dar-jf-inner{padding:15px 14px 13px}.dar-jf-home-item{grid-template-columns:minmax(0,1fr) auto;padding:10px 0}.dar-jf-home-item__time{min-width:66px}.dar-jf-home-item.is-salawat{padding:14px 0 15px}.dar-jf-home-item.is-salawat .dar-jf-home-item__title{font-size:14.6px}.dar-jf-salawat{padding:9px 10px 9px}.dar-jf-salawat__salla{font-size:12.5px}.dar-jf-salawat__latin{font-size:15.5px}.dar-jf-salawat__de{font-size:11px}.dar-jf-more-wrap{padding-top:13px}.dar-jf-more{min-height:62px;grid-template-columns:minmax(0,1fr) 38px;gap:12px;padding:10px 10px 10px 13px;border-radius:15px}.dar-jf-more-arrow{width:36px;height:36px;font-size:19px}.dar-jf-facts{grid-template-columns:1fr}.dar-jf-fact:nth-child(odd){border-right:0}.dar-jf-fact+.dar-jf-fact{border-top:1px solid var(--jf-line)}}",
      "@media(min-width:900px){.dar-jf-home{max-width:560px}}",
      ".dar-jf-status{margin:12px 0 16px;padding:12px 13px;border:1px dashed color-mix(in srgb,var(--jf-accent) 45%,var(--jf-line));border-radius:16px;background:color-mix(in srgb,var(--jf-accent) 6%,transparent)}",
      ".dar-jf-status b{display:block;font-size:13px;margin-bottom:6px}",
      ".dar-jf-status p,.dar-jf-status li{font-size:12px;color:var(--jf-muted);line-height:1.45}",
      ".dar-jf-status ul{margin:8px 0;padding-left:18px}",
      ".dar-jf-status .dar-jf-status-dot{margin-right:6px}",
      ".dar-jf-status-btn{margin-top:10px;min-height:40px;padding:8px 12px;border-radius:12px;border:1px solid var(--jf-line);background:transparent;color:var(--jf-text);font:inherit;font-weight:800;cursor:pointer}",
      ".dar-jf-warn{position:relative;margin:0 0 12px;padding:12px 13px;border-radius:14px;border:1px solid color-mix(in srgb,var(--jf-accent) 50%,var(--jf-line))}",
      ".dar-jf-warn.is-critical{border-color:#c45c4a}",
      ".dar-jf-warn h3{margin:0 0 6px;font-size:14px}",
      ".dar-jf-warn-close{position:absolute;top:8px;right:10px;border:0;background:transparent;color:var(--jf-muted);font-size:18px;cursor:pointer}"
    ].join("\n");
    document.head.appendChild(el);
  }

  function impulseBits(st) {
    var ep = (st.impulse && st.impulse.episode) || FALLBACK_EPISODE;
    var title = String(ep.title || "").trim() || FALLBACK_EPISODE.title;
    var lead = String(ep.lead || ep.content || "").trim() || FALLBACK_EPISODE.lead;
    var content = String(ep.content || ep.lead || "").trim() || FALLBACK_EPISODE.content;
    var quote = String(ep.quote || "").trim() || FALLBACK_EPISODE.quote;
    var body = String(ep.body || "").trim() || FALLBACK_EPISODE.body;
    var src = Array.isArray(ep.sources) && ep.sources.length ? ep.sources.join(" · ") : FALLBACK_EPISODE.sources.join(" · ");
    return { title: title, lead: lead, content: content, quote: quote, body: body, src: src };
  }

  function renderHome() {
    var old = document.getElementById(HOME_ID), st = currentState();
    if (!st.friday || st.ended) { if (old) old.remove(); return; }

    var shell = document.querySelector(".home-v380-shell");
    if (!shell) return;

    var last = st.window.lastStart ? fmt(st.window.lastStart, st.settings) : "nach ʿAṣr";
    var mag = st.window.maghrib ? fmt(st.window.maghrib, st.settings) : "nach Standort";
    var bits = impulseBits(st);
    var sig = [st.last, last, mag, bits.title, st.series.currentWeek].join("|");

    var html =
      '<section id="' + HOME_ID + '" class="dar-jf-home" data-jf-sig="' + esc(sig) + '" aria-label="Jumuʿah am Freitag">' +
        '<div class="dar-jf-inner">' +
          '<div class="dar-jf-kicker">JUMUʿAH · FREITAG</div>' +
          '<h2>' + (st.last ? "Besondere Zeit für Duʿāʾ" : "Der Freitag") + "</h2>" +
          '<p class="dar-jf-lead">' +
            (st.last
              ? "Die letzte Zeit vor Maghrib wird besonders für Duʿāʾ, Dhikr und die Hinwendung zu Allah genutzt."
              : "Am Freitag stehen Ṣalāh auf den Propheten ﷺ, Duʿāʾ und die Erinnerung an zentrale Themen des Dīn im Mittelpunkt.") +
          "</p>" +
          '<div class="dar-jf-home-stack">' +
            '<div class="dar-jf-home-item is-salawat">' +
              '<div class="dar-jf-home-item__copy">' +
                '<span class="dar-jf-home-item__label">Ṣalāh auf den Propheten ﷺ</span>' +
                '<span class="dar-jf-home-item__title">Am Freitag besonders vermehren</span>' +
                '<span class="dar-jf-salawat">' +
                  '<span class="dar-jf-salawat__hint">Zum Mitlesen</span>' +
                  '<span class="dar-jf-salawat__salla">Ṣallallāhu ʿalayhi wa-sallam</span>' +
                  '<span class="dar-jf-salawat__latin">Allāhumma ṣalli wa sallim ʿalā Muḥammad</span>' +
                  '<span class="dar-jf-salawat__de">O Allah, sende Ṣalāh und Frieden auf Muḥammad.</span>' +
                  '<span class="dar-jf-salawat__source">Überliefert von Aws ibn Aws.</span>' +
                "</span>" +
              "</div>" +
            "</div>" +
            '<div class="dar-jf-home-item' + (st.last ? " is-active" : "") + '">' +
              '<div class="dar-jf-home-item__copy">' +
                '<span class="dar-jf-home-item__label">' + (st.last ? "Jetzt besonders beachten" : "Duʿāʾ · besondere Zeit") + "</span>" +
                '<span class="dar-jf-home-item__title">' + (st.last ? "Zeit vor Maghrib" : "Letzte Zeit nach ʿAṣr") + "</span>" +
                '<span class="dar-jf-home-item__text">Bis zum Eintritt von Maghrib.</span>' +
              "</div>" +
              '<div class="dar-jf-home-item__time"><b>' + esc(last) + "</b><span>bis " + esc(mag) + "</span></div>" +
            "</div>" +
            '<div class="dar-jf-home-item">' +
              '<div class="dar-jf-home-item__copy">' +
                '<span class="dar-jf-home-item__label">Freitagsimpuls</span>' +
                '<span class="dar-jf-home-item__title">' + esc(bits.title) + "</span>" +
                '<span class="dar-jf-home-item__text">' + esc(bits.lead) + "</span>" +
              "</div>" +
            "</div>" +
          "</div>" +
          '<div class="dar-jf-more-wrap">' +
            '<button type="button" class="dar-jf-more" data-dar-jf-open="1" aria-label="Mehr zu Jumuʿah öffnen">' +
              '<span class="dar-jf-more-copy"><span class="dar-jf-more-title">Mehr zu Jumuʿah</span><small>Sunnah · Duʿāʾ · Freitagsimpuls</small></span>' +
              '<span class="dar-jf-more-arrow" aria-hidden="true">›</span>' +
            "</button>" +
          "</div>" +
        "</div>" +
      "</section>";

    if (old) {
      if (old.getAttribute("data-jf-sig") === sig) return;
      old.outerHTML = html;
      return;
    }

    var box = document.createElement("div");
    box.innerHTML = html;
    shell.insertBefore(box.firstElementChild, shell.firstChild);
  }

  function renderDetail() {
    var host = document.querySelector(".jummah-hub-page");
    if (!host) return;

    var old = document.getElementById(DETAIL_ID);
    var st = currentState();
    var asr = st.window.asr ? fmt(st.window.asr, st.settings) : "nach Standort";
    var mag = st.window.maghrib ? fmt(st.window.maghrib, st.settings) : "nach Standort";
    var last = st.window.lastStart ? fmt(st.window.lastStart, st.settings) : "nach ʿAṣr";
    var bits = impulseBits(st);
    var sig = [st.friday, st.last, asr, last, mag, bits.title, st.series.currentWeek].join("|");

    if (old && old.getAttribute("data-jf-sig") === sig) {
      renderTestStatus(host, st);
      return;
    }

    var wrap = document.createElement("div");
    wrap.id = DETAIL_ID;
    wrap.className = "dar-jf-detail";
    wrap.setAttribute("data-jf-sig", sig);

    var bodyHtml = bits.body.split(/\n\n+/).map(function (p) {
      return "<p>" + esc(p) + "</p>";
    }).join("");

    wrap.innerHTML =
      '<section class="dar-jf-section">' +
        '<div class="dar-jf-kicker">JUMUʿAH</div>' +
        "<h2>Der Freitag</h2>" +
        '<p class="dar-jf-detail-lead">Der Freitag ist ein besonderer Tag der Muslime. In diesem Bereich stehen authentisch überlieferte Hinweise zu Ṣalāh auf den Propheten ﷺ, Duʿāʾ, Dhikr und ein kurzer wöchentlicher Freitagsimpuls im Mittelpunkt.</p>' +
        '<div class="dar-jf-facts">' +
          '<div class="dar-jf-fact"><span>ʿAṣr</span><b>' + esc(asr) + "</b></div>" +
          '<div class="dar-jf-fact"><span>Maghrib</span><b>' + esc(mag) + "</b></div>" +
        "</div>" +
      "</section>" +
      '<section class="dar-jf-section">' +
        '<div class="dar-jf-callout">' +
          "<strong>Ṣalāh auf den Propheten ﷺ</strong>" +
          "<p>Für den Freitag ist überliefert, die Ṣalāh auf den Propheten ﷺ zu vermehren. Eine bestimmte erfundene Anzahl wird dabei nicht festgelegt.</p>" +
          '<div class="dar-jf-salawat"><span class="dar-jf-salawat__hint">Zum Mitlesen</span><span class="dar-jf-salawat__salla">Ṣallallāhu ʿalayhi wa-sallam</span><span class="dar-jf-salawat__latin">Allāhumma ṣalli wa sallim ʿalā Muḥammad</span><span class="dar-jf-salawat__de">O Allah, sende Ṣalāh und Frieden auf Muḥammad.</span></div>' +
          '<span class="dar-jf-source">Überlieferung von Aws ibn Aws · authentisch überliefert</span>' +
        "</div>" +
        '<div class="dar-jf-callout">' +
          "<strong>Die besondere Zeit für Duʿāʾ</strong>" +
          "<p>Überliefert ist eine besondere Zeit am Freitag, in der Duʿāʾ erhört wird. Zu den starken überlieferten Auffassungen gehört die letzte Zeit nach ʿAṣr bis Maghrib.</p>" +
          '<span class="dar-jf-source">Sunan Abī Dāwūd 1048 · Sunan an-Nasāʾī 1389</span>' +
        "</div>" +
      "</section>" +
      '<section class="dar-jf-section dar-jf-khutbah">' +
        '<div class="dar-jf-kicker">FREITAGSIMPULS</div>' +
        "<h2>" + esc(bits.title) + "</h2>" +
        "<p>" + esc(bits.content) + "</p>" +
        "<blockquote>" + esc(bits.quote) + "</blockquote>" +
        bodyHtml +
        '<span class="dar-jf-source">' + esc(bits.src) + "</span>" +
        '<p class="dar-jf-note">Der Freitagsimpuls ist bewusst kurz gehalten. Die formelle Jumuʿah-Khuṭbah und ihre fiqhrechtlichen Voraussetzungen werden getrennt behandelt.</p>' +
      "</section>";

    if (old && old.parentNode) {
      old.parentNode.replaceChild(wrap, old);
    } else {
      var pushPanel = host.querySelector(".jummah-push-panel");
      if (pushPanel && pushPanel.parentNode) pushPanel.parentNode.insertBefore(wrap, pushPanel.nextSibling);
      else host.insertBefore(wrap, host.firstChild);
    }
    renderTestStatus(host, st);
  }

  function readWarnFlags(anchor) {
    try {
      var raw = JSON.parse(localStorage.getItem(WARN_STORE_KEY) || "{}");
      if (String(raw.anchor || "") !== String(anchor || "")) return { anchor: anchor };
      return raw;
    } catch (e) {
      return { anchor: anchor };
    }
  }

  function writeWarnFlags(flags) {
    try { localStorage.setItem(WARN_STORE_KEY, JSON.stringify(flags)); } catch (e) {}
  }

  function statusDot(status) {
    if (status === "expired" || status === "critical") return "🔴";
    if (status === "urgent" || status === "warning7") return "🟠";
    if (status === "prepare") return "🟡";
    return "🟢";
  }

  function statusLabel(st) {
    if (st.seriesStatus === "expired") return "Serie aufgebraucht – neue Folgen vorbereiten";
    if (st.remainingEpisodes <= 1 || st.daysUntilSeriesEnd <= 1) return "kritisch – noch 1 Folge / letzter Tag";
    if (st.remainingEpisodes <= 2 || st.daysUntilSeriesEnd <= 3) return "weniger als 2 Wochen / wenige Tage";
    if (st.daysUntilSeriesEnd <= 7) return "weniger als 7 Tage";
    if (st.remainingEpisodes <= 4 || st.daysUntilSeriesEnd <= 28) return "Bald neue Jumuʿah-Inhalte vorbereiten";
    return "ausreichend Inhalte";
  }

  function taskListHtml() {
    return "<ul>" +
      "<li>neue Freitagsimpulse</li>" +
      "<li>Khuṭbah-/Themenideen</li>" +
      "<li>Qurʾān-Belege</li>" +
      "<li>authentische Sunnah</li>" +
      "<li>Aussagen/Aṯār, soweit vorgesehen</li>" +
      "<li>Quellenprüfung</li>" +
      "<li>anschließend Freigabe und neuer Serienblock</li>" +
      "</ul>";
  }

  function activeWarnLevel(st) {
    if (st.daysUntilSeriesEnd <= 1 && st.daysUntilSeriesEnd >= 0) return "1";
    if (st.daysUntilSeriesEnd <= 2 && st.daysUntilSeriesEnd > 1) return "2";
    if (st.daysUntilSeriesEnd <= 3 && st.daysUntilSeriesEnd > 2) return "3";
    if (st.daysUntilSeriesEnd <= 7 && st.daysUntilSeriesEnd > 3) return "7";
    if (st.remainingEpisodes <= 1) return "ep1";
    if (st.remainingEpisodes <= 2) return "ep2";
    if (st.remainingEpisodes <= 4) return "ep4";
    return "";
  }

  function warnCopy(level, st) {
    if (level === "1") return { t: "Morgen läuft die vorbereitete Jumuʿah-Serie aus", p: "Kritischer interner Hinweis: letzte vorbereitete Folge steht an." };
    if (level === "2") return { t: "Jumuʿah-Inhalte laufen in 2 Tagen aus", p: "Nur noch 2 Tage bis zum Ende der aktuell vorbereiteten Serie." };
    if (level === "3") return { t: "Nur noch 3 Tage", p: "Deutliche Warnung: Jumuʿah-Serie läuft in 3 Tagen aus." };
    if (level === "7") return { t: "Jumuʿah-Serie läuft bald aus", p: "Noch 7 Tage bis zum Ende der aktuell vorbereiteten Serie. " + st.totalEpisodes + " / " + st.totalEpisodes + " Folgen vorbereitet. Neue Freitagsimpulse vorbereiten." };
    if (level === "ep1") return { t: "Noch 1 Folge", p: "Kritisch: nach der aktuellen Woche fehlen weitere geprüfte Freitagsimpulse." };
    if (level === "ep2") return { t: "Noch 2 Folgen", p: "Status eskalieren: neue Jumuʿah-Folgen vorbereiten." };
    if (level === "ep4") return { t: "Noch 4 Folgen", p: "Bald neue Jumuʿah-Inhalte vorbereiten." };
    return null;
  }

  function renderTestStatus(host, stWrap) {
    if (!isTestApp() || !host) {
      var stray = document.getElementById(STATUS_ID);
      if (stray) stray.remove();
      var w = document.getElementById(WARN_ID);
      if (w) w.remove();
      return;
    }
    var st = stWrap.series;
    var tz = st.timeZone;
    var html =
      '<aside id="' + STATUS_ID + '" class="dar-jf-status" aria-label="Jumuʿah-Serie intern">' +
        "<b>Jumuʿah-Serie</b>" +
        "<p>Aktuell: Folge " + esc(st.currentWeek) + " / " + esc(st.totalEpisodes) +
        "<br>Verbleibend: " + esc(st.remainingEpisodes) +
        "<br>Nächster Wechsel: Freitag " + esc(fmtDateDe(st.nextSwitchDate, tz)) +
        "<br>Serienende: " + esc(fmtDateDe(st.lastEpisodeDate, tz)) +
        "<br>Noch: " + esc(Math.max(0, st.daysUntilSeriesEnd)) + " Tage</p>" +
        "<p><span class=\"dar-jf-status-dot\">" + statusDot(st.seriesStatus) + "</span>" + esc(statusLabel(st)) + "</p>" +
        "<p><strong>Neue Jumuʿah-Folgen vorbereiten</strong></p>" +
        taskListHtml() +
        '<button type="button" class="dar-jf-status-btn" data-dar-jf-prepare="1">Neue Jumuʿah-Serie vorbereiten</button>' +
      "</aside>";

    var oldS = document.getElementById(STATUS_ID);
    if (oldS) oldS.outerHTML = html;
    else {
      var box = document.createElement("div");
      box.innerHTML = html;
      var detail = document.getElementById(DETAIL_ID);
      if (detail && detail.parentNode) detail.parentNode.insertBefore(box.firstElementChild, detail);
      else host.insertBefore(box.firstElementChild, host.firstChild);
    }

    var level = activeWarnLevel(st);
    var copy = warnCopy(level, st);
    var flags = readWarnFlags(st.lastEpisodeDate + ":" + st.totalEpisodes);
    var flagKey = "warning" + level + "Shown";
    var oldW = document.getElementById(WARN_ID);
    if (copy && !flags[flagKey]) {
      var wh =
        '<div id="' + WARN_ID + '" class="dar-jf-warn' + ((level === "1" || level === "ep1") ? " is-critical" : "") + '" role="status">' +
          '<button type="button" class="dar-jf-warn-close" data-dar-jf-warn-close="1" aria-label="Hinweis schließen">×</button>' +
          "<h3>" + esc(copy.t) + "</h3>" +
          "<p>" + esc(copy.p) + "</p>" +
          "<p><strong>Neue Jumuʿah-Folgen vorbereiten</strong></p>" +
          taskListHtml() +
          '<button type="button" class="dar-jf-status-btn" data-dar-jf-prepare="1">Neue Jumuʿah-Serie vorbereiten</button>' +
        "</div>";
      if (oldW) oldW.outerHTML = wh;
      else {
        var wb = document.createElement("div");
        wb.innerHTML = wh;
        var statusEl = document.getElementById(STATUS_ID);
        if (statusEl && statusEl.parentNode) statusEl.parentNode.insertBefore(wb.firstElementChild, statusEl);
        else host.insertBefore(wb.firstElementChild, host.firstChild);
      }
    } else if (oldW && (!copy || flags[flagKey])) {
      if (flags[flagKey]) oldW.remove();
    }
  }

  function bind() {
    if (document.documentElement.getAttribute("data-dar-jf-bound") === "1") return;
    document.documentElement.setAttribute("data-dar-jf-bound", "1");
    document.addEventListener("click", function (ev) {
      var close = ev.target && ev.target.closest ? ev.target.closest("[data-dar-jf-warn-close]") : null;
      if (close) {
        ev.preventDefault();
        var st = getJummahSeriesStatus();
        var flags = readWarnFlags(st.lastEpisodeDate + ":" + st.totalEpisodes);
        var level = activeWarnLevel(st);
        if (level) flags["warning" + level + "Shown"] = true;
        flags.anchor = st.lastEpisodeDate + ":" + st.totalEpisodes;
        writeWarnFlags(flags);
        var el = document.getElementById(WARN_ID);
        if (el) el.remove();
        return;
      }
      var prep = ev.target && ev.target.closest ? ev.target.closest("[data-dar-jf-prepare]") : null;
      if (prep) {
        ev.preventDefault();
        try {
          if (typeof global.navigate === "function") global.navigate("jummah");
          else location.hash = "#jummah";
        } catch (e) { location.hash = "#jummah"; }
        var panel = document.getElementById(STATUS_ID);
        if (panel && panel.scrollIntoView) panel.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      var b = ev.target && ev.target.closest ? ev.target.closest("[data-dar-jf-open]") : null;
      if (!b) return;
      ev.preventDefault();
      try {
        if (typeof global.navigate === "function") {
          global.navigate("jummah");
          return;
        }
      } catch (e2) {}
      location.hash = "#jummah";
    }, true);
  }

  function refresh() {
    ensureStyle();
    renderHome();
    renderDetail();
  }

  function boot() {
    ensureStyle();
    bind();
    ensureSeries().then(function () { refresh(); });
    refresh();

    if (!observer && document.body) {
      observer = new MutationObserver(function () {
        clearTimeout(global.__darJfMutationTimer);
        global.__darJfMutationTimer = setTimeout(refresh, 90);
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    if (!timer) timer = setInterval(refresh, 30000);
    window.addEventListener("hashchange", function () { setTimeout(refresh, 90); });
    document.addEventListener("visibilitychange", function () { if (!document.hidden) refresh(); });
    window.addEventListener("pageshow", function () { refresh(); });
    window.addEventListener("focus", function () { refresh(); });
  }

  global.getJummahSeriesStatus = getJummahSeriesStatus;
  global.DAR_JUMMAH_FRIDAY = {
    build: "shared-v1",
    refresh: refresh,
    state: currentState,
    getJummahSeriesStatus: getJummahSeriesStatus,
    ensureSeries: ensureSeries
  };
  global.DAR_JUMMAH_FRIDAY_TEST = global.DAR_JUMMAH_FRIDAY;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})(window);
