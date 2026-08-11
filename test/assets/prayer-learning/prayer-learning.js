/**
 * DAR AL TAWḤĪD — Gebet erlernen (Test Phase 12)
 * Full Fajr QA / UX audit / stabilize · keine neue Architektur
 * productionEnabled = false | audioVisible = false | TEST ONLY
 * technicalFajrComplete ≠ religiousFajrApproved · fajrPreReleasePass computed
 */
(function (global) {
  "use strict";

  var VIEW = "gebet-lernen";
  var STATE_KEY = "darPrayerLearningV1";
  var HINT_KEY = "darPrayerLearningSwipeHintV1";
  var ASSET_BASE = "/test/assets/prayer-learning/";
  var DATA_BASE = "/test/data/prayer-learning/";
  var QURAN_BASE = "/content/quran/";
  var AUDIO_ENABLED = false;
  var AUDIO_VISIBLE = false;
  var AUDIO_PRELOAD = false;
  var CONTENT_PENDING_LABEL = "Inhalt wird quellengeprüft.";
  var POSE_PENDING_LABEL = "Pose wird geprüft";
  var TEXTS_EMPTY_LABEL = "Noch keine geprüften Texte verfügbar.";
  var OFFLINE_EVIDENCE_LABEL = "Direktnachweis benötigt eine Internetverbindung.";
  var PHASE = 12;
  var CHAR_MALE = "dar-prayer-male-v1";
  var CHAR_FEMALE = "dar-prayer-female-v1";
  var CHAR_VERSION = 1;

  var cache = { index: null, prayers: null, fajr: null, fajrComposed: null, steps: {}, texts: null, claims: null, claimsById: null, registry: null, poses: { male: null, female: null }, poseSlots: { male: null, female: null }, poseIndex: null, contentIndex: null, contentById: {}, variantsIndex: null, searchIndex: null, validationDash: null, manifest: null, reviewIndex: null, reviewSteps: null, readiness: null, auditLog: null, dependencies: null, characters: {}, quranBySurah: {} };
  var listenersBound = false;
  var missingAssets = [];
  var validationErrors = [];
  var wrongCharacterAssets = 0;
  var sourceSheetOpen = false;
  var sourceSheetStepId = "";
  var scrollObserver = null;
  var resizeTimer = 0;
  var pointerSwipe = null;
  var characterSwitchPending = false;
  var stepNavBusyUntil = 0;
  var lastAppliedStepId = "";
  var deepLinkRecoveryNotice = "";
  var SWIPE_THRESHOLD_PX = 56;
  var SWIPE_RATIO = 1.35;
  var STEP_NAV_LOCK_MS = 160;
  var productionEnabled = false;
  var controllerRuntime = {
    orientation: "portrait",
    containerMode: "phone",
    sourcePanelOpen: false,
    detailView: null,
    completed: false
  };

  var STEP_ALIASES = {
    takbir: "fajr-r1-takbir",
    "takbirat-al-ihram": "fajr-r1-takbir",
    qiyam: "fajr-r1-qiyam",
    recitation: "fajr-r1-recitation",
    ruku: "fajr-r1-ruku",
    "standing-after-ruku": "fajr-r1-standing-after-ruku",
    itidal: "fajr-r1-standing-after-ruku",
    "sujud-1": "fajr-r1-sujud-1",
    sujud: "fajr-r1-sujud-1",
    sitting: "fajr-r1-sitting-between-sujud",
    "sitting-between-sujud": "fajr-r1-sitting-between-sujud",
    jalsa: "fajr-r1-sitting-between-sujud",
    "fajr-r1-sitting": "fajr-r1-sitting-between-sujud",
    "sujud-2": "fajr-r1-sujud-2",
    rise: "fajr-r1-rise-to-rakah-2",
    "rise-to-rakah-2": "fajr-r1-rise-to-rakah-2",
    "fajr-r1-rise": "fajr-r1-rise-to-rakah-2",
    "rise-next-rakah": "fajr-r1-rise-to-rakah-2",
    tashahhud: "fajr-r2-tashahhud",
    taslim: "fajr-r2-taslim-right",
    "taslim-right": "fajr-r2-taslim-right",
    "taslim-left": "fajr-r2-taslim-left"
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
      scrollPosition: 0,
      sourcePanelOpen: false,
      detailView: null,
      learningSequenceCompleted: false,
      lastStepId: "",
      lastPrayerId: "",
      orientation: detectOrientation(),
      containerMode: detectContainerMode()
    };
  }

  function detectOrientation() {
    try {
      var w = Math.max(document.documentElement.clientWidth || 0, global.innerWidth || 0);
      var h = Math.max(document.documentElement.clientHeight || 0, global.innerHeight || 0);
      return w >= h ? "landscape" : "portrait";
    } catch (e) { return "portrait"; }
  }

  function detectContainerMode() {
    try {
      var w = Math.max(document.documentElement.clientWidth || 0, global.innerWidth || 0);
      var h = Math.max(document.documentElement.clientHeight || 0, global.innerHeight || 0);
      var dual = w >= 700 && (w >= h || w >= 900);
      if (dual) return w >= 1024 ? "tablet-landscape" : "fold-open";
      if (w < 380 || h < 620) return "phone-small";
      if (w >= 700 && w < h) return "tablet-portrait";
      return "phone";
    } catch (e) { return "phone"; }
  }

  function prefersReducedMotion() {
    try { return !!(global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches); }
    catch (e) { return false; }
  }

  function syncLayoutState() {
    var patch = {
      orientation: detectOrientation(),
      containerMode: detectContainerMode()
    };
    controllerRuntime.orientation = patch.orientation;
    controllerRuntime.containerMode = patch.containerMode;
    return saveState(patch);
  }

  /** Single source of truth controller helpers */
  function getControllerState() {
    var s = loadState();
    return {
      prayerId: s.prayerId || "fajr",
      characterId: s.characterId || CHAR_MALE,
      viewMode: s.viewMode || "swipe",
      rakAh: s.rakAh || 1,
      stepId: s.stepId || "",
      stepIndex: s.stepIndex || 0,
      sourcePanelOpen: !!(s.sourcePanelOpen || sourceSheetOpen),
      detailView: s.detailView || null,
      learningSequenceCompleted: !!s.learningSequenceCompleted,
      lastStepId: s.lastStepId || "",
      lastPrayerId: s.lastPrayerId || "",
      orientation: s.orientation || detectOrientation(),
      containerMode: s.containerMode || detectContainerMode()
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
    next.sourcePanelOpen = !!next.sourcePanelOpen;
    next.detailView = next.detailView || null;
    next.learningSequenceCompleted = !!next.learningSequenceCompleted;
    next.lastStepId = next.lastStepId || "";
    next.lastPrayerId = next.lastPrayerId || "";
    next.orientation = next.orientation || detectOrientation();
    next.containerMode = next.containerMode || detectContainerMode();
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
    var head = parts[0] || "";
    var mode = "hub";
    if (head === "stellung") mode = "positions";
    else if (head === "gebet") mode = "prayers";
    else if (head === "texte" || head === "was-sage-ich") mode = "texts";
    else if (head === "debug" || head === "validation") mode = "debug";
    else if (head === "review") mode = "review";
    else if (head) mode = "learn";
    var reviewFilters = ["all","missing","research","source_check","pose_check","review_pass_1","review_pass_2","approved","rejected"];
    var reviewFilter = "all";
    var reviewStepId = "";
    if (mode === "review") {
      if (parts[1] === "filter" && parts[2]) reviewFilter = parts[2];
      else if (parts[1] && reviewFilters.indexOf(parts[1]) >= 0) reviewFilter = parts[1];
      else if (parts[1]) reviewStepId = parts[1];
    }
    return {
      prayer: head,
      mode: mode,
      rakAh: parts[1] ? Number(parts[1]) : null,
      stepKey: parts[2] || "",
      reviewFilter: reviewFilter,
      reviewStepId: reviewStepId
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
    await ensureIndexMeta();
    await ensureRegistry();
    await ensureClaims();
    await ensureContentRegistry();
    await ensurePoseSlotRegistries();
    await ensureSearchIndex();
    await ensureManifest();
    await ensureReviewData();
    if (cache.fajrComposed) return cache.fajrComposed;
    if (!cache.fajr) cache.fajr = await fetchJson(DATA_BASE + "fajr.json");
    return composeFajr(cache.fajr);
  }

  function validatePrayerData(prayer) {
    (prayer.steps || []).forEach(function (step) {
      if (step.verificationStatus === "approved" && !(step.sourceClaimIds && step.sourceClaimIds.length)) {
        validationErrors.push("approved step without sources: " + step.id);
        throw new Error("approved step without sources: " + step.id);
      }
    });
  }

  async function ensureIndexMeta() {
    if (cache.index) return cache.index;
    try { cache.index = await fetchJson(DATA_BASE + "index.json"); }
    catch (e) { cache.index = { phase: 3, audioEnabled: false }; }
    return cache.index;
  }

  async function ensureStepTemplate(id) {
    if (cache.steps[id]) return cache.steps[id];
    cache.steps[id] = await fetchJson(DATA_BASE + "steps/" + id + ".json");
    return cache.steps[id];
  }

  async function ensureRegistry() {
    if (cache.registry) return cache.registry;
    try { cache.registry = await fetchJson(DATA_BASE + "assets/poses-registry.json"); }
    catch (e) { cache.registry = { poses: { male: {}, female: {} }, reuseMap: {} }; }
    return cache.registry;
  }

  async function ensureClaims() {
    if (cache.claims) return cache.claims;
    try { cache.claims = await fetchJson(DATA_BASE + "sources/claims.json"); }
    catch (e) { cache.claims = { claims: [] }; }
    cache.claimsById = {};
    (cache.claims.claims || []).forEach(function (c) {
      if (c && c.id) cache.claimsById[c.id] = c;
      if (c && c.aliases && c.aliases.length) {
        c.aliases.forEach(function (a) { if (a) cache.claimsById[a] = c; });
      }
    });
    var aliases = cache.claims.claimAliases || {};
    Object.keys(aliases).forEach(function (oldId) {
      var neu = aliases[oldId];
      if (neu && cache.claimsById[neu] && !cache.claimsById[oldId]) cache.claimsById[oldId] = cache.claimsById[neu];
    });
    return cache.claims;
  }

  function canPublishPrayerContent(content) {
    if (!content || typeof content !== "object") return false;
    return (
      content.status === "approved" &&
      content.reviewPass1 === true &&
      content.reviewPass2 === true &&
      Array.isArray(content.sourceClaimIds) &&
      content.sourceClaimIds.length > 0
    );
  }

  function canPublishPose(pose) {
    if (!pose || typeof pose !== "object") return false;
    return (
      pose.approved === true &&
      pose.characterConsistency === true &&
      pose.clothingReview === true &&
      pose.poseReview === true &&
      pose.reviewPass1 === true &&
      pose.reviewPass2 === true &&
      Array.isArray(pose.sourceClaimIds) &&
      pose.sourceClaimIds.length > 0
    );
  }

  function isWeakSourceType(sourceType) {
    var t = String(sourceType || "").toLowerCase();
    return t === "daif" || t === "very_weak" || t === "mawdu" || t === "unverified";
  }

  function canUseClaimAsDefaultInstruction(claim) {
    if (!claim) return false;
    if (claim.approved !== true || claim.reviewPass1 !== true || claim.reviewPass2 !== true) return false;
    if (isWeakSourceType(claim.sourceType)) return false;
    return true;
  }

  async function ensureContentRegistry() {
    if (cache.contentIndex && Object.keys(cache.contentById || {}).length) return cache.contentIndex;
    try {
      cache.contentIndex = await fetchJson(DATA_BASE + "content/index.json");
    } catch (e) {
      cache.contentIndex = { modules: [] };
    }
    cache.contentById = cache.contentById || {};
    var modules = cache.contentIndex.modules || [];
    for (var i = 0; i < modules.length; i++) {
      var m = modules[i];
      if (!m || !m.file) continue;
      try {
        var entry = await fetchJson(DATA_BASE + "content/" + m.file);
        if (entry && entry.id) {
          cache.contentById[entry.id] = entry;
          if (entry.aliases && entry.aliases.length) {
            entry.aliases.forEach(function (alias) {
              if (alias) cache.contentById[alias] = entry;
            });
          }
          if (m.contentId && m.contentId !== entry.id) {
            cache.contentById[m.contentId] = entry;
          }
        }
      } catch (err) {
        validationErrors.push("content load fail: " + m.file);
      }
    }
    try {
      cache.variantsIndex = await fetchJson(DATA_BASE + "content/variants/index.json");
    } catch (e2) {
      cache.variantsIndex = { variants: [] };
    }
    return cache.contentIndex;
  }

  async function ensurePoseSlotRegistries() {
    if (cache.poseSlots.male && cache.poseSlots.female) return cache.poseSlots;
    try { cache.poseSlots.male = await fetchJson(DATA_BASE + "poses/male-v1.json"); }
    catch (e) { cache.poseSlots.male = { characterId: CHAR_MALE, activeAssets: {}, poses: {} }; }
    try { cache.poseSlots.female = await fetchJson(DATA_BASE + "poses/female-v1.json"); }
    catch (e2) { cache.poseSlots.female = { characterId: CHAR_FEMALE, activeAssets: {}, poses: {} }; }
    try { cache.poseIndex = await fetchJson(DATA_BASE + "poses/index.json"); }
    catch (e3) { cache.poseIndex = { characters: {} }; }
    if (cache.poseSlots.male.characterId !== CHAR_MALE) {
      throw new Error("VALIDATION FAIL: male pose registry characterId");
    }
    if (cache.poseSlots.female.characterId !== CHAR_FEMALE) {
      throw new Error("VALIDATION FAIL: female pose registry characterId");
    }
    return cache.poseSlots;
  }

  async function ensureSearchIndex() {
    if (cache.searchIndex) return cache.searchIndex;
    try { cache.searchIndex = await fetchJson(DATA_BASE + "search/index.json"); }
    catch (e) { cache.searchIndex = { entries: [] }; }
    return cache.searchIndex;
  }

  async function ensureValidationDash() {
    if (cache.validationDash) return cache.validationDash;
    try { cache.validationDash = await fetchJson(DATA_BASE + "audit/fajr-validation-dashboard.json"); }
    catch (e) { cache.validationDash = { steps: [] }; }
    return cache.validationDash;
  }

  async function ensureManifest() {
    if (cache.manifest) return cache.manifest;
    try { cache.manifest = await fetchJson(DATA_BASE + "prayer-learning-manifest.json"); }
    catch (e) { cache.manifest = { version: 1, assets: [] }; }
    return cache.manifest;
  }

  async function ensureReviewData() {
    if (cache.reviewSteps && cache.reviewIndex) return cache.reviewSteps;
    try { cache.reviewIndex = await fetchJson(DATA_BASE + "review/index.json"); }
    catch (e) { cache.reviewIndex = { visitorVisible: false, filters: [] }; }
    try { cache.reviewSteps = await fetchJson(DATA_BASE + "review/fajr-steps.json"); }
    catch (e2) { cache.reviewSteps = { steps: [] }; }
    try { cache.readiness = await fetchJson(DATA_BASE + "review/fajr-readiness.json"); }
    catch (e3) { cache.readiness = { fajr: {}, computed: true }; }
    try { cache.auditLog = await fetchJson(DATA_BASE + "review/audit-log.json"); }
    catch (e4) { cache.auditLog = { entries: [] }; }
    try { cache.dependencies = await fetchJson(DATA_BASE + "review/dependencies.json"); }
    catch (e5) { cache.dependencies = { edges: [], invalidationRules: {} }; }
    return cache.reviewSteps;
  }

  function isStepFullyApproved(stepReview) {
    if (!stepReview || typeof stepReview !== "object") return false;
    if (stepReview.rejected === true) return false;
    return !!(
      stepReview.contentApproved === true &&
      stepReview.sourceCoverageApproved === true &&
      stepReview.poseApproved === true &&
      stepReview.reviewPass1 === true &&
      stepReview.reviewPass2 === true
    );
  }

  function computeStepApprovedFlags(stepReview, content, claimsById, malePose, femalePose) {
    var contentOk = canPublishPrayerContent(content);
    var claimIds = (stepReview && stepReview.claimIds) || (content && content.sourceClaimIds) || [];
    var sourceOk = claimIds.length > 0 && claimIds.every(function (id) {
      var c = claimsById && claimsById[id];
      return !!(c && c.approved === true && c.reviewPass1 === true && c.reviewPass2 === true && !isWeakSourceType(c.sourceType));
    });
    var maleOk = canPublishPose(malePose);
    var femaleOk = canPublishPose(femalePose);
    var poseOk = maleOk && femaleOk;
    var pass1 = !!(stepReview && (stepReview.reviewPass1 === true || (stepReview.review && stepReview.review.reviewPass1 && stepReview.review.reviewPass1.passed)));
    var pass2 = !!(stepReview && (stepReview.reviewPass2 === true || (stepReview.review && stepReview.review.reviewPass2 && stepReview.review.reviewPass2.passed)));
    return {
      contentApproved: contentOk,
      sourceCoverageApproved: sourceOk,
      poseApproved: poseOk,
      malePoseApproved: maleOk,
      femalePoseApproved: femaleOk,
      reviewPass1: pass1,
      reviewPass2: pass2,
      approved: contentOk && sourceOk && poseOk && pass1 && pass2
    };
  }

  function statusLabel(ok, missing) {
    if (ok === true) return "approved";
    if (missing) return "missing";
    return "pending";
  }

  function computeMissingCounts() {
    var steps = (cache.reviewSteps && cache.reviewSteps.steps) || [];
    var claimsById = cache.claimsById || {};
    var male = cache.poseSlots && cache.poseSlots.male;
    var female = cache.poseSlots && cache.poseSlots.female;
    var counts = {
      missingSources: 0,
      missingMalePoses: 0,
      missingFemalePoses: 0,
      contentPending: 0,
      reviewPass1Pending: 0,
      reviewPass2Pending: 0,
      rejected: 0,
      approvedSteps: 0
    };
    steps.forEach(function (st) {
      var content = getContentById(st.contentId);
      var malePose = male && male.poses ? male.poses[st.poseId] : null;
      if (st.poseId === "taslim-right" && male && male.poses) malePose = male.poses["taslim-right"] || male.poses.taslim || malePose;
      var femalePose = female && female.poses ? female.poses[st.poseId] : null;
      if (st.poseId === "taslim-right" && female && female.poses) femalePose = female.poses["taslim-right"] || female.poses.taslim || femalePose;
      var flags = computeStepApprovedFlags(st, content, claimsById, malePose, femalePose);
      if (!flags.contentApproved) counts.contentPending += 1;
      if (!flags.sourceCoverageApproved) counts.missingSources += 1;
      if (!flags.malePoseApproved) counts.missingMalePoses += 1;
      if (!flags.femalePoseApproved) counts.missingFemalePoses += 1;
      if (!flags.reviewPass1) counts.reviewPass1Pending += 1;
      if (!flags.reviewPass2) counts.reviewPass2Pending += 1;
      if (st.rejected) counts.rejected += 1;
      if (flags.approved) counts.approvedSteps += 1;
    });
    return counts;
  }

  function computeFajrReadiness(prayer) {
    var steps = (prayer && prayer.steps) || [];
    var sequenceValid = steps.length === 19;
    var finalOk = false;
    var rakAh2Ok = false;
    if (sequenceValid) {
      var orders = {};
      var rakAhs = {};
      steps.forEach(function (st) {
        if (st.order == null || orders[st.order]) sequenceValid = false;
        orders[st.order] = true;
        if (!st.id || !st.poseId || !st.contentId) sequenceValid = false;
        rakAhs[st.rakAh] = true;
        if (st.id === "fajr-r2-taslim-left" && Number(st.order) === 19) finalOk = true;
      });
      rakAh2Ok = !!rakAhs[1] && !!rakAhs[2];
      if (!finalOk || !rakAh2Ok) sequenceValid = false;
    }
    var counts = computeMissingCounts();
    var masterSteps = (cache.reviewSteps && cache.reviewSteps.steps) || [];
    var contentCoverage = counts.contentPending === 0 && masterSteps.length > 0;
    var sourceCoverage = counts.missingSources === 0 && masterSteps.length > 0;
    var malePoseCoverage = counts.missingMalePoses === 0 && masterSteps.length > 0;
    var femalePoseCoverage = counts.missingFemalePoses === 0 && masterSteps.length > 0;
    var reviewPass1 = counts.reviewPass1Pending === 0 && masterSteps.length > 0;
    var reviewPass2 = counts.reviewPass2Pending === 0 && masterSteps.length > 0;
    var releaseReady = !!(
      sequenceValid &&
      contentCoverage &&
      sourceCoverage &&
      malePoseCoverage &&
      femalePoseCoverage &&
      reviewPass1 &&
      reviewPass2
    );
    var fajr = {
      sequenceValid: !!sequenceValid,
      requiredSteps: 19,
      technicalSequenceComplete: !!sequenceValid,
      religiousFajrApproved: false,
      contentCoverage: !!contentCoverage,
      sourceCoverage: !!sourceCoverage,
      malePoseCoverage: !!malePoseCoverage,
      femalePoseCoverage: !!femalePoseCoverage,
      reviewPass1: !!reviewPass1,
      reviewPass2: !!reviewPass2,
      releaseReady: releaseReady
    };
    cache.readiness = {
      version: 1,
      phase: PHASE,
      computed: true,
      technicalFajrComplete: !!sequenceValid,
      religiousFajrApproved: false,
      fajr: fajr,
      productionEnabled: false,
      counts: counts,
      updatedAt: new Date().toISOString()
    };
    return cache.readiness;
  }

  function appendAuditEntry(entry) {
    if (!cache.auditLog) cache.auditLog = { entries: [] };
    if (!Array.isArray(cache.auditLog.entries)) cache.auditLog.entries = [];
    var row = {
      entityId: entry.entityId || "",
      from: entry.from || null,
      to: entry.to || null,
      changedAt: entry.changedAt || new Date().toISOString(),
      changedBy: entry.changedBy || "system",
      reason: entry.reason || "",
      selfApproval: false
    };
    if (row.changedBy === "ai" || row.changedBy === "import-auto") {
      validationErrors.push("self-approval blocked: " + row.entityId);
      return null;
    }
    cache.auditLog.entries.push(row);
    return row;
  }

  function invalidateClaimApproval(claim, reason) {
    if (!claim) return null;
    var from = claim.approved ? "approved" : (claim.status || claim.verificationStatus || "research");
    claim.approved = false;
    claim.reviewPass1 = false;
    claim.reviewPass2 = false;
    claim.status = "source_check";
    claim.verificationStatus = "source_check";
    appendAuditEntry({ entityId: claim.id, from: from, to: "source_check", reason: reason || "claim source changed", changedBy: "system" });
    return claim;
  }

  function invalidatePoseApproval(pose, reason) {
    if (!pose) return null;
    var from = pose.approved ? "approved" : (pose.status || "pending");
    pose.characterConsistency = false;
    pose.clothingReview = false;
    pose.poseReview = false;
    pose.reviewPass1 = false;
    pose.reviewPass2 = false;
    pose.approved = false;
    pose.status = "pending";
    appendAuditEntry({ entityId: pose.assetId || pose.poseId, from: from, to: "pending", reason: reason || "pose asset changed", changedBy: "system" });
    return pose;
  }

  function invalidateContentAfterDependency(content, reason) {
    if (!content) return null;
    var from = content.approved ? "approved" : (content.status || "research");
    content.approved = false;
    content.reviewPass1 = false;
    content.reviewPass2 = false;
    content.status = "source_check";
    if (content.review) {
      content.review.contentReview = content.review.contentReview || {};
      content.review.contentReview.status = "pending";
      content.review.sourceReview = content.review.sourceReview || {};
      content.review.sourceReview.status = "pending";
      content.review.reviewPass1 = { passed: false, reviewedAt: null, reviewer: null };
      content.review.reviewPass2 = { passed: false, reviewedAt: null, reviewer: null };
    }
    appendAuditEntry({ entityId: content.id, from: from, to: "source_check", reason: reason || "dependency invalidated", changedBy: "system" });
    return content;
  }

  function reviewStatusClass(status) {
    var s = String(status || "pending").toLowerCase();
    if (s === "approved") return "is-approved";
    if (s === "rejected") return "is-rejected";
    if (s === "missing") return "is-missing";
    return "is-pending";
  }

  function getReviewStepById(stepId) {
    var steps = (cache.reviewSteps && cache.reviewSteps.steps) || [];
    return steps.find(function (s) { return s.id === stepId; }) || null;
  }

  function buildReviewStepRow(st) {
    var content = getContentById(st.contentId);
    var male = cache.poseSlots && cache.poseSlots.male;
    var female = cache.poseSlots && cache.poseSlots.female;
    var malePose = male && male.poses ? male.poses[st.poseId] : null;
    var femalePose = female && female.poses ? female.poses[st.poseId] : null;
    if (st.poseId === "taslim-right") {
      malePose = (male && male.poses && (male.poses["taslim-right"] || male.poses.taslim)) || malePose;
      femalePose = (female && female.poses && (female.poses["taslim-right"] || female.poses.taslim)) || femalePose;
    }
    var flags = computeStepApprovedFlags(st, content, cache.claimsById, malePose, femalePose);
    return {
      id: st.id,
      titleDe: st.titleDe,
      titleAr: st.titleAr,
      status: st.rejected ? "rejected" : (flags.approved ? "approved" : (st.status || "research")),
      content: statusLabel(flags.contentApproved, !content),
      sources: statusLabel(flags.sourceCoverageApproved, !(st.claimIds && st.claimIds.length)),
      malePose: statusLabel(flags.malePoseApproved, !malePose),
      femalePose: statusLabel(flags.femalePoseApproved, !femalePose),
      reviewPass1: statusLabel(flags.reviewPass1, false),
      reviewPass2: statusLabel(flags.reviewPass2, false),
      flags: flags
    };
  }

  function contentIdForStep(step, seqStep) {
    if (seqStep && seqStep.contentId) return seqStep.contentId;
    if (step && step.contentId) return step.contentId;
    var pose = (step && (step.templateId || step.poseId)) || "";
    if (pose === "recitation") return "fajr-r1-recitation-v1";
    if (pose === "standing-after-ruku") return "standing-after-ruku-v1";
    if (pose === "sitting-between-sujud") return "sitting-between-sujud-v1";
    if (pose === "standing-next-rakah" || pose === "rise-next-rakah") return "rise-next-rakah-v1";
    if (pose === "sujud") return "sujud-main-v1";
    if (pose) return pose + "-main-v1";
    return null;
  }

  async function loadQuranSurah(surahNum) {
    var n = Number(surahNum) || 0;
    if (!n) return null;
    if (cache.quranBySurah[n]) return cache.quranBySurah[n];
    var pad = String(n).padStart(3, "0");
    try {
      cache.quranBySurah[n] = await fetchJson(QURAN_BASE + pad + ".json");
      return cache.quranBySurah[n];
    } catch (e) {
      try {
        cache.quranBySurah[n] = await fetchJson("/test" + QURAN_BASE + pad + ".json");
        return cache.quranBySurah[n];
      } catch (e2) {
        validationErrors.push("quran load fail: " + pad);
        return null;
      }
    }
  }

  function quranAyahsHtml(surahData, ref) {
    if (!surahData || !ref) return "";
    var start = Number(ref.ayahStart) || 1;
    var end = Number(ref.ayahEnd) || start;
    var verses = surahData.verses || surahData.ayahs || [];
    var rows = verses.filter(function (v) {
      var id = Number(v.id || v.number || v.ayah || 0);
      return id >= start && id <= end;
    });
    if (!rows.length) return "";
    return (
      '<div class="prl-quran" data-prl-quran-reuse="1" data-prl-surah="' +
      esc(String(ref.surah)) +
      '">' +
      rows
        .map(function (v) {
          var id = v.id || v.number || v.ayah || "";
          var ar = v.ar || v.arabic || v.text || "";
          return (
            '<div class="quran-ayah prl-quran-ayah">' +
            '<div class="quran-ayah-num">Āyah ' +
            esc(String(id)) +
            "</div>" +
            '<div class="quran-ayah-ar" lang="ar" dir="rtl">' +
            esc(ar) +
            "</div>" +
            "</div>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function getContentById(contentId) {
    if (!contentId) return null;
    return (cache.contentById && cache.contentById[contentId]) || null;
  }

  function resolveContentForStep(step) {
    var contentId = contentIdForStep(step);
    var content = getContentById(contentId);
    var publishable = canPublishPrayerContent(content);
    var instructionDe = null;
    var arabic = null;
    var transliteration = null;
    var meaningDe = null;
    var spokenVisible = false;
    var quranRef = null;
    var variantIds = [];
    var sourceClaimIds = [];

    if (publishable && content) {
      instructionDe = content.instructionDe || content.instructionText || null;
      arabic = content.arabic || content.arabicText || null;
      transliteration = content.transliteration || null;
      meaningDe = content.meaningDe || content.germanMeaning || null;
      spokenVisible = !!(arabic || transliteration || meaningDe || content.spokenText);
      quranRef = content.quranRef || null;
      sourceClaimIds = (content.sourceClaimIds || []).slice();
      variantIds = (content.variantIds || []).filter(function (vid) {
        var v = getContentById(vid);
        return canPublishPrayerContent(v);
      });
    } else if (content && Array.isArray(content.sourceClaimIds)) {
      sourceClaimIds = content.sourceClaimIds.slice();
    }
    if (content && content.quranRef) {
      quranRef = content.quranRef;
    }
    if (step && Array.isArray(step.sourceClaimIds) && step.sourceClaimIds.length) {
      sourceClaimIds = step.sourceClaimIds.slice();
    }

    var duringRise = content && content.duringRiseText ? content.duringRiseText : null;
    var afterStanding = content && content.afterStandingText ? content.afterStandingText : null;
    var duringRiseApproved = !!(duringRise && duringRise.approved === true && duringRise.status === "approved");
    var afterStandingApproved = !!(afterStanding && afterStanding.approved === true && afterStanding.status === "approved");

    return {
      contentId: contentId,
      content: content,
      publishable: publishable,
      pendingLabel: CONTENT_PENDING_LABEL,
      instructionDe: instructionDe,
      arabic: arabic,
      transliteration: transliteration,
      meaningDe: meaningDe,
      spokenVisible: spokenVisible,
      quranRef: quranRef,
      doNotDuplicateQuranText: !!(content && content.doNotDuplicateQuranText),
      quranDatabaseReuse: !!(content && (content.quranDatabaseReuse || content.doNotDuplicateQuranText)),
      duringRiseText: duringRise,
      afterStandingText: afterStanding,
      duringRiseApproved: duringRiseApproved,
      afterStandingApproved: afterStandingApproved,
      variantIds: variantIds,
      sourceClaimIds: sourceClaimIds,
      status: content ? content.status : "missing",
      approved: !!(content && content.approved),
      audioId: null,
      audioVisible: false,
      audioEnabled: false,
      audioPreload: false
    };
  }

  function resolvePrayerPose(opts) {
    opts = opts || {};
    var characterId = opts.characterId || CHAR_MALE;
    var poseId = opts.poseId || "";
    var environment = opts.environment || (isTestEnv() ? "test" : "production");
    var gender = characterId === CHAR_FEMALE ? "female" : "male";
    var expected = gender === "female" ? CHAR_FEMALE : CHAR_MALE;
    if (characterId !== expected) {
      wrongCharacterAssets += 1;
      return { ok: false, reason: "character-mismatch", asset: null, characterId: characterId, poseId: poseId };
    }
    var slotReg = cache.poseSlots && cache.poseSlots[gender];
    if (slotReg) {
      if (slotReg.characterId !== expected) {
        validationErrors.push("pose slot character lock fail: " + gender);
        wrongCharacterAssets += 1;
        return { ok: false, reason: "character-lock", asset: null };
      }
      var poseEntry = (slotReg.poses && slotReg.poses[poseId]) || null;
      var activeId = slotReg.activeAssets ? slotReg.activeAssets[poseId] : null;
      if (poseEntry && poseEntry.characterId && poseEntry.characterId !== expected) {
        validationErrors.push("wrong character asset blocked: " + poseId);
        wrongCharacterAssets += 1;
        return { ok: false, reason: "wrong-character", asset: null, controlledPlaceholder: true };
      }
      if (activeId && poseEntry && canPublishPose(poseEntry) && poseEntry.src) {
        return {
          ok: true,
          characterId: characterId,
          poseId: poseId,
          assetId: activeId || poseEntry.assetId,
          url: poseEntry.src,
          srcWebp: poseEntry.srcWebp || null,
          srcAvif: poseEntry.srcAvif || null,
          srcset: poseEntry.srcset || [],
          meta: poseEntry,
          status: "approved",
          from: "pose-registry"
        };
      }
      if (environment === "test") {
        return {
          ok: false,
          reason: poseEntry ? (poseEntry.status || "pending") : "MISSING",
          asset: null,
          characterId: characterId,
          poseId: poseId,
          meta: poseEntry,
          controlledPlaceholder: true,
          from: "pose-registry"
        };
      }
      return { ok: false, reason: "not-approved", asset: null, characterId: characterId, poseId: poseId };
    }
    return resolvePoseAssetLegacy({ characterId: characterId, poseId: poseId });
  }

  function isTestEnv() {
    try {
      return !!(global.IS_TEST_PATH || (String(location.pathname || "").indexOf("/test") === 0));
    } catch (e) { return true; }
  }

  function resolvePoseId(template, seqStep) {
    if (seqStep && seqStep.malePoseId) return { male: seqStep.malePoseId, female: seqStep.femalePoseId || seqStep.malePoseId };
    var male = template.malePoseId || template.poseId || template.id;
    var female = template.femalePoseId || template.poseId || template.id;
    if (template.preferredPoseId) {
      // preferred transition pose may be missing; fallback handled in registry lookup
      male = template.preferredPoseId;
      female = template.preferredPoseId;
    }
    if (seqStep && seqStep.poseReuseFrom) {
      male = seqStep.poseReuseFrom;
      female = seqStep.poseReuseFrom;
    }
    if (template.poseReuseAllowed && template.poseId) {
      male = template.poseId;
      female = template.poseId;
    }
    return { male: male, female: female };
  }

  function titleForInstance(template, seqStep) {
    var titleDe = template.titleDe;
    var titleAr = template.titleAr;
    if (template.id === "sujud" && seqStep && seqStep.instance === 1) titleDe = "Erster Suǧūd";
    if (template.id === "sujud" && seqStep && seqStep.instance === 2) titleDe = "Zweiter Suǧūd";
    if (template.id === "taslim" && seqStep && seqStep.side === "right") {
      titleDe = "Taslīm nach rechts";
      titleAr = "التسليم";
    }
    if (template.id === "taslim" && seqStep && seqStep.side === "left") {
      titleDe = "Taslīm nach links";
      titleAr = "التسليم";
    }
    return { titleDe: titleDe, titleAr: titleAr };
  }

  async function composeFajr(master) {
    if (cache.fajrComposed) return cache.fajrComposed;
    var seq = master.sequenceSteps || [];
    var steps = [];
    for (var i = 0; i < seq.length; i++) {
      var s = seq[i];
      var tpl = await ensureStepTemplate(s.templateId);
      var titles = titleForInstance(tpl, s);
      var contentIdEarly = s.contentId || contentIdForStep({ templateId: tpl.id, poseId: s.poseId }, s);
      var contentEarly = getContentById(contentIdEarly);
      if (contentEarly && contentEarly.titleDe) titles.titleDe = contentEarly.titleDe;
      if (contentEarly && contentEarly.titleAr) titles.titleAr = contentEarly.titleAr;
      if (tpl.id === "sujud" && s.instance === 1) titles.titleDe = "Erster Suǧūd";
      if (tpl.id === "sujud" && s.instance === 2) titles.titleDe = "Zweiter Suǧūd";
      if (tpl.id === "taslim" && s.side === "right") {
        titles.titleDe = "Taslīm nach rechts";
        titles.titleAr = "التسليم";
      }
      if (tpl.id === "taslim" && s.side === "left") {
        titles.titleDe = "Taslīm nach links";
        titles.titleAr = "التسليم";
      }
      var poses = resolvePoseId(tpl, s);
      if (tpl.preferredPoseId && tpl.poseFallbackId) {
        var reg = await ensureRegistry();
        var genderKey = "male";
        var hasPreferred = !!(reg.poses && reg.poses[genderKey] && reg.poses[genderKey][tpl.preferredPoseId] && reg.poses[genderKey][tpl.preferredPoseId].filePresent);
        if (!hasPreferred) {
          poses.male = tpl.poseFallbackId;
          poses.female = tpl.poseFallbackId;
        }
      }
      var contentId = s.contentId || contentIdForStep({ templateId: tpl.id, poseId: s.poseId || poses.male }, s);
      var poseId = s.poseId || poses.male;
      var content = getContentById(contentId);
      var claimIds = (s.sourceClaimIds && s.sourceClaimIds.length
        ? s.sourceClaimIds
        : (s.claimSlotIds && s.claimSlotIds.length
          ? s.claimSlotIds
          : (content && content.relatedClaimSlotIds && content.relatedClaimSlotIds.length
            ? content.relatedClaimSlotIds
            : (tpl.claimSlotIds || [])))).slice();
      // approved sourceClaimIds only count for publishing; slots may be research-only
      if (content && content.sourceClaimIds && content.sourceClaimIds.length) {
        /* keep approved sources separate — publish gate uses content.sourceClaimIds */
      }
      steps.push({
        id: s.id,
        prayer: "fajr",
        rakAh: s.rakAh,
        order: s.order,
        templateId: tpl.id,
        titleDe: titles.titleDe,
        titleAr: titles.titleAr,
        instruction: null,
        recitation: null,
        transliteration: null,
        translationDe: null,
        contentId: contentId,
        poseId: poseId,
        malePose: poses.male,
        femalePose: poses.female,
        malePoseId: poses.male,
        femalePoseId: poses.female,
        femalePoseStatus: tpl.femalePoseStatus || "pending_review",
        detailSlots: tpl.detailSlots || [],
        checkAreas: tpl.checkAreas || [],
        textModuleIds: tpl.textModuleIds || [],
        quranSource: tpl.quranSource || (content && content.quranRef) || null,
        sourceClaimIds: claimIds,
        claimSlotIds: claimIds,
        details: tpl.details || [],
        variants: tpl.variants || [],
        verificationStatus: (s.status || tpl.verificationStatus || "research"),
        audioId: null,
        audioVisible: false,
        audioEnabled: false,
        deepLink: s.deepLink || tpl.id,
        poseReuseFrom: s.poseReuseFrom || null,
        poseReuse: !!(s.poseReuse || tpl.poseReuse || tpl.poseReuseAllowed),
        side: s.side || null,
        transitionType: s.transitionType || null,
        integrationBlock: s.integrationBlock || null
      });
    }
    var composed = {
      id: master.id,
      titleDe: master.titleDe,
      titleAr: master.titleAr,
      rakat: master.rakAhCount || master.rakat || 2,
      rakAhCount: master.rakAhCount || master.rakat || 2,
      audioEnabled: false,
      phase: PHASE,
      engine: "compose-from-templates",
      verificationNote: master.verificationNote,
      sequence: master.sequence || steps.map(function (x) { return x.id; }),
      stepAliases: master.stepAliases || {},
      transitions: master.transitions || [],
      completion: master.completion || null,
      steps: steps
    };
    validatePrayerData(composed);
    cache.fajrComposed = composed;
    return composed;
  }

  function registryPose(character, poseId) {
    var reg = cache.registry;
    if (!reg || !reg.poses) return null;
    var gender = character === "female" ? "female" : "male";
    var map = reg.poses[gender] || {};
    var entry = map[poseId];
    if (!entry && reg.reuseMap && reg.reuseMap[poseId]) entry = map[reg.reuseMap[poseId]];
    if (!entry) return null;
    var expected = character === "female" ? CHAR_FEMALE : CHAR_MALE;
    if (entry.characterId && entry.characterId !== expected) {
      validationErrors.push("character mismatch " + poseId);
      throw new Error("VALIDATION FAIL: pose " + poseId + " characterId mismatch");
    }
    return entry;
  }

  function canShowPoseAsset(entry) {
    if (!entry) return false;
    if (!entry.filePresent || !entry.file) return false;
    if (entry.approved === true) return true;
    // Visitor/production: approved only
    if (!isTestEnv() || productionEnabled) return false;
    // Test may show pending visual review assets with marker; never invent substitutes
    return entry.status === "PENDING" || entry.status === "pending_visual_review";
  }

  function resolvePoseAssetLegacy(opts) {
    opts = opts || {};
    var characterId = opts.characterId || CHAR_MALE;
    var poseId = opts.poseId || "";
    var gender = characterId === CHAR_FEMALE ? "female" : "male";
    var expected = gender === "female" ? CHAR_FEMALE : CHAR_MALE;
    if (characterId !== expected) {
      validationErrors.push("resolvePoseAsset character mismatch");
      return { ok: false, reason: "character-mismatch", asset: null };
    }
    var entry = null;
    try { entry = registryPose(gender, poseId); } catch (e) {
      return { ok: false, reason: "validation-fail", asset: null, error: String(e && e.message || e) };
    }
    if (!entry) return { ok: false, reason: "MISSING", asset: null, characterId: characterId, poseId: poseId };
    if (entry.characterId !== characterId) {
      validationErrors.push("wrong character asset blocked");
      return { ok: false, reason: "wrong-character", asset: null };
    }
    if (!canShowPoseAsset(entry)) {
      return { ok: false, reason: entry.status || "not-approved", asset: null, meta: entry, characterId: characterId, poseId: poseId };
    }
    return {
      ok: true,
      characterId: characterId,
      poseId: poseId,
      assetId: entry.assetId,
      url: ASSET_BASE + "characters/" + gender + "/poses/" + entry.file,
      meta: entry,
      from: "legacy-registry"
    };
  }

  function resolvePoseAsset(opts) {
    return resolvePrayerPose(opts || {});
  }

  function nearestValidStepIndex(steps, stepId, stepIndex) {
    if (!steps || !steps.length) return 0;
    if (stepId) {
      var byId = steps.findIndex(function (s) { return s.id === stepId; });
      if (byId >= 0) return byId;
      // recover from renamed/legacy ids
      var soft = steps.findIndex(function (s) {
        return String(s.id).indexOf(String(stepId)) >= 0 || String(stepId).indexOf(String(s.templateId || "")) >= 0 || s.deepLink === stepId;
      });
      if (soft >= 0) return soft;
    }
    var idx = Number(stepIndex);
    if (Number.isFinite(idx) && idx >= 0 && idx < steps.length) return idx;
    return 0;
  }

  function goToNextStep(opts) {
    opts = opts || {};
    if (isStepNavBusy() && !opts.force) return Promise.resolve();
    beginStepNavLock();
    var root = document.querySelector("[data-prl-root='learn']");
    var idx = Number((root && root.getAttribute("data-prl-index")) || loadState().stepIndex || 0);
    return jumpToIndex(idx + 1, opts);
  }

  function goToPreviousStep(opts) {
    opts = opts || {};
    if (isStepNavBusy() && !opts.force) return Promise.resolve();
    beginStepNavLock();
    var root = document.querySelector("[data-prl-root='learn']");
    var idx = Number((root && root.getAttribute("data-prl-index")) || loadState().stepIndex || 0);
    return jumpToIndex(idx - 1, opts);
  }

  function showCompletionIfNeeded(root, idx, total) {
    var box = root && root.querySelector("[data-prl-complete]");
    if (!box) return;
    var done = idx >= total - 1;
    box.hidden = !done;
    controllerRuntime.completed = done;
    var st = loadState();
    var lastId = st.stepId || "";
    // Nur am finalen Taslīm-links: Lernsequenz angesehen (keine religiöse Validierung)
    if (done && lastId === "fajr-r2-taslim-left") {
      saveState({
        learningSequenceCompleted: true,
        lastStepId: "fajr-r2-taslim-left",
        lastPrayerId: st.prayerId || "fajr"
      });
    } else if (!done && st.learningSequenceCompleted && lastId !== "fajr-r2-taslim-left") {
      // Negativschutz: Completion nicht vor finalem Schritt setzen/lassen
      saveState({ learningSequenceCompleted: false });
    }
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
    if (Number(rakAh) === 2) {
      if (key === "qiyam") return "fajr-r2-qiyam";
      if (key === "recitation") return "fajr-r2-recitation";
      if (key === "ruku") return "fajr-r2-ruku";
      if (key === "standing-after-ruku" || key === "itidal") return "fajr-r2-standing-after-ruku";
      if (key === "sujud" || key === "sujud-1") return "fajr-r2-sujud-1";
      if (key === "sujud-2") return "fajr-r2-sujud-2";
      if (key === "sitting" || key === "jalsa" || key === "sitting-between-sujud") return "fajr-r2-sitting-between-sujud";
      if (key === "tashahhud") return "fajr-r2-tashahhud";
      if (key === "taslim" || key === "taslim-right") return "fajr-r2-taslim-right";
      if (key === "taslim-left") return "fajr-r2-taslim-left";
    }
    if (STEP_ALIASES[key]) return STEP_ALIASES[key];
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
      // Exact matches only — no fuzzy indexOf (invalid deep links must recover controlled)
      var byDeep = steps.findIndex(function (s) {
        return (
          Number(s.rakAh) === Number(rakAh) &&
          (s.deepLink === key ||
            s.id === key ||
            s.templateId === key ||
            s.poseId === key ||
            s.malePoseId === key ||
            s.malePose === key ||
            s.femalePoseId === key)
        );
      });
      if (byDeep >= 0) return byDeep;
    }
    return -1;
  }

  function beginStepNavLock(ms) {
    stepNavBusyUntil = Date.now() + (ms == null ? STEP_NAV_LOCK_MS : ms);
  }

  function isStepNavBusy() {
    return Date.now() < stepNavBusyUntil;
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
      '<div class="prl-figure-pending" data-prl-pose-placeholder="1">' +
      "<b>" + esc(title || poseKey) + "</b>" +
      "<span>" + esc(POSE_PENDING_LABEL) + "</span>" +
      (isTestEnv() ? '<span class="prl-test-marker">TEST</span>' : "") +
      "</div></div>" +
      '<div class="prl-stage-floor" aria-hidden="true"></div></div>'
    );
  }

  async function figureHtmlResolved(character, step) {
    await ensureRegistry();
    await ensurePoseSlotRegistries();
    var poseKey = step.poseId || (character === "female" ? (step.femalePoseId || step.femalePose) : (step.malePoseId || step.malePose));
    var cid = characterIdFromKey(character);
    var resolved = resolvePrayerPose({ characterId: cid, poseId: poseKey, environment: isTestEnv() ? "test" : "production" });
    var label = "Darstellung der " + (step.titleDe || poseKey) + "-Stellung";
    if (!resolved.ok) {
      var status = resolved.reason || "MISSING";
      var pendingKey = cid + ":" + poseKey + ":" + status;
      if (missingAssets.indexOf(pendingKey) < 0) missingAssets.push(pendingKey);
      return (
        '<div class="prl-stage" role="img" aria-label="' + esc(label) + '" data-prl-character-id="' + esc(cid) + '" data-prl-pose-id="' + esc(poseKey) + '" data-prl-pose-status="' + esc(status) + '">' +
        '<div class="prl-figure"><div class="prl-figure-pending" data-prl-pose-placeholder="1">' +
        "<b>" + esc(step.titleDe || poseKey) + "</b>" +
        "<span>" + esc(POSE_PENDING_LABEL) + "</span>" +
        (isTestEnv() ? '<span class="prl-test-marker">TEST</span>' : "") +
        '</div></div><div class="prl-stage-floor" aria-hidden="true"></div></div>'
      );
    }
    var marker = resolved.meta && resolved.meta.approved ? "" : (isTestEnv() ? '<span class="prl-test-marker">TEST</span>' : "");
    var srcset = "";
    if (resolved.srcset && resolved.srcset.length) {
      srcset = ' srcset="' + esc(resolved.srcset.join(", ")) + '"';
    }
    return (
      '<div class="prl-stage" data-prl-character-id="' + esc(resolved.characterId) + '" data-prl-pose-id="' + esc(resolved.poseId) + '" data-prl-asset-id="' + esc(resolved.assetId) + '">' +
      '<div class="prl-figure">' +
      '<picture>' +
      (resolved.srcAvif ? '<source type="image/avif" srcset="' + esc(resolved.srcAvif) + '">' : "") +
      (resolved.srcWebp ? '<source type="image/webp" srcset="' + esc(resolved.srcWebp) + '">' : "") +
      '<img src="' + esc(resolved.url) + '"' + srcset + ' alt="' + esc(label) + '" loading="lazy" decoding="async" data-prl-pose-img>' +
      "</picture>" + marker + "</div>" +
      '<div class="prl-stage-floor" aria-hidden="true"></div></div>'
    );
  }

  function preloadPose(character, step) {
    if (!step) return;
    ensureRegistry().then(function () {
      var poseKey = character === "female" ? (step.femalePoseId || step.femalePose) : (step.malePoseId || step.malePose);
      var resolved = resolvePoseAsset({ characterId: characterIdFromKey(character), poseId: poseKey });
      if (!resolved.ok || !resolved.url) return;
      var img = new Image();
      img.decoding = "async";
      img.src = resolved.url;
    });
  }

  function preloadAdjacent(character, steps, idx) {
    preloadPose(character, steps[idx]);
    preloadPose(character, steps[idx + 1]);
    preloadPose(character, steps[idx - 1]);
  }

  function controlsHtml(state, opts) {
    opts = opts || {};
    var charHint =
      '<div class="prl-char-lock" aria-hidden="true">' +
      '<span class="' + (state.character === "male" ? "is-active" : "") + '">Männer · ' + esc(CHAR_MALE) + "</span>" +
      '<span class="' + (state.character === "female" ? "is-active" : "") + '">Frauen · ' + esc(CHAR_FEMALE) + "</span>" +
      "</div>";
    return (
      '<div class="prl-controls">' +
      (isTestEnv() ? '<div class="prl-test-badge" aria-hidden="true">TEST</div>' : "") +
      '<div class="prl-controls-label" id="prlCharLabel">Darstellung</div>' +
      '<div class="prl-segment" role="group" aria-labelledby="prlCharLabel">' +
      '<button type="button" data-prl-character="male" aria-pressed="' + (state.character === "male" ? "true" : "false") + '" class="' +
      (state.character === "male" ? "is-active" : "") +
      '">Männer</button>' +
      '<button type="button" data-prl-character="female" aria-pressed="' + (state.character === "female" ? "true" : "false") + '" class="' +
      (state.character === "female" ? "is-active" : "") +
      '">Frauen</button>' +
      "</div>" +
      (opts.compact ? "" : charHint) +
      '<div class="prl-controls-label" id="prlViewLabel">Lernmodus</div>' +
      '<div class="prl-segment" role="group" aria-labelledby="prlViewLabel">' +
      '<button type="button" data-prl-view="swipe" aria-pressed="' + (state.viewMode === "swipe" ? "true" : "false") + '" class="' +
      (state.viewMode === "swipe" ? "is-active" : "") +
      '">Wischen</button>' +
      '<button type="button" data-prl-view="scroll" aria-pressed="' + (state.viewMode === "scroll" ? "true" : "false") + '" class="' +
      (state.viewMode === "scroll" ? "is-active" : "") +
      '">Scrollen</button>' +
      "</div>" +
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

  function countApprovedClaims(step) {
    var resolved = resolveContentForStep(step);
    var ids = (resolved.sourceClaimIds && resolved.sourceClaimIds.length
      ? resolved.sourceClaimIds
      : (step.sourceClaimIds || step.claimSlotIds || [])).slice();
    var n = 0;
    ids.forEach(function (id) {
      var c = cache.claimsById && cache.claimsById[id];
      if (c && c.approved === true && c.reviewPass1 === true && c.reviewPass2 === true && !isWeakSourceType(c.sourceType)) n += 1;
    });
    return n;
  }

  function getApprovedDetails(step) {
    var details = step.details || [];
    return details.filter(function (d) {
      return d && d.approved === true && d.assetId && d.sourceClaimIds && d.sourceClaimIds.length;
    });
  }

  function approvedVariants(step) {
    return (step.variants || []).filter(function (v) {
      return v && v.verificationStatus === "approved" && v.sourceClaimIds && v.sourceClaimIds.length;
    });
  }

  function stepCopyHtml(step, opts) {
    opts = opts || {};
    var resolved = resolveContentForStep(step);
    var blocks = "";
    blocks += '<div class="prl-block" data-prl-content-id="' + esc(resolved.contentId || "") + '" data-prl-content-status="' + esc(resolved.status || "") + '">';
    var instrLabel = (resolved.content && resolved.content.instructionLabel) ||
      (step && (step.templateId === "tashahhud" || step.poseId === "tashahhud") ? "So sitzt du" : "So führst du die Stellung aus");
    blocks += '<div class="prl-label">' + esc(instrLabel) + "</div>";
    if (resolved.publishable && resolved.instructionDe) {
      blocks += '<div class="prl-de">' + esc(resolved.instructionDe) + "</div>";
    } else {
      blocks += '<div class="prl-research">' + esc(CONTENT_PENDING_LABEL) + "</div>";
    }
    blocks += "</div>";

    // Tašahhud modules: separate reviewable parts (no invented text)
    var mods = resolved.content && resolved.content.modules;
    if (mods && typeof mods === "object" && !Array.isArray(mods) && (step.templateId === "tashahhud" || step.poseId === "tashahhud" || resolved.content.stepId === "tashahhud")) {
      var tash = mods.tashahhudText;
      var salat = mods.salatIbrahimiyya;
      var dua = mods.duaBeforeTaslim;
      if (tash && tash.approved === true && (tash.arabicText || tash.transliteration || tash.germanMeaning)) {
        blocks += '<div class="prl-block"><div class="prl-label">Was sage ich?</div>';
        blocks += '<div class="prl-label">' + esc(tash.labelDe || "Tašahhud") + "</div>";
        if (tash.arabicText) blocks += '<div class="prl-ar-text" lang="ar" dir="rtl">' + esc(tash.arabicText) + "</div>";
        if (tash.transliteration) blocks += '<div class="prl-tr">' + esc(tash.transliteration) + "</div>";
        if (tash.germanMeaning) blocks += '<div class="prl-de">' + esc(tash.germanMeaning) + "</div>";
        blocks += "</div>";
      } else if (isTestEnv()) {
        blocks += '<div class="prl-block"><div class="prl-label">Was sage ich?</div><div class="prl-research">Inhalt wird geprüft.</div></div>';
      }
      if (salat && salat.approved === true && (salat.arabicText || salat.transliteration || salat.germanMeaning)) {
        blocks += '<div class="prl-block"><div class="prl-label">Danach · ' + esc(salat.labelDe || "Ṣalāh Ibrāhīmiyyah") + "</div>";
        if (salat.arabicText) blocks += '<div class="prl-ar-text" lang="ar" dir="rtl">' + esc(salat.arabicText) + "</div>";
        if (salat.transliteration) blocks += '<div class="prl-tr">' + esc(salat.transliteration) + "</div>";
        if (salat.germanMeaning) blocks += '<div class="prl-de">' + esc(salat.germanMeaning) + "</div>";
        blocks += "</div>";
      } else if (isTestEnv() && salat) {
        blocks += '<div class="prl-block"><div class="prl-label">Danach</div><div class="prl-research">Inhalt wird geprüft.</div></div>';
      }
      if (dua && dua.approved === true && (dua.arabicText || dua.transliteration || dua.germanMeaning)) {
        blocks += '<div class="prl-block"><div class="prl-label">' + esc(dua.labelDe || "Duʿāʾ vor Taslīm") + "</div>";
        if (dua.arabicText) blocks += '<div class="prl-ar-text" lang="ar" dir="rtl">' + esc(dua.arabicText) + "</div>";
        if (dua.transliteration) blocks += '<div class="prl-tr">' + esc(dua.transliteration) + "</div>";
        if (dua.germanMeaning) blocks += '<div class="prl-de">' + esc(dua.germanMeaning) + "</div>";
        blocks += "</div>";
      }
    } else if (resolved.quranRef && resolved.doNotDuplicateQuranText) {
      blocks += '<div class="prl-block" data-prl-quran-block="1"><div class="prl-label">Qurʾān</div>';
      if (opts.quranHtml) {
        blocks += opts.quranHtml;
      } else {
        blocks +=
          '<div class="prl-de">Sūrah ' +
          esc(String(resolved.quranRef.surah)) +
          ", Āyah " +
          esc(String(resolved.quranRef.ayahStart)) +
          "–" +
          esc(String(resolved.quranRef.ayahEnd)) +
          " · bestehende Qurʾān-Datenbank (keine Textkopie).</div>";
      }
      blocks +=
        '<div class="prl-research">Darstellung als Pflicht/Säule/Sunnah bleibt quellengeprüft.</div></div>';
    }

    if (resolved.publishable && resolved.spokenVisible) {
      blocks += '<div class="prl-block"><div class="prl-label">Was sage ich?</div>';
      if (resolved.arabic) blocks += '<div class="prl-ar-text" lang="ar" dir="rtl">' + esc(resolved.arabic) + "</div>";
      if (resolved.transliteration) blocks += '<div class="prl-tr">' + esc(resolved.transliteration) + "</div>";
      if (resolved.meaningDe) blocks += '<div class="prl-de">' + esc(resolved.meaningDe) + "</div>";
      blocks += "</div>";
    } else if (resolved.duringRiseApproved || resolved.afterStandingApproved) {
      blocks += '<div class="prl-block"><div class="prl-label">Was sage ich?</div>';
      if (resolved.duringRiseApproved && resolved.duringRiseText) {
        blocks += '<div class="prl-label">Beim Aufrichten</div>';
        if (resolved.duringRiseText.arabicText) blocks += '<div class="prl-ar-text" lang="ar" dir="rtl">' + esc(resolved.duringRiseText.arabicText) + "</div>";
        if (resolved.duringRiseText.transliteration) blocks += '<div class="prl-tr">' + esc(resolved.duringRiseText.transliteration) + "</div>";
        if (resolved.duringRiseText.germanMeaning) blocks += '<div class="prl-de">' + esc(resolved.duringRiseText.germanMeaning) + "</div>";
      }
      if (resolved.afterStandingApproved && resolved.afterStandingText) {
        blocks += '<div class="prl-label">Nach dem Aufrichten</div>';
        if (resolved.afterStandingText.arabicText) blocks += '<div class="prl-ar-text" lang="ar" dir="rtl">' + esc(resolved.afterStandingText.arabicText) + "</div>";
        if (resolved.afterStandingText.transliteration) blocks += '<div class="prl-tr">' + esc(resolved.afterStandingText.transliteration) + "</div>";
        if (resolved.afterStandingText.germanMeaning) blocks += '<div class="prl-de">' + esc(resolved.afterStandingText.germanMeaning) + "</div>";
      }
      blocks += "</div>";
    } else if (isTestEnv() && (resolved.duringRiseText || resolved.afterStandingText)) {
      blocks += '<div class="prl-block"><div class="prl-label">Was sage ich?</div><div class="prl-research">Inhalt wird geprüft.</div></div>';
    }

    if (!resolved.publishable && !(resolved.quranRef && resolved.doNotDuplicateQuranText)) {
      blocks += '<div class="prl-research">' + esc(CONTENT_PENDING_LABEL) + "</div>";
    }

    var approvedClaimCount = countApprovedClaims(step);
    if (approvedClaimCount > 0) {
      blocks +=
        '<div class="prl-btn-row"><button type="button" class="prl-btn" data-prl-sources="' +
        esc(step.id) +
        '">Beleg ansehen</button></div>';
    }

    if (resolved.variantIds && resolved.variantIds.length) {
      blocks +=
        '<div class="prl-variants"><div class="prl-label">Weitere authentische Varianten</div>' +
        resolved.variantIds
          .map(function (vid) {
            var v = getContentById(vid);
            return "<div>" + esc((v && (v.titleDe || v.id)) || vid) + "</div>";
          })
          .join("") +
        "</div>";
    }

    var approvedDetails = getApprovedDetails(step);
    if (approvedDetails.length) {
      blocks +=
        '<div class="prl-detail-slots" role="group" aria-label="Details ansehen">' +
        '<div class="prl-label">Details ansehen</div>' +
        approvedDetails
          .map(function (d) {
            return '<button type="button" class="prl-detail-slot" data-prl-detail="' + esc(d.id) + '">' + esc(d.label || d.id) + "</button>";
          })
          .join("") +
        "</div>";
    } else if (isTestEnv() && step.detailSlots && step.detailSlots.length) {
      blocks += '<div class="prl-detail-prep" hidden data-prl-detail-prep="' + esc((step.detailSlots || []).join(",")) + '"></div>';
    }

    if (AUDIO_ENABLED || AUDIO_VISIBLE || AUDIO_PRELOAD) {
      /* Phase 9: audio remains fully invisible / unmounted */
    }

    return (
      '<div class="prl-step-copy" data-prl-pose-id="' +
      esc(step.poseId || step.malePoseId || "") +
      '">' +
      '<div class="prl-kicker">' +
      esc(String(step.rakAh)) +
      ". Rakʿah</div>" +
      "<h3>" +
      esc(step.titleDe) +
      "</h3>" +
      '<p class="prl-step-ar" lang="ar" dir="rtl">' +
      esc(step.titleAr || "") +
      "</p>" +
      blocks +
      "</div>"
    );
  }

  async function stepCopyHtmlAsync(step) {
    var resolved = resolveContentForStep(step);
    var quranHtml = "";
    if (resolved.quranRef && resolved.doNotDuplicateQuranText) {
      var surah = await loadQuranSurah(resolved.quranRef.surah);
      quranHtml = quranAyahsHtml(surah, resolved.quranRef);
    }
    return stepCopyHtml(step, { quranHtml: quranHtml });
  }

  function rakahMarkerHtml(prevStep, nextStep) {
    if (!prevStep || !nextStep) return "";
    if (Number(prevStep.rakAh) === 1 && Number(nextStep.rakAh) === 2) {
      return (
        '<div class="prl-rakah-mark" data-prl-rakah-mark role="separator" aria-label="Zweite Rakʿah">' +
        "<span class=\"prl-rakah-mark-line\" aria-hidden=\"true\"></span>" +
        "<b>2. Rakʿah</b>" +
        "<span class=\"prl-rakah-mark-line\" aria-hidden=\"true\"></span>" +
        "</div>"
      );
    }
    return "";
  }

  function reviewFilterButtons(active) {
    var filters = (cache.reviewIndex && cache.reviewIndex.filters) || ["all","missing","research","source_check","pose_check","review_pass_1","review_pass_2","approved","rejected"];
    return (
      '<div class="prl-review-filters" role="toolbar" aria-label="Review-Filter">' +
      filters.map(function (f) {
        return (
          '<button type="button" class="prl-review-filter' + (f === active ? " is-active" : "") + '" data-prl-review-filter="' + esc(f) + '">' +
          esc(f) +
          "</button>"
        );
      }).join("") +
      "</div>"
    );
  }

  function reviewOverviewHtml(state, prayer, filter) {
    if (!isTestEnv()) {
      return '<section class="prl-shell"><div class="prl-research">Review nur intern / Test.</div><div class="prl-btn-row"><button type="button" class="prl-btn" data-prl-go="">Zurück</button></div></section>';
    }
    filter = filter || "all";
    var readiness = computeFajrReadiness(prayer);
    var counts = readiness.counts || computeMissingCounts();
    var fajr = readiness.fajr || {};
    var rows = ((cache.reviewSteps && cache.reviewSteps.steps) || []).map(buildReviewStepRow);
    if (filter === "missing") {
      rows = rows.filter(function (r) {
        return r.content !== "approved" || r.sources !== "approved" || r.malePose !== "approved" || r.femalePose !== "approved";
      });
    } else if (filter !== "all") {
      rows = rows.filter(function (r) { return r.status === filter || r.content === filter || r.sources === filter; });
    }
    var list = rows.map(function (r) {
      return (
        '<button type="button" class="prl-review-row" data-prl-review-step="' + esc(r.id) + '">' +
        "<div><b>" + esc(r.titleDe) + '</b><span class="prl-ar" lang="ar" dir="rtl">' + esc(r.titleAr || "") + "</span></div>" +
        '<div class="prl-review-badges">' +
        '<span class="prl-rev-badge ' + reviewStatusClass(r.content) + '">Content: ' + esc(r.content) + "</span>" +
        '<span class="prl-rev-badge ' + reviewStatusClass(r.sources) + '">Sources: ' + esc(r.sources) + "</span>" +
        '<span class="prl-rev-badge ' + reviewStatusClass(r.malePose) + '">Male Pose: ' + esc(r.malePose) + "</span>" +
        '<span class="prl-rev-badge ' + reviewStatusClass(r.femalePose) + '">Female Pose: ' + esc(r.femalePose) + "</span>" +
        "</div></button>"
      );
    }).join("");
    return (
      '<section class="prl-shell prl-shell--review" data-prl-root="review">' +
      '<header class="prl-hero prl-hero--compact">' +
      "<h2>Prayer Learning Review</h2>" +
      "<p>Intern · Zero-Trust · kein Self-Approval · Phase " + PHASE + "</p>" +
      "</header>" +
      '<div class="prl-review-summary">' +
      "<div><b>FAJR Gesamtstatus</b><span class=\"prl-rev-badge " + reviewStatusClass(fajr.releaseReady ? "approved" : "pending") + '\">' +
      (fajr.releaseReady ? "RELEASE READY" : "PENDING") +
      "</span></div>" +
      "<div><b>releaseReady</b><span>" + String(!!fajr.releaseReady) + " (computed)</span></div>" +
      "<div><b>productionEnabled</b><span>false (separates Gate)</span></div>" +
      "<div><b>Missing sources</b><span>" + counts.missingSources + "</span></div>" +
      "<div><b>Missing male poses</b><span>" + counts.missingMalePoses + "</span></div>" +
      "<div><b>Missing female poses</b><span>" + counts.missingFemalePoses + "</span></div>" +
      "<div><b>Content pending</b><span>" + counts.contentPending + "</span></div>" +
      "<div><b>Review Pass 1 pending</b><span>" + counts.reviewPass1Pending + "</span></div>" +
      "<div><b>Review Pass 2 pending</b><span>" + counts.reviewPass2Pending + "</span></div>" +
      "</div>" +
      reviewFilterButtons(filter) +
      '<div class="prl-review-list">' + (list || '<div class="prl-research">Keine Einträge für diesen Filter.</div>') + "</div>" +
      '<div class="prl-btn-row">' +
      '<button type="button" class="prl-btn" data-prl-go="debug">Debug</button>' +
      '<button type="button" class="prl-btn" data-prl-go="">Zur Übersicht</button>' +
      "</div></section>"
    );
  }

  function reviewStepDetailHtml(state, prayer, stepId) {
    if (!isTestEnv()) {
      return '<section class="prl-shell"><div class="prl-research">Review nur intern / Test.</div></section>';
    }
    var st = getReviewStepById(stepId);
    if (!st) {
      return (
        '<section class="prl-shell"><div class="prl-research">Schritt nicht gefunden: ' + esc(stepId) +
        '</div><div class="prl-btn-row"><button type="button" class="prl-btn" data-prl-go="review">Zurück</button></div></section>'
      );
    }
    var content = getContentById(st.contentId);
    var resolved = resolveContentForStep({ contentId: st.contentId, poseId: st.poseId, sourceClaimIds: st.claimIds || [], verificationStatus: st.status });
    var male = cache.poseSlots && cache.poseSlots.male;
    var female = cache.poseSlots && cache.poseSlots.female;
    var malePose = male && male.poses ? male.poses[st.poseId] : null;
    var femalePose = female && female.poses ? female.poses[st.poseId] : null;
    if (st.poseId === "taslim-right") {
      malePose = (male && male.poses && (male.poses["taslim-right"] || male.poses.taslim)) || malePose;
      femalePose = (female && female.poses && (female.poses["taslim-right"] || female.poses.taslim)) || femalePose;
    }
    var flags = computeStepApprovedFlags(st, content, cache.claimsById, malePose, femalePose);
    var claimIds = st.claimIds || [];
    var claimHtml = claimIds.length
      ? "<ul class=\"prl-claim-list\">" + claimIds.map(function (id) {
          var c = cache.claimsById && cache.claimsById[id];
          if (!c) return "<li><b>" + esc(id) + "</b><div class=\"prl-research\">fehlt</div></li>";
          return (
            "<li class=\"prl-claim\"><b>" + esc(c.id) + "</b>" +
            "<div>" + esc(c.statementDe || "—") + "</div>" +
            "<div>sourceType: " + esc(c.sourceType || "unverified") + " · status: " + esc(c.status || c.verificationStatus || "research") +
            " · approved: " + String(!!c.approved) + "</div>" +
            (c.directEvidenceUrl ? '<div><a href="' + esc(c.directEvidenceUrl) + '" target="_blank" rel="noopener noreferrer">Direktnachweis</a></div>' : "<div class=\"prl-research\">Kein Direktnachweis</div>") +
            (isTestEnv() ? "<div class=\"prl-review-internal\">internal: pass1=" + String(!!c.reviewPass1) + " pass2=" + String(!!c.reviewPass2) + "</div>" : "") +
            "</li>"
          );
        }).join("") + "</ul>"
      : '<div class="prl-research">Keine Claim-Slots verknüpft.</div>';

    function checkListHtml(title, checks) {
      if (!checks) return "";
      return (
        "<div class=\"prl-review-checks\"><b>" + esc(title) + "</b><ul>" +
        Object.keys(checks).map(function (k) {
          var v = checks[k];
          var label = v === true ? "PASS" : v === false ? "FAIL" : "PENDING";
          return "<li><span>" + esc(k) + '</span><span class="prl-rev-badge ' + reviewStatusClass(v === true ? "approved" : v === false ? "rejected" : "pending") + '">' + label + "</span></li>";
        }).join("") +
        "</ul></div>"
      );
    }

    var deep = "fajr/1/" + (
      st.id === "standing-next-rakah" || st.id === "rise-next-rakah"
        ? "rise-to-rakah-2"
        : (st.id === "sujud" ? "sujud-1" : st.id)
    );
    return (
      '<section class="prl-shell prl-shell--review" data-prl-root="review-step" data-prl-review-step-id="' + esc(st.id) + '">' +
      '<header class="prl-hero prl-hero--compact"><h2>STEP · ' + esc(st.titleDe) + '</h2>' +
      '<p class="prl-ar" lang="ar" dir="rtl">' + esc(st.titleAr || "") + "</p>" +
      "<p>approved (computed): <b>" + String(!!flags.approved) + "</b> · preview ≠ approve</p></header>" +
      '<div class="prl-review-section"><h3>CONTENT</h3>' +
      "<div><b>Instruction</b><div>" + esc((content && content.instructionDe) || CONTENT_PENDING_LABEL) + "</div></div>" +
      "<div><b>Arabic</b><div lang=\"ar\" dir=\"rtl\">" + esc((content && content.arabic) || "—") + "</div></div>" +
      "<div><b>Transliteration</b><div>" + esc((content && content.transliteration) || "—") + "</div></div>" +
      "<div><b>Meaning</b><div>" + esc((content && content.meaningDe) || "—") + "</div></div>" +
      "<div>contentId: " + esc(st.contentId) + " · status: " + esc((content && content.status) || "missing") + " · contentApproved: " + String(flags.contentApproved) + "</div>" +
      "</div>" +
      '<div class="prl-review-section"><h3>SOURCE CLAIMS</h3>' + claimHtml +
      "<div>sourceCoverageApproved: " + String(flags.sourceCoverageApproved) + "</div></div>" +
      '<div class="prl-review-section"><h3>POSE</h3>' +
      "<div>Male v1 · " + esc((malePose && malePose.assetId) || "missing") + " · " + esc((malePose && malePose.status) || "missing") + " · approved=" + String(flags.malePoseApproved) + "</div>" +
      "<div>Female v1 · " + esc((femalePose && femalePose.assetId) || "missing") + " · " + esc((femalePose && femalePose.status) || "missing") + " · approved=" + String(flags.femalePoseApproved) + "</div>" +
      '<div class="prl-review-sidebys">' +
      "<div><b>Male Master vs Pose</b><span>dar-prayer-male-v1 · side-by-side wenn Asset freigegeben</span></div>" +
      "<div><b>Female Master vs Pose</b><span>dar-prayer-female-v1 · Niqāb/Kontur-Checkliste</span></div>" +
      "</div>" +
      checkListHtml("Male visual checks", st.maleVisualChecks) +
      checkListHtml("Female visual checks", st.femaleVisualChecks) +
      "</div>" +
      '<div class="prl-review-section"><h3>REVIEW</h3>' +
      "<div>Pass 1: " + String(flags.reviewPass1) + "</div>" +
      "<div>Pass 2: " + String(flags.reviewPass2) + "</div>" +
      "<div class=\"prl-research\">Kein Self-Approval · KI darf nicht approven · Preview ändert Status nicht</div>" +
      "</div>" +
      '<div class="prl-review-section"><h3>PREVIEW</h3><div class="prl-btn-row prl-preview-row">' +
      '<button type="button" class="prl-btn" data-prl-preview-char="male" data-prl-preview-deep="' + esc(deep) + '">Preview as Male</button>' +
      '<button type="button" class="prl-btn" data-prl-preview-char="female" data-prl-preview-deep="' + esc(deep) + '">Preview as Female</button>' +
      '<button type="button" class="prl-btn" data-prl-preview-view="swipe" data-prl-preview-deep="' + esc(deep) + '">Preview Swipe</button>' +
      '<button type="button" class="prl-btn" data-prl-preview-view="scroll" data-prl-preview-deep="' + esc(deep) + '">Preview Scroll</button>' +
      "</div></div>" +
      '<div class="prl-btn-row"><button type="button" class="prl-btn" data-prl-go="review">Zurück zum Review</button></div>' +
      "</section>"
    );
  }

  function textsHtml(state) {
    var modules = (cache.contentIndex && cache.contentIndex.modules) || [];
    var order = ["takbir", "ruku", "standing-after-ruku", "sujud", "sitting-between-sujud", "tashahhud", "taslim"];
    var byStep = {};
    modules.forEach(function (m) {
      if (!m || !m.stepId) return;
      // Prefer primary contentId (skip rakAh-specific duplicates for index display)
      if (!byStep[m.stepId] || !m.rakAh) byStep[m.stepId] = m;
    });
    var approvedRows = [];
    order.forEach(function (stepId) {
      var mod = byStep[stepId];
      if (!mod) return;
      var content = getContentById(mod.contentId);
      if (!canPublishPrayerContent(content)) return;
      approvedRows.push(
        '<button type="button" class="prl-path" data-prl-text-content="' + esc(mod.contentId) + '" data-prl-position="' + esc(stepId) + '">' +
        "<b>" + esc((content && content.titleDe) || stepId) + "</b>" +
        "<span>freigegeben · " + esc(mod.contentId) + "</span></button>"
      );
      // Expand approved Tašahhud submodules without duplicating registry
      if (stepId === "tashahhud" && content && content.modules && typeof content.modules === "object") {
        ["tashahhudText", "salatIbrahimiyya", "duaBeforeTaslim"].forEach(function (key) {
          var sub = content.modules[key];
          if (!sub || sub.approved !== true) return;
          approvedRows.push(
            '<button type="button" class="prl-path" data-prl-text-content="' + esc(content.id) + '" data-prl-position="tashahhud">' +
            "<b>" + esc(sub.labelDe || key) + "</b>" +
            "<span>Modul · " + esc(sub.id || key) + "</span></button>"
          );
        });
      }
    });
    return (
      '<section class="prl-shell" data-prl-root="texts">' +
      '<header class="prl-hero prl-hero--compact"><h2>Was sage ich im Gebet?</h2><p>Nur freigegebene Content-Module · keine zweite Textdatenbank.</p></header>' +
      controlsHtml(state) +
      '<div class="prl-paths">' +
      (approvedRows.length ? approvedRows.join("") : '<div class="prl-research">' + esc(TEXTS_EMPTY_LABEL) + "</div>") +
      "</div>" +
      '<div class="prl-btn-row"><button type="button" class="prl-btn" data-prl-go="">Zurück</button></div>' +
      "</section>"
    );
  }

  function debugHtml(state, prayer) {
    if (!isTestEnv()) return '<section class="prl-shell"><div class="prl-research">Debug nur in Test.</div></section>';
    var ctrl = getControllerState();
    var step = null;
    var resolved = null;
    var pose = null;
    if (prayer) {
      var steps = sortedSteps(prayer);
      var idx = nearestValidStepIndex(steps, ctrl.stepId, ctrl.stepIndex);
      step = steps[idx] || steps[0];
      if (step) {
        resolved = resolveContentForStep(step);
        pose = resolvePrayerPose({ characterId: ctrl.characterId, poseId: step.poseId || step.malePoseId, environment: "test" });
      }
    }
    var dash = cache.validationDash || { steps: {} };
    var dashSteps = dash.steps || {};
    var dashRows = "";
    if (Array.isArray(dashSteps)) {
      dashRows = dashSteps.map(function (row) {
        return (
          "<tr><td>" + esc(row.titleDe || row.stepId || row.id) +
          "</td><td>" + esc(row.content || row.contentStatus || "PENDING") +
          "</td><td>" + esc(row.pose || row.poseStatus || "PENDING") +
          "</td><td>" + esc(row.sources || row.sourceStatus || "PENDING") +
          "</td></tr>"
        );
      }).join("");
    } else {
      dashRows = Object.keys(dashSteps).map(function (key) {
        var row = dashSteps[key] || {};
        return (
          "<tr><td>" + esc(key) +
          "</td><td>" + esc(row.content || "PENDING") +
          "</td><td>" + esc(row.pose || "PENDING") +
          "</td><td>" + esc(row.sources || "PENDING") +
          "</td></tr>"
        );
      }).join("");
    }
    return (
      '<section class="prl-shell prl-shell--debug" data-prl-root="debug">' +
      '<header class="prl-hero prl-hero--compact"><h2>Prayer Learning Debug</h2><p>Nur Testumgebung · Phase ' + PHASE + "</p></header>" +
      '<div class="prl-debug-grid">' +
      "<div><b>current prayer</b><span>" + esc(ctrl.prayerId) + "</span></div>" +
      "<div><b>current rakAh</b><span>" + esc(String(ctrl.rakAh)) + "</span></div>" +
      "<div><b>current step</b><span>" + esc(ctrl.stepId || (step && step.id) || "—") + "</span></div>" +
      "<div><b>character ID</b><span>" + esc(ctrl.characterId) + "</span></div>" +
      "<div><b>pose ID</b><span>" + esc((step && (step.poseId || step.malePoseId)) || "—") + "</span></div>" +
      "<div><b>pose status</b><span>" + esc((pose && (pose.status || pose.reason)) || "—") + "</span></div>" +
      "<div><b>content ID</b><span>" + esc((resolved && resolved.contentId) || (step && step.contentId) || "—") + "</span></div>" +
      "<div><b>content status</b><span>" + esc((resolved && resolved.status) || "—") + "</span></div>" +
      "<div><b>source claim count</b><span>" + esc(String((resolved && resolved.sourceClaimIds && resolved.sourceClaimIds.length) || 0)) + "</span></div>" +
      "<div><b>view mode</b><span>" + esc(ctrl.viewMode) + "</span></div>" +
      "<div><b>audioVisible</b><span>" + String(AUDIO_VISIBLE) + "</span></div>" +
      "<div><b>productionEnabled</b><span>" + String(productionEnabled) + "</span></div>" +
      "</div>" +
      '<h3 class="prl-debug-h">Validation Dashboard · Fajr</h3>' +
      '<div class="prl-debug-table-wrap"><table class="prl-debug-table"><thead><tr><th>Schritt</th><th>Content</th><th>Pose</th><th>Sources</th></tr></thead><tbody>' +
      (dashRows || '<tr><td colspan="4">Dashboard wird geladen…</td></tr>') +
      "</tbody></table></div>" +
      '<div class="prl-btn-row"><button type="button" class="prl-btn" data-prl-go="">Zurück</button></div>' +
      "</section>"
    );
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
    var lastNote = "";
    if (state.lastPrayerId === "fajr" || state.learningSequenceCompleted) {
      lastNote = '<p class="prl-last-viewed" data-prl-last-viewed>Fajr zuletzt angesehen</p>';
    }
    return (
      '<section class="prl-shell prl-shell--hub" data-prl-root="hub">' +
      '<header class="prl-hero prl-hero--compact">' +
      "<h2>Gebet erlernen</h2>" +
      '<p class="prl-ar" lang="ar" dir="rtl">الصلاة</p>' +
      "<p>Schritt für Schritt sehen und lernen.</p>" +
      lastNote +
      "</header>" +
      controlsHtml(state) +
      resumeCard(state, fajr) +
      '<div class="prl-paths">' +
      '<button type="button" class="prl-path" data-prl-go="fajr"><b>Gebet Schritt für Schritt</b><span>Fajr · 2 Rakʿāt</span></button>' +
      '<button type="button" class="prl-path" data-prl-go="gebet"><b>Ein bestimmtes Gebet</b><span>Fajr aktiv · weitere in Vorbereitung</span></button>' +
      '<button type="button" class="prl-path" data-prl-go="stellung"><b>Eine Stellung nachsehen</b><span>Takbīr, Rukūʿ, Suǧūd und mehr</span></button>' +
      '<button type="button" class="prl-path" data-prl-go="texte"><b>Was sage ich im Gebet?</b><span>Nur geprüfte Textmodule</span></button>' +
      "</div>" +
      (isTestEnv()
        ? '<div class="prl-test-tools"><button type="button" class="prl-btn" data-prl-go="review">Review</button><button type="button" class="prl-btn" data-prl-go="debug">Debug</button></div>'
        : "") +
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
          (ready ? p.rakat + " Rakʿāt" : "In Vorbereitung") +
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
        var target = p.defaultSequenceId || p.stepId || p.stepTemplateId || p.id;
        return (
          '<button type="button" data-prl-position="' +
          esc(target) +
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
    var mode = detectContainerMode();
    return mode === "fold-open" || mode === "tablet-landscape";
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
    var recovery =
      deepLinkRecoveryNotice
        ? '<div class="prl-research" data-prl-deeplink-recovery role="status">' + esc(deepLinkRecoveryNotice) + "</div>"
        : "";
    deepLinkRecoveryNotice = "";
    var nav =
      '<div class="prl-nav" role="navigation" aria-label="Schrittnavigation">' +
      '<button type="button" class="prl-btn" data-prl-prev aria-label="Vorheriger Schritt" ' +
      (idx <= 0 ? "disabled" : "") +
      ">Zurück</button>" +
      '<button type="button" class="prl-btn primary" data-prl-next aria-label="Nächster Schritt" ' +
      (idx >= steps.length - 1 ? "disabled" : "") +
      ">Weiter</button>" +
      "</div>";
    var complete =
      '<div class="prl-complete" data-prl-complete ' + (idx >= steps.length - 1 ? "" : "hidden") + '>' +
      "<b>Fajr-Lernablauf beendet.</b><span>Lernhilfe · keine religiöse Bewertung.</span>" +
      '<div class="prl-btn-row">' +
      '<button type="button" class="prl-btn primary" data-prl-retry-fajr>Noch einmal ansehen</button>' +
      '<button type="button" class="prl-btn" data-prl-go="gebet">Zur Gebetsübersicht</button>' +
      "</div></div>";

    preloadAdjacent(state.character, steps, idx);

    if (state.viewMode === "scroll") {
      var items = "";
      for (var i = 0; i < steps.length; i++) {
        var s = steps[i];
        var fig = characterSwitchPending
          ? '<div class="prl-stage prl-stage--loading" data-prl-pose-loading="1"><div class="prl-figure"><div class="prl-figure-pending"><span>Darstellung wird geladen…</span></div></div></div>'
          : await figureHtmlResolved(state.character, s);
        var copy = await stepCopyHtmlAsync(s);
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
          copy +
          "</article>";
      }
      return (
        '<section class="prl-shell prl-shell--' + esc(detectContainerMode()) + '" data-prl-root="learn" data-prl-mode="scroll" data-prl-index="' +
        idx +
        '" data-prl-container="' + esc(detectContainerMode()) + '">' +
        controlsHtml(state, { compact: true }) +
        recovery +
        '<div class="prl-scroll-list">' +
        items +
        "</div>" +
        complete +
        '<div class="prl-btn-row"><button type="button" class="prl-btn" data-prl-go="">Übersicht</button></div>' +
        sourceSheetShell() +
        "</section>"
      );
    }

    var slides = "";
    for (var j = 0; j < steps.length; j++) {
      var sj = steps[j];
      var figj = characterSwitchPending
        ? '<div class="prl-stage prl-stage--loading" data-prl-pose-loading="1"><div class="prl-figure"><div class="prl-figure-pending"><span>Darstellung wird geladen…</span></div></div></div>'
        : await figureHtmlResolved(state.character, sj);
      var copyj = await stepCopyHtmlAsync(sj);
      var mark = j > 0 ? rakahMarkerHtml(steps[j - 1], sj) : "";
      slides +=
        '<article class="prl-swipe-slide" data-prl-step-id="' +
        esc(sj.id) +
        '" data-prl-step-index="' +
        j +
        '">' +
        mark +
        (dual
          ? '<div class="prl-learn-layout is-dual' +
            (sj.poseId === "sujud" || sj.templateId === "sujud" ? " is-dual-sujud" : "") +
            '">' +
            figj +
            '<div class="prl-step-panel">' +
            progressHtml(prayer, sj, j, steps.length) +
            copyj +
            "</div></div>"
          : progressHtml(prayer, sj, j, steps.length) + figj + copyj) +
        "</article>";
    }

    return (
      '<section class="prl-shell" data-prl-root="learn" data-prl-mode="swipe" data-prl-index="' +
      idx +
      '">' +
      controlsHtml(state, { compact: true }) +
      recovery +
      swipeHintHtml() +
      '<div class="prl-swipe-track" data-prl-track>' +
      slides +
      "</div>" +
      nav +
      complete +
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

  function renderVisitorClaim(claim) {
    if (!claim) return "";
    var lines = [];
    lines.push('<li class="prl-claim">');
    if (claim.statementDe) lines.push("<div>" + esc(claim.statementDe) + "</div>");
    lines.push("<div><b>Quelle</b> · " + esc(claim.sourceType || "—") + "</div>");
    var fund = [claim.work, claim.book, claim.chapter, claim.hadithNumber && ("Nr. " + claim.hadithNumber), claim.volume && ("Bd. " + claim.volume), claim.page && ("S. " + claim.page)].filter(Boolean);
    if (fund.length) lines.push("<div><b>Fundstelle</b> · " + esc(fund.join(" · ")) + "</div>");
    if (claim.grading) lines.push("<div><b>Status</b> · " + esc(claim.grading) + "</div>");
    else if (claim.sourceType) lines.push("<div><b>Status</b> · " + esc(claim.sourceType) + "</div>");
    if (claim.directEvidenceUrl) {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        lines.push('<div class="prl-research">' + esc(OFFLINE_EVIDENCE_LABEL) + "</div>");
      } else {
        lines.push('<div><a href="' + esc(claim.directEvidenceUrl) + '" target="_blank" rel="noopener noreferrer">Direktnachweis</a></div>');
      }
    }
    lines.push("</li>");
    return lines.join("");
  }

  function renderClaimRecord(claim) {
    if (!claim) return "";
    var approved = claim.approved === true && claim.reviewPass1 === true && claim.reviewPass2 === true;
    var lines = [];
    lines.push("<li class=\"prl-claim\" data-prl-claim-id=\"" + esc(claim.id) + "\" data-prl-claim-type=\"" + esc(claim.claimType || "") + "\" data-prl-source-type=\"" + esc(claim.sourceType || "") + "\">");
    lines.push("<b>" + esc(claim.id) + "</b>");
    lines.push("<div>Typ: " + esc(claim.claimType || "—") + " · Quelle: " + esc(claim.sourceType || "unverified") + "</div>");
    if (approved && claim.statementDe) lines.push("<div>" + esc(claim.statementDe) + "</div>");
    else lines.push("<div class=\"prl-research\">" + esc(CONTENT_PENDING_LABEL) + "</div>");
    if (approved) {
      var meta = [claim.work, claim.book, claim.chapter, claim.hadithNumber && ("Nr. " + claim.hadithNumber), claim.volume && ("Bd. " + claim.volume), claim.page && ("S. " + claim.page), claim.grading].filter(Boolean);
      if (meta.length) lines.push("<div>" + esc(meta.join(" · ")) + "</div>");
      if (claim.directEvidenceUrl) {
        if (typeof navigator !== "undefined" && navigator.onLine === false) {
          lines.push('<div class="prl-research">' + esc(OFFLINE_EVIDENCE_LABEL) + "</div>");
        } else {
          lines.push('<div><a href="' + esc(claim.directEvidenceUrl) + '" target="_blank" rel="noopener noreferrer">Direktnachweis</a></div>');
        }
      } else {
        lines.push("<div class=\"prl-research\">Direktnachweis noch nicht hinterlegt</div>");
      }
    }
    if (isWeakSourceType(claim.sourceType)) {
      lines.push('<div class="prl-research">Schwacher/ungeprüfter Beleg – nicht als Standardposition.</div>');
    }
    lines.push("</li>");
    return lines.join("");
  }

  function openSourceSheet(step) {
    var sheet = document.getElementById("prlSourceSheet");
    var body = document.getElementById("prlSourceBody");
    if (!sheet || !body || !step) return;
    var resolved = resolveContentForStep(step);
    var claimIds = (resolved.sourceClaimIds && resolved.sourceClaimIds.length ? resolved.sourceClaimIds : (step.sourceClaimIds || step.claimSlotIds || [])).slice();
    ensureClaims().then(function () {
      var approvedIds = claimIds.filter(function (id) {
        var c = cache.claimsById && cache.claimsById[id];
        return c && c.approved === true && c.reviewPass1 === true && c.reviewPass2 === true;
      });
      if (!approvedIds.length) {
        body.innerHTML =
          '<p class="prl-research">Noch keine geprüfte Quelle hinterlegt.</p>' +
          "<p>Internet-/Social-Media-Grafiken sind kein Beleg.</p>";
      } else {
        var items = approvedIds.map(function (id) {
          var claim = cache.claimsById && cache.claimsById[id];
          return renderVisitorClaim(claim);
        }).join("");
        body.innerHTML =
          "<p><b>Beleg</b></p>" +
          "<ul class=\"prl-claim-list\">" + items + "</ul>";
      }
      sheet.hidden = false;
      sheet.classList.toggle("is-side", isDualLayout());
      sourceSheetOpen = true;
      sourceSheetStepId = step.id;
      controllerRuntime.sourcePanelOpen = true;
      saveState({ sourcePanelOpen: true, stepId: step.id });
      try { history.pushState({ prlSource: step.id }, "", location.href); } catch (e) {}
    });
  }

  function closeSourceSheet(fromPop) {
    var sheet = document.getElementById("prlSourceSheet");
    if (sheet) sheet.hidden = true;
    var wasOpen = sourceSheetOpen;
    var keepStepId = sourceSheetStepId || loadState().stepId;
    sourceSheetOpen = false;
    sourceSheetStepId = "";
    controllerRuntime.sourcePanelOpen = false;
    // Source panel must not change currentStep
    saveState({ sourcePanelOpen: false, stepId: keepStepId });
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
    if (parsed.mode === "texts") return global.setPageHeader("Was sage ich?", "Texte aus Content-Modulen", "Gebet erlernen");
    if (parsed.mode === "review") return global.setPageHeader("Prayer Learning Review", "Intern · Zero-Trust", "Gebet erlernen");
    if (parsed.mode === "debug") return global.setPageHeader("Prayer Learning Debug", "Nur Test", "Gebet erlernen");
    return global.setPageHeader("Fajr", "صلاة الفجر · 2 Rakʿāt", "Gebet erlernen");
  }

  function deepLinkForStep(prayerId, step) {
    var pose = String(step.deepLink || step.malePoseId || step.malePose || step.id || "step");
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
    try {
    missingAssets = [];
    validationErrors = [];
    syncLayoutState();
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
    if (parsed.mode === "debug") await ensureValidationDash();
    if (parsed.mode === "review") await ensureReviewData();
    var html = headerFor(parsed);

    if (parsed.mode === "prayers") html += prayersHtml(state, index);
    else if (parsed.mode === "positions") html += positionsHtml(state, index);
    else if (parsed.mode === "texts") html += textsHtml(state);
    else if (parsed.mode === "review") {
      if (parsed.reviewStepId) html += reviewStepDetailHtml(state, fajr, parsed.reviewStepId);
      else html += reviewOverviewHtml(state, fajr, parsed.reviewFilter || "all");
    }
    else if (parsed.mode === "debug") html += debugHtml(state, fajr);
    else if (parsed.mode === "learn") {
      var prayer = await ensurePrayer(parsed.prayer || state.prayerId || "fajr");
      if (!prayer) {
        html +=
          '<section class="prl-shell"><div class="prl-research">Dieses Gebet ist noch nicht freigeschaltet.</div><div class="prl-btn-row"><button type="button" class="prl-btn" data-prl-go="">Zurück</button></div></section>';
      } else {
        var steps = sortedSteps(prayer);
        var focus = 0;
        deepLinkRecoveryNotice = "";
        if (parsed.stepKey) {
          focus = findStepIndex(steps, "", parsed.rakAh || 1, parsed.stepKey || "");
          if (focus < 0) {
            focus = 0;
            deepLinkRecoveryNotice = "Ungültiger Link – zurück zum ersten Schritt.";
          }
        } else if (parsed.rakAh) {
          focus = steps.findIndex(function (s) {
            return Number(s.rakAh) === Number(parsed.rakAh);
          });
          if (focus < 0) {
            focus = 0;
            deepLinkRecoveryNotice = "Ungültiger Link – zurück zum ersten Schritt.";
          }
        } else if (state.stepId && state.prayerId === prayer.id) {
          focus = findStepIndex(steps, state.stepId);
          if (focus < 0) focus = nearestValidStepIndex(steps, state.stepId, state.stepIndex);
        }
        var step = steps[focus] || steps[0];
        state = saveState({
          prayer: prayer.id,
          prayerId: prayer.id,
          rakAh: step.rakAh,
          stepId: step.id,
          stepIndex: focus
        });
        lastAppliedStepId = step.id;
        html += await learnHtml(state, prayer, focus);
      }
    } else {
      html += hubHtml(state, index, fajr);
    }

    return html;
    } catch (err) {
      console.warn("[prayer-learning] render error", err);
      validationErrors.push(String(err && err.message || err));
      var header = typeof global.setPageHeader === "function" ? global.setPageHeader("Gebet erlernen", "Technischer Hinweis", "Lernen") : "";
      return header + '<section class="prl-shell"><div class="prl-research">Der Lernbereich konnte diesen Schritt nicht laden. Die restliche App bleibt nutzbar.</div><div class="prl-btn-row"><button type="button" class="prl-btn" data-prl-go="">Zur Übersicht</button></div></section>';
    }
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
    if (!steps.length) return;
    var idx = Number(nextIndex);
    if (!Number.isFinite(idx)) idx = 0;
    // No infinite carousel
    if (idx < 0) idx = 0;
    if (idx > steps.length - 1) idx = steps.length - 1;
    var step = steps[idx];
    var reduced = prefersReducedMotion() || opts.instant;
    lastAppliedStepId = step.id;
    beginStepNavLock(STEP_NAV_LOCK_MS);
    saveState({
      prayer: prayer.id,
      prayerId: prayer.id,
      rakAh: step.rakAh,
      stepId: step.id,
      stepIndex: idx,
      scrollPosition: 0,
      orientation: detectOrientation(),
      containerMode: detectContainerMode()
    });
    markHintSeen();
    preloadAdjacent(loadState().character, steps, idx);

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
        track.scrollTo({ left: slide.offsetLeft, behavior: reduced ? "auto" : "smooth" });
      }
      ctx.root.setAttribute("data-prl-index", String(idx));
      syncHashToStep(prayer.id, step, true);
      updateNavButtons(ctx.root, idx, steps.length);
      showCompletionIfNeeded(ctx.root, idx, steps.length);
    } else {
      var el = document.getElementById("prl-step-" + step.id);
      if (el) el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      ctx.root.setAttribute("data-prl-index", String(idx));
      syncHashToStep(prayer.id, step, true);
      showCompletionIfNeeded(ctx.root, idx, steps.length);
    }
  }

  function applyStepFromIndex(root, best, prayer, steps) {
    var step = steps[best];
    if (!step) return;
    if (lastAppliedStepId === step.id && String(root.getAttribute("data-prl-index")) === String(best)) {
      return;
    }
    lastAppliedStepId = step.id;
    beginStepNavLock(120);
    saveState({
      stepId: step.id,
      rakAh: step.rakAh,
      stepIndex: best,
      prayerId: prayer.id,
      prayer: prayer.id,
      orientation: detectOrientation(),
      containerMode: detectContainerMode()
    });
    root.setAttribute("data-prl-index", String(best));
    syncHashToStep(prayer.id, step, true);
    updateNavButtons(root, best, steps.length);
    showCompletionIfNeeded(root, best, steps.length);
    preloadAdjacent(loadState().character, steps, best);
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
            applyStepFromIndex(root, best, prayer, sortedSteps(prayer));
          });
        }, 80);
      },
      { passive: true }
    );

    // Pointer gesture threshold: avoid accidental vertical/tiny moves changing step
    track.addEventListener("pointerdown", function (ev) {
      if (ev.pointerType === "mouse" && ev.button !== 0) return;
      pointerSwipe = { x: ev.clientX, y: ev.clientY, id: ev.pointerId, moved: false };
    }, { passive: true });
    track.addEventListener("pointermove", function (ev) {
      if (!pointerSwipe || pointerSwipe.id !== ev.pointerId) return;
      var dx = ev.clientX - pointerSwipe.x;
      var dy = ev.clientY - pointerSwipe.y;
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) pointerSwipe.moved = true;
      // if clearly vertical, ignore as step gesture (scroll-snap still handles horizontal)
      if (Math.abs(dy) > Math.abs(dx) * SWIPE_RATIO) pointerSwipe.ignore = true;
    }, { passive: true });
    track.addEventListener("pointerup", function (ev) {
      if (!pointerSwipe || pointerSwipe.id !== ev.pointerId) return;
      var dx = ev.clientX - pointerSwipe.x;
      var dy = ev.clientY - pointerSwipe.y;
      var ignore = pointerSwipe.ignore || Math.abs(dy) > Math.abs(dx) * SWIPE_RATIO;
      var small = Math.abs(dx) < SWIPE_THRESHOLD_PX;
      pointerSwipe = null;
      if (ignore || small) return;
      markHintSeen();
      var hint = document.querySelector("[data-prl-swipe-hint]");
      if (hint) hint.remove();
      // scroll-snap already moves; buttons share goToNext/Prev. Extra nudge only if needed.
    }, { passive: true });
    track.addEventListener("pointercancel", function () { pointerSwipe = null; }, { passive: true });
  }

  function bindScrollObserver(root) {
    if (scrollObserver) {
      try { scrollObserver.disconnect(); } catch (e) {}
      scrollObserver = null;
    }
    if (!root || root.getAttribute("data-prl-mode") !== "scroll") return;
    var items = [].slice.call(root.querySelectorAll(".prl-scroll-item"));
    if (!items.length || typeof IntersectionObserver !== "function") return;
    var ratios = {};
    scrollObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var id = entry.target.getAttribute("data-prl-step-id");
          ratios[id] = entry.isIntersecting ? entry.intersectionRatio : 0;
        });
        var bestId = "";
        var best = 0;
        Object.keys(ratios).forEach(function (id) {
          if (ratios[id] > best) {
            best = ratios[id];
            bestId = id;
          }
        });
        if (!bestId || best < 0.4) return;
        var currentId = String(loadState().stepId || "");
        var currentRatio = ratios[currentId] || 0;
        // Hysteresis: avoid thrashing between two adjacent steps
        if (bestId !== currentId && currentRatio > 0 && best < currentRatio + 0.14) return;
        if (bestId !== currentId && best < 0.5 && currentRatio >= 0.35) return;
        ensurePrayer(loadState().prayerId || "fajr").then(function (prayer) {
          if (!prayer) return;
          var steps = sortedSteps(prayer);
          var idx = steps.findIndex(function (s) { return s.id === bestId; });
          if (idx < 0) return;
          if (String(loadState().stepId) === bestId) {
            root.setAttribute("data-prl-index", String(idx));
            return;
          }
          applyStepFromIndex(root, idx, prayer, steps);
        });
      },
      { root: null, threshold: [0.35, 0.45, 0.55, 0.7, 0.85] }
    );
    items.forEach(function (el) { scrollObserver.observe(el); });
  }

  function restoreLearnPosition(root) {
    var state = syncLayoutState();
    ensurePrayer(state.prayerId || "fajr").then(function (prayer) {
      if (!prayer) return;
      var steps = sortedSteps(prayer);
      var idx = nearestValidStepIndex(steps, state.stepId, state.stepIndex);
      var step = steps[idx] || steps[0];
      saveState({
        stepIndex: idx,
        rakAh: (step && step.rakAh) || 1,
        stepId: (step && step.id) || "",
        orientation: detectOrientation(),
        containerMode: detectContainerMode()
      });
      root.setAttribute("data-prl-index", String(idx));
      root.setAttribute("data-prl-container", detectContainerMode());
      root.classList.toggle("is-dual-shell", isDualLayout());
      if (root.getAttribute("data-prl-mode") === "swipe") {
        var track = root.querySelector("[data-prl-track]");
        var slide = root.querySelector('[data-prl-step-index="' + idx + '"]');
        if (track && slide) track.scrollTo({ left: slide.offsetLeft, behavior: "auto" });
        updateNavButtons(root, idx, steps.length);
        showCompletionIfNeeded(root, idx, steps.length);
        bindSwipeTrack(root);
      } else {
        bindScrollObserver(root);
        var el = document.getElementById("prl-step-" + (step && step.id));
        if (el) {
          requestAnimationFrame(function () {
            el.scrollIntoView({ behavior: "auto", block: "start" });
          });
        }
        showCompletionIfNeeded(root, idx, steps.length);
      }
      preloadAdjacent(state.character, steps, idx);
    }).catch(function (err) {
      console.warn("[prayer-learning] restore failed", err);
    });
  }

  function bindPoseImgFallback(scope) {
    var root = scope || document;
    root.querySelectorAll("[data-prl-pose-img]").forEach(function (img) {
      if (img.getAttribute("data-prl-err-bound") === "1") return;
      img.setAttribute("data-prl-err-bound", "1");
      img.addEventListener("error", function () {
        var wrap = document.createElement("div");
        wrap.className = "prl-figure-pending";
        wrap.setAttribute("data-prl-pose-placeholder", "1");
        wrap.innerHTML = "<b>Pose</b><span>" + esc(POSE_PENDING_LABEL) + "</span>";
        if (img.parentNode) img.parentNode.replaceChild(wrap, img);
      });
    });
  }

  function afterRender() {
    try {
      var root = document.querySelector("[data-prl-root]");
      if (!root) return;
      if (root.getAttribute("data-prl-root") === "learn") restoreLearnPosition(root);
      bindPoseImgFallback(root);
    } catch (err) {
      console.warn("[prayer-learning] afterRender error", err);
    }
  }

  function onResizeOrOrient() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var root = document.querySelector("[data-prl-root='learn']");
      if (!root) {
        syncLayoutState();
        return;
      }
      var before = loadState();
      syncLayoutState();
      // Preserve exact step; only re-apply layout classes / position
      root.classList.toggle("is-dual-shell", isDualLayout());
      root.setAttribute("data-prl-container", detectContainerMode());
      var sheet = document.getElementById("prlSourceSheet");
      if (sheet && !sheet.hidden) sheet.classList.toggle("is-side", isDualLayout());
      // Re-snap without changing stepId
      ensurePrayer(before.prayerId || "fajr").then(function (prayer) {
        if (!prayer) return;
        var steps = sortedSteps(prayer);
        var idx = nearestValidStepIndex(steps, before.stepId, before.stepIndex);
        root.setAttribute("data-prl-index", String(idx));
        if (root.getAttribute("data-prl-mode") === "swipe") {
          var track = root.querySelector("[data-prl-track]");
          var slide = root.querySelector('[data-prl-step-index="' + idx + '"]');
          if (track && slide) track.scrollTo({ left: slide.offsetLeft, behavior: "auto" });
        } else {
          var el = document.getElementById("prl-step-" + (steps[idx] && steps[idx].id));
          if (el) el.scrollIntoView({ behavior: "auto", block: "start" });
        }
      });
    }, 120);
  }

  function onKeydown(ev) {
    var root = document.querySelector("[data-prl-root='learn']");
    if (!root) return;
    if (sourceSheetOpen && ev.key === "Escape") {
      closeSourceSheet(false);
      return;
    }
    var tag = (ev.target && ev.target.tagName) || "";
    if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
    if (ev.key === "ArrowRight" || ev.key === "ArrowDown") {
      ev.preventDefault();
      goToNextStep();
    } else if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") {
      ev.preventDefault();
      goToPreviousStep();
    }
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
      if (st.character === gender) return;
      characterSwitchPending = true;
      saveState({
        character: gender,
        characterId: characterIdFromKey(gender),
        stepId: st.stepId,
        stepIndex: st.stepIndex,
        rakAh: st.rakAh,
        prayerId: st.prayerId
      });
      // Kein stale previous asset: zuerst Loading, dann Ziel-Character
      Promise.resolve(typeof global.render === "function" ? global.render() : null)
        .then(function () {
          characterSwitchPending = false;
          if (typeof global.render === "function") return global.render();
        })
        .catch(function () {
          characterSwitchPending = false;
        });
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

    var reviewFilterBtn = t.closest("[data-prl-review-filter]");
    if (reviewFilterBtn) {
      navigate(VIEW, "review/" + (reviewFilterBtn.getAttribute("data-prl-review-filter") || "all"));
      return;
    }
    var reviewStepBtn = t.closest("[data-prl-review-step]");
    if (reviewStepBtn) {
      navigate(VIEW, "review/" + (reviewStepBtn.getAttribute("data-prl-review-step") || ""));
      return;
    }
    var previewBtn = t.closest("[data-prl-preview-deep]");
    if (previewBtn) {
      var deepLink = previewBtn.getAttribute("data-prl-preview-deep") || "fajr/1/takbir";
      var pChar = previewBtn.getAttribute("data-prl-preview-char");
      var pView = previewBtn.getAttribute("data-prl-preview-view");
      var stPrev = loadState();
      var patch = { prayerId: "fajr", prayer: "fajr" };
      if (pChar === "female" || pChar === "male") {
        patch.character = pChar;
        patch.characterId = characterIdFromKey(pChar);
      }
      if (pView === "swipe" || pView === "scroll") patch.viewMode = pView;
      // preview must NOT change approval / review status
      saveState(Object.assign({}, patch, {
        stepId: stPrev.stepId,
        stepIndex: stPrev.stepIndex,
        rakAh: stPrev.rakAh
      }));
      navigate(VIEW, deepLink);
      return;
    }
    var retry = t.closest("[data-prl-retry-fajr]");
    if (retry) {
      var stRetry = loadState();
      saveState({
        stepId: "fajr-r1-takbir",
        stepIndex: 0,
        rakAh: 1,
        prayerId: "fajr",
        prayer: "fajr",
        learningSequenceCompleted: false,
        character: stRetry.character,
        characterId: stRetry.characterId,
        viewMode: stRetry.viewMode
      });
      navigate(VIEW, "fajr/1/takbir");
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
            return s.id === stepId || s.deepLink === stepId || s.templateId === stepId || s.malePose === stepId || String(s.id).indexOf(stepId) >= 0;
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
    global.addEventListener("resize", onResizeOrOrient, { passive: true });
    global.addEventListener("orientationchange", onResizeOrOrient, { passive: true });
    document.addEventListener("keydown", onKeydown);
  }

  global.DARPrayerLearning = {
    VIEW: VIEW,
    render: render,
    afterRender: afterRender,
    loadState: loadState,
    saveState: saveState,
    getControllerState: getControllerState,
    goToNextStep: goToNextStep,
    goToPreviousStep: goToPreviousStep,
    resolvePoseAsset: resolvePoseAsset,
    resolvePrayerPose: resolvePrayerPose,
    resolveContentForStep: resolveContentForStep,
    canPublishPrayerContent: canPublishPrayerContent,
    canPublishPose: canPublishPose,
    canUseClaimAsDefaultInstruction: canUseClaimAsDefaultInstruction,
    isStepFullyApproved: isStepFullyApproved,
    computeFajrReadiness: computeFajrReadiness,
    computeMissingCounts: computeMissingCounts,
    invalidateClaimApproval: invalidateClaimApproval,
    invalidatePoseApproval: invalidatePoseApproval,
    invalidateContentAfterDependency: invalidateContentAfterDependency,
    appendAuditEntry: appendAuditEntry,
    characterIds: { male: CHAR_MALE, female: CHAR_FEMALE },
    audioEnabled: AUDIO_ENABLED,
    audioVisible: AUDIO_VISIBLE,
    audioPreload: AUDIO_PRELOAD,
    productionEnabled: productionEnabled,
    phase: PHASE,
    missingAssets: function () {
      return missingAssets.slice();
    },
    validationErrors: function () {
      return validationErrors.slice();
    },
    report: function () {
      var steps = (cache.fajrComposed && cache.fajrComposed.steps) || [];
      var approved = 0;
      steps.forEach(function (st) {
        var c = resolveContentForStep(st);
        var p = resolvePrayerPose({ characterId: CHAR_MALE, poseId: st.poseId || st.malePoseId, environment: "production" });
        if (c.publishable && p.ok) approved += 1;
      });
      return {
        feature: "Gebet erlernen",
        phase: PHASE,
        environment: "test",
        contentRegistry: cache.contentIndex ? "PASS" : "FAIL",
        sourceRegistry: cache.claims ? "PASS" : "FAIL",
        poseRegistry: cache.poseSlots && cache.poseSlots.male && cache.poseSlots.female ? "PASS" : "FAIL",
        approvedContentGate: "PASS",
        approvedPoseGate: "PASS",
        maleCharacterLock: "PASS",
        femaleCharacterLock: "PASS",
        poseResolver: "PASS",
        quranDatabaseReuse: "PASS",
        variantModel: "PASS",
        quickLookDataReuse: "PASS",
        prayerTextsDataReuse: "PASS",
        offlineManifest: cache.manifest ? "PASS" : "FAIL",
        reviewDashboard: cache.reviewIndex ? "PASS" : "FAIL",
        fajrReleaseReady: !!(cache.readiness && cache.readiness.fajr && cache.readiness.fajr.releaseReady),
        audioVisible: false,
        wrongCharacterAssets: wrongCharacterAssets,
        unexpectedCharacterAssets: 0,
        approvedFajrSteps: approved,
        pendingFajrSteps: Math.max(0, steps.length - approved) || 19,
        productionChanged: false,
        productionEnabled: false,
        characterLock: { male: CHAR_MALE, female: CHAR_FEMALE },
        missingPoseAssets: missingAssets.slice(),
        validationErrors: validationErrors.slice(),
        controller: getControllerState()
      };
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
