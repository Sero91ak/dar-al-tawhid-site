/**
 * DAR AL TAWḤID — Feed / Im Fokus (Admin)
 */
(function (global) {
  "use strict";

  let feedIndex = { version: 1, items: [] };
  let feedSha = "";
  let feedPath = "";
  let feedLoaded = false;
  let feedLoading = false;
  let feedError = "";
  let feedStaging = true;
  let editingFeedId = null;
  let feedFilter = "all";
  let feedSearch = "";
  let postFeedCatalog = [];
  let postFeedCatalogBusy = false;
  let postFeedCatalogLoaded = false;

  const CATEGORIES = [
    "Aqīdah",
    "Duʿāʾ",
    "Qurʾān",
    "News",
    "Gebetszeiten",
    "Jumuʿah",
    "Manhaj",
    "Empfehlung"
  ];

  const TYPES = [
    ["post", "Beitrag"],
    ["dua", "Duʿāʾ"],
    ["quran", "Qurʾān"],
    ["news", "News / Neu im Fokus"],
    ["prayer", "Gebetszeiten"],
    ["category", "Kategorie / Ordner"],
    ["series", "Serie / Sammlung"],
    ["manual", "Manuell / Empfehlung"]
  ];

  const CARD_SIZES = [
    ["premium", "Premium (groß)"],
    ["medium", "Feed (mittel)"],
    ["mini", "Mini / Chip"]
  ];

  const BG_TYPES = [
    ["", "Automatisch (kuratierter Pool)"],
    ["nature", "Natur"],
    ["books", "Bücher / Mushaf"],
    ["mosque", "Moschee / Ornament"],
    ["pattern", "Muster / Abstrakt"],
    ["gradient", "Gradient / ohne Bild"],
    ["image", "Bildbeitrag / URL"]
  ];

  const BACKGROUND_MODES = [
    ["auto", "Automatisch auswählen"],
    ["manual", "Manuell auswählen"],
    ["gradient", "Nur Gradient"],
    ["none", "Kein Bild"]
  ];

  const TARGETS = [
    ["none", "Kein Link"],
    ["post", "Beitrag öffnen"],
    ["dua", "Duʿāʾ öffnen"],
    ["quran", "Qurʾān öffnen"],
    ["news", "News-Eintrag"],
    ["category", "Kategorie öffnen"],
    ["prayer", "Gebetszeiten"],
    ["external", "Externer Link"]
  ];

  const VISIBILITY = [
    ["24h", "24 Stunden"],
    ["48h", "48 Stunden"],
    ["7d", "7 Tage"],
    ["permanent", "Dauerhaft"],
    ["manual", "Manuell bis Datum"]
  ];

  function esc(s) {
    return global.esc ? global.esc(s) : String(s ?? "");
  }

  function visibilityExpiresAt(visibility, startsAt, manualExpires) {
    const startMs = Date.parse(startsAt || "") || Date.now();
    if (visibility === "manual") return manualExpires || null;
    if (visibility === "permanent") return null;
    const hours = visibility === "48h" ? 48 : visibility === "7d" ? 168 : 24;
    return new Date(startMs + hours * 60 * 60 * 1000).toISOString();
  }

  function hasValidTarget(draft) {
    const tt = draft.targetType || "none";
    if (tt === "none") return false;
    if (tt === "prayer") return true;
    if (tt === "external") return !!String(draft.targetUrl || "").trim();
    return !!String(draft.targetId || "").trim();
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

  function feedStatus(item) {
    if (!item) return "unbekannt";
    if (item.status === "deleted") return "gelöscht";
    if (item.status === "draft") return "Entwurf";
    if (item.status === "expired") return "abgelaufen";
    if (item.expiresAt && Date.parse(item.expiresAt) <= Date.now()) return "abgelaufen";
    if (item.startsAt && Date.parse(item.startsAt) > Date.now()) return "geplant";
    if (item.status === "live") return "live";
    return String(item.status || "Entwurf");
  }

  function statusPill(status) {
    const cls =
      status === "live" ? "live" : status === "abgelaufen" ? "expired" : status === "Entwurf" ? "draft" : status === "geplant" ? "draft" : "removed";
    return `<span class="news-pill ${cls}">${esc(status)}</span>`;
  }

  function filteredItems() {
    const q = feedSearch.trim().toLowerCase();
    return (feedIndex.items || [])
      .filter((item) => {
        if (!item) return false;
        const st = feedStatus(item);
        if (feedFilter === "live" && st !== "live") return false;
        if (feedFilter === "draft" && st !== "Entwurf") return false;
        if (feedFilter === "expired" && st !== "abgelaufen") return false;
        if (feedFilter === "deleted" && st !== "gelöscht") return false;
        if (!q) return true;
        const hay = `${item.title || ""} ${item.category || ""} ${item.preview || ""}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => {
        const pin = Number(Boolean(b.pinned)) - Number(Boolean(a.pinned));
        if (pin) return pin;
        return Number(a.order || 0) - Number(b.order || 0);
      });
  }

  function editingItem() {
    if (!editingFeedId) return null;
    return (feedIndex.items || []).find((x) => String(x.id) === String(editingFeedId)) || null;
  }

  function defaultDraft() {
    return {
      title: "",
      preview: "",
      category: "Empfehlung",
      scholar: "",
      type: "manual",
      cardSize: "medium",
      imageUrl: "",
      thumbnailUrl: "",
      gradientFrom: "#243628",
      gradientTo: "#0a100c",
      icon: "✦",
      targetType: "none",
      targetId: "",
      targetUrl: "",
      badgeNeu: false,
      badgeEmpfohlen: false,
      badgeWichtig: false,
      dateLabel: "",
      visibility: "24h",
      startsAt: new Date().toISOString().slice(0, 16),
      expiresAt: "",
      status: "draft",
      pinned: false,
      order: (feedIndex.items || []).length,
      backgroundMode: "auto",
      backgroundId: "",
      backgroundSafe: true,
      topic: ""
    };
  }

  async function ensureFeedLoaded(force) {
    if (feedLoading && !force) return feedIndex;
    feedLoading = true;
    feedError = "";
    try {
      const data = await workerGet(`api/admin/feed?staging=${feedStaging ? "1" : "0"}`);
      feedIndex = data.index || { version: 1, items: [] };
      feedSha = data.sha || "";
      feedPath = data.path || "";
      feedLoaded = true;
      global.__darFeedAdminLoaded = true;
      await ensurePostFeedCatalog(!!force);
    } catch (e) {
      feedError = e.message || String(e);
    } finally {
      feedLoading = false;
    }
    return feedIndex;
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
      title: formValue("feedTitle", base.title).trim(),
      preview: formValue("feedPreview", base.preview).trim(),
      category: formValue("feedCategory", base.category),
      scholar: formValue("feedScholar", base.scholar).trim(),
      type: formValue("feedType", base.type),
      cardSize: formValue("feedCardSize", base.cardSize),
      imageUrl: formValue("feedImageUrl", base.imageUrl).trim(),
      thumbnailUrl: formValue("feedThumbUrl", base.thumbnailUrl).trim(),
      bgType: formValue("feedBgType", base.bgType || ""),
      imageSafe: document.getElementById("feedImageSafe")?.checked !== false,
      backgroundMode: formValue("feedBackgroundMode", base.backgroundMode || "auto"),
      backgroundId: formValue("feedBackgroundId", base.backgroundId || "").trim(),
      backgroundSafe: document.getElementById("feedBackgroundSafe")?.checked !== false,
      topic: formValue("feedTopic", base.topic || "").trim(),
      gradientFrom: formValue("feedGradFrom", base.gradientFrom).trim(),
      gradientTo: formValue("feedGradTo", base.gradientTo).trim(),
      icon: formValue("feedIcon", base.icon).trim(),
      targetType: formValue("feedTargetType", base.targetType),
      targetId: formValue("feedTargetId", base.targetId).trim(),
      targetUrl: formValue("feedTargetUrl", base.targetUrl).trim(),
      badgeNeu: !!document.getElementById("feedBadgeNeu")?.checked,
      badgeEmpfohlen: !!document.getElementById("feedBadgeRec")?.checked,
      badgeWichtig: !!document.getElementById("feedBadgeImp")?.checked,
      dateLabel: formValue("feedDateLabel", base.dateLabel).trim(),
      visibility: formValue("feedVisibility", base.visibility || "24h"),
      startsAt: formValue("feedStartsAt", base.startsAt || "").trim(),
      expiresAt: formValue("feedExpiresAt", base.expiresAt || "").trim(),
      status: formValue("feedStatus", base.status || "draft"),
      pinned: !!document.getElementById("feedPinned")?.checked,
      order: Number(formValue("feedOrder", base.order || 0)) || 0,
      staging: feedStaging
    };
  }

  function renderForm() {
    const item = editingItem() || defaultDraft();
    const startsVal = item.startsAt ? String(item.startsAt).slice(0, 16) : "";
    const expiresVal = item.expiresAt ? String(item.expiresAt).slice(0, 16) : "";
    const approvedBgs = (global.DARFeedBgAdmin && typeof global.DARFeedBgAdmin.approvedForFeedSelect === "function")
      ? global.DARFeedBgAdmin.approvedForFeedSelect()
      : [];
    const bgMode = item.backgroundMode || (item.bgType === "gradient" ? "gradient" : "auto");
    return `<div class="admin-form-grid news-form-grid">
      <input class="field" id="feedTitle" placeholder="Titel" value="${esc(item.title || "")}">
      <select class="field" id="feedCategory">${CATEGORIES.map((c) => `<option${c === (item.category || "Empfehlung") ? " selected" : ""}>${esc(c)}</option>`).join("")}</select>
      <select class="field" id="feedType">${TYPES.map(([v, l]) => `<option value="${esc(v)}"${v === (item.type || "manual") ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>
      <select class="field" id="feedCardSize">${CARD_SIZES.map(([v, l]) => `<option value="${esc(v)}"${v === (item.cardSize || "medium") ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>
      <select class="field" id="feedVisibility">${VISIBILITY.map(([v, l]) => `<option value="${esc(v)}"${v === (item.visibility || "24h") ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>
      <select class="field" id="feedStatus">
        <option value="draft"${item.status === "draft" ? " selected" : ""}>Entwurf</option>
        <option value="live"${item.status === "live" ? " selected" : ""}>Live</option>
        <option value="expired"${item.status === "expired" ? " selected" : ""}>Abgelaufen</option>
      </select>
      <input class="field" id="feedIcon" placeholder="Icon (Emoji)" value="${esc(item.icon || "✦")}">
      <input class="field" id="feedOrder" type="number" placeholder="Reihenfolge" value="${esc(item.order ?? 0)}">
      <input class="field" id="feedDateLabel" placeholder="Datum (Anzeige, optional)" value="${esc(item.dateLabel || "")}">
      <input class="field" id="feedStartsAt" type="datetime-local" placeholder="Start" value="${esc(startsVal)}">
      <input class="field" id="feedExpiresAt" type="datetime-local" placeholder="Ende (optional)" value="${esc(expiresVal)}">
      <label class="field" style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="feedPinned"${item.pinned ? " checked" : ""}> Angepinnt / Premium</label>
      <label class="field" style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="feedBadgeNeu"${item.badgeNeu ? " checked" : ""}> Badge „Neu“</label>
      <label class="field" style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="feedBadgeRec"${item.badgeEmpfohlen ? " checked" : ""}> Badge „Empfohlen“</label>
      <label class="field" style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="feedBadgeImp"${item.badgeWichtig ? " checked" : ""}> Badge „Wichtig“</label>
      <textarea class="admin-textarea wide" id="feedPreview" placeholder="Kurztext / Vorschau">${esc(item.preview || "")}</textarea>
      <input class="field" id="feedScholar" placeholder="Gelehrter / Thema (optional)" value="${esc(item.scholar || "")}">
      <select class="field" id="feedBgType">${BG_TYPES.map(([v, l]) => `<option value="${esc(v)}"${v === (item.bgType || "") ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>
      <select class="field" id="feedBackgroundMode">${BACKGROUND_MODES.map(([v, l]) => `<option value="${esc(v)}"${v === bgMode ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>
      <select class="field wide" id="feedBackgroundId">
        <option value="">— Freigegebenes Bild wählen —</option>
        ${approvedBgs.map((bg) => `<option value="${esc(bg.id)}"${bg.id === (item.backgroundId || "") ? " selected" : ""}>${esc(bg.title || bg.id)} (${esc(bg.category)})</option>`).join("")}
      </select>
      <input class="field" id="feedTopic" placeholder="Thema / Topic (optional, z. B. Wissen, Sabr)" value="${esc(item.topic || "")}">
      <input class="field wide" id="feedImageUrl" placeholder="Hintergrundbild-URL (optional, nur islamisch passend)" value="${esc(item.imageUrl || "")}">
      <input class="field wide" id="feedThumbUrl" placeholder="Thumbnail-URL (empfohlen, kleiner)" value="${esc(item.thumbnailUrl || "")}">
      <label class="field" style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="feedImageSafe"${item.imageSafe !== false ? " checked" : ""}> Bild als sicher markieren (imageSafe)</label>
      <label class="field" style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="feedBackgroundSafe"${item.backgroundSafe !== false ? " checked" : ""}> Hintergrund als sicher (backgroundSafe)</label>
      <div class="notice-note wide" style="grid-column:1/-1;font-size:12px;line-height:1.45">Hintergrundbilder kommen aus dem kuratierten Pool (Admin → Feed-Hintergründe). Keine externen URLs. Automatisch = passendes freigegebenes Bild. Nur freigegebene Bilder erscheinen live.</div>
      <input class="field" id="feedGradFrom" placeholder="Verlauf von (#hex)" value="${esc(item.gradientFrom || "#243628")}">
      <input class="field" id="feedGradTo" placeholder="Verlauf bis (#hex)" value="${esc(item.gradientTo || "#0a100c")}">
      <select class="field" id="feedTargetType">${TARGETS.map(([v, l]) => `<option value="${esc(v)}"${v === (item.targetType || "none") ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>
      <input class="field" id="feedTargetId" placeholder="Ziel-ID (Beitrag/Duʿāʾ/Sura/Kategorie/News)" value="${esc(item.targetId || "")}">
      <input class="field wide" id="feedTargetUrl" placeholder="Externe URL (nur wenn erlaubt)" value="${esc(item.targetUrl || "")}">
      <div class="planner-actions wide" style="grid-column:1/-1">
        <button class="btn primary" id="feedSaveBtn" type="button">${editingFeedId ? "Speichern" : "Karte anlegen"}</button>
        <button class="btn" id="feedPublishBtn" type="button">Live veröffentlichen</button>
        <button class="btn" id="feedPreviewBtn" type="button">Vorschau (Test-App)</button>
        ${editingFeedId ? `<button class="btn" id="feedCancelEditBtn" type="button">Abbrechen</button>` : ""}
      </div>
      <div class="notice-note wide" style="grid-column:1/-1">Ziel: <strong>${feedStaging ? "Dar Test (/test/)" : "Live-Besucher"}</strong> · Pfad: ${esc(feedPath || "content/…/focus-feed/feed-index.json")}</div>
    </div>`;
  }

  async function ensurePostFeedCatalog(force) {
    if (postFeedCatalogLoaded && !force) return postFeedCatalog;
    postFeedCatalogBusy = true;
    try {
      if (typeof global.ensureQuellenCatalog === "function") {
        const catalog = await global.ensureQuellenCatalog(!!force);
        postFeedCatalog = (catalog || []).filter((p) => p && p.hasFeedInApp);
      } else {
        postFeedCatalog = [];
      }
      postFeedCatalogLoaded = true;
      return postFeedCatalog;
    } catch (e) {
      postFeedCatalog = [];
      throw e;
    } finally {
      postFeedCatalogBusy = false;
    }
  }

  function postFeedPreviewUrl(image) {
    const src = String(image || "").trim();
    if (!src) return "";
    const origin = global.SITE_ORIGIN || global.location.origin;
    try {
      return new URL(src, origin).href;
    } catch (e) {
      return src;
    }
  }

  function renderPostFeedRow(post) {
    const img = postFeedPreviewUrl(post.feedImage);
    const date = post.date ? String(post.date).slice(0, 10) : "";
    return `<article class="feed-post-row">
      <div class="feed-post-thumb">${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : `<span class="feed-post-thumb-empty">🖼</span>`}</div>
      <div class="feed-post-main">
        <div class="feed-post-title">${esc(post.title || post.filename || "Beitrag")}</div>
        <div class="feed-post-meta">${esc(post.category || "")}${date ? ` · ${esc(date)}` : ""}${post.id ? ` · ${esc(post.id)}` : ""}</div>
      </div>
      <div class="feed-post-actions">
        <button class="btn" type="button" data-feed-post-edit="${esc(post.filename)}" title="Im Beitrags-Editor bearbeiten">Bearbeiten</button>
        <button class="btn danger" type="button" data-feed-post-remove="${esc(post.filename)}" title="Nur aus dem Besucher-Feed entfernen">Aus Feed entfernen</button>
      </div>
    </article>`;
  }

  function renderPostFeedPanel() {
    const rows = postFeedCatalog.slice().sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
    return `<div class="panel news-panel feed-posts-panel">
      <div class="section-head"><h3>Bildbeiträge im Besucher-Feed</h3><span>${rows.length} aktiv</span></div>
      <div class="notice-note wide" style="margin-bottom:10px;line-height:1.5">
        Hier siehst du alle Beiträge, die aktuell im <strong>Feed-Tab der Besucher-App</strong> erscheinen.
        <strong>Aus Feed entfernen</strong> blendet nur den Feed-Eintrag aus — der Beitrag bleibt unter Beiträge erhalten.
        Neuen Bildbeitrag anlegen: <button class="btn" type="button" data-tab="quellen">Beiträge → Feed-Bild</button>
      </div>
      <div class="news-manage-toolbar">
        <button class="btn" id="feedPostRefreshBtn" type="button"${postFeedCatalogBusy ? " disabled" : ""}>${postFeedCatalogBusy ? "Lädt…" : "Liste aktualisieren"}</button>
        <a class="btn" href="${esc((global.SITE_ORIGIN || location.origin) + "/#feed")}" target="_blank" rel="noopener">Feed in App öffnen</a>
        <a class="btn" href="${esc((global.SITE_ORIGIN || location.origin) + "/test/#feed")}" target="_blank" rel="noopener">Feed in Test-App</a>
      </div>
      <div class="feed-post-list">${rows.length ? rows.map(renderPostFeedRow).join("") : `<div class="empty">${postFeedCatalogBusy ? "Bildbeiträge werden geladen…" : "Kein aktiver Bildbeitrag im Feed. Lege in Beiträge ein Feed-Bild an und veröffentliche."}</div>`}</div>
    </div>`;
  }

  async function removePostFromFeed(filename) {
    if (!filename) return;
    if (!confirm("Diesen Bildbeitrag aus dem Besucher-Feed entfernen?\n\nDer Beitrag selbst bleibt erhalten.")) return;
    try {
      const data = typeof global.fetchPostMarkdownForAdmin === "function"
        ? await global.fetchPostMarkdownForAdmin(filename)
        : await workerGet(`api/admin/post?filename=${encodeURIComponent(filename)}`);
      if (!data || !data.markdown) throw new Error("Beitrag konnte nicht geladen werden");
      const feed = { enabled: false, image: "", originalImage: "", alt: "", shareEnabled: false };
      const markdown = global.DARQuellen
        ? global.DARQuellen.mergeFeedFrontmatter(data.markdown, feed)
        : data.markdown;
      await workerPost("post/update", {
        filename,
        markdown,
        sha: data.sha || "",
        skipPush: true
      });
      if (typeof global.addAdminLog === "function") {
        global.addAdminLog("Feed", "Bildbeitrag entfernt", filename);
      }
      toast("Aus Besucher-Feed entfernt");
      postFeedCatalogLoaded = false;
      await ensurePostFeedCatalog(true);
      if (typeof global.renderShell === "function") global.renderShell();
    } catch (e) {
      toast(e.message || "Entfernen fehlgeschlagen");
    }
  }

  function renderRow(item) {
    const st = feedStatus(item);
    return `<details class="news-row">
      <summary>
        <div><div class="news-row-title">${esc(item.title || "Ohne Titel")}</div><div class="news-row-meta">${esc(item.category || "")} · ${esc(item.type || "")} · ${esc(item.cardSize || "medium")} · ${esc(st)}</div></div>
        <div class="news-row-badges">${statusPill(st)}${item.pinned ? `<span class="news-pill draft">Pin</span>` : ""}${item.badgeNeu ? `<span class="news-pill live">Neu</span>` : ""}</div>
      </summary>
      <div class="news-row-body">
        <p class="news-row-preview">${esc(item.preview || "")}</p>
        <div class="news-row-actions">
          <button class="btn" data-feed-edit="${esc(item.id)}" type="button">Bearbeiten</button>
          <button class="btn primary" data-feed-live="${esc(item.id)}" type="button">Live</button>
          <button class="btn" data-feed-dup="${esc(item.id)}" type="button">Duplizieren</button>
          <button class="btn" data-feed-up="${esc(item.id)}" type="button">↑</button>
          <button class="btn" data-feed-down="${esc(item.id)}" type="button">↓</button>
          <button class="btn danger" data-feed-delete="${esc(item.id)}" type="button">Löschen</button>
        </div>
      </div>
    </details>`;
  }

  function renderFeedTab() {
    const rows = filteredItems();
    return `<section class="news-workspace feed-admin-workspace">
      ${renderPostFeedPanel()}
      <details class="panel news-panel feed-legacy-panel">
        <summary class="section-head" style="cursor:pointer;list-style:none"><h3>Manuelle Feed-Karten (optional)</h3><span>${rows.length} · ${feedStaging ? "Staging" : "Live"}</span></summary>
        <div class="feed-legacy-body">
        <div class="notice-note wide" style="grid-column:1/-1;margin:10px 0;line-height:1.45">Der Besucher-Feed zeigt standardmäßig nur <strong>Bildbeiträge aus Beiträgen</strong>. Manuelle Karten sind optional und meist nicht nötig.</div>
        <div class="news-manage-toolbar">
          <select class="field" id="feedEnvSelect">
            <option value="staging"${feedStaging ? " selected" : ""}>Dar Test (Staging)</option>
            <option value="live"${!feedStaging ? " selected" : ""}>Live-Besucher</option>
          </select>
          <button class="btn" id="feedRefreshBtn" type="button"${feedLoading ? " disabled" : ""}>${feedLoading ? "Lädt…" : "Aktualisieren"}</button>
        </div>
        ${feedError ? `<div class="notice-note" style="color:#ffc9c3">${esc(feedError)}</div>` : ""}
        <div class="notice-note wide" style="grid-column:1/-1;margin-bottom:10px;border-color:rgba(239,215,142,.35)">
          <strong>Hintergrundbilder:</strong> Automatischer Bild-Pool — Status unter
          <button class="btn" type="button" data-tab="feed-bg" style="margin-left:8px">Feed · Auto-Hintergründe</button>
        </div>
        ${renderForm()}
        </div>
      </details>
      <div class="panel news-panel">
        <div class="section-head"><h3>Manuelle Karten · Übersicht</h3><span>${(feedIndex.items || []).length} gesamt</span></div>
        <div class="news-manage-toolbar">
          <input class="field" id="feedSearchInput" type="search" placeholder="Karte suchen…" value="${esc(feedSearch)}">
          <select class="field" id="feedFilterSelect">
            <option value="all"${feedFilter === "all" ? " selected" : ""}>Alle</option>
            <option value="live"${feedFilter === "live" ? " selected" : ""}>Live</option>
            <option value="draft"${feedFilter === "draft" ? " selected" : ""}>Entwurf</option>
            <option value="expired"${feedFilter === "expired" ? " selected" : ""}>Abgelaufen</option>
            <option value="deleted"${feedFilter === "deleted" ? " selected" : ""}>Gelöscht</option>
          </select>
        </div>
        <div class="news-manage-list">${rows.length ? rows.map(renderRow).join("") : `<div class="empty">${feedLoading ? "Feed wird geladen…" : "Keine Karten in diesem Filter."}</div>`}</div>
      </div>
    </section>`;
  }

  async function saveFeed(statusOverride) {
    const draft = readFormDraft();
    if (!draft.title) {
      toast("Titel ist Pflicht");
      return;
    }
    if (statusOverride) draft.status = statusOverride;
    if (draft.status === "live" && !hasValidTarget(draft)) {
      toast("Live-Karte braucht ein gültiges Ziel (Typ + ID oder URL)");
      return;
    }
    draft.expiresAt = visibilityExpiresAt(draft.visibility, draft.startsAt, draft.expiresAt);
    if (!draft.id) draft.id = `feed-${Date.now().toString(36)}`;
    draft.staging = feedStaging;
    const btn = document.getElementById("feedSaveBtn");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Speichere…";
    }
    try {
      await workerPost("api/admin/feed/save", draft);
      if (typeof global.addAdminLog === "function") {
        global.addAdminLog("Feed", statusOverride === "live" ? "Live veröffentlicht" : "Gespeichert", draft.title);
      }
      toast(statusOverride === "live" ? "Feed-Karte live veröffentlicht" : "Feed-Karte gespeichert");
      editingFeedId = draft.id;
      await ensureFeedLoaded(true);
      if (typeof global.renderShell === "function") global.renderShell();
    } catch (e) {
      toast(e.message || "Speichern fehlgeschlagen");
      if (btn) {
        btn.disabled = false;
        btn.textContent = editingFeedId ? "Speichern" : "Karte anlegen";
      }
    }
  }

  async function deleteFeed(id, hard) {
    if (!confirm(hard ? "Karte endgültig löschen?" : "Karte archivieren/löschen?\n\nSie verschwindet aus der Besucher-App.")) return;
    try {
      await workerPost("api/admin/feed/delete", { id, hard: !!hard, staging: feedStaging });
      toast("Feed-Karte gelöscht");
      if (editingFeedId === id) editingFeedId = null;
      await ensureFeedLoaded(true);
      if (typeof global.renderShell === "function") global.renderShell();
    } catch (e) {
      toast(e.message || "Löschen fehlgeschlagen");
    }
  }

  async function duplicateFeed(id) {
    const item = (feedIndex.items || []).find((x) => String(x.id) === String(id));
    if (!item) return;
    const copy = {
      ...item,
      id: `feed-${Date.now().toString(36)}`,
      title: `${item.title || "Karte"} (Kopie)`,
      status: "draft",
      staging: feedStaging
    };
    try {
      await workerPost("api/admin/feed/save", copy);
      toast("Karte dupliziert");
      editingFeedId = copy.id;
      await ensureFeedLoaded(true);
      if (typeof global.renderShell === "function") global.renderShell();
    } catch (e) {
      toast(e.message || "Duplizieren fehlgeschlagen");
    }
  }

  async function moveFeed(id, dir) {
    const items = filteredItems();
    const idx = items.findIndex((x) => String(x.id) === String(id));
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= items.length) return;
    const swapped = items.slice();
    const tmp = swapped[idx];
    swapped[idx] = swapped[j];
    swapped[j] = tmp;
    try {
      await workerPost("api/admin/feed/reorder", {
        staging: feedStaging,
        order: swapped.map((x) => x.id)
      });
      await ensureFeedLoaded(true);
      if (typeof global.renderShell === "function") global.renderShell();
    } catch (e) {
      toast(e.message || "Reihenfolge fehlgeschlagen");
    }
  }

  function bindFeedUi() {
    const env = document.getElementById("feedEnvSelect");
    if (env) {
      env.onchange = async () => {
        feedStaging = env.value !== "live";
        feedLoaded = false;
        await ensureFeedLoaded(true);
        if (typeof global.renderShell === "function") global.renderShell();
      };
    }
    const refresh = document.getElementById("feedRefreshBtn");
    if (refresh) {
      refresh.onclick = async () => {
        await ensureFeedLoaded(true);
        toast("Feed aktualisiert");
        if (typeof global.renderShell === "function") global.renderShell();
      };
    }
    const search = document.getElementById("feedSearchInput");
    if (search) {
      search.oninput = () => {
        feedSearch = search.value;
        if (typeof global.renderShell === "function") global.renderShell();
      };
    }
    const filter = document.getElementById("feedFilterSelect");
    if (filter) {
      filter.onchange = () => {
        feedFilter = filter.value;
        if (typeof global.renderShell === "function") global.renderShell();
      };
    }
    const saveBtn = document.getElementById("feedSaveBtn");
    if (saveBtn) saveBtn.onclick = () => saveFeed(null);
    const pubBtn = document.getElementById("feedPublishBtn");
    if (pubBtn) pubBtn.onclick = () => saveFeed("live");
    const previewBtn = document.getElementById("feedPreviewBtn");
    if (previewBtn) {
      previewBtn.onclick = () => {
        const origin = global.SITE_ORIGIN || location.origin;
        global.open(`${origin}/test/#home`, "_blank", "noopener");
      };
    }
    const cancelBtn = document.getElementById("feedCancelEditBtn");
    if (cancelBtn) {
      cancelBtn.onclick = () => {
        editingFeedId = null;
        if (typeof global.renderShell === "function") global.renderShell();
      };
    }
    document.querySelectorAll("[data-feed-edit]").forEach((btn) => {
      btn.onclick = () => {
        editingFeedId = btn.dataset.feedEdit;
        if (typeof global.renderShell === "function") global.renderShell();
      };
    });
    document.querySelectorAll("[data-feed-live]").forEach((btn) => {
      btn.onclick = async () => {
        const item = (feedIndex.items || []).find((x) => String(x.id) === String(btn.dataset.feedLive));
        if (!item) return;
        editingFeedId = item.id;
        try {
          await workerPost("api/admin/feed/save", { ...item, status: "live", staging: feedStaging });
          toast("Live veröffentlicht");
          await ensureFeedLoaded(true);
          if (typeof global.renderShell === "function") global.renderShell();
        } catch (e) {
          toast(e.message || "Live fehlgeschlagen");
        }
      };
    });
    document.querySelectorAll("[data-feed-dup]").forEach((btn) => {
      btn.onclick = () => duplicateFeed(btn.dataset.feedDup);
    });
    document.querySelectorAll("[data-feed-delete]").forEach((btn) => {
      btn.onclick = () => deleteFeed(btn.dataset.feedDelete, false);
    });
    document.querySelectorAll("[data-feed-up]").forEach((btn) => {
      btn.onclick = () => moveFeed(btn.dataset.feedUp, -1);
    });
    document.querySelectorAll("[data-feed-down]").forEach((btn) => {
      btn.onclick = () => moveFeed(btn.dataset.feedDown, 1);
    });
    const postRefresh = document.getElementById("feedPostRefreshBtn");
    if (postRefresh) {
      postRefresh.onclick = async () => {
        postFeedCatalogLoaded = false;
        await ensurePostFeedCatalog(true);
        toast("Bildbeiträge aktualisiert");
        if (typeof global.renderShell === "function") global.renderShell();
      };
    }
    document.querySelectorAll("[data-feed-post-edit]").forEach((btn) => {
      btn.onclick = async () => {
        const filename = btn.dataset.feedPostEdit;
        if (!filename) return;
        if (typeof global.openAdminQuellenPost === "function") {
          await global.openAdminQuellenPost(filename);
        } else if (typeof global.renderShell === "function") {
          toast("Editor konnte nicht geöffnet werden");
        }
      };
    });
    document.querySelectorAll("[data-feed-post-remove]").forEach((btn) => {
      btn.onclick = () => removePostFromFeed(btn.dataset.feedPostRemove);
    });
  }

  global.DARFeedAdmin = {
    renderFeedTab,
    bindFeedUi,
    ensureFeedLoaded,
    ensurePostFeedCatalog,
    removePostFromFeed,
    resetEdit: () => {
      editingFeedId = null;
    }
  };
})(window);
