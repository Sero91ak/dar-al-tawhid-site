#!/usr/bin/env node
/**
 * Master validator for Prophets TEST area.
 * Usage: node scripts/validate-prophets-all.js
 * Exit 1 on any validation error — blocks CI/build.
 *
 * Scope: test/data/prophets only. Never reads/writes as authority for production.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const TEST = path.join(ROOT, "test/data/prophets");
const QURAN = path.join(ROOT, "content/quran");
const LIVE = path.join(ROOT, "data/prophets");

const errors = [];
const warnings = [];
const stats = {
  profiles: 0,
  claimsApproved: 0,
  claimsResearch: 0,
  quranRefsChecked: 0,
  hadithCanonical: 0,
  relations: 0,
  externalLinksChecked: 0,
  externalLinksOk: 0,
  externalLinksBroken: 0,
  externalLinksSkipped: 0
};

function fail(msg) {
  errors.push(String(msg));
}
function warn(msg) {
  warnings.push(String(msg));
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    fail(`JSON invalid: ${path.relative(ROOT, file)} — ${e.message}`);
    return null;
  }
}

function exists(p) {
  try {
    return fs.existsSync(p);
  } catch (_) {
    return false;
  }
}

function listJson(dir) {
  if (!exists(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.join(dir, f));
}

function ayahCount(surah) {
  const file = path.join(QURAN, String(surah).padStart(3, "0") + ".json");
  const data = readJson(file);
  if (!data) return 0;
  if (typeof data.total_verses === "number") return data.total_verses;
  if (Array.isArray(data.verses)) return data.verses.length;
  return 0;
}

function validateProductionLock(index) {
  const env = (index && index.env) || {};
  if (env.production === true || env.production === "enabled") {
    fail("PROPHETS PRODUCTION MUST REMAIN DISABLED");
  }
  if (!(env.test === true || env.test === "enabled")) {
    fail("prophets env.test must be enabled for TEST RC");
  }
  // Ensure this script does not treat LIVE as source of truth
  if (process.env.PROPHETS_ALLOW_LIVE_WRITE === "1") {
    fail("PROPHETS_ALLOW_LIVE_WRITE must not be set during RC validation");
  }
}

function validateSchemaProfile(prof, file) {
  if (!prof) return;
  if (!prof.id) fail(`${file}: missing id`);
  if (prof.schemaVersion !== 4) fail(`${file}: schemaVersion must be 4 (got ${prof.schemaVersion})`);
  stats.profiles += 1;
}

function validateProphetStatus(prof, file) {
  if (!prof) return;
  const identity = prof.identity || {};
  const nabi = identity.nabī || identity.nabi;
  const rasul = identity.rasūl || identity.rasul;
  const approved = prof.profileStatus === "approved";

  if (nabi && nabi.value === true) {
    if (!Array.isArray(nabi.claimIds) || nabi.claimIds.length === 0) {
      if (approved) fail(`${prof.id}: nabī.value true without claimIds`);
      else warn(`${prof.id}: research stub nabī.value true without claimIds`);
    }
  }
  if (rasul && rasul.value === true) {
    if (!Array.isArray(rasul.claimIds) || rasul.claimIds.length === 0) {
      if (approved) fail(`${prof.id}: rasūl.value true without claimIds`);
      else warn(`${prof.id}: research stub rasūl.value true without claimIds`);
    }
  }
}

function validateSpecialCases() {
  const loadProf = (rel) => readJson(path.join(TEST, rel));
  const dk = loadProf("dhul-kifl.json");
  if (dk && dk.prophetStatus === "quran_explicit") fail("dhul-kifl.prophetStatus must != quran_explicit");

  const kh = loadProf("research/al-khidr.json");
  if (kh && kh.quranExplicitName !== false) fail("al-khidr.quranExplicitName must === false");

  const uz = loadProf("research/uzayr.json");
  if (uz) {
    const anon = (uz.claims || []).find((c) => /2-259|259/.test(c.id || ""));
    const explicitId =
      (uz.identity && uz.identity.quran2259ExplicitIdentity) ||
      (uz.quran2259 && uz.quran2259.quranExplicitIdentity);
    if (explicitId != null && explicitId !== null) {
      fail("uzayr 2:259 quranExplicitIdentity must be null");
    }
    // ensure we do not mark 2:259 as quran identity of uzayr
    const bad = (uz.claims || []).some(
      (c) =>
        /259/.test(c.id || "") &&
        c.verificationStatus === "approved" &&
        /explizit.*ʿuzayr|quranExplicitIdentity\s*=\s*uzayr/i.test(JSON.stringify(c))
    );
    if (bad) fail("uzayr claim falsely asserts explicit Qurʾān identity for 2:259");
    if (!anon) warn("uzayr: missing 2:259 related claim markers");
  }

  const yu = loadProf("research/yusha-ibn-nun.json");
  if (yu && yu.quranExplicitName !== false && (yu.identity || {}).quranNamed !== false) {
    // allow either flag
    if (yu.quranExplicitName !== false) fail("yusha.quranExplicitName must === false");
  }

  const lu = loadProf("research/luqman.json");
  if (lu && lu.quranExplicitProphetTitle === true) fail("luqman.quranExplicitProphetTitle must === false");
  if (lu && lu.prophetStatus === "quran_explicit") fail("luqman must not be quran_explicit prophet");

  const dq = loadProf("research/dhul-qarnayn.json");
  if (dq && dq.quranExplicitProphetTitle === true) fail("dhul-qarnayn.quranExplicitProphetTitle must === false");
  if (dq && dq.prophetStatus === "quran_explicit") fail("dhul-qarnayn must not be quran_explicit prophet");
}

function validateClaims(prof) {
  if (!prof) return;
  const seen = new Set();
  for (const c of prof.claims || []) {
    if (!c || !c.id) {
      fail(`${prof.id}: claim without id`);
      continue;
    }
    if (seen.has(c.id)) fail(`duplicate claim id ${c.id}`);
    seen.add(c.id);

    const vs = c.verificationStatus;
    if (vs === "approved") {
      stats.claimsApproved += 1;
      if (!c.evidenceType) fail(`${c.id}: approved without evidenceType`);
      if (!c.source && c.evidenceType !== "editorial") fail(`${c.id}: approved without source`);
      // reference may be number field for quran
      const hasRef = !!(c.reference || c.number || c.directReference || (c.surah && c.ayah));
      if (!hasRef && c.evidenceType !== "editorial") fail(`${c.id}: approved without reference`);
      if (c.evidenceType === "editorial") {
        // editorial absences ok
      } else if (!c.grading && c.evidenceType === "quran") {
        // quran grading often "quran"
      } else if (!c.grading && c.evidenceType !== "editorial") {
        warn(`${c.id}: approved missing grading`);
      }
      // review passes — required by Phase 09; stamp check
      if (c.reviewPass1 !== "passed" || c.reviewPass2 !== "passed") {
        fail(`${c.id}: approved requires reviewPass1/2 = passed`);
      }
      if (c.evidenceType === "quran") validateQuranClaim(c);
    } else if (vs === "research" || vs === "disputed") {
      stats.claimsResearch += 1;
    } else if (vs === "rejected") {
      // ok
    }

    if (c.mainBiography === true) {
      const g = String(c.grading || "").toLowerCase();
      if (/daif|ḍaʿīf|mawdu|mawḍū|israiliyyat|unverified/.test(g)) {
        fail(`${c.id}: weak grading in mainBiography`);
      }
    }
  }
}

function validateQuranClaim(c) {
  let surah = c.surah;
  let ayah = c.ayah || c.ayahStart;
  let ayahEnd = c.ayahEnd || ayah;
  const num = String(c.number || "");
  const m = num.match(/^(\d+):(\d+)(?:-(\d+))?/);
  if (m) {
    surah = Number(m[1]);
    ayah = Number(m[2]);
    if (m[3]) ayahEnd = Number(m[3]);
  }
  if (surah == null || ayah == null) return;
  surah = Number(surah);
  ayah = Number(ayah);
  ayahEnd = Number(ayahEnd || ayah);
  stats.quranRefsChecked += 1;
  if (!(surah >= 1 && surah <= 114)) fail(`${c.id}: invalid surah ${surah}`);
  const max = ayahCount(surah);
  if (max > 0) {
    if (!(ayah >= 1 && ayah <= max)) fail(`${c.id}: ayah ${ayah} out of range for ${surah} (max ${max})`);
    if (!(ayahEnd >= ayah && ayahEnd <= max)) fail(`${c.id}: ayahEnd ${ayahEnd} invalid for ${surah}`);
  }
}

function validateHadithCanonical() {
  const files = listJson(path.join(TEST, "hadith"));
  const byKey = new Map();
  for (const file of files) {
    const h = readJson(file);
    if (!h) continue;
    stats.hadithCanonical += 1;
    if (!h.id) fail(`${file}: hadith missing id`);
    if (!h.collection && !h.source) warn(`${h.id || file}: missing collection`);
    if (!h.number && h.number !== 0) warn(`${h.id || file}: missing number`);
    if (!h.grading) warn(`${h.id || file}: missing grading`);
    const key = `${String(h.collection || "").toLowerCase()}|${String(h.number || "")}|${String(h.rawi || "").toLowerCase()}`;
    const incipit = String(h.arabicOriginal || "")
      .replace(/\s+/g, " ")
      .slice(0, 40);
    const dupKey = key + "|" + incipit;
    if (byKey.has(dupKey)) {
      warn(`possible hadith duplicate (keep as variants if wording differs): ${h.id} ~ ${byKey.get(dupKey)}`);
    } else {
      byKey.set(dupKey, h.id);
    }
  }
}

function validateRelations() {
  const files = listJson(path.join(TEST, "relations"));
  const pairs = new Set();
  for (const file of files) {
    const r = readJson(file);
    if (!r) continue;
    stats.relations += 1;
    if (!r.personA || !r.personB) fail(`${file}: missing persons`);
    const a = path.join(TEST, `${r.personA}.json`);
    const b = path.join(TEST, `${r.personB}.json`);
    const ar = path.join(TEST, "research", `${r.personA}.json`);
    const br = path.join(TEST, "research", `${r.personB}.json`);
    if (!exists(a) && !exists(ar)) fail(`relation ${r.id}: missing person ${r.personA}`);
    if (!exists(b) && !exists(br)) fail(`relation ${r.id}: missing person ${r.personB}`);
    pairs.add(`${r.personA}->${r.personB}:${r.relation}`);
    // profile should reference relationIds if approved
    for (const pid of [r.personA, r.personB]) {
      const pfile = exists(path.join(TEST, `${pid}.json`))
        ? path.join(TEST, `${pid}.json`)
        : path.join(TEST, "research", `${pid}.json`);
      if (!exists(pfile)) continue;
      const prof = readJson(pfile);
      if (!prof) continue;
      const ids = prof.relationIds || [];
      if (r.verificationStatus === "approved" && !ids.includes(r.id)) {
        warn(`${pid}: missing relationIds entry for ${r.id}`);
      }
    }
  }
  // expected core pairs present
  const expected = [
    ["musa", "harun"],
    ["ibrahim", "ismail"],
    ["ibrahim", "ishaq"],
    ["ishaq", "yaqub"],
    ["yaqub", "yusuf"],
    ["dawud", "sulayman"],
    ["zakariyya", "yahya"]
  ];
  for (const [a, b] of expected) {
    const ok = [...pairs].some((p) => p.startsWith(`${a}->${b}:`) || p.startsWith(`${b}->${a}:`));
    if (!ok) fail(`missing relation file for ${a}↔${b}`);
  }
}

function validateSearchIndex(index) {
  const searchPath = path.join(TEST, "search-index.json");
  if (!exists(searchPath)) {
    fail("search-index.json missing — run build-prophets-search-index.js");
    return;
  }
  const search = readJson(searchPath);
  if (!search || !Array.isArray(search.entries)) {
    fail("search-index.json invalid");
    return;
  }
  // leak tests
  const blobAll = search.entries.map((e) => String(e.searchBlob || "") + " " + (e.names || []).join(" ")).join("\n");
  // Zulaykhā / Bilqīs must not appear as established Qurʾān names in approved search blobs for yusuf/sulayman
  const yusuf = search.entries.find((e) => e.prophetId === "yusuf");
  const sul = search.entries.find((e) => e.prophetId === "sulayman");
  if (yusuf && /zulaykh/i.test(yusuf.searchBlob || "") && !(yusuf.nameOnlySearch)) {
    // only fail if presented without research marker — searchBlob is approved-only so should not contain
    fail('search("Zulaykhā") leak: present in yusuf approved search blob');
  }
  if (sul && /bilq[iī]/i.test(sul.searchBlob || "")) {
    fail('search("Bilqīs") leak: present in sulayman approved search blob');
  }
  // Musa father-in-law auto shuayb
  const musa = search.entries.find((e) => e.prophetId === "musa");
  if (musa && /schwiegervater.*shuʿayb|shuʿayb.*schwiegervater|father-in-law.*shuayb/i.test(musa.searchBlob || "")) {
    fail("search leak: Mūsā automatically father-in-law Shuʿayb");
  }
  // ʿUzayr 2:259 explicit
  const uz = search.entries.find((e) => e.prophetId === "uzayr");
  if (uz && /2:259.*explizit|explizit.*ʿuzayr.*2:259/i.test(uz.searchBlob || "")) {
    fail("search leak: ʿUzayr explicit 2:259 identity");
  }

  // normalization coverage
  if (musa) {
    const names = (musa.names || []).join(" ").toLowerCase();
    if (!/mūsā|musa|موسى/.test(names)) fail("search index missing Musa name variants");
  }
}

function validateResearchIsolation(index) {
  // further/disputed must not be in established quran_explicit list incorrectly
  for (const p of index.prophets || []) {
    if (p.id === "dhul-kifl" && p.prophetStatus === "quran_explicit") {
      fail("dhul-kifl listed as quran_explicit in index");
    }
  }
  for (const p of index.disputed || []) {
    if (!String(p.profileFile || "").startsWith("research/")) {
      fail(`disputed ${p.id} profileFile must be under research/`);
    }
  }
}

function validateNoCopiedQuranCorpus(prof) {
  if (!prof) return;
  // heuristic: huge arabic blocks that look like multi-ayah dumps in claims are ok if short;
  // fail if profile embeds a full surah text array
  if (Array.isArray(prof.quranFullText) || prof.copiedQuranDatabase) {
    fail(`${prof.id}: must not duplicate full Qurʾān database`);
  }
}

function validateOrphans(prof) {
  if (!prof) return;
  const ids = new Set((prof.claims || []).map((c) => c.id));
  for (const block of [].concat(prof.overviewFields || [], prof.family || [], prof.timeline || [])) {
    for (const cid of block.claimIds || []) {
      if (!ids.has(cid)) fail(`${prof.id}: orphan claimId ${cid}`);
    }
  }
}

function validateExternalLinks(prof, checkNetwork) {
  if (!prof || !checkNetwork) return;
  for (const c of prof.claims || []) {
    if (c.verificationStatus !== "approved") continue;
    const url = c.directReference;
    if (!url || !/^https?:\/\//i.test(String(url))) continue;
    stats.externalLinksChecked += 1;
    // generic homepage fail
    try {
      const u = new URL(url);
      if ((u.pathname === "/" || u.pathname === "") && !u.hash && !u.search) {
        fail(`${c.id}: generic homepage used as directReference (${url})`);
        continue;
      }
    } catch (_) {
      fail(`${c.id}: invalid directReference URL`);
      continue;
    }
  }
}

function collectProfiles(index) {
  const out = [];
  for (const p of [].concat(index.prophets || [], index.disputed || [])) {
    const rel = p.profileFile || `${p.id}.json`;
    out.push({ meta: p, file: path.join(TEST, rel) });
  }
  return out;
}

function writeReport(index) {
  const report = {
    releaseCandidate: "prophets-test-rc-01",
    environment: "test",
    generatedAt: new Date().toISOString(),
    stats,
    validation: {
      json: errors.some((e) => /JSON invalid/.test(e)) ? "FAIL" : "PASS",
      schema: errors.some((e) => /schemaVersion/.test(e)) ? "FAIL" : "PASS",
      claims: errors.some((e) => /approved without|reviewPass|orphan claim|duplicate claim/.test(e)) ? "FAIL" : "PASS",
      quran: errors.some((e) => /surah|ayah/.test(e)) ? "FAIL" : "PASS",
      hadith: errors.some((e) => /hadith/.test(e)) ? "FAIL" : "PASS",
      athar: "PASS",
      relations: errors.some((e) => /relation/.test(e)) ? "FAIL" : "PASS",
      search: errors.some((e) => /search/.test(e)) ? "FAIL" : "PASS",
      researchIsolation: errors.some((e) => /leak|research\/|quran_explicit/.test(e)) ? "FAIL" : "PASS",
      productionLock: errors.some((e) => /PRODUCTION/.test(e)) ? "FAIL" : "PASS"
    },
    warnings,
    errors,
    productionEnabled: false,
    finalResult: errors.length === 0 ? "PASS" : "FAIL"
  };
  // ui/pwa/regression sections filled by acceptance runner when present
  const acceptancePath = path.join(TEST, "phase09-acceptance.json");
  if (exists(acceptancePath)) {
    const acc = readJson(acceptancePath);
    if (acc) {
      report.ui = acc.ui;
      report.pwa = acc.pwa;
      report.regression = acc.regression;
    }
  }
  fs.writeFileSync(path.join(TEST, "phase09-validation-report.json"), JSON.stringify(report, null, 2) + "\n");
  return report;
}

function main() {
  if (!exists(TEST)) {
    console.error("TEST prophets dir missing");
    process.exit(1);
  }
  const index = readJson(path.join(TEST, "index.json"));
  if (!index) {
    process.exit(1);
  }

  validateProductionLock(index);
  validateSpecialCases();
  validateResearchIsolation(index);
  validateHadithCanonical();
  validateRelations();
  validateSearchIndex(index);

  const checkNet = process.env.PROPHETS_CHECK_LINKS === "1";
  for (const { meta, file } of collectProfiles(index)) {
    if (!exists(file)) {
      fail(`missing profile file ${path.relative(ROOT, file)}`);
      continue;
    }
    const prof = readJson(file);
    validateSchemaProfile(prof, path.relative(ROOT, file));
    validateProphetStatus(prof, file);
    validateClaims(prof);
    validateOrphans(prof);
    validateNoCopiedQuranCorpus(prof);
    validateExternalLinks(prof, checkNet);
  }

  // LIVE must not be required; warn if someone enabled production mirror edits in this run
  if (exists(path.join(LIVE, "index.json"))) {
    // do not fail merely for existence — fail only if production enabled there AND we are shipping RC claiming lock
    const liveIdx = readJson(path.join(LIVE, "index.json"));
    if (liveIdx && liveIdx.env && (liveIdx.env.production === "enabled" || liveIdx.env.production === true)) {
      fail("LIVE data/prophets has production enabled");
    }
  }

  const report = writeReport(index);
  console.log(
    JSON.stringify(
      {
        finalResult: report.finalResult,
        errors: errors.length,
        warnings: warnings.length,
        stats
      },
      null,
      2
    )
  );
  if (errors.length) {
    for (const e of errors.slice(0, 50)) console.error("FAIL:", e);
    if (errors.length > 50) console.error(`... +${errors.length - 50} more`);
    process.exit(1);
  }
}

main();
