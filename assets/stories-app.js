/**
 * DAR AL TAWḤID — Automatische Story-Leiste (Kategorien / Ordner)
 * Pro Kategorie & Tag: 4 zufällige Storys (deterministisch pro Tag).
 */
(function (global) {
  "use strict";

  const SEEN_KEY = "darSeenStoriesV1";
  const STYLES_ID = "darStoriesStylesV4";
  const FONTS_ID = "darStoriesFontsV1";
  const STORIES_PER_CATEGORY = 4;

  let bundles = [];
  let activeSlides = [];
  let storiesLoaded = false;
  let storiesLoading = false;
  let viewer = null;
  let viewerIndex = 0;
  let viewerPaused = false;
  let viewerProgressRaf = 0;
  let viewerStartedAt = 0;
  let viewerScrollY = 0;

  const CATEGORY_ICONS = {
    "Qurʾān": "📖",
    "Qurʾān & Tafsīr": "📖",
    "Duʿāʾ": "🤲",
    Gebetszeiten: "🕌",
    Jumuʿah: "🕌",
    Aqīdah: "☪",
    Tawḥīd: "✦",
    Sunnah: "🌙",
    Manhaj: "📚",
    Hadith: "📜",
    Fiqh: "⚖️",
    Adab: "🤝",
    Akhlaq: "💎",
    "Makan الله": "🕋"
  };

  /** Visuelle Themes — bewusst andere Fonts als App-Standard (Cinzel/Inter) */
  const VISUAL_THEMES = [
    { gradientFrom: "#1c3a4a", gradientTo: "#081018", fontTitle: "'Playfair Display', Georgia, serif", fontBody: "'Lora', Georgia, serif", accent: "#9ecae8", pattern: "paper" },
    { gradientFrom: "#3d2e1a", gradientTo: "#140f08", fontTitle: "'Libre Baskerville', Georgia, serif", fontBody: "'Source Serif 4', Georgia, serif", accent: "#e8c98a", pattern: "warm" },
    { gradientFrom: "#1a3328", gradientTo: "#060d0a", fontTitle: "'DM Serif Display', Georgia, serif", fontBody: "'Lora', Georgia, serif", accent: "#a8dcc0", pattern: "emerald" },
    { gradientFrom: "#2a2240", gradientTo: "#0e0a18", fontTitle: "'Playfair Display', Georgia, serif", fontBody: "'Source Serif 4', Georgia, serif", accent: "#c4b8e8", pattern: "night" },
    { gradientFrom: "#3a2820", gradientTo: "#120a08", fontTitle: "'Libre Baskerville', Georgia, serif", fontBody: "'Lora', Georgia, serif", accent: "#f0c4a0", pattern: "sand" },
    { gradientFrom: "#1e2838", gradientTo: "#0a0e16", fontTitle: "'DM Serif Display', Georgia, serif", fontBody: "'Source Serif 4', Georgia, serif", accent: "#b0c8e0", pattern: "slate" },
    { gradientFrom: "#283018", gradientTo: "#0a0c06", fontTitle: "'Playfair Display', Georgia, serif", fontBody: "'Lora', Georgia, serif", accent: "#d0e0a0", pattern: "garden" },
    { gradientFrom: "#382818", gradientTo: "#100804", fontTitle: "'Libre Baskerville', Georgia, serif", fontBody: "'Source Serif 4', Georgia, serif", accent: "#e8b890", pattern: "parchment" }
  ];

  function esc(s) {
    return global.esc ? global.esc(s) : String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function stripMd(value) {
    if (global.stripMd) return global.stripMd(value);
    return String(value ?? "").replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");
  }

  function todayKey() {
    if (typeof global.darTodayKeyBerlin === "function") return global.darTodayKeyBerlin();
    try {
      return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date());
    } catch (e) {
      return new Date().toISOString().slice(0, 10);
    }
  }

  function slug(s) {
    return String(s || "cat")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
  }

  function hashSeed(str) {
    let h = 2166136261;
    const s = String(str || "");
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function seededShuffle(arr, seed) {
    const a = arr.slice();
    let s = seed >>> 0;
    for (let i = a.length - 1; i > 0; i--) {
      s = (Math.imul(s, 1103515245) + 12345) >>> 0;
      const j = s % (i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pickN(arr, n, seed) {
    if (!arr.length) return [];
    return seededShuffle(arr, seed).slice(0, Math.min(n, arr.length));
  }

  function readSeen() {
    try {
      const raw = JSON.parse(localStorage.getItem(SEEN_KEY) || "[]");
      return Array.isArray(raw) ? raw.map(String) : [];
    } catch (e) {
      return [];
    }
  }

  function writeSeen(ids) {
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify([...new Set(ids.map(String))].slice(0, 400)));
    } catch (e) {}
  }

  function markSeen(id) {
    if (!id) return;
    const ids = readSeen();
    if (!ids.includes(String(id))) {
      ids.push(String(id));
      writeSeen(ids);
    }
  }

  function isSeen(id) {
    return readSeen().includes(String(id));
  }

  function bundleFullySeen(bundle) {
    if (!bundle?.slides?.length) return false;
    return bundle.slides.every((s) => isSeen(s.id));
  }

  function prefersReducedMotion() {
    try {
      return global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {
      return false;
    }
  }

  function storyDurationMs(story) {
    const sec = Number(story?.durationSec || 0);
    return (sec >= 10 ? 10 : 7) * 1000;
  }

  function pickTheme(seed) {
    return VISUAL_THEMES[hashSeed(String(seed)) % VISUAL_THEMES.length];
  }

  function injectFonts() {
    if (document.getElementById(FONTS_ID)) return;
    const link = document.createElement("link");
    link.id = FONTS_ID;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Libre+Baskerville:wght@400;700&family=Lora:wght@400;600&family=Playfair+Display:wght@500;600;700&family=Source+Serif+4:wght@400;600&display=swap";
    document.head.appendChild(link);
  }

  function injectStyles() {
    injectFonts();
    let style = document.getElementById(STYLES_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLES_ID;
      document.head.appendChild(style);
    }
    style.textContent = `
.story-strip-section{margin:14px 0 18px;padding:0 12px;background:transparent;border:0;box-shadow:none;width:100%;display:flex;justify-content:center;box-sizing:border-box}
.story-strip-scroller{display:flex;flex-direction:row;flex-wrap:nowrap;align-items:center;justify-content:center;gap:clamp(14px,4vw,20px);overflow-x:auto;overflow-y:hidden;padding:6px 4px 8px;margin:0 auto;width:max-content;max-width:100%;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;touch-action:pan-x;scroll-snap-type:x proximity;scrollbar-width:none}
.story-strip-scroller::-webkit-scrollbar{display:none;height:0;width:0}
.story-ring-item{flex:0 0 auto;scroll-snap-align:center;cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none}
.story-ring-btn{width:clamp(80px,22vw,88px);height:clamp(80px,22vw,88px);border-radius:50%;padding:3px;background:transparent;border:none;display:grid;place-items:center;position:relative;cursor:pointer;transition:transform .18s ease,opacity .18s ease}
.story-ring-btn:active{transform:scale(.96)}
.story-ring-btn::before{content:"";position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 210deg,#e8c878,#c9a24a,#f0dfa0,#b8893a,#e8c878);opacity:.92}
.story-ring-btn.is-seen::before{background:conic-gradient(from 210deg,rgba(150,150,150,.45),rgba(100,100,100,.28),rgba(130,130,130,.38),rgba(90,90,90,.22),rgba(150,150,150,.45));opacity:.65}
.story-ring-inner{position:relative;width:calc(100% - 8px);height:calc(100% - 8px);border-radius:50%;overflow:hidden;border:2px solid rgba(6,8,7,.88);display:grid;place-items:center;z-index:1;box-shadow:inset 0 1px 10px rgba(0,0,0,.3)}
.story-ring-icon{font-size:clamp(26px,7vw,32px);line-height:1;filter:drop-shadow(0 1px 3px rgba(0,0,0,.4))}
.story-viewer{position:fixed;inset:0;z-index:120;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.9);padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}
.story-viewer.is-open{display:flex}
.story-viewer-card{position:relative;width:min(100vw,430px);height:min(100dvh,920px);max-height:100dvh;border-radius:0;background:#0a0e0c;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.55);touch-action:none;user-select:none}
@media(min-width:768px){.story-viewer-card{border-radius:18px;height:min(88vh,820px)}}
.story-viewer-progress{display:flex;gap:4px;padding:10px 12px 0;position:absolute;top:0;left:0;right:0;z-index:4}
.story-viewer-progress span{flex:1;height:3px;border-radius:999px;background:rgba(255,255,255,.2);overflow:hidden}
.story-viewer-progress span i{display:block;height:100%;width:0;background:var(--story-accent,linear-gradient(90deg,#efefcc,#d4b86a));border-radius:999px;transition:width .08s linear}
.story-viewer-progress span.is-done i{width:100%;background:var(--story-accent,#d4b86a)}
.story-viewer-progress span.is-active i{width:var(--story-progress,0%)}
.story-viewer-top{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 12px 0;position:absolute;top:18px;left:0;right:0;z-index:5}
.story-viewer-meta{display:flex;align-items:center;gap:8px;min-width:0;color:#f5ecd4;font-size:11px;font-weight:800;font-family:'Source Serif 4',Georgia,serif}
.story-viewer-meta-icon{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.08);font-size:14px;flex:0 0 auto}
.story-viewer-meta span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.story-viewer-close{width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.35);color:#fff;font-size:20px;line-height:1;cursor:pointer;flex:0 0 auto}
.story-viewer-bg{position:absolute;inset:0;background-size:cover;background-position:center;background-repeat:no-repeat}
.story-viewer-bg::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.42) 0%,rgba(0,0,0,.12) 38%,rgba(0,0,0,.78) 100%)}
.story-viewer-bg.is-pattern-paper::before{content:"";position:absolute;inset:0;opacity:.07;background-image:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,.15) 3px,rgba(255,255,255,.15) 4px)}
.story-viewer-bg.is-pattern-warm::before{content:"";position:absolute;inset:0;opacity:.12;background:radial-gradient(circle at 20% 20%,rgba(255,220,160,.25),transparent 45%),radial-gradient(circle at 80% 70%,rgba(255,180,100,.15),transparent 40%)}
.story-viewer-body{position:absolute;left:0;right:0;bottom:0;padding:24px 20px calc(20px + env(safe-area-inset-bottom));z-index:3;color:#f8f4e8}
.story-viewer-body h2{font-size:clamp(22px,5vw,30px);line-height:1.14;margin:0 0 10px;color:#fff8e8;text-shadow:0 2px 18px rgba(0,0,0,.5)}
.story-viewer-body p{margin:0;font-size:15px;line-height:1.58;color:rgba(248,244,232,.93);text-shadow:0 1px 12px rgba(0,0,0,.4);max-height:42vh;overflow:auto;-webkit-overflow-scrolling:touch}
.story-viewer-source{margin-top:10px;font-size:11px;color:rgba(248,244,232,.62);font-weight:700;letter-spacing:.04em}
.story-viewer-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.story-viewer-actions .story-cta{min-height:38px;padding:8px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.1);color:#fff;font-size:11px;font-weight:900;cursor:pointer;font-family:'Source Serif 4',Georgia,serif}
.story-viewer-actions .story-ghost{min-height:34px;padding:6px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#eee;font-size:10px;font-weight:800;cursor:pointer}
.story-viewer-zones{position:absolute;inset:0;z-index:2;display:grid;grid-template-columns:1fr 1fr}
.story-viewer-zones button{border:0;background:transparent;padding:0;margin:0;cursor:pointer;-webkit-tap-highlight-color:transparent}
html.story-viewer-open,html.story-viewer-open body{overflow:hidden!important}
html.story-viewer-open #bottomNav,html.story-viewer-open #floatActions,html.story-viewer-open #appChromeDock #bottomNav{display:none!important;visibility:hidden!important;pointer-events:none!important}
@media(prefers-reduced-motion:reduce){.story-viewer-progress span i{transition:none}}
`;
  }

  /** App-Daten kommen aus test/index.html (let posts — nicht auf window) */
  function getAppContext() {
    if (typeof global.darStoriesAppContext === "function") {
      try {
        return global.darStoriesAppContext() || {};
      } catch (e) {}
    }
    return {
      posts: global.posts || [],
      duas: global.DUAS || [],
      categoryLayout: global.CATEGORY_LAYOUT || null,
      quranMeta: global.quranMeta || null
    };
  }

  function countPostsByCategory(allPosts) {
    const norm = global.normalizePostCategory || ((x) => x);
    const map = new Map();
    (allPosts || []).forEach((post) => {
      let value = post?.category || "Unbekannt";
      value = norm(value);
      map.set(value, (map.get(value) || 0) + 1);
    });
    return map;
  }

  function getCategoryList() {
    const ctx = getAppContext();
    const layout = ctx.categoryLayout;
    const fromLayout = layout?.main?.length ? layout.main.slice() : layout?.order?.length ? layout.order.slice() : [];
    const postCats = ctx.posts?.length ? [...countPostsByCategory(ctx.posts).keys()].filter((c) => c && c !== "Unbekannt") : [];
    const merged = [...new Set([...fromLayout, ...postCats])];
    merged.sort((a, b) => {
      const ra = typeof global.categoryRank === "function" ? global.categoryRank(a) : 999;
      const rb = typeof global.categoryRank === "function" ? global.categoryRank(b) : 999;
      return ra - rb;
    });
    if (!merged.includes("Gebetszeiten")) merged.unshift("Gebetszeiten");
    return merged;
  }

  function postsInCategory(category) {
    const norm = global.normalizePostCategory || ((x) => x);
    const cat = norm(category);
    return (getAppContext().posts || []).filter((p) => norm(p.category) === cat);
  }

  function buildPostSlide(post, category, dayKey, index) {
    const quoteFn = global.findQuote;
    let text = quoteFn ? quoteFn(post) : "";
    if (!text) text = stripMd(post.statement || "").split(/\n+/).map((x) => x.trim()).filter(Boolean)[0] || "";
    text = text.replace(/\s+/g, " ").trim().slice(0, 300);
    const theme = pickTheme(`${dayKey}-${category}-${index}-${post.id}`);
    return {
      id: `auto-${dayKey}-${slug(category)}-${index}`,
      title: stripMd(post.title || "Beitrag").slice(0, 90),
      category,
      text,
      source: stripMd(post.scholar || post.source || "").slice(0, 120),
      type: "post",
      targetType: "post",
      targetId: String(post.id),
      icon: CATEGORY_ICONS[category] || "📄",
      durationSec: text.length > 180 ? 10 : 7,
      ...theme
    };
  }

  function buildDuaSlide(dua, category, dayKey, index) {
    const text = String(dua.de || dua.tr || dua.occasion || "").replace(/\s+/g, " ").trim().slice(0, 280);
    const theme = pickTheme(`${dayKey}-dua-${index}-${dua.id}`);
    return {
      id: `auto-${dayKey}-dua-${slug(category)}-${index}`,
      title: String(dua.title || "Duʿāʾ").slice(0, 90),
      category,
      text,
      source: String(dua.src || dua.cat || "").slice(0, 120),
      type: "dua",
      targetType: "dua",
      targetId: String(dua.id),
      icon: "🤲",
      durationSec: text.length > 160 ? 10 : 7,
      ...theme
    };
  }

  function buildQuranSlide(surah, dayKey, index) {
    const theme = pickTheme(`${dayKey}-quran-${index}-${surah.id}`);
    const title = surah.transliteration || surah.name || `Sure ${surah.id}`;
    const text = (surah.translation || surah.meaning || `Sure ${surah.id} — ${surah.ayahCount || ""} Ayahs`).slice(0, 280);
    return {
      id: `auto-${dayKey}-quran-${index}`,
      title,
      category: "Qurʾān",
      text,
      source: "Qurʾān al-Karīm",
      type: "quran",
      targetType: "quran",
      targetId: String(surah.id),
      icon: "📖",
      durationSec: 7,
      ...theme
    };
  }

  function buildPrayerSlide(info, dayKey, index) {
    const theme = pickTheme(`${dayKey}-prayer-${index}`);
    const text = info.text || "Gebetszeiten und Erinnerungen findest du in der App — ruhig und ohne Ablenkung.";
    return {
      id: `auto-${dayKey}-prayer-${index}`,
      title: info.title || "Gebetszeiten",
      category: "Gebetszeiten",
      text,
      source: info.source || "Gebetszeiten",
      type: "prayer",
      targetType: "none",
      targetId: "",
      icon: "🕌",
      durationSec: 7,
      ...theme
    };
  }

  function generatePrayerSlides(dayKey, n) {
    const pool = [];
    try {
      const settings = global.getPrayerSettings?.();
      const next = global.nextPrayerInfo?.(settings);
      if (next?.label) {
        pool.push({
          title: `Nächstes: ${next.label}`,
          text: `Das nächste Gebet ist ${next.label}. Aktiviere die Erinnerung, um rechtzeitig informiert zu werden.`,
          source: "Gebetszeiten · DAR AL TAWḤID"
        });
      }
    } catch (e) {}
    pool.push(
      { title: "Gebets-Push", text: "15 Minuten vor dem Gebet und zur Gebetszeit — dezente Push-Erinnerung auf dem Sperrbildschirm.", source: "App-Hinweis" },
      { title: "Qibla & Zeiten", text: "Standort freigeben — dann siehst du die Zeiten für deinen Ort und den Qibla-Kompass.", source: "Gebetszeiten" },
      { title: "Jumuʿah", text: "Freitagsgebet nicht vergessen — prüfe die Dhuhr-/Jumuʿah-Zeit in deiner Region.", source: "Erinnerung" },
      { title: "Adhkar nach Gebet", text: "Nach dem Gebet: kurze Adhkār aus Qurʾān und Sunnah — in der Duʿāʾ-Sammlung.", source: "Duʿāʾ · Sunnah" }
    );
    return pickN(pool, n, hashSeed(`${dayKey}-Gebetszeiten`)).map((item, i) => buildPrayerSlide(item, dayKey, i));
  }

  function generateCategorySlides(category, dayKey) {
    const seed = hashSeed(`${dayKey}-${category}`);
    const norm = global.normalizePostCategory || ((x) => x);
    const ctx = getAppContext();
    const duas = ctx.duas || [];
    const quranMeta = ctx.quranMeta;

    if (category === "Gebetszeiten") {
      return generatePrayerSlides(dayKey, STORIES_PER_CATEGORY);
    }

    if (norm(category) === norm("Duʿāʾ") && duas.length) {
      const pool = duas.filter((d) => d && d.id);
      if (pool.length >= 1) {
        return pickN(pool, STORIES_PER_CATEGORY, seed).map((d, i) => buildDuaSlide(d, category, dayKey, i));
      }
    }

    if (/qur/i.test(category) && quranMeta?.surahs?.length) {
      const surahs = quranMeta.surahs.filter((s) => s && s.id);
      const popular = global.QURAN_POPULAR_SURAHS || [];
      const boosted = [...popular.map((p) => surahs.find((s) => s.id === p.id)).filter(Boolean), ...surahs];
      const unique = [...new Map(boosted.map((s) => [s.id, s])).values()];
      if (unique.length) {
        return pickN(unique, STORIES_PER_CATEGORY, seed).map((s, i) => buildQuranSlide(s, dayKey, i));
      }
    }

    const catPosts = postsInCategory(category);
    if (catPosts.length) {
      return pickN(catPosts, STORIES_PER_CATEGORY, seed).map((p, i) => buildPostSlide(p, category, dayKey, i));
    }

    if (duas.length && /dua|duʿ|bitt|adhkar/i.test(category)) {
      const themed = duas.filter((d) => {
        const cat = String(d.cat || d.category || "");
        return cat.toLowerCase().includes(category.toLowerCase().slice(0, 4));
      });
      const pool = themed.length ? themed : duas;
      return pickN(pool, STORIES_PER_CATEGORY, seed).map((d, i) => buildDuaSlide(d, category, dayKey, i));
    }

    return [];
  }

  function buildAutoBundles() {
    const dayKey = todayKey();
    const categories = getCategoryList();
    const out = [];

    categories.forEach((category) => {
      const slides = generateCategorySlides(category, dayKey);
      if (!slides.length) return;
      out.push({
        id: `bundle-${dayKey}-${slug(category)}`,
        category,
        icon: CATEGORY_ICONS[category] || "📁",
        slides,
        dayKey
      });
    });

    return out;
  }

  function generateStories() {
    injectStyles();
    bundles = buildAutoBundles();
    storiesLoaded = true;
    return bundles;
  }

  function iconForBundle(bundle) {
    return CATEGORY_ICONS[bundle.category] || bundle.icon || "📁";
  }

  function renderStripHtml() {
    if (!bundles.length) return "";
    const items = bundles.map((bundle) => {
      const seen = bundleFullySeen(bundle);
      const theme = pickTheme(bundle.category);
      const bg = `linear-gradient(145deg, ${theme.gradientFrom} 0%, ${theme.gradientTo} 100%)`;
      return `<div class="story-ring-item" data-story-bundle="${esc(bundle.id)}" role="button" tabindex="0" aria-label="${esc(bundle.category)}">
        <button class="story-ring-btn${seen ? " is-seen" : ""}" type="button" tabindex="-1"><span class="story-ring-inner" style="background:${bg}"><span class="story-ring-icon" aria-hidden="true">${esc(iconForBundle(bundle))}</span></span></button>
      </div>`;
    }).join("");
    return `<section class="story-strip-section" id="storyStripSection" aria-label="Storys"><div class="story-strip-scroller" id="storyStripScroller">${items}</div></section>`;
  }

  function ensureViewerDom() {
    if (viewer) return viewer;
    const el = document.createElement("div");
    el.id = "storyViewer";
    el.className = "story-viewer";
    el.innerHTML = `<div class="story-viewer-card" role="dialog" aria-modal="true" aria-label="Story">
      <div class="story-viewer-progress" id="storyViewerProgress"></div>
      <div class="story-viewer-top">
        <div class="story-viewer-meta"><span class="story-viewer-meta-icon" id="storyViewerIcon">✦</span><span id="storyViewerCategory">Story</span></div>
        <button type="button" class="story-viewer-close" id="storyViewerClose" aria-label="Schließen">×</button>
      </div>
      <div class="story-viewer-zones"><button type="button" id="storyViewerPrev" aria-label="Vorherige Story"></button><button type="button" id="storyViewerNext" aria-label="Nächste Story"></button></div>
      <div class="story-viewer-bg" id="storyViewerBg"></div>
      <div class="story-viewer-body">
        <h2 id="storyViewerTitle"></h2>
        <p id="storyViewerText"></p>
        <div class="story-viewer-source" id="storyViewerSource"></div>
        <div class="story-viewer-actions" id="storyViewerActions"></div>
      </div>
    </div>`;
    document.body.appendChild(el);
    viewer = el;
    bindViewerEvents();
    return viewer;
  }

  function ctaLabel(story) {
    const t = story.targetType || "none";
    if (t === "post") return "Beitrag öffnen";
    if (t === "dua") return "Duʿāʾ öffnen";
    if (t === "quran") return "Qurʾān öffnen";
    if (t === "category") return "Kategorie öffnen";
    if (t === "external") return "Mehr lesen";
    if (t === "none" && story.type === "prayer") return "Gebetszeiten öffnen";
    return "";
  }

  function openStoryTarget(story) {
    const nav = global.navigate;
    if (typeof nav !== "function" || !story) return;
    const t = story.targetType || "none";
    if (t === "post" && story.targetId) {
      nav("post", story.targetId);
      return;
    }
    if (t === "dua" && story.targetId) {
      nav("dua", story.targetId);
      return;
    }
    if (t === "quran") {
      nav("quran", story.targetId || "");
      return;
    }
    if (t === "category" && story.targetId) {
      nav("topic", story.targetId);
      return;
    }
    if (story.type === "prayer") {
      nav("prayer", "");
      return;
    }
    if (t === "external" && story.targetUrl) {
      try {
        global.open(story.targetUrl, "_blank", "noopener");
      } catch (e) {}
    }
  }

  function shareStory(story) {
    const title = story.title || "DAR AL TAWḤID";
    const text = `${title}\n\n${story.text || ""}\n\n${story.source || ""}\n\nDAR AL TAWḤID`;
    if (global.navigator?.share) {
      global.navigator.share({ title, text }).catch(() => {});
      return;
    }
    try {
      global.navigator.clipboard.writeText(text);
    } catch (e) {}
  }

  function applyStoryTheme(story) {
    const bg = document.getElementById("storyViewerBg");
    const titleEl = document.getElementById("storyViewerTitle");
    const textEl = document.getElementById("storyViewerText");
    const card = viewer?.querySelector(".story-viewer-card");
    if (!bg || !titleEl || !textEl) return;

    bg.className = "story-viewer-bg" + (story.pattern ? ` is-pattern-${story.pattern}` : "");
    bg.style.backgroundImage = story.imageUrl ? `url("${String(story.imageUrl).replace(/"/g, '\\"')}")` : "";
    bg.style.background = story.imageUrl ? "" : `linear-gradient(165deg, ${story.gradientFrom || "#1a2820"} 0%, ${story.gradientTo || "#0a0e0c"} 55%, #050807 100%)`;

    titleEl.style.fontFamily = story.fontTitle || "'Playfair Display', Georgia, serif";
    textEl.style.fontFamily = story.fontBody || "'Lora', Georgia, serif";
    if (card) card.style.setProperty("--story-accent", story.accent || "#d4b86a");
  }

  function renderViewerStory(index) {
    const story = activeSlides[index];
    if (!story) return;
    viewerIndex = index;

    applyStoryTheme(story);

    const titleEl = document.getElementById("storyViewerTitle");
    const textEl = document.getElementById("storyViewerText");
    const sourceEl = document.getElementById("storyViewerSource");
    const actionsEl = document.getElementById("storyViewerActions");
    const iconEl = document.getElementById("storyViewerIcon");
    const catEl = document.getElementById("storyViewerCategory");
    const progressEl = document.getElementById("storyViewerProgress");

    iconEl.textContent = story.icon || CATEGORY_ICONS[story.category] || "✦";
    catEl.textContent = story.category || "Story";
    titleEl.textContent = story.title || "";
    textEl.textContent = story.text || "";
    sourceEl.textContent = story.source || story.category || "";

    let cta = ctaLabel(story);
    if (!cta && story.targetType === "none" && story.category) {
      cta = "Ordner öffnen";
    }
    actionsEl.innerHTML = `${cta ? `<button type="button" class="story-cta" id="storyViewerCta">${esc(cta)}</button>` : ""}
      <button type="button" class="story-ghost" id="storyViewerShare">Teilen</button>`;

    progressEl.innerHTML = activeSlides.map((_, i) => {
      let cls = "";
      if (i < index) cls = "is-done";
      else if (i === index) cls = "is-active";
      return `<span class="${cls}"><i style="--story-progress:0%"></i></span>`;
    }).join("");

    const ctaBtn = document.getElementById("storyViewerCta");
    if (ctaBtn) {
      ctaBtn.onclick = () => {
        closeViewer();
        if (cta === "Ordner öffnen") {
          global.navigate?.("topic", story.category);
        } else {
          openStoryTarget(story);
        }
      };
    }
    document.getElementById("storyViewerShare").onclick = () => shareStory(story);

    markSeen(story.id);
    updateStripSeenStates();
    startViewerTimer(story);
  }

  function updateStripSeenStates() {
    document.querySelectorAll(".story-ring-item[data-story-bundle]").forEach((el) => {
      const id = el.getAttribute("data-story-bundle");
      const bundle = bundles.find((b) => b.id === id);
      const btn = el.querySelector(".story-ring-btn");
      if (btn && bundle) btn.classList.toggle("is-seen", bundleFullySeen(bundle));
    });
  }

  function setViewerProgress(ratio) {
    const bar = document.querySelector("#storyViewerProgress span.is-active i");
    if (bar) bar.style.setProperty("--story-progress", `${Math.max(0, Math.min(100, ratio * 100))}%`);
  }

  function stopViewerTimer() {
    if (viewerProgressRaf) {
      cancelAnimationFrame(viewerProgressRaf);
      viewerProgressRaf = 0;
    }
  }

  function startViewerTimer(story) {
    stopViewerTimer();
    if (prefersReducedMotion()) {
      setViewerProgress(1);
      return;
    }
    const duration = storyDurationMs(story);
    viewerStartedAt = performance.now();
    viewerPaused = false;

    const tick = () => {
      if (viewerPaused) {
        viewerProgressRaf = requestAnimationFrame(tick);
        return;
      }
      const elapsed = performance.now() - viewerStartedAt;
      setViewerProgress(elapsed / duration);
      if (elapsed >= duration) {
        goNextStory(true);
        return;
      }
      viewerProgressRaf = requestAnimationFrame(tick);
    };
    viewerProgressRaf = requestAnimationFrame(tick);
  }

  function pauseViewer(pause) {
    if (!viewer || !viewer.classList.contains("is-open")) return;
    viewerPaused = pause;
    if (pause) {
      viewer._pauseStarted = performance.now();
      stopViewerTimer();
      const bar = document.querySelector("#storyViewerProgress span.is-active i");
      if (bar) viewer._pauseProgress = bar.style.getPropertyValue("--story-progress") || "0%";
    } else if (viewer._pauseStarted) {
      const story = activeSlides[viewerIndex];
      if (!story) return;
      const duration = storyDurationMs(story);
      const pct = parseFloat(String(viewer._pauseProgress || "0").replace("%", "")) / 100;
      viewerStartedAt = performance.now() - pct * duration;
      startViewerTimer(story);
    }
  }

  function goNextStory(auto) {
    if (viewerIndex < activeSlides.length - 1) {
      renderViewerStory(viewerIndex + 1);
    } else if (auto) {
      closeViewer();
    }
  }

  function goPrevStory() {
    if (viewerIndex > 0) renderViewerStory(viewerIndex - 1);
  }

  function openViewer(bundleId) {
    const bundle = bundles.find((b) => String(b.id) === String(bundleId));
    if (!bundle?.slides?.length) return;
    activeSlides = bundle.slides.slice();
    ensureViewerDom();
    viewerScrollY = window.scrollY || 0;
    document.documentElement.classList.add("story-viewer-open");
    viewer.classList.add("is-open");
    renderViewerStory(0);
  }

  function closeViewer() {
    if (!viewer) return;
    stopViewerTimer();
    viewer.classList.remove("is-open");
    document.documentElement.classList.remove("story-viewer-open");
    activeSlides = [];
    const y = viewerScrollY || 0;
    requestAnimationFrame(() => window.scrollTo({ top: y, behavior: "auto" }));
  }

  let touchStart = null;

  function bindViewerEvents() {
    document.getElementById("storyViewerClose").onclick = () => closeViewer();
    document.getElementById("storyViewerPrev").onclick = () => goPrevStory();
    document.getElementById("storyViewerNext").onclick = () => goNextStory(false);

    const card = viewer.querySelector(".story-viewer-card");
    card.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button.story-cta,button.story-ghost,#storyViewerClose")) return;
      pauseViewer(true);
    });
    card.addEventListener("pointerup", () => pauseViewer(false));
    card.addEventListener("pointerleave", () => pauseViewer(false));
    card.addEventListener("pointercancel", () => pauseViewer(false));

    card.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 1) return;
      touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });

    card.addEventListener("touchend", (e) => {
      if (!touchStart || !e.changedTouches.length) return;
      const dx = e.changedTouches[0].clientX - touchStart.x;
      const dy = e.changedTouches[0].clientY - touchStart.y;
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);
      if (ady > 80 && dy > adx) closeViewer();
      else if (adx > 50 && adx > ady) {
        if (dx < 0) goNextStory(false);
        else goPrevStory();
      }
      touchStart = null;
    }, { passive: true });

    document.addEventListener("keydown", (e) => {
      if (!viewer?.classList.contains("is-open")) return;
      if (e.key === "Escape") closeViewer();
      if (e.key === "ArrowRight") goNextStory(false);
      if (e.key === "ArrowLeft") goPrevStory();
    });
  }

  function bindStripEvents(root) {
    if (!root || root.dataset.storyBound) return;
    root.dataset.storyBound = "1";
    root.querySelectorAll("[data-story-bundle]").forEach((el) => {
      const open = () => openViewer(el.getAttribute("data-story-bundle"));
      el.addEventListener("click", open);
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });
    });
  }

  function centerStoryScroller() {
    const scroller = document.getElementById("storyStripScroller");
    if (!scroller) return;
    requestAnimationFrame(() => {
      const extra = scroller.scrollWidth - scroller.clientWidth;
      if (extra > 0) scroller.scrollLeft = extra / 2;
      else scroller.scrollLeft = 0;
    });
  }

  function mountStrip() {
    const mount = document.getElementById("storyStripMount");
    if (!mount) return;
    if (!bundles.length) {
      mount.innerHTML = "";
      mount.style.display = "none";
      return;
    }
    mount.style.display = "block";
    mount.style.width = "100%";
    mount.innerHTML = renderStripHtml();
    bindStripEvents(mount);
    centerStoryScroller();
    if (!global.__darStoryResizeBound) {
      global.__darStoryResizeBound = true;
      global.addEventListener("resize", centerStoryScroller, { passive: true });
    }
  }

  async function refresh({ force } = {}) {
    injectStyles();
    if (storiesLoading && !force) return bundles;
    storiesLoading = true;
    try {
      if (typeof global.loadCategoryLayout === "function") {
        await global.loadCategoryLayout().catch(() => {});
      }
      if (!global.quranMeta && typeof global.loadQuranIndex === "function") {
        await global.loadQuranIndex().catch(() => {});
      }
      generateStories();
    } finally {
      storiesLoading = false;
    }
    mountStrip();
    return bundles;
  }

  function onAppReady() {
    if (!document.getElementById("storyStripMount")) return;
    refresh({ force: true }).catch(() => {});
  }

  global.DAR_STORIES = {
    refresh,
    onAppReady,
    generateStories,
    openViewer,
    closeViewer,
    getBundles: () => bundles.slice(),
    isLoaded: () => storiesLoaded
  };
})(window);
