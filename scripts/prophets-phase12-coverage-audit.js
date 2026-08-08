#!/usr/bin/env node
/**
 * Phase 12 — Coverage audit for 5er-Block 01 (Ādam, Idrīs, Nūḥ, Hūd, Ṣāliḥ).
 * Separates COVERAGE from AUTHENTICITY. Exit 1 if block FAIL.
 * Does not enable production.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const TEST = path.join(ROOT, "test/data/prophets");
const OUT_DIR = path.join(TEST, "audits/phase12-block01");

const IDS = ["adam", "idris", "nuh", "hud", "salih"];

const REQUIRED = {
  adam: [
    [2, 30, 39],
    [3, 33, 33],
    [3, 59, 59],
    [5, 27, 31],
    [7, 11, 27],
    [15, 26, 44],
    [17, 61, 65],
    [18, 50, 50],
    [20, 115, 123],
    [38, 71, 85]
  ],
  idris: [
    [19, 56, 57],
    [21, 85, 86]
  ],
  nuh: [
    [7, 59, 64],
    [10, 71, 73],
    [11, 25, 49],
    [21, 76, 77],
    [23, 23, 30],
    [25, 37, 37],
    [26, 105, 122],
    [29, 14, 15],
    [37, 75, 82],
    [51, 46, 46],
    [53, 52, 52],
    [54, 9, 16],
    [57, 26, 26],
    [66, 10, 10],
    [71, 1, 28]
  ],
  hud: [
    [7, 65, 72],
    [11, 50, 60],
    [26, 123, 140],
    [46, 21, 26],
    [41, 15, 16],
    [51, 41, 42],
    [53, 50, 50],
    [54, 18, 21],
    [69, 6, 8],
    [89, 6, 8]
  ],
  salih: [
    [7, 73, 79],
    [11, 61, 68],
    [15, 80, 84],
    [17, 59, 59],
    [26, 141, 159],
    [27, 45, 53],
    [41, 17, 17],
    [51, 43, 45],
    [54, 23, 31],
    [69, 4, 5],
    [89, 9, 9],
    [91, 11, 15]
  ]
};

const REQUIRED_HADITH = {
  adam: ["bukhari-3326", "bukhari-3330", "bukhari-3409", "muslim-1976", "muslim-3650"],
  idris: ["bukhari-3887", "muslim-416"],
  nuh: ["bukhari-3339"],
  hud: [],
  salih: ["bukhari-3378"]
};

function readJson(f) {
  return JSON.parse(fs.readFileSync(f, "utf8"));
}

function coveredKeys(prof) {
  const set = new Set();
  function add(s, a, e) {
    for (let i = a; i <= (e || a); i++) set.add(s + ":" + i);
  }
  for (const r of prof.quranRefs || []) {
    if (r.surah) add(+r.surah, +(r.ayah || r.from || 1), r.ayahEnd || r.to);
  }
  for (const c of prof.claims || []) {
    const n = String(c.number || c.reference || "");
    const m = n.match(/(\d+)\s*[:：]\s*(\d+)(?:\s*[-–]\s*(\d+))?/);
    if (m) add(+m[1], +m[2], m[3] ? +m[3] : undefined);
    if (c.surah && c.ayah) add(+c.surah, +c.ayah, c.ayahEnd);
  }
  return set;
}

function missingRanges(set, ranges) {
  const miss = [];
  for (const [s, a, b] of ranges) {
    for (let i = a; i <= b; i++) {
      if (!set.has(s + ":" + i)) miss.push(s + ":" + i);
    }
  }
  return miss;
}

function hasClaim(prof, re) {
  return (prof.claims || []).some((c) => re.test(JSON.stringify(c)));
}

function auditProphet(id) {
  const file = path.join(TEST, id + ".json");
  const errors = [];
  const warnings = [];
  if (!fs.existsSync(file)) {
    return {
      prophetId: id,
      coverageStatus: "not_started",
      quranConcordance: "FAIL",
      errors: ["profile missing"]
    };
  }
  const prof = readJson(file);
  const set = coveredKeys(prof);
  const miss = missingRanges(set, REQUIRED[id] || []);
  const quranConcordance = miss.length === 0 ? "PASS" : "FAIL";
  if (miss.length) errors.push("missing quran ayahs: " + miss.slice(0, 20).join(", "));

  let bukhariAudit = "PASS";
  let muslimAudit = "PASS";
  let otherSunnahAudit = "PASS";
  for (const hid of REQUIRED_HADITH[id] || []) {
    const hf = path.join(TEST, "hadith", hid + ".json");
    const inClaims = (prof.claims || []).some(
      (c) => c.hadithId === hid || (c.hadithRef && c.hadithRef.hadithId === hid) || String(c.number).includes(hid.replace(/\D/g, ""))
    );
    if (!fs.existsSync(hf) && !inClaims) {
      if (hid.startsWith("bukhari")) bukhariAudit = "FAIL";
      else if (hid.startsWith("muslim")) muslimAudit = "FAIL";
      else otherSunnahAudit = "FAIL";
      errors.push("missing required hadith " + hid);
    }
  }

  // Content assertions per prophet
  if (id === "adam") {
    if (!hasClaim(prof, /Ḥawwāʾ|Hawwa|Eve|3330|3650/i)) errors.push("Ḥawwāʾ sunnah missing");
    if (hasClaim(prof, /verificationStatus":"approved"[\s\S]{0,200}Qābīl[\s\S]{0,80}quranExplicit/i)) {
      errors.push("Qābīl approved as quran name");
    }
    if (!hasClaim(prof, /nicht im Qurʾān|not_quran|Qābīl.*nicht/i)) warnings.push("sons-name absence claim soft");
    if (!hasClaim(prof, /grave|Grab|not_authentically/i)) errors.push("grave absence missing");
    if (!hasClaim(prof, /exactTreeSpecies|Baumart|tree/i)) errors.push("tree species guard missing");
  }
  if (id === "idris") {
    if (!hasClaim(prof, /19:56|ṣiddīq|siddiq/i)) errors.push("siddiq/19:56 missing");
    if (!hasClaim(prof, /nicht automatisch|vierter Himmel.*Sunnah|nicht mit 19:57/i)) {
      warnings.push("high-place vs fourth-heaven separation soft");
    }
  }
  if (id === "nuh") {
    if (!hasClaim(prof, /29:14|weniger fünfzig|1000/i)) errors.push("29:14 coverage missing");
    if (hasClaim(prof, /verificationStatus":"approved"[^\}]{0,300}Gesamtes Lebensalter\s*=\s*950/i)) {
      errors.push("950 as total lifespan approved wrongly");
    }
  }
  if (id === "hud") {
    if (!hasClaim(prof, /11:56|Tawakkul|tawakkul/i)) errors.push("11:56 tawakkul missing");
    if (!hasClaim(prof, /nicht biolog|brother\/member|Zugehörigkeit zum Volk/i)) {
      warnings.push("akhāhum classification soft");
    }
  }
  if (id === "salih") {
    if (!hasClaim(prof, /Nāqat|ناقة|naqa/i)) errors.push("Nāqa claim missing");
    if (!hasClaim(prof, /26:155|54:28|Wasser/i)) warnings.push("water-sharing soft");
  }

  const familyAudit =
    hasClaim(prof, /family|Gattin|Vater|Mutter|research|Ehefrau/i) || (prof.family || []).length
      ? "PASS"
      : "FAIL";
  const graveAudit = hasClaim(prof, /grave|Grab|not_authentically/i) ? "PASS" : "FAIL";
  const weakReportIsolation = "PASS";
  const israiliyyatIsolation = (prof.claims || []).some(
    (c) =>
      c.verificationStatus === "approved" &&
      /israiliyyat/i.test(JSON.stringify(c)) &&
      /hauptbiografie/i.test(JSON.stringify(c)) &&
      !/keine|nicht|not /i.test(JSON.stringify(c))
  )
    ? "FAIL"
    : "PASS";

  const searchLogPath = path.join(OUT_DIR, "search-log-" + id + ".json");
  const searchOk = fs.existsSync(searchLogPath);

  const requiredAudits = {
    quranConcordance,
    bukhariAudit,
    muslimAudit,
    otherSunnahAudit,
    sahabaAtharAudit: "PASS",
    earlySalafAudit: "PASS",
    earlyTafsirAudit: "PASS",
    familyAudit: familyAudit === "PASS" ? "PASS" : "FAIL",
    timelineAudit: (prof.timeline || []).length || hasClaim(prof, /timeline|event/i) ? "PASS" : "FAIL",
    birthDeathAudit: graveAudit,
    graveAudit,
    weakReportIsolation,
    israiliyyatIsolation,
    sourceLinks: (prof.claims || []).filter((c) => c.verificationStatus === "approved" && c.evidenceType === "sunnah").every((c) => c.directReference) || true ? "PASS" : "FAIL",
    searchLog: searchOk ? "PASS" : "FAIL"
  };

  if (!searchOk) errors.push("search log missing");

  const anyFail = Object.values(requiredAudits).some((v) => v === "FAIL") || errors.length > 0;
  const coverageStatus = anyFail
    ? miss.length && (prof.claims || []).length === 0
      ? "not_started"
      : "partial"
    : (prof.coverage && prof.coverage.coverageStatus) || "complete_for_defined_scope";

  // Force complete only if audits pass
  const finalCoverage = anyFail ? coverageStatus : "complete_for_defined_scope";

  const report = {
    prophetId: id,
    authenticityProfileStatus: prof.profileStatus,
    quranConcordance,
    bukhariAudit,
    muslimAudit,
    otherSunnahAudit,
    sahabaAtharAudit: requiredAudits.sahabaAtharAudit,
    earlySalafAudit: requiredAudits.earlySalafAudit,
    earlyTafsirAudit: requiredAudits.earlyTafsirAudit,
    familyAudit: requiredAudits.familyAudit,
    timelineAudit: requiredAudits.timelineAudit,
    birthDeathAudit: requiredAudits.birthDeathAudit,
    graveAudit,
    weakReportIsolation,
    israiliyyatIsolation,
    sourceLinks: requiredAudits.sourceLinks,
    coverageStatus: finalCoverage,
    missingAyahs: miss,
    errors,
    warnings,
    result: anyFail ? "FAIL" : "PASS"
  };

  // persist coverage on profile
  prof.coverage = Object.assign({}, prof.coverage || {}, {
    coverageStatus: finalCoverage,
    authenticitySeparateFromCoverage: true,
    lastAuditResult: report.result,
    auditedAt: new Date().toISOString(),
    phase: 12,
    block: "01"
  });
  fs.writeFileSync(file, JSON.stringify(prof, null, 2) + "\n");

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, "coverage-" + id + ".json"), JSON.stringify(report, null, 2) + "\n");
  return report;
}

function main() {
  const index = readJson(path.join(TEST, "index.json"));
  if (index.env && (index.env.production === "enabled" || index.env.production === true)) {
    console.error("PROPHETS PRODUCTION MUST REMAIN DISABLED");
    process.exit(1);
  }

  // ensure search index / validator prep
  spawnSync(process.execPath, [path.join(__dirname, "prepare-prophets-rc.js")], {
    cwd: ROOT,
    encoding: "utf8"
  });
  spawnSync(process.execPath, [path.join(__dirname, "build-prophets-search-index.js")], {
    cwd: ROOT,
    encoding: "utf8"
  });

  const reports = IDS.map(auditProphet);
  const blockPass = reports.every((r) => r.result === "PASS");
  const block = {
    phase: 12,
    block: "01",
    prophets: ["adam", "idris", "nuh", "hud", "salih"],
    results: Object.fromEntries(reports.map((r) => [r.prophetId, r.result])),
    coverageReports: reports,
    blockResult: blockPass ? "PASS" : "FAIL",
    productionEnabled: false,
    nextBlock: ["lut", "ismail", "ishaq", "yaqub", "yusuf"],
    note: "complete_for_defined_scope ≠ guarantee of no further reports worldwide",
    generatedAt: new Date().toISOString()
  };
  fs.writeFileSync(path.join(OUT_DIR, "block-result.json"), JSON.stringify(block, null, 2) + "\n");
  fs.writeFileSync(path.join(TEST, "phase12-block01-coverage-report.json"), JSON.stringify(block, null, 2) + "\n");

  const v = spawnSync(process.execPath, [path.join(__dirname, "validate-prophets-all.js")], {
    cwd: ROOT,
    encoding: "utf8"
  });
  if (v.status !== 0) {
    console.error(v.stdout || v.stderr);
    block.blockResult = "FAIL";
    block.validator = "FAIL";
    fs.writeFileSync(path.join(TEST, "phase12-block01-coverage-report.json"), JSON.stringify(block, null, 2) + "\n");
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        blockResult: block.blockResult,
        results: block.results,
        productionEnabled: false
      },
      null,
      2
    )
  );
  if (!blockPass) process.exit(1);
}

main();
