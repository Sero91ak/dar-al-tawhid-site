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
    ui: { tab: "books", query: "", category: "" }
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

  function ensureStyles() {
    if (document.getElementById("canonical-source-library-styles")) return;
    const style = document.createElement("style");
    style.id = "canonical-source-library-styles";
    style.textContent = `
      .qsrc-shell{display:grid;gap:6px;margin-top:2px}
      .qsrc-sticky{position:sticky;top:0;z-index:18;display:grid;gap:8px;padding:6px 0 10px;margin:0 -2px;background:color-mix(in srgb,var(--bg,#111) 90%,transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid var(--line2,rgba(127,127,127,.16))}
      .qsrc-tabs{display:flex;gap:6px}
      .qsrc-tab{border:1px solid var(--line2,rgba(127,127,127,.22));background:color-mix(in srgb,var(--card,#fff) 92%,transparent);color:inherit;border-radius:999px;padding:7px 12px;font:inherit;font-size:12px;font-weight:700;cursor:pointer}
      .qsrc-tab.is-active{border-color:var(--gold2,#c9a227);box-shadow:0 0 0 1px color-mix(in srgb,var(--gold2,#c9a227) 35%,transparent)}
      .qsrc-toolbar{display:grid;gap:8px}
      .qsrc-search-row{align-items:center}
      .qsrc-search{min-height:38px;padding:8px 11px;font-size:13px}
      .qsrc-filter-bar{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;padding:2px 0 4px}
      .qsrc-filter-bar::-webkit-scrollbar{display:none}
      .qsrc-filter{flex:0 0 auto;border:1px solid var(--line2,rgba(127,127,127,.22));background:color-mix(in srgb,var(--card,#fff) 90%,transparent);color:inherit;border-radius:999px;padding:6px 10px;font:inherit;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap}
      .qsrc-filter.is-active{border-color:var(--gold2,#c9a227);background:color-mix(in srgb,var(--gold2,#c9a227) 14%,transparent)}
      .qsrc-filter-count{opacity:.72;font-weight:800;margin-left:4px}
      .qsrc-grid{display:grid;gap:6px}
      .qsrc-grid-compact{padding-top:2px}
      .qsrc-card{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;border:1px solid var(--line2,rgba(127,127,127,.18));border-radius:12px;padding:10px 12px;background:color-mix(in srgb,var(--card,#fff) 94%,transparent);color:inherit;text-align:left;width:100%;cursor:pointer}
      .qsrc-card-compact{min-height:0}
      .qsrc-card.is-hidden{display:none!important}
      .qsrc-card-body{min-width:0}
      .qsrc-card-row{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
      .qsrc-card-title{display:block;font-family:var(--serif,serif);font-size:15px;line-height:1.22;color:var(--premium-title,var(--gold2,#c9a227));overflow-wrap:anywhere}
      .qsrc-card-count{flex:0 0 auto;font-size:10px;font-weight:850;letter-spacing:.04em;text-transform:uppercase;color:var(--muted,#888);white-space:nowrap;padding-top:2px}
      .qsrc-card-sub{display:block;margin-top:3px;font-size:11px;line-height:1.3;color:var(--muted,#888);overflow-wrap:anywhere}
      .qsrc-chevron{opacity:.4;font-size:1rem;line-height:1}
      .qsrc-empty,.qsrc-error,.qsrc-loading{border:1px dashed var(--line2,rgba(127,127,127,.25));border-radius:12px;padding:14px;text-align:center;color:var(--muted,#888);font-size:13px}
      .qsrc-error button,.qsrc-retry{margin-top:10px;border:1px solid var(--line2,rgba(127,127,127,.25));background:color-mix(in srgb,var(--card,#fff) 90%,transparent);color:inherit;border-radius:10px;padding:8px 12px;font:inherit;font-weight:700;cursor:pointer}
      .qsrc-detail{display:grid;gap:12px}
      .qsrc-detail-block{border:1px solid var(--line2,rgba(127,127,127,.2));border-radius:12px;padding:12px;background:color-mix(in srgb,var(--card,#fff) 94%,transparent)}
      .qsrc-detail-block h3{margin:0 0 6px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted,#888)}
      .qsrc-detail-block p{margin:0;line-height:1.4;font-size:13px}
      .qsrc-alias-list,.qsrc-link-list{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
      .qsrc-chip{font-size:11px;border-radius:999px;padding:5px 9px;background:rgba(127,127,127,.1)}
      .qsrc-post-list{display:grid;gap:6px}
      .lib-canonical-wrap{margin:20px 0 6px;padding-top:18px;border-top:1px solid rgba(127,127,127,.22)}
      .lib-canonical-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:10px}
      .lib-canonical-head h3{margin:0;font-size:1.05rem}
      .lib-canonical-head p{margin:4px 0 0;opacity:.72;font-size:.86rem;max-width:52ch}
      .lib-canonical-count{white-space:nowrap;font-size:.8rem;opacity:.68}
      .lib-canonical-actions{margin-top:10px}
      .lib-canonical-open{border:1px solid var(--line2,rgba(127,127,127,.25));background:color-mix(in srgb,var(--card,#fff) 90%,transparent);color:inherit;border-radius:10px;padding:8px 12px;font:inherit;font-weight:700;cursor:pointer}
      @media(max-width:640px){.lib-canonical-head{align-items:flex-start;flex-direction:column}.qsrc-card-title{font-size:14px}}
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

  function renderCategoryFilters() {
    const counts = categoryBookCounts();
    const cats = [...counts.keys()].sort((a, b) => a.localeCompare(b, "de"));
    const allCount = state.books.length;
    const buttons = [`<button type="button" class="qsrc-filter${state.ui.category === "" ? " is-active" : ""}" data-qsrc-category="">Alle <span class="qsrc-filter-count">${allCount}</span></button>`];
    cats.forEach((cat) => {
      const active = state.ui.category === cat ? " is-active" : "";
      buttons.push(`<button type="button" class="qsrc-filter${active}" data-qsrc-category="${esc(cat)}">${esc(cat)} <span class="qsrc-filter-count">${counts.get(cat) || 0}</span></button>`);
    });
    return `<div class="qsrc-filter-bar" role="toolbar" aria-label="Kategorien">${buttons.join("")}</div>`;
  }

  function renderBookCard(book) {
    const search = bookSearchBlob(book);
    const postCount = Number(book.postCount || 0);
    const postLabel = postCount ? `${postCount} ${postCount === 1 ? "Beitrag" : "Beiträge"}` : "Katalog";
    return `<button type="button" class="qsrc-card qsrc-card-compact" data-nav="quellen-book" data-value="${esc(book.id)}" data-qsrc-search="${esc(search)}">
      <span class="qsrc-card-body">
        <span class="qsrc-card-row">
          <span class="qsrc-card-title">${esc(book.title)}</span>
          <span class="qsrc-card-count">${esc(postLabel)}</span>
        </span>
        <span class="qsrc-card-sub">${esc(book.author)} · ${esc(book.category || "Werk")}</span>
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
    return `<button type="button" class="qsrc-card qsrc-card-compact" data-nav="quellen-scholar" data-value="${esc(scholar.id)}" data-qsrc-search="${esc(search)}">
      <span class="qsrc-card-body">
        <span class="qsrc-card-row">
          <span class="qsrc-card-title">${esc(scholar.name)}</span>
          <span class="qsrc-card-count">${postCount} ${postCount === 1 ? "Beitrag" : "Beiträge"}</span>
        </span>
        <span class="qsrc-card-sub">zitierter Gelehrter${workTitles ? ` · ${esc(workTitles)}` : ""}</span>
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
      ? `${scholars.length} Gelehrte`
      : (state.ui.query || state.ui.category ? `${books.length} von ${state.books.length} Bücher` : `${state.books.length} Bücher`);

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
    <div class="qsrc-tabs" role="tablist">
      <button type="button" class="qsrc-tab${activeTab === "books" ? " is-active" : ""}" data-qsrc-tab="books" role="tab" aria-selected="${activeTab === "books"}">Bücher</button>
      <button type="button" class="qsrc-tab${activeTab === "scholars" ? " is-active" : ""}" data-qsrc-tab="scholars" role="tab" aria-selected="${activeTab === "scholars"}">Gelehrte</button>
    </div>
    <div class="qsrc-toolbar">
      <div class="books-library-toolbar qsrc-search-row">
        <input id="qsrcSearchInput" class="books-library-search qsrc-search" type="search" placeholder="Suchen…" autocomplete="off" enterkeyhint="search" value="${esc(state.ui.query)}">
        <span id="qsrcTotal" class="books-library-total">${esc(totalLabel)}</span>
      </div>
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
    const total = document.getElementById("qsrcTotal");
    const q = input ? input.value.trim() : state.ui.query;
    state.ui.query = q;

    document.querySelectorAll("#qsrcResults .qsrc-card").forEach((card) => {
      const blob = String(card.getAttribute("data-qsrc-search") || "");
      card.classList.toggle("is-hidden", !!q && !matchesQuery(blob, q));
    });

    if (!total) return;
    const visible = document.querySelectorAll("#qsrcResults .qsrc-card:not(.is-hidden)").length;
    const all = document.querySelectorAll("#qsrcResults .qsrc-card").length;
    if (state.ui.tab === "scholars") {
      total.textContent = q ? `${visible} von ${all} Gelehrte` : `${all} Gelehrte`;
    } else {
      total.textContent = q || state.ui.category ? `${visible} von ${all} Bücher` : `${all} Bücher`;
    }
  }

  function bind() {
    document.querySelectorAll("[data-qsrc-tab]").forEach((btn) => {
      btn.onclick = () => {
        state.ui.tab = btn.getAttribute("data-qsrc-tab") || "books";
        if (typeof global.render === "function") global.render();
      };
    });

    document.querySelectorAll("[data-qsrc-category]").forEach((btn) => {
      btn.onclick = () => {
        state.ui.category = btn.getAttribute("data-qsrc-category") || "";
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
    const preview = state.books.slice(0, 3).map((book) => `<article class="lib-canonical-card qsrc-card" style="cursor:default;grid-template-columns:1fr">
      <span class="qsrc-card-kicker">${esc(book.category || "Geprüftes Werk")}</span>
      <span class="qsrc-card-title">${esc(book.title)}</span>
      <span class="qsrc-card-line"><strong>Autor:</strong> ${esc(book.author)}</span>
      <span class="qsrc-card-meta"><span class="qsrc-pill">${Number(book.postCount || 0)} Beiträge</span></span>
    </article>`).join("");

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
