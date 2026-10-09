#!/usr/bin/env node
"use strict";
/* Native Node Buffer regression tests; artificial rig, no approved prayer pose. */
const assert=require("node:assert/strict");
const {validatePoseBoneLengths}=require("./validate-pose-bone-lengths.cjs");
function fixture(){
 const b=Buffer.alloc(8+32+24);
 // sampled times t=0, t=1
 b.writeFloatLE(0,0);b.writeFloatLE(1,4);
 // unit quaternions identity -> 90deg Z
 b.writeFloatLE(1,8+12);
 b.writeFloatLE(Math.SQRT1_2,8+16+8);
 b.writeFloatLE(Math.SQRT1_2,8+16+12);
 // translation root 0 -> vertical +1
 b.writeFloatLE(0,40);b.writeFloatLE(0,44);b.writeFloatLE(0,48);
 b.writeFloatLE(0,52);b.writeFloatLE(1,56);b.writeFloatLE(0,60);
 const g={
  nodes:[
   {name:"Hips",translation:[0,0,0],children:[1]},
   {name:"UpperArm.L",translation:[0,1,0],children:[2]},
   {name:"Hand.L",translation:[1,0,0]}
  ],
  skins:[{joints:[0,1,2]}],
  buffers:[{byteLength:b.length}],
  bufferViews:[{buffer:0,byteOffset:0,byteLength:8},
   {buffer:0,byteOffset:8,byteLength:32},
   {buffer:0,byteOffset:40,byteLength:24}],
  accessors:[
   {bufferView:0,componentType:5126,type:"SCALAR",count:2},
   {bufferView:1,componentType:5126,type:"VEC4",count:2},
   {bufferView:2,componentType:5126,type:"VEC3",count:2}
  ],
  animations:["Qiyam","Takbir"].map(name=>({name,
   channels:[{sampler:0,target:{node:1,path:"rotation"}}],
   samplers:[{input:0,output:1,interpolation:"LINEAR"}]
  }))
 };
 return {g,b};
}
let passed=0;function check(label,fn){fn();passed++;console.log("PASS "+label);}
const result=(edit)=>{const {g,b}=fixture();edit?.(g,b);return validatePoseBoneLengths(g,b);};
const blocked=(label,edit,fragment)=>check(label,()=>{
 const out=result(edit);assert.equal(out.valid,false,JSON.stringify(out));
 assert.ok(out.errors.some(s=>s.includes(fragment)),JSON.stringify(out.errors));
});
check("real-buffer forward-kinematic segment distances remain constant under 90-degree arm rotation",()=>{
 const r=result();assert.equal(r.valid,true,JSON.stringify(r.errors));
 assert.equal(r.measuredSegments,2);assert.equal(r.sampledFrames,6);
 assert.ok(r.maxLengthDeltaMetres<1e-5);
 assert.equal(r.productionApproved,false);
});
check("external world motion of Hips does not change bone lengths",()=>{
 const r=result(g=>{
   g.animations[0].channels.push({sampler:1,target:{node:0,path:"translation"}});
   g.animations[0].samplers.push({input:0,output:2});
 });
 assert.equal(r.valid,true,JSON.stringify(r.errors));
});
check("STEP interpolation also preserves rigid parent limb lengths",()=>{
 const r=result(g=>g.animations[0].samplers[0].interpolation="STEP");
 assert.equal(r.valid,true,JSON.stringify(r.errors));
});
blocked("reject non-root hand translation even if not scaling",g=>{
 g.animations[0].channels.push({sampler:1,target:{node:2,path:"translation"}});
 g.animations[0].samplers.push({input:0,output:2});
},"non-root joint translation");
blocked("reject non-unit quaternion from corrupted frame",(_,b)=>b.writeFloatLE(2,8+12),"quaternion");
blocked("reject animated scale path",g=>g.animations[0].channels[0].target.path="scale","Unsupported animation target");
blocked("reject static skeletal scale",g=>g.nodes[1].scale=[1.2,1,1],"Static scale");
blocked("reject disconnected hand hierarchy",g=>g.nodes[1].children=[],"disconnected");
blocked("reject missing skin skeleton",g=>g.skins=[],"Missing unique Hips");
blocked("reject duplicate pose channels",g=>g.animations[0].channels.push({...g.animations[0].channels[0]}),"Duplicate animation targets");
blocked("reject out-of-BIN bufferView",g=>g.bufferViews[1].byteOffset=10000,"outside GLB BIN");
blocked("reject NaN animation data",(_,b)=>b.writeFloatLE(NaN,8+12),"Nonfinite");
blocked("reject corrupt timestamps",(_,b)=>b.writeFloatLE(-4,0),"Invalid animation frame times");
blocked("reject zero-length rest-bone offsets",g=>g.nodes[2].translation=[0,0,0],"Zero-length");
blocked("reject invalid skeleton matrix scaling",g=>g.nodes[1].matrix=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],"Unsupported skeletal matrix");
blocked("reject nonfinite node base pose translation",g=>g.nodes[1].translation=[NaN,1,0],"Invalid local bone translation");
blocked("reject invalid child references",g=>g.nodes[0].children=[9999],"Invalid/multiply");
blocked("reject multiple bone parents",g=>g.nodes[0].children=[1,2],"Invalid/multiply");
blocked("reject improper sampler frame accessor",g=>g.accessors[1].count=3,"outside GLB BIN");
check("reject missing raw BIN",()=>{const {g}=fixture();const r=validatePoseBoneLengths(g,null);assert.equal(r.valid,false);});
console.log(passed+" native numeric pose/bone-length checks passed. Not a religious/visual signoff.");
