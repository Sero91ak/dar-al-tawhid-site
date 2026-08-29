/**
 * DAR AL TAWḤĪD — Propheten Wissensbibliothek (Live + Test)
 * Claim-based profiles · master-detail by viewport width · no UA detection.
 */
(function (global) {
  "use strict";

  function dataBase() {
    try {
      if (global.IS_TEST_PATH || location.pathname.indexOf("/test/") === 0 || location.pathname === "/test") {
        return "/test/data/prophets/";
      }
    } catch (e) {}
    /* Live path only when explicitly not on Test — never used as silent fallback for missing Test files. */
    return "/data/prophets/";
  }
  var DATA_BASE = dataBase();
  var LAST_LOAD_ERROR = null;

  /** currentRoute ist im App-Script als `let` deklariert → NICHT auf window.
   *  Immer Hash/`readRoute` nutzen, sonst bleibt „Wird geöffnet…“ hängen. */
  function appRoute() {
    try {
      if (typeof global.readRoute === "function") {
        var r = global.readRoute();
        if (r && r.view) return r;
      }
    } catch (e) {}
    try {
      var raw = String(location.hash || "").replace(/^#\/?/, "");
      var segs = raw.split("/").map(function (p) {
        try {
          return decodeURIComponent(p || "");
        } catch (e2) {
          return p || "";
        }
      });
      return { view: String(segs[0] || "").toLowerCase(), value: segs.slice(1).join("/") };
    } catch (e3) {
      return { view: "", value: "" };
    }
  }

  function isProphetenRoute() {
    return appRoute().view === "propheten";
  }

  function logProphetLoadError(info) {
    LAST_LOAD_ERROR = Object.assign(
      {
        timestamp: new Date().toISOString(),
        dataBase: DATA_BASE
      },
      info || {}
    );
    try {
      console.info("[prophets]", LAST_LOAD_ERROR);
    } catch (e) {}
  }

  function visitorLoadErrorHtml(opts) {
    opts = opts || {};
    var offlineUncached = !isOnline() || opts.offlineUncached;
    var msg = offlineUncached
      ? "Dieser Inhalt ist auf diesem Gerät noch nicht offline gespeichert."
      : "Dieser Inhalt konnte nicht geladen werden.";
    return (
      '<div class="prophets-empty" role="alert">' +
      "<p>" +
      msg +
      "</p>" +
      '<button type="button" class="prophets-rail__back-mobile" data-prophets-back>Zur Übersicht</button>' +
      "</div>"
    );
  }

  function notFoundHtml() {
    return (
      '<div class="prophets-empty" role="status">' +
      "<p>Prophetenprofil nicht gefunden</p>" +
      '<button type="button" class="prophets-rail__back-mobile" data-prophets-back>Zur Übersicht</button>' +
      "</div>"
    );
  }
  var DUAL_MIN = 700;
  var DUAL_PORTRAIT_MIN = 840;
  var STATE_KEY = "dar_prophets_ui_v1";
  var LAST_READ_KEY = "dar_prophets_last_read_v1";
  var INDEX_STORE_KEY = "dar_prophets_index_cache_v2";
  var PROPHETS_BOOT_INDEX = {"version":2,"feature":"prophetsKnowledgeBase","env":{"test":"enabled","production":"enabled"},"title":"Die Propheten","contentVersion":"prophets-final-test-v1","availableFilters":{"all":true,"quran":true,"sunnah":true,"ulu":true,"banuIsrail":true,"arabicMessenger":true,"further":true},"prophets":[{"id":"adam","name":"Ādam","nameAr":"آدم","honorific":"عليه السلام","roles":["nabī"],"people":"","uluAlAzm":false,"prophetStatus":"quran_explicit","profileStatus":"approved","profileFile":"adam.json","classifications":{"uluAlAzm":false,"quranExplicit":true,"hasSunnah":true,"banuIsrail":false,"arabicMessenger":false,"furtherPerson":false},"hasSunnah":true,"quranNamed":true},{"id":"idris","name":"Idrīs","nameAr":"إدريس","honorific":"عليه السلام","roles":["nabī"],"people":"","uluAlAzm":false,"prophetStatus":"quran_explicit","profileStatus":"approved","profileFile":"idris.json","classifications":{"uluAlAzm":false,"quranExplicit":true,"hasSunnah":true,"banuIsrail":false,"arabicMessenger":false,"furtherPerson":false},"hasSunnah":true,"quranNamed":true},{"id":"nuh","name":"Nūḥ","nameAr":"نوح","honorific":"عليه السلام","roles":["nabī","rasūl"],"people":"Qawm Nūḥ","uluAlAzm":true,"prophetStatus":"quran_explicit","profileStatus":"approved","profileFile":"nuh.json","classifications":{"uluAlAzm":true,"quranExplicit":true,"hasSunnah":true,"banuIsrail":false,"arabicMessenger":false,"furtherPerson":false},"hasSunnah":true,"quranNamed":true},{"id":"hud","name":"Hūd","nameAr":"هود","honorific":"عليه السلام","roles":["nabī","rasūl"],"people":"ʿĀd","uluAlAzm":false,"prophetStatus":"quran_explicit","profileStatus":"approved","profileFile":"hud.json","classifications":{"uluAlAzm":false,"quranExplicit":true,"hasSunnah":false,"banuIsrail":false,"arabicMessenger":true,"furtherPerson":false},"arabicMessenger":true,"quranNamed":true},{"id":"salih","name":"Ṣāliḥ","nameAr":"صالح","honorific":"عليه السلام","roles":["nabī","rasūl"],"people":"Thamūd","uluAlAzm":false,"prophetStatus":"quran_explicit","profileStatus":"approved","profileFile":"salih.json","classifications":{"uluAlAzm":false,"quranExplicit":true,"hasSunnah":true,"banuIsrail":false,"arabicMessenger":true,"furtherPerson":false},"hasSunnah":true,"arabicMessenger":true,"quranNamed":true},{"id":"ibrahim","name":"Ibrāhīm","nameAr":"إبراهيم","honorific":"عليه السلام","roles":["nabī"],"people":"","uluAlAzm":true,"prophetStatus":"quran_explicit","profileStatus":"approved","profileFile":"ibrahim.json","classifications":{"uluAlAzm":true,"quranExplicit":true,"hasSunnah":true,"banuIsrail":false,"arabicMessenger":false,"furtherPerson":false},"hasSunnah":true,"quranNamed":true},{"id":"lut","name":"Lūṭ","nameAr":"لوط","honorific":"عليه السلام","roles":["nabī","rasūl"],"people":"Qawm Lūṭ","uluAlAzm":false,"prophetStatus":"quran_explicit","profileStatus":"approved","profileFile":"lut.json","classifications":{"uluAlAzm":false,"quranExplicit":true,"hasSunnah":true,"banuIsrail":false,"arabicMessenger":false,"furtherPerson":false},"hasSunnah":true,"quranNamed":true},{"id":"ismail","name":"Ismāʿīl","nameAr":"إسماعيل","honorific":"عليه السلام","roles":["nabī","rasūl"],"people":"","uluAlAzm":false,"prophetStatus":"quran_explicit","profileStatus":"approved","profileFile":"ismail.json","classifications":{"uluAlAzm":false,"quranExplicit":true,"hasSunnah":true,"banuIsrail":false,"arabicMessenger":true,"furtherPerson":false},"hasSunnah":true,"arabicMessenger":true,"quranNamed":true},{"id":"ishaq","name":"Isḥāq","nameAr":"إسحاق","honorific":"عليه السلام","roles":["nabī"],"people":"","uluAlAzm":false,"prophetStatus":"quran_explicit","profileStatus":"approved","profileFile":"ishaq.json","classifications":{"uluAlAzm":false,"quranExplicit":true,"hasSunnah":true,"banuIsrail":false,"arabicMessenger":false,"furtherPerson":false},"hasSunnah":true,"quranNamed":true},{"id":"yaqub","name":"Yaʿqūb","nameAr":"يعقوب","honorific":"عليه السلام","roles":["nabī"],"people":"","uluAlAzm":false,"prophetStatus":"quran_explicit","profileStatus":"approved","profileFile":"yaqub.json","classifications":{"uluAlAzm":false,"quranExplicit":true,"hasSunnah":true,"banuIsrail":false,"arabicMessenger":false,"furtherPerson":false},"hasSunnah":true,"quranNamed":true},{"id":"yusuf","name":"Yūsuf","nameAr":"يوسف","honorific":"عليه السلام","roles":["nabī"],"people":"","uluAlAzm":false,"prophetStatus":"quran_explicit","profileStatus":"approved","profileFile":"yusuf.json","classifications":{"uluAlAzm":false,"quranExplicit":true,"hasSunnah":true,"banuIsrail":false,"arabicMessenger":false,"furtherPerson":false},"hasSunnah":true,"quranNamed":true},{"id":"ayyub","name":"Ayyūb","nameAr":"أيوب","honorific":"عليه السلام","roles":["nabī"],"people":"","uluAlAzm":false,"prophetStatus":"quran_explicit","profileStatus":"approved","profileFile":"ayyub.json","classifications":{"uluAlAzm":false,"quranExplicit":true,"hasSunnah":true,"banuIsrail":false,"arabicMessenger":false,"furtherPerson":false},"hasSunnah":true,"quranNamed":true},{"id":"shuayb","name":"Shuʿayb","nameAr":"شعيب","honorific":"عليه السلام","roles":["nabī","rasūl"],"people":"Madyan","uluAlAzm":false,"prophetStatus":"quran_explicit","profileStatus":"approved","profileFile":"shuayb.json","classifications":{"uluAlAzm":false,"quranExplicit":true,"hasSunnah":false,"banuIsrail":false,"arabicMessenger":true,"furtherPerson":false},"arabicMessenger":true,"quranNamed":true},{"id":"musa","name":"Mūsā","nameAr":"موسى","honorific":"عليه السلام","roles":["nabī","rasūl"],"people":"Banū Isrāʾīl","uluAlAzm":true,"prophetStatus":"quran_explicit","profileStatus":"approved","profileFile":"musa.json","classifications":{"uluAlAzm":true,"quranExplicit":true,"hasSunnah":true,"banuIsrail":true,"arabicMessenger":false,"furtherPerson":false},"hasSunnah":true,"banuIsrail":true,"quranNamed":true},{"id":"harun","name":"Hārūn","nameAr":"هارون","honorific":"عليه السلام","roles":["nabī"],"people":"Banū Isrāʾīl","uluAlAzm":false,"prophetStatus":"quran_explicit","profileStatus":"approved","profileFile":"harun.json","classifications":{"uluAlAzm":false,"quranExplicit":true,"hasSunnah":true,"banuIsrail":true,"arabicMessenger":false,"furtherPerson":false},"hasSunnah":true,"banuIsrail":true,"quranNamed":true},{"id":"dawud","name":"Dāwūd","nameAr":"داود","honorific":"عليه السلام","roles":["nabī"],"people":"","uluAlAzm":false,"prophetStatus":"quran_explicit","profileStatus":"approved","profileFile":"dawud.json","classifications":{"uluAlAzm":false,"quranExplicit":true,"hasSunnah":true,"banuIsrail":false,"arabicMessenger":false,"furtherPerson":false},"hasSunnah":true,"quranNamed":true},{"id":"sulayman","name":"Sulaymān","nameAr":"سليمان","honorific":"عليه السلام","roles":["nabī"],"people":"","uluAlAzm":false,"prophetStatus":"quran_explicit","profileStatus":"approved","profileFile":"sulayman.json","classifications":{"uluAlAzm":false,"quranExplicit":true,"hasSunnah":true,"banuIsrail":false,"arabicMessenger":false,"furtherPerson":false},"hasSunnah":true,"quranNamed":true},{"id":"ilyas","name":"Ilyās","nameAr":"إلياس","honorific":"عليه السلام","roles":["nabī","rasūl"],"people":"","uluAlAzm":false,"prophetStatus":"quran_explicit","profileStatus":"approved","profileFile":"ilyas.json","classifications":{"uluAlAzm":false,"quranExplicit":true,"hasSunnah":false,"banuIsrail":false,"arabicMessenger":false,"furtherPerson":false},"quranNamed":true},{"id":"alyasa","name":"Al-Yasaʿ","nameAr":"اليسع","honorific":"عليه السلام","roles":["nabī"],"people":"","uluAlAzm":false,"prophetStatus":"quran_explicit","profileStatus":"approved","profileFile":"alyasa.json","classifications":{"uluAlAzm":false,"quranExplicit":true,"hasSunnah":false,"banuIsrail":false,"arabicMessenger":false,"furtherPerson":false},"quranNamed":true},{"id":"yunus","name":"Yūnus","nameAr":"يونس","honorific":"عليه السلام","roles":["nabī","rasūl"],"people":"","uluAlAzm":false,"prophetStatus":"quran_explicit","profileStatus":"approved","profileFile":"yunus.json","classifications":{"uluAlAzm":false,"quranExplicit":true,"hasSunnah":true,"banuIsrail":false,"arabicMessenger":false,"furtherPerson":false},"hasSunnah":true,"quranNamed":true},{"id":"zakariyya","name":"Zakariyyā","nameAr":"زكريا","honorific":"عليه السلام","roles":["nabī"],"people":"","uluAlAzm":false,"prophetStatus":"quran_explicit","profileStatus":"approved","profileFile":"zakariyya.json","classifications":{"uluAlAzm":false,"quranExplicit":true,"hasSunnah":true,"banuIsrail":false,"arabicMessenger":false,"furtherPerson":false},"hasSunnah":true,"quranNamed":true},{"id":"yahya","name":"Yaḥyā","nameAr":"يحيى","honorific":"عليه السلام","roles":["nabī"],"people":"","uluAlAzm":false,"prophetStatus":"quran_explicit","profileStatus":"approved","profileFile":"yahya.json","classifications":{"uluAlAzm":false,"quranExplicit":true,"hasSunnah":true,"banuIsrail":false,"arabicMessenger":false,"furtherPerson":false},"hasSunnah":true,"quranNamed":true},{"id":"isa","name":"ʿĪsā","nameAr":"عيسى","honorific":"عليه السلام","roles":["nabī","rasūl"],"people":"Banū Isrāʾīl","uluAlAzm":true,"prophetStatus":"quran_explicit","profileStatus":"approved","profileFile":"isa.json","classifications":{"uluAlAzm":true,"quranExplicit":true,"hasSunnah":true,"banuIsrail":true,"arabicMessenger":false,"furtherPerson":false},"hasSunnah":true,"banuIsrail":true,"quranNamed":true},{"id":"dhul-kifl","name":"Dhū l-Kifl","nameAr":"ذو الكفل","honorific":"عليه السلام","roles":[],"people":"","uluAlAzm":false,"prophetStatus":"scholarly_disputed","profileStatus":"approved","profileFile":"dhul-kifl.json","classifications":{"uluAlAzm":false,"quranExplicit":false,"hasSunnah":false,"banuIsrail":false,"arabicMessenger":false,"furtherPerson":true},"quranNamed":true},{"id":"muhammad","name":"Muḥammad","nameAr":"محمد","honorific":"ﷺ","roles":["nabī","rasūl"],"people":"","uluAlAzm":true,"prophetStatus":"quran_explicit","profileStatus":"approved","profileFile":"muhammad.json","classifications":{"uluAlAzm":true,"quranExplicit":true,"hasSunnah":true,"banuIsrail":false,"arabicMessenger":true,"furtherPerson":false},"hasSunnah":true,"arabicMessenger":true,"quranNamed":true}],"disputed":[{"id":"yusha-ibn-nun","name":"Yūshaʿ ibn Nūn","nameAr":"يوشع بن نون","honorific":"عليه السلام","roles":[],"people":"","uluAlAzm":false,"prophetStatus":"scholarly_source_correlation","profileStatus":"approved","profileFile":"research/yusha-ibn-nun.json","classifications":{"uluAlAzm":false,"quranExplicit":false,"hasSunnah":true,"banuIsrail":true,"arabicMessenger":false,"furtherPerson":true},"hasSunnah":true,"banuIsrail":true},{"id":"al-khidr","name":"al-Khiḍr","nameAr":"الخضر","honorific":"","roles":[],"people":"","uluAlAzm":false,"prophetStatus":"scholarly_disputed_or_inferred","profileStatus":"approved","profileFile":"research/al-khidr.json","classifications":{"uluAlAzm":false,"quranExplicit":false,"hasSunnah":true,"banuIsrail":false,"arabicMessenger":false,"furtherPerson":true},"hasSunnah":true},{"id":"luqman","name":"Luqmān","nameAr":"لقمان","honorific":"","roles":[],"people":"","uluAlAzm":false,"prophetStatus":"scholarly_disputed","profileStatus":"approved","profileFile":"research/luqman.json","classifications":{"uluAlAzm":false,"quranExplicit":false,"hasSunnah":false,"banuIsrail":false,"arabicMessenger":false,"furtherPerson":true},"quranNamed":true},{"id":"dhul-qarnayn","name":"Dhū l-Qarnayn","nameAr":"ذو القرنين","honorific":"","roles":[],"people":"","uluAlAzm":false,"prophetStatus":"scholarly_disputed","profileStatus":"approved","profileFile":"research/dhul-qarnayn.json","classifications":{"uluAlAzm":false,"quranExplicit":false,"hasSunnah":false,"banuIsrail":false,"arabicMessenger":false,"furtherPerson":true},"quranNamed":true},{"id":"uzayr","name":"ʿUzayr","nameAr":"عزير","honorific":"","roles":[],"people":"","uluAlAzm":false,"prophetStatus":"scholarly_disputed","profileStatus":"approved","profileFile":"research/uzayr.json","classifications":{"uluAlAzm":false,"quranExplicit":false,"hasSunnah":false,"banuIsrail":false,"arabicMessenger":false,"furtherPerson":true},"quranNamed":true}],"furtherPersons":[{"id":"dhul-kifl","name":"Dhū l-Kifl","nameAr":"ذو الكفل","honorific":"عليه السلام","roles":[],"people":"","uluAlAzm":false,"prophetStatus":"scholarly_disputed","profileStatus":"approved","profileFile":"dhul-kifl.json","classifications":{"uluAlAzm":false,"quranExplicit":false,"hasSunnah":false,"banuIsrail":false,"arabicMessenger":false,"furtherPerson":true},"quranNamed":true},{"id":"al-khidr","name":"al-Khiḍr","nameAr":"الخضر","honorific":"","roles":[],"people":"","uluAlAzm":false,"prophetStatus":"scholarly_disputed_or_inferred","profileStatus":"approved","profileFile":"research/al-khidr.json","classifications":{"uluAlAzm":false,"quranExplicit":false,"hasSunnah":true,"banuIsrail":false,"arabicMessenger":false,"furtherPerson":true},"hasSunnah":true},{"id":"luqman","name":"Luqmān","nameAr":"لقمان","honorific":"","roles":[],"people":"","uluAlAzm":false,"prophetStatus":"scholarly_disputed","profileStatus":"approved","profileFile":"research/luqman.json","classifications":{"uluAlAzm":false,"quranExplicit":false,"hasSunnah":false,"banuIsrail":false,"arabicMessenger":false,"furtherPerson":true},"quranNamed":true},{"id":"dhul-qarnayn","name":"Dhū l-Qarnayn","nameAr":"ذو القرنين","honorific":"","roles":[],"people":"","uluAlAzm":false,"prophetStatus":"scholarly_disputed","profileStatus":"approved","profileFile":"research/dhul-qarnayn.json","classifications":{"uluAlAzm":false,"quranExplicit":false,"hasSunnah":false,"banuIsrail":false,"arabicMessenger":false,"furtherPerson":true},"quranNamed":true},{"id":"uzayr","name":"ʿUzayr","nameAr":"عزير","honorific":"","roles":[],"people":"","uluAlAzm":false,"prophetStatus":"scholarly_disputed","profileStatus":"approved","profileFile":"research/uzayr.json","classifications":{"uluAlAzm":false,"quranExplicit":false,"hasSunnah":false,"banuIsrail":false,"arabicMessenger":false,"furtherPerson":true},"quranNamed":true},{"id":"yusha-ibn-nun","name":"Yūshaʿ ibn Nūn","nameAr":"يوشع بن نون","honorific":"عليه السلام","roles":[],"people":"","uluAlAzm":false,"prophetStatus":"scholarly_source_correlation","profileStatus":"approved","profileFile":"research/yusha-ibn-nun.json","classifications":{"uluAlAzm":false,"quranExplicit":false,"hasSunnah":true,"banuIsrail":true,"arabicMessenger":false,"furtherPerson":true},"hasSunnah":true,"banuIsrail":true}],"__boot":true};
  var indexCache = null;
  var searchIndexCache = null;
  var profileCache = Object.create(null);
  var hadithCache = Object.create(null);
  var relationCache = Object.create(null);
  var loadIndexPromise = null;
  var indexRefreshPromise = null;
  var profileLoadInflight = Object.create(null);
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
    try {
      if (global.DarFold && typeof global.DarFold.isDual === "function") {
        return !!global.DarFold.isDual();
      }
      if (global.DarAdaptiveLayout && typeof global.DarAdaptiveLayout.isDual === "function") {
        return !!global.DarAdaptiveLayout.isDual();
      }
      if (document.documentElement.getAttribute("data-fold-dual") === "1") return true;
      if (document.documentElement.classList.contains("is-fold-dual")) return true;
      if (document.documentElement.getAttribute("data-layout") === "expanded") return true;
    } catch (e) {}
    var w = measureWidth();
    var h = Math.round(
      (global.visualViewport && global.visualViewport.height) ||
        document.documentElement.clientHeight ||
        global.innerHeight ||
        0
    );
    if (w < DUAL_MIN) return false;
    if (w >= h) return true;
    return w >= DUAL_PORTRAIT_MIN;
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

  /* Thematische Embleme (wie Duʿāʾ) — keine Porträts/Figuren. */
  var PROPHET_EMOJI = {
    adam: "🌱",
    idris: "✒️",
    nuh: "🚢",
    hud: "🏜️",
    salih: "🐪",
    ibrahim: "🔥",
    lut: "🏙️",
    ismail: "⛺",
    ishaq: "👶",
    yaqub: "🧬",
    yusuf: "🌙",
    ayyub: "🤲",
    shuayb: "⚖️",
    musa: "🌊",
    harun: "📜",
    dawud: "🗡️",
    sulayman: "👑",
    ilyas: "⚡",
    alyasa: "🌿",
    yunus: "🐋",
    zakariyya: "🛕",
    yahya: "💧",
    isa: "✨",
    muhammad: "🌟",
    "dhul-kifl": "📘",
    uzayr: "📖",
    maryam: "🕊️"
  };

  function prophetMark(id, p) {
    var key = String(id || (p && p.id) || "").toLowerCase();
    if (PROPHET_EMOJI[key]) return PROPHET_EMOJI[key];
    if (p && p.uluAlAzm) return "✦";
    if (p && isDisputedStatus(p.prophetStatus)) return "◇";
    return "◆";
  }

  function isDisputedStatus(status) {
    return !!(status && DISPUTED_STATUSES[String(status)]);
  }

  function visitorGermanText(raw) {
    if (raw == null) return "";
    var s = String(raw).trim();
    if (!s || s === "null" || s === "undefined") return "Nicht authentisch belegt";
    var exact = {
      scholarly_disputed: "unter den Gelehrten umstritten",
      "scholarly_disputed / research": "unter den Gelehrten umstritten · in Prüfung",
      scholarly_disputed_or_inferred: "unter den Gelehrten umstritten oder erschlossen",
      scholarly_source_correlation: "über Quellenabgleich der Gelehrten",
      quran_explicit: "im Qurʾān ausdrücklich genannt",
      quran_named_status_under_review: "im Qurʾān genannt · Einordnung in Prüfung",
      quran_named_wise_person: "im Qurʾān genannte weise Person",
      approved: "geprüft",
      research: "nicht sicher überliefert",
      research_preview: "Vorschau · nicht freigegeben",
      approved_existence: "Existenz belegt",
      approved_existence_name_research: "Existenz belegt; Name nicht sicher überliefert",
      name_research: "Name nicht sicher überliefert",
      "Name research": "Name nicht sicher überliefert",
      "Existenz approved; Name research": "Existenz belegt; Name nicht sicher überliefert",
      "research (Existenz approved)": "Existenz belegt; Name nicht sicher überliefert",
      not_established: "nicht authentisch belegt",
      not_established_in_reviewed_sources: "in den geprüften Quellen nicht belegt",
      unattested: "nicht authentisch belegt",
      disputed: "umstritten",
      "Ikhtilāf / scholarly_disputed": "Ikhtilāf / unter den Gelehrten umstritten"
    };
    if (exact[s]) return exact[s];
    var lower = s.toLowerCase();
    if (exact[lower]) return exact[lower];
    s = s.replace(/Existenz approved;\s*Name research/gi, "Existenz belegt; Name nicht sicher überliefert");
    s = s.replace(/research\s*\(Existenz approved\)/gi, "Existenz belegt; Name nicht sicher überliefert");
    s = s.replace(/Existenz approved/gi, "Existenz belegt");
    s = s.replace(/Name research/gi, "Name nicht sicher überliefert");
    s = s.replace(/scholarly_disputed_or_inferred/gi, "unter den Gelehrten umstritten oder erschlossen");
    s = s.replace(/scholarly_source_correlation/gi, "über Quellenabgleich der Gelehrten");
    s = s.replace(/scholarly_disputed/gi, "unter den Gelehrten umstritten");
    s = s.replace(/quran_explicit/gi, "im Qurʾān ausdrücklich genannt");
    s = s.replace(/quran_named_status_under_review/gi, "im Qurʾān genannt · Einordnung in Prüfung");
    s = s.replace(/not_established_in_reviewed_sources/gi, "in den geprüften Quellen nicht belegt");
    s = s.replace(/not_established/gi, "nicht authentisch belegt");
    s = s.replace(/approved_existence/gi, "Existenz belegt");
    s = s.replace(/\bresearch_preview\b/gi, "Vorschau · nicht freigegeben");
    s = s.replace(/\bresearch\b/gi, "nicht sicher überliefert");
    s = s.replace(/\bapproved\b/gi, "geprüft");
    s = s.replace(/\bunattested\b/gi, "nicht authentisch belegt");
    s = s.replace(/\bdisputed\b/gi, "umstritten");
    if (/^[a-z]+(?:[A-Z][a-z]+)+$/.test(s) || /^[a-z]+_[a-z0-9_]+$/i.test(s)) {
      return "In Prüfung";
    }
    return s;
  }

  function publicStatusLabel(gradingOrStatus) {
    var raw = String(gradingOrStatus || "");
    var g = raw.toLowerCase();
    if (g === "quran" || g === "qurʾān") return "Qurʾān";
    if (g.indexOf("sahih") >= 0 || g.indexOf("ṣaḥīḥ") >= 0) return "Ṣaḥīḥ";
    if (g.indexOf("hasan") >= 0 || g.indexOf("ḥasan") >= 0) return "Ḥasan";
    if (g.indexOf("athar") >= 0) return "Authentischer Athar";
    if (isDisputedStatus(g) || g.indexOf("disputed") >= 0 || g.indexOf("umstritten") >= 0) return "Umstritten";
    if (
      g.indexOf("not_authentically") >= 0 ||
      g.indexOf("nicht authentisch") >= 0 ||
      g.indexOf("unattested") >= 0 ||
      g.indexOf("not_established") >= 0 ||
      g === "not_established_in_reviewed_sources"
    ) {
      return "Nicht authentisch belegt";
    }
    return visitorGermanText(raw);
  }

  function absenceVisitorNote(status) {
    var s = String(status || "");
    if (s === "not_established_in_reviewed_sources" || /not_established|nicht authentisch belegt/i.test(s)) {
      return "In den für dieses Profil geprüften Quellen liegt derzeit kein freigegebener authentischer Nachweis vor.";
    }
    return "";
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

  function ensureClaimMap(profile) {
    if (!profile) return null;
    if (profile.__claimMap) return profile.__claimMap;
    var map = Object.create(null);
    (profile.claims || []).forEach(function (c) {
      if (c && c.id) map[String(c.id)] = c;
    });
    profile.__claimMap = map;
    return map;
  }

  function claimById(profile, id) {
    if (!profile || id == null || id === "") return null;
    var map = ensureClaimMap(profile);
    return map[String(id)] || null;
  }

  function indexAssetUrl(file) {
    /* Stabile URL ohne Query → SW APP_SHELL / Runtime-Cache treffen. */
    return DATA_BASE + file;
  }

  function readSessionIndex() {
    try {
      var raw = sessionStorage.getItem(INDEX_STORE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.data || !parsed.data.prophets) return null;
      return parsed.data;
    } catch (e) {
      return null;
    }
  }

  function writeSessionIndex(data) {
    try {
      if (!data || !data.prophets) return;
      sessionStorage.setItem(
        INDEX_STORE_KEY,
        JSON.stringify({
          at: Date.now(),
          dataBase: DATA_BASE,
          data: data
        })
      );
    } catch (e) {}
  }

  function hydrateIndexFromSession() {
    if (indexCache) return indexCache;
    var cached = readSessionIndex();
    if (cached && isFeatureEnabled(cached)) {
      indexCache = cached;
      return cached;
    }
    /* Sofort-Start: schlanker Boot-Index ohne Netzwartezeit. */
    if (PROPHETS_BOOT_INDEX && PROPHETS_BOOT_INDEX.prophets && isFeatureEnabled(PROPHETS_BOOT_INDEX)) {
      indexCache = PROPHETS_BOOT_INDEX;
      return indexCache;
    }
    return null;
  }

  function fetchJsonPreferCache(url) {
    return fetch(url, { cache: "default" }).then(function (r) {
      if (!r.ok) throw new Error("http_" + r.status);
      return r.json();
    });
  }

  function applyIndexData(data, opts) {
    opts = opts || {};
    if (!data || !data.prophets) return null;
    var prevVersion =
      indexCache && (indexCache.contentVersion || indexCache.updatedAt || indexCache.version);
    var nextVersion = data.contentVersion || data.updatedAt || data.version;
    indexCache = data;
    writeSessionIndex(data);
    if (!opts.silent && prevVersion && nextVersion && String(prevVersion) !== String(nextVersion)) {
      if (isProphetenRoute()) {
        if (typeof global.render === "function") global.render();
      }
    }
    return data;
  }

  function refreshIndexInBackground() {
    if (indexRefreshPromise) return indexRefreshPromise;
    var requestedFile = DATA_BASE + "index.json";
    indexRefreshPromise = fetchJsonPreferCache(indexAssetUrl("index.json"))
      .then(function (data) {
        applyIndexData(data, { silent: false });
        loadSearchIndex().catch(function () {});
        return data;
      })
      .catch(function (err) {
        if (!indexCache) {
          logProphetLoadError({
            prophetId: null,
            requestedFile: requestedFile,
            errorType: "index_fetch_failed"
          });
        }
        throw err;
      })
      .finally(function () {
        indexRefreshPromise = null;
      });
    return indexRefreshPromise;
  }

  function loadIndex() {
    if (indexCache) {
      refreshIndexInBackground().catch(function () {});
      return Promise.resolve(indexCache);
    }
    var warm = hydrateIndexFromSession();
    if (warm) {
      refreshIndexInBackground().catch(function () {});
      loadSearchIndex().catch(function () {});
      try {
        warmPopularProfiles();
      } catch (e) {}
      return Promise.resolve(warm);
    }
    if (loadIndexPromise) return loadIndexPromise;
    var requestedFile = DATA_BASE + "index.json";
    loadIndexPromise = fetchJsonPreferCache(indexAssetUrl("index.json"))
      .then(function (data) {
        applyIndexData(data, { silent: true });
        /* Suche separat — blockiert die Liste nicht. */
        loadSearchIndex().catch(function () {});
        try {
          warmPopularProfiles();
        } catch (e) {}
        return data;
      })
      .catch(function (err) {
        loadIndexPromise = null;
        if (!LAST_LOAD_ERROR || LAST_LOAD_ERROR.requestedFile !== requestedFile) {
          logProphetLoadError({
            prophetId: null,
            requestedFile: requestedFile,
            errorType: "index_fetch_failed"
          });
        }
        throw err;
      });
    return loadIndexPromise;
  }

  function loadSearchIndex() {
    if (searchIndexCache) return Promise.resolve(searchIndexCache);
    return fetchJsonPreferCache(indexAssetUrl("search-index.json"))
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

  function rewriteSourceUrl(url) {
    var href = String(url || "").trim();
    if (!href) return "";
    /* Alte Collection-Dumps → einzelne Hadith-Datei */
    var m = href.match(/editions\/ara-([a-z0-9-]+)\.min\.json#hadithnumber=(\d+)/i);
    if (m) {
      return (
        "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-" +
        m[1] +
        "/" +
        m[2] +
        ".min.json"
      );
    }
    return href;
  }

  function sunnahComFromRef(url, sunnahComUrl) {
    if (sunnahComUrl && /^https:\/\/sunnah\.com\//i.test(String(sunnahComUrl))) {
      return String(sunnahComUrl);
    }
    var href = String(url || "");
    var m = href.match(/editions\/ara-([a-z0-9-]+)(?:\.min\.json#hadithnumber=|\/)(\d+)/i);
    if (!m) return "";
    var coll = m[1];
    var num = m[2];
    if (coll === "bukhari") return "https://sunnah.com/bukhari:" + num;
    if (coll === "muslim") return "https://sunnah.com/muslim:" + num;
    if (coll === "tirmidhi") return "https://sunnah.com/tirmidhi:" + num;
    if (coll === "abudawud") return "https://sunnah.com/abudawud:" + num;
    if (coll === "nasai") return "https://sunnah.com/nasai:" + num;
    if (coll === "ibnmajah") return "https://sunnah.com/ibnmajah:" + num;
    return "";
  }

  function openExternalSafe(url) {
    if (!url) return;
    var href = rewriteSourceUrl(url);
    if (!/^https:\/\//i.test(href)) {
      try {
        console.info("[prophets] blocked non-https external url", { errorType: "unsafe_external_url" });
      } catch (e) {}
      return;
    }
    if (!isOnline()) {
      try {
        alert("Für den externen Direktnachweis ist eine Internetverbindung erforderlich.");
      } catch (e) {}
      return;
    }
    try {
      var a = document.createElement("a");
      a.href = href;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.click();
    } catch (e) {
      try {
        window.open(href, "_blank", "noopener,noreferrer");
      } catch (e2) {}
    }
  }

  function fullGermanText(it) {
    var de = String((it && (it.translationDe || it.summary)) || "").trim();
    return de;
  }

  function renderSourceActions(it) {
    var ext = it && it.directReference && String(it.directReference).indexOf("http") === 0 ? it.directReference : "";
    var sunnah = sunnahComFromRef(ext, it && it.sunnahComUrl);
    var panelId = "psrc-" + String((it && (it.id || it.hadithId)) || Math.random()).replace(/[^\w-]+/g, "");
    var metaBits = [
      it.work || it.collection || it.source || "",
      it.bookChapter || "",
      it.number || it.hadithNumber || it.displayNumber || "",
      it.grading || ""
    ].filter(Boolean);
    var rawi = it.sahabiRawi || it.rawi || "";
    var ar = it.arabicOriginal || "";
    var de = fullGermanText(it);
    if (!ext && !sunnah && !ar && !de) return "";
    return (
      '<div class="prophets-source-actions">' +
      '<button type="button" class="prophets-link" data-prophets-source-toggle="' +
      esc(panelId) +
      '" aria-expanded="false">Quelle öffnen</button>' +
      (sunnah
        ? '<button type="button" class="prophets-link prophets-link--ghost" data-external-url="' +
          esc(sunnah) +
          '">sunnah.com</button>'
        : "") +
      (ext
        ? '<button type="button" class="prophets-link prophets-link--ghost" data-external-url="' +
          esc(rewriteSourceUrl(ext)) +
          '">API-Nachweis</button>'
        : "") +
      '</div><div class="prophets-source-panel" id="' +
      esc(panelId) +
      '" hidden>' +
      (metaBits.length
        ? '<p class="prophets-source-panel__meta">' + esc(metaBits.join(" · ")) + "</p>"
        : "") +
      (rawi ? '<p class="prophets-source-panel__meta">Rāwī: ' + esc(rawi) + "</p>" : "") +
      (ar
        ? '<p class="prophets-quote__ar" lang="ar" dir="rtl">' + esc(ar) + "</p>"
        : "") +
      (de ? '<p class="prophets-quote__de">' + esc(de) + "</p>" : "") +
      '<p class="prophets-note">Authentische Zuordnung gemäß freigegebenem Profil · kein gekürzter Ersatztext.</p>' +
      "</div>"
    );
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
      ids.push(String(hid));
    }
    function fromItem(it) {
      if (!it || typeof it !== "object") return;
      add(it.hadithId || (it.hadithRef && it.hadithRef.hadithId));
    }
    (profile.claims || []).forEach(fromItem);
    (profile.prophetAbout || []).forEach(fromItem);
    var st = profile.statements || {};
    (st.sunnah || []).forEach(fromItem);
    (st.quran || []).forEach(fromItem);
    return ids;
  }

  function applyHadithToItem(it, h) {
    if (!it || !h) return;
    var de = String(it.translationDe || "").trim();
    var truncated = !de || de.indexOf("…") >= 0 || /\.\.\.\s*$/.test(de) || de.length < 120;
    if ((!it.arabicOriginal || String(it.arabicOriginal).length < 40) && h.arabicOriginal) {
      it.arabicOriginal = h.arabicOriginal;
    }
    if (truncated && h.translationDe) it.translationDe = h.translationDe;
    if ((!it.directReference || String(it.directReference).indexOf(".min.json#hadithnumber=") >= 0) && h.directReference) {
      it.directReference = h.directReference;
    }
    if (!it.sunnahComUrl && h.sunnahComUrl) it.sunnahComUrl = h.sunnahComUrl;
    if (!it.rawi && !it.sahabiRawi && h.rawi) it.rawi = h.rawi;
    if (!it.grading && h.grading) it.grading = h.grading;
    if (!it.bookChapter && h.bookChapter) it.bookChapter = h.bookChapter;
    if (!it.hadithId && h.id) it.hadithId = h.id;
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
      function hydrateList(list) {
        (list || []).forEach(function (c) {
          if (!c || typeof c !== "object") return;
          var hid = c.hadithId || (c.hadithRef && c.hadithRef.hadithId);
          applyHadithToItem(c, hid && map[hid]);
        });
      }
      hydrateList(profile.claims);
      hydrateList(profile.prophetAbout);
      hydrateList(profile.statements && profile.statements.sunnah);
      profile.__hadithHydrated = true;
      return profile;
    });
  }

  function requestProphetsPaint() {
    if (!isProphetenRoute()) return;
    if (typeof global.render === "function") global.render();
  }

  function activeProphetRouteId() {
    try {
      var route = appRoute();
      if (!route || route.view !== "propheten") return "";
      return String(parseRouteValue(route.value).prophetId || "");
    } catch (e) {
      return "";
    }
  }

  /** Ersetzt „Wird geöffnet…“ sofort — ohne auf vollen App-Render zu warten. */
  function paintOpenProfile(id) {
    var key = String(id || "");
    if (!key) return false;
    if (activeProphetRouteId() !== key) return false;
    if (!Object.prototype.hasOwnProperty.call(profileCache, key)) return false;
    var profile = profileCache[key];
    if (profile && profile.__loading) return false;

    var loading = document.querySelector(
      '.prophets-detail--loading[data-prophet-detail="' + key + '"]'
    );
    if (loading) {
      try {
        var parts = parseRouteValue((appRoute().value) || key);
        var html = renderDetail(profile, parts.section || "overview", readState(), findMeta(key));
        var box = document.createElement("div");
        box.innerHTML = html;
        var fresh = box.firstElementChild;
        if (fresh) {
          loading.replaceWith(fresh);
          try {
            bind();
          } catch (e) {}
          return true;
        }
      } catch (e2) {}
    }
    requestProphetsPaint();
    return true;
  }

  function fetchProfileResponse(url) {
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = null;
    if (ctrl) {
      timer = setTimeout(function () {
        try {
          ctrl.abort();
        } catch (e) {}
      }, 14000);
    }
    var opts = { cache: "default" };
    if (ctrl) opts.signal = ctrl.signal;
    return fetch(url, opts)
      .then(function (r) {
        if (timer) clearTimeout(timer);
        return r;
      })
      .catch(function () {
        if (timer) clearTimeout(timer);
        /* Zweiter Versuch ohne Abort/Cache — iOS hängt manchmal an force-cache. */
        return fetch(url, { cache: "no-store" });
      });
  }

  function loadProfile(id) {
    var key = String(id || "");
    if (!key) return Promise.resolve(null);
    if (Object.prototype.hasOwnProperty.call(profileCache, key)) {
      return Promise.resolve(profileCache[key]);
    }
    if (profileLoadInflight[key] && profileLoadInflight[key].promise) {
      return profileLoadInflight[key].promise;
    }
    var start = indexCache ? Promise.resolve(indexCache) : loadIndex();
    var requestedFile = "";
    var promise = start
      .then(function () {
        var file = profileFileFor(key);
        requestedFile = DATA_BASE + file;
        /* Test must never silently fall back to /data/prophets/ when a Test file is missing. */
        return fetchProfileResponse(requestedFile);
      })
      .then(function (r) {
        if (!r || !r.ok) {
          var status = r ? r.status : 0;
          logProphetLoadError({
            prophetId: key,
            requestedFile: requestedFile,
            errorType: "profile_http_" + status
          });
          throw new Error("profile " + status);
        }
        return r.json();
      })
      .then(function (data) {
        /* Sofort anzeigen — Hadith-Hydration blockiert nicht mehr die Detailseite. */
        if (data && typeof data === "object") ensureClaimMap(data);
        profileCache[key] = data;
        if (requestedFile) precacheOpenedProfile(requestedFile);
        /* Kritisch: Loading-Stub sofort ersetzen (sonst bleibt „Wird geöffnet…“ bis Zweitklick). */
        try {
          paintOpenProfile(key);
        } catch (e) {}
        queueMicrotask(function () {
          try {
            paintOpenProfile(key);
          } catch (e2) {}
        });
        requestAnimationFrame(function () {
          try {
            paintOpenProfile(key);
          } catch (e3) {}
        });
        hydrateProfileHadith(data)
          .then(function (hydrated) {
            if (hydrated) {
              ensureClaimMap(hydrated);
              profileCache[key] = hydrated;
            }
            var route = appRoute();
            if (
              route &&
              route.view === "propheten" &&
              String(route.value || "").indexOf(key) === 0
            ) {
              var sec = String(route.value || "").split("/")[1] || "overview";
              if (sec === "sunnah" || sec === "aussagen" || sec === "quellen") {
                paintOpenProfile(key);
              }
            }
          })
          .catch(function () {});
        return data;
      })
      .catch(function () {
        if (!LAST_LOAD_ERROR || LAST_LOAD_ERROR.prophetId !== key) {
          logProphetLoadError({
            prophetId: key,
            requestedFile: requestedFile || DATA_BASE + profileFileFor(key),
            errorType: "profile_fetch_failed"
          });
        }
        profileCache[key] = null;
        try {
          paintOpenProfile(key);
        } catch (e) {}
        return null;
      })
      .finally(function () {
        if (profileLoadInflight[key]) profileLoadInflight[key] = false;
      });
    profileLoadInflight[key] = { promise: promise };
    return promise;
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
    /* Search-only normalization — never overwrite display/source strings. */
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
      .replace(/ǧ|ğ/g, "g")
      .replace(/[إأآٱ]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ؤ/g, "و")
      .replace(/ئ/g, "ي")
      .replace(/ة/g, "ه")
      .replace(/موسى/g, "موسى")
      .replace(/mousa|moosa/g, "musa");
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
    var metaBits = [p.honorific || "", roles, p.people].filter(Boolean);
    var meta = metaBits.join(" · ");
    var mark = prophetMark(p.id, p);
    return (
      '<button type="button" class="prophets-row' +
      (active ? " is-active" : "") +
      '" data-prophet-id="' +
      esc(p.id) +
      '">' +
      '<span class="prophets-row__icon" aria-hidden="true">' +
      mark +
      "</span>" +
      '<span class="prophets-row__body">' +
      '<span class="prophets-row__titleline">' +
      '<span class="prophets-row__name">' +
      esc(p.name) +
      "</span>" +
      (p.nameAr
        ? '<span class="prophets-row__ar" lang="ar" dir="rtl">' + esc(p.nameAr) + "</span>"
        : "") +
      "</span>" +
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
      '<span class="prophets-lastread__kicker">Zuletzt</span>' +
      '<span class="prophets-lastread__title">' +
      esc(lr.name || lr.prophetId) +
      (lr.honorific ? " " + esc(lr.honorific) : "") +
      "</span>" +
      '<span class="prophets-lastread__cta">Weiterlesen ›</span>' +
      "</button>"
    );
  }

  function renderProphetJumpSelect(index) {
    var names = (index.prophets || [])
      .filter(function (p) {
        return p && p.id && !isFurtherPerson(p) && p.profileStatus === "approved";
      })
      .slice()
      .sort(function (a, b) {
        return String(a.name || "").localeCompare(String(b.name || ""), "de");
      });
    return (
      '<select class="prophets-pick prophets-pick--names" data-prophets-jump aria-label="Prophet">' +
      '<option value="">✦ Prophet</option>' +
      names
        .map(function (p) {
          return (
            '<option value="' +
            esc(p.id) +
            '">' +
            esc(p.name) +
            (p.nameAr ? " · " + esc(p.nameAr) : "") +
            "</option>"
          );
        })
        .join("") +
      "</select>"
    );
  }

  function renderFilterPickSelect(groupId, placeholder, options, currentFilter) {
    var inGroup = options.some(function (o) {
      return o.id === currentFilter;
    });
    var selected = inGroup ? currentFilter : "all";
    return (
      '<select class="prophets-pick" data-prophets-pick="' +
      esc(groupId) +
      '" aria-label="' +
      esc(placeholder.replace(/^[^\s]+\s/, "")) +
      '">' +
      '<option value="all"' +
      (selected === "all" ? " selected" : "") +
      ">" +
      esc(placeholder) +
      "</option>" +
      options
        .map(function (o) {
          return (
            '<option value="' +
            esc(o.id) +
            '"' +
            (selected === o.id ? " selected" : "") +
            ">" +
            esc(o.label) +
            "</option>"
          );
        })
        .join("") +
      "</select>"
    );
  }

  function renderListPanel(index, state, activeId) {
    var filter = state.filter || "all";
    var query = state.query || "";
    var packs = filterProphets(index, filter, query);
    var avail = availableFilters(index);
    var byId = Object.create(null);
    avail.forEach(function (f) {
      byId[f.id] = f;
    });

    function opt(id) {
      return byId[id] ? { id: id, label: byId[id].label } : null;
    }

    var sourceOpts = [opt("quran"), opt("sunnah")].filter(Boolean);
    var groupOpts = [opt("ulu"), opt("banuIsrail"), opt("arabicMessenger"), opt("further")].filter(Boolean);

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
    body += section("Weitere Personen", packs.further || []);
    if (!(packs.ulu || []).length && !(packs.established || []).length && !(packs.further || []).length) {
      body = '<div class="prophets-empty">Keine Treffer.</div>';
    }

    return (
      '<div class="prophets-toolbar">' +
      renderLastReadCard() +
      '<section class="prophets-sf" aria-label="Suche und Filter">' +
      '<div class="prophets-search-panel">' +
      '<div class="prophets-pick-grid">' +
      renderProphetJumpSelect(index) +
      renderFilterPickSelect("group", "Gruppe", groupOpts, filter) +
      renderFilterPickSelect("source", "Quelle", sourceOpts, filter) +
      "</div>" +
      '<div class="prophets-search-shell">' +
      '<span class="prophets-search-icon" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">' +
      '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>' +
      "</span>" +
      '<input class="prophets-search" id="prophetsSearch" type="search" placeholder="Name, Volk, Ereignis, Sūrah …" value="' +
      esc(query) +
      '" autocomplete="off" spellcheck="false" enterkeyhint="search" aria-label="Propheten durchsuchen" />' +
      "</div>" +
      "</div>" +
      "</section>" +
      "</div>" +
      body
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
        var showValue = visitorGermanText(f.value);
        if (showValue == null || showValue === "" || showValue === "null" || showValue === "undefined") {
          showValue = "Nicht authentisch belegt";
        }
        var st = visitorGermanText(f.status || "");
        var ids = f.claimIds || [];
        var ok = !ids.length
          ? /nicht authentisch|nicht bestimmbar|nicht belegt|in prüfung/i.test(String(st))
          : claimsApproved(profile, ids);
        /* Positive Werte ohne freigegebene Claims: im Lesertext nicht als Tatsache. */
        if (ids.length && !ok && f.displayMode === "research_preview") {
          if (research && isTest()) {
            showValue = visitorGermanText(f.value || "") + " (Vorschau · nicht freigegeben)";
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
        ["surah", "Sūrah"],
        ["event", "Ereignis"],
        ["speech", "Aussagen"],
        ["about", "Über ihn"]
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
        if (r.kind === "speech" || r.filter === "aussagen" || r.type === "directSpeech") kindLabel = "Aussage";
        else if (r.kind === "dua" || r.type === "dua") kindLabel = "Duʿāʾ";
        else if (r.event) kindLabel = "Ereignis";
        else kindLabel = "Stelle";
        var subBits = [kindLabel, r.event || ""].filter(Boolean);
        return (
          '<article class="prophets-quote prophets-quote--ref">' +
          '<div class="prophets-quote__head">' +
          '<p class="prophets-quote__title">' +
          esc(ref) +
          "</p>" +
          (subBits.length
            ? '<p class="prophets-quote__meta">' + esc(subBits.join(" · ")) + "</p>"
            : "") +
          "</div>" +
          (r.context ? '<p class="prophets-quote__de">' + esc(r.context) + "</p>" : "") +
          '<div class="prophets-link-row"><button type="button" class="prophets-link" data-quran-surah="' +
          esc(r.surah) +
          '" data-quran-ayah="' +
          esc(r.ayah) +
          '">Im Qurʾān öffnen ›</button></div>' +
          "</article>"
        );
      })
      .join("");

    return (
      '<section class="prophets-chapter prophets-chapter--quran"><h3>Qurʾān · ' +
      count +
      " Fundstellen</h3>" +
      '<div class="prophets-filters" role="toolbar" aria-label="Qurʾān-Filter">' +
      chips +
      "</div>" +
      '<div class="prophets-quote-list">' +
      (list || '<div class="prophets-empty">Keine Qurʾān-Stellen in diesem Filter.</div>') +
      "</div></section>"
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
              esc(fullGermanText(it)) +
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
              renderSourceActions(it) +
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
          var metaLine = [
            it.work,
            it.bookChapter,
            it.number || it.hadithNumber || (it.hadithId ? String(it.hadithId).replace(/^[a-z]+-/, "") : "")
          ]
            .filter(Boolean)
            .join(" · ");
          var rawi = it.sahabiRawi || it.rawi || "";
          return (
            '<article class="prophets-quote">' +
            '<span class="prophets-badge">' +
            esc(publicStatusLabel(it.grading || "sahih")) +
            "</span>" +
            (it.arabicOriginal
              ? '<p class="prophets-quote__ar" lang="ar" dir="rtl">' + esc(it.arabicOriginal) + "</p>"
              : "") +
            '<p class="prophets-quote__de">' +
            esc(fullGermanText(it)) +
            "</p>" +
            '<p class="prophets-quote__meta">' +
            esc(metaLine) +
            (rawi ? "<br>Rāwī: " + esc(rawi) : "") +
            "</p>" +
            renderSourceActions(it) +
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
        var nameHtml = esc(visitorGermanText(f.name));
        if (ok && linkId) {
          nameHtml =
            '<button type="button" class="prophets-inline-link" data-prophet-id="' +
            esc(linkId) +
            '">' +
            esc(visitorGermanText(f.name)) +
            "</button>";
        } else if (ok) {
          // best-effort cross-link by known names in index
          var hit = findProphetIdByName(f.name);
          if (hit && hit !== profile.id) {
            nameHtml =
              '<button type="button" class="prophets-inline-link" data-prophet-id="' +
              esc(hit) +
              '">' +
              esc(visitorGermanText(f.name)) +
              "</button>";
          }
        }
        var absNote = absenceVisitorNote(f.absenceStatus || f.nameStatus);
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
          esc(publicStatusLabel(f.nameStatus) || visitorGermanText(f.nameStatus) || "") +
          (!ok ? " · nicht als gesichert dargestellt" : "") +
          "</span>" +
          (absNote ? '<p class="prophets-note">' + esc(absNote) + "</p>" : "") +
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
      var aName = (a && a.name) || (rel.personADisplay && rel.personADisplay.name) || rel.personA;
      var bName = (b && b.name) || (rel.personBDisplay && rel.personBDisplay.name) || rel.personB;
      if (!aName || !bName) return;
      var relLabel =
        rel.relation === "brothers"
          ? "Brüder"
          : rel.relation === "mother_son"
            ? "Mutter → Sohn"
            : "Vater → Sohn";
      var aBtn = a
        ? '<button type="button" class="prophets-inline-link" data-prophet-id="' +
          esc(a.id) +
          '">' +
          esc(aName) +
          "</button>"
        : "<span>" + esc(aName) + "</span>";
      var bBtn = b
        ? '<button type="button" class="prophets-inline-link" data-prophet-id="' +
          esc(b.id) +
          '">' +
          esc(bName) +
          "</button>"
        : "<span>" + esc(bName) + "</span>";
      lines.push(
        '<div class="prophets-tree-line">' +
          aBtn +
          '<span class="prophets-tree-rel">' +
          esc(relLabel) +
          "</span>" +
          bBtn +
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
      { key: "athar", title: "Authentische Āthār", match: function (c) { return c.evidenceType === "athar"; } },
      { key: "early", title: "Frühe Quellen", match: function (c) {
          return c.evidenceType === "early" || /sīrah|ibn.?ish[āa]q|ṭabarī|tabari|ibn.?saʿd/i.test(String(c.source || ""));
        } },
      { key: "research", title: "Qualifizierte Einordnung", match: function (c) {
          return c.evidenceType === "editorial" || c.evidenceType === "research" || /isolation|not_established|research/i.test(String(c.category || c.id || ""));
        } }
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
        return (
          '<article class="prophets-quote" id="claim-' +
          esc(c.id) +
          '">' +
          '<span class="prophets-badge">' +
          esc(publicStatusLabel(c.grading || c.evidenceType || "")) +
          "</span>" +
          (c.arabicOriginal
            ? '<p class="prophets-quote__ar" lang="ar" dir="rtl">' + esc(c.arabicOriginal) + "</p>"
            : "") +
          '<p class="prophets-quote__de">' +
          esc(c.translationDe || c.claim || "") +
          "</p>" +
          (c.translationDe && c.claim && c.translationDe !== c.claim
            ? '<p class="prophets-quote__meta">' + esc(c.claim) + "</p>"
            : "") +
          '<p class="prophets-quote__meta">' +
          esc([c.source, c.reference || c.number, c.rawi || c.sahabiRawi].filter(Boolean).join(" · ")) +
          "</p>" +
          (c.directReference && String(c.directReference).indexOf("#quran-surah/") === 0
            ? '<button type="button" class="prophets-link" data-nav-hash="' +
              esc(c.directReference) +
              '">Direktnachweis</button>'
            : "") +
          renderSourceActions(c) +
          "</article>"
        );
      })
      .join("");

    var researchNote =
      '<details class="prophets-research-fold"><summary>Umstrittene Angaben (bewusst öffnen)</summary>' +
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
        : "<p>Keine zusätzlichen ungeprüften Einträge in diesem Profil.</p>") +
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

  function renderLoadingDetail(meta) {
    meta = meta || {};
    var mark = prophetMark(meta.id, meta);
    return (
      '<article class="prophets-detail prophets-detail--loading" data-prophet-detail="' +
      esc(meta.id || "") +
      '">' +
      '<header class="prophets-detail__head">' +
      '<div class="prophets-detail__head-top">' +
      '<span class="prophets-detail__emoji" aria-hidden="true">' +
      mark +
      "</span>" +
      '<h2 class="prophets-detail__name">' +
      esc(meta.name || "…") +
      "</h2>" +
      (meta.nameAr
        ? '<div class="prophets-detail__ar" lang="ar" dir="rtl">' + esc(meta.nameAr) + "</div>"
        : "") +
      "</div>" +
      '<p class="prophets-detail__sub">' +
      esc(meta.honorific || "عليه السلام") +
      "</p>" +
      "</header>" +
      '<div class="prophets-empty prophets-empty--inline">Wird geöffnet…</div>' +
      "</article>"
    );
  }

  function renderStubDetail(meta, opts) {
    opts = opts || {};
    if (!meta) return notFoundHtml();
    if (opts.loadFailed) {
      return visitorLoadErrorHtml({ offlineUncached: !isOnline() });
    }
    /* Kein Platzhalter-Marketingtext — direkt Profilkopf + Hinweis. */
    var mark = prophetMark(meta.id, meta);
    return (
      '<article class="prophets-detail">' +
      '<header class="prophets-detail__head">' +
      '<div class="prophets-detail__head-top">' +
      '<span class="prophets-detail__emoji" aria-hidden="true">' +
      mark +
      "</span>" +
      '<h2 class="prophets-detail__name">' +
      esc(meta.name) +
      "</h2>" +
      '<div class="prophets-detail__ar" lang="ar" dir="rtl">' +
      esc(meta.nameAr || "") +
      "</div>" +
      "</div>" +
      '<p class="prophets-detail__sub">' +
      esc([meta.honorific || "", rolesLabel(meta.roles || []), meta.people || ""].filter(Boolean).join(" · ")) +
      "</p>" +
      "</header>" +
      notFoundHtml() +
      "</article>"
    );
  }

  function findMeta(id) {
    if (!indexCache) return null;
    var all = (indexCache.prophets || []).concat(indexCache.disputed || []);
    return all.find(function (p) { return String(p.id) === String(id); }) || null;
  }

  function renderDetail(profile, section, state, meta) {
    if (profile && profile.__loading) {
      return renderLoadingDetail(meta || profile);
    }
    if (!profile) {
      var loadFailed =
        !!(meta && LAST_LOAD_ERROR && LAST_LOAD_ERROR.prophetId && String(LAST_LOAD_ERROR.prophetId) === String(meta.id));
      return renderStubDetail(meta || null, { loadFailed: loadFailed });
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
      '<span class="prophets-detail__emoji" aria-hidden="true">' +
      prophetMark(profile.id, profile) +
      "</span>" +
      '<h2 class="prophets-detail__name">' +
      esc(profile.name) +
      "</h2>" +
      '<div class="prophets-detail__ar" lang="ar" dir="rtl">' +
      esc(profile.nameAr) +
      "</div>" +
      "</div>" +
      '<p class="prophets-detail__sub">' +
      esc(
        [profile.honorific || "", rolesLabel(profile.roles || []), profile.people || ""]
          .filter(Boolean)
          .join(" · ")
      ) +
      "</p>" +
      banner +
      '<p class="prophets-detail__meta" aria-label="Quellenübersicht">' +
      "<span><b>" +
      qCount +
      "</b> Qurʾān</span><span class=\"prophets-detail__dot\" aria-hidden=\"true\">·</span>" +
      "<span><b>" +
      sunnahN +
      "</b> Sunnah</span><span class=\"prophets-detail__dot\" aria-hidden=\"true\">·</span>" +
      "<span><b>" +
      (stQ + stS) +
      "</b> Aussagen</span>" +
      "</p>" +
      "</header>" +
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
      return global.setPageHeader("Die Propheten", "الأنبياء", "");
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

    if (!indexCache) hydrateIndexFromSession();

    if (!indexCache) {
      loadIndex()
        .then(function () {
          if (isProphetenRoute()) {
            if (typeof global.render === "function") global.render();
          }
        })
        .catch(function () {
          if (isProphetenRoute()) {
            if (typeof global.render === "function") global.render();
          }
        });
      if (LAST_LOAD_ERROR && /index_/.test(String(LAST_LOAD_ERROR.errorType || ""))) {
        return header + '<div class="prophets-root">' + visitorLoadErrorHtml() + "</div>";
      }
      return (
        header +
        '<div class="prophets-root" data-prophets-loading="1">' +
        '<div class="prophets-empty prophets-empty--boot">Prophetenbibliothek wird geladen…</div>' +
        "</div>"
      );
    }

    if (!isFeatureEnabled(indexCache)) {
      return (
        header +
        '<div class="prophets-root"><div class="prophets-empty">Prophetenbibliothek ist in dieser Umgebung deaktiviert (production = disabled · Zero-Trust).</div></div>'
      );
    }

    if (parts.prophetId && !Object.prototype.hasOwnProperty.call(profileCache, parts.prophetId)) {
      loadProfile(parts.prophetId).then(function () {
        paintOpenProfile(parts.prophetId);
      });
    }

    var profile = null;
    if (parts.prophetId) {
      if (Object.prototype.hasOwnProperty.call(profileCache, parts.prophetId)) {
        profile = profileCache[parts.prophetId];
      } else {
        profile = Object.assign({ __loading: true, id: parts.prophetId }, findMeta(parts.prophetId) || {});
      }
    }
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

    root.querySelectorAll("[data-prophets-pick]").forEach(function (sel) {
      if (sel.dataset.bound) return;
      sel.dataset.bound = "1";
      sel.addEventListener("change", function () {
        var next = sel.value || "all";
        writeState({ filter: next, scrollY: window.scrollY || 0 });
        if (typeof global.render === "function") global.render();
      });
    });
    root.querySelectorAll("[data-prophets-jump]").forEach(function (sel) {
      if (sel.dataset.bound) return;
      sel.dataset.bound = "1";
      sel.addEventListener("change", function () {
        var id = sel.value || "";
        sel.value = "";
        if (!id) return;
        var meta = findMeta(id);
        writeLastRead({
          prophetId: id,
          name: meta && meta.name,
          honorific: meta && meta.honorific,
          tab: "overview",
          tabLabel: "Übersicht",
          at: Date.now()
        });
        writeState({ selectedId: id, section: "overview", scrollY: 0 });
        navigateProphets(id, "overview");
      });
    });
    /* Legacy chip buttons (falls Cache) */
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
      var warmId = btn.getAttribute("data-prophet-id");
      if (warmId) {
        btn.addEventListener(
          "pointerdown",
          function () {
            loadProfile(warmId).catch(function () {});
          },
          { passive: true }
        );
        btn.addEventListener(
          "mouseenter",
          function () {
            loadProfile(warmId).catch(function () {});
          },
          { passive: true }
        );
      }
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
        /* Laden starten BEVOR Hash wechselt — dann ist Cache oft schon da. */
        var openId = String(id || "");
        var ready = Object.prototype.hasOwnProperty.call(profileCache, openId);
        if (!ready) {
          loadProfile(openId)
            .then(function () {
              paintOpenProfile(openId);
            })
            .catch(function () {
              paintOpenProfile(openId);
            });
        }
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

    root.querySelectorAll("[data-prophets-source-toggle]").forEach(function (btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = "1";
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-prophets-source-toggle");
        var panel = id ? document.getElementById(id) : null;
        if (!panel) return;
        var open = panel.hasAttribute("hidden");
        if (open) panel.removeAttribute("hidden");
        else panel.setAttribute("hidden", "");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        btn.textContent = open ? "Quelle schließen" : "Quelle öffnen";
        if (open) {
          try {
            panel.scrollIntoView({ block: "nearest", behavior: "smooth" });
          } catch (e) {}
        }
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

  /** Alle freigegebenen Profile im Hintergrund vorladen — Klick öffnet dann sofort. */
  function warmPopularProfiles() {
    if (warmPopularProfiles._done) return;
    warmPopularProfiles._done = true;
    if (!indexCache) return;
    var established = (indexCache.prophets || []).filter(function (p) {
      return p && p.id && !isFurtherPerson(p);
    });
    var prefer = ["musa", "ibrahim", "isa", "nuh", "yusuf", "muhammad", "adam", "ismail"];
    var ordered = [];
    var seen = Object.create(null);
    prefer.forEach(function (id) {
      var hit = established.find(function (p) {
        return String(p.id) === id;
      });
      if (hit) {
        ordered.push(hit);
        seen[id] = 1;
      }
    });
    established.forEach(function (p) {
      if (!seen[String(p.id)]) ordered.push(p);
    });
    var i = 0;
    var inflight = 0;
    var maxParallel = 3;
    function pump() {
      while (inflight < maxParallel && i < ordered.length) {
        var p = ordered[i++];
        var pid = String(p.id);
        if (Object.prototype.hasOwnProperty.call(profileCache, pid)) continue;
        inflight++;
        loadProfile(pid)
          .catch(function () {})
          .then(function () {
            inflight--;
            pump();
          });
      }
    }
    /* Sofort starten — nicht erst nach Idle, sonst bleibt Erstklick leer. */
    setTimeout(pump, 120);
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
        if (!isProphetenRoute()) return;
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

  function precacheProphetsShell() {
    if (!("serviceWorker" in navigator)) return;
    var urls = isTest()
      ? [
          "/test/assets/prophets/prophets.js",
          "/test/assets/prophets/prophets.css",
          DATA_BASE + "index.json",
          DATA_BASE + "search-index.json"
        ]
      : [
          "/assets/prophets/prophets.js",
          "/assets/prophets/prophets.css",
          DATA_BASE + "index.json",
          DATA_BASE + "search-index.json"
        ];
    navigator.serviceWorker.ready
      .then(function (reg) {
        try {
          reg.active && reg.active.postMessage({ type: "PRECACHE", urls: urls });
        } catch (e) {}
      })
      .catch(function () {});
  }

  function precacheOpenedProfile(fileUrl) {
    if (!fileUrl) return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready
      .then(function (reg) {
        try {
          reg.active && reg.active.postMessage({ type: "PRECACHE", urls: [fileUrl] });
        } catch (e) {}
      })
      .catch(function () {});
  }

  function prefetch() {
    try {
      hydrateIndexFromSession();
    } catch (e) {}
    loadIndex()
      .then(function () {
        precacheProphetsShell();
        /* search-index erst bei Bedarf / idle — blockiert Open nicht */
        if (typeof requestIdleCallback === "function") {
          requestIdleCallback(function () { loadSearchIndex().catch(function () {}); }, { timeout: 2500 });
        } else {
          setTimeout(function () { loadSearchIndex().catch(function () {}); }, 400);
        }
      })
      .catch(function () {});
  }

  function bindGlobalWarm() {
    if (bindGlobalWarm._done) return;
    bindGlobalWarm._done = true;
    document.addEventListener(
      "pointerdown",
      function (ev) {
        var t = ev.target && ev.target.closest ? ev.target.closest('[data-nav="propheten"],.prophets-focus-teaser,.prophets-spotlight') : null;
        if (t) prefetch();
      },
      { passive: true, capture: true }
    );
  }

  global.DARProphets = {
    renderSpotlight: renderSpotlight,
    render: render,
    bind: bind,
    prefetch: prefetch,
    loadIndex: loadIndex,
    loadSearchIndex: loadSearchIndex,
    loadProfile: loadProfile,
    warm: prefetch,
    isEnabled: function () {
      if (!indexCache) hydrateIndexFromSession();
      if (!indexCache) return isTest();
      return isFeatureEnabled(indexCache);
    }
  };

  /* Sofort vorwärmen — Live + Test (nicht erst beim Öffnen). */
  try {
    hydrateIndexFromSession();
    bindGlobalWarm();
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(function () { prefetch(); }, { timeout: 600 });
    } else {
      setTimeout(function () { prefetch(); }, 0);
    }
  } catch (e) {}
})(window);
