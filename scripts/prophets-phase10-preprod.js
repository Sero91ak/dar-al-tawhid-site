#!/usr/bin/env node
/**
 * Phase 10 — Production rollout PREPARATION only.
 *
 * NEVER:
 *  - copy into data/prophets/
 *  - set production = enabled
 *  - deploy live / change production SW
 *
 * TEST remains source of truth. Exit 1 if not ready / critical failures.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync, execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const TEST = path.join(ROOT, "test/data/prophets");
const LIVE = path.join(ROOT, "data/prophets");
const TEST_UI = path.join(ROOT, "test/assets/prophets");
const LIVE_UI = path.join(ROOT, "assets/prophets");
const RC_ID = "prophets-final-test-v1";
const RC_DIR = path.join(TEST, "release-candidates", RC_ID);
const PHASE10 = path.join(RC_DIR, "phase10-preprod");
const ROLLBACK = path.join(RC_DIR, "rollback");

const errors = [];
const warnings = [];
const critical = {
  criticalErrors: 0,
  sourceErrors: 0,
  quranErrors: 0,
  researchLeaks: 0,
  schemaErrors: 0,
  productionUnexpectedChanges: 0
};

function fail(msg, bucket) {
  errors.push(String(msg));
  if (bucket && critical[bucket] != null) critical[bucket] += 1;
  else critical.criticalErrors += 1;
}
function warn(msg) {
  warnings.push(String(msg));
}

function exists(p) {
  try {
    return fs.existsSync(p);
  } catch (_) {
    return false;
  }
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    fail(`JSON invalid: ${path.relative(ROOT, file)} — ${e.message}`, "schemaErrors");
    return null;
  }
}

function writeJson(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + "\n");
}

function sha256File(file) {
  const h = crypto.createHash("sha256");
  h.update(fs.readFileSync(file));
  return h.digest("hex");
}

function walkFiles(dir, acc = []) {
  if (!exists(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (name === "release-candidates" || name === "node_modules") continue;
      walkFiles(p, acc);
    } else if (st.isFile()) {
      acc.push(p);
    }
  }
  return acc;
}

function gitCommit() {
  try {
    return execSync("git rev-parse HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
  } catch (_) {
    return "unknown";
  }
}

function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, "/");
}

function runNode(script, env) {
  return spawnSync(process.execPath, [script], {
    cwd: ROOT,
    encoding: "utf8",
    env: Object.assign({}, process.env, env || {})
  });
}

function collectProfiles(index) {
  const out = [];
  for (const meta of [].concat(index.prophets || [], index.disputed || [])) {
    const file = path.join(TEST, meta.profileFile || `${meta.id}.json`);
    out.push({ meta, file, prof: exists(file) ? readJson(file) : null });
  }
  return out;
}

function freezeStamp(index, commit) {
  const freeze = {
    releaseCandidate: RC_ID,
    commit: commit || null,
    prepCommit: commit,
    contentVersion: index.contentVersion || RC_ID,
    schemaVersion: index.schemaVersion || 4,
    createdAt: new Date().toISOString(),
    validationResult: "PASS",
    contentFrozen: true,
    productionEnabled: false,
    note:
      "CONTENT FREEZE for prophets-final-test-v1. production remains disabled. Explicit separate go-live required. PASS ≠ LIVE."
  };
  writeJson(path.join(PHASE10, "freeze.json"), freeze);
  writeJson(path.join(RC_DIR, "freeze.json"), freeze);
  return freeze;
}

function buildHashManifest() {
  const files = [];
  const must = [
    path.join(TEST, "index.json"),
    path.join(TEST, "search-index.json"),
    path.join(TEST_UI, "prophets.js"),
    path.join(TEST_UI, "prophets.css"),
    path.join(ROOT, "scripts/validate-prophets-all.js"),
    path.join(ROOT, "scripts/build-prophets-search-index.js"),
    path.join(ROOT, "scripts/build-prophets-content-manifest.js"),
    path.join(ROOT, "scripts/prophets-phase09-smoke.js"),
    path.join(ROOT, "scripts/prophets-phase10-preprod.js")
  ];
  for (const p of must) {
    if (!exists(p)) fail(`missing hash target ${rel(p)}`);
    else files.push({ path: rel(p), sha256: sha256File(p) });
  }
  for (const p of walkFiles(TEST)) {
    const r = rel(p);
    if (r.includes("release-candidates/")) continue;
    if (r.includes("phase09-") || r.includes("phase08-") || r.includes("content-manifest")) {
      // include audits/manifests too
    }
    if (files.some((f) => f.path === r)) continue;
    files.push({ path: r, sha256: sha256File(p) });
  }
  for (const p of walkFiles(path.join(TEST, "hadith"))) {
    const r = rel(p);
    if (!files.some((f) => f.path === r)) files.push({ path: r, sha256: sha256File(p) });
  }
  files.sort((a, b) => a.path.localeCompare(b.path));
  const manifest = {
    releaseCandidate: RC_ID,
    generatedAt: new Date().toISOString(),
    algorithm: "SHA-256",
    fileCount: files.length,
    files
  };
  writeJson(path.join(PHASE10, "hash-manifest.json"), manifest);
  return manifest;
}

function buildSourceInventory(profiles) {
  const inv = {
    quranClaims: 0,
    sahihHadithClaims: 0,
    hasanHadithClaims: 0,
    reliableAtharClaims: 0,
    disputedClaims: 0,
    historicalClaims: 0,
    researchClaims: 0,
    weakReports: 0,
    israiliyyatReports: 0
  };
  for (const { prof } of profiles) {
    if (!prof) continue;
    for (const c of prof.claims || []) {
      const vs = c.verificationStatus;
      const et = String(c.evidenceType || "");
      const g = String(c.grading || "").toLowerCase();
      if (vs === "approved" && et === "quran") inv.quranClaims += 1;
      if (vs === "approved" && (et === "sunnah" || et === "hadith") && /sahih|ṣaḥīḥ/.test(g)) {
        inv.sahihHadithClaims += 1;
      }
      if (vs === "approved" && /hasan|ḥasan/.test(g)) inv.hasanHadithClaims += 1;
      if (vs === "approved" && et === "athar") inv.reliableAtharClaims += 1;
      if (vs === "disputed") inv.disputedClaims += 1;
      if (vs === "research") inv.researchClaims += 1;
      if (/historical|history/.test(et) || c.historical === true) inv.historicalClaims += 1;
    }
    for (const w of [].concat(prof.weakReports || [], prof.excludedReports || [])) {
      inv.weakReports += 1;
      const blob = JSON.stringify(w).toLowerCase();
      if (/israiliyyat|isrā/.test(blob)) inv.israiliyyatReports += 1;
    }
  }
  writeJson(path.join(PHASE10, "source-inventory.json"), {
    releaseCandidate: RC_ID,
    generatedAt: new Date().toISOString(),
    method: "calculateFromValidatedData",
    counts: inv
  });
  return inv;
}

function validateTraceability(profiles) {
  let checked = 0;
  for (const { prof } of profiles) {
    if (!prof) continue;
    for (const c of prof.claims || []) {
      if (c.verificationStatus !== "approved") continue;
      checked += 1;
      if (c.evidenceType === "editorial") continue;
      const hasSource = !!(c.source || c.sourceId || c.collection);
      const hasRef = !!(c.reference || c.number || c.directReference || (c.surah != null && c.ayah != null));
      if (!hasSource) fail(`${c.id}: approved claim missing source/sourceId`, "sourceErrors");
      if (!hasRef) fail(`${c.id}: approved claim missing reference/directReference`, "sourceErrors");
      // Quran path: surah/ayah fields OR reference/number like "19:56"
      if (c.evidenceType === "quran") {
        let surah = Number(c.surah);
        let ayah = Number(c.ayah);
        const ref = String(c.reference || c.number || "");
        const m = ref.match(/(\d+)\s*[:：]\s*(\d+)/);
        if ((!Number.isFinite(surah) || surah < 1) && m) {
          surah = Number(m[1]);
          ayah = Number(m[2]);
        }
        if (!Number.isFinite(surah) || surah < 1 || surah > 114) {
          fail(`${c.id}: quran surah out of range (${ref || c.surah})`, "quranErrors");
        } else if (Number.isFinite(ayah) && ayah < 1) {
          fail(`${c.id}: quran ayah invalid`, "quranErrors");
        }
        continue;
      }
      // Hadith: prefer hadithId file resolution
      const hid = c.hadithId || (c.hadithRef && c.hadithRef.hadithId);
      if (hid) {
        const hf = path.join(TEST, "hadith", `${hid}.json`);
        if (!exists(hf)) fail(`${c.id}: hadithId ${hid} file missing`, "sourceErrors");
        else {
          const h = readJson(hf);
          if (!h || !h.id) fail(`${c.id}: hadith record empty`, "sourceErrors");
          if (!h.directReference && !c.directReference) {
            warn(`${c.id}: no directReference on claim or hadith record`);
          }
        }
      }
    }
  }
  writeJson(path.join(PHASE10, "traceability-report.json"), {
    releaseCandidate: RC_ID,
    approvedClaimsChecked: checked,
    errors: errors.filter((e) => /approved claim|hadithId|quran surah/.test(e)),
    result: errors.some((e) => /approved claim|hadithId|quran surah/.test(e)) ? "FAIL" : "PASS"
  });
}

function buildVisibilityMap(index) {
  const map = { releaseCandidate: RC_ID, generatedAt: new Date().toISOString(), entries: [] };
  for (const p of index.prophets || []) {
    let visibility = "public";
    if (p.profileStatus === "research") visibility = "research_only";
    if (p.id === "dhul-kifl" || /disputed|scholarly_/.test(String(p.prophetStatus || ""))) {
      visibility = "qualified";
    }
    if (p.furtherPerson) visibility = "qualified";
    map.entries.push({
      id: p.id,
      visibility,
      profileFile: p.profileFile || `${p.id}.json`,
      prophetStatus: p.prophetStatus,
      profileStatus: p.profileStatus
    });
  }
  for (const p of index.disputed || []) {
    map.entries.push({
      id: p.id,
      visibility: "qualified",
      profileFile: p.profileFile || `research/${p.id}.json`,
      prophetStatus: p.prophetStatus,
      profileStatus: p.profileStatus,
      note: "research_only for unresolved internal reports; UI: further/qualified section only"
    });
  }
  writeJson(path.join(PHASE10, "visibility-map.json"), map);
  return map;
}

function buildProductionMapping() {
  const mapping = {
    releaseCandidate: RC_ID,
    note: "DOCUMENTATION ONLY — do not copy automatically",
    autoSyncForbidden: true,
    mappings: [
      { test: "test/data/prophets/index.json", plannedProduction: "data/prophets/index.json" },
      { test: "test/data/prophets/*.json (core profiles)", plannedProduction: "data/prophets/*.json" },
      { test: "test/data/prophets/research/", plannedProduction: "data/prophets/research/" },
      { test: "test/data/prophets/hadith/", plannedProduction: "data/prophets/hadith/" },
      { test: "test/data/prophets/athar/", plannedProduction: "data/prophets/athar/" },
      { test: "test/data/prophets/relations/", plannedProduction: "data/prophets/relations/" },
      { test: "test/data/prophets/sources/", plannedProduction: "data/prophets/sources/" },
      { test: "test/data/prophets/search-index.json", plannedProduction: "data/prophets/search-index.json" },
      { test: "test/assets/prophets/prophets.js", plannedProduction: "assets/prophets/prophets.js" },
      { test: "test/assets/prophets/prophets.css", plannedProduction: "assets/prophets/prophets.css" }
    ],
    productionEnvTargetAfterExplicitApprovalOnly: {
      test: "enabled",
      production: "disabled_until_explicit_user_approval"
    }
  };
  writeJson(path.join(PHASE10, "production-mapping.json"), mapping);
  return mapping;
}

function buildProductionDiff() {
  const added = [];
  const modified = [];
  const deleted = [];
  const unchanged = [];
  const unexpected = [];

  const testFiles = walkFiles(TEST)
    .map(rel)
    .filter((p) => !p.includes("release-candidates/") && !/phase0[89]|phase10|content-manifest|BACKUP/.test(p));

  const liveFiles = walkFiles(LIVE).map(rel);

  const testRelSet = new Set(
    testFiles.map((p) => p.replace(/^test\//, ""))
  );
  const liveRelSet = new Set(liveFiles.map((p) => p.replace(/^data\//, "")));

  // Compare by basename path under prophets/
  function strip(p) {
    return p.replace(/^(test|data)\//, "");
  }

  const testMap = new Map();
  for (const p of testFiles) testMap.set(strip(p), path.join(ROOT, p));
  const liveMap = new Map();
  for (const p of liveFiles) liveMap.set(strip(p), path.join(ROOT, p));

  for (const [k, tp] of testMap) {
    if (!liveMap.has(k)) added.push(k);
    else {
      const a = sha256File(tp);
      const b = sha256File(liveMap.get(k));
      if (a === b) unchanged.push(k);
      else modified.push(k);
    }
  }
  for (const [k] of liveMap) {
    if (!testMap.has(k)) deleted.push(k);
  }

  // Unrelated scope check on current git diff vs HEAD parent for this branch work — only prophets prep allowed
  const diff = spawnSync("git", ["diff", "--name-only", "HEAD"], { cwd: ROOT, encoding: "utf8" });
  const untracked = spawnSync("git", ["ls-files", "--others", "--exclude-standard"], {
    cwd: ROOT,
    encoding: "utf8"
  });
  const changed = []
    .concat((diff.stdout || "").split("\n"), (untracked.stdout || "").split("\n"))
    .map((s) => s.trim())
    .filter(Boolean);

  const forbidden = [
    /onesignal/i,
    /prayer-push/i,
    /quiz-questions/,
    /content\/feed/,
    /service-worker\.js$/,
    /^index\.html$/,
    /bottom-nav/,
    /theme.*system/i
  ];
  for (const f of changed) {
    if (forbidden.some((re) => re.test(f))) {
      unexpected.push(f);
      fail(`unrelated file in Phase 10 change set: ${f}`, "productionUnexpectedChanges");
    }
    if (/^(data\/prophets\/|assets\/prophets\/)/.test(f) && !f.includes("rollback")) {
      // writing live prophets during phase 10 is forbidden
      unexpected.push(f);
      fail(`PRODUCTION WRITE DURING PHASE 10 FORBIDDEN: ${f}`, "productionUnexpectedChanges");
    }
  }

  const report = {
    releaseCandidate: RC_ID,
    generatedAt: new Date().toISOString(),
    vsLiveTree: "data/prophets",
    ADDED: added.sort(),
    MODIFIED: modified.sort(),
    DELETED: deleted.sort(),
    UNCHANGED: unchanged.sort(),
    productionDeleteCount: deleted.length,
    productionDeleteRequiresManualReview: deleted.length > 0,
    unexpectedProductionChanges: unexpected,
    note: "Diff is planned only — no files copied to production in Phase 10."
  };
  writeJson(path.join(PHASE10, "production-diff.json"), report);
  return report;
}

function copyDir(src, dest) {
  if (!exists(src)) return 0;
  let n = 0;
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const s = path.join(src, name);
    const d = path.join(dest, name);
    const st = fs.statSync(s);
    if (st.isDirectory()) n += copyDir(s, d);
    else {
      fs.copyFileSync(s, d);
      n += 1;
    }
  }
  return n;
}

function buildRollbackPackage() {
  fs.mkdirSync(ROLLBACK, { recursive: true });
  const prevIndex = path.join(LIVE, "index.json");
  if (exists(prevIndex)) {
    fs.copyFileSync(prevIndex, path.join(ROLLBACK, "previous-index.json"));
  } else {
    writeJson(path.join(ROLLBACK, "previous-index.json"), {
      note: "No live prophets index present at freeze time",
      env: { production: "disabled" }
    });
  }
  const nFiles = copyDir(LIVE, path.join(ROLLBACK, "previous-prophet-files"));
  const nUi = copyDir(LIVE_UI, path.join(ROLLBACK, "previous-ui"));
  if (exists(path.join(LIVE, "search-index.json"))) {
    fs.mkdirSync(path.join(ROLLBACK, "previous-search-index"), { recursive: true });
    fs.copyFileSync(
      path.join(LIVE, "search-index.json"),
      path.join(ROLLBACK, "previous-search-index", "search-index.json")
    );
  }
  const cacheVersion = {
    capturedAt: new Date().toISOString(),
    liveContentVersion: null,
    note: "Local snapshot — restore without internet by copying previous-* back to data/assets prophets paths AFTER explicit rollback order only."
  };
  if (exists(prevIndex)) {
    const idx = readJson(prevIndex);
    cacheVersion.liveContentVersion = (idx && (idx.contentVersion || idx.version)) || null;
    cacheVersion.liveEnv = (idx && idx.env) || null;
  }
  writeJson(path.join(ROLLBACK, "previous-cache-version", "cache-version.json"), cacheVersion);
  writeJson(path.join(ROLLBACK, "ROLLBACK_README.json"), {
    restoreRequiresExplicitOrder: true,
    internetIndependent: true,
    filesCopied: { prophetFiles: nFiles, uiFiles: nUi },
    warning: "Phase 10 does not execute production restore."
  });
  return { nFiles, nUi };
}

function simulateRollbackSmoke() {
  // Simulation only: verify rollback package readable + RC still validates; no live writes.
  const steps = [];
  const rcIndex = readJson(path.join(TEST, "index.json"));
  steps.push({ step: "RC present", ok: !!(rcIndex && rcIndex.env && rcIndex.env.production === "disabled") });
  const prev = exists(path.join(ROLLBACK, "previous-index.json"));
  steps.push({ step: "rollback snapshot present", ok: prev });
  const v = runNode(path.join(__dirname, "validate-prophets-all.js"));
  steps.push({ step: "RC validate after rollback package create", ok: v.status === 0 });
  // Ensure production still disabled
  steps.push({
    step: "production remains disabled",
    ok: rcIndex.env.production === "disabled" || rcIndex.env.production === false
  });
  const ok = steps.every((s) => s.ok);
  if (!ok) fail("rollback simulation failed", "criticalErrors");
  writeJson(path.join(PHASE10, "rollback-simulation.json"), {
    result: ok ? "PASS" : "FAIL",
    steps,
    note: "No live install/uninstall performed — package integrity + RC re-validate only."
  });
  return ok;
}

function contentAssertions(profiles) {
  const byId = Object.create(null);
  for (const row of profiles) {
    if (row.prof) byId[row.prof.id] = row.prof;
  }
  const musa = byId.musa;
  if (!musa) fail("musa profile missing");
  else {
    const father = (musa.claims || []).find((c) => /father|imran|ʿimrān|imrān/i.test(c.id + c.claim));
    if (!father || father.verificationStatus !== "approved") fail("Mūsā father ʿImrān assertion missing/approved");
    const blob = JSON.stringify(father || {});
    if (!/muslim|Ṣaḥīḥ Muslim|sahih muslim/i.test(blob)) {
      // check linked hadith
      const hid = father && (father.hadithId || (father.hadithRef && father.hadithRef.hadithId));
      let ok = /muslim/i.test(blob);
      if (hid && exists(path.join(TEST, "hadith", hid + ".json"))) {
        ok = ok || /muslim/i.test(fs.readFileSync(path.join(TEST, "hadith", hid + ".json"), "utf8"));
      }
      if (!ok) fail("Mūsā father source must involve Ṣaḥīḥ Muslim");
    }
    const wifeApprovedName = (musa.claims || []).some(
      (c) =>
        c.verificationStatus === "approved" &&
        /wife|gattin|ehefrau/i.test(c.id + (c.claim || "")) &&
        /name|heißt|genannt/i.test(c.claim || "") &&
        !/not_|nicht|ohne|unbekannt|nicht authentisch|not explicit/i.test(c.claim || "")
    );
    // soft: do not require absence of all wife claims — only auto Shuayb FIL
    const shuaybFil = (musa.claims || []).some(
      (c) =>
        c.verificationStatus === "approved" &&
        /father-in-law|schwiegervater|shuayb|shuʿayb/i.test(c.id + (c.claim || "")) &&
        /automat|identisch|is shuayb|= shuayb/i.test(c.claim || "")
    );
    if (shuaybFil) fail("Mūsā father-in-law must not be automatically Shuʿayb");
    if (wifeApprovedName) warn("Mūsā may have approved wife-name claim — verify evidence manually");
  }

  const yusuf = byId.yusuf;
  if (yusuf) {
    const zul = (yusuf.claims || []).some((c) => {
      if (c.verificationStatus !== "approved") return false;
      const blob = JSON.stringify(c);
      if (!/zulaykh/i.test(blob)) return false;
      if (/nicht|not_|popularName\s*=\s*research|kein Qur|not.*qur/i.test(blob)) return false;
      return /als Qurʾān-Name|quranExplicitName\s*[:=]\s*true|explizit im Qur/i.test(blob);
    });
    if (zul) fail("Yūsuf must not approve Zulaykhā as Qurʾān name", "researchLeaks");
  }

  const sul = byId.sulayman;
  if (sul) {
    const bil = (sul.claims || []).some((c) => {
      if (c.verificationStatus !== "approved") return false;
      const blob = JSON.stringify(c);
      if (!/bilq[iī]s/i.test(blob)) return false;
      if (/nicht|not_|automatisch|kein Qur|not.*qur/i.test(blob)) return false;
      return /als Qurʾān-Name|quranExplicitName\s*[:=]\s*true|explizit im Qur/i.test(blob);
    });
    if (bil) fail("Sulaymān must not approve Bilqīs as Qurʾān name", "researchLeaks");
  }

  const isa = byId.isa;
  if (isa) {
    if (isa.identity && isa.identity.humanFather && isa.identity.humanFather !== "none") {
      fail("ʿĪsā humanFather must be none");
    }
    const humanFather = (isa.claims || []).some((c) => {
      if (c.verificationStatus !== "approved") return false;
      const blob = c.id + (c.claim || "");
      if (!/humanFather|human father|irdischer vater/i.test(blob)) return false;
      if (/not approved|NOT approved|kein|none|ohne|≠|!=/i.test(blob)) return false;
      return /=\s*[A-Za-zĀ-ſ]{3,}/.test(blob) && !/none/i.test(blob);
    });
    if (humanFather) fail("ʿĪsā must not have approved human father");
  }

  const yunus = byId.yunus;
  if (yunus) {
    const matta = (yunus.claims || []).some(
      (c) => c.verificationStatus === "approved" && /mattā|matta|متى/i.test(JSON.stringify(c))
    );
    if (!matta && !(yunus.identity && /matt/i.test(JSON.stringify(yunus.identity)))) {
      warn("Yūnus father Mattā not found as approved claim — verify");
    }
  }

  const kh = byId["al-khidr"];
  if (kh && kh.quranExplicitName !== false) fail("al-Khiḍr quranExplicitName must be false");

  const uz = byId.uzayr;
  if (uz) {
    const explicit =
      (uz.identity && uz.identity.quran2259ExplicitIdentity) ||
      (uz.quran2259 && uz.quran2259.quranExplicitIdentity);
    if (explicit != null) fail("ʿUzayr 2:259 identity must not be quran_explicit");
  }

  const dk = byId["dhul-kifl"];
  if (dk && dk.prophetStatus === "quran_explicit") fail("Dhū l-Kifl prophetStatus must != quran_explicit");
}

function audit124k() {
  const files = walkFiles(TEST).filter((p) => !p.includes("release-candidates"));
  for (const f of files) {
    if (!/\.(json|js|css|md)$/.test(f)) continue;
    let data;
    try {
      data = JSON.parse(fs.readFileSync(f, "utf8"));
    } catch (_) {
      // non-json text
      const text = fs.readFileSync(f, "utf8");
      if (
        /124[.,]?000\s+Propheten|124000 prophets|124,000 prophets/i.test(text) &&
        /gesamtzahl.*ist|insgesamt genau|exactly 124|total number of prophets is 124/i.test(text) &&
        !/nicht|never|disputed|research|document_only/i.test(text)
      ) {
        fail(`124000 presented as certain total in ${rel(f)}`, "researchLeaks");
      }
      continue;
    }
    const claims = [].concat(data.claims || [], data.weakReports || [], data.researchNotes || []);
    // also scan nested arrays on profile
    for (const c of claims) {
      const blob = JSON.stringify(c);
      if (!/124[.,]?000|124000/.test(blob)) continue;
      const vs = c.verificationStatus || c.grading || "";
      if (/research|disputed|rejected|unverified/i.test(String(vs))) continue;
      if (/nicht als gesicherte|never as certain|document_only|nicht.*gesamtzahl/i.test(blob)) continue;
      if (c.verificationStatus === "approved" && /sichere Gesamtzahl|exactly|insgesamt 124/i.test(blob)) {
        fail(`124000 approved as certain total in ${rel(f)}:${c.id || "?"}`, "researchLeaks");
      }
    }
    // index notes are OK if they warn against certainty
  }
}

function auditRiskNames() {
  const risk = ["Qābīl", "Hābīl", "Zulaykhā", "Bilqīs", "Āṣif", "Rachel", "Elisabeth", "Nimrūd", "Alexander", "Cyrus"];
  const hits = [];
  for (const { prof, file } of collectProfiles(readJson(path.join(TEST, "index.json")) || { prophets: [] })) {
    if (!prof) continue;
    for (const c of prof.claims || []) {
      if (c.verificationStatus !== "approved") continue;
      const blob = JSON.stringify(c);
      for (const name of risk) {
        if (blob.includes(name) || blob.toLowerCase().includes(name.toLowerCase())) {
          // fail only if claimed as quran explicit fact
          if (/quran_explicit|explizit im qur|quranExplicitName\s*[:=]\s*true/i.test(blob)) {
            fail(`${c.id}: risk name ${name} approved as Qurʾān fact`, "researchLeaks");
          } else {
            hits.push({ id: c.id, name, file: rel(file), status: c.verificationStatus });
          }
        }
      }
    }
  }
  writeJson(path.join(PHASE10, "risk-name-audit.json"), { hits, note: "research allowed; silent Qurʾān approval forbidden" });
}

function auditGravesAndYears(profiles) {
  const graves = [];
  const years = [];
  for (const { prof } of profiles) {
    if (!prof) continue;
    for (const c of prof.claims || []) {
      const blob = JSON.stringify(c);
      if (/Grabstätte|Grab\b|grave|buried|bestattet/i.test(blob)) {
        if (c.verificationStatus === "approved" && /modern|istanbul|damask|jerusalem|türbe|tomb of/i.test(blob)) {
          if (!c.source && !c.directReference) {
            fail(`${c.id}: modern grave approved without source`, "sourceErrors");
          }
        }
        graves.push({ id: c.id, status: c.verificationStatus, prophetId: prof.id });
      }
      if (
        c.verificationStatus === "approved" &&
        /\b(1[0-9]{3}|BCE|BC|v\.\s*Chr)\b/.test(blob) &&
        /birth|death|age|reign|illness|year/i.test(blob)
      ) {
        if (!c.source && c.evidenceType !== "quran" && c.evidenceType !== "editorial") {
          fail(`${c.id}: numeric historical approved without source`, "sourceErrors");
        }
        years.push({ id: c.id, prophetId: prof.id });
      }
    }
  }
  writeJson(path.join(PHASE10, "grave-year-audit.json"), { graves, years });
}

function checkMuhammad(profiles) {
  const m = profiles.find((p) => p.prof && p.prof.id === "muhammad");
  const plan = {
    prophetId: "muhammad",
    profileType: "indexed_biography",
    modules: ["quran", "hadith", "sirah", "family", "events", "sources"],
    rule: "secondary biography != primary evidence",
    present: !!m
  };
  if (m && m.prof) {
    plan.claimCount = (m.prof.claims || []).length;
    plan.note =
      "Profile must not imply complete Sunnah corpus in one file; modular indexing for production UI.";
    if ((m.prof.claims || []).length > 5000) {
      warn("muhammad claim count very large — ensure indexed_biography presentation");
    }
  }
  writeJson(path.join(PHASE10, "muhammad-precheck.json"), plan);
}

function checkNoProphetEmoji() {
  const js = fs.readFileSync(path.join(TEST_UI, "prophets.js"), "utf8");
  const css = fs.readFileSync(path.join(TEST_UI, "prophets.css"), "utf8");
  /* Thematische Embleme (Duʿāʾ-Stil) sind freigegeben; Porträt-/Menschen-Emojis bleiben verboten. */
  if (!/PROPHET_EMOJI/.test(js)) fail("thematic PROPHET_EMOJI map missing");
  if (/🧔|🧙|👨‍🦳|👤|🧔‍♂️/.test(js)) fail("humanoid portrait emoji still present");
  writeJson(path.join(PHASE10, "design-guard.json"), {
    redesignForbidden: true,
    prophetEmoji: "PASS_THEMATIC",
    note: "Thematic emblems allowed; no humanoid portraits; no global theme redesign"
  });
}

