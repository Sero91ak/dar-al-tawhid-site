#!/usr/bin/env node
"use strict";
/* Synthetic non-release checks. Never claim a real 3D, image or prayer approval. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {audit,checkActualBinaryArguments,verifyLocalBinary,main}=require("./audit-project-completion.cjs");
const dir=__dirname;
const load=p=>JSON.parse(fs.readFileSync(path.join(dir,p),"utf8"));
const boy=load("original-boy-identity-lock-v1.json");
const girl=load("original-girl-identity-lock-v1.json");
const status=load("PROJECT-STATUS-RELEASE-GATES.json");
const story=JSON.parse(fs.readFileSync(path.join(dir,"../content/raf-qiyam-storyboard.json"),"utf8"));
const sources=JSON.parse(fs.readFileSync(path.join(dir,"../content/hanbali-review.json"),"utf8"));
const acceptance=load("rig-acceptance-v1.json");
const clone=x=>JSON.parse(JSON.stringify(x));
let passed=0;
function check(label,fn){fn();passed++;console.log("PASS "+label);}
function blocking(result,fragment){return result.blockingChecks.some(s=>s.includes(fragment));}
check("audit is a callable pure release status gate",()=>assert.equal(typeof audit,"function"));
check("actual project is NOT ready for children's prayer teaching",()=>{
 const r=audit(status,boy,girl,story,sources);
 assert.equal(r.ready,false);assert.ok(r.totalChecks>=20);assert.ok(r.passedChecks<r.totalChecks);
});
check("real 3/4 camera calibration and five IoUs are mandatory",()=>{
 const r=audit(status,boy,girl,story,sources);
 assert.equal(blocking(r,"calibrated 3/4"),true);
});
check("unchanged bone lengths on real boy and girl GLB are mandatory",()=>{
 const r=audit(status,boy,girl,story,sources);
 assert.ok(blocking(r,"boy exact GLB payload"));
 assert.ok(blocking(r,"girl exact GLB payload"));
});
check("separate pink girl clothing and hair/neck checks cannot be skipped",()=>{
 const r=audit(status,boy,girl,story,sources);
 assert.ok(blocking(r,"girl covered hair/neck"));
 assert.ok(blocking(r,"girls independent five-view clothing"));
});
check("unreviewed Ruku and Sujud prevent false completion",()=>{
 const r=audit(status,boy,girl,story,sources);
 assert.ok(blocking(r,"real frame-by-frame Sujud"));
 assert.ok(blocking(r,"complete teaching clip"));
});
check("changing productionReady to true creates a contradiction, never ready",()=>{
 const s=clone(status);s.productionReady=true;
 const r=audit(s,boy,girl,story,sources);
 assert.equal(r.ready,false);
 assert.ok(r.inconsistent.some(x=>x.includes("claims ready")));
});
check("fake boy status approval without digest remains inconsistent",()=>{
 const s=clone(status);s.boy.productionRigApproved=true;
 const r=audit(s,boy,girl,story,sources);
 assert.equal(r.ready,false);
 assert.ok(r.inconsistent.some(x=>x.includes("boy model")));
});
check("fake girl status approval without digest remains inconsistent",()=>{
 const s=clone(status);s.girl.productionRigApproved=true;
 const r=audit(s,boy,girl,story,sources);
 assert.equal(r.ready,false);
 assert.ok(r.inconsistent.some(x=>x.includes("girl model")));
});
check("declaring boy shape above 90 without five actual numeric IoUs fails",()=>{
 const s=clone(status);s.boy.fiveViewSilhouetteAbove90Percent=true;s.boy.requiredFiveViewOriginalityApproved=true;s.boy.threeQuarterCameraPhysicallyCalibrated=true;
 assert.ok(blocking(audit(s,boy,girl,story,sources),"boy silhouette five-view"));
});
check("one silhouette direction below 90 blocks boy even with nominal positive flags",()=>{
 const s=clone(status);s.boy.fiveViewSilhouetteAbove90Percent=true;s.boy.requiredFiveViewOriginalityApproved=true;s.boy.threeQuarterCameraPhysicallyCalibrated=true;
 s.boy.independentFiveViewSilhouetteIoU={front:.92,threeQuarter:.83,right:.94,back:.95,left:.92};
 assert.ok(blocking(audit(s,boy,girl,story,sources),"boy silhouette five-view"));
});
check("an uncalibrated 3/4 view does not pass even at 95% IoU",()=>{
 const s=clone(status);s.boy.fiveViewSilhouetteAbove90Percent=true;s.boy.requiredFiveViewOriginalityApproved=true;
 s.boy.independentFiveViewSilhouetteIoU={front:.95,threeQuarter:.95,right:.95,back:.95,left:.95};
 assert.ok(blocking(audit(s,boy,girl,story,sources),"boy silhouette five-view"));
});
check("missing boy and girl model paths always fail strict local binary gate",()=>{
 const r=checkActualBinaryArguments([],boy,girl,acceptance);assert.equal(r.pass,false);
 assert.equal(r.boy.pass,false);assert.equal(r.girl.pass,false);
});
check("PNG is never accepted in place of a real GLB",()=>{
 const r=verifyLocalBinary("/tmp/fake.png",boy,"boy",acceptance);
 assert.equal(r.pass,false);
});
check("duplicate release model arguments are rejected",()=>{
 const args=["--boy-glb=/tmp/a.glb","--boy-glb=/tmp/b.glb","--girl-glb=/tmp/c.glb"];
 const r=checkActualBinaryArguments(args,boy,girl,acceptance);
 assert.equal(r.pass,false);assert.equal(r.boy.pass,false);
});
check("even present unsupported GLB paths cannot fake a reviewed checksum",()=>{
 const r=checkActualBinaryArguments(["--boy-glb=/not-found/boy.glb","--girl-glb=/not-found/girl.glb"],boy,girl,acceptance);
 assert.equal(r.pass,false);
});
check("full strict CLI audit returns nonzero with missing GLBs",()=>{
 const original=process.stdout.write;
 let captured="";
 try{
   process.stdout.write=x=>{captured+=x;return true;};
   assert.equal(main(["--require-ready"]),1);
 }finally{process.stdout.write=original;}
 const result=JSON.parse(captured);
 assert.equal(result.ready,false);
 assert.equal(result.localBinaryEvidence.pass,false);
});
console.log(passed+" audit-blocker regression tests PASS. No real GLB validated, no release.");
