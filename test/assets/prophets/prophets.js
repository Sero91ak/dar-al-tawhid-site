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
  var indexCache = null;
  var profileCache = Object.create(null);
  var loadIndexPromise = null;
  var resizeBound = false;
  var lastWidthMode = "";

  var TABS = [
    { id: "overview", label: "Übersicht" },
    { id: "lebensweg", label: "Lebensweg" },
    { id: "quran", label: "Qurʾān" },
    { id: "sunnah", label: "Sunnah" },
    { id: "aussagen", label: "Aussagen" },
    { id: "familie", label: "Familie" },
    { id: "quellen", label: "Quellen" }
  ];

  var FILTERS = [
    { id: "all", label: "Alle" },
    { id: "quran", label: "Qurʾān" },
    { id: "ulu", label: "Ulū l-ʿAzm" },
    { id: "disputed", label: "Umstritten" }
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

  var PROPHET_EMOJI = {
    adam:"🌱", nuh:"🚢", hud:"🏜️", salih:"🐪", ibrahim:"🔥", lut:"🏙️",
    ismail:"⛺", ishaq:"👶", yaqub:"👨‍👦", yusuf:"🌙", ayyub:"🤲",
    shuayb:"⚖️", musa:"🌊", harun:"📜", dawud:"🗡️", sulayman:"👑",
    ilyas:"⚡", alyasa:"🌿", yunus:"🐋", zakariyya:"🕌", yahya:"💧",
    isa:"✨", muhammad:"🌟", "dhul-kifl":"📘", uzayr:"📖"
  };

  function prophetEmoji(id, p) {
    if (PROPHET_EMOJI[id]) return PROPHET_EMOJI[id];
    if (p && p.uluAlAzm) return "✦";
    if (p && (p.prophetStatus === "disputed" || p.prophetStatus === "scholarly_disputed" || p.prophetStatus === "scholarly_disputed_or_inferred" || p.prophetStatus === "scholarly_source_correlation")) return "❔";
    return "🕊️";
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
        return data;
      })
      .catch(function (err) {
        loadIndexPromise = null;
        throw err;
      });
    return loadIndexPromise;
  }

  function loadProfile(id) {
    var key = String(id || "");
    if (!key) return Promise.resolve(null);
    if (profileCache[key]) return Promise.resolve(profileCache[key]);
    return fetch(DATA_BASE + encodeURIComponent(key) + ".json", { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("profile " + r.status);
        return r.json();
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

  function matchesQuery(p, q) {
    if (!q) return true;
    var blob = [
      p.name,
      p.nameAr,
      p.id,
      p.people,
      p.region,
      (p.nameVariants || []).join(" "),
      (p.searchTerms || []).join(" "),
      (p.roles || []).join(" "),
      p.note || ""
    ]
      .join(" ")
      .toLowerCase();
    return blob.indexOf(q) !== -1;
  }

  function filterProphets(index, filter, query) {
    var q = String(query || "")
      .trim()
      .toLowerCase();
    var established = (index.prophets || []).slice();
    var disputed = (index.disputed || []).slice();
    if (filter === "disputed") {
      return { established: [], disputed: disputed.filter(function (p) {
        return matchesQuery(p, q);
      }), ulu: [] };
    }
    var list = established.filter(function (p) {
      if (filter === "ulu" && !p.uluAlAzm) return false;
      if (filter === "quran" && p.prophetStatus !== "quran_explicit") return false;
      return matchesQuery(p, q);
    });
    var ulu = list.filter(function (p) {
      return p.uluAlAzm;
    });
    var rest = list.filter(function (p) {
      return !p.uluAlAzm;
    });
    var disp =
      filter === "all" || filter === "quran"
        ? disputed.filter(function (p) {
            return matchesQuery(p, q);
          })
        : [];
    return { established: rest, disputed: disp, ulu: ulu };
  }

  function renderRow(p, activeId) {
    var active = String(p.id) === String(activeId);
    var roles = rolesLabel(p.roles);
    var meta = [roles, p.people].filter(Boolean).join(" · ");
    var tags = p.uluAlAzm
      ? "Ulū l-ʿAzm"
      : (p.prophetStatus === "disputed" || p.prophetStatus === "scholarly_disputed" || p.prophetStatus === "scholarly_disputed_or_inferred" || p.prophetStatus === "scholarly_source_correlation")
        ? "Umstritten"
        : "Qurʾān";
    var emoji = prophetEmoji(p.id, p);
    return (
      '<button type="button" class="prophets-row' +
      (active ? " is-active" : "") +
      '" data-prophet-id="' +
      esc(p.id) +
      '">' +
      '<span class="prophets-row__icon" aria-hidden="true">' + emoji + "</span>" +
      '<span class="prophets-row__body">' +
      '<span class="prophets-row__name">' +
      esc(p.name) +
      ' <span class="prophets-row__honor">' +
      esc(p.honorific || "") +
      "</span></span>" +
      (meta ? '<span class="prophets-row__meta">' + esc(meta) + "</span>" : "") +
      '<span class="prophets-row__tags">' +
      esc(tags) +
      "</span>" +
      "</span>" +
      '<span class="prophets-row__chev" aria-hidden="true">›</span>' +
      "</button>"
    );
  }

  function renderListPanel(index, state, activeId) {
    var filter = state.filter || "all";
    var query = state.query || "";
    var packs = filterProphets(index, filter, query);
    var filtersHtml = FILTERS.map(function (f) {
      return (
        '<button type="button" class="prophets-filter' +
        (filter === f.id ? " is-active" : "") +
        '" data-prophets-filter="' +
        esc(f.id) +
        '">' +
        esc(f.label) +
        "</button>"
      );
    }).join("");

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
    body += section("Ulū l-ʿAzm", packs.ulu);
    body += section("Belegte Propheten", packs.established);
    body += section("Umstrittene Einordnung", packs.disputed);
    if (!packs.ulu.length && !packs.established.length && !packs.disputed.length) {
      body = '<div class="prophets-empty">Keine Treffer für diese Suche.</div>';
    }

    return (
      '<div class="prophets-toolbar">' +
      (index.intro
        ? '<p class="prophets-toolbar__intro">' + esc(index.intro) + "</p>"
        : "") +
      '<div class="prophets-search-block">' +
      '<input class="prophets-search" id="prophetsSearch" type="search" placeholder="Prophet, Volk, Ereignis, Sūrah oder Aussage suchen" value="' +
      esc(query) +
      '" autocomplete="off" />' +
      "</div>" +
      '<div class="prophets-filter-bar">' +
      '<span class="prophets-filter-bar__label">Filter</span>' +
      '<div class="prophets-filters" role="toolbar" aria-label="Propheten filtern">' +
      filtersHtml +
      "</div>" +
      "</div>" +
      "</div>" +
      body +
      '<p class="prophets-note">Nur namentlich zuverlässig belegte Personen. Die Überlieferung über 124.000 Propheten wird nicht als gesicherte Gesamtzahl dargestellt. Fehlende biografische Angaben erscheinen als „Nicht authentisch belegt“.</p>'
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
        return (
          '<article class="prophets-station">' +
          "<h4>" +
          esc(st.title) +
          (!ok ? ' <span class="prophets-badge">Forschung</span>' : "") +
          "</h4>" +
          "<p>" +
          esc(st.body || st.summary || "") +
          "</p>" +
          '<p class="prophets-src">Zeitklasse: ' +
          esc(st.timeClass || st.chronologyStatus || "textually-established") +
          (!ok ? " · noch nicht freigegeben" : "") +
          "</p>" +
          (qLinks ? '<div class="prophets-link-row">' + qLinks + "</div>" : "") +
          "</article>"
        );
      })
      .join("");
    return (
      '<section class="prophets-chapter"><h3>Lebensweg</h3><div class="prophets-timeline">' +
      (stations || '<div class="prophets-empty">Noch keine freigegebenen Lebensstationen.</div>') +
      "</div></section>"
    );
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
        return (
          '<article class="prophets-quote">' +
          '<span class="prophets-badge">Qurʾān</span>' +
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
        esc(profile.sunnahPrepNote || "Freigegebene Aḥādīṯ folgen nach abgeschlossener Stellen- und Isnād-Prüfung. Entwürfe bleiben unsichtbar.") +
        "</p>" +
        '<p class="prophets-status prophets-status--na">In Prüfung · noch nicht freigegeben</p>' +
        "</article></section>"
      );
    }
    return (
      '<section class="prophets-chapter"><h3>Der Prophet Muḥammad ﷺ über ihn · ' +
      items.length +
      "</h3>" +
      items
        .map(function (it) {
          return (
            '<article class="prophets-quote">' +
            '<span class="prophets-badge">' +
            esc(it.grading || "sahih") +
            "</span>" +
            (it.arabicOriginal
              ? '<p class="prophets-quote__ar" lang="ar" dir="rtl">' + esc(it.arabicOriginal) + "</p>"
              : "") +
            '<p class="prophets-quote__de">' +
            esc(it.translationDe || "") +
            "</p>" +
            '<p class="prophets-quote__meta">' +
            esc([it.work, it.bookChapter, it.number, it.sahabiRawi].filter(Boolean).join(" · ")) +
            "</p>" +
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
        return (
          '<article class="prophets-family-card">' +
          "<h4>" +
          esc(f.label) +
          (!ok ? ' <span class="prophets-badge">Forschung</span>' : "") +
          "</h4>" +
          "<p>" +
          esc(f.summary || "") +
          "</p>" +
          '<span class="prophets-field__label">Name</span>' +
          '<span class="prophets-field__value">' +
          esc(f.name) +
          "</span>" +
          '<span class="prophets-status ' +
          statusClass(f.nameStatus) +
          '">' +
          esc(f.nameStatus) +
          (!ok ? " · noch nicht freigegeben" : "") +
          "</span>" +
          "</article>"
        );
      })
      .join("");
    return (
      '<section class="prophets-chapter"><h3>Familie</h3>' +
      (rows || '<div class="prophets-empty">Noch keine freigegebenen Familienangaben.</div>') +
      "</section>"
    );
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
    var works = (profile.worksIndex || [])
      .map(function (w) {
        var n = typeof w.approvedCount === "number" ? w.approvedCount : countApproved(profile, w.countFrom);
        if (!n && w.id !== "quran") return "";
        return (
          '<button type="button" class="prophets-work" data-prophets-work="' +
          esc(w.id) +
          '"><span>' +
          esc(w.title) +
          "</span><span>" +
          n +
          " Belege</span></button>"
        );
      })
      .join("");

    var claimList = claims
      .map(function (c) {
        return (
          '<article class="prophets-quote">' +
          '<span class="prophets-badge">' +
          esc(c.grading || c.evidenceType || "") +
          "</span>" +
          '<p class="prophets-quote__de">' +
          esc(c.claim) +
          "</p>" +
          '<p class="prophets-quote__meta">' +
          esc(c.source) +
          (c.reference ? " · " + esc(c.reference) : "") +
          "</p>" +
          (c.directReference && c.directReference.indexOf("#quran-surah/") === 0
            ? '<button type="button" class="prophets-link" data-nav-hash="' +
              esc(c.directReference) +
              '">Direktnachweis</button>'
            : "") +
          "</article>"
        );
      })
      .join("");

    return (
      '<section class="prophets-chapter"><h3>Quellenbibliothek</h3><div class="prophets-work-list">' +
      works +
      "</div></section>" +
      '<section class="prophets-chapter"><h3>Belegte Aussagen (Claims) · ' +
      claims.length +
      "</h3>" +
      claimList +
      "</section>"
    );
  }

  function renderStubDetail(meta) {
    if (!meta) return '<div class="prophets-empty">Prophet nicht gefunden.</div>';
    var disputed = meta.prophetStatus === "disputed";
    return (
      '<article class="prophets-detail">' +
      '<header class="prophets-detail__head">' +
      '<h2 class="prophets-detail__name">' + esc(meta.name) + "</h2>" +
      '<div class="prophets-detail__ar" lang="ar" dir="rtl">' + esc(meta.nameAr || "") + "</div>" +
      '<p class="prophets-detail__honor">' + esc(meta.honorific || "") + "</p>" +
      '<div class="prophets-detail__roles">' +
      (rolesLabel(meta.roles) ? '<span class="prophets-chip">' + esc(rolesLabel(meta.roles)) + "</span>" : "") +
      (meta.uluAlAzm ? '<span class="prophets-chip">✦ Ulū l-ʿAzm</span>' : "") +
      "</div>" +
      (meta.people ? '<p class="prophets-detail__people">👥 ' + esc(meta.people) + "</p>" : "") +
      '</header><hr class="prophets-rule" />' +
      '<section class="prophets-chapter"><h3>' + (disputed ? "Umstrittene Einordnung" : "Profil") + "</h3>" +
      "<p class=\"prophets-quote__de\">" +
      esc(meta.note || "Die vollständige Wissensakte wird nach dem Referenzprofil Mūsā schrittweise mit geprüften Claims aufgebaut. Es werden keine ungeprüften biografischen Angaben ergänzt.") +
      "</p>" +
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
    if (sec === "overview") body = renderOverview(profile);
    else if (sec === "lebensweg") body = renderTimeline(profile);
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
    var roleChips = [];
    (profile.roles || []).forEach(function (r) {
      roleChips.push('<span class="prophets-chip">' + esc(rolesLabel([r]) || r) + "</span>");
    });
    if (profile.uluAlAzm) roleChips.push('<span class="prophets-chip">✦ Ulū l-ʿAzm</span>');

    var banner = researchMode
      ? '<p class="prophets-status prophets-status--na">Zero-Trust · Profilstatus: ' +
        esc(profile.profileStatus) +
        " · Lesertext nur aus freigegebenen Claims · Test-Forschungsvorschau</p>"
      : "";

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
      (profile.people ? '<p class="prophets-detail__people">👥 ' + esc(profile.people) + (profile.region ? " · " + esc(profile.region) : "") + "</p>" : "") +
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
        "الأنبياء · Qurʾān · Sunnah · geprüfte Überlieferungen",
        ""
      );
    }
    if (typeof global.setHeader === "function") {
      return global.setHeader("Die Propheten", "الأنبياء · Qurʾān · Sunnah · geprüfte Überlieferungen", "");
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
        writeState({ scrollY: window.scrollY || 0, selectedId: id, section: "overview" });
        navigateProphets(id, "overview");
      });
    });

    root.querySelectorAll("[data-prophets-tab]").forEach(function (btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = "1";
      btn.addEventListener("click", function () {
        var tab = btn.getAttribute("data-prophets-tab") || "overview";
        var detail = root.querySelector("[data-prophet-detail]");
        var id = detail && detail.getAttribute("data-prophet-detail");
        writeState({ section: tab, scrollY: 0 });
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
      });
    });

    ensureResizeWatch();
    restoreScroll(state);
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
    loadIndex().catch(function () {});
  }

  global.DARProphets = {
    renderSpotlight: renderSpotlight,
    render: render,
    bind: bind,
    prefetch: prefetch,
    loadIndex: loadIndex,
    loadProfile: loadProfile,
    isEnabled: function () {
      if (!indexCache) return isTest();
      return isFeatureEnabled(indexCache);
    }
  };
})(window);
