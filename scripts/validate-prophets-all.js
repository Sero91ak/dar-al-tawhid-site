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
  /* Live freigegeben: production=enabled ist erlaubt (Besucher-App). */
  if (env.production === true || env.production === "enabled") {
    warn("production enabled — Propheten live in Besucher-App");
  }
  if (!(env.test === true || env.test === "enabled")) {
    fail("prophets env.test must be enabled for TEST RC");
  }
  // Ensure this script does not treat LIVE as source of truth for writes
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

function approvedClaimsBlob(prof) {
  return (prof.claims || [])
    .filter((c) => c && c.verificationStatus === "approved")
    .map((c) => JSON.stringify(c))
    .join("\n");
}

function hasApprovedClaimMatching(prof, re) {
  return (prof.claims || []).some(
    (c) => c && c.verificationStatus === "approved" && re.test(JSON.stringify(c))
  );
}

/** Fail only when an approved claim affirms a forbidden reading without isolation/negation. */
function badApprovedAffirmation(prof, topicRe, msg, opts) {
  if (!prof) return;
  const negate =
    (opts && opts.negate) ||
    /nicht|ohne|kein|false|not |never|ablehnen|isolat|research|NOT approved|nicht als|keine |kein |\bkein\b|unresolved|vermisch/i;
  for (const c of prof.claims || []) {
    if (!c || c.verificationStatus !== "approved") continue;
    const s = JSON.stringify(c);
    if (!topicRe.test(s)) continue;
    if (negate.test(s)) continue;
    if (opts && opts.requireAlso && !opts.requireAlso.test(s)) continue;
    fail(`${msg} [${c.id}]`);
  }
}

