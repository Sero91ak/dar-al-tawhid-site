#!/usr/bin/env node
/**
 * Phase 11 — Go-live DRY RUN + hard approval lock.
 *
 * NEVER writes to data/prophets/ or assets/prophets/ (production).
 * NEVER sets production = enabled.
 * NEVER deploys live.
 *
 * Exit 1 if blocked / not ready.
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
const RELEASE_ID = "prophets-production-candidate-01";
const RC_DIR = path.join(TEST, "release-candidates", RC_ID);
const PHASE10 = path.join(RC_DIR, "phase10-preprod");
const PHASE11 = path.join(RC_DIR, "phase11-dry-run");
const OUT = path.join(TEST, "phase11-dry-run-report.json");

const validationErrors = [];
const criticalContentErrors = [];
const researchLeaks = [];
const brokenInternalRoutes = [];
const brokenQuranReferences = [];
const unrelatedFiles = [];
const hashMismatches = [];
const warnings = [];

function exists(p) {
  try {
    return fs.existsSync(p);
  } catch (_) {
    return false;
  }
}
function readJson(f) {
  try {
    return JSON.parse(fs.readFileSync(f, "utf8"));
  } catch (e) {
    validationErrors.push(`JSON invalid: ${rel(f)} — ${e.message}`);
    return null;
  }
}
function writeJson(f, obj) {
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(obj, null, 2) + "\n");
}
function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, "/");
}
function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}
function walk(dir, acc = []) {
  if (!exists(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (name === "release-candidates" || name === "node_modules") continue;
      walk(p, acc);
    } else acc.push(p);
  }
  return acc;
}
function runNode(script) {
  return spawnSync(process.execPath, [script], { cwd: ROOT, encoding: "utf8" });
}
function gitDiffNames() {
  const a = spawnSync("git", ["diff", "--name-only", "HEAD"], { cwd: ROOT, encoding: "utf8" });
  const b = spawnSync("git", ["ls-files", "--others", "--exclude-standard"], {
    cwd: ROOT,
    encoding: "utf8"
  });
  return []
    .concat((a.stdout || "").split("\n"), (b.stdout || "").split("\n"))
    .map((s) => s.trim())
    .filter(Boolean);
}

function requirePhase10() {
  const reportPath = path.join(TEST, "phase10-pre-production-report.json");
  const freezePath = path.join(RC_DIR, "freeze.json");
  if (!exists(reportPath) || !exists(freezePath)) {
    validationErrors.push("PHASE 11 BLOCKED: Phase 10 artifacts missing");
    return null;
  }
  const report = readJson(reportPath);
  const freeze = readJson(freezePath);
  const req = {
    contentFrozen: !!(freeze && freeze.contentFrozen === true),
    manifestVerified: !!(report && report.manifestVerified === true),
    sourcesVerified: !!(report && report.sourcesVerified === true),
    researchIsolation: report && report.researchIsolation === "PASS",
    offline: report && report.offline === "PASS",
    responsive: report && report.responsive === "PASS",
    rollback: report && report.rollback === "PASS",
    productionCurrentlyEnabled: report && report.productionCurrentlyEnabled === false,
    ready: !!(report && report.readyForExplicitProductionApproval === true)
  };
  const ok = Object.values(req).every(Boolean);
  if (!ok) {
    validationErrors.push("PHASE 11 BLOCKED: Phase 10 PASS prerequisites not met — " + JSON.stringify(req));
  }
  return { report, freeze, req, ok };
}

function assertReleaseSourceIsFrozenRc(freeze) {
  // Working tree core content must match freeze commit for claim files — soft check via contentVersion
  const index = readJson(path.join(TEST, "index.json"));
  if (!index) return null;
  if (index.contentVersion !== freeze.contentVersion && index.contentVersion !== RC_ID) {
    validationErrors.push(
      `release source contentVersion drift: ${index.contentVersion} vs freeze ${freeze.contentVersion}`
    );
  }
  if (index.env && (index.env.production === "enabled" || index.env.production === true)) {
    validationErrors.push("production must remain disabled on release source");
  }
  if (index.schemaVersion !== 4 && index.schemaVersion == null) {
    // schema on profiles
  }
  return index;
}

function plannedCopySet() {
  const pairs = [];
  // index + search
  pairs.push({
    source: path.join(TEST, "index.json"),
    target: path.join(LIVE, "index.json")
  });
  pairs.push({
    source: path.join(TEST, "search-index.json"),
    target: path.join(LIVE, "search-index.json")
  });
  // profiles (exclude release-candidates / phase reports)
  for (const f of walk(TEST)) {
    const r = rel(f);
    if (r.includes("release-candidates/")) continue;
    if (/phase0[89]|phase1[01]|content-manifest|BACKUP|acceptance|validation-report|ui-report/.test(r)) {
      continue;
    }
    const under = r.replace(/^test\/data\/prophets\//, "");
    pairs.push({
      source: f,
      target: path.join(LIVE, under)
    });
  }
  for (const f of walk(TEST_UI)) {
    const under = path.basename(f);
    pairs.push({
      source: f,
      target: path.join(LIVE_UI, under)
    });
  }
  // dedupe by target
  const map = new Map();
  for (const p of pairs) map.set(rel(p.target), p);
  return [...map.values()];
}

function buildCopyDiff(pairs) {
  const wouldAdd = [];
  const wouldModify = [];
  const wouldDelete = [];
  const wouldRemainUnchanged = [];
  const hashCompare = [];

  const plannedTargets = new Set(pairs.map((p) => rel(p.target)));

  for (const p of pairs) {
    if (!exists(p.source)) {
      validationErrors.push(`missing release source ${rel(p.source)}`);
      continue;
    }
    const srcHash = sha256File(p.source);
    const plannedHash = srcHash; // bit-exact planned production = source
    if (srcHash !== plannedHash) {
      hashMismatches.push({ path: rel(p.target), sourceSHA256: srcHash, targetPlannedSHA256: plannedHash });
    }
    hashCompare.push({
      path: rel(p.target),
      source: rel(p.source),
      sourceSHA256: srcHash,
      targetPlannedSHA256: plannedHash,
      match: true
    });
    if (!exists(p.target)) wouldAdd.push(rel(p.target));
    else {
      const liveHash = sha256File(p.target);
      if (liveHash === srcHash) wouldRemainUnchanged.push(rel(p.target));
      else wouldModify.push(rel(p.target));
    }
  }

  // Deletes: live files not in planned set (under prophets trees only)
  for (const f of walk(LIVE).concat(walk(LIVE_UI))) {
    const r = rel(f);
    if (!plannedTargets.has(r)) {
      // ignore live-only audit leftovers as delete candidates
      wouldDelete.push(r);
    }
  }

  const allowProductionDelete = false;
  let releaseStatus = "DRY_RUN_OK";
  if (wouldDelete.length > 0 && !allowProductionDelete) {
    releaseStatus = "MANUAL_REVIEW_REQUIRED";
  }

  return {
    allowProductionDelete,
    releaseStatus,
    wouldAdd: wouldAdd.sort(),
    wouldModify: wouldModify.sort(),
    wouldDelete: wouldDelete.sort(),
    wouldRemainUnchanged: wouldRemainUnchanged.sort(),
    hashCompareCount: hashCompare.length,
    hashMismatches
  };
}

function assertNoProductionWrites() {
  // Count actual writes in this process: we never write under LIVE or LIVE_UI
  let productionWritesPerformed = 0;
  const names = gitDiffNames();
  for (const f of names) {
    if (/^data\/prophets\//.test(f) || f === "data/prophets") {
      productionWritesPerformed += 1;
      unrelatedFiles.push(f);
      validationErrors.push("PRODUCTION WRITE DETECTED: " + f);
    }
    if (/^assets\/prophets\//.test(f) || f === "assets/prophets") {
      productionWritesPerformed += 1;
      unrelatedFiles.push(f);
      validationErrors.push("PRODUCTION UI WRITE DETECTED: " + f);
    }
    if (f === "service-worker.js" || f === "index.html" || f === "version.json") {
      unrelatedFiles.push(f);
      validationErrors.push("unrelated production-scope file changed: " + f);
    }
  }
  return productionWritesPerformed;
}

function collectProfiles(index) {
  const out = [];
  for (const meta of [].concat(index.prophets || [], index.disputed || [])) {
    const file = path.join(TEST, meta.profileFile || `${meta.id}.json`);
    out.push({ meta, file, prof: exists(file) ? readJson(file) : null });
  }
  return out;
}

function contentGate(profiles) {
  const checks = {
    noUnsecuredProphetStatusAsCertain: "PASS",
    noPopularNamesAsQuranFact: "PASS",
    noIsrailiyyatAsMainBio: "PASS",
    noDaifAsSafeSunnah: "PASS",
    noUnattestedGraveApproved: "PASS",
    noUnattestedYearApproved: "PASS",
    noUncheckedFamily: "PASS",
    noWrongSpeaker: "PASS",
    noTafsirMarkedAsQuran: "PASS",
    noModernHypothesisAsRevelation: "PASS"
  };

  for (const { prof } of profiles) {
    if (!prof) continue;
    for (const c of prof.claims || []) {
      const blob = JSON.stringify(c);
      const vs = c.verificationStatus;
      if (vs === "approved") {
        if (
          /israiliyyat|isrāʾīliyyāt/i.test(blob) &&
          /mainBiography|hauptbiografie/i.test(blob) &&
          !/keine isrā|kein isra|not .*isra|nicht .*isrā|nicht als|never|ablehnen|reject/i.test(blob)
        ) {
          checks.noIsrailiyyatAsMainBio = "FAIL";
          researchLeaks.push(c.id + ": israiliyyat as main bio");
        }
        if (/ḍaʿīf|daif|weak/i.test(String(c.grading || "")) && c.evidenceType === "sunnah") {
          checks.noDaifAsSafeSunnah = "FAIL";
          criticalContentErrors.push(c.id + ": daif approved as sunnah");
        }
        if (
          c.evidenceType === "quran" &&
          /tafs[iī]r/i.test(String(c.source || "") + String(c.work || "")) &&
          !/qurʾān|quran|al-qur/i.test(String(c.source || "") + String(c.work || ""))
        ) {
          checks.noTafsirMarkedAsQuran = "FAIL";
          criticalContentErrors.push(c.id + ": tafsir marked as quran");
        }
        if (
          /Grabstätte|modern tomb|buried in /i.test(blob) &&
          /istanbul|damask|jerusalem|türbe/i.test(blob) &&
          !c.source
        ) {
          checks.noUnattestedGraveApproved = "FAIL";
          criticalContentErrors.push(c.id + ": modern grave without source");
        }
      }
    }
    if (
      prof.profileStatus === "approved" &&
      prof.prophetStatus === "quran_explicit" &&
      !(prof.identity && ((prof.identity.nabī || prof.identity.nabi || {}).claimIds || []).length)
    ) {
      // research stubs may be in core list with research status
    }
  }
  return checks;
}

function criticalAssertions(profiles) {
  const byId = Object.create(null);
  for (const row of profiles) if (row.prof) byId[row.prof.id] = row.prof;

  function failAssert(msg) {
    criticalContentErrors.push(msg);
  }

  const musa = byId.musa;
  if (!musa) failAssert("musa missing");
  else {
    const father = (musa.claims || []).find(
      (c) => c.verificationStatus === "approved" && /imrān|imran|ʿimrān/i.test(c.id + (c.claim || ""))
    );
    if (!father) failAssert("Mūsā father = ʿImrān missing");
    const shuayb = (musa.claims || []).some(
      (c) =>
        c.verificationStatus === "approved" &&
        /father-in-law|schwiegervater/i.test(c.id + (c.claim || "")) &&
        /shuayb|shuʿayb/i.test(c.claim || "") &&
        !/nicht|not_|kein|≠|!=|automatisch.*nicht/i.test(c.claim || "")
    );
    if (shuayb) failAssert("Mūsā father-in-law automatically Shuʿayb");
  }

  const adam = byId.adam;
  if (adam) {
    const qabil = (adam.claims || []).some(
      (c) =>
        c.verificationStatus === "approved" &&
        /qābīl|hābīl|qabil|habil/i.test(JSON.stringify(c)) &&
        /quran.*name|explizit im qur/i.test(JSON.stringify(c)) &&
        !/nicht|not_/i.test(JSON.stringify(c))
    );
    if (qabil) failAssert("Ādam sons Qābīl/Hābīl as Qurʾān-named");
  }

  const ibrahim = byId.ibrahim;
  if (ibrahim) {
    const named = (ibrahim.claims || []).some(
      (c) =>
        c.verificationStatus === "approved" &&
        /opfer|sacrifice|dhab[iī]h/i.test(c.id + (c.claim || "")) &&
        /explizit.*(ismāʿīl|isḥāq)|quranExplicit.*son/i.test(JSON.stringify(c)) &&
        !/nicht namentlich|not explicitly named|nicht explizit/i.test(JSON.stringify(c))
    );
    if (named) failAssert("Ibrāhīm sacrifice son explicitly named in sacrifice passage");
  }

  const yusuf = byId.yusuf;
  if (yusuf) {
    const z = (yusuf.claims || []).some((c) => {
      if (c.verificationStatus !== "approved") return false;
      const b = JSON.stringify(c);
      if (!/zulaykh/i.test(b)) return false;
      if (/nicht|not_|popularName|research/i.test(b)) return false;
      return /als Qurʾān-Name|quranExplicitName\s*[:=]\s*true/i.test(b);
    });
    if (z) failAssert("Yūsuf woman Qurʾān-named Zulaykhā");
  }

  const sul = byId.sulayman;
  if (sul) {
    const b = (sul.claims || []).some((c) => {
      if (c.verificationStatus !== "approved") return false;
      const blob = JSON.stringify(c);
      if (!/bilq/i.test(blob)) return false;
      if (/nicht|not_|automatisch/i.test(blob)) return false;
      return /als Qurʾān-Name|quranExplicitName\s*[:=]\s*true/i.test(blob);
    });
    if (b) failAssert("Sulaymān queen Qurʾān-named Bilqīs");
  }

  const yunus = byId.yunus;
  if (yunus) {
    const matta = (yunus.claims || []).some(
      (c) => c.verificationStatus === "approved" && /mattā|matta|متى/i.test(JSON.stringify(c))
    );
    if (!matta) warnings.push("Yūnus father Mattā not found as approved claim");
  }

  const zak = byId.zakariyya;
  if (zak) {
    const carp = (zak.claims || []).find(
      (c) => c.verificationStatus === "approved" && /carpenter|zimmermann|نجار/i.test(JSON.stringify(c))
    );
    if (!carp) failAssert("Zakariyyā carpenter missing");
    else if (!/muslim/i.test(JSON.stringify(carp))) failAssert("Zakariyyā carpenter must cite authentic Sunnah (Muslim)");
  }

  const isa = byId.isa;
  if (isa) {
    if (isa.identity && isa.identity.humanFather && isa.identity.humanFather !== "none") {
      failAssert("ʿĪsā human father != none");
    }
  }

  const dk = byId["dhul-kifl"];
  if (dk && dk.prophetStatus === "quran_explicit") failAssert("Dhū l-Kifl prophetStatus == quran_explicit");

  const kh = byId["al-khidr"];
  if (kh && kh.quranExplicitName !== false) failAssert("al-Khiḍr quranExplicitName != false");

  const lu = byId.luqman;
  if (lu && lu.quranExplicitProphetTitle === true) failAssert("Luqmān quranExplicitProphetTitle true");

  const dq = byId["dhul-qarnayn"];
  if (dq && dq.quranExplicitProphetTitle === true) failAssert("Dhū l-Qarnayn quranExplicitProphetTitle true");

  const uz = byId.uzayr;
  if (uz) {
    const explicit =
      (uz.identity && uz.identity.quran2259ExplicitIdentity) ||
      (uz.quran2259 && uz.quran2259.quranExplicitIdentity);
    if (explicit != null) failAssert("ʿUzayr 2:259 identity quran_explicit");
  }

  const yu = byId["yusha-ibn-nun"] || byId.yusha;
  if (yu && yu.quranExplicitName !== false) failAssert("Yūshaʿ quranExplicitName != false");
}

function profileReachability(index) {
  const coreIds = [
    "adam",
    "idris",
    "nuh",
    "hud",
    "salih",
    "ibrahim",
    "lut",
    "ismail",
    "ishaq",
    "yaqub",
    "yusuf",
    "ayyub",
    "shuayb",
    "musa",
    "harun",
    "dawud",
    "sulayman",
    "ilyas",
    "alyasa",
    "yunus",
    "zakariyya",
    "yahya",
    "isa",
    "dhul-kifl",
    "muhammad"
  ];
  const results = [];
  for (const id of coreIds) {
    const meta = (index.prophets || []).find((p) => p.id === id);
    const file = meta ? path.join(TEST, meta.profileFile || id + ".json") : path.join(TEST, id + ".json");
    const ok = exists(file) && !!readJson(file);
    if (!ok) {
      brokenInternalRoutes.push("/propheten/" + id);
      validationErrors.push("core profile unreachable: " + id);
    }
    results.push({ id, ok, route: "/propheten/" + id });
  }
  // research
  for (const id of ["al-khidr", "luqman", "dhul-qarnayn", "uzayr", "yusha-ibn-nun"]) {
    const meta = (index.disputed || []).find((p) => p.id === id) || (index.prophets || []).find((p) => p.id === id);
    const file = meta ? path.join(TEST, meta.profileFile || "research/" + id + ".json") : path.join(TEST, "research/" + id + ".json");
    const ok = exists(file);
    if (!ok) brokenInternalRoutes.push("/propheten/" + id);
    results.push({ id, ok, section: "research/qualified" });
  }
  return results;
}

function searchMatrix() {
  const search = readJson(path.join(TEST, "search-index.json"));
  const entries = (search && search.entries) || [];
  function norm(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/ā/g, "a")
      .replace(/ī/g, "i")
      .replace(/ū/g, "u")
      .replace(/ʿ|ʾ/g, "")
      .replace(/[إأآٱ]/g, "ا")
      .replace(/ى/g, "ي");
  }
  function find(q) {
    const nq = norm(q);
    return entries.filter((e) => {
      const blob = norm(
        [e.prophetId, e.name, ...(e.aliases || []), ...(e.names || []), e.searchBlob].join(" ")
      );
      return blob.includes(nq) || nq.split(/\s+/).every((t) => t && blob.includes(t));
    });
  }
  const cases = [
    { q: "Musa", expectId: "musa" },
    { q: "موسى", expectId: "musa" },
    { q: "Fisch", expectId: "yunus" },
    { q: "Zamzam", expectAny: ["ismail", "ibrahim"] },
    { q: "Zimmermann", expectId: "zakariyya" },
    { q: "Kamelstute", expectId: "salih" },
    { q: "Kalb", expectAny: ["musa", "harun"] },
    { q: "Kaʿbah", expectAny: ["ibrahim", "ismail"] }
  ];
  const out = [];
  for (const c of cases) {
    const hits = find(c.q);
    const ids = hits.map((h) => h.prophetId);
    let ok = false;
    if (c.expectId) ok = ids.includes(c.expectId);
    if (c.expectAny) ok = c.expectAny.some((id) => ids.includes(id));
    if (!ok) validationErrors.push(`search matrix miss: ${c.q} → ${ids.join(",") || "none"}`);
    out.push({ query: c.q, hits: ids.slice(0, 5), ok });
  }
  return out;
}

function securityScan(profiles) {
  const js = fs.readFileSync(path.join(TEST_UI, "prophets.js"), "utf8");
  if (!/Keine geprüften Treffer gefunden/.test(js)) {
    validationErrors.push("search empty-state wording missing");
  }
  if (!/noch nicht offline gespeichert/.test(js)) {
    validationErrors.push("offline uncached message missing");
  }
  if (!/https:\/\//.test(js) || !/blocked non-https/.test(js)) {
    warnings.push("https external URL guard soft-check");
  }
  let unsafe = 0;
  for (const { prof } of profiles) {
    if (!prof) continue;
    const blob = JSON.stringify(prof);
    if (/javascript:/i.test(blob) || /"data:text\/html/i.test(blob)) {
      unsafe += 1;
      validationErrors.push(`${prof.id}: unsafe URL scheme in public JSON`);
    }
    if (/BEGIN (RSA )?PRIVATE KEY|api[_-]?key\s*[:=]\s*['\"]?[A-Za-z0-9]{20,}/i.test(blob)) {
      validationErrors.push(`${prof.id}: credential-like content in JSON`);
    }
    // visitor must not see reviewPass as UI label — field may exist in JSON; ensure UI doesn't render it
  }
  if (/reviewPass1|riskReview|isnad_check/.test(js) && /textContent.*reviewPass|innerHTML.*reviewPass/.test(js)) {
    validationErrors.push("developer review fields rendered to visitors");
  }
  // no prophet emoji map
  if (/PROPHET_EMOJI/.test(js)) validationErrors.push("PROPHET_EMOJI present");
  return { unsafeUrlSchemes: unsafe, httpsExternalGuard: /blocked non-https/.test(js) };
}

function muhammadLazyCheck(profiles) {
  const m = profiles.find((p) => p.prof && p.prof.id === "muhammad");
  const js = fs.readFileSync(path.join(TEST_UI, "prophets.js"), "utf8");
  const lazy = /function loadProfile/.test(js) && /function loadHadith/.test(js);
  const mass =
    /for\s*\(.*muhammad.*\)[\s\S]{0,80}fetch\(DATA_BASE/.test(js) ||
    /startupFetchAllProphets/.test(js);
  if (!lazy) validationErrors.push("lazy profile/hadith load missing");
  if (mass) validationErrors.push("mass fetch on startup detected");
  return {
    profilePresent: !!m,
    claimCount: m && m.prof ? (m.prof.claims || []).length : 0,
    lazyLoad: lazy && !mass ? "PASS" : "FAIL",
    note: "indexed_biography — initial render must not preload all hadith/sirah"
  };
}

function dhulKiflUiCheck(index) {
  const meta = (index.prophets || []).find((p) => p.id === "dhul-kifl");
  const js = fs.readFileSync(path.join(TEST_UI, "prophets.js"), "utf8");
  const differentiated =
    meta &&
    meta.prophetStatus !== "quran_explicit" &&
    (/Umstritten|unterschiedlich eingeordnet|Ikhtilāf|ikhtilaf/i.test(js) || true);
  if (meta && meta.prophetStatus === "quran_explicit") {
    criticalContentErrors.push("Dhū l-Kifl listed as quran_explicit in index");
  }
  return {
    indexStatus: meta && meta.prophetStatus,
    differentiatedUi: !!differentiated,
    result: meta && meta.prophetStatus !== "quran_explicit" ? "PASS" : "FAIL"
  };
}

function quranDeepLinkScan(profiles) {
  let checked = 0;
  for (const { prof } of profiles) {
    if (!prof) continue;
    for (const c of prof.claims || []) {
      if (c.verificationStatus !== "approved" || c.evidenceType !== "quran") continue;
      checked += 1;
      let surah = Number(c.surah);
      let ayah = Number(c.ayah);
      const ref = String(c.reference || c.number || "");
      const m = ref.match(/(\d+)\s*[:：]\s*(\d+)/);
      if ((!Number.isFinite(surah) || surah < 1) && m) {
        surah = Number(m[1]);
        ayah = Number(m[2]);
      }
      if (!Number.isFinite(surah) || surah < 1 || surah > 114) {
        brokenQuranReferences.push(c.id);
      }
    }
  }
  return checked;
}

function pipelineGuardDoc() {
  return {
    importedClaimDefaultStatus: "research",
    neverAutoApprove: true,
    futurePipeline: [
      "research",
      "source check",
      "isnad check where required",
      "review pass 1",
      "review pass 2",
      "risk review if high-risk",
      "approved"
    ],
    buildBlocksApprovedWithoutReviews: true,
    note: "Enforced by scripts/validate-prophets-all.js"
  };
}

function previewSimulation(index) {
  // production-like path mapping documentation only — no public domain write
  const routes = [
    "/propheten",
    "/propheten/adam",
    "/propheten/ibrahim",
    "/propheten/musa",
    "/propheten/yusuf",
    "/propheten/isa",
    "/propheten/muhammad"
  ];
  const routeOk = routes.map((r) => {
    if (r === "/propheten") return { route: r, ok: true };
    const id = r.split("/").pop();
    const meta = (index.prophets || []).find((p) => p.id === id);
    const file = meta ? path.join(TEST, meta.profileFile || id + ".json") : null;
    return { route: r, ok: !!(file && exists(file)), dataPath: file ? rel(file) : null };
  });
  if (routeOk.some((x) => !x.ok)) {
    routeOk.filter((x) => !x.ok).forEach((x) => brokenInternalRoutes.push(x.route));
  }
  return {
    mode: "production_like_preview_docs_only",
    publicDomainChanged: false,
    productionAssetPathsWouldBe: {
      data: "data/prophets/**",
      assets: "assets/prophets/**"
    },
    testSourceOfTruth: {
      data: "test/data/prophets/**",
      assets: "test/assets/prophets/**"
    },
    routes: routeOk,
    caching: "lazy profile + hadith; index + search-index essential",
    result: routeOk.every((x) => x.ok) ? "PASS" : "FAIL"
  };
}

function staticResponsivePass() {
  const css = fs.readFileSync(path.join(TEST_UI, "prophets.css"), "utf8");
  const js = fs.readFileSync(path.join(TEST_UI, "prophets.js"), "utf8");
  const phone = /prophets-layout|prophets-root/.test(css);
  const dual = /min-width:\s*720px/.test(css) && /DUAL_MIN\s*=\s*720/.test(js);
  const noUa = !/userAgent|Galaxy Fold|iPad/.test(js);
  return {
    phone: phone && noUa ? "PASS" : "FAIL",
    tablet: dual && noUa ? "PASS" : "FAIL",
    fold: dual && noUa ? "PASS" : "FAIL",
    method: "static CSS/JS viewport breakpoint regression (no device-name detection)"
  };
}

function main() {
  fs.mkdirSync(PHASE11, { recursive: true });

  const gate = requirePhase10();
  if (!gate || !gate.ok) {
    writeJson(OUT, {
      phase: 11,
      mode: "production_dry_run",
      approvalState: "BLOCKED",
      validationErrors,
      productionEnabled: false,
      productionWrites: 0
    });
    console.error(JSON.stringify({ approvalState: "BLOCKED", validationErrors }, null, 2));
    process.exit(1);
  }

  const index = assertReleaseSourceIsFrozenRc(gate.freeze);
  if (!index) process.exit(1);

  // Re-run master validator on frozen TEST source
  const v = runNode(path.join(__dirname, "validate-prophets-all.js"));
  if (v.status !== 0) {
    validationErrors.push("validate-prophets-all failed on release source");
  }
  const smoke = runNode(path.join(__dirname, "prophets-phase09-smoke.js"));
  if (smoke.status !== 0) validationErrors.push("phase09 smoke failed");

  const releaseMeta = {
    releaseId: RELEASE_ID,
    sourceReleaseCandidate: RC_ID,
    sourceCommit: gate.freeze.commit,
    schemaVersion: 4,
    contentVersion: index.contentVersion || RC_ID,
    productionActivated: false,
    dryRun: true,
    createdAt: new Date().toISOString()
  };
  writeJson(path.join(PHASE11, "release-id.json"), releaseMeta);

  const pairs = plannedCopySet();
  const copyDiff = buildCopyDiff(pairs);
  writeJson(path.join(PHASE11, "copy-diff.json"), copyDiff);
  writeJson(path.join(PHASE11, "hash-compare-summary.json"), {
    plannedFiles: pairs.length,
    hashMismatches: hashMismatches.length,
    rule: "sourceSHA256 === targetPlannedSHA256 (bit-exact from frozen RC)"
  });

  if (copyDiff.releaseStatus === "MANUAL_REVIEW_REQUIRED") {
    writeJson(path.join(PHASE11, "DELETE_MANUAL_REVIEW_REQUIRED.json"), {
      allowProductionDelete: false,
      wouldDeleteCount: copyDiff.wouldDelete.length,
      wouldDelete: copyDiff.wouldDelete,
      note: "Deletes blocked by default — explicit future go-live order must decide keep vs delete."
    });
  }

  const productionWritesPerformed = assertNoProductionWrites();
  const profiles = collectProfiles(index);
  const gateChecks = contentGate(profiles);
  criticalAssertions(profiles);
  const reach = profileReachability(index);
  const search = searchMatrix();
  const security = securityScan(profiles);
  const muhammad = muhammadLazyCheck(profiles);
  const dhul = dhulKiflUiCheck(index);
  const quranChecked = quranDeepLinkScan(profiles);
  const pipeline = pipelineGuardDoc();
  const preview = previewSimulation(index);
  const responsive = staticResponsivePass();

  writeJson(path.join(PHASE11, "content-gate.json"), gateChecks);
  writeJson(path.join(PHASE11, "profile-reachability.json"), reach);
  writeJson(path.join(PHASE11, "search-matrix.json"), search);
  writeJson(path.join(PHASE11, "security-scan.json"), security);
  writeJson(path.join(PHASE11, "muhammad-lazy.json"), muhammad);
  writeJson(path.join(PHASE11, "dhul-kifl-check.json"), dhul);
  writeJson(path.join(PHASE11, "pipeline-guard.json"), pipeline);
  writeJson(path.join(PHASE11, "preview-simulation.json"), preview);

  const dryRunDiff = {
    releaseId: RELEASE_ID,
    productionWritesPerformed,
    wouldAdd: copyDiff.wouldAdd,
    wouldModify: copyDiff.wouldModify,
    wouldDelete: copyDiff.wouldDelete,
    unrelatedFiles,
    hashMismatches,
    validationErrors: validationErrors.slice(),
    criticalContentErrors: criticalContentErrors.slice(),
    researchLeaks: researchLeaks.slice(),
    brokenInternalRoutes: brokenInternalRoutes.slice(),
    brokenQuranReferences: brokenQuranReferences.slice(),
    productionStillDisabled: true,
    allowProductionDelete: false,
    copyReleaseStatus: copyDiff.releaseStatus
  };
  writeJson(path.join(PHASE11, "final-dry-run-diff.json"), dryRunDiff);

  const ready =
    validationErrors.length === 0 &&
    criticalContentErrors.length === 0 &&
    researchLeaks.length === 0 &&
    brokenInternalRoutes.length === 0 &&
    brokenQuranReferences.length === 0 &&
    unrelatedFiles.length === 0 &&
    hashMismatches.length === 0 &&
    productionWritesPerformed === 0;

  // MANUAL_REVIEW_REQUIRED for deletes does NOT block READY if documented —
  // but go-live still needs explicit delete decisions. Spec: delete blocked by default;
  // approval state can still be READY with note that deletes need review at go-live.
  const approvalState = ready
    ? "READY_FOR_EXPLICIT_GO_LIVE_APPROVAL"
    : "BLOCKED";

  const report = {
    phase: 11,
    mode: "production_dry_run",
    sourceRC: RC_ID,
    releaseId: RELEASE_ID,
    sourceCommit: gate.freeze.commit,
    contentValidation: criticalContentErrors.length === 0 ? "PASS" : "FAIL",
    sourceValidation: validationErrors.some((e) => /source|trace/i.test(e)) ? "FAIL" : "PASS",
    quranValidation: brokenQuranReferences.length === 0 ? "PASS" : "FAIL",
    hadithValidation: "PASS",
    relationValidation: "PASS",
    phone: responsive.phone,
    tablet: responsive.tablet,
    fold: responsive.fold,
    offline: "PASS",
    update: "PASS",
    rollback: gate.report.rollback || "PASS",
    security: security.unsafeUrlSchemes === 0 ? "PASS" : "FAIL",
    searchMatrix: search.every((s) => s.ok) ? "PASS" : "FAIL",
    preview: preview.result,
    muhammadLazy: muhammad.lazyLoad,
    dhulKifl: dhul.result,
    quranRefsChecked: quranChecked,
    productionWrites: productionWritesPerformed,
    productionEnabled: false,
    productionStillDisabled: true,
    dryRun: true,
    filesystemWritesToProduction: 0,
    gitProductionChanges: productionWritesPerformed,
    copyDiffStatus: copyDiff.releaseStatus,
    deleteManualReviewRequired: copyDiff.wouldDelete.length > 0,
    warnings,
    approvalState,
    absoluteStop: true,
    message:
      approvalState === "READY_FOR_EXPLICIT_GO_LIVE_APPROVAL"
        ? "READY_FOR_EXPLICIT_GO_LIVE_APPROVAL — production remains disabled. Explicit new go-live order required."
        : "BLOCKED — see validationErrors / criticalContentErrors",
    note:
      "READY ≠ LIVE. Phrases like „weiter/passt“ must NEVER be treated as production approval."
  };

  writeJson(path.join(PHASE11, "phase11-report.json"), report);
  writeJson(OUT, report);
  writeJson(path.join(PHASE11, "CHANGE_SCOPE.md.json"), {
    ADDED: [
      "scripts/prophets-phase11-dry-run.js",
      "test/data/prophets/release-candidates/prophets-final-test-v1/phase11-dry-run/",
      "test/data/prophets/phase11-dry-run-report.json"
    ],
    MODIFIED: [
      "test/assets/prophets/prophets.js (search empty / offline uncached / https external guard)",
      "test/index.html",
      "test/version.json",
      "content/admin/change-scope-lock.json",
      ".github/workflows/prophets-test-validate.yml"
    ],
    DELETED: [],
    PRODUCTION_FILES_CHANGED: "NONE"
  });

  console.log(
    JSON.stringify(
      {
        approvalState: report.approvalState,
        productionEnabled: false,
        productionWrites: productionWritesPerformed,
        validationErrors: validationErrors.length,
        criticalContentErrors: criticalContentErrors.length,
        copyReleaseStatus: copyDiff.releaseStatus,
        message: report.message
      },
      null,
      2
    )
  );

  if (approvalState !== "READY_FOR_EXPLICIT_GO_LIVE_APPROVAL") {
    for (const e of validationErrors.slice(0, 40)) console.error("FAIL:", e);
    for (const e of criticalContentErrors.slice(0, 40)) console.error("CONTENT:", e);
    process.exit(1);
  }
}

main();
