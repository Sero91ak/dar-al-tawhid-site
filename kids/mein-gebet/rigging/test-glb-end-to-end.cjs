#!/usr/bin/env node
"use strict";
/**
 * Entire .glb bytes -> all independent gates -> expected blocked production.
 * Synthetic mesh is NOT original character art and NOT a prayer demonstration.
 * Generated in OS temporary directory; deleted after tests.
 */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const os=require("node:os");
const path=require("node:path");
const spec=require("./rig-acceptance-v1.json");
const {parseGLB,validateDocument,main:validateMain}=require("./validate-glb.cjs");
const {validateAnimationBytes}=require("./validate-glb-binary.cjs");
const {validateGeometryBytes}=require("./validate-glb-geometry-binary.cjs");
const {validatePoseBoneLengths}=require("./validate-pose-bone-lengths.cjs");
const {main:releaseMain}=require("./audit-project-completion.cjs");
const {main:forbidBoyMain}=require("./forbid-placeholder-release.cjs");
const N=2400;
function glbFixture(){
  const views=[],accessors=[],parts=[];let offset=0;
  function add(buf,type,componentType,count){
    const index=accessors.length;
    views.push({buffer:0,byteOffset:offset,byteLength:buf.length});
    const aligned=Buffer.alloc(Math.ceil(buf.length/4)*4);
    buf.copy(aligned);
    parts.push(aligned);offset+=aligned.length;
    accessors.push({bufferView:index,componentType,type,count});
    return index;
  }
  const bones=spec.rig.requiredBoneNames;
  const ibm=Buffer.alloc(bones.length*64);
  for(let j=0;j<bones.length;j++)
    for(const k of [0,5,10,15])ibm.writeFloatLE(1,j*64+k*4);
  const inverse=add(ibm,"MAT4",5126,bones.length);
  const xyz=Buffer.alloc(N*12),normals=Buffer.alloc(N*12),
    joints=Buffer.alloc(N*4),weights=Buffer.alloc(N*16),
    indices=Buffer.alloc(N*2);
  for(let i=0;i<N;i++){
    xyz.writeFloatLE((i%40)/40-.5,i*12);
    xyz.writeFloatLE(Math.floor(i/40)/40,i*12+4);
    xyz.writeFloatLE((i%17)/30-.25,i*12+8);
    normals.writeFloatLE(1,i*12+8);
    weights.writeFloatLE(1,i*16);
    indices.writeUInt16LE(i,i*2);
  }
  const position=add(xyz,"VEC3",5126,N);
  const normal=add(normals,"VEC3",5126,N);
  const joint=add(joints,"VEC4",5121,N);
  const weight=add(weights,"VEC4",5126,N);
  const indicesAccessor=add(indices,"SCALAR",5123,N);
  const times=Buffer.alloc(8),quaternions=Buffer.alloc(32);
  times.writeFloatLE(0,0);times.writeFloatLE(1,4);
  quaternions.writeFloatLE(1,12);quaternions.writeFloatLE(1,28);
  const timeAccessor=add(times,"SCALAR",5126,2);
  const rotationAccessor=add(quaternions,"VEC4",5126,2);
  const bin=Buffer.concat(parts);
  const nodes=bones.map(name=>({name}));
  const lookup=new Map(nodes.map((v,i)=>[v.name,i]));
  const edges={
    Hips:["Spine","UpperLeg.L","UpperLeg.R"],
    Spine:["Chest"],Chest:["Neck","UpperArm.L","UpperArm.R"],Neck:["Head"],
    "UpperArm.L":["LowerArm.L"],"LowerArm.L":["Hand.L"],
    "UpperArm.R":["LowerArm.R"],"LowerArm.R":["Hand.R"],
    "UpperLeg.L":["LowerLeg.L"],"LowerLeg.L":["Foot.L"],"Foot.L":["Toe.L"],
    "UpperLeg.R":["LowerLeg.R"],"LowerLeg.R":["Foot.R"],"Foot.R":["Toe.R"]
  };
  const parentOf=new Map();
  for(const [parent,childNames] of Object.entries(edges)){
    nodes[lookup.get(parent)].children=childNames.map(name=>lookup.get(name));
    for(const childName of childNames)parentOf.set(childName,parent);
  }
  // Explicit positive bone lengths: empty coincident bone nodes previously
  // permitted a vacuous pass in tests without proving actual proportions.
  const offsets={
    Hips:[0,.82,0],Spine:[0,.19,0],Chest:[0,.24,0],
    Neck:[0,.18,0],Head:[0,.13,0],
    "UpperArm.L":[-.20,.11,0],"LowerArm.L":[-.21,-.12,0],"Hand.L":[-.16,-.10,0],
    "UpperArm.R":[.20,.11,0],"LowerArm.R":[.21,-.12,0],"Hand.R":[.16,-.10,0],
    "UpperLeg.L":[-.15,-.17,0],"LowerLeg.L":[0,-.29,0],
    "Foot.L":[0,-.27,.07],"Toe.L":[0,-.04,.12],
    "UpperLeg.R":[.15,-.17,0],"LowerLeg.R":[0,-.29,0],
    "Foot.R":[0,-.27,.07],"Toe.R":[0,-.04,.12]
  };
  for(const [name,i] of lookup)nodes[i].translation=offsets[name];
  const absolute=new Map();
  function restPosition(name){
    if(absolute.has(name))return absolute.get(name);
    const local=offsets[name],parent=parentOf.get(name);
    const world=parent?local.map((x,j)=>x+restPosition(parent)[j]):local.slice();
    absolute.set(name,world);return world;
  }
  // Write matching glTF inverse bind translations (column-major).
  for(const [name,i] of lookup)
    for(let axis=0;axis<3;axis++)
      parts[0].writeFloatLE(-restPosition(name)[axis],i*64+(12+axis)*4);
  nodes.push({name:"Synthetic skinned test body; not original",mesh:0,skin:0});
  const animations=["Qiyam","Takbir"].map(name=>({name,
    channels:[{sampler:0,target:{node:0,path:"rotation"}}],
    samplers:[{input:timeAccessor,output:rotationAccessor,interpolation:"LINEAR"}]}));
  const g={
    asset:{version:"2.0",generator:"SYNTHETIC TEST FIXTURE, never user approved"},
    buffers:[{byteLength:bin.length}],bufferViews:views,accessors,nodes,
    skins:[{joints:bones.map((_,i)=>i),inverseBindMatrices:inverse}],
    meshes:[{primitives:[{mode:4,attributes:{POSITION:position,NORMAL:normal,
      JOINTS_0:joint,WEIGHTS_0:weight},indices:indicesAccessor}]}],
    animations,
  };
  return {g,bin,locations:{normalByte:views[normal].byteOffset,firstPositionByte:views[position].byteOffset,
    animationTimeByte:views[timeAccessor].byteOffset}};
}
function encodeGLB(g,bin){
  const jsonRaw=Buffer.from(JSON.stringify(g),"utf8");
  const json=Buffer.alloc(Math.ceil(jsonRaw.length/4)*4,0x20);
  jsonRaw.copy(json);
  const payload=Buffer.alloc(12+8+json.length+8+bin.length);
  payload.writeUInt32LE(0x46546c67,0);
  payload.writeUInt32LE(2,4);payload.writeUInt32LE(payload.length,8);
  payload.writeUInt32LE(json.length,12);payload.writeUInt32LE(0x4e4f534a,16);
  json.copy(payload,20);
  const binHeader=20+json.length;
  payload.writeUInt32LE(bin.length,binHeader);
  payload.writeUInt32LE(0x004e4942,binHeader+4);
  bin.copy(payload,binHeader+8);
  return payload;
}
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"kids-glb-e2e-"));
let successes=0;
const check=(title,fn)=>{fn();successes++;console.log("PASS "+title)};
function quietMain(fn,args){
  const stdout=process.stdout.write,stderr=process.stderr.write;
  const chunks=[];
  try{
    process.stdout.write=function(chunk){chunks.push(String(chunk));return true;};
    process.stderr.write=function(chunk){chunks.push(String(chunk));return true;};
    return {exit:fn(args),message:chunks.join("")};
  }finally{
    process.stdout.write=stdout;process.stderr.write=stderr;
  }
}
try{
  const {g,bin,locations}=glbFixture();
  const candidate=path.join(tmp,"synthetic-only-not-user-original.glb");
  const glb=encodeGLB(g,bin);
  fs.writeFileSync(candidate,glb);
  check("whole GLB payload is parseable",()=>{
    const r=parseGLB(fs.readFileSync(candidate));
    assert.equal(r.gltf.asset.version,"2.0");assert.equal(r.bin.length,bin.length);
  });
  check("all three independent structural/BIN gates accept valid synthetic data",()=>{
    const parsed=parseGLB(fs.readFileSync(candidate));
    assert.equal(validateDocument(parsed.gltf,spec,"boy",{fileBytes:glb.length,hasBin:true}).structureValid,true);
    assert.equal(validateAnimationBytes(parsed.gltf,parsed.bin).valid,true);
    const report=validateGeometryBytes(parsed.gltf,parsed.bin);
    assert.equal(report.valid,true,JSON.stringify(report.errors));
    assert.equal(report.referencedVertices,N);
    assert.equal(report.productionApproved,false);
    const pose=validatePoseBoneLengths(parsed.gltf,parsed.bin);
    assert.equal(pose.valid,true,JSON.stringify(pose.errors));
    assert.equal(pose.measuredSegments,18);
  });
  check("full CLI structural preflight accepts test fixture but does not approve original likeness",()=>{
    const r=quietMain(validateMain,[candidate,"boy"]);
    assert.equal(r.exit,0,r.message);
    assert.equal(JSON.parse(r.message).productionApproved,false);
  });
  check("full release audit rejects even a valid synthetic GLB",()=>{
    const r=quietMain(releaseMain,["--require-ready","--boy-glb="+candidate,"--girl-glb="+candidate]);
    assert.equal(r.exit,1,r.message);
    const status=JSON.parse(r.message);
    assert.equal(status.ready,false);
    assert.equal(status.localBinaryEvidence.pass,false);
  });
  check("boy-model identity lock rejects an otherwise structurally valid artificial GLB",()=>{
    const r=quietMain(forbidBoyMain,[candidate]);
    assert.equal(r.exit,1,r.message);
    const identity=JSON.parse(r.message);
    assert.equal(identity.readyForProduction,false);
    assert.ok(identity.errors.some(e=>e.includes("BLOCKED")));
  });
  check("one corrupted mesh normal is blocked by real GLB CLI",()=>{
    const copy=Buffer.from(bin);
    copy.writeFloatLE(NaN,locations.normalByte+8);
    const file=path.join(tmp,"corrupt-normals.glb");
    fs.writeFileSync(file,encodeGLB(g,copy));
    const r=quietMain(validateMain,[file,"boy"]);
    assert.equal(r.exit,1,r.message);
    assert.ok(JSON.parse(r.message).errors.some(e=>e.includes("Nonfinite")));
  });
  check("one corrupted keyframe timestamp is blocked by real GLB CLI",()=>{
    const copy=Buffer.from(bin);copy.writeFloatLE(NaN,locations.animationTimeByte+4);
    const file=path.join(tmp,"corrupt-keyframes.glb");
    fs.writeFileSync(file,encodeGLB(g,copy));
    const r=quietMain(validateMain,[file,"boy"]);
    assert.equal(r.exit,1,r.message);
    assert.ok(JSON.parse(r.message).errors.some(e=>e.includes("NaN/Infinity")));
  });
  check("inflated vertex count with 1 reused triangle is blocked",()=>{
    const fake=JSON.parse(JSON.stringify(g));
    const id=fake.meshes[0].primitives[0].indices;
    fake.accessors[id].count=3;
    const file=path.join(tmp,"unreferenced-vertices.glb");
    fs.writeFileSync(file,encodeGLB(fake,bin));
    const r=quietMain(validateMain,[file,"boy"]);
    assert.equal(r.exit,1,r.message);
    assert.ok(JSON.parse(r.message).errors.some(e=>e.includes("Too few actually referenced")));
  });
  check("nonuniform static limb scaling is blocked end-to-end",()=>{
    const fake=JSON.parse(JSON.stringify(g));
    fake.nodes[5].scale=[1,1.4,1];
    const file=path.join(tmp,"stretched-limb.glb");
    fs.writeFileSync(file,encodeGLB(fake,bin));
    const r=quietMain(validateMain,[file,"boy"]);
    assert.equal(r.exit,1,r.message);
    assert.ok(JSON.parse(r.message).errors.some(e=>e.includes("Static skeletal scaling")));
  });
  check("collapsing a real child bone is rejected by numeric pose preflight",()=>{
    const fake=JSON.parse(JSON.stringify(g));
    fake.nodes[2].translation=[0,0,0]; // Chest rest segment vanishes
    const file=path.join(tmp,"collapsed-chest-bone.glb");
    fs.writeFileSync(file,encodeGLB(fake,bin));
    const r=quietMain(validateMain,[file,"boy"]);
    assert.equal(r.exit,1,r.message);
    const report=JSON.parse(r.message);
    assert.equal(report.boneLengthInvariantVerified,false);
    assert.ok(report.errors.some(e=>e.includes("Zero-length/degenerate")),r.message);
  });
  check("structurally valid GLB exposes numeric segment evidence",()=>{
    const r=quietMain(validateMain,[candidate,"boy"]);
    const report=JSON.parse(r.message);
    assert.equal(r.exit,0,r.message);
    assert.equal(report.boneLengthInvariantVerified,true);
    assert.equal(report.numericBoneEvidence.segments,18);
    assert.ok(report.numericBoneEvidence.sampledFrames>=6);
  });
  check("intact vertices and animation bytes cannot rescue a disconnected skeleton",()=>{
    const fake=JSON.parse(JSON.stringify(g));
    fake.nodes[3].children=[];
    const file=path.join(tmp,"detached-head.glb");
    fs.writeFileSync(file,encodeGLB(fake,bin));
    const r=quietMain(validateMain,[file,"boy"]);
    assert.equal(r.exit,1,r.message);
    assert.ok(JSON.parse(r.message).errors.some(e=>e.includes("Disconnected skin bone")));
  });
}finally{
  fs.rmSync(tmp,{recursive:true,force:true});
}
console.log(successes+" native GLB end-to-end file tests passed. NO original model, likeness or prayer pose approved.");
