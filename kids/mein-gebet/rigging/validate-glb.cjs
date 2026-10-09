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
const {validateAnimationBytes} = require("./validate-glb-binary.cjs");
const {validateGeometryBytes} = require("./validate-glb-geometry-binary.cjs");
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
  let bin = null;
  while (offset + 8 <= buffer.length) {
    const size = buffer.readUInt32LE(offset);
    const type = buffer.readUInt32LE(offset + 4);
    offset += 8;
    if (size > buffer.length - offset) throw Error("GLB chunk exceeds file length.");
    if (type === GLB_JSON) {
      if (json !== null) throw Error("Multiple JSON chunks.");
      json = JSON.parse(buffer.subarray(offset, offset + size).toString("utf8").trim());
    } else if (type === 0x004e4942) {
      if (hasBin) throw Error("Multiple GLB BIN chunks.");
      hasBin = true;
      bin = buffer.subarray(offset, offset + size);
    }
    offset += size;
  }
  if (offset !== buffer.length || !json) throw Error("GLB missing or malformed JSON chunk.");
  return { gltf: json, hasBin, bin };
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
  // A translation on a child joint changes its effective bone length without
  // any scale channel. Collect joints across ALL skins, not only skins[0].
  const skinnedJointNodes = new Set(skins.flatMap(s => Array.isArray(s.joints) ? s.joints : []));
  const parentByNode = new Map();
  for (const [parent, node] of nodes.entries()) {
    for (const child of node?.children || []) {
      if (!Number.isInteger(child) || !nodes[child]) { fail("Invalid scene-node child reference."); continue; }
      if (parentByNode.has(child)) { fail("Scene node has multiple parents."); continue; }
      parentByNode.set(child, parent);
    }
  }
  const hasSkinnedAncestor = index => {
    const visited = new Set([index]);
    let ancestor = parentByNode.get(index);
    while (ancestor !== undefined) {
      if (visited.has(ancestor)) { fail("Cyclic skeletal node hierarchy."); return true; }
      if (skinnedJointNodes.has(ancestor)) return true;
      visited.add(ancestor);
      ancestor = parentByNode.get(ancestor);
    }
    return false;
  };
  // Non-joint helper nodes BETWEEN joints can also stretch an arm/leg.
  const skeletalAncestors = new Set();
  for (const joint of skinnedJointNodes) {
    const visited = new Set([joint]);
    let ancestor = parentByNode.get(joint);
    while (ancestor !== undefined) {
      if (visited.has(ancestor)) { fail("Cyclic skeletal node hierarchy."); break; }
      skeletalAncestors.add(ancestor);
      visited.add(ancestor);
      ancestor = parentByNode.get(ancestor);
    }
  }
  // Bind pose must not contain hidden local limb-stretch or matrix/shear.
  // This is a structural prefilter; actual skinned bone lengths still need
  // numeric frame-by-frame verification and human review.
  for (const [skinIndex, member] of skins.entries()) {
    const bones = member?.joints;
    if (!Array.isArray(bones) || !bones.length || new Set(bones).size !== bones.length)
      fail("Skin has empty or duplicated joint indices: " + skinIndex);
    for (const index of bones || [])
      if (!Number.isInteger(index) || index < 0 || !nodes[index])
        fail("Skin references nonexistent joint: " + skinIndex + "/" + index);
    const bindIndex = member?.inverseBindMatrices;
    const bindAcc = accessors[bindIndex];
    if (!Number.isInteger(bindIndex) || !bindAcc || bindAcc.type !== "MAT4" ||
        bindAcc.componentType !== 5126 || bindAcc.count !== bones?.length)
      fail("Invalid inverseBindMatrices for skin: " + skinIndex);
  }
  for (const index of new Set([...skinnedJointNodes, ...skeletalAncestors])) {
    const n = nodes[index];
    if (!n) continue;
    if (n.matrix !== undefined)
      fail("Matrix-based skeletal transform cannot be proven stretch-free: " + (n.name || index));
    if (n.scale !== undefined &&
        (!Array.isArray(n.scale) || n.scale.length !== 3 ||
         n.scale.some(c => typeof c !== "number" || !Number.isFinite(c) || Math.abs(c - 1) > 1e-6)))
      fail("Static skeletal scaling changes bone proportions: " + (n.name || index));
    if (n.translation !== undefined &&
        (!Array.isArray(n.translation) || n.translation.length !== 3 ||
         n.translation.some(c => typeof c !== "number" || !Number.isFinite(c))))
      fail("Nonfinite skeletal translation: " + (n.name || index));
    if (n.rotation !== undefined &&
        (!Array.isArray(n.rotation) || n.rotation.length !== 4 ||
         n.rotation.some(c => typeof c !== "number" || !Number.isFinite(c)) ||
         Math.abs(Math.hypot(...n.rotation) - 1) > 0.001))
      fail("Invalid static skeletal quaternion: " + (n.name || index));
  }
  const rootName = spec?.rig?.rootBone;
  const rootJointIndices = [...skinnedJointNodes].filter(i => nodes[i]?.name === rootName);
  if (!rootName || rootJointIndices.length !== 1) fail("Missing or ambiguous skeleton root joint.");
  if (!skins.length) fail("No skin. A 2D billboard / unrigged model cannot be used as an animated prayer character.");
  if (!meshes.length) fail("No real mesh geometry.");
  if (!nodes.length) fail("No GLB scene nodes.");
  const skin = skins[0] || {};
  const joints = Array.isArray(skin.joints) ? skin.joints : [];
  const jointNames=joints.map(i=>nodes[i]?.name);
  const boneSet = new Set(jointNames.filter(Boolean));
  if(jointNames.some(name=>typeof name!=="string"||!name.trim()) ||
     boneSet.size!==jointNames.length)
    fail("Missing or duplicate joint names in primary skin.");
  for (const name of required) if (!boneSet.has(name)) fail("Missing required rig bone: " + name);
  // A named list alone does NOT make a skeleton: every primary skin bone must
  // reach the actual Hips root via a valid, non-cyclic node parent chain.
  if(rootJointIndices.length===1) {
    const root=rootJointIndices[0];
    if(!joints.includes(root))fail("Primary skin does not include the Hips root.");
    for(const joint of joints){
      if(!Number.isInteger(joint)||!nodes[joint])continue;
      let cursor=joint,seen=new Set(),connected=false;
      while(cursor!==undefined&&!seen.has(cursor)){
        if(cursor===root){connected=true;break;}
        seen.add(cursor);cursor=parentByNode.get(cursor);
      }
      if(!connected)fail("Disconnected skin bone without Hips ancestor: "+(nodes[joint].name||joint));
    }
  }
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
      if (!["translation", "rotation"].includes(ch.target?.path)) fail("Unsupported animation channel: " + String(ch.target?.path));
      if (!Number.isInteger(ch.target?.node) || !nodes[ch.target.node]) fail("Animation references invalid joint/node.");
      if (ch.target?.path === "translation" && Number.isInteger(ch.target?.node) && nodes[ch.target.node]) {
        const target = ch.target.node;
        if (skinnedJointNodes.has(target) &&
            (target !== rootJointIndices[0] || hasSkinnedAncestor(target))) {
          fail("Forbidden non-root skinned joint translation (limb stretch risk): " + a.name + " / " + (nodes[target].name || target));
        }
        if (!skinnedJointNodes.has(target) && skeletalAncestors.has(target) && hasSkinnedAncestor(target)) {
          fail("Forbidden translation of intermediary skeletal helper node: " + a.name);
        }
      }
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
    const {gltf, hasBin, bin} = parseGLB(blob);
    const spec = JSON.parse(fs.readFileSync(path.join(__dirname,"rig-acceptance-v1.json"),"utf8"));
    const result = validateDocument(gltf, spec, profile, {fileBytes:blob.length,hasBin});
    const binary = validateAnimationBytes(gltf, bin);
    if (!binary.valid) {
      result.errors.push(...binary.errors);
      result.structureValid = false;
    }
    result.animationSamplerBytesVerified = binary.valid;
    const geometry = validateGeometryBytes(gltf, bin);
    if (!geometry.valid) {
      result.errors.push(...geometry.errors);
      result.structureValid = false;
    }
    result.geometryVertexBytesVerified = geometry.valid;
    result.binaryGeometry = {vertices:geometry.vertices || 0,triangles:geometry.triangles || 0};
    result.productionApproved = false;
    process.stdout.write(JSON.stringify(result,null,2)+"\n");
    return result.structureValid ? 0 : 1;
  } catch (err) {
    process.stderr.write("GLB rejected: "+err.message+"\n");
    return 1;
  }
}
module.exports = {parseGLB,validateDocument,main};
if (require.main === module) process.exitCode = main(process.argv.slice(2));
