#!/usr/bin/env node
"use strict";
/* V7.7 -> future-scult regression fence. No release, no visual approval. */
const fs=require("node:fs");
const crypto=require("node:crypto");
const {parseGLB}=require("./validate-glb.cjs");
const BASELINE_SHA="353b028862f91922d6288cf6ede09d5c8150815657c66c9c116b7775311c07fa";
const SIZES={5120:1,5121:1,5122:2,5123:2,5124:4,5125:4,5126:4};
const ARITY={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16};
const digest=bytes=>crypto.createHash("sha256").update(bytes).digest("hex");
function normalized(value){
  if(Array.isArray(value))return value.map(normalized);
  if(value&&typeof value==="object"){
    const out={};for(const k of Object.keys(value).sort())out[k]=normalized(value[k]);
    return out;
  }
  return value;
}
function stableHash(value){return digest(Buffer.from(JSON.stringify(normalized(value))))}
function accessorPayload(g,bin,id){
  const a=g?.accessors?.[id];
  if(!a||!Number.isSafeInteger(a.count)||a.count<=0||
     !Number.isInteger(a.bufferView)||a.sparse||!SIZES[a.componentType]||!ARITY[a.type])
    throw Error("Missing, invalid, or sparse accessor: "+id);
  const v=g?.bufferViews?.[a.bufferView];
  if(!v||v.buffer!==0)throw Error("Accessor requires single GLB BIN buffer: "+id);
  const element=SIZES[a.componentType]*ARITY[a.type];
  const stride=v.byteStride??element;
  const offset=(v.byteOffset??0)+(a.byteOffset??0);
  const viewStart=v.byteOffset??0;
  const viewEnd=viewStart+v.byteLength;
  if(!Number.isSafeInteger(stride)||stride<element||!Number.isSafeInteger(offset)||
     offset<viewStart||!Number.isSafeInteger(v.byteLength)||v.byteLength<1||
     viewEnd>bin.length||offset+stride*(a.count-1)+element>viewEnd)
    throw Error("Accessor out of BIN/view bounds: "+id);
  const chunks=[];
  for(let i=0;i<a.count;i++){
    const p=offset+i*stride;
    chunks.push(bin.subarray(p,p+element));
  }
  return {
    metadata:{componentType:a.componentType,type:a.type,count:a.count,normalized:a.normalized===true},
    sha256:digest(Buffer.concat(chunks)),
  };
}
function snapshot(g,bin){
  if(!Buffer.isBuffer(bin)||!Array.isArray(g?.animations)||!Array.isArray(g?.skins))
    throw Error("Real glTF animations, skins, BIN required.");
  const clips=new Set(g.animations.map(a=>a.name));
  if(!clips.has("Qiyam")||!clips.has("Takbir"))throw Error("Frozen prayer clips missing.");
  const skinJoints=new Set(g.skins.flatMap(s=>s.joints||[]));
  const rig={
    skins:g.skins.map(s=>({joints:s.joints,skeleton:s.skeleton??null,
      inverseBindMatrices:s.inverseBindMatrices===undefined?null:accessorPayload(g,bin,s.inverseBindMatrices)})),
    joints:[...skinJoints].sort((a,b)=>a-b).map(i=>{
      const n=g.nodes?.[i];if(!n)throw Error("Missing rig node: "+i);
      return {index:i,name:n.name,children:n.children||[],translation:n.translation||[0,0,0],
        rotation:n.rotation||[0,0,0,1],scale:n.scale||[1,1,1],matrix:n.matrix??null};
    }),
  };
  const channels=g.animations.map(a=>({
    name:a.name,
    channels:a.channels,
    samplers:a.samplers?.map(s=>({
      interpolation:s.interpolation??"LINEAR",
      input:accessorPayload(g,bin,s.input),
      output:accessorPayload(g,bin,s.output),
    })),
  }));
  const skinning=[];
  for(const [mi,m] of (g.meshes||[]).entries()){
    for(const [pi,p] of (m.primitives||[]).entries()){
      const attr=p.attributes||{};
      if(attr.JOINTS_0===undefined||attr.WEIGHTS_0===undefined)
        throw Error("Missing skinned primitive weights at "+mi+":"+pi);
      skinning.push({mesh:mi,primitive:pi,joints:accessorPayload(g,bin,attr.JOINTS_0),
        weights:accessorPayload(g,bin,attr.WEIGHTS_0)});
    }
  }
  if(!skinning.length)throw Error("No skinned primitives.");
  return {rigSha256:stableHash(rig),animationSha256:stableHash(channels),
    skinningSha256:stableHash(skinning),clipNames:[...clips].sort(),
    actualOriginalLikenessApproved:false,productionApproved:false};
}
function unpack(filename){
  const raw=fs.readFileSync(filename),parsed=parseGLB(raw);
  if(!parsed.hasBin)throw Error("No GLB BIN chunk.");
  let off=12,bin=null;
  while(off+8<=raw.length){
    const size=raw.readUInt32LE(off),type=raw.readUInt32LE(off+4);
    off+=8;if(off+size>raw.length)throw Error("Chunk beyond GLB bounds.");
    if(type===0x004e4942){if(bin)throw Error("Multiple BIN chunks.");bin=raw.subarray(off,off+size);}
    off+=size;
  }
  if(!bin)throw Error("Real BIN missing.");
  return {raw,g:parsed.gltf,bin};
}
function compareFiles(original,candidate){
  const old=unpack(original),next=unpack(candidate);
  if(digest(old.raw)!==BASELINE_SHA)throw Error("Wrong frozen V7.7 baseline SHA-256.");
  if(digest(old.raw)===digest(next.raw))throw Error("Candidate must be a new geometry revision.");
  const before=snapshot(old.g,old.bin),after=snapshot(next.g,next.bin);
  const fields=["rigSha256","animationSha256","skinningSha256"];
  const changed=fields.filter(k=>before[k]!==after[k]);
  return {preserved:changed.length===0,changed,baselineSha256:BASELINE_SHA,
    candidateSha256:digest(next.raw),clips:before.clipNames,
    originalCharacterLikenessApproved:false,productionApproved:false,
    note:"Immutable rig/skin/animation payloads check only; does not certify visual likeness or correct prayer motions."};
}
function main(args){
  if(args.length!==2){process.stderr.write("Usage: node verify-animation-rig-freeze.cjs V77.glb candidate.glb\n");return 2;}
  try{const r=compareFiles(args[0],args[1]);process.stdout.write(JSON.stringify(r,null,2)+"\n");return r.preserved?0:1;}
  catch(e){process.stderr.write("FROZEN-RIG QA BLOCKED: "+e.message+"\n");return 1;}
}
module.exports={snapshot,accessorPayload,compareFiles,main};
if(require.main===module)process.exitCode=main(process.argv.slice(2));