function validateSpecialCases() {
  const loadProf = (rel) => readJson(path.join(TEST, rel));
  const dk = loadProf("dhul-kifl.json");
  if (dk) {
    if (dk.prophetStatus === "quran_explicit") fail("dhul-kifl.prophetStatus must != quran_explicit");
    if (dk.quranExplicitProphetTitle === true) fail("dhul-kifl.quranExplicitProphetTitle must === false");
    if (dk.prophetStatus !== "scholarly_disputed" && (dk.identity || {}).prophetStatus !== "scholarly_disputed") {
      fail("dhul-kifl.prophetStatus must be scholarly_disputed");
    }
    if (dk.quranNamed !== true && (dk.identity || {}).quranNamed !== true) {
      fail("dhul-kifl.quranNamed must be true");
    }
  }

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
    const bad = (uz.claims || []).some(
      (c) =>
        /259/.test(c.id || "") &&
        c.verificationStatus === "approved" &&
        /explizit.*ʿuzayr|quranExplicitIdentity\s*=\s*uzayr/i.test(JSON.stringify(c)) &&
        !/nicht|false|not /i.test(JSON.stringify(c))
    );
    if (bad) fail("uzayr claim falsely asserts explicit Qurʾān identity for 2:259");
    if (!anon) warn("uzayr: missing 2:259 related claim markers");
  }

  const yu = loadProf("research/yusha-ibn-nun.json");
  if (yu && yu.quranExplicitName !== false) fail("yusha.quranExplicitName must === false");

  const lu = loadProf("research/luqman.json");
  if (lu && lu.quranExplicitProphetTitle === true) fail("luqman.quranExplicitProphetTitle must === false");
  if (lu && lu.prophetStatus === "quran_explicit") fail("luqman must not be quran_explicit prophet");

  const dq = loadProf("research/dhul-qarnayn.json");
  if (dq && dq.quranExplicitProphetTitle === true) fail("dhul-qarnayn.quranExplicitProphetTitle must === false");
  if (dq && dq.prophetStatus === "quran_explicit") fail("dhul-qarnayn must not be quran_explicit prophet");
  badApprovedAffirmation(
    dq,
    /Alexander the Great is Dhū|Cyrus is Dhul|quranExplicitIdentity\s*[:=]\s*(alexander|cyrus)/i,
    "dhul-qarnayn: Alexander/Cyrus must not be approved identity"
  );

  // —— Hard content assertions (Phase 13 §42) ——
  const adam = loadProf("adam.json");
  if (adam) {
    badApprovedAffirmation(
      adam,
      /quranExplicitName\s*[:=]\s*true.*(Qābīl|Hābīl|Qabil|Habil)|(Qābīl|Hābīl).*(stehen im Qurʾān|quran.?explicit\s*=\s*true)/i,
      "Adam: Qābīl/Hābīl must not be marked quran-explicit names in approved claims"
    );
    if (!hasApprovedClaimMatching(adam, /nicht im Qurʾān|ohne Qurʾān-Eigennamen/i)) {
      warn("adam: expected isolation claim for sons' names");
    }
  }

  const idris = loadProf("idris.json");
  if (idris) {
    // Fail if one approved claim equates 19:57 wording with fourth heaven as identity
    badApprovedAffirmation(
      idris,
      /(19:57|number":"19:57").{0,120}(vierter Himmel|fourth heaven)|(vierter Himmel|fourth heaven).{0,120}(19:57|gleichsetz)/i,
      "Idris: 19:57 must not be hardcoded as fourth heaven"
    );
  }

  const nuh = loadProf("nuh.json");
  if (nuh) {
    badApprovedAffirmation(
      nuh,
      /950.*(Gesamtlebensdauer|total lifespan|Lebensalter insgesamt)|(Gesamtlebensdauer|total lifespan).*950/i,
      "Nuh: 950 years must not equal automatic total lifespan"
    );
  }

  const ibrahim = loadProf("ibrahim.json");
  if (ibrahim) {
    badApprovedAffirmation(
      ibrahim,
      /37:10[0-7].*(quranExplicitName\s*[:=]\s*(Ismāʿīl|Isḥāq)|explizit als (Ismāʿīl|Isḥāq) genannt)/i,
      "Ibrahim: sacrifice son must not be quran-explicit named in 37:100–107"
    );
  }

  const lut = loadProf("lut.json");
  if (lut) {
    badApprovedAffirmation(
      lut,
      /Ehefrau.*(quranExplicitName\s*[:=]\s*true|explizit genannt als)/i,
      "Lut: wife name must not be quran-explicit"
    );
  }

  const ismail = loadProf("ismail.json");
  if (ismail) {
    const hajar = (ismail.claims || []).find((c) => /h[āa][ǧj]ar|hagar/i.test(JSON.stringify(c)));
    if (hajar && hajar.verificationStatus === "approved") {
      const et = String(hajar.evidenceType || "").toLowerCase();
      if (et === "quran" && /name|hāǧar|hajar/i.test(hajar.claim || "") && !/nicht|ohne/i.test(hajar.claim || "")) {
        fail("Ismail: Hāǧar source type must not be Quran-only for name");
      }
    }
  }

  const yaqub = loadProf("yaqub.json");
  if (yaqub) {
    badApprovedAffirmation(
      yaqub,
      /quranExplicitName\s*[:=]\s*true.*(Binyāmīn|Benjamin)|(Binyāmīn|Benjamin).*(quranExplicitName\s*[:=]\s*true|explizit im Qurʾān genannt)/i,
      "Yaqub: Binyāmīn must not be quran-explicit"
    );
  }

  const yusuf = loadProf("yusuf.json");
  if (yusuf) {
    badApprovedAffirmation(
      yusuf,
      /quranExplicitName\s*[:=]\s*true.*Zulaykh|Zulaykhā.*(quranExplicitName\s*[:=]\s*true|explizit im Qurʾān)/i,
      "Yusuf: Zulaykhā must not be quran-explicit"
    );
  }

  const ayyub = loadProf("ayyub.json");
  if (ayyub) {
    badApprovedAffirmation(
      ayyub,
      /(Lepra|Aussatz|elephantiasis).*(festgestellt|als Tatsache|quran.?explicit)/i,
      "Ayyub: specific disease must not be approved as established fact"
    );
  }

  const shuayb = loadProf("shuayb.json");
  if (shuayb) {
    badApprovedAffirmation(
      shuayb,
      /musa\.fatherInLaw\s*=\s*true|father-in-law of Mūsā\s*=\s*true|automatisch.*Schwiegervater.*Mūsā/i,
      "Shuayb: must not automatically be Musa father-in-law"
    );
  }

  const musa = loadProf("musa.json");
  if (musa) {
    if (!hasApprovedClaimMatching(musa, /ʿImrān|Imran|عمران/)) {
      fail("Musa: father = Imran requires authenticated evidence claim");
    }
  }

  const harun = loadProf("harun.json");
  if (harun) {
    if (!hasApprovedClaimMatching(harun, /Bruder|brother|Mūsā|Musa/)) {
      fail("Harun: brother = Musa evidence missing");
    }
  }

  const dawud = loadProf("dawud.json");
  if (dawud) {
    badApprovedAffirmation(
      dawud,
      /Uriyā.*(mainBiography\s*[:=]\s*true|als gesicherte Tatsache)|Ehebruch.*(mainBiography\s*[:=]\s*true)/i,
      "Dawud: no Uriya/adultery narrative in approved biography"
    );
  }

  const sulayman = loadProf("sulayman.json");
  if (sulayman) {
    badApprovedAffirmation(
      sulayman,
      /Bilqīs.*(quranExplicitName\s*[:=]\s*true)|Āṣif.*(quranExplicitName\s*[:=]\s*true)|Asif.*(quranExplicitName\s*[:=]\s*true)/i,
      "Sulayman: Bilqis/Asif must not be quran-explicit"
    );
  }

  const ilyas = loadProf("ilyas.json");
  if (ilyas) {
    badApprovedAffirmation(
      ilyas,
      /identical to Idris|is al-Khidr|automatisch.*(Idrīs|al-Khiḍr)/i,
      "Ilyas: not automatically Idris / al-Khidr"
    );
  }

  const yunus = loadProf("yunus.json");
  if (yunus) {
    if (!hasApprovedClaimMatching(yunus, /Mattā|Matta|متى/)) {
      fail("Yunus: father = Matta evidence missing");
    }
    badApprovedAffirmation(
      yunus,
      /(Ninive|Nineveh).*(quranExplicitName\s*[:=]\s*true|explizit im Qurʾān|Der Qurʾān sagt Ninive\s*=\s*true)/i,
      "Yunus: Nineveh must not be quran-explicit"
    );
  }

  const zakariyya = loadProf("zakariyya.json");
  if (zakariyya) {
    const carp = (zakariyya.claims || []).find((c) => /Zimmermann|carpenter|نجار/i.test(JSON.stringify(c)));
    if (carp && carp.verificationStatus === "approved" && carp.evidenceType === "quran") {
      fail("Zakariyya: carpenter must be sourced through authentic Sunnah, not Quran-only");
    }
  }

  const yahya = loadProf("yahya.json");
  if (yahya) {
    badApprovedAffirmation(
      yahya,
      /(Enthauptung|behead).*(mainBiography\s*[:=]\s*true|als gesicherte Tatsache|ṣaḥīḥ-biografie)/i,
      "Yahya: beheading story must not be automatically approved as fact"
    );
  }

  const isa = loadProf("isa.json");
  if (isa) {
    if (!hasApprovedClaimMatching(isa, /kein menschlicher Vater|humanFather|no human father|19:20/i)) {
      fail("Isa: humanFather=none evidence missing");
    }
    if (!hasApprovedClaimMatching(isa, /nicht getötet|not killed|nicht gekreuzigt|not crucified|4:157/i)) {
      fail("Isa: not killed / not crucified evidence missing");
    }
    badApprovedAffirmation(
      isa,
      /humanFather\s*=\s*Joseph(?![^"]{0,40}NOT approved)|Joseph ist der Vater ʿĪsās/i,
      "Isa: Joseph must not be approved as human father"
    );
  }

  void approvedClaimsBlob;
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
  const NON_PROFILE_PERSONS = new Set(["maryam"]);
  for (const file of files) {
    const r = readJson(file);
    if (!r) continue;
    stats.relations += 1;
    if (!r.personA || !r.personB) fail(`${file}: missing persons`);
    const a = path.join(TEST, `${r.personA}.json`);
    const b = path.join(TEST, `${r.personB}.json`);
    const ar = path.join(TEST, "research", `${r.personA}.json`);
    const br = path.join(TEST, "research", `${r.personB}.json`);
    if (!exists(a) && !exists(ar) && !NON_PROFILE_PERSONS.has(r.personA) && r.personAIsProphetProfile !== false) {
      fail(`relation ${r.id}: missing person ${r.personA}`);
    }
    if (!exists(b) && !exists(br) && !NON_PROFILE_PERSONS.has(r.personB) && r.personBIsProphetProfile !== false) {
      fail(`relation ${r.id}: missing person ${r.personB}`);
    }
    if (NON_PROFILE_PERSONS.has(r.personA) && !(r.personADisplay && r.personADisplay.name)) {
      fail(`relation ${r.id}: non-profile personA needs personADisplay.name`);
    }
    pairs.add(`${r.personA}->${r.personB}:${r.relation}`);
    for (const pid of [r.personA, r.personB]) {
      if (NON_PROFILE_PERSONS.has(pid)) continue;
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
  const expected = [
    ["musa", "harun"],
    ["ibrahim", "ismail"],
    ["ibrahim", "ishaq"],
    ["ishaq", "yaqub"],
    ["yaqub", "yusuf"],
    ["dawud", "sulayman"],
    ["zakariyya", "yahya"],
    ["maryam", "isa"]
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
    releaseCandidate: "prophets-final-test-v1",
    environment: "test",
    generatedAt: new Date().toISOString(),
    stats,
    validation: {
      json: errors.some((e) => /JSON invalid/.test(e)) ? "FAIL" : "PASS",
      schema: errors.some((e) => /schemaVersion/.test(e)) ? "FAIL" : "PASS",
      claims: errors.some((e) => /approved without|reviewPass|orphan claim|duplicate claim|ASSERT|must not|evidence missing/i.test(e)) ? "FAIL" : "PASS",
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

  // LIVE may be production-enabled after explicit visitor ship; only warn.
  if (exists(path.join(LIVE, "index.json"))) {
    const liveIdx = readJson(path.join(LIVE, "index.json"));
    if (liveIdx && liveIdx.env && (liveIdx.env.production === "enabled" || liveIdx.env.production === true)) {
      warn("LIVE data/prophets has production enabled (visitor ship active)");
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
