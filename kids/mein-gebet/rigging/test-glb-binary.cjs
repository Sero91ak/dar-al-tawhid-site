#!/usr/bin/env node
"use strict";
/* Binary-sampler unit tests use real Buffers, not a synthetic GLB approval. */
const assert=require("node:assert/strict");
const {validateAnimationBytes}=require("./validate-glb-binary.cjs");
function fixture(){
  const bin=Buffer.alloc(40);
  bin.writeFloatLE(0,0);
  bin.writeFloatLE(1,4);
  bin.writeFloatLE(1,20);
  bin.writeFloatLE(Math.SQRT1_2,32);
  bin.writeFloatLE(Math.SQRT1_2,36);
  const gltf={
    buffers:[{byteLength:40}],
    bufferViews:[{buffer:0,byteOffset:0,byteLength:8},
      {buffer:0,byteOffset:8,byteLength:32}],
    accessors:[{bufferView:0,componentType:5126,type:"SCALAR",count:2},
      {bufferView:1,componentType:5126,type:"VEC4",count:2}],
    nodes:[{name:"Hips"}],
    animations:["Qiyam","Takbir"].map(name=>({
      name,channels:[{sampler:0,target:{node:0,path:"rotation"}}],
      samplers:[{input:0,output:1,interpolation:"LINEAR"}]
    })),
  };
  return {gltf,bin};
}
let pass=0;
const check=(label,fn)=>{fn();pass++;console.log("PASS "+label)};
const blocked=(mutate,fragment)=>{
  const {gltf,bin}=fixture();
  mutate(gltf,bin);
  const result=validateAnimationBytes(gltf,bin);
  assert.equal(result.valid,false);
  assert.ok(result.errors.some(s=>s.includes(fragment)),JSON.stringify(result.errors));
};
check("valid synthetic quaternion and monotonic times",()=>{
  const {gltf,bin}=fixture();const r=validateAnimationBytes(gltf,bin);
  assert.equal(r.valid,true);assert.equal(r.productionApproved,false);
});
check("missing BIN bytes fail closed",()=>{const {gltf}=fixture();assert.equal(validateAnimationBytes(gltf,null).valid,false)});
check("no buffer declaration fails",()=>blocked(g=>{g.buffers=[]},"declaration mismatch"));
check("binary size discrepancy fails",()=>blocked(g=>{g.buffers[0].byteLength=80},"declaration mismatch"));
check("missing animation sampler fails",()=>blocked(g=>{g.animations[0].samplers=[]},"channels/samplers"));
check("missing sampler keyframes fails",()=>blocked(g=>{g.animations[0].samplers[0].input=99},"float accessor"));
check("nonmonotonic timestamps fail",()=>blocked((g,b)=>{b.writeFloatLE(0,4)},"Nonmonotonic"));
check("negative time fails",()=>blocked((g,b)=>{b.writeFloatLE(-1,0)},"negative"));
check("NaN in output fails",()=>blocked((g,b)=>{b.writeFloatLE(NaN,8)},"NaN/Infinity"));
check("nonunit quaternion fails",()=>blocked((g,b)=>{b.writeFloatLE(.4,20)},"quaternion norm"));
check("accessor over-read fails",()=>blocked(g=>{g.accessors[1].count=3},"out of bounds"));
check("sparse sampler accessor fails",()=>blocked(g=>{g.accessors[1].sparse={count:1}},"float accessor"));
check("unreviewed spline interpolation fails",()=>blocked(g=>{g.animations[0].samplers[0].interpolation="CUBICSPLINE"},"interpolation"));
check("duplicate targeted channel fails",()=>blocked(g=>{g.animations[0].channels.push({...g.animations[0].channels[0]})},"Duplicate"));
check("missing node target fails",()=>blocked(g=>{g.animations[1].channels[0].target.node=20},"target node"));
check("invalid output component type fails",()=>blocked(g=>{g.accessors[1].componentType=5123},"float accessor"));
check("time/output frame count mismatch fails",()=>blocked(g=>{g.accessors[0].count=1},"lengths mismatch"));
check("translation needs VEC3 instead of rotation VEC4",()=>blocked(g=>{g.animations[0].channels[0].target.path="translation"},"float accessor"));
check("wrong stride fails",()=>blocked(g=>{g.bufferViews[1].byteStride=8},"out of bounds"));
check("improper byte offset fails",()=>blocked(g=>{g.accessors[1].byteOffset=2},"misaligned"));
console.log(pass+" GLB binary sampler tests PASS. No original visual/prayer approval.");
