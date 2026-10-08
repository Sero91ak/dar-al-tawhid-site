#!/usr/bin/env node
"use strict";
/* Fail-closed production-only gate for an independently reviewed GIRL rig.
 * Expects a real externally modeled and explicitly reviewed binary GLB.
 * It never grants visual/fiqh approval from a synthetic test fixture.
 */
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");
const {parseGLB,validateDocument}=require("./validate-glb.cjs");
const {validateIdentity}=require("./forbid-placeholder-release.cjs");
function main(argv){
  if(argv.length!==1){process.stderr.write("Usage: node forbid-girl-placeholder-release.cjs <original-girl.glb>\n");return 2;}
  try{
    const pathToGLB=argv[0];
    if(path.extname(pathToGLB).toLowerCase()!==".glb")throw Error("Only actual binary GLB files.");
    const raw=fs.readFileSync(pathToGLB);
    const {gltf,hasBin}=parseGLB(raw);
    const spec=JSON.parse(fs.readFileSync(path.join(__dirname,"rig-acceptance-v1.json"),"utf8"));
    const girl=JSON.parse(fs.readFileSync(path.join(__dirname,"original-girl-identity-lock-v1.json"),"utf8"));
    const technical=validateDocument(gltf,spec,"girl",{fileBytes:raw.length,hasBin});
    const result=validateIdentity(gltf,girl,technical,{
      sha256:crypto.createHash("sha256").update(raw).digest("hex"),bytes:raw.length
    },"original_girl");
    process.stdout.write(JSON.stringify(result,null,2)+"\n");
    return result.readyForProduction?0:1;
  }catch(err){process.stderr.write("BLOCKED: "+err.message+"\n");return 1;}
}
module.exports={main};
if(require.main===module)process.exitCode=main(process.argv.slice(2));
