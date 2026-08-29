(function () {
  "use strict";

  var DATA_URL = "/test/data/frauen-fiqh.json";
  var THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "grundlagen", label: "Grundlagen" },
    { id: "reinigung", label: "Reinigung" },
    { id: "gebet", label: "Gebet" },
    { id: "fasten", label: "Fasten" },
    { id: "hidschab", label: "Ḥidschāb" },
    { id: "heirat", label: "Heirat" }
  ];

  var cache = null;
  var cachePromise = null;
  var q = "";
  var thema = "alle";
  var filterOpen = false;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function sichtbare(eintraege) {
    return (eintraege || []).filter(function (e) {
      return e.status_anzeige === "sichtbar";
    });
  }

  function load() {
    if (cache) return Promise.resolve(cache);
    if (cachePromise) return cachePromise;
    cachePromise = fetch(DATA_URL, { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("frauen-fiqh.json " + r.status);
        return r.json();
      })
      .then(function (d) {
        cache = d;
        return d;
      })
      .catch(function (err) {
        cachePromise = null;
        throw err;
      });
    return cachePromise;
  }

  function matches(e) {
    if (thema !== "alle") {
      var themen = e.themen || [];
      if (themen.indexOf(thema) === -1) return false;
    }
    if (!q) return true;
    var hay = [
      e.titel_de,
      e.kurzbeschreibung,
      e.inhalt,
      e.nutzen,
      e.quelle_werk,
      e.quelle_kapitel,
      (e.quelle_ueberlieferer || []).join(" "),
      (e.stichworte || []).join(" ")
    ].join(" ").toLowerCase();
    return hay.indexOf(q) !== -1;
  }

  function quelleKurz(e) {
    var bits = [];
    if (e.quelle_werk) bits.push(e.quelle_werk);
    if (e.quelle_nummer) bits.push("Nr. " + e.quelle_nummer);
    return bits.join(" · ");
  }

  function renderHub() {
    return (
      '<section class="stack">' +
      '<p class="lede">Geprüfte Aussagen. Bereich wählen — kompakt, dann die volle Aussage mit Quelle.</p>' +
      '<div class="dua-theme-grid frauen-fiqh-list">' +
      '<article class="dua-theme-card" data-nav="frauen" data-value="fiqh">' +
      '<span class="dua-theme-card__idx" aria-hidden="true">01</span>' +
      '<div class="dua-theme-card__icon" aria-hidden="true"><span class="emoji-emblem">✦</span></div>' +
      '<div class="dua-theme-card__body"><h3>Fiqh der Frauen</h3>' +
      '<p class="dua-theme-card__count">Reinigung · Gebet · Fasten · Ḥidschāb</p>' +
      '<span class="frauen-open-btn">Bereich öffnen</span></div>' +
      '<span class="dua-theme-card__chev" aria-hidden="true">›</span>' +
      "</article></div></section>"
    );
  }

  function renderList(data) {
    var items = sichtbare(data.eintraege).filter(matches);
    var chips = THEMEN.map(function (t) {
      return (
        '<button type="button" class="frauen-chip' +
        (thema === t.id ? " is-on" : "") +
        '" data-frauen-thema="' +
        esc(t.id) +
        '">' +
        esc(t.label) +
        "</button>"
      );
    }).join("");

    var rows = items
      .map(function (e, i) {
        return (
          '<article class="dua-theme-card" data-nav="frauen" data-value="fiqh/' +
          esc(e.kennung) +
          '">' +
          '<span class="dua-theme-card__idx" aria-hidden="true">' +
          String(i + 1).padStart(2, "0") +
          "</span>" +
          '<div class="dua-theme-card__icon" aria-hidden="true"><span class="emoji-emblem">✦</span></div>' +
          '<div class="dua-theme-card__body">' +
          "<h3>" +
          esc(e.titel_de) +
          "</h3>" +
          '<p class="dua-theme-card__count">' +
          esc(quelleKurz(e)) +
          (e.hadith_grad ? " · " + e.hadith_grad : "") +
          "</p>" +
          '<span class="frauen-open-btn">Aussage öffnen</span>' +
          "</div>" +
          '<span class="dua-theme-card__chev" aria-hidden="true">›</span>' +
          "</article>"
        );
      })
      .join("");

    return (
      '<section class="stack">' +
      '<p class="lede">Nur geprüfte Aussagen. Tippe eine Zeile — die volle Aussage öffnet sich mit Quelle.</p>' +
      '<div class="frauen-filter' +
      (filterOpen ? " is-open" : "") +
      '">' +
      '<button type="button" class="frauen-filter__toggle" data-frauen-filter-toggle="1">Suche und Filter · Schnellauswahl</button>' +
      '<div class="frauen-filter__panel">' +
      '<input class="frauen-filter__search" type="search" placeholder="Thema oder Begriff suchen…" value="' +
      esc(q) +
      '" data-frauen-q>' +
      '<div class="frauen-filter__chips">' +
      chips +
      "</div></div></div>" +
      (rows
        ? '<div class="dua-theme-grid frauen-fiqh-list">' + rows + "</div>"
        : '<p class="frauen-empty">Keine sichtbare Aussage zu dieser Auswahl.</p>') +
      "</section>"
    );
  }

  function renderDetail(data, kennung) {
    var e = (data.eintraege || []).find(function (x) {
      return x.kennung === kennung && x.status_anzeige === "sichtbar";
    });
    if (!e) {
      return '<p class="frauen-empty">Diese Aussage ist nicht sichtbar oder noch in Prüfung.</p>';
    }
    var ueber = (e.quelle_ueberlieferer || []).join(" · ");
    return (
      '<article class="frauen-article">' +
      '<p class="frauen-article__kicker">Aussage · Fiqh der Frauen</p>' +
      '<h2 class="frauen-article__title">' +
      esc(e.titel_de) +
      "</h2>" +
      (e.kurzbeschreibung
        ? '<p class="frauen-article__lead">' + esc(e.kurzbeschreibung) + "</p>"
        : "") +
      '<p class="frauen-article__section">Inhalt</p>' +
      '<p class="frauen-article__body">' +
      esc(e.inhalt) +
      "</p>" +
      (e.nutzen
        ? '<p class="frauen-article__section">Nutzen</p><p class="frauen-article__nutzen">' +
          esc(e.nutzen) +
          "</p>"
        : "") +
      '<div class="frauen-source-card">' +
      '<p class="frauen-source-card__title">Quelle zum Nachprüfen</p>' +
      "<p><strong>" +
      esc(e.quelle_werk || "") +
      "</strong>" +
      (e.quelle_nummer ? " · Nr. " + esc(String(e.quelle_nummer)) : "") +
      "</p>" +
      (e.quelle_kapitel ? "<p>" + esc(e.quelle_kapitel) + "</p>" : "") +
      (ueber ? "<p>Überliefert von: " + esc(ueber) + "</p>" : "") +
      (e.hadith_grad ? "<p>Grad: " + esc(e.hadith_grad) + "</p>" : "") +
      "</div>" +
      '<button type="button" class="frauen-open-btn" data-nav="frauen" data-value="fiqh">Zurück zur Übersicht</button>' +
      "</article>"
    );
  }

  function parseValue(value) {
    var v = String(value || "").replace(/^\/+|\/+$/g, "");
    if (!v) return { page: "hub", kennung: "" };
    if (v === "fiqh") return { page: "list", kennung: "" };
    if (v.indexOf("fiqh/") === 0) {
      return { page: "detail", kennung: v.slice(5) };
    }
    return { page: "hub", kennung: "" };
  }

  function refreshIfFrauen() {
    try {
      if (typeof window.render === "function") {
        var r = typeof window.readRoute === "function" ? window.readRoute() : null;
        if (!r || r.view === "frauen") window.render();
      }
    } catch (err) {}
  }

  function pageMeta(value) {
    var parsed = parseValue(value);
    if (parsed.page === "list") {
      return {
        title: "Fiqh der Frauen",
        subtitle: "Suche und Filter · Zeile öffnet die Aussage mit Quelle."
      };
    }
    if (parsed.page === "detail" && cache) {
      var e = (cache.eintraege || []).find(function (x) {
        return x.kennung === parsed.kennung && x.status_anzeige === "sichtbar";
      });
      return {
        title: e ? e.titel_de : "Aussage",
        subtitle: "Fiqh der Frauen · Quelle zum Nachprüfen"
      };
    }
    return {
      title: "Frauen im Islam",
      subtitle: "Geprüfte Aussagen. Kompakt wählen, dann die volle Aussage lesen."
    };
  }

  function render(value) {
    var parsed = parseValue(value);
    if (!cache) {
      load()
        .then(refreshIfFrauen)
        .catch(refreshIfFrauen);
      return '<p class="frauen-empty">Bereich wird geladen…</p>';
    }
    if (parsed.page === "hub") {
      q = "";
      thema = "alle";
      filterOpen = false;
      return renderHub();
    }
    if (parsed.page === "detail") return renderDetail(cache, parsed.kennung);
    return renderList(cache);
  }

  function bind() {
    var input = document.querySelector("[data-frauen-q]");
    if (input && !input.dataset.bound) {
      input.dataset.bound = "1";
      input.addEventListener("input", function () {
        q = (input.value || "").trim().toLowerCase();
        refreshIfFrauen();
        requestAnimationFrame(function () {
          var again = document.querySelector("[data-frauen-q]");
          if (!again) return;
          again.focus();
          try {
            again.setSelectionRange(again.value.length, again.value.length);
          } catch (err) {}
        });
      });
    }
  }

  document.addEventListener("click", function (ev) {
    var t = ev.target && ev.target.closest ? ev.target.closest("[data-frauen-filter-toggle]") : null;
    if (t) {
      ev.preventDefault();
      filterOpen = !filterOpen;
      var panel = t.closest(".frauen-filter");
      if (panel) panel.classList.toggle("is-open", filterOpen);
      return;
    }
    var chip = ev.target && ev.target.closest ? ev.target.closest("[data-frauen-thema]") : null;
    if (!chip) return;
    ev.preventDefault();
    thema = chip.getAttribute("data-frauen-thema") || "alle";
    filterOpen = true;
    refreshIfFrauen();
  });

  window.DARFrauenFiqh = {
    render: render,
    parseValue: parseValue,
    pageMeta: pageMeta,
    bind: bind
  };
})();