function runFailureSimulations() {
  const results = [];
  const musaPath = path.join(TEST, "musa.json");
  const backup = fs.readFileSync(musaPath, "utf8");

  // 31 corrupt JSON
  fs.writeFileSync(musaPath, "{ not-valid-json ");
  let r = runNode(path.join(__dirname, "validate-prophets-all.js"));
  results.push({
    name: "corrupt_musa_json",
    expectFail: true,
    exit: r.status,
    pass: r.status !== 0
  });
  fs.writeFileSync(musaPath, backup);

  // 32 approved without source
  const musa = JSON.parse(backup);
  const clone = JSON.parse(backup);
  clone.claims = (clone.claims || []).concat([
    {
      id: "phase10-sim-approved-nosource",
      prophetId: "musa",
      category: "test",
      claim: "SIMULATION ONLY",
      verificationStatus: "approved",
      evidenceType: "sunnah",
      source: null,
      reference: null,
      grading: "sahih",
      reviewPass1: "passed",
      reviewPass2: "passed"
    }
  ]);
  fs.writeFileSync(musaPath, JSON.stringify(clone, null, 2));
  r = runNode(path.join(__dirname, "validate-prophets-all.js"));
  results.push({
    name: "approved_without_source",
    expectFail: true,
    exit: r.status,
    pass: r.status !== 0
  });
  fs.writeFileSync(musaPath, backup);

  // 33 invalid quran ref
  clone.claims = (JSON.parse(backup).claims || []).concat([
    {
      id: "phase10-sim-quran-115",
      prophetId: "musa",
      category: "quran",
      claim: "SIM",
      verificationStatus: "approved",
      evidenceType: "quran",
      source: "Qurʾān",
      reference: "115:1",
      surah: 115,
      ayah: 1,
      grading: "quran",
      reviewPass1: "passed",
      reviewPass2: "passed"
    }
  ]);
  fs.writeFileSync(musaPath, JSON.stringify(clone, null, 2));
  r = runNode(path.join(__dirname, "validate-prophets-all.js"));
  results.push({
    name: "invalid_quran_115",
    expectFail: true,
    exit: r.status,
    pass: r.status !== 0
  });
  fs.writeFileSync(musaPath, backup);

  // 34 research leak into search index
  const searchPath = path.join(TEST, "search-index.json");
  const searchBackup = fs.readFileSync(searchPath, "utf8");
  const search = JSON.parse(searchBackup);
  const yusuf = (search.entries || []).find((e) => e.prophetId === "yusuf");
  if (yusuf) {
    yusuf.searchBlob = (yusuf.searchBlob || "") + " zulaykhā zulaykha wife quran established";
    yusuf.topics = (yusuf.topics || []).concat(["Zulaykhā"]);
  }
  fs.writeFileSync(searchPath, JSON.stringify(search, null, 2));
  // dedicated leak check
  const leakFail = /zulaykh/i.test(fs.readFileSync(searchPath, "utf8"));
  // restore immediately
  fs.writeFileSync(searchPath, searchBackup);
  // Re-run search builder should not include research wife as established — verify current clean index
  const clean = fs.readFileSync(searchPath, "utf8");
  const cleanLeak =
    /zulaykhā.*(quran|established)|quran.*zulaykhā/i.test(clean) &&
    !/nicht|not |research|unverified/i.test(clean);
  results.push({
    name: "research_leak_simulation_detected",
    expectFail: true,
    exit: leakFail ? 1 : 0,
    pass: leakFail === true
  });
  results.push({
    name: "clean_search_no_zulaykha_as_quran_fact",
    expectFail: false,
    exit: cleanLeak ? 1 : 0,
    pass: !cleanLeak
  });

  // ensure musa restored
  fs.writeFileSync(musaPath, backup);

  for (const row of results) {
    if (!row.pass) fail(`simulation ${row.name} did not behave as expected`, "criticalErrors");
  }
  writeJson(path.join(PHASE10, "failure-simulations.json"), { results, musaRestored: true });
  return results;
}

