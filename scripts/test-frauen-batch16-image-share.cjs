#!/usr/bin/env node
"use strict";
/* Exercise the actual localized image-export adapter, without modifying the
   immutable Frauen renderer. 144 combinations, real text layout with a mocked
   Canvas2D surface. No network, app deployment, or notification. */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,".."),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),"utf8"));
const batch=read("content/admin/frauen-batch-16-2026-11-18.json");
const locales=read("assets/frauen/frauen-entry-locales-v1.json");
const original=fs.readFileSync(path.join(root,"assets/frauen/frauen-entry-locale-v1.js"),"utf8");
assert.match(original,/function localImageExport\(/,"Localized picture exporter missing");
assert.match(original,/if\(kind==="image"\|\|kind==="ig"\)/,"Picture actions must be captured by locale overlay");
assert.match(original,/url:canonicalUrl\|\|w\.location\.href/,"Image-export fallback must preserve the original article URL");
assert.match(original,/localImageExport\(item,kind==="ig",url\)/,"Capture the article URL before asynchronous image rendering");
assert.match(original,/typeof w\.alert==="function"/,"Image export errors must be visible to visitors");
const code=original.replace("  function userShare(ev){","  w.__TEST_LOCAL_IMAGE_EXPORT=localImageExport;\n  function userShare(ev){");
assert.notEqual(code,original,"Cannot access image exporter");
const norm=s=>String(s||"").replace(/\s+/g," ").trim();
let font="400 16px Arial",direction="ltr",align="left",drawn=[],lastShare=null;
const gradient={addColorStop(){}};
const ctx=new Proxy({},{
 get(_,k){
  if(k==="measureText")return s=>({width:Array.from(String(s)).length*12});
  if(k==="createLinearGradient"||k==="createRadialGradient")return ()=>gradient;
  if(k==="fillText")return (s,x,y)=>drawn.push({text:String(s),font,direction,align,x,y});
  if(k==="font")return font;
  if(k==="direction")return direction;
  if(k==="textAlign")return align;
  return typeof k==="symbol"?undefined:()=>{};
 },
 set(_,k,v){
  if(k==="font")font=String(v);
  if(k==="direction")direction=String(v);
  if(k==="textAlign")align=String(v);
  return true;
 }
});
class ImageMock{constructor(){this.naturalWidth=1200;this.naturalHeight=1400;this.width=1200;this.height=1400;}set src(v){if(this.onload)this.onload()}}
class FileMock{constructor(content,name,props){this.name=name;this.content=content;this.type=props.type}}
const canvas={getContext:()=>ctx,toBlob:done=>done({type:"image/png",size:16})};
const doc={readyState:"complete",fonts:{ready:Promise.resolve()},body:{},querySelector(){return null},querySelectorAll(){return []},getElementById(){return null},addEventListener(){},createElement(name){assert.equal(name,"canvas");return canvas}};
const win={
 document:doc,location:{href:"https://dar-al-tawhid.de/#frauen",origin:"https://dar-al-tawhid.de",pathname:"/",hash:"#frauen"},
 Image:ImageMock,File:FileMock,addEventListener(){},requestAnimationFrame:f=>f(),
 navigator:{share(p){lastShare=p;return Promise.resolve()},canShare(p){return Array.isArray(p.files)&&p.files.length>0}},
 localStorage:{getItem(){return"de"}},
 fetch:async()=>({ok:true,json:async()=>locales})
};
vm.runInNewContext(code,{window:win,document:doc,URL,Promise,console,MutationObserver:class{observe(){}},requestAnimationFrame:f=>f()},{filename:"frauen-entry-locale-v1.js",timeout:10000});
assert.equal(typeof win.__TEST_LOCAL_IMAGE_EXPORT,"function");
(async()=>{
 let checked=0,rtlCount=0;
 for(const record of batch.records){
  const indexed=locales.entries[record.id];
  assert.equal(indexed.area,record.area);
  for(const lang of batch.requiredLocales){
   const pack=indexed.locales[lang],isRtl=lang==="ar"||lang==="ckb";
   drawn=[];lastShare=null;font="400 16px Arial";direction="ltr";align="left";
   const item={entry:indexed,pack,code:lang};
   const result=await win.__TEST_LOCAL_IMAGE_EXPORT(item,false);
   assert.equal(result,true,"Image share failed "+record.id+" "+lang);
   assert.ok(lastShare&&Array.isArray(lastShare.files)&&lastShare.files.length>=1,"No exported file");
   const title=drawn.filter(x=>x.font.startsWith("600 ")&&x.font.includes("Georgia")&&x.y<650).map(x=>x.text).join(" ");
   const body=drawn.filter(x=>x.font.startsWith("400 ")&&x.font.includes("Georgia")).map(x=>x.text).join(" ");
   const source=drawn.filter(x=>x.font==="400 19px Arial, sans-serif").map(x=>x.text).join(" ");
   assert.ok(norm(title).startsWith(norm(pack.title)),"Missing localized title "+record.id+" "+lang);
   assert.equal(norm(body),norm(pack.statement),"Incomplete/nonlocalized statement "+record.id+" "+lang);
   assert.ok(norm(source).startsWith(norm(pack.source)),"Missing localized source "+record.id+" "+lang);
   assert.ok(drawn.some(x=>x.text===pack.labels.statement),"Statement label missing");
   assert.ok(drawn.some(x=>x.text===pack.labels.source),"Source label missing");
   const bodies=drawn.filter(x=>x.font.startsWith("400 ")&&x.font.includes("Georgia"));
   assert.ok(bodies.every(x=>x.direction===(isRtl?"rtl":"ltr")&&x.align===(isRtl?"right":"left")),"Wrong bilingual image direction");
   assert.equal(new Set(lastShare.files.map(f=>f.name)).size,lastShare.files.length,"Repeated image filenames");
   checked++;if(isRtl)rtlCount++;
  }
 }
 assert.equal(checked,144);assert.equal(rtlCount,32);
 console.log("PASS 144 localized share-image exports from protected adapter: full title, all statement lines, sources, 32 RTL layouts; frozen renderer unmodified.");
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
