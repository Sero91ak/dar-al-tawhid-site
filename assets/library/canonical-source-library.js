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

  const CATEGORY_ACCENTS = {
    hadith: { border: "rgba(239,215,142,.48)", title: "var(--gold2,#efd78e)", chip: "rgba(239,215,142,.14)" },
    athar: { border: "rgba(201,168,106,.42)", title: "var(--cream,#f8efd4)", chip: "rgba(201,168,106,.12)" },
    bio: { border: "rgba(185,150,96,.40)", title: "#f0ddb0", chip: "rgba(185,150,96,.12)" },
    aqidah: { border: "rgba(220,180,110,.44)", title: "#ffe9b8", chip: "rgba(220,180,110,.13)" },
    tafsir: { border: "rgba(175,140,88,.42)", title: "#ecd7a6", chip: "rgba(175,140,88,.12)" },
    fatawa: { border: "rgba(210,175,105,.42)", title: "#f5e2b2", chip: "rgba(210,175,105,.12)" },
    tawhid: { border: "rgba(239,215,142,.56)", title: "var(--premium-title,#fff7dc)", chip: "rgba(239,215,142,.16)" },
    default: { border: "rgba(239,215,142,.34)", title: "var(--gold2,#efd78e)", chip: "rgba(239,215,142,.10)" }
  };

  function categoryAccent(category) {
    const key = normalizeSearchText(category || "");
    if (key.includes("hadith") || key.includes("fiqh")) return CATEGORY_ACCENTS.hadith;
    if (key.includes("athar") || key.includes("athar")) return CATEGORY_ACCENTS.athar;
    if (key.includes("bio") || key.includes("rijal") || key.includes("tarikh")) return CATEGORY_ACCENTS.bio;
    if (key.includes("aqidah") || key.includes("sunnah") || key.includes("widerleg")) return CATEGORY_ACCENTS.aqidah;
    if (key.includes("tafsir")) return CATEGORY_ACCENTS.tafsir;
    if (key.includes("fatawa")) return CATEGORY_ACCENTS.fatawa;
    if (key.includes("tawhid")) return CATEGORY_ACCENTS.tawhid;
    return CATEGORY_ACCENTS.default;
  }

  function ensureStyles() {
    if (document.getElementById("canonical-source-library-styles")) return;
    const style = document.createElement("style");
    style.id = "canonical-source-library-styles";
    style.textContent = `
      .qsrc-shell{
        display:grid;
        gap:7px;
        margin:0;
        width:100%;
        padding:0;
        color:var(--text,inherit);
        background:transparent;
      }
      .qsrc-sticky{
        position:sticky;
        top:0;
        z-index:18;
        display:grid;
        gap:7px;
        padding:8px 10px;
        border:1px solid var(--line2,rgba(127,127,127,.18));
        border-radius:16px;
        background:radial-gradient(circle at 18% 0%,rgba(239,215,142,.10),transparent 42%),linear-gradient(145deg,color-mix(in srgb,var(--card,#14120e) 96%,transparent),color-mix(in srgb,var(--panel,#12100c) 94%,transparent));
        box-shadow:0 10px 24px rgba(0,0,0,.18),inset 0 1px 0 rgba(255,255,255,.03);
        backdrop-filter:blur(12px);
        -webkit-backdrop-filter:blur(12px);
      }
      .qsrc-control-head{
        display:grid;
        grid-template-columns:minmax(0,1fr) auto;
        gap:8px;
        align-items:center;
      }
      .qsrc-tabs{
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:0;
        padding:2px;
        border:1px solid var(--line2,rgba(127,127,127,.18));
        border-radius:999px;
        background:color-mix(in srgb,var(--bg,#070706) 55%,transparent);
      }
      .qsrc-tab{
        border:0;
        background:transparent;
        color:var(--muted,#a89f88);
        border-radius:999px;
        padding:6px 10px;
        font:inherit;
        font-size:11px;
        font-weight:800;
        letter-spacing:.04em;
        cursor:pointer;
        text-align:center;
      }
      .qsrc-tab.is-active{
        background:var(--premium-pill-bg,linear-gradient(135deg,rgba(239,215,142,.18),rgba(239,215,142,.07)));
        color:var(--premium-pill-text,var(--gold2,#efd78e));
        box-shadow:inset 0 0 0 1px var(--premium-pill-border,rgba(239,215,142,.34));
      }
      .qsrc-meta-pill{
        margin:0;
        padding:5px 8px;
        border-radius:999px;
        border:1px solid var(--line2,rgba(127,127,127,.18));
        background:rgba(239,215,142,.05);
        color:var(--muted2,var(--muted,#a89f88));
        font-size:9px;
        font-weight:800;
        letter-spacing:.08em;
        text-transform:uppercase;
        white-space:nowrap;
      }
      .qsrc-toolbar{
        display:grid;
        grid-template-columns:minmax(0,1fr) auto;
        gap:6px;
        align-items:center;
      }
      .qsrc-search-wrap{position:relative;min-width:0}
      .qsrc-search-icon{
        position:absolute;
        left:11px;
        top:50%;
        transform:translateY(-50%);
        width:14px;
        height:14px;
        opacity:.5;
        pointer-events:none;
        color:var(--muted,#a89f88);
      }
      .qsrc-search{
        width:100%;
        min-height:36px;
        border:1px solid var(--line2,rgba(127,127,127,.18));
        border-radius:11px;
        background:color-mix(in srgb,var(--bg,#070706) 40%,transparent);
        color:var(--text,inherit);
        padding:8px 10px 8px 34px;
        font:inherit;
        font-size:13px;
      }
      .qsrc-search::placeholder{color:var(--muted,#a89f88);opacity:.85}
      .qsrc-search:focus{
        outline:none;
        border-color:rgba(239,215,142,.34);
        box-shadow:0 0 0 2px rgba(239,215,142,.08);
      }
      .qsrc-control-btn{
        border:1px solid var(--line2,rgba(127,127,127,.18));
        background:color-mix(in srgb,var(--card,#14120e) 88%,transparent);
        color:var(--text,inherit);
        border-radius:11px;
        min-height:36px;
        padding:0 10px;
        font:inherit;
        font-size:10px;
        font-weight:800;
        cursor:pointer;
        display:inline-flex;
        align-items:center;
        gap:5px;
        white-space:nowrap;
      }
      .qsrc-control-btn.is-active{
        border-color:rgba(239,215,142,.34);
        background:rgba(239,215,142,.08);
        color:var(--gold2,#efd78e);
      }
      .qsrc-control-btn .qsrc-caret{opacity:.72;font-size:9px}
      .qsrc-filter-panel{
        grid-column:1 / -1;
        display:grid;
        gap:6px;
        padding:8px;
        border:1px solid var(--line2,rgba(127,127,127,.16));
        border-radius:11px;
        background:color-mix(in srgb,var(--bg,#070706) 35%,transparent);
      }
      .qsrc-filter-panel[hidden]{display:none!important}
      .qsrc-filter-grid{display:flex;flex-wrap:wrap;gap:5px}
      .qsrc-filter{
        border:1px solid var(--line2,rgba(127,127,127,.16));
        background:transparent;
        color:var(--muted,#a89f88);
        border-radius:999px;
        padding:5px 9px;
        font:inherit;
        font-size:10px;
        font-weight:800;
        cursor:pointer;
      }
      .qsrc-filter.is-active{
        border-color:rgba(239,215,142,.34);
        background:rgba(239,215,142,.08);
        color:var(--gold2,#efd78e);
      }
      .qsrc-filter-count{opacity:.7;font-weight:800;margin-left:2px}
      .qsrc-active-chip{
        grid-column:1 / -1;
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:8px;
        padding:6px 8px;
        border-radius:9px;
        border:1px dashed rgba(239,215,142,.22);
        background:rgba(239,215,142,.05);
        color:var(--gold2,#efd78e);
        font-size:10px;
      }
      .qsrc-active-chip button{
        border:0;
        background:transparent;
        color:inherit;
        font:inherit;
        font-weight:800;
        cursor:pointer;
        opacity:.85;
      }
      .qsrc-grid{display:grid;gap:6px}
      .qsrc-lib-grid{
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:10px 8px;
      }
      .qsrc-lib-card{
        display:flex;
        flex-direction:column;
        gap:0;
        min-width:0;
        padding:0;
        border:0;
        background:transparent;
        text-align:left;
        color:inherit;
        cursor:pointer;
        border-radius:12px;
        width:100%;
      }
      .qsrc-lib-card:focus-visible{
        outline:2px solid color-mix(in srgb,var(--gold2,#efd78e) 55%,transparent);
        outline-offset:3px;
      }
      .qsrc-lib-card.is-hidden{display:none!important}
      .qsrc-lib-cover-wrap{
        position:relative;
        width:100%;
        aspect-ratio:2/3;
        border-radius:10px 10px 0 0;
        overflow:hidden;
        background:color-mix(in srgb,var(--panel,#12100c) 80%,var(--bg,#070706));
        box-shadow:0 8px 18px color-mix(in srgb,var(--bg,#070706) 55%,transparent);
        border:1px solid var(--line2,rgba(127,127,127,.18));
        border-bottom:0;
      }
      .qsrc-lib-cover{
        width:100%;
        height:100%;
        object-fit:cover;
        display:block;
      }
      .qsrc-lib-cover-fallback{
        width:100%;
        height:100%;
        display:grid;
        place-items:center;
        padding:10px;
        text-align:center;
        color:var(--gold2,#efd78e);
        font-family:var(--serif,Georgia,serif);
        font-size:0.82rem;
        line-height:1.3;
        background:radial-gradient(circle at 50% 16%,rgba(239,215,142,.10),transparent 55%),linear-gradient(160deg,color-mix(in srgb,var(--panel,#12100c) 90%,var(--bg,#070706)),color-mix(in srgb,var(--card,#14120e) 85%,var(--bg,#070706)));
      }
      .qsrc-lib-card-body{
        display:flex;
        flex-direction:column;
        gap:5px;
        min-width:0;
        flex:1 1 auto;
        padding:8px 9px 9px;
        border:1px solid color-mix(in srgb,var(--gold2,#efd78e) 22%,var(--line2,rgba(127,127,127,.22)));
        border-top:1px solid color-mix(in srgb,var(--gold2,#efd78e) 14%,var(--line2,rgba(127,127,127,.16)));
        border-radius:0 0 10px 10px;
        background:linear-gradient(180deg,color-mix(in srgb,var(--card,#14120e) 94%,var(--bg,#070706)),color-mix(in srgb,var(--panel,#12100c) 90%,var(--bg,#070706)));
        box-shadow:inset 0 1px 0 color-mix(in srgb,var(--gold2,#efd78e) 8%,transparent);
      }
      .qsrc-lib-card:hover .qsrc-lib-cover-wrap,
      .qsrc-lib-card:focus-visible .qsrc-lib-cover-wrap{
        border-color:color-mix(in srgb,var(--gold2,#efd78e) 28%,var(--line2,rgba(127,127,127,.22)));
      }
      .qsrc-lib-card:hover .qsrc-lib-card-body,
      .qsrc-lib-card:focus-visible .qsrc-lib-card-body{
        border-color:color-mix(in srgb,var(--gold2,#efd78e) 34%,var(--line2,rgba(127,127,127,.22)));
        background:linear-gradient(180deg,color-mix(in srgb,var(--card,#14120e) 96%,var(--bg,#070706)),color-mix(in srgb,var(--panel,#12100c) 92%,var(--bg,#070706)));
      }
      .qsrc-lib-card-body h4{
        margin:0;
        font-family:var(--serif,Georgia,"Times New Roman",serif);
        font-size:0.82rem;
        line-height:1.3;
        font-weight:700;
        color:var(--gold2,#efd78e);
        display:-webkit-box;
        -webkit-line-clamp:2;
        -webkit-box-orient:vertical;
        overflow:hidden;
      }
      .qsrc-lib-card-kicker{
        display:block;
        font-size:0.56rem;
        font-weight:900;
        letter-spacing:.11em;
        text-transform:uppercase;
        color:var(--muted2,var(--muted,#a89f88));
        margin-bottom:1px;
      }
      .qsrc-lib-card-meta{
        display:grid;
        gap:2px;
        min-width:0;
        font-size:0.68rem;
        line-height:1.28;
      }
      .qsrc-lib-card-meta-row{
        display:flex;
        flex-wrap:wrap;
        align-items:baseline;
        gap:2px 5px;
      }
      .qsrc-lib-card-meta span{overflow-wrap:anywhere}
      .qsrc-lib-card-meta--category{
        padding-bottom:4px;
        border-bottom:1px dashed color-mix(in srgb,var(--gold2,#efd78e) 16%,var(--line2,rgba(127,127,127,.18)));
      }
      .qsrc-lib-card-meta--category .qsrc-lib-card-category{
        color:var(--cream,var(--text,inherit));
        font-weight:750;
      }
      .qsrc-lib-card-meta--category .qsrc-lib-card-badge{
        color:var(--muted2,var(--muted,#a89f88));
        font-size:0.62rem;
        font-weight:700;
      }
      .qsrc-lib-card-meta--author{
        padding-top:1px;
      }
      .qsrc-lib-card-meta--author .qsrc-lib-card-author-name{
        font-family:var(--serif,Georgia,"Times New Roman",serif);
        font-style:italic;
        font-size:0.7rem;
        line-height:1.32;
        font-weight:600;
        color:var(--premium-body,#d9cfb0);
        display:-webkit-box;
        -webkit-line-clamp:2;
        -webkit-box-orient:vertical;
        overflow:hidden;
      }
      .qsrc-lib-card.qsrc-card{
        display:flex;
        flex-direction:column;
        grid-template-columns:unset;
        align-items:stretch;
        gap:0;
        padding:0;
        border:0;
        border-left:0;
        border-radius:12px;
        background:transparent;
        box-shadow:none;
      }
      .qsrc-lib-card.qsrc-card:hover{
        transform:none;
        border-color:transparent;
      }
      .qsrc-card{
        display:grid;
        grid-template-columns:46px minmax(0,1fr) auto;
        gap:9px;
        align-items:center;
        border:1px solid var(--line,rgba(127,127,127,.16));
        border-left:3px solid var(--qsrc-accent-border, rgba(239,215,142,.34));
        border-radius:14px;
        padding:9px 10px;
        background:radial-gradient(circle at 18% 0%,rgba(239,215,142,.08),transparent 40%),linear-gradient(145deg,color-mix(in srgb,var(--card,#14120e) 95%,transparent),color-mix(in srgb,var(--panel,#12100c) 92%,transparent));
        color:inherit;
        text-align:left;
        width:100%;
        cursor:pointer;
        box-shadow:0 8px 18px rgba(0,0,0,.16);
        transition:transform .14s ease,border-color .14s ease;
      }
      .qsrc-card:hover{
        transform:translateY(-1px);
        border-color:rgba(239,215,142,.28);
      }
      .qsrc-card.is-hidden{display:none!important}
      .qsrc-card-body{min-width:0;display:grid;gap:3px}
      .qsrc-card-kicker{
        display:block;
        font-size:8px;
        font-weight:900;
        letter-spacing:.14em;
        text-transform:uppercase;
        color:var(--muted2,var(--muted,#a89f88));
      }
      .qsrc-card-head{
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap:8px;
      }
      .qsrc-card-title{
        display:block;
        font-family:var(--serif,Georgia,"Times New Roman",serif);
        font-size:15px;
        font-weight:650;
        line-height:1.24;
        color:var(--qsrc-accent-title,var(--gold2,#efd78e));
        overflow-wrap:anywhere;
      }
      .qsrc-card-badge{
        flex:0 0 auto;
        font-size:8px;
        font-weight:900;
        letter-spacing:.08em;
        text-transform:uppercase;
        color:var(--muted,#a89f88);
        white-space:nowrap;
        padding:3px 6px;
        border-radius:999px;
        border:1px solid var(--line2,rgba(127,127,127,.16));
        background:rgba(239,215,142,.04);
      }
      .qsrc-card-author{display:grid;gap:1px;overflow-wrap:anywhere}
      .qsrc-card-author .qsrc-label{
        display:block;
        font-size:8px;
        font-weight:900;
        letter-spacing:.12em;
        text-transform:uppercase;
        color:var(--muted2,var(--muted,#a89f88));
      }
      .qsrc-card-author .qsrc-author-name{
        display:block;
        font-size:12px;
        line-height:1.32;
        font-style:italic;
        color:var(--premium-body,#d9cfb0);
      }
      .qsrc-card-foot{display:flex;align-items:center;margin-top:1px}
      .qsrc-card-category{
        display:inline-flex;
        align-items:center;
        max-width:100%;
        font-size:9px;
        font-weight:800;
        letter-spacing:.07em;
        text-transform:uppercase;
        color:var(--gold2,#efd78e);
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
        padding:3px 7px;
        border-radius:999px;
        background:var(--qsrc-accent-chip, rgba(239,215,142,.08));
        border:1px solid rgba(239,215,142,.12);
      }
      .qsrc-chevron{opacity:.32;font-size:.95rem;line-height:1;color:var(--gold2,#efd78e)}
      .qsrc-cover-wrap{
        width:46px;
        height:64px;
        border-radius:7px;
        overflow:hidden;
        flex-shrink:0;
        border:1px solid rgba(239,215,142,.18);
        box-shadow:0 6px 14px rgba(0,0,0,.22),inset 0 0 0 1px rgba(255,255,255,.04);
        background:linear-gradient(145deg,rgba(24,20,14,.95),rgba(10,10,8,.95));
      }
      .qsrc-cover{
        display:block;
        width:100%;
        height:100%;
        object-fit:cover;
      }
      .qsrc-cover-fallback{
        display:grid;
        place-items:center;
        width:100%;
        height:100%;
        padding:4px;
        text-align:center;
        font-size:7px;
        line-height:1.15;
        color:var(--gold2,#efd78e);
        font-family:var(--serif,Georgia,serif);
      }
      .qsrc-detail-showcase{
        display:flex;
        flex-direction:column;
        align-items:center;
        gap:12px;
        text-align:center;
        padding:14px 12px;
        border:1px solid var(--line2,rgba(127,127,127,.16));
        border-radius:14px;
        background:radial-gradient(circle at 50% 0%,rgba(239,215,142,.08),transparent 42%),linear-gradient(145deg,color-mix(in srgb,var(--card,#14120e) 95%,transparent),color-mix(in srgb,var(--panel,#12100c) 92%,transparent));
      }
      .qsrc-detail-cover-slot{width:min(100%,240px)}
      .qsrc-detail-cover-slot .qsrc-lib-cover-wrap{
        box-shadow:0 12px 28px color-mix(in srgb,var(--bg,#070706) 50%,transparent);
      }
      .qsrc-detail-copy{width:100%;max-width:36rem}
      .qsrc-detail-showcase h4{margin:0 0 4px;font-family:var(--serif,Georgia,serif);font-size:clamp(1.1rem,3.6vw,1.45rem);line-height:1.22;color:var(--gold2,#efd78e)}
      .qsrc-detail-showcase p{margin:0;font-size:13px;line-height:1.4;color:var(--premium-body,#d9cfb0);font-style:italic}
      .qsrc-detail-showcase .qsrc-card-category{margin-top:8px}
      .qsrc-empty,.qsrc-error,.qsrc-loading{
        border:1px dashed var(--line2,rgba(127,127,127,.18));
        border-radius:12px;
        padding:12px;
        text-align:center;
        color:var(--muted,#a89f88);
        font-size:12px;
        background:color-mix(in srgb,var(--card,#14120e) 70%,transparent);
      }
      .qsrc-error button,.qsrc-retry{
        margin-top:8px;
        border:1px solid var(--line2,rgba(127,127,127,.18));
        background:color-mix(in srgb,var(--card,#14120e) 90%,transparent);
        color:var(--text,inherit);
        border-radius:10px;
        padding:7px 11px;
        font:inherit;
        font-weight:800;
        cursor:pointer;
      }
      .qsrc-detail{display:grid;gap:10px}
      .qsrc-detail-block{
        border:1px solid var(--line2,rgba(127,127,127,.16));
        border-radius:14px;
        padding:11px;
        background:color-mix(in srgb,var(--card,#14120e) 92%,transparent);
      }
      .qsrc-detail-block h3{margin:0 0 5px;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted,#a89f88)}
      .qsrc-detail-block p{margin:0;line-height:1.4;font-size:13px;color:var(--text,inherit)}
      .qsrc-alias-list,.qsrc-link-list{display:flex;flex-wrap:wrap;gap:5px;margin-top:5px}
      .qsrc-chip{
        font-size:10px;
        border-radius:999px;
        padding:4px 8px;
        background:rgba(239,215,142,.06);
        border:1px solid var(--line2,rgba(127,127,127,.16));
        color:var(--text,inherit);
      }
      .qsrc-post-list{display:grid;gap:5px}
      .lib-canonical-wrap{margin:16px 0 4px;padding-top:14px;border-top:1px solid var(--line2,rgba(127,127,127,.16))}
      .lib-canonical-head{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin-bottom:8px}
      .lib-canonical-head h3{margin:0;font-size:1rem;color:var(--gold2,#efd78e)}
      .lib-canonical-head p{margin:3px 0 0;opacity:.72;font-size:.82rem;max-width:52ch;color:var(--muted,#a89f88)}
      .lib-canonical-count{white-space:nowrap;font-size:.76rem;opacity:.68;color:var(--muted,#a89f88)}
      .lib-canonical-actions{margin-top:8px}
      .lib-canonical-open{
        border:1px solid var(--line2,rgba(127,127,127,.18));
        background:color-mix(in srgb,var(--card,#14120e) 90%,transparent);
        color:var(--text,inherit);
        border-radius:10px;
        padding:7px 11px;
        font:inherit;
        font-weight:800;
        cursor:pointer;
      }
      @media(max-width:640px){
        .qsrc-sticky{padding:7px 8px}
        .qsrc-control-head{grid-template-columns:1fr;gap:6px}
        .qsrc-meta-pill{justify-self:start}
        .qsrc-toolbar{grid-template-columns:1fr}
        .qsrc-control-btn{justify-content:center;width:100%}
        .qsrc-lib-grid{gap:10px 8px}
        .qsrc-lib-card-body{padding:7px 8px 8px;gap:4px}
        .qsrc-lib-card-body h4{font-size:0.78rem}
        .qsrc-lib-card-meta{font-size:0.64rem}
        .qsrc-lib-card-meta--author .qsrc-lib-card-author-name{font-size:0.66rem}
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

  function libraryAssetBase() {
    if (typeof location !== "undefined" && (location.pathname.indexOf("/test/") === 0 || location.pathname === "/test")) {
      return "/test/assets/library";
    }
    return "/assets/library";
  }

  function bookCoverUrl(book) {
    if (book?.coverUrl) return book.coverUrl;
    if (book?.id) return `${libraryAssetBase()}/covers/qsrc/${book.id}.svg`;
    return "";
  }

  function coverHtml(book, className) {
    const src = bookCoverUrl(book);
    const alt = `${book.title} – Buchcover`;
    if (!src) {
      return `<div class="qsrc-cover-wrap"><div class="qsrc-cover-fallback" role="img" aria-label="${esc(alt)}">${esc((book.title || "").split(" ").slice(0, 3).join(" "))}</div></div>`;
    }
    return `<div class="qsrc-cover-wrap"><img class="${className || "qsrc-cover"}" src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async" onerror="this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.hidden=false"><div class="qsrc-cover-fallback" hidden>${esc((book.title || "").split(" ").slice(0, 3).join(" "))}</div></div>`;
  }

  function libCoverHtml(book) {
    const src = bookCoverUrl(book);
    const alt = `${book.title} – Buchcover`;
    if (!src) {
      return `<div class="qsrc-lib-cover-wrap"><div class="qsrc-lib-cover-fallback" role="img" aria-label="${esc(alt)}">${esc(book.title || "")}</div></div>`;
    }
    return `<div class="qsrc-lib-cover-wrap"><img class="qsrc-lib-cover" src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async" onerror="this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.hidden=false"><div class="qsrc-lib-cover-fallback" hidden>${esc(book.title || "")}</div></div>`;
  }

  function renderBookCard(book) {
    const search = bookSearchBlob(book);
    const postCount = Number(book.postCount || 0);
    const postLabel = postCount ? `${postCount} ${postCount === 1 ? "Beitrag" : "Beiträge"}` : "Katalog";
    return `<button type="button" class="qsrc-lib-card qsrc-card" data-nav="quellen-book" data-value="${esc(book.id)}" data-qsrc-search="${esc(search)}" aria-label="${esc(book.title)} öffnen">
      ${libCoverHtml(book)}
      <div class="qsrc-lib-card-body">
        <h4>${esc(book.title)}</h4>
        <div class="qsrc-lib-card-meta qsrc-lib-card-meta--category">
          <span class="qsrc-lib-card-kicker">Katalog</span>
          <div class="qsrc-lib-card-meta-row">
            <span class="qsrc-lib-card-category">${esc(book.category || "Werk")}</span>
            <span class="qsrc-lib-card-badge">${esc(postLabel)}</span>
          </div>
        </div>
        <div class="qsrc-lib-card-meta qsrc-lib-card-meta--author">
          <span class="qsrc-lib-card-kicker">Autor</span>
          <span class="qsrc-lib-card-author-name">${esc(book.author)}</span>
        </div>
      </div>
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
      <div class="qsrc-cover-wrap" aria-hidden="true"><div class="qsrc-cover-fallback">ʿIlm</div></div>
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
      ? (state.ui.query ? `${scholars.length} von ${state.scholars.length} Gelehrte` : `${state.scholars.length} Gelehrte`)
      : (state.ui.query || state.ui.category ? `${books.length} von ${state.books.length} Werke` : `${state.books.length} Werke · Gesamtkatalog`);

    const bookCount = state.books.length;
    const listHtml = activeTab === "scholars"
      ? (scholars.length
        ? scholars.map(renderScholarCard).join("")
        : `<div class="qsrc-empty">Keine Gelehrten gefunden.</div>`)
      : (books.length
        ? books.map(renderBookCard).join("")
        : `<div class="qsrc-empty">Keine Bücher gefunden.</div>`);

    return `${setPageHeader("Quellenbibliothek", `Alle ${bookCount} geprüften Werke mit verifiziertem Autor. Zitierte Gelehrte werden getrennt ausgewiesen.`, "Quellenbibliothek")}
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
  <div class="${activeTab === "books" ? "qsrc-lib-grid" : "qsrc-grid"}" id="qsrcResults">${listHtml}</div>
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
  <article class="qsrc-detail-showcase">
    <div class="qsrc-detail-cover-slot">${libCoverHtml(book)}</div>
    <div class="qsrc-detail-copy">
      <span class="qsrc-card-kicker">Autor des Werkes</span>
      <h4>${esc(book.title)}</h4>
      <p>${esc(book.author)}</p>
      <span class="qsrc-card-category">${esc(book.category || "Werk")}</span>
    </div>
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
      meta.textContent = q ? `${visible} von ${all} Gelehrte` : `${all} Gelehrte`;
    } else {
      meta.textContent = q || state.ui.category ? `${visible} von ${all} Werke` : `${all} Werke · Gesamtkatalog`;
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
      return `<article class="lib-canonical-card qsrc-card" style="cursor:default;grid-template-columns:46px 1fr;--qsrc-accent-border:${accent.border};--qsrc-accent-title:${accent.title};--qsrc-accent-chip:${accent.chip}">
      ${coverHtml(book)}
      <span class="qsrc-card-body">
      <span class="qsrc-card-kicker">${esc(book.category || "Geprüftes Werk")}</span>
      <span class="qsrc-card-title">${esc(book.title)}</span>
      <span class="qsrc-card-author"><span class="qsrc-label">Autor</span><span class="qsrc-author-name">${esc(book.author)}</span></span>
      <span class="qsrc-card-foot"><span class="qsrc-card-badge">${Number(book.postCount || 0)} Beiträge</span></span>
      </span>
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
