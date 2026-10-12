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
 const f=fixture();f.originals.boy.actualBinaryRead=false;f.milestones[0].approved=true;f.milestones[0].status="approved";
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

test("Independent girl V02 geometry does NOT grant original face or finished prayer model",()=>{
 const f=fixture(),p=f.originals.girl.experimentalIndependent3DGeometricBlockout;
 assert.equal(p.present,true);
 assert.equal(p.isBoyMeshRecolor,false);
 assert.equal(p.v02Sha256,"f14746ebcdd629b93ed8ec83dc7c752447de5d266f7fc93c10aa96b2d19e080d");
 assert.equal(p.v02GeometryCount,147);
 assert.equal(p.v02TriangleCount,63060);
 assert.equal(p.googleDriveByteRoundTripSHA256Verified,true);
 assert.equal(p.sourceIdentitySimilarityApproved,false);
 assert.equal(p.skinnedRigPresent,false);
 assert.equal(p.prayerAnimationsAvailable,false);
 assert.equal(f.originals.girl.actualOriginalGlbPresent,false);
 assert.equal(f.originals.girl.actual3dIdentityApproved,false);
 assert.equal(f.originals.girl.original3DModelProduced,false);
 assert.equal(f.milestones[2].approved,false);
 assert.equal(f.release.productionReady,false);
 assert.equal(audit(f).pass,true);
});

test("Girl V06 real geometry is backed up and still fails human likeness review",()=>{
 const f=fixture(),p=f.originals.girl.experimentalIndependent3DGeometricBlockout;
 assert.equal(p.v06Sha256,"3021ad1e1ac9644af6d11e7b138ebfe1c7607dfd7947e18cbbcc9109bf4e197e");
 assert.equal(p.v06Bytes,660088);
 assert.equal(p.v06GeometryCount,159);
 assert.equal(p.v06TriangleCount,74876);
 assert.equal(p.v06SixRealCamerasVerified,true);
 assert.equal(p.v06Independent3D,true);
 assert.equal(p.v06GoogleDriveRoundTripSHA256Verified,true);
 assert.match(p.v06VsOriginalPhotoComparisonResult,/REJECTED/);
 assert.equal(p.v06HumanApproved,false);
 assert.equal(p.v06HasSkin,false);
 assert.equal(p.v06AnimationCount,0);
 assert.equal(p.v06SourceOriginalsUnchanged,true);
 assert.equal(f.originals.girl.actualOriginalGlbPresent,false);
 assert.equal(f.originals.girl.actual3dIdentityApproved,false);
 assert.equal(f.milestones[2].approved,false);
 assert.equal(f.milestones.filter(m=>m.approved).length,0);
 assert.equal(f.release.productionReady,false);
 assert.equal(f.release.mergeMain,false);
 assert.equal(f.release.liveDeploy,false);
 assert.equal(audit(f).pass,true);
});

test("Girl V07-V09 actual mesh study rejects the angular V08 and cannot unlock girl",()=>{
 const p=fixture().originals.girl.experimentalIndependent3DGeometricBlockout;
 const q=JSON.parse(fs.readFileSync(path.join(__dirname,"GIRL-V07-V09-REAL-GLB-QUALITY-20261012.json"),"utf8"));
 assert.equal(q.schemaVersion,1);
 assert.equal(p.v07Sha256,q.vers[1].sha256);
 assert.equal(p.v08Sha256,q.vers[2].sha256);
 assert.equal(p.v09Sha256,q.vers[3].sha256);
 assert.equal(p.v08Rejected,true);
 assert.equal(q.vers[2].rejected,true);
 assert.equal(p.v09Bytes,1510248);
 assert.equal(p.v09Meshes,213);
 assert.equal(p.v09Triangles,137532);
 assert.equal(p.v09SixCameraViewsRendered,true);
 assert.equal(p.v09GoogleDriveByteRoundTripSHA256Verified,true);
 assert.equal(p.v09GirlStillNotOriginalIdentity,true);
 assert.equal(p.v09GirlStillNotRigged,true);
 assert.ok(q.vers[0].eyeBrowDistanceFromFaceMedianModelUnits>.07);
 assert.ok(q.vers[3].browMaximumSignedOffsetModelUnits<.015);
 assert.equal(q.vers[3].approved,false);
 for(const [flag,val] of Object.entries(q.gates))assert.equal(val,false,flag+" must remain blocked");
 const d=fixture();
 assert.equal(d.originals.girl.actualOriginalGlbPresent,false);
 assert.equal(d.originals.girl.actual3dIdentityApproved,false);
 assert.equal(d.milestones[2].approved,false);
 assert.equal(d.release.productionReady,false);
 assert.equal(d.release.mergeMain,false);
 assert.equal(d.release.liveDeploy,false);
 assert.equal(audit(d).pass,true);
});

