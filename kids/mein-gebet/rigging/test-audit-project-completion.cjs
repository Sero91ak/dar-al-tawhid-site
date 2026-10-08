#!/usr/bin/env node
"use strict";
/* Isolated unit tests: all-positive records are SIMULATED, never a real signoff.
 * Actual parser/rig checker is injected; project gate must still fail closed.
 */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const os=require("node:os");
const path=require("node:path");
const crypto=require("node:crypto");
const vm=require("node:vm");
const Module=require("node:module");
const filename=path.join(__dirname,"audit-project-completion.cjs");
const src=fs.readFileSync(filename,"utf8");
const sandbox={module:{exports:{}},exports:{},__dirname:__dirname,process,Buffer,console,
  require:(id)=>{
    if(id==="./validate-glb.cjs")return {
      parseGLB:b=>({gltf:{asset:{version:"2.0"}},hasBin:true}),
      validateDocument:(g,s,p,m)=>({structureValid:true,clipNames:[
        "Qiyam","Takbir","Ruku","RiseFromRuku","Sujud","Jalsah","SecondSujud","Tashahhud","Salam"
      ]})
    };
    if(id==="./forbid-placeholder-release.cjs")return {
      validateIdentity:(g,id,t,fp)=>({readyForProduction:id.approvedModelChecksum.sha256===fp.sha256})
    };
    return require(id);
  }
};
vm.runInNewContext(src,sandbox,{filename});
const {audit,REQUIRED_CLIPS,modelProof}=sandbox.module.exports;
const temp=fs.mkdtempSync(path.join(os.tmpdir(),"kids-pr825-gate-"));
const base=path.join(temp,"rigging");fs.mkdirSync(base);
const bytes=Buffer.from("TEST_ONLY_SYNTHETIC_NOT_A_GLB_FOR_PRODUCTION");
fs.writeFileSync(path.join(base,"boy.glb"),bytes);
fs.writeFileSync(path.join(base,"girl.glb"),bytes);
const fingerprint={sha256:crypto.createHash("sha256").update(bytes).digest("hex"),bytes:bytes.length};
const angles=["front","left_90_side","right_90_side","three_quarter_45","back"];
const clothes=["hair_covered","neck_covered","khimar_front_chest_covered","khimar_back_covered","loose_pink_full_dress","no_clipping_all_prayer_poses"];
const approval={...fingerprint,reviewRecordId:"VISUAL_SIGNOFF_20261009",approvedDate:"2026-10-09",reviewedAngles:angles,reviewedClothingChecks:clothes};
const mkIdentity=(girl=false)=>({subject:girl?"original_girl":"original_boy",accept:{productionReady:true},
  requiredReviewAngles:angles,requiredClothingChecks:girl?clothes:[],approvedModelChecksum:{...approval},
  referenceStatus:{independentFullTurnaroundApproved:true},religiousPoseReview:"fully_independently_reviewed"});
const scores={front:.95,threeQuarter:.93,right:.94,back:.96,left:.92};
const mkStatus=()=>({boy:{modelArtifactPath:"boy.glb",requiredFiveViewOriginalityApproved:true,fiveViewSilhouetteAbove90Percent:true,fiveViewCalibrationApproved:true,calibratedFiveViewIoU:{...scores},manualFaceKufiHairClothApproval:true,productionRigApproved:true},
  girl:{modelArtifactPath:"girl.glb",fiveIndependentViewsApproved:true,fiveViewCalibrationApproved:true,calibratedFiveViewIoU:{...scores},fullHairAndNeckCoverage3DApproved:true,matchingPinkHijabAndDress3DApproved:true,separateFiqhPoseReviewApproved:true,productionRigApproved:true},
  prayer:{correctForBothProfilesApproved:true,approvedTeachingAnimations:[...REQUIRED_CLIPS],pendingTeachingClips:[],theologicalSourcesFinalReviewed:true},
  app:{realIPadTouchSafariTestPassed:true,realIPhoneWebViewTestPassed:true,offlineTestPassed:true,independentWorkingHttpsStaging:true,profileBased2DPreviewInDraft:true,bottomTabAllowed:false},
  reviewGates:{originalHumanApproval:true,productionUserApproval:true},productionReady:true});
