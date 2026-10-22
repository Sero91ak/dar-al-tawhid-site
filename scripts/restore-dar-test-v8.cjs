#!/usr/bin/env node
"use strict";
/**
 * Restore the adult DAR TEST app as it was before the 2026-10-22 V8 experiment.
 * NEVER executes on its own and NEVER touches visitor, Kids, iOS or main via GitHub API.
 * The operator first receives the user's one-word "ZURÜCKSETZEN" instruction.
 *
 * Dry-run: node scripts/restore-dar-test-v8.cjs
 * Apply:   DAR_TEST_V8_ROLLBACK_APPROVED=YES node scripts/restore-dar-test-v8.cjs --apply
 * Review staged diff, run tests, commit and use the gated DAR TEST deployment.
 */
const assert=require("node:assert/strict");
const {execFileSync}=require("node:child_process");
const BASE="44076f298b9966999ed16d955409a08c408145a4";
const run=(args,options={})=>execFileSync("git",args,{encoding:"utf8",...options}).trim();
function existsAtBase(path){
 try{run(["cat-file","-e",BASE+":"+path]);return true}catch(_){return false}
}
function main(){
 const branch=run(["branch","--show-current"]);
 assert(branch && branch!=="main" && branch!=="master","Refuse direct main/master rollback");
 const status=run(["status","--porcelain"]);
 assert(!status,"Refuse rollback over uncommitted work; clean worktree required");
 run(["cat-file","-e",BASE+"^{commit}"]);
 const names=run(["diff","--name-only",BASE,"HEAD","--","test/"]).split("\n").filter(Boolean);
 const changed=names.filter(x=>x.startsWith("test/")&&!x.startsWith("test/kids/"));
 console.log("Adult DAR TEST V8 baseline:",BASE);
 console.log("Target branch:",branch);
 for(const path of changed)console.log((existsAtBase(path)?"RESTORE ":"REMOVE  ")+path);
 if(!process.argv.includes("--apply"))return;
 assert(process.env.DAR_TEST_V8_ROLLBACK_APPROVED==="YES",
   "Explicit user authorization is required");
 for(const path of changed){
  if(existsAtBase(path))run(["restore","--source="+BASE,"--staged","--worktree","--",path]);
  else run(["rm","-f","--",path]);
 }
 console.log("Adult DAR TEST rollback staged; review diff and run guards before commit/deploy.");
}
if(require.main===module)main();
module.exports={BASE};
