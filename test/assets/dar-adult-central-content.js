/* Shared adult translation consumer. All clients use the same reviewed JSON at
 * /content/i18n/published/<locale>/. This TEST entry has no paid calls.
 * German source revision and immutable attribution MUST be supplied by caller.
 */
(function(global){"use strict";
if(global.DarAdultCentralContent)return;
const KEY="darAdultPreferredLocaleV1",BASE="/content/i18n/published";
const KINDS=new Set(["post","qsource","hadith","dua","quiz","learning"]);
const SUPPORTED=new Set(["de","tr","en","ar","ku","ckb","bs"]);
const NOTICES={
 tr:"Türkçe çeviri henüz onaylanmadı. Almanca asıl metin gösteriliyor.",
 en:"This translation has not yet been approved. The German original is displayed.",
 ar:"لم تُعتمد هذه الترجمة بعد. يُعرض النص الألماني الأصلي.",
 ku:"Ev werger hê nehatiye pejirandin. Nivîsa eslî ya almanî tê nîşandan.",
 ckb:"ئەم وەرگێڕانە هێشتا پەسەند نەکراوە. دەقی ئەڵمانیی ڕەسەن نیشان دەدرێت.",
 bs:"Ovaj prijevod još nije odobren. Prikazuje se njemački izvornik."
};
function locale(){try{const v=global.localStorage?.getItem(KEY);return SUPPORTED.has(v)?v:"de"}catch(_){return"de"}}
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
 function fallback(id,original,reason,requestedLocale=locale()){
  return {id,requestedLocale,displayLocale:"de",status:reason,
   pending:requestedLocale!=="de",notice:NOTICES[requestedLocale]||"",
   fields:original?.fields||{},immutable:original?.immutable||{}};
 }
 async function manifest(selectedLocale=locale()){
  if(!SUPPORTED.has(selectedLocale)||selectedLocale==="de")return null;
  try{
   const m=await once(BASE+"/"+selectedLocale+"/manifest.json");
   if(m?.schemaVersion!==1||m.locale!==selectedLocale||m.originalLocale!=="de"||
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
 async function available(kind,id,selectedLocale=locale()){
  if(!KINDS.has(kind)||typeof id!=="string"||!id.startsWith(kind+":")||
     !SUPPORTED.has(selectedLocale)||selectedLocale==="de")return false;
  const m=await manifest(selectedLocale);
  return !!(m&&m.records[id]&&m.records[id].kind===kind);
 }
 async function resolve(kind,id,original,selectedLocale=locale()){
  if(!KINDS.has(kind)||typeof id!=="string"||id.length>180||!id.startsWith(kind+":"))
    throw Error("Unsupported canonical content identity");
  if(!original||!original.fields||!original.immutable)throw Error("Canonical source fields and immutable metadata required");
  const german={fields:original.fields,immutable:original.immutable};
  const plain={id,requestedLocale:selectedLocale,displayLocale:"de",pending:false,status:"original",
   fields:german.fields,immutable:german.immutable,notice:""};
  if(selectedLocale==="de")return plain;
  if(!SUPPORTED.has(selectedLocale))throw Error("Unsupported target locale");
  const m=await manifest(selectedLocale),entry=m?.records?.[id];
  if(!entry||entry.kind!==kind)return fallback(id,german,"awaiting-review",selectedLocale);
  const currentHash=await hash(german);
  if(currentHash!==entry.sourceHash)return fallback(id,german,"stale-source",selectedLocale);
  const suffix=(await hash(id)).slice(0,10);
  const safe=id.slice(kind.length+1).replace(/[^a-zA-Z0-9._-]/g,"-").slice(0,110);
  const expected=selectedLocale+"/"+kind+"/"+safe+"-"+suffix+".json";
  if(entry.path!==expected)return fallback(id,german,"invalid-path",selectedLocale);
  let doc;
  try{doc=await once(BASE+"/"+expected)}catch(_){return fallback(id,german,"missing-translation",selectedLocale)}
  if(doc?.id!==id||doc?.kind!==kind||doc.locale!==selectedLocale||
     doc.sourceHash!==currentHash||doc.status!=="approved"||
     !fieldsMatch(original.fields,doc.fields)||
     JSON.stringify(doc.immutable)!==JSON.stringify(original.immutable))
    return fallback(id,german,"invalid-translation",selectedLocale);
  return {id,requestedLocale:selectedLocale,displayLocale:selectedLocale,pending:false,status:"approved",
   fields:doc.fields,immutable:german.immutable,sourceHash:currentHash};
 }
 const catalogueCache=new Map();
 function canonical(path){
  if(!["/content/duas/duas.json","/data/quiz-questions.json",
       "/data/learning-content.json","/content/learning/lessons-index.json"].includes(path))
    throw Error("Unknown canonical content catalogue");
  if(!catalogueCache.has(path)){
   const task=fetcher(path,{cache:"no-store",credentials:"same-origin"})
    .then(r=>{if(!r.ok)throw Error("Canonical content HTTP "+r.status);return r.json()})
    .catch(e=>{catalogueCache.delete(path);throw e});
   catalogueCache.set(path,task);
  }
  return catalogueCache.get(path);
 }
 function nonEmpty(obj){
  return Object.fromEntries(Object.entries(obj).filter(([,v])=>
   typeof v==="string"?!!v.trim():Array.isArray(v)&&v.length>0));
 }
 async function resolveById(kind,id,selectedLocale=locale()){
  if(!KINDS.has(kind)||!id?.startsWith(kind+":"))throw Error("Invalid canonical ID");
  const ref=id.slice(kind.length+1);
  let fields=null,immutable=null,record=null;
  if(kind==="dua"){
   const rows=await canonical("/content/duas/duas.json");
   if(!Array.isArray(rows))throw Error("Invalid original du'a catalogue");
   record=rows.find(d=>String(d.id)===ref);
   if(record){
    fields=nonEmpty({title:record.title||"",meaning:record.de||"",occasion:record.occasion||""});
    immutable={arabicOriginal:record.ar||"",transliteration:record.tr||"",
      source:record.src||record.source||"",type:record.type||""};
   }
  }else if(kind==="quiz"){
   const doc=await canonical("/data/quiz-questions.json");
   const rows=Array.isArray(doc)?doc:doc?.questions;
   if(!Array.isArray(rows))throw Error("Invalid original quiz catalogue");
   record=rows.find(q=>String(q.id)===ref&&q.status!=="draft");
   if(record){
    fields=nonEmpty({question:record.question||record.text||"",
       answers:Array.isArray(record.answers)?record.answers:[],
       explanation:record.explanation||"",topic:record.topic||"",category:record.category||""});
    immutable={correctIndex:record.correctIndex,source:record.source||"",
      sourceLinks:record.sourceLinks||[],sensitivity:record.sensitivity||"",
      reviewStatus:record.reviewStatus||""};
   }
  }else if(kind==="learning"){
   const targets=["/data/learning-content.json","/content/learning/lessons-index.json"];
   for(const target of targets){
    let doc=null;try{doc=await canonical(target)}catch(_){continue}
    const rows=Array.isArray(doc)?doc:Array.isArray(doc?.lessons)?doc.lessons:doc?.items;
    if(!Array.isArray(rows))continue;
    record=rows.find(l=>String(l.id)===ref);
    if(record){
     fields=nonEmpty({title:record.title||"",body:record.body||record.text||"",
       explanation:record.explanation||""});
     immutable={source:record.source||"",sourceLinks:record.sourceLinks||[]};break;
    }
   }
  }else{
   throw Error("This record type requires caller-supplied canonical fields and immutable source metadata");
  }
  if(!record||!fields||!Object.keys(fields).length)throw Error("Canonical original is not indexed");
  return resolve(kind,id,{fields,immutable},selectedLocale);
 }
 return {resolve,resolveById,available,manifest,locale,clearCache:()=>{
  requests.clear();catalogueCache.clear();}};

}
global.DarAdultCentralContent={create,locale,base:BASE,storageKey:KEY,
 scope:"shared-approved-pack-v1"};
})(window);
