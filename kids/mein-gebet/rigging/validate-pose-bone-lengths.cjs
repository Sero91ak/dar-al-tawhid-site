#!/usr/bin/env node
"use strict";
/**
 * Independent glTF 2.0 joint-centre kinematics QA.
 * Reads actual LINEAR/STEP animation samples from GLB BIN and evaluates
 * world-space distances along the skinned hierarchy at every keyframe AND
 * every intervening midpoint. No visual, clothing, floor-contact or fiqh
 * claims. Root/world motion is allowed; non-root bone stretching is not.
 */
const MAX_SAMPLED_TIMES=6000;
const EPSILON_METRES=0.0001;
const {hypot,abs,max,min}=Math;
const ERRORS_LIMIT=30;
function qNorm(q){const n=hypot(...q);if(!Number.isFinite(n)||abs(n-1)>0.001)throw Error("Invalid rotation quaternion");return q.map(x=>x/n)}
function qMul(a,b){
 return [
  a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],
  a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],
  a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],
  a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]
 ];
}
function qRotate(q,v){
 const x=q[0],y=q[1],z=q[2],w=q[3],vx=v[0],vy=v[1],vz=v[2];
 const tx=2*(y*vz-z*vy),ty=2*(z*vx-x*vz),tz=2*(x*vy-y*vx);
 return [vx+w*tx+(y*tz-z*ty),vy+w*ty+(z*tx-x*tz),vz+w*tz+(x*ty-y*tx)];
}
function slerp(a,b,f){
 let d=a.reduce((x,c,i)=>x+c*b[i],0),out=b;
 if(d<0){out=b.map(x=>-x);d=-d}
 if(d>0.9995)return qNorm(a.map((x,i)=>x+(out[i]-x)*f));
 const theta=Math.acos(max(-1,min(1,d))),s=Math.sin(theta);
 const x=Math.sin((1-f)*theta)/s,y=Math.sin(f*theta)/s;
 return qNorm(a.map((v,i)=>x*v+y*out[i]));
}
function readFloats(g,bin,id,type){
 const countByType={SCALAR:1,VEC3:3,VEC4:4};
 const n=countByType[type],a=g?.accessors?.[id];
 if(!Number.isInteger(id)||!a||a.type!==type||a.componentType!==5126||
    a.sparse||!Number.isSafeInteger(a.count)||a.count<1||a.count>MAX_SAMPLED_TIMES||
    !Number.isInteger(a.bufferView))
   throw Error("Invalid pose sampler "+id+" / "+type);
 const view=g.bufferViews?.[a.bufferView];
 const from=view?.byteOffset??0,relative=a.byteOffset??0;
 const stride=view?.byteStride??n*4,start=from+relative;
 if(!view||view.buffer!==0||!Number.isSafeInteger(from)||from<0||
    !Number.isSafeInteger(view.byteLength)||view.byteLength<=0||
    !Number.isSafeInteger(relative)||relative<0||
    !Number.isSafeInteger(stride)||stride<n*4||stride%4!==0||
    !Number.isSafeInteger(start)||start%4!==0||
    start+(a.count-1)*stride+n*4>from+view.byteLength||
    from+view.byteLength>bin.length)
   throw Error("Pose sampler outside GLB BIN buffer: "+id);
 const out=[];
 for(let i=0;i<a.count;i++){
   const row=[];
   for(let j=0;j<n;j++){
     const val=bin.readFloatLE(start+i*stride+j*4);
     if(!Number.isFinite(val))throw Error("Nonfinite sampled pose data");
     row.push(val);
   }
   out.push(row);
 }
 return out;
}
function checkNodeTRS(node){
 const t=node.translation??[0,0,0],q=node.rotation??[0,0,0,1],scale=node.scale??[1,1,1];
 if(node.matrix!==undefined)throw Error("Unsupported skeletal matrix; must use unscaled TRS");
 if(!Array.isArray(t)||t.length!==3||t.some(v=>!Number.isFinite(v)))
   throw Error("Invalid local bone translation");
 if(!Array.isArray(q)||q.length!==4)throw Error("Invalid bone rotation");
 qNorm(q);
 if(!Array.isArray(scale)||scale.length!==3||scale.some(x=>!Number.isFinite(x)||abs(x-1)>1e-6))
   throw Error("Static scale alters bone lengths");
 return {t,q};
}
function validatePoseBoneLengths(g,bin,{tolerance=EPSILON_METRES}={}){
 const errors=[];
 const fail=e=>{if(errors.length<ERRORS_LIMIT)errors.push(e)};
 const blocked=(reason)=>({valid:false,errors:[reason],productionApproved:false,boneLengthInvariantVerified:false});
 if(!Buffer.isBuffer(bin)||!Array.isArray(g?.nodes)||!Array.isArray(g?.skins)||
    !Array.isArray(g?.animations)||!g.animations.length)
   return blocked("Missing binary bytes, skeleton or animation clips");
 if(!Number.isFinite(tolerance)||tolerance<0||tolerance>0.01)return blocked("Unsafe bone tolerance");
 try{
   const nodes=g.nodes,parents=new Map(),joints=new Set();
   for(const skin of g.skins){
     if(!Array.isArray(skin.joints)||!skin.joints.length)throw Error("Missing skin joints");
     for(const j of skin.joints){if(!Number.isInteger(j)||!nodes[j])throw Error("Invalid skin joint");joints.add(j)}
   }
   for(const [p,node] of nodes.entries()){
     for(const child of node.children??[]){
       if(!Number.isInteger(child)||!nodes[child]||parents.has(child))throw Error("Invalid/multiply parented scene node");
       parents.set(child,p);
     }
   }
   const root=[...joints].filter(j=>nodes[j]?.name==="Hips");
   if(root.length!==1)throw Error("Missing unique Hips skeleton root");
   const rootId=root[0],chainNodes=new Set(),segments=[];
   for(const j of joints){
     let cursor=j,previous=null,seen=new Set();
     while(cursor!==undefined){
       if(seen.has(cursor))throw Error("Cyclic skeletal hierarchy");
       seen.add(cursor);chainNodes.add(cursor);
       if(cursor===rootId)break;
       previous=cursor;cursor=parents.get(cursor);
     }
     if(!seen.has(rootId))throw Error("Bone disconnected from Hips");
     if(j!==rootId){
       let ancestor=parents.get(j);
       while(ancestor!==undefined&&!joints.has(ancestor))ancestor=parents.get(ancestor);
       if(ancestor===undefined)throw Error("Missing ancestor joint");
       segments.push([ancestor,j]);
     }
   }
   if(!segments.length)throw Error("No measurable bone segments");
   // Include ancestors above the actual Hips to detect hidden parent scale.
   for(let j=rootId;j!==undefined;j=parents.get(j)){
     if(chainNodes.has(j)&&j!==rootId)break;
     chainNodes.add(j);
   }
   const base=new Map([...chainNodes].map(i=>[i,checkNodeTRS(nodes[i])]));
   function evaluate(overrides){
     const world=new Map();
     const sampleWorld=i=>{
       if(world.has(i))return world.get(i);
       const rest=base.get(i),o=overrides.get(i)||{};
       const q=qNorm(o.q??rest.q),t=o.t??rest.t;
       let result={q,position:t};
       const parent=parents.get(i);
       if(parent!==undefined&&base.has(parent)){
         const w=sampleWorld(parent);
         const r=qRotate(w.q,t);
         result={q:qNorm(qMul(w.q,q)),position:w.position.map((x,j)=>x+r[j])};
       }
       world.set(i,result);return result;
     };
     return segments.map(([a,b])=>{
       const u=sampleWorld(a).position,v=sampleWorld(b).position;
       return hypot(...u.map((x,k)=>x-v[k]));
     });
   }
   const rest=evaluate(new Map());
   const zeroCount=rest.filter(x=>!Number.isFinite(x)||x<1e-5).length;
   if(zeroCount)throw Error("Zero-length/degenerate skeletal bone segments: "+zeroCount);
   let sampledFrames=0,maxDelta=0;
   for(const clip of g.animations){
     const animationChannels=[],allTimes=new Set([0]);
     if(!Array.isArray(clip.channels)||!clip.channels.length||!Array.isArray(clip.samplers))
       throw Error("Empty animation clip: "+clip.name);
     const destinations=new Set();
     for(const channel of clip.channels){
       const target=channel.target||{},node=target.node,parameter=target.path;
       if(!Number.isInteger(node)||!nodes[node]||!["rotation","translation"].includes(parameter))
         throw Error("Unsupported animation target");
       const identity=node+":"+parameter;
       if(destinations.has(identity))throw Error("Duplicate animation targets: "+identity);
       destinations.add(identity);
       const sampler=clip.samplers[channel.sampler],interpolation=sampler?.interpolation??"LINEAR";
       if(!sampler||!["LINEAR","STEP"].includes(interpolation))throw Error("Unsupported sampled interpolation");
       const time=readFloats(g,bin,sampler.input,"SCALAR").map(a=>a[0]);
       const values=readFloats(g,bin,sampler.output,parameter==="rotation"?"VEC4":"VEC3");
       if(time.length!==values.length||time.some((x,k)=>x<0||(k>0&&x<=time[k-1])))
         throw Error("Invalid animation frame times");
       if(parameter==="rotation")for(const q of values)qNorm(q);
       if(parameter==="translation"&&chainNodes.has(node)&&node!==rootId&&joints.has(node))
         throw Error("Animated non-root joint translation stretches skeleton");
       if(parameter==="translation"&&chainNodes.has(node)&&node!==rootId&&
          [...joints].some(j=>{
             let current=parents.get(j),seen=new Set();
             while(current!==undefined&&!seen.has(current)){
               if(current===node)return true;
               seen.add(current);current=parents.get(current);
             }
             return false;
          })&&
          (()=>{
            let up=parents.get(node),seen=new Set();
            while(up!==undefined&&!seen.has(up)){
              if(joints.has(up))return true;
              seen.add(up);up=parents.get(up);
            }
            return false;
          })())throw Error("Animated intermediary helper stretches skeleton");
       // Only skeleton-affecting channels need evaluation.
       if(!chainNodes.has(node))continue;
       time.forEach(v=>allTimes.add(v));
       animationChannels.push({node,parameter,time,values,interpolation});
     }
     const times=[...allTimes].sort((a,b)=>a-b);
     const sweep=new Set(times);
     for(let k=1;k<times.length;k++)sweep.add((times[k-1]+times[k])/2);
     if(sweep.size>MAX_SAMPLED_TIMES)throw Error("Excessive number of pose evaluation frames");
     for(const t of [...sweep].sort((a,b)=>a-b)){
       const overrides=new Map();
       for(const c of animationChannels){
         const times=c.time;
         let k=0;
         while(k+1<times.length&&times[k+1]<t)k++;
         let value=c.values[k];
         if(t<=times[0])value=c.values[0];
         else if(t>=times[times.length-1])value=c.values.at(-1);
         else if(k+1<times.length&&c.interpolation==="LINEAR"){
           const factor=(t-times[k])/(times[k+1]-times[k]);
           value=c.parameter==="rotation"?slerp(c.values[k],c.values[k+1],factor):
             c.values[k].map((v,j)=>v+(c.values[k+1][j]-v)*factor);
         }
         const entry=overrides.get(c.node)||{};
         if(c.parameter==="rotation")entry.q=value;
         else entry.t=value;
         overrides.set(c.node,entry);
       }
       const actual=evaluate(overrides);
       for(let j=0;j<actual.length;j++){
         const delta=abs(actual[j]-rest[j]);
         maxDelta=max(maxDelta,delta);
         if(!Number.isFinite(delta)||delta>tolerance)fail("Animated bone segment length changes at "+clip.name+" t="+t+" edge "+j);
       }
       sampledFrames++;
     }
   }
   return {valid:errors.length===0,errors,sampledFrames,measuredSegments:segments.length,
     maxLengthDeltaMetres:maxDelta,productionApproved:false,
     boneLengthInvariantVerified:errors.length===0,
     note:"This checks joint-centre distances, not mesh skinning artefacts, ground contact, prayer correctness or visual likeness."};
 }catch(e){return blocked(e.message)}
}
module.exports={validatePoseBoneLengths};
