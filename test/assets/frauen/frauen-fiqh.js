(function () {
  "use strict";

  var FIQH_URL = "/test/data/frauen-fiqh.json";
  var SAHAB_URL = "/test/data/frauen-sahabiyyat.json";
  var ERLAUBTE_QUELLENART = {
    quran: 1,
    sahih: 1,
    hasan: 1,
    "zuverlaessiger-athar": 1
  };

  var FIQH_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "grundlagen", label: "Grundlagen" },
    { id: "reinigung", label: "Reinigung" },
    { id: "gebet", label: "Gebet" },
    { id: "fasten", label: "Fasten" },
    { id: "hidschab", label: "Ḥidschāb" },
    { id: "heirat", label: "Heirat" }
  ];
  var SAHAB_THEMEN = [
    { id: "alle", label: "Alle" },
    { id: "muetter-der-glaubigen", label: "Mütter der Gläubigen" },
    { id: "wissen", label: "Wissen" },
    { id: "standhaftigkeit", label: "Standhaftigkeit" },
    { id: "geduld", label: "Geduld" },
    { id: "ehe-familie", label: "Ehe & Familie" },
    { id: "mut", label: "Mut" },
    { id: "adab", label: "Adab" },
    { id: "ueberlieferung", label: "Überlieferung" }
  ];
  var FIQH_BEREICH_LABEL = {
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
  var FIQH_BEREICH_CHIP = {
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
  var SAHAB_BEREICH_LABEL = {
    "muetter-der-glaubigen": "Mütter der Gläubigen",
    wissen: "Wissen",
    standhaftigkeit: "Standhaftigkeit",
    geduld: "Geduld",
    "ehe-familie": "Ehe & Familie",
    mut: "Mut",
    adab: "Adab",
    ueberlieferung: "Überlieferung"
  };

  var fiqhCache = null;
  var sahabCache = null;
  var loadPromise = null;
  var fiqhQ = "";
  var sahabQ = "";
  var fiqhThema = "alle";
  var sahabThema = "alle";
  var currentAbschnitt = "hub";

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

  function lehreVon(e) {
    return e.lehre || e.nutzen || "";
  }

  function quelleKurz(e) {
    var s = String(e.quellenanzeige || "").replace(/^Quelle:\s*/i, "");
    if (s.length <= 110) return s;
    return s.slice(0, 108).replace(/\s+\S*$/, "") + "…";
  }

  function istSichtbar(e) {
    if (!e) return false;
    if (e.quellenstatus !== "geprueft") return false;
    if (!ERLAUBTE_QUELLENART[e.quellenart]) return false;
    if (!String(e.quellenanzeige || "").trim()) return false;
    if (!String(e.direktnachweisUrl || "").trim()) return false;
    return true;
  }

  function sichtbare(eintraege) {
    return (eintraege || []).filter(istSichtbar);
  }

  function fetchJson(url) {
    return fetch(url, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error(url + " " + r.status);
      return r.json();
    });
  }

  function load() {
    if (fiqhCache && sahabCache) return Promise.resolve();
    if (loadPromise) return loadPromise;
    loadPromise = Promise.all([fetchJson(FIQH_URL), fetchJson(SAHAB_URL)])
      .then(function (pair) {
        fiqhCache = pair[0];
        sahabCache = pair[1];
      })
      .catch(function (err) {
        loadPromise = null;
        throw err;
      });
    return loadPromise;
  }

  function parseValue(value) {
    var v = String(value || "").replace(/^\/+|\/+$/g, "");
    if (!v) return { page: "hub", abschnitt: "", kennung: "" };
    if (v === "fiqh") return { page: "list", abschnitt: "fiqh", kennung: "" };
    if (v.indexOf("fiqh/") === 0) return { page: "detail", abschnitt: "fiqh", kennung: v.slice(5) };
    if (v === "sahabiyyat") return { page: "list", abschnitt: "sahabiyyat", kennung: "" };
    if (v.indexOf("sahabiyyat/") === 0) {
      return { page: "detail", abschnitt: "sahabiyyat", kennung: v.slice(11) };
    }
    return { page: "hub", abschnitt: "", kennung: "" };
  }

  function cacheFor(abschnitt) {
    return abschnitt === "sahabiyyat" ? sahabCache : fiqhCache;
  }

  function matches(e, abschnitt) {
    var thema = abschnitt === "sahabiyyat" ? sahabThema : fiqhThema;
    var q = abschnitt === "sahabiyyat" ? sahabQ : fiqhQ;
    if (thema !== "alle") {
      var chip = abschnitt === "sahabiyyat" ? e.bereich : FIQH_BEREICH_CHIP[e.bereich] || e.bereich;
      if (chip !== thema) return false;
    }
    if (!q) return true;
    var hay = [
      e.name,
      titelVon(e),
      vorschauVon(e),
      e.inhalt,
      lehreVon(e),
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
      hubRow(
        "02",
        "Ṣaḥābiyyāt",
        "Geprüfte Ereignisse und Lehren aus dem Leben der Frauen der Ṣaḥābah.",
        "sahabiyyat",
        "Bereich öffnen"
      ) +
      hubRow("03", "Tābiʿiyyāt", "In Prüfung", "", "") +
      hubRow("04", "Frauen der Salaf", "In Prüfung", "", "") +
      hubRow("05", "Mütter der Gläubigen", "In Prüfung", "", "") +
      "</div></section>"
    );
  }

  function filterBlock(abschnitt, themen, q, thema) {
    var chips = themen
      .map(function (t) {
        return (
          '<button type="button" class="frauen-chip' +
          (thema === t.id ? " is-on" : "") +
          '" data-frauen-thema="' +
          esc(t.id) +
          '">' +
          esc(t.label) +
          "</button>"
        );
      })
      .join("");
    return (
      '<div class="frauen-filter is-open" data-frauen-abschnitt="' +
      esc(abschnitt) +
      '">' +
      '<p class="frauen-filter__label">Themen</p>' +
      '<div class="frauen-filter__chips frauen-filter__chips--always" role="tablist" aria-label="Themenfilter">' +
      chips +
      "</div>" +
      '<label class="frauen-filter__search-wrap">' +
      '<span class="visually-hidden">Aussagen suchen</span>' +
      '<input class="frauen-filter__search" type="search" placeholder="Suchen: Ḥayḍ, Ghusl, Fasten…" value="' +
      esc(q) +
      '" data-frauen-q autocomplete="off" spellcheck="false">' +
      "</label>" +
      "</div>"
    );
  }

  function listCard(e, abschnitt) {
    var labelMap = abschnitt === "sahabiyyat" ? SAHAB_BEREICH_LABEL : FIQH_BEREICH_LABEL;
    var bereich = labelMap[e.bereich] || e.bereich || "";
    var name = abschnitt === "sahabiyyat" && e.name ? '<p class="frauen-statement-card__name">' + esc(e.name) + "</p>" : "";
    var hair = '<span class="frauen-hairline" aria-hidden="true"></span>';
    return (
      '<article class="frauen-statement-card" data-nav="frauen" data-value="' +
      esc(abschnitt + "/" + e.kennung) +
      '">' +
      '<div class="frauen-statement-card__titel">' +
      name +
      "<h3>" +
      esc(titelVon(e)) +
      "</h3>" +
      '<p class="frauen-statement-card__meta">' +
      esc(bereich ? bereich + " · " : "") +
      "Geprüft</p>" +
      "</div>" +
      hair +
      '<p class="frauen-statement-card__preview">' +
      esc(vorschauVon(e)) +
      "</p>" +
      hair +
      '<p class="frauen-statement-card__quelle">' +
      esc(quelleKurz(e)) +
      "</p>" +
      hair +
      '<span class="frauen-open-btn">Aussage öffnen</span>' +
      "</article>"
    );
  }

  function renderList(abschnitt) {
    var data = cacheFor(abschnitt);
    var themen = abschnitt === "sahabiyyat" ? SAHAB_THEMEN : FIQH_THEMEN;
    var q = abschnitt === "sahabiyyat" ? sahabQ : fiqhQ;
    var thema = abschnitt === "sahabiyyat" ? sahabThema : fiqhThema;
    var items = sichtbare(data.eintraege).filter(function (e) {
      return matches(e, abschnitt);
    });
    var emptyMsg =
      abschnitt === "sahabiyyat"
        ? "Noch keine geprüften Inhalte vorhanden."
        : "Keine sichtbare Aussage zu dieser Auswahl.";
    var hint =
      abschnitt === "sahabiyyat"
        ? '<div class="frauen-hint"><p>Dieser Bereich enthält nur Berichte mit geprüfter Quelle. Schwache, ausgeschmückte oder nicht belegte Geschichten werden nicht angezeigt.</p></div>'
        : "";
    var lede =
      abschnitt === "sahabiyyat"
        ? '<p class="lede">Kurze, geprüfte Berichte. Die volle Aussage öffnet sich nach dem Tippen — mit Quelle und Direktnachweis.</p>'
        : '<p class="lede">Nur geprüfte Aussagen mit Direktnachweis. Die volle Aussage öffnet sich nach dem Tippen.</p>';
    return (
      '<section class="stack">' +
      lede +
      hint +
      filterBlock(abschnitt, themen, q, thema) +
      (items.length
        ? '<div class="frauen-statement-list">' +
          items.map(function (e) {
            return listCard(e, abschnitt);
          }).join("") +
          "</div>"
        : '<p class="frauen-empty">' + emptyMsg + "</p>") +
      "</section>"
    );
  }

  function renderDetail(abschnitt, kennung) {
    var data = cacheFor(abschnitt);
    var e = (data.eintraege || []).find(function (x) {
      return x.kennung === kennung && istSichtbar(x);
    });
    if (!e) {
      return '<p class="frauen-empty">Diese Aussage ist nicht sichtbar oder noch in Prüfung.</p>';
    }
    var kicker = abschnitt === "sahabiyyat" ? "Ṣaḥābiyyāt" : "Fiqh der Frauen";
    var nameLine =
      abschnitt === "sahabiyyat" && e.name
        ? '<p class="frauen-oval__kicker">' + esc(e.name) + " · " + kicker + "</p>"
        : '<p class="frauen-oval__kicker">' + kicker + "</p>";
    var linkText = e.direktnachweisText || "→ Quelle öffnen";
    var lehre = lehreVon(e);
    var hair = '<span class="frauen-hairline" aria-hidden="true"></span>';
    return (
      '<article class="frauen-post-reader">' +
      '<header class="frauen-oval frauen-oval--titel">' +
      nameLine +
      '<h2 class="frauen-oval__title">' +
      esc(titelVon(e)) +
      "</h2>" +
      '<p class="frauen-oval__meta">Titel · geprüfte Aussage</p>' +
      "</header>" +
      hair +
      '<section class="frauen-oval frauen-oval--aussage">' +
      '<p class="frauen-oval__kicker">Aussage</p>' +
      '<p class="frauen-oval__body">' +
      esc(e.inhalt) +
      "</p>" +
      (lehre
        ? hair +
          '<p class="frauen-oval__kicker">Nutzen / Lehre</p>' +
          '<p class="frauen-oval__nutzen">' +
          esc(lehre) +
          "</p>"
        : "") +
      "</section>" +
      hair +
      '<section class="frauen-oval frauen-oval--quelle">' +
      '<p class="frauen-oval__kicker">Quelle</p>' +
      '<p class="frauen-oval__cite">' +
      esc(e.quellenanzeige) +
      "</p>" +
      hair +
      '<p class="frauen-oval__kicker">Direktnachweis</p>' +
      '<a class="frauen-direktnachweis" href="' +
      esc(e.direktnachweisUrl) +
      '" target="_blank" rel="noopener noreferrer">' +
      esc(linkText) +
      "</a>" +
      "</section>" +
      '<button type="button" class="frauen-open-btn" data-nav="frauen" data-value="' +
      esc(abschnitt) +
      '">Zurück zur Übersicht</button>' +
      "</article>"
    );
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
    if (parsed.abschnitt === "sahabiyyat" && parsed.page === "list") {
      return {
        title: "Ṣaḥābiyyāt",
        subtitle: "Kurze, geprüfte Berichte über Frauen der frühen Generation – mit Quelle und Direktnachweis."
      };
    }
    if (parsed.abschnitt === "fiqh" && parsed.page === "list") {
      return {
        title: "Fiqh der Frauen",
        subtitle: "Suche und Filter · Aussage öffnen · Quelle und Direktnachweis"
      };
    }
    if (parsed.page === "detail") {
      return {
        title: parsed.abschnitt === "sahabiyyat" ? "Ṣaḥābiyyāt" : "Fiqh der Frauen",
        subtitle: "Aussage · Quelle und Direktnachweis"
      };
    }
    return {
      title: "Frauen im Islam",
      subtitle: "Geprüfte Aussagen. Kompakt wählen, dann nachprüfen."
    };
  }

  function render(value) {
    var parsed = parseValue(value);
    currentAbschnitt = parsed.abschnitt || "hub";
    if (!fiqhCache || (parsed.abschnitt === "sahabiyyat" && !sahabCache) || !sahabCache) {
      load().then(refreshIfFrauen).catch(refreshIfFrauen);
      return '<p class="frauen-empty">Bereich wird geladen…</p>';
    }
    if (parsed.page === "hub") {
      fiqhQ = "";
      sahabQ = "";
      fiqhThema = "alle";
      sahabThema = "alle";
      return renderHub();
    }
    if (parsed.page === "detail") return renderDetail(parsed.abschnitt, parsed.kennung);
    return renderList(parsed.abschnitt);
  }

  function bind() {
    var input = document.querySelector("[data-frauen-q]");
    if (input && !input.dataset.bound) {
      input.dataset.bound = "1";
      input.addEventListener("input", function () {
        var v = (input.value || "").trim().toLowerCase();
        if (currentAbschnitt === "sahabiyyat") sahabQ = v;
        else fiqhQ = v;
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
    var chip = ev.target && ev.target.closest ? ev.target.closest("[data-frauen-thema]") : null;
    if (!chip) return;
    ev.preventDefault();
    var id = chip.getAttribute("data-frauen-thema") || "alle";
    if (currentAbschnitt === "sahabiyyat") sahabThema = id;
    else fiqhThema = id;
    refreshIfFrauen();
  });

  window.DARFrauenFiqh = {
    render: render,
    parseValue: parseValue,
    pageMeta: pageMeta,
    bind: bind
  };
})();
