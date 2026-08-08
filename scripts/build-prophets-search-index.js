#!/usr/bin/env node
/**
 * Build prophets search-index.json from validated TEST data only.
 * DO NOT manually maintain search-index.json.
 * Does not write to /data/prophets.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const TEST = path.join(ROOT, "test/data/prophets");

// Reuse Phase 08 python builder logic by invoking it, then ensuring output stays test-only.
// If python builder also mirrors to LIVE, strip that by restoring LIVE untouched via refusing live writes.

function main() {
  const py = path.join(ROOT, "scripts/prophets_phase08_search_index.py");
  // Patch: run inline JS builder to avoid live mirror
  const idx = JSON.parse(fs.readFileSync(path.join(TEST, "index.json"), "utf8"));
  const ARAB = new Set(["hud", "salih", "shuayb", "muhammad", "ismail"]);
  const FURTHER = new Set(["dhul-kifl", "al-khidr", "luqman", "dhul-qarnayn", "uzayr", "yusha-ibn-nun"]);

  function loadProf(meta) {
    const rel = meta.profileFile || `${meta.id}.json`;
    return JSON.parse(fs.readFileSync(path.join(TEST, rel), "utf8"));
  }

  function isBanu(people) {
    const s = String(people || "").toLowerCase();
    return s.includes("isrā") || s.includes("isra") || s.includes("banū isr") || s.includes("banu isr");
  }

  const entries = [];
  const allMeta = [].concat(idx.prophets || [], idx.disputed || []);
  for (const meta of allMeta) {
    const file = path.join(TEST, meta.profileFile || `${meta.id}.json`);
    if (!fs.existsSync(file)) continue;
    const prof = JSON.parse(fs.readFileSync(file, "utf8"));
    const approved = (prof.claims || []).filter((c) => c.verificationStatus === "approved");
    const names = [];
    for (const n of [prof.name, prof.nameAr, meta.name, meta.nameAr, meta.id, ...(prof.nameVariants || []), ...(meta.searchTerms || []), ...(prof.searchTerms || [])]) {
      if (n && !names.includes(n)) names.push(n);
    }
    const topics = [];
    const events = [];
    const family = [];
    const qrefs = [];
    const hadithMeta = [];
    if (prof.profileStatus === "approved") {
      for (const c of approved) {
        if (c.category && !topics.includes(c.category)) topics.push(c.category);
        if (c.evidenceType === "quran" && c.number) qrefs.push(String(c.number));
        if (c.evidenceType === "sunnah") {
          hadithMeta.push([c.source, c.number, c.hadithId, c.rawi || c.sahabiRawi].filter(Boolean).join(" "));
        }
        if (c.category === "family") family.push(c.claim || c.id);
      }
      for (const st of prof.timeline || []) {
        const ok = (st.claimIds || []).every((id) => approved.some((c) => c.id === id));
        if (ok && st.title) events.push(st.title);
      }
      for (const f of prof.family || []) {
        const ok = (f.claimIds || []).every((id) => approved.some((c) => c.id === id));
        if (ok) family.push(`${f.label || ""} ${f.name || ""}`.trim());
      }
    }
    const sunnahN = approved.filter((c) => c.evidenceType === "sunnah").length;
    const aboutN = (prof.prophetAbout || []).filter((a) => a.verificationStatus === "approved").length;
    const people = meta.people || prof.people || "";
    const classifications = {
      uluAlAzm: !!(meta.uluAlAzm || prof.uluAlAzm),
      quranExplicit: meta.prophetStatus === "quran_explicit",
      hasSunnah: sunnahN + aboutN > 0 && prof.profileStatus === "approved",
      banuIsrail: isBanu(people),
      arabicMessenger: ARAB.has(meta.id) && (meta.roles || prof.roles || []).includes("rasūl"),
      furtherPerson: FURTHER.has(meta.id) || /disputed|scholarly_/.test(String(meta.prophetStatus || ""))
    };
    const nameOnly = prof.profileStatus !== "approved";
    const searchBlob = (
      nameOnly
        ? names.join(" ")
        : [names, topics, events, family, qrefs, hadithMeta, people, meta.id].flat().join(" ")
    ).toLowerCase();
    entries.push({
      prophetId: meta.id,
      names,
      aliases: names.filter((n) => n !== prof.name),
      approvedTopics: topics.slice(0, 40),
      approvedEvents: events.slice(0, 40),
      approvedFamilyRelations: family.slice(0, 40),
      approvedQuranRefs: [...new Set(qrefs)].slice(0, 80),
      approvedHadithMetadata: hadithMeta.slice(0, 40),
      people,
      roles: meta.roles || prof.roles || [],
      classifications,
      profileFile: meta.profileFile || `${meta.id}.json`,
      prophetStatus: meta.prophetStatus || prof.prophetStatus,
      honorific: meta.honorific || prof.honorific || "",
      name: meta.name || prof.name,
      nameAr: meta.nameAr || prof.nameAr,
      searchBlob,
      nameOnlySearch: nameOnly
    });
    meta.classifications = classifications;
    meta.hasSunnah = classifications.hasSunnah;
    meta.banuIsrail = classifications.banuIsrail;
    meta.arabicMessenger = classifications.arabicMessenger;
    meta.furtherPerson = classifications.furtherPerson;
  }

  idx.furtherPersons = ["dhul-kifl", "al-khidr", "luqman", "dhul-qarnayn", "uzayr", "yusha-ibn-nun"]
    .map((id) => allMeta.find((m) => m.id === id))
    .filter(Boolean);
  idx.availableFilters = {
    all: true,
    quran: true,
    sunnah: entries.some((e) => e.classifications.hasSunnah),
    ulu: entries.some((e) => e.classifications.uluAlAzm),
    banuIsrail: entries.some((e) => e.classifications.banuIsrail),
    arabicMessenger: entries.some((e) => e.classifications.arabicMessenger),
    further: true
  };
  idx.contentVersion = idx.contentVersion || "prophets-test-rc-01";
  idx.env = { test: "enabled", production: "disabled" };
  fs.writeFileSync(path.join(TEST, "index.json"), JSON.stringify(idx, null, 2) + "\n");
  const search = {
    schemaVersion: 4,
    contentVersion: idx.contentVersion,
    updatedAt: new Date().toISOString(),
    entries,
    note: "Generated by build-prophets-search-index.js — approved-only claim fields; do not edit manually."
  };
  fs.writeFileSync(path.join(TEST, "search-index.json"), JSON.stringify(search, null, 2) + "\n");
  console.log(JSON.stringify({ entries: entries.length, contentVersion: search.contentVersion, liveWrite: false }, null, 2));
}

main();
