/* DAR TEST adult localized content reader. Never sends browser requests to OpenAI.
 * Consumes build-language-packs.cjs outputs; the builder includes APPROVED translations only.
 * German originals remain authoritative; immutable fields are never replaced.
 */
(function(global){
 "use strict";
 function resolve(original,locale,pack){
  if(!original||typeof original!=="object"||!original.id||!original.sourceHash||!original.fields)throw Error("Canonical German record required");
  const german={id:original.id,kind:original.kind,sourceHash:original.sourceHash,
   fields:original.fields,immutable:original.immutable||{},locale:"de",pending:false,status:"original"};
  if(locale==="de")return german;
  const fallback=Object.assign({},german,{pending:true,status:"unavailable",
   notice:locale==="tr"?"Türkçe çeviri henüz ilmî ve dil incelemesinden geçmedi. Almanca özgün metin gösteriliyor.":"Übersetzung nicht freigegeben – deutscher Originaltext."});
  if(!pack||pack.locale!==locale||pack.originalLocale!=="de"||!Array.isArray(pack.records))return fallback;
  const matches=pack.records.filter(r=>r&&r.id===original.id);
  // Ambiguities and stale revisions fail closed.
  if(matches.length!==1)return fallback;
  const candidate=matches[0];
  if(candidate.locale!==locale||candidate.translationStatus!=="approved"||
    candidate.sourceHash!==original.sourceHash||candidate.kind!==original.kind)return fallback;
  const keys=Object.keys(original.fields),fields=candidate.fields;
  if(!fields||typeof fields!=="object"||Array.isArray(fields)||
    Object.keys(fields).length!==keys.length||keys.some(k=>!Object.hasOwn(fields,k)))return fallback;
  if(keys.some(k=>typeof original.fields[k]==="string"
   ?typeof fields[k]!=="string"||!fields[k].trim()
   :!Array.isArray(fields[k])||!Array.isArray(original.fields[k])||
     fields[k].length!==original.fields[k].length||fields[k].some(s=>typeof s!=="string"||!s.trim())))return fallback;
  return {id:original.id,kind:original.kind,sourceHash:original.sourceHash,
   fields,immutable:german.immutable,locale,pending:false,status:"approved"};
 }
 async function loadPack(locale,base="/test/i18n-approved/"){
  if(!/^(?:tr|ar|en|ku|ckb|bs)$/.test(locale))return null;
  const url=base+locale+".json",res=await global.fetch(url,{credentials:"same-origin",cache:"no-store"});
  if(!res.ok)return null;
  const data=await res.json();
  return data?.locale===locale&&data?.schemaVersion===1?data:null;
 }
 global.DARTestApprovedContent={resolve,loadPack};
})(window);
