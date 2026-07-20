/**
 * DAR AL TAWḤĪD — Bibliothek verwalten (Admin)
 */
(function (global) {
  "use strict";

  let catalog = { version: 1, publications: [] };
  let catalogSha = "";
  let loaded = false;
  let loading = false;
  let statusMsg = "";
  let draft = null;
  let pdfFile = null;
  let pdfMeta = null;
  let coverMode = "template";
  let coverPreviewUrl = "";
  let coverVariants = null;
  let categorySuggestion = null;
  let previewTheme = "dark";
  let busy = false;

  const PDFJS_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
  const PDFJS_WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  const CATEGORIES = [
    "Tawḥīd", "ʿAqīdah", "al-Asmāʾ waṣ-Ṣifāt", "Qurʾān", "Sunnah",
    "Schirk", "Kufr und Ṭāghūt", "Sünden und Reue", "Gebet", "Fiqh",
    "Familie", "Manhaj", "Widerlegungen"
  ];

  function esc(s) {
    return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function slugify(value) {
    return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
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

  function workerGet(path) {
    return workerGetRequest(path, { admin: true });
  }

  async function ensureLibraryLoaded(force) {
    if (loaded && !force) return catalog;
    if (loading) return catalog;
    loading = true;
    statusMsg = "Bibliothek wird geladen…";
    try {
      const res = await workerGet("library");
      catalog = res.catalog || { version: 1, publications: [] };
      catalogSha = res.sha || "";
      loaded = true;
      statusMsg = `${(catalog.publications || []).length} Veröffentlichungen geladen`;
    } catch (e) {
      statusMsg = `Laden fehlgeschlagen: ${e.message || e}`;
    } finally {
      loading = false;
    }
    return catalog;
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
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function analyzePdfFile(file) {
    if (!file || file.type !== "application/pdf") throw new Error("Nur PDF-Dateien sind erlaubt");
    if (!file.size) throw new Error("PDF ist leer");
    if (file.size > 80 * 1024 * 1024) throw new Error("PDF ist zu groß (max. 80 MB)");
    const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
    if (String.fromCharCode(...head) !== "%PDF-") throw new Error("Datei ist keine gültige PDF");
    await ensurePdfJs();
    const data = await file.arrayBuffer();
    const doc = await global.pdfjsLib.getDocument({ data }).promise;
    const meta = await doc.getMetadata().catch(() => ({}));
    const info = meta?.info || {};
    return {
      pageCount: doc.numPages,
      title: String(info.Title || file.name.replace(/\.pdf$/i, "")).trim(),
      author: String(info.Author || "").trim(),
      fileSize: formatBytes(file.size),
      fileHash: await hashFile(file)
    };
  }

  async function suggestCategory(text) {
    try {
      const res = await workerPost("library/suggest", { text });
      categorySuggestion = res.suggestion || null;
    } catch (e) {
      categorySuggestion = null;
    }
    return categorySuggestion;
  }

  function nextPublicationId(base) {
    const slug = slugify(base || "publikation");
    let n = 1;
    const ids = new Set((catalog.publications || []).map((p) => p.id));
    while (ids.has(`${slug}-${String(n).padStart(3, "0")}`)) n += 1;
    return `${slug}-${String(n).padStart(3, "0")}`;
  }

  function bumpVersion(version) {
    const parts = String(version || "1.0").split(".").map((n) => parseInt(n, 10) || 0);
    if (parts.length < 2) parts.push(0);
    parts[parts.length - 1] += 1;
    return parts.join(".");
  }

  async function onNewVersionPdf(file) {
    if (!draft?.id) throw new Error("Zuerst Veröffentlichung auswählen");
    pdfFile = file;
    pdfMeta = await analyzePdfFile(file);
    draft.pageCount = pdfMeta.pageCount;
    draft.fileSize = pdfMeta.fileSize;
    draft.fileHash = pdfMeta.fileHash;
    draft.version = bumpVersion(draft.version);
    draft.status = "updated";
    draft.updatedAt = new Date().toISOString().slice(0, 10);
    statusMsg = `Neue Version ${draft.version}: ${pdfMeta.pageCount} Seiten`;
  }

  async function onPdfSelected(file) {
    pdfFile = file;
    pdfMeta = await analyzePdfFile(file);
    if (!draft) draft = defaultDraft();
    if (!draft.id) draft.id = nextPublicationId(slugify(pdfMeta.title));
    if (!draft.slug) draft.slug = slugify(pdfMeta.title || draft.id);
    if (!draft.title) draft.title = pdfMeta.title;
    draft.pageCount = pdfMeta.pageCount;
    draft.fileSize = pdfMeta.fileSize;
    draft.fileHash = pdfMeta.fileHash;
    await suggestCategory([draft.title, draft.description, pdfMeta.title, pdfMeta.author].join(" "));
    if (categorySuggestion?.category && !draft.category) {
      draft.category = categorySuggestion.category;
      draft.topic = categorySuggestion.topic || "";
      draft.series = categorySuggestion.topic || categorySuggestion.category || "";
    }
    if (coverMode === "template") await generateTemplateCover();
    statusMsg = `PDF analysiert: ${pdfMeta.pageCount} Seiten`;
  }

  async function generateTemplateCover() {
    if (!global.DARLibraryCoverGen || !draft) return;
    coverVariants = await global.DARLibraryCoverGen.generateCoverVariants(draft);
    const blob = await (await fetch(`data:image/webp;base64,${coverVariants.medium}`)).blob();
    if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    coverPreviewUrl = URL.createObjectURL(blob);
  }

  async function usePdfFirstPageCover() {
    if (!pdfFile || !global.DARLibraryCoverGen) throw new Error("PDF fehlt");
    await ensurePdfJs();
    coverVariants = await global.DARLibraryCoverGen.renderPdfFirstPageCover(pdfFile, draft);
    const blob = await (await fetch(`data:image/webp;base64,${coverVariants.medium}`)).blob();
    if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    coverPreviewUrl = URL.createObjectURL(blob);
    coverMode = "pdf-page";
  }

  async function onCoverUpload(file) {
    if (!file || !/^image\/(png|jpeg|jpg|webp|avif)$/i.test(file.type)) throw new Error("Cover: PNG, JPEG, WebP oder AVIF erlaubt");
    const img = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 1200;
    const ctx = canvas.getContext("2d");
    const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.fillStyle = "#101820";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    coverVariants = await global.DARLibraryCoverGen.generateCoverVariantsFromCanvas(canvas);
    const blob = await (await fetch(`data:image/webp;base64,${coverVariants.medium}`)).blob();
    if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
    coverPreviewUrl = URL.createObjectURL(blob);
    coverMode = "upload";
  }

  function buildLibraryFiles(id) {
    const files = [];
    if (pdfFile) {
      return pdfFile.arrayBuffer().then((buf) => {
        let binary = "";
        const bytes = new Uint8Array(buf);
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        files.push({
          path: `test/assets/library/pdfs/${id}-v${String(draft.version || "1.0").replace(/\./g, "-")}.pdf`,
          contentBase64: btoa(binary)
        });
        if (coverVariants) {
          files.push({ path: `test/assets/library/covers/${id}/cover-small.webp`, contentBase64: coverVariants.small });
          files.push({ path: `test/assets/library/covers/${id}/cover-medium.webp`, contentBase64: coverVariants.medium });
          files.push({ path: `test/assets/library/covers/${id}/cover-master.webp`, contentBase64: coverVariants.master });
        }
        return files;
      });
    }
    if (coverVariants) {
      files.push({ path: `test/assets/library/covers/${id}/cover-small.webp`, contentBase64: coverVariants.small });
      files.push({ path: `test/assets/library/covers/${id}/cover-medium.webp`, contentBase64: coverVariants.medium });
      files.push({ path: `test/assets/library/covers/${id}/cover-master.webp`, contentBase64: coverVariants.master });
    }
    return Promise.resolve(files);
  }

  async function saveDraft() {
    if (!draft?.title) throw new Error("Titel fehlt");
    if (!draft.id) draft.id = nextPublicationId(draft.slug || draft.title);
    if (!draft.slug) draft.slug = slugify(draft.title);
    busy = true;
    try {
      const libraryFiles = await buildLibraryFiles(draft.id);
      const res = await workerPost("library/save", { publication: { ...draft, status: "draft" }, libraryFiles, publish: false });
      if (res.warnings?.length) statusMsg = res.warnings.join(" · ");
      else statusMsg = "Entwurf gespeichert";
      await ensureLibraryLoaded(true);
      return res;
    } finally {
      busy = false;
    }
  }

  async function publishDraft() {
    if (!draft?.title || !draft?.category) throw new Error("Titel und Kategorie sind erforderlich");
    if (!pdfFile && !draft.pdfUrl) throw new Error("PDF fehlt");
    if (!coverVariants && !draft.coverUrl) throw new Error("Cover fehlt");
    busy = true;
    try {
      const libraryFiles = await buildLibraryFiles(draft.id);
      const res = await workerPost("library/save", {
        publication: { ...draft, status: draft.status === "updated" ? "updated" : "published", isNew: !!draft.isNew },
        libraryFiles,
        publish: true
      });
      statusMsg = "In der Test-Bibliothek veröffentlicht";
      await ensureLibraryLoaded(true);
      return res;
    } finally {
      busy = false;
    }
  }

  function renderPreviewCard() {
    if (!draft) return "";
    const cover = coverPreviewUrl ? `<img src="${esc(coverPreviewUrl)}" alt="" style="width:100%;aspect-ratio:2/3;object-fit:cover;border-radius:10px">` : `<div style="aspect-ratio:2/3;border-radius:10px;background:#1a2230;display:grid;place-items:center;color:#d8c08e;padding:12px;text-align:center">${esc(draft.transliteratedTitle || draft.title)}</div>`;
    return `<article style="max-width:180px"><div>${cover}</div><h4 style="margin:8px 0 4px;font-size:13px;line-height:1.35">${esc(draft.title)}</h4><div style="font-size:11px;color:#8f856f">${esc(draft.category || "—")}</div></article>`;
  }

  function renderEditor() {
    if (!draft) draft = defaultDraft();
    const suggest = categorySuggestion;
    return `<section class="admin-card">
      <h3>Neue Veröffentlichung / Bearbeiten</h3>
      <p class="admin-note">Upload nur für Test-Bibliothek. Keine automatische Live-Veröffentlichung.</p>
      <div class="admin-form-grid">
        <label>PDF hochladen<input id="libAdminPdfInput" type="file" accept="application/pdf"></label>
        <label>Titel<input id="libAdminTitle" value="${esc(draft.title)}"></label>
        <label>Transliteration<input id="libAdminTransTitle" value="${esc(draft.transliteratedTitle)}"></label>
        <label>Untertitel<input id="libAdminSubtitle" value="${esc(draft.subtitle)}"></label>
        <label>Kategorie<select id="libAdminCategory">${CATEGORIES.map((c)=>`<option value="${esc(c)}" ${draft.category===c?"selected":""}>${esc(c)}</option>`).join("")}</select></label>
        <label>Themenbereich<input id="libAdminTopic" value="${esc(draft.topic)}"></label>
        <label>Reihe<input id="libAdminSeries" value="${esc(draft.series)}"></label>
        <label>Version<input id="libAdminVersion" value="${esc(draft.version)}"></label>
        <label>ID<input id="libAdminId" value="${esc(draft.id)}" placeholder="automatisch"></label>
        <label>Slug<input id="libAdminSlug" value="${esc(draft.slug)}" placeholder="automatisch"></label>
      </div>
      ${suggest?.confidence && suggest.confidence !== "none" ? `<p class="admin-note">Vorschlag: ${esc(suggest.category)} · ${esc(suggest.topic)} (${esc(suggest.confidence)})</p>` : suggest?.confidence === "none" ? `<p class="admin-note">Thema konnte nicht sicher bestimmt werden. Bitte Kategorie manuell auswählen.</p>` : ""}
      <label>Beschreibung<textarea id="libAdminDescription" rows="4">${esc(draft.description)}</textarea></label>
      <label>Schlagwörter (kommagetrennt)<input id="libAdminTags" value="${esc((draft.tags||[]).join(", "))}"></label>
      <div class="admin-inline-checks">
        <label><input id="libAdminIsNew" type="checkbox" ${draft.isNew?"checked":""}> Neu</label>
        <label><input id="libAdminIsRecommended" type="checkbox" ${draft.isRecommended?"checked":""}> Empfohlen</label>
        <label><input id="libAdminDownload" type="checkbox" ${draft.downloadEnabled?"checked":""}> Download</label>
        <label><input id="libAdminOffline" type="checkbox" ${draft.offlineEnabled?"checked":""}> Offline</label>
      </div>
      <div class="admin-action-row">
        <button class="admin-btn" type="button" id="libAdminCoverTemplate">Automatische Cover-Vorlage</button>
        <button class="admin-btn" type="button" id="libAdminCoverPdfPage" ${pdfFile?"":"disabled"}>Erste PDF-Seite</button>
        <label class="admin-btn" style="display:inline-flex;align-items:center;gap:8px;cursor:pointer">Cover hochladen<input id="libAdminCoverInput" type="file" accept="image/png,image/jpeg,image/webp,image/avif" hidden></label>
        ${draft.id ? `<label class="admin-btn" style="display:inline-flex;align-items:center;gap:8px;cursor:pointer">Neue Version hochladen<input id="libAdminVersionPdfInput" type="file" accept="application/pdf" hidden></label>` : ""}
      </div>
      ${pdfMeta ? `<p class="admin-note">PDF: ${esc(pdfMeta.pageCount)} Seiten · ${esc(pdfMeta.fileSize)}</p>` : ""}
      <div class="admin-action-row">
        <button class="admin-btn" type="button" id="libAdminSaveDraft" ${busy?"disabled":""}>Entwurf speichern</button>
        <button class="admin-btn admin-btn-primary" type="button" id="libAdminPublish" ${busy?"disabled":""}>In Test-Bibliothek veröffentlichen</button>
      </div>
      <h4>Vorschau (Smartphone-Karte)</h4>
      <div data-theme-preview="${esc(previewTheme)}">${renderPreviewCard()}</div>
    </section>`;
  }

  function renderList() {
    const items = (catalog.publications || []).slice().sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    if (!items.length) return `<p class="admin-note">Noch keine Veröffentlichungen.</p>`;
    return `<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Titel</th><th>Kategorie</th><th>Status</th><th>Version</th><th></th></tr></thead><tbody>${items.map((p)=>`<tr><td>${esc(p.title)}</td><td>${esc(p.category)}</td><td>${esc(p.status)}</td><td>${esc(p.version||"")}</td><td><button class="admin-btn admin-btn-small" type="button" data-lib-edit="${esc(p.id)}">Bearbeiten</button> <button class="admin-btn admin-btn-small" type="button" data-lib-archive="${esc(p.id)}">Archivieren</button> <button class="admin-btn admin-btn-small" type="button" data-lib-delete="${esc(p.id)}">Löschen</button></td></tr>`).join("")}</tbody></table></div>`;
  }

  function renderLibraryTab() {
    return `<section class="admin-stack">
      <header class="admin-head"><div><h2>Bibliothek verwalten</h2><p>PDF-Veröffentlichungen für die Test-Bibliothek hochladen, prüfen und veröffentlichen.</p></div><button class="admin-btn" type="button" id="libAdminReload">Aktualisieren</button></header>
      <p class="admin-note">${esc(statusMsg || "")}</p>
      ${renderEditor()}
      <section class="admin-card"><h3>Veröffentlichungen</h3>${renderList()}</section>
    </section>`;
  }

  function readForm() {
    if (!draft) draft = defaultDraft();
    draft.title = document.getElementById("libAdminTitle")?.value || "";
    draft.transliteratedTitle = document.getElementById("libAdminTransTitle")?.value || "";
    draft.subtitle = document.getElementById("libAdminSubtitle")?.value || "";
    draft.category = document.getElementById("libAdminCategory")?.value || "";
    draft.topic = document.getElementById("libAdminTopic")?.value || "";
    draft.series = document.getElementById("libAdminSeries")?.value || "";
    draft.version = document.getElementById("libAdminVersion")?.value || "1.0";
    draft.id = document.getElementById("libAdminId")?.value || draft.id;
    draft.slug = document.getElementById("libAdminSlug")?.value || slugify(draft.title);
    draft.description = document.getElementById("libAdminDescription")?.value || "";
    draft.tags = String(document.getElementById("libAdminTags")?.value || "").split(",").map((t)=>t.trim()).filter(Boolean);
    draft.isNew = !!document.getElementById("libAdminIsNew")?.checked;
    draft.isRecommended = !!document.getElementById("libAdminIsRecommended")?.checked;
    draft.downloadEnabled = !!document.getElementById("libAdminDownload")?.checked;
    draft.offlineEnabled = !!document.getElementById("libAdminOffline")?.checked;
    draft.updatedAt = new Date().toISOString().slice(0, 10);
  }

  function bindLibraryTab() {
    document.getElementById("libAdminReload")?.addEventListener("click", () => ensureLibraryLoaded(true).then(() => renderShell()));
    document.getElementById("libAdminPdfInput")?.addEventListener("change", async (ev) => {
      const file = ev.target.files?.[0];
      if (!file) return;
      try {
        await onPdfSelected(file);
        renderShell();
      } catch (e) {
        statusMsg = e.message || "PDF-Analyse fehlgeschlagen";
        renderShell();
      }
    });
    document.getElementById("libAdminVersionPdfInput")?.addEventListener("change", async (ev) => {
      const file = ev.target.files?.[0];
      if (!file) return;
      try {
        await onNewVersionPdf(file);
        renderShell();
      } catch (e) {
        statusMsg = e.message || "Versions-Upload fehlgeschlagen";
        renderShell();
      }
    });
    document.getElementById("libAdminCoverTemplate")?.addEventListener("click", async () => {
      readForm();
      try {
        await generateTemplateCover();
        renderShell();
      } catch (e) {
        statusMsg = e.message || "Cover-Erstellung fehlgeschlagen";
        renderShell();
      }
    });
    document.getElementById("libAdminCoverPdfPage")?.addEventListener("click", async () => {
      readForm();
      try {
        await usePdfFirstPageCover();
        renderShell();
      } catch (e) {
        statusMsg = e.message || "Erste Seite konnte nicht verwendet werden";
        renderShell();
      }
    });
    document.getElementById("libAdminCoverInput")?.addEventListener("change", async (ev) => {
      const file = ev.target.files?.[0];
      if (!file) return;
      try {
        await onCoverUpload(file);
        renderShell();
      } catch (e) {
        statusMsg = e.message || "Cover-Upload fehlgeschlagen";
        renderShell();
      }
    });
    document.getElementById("libAdminSaveDraft")?.addEventListener("click", async () => {
      readForm();
      try {
        await saveDraft();
        toast("Entwurf gespeichert");
        renderShell();
      } catch (e) {
        statusMsg = e.message || "Speichern fehlgeschlagen";
        toast(statusMsg);
        renderShell();
      }
    });
    document.getElementById("libAdminPublish")?.addEventListener("click", async () => {
      readForm();
      try {
        await publishDraft();
        toast("Veröffentlicht (Test)");
        renderShell();
      } catch (e) {
        statusMsg = e.message || "Veröffentlichung fehlgeschlagen";
        toast(statusMsg);
        renderShell();
      }
    });
    document.querySelectorAll("[data-lib-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-lib-edit");
        const pub = (catalog.publications || []).find((p) => p.id === id);
        if (!pub) return;
        draft = { ...pub };
        pdfFile = null;
        pdfMeta = pub.pageCount ? { pageCount: pub.pageCount, fileSize: pub.fileSize || "" } : null;
        coverVariants = null;
        coverPreviewUrl = pub.coverUrls?.medium || pub.coverUrl || "";
        renderShell();
      });
    });
    document.querySelectorAll("[data-lib-archive]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-lib-archive");
        if (!confirm("Veröffentlichung archivieren?")) return;
        try {
          await workerPost("library/delete", { id });
          toast("Archiviert");
          await ensureLibraryLoaded(true);
          renderShell();
        } catch (e) {
          toast(e.message || "Archivieren fehlgeschlagen");
        }
      });
    });
    document.querySelectorAll("[data-lib-delete]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-lib-delete");
        const pub = (catalog.publications || []).find((p) => p.id === id);
        if (!confirm(`Veröffentlichung „${pub?.title || id}“ endgültig löschen?\n\nDieser Schritt kann nicht rückgängig gemacht werden.`)) return;
        if (!confirm("Wirklich endgültig löschen?")) return;
        try {
          await workerPost("library/delete", { id, hard: true });
          toast("Gelöscht");
          await ensureLibraryLoaded(true);
          renderShell();
        } catch (e) {
          toast(e.message || "Löschen fehlgeschlagen");
        }
      });
    });
  }

  global.DARLibraryAdmin = {
    ensureLibraryLoaded,
    renderLibraryTab,
    bindLibraryTab
  };
})(window);
