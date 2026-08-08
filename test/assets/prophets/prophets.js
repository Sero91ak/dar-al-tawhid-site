/**
 * DAR AL TAWḤĪD — Propheten Wissensbibliothek (Live + Test)
 * Claim-based profiles · master-detail by viewport width · no UA detection.
 */
(function (global) {
  "use strict";

  function dataBase() {
    try {
      if (location.pathname.indexOf("/test/") === 0 || location.pathname === "/test") return "/test/data/prophets/";
    } catch (e) {}
    return "/data/prophets/";
  }
  var DATA_BASE = dataBase();
  var DUAL_MIN = 720;
  var STATE_KEY = "dar_prophets_ui_v1";
  var LAST_READ_KEY = "dar_prophets_last_read_v1";
  var indexCache = null;
  var searchIndexCache = null;
  var profileCache = Object.create(null);
  var hadithCache = Object.create(null);
  var relationCache = Object.create(null);
  var loadIndexPromise = null;
  var resizeBound = false;
  var lastWidthMode = "";
  var DISPUTED_STATUSES = {
    disputed: 1,
    scholarly_disputed: 1,
    scholarly_disputed_or_inferred: 1,
    scholarly_source_correlation: 1,
    quran_named_status_under_review: 1
  };

  var TABS = [
    { id: "overview", label: "Übersicht" },
    { id: "lebensweg", label: "Lebensweg" },
    { id: "quran", label: "Qurʾān" },
    { id: "sunnah", label: "Sunnah" },
    { id: "aussagen", label: "Aussagen" },
    { id: "familie", label: "Familie" },
    { id: "ereignisse", label: "Ereignisse" },
    { id: "quellen", label: "Quellen" }
  ];

  var FILTER_DEFS = [
    { id: "all", label: "Alle", flag: "all" },
    { id: "quran", label: "Qurʾān", flag: "quran" },
    { id: "sunnah", label: "Sunnah", flag: "sunnah" },
    { id: "ulu", label: "Ulū l-ʿAzm", flag: "ulu" },
    { id: "banuIsrail", label: "Banū Isrāʾīl", flag: "banuIsrail" },
    { id: "arabicMessenger", label: "Arabische Gesandte", flag: "arabicMessenger" },
    { id: "further", label: "Weitere Personen", flag: "further" }
  ];

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function isTest() {
    try {
      return !!(global.IS_TEST_PATH || (location.pathname.indexOf("/test/") === 0) || location.pathname === "/test");
    } catch (e) {
      return false;
    }
  }

  function readState() {
    try {
      return JSON.parse(sessionStorage.getItem(STATE_KEY) || "{}") || {};
    } catch (e) {
      return {};
    }
  }

  function writeState(patch) {
    var cur = readState();
    Object.keys(patch || {}).forEach(function (k) {
      cur[k] = patch[k];
    });
    try {
      sessionStorage.setItem(STATE_KEY, JSON.stringify(cur));
    } catch (e) {}
    return cur;
  }

  function measureWidth() {
    var root = document.querySelector(".prophets-root");
    if (root && root.clientWidth) return root.clientWidth;
    var vv = global.visualViewport;
    return Math.round((vv && vv.width) || document.documentElement.clientWidth || global.innerWidth || 0);
  }

  function isDualMode() {
    return measureWidth() >= DUAL_MIN;
  }

  function rolesLabel(roles) {
    var map = { nabī: "Nabī", rasūl: "Rasūl", nabi: "Nabī", rasul: "Rasūl" };
    return (roles || [])
      .map(function (r) {
        return map[r] || r;
      })
      .filter(Boolean)
      .join(" · ");
  }

  /* Keine Prophetenporträts/Figuren — nur dezente Geometrie. */
  function prophetMark(id, p) {
    if (p && p.uluAlAzm) return "✦";
    if (p && isDisputedStatus(p.prophetStatus)) return "◇";
    return "◆";
  }

  function isDisputedStatus(status) {
    return !!(status && DISPUTED_STATUSES[String(status)]);
  }

  function publicStatusLabel(gradingOrStatus) {
    var g = String(gradingOrStatus || "").toLowerCase();
    if (g === "quran" || g === "qurʾān") return "Qurʾān";
    if (g.indexOf("sahih") >= 0 || g.indexOf("ṣaḥīḥ") >= 0) return "Ṣaḥīḥ";
    if (g.indexOf("hasan") >= 0 || g.indexOf("ḥasan") >= 0) return "Ḥasan";
    if (g.indexOf("athar") >= 0) return "Authentischer Athar";
    if (isDisputedStatus(g) || g.indexOf("disputed") >= 0 || g.indexOf("umstritten") >= 0) return "Umstritten";
    if (g.indexOf("not_authentically") >= 0 || g.indexOf("nicht authentisch") >= 0 || g.indexOf("unattested") >= 0) {
      return "Nicht authentisch belegt";
    }
    return gradingOrStatus || "";
  }

  function disputedStatusNote(metaOrProfile) {
    var p = metaOrProfile || {};
    if (!isDisputedStatus(p.prophetStatus)) return "";
    if (p.quranNamed || (p.identity && p.identity.quranNamed)) {
      return "Im Qurʾān genannt · Prophetenstatus unter den Gelehrten unterschiedlich eingeordnet";
    }
    if (p.prophetStatus === "scholarly_source_correlation" || p.prophetStatus === "scholarly_disputed_or_inferred") {
      return "In authentischer Sunnah namentlich verbunden · Prophetenstatus nicht als Konsens darstellen";
    }
    return "Prophetenstatus unter den Gelehrten unterschiedlich eingeordnet";
  }

  function sectionCountLabel(n) {
    return String(n) + (n === 1 ? " Eintrag" : " Einträge");
  }


  /* Zero-Trust: fehlender Status ≠ freigegeben. Nur explizites approved. */
  function approvedOnly(items) {
    return (items || []).filter(function (x) {
      return x && x.verificationStatus === "approved";
    });
  }

  function claimsApproved(profile, claimIds) {
    var ids = claimIds || [];
    if (!ids.length) return false;
    return ids.every(function (id) {
      var c = claimById(profile, id);
      return c && c.verificationStatus === "approved";
    });
  }

  function isFeatureEnabled(index) {
    var idx = index || indexCache;
    var env = (idx && idx.env) || {};
    if (isTest()) return env.test === "enabled" || env.test === true;
    return env.production === "enabled" || env.production === true;
  }

  function claimById(profile, id) {
    return ((profile && profile.claims) || []).find(function (c) {
      return c.id === id;
    });
  }

  function loadIndex() {
    if (indexCache) return Promise.resolve(indexCache);
    if (loadIndexPromise) return loadIndexPromise;
    loadIndexPromise = fetch(DATA_BASE + "index.json", { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("index " + r.status);
        return r.json();
      })
      .then(function (data) {
        indexCache = data;
        return loadSearchIndex().then(function () { return data; });
      })
      .catch(function (err) {
        loadIndexPromise = null;
        throw err;
      });
    return loadIndexPromise;
  }

  function loadSearchIndex() {
    if (searchIndexCache) return Promise.resolve(searchIndexCache);
    return fetch(DATA_BASE + "search-index.json", { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("search-index " + r.status);
        return r.json();
      })
      .then(function (data) {
        searchIndexCache = data;
        return data;
      })
      .catch(function () {
        searchIndexCache = { entries: [] };
        return searchIndexCache;
      });
  }

  function searchEntry(id) {
    var entries = (searchIndexCache && searchIndexCache.entries) || [];
    return entries.find(function (e) { return String(e.prophetId) === String(id); }) || null;
  }

  function loadRelation(id) {
    var key = String(id || "");
    if (!key) return Promise.resolve(null);
    if (Object.prototype.hasOwnProperty.call(relationCache, key)) return Promise.resolve(relationCache[key]);
    return fetch(DATA_BASE + "relations/" + encodeURIComponent(key) + ".json", { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("relation " + r.status);
        return r.json();
      })
      .then(function (data) {
        relationCache[key] = data;
        return data;
      })
      .catch(function () {
        relationCache[key] = null;
        return null;
      });
  }

  function readLastRead() {
    try { return JSON.parse(localStorage.getItem(LAST_READ_KEY) || "null"); } catch (e) { return null; }
  }

  function writeLastRead(entry) {
    try { localStorage.setItem(LAST_READ_KEY, JSON.stringify(entry || null)); } catch (e) {}
  }

  function isOnline() {
    try { return navigator.onLine !== false; } catch (e) { return true; }
  }

  function openExternalSafe(url) {
    if (!url) return;
    if (!isOnline()) {
      try { alert("Quelle online öffnen\n\nInternetverbindung erforderlich."); } catch (e) {}
      return;
    }
    try {
      var a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.click();
    } catch (e) {
      try { window.open(url, "_blank", "noopener,noreferrer"); } catch (e2) {}
    }
  }

  function profileFileFor(id) {
    var meta = findMeta(id);
    if (meta && meta.profileFile) return String(meta.profileFile).replace(/^\/+/, "");
    return encodeURIComponent(String(id || "")) + ".json";
  }

  function loadHadith(hadithId) {
    var key = String(hadithId || "");
    if (!key) return Promise.resolve(null);
    if (Object.prototype.hasOwnProperty.call(hadithCache, key)) {
      return Promise.resolve(hadithCache[key]);
    }
    return fetch(DATA_BASE + "hadith/" + encodeURIComponent(key) + ".json", { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("hadith " + r.status);
        return r.json();
      })
      .then(function (data) {
        hadithCache[key] = data;
        return data;
      })
      .catch(function () {
        hadithCache[key] = null;
        return null;
      });
  }

  function collectHadithIds(profile) {
    var ids = [];
    var seen = Object.create(null);
    function add(hid) {
      if (!hid || seen[hid]) return;
      seen[hid] = 1;
      ids.push(hid);
    }
    (profile.claims || []).forEach(function (c) {
      add(c.hadithId || (c.hadithRef && c.hadithRef.hadithId));
    });
    return ids;
  }

  function hydrateProfileHadith(profile) {
    if (!profile || profile.__hadithHydrated) return Promise.resolve(profile);
    var ids = collectHadithIds(profile);
    if (!ids.length) {
      profile.__hadithHydrated = true;
      return Promise.resolve(profile);
    }
    return Promise.all(ids.map(loadHadith)).then(function (rows) {
      var map = Object.create(null);
      rows.forEach(function (h) {
        if (h && h.id) map[h.id] = h;
      });
      (profile.claims || []).forEach(function (c) {
        var hid = c.hadithId || (c.hadithRef && c.hadithRef.hadithId);
        var h = hid && map[hid];
        if (!h) return;
        if (!c.arabicOriginal && h.arabicOriginal) c.arabicOriginal = h.arabicOriginal;
        if (!c.translationDe && h.translationDe) c.translationDe = h.translationDe;
        if (!c.directReference && h.directReference) c.directReference = h.directReference;
        if (!c.rawi && h.rawi) c.rawi = h.rawi;
        if (!c.grading && h.grading) c.grading = h.grading;
      });
      profile.__hadithHydrated = true;
      return profile;
    });
  }

  function loadProfile(id) {
    var key = String(id || "");
    if (!key) return Promise.resolve(null);
    if (profileCache[key]) return Promise.resolve(profileCache[key]);
    var start = indexCache ? Promise.resolve(indexCache) : loadIndex();
    return start
      .then(function () {
        var file = profileFileFor(key);
        return fetch(DATA_BASE + file, { cache: "no-store" });
      })
      .then(function (r) {
        if (!r.ok) throw new Error("profile " + r.status);
        return r.json();
      })
      .then(function (data) {
        return hydrateProfileHadith(data);
      })
      .then(function (data) {
        profileCache[key] = data;
        return data;
      })
      .catch(function () {
        profileCache[key] = null;
        return null;
      });
  }

  function parseRouteValue(value) {
    var parts = String(value || "")
      .split("/")
      .map(function (p) {
        return decodeURIComponent(p || "").trim();
      })
      .filter(Boolean);
    return {
      prophetId: parts[0] || "",
      section: parts[1] || "overview",
      sub: parts[2] || ""
    };
  }

  function navigateProphets(prophetId, section, opts) {
    var nav = global.navigate;
    if (typeof nav !== "function") return;
    var path = "";
    if (prophetId) {
      path = prophetId + (section && section !== "overview" ? "/" + section : "");
    }
    nav("propheten", path, opts || {});
  }

  function surahName(n) {
    try {
      if (typeof global.quranSurahMeta === "function") {
        var m = global.quranSurahMeta(n);
        if (m && m.transliteration) return m.transliteration;
      }
    } catch (e) {}
    return "Sure " + n;
  }

  function openQuran(surah, ayah) {
    if (typeof global.openQuranSurah === "function") {
      global.openQuranSurah(Number(surah), Number(ayah) || 0, { replace: false });
      return;
    }
    if (typeof global.navigate === "function") {
      global.navigate("quran-surah", Number(surah) + (ayah ? "/" + Number(ayah) : ""));
    }
  }

  /* —— Spotlight in Mehr (kompakt wie andere Feature-Zeilen, edle Kante/Licht) —— */
  function renderSpotlight() {
    /* Besucher: kein Spotlight solange production disabled. */
    if (!isTest()) {
      if (!indexCache || !isFeatureEnabled(indexCache)) return "";
    }
    return (
      '<button type="button" class="prophets-spotlight more-feature-row" data-nav="propheten" data-feature-search="die propheten anbiya quran sunnah ueberlieferungen lernen wissen musa" aria-label="Die Propheten öffnen">' +
      '<span class="feature-icon prophets-spotlight__icon" aria-hidden="true">✦</span>' +
      '<span class="prophets-spotlight__body">' +
      "<h4>Die Propheten <span class=\"feature-badge\">Wissen</span></h4>" +
      '<p><span class="prophets-spotlight__ar-inline" lang="ar" dir="rtl">الأنبياء</span>' +
      " · Qurʾān · Sunnah · authentische Überlieferungen</p>" +
      "</span>" +
      '<span class="prophets-spotlight__edge" aria-hidden="true"></span>' +
      "</button>"
    );
  }

  function normalizeQuery(q) {
    return String(q || "")
      .trim()
      .toLowerCase()
      .replace(/ā/g, "a")
      .replace(/ī/g, "i")
      .replace(/ū/g, "u")
      .replace(/ʿ|ʾ|ʼ/g, "")
      .replace(/ḥ/g, "h")
      .replace(/ṣ/g, "s")
      .replace(/ḍ/g, "d")
      .replace(/ẓ/g, "z")
      .replace(/ṭ/g, "t")
      .replace(/ǧ|ğ/g, "g");
  }

  function matchesQuery(p, q) {
    if (!q) return true;
    var nq = normalizeQuery(q);
    var entry = searchEntry(p.id);
    var blob = entry && entry.searchBlob
      ? entry.searchBlob
      : [p.name, p.nameAr, p.id, p.people, (p.searchTerms || []).join(" "), p.note || ""].join(" ");
    var nb = normalizeQuery(blob);
    if (nb.indexOf(nq) !== -1) return true;
    // raw arabic / original also
    return String(blob).toLowerCase().indexOf(String(q).trim().toLowerCase()) !== -1;
  }

  function isFurtherPerson(p) {
    if (!p) return false;
    if (p.furtherPerson || p.listSection === "further") return true;
    if (String(p.id) === "dhul-kifl") return true;
    if (isDisputedStatus(p.prophetStatus)) return true;
    return false;
  }

  function filterProphets(index, filter, query) {
    var q = String(query || "").trim();
    var established = (index.prophets || []).filter(function (p) { return !isFurtherPerson(p); });
    var further = (index.furtherPersons || []).slice();
    if (!further.length) {
      further = (index.prophets || [])
        .filter(function (p) { return isFurtherPerson(p); })
        .concat(index.disputed || []);
      // dedupe
      var seen = Object.create(null);
      further = further.filter(function (p) {
        if (seen[p.id]) return false;
        seen[p.id] = 1;
        return true;
      });
    }
    if (filter === "further" || filter === "disputed") {
      return {
        established: [],
        ulu: [],
        further: further.filter(function (p) { return matchesQuery(p, q); })
      };
    }
    var list = established.filter(function (p) {
      if (filter === "ulu" && !(p.uluAlAzm || (p.classifications && p.classifications.uluAlAzm))) return false;
      if (filter === "quran" && p.prophetStatus !== "quran_explicit") return false;
      if (filter === "sunnah" && !(p.hasSunnah || (p.classifications && p.classifications.hasSunnah))) return false;
      if (filter === "banuIsrail" && !(p.banuIsrail || (p.classifications && p.classifications.banuIsrail))) return false;
      if (filter === "arabicMessenger" && !(p.arabicMessenger || (p.classifications && p.classifications.arabicMessenger))) return false;
      return matchesQuery(p, q);
    });
    var ulu = list.filter(function (p) { return p.uluAlAzm; });
    var rest = list.filter(function (p) { return !p.uluAlAzm; });
    var showFurther = filter === "all";
    return {
      established: rest,
      ulu: ulu,
      further: showFurther ? further.filter(function (p) { return matchesQuery(p, q); }) : []
    };
  }

  function renderRow(p, activeId) {
    var active = String(p.id) === String(activeId);
    var roles = isDisputedStatus(p.prophetStatus) ? "" : rolesLabel(p.roles);
    var meta = [roles, p.people].filter(Boolean).join(" · ");
    var mark = prophetMark(p.id, p);
    return (
      '<button type="button" class="prophets-row' +
      (active ? " is-active" : "") +
      '" data-prophet-id="' +
      esc(p.id) +
      '">' +
      '<span class="prophets-row__icon" aria-hidden="true">' + mark + "</span>" +
      '<span class="prophets-row__body">' +
      '<span class="prophets-row__name">' + esc(p.name) + "</span>" +
      (p.nameAr
        ? '<span class="prophets-row__ar" lang="ar" dir="rtl">' + esc(p.nameAr) + "</span>"
        : "") +
      (p.honorific ? '<span class="prophets-row__honor">' + esc(p.honorific) + "</span>" : "") +
      (meta ? '<span class="prophets-row__meta">' + esc(meta) + "</span>" : "") +
      "</span>" +
      '<span class="prophets-row__chev" aria-hidden="true">›</span>' +
      "</button>"
    );
  }

  function availableFilters(index) {
    var flags = (index && index.availableFilters) || {};
    return FILTER_DEFS.filter(function (f) {
      if (f.id === "all" || f.id === "quran" || f.id === "further") return true;
      return !!flags[f.flag];
    });
  }

  function renderLastReadCard() {
    var lr = readLastRead();
    if (!lr || !lr.prophetId) return "";
    return (
      '<button type="button" class="prophets-lastread" data-prophets-continue="' +
      esc(lr.prophetId) +
      '" data-prophets-continue-tab="' +
      esc(lr.tab || "overview") +
      '">' +
      '<span class="prophets-lastread__kicker">Zuletzt gelesen</span>' +
      '<span class="prophets-lastread__title">' +
      esc(lr.name || lr.prophetId) +
      (lr.honorific ? " " + esc(lr.honorific) : "") +
      "</span>" +
      '<span class="prophets-lastread__meta">' +
      esc(lr.tabLabel || lr.tab || "Übersicht") +
      (lr.snippet ? " · " + esc(lr.snippet) : "") +
      "</span>" +
      '<span class="prophets-lastread__cta">Weiterlesen</span>' +
      "</button>"
    );
  }

  function renderListPanel(index, state, activeId) {
    var filter = state.filter || "all";
    var query = state.query || "";
    var packs = filterProphets(index, filter, query);
    var filtersHtml = availableFilters(index)
      .map(function (f) {
        return (
          '<button type="button" class="prophets-filter' +
          (filter === f.id ? " is-active" : "") +
          '" data-prophets-filter="' +
          esc(f.id) +
          '">' +
          esc(f.label) +
          "</button>"
        );
      })
      .join("");

    function section(title, items) {
      if (!items.length) return "";
      return (
        '<div class="prophets-section-label"><b>' +
        esc(title) +
        "</b><span>" +
        esc(sectionCountLabel(items.length)) +
        '</span></div><div class="prophets-list">' +
        items.map(function (p) { return renderRow(p, activeId); }).join("") +
        "</div>"
      );
    }

    var body = "";
    body += section("Ulū l-ʿAzm", packs.ulu || []);
    body += section("Belegte Propheten", packs.established || []);
    body += section("Weitere Qurʾān- und Sunnah-Personen", packs.further || []);
    if (!(packs.ulu || []).length && !(packs.established || []).length && !(packs.further || []).length) {
      body = '<div class="prophets-empty">Keine Treffer für diese Suche.</div>';
    }

    var intro =
      index.intro ||
      "Was Qurʾān, authentische Sunnah und gesicherte frühe Überlieferungen über die Propheten berichten.";

    return (
      '<div class="prophets-toolbar">' +
      '<div class="prophets-hero-title" aria-hidden="true">' +
      '<span class="prophets-hero-title__de">Die Propheten</span>' +
      '<span class="prophets-hero-title__ar" lang="ar" dir="rtl">الأنبياء</span>' +
      "</div>" +
      '<p class="prophets-toolbar__intro">' +
      esc(intro) +
      "</p>" +
      renderLastReadCard() +
      '<div class="prophets-search-block">' +
      '<input class="prophets-search" id="prophetsSearch" type="search" placeholder="Name, Volk, Ereignis, Sūrah …" value="' +
      esc(query) +
      '" autocomplete="off" enterkeyhint="search" />' +
      "</div>" +
      '<div class="prophets-filter-bar">' +
      '<span class="prophets-filter-bar__label">Filter</span>' +
      '<div class="prophets-filters" role="toolbar" aria-label="Propheten filtern">' +
      filtersHtml +
      "</div>" +
      "</div>" +
      "</div>" +
      body +
      '<p class="prophets-note">Nur freigegebene Angaben erscheinen in der normalen Suche. Research bleibt getrennt. Profilzahl ≠ Gesamtzahl aller Gesandten (Qurʾān 4:164 / 40:78).</p>'
    );
  }

  function statusClass(status) {
    var s = String(status || "").toLowerCase();
    if (s.indexOf("nicht") >= 0 || s.indexOf("unattested") >= 0 || s === "nicht bestimmbar") return "prophets-status--na";
    return "prophets-status--ok";
  }

  function renderOverview(profile) {
    var research = profile.profileStatus && profile.profileStatus !== "approved";
    var fields = (profile.overviewFields || [])
      .map(function (f) {
        var showValue = f.value;
        if (showValue == null || showValue === "" || showValue === "null" || showValue === "undefined") {
          showValue = "Nicht authentisch belegt";
        }
        var st = f.status || "";
        var ids = f.claimIds || [];
        var ok = !ids.length
          ? /nicht authentisch|nicht bestimmbar|nicht belegt|in prüfung/i.test(String(st))
          : claimsApproved(profile, ids);
        /* Positive Werte ohne freigegebene Claims: im Lesertext nicht als Tatsache. */
        if (ids.length && !ok && f.displayMode === "research_preview") {
          if (research && isTest()) {
            showValue = String(f.value || "") + " (Vorschau · nicht freigegeben)";
          } else {
            showValue = "In Prüfung — noch nicht freigegeben";
          }
        }
        return (
          '<div class="prophets-field">' +
          '<span class="prophets-field__label">' +
          esc(f.label) +
          "</span>" +
          '<span class="prophets-field__value">' +
          esc(showValue) +
          "</span>" +
          '<span class="prophets-status ' +
          statusClass(st) +
          '">' +
          esc(st) +
          "</span>" +
          "</div>"
        );
      })
      .join("");
    return (
      '<section class="prophets-chapter"><h3>Übersicht</h3><div class="prophets-field-grid">' +
      fields +
      '</div><p class="prophets-note">Jedes Feld ist einzeln belegt oder ausdrücklich als „Nicht authentisch belegt“ geführt. Unsichere Angaben erscheinen nicht als freigegebene Tatsache.</p></section>'
    );
  }

  function renderTimeline(profile) {
    var research = isTest() && profile.profileStatus && profile.profileStatus !== "approved";
    var stations = (profile.timeline || [])
      .filter(function (st) {
        var ids = st.claimIds || [];
        if (!ids.length) return research; /* ohne Claims nur Test-Forschung */
        return claimsApproved(profile, ids) || research;
      })
      .map(function (st) {
        var ok = claimsApproved(profile, st.claimIds || []);
        var qLinks = (st.quran || st.quranRefs || [])
          .map(function (q) {
            var label =
              surahName(q.surah) +
              " " +
              q.surah +
              ":" +
              q.ayah +
              (q.ayahEnd && q.ayahEnd !== q.ayah ? "–" + q.ayahEnd : "");
            return (
              '<button type="button" class="prophets-link" data-quran-surah="' +
              esc(q.surah) +
              '" data-quran-ayah="' +
              esc(q.ayah) +
              '">Im Qurʾān öffnen · ' +
              esc(label) +
              "</button>"
            );
          })
          .join(" ");
        var qMeta = (st.quran || st.quranRefs || [])
          .map(function (q) {
            return (
              "Qurʾān " +
              q.surah +
              ":" +
              q.ayah +
              (q.ayahEnd && q.ayahEnd !== q.ayah ? "–" + q.ayahEnd : "")
            );
          })
          .join(" · ");
        return (
          '<article class="prophets-station">' +
          '<span class="prophets-station__dot" aria-hidden="true"></span>' +
          '<div class="prophets-station__body">' +
          "<h4>" +
          esc(st.title) +
          (!ok ? ' <span class="prophets-badge">Umstritten</span>' : "") +
          "</h4>" +
          (st.summary || st.body
            ? "<p>" + esc(st.summary || st.body || "") + "</p>"
            : "") +
          (qMeta ? '<p class="prophets-src">' + esc(qMeta) + "</p>" : "") +
          (qLinks ? '<div class="prophets-link-row">' + qLinks + "</div>" : "") +
          "</div></article>"
        );
      })
      .join("");
    return (
      '<section class="prophets-chapter"><h3>Lebensweg</h3><div class="prophets-timeline prophets-timeline--rail">' +
      (stations || '<div class="prophets-empty">Noch keine freigegebenen Lebensstationen.</div>') +
      "</div></section>"
    );
  }

  function renderEreignisse(profile) {
    // Same approved timeline stations as compact event list (no invented chronology).
    return renderTimeline(profile).replace(">Lebensweg<", ">Ereignisse<").replace("prophets-timeline--rail", "prophets-timeline--rail prophets-timeline--events");
  }

  function renderQuranSection(profile, state) {
    var qFilter = state.quranFilter || "all";
    var refs = (profile.quranRefs || []).filter(function (r) {
      if (qFilter === "all") return true;
      if (qFilter === "surah") return true;
      if (qFilter === "event") return !!r.event;
      if (qFilter === "speech") return r.kind === "speech" || r.filter === "aussagen";
      if (qFilter === "about") return r.kind === "about";
      return true;
    });
    if (qFilter === "surah") {
      refs = refs.slice().sort(function (a, b) {
        return a.surah - b.surah || a.ayah - b.ayah;
      });
    }
    var chips =
      [
        ["all", "Alle"],
        ["surah", "nach Sūrah"],
        ["event", "nach Ereignis"],
        ["speech", "direkte Aussagen"],
        ["about", "über ihn"]
      ]
        .map(function (c) {
          return (
            '<button type="button" class="prophets-filter' +
            (qFilter === c[0] ? " is-active" : "") +
            '" data-prophets-qfilter="' +
            esc(c[0]) +
            '">' +
            esc(c[1]) +
            "</button>"
          );
        })
        .join("") + "";

    var count = refs.length;
    var list = refs
      .map(function (r) {
        var ref =
          surahName(r.surah) +
          " " +
          r.surah +
          ":" +
          r.ayah +
          (r.ayahEnd && r.ayahEnd !== r.ayah ? "–" + r.ayahEnd : "");
        var kindLabel = "";
        if (r.kind === "speech" || r.filter === "aussagen" || r.type === "directSpeech") kindLabel = "Direkte Aussage";
        else if (r.kind === "dua" || r.type === "dua") kindLabel = "Duʿāʾ";
        else if (r.event) kindLabel = "Ereignis";
        else kindLabel = "Beschreibung";
        return (
          '<article class="prophets-quote">' +
          '<span class="prophets-badge">Qurʾān</span>' +
          (kindLabel ? '<span class="prophets-badge prophets-badge--soft">' + esc(kindLabel) + "</span>" : "") +
          '<p class="prophets-quote__meta">' +
          esc(ref) +
          (r.event ? " · " + esc(r.event) : "") +
          "</p>" +
          (r.context ? '<p class="prophets-quote__de">' + esc(r.context) + "</p>" : "") +
          '<div class="prophets-link-row"><button type="button" class="prophets-link" data-quran-surah="' +
          esc(r.surah) +
          '" data-quran-ayah="' +
          esc(r.ayah) +
          '">📖 Im Qurʾān öffnen</button></div>' +
          "</article>"
        );
      })
      .join("");

    return (
      '<section class="prophets-chapter"><h3>Qurʾān · ' +
      count +
      " Fundstellen</h3>" +
      '<div class="prophets-filters">' +
      chips +
      "</div>" +
      (list || '<div class="prophets-empty">Keine Qurʾān-Stellen in diesem Filter.</div>') +
      "</section>"
    );
  }

  function renderStatements(profile) {
    var q = approvedOnly((profile.statements && profile.statements.quran) || []);
    var s = approvedOnly((profile.statements && profile.statements.sunnah) || []);
    function block(title, items) {
      if (!items.length) {
        return (
          '<section class="prophets-chapter"><h3>' +
          esc(title) +
          '</h3><div class="prophets-empty">Noch keine freigegebenen Einträge.</div></section>'
        );
      }
      return (
        '<section class="prophets-chapter"><h3>' +
        esc(title) +
        " · " +
        items.length +
        "</h3>" +
        items
          .map(function (it) {
            return (
              '<article class="prophets-quote">' +
              (it.arabicOriginal
                ? '<p class="prophets-quote__ar" lang="ar" dir="rtl">' + esc(it.arabicOriginal) + "</p>"
                : "") +
              '<p class="prophets-quote__de">' +
              esc(it.translationDe || "") +
              "</p>" +
              '<p class="prophets-quote__meta">' +
              esc(it.reference || it.source || "") +
              (it.context ? " · " + esc(it.context) : "") +
              " · " +
              esc(it.grading || "") +
              "</p>" +
              (it.surah
                ? '<button type="button" class="prophets-link" data-quran-surah="' +
                  esc(it.surah) +
                  '" data-quran-ayah="' +
                  esc(it.ayah) +
                  '">Im Qurʾān öffnen</button>'
                : "") +
              "</article>"
            );
          })
          .join("") +
        "</section>"
      );
    }
    return block("Aussagen im Qurʾān", q) + block("Aussagen in authentischer Sunnah", s);
  }

  function renderSunnahAbout(profile) {
    var items = approvedOnly(profile.prophetAbout || []);
    if (!items.length) {
      return (
        '<section class="prophets-chapter"><h3>Der Prophet Muḥammad ﷺ über ihn</h3>' +
        '<article class="prophets-quote">' +
        '<span class="prophets-badge">Sunnah</span>' +
        '<p class="prophets-quote__de">' +
        esc(profile.sunnahPrepNote || "Keine weiteren authentisch belegten Sunnah-Berichte in diesem Profil freigegeben.") +
        "</p>" +
        '<p class="prophets-status prophets-status--na">Keine freigegebene Sunnah in diesem Profil</p>' +
        "</article></section>"
      );
    }
    return (
      '<section class="prophets-chapter"><h3>Der Prophet Muḥammad ﷺ über ihn · ' +
      items.length +
      "</h3>" +
      items
        .map(function (it) {
          var metaLine = [it.work, it.bookChapter, it.number].filter(Boolean).join(" · ");
          var rawi = it.sahabiRawi || it.rawi || "";
          var ext = it.directReference && String(it.directReference).indexOf("http") === 0 ? it.directReference : "";
          return (
            '<article class="prophets-quote">' +
            '<span class="prophets-badge">' +
            esc(publicStatusLabel(it.grading || "sahih")) +
            "</span>" +
            (it.arabicOriginal
              ? '<p class="prophets-quote__ar" lang="ar" dir="rtl">' + esc(it.arabicOriginal) + "</p>"
              : "") +
            '<p class="prophets-quote__de">' +
            esc(it.translationDe || it.summary || "") +
            "</p>" +
            '<p class="prophets-quote__meta">' +
            esc(metaLine) +
            (rawi ? "<br>Rāwī: " + esc(rawi) : "") +
            "</p>" +
            (ext
              ? '<button type="button" class="prophets-link" data-external-url="' +
                esc(ext) +
                '">Quelle öffnen</button>'
              : "") +
            "</article>"
          );
        })
        .join("") +
      "</section>"
    );
  }

  function renderFamily(profile) {
    var research = isTest() && profile.profileStatus && profile.profileStatus !== "approved";
    var rows = (profile.family || [])
      .filter(function (f) {
        var ids = f.claimIds || [];
        if (!ids.length) return research;
        return claimsApproved(profile, ids) || research;
      })
      .map(function (f) {
        var ok = claimsApproved(profile, f.claimIds || []);
        var linkId = f.relatedProphetId || f.prophetId || "";
        var nameHtml = esc(f.name);
        if (ok && linkId) {
          nameHtml =
            '<button type="button" class="prophets-inline-link" data-prophet-id="' +
            esc(linkId) +
            '">' +
            esc(f.name) +
            "</button>";
        } else if (ok) {
          // best-effort cross-link by known names in index
          var hit = findProphetIdByName(f.name);
          if (hit && hit !== profile.id) {
            nameHtml =
              '<button type="button" class="prophets-inline-link" data-prophet-id="' +
              esc(hit) +
              '">' +
              esc(f.name) +
              "</button>";
          }
        }
        return (
          '<article class="prophets-family-card">' +
          "<h4>" +
          esc(f.label) +
          (!ok ? ' <span class="prophets-badge">Umstritten</span>' : "") +
          "</h4>" +
          (f.summary ? "<p>" + esc(f.summary) + "</p>" : "") +
          '<span class="prophets-field__label">Name</span>' +
          '<span class="prophets-field__value">' +
          nameHtml +
          "</span>" +
          '<span class="prophets-status ' +
          statusClass(f.nameStatus) +
          '">' +
          esc(publicStatusLabel(f.nameStatus) || f.nameStatus || "") +
          (!ok ? " · nicht als gesichert dargestellt" : "") +
          "</span>" +
          "</article>"
        );
      })
      .join("");
    var tree = renderApprovedFamilyTree(profile);
    return (
      '<section class="prophets-chapter"><h3>Familie</h3>' +
      tree +
      (rows || '<div class="prophets-empty">Noch keine freigegebenen Familienangaben.</div>') +
      "</section>"
    );
  }

  function findProphetIdByName(name) {
    var n = String(name || "").toLowerCase();
    if (!n || !indexCache) return "";
    var all = (indexCache.prophets || []).concat(indexCache.disputed || []).concat(indexCache.furtherPersons || []);
    for (var i = 0; i < all.length; i++) {
      var p = all[i];
      if (!p) continue;
      if (n.indexOf(String(p.name || "").toLowerCase()) >= 0) return p.id;
      if (p.nameAr && n.indexOf(String(p.nameAr).toLowerCase()) >= 0) return p.id;
    }
    return "";
  }

  function renderApprovedFamilyTree(profile) {
    var ids = profile.relationIds || [];
    if (!ids.length) return "";
    // Synchronous render uses already-cached relations only; hydrate async on bind.
    var lines = [];
    ids.forEach(function (rid) {
      var rel = relationCache[rid];
      if (!rel || rel.verificationStatus !== "approved") return;
      var a = findMeta(rel.personA);
      var b = findMeta(rel.personB);
      if (!a || !b) return;
      lines.push(
        '<div class="prophets-tree-line">' +
          '<button type="button" class="prophets-inline-link" data-prophet-id="' +
          esc(a.id) +
          '">' +
          esc(a.name) +
          "</button>" +
          '<span class="prophets-tree-rel">' +
          esc(rel.relation === "brothers" ? "Brüder" : "Vater → Sohn") +
          "</span>" +
          '<button type="button" class="prophets-inline-link" data-prophet-id="' +
          esc(b.id) +
          '">' +
          esc(b.name) +
          "</button>" +
          "</div>"
      );
    });
    if (!lines.length) return '<div class="prophets-tree prophets-tree--pending" data-prophets-tree="' + esc(profile.id) + '"></div>';
    return '<div class="prophets-tree"><h4>Geprüfte Beziehungen</h4>' + lines.join("") + "</div>";
  }

  function countApproved(profile, key) {
    if (key === "quranRefs") return (profile.quranRefs || []).length;
    if (key === "prophetAbout") return approvedOnly(profile.prophetAbout || []).length;
    if (key === "statements") {
      var st = profile.statements || {};
      return approvedOnly(st.quran || []).length + approvedOnly(st.sunnah || []).length;
    }
    if (key === "claims") return approvedOnly(profile.claims || []).length;
    return 0;
  }

  function renderQuellen(profile) {
    var claims = approvedOnly(profile.claims || []);
    var groups = [
      { key: "quran", title: "Qurʾān", match: function (c) { return c.evidenceType === "quran"; } },
      { key: "bukhari", title: "Ṣaḥīḥ al-Buḫārī", match: function (c) { return c.evidenceType === "sunnah" && /bu[kḫ]h?ārī|bukhari/i.test(String(c.source || c.hadithId || "")); } },
      { key: "muslim", title: "Ṣaḥīḥ Muslim", match: function (c) { return c.evidenceType === "sunnah" && /muslim/i.test(String(c.source || c.hadithId || "")); } },
      { key: "sunnah", title: "Weitere authentische Sunnah", match: function (c) {
          return c.evidenceType === "sunnah" && !/bu[kḫ]h?ārī|bukhari|muslim/i.test(String(c.source || c.hadithId || ""));
        } },
      { key: "athar", title: "Authentische Āthār", match: function (c) { return c.evidenceType === "athar"; } }
    ];
    var used = Object.create(null);
    var worksHtml = groups
      .map(function (g) {
        var items = claims.filter(function (c) {
          if (used[c.id]) return false;
          if (!g.match(c)) return false;
          used[c.id] = 1;
          return true;
        });
        if (!items.length) return "";
        return (
          '<button type="button" class="prophets-work" data-prophets-source-group="' +
          esc(g.key) +
          '"><span>' +
          esc(g.title) +
          '</span><span>' +
          items.length +
          " geprüfte Berichte</span></button>"
        );
      })
      .join("");

    var activeGroup = (readState().sourceGroup || "all");
    var filtered =
      activeGroup === "all"
        ? claims
        : claims.filter(function (c) {
            var g = groups.find(function (x) { return x.key === activeGroup; });
            return g ? g.match(c) : true;
          });

    var claimList = filtered
      .map(function (c) {
        var ext = c.directReference && String(c.directReference).indexOf("http") === 0 ? c.directReference : "";
        return (
          '<article class="prophets-quote" id="claim-' +
          esc(c.id) +
          '">' +
          '<span class="prophets-badge">' +
          esc(publicStatusLabel(c.grading || c.evidenceType || "")) +
          "</span>" +
          '<p class="prophets-quote__de">' +
          esc(c.claim) +
          "</p>" +
          (c.arabicOriginal
            ? '<p class="prophets-quote__ar" lang="ar" dir="rtl">' + esc(c.arabicOriginal) + "</p>"
            : "") +
          '<p class="prophets-quote__meta">' +
          esc([c.source, c.reference || c.number, c.rawi || c.sahabiRawi].filter(Boolean).join(" · ")) +
          "</p>" +
          (c.directReference && c.directReference.indexOf("#quran-surah/") === 0
            ? '<button type="button" class="prophets-link" data-nav-hash="' +
              esc(c.directReference) +
              '">Direktnachweis</button>'
            : "") +
          (ext
            ? '<button type="button" class="prophets-link" data-external-url="' +
              esc(ext) +
              '">Quelle öffnen</button>'
            : "") +
          "</article>"
        );
      })
      .join("");

    var researchNote =
      '<details class="prophets-research-fold"><summary>Research / umstritten (bewusst öffnen)</summary>' +
      '<p class="prophets-note">Schwache, isrāʾīliyyāt- oder ungeprüfte Berichte gehören nicht zur Hauptbiografie und erscheinen hier nicht als sichere Tatsachen.</p>' +
      ((profile.weakReports || []).length
        ? '<ul class="prophets-weak-list">' +
          (profile.weakReports || [])
            .slice(0, 12)
            .map(function (w) {
              return (
                "<li><b>" +
                esc(w.title || w.id || "Bericht") +
                "</b> · " +
                esc(publicStatusLabel(w.grading || "Umstritten")) +
                "</li>"
              );
            })
            .join("") +
          "</ul>"
        : "<p>Keine zusätzlichen Research-Einträge in diesem Profil.</p>") +
      "</details>";

    return (
      '<section class="prophets-chapter"><h3>Quellenbibliothek</h3><div class="prophets-work-list">' +
      worksHtml +
      "</div></section>" +
      '<section class="prophets-chapter"><h3>Belegte Aussagen · ' +
      filtered.length +
      "</h3>" +
      (claimList || '<div class="prophets-empty">Keine freigegebenen Quellenberichte in dieser Gruppe.</div>') +
      "</section>" +
      researchNote
    );
  }

  function renderDisputedPositions(profile, meta) {
    if (!isDisputedStatus(profile.prophetStatus) && !(meta && isDisputedStatus(meta.prophetStatus))) return "";
    var note = disputedStatusNote(Object.assign({}, meta || {}, profile));
    return (
      '<section class="prophets-chapter prophets-chapter--ikhtilaf"><h3>Einordnung</h3>' +
      '<p class="prophets-quote__de">' +
      esc(note || "Prophetenstatus unter den Gelehrten unterschiedlich eingeordnet") +
      "</p>" +
      '<details class="prophets-research-fold"><summary>Positionen ansehen</summary>' +
      '<div class="prophets-ikhtilaf">' +
      "<article><h4>Position 1</h4><p><b>Prophet</b></p><p>Begründung: kontextuelle Einordnung durch Gelehrte — nicht als ausdrücklicher Qurʾān-Wortlaut „Nabī“.</p></article>" +
      "<hr class=\"prophets-rule\" />" +
      "<article><h4>Position 2</h4><p><b>Rechtschaffener Mann / Diener, kein Prophet</b></p><p>Frühe Überlieferungen und Tafsīr-Meinungen mit jeweiligem Isnādstatus — nicht automatisch freigegeben.</p></article>" +
      "</div></details></section>"
    );
  }

  function renderStubDetail(meta) {
    if (!meta) return '<div class="prophets-empty">Prophet nicht gefunden.</div>';
    var disputed = isDisputedStatus(meta.prophetStatus);
    var note = disputedStatusNote(meta) || meta.note || "Die vollständige Wissensakte wird mit geprüften Claims aufgebaut.";
    return (
      '<article class="prophets-detail">' +
      '<header class="prophets-detail__head">' +
      '<h2 class="prophets-detail__name">' + esc(meta.name) + "</h2>" +
      '<div class="prophets-detail__ar" lang="ar" dir="rtl">' + esc(meta.nameAr || "") + "</div>" +
      '<p class="prophets-detail__honor">' + esc(meta.honorific || "") + "</p>" +
      '<div class="prophets-detail__roles">' +
      (!disputed && rolesLabel(meta.roles) ? '<span class="prophets-chip">' + esc(rolesLabel(meta.roles)) + "</span>" : "") +
      (disputed ? '<span class="prophets-chip">Umstritten</span>' : "") +
      (meta.uluAlAzm ? '<span class="prophets-chip">✦ Ulū l-ʿAzm</span>' : "") +
      "</div>" +
      (meta.people ? '<p class="prophets-detail__people">👥 ' + esc(meta.people) + "</p>" : "") +
      '</header><hr class="prophets-rule" />' +
      '<section class="prophets-chapter"><h3>' + (disputed ? "Umstrittene Einordnung" : "Profil") + "</h3>" +
      "<p class=\"prophets-quote__de\">" +
      esc(note) +
      "</p>" +
      (meta.note && disputedStatusNote(meta) ? '<p class="prophets-quote__de">' + esc(meta.note) + "</p>" : "") +
      '<p class="prophets-status prophets-status--na">Struktur vorbereitet · Inhalte folgen nach Freigabe</p>' +
      "</section></article>"
    );
  }

  function findMeta(id) {
    if (!indexCache) return null;
    var all = (indexCache.prophets || []).concat(indexCache.disputed || []);
    return all.find(function (p) { return String(p.id) === String(id); }) || null;
  }

  function renderDetail(profile, section, state, meta) {
    if (!profile) {
      return renderStubDetail(meta || null);
    }
    var researchMode = profile.profileStatus && profile.profileStatus !== "approved";
    if (researchMode && !isTest()) {
      return (
        '<div class="prophets-empty">Profil noch nicht freigegeben. Zero-Trust: Ungeprüftes erscheint nicht in der Besucher-App.</div>'
      );
    }
    var sec = section || "overview";
    var tabs = TABS.map(function (t) {
      return (
        '<button type="button" class="prophets-tab' +
        (sec === t.id ? " is-active" : "") +
        '" data-prophets-tab="' +
        esc(t.id) +
        '">' +
        esc(t.label) +
        "</button>"
      );
    }).join("");

    var body = "";
    if (sec === "overview") body = renderOverview(profile) + renderDisputedPositions(profile, meta);
    else if (sec === "lebensweg") body = renderTimeline(profile);
    else if (sec === "ereignisse") body = renderEreignisse(profile);
    else if (sec === "quran") body = renderQuranSection(profile, state);
    else if (sec === "sunnah") body = renderSunnahAbout(profile);
    else if (sec === "aussagen") body = renderStatements(profile);
    else if (sec === "familie") body = renderFamily(profile);
    else if (sec === "quellen") body = renderQuellen(profile);
    else body = renderOverview(profile);

    var qCount = (profile.quranRefs || []).length;
    var stQ = approvedOnly((profile.statements && profile.statements.quran) || []).length;
    var stS = approvedOnly((profile.statements && profile.statements.sunnah) || []).length;
    var aboutN = approvedOnly(profile.prophetAbout || []).length;
    var sunnahN = aboutN + stS;
    var disputed = isDisputedStatus(profile.prophetStatus) || isDisputedStatus((meta || {}).prophetStatus);
    var roleChips = [];
    if (!disputed) {
      (profile.roles || []).forEach(function (r) {
        roleChips.push('<span class="prophets-chip">' + esc(rolesLabel([r]) || r) + "</span>");
      });
    } else {
      roleChips.push('<span class="prophets-chip">Umstritten</span>');
      if (profile.quranExplicitName || (profile.identity && profile.identity.quranNamed) || (meta && meta.quranNamed)) {
        roleChips.push('<span class="prophets-chip">Im Qurʾān genannt</span>');
      }
    }
    if (profile.uluAlAzm) roleChips.push('<span class="prophets-chip">✦ Ulū l-ʿAzm</span>');

    var banner = "";
    if (disputed) {
      banner =
        '<p class="prophets-status prophets-status--na">' +
        esc(disputedStatusNote(Object.assign({}, meta || {}, profile)) || "Prophetenstatus unter den Gelehrten unterschiedlich eingeordnet") +
        "</p>";
    } else if (researchMode) {
      banner =
        '<p class="prophets-status prophets-status--na">Zero-Trust · Profil noch in Prüfung · Lesertext nur aus freigegebenen Claims</p>';
    }

    return (
      '<article class="prophets-detail" data-prophet-detail="' +
      esc(profile.id) +
      '">' +
      '<header class="prophets-detail__head">' +
      '<div class="prophets-detail__head-top">' +
      '<h2 class="prophets-detail__name">' +
      esc(profile.name) +
      "</h2>" +
      '<div class="prophets-detail__ar" lang="ar" dir="rtl">' +
      esc(profile.nameAr) +
      "</div>" +
      "</div>" +
      '<p class="prophets-detail__honor">' +
      esc(profile.honorific || "") +
      "</p>" +
      (roleChips.length ? '<div class="prophets-detail__roles">' + roleChips.join("") + "</div>" : "") +
      (profile.people ? '<p class="prophets-detail__people">' + esc(profile.people) + (profile.region ? " · " + esc(profile.region) : "") + "</p>" : "") +
      banner +
      '<div class="prophets-detail__stats" aria-label="Quellenübersicht">' +
      '<div class="prophets-stat"><b>' + qCount + '</b><span>Qurʾān</span></div>' +
      '<div class="prophets-stat"><b>' + sunnahN + '</b><span>Sunnah</span></div>' +
      '<div class="prophets-stat"><b>' + (stQ + stS) + '</b><span>Aussagen</span></div>' +
      "</div>" +
      "</header>" +
      '<hr class="prophets-rule" />' +
      '<nav class="prophets-tabs" aria-label="Propheten-Abschnitte">' +
      tabs +
      "</nav>" +
      body +
      "</article>"
    );
  }

  function renderShell(index, profile, routeParts, state) {
    var dual = isDualMode();
    var activeId = routeParts.prophetId || "";
    var listHtml = renderListPanel(index, state, activeId);
    var detailHtml = "";
    if (activeId) {
      detailHtml = renderDetail(profile, routeParts.section, state, findMeta(activeId));
    } else if (dual) {
      detailHtml =
        '<div class="prophets-pane-empty">✦ Wähle links einen Propheten,<br>um die edle Wissensakte zu öffnen.</div>';
    }

    if (!dual && activeId) {
      return (
        '<div class="prophets-root" data-prophets-mode="single-detail">' +
        '<button type="button" class="prophets-rail__back-mobile" data-prophets-back>← Alle Propheten</button>' +
        '<div class="prophets-pane">' +
        detailHtml +
        "</div></div>"
      );
    }

    return (
      '<div class="prophets-root" data-prophets-mode="' +
      (dual ? "dual" : "single") +
      '">' +
      '<div class="prophets-layout' +
      (dual ? " prophets-layout--dual" : "") +
      '">' +
      '<div class="prophets-rail">' +
      listHtml +
      "</div>" +
      (dual || !activeId
        ? '<div class="prophets-pane">' + (dual ? detailHtml : "") + "</div>"
        : "") +
      "</div></div>"
    );
  }

  function setPageHeaderSafe() {
    if (typeof global.setPageHeader === "function") {
      return global.setPageHeader(
        "Die Propheten",
        "الأنبياء",
        ""
      );
    }
    if (typeof global.setHeader === "function") {
      return global.setHeader("Die Propheten", "الأنبياء", "");
    }
    return "";
  }

  function render(routeValue) {
    var parts = parseRouteValue(routeValue);
    var state = readState();
    var header = setPageHeaderSafe();

    if (!indexCache) {
      loadIndex()
        .then(function () {
          if (global.currentRoute && global.currentRoute.view === "propheten") {
            if (typeof global.render === "function") global.render();
          }
        })
        .catch(function () {});
      return header + '<div class="prophets-root"><div class="prophets-empty">Prophetenbibliothek wird geladen…</div></div>';
    }

    if (!isFeatureEnabled(indexCache)) {
      return (
        header +
        '<div class="prophets-root"><div class="prophets-empty">Prophetenbibliothek ist in dieser Umgebung deaktiviert (production = disabled · Zero-Trust).</div></div>'
      );
    }

    if (parts.prophetId && profileCache[parts.prophetId] === undefined) {
      // undefined = not attempted; null = missing file
      profileCache[parts.prophetId] = null;
      loadProfile(parts.prophetId).then(function (prof) {
        profileCache[parts.prophetId] = prof;
        if (global.currentRoute && global.currentRoute.view === "propheten") {
          if (typeof global.render === "function") global.render();
        }
      });
    }

    var profile = parts.prophetId ? profileCache[parts.prophetId] || null : null;
    return header + renderShell(indexCache, profile, parts, state);
  }

  function restoreScroll(state) {
    var y = Number(state.scrollY || 0);
    if (y > 0) {
      requestAnimationFrame(function () {
        window.scrollTo(0, y);
      });
    }
  }

  function bind() {
    var root = document.querySelector(".prophets-root");
    if (!root) return;
    var state = readState();

    var search = document.getElementById("prophetsSearch");
    if (search && !search.dataset.bound) {
      search.dataset.bound = "1";
      var t = 0;
      search.addEventListener("input", function () {
        clearTimeout(t);
        t = setTimeout(function () {
          writeState({ query: search.value || "", scrollY: window.scrollY || 0 });
          if (typeof global.render === "function") global.render();
        }, 160);
      });
    }

    root.querySelectorAll("[data-prophets-filter]").forEach(function (btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = "1";
      btn.addEventListener("click", function () {
        writeState({ filter: btn.getAttribute("data-prophets-filter") || "all", scrollY: window.scrollY || 0 });
        if (typeof global.render === "function") global.render();
      });
    });

    root.querySelectorAll("[data-prophet-id]").forEach(function (btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = "1";
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-prophet-id");
        var rail = root.querySelector(".prophets-rail");
        writeState({
          scrollY: window.scrollY || 0,
          leftScroll: rail ? rail.scrollTop : 0,
          selectedId: id,
          section: "overview"
        });
        var meta = findMeta(id);
        writeLastRead({
          prophetId: id,
          name: meta && meta.name,
          honorific: meta && meta.honorific,
          tab: "overview",
          tabLabel: "Übersicht",
          at: Date.now()
        });
        navigateProphets(id, "overview");
        prefetchNeighbor(id);
      });
    });

    root.querySelectorAll("[data-prophets-tab]").forEach(function (btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = "1";
      btn.addEventListener("click", function () {
        var tab = btn.getAttribute("data-prophets-tab") || "overview";
        var detail = root.querySelector("[data-prophet-detail]");
        var id = detail && detail.getAttribute("data-prophet-detail");
        var label = btn.textContent || tab;
        writeState({ section: tab, scrollY: 0 });
        var meta = findMeta(id);
        writeLastRead({
          prophetId: id,
          name: meta && meta.name,
          honorific: meta && meta.honorific,
          tab: tab,
          tabLabel: label,
          at: Date.now()
        });
        navigateProphets(id, tab);
      });
    });

    root.querySelectorAll("[data-prophets-qfilter]").forEach(function (btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = "1";
      btn.addEventListener("click", function () {
        writeState({ quranFilter: btn.getAttribute("data-prophets-qfilter") || "all" });
        if (typeof global.render === "function") global.render();
      });
    });

    root.querySelectorAll("[data-quran-surah]").forEach(function (btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = "1";
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        writeState({ scrollY: window.scrollY || 0 });
        openQuran(btn.getAttribute("data-quran-surah"), btn.getAttribute("data-quran-ayah"));
      });
    });

    root.querySelectorAll("[data-nav-hash]").forEach(function (btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = "1";
      btn.addEventListener("click", function () {
        var hash = btn.getAttribute("data-nav-hash") || "";
        if (hash.indexOf("#quran-surah/") === 0) {
          var parts = hash.replace("#quran-surah/", "").split("/");
          openQuran(parts[0], parts[1]);
        }
      });
    });

    root.querySelectorAll("[data-prophets-back]").forEach(function (btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = "1";
      btn.addEventListener("click", function () {
        navigateProphets("", "");
        restoreScroll(readState());
      });
    });

    root.querySelectorAll("[data-external-url]").forEach(function (btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = "1";
      btn.addEventListener("click", function () {
        openExternalSafe(btn.getAttribute("data-external-url"));
      });
    });

    root.querySelectorAll("[data-prophets-continue]").forEach(function (btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = "1";
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-prophets-continue");
        var tab = btn.getAttribute("data-prophets-continue-tab") || "overview";
        navigateProphets(id, tab);
      });
    });

    root.querySelectorAll("[data-prophets-source-group]").forEach(function (btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = "1";
      btn.addEventListener("click", function () {
        writeState({ sourceGroup: btn.getAttribute("data-prophets-source-group") || "all" });
        if (typeof global.render === "function") global.render();
      });
    });

    // hydrate approved relations for family tree
    var detail = root.querySelector("[data-prophet-detail]");
    if (detail) {
      var pid = detail.getAttribute("data-prophet-detail");
      var prof = profileCache[pid];
      if (prof && (prof.relationIds || []).length) {
        Promise.all((prof.relationIds || []).map(loadRelation)).then(function () {
          var treeHost = root.querySelector(".prophets-tree--pending");
          if (treeHost && typeof global.render === "function") global.render();
        });
      }
    }

    ensureResizeWatch();
    restoreScroll(state);
    restoreRailScroll(state);
  }

  function restoreRailScroll(state) {
    var y = Number(state.leftScroll || 0);
    if (!(y > 0)) return;
    requestAnimationFrame(function () {
      var rail = document.querySelector(".prophets-rail");
      if (rail) rail.scrollTop = y;
    });
  }

  function prefetchNeighbor(id) {
    if (!indexCache) return;
    var established = (indexCache.prophets || []).filter(function (p) { return !isFurtherPerson(p); });
    var ix = established.findIndex(function (p) { return String(p.id) === String(id); });
    if (ix < 0) return;
    var next = established[ix + 1] || established[ix - 1];
    if (next) loadProfile(next.id);
  }

  function ensureResizeWatch() {
    if (resizeBound) return;
    resizeBound = true;
    lastWidthMode = isDualMode() ? "dual" : "single";
    var ticking = false;
    function onResize() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        if (!(global.currentRoute && global.currentRoute.view === "propheten")) return;
        var mode = isDualMode() ? "dual" : "single";
        if (mode === lastWidthMode) return;
        lastWidthMode = mode;
        writeState({ scrollY: window.scrollY || 0 });
        if (typeof global.render === "function") global.render();
      });
    }
    window.addEventListener("resize", onResize, { passive: true });
    if (global.visualViewport) {
      global.visualViewport.addEventListener("resize", onResize, { passive: true });
    }
    if (typeof ResizeObserver !== "undefined") {
      try {
        var ro = new ResizeObserver(onResize);
        var app = document.getElementById("appView") || document.body;
        if (app) ro.observe(app);
      } catch (e) {}
    }
    window.addEventListener(
      "dar:layoutchange",
      function () {
        onResize();
      },
      { passive: true }
    );
  }

  function prefetch() {
    loadIndex().then(function () { return loadSearchIndex(); }).catch(function () {});
  }

  global.DARProphets = {
    renderSpotlight: renderSpotlight,
    render: render,
    bind: bind,
    prefetch: prefetch,
    loadIndex: loadIndex,
    loadSearchIndex: loadSearchIndex,
    loadProfile: loadProfile,
    isEnabled: function () {
      if (!indexCache) return isTest();
      return isFeatureEnabled(indexCache);
    }
  };
})(window);
