#!/usr/bin/env node
/* QSOURCE_I18N_BATCH01_GUARD · Q1–Q5, nine locales, canonical links,
   native-browser navigation separation, true German fallback, Arabic integrity. */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";
import {fileURLToPath} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../..");
const batchPath=path.join(root,"q/_registry/source-locales-01-05.json");
const runtimePath=path.join(root,"q/_registry/source-locale-runtime-01-05.js");
const batch=JSON.parse(fs.readFileSync(batchPath,"utf8"));
const runtime=fs.readFileSync(runtimePath,"utf8");
new vm.Script(runtime,{filename:"source-locale-runtime-01-05.js"});
const codes=["de","ar","en","tr","ku","ckb","bs","fr","es"];
assert.deepEqual(batch.requiredLocales,codes);
assert.equal(batch.schemaVersion,1);
assert.equal(batch.batch.start,1);
assert.equal(batch.batch.end,5);
assert.deepEqual(Object.keys(batch.cards),["1","2","3","4","5"]);
for(const code of codes){
 const ui=batch.ui[code];
 assert.ok(ui,"Missing global UI "+code);
 for(const key of ["language","header","speaker","topic","sources","pending","internal"])
  assert.ok(typeof ui[key]==="string"&&ui[key].trim().length>=2,`Global UI ${code}.${key} missing`);
}
assert.match(runtime,/darAdultPreferredLocaleV1/);
assert.match(runtime,/\.approved===true/);
assert.doesNotMatch(runtime,/location\.(?:assign|replace|reload)\s*\(|window\.location\s*=/);
assert.doesNotMatch(runtime,/history\.(?:pushState|replaceState)/);
assert.match(runtime,/\.qsource-section p:not\(\.qsource-arabic\)/);
const expectedSourceFingerprints={"1":"feba52a9","2":"a272871a","3":"45dfd423","4":"92598c7f","5":"fb76ec82"};
function fnv(s){let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0}return h.toString(16).padStart(8,"0")}
for(let n=1;n<=5;n++){
 const html=fs.readFileSync(path.join(root,`q/${n}/index.html`),"utf8");
 const links=[...html.matchAll(/<a\b[^>]*class="qsource-link[^"]*"[^>]*href="([^"]+)"/g)].map(m=>m[1]);
 const canonical=html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
 assert.equal(canonical,`https://dar-al-tawhid.de/q/${n}/`,"Canonical URL changed");
 assert.equal(links.length,4,"Evidence link count changed for Q"+n);
 assert.equal(fnv(JSON.stringify([canonical,...links])),expectedSourceFingerprints[n],
  "Original evidence URLs changed for Q"+n);
 assert.equal((html.match(/source-locale-runtime-01-05\.js/g)||[]).length,1,
  "Q"+n+" needs one, and only one, locale adapter");
 const card=batch.cards[String(n)];
 assert.deepEqual(Object.keys(card),codes,"Q"+n+" missing a language");
 for(const code of codes){
  const v=card[code];
  assert.equal(v.approved,code==="de","Do not publish unreviewed translation: Q"+n+" "+code);
  for(const key of ["title","quote","speaker","topic","section","note"])
   assert.ok(typeof v[key]==="string"&&v[key].trim().length>4,`Q${n} ${code}.${key} missing`);
  assert.equal(v.actions.length,4,`Q${n} ${code} must label all source actions`);
  assert.ok(v.actions.every(s=>typeof s==="string"&&s.trim().length>=3));
 }
 if(n===5)assert.match(html,/<p class="qsource-arabic">وَلَا يَصْلُحُ آخِرُ هَذِهِ الْأُمَّةِ/);
}
function node(tag="div",text=""){
 return {tagName:tag,textContent:text,hidden:false,attrs:{},children:[],handlers:{},value:"",
  setAttribute(k,v){this.attrs[k]=String(v)},
  getAttribute(k){return this.attrs[k]||null},
  appendChild(child){this.children.push(child);return child},
  addEventListener(k,fn){(this.handlers[k]??=[]).push(fn)}};
}
async function simulate(n,search,stored,payload=batch){
 const values={
  ".qsource-brand-top":node("p","German original header"),
  ".qsource-title":node("h2","German original title"),
  ".qsource-quote":node("p","German original quotation"),
  ".qsource-meta-row:nth-child(1) .qsource-meta-value":node("div","Original speaker"),
  ".qsource-meta-row:nth-child(2) .qsource-meta-value":node("div","Original topic"),
  ".qsource-meta-row:nth-child(3) .qsource-meta-value":node("div","Original source references"),
  ".qsource-section-title":node("h3","German original section"),
  ".qsource-section p:not(.qsource-arabic)":node("p","German original note"),
  ".qsource-header":node("header")
 };
 const arabicOriginal=node("p","وَلَا يَصْلُحُ آخِرُ هَذِهِ الْأُمَّةِ إِلَّا مَا أَصْلَحَ أَوَّلَهَا");
 const labels=[node("div","Sprecher"),node("div","Thema"),node("div","Quellen")];
 const actions=Array.from({length:4},(_,i)=>node("span","Original action "+i));
 const subtitles=Array.from({length:4},(_,i)=>node("span","Original subtitle "+i));
 const refUrls=["https://dorar.net/source/1","https://archive.org/book.pdf"];
 values[".qsource-header"].parentNode={insertBefore(el){this.inserted=el}};
 const root=node("main");
 root.querySelector=s=>values[s]||null;
 root.querySelectorAll=s=>s===".qsource-meta-label"?labels:s===".qsource-link-title"?actions:s===".qsource-link-sub"?subtitles:[];
 const ids={};
 const doc={
  baseURI:`https://dar-al-tawhid.de/q/${n}/${search}`,
  body:{classList:{contains(c){return c==="qsource-body"}}},
  documentElement:node("html"),
  head:{appendChild(el){ids[el.id]=el}},
  title:"",
  querySelector(s){
   if(s==='link[rel="canonical"]')return {getAttribute(){return `https://dar-al-tawhid.de/q/${n}/`}};
   if(s===".qsource-page")return root;
   return null;
  },
  getElementById(id){return ids[id]||null},
  createElement(tag){
   const el=node(tag);
   Object.defineProperty(el,"id",{get(){return this._id},set(v){this._id=v;ids[v]=this}});
   return el;
  }
 };
 const location={href:doc.baseURI,assign(){throw Error("No navigation is permitted")}};
 const store={darAdultPreferredLocaleV1:stored};
 const localStorage={getItem(k){return store[k]||null},setItem(k,v){store[k]=v}};
 const window={addEventListener(){}};
 const ctx={document:doc,window,location,localStorage,fetch:async()=>({ok:true,json:async()=>payload}),URL};
 vm.runInNewContext(runtime,ctx,{timeout:3000});
 for(let i=0;i<8;i++)await Promise.resolve();
 return {doc,root,values,arabicOriginal,ids,store,refUrls,select:ids.qSourceFirstFiveLocaleSelect,notice:values[".qsource-header"].parentNode.inserted?.children?.[2]};
}
let src=await simulate(5,"?lang=ar","tr");
assert.equal(src.select.value,"ar","Explicit language must take precedence over saved setting");
assert.equal(src.values[".qsource-quote"].textContent,"German original quotation","Unreviewed Arabic must not replace the German source");
assert.equal(src.values[".qsource-meta-row:nth-child(3) .qsource-meta-value"].textContent,"Original source references");
assert.equal(src.doc.documentElement.lang,"de");
assert.ok(src.notice&&!src.notice.hidden&&src.notice.textContent.includes("الألماني"),"Arabic review notice required");
assert.equal(src.arabicOriginal.textContent,"وَلَا يَصْلُحُ آخِرُ هَذِهِ الْأُمَّةِ إِلَّا مَا أَصْلَحَ أَوَّلَهَا","Arabic evidence must be immutable");
src.select.value="bs";
src.select.handlers.change[0]();
assert.equal(src.select.value,"bs");
assert.equal(src.store.darAdultPreferredLocaleV1,"bs","Selection must persist in existing app language preference");
assert.ok(src.notice.textContent.includes("njemački"),"Fallback must speak the selected UI language");
assert.equal(src.values[".qsource-title"].textContent,"German original title");
assert.equal(src.doc.documentElement.dir,"ltr");
const review=JSON.parse(JSON.stringify(batch));
review.cards["5"].ckb.approved=true;
let preview=await simulate(5,"?lang=ckb","",review);
assert.equal(preview.values[".qsource-title"].textContent,review.cards["5"].ckb.title,"Approved draft would be readable in the chosen language");
assert.equal(preview.doc.documentElement.lang,"ckb");
assert.equal(preview.doc.documentElement.dir,"rtl","Approved Sorani uses RTL");
assert.equal(preview.values[".qsource-section p:not(.qsource-arabic)"].textContent,review.cards["5"].ckb.note);
assert.equal(preview.arabicOriginal.textContent,src.arabicOriginal.textContent,"Approved localization must not change Arabic evidence");
assert.equal(preview.notice.hidden,true);
console.log("QSOURCE_I18N_BATCH01_GUARD OK: 5 Q pages × 9 complete locale drafts, immutable 20 source links, standalone navigation, review-gated Arabic and saved-language precedence.");
