/* DAR AL TAWḤĪD – geprüfte Quellenbibliothek für die Test-App */
(function attachCanonicalLibrary(global) {
  "use strict";

  const BOOKS_URL = "/data/books-library.json";
  const SCHOLARS_URL = "/data/scholars-library.json";
  let canonical = { books: [], scholars: [], loaded: false };
  let loading = null;

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function ensureStyles() {
    if (document.getElementById("canonical-library-addon-styles")) return;
    const style = document.createElement("style");
    style.id = "canonical-library-addon-styles";
    style.textContent = `
      .lib-canonical-wrap{margin:24px 0 8px;padding-top:22px;border-top:1px solid rgba(127,127,127,.22)}
      .lib-canonical-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:14px}
      .lib-canonical-head h3{margin:0;font-size:1.15rem}
      .lib-canonical-head p{margin:4px 0 0;opacity:.72;font-size:.9rem}
      .lib-canonical-count{white-space:nowrap;font-size:.82rem;opacity:.68}
      .lib-canonical-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}
      .lib-canonical-card{display:block;text-align:left;border:1px solid rgba(127,127,127,.22);border-radius:16px;padding:15px;background:var(--card-bg,rgba(255,255,255,.04));color:inherit}
      .lib-canonical-kicker{display:block;font-size:.76rem;letter-spacing:.02em;opacity:.62;margin-bottom:7px}
      .lib-canonical-title{display:block;font-weight:750;line-height:1.28;margin-bottom:7px}
      .lib-canonical-author{display:block;font-size:.9rem;opacity:.82}
      .lib-canonical-meta{display:flex;flex-wrap:wrap;gap:7px;margin-top:11px}
      .lib-canonical-pill{font-size:.72rem;border:1px solid rgba(127,127,127,.2);border-radius:999px;padding:4px 8px;opacity:.76}
      .lib-canonical-scholars{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
      .lib-canonical-scholar{font-size:.78rem;border-radius:999px;padding:6px 10px;background:rgba(127,127,127,.1)}
      @media(max-width:640px){.lib-canonical-head{align-items:flex-start;flex-direction:column}.lib-canonical-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  async function loadCanonical() {
    if (canonical.loaded) return canonical;
    if (loading) return loading;
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
      const books = Array.isArray(booksData.books) ? booksData.books : [];
      const scholars = Array.isArray(scholarsData.scholars) ? scholarsData.scholars : [];
      canonical = {
        books: books.filter((book) => book && book.verification === "verified" && book.id && book.title && book.author),
        scholars: scholars.filter((scholar) => scholar && scholar.role === "quotedScholar" && scholar.id && scholar.name),
        loaded: true
      };
      return canonical;
    }).catch((error) => {
      console.error("Canonical library addon could not load", error);
      canonical = { books: [], scholars: [], loaded: true };
      return canonical;
    }).finally(() => {
      loading = null;
    });
    return loading;
  }

  function renderCanonicalSection() {
    if (!canonical.loaded || !canonical.books.length) return "";
    const books = canonical.books;
    const scholars = canonical.scholars;
    const cards = books.map((book) => {
      const linked = (book.quotedScholars || []).slice(0, 3);
      const scholarHtml = linked.length
        ? `<div class="lib-canonical-scholars">${linked.map((name) => `<span class="lib-canonical-scholar">${esc(name)}</span>`).join("")}</div>`
        : "";
      return `<article class="lib-canonical-card">
        <span class="lib-canonical-kicker">${esc(book.category || "Geprüftes Werk")}</span>
        <span class="lib-canonical-title">${esc(book.title)}</span>
        <span class="lib-canonical-author">Autor: ${esc(book.author)}</span>
        <div class="lib-canonical-meta">
          <span class="lib-canonical-pill">verifiziert</span>
          <span class="lib-canonical-pill">${Number(book.postCount || 0)} Beiträge</span>
        </div>
        ${scholarHtml}
      </article>`;
    }).join("");

    return `<section class="lib-canonical-wrap" aria-label="Geprüfte Quellenbibliothek">
      <div class="lib-canonical-head">
        <div>
          <h3>Geprüfte Quellenbibliothek</h3>
          <p>Historische Werke mit eindeutig zugeordnetem Autor. Zitierte Gelehrte werden getrennt ausgewiesen.</p>
        </div>
        <span class="lib-canonical-count">${books.length} Werke · ${scholars.length} Gelehrte</span>
      </div>
      <div class="lib-canonical-grid">${cards}</div>
    </section>`;
  }

  function inject(html) {
    const section = renderCanonicalSection();
    if (!section || typeof html !== "string") return html;
    const marker = "</section>";
    const index = html.lastIndexOf(marker);
    if (index === -1) return `${html}${section}`;
    return `${html.slice(0, index)}${section}${html.slice(index)}`;
  }

  function connect() {
    const app = global.DARLibraryApp;
    if (!app || app.__canonicalConnected) return false;
    app.__canonicalConnected = true;
    ensureStyles();

    const originalEnsure = app.ensureCatalog.bind(app);
    app.ensureCatalog = () => Promise.all([originalEnsure(), loadCanonical()]).then(([catalog]) => catalog);

    const originalRender = app.renderBibliothek.bind(app);
    app.renderBibliothek = () => inject(originalRender());

    const originalOfflineRender = app.renderBibliothekWithOffline.bind(app);
    app.renderBibliothekWithOffline = () => Promise.all([originalOfflineRender(), loadCanonical()]).then(([html]) => inject(html));

    loadCanonical().then(() => {
      if (typeof global.render === "function") global.render();
    });
    return true;
  }

  if (!connect()) {
    const timer = global.setInterval(() => {
      if (connect()) global.clearInterval(timer);
    }, 50);
    global.setTimeout(() => global.clearInterval(timer), 10000);
  }
})(window);
