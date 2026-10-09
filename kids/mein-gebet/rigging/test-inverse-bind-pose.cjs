#!/usr/bin/env node
"use strict";
/* Independently test actual glTF BIN inverse-bind/rest-pose relationship. */
const assert=require("node:assert/strict");
const {validateInverseBindPose,rigidInverseMatrix}=require("./validate-inverse-bind-pose.cjs");
function fixture(){
 const b=Buffer.alloc(64*3);
 const nodes=[
  {name:"Hips",translation:[1,2,3],children:[1]},
  {name:"UpperArm.L",translation:[0,1,0],children:[2]},
  {name:"Hand.L",translation:[1,0,0]}
 ];
 // World positions are 1,2,3 -> 1,3,3 -> 2,3,3.
 const worlds=[[1,2,3],[1,3,3],[2,3,3]];
 worlds.forEach((p,i)=>rigidInverseMatrix([0,0,0,1],p).forEach((x,k)=>b.writeFloatLE(x,i*64+k*4)));
 const g={
  nodes,skins:[{joints:[0,1,2],inverseBindMatrices:0}],
  bufferViews:[{buffer:0,byteOffset:0,byteLength:b.length}],
  accessors:[{bufferView:0,type:"MAT4",componentType:5126,count:3}]
 };
 return {g,b};
}
let passed=0;
const check=(label,fn)=>{fn();passed++;console.log("PASS "+label);};
const reject=(label,mutate,fragment)=>check(label,()=>{
 const {g,b}=fixture();mutate(g,b);
 const r=validateInverseBindPose(g,b);
 assert.equal(r.valid,false,JSON.stringify(r));
 assert.ok(r.errors.some(s=>s.includes(fragment)),JSON.stringify(r.errors));
});
check("rigid world-space bind matrices match all three joint rest transforms",()=>{
 const {g,b}=fixture(),r=validateInverseBindPose(g,b);
 assert.equal(r.valid,true,JSON.stringify(r.errors));
 assert.equal(r.matricesVerified,3);
 assert.equal(r.inverseBindMatchesRestPose,true);
 assert.equal(r.productionApproved,false);
});
check("nonidentity 90deg ancestor rotation and matching inverse-bind passes",()=>{
 const {g,b}=fixture();
 // Root at [1,2,3], child bone at [0,1,0] rotated by 90deg Z -> [-1,0,0]
 const s=Math.SQRT1_2;
 g.nodes[0].rotation=[0,0,s,s];
 const expected=[
  {q:[0,0,s,s],p:[1,2,3]},
  {q:[0,0,s,s],p:[0,2,3]},
  {q:[0,0,s,s],p:[0,3,3]}
 ];
 expected.forEach((v,i)=>rigidInverseMatrix(v.q,v.p).forEach((x,k)=>b.writeFloatLE(x,i*64+k*4)));
 const r=validateInverseBindPose(g,b);
 assert.equal(r.valid,true,JSON.stringify(r.errors));
});
reject("changed joint rest offset without IBM update rejected",g=>{
 g.nodes[1].translation=[0,1.2,0];
},"Inverse bind differs");
reject("modified IBM translation with unchanged rest pose rejected",(_,b)=>{
 b.writeFloatLE(11,64+12*4);
},"Inverse bind differs");
reject("rotated rest bone with stale inverse-bind rejected",g=>{
 g.nodes[0].rotation=[0,0,Math.SQRT1_2,Math.SQRT1_2];
},"Inverse bind differs");
reject("flipped/mirrored matrix rejected",(_,b)=>b.writeFloatLE(-1,0),"Inverse bind differs");
reject("NaN inverse bind value rejected",(_,b)=>b.writeFloatLE(NaN,5*4),"Nonfinite");
reject("missing inverse bind accessor rejected",g=>delete g.skins[0].inverseBindMatrices,"Missing/nonfloat");
reject("sparse inverse bind accessor rejected",g=>g.accessors[0].sparse={count:1},"Missing/nonfloat");
reject("incorrect matrix accessor count rejected",g=>g.accessors[0].count=2,"Missing/nonfloat");
reject("invalid binding buffer offset rejected",g=>g.bufferViews[0].byteOffset=7,"out of GLB BIN");
reject("nonuniform scale anywhere on skeleton rejected",g=>g.nodes[0].scale=[1,1.15,1],"Nonrigid");
reject("matrix transform on ancestor rejected",g=>g.nodes[0].matrix=Array(16).fill(0),"matrix-based");
reject("multiple hierarchy parents rejected",g=>g.nodes[0].children=[1,2],"multiply parented");
reject("skeleton cycle rejected",g=>g.nodes[2].children=[0],"Cyclic");
reject("nonfinite translation rejected",g=>g.nodes[0].translation=[Infinity,2,3],"Nonrigid");
reject("invalid rest quaternion rejected",g=>g.nodes[1].rotation=[0,0,0,0],"Invalid rest-pose");
check("missing real GLB BIN is not treated as success",()=>{
 const {g}=fixture();assert.equal(validateInverseBindPose(g,null).valid,false);
});
check("dangerously broad inverse-bind tolerance is rejected",()=>{
 const {g,b}=fixture();
 assert.equal(validateInverseBindPose(g,b,{tolerance:0.1}).valid,false);
});
console.log(passed+" native bind-rest-pose equality tests passed; no actual V7.7 file reviewed.");
