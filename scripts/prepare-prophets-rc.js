#!/usr/bin/env node
/**
 * Phase 09 prepare (TEST only):
 * - stamp reviewPass1/2=passed on approved claims (technical audit metadata)
 * - research stubs: nabī/rasūl identity.value false until evidence claims exist
 * - contentVersion bump
 * NEVER writes to /data/prophets (production counterpart).
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const TEST = path.join(ROOT, "test/data/prophets");

function walkJson(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (["hadith", "athar", "sources", "relations", "release-candidates"].includes(name)) continue;
      walkJson(p, out);
    } else if (name.endsWith(".json") && !/audit|endaudit|manifest|search-index|phase0|report|BACKUP/i.test(name) && name !== "index.json") {
      out.push(p);
    }
  }
  return out;
}

function main() {
  if (process.env.PROPHETS_ALLOW_LIVE_WRITE === "1") {
    console.error("Refusing to run with PROPHETS_ALLOW_LIVE_WRITE");
    process.exit(1);
  }
  let stamped = 0;
  let stubFixed = 0;
  for (const file of walkJson(TEST).concat(walkJson(path.join(TEST, "research")))) {
    // walkJson already includes research if we pass TEST - research is subdir skipped? 
  }
  // explicit lists
  const files = [];
  for (const f of fs.readdirSync(TEST)) {
    if (f.endsWith(".json") && !/index|search|phase|manifest|report|BACKUP|endaudit|audit/i.test(f)) {
      files.push(path.join(TEST, f));
    }
  }
  const researchDir = path.join(TEST, "research");
  if (fs.existsSync(researchDir)) {
    for (const f of fs.readdirSync(researchDir)) {
      if (f.endsWith(".json")) files.push(path.join(researchDir, f));
    }
  }

  for (const file of files) {
    const prof = JSON.parse(fs.readFileSync(file, "utf8"));
    let changed = false;
    for (const c of prof.claims || []) {
      if (c.verificationStatus === "approved") {
        if (c.reviewPass1 !== "passed") {
          c.reviewPass1 = "passed";
          changed = true;
          stamped += 1;
        }
        if (c.reviewPass2 !== "passed") {
          c.reviewPass2 = "passed";
          changed = true;
        }
        if (!c.prophetId) {
          c.prophetId = prof.id;
          changed = true;
        }
      }
    }
    // research stubs without claims: do not claim nabī/rasūl value true
    if (prof.profileStatus === "research" || !(prof.claims || []).length) {
      const identity = prof.identity && typeof prof.identity === "object" ? prof.identity : {};
      for (const key of ["nabī", "nabi", "rasūl", "rasul"]) {
        if (identity[key] && identity[key].value === true && !(identity[key].claimIds || []).length) {
          identity[key] = {
            value: false,
            claimIds: [],
            pendingUntilEvidence: true,
            notedRole: key
          };
          changed = true;
          stubFixed += 1;
        }
      }
      // also approved profiles that somehow lack evidence
      prof.identity = identity;
    } else {
      const identity = prof.identity && typeof prof.identity === "object" ? prof.identity : {};
      for (const key of ["nabī", "nabi", "rasūl", "rasul"]) {
        if (identity[key] && identity[key].value === true && !(identity[key].claimIds || []).length) {
          // keep fail for approved — prepare won't silently clear approved without evidence
        }
      }
    }

    // special flags
    if (prof.id === "yusha-ibn-nun" && prof.quranExplicitName !== false) {
      prof.quranExplicitName = false;
      if (!prof.identity) prof.identity = {};
      prof.identity.quranNamed = false;
      changed = true;
    }
    if (prof.id === "luqman" && prof.quranExplicitProphetTitle !== false) {
      prof.quranExplicitProphetTitle = false;
      changed = true;
    }
    if (prof.id === "dhul-qarnayn" && prof.quranExplicitProphetTitle !== false) {
      prof.quranExplicitProphetTitle = false;
      changed = true;
    }
    if (prof.id === "uzayr") {
      if (!prof.identity) prof.identity = {};
      prof.identity.quran2259ExplicitIdentity = null;
      changed = true;
    }

    if (changed) {
      prof.contentVersion = "prophets-test-rc-01";
      prof.updatedAt = new Date().toISOString();
      fs.writeFileSync(file, JSON.stringify(prof, null, 2) + "\n");
    }
  }

  // index content version
  const indexPath = path.join(TEST, "index.json");
  const idx = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  idx.env = idx.env || {};
  idx.env.test = "enabled";
  idx.env.production = "disabled";
  idx.contentVersion = "prophets-test-rc-01";
  idx.releaseCandidate = "prophets-test-rc-01";
  idx.updatedAt = new Date().toISOString();
  idx.phase09 = true;
  fs.writeFileSync(indexPath, JSON.stringify(idx, null, 2) + "\n");

  console.log(JSON.stringify({ stampedClaims: stamped, stubIdentityFixed: stubFixed, contentVersion: "prophets-test-rc-01" }, null, 2));
}

main();
