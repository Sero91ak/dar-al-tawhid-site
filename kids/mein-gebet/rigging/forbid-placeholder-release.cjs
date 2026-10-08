#!/usr/bin/env node
"use strict";
/*
 * Children prayer — ORIGINAL CHARACTER RELEASE GATE.
 * Guards against publishing the experimental low-poly rig as the original boy.
 * This does NOT determine likeness using AI. Final rendered 360° proof + explicit
 * user signoff is still required. Scope isolated to kids/mein-gebet/rigging/.
 */
const fs=require("node:fs");
const path=require("node:path");
const {parseGLB,validateDocument}=require("./validate-glb.cjs");
const base=__dirname;
function validateIdentity(gltf,identity,technical) {
  const errors=[];
  const forbid=/low.poly|blockout|placeholder|engineering rig|test rig|not.user.approved|prototype|prototyp/i;
  const name=String(gltf?.asset?.generator||"")+" "+(gltf?.meshes||[]).map(m=>m.name||"").join(" ");
  if(forbid.test(name))errors.push("BLOCKED: diagnostic low-poly/blockout/prototype model markers");
  if(identity?.subject!=="original_boy")errors.push("BLOCKED: missing required original-boy subject.");
  const approv=identity?.accept||{};
  for(const f of ["hasActualOriginalIdentity","artistQualityRenderReviewed","glbMeshAndSkinReviewPassed","rigPoseReviewPassed","signedOffByUserForFinal3D","productionReady"]) {
    if(approv[f]!==true)errors.push("BLOCKED: explicit final-model approval missing: "+f);
  }
  if(!technical?.structureValid)errors.push("BLOCKED: invalid GLB structure or required Qiyam/Takbir clips.");
  return {readyForProduction:errors.length===0,errors,technicalStructureValid:!!technical?.structureValid};
}
function main(argv) {
  if(argv.length!==1){process.stderr.write("Usage: node forbid-placeholder-release.cjs <boy-model.glb>\n");return 2}
  try{
    if(path.extname(argv[0]).toLowerCase()!==".glb")throw Error("Expected real binary GLB.");
    const data=fs.readFileSync(argv[0]);
    const parsed=parseGLB(data);
    const identity=JSON.parse(fs.readFileSync(path.join(base,"original-boy-identity-lock-v1.json"),"utf8"));
    const acceptance=JSON.parse(fs.readFileSync(path.join(base,"rig-acceptance-v1.json"),"utf8"));
    const technical=validateDocument(parsed.gltf,acceptance,"boy",{fileBytes:data.length,hasBin:parsed.hasBin});
    const result=validateIdentity(parsed.gltf,identity,technical);
    process.stdout.write(JSON.stringify(result,null,2)+"\n");
    return result.readyForProduction ? 0 : 1;
  }catch(e){process.stderr.write("BLOCKED: "+e.message+"\n");return 1}
}
module.exports={validateIdentity,main};
if(require.main===module)process.exitCode=main(process.argv.slice(2));
