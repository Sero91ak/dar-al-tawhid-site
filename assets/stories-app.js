/**
 * DAR AL TAWḤID — Story-Leiste + Vollbild-Viewer (Staging / test)
 */
(function (global) {
  "use strict";

  const SEEN_KEY = "darSeenStoriesV1";
  const STYLES_ID = "darStoriesStylesV1";

  let stories = [];
  let storiesLoaded = false;
  let storiesLoading = false;
  let storiesError = "";
  let viewer = null;
  let viewerIndex = 0;
  let viewerTimer = null;
  let viewerPaused = false;
  let viewerProgressRaf = 0;
  let viewerStartedAt = 0;
  let viewerScrollY = 0;
  let stripMounted = false;

  const CATEGORY_ICONS = {
    "Qurʾān": "📖",
    "Duʿāʾ": "🤲",
    Gebetszeiten: "🕌",
    News: "✦",
    Jumuʿah: "🕌",
    Aqīdah: "☪",
    Manhaj: "📚",
    Beiträge: "📄"
  };

  function esc(s) {
    return global.esc ? global.esc(s) : String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function isStagingApp() {
    try {
      return Boolean(global.IS_STAGING_APP);
    } catch (e) {
      return location.pathname.indexOf("/test/") === 0 || location.pathname === "/test";
    }
  }

  function storiesIndexPath() {
    return isStagingApp() ? "/content/staging/stories/stories-index.json" : "/content/stories/stories-index.json";
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
      localStorage.setItem(SEEN_KEY, JSON.stringify([...new Set(ids.map(String))].slice(0, 200)));
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

  function injectStyles() {
    if (document.getElementById(STYLES_ID)) return;
    const style = document.createElement("style");
    style.id = STYLES_ID;
    style.textContent = `
.story-strip-section{margin:0 0 14px;padding:0}
.story-strip-head{display:flex;align-items:flex-end;justify-content:space-between;gap:8px;margin:0 0 8px 2px}
.story-strip-head span{display:block;color:var(--premium-label,#b8a878);font-size:9px;font-weight:950;letter-spacing:.14em;text-transform:uppercase}
.story-strip-head h3{font-family:var(--serif,Georgia,serif);font-size:18px;line-height:1.05;color:var(--premium-title,#f5ecd4);margin:0}
.story-strip-scroller{display:flex;gap:12px;overflow-x:auto;overflow-y:hidden;padding:2px 2px 8px;margin:0 -2px;-webkit-overflow-scrolling:touch;scroll-behavior:auto;overscroll-behavior-x:contain;touch-action:pan-x}
.story-strip-scroller::-webkit-scrollbar{height:0;width:0}
.story-ring-item{flex:0 0 auto;width:72px;text-align:center;cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none}
.story-ring-btn{width:64px;height:64px;margin:0 auto;border-radius:50%;padding:3px;background:transparent;border:none;display:grid;place-items:center;position:relative;cursor:pointer}
.story-ring-btn::before{content:"";position:absolute;inset:0;border-radius:50%;background:linear-gradient(145deg,rgba(239,215,142,.85),rgba(180,140,70,.45));opacity:.95}
.story-ring-btn.is-seen::before{background:linear-gradient(145deg,rgba(140,140,140,.35),rgba(90,90,90,.18));opacity:.75}
.story-ring-inner{position:relative;width:56px;height:56px;border-radius:50%;overflow:hidden;border:2px solid rgba(8,12,10,.92);background:linear-gradient(145deg,#1a2820,#0b100e);display:grid;place-items:center;z-index:1}
.story-ring-inner img{width:100%;height:100%;object-fit:cover;display:block}
.story-ring-icon{font-size:22px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.35))}
.story-ring-label{margin-top:6px;font-size:9px;font-weight:800;line-height:1.2;color:var(--premium-body,#d8cdb0);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:2.2em}
.story-viewer{position:fixed;inset:0;z-index:120;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.88);padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}
.story-viewer.is-open{display:flex}
.story-viewer-card{position:relative;width:min(100vw,430px);height:min(100dvh,920px);max-height:100dvh;border-radius:0;background:#0a0e0c;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.55);touch-action:none;user-select:none}
@media(min-width:768px){.story-viewer-card{border-radius:18px;height:min(88vh,820px)}}
.story-viewer-progress{display:flex;gap:4px;padding:10px 12px 0;position:absolute;top:0;left:0;right:0;z-index:4}
.story-viewer-progress span{flex:1;height:3px;border-radius:999px;background:rgba(255,255,255,.22);overflow:hidden}
.story-viewer-progress span i{display:block;height:100%;width:0;background:linear-gradient(90deg,#efefcc,#d4b86a);border-radius:999px;transition:width .08s linear}
.story-viewer-progress span.is-done i{width:100%}
.story-viewer-progress span.is-active i{width:var(--story-progress,0%)}
.story-viewer-top{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 12px 0;position:absolute;top:18px;left:0;right:0;z-index:5}
.story-viewer-meta{display:flex;align-items:center;gap:8px;min-width:0;color:#f5ecd4;font-size:11px;font-weight:800}
.story-viewer-meta-icon{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.08);font-size:14px;flex:0 0 auto}
.story-viewer-meta span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.story-viewer-close{width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.35);color:#fff;font-size:20px;line-height:1;cursor:pointer;flex:0 0 auto}
.story-viewer-bg{position:absolute;inset:0;background-size:cover;background-position:center;background-repeat:no-repeat}
.story-viewer-bg::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.35) 0%,rgba(0,0,0,.15) 35%,rgba(0,0,0,.72) 100%)}
.story-viewer-body{position:absolute;left:0;right:0;bottom:0;padding:24px 20px calc(20px + env(safe-area-inset-bottom));z-index:3;color:#f8f4e8}
.story-viewer-body h2{font-family:var(--serif,Georgia,serif);font-size:clamp(22px,5vw,28px);line-height:1.12;margin:0 0 10px;color:#fff8e8;text-shadow:0 2px 16px rgba(0,0,0,.45)}
.story-viewer-body p{margin:0;font-size:15px;line-height:1.55;color:rgba(248,244,232,.92);text-shadow:0 1px 10px rgba(0,0,0,.35);max-height:42vh;overflow:auto;-webkit-overflow-scrolling:touch}
.story-viewer-source{margin-top:10px;font-size:11px;color:rgba(248,244,232,.65);font-weight:700;letter-spacing:.04em}
.story-viewer-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.story-viewer-actions .story-cta{min-height:38px;padding:8px 14px;border-radius:999px;border:1px solid rgba(239,215,142,.45);background:rgba(239,215,142,.12);color:#fff4cc;font-size:11px;font-weight:900;cursor:pointer}
.story-viewer-actions .story-ghost{min-height:34px;padding:6px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#eee;font-size:10px;font-weight:800;cursor:pointer}
.story-viewer-zones{position:absolute;inset:0;z-index:2;display:grid;grid-template-columns:1fr 1fr}
.story-viewer-zones button{border:0;background:transparent;padding:0;margin:0;cursor:pointer;-webkit-tap-highlight-color:transparent}
html.story-viewer-open,html.story-viewer-open body{overflow:hidden!important}
html.story-viewer-open #bottomNav,html.story-viewer-open #floatActions,html.story-viewer-open #appChromeDock #bottomNav{display:none!important;visibility:hidden!important;pointer-events:none!important}
@media(prefers-reduced-motion:reduce){.story-viewer-progress span i{transition:none}}
`;
    document.head.appendChild(style);
  }

  function parseStoriesPayload(data) {
    const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
    const now = Date.now();
    return items.filter((item) => {
      if (!item || item.status && item.status !== "live") return false;
      const starts = Date.parse(item.startsAt || "");
      if (Number.isFinite(starts) && starts > now) return false;
      if (item.expiresAt) {
        const exp = Date.parse(item.expiresAt);
        if (Number.isFinite(exp) && exp <= now) return false;
      }
      return true;
    }).sort((a, b) => {
      const pin = Number(Boolean(b.pinned)) - Number(Boolean(a.pinned));
      if (pin) return pin;
      const ord = Number(a.order || 0) - Number(b.order || 0);
      if (ord) return ord;
      return Date.parse(b.updatedAt || b.createdAt || 0) - Date.parse(a.updatedAt || a.createdAt || 0);
    });
  }

  async function fetchStories({ force } = {}) {
    if (storiesLoading && !force) return stories;
    storiesLoading = true;
    storiesError = "";
    const path = storiesIndexPath();
    const bust = Date.now();
    const urls = [
      `${path}?t=${bust}`,
      `${location.origin}${path}?t=${bust}`,
      `https://raw.githubusercontent.com/Sero91ak/dar-al-tawhid-site/main${path}?t=${bust}`
    ];
    try {
      let parsed = null;
      for (const url of urls) {
        try {
          const res = await fetch(url, { cache: "no-store", credentials: "same-origin" });
          if (!res.ok) continue;
          parsed = await res.json();
          break;
        } catch (e) {}
      }
      if (!parsed) throw new Error("Storys konnten nicht geladen werden");
      stories = parseStoriesPayload(parsed);
      storiesLoaded = true;
    } catch (e) {
      storiesError = e.message || String(e);
      if (!stories.length) stories = [];
    } finally {
      storiesLoading = false;
    }
    return stories;
  }

  function iconForStory(story) {
    return story.icon || CATEGORY_ICONS[story.category] || "✦";
  }

  function renderStripHtml() {
    if (!stories.length) return "";
    const items = stories.map((story, idx) => {
      const seen = isSeen(story.id);
      const thumb = story.thumbnailUrl || story.imageUrl || "";
      const inner = thumb
        ? `<img src="${esc(thumb)}" alt="" loading="lazy" decoding="async" width="56" height="56">`
        : `<span class="story-ring-icon" aria-hidden="true">${esc(iconForStory(story))}</span>`;
      return `<div class="story-ring-item" data-story-open="${esc(story.id)}" role="button" tabindex="0" aria-label="${esc(story.title || story.category)}">
        <button class="story-ring-btn${seen ? " is-seen" : ""}" type="button" tabindex="-1"><span class="story-ring-inner">${inner}</span></button>
        <div class="story-ring-label">${esc(story.title || story.category)}</div>
      </div>`;
    }).join("");
    return `<section class="story-strip-section premium-surface" id="storyStripSection" aria-label="Storys">
      <div class="story-strip-head"><div><span>Kurz &amp; edel</span><h3>Storys</h3></div></div>
      <div class="story-strip-scroller" id="storyStripScroller">${items}</div>
    </section>`;
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
    if (t === "external" && story.targetUrl) {
      try {
        global.open(story.targetUrl, "_blank", "noopener");
      } catch (e) {}
    }
  }

  function shareStory(story) {
    const title = story.title || "DAR AL TAWḤID";
    const text = `${title}\n\n${story.text || ""}\n\nDAR AL TAWḤID`;
    if (global.navigator?.share) {
      global.navigator.share({ title, text }).catch(() => {});
      return;
    }
    try {
      global.navigator.clipboard.writeText(text);
    } catch (e) {}
  }

  function renderViewerStory(index) {
    const story = stories[index];
    if (!story) return;
    viewerIndex = index;
    const card = viewer.querySelector(".story-viewer-card");
    const bg = document.getElementById("storyViewerBg");
    const titleEl = document.getElementById("storyViewerTitle");
    const textEl = document.getElementById("storyViewerText");
    const sourceEl = document.getElementById("storyViewerSource");
    const actionsEl = document.getElementById("storyViewerActions");
    const iconEl = document.getElementById("storyViewerIcon");
    const catEl = document.getElementById("storyViewerCategory");
    const progressEl = document.getElementById("storyViewerProgress");

    if (story.imageUrl) {
      bg.style.backgroundImage = `url("${String(story.imageUrl).replace(/"/g, "\\\"")}")`;
      bg.style.background = "";
    } else {
      bg.style.backgroundImage = "";
      bg.style.background = `linear-gradient(160deg, ${story.gradientFrom || "#1a2820"} 0%, ${story.gradientTo || "#0a0e0c"} 100%)`;
    }

    iconEl.textContent = iconForStory(story);
    catEl.textContent = story.category || "Story";
    titleEl.textContent = story.title || "";
    textEl.textContent = story.text || "";
    sourceEl.textContent = story.type === "news" ? "App-Hinweis" : story.category || "";

    const cta = ctaLabel(story);
    actionsEl.innerHTML = `${cta ? `<button type="button" class="story-cta" id="storyViewerCta">${esc(cta)}</button>` : ""}
      <button type="button" class="story-ghost" id="storyViewerShare">Teilen</button>`;

    progressEl.innerHTML = stories.map((_, i) => {
      let cls = "";
      if (i < index) cls = "is-done";
      else if (i === index) cls = "is-active";
      return `<span class="${cls}"><i style="--story-progress:0%"></i></span>`;
    }).join("");

    const ctaBtn = document.getElementById("storyViewerCta");
    if (ctaBtn) ctaBtn.onclick = () => {
      closeViewer();
      openStoryTarget(story);
    };
    document.getElementById("storyViewerShare").onclick = () => shareStory(story);

    if (story.imageUrl) {
      const img = new Image();
      img.decoding = "async";
      img.src = story.imageUrl;
    }

    markSeen(story.id);
    updateStripSeenStates();
    startViewerTimer(story);
  }

  function updateStripSeenStates() {
    document.querySelectorAll(".story-ring-btn").forEach((btn) => {
      const item = btn.closest("[data-story-open]");
      if (!item) return;
      const id = item.getAttribute("data-story-open");
      btn.classList.toggle("is-seen", isSeen(id));
    });
  }

  function setViewerProgress(ratio) {
    const bar = document.querySelector("#storyViewerProgress span.is-active i");
    if (bar) bar.style.setProperty("--story-progress", `${Math.max(0, Math.min(100, ratio * 100))}%`);
  }

  function stopViewerTimer() {
    if (viewerTimer) {
      clearTimeout(viewerTimer);
      viewerTimer = null;
    }
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
      const story = stories[viewerIndex];
      if (!story) return;
      const duration = storyDurationMs(story);
      const pct = parseFloat(String(viewer._pauseProgress || "0").replace("%", "")) / 100;
      viewerStartedAt = performance.now() - pct * duration;
      startViewerTimer(story);
    }
  }

  function goNextStory(auto) {
    if (viewerIndex < stories.length - 1) {
      renderViewerStory(viewerIndex + 1);
    } else if (auto) {
      closeViewer();
    }
  }

  function goPrevStory() {
    if (viewerIndex > 0) renderViewerStory(viewerIndex - 1);
  }

  function openViewer(storyId) {
    if (!stories.length) return;
    ensureViewerDom();
    let index = stories.findIndex((s) => String(s.id) === String(storyId));
    if (index < 0) index = 0;
    viewerScrollY = window.scrollY || 0;
    document.documentElement.classList.add("story-viewer-open");
    viewer.classList.add("is-open");
    renderViewerStory(index);
  }

  function closeViewer() {
    if (!viewer) return;
    stopViewerTimer();
    viewer.classList.remove("is-open");
    document.documentElement.classList.remove("story-viewer-open");
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
      touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
    }, { passive: true });

    card.addEventListener("touchend", (e) => {
      if (!touchStart || !e.changedTouches.length) return;
      const dx = e.changedTouches[0].clientX - touchStart.x;
      const dy = e.changedTouches[0].clientY - touchStart.y;
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);
      if (ady > 80 && dy > adx) {
        closeViewer();
      } else if (adx > 50 && adx > ady) {
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
    root.querySelectorAll("[data-story-open]").forEach((el) => {
      const open = () => openViewer(el.getAttribute("data-story-open"));
      el.addEventListener("click", open);
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });
    });
  }

  function mountStrip() {
    const mount = document.getElementById("storyStripMount");
    if (!mount) return;
    if (!stories.length) {
      mount.innerHTML = "";
      mount.style.display = "none";
      return;
    }
    mount.style.display = "";
    mount.innerHTML = renderStripHtml();
    bindStripEvents(mount);
    stripMounted = true;
  }

  function renderHomeStoryMount() {
    return `<div id="storyStripMount" style="display:none"></div>`;
  }

  async function refresh({ force } = {}) {
    injectStyles();
    await fetchStories({ force });
    mountStrip();
    return stories;
  }

  function init() {
    injectStyles();
    refresh({ force: true }).catch(() => {});
  }

  function onAppReady() {
    if (document.getElementById("storyStripMount")) {
      refresh({ force: false }).catch(() => {});
    }
  }

  global.DAR_STORIES = {
    init,
    onAppReady,
    refresh,
    fetchStories,
    renderHomeStoryMount,
    openViewer,
    closeViewer,
    getStories: () => stories.slice(),
    isLoaded: () => storiesLoaded
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);
