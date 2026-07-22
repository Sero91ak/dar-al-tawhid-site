/* DAR AL TAWḤĪD – geprüfte Quellenbibliothek (Test-App) */
(function attachCanonicalSourceLibrary(global) {
  "use strict";

  const BOOKS_URL = "/data/books-library.json";
  const SCHOLARS_URL = "/data/scholars-library.json";
  const HIDDEN_PLACEHOLDERS = new Set([
    "autor nicht verifiziert",
    "autor unbekannt",
    "nicht angegeben",
    "unbekanntes werk",
    "ungeprüfter autor"
  ]);

  const state = {
    books: [],
    scholars: [],
    categories: [],
    booksById: new Map(),
    scholarsById: new Map(),
    status: "idle",
    error: "",
    ui: { tab: "books", query: "", category: "", filtersOpen: false }
  };

  let loading = null;

  function esc(value) {
    if (global.esc) return global.esc(value);
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function navigate(view, value) {
    if (typeof global.navigate === "function") global.navigate(view, value || "");
    else global.location.hash = value ? `#${view}/${encodeURIComponent(value)}` : `#${view}`;
  }

  function normalizeSearchText(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[ʾʿ'’`´]/g, "")
      .replace(/[^a-z0-9\s-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isHiddenPlaceholder(value) {
    const key = normalizeSearchText(value);
    return !key || HIDDEN_PLACEHOLDERS.has(key);
  }

  function isVerifiedBook(book) {
    return Boolean(
      book
      && book.verification === "verified"
      && book.id
      && book.title
      && book.author
      && !isHiddenPlaceholder(book.title)
      && !isHiddenPlaceholder(book.author)
    );
  }

  function isQuotedScholar(scholar) {
    return Boolean(
      scholar
      && scholar.role === "quotedScholar"
      && scholar.id
      && scholar.name
      && !isHiddenPlaceholder(scholar.name)
    );
  }

  function bookSearchBlob(book) {
    return normalizeSearchText([
      book.title,
      book.author,
      book.category,
      ...(book.aliases || []),
      ...(book.quotedScholars || [])
    ].join(" "));
  }

  function scholarSearchBlob(scholar) {
    const works = (scholar.citedWorkIds || [])
      .map((id) => state.booksById.get(id)?.title || "")
      .filter(Boolean);
    return normalizeSearchText([scholar.name, ...works].join(" "));
  }

  function matchesQuery(blob, query) {
    const q = normalizeSearchText(query);
    if (!q) return true;
    return q.split(" ").filter(Boolean).every((token) => blob.includes(token));
  }

  function setIndexes() {
    state.booksById = new Map(state.books.map((book) => [book.id, book]));
    state.scholarsById = new Map(state.scholars.map((scholar) => [scholar.id, scholar]));
  }

  async function loadCanonical(force) {
    if (!force && state.status === "ready") return state;
    if (!force && state.status === "loading" && loading) return loading;

    state.status = "loading";
    state.error = "";
    loading = Promise.all([
      fetch(BOOKS_URL, { cache: "no-cache" }).then((res) => {
        if (!res.ok) throw new Error(`books ${res.status}`);
        return res.json();
      }),
      fetch(SCHOLARS_URL, { cache: "no-cache" }).then((res) => {
        if (!res.ok) throw new Error(`scholars ${res.status}`);
        return res.json();
      })
    ]).then(([booksData, scholarsData]) => {
      const books = (Array.isArray(booksData.books) ? booksData.books : []).filter(isVerifiedBook);
      const scholars = (Array.isArray(scholarsData.scholars) ? scholarsData.scholars : []).filter(isQuotedScholar);
      const categories = Array.isArray(booksData.categories) && booksData.categories.length
        ? booksData.categories.filter(Boolean)
        : [...new Set(books.map((book) => book.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "de"));

      if (!books.length) throw new Error("no verified books");

      state.books = books;
      state.scholars = scholars;
      state.categories = categories;
      setIndexes();
      state.status = "ready";
      state.error = "";
      return state;
    }).catch((error) => {
      console.error("Quellenbibliothek konnte nicht geladen werden", error);
      state.books = [];
      state.scholars = [];
      state.categories = [];
      state.booksById = new Map();
      state.scholarsById = new Map();
      state.status = "error";
      state.error = String(error?.message || error || "load failed");
      return state;
    }).finally(() => {
      loading = null;
    });

    return loading;
  }

  function isReady() {
    return state.status === "ready";
  }

  function isLoading() {
    return state.status === "loading" || state.status === "idle";
  }

  function hasError() {
    return state.status === "error";
  }

  function categoryAccent(category) {
    const key = normalizeSearchText(category || "werk");
    const palette = [
      { border: "rgba(201,168,106,.42)", title: "#e8d4a8", chip: "rgba(201,168,106,.14)" },
      { border: "rgba(143,176,201,.38)", title: "#d4e4ef", chip: "rgba(143,176,201,.14)" },
      { border: "rgba(168,143,201,.38)", title: "#dfd0f0", chip: "rgba(168,143,201,.14)" },
      { border: "rgba(143,201,168,.34)", title: "#d2efdf", chip: "rgba(143,201,168,.13)" },
      { border: "rgba(201,143,143,.34)", title: "#efd4d4", chip: "rgba(201,143,143,.13)" }
    ];
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = (hash + key.charCodeAt(i) * (i + 3)) % palette.length;
    return palette[hash];
  }

  function ensureStyles() {
    if (document.getElementById("canonical-source-library-styles")) return;
    const style = document.createElement("style");
    style.id = "canonical-source-library-styles";
    style.textContent = `
      .qsrc-shell{
        --qsrc-bg:#121018;
        --qsrc-bg-soft:#18141f;
        --qsrc-panel:rgba(24,20,30,.94);
        --qsrc-line:rgba(214,194,150,.14);
        --qsrc-line-soft:rgba(255,255,255,.06);
        --qsrc-gold:#d8c08e;
        --qsrc-gold-soft:rgba(216,192,142,.16);
        --qsrc-text:#f3eee4;
        --qsrc-muted:rgba(243,238,228,.58);
        --qsrc-muted2:rgba(243,238,228,.42);
        display:grid;
        gap:10px;
        margin:0 auto;
        width:100%;
        max-width:100%;
        padding:2px 0 8px;
        color:var(--qsrc-text);
        background:
          radial-gradient(120% 80% at 50% -10%, rgba(216,192,142,.08), transparent 55%),
          radial-gradient(90% 60% at 100% 0%, rgba(120,96,160,.07), transparent 50%),
          linear-gradient(180deg, var(--qsrc-bg-soft), var(--qsrc-bg));
        border-radius:18px;
      }
      .qsrc-sticky{
        position:sticky;
        top:0;
        z-index:18;
        padding:10px 12px 12px;
        margin:0;
        border:1px solid var(--qsrc-line);
        border-radius:16px;
        background:var(--qsrc-panel);
        backdrop-filter:blur(18px);
        -webkit-backdrop-filter:blur(18px);
        box-shadow:0 10px 28px rgba(0,0,0,.22);
      }
      .qsrc-control-head{
        display:grid;
        grid-template-columns:1fr auto;
        gap:10px;
        align-items:center;
        margin-bottom:10px;
      }
      .qsrc-tabs{
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:0;
        padding:3px;
        border:1px solid var(--qsrc-line-soft);
        border-radius:999px;
        background:rgba(0,0,0,.18);
      }
      .qsrc-tab{
        border:0;
        background:transparent;
        color:var(--qsrc-muted);
        border-radius:999px;
        padding:8px 12px;
        font:inherit;
        font-size:12px;
        font-weight:700;
        letter-spacing:.03em;
        cursor:pointer;
        text-align:center;
        transition:background .18s ease,color .18s ease;
      }
      .qsrc-tab.is-active{
        background:linear-gradient(180deg, rgba(216,192,142,.22), rgba(216,192,142,.10));
        color:var(--qsrc-gold);
        box-shadow:inset 0 0 0 1px rgba(216,192,142,.22);
      }
      .qsrc-meta-pill{
        justify-self:end;
        align-self:center;
        margin:0;
        padding:6px 10px;
        border-radius:999px;
        border:1px solid var(--qsrc-line-soft);
        background:rgba(255,255,255,.03);
        color:var(--qsrc-muted);
        font-size:10px;
        font-weight:700;
        letter-spacing:.08em;
        text-transform:uppercase;
        white-space:nowrap;
      }
      .qsrc-toolbar{
        display:grid;
        grid-template-columns:minmax(0,1fr) auto;
        gap:8px;
        align-items:center;
      }
      .qsrc-search-wrap{position:relative;min-width:0}
      .qsrc-search-icon{
        position:absolute;
        left:13px;
        top:50%;
        transform:translateY(-50%);
        width:15px;
        height:15px;
        opacity:.45;
        pointer-events:none;
        color:var(--qsrc-muted);
      }
      .qsrc-search{
        width:100%;
        min-height:42px;
        border:1px solid var(--qsrc-line-soft);
        border-radius:12px;
        background:rgba(0,0,0,.22);
        color:var(--qsrc-text);
        padding:10px 12px 10px 38px;
        font:inherit;
        font-size:14px;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.03);
      }
      .qsrc-search::placeholder{color:var(--qsrc-muted2)}
      .qsrc-search:focus{
        outline:none;
        border-color:rgba(216,192,142,.34);
        box-shadow:0 0 0 3px rgba(216,192,142,.08);
      }
      .qsrc-control-btn{
        border:1px solid var(--qsrc-line-soft);
        background:rgba(255,255,255,.03);
        color:var(--qsrc-text);
        border-radius:12px;
        min-height:42px;
        padding:0 12px;
        font:inherit;
        font-size:11px;
        font-weight:750;
        cursor:pointer;
        display:inline-flex;
        align-items:center;
        gap:6px;
        white-space:nowrap;
      }
      .qsrc-control-btn.is-active{
        border-color:rgba(216,192,142,.34);
        background:var(--qsrc-gold-soft);
        color:var(--qsrc-gold);
      }
      .qsrc-control-btn .qsrc-caret{opacity:.72;font-size:10px}
      .qsrc-filter-panel{
        grid-column:1 / -1;
        display:grid;
        gap:8px;
        padding:10px;
        margin-top:2px;
        border:1px solid var(--qsrc-line-soft);
        border-radius:12px;
        background:rgba(0,0,0,.18);
      }
      .qsrc-filter-panel[hidden]{display:none!important}
      .qsrc-filter-grid{display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-start}
      .qsrc-filter{
        border:1px solid var(--qsrc-line-soft);
        background:transparent;
        color:var(--qsrc-muted);
        border-radius:999px;
        padding:6px 10px;
        font:inherit;
        font-size:11px;
        font-weight:700;
        cursor:pointer;
      }
      .qsrc-filter.is-active{
        border-color:rgba(216,192,142,.34);
        background:var(--qsrc-gold-soft);
        color:var(--qsrc-gold);
      }
      .qsrc-filter-count{opacity:.7;font-weight:800;margin-left:3px}
      .qsrc-active-chip{
        grid-column:1 / -1;
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:8px;
        padding:7px 10px;
        border-radius:10px;
        border:1px dashed rgba(216,192,142,.24);
        background:rgba(216,192,142,.06);
        color:var(--qsrc-gold);
        font-size:11px;
      }
      .qsrc-active-chip button{
        border:0;
        background:transparent;
        color:inherit;
        font:inherit;
        font-weight:700;
        cursor:pointer;
        opacity:.85;
      }
      .qsrc-grid{display:grid;gap:8px;padding:0 2px}
      .qsrc-grid-compact{padding-top:0}
      .qsrc-card{
        display:grid;
        grid-template-columns:minmax(0,1fr) auto;
        gap:12px;
        align-items:center;
        border:1px solid var(--qsrc-line-soft);
        border-left:3px solid var(--qsrc-accent-border, rgba(216,192,142,.34));
        border-radius:14px;
        padding:12px 13px;
        background:linear-gradient(135deg, rgba(255,255,255,.04), rgba(255,255,255,.015));
        color:inherit;
        text-align:left;
        width:100%;
        cursor:pointer;
        box-shadow:0 8px 20px rgba(0,0,0,.14);
        transition:transform .16s ease,border-color .16s ease,background .16s ease;
      }
      .qsrc-card:hover{
        transform:translateY(-1px);
        border-color:rgba(216,192,142,.22);
        background:linear-gradient(135deg, rgba(255,255,255,.06), rgba(255,255,255,.02));
      }
      .qsrc-card-compact{min-height:0}
      .qsrc-card.is-hidden{display:none!important}
      .qsrc-card-body{min-width:0;display:grid;gap:6px}
      .qsrc-card-kicker{
        display:block;
        font-size:9px;
        font-weight:800;
        letter-spacing:.16em;
        text-transform:uppercase;
        color:var(--qsrc-muted2);
      }
      .qsrc-card-head{
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap:10px;
      }
      .qsrc-card-title{
        display:block;
        font-family:var(--serif,Georgia,"Times New Roman",serif);
        font-size:17px;
        font-weight:650;
        line-height:1.28;
        color:var(--qsrc-accent-title,var(--qsrc-gold));
        letter-spacing:.01em;
        overflow-wrap:anywhere;
      }
      .qsrc-card-badge{
        flex:0 0 auto;
        font-size:9px;
        font-weight:800;
        letter-spacing:.1em;
        text-transform:uppercase;
        color:var(--qsrc-muted);
        white-space:nowrap;
        padding:4px 7px;
        border-radius:999px;
        border:1px solid var(--qsrc-line-soft);
        background:rgba(0,0,0,.16);
      }
      .qsrc-card-author{
        display:grid;
        gap:2px;
        font-family:var(--sans,system-ui,sans-serif);
        overflow-wrap:anywhere;
      }
      .qsrc-card-author .qsrc-label{
        display:block;
        font-size:9px;
        font-weight:800;
        letter-spacing:.14em;
        text-transform:uppercase;
        color:var(--qsrc-muted2);
      }
      .qsrc-card-author .qsrc-author-name{
        display:block;
        font-size:13px;
        line-height:1.38;
        font-style:italic;
        color:var(--qsrc-text);
        opacity:.88;
      }
      .qsrc-card-foot{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:8px;
        margin-top:2px;
      }
      .qsrc-card-category{
        display:inline-flex;
        align-items:center;
        max-width:100%;
        font-size:10px;
        font-weight:750;
        letter-spacing:.08em;
        text-transform:uppercase;
        color:var(--qsrc-gold);
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
        padding:4px 8px;
        border-radius:999px;
        background:var(--qsrc-accent-chip, var(--qsrc-gold-soft));
        border:1px solid rgba(216,192,142,.12);
      }
      .qsrc-chevron{
        opacity:.34;
        font-size:1.05rem;
        line-height:1;
        align-self:center;
        color:var(--qsrc-gold);
      }
      .qsrc-empty,.qsrc-error,.qsrc-loading{
        border:1px dashed var(--qsrc-line-soft);
        border-radius:14px;
        padding:16px;
        text-align:center;
        color:var(--qsrc-muted);
        font-size:13px;
        background:rgba(0,0,0,.14);
      }
      .qsrc-error button,.qsrc-retry{
        margin-top:10px;
        border:1px solid var(--qsrc-line-soft);
        background:rgba(255,255,255,.04);
        color:var(--qsrc-text);
        border-radius:10px;
        padding:8px 12px;
        font:inherit;
        font-weight:700;
        cursor:pointer;
      }
      .qsrc-detail{display:grid;gap:12px;padding:0 2px}
      .qsrc-detail-block{
        border:1px solid var(--qsrc-line-soft);
        border-radius:14px;
        padding:12px;
        background:rgba(255,255,255,.03);
      }
      .qsrc-detail-block h3{margin:0 0 6px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--qsrc-muted)}
      .qsrc-detail-block p{margin:0;line-height:1.45;font-size:13px;color:var(--qsrc-text)}
      .qsrc-alias-list,.qsrc-link-list{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
      .qsrc-chip{
        font-size:11px;
        border-radius:999px;
        padding:5px 9px;
        background:rgba(255,255,255,.06);
        border:1px solid var(--qsrc-line-soft);
        color:var(--qsrc-text);
      }
      .qsrc-post-list{display:grid;gap:6px}
      .lib-canonical-wrap{margin:20px 0 6px;padding-top:18px;border-top:1px solid var(--qsrc-line-soft)}
      .lib-canonical-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:10px}
      .lib-canonical-head h3{margin:0;font-size:1.05rem;color:var(--qsrc-gold)}
      .lib-canonical-head p{margin:4px 0 0;opacity:.72;font-size:.86rem;max-width:52ch;color:var(--qsrc-muted)}
      .lib-canonical-count{white-space:nowrap;font-size:.8rem;opacity:.68;color:var(--qsrc-muted)}
      .lib-canonical-actions{margin-top:10px}
      .lib-canonical-open{
        border:1px solid var(--qsrc-line-soft);
        background:rgba(255,255,255,.04);
        color:var(--qsrc-text);
        border-radius:10px;
        padding:8px 12px;
        font:inherit;
        font-weight:700;
        cursor:pointer;
      }
      @media(max-width:640px){
        .qsrc-sticky{padding:9px 10px 10px}
        .qsrc-control-head{grid-template-columns:1fr;gap:8px}
        .qsrc-meta-pill{justify-self:start}
        .qsrc-toolbar{grid-template-columns:1fr}
        .qsrc-control-btn{justify-content:center;width:100%}
        .qsrc-card-title{font-size:16px}
      }
    `;
    document.head.appendChild(style);
  }

  function setPageHeader(title, subtitle, eyebrow) {
    if (typeof global.setPageHeader === "function") return global.setPageHeader(title, subtitle, eyebrow || title);
    return `<div class="view-head"><h2>${esc(title)}</h2>${subtitle ? `<div class="view-desc">${esc(subtitle)}</div>` : ""}</div>`;
  }

  function postsByIds(ids) {
    const posts = Array.isArray(global.posts) ? global.posts : [];
    const map = new Map(posts.map((post) => [String(post.id), post]));
    return (ids || []).map((id) => map.get(String(id))).filter(Boolean);
  }

  function postCardHtml(post) {
    if (typeof global.postCard === "function") return global.postCard(post);
    return `<article class="post-card" data-nav="post" data-value="${esc(post.id)}"><h3>${esc(post.title)}</h3></article>`;
  }

  function filteredBooks() {
    return state.books.filter((book) => {
      if (state.ui.category && book.category !== state.ui.category) return false;
      return matchesQuery(bookSearchBlob(book), state.ui.query);
    });
  }

  function filteredScholars() {
    return state.scholars.filter((scholar) => matchesQuery(scholarSearchBlob(scholar), state.ui.query));
  }

  function renderLoading() {
    return `${setPageHeader("Quellenbibliothek", "Geprüfte historische Werke und zitierte Gelehrte", "Quellenbibliothek")}<section class="qsrc-shell"><div class="qsrc-loading">Quellenbibliothek wird geladen…</div></section>`;
  }

  function renderError() {
    return `${setPageHeader("Quellenbibliothek", "Geprüfte historische Werke und zitierte Gelehrte", "Quellenbibliothek")}<section class="qsrc-shell"><div class="qsrc-error"><p>Die Quellenbibliothek konnte momentan nicht geladen werden.</p><button type="button" class="qsrc-retry" data-qsrc-retry>Erneut versuchen</button></div></section>`;
  }

  function categoryBookCounts() {
    const counts = new Map();
    state.books.forEach((book) => {
      const cat = book.category || "Sonstige";
      counts.set(cat, (counts.get(cat) || 0) + 1);
    });
    return counts;
  }

  function activeCategoryLabel() {
    if (!state.ui.category) return "Alle Kategorien";
    return state.ui.category;
  }

  function renderCategoryFilters() {
    const counts = categoryBookCounts();
    const cats = [...counts.keys()].sort((a, b) => a.localeCompare(b, "de"));
    const allCount = state.books.length;
    const panelOpen = !!state.ui.filtersOpen;
    const buttons = [`<button type="button" class="qsrc-filter${state.ui.category === "" ? " is-active" : ""}" data-qsrc-category="">Alle <span class="qsrc-filter-count">${allCount}</span></button>`];
    cats.forEach((cat) => {
      const active = state.ui.category === cat ? " is-active" : "";
      buttons.push(`<button type="button" class="qsrc-filter${active}" data-qsrc-category="${esc(cat)}">${esc(cat)} <span class="qsrc-filter-count">${counts.get(cat) || 0}</span></button>`);
    });
    return `${state.ui.category ? `<div class="qsrc-active-chip"><span>${esc(activeCategoryLabel())}</span><button type="button" data-qsrc-category="">Zurücksetzen</button></div>` : ""}
    <div class="qsrc-filter-panel" id="qsrcFilterPanel" ${panelOpen ? "" : "hidden"}>
      <div class="qsrc-filter-grid" role="toolbar" aria-label="Kategorien">${buttons.join("")}</div>
    </div>`;
  }

  function renderBookCard(book) {
    const search = bookSearchBlob(book);
    const postCount = Number(book.postCount || 0);
    const postLabel = postCount ? `${postCount} ${postCount === 1 ? "Beitrag" : "Beiträge"}` : "Katalog";
    const accent = categoryAccent(book.category);
    return `<button type="button" class="qsrc-card qsrc-card-compact" data-nav="quellen-book" data-value="${esc(book.id)}" data-qsrc-search="${esc(search)}" style="--qsrc-accent-border:${accent.border};--qsrc-accent-title:${accent.title};--qsrc-accent-chip:${accent.chip}">
      <span class="qsrc-card-body">
        <span class="qsrc-card-kicker">Werk</span>
        <span class="qsrc-card-head">
          <span class="qsrc-card-title">${esc(book.title)}</span>
          <span class="qsrc-card-badge">${esc(postLabel)}</span>
        </span>
        <span class="qsrc-card-author"><span class="qsrc-label">Autor des Werkes</span><span class="qsrc-author-name">${esc(book.author)}</span></span>
        <span class="qsrc-card-foot"><span class="qsrc-card-category">${esc(book.category || "Werk")}</span></span>
      </span>
      <span class="qsrc-chevron" aria-hidden="true">›</span>
    </button>`;
  }

  function renderScholarCard(scholar) {
    const works = (scholar.citedWorkIds || [])
      .map((id) => state.booksById.get(id))
      .filter(Boolean)
      .slice(0, 2);
    const workTitles = works.map((book) => book.title).join(", ");
    const search = scholarSearchBlob(scholar);
    const postCount = Number(scholar.postCount || 0);
    const accent = categoryAccent(works[0]?.category || "gelehrter");
    return `<button type="button" class="qsrc-card qsrc-card-compact" data-nav="quellen-scholar" data-value="${esc(scholar.id)}" data-qsrc-search="${esc(search)}" style="--qsrc-accent-border:${accent.border};--qsrc-accent-title:${accent.title};--qsrc-accent-chip:${accent.chip}">
      <span class="qsrc-card-body">
        <span class="qsrc-card-kicker">Gelehrter</span>
        <span class="qsrc-card-head">
          <span class="qsrc-card-title">${esc(scholar.name)}</span>
          <span class="qsrc-card-badge">${postCount} ${postCount === 1 ? "Beitrag" : "Beiträge"}</span>
        </span>
        <span class="qsrc-card-author"><span class="qsrc-label">Rolle</span><span class="qsrc-author-name">zitierter Gelehrter</span></span>
        ${workTitles ? `<span class="qsrc-card-foot"><span class="qsrc-card-category">${esc(workTitles)}</span></span>` : ""}
      </span>
      <span class="qsrc-chevron" aria-hidden="true">›</span>
    </button>`;
  }

  function renderList() {
    ensureStyles();
    if (isLoading()) return renderLoading();
    if (hasError()) return renderError();

    const books = filteredBooks();
    const scholars = filteredScholars();
    const activeTab = state.ui.tab === "scholars" ? "scholars" : "books";
    const totalLabel = activeTab === "scholars"
      ? (state.ui.query ? `${scholars.length} von ${state.scholars.length} Gelehrte` : `${state.scholars.length} verifizierte Gelehrte`)
      : (state.ui.query || state.ui.category ? `${books.length} von ${state.books.length} Werke` : `${state.books.length} verifizierte Werke`);

    const listHtml = activeTab === "scholars"
      ? (scholars.length
        ? scholars.map(renderScholarCard).join("")
        : `<div class="qsrc-empty">Keine Gelehrten gefunden.</div>`)
      : (books.length
        ? books.map(renderBookCard).join("")
        : `<div class="qsrc-empty">Keine Bücher gefunden.</div>`);

    return `${setPageHeader("Quellenbibliothek", "Historische Werke mit verifiziertem Autor. Zitierte Gelehrte werden getrennt ausgewiesen.", "Quellenbibliothek")}
<section class="qsrc-shell">
  <div class="qsrc-sticky">
    <div class="qsrc-control-head">
      <div class="qsrc-tabs" role="tablist">
        <button type="button" class="qsrc-tab${activeTab === "books" ? " is-active" : ""}" data-qsrc-tab="books" role="tab" aria-selected="${activeTab === "books"}">Bücher</button>
        <button type="button" class="qsrc-tab${activeTab === "scholars" ? " is-active" : ""}" data-qsrc-tab="scholars" role="tab" aria-selected="${activeTab === "scholars"}">Gelehrte</button>
      </div>
      <p id="qsrcMetaLine" class="qsrc-meta-pill">${esc(totalLabel)}</p>
    </div>
    <div class="qsrc-toolbar">
      <div class="qsrc-search-wrap">
        <svg class="qsrc-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
        <input id="qsrcSearchInput" class="qsrc-search" type="search" placeholder="Werk, Autor oder Kategorie suchen…" autocomplete="off" enterkeyhint="search" value="${esc(state.ui.query)}">
      </div>
      ${activeTab === "books" ? `<button type="button" class="qsrc-control-btn${state.ui.filtersOpen || state.ui.category ? " is-active" : ""}" data-qsrc-filter-toggle aria-expanded="${!!state.ui.filtersOpen}">Kategorien <span class="qsrc-caret">${state.ui.filtersOpen ? "▴" : "▾"}</span></button>` : ""}
      ${activeTab === "books" ? renderCategoryFilters() : ""}
    </div>
  </div>
  <div class="qsrc-grid qsrc-grid-compact" id="qsrcResults">${listHtml}</div>
</section>`;
  }

  function renderBookDetail(bookId) {
    ensureStyles();
    if (isLoading()) return renderLoading();
    if (hasError()) return renderError();

    const book = state.booksById.get(String(bookId || ""));
    if (!book) {
      return `${setPageHeader("Werk nicht gefunden", "Dieses Buch ist nicht in der geprüften Quellenbibliothek.", "Quellenbibliothek")}<section class="qsrc-empty">Das Werk konnte nicht gefunden werden.</section>`;
    }

    const aliases = (book.aliases || []).filter((alias) => alias && !isHiddenPlaceholder(alias));
    const quoted = (book.quotedScholars || []).filter((name) => name && !isHiddenPlaceholder(name));
    const relatedPosts = postsByIds(book.postIds);

    return `${setPageHeader(book.title, book.category || "Geprüftes Werk", "Quellenbibliothek")}
<section class="qsrc-detail">
  <article class="qsrc-detail-block">
    <h3>Autor</h3>
    <p>${esc(book.author)}</p>
  </article>
  ${aliases.length ? `<article class="qsrc-detail-block"><h3>Alternative Titel</h3><div class="qsrc-alias-list">${aliases.map((alias) => `<span class="qsrc-chip">${esc(alias)}</span>`).join("")}</div></article>` : ""}
  ${quoted.length ? `<article class="qsrc-detail-block"><h3>Zitierte Gelehrte</h3><p>Diese Gelehrten werden in Beiträgen aus diesem Werk zitiert. Sie sind nicht die historischen Autoren des Werkes.</p><div class="qsrc-alias-list">${quoted.map((name) => `<span class="qsrc-chip">${esc(name)}</span>`).join("")}</div></article>` : ""}
  <article class="qsrc-detail-block">
    <h3>Beiträge aus diesem Werk</h3>
    <p>${Number(book.postCount || relatedPosts.length || 0)} ${Number(book.postCount || relatedPosts.length || 0) === 1 ? "Beitrag" : "Beiträge"}</p>
    <div class="qsrc-post-list">${relatedPosts.length ? relatedPosts.map(postCardHtml).join("") : `<div class="qsrc-empty">Keine Beiträge verknüpft.</div>`}</div>
  </article>
</section>`;
  }

  function renderScholarDetail(scholarId) {
    ensureStyles();
    if (isLoading()) return renderLoading();
    if (hasError()) return renderError();

    const scholar = state.scholarsById.get(String(scholarId || ""));
    if (!scholar) {
      return `${setPageHeader("Gelehrter nicht gefunden", "Dieser Gelehrte ist nicht in der geprüften Quellenbibliothek.", "Quellenbibliothek")}<section class="qsrc-empty">Der Gelehrte konnte nicht gefunden werden.</section>`;
    }

    const works = (scholar.citedWorkIds || [])
      .map((id) => state.booksById.get(id))
      .filter(Boolean);
    const relatedPosts = postsByIds(scholar.postIds);

    return `${setPageHeader(scholar.name, "Zitierter Gelehrter", "Quellenbibliothek")}
<section class="qsrc-detail">
  <article class="qsrc-detail-block">
    <h3>Rolle</h3>
    <p>zitierter Gelehrter</p>
  </article>
  <article class="qsrc-detail-block">
    <h3>Werke mit Zitaten</h3>
    <p>Aussagen dieses Gelehrten werden in Beiträgen aus folgenden Werken zitiert. Er ist nicht automatisch Autor dieser Werke.</p>
    <div class="qsrc-link-list">${works.length ? works.map((book) => `<button type="button" class="qsrc-chip" data-nav="quellen-book" data-value="${esc(book.id)}">${esc(book.title)}</button>`).join("") : `<span class="qsrc-empty">Keine verknüpften Werke.</span>`}</div>
  </article>
  <article class="qsrc-detail-block">
    <h3>Beiträge</h3>
    <p>${Number(scholar.postCount || relatedPosts.length || 0)} ${Number(scholar.postCount || relatedPosts.length || 0) === 1 ? "Beitrag" : "Beiträge"}</p>
    <div class="qsrc-post-list">${relatedPosts.length ? relatedPosts.map(postCardHtml).join("") : `<div class="qsrc-empty">Keine Beiträge verknüpft.</div>`}</div>
  </article>
</section>`;
  }

  function renderRoute(route) {
    const view = route?.view || "books";
    const value = route?.value || "";
    if (view === "quellen-book") return renderBookDetail(value);
    if (view === "quellen-scholar") return renderScholarDetail(value);
    return renderList();
  }

  function applyClientFilters() {
    const input = document.getElementById("qsrcSearchInput");
    const meta = document.getElementById("qsrcMetaLine");
    const q = input ? input.value.trim() : state.ui.query;
    state.ui.query = q;

    document.querySelectorAll("#qsrcResults .qsrc-card").forEach((card) => {
      const blob = String(card.getAttribute("data-qsrc-search") || "");
      card.classList.toggle("is-hidden", !!q && !matchesQuery(blob, q));
    });

    if (!meta) return;
    const visible = document.querySelectorAll("#qsrcResults .qsrc-card:not(.is-hidden)").length;
    const all = document.querySelectorAll("#qsrcResults .qsrc-card").length;
    if (state.ui.tab === "scholars") {
      meta.textContent = q ? `${visible} von ${all} Gelehrte` : `${all} verifizierte Gelehrte`;
    } else {
      meta.textContent = q || state.ui.category ? `${visible} von ${all} Werke` : `${all} verifizierte Werke`;
    }
  }

  function bind() {
    document.querySelectorAll("[data-qsrc-tab]").forEach((btn) => {
      btn.onclick = () => {
        state.ui.tab = btn.getAttribute("data-qsrc-tab") || "books";
        state.ui.filtersOpen = false;
        if (typeof global.render === "function") global.render();
      };
    });

    document.querySelectorAll("[data-qsrc-filter-toggle]").forEach((btn) => {
      btn.onclick = () => {
        state.ui.filtersOpen = !state.ui.filtersOpen;
        if (typeof global.render === "function") global.render();
      };
    });

    document.querySelectorAll("[data-qsrc-category]").forEach((btn) => {
      btn.onclick = () => {
        state.ui.category = btn.getAttribute("data-qsrc-category") || "";
        state.ui.filtersOpen = false;
        if (typeof global.render === "function") global.render();
      };
    });

    const searchInput = document.getElementById("qsrcSearchInput");
    if (searchInput) {
      searchInput.oninput = applyClientFilters;
      if (state.ui.query) applyClientFilters();
    }

    document.querySelectorAll("[data-qsrc-retry]").forEach((btn) => {
      btn.onclick = () => {
        state.status = "idle";
        loadCanonical(true).then(() => {
          if (typeof global.render === "function") global.render();
        });
      };
    });

    document.querySelectorAll("[data-nav]").forEach((el) => {
      if (typeof global.bindNavActivation === "function") global.bindNavActivation(el);
    });
  }

  function renderBibliothekAddon() {
    if (!isReady() || !state.books.length) return "";
    const preview = state.books.slice(0, 3).map((book) => {
      const accent = categoryAccent(book.category);
      return `<article class="lib-canonical-card qsrc-card" style="cursor:default;grid-template-columns:1fr;--qsrc-accent-border:${accent.border};--qsrc-accent-title:${accent.title};--qsrc-accent-chip:${accent.chip}">
      <span class="qsrc-card-kicker">${esc(book.category || "Geprüftes Werk")}</span>
      <span class="qsrc-card-title">${esc(book.title)}</span>
      <span class="qsrc-card-author"><span class="qsrc-label">Autor</span><span class="qsrc-author-name">${esc(book.author)}</span></span>
      <span class="qsrc-card-foot"><span class="qsrc-card-badge">${Number(book.postCount || 0)} Beiträge</span></span>
    </article>`;
    }).join("");

    return `<section class="lib-canonical-wrap" aria-label="Quellenbibliothek">
      <div class="lib-canonical-head">
        <div>
          <h3>Quellenbibliothek</h3>
          <p>Historische islamische Werke, aus denen Beiträge und Aussagen zitiert werden. Nur verifizierte Werke mit eindeutig zugeordnetem Autor.</p>
        </div>
        <span class="lib-canonical-count">${state.books.length} Werke · ${state.scholars.length} Gelehrte</span>
      </div>
      <div class="qsrc-grid">${preview}</div>
      <div class="lib-canonical-actions">
        <button type="button" class="lib-canonical-open" data-nav="books">Quellenbibliothek öffnen</button>
      </div>
    </section>`;
  }

  function injectBibliothek(html) {
    const section = renderBibliothekAddon();
    if (!section || typeof html !== "string") return html;
    const marker = "</section>";
    const index = html.lastIndexOf(marker);
    if (index === -1) return `${html}${section}`;
    return `${html.slice(0, index)}${section}${html.slice(index)}`;
  }

  function connectBibliothekAddon() {
    const app = global.DARLibraryApp;
    if (!app || app.__canonicalSourceConnected) return false;
    app.__canonicalSourceConnected = true;
    ensureStyles();

    const originalEnsure = app.ensureCatalog.bind(app);
    app.ensureCatalog = () => Promise.all([originalEnsure(), loadCanonical()]).then(([catalog]) => catalog);

    const originalRender = app.renderBibliothek.bind(app);
    app.renderBibliothek = () => injectBibliothek(originalRender());

    const originalOfflineRender = app.renderBibliothekWithOffline?.bind(app);
    if (originalOfflineRender) {
      app.renderBibliothekWithOffline = () => Promise.all([originalOfflineRender(), loadCanonical()]).then(([html]) => injectBibliothek(html));
    }

    loadCanonical().then(() => {
      if (typeof global.render === "function") global.render();
    });
    return true;
  }

  function ensureModule() {
    ensureStyles();
    return loadCanonical();
  }

  if (!connectBibliothekAddon()) {
    const timer = global.setInterval(() => {
      if (connectBibliothekAddon()) global.clearInterval(timer);
    }, 50);
    global.setTimeout(() => global.clearInterval(timer), 10000);
  }

  global.DARCanonicalSourceLibrary = {
    load: loadCanonical,
    ensureModule,
    isReady,
    isLoading,
    hasError,
    renderList,
    renderBookDetail,
    renderScholarDetail,
    renderRoute,
    bind,
    getBookCount: () => state.books.length,
    getScholarCount: () => state.scholars.length
  };
})(window);
