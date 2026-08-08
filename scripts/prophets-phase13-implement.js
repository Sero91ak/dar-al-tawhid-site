#!/usr/bin/env node
/**
 * Phase 13 — close remaining FINAL gaps in TEST only.
 * Never writes data/prophets/. Never enables production.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const TEST = path.join(ROOT, "test/data/prophets");
const CORE = [
  "adam", "idris", "nuh", "hud", "salih", "ibrahim", "lut", "ismail", "ishaq",
  "yaqub", "yusuf", "ayyub", "shuayb", "musa", "harun", "dawud", "sulayman",
  "ilyas", "alyasa", "yunus", "zakariyya", "yahya", "isa", "dhul-kifl", "muhammad"
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

function ensureSchemaArrays(prof) {
  const arrays = [
    "overview", "timeline", "quranRefs", "sunnah", "statements", "family",
    "events", "sources", "claims", "research"
  ];
  // Prefer existing overviewFields as overview if overview missing
  if (!Array.isArray(prof.overview) && Array.isArray(prof.overviewFields)) {
    prof.overview = prof.overviewFields;
  }
  for (const k of arrays) {
    if (!Array.isArray(prof[k])) prof[k] = [];
  }
  if (!prof.identity || typeof prof.identity !== "object") prof.identity = {};
  if (!prof.audit || typeof prof.audit !== "object") {
    prof.audit = prof.coverage ? { fromCoverage: true } : {};
  }
  if (prof.schemaVersion !== 4) prof.schemaVersion = 4;
}

function fillTimelineFromClaims(prof) {
  if (Array.isArray(prof.timeline) && prof.timeline.length) return false;
  const claims = (prof.claims || []).filter((c) => c && c.verificationStatus === "approved");
  const eventish = claims.filter((c) => {
    const cat = String(c.category || "").toLowerCase();
    return /event|timeline|mission|miracle|death|creation|prophethood|revelation|dua/.test(cat)
      && !/quran-index|qref/.test(String(c.id || ""));
  });
  if (!eventish.length) return false;
  prof.timeline = eventish.slice(0, 8).map((c, i) => ({
    id: "tl-" + c.id,
    title: String(c.claim || c.title || c.id).slice(0, 120),
    order: i + 1,
    claimIds: [c.id],
    verificationStatus: "approved"
  }));
  if (!Array.isArray(prof.events) || !prof.events.length) {
    prof.events = prof.timeline.map((t) => ({
      id: t.id.replace(/^tl-/, "ev-"),
      title: t.title,
      claimIds: t.claimIds.slice(),
      verificationStatus: "approved"
    }));
  }
  return true;
}

function buildSourcesIndex(prof) {
  if (Array.isArray(prof.sources) && prof.sources.length) return false;
  const out = [];
  const seen = new Set();
  for (const c of prof.claims || []) {
    if (!c || c.verificationStatus !== "approved") continue;
    const key = [c.evidenceType, c.source, c.reference || c.number, c.hadithId].filter(Boolean).join("|");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({
      evidenceType: c.evidenceType || "",
      source: c.source || "",
      reference: c.reference || c.number || "",
      hadithId: c.hadithId || "",
      claimIds: [c.id],
      grading: c.grading || "",
      verificationStatus: "approved"
    });
  }
  prof.sources = out;
  return true;
}

function buildSunnahRefs(prof) {
  if (Array.isArray(prof.sunnah) && prof.sunnah.length) return false;
  const out = [];
  for (const c of prof.claims || []) {
    if (!c || c.verificationStatus !== "approved") continue;
    if (c.evidenceType !== "sunnah" && !c.hadithId) continue;
    out.push({
      hadithId: c.hadithId || "",
      source: c.source || "",
      reference: c.reference || c.number || "",
      claimIds: [c.id],
      verificationStatus: "approved"
    });
  }
  // also prophetAbout entries
  for (const s of prof.prophetAbout || []) {
    if (!s || s.verificationStatus !== "approved") continue;
    out.push({
      hadithId: s.hadithId || "",
      source: s.source || "",
      reference: s.reference || s.number || "",
      claimIds: s.claimIds || [],
      verificationStatus: "approved"
    });
  }
  prof.sunnah = out;
  return true;
}

function ensureMaryamIsa() {
  const relPath = path.join(TEST, "relations", "maryam-isa.json");
  const rel = {
    id: "maryam-isa",
    personA: "maryam",
    personB: "isa",
    relation: "mother_son",
    personAIsProphetProfile: false,
    personADisplay: {
      name: "Maryam",
      nameAr: "مريم",
      honorific: "عليها السلام"
    },
    claimIds: ["isa-mother-maryam"],
    verificationStatus: "approved",
    schemaVersion: 1,
    notes: "Zentrale Relationsakte Mutter–Sohn. Maryam ist keine Prophetenprofil-ID; Qurʾān-explizit als Mutter ʿĪsās."
  };
  writeJson(relPath, rel);

  const isaPath = path.join(TEST, "isa.json");
  const isa = readJson(isaPath);
  const ids = Array.isArray(isa.relationIds) ? isa.relationIds.slice() : [];
  if (!ids.includes("maryam-isa")) ids.push("maryam-isa");
  isa.relationIds = ids;
  writeJson(isaPath, isa);
  return true;
}

function syncIndex() {
  const index = readJson(path.join(TEST, "index.json"));
  if (index.env) {
    index.env.test = "enabled";
    index.env.production = "disabled";
  }
  index.contentVersion = "prophets-final-test-v1";
  index.releaseCandidate = "prophets-final-test-v1";
  index.updatedAt = new Date().toISOString();
  index.phase13 = {
    implementedAt: new Date().toISOString(),
    note: "Phase 13 implementation pass — TEST only; production remains disabled"
  };
  // Ensure all core files exist as index entries
  const byId = new Map((index.prophets || []).map((p) => [p.id, p]));
  for (const id of CORE) {
    const file = path.join(TEST, id + ".json");
    if (!fs.existsSync(file)) throw new Error("missing core profile " + id);
    if (!byId.has(id)) throw new Error("index missing entry for " + id);
  }
  writeJson(path.join(TEST, "index.json"), index);
}

function main() {
  if (process.env.PROPHETS_ALLOW_LIVE_WRITE === "1") {
    console.error("Refuse: PROPHETS_ALLOW_LIVE_WRITE set");
    process.exit(1);
  }
  const liveIdx = path.join(ROOT, "data/prophets/index.json");
  if (fs.existsSync(liveIdx)) {
    const live = readJson(liveIdx);
    if (live.env && (live.env.production === "enabled" || live.env.production === true)) {
      console.error("STOP: production enabled in live data");
      process.exit(1);
    }
  }

  const stats = { schemaFixed: 0, timelinesFilled: 0, sourcesBuilt: 0, sunnahBuilt: 0 };

  for (const id of CORE) {
    const file = path.join(TEST, id + ".json");
    const prof = readJson(file);
    ensureSchemaArrays(prof);
    stats.schemaFixed += 1;
    if (fillTimelineFromClaims(prof)) stats.timelinesFilled += 1;
    if (buildSourcesIndex(prof)) stats.sourcesBuilt += 1;
    if (buildSunnahRefs(prof)) stats.sunnahBuilt += 1;
    prof.contentVersion = "prophets-final-test-v1";
    prof.updatedAt = new Date().toISOString();
    writeJson(file, prof);
  }

  // research profiles: schema only, no merge into main list
  const researchDir = path.join(TEST, "research");
  for (const name of fs.readdirSync(researchDir).filter((f) => f.endsWith(".json"))) {
    const file = path.join(researchDir, name);
    const prof = readJson(file);
    ensureSchemaArrays(prof);
    prof.contentVersion = "prophets-final-test-v1";
    writeJson(file, prof);
  }

  ensureMaryamIsa();
  syncIndex();

  console.log(JSON.stringify({ ok: true, stats, productionEnabled: false, environment: "test" }, null, 2));
}

main();
