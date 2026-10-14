#!/usr/bin/env node
"use strict";
/*
 * DAR AL TAWḤĪD — adult daily post publication dry-run.
 * NO writes to GitHub, NO deploy and NO OneSignal API calls.
 * This is deliberately a preflight; it cannot authorize release by itself.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const cp = require("node:child_process");
const ROOT = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

function runValidator(request, shouldPass) {
  const file = "content/admin/chat-publish-requests/dar-daily-safe-qa-only.json";
  const full = path.join(ROOT, file);
  assert(!fs.existsSync(full), "Temporary test request already exists: refusal to overwrite");
  try {
    fs.writeFileSync(full, JSON.stringify(request, null, 2) + "\n");
    const result = cp.spawnSync(process.execPath, ["scripts/chat-admin-publish.js", "--check", file], {
      cwd: ROOT, encoding: "utf8", timeout: 30000,
      env: { ...process.env, ADMIN_PUBLISH_SECRET: "", GITHUB_ACTIONS: "false" }
    });
    assert.equal(result.error, undefined, "Validator process launch failed");
    if (shouldPass) assert.equal(result.status, 0, "Validator unexpectedly rejected safe test: " + result.stderr);
    else assert.notEqual(result.status, 0, "Validator accepted a forbidden request");
    return true;
  } finally {
    if (fs.existsSync(full)) fs.unlinkSync(full);
  }
}

function inspect() {
  const passed = [];
  const blockers = [];
  const note = (name, ok) => {
    assert(ok, name);
    passed.push(name);
  };
  const agents = read("AGENTS.md");
  note("Daily adult-only permission exists", agents.includes("Dauerfreigabe täglicher Erwachsenen-Beiträge"));
  note("Push lanes are protected by policy", agents.includes("Push-Spuren"));
  const lock = JSON.parse(read("content/admin/push-lanes-lock.json"));
  note("Push code lock remains enabled", lock.locked === true && lock.passwordRequired === true);
  const reg = JSON.parse(read("q/_registry/shortlinks.json"));
  note("Q registry has entries", Array.isArray(reg.links) && reg.links.length > 0);
  const ids = reg.links.map(x => Number(x.number));
  note("Q numbers unique", ids.length === new Set(ids).size);
  note("Q nextNumber correctly follows current maximum", reg.nextNumber > Math.max(...ids));
  const qNumber = Math.max(...ids);
  note("Last registered Q source card exists", fs.existsSync(path.join(ROOT, "q", String(qNumber), "index.html")));
  const qEntry = reg.links.find(x => Number(x.number) === qNumber);
  note("Last Q source card is active", qEntry && qEntry.status === "active");
  const index = JSON.parse(read("content/posts/posts-index.json"));
  note("Adult posts index exists", Array.isArray(index.files) && index.files.length > 0);
  const markdown = [
    "---",
    "id: \"dar-daily-offline-qa-never-publish\"",
    "title: \"📖 Nur technische Validierung\"",
    "category: \"QA\"",
    "source: \"Technischer Test – keine religiöse Quelle\"",
    "links:",
    "  - label: \"→ Quellenprüfung\"",
    "    url: \"/q/" + qNumber + "/\"",
    "---",
    "🖋️ Dies ist ausschließlich ein technischer Trockenlauf.",
    "Keine Veröffentlichung und kein Versand."
  ].join("\n");
  const fixture = {
    version: 1, audience: "adult-visitors", approved: true, command: "push live",
    mode: "single", push: false, filename: "dar-daily-offline-qa-never-publish.md", markdown
  };
  note("Approved NO-PUSH request passes offline validation", runValidator(fixture, true));
  note("Unapproved request is rejected", runValidator({ ...fixture, approved: false }, false));
  note("Unknown Q card is rejected", runValidator({ ...fixture, markdown: markdown.replace("/q/" + qNumber + "/", "/q/999999/") }, false));
  note("Wrong audience is rejected", runValidator({ ...fixture, audience: "kids-visitors" }, false));
  note("No fixture post committed to repository", !fs.existsSync(path.join(ROOT, "content/posts", fixture.filename)));
  const worker = read("cloudflare/post-push-admin.js");
  const github = read("scripts/send-post-push.js");
  const publishWorkflow = read(".github/workflows/chat-admin-publisher.yml");
  note("Existing publisher checks requests before calling Admin service", publishWorkflow.includes("node scripts/chat-admin-publish.js --check"));
  note("Existing publisher uses guarded main-only publishing", read("scripts/chat-admin-publish.js").includes('refs/heads/main'));

  if (worker.includes('included_segments: ["Subscribed Users"]'))
    blockers.push("Worker post sender can target broad 'Subscribed Users' before DAR_PUSH; protected push-lane change needed.");
  if (github.includes('included_segments: ["Subscribed Users"]'))
    blockers.push("GitHub post sender can target broad 'Subscribed Users' before DAR_PUSH; protected push-lane change needed.");
  if (github.includes("crypto.randomUUID()") && github.includes("async function sendWithFallbacks"))
    blockers.push("GitHub fallback sender uses fresh random OneSignal idempotency keys; repeated runs can duplicate notifications.");
  if (github.includes('EVENT_NAME === "workflow_dispatch"') && publishWorkflow.includes("push:"))
    blockers.push("Post push manual-dispatch testing must never be invoked for visitors; current sender has a broadcast test branch.");
  // The editorial drafts belong to a SEPARATE branch, never to main or a deploy.
  // Even if that branch exists, the offline checkout cannot authenticate today's
  // source-reviewed draft or verify its provenance.
  blockers.push("Today's source-reviewed draft on automation/dar-daily-editorial has not been verified by this checkout.");
  blockers.push("The offline gate cannot verify live OneSignal opt-in filters, Cloudflare deployment, published Q source or actual delivery.");
  const result = {
    mode: "offline-no-send",
    testsPassed: passed.length,
    passed,
    sources: {currentQMaximum: qNumber, nextReservedNumber: reg.nextNumber, adultIndexEntries: index.files.length},
    // Read-only CI can NEVER grant production release by itself.
    releaseAllowed: false,
    codePathReady: blockers.length === 0,
    blockers,
    siteDeploymentVerified: false,
    oneSignalDeliveryVerified: false
  };
  return result;
}

try {
  const result = inspect();
  console.log("DAR_DAILY_ADULT_PREFLIGHT " + JSON.stringify(result, null, 2));
  if (process.env.GITHUB_STEP_SUMMARY) {
    const summary = [
      "## DĀR AL TAWḤĪD – Adult daily publication preflight",
      "",
      "- Mode: **offline; no publication, no OneSignal**",
      "- Safe checks passed: **" + result.testsPassed + "**",
      "- Release allowed: **" + (result.releaseAllowed ? "yes, preflight only" : "NO – blocked") + "**",
      "",
      "### Blockers",
      ...(result.blockers.length ? result.blockers.map(x => "- " + x) : ["- No structural blockers observed. Content and live release checks still required."]),
      ""
    ].join("\n");
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  }
  if (process.argv.includes("--require-release-ready") && !result.releaseAllowed) process.exitCode = 2;
} catch (err) {
  console.error("DAR_DAILY_ADULT_PREFLIGHT ERROR " + (err && err.stack ? err.stack : String(err)));
  process.exitCode = 1;
}
