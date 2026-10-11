#!/usr/bin/env node
"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const {audit,EXPECTED}=require("./validate-completion-gates.cjs");
const fixture=()=>JSON.parse(fs.readFileSync(path.join(__dirname,"COMPLETION-GATES-V1.json"),"utf8"));
const sha="0123456789abcdef".repeat(4);
function evidenceFor(m){
 return m.evidenceTypes.map(type=>({type,ref:"evidence://pending-manual-review-"+type,verified:true,
  sha256:sha,humanApproved:true}));
}
test("Baseline has 12 ordered, individually blocked gates, and never authorizes release",()=>{
 const a=audit(fixture());assert.equal(a.pass,true,JSON.stringify(a.errors));
 assert.equal(a.total,12);assert.equal(a.completed,0);
 assert.equal(a.activeGate,EXPECTED[0]);assert.equal(a.eligibleForRelease,false);
});
test("No gate may be omitted or reordered",()=>{
 for(const edit of [d=>d.milestones.pop(),d=>d.milestones[3].id="wrong-id",
  d=>d.milestones[5].needs=[]]){
   const f=fixture();edit(f);assert.equal(audit(f).pass,false);
 }
});
test("Live, merge, auto replacement and profile misrouting remain forbidden",()=>{
 for(const edit of [d=>d.release.liveDeploy=true,d=>d.release.mergeMain=true,
  d=>d.release.productionReady=true,d=>d.release.automatedModelSubstitutionAllowed=true,
  d=>d.integration.sourceProfileOnly=false,d=>d.integration.newTabBeforeApproval=true,
  d=>d.integration.manualProfileSwitcherAllowedInTestOnly=false]){
  const d=fixture();edit(d);assert.equal(audit(d).pass,false);
 }
});
test("Cannot approve the original-source stage without actual V7.7 bytes",()=>{
 const f=fixture();f.milestones[0].approved=true;f.milestones[0].status="approved";
 f.milestones[0].evidence=evidenceFor(f.milestones[0]);f.activeGate=EXPECTED[1];
 const a=audit(f);assert.equal(a.pass,false);assert.match(a.errors.join(","),/V7.7 bytes/);
});
test("Cannot claim first milestone in progress then start model acceptance out of order",()=>{
 const d=fixture();d.milestones[1].status="in_progress";assert.equal(audit(d).pass,false);
});
test("Cannot skip initial milestone and claim complete boy model",()=>{
 const f=fixture();f.milestones[1].approved=true;f.milestones[1].status="approved";
 f.milestones[1].evidence=evidenceFor(f.milestones[1]);f.originals.boy.actual3dIdentityApproved=true;
 const a=audit(f);assert.equal(a.pass,false);
 assert.match(a.errors.join(","),/predecessor/);
});
test("Missing required rig or prayer evidence blocks approval",()=>{
 const f=fixture();f.milestones[4].approved=true;f.milestones[4].status="approved";
 f.milestones[4].evidence=evidenceFor(f.milestones[4]).slice(0,1);
 assert.equal(audit(f).pass,false);
});
test("Source SHA pin cannot silently change",()=>{
 const f=fixture();f.originals.boy.candidateGlbSha256=sha;assert.equal(audit(f).pass,false);
});
test("Unverified evidence cannot satisfy an approval",()=>{
 const f=fixture();f.milestones[0].approved=true;f.milestones[0].status="approved";
 f.milestones[0].evidence=evidenceFor(f.milestones[0]).map(e=>({...e,verified:false}));
 f.activeGate=EXPECTED[1];assert.equal(audit(f).pass,false);
});
test("Unsigned human originality review is not approval",()=>{
 const f=fixture();f.milestones[1].approved=true;f.milestones[1].status="approved";
 f.milestones[1].evidence=evidenceFor(f.milestones[1]).map(e=>({...e,humanApproved:false}));
 f.originals.boy.actual3dIdentityApproved=true;assert.equal(audit(f).pass,false);
});
test("Cannot claim actual original binary without measured SHA",()=>{
 const f=fixture();f.originals.boy.actualBinaryRead=true;delete f.originals.boy.verifiedGlbSha256;assert.equal(audit(f).pass,false);
});
test("Preview is never a release authorization",()=>{
 const f=fixture();f.previewIsNotReleaseEvidence=false;assert.equal(audit(f).pass,false);
});
test("Each step lists real review criteria and multiple evidence requirements",()=>{
 const f=fixture();assert.deepEqual(f.milestones.map(m=>m.id),EXPECTED);
 for(const m of f.milestones){assert.ok(m.criteria.length>=2);assert.ok(m.evidenceTypes.length>=2);}
});
