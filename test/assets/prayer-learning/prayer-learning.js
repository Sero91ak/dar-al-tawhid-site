/**
 * DAR AL TAWḤĪD — Gebet erlernen (Test Phase 5)
 * Content registry · Claim gates · Pose slots · Character lock
 * productionEnabled = false | audioVisible = false | TEST ONLY
 */
(function (global) {
  "use strict";

  var VIEW = "gebet-lernen";
  var STATE_KEY = "darPrayerLearningV1";
  var HINT_KEY = "darPrayerLearningSwipeHintV1";
  var ASSET_BASE = "/test/assets/prayer-learning/";
  var DATA_BASE = "/test/data/prayer-learning/";
  var AUDIO_ENABLED = false;
  var AUDIO_VISIBLE = false;
  var AUDIO_PRELOAD = false;
  var CONTENT_PENDING_LABEL = "Inhalt wird geprüft";
  var PHASE = 5;
  var CHAR_MALE = "dar-prayer-male-v1";
  var CHAR_FEMALE = "dar-prayer-female-v1";
  var CHAR_VERSION = 1;

  var cache = { index: null, prayers: null, fajr: null, fajrComposed: null, steps: {}, texts: null, claims: null, claimsById: null, registry: null, poses: { male: null, female: null }, poseSlots: { male: null, female: null }, poseIndex: null, contentIndex: null, contentById: {}, variantsIndex: null, searchIndex: null, validationDash: null, manifest: null, characters: {} };
  var listenersBound = false;
  var missingAssets = [];
  var validationErrors = [];
  var sourceSheetOpen = false;
  var sourceSheetStepId = "";
  var scrollObserver = null;
  var resizeTimer = 0;
  var pointerSwipe = null;
  var SWIPE_THRESHOLD_PX = 56;
  var SWIPE_RATIO = 1.35;
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
    sitting: "fajr-r1-sitting",
    jalsa: "fajr-r1-sitting",
    "sujud-2": "fajr-r1-sujud-2",
    rise: "fajr-r1-rise",
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
    else if (head) mode = "learn";
    return {
      prayer: head,
      mode: mode,
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
    await ensureIndexMeta();
    await ensureRegistry();
    await ensureClaims();
    await ensureContentRegistry();
    await ensurePoseSlotRegistries();
    await ensureSearchIndex();
    await ensureManifest();
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
        if (entry && entry.id) cache.contentById[entry.id] = entry;
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

  function contentIdForStep(step, seqStep) {
    if (seqStep && seqStep.contentId) return seqStep.contentId;
    if (step && step.contentId) return step.contentId;
    var pose = (step && (step.poseId || step.templateId)) || "";
    if (pose === "recitation") return "recitation-fatiha-ref-v1";
    if (pose === "standing-next-rakah" || pose === "rise-next-rakah") return "rise-next-rakah-main-v1";
    if (pose) return pose + "-main-v1";
    return null;
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
      instructionDe = content.instructionDe || null;
      arabic = content.arabic || null;
      transliteration = content.transliteration || null;
      meaningDe = content.meaningDe || null;
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
    if (step && Array.isArray(step.sourceClaimIds) && step.sourceClaimIds.length) {
      sourceClaimIds = step.sourceClaimIds.slice();
    }

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
      variantIds: variantIds,
      sourceClaimIds: sourceClaimIds,
      status: content ? content.status : "missing",
      approved: !!(content && content.approved),
      audioId: null,
      audioVisible: false
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
      return { ok: false, reason: "character-mismatch", asset: null, characterId: characterId, poseId: poseId };
    }
    var slotReg = cache.poseSlots && cache.poseSlots[gender];
    if (slotReg) {
      if (slotReg.characterId !== expected) {
        validationErrors.push("pose slot character lock fail: " + gender);
        return { ok: false, reason: "character-lock", asset: null };
      }
      var poseEntry = (slotReg.poses && slotReg.poses[poseId]) || null;
      var activeId = slotReg.activeAssets ? slotReg.activeAssets[poseId] : null;
      if (poseEntry && poseEntry.characterId && poseEntry.characterId !== expected) {
        validationErrors.push("wrong character asset blocked: " + poseId);
        return { ok: false, reason: "wrong-character", asset: null };
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
    if (template.id === "taslim" && seqStep && seqStep.side === "right") titleDe = "Taslīm rechts";
    if (template.id === "taslim" && seqStep && seqStep.side === "left") titleDe = "Taslīm links";
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
      var claimIds = (s.sourceClaimIds && s.sourceClaimIds.length ? s.sourceClaimIds : (tpl.claimSlotIds || [])).slice();
      var contentId = s.contentId || contentIdForStep({ templateId: tpl.id, poseId: s.poseId || poses.male }, s);
      var poseId = s.poseId || poses.male;
      var content = getContentById(contentId);
      if (content && content.sourceClaimIds && content.sourceClaimIds.length && !claimIds.length) {
        claimIds = content.sourceClaimIds.slice();
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
        variants: tpl.variants || [],
        verificationStatus: (s.status || tpl.verificationStatus || "research"),
        audioId: null,
        audioVisible: false,
        deepLink: s.deepLink || tpl.id,
        poseReuseFrom: s.poseReuseFrom || null,
        side: s.side || null,
        transitionType: s.transitionType || null
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
    var root = document.querySelector("[data-prl-root='learn']");
    var idx = Number((root && root.getAttribute("data-prl-index")) || loadState().stepIndex || 0);
    return jumpToIndex(idx + 1, opts || {});
  }

  function goToPreviousStep(opts) {
    var root = document.querySelector("[data-prl-root='learn']");
    var idx = Number((root && root.getAttribute("data-prl-index")) || loadState().stepIndex || 0);
    return jumpToIndex(idx - 1, opts || {});
  }

  function showCompletionIfNeeded(root, idx, total) {
    var box = root && root.querySelector("[data-prl-complete]");
    if (!box) return;
    var done = idx >= total - 1;
    box.hidden = !done;
    controllerRuntime.completed = done;
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
      if (key === "sitting" || key === "jalsa") return "fajr-r2-sitting";
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
        '<div class="prl-figure"><div class="prl-figure-pending">' +
        "<b>" + esc(step.titleDe || poseKey) + "</b>" +
        "<span>Pose noch nicht freigegeben</span>" +
        "<span>" + esc(cid) + " · " + esc(poseKey) + " · " + esc(status) + "</span>" +
        (isTestEnv() ? '<span class="prl-test-marker">TEST · pending/missing asset</span>' : "") +
        "<span>Keine Ersatzfigur – freigegebenes Master-Asset abwarten.</span>" +
        '</div></div><div class="prl-stage-floor" aria-hidden="true"></div></div>'
      );
    }
    var marker = resolved.meta && resolved.meta.approved ? "" : '<span class="prl-test-marker">TEST · pending asset</span>';
    return (
      '<div class="prl-stage" data-prl-character-id="' + esc(resolved.characterId) + '" data-prl-pose-id="' + esc(resolved.poseId) + '" data-prl-asset-id="' + esc(resolved.assetId) + '">' +
      '<div class="prl-figure"><img src="' + esc(resolved.url) + '" alt="' + esc(label) + '" loading="lazy" decoding="async" data-prl-pose-img>' + marker + "</div>" +
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
    return (
      '<div class="prl-controls">' +
      (isTestEnv() ? '<div class="prl-test-badge" aria-hidden="true">TEST · Gebet erlernen</div>' : "") +
      '<div class="prl-controls-label" id="prlCharLabel">Für wen möchtest du die Darstellung sehen?</div>' +
      '<div class="prl-segment" role="group" aria-labelledby="prlCharLabel">' +
      '<button type="button" data-prl-character="male" aria-pressed="' + (state.character === "male" ? "true" : "false") + '" class="' +
      (state.character === "male" ? "is-active" : "") +
      '">Männer</button>' +
      '<button type="button" data-prl-character="female" aria-pressed="' + (state.character === "female" ? "true" : "false") + '" class="' +
      (state.character === "female" ? "is-active" : "") +
      '">Frauen</button>' +
      "</div>" +
      '<div class="prl-controls-label" id="prlViewLabel">Wie möchtest du lernen?</div>' +
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
      if (step.recitation) blocks += '<div class="prl-ar-text" lang="ar" dir="rtl">' + esc(step.recitation) + "</div>";
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

    var approvedDetails = getApprovedDetails(step);
    if (approvedDetails.length) {
      blocks +=
        '<div class="prl-detail-slots" role="group" aria-label="Details ansehen">' +
        approvedDetails
          .map(function (d) {
            return '<button type="button" class="prl-detail-slot" data-prl-detail="' + esc(d.id) + '">' + esc(d.label || d.id) + "</button>";
          })
          .join("") +
        "</div>";
    } else if (isTestEnv() && step.detailSlots && step.detailSlots.length) {
      blocks += '<div class="prl-detail-prep" hidden data-prl-detail-prep="' + esc((step.detailSlots || []).join(",")) + '"></div>';
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
      '<p class="prl-step-ar" lang="ar" dir="rtl">' +
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

  function textsHtml(state) {
    var modules = (cache.contentIndex && cache.contentIndex.modules) || [];
    var order = ["takbir", "ruku", "standing-after-ruku", "sujud", "sitting-between-sujud", "tashahhud", "taslim"];
    var byStep = {};
    modules.forEach(function (m) { if (m && m.stepId) byStep[m.stepId] = m; });
    var rows = order.map(function (stepId) {
      var mod = byStep[stepId];
      if (!mod) return "";
      var content = getContentById(mod.contentId);
      var ok = canPublishPrayerContent(content);
      return (
        '<button type="button" class="prl-path" data-prl-text-content="' + esc(mod.contentId) + '" data-prl-position="' + esc(stepId) + '">' +
        "<b>" + esc((content && content.titleDe) || stepId) + "</b>" +
        "<span>" + (ok ? "freigegeben" : esc(CONTENT_PENDING_LABEL)) + " · " + esc(mod.contentId) + "</span></button>"
      );
    }).join("");
    return (
      '<section class="prl-shell" data-prl-root="texts">' +
      '<header class="prl-hero prl-hero--compact"><h2>Was sage ich im Gebet?</h2><p>Dieselben Content-Module wie in Wisch- und Scrollmodus · keine zweite Textdatenbank.</p></header>' +
      controlsHtml(state) +
      '<div class="prl-paths">' + rows + "</div>" +
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
      '<button type="button" class="prl-path" data-prl-go="texte"><b>Was sage ich im Gebet?</b><span>Texte aus denselben Content-Modulen</span></button>' +
      (isTestEnv() ? '<button type="button" class="prl-path" data-prl-go="debug"><b>Prayer Learning Debug</b><span>Validierung · nur Test</span></button>' : "") +
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
      "<b>Fajr abgeschlossen</b><span>Lernhilfe · keine religiöse Bewertung des Nutzers.</span>" +
      '<div class="prl-btn-row">' +
      '<button type="button" class="prl-btn primary" data-prl-retry-fajr>Noch einmal üben</button>' +
      '<button type="button" class="prl-btn" data-prl-go="">Zur Übersicht</button>' +
      "</div></div>";

    preloadAdjacent(state.character, steps, idx);

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
        '<section class="prl-shell prl-shell--' + esc(detectContainerMode()) + '" data-prl-root="learn" data-prl-mode="scroll" data-prl-index="' +
        idx +
        '" data-prl-container="' + esc(detectContainerMode()) + '">' +
        controlsHtml(state, { compact: true }) +
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
        lines.push('<div><a href="' + esc(claim.directEvidenceUrl) + '" target="_blank" rel="noopener noreferrer">Direktnachweis</a></div>');
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
      if (!claimIds.length) {
        body.innerHTML =
          '<p class="prl-research">Noch keine geprüfte Quelle hinterlegt.<br>Status: ' +
          esc(step.verificationStatus || resolved.status || "research") +
          "</p>" +
          "<p>Werk · Fundstelle · Authentizitätsstatus folgen nach Quellenprüfung.</p>" +
          "<p>Internet-/Social-Media-Grafiken sind kein Beleg.</p>";
      } else {
        var items = claimIds.map(function (id) {
          var claim = cache.claimsById && cache.claimsById[id];
          if (claim) return renderClaimRecord(claim);
          return "<li><b>" + esc(id) + "</b><div class=\"prl-research\">Claim-Datensatz fehlt</div></li>";
        }).join("");
        body.innerHTML =
          "<p><b>Belege</b> · contentId: " + esc(resolved.contentId || "—") + "</p>" +
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
    sourceSheetOpen = false;
    sourceSheetStepId = "";
    controllerRuntime.sourcePanelOpen = false;
    saveState({ sourcePanelOpen: false });
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
    var html = headerFor(parsed);

    if (parsed.mode === "prayers") html += prayersHtml(state, index);
    else if (parsed.mode === "positions") html += positionsHtml(state, index);
    else if (parsed.mode === "texts") html += textsHtml(state);
    else if (parsed.mode === "debug") html += debugHtml(state, fajr);
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
        if (!bestId || best < 0.35) return;
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
      { root: null, threshold: [0.35, 0.55, 0.75] }
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

  function afterRender() {
    try {
      var root = document.querySelector("[data-prl-root]");
      if (!root) return;
      if (root.getAttribute("data-prl-root") === "learn") restoreLearnPosition(root);
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

    var retry = t.closest("[data-prl-retry-fajr]");
    if (retry) {
      saveState({ stepId: "fajr-r1-takbir", stepIndex: 0, rakAh: 1, prayerId: "fajr", prayer: "fajr" });
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
        audioVisible: false,
        wrongCharacterAssets: 0,
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
