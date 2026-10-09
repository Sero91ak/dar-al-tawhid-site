#!/usr/bin/env node
"use strict";
/* Unit checks for draft-only GLB structure gate; creates NO production model. */
const assert = require("node:assert/strict");
const spec = require("./rig-acceptance-v1.json");
const { validateDocument,parseGLB } = require("./validate-glb.cjs");
function fixture(){
  const nodes=spec.rig.requiredBoneNames.map(name=>({name}));
  const index=new Map(nodes.map((node,i)=>[node.name,i]));
  const hierarchy={
    Hips:["Spine","UpperLeg.L","UpperLeg.R"],
    Spine:["Chest"],Chest:["Neck","UpperArm.L","UpperArm.R"],
    Neck:["Head"],
    "UpperArm.L":["LowerArm.L"],"LowerArm.L":["Hand.L"],
    "UpperArm.R":["LowerArm.R"],"LowerArm.R":["Hand.R"],
    "UpperLeg.L":["LowerLeg.L"],"LowerLeg.L":["Foot.L"],"Foot.L":["Toe.L"],
    "UpperLeg.R":["LowerLeg.R"],"LowerLeg.R":["Foot.R"],"Foot.R":["Toe.R"]
  };
  for(const [parent,children] of Object.entries(hierarchy))
    nodes[index.get(parent)].children=children.map(x=>index.get(x));
  nodes.push({name:"Body",mesh:0,skin:0});
  return {
    asset:{version:"2.0"},nodes,
    skins:[{joints:spec.rig.requiredBoneNames.map((_,i)=>i),inverseBindMatrices:0}],
    meshes:[{primitives:[{attributes:{POSITION:1,JOINTS_0:2,WEIGHTS_0:3}}]}],
    accessors:[{type:"MAT4",componentType:5126,count:spec.rig.requiredBoneNames.length},{type:"VEC3",count:2600},{type:"VEC4",count:2600},{type:"VEC4",count:2600}],
    animations:["Qiyam","Takbir"].map(name=>({name,channels:[{target:{node:0,path:"rotation"}}],samplers:[{}]})),
    images:[{uri:"character-texture.png"}],materials:[{name:"Character"}]
  };
}
let count=0;
function test(name,fn){fn();count++;process.stdout.write("PASS "+name+"\n")}
function status(g,opts){return validateDocument(g,spec,"boy",opts || {fileBytes:8000,hasBin:true})}
test("valid skinned rig structure",()=> assert.equal(status(fixture()).structureValid,true));
test("never auto-approve production",()=> assert.equal(status(fixture()).productionApproved,false));
test("reject missing skin",()=> {let x=fixture();x.skins=[];assert.equal(status(x).structureValid,false)});
test("reject missing bone",()=> {let x=fixture();x.nodes=x.nodes.filter(n=>n.name!=="UpperLeg.L");assert.equal(status(x).structureValid,false)});
test("reject animated bone scale",()=> {let x=fixture();x.animations[0].channels[0].target.path="scale";assert.equal(status(x).structureValid,false)});
test("reject missing Takbir animation",()=> {let x=fixture();x.animations.pop();assert.equal(status(x).structureValid,false)});
test("reject poster-like geometry",()=> {let x=fixture();x.accessors[1].count=3;assert.equal(status(x).structureValid,false)});
test("reject unskinned mesh",()=> {let x=fixture();x.meshes[0].primitives[0].attributes={POSITION:1};assert.equal(status(x).structureValid,false)});
test("reject missing bind matrices",()=> {let x=fixture();delete x.skins[0].inverseBindMatrices;assert.equal(status(x).structureValid,false)});
test("separate girl pose review",()=> assert.ok(validateDocument(fixture(),spec,"girl").warnings.some(s=>s.includes("Girl-specific"))));
test("reject oversized file",()=> assert.equal(status(fixture(),{fileBytes:40*1048576,hasBin:true}).structureValid,false));
test("reject missing binary chunk",()=> assert.equal(status(fixture(),{fileBytes:123,hasBin:false}).structureValid,false));
test("reject fake png renamed to glb",()=> assert.throws(()=>parseGLB(Buffer.from("not a glb"))));
test("reject corrupted glb header",()=> {let b=Buffer.alloc(24);assert.throws(()=>parseGLB(b))});
test("reject glb length mismatch",()=> {let b=Buffer.alloc(24);b.writeUInt32LE(0x46546c67,0);b.writeUInt32LE(2,4);b.writeUInt32LE(25,8);assert.throws(()=>parseGLB(b))});
const j=JSON.stringify({asset:{version:"2.0"},nodes:[]}),pad=(4-j.length%4)%4,chunk=Buffer.from(j+" ".repeat(pad),"utf8"),buffer=Buffer.alloc(20+chunk.length);
buffer.writeUInt32LE(0x46546c67,0);buffer.writeUInt32LE(2,4);buffer.writeUInt32LE(buffer.length,8);buffer.writeUInt32LE(chunk.length,12);buffer.writeUInt32LE(0x4e4f534a,16);chunk.copy(buffer,20);
test("parse valid minimal GLB header/json",()=> assert.equal(parseGLB(buffer).gltf.asset.version,"2.0"));
// Limb-stretch regression: the first real release gate must fail closed.
test("allow Hips root translation",()=> {const x=fixture();x.animations[0].channels[0].target.path="translation";assert.equal(status(x).structureValid,true)});
test("reject Spine joint translation",()=> {const x=fixture();x.animations[0].channels[0].target={node:1,path:"translation"};assert.ok(status(x).errors.some(s=>s.includes("non-root skinned joint translation")))});
test("reject UpperArm.L joint translation",()=> {const x=fixture();x.animations[0].channels[0].target={node:5,path:"translation"};assert.equal(status(x).structureValid,false)});
test("reject LowerLeg.R joint translation",()=> {const x=fixture();x.animations[0].channels[0].target={node:16,path:"translation"};assert.equal(status(x).structureValid,false)});
test("allow nonjoint object translation",()=> {const x=fixture();x.animations[0].channels[0].target={node:19,path:"translation"};assert.equal(status(x).structureValid,true)});
test("allow limb joint rotation",()=> {const x=fixture();x.animations[0].channels[0].target={node:5,path:"rotation"};assert.equal(status(x).structureValid,true)});
test("reject translation on a second skin's joint",()=> {const x=fixture();x.nodes.push({name:"ExtraJoint"});x.skins.push({joints:[20],inverseBindMatrices:0});x.animations[0].channels[0].target={node:20,path:"translation"};assert.equal(status(x).structureValid,false)});
test("reject falsely named nested Hips",()=> {const x=fixture();x.nodes[1].children=[0];x.animations[0].channels[0].target={node:0,path:"translation"};assert.equal(status(x).structureValid,false)});
test("reject intermediary skeletal helper translation",()=> {const x=fixture();x.nodes.push({name:"ArmHelper",children:[5]});x.nodes[0].children=[20];x.animations[0].channels[0].target={node:20,path:"translation"};assert.equal(status(x).structureValid,false)});
test("allow parent-of-whole-rig translation",()=> {const x=fixture();x.nodes.push({name:"World",children:[0]});x.animations[0].channels[0].target={node:20,path:"translation"};assert.equal(status(x).structureValid,true)});
test("reject duplicate root naming",()=> {const x=fixture();x.nodes.push({name:"Hips"});x.skins[0].joints.push(20);x.accessors[0].count=20;assert.ok(status(x).errors.some(s=>s.includes("ambiguous skeleton root")))});
test("reject cyclic skeletal hierarchy",()=> {const x=fixture();x.nodes[0].children=[1];x.nodes[1].children=[0];x.animations[0].channels[0].target={node:0,path:"translation"};assert.equal(status(x).structureValid,false)});
test("reject invalid child references",()=> {const x=fixture();x.nodes[0].children=[9999];assert.equal(status(x).structureValid,false)});
test("static identity scale on Hips allowed",()=> {const x=fixture();x.nodes[0].scale=[1,1,1];assert.equal(status(x).structureValid,true)});
test("static UpperArm stretching rejected",()=> {const x=fixture();x.nodes[5].scale=[1,1.5,1];assert.ok(status(x).errors.some(s=>s.includes("Static skeletal scaling")))});
test("static spine matrix bypass rejected",()=> {const x=fixture();x.nodes[1].matrix=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];assert.equal(status(x).structureValid,false)});
test("static intermediary helper scaling rejected",()=> {const x=fixture();x.nodes.push({name:"Helper",scale:[1,1.2,1],children:[5]});x.nodes[0].children=[20];assert.equal(status(x).structureValid,false)});
test("nonfinite bind rotation rejected",()=> {const x=fixture();x.nodes[4].rotation=[0,0,0,NaN];assert.equal(status(x).structureValid,false)});
test("duplicate skin indices rejected",()=> {const x=fixture();x.skins[0].joints[1]=0;assert.equal(status(x).structureValid,false)});
test("invalid second-skin bind accessor rejected",()=> {const x=fixture();x.skins.push({joints:[5,6],inverseBindMatrices:3});assert.equal(status(x).structureValid,false)});
test("reject disconnected child bones despite correct names",()=>{
 const x=fixture();delete x.nodes[15].children; // disconnected LowerLeg.R subtree
 assert.ok(status(x).errors.some(s=>s.includes("Disconnected skin bone")));
});
test("reject detached Head from torso hierarchy",()=>{
 const x=fixture();x.nodes[3].children=[]; // Neck without Head
 assert.ok(status(x).errors.some(s=>s.includes("Disconnected skin bone")));
});
test("reject duplicate bone names on distinct joint IDs",()=>{
 const x=fixture();x.nodes[18].name="Toe.L";
 assert.ok(status(x).errors.some(s=>s.includes("duplicate joint names")));
});
process.stdout.write("\n"+count+" offline test checks passed. No 3D model generated or approved.\n");
