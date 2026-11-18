#!/usr/bin/env node
"use strict";
/* Real image-export function (in-memory canvas harness): 16 canonical records x
   nine adult locales, preserving direction, title, statement and source.
   Never writes to the website and never sends images or notifications. */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,".."),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),"utf8"));
const batch=read("content/admin/frauen-batch-16-2026-11-18.json");
const locales=read("assets/frauen/frauen-entry-locales-v1.json");
const data=Object.fromEntries([...new Set(batch.records.map(r=>r.sourceFile))].map(p=>[p,read(p)]));
const original=fs.readFileSync(path.join(root,"assets/frauen/frauen-fiqh.js"),"utf8");
assert.match(original,/async function frauenImageFiles\(/);
assert.match(original,/var localized = null;/);
assert.match(original,/window\.DARFrauenEntryLocaleV1/);
const modified=original.replace("  window.DARFrauenFiqh = {","  window.__FRAUEN_IMAGE_TEST = frauenImageFiles;\n  window.DARFrauenFiqh = {");
assert.notEqual(modified,original,"Exporter could not be accessed for test");
const norm=s=>String(s||"").replace(/\s+/g," ").trim();
class ImageMock {
 constructor(){this.naturalWidth=1080;this.naturalHeight=1350;this.width=1080;this.height=1350;}
 set src(v){this._src=v;if(typeof this.onload==="function")this.onload();}
}
const drawn=[];
const gradient={addColorStop(){}};
let font="400 18px Arial",direction="ltr",textAlign="left";
const ctx=new Proxy({},{
 get(obj,k){
  if(k==="measureText")return s=>({width:Array.from(String(s)).length*13});
  if(k==="createLinearGradient"||k==="createRadialGradient")return ()=>gradient;
  if(k==="fillText")return (s,x,y)=>drawn.push({text:String(s),font,direction,textAlign,x,y});
  if(k==="font")return font;
  if(k==="direction")return direction;
  if(k==="textAlign")return textAlign;
  return typeof k==="symbol"?undefined:()=>{};
 },
 set(obj,k,v){
  if(k==="font")font=String(v);
  if(k==="direction")direction=String(v);
  if(k==="textAlign")textAlign=String(v);
  return true;
 }
});
const canvas={getContext:()=>ctx,toBlob:fn=>fn({type:"image/png",size:10})};
const document={body:{setAttribute(){}},fonts:{ready:Promise.resolve()},createElement:k=>{assert.equal(k,"canvas");return canvas},addEventListener(){},querySelector(){return null},querySelectorAll(){return []}};
const window={document,location:{hash:"#frauen",href:"https://dar-al-tawhid.de/#frauen",pathname:"/",origin:"https://dar-al-tawhid.de"}};
const vmContext={
 window,document,location:window.location,Image:ImageMock,URL,
 File:class {constructor(chunks,name,options){this.name=name;this.options=options;}},
 navigator:{},console,Promise,requestAnimationFrame:fn=>fn()
};
vm.runInNewContext(modified,vmContext,{filename:"frauen-fiqh.js",timeout:10000});
assert.equal(typeof window.__FRAUEN_IMAGE_TEST,"function");
(async()=>{
 let verified=0,rtl=0;
 for(const r of batch.records){
   const e=data[r.sourceFile].eintraege.find(v=>v.kennung===r.id);
   assert.ok(e,"Missing original source record");
   assert.equal(e.quellenstatus,"nicht-anzeigen","Do not publish during test");
   for(const lang of batch.requiredLocales){
     const pack=locales.entries[r.id].locales[lang],isRtl=lang==="ar"||lang==="ckb";
     window.DARFrauenEntryLocaleV1={current:id=>{
       assert.equal(id,r.id);
       return {id:r.id,area:r.area,dir:isRtl?"rtl":"ltr",
         title:pack.title,statement:pack.statement,source:pack.source,
         statementLabel:pack.labels.statement,sourceLabel:pack.labels.source};
     }};
     font="400 18px Arial";direction="ltr";textAlign="left";drawn.length=0;
     const files=await window.__FRAUEN_IMAGE_TEST(r.area,e);
     assert.ok(files.length>=1,"No images generated for "+r.id+" "+lang);
     const title=drawn.filter(x=>/^600\s/.test(x.font)).map(x=>x.text).join(" ");
     const body=drawn.filter(x=>/^400\s/.test(x.font)&&x.font.includes("Georgia")).map(x=>x.text).join(" ");
     const source=drawn.filter(x=>/^500\s/.test(x.font)&&x.font.includes("Arial")).map(x=>x.text).join(" ");
     const statement=norm(pack.statement).replace(/^(?:AUSSAGE|STATEMENT)\s*[:·–—-]?\s*/i,"").trim();
     assert.ok(norm(title).includes(norm(pack.title)),lang+" title not translated: "+r.id);
     assert.equal(norm(body),statement,lang+" picture statement incomplete or not translated: "+r.id);
     assert.equal(norm(source),norm(pack.source),lang+" picture source not translated: "+r.id);
     assert.ok(drawn.some(x=>x.text===pack.labels.statement),lang+" picture statement label not translated");
     assert.ok(drawn.some(x=>x.text===pack.labels.source),lang+" picture source label not translated");
     const bodyLines=drawn.filter(x=>/^400\s/.test(x.font)&&x.font.includes("Georgia"));
     assert.ok(bodyLines.every(x=>x.direction===(isRtl?"rtl":"ltr")&&x.textAlign===(isRtl?"right":"left")),lang+" picture bidi lost");
     assert.equal(files.length,new Set(files.map(x=>x.name)).size,"Duplicate page filenames");
     verified++;if(isRtl)rtl++;
   }
 }
 assert.equal(verified,144);assert.equal(rtl,32);
 console.log("PASS 144 localized image exports: complete statement/title/source, 32 RTL layouts, original source untouched and all 16 records still hidden.");
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
