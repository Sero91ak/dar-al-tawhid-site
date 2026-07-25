/**
 * DAR AL TAWḤĪD — Bibliothek verwalten (vereinfacht)
 */
(function (global) {
  "use strict";

  const PDFJS_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
  const PDFJS_WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  const STATIC_CATALOG_URL = "/test/data/library-publications.json";
  const LIBRARY_TARGETS = {
    test: {
      catalogPath: "test/data/library-publications.json",
      pdfPrefix: "test/assets/library/pdfs/",
      coverPrefix: "test/assets/library/covers/"
    },
    live: {
      catalogPath: "data/library-publications.json",
      pdfPrefix: "assets/library/pdfs/",
      coverPrefix: "assets/library/covers/"
    }
  };

  const CATEGORIES = [
    "Tawḥīd", "ʿAqīdah", "al-Asmāʾ waṣ-Ṣifāt", "Qurʾān", "Sunnah",
    "Schirk", "Kufr und Ṭāghūt", "Sünden und Reue", "Gebet", "Fiqh",
    "Familie", "Manhaj", "Widerlegungen"
  ];

  let catalog = { version: 1, publications: [] };
  let catalogTest = { version: 1, publications: [] };
  let catalogLive = { version: 1, publications: [] };
  let mergedPublications = [];
  let loaded = false;
  let loading = false;
  let draft = null;
  let pdfFile = null;
  let pdfMeta = null;
  let coverPreviewUrl = "";
  let coverVariants = null;
  let categorySuggestion = null;
  let showCategoryEdit = false;
  let busy = false;
  let publishStep = 0;
  let successSlug = "";
  let successTarget = "test";
  let successPublicationId = "";
  let successPdfUrl = "";
  let lastLivePush = null;
  let editingPublicationId = "";
  let dragActive = false;
  let processingPdf = false;
  let manageSearch = "";
  let manageFilter = "all";
  let manageSelectedId = "";
  let manageExpandedIds = new Set();
  let manageSectionOpen = true;
  let editSourceTarget = "test";
  let adminLibraryStatsMap = {};
  let adminLibraryStatsLoading = false;
  let adminLibraryStatsPollTimer = null;
  let pdfFileKey = "";
  let pdfReplaceVersion = "";

  function safeRender(options) {
    if (processingPdf && !options?.force) return;
    if (typeof global.renderLibraryAdminPartial === "function" && global.getAdminCurrentTab?.() === "bibliothek") {
      try {
        if (global.renderLibraryAdminPartial()) return;
      } catch (e) {
        console.warn("[Bibliothek Admin] Partial render:", e);
      }
    }
    if (typeof global.renderShell === "function") {
      try {
        global.renderShell();
      } catch (e) {
        console.error("[Bibliothek Admin] renderShell:", e);
      }
    }
  }

  function isAppleTouchDevice() {
    if (typeof navigator === "undefined") return false;
    const ua = String(navigator.userAgent || "");
    const ipad = /iPad/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    return ipad || /iPhone|iPod/.test(ua);
  }

  function pdfSelectionKey(file) {
    if (!file) return "";
    return `${file.name}|${file.size}|${file.lastModified}`;
  }

  function isAcceptablePdfFile(file) {
    if (!file || !file.size) return false;
    if (file.size > 80 * 1024 * 1024) return false;
    const type = String(file.type || "").toLowerCase();
    const name = String(file.name || "").toLowerCase();
    if (type === "application/pdf" || type === "application/x-pdf") return true;
    if (name.endsWith(".pdf")) return true;
    if (!type || type === "application/octet-stream") return true;
    return false;
  }

  function setProcessingStatus(message) {
    const mount = document.getElementById("libAdminMount");
    if (!mount) return;
    let el = document.getElementById("libAdminProcessing");
    if (!el) {
      el = document.createElement("div");
      el.id = "libAdminProcessing";
      el.className = "lib-admin-progress";
      el.setAttribute("role", "status");
      mount.prepend(el);
    }
    el.innerHTML = message ? `<b>${esc(message)}</b>` : "";
    el.style.display = message ? "" : "none";
  }

  function parsePdfPageCount(data) {
    try {
      const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
      const scanLen = Math.min(bytes.length, 512 * 1024);
      const start = Math.max(0, bytes.length - scanLen);
      const text = new TextDecoder("latin1").decode(bytes.slice(start));
      const pagesBlock = text.match(/\/Type\s*\/Pages[\s\S]{0,1200}?\/Count\s+(\d+)/);
      if (pagesBlock) return Number(pagesBlock[1]) || 0;
      const counts = [...text.matchAll(/\/Count\s+(\d+)/g)].map((m) => Number(m[1])).filter((n) => n > 0 && n < 5000);
      if (counts.length) return Math.max(...counts);
      const full = new TextDecoder("latin1").decode(bytes.slice(0, Math.min(bytes.length, 2 * 1024 * 1024)));
      return (full.match(/\/Type\s*\/Page[^s]/g) || []).length;
    } catch (e) {
      return 0;
    }
  }

  function syncVersionField() {
    const verEl = document.getElementById("libAdminVersion");
    if (verEl && draft?.version) verEl.value = draft.version;
  }

  function isLibraryBusy() {
    return !!(busy || processingPdf);
  }

  function hasLibraryWork() {
    return !!(busy || processingPdf || pdfFile || pdfMeta || successSlug || editingPublicationId || (draft && (draft.title || draft.pdfUrl)));
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || "");
        const comma = result.indexOf(",");
        if (comma < 0) {
          reject(new Error("PDF konnte nicht kodiert werden"));
          return;
        }
        resolve(result.slice(comma + 1));
      };
      reader.onerror = () => reject(reader.error || new Error("PDF konnte nicht gelesen werden"));
      reader.readAsDataURL(file);
    });
  }

  function esc(s) {
    return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function slugify(value) {
    return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  }

  function cleanTitle(value) {
    return String(value || "").replace(/\.pdf$/i, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  }

  function defaultDraft() {
    const today = new Date().toISOString().slice(0, 10);
    return {
      id: "",
      slug: "",
      title: "",
      transliteratedTitle: "",
      subtitle: "",
      description: "",
      category: "",
      topic: "",
      series: "",
      tags: [],
      editor: "Serhat Abu Malik",
      publisher: "DAR AL TAWḤĪD",
      credit: "Zusammengestellt, strukturiert und herausgegeben von Serhat Abu Malik für DAR AL TAWḤĪD",
      language: "Deutsch",
      version: "1.0",
      publishedAt: today,
      updatedAt: today,
      pageCount: 0,
      fileSize: "",
      fileHash: "",
      isNew: true,
      isRecommended: false,
      downloadEnabled: true,
      offlineEnabled: true,
      status: "draft"
    };
  }

  function workerPost(path, body) {
    return workerPostRequest(path, body);
  }

  function workerGet(path, query) {
    const qs = query ? `?${new URLSearchParams(query).toString()}` : "";
    return workerGetRequest(`${path}${qs}`, { admin: true });
  }

  function libraryPathsFor(target) {
    return LIBRARY_TARGETS[target === "live" ? "live" : "test"];
  }

  async function loadStaticCatalog() {
    const res = await fetch(STATIC_CATALOG_URL, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  }

  function isOnlineStatus(status) {
    const s = String(status || "").trim();
    return s === "published" || s === "updated" || s === "preparing";
  }

  function pickDisplayPublication(entry) {
    const live = entry.live;
    const test = entry.test;
    if (live && isOnlineStatus(live.status)) return { ...live, _primaryTarget: "live" };
    if (test && isOnlineStatus(test.status)) return { ...test, _primaryTarget: "test" };
    if (live) return { ...live, _primaryTarget: "live" };
    if (test) return { ...test, _primaryTarget: "test" };
    return test || live;
  }

  function mergeCatalogs(testCat, liveCat) {
    const byId = new Map();
    (testCat?.publications || []).forEach((p) => {
      if (!p?.id) return;
      byId.set(p.id, { id: p.id, test: p, live: null });
    });
    (liveCat?.publications || []).forEach((p) => {
      if (!p?.id) return;
      const existing = byId.get(p.id);
      if (existing) existing.live = p;
      else byId.set(p.id, { id: p.id, test: null, live: p });
    });
    return [...byId.values()].map((entry) => {
      const display = pickDisplayPublication(entry);
      return {
        ...entry,
        inTest: !!entry.test,
        inLive: !!entry.live,
        testStatus: String(entry.test?.status || ""),
        liveStatus: String(entry.live?.status || ""),
        display
      };
    });
  }

  function allCatalogPublications() {
    const byId = new Map();
    (catalogTest.publications || []).forEach((p) => byId.set(p.id, p));
    (catalogLive.publications || []).forEach((p) => {
      if (!byId.has(p.id)) byId.set(p.id, p);
    });
    return [...byId.values()];
  }

  function getMergedEntry(id) {
    return mergedPublications.find((m) => m.id === id) || null;
  }

  function syncMergedCatalogView() {
    mergedPublications = mergeCatalogs(catalogTest, catalogLive);
    catalog = {
      version: 1,
      updatedAt: catalogLive?.updatedAt || catalogTest?.updatedAt || new Date().toISOString(),
      publications: mergedPublications.map((m) => m.display).filter(Boolean)
    };
  }

  function formatAdminStatCount(value) {
    const n = Number(value) || 0;
    try {
      return new Intl.NumberFormat("de-DE").format(n);
    } catch (e) {
      return String(n);
    }
  }

  async function fetchAdminLibraryStatsMap(force) {
    if (!force && Object.keys(adminLibraryStatsMap).length) return adminLibraryStatsMap;
    if (adminLibraryStatsLoading) return adminLibraryStatsMap;
    const cfg = global.DAR_ANALYTICS_CONFIG || {};
    const baseUrl = String(cfg.supabaseUrl || "").replace(/\/$/, "");
    const key = String(cfg.supabaseKey || "");
    if (!baseUrl || !key) return adminLibraryStatsMap;
    adminLibraryStatsLoading = true;
    try {
      const res = await fetch(
        `${baseUrl}/rest/v1/stats_totals?content_type=eq.library&select=content_id,content_title,views,shares,saves&order=views.desc&limit=500&_ts=${Date.now()}`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" }
      );
      if (!res.ok) throw new Error("stats " + res.status);
      const rows = await res.json();
      const map = {};
      (Array.isArray(rows) ? rows : []).forEach((row) => {
        const id = String(row?.content_id || "").trim();
        if (!id) return;
        map[id] = {
          clicks: Number(row.views) || 0,
          reads: Number(row.shares) || 0,
          downloads: Number(row.saves) || 0,
          title: String(row.content_title || "")
        };
      });
      adminLibraryStatsMap = map;
      return map;
    } catch (e) {
      console.warn("[Bibliothek Admin] Live-Statistik nicht verfügbar:", e);
      return adminLibraryStatsMap;
    } finally {
      adminLibraryStatsLoading = false;
    }
  }

  function renderAdminStatsLine(publicationId) {
    const stats = adminLibraryStatsMap[String(publicationId || "")] || { clicks: 0, reads: 0, downloads: 0 };
    return `<div class="lib-admin-live-stats lib-admin-live-stats--compact" data-lib-admin-stats="${esc(publicationId)}">
      <span class="lib-admin-live-stats-label">Live</span>
      <span class="lib-admin-live-stat"><b>Klicks</b>${formatAdminStatCount(stats.clicks)}</span>
      <span class="lib-admin-live-stat"><b>Gelesen</b>${formatAdminStatCount(stats.reads)}</span>
      <span class="lib-admin-live-stat"><b>DL</b>${formatAdminStatCount(stats.downloads)}</span>
    </div>`;
  }

  function startAdminLibraryStatsPolling() {
    if (adminLibraryStatsPollTimer) return;
    adminLibraryStatsPollTimer = setInterval(() => {
      fetchAdminLibraryStatsMap(true).then(() => safeRender({ force: true })).catch(() => {});
    }, 15000);
  }

  function stopAdminLibraryStatsPolling() {
    if (adminLibraryStatsPollTimer) {
      clearInterval(adminLibraryStatsPollTimer);
      adminLibraryStatsPollTimer = null;
    }
  }

  async function ensureLibraryLoaded(force) {
    if (loaded && !force) return catalog;
    if (loading) return catalog;
    loading = true;
    try {
      const [testRes, liveRes] = await Promise.all([
        workerGet("api/admin/library", { target: "test" }).catch(() => null),
        workerGet("api/admin/library", { target: "live" }).catch(() => null)
      ]);
      if (testRes?.catalog) catalogTest = testRes.catalog;
      else if (!loaded || force) {
        const staticCatalog = await loadStaticCatalog().catch(() => null);
        catalogTest = staticCatalog || { version: 1, publications: [] };
      }
      if (liveRes?.catalog) catalogLive = liveRes.catalog;
      else if (!catalogLive.publications?.length) {
        try {
          const liveStatic = await fetch("/data/library-publications.json", { cache: "no-store" });
          if (liveStatic.ok) catalogLive = await liveStatic.json();
        } catch (e) {
          catalogLive = catalogLive || { version: 1, publications: [] };
        }
      }
      syncMergedCatalogView();
      loaded = true;
      fetchAdminLibraryStatsMap(force).catch(() => {});
      startAdminLibraryStatsPolling();
      return catalog;
    } catch (e) {
      console.warn("[Bibliothek Admin] Worker-Laden fehlgeschlagen:", e);
      if (String(e.message || "").includes("Secret")) throw e;
      try {
        const staticCatalog = await loadStaticCatalog();
        if (staticCatalog) {
          catalogTest = staticCatalog;
          catalogLive = catalogLive?.publications?.length ? catalogLive : { version: 1, publications: [] };
          syncMergedCatalogView();
          loaded = true;
          fetchAdminLibraryStatsMap(force).catch(() => {});
          startAdminLibraryStatsPolling();
          return catalog;
        }
      } catch (err) {
        console.warn("[Bibliothek Admin] Statischer Katalog nicht verfügbar:", err);
      }
      catalogTest = { version: 1, publications: [] };
      catalogLive = { version: 1, publications: [] };
      syncMergedCatalogView();
      loaded = true;
      fetchAdminLibraryStatsMap(force).catch(() => {});
      startAdminLibraryStatsPolling();
      return catalog;
    } finally {
      loading = false;
    }
  }

  function nextPublicationId() {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const prefix = `pub-${today}-`;
    let max = 0;
    allCatalogPublications().forEach((p) => {
      if (!String(p.id || "").startsWith(prefix)) return;
      const n = parseInt(String(p.id).slice(prefix.length), 10);
      if (n > max) max = n;
    });
    return `${prefix}${String(max + 1).padStart(3, "0")}`;
  }

  function nextUniqueSlug(title, excludeId) {
    let base = slugify(title) || "publikation";
    let slug = base;
    let n = 2;
    const taken = new Set(allCatalogPublications().filter((p) => p.id !== excludeId).map((p) => p.slug));
    while (taken.has(slug)) {
      slug = `${base}-${n}`;
      n += 1;
    }
    return slug;
  }

  async function ensurePdfJs() {
    if (global.pdfjsLib) return global.pdfjsLib;
    if (global.__libAdminPdfLoading) return global.__libAdminPdfLoading;
    global.__libAdminPdfLoading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = PDFJS_URL;
      s.onload = () => {
        global.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
        resolve(global.pdfjsLib);
      };
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return global.__libAdminPdfLoading;
  }

  async function hashBuffer(buf) {
    const digest = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function formatBytes(n) {
    const num = Number(n) || 0;
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1).replace(".", ",")} KB`;
    return `${(num / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
  }

  async function analyzePdfFile(file, options) {
    const opts = options || {};
    if (!file) throw new Error("Keine Datei ausgewählt");
    if (!isAcceptablePdfFile(file)) throw new Error("Nur PDF-Dateien sind erlaubt");
    const data = await file.arrayBuffer();
    if (!data.byteLength) throw new Error("PDF ist leer");
    const head = new Uint8Array(data.slice(0, 5));
    if (String.fromCharCode(...head) !== "%PDF-") throw new Error("Datei ist keine gültige PDF");
    const lite = opts.lite === true || isAppleTouchDevice();
    if (lite) {
      return {
        fileName: file.name,
        pageCount: parsePdfPageCount(data) || 0,
        title: cleanTitle(file.name),
        author: "",
        fileSize: formatBytes(file.size),
        fileHash: opts.withHash ? await hashBuffer(data) : ""
      };
    }
    await ensurePdfJs();
    const doc = await global.pdfjsLib.getDocument({ data }).promise;
    if (!doc.numPages) throw new Error("PDF enthält keine Seiten");
    const meta = await doc.getMetadata().catch(() => ({}));
    const info = meta?.info || {};
    return {
      fileName: file.name,
      pageCount: doc.numPages,
      title: cleanTitle(info.Title || file.name),
      author: String(info.Author || "").trim(),
      fileSize: formatBytes(file.size),
      fileHash: await hashBuffer(data)
    };
  }

  async function ensurePdfMetaForPublish() {
    if (!pdfFile) return;
    if (pdfMeta && pdfFileKey === pdfSelectionKey(pdfFile) && pdfMeta.fileHash) return;
    pdfMeta = await analyzePdfFile(pdfFile, { lite: isAppleTouchDevice(), withHash: true });
    pdfFileKey = pdfSelectionKey(pdfFile);
    draft.pageCount = pdfMeta.pageCount || draft.pageCount || 0;
    draft.fileSize = pdfMeta.fileSize;
    draft.fileHash = pdfMeta.fileHash;
  }

  function localSuggestCategory(text) {
    const blob = String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[ʾʿḥṣḍṭẓġāīū]/g, (ch) => {
        const map = { ʾ: "", ʿ: "", ḥ: "h", ṣ: "s", ḍ: "d", ṭ: "t", ẓ: "z", ġ: "g", ā: "a", ī: "i", ū: "u" };
        return map[ch] || ch;
      });
    if (/asma|sifat|eigenschaft|uluw|nuzul|istiw|husna/i.test(blob)) {
      return { category: "ʿAqīdah", topic: "al-Asmāʾ waṣ-Ṣifāt", confidence: "medium" };
    }
    if (/tawhid|tauhid/i.test(blob)) return { category: "Tawḥīd", topic: "Tawḥīd", confidence: "medium" };
    if (/schirk|shirk/i.test(blob)) return { category: "Schirk", topic: "Schirk", confidence: "medium" };
    if (/kufr|taghut|tawagut/i.test(blob)) return { category: "Kufr und Ṭāghūt", topic: "Kufr und Ṭāghūt", confidence: "low" };
    if (/sunnah|hadith|ahadith/i.test(blob)) return { category: "Sunnah", topic: "Sunnah", confidence: "low" };
    if (/quran|tafsir/i.test(blob)) return { category: "Qurʾān", topic: "Qurʾān", confidence: "low" };
    if (/gebet|salah|salat/i.test(blob)) return { category: "Gebet", topic: "Gebet", confidence: "low" };
    if (/fiqh|zakat|zakāt|hukm|hokm|ahkam|ahkaam|majhul|majhool|fatwa/i.test(blob)) {
      return { category: "Fiqh", topic: "Fiqh", confidence: "medium" };
    }
    if (/familie|ehe|kinder/i.test(blob)) return { category: "Familie", topic: "Familie", confidence: "low" };
    if (/manhaj|methodology/i.test(blob)) return { category: "Manhaj", topic: "Manhaj", confidence: "low" };
    if (/widerleg|radd|refutation/i.test(blob)) return { category: "Widerlegungen", topic: "Widerlegungen", confidence: "low" };
    return { category: "", topic: "", confidence: "none" };
  }

  async function suggestCategory(text) {
    let remote = null;
    try {
      const res = await workerPost("api/admin/library/suggest", { text });
      remote = res.suggestion || null;
    } catch (e) {
      remote = null;
    }
    const local = localSuggestCategory(text);
    if (remote?.category && remote.confidence !== "none") {
      categorySuggestion = remote;
    } else if (local?.category) {
      categorySuggestion = local;
    } else {
      categorySuggestion = remote || local;
    }
    return categorySuggestion;
  }

  function applyCategorySuggestion() {
    if (!draft) return;
    if (categorySuggestion?.category && categorySuggestion.confidence !== "none") {
      draft.category = categorySuggestion.category;
      draft.topic = categorySuggestion.topic || categorySuggestion.category;
      draft.series = draft.topic;
    }
  }

  function syncAutoFields() {
    if (!draft) draft = defaultDraft();
    if (!draft.id) draft.id = nextPublicationId();
    if (draft.title) draft.slug = nextUniqueSlug(draft.title, draft.id);
    draft.updatedAt = new Date().toISOString().slice(0, 10);
    if (!draft.publishedAt) draft.publishedAt = draft.updatedAt;
    if (!draft.version) draft.version = "1.0";
  }

  function bumpVersion(version) {
    const parts = String(version || "1.0").trim().split(".");
    const major = Number(parts[0]) || 1;
    const minor = (Number(parts[1]) || 0) + 1;
    return `${major}.${minor}`;
  }

  async function loadPublicationForEdit(id, preferredTarget) {
    await ensureLibraryLoaded(true);
    const merged = getMergedEntry(id);
    if (!merged) throw new Error("Veröffentlichung nicht gefunden");
    const pub = preferredTarget === "live" && merged.live
      ? merged.live
      : preferredTarget === "test" && merged.test
        ? merged.test
        : merged.display;
    if (!pub) throw new Error("Veröffentlichung nicht gefunden");
    editSourceTarget = merged.live && (!merged.test || preferredTarget === "live") ? "live" : "test";
    manageSelectedId = id;
    editingPublicationId = pub.id;
    draft = {
      ...pub,
      tags: Array.isArray(pub.tags) ? [...pub.tags] : [],
      searchAliases: Array.isArray(pub.searchAliases) ? [...pub.searchAliases] : [],
      coverUrls: pub.coverUrls ? { ...pub.coverUrls } : {}
    };
    pdfFile = null;
    pdfFileKey = "";
    pdfReplaceVersion = "";
    pdfMeta = {
      fileName: String(pub.pdfUrl || "").split("/").pop() || "bestehende-datei.pdf",
      pageCount: Number(pub.pageCount) || 0,
      fileSize: pub.fileSize || "",
      title: pub.title
    };
    coverVariants = null;
    const coverSrc = pub.coverUrls?.medium || pub.coverUrl || "";
    if (coverPreviewUrl && coverPreviewUrl.startsWith("blob:")) URL.revokeObjectURL(coverPreviewUrl);
    coverPreviewUrl = coverSrc || "";
    categorySuggestion = pub.category ? { category: pub.category, topic: pub.topic || pub.category, confidence: "high" } : null;
    showCategoryEdit = true;
    successSlug = "";
    publishStep = 0;
  }

  async function onPdfSelected(file, options) {
    processingPdf = true;
    setProcessingStatus("PDF wird gelesen …");
    try {
      const replaceMode = options?.replace === true || !!editingPublicationId;
      pdfFile = file;
      coverVariants = null;
      if (coverPreviewUrl && coverPreviewUrl.startsWith("blob:")) URL.revokeObjectURL(coverPreviewUrl);
      coverPreviewUrl = "";
      pdfMeta = await analyzePdfFile(file, { lite: true });
      pdfFileKey = pdfSelectionKey(file);
      if (!replaceMode) {
        draft = defaultDraft();
        draft.id = nextPublicationId();
        draft.title = pdfMeta.title;
        draft.slug = nextUniqueSlug(draft.title, draft.id);
        editingPublicationId = "";
        pdfReplaceVersion = "";
      } else if (draft) {
        draft.version = bumpVersion(draft.version);
        pdfReplaceVersion = draft.version;
        if (!draft.title) draft.title = pdfMeta.title;
      } else {
        draft = defaultDraft();
        draft.title = pdfMeta.title;
        pdfReplaceVersion = "";
      }
      draft.pageCount = pdfMeta.pageCount;
      draft.fileSize = pdfMeta.fileSize;
      draft.fileHash = pdfMeta.fileHash;
      syncVersionField();
      if (!replaceMode) {
        await suggestCategory([draft.title, pdfMeta.author, pdfMeta.fileName].join(" "));
        applyCategorySuggestion();
        if (!draft.category) showCategoryEdit = true;
      }
      successSlug = "";
      successTarget = "test";
      publishStep = 0;
    } finally {
      processingPdf = false;
      setProcessingStatus("");
    }
    if (pdfFile) {
      generateCoverFromPdf()
        .then(() => safeRender({ force: true }))
        .catch(() => {});
    }
  }

  async function generateCoverFromPdf() {
    if (!pdfFile) {
      if (draft?.coverUrl) return;
      throw new Error("PDF fehlt für Cover-Erstellung");
    }
    if (!global.DARLibraryCoverGen) throw new Error("Cover-Modul nicht geladen");
    await ensurePdfJs();
    coverVariants = await global.DARLibraryCoverGen.renderPdfFirstPageCover(pdfFile, { lowMemory: isAppleTouchDevice() });
    const previewBase64 = coverVariants.medium || coverVariants.master;
    if (previewBase64) {
      const blob = await (await fetch(`data:image/webp;base64,${previewBase64}`)).blob();
      if (coverPreviewUrl && coverPreviewUrl.startsWith("blob:")) URL.revokeObjectURL(coverPreviewUrl);
      coverPreviewUrl = URL.createObjectURL(blob);
    }
  }

  async function buildLibraryFiles(id, target) {
    const paths = libraryPathsFor(target);
    if (!pdfFile) return [];
    const contentBase64 = await fileToBase64(pdfFile);
    const files = [{
      path: `${paths.pdfPrefix}${id}-v${String(draft.version || "1.0").replace(/\./g, "-")}.pdf`,
      contentBase64
    }];
    if (coverVariants) {
      files.push({ path: `${paths.coverPrefix}${id}/cover-small.webp`, contentBase64: coverVariants.small });
      files.push({ path: `${paths.coverPrefix}${id}/cover-medium.webp`, contentBase64: coverVariants.medium });
      files.push({ path: `${paths.coverPrefix}${id}/cover-master.webp`, contentBase64: coverVariants.master });
    }
    return files;
  }

  function canPublish() {
    const hasPdf = !!(pdfFile || draft?.pdfUrl);
    const pickedCategory = document.getElementById("libAdminCategory")?.value || "";
    const category = draft?.category || pickedCategory || categorySuggestion?.category;
    return !!(hasPdf && draft?.title?.trim() && category);
  }

  function readMainForm() {
    if (!draft) draft = defaultDraft();
    draft.title = document.getElementById("libAdminTitle")?.value?.trim() || "";
    draft.slug = nextUniqueSlug(draft.title, draft.id);
    if (showCategoryEdit) {
      draft.category = document.getElementById("libAdminCategory")?.value || draft.category;
      draft.topic = document.getElementById("libAdminTopic")?.value || draft.topic;
    }
    draft.subtitle = document.getElementById("libAdminSubtitle")?.value || "";
    draft.description = document.getElementById("libAdminDescription")?.value || "";
    draft.tags = String(document.getElementById("libAdminTags")?.value || "").split(",").map((t) => t.trim()).filter(Boolean);
    const formVersion = String(document.getElementById("libAdminVersion")?.value || "").trim();
    if (pdfReplaceVersion && pdfFile) {
      draft.version = formVersion && formVersion !== pdfReplaceVersion ? formVersion : pdfReplaceVersion;
    } else {
      draft.version = formVersion || draft.version || "1.0";
    }
    draft.isNew = !!document.getElementById("libAdminIsNew")?.checked;
    draft.isRecommended = !!document.getElementById("libAdminIsRecommended")?.checked;
    draft.downloadEnabled = document.getElementById("libAdminDownload") ? !!document.getElementById("libAdminDownload").checked : true;
    draft.offlineEnabled = document.getElementById("libAdminOffline") ? !!document.getElementById("libAdminOffline").checked : true;
    syncAutoFields();
  }

  async function saveDraft() {
    readMainForm();
    if (!draft.title) throw new Error("Titel fehlt");
    if (!pdfFile && !draft.pdfUrl) throw new Error("PDF fehlt");
    busy = true;
    publishStep = 3;
    safeRender();
    try {
      if (pdfFile) {
        await ensurePdfMetaForPublish();
        if (!coverVariants) await generateCoverFromPdf();
      }
      const libraryFiles = await buildLibraryFiles(draft.id);
      return await workerPost("api/admin/library/save", {
        publication: { ...draft, status: "draft" },
        libraryFiles,
        publish: false
      });
    } finally {
      busy = false;
      publishStep = 0;
    }
  }

  async function publishDraft(target) {
    const publishTarget = target === "live" ? "live" : "test";
    readMainForm();
    if (!draft.category) {
      if (categorySuggestion?.category && categorySuggestion.confidence !== "none") {
        applyCategorySuggestion();
      } else {
        showCategoryEdit = true;
        throw new Error("Bitte wähle eine Kategorie aus");
      }
    }
    if (!pdfFile && !draft.pdfUrl) throw new Error("PDF fehlt");
    if (publishTarget === "live") {
      const ok = confirm("Diese Veröffentlichung in der Besucher-App (Live) veröffentlichen?\n\nDie Dateien werden in den Live-Bibliotheks-Pfad geschrieben.");
      if (!ok) throw new Error("Live-Veröffentlichung abgebrochen");
    }
    busy = true;
    publishStep = 1;
    safeRender();
    try {
      if (pdfFile) await ensurePdfMetaForPublish();
      publishStep = 2;
      safeRender();
      if (pdfFile) {
        await generateCoverFromPdf();
      } else if (!coverVariants && draft?.coverUrl) {
        /* bestehendes Cover bleibt */
      } else if (!coverVariants) {
        throw new Error("Cover konnte nicht aus der ersten PDF-Seite erstellt werden");
      }
      publishStep = 3;
      safeRender();
      const libraryFiles = await buildLibraryFiles(draft.id, publishTarget);
      const wasPublished = draft.status === "published" || draft.status === "updated";
      const nextStatus = editingPublicationId && wasPublished ? "updated" : "published";
      const res = await workerPost("api/admin/library/save", {
        publication: { ...draft, status: nextStatus, isNew: !!draft.isNew },
        libraryFiles,
        publish: true,
        target: publishTarget
      });
      publishStep = 4;
      successSlug = draft.slug;
      successTarget = publishTarget;
      successPublicationId = draft.id || "";
      successPdfUrl = draft.pdfUrl || "";
      lastLivePush = publishTarget === "live" ? (res?.push || null) : null;
      editingPublicationId = "";
      pdfReplaceVersion = "";
      await ensureLibraryLoaded(true);
      return res;
    } finally {
      busy = false;
      publishStep = 0;
    }
  }

  function resetUploadForm() {
    editingPublicationId = "";
    manageSelectedId = "";
    editSourceTarget = "test";
    draft = defaultDraft();
    pdfFile = null;
    pdfFileKey = "";
    pdfReplaceVersion = "";
    pdfMeta = null;
    coverVariants = null;
    if (coverPreviewUrl && coverPreviewUrl.startsWith("blob:")) URL.revokeObjectURL(coverPreviewUrl);
    coverPreviewUrl = "";
    categorySuggestion = null;
    showCategoryEdit = false;
    successSlug = "";
    successTarget = "test";
    successPublicationId = "";
    successPdfUrl = "";
    lastLivePush = null;
    publishStep = 0;
  }

  function renderCategoryLine() {
    if (!draft?.category && (!categorySuggestion || categorySuggestion.confidence === "none")) {
      return `<p class="lib-admin-category">Kategorie konnte nicht sicher erkannt werden. <a href="#" id="libAdminChangeCategory">Kategorie auswählen</a></p>`;
    }
    const cat = draft.category || categorySuggestion?.category || "";
    const topic = draft.topic || categorySuggestion?.topic || "";
    if (!cat) return "";
    return `<p class="lib-admin-category">Erkannt: ${esc(cat)}${topic && topic !== cat ? ` · ${esc(topic)}` : ""} <a href="#" id="libAdminChangeCategory">Ändern</a></p>`;
  }

  function renderCategoryEdit() {
    return `<div class="lib-admin-category-edit ${showCategoryEdit ? "is-open" : ""}" id="libAdminCategoryEdit">
      <label class="lib-admin-field">Kategorie<select id="libAdminCategory">${CATEGORIES.map((c) => `<option value="${esc(c)}" ${draft?.category === c ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></label>
      <label class="lib-admin-field">Themenbereich<input id="libAdminTopic" value="${esc(draft?.topic || "")}"></label>
    </div>`;
  }

  function renderProgress() {
    if (!busy && !publishStep) return "";
    const steps = ["PDF wird geprüft", "Cover aus Seite 1", "Daten werden gespeichert", "Veröffentlichung abgeschlossen"];
    return `<div class="lib-admin-progress" role="status">
      <b>${publishStep >= 4 ? "Veröffentlichung abgeschlossen" : "Veröffentlichung wird vorbereitet …"}</b>
      <ol>${steps.map((label, i) => `<li class="${publishStep > i + 1 ? "is-done" : publishStep === i + 1 ? "is-active" : ""}">${esc(label)}</li>`).join("")}</ol>
    </div>`;
  }

  function renderCoverTile(label) {
    const cover = coverPreviewUrl
      ? `<img src="${esc(coverPreviewUrl)}" alt="${esc(label || "Cover-Vorschau")}">`
      : `<span class="lib-admin-cover-tile-ph" aria-hidden="true">📄</span>`;
    return `<div class="lib-admin-cover-tile" aria-label="Cover aus PDF-Seite 1">${cover}</div>`;
  }

  function renderPreviewPanel() {
    return `<aside class="lib-admin-preview" aria-label="Live-Vorschau">
      <h3>Vorschau</h3>
      ${renderCoverTile("Cover-Vorschau")}
      <div class="lib-admin-card-preview">
        <h4>${esc(draft?.title || "Titel der Veröffentlichung")}</h4>
        <span>${esc(draft?.category || categorySuggestion?.category || "Kategorie")}</span>
      </div>
    </aside>`;
  }

  function renderCompactUploadCard(isEditing) {
    const metaLine = `${pdfMeta?.pageCount ? `${esc(String(pdfMeta.pageCount))} Seiten · ` : ""}${esc(pdfMeta?.fileSize || draft.fileSize || "PDF bereit")}${pdfFile ? " · geprüft" : ""}`;
    return `<div class="lib-admin-compact-card">
      ${renderCoverTile(draft?.title || pdfMeta?.fileName || "PDF")}
      <div class="lib-admin-compact-body">
        <p class="lib-admin-pdf-meta"><b>${esc(pdfMeta?.fileName || "Bestehende PDF")}</b><br>${metaLine}</p>
        <label class="lib-admin-field" id="libAdminTitleWrap">
          <span>Titel</span>
          <input id="libAdminTitle" type="text" value="${esc(draft.title)}" placeholder="Titel der Veröffentlichung">
        </label>
        <p class="lib-admin-cover-note">Cover automatisch aus <b>Seite 1</b> — keine separate Datei nötig.</p>
        ${renderCategoryLine()}
        ${renderCategoryEdit()}
      </div>
    </div>`;
  }

  function renderEditBanner() {
    if (!editingPublicationId || !draft) return "";
    const merged = getMergedEntry(editingPublicationId);
    const envNote = merged?.inTest && merged?.inLive
      ? "In Test und Live vorhanden"
      : merged?.inLive
        ? "Nur in Besucher-App (Live)"
        : "In Test-Bibliothek";
    return `<div class="lib-admin-edit-banner" id="libAdminEditPanel">
      <div>
        <b>Bearbeitung: ${esc(draft.title || "Veröffentlichung")}</b>
        <p>${esc(envNote)} — Metadaten ändern oder neues PDF wählen, dann erneut veröffentlichen.</p>
      </div>
      <button class="lib-admin-btn" type="button" id="libAdminCancelEdit">Abbrechen</button>
    </div>`;
  }

  function renderUploadForm() {
    if (!draft) draft = defaultDraft();
    const isEditing = !!editingPublicationId;
    const pdfReady = !!pdfMeta || (isEditing && !!draft.pdfUrl);
    return `<div class="lib-admin-layout" id="libAdminUploadSection">
      <div class="lib-admin-main">
        <header class="lib-admin-head">
          <h2>${isEditing ? "Veröffentlichung bearbeiten" : "Neue Veröffentlichung"}</h2>
          <p>PDF hochladen — Test-Bibliothek oder Besucher-App (Live) veröffentlichen</p>
        </header>
        ${renderEditBanner()}

        <label class="lib-admin-drop ${dragActive ? "is-dragover" : ""}" id="libAdminDropZone">
          <input id="libAdminPdfInput" type="file" accept="application/pdf,.pdf,application/octet-stream">
          <b>${isEditing ? "Neues PDF wählen (optional)" : "PDF hier hineinziehen"}</b>
          <span>oder Datei auswählen</span>
        </label>

        ${pdfReady ? renderCompactUploadCard(isEditing) : ""}

        <details class="lib-admin-details" id="libAdminMoreSettings" style="${pdfReady ? "" : "display:none"}">
          <summary>Weitere Einstellungen</summary>
          <div class="lib-admin-details-body">
            <label class="lib-admin-field">Untertitel<input id="libAdminSubtitle" value="${esc(draft.subtitle)}"></label>
            <label class="lib-admin-field">Beschreibung<textarea id="libAdminDescription" rows="3">${esc(draft.description)}</textarea></label>
            <label class="lib-admin-field">Schlagwörter<input id="libAdminTags" value="${esc((draft.tags || []).join(", "))}" placeholder="kommagetrennt"></label>
            <label class="lib-admin-field">Version<input id="libAdminVersion" value="${esc(draft.version || "1.0")}"></label>
            <div class="lib-admin-checks">
              <label><input id="libAdminIsNew" type="checkbox" ${draft.isNew ? "checked" : ""}> Neu</label>
              <label><input id="libAdminIsRecommended" type="checkbox" ${draft.isRecommended ? "checked" : ""}> Empfohlen</label>
              <label><input id="libAdminDownload" type="checkbox" ${draft.downloadEnabled ? "checked" : ""}> Download erlauben</label>
              <label><input id="libAdminOffline" type="checkbox" ${draft.offlineEnabled ? "checked" : ""}> Offline erlauben</label>
            </div>
          </div>
        </details>

        ${processingPdf ? `<div class="lib-admin-progress" role="status"><b>PDF wird verarbeitet …</b><p class="lib-admin-category">Bitte kurz warten — besonders bei großen Dateien auf dem iPad.</p></div>` : ""}
        ${renderProgress()}

        <div class="lib-admin-actions" id="libAdminActions" style="${pdfReady && !processingPdf ? "" : "display:none"}">
          <button class="lib-admin-btn" type="button" id="libAdminSaveDraft" ${busy ? "disabled" : ""}>Als Entwurf speichern</button>
          <button class="lib-admin-btn lib-admin-btn-primary" type="button" id="libAdminPublish" ${busy || !canPublish() ? "disabled" : ""}>In Test-Bibliothek veröffentlichen</button>
          <button class="lib-admin-btn lib-admin-btn-live" type="button" id="libAdminPublishLive" ${busy || !canPublish() ? "disabled" : ""} title="Veröffentlicht in der Besucher-App (Live-Pfad)">In Besucher-App veröffentlichen</button>
        </div>
      </div>
      ${renderPreviewPanel()}
    </div>`;
  }

  function renderSuccess() {
    const isLive = successTarget === "live";
    const headline = isLive
      ? "Die Veröffentlichung wurde erfolgreich für die Besucher-App (Live) veröffentlicht."
      : "Die Veröffentlichung wurde erfolgreich in der Test-Bibliothek veröffentlicht.";
    const viewBtn = isLive
      ? `<a class="lib-admin-btn lib-admin-btn-live" href="/#bibliothek/${esc(successSlug)}" target="_blank" rel="noopener">In Besucher-Bibliothek ansehen</a>`
      : `<a class="lib-admin-btn lib-admin-btn-primary" href="/test/#bibliothek/${esc(successSlug)}" target="_blank" rel="noopener">In Test-Bibliothek ansehen</a>`;
    const push = lastLivePush || {};
    const pushSent = push.sent === true;
    const pushWaiting = push.waitingForApproval || (push.pending && !push.waitingForLive);
    const pushNote = isLive
      ? pushSent
        ? "Besucher-Push wurde gesendet."
        : pushWaiting
          ? "Besucher-Push wartet auf deine Freigabe — erst „Live Push freigeben“ senden."
          : push.waitingForLive
            ? "Besucher-Push wartet auf stabile Live-Verfügbarkeit."
            : "Besucher-Push: nach Freigabe an alle registrierten Besucher."
      : "Test-Veröffentlichung: kein Besucher-Push.";
    const pushBtn = isLive && !pushSent
      ? `<button class="lib-admin-btn lib-admin-btn-primary" type="button" id="libAdminRetryPush">Live Push freigeben</button>`
      : "";
    return `<div class="lib-admin-success">
      <p><b>${esc(headline)}</b></p>
      <p class="lib-admin-category" style="margin-top:8px">${esc(pushNote)}</p>
      <div class="lib-admin-actions" style="margin-top:12px">
        ${viewBtn}
        ${pushBtn}
        <button class="lib-admin-btn" type="button" id="libAdminNewUpload">Weitere PDF hochladen</button>
      </div>
    </div>`;
  }

  async function retryLibraryLivePush() {
    if (!successPublicationId) throw new Error("Keine Veröffentlichung für Push gefunden");
    if (!confirm("Live Push freigeben?\n\nDer PDF-Push wird jetzt an alle registrierten Besucher gesendet.")) return;
    const btn = document.getElementById("libAdminRetryPush");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Push wird gesendet…";
    }
    try {
      const result = await workerPost("api/admin/push/library/retry", {
        publicationId: successPublicationId,
        slug: successSlug,
        publicationTitle: draft?.title || "",
        pdfUrl: successPdfUrl
      });
      lastLivePush = result?.push || result || null;
      const sent = result?.push?.sent === true;
      toast(sent ? "Live Push gesendet" : (result?.push?.reason || "Push mit Hinweis"));
      safeRender();
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Live Push freigeben";
      }
    }
  }

  function statusLabelAdmin(status) {
    const map = {
      published: "Veröffentlicht",
      updated: "Aktualisiert",
      preparing: "Vorbereitung",
      draft: "Entwurf / offline",
      archived: "Archiviert",
      error: "Fehler"
    };
    return map[String(status || "").trim()] || String(status || "—");
  }

  function targetLabel(target) {
    return target === "live" ? "Besucher-App (Live)" : "Test-Bibliothek";
  }

  function mergedTargetsForAction(merged, action) {
    const targets = [];
    if (!merged) return targets;
    if (action === "unpublish") {
      if (merged.inTest && isOnlineStatus(merged.testStatus)) targets.push("test");
      if (merged.inLive && isOnlineStatus(merged.liveStatus)) targets.push("live");
      return targets;
    }
    if (action === "archive") {
      if (merged.inTest && merged.testStatus !== "archived") targets.push("test");
      if (merged.inLive && merged.liveStatus !== "archived") targets.push("live");
      return targets;
    }
    if (action === "delete") {
      if (merged.inTest) targets.push("test");
      if (merged.inLive) targets.push("live");
    }
    return targets;
  }

  function actionTargetLabel(targets) {
    if (!targets.length) return "";
    if (targets.length === 2) return "Test und Besucher-App (Live)";
    return targetLabel(targets[0]);
  }

  async function runLibraryCatalogAction(id, action) {
    const merged = getMergedEntry(id);
    if (!merged) throw new Error("Veröffentlichung nicht gefunden");
    const targets = mergedTargetsForAction(merged, action);
    if (!targets.length) throw new Error("Keine Aktion für diesen Eintrag möglich");
    for (const target of targets) {
      const body = { id, target };
      if (action === "delete") body.action = "delete";
      else if (action === "unpublish") body.action = "unpublish";
      else body.action = "archive";
      await workerPost("api/admin/library/delete", body);
    }
  }

  function manageEntryMatchesFilter(entry) {
    const display = entry.display || {};
    const filter = manageFilter;
    if (filter === "published") {
      return isOnlineStatus(entry.testStatus) || isOnlineStatus(entry.liveStatus);
    }
    if (filter === "draft") {
      return (entry.inTest && entry.testStatus === "draft") || (entry.inLive && entry.liveStatus === "draft");
    }
    if (filter === "archived") {
      return entry.testStatus === "archived" || entry.liveStatus === "archived";
    }
    if (filter === "test") return entry.inTest;
    if (filter === "live") return entry.inLive;
    if (filter === "live-only") return entry.inLive && !entry.inTest;
    return true;
  }

  function manageEntryMatchesSearch(entry) {
    const q = String(manageSearch || "").trim().toLowerCase();
    if (!q) return true;
    const display = entry.display || {};
    const blob = [
      display.title,
      display.category,
      display.slug,
      display.id,
      display.transliteratedTitle,
      ...(display.tags || [])
    ].join(" ").toLowerCase();
    return blob.includes(q);
  }

  function getFilteredManageList() {
    return mergedPublications
      .filter((entry) => manageEntryMatchesFilter(entry) && manageEntryMatchesSearch(entry))
      .slice()
      .sort((a, b) => String(b.display?.updatedAt || "").localeCompare(String(a.display?.updatedAt || "")));
  }

  function renderTargetBadges(entry) {
    const parts = [];
    if (entry.inTest) {
      const cls = isOnlineStatus(entry.testStatus) ? "is-online" : entry.testStatus === "archived" ? "is-archived" : "is-draft";
      parts.push(`<span class="lib-admin-target-pill ${cls}">Test: ${esc(statusLabelAdmin(entry.testStatus || "—"))}</span>`);
    }
    if (entry.inLive) {
      const cls = isOnlineStatus(entry.liveStatus) ? "is-online" : entry.liveStatus === "archived" ? "is-archived" : "is-draft";
      parts.push(`<span class="lib-admin-target-pill ${cls}">Live: ${esc(statusLabelAdmin(entry.liveStatus || "—"))}</span>`);
    }
    return parts.join("");
  }

  function renderManageViewLinks(entry, pub, mode) {
    const mini = mode === "mini";
    const links = [];
    if (entry.inTest && isOnlineStatus(entry.testStatus) && pub.slug) {
      links.push(`<a class="lib-admin-btn ${mini ? "lib-admin-btn-mini" : "lib-admin-btn-mini lib-admin-btn-wide"}" href="/test/#bibliothek/${esc(pub.slug)}" target="_blank" rel="noopener">${mini ? "Test" : "Test ansehen"}</a>`);
    }
    if (entry.inLive && isOnlineStatus(entry.liveStatus) && pub.slug) {
      links.push(`<a class="lib-admin-btn ${mini ? "lib-admin-btn-mini lib-admin-btn-live" : "lib-admin-btn-mini lib-admin-btn-wide lib-admin-btn-live"}" href="/#bibliothek/${esc(pub.slug)}" target="_blank" rel="noopener">${mini ? "Live" : "Live ansehen"}</a>`);
    }
    return links;
  }

  function renderManageRow(entry) {
    const pub = entry.display || {};
    const cover = pub.coverUrls?.small || pub.coverUrl || "";
    const expanded = manageExpandedIds.has(entry.id);
    const rowClass = [
      "lib-admin-list-item",
      "lib-admin-manage-card",
      expanded ? "is-open" : "",
      isOnlineStatus(entry.testStatus) || isOnlineStatus(entry.liveStatus) ? "is-online" : "",
      entry.testStatus === "archived" || entry.liveStatus === "archived" ? "is-archived" : "",
      manageSelectedId === entry.id ? "is-selected" : ""
    ].filter(Boolean).join(" ");
    const canUnpublish = mergedTargetsForAction(entry, "unpublish").length > 0;
    const canArchive = mergedTargetsForAction(entry, "archive").length > 0;
    const quickLinks = renderManageViewLinks(entry, pub, "mini").join("");
    const panelLinks = renderManageViewLinks(entry, pub, "panel").join("");
    return `<article class="${rowClass}" data-lib-row="${esc(entry.id)}">
      <div class="lib-admin-manage-card-head">
        <div class="lib-admin-manage-card-top">
          <div class="lib-admin-list-cover">${cover ? `<img src="${esc(cover)}" alt="">` : `<span aria-hidden="true">📄</span>`}</div>
          <div class="lib-admin-list-main">
            <div class="lib-admin-list-title-row">
              <b class="lib-admin-manage-title">${esc(pub.title || "Ohne Titel")}</b>
              <span class="lib-admin-status-pill">v${esc(pub.version || "1.0")}</span>
            </div>
            <p class="lib-admin-list-meta">${esc(pub.category || "—")} · ${esc(pub.pageCount || 0)} S. · ${esc(pub.updatedAt || "—")}</p>
            <div class="lib-admin-target-badges">${renderTargetBadges(entry)}</div>
          </div>
          <button class="lib-admin-manage-toggle" type="button" data-lib-toggle="${esc(entry.id)}" aria-expanded="${expanded ? "true" : "false"}" aria-label="${expanded ? "Details schließen" : "Details öffnen"}">
            <span class="lib-admin-manage-toggle-text">${expanded ? "Schließen" : "Details"}</span>
            <span class="lib-admin-manage-chevron" aria-hidden="true"></span>
          </button>
        </div>
        <div class="lib-admin-manage-quick">
          <button class="lib-admin-btn lib-admin-btn-mini lib-admin-btn-primary" type="button" data-lib-edit="${esc(entry.id)}">Bearbeiten</button>
          ${quickLinks}
        </div>
      </div>
      <div class="lib-admin-manage-card-panel"${expanded ? "" : " hidden"}>
        ${renderAdminStatsLine(entry.id)}
        <div class="lib-admin-list-actions lib-admin-list-actions--compact">
          <button class="lib-admin-btn lib-admin-btn-mini lib-admin-btn-primary" type="button" data-lib-edit="${esc(entry.id)}">Bearbeiten</button>
          <button class="lib-admin-btn lib-admin-btn-mini" type="button" data-lib-replace="${esc(entry.id)}">PDF ersetzen</button>
          ${panelLinks}
          ${canUnpublish ? `<button class="lib-admin-btn lib-admin-btn-mini lib-admin-btn-warn" type="button" data-lib-unpublish="${esc(entry.id)}">Offline</button>` : ""}
          ${canArchive ? `<button class="lib-admin-btn lib-admin-btn-mini" type="button" data-lib-archive="${esc(entry.id)}">Archiv</button>` : ""}
          <button class="lib-admin-btn lib-admin-btn-mini lib-admin-btn-danger" type="button" data-lib-delete="${esc(entry.id)}">Löschen</button>
        </div>
      </div>
    </article>`;
  }

  function renderManageFilters() {
    const filters = [
      { id: "all", label: "Alle", count: mergedPublications.length },
      { id: "published", label: "Online", count: mergedPublications.filter((e) => isOnlineStatus(e.testStatus) || isOnlineStatus(e.liveStatus)).length },
      { id: "draft", label: "Entwurf", count: mergedPublications.filter((e) => e.testStatus === "draft" || e.liveStatus === "draft").length },
      { id: "archived", label: "Archiv", count: mergedPublications.filter((e) => e.testStatus === "archived" || e.liveStatus === "archived").length },
      { id: "test", label: "Test", count: mergedPublications.filter((e) => e.inTest).length },
      { id: "live", label: "Live", count: mergedPublications.filter((e) => e.inLive).length },
      { id: "live-only", label: "Nur Live", count: mergedPublications.filter((e) => e.inLive && !e.inTest).length }
    ];
    return filters.map((f) => `<button type="button" class="lib-admin-filter-tab ${manageFilter === f.id ? "is-active" : ""}" data-lib-filter="${f.id}">${esc(f.label)} <span>(${f.count})</span></button>`).join("");
  }

  function renderManageSection() {
    const items = getFilteredManageList();
    const total = mergedPublications.length;
    const testCount = mergedPublications.filter((m) => m.inTest).length;
    const liveCount = mergedPublications.filter((m) => m.inLive).length;
    if (!total && !loading) {
      return `<section class="lib-admin-manage" id="libAdminManage">
        <header class="lib-admin-manage-head">
          <div>
            <h2>Bibliothek verwalten</h2>
            <p>Noch keine PDFs im Katalog. Lade oben eine Datei hoch.</p>
          </div>
        </header>
      </section>`;
    }
    return `<section class="lib-admin-manage" id="libAdminManage">
      <details class="lib-admin-manage-fold" id="libAdminManageFold"${manageSectionOpen ? " open" : ""}>
        <summary class="lib-admin-manage-fold-summary">
          <span class="lib-admin-manage-fold-title">Bibliothek verwalten</span>
          <span class="lib-admin-manage-fold-meta"><b>${total}</b> PDFs · Test <b>${testCount}</b> · Live <b>${liveCount}</b></span>
        </summary>
        <div class="lib-admin-manage-fold-body">
          <div class="lib-admin-manage-toolbar">
            <label class="lib-admin-modal-search lib-admin-modal-search--compact">
              <span>Suche</span>
              <input id="libAdminManageSearch" type="search" value="${esc(manageSearch)}" placeholder="Titel, Kategorie, Slug …" autocomplete="off">
            </label>
            <div class="lib-admin-manage-actions">
              <button class="lib-admin-btn lib-admin-btn-mini" type="button" id="libAdminManageCollapseAll">Alle zu</button>
              <button class="lib-admin-btn lib-admin-btn-mini" type="button" id="libAdminManageExpandAll">Alle auf</button>
              <button class="lib-admin-btn lib-admin-btn-mini" type="button" id="libAdminManageRefresh">Aktualisieren</button>
            </div>
          </div>
          <div class="lib-admin-filter-tabs lib-admin-filter-tabs--compact" id="libAdminManageFilters">${renderManageFilters()}</div>
          <p class="lib-admin-manage-hint">${items.length} von ${total} · Live-Statistik 15s</p>
          <div class="lib-admin-manage-list" id="libAdminManageList">
            ${items.length ? items.map((entry) => renderManageRow(entry)).join("") : `<p class="lib-admin-manage-empty">Keine Treffer für Suche oder Filter.</p>`}
          </div>
        </div>
      </details>
    </section>`;
  }

  function scrollToUploadSection() {
    const el = document.getElementById("libAdminUploadSection");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderLibraryTab() {
    if (loading && !loaded) {
      return `<section class="lib-admin" id="libAdminMount"><p class="lib-admin-category">Bibliothek wird geladen…</p></section>`;
    }
    return `<section class="lib-admin" id="libAdminMount">
      ${successSlug ? renderSuccess() : renderUploadForm()}
      ${renderManageSection()}
    </section>`;
  }

  function bindLibraryTab() {
    const dropZone = document.getElementById("libAdminDropZone");
    const pdfInput = document.getElementById("libAdminPdfInput");

    dropZone?.addEventListener("dragover", (ev) => {
      ev.preventDefault();
      dragActive = true;
      dropZone.classList.add("is-dragover");
    });
    dropZone?.addEventListener("dragleave", () => {
      dragActive = false;
      dropZone.classList.remove("is-dragover");
    });
    dropZone?.addEventListener("drop", async (ev) => {
      ev.preventDefault();
      dragActive = false;
      dropZone.classList.remove("is-dragover");
      const file = ev.dataTransfer?.files?.[0];
      if (!file) return;
      try {
        await onPdfSelected(file);
        safeRender({ force: true });
      } catch (e) {
        toast(e.message || "PDF konnte nicht gelesen werden");
        safeRender({ force: true });
      }
    });

    pdfInput?.addEventListener("change", async (ev) => {
      const file = ev.target.files?.[0];
      if (!file) return;
      try {
        await onPdfSelected(file);
        safeRender({ force: true });
      } catch (e) {
        toast(e.message || "PDF konnte nicht gelesen werden");
        safeRender({ force: true });
      } finally {
        ev.target.value = "";
      }
    });

    document.getElementById("libAdminVersion")?.addEventListener("input", () => {
      pdfReplaceVersion = "";
    });

    document.getElementById("libAdminChangeCategory")?.addEventListener("click", (ev) => {
      ev.preventDefault();
      showCategoryEdit = true;
      if (draft && !draft.category && categorySuggestion?.category) {
        draft.category = categorySuggestion.category;
        draft.topic = categorySuggestion.topic || categorySuggestion.category;
      }
      safeRender();
    });

    document.getElementById("libAdminCategory")?.addEventListener("change", (ev) => {
      if (!draft) draft = defaultDraft();
      draft.category = ev.target.value || "";
      if (!draft.topic) draft.topic = draft.category;
      safeRender();
    });

    document.getElementById("libAdminTopic")?.addEventListener("input", (ev) => {
      if (draft) draft.topic = ev.target.value || "";
    });

    document.getElementById("libAdminSaveDraft")?.addEventListener("click", async () => {
      try {
        await saveDraft();
        toast("Entwurf gespeichert");
        await ensureLibraryLoaded(true);
        safeRender();
      } catch (e) {
        toast(e.message || "Speichern fehlgeschlagen");
      }
    });

    document.getElementById("libAdminPublish")?.addEventListener("click", async () => {
      try {
        await publishDraft("test");
        toast("Veröffentlicht (Test)");
        safeRender();
      } catch (e) {
        toast(e.message || "Veröffentlichung fehlgeschlagen");
        publishStep = 0;
        safeRender();
      }
    });

    document.getElementById("libAdminPublishLive")?.addEventListener("click", async () => {
      try {
        await publishDraft("live");
        toast("Veröffentlicht (Besucher-App / Live)");
        safeRender();
      } catch (e) {
        toast(e.message || "Live-Veröffentlichung fehlgeschlagen");
        publishStep = 0;
        safeRender();
      }
    });

    document.getElementById("libAdminNewUpload")?.addEventListener("click", () => {
      resetUploadForm();
      safeRender();
    });

    document.getElementById("libAdminRetryPush")?.addEventListener("click", async () => {
      try {
        await retryLibraryLivePush();
      } catch (e) {
        toast(e.message || "Push fehlgeschlagen");
      }
    });

    document.getElementById("libAdminCancelEdit")?.addEventListener("click", () => {
      manageSelectedId = "";
      resetUploadForm();
      safeRender();
    });

    document.getElementById("libAdminManageRefresh")?.addEventListener("click", async () => {
      try {
        await ensureLibraryLoaded(true);
        await fetchAdminLibraryStatsMap(true);
        toast("Katalog aktualisiert");
        safeRender();
      } catch (e) {
        toast(e.message || "Aktualisieren fehlgeschlagen");
      }
    });

    document.getElementById("libAdminManageFold")?.addEventListener("toggle", (ev) => {
      manageSectionOpen = !!ev.currentTarget?.open;
    });

    document.getElementById("libAdminManageCollapseAll")?.addEventListener("click", () => {
      manageExpandedIds.clear();
      safeRender({ force: true });
    });

    document.getElementById("libAdminManageExpandAll")?.addEventListener("click", () => {
      getFilteredManageList().forEach((entry) => manageExpandedIds.add(entry.id));
      safeRender({ force: true });
    });

    document.querySelectorAll("[data-lib-toggle]").forEach((btn) => {
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const id = btn.getAttribute("data-lib-toggle");
        if (!id) return;
        if (manageExpandedIds.has(id)) manageExpandedIds.delete(id);
        else manageExpandedIds.add(id);
        const card = btn.closest(".lib-admin-manage-card");
        const panel = card?.querySelector(".lib-admin-manage-card-panel");
        const open = manageExpandedIds.has(id);
        card?.classList.toggle("is-open", open);
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        const label = btn.querySelector(".lib-admin-manage-toggle-text");
        if (label) label.textContent = open ? "Schließen" : "Details";
        if (panel) panel.hidden = !open;
      });
    });

    document.getElementById("libAdminManageSearch")?.addEventListener("input", (ev) => {
      manageSearch = ev.target.value || "";
      safeRender({ force: true });
      const input = document.getElementById("libAdminManageSearch");
      if (input) {
        input.focus();
        const len = input.value.length;
        input.setSelectionRange(len, len);
      }
    });

    document.querySelectorAll("[data-lib-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        manageFilter = btn.getAttribute("data-lib-filter") || "all";
        safeRender();
      });
    });

    document.querySelectorAll("[data-lib-edit]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-lib-edit");
        try {
          await loadPublicationForEdit(id);
          scrollToUploadSection();
          safeRender();
        } catch (e) {
          toast(e.message || "Bearbeitung konnte nicht gestartet werden");
        }
      });
    });

    document.querySelectorAll("[data-lib-replace]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-lib-replace");
        try {
          await loadPublicationForEdit(id);
          scrollToUploadSection();
          safeRender();
          document.getElementById("libAdminPdfInput")?.click();
        } catch (e) {
          toast(e.message || "PDF-Ersetzen konnte nicht gestartet werden");
        }
      });
    });

    document.querySelectorAll("[data-lib-archive]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-lib-archive");
        const merged = getMergedEntry(id);
        const targets = mergedTargetsForAction(merged, "archive");
        if (!targets.length) return;
        if (!confirm(`Veröffentlichung archivieren (${actionTargetLabel(targets)})?\n\nSie wird für Besucher ausgeblendet, bleibt aber im Admin erhalten.`)) return;
        try {
          await runLibraryCatalogAction(id, "archive");
          if (editingPublicationId === id) resetUploadForm();
          manageSelectedId = "";
          toast("Archiviert");
          await ensureLibraryLoaded(true);
          safeRender();
        } catch (e) {
          toast(e.message || "Archivieren fehlgeschlagen");
        }
      });
    });

    document.querySelectorAll("[data-lib-unpublish]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-lib-unpublish");
        const merged = getMergedEntry(id);
        const targets = mergedTargetsForAction(merged, "unpublish");
        if (!targets.length) return;
        if (!confirm(`Veröffentlichung offline nehmen (${actionTargetLabel(targets)})?\n\nSie verschwindet von der Bibliotheksseite und kann bearbeitet sowie erneut veröffentlicht werden.`)) return;
        try {
          await runLibraryCatalogAction(id, "unpublish");
          if (editingPublicationId === id) resetUploadForm();
          manageSelectedId = "";
          toast("Offline genommen — Entwurf");
          await ensureLibraryLoaded(true);
          safeRender();
        } catch (e) {
          toast(e.message || "Offline nehmen fehlgeschlagen");
        }
      });
    });

    document.querySelectorAll("[data-lib-delete]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-lib-delete");
        const merged = getMergedEntry(id);
        const targets = mergedTargetsForAction(merged, "delete");
        if (!targets.length) return;
        if (!confirm(`Veröffentlichung endgültig löschen (${actionTargetLabel(targets)})?\n\nPDF, Cover und Eintrag werden aus dem Katalog entfernt.`)) return;
        try {
          await runLibraryCatalogAction(id, "delete");
          if (editingPublicationId === id) resetUploadForm();
          manageSelectedId = "";
          toast("Gelöscht");
          await ensureLibraryLoaded(true);
          safeRender();
        } catch (e) {
          toast(e.message || "Löschen fehlgeschlagen");
        }
      });
    });
  }

  global.DARLibraryAdmin = {
    ensureLibraryLoaded,
    renderLibraryTab,
    bindLibraryTab,
    isLibraryBusy,
    hasLibraryWork
  };
})(window);
