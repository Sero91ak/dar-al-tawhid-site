#!/usr/bin/env node
"use strict";
/**
 * Structural GLB animation-byte gate, separate from visual/fiqh approval.
 * Fail closed on absent/malformed sampler data, even when channel names exist.
 * It does not approve Qiyam, Takbir, bone lengths, poses, or production.
 */
const MAX_FRAMES=100000;
const MAX_CLIPS=64;
const MAX_CHANNELS=512;

function validateAnimationBytes(g, bin) {
  const errors=[];
  const fail=(s)=>errors.push(s);
  if(!Buffer.isBuffer(bin)||bin.length<4)
    return {valid:false,errors:["Missing actual GLB BIN bytes."],productionApproved:false};
  const accessors=Array.isArray(g?.accessors)?g.accessors:[];
  const views=Array.isArray(g?.bufferViews)?g.bufferViews:[];
  const animations=Array.isArray(g?.animations)?g.animations:[];
  const buffers=Array.isArray(g?.buffers)?g.buffers:[];
  if(buffers.length!==1||!Number.isSafeInteger(buffers[0]?.byteLength)||
     buffers[0].byteLength<=0||buffers[0].byteLength>bin.length||
     bin.length-buffers[0].byteLength>3)
    fail("GLB BIN declaration mismatch; one embedded buffer required.");
  if(animations.length===0||animations.length>MAX_CLIPS)
    fail("No animations or excessive animation count.");
  function takeFloats(i, expectedType, context){
    const a=accessors[i];
    const itemSize=expectedType==="SCALAR"?1:expectedType==="VEC3"?3:expectedType==="VEC4"?4:0;
    if(!Number.isInteger(i)||!a||!itemSize||a.type!==expectedType||
       a.componentType!==5126||a.sparse||!Number.isInteger(a.bufferView)||
       !Number.isSafeInteger(a.count)||a.count<1||a.count>MAX_FRAMES*3){
      fail("Invalid or unsupported float accessor "+String(i)+" for "+context);
      return null;
    }
    const v=views[a.bufferView];
    const start=v?.byteOffset??0;
    const offset=start+(a.byteOffset??0);
    const stride=v?.byteStride??itemSize*4;
    const nBytes=a.count*itemSize*4;
    const end=offset+(a.count-1)*stride+itemSize*4;
    if(!v||v.buffer!==0||!Number.isSafeInteger(start)||start<0||
       !Number.isSafeInteger(v.byteLength)||v.byteLength<=0||
       !Number.isSafeInteger(a.byteOffset??0)||(a.byteOffset??0)<0||
       !Number.isSafeInteger(stride)||stride<itemSize*4||stride%4!==0||
       !Number.isSafeInteger(offset)||offset%4!==0||
       !Number.isSafeInteger(end)||end>start+v.byteLength||end>bin.length||
       start+v.byteLength>bin.length||nBytes>MAX_FRAMES*3*16){
      fail("Sampler accessor out of bounds or misaligned: "+context);
      return null;
    }
    const data=new Float32Array(a.count*itemSize);
    for(let k=0;k<a.count;k++){
      const pos=offset+k*stride;
      for(let j=0;j<itemSize;j++){
        const val=bin.readFloatLE(pos+j*4);
        if(!Number.isFinite(val)){
          fail("NaN/Infinity in animation sampler: "+context);
          return null;
        }
        data[k*itemSize+j]=val;
      }
    }
    return {count:a.count,data};
  }
  for(const animation of animations){
    if(!Array.isArray(animation?.channels)||animation.channels.length<1||
       animation.channels.length>MAX_CHANNELS||
       !Array.isArray(animation.samplers)||animation.samplers.length<1){
      fail("Empty or oversized animation channels/samplers: "+String(animation?.name));
      continue;
    }
    const targets=new Set();
    for(const [chIndex,channel] of animation.channels.entries()){
      const target=channel?.target;
      const path=target?.path;
      const node=target?.node;
      const context=String(animation.name)+" channel "+chIndex;
      if(path!=="translation"&&path!=="rotation"){
        fail("Invalid sampled animation path: "+context);continue;
      }
      if(!Number.isInteger(node)||node<0||!g.nodes?.[node]){
        fail("Invalid animation target node: "+context);continue;
      }
      const identity=node+":"+path;
      if(targets.has(identity))fail("Duplicate animation channel targeting "+identity+" in "+animation.name);
      targets.add(identity);
      const sampler=animation.samplers[channel?.sampler];
      if(!Number.isInteger(channel?.sampler)||!sampler){
        fail("Missing sampled keyframe data for "+context);continue;
      }
      const interpolation=sampler.interpolation??"LINEAR";
      if(!["LINEAR","STEP"].includes(interpolation)){
        fail("Unreviewed interpolation "+interpolation+" for "+context);continue;
      }
      const times=takeFloats(sampler.input,"SCALAR",context+" time");
      const values=takeFloats(sampler.output,path==="rotation"?"VEC4":"VEC3",context+" values");
      if(!times||!values)continue;
      if(times.count<1||times.count!==values.count||times.count>MAX_FRAMES){
        fail("Animation time/value lengths mismatch in "+context);continue;
      }
      for(let i=0;i<times.count;i++){
        const t=times.data[i];
        if(t<0||(i>0&&t<=times.data[i-1])){
          fail("Nonmonotonic or negative animation timestamps in "+context);break;
        }
        if(path==="rotation"){
          const a=i*4;
          const q=values.data;
          const norm=Math.hypot(q[a],q[a+1],q[a+2],q[a+3]);
          if(Math.abs(norm-1)>0.001){
            fail("Invalid rotation quaternion norm in "+context+" frame "+i);break;
          }
        }
      }
    }
  }
  return {valid:errors.length===0,errors,productionApproved:false};
}
module.exports={validateAnimationBytes};
