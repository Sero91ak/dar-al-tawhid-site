#!/usr/bin/env node
"use strict";
/**
 * Verify that each inverseBindMatrices[i] is actually the inverse of the
 * corresponding joint's *global unanimated rest* transform. This is separate
 * from (i) affine/unit-length IBM plausibility and (ii) animated bone lengths.
 *
 * This draft-specific character policy supports only rigid TRS ancestors.
 * It deliberately refuses matrices, nonunit scales, sparse/strided out-of-bounds
 * accessors, missing IBM data and ambiguous parent chains. No artistic or
 * religious approval can follow from passing this mathematical check.
 */
const THRESHOLD=0.005;
function norm(q){
 const m=Math.hypot(...q);
 if(!Number.isFinite(m)||Math.abs(m-1)>0.001)throw Error("Invalid rest-pose quaternion");
 return q.map(v=>v/m);
}
function mul(a,b){
 return [
   a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],
   a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],
   a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],
   a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]
 ];
}
function rotate(q,v){
 const [x,y,z,w]=q;
 const t=[2*(y*v[2]-z*v[1]),2*(z*v[0]-x*v[2]),2*(x*v[1]-y*v[0])];
 return [
  v[0]+w*t[0]+y*t[2]-z*t[1],
  v[1]+w*t[1]+z*t[0]-x*t[2],
  v[2]+w*t[2]+x*t[1]-y*t[0]
 ];
}
function rigidInverseMatrix(q,p){
 const qi=[-q[0],-q[1],-q[2],q[3]];
 const [x,y,z,w]=qi, t=rotate(qi,p.map(v=>-v));
 return [
  1-2*(y*y+z*z), 2*(x*y+w*z), 2*(x*z-w*y), 0,
  2*(x*y-w*z), 1-2*(x*x+z*z), 2*(y*z+w*x), 0,
  2*(x*z+w*y), 2*(y*z-w*x), 1-2*(x*x+y*y), 0,
  ...t, 1
 ];
}
function validateInverseBindPose(g,bin,{tolerance=THRESHOLD}={}){
 const blocked=reason=>({valid:false,errors:[reason],productionApproved:false,
  inverseBindMatchesRestPose:false});
 if(!Buffer.isBuffer(bin)||!Array.isArray(g?.nodes)||!Array.isArray(g?.skins)||
    !g.skins.length)return blocked("Actual GLB BIN and skinning hierarchy required.");
 if(!Number.isFinite(tolerance)||tolerance<0||tolerance>THRESHOLD)
   return blocked("Unsafe inverse-bind tolerance");
 try{
  const nodes=g.nodes,parents=new Map();
  for(let i=0;i<nodes.length;i++){
   const n=nodes[i];
   if(!n||typeof n!=="object")throw Error("Malformed skeleton node");
   if(n.children!==undefined&&!Array.isArray(n.children))throw Error("Invalid skeleton children list");
   for(const child of n.children||[]){
    if(!Number.isInteger(child)||!nodes[child]||parents.has(child))throw Error("Invalid/multiply parented skeletal node");
    parents.set(child,i);
   }
  }
  const world=new Map(),evaluating=new Set();
  function globalRest(i){
   if(world.has(i))return world.get(i);
   if(evaluating.has(i))throw Error("Cyclic rest-pose node graph");
   evaluating.add(i);
   const n=nodes[i];
   if(n.matrix!==undefined)throw Error("Unreviewed matrix-based rest-pose skeleton transform");
   const q=norm(n.rotation??[0,0,0,1]);
   const t=n.translation??[0,0,0],s=n.scale??[1,1,1];
   if(!Array.isArray(t)||t.length!==3||t.some(x=>!Number.isFinite(x))||
      !Array.isArray(s)||s.length!==3||s.some(x=>!Number.isFinite(x)||Math.abs(x-1)>1e-6))
     throw Error("Nonrigid or invalid rest-pose bone transform");
   let value={q,p:t};
   const parent=parents.get(i);
   if(parent!==undefined){
    const parentPose=globalRest(parent),r=rotate(parentPose.q,t);
    value={q:norm(mul(parentPose.q,q)),
      p:parentPose.p.map((x,j)=>x+r[j])};
   }
   evaluating.delete(i);world.set(i,value);return value;
  }
  const accessors=g.accessors||[],views=g.bufferViews||[];
  let matricesVerified=0,maxAbsError=0;
  for(const [skinId,skin] of g.skins.entries()){
   if(!Array.isArray(skin?.joints)||!skin.joints.length||
      new Set(skin.joints).size!==skin.joints.length)
     throw Error("Invalid or duplicated skin joint entries: "+skinId);
   const acc=accessors[skin.inverseBindMatrices];
   if(!acc||acc.type!=="MAT4"||acc.componentType!==5126||
      acc.sparse||!Number.isInteger(acc.bufferView)||acc.count!==skin.joints.length)
     throw Error("Missing/nonfloat/sparse inverse bind matrices: "+skinId);
   const view=views[acc.bufferView],off=view?.byteOffset??0,local=acc.byteOffset??0,
     stride=view?.byteStride??64,start=off+local;
   if(!view||view.buffer!==0||!Number.isSafeInteger(off)||off<0||
      !Number.isSafeInteger(local)||local<0||
      !Number.isSafeInteger(view.byteLength)||view.byteLength<64||
      !Number.isSafeInteger(stride)||stride<64||stride%4!==0||
      start%4!==0||off+view.byteLength>bin.length||
      start+(acc.count-1)*stride+64>off+view.byteLength)
     throw Error("Inverse bind matrix accessor out of GLB BIN bounds: "+skinId);
   for(const [j,index] of skin.joints.entries()){
    if(!Number.isInteger(index)||!nodes[index])throw Error("Nonexistent joint in skin "+skinId);
    const pose=globalRest(index),expected=rigidInverseMatrix(pose.q,pose.p);
    for(let k=0;k<16;k++){
     const actual=bin.readFloatLE(start+j*stride+k*4);
     if(!Number.isFinite(actual))throw Error("Nonfinite inverse bind payload: skin "+skinId);
     const error=Math.abs(actual-expected[k]);
     maxAbsError=Math.max(maxAbsError,error);
     if(error>tolerance)
      throw Error("Inverse bind differs from global rest pose: skin "+skinId+
       " joint "+(nodes[index].name||index)+" matrix["+k+"] delta "+error);
    }
    matricesVerified++;
   }
  }
  return {valid:true,errors:[],inverseBindMatchesRestPose:true,
   matricesVerified,maxAbsError,productionApproved:false,
   note:"Rigid skin inverse-bind consistency only; not a skin-mesh, visual identity, prayer-pose or device approval."};
 }catch(e){return blocked(e.message)}
}
module.exports={validateInverseBindPose,rigidInverseMatrix};
