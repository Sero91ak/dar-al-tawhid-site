#!/usr/bin/env node
/**
 * Generate prophets content manifest from TEST data (no hardcoded counts).
 */
"use strict";

const fs = require("fs");
const path = require("path");

const TEST = path.join(__dirname, "..", "test/data/prophets");

function main() {
  const idx = JSON.parse(fs.readFileSync(path.join(TEST, "index.json"), "utf8"));
  const core = [];
  const research = [];
  const claimCount = { approved: 0, research: 0, disputed: 0, rejected: 0 };
  const evidenceCount = { quran: 0, sahih: 0, hasan: 0, athar: 0 };
  const excluded = { daif: 0, veryWeak: 0, mawdu: 0, israiliyyat: 0, unverified: 0 };

  function ingest(meta) {
    const file = path.join(TEST, meta.profileFile || `${meta.id}.json`);
    if (!fs.existsSync(file)) return;
    const prof = JSON.parse(fs.readFileSync(file, "utf8"));
    const row = {
      id: prof.id,
      profileStatus: prof.profileStatus,
      prophetStatus: prof.prophetStatus,
      profileFile: meta.profileFile || `${prof.id}.json`,
      claimCount: (prof.claims || []).length
    };
    if (String(meta.profileFile || "").startsWith("research/") || meta.furtherPerson || /disputed|scholarly_/.test(String(prof.prophetStatus || ""))) {
      if (prof.id === "dhul-kifl" || String(meta.profileFile || "").startsWith("research/")) research.push(row);
      else if (prof.profileStatus === "research") research.push(row);
      else core.push(row);
    } else if (prof.profileStatus === "research") {
      research.push(row);
    } else {
      core.push(row);
    }
    for (const c of prof.claims || []) {
      const vs = c.verificationStatus;
      if (vs === "approved") claimCount.approved += 1;
      else if (vs === "research") claimCount.research += 1;
      else if (vs === "disputed") claimCount.disputed += 1;
      else if (vs === "rejected") claimCount.rejected += 1;
      if (vs === "approved") {
        if (c.evidenceType === "quran") evidenceCount.quran += 1;
        const g = String(c.grading || "").toLowerCase();
        if (c.evidenceType === "sunnah" && g.includes("sahih")) evidenceCount.sahih += 1;
        if (g.includes("hasan") || g.includes("ḥasan")) evidenceCount.hasan += 1;
        if (c.evidenceType === "athar") evidenceCount.athar += 1;
      }
    }
    for (const w of prof.weakReports || []) {
      const g = String(w.grading || "").toLowerCase();
      if (/daif|ḍaʿīf/.test(g)) excluded.daif += 1;
      if (/very_weak|sehr schwach/.test(g)) excluded.veryWeak += 1;
      if (/mawdu|mawḍū/.test(g)) excluded.mawdu += 1;
      if (/israiliyyat|isrā/.test(g)) excluded.israiliyyat += 1;
      if (/unverified/.test(g)) excluded.unverified += 1;
    }
  }

  for (const p of idx.prophets || []) ingest(p);
  for (const p of idx.disputed || []) ingest(p);

  // dedupe research/core by id preference research list for research files
  const coreIds = new Set(core.map((c) => c.id));
  const researchIds = new Set(research.map((r) => r.id));
  // rebuild cleanly
  const coreClean = (idx.prophets || [])
    .filter((p) => p.id !== "dhul-kifl")
    .map((p) => {
      const file = path.join(TEST, p.profileFile || `${p.id}.json`);
      const prof = JSON.parse(fs.readFileSync(file, "utf8"));
      return {
        id: p.id,
        profileStatus: prof.profileStatus,
        prophetStatus: prof.prophetStatus,
        profileFile: p.profileFile || `${p.id}.json`,
        claimCount: (prof.claims || []).length
      };
    });
  const researchClean = [];
  const dk = (idx.prophets || []).find((p) => p.id === "dhul-kifl");
  if (dk) {
    const prof = JSON.parse(fs.readFileSync(path.join(TEST, dk.profileFile || "dhul-kifl.json"), "utf8"));
    researchClean.push({
      id: "dhul-kifl",
      profileStatus: prof.profileStatus,
      prophetStatus: prof.prophetStatus,
      profileFile: dk.profileFile || "dhul-kifl.json",
      claimCount: (prof.claims || []).length
    });
  }
  for (const p of idx.disputed || []) {
    const prof = JSON.parse(fs.readFileSync(path.join(TEST, p.profileFile), "utf8"));
    researchClean.push({
      id: p.id,
      profileStatus: prof.profileStatus,
      prophetStatus: prof.prophetStatus,
      profileFile: p.profileFile,
      claimCount: (prof.claims || []).length
    });
  }

  // recount claims cleanly
  const claimCount2 = { approved: 0, research: 0, disputed: 0, rejected: 0 };
  const evidenceCount2 = { quran: 0, sahih: 0, hasan: 0, athar: 0 };
  const excluded2 = { daif: 0, veryWeak: 0, mawdu: 0, israiliyyat: 0, unverified: 0 };
  for (const row of coreClean.concat(researchClean)) {
    const prof = JSON.parse(fs.readFileSync(path.join(TEST, row.profileFile), "utf8"));
    for (const c of prof.claims || []) {
      if (c.verificationStatus === "approved") {
        claimCount2.approved += 1;
        if (c.evidenceType === "quran") evidenceCount2.quran += 1;
        const g = String(c.grading || "").toLowerCase();
        if (c.evidenceType === "sunnah" && g.includes("sahih")) evidenceCount2.sahih += 1;
        if (g.includes("hasan") || g.includes("ḥasan")) evidenceCount2.hasan += 1;
        if (c.evidenceType === "athar") evidenceCount2.athar += 1;
      } else if (c.verificationStatus === "research") claimCount2.research += 1;
      else if (c.verificationStatus === "disputed") claimCount2.disputed += 1;
      else if (c.verificationStatus === "rejected") claimCount2.rejected += 1;
    }
    for (const w of prof.weakReports || []) {
      const g = String(w.grading || "").toLowerCase();
      if (/daif|ḍaʿīf/.test(g)) excluded2.daif += 1;
      if (/very_weak|sehr schwach/.test(g)) excluded2.veryWeak += 1;
      if (/mawdu|mawḍū/.test(g)) excluded2.mawdu += 1;
      if (/israiliyyat|isrā/.test(g)) excluded2.israiliyyat += 1;
      if (/unverified/.test(g)) excluded2.unverified += 1;
    }
  }

  const hadithCount = fs.existsSync(path.join(TEST, "hadith"))
    ? fs.readdirSync(path.join(TEST, "hadith")).filter((f) => f.endsWith(".json")).length
    : 0;

  const manifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    environment: "test",
    productionEnabled: false,
    releaseCandidate: idx.releaseCandidate || "prophets-test-rc-01",
    contentVersion: idx.contentVersion || null,
    coreProfiles: coreClean,
    researchProfiles: researchClean,
    profileCount: coreClean.length + researchClean.length,
    claimCount: claimCount2,
    evidenceCount: evidenceCount2,
    excludedReports: excluded2,
    sourceCount: { canonicalHadith: hadithCount }
  };

  fs.writeFileSync(path.join(TEST, "content-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(
    JSON.stringify(
      {
        profileCount: manifest.profileCount,
        claimCount: manifest.claimCount,
        evidenceCount: manifest.evidenceCount,
        productionEnabled: false
      },
      null,
      2
    )
  );
}

main();
