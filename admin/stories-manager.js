/**
 * DAR AL TAWḤID — Story-Verwaltung (Admin)
 */
(function (global) {
  "use strict";

  let storiesIndex = { version: 1, items: [] };
  let storiesSha = "";
  let storiesPath = "";
  let storiesLoaded = false;
  let storiesLoading = false;
  let storiesError = "";
  let storiesStaging = true;
  let editingStoryId = null;
  let storyFilter = "all";
  let storySearch = "";

  const CATEGORIES = [
    "News",
    "Beiträge",
    "Duʿāʾ",
    "Qurʾān",
    "Gebetszeiten",
    "Jumuʿah",
    "Aqīdah",
    "Manhaj",
    "Erinnerung"
  ];

  const TYPES = [
    ["news", "News"],
    ["post", "Beitrag"],
    ["dua", "Duʿāʾ"],
    ["quran", "Qurʾān"],
    ["prayer", "Gebetszeiten"],
    ["manual", "Manuell"]
  ];

  const TARGETS = [
    ["none", "Kein Link"],
    ["post", "Beitrag öffnen"],
    ["dua", "Duʿāʾ öffnen"],
    ["quran", "Qurʾān öffnen"],
    ["category", "Kategorie öffnen"],
    ["external", "Externer Link"]
  ];

  const VISIBILITY = [
    ["24h", "24 Stunden"],
    ["48h", "48 Stunden"],
    ["7d", "7 Tage"],
    ["permanent", "Dauerhaft"]
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

  function storyStatus(item) {
    if (!item) return "unbekannt";
    if (item.status === "deleted") return "gelöscht";
    if (item.status === "draft") return "Entwurf";
    if (item.status === "expired") return "abgelaufen";
    if (item.expiresAt && Date.parse(item.expiresAt) <= Date.now()) return "abgelaufen";
    if (item.status === "live") return "live";
    return String(item.status || "Entwurf");
  }

  function statusPill(status) {
    const cls =
      status === "live" ? "live" : status === "abgelaufen" ? "expired" : status === "Entwurf" ? "draft" : "removed";
    return `<span class="news-pill ${cls}">${esc(status)}</span>`;
  }

  function filteredItems() {
    const q = storySearch.trim().toLowerCase();
    return (storiesIndex.items || [])
      .filter((item) => {
        if (!item) return false;
        const st = storyStatus(item);
        if (storyFilter === "live" && st !== "live") return false;
        if (storyFilter === "draft" && st !== "Entwurf") return false;
        if (storyFilter === "expired" && st !== "abgelaufen") return false;
        if (storyFilter === "deleted" && st !== "gelöscht") return false;
        if (!q) return true;
        const hay = `${item.title || ""} ${item.category || ""} ${item.text || ""}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => {
        const pin = Number(Boolean(b.pinned)) - Number(Boolean(a.pinned));
        if (pin) return pin;
        return Number(a.order || 0) - Number(b.order || 0);
      });
  }

  function editingItem() {
    if (!editingStoryId) return null;
    return (storiesIndex.items || []).find((x) => String(x.id) === String(editingStoryId)) || null;
  }

  function defaultDraft() {
    return {
      title: "",
      category: "News",
      text: "",
      type: "news",
      imageUrl: "",
      thumbnailUrl: "",
      gradientFrom: "#243628",
      gradientTo: "#0a100c",
      icon: "✦",
      targetType: "none",
      targetId: "",
      targetUrl: "",
      visibility: "24h",
      status: "draft",
      pinned: false,
      order: (storiesIndex.items || []).length,
      durationSec: 7
    };
  }

  async function ensureStoriesLoaded(force) {
    if (storiesLoading && !force) return storiesIndex;
    storiesLoading = true;
    storiesError = "";
    try {
      const data = await workerGet(`api/admin/stories?staging=${storiesStaging ? "1" : "0"}`);
      storiesIndex = data.index || { version: 1, items: [] };
      storiesSha = data.sha || "";
      storiesPath = data.path || "";
      storiesLoaded = true;
    } catch (e) {
      storiesError = e.message || String(e);
    } finally {
      storiesLoading = false;
    }
    return storiesIndex;
  }

  function formValue(id, fallback) {
    const el = document.getElementById(id);
    return el ? el.value : fallback;
  }

  function readFormDraft() {
    const edit = editingItem();
    const base = edit || defaultDraft();
    return {
      id: edit?.id || "",
      title: formValue("storyTitle", base.title).trim(),
      category: formValue("storyCategory", base.category),
      text: formValue("storyText", base.text).trim(),
      type: formValue("storyType", base.type),
      imageUrl: formValue("storyImageUrl", base.imageUrl).trim(),
      thumbnailUrl: formValue("storyThumbUrl", base.thumbnailUrl).trim(),
      gradientFrom: formValue("storyGradFrom", base.gradientFrom).trim(),
      gradientTo: formValue("storyGradTo", base.gradientTo).trim(),
      icon: formValue("storyIcon", base.icon).trim(),
      targetType: formValue("storyTargetType", base.targetType),
      targetId: formValue("storyTargetId", base.targetId).trim(),
      targetUrl: formValue("storyTargetUrl", base.targetUrl).trim(),
      visibility: formValue("storyVisibility", base.visibility || "24h"),
      status: formValue("storyStatus", base.status || "draft"),
      pinned: !!document.getElementById("storyPinned")?.checked,
      order: Number(formValue("storyOrder", base.order || 0)) || 0,
      durationSec: Number(formValue("storyDuration", base.durationSec || 7)) >= 10 ? 10 : 7,
      staging: storiesStaging
    };
  }

  function renderForm() {
    const item = editingItem() || defaultDraft();
    return `<div class="admin-form-grid news-form-grid">
      <input class="field" id="storyTitle" placeholder="Titel" value="${esc(item.title || "")}">
      <select class="field" id="storyCategory">${CATEGORIES.map((c) => `<option${c === (item.category || "News") ? " selected" : ""}>${esc(c)}</option>`).join("")}</select>
      <select class="field" id="storyType">${TYPES.map(([v, l]) => `<option value="${esc(v)}"${v === (item.type || "news") ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>
      <select class="field" id="storyVisibility">${VISIBILITY.map(([v, l]) => `<option value="${esc(v)}"${v === (item.visibility || "24h") ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>
      <select class="field" id="storyStatus">
        <option value="draft"${item.status === "draft" ? " selected" : ""}>Entwurf</option>
        <option value="live"${item.status === "live" ? " selected" : ""}>Live</option>
        <option value="expired"${item.status === "expired" ? " selected" : ""}>Abgelaufen</option>
      </select>
      <input class="field" id="storyIcon" placeholder="Icon (Emoji)" value="${esc(item.icon || "✦")}">
      <input class="field" id="storyOrder" type="number" placeholder="Reihenfolge" value="${esc(item.order ?? 0)}">
      <label class="field" style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="storyPinned"${item.pinned ? " checked" : ""}> Angepinnt</label>
      <textarea class="admin-textarea wide" id="storyText" placeholder="Kurzer Story-Text">${esc(item.text || "")}</textarea>
      <input class="field wide" id="storyImageUrl" placeholder="Hintergrundbild-URL (1080×1920, optional)" value="${esc(item.imageUrl || "")}">
      <input class="field wide" id="storyThumbUrl" placeholder="Thumbnail-URL (300×300, optional)" value="${esc(item.thumbnailUrl || "")}">
      <input class="field" id="storyGradFrom" placeholder="Verlauf von (#hex)" value="${esc(item.gradientFrom || "#243628")}">
      <input class="field" id="storyGradTo" placeholder="Verlauf bis (#hex)" value="${esc(item.gradientTo || "#0a100c")}">
      <select class="field" id="storyTargetType">${TARGETS.map(([v, l]) => `<option value="${esc(v)}"${v === (item.targetType || "none") ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>
      <input class="field" id="storyTargetId" placeholder="Ziel-ID (Beitrag/Duʿāʾ/Kategorie)" value="${esc(item.targetId || "")}">
      <input class="field wide" id="storyTargetUrl" placeholder="Externe URL (nur wenn erlaubt)" value="${esc(item.targetUrl || "")}">
      <select class="field" id="storyDuration"><option value="7"${Number(item.durationSec || 7) < 10 ? " selected" : ""}>7 Sekunden</option><option value="10"${Number(item.durationSec || 7) >= 10 ? " selected" : ""}>10 Sekunden</option></select>
      <div class="planner-actions wide" style="grid-column:1/-1">
        <button class="btn primary" id="storySaveBtn" type="button">${editingStoryId ? "Speichern" : "Story anlegen"}</button>
        <button class="btn" id="storyPublishBtn" type="button">Live veröffentlichen</button>
        <button class="btn" id="storyPreviewBtn" type="button">Vorschau (Test-App)</button>
        ${editingStoryId ? `<button class="btn" id="storyCancelEditBtn" type="button">Abbrechen</button>` : ""}
      </div>
      <div class="notice-note wide" style="grid-column:1/-1">Ziel: <strong>${storiesStaging ? "Dar Test (/test/)" : "Live-Besucher"}</strong> · Pfad: ${esc(storiesPath || "content/…/stories/stories-index.json")}</div>
    </div>`;
  }

  function renderRow(item) {
    const st = storyStatus(item);
    return `<details class="news-row">
      <summary>
        <div><div class="news-row-title">${esc(item.title || "Ohne Titel")}</div><div class="news-row-meta">${esc(item.category || "")} · ${esc(item.type || "")} · ${esc(st)}</div></div>
        <div class="news-row-badges">${statusPill(st)}${item.pinned ? `<span class="news-pill draft">Pin</span>` : ""}</div>
      </summary>
      <div class="news-row-body">
        <p class="news-row-preview">${esc(item.text || "")}</p>
        <div class="news-row-actions">
          <button class="btn" data-story-edit="${esc(item.id)}" type="button">Bearbeiten</button>
          <button class="btn primary" data-story-live="${esc(item.id)}" type="button">Live</button>
          <button class="btn" data-story-up="${esc(item.id)}" type="button">↑</button>
          <button class="btn" data-story-down="${esc(item.id)}" type="button">↓</button>
          <button class="btn danger" data-story-delete="${esc(item.id)}" type="button">Löschen</button>
        </div>
      </div>
    </details>`;
  }

  function renderStoriesTab() {
    const rows = filteredItems();
    return `<section class="news-workspace">
      <div class="panel news-panel">
        <div class="section-head"><h3>Storys verwalten</h3><span>${rows.length} · ${storiesStaging ? "Staging" : "Live"}</span></div>
        <div class="news-manage-toolbar">
          <select class="field" id="storyEnvSelect">
            <option value="staging"${storiesStaging ? " selected" : ""}>Dar Test (Staging)</option>
            <option value="live"${!storiesStaging ? " selected" : ""}>Live-Besucher</option>
          </select>
          <button class="btn" id="storyRefreshBtn" type="button"${storiesLoading ? " disabled" : ""}>${storiesLoading ? "Lädt…" : "Aktualisieren"}</button>
        </div>
        ${storiesError ? `<div class="notice-note" style="color:#ffc9c3">${esc(storiesError)}</div>` : ""}
        ${renderForm()}
      </div>
      <div class="panel news-panel">
        <div class="section-head"><h3>Übersicht</h3><span>${(storiesIndex.items || []).length} gesamt</span></div>
        <div class="news-manage-toolbar">
          <input class="field" id="storySearchInput" type="search" placeholder="Story suchen…" value="${esc(storySearch)}">
          <select class="field" id="storyFilterSelect">
            <option value="all"${storyFilter === "all" ? " selected" : ""}>Alle</option>
            <option value="live"${storyFilter === "live" ? " selected" : ""}>Live</option>
            <option value="draft"${storyFilter === "draft" ? " selected" : ""}>Entwurf</option>
            <option value="expired"${storyFilter === "expired" ? " selected" : ""}>Abgelaufen</option>
            <option value="deleted"${storyFilter === "deleted" ? " selected" : ""}>Gelöscht</option>
          </select>
        </div>
        <div class="news-manage-list">${rows.length ? rows.map(renderRow).join("") : `<div class="empty">${storiesLoading ? "Storys werden geladen…" : "Keine Storys in diesem Filter."}</div>`}</div>
      </div>
    </section>`;
  }

  async function saveStory(statusOverride) {
    const draft = readFormDraft();
    if (!draft.title || !draft.text) {
      toast("Titel und Text sind Pflicht");
      return;
    }
    if (statusOverride) draft.status = statusOverride;
    if (!draft.id) draft.id = `story-${Date.now().toString(36)}`;
    draft.staging = storiesStaging;
    const btn = document.getElementById("storySaveBtn");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Speichere…";
    }
    try {
      await workerPost("api/admin/stories/save", draft);
      if (typeof global.addAdminLog === "function") {
        global.addAdminLog("Story", statusOverride === "live" ? "Live veröffentlicht" : "Gespeichert", draft.title);
      }
      toast(statusOverride === "live" ? "Story live veröffentlicht" : "Story gespeichert");
      editingStoryId = draft.id;
      await ensureStoriesLoaded(true);
      if (typeof global.renderShell === "function") global.renderShell();
    } catch (e) {
      toast(e.message || "Speichern fehlgeschlagen");
      if (btn) {
        btn.disabled = false;
        btn.textContent = editingStoryId ? "Speichern" : "Story anlegen";
      }
    }
  }

  async function deleteStory(id, hard) {
    if (!confirm(hard ? "Story endgültig löschen?" : "Story archivieren/löschen?\n\nSie verschwindet aus der Besucher-App.")) return;
    try {
      await workerPost("api/admin/stories/delete", { id, hard: !!hard, staging: storiesStaging });
      toast("Story gelöscht");
      if (editingStoryId === id) editingStoryId = null;
      await ensureStoriesLoaded(true);
      if (typeof global.renderShell === "function") global.renderShell();
    } catch (e) {
      toast(e.message || "Löschen fehlgeschlagen");
    }
  }

  async function moveStory(id, dir) {
    const items = filteredItems();
    const idx = items.findIndex((x) => String(x.id) === String(id));
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= items.length) return;
    const swapped = items.slice();
    const tmp = swapped[idx];
    swapped[idx] = swapped[j];
    swapped[j] = tmp;
    try {
      await workerPost("api/admin/stories/reorder", {
        staging: storiesStaging,
        order: swapped.map((x) => x.id)
      });
      await ensureStoriesLoaded(true);
      if (typeof global.renderShell === "function") global.renderShell();
    } catch (e) {
      toast(e.message || "Reihenfolge fehlgeschlagen");
    }
  }

  function bindStoriesUi() {
    const env = document.getElementById("storyEnvSelect");
    if (env) {
      env.onchange = async () => {
        storiesStaging = env.value !== "live";
        storiesLoaded = false;
        await ensureStoriesLoaded(true);
        if (typeof global.renderShell === "function") global.renderShell();
      };
    }
    const refresh = document.getElementById("storyRefreshBtn");
    if (refresh) {
      refresh.onclick = async () => {
        await ensureStoriesLoaded(true);
        toast("Storys aktualisiert");
        if (typeof global.renderShell === "function") global.renderShell();
      };
    }
    const search = document.getElementById("storySearchInput");
    if (search) {
      search.oninput = () => {
        storySearch = search.value;
        if (typeof global.renderShell === "function") global.renderShell();
      };
    }
    const filter = document.getElementById("storyFilterSelect");
    if (filter) {
      filter.onchange = () => {
        storyFilter = filter.value;
        if (typeof global.renderShell === "function") global.renderShell();
      };
    }
    const saveBtn = document.getElementById("storySaveBtn");
    if (saveBtn) saveBtn.onclick = () => saveStory(null);
    const pubBtn = document.getElementById("storyPublishBtn");
    if (pubBtn) pubBtn.onclick = () => saveStory("live");
    const previewBtn = document.getElementById("storyPreviewBtn");
    if (previewBtn) {
      previewBtn.onclick = () => {
        const origin = global.SITE_ORIGIN || location.origin;
        global.open(`${origin}/test/#home`, "_blank", "noopener");
      };
    }
    const cancelBtn = document.getElementById("storyCancelEditBtn");
    if (cancelBtn) {
      cancelBtn.onclick = () => {
        editingStoryId = null;
        if (typeof global.renderShell === "function") global.renderShell();
      };
    }
    document.querySelectorAll("[data-story-edit]").forEach((btn) => {
      btn.onclick = () => {
        editingStoryId = btn.dataset.storyEdit;
        if (typeof global.renderShell === "function") global.renderShell();
      };
    });
    document.querySelectorAll("[data-story-live]").forEach((btn) => {
      btn.onclick = async () => {
        const item = (storiesIndex.items || []).find((x) => String(x.id) === String(btn.dataset.storyLive));
        if (!item) return;
        editingStoryId = item.id;
        try {
          await workerPost("api/admin/stories/save", { ...item, status: "live", staging: storiesStaging });
          toast("Live veröffentlicht");
          await ensureStoriesLoaded(true);
          if (typeof global.renderShell === "function") global.renderShell();
        } catch (e) {
          toast(e.message || "Live fehlgeschlagen");
        }
      };
    });
    document.querySelectorAll("[data-story-delete]").forEach((btn) => {
      btn.onclick = () => deleteStory(btn.dataset.storyDelete, false);
    });
    document.querySelectorAll("[data-story-up]").forEach((btn) => {
      btn.onclick = () => moveStory(btn.dataset.storyUp, -1);
    });
    document.querySelectorAll("[data-story-down]").forEach((btn) => {
      btn.onclick = () => moveStory(btn.dataset.storyDown, 1);
    });
  }

  global.DARStoriesAdmin = {
    renderStoriesTab,
    bindStoriesUi,
    ensureStoriesLoaded,
    resetEdit: () => {
      editingStoryId = null;
    }
  };
})(window);
