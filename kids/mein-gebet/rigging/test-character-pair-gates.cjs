#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const path=require("node:path");
const fs=require("node:fs");
const {validateIdentity}=require("./forbid-placeholder-release.cjs");
const boy=JSON.parse(fs.readFileSync(path.join(__dirname,"original-boy-identity-lock-v1.json"),"utf8"));
const girl=JSON.parse(fs.readFileSync(path.join(__dirname,"original-girl-identity-lock-v1.json"),"utf8"));
const technical={structureValid:true};
const fingerprint={sha256:"f".repeat(64),bytes:345671};
const realGltf={asset:{generator:"SculptExport"},meshes:[{name:"OriginalChild"}]};
let count=0;
function test(label,check){check();count++;console.log("PASS "+label);}
function approved(m){
  const a=JSON.parse(JSON.stringify(m));
  for(const key of Object.keys(a.accept))a.accept[key]=true;
  a.approvedModelChecksum={
    sha256:fingerprint.sha256,bytes:fingerprint.bytes,reviewRecordId:"SIMULATED_NOT_REAL",
    reviewedAngles:a.requiredReviewAngles,approvedDate:"2026-10-08",
    reviewedClothingChecks:a.requiredClothingChecks||[]
  };
  return a;
}
test("boy defaults remain blocked",()=>assert.equal(validateIdentity(realGltf,boy,technical,fingerprint).readyForProduction,false));
test("girl defaults remain blocked",()=>assert.equal(validateIdentity(realGltf,girl,technical,fingerprint,"original_girl").readyForProduction,false));
test("profile cannot swap boy/girl manifest",()=>assert.equal(validateIdentity(realGltf,boy,technical,fingerprint,"original_girl").readyForProduction,false));
test("boy release would require actual independent approvals",()=>assert.equal(validateIdentity(realGltf,approved(boy),technical,fingerprint).readyForProduction,true));
test("girl requires independent turnaround and fiqh review",()=>assert.equal(validateIdentity(realGltf,approved(girl),technical,fingerprint,"original_girl").readyForProduction,false));
const fullyReviewedGirl=approved(girl);
fullyReviewedGirl.referenceStatus.independentFullTurnaroundApproved=true;
fullyReviewedGirl.religiousPoseReview="fully_independently_reviewed";
test("theoretical fully reviewed girl can pass structural identity gate",()=>assert.equal(validateIdentity(realGltf,fullyReviewedGirl,technical,fingerprint,"original_girl").readyForProduction,true));
test("girl cannot pass without neck-cover review",()=>{
  const m=JSON.parse(JSON.stringify(fullyReviewedGirl));
  m.approvedModelChecksum.reviewedClothingChecks=m.approvedModelChecksum.reviewedClothingChecks.filter(x=>x!=="neck_covered");
  assert.equal(validateIdentity(realGltf,m,technical,fingerprint,"original_girl").readyForProduction,false);
});
test("girl cannot pass without hair-cover review",()=>{
  const m=JSON.parse(JSON.stringify(fullyReviewedGirl));
  m.approvedModelChecksum.reviewedClothingChecks=m.approvedModelChecksum.reviewedClothingChecks.filter(x=>x!=="hair_covered");
  assert.equal(validateIdentity(realGltf,m,technical,fingerprint,"original_girl").readyForProduction,false);
});
test("girl cannot pass without original pink dress review",()=>{
  const m=JSON.parse(JSON.stringify(fullyReviewedGirl));
  m.approvedModelChecksum.reviewedClothingChecks=m.approvedModelChecksum.reviewedClothingChecks.filter(x=>x!=="loose_pink_full_dress");
  assert.equal(validateIdentity(realGltf,m,technical,fingerprint,"original_girl").readyForProduction,false);
});
test("missing left 90 degree reference blocks girl",()=>{
  const m=JSON.parse(JSON.stringify(fullyReviewedGirl));
  m.approvedModelChecksum.reviewedAngles=m.approvedModelChecksum.reviewedAngles.filter(x=>x!=="left_90_side");
  assert.equal(validateIdentity(realGltf,m,technical,fingerprint,"original_girl").readyForProduction,false);
});
test("model hash mismatch blocks a modified GLB",()=>assert.equal(validateIdentity(realGltf,fullyReviewedGirl,technical,{...fingerprint,sha256:"e".repeat(64)},"original_girl").readyForProduction,false));
test("model byte mismatch blocks changes",()=>assert.equal(validateIdentity(realGltf,fullyReviewedGirl,technical,{...fingerprint,bytes:1},"original_girl").readyForProduction,false));
test("bad skin or missing clips blocks girl",()=>assert.equal(validateIdentity(realGltf,fullyReviewedGirl,{structureValid:false},fingerprint,"original_girl").readyForProduction,false));
test("marked blockout cannot be released",()=>assert.equal(validateIdentity({asset:{generator:"prototype blockout"},meshes:[]},fullyReviewedGirl,technical,fingerprint,"original_girl").readyForProduction,false));
test("actual manifests must remain unapproved",()=>assert.deepEqual([boy.accept.productionReady,girl.accept.productionReady],[false,false]));
test("actual GIRL original five-view reference has not been falsely signed off",()=>assert.equal(girl.referenceStatus.independentFullTurnaroundApproved,false));
console.log(count+" tests passed; simulated positive fixtures DO NOT approve any GLB.");
