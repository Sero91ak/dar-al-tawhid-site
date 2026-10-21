/* Shared adult translation consumer. All clients use the same reviewed JSON at
 * /content/i18n/published/<locale>/. This TEST entry has no paid calls.
 * German source revision and immutable attribution MUST be supplied by caller.
 */
(function(global){"use strict";
if(global.DarAdultCentralContent)return;
const KEY="darAdultPreferredLocaleV1",BASE="/content/i18n/published";
const KINDS=new Set(["post","qsource","hadith","dua","quiz","learning"]);
const NOTICE="Türkçe çeviri henüz onaylanmadı. Almanca asıl metin gösteriliyor.";
function locale(){try{return global.localStorage?.getItem(KEY)==="tr"?"tr":"de"}catch(_){return"de"}}
function create(opts={}){
 const fetcher=opts.fetcher||global.fetch?.bind(global);
 const subtle=opts.subtle||global.crypto?.subtle;
 const Encoder=opts.TextEncoder||global.TextEncoder;
 if(typeof fetcher!=="function"||!subtle||typeof Encoder!=="function")
   throw Error("Secure, same-origin SHA-256 and fetch are required");
 const requests=new Map();
 function once(url){
  if(!url.startsWith(BASE+"/"))throw Error("Only canonical translation paths allowed");
  if(!requests.has(url)){
   const task=fetcher(url,{cache:"no-store",credentials:"same-origin"})
    .then(r=>{if(!r.ok)throw Error("Content HTTP "+r.status);return r.json()})
    .catch(e=>{requests.delete(url);throw e});
   requests.set(url,task);
  }
  return requests.get(url);
 }
 async function hash(value){
  const bytes=new Encoder().encode(typeof value==="string"?value:JSON.stringify(value));
  const result=await subtle.digest("SHA-256",bytes);
  return [...new Uint8Array(result)].map(x=>x.toString(16).padStart(2,"0")).join("");
 }
 function fallback(id,original,reason){
  return {id,requestedLocale:locale(),displayLocale:"de",status:reason,
   pending:locale()==="tr",notice:locale()==="tr"?NOTICE:"",fields:original?.fields||{},
   immutable:original?.immutable||{}};
 }
 async function manifest(){
  try{
   const m=await once(BASE+"/tr/manifest.json");
   if(m?.schemaVersion!==1||m.locale!=="tr"||m.originalLocale!=="de"||
      m.onlyApproved!==true||m.scope!=="adult-only"||!m.records||
      typeof m.records!=="object"||Array.isArray(m.records))return null;
   return m;
  }catch(_){return null}
 }
 function fieldsMatch(a,b){
  if(!a||!b||Object.keys(a).sort().join("|")!==Object.keys(b).sort().join("|"))return false;
  return Object.keys(a).every(k=>{
   const v=b[k],o=a[k];
   return typeof o==="string"?typeof v==="string"&&!!v.trim():
    Array.isArray(o)&&Array.isArray(v)&&v.length===o.length&&v.every(x=>typeof x==="string"&&!!x.trim());
  });
 }
 async function available(kind,id){
  if(!KINDS.has(kind)||typeof id!=="string"||!id.startsWith(kind+":"))return false;
  const m=await manifest();
  return !!(m&&m.records[id]&&m.records[id].kind===kind);
 }
 async function resolve(kind,id,original,selectedLocale=locale()){
  if(!KINDS.has(kind)||typeof id!=="string"||id.length>180||!id.startsWith(kind+":"))
    throw Error("Unsupported canonical content identity");
  if(!original||!original.fields||!original.immutable)throw Error("Canonical source fields and immutable metadata required");
  const german={fields:original.fields,immutable:original.immutable};
  const plain={id,requestedLocale:selectedLocale,displayLocale:"de",pending:false,status:"original",
   fields:german.fields,immutable:german.immutable,notice:""};
  if(selectedLocale!=="tr")return plain;
  const m=await manifest(),entry=m?.records?.[id];
  if(!entry||entry.kind!==kind)return {...fallback(id,german,"awaiting-review"),requestedLocale:"tr",pending:true};
  const currentHash=await hash(german);
  if(currentHash!==entry.sourceHash)return {...fallback(id,german,"stale-source"),requestedLocale:"tr",pending:true};
  const suffix=(await hash(id)).slice(0,10);
  const safe=id.slice(kind.length+1).replace(/[^a-zA-Z0-9._-]/g,"-").slice(0,110);
  const expected="tr/"+kind+"/"+safe+"-"+suffix+".json";
  if(entry.path!==expected)return {...fallback(id,german,"invalid-path"),requestedLocale:"tr",pending:true};
  let doc;
  try{doc=await once(BASE+"/"+expected)}catch(_){return {...fallback(id,german,"missing-translation"),requestedLocale:"tr",pending:true}}
  if(doc?.id!==id||doc?.kind!==kind||doc.locale!=="tr"||
     doc.sourceHash!==currentHash||doc.status!=="approved"||
     !fieldsMatch(original.fields,doc.fields)||
     JSON.stringify(doc.immutable)!==JSON.stringify(original.immutable))
    return {...fallback(id,german,"invalid-translation"),requestedLocale:"tr",pending:true};
  return {id,requestedLocale:"tr",displayLocale:"tr",pending:false,status:"approved",
   fields:doc.fields,immutable:german.immutable,sourceHash:currentHash};
 }
 return {resolve,available,manifest,locale,clearCache:()=>requests.clear()};
}
global.DarAdultCentralContent={create,locale,base:BASE,storageKey:KEY,
 scope:"shared-approved-pack-v1"};
})(window);