test("Girl V11 hood-face mesh bridge is research only and V10/V12 are rejected",()=>{
 const d=fixture(),p=d.originals.girl.experimentalIndependent3DGeometricBlockout;
 const e=JSON.parse(fs.readFileSync(path.join(__dirname,"GIRL-V10-V12-REAL-GLB-QUALITY-20261012.json"),"utf8"));
 assert.equal(e.schemaVersion,1);
 assert.equal(e.immutableSource.girlViews,5);
 assert.equal(e.immutableSource.verifiedSha256,true);
 assert.equal(e.immutableSource.originalsModified,false);
 assert.equal(e.immutableSource.independentLeftViewVerified,false);
 assert.equal(p.v11Sha256,e.preferredDraft.sha256);
 assert.equal(p.v11Bytes,2539424);
 assert.equal(p.v11Meshes,213);
 assert.equal(p.v11Triangles,188888);
 assert.deepEqual(e.preferredDraft.realDistinctCameraAngles,[0,45,90,180,270,315]);
 assert.ok(e.preferredDraft.closestVertexToHoodMaxMetres<.011);
 assert.equal(e.preferredDraft.realSkinRigPresent,false);
 assert.equal(e.preferredDraft.animationCount,0);
 assert.equal(e.preferredDraft.productionApproved,false);
 assert.equal(p.v11PreferredDraftOnly,true);
 assert.equal(p.v11ApprovedAsOriginal,false);
 assert.equal(p.v11DriveRoundTripSHA256Verified,true);
 assert.equal(e.rejectedDrafts.length,2);
 assert.deepEqual(e.rejectedDrafts.map(x=>x.version),["V10","V12"]);
 assert.equal(p.v10Sha256,e.rejectedDrafts[0].sha256);
 assert.equal(p.v12Sha256,e.rejectedDrafts[1].sha256);
 assert.equal(p.v10Rejected,true);
 assert.equal(p.v12Rejected,true);
 assert.equal(p.v10v12ArchiveSavedFileCount,37);
 for(const q of e.rejectedDrafts)assert.equal(q.productionApproved,false);
 for(const [label,value] of Object.entries(e.releaseLocks))assert.equal(value,false,label);
 assert.ok(e.qualityBlockers.length>=5);
 assert.equal(d.originals.girl.actual3dIdentityApproved,false);
 assert.equal(d.originals.girl.actualOriginalGlbPresent,false);
 assert.equal(d.milestones.filter(m=>m.approved).length,0);
 assert.equal(d.release.productionReady,false);
 assert.equal(d.release.mergeMain,false);
 assert.equal(d.release.liveDeploy,false);
 assert.equal(audit(d).pass,true);
});

