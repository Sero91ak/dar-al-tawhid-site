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
 const need=(label,ok)=>{if(!ok)problems.push(label);};
 const forbidden=(label,val)=>{if(val)inconsistent.push(label);};
 need("boys production original 3D not approved",boy.accept?.productionReady===true&&boy.approvedModelChecksum?.sha256?.length===64);
 need("girls production original 3D not approved",girl.accept?.productionReady===true&&girl.approvedModelChecksum?.sha256?.length===64);
 need("girls independent five views and clothing are not signed off",girl.referenceStatus?.independentFullTurnaroundApproved===true&&girl.religiousPoseReview==="fully_independently_reviewed"&&(girl.approvedModelChecksum?.reviewedClothingChecks||[]).length===(girl.requiredClothingChecks||[]).length);
 need("boys and girls have not both received separate pose approval",status.prayer?.correctForBothProfilesApproved===true);
 need("all required actual animation clips not verified",status.prayer?.pendingTeachingClips?.length===0);
 need("source review incomplete",hanbali.approvedToTeach===true&&status.prayer.theologicalSourcesFinalReviewed===true);
 need("storyboard not final",story.approvedForProduction===true);
 need("real iPad test not complete",status.app?.realIPadTouchSafariTestPassed===true);
 need("real iPhone WebView test not complete",status.app?.realIPhoneWebViewTestPassed===true);
 need("offline test not complete",status.app?.offlineTestPassed===true);
 need("independent HTTPS staging test not complete",status.app?.independentWorkingHttpsStaging===true);
 need("manual visual and production user approvals missing",status.reviewGates?.originalHumanApproval===true&&status.reviewGates?.productionUserApproval===true);
 const ready=problems.length===0&&inconsistent.length===0;
 forbidden("status claims ready despite incomplete gates",status.productionReady===true&&!ready);
 forbidden("boy model claims approved in status without digest",status.boy?.productionRigApproved===true&&(!boy.accept?.productionReady||!boy.approvedModelChecksum?.sha256));
 forbidden("girl model claims approved in status without digest",status.girl?.productionRigApproved===true&&(!girl.accept?.productionReady||!girl.approvedModelChecksum?.sha256));
 return {ready,blockingChecks:problems,inconsistent,passedChecks:12-problems.length};
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
