#!/usr/bin/env node
/* Pack machine-reviewed adult drafts for DAR TEST. Never marks them approved. */
"use strict";
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"../..");
const checkpoint=JSON.parse(fs.readFileSync(path.join(root,"desktop-preview/i18n-core-v1/content-batch-checkpoint.json"),"utf8"));
if(checkpoint.humanApproval!==false)throw Error("Checkpoint must not claim human approval");
const notices={
 ar:"هذه مسودة راجعتها الآلة، وليست إجازة بشرية لغوية أو شرعية. يبقى النص الألماني هو الأصل المعتمد.",
 en:"This is a machine-reviewed draft, not a human linguistic or religious approval. The German text remains authoritative.",
 tr:"Bu, makineyle gözden geçirilmiş bir taslaktır; insan eliyle dil veya din onayı değildir. Almanca metin esas olmaya devam eder.",
 ku:"Ev reşnûveyeke bi makîneyê kontrolkirî ye, ne pejirandineke mirovî ya zimanî an dînî ye. Metna almanî desthilatdar dimîne.",
 ckb:"ئەمە ڕەشنووسێکی پێداچوونەوەی ئامێرە، نەک پەسەندی مرۆیی زمانی یان شەرعی. دەقی ئەڵمانی دەسەڵاتدار دەمێنێت.",
 bs:"Ovo je strojno pregledan nacrt, a ne ljudsko jezičko ili vjersko odobrenje. Njemački tekst ostaje mjerodavan.",
 fr:"Ceci est un brouillon relu par machine, et non une approbation humaine linguistique ou religieuse. Le texte allemand reste déterminant.",
 es:"Este es un borrador revisado por máquina, no una aprobación humana lingüística ni religiosa. El texto alemán sigue siendo la referencia."
};
const stale={
 ar:"هذه المسودة لا تطابق المراجعة الألمانية الحالية. يبقى النص الألماني هو الأصل.",
 en:"This draft does not match the current German revision. The German text remains authoritative.",
 tr:"Bu taslak güncel Almanca revizyonla uyuşmuyor. Almanca metin esas kalır.",
 ku:"Ev reşnûve bi revîzyona almanî ya niha re li hev nayê. Metna almanî desthilatdar dimîne.",
 ckb:"ئەم ڕەشنووسە لەگەڵ پێداچوونەوەی ئێستای ئەڵمانی ناگونجێت. دەقی ئەڵمانی دەسەڵاتدار دەمێنێت.",
 bs:"Ovaj nacrt ne odgovara trenutnoj njemačkoj reviziji. Njemački tekst ostaje mjerodavan.",
 fr:"Ce brouillon ne correspond pas à la révision allemande actuelle. Le texte allemand reste déterminant.",
 es:"Este borrador no coincide con la revisión alemana actual. El texto alemán sigue siendo la referencia."
};
const missing={
 ar:"لا توجد بعد مسودة لهذه اللغة. يبقى النص الألماني هو الأصل.",
 en:"No draft exists yet for this language. The German text remains authoritative.",
 tr:"Bu dil için henüz taslak yok. Almanca metin esas kalır.",
 ku:"Ji bo vê zimanê hê reşnûve tune ye. Metna almanî desthilatdar dimîne.",
 ckb:"بۆ ئەم زمانە هێشتا ڕەشنووس نییە. دەقی ئەڵمانی دەسەڵاتدار دەمێنێت.",
 bs:"Za ovaj jezik još nema nacrta. Njemački tekst ostaje mjerodavan.",
 fr:"Il n’existe pas encore de brouillon pour cette langue. Le texte allemand reste déterminant.",
 es:"Todavía no hay un borrador para esta lengua. El texto alemán sigue siendo la referencia."
};
function drafts(locale){
 const dir=path.join(root,"desktop-preview/i18n-core-v1/translations",locale,"post");
 if(!fs.existsSync(dir))return [];
 return fs.readdirSync(dir).filter(name=>name.endsWith(".json")).map(name=>JSON.parse(fs.readFileSync(path.join(dir,name),"utf8")));
}
const byLocale=Object.fromEntries(checkpoint.locales.map(locale=>[locale,drafts(locale)]));
const records={};
for(const item of checkpoint.items){
 if(item.humanApproval!==false||item.status!=="draft")throw Error("Checkpoint item is not an unapproved draft: "+item.id);
 const translations={};
 let immutable=null;
 for(const locale of checkpoint.locales){
  let matches=byLocale[locale].filter(doc=>doc.id===item.id&&doc.sourceHash===item.sourceHash);
  if(matches.length>1){
   const preferred=matches.filter(doc=>doc.draftStatus==="machine-reviewed-draft"&&doc.humanApproval===false&&doc.reviewer===null);
   if(preferred.length===1)matches=preferred;
  }
  if(matches.length!==1)throw Error("Missing matching draft for "+item.id+" "+locale);
  const doc=matches[0];
  if(doc.status!=="draft"||doc.humanApproval!==false||doc.reviewer!==null)throw Error("Draft is not machine-only: "+item.id+" "+locale);
  if(doc.machineReview?.humanLinguisticApproval!==false||doc.machineReview?.humanReligiousApproval!==false)throw Error("Human approval flag is not false");
  translations[locale]={title:doc.fields.title,body:doc.fields.body};
  immutable=doc.immutable;
 }
 records[item.id]={id:item.id,sourceHash:item.sourceHash,status:"draft",humanApproval:false,immutable,translations};
}
const pack={
 schemaVersion:1,
 scope:"dar-test-machine-drafts-only",
 status:"draft",
 humanApproval:false,
 paidApiCalls:0,
 rtlLocales:["ar","ckb"],
 locales:checkpoint.locales,
 notices,stale,missing,
 records
};
const out=path.join(__dirname,"adult-content-machine-drafts.json");
fs.writeFileSync(out,JSON.stringify(pack,null,2)+"\n");
console.log(JSON.stringify({records:Object.keys(records).length,locales:checkpoint.locales.length,humanApproval:false,output:path.relative(root,out)},null,2));
