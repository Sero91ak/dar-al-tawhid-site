#!/usr/bin/env node
"use strict";
/* KIDS RELEASE LOCK: strict staging deployment invariants.
 * This guard cannot approve or publish to main. The visitor deploy workflow
 * on main must be separately hardened before it can claim global enforcement.
 */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const policy=read("kids/creator-test/GLOBAL-RELEASE-LOCK.md");
const worker=read("kids/creator-test/worker.js");
const wrangler=read("kids/creator-test/wrangler.toml");
const workflow=read(".github/workflows/deploy-test-app.yml");
const consoleHtml=read("kids/test-console/index.html");
const nativeShell=read("ios/DarAlTawhidKids/DarAlTawhidKids/KidsAppShell.swift");
const nativePanel=read("ios/DarAlTawhidKids/DarAlTawhidKids/KidsNativeIntro.swift");

assert.match(policy,/Push-Thread global/,"explicit user authorization must be documented");
assert.match(policy,/Keine.*Merge|Kein.*Merge/i,"staging must not be promoted by default");
assert.match(consoleHtml,/LIVE-PUSH GESPERRT/);
assert.match(consoleHtml,/Push-Thread global/);
assert.match(wrangler,/name\s*=\s*"dar-al-tawhid-kids-creator"/);
assert.match(wrangler,/workers_dev\s*=\s*true/);
assert.match(wrangler,/routes\s*=\s*\[\s*\]/);
assert.match(wrangler,/run_worker_first\s*=\s*true/);
assert.match(wrangler,/watch_paths\s*=\s*\["\.kids-creator-manual-only\/\*\*"\]/);
assert.doesNotMatch(wrangler,/dar-al-tawhid\.de\/kids/);
assert.match(worker,/!url\.pathname\.startsWith\("\/kids\/"\)/);
assert.match(worker,/\["GET", "HEAD"\]/);
assert.match(workflow,/github\.ref == 'refs\/heads\/kids-creator-staging'/);
assert.match(workflow,/inputs\.target == 'kids-creator'/);
assert.match(workflow,/npx wrangler deploy -c kids\/creator-test\/wrangler\.toml/);
assert.match(workflow,/github\.ref == 'refs\/heads\/main'/);
assert.doesNotMatch(workflow,/git\s+(?:merge|push|cherry-pick)\s+.*(?:main|origin\/main)/);
assert.match(nativeShell,/dar-al-tawhid-kids-creator\.sero91ak\.workers\.dev/);
assert.match(nativeShell,/https:\/\/dar-al-tawhid\.de\/kids\/start/);
assert.match(nativePanel,/#if KIDS_CREATOR_TEST/);
if(process.env.GITHUB_REF&&process.env.GITHUB_EVENT_NAME==="push"){
 assert.equal(process.env.GITHUB_REF,"refs/heads/kids-creator-staging","staging push must never invoke main deployment");
}
console.log("KIDS GLOBAL RELEASE LOCK PASS: staging-only, no release without exact owner command; main guard not modified.");
