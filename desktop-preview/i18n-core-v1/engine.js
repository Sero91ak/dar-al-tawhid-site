/* DĀR AL TAWḤĪD · adult-only internationalization & source-finder foundation.
 * Safe integration: works only inside an explicitly supplied root. Does not touch existing
 * app navigation, global document dir, service workers, prayer, audio or push state.
 * UI wording is provisional pending linguistic review; religious translations require proof.
 */
(function(global){
"use strict";
const STORAGE_KEY="darAdultPreferredLocaleV1";
const RTL=new Set(["ar","ckb"]);
function normalize(value){
 return String(value==null?"":value).toLocaleLowerCase("und").normalize("NFKD")
  .replace(/[\u0300-\u036f\u064b-\u065f\u0670\u0640]/g,"")
  .replace(/[أإآٱ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه").replace(/ؤ/g,"و").replace(/ئ/g,"ي")
  .replace(/[ʿʾʻ’']/g,"").replace(/[āīūḥḫṣḍṭẓġǧ]/g,ch=>({ā:"a",ī:"i",ū:"u",ḥ:"h",ḫ:"kh",ṣ:"s",ḍ:"d",ṭ:"t",ẓ:"z",ġ:"gh",ǧ:"j"}[ch]||ch))
  .replace(/[^\p{L}\p{N}]+/gu," ").trim().replace(/\s+/g," ");
}
function preferred(data){
 let s="";
 try{s=global.localStorage?.getItem(STORAGE_KEY)||""}catch(_){}
 if(!s){try{s=global.navigator?.language?.split("-")[0]||""}catch(_){}}
 return data?.locales?.[s]?s:"de";
}
function glossary(entries){
 const exact=new Map(),multi=[];
 (entries||[]).forEach(term=>{
  const aliases=[term.id,term.arabic,...(term.aliases||[])].filter(Boolean);
  aliases.forEach(x=>{const key=normalize(x);if(!key)return;
   if(!exact.has(key)) exact.set(key,term.id);
   if(key.includes(" ")) multi.push([key,term.id]);
  });
 });
 multi.sort((a,b)=>b[0].length-a[0].length);
 return {exact,multi};
}
const STOP=new Set("al el ul as ad at il wa was wie wo wer wann wieso warum ist sind gibt ein eine einen dem der die das den des und oder sowie im in auf am an zu zur zum über uber nach für fuer aus mit ich du wir ihr zeigen zeig suche finde erkläre erklaere erklären erklaren bitte kannst könnten meaning what is the of a an and explain tell show about me please nedir ne demek nedir neye nasıl kim".split(" "));
function canonicalTokens(str,g){
 let n=normalize(str);
 g.multi.forEach(([alias,id])=>{
  const pattern=" "+alias+" ";
  n=(" "+n+" ").split(pattern).join(" "+id+" ").trim();
 });
 return n.split(" ").filter(t=>t.length>1&&!STOP.has(t)).map(t=>g.exact.get(t)||t);
}
function editDistanceAtMostTwo(a,b){
 if(Math.abs(a.length-b.length)>2)return 3;
 let p=Array.from({length:b.length+1},(_,i)=>i);
 for(let i=1;i<=a.length;i++){
  const row=[i];for(let j=1;j<=b.length;j++)row[j]=Math.min(row[j-1]+1,p[j]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));
  p=row;
 }return p[b.length];
}
function safeSameOriginUrl(raw, origin){
 try{
  const url=new global.URL(raw||"/",origin);
  return url.origin===origin ? url.pathname+url.search+url.hash : null;
 }catch(_){return null}
}
function sanitizeRecord(record,origin){
 if(!record||typeof record!=="object")return null;
 const id=String(record.id||"").trim(),title=String(record.title||record.name||"").trim();
 if(!id||!title)return null;
 const url=safeSameOriginUrl(record.url||"/",origin);
 if(url===null)return null;
 return {id:id.slice(0,160),title:title.slice(0,260),kind:String(record.kind||"source"),summary:String(record.summary||record.excerpt||"").slice(0,500),reference:String(record.reference||"").slice(0,240),tags:Array.isArray(record.tags)?record.tags.map(String).slice(0,20):[],canonicalTerms:Array.isArray(record.canonicalTerms)?record.canonicalTerms.slice(0,20):[],url,originalLocale:String(record.originalLocale||"de"),translationStatus:record.translationStatus||{}};
}
function scoreEntry(doc,raw,g){
 const parts=canonicalTokens(raw,g);if(!parts.length)return 0;
 const title=canonicalTokens(doc.title.replace(/DĀR AL TAWḤĪD/gi,""),g), cleanRef=doc.reference.replace(/DĀR AL TAWḤĪD/gi,""), cleanSummary=doc.summary.replace(/DĀR AL TAWḤĪD/gi,""), whole=canonicalTokens([doc.title.replace(/DĀR AL TAWḤĪD/gi,""),cleanSummary,cleanRef,doc.tags.join(" "),doc.canonicalTerms.join(" ")].join(" "),g);
 const corpus=new Set(whole),titleSet=new Set(title);
 let hits=0,points=0;
 parts.forEach(t=>{
  let p=0;
  if(titleSet.has(t))p=12;
  else if(corpus.has(t))p=7;
  else if(t.length>=4&&[...titleSet].some(x=>x.startsWith(t)))p=5;
  else if(t.length>=4&&[...corpus].some(x=>x.startsWith(t)))p=3;
  else if(t.length>=5&&[...titleSet].some(x=>editDistanceAtMostTwo(x,t)<=1))p=2;
  if(p){hits++;points+=p}
 });
 if(!hits)return 0;
 return points*Math.pow(hits/parts.length,1.3)+(hits===parts.length?5:0);
}
function createEngine(options){
 const data=options.locales,termData=options.terms,root=options.root;
 if(!data||!termData||!root)throw new Error("DĀR i18n requires locales, terms and an explicit DOM root");
 let lang=preferred(data);
 const g=glossary(termData.entries),sources=new Map();
 const origin=options.origin||"https://dar-al-tawhid.de";
 function t(key,code=lang){
  const loc=data.locales[code]||data.locales.de;
  return loc?.messages?.[key]??data.locales.de.messages[key]??key;
 }
 function setLocale(code){
  if(!data.locales[code])return false;
  lang=code;
  root.setAttribute("lang",code);
  root.setAttribute("dir",data.locales[code].dir|| (RTL.has(code)?"rtl":"ltr"));
  root.querySelectorAll("[data-dar-i18n]").forEach(el=>{el.textContent=t(el.getAttribute("data-dar-i18n"))});
  root.querySelectorAll("[data-dar-i18n-placeholder]").forEach(el=>{el.setAttribute("placeholder",t(el.getAttribute("data-dar-i18n-placeholder")))});
  root.querySelectorAll("[data-dar-locale-select]").forEach(el=>{el.value=code});
  try{global.localStorage?.setItem(STORAGE_KEY,code)}catch(_){}
  if(typeof options.onLocaleChange==="function")options.onLocaleChange(code,t);
  return true;
 }
 function addSources(records){
  let count=0;
  (Array.isArray(records)?records:[]).forEach(raw=>{
   const doc=sanitizeRecord(raw,origin);
   if(doc&&!sources.has(doc.id)){sources.set(doc.id,doc);count++}
  });
  return count;
 }
 function search(question,limit=8){
  const query=String(question||"").trim();
  if(!query)return[];
  return [...sources.values()].map(doc=>({doc,score:scoreEntry(doc,query,g)}))
   .filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.doc.title.localeCompare(b.doc.title))
   .slice(0,Math.max(1,Math.min(30,limit))).map(x=>({...x.doc,relevance:x.score}));
 }
 function termSuggestions(question,limit=5){
  const n=normalize(question);if(!n)return[];
  const candidates=termData.entries.filter(row=>([row.id,row.arabic,...row.aliases].map(normalize)).some(a=>a.startsWith(n)||a.includes(" "+n)||n.includes(a)&&a.length>2));
  return candidates.slice(0,limit).map(row=>({id:row.id,arabic:row.arabic,domain:row.domain}));
 }
 function localizedBody(record,code=lang){
  // NEVER silently call a translator or substitute an unapproved religious translation.
  const translation=record?.translations?.[code];
  if(code==="de")return{locale:"de",body:String(record?.bodyDe||""),pending:false};
  if(translation?.status==="approved"&&translation?.editorialReviewed===true&&translation?.sourceId===record.id)
   return{locale:code,body:translation.body,pending:false};
  return{locale:"de",body:String(record?.bodyDe||""),pending:true,notice:t("unverified",code)};
 }
 function bind(){
  root.querySelectorAll("[data-dar-locale-select]").forEach(select=>{
   select.replaceChildren();
   Object.entries(data.locales).forEach(([key,locale])=>{
    const opt=document.createElement("option");opt.value=key;opt.textContent=locale.name;select.appendChild(opt);
   });
   select.addEventListener("change",()=>setLocale(select.value));
  });
  setLocale(lang);
 }
 return {bind,setLocale,locale:()=>lang,t,addSources,search,termSuggestions,localizedBody,stats:()=>({sources:sources.size,terms:termData.entries.length,locale:lang}),normalized:normalize};
}
global.DarAdultI18n={createEngine,normalize,canonicalTokens,scoreEntry,preferred};
})(window);
