#!/usr/bin/env node
"use strict";
/* Synthetic *real Buffer* geometry QA, no original model or pose approval. */
const assert=require("node:assert/strict");
const {validateGeometryBytes,spatialThicknessRatio}=require("./validate-glb-geometry-binary.cjs");
function fixture(){
 const chunks=[],bufferViews=[],accessors=[];
 function add(data,type,componentType,count){
   const total=chunks.reduce((s,c)=>s+c.length,0);
   const view=bufferViews.length;
   bufferViews.push({buffer:0,byteOffset:total,byteLength:data.length});
   chunks.push(data,Buffer.alloc((4-data.length%4)%4));
   accessors.push({bufferView:view,componentType,type,count});
   return accessors.length-1;
 }
 const ibm=Buffer.alloc(64);
 for(const j of [0,5,10,15])ibm.writeFloatLE(1,j*4);
 const ibmIndex=add(ibm,"MAT4",5126,1);
 const position=Buffer.alloc(36);
 position.writeFloatLE(1,12);position.writeFloatLE(1,28);position.writeFloatLE(.2,32);
 const positionIndex=add(position,"VEC3",5126,3);
 const normal=Buffer.alloc(36);
 for(const j of [8,20,32])normal.writeFloatLE(1,j);
 const normalIndex=add(normal,"VEC3",5126,3);
 const joint=Buffer.alloc(12);
 const jointIndex=add(joint,"VEC4",5121,3);
 const weight=Buffer.alloc(48);
 for(const j of [0,16,32])weight.writeFloatLE(1,j);
 const weightIndex=add(weight,"VEC4",5126,3);
 const faces=Buffer.alloc(6);
 for(let i=0;i<3;i++)faces.writeUInt16LE(i,2*i);
 const indicesIndex=add(faces,"SCALAR",5123,3);
 const bin=Buffer.concat(chunks);
 const g={
   asset:{version:"2.0"},accessors,bufferViews,buffers:[{byteLength:bin.length}],
   nodes:[{name:"Hips"},{name:"Body",mesh:0,skin:0}],
   skins:[{joints:[0],inverseBindMatrices:ibmIndex}],
   meshes:[{primitives:[{mode:4,attributes:{POSITION:positionIndex,NORMAL:normalIndex,
     JOINTS_0:jointIndex,WEIGHTS_0:weightIndex},indices:indicesIndex}]}],
 };
 return {g,bin,offsets:bufferViews.map(x=>x.byteOffset)};
}
let count=0;
function test(name,fn){fn();count++;console.log("PASS "+name);}
function bad(name,edit,expected){
 test(name,()=>{const {g,bin,offsets}=fixture();edit(g,bin,offsets);
   const result=validateGeometryBytes(g,bin,{minimumReferencedVertices:3});assert.equal(result.valid,false);
   assert.ok(result.errors.some(x=>x.includes(expected)),JSON.stringify(result.errors));});
}
test("positive actual-buffer mesh with 1 bind matrix and 1 triangle",()=>{
 const {g,bin}=fixture(),r=validateGeometryBytes(g,bin,{minimumReferencedVertices:3});
 assert.equal(r.valid,true,JSON.stringify(r.errors));assert.equal(r.vertices,3);
 assert.equal(r.triangles,1);assert.equal(r.productionApproved,false);
});
test("reject missing BIN buffer",()=>{
 const {g}=fixture();assert.equal(validateGeometryBytes(g,null,{minimumReferencedVertices:3}).valid,false);
});
bad("reject invalid joint index",(_,bin,offsets)=>bin.writeUInt8(3,offsets[3]),"Out-of-range");
bad("reject NaN position",(_,bin,offsets)=>bin.writeFloatLE(NaN,offsets[1]),"Nonfinite");
bad("reject infinite normal",(_,bin,offsets)=>bin.writeFloatLE(Infinity,offsets[2]+8),"Nonfinite");
bad("reject zero-length normal",(_,bin,offsets)=>bin.writeFloatLE(0,offsets[2]+8),"Nonunit");
bad("reject zero-sum weights",(_,bin,offsets)=>bin.writeFloatLE(0,offsets[4]),"not normalized");
bad("reject negative float weights",(_,bin,offsets)=>bin.writeFloatLE(-1,offsets[4]),"Invalid skin weight");
bad("reject out-of-bounds index",(_,bin,offsets)=>bin.writeUInt16LE(99,offsets[5]+4),"Triangle index");
bad("reject skin matrix scaling",(_,bin,offsets)=>bin.writeFloatLE(2,offsets[0]),"Scaled/sheared");
bad("reject NaN inverse bind",(_,bin,offsets)=>bin.writeFloatLE(NaN,offsets[0]),"Nonfinite inverse");
bad("reject missing skin bind matrices",g=>delete g.skins[0].inverseBindMatrices,"Missing inverse");
bad("reject attribute count mismatch",g=>g.accessors[2].count=2,"attribute count");
bad("reject sparse vertex positions",g=>g.accessors[1].sparse={count:1},"Invalid accessor");
bad("reject unsigned unnormalized skin weights",g=>{g.accessors[4].componentType=5121;},"normalized");
bad("reject invalid triangle index count",g=>g.accessors[5].count=2,"not divisible");
bad("reject missing required normals",g=>delete g.meshes[0].primitives[0].attributes.NORMAL,"Invalid accessor");
bad("reject unsupported morph targets",g=>g.meshes[0].primitives[0].targets=[{POSITION:1}],"morph");
bad("reject unreviewed secondary weight sets",g=>g.meshes[0].primitives[0].attributes.JOINTS_1=3,"additional skin");
bad("reject unbound skin",g=>delete g.nodes[1].skin,"missing valid skin");
bad("reject triangle strip primitive",g=>g.meshes[0].primitives[0].mode=5,"non-triangle");
bad("reject missing indexed triangle mesh",g=>delete g.meshes[0].primitives[0].indices,"Invalid accessor");
bad("reject misaligned vertex data",g=>g.accessors[1].byteOffset=2,"outside BIN");
bad("reject invalid matrix bottom row",(_,bin,offsets)=>bin.writeFloatLE(1,offsets[0]+12),"Nonaffine");
bad("reject repeated-index fake geometry",(_,bin,offsets)=>{for(let i=0;i<3;i++)bin.writeUInt16LE(0,offsets[5]+2*i)},"Too few actually referenced");
bad("reject flat billboard mesh",(_,bin,offsets)=>bin.writeFloatLE(0,offsets[1]+32),"Degenerate/flat");
bad("reject collinear triangles despite XYZ extents",(_,bin,offsets)=>{
  // All three points lie on [0,0,0] -> [1,1,1] -> [2,2,2].
  for(let p=0;p<3;p++)for(let k=0;k<3;k++)
    bin.writeFloatLE(p,offsets[1]+p*12+k*4);
},"Excessive zero-area");
bad("reject zero-area triangle with unique but overlapping positions",(_,bin,offsets)=>{
  // Different indices but identical first two vertex positions.
  for(let k=0;k<3;k++)bin.writeFloatLE(0,offsets[1]+12+k*4);
},"Excessive zero-area");
bad("reject duplicate index triangle at the area gate",(_,bin,offsets)=>{
  bin.writeUInt16LE(1,offsets[5]+4);
},"Excessive zero-area");
test("oblique billboard looks extended in XYZ but has zero real thickness",()=>{
 const pts=[[0,0,0],[1,0,-1],[0,1,-1],[1,1,-2],[.5,.25,-.75]];
 assert.equal(spatialThicknessRatio(pts)<1e-8,true);
});
test("real tetrahedron has nonzero spatial thickness even if rotated",()=>{
 const pts=[[0,0,0],[1,0,0],[0,1,0],[.15,.15,.7],[.3,.4,.2]];
 assert.ok(spatialThicknessRatio(pts)>.05);
});
test("collinear vertices cannot fake spatial thickness",()=>{
 assert.equal(spatialThicknessRatio([[0,0,0],[1,1,1],[2,2,2],[3,3,3]]),0);
});
test("default production minimum rejects tiny synthetic mesh",()=>{
 const {g,bin}=fixture();const r=validateGeometryBytes(g,bin);
 assert.equal(r.valid,false);assert.ok(r.errors.some(x=>x.includes("Too few actually referenced")));
});
console.log(count+" real-Buffer geometry preflight tests passed. NO 3D identity or fiqh release.");
