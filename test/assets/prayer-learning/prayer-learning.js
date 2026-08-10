/**
 * DAR AL TAWḤĪD — Gebet erlernen (Test Phase 2)
 * Character lock: dar-prayer-male-v1 | dar-prayer-female-v1
 * No audio UI. No substitute figures. Fajr operable prototype.
 */
(function (global) {
  "use strict";

  var VIEW = "gebet-lernen";
  var STATE_KEY = "darPrayerLearningV1";
  var HINT_KEY = "darPrayerLearningSwipeHintV1";
  var ASSET_BASE = "/test/assets/prayer-learning/";
  var DATA_BASE = "/test/data/prayer-learning/";
  var AUDIO_ENABLED = false;
  var CHAR_MALE = "dar-prayer-male-v1";
  var CHAR_FEMALE = "dar-prayer-female-v1";
  var CHAR_VERSION = 1;

  var cache = { prayers: null, fajr: null, poses: { male: null, female: null } };
  var listenersBound = false;
  var missingAssets = [];
  var validationErrors = [];
  var sourceSheetOpen = false;
  var sourceSheetStepId = "";

  var STEP_ALIASES = {
    takbir: "takbirat-al-ihram",
    "takbirat-al-ihram": "takbirat-al-ihram",
    qiyam: "qiyam-1",
    ruku: "ruku-1",
    itidal: "itidal-1",
    "sujud-1": "sujud-1a",
    sujud: "sujud-1a",
    sitting: "jalsa-1",
    jalsa: "jalsa-1",
    "sujud-2": "sujud-1b",
    tashahhud: "tashahhud",
    taslim: "taslim-right",
    "taslim-right": "taslim-right",
    "taslim-left": "taslim-left"
  };

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function navigate(view, value) {
    if (typeof global.navigate === "function") global.navigate(view, value || "");
    else location.hash = value ? "#" + view + "/" + value : "#" + view;
  }

  function characterKey(state) {
    if (state && state.characterId === CHAR_FEMALE) return "female";
    if (state && state.character === "female") return "female";
    return "male";
  }

  function characterIdFromKey(key) {
    return key === "female" ? CHAR_FEMALE : CHAR_MALE;
  }

  function defaultState() {
    return {
      feature: "prayer-learning",
      character: "male",
      characterId: CHAR_MALE,
      viewMode: "swipe",
      prayer: "fajr",
      prayerId: "fajr",
      rakAh: 1,
      stepIndex: 0,
      stepId: "",
      scrollPosition: 0
    };
  }

  function normalizeState(raw) {
    var next = Object.assign(defaultState(), raw || {});
    if (next.characterId === CHAR_FEMALE || next.character === "female") {
      next.character = "female";
      next.characterId = CHAR_FEMALE;
    } else {
      next.character = "male";
      next.characterId = CHAR_MALE;
    }
    if (next.viewMode !== "scroll") next.viewMode = "swipe";
    next.feature = "prayer-learning";
    next.prayerId = next.prayerId || next.prayer || "fajr";
    next.prayer = next.prayerId;
    next.stepIndex = Math.max(0, Number(next.stepIndex) || 0);
    next.rakAh = Number(next.rakAh) || 1;
    return next;
  }

  function loadState() {
    try {
      if (typeof global.getJson === "function") {
        return normalizeState(global.getJson(STATE_KEY, {}) || {});
      }
      var raw = localStorage.getItem(STATE_KEY);
      if (!raw) return defaultState();
      return normalizeState(JSON.parse(raw) || {});
    } catch (e) {
      return defaultState();
    }
  }

  function saveState(patch) {
    var next = normalizeState(Object.assign(loadState(), patch || {}));
    try {
      if (typeof global.setJson === "function") global.setJson(STATE_KEY, next);
      else localStorage.setItem(STATE_KEY, JSON.stringify(next));
    } catch (e) {}
    return next;
  }

  function hintSeen() {
    try {
      return localStorage.getItem(HINT_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function markHintSeen() {
    try {
      localStorage.setItem(HINT_KEY, "1");
    } catch (e) {}
  }

  function parseValue(value) {
    var parts = String(value || "").split("/").filter(Boolean);
    return {
      prayer: parts[0] || "",
      mode:
        parts[0] === "stellung"
          ? "positions"
          : parts[0] === "gebet"
            ? "prayers"
            : parts[0]
              ? "learn"
              : "hub",
      rakAh: parts[1] ? Number(parts[1]) : null,
      stepKey: parts[2] || ""
    };
  }

  async function fetchJson(url) {
    var res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status + " " + url);
    return res.json();
  }

  async function ensureIndex() {
    if (cache.prayers) return cache.prayers;
    cache.prayers = await fetchJson(DATA_BASE + "prayers.json");
    return cache.prayers;
  }

  async function ensurePrayer(id) {
    if (id !== "fajr") return null;
    if (cache.fajr) return cache.fajr;
    cache.fajr = await fetchJson(DATA_BASE + "fajr.json");
    validatePrayerData(cache.fajr);
    return cache.fajr;
  }

  function validatePrayerData(prayer) {
    (prayer.steps || []).forEach(function (step) {
      if (step.verificationStatus === "approved" && !(step.sourceClaimIds && step.sourceClaimIds.length)) {
        validationErrors.push("approved step without sources: " + step.id);
        throw new Error("approved step without sources: " + step.id);
      }
    });
  }

  function validatePoseEntry(expectedCharacterId, poseId, entry) {
    if (!entry || typeof entry !== "object") return entry;
    if (entry.characterId && entry.characterId !== expectedCharacterId) {
      validationErrors.push("character mismatch pose=" + poseId + " got=" + entry.characterId);
      throw new Error("VALIDATION FAIL: pose " + poseId + " characterId mismatch");
    }
    if (entry.file && entry.characterId && entry.characterId !== expectedCharacterId) {
      throw new Error("VALIDATION FAIL: asset character lock");
    }
    return entry;
  }

  async function ensurePoses(character) {
    var key = character === "female" ? "female" : "male";
    var expected = characterIdFromKey(key);
    if (cache.poses[key]) return cache.poses[key];
    try {
      var data = await fetchJson(ASSET_BASE + "characters/" + key + "/poses/poses.json");
      if (data.characterId && data.characterId !== expected) {
        throw new Error("VALIDATION FAIL: poses.json characterId");
      }
      Object.keys(data.poses || {}).forEach(function (poseId) {
        validatePoseEntry(expected, poseId, data.poses[poseId]);
      });
      cache.poses[key] = data;
    } catch (e) {
      if (String(e.message || "").indexOf("VALIDATION FAIL") === 0) throw e;
      cache.poses[key] = { characterId: expected, characterVersion: CHAR_VERSION, poses: {} };
    }
    return cache.poses[key];
  }

  function sortedSteps(prayer) {
    return (prayer.steps || []).slice().sort(function (a, b) {
      return Number(a.order || 0) - Number(b.order || 0);
    });
  }

  function resolveStepKey(stepKey, rakAh) {
    var key = String(stepKey || "").toLowerCase();
    if (!key) return "";
    if (STEP_ALIASES[key]) {
      var aliased = STEP_ALIASES[key];
      if (Number(rakAh) === 2) {
        if (key === "qiyam") return "qiyam-2";
        if (key === "ruku") return "ruku-2";
        if (key === "itidal") return "itidal-2";
        if (key === "sujud" || key === "sujud-1") return "sujud-2a";
        if (key === "sujud-2") return "sujud-2b";
        if (key === "sitting" || key === "jalsa") return "jalsa-2";
      }
      return aliased;
    }
    return key;
  }

  function findStepIndex(steps, stepId, rakAh, stepKey) {
    if (stepId) {
      var byId = steps.findIndex(function (s) {
        return s.id === stepId;
      });
      if (byId >= 0) return byId;
    }
    var resolved = resolveStepKey(stepKey, rakAh);
    if (resolved) {
      var byResolved = steps.findIndex(function (s) {
        return s.id === resolved;
      });
      if (byResolved >= 0) return byResolved;
    }
    if (rakAh && stepKey) {
      var key = String(stepKey).toLowerCase();
      var byDeep = steps.findIndex(function (s) {
        return (
          Number(s.rakAh) === Number(rakAh) &&
          (s.malePose === key ||
            s.id === key ||
            String(s.id).indexOf(key) >= 0 ||
            String(s.malePose || "").indexOf(key) >= 0)
        );
      });
      if (byDeep >= 0) return byDeep;
    }
    return 0;
  }

  function poseMeta(posesMap, poseKey) {
    var entry = posesMap && posesMap.poses ? posesMap.poses[poseKey] : null;
    if (!entry) return null;
    var expected = posesMap.characterId;
    validatePoseEntry(expected, poseKey, entry);
    if (!entry.file) return null;
    var gender = expected === CHAR_FEMALE ? "female" : "male";
    return {
      characterId: expected,
      poseId: poseKey,
      asset: ASSET_BASE + "characters/" + gender + "/poses/" + entry.file,
      characterVersion: entry.characterVersion || posesMap.characterVersion || CHAR_VERSION
    };
  }

  function figurePlaceholder(character, poseKey, title) {
    var cid = characterIdFromKey(character);
    var pendingKey = cid + ":" + poseKey;
    if (missingAssets.indexOf(pendingKey) < 0) missingAssets.push(pendingKey);
    return (
      '<div class="prl-stage" aria-label="Lehrfigur">' +
      '<div class="prl-figure">' +
      '<div class="prl-figure-pending">' +
      "<b>" +
      esc(title || poseKey) +
      "</b>" +
      "<span>Pose noch nicht freigegeben</span>" +
      "<span>" +
      esc(cid) +
      " · " +
      esc(poseKey) +
      "</span>" +
      "<span>Keine Ersatzfigur – freigegebenes Master-Asset abwarten.</span>" +
      "</div></div>" +
      '<div class="prl-stage-floor" aria-hidden="true"></div></div>'
    );
  }

  async function figureHtmlResolved(character, step) {
    var poses = await ensurePoses(character);
    var poseKey = character === "female" ? step.femalePose : step.malePose;
    var meta = poseMeta(poses, poseKey);
    if (!meta || !meta.asset) return figurePlaceholder(character, poseKey, step.titleDe);
    return (
      '<div class="prl-stage" aria-label="Lehrfigur" data-prl-character-id="' +
      esc(meta.characterId) +
      '" data-prl-pose-id="' +
      esc(meta.poseId) +
      '">' +
      '<div class="prl-figure"><img src="' +
      esc(meta.asset) +
      '" alt="' +
      esc(step.titleDe) +
      '" loading="lazy" data-prl-pose-img></div>' +
      '<div class="prl-stage-floor" aria-hidden="true"></div></div>'
    );
  }

  function preloadPose(character, step) {
    if (!step) return;
    ensurePoses(character).then(function (poses) {
      var poseKey = character === "female" ? step.femalePose : step.malePose;
      var meta = null;
      try {
        meta = poseMeta(poses, poseKey);
      } catch (e) {
        return;
      }
      if (!meta || !meta.asset) return;
      var img = new Image();
      img.src = meta.asset;
    });
  }

  function controlsHtml(state, opts) {
    opts = opts || {};
    return (
      '<div class="prl-controls">' +
      '<div class="prl-controls-label">Für wen möchtest du die Darstellung sehen?</div>' +
      '<div class="prl-segment" role="group" aria-label="Männer oder Frauen">' +
      '<button type="button" data-prl-character="male" class="' +
      (state.character === "male" ? "is-active" : "") +
      '">Männer</button>' +
      '<button type="button" data-prl-character="female" class="' +
      (state.character === "female" ? "is-active" : "") +
      '">Frauen</button>' +
      "</div>" +
      '<div class="prl-controls-label">Wie möchtest du lernen?</div>' +
      '<div class="prl-segment" role="group" aria-label="Wischen oder Scrollen">' +
      '<button type="button" data-prl-view="swipe" class="' +
      (state.viewMode === "swipe" ? "is-active" : "") +
      '">Wischen</button>' +
      '<button type="button" data-prl-view="scroll" class="' +
      (state.viewMode === "scroll" ? "is-active" : "") +
      '">Scrollen</button>' +
      "</div>" +
      (opts.compact ? "" : "") +
      "</div>"
    );
  }

  function progressHtml(prayer, step, index, total) {
    var inR2 = Number(step.rakAh) === 2;
    return (
      '<div class="prl-progress">' +
      '<div class="prl-progress-title">' +
      esc(prayer.titleDe) +
      " · " +
      esc(String(prayer.rakat)) +
      " Rakʿāt</div>" +
      '<div class="prl-progress-rail" aria-hidden="true">' +
      "<span class=\"" +
      (inR2 ? "" : "is-active") +
      '">1. Rakʿah</span>' +
      '<span class="prl-progress-dots">' +
      (inR2 ? "○━━━━━━●" : "●━━━━━━○") +
      "</span>" +
      "<span class=\"" +
      (inR2 ? "is-active" : "") +
      '">2. Rakʿah</span>' +
      "</div>" +
      "<div>Schritt " +
      (index + 1) +
      " von " +
      total +
      "</div>" +
      "</div>"
    );
  }

  function approvedVariants(step) {
    return (step.variants || []).filter(function (v) {
      return v && v.verificationStatus === "approved" && v.sourceClaimIds && v.sourceClaimIds.length;
    });
  }

  function stepCopyHtml(step) {
    var blocks = "";
    if (step.instruction) {
      blocks +=
        '<div class="prl-block"><div class="prl-label">So führst du die Stellung aus</div><div class="prl-de">' +
        esc(step.instruction) +
        "</div></div>";
    } else {
      blocks +=
        '<div class="prl-block"><div class="prl-label">So führst du die Stellung aus</div><div class="prl-research">Quellengeprüfte Kurzanweisung folgt.</div></div>';
    }

    var hasSpeech = !!(step.recitation || step.transliteration || step.translationDe);
    if (hasSpeech) {
      blocks += '<div class="prl-block"><div class="prl-label">Was sage ich?</div>';
      if (step.recitation) blocks += '<div class="prl-ar-text">' + esc(step.recitation) + "</div>";
      if (step.transliteration) blocks += '<div class="prl-tr">' + esc(step.transliteration) + "</div>";
      if (step.translationDe) blocks += '<div class="prl-de">' + esc(step.translationDe) + "</div>";
      blocks += "</div>";
    }

    if (step.verificationStatus === "research") {
      blocks +=
        '<div class="prl-research">Technischer Prototyp · Status: research – keine ungeprüften Details als gesichert dargestellt.</div>';
    }

    blocks +=
      '<div class="prl-btn-row"><button type="button" class="prl-btn" data-prl-sources="' +
      esc(step.id) +
      '">Beleg ansehen</button></div>';

    var variants = approvedVariants(step);
    if (variants.length) {
      blocks +=
        '<div class="prl-variants"><div class="prl-label">Weitere authentische Varianten</div>' +
        variants
          .map(function (v) {
            return "<div>" + esc(v.titleDe || v.id || "Variante") + "</div>";
          })
          .join("") +
        "</div>";
    }

    if (step.detailSlots && step.detailSlots.length) {
      blocks +=
        '<div class="prl-detail-slots" aria-label="Detailansicht vorbereitet">' +
        step.detailSlots
          .map(function (slot) {
            return '<span class="prl-detail-slot" data-prl-detail="' + esc(slot) + '">' + esc(slot) + "</span>";
          })
          .join("") +
        "</div>";
    }

    if (AUDIO_ENABLED) {
      /* intentionally empty in v1/v2 — no speaker / play UI */
    }

    return (
      '<div class="prl-step-copy">' +
      '<div class="prl-kicker">' +
      esc(String(step.rakAh)) +
      ". Rakʿah</div>" +
      "<h3>" +
      esc(step.titleDe) +
      "</h3>" +
      '<p class="prl-step-ar">' +
      esc(step.titleAr || "") +
      "</p>" +
      blocks +
      "</div>"
    );
  }

  function rakahMarkerHtml(prevStep, nextStep) {
    if (!prevStep || !nextStep) return "";
    if (Number(prevStep.rakAh) === 1 && Number(nextStep.rakAh) === 2) {
      return (
        '<div class="prl-rakah-mark" data-prl-rakah-mark>' +
        "<b>2. Rakʿah</b>" +
        "<span>Fortfahren →</span>" +
        "</div>"
      );
    }
    return "";
  }

  function resumeCard(state, prayer) {
    if (!state.stepId || !prayer) return "";
    var steps = sortedSteps(prayer);
    var step = steps.find(function (s) {
      return s.id === state.stepId;
    });
    if (!step) return "";
    return (
      '<section class="prl-resume">' +
      "<b>Weiterlernen</b>" +
      '<div class="prl-resume-meta">' +
      esc(prayer.titleDe) +
      "<br>" +
      esc(String(step.rakAh)) +
      ". Rakʿah<br>" +
      esc(step.titleDe) +
      "</div>" +
      '<div class="prl-btn-row"><button type="button" class="prl-btn primary" data-prl-resume>Fortsetzen</button></div>' +
      "</section>"
    );
  }

  function hubHtml(state, index, fajr) {
    return (
      '<section class="prl-shell prl-shell--hub" data-prl-root="hub">' +
      '<header class="prl-hero prl-hero--compact">' +
      "<h2>Gebet erlernen</h2>" +
      '<p class="prl-ar">الصلاة</p>' +
      "<p>Schritt für Schritt sehen und lernen.</p>" +
      "</header>" +
      controlsHtml(state) +
      resumeCard(state, fajr) +
      '<div class="prl-paths">' +
      '<button type="button" class="prl-path" data-prl-go="fajr"><b>Gebet Schritt für Schritt</b><span>Fajr-Prototyp · 2 Rakʿāt · 19 Schritte</span></button>' +
      '<button type="button" class="prl-path" data-prl-go="gebet"><b>Ein bestimmtes Gebet</b><span>Fajr jetzt · weitere Gebete folgen</span></button>' +
      '<button type="button" class="prl-path" data-prl-go="stellung"><b>Eine Stellung nachsehen</b><span>Direkt zu Takbīr, Rukūʿ, Suǧūd und mehr</span></button>' +
      "</div>" +
      "</section>"
    );
  }

  function prayersHtml(state, index) {
    var cards = (index.prayers || [])
      .map(function (p) {
        var ready = p.status === "prototype" || p.status === "ready";
        return (
          '<button type="button" class="prl-prayer-card" data-prl-prayer="' +
          esc(p.id) +
          '"' +
          (ready ? "" : " disabled") +
          ">" +
          "<span><b>" +
          esc(p.titleDe) +
          '</b><div class="prl-ar">' +
          esc(p.titleAr || "") +
          "</div></span>" +
          '<span class="prl-badge">' +
          (ready ? p.rakat + " Rakʿāt" : "folgt") +
          "</span></button>"
        );
      })
      .join("");
    return (
      '<section class="prl-shell">' +
      '<header class="prl-hero prl-hero--compact"><h2>Ein bestimmtes Gebet</h2><p>Wähle das Gebet, das du lernen möchtest.</p></header>' +
      controlsHtml(state) +
      '<div class="prl-prayer-list">' +
      cards +
      "</div>" +
      '<div class="prl-btn-row"><button type="button" class="prl-btn" data-prl-go="">Zurück</button></div>' +
      "</section>"
    );
  }

  function positionsHtml(state, index) {
    var buttons = (index.quickPositions || [])
      .map(function (p) {
        return (
          '<button type="button" data-prl-position="' +
          esc(p.stepId) +
          '"><b>' +
          esc(p.titleDe) +
          "</b><span>" +
          esc(p.titleAr || "") +
          "</span></button>"
        );
      })
      .join("");
    return (
      '<section class="prl-shell">' +
      '<header class="prl-hero prl-hero--compact"><h2>Stellung nachsehen</h2><p>Springe direkt zur gewünschten Haltung in Fajr.</p></header>' +
      controlsHtml(state) +
      '<div class="prl-quick-grid">' +
      buttons +
      "</div>" +
      '<div class="prl-btn-row"><button type="button" class="prl-btn" data-prl-go="">Zurück</button></div>' +
      "</section>"
    );
  }

  function isDualLayout() {
    try {
      if (global.DarFold && typeof global.DarFold.isDual === "function") return !!global.DarFold.isDual();
    } catch (e) {}
    var w = Math.max(document.documentElement.clientWidth || 0, global.innerWidth || 0);
    var h = Math.max(document.documentElement.clientHeight || 0, global.innerHeight || 0);
    if (w < 700) return false;
    if (w >= h) return true;
    return w >= 900;
  }

  function swipeHintHtml() {
    if (hintSeen()) return "";
    return (
      '<div class="prl-swipe-hint" data-prl-swipe-hint role="status">' +
      "Wische nach links, um zum nächsten Schritt zu gelangen." +
      '<button type="button" data-prl-dismiss-hint aria-label="Hinweis schließen">×</button>' +
      "</div>"
    );
  }

  async function learnHtml(state, prayer, focusIndex) {
    var steps = sortedSteps(prayer);
    var idx = Math.max(0, Math.min(steps.length - 1, focusIndex | 0));
    var step = steps[idx];
    var dual = isDualLayout();
    var nav =
      '<div class="prl-nav">' +
      '<button type="button" class="prl-btn" data-prl-prev ' +
      (idx <= 0 ? "disabled" : "") +
      ">Zurück</button>" +
      '<button type="button" class="prl-btn primary" data-prl-next ' +
      (idx >= steps.length - 1 ? "disabled" : "") +
      ">Weiter</button>" +
      "</div>";

    preloadPose(state.character, step);
    preloadPose(state.character, steps[idx + 1]);

    if (state.viewMode === "scroll") {
      var items = "";
      for (var i = 0; i < steps.length; i++) {
        var s = steps[i];
        var fig = await figureHtmlResolved(state.character, s);
        if (i > 0) items += rakahMarkerHtml(steps[i - 1], s);
        items +=
          '<article class="prl-scroll-item" id="prl-step-' +
          esc(s.id) +
          '" data-prl-step-id="' +
          esc(s.id) +
          '" data-prl-step-index="' +
          i +
          '">' +
          progressHtml(prayer, s, i, steps.length) +
          fig +
          stepCopyHtml(s) +
          "</article>";
      }
      return (
        '<section class="prl-shell" data-prl-root="learn" data-prl-mode="scroll" data-prl-index="' +
        idx +
        '">' +
        controlsHtml(state, { compact: true }) +
        '<div class="prl-scroll-list">' +
        items +
        "</div>" +
        '<div class="prl-btn-row"><button type="button" class="prl-btn" data-prl-go="">Übersicht</button></div>' +
        sourceSheetShell() +
        "</section>"
      );
    }

    var slides = "";
    for (var j = 0; j < steps.length; j++) {
      var sj = steps[j];
      var figj = await figureHtmlResolved(state.character, sj);
      var mark = j > 0 ? rakahMarkerHtml(steps[j - 1], sj) : "";
      slides +=
        '<article class="prl-swipe-slide" data-prl-step-id="' +
        esc(sj.id) +
        '" data-prl-step-index="' +
        j +
        '">' +
        mark +
        (dual
          ? '<div class="prl-learn-layout is-dual">' +
            figj +
            "<div>" +
            progressHtml(prayer, sj, j, steps.length) +
            stepCopyHtml(sj) +
            "</div></div>"
          : progressHtml(prayer, sj, j, steps.length) + figj + stepCopyHtml(sj)) +
        "</article>";
    }

    return (
      '<section class="prl-shell" data-prl-root="learn" data-prl-mode="swipe" data-prl-index="' +
      idx +
      '">' +
      controlsHtml(state, { compact: true }) +
      swipeHintHtml() +
      '<div class="prl-swipe-track" data-prl-track>' +
      slides +
      "</div>" +
      nav +
      '<div class="prl-btn-row"><button type="button" class="prl-btn" data-prl-go="">Übersicht</button></div>' +
      sourceSheetShell() +
      "</section>"
    );
  }

  function sourceSheetShell() {
    return (
      '<div class="prl-sheet" id="prlSourceSheet" hidden>' +
      '<button type="button" class="prl-sheet-backdrop" data-prl-sheet-close aria-label="Schließen"></button>' +
      '<div class="prl-sheet-panel" role="dialog" aria-modal="true" aria-labelledby="prlSourceTitle">' +
      '<div class="prl-sheet-head"><h3 id="prlSourceTitle">Quelle</h3>' +
      '<button type="button" class="prl-btn" data-prl-sheet-close aria-label="Schließen">×</button></div>' +
      '<div class="prl-sheet-body" id="prlSourceBody"></div>' +
      "</div></div>"
    );
  }

  function openSourceSheet(step) {
    var sheet = document.getElementById("prlSourceSheet");
    var body = document.getElementById("prlSourceBody");
    if (!sheet || !body || !step) return;
    var claims = step.sourceClaimIds || [];
    if (!claims.length) {
      body.innerHTML =
        '<p class="prl-research">Noch keine geprüfte Quelle hinterlegt.<br>Status: ' +
        esc(step.verificationStatus || "research") +
        "</p>" +
        "<p>Werk · Fundstelle · Authentizitätsstatus folgen nach Quellenprüfung.</p>";
    } else {
      body.innerHTML =
        "<p><b>Quellen-IDs</b></p><ul>" +
        claims
          .map(function (id) {
            return "<li>" + esc(id) + "</li>";
          })
          .join("") +
        "</ul>" +
        '<button type="button" class="prl-btn primary" data-prl-sheet-close>Direktnachweis folgt</button>';
    }
    sheet.hidden = false;
    sourceSheetOpen = true;
    sourceSheetStepId = step.id;
    try {
      history.pushState({ prlSource: step.id }, "", location.href);
    } catch (e) {}
  }

  function closeSourceSheet(fromPop) {
    var sheet = document.getElementById("prlSourceSheet");
    if (sheet) sheet.hidden = true;
    var wasOpen = sourceSheetOpen;
    sourceSheetOpen = false;
    sourceSheetStepId = "";
    if (wasOpen && !fromPop) {
      try {
        if (history.state && history.state.prlSource) history.back();
      } catch (e) {}
    }
  }

  function headerFor(parsed) {
    if (typeof global.setPageHeader !== "function") return "";
    if (parsed.mode === "hub") return global.setPageHeader("Gebet erlernen", "Schritt für Schritt sehen und lernen.", "Lernen");
    if (parsed.mode === "prayers") return global.setPageHeader("Gebete", "Ein bestimmtes Gebet wählen", "Gebet erlernen");
    if (parsed.mode === "positions") return global.setPageHeader("Stellungen", "Direkt nachschlagen", "Gebet erlernen");
    return global.setPageHeader("Fajr", "صلاة الفجر · 2 Rakʿāt", "Gebet erlernen");
  }

  function deepLinkForStep(prayerId, step) {
    var pose = String(step.malePose || step.id || "step");
    if (step.id === "sujud-1a" || step.id === "sujud-2a") pose = "sujud-1";
    if (step.id === "sujud-1b" || step.id === "sujud-2b") pose = "sujud-2";
    if (step.id === "jalsa-1" || step.id === "jalsa-2") pose = "sitting";
    if (step.id === "taslim-right") pose = "taslim";
    if (step.id === "takbirat-al-ihram") pose = "takbir";
    return prayerId + "/" + step.rakAh + "/" + pose;
  }

  function syncHashToStep(prayerId, step, replace) {
    var value = deepLinkForStep(prayerId, step);
    var hash = "#" + VIEW + "/" + value;
    try {
      if (replace) history.replaceState(null, "", location.pathname + (location.search || "") + hash);
      else if ((location.hash || "") !== hash) navigate(VIEW, value);
    } catch (e) {
      location.hash = hash;
    }
  }

  async function render(value) {
    missingAssets = [];
    validationErrors = [];
    var state = loadState();
    var parsed = parseValue(value);
    if (parsed.prayer === "stellung" || parsed.mode === "positions") parsed.mode = "positions";
    else if (parsed.prayer === "gebet" || parsed.mode === "prayers") parsed.mode = "prayers";
    else if (parsed.prayer) {
      parsed.mode = "learn";
      state = saveState({ prayer: parsed.prayer, prayerId: parsed.prayer });
    }

    var index = await ensureIndex();
    var fajr = await ensurePrayer("fajr");
    var html = headerFor(parsed);

    if (parsed.mode === "prayers") html += prayersHtml(state, index);
    else if (parsed.mode === "positions") html += positionsHtml(state, index);
    else if (parsed.mode === "learn") {
      var prayer = await ensurePrayer(parsed.prayer || state.prayerId || "fajr");
      if (!prayer) {
        html +=
          '<section class="prl-shell"><div class="prl-research">Dieses Gebet ist noch nicht freigeschaltet.</div><div class="prl-btn-row"><button type="button" class="prl-btn" data-prl-go="">Zurück</button></div></section>';
      } else {
        var steps = sortedSteps(prayer);
        var focus = 0;
        if (parsed.stepKey || parsed.rakAh) {
          focus = findStepIndex(steps, "", parsed.rakAh || 1, parsed.stepKey || "");
        } else if (state.stepId && state.prayerId === prayer.id) {
          focus = findStepIndex(steps, state.stepId);
        }
        var step = steps[focus] || steps[0];
        state = saveState({
          prayer: prayer.id,
          prayerId: prayer.id,
          rakAh: step.rakAh,
          stepId: step.id,
          stepIndex: focus
        });
        html += await learnHtml(state, prayer, focus);
      }
    } else {
      html += hubHtml(state, index, fajr);
    }

    return html;
  }

  function currentLearnContext() {
    var root = document.querySelector("[data-prl-root='learn']");
    if (!root) return null;
    return { root: root, state: loadState(), mode: root.getAttribute("data-prl-mode") };
  }

  function updateNavButtons(root, idx, total) {
    var prev = root.querySelector("[data-prl-prev]");
    var next = root.querySelector("[data-prl-next]");
    if (prev) prev.disabled = idx <= 0;
    if (next) next.disabled = idx >= total - 1;
  }

  async function jumpToIndex(nextIndex, opts) {
    opts = opts || {};
    var prayer = await ensurePrayer(loadState().prayerId || "fajr");
    if (!prayer) return;
    var steps = sortedSteps(prayer);
    var idx = Math.max(0, Math.min(steps.length - 1, nextIndex));
    var step = steps[idx];
    saveState({
      prayer: prayer.id,
      prayerId: prayer.id,
      rakAh: step.rakAh,
      stepId: step.id,
      stepIndex: idx,
      scrollPosition: 0
    });
    markHintSeen();
    preloadPose(loadState().character, steps[idx + 1]);

    if (opts.rerender) {
      syncHashToStep(prayer.id, step, false);
      if (typeof global.render === "function") global.render();
      return;
    }
    var ctx = currentLearnContext();
    if (!ctx) {
      syncHashToStep(prayer.id, step, false);
      if (typeof global.render === "function") global.render();
      return;
    }
    if (ctx.mode === "swipe") {
      var track = ctx.root.querySelector("[data-prl-track]");
      var slide = ctx.root.querySelector('[data-prl-step-index="' + idx + '"]');
      if (track && slide) track.scrollTo({ left: slide.offsetLeft, behavior: opts.instant ? "auto" : "smooth" });
      ctx.root.setAttribute("data-prl-index", String(idx));
      syncHashToStep(prayer.id, step, true);
      updateNavButtons(ctx.root, idx, steps.length);
    } else {
      var el = document.getElementById("prl-step-" + step.id);
      if (el) el.scrollIntoView({ behavior: opts.instant ? "auto" : "smooth", block: "start" });
      syncHashToStep(prayer.id, step, true);
    }
  }

  function bindSwipeTrack(root) {
    var track = root.querySelector("[data-prl-track]");
    if (!track || track.dataset.bound === "1") return;
    track.dataset.bound = "1";
    var timer = 0;
    track.addEventListener(
      "scroll",
      function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
          var slides = [].slice.call(track.querySelectorAll(".prl-swipe-slide"));
          if (!slides.length) return;
          var left = track.scrollLeft;
          var best = 0;
          var bestDist = Infinity;
          slides.forEach(function (slide, i) {
            var d = Math.abs(slide.offsetLeft - left);
            if (d < bestDist) {
              bestDist = d;
              best = i;
            }
          });
          markHintSeen();
          var hint = document.querySelector("[data-prl-swipe-hint]");
          if (hint) hint.remove();
          ensurePrayer(loadState().prayerId || "fajr").then(function (prayer) {
            if (!prayer) return;
            var steps = sortedSteps(prayer);
            var step = steps[best];
            if (!step) return;
            saveState({
              stepId: step.id,
              rakAh: step.rakAh,
              stepIndex: best,
              prayerId: prayer.id,
              prayer: prayer.id
            });
            root.setAttribute("data-prl-index", String(best));
            syncHashToStep(prayer.id, step, true);
            updateNavButtons(root, best, steps.length);
            preloadPose(loadState().character, steps[best + 1]);
          });
        }, 80);
      },
      { passive: true }
    );
  }

  function restoreLearnPosition(root) {
    var state = loadState();
    ensurePrayer(state.prayerId || "fajr").then(function (prayer) {
      if (!prayer) return;
      var steps = sortedSteps(prayer);
      var idx = findStepIndex(steps, state.stepId);
      if (state.stepIndex >= 0 && steps[state.stepIndex] && steps[state.stepIndex].id === state.stepId) {
        idx = state.stepIndex;
      }
      saveState({ stepIndex: idx, rakAh: (steps[idx] || {}).rakAh || 1, stepId: (steps[idx] || {}).id || "" });
      if (root.getAttribute("data-prl-mode") === "swipe") {
        var track = root.querySelector("[data-prl-track]");
        var slide = root.querySelector('[data-prl-step-index="' + idx + '"]');
        if (track && slide) track.scrollTo({ left: slide.offsetLeft, behavior: "auto" });
        updateNavButtons(root, idx, steps.length);
        bindSwipeTrack(root);
      } else {
        var el = document.getElementById("prl-step-" + (steps[idx] && steps[idx].id));
        if (el) {
          requestAnimationFrame(function () {
            el.scrollIntoView({ behavior: "auto", block: "start" });
          });
        }
      }
      preloadPose(state.character, steps[idx]);
      preloadPose(state.character, steps[idx + 1]);
    });
  }

  function afterRender() {
    var root = document.querySelector("[data-prl-root]");
    if (!root) return;
    if (root.getAttribute("data-prl-root") === "learn") restoreLearnPosition(root);
  }

  function onClick(ev) {
    var t = ev.target;
    if (!t || !t.closest) return;

    if (t.closest("[data-prl-sheet-close]")) {
      closeSourceSheet(false);
      return;
    }
    if (t.closest("[data-prl-dismiss-hint]")) {
      markHintSeen();
      var h = document.querySelector("[data-prl-swipe-hint]");
      if (h) h.remove();
      return;
    }

    var sourcesBtn = t.closest("[data-prl-sources]");
    if (sourcesBtn) {
      var sid = sourcesBtn.getAttribute("data-prl-sources");
      ensurePrayer(loadState().prayerId || "fajr").then(function (prayer) {
        if (!prayer) return;
        var step = sortedSteps(prayer).find(function (s) {
          return s.id === sid;
        });
        openSourceSheet(step || { id: sid, verificationStatus: "research", sourceClaimIds: [] });
      });
      return;
    }

    var characterBtn = t.closest("[data-prl-character]");
    if (characterBtn) {
      var gender = characterBtn.getAttribute("data-prl-character") === "female" ? "female" : "male";
      var st = loadState();
      saveState({
        character: gender,
        characterId: characterIdFromKey(gender),
        stepId: st.stepId,
        stepIndex: st.stepIndex,
        rakAh: st.rakAh,
        prayerId: st.prayerId
      });
      if (typeof global.render === "function") global.render();
      return;
    }

    var viewBtn = t.closest("[data-prl-view]");
    if (viewBtn) {
      var mode = viewBtn.getAttribute("data-prl-view") === "scroll" ? "scroll" : "swipe";
      var st2 = loadState();
      saveState({
        viewMode: mode,
        stepId: st2.stepId,
        stepIndex: st2.stepIndex,
        rakAh: st2.rakAh,
        prayerId: st2.prayerId
      });
      if (typeof global.render === "function") global.render();
      return;
    }

    var go = t.closest("[data-prl-go]");
    if (go) {
      navigate(VIEW, go.getAttribute("data-prl-go") || "");
      return;
    }

    var resume = t.closest("[data-prl-resume]");
    if (resume) {
      var st3 = loadState();
      ensurePrayer(st3.prayerId || "fajr").then(function (prayer) {
        if (!prayer) return;
        var steps = sortedSteps(prayer);
        var step = steps.find(function (s) {
          return s.id === st3.stepId;
        }) || steps[0];
        navigate(VIEW, deepLinkForStep(prayer.id, step));
      });
      return;
    }

    var prayerBtn = t.closest("[data-prl-prayer]");
    if (prayerBtn && !prayerBtn.disabled) {
      navigate(VIEW, prayerBtn.getAttribute("data-prl-prayer"));
      return;
    }

    var posBtn = t.closest("[data-prl-position]");
    if (posBtn) {
      var stepId = posBtn.getAttribute("data-prl-position");
      ensurePrayer("fajr").then(function (prayer) {
        var steps = sortedSteps(prayer);
        var step =
          steps.find(function (s) {
            return s.id === stepId || s.malePose === stepId || String(s.id).indexOf(stepId) >= 0;
          }) || steps[0];
        saveState({ prayer: "fajr", prayerId: "fajr", stepId: step.id, rakAh: step.rakAh, stepIndex: steps.indexOf(step) });
        navigate(VIEW, deepLinkForStep("fajr", step));
      });
      return;
    }

    var prev = t.closest("[data-prl-prev]");
    if (prev) {
      var root = document.querySelector("[data-prl-root='learn']");
      var idx = Number((root && root.getAttribute("data-prl-index")) || 0);
      jumpToIndex(idx - 1);
      return;
    }
    var next = t.closest("[data-prl-next]");
    if (next) {
      var root2 = document.querySelector("[data-prl-root='learn']");
      var idx2 = Number((root2 && root2.getAttribute("data-prl-index")) || 0);
      jumpToIndex(idx2 + 1);
    }
  }

  function onPopState() {
    if (sourceSheetOpen) {
      closeSourceSheet(true);
    }
  }

  if (!listenersBound) {
    listenersBound = true;
    document.addEventListener("click", onClick);
    global.addEventListener("popstate", onPopState);
  }

  global.DARPrayerLearning = {
    VIEW: VIEW,
    render: render,
    afterRender: afterRender,
    loadState: loadState,
    saveState: saveState,
    characterIds: { male: CHAR_MALE, female: CHAR_FEMALE },
    audioEnabled: AUDIO_ENABLED,
    missingAssets: function () {
      return missingAssets.slice();
    },
    validationErrors: function () {
      return validationErrors.slice();
    },
    report: function () {
      return {
        feature: "Gebet erlernen",
        phase: 2,
        environment: "test",
        audioVisible: false,
        wrongCharacterAssets: 0,
        unexpectedCharacterAssets: 0,
        productionChanged: false,
        characterLock: { male: CHAR_MALE, female: CHAR_FEMALE },
        missingPoseAssets: missingAssets.slice(),
        validationErrors: validationErrors.slice()
      };
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
