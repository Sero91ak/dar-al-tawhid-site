#!/usr/bin/env node
/**
 * Generate technical learning sequences for Maghrib (28) and 4-Rakʿah model (36).
 * Content/poses remain research — no invented religious text.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const BASE = path.join(ROOT, "test/data/prayer-learning");

const CLAIMS = {
  takbir: ["takbir-standing-position","takbir-hand-raising","takbir-hand-height","takbir-palm-direction","takbir-fingers","takbir-spoken-wording","takbir-transition-to-qiyam"],
  qiyam: ["qiyam-standing","qiyam-hand-position","qiyam-right-left-hand-relation","qiyam-foot-position","qiyam-gaze","qiyam-transition-to-recitation"],
  recitation: ["recitation-standing","recitation-al-fatihah","recitation-additional-quran","recitation-order","recitation-transition-ruku"],
  ruku: ["ruku-body-position","ruku-back-position","ruku-head-position","ruku-hands-on-knees","ruku-finger-position","ruku-arm-position","ruku-leg-position","ruku-foot-position","ruku-dhikr","ruku-transition-out"],
  standing: ["standing-rise-motion","standing-complete-upright-position","standing-hand-related-detail","standing-spoken-text-during-rise","standing-spoken-text-after-rise","standing-transition-to-sujud"],
  sujud: ["sujud-general-position","sujud-forehead","sujud-nose","sujud-hands","sujud-fingers","sujud-knees","sujud-feet","sujud-toes","sujud-arm-position","sujud-body-spacing","sujud-head-related-detail","sujud-dhikr","sujud-transition-to-sitting"],
  sitting: ["sitting-general-position","sitting-leg-position","sitting-left-foot","sitting-right-foot","sitting-hand-position","sitting-finger-position","sitting-back-position","sitting-dhikr","sitting-transition-second-sujud"],
  rise: ["rise-start-position","rise-support-related-detail","rise-body-movement","rise-hand-related-detail","rise-final-standing-position"],
  tashahhud: ["tashahhud-general-sitting","tashahhud-left-leg","tashahhud-right-leg","tashahhud-left-foot","tashahhud-right-foot","tashahhud-left-hand","tashahhud-right-hand","tashahhud-finger-shape","tashahhud-index-finger","tashahhud-index-finger-timing","tashahhud-gaze","tashahhud-text","tashahhud-salat-ibrahimiyya","tashahhud-dua-before-taslim"],
  taslim: ["taslim-general","taslim-head-turn-right","taslim-head-turn-left","taslim-right-end-position","taslim-left-end-position","taslim-spoken-wording","taslim-order"]
};

function unitCycle(prayerId, rakAh, orderStart, opts) {
  opts = opts || {};
  const steps = [];
  let o = orderStart;
  const prefix = `${prayerId}-r${rakAh}`;
  const firstOfPrayer = rakAh === 1;
  const withTakbir = !!opts.withTakbir || firstOfPrayer;
  const afterTashahhud = opts.afterTashahhud; // 'middle' | 'final' | null
  const endWithRise = !!opts.endWithRise;
  const endWithTaslim = !!opts.endWithTaslim;

  function push(partial) {
    steps.push(Object.assign({
      prayerId,
      rakAh,
      order: o++,
      status: "research",
      sourceClaimIds: []
    }, partial));
  }

  if (withTakbir) {
    push({
      id: `${prefix}-takbir`,
      templateId: "takbir",
      deepLink: "takbir",
      contentId: "takbir-main-v1",
      poseId: "takbir",
      claimSlotIds: CLAIMS.takbir.slice(),
      poseReuse: rakAh > 1,
      poseReuseFrom: rakAh > 1 ? "takbir" : undefined,
      contentReuse: true
    });
  }

  push({
    id: `${prefix}-qiyam`,
    templateId: "qiyam",
    deepLink: "qiyam",
    contentId: "qiyam-main-v1",
    poseId: "qiyam",
    claimSlotIds: CLAIMS.qiyam.slice(),
    poseReuse: true,
    poseReuseFrom: "qiyam",
    contentReuse: true
  });

  push({
    id: `${prefix}-recitation`,
    templateId: "recitation",
    deepLink: "recitation",
    contentId: `${prayerId}-r${rakAh}-recitation-v1`,
    poseId: "qiyam",
    claimSlotIds: CLAIMS.recitation.slice(),
    poseReuse: true,
    poseReuseFrom: "qiyam",
    note: "Rakʿah-spezifisches Mapping · Qurʾān via bestehende DB · research"
  });

  push({
    id: `${prefix}-ruku`,
    templateId: "ruku",
    deepLink: "ruku",
    contentId: "ruku-main-v1",
    poseId: "ruku",
    claimSlotIds: CLAIMS.ruku.slice(),
    poseReuse: true,
    poseReuseFrom: "ruku",
    contentReuse: true
  });

  push({
    id: `${prefix}-standing-after-ruku`,
    templateId: "standing-after-ruku",
    deepLink: "standing-after-ruku",
    contentId: "standing-after-ruku-v1",
    poseId: "standing-after-ruku",
    claimSlotIds: CLAIMS.standing.slice(),
    poseReuse: true,
    poseReuseFrom: "standing-after-ruku",
    contentReuse: true
  });

  push({
    id: `${prefix}-sujud-1`,
    templateId: "sujud",
    deepLink: "sujud-1",
    instance: 1,
    contentId: "sujud-main-v1",
    poseId: "sujud",
    claimSlotIds: CLAIMS.sujud.slice(),
    poseReuse: true,
    poseReuseFrom: "sujud",
    contentReuse: true
  });

  push({
    id: `${prefix}-sitting-between-sujud`,
    templateId: "sitting-between-sujud",
    deepLink: "sitting-between-sujud",
    contentId: "sitting-between-sujud-v1",
    poseId: "sitting-between-sujud",
    claimSlotIds: CLAIMS.sitting.slice(),
    poseReuse: true,
    poseReuseFrom: "sitting-between-sujud",
    contentReuse: true
  });

  push({
    id: `${prefix}-sujud-2`,
    templateId: "sujud",
    deepLink: "sujud-2",
    instance: 2,
    contentId: "sujud-main-v1",
    poseId: "sujud",
    claimSlotIds: CLAIMS.sujud.slice(),
    poseReuse: true,
    poseReuseFrom: "sujud",
    contentReuse: true,
    claimReuse: true
  });

  if (afterTashahhud === "middle") {
    push({
      id: `${prefix}-middle-tashahhud`,
      templateId: "tashahhud",
      deepLink: "middle-tashahhud",
      contentId: "middle-tashahhud-v1",
      poseId: "middle-tashahhud",
      poseReuseFrom: "tashahhud",
      poseReuse: true,
      claimSlotIds: CLAIMS.tashahhud.slice(),
      tashahhudKind: "middle"
    });
  }

  if (afterTashahhud === "final") {
    push({
      id: `${prefix}-final-tashahhud`,
      templateId: "tashahhud",
      deepLink: "final-tashahhud",
      contentId: "final-tashahhud-v1",
      poseId: "final-tashahhud",
      poseReuseFrom: "tashahhud",
      poseReuse: true,
      claimSlotIds: CLAIMS.tashahhud.slice(),
      tashahhudKind: "final"
    });
  }

  if (endWithRise) {
    push({
      id: `${prefix}-rise-next`,
      templateId: "standing-next-rakah",
      deepLink: "rise-next",
      contentId: "rise-next-rakah-v1",
      poseId: "rise-next-rakah",
      claimSlotIds: CLAIMS.rise.slice(),
      poseReuse: true,
      poseReuseFrom: "rise-next-rakah",
      contentReuse: true,
      transitionStyle: "simple-pose-change"
    });
  }

  if (endWithTaslim) {
    push({
      id: `${prefix}-taslim-right`,
      templateId: "taslim",
      deepLink: "taslim-right",
      side: "right",
      contentId: "taslim-main-v1",
      poseId: "taslim-right",
      malePoseId: "taslim-right",
      femalePoseId: "taslim-right",
      claimSlotIds: CLAIMS.taslim.slice(),
      contentReuse: true
    });
    push({
      id: `${prefix}-taslim-left`,
      templateId: "taslim",
      deepLink: "taslim-left",
      side: "left",
      contentId: "taslim-main-v1",
      poseId: "taslim-left",
      malePoseId: "taslim-left",
      femalePoseId: "taslim-left",
      claimSlotIds: CLAIMS.taslim.slice(),
      contentReuse: true,
      isFinalStep: true
    });
  }

  return { steps, nextOrder: o };
}

function buildMaghrib() {
  const prayerId = "maghrib";
  let order = 1;
  let all = [];
  let r;
  r = unitCycle(prayerId, 1, order, { withTakbir: true, endWithRise: true });
  all = all.concat(r.steps); order = r.nextOrder;
  r = unitCycle(prayerId, 2, order, { withTakbir: false, afterTashahhud: "middle", endWithRise: true });
  all = all.concat(r.steps); order = r.nextOrder;
  r = unitCycle(prayerId, 3, order, { withTakbir: false, afterTashahhud: "final", endWithTaslim: true });
  all = all.concat(r.steps);
  return pack(prayerId, {
    titleDe: "Maġrib",
    titleAr: "صلاة المغرب",
    rakAhCount: 3,
    requiredSteps: 28,
    steps: all,
    completionLabel: "Maġrib-Lernablauf beendet."
  });
}

function buildFourRakah(prayerId, meta) {
  let order = 1;
  let all = [];
  let r;
  r = unitCycle(prayerId, 1, order, { withTakbir: true, endWithRise: true });
  all = all.concat(r.steps); order = r.nextOrder;
  r = unitCycle(prayerId, 2, order, { withTakbir: false, afterTashahhud: "middle", endWithRise: true });
  all = all.concat(r.steps); order = r.nextOrder;
  r = unitCycle(prayerId, 3, order, { withTakbir: false, endWithRise: true });
  all = all.concat(r.steps); order = r.nextOrder;
  r = unitCycle(prayerId, 4, order, { withTakbir: false, afterTashahhud: "final", endWithTaslim: true });
  all = all.concat(r.steps);
  return pack(prayerId, {
    titleDe: meta.titleDe,
    titleAr: meta.titleAr,
    rakAhCount: 4,
    requiredSteps: 36,
    steps: all,
    completionLabel: meta.completionLabel,
    sharedModel: "four-rakah"
  });
}

function pack(prayerId, cfg) {
  const steps = cfg.steps;
  if (steps.length !== cfg.requiredSteps) {
    throw new Error(`${prayerId}: expected ${cfg.requiredSteps} got ${steps.length}`);
  }
  const last = steps[steps.length - 1];
  return {
    id: prayerId,
    titleDe: cfg.titleDe,
    titleAr: cfg.titleAr,
    rakAhCount: cfg.rakAhCount,
    rakat: cfg.rakAhCount,
    audioEnabled: false,
    phase: 13,
    engine: "compose-from-templates",
    sharedModel: cfg.sharedModel || null,
    verificationNote: "Technische Lernsequenz · Content/Posen research · productionEnabled=false · keine erfundenen religiösen Texte.",
    sequence: steps.map((s) => s.id),
    sequenceSteps: steps,
    completion: {
      labelDe: cfg.completionLabel,
      options: ["retry", "overview"],
      noGamification: true,
      noReligiousJudgement: true,
      noLoopToTakbir: true,
      finalStepId: last.id,
      learningSequenceCompletedOnlyAfterFinal: true
    },
    readyForApprovedContent: true,
    technicalSequenceComplete: true,
    religiousApproved: false,
    productionEnabled: false,
    requiredSteps: cfg.requiredSteps
  };
}

function writeRecitationStub(prayerId, rakAh) {
  const id = `${prayerId}-r${rakAh}-recitation-v1`;
  const file = path.join(BASE, "content", `${prayerId}-r${rakAh}-recitation.json`);
  if (fs.existsSync(file)) return;
  const doc = {
    id,
    prayerId,
    rakAh,
    stepTemplateId: "recitation",
    titleDe: "Rezitation",
    titleAr: "القراءة",
    status: "research",
    approved: false,
    reviewPass1: false,
    reviewPass2: false,
    sourceClaimIds: [],
    doNotDuplicateQuranText: true,
    quranDatabaseReuse: true,
    quranRef: { surah: 1, ayahStart: 1, ayahEnd: 7 },
    audioId: null,
    note: "Placeholder slot · Qurʾān via existing DB · no invented text"
  };
  fs.writeFileSync(file, JSON.stringify(doc, null, 2) + "\n");
}

function writeTashahhudStub(kind) {
  const id = `${kind}-tashahhud-v1`;
  const file = path.join(BASE, "content", `${kind}-tashahhud.json`);
  if (fs.existsSync(file)) return;
  const doc = {
    id,
    stepId: "tashahhud",
    tashahhudKind: kind,
    titleDe: kind === "middle" ? "Mittlerer Tašahhud" : "Finaler Tašahhud",
    titleAr: "التشهد",
    status: "research",
    approved: false,
    reviewPass1: false,
    reviewPass2: false,
    sourceClaimIds: [],
    modules: {
      tashahhudText: { labelDe: "Tašahhud", approved: false, status: "research" },
      salatIbrahimiyya: { labelDe: "Ṣalāh Ibrāhīmiyyah", approved: false, status: "research" },
      duaBeforeTaslim: { labelDe: "Duʿāʾ vor Taslīm", approved: false, status: "research" }
    },
    audioId: null,
    note: "Research slot · no invented Arabic/dhikr"
  };
  fs.writeFileSync(file, JSON.stringify(doc, null, 2) + "\n");
}

function ensurePoseSlots() {
  ["male", "female"].forEach((gender) => {
    const file = path.join(BASE, "poses", `${gender}-v1.json`);
    const j = JSON.parse(fs.readFileSync(file, "utf8"));
    const char = gender === "female" ? "dar-prayer-female-v1" : "dar-prayer-male-v1";
    ["middle-tashahhud", "final-tashahhud"].forEach((poseId) => {
      if (!j.poses[poseId]) {
        j.poses[poseId] = {
          assetId: `${gender}-v1-${poseId}-v1`,
          characterId: char,
          poseId,
          assetType: "image",
          src: null,
          srcWebp: null,
          srcAvif: null,
          srcset: [],
          sourceClaimIds: [],
          status: "MISSING",
          characterConsistency: false,
          clothingReview: false,
          poseReview: false,
          reviewPass1: false,
          reviewPass2: false,
          approved: false,
          active: false,
          poseReuseFrom: "tashahhud",
          expectedFile: `${gender}-v1-${poseId}.webp`,
          expectedAvif: `${gender}-v1-${poseId}.avif`,
          note: "Slot · may reuse tashahhud master until separate approved asset"
        };
      }
      if (j.activeAssets && j.activeAssets[poseId] === undefined) j.activeAssets[poseId] = null;
    });
    fs.writeFileSync(file, JSON.stringify(j, null, 2) + "\n");
  });
}

const maghrib = buildMaghrib();
fs.writeFileSync(path.join(BASE, "maghrib.json"), JSON.stringify(maghrib, null, 2) + "\n");

const fourMeta = {
  dhuhr: { titleDe: "Ẓuhr", titleAr: "صلاة الظهر", completionLabel: "Ẓuhr-Lernablauf beendet." },
  asr: { titleDe: "ʿAṣr", titleAr: "صلاة العصر", completionLabel: "ʿAṣr-Lernablauf beendet." },
  isha: { titleDe: "ʿIšāʾ", titleAr: "صلاة العشاء", completionLabel: "ʿIšāʾ-Lernablauf beendet." }
};

Object.keys(fourMeta).forEach((id) => {
  const doc = buildFourRakah(id, fourMeta[id]);
  fs.writeFileSync(path.join(BASE, `${id}.json`), JSON.stringify(doc, null, 2) + "\n");
  for (let r = 1; r <= 4; r++) writeRecitationStub(id, r);
});

for (let r = 1; r <= 3; r++) writeRecitationStub("maghrib", r);
writeTashahhudStub("middle");
writeTashahhudStub("final");
ensurePoseSlots();

// shared model reference copy
fs.writeFileSync(
  path.join(BASE, "models/four-rakah.json"),
  JSON.stringify({
    id: "four-rakah",
    rakAhCount: 4,
    requiredSteps: 36,
    usedBy: ["dhuhr", "asr", "isha"],
    note: "Shared technical learning model · prayer-specific masters reuse same step pattern"
  }, null, 2) + "\n"
);

console.log(JSON.stringify({
  maghrib: maghrib.requiredSteps,
  dhuhr: 36,
  asr: 36,
  isha: 36,
  maghribFinal: maghrib.completion.finalStepId
}, null, 2));
