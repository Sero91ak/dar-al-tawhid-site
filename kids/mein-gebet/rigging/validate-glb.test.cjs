#!/usr/bin/env node
"use strict";
/* Unit checks for draft-only GLB structure gate; creates NO production model. */
const assert = require("node:assert/strict");
const spec = require("./rig-acceptance-v1.json");
const { validateDocument,parseGLB } = require("./validate-glb.cjs");
function fixture(){
  const nodes=spec.rig.requiredBoneNames.map(name=>({name}));
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
process.stdout.write("\n"+count+" offline test checks passed. No 3D model generated or approved.\n");
