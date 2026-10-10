/* Convert the existing indexed DĀR Qur'an Tadabbur records to per-Sūrah
   preview-only lookup files. Never edit the canonical source files. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve('apple-tv/quran/tadabbur');
const out=path.resolve('.quran-preview-assets/tadabbur');
const index=JSON.parse(fs.readFileSync(path.join(root,'entries-index.json'),'utf8'));
if(!Array.isArray(index.files)||index.files.length<100)throw Error('Canonical index is missing');
const items=new Map(),surahs=Array.from({length:114},()=>({}));
let count=0;
for(const file of index.files){
  if(!/^entries(?:-[a-zA-Z0-9-]+)?\.json$/.test(file.path))throw Error('Invalid canonical filename '+file.path);
  const canonical=JSON.parse(fs.readFileSync(path.join(root,file.path),'utf8'));
  if(!Array.isArray(canonical.entries))throw Error('Missing canonical entries in '+file.path);
  if(canonical.entries.length!==file.count)throw Error('Canonical count mismatch for '+file.path);
  for(const row of canonical.entries){
    const m=/^([1-9]\d{0,2}):([1-9]\d{0,2})$/.exec(String(row.reference||''));
    if(!m)throw Error('Invalid exact reference '+row.reference);
    const surah=Number(m[1]),ayah=Number(m[2]);
    if(surah>114||ayah>286||!row.text||!row.source||!row.narrator)throw Error('Incomplete canonical record '+row.reference);
    if(items.has(row.reference))throw Error('Duplicate canonical reference '+row.reference+' from '+file.path+' and '+items.get(row.reference));
    items.set(row.reference,file.path);
    surahs[surah-1][ayah]={
      reference:row.reference,
      text:row.text,
      narrator:row.narrator,
      generation:row.generation||'',
      source:row.source,
      grading:row.grading||'',
      relation:row.relation||'',
      note:row.note||'',
      sourceUrl:/^https:\/\//.test(row.sourceUrl||'')?row.sourceUrl:''
    };
    count++;
  }
}
if(count!==index.totalVerifiedEntries)throw Error('Canonical total mismatch: '+count+' vs '+index.totalVerifiedEntries);
fs.mkdirSync(out,{recursive:true});
let totalBytes=0;
for(let surah=1;surah<=114;surah++){
  const file=path.join(out,String(surah).padStart(3,'0')+'.json');
  const payload=JSON.stringify({schemaVersion:'1.0',origin:'DĀR AL TAWḤĪD canonical Tadabbur index',surah,entries:surahs[surah-1]});
  fs.writeFileSync(file,payload,'utf8');totalBytes+=Buffer.byteLength(payload);
}
console.log('CANONICAL_PREVIEW_TADABBUR_OK entries='+count+' files=114 bytes='+totalBytes);