const boy=mkIdentity(),girl=mkIdentity(true),story={approvedForProduction:true},hanbali={approvedToTeach:true,approvedToAnimate:true};
const opts={base,rigSpec:{}};
let n=0;
function check(label,edit,expected=false){
 const s=structuredClone(mkStatus()),b=structuredClone(boy),g=structuredClone(girl);
 edit(s,b,g);
 const r=audit(s,b,g,story,hanbali,opts);
 assert.equal(r.ready,expected,label+": "+JSON.stringify(r));
 if(!expected)assert(r.blockingChecks.length>0,label+" must identify a blocker");
 n++;console.log("PASS "+label);
}
try{
 check("synthetic all-green fixture passes gate logic only",()=>{},true);
 check("no boy model file blocks",s=>s.boy.modelArtifactPath="missing.glb");
 check("no girl model file blocks",s=>s.girl.modelArtifactPath="missing.glb");
 check("wrong boy checksum blocks",(s,b)=>b.approvedModelChecksum.sha256="a".repeat(64));
 check("wrong girl size blocks",(s,b,g)=>g.approvedModelChecksum.bytes=1);
 check("no boy 90-percent fiveview evidence blocks",s=>s.boy.fiveViewSilhouetteAbove90Percent=false);
 check("no girl independent fiveview approval blocks",(s,b,g)=>g.referenceStatus.independentFullTurnaroundApproved=false);
 check("missing girl neck coverage blocks",(s,b,g)=>g.approvedModelChecksum.reviewedClothingChecks=g.approvedModelChecksum.reviewedClothingChecks.filter(x=>x!=="neck_covered"));
 check("missing girl hair coverage blocks",(s,b,g)=>g.approvedModelChecksum.reviewedClothingChecks=g.approvedModelChecksum.reviewedClothingChecks.filter(x=>x!=="hair_covered"));
 check("missing Sujud clip blocks",s=>s.prayer.approvedTeachingAnimations=s.prayer.approvedTeachingAnimations.filter(x=>x!=="Sujud"));
 check("pending clips block",s=>s.prayer.pendingTeachingClips=["Ruku"]);
 check("missing model camera calibration blocks",s=>s.boy.fiveViewCalibrationApproved=false);
 check("3/4 below 90 percent blocks",s=>s.boy.calibratedFiveViewIoU.threeQuarter=.89);
 check("girl 3/4 below 90 percent blocks",s=>s.girl.calibratedFiveViewIoU.threeQuarter=.89);
 check("productionReady false blocks",s=>s.productionReady=false);
 check("religious review flag missing blocks",s=>s.prayer.theologicalSourcesFinalReviewed=false);
 check("real iPad test missing blocks",s=>s.app.realIPadTouchSafariTestPassed=false);
 check("real iPhone test missing blocks",s=>s.app.realIPhoneWebViewTestPassed=false);
 check("offline test missing blocks",s=>s.app.offlineTestPassed=false);
 check("staging test missing blocks",s=>s.app.independentWorkingHttpsStaging=false);
 check("human approval missing blocks",s=>s.reviewGates.productionUserApproval=false);
 check("profile selection missing blocks",s=>s.app.profileBased2DPreviewInDraft=false);
 check("unapproved new bottom tab blocks",s=>s.app.bottomTabAllowed=true);
 check("absolute model path rejected",s=>s.boy.modelArtifactPath=path.join(base,"boy.glb"));
 check("directory traversal rejected",s=>s.boy.modelArtifactPath="../../other.glb");
 check("GLB extension required",s=>s.boy.modelArtifactPath="boy.png");
 assert.equal(modelProof({boy:{modelArtifactPath:"missing.glb"}},boy,"boy",{},base).passed,false);
 console.log(n+" release-gate regression checks passed; no actual character approved.");
}finally{fs.rmSync(temp,{recursive:true,force:true});}