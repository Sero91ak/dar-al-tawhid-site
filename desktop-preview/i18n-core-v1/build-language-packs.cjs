#!/usr/bin/env node
/* Adult localized read-only content packs.
 * Only previously reviewed, source-hash-matching translations are distributable.
 * Never replaces Arabic originals, sources, grades or answer keys.
 * node desktop-preview/i18n-core-v1/build-language-packs.cjs --inventory <file> --output <directory>
 */
"use strict";
const fs=require("node:fs"),path=require("node:path");
const args=process.argv.slice(2);
const flag=(n,def)=>{let i=args.indexOf(n);return i>=0?args[i+1]:def};
const ROOT=path.resolve(__dirname,"../.."),file=path.resolve(flag("--inventory",path.join(__dirname,"translation-worklist.json")));
const OUT=path.resolve(flag("--output",path.join(__dirname,"dist")));
const data=JSON.parse(fs.readFileSync(file,"utf8"));
const locales=["de",...data.locales.filter(x=>x!=="de")];
function read(p){try{return JSON.parse(fs.readFileSync(path.resolve(ROOT,p),"utf8"))}catch(_){return null}}
function verified(translation,item,code){
 if(item.immutable?.sourceReviewBlocked)return false;
 if(!translation||translation.status!=="approved"||translation.id!==item.id||translation.locale!==code||translation.sourceHash!==item.sourceHash)return false;
 if(!translation.reviewer?.linguistic||!translation.reviewer?.religious||!translation.reviewer?.arabicOriginalChecked||!translation.reviewer?.sourcesChecked||!translation.reviewedAt)return false;
 const orig=Object.keys(item.fields);
 return orig.every(k=>typeof item.fields[k]==="string"?typeof translation.fields?.[k]==="string"&&translation.fields[k].trim():Array.isArray(translation.fields?.[k])&&translation.fields[k].length===item.fields[k].length&&translation.fields[k].every(v=>typeof v==="string"&&v.trim()));
}
fs.mkdirSync(OUT,{recursive:true});
const manifest={schemaVersion:1,kind:"adult-multilingual-content-pack-manifest",originalLanguage:"de",packages:{},noUnverifiedTranslations:true};
for(const code of locales){
 const records=[];
 for(const item of data.items){
  if(code==="de"){
   records.push({id:item.id,kind:item.kind,sourceHash:item.sourceHash,locale:"de",translationStatus:"original",fields:item.fields,immutable:item.immutable});
   continue;
  }
  const meta=item.languages?.[code];if(meta?.state!=="approved"||!meta.translationPath)continue;
  const value=read(meta.translationPath);
  if(!verified(value,item,code))continue;
  records.push({id:item.id,kind:item.kind,sourceHash:item.sourceHash,locale:code,translationStatus:"approved",fields:value.fields,immutable:item.immutable});
 }
 const pack={schemaVersion:1,locale:code,originalLocale:"de",records};
 fs.writeFileSync(path.join(OUT,code+".json"),JSON.stringify(pack)+"\n");
 manifest.packages[code]={records:records.length,file:code+".json"};
}
fs.writeFileSync(path.join(OUT,"manifest.json"),JSON.stringify(manifest,null,2)+"\n");
console.log(JSON.stringify(manifest,null,2));
