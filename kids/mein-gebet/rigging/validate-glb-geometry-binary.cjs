#!/usr/bin/env node
"use strict";
/* Draft-only geometry/skin BIN preflight. No silhouette/pose/likeness approval. */
const COMPONENTS={5121:{bytes:1,read:(b,o)=>b.readUInt8(o)},5123:{bytes:2,read:(b,o)=>b.readUInt16LE(o)},5125:{bytes:4,read:(b,o)=>b.readUInt32LE(o)},5126:{bytes:4,read:(b,o)=>b.readFloatLE(o)}};
const TYPE_SIZE={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
const MAX_VERTICES=400000;
function validateGeometryBytes(g,bin){
 const errors=[],fail=x=>errors.push(x);
 if(!Buffer.isBuffer(bin)||bin.length<4)
   return {valid:false,errors:["Missing GLB BIN vertex data."],productionApproved:false};
 const views=Array.isArray(g?.bufferViews)?g.bufferViews:[];
 const accessors=Array.isArray(g?.accessors)?g.accessors:[];
 const meshes=Array.isArray(g?.meshes)?g.meshes:[];
 const skins=Array.isArray(g?.skins)?g.skins:[];
 const nodes=Array.isArray(g?.nodes)?g.nodes:[];
 let totalVertices=0,totalTriangles=0,skinnedPrimitives=0;
 function readAccessor(index,type,types,label){
   const a=accessors[index],size=TYPE_SIZE[type],component=COMPONENTS[a?.componentType];
   if(!Number.isInteger(index)||!a||a.type!==type||!size||
      !component||!types.includes(a.componentType)||a.sparse||
      !Number.isSafeInteger(a.count)||a.count<=0||a.count>MAX_VERTICES||
      !Number.isInteger(a.bufferView)){
     fail("Invalid accessor "+label);return null;
   }
   const v=views[a.bufferView],offset0=v?.byteOffset??0,offA=a.byteOffset??0;
   const stride=v?.byteStride??size*component.bytes;
   const start=offset0+offA,end=start+(a.count-1)*stride+size*component.bytes;
   if(!v||v.buffer!==0||!Number.isSafeInteger(offset0)||offset0<0||
      !Number.isSafeInteger(offA)||offA<0||!Number.isSafeInteger(v.byteLength)||
      !Number.isSafeInteger(stride)||stride<size*component.bytes||
      stride%component.bytes!==0||offA%component.bytes!==0||
      start%component.bytes!==0||end>offset0+v.byteLength||
      offset0+v.byteLength>bin.length||!Number.isSafeInteger(end)){
      fail("Geometry accessor outside BIN bounds "+label);return null;
   }
   return {count:a.count,normalized:a.normalized===true,
     read:(i,j)=>component.read(bin,start+i*stride+j*component.bytes)};
 }
 if(!skins.length||!meshes.length)fail("GLB skin or mesh geometry missing.");
 for(const [si,skin] of skins.entries()){
   const joints=skin?.joints;
   if(!Array.isArray(joints)||!joints.length){
     fail("Skin has no joints: "+si);continue;
   }
   if(!Number.isInteger(skin.inverseBindMatrices)){
     fail("Missing inverse bind matrix payload: skin "+si);continue;
   }
   const matrices=readAccessor(skin.inverseBindMatrices,"MAT4",[5126],"skin "+si+" inverse bind");
   if(!matrices)continue;
   if(matrices.count!==joints.length)fail("Inverse bind matrix count mismatch for skin "+si);
   for(let i=0;i<matrices.count;i++){
     let finite=true;
     for(let j=0;j<16;j++)if(!Number.isFinite(matrices.read(i,j)))finite=false;
     if(!finite){fail("Nonfinite inverse bind matrix in skin "+si);break;}
     if(Math.abs(matrices.read(i,3))>1e-3||Math.abs(matrices.read(i,7))>1e-3||
        Math.abs(matrices.read(i,11))>1e-3||Math.abs(matrices.read(i,15)-1)>1e-3){
       fail("Nonaffine inverse bind matrix in skin "+si);break;
     }
   }
 }
 const refs=new Map();
 for(const n of nodes){
   if(n?.mesh===undefined)continue;
   if(!Number.isInteger(n.mesh)||!meshes[n.mesh]){fail("Invalid mesh-node binding.");continue;}
   if(!Number.isInteger(n.skin)||!skins[n.skin]){
     fail("Skinned mesh node missing valid skin.");continue;
   }
   if(!refs.has(n.mesh))refs.set(n.mesh,new Set());
   refs.get(n.mesh).add(n.skin);
 }
 for(const [mi,mesh] of meshes.entries()){
   if(!Array.isArray(mesh?.primitives)||!mesh.primitives.length){
     fail("Mesh has no triangle primitives: "+mi);continue;
   }
   const boundSkins=refs.get(mi)||new Set();
   if(boundSkins.size!==1)fail("Mesh requires exactly one bound skin: "+mi);
   const activeSkin=boundSkins.size===1?skins[[...boundSkins][0]]:null;
   for(const [pi,p] of mesh.primitives.entries()){
     const label="mesh "+mi+" primitive "+pi,attributes=p?.attributes||{};
     if(p?.mode!==undefined&&p.mode!==4){fail("Unsupported non-triangle primitive "+label);continue;}
     const pos=readAccessor(attributes.POSITION,"VEC3",[5126],label+" POSITION");
     const normal=readAccessor(attributes.NORMAL,"VEC3",[5126],label+" NORMAL");
     const joints=readAccessor(attributes.JOINTS_0,"VEC4",[5121,5123],label+" JOINTS_0");
     const weights=readAccessor(attributes.WEIGHTS_0,"VEC4",[5121,5123,5126],label+" WEIGHTS_0");
     if(!pos||!normal||!joints||!weights)continue;
     if([normal.count,joints.count,weights.count].some(n=>n!==pos.count)){
       fail("Vertex attribute count mismatch "+label);continue;
     }
     if(weights.normalized===false&&
        accessors[attributes.WEIGHTS_0].componentType!==5126)
       fail("Unsigned skin weights must be normalized "+label);
     for(let i=0;i<pos.count;i++){
       for(let j=0;j<3;j++){
         if(!Number.isFinite(pos.read(i,j))||!Number.isFinite(normal.read(i,j))){
           fail("Nonfinite vertex position or normal "+label);break;
         }
       }
       let weightSum=0;
       for(let j=0;j<4;j++){
         const joint=joints.read(i,j);
         if(!Number.isInteger(joint)||joint<0||joint>= (activeSkin?.joints?.length||0)){
           fail("Out-of-range weighted joint reference "+label);break;
         }
         const raw=weights.read(i,j);
         const ct=accessors[attributes.WEIGHTS_0].componentType;
         const w=ct===5126?raw:raw/(ct===5121?255:65535);
         if(!Number.isFinite(w)||w<0||w>1.00001){
           fail("Invalid skin weight "+label);break;
         }
         weightSum+=w;
       }
       if(Math.abs(weightSum-1)>0.015){
         fail("Skin weights not normalized "+label+" vertex "+i);break;
       }
       if(errors.length>150)return {valid:false,errors:["Too many geometry errors; first error: "+errors[0]],productionApproved:false};
     }
     const idx=readAccessor(p?.indices,"SCALAR",[5121,5123,5125],label+" indices");
     if(idx){
       if(idx.count%3!==0)fail("Triangle indices not divisible by 3 "+label);
       for(let k=0;k<idx.count;k++){
         if(idx.read(k,0)>=pos.count){fail("Triangle index outside POSITION "+label);break;}
       }
       totalTriangles+=Math.floor(idx.count/3);
     }
     totalVertices+=pos.count;
     skinnedPrimitives++;
   }
 }
 if(!skinnedPrimitives)fail("No actual skinned triangle primitive.");
 return {valid:errors.length===0,errors,productionApproved:false,
   vertices:totalVertices,triangles:totalTriangles,skinnedPrimitives};
}
module.exports={validateGeometryBytes};
