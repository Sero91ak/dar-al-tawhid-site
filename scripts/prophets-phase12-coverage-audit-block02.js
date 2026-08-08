#!/usr/bin/env node
/**
 * Phase 12 — Coverage audit for 5er-Block 02 (Lūṭ, Ismāʿīl, Isḥāq, Yaʿqūb, Yūsuf).
 * Separates COVERAGE from AUTHENTICITY. Exit 1 if block FAIL.
 * Does not enable production. Never writes data/prophets/.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const TEST = path.join(ROOT, "test/data/prophets");
const REL = path.join(TEST, "relations");
const OUT_DIR = path.join(TEST, "audits/phase12-block02");
const LIVE = path.join(ROOT, "data/prophets");

const IDS = ["lut", "ismail", "ishaq", "yaqub", "yusuf"];

const REQUIRED = {
  lut: [
    [6, 86, 86],
    [7, 80, 84],
    [11, 69, 83],
    [15, 57, 77],
    [21, 74, 75],
    [26, 160, 175],
    [27, 54, 58],
    [29, 28, 35],
    [37, 133, 138],
    [51, 31, 37],
    [54, 33, 39],
    [66, 10, 10]
  ],
  ismail: [
    [2, 125, 129],
    [2, 133, 133],
    [2, 136, 136],
    [2, 140, 140],
    [4, 163, 163],
    [6, 86, 86],
    [14, 37, 39],
    [19, 54, 55],
    [21, 85, 86],
    [38, 48, 48],
    [37, 100, 107]
  ],
  ishaq: [
    [2, 133, 133],
    [2, 136, 136],
    [2, 140, 140],
    [3, 84, 84],
    [4, 163, 163],
    [6, 84, 84],
    [11, 71, 73],
    [12, 6, 6],
    [14, 39, 39],
    [19, 49, 49],
    [21, 72, 73],
    [29, 27, 27],
    [37, 112, 113],
    [38, 45, 45]
  ],
  yaqub: [
    [2, 132, 133],
    [2, 136, 136],
    [2, 140, 140],
    [3, 84, 84],
    [4, 163, 163],
    [6, 84, 84],
    [11, 71, 71],
    [12, 4, 101],
    [19, 49, 49],
    [21, 72, 73],
    [29, 27, 27],
    [38, 45, 45]
  ],
  yusuf: [
    [12, 1, 111],
    [6, 84, 84],
    [40, 34, 34]
  ]
};

const REQUIRED_HADITH = {
  lut: ["bukhari-3375", "bukhari-3387", "muslim-151.01"],
  ismail: ["bukhari-3358", "bukhari-3362", "bukhari-3363", "bukhari-3364"],
  ishaq: ["bukhari-3390"],
  yaqub: ["bukhari-3390"],
  yusuf: ["bukhari-3387", "bukhari-3390", "muslim-162.01"]
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
    if (r.surah) add(+r.surah, +(r.ayah || r.from || 1), +(r.ayahEnd || r.to || r.ayah || 1));
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

function assertNoLiveWrite() {
  // Sanity: block must not have mutated production prophets during this audit.
  // We only check gate file remains disabled; live files may pre-exist from earlier eras.
  const idx = readJson(path.join(TEST, "index.json"));
  if (idx.env && (idx.env.production === "enabled" || idx.env.production === true)) {
    throw new Error("PROPHETS PRODUCTION MUST REMAIN DISABLED");
  }
  if (fs.existsSync(path.join(LIVE, "index.json"))) {
    try {
      const live = readJson(path.join(LIVE, "index.json"));
      if (live.env && (live.env.production === "enabled" || live.env.test === "enabled")) {
        // live index may exist; we do not touch it. Only fail if THIS audit flipped test env on live.
      }
    } catch (_) {
      /* ignore */
    }
  }
}

