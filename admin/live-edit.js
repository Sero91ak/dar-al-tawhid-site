/* DAR Admin · Live-Bearbeitung — visitor preview + contextual editors */
(function () {
  const SITE = (typeof SITE_ORIGIN === "string" && SITE_ORIGIN) || location.origin || "https://dar-al-tawhid.de";
  const PREVIEW_BASE = SITE.replace(/\/$/, "") + "/test/";
  const AUTOSAVE_KEY = "darAdminLiveAutosaveV1";
  const MODE_KEY = "darAdminLiveModeV1";
  const DEVICE_KEY = "darAdminLiveDeviceV1";
  const VERSION_KEY = "darAdminLiveLocalVersionsV1";

  const state = {
    mode: "preview",
    device: "phone",
    route: { view: "home", value: "" },
    editor: null,
    editorTab: "content",
    dirty: false,
    saveStatus: "Gespeichert",
    autosaveTimer: null,
    iframeReady: false,
    catalog: [],
    duas: [],
    scholars: [],
    books: [],
    menuOpen: false
  };

  function esc(s) {
    return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function toast(msg, ok) {
    if (typeof window.showToast === "function") window.showToast(msg, ok !== false);
    else if (typeof window.toast === "function") window.toast(msg);
  }

  function readMode() {
    try {
      const m = localStorage.getItem(MODE_KEY);
      return m === "edit" ? "edit" : "preview";
    } catch (e) {
      return "preview";
    }
  }

  function writeMode(mode) {
    state.mode = mode === "edit" ? "edit" : "preview";
    try {
      localStorage.setItem(MODE_KEY, state.mode);
    } catch (e) {}
  }

  function readDevice() {
    try {
      const d = localStorage.getItem(DEVICE_KEY);
      return d === "tablet" || d === "desktop" || d === "phone" ? d : "phone";
    } catch (e) {
      return "phone";
    }
  }

  function writeDevice(device) {
    state.device = device === "tablet" || device === "desktop" ? device : "phone";
    try {
      localStorage.setItem(DEVICE_KEY, state.device);
    } catch (e) {}
  }

  function previewUrl(hash) {
    const h = String(hash || "#home").replace(/^#?/, "#");
    return PREVIEW_BASE + "?adminPreview=1&adminLive=1&sourceApp=dar-admin&t=" + Date.now() + h;
  }

  function hashForRoute(route) {
    const view = route?.view || "home";
    const value = route?.value || "";
    if (view === "post" && value) return "#post/" + encodeURIComponent(value);
    if (view === "dua" && value) return "#dua/" + encodeURIComponent(value);
    if (view === "quran-surah" && value) return "#quran-surah/" + encodeURIComponent(value);
    if (view === "bibliothek") return "#bibliothek";
    if (view === "scholars") return "#scholars";
    if (view === "books") return "#books";
    if (view === "duas") return "#duas";
    if (view === "topics") return "#topics";
    if (view === "quran") return "#quran";
    if (view === "feed") return "#feed";
    return "#" + encodeURIComponent(view);
  }

  function parseHash(hash) {
    const raw = String(hash || "#home").replace(/^#/, "");
    const [view, ...rest] = raw.split("/");
    return { view: view || "home", value: rest.join("/") };
  }

  function contextLabel() {
    const r = state.route;
    if (r.view === "post") return "Beitrag · " + (r.value || "—");
    if (r.view === "dua") return "Duʿāʾ · " + (r.value || "—");
    if (r.view === "bibliothek") return "Bibliothek";
    if (r.view === "scholars") return "Gelehrte";
    if (r.view === "books") return "Bücher";
    if (r.view === "duas") return "Duʿāʾ";
    if (r.view === "topics") return "Kategorien / Themen";
    if (r.view === "quran" || r.view === "quran-surah") return "Qurʾān";
    if (r.view === "home") return "Startseite";
    return r.view || "Seite";
  }

  function localVersions() {
    try {
      return JSON.parse(localStorage.getItem(VERSION_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }

  function pushLocalVersion(entry) {
    const list = localVersions();
    list.unshift(entry);
    try {
      localStorage.setItem(VERSION_KEY, JSON.stringify(list.slice(0, 80)));
    } catch (e) {}
  }

  async function audit(action, entityType, entityId, changes) {
    const payload = {
      actorId: "admin-session",
      actorRole: "owner",
      action,
      entityType,
      entityId: entityId || "",
      timestamp: new Date().toISOString(),
      changes: changes || {},
      deviceInfo: navigator.userAgent || "",
      environment: "production",
      sourceApp: "dar-admin",
      analyticsExcluded: true
    };
    try {
      if (typeof workerPostRequest === "function") {
        await workerPostRequest("/api/admin/live/audit", payload);
      }
    } catch (e) {
      try {
        const key = "darAdminLiveAuditLocalV1";
        const rows = JSON.parse(localStorage.getItem(key) || "[]");
        rows.unshift(payload);
        localStorage.setItem(key, JSON.stringify(rows.slice(0, 200)));
      } catch (err) {}
    }
  }

  function setSaveStatus(text, cls) {
    state.saveStatus = text;
    const el = document.getElementById("liveEditSaveStatus");
    if (!el) return;
    el.textContent = text;
    el.className = "live-edit-status" + (cls ? " " + cls : "");
  }

  function scheduleAutosave() {
    state.dirty = true;
    setSaveStatus("Änderungen noch nicht gespeichert", "is-warn");
    clearTimeout(state.autosaveTimer);
    state.autosaveTimer = setTimeout(() => {
      try {
        localStorage.setItem(
          AUTOSAVE_KEY,
          JSON.stringify({ at: new Date().toISOString(), editor: state.editor, route: state.route })
        );
        setSaveStatus("Lokal zwischengespeichert", "is-ok");
      } catch (e) {
        setSaveStatus("Speichern fehlgeschlagen", "is-err");
      }
    }, 900);
  }

  function renderLiveEditTab() {
    state.mode = readMode();
    state.device = readDevice();
    const edit = state.mode === "edit";
    return `<section class="live-edit ${edit ? "is-edit" : "is-preview"}" id="liveEditRoot" data-live-edit>
      <div class="live-edit-head">
        <div>
          <h2>Live-Bearbeitung</h2>
          <p>Besucheransicht in der Admin-App · Staging-Vorschau (/test/) · keine Besucherstatistik</p>
        </div>
        <div class="live-edit-modes" role="tablist" aria-label="Ansichtsmodus">
          <button type="button" data-live-mode="preview" class="${!edit ? "is-active" : ""}" aria-pressed="${!edit}">Besucher-Vorschau</button>
          <button type="button" data-live-mode="edit" class="${edit ? "is-active" : ""}" aria-pressed="${edit}">Bearbeitungsmodus</button>
        </div>
      </div>
      <div class="live-edit-head" style="padding:8px 12px">
        <div class="live-edit-devices" aria-label="Gerät">
          <button type="button" data-live-device="phone" class="${state.device === "phone" ? "is-active" : ""}">Smartphone</button>
          <button type="button" data-live-device="tablet" class="${state.device === "tablet" ? "is-active" : ""}">Tablet</button>
          <button type="button" data-live-device="desktop" class="${state.device === "desktop" ? "is-active" : ""}">Desktop</button>
        </div>
        <div class="live-edit-quick">
          <span class="live-edit-badge" id="liveEditContextBadge">${esc(contextLabel())}</span>
          <button type="button" data-live-nav="home">Start</button>
          <button type="button" data-live-nav="post">Beiträge</button>
          <button type="button" data-live-nav="bibliothek">Bibliothek</button>
          <button type="button" data-live-nav="duas">Duʿāʾ</button>
          <button type="button" data-live-nav="scholars">Gelehrte</button>
          <button type="button" data-live-nav="books">Bücher</button>
          <button type="button" data-live-reload>Neu laden</button>
        </div>
      </div>
      <div class="live-edit-layout ${edit ? "is-split" : ""}">
        <div class="live-edit-stage" id="liveEditStage">
          <div class="live-edit-overlay-bar">
            <strong>Bearbeitungsmodus aktiv</strong>
            <div class="live-edit-actions" id="liveEditContextActions">${renderContextActions()}</div>
          </div>
          <div class="live-edit-frame-wrap" data-device="${esc(state.device)}">
            <iframe class="live-edit-frame" id="liveEditFrame" title="Besucher-Vorschau" src="${esc(previewUrl(hashForRoute(state.route)))}" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"></iframe>
          </div>
        </div>
        <aside class="live-edit-side" id="liveEditSide" aria-label="Kontextaktionen">
          <h3>Kontext</h3>
          <p class="hint">Aktionen erscheinen an der Stelle des Inhalts. Speichern und Veröffentlichen nutzen die bestehenden Admin-APIs.</p>
          <div class="live-edit-section-list">${renderSectionCards()}</div>
          <p class="live-edit-status" id="liveEditSaveStatus">${esc(state.saveStatus)}</p>
        </aside>
      </div>
      <div class="live-edit-editor-sheet" id="liveEditEditorSheet" role="dialog" aria-modal="true" aria-labelledby="liveEditEditorTitle" hidden>
        <div class="live-edit-editor" id="liveEditEditorPanel"></div>
      </div>
      <div class="live-edit-menu" id="liveEditMenu" role="menu"></div>
    </section>`;
  }

  function renderContextActions() {
    const r = state.route.view;
    if (r === "post") {
      return `<button type="button" class="btn primary" data-live-action="edit-post">Bearbeiten</button>
        <button type="button" data-live-action="post-menu" aria-label="Weitere Aktionen">⋯</button>`;
    }
    if (r === "dua") {
      return `<button type="button" class="btn primary" data-live-action="edit-dua">Bearbeiten</button>
        <button type="button" data-live-action="dua-menu" aria-label="Weitere Aktionen">⋯</button>`;
    }
    if (r === "bibliothek") {
      return `<button type="button" class="btn primary" data-live-action="add-pdf">+ PDF</button>
        <button type="button" data-live-action="goto-library">Bibliothek verwalten</button>`;
    }
    if (r === "home") {
      return `<button type="button" data-live-action="add-post">+ Beitrag</button>
        <button type="button" data-live-action="add-dua">+ Duʿāʾ</button>
        <button type="button" data-live-action="add-pdf">+ PDF</button>`;
    }
    if (r === "duas") return `<button type="button" class="btn primary" data-live-action="add-dua">+ Duʿāʾ</button>`;
    if (r === "scholars") return `<button type="button" class="btn primary" data-live-action="add-scholar">+ Gelehrten</button>`;
    if (r === "books") return `<button type="button" class="btn primary" data-live-action="add-book">+ Buch</button>`;
    if (r === "topics") return `<button type="button" class="btn primary" data-live-action="manage-topics">Kategorien</button>`;
    return `<button type="button" data-live-action="add-post">+ Beitrag</button>`;
  }

  function renderSectionCards() {
    return [
      ["Beiträge", "Hinzufügen, bearbeiten, veröffentlichen", "add-post"],
      ["DAR AL TAWḤĪD Bibliothek", "PDF, Cover, Metadaten", "add-pdf"],
      ["Duʿāʾ", "Texte, Quellen, Tages-Duʿāʾ", "add-dua"],
      ["Gelehrte", "Personen und Schreibvarianten", "add-scholar"],
      ["Bücher", "Werke und Zuordnungen", "add-book"],
      ["Quellen", "Direktlinks und Nachweise", "edit-sources"]
    ]
      .map(
        ([title, sub, action]) => `<div class="live-edit-section">
        <div><b>${esc(title)}</b><span>${esc(sub)}</span></div>
        <button type="button" class="btn primary" data-live-action="${esc(action)}">+</button>
      </div>`
      )
      .join("");
  }

  function openMenu(anchorBtn, items) {
    const menu = document.getElementById("liveEditMenu");
    if (!menu) return;
    menu.innerHTML = items
      .map(([label, action, danger]) => `<button type="button" role="menuitem" data-live-action="${esc(action)}" class="${danger ? "is-danger" : ""}">${esc(label)}</button>`)
      .join("");
    const rect = anchorBtn.getBoundingClientRect();
    menu.style.left = Math.min(window.innerWidth - 200, Math.max(8, rect.left)) + "px";
    menu.style.top = Math.min(window.innerHeight - 40, rect.bottom + 6) + "px";
    menu.classList.add("is-open");
    state.menuOpen = true;
  }

  function closeMenu() {
    const menu = document.getElementById("liveEditMenu");
    if (menu) menu.classList.remove("is-open");
    state.menuOpen = false;
  }

  function navigateFrame(hash) {
    state.route = parseHash(hash);
    const frame = document.getElementById("liveEditFrame");
    if (frame) frame.src = previewUrl(hashForRoute(state.route));
    const badge = document.getElementById("liveEditContextBadge");
    if (badge) badge.textContent = contextLabel();
    const actions = document.getElementById("liveEditContextActions");
    if (actions) actions.innerHTML = renderContextActions();
  }

  function reloadFrame() {
    navigateFrame(hashForRoute(state.route));
  }

  function editorTabs(active) {
    return ["content", "source", "meta", "display", "preview", "publish"]
      .map((id) => {
        const labels = { content: "Inhalt", source: "Quelle", meta: "Zuordnung", display: "Darstellung", preview: "Vorschau", publish: "Veröffentlichung" };
        return `<button type="button" data-live-editor-tab="${id}" class="${active === id ? "is-active" : ""}">${labels[id]}</button>`;
      })
      .join("");
  }

  function openEditor(kind, data) {
    state.editor = { kind, data: data || {}, openedAt: Date.now() };
    state.editorTab = "content";
    state.dirty = false;
    const sheet = document.getElementById("liveEditEditorSheet");
    const panel = document.getElementById("liveEditEditorPanel");
    const root = document.getElementById("liveEditRoot");
    if (!sheet || !panel) return;
    panel.innerHTML = renderEditorPanel();
    sheet.hidden = false;
    sheet.classList.add("is-open");
    if (root) root.classList.add("is-editor-open");
    bindEditor();
    const first = panel.querySelector("input,textarea,select,button");
    if (first) first.focus();
  }

  function closeEditor(force) {
    if (state.dirty && !force) {
      if (!confirm("Ungespeicherte Änderungen verwerfen?")) return;
    }
    const sheet = document.getElementById("liveEditEditorSheet");
    const root = document.getElementById("liveEditRoot");
    if (sheet) {
      sheet.classList.remove("is-open");
      sheet.hidden = true;
    }
    if (root) root.classList.remove("is-editor-open");
    state.editor = null;
    state.dirty = false;
  }

  function renderEditorPanel() {
    const ed = state.editor;
    if (!ed) return "";
    const title =
      ed.kind === "post"
        ? ed.data.id
          ? "Beitrag bearbeiten"
          : "Beitrag hinzufügen"
        : ed.kind === "dua"
          ? ed.data.id
            ? "Duʿāʾ bearbeiten"
            : "Duʿāʾ hinzufügen"
          : ed.kind === "scholar"
            ? "Gelehrten bearbeiten"
            : ed.kind === "book"
              ? "Buch bearbeiten"
              : ed.kind === "pdf"
                ? "PDF / Bibliothek"
                : "Bearbeiten";
    return `<div class="live-edit-editor-head">
        <h3 id="liveEditEditorTitle">${esc(title)}</h3>
        <span class="live-edit-status" id="liveEditEditorStatus">${esc(state.saveStatus)}</span>
        <button type="button" class="btn" data-live-editor-close>Abbrechen</button>
      </div>
      <div class="live-edit-editor-tabs">${editorTabs(state.editorTab)}</div>
      <div class="live-edit-editor-body" id="liveEditEditorBody">${renderEditorBody()}</div>
      <div class="live-edit-editor-foot">
        <div>
          <button type="button" class="btn" data-live-editor-draft>Als Entwurf</button>
          <button type="button" class="btn" data-live-editor-preview>Vorschau</button>
        </div>
        <div>
          <button type="button" class="btn primary" data-live-editor-save>Speichern</button>
          <button type="button" class="btn primary" data-live-editor-publish>Veröffentlichen</button>
        </div>
      </div>`;
  }

  function field(id, label, value, type) {
    if (type === "textarea") {
      return `<div class="live-edit-field"><label for="${esc(id)}">${esc(label)}</label><textarea id="${esc(id)}" data-live-field="${esc(id)}">${esc(value || "")}</textarea></div>`;
    }
    if (type === "tall") {
      return `<div class="live-edit-field"><label for="${esc(id)}">${esc(label)}</label><textarea class="tall" id="${esc(id)}" data-live-field="${esc(id)}">${esc(value || "")}</textarea></div>`;
    }
    if (type === "select-status") {
      const opts = ["draft", "scheduled", "published", "archived", "review", "rejected"]
        .map((s) => `<option value="${s}" ${String(value || "draft") === s ? "selected" : ""}>${s}</option>`)
        .join("");
      return `<div class="live-edit-field"><label for="${esc(id)}">${esc(label)}</label><select id="${esc(id)}" data-live-field="${esc(id)}">${opts}</select></div>`;
    }
    return `<div class="live-edit-field"><label for="${esc(id)}">${esc(label)}</label><input id="${esc(id)}" data-live-field="${esc(id)}" value="${esc(value || "")}"></div>`;
  }

  function renderEditorBody() {
    const ed = state.editor;
    const d = ed?.data || {};
    const tab = state.editorTab;
    if (ed.kind === "post") {
      if (tab === "content") {
        return (
          field("markdown", "Komplettes Markdown einfügen", d.markdown || "", "tall") +
          `<details class="live-edit-advanced" open style="margin-top:10px"><summary style="cursor:pointer;font-weight:800;color:var(--gold,#d4af37)">Erweitert</summary><div style="margin-top:10px;display:grid;gap:10px">` +
          field("title", "Titel", d.title) +
          field("slug", "ID / Slug", d.id || d.slug) +
          `</div></details>`
        );
      }
      if (tab === "source") {
        return field("source", "Quellenangabe", d.source, "textarea") + field("links", "Direktlinks (YAML/Text)", d.links || "", "textarea");
      }
      if (tab === "meta") {
        return (
          field("category", "Kategorie", d.category) +
          field("topic", "Thema", d.topic) +
          field("scholar", "Gelehrter", d.scholar) +
          field("book", "Buch / Werk", d.book) +
          field("tags", "Tags", d.tags)
        );
      }
      if (tab === "display") {
        return field("previewImage", "Vorschaubild-URL", d.previewImage) + field("arabic", "Arabischer Text", d.arabic, "textarea") + field("transliteration", "Transliteration", d.transliteration, "textarea");
      }
      if (tab === "preview") {
        return `<div class="hint">Vorschau lädt den Beitrag in der Live-Ansicht links. Gerät umschalten: Smartphone / Tablet / Desktop.</div>
          <button type="button" class="btn primary" data-live-action="preview-current">In Rahmen öffnen</button>`;
      }
      return field("status", "Status", d.status || "draft", "select-status") + field("publishAt", "Veröffentlichungszeit (ISO)", d.publishAt) + field("fazit", "Erklärung / Fazit", d.fazit, "textarea");
    }
    if (ed.kind === "dua") {
      if (tab === "source") return field("src", "Quelle", d.src, "textarea") + field("auth", "Authentizität", d.auth || "");
      if (tab === "meta") return field("type", "Typ", d.type) + field("cat", "Kategorie", d.cat) + field("occasion", "Anlass", d.occasion) + field("reps", "Wiederholungen", d.reps || "");
      if (tab === "publish") return field("status", "Status", d.status || "published", "select-status") + field("daily", "Tages-Duʿāʾ (ja/nein)", d.daily || "nein");
      if (tab === "preview") return `<button type="button" class="btn primary" data-live-action="preview-current">In Rahmen öffnen</button>`;
      return (
        field("title", "Titel", d.title) +
        field("id", "ID", d.id) +
        field("ar", "Arabisch", d.ar, "textarea") +
        field("tr", "Transliteration", d.tr, "textarea") +
        field("de", "Deutsch", d.de, "textarea")
      );
    }
    if (ed.kind === "scholar") {
      return (
        field("name", "Anzeigename", d.name) +
        field("normalized", "Normalisierte Schreibweise", d.normalized) +
        field("aliases", "Alternative Schreibweisen", d.aliases, "textarea") +
        field("kuniyah", "Kuniyah", d.kuniyah) +
        field("generation", "Generation", d.generation) +
        field("group", "Hauptgruppe", d.group) +
        field("roles", "Wissenschaftliche Rollen", d.roles) +
        field("bio", "Kurzbeschreibung", d.bio, "textarea") +
        field("status", "Status", d.status || "published", "select-status")
      );
    }
    if (ed.kind === "book") {
      return field("title", "Titel", d.title) + field("author", "Autor", d.author) + field("category", "Kategorie", d.category) + field("notes", "Notiz", d.notes, "textarea") + field("status", "Status", d.status || "published", "select-status");
    }
    if (ed.kind === "pdf") {
      return `<p class="hint">PDF-Upload und Cover nutzen das bestehende Bibliothek-Modul (gleiche APIs und Speicherorte).</p>
        <button type="button" class="btn primary" data-live-action="goto-library">Bibliothek verwalten öffnen</button>
        ${field("title", "Titel (Notiz)", d.title)}
        ${field("status", "Status", d.status || "draft", "select-status")}`;
    }
    return `<p class="hint">Unbekannter Editor.</p>`;
  }

  function collectFields() {
    const out = { ...(state.editor?.data || {}) };
    document.querySelectorAll("[data-live-field]").forEach((el) => {
      out[el.getAttribute("data-live-field")] = el.value;
    });
    return out;
  }

  function selectedLivePostMode() {
    const checked = document.querySelector('input[name="darPostMode"]:checked');
    return checked?.value === "slide" ? "slide" : "single";
  }

  function buildPostMarkdown(data) {
    let markdown;
    if (data.markdown && String(data.markdown).trim().startsWith("---")) {
      markdown = String(data.markdown);
    } else {
      const fm = [
        "---",
        `id: "${String(data.id || data.slug || "").replace(/"/g, "")}"`,
        `title: "${String(data.title || "").replace(/"/g, '\\"')}"`,
        `category: "${String(data.category || "").replace(/"/g, '\\"')}"`,
        `topic: "${String(data.topic || "").replace(/"/g, '\\"')}"`,
        `scholar: "${String(data.scholar || "").replace(/"/g, '\\"')}"`,
        `book: "${String(data.book || "").replace(/"/g, '\\"')}"`,
        `tags: "${String(data.tags || "").replace(/"/g, '\\"')}"`,
        `source: "${String(data.source || "").replace(/"/g, '\\"')}"`,
        `status: "${String(data.status || "draft").replace(/"/g, "")}"`,
        "---",
        "",
        String(data.markdown || data.body || "").trim(),
        data.fazit ? "\n\n## Fazit\n\n" + data.fazit : ""
      ];
      markdown = fm.join("\n");
    }
    const mode = data.postMode === "slide" || selectedLivePostMode() === "slide" ? "slide" : "single";
    if (typeof window !== "undefined" && window.DARSlidePostParser?.prepareMarkdownForMode) {
      const prepared = window.DARSlidePostParser.prepareMarkdownForMode(markdown, mode, {
        title: data.title,
        id: data.id || data.slug,
        status: data.status || "draft"
      });
      if (!prepared.ok) {
        throw new Error(prepared.errors.join(" · ") || "Markdown-Prüfung fehlgeschlagen");
      }
      return prepared.markdown;
    }
    return markdown;
  }

  async function saveEditor({ publish }) {
    if (!state.editor) return;
    if (!navigator.onLine && publish) {
      alert("Keine Internetverbindung. Der Entwurf wurde lokal gespeichert und kann später synchronisiert werden.");
      scheduleAutosave();
      return;
    }
    const data = collectFields();
    state.editor.data = data;
    setSaveStatus("Speichert …");
    try {
      if (state.editor.kind === "post") {
        let markdown;
        try {
          markdown = buildPostMarkdown(data);
        } catch (err) {
          setSaveStatus(String(err.message || err));
          alert(String(err.message || err));
          return;
        }
        const filename = String(data.filename || (data.id || data.slug || "entwurf") + ".md").replace(/\.md$/i, "") + ".md";
        if (publish) {
          if (typeof publishPostViaWorkerRequest === "function") {
            await publishPostViaWorkerRequest(markdown, filename, { skipPush: false });
          } else {
            await workerPostRequest("/api/admin/publish", { markdown, filename });
          }
        } else if (data.sha || data.filename) {
          await workerPostRequest("/api/admin/post/update", { filename, markdown, sha: data.sha || undefined, skipPush: true });
        } else {
          await workerPostRequest("/api/admin/staging/publish", { markdown, filename }).catch(async () => {
            await workerPostRequest("/api/admin/publish", { markdown, filename, skipPush: true });
          });
        }
        pushLocalVersion({ entityType: "post", entityId: data.id || filename, at: new Date().toISOString(), status: data.status || (publish ? "published" : "draft"), snapshot: { title: data.title } });
        await audit(publish ? "post.publish" : "post.update", "post", data.id || filename, { title: data.title, status: data.status });
        toast(publish ? "Beitrag veröffentlicht" : "Änderungen gespeichert", true);
        navigateFrame("#post/" + encodeURIComponent(String(data.id || filename.replace(/\.md$/i, ""))));
      } else if (state.editor.kind === "dua") {
        await workerPostRequest("/api/admin/dua/save", { dua: data, publish: !!publish });
        pushLocalVersion({ entityType: "dua", entityId: data.id, at: new Date().toISOString(), status: data.status || "published", snapshot: { title: data.title } });
        await audit(publish ? "dua.publish" : "dua.update", "dua", data.id, { title: data.title });
        toast(publish ? "Duʿāʾ veröffentlicht" : "Duʿāʾ gespeichert", true);
        if (data.id) navigateFrame("#dua/" + encodeURIComponent(data.id));
      } else if (state.editor.kind === "scholar" || state.editor.kind === "book") {
        await workerPostRequest("/api/admin/live/meta-save", { kind: state.editor.kind, data, publish: !!publish });
        await audit(state.editor.kind + ".update", state.editor.kind, data.name || data.title || data.id, data);
        toast("Gespeichert", true);
      } else if (state.editor.kind === "pdf") {
        if (typeof navigateAdmin === "function") navigateAdmin("bibliothek");
        toast("Bibliothek-Modul geöffnet", true);
        closeEditor(true);
        return;
      }
      state.dirty = false;
      setSaveStatus(publish ? "Veröffentlicht" : "Gespeichert", "is-ok");
      closeEditor(true);
      reloadFrame();
    } catch (e) {
      setSaveStatus("Speichern fehlgeschlagen", "is-err");
      alert(String(e?.message || e || "Speichern nicht möglich."));
    }
  }

  async function loadPostIntoEditor(postId) {
    const id = String(postId || "").trim();
    if (!id) {
      openEditor("post", { status: "draft", markdown: "" });
      return;
    }
    try {
      let filename = id.endsWith(".md") ? id : "";
      if (!filename && typeof workerGetRequest === "function") {
        // try common filename patterns via public fetch
      }
      const tryNames = filename
        ? [filename]
        : [id + ".md", id.replace(/^post-/, "") + ".md"];
      let loaded = null;
      for (const name of tryNames) {
        try {
          const data = await workerGetRequest("/api/admin/post?filename=" + encodeURIComponent(name), { admin: true });
          if (data && (data.markdown || data.content)) {
            loaded = { filename: name, markdown: data.markdown || data.content, sha: data.sha, id, title: data.title || id, status: "published" };
            break;
          }
        } catch (e) {}
      }
      if (!loaded) {
        const res = await fetch(SITE + "/content/posts/" + encodeURIComponent(id + ".md") + "?t=" + Date.now(), { cache: "no-store" });
        if (res.ok) {
          const markdown = await res.text();
          loaded = { filename: id + ".md", markdown, id, title: id, status: "published" };
        }
      }
      openEditor("post", loaded || { id, title: id, status: "draft", markdown: "" });
    } catch (e) {
      openEditor("post", { id, title: id, status: "draft", markdown: "" });
    }
  }

  async function loadDuaIntoEditor(duaId) {
    const id = String(duaId || "").trim();
    if (!id) {
      openEditor("dua", { status: "draft" });
      return;
    }
    try {
      const data = await workerGetRequest("/api/admin/dua?id=" + encodeURIComponent(id), { admin: true }).catch(() => null);
      if (data?.dua) {
        openEditor("dua", data.dua);
        return;
      }
      const index = await fetch(SITE + "/content/duas/duas.json?t=" + Date.now(), { cache: "no-store" }).then((r) => r.json());
      const row = (Array.isArray(index) ? index : []).find((x) => String(x.id) === id);
      openEditor("dua", row || { id, status: "draft" });
    } catch (e) {
      openEditor("dua", { id, status: "draft" });
    }
  }

  function bindEditor() {
    const panel = document.getElementById("liveEditEditorPanel");
    if (!panel) return;
    panel.querySelectorAll("[data-live-editor-tab]").forEach((btn) => {
      btn.onclick = () => {
        state.editor.data = collectFields();
        state.editorTab = btn.getAttribute("data-live-editor-tab") || "content";
        panel.innerHTML = renderEditorPanel();
        bindEditor();
      };
    });
    panel.querySelectorAll("[data-live-field]").forEach((el) => {
      el.addEventListener("input", () => scheduleAutosave());
      el.addEventListener("change", () => scheduleAutosave());
    });
    panel.querySelector("[data-live-editor-close]")?.addEventListener("click", () => closeEditor(false));
    panel.querySelector("[data-live-editor-save]")?.addEventListener("click", () => saveEditor({ publish: false }));
    panel.querySelector("[data-live-editor-publish]")?.addEventListener("click", () => saveEditor({ publish: true }));
    panel.querySelector("[data-live-editor-draft]")?.addEventListener("click", () => {
      const data = collectFields();
      data.status = "draft";
      state.editor.data = data;
      saveEditor({ publish: false });
    });
    panel.querySelector("[data-live-editor-preview]")?.addEventListener("click", () => {
      state.editor.data = collectFields();
      state.editorTab = "preview";
      panel.innerHTML = renderEditorPanel();
      bindEditor();
    });
    panel.querySelectorAll("[data-live-action]").forEach((btn) => {
      btn.onclick = () => handleAction(btn.getAttribute("data-live-action"), btn);
    });
  }

  function handleAction(action, btn) {
    closeMenu();
    if (action === "add-post") return openEditor("post", { status: "draft", markdown: "" });
    if (action === "edit-post") return loadPostIntoEditor(state.route.value);
    if (action === "add-dua") return openEditor("dua", { status: "draft" });
    if (action === "edit-dua") return loadDuaIntoEditor(state.route.value);
    if (action === "add-pdf" || action === "goto-library") {
      if (typeof navigateAdmin === "function") navigateAdmin("bibliothek");
      return;
    }
    if (action === "add-scholar") return openEditor("scholar", { status: "published" });
    if (action === "add-book") return openEditor("book", { status: "published" });
    if (action === "manage-topics") {
      if (typeof navigateAdmin === "function") navigateAdmin("ordner");
      return;
    }
    if (action === "edit-sources") {
      if (typeof navigateAdmin === "function") navigateAdmin("quellen");
      return;
    }
    if (action === "preview-current") {
      const d = collectFields();
      if (state.editor?.kind === "post" && (d.id || d.slug)) navigateFrame("#post/" + encodeURIComponent(d.id || d.slug));
      if (state.editor?.kind === "dua" && d.id) navigateFrame("#dua/" + encodeURIComponent(d.id));
      return;
    }
    if (action === "post-menu") {
      return openMenu(btn, [
        ["Bearbeiten", "edit-post"],
        ["Vorschau", "preview-post"],
        ["Duplizieren", "dup-post"],
        ["Als Entwurf", "draft-post"],
        ["Veröffentlichen", "publish-post"],
        ["Archivieren", "archive-post"],
        ["Versionsverlauf", "versions-post"],
        ["Löschen", "delete-post", true]
      ]);
    }
    if (action === "dua-menu") {
      return openMenu(btn, [
        ["Bearbeiten", "edit-dua"],
        ["Als Duʿāʾ des Tages", "daily-dua"],
        ["Veröffentlichen", "publish-dua"],
        ["Archivieren", "archive-dua"],
        ["Versionsverlauf", "versions-dua"],
        ["Löschen", "delete-dua", true]
      ]);
    }
    if (action === "preview-post") return navigateFrame("#post/" + encodeURIComponent(state.route.value || ""));
    if (action === "dup-post") {
      loadPostIntoEditor(state.route.value).then(() => {
        if (state.editor?.data) {
          state.editor.data.id = "";
          state.editor.data.slug = "";
          state.editor.data.filename = "";
          state.editor.data.sha = "";
          state.editor.data.title = (state.editor.data.title || "") + " (Kopie)";
          const panel = document.getElementById("liveEditEditorPanel");
          if (panel) {
            panel.innerHTML = renderEditorPanel();
            bindEditor();
          }
        }
      });
      return;
    }
    if (action === "versions-post" || action === "versions-dua") {
      const list = localVersions().filter((v) => v.entityType === (action.includes("dua") ? "dua" : "post"));
      alert(list.length ? list.slice(0, 12).map((v) => `${v.at} · ${v.entityId} · ${v.status}`).join("\n") : "Noch keine Versionen.");
      return;
    }
    if (action === "delete-post" || action === "delete-dua") {
      if (!confirm("Endgültig löschen? Diese Aktion betrifft: " + contextLabel())) return;
      toast("Löschen bitte über den bestehenden Admin-Bereich (Beiträge/Quellen) ausführen.", false);
      if (typeof navigateAdmin === "function") navigateAdmin(action === "delete-dua" ? "actions" : "quellen");
      return;
    }
    if (action === "daily-dua") {
      toast("Tages-Duʿāʾ wird über den Daily-Push-/Content-Workflow gesetzt.", true);
      return;
    }
  }

  function bindLiveEditTab() {
    const root = document.getElementById("liveEditRoot");
    if (!root || root.dataset.bound === "1") {
      // re-bind after rerender
    }
    if (root) root.dataset.bound = "1";

    root?.querySelectorAll("[data-live-mode]").forEach((btn) => {
      btn.onclick = () => {
        writeMode(btn.getAttribute("data-live-mode"));
        if (typeof renderShell === "function") renderShell();
      };
    });
    root?.querySelectorAll("[data-live-device]").forEach((btn) => {
      btn.onclick = () => {
        writeDevice(btn.getAttribute("data-live-device"));
        const wrap = root.querySelector(".live-edit-frame-wrap");
        if (wrap) wrap.setAttribute("data-device", state.device);
        root.querySelectorAll("[data-live-device]").forEach((b) => b.classList.toggle("is-active", b === btn));
      };
    });
    root?.querySelectorAll("[data-live-nav]").forEach((btn) => {
      btn.onclick = () => {
        const nav = btn.getAttribute("data-live-nav");
        if (nav === "post") navigateFrame("#topics");
        else if (nav === "home") navigateFrame("#home");
        else navigateFrame("#" + nav);
      };
    });
    root?.querySelector("[data-live-reload]")?.addEventListener("click", () => reloadFrame());
    root?.querySelectorAll("[data-live-action]").forEach((btn) => {
      btn.onclick = (e) => {
        e.preventDefault();
        handleAction(btn.getAttribute("data-live-action"), btn);
      };
    });

    document.getElementById("liveEditEditorSheet")?.addEventListener("click", (e) => {
      if (e.target?.id === "liveEditEditorSheet") closeEditor(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && state.editor) closeEditor(false);
      if (e.key === "Escape") closeMenu();
    });
    document.addEventListener(
      "click",
      (e) => {
        if (state.menuOpen && !e.target.closest("#liveEditMenu") && !e.target.closest("[data-live-action='post-menu']") && !e.target.closest("[data-live-action='dua-menu']")) closeMenu();
      },
      true
    );

    if (!window.__darLiveEditMsgBound) {
      window.__darLiveEditMsgBound = true;
      window.addEventListener("message", (ev) => {
        const data = ev.data || {};
        if (data.type !== "dar-admin-live-route") return;
        state.route = { view: data.view || "home", value: data.value || "" };
        state.iframeReady = true;
        const badge = document.getElementById("liveEditContextBadge");
        if (badge) badge.textContent = contextLabel();
        const actions = document.getElementById("liveEditContextActions");
        if (actions && state.mode === "edit") actions.innerHTML = renderContextActions();
        document.querySelectorAll("#liveEditContextActions [data-live-action]").forEach((btn) => {
          btn.onclick = (e) => {
            e.preventDefault();
            handleAction(btn.getAttribute("data-live-action"), btn);
          };
        });
      });
    }
  }

  window.DARLiveEdit = {
    renderLiveEditTab,
    bindLiveEditTab,
    openEditor,
    closeEditor,
    state
  };
})();
