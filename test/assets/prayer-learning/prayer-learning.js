/**
 * DAR AL TAWḤĪD — Gebet erlernen (Test Phase 1)
 * Character lock: dar-prayer-male-v1 | dar-prayer-female-v1
 * No audio UI. No substitute figures. Fajr engine prototype.
 */
(function (global) {
  "use strict";

  var VIEW = "gebet-lernen";
  var STATE_KEY = "darPrayerLearningV1";
  var ASSET_BASE = "/test/assets/prayer-learning/";
  var DATA_BASE = "/test/data/prayer-learning/";
  var AUDIO_ENABLED = false;
  var CHAR_MALE = "dar-prayer-male-v1";
  var CHAR_FEMALE = "dar-prayer-female-v1";

  var cache = { prayers: null, fajr: null, poses: { male: null, female: null } };
  var swipeBound = false;
  var missingAssets = [];

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

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
        try { return decodeURIComponent(p || ""); } catch (e2) { return p || ""; }
      });
      return { view: String(segs[0] || "").toLowerCase(), value: segs.slice(1).join("/") };
    } catch (e3) {
      return { view: "", value: "" };
    }
  }

  function navigate(view, value) {
    if (typeof global.navigate === "function") global.navigate(view, value || "");
    else location.hash = value ? "#" + view + "/" + value : "#" + view;
  }

  function defaultState() {
    return {
      character: "male",
      viewMode: "swipe",
      prayer: "fajr",
      rakAh: 1,
      stepId: "",
      scrollPosition: 0
    };
  }

  function loadState() {
    var base = defaultState();
    try {
      if (typeof global.getJson === "function") {
        return Object.assign(base, global.getJson(STATE_KEY, {}) || {});
      }
      var raw = localStorage.getItem(STATE_KEY);
      if (!raw) return base;
      return Object.assign(base, JSON.parse(raw) || {});
    } catch (e) {
      return base;
    }
  }

  function saveState(patch) {
    var next = Object.assign(loadState(), patch || {});
    if (next.character !== "female") next.character = "male";
    if (next.viewMode !== "scroll") next.viewMode = "swipe";
    try {
      if (typeof global.setJson === "function") global.setJson(STATE_KEY, next);
      else localStorage.setItem(STATE_KEY, JSON.stringify(next));
    } catch (e) {}
    return next;
  }

  function parseValue(value) {
    var parts = String(value || "").split("/").filter(Boolean);
    return {
      prayer: parts[0] || "",
      mode: parts[0] === "stellung" ? "positions" : parts[0] === "gebet" ? "prayers" : parts[0] ? "learn" : "hub",
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
        throw new Error("approved step without sources: " + step.id);
      }
    });
  }

  async function ensurePoses(character) {
    var key = character === "female" ? "female" : "male";
    if (cache.poses[key]) return cache.poses[key];
    try {
      cache.poses[key] = await fetchJson(ASSET_BASE + "characters/" + key + "/poses/poses.json");
    } catch (e) {
      cache.poses[key] = { characterId: key === "female" ? CHAR_FEMALE : CHAR_MALE, poses: {} };
    }
    return cache.poses[key];
  }

  function sortedSteps(prayer) {
    return (prayer.steps || []).slice().sort(function (a, b) {
      return Number(a.order || 0) - Number(b.order || 0);
    });
  }

  function findStepIndex(steps, stepId, rakAh, stepKey) {
    if (stepId) {
      var byId = steps.findIndex(function (s) { return s.id === stepId; });
      if (byId >= 0) return byId;
    }
    if (rakAh && stepKey) {
      var byDeep = steps.findIndex(function (s) {
        return Number(s.rakAh) === Number(rakAh) && String(s.malePose || s.id).indexOf(stepKey) >= 0;
      });
      if (byDeep >= 0) return byDeep;
      var byPose = steps.findIndex(function (s) {
        return Number(s.rakAh) === Number(rakAh) && (s.malePose === stepKey || s.id === stepKey || String(s.id).indexOf(stepKey) >= 0);
      });
      if (byPose >= 0) return byPose;
    }
    return 0;
  }

  function characterId(character) {
    return character === "female" ? CHAR_FEMALE : CHAR_MALE;
  }

  function poseFile(posesMap, poseKey) {
    var entry = posesMap && posesMap.poses ? posesMap.poses[poseKey] : null;
    if (!entry || !entry.file) return null;
    return ASSET_BASE + "characters/" + (posesMap.characterId === CHAR_FEMALE ? "female" : "male") + "/poses/" + entry.file;
  }

  function figureHtml(character, poseKey, title) {
    var cid = characterId(character);
    var pendingKey = cid + ":" + poseKey;
    if (missingAssets.indexOf(pendingKey) < 0) missingAssets.push(pendingKey);
    return (
      '<div class="prl-stage" aria-label="Lehrfigur">' +
        '<div class="prl-figure">' +
          '<div class="prl-figure-pending">' +
            "<b>" + esc(title || poseKey) + "</b>" +
            "<span>Pose-Asset ausstehend<br>" + esc(cid) + " · " + esc(poseKey) + "</span>" +
            "<span>Keine Ersatzfigur – freigegebenes Master-Asset abwarten.</span>" +
          "</div>" +
        "</div>" +
        '<div class="prl-stage-floor" aria-hidden="true"></div>' +
      "</div>"
    );
  }

  async function figureHtmlResolved(character, step) {
    var poses = await ensurePoses(character);
    var poseKey = character === "female" ? step.femalePose : step.malePose;
    var file = poseFile(poses, poseKey);
    if (!file) return figureHtml(character, poseKey, step.titleDe);
    return (
      '<div class="prl-stage" aria-label="Lehrfigur">' +
        '<div class="prl-figure"><img src="' + esc(file) + '" alt="' + esc(step.titleDe) + '" loading="lazy"></div>' +
        '<div class="prl-stage-floor" aria-hidden="true"></div>' +
      "</div>"
    );
  }

  function controlsHtml(state) {
    return (
      '<div class="prl-controls">' +
        '<div class="prl-controls-label">Darstellung</div>' +
        '<div class="prl-segment" role="group" aria-label="Männer oder Frauen">' +
          '<button type="button" data-prl-character="male" class="' + (state.character === "male" ? "is-active" : "") + '">Männer</button>' +
          '<button type="button" data-prl-character="female" class="' + (state.character === "female" ? "is-active" : "") + '">Frauen</button>' +
        "</div>" +
        '<div class="prl-controls-label">Ansicht</div>' +
        '<div class="prl-segment" role="group" aria-label="Wischen oder Scrollen">' +
          '<button type="button" data-prl-view="swipe" class="' + (state.viewMode === "swipe" ? "is-active" : "") + '">Wischen</button>' +
          '<button type="button" data-prl-view="scroll" class="' + (state.viewMode === "scroll" ? "is-active" : "") + '">Scrollen</button>' +
        "</div>" +
      "</div>"
    );
  }

  function progressHtml(prayer, step, index, total) {
    var pct = total ? Math.round(((index + 1) / total) * 100) : 0;
    return (
      '<div class="prl-progress">' +
        '<div class="prl-progress-title">' + esc(prayer.titleDe) + " · " + esc(String(prayer.rakat)) + " Rakʿāt</div>" +
        '<div class="prl-progress-rail"><span' + (Number(step.rakAh) === 1 ? ' style="font-weight:800"' : "") + '>1. Rakʿah</span><span' + (Number(step.rakAh) === 2 ? ' style="font-weight:800"' : "") + '>2. Rakʿah</span></div>' +
        '<div class="prl-progress-bar"><span style="width:' + pct + '%"></span></div>' +
        "<div>Schritt " + (index + 1) + " von " + total + "</div>" +
      "</div>"
    );
  }

  function stepCopyHtml(step) {
    var hasText = step.instruction || step.recitation || step.transliteration || step.translationDe;
    var blocks = "";
    if (step.instruction) {
      blocks += '<div class="prl-block"><div class="prl-label">So führst du die Stellung aus</div><div class="prl-de">' + esc(step.instruction) + "</div></div>";
    }
    if (step.recitation || step.transliteration || step.translationDe) {
      blocks += '<div class="prl-block"><div class="prl-label">Was sage ich?</div>';
      if (step.recitation) blocks += '<div class="prl-ar-text">' + esc(step.recitation) + "</div>";
      if (step.transliteration) blocks += '<div class="prl-tr">' + esc(step.transliteration) + "</div>";
      if (step.translationDe) blocks += '<div class="prl-de">' + esc(step.translationDe) + "</div>";
      blocks += "</div>";
    }
    if (!hasText) {
      blocks += '<div class="prl-research">Quellengeprüfter Inhalt folgt. Status: research – keine ungeprüften Details als gesichert dargestellt.</div>';
    } else if (step.verificationStatus === "research") {
      blocks += '<div class="prl-research">Verifikation: research</div>';
    }
    if (step.sourceClaimIds && step.sourceClaimIds.length) {
      blocks += '<div class="prl-btn-row"><button type="button" class="prl-btn" data-prl-sources="' + esc(step.id) + '">Beleg ansehen</button></div>';
    }
    if (step.detailSlots && step.detailSlots.length) {
      blocks +=
        '<div class="prl-detail-slots" aria-label="Detailansicht vorbereitet">' +
        step.detailSlots.map(function (slot) {
          return '<span class="prl-detail-slot" data-prl-detail="' + esc(slot) + '">' + esc(slot) + "</span>";
        }).join("") +
        "</div>";
    }
    if (AUDIO_ENABLED) {
      /* intentionally empty in v1 — no speaker / play UI */
    }
    return (
      '<div class="prl-step-copy">' +
        '<div class="prl-kicker">' + esc(String(step.rakAh)) + ". Rakʿah</div>" +
        "<h3>" + esc(step.titleDe) + "</h3>" +
        '<p class="prl-step-ar">' + esc(step.titleAr || "") + "</p>" +
        blocks +
      "</div>"
    );
  }

  function resumeCard(state, prayer) {
    if (!state.stepId || !prayer) return "";
    var steps = sortedSteps(prayer);
    var step = steps.find(function (s) { return s.id === state.stepId; });
    if (!step) return "";
    return (
      '<section class="prl-resume">' +
        "<b>Weiterlernen</b>" +
        '<div class="prl-resume-meta">' + esc(prayer.titleDe) + "<br>" + esc(String(step.rakAh)) + ". Rakʿah<br>" + esc(step.titleDe) + "</div>" +
        '<div class="prl-btn-row"><button type="button" class="prl-btn primary" data-prl-resume>Fortsetzen</button></div>' +
      "</section>"
    );
  }

  function hubHtml(state, index, fajr) {
    return (
      '<section class="prl-shell" data-prl-root="hub">' +
        '<header class="prl-hero">' +
          "<h2>Gebet erlernen</h2>" +
          '<p class="prl-ar">الصلاة</p>' +
          "<p>Schritt für Schritt sehen und lernen.</p>" +
        "</header>" +
        controlsHtml(state) +
        resumeCard(state, fajr) +
        '<div class="prl-paths">' +
          '<button type="button" class="prl-path" data-prl-go="fajr"><b>1. Gebet Schritt für Schritt</b><span>Fajr als vollständiger Prototyp · 2 Rakʿāt</span></button>' +
          '<button type="button" class="prl-path" data-prl-go="gebet"><b>2. Ein bestimmtes Gebet</b><span>Fajr jetzt · weitere Gebete folgen</span></button>' +
          '<button type="button" class="prl-path" data-prl-go="stellung"><b>3. Eine Stellung nachsehen</b><span>Direkt zu Takbīr, Rukūʿ, Suǧūd und mehr</span></button>' +
        "</div>" +
      "</section>"
    );
  }

  function prayersHtml(state, index) {
    var cards = (index.prayers || []).map(function (p) {
      var ready = p.status === "prototype" || p.status === "ready";
      return (
        '<button type="button" class="prl-prayer-card" data-prl-prayer="' + esc(p.id) + '"' + (ready ? "" : " disabled") + ">" +
          "<span><b>" + esc(p.titleDe) + "</b><div class=\"prl-ar\">" + esc(p.titleAr || "") + "</div></span>" +
          '<span class="prl-badge">' + (ready ? p.rakat + " Rakʿāt" : "folgt") + "</span>" +
        "</button>"
      );
    }).join("");
    return (
      '<section class="prl-shell">' +
        '<header class="prl-hero"><h2>Ein bestimmtes Gebet</h2><p>Wähle das Gebet, das du lernen möchtest.</p></header>' +
        controlsHtml(state) +
        '<div class="prl-prayer-list">' + cards + "</div>" +
        '<div class="prl-btn-row"><button type="button" class="prl-btn" data-prl-go="">Zurück</button></div>' +
      "</section>"
    );
  }

  function positionsHtml(state, index) {
    var buttons = (index.quickPositions || []).map(function (p) {
      return (
        '<button type="button" data-prl-position="' + esc(p.stepId) + '">' +
          "<b>" + esc(p.titleDe) + "</b><span>" + esc(p.titleAr || "") + "</span>" +
        "</button>"
      );
    }).join("");
    return (
      '<section class="prl-shell">' +
        '<header class="prl-hero"><h2>Stellung nachsehen</h2><p>Springe direkt zur gewünschten Haltung in Fajr.</p></header>' +
        controlsHtml(state) +
        '<div class="prl-quick-grid">' + buttons + "</div>" +
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

  async function learnHtml(state, prayer, focusIndex) {
    var steps = sortedSteps(prayer);
    var idx = Math.max(0, Math.min(steps.length - 1, focusIndex | 0));
    var step = steps[idx];
    var dual = isDualLayout();
    var figure = await figureHtmlResolved(state.character, step);
    var copy = stepCopyHtml(step);
    var progress = progressHtml(prayer, step, idx, steps.length);
    var nav =
      '<div class="prl-nav">' +
        '<button type="button" class="prl-btn" data-prl-prev ' + (idx <= 0 ? "disabled" : "") + ">Zurück</button>" +
        '<button type="button" class="prl-btn primary" data-prl-next ' + (idx >= steps.length - 1 ? "disabled" : "") + ">Weiter</button>" +
      "</div>";

    if (state.viewMode === "scroll") {
      var items = "";
      for (var i = 0; i < steps.length; i++) {
        var s = steps[i];
        var fig = await figureHtmlResolved(state.character, s);
        items +=
          '<article class="prl-scroll-item" id="prl-step-' + esc(s.id) + '" data-prl-step-id="' + esc(s.id) + '" data-prl-step-index="' + i + '">' +
            progressHtml(prayer, s, i, steps.length) +
            fig +
            stepCopyHtml(s) +
          "</article>";
      }
      return (
        '<section class="prl-shell" data-prl-root="learn" data-prl-mode="scroll" data-prl-index="' + idx + '">' +
          controlsHtml(state) +
          '<div class="prl-scroll-list">' + items + "</div>" +
          '<div class="prl-btn-row"><button type="button" class="prl-btn" data-prl-go="">Übersicht</button></div>' +
        "</section>"
      );
    }

    var slides = "";
    for (var j = 0; j < steps.length; j++) {
      var sj = steps[j];
      var figj = await figureHtmlResolved(state.character, sj);
      slides +=
        '<article class="prl-swipe-slide" data-prl-step-id="' + esc(sj.id) + '" data-prl-step-index="' + j + '">' +
          (dual
            ? '<div class="prl-learn-layout is-dual">' + figj + '<div>' + progressHtml(prayer, sj, j, steps.length) + stepCopyHtml(sj) + "</div></div>"
            : progressHtml(prayer, sj, j, steps.length) + figj + stepCopyHtml(sj)) +
        "</article>";
    }

    return (
      '<section class="prl-shell" data-prl-root="learn" data-prl-mode="swipe" data-prl-index="' + idx + '">' +
        controlsHtml(state) +
        '<div class="prl-swipe-track" data-prl-track>' + slides + "</div>" +
        nav +
        '<div class="prl-btn-row"><button type="button" class="prl-btn" data-prl-go="">Übersicht</button></div>' +
      "</section>"
    );
  }

  function headerFor(parsed) {
    if (typeof global.setPageHeader !== "function") return "";
    if (parsed.mode === "hub") return global.setPageHeader("Gebet erlernen", "Schritt für Schritt sehen und lernen.", "Lernen");
    if (parsed.mode === "prayers") return global.setPageHeader("Gebete", "Ein bestimmtes Gebet wählen", "Gebet erlernen");
    if (parsed.mode === "positions") return global.setPageHeader("Stellungen", "Direkt nachschlagen", "Gebet erlernen");
    return global.setPageHeader("Fajr", "2 Rakʿāt · Lernmodus", "Gebet erlernen");
  }

  async function render(value) {
    missingAssets = [];
    var state = loadState();
    var parsed = parseValue(value);
    if (parsed.mode === "hub" && !parsed.prayer) {
      /* hub */
    } else if (parsed.prayer === "stellung" || parsed.mode === "positions") {
      parsed.mode = "positions";
    } else if (parsed.prayer === "gebet" || parsed.mode === "prayers") {
      parsed.mode = "prayers";
    } else if (parsed.prayer) {
      parsed.mode = "learn";
      state = saveState({ prayer: parsed.prayer });
    }

    var index = await ensureIndex();
    var fajr = await ensurePrayer("fajr");
    var html = headerFor(parsed);

    if (parsed.mode === "prayers") html += prayersHtml(state, index);
    else if (parsed.mode === "positions") html += positionsHtml(state, index);
    else if (parsed.mode === "learn") {
      var prayer = await ensurePrayer(parsed.prayer || state.prayer || "fajr");
      if (!prayer) {
        html += '<section class="prl-shell"><div class="prl-research">Dieses Gebet ist noch nicht freigeschaltet.</div><div class="prl-btn-row"><button type="button" class="prl-btn" data-prl-go="">Zurück</button></div></section>';
      } else {
        var steps = sortedSteps(prayer);
        var focus = findStepIndex(steps, parsed.stepKey ? "" : state.stepId, parsed.rakAh, parsed.stepKey);
        if (parsed.stepKey || parsed.rakAh) {
          focus = findStepIndex(steps, "", parsed.rakAh || 1, parsed.stepKey || "");
        } else if (state.stepId && state.prayer === prayer.id) {
          focus = findStepIndex(steps, state.stepId);
        }
        var step = steps[focus] || steps[0];
        saveState({ prayer: prayer.id, rakAh: step.rakAh, stepId: step.id });
        html += await learnHtml(state, prayer, focus);
      }
    } else {
      html += hubHtml(state, index, fajr);
    }

    return html;
  }

  function deepLinkForStep(prayerId, step) {
    var pose = String(step.malePose || step.id || "step");
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

  function currentLearnContext() {
    var root = document.querySelector("[data-prl-root='learn']");
    if (!root) return null;
    var state = loadState();
    return { root: root, state: state, mode: root.getAttribute("data-prl-mode") };
  }

  async function jumpToIndex(nextIndex, opts) {
    opts = opts || {};
    var prayer = await ensurePrayer(loadState().prayer || "fajr");
    if (!prayer) return;
    var steps = sortedSteps(prayer);
    var idx = Math.max(0, Math.min(steps.length - 1, nextIndex));
    var step = steps[idx];
    saveState({ prayer: prayer.id, rakAh: step.rakAh, stepId: step.id, scrollPosition: 0 });
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
      if (track && slide) {
        track.scrollTo({ left: slide.offsetLeft, behavior: opts.instant ? "auto" : "smooth" });
      }
      ctx.root.setAttribute("data-prl-index", String(idx));
      syncHashToStep(prayer.id, step, true);
      updateNavButtons(ctx.root, idx, steps.length);
    } else {
      var el = document.getElementById("prl-step-" + step.id);
      if (el) el.scrollIntoView({ behavior: opts.instant ? "auto" : "smooth", block: "start" });
      syncHashToStep(prayer.id, step, true);
    }
  }

  function updateNavButtons(root, idx, total) {
    var prev = root.querySelector("[data-prl-prev]");
    var next = root.querySelector("[data-prl-next]");
    if (prev) prev.disabled = idx <= 0;
    if (next) next.disabled = idx >= total - 1;
  }

  function bindSwipeTrack(root) {
    var track = root.querySelector("[data-prl-track]");
    if (!track || track.dataset.bound === "1") return;
    track.dataset.bound = "1";
    var timer = 0;
    track.addEventListener("scroll", function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        var slides = [].slice.call(track.querySelectorAll(".prl-swipe-slide"));
        if (!slides.length) return;
        var left = track.scrollLeft;
        var best = 0;
        var bestDist = Infinity;
        slides.forEach(function (slide, i) {
          var d = Math.abs(slide.offsetLeft - left);
          if (d < bestDist) { bestDist = d; best = i; }
        });
        var stepId = slides[best].getAttribute("data-prl-step-id");
        var state = saveState({ stepId: stepId, rakAh: Number(slides[best].querySelector(".prl-kicker") && String(slides[best].textContent).match(/(\d+)\.\s*Rak/) ? RegExp.$1 : loadState().rakAh) });
        root.setAttribute("data-prl-index", String(best));
        ensurePrayer(state.prayer || "fajr").then(function (prayer) {
          if (!prayer) return;
          var steps = sortedSteps(prayer);
          var step = steps[best];
          if (!step) return;
          saveState({ stepId: step.id, rakAh: step.rakAh });
          syncHashToStep(prayer.id, step, true);
          updateNavButtons(root, best, steps.length);
        });
      }, 80);
    }, { passive: true });
  }

  function restoreLearnPosition(root) {
    var state = loadState();
    ensurePrayer(state.prayer || "fajr").then(function (prayer) {
      if (!prayer) return;
      var steps = sortedSteps(prayer);
      var idx = findStepIndex(steps, state.stepId);
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
    var characterBtn = t.closest("[data-prl-character]");
    if (characterBtn) {
      saveState({ character: characterBtn.getAttribute("data-prl-character") === "female" ? "female" : "male" });
      if (typeof global.render === "function") global.render();
      return;
    }
    var viewBtn = t.closest("[data-prl-view]");
    if (viewBtn) {
      var mode = viewBtn.getAttribute("data-prl-view") === "scroll" ? "scroll" : "swipe";
      saveState({ viewMode: mode });
      if (typeof global.render === "function") global.render();
      return;
    }
    var go = t.closest("[data-prl-go]");
    if (go) {
      var target = go.getAttribute("data-prl-go") || "";
      navigate(VIEW, target);
      return;
    }
    var resume = t.closest("[data-prl-resume]");
    if (resume) {
      var st = loadState();
      ensurePrayer(st.prayer || "fajr").then(function (prayer) {
        if (!prayer) return;
        var steps = sortedSteps(prayer);
        var step = steps.find(function (s) { return s.id === st.stepId; }) || steps[0];
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
        var step = steps.find(function (s) { return s.id === stepId || s.malePose === stepId || String(s.id).indexOf(stepId) >= 0; }) || steps[0];
        saveState({ prayer: "fajr", stepId: step.id, rakAh: step.rakAh });
        navigate(VIEW, deepLinkForStep("fajr", step));
      });
      return;
    }
    var prev = t.closest("[data-prl-prev]");
    if (prev) {
      var root = document.querySelector("[data-prl-root='learn']");
      var idx = Number(root && root.getAttribute("data-prl-index") || 0);
      jumpToIndex(idx - 1);
      return;
    }
    var next = t.closest("[data-prl-next]");
    if (next) {
      var root2 = document.querySelector("[data-prl-root='learn']");
      var idx2 = Number(root2 && root2.getAttribute("data-prl-index") || 0);
      jumpToIndex(idx2 + 1);
    }
  }

  if (!swipeBound) {
    swipeBound = true;
    document.addEventListener("click", onClick);
  }

  global.DARPrayerLearning = {
    VIEW: VIEW,
    render: render,
    afterRender: afterRender,
    loadState: loadState,
    saveState: saveState,
    characterIds: { male: CHAR_MALE, female: CHAR_FEMALE },
    audioEnabled: AUDIO_ENABLED,
    missingAssets: function () { return missingAssets.slice(); },
    report: function () {
      return {
        feature: "Gebet erlernen",
        environment: "test",
        audioVisible: false,
        unexpectedCharacterAssets: 0,
        productionChanged: false,
        characterLock: { male: CHAR_MALE, female: CHAR_FEMALE },
        missingPoseAssets: missingAssets.slice()
      };
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
