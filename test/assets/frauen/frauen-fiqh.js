(function () {
  "use strict";

  var BASE_SRC = "/test/assets/frauen/frauen-fiqh-base.js";
  var baseApi = null;
  var baseLoading = false;
  var baseLoaded = false;
  var baseFailed = false;
  var restCache = {};
  var restLoading = {};
  var allowedSourceTypes = { quran: true, sahih: true, hasan: true, "zuverlaessiger-athar": true };

  var REST_AREAS = [
    {
      nr: "33",
      slug: "arbeit-studium-oeffentlichkeit",
      title: "Arbeit, Studium & Öffentlichkeit",
      lede: "Geprüfte Grundlagen zu Wissen, Dienst, Öffentlichkeit und Grenzen – ohne moderne Berufs-Fatwas.",
      data: "/test/data/frauen-arbeit-studium-oeffentlichkeit.json",
      extraHub: false
    },
    {
      nr: "50",
      slug: "dawah-schreiben-digitale-praesenz",
      title: "Daʿwah, Schreiben & digitale Präsenz",
      lede: "Geprüfte Grundlagen zu Weitergabe von Wissen, Sprache, Schreiben und Verantwortung.",
      data: "/test/data/frauen-dawah-schreiben-digitale-praesenz.json",
      extraHub: true
    },
    {
      nr: "35",
      slug: "ruqyah-schutz-zuflucht",
      title: "Ruqyah, Schutz & Zuflucht",
      lede: "Geprüfte Grundlagen zu Zuflucht, Schutzsuren, Ruqyah und Tawakkul – ohne Aberglauben.",
      data: "/test/data/frauen-ruqyah-schutz-zuflucht.json",
      extraHub: false
    },
    {
      nr: "51",
      slug: "tod-janazah-graeber-adab",
      title: "Tod, Janāzah & Gräber-Adab",
      lede: "Geprüfte Grundlagen zu Tod, Waschung, Trauer, Janāzah und Grenzen bei Gräbern.",
      data: "/test/data/frauen-tod-janazah-graeber-adab.json",
      extraHub: true
    },
    {
      nr: "52",
      slug: "ramadan-freiwillige-taten-jahreszeiten",
      title: "Ramaḍān, freiwillige Taten & Jahreszeiten",
      lede: "Geprüfte Grundlagen zu Fasten, Laylat al-Qadr, Ṣadaqah und freiwilliger ʿIbādah.",
      data: "/test/data/frauen-ramadan-freiwillige-taten-jahreszeiten.json",
      extraHub: true
    },
    {
      nr: "53",
      slug: "schwache-geschichten-falschzitate",
      title: "Warnung vor schwachen Geschichten & Falschzitaten",
      lede: "Schutz vor erfundenen Erzählungen, schwachen Zitaten und ungeprüften Beiträgen.",
      data: "/test/data/frauen-schwache-geschichten-falschzitate.json",
      extraHub: true,
      projectRules: [
        "Keine Aussage ohne Quelle",
        "Kein Direktnachweis = nicht sichtbar",
        "Schwach = nicht sichtbar",
        "Unklar = nicht sichtbar",
        "Social-Media-Quelle reicht nicht",
        "Athar nur nach Prüfung",
        "Aussage muss vom Nachweis getragen werden"
      ]
    },
    {
      nr: "54",
      slug: "gesamtpruefung-quellen-audit",
      title: "Gesamtprüfung & Quellen-Audit",
      lede: "Strenge Prüfung aller Frauenbereiche, Quellen, Direktnachweise, Athār und sichtbaren Aussagen.",
      data: "/test/data/frauen-gesamtpruefung-quellen-audit.json",
      extraHub: true,
      audit: true
    }
  ];

  var REST_BY_SLUG = REST_AREAS.reduce(function (acc, area) {
    acc[area.slug] = area;
    return acc;
  }, {});

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeValue(value) {
    var v = String(value || "").trim();
    v = v.replace(/^#\/?/, "").replace(/^\/+|\/+$/g, "");
    if (v.indexOf("frauen/") === 0) v = v.slice(7);
    return v;
  }

  function parseRest(value) {
    var v = normalizeValue(value);
    var parts = v.split("/");
    var slug = parts[0] || "";
    if (!REST_BY_SLUG[slug]) return null;
    return {
      page: parts.length > 1 && parts.slice(1).join("/") ? "detail" : "list",
      abschnitt: slug,
      kennung: parts.slice(1).join("/") || "",
      restbereich: true
    };
  }

  function refreshFrauen() {
    try {
      window.dispatchEvent(new HashChangeEvent("hashchange"));
      return;
    } catch (err) {}
    try {
      window.dispatchEvent(new Event("hashchange"));
    } catch (err2) {}
  }

  function ensureBase() {
    if (baseLoaded || baseLoading || baseFailed) return;
    baseLoading = true;
    var script = document.createElement("script");
    script.src = BASE_SRC;
    script.defer = true;
    script.onload = function () {
      baseLoaded = true;
      baseLoading = false;
      baseApi = window.DARFrauenFiqh;
      patchBaseApi();
      refreshFrauen();
    };
    script.onerror = function () {
      baseFailed = true;
      baseLoading = false;
      refreshFrauen();
    };
    (document.head || document.documentElement).appendChild(script);
  }

  function loadRest(area) {
    if (!area || restCache[area.slug] || restLoading[area.slug]) return;
    restLoading[area.slug] = true;
    fetch(area.data, { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (json) {
        restCache[area.slug] = json || {};
      })
      .catch(function () {
        restCache[area.slug] = { eintraege: [] };
      })
      .then(function () {
        restLoading[area.slug] = false;
        refreshFrauen();
      });
  }

  function requiresSerhatApproval(entry) {
    if (!entry) return false;
    if (entry.quellenart === "zuverlaessiger-athar") return true;
    var haystack = [
      entry.person,
      entry.titel,
      entry.bereich,
      entry.thema,
      entry.quellenart,
      entry.quellenanzeige,
      entry.atharPruefung,
      entry.hinweise
    ].join(" ");
    return /(athar|āthār|salaf|tābi|tabi|imām|imam|ṣaḥāb|sahab|überlieferung)/i.test(haystack);
  }

  function canShowEntry(entry) {
    if (!entry) return false;
    if (entry.quellenstatus !== "geprueft") return false;
    if (entry.sichtbar !== true) return false;
    if (!String(entry.quellenanzeige || "").trim()) return false;
    if (!String(entry.direktnachweisText || "").trim()) return false;
    var url = String(entry.direktnachweisUrl || "").trim();
    if (!url || url.indexOf("https://") !== 0) return false;
    if (!allowedSourceTypes[entry.quellenart]) return false;
    if (requiresSerhatApproval(entry) && entry.freigabeDurchSerhat !== true) return false;
    if (!String(entry.vollstaendigeAussage || entry.inhalt || "").trim()) return false;
    return true;
  }

  function visibleEntries(data) {
    return (data && Array.isArray(data.eintraege) ? data.eintraege : []).filter(canShowEntry);
  }

  function emptyState() {
    return '<div class="frauen-empty"><p>Noch keine geprüften Inhalte vorhanden.</p><p>Dieser Bereich wird derzeit quellenbasiert geprüft.</p></div>';
  }

  function renderProjectRules(area) {
    if (!area || !Array.isArray(area.projectRules)) return "";
    return '<section class="frauen-hint frauen-source-rules"><h3>Quellenstandard</h3><ul>' +
      area.projectRules.map(function (rule) { return "<li>" + esc(rule) + "</li>"; }).join("") +
      "</ul></section>";
  }

  function renderEntryCard(entry, area) {
    var Aussage = String(entry.vollstaendigeAussage || entry.inhalt || "").trim();
    return '<article class="post-card frauen-card frauen-rest-entry">' +
      '<h3>' + esc(entry.titel || area.title) + '</h3>' +
      '<p>' + esc(Aussage) + '</p>' +
      '<p class="post-source">' + esc(entry.quellenanzeige) + '</p>' +
      '<p class="post-source-link"><a href="' + esc(entry.direktnachweisUrl) + '" target="_blank" rel="noopener noreferrer">' + esc(entry.direktnachweisText || "→ Quelle öffnen") + '</a></p>' +
      '</article>';
  }

  function renderRest(parsed) {
    var area = REST_BY_SLUG[parsed.abschnitt];
    if (!area) return baseApi && baseApi.render ? baseApi.render(parsed.abschnitt) : emptyState();
    if (area.audit) {
      return '<div class="topics-hub frauen-hub frauen-restbereich frauen-audit-view">' +
        '<section class="frauen-hint"><h3>Dieser Bereich befindet sich in Prüfung.</h3><p>Die Detailprüfung bleibt intern. Sichtbar werden nur geprüfte Aussagen mit Quelle und Direktnachweis.</p></section>' +
        '</div>';
    }
    var data = restCache[area.slug];
    if (!data) {
      loadRest(area);
      return '<p class="frauen-empty">Bereich wird geladen…</p>';
    }
    var entries = visibleEntries(data);
    if (parsed.page === "detail") {
      var found = entries.filter(function (e) { return String(e.kennung || "") === parsed.kennung; })[0];
      if (!found) return '<div class="topics-hub frauen-hub frauen-restbereich">' + emptyState() + '</div>';
      return '<div class="topics-hub frauen-hub frauen-restbereich">' + renderEntryCard(found, area) + '</div>';
    }
    return '<div class="topics-hub frauen-hub frauen-restbereich">' +
      '<section class="frauen-hint"><h3>' + esc(area.title) + '</h3><p>' + esc(area.lede) + '</p></section>' +
      renderProjectRules(area) +
      (entries.length ? '<section class="post-grid topic-collection frauen-post-list">' + entries.map(function (entry) { return renderEntryCard(entry, area); }).join("") + '</section>' : emptyState()) +
      '</div>';
  }

  function restHubCard(area) {
    return '<a class="topics-theme-card dua-theme-card is-pending frauen-rest-card" href="#/frauen/' + esc(area.slug) + '" data-frauen-rest-nav="' + esc(area.slug) + '">' +
      '<span class="topics-theme-card__idx dua-theme-card__idx" aria-hidden="true">' + esc(area.nr) + '</span>' +
      '<div class="topics-theme-card__icon dua-theme-card__icon" aria-hidden="true">◇</div>' +
      '<div class="topics-theme-card__body dua-theme-card__body"><h3>' + esc(area.title) + '</h3>' +
      '<p class="topics-theme-card__lede">' + esc(area.lede) + '</p>' +
      '<p class="topics-theme-card__count dua-theme-card__count">In Prüfung</p></div>' +
      '<span class="topics-theme-card__chev dua-theme-card__chev" aria-hidden="true">›</span>' +
      '</a>';
  }

  function injectHub(html) {
    var extra = REST_AREAS.filter(function (area) { return area.extraHub; });
    if (!extra.length || String(html || "").indexOf("frauen-restbereiche-extra") >= 0) return html;
    return String(html || "") +
      '<section class="category-cluster frauen-restbereiche-extra" aria-label="Restbereiche Frauen im Islam">' +
      '<div class="topics-theme-grid grid-list frauen-fiqh-list">' +
      extra.map(restHubCard).join("") +
      '</div></section>';
  }

  function metaFor(value) {
    var parsed = parseRest(value);
    if (parsed) {
      var area = REST_BY_SLUG[parsed.abschnitt];
      return {
        title: area ? area.title : "Frauen im Islam",
        subtitle: area && area.audit ? "Qualitätsbereich · interne Prüfung" : "Aussage · Quelle und Direktnachweis"
      };
    }
    if (baseApi && baseApi.pageMeta) return baseApi.pageMeta(value);
    return { title: "Frauen im Islam", subtitle: "Geprüfte Aussagen. Kompakt wählen, dann nachprüfen." };
  }

  function bindRest() {
    var nodes = document.querySelectorAll("[data-frauen-rest-nav]");
    for (var i = 0; i < nodes.length; i += 1) {
      if (nodes[i].dataset.restBound) continue;
      nodes[i].dataset.restBound = "1";
      nodes[i].addEventListener("click", function (ev) {
        ev.preventDefault();
        var slug = this.getAttribute("data-frauen-rest-nav") || "";
        if (slug && typeof window.navigate === "function") window.navigate("frauen", slug);
        else if (slug) window.location.hash = "#/frauen/" + slug;
      });
    }
  }

  function patchBaseApi() {
    if (!baseApi || baseApi.__restbereichePatch) return;
    var original = baseApi;
    window.DARFrauenFiqh = {
      __restbereichePatch: true,
      render: function (value) {
        var parsed = parseRest(value);
        if (parsed) return renderRest(parsed);
        var html = original.render ? original.render(value) : "";
        var baseParsed = original.parseValue ? original.parseValue(value) : { page: "hub" };
        return baseParsed && baseParsed.page === "hub" ? injectHub(html) : html;
      },
      parseValue: function (value) {
        return parseRest(value) || (original.parseValue ? original.parseValue(value) : { page: "hub", abschnitt: "", kennung: "" });
      },
      pageMeta: metaFor,
      bind: function () {
        if (original.bind) original.bind();
        bindRest();
      }
    };
    baseApi = window.DARFrauenFiqh;
  }

  window.DARFrauenFiqh = {
    render: function (value) {
      var parsed = parseRest(value);
      if (parsed) return renderRest(parsed);
      ensureBase();
      return baseFailed ? '<p class="frauen-empty">Bereich konnte nicht geladen werden.</p>' : '<p class="frauen-empty">Bereich wird geladen…</p>';
    },
    parseValue: function (value) {
      var parsed = parseRest(value);
      if (parsed) return parsed;
      ensureBase();
      return { page: "hub", abschnitt: "", kennung: "" };
    },
    pageMeta: metaFor,
    bind: bindRest
  };

  ensureBase();
})();
