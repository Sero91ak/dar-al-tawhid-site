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
  let loaded = false;
  let loading = false;
  let draft = null;
  let pdfFile = null;
  let pdfMeta = null;
  let coverMode = "template";
  let coverPreviewUrl = "";
  let coverVariants = null;
  let categorySuggestion = null;
  let showCategoryEdit = false;
  let busy = false;
  let publishStep = 0;
  let successSlug = "";
  let successTarget = "test";
  let editingPublicationId = "";
  let coverTimer = null;
  let dragActive = false;
  let manageModalOpen = false;
  let manageSelectedId = "";
  let manageFilter = "all";
  let manageSearch = "";
  let manageSearchTimer = null;
  let processingPdf = false;

  function notify(msg) {
    if (typeof global.toast === "function") global.toast(msg);
  }

  function isBibliothekTab() {
    if (typeof global.getAdminCurrentTab === "function") return global.getAdminCurrentTab() === "bibliothek";
    return true;
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

  function renderLibraryShell() {
    if (typeof global.renderShell !== "function" || !isBibliothekTab()) return;
    try {
      global.renderShell();
    } catch (e) {
      console.error("[Bibliothek Admin] renderShell fehlgeschlagen:", e);
    }
  }

  function isLibraryBusy() {
    return !!(busy || processingPdf);
  }

  function hasLibraryWork() {
    return !!(busy || processingPdf || manageModalOpen || pdfFile || pdfMeta || successSlug || editingPublicationId || (draft && (draft.title || draft.pdfUrl)));
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

  if (!global.__darLibraryModalEscapeBound) {
    global.__darLibraryModalEscapeBound = true;
    document.addEventListener("keydown", (ev) => {
      if (ev.key !== "Escape") return;
      if (global.DARLibraryAdmin?.closeManageModalIfOpen) global.DARLibraryAdmin.closeManageModalIfOpen();
    });
  }

  function libraryPathsFor(target) {
    return LIBRARY_TARGETS[target === "live" ? "live" : "test"];
  }

  async function loadStaticCatalog() {
    const res = await fetch(STATIC_CATALOG_URL, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  }

  async function ensureLibraryLoaded(force) {
    if (loaded && !force) return catalog;
    if (loading) return catalog;
    loading = true;
    try {
      const res = await workerGet("api/admin/library");
      catalog = res.catalog || { version: 1, publications: [] };
      loaded = true;
      return catalog;
    } catch (e) {
      console.warn("[Bibliothek Admin] Worker-Laden fehlgeschlagen:", e);
      if (String(e.message || "").includes("Secret")) throw e;
      try {
        const staticCatalog = await loadStaticCatalog();
        if (staticCatalog) {
          catalog = staticCatalog;
          loaded = true;
          return catalog;
        }
      } catch (err) {
        console.warn("[Bibliothek Admin] Statischer Katalog nicht verfügbar:", err);
      }
      catalog = { version: 1, publications: [] };
      loaded = true;
      return catalog;
    } finally {
      loading = false;
    }
  }

  function nextPublicationId() {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const prefix = `pub-${today}-`;
    let max = 0;
    (catalog.publications || []).forEach((p) => {
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
    const taken = new Set((catalog.publications || []).filter((p) => p.id !== excludeId).map((p) => p.slug));
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

  async function hashFile(file) {
    const buf = await file.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function formatBytes(n) {
    const num = Number(n) || 0;
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1).replace(".", ",")} KB`;
    return `${(num / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
  }

  async function analyzePdfFile(file) {
    if (!file) throw new Error("Keine Datei ausgewählt");
    if (file.type && file.type !== "application/pdf") throw new Error("Nur PDF-Dateien sind erlaubt");
    if (!file.size) throw new Error("PDF ist leer");
    if (file.size > 80 * 1024 * 1024) throw new Error("PDF ist zu groß (max. 80 MB)");
    const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
    if (String.fromCharCode(...head) !== "%PDF-") throw new Error("Datei ist keine gültige PDF");
    await ensurePdfJs();
    const data = await file.arrayBuffer();
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
      fileHash: await hashFile(file)
    };
  }

  async function suggestCategory(text) {
    try {
      const res = await workerPost("api/admin/library/suggest", { text });
      categorySuggestion = res.suggestion || null;
    } catch (e) {
      categorySuggestion = null;
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

  async function loadPublicationForEdit(id) {
    await ensureLibraryLoaded(true);
    const pub = (catalog.publications || []).find((p) => p.id === id);
    if (!pub) throw new Error("Veröffentlichung nicht gefunden");
    editingPublicationId = pub.id;
    manageModalOpen = false;
    manageSelectedId = "";
    draft = {
      ...pub,
      tags: Array.isArray(pub.tags) ? [...pub.tags] : [],
      searchAliases: Array.isArray(pub.searchAliases) ? [...pub.searchAliases] : [],
      coverUrls: pub.coverUrls ? { ...pub.coverUrls } : {}
    };
    pdfFile = null;
    pdfMeta = {
      fileName: String(pub.pdfUrl || "").split("/").pop() || "bestehende-datei.pdf",
      pageCount: Number(pub.pageCount) || 0,
      fileSize: pub.fileSize || "",
      title: pub.title
    };
    coverMode = "template";
    coverVariants = null;
    const coverSrc = pub.coverUrls?.medium || pub.coverUrl || "";
    if (coverPreviewUrl && coverPreviewUrl.startsWith("blob:")) URL.revokeObjectURL(coverPreviewUrl);
    coverPreviewUrl = coverSrc || "";
    categorySuggestion = pub.category ? { category: pub.category, topic: pub.topic || pub.category, confidence: "high" } : null;
    showCategoryEdit = true;
    successSlug = "";
    publishStep = 0;
    if (global.DARLibraryCoverGen && draft.title) {
      try {
        await refreshCoverPreview();
      } catch (e) {
        /* bestehendes Cover bleibt sichtbar */
      }
    }
    setTimeout(() => {
      document.getElementById("libAdminEditPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  async function onPdfSelected(file, options) {
    processingPdf = true;
    try {
      const replaceMode = options?.replace === true || !!editingPublicationId;
      pdfFile = file;
      pdfMeta = await analyzePdfFile(file);
      if (!replaceMode) {
        draft = defaultDraft();
        draft.id = nextPublicationId();
        draft.title = pdfMeta.title;
        draft.slug = nextUniqueSlug(draft.title, draft.id);
        editingPublicationId = "";
      } else if (draft) {
        draft.version = bumpVersion(draft.version);
        if (!draft.title) draft.title = pdfMeta.title;
      } else {
        draft = defaultDraft();
        draft.title = pdfMeta.title;
      }
      draft.pageCount = pdfMeta.pageCount;
      draft.fileSize = pdfMeta.fileSize;
      draft.fileHash = pdfMeta.fileHash;
      if (!replaceMode) {
        await suggestCategory([draft.title, pdfMeta.author, pdfMeta.fileName].join(" "));
        applyCategorySuggestion();
        coverMode = "template";
      }
      await refreshCoverPreview();
      successSlug = "";
      successTarget = "test";
      publishStep = 0;
    } finally {
      processingPdf = false;
    }
  }

  async function refreshCoverPreview() {
    if (!global.DARLibraryCoverGen || !draft) return;
    if (coverMode === "template") {
      coverVariants = await global.DARLibraryCoverGen.generateCoverVariants(draft);
    } else if (coverMode === "pdf-page") {
      if (!pdfFile) return;
      await ensurePdfJs();
      coverVariants = await global.DARLibraryCoverGen.renderPdfFirstPageCover(pdfFile);
    } else if (coverMode === "upload" && coverVariants) {
      return;
    } else {
      return;
    }
    const previewBase64 = coverVariants.master || coverVariants.medium;
    const blob = await (await fetch(`data:image/webp;base64,${previewBase64}`)).blob();
    if (coverPreviewUrl && coverPreviewUrl.startsWith("blob:")) URL.revokeObjectURL(coverPreviewUrl);
    coverPreviewUrl = URL.createObjectURL(blob);
  }

  async function onCoverUpload(file) {
    if (!file || !/^image\/(png|jpeg|jpg|webp|avif)$/i.test(file.type)) throw new Error("Cover: PNG, JPEG, WebP oder AVIF erlaubt");
    const img = await createImageBitmap(file);
    const canvas = global.DARLibraryCoverGen.composeImageToCoverCanvas(img, "contain");
    coverVariants = await global.DARLibraryCoverGen.generateCoverVariantsFromCanvas(canvas);
    const blob = await (await fetch(`data:image/webp;base64,${coverVariants.master || coverVariants.medium}`)).blob();
    if (coverPreviewUrl && coverPreviewUrl.startsWith("blob:")) URL.revokeObjectURL(coverPreviewUrl);
    coverPreviewUrl = URL.createObjectURL(blob);
    coverMode = "upload";
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
    const hasCover = !!(coverVariants || draft?.coverUrl);
    return !!(hasPdf && draft?.title?.trim() && hasCover && (draft.category || categorySuggestion?.category));
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
    draft.version = document.getElementById("libAdminVersion")?.value || draft.version || "1.0";
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
    renderLibraryShell();
    try {
      const libraryFiles = await buildLibraryFiles(draft.id);
      return await workerPost("api/admin/library/save", {
        publication: { ...draft, status: "draft" },
        libraryFiles,
        publish: false
      });
    } finally {
      busy = false;
      publishStep = 0;
      renderLibraryShell();
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
    if (!coverVariants && !draft.coverUrl) throw new Error("Cover fehlt");
    if (publishTarget === "live") {
      const ok = confirm("Diese Veröffentlichung in der Besucher-App (Live) veröffentlichen?\n\nDie Dateien werden in den Live-Bibliotheks-Pfad geschrieben.");
      if (!ok) throw new Error("Live-Veröffentlichung abgebrochen");
    }
    busy = true;
    publishStep = 1;
    renderLibraryShell();
    try {
      if (pdfFile) await analyzePdfFile(pdfFile);
      publishStep = 2;
      renderLibraryShell();
      if (coverMode === "template" || !coverVariants) await refreshCoverPreview();
      publishStep = 3;
      renderLibraryShell();
      await new Promise((resolve) => setTimeout(resolve, 0));
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
      editingPublicationId = "";
      await ensureLibraryLoaded(true);
      renderLibraryShell();
      return res;
    } finally {
      busy = false;
    }
  }

  function resetUploadForm() {
    editingPublicationId = "";
    draft = defaultDraft();
    pdfFile = null;
    pdfMeta = null;
    coverMode = "template";
    coverVariants = null;
    if (coverPreviewUrl && coverPreviewUrl.startsWith("blob:")) URL.revokeObjectURL(coverPreviewUrl);
    coverPreviewUrl = "";
    categorySuggestion = null;
    showCategoryEdit = false;
    successSlug = "";
    successTarget = "test";
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
    const steps = ["PDF wird geprüft", "Cover wird erstellt", "Daten werden gespeichert", "Vorschau wird veröffentlicht"];
    return `<div class="lib-admin-progress" role="status">
      <b>${publishStep >= 4 ? "Veröffentlichung abgeschlossen" : "Veröffentlichung wird vorbereitet …"}</b>
      <ol>${steps.map((label, i) => `<li class="${publishStep > i + 1 ? "is-done" : publishStep === i + 1 ? "is-active" : ""}">${esc(label)}</li>`).join("")}</ol>
    </div>`;
  }

  function renderPreviewPanel() {
    const cover = coverPreviewUrl
      ? `<img src="${esc(coverPreviewUrl)}" alt="Cover-Vorschau">`
      : `<div class="lib-admin-cover-placeholder">Cover-Vorschau erscheint nach PDF-Auswahl</div>`;
    return `<aside class="lib-admin-preview" aria-label="Live-Vorschau">
      <h3>Live-Vorschau</h3>
      <div class="lib-admin-preview-cover">${cover}</div>
      <div class="lib-admin-card-preview">
        <h4>${esc(draft?.title || "Titel der Veröffentlichung")}</h4>
        <span>${esc(draft?.category || categorySuggestion?.category || "Kategorie")}</span>
      </div>
    </aside>`;
  }

  function renderUploadForm() {
    if (!draft) draft = defaultDraft();
    const isEditing = !!editingPublicationId;
    const pdfReady = !!pdfMeta || (isEditing && !!draft.pdfUrl);
    return `<div class="lib-admin-layout" id="libAdminUploadSection">
      <div class="lib-admin-main">
        <header class="lib-admin-head">
          <h2>${isEditing ? "Veröffentlichung bearbeiten" : "Neue Veröffentlichung"}</h2>
          <p>${isEditing ? "Metadaten anpassen oder PDF ersetzen, dann erneut veröffentlichen." : "PDF hochladen — Test-Bibliothek oder Besucher-App (Live) veröffentlichen."}</p>
        </header>
        ${renderEditBanner()}

        <label class="lib-admin-drop ${dragActive ? "is-dragover" : ""}" id="libAdminDropZone">
          <input id="libAdminPdfInput" type="file" accept="application/pdf,.pdf">
          <b>${isEditing ? "Neues PDF wählen (ersetzt die bestehende Datei)" : "PDF hier hineinziehen"}</b>
          <span>${isEditing ? "optional — nur bei falschem PDF" : "oder Datei auswählen"}</span>
        </label>

        ${pdfReady ? `<p class="lib-admin-pdf-meta"><b>${esc(pdfMeta?.fileName || "Bestehende PDF")}</b><br>${pdfMeta?.pageCount ? `${esc(String(pdfMeta.pageCount))} Seiten · ` : ""}${esc(pdfMeta?.fileSize || draft.fileSize || "PDF bereit")}${pdfFile ? " · PDF geprüft" : editingPublicationId ? " · Ersetzen durch neues PDF möglich" : ""}</p>` : ""}

        <label class="lib-admin-field" id="libAdminTitleWrap" style="${pdfReady ? "" : "display:none"}">
          <span>Titel</span>
          <input id="libAdminTitle" type="text" value="${esc(draft.title)}" placeholder="Die Namen und Eigenschaften Allahs">
        </label>

        <section class="lib-admin-field" id="libAdminCoverWrap" style="${pdfReady ? "" : "display:none"}">
          <span>Cover</span>
          <div class="lib-admin-cover-options">
            <label class="lib-admin-cover-opt ${coverMode === "template" ? "is-active" : ""}"><input type="radio" name="libCoverMode" value="template" ${coverMode === "template" ? "checked" : ""}> Automatisch gestalten</label>
            <label class="lib-admin-cover-opt ${coverMode === "pdf-page" ? "is-active" : ""}"><input type="radio" name="libCoverMode" value="pdf-page" ${coverMode === "pdf-page" ? "checked" : ""} ${pdfFile ? "" : "disabled"}> Erste PDF-Seite verwenden</label>
            <label class="lib-admin-cover-opt ${coverMode === "upload" ? "is-active" : ""}"><input type="radio" name="libCoverMode" value="upload" ${coverMode === "upload" ? "checked" : ""}> Eigenes Cover hochladen</label>
          </div>
          <div class="lib-admin-cover-upload ${coverMode === "upload" ? "is-visible" : ""}">
            <label class="lib-admin-btn" style="display:inline-flex;align-items:center;cursor:pointer">Cover-Datei wählen<input id="libAdminCoverInput" type="file" accept="image/png,image/jpeg,image/webp,image/avif" hidden></label>
          </div>
        </section>

        ${pdfReady ? renderCategoryLine() : ""}
        ${pdfReady ? renderCategoryEdit() : ""}

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

        ${renderProgress()}

        <div class="lib-admin-actions" id="libAdminActions" style="${pdfReady ? "" : "display:none"}">
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
      ? `<span class="lib-admin-btn lib-admin-btn-live" style="opacity:.72;cursor:default">Live-Katalog aktualisiert</span>`
      : `<a class="lib-admin-btn lib-admin-btn-primary" href="/test/#bibliothek/${esc(successSlug)}" target="_blank" rel="noopener">In Test-Bibliothek ansehen</a>`;
    return `<div class="lib-admin-success">
      <p><b>${esc(headline)}</b></p>
      <div class="lib-admin-actions" style="margin-top:12px">
        ${viewBtn}
        <button class="lib-admin-btn" type="button" id="libAdminNewUpload">Weitere PDF hochladen</button>
      </div>
    </div>`;
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

  function publicationFilterMatch(pub, filter) {
    const status = String(pub.status || "");
    if (filter === "online") return ["published", "updated", "preparing"].includes(status);
    if (filter === "offline") return status === "draft";
    if (filter === "archived") return status === "archived";
    return true;
  }

  function getFilteredPublications() {
    const q = manageSearch.trim().toLowerCase();
    return (catalog.publications || [])
      .filter((p) => publicationFilterMatch(p, manageFilter))
      .filter((p) => {
        if (!q) return true;
        return [p.title, p.category, p.topic, p.slug, p.id].some((field) => String(field || "").toLowerCase().includes(q));
      })
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  }

  function countPublicationsByFilter(filter) {
    return (catalog.publications || []).filter((p) => publicationFilterMatch(p, filter)).length;
  }

  function openManageModal() {
    manageModalOpen = true;
    manageSearch = "";
    manageFilter = "all";
    const items = getFilteredPublications();
    manageSelectedId = items[0]?.id || "";
  }

  function closeManageModal() {
    manageModalOpen = false;
    manageSelectedId = "";
    manageSearch = "";
    manageFilter = "all";
  }

  function ensureManageSelection() {
    const items = getFilteredPublications();
    if (!items.length) {
      manageSelectedId = "";
      return;
    }
    if (!items.some((p) => p.id === manageSelectedId)) {
      manageSelectedId = items[0].id;
    }
  }

  function statusClassAdmin(status) {
    const s = String(status || "");
    if (s === "published" || s === "updated" || s === "preparing") return "is-online";
    if (s === "archived") return "is-archived";
    if (s === "draft") return "is-draft";
    return "";
  }

  function renderListActions(pub) {
    const status = String(pub.status || "");
    const actions = [];
    actions.push(`<button class="lib-admin-btn lib-admin-btn-primary" type="button" data-lib-edit="${esc(pub.id)}">Bearbeiten</button>`);
    if (status === "published" || status === "updated" || status === "preparing") {
      actions.push(`<button class="lib-admin-btn lib-admin-btn-warn" type="button" data-lib-unpublish="${esc(pub.id)}">Offline nehmen</button>`);
    }
    if (status !== "archived") {
      actions.push(`<button class="lib-admin-btn" type="button" data-lib-archive="${esc(pub.id)}">Archivieren</button>`);
    }
    actions.push(`<button class="lib-admin-btn lib-admin-btn-danger" type="button" data-lib-delete="${esc(pub.id)}">Löschen</button>`);
    return actions.join("");
  }

  function renderManageModalList() {
    const items = getFilteredPublications();
    if (!items.length) {
      return `<p class="lib-admin-manage-empty">Keine Veröffentlichungen für diesen Filter.</p>`;
    }
    return items.map((p) => `<button class="lib-admin-modal-row ${manageSelectedId === p.id ? "is-selected" : ""} ${statusClassAdmin(p.status)}" type="button" data-lib-select="${esc(p.id)}">
      <span class="lib-admin-modal-row-main">
        <b>${esc(p.title)}</b>
        <span>${esc(p.category || "—")} · v${esc(p.version || "")}${p.updatedAt ? ` · ${esc(p.updatedAt)}` : ""}</span>
      </span>
      <span class="lib-admin-status-pill">${esc(statusLabelAdmin(p.status))}</span>
    </button>`).join("");
  }

  function renderManageModalDetail() {
    const pub = (catalog.publications || []).find((p) => p.id === manageSelectedId);
    if (!pub) {
      return `<div class="lib-admin-modal-detail-empty">
        <p>Wähle links eine Veröffentlichung aus, um Details und Aktionen zu sehen.</p>
      </div>`;
    }
    const cover = pub.coverUrls?.medium || pub.coverUrl || "";
    return `<div class="lib-admin-modal-detail">
      <div class="lib-admin-modal-detail-head">
        ${cover ? `<div class="lib-admin-modal-cover"><img src="${esc(cover)}" alt=""></div>` : ""}
        <div class="lib-admin-modal-detail-copy">
          <h4>${esc(pub.title)}</h4>
          <p>${esc(pub.category || "—")} · ${esc(statusLabelAdmin(pub.status))} · v${esc(pub.version || "")}</p>
          <p>${pub.updatedAt ? `Aktualisiert: ${esc(pub.updatedAt)}` : ""}${pub.pageCount ? `${pub.updatedAt ? " · " : ""}${esc(String(pub.pageCount))} Seiten` : ""}${pub.fileSize ? ` · ${esc(pub.fileSize)}` : ""}</p>
        </div>
      </div>
      <div class="lib-admin-modal-detail-actions">${renderListActions(pub)}</div>
    </div>`;
  }

  function renderManageModal() {
    if (!manageModalOpen) return "";
    ensureManageSelection();
    const filters = [
      { id: "all", label: "Alle", count: countPublicationsByFilter("all") },
      { id: "online", label: "Online", count: countPublicationsByFilter("online") },
      { id: "offline", label: "Offline", count: countPublicationsByFilter("offline") },
      { id: "archived", label: "Archiv", count: countPublicationsByFilter("archived") }
    ];
    return `<div class="lib-admin-modal" id="libAdminManageModal" role="dialog" aria-modal="true" aria-labelledby="libAdminManageModalTitle">
      <button class="lib-admin-modal-backdrop" type="button" id="libAdminCloseManageBackdrop" aria-label="Schließen"></button>
      <div class="lib-admin-modal-panel">
        <header class="lib-admin-modal-head">
          <div>
            <h3 id="libAdminManageModalTitle">Veröffentlichungen verwalten</h3>
            <p>PDF auswählen, dann bearbeiten, offline nehmen, archivieren oder löschen.</p>
          </div>
          <button class="lib-admin-btn" type="button" id="libAdminCloseManage">Schließen</button>
        </header>
        <div class="lib-admin-modal-toolbar">
          <label class="lib-admin-modal-search">
            <span>Suchen</span>
            <input id="libAdminManageSearch" type="search" value="${esc(manageSearch)}" placeholder="Titel, Kategorie, Slug …" autocomplete="off">
          </label>
          <div class="lib-admin-filter-tabs" role="tablist" aria-label="Statusfilter">
            ${filters.map((f) => `<button class="lib-admin-filter-tab ${manageFilter === f.id ? "is-active" : ""}" type="button" data-lib-filter="${f.id}" role="tab" aria-selected="${manageFilter === f.id}">${esc(f.label)} <span>${f.count}</span></button>`).join("")}
          </div>
        </div>
        <div class="lib-admin-modal-body">
          <div class="lib-admin-modal-list" aria-label="Veröffentlichungsliste">${renderManageModalList()}</div>
          <div class="lib-admin-modal-detail-wrap" aria-label="Details und Aktionen">${renderManageModalDetail()}</div>
        </div>
      </div>
    </div>`;
  }

  function renderEditBanner() {
    if (!editingPublicationId || !draft) return "";
    return `<div class="lib-admin-edit-banner" id="libAdminEditPanel">
      <div>
        <b>Bearbeitung: ${esc(draft.title || "Veröffentlichung")}</b>
        <p>Metadaten ändern oder unten ein neues PDF wählen, um die Datei zu ersetzen. Anschließend erneut veröffentlichen.</p>
      </div>
      <button class="lib-admin-btn" type="button" id="libAdminCancelEdit">Bearbeitung abbrechen</button>
    </div>`;
  }

  function renderManagePanel() {
    const items = catalog.publications || [];
    const publishedCount = countPublicationsByFilter("online");
    const offlineCount = countPublicationsByFilter("offline");
    const archivedCount = countPublicationsByFilter("archived");
    const stats = items.length
      ? `${items.length} Eintrag${items.length === 1 ? "" : "e"} · ${publishedCount} online${offlineCount ? ` · ${offlineCount} offline` : ""}${archivedCount ? ` · ${archivedCount} archiviert` : ""}`
      : "Nach dem ersten Upload erscheinen PDFs in einer separaten Verwaltungsliste.";
    return `<section class="lib-admin-manage" id="libAdminManagePanel">
      <header class="lib-admin-manage-head">
        <div>
          <h2>Bestehende Veröffentlichungen</h2>
          <p>${stats}</p>
        </div>
        <div class="lib-admin-manage-actions">
          <button class="lib-admin-btn lib-admin-btn-primary" type="button" id="libAdminOpenManage" ${items.length ? "" : "disabled"}>Veröffentlichungen verwalten</button>
          <button class="lib-admin-btn" type="button" id="libAdminRefreshList">Aktualisieren</button>
        </div>
      </header>
      ${items.length ? `<p class="lib-admin-manage-hint">Die vollständige Liste öffnet sich in einem eigenen Fenster — auch bei vielen PDFs übersichtlich.</p>` : `<p class="lib-admin-manage-empty">Noch keine Veröffentlichungen im Katalog.</p>`}
    </section>`;
  }

  function renderLibraryTab() {
    try {
      if (loading && !loaded) {
        return `<section class="lib-admin"><p class="lib-admin-category">Bibliothek wird geladen…</p></section>`;
      }
      return `<section class="lib-admin">
      ${successSlug ? renderSuccess() : ""}
      ${renderManagePanel()}
      ${manageModalOpen ? renderManageModal() : ""}
      ${successSlug ? "" : renderUploadForm()}
    </section>`;
    } catch (e) {
      console.error("[Bibliothek Admin] renderLibraryTab:", e);
      return `<section class="lib-admin"><p class="lib-admin-category">Bibliothek-Fehler: ${esc(e.message || e)}</p></section>`;
    }
  }

  function scheduleCoverRefresh() {
    if (coverTimer) clearTimeout(coverTimer);
    coverTimer = setTimeout(async () => {
      readMainForm();
      if (coverMode !== "template" || !draft?.title) return;
      try {
        await refreshCoverPreview();
        renderLibraryShell();
      } catch (e) {
        console.warn("[Bibliothek Admin] Cover-Aktualisierung:", e);
      }
    }, 450);
  }

  function bindLibraryTab() {
    const panel = document.getElementById("panel");
    if (!panel || global.__darLibraryPanelDelegation) return;
    global.__darLibraryPanelDelegation = true;

    panel.addEventListener("dragover", (ev) => {
      if (!isBibliothekTab()) return;
      const dropZone = ev.target.closest("#libAdminDropZone");
      if (!dropZone) return;
      ev.preventDefault();
      dragActive = true;
      dropZone.classList.add("is-dragover");
    });

    panel.addEventListener("dragleave", (ev) => {
      const dropZone = ev.target.closest("#libAdminDropZone");
      if (!dropZone) return;
      dragActive = false;
      dropZone.classList.remove("is-dragover");
    });

    panel.addEventListener("drop", async (ev) => {
      if (!isBibliothekTab()) return;
      const dropZone = ev.target.closest("#libAdminDropZone");
      if (!dropZone) return;
      ev.preventDefault();
      dragActive = false;
      dropZone.classList.remove("is-dragover");
      const file = ev.dataTransfer?.files?.[0];
      if (!file) return;
      try {
        await onPdfSelected(file);
        renderLibraryShell();
      } catch (e) {
        notify(e.message || "PDF konnte nicht gelesen werden");
      }
    });

    panel.addEventListener("change", async (ev) => {
      if (!isBibliothekTab()) return;
      const target = ev.target;
      if (!(target instanceof HTMLElement)) return;

      if (target.id === "libAdminPdfInput") {
        const file = target.files?.[0];
        if (!file) return;
        try {
          await onPdfSelected(file);
          renderLibraryShell();
        } catch (e) {
          notify(e.message || "PDF konnte nicht gelesen werden");
        }
        return;
      }

      if (target instanceof HTMLInputElement && target.name === "libCoverMode") {
        coverMode = target.value;
        readMainForm();
        try {
          if (coverMode === "upload") {
            renderLibraryShell();
            return;
          }
          await refreshCoverPreview();
          renderLibraryShell();
        } catch (e) {
          notify(e.message || "Cover konnte nicht erstellt werden");
          coverMode = "template";
          renderLibraryShell();
        }
        return;
      }

      if (target.id === "libAdminCoverInput") {
        const file = target.files?.[0];
        if (!file) return;
        try {
          await onCoverUpload(file);
          renderLibraryShell();
        } catch (e) {
          notify(e.message || "Cover-Upload fehlgeschlagen");
        }
      }
    });

    panel.addEventListener("input", (ev) => {
      if (!isBibliothekTab()) return;
      const target = ev.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.id === "libAdminTitle") scheduleCoverRefresh();
      if (target.id === "libAdminManageSearch") {
        manageSearch = target.value || "";
        if (manageSearchTimer) clearTimeout(manageSearchTimer);
        manageSearchTimer = setTimeout(() => {
          ensureManageSelection();
          renderLibraryShell();
          const input = document.getElementById("libAdminManageSearch");
          if (input) {
            input.focus();
            const len = input.value.length;
            input.setSelectionRange(len, len);
          }
        }, 180);
      }
    });

    panel.addEventListener("click", async (ev) => {
      if (!isBibliothekTab()) return;
      const target = ev.target instanceof HTMLElement ? ev.target : null;
      if (!target) return;

      if (target.closest("#libAdminChangeCategory")) {
        ev.preventDefault();
        showCategoryEdit = true;
        renderLibraryShell();
        return;
      }

      const btn = target.closest("button");
      if (!btn) return;

      if (btn.id === "libAdminSaveDraft") {
        try {
          await saveDraft();
          notify("Entwurf gespeichert");
          await ensureLibraryLoaded(true);
          renderLibraryShell();
        } catch (e) {
          notify(e.message || "Speichern fehlgeschlagen");
        }
        return;
      }

      if (btn.id === "libAdminPublish") {
        try {
          await publishDraft("test");
          notify("Veröffentlicht (Test)");
          renderLibraryShell();
        } catch (e) {
          notify(e.message || "Veröffentlichung fehlgeschlagen");
          publishStep = 0;
          renderLibraryShell();
        }
        return;
      }

      if (btn.id === "libAdminPublishLive") {
        try {
          await publishDraft("live");
          notify("Veröffentlicht (Besucher-App / Live)");
          renderLibraryShell();
        } catch (e) {
          notify(e.message || "Live-Veröffentlichung fehlgeschlagen");
          publishStep = 0;
          renderLibraryShell();
        }
        return;
      }

      if (btn.id === "libAdminNewUpload") {
        resetUploadForm();
        renderLibraryShell();
        return;
      }

      if (btn.id === "libAdminRefreshList") {
        try {
          await ensureLibraryLoaded(true);
          notify("Liste aktualisiert");
          renderLibraryShell();
        } catch (e) {
          notify(e.message || "Liste konnte nicht geladen werden");
        }
        return;
      }

      if (btn.id === "libAdminOpenManage") {
        openManageModal();
        renderLibraryShell();
        return;
      }

      if (btn.id === "libAdminCloseManage" || btn.id === "libAdminCloseManageBackdrop") {
        closeManageModal();
        renderLibraryShell();
        return;
      }

      if (btn.id === "libAdminCancelEdit") {
        resetUploadForm();
        renderLibraryShell();
        return;
      }

      const filter = btn.getAttribute("data-lib-filter");
      if (filter) {
        manageFilter = filter;
        ensureManageSelection();
        renderLibraryShell();
        return;
      }

      const selectId = btn.getAttribute("data-lib-select");
      if (selectId) {
        manageSelectedId = selectId;
        renderLibraryShell();
        return;
      }

      const editId = btn.getAttribute("data-lib-edit");
      if (editId) {
        try {
          await loadPublicationForEdit(editId);
          closeManageModal();
          renderLibraryShell();
        } catch (e) {
          notify(e.message || "Bearbeitung konnte nicht gestartet werden");
        }
        return;
      }

      const archiveId = btn.getAttribute("data-lib-archive");
      if (archiveId) {
        if (!confirm("Veröffentlichung archivieren? Sie wird für Besucher ausgeblendet, bleibt aber im Admin erhalten.")) return;
        try {
          await workerPost("api/admin/library/delete", { id: archiveId, action: "archive" });
          if (editingPublicationId === archiveId) resetUploadForm();
          if (manageSelectedId === archiveId) manageSelectedId = "";
          notify("Archiviert");
          await ensureLibraryLoaded(true);
          ensureManageSelection();
          renderLibraryShell();
        } catch (e) {
          notify(e.message || "Archivieren fehlgeschlagen");
        }
        return;
      }

      const unpublishId = btn.getAttribute("data-lib-unpublish");
      if (unpublishId) {
        if (!confirm("Veröffentlichung offline nehmen? Sie verschwindet von der Bibliotheksseite und kann bearbeitet sowie erneut veröffentlicht werden.")) return;
        try {
          await workerPost("api/admin/library/delete", { id: unpublishId, action: "unpublish" });
          if (editingPublicationId === unpublishId) resetUploadForm();
          if (manageSelectedId === unpublishId) manageSelectedId = "";
          notify("Offline genommen — Entwurf");
          await ensureLibraryLoaded(true);
          ensureManageSelection();
          renderLibraryShell();
        } catch (e) {
          notify(e.message || "Offline nehmen fehlgeschlagen");
        }
        return;
      }

      const deleteId = btn.getAttribute("data-lib-delete");
      if (deleteId) {
        if (!confirm("Veröffentlichung endgültig löschen? PDF, Cover und Eintrag werden entfernt.")) return;
        try {
          await workerPost("api/admin/library/delete", { id: deleteId, action: "delete" });
          if (editingPublicationId === deleteId) resetUploadForm();
          if (manageSelectedId === deleteId) manageSelectedId = "";
          notify("Gelöscht");
          await ensureLibraryLoaded(true);
          ensureManageSelection();
          renderLibraryShell();
        } catch (e) {
          notify(e.message || "Löschen fehlgeschlagen");
        }
      }
    });
  }

  function closeManageModalIfOpen() {
    if (!manageModalOpen) return;
    closeManageModal();
    renderLibraryShell();
  }

  global.DARLibraryAdmin = {
    ensureLibraryLoaded,
    renderLibraryTab,
    bindLibraryTab,
    isLibraryBusy,
    hasLibraryWork,
    closeManageModalIfOpen
  };
})(window);
