/**
 * DAR AL TAWḤID — Feed-Hintergrundbilder (Admin)
 */
(function (global) {
  "use strict";

  let bgIndex = { version: 1, cacheVersion: 1, items: [] };
  let bgSha = "";
  let bgPath = "";
  let bgLoaded = false;
  let bgLoading = false;
  let bgError = "";
  let bgStaging = true;
  let editingBgId = null;
  let bgFilter = "all";
  let bgSearch = "";
  let bgSyncStatus = null;
  let bgSyncLoading = false;
  let bgAutoSyncStarted = false;

  const CATEGORIES = [
    ["nature", "Natur"],
    ["quran", "Qurʾān"],
    ["dua", "Duʿāʾ"],
    ["knowledge", "Wissen"],
    ["tawhid", "Tawḥīd"],
    ["aqidah", "ʿAqīdah"],
    ["adab", "Adab"],
    ["akhirah", "Ākhirah"],
    ["mosque", "Moschee"],
    ["books", "Bücher"],
    ["abstract", "Abstrakt"],
    ["gradients", "Gradient"]
  ];

  const TAGS = [
    "himmel", "berge", "wolken", "wasser", "wüste", "nebel", "sonnenaufgang", "sonnenuntergang",
    "bücher", "pergament", "tinte", "feder", "mushaf", "moschee", "minarett", "kuppel", "muster",
    "kalligraphie", "tawhid", "aqidah", "dua", "quran", "adab", "hadith", "sunnah", "akhirah",
    "zuhd", "tazkiyah", "sabr", "ilm", "ruhe", "pflanzen", "regen", "licht", "stark", "klarheit"
  ];

  const ALLOWED_FOR = [
    ["feed", "Feed"],
    ["story", "Storys"],
    ["featured", "Neu im Fokus"],
    ["quran-rec", "Qurʾān-Empfehlung"],
    ["dua-rec", "Duʿāʾ-Empfehlung"],
    ["post-card", "Beitragskarte"],
    ["category-card", "Kategorie-Karte"]
  ];

  function esc(s) {
    return global.esc ? global.esc(s) : String(s ?? "");
  }

  function toast(msg) {
    if (typeof global.toast === "function") global.toast(msg);
  }

  async function workerGet(path) {
    if (typeof global.workerGetRequest !== "function") throw new Error("Worker GET fehlt");
    return global.workerGetRequest(path, { admin: true });
  }

  async function workerPost(path, payload) {
    if (typeof global.workerPostRequest !== "function") throw new Error("Worker POST fehlt");
    return global.workerPostRequest(path, payload);
  }

  function readFileAsBase64(file) {
    if (typeof global.readFileAsBase64 === "function") return global.readFileAsBase64(file);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || "");
        const idx = result.indexOf(",");
        resolve(idx >= 0 ? result.slice(idx + 1) : result);
      };
      reader.onerror = () => reject(reader.error || new Error("Lesefehler"));
      reader.readAsDataURL(file);
    });
  }

  function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Bild konnte nicht geladen werden"));
      };
      img.src = url;
    });
  }

  function canvasToBase64(canvas, type, quality) {
    const dataUrl = canvas.toDataURL(type || "image/webp", quality == null ? 0.86 : quality);
    const idx = dataUrl.indexOf(",");
    return idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl;
  }

  async function buildVariantsFromFile(file) {
    const img = await loadImageFromFile(file);
    const srcW = img.naturalWidth || img.width;
    const srcH = img.naturalHeight || img.height;
    if (!srcW || !srcH) throw new Error("Ungültige Bildgröße");

    function drawCover(w, h) {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      const scale = Math.max(w / srcW, h / srcH);
      const dw = srcW * scale;
      const dh = srcH * scale;
      const dx = (w - dw) / 2;
      const dy = (h - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
      return canvas;
    }

    const full = drawCover(1080, 1350);
    const mobile = drawCover(720, 960);
    const thumb = drawCover(400, 400);
    return {
      full: canvasToBase64(full, "image/webp", 0.88),
      mobile: canvasToBase64(mobile, "image/webp", 0.85),
      thumb: canvasToBase64(thumb, "image/webp", 0.82)
    };
  }

  function bgStatus(item) {
    if (!item) return "unbekannt";
    if (item.status === "deleted") return "gelöscht";
    if (item.status === "disabled") return "deaktiviert";
    if (item.status === "draft") return "Entwurf";
    if (item.approved && item.status === "active") return "freigegeben";
    if (item.securityStatus === "blocked") return "gesperrt";
    return String(item.status || "Entwurf");
  }

  function statusPill(st) {
    const cls = st === "freigegeben" ? "live" : st === "Entwurf" ? "draft" : st === "deaktiviert" ? "expired" : "removed";
    return `<span class="news-pill ${cls}">${esc(st)}</span>`;
  }

  function filteredItems() {
    const q = bgSearch.trim().toLowerCase();
    return (bgIndex.items || [])
      .filter((item) => {
        if (!item || item.status === "deleted") return bgFilter === "deleted";
        if (bgFilter === "approved" && !(item.approved && item.status === "active")) return false;
        if (bgFilter === "blocked" && item.securityStatus !== "blocked") return false;
        if (bgFilter === "auto" && !item.autoSynced) return false;
        if (bgFilter === "draft" && item.status !== "draft") return false;
        if (bgFilter === "disabled" && item.status !== "disabled") return false;
        if (bgFilter === "all" && item.status === "deleted") return false;
        if (!q) return true;
        const hay = `${item.id} ${item.title} ${item.category} ${(item.tags || []).join(" ")}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0));
  }

  function editingItem() {
    if (!editingBgId) return null;
    return (bgIndex.items || []).find((x) => String(x.id) === String(editingBgId)) || null;
  }

  function defaultDraft() {
    return {
      id: "",
      title: "",
      category: "nature",
      tags: [],
      topics: [],
      allowedFor: ["feed"],
      priority: 5,
      status: "draft",
      securityStatus: "unchecked",
      approved: false,
      active: false,
      containsHumans: false,
      containsAnimals: false,
      containsFaces: false,
      overlayHint: "dark",
      focusPoint: { x: 50, y: 50 },
      alt: "",
      adminNote: "",
      dominantColor: ""
    };
  }

  async function ensureSyncStatus(force) {
    if (bgSyncLoading && !force) return bgSyncStatus;
    bgSyncLoading = true;
    try {
      bgSyncStatus = await workerGet(`api/admin/feed-backgrounds/sync/status?staging=${bgStaging ? "1" : "0"}`);
    } catch (e) {
      bgSyncStatus = { ok: false, error: e.message || String(e) };
    } finally {
      bgSyncLoading = false;
    }
    return bgSyncStatus;
  }

  async function maybeAutoSyncInBackground() {
    if (bgAutoSyncStarted) return;
    const st = bgSyncStatus || {};
    const pool = st.pool || {};
    const settings = st.settings || {};
    const refillBelow = Number(settings.refillBelow) || 40;
    const approved = Number(pool.approved) || 0;
    if (approved >= refillBelow) return;
    if (st.apiConfigured === false) return;
    bgAutoSyncStarted = true;
    try {
      await workerPost("api/admin/feed-backgrounds/sync", {
        staging: bgStaging,
        force: false,
        maxDownloads: 20
      });
      await ensureSyncStatus(true);
      await ensureBgLoaded(true);
      if (typeof global.renderShell === "function" && global.currentTab === "feed-bg") {
        global.renderShell();
      }
    } catch (e) {
      /* stiller Hintergrund-Lauf — kein Toast */
    }
  }

  async function ensureBgLoaded(force) {
    if (bgLoading && !force) return bgIndex;
    bgLoading = true;
    bgError = "";
    try {
      const data = await workerGet(`api/admin/feed-backgrounds?staging=${bgStaging ? "1" : "0"}`);
      bgIndex = data.index || { version: 1, cacheVersion: 1, items: [] };
      bgSha = data.sha || "";
      bgPath = data.path || "";
      bgLoaded = true;
      global.__darFeedBgAdminLoaded = true;
      await ensureSyncStatus(true);
      maybeAutoSyncInBackground();
    } catch (e) {
      bgError = e.message || String(e);
    } finally {
      bgLoading = false;
    }
    return bgIndex;
  }

  function formValue(id, fallback) {
    const el = document.getElementById(id);
    return el ? el.value : fallback;
  }

  function readTagsFromUi(prefix) {
    const out = [];
    document.querySelectorAll(`[data-bg-tag="${prefix}"]`).forEach((el) => {
      if (el.checked) out.push(el.value);
    });
    return out;
  }

  function readAllowedFromUi() {
    const out = [];
    document.querySelectorAll('[data-bg-allowed]').forEach((el) => {
      if (el.checked) out.push(el.value);
    });
    return out.length ? out : ["feed"];
  }

  function readFormDraft() {
    const edit = editingItem();
    const base = edit || defaultDraft();
    return {
      id: formValue("bgId", base.id).trim(),
      title: formValue("bgTitle", base.title).trim(),
      category: formValue("bgCategory", base.category),
      tags: readTagsFromUi("tags"),
      topics: readTagsFromUi("topics"),
      allowedFor: readAllowedFromUi(),
      priority: Number(formValue("bgPriority", base.priority || 5)) || 5,
      status: formValue("bgStatus", base.status || "draft"),
      securityStatus: formValue("bgSecurity", base.securityStatus || "unchecked"),
      approved: !!document.getElementById("bgApproved")?.checked,
      active: formValue("bgStatus", base.status) === "active",
      containsHumans: !!document.getElementById("bgHumans")?.checked,
      containsAnimals: !!document.getElementById("bgAnimals")?.checked,
      containsFaces: !!document.getElementById("bgFaces")?.checked,
      overlayHint: formValue("bgOverlay", base.overlayHint || "dark"),
      focusPoint: {
        x: Number(formValue("bgFocusX", base.focusPoint?.x ?? 50)) || 50,
        y: Number(formValue("bgFocusY", base.focusPoint?.y ?? 50)) || 50
      },
      alt: formValue("bgAlt", base.alt || "").trim(),
      adminNote: formValue("bgNote", base.adminNote || "").trim(),
      dominantColor: formValue("bgColor", base.dominantColor || "").trim(),
      src: base.src || "",
      srcMobile: base.srcMobile || "",
      thumbnail: base.thumbnail || "",
      staging: bgStaging
    };
  }

  function tagChecks(prefix, selected, attr) {
    return TAGS.map((tag) => {
      const on = (selected || []).includes(tag);
      return `<label class="tag" style="cursor:pointer"><input type="checkbox" data-bg-tag="${prefix}" data-${attr} value="${esc(tag)}"${on ? " checked" : ""} style="margin-right:4px">${esc(tag)}</label>`;
    }).join("");
  }

  function renderForm() {
    const item = editingItem() || defaultDraft();
    const preview = item.thumbnail || item.srcMobile || item.src || "";
    return `<div class="admin-form-grid news-form-grid">
      <input class="field wide" id="bgId" placeholder="ID (z. B. bg-nature-mountain-fog-001)" value="${esc(item.id || "")}"${editingBgId ? " readonly" : ""}>
      <input class="field wide" id="bgTitle" placeholder="Titel / interner Name" value="${esc(item.title || "")}">
      <select class="field" id="bgCategory">${CATEGORIES.map(([v, l]) => `<option value="${esc(v)}"${v === (item.category || "nature") ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>
      <input class="field" id="bgPriority" type="number" min="1" max="100" placeholder="Priorität" value="${esc(item.priority ?? 5)}">
      <select class="field" id="bgStatus">
        <option value="draft"${item.status === "draft" ? " selected" : ""}>Entwurf</option>
        <option value="active"${item.status === "active" ? " selected" : ""}>Aktiv</option>
        <option value="disabled"${item.status === "disabled" ? " selected" : ""}>Deaktiviert</option>
      </select>
      <select class="field" id="bgSecurity">
        <option value="unchecked"${item.securityStatus === "unchecked" ? " selected" : ""}>Nicht geprüft</option>
        <option value="approved"${item.securityStatus === "approved" ? " selected" : ""}>Freigegeben</option>
        <option value="warning"${item.securityStatus === "warning" ? " selected" : ""}>Warnung</option>
        <option value="blocked"${item.securityStatus === "blocked" ? " selected" : ""}>Gesperrt</option>
      </select>
      <select class="field" id="bgOverlay">
        <option value="dark"${item.overlayHint === "dark" ? " selected" : ""}>Dunkel</option>
        <option value="warm-dark"${item.overlayHint === "warm-dark" ? " selected" : ""}>Warm-dunkel</option>
        <option value="royal"${item.overlayHint === "royal" ? " selected" : ""}>Nachtblau</option>
        <option value="bordeaux"${item.overlayHint === "bordeaux" ? " selected" : ""}>Bordeaux</option>
        <option value="light"${item.overlayHint === "light" ? " selected" : ""}>Hell</option>
      </select>
      <input class="field" id="bgFocusX" type="number" min="0" max="100" placeholder="Fokus X %" value="${esc(item.focusPoint?.x ?? 50)}">
      <input class="field" id="bgFocusY" type="number" min="0" max="100" placeholder="Fokus Y %" value="${esc(item.focusPoint?.y ?? 50)}">
      <input class="field wide" id="bgAlt" placeholder="Alt-Text" value="${esc(item.alt || "")}">
      <input class="field" id="bgColor" placeholder="Dominante Farbe (#hex)" value="${esc(item.dominantColor || "")}">
      <textarea class="admin-textarea wide" id="bgNote" placeholder="Admin-Notiz">${esc(item.adminNote || "")}</textarea>
      <div class="wide" style="grid-column:1/-1;display:flex;flex-wrap:wrap;gap:6px">${ALLOWED_FOR.map(([v, l]) => {
        const on = (item.allowedFor || ["feed"]).includes(v);
        return `<label class="tag"><input type="checkbox" data-bg-allowed value="${esc(v)}"${on ? " checked" : ""} style="margin-right:4px">${esc(l)}</label>`;
      }).join("")}</div>
      <div class="wide" style="grid-column:1/-1"><strong>Tags</strong><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">${tagChecks("tags", item.tags, "tag")}</div></div>
      <div class="wide" style="grid-column:1/-1"><strong>Themen</strong><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">${tagChecks("topics", item.topics, "topic")}</div></div>
      <label class="field" style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="bgHumans"${item.containsHumans ? " checked" : ""}> Menschen vorhanden</label>
      <label class="field" style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="bgAnimals"${item.containsAnimals ? " checked" : ""}> Tiere vorhanden</label>
      <label class="field" style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="bgFaces"${item.containsFaces ? " checked" : ""}> Gesichter vorhanden</label>
      <label class="field wide" style="grid-column:1/-1;display:flex;align-items:flex-start;gap:8px;border:1px dashed rgba(239,215,142,.35);border-radius:12px;padding:10px">
        <input type="checkbox" id="bgApproved"${item.approved ? " checked" : ""}>
        <span>Ich bestätige: Keine Menschen, keine Tiere, keine Gesichter — islamisch passend — darf im Feed verwendet werden.</span>
      </label>
      <div class="wide" style="grid-column:1/-1">
        <label class="btn" style="cursor:pointer"><input type="file" id="bgFileInput" accept="image/jpeg,image/png,image/webp,image/avif" hidden> Bild hochladen (WebP-Varianten)</label>
        <span id="bgUploadStatus" class="upload-status" style="display:inline-block;margin-left:8px;min-height:auto;padding:6px 10px"></span>
      </div>
      ${preview ? `<div class="wide" style="grid-column:1/-1"><img src="${esc(preview)}" alt="" style="max-width:220px;border-radius:12px;border:1px solid var(--line2)"></div>` : ""}
      <div class="planner-actions wide" style="grid-column:1/-1">
        <button class="btn primary" id="bgSaveBtn" type="button">Speichern</button>
        <button class="btn" id="bgApproveBtn" type="button">Freigeben & aktivieren</button>
        ${editingBgId ? `<button class="btn" id="bgDisableBtn" type="button">Deaktivieren</button><button class="btn danger" id="bgDeleteBtn" type="button">Löschen</button><button class="btn" id="bgCancelBtn" type="button">Abbrechen</button>` : ""}
      </div>
      <div class="notice-note wide" style="grid-column:1/-1">Neue Bilder sind erst nach Freigabe im Feed sichtbar. Pfad: ${esc(bgPath || "content/…/feed-backgrounds.json")} · Cache v${esc(bgIndex.cacheVersion || 1)}</div>
    </div>`;
  }

  function renderRow(item) {
    const st = bgStatus(item);
    const thumb = item.thumbnail || item.srcMobile || item.src || "";
    return `<details class="news-row">
      <summary>
        <div style="display:flex;align-items:center;gap:10px">
          ${thumb ? `<img src="${esc(thumb)}" alt="" style="width:44px;height:44px;object-fit:cover;border-radius:10px">` : `<span class="rank-num" style="width:44px;height:44px">—</span>`}
          <div><div class="news-row-title">${esc(item.title || item.id)}</div><div class="news-row-meta">${esc(item.category)} · P${esc(item.priority)} · ${esc(st)}</div></div>
        </div>
        <div class="news-row-badges">${statusPill(st)}${item.recommendedTextTone ? `<span class="news-pill">Schrift ${esc(item.recommendedTextTone)}</span>` : ""}${item.averageLuminance != null ? `<span class="news-pill">${item.averageLuminance >= 0.56 ? "hell" : item.averageLuminance <= 0.44 ? "dunkel" : "mittel"}</span>` : ""}${item.containsHumans || item.containsAnimals || item.containsFaces ? `<span class="news-pill removed">⚠</span>` : ""}</div>
      </summary>
      <div class="news-row-body">
        <p class="news-row-preview">${esc((item.tags || []).slice(0, 8).join(", "))}</p>
        <div class="news-row-actions">
          <button class="btn" data-bg-edit="${esc(item.id)}" type="button">Bearbeiten</button>
          <button class="btn primary" data-bg-approve="${esc(item.id)}" type="button">Freigeben</button>
          <button class="btn danger" data-bg-block="${esc(item.id)}" type="button">Sperren</button>
          <button class="btn danger" data-bg-delete="${esc(item.id)}" type="button">Deaktivieren</button>
        </div>
      </div>
    </details>`;
  }

  function renderAutoSyncPanel() {
    const st = bgSyncStatus || {};
    const pool = st.pool || {};
    const sync = st.syncState || {};
    const sources = st.sources || {};
    const missing = st.missingKeys || [];
    const srcList = ["pexels", "unsplash", "pixabay"].map((s) => {
      const ok = sources[s];
      const label = s.charAt(0).toUpperCase() + s.slice(1);
      return `${label}: ${ok ? "✓ verbunden" : "✗ Key fehlt"}`;
    }).join(" · ");
    const err = sync.lastSyncError || st.error || "";
    const mode = st.settings?.natureFocus ? "Natur-Fokus" : "Standard";
    const strict = st.settings?.strictIslamicMode !== false ? "strictIslamicMode aktiv" : "locker";
    return `<div class="panel news-panel" style="margin-bottom:12px">
      <div class="section-head"><h3>Automatische Feed-Bilder</h3><span>${pool.approved ?? 0} freigegeben · ${pool.nature ?? 0} Natur</span></div>
      <div class="notice-note wide" style="margin-bottom:10px">Vollautomatisch — täglich, bei Pool &lt; 40, Cron. <strong>${esc(mode)}</strong>, ${esc(strict)}: keine Menschen, keine Tiere, keine Vögel, bei Unsicherheit Gradient.</div>
      <div class="news-manage-toolbar" style="flex-wrap:wrap">
        <button class="btn primary" id="bgSyncNowBtn" type="button"${bgSyncLoading ? " disabled" : ""}>Bilder jetzt synchronisieren</button>
        <button class="btn" id="bgShowActiveBtn" type="button">Aktive anzeigen</button>
        <button class="btn" id="bgShowBlockedBtn" type="button">Gesperrte anzeigen</button>
        <button class="btn" id="bgPoolCleanupBtn" type="button">Pool bereinigen</button>
        <button class="btn" id="bgSyncRefreshBtn" type="button">API-Status anzeigen</button>
      </div>
      <div class="notice-note wide" style="margin-top:10px;line-height:1.55">
        <strong>API:</strong> ${esc(srcList)}<br>
        ${missing.length ? `<span style="color:#ffc9c3">Fehlende Secrets: ${esc(missing.join(", "))}</span><br>` : ""}
        <strong>Pool:</strong> ${esc(pool.approved ?? 0)} freigegeben · ${esc(pool.blocked ?? 0)} gesperrt · ${esc(pool.nature ?? 0)} Natur · Ziel ${esc(pool.target ?? 80)}<br>
        <strong>Letzte Sync:</strong> ${esc(sync.lastSyncAt || "—")} (${esc(sync.lastSyncStatus || "idle")}) · Downloads: ${esc(sync.lastRunDownloads ?? 0)} · Abgelehnt: ${esc(sync.lastRunRejected ?? 0)}<br>
        <strong>Nächste Sync:</strong> ${esc(sync.nextSyncAt || "täglich / bei Pool &lt; 40")} · Heute noch: ${esc(st.remainingDailyDownloads ?? "—")} Downloads<br>
        ${err ? `<span style="color:#ffc9c3">Fehler: ${esc(err)}</span>` : ""}
      </div>
    </div>`;
  }

  function renderFeedBgTab() {
    const rows = filteredItems();
    return `${renderAutoSyncPanel()}<section class="news-workspace">
      <div class="panel news-panel">
        <div class="section-head"><h3>Feed-Hintergrundbilder</h3><span>${rows.length} · ${bgStaging ? "Staging" : "Live"}</span></div>
        <div class="notice-note wide" style="margin-bottom:10px">Kuratierte islamische Hintergründe — keine Menschen/Tiere/Gesichter. Upload → prüfen → freigeben → automatische Feed-Auswahl.</div>
        <div class="news-manage-toolbar">
          <select class="field" id="bgEnvSelect">
            <option value="staging"${bgStaging ? " selected" : ""}>Dar Test (Staging)</option>
            <option value="live"${!bgStaging ? " selected" : ""}>Live-Besucher</option>
          </select>
          <button class="btn" id="bgRefreshBtn" type="button"${bgLoading ? " disabled" : ""}>${bgLoading ? "Lädt…" : "Aktualisieren"}</button>
          <button class="btn primary" id="bgNewBtn" type="button">Neues Bild</button>
        </div>
        ${bgError ? `<div class="notice-note" style="color:#ffc9c3">${esc(bgError)}</div>` : ""}
        ${renderForm()}
      </div>
      <div class="panel news-panel">
        <div class="section-head"><h3>Bildpool</h3><span>${(bgIndex.items || []).length} gesamt</span></div>
        <div class="news-manage-toolbar">
          <input class="field" id="bgSearchInput" type="search" placeholder="Suchen…" value="${esc(bgSearch)}">
          <select class="field" id="bgFilterSelect">
            <option value="all"${bgFilter === "all" ? " selected" : ""}>Alle</option>
            <option value="approved"${bgFilter === "approved" ? " selected" : ""}>Freigegeben</option>
            <option value="auto"${bgFilter === "auto" ? " selected" : ""}>Automatisch</option>
            <option value="blocked"${bgFilter === "blocked" ? " selected" : ""}>Gesperrt</option>
            <option value="draft"${bgFilter === "draft" ? " selected" : ""}>Entwurf</option>
            <option value="disabled"${bgFilter === "disabled" ? " selected" : ""}>Deaktiviert</option>
          </select>
        </div>
        <div class="news-manage-list">${rows.length ? rows.map(renderRow).join("") : `<div class="empty">${bgLoading ? "Lädt…" : "Keine Bilder."}</div>`}</div>
      </div>
    </section>`;
  }

  let pendingUploadFiles = null;

  async function saveBg(approve) {
    const draft = readFormDraft();
    if (!draft.id) {
      toast("ID ist Pflicht");
      return;
    }
    if (!draft.title) {
      toast("Titel ist Pflicht");
      return;
    }
    if (approve) {
      if (!document.getElementById("bgApproved")?.checked) {
        toast("Freigabe-Bestätigung erforderlich");
        return;
      }
      if (draft.containsHumans || draft.containsAnimals || draft.containsFaces) {
        toast("Freigabe blockiert: Menschen/Tiere/Gesichter markiert");
        return;
      }
      draft.approve = true;
      draft.approved = true;
      draft.securityStatus = "approved";
      draft.status = "active";
      draft.active = true;
    }
    if (pendingUploadFiles) {
      draft.files = pendingUploadFiles;
    }
    try {
      await workerPost("api/admin/feed-backgrounds/save", draft);
      pendingUploadFiles = null;
      toast(approve ? "Freigegeben" : "Gespeichert");
      editingBgId = draft.id;
      await ensureBgLoaded(true);
      if (typeof global.renderShell === "function") global.renderShell();
    } catch (e) {
      toast(e.message || "Speichern fehlgeschlagen");
    }
  }

  async function disableBg(id) {
    try {
      const item = (bgIndex.items || []).find((x) => String(x.id) === String(id));
      if (!item) return;
      await workerPost("api/admin/feed-backgrounds/save", {
        ...item,
        status: "disabled",
        active: false,
        approved: false,
        staging: bgStaging
      });
      toast("Deaktiviert");
      await ensureBgLoaded(true);
      if (typeof global.renderShell === "function") global.renderShell();
    } catch (e) {
      toast(e.message || "Fehler");
    }
  }

  async function deleteBg(id) {
    if (!confirm("Bild wirklich aus dem Index entfernen?")) return;
    try {
      await workerPost("api/admin/feed-backgrounds/delete", { id, hard: false, staging: bgStaging });
      toast("Entfernt");
      if (String(editingBgId) === String(id)) editingBgId = null;
      await ensureBgLoaded(true);
      if (typeof global.renderShell === "function") global.renderShell();
    } catch (e) {
      toast(e.message || "Fehler");
    }
  }

  async function runBgSync(force) {
    toast("Synchronisation läuft…");
    try {
      const result = await workerPost("api/admin/feed-backgrounds/sync", {
        staging: bgStaging,
        force: !!force,
        maxDownloads: 20
      });
      bgSyncStatus = result.status || result;
      toast(`Sync: ${result.downloaded || 0} neu · ${result.rejected || 0} abgelehnt`);
      await ensureBgLoaded(true);
      global.renderShell && global.renderShell();
    } catch (e) {
      toast(e.message || "Sync fehlgeschlagen");
    }
  }

  async function blockBg(id) {
    if (!confirm("Bild wirklich sperren?")) return;
    try {
      await workerPost("api/admin/feed-backgrounds/block", { id, staging: bgStaging, reason: "Manuell gesperrt" });
      toast("Gesperrt");
      await ensureBgLoaded(true);
      global.renderShell && global.renderShell();
    } catch (e) {
      toast(e.message || "Sperren fehlgeschlagen");
    }
  }

  async function cleanupBgPool() {
    if (!confirm("Gesperrte Auto-Bilder aus dem Pool entfernen?")) return;
    try {
      const result = await workerPost("api/admin/feed-backgrounds/cleanup", { staging: bgStaging });
      toast(`Bereinigt: ${result.removed || 0}`);
      await ensureBgLoaded(true);
      global.renderShell && global.renderShell();
    } catch (e) {
      toast(e.message || "Bereinigung fehlgeschlagen");
    }
  }

  function bindFeedBgUi() {
    document.getElementById("bgSyncNowBtn")?.addEventListener("click", () => runBgSync(true));
    document.getElementById("bgSyncRefreshBtn")?.addEventListener("click", () => {
      ensureSyncStatus(true).then(() => global.renderShell && global.renderShell());
    });
    document.getElementById("bgShowActiveBtn")?.addEventListener("click", () => {
      bgFilter = "approved";
      global.renderShell && global.renderShell();
    });
    document.getElementById("bgShowBlockedBtn")?.addEventListener("click", () => {
      bgFilter = "blocked";
      global.renderShell && global.renderShell();
    });
    document.getElementById("bgPoolCleanupBtn")?.addEventListener("click", () => cleanupBgPool());
    document.getElementById("bgEnvSelect")?.addEventListener("change", (e) => {
      bgStaging = e.target.value !== "live";
      editingBgId = null;
      ensureBgLoaded(true).then(() => global.renderShell && global.renderShell());
    });
    document.getElementById("bgRefreshBtn")?.addEventListener("click", () => {
      ensureBgLoaded(true).then(() => global.renderShell && global.renderShell());
    });
    document.getElementById("bgNewBtn")?.addEventListener("click", () => {
      editingBgId = null;
      pendingUploadFiles = null;
      global.renderShell && global.renderShell();
    });
    document.getElementById("bgSaveBtn")?.addEventListener("click", () => saveBg(false));
    document.getElementById("bgApproveBtn")?.addEventListener("click", () => saveBg(true));
    document.getElementById("bgDisableBtn")?.addEventListener("click", () => editingBgId && disableBg(editingBgId));
    document.getElementById("bgDeleteBtn")?.addEventListener("click", () => editingBgId && deleteBg(editingBgId));
    document.getElementById("bgCancelBtn")?.addEventListener("click", () => {
      editingBgId = null;
      pendingUploadFiles = null;
      global.renderShell && global.renderShell();
    });
    document.getElementById("bgSearchInput")?.addEventListener("input", (e) => {
      bgSearch = e.target.value;
      global.renderShell && global.renderShell();
    });
    document.getElementById("bgFilterSelect")?.addEventListener("change", (e) => {
      bgFilter = e.target.value;
      global.renderShell && global.renderShell();
    });
    document.getElementById("bgFileInput")?.addEventListener("change", async (e) => {
      const file = e.target.files && e.target.files[0];
      const status = document.getElementById("bgUploadStatus");
      if (!file) return;
      if (status) status.textContent = "Optimiere…";
      try {
        const variants = await buildVariantsFromFile(file);
        const cat = formValue("bgCategory", "nature");
        const slug = slugify(formValue("bgId", file.name.replace(/\.[^.]+$/, "")));
        pendingUploadFiles = [
          { variant: "full", path: `assets/feed-backgrounds/${cat}/${slug}.webp`, contentBase64: variants.full },
          { variant: "mobile", path: `assets/feed-backgrounds/${cat}/${slug}-mobile.webp`, contentBase64: variants.mobile },
          { variant: "thumb", path: `assets/feed-backgrounds/${cat}/${slug}-thumb.webp`, contentBase64: variants.thumb }
        ];
        if (status) status.textContent = "Bereit — bitte speichern/freigeben";
        toast("Varianten erstellt");
      } catch (err) {
        if (status) status.textContent = "";
        toast(err.message || "Upload-Fehler");
      }
    });
    document.querySelectorAll("[data-bg-edit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        editingBgId = btn.getAttribute("data-bg-edit");
        pendingUploadFiles = null;
        global.renderShell && global.renderShell();
      });
    });
    document.querySelectorAll("[data-bg-approve]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        editingBgId = btn.getAttribute("data-bg-approve");
        await ensureBgLoaded(false);
        const item = editingItem();
        if (!item) return;
        try {
          await workerPost("api/admin/feed-backgrounds/save", {
            ...item,
            approve: true,
            staging: bgStaging
          });
          toast("Freigegeben");
          await ensureBgLoaded(true);
          global.renderShell && global.renderShell();
        } catch (e) {
          toast(e.message || "Freigabe fehlgeschlagen");
        }
      });
    });
    document.querySelectorAll("[data-bg-block]").forEach((btn) => {
      btn.addEventListener("click", () => blockBg(btn.getAttribute("data-bg-block")));
    });
    document.querySelectorAll("[data-bg-delete]").forEach((btn) => {
      btn.addEventListener("click", () => deleteBg(btn.getAttribute("data-bg-delete")));
    });
  }

  function slugify(s) {
    return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "bg";
  }

  function approvedForFeedSelect() {
    return (bgIndex.items || []).filter((x) => x.approved && x.status === "active" && !x.containsHumans && !x.containsAnimals && !x.containsFaces);
  }

  global.DARFeedBgAdmin = {
    ensureBgLoaded,
    renderFeedBgTab,
    bindFeedBgUi,
    approvedForFeedSelect,
    get index() { return bgIndex; }
  };
})(window);