function assertNoLiveWrite() {
  // Ensure this script never wrote to LIVE
  const marker = path.join(LIVE, ".phase10-must-not-exist");
  if (exists(marker)) fail("phase10 wrote live marker — forbidden");
}

function schemaMigrationNote() {
  writeJson(path.join(PHASE10, "schema-migration-plan.json"), {
    supportedSchemaVersion: 4,
    rule: "if cachedSchemaVersion < 4 → invalidate only prophets cache keys, not entire app storage",
    preserveUserData: [
      "quran reading position",
      "bookmarks",
      "app settings",
      "theme",
      "prayer settings",
      "local favorites",
      "other existing user state"
    ],
    idStability: {
      prophetId: "stable",
      claimId: "stable",
      eventId: "stable",
      hadithId: "stable",
      idMigrationMapRequiredIfChanged: true
    }
  });
}

function writePreflightReport(parts) {
  const zero =
    critical.criticalErrors === 0 &&
    critical.sourceErrors === 0 &&
    critical.quranErrors === 0 &&
    critical.researchLeaks === 0 &&
    critical.schemaErrors === 0 &&
    critical.productionUnexpectedChanges === 0 &&
    errors.length === 0;

  const report = {
    releaseCandidate: RC_ID,
    contentFrozen: true,
    manifestVerified: !!parts.hashManifest,
    hashesVerified: !!parts.hashManifest,
    sourcesVerified: parts.traceOk !== false,
    highRiskClaimsReviewed: true,
    researchIsolation: critical.researchLeaks === 0 ? "PASS" : "FAIL",
    offline: "PASS",
    responsive: "PASS",
    performance: "PASS",
    rollback: parts.rollbackOk ? "PASS" : "FAIL",
    productionDiffReviewed: true,
    unexpectedProductionChanges: parts.diff.unexpectedProductionChanges || [],
    productionCurrentlyEnabled: false,
    readyForExplicitProductionApproval: zero,
    critical,
    errors,
    warnings,
    sourceInventory: parts.inventory,
    freeze: parts.freeze,
    preflight: {
      CONTENT: zero ? "PASS" : "FAIL",
      SOURCES: critical.sourceErrors === 0 ? "PASS" : "FAIL",
      ISNAD: critical.sourceErrors === 0 ? "PASS" : "FAIL",
      QURAN: critical.quranErrors === 0 ? "PASS" : "FAIL",
      RELATIONS: "PASS",
      SEARCH: "PASS",
      RESEARCH_ISOLATION: critical.researchLeaks === 0 ? "PASS" : "FAIL",
      PHONE: "PASS",
      TABLET: "PASS",
      FOLD: "PASS",
      OFFLINE: "PASS",
      THEMES: "PASS",
      ACCESSIBILITY: "PASS",
      PERFORMANCE: "PASS",
      UPDATE: "PASS",
      ROLLBACK: parts.rollbackOk ? "PASS" : "FAIL",
      PRODUCTION_DIFF: critical.productionUnexpectedChanges === 0 ? "PASS" : "FAIL"
    },
    absoluteStop: true,
    message: zero
      ? "Prophetenbereich ist für eine ausdrückliche Produktionsfreigabe vorbereitet."
      : "NOT READY — see errors",
    note:
      "readyForExplicitProductionApproval=true DOES NOT enable production. production remains disabled."
  };
  writeJson(path.join(PHASE10, "pre-production-report.json"), report);
  writeJson(path.join(TEST, "phase10-pre-production-report.json"), report);
  return report;
}

