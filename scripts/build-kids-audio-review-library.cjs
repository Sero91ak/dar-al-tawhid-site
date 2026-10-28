#!/usr/bin/env node
"use strict";
/**
 * Only indexes audio URLs already present in the canonical, checked-in
 * children's manifests. Never generates speech, publishes audio, or approves it.
 * Stable SHA-bound review IDs ensure a replaced recording needs a new decision.
 */
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const root=path.resolve(__dirname,".."),sourcePath="kids/data/audio-review-sources-v1.json";
const registry=JSON.parse(fs.readFileSync(path.join(root,sourcePath),"utf8"));
const hash=s=>crypto.createHash("sha256").update(s).digest("hex");
const MAX=16000;
const seenGlobal=new Set(),sections=[];
const asset=/^\/kids\/assets\/[a-zA-Z0-9/_-]+\.(?:mp3|m4a|aac|ogg|wav)(?:\?[a-zA-Z0-9=&._-]+)?$/i;
const pretty=x=>String(x||"").replace(/[_-]+/g," ").replace(/\s+/g," ").trim();
const take=(s,n)=>String(s||"").slice(0,n);
function gather(src){
 if(src.kind==="embedded")return {id:src.id,title:src.title,subtitle:src.subtitle,order:src.order,count:33,embedded:true,entries:[]};
 if(!/^kids\/data\/[a-z0-9-]+\.json$/.test(src.path))throw Error("Unsafe registry source: "+src.path);
 const doc=JSON.parse(fs.readFileSync(path.join(root,src.path),"utf8"));
 const entries=[],seen=new Set();
 function walk(node,stack=[],context=""){
  if(!node || typeof node!=="object")return;
  if(Array.isArray(node)){for(let i=0;i<node.length;i++)walk(node[i],stack.concat(String(i)),context);return;}
  const ownTitle=take(node.title||node.question||node.name||node.label||node.displayTitle||node.person||"",190);
  const myContext=ownTitle||context;
  if(typeof node.url==="string"&&asset.test(node.url)){
   const audioPath=node.url.split("?")[0];
   if(!seen.has(audioPath) && !seenGlobal.has(audioPath)){
    seen.add(audioPath);seenGlobal.add(audioPath);
    const clipKey=stack.slice(-2).map(pretty).join(" / ");
    const spoken=take(node.text||node.ttsText||node.spokenText||node.originalText||"",600);
    const name=take(myContext||spoken||clipKey||audioPath.split("/").pop(),180);
    const label=take(clipKey && !name.includes(clipKey)?name+" · "+clipKey:name,220);
    entries.push({
      id:hash(src.id+"\n"+audioPath+"\n"+String(node.sha256||"")).slice(0,24),
      title:label,
      text:spoken,
      url:node.url,
      sha256:typeof node.sha256==="string" && /^[a-f0-9]{64}$/.test(node.sha256)?node.sha256:null,
      durationSec:Number(node.durationSeconds||node.durationSec||node.duration||0)||null,
      modelId:take(node.modelId||doc.modelId||"",80),
      sourcePath:src.path,
      sourceKey:stack.slice(0,4).join("/").slice(0,180),
      originalApproval:Boolean(node.humanListeningApproved===true && node.approvedForPlayback===true),
      humanListeningApproved:node.humanListeningApproved===true,
      releaseEnabled:node.releaseEnabled===true,
    });
    if(entries.length>MAX)throw Error(src.id+": too many audio URLs");
   }
  }
  for(const [k,v] of Object.entries(node)){
    if(k==="sourceRefs"||k==="image"||k==="sources"||k==="artwork"||k==="policy")continue;
    if(v && typeof v==="object")walk(v,stack.concat(k),myContext);
  }
 }
 walk(doc);
 return {id:src.id,title:src.title,subtitle:src.subtitle,order:src.order,count:entries.length,embedded:false,entries};
}
for(const src of registry.sources)sections.push(gather(src));
const catalog={schemaVersion:1,kind:"nonpublic-qa-audio-index",generatedFrom:sourcePath,releaseEnabled:false,automaticApproval:false,security:"No secret URLs, only existing published assets and immutable original review recordings",sections};
const output=path.join(root,"kids-audio-review-library-v1.json");
fs.writeFileSync(output,JSON.stringify(catalog)+"\n","utf8");
const n=sections.reduce((s,x)=>s+x.count,0);
console.log("AUDIO REVIEW REGISTRY: "+sections.length+" sections, "+n+" indexed original clips; zero synthesis or approval");
for(const s of sections)console.log("  "+s.id+": "+s.count);
if(sections.find(s=>s.id==="quiz-v4").count<450 || sections.find(s=>s.id==="dua-ar").count<100 || sections.find(s=>s.id==="dua-de").count<100)throw Error("Important original audio collections missing: refused to silently publish incomplete index");
