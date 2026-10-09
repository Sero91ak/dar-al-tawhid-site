#!/usr/bin/env node
"use strict";
/* Pure synthetic tests of the V7.7 animation freeze contract. No real model. */
const assert=require("node:assert/strict");
const {snapshot,accessorPayload}=require("./verify-animation-rig-freeze.cjs");
function fixture(){
  const b=Buffer.alloc(144);
  for(let i=0;i<16;i++)b.writeFloatLE(i%5===0?1:0,i*4);
  b.writeFloatLE(0,64);b.writeFloatLE(1,68);
  b.writeFloatLE(1,84);b.writeFloatLE(1,100);
  b.writeFloatLE(1,104);b.writeUInt16LE(0,120);
  b.writeFloatLE(0.1,128);
  const sizes=[64,8,32,16,8,12],offsets=[0,64,72,104,120,128];
  const accessors=[
    {bufferView:0,type:"MAT4",componentType:5126,count:1},
    {bufferView:1,type:"SCALAR",componentType:5126,count:2},
    {bufferView:2,type:"VEC4",componentType:5126,count:2},
    {bufferView:3,type:"VEC4",componentType:5126,count:1},
    {bufferView:4,type:"VEC4",componentType:5123,count:1},
    {bufferView:5,type:"VEC3",componentType:5126,count:1},
  ];
  const gltf={
    nodes:[{name:"Hips",translation:[0,0,0],rotation:[0,0,0,1]}],
    skins:[{joints:[0],inverseBindMatrices:0}],
    meshes:[{primitives:[{attributes:{POSITION:5,JOINTS_0:4,WEIGHTS_0:3}}]}],
    animations:["Qiyam","Takbir"].map(name=>({name,
      samplers:[{input:1,output:2,interpolation:"LINEAR"}],
      channels:[{sampler:0,target:{node:0,path:"rotation"}}]})),
    accessors,
    bufferViews:sizes.map((byteLength,i)=>({buffer:0,byteOffset:offsets[i],byteLength})),
  };
  return [gltf,b];
}
let pass=0;
function test(name,fn){fn();pass++;console.log("PASS "+name);}
test("real snapshot requires both prayer clips",()=>{const [g,b]=fixture();assert.deepEqual(snapshot(g,b).clipNames,["Qiyam","Takbir"])});
test("snapshot never approves production",()=>{const [g,b]=fixture();const r=snapshot(g,b);assert.equal(r.productionApproved,false);assert.equal(r.actualOriginalLikenessApproved,false)});
test("mesh POSITION-only sculpt leaves rig/animation freeze unchanged",()=>{
 const [g,b]=fixture();const old=snapshot(g,b);b.writeFloatLE(0.3,128);const next=snapshot(g,b);
 assert.equal(old.rigSha256,next.rigSha256);assert.equal(old.animationSha256,next.animationSha256);assert.equal(old.skinningSha256,next.skinningSha256);
});
test("altered animation quaternion bytes detected",()=>{
 const [g,b]=fixture();const before=snapshot(g,b);b.writeFloatLE(0.2,88);assert.notEqual(before.animationSha256,snapshot(g,b).animationSha256);
});
test("different bind pose joint translation detected",()=>{
 const [g,b]=fixture();const before=snapshot(g,b);g.nodes[0].translation=[0,.1,0];assert.notEqual(before.rigSha256,snapshot(g,b).rigSha256);
});
test("modified inverse bind matrix bytes detected",()=>{
 const [g,b]=fixture();const before=snapshot(g,b);b.writeFloatLE(.5,0);assert.notEqual(before.rigSha256,snapshot(g,b).rigSha256);
});
test("changed skin vertex weights detected",()=>{
 const [g,b]=fixture();const before=snapshot(g,b);b.writeFloatLE(.75,104);assert.notEqual(before.skinningSha256,snapshot(g,b).skinningSha256);
});
test("changed vertex joint indices detected",()=>{
 const [g,b]=fixture();const before=snapshot(g,b);b.writeUInt16LE(1,120);assert.notEqual(before.skinningSha256,snapshot(g,b).skinningSha256);
});
test("missing Takbir is not ignored",()=>{
 const [g,b]=fixture();g.animations.pop();assert.throws(()=>snapshot(g,b),/Frozen prayer clips/);
});
test("nonexistent or oversized accessor rejected",()=>{
 const [g,b]=fixture();g.bufferViews[2].byteLength=12;
 assert.throws(()=>accessorPayload(g,b,2),/out of BIN/);
});
test("sparse accessors rejected until explicitly reviewed",()=>{
 const [g,b]=fixture();g.accessors[2].sparse={count:1};
 assert.throws(()=>accessorPayload(g,b,2),/sparse/);
});
test("no real BIN bytes cannot yield a passing freeze report",()=>{
 const [g]=fixture();assert.throws(()=>snapshot(g,null),/BIN required/);
});
console.log(pass+" V7.7 animation/rig freeze synthetic checks passed. NO model or animation approved.");