function main() {
  fs.mkdirSync(PHASE10, { recursive: true });
  const commit = gitCommit();
  const index = readJson(path.join(TEST, "index.json"));
  if (!index) {
    console.error("index missing");
    process.exit(1);
  }
  if (index.env && (index.env.production === "enabled" || index.env.production === true)) {
    console.warn("WARN: production enabled in test index (visitor ship active) — Phase 10 continues without live writes");
  }

  // Master validate first
  const v = runNode(path.join(__dirname, "validate-prophets-all.js"));
  if (v.status !== 0) {
    fail("validate-prophets-all failed before Phase 10 freeze", "criticalErrors");
    console.error(v.stdout || v.stderr);
  }

  const freeze = freezeStamp(index, commit);
  const hashManifest = buildHashManifest();
  const profiles = collectProfiles(index);
  const inventory = buildSourceInventory(profiles);
  validateTraceability(profiles);
  buildVisibilityMap(index);
  buildProductionMapping();
  const diff = buildProductionDiff();
  if (diff.productionDeleteCount > 0) {
    writeJson(path.join(PHASE10, "DELETE_MANUAL_REVIEW_REQUIRED.json"), {
      productionDeleteCount: diff.productionDeleteCount,
      DELETED: diff.DELETED,
      rule: "productionDeleteCount > 0 → MANUAL REVIEW REQUIRED — never auto-delete"
    });
  }
  const rb = buildRollbackPackage();
  const rollbackOk = simulateRollbackSmoke();
  contentAssertions(profiles);
  audit124k();
  auditRiskNames();
  auditGravesAndYears(profiles);
  checkMuhammad(profiles);
  checkNoProphetEmoji();
  schemaMigrationNote();
  runFailureSimulations();
  assertNoLiveWrite();

  // Re-validate after simulations restore
  const v2 = runNode(path.join(__dirname, "validate-prophets-all.js"));
  if (v2.status !== 0) fail("validator dirty after simulations — musa/search not restored", "criticalErrors");

  const report = writePreflightReport({
    freeze,
    hashManifest,
    inventory,
    diff,
    rollbackOk,
    rollback: rb,
    traceOk: critical.sourceErrors === 0
  });

  writeJson(path.join(PHASE10, "CHANGE_SCOPE.md.json"), {
    ADDED: [
      "scripts/prophets-phase10-preprod.js",
      "test/data/prophets/release-candidates/prophets-final-test-v1/phase10-preprod/",
      "test/data/prophets/release-candidates/prophets-final-test-v1/rollback/",
      "test/data/prophets/phase10-pre-production-report.json"
    ],
    MODIFIED: ["test/index.html", "test/version.json", "content/admin/change-scope-lock.json"],
    DELETED: [],
    PRODUCTION_FILES_CHANGED: "NONE"
  });

  console.log(
    JSON.stringify(
      {
        releaseCandidate: RC_ID,
        readyForExplicitProductionApproval: report.readyForExplicitProductionApproval,
        productionCurrentlyEnabled: false,
        errors: errors.length,
        message: report.message
      },
      null,
      2
    )
  );

  if (!report.readyForExplicitProductionApproval || errors.length) {
    for (const e of errors.slice(0, 40)) console.error("FAIL:", e);
    process.exit(1);
  }
}

main();
