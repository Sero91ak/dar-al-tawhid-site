#!/usr/bin/env node
"use strict";
/*
 * Mein Gebet: structural 3D GLB release-gate, scope: KIDS draft ONLY.
 *
 * Does NOT certify Islamic correctness, identity of the original character,
 * visual bone proportions, floor contact or pose safety. All require manual QA.
 * Usage: node kids/mein-gebet/rigging/validate-glb.cjs <character.glb> [boy|girl]
 */
const fs = require("node:fs");
const path = require("node:path");
const GLB_MAGIC = 0x46546c67;
const GLB_JSON = 0x4e4f534a;

function parseGLB(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 20) throw Error("Too small to be a GLB.");
  if (buffer.readUInt32LE(0) !== GLB_MAGIC) throw Error("Invalid GLB magic; a PNG, video, or static poster is not a 3D model.");
  if (buffer.readUInt32LE(4) !== 2) throw Error("Only binary glTF 2.0 is supported.");
  if (buffer.readUInt32LE(8) !== buffer.length) throw Error("GLB declared length differs from actual file length.");
  let offset = 12;
  let json = null;
  let hasBin = false;
  while (offset + 8 <= buffer.length) {
    const size = buffer.readUInt32LE(offset);
    const type = buffer.readUInt32LE(offset + 4);
    offset += 8;
    if (size > buffer.length - offset) throw Error("GLB chunk exceeds file length.");
    if (type === GLB_JSON) {
      if (json !== null) throw Error("Multiple JSON chunks.");
      json = JSON.parse(buffer.subarray(offset, offset + size).toString("utf8").trim());
    } else if (type === 0x004e4942) {
      hasBin = true;
    }
    offset += size;
  }
  if (offset !== buffer.length || !json) throw Error("GLB missing or malformed JSON chunk.");
  return { gltf: json, hasBin };
}

function validateDocument(g, spec, profile = "boy", metadata = {}) {
  const errors = [];
  const warnings = [];
  const fail = s => errors.push(s);
  const required = Array.isArray(spec?.rig?.requiredBoneNames) ? spec.rig.requiredBoneNames : [];
  if (profile !== "boy" && profile !== "girl") fail("Unknown child profile.");
  if (!g || g.asset?.version !== "2.0") fail("Missing glTF 2.0 asset declaration.");
  const nodes = Array.isArray(g?.nodes) ? g.nodes : [];
  const skins = Array.isArray(g?.skins) ? g.skins : [];
  const meshes = Array.isArray(g?.meshes) ? g.meshes : [];
  const accessors = Array.isArray(g?.accessors) ? g.accessors : [];
  const animations = Array.isArray(g?.animations) ? g.animations : [];
  if (!skins.length) fail("No skin. A 2D billboard / unrigged model cannot be used as an animated prayer character.");
  if (!meshes.length) fail("No real mesh geometry.");
  if (!nodes.length) fail("No GLB scene nodes.");
  const skin = skins[0] || {};
  const joints = Array.isArray(skin.joints) ? skin.joints : [];
  const boneSet = new Set(joints.map(i => nodes[i]?.name).filter(Boolean));
  for (const name of required) if (!boneSet.has(name)) fail("Missing required rig bone: " + name);
  if (skin.inverseBindMatrices === undefined) fail("Missing inverseBindMatrices for skinned rig.");
  else {
    const bind = accessors[skin.inverseBindMatrices];
    if (!bind || bind.type !== "MAT4" || bind.componentType !== 5126 || bind.count < joints.length) fail("Invalid inverseBindMatrices accessor.");
  }
  const primitives = meshes.flatMap(m => Array.isArray(m.primitives) ? m.primitives : []);
  let vertices = 0;
  let skinnedPrimitive = false;
  for (const p of primitives) {
    const attributes = p.attributes || {};
    if (attributes.POSITION !== undefined) vertices += Number(accessors[attributes.POSITION]?.count || 0);
    if (attributes.JOINTS_0 !== undefined && attributes.WEIGHTS_0 !== undefined) skinnedPrimitive = true;
  }
  if (!skinnedPrimitive) fail("No skinned mesh vertex attributes JOINTS_0 + WEIGHTS_0.");
  if (vertices < (spec?.rig?.minimumGeometryVertices || 2000)) fail("Insufficient geometry: " + vertices + " vertices (likely placeholder/billboard).");
  if (!nodes.some(n => n.mesh !== undefined && n.skin !== undefined)) fail("No scene node binding a mesh to its skin.");
  const clips = new Map();
  for (const a of animations) {
    if (!a.name || clips.has(a.name)) fail("Animation clip missing a unique name.");
    else clips.set(a.name, a);
    if (!Array.isArray(a.channels) || !a.channels.length) fail("Empty animation clip: " + (a.name || "?"));
    for (const ch of a.channels || []) {
      if (ch.target?.path === "scale") fail("Animated scale changes body/limb proportions: " + a.name);
      if (!["translation", "rotation", "weights"].includes(ch.target?.path)) fail("Unsupported animation channel: " + String(ch.target?.path));
      if (!Number.isInteger(ch.target?.node) || !nodes[ch.target.node]) fail("Animation references invalid joint/node.");
    }
  }
  for (const clip of spec?.rig?.requiredClipsForMilestoneOne || []) {
    if (!clips.has(clip)) fail("Missing first-milestone animation clip: " + clip);
  }
  if (!g?.materials?.length || !g?.images?.length) warnings.push("Character textures/materials not verifiable: compare all 360° angles to approved original boy/girl imagery.");
  if (metadata.fileBytes > (spec?.deliverable?.limitMB || 20) * 1048576) fail("GLB exceeds configured size limit.");
  if (metadata.hasBin === false) fail("Missing GLB binary geometry chunk.");
  if (profile === "girl") warnings.push("Girl-specific fiqh and original pink hijab/dress pose and clothing review required before reuse.");
  warnings.push("Manual QA REQUIRED: same character identity, unchanged leg lengths and no deformed face/cloth.");
  warnings.push("Manual QA REQUIRED: Ruku straight level back; forehead + light nose Sujud contact; lips/chin clear.");
  warnings.push("Manual QA REQUIRED: Takbir hands shoulder-high (not ears), Qiyam hands on chest; test on real iPhone.");
  return {structureValid:errors.length===0,productionApproved:false,errors,warnings,vertices,skinJoints:joints.length,clipNames:[...clips.keys()]};
}

function main(args) {
  if (args.length < 1 || args.length > 2) {
    process.stderr.write("Usage: node validate-glb.cjs <character.glb> [boy|girl]\n");
    return 2;
  }
  const [file, profile = "boy"] = args;
  if (path.extname(file).toLowerCase() !== ".glb") {
    process.stderr.write("Rejected: only binary .glb can be structurally validated.\n");
    return 2;
  }
  try {
    const blob = fs.readFileSync(file);
    const {gltf, hasBin} = parseGLB(blob);
    const spec = JSON.parse(fs.readFileSync(path.join(__dirname,"rig-acceptance-v1.json"),"utf8"));
    const result = validateDocument(gltf, spec, profile, {fileBytes:blob.length,hasBin});
    process.stdout.write(JSON.stringify(result,null,2)+"\n");
    return result.structureValid ? 0 : 1;
  } catch (err) {
    process.stderr.write("GLB rejected: "+err.message+"\n");
    return 1;
  }
}
module.exports = {parseGLB,validateDocument,main};
if (require.main === module) process.exitCode = main(process.argv.slice(2));
