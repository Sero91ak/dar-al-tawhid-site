/**
 * DAR AL TAWḤĪD Bibliothek — Test- und Besucher-App
 */
(function (global) {
  "use strict";

  const LIB_BASE = (typeof global.IS_TEST_PATH !== "undefined" && global.IS_TEST_PATH) ? "/test" : "";
  const DATA_URL = `${LIB_BASE}/data/library-publications.json`;
  const PROGRESS_KEY = "darLibraryProgressV1";
  const OFFLINE_DB = "darLibraryOfflineV1";
  const OFFLINE_STORE = "pdfs";
  const PDFJS_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
  const PDFJS_WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  const PDFJS_FALLBACK_URLS = [
    PDFJS_URL,
    "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js",
    "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js"
  ];

  const CATEGORIES = [
    "Alle",
    "Tawḥīd",
    "ʿAqīdah",
    "al-Asmāʾ waṣ-Ṣifāt",
    "Qurʾān",
    "Sunnah",
    "Schirk",
    "Kufr und Ṭāghūt",
    "Sünden und Reue",
    "Gebet",
    "Fiqh",
    "Familie",
    "Manhaj",
    "Widerlegungen"
  ];

  let catalog = null;
  let catalogError = "";
  let catalogLoading = null;
  let uiState = { query: "", category: "Alle", catOpen: false };
  let libraryPreserveScroll = false;
  let libraryPreserveFocus = false;
  let libraryListScrollY = 0;
  let librarySearchSelection = 0;
  let readerState = null;
  const LIBRARY_STATS_CACHE = new Map();
  let libraryStatsPollTimer = null;
  let libraryStatsPollId = "";
  const LIBRARY_STATS_POLL_MS = 15000;
  const LIBRARY_VIEWED_SESSION = new Set();

  function trackLibraryEvent(eventType, pub) {
    if (!pub) return;
    const analyticsEventType = mapLibraryAnalyticsEvent(eventType);
    try {
      const track = (global.DarAnalytics && typeof global.DarAnalytics.track === "function" && global.DarAnalytics.track.bind(global.DarAnalytics))
        || global.trackAnalytics;
      if (typeof track === "function") {
        track(analyticsEventType, {
          contentType: "library",
          contentId: String(pub.id || ""),
          contentTitle: pub.title || ""
        });
      }
    } catch (e) {
      /* Statistik darf Lesen nie blockieren */
    }
    bumpLibraryStatOptimistic(pub.id, eventType);
    scheduleLibraryStatsRefresh(pub.id);
  }

  function mapLibraryAnalyticsEvent(eventType) {
    if (eventType === "library_read") return "post_share";
    if (eventType === "library_download") return "post_save";
    return "post_view";
  }

  function formatStatCount(value) {
    const n = Number(value) || 0;
    try {
      return new Intl.NumberFormat("de-DE").format(n);
    } catch (e) {
      return String(n);
    }
  }

  function emptyLibraryStats() {
    return { clicks: 0, reads: 0, downloads: 0 };
  }

  function mergeLibraryStats(local, remote) {
    const a = local || emptyLibraryStats();
    const b = remote || emptyLibraryStats();
    return {
      clicks: Math.max(Number(a.clicks) || 0, Number(b.clicks) || 0),
      reads: Math.max(Number(a.reads) || 0, Number(b.reads) || 0),
      downloads: Math.max(Number(a.downloads) || 0, Number(b.downloads) || 0)
    };
  }

  function parseLibraryStatsRow(row) {
    return {
      clicks: Number(row?.views) || 0,
      reads: Number(row?.shares) || 0,
      downloads: Number(row?.saves) || 0
    };
  }

  async function fetchLibraryStats(publicationId, options) {
    const id = String(publicationId || "").trim();
    if (!id) return emptyLibraryStats();
    const force = options?.force === true;
    if (!force && LIBRARY_STATS_CACHE.has(id)) return LIBRARY_STATS_CACHE.get(id);
    const cfg = global.DAR_ANALYTICS_CONFIG || {};
    const baseUrl = String(cfg.supabaseUrl || "").replace(/\/$/, "");
    const key = String(cfg.supabaseKey || "");
    if (!baseUrl || !key) {
      const empty = emptyLibraryStats();
      LIBRARY_STATS_CACHE.set(id, empty);
      return empty;
    }
    try {
      const res = await fetch(
        `${baseUrl}/rest/v1/stats_totals?content_type=eq.library&content_id=eq.${encodeURIComponent(id)}&select=views,shares,saves&limit=1&_ts=${Date.now()}`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" }
      );
      if (!res.ok) throw new Error("stats " + res.status);
      const rows = await res.json();
      const row = Array.isArray(rows) ? rows[0] : null;
      const remote = parseLibraryStatsRow(row);
      const stats = mergeLibraryStats(LIBRARY_STATS_CACHE.get(id), remote);
      LIBRARY_STATS_CACHE.set(id, stats);
      return stats;
    } catch (e) {
      const cached = LIBRARY_STATS_CACHE.get(id);
      if (cached) return cached;
      return emptyLibraryStats();
    }
  }

  async function prefetchLibraryStatsForCatalog() {
    const cfg = global.DAR_ANALYTICS_CONFIG || {};
    const baseUrl = String(cfg.supabaseUrl || "").replace(/\/$/, "");
    const key = String(cfg.supabaseKey || "");
    if (!baseUrl || !key) return;
    try {
      const res = await fetch(
        `${baseUrl}/rest/v1/stats_totals?content_type=eq.library&select=content_id,views,shares,saves&limit=500&_ts=${Date.now()}`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" }
      );
      if (!res.ok) return;
      const rows = await res.json();
      (Array.isArray(rows) ? rows : []).forEach((row) => {
        const id = String(row?.content_id || "").trim();
        if (!id) return;
        const remote = parseLibraryStatsRow(row);
        LIBRARY_STATS_CACHE.set(id, mergeLibraryStats(LIBRARY_STATS_CACHE.get(id), remote));
      });
    } catch (e) {
      /* Statistik-Prefetch darf Bibliothek nie blockieren */
    }
  }

  function applyLibraryStatsToPanel(publicationId, stats) {
    const id = String(publicationId || "").trim();
    if (!id) return;
    const merged = mergeLibraryStats(LIBRARY_STATS_CACHE.get(id), stats);
    LIBRARY_STATS_CACHE.set(id, merged);
    const panel = document.querySelector(`[data-library-stats="${id}"]`);
    if (!panel) return;
    const clicksEl = panel.querySelector("[data-library-stat-clicks]");
    const readsEl = panel.querySelector("[data-library-stat-reads]");
    const downloadsEl = panel.querySelector("[data-library-stat-downloads]");
    if (clicksEl) clicksEl.textContent = formatStatCount(merged.clicks);
    if (readsEl) readsEl.textContent = formatStatCount(merged.reads);
    if (downloadsEl) downloadsEl.textContent = formatStatCount(merged.downloads);
  }

  function bumpLibraryStatOptimistic(publicationId, eventType) {
    const id = String(publicationId || "").trim();
    if (!id) return;
    const stats = { ...(LIBRARY_STATS_CACHE.get(id) || emptyLibraryStats()) };
    if (eventType === "library_click" || eventType === "library_view") stats.clicks += 1;
    else if (eventType === "library_read") stats.reads += 1;
    else if (eventType === "library_download") stats.downloads += 1;
    LIBRARY_STATS_CACHE.set(id, stats);
    applyLibraryStatsToPanel(id, stats);
  }

  function scheduleLibraryStatsRefresh(publicationId) {
    const id = String(publicationId || "").trim();
    if (!id) return;
    [1200, 4500].forEach((delay) => {
      setTimeout(() => {
        LIBRARY_STATS_CACHE.delete(id);
        hydrateLibraryStats(id);
      }, delay);
    });
  }

  function stopLibraryStatsPolling() {
    if (libraryStatsPollTimer) {
      clearInterval(libraryStatsPollTimer);
      libraryStatsPollTimer = null;
    }
    libraryStatsPollId = "";
  }

  function startLibraryStatsPolling(publicationId) {
    const id = String(publicationId || "").trim();
    if (!id) return;
    if (libraryStatsPollId === id && libraryStatsPollTimer) return;
    stopLibraryStatsPolling();
    libraryStatsPollId = id;
    libraryStatsPollTimer = setInterval(() => {
      LIBRARY_STATS_CACHE.delete(id);
      hydrateLibraryStats(id);
    }, LIBRARY_STATS_POLL_MS);
  }

  function renderLibraryStatsPanel(publicationId) {
    const id = String(publicationId || "").trim();
    const cached = LIBRARY_STATS_CACHE.get(id);
    const clicks = cached ? formatStatCount(cached.clicks) : "—";
    const reads = cached ? formatStatCount(cached.reads) : "—";
    const downloads = cached ? formatStatCount(cached.downloads) : "—";
    return `<section class="lib-stats-live" data-library-stats="${esc(id)}" aria-label="Besucherstatistik">
      <div class="lib-stats-live-head">
        <span class="lib-stats-live-label">Besucherstatistik</span>
      </div>
      <div class="lib-stats-live-row">
        <div class="lib-stats-live-item">
          <b>Klicks</b>
          <span data-library-stat-clicks>${clicks}</span>
        </div>
        <div class="lib-stats-live-item">
          <b>Gelesen</b>
          <span data-library-stat-reads>${reads}</span>
        </div>
        <div class="lib-stats-live-item">
          <b>Downloads</b>
          <span data-library-stat-downloads>${downloads}</span>
        </div>
      </div>
    </section>`;
  }

  async function hydrateLibraryStats(publicationId) {
    const id = String(publicationId || "").trim();
    if (!id) return;
    const stats = await fetchLibraryStats(id, { force: true });
    applyLibraryStatsToPanel(id, stats);
  }

  function trackLibraryDetailView(pub) {
    const id = String(pub?.id || "").trim();
    if (!id || LIBRARY_VIEWED_SESSION.has(id)) return;
    LIBRARY_VIEWED_SESSION.add(id);
    trackLibraryEvent("library_view", pub);
  }

  function esc(s) {
    return global.esc ? global.esc(s) : String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function navigate(view, value) {
    if (typeof global.navigate === "function") global.navigate(view, value || "");
    else global.location.hash = value ? `#${view}/${encodeURIComponent(value)}` : `#${view}`;
  }

  function navigateDetail(slug) {
    navigate("bibliothek", slug);
  }

  function navigateReader(slug) {
    global.location.hash = `#bibliothek/${encodeURIComponent(slug)}/lesen`;
  }

  function normalizeSearchText(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[ʾʿāīūḥṣḍṭẓġ]/gi, (ch) => {
        const map = { ʾ: "", ʿ: "", ā: "a", ī: "i", ū: "u", ḥ: "h", ṣ: "s", ḍ: "d", ṭ: "t", ẓ: "z", ġ: "g" };
        return map[ch] || map[ch.toLowerCase()] || ch;
      })
      .replace(/[^a-z0-9\s-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function publicationSearchBlob(pub) {
    const parts = [
      pub.title,
      pub.transliteratedTitle,
      pub.subtitle,
      pub.description,
      pub.category,
      pub.topic,
      pub.editor,
      pub.publisher,
      pub.credit,
      pub.language,
      (pub.tags || []).join(" "),
      (pub.searchAliases || []).join(" ")
    ];
    return normalizeSearchText(parts.join(" "));
  }

  function matchesSearch(pub, query) {
    const q = normalizeSearchText(query);
    if (!q) return true;
    const blob = publicationSearchBlob(pub);
    return q.split(" ").filter(Boolean).every((token) => blob.includes(token));
  }

  function matchesCategory(pub, category) {
    if (!category || category === "Alle") return true;
    const cat = String(pub.category || "");
    const topic = String(pub.topic || "");
    if (category === "al-Asmāʾ waṣ-Ṣifāt") {
      return topic === category || cat === category || publicationSearchBlob(pub).includes("asma");
    }
    return cat === category || topic === category;
  }

  function visiblePublications(list) {
    return (list || []).filter((p) => !["archived", "draft", "error"].includes(String(p.status || "")));
  }

  function coverSources(pub) {
    const urls = pub.coverUrls || {};
    return {
      small: urls.small || urls.coverSmall || pub.coverUrl || "",
      medium: urls.medium || urls.coverMedium || pub.coverUrl || "",
      master: urls.master || urls.coverMaster || pub.coverUrl || ""
    };
  }

  function coverHtml(pub, className) {
    const src = coverSources(pub);
    const alt = `${pub.title} – Buchcover`;
    const medium = src.medium || src.small || src.master;
    if (medium) {
      const srcset = [
        src.small ? `${esc(src.small)} 400w` : "",
        src.medium ? `${esc(src.medium)} 800w` : "",
        src.master ? `${esc(src.master)} 1200w` : ""
      ].filter(Boolean).join(", ");
      return `<img class="${className || "lib-cover"}" src="${esc(medium)}" ${srcset ? `srcset="${srcset}" sizes="(max-width:520px) 42vw, 180px"` : ""} alt="${esc(alt)}" loading="lazy" decoding="async" onerror="this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.hidden=false"><div class="lib-cover-fallback" hidden>${esc(pub.transliteratedTitle || pub.title)}</div>`;
    }
    return `<div class="lib-cover-fallback" role="img" aria-label="${esc(alt)}">${esc(pub.transliteratedTitle || pub.title)}</div>`;
  }

  function filteredPublications(list) {
    return visiblePublications(list).filter((p) => matchesCategory(p, uiState.category) && matchesSearch(p, uiState.query));
  }

  function getProgressMap() {
    try {
      return JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
    } catch (e) {
      return {};
    }
  }

  function getProgress(id) {
    const map = getProgressMap();
    return map[id] || null;
  }

  function saveProgress(id, lastPage, totalPages) {
    try {
      const map = getProgressMap();
      map[id] = {
        publicationId: id,
        lastPage: Number(lastPage) || 1,
        totalPages: Number(totalPages) || 0,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(map));
    } catch (e) {
      /* Lesen darf nie blockieren */
    }
  }

  function markOpened(id) {
    try {
      const key = "darLibraryOpenedV1";
      const map = JSON.parse(localStorage.getItem(key) || "{}");
      map[id] = new Date().toISOString();
      localStorage.setItem(key, JSON.stringify(map));
    } catch (e) {}
  }

  function getRecentlyRead(list) {
    const progress = getProgressMap();
    return visiblePublications(list)
      .filter((p) => progress[p.id] && progress[p.id].lastPage > 0)
      .sort((a, b) => String(progress[b.id].updatedAt).localeCompare(String(progress[a.id].updatedAt)));
  }

  function formatDate(value) {
    if (!value) return "—";
    try {
      return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
    } catch (e) {
      return String(value);
    }
  }

  function formatCardDate(value) {
    if (!value) return "";
    try {
      return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
    } catch (e) {
      return "";
    }
  }

  function cardMetaPrimary(pub) {
    const parts = [];
    const cat = String(pub.category || "").trim();
    const pages = pub.pageCount && Number(pub.pageCount) > 0 ? `${pub.pageCount} Seiten` : "";
    if (cat) parts.push(cat);
    if (pages) parts.push(pages);
    return parts.join(" · ");
  }

  function cardDate(pub) {
    return formatCardDate(pub.updatedAt || pub.publishedAt || "");
  }

  function cardAriaLabel(pub) {
    const parts = [pub.title];
    const meta = cardMetaPrimary(pub);
    const date = cardDate(pub);
    if (meta) parts.push(meta);
    if (date) parts.push(date);
    return parts.join(", ");
  }

  function publicationCountLabel(count, isFiltered) {
    const n = Number(count) || 0;
    if (isFiltered) return n === 1 ? "1 Treffer" : `${n} Treffer`;
    return n === 1 ? "1 Titel" : `${n} Titel`;
  }

  function markLibraryRenderPreserve(scrollY, focusSearch, selection) {
    libraryListScrollY = Number(scrollY) || 0;
    libraryPreserveScroll = true;
    libraryPreserveFocus = focusSearch === true;
    librarySearchSelection = Number(selection) || 0;
  }

  function statusLabel(pub) {
    if (pub.status === "preparing") return "Veröffentlichung wird vorbereitet";
    if (pub.status === "updated") return "Aktualisiert";
    if (pub.status === "archived") return "Archiviert";
    return "Veröffentlicht";
  }

  function canRead(pub) {
    return pub.status === "published" || pub.status === "updated" ? Boolean(pub.pdfUrl) : false;
  }

  function canDownload(pub) {
    return canRead(pub) && pub.downloadEnabled !== false;
  }

  function canOffline(pub) {
    return canRead(pub) && pub.offlineEnabled !== false;
  }

  function publicationPdfUrl(pub) {
    const raw = String(pub?.pdfUrl || "").trim();
    if (!raw) return "";
    return raw.startsWith("/") ? `${LIB_BASE}${raw}` : raw;
  }

  function openPublicationPdf(pub, options = {}) {
    const url = publicationPdfUrl(pub);
    if (!url) return false;
    const track = options.track !== false;
    if (track) {
      trackLibraryEvent("library_read", pub);
      scheduleLibraryStatsRefresh(pub.id);
    }
    try {
      const popup = global.open(url, "_blank", "noopener,noreferrer");
      if (popup) return true;
    } catch (e) {
      /* Fallback unten */
    }
    try {
      global.location.href = url;
      return true;
    } catch (e) {
      return false;
    }
  }

  function badgeHtml(pub) {
    const badges = [];
    if (pub.isNew) badges.push('<span class="lib-badge">Neu</span>');
    if (pub.isRecommended) badges.push('<span class="lib-badge">Empfohlen</span>');
    if (pub.status === "updated") badges.push('<span class="lib-badge">Aktualisiert</span>');
    return badges.join("");
  }

  function progressHtml(pub) {
    const p = getProgress(pub.id);
    if (!p || !p.totalPages) return "";
    const pct = Math.max(4, Math.min(100, Math.round((p.lastPage / p.totalPages) * 100)));
    return `<div class="lib-progress-bar" aria-hidden="true"><span style="width:${pct}%"></span></div>`;
  }

  function cardHtml(pub, offlineIds) {
    const offline = offlineIds && offlineIds.has(pub.id);
    const meta = cardMetaPrimary(pub);
    const date = cardDate(pub);
    const aria = cardAriaLabel(pub);
    return `<button class="lib-card" type="button" data-library-open="${esc(pub.slug)}" aria-label="${esc(aria)} öffnen" title="${esc(pub.title)}">
      <div class="lib-cover-wrap">
        ${coverHtml(pub)}
        <div class="lib-badges">${badgeHtml(pub)}${offline ? '<span class="lib-badge is-offline">Offline</span>' : ""}</div>
        ${progressHtml(pub)}
      </div>
      <div class="lib-card-body">
        <div class="lib-card-divider" aria-hidden="true"></div>
        <h4>${esc(pub.title)}</h4>
        ${meta ? `<p class="lib-card-meta-line">${esc(meta)}</p>` : ""}
        ${date ? `<p class="lib-card-date">${esc(date)}</p>` : ""}
      </div>
    </button>`;
  }

  function compactCardHtml(pub, offlineIds) {
    const offline = offlineIds && offlineIds.has(pub.id);
    const progress = getProgress(pub.id);
    return `<button class="lib-card lib-card-compact" type="button" data-library-open="${esc(pub.slug)}" aria-label="${esc(pub.title)} öffnen">
      <div class="lib-cover-wrap">
        ${coverHtml(pub, "lib-cover")}
        ${offline ? '<div class="lib-badges"><span class="lib-badge is-offline">Offline</span></div>' : ""}
        ${progress && progress.lastPage ? progressHtml(pub) : ""}
      </div>
      <div class="lib-card-body"><h4>${esc(pub.title)}</h4></div>
    </button>`;
  }

  function sectionHtml(title, countLabel, cards, layout) {
    if (!cards) return "";
    const innerClass = layout === "shelf"
      ? "lib-shelf-row"
      : layout === "grid-compact"
        ? "lib-grid lib-grid-compact"
        : "lib-grid";
    const inner = `<div class="${innerClass}">${cards}</div>`;
    const compactClass = layout === "grid-compact" ? " lib-section-compact" : "";
    return `<section class="lib-section${compactClass}">
      <div class="lib-section-head">
        <div class="lib-section-head-main">
          <h3>${esc(title)}</h3>
          ${countLabel ? `<span class="lib-section-count">${esc(countLabel)}</span>` : ""}
        </div>
        <div class="lib-section-head-line" aria-hidden="true"></div>
      </div>
      ${inner}
    </section>`;
  }

  function renderCategoryPicker() {
    const label = uiState.category === "Alle" ? "Alle Kategorien" : uiState.category;
    const options = CATEGORIES.map((cat) =>
      `<button class="lib-cat-option" type="button" data-library-cat="${esc(cat)}" aria-pressed="${uiState.category === cat ? "true" : "false"}">${esc(cat)}</button>`
    ).join("");
    return `<div class="lib-cat-picker">
      <button class="lib-cat-toggle" type="button" data-library-cat-toggle aria-expanded="${uiState.catOpen ? "true" : "false"}" aria-controls="libraryCatPanel">
        <span class="lib-cat-toggle-label">Thema: ${esc(label)}</span>
        <span class="lib-cat-chevron" aria-hidden="true">${uiState.catOpen ? "▴" : "▾"}</span>
      </button>
      <div id="libraryCatPanel" class="lib-cat-panel${uiState.catOpen ? " is-open" : ""}">${options}</div>
    </div>`;
  }

  function listSectionTitle() {
    if (uiState.query) return "Suchergebnisse";
    if (uiState.category !== "Alle") return uiState.category;
    return "Alle Veröffentlichungen";
  }

  function renderLoading() {
    return `<section class="lib-page"><div class="lib-empty">Bibliothek wird geladen…</div></section>`;
  }

  function renderError() {
    return `<section class="lib-page"><div class="lib-error">Die Bibliothek konnte momentan nicht geladen werden. Bitte versuche es erneut.<br><button type="button" data-library-retry>Erneut versuchen</button></div></section>`;
  }

  function renderEmptyState() {
    return `<div class="lib-empty-state" role="status">
      <p class="lib-empty-title">Keine Veröffentlichung gefunden</p>
      <p class="lib-empty-hint">Prüfe den Suchbegriff oder wähle eine andere Kategorie.</p>
      <button class="lib-empty-reset" type="button" data-library-reset-filters>Filter zurücksetzen</button>
    </div>`;
  }

  function renderFilterChip() {
    if (uiState.category === "Alle") return "";
    return `<div class="lib-filter-chip-wrap">
      <button class="lib-filter-chip" type="button" data-library-filter-clear aria-label="Filter ${esc(uiState.category)} entfernen">
        <span>${esc(uiState.category)}</span>
        <span class="lib-filter-chip-x" aria-hidden="true">×</span>
      </button>
    </div>`;
  }

  function renderBibliothekMain(offlineIds) {
    const all = visiblePublications(catalog.publications || []);
    const filtered = filteredPublications(all);
    const isFiltered = Boolean(uiState.query) || uiState.category !== "Alle";
    const countLabel = publicationCountLabel(filtered.length, isFiltered);
    const catButtons = renderCategoryPicker();
    const cards = filtered.map((p) => cardHtml(p, offlineIds)).join("");
    const sections = cards
      ? sectionHtml(listSectionTitle(), countLabel, cards)
      : renderEmptyState();
    const hasSearch = Boolean(uiState.query);

    return `<section class="lib-page" data-library-root>
      <header class="lib-hero" aria-label="Bibliothekskopf">
        <div class="lib-hero-inner">
          <h2>DAR AL TAWḤĪD Bibliothek</h2>
          <p class="lib-hero-lead">Bücher, Abhandlungen und Themenhefte von Serhat Abu Malik</p>
          <p class="lib-hero-note is-short">Veröffentlichungen zu Tawḥīd, ʿAqīdah, Qurʾān und Sunnah.</p>
          <p class="lib-hero-note is-full">Ausführliche Veröffentlichungen zu Tawḥīd, ʿAqīdah, Qurʾān, Sunnah und dem Verständnis der Salaf.</p>
        </div>
        <div class="lib-hero-line" aria-hidden="true"></div>
      </header>
      <div class="lib-toolbar${uiState.catOpen ? " is-cat-open" : ""}">
        <div class="lib-search-wrap">
          <label class="visually-hidden" for="librarySearch">Bücher und Themen durchsuchen</label>
          <input id="librarySearch" class="lib-search" type="search" placeholder="Bücher und Themen durchsuchen" autocomplete="off" enterkeyhint="search" value="${esc(uiState.query)}">
          <button class="lib-search-clear${hasSearch ? " is-visible" : ""}" type="button" data-library-search-clear aria-label="Suche löschen"${hasSearch ? "" : " hidden"}>×</button>
        </div>
        <div class="lib-cats">${catButtons}</div>
        ${renderFilterChip()}
      </div>
      ${sections}
    </section>`;
  }

  function relatedHtml(pub, list) {
    const ids = pub.relatedPublicationIds || [];
    const related = ids.map((id) => list.find((p) => p.id === id)).filter(Boolean);
    if (!related.length) return "";
    return `<section class="lib-panel"><h3>Ähnliche Veröffentlichungen</h3><div class="lib-grid">${related.map((p) => cardHtml(p)).join("")}</div></section>`;
  }

  function renderBibliothekDetail(slug, offlineIds) {
    const list = catalog.publications || [];
    const pub = list.find((p) => p.slug === slug || p.id === slug);
    if (!pub || (pub.status === "archived" && !global.location.search.includes("preview=1"))) {
      return `<section class="lib-page"><div class="lib-empty">Diese Veröffentlichung ist nicht verfügbar.</div></section>`;
    }

    markOpened(pub.id);
    const progress = getProgress(pub.id);
    const offline = offlineIds && offlineIds.has(pub.id);
    const readEnabled = canRead(pub);
    const downloadEnabled = canDownload(pub);
    const offlineEnabled = canOffline(pub);
    const preparing = pub.status === "preparing" || !pub.pdfUrl;
    const readLabel = progress && progress.lastPage > 1 ? `Weiterlesen · S. ${progress.lastPage}` : "Jetzt lesen";

    const toc = (pub.tableOfContents || []);
    const sources = pub.sources || [];

    return `<section class="lib-page lib-detail" data-library-detail="${esc(pub.slug)}">
      <div class="lib-detail-hero lib-detail-hero-compact">
        <div class="lib-detail-cover">${coverHtml(pub)}</div>
        <div class="lib-detail-copy">
          ${pub.transliteratedTitle ? `<p class="lib-detail-kicker">${esc(pub.transliteratedTitle)}</p>` : ""}
          <h2>${esc(pub.title)}</h2>
          ${pub.subtitle ? `<p class="lib-detail-sub">${esc(pub.subtitle)}</p>` : ""}
          ${pub.description ? `<p class="lib-detail-desc">${esc(pub.description)}</p>` : ""}
        </div>
      </div>
      ${preparing ? `<div class="lib-status-note" role="status">Veröffentlichung wird vorbereitet</div>` : ""}
      <div class="lib-actions lib-actions-compact">
        <div class="lib-actions-row">
          <button class="lib-btn lib-btn-primary" type="button" data-library-read="${esc(pub.slug)}" ${readEnabled ? "" : "disabled"}>${readLabel}</button>
          <button class="lib-btn" type="button" data-library-download="${esc(pub.slug)}" ${downloadEnabled ? "" : "disabled"}>PDF</button>
          <button class="lib-btn" type="button" data-library-share="${esc(pub.slug)}">Teilen</button>
        </div>
        <div class="lib-actions-row lib-actions-row-secondary">
          <button class="lib-btn lib-btn-ghost" type="button" data-library-offline="${esc(pub.slug)}" ${offlineEnabled && !offline ? "" : "disabled"}>${offline ? "Offline gespeichert" : "Offline speichern"}</button>
          ${offline && offlineEnabled ? `<button class="lib-btn lib-btn-ghost" type="button" data-library-offline-remove="${esc(pub.slug)}">Offline entfernen</button>` : ""}
        </div>
      </div>
      <div class="lib-meta-grid lib-meta-grid-compact">
        <div class="lib-meta-item"><b>Kategorie</b><span>${esc(pub.category || "—")}</span></div>
        <div class="lib-meta-item"><b>Thema</b><span>${esc(pub.topic || "—")}</span></div>
        <div class="lib-meta-item"><b>Sprache</b><span>${esc(pub.language || "—")}</span></div>
        <div class="lib-meta-item"><b>Dateigröße</b><span>${esc(pub.fileSize || "—")}</span></div>
        <div class="lib-meta-item"><b>Aktualisiert</b><span>${esc(formatDate(pub.updatedAt))}</span></div>
        <div class="lib-meta-item"><b>Lesefortschritt</b><span>${progress && progress.lastPage ? `Seite ${progress.lastPage}${progress.totalPages ? ` von ${progress.totalPages}` : ""}` : pub.pageCount ? `0 von ${pub.pageCount}` : "Noch nicht begonnen"}</span></div>
      </div>
      ${renderLibraryStatsPanel(pub.id)}
      ${toc.length ? `<section class="lib-panel"><h3>Inhaltsverzeichnis</h3><ul>${toc.map((item) => `<li>${esc(item.title || item)}</li>`).join("")}</ul></section>` : ""}
      ${pub.about ? `<section class="lib-panel"><h3>Über diese Veröffentlichung</h3><p>${esc(pub.about)}</p></section>` : ""}
      ${sources.length ? `<section class="lib-panel"><h3>Verwendete Quellen</h3><ul>${sources.map((s) => `<li>${esc(typeof s === "string" ? s : s.title || s.name || "")}</li>`).join("")}</ul></section>` : ""}
      ${relatedHtml(pub, list)}
    </section>`;
  }

  function renderBibliothekReader(slug) {
    const pub = (catalog.publications || []).find((p) => p.slug === slug || p.id === slug);
    if (!pub || !canRead(pub)) {
      return `<section class="lib-page"><div class="lib-empty">Diese Veröffentlichung wird momentan vorbereitet.</div></section>`;
    }
    const progress = getProgress(pub.id);
    return `<div class="lib-reader" data-library-reader="${esc(pub.slug)}" role="dialog" aria-label="PDF-Leser: ${esc(pub.title)}">
      <div class="lib-reader-toolbar lib-reader-toolbar-compact">
        <button class="lib-btn lib-btn-ghost lib-reader-icon" type="button" data-library-reader-close aria-label="Zurück zur Buchdetailseite">←</button>
        <button class="lib-btn lib-reader-icon" type="button" data-library-reader-prev aria-label="Vorherige Seite">▲</button>
        <label class="lib-reader-page"><input type="number" min="1" data-library-reader-input value="${progress?.lastPage || 1}" aria-label="Seitennummer"> / <span data-library-reader-total>—</span></label>
        <button class="lib-btn lib-reader-icon" type="button" data-library-reader-next aria-label="Nächste Seite">▼</button>
        <div class="lib-reader-toolbar-end">
          <button class="lib-btn lib-reader-icon" type="button" data-library-reader-download aria-label="Download">↓</button>
          <button class="lib-btn lib-reader-icon" type="button" data-library-reader-share aria-label="Teilen">⤴</button>
        </div>
      </div>
      <div class="lib-reader-titlebar">${esc(pub.title)}</div>
      <div class="lib-reader-stage" data-library-reader-stage>
        <div class="lib-reader-msg">PDF wird geladen…</div>
      </div>
    </div>`;
  }

  function renderBibliothek() {
    if (catalogError) return renderError();
    if (!catalog) return renderLoading();
    return renderBibliothekMain(new Set());
  }

  function renderBibliothekDetailView(slug) {
    if (catalogError) return renderError();
    if (!catalog) return renderLoading();
    return renderBibliothekDetail(slug, new Set());
  }

  function renderBibliothekReaderView(slug) {
    if (catalogError) return renderError();
    if (!catalog) return renderLoading();
    return renderBibliothekReader(slug);
  }

  function invalidateCatalog() {
    catalog = null;
    catalogError = "";
    catalogLoading = null;
  }

  function refreshCatalog() {
    invalidateCatalog();
    return ensureCatalog();
  }

  function ensureCatalog() {
    if (catalog) return Promise.resolve(catalog);
    if (catalogLoading) return catalogLoading;
    catalogLoading = fetch(DATA_URL, { cache: "no-cache" })
      .then((res) => {
        if (!res.ok) throw new Error("load failed");
        return res.json();
      })
      .then((data) => {
        catalog = data;
        catalogError = "";
        prefetchLibraryStatsForCatalog();
        return data;
      })
      .catch((e) => {
        catalogError = e.message || "load failed";
        throw e;
      })
      .finally(() => {
        catalogLoading = null;
      });
    return catalogLoading;
  }

  function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(OFFLINE_DB, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(OFFLINE_STORE)) db.createObjectStore(OFFLINE_STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function listOfflineIds() {
    try {
      const db = await openDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(OFFLINE_STORE, "readonly");
        const store = tx.objectStore(OFFLINE_STORE);
        const req = store.getAllKeys();
        req.onsuccess = () => resolve(new Set((req.result || []).map(String)));
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      return new Set();
    }
  }

  async function getOfflineBlob(id) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(OFFLINE_STORE, "readonly");
      const req = tx.objectStore(OFFLINE_STORE).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async function putOfflineBlob(id, blob) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(OFFLINE_STORE, "readwrite");
      tx.objectStore(OFFLINE_STORE).put(blob, id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  async function removeOfflineBlob(id) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(OFFLINE_STORE, "readwrite");
      tx.objectStore(OFFLINE_STORE).delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  async function fetchPdfBlob(pub) {
    const offline = await getOfflineBlob(pub.id);
    if (offline) return offline;
    if (!pub.pdfUrl) throw new Error("missing pdf");
    const res = await fetch(pub.pdfUrl, { cache: "no-cache" });
    if (!res.ok) throw new Error("download failed");
    return res.blob();
  }

  function sharePublication(pub) {
    const text = `${pub.title}\nEine Veröffentlichung von DAR AL TAWḤĪD\nZusammengestellt und herausgegeben von Serhat Abu Malik\ndar-al-tawhid.de`;
    const url = `${global.location.origin}${LIB_BASE}/#bibliothek/${encodeURIComponent(pub.slug)}`;
    if (navigator.share) {
      return navigator.share({ title: pub.title, text, url }).catch(() => {});
    }
    return navigator.clipboard.writeText(`${text}\n${url}`).then(() => {
      alert("Link wurde in die Zwischenablage kopiert.");
    }).catch(() => {
      prompt("Kopiere den Link:", `${text}\n${url}`);
    });
  }

  function loadPdfJs() {
    if (global.pdfjsLib) return Promise.resolve(global.pdfjsLib);
    if (global.__pdfJsLoading) return global.__pdfJsLoading;
    global.__pdfJsLoading = new Promise((resolve, reject) => {
      let idx = 0;
      const tryLoad = () => {
        if (global.pdfjsLib) {
          try {
            global.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
          } catch (e) {
            /* Worker ist optional, wir haben workerlosen Fallback */
          }
          resolve(global.pdfjsLib);
          return;
        }
        if (idx >= PDFJS_FALLBACK_URLS.length) {
          reject(new Error("PDF.js konnte nicht geladen werden"));
          return;
        }
        const s = document.createElement("script");
        s.src = PDFJS_FALLBACK_URLS[idx++];
        s.async = true;
        s.onload = () => {
          if (global.pdfjsLib) {
            try {
              global.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
            } catch (e) {
              /* Worker ist optional, wir haben workerlosen Fallback */
            }
            resolve(global.pdfjsLib);
            return;
          }
          tryLoad();
        };
        s.onerror = () => tryLoad();
        document.head.appendChild(s);
      };
      tryLoad();
    });
    return global.__pdfJsLoading;
  }

  let readerPageObserver = null;
  let readerRenderToken = 0;
  let readerSessionId = 0;

  function getReaderRoot() {
    return document.querySelector("[data-library-reader-portal]")
      || document.querySelector("[data-library-reader]");
  }

  function getReaderStage() {
    const root = getReaderRoot();
    return root ? root.querySelector("[data-library-reader-stage]") : null;
  }

  function readerPublicationSlug(root) {
    return String(root?.getAttribute("data-library-reader") || "").trim();
  }

  function scrubDuplicateReaders(activeRoot) {
    document.querySelectorAll("[data-library-reader]").forEach((el) => {
      if (el !== activeRoot) el.remove();
    });
  }

  function isReaderActive(slug) {
    const key = String(slug || "").trim();
    if (!key || !readerState?.doc || !readerState?.pub) return false;
    const pubSlug = String(readerState.pub.slug || readerState.pub.id || "").trim();
    const root = getReaderRoot();
    if (!root || !root.hasAttribute("data-library-reader-portal")) return false;
    if (pubSlug !== key || readerPublicationSlug(root) !== key) return false;
    const stage = root.querySelector("[data-library-reader-stage]");
    if (!stage) return false;
    return !!stage.querySelector(".lib-reader-page-canvas, .lib-reader-fallback, .lib-reader-native");
  }

  function shouldUseNativePdfViewer() {
    const ua = String(navigator.userAgent || "");
    const mobile = /iPhone|iPad|iPod|Android/i.test(ua);
    const touch = (navigator.maxTouchPoints || 0) > 1;
    const narrow = global.matchMedia ? global.matchMedia("(max-width: 900px)").matches : false;
    return mobile || (touch && narrow);
  }

  function readerPdfDisplayUrl(page) {
    const pageHash = page ? `#page=${page}` : "";
    if (readerState?.blobUrl) return `${readerState.blobUrl}${pageHash}`;
    const pub = readerState?.pub;
    if (pub?.pdfUrl && !readerState?.useOfflineBlob) {
      const path = String(pub.pdfUrl).startsWith("/") ? `${LIB_BASE}${pub.pdfUrl}` : pub.pdfUrl;
      return `${path}${pageHash}`;
    }
    return "";
  }

  function renderReaderNativeFallback(stage, page) {
    if (!stage) return false;
    stage.innerHTML = `<div class="lib-reader-msg">PDF-Ansicht wird vorbereitet…</div>`;
    return true;
  }

  function renderReaderIframeFallback(stage, page) {
    return renderReaderNativeFallback(stage, page);
  }

  function isCanvasLikelyBlank(canvas) {
    try {
      const ctx = canvas.getContext("2d");
      if (!ctx || canvas.width < 2 || canvas.height < 2) return true;
      const x = Math.max(1, Math.floor(canvas.width / 2));
      const y = Math.max(1, Math.floor(canvas.height / 2));
      const sample = ctx.getImageData(x, y, 1, 1).data;
      return sample[0] === 0 && sample[1] === 0 && sample[2] === 0;
    } catch (e) {
      return false;
    }
  }

  function removeReaderOverlay() {
    document.querySelectorAll("[data-library-reader-portal]").forEach((el) => el.remove());
  }

  function mountReaderOverlay() {
    const portal = document.querySelector("[data-library-reader-portal]");
    if (portal) {
      scrubDuplicateReaders(portal);
      return portal;
    }
    const reader = document.querySelector("[data-library-reader]");
    if (!reader) return null;
    removeReaderOverlay();
    reader.setAttribute("data-library-reader-portal", "1");
    document.body.appendChild(reader);
    scrubDuplicateReaders(reader);
    try {
      window.scrollTo(0, 0);
    } catch (e) {
      /* Lesen darf nie blockieren */
    }
    return reader;
  }

  function waitForReaderLayout(stage) {
    return new Promise((resolve) => {
      const measure = () => {
        const stageWidth = Math.max(stage?.clientWidth || 0, stage?.offsetWidth || 0);
        const viewportWidth = Math.max(document.documentElement?.clientWidth || 0, window.innerWidth || 0);
        return Math.max(stageWidth, viewportWidth - 24);
      };
      if (measure() > 40) {
        resolve(measure());
        return;
      }
      let tries = 0;
      const tick = () => {
        const width = measure();
        if (width > 40 || tries >= 20) {
          resolve(Math.max(width, 280));
          return;
        }
        tries += 1;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  function scrollToReaderPage(pageNum, behavior) {
    if (!readerState) return;
    const page = Math.max(1, Math.min(readerState.total || 1, Number(pageNum) || 1));
    if (!readerState.doc) {
      const stage = getReaderStage();
      readerState.page = page;
      if (stage) stage.innerHTML = `<div class="lib-reader-msg">PDF wird geladen…</div>`;
      const input = getReaderRoot()?.querySelector("[data-library-reader-input]");
      if (input) input.value = String(page);
      saveProgress(readerState.pub.id, page, readerState.total || 0);
      return;
    }
    renderReaderPage(page);
  }

  async function renderReaderPage(pageNum) {
    if (!readerState || !readerState.doc) return;
    const stage = getReaderStage();
    if (!stage) return;

    const token = ++readerRenderToken;
    const page = Math.max(1, Math.min(readerState.total || 1, Number(pageNum) || 1));
    readerState.page = page;
    stage.innerHTML = '<div class="lib-reader-msg">Seite wird geladen…</div>';

    try {
      const layoutWidth = await waitForReaderLayout(stage);
      if (token !== readerRenderToken) return;

      const width = Math.max(280, layoutWidth - 12);
      const pdfPage = await readerState.doc.getPage(page);
      if (token !== readerRenderToken) return;

      const baseViewport = pdfPage.getViewport({ scale: 1 });
      const scale = baseViewport.width > 0 ? width / baseViewport.width : 1;
      const viewport = pdfPage.getViewport({ scale: Math.max(scale, 0.1) });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas unavailable");

      const cssWidth = Math.max(1, Math.floor(viewport.width));
      const cssHeight = Math.max(1, Math.floor(viewport.height));
      canvas.width = cssWidth;
      canvas.height = cssHeight;
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      canvas.className = "lib-reader-page-canvas";

      const wrap = document.createElement("div");
      wrap.className = "lib-reader-sheet";
      wrap.dataset.page = String(page);
      wrap.appendChild(canvas);

      await pdfPage.render({
        canvasContext: ctx,
        viewport,
        background: "#ffffff"
      }).promise;
      if (token !== readerRenderToken) return;
      stage.innerHTML = "";
      const stack = document.createElement("div");
      stack.className = "lib-reader-stack lib-reader-stack-single";
      stack.appendChild(wrap);
      stage.appendChild(stack);
      stage.scrollTop = 0;

      const input = getReaderRoot()?.querySelector("[data-library-reader-input]");
      if (input) input.value = String(page);
      saveProgress(readerState.pub.id, page, readerState.total);
    } catch (e) {
      if (token !== readerRenderToken) return;
      stage.innerHTML = `<div class="lib-reader-msg">Seite konnte nicht angezeigt werden. Bitte erneut versuchen oder die PDF herunterladen.</div>`;
    }
  }

  function setupReaderScrollTracking(stack, stage) {
    if (readerPageObserver) readerPageObserver.disconnect();
    readerPageObserver = null;
  }

  async function renderReaderScroll(options) {
    if (!readerState || !readerState.doc) return;
    const startPage = options?.page || readerState.page || 1;
    await renderReaderPage(startPage);
  }

  function bindReaderControls(pub, reader) {
    if (!pub || !reader) return;
    const closeBtn = reader.querySelector("[data-library-reader-close]");
    if (closeBtn) closeBtn.onclick = () => navigateDetail(pub.slug);
    const prevBtn = reader.querySelector("[data-library-reader-prev]");
    if (prevBtn) prevBtn.onclick = () => scrollToReaderPage(readerState.page - 1);
    const nextBtn = reader.querySelector("[data-library-reader-next]");
    if (nextBtn) nextBtn.onclick = () => scrollToReaderPage(readerState.page + 1);
    const input = reader.querySelector("[data-library-reader-input]");
    if (input) {
      input.onchange = (ev) => scrollToReaderPage(Number(ev.target.value) || 1, "auto");
    }
    const downloadBtn = reader.querySelector("[data-library-reader-download]");
    if (downloadBtn) {
      downloadBtn.onclick = async () => {
        try {
          const blob = await fetchPdfBlob(pub);
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${pub.slug || pub.id}.pdf`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 4000);
          trackLibraryEvent("library_download", pub);
          scheduleLibraryStatsRefresh(pub.id);
        } catch (err) {
          alert("Der Download konnte nicht abgeschlossen werden. Bitte versuche es erneut.");
        }
      };
    }
    const shareBtn = reader.querySelector("[data-library-reader-share]");
    if (shareBtn) shareBtn.onclick = () => sharePublication(pub);
  }

  async function initReader(pub) {
    const session = ++readerSessionId;
    const root = mountReaderOverlay() || getReaderRoot();
    const stage = root?.querySelector("[data-library-reader-stage]");
    if (!root || !stage) return;
    scrubDuplicateReaders(root);

    if (readerState?.blobUrl) {
      try {
        URL.revokeObjectURL(readerState.blobUrl);
      } catch (e) {
        /* Lesen darf nie blockieren */
      }
    }

    readerState = {
      pub,
      page: getProgress(pub.id)?.lastPage || 1,
      total: 0,
      doc: null,
      blobUrl: "",
      useOfflineBlob: false
    };

    try {
      const pdfjs = await loadPdfJs();
      if (session !== readerSessionId) return;
      const offline = await getOfflineBlob(pub.id);
      const blob = offline || await fetchPdfBlob(pub);
      if (session !== readerSessionId) return;
      readerState.useOfflineBlob = !!offline;
      readerState.blobUrl = URL.createObjectURL(blob);
      const data = await blob.arrayBuffer();
      if (session !== readerSessionId) return;
      const doc = await pdfjs.getDocument({
        data,
        disableWorker: true,
        isEvalSupported: false,
        useSystemFonts: true
      }).promise;
      if (session !== readerSessionId) return;
      readerState.doc = doc;
      readerState.total = doc.numPages;
      const totalEl = root.querySelector("[data-library-reader-total]");
      if (totalEl) totalEl.textContent = String(readerState.total);
      await renderReaderScroll({ page: readerState.page });
      if (session !== readerSessionId) return;
      trackLibraryEvent("library_read", pub);
    } catch (e) {
      if (session !== readerSessionId) return;
      stage.innerHTML = `<div class="lib-reader-msg">PDF konnte nicht geladen werden. Bitte versuche es erneut oder lade die Datei herunter.</div>`;
    }
  }

  async function initReaderNative(pub) {
    const root = mountReaderOverlay() || getReaderRoot();
    const stage = root?.querySelector("[data-library-reader-stage]");
    if (!root || !stage) return;
    scrubDuplicateReaders(root);
    const lastPage = Math.max(1, Number(getProgress(pub.id)?.lastPage || 1));
    const total = Math.max(0, Number(pub.pageCount || 0));
    readerState = {
      pub,
      page: lastPage,
      total,
      doc: null,
      blobUrl: "",
      useOfflineBlob: false
    };
    const totalEl = root.querySelector("[data-library-reader-total]");
    if (totalEl) totalEl.textContent = String(total || "—");
    const pageInput = root.querySelector("[data-library-reader-input]");
    if (pageInput) pageInput.value = String(lastPage);
    renderReaderNativeFallback(stage, lastPage);
    saveProgress(pub.id, lastPage, total || 0);
    trackLibraryEvent("library_read", pub);
  }

  function findPublication(slug) {
    return (catalog?.publications || []).find((p) => p.slug === slug || p.id === slug);
  }

  function restoreLibraryListUi() {
    if (libraryPreserveScroll) {
      const y = libraryListScrollY;
      requestAnimationFrame(() => {
        if (global.DARScrollManager?.stableScrollTo) {
          global.DARScrollManager.stableScrollTo(y, { force: true });
        } else {
          global.scrollTo({ top: y, behavior: "auto" });
        }
        libraryPreserveScroll = false;
      });
    }
    if (libraryPreserveFocus) {
      const search = document.getElementById("librarySearch");
      if (search) {
        search.focus();
        try {
          const pos = librarySearchSelection;
          search.setSelectionRange(pos, pos);
        } catch (e) {
          /* Sucheingabe darf nie blockieren */
        }
      }
      libraryPreserveFocus = false;
    }
  }

  async function bindLibrary(route) {
    const root = document.querySelector("[data-library-root]");
    if (root) {
      const search = document.getElementById("librarySearch");
      if (search) {
        search.oninput = () => {
          uiState.query = search.value || "";
          markLibraryRenderPreserve(window.scrollY || 0, true, search.selectionStart);
          if (typeof global.render === "function") global.render();
        };
      }
      root.querySelector("[data-library-search-clear]")?.addEventListener("click", () => {
        uiState.query = "";
        markLibraryRenderPreserve(window.scrollY || 0, true, 0);
        if (typeof global.render === "function") global.render();
      });
      root.querySelector("[data-library-filter-clear]")?.addEventListener("click", () => {
        uiState.category = "Alle";
        uiState.catOpen = false;
        markLibraryRenderPreserve(window.scrollY || 0, false, 0);
        if (typeof global.render === "function") global.render();
      });
      root.querySelector("[data-library-reset-filters]")?.addEventListener("click", () => {
        uiState.query = "";
        uiState.category = "Alle";
        uiState.catOpen = false;
        if (typeof global.render === "function") global.render();
      });
      root.querySelectorAll("[data-library-cat]").forEach((btn) => {
        btn.onclick = () => {
          uiState.category = btn.getAttribute("data-library-cat") || "Alle";
          uiState.catOpen = false;
          markLibraryRenderPreserve(window.scrollY || 0, false, 0);
          if (typeof global.render === "function") global.render();
        };
      });
      const catToggle = root.querySelector("[data-library-cat-toggle]");
      const catPanel = root.querySelector(".lib-cat-panel");
      if (catToggle) {
        catToggle.onclick = (ev) => {
          ev.stopPropagation();
          uiState.catOpen = !uiState.catOpen;
          markLibraryRenderPreserve(window.scrollY || 0, false, 0);
          if (typeof global.render === "function") global.render();
        };
      }
      if (catPanel && uiState.catOpen) {
        const closeOnOutside = (ev) => {
          if (!root.contains(ev.target)) {
            uiState.catOpen = false;
            document.removeEventListener("click", closeOnOutside);
            if (typeof global.render === "function") global.render();
          }
        };
        setTimeout(() => document.addEventListener("click", closeOnOutside), 0);
      }
      root.querySelectorAll("[data-library-open]").forEach((btn) => {
        btn.onclick = () => {
          const slug = btn.getAttribute("data-library-open") || "";
          const pub = findPublication(slug);
          if (pub) trackLibraryEvent("library_click", pub);
          navigateDetail(slug);
        };
      });
      restoreLibraryListUi();
    }

    document.querySelectorAll("[data-library-retry]").forEach((btn) => {
      btn.onclick = async () => {
        catalog = null;
        catalogError = "";
        try {
          await ensureCatalog();
        } catch (e) {}
        if (typeof global.render === "function") global.render();
      };
    });

    const detail = document.querySelector("[data-library-detail]");
    if (detail) {
      const slug = detail.getAttribute("data-library-detail");
      const pub = findPublication(slug);
      if (!pub) return;

      detail.querySelectorAll("[data-library-read]").forEach((btn) => {
        btn.onclick = () => {
          if (!canRead(pub)) return;
          navigateReader(pub.slug);
        };
      });

      detail.querySelectorAll("[data-library-download]").forEach((btn) => {
        btn.onclick = async () => {
          if (!canDownload(pub)) return;
          try {
            const blob = await fetchPdfBlob(pub);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${pub.slug || pub.id}.pdf`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 4000);
            trackLibraryEvent("library_download", pub);
            scheduleLibraryStatsRefresh(pub.id);
          } catch (e) {
            alert("Der Download konnte nicht abgeschlossen werden. Bitte versuche es erneut.");
          }
        };
      });

      detail.querySelectorAll("[data-library-offline]").forEach((btn) => {
        btn.onclick = async () => {
          if (!canOffline(pub)) return;
          try {
            const blob = await fetchPdfBlob(pub);
            await putOfflineBlob(pub.id, blob);
            if (typeof global.render === "function") global.render();
          } catch (e) {
            alert("Offline-Speicherung ist derzeit noch nicht verfügbar.");
          }
        };
      });

      detail.querySelectorAll("[data-library-offline-remove]").forEach((btn) => {
        btn.onclick = async () => {
          try {
            await removeOfflineBlob(pub.id);
          } catch (e) {}
          if (typeof global.render === "function") global.render();
        };
      });

      detail.querySelectorAll("[data-library-share]").forEach((btn) => {
        btn.onclick = () => sharePublication(pub);
      });

      detail.querySelectorAll("[data-library-open]").forEach((btn) => {
        btn.onclick = () => {
          const slug = btn.getAttribute("data-library-open") || "";
          const related = findPublication(slug);
          if (related) trackLibraryEvent("library_click", related);
          navigateDetail(slug);
        };
      });

      hydrateLibraryStats(pub.id);
      startLibraryStatsPolling(pub.id);
      trackLibraryDetailView(pub);
    } else {
      stopLibraryStatsPolling();
    }

    if (route && route.view === "bibliothek-reader") {
      document.body.classList.add("is-library-reader-route");
      const pub = findPublication(route.value);
      if (pub && canRead(pub)) {
        if (isReaderActive(pub.slug)) {
          const reader = getReaderRoot();
          scrubDuplicateReaders(reader);
          bindReaderControls(pub, reader);
          const totalEl = reader?.querySelector("[data-library-reader-total]");
          if (totalEl) totalEl.textContent = String(readerState?.total || pub.pageCount || "—");
          const pageInput = reader?.querySelector("[data-library-reader-input]");
          if (pageInput && readerState?.page) pageInput.value = String(readerState.page);
        } else {
          await initReader(pub);
          bindReaderControls(pub, getReaderRoot());
        }
      } else {
        navigateDetail(route?.value || "");
      }
    } else {
      readerSessionId += 1;
      removeReaderOverlay();
      if (readerState?.blobUrl) {
        try {
          URL.revokeObjectURL(readerState.blobUrl);
        } catch (e) {
          /* Lesen darf nie blockieren */
        }
      }
      if (readerPageObserver) {
        readerPageObserver.disconnect();
        readerPageObserver = null;
      }
      readerState = null;
    }

    if (global.DARCanonicalSourceLibrary && typeof global.DARCanonicalSourceLibrary.bindBibliothekAddon === "function") {
      global.DARCanonicalSourceLibrary.bindBibliothekAddon();
    }
  }

  async function enrichWithOffline(renderFn, slug) {
    const offlineIds = await listOfflineIds();
    if (slug) return renderBibliothekDetail(slug, offlineIds);
    return renderBibliothekMain(offlineIds);
  }

  global.DARLibraryApp = {
    CATEGORIES,
    ensureCatalog,
    invalidateCatalog,
    refreshCatalog,
    renderBibliothek: () => renderBibliothek(),
    renderBibliothekDetail: (slug) => renderBibliothekDetailView(slug),
    renderBibliothekReader: (slug) => renderBibliothekReaderView(slug),
    renderBibliothekWithOffline: () => ensureCatalog().then(() => enrichWithOffline()),
    renderBibliothekDetailWithOffline: (slug) => ensureCatalog().then(() => enrichWithOffline(null, slug)),
    bindLibrary,
    isReaderActive,
    getProgress,
    saveProgress,
    listOfflineIds,
    resetUiState: () => {
      uiState = { query: "", category: "Alle", catOpen: false };
    }
  };
})(window);
