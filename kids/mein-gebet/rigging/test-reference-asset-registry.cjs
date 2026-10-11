#!/usr/bin/env node
"use strict";
const {test}=require("node:test"), assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const file=path.join(__dirname,"REFERENCE-ASSET-REGISTRY-V1.json");
const load=()=>JSON.parse(fs.readFileSync(file,"utf8"));
const SHA=/^[0-9a-f]{64}$/;
test("10 independently SHA-pinned ORIGINAL CHILD views are archived and not 3D approved",()=>{
 const d=load();assert.equal(d.schemaVersion,1);
 for(const profile of ["boy","girl"]){
  const images=d.original2DViews[profile];
  assert.equal(images.length,5,profile+" must retain all five views");
  assert.equal(new Set(images.map(x=>x.sha256)).size,5);
  for(const i of images){
   assert.match(i.sha256,SHA);
   assert.match(i.libraryPath,/^\/Kinder App\/Mein_Gebet_Originale_20261011\//);
   assert.equal(i.original2D,true);
   assert.equal(i.approved3D,false);
  }
 }
 assert.equal(d.productionApproved,false);
});
test("Eleven distinct prayer categories are tracked separately for each ORIGINAL child",()=>{
 const d=load(),ids=d.poseLabels.map(x=>x.id);
 assert.equal(ids.length,11);assert.equal(new Set(ids).size,11);
 assert.equal(d.childPoseSlots.length,22);
 for(const profile of ["boy","girl"]){
  const rows=d.childPoseSlots.filter(x=>x.profile===profile);
  assert.deepEqual(rows.map(x=>x.id),ids);
  for(const slot of rows) {
   assert.equal(slot.childImagePoseLocated,false);
   assert.equal(slot.sourceApproved,false);
   assert.equal(slot.actualOriginalGLBAnimation,false);
   assert.equal(slot.reviewedStillRender,false);
   assert.equal(slot.reviewedPhysicalPrayer,false);
  }
 }
});
test("Historical ADULT prayer reference images cannot masquerade as the Kids models",()=>{
 const d=load();assert.ok(d.historicalPoseSheets.length>=4);
 for(const r of d.historicalPoseSheets){
  assert.match(r.libraryPath,/^\/Meine App\//);
  assert.equal(r.sourceKind,"historical_adult_pose_reference");
  assert.equal(r.isChildCharacter,false);
  assert.equal(r.isRiggedGLB,false);
 }
});
test("Rig release cannot be inferred from the pose-board illustrations",()=>{
 const d=load();assert.deepEqual(d.lessonPolicy.taslimOrder,["taslim_right","taslim_left"]);
 assert.equal(d.lessonPolicy.bodyStillDuringTaslim,true);
 assert.equal(d.lessonPolicy.qiyamRightHandAboveLeftAtChest,true);
 assert.equal(d.lessonPolicy.sujudMultiPointContactMustBeReviewed,true);
 assert.equal(d.lessonPolicy.girlsHijabCoverageDuringAllPosesMustBeReviewed,true);
 assert.equal(d.lessonPolicy.completeTwoRakatsNotEquivalentToOnePassThrough11PoseLabels,true);
 assert.equal(d.lessonPolicy.religiousApprovalRequiredBeforeChildren,true);
 assert.equal(d.productionApproved,false);
});
