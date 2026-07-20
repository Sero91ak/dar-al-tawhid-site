/**
 * DAR AL TAWḤĪD Bibliothek — Test-App
 */
(function (global) {
  "use strict";

  const DATA_URL = "/test/data/library-publications.json";
  const PROGRESS_KEY = "darLibraryProgressV1";
  const OFFLINE_DB = "darLibraryOfflineV1";
  const OFFLINE_STORE = "pdfs";
  const PDFJS_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
  const PDFJS_WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

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
  let uiState = { query: "", category: "Alle" };
  let readerState = null;

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
    const progress = getProgress(pub.id);
    const date = pub.updatedAt || pub.publishedAt || "";
    const pages = pub.pageCount ? `${pub.pageCount} Seiten` : "";
    return `<button class="lib-card" type="button" data-library-open="${esc(pub.slug)}" aria-label="${esc(pub.title)} öffnen">
      <div class="lib-cover-wrap">
        ${coverHtml(pub)}
        <div class="lib-badges">${badgeHtml(pub)}${offline ? '<span class="lib-badge is-offline">Offline</span>' : ""}</div>
        ${progressHtml(pub)}
      </div>
      <div class="lib-card-body">
        <h4>${esc(pub.title)}</h4>
        <div class="lib-card-meta">
          <span>${esc(pub.category || "")}</span>
          ${pages ? `<span>${esc(pages)}</span>` : ""}
          ${date ? `<span>${esc(formatDate(date))}</span>` : ""}
          ${progress && progress.lastPage ? `<span>Seite ${progress.lastPage}</span>` : ""}
        </div>
      </div>
    </button>`;
  }

  function sectionHtml(title, countLabel, cards, layout) {
    if (!cards) return "";
    const inner = layout === "shelf" ? `<div class="lib-shelf-row">${cards}</div>` : `<div class="lib-grid">${cards}</div>`;
    return `<section class="lib-section"><div class="lib-section-head"><h3>${esc(title)}</h3>${countLabel ? `<span>${esc(countLabel)}</span>` : ""}</div>${inner}</section>`;
  }

  function buildShelfSections(all, offlineIds) {
    const count = all.length;
    const compactCatalog = count <= 3;
    const useHorizontal = count >= 4;
    const sections = [];
    const usedInFeatured = new Set();

    const recommended = all.filter((p) => p.isRecommended);
    const newestOnly = all.filter((p) => p.isNew && !p.isRecommended);
    const recent = getRecentlyRead(all).slice(0, 8);

    if (compactCatalog) {
      if (recommended.length) {
        recommended.forEach((p) => usedInFeatured.add(p.id));
        sections.push(sectionHtml("Empfohlen", `${recommended.length}`, recommended.map((p) => cardHtml(p, offlineIds)).join(""), useHorizontal ? "shelf" : "grid"));
      } else if (newestOnly.length) {
        newestOnly.forEach((p) => usedInFeatured.add(p.id));
        sections.push(sectionHtml("Neu erschienen", `${newestOnly.length}`, newestOnly.map((p) => cardHtml(p, offlineIds)).join(""), useHorizontal ? "shelf" : "grid"));
      }
    } else {
      const shelfNewest = [...all]
        .sort((a, b) => String(b.publishedAt || "").localeCompare(String(a.publishedAt || "")))
        .filter((p) => p.isNew && !usedInFeatured.has(p.id))
        .slice(0, 8);
      const shelfRecommended = recommended.filter((p) => !usedInFeatured.has(p.id)).slice(0, 8);
      shelfRecommended.forEach((p) => usedInFeatured.add(p.id));
      shelfNewest.forEach((p) => usedInFeatured.add(p.id));
      if (shelfNewest.length) sections.push(sectionHtml("Neu erschienen", `${shelfNewest.length}`, shelfNewest.map((p) => cardHtml(p, offlineIds)).join(""), "shelf"));
      if (shelfRecommended.length) sections.push(sectionHtml("Empfohlen", `${shelfRecommended.length}`, shelfRecommended.map((p) => cardHtml(p, offlineIds)).join(""), "shelf"));
    }

    if (recent.length) {
      sections.push(sectionHtml("Zuletzt gelesen", `${recent.length}`, recent.map((p) => cardHtml(p, offlineIds)).join(""), useHorizontal ? "shelf" : "grid"));
    }

    return sections;
  }

  function renderLoading() {
    return `<section class="lib-page"><div class="lib-empty">Bibliothek wird geladen…</div></section>`;
  }

  function renderError() {
    return `<section class="lib-page"><div class="lib-error">Die Bibliothek konnte momentan nicht geladen werden. Bitte versuche es erneut.<br><button type="button" data-library-retry>Erneut versuchen</button></div></section>`;
  }

  function renderBibliothekMain(offlineIds) {
    const all = visiblePublications(catalog.publications || []);
    const filtered = filteredPublications(all);
    const byTopic = uiState.category !== "Alle" ? filtered : [];

    const catButtons = CATEGORIES.map((cat) =>
      `<button class="lib-cat" type="button" data-library-cat="${esc(cat)}" aria-pressed="${uiState.category === cat ? "true" : "false"}">${esc(cat)}</button>`
    ).join("");

    let sections = "";
    const showShelves = !uiState.query && uiState.category === "Alle";

    if (showShelves) {
      sections += buildShelfSections(all, offlineIds).join("");
    }

    if (uiState.category !== "Alle") {
      const topicCards = byTopic.map((p) => cardHtml(p, offlineIds)).join("");
      if (topicCards) sections += sectionHtml(`Nach Themen · ${uiState.category}`, `${byTopic.length}`, topicCards);
    }

    const allCards = (uiState.query || uiState.category !== "Alle" ? filtered : all)
      .map((p) => cardHtml(p, offlineIds))
      .join("");
    if (allCards && (uiState.query || !showShelves || uiState.category !== "Alle")) {
      sections += sectionHtml(uiState.query ? "Suchergebnisse" : "Alle Veröffentlichungen", `${filtered.length}`, allCards);
    } else if (showShelves && all.length) {
      sections += sectionHtml("Alle Veröffentlichungen", `${all.length}`, all.map((p) => cardHtml(p, offlineIds)).join(""));
    }

    if (!sections) {
      sections = `<div class="lib-empty">Keine Veröffentlichungen für diese Auswahl gefunden.</div>`;
    }

    return `<section class="lib-page" data-library-root>
      <header class="lib-hero" aria-label="Bibliothekskopf">
        <div class="lib-hero-inner">
          <h2>DAR AL TAWḤĪD Bibliothek</h2>
          <p>Bücher, Abhandlungen und Themenhefte von Serhat Abu Malik</p>
          <p class="lib-hero-note is-short">Veröffentlichungen zu Tawḥīd, ʿAqīdah, Qurʾān und Sunnah.</p>
          <p class="lib-hero-note is-full">Ausführliche Veröffentlichungen zu Tawḥīd, ʿAqīdah, Qurʾān, Sunnah und dem Verständnis der Salaf.</p>
        </div>
      </header>
      <div class="lib-toolbar">
        <label class="visually-hidden" for="librarySearch">Bücher und Themen durchsuchen</label>
        <input id="librarySearch" class="lib-search" type="search" placeholder="Bücher und Themen durchsuchen" autocomplete="off" value="${esc(uiState.query)}">
        <div class="lib-cats" role="toolbar" aria-label="Kategorien">${catButtons}</div>
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

    const toc = (pub.tableOfContents || []);
    const sources = pub.sources || [];
    const versions = pub.versionHistory || [];

    return `<section class="lib-page lib-detail" data-library-detail="${esc(pub.slug)}">
      <div class="lib-detail-hero">
        <div class="lib-detail-cover">${coverHtml(pub)}</div>
        <div>
          <p class="lib-detail-kicker">${esc(pub.transliteratedTitle || "")}</p>
          <h2>${esc(pub.title)}</h2>
          <p class="lib-detail-sub">${esc(pub.subtitle || "")}</p>
          <p class="lib-detail-credit">${esc(pub.credit || "")}</p>
          <p class="lib-detail-desc">${esc(pub.description || "")}</p>
        </div>
      </div>
      ${progress && progress.lastPage ? `<p class="lib-resume">Weiterlesen ab Seite ${progress.lastPage}</p>` : ""}
      ${preparing ? `<div class="lib-status-note" role="status">Veröffentlichung wird vorbereitet</div>` : ""}
      <div class="lib-actions">
        <button class="lib-btn lib-btn-primary" type="button" data-library-read="${esc(pub.slug)}" ${readEnabled ? "" : "disabled"}>${progress && progress.lastPage ? "Weiterlesen" : "Jetzt lesen"}</button>
        <button class="lib-btn" type="button" data-library-download="${esc(pub.slug)}" ${downloadEnabled ? "" : "disabled"}>PDF herunterladen</button>
        <button class="lib-btn" type="button" data-library-offline="${esc(pub.slug)}" ${offlineEnabled && !offline ? "" : "disabled"}>${offline ? "Offline verfügbar" : "Offline speichern"}</button>
        ${offline && offlineEnabled ? `<button class="lib-btn lib-btn-ghost" type="button" data-library-offline-remove="${esc(pub.slug)}">Offline-Datei entfernen</button>` : ""}
        <button class="lib-btn lib-btn-ghost" type="button" data-library-share="${esc(pub.slug)}">Teilen</button>
      </div>
      <div class="lib-meta-grid">
        <div class="lib-meta-item"><b>Kategorie</b><span>${esc(pub.category || "—")}</span></div>
        <div class="lib-meta-item"><b>Thema</b><span>${esc(pub.topic || "—")}</span></div>
        <div class="lib-meta-item"><b>Seiten</b><span>${pub.pageCount ? esc(String(pub.pageCount)) : "—"}</span></div>
        <div class="lib-meta-item"><b>Sprache</b><span>${esc(pub.language || "—")}</span></div>
        <div class="lib-meta-item"><b>Version</b><span>${esc(pub.version || "—")}</span></div>
        <div class="lib-meta-item"><b>Veröffentlicht</b><span>${esc(formatDate(pub.publishedAt))}</span></div>
        <div class="lib-meta-item"><b>Aktualisiert</b><span>${esc(formatDate(pub.updatedAt))}</span></div>
        <div class="lib-meta-item"><b>Dateigröße</b><span>${esc(pub.fileSize || "—")}</span></div>
        <div class="lib-meta-item"><b>Status</b><span>${esc(statusLabel(pub))}</span></div>
        <div class="lib-meta-item"><b>Lesefortschritt</b><span>${progress && progress.lastPage ? `Seite ${progress.lastPage}${progress.totalPages ? ` von ${progress.totalPages}` : ""}` : "Noch nicht begonnen"}</span></div>
      </div>
      ${toc.length ? `<section class="lib-panel"><h3>Inhaltsverzeichnis</h3><ul>${toc.map((item) => `<li>${esc(item.title || item)}</li>`).join("")}</ul></section>` : ""}
      ${pub.about ? `<section class="lib-panel"><h3>Über diese Veröffentlichung</h3><p>${esc(pub.about)}</p></section>` : ""}
      ${sources.length ? `<section class="lib-panel"><h3>Verwendete Quellen</h3><ul>${sources.map((s) => `<li>${esc(typeof s === "string" ? s : s.title || s.name || "")}</li>`).join("")}</ul></section>` : ""}
      ${versions.length ? `<section class="lib-panel"><h3>Versionsverlauf</h3><ul>${versions.map((v) => `<li><b>${esc(v.version || "")}</b> · ${esc(formatDate(v.date))} — ${esc(v.note || "")}</li>`).join("")}</ul></section>` : ""}
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
      <div class="lib-reader-toolbar">
        <button class="lib-btn lib-btn-ghost" type="button" data-library-reader-close aria-label="Zurück zur Buchdetailseite">Zurück</button>
        <button class="lib-btn" type="button" data-library-reader-prev aria-label="Vorherige Seite">‹</button>
        <button class="lib-btn" type="button" data-library-reader-next aria-label="Nächste Seite">›</button>
        <label class="lib-reader-page">Seite <input type="number" min="1" data-library-reader-input value="${progress?.lastPage || 1}" aria-label="Seitennummer"> / <span data-library-reader-total>—</span></label>
        <button class="lib-btn" type="button" data-library-reader-zoom-out aria-label="Verkleinern">−</button>
        <button class="lib-btn" type="button" data-library-reader-zoom-in aria-label="Vergrößern">+</button>
        <button class="lib-btn" type="button" data-library-reader-fullscreen aria-label="Vollbild">Vollbild</button>
        <button class="lib-btn" type="button" data-library-reader-download aria-label="Download">Download</button>
        <button class="lib-btn" type="button" data-library-reader-share aria-label="Teilen">Teilen</button>
      </div>
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
    const url = `${global.location.origin}/test/#bibliothek/${encodeURIComponent(pub.slug)}`;
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
      const s = document.createElement("script");
      s.src = PDFJS_URL;
      s.async = true;
      s.onload = () => {
        try {
          global.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
          resolve(global.pdfjsLib);
        } catch (e) {
          reject(e);
        }
      };
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return global.__pdfJsLoading;
  }

  async function initReader(pub) {
    const root = document.querySelector("[data-library-reader]");
    const stage = document.querySelector("[data-library-reader-stage]");
    if (!root || !stage) return;

    readerState = {
      pub,
      page: getProgress(pub.id)?.lastPage || 1,
      total: 0,
      scale: 1.1,
      doc: null
    };

    try {
      const pdfjs = await loadPdfJs();
      const blob = await fetchPdfBlob(pub);
      const data = await blob.arrayBuffer();
      const doc = await pdfjs.getDocument({ data }).promise;
      readerState.doc = doc;
      readerState.total = doc.numPages;
      const totalEl = root.querySelector("[data-library-reader-total]");
      if (totalEl) totalEl.textContent = String(readerState.total);
      await renderReaderPage();
    } catch (e) {
      stage.innerHTML = `<div class="lib-reader-msg">Diese Veröffentlichung wird momentan vorbereitet.</div>`;
    }
  }

  async function renderReaderPage() {
    if (!readerState || !readerState.doc) return;
    const stage = document.querySelector("[data-library-reader-stage]");
    const input = document.querySelector("[data-library-reader-input]");
    if (!stage) return;

    const pageNum = Math.max(1, Math.min(readerState.total, Number(readerState.page) || 1));
    readerState.page = pageNum;
    if (input) input.value = String(pageNum);

    const page = await readerState.doc.getPage(pageNum);
    const viewport = page.getViewport({ scale: readerState.scale });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    stage.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "lib-reader-canvas-wrap";
    wrap.appendChild(canvas);
    stage.appendChild(wrap);
    await page.render({ canvasContext: ctx, viewport }).promise;
    saveProgress(readerState.pub.id, pageNum, readerState.total);
  }

  function findPublication(slug) {
    return (catalog?.publications || []).find((p) => p.slug === slug || p.id === slug);
  }

  async function bindLibrary(route) {
    const root = document.querySelector("[data-library-root]");
    if (root) {
      const search = document.getElementById("librarySearch");
      if (search) {
        search.oninput = () => {
          uiState.query = search.value || "";
          if (typeof global.render === "function") global.render();
        };
      }
      root.querySelectorAll("[data-library-cat]").forEach((btn) => {
        btn.onclick = () => {
          uiState.category = btn.getAttribute("data-library-cat") || "Alle";
          if (typeof global.render === "function") global.render();
        };
      });
      root.querySelectorAll("[data-library-open]").forEach((btn) => {
        btn.onclick = () => navigateDetail(btn.getAttribute("data-library-open") || "");
      });
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
        btn.onclick = () => navigateDetail(btn.getAttribute("data-library-open") || "");
      });
    }

    if (route && route.view === "bibliothek-reader") {
      document.body.classList.add("is-library-reader-route");
      const pub = findPublication(route.value);
      if (pub && canRead(pub)) {
        await initReader(pub);
        const reader = document.querySelector("[data-library-reader]");
        if (reader) {
          reader.querySelector("[data-library-reader-close]")?.addEventListener("click", () => navigateDetail(pub.slug));
          reader.querySelector("[data-library-reader-prev]")?.addEventListener("click", () => {
            readerState.page = Math.max(1, readerState.page - 1);
            renderReaderPage();
          });
          reader.querySelector("[data-library-reader-next]")?.addEventListener("click", () => {
            readerState.page = Math.min(readerState.total, readerState.page + 1);
            renderReaderPage();
          });
          reader.querySelector("[data-library-reader-input]")?.addEventListener("change", (ev) => {
            readerState.page = Number(ev.target.value) || 1;
            renderReaderPage();
          });
          reader.querySelector("[data-library-reader-zoom-in]")?.addEventListener("click", () => {
            readerState.scale = Math.min(2.4, readerState.scale + 0.15);
            renderReaderPage();
          });
          reader.querySelector("[data-library-reader-zoom-out]")?.addEventListener("click", () => {
            readerState.scale = Math.max(0.7, readerState.scale - 0.15);
            renderReaderPage();
          });
          reader.querySelector("[data-library-reader-fullscreen]")?.addEventListener("click", () => {
            const el = reader;
            if (el.requestFullscreen) el.requestFullscreen();
          });
          reader.querySelector("[data-library-reader-download]")?.addEventListener("click", async () => {
            try {
              const blob = await fetchPdfBlob(pub);
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${pub.slug || pub.id}.pdf`;
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 4000);
            } catch (e) {
              alert("Der Download konnte nicht abgeschlossen werden. Bitte versuche es erneut.");
            }
          });
          reader.querySelector("[data-library-reader-share]")?.addEventListener("click", () => sharePublication(pub));
        }
      }
    } else {
      document.body.classList.remove("is-library-reader-route");
      readerState = null;
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
    renderBibliothek: () => renderBibliothek(),
    renderBibliothekDetail: (slug) => renderBibliothekDetailView(slug),
    renderBibliothekReader: (slug) => renderBibliothekReaderView(slug),
    renderBibliothekWithOffline: () => ensureCatalog().then(() => enrichWithOffline()),
    renderBibliothekDetailWithOffline: (slug) => ensureCatalog().then(() => enrichWithOffline(null, slug)),
    bindLibrary,
    getProgress,
    saveProgress,
    listOfflineIds,
    resetUiState: () => {
      uiState = { query: "", category: "Alle" };
    }
  };
})(window);
