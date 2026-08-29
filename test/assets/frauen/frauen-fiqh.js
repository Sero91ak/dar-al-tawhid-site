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
  var BEREICH_LABEL = {
    grundlagen: "Grundlagen",
    reinigung: "Reinigung",
    gebet: "Gebet",
    fasten: "Fasten",
    "hijab-schamhaftigkeit": "Ḥidschāb",
    "ehe-familie": "Heirat",
    "moschee-gemeinschaft": "Gebet",
    "hajj-umrah": "Ḥajj",
    "fragen-antworten": "Grundlagen",
    "kleidung-im-gebet": "Gebet"
  };
  var BEREICH_CHIP = {
    grundlagen: "grundlagen",
    reinigung: "reinigung",
    gebet: "gebet",
    fasten: "fasten",
    "hijab-schamhaftigkeit": "hidschab",
    "ehe-familie": "heirat",
    "moschee-gemeinschaft": "gebet",
    "hajj-umrah": "gebet",
    "fragen-antworten": "grundlagen",
    "kleidung-im-gebet": "gebet"
  };

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

  function titelVon(e) {
    return e.titel || e.titel_de || "";
  }

  function vorschauVon(e) {
    return e.kurzvorschau || e.kurzbeschreibung || "";
  }

  function nutzenKurz(e) {
    var n = String(e.nutzen || "").trim();
    if (n.length <= 92) return n;
    return n.slice(0, 90).replace(/\s+\S*$/, "") + "…";
  }

  function quelleKurz(e) {
    var s = String(e.quellenanzeige || "").replace(/^Quelle:\s*/i, "");
    if (s.length <= 110) return s;
    return s.slice(0, 108).replace(/\s+\S*$/, "") + "…";
  }

  function istSichtbar(e) {
    if (!e) return false;
    if (e.quellenstatus !== "geprueft") return false;
    if (!String(e.quellenanzeige || "").trim()) return false;
    if (!String(e.direktnachweisUrl || "").trim()) return false;
    return true;
  }

  function sichtbare(eintraege) {
    return (eintraege || []).filter(istSichtbar);
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
      var chip = BEREICH_CHIP[e.bereich] || e.bereich;
      if (chip !== thema) return false;
    }
    if (!q) return true;
    var hay = [
      titelVon(e),
      vorschauVon(e),
      e.inhalt,
      e.nutzen,
      e.quellenanzeige,
      e.bereich,
      (e.schlagwoerter || []).join(" ")
    ]
      .join(" ")
      .toLowerCase();
    return hay.indexOf(q) !== -1;
  }

  function hubRow(nr, title, meta, value, openLabel) {
    var nav = value ? ' data-nav="frauen" data-value="' + esc(value) + '"' : "";
    return (
      '<article class="dua-theme-card' +
      (value ? "" : " is-pending") +
      '"' +
      nav +
      ">" +
      '<span class="dua-theme-card__idx" aria-hidden="true">' +
      nr +
      "</span>" +
      '<div class="dua-theme-card__icon" aria-hidden="true"><span class="emoji-emblem">✦</span></div>' +
      '<div class="dua-theme-card__body"><h3>' +
      esc(title) +
      "</h3>" +
      '<p class="dua-theme-card__count">' +
      esc(meta) +
      "</p>" +
      (openLabel ? '<span class="frauen-open-btn">' + esc(openLabel) + "</span>" : "") +
      "</div>" +
      '<span class="dua-theme-card__chev" aria-hidden="true">›</span>' +
      "</article>"
    );
  }

  function renderHub() {
    return (
      '<section class="stack">' +
      '<p class="lede">Geprüfte Aussagen. Kompakt wählen, dann die volle Aussage mit Quelle und Direktnachweis.</p>' +
      '<div class="dua-theme-grid frauen-fiqh-list">' +
      hubRow("01", "Fiqh der Frauen", "Reinigung · Gebet · Fasten · Ḥidschāb", "fiqh", "Bereich öffnen") +
      hubRow("02", "Ṣaḥābiyyāt", "In Prüfung", "", "") +
      hubRow("03", "Tābiʿiyyāt", "In Prüfung", "", "") +
      hubRow("04", "Frauen der Salaf", "In Prüfung", "", "") +
      hubRow("05", "Mütter der Gläubigen", "In Prüfung", "", "") +
      "</div></section>"
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
      .map(function (e) {
        var bereich = BEREICH_LABEL[e.bereich] || e.bereich || "";
        return (
          '<article class="frauen-statement-card" data-nav="frauen" data-value="fiqh/' +
          esc(e.kennung) +
          '">' +
          "<h3>" +
          esc(titelVon(e)) +
          "</h3>" +
          '<p class="frauen-statement-card__preview">' +
          esc(vorschauVon(e)) +
          "</p>" +
          '<p class="frauen-statement-card__meta">' +
          esc(bereich) +
          " · Geprüft</p>" +
          (e.nutzen
            ? '<p class="frauen-statement-card__nutzen">' + esc(nutzenKurz(e)) + "</p>"
            : "") +
          '<p class="frauen-statement-card__quelle">' +
          esc(quelleKurz(e)) +
          "</p>" +
          '<span class="frauen-open-btn">Aussage öffnen</span>' +
          "</article>"
        );
      })
      .join("");

    return (
      '<section class="stack">' +
      '<p class="lede">Nur geprüfte Aussagen mit Direktnachweis. Die volle Aussage öffnet sich nach dem Tippen.</p>' +
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
        ? '<div class="frauen-statement-list">' + rows + "</div>"
        : '<p class="frauen-empty">Keine sichtbare Aussage zu dieser Auswahl.</p>') +
      "</section>"
    );
  }

  function renderDetail(data, kennung) {
    var e = (data.eintraege || []).find(function (x) {
      return x.kennung === kennung && istSichtbar(x);
    });
    if (!e) {
      return '<p class="frauen-empty">Diese Aussage ist nicht sichtbar oder noch in Prüfung.</p>';
    }
    var linkText = e.direktnachweisText || "→ Quelle öffnen";
    return (
      '<article class="frauen-article">' +
      '<p class="frauen-article__kicker">Aussage · Fiqh der Frauen</p>' +
      '<h2 class="frauen-article__title">' +
      esc(titelVon(e)) +
      "</h2>" +
      '<p class="frauen-article__section">Aussage</p>' +
      '<p class="frauen-article__body">' +
      esc(e.inhalt) +
      "</p>" +
      (e.nutzen
        ? '<p class="frauen-article__section">Nutzen / Lehre</p><p class="frauen-article__nutzen">' +
          esc(e.nutzen) +
          "</p>"
        : "") +
      '<div class="frauen-source-card">' +
      '<p class="frauen-source-card__title">Quelle</p>' +
      "<p>" +
      esc(e.quellenanzeige) +
      "</p>" +
      '<p class="frauen-source-card__title frauen-source-card__title--sub">Direktnachweis</p>' +
      '<a class="frauen-direktnachweis" href="' +
      esc(e.direktnachweisUrl) +
      '" target="_blank" rel="noopener noreferrer">' +
      esc(linkText) +
      "</a>" +
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
        subtitle: "Suche und Filter · Aussage öffnen · Quelle und Direktnachweis"
      };
    }
    if (parsed.page === "detail" && cache) {
      var e = (cache.eintraege || []).find(function (x) {
        return x.kennung === parsed.kennung && istSichtbar(x);
      });
      return {
        title: e ? titelVon(e) : "Aussage",
        subtitle: "Fiqh der Frauen · Quelle und Direktnachweis"
      };
    }
    return {
      title: "Frauen im Islam",
      subtitle: "Geprüfte Aussagen. Kompakt wählen, dann nachprüfen."
    };
  }

  function render(value) {
    var parsed = parseValue(value);
    if (!cache) {
      load().then(refreshIfFrauen).catch(refreshIfFrauen);
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
