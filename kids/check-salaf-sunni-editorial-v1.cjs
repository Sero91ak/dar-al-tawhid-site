#!/usr/bin/env node
"use strict";
/* Historical subject and editorial release gate.
 * This is a METADATA guard, not a scholarly proof of orthodoxy or isnad.
 * Human examination of the original reports remains mandatory. */
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "kids/data/salaf-library-v1.json"), "utf8"));
const approvedLegacy = new Set([
  "malik-mut-zur-wahrheit",
  "shafii-freundschaft-trotz-unterschied",
  "layth-das-grosse-honiggeschenk"
]);
const allowedCategories = new Set(["rahma","sidq","sabr","ilm","adab","family","hikma","shukr"]);
const seen = new Set();
let live = 0, pending = 0;
assert.ok(Array.isArray(data.items), "Salaf item list must be an array");
for (const item of data.items) {
  assert.match(item.id, /^[a-z0-9-]+$/, "Salaf item id must be safe");
  assert.ok(!seen.has(item.id), "Duplicate Salaf id: " + item.id);
  seen.add(item.id);
  assert.ok(allowedCategories.has(item.category), "Invalid category: " + item.id);
  assert.ok(item.person && item.title, "Person and title are mandatory: " + item.id);
  assert.ok(item.masterStoryText?.startsWith("As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh"),
    "Full master greeting missing: " + item.id);
  assert.ok(/As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh\.\s*$/.test(item.masterStoryText),
    "Full farewell missing: " + item.id);
  assert.ok(item.masterStoryText.includes("lieber Bruder") && item.masterStoryText.includes("liebe Schwester"),
    "Both children must be addressed: " + item.id);
  assert.ok(Array.isArray(item.sources) && item.sources.length > 0, "Missing source: " + item.id);
  assert.ok(item.sources.every(s => s.author && s.work && s.reference && s.url && s.assessment),
    "Source metadata incomplete: " + item.id);
  assert.ok(!item.texts && !item.scripts && !item.masterAudios, "No age-specific masters: " + item.id);
  const released = item.editorialRelease === true && item.verification === "approved";
  if (item.editorialRelease === true || item.verification === "approved") {
    assert.ok(released, "Incomplete approval pair: " + item.id);
    if (!approvedLegacy.has(item.id)) {
      const r = item.eligibilityReview || {};
      assert.equal(r.community, "ahl-as-sunnah-early-generations", "Sunni Salaf eligibility missing: " + item.id);
      assert.equal(r.historicalPersonReviewed, true, "Subject identity not examined: " + item.id);
      assert.equal(r.sourceTextLocated, true, "Original source not located: " + item.id);
      assert.equal(r.chainEvaluationComplete, true, "Isnad investigation not complete: " + item.id);
      /* An explicitly authorized autonomous publication is distinct from a human reading.
       Never record humanEditorialApproval:true unless an actual human has reviewed this story. */
      const humanApproved = r.humanEditorialApproval === true;
      const ownerAuthorizedAuditedRelease = r.ownerAuthorizedAutonomousEditorialPublication === true &&
        r.editorialSourceAuditComplete === true &&
        typeof r.sourceMethod === "string" && r.sourceMethod.length > 110 &&
        r.assessedAt &&
        r.reviewScope;
      assert.ok(humanApproved || ownerAuthorizedAuditedRelease,
        "No actual human review or user-authorized source-audited release: " + item.id);
      assert.ok(item.sources.every(s => s.assessment === "verified"), "Unverified source: " + item.id);
    }
    live++;
  } else {
    pending++;
    assert.equal(item.editorialRelease, false, "Unapproved item must be explicitly hidden: " + item.id);
    assert.equal(item.audioMaster, null, "Do not produce audio before approval: " + item.id);
    assert.notEqual(item.verification, "approved", "Pending item may not claim verified release: " + item.id);
  }
}
assert.ok(live >= approvedLegacy.size, "Approved legacy stories unexpectedly missing");
console.log("PASS Salaf early-Sunni editorial metadata gate: " + live + " approved, " + pending + " safely hidden");
