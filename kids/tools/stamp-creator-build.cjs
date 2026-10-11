#!/usr/bin/env node
"use strict";
// Stamps ONLY the KIDS staging static-asset bundle for transparent QA.
// Does not stage, commit, merge, push or deploy anything to production.
const fs=require("node:fs");
const path=require("node:path");
const cp=require("node:child_process");
const assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../..");
const git=args=>cp.execFileSync("git",args,{cwd:root,encoding:"utf8"}).trim();
const branch=git(["branch","--show-current"]);
assert.equal(branch,"kids-creator-staging","Never stamp a Creator build from production/main");
if(process.env.GITHUB_REF)assert.equal(process.env.GITHUB_REF,"refs/heads/kids-creator-staging");
const commit=git(["rev-parse","HEAD"]);
assert.match(commit,/^[a-f0-9]{40}$/);
const iso=new Date().toISOString();
const info={
 schemaVersion:1,
 environment:"KIDS-CREATOR-STAGING",
 appName:"KIDS TEST",
 gitBranch:branch,
 gitCommit:commit,
 buildCreatedAt:iso,
 target:"dar-al-tawhid-kids-creator.sero91ak.workers.dev",
 targetPath:"/kids/test-console/",
 hasVisitorRelease:false,
 isProduction:false,
 requiresExplicitUserRelease:"Push-Thread global",
 note:"Build metadata records this test Worker artifact only; it is not a visitor release."
};
const dest=path.join(root,"kids/test-console/build-meta-v1.json");
fs.writeFileSync(dest,JSON.stringify(info,null,2)+"\n","utf8");
console.log("KIDS TEST BUILD STAMP PASS: only isolated staging commit "+commit.slice(0,12)+" -> workers.dev");
