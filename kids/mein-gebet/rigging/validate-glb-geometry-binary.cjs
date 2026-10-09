#!/usr/bin/env node
"use strict";
/* Draft-only geometry/skin BIN preflight. No silhouette/pose/likeness approval. */
const COMPONENTS={5121:{bytes:1,read:(b,o)=>b.readUInt8(o)},5123:{bytes:2,read:(b,o)=>b.readUInt16LE(o)},5125:{bytes:4,read:(b,o)=>b.readUInt32LE(o)},5126:{bytes:4,read:(b,o)=>b.readFloatLE(o)}};
const TYPE_SIZE={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
const MAX_VERTICES=400000;
function validateGeometryBytes(g,bin,{minimumReferencedVertices=2000}={}){
 const errors=[],fail=x=>errors.push(x);
 if(!Buffer.isBuffer(bin)||bin.length<4)
   return {valid:false,errors:["Missing GLB BIN vertex data."],productionApproved:false};
 const views=Array.isArray(g?.bufferViews)?g.bufferViews:[];
 const accessors=Array.isArray(g?.accessors)?g.accessors:[];
 const meshes=Array.isArray(g?.meshes)?g.meshes:[];
 const skins=Array.isArray(g?.skins)?g.skins:[];
 const nodes=Array.isArray(g?.nodes)?g.nodes:[];
 let totalVertices=0,totalTriangles=0,skinnedPrimitives=0,totalReferencedVertices=0,degenerateTriangles=0;
 const boundingMin=[Infinity,Infinity,Infinity],boundingMax=[-Infinity,-Infinity,-Infinity];
 if(!Number.isInteger(minimumReferencedVertices)||minimumReferencedVertices<3)
   fail("Invalid minimum reference vertex criterion.");
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
     // Inverse bind matrices must preserve lengths; unreviewed shear/scale
     // would invalidate the prayer-figure proportion guarantee.
     const axes=[[0,1,2],[4,5,6],[8,9,10]].map(ids=>ids.map(j=>matrices.read(i,j)));
     const dot=(u,v)=>u.reduce((sum,value,j)=>sum+value*v[j],0);
     if(axes.some(u=>Math.abs(dot(u,u)-1)>0.005)||
       Math.abs(dot(axes[0],axes[1]))>0.005||
       Math.abs(dot(axes[0],axes[2]))>0.005||
       Math.abs(dot(axes[1],axes[2]))>0.005){
       fail("Scaled/sheared inverse bind matrix in skin "+si);break;
     }
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
     if(p?.targets?.length || (mesh.weights && mesh.weights.length))
       fail("Unreviewed mesh morph displacements "+label);
     if(["JOINTS_1","WEIGHTS_1","JOINTS_2","WEIGHTS_2"].some(k=>attributes[k]!==undefined))
       fail("Unsupported additional skin influence sets "+label);
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
       let normalSquared=0;
       for(let j=0;j<3;j++){
         if(!Number.isFinite(pos.read(i,j))||!Number.isFinite(normal.read(i,j))){
           fail("Nonfinite vertex position or normal "+label);break;
         }
         normalSquared+=normal.read(i,j)**2;
       }
       if(Math.abs(normalSquared-1)>0.12)fail("Nonunit mesh normal "+label+" vertex "+i);
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
       if(Math.abs(weightSum-1)>0.008){
         fail("Skin weights not normalized "+label+" vertex "+i);break;
       }
       if(errors.length>150)return {valid:false,errors:["Too many geometry errors; first error: "+errors[0]],productionApproved:false};
     }
     const idx=readAccessor(p?.indices,"SCALAR",[5121,5123,5125],label+" indices");
     if(idx){
       if(idx.count%3!==0)fail("Triangle indices not divisible by 3 "+label);
       const used=new Set();
       const triangles=Math.floor(idx.count/3);
       let degenerate=0;
       for(let k=0;k<triangles;k++){
         const a=idx.read(k*3,0),b=idx.read(k*3+1,0),c=idx.read(k*3+2,0);
         if(a>=pos.count||b>=pos.count||c>=pos.count){
           fail("Triangle index outside POSITION "+label);break;
         }
         if(a===b||a===c||b===c){degenerate++;continue;}
         const p=[a,b,c].map(i=>[pos.read(i,0),pos.read(i,1),pos.read(i,2)]);
         if(p.some(row=>row.some(v=>!Number.isFinite(v)))){
           fail("Nonfinite indexed triangle geometry "+label);break;
         }
         const u=p[1].map((v,j)=>v-p[0][j]),v=p[2].map((n,j)=>n-p[0][j]);
         const cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
         const areaSquared=cross.reduce((s,x)=>s+x*x,0);
         if(!Number.isFinite(areaSquared)||areaSquared<=1e-20){degenerate++;continue;}
         for(const index of [a,b,c])used.add(index);
       }
       // Count only vertices belonging to real triangles, not dummy points
       // or degenerate faces created to inflate the character's apparent size.
       for(const index of used){
         for(let axis=0;axis<3;axis++){
           const x=pos.read(index,axis);
           boundingMin[axis]=Math.min(boundingMin[axis],x);
           boundingMax[axis]=Math.max(boundingMax[axis],x);
         }
       }
       totalReferencedVertices+=used.size;
       totalTriangles+=triangles;
       degenerateTriangles+=degenerate;
       if(triangles>0&&degenerate/triangles>0.05)
         fail("Excessive zero-area or repeated-index triangles "+label);
     }
     totalVertices+=pos.count;
     skinnedPrimitives++;
   }
 }
 if(!skinnedPrimitives)fail("No actual skinned triangle primitive.");
 if(totalReferencedVertices<minimumReferencedVertices)
   fail("Too few actually referenced mesh vertices: "+totalReferencedVertices);
 if(boundingMin.some((x,i)=>!Number.isFinite(x)||!Number.isFinite(boundingMax[i])||boundingMax[i]-x<0.02))
   fail("Degenerate/flat geometry bounds; not a validated full 3D character.");
 return {valid:errors.length===0,errors,productionApproved:false,
   vertices:totalVertices,referencedVertices:totalReferencedVertices,
   triangles:totalTriangles,degenerateTriangles,skinnedPrimitives};
}
module.exports={validateGeometryBytes};
