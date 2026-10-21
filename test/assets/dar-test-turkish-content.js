/* DĀR AL TAWḤĪD · DAR TEST-only canonical adult post translation reader.
 * No AI calls, no API key, no writes. German originals remain authoritative.
 * A Turkish text is shown ONLY with matching source hash and editorial approvals.
 */
(function(global){
"use strict";
const KEY="darAdultPreferredLocaleV1";
const VALID_ID=/^[a-z0-9][a-z0-9-]{2,119}$/;
function parsePost(raw){
 const m=String(raw).match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
 if(!m)throw Error("German canonical frontmatter missing");
 const meta={};
 for(const line of m[1].split(/\r?\n/)){
  const pair=line.match(/^([a-zA-Z_][\w-]*):\s*(.+)$/);
  if(pair)meta[pair[1]]=pair[2].trim().replace(/^["']|["']$/g,"");
 }
 return {meta,body:String(raw).slice(m[0].length).trim()};
}
function getLocale(){
 try{return global.localStorage?.getItem(KEY)==="tr"?"tr":"de"}catch(_){return"de"}
}
function setLocale(lang){
 if(lang!=="tr"&&lang!=="de")return false;
 try{global.localStorage?.setItem(KEY,lang)}catch(_){}
 if(typeof global.dispatchEvent==="function"&&typeof global.CustomEvent==="function")
  global.dispatchEvent(new global.CustomEvent("dar-adult-locale-changed",{detail:{locale:lang}}));
 return true;
}
function create(options={}){
 const fetcher=options.fetcher||global.fetch?.bind(global);
 const subtle=options.subtle||global.crypto?.subtle;
 const Encoder=options.TextEncoder||global.TextEncoder;
 if(typeof fetcher!=="function"||!subtle||!Encoder)throw Error("Same-origin fetch and SHA-256 required");
 const cache=new Map();
 async function read(url,format){
  if(!cache.has(url)){
   cache.set(url,(async()=>{
    const response=await fetcher(url,{credentials:"same-origin",cache:"no-store"});
    if(!response.ok)throw Error("Content HTTP "+response.status+" at "+url);
    return format==="json"?response.json():response.text();
   })());
  }
  return cache.get(url);
 }
 async function digest(value){
  const bytes=new Encoder().encode(JSON.stringify(value));
  const buffer=await subtle.digest("SHA-256",bytes);
  return Array.from(new Uint8Array(buffer),n=>n.toString(16).padStart(2,"0")).join("");
 }
 function fallback(id,fields,reason,language){
  return {id,requestedLocale:language,displayLocale:"de",status:reason,fields,pending:language!=="de",
   notice:language==="tr"?"Türkçe çeviri henüz kaynak ve dil incelemesinden geçmedi. Almanca asıl metin gösteriliyor.":""};
 }
 async function getPost(slug,locale=getLocale()){
  if(!VALID_ID.test(String(slug)))throw Error("Invalid canonical post ID");
  const lang=locale==="tr"?"tr":"de",id="post:"+slug;
  const sourcePath="/content/posts/"+slug+".md";
  const [raw,index]=await Promise.all([read(sourcePath,"text"),read("/content/posts/posts-index.json","json")]);
  const post=parsePost(raw),fields={title:post.meta.title||slug+".md",body:post.body};
  const listed=Array.isArray(index?.files)&&index.files.some(f=>(typeof f==="string"?f:f?.name)===slug+".md");
  if(!listed||post.meta.status!=="published")return fallback(id,fields,"unpublished",lang);
  if(lang==="de")return fallback(id,fields,"original",lang);
  let manifest;
  try{manifest=await read("/content/i18n/adult-posts/"+slug+".json","json")}
  catch(_){return fallback(id,fields,"translation-unavailable",lang)}
  if(manifest?.contentId!==id||manifest?.postId!==slug||manifest?.canonicalPath!==sourcePath
    ||manifest?.canonicalLocale!=="de"||manifest?.kidsExcluded!==true)
   return fallback(id,fields,"invalid-manifest",lang);
  const immutable={source:post.meta.source||"",book:post.meta.book||"",scholar:post.meta.scholar||"",
   date:post.meta.date||"",originalFile:slug+".md",sourceReviewBlocked:false};
  const currentHash=await digest({fields,immutable});
  if(currentHash!==manifest.sourceHash)return fallback(id,fields,"stale-source",lang);
  const tr=manifest.languages?.tr;
  if(!tr||tr.status!=="approved"||tr.publicDisplayAllowed!==true)
   return fallback(id,fields,"awaiting-review",lang);
  if(typeof tr.path!=="string"||
    !new RegExp("^/desktop-preview/i18n-core-v1/translations/tr/post/"+slug+"-[0-9a-f]{10}\\.json$").test(tr.path))
   return fallback(id,fields,"invalid-translation-path",lang);
  let translation;
  try{translation=await read(tr.path,"json")}catch(_){return fallback(id,fields,"translation-unavailable",lang)}
  const reviewer=translation?.reviewer;
  if(translation?.id!==id||translation?.locale!=="tr"||translation?.sourceHash!==currentHash
    ||translation?.status!=="approved"||!translation?.reviewedAt
    ||!reviewer?.linguistic||!reviewer?.religious||reviewer?.arabicOriginalChecked!==true
    ||reviewer?.sourcesChecked!==true||typeof translation?.fields?.title!=="string"
    ||!translation.fields.title.trim()||typeof translation.fields.body!=="string"
    ||!translation.fields.body.trim())return fallback(id,fields,"unverified-translation",lang);
  return {id,requestedLocale:lang,displayLocale:"tr",status:"approved",pending:false,
   fields:{title:translation.fields.title,body:translation.fields.body},originalFields:fields,
   sourceReference:manifest.sourcePath,sourceHash:currentHash};
 }
 return {getPost,clearCache:()=>cache.clear()};
}
global.DarTestTurkishContent={create,getLocale,setLocale,storageKey:KEY};
})(window);