test("V13 mesh changes are limited, old rejected models removed, no false approval",()=>{
 const d=fixture(),p=d.originals.girl.experimentalIndependent3DGeometricBlockout;
 const report=JSON.parse(fs.readFileSync(path.join(__dirname,"GIRL-V13-REAL-3D-QUALITY-20261012.json"),"utf8"));
 const policy=JSON.parse(fs.readFileSync(path.join(__dirname,"STORAGE-RETENTION-CLEANUP-V1.json"),"utf8"));
 assert.equal(report.schemaVersion,1);
 assert.equal(p.v13Sha256,report.currentDraftSha256);
 assert.equal(p.v13Bytes,2539424);
 assert.equal(p.v13Meshes,213);
 assert.equal(p.v13UnchangedMeshCount,211);
 assert.equal(report.real3DGeometry.changedMeshCount,2);
 assert.equal(report.real3DGeometry.original2DSourceUnmodified,true);
 assert.equal(report.real3DGeometry.original3DFaceHandsDressShoesUnchanged,true);
 assert.equal(p.v13SixRealCameraRendersVerified,true);
 assert.equal(p.v13DriveSha256RoundTripVerified,true);
 assert.equal(report.currentDraft,"V13"); // historical V13 report, independent of later versions
 assert.equal(p.v11KeepAsProtectedFallback,true);
 assert.equal(p.v13VisualIdentityApproved,false);
 assert.equal(p.v13SkinnedRigPresent,false);
 assert.equal(p.v13PrayerAnimationCount,0);
 assert.equal(report.cleanup.removedFilesTotal,24);
 assert.equal(report.cleanup.remainingCountsByFolder["V07-V09"],29);
 assert.equal(report.cleanup.remainingCountsByFolder["V10-V12"],21);
 assert.equal(p.v09DriveCurrentFileCount,29);
 assert.equal(p.v10v12ArchiveCurrentFileCount,21);
 assert.equal(policy.latestCompletedCleanup.filesDeleted,24);
 assert.equal(policy.release.productionReady,false);
 assert.equal(policy.release.mergeMain,false);
 assert.equal(policy.release.liveDeploy,false);
 assert.equal(d.originals.girl.actualOriginalGlbPresent,false);
 assert.equal(d.originals.girl.actual3dIdentityApproved,false);
 assert.equal(d.milestones.filter(m=>m.approved).length,0);
 assert.equal(d.release.liveDeploy,false);
 assert.equal(audit(d).pass,true);
});

test("Girl V14 real cloth mesh remains visibly unapproved after 6-angle review",()=>{
 const d=fixture(),p=d.originals.girl.experimentalIndependent3DGeometricBlockout;
 const a=JSON.parse(fs.readFileSync(path.join(__dirname,"GIRL-V14-REAL-3D-QUALITY-20261012.json"),"utf8"));
 assert.equal(a.schemaVersion,1);
 assert.equal(a.source.sha256,p.v13Sha256);
 assert.equal(a.source.unmodified,true);
 assert.equal(a.model.sha256,p.v14Sha256);
 assert.equal(a.model.bytes,2682192);
 assert.equal(a.model.meshCount,213);
 assert.equal(a.model.triangles,195544);
 assert.equal(a.model.changedMeshes.length,3);
 assert.equal(a.model.unchangedMeshes,210);
 assert.equal(a.model.sixRealCameraRenders,true);
 assert.equal(a.model.originalFaceHandsShoesDressUnchanged,true);
 assert.equal(a.model.humanOriginalLikenessApproved,false);
 assert.equal(a.model.meshCollisionApproved,false);
 assert.equal(a.model.clothSimulationApproved,false);
 assert.equal(a.model.skinnedRig,false);
 assert.equal(a.model.animations,0);
 assert.equal(p.v14DriveSha256RoundtripVerified,true);
 assert.equal(p.v14DriveFilesCount,13);
 assert.equal(p.v13KeepAsProtectedFallback,true);
 assert.equal(p.v14ModelLikenessApproved,false);
 assert.ok(a.review.stillFailing.length>=6);
 assert.equal(a.data.sourceOriginalsUntouched,true);
 for(const value of Object.values(a.release)) assert.equal(value,false);
 assert.equal(d.originals.girl.actualOriginalGlbPresent,false);
 assert.equal(d.originals.girl.actual3dIdentityApproved,false);
 assert.equal(d.milestones.filter(m=>m.approved).length,0);
 assert.equal(d.release.productionReady,false);
 assert.equal(d.release.mergeMain,false);
 assert.equal(d.release.liveDeploy,false);
 assert.equal(audit(d).pass,true);
});
