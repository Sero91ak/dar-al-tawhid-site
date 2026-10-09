#!/usr/bin/env node
"use strict";
/* Kids prayer release completion audit. No build or deployment.
 * Audit mode returns 0 only if project data are consistent, even if incomplete.
 * --require-ready returns 1 until EVERY substantive gate is documented.
 * Never treats synthetically passing GLB-structure checks as a visual signoff.
 */
const fs=require("node:fs");
const path=require("node:path");
const root=__dirname;
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),"utf8"));
function audit(status,boy,girl,story,hanbali){
 const problems=[], inconsistent=[];
 let checkCount=0;
 const need=(label,ok)=>{checkCount++;if(!ok)problems.push(label);};
 const forbidden=(label,val)=>{if(val)inconsistent.push(label);};
 const hex=s=>typeof s==="string"&&/^[a-f0-9]{64}$/.test(s);
 const approvedIdentity=(manifest,subject)=>{
   if(manifest?.subject!==subject)return false;
   const a=manifest.accept||{}, checksum=manifest.approvedModelChecksum||{};
   const flags=["hasActualOriginalIdentity","artistQualityRenderReviewed","glbMeshAndSkinReviewPassed",
     "rigPoseReviewPassed","signedOffByUserForFinal3D","productionReady"];
   const angles=new Set(checksum.reviewedAngles||[]);
   return flags.every(f=>a[f]===true)&&hex(checksum.sha256)&&
     Number.isSafeInteger(checksum.bytes)&&checksum.bytes>0&&
     typeof checksum.reviewRecordId==="string"&&checksum.reviewRecordId.trim().length>0&&
     typeof checksum.approvedDate==="string"&&/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(checksum.approvedDate)&&
     Array.isArray(manifest.requiredReviewAngles)&&manifest.requiredReviewAngles.length>=5&&
     manifest.requiredReviewAngles.every(view=>angles.has(view));
 };
 const passesViewEvidence=profile=>{
   const data=profile?.independentFiveViewSilhouetteIoU;
   return profile?.threeQuarterCameraPhysicallyCalibrated===true &&
     data && ["front","threeQuarter","right","back","left"].every(view=>
       typeof data[view]==="number"&&Number.isFinite(data[view])&&data[view]>=.90&&data[view]<=1);
 };
 const checksAgainstExactBinary=(profile,manifest)=>{
   const verification=status.technicalQA?.modelVerification?.[profile];
   return verification?.structureValid===true && verification?.bindPoseAndBoneLengthsVerified===true &&
     verification?.animationSamplerPayloadVerified===true &&
     hex(verification?.glbSha256)&&verification.glbSha256===manifest?.approvedModelChecksum?.sha256;
 };
 need("boys final original identity and five rendered review angles missing",approvedIdentity(boy,"original_boy"));
 need("girls final original identity and five rendered review angles missing",approvedIdentity(girl,"original_girl"));
 need("boy silhouette five-view >=90% with calibrated 3/4 view missing",status.boy?.fiveViewSilhouetteAbove90Percent===true&&status.boy?.requiredFiveViewOriginalityApproved===true&&passesViewEvidence(status.boy));
 need("girl independent five-view silhouette and calibrated 3/4 evidence missing",status.girl?.fiveIndependentViewsApproved===true&&passesViewEvidence(status.girl));
 need("boy exact GLB payload and invariant bone lengths unverified",checksAgainstExactBinary("boy",boy));
 need("girl exact GLB payload and invariant bone lengths unverified",checksAgainstExactBinary("girl",girl));
 need("non-root translation prevention not validated on real candidate",status.technicalQA?.translationGuardVerifiedAgainstActualV77GLB===true);
 need("boy facial/hair/kufi/cloth signoff missing",status.boy?.manualFaceKufiHairClothApproval===true);
 need("girl covered hair/neck and original pink clothing not approved",
   status.girl?.fullHairAndNeckCoverage3DApproved===true&&status.girl?.matchingPinkHijabAndDress3DApproved===true);
 need("girls independent five-view clothing and pose review absent",girl.referenceStatus?.independentFullTurnaroundApproved===true&&
   girl.religiousPoseReview==="fully_independently_reviewed"&&
   Array.isArray(girl.requiredClothingChecks)&&
   girl.requiredClothingChecks.every(x=>(girl.approvedModelChecksum?.reviewedClothingChecks||[]).includes(x)));
 need("boys and girls have not both received separate pose approval",status.prayer?.correctForBothProfilesApproved===true);
 const requiredPrayerClips=["Qiyam","Takbir","Ruku","RiseFromRuku","Sujud","Jalsah","SecondSujud","Tashahhud","Salam"];
 const verifiedClips=status.prayer?.approvedTeachingAnimations;
 need("complete teaching clip list unverified",Array.isArray(verifiedClips)&&
   requiredPrayerClips.every(clip=>verifiedClips.includes(clip))&&
   status.prayer?.pendingTeachingClips?.length===0);
 need("real frame-by-frame Sujud and Ruku ground/contact review missing",status.prayer?.poseContactFrameReviewApproved===true);
 need("source review incomplete",hanbali.approvedToTeach===true&&status.prayer.theologicalSourcesFinalReviewed===true);
 need("storyboard not final",story.approvedForProduction===true);
 need("real iPad test not complete",status.app?.realIPadTouchSafariTestPassed===true);
 need("real iPhone WebView test not complete",status.app?.realIPhoneWebViewTestPassed===true);
 need("offline test not complete",status.app?.offlineTestPassed===true);
 need("independent HTTPS staging test not complete",status.app?.independentWorkingHttpsStaging===true);
 need("manual visual and production user approvals missing",status.reviewGates?.originalHumanApproval===true&&status.reviewGates?.productionUserApproval===true);
 const allPassed=problems.length===0;
 forbidden("status claims ready despite incomplete gates",status.productionReady===true&&!allPassed);
 forbidden("boy model claims approved in status without digest",status.boy?.productionRigApproved===true&&(!boy.accept?.productionReady||!boy.approvedModelChecksum?.sha256));
 forbidden("girl model claims approved in status without digest",status.girl?.productionRigApproved===true&&(!girl.accept?.productionReady||!girl.approvedModelChecksum?.sha256));
 const ready=allPassed&&inconsistent.length===0;
 return {ready,blockingChecks:problems,inconsistent,passedChecks:checkCount-problems.length,totalChecks:checkCount};
}
function main(args){
 const boy=read("original-boy-identity-lock-v1.json"),girl=read("original-girl-identity-lock-v1.json");
 const status=read("PROJECT-STATUS-RELEASE-GATES.json");
 const story=JSON.parse(fs.readFileSync(path.join(root,"../content/raf-qiyam-storyboard.json"),"utf8"));
 const hanbali=JSON.parse(fs.readFileSync(path.join(root,"../content/hanbali-review.json"),"utf8"));
 const result=audit(status,boy,girl,story,hanbali);
 process.stdout.write(JSON.stringify(result,null,2)+"\n");
 if(result.inconsistent.length)return 2;
 if(args.includes("--require-ready")&&!result.ready)return 1;
 return 0;
}
module.exports={audit,main};
if(require.main===module)process.exitCode=main(process.argv.slice(2));