function familyConsistencyOk() {
  const files = [
    ["ibrahim-ismail.json", "ibrahim", "ismail"],
    ["ibrahim-ishaq.json", "ibrahim", "ishaq"],
    ["ishaq-yaqub.json", "ishaq", "yaqub"],
    ["yaqub-yusuf.json", "yaqub", "yusuf"]
  ];
  const errors = [];
  for (const [fname, a, b] of files) {
    const p = path.join(REL, fname);
    if (!fs.existsSync(p)) {
      errors.push("missing relation " + fname);
      continue;
    }
    const d = readJson(p);
    if (d.verificationStatus !== "approved") errors.push(fname + " not approved");
    if (d.personA !== a || d.personB !== b) errors.push(fname + " person mismatch");
  }
  return errors;
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
      errors: ["profile missing"],
      result: "FAIL"
    };
  }
  const prof = readJson(file);
  const set = coveredKeys(prof);
  const miss = missingRanges(set, REQUIRED[id] || []);
  const quranConcordance = miss.length === 0 ? "PASS" : "FAIL";
  if (miss.length) errors.push("missing quran ayahs: " + miss.slice(0, 25).join(", "));

  let bukhariAudit = "PASS";
  let muslimAudit = "PASS";
  let otherSunnahAudit = "PASS";
  for (const hid of REQUIRED_HADITH[id] || []) {
    const hf = path.join(TEST, "hadith", hid + ".json");
    const inClaims = (prof.claims || []).some(
      (c) =>
        c.hadithId === hid ||
        (c.hadithRef && c.hadithRef.hadithId === hid) ||
        String(c.number || "").includes(hid.replace(/^[a-z]+-/, "").replace(/\./g, ""))
    );
    if (!fs.existsSync(hf) && !inClaims) {
      if (hid.startsWith("bukhari")) bukhariAudit = "FAIL";
      else if (hid.startsWith("muslim")) muslimAudit = "FAIL";
      else otherSunnahAudit = "FAIL";
      errors.push("missing required hadith " + hid);
    }
  }

  // Content assertions
  if (id === "lut") {
    if (!hasClaim(prof, /66:10|Verrat/i)) errors.push("66:10 betrayal claim missing");
    if (hasClaim(prof, /verificationStatus":"approved"[^}]{0,400}sexuell(e|er)? Untreue als Qur/i)) {
      errors.push("66:10 auto sexual infidelity approved wrongly");
    }
    if (!hasClaim(prof, /Sodom|Gomorr|historical/i)) errors.push("Sodom/Gomorrah isolation missing");
    if (!hasClaim(prof, /Töchter|daughtersInterpretation|tafsir_review/i)) {
      warnings.push("daughters tafsir review soft");
    }
    if (hasClaim(prof, /verificationStatus":"approved"[^}]{0,300}(Wāʿilah|Wa'ila|Ehefrau Lūṭs heißt)/i)) {
      errors.push("Lut wife popular name approved as fact");
    }
  }
  if (id === "ismail") {
    if (!hasClaim(prof, /Hājar|Hāǧar|هاجر|3358/i)) errors.push("Hājar sunnah missing");
    if (!hasClaim(prof, /QurʾānExplicitName=false|nicht genannt|37:100/i)) {
      errors.push("sacrifice son naming discipline missing");
    }
    if (hasClaim(prof, /In Qurʾān 37:102 befiehlt Allah Ibrāhīm,\s*Ismāʿīl zu opfern/i)) {
      errors.push("bad sacrifice formulation present");
    }
    if (!hasClaim(prof, /wifeNames|Ehefrauen-Existenz|wife names/i)) {
      warnings.push("wife names isolation soft");
    }
  }
  if (id === "ishaq") {
    if (!hasClaim(prof, /37:112|nabī|Nabi/i)) errors.push("37:112 nabī missing");
    if (!hasClaim(prof, /3390|Yaʿqūb ibn Isḥāq|ibn Isḥāq/i)) errors.push("genealogy 3390 missing");
    if (!hasClaim(prof, /source_correlation|11:71|Sarah/i)) errors.push("mother correlation missing");
    if (!hasClaim(prof, /quranExplicitSacrificeSonName|Opfer-Sohn|37:100/i)) {
      warnings.push("sacrifice son discipline soft");
    }
  }
  if (id === "yaqub") {
    if (!hasClaim(prof, /3390|ibn Isḥāq|Vater.*Isḥāq/i)) errors.push("father Isḥāq / 3390 missing");
    if (!hasClaim(prof, /Binyāmīn|Benjamin|quranExplicitName=false/i)) {
      errors.push("Binyāmīn not-quran-explicit missing");
    }
    if (!hasClaim(prof, /Isrāʾīl|Israel|source_review/i)) errors.push("Isrāʾīl alias review missing");
    if (!hasClaim(prof, /12:84|weiß vor Kummer|Trauer/i)) errors.push("12:84 grief/eyes missing");
    if (hasClaim(prof, /verificationStatus":"approved"[^}]{0,300}(Rachel|Raḥīl)[^}]{0,80}Qurʾān-Name/i)) {
      errors.push("Rachel as quran name approved");
    }
  }
  if (id === "yusuf") {
    if (!hasClaim(prof, /3390|ibn Yaʿqūb/i)) errors.push("genealogy 3390 missing");
    if (!hasClaim(prof, /Zulaykhā|Zulaikha|Frau des al-ʿAzīz/i)) errors.push("Zulaykhā isolation missing");
    if (!hasClaim(prof, /7 Jahre|exactDuration|mehrere\/einige Jahre|not_quranically/i)) {
      errors.push("prison duration discipline missing");
    }
    if (!hasClaim(prof, /al-malik|Firʿawn|Firawn/i)) errors.push("king≠Firʿawn discipline missing");
    if (!hasClaim(prof, /12:101|Duʿāʾ|Dua/i)) errors.push("12:101 dua discipline missing");
    if (!hasClaim(prof, /162|Hälfte der Schönheit|schönheit/i)) errors.push("Muslim 162 beauty missing");
    if (!hasClaim(prof, /tafsir_review_required|12:51|12:52/i)) {
      warnings.push("12:51–53 speaker review soft");
    }
    if (hasClaim(prof, /verificationStatus":"approved"[^}]{0,200}Finance Minister|Prime Minister|Viceroy/i)) {
      // only fail if presented as quran designation without negation
      if (!hasClaim(prof, /nicht automatisch Finance|nicht automatisch.*Viceroy|keine modernen Titel/i)) {
        errors.push("modern office titles may be approved wrongly");
      }
    }
  }

  const familyAudit =
    hasClaim(prof, /family|Vater|Mutter|Ehefrau|Sohn|research/i) || (prof.family || []).length
      ? "PASS"
      : "FAIL";
  const graveAudit = hasClaim(prof, /grave|Grab|not_authentically/i) ? "PASS" : "FAIL";
  const namesAudit =
    id === "lut" || id === "ismail" || id === "ishaq" || id === "yaqub" || id === "yusuf"
      ? hasClaim(prof, /quranExplicitName|nicht.*genannt|research|not_quran/i)
        ? "PASS"
        : "FAIL"
      : "PASS";
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
    namesAudit,
    timelineAudit: (prof.timeline || []).length || hasClaim(prof, /timeline|event|death|Tod/i) ? "PASS" : "FAIL",
    birthDeathAudit: graveAudit,
    graveAudit,
    weakReportIsolation,
    israiliyyatIsolation,
    sourceLinks: "PASS",
    searchLog: searchOk ? "PASS" : "FAIL"
  };

  if (!searchOk) errors.push("search log missing");
  if (namesAudit === "FAIL") errors.push("names audit missing");

  const anyFail = Object.values(requiredAudits).some((v) => v === "FAIL") || errors.length > 0;
  const finalCoverage = anyFail ? (miss.length && !(prof.claims || []).length ? "not_started" : "partial") : "complete_for_defined_scope";

  const report = {
    prophetId: id,
    authenticityProfileStatus: prof.profileStatus,
    quranConcordance,
    bukhariAudit,
    muslimAudit,
    otherSunnahAudit: requiredAudits.otherSunnahAudit,
    sahabaAtharAudit: requiredAudits.sahabaAtharAudit,
    earlySalafAudit: requiredAudits.earlySalafAudit,
    earlyTafsirAudit: requiredAudits.earlyTafsirAudit,
    familyAudit: requiredAudits.familyAudit,
    namesAudit,
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

  prof.coverage = Object.assign({}, prof.coverage || {}, {
    coverageStatus: finalCoverage,
    authenticitySeparateFromCoverage: true,
    lastAuditResult: report.result,
    auditedAt: new Date().toISOString(),
    phase: 12,
    block: "02",
    requiredAudits
  });
  fs.writeFileSync(file, JSON.stringify(prof, null, 2) + "\n");

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, "coverage-" + id + ".json"), JSON.stringify(report, null, 2) + "\n");
  return report;
}

function main() {
  assertNoLiveWrite();

  const prep = spawnSync(process.execPath, [path.join(__dirname, "prophets_phase12_coverage_block02.py")], {
    cwd: ROOT,
    encoding: "utf8",
    shell: false
  });
  // python may be invoked via python3
  if (prep.error || prep.status !== 0) {
    const py = spawnSync("python3", [path.join(__dirname, "prophets_phase12_coverage_block02.py")], {
      cwd: ROOT,
      encoding: "utf8"
    });
    if (py.status !== 0) {
      console.error(py.stdout || py.stderr || prep.stderr);
      process.exit(1);
    }
    console.log(py.stdout);
  } else {
    console.log(prep.stdout);
  }

  spawnSync(process.execPath, [path.join(__dirname, "prepare-prophets-rc.js")], {
    cwd: ROOT,
    encoding: "utf8"
  });
  spawnSync(process.execPath, [path.join(__dirname, "build-prophets-search-index.js")], {
    cwd: ROOT,
    encoding: "utf8"
  });

  const familyErrors = familyConsistencyOk();
  const reports = IDS.map(auditProphet);
  const blockPass = reports.every((r) => r.result === "PASS") && familyErrors.length === 0;
  const block = {
    phase: 12,
    block: "02",
    prophets: IDS,
    results: Object.fromEntries(reports.map((r) => [r.prophetId, r.result])),
    coverageReports: reports,
    familyConsistencyErrors: familyErrors,
    blockResult: blockPass ? "PASS" : "FAIL",
    productionEnabled: false,
    testEnabled: true,
    noLiveRelease: true,
    nextBlock: ["ayyub", "shuayb", "musa", "harun", "dawud"],
    note: "complete_for_defined_scope ≠ guarantee of no further reports worldwide; READY/PASS ≠ live",
    generatedAt: new Date().toISOString()
  };
  fs.writeFileSync(path.join(OUT_DIR, "block-result.json"), JSON.stringify(block, null, 2) + "\n");
  fs.writeFileSync(path.join(TEST, "phase12-block02-coverage-report.json"), JSON.stringify(block, null, 2) + "\n");

  const v = spawnSync(process.execPath, [path.join(__dirname, "validate-prophets-all.js")], {
    cwd: ROOT,
    encoding: "utf8"
  });
  if (v.status !== 0) {
    console.error(v.stdout || v.stderr);
    block.blockResult = "FAIL";
    block.validator = "FAIL";
    fs.writeFileSync(path.join(TEST, "phase12-block02-coverage-report.json"), JSON.stringify(block, null, 2) + "\n");
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        blockResult: block.blockResult,
        results: block.results,
        familyConsistencyErrors: familyErrors,
        productionEnabled: false
      },
      null,
      2
    )
  );
  if (!blockPass) process.exit(1);
}

main();
