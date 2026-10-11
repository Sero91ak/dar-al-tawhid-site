#!/usr/bin/env node
"use strict";
/* Kids Mein Gebet acceptance order. Structural policy only, NOT proof of real GLB
 * similarity, prayer correctness, human sign-off, CI completion or permission
 * to deploy. The on-disk release guard remains independently mandatory.
 */
const fs=require("node:fs");
const path=require("node:path");
const EXPECTED=[
 "01-original-assets","02-original-boy","03-original-girl","04-rig",
 "05-prayer-poses","06-fiqh","07-two-rakah","08-all-prayers",
 "09-lessons-media","10-page","11-staging","12-release"
];
const REQUIRED_FLAGS=["productionReady","mergeMain","liveDeploy","automatedModelSubstitutionAllowed"];
const REQUIRED_ORIGINALS=["boy","girl"];
const TYPES_REQUIRING_USER=[
 "boy_identity_signoff","girl_clothing_signoff",
 "teaching_signoff","final_user_signoff","release_approval_record"
];
const SHA256=/^[0-9a-f]{64}$/;
function audit(doc) {
 const errors=[],fail=x=>errors.push(x);
 if(!doc||typeof doc!=="object"||Array.isArray(doc)) return {pass:false,errors:["Invalid contract object"],eligibleForRelease:false};
 if(doc.schemaVersion!==1)fail("Unknown contract schema");
 if(typeof doc.activeGate!=="string")fail("Active milestone identifier missing");
 const i=doc.integration||{};
 if(i.sourceProfileOnly!==true||i.manualProfileSwitcherAllowedInTestOnly!==true||
 i.newTabBeforeApproval!==false||i.testHomeEntryOnly!==true||
 i.preserveExistingKidsState!==true||i.isolatedRollback!==true)fail("Kids identity/profile/navigation isolation contract violated");
 const originals=doc.originals||{};
 if(!REQUIRED_ORIGINALS.every(x=>originals[x]&&typeof originals[x]==="object"))fail("Original boy/girl source contracts missing");
 else {
   if(typeof originals.boy.actualBinaryRead!=="boolean"||typeof originals.girl.actualOriginalGlbPresent!=="boolean"||
       typeof originals.boy.actual3dIdentityApproved!=="boolean"||typeof originals.girl.actual3dIdentityApproved!=="boolean")
       fail("Original binary and visual provenance statuses must be explicit booleans");
   if(originals.boy.actualBinaryRead===true&&!SHA256.test(originals.boy.verifiedGlbSha256||""))
       fail("Claimed boy GLB requires a measured SHA-256");
   if(originals.girl.actualOriginalGlbPresent===true&&!SHA256.test(originals.girl.verifiedGlbSha256||""))
       fail("Claimed girl GLB requires a measured SHA-256");
   if(originals.boy.candidateGlbSha256!=="353b028862f91922d6288cf6ede09d5c8150815657c66c9c116b7775311c07fa")
      fail("Frozen V7.7 source hash mismatch");
 }
 if(doc.previewIsNotReleaseEvidence!==true)fail("Preview must never authorize live release");
 const milestones=doc.milestones;
 if(!Array.isArray(milestones)||milestones.length!==EXPECTED.length)fail("Must retain all 12 independent milestones");
 let allApproved=Array.isArray(milestones)&&milestones.length===EXPECTED.length;
 for(let n=0;n<(Array.isArray(milestones)?milestones.length:0);n++) {
   const m=milestones[n];
   if(!m||typeof m!=="object"){fail("Malformed milestone "+n);allApproved=false;continue}
   if(m.id!==EXPECTED[n])fail("Milestone order/identity mismatch at "+n);
   if(!Array.isArray(m.needs)||JSON.stringify(m.needs)!==JSON.stringify(n?[EXPECTED[n-1]]:[]))
       fail("Missing explicit predecessor on "+m.id);
   if(!Array.isArray(m.criteria)||m.criteria.length<2||m.criteria.some(t=>typeof t!=="string"||t.length<20))
       fail("Incomplete acceptance criteria on "+m.id);
   if(!Array.isArray(m.evidenceTypes)||m.evidenceTypes.length<2||new Set(m.evidenceTypes).size!==m.evidenceTypes.length)
       fail("Distinct evidence types required on "+m.id);
   if(typeof m.approved!=="boolean"||!["blocked","in_progress","approved"].includes(m.status))
       fail("Invalid approval status on "+m.id);
   if(!Array.isArray(m.evidence))fail("Missing evidence entries on "+m.id);
   if(m.approved===true) {
     if(m.status!=="approved")fail("Approval status mismatch on "+m.id);
     if(n&&milestones[n-1]?.approved!==true)fail("Cannot approve "+m.id+" before predecessor");
     const available=new Map((Array.isArray(m.evidence)?m.evidence:[]).filter(e=>
        e&&typeof e.type==="string"&&e.verified===true&&typeof e.ref==="string"&&e.ref.length>10&&
        (e.sha256===undefined||SHA256.test(e.sha256))).map(e=>[e.type,e]));
     for(const needed of (Array.isArray(m.evidenceTypes)?m.evidenceTypes:[])) {
       if(!available.has(needed))fail("Missing verified proof: "+m.id+" / "+needed);
       if(TYPES_REQUIRING_USER.includes(needed)&&available.get(needed)?.humanApproved!==true)
          fail("Missing human sign-off: "+needed);
     }
   } else {
     allApproved=false;
     if(m.status==="approved")fail("Stage marked approved without evidence: "+m.id);
     if(n>0&&m.status==="in_progress"&&milestones[n-1]?.approved!==true)
        fail("Cannot advance active acceptance gate before predecessor: "+m.id);
   }
 }
 const release=doc.release||{};
 for(const key of REQUIRED_FLAGS)if(typeof release[key]!=="boolean")fail("Release flag missing: "+key);
 if(release.automatedModelSubstitutionAllowed!==false)fail("Replacement identity forbidden");
 if(release.productionReady===true||release.mergeMain===true||release.liveDeploy===true)
   fail("Acceptance contract must not itself authorize production, merges or live deploy");
 if(doc.activeGate!==EXPECTED.find((x,n)=>milestones?.[n]?.approved!==true)&&!allApproved)
   fail("Active gate does not match first unfinished milestone");
 return {pass:errors.length===0,errors,completed:Array.isArray(milestones)?milestones.filter(x=>x?.approved===true).length:0,
  total:EXPECTED.length,activeGate:doc.activeGate,
  eligibleForRelease:false,
  notice:"Structural checks only; real GLB bytes, prayer, visual and device acceptance require independent verification. No automatic approval."};
}
function main() {
 const file=path.resolve(__dirname,"COMPLETION-GATES-V1.json");
 let report;
 try{report=audit(JSON.parse(fs.readFileSync(file,"utf8")))}
 catch(e){report={pass:false,errors:[String(e.message||e)],eligibleForRelease:false}}
 console.log(JSON.stringify(report,null,2));
 return report.pass?0:1;
}
module.exports={audit,EXPECTED,main};
if(require.main===module)process.exitCode=main();
