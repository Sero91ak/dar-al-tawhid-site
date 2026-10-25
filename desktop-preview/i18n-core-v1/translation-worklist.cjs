#!/usr/bin/env node
/* DĀR AL TAWḤĪD · translation worklist, adult app only.
 * Detect every canonical text revision; NEVER translate, publish, overwrite source, or push.
 * Run: node desktop-preview/i18n-core-v1/translation-worklist.cjs [--check] [--root path] [--out path]
 */
"use strict";
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const args=process.argv.slice(2);
function param(k,def){const i=args.indexOf(k);return i<0?def:args[i+1]}
const ROOT=path.resolve(param("--root",path.join(__dirname,"../..")));
const OUT=path.resolve(param("--out",path.join(__dirname,"translation-worklist.json")));
const CHECK=args.includes("--check");
const localeCatalog=JSON.parse(fs.readFileSync(path.join(ROOT,"desktop-preview/i18n-core-v1/locales.json"),"utf8"));
if(!localeCatalog.locales?.de||localeCatalog.defaultLocale!=="de")throw Error("German canonical locale must be registered");
const LOCALES=Object.keys(localeCatalog.locales).filter(code=>code!==localeCatalog.defaultLocale);
const KINDS=["post","qsource","hadith","dua","quiz","learning"];
const read=p=>{try{return fs.readFileSync(path.join(ROOT,p),"utf8")}catch(_){return null}};
const json=p=>{try{return JSON.parse(read(p))}catch(_){return null}};
const digest=o=>crypto.createHash("sha256").update(JSON.stringify(o)).digest("hex");
const items=[],ids=new Set(),coverage={},issues=[];
function clean(v){return typeof v==="string"?v.trim():v}
function add(kind,id,sourcePath,fields,immutable){
 if(!KINDS.includes(kind)||!id)return;
 const uid=kind+":"+String(id);
 if(ids.has(uid)){issues.push({id:uid,issue:"duplicate-id"});return}
 const textFields=Object.fromEntries(Object.entries(fields||{}).filter(([k,v])=>typeof v==="string"?v.trim():Array.isArray(v)?v.length>0:false));
 if(!Object.keys(textFields).length)return;
 ids.add(uid);items.push({id:uid,kind,sourcePath,sourceHash:digest({fields:textFields,immutable}),fields:textFields,immutable:immutable||{}});
 coverage[kind]=(coverage[kind]||0)+1;
}
function frontmatter(raw){
 const match=raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
 const result={};if(!match)return {meta:result,body:raw};
 for(const line of match[1].split(/\r?\n/)){
  const m=line.match(/^([a-zA-Z_][\w-]*):\s*(.+)$/);
  if(m)result[m[1]]=m[2].trim().replace(/^["']|["']$/g,"");
 }
 return{meta:result,body:raw.slice(match[0].length).trim()};
}
function scanPosts(){
 const index=json("content/posts/posts-index.json");
 const indexed=Array.isArray(index?.files)?index.files.map(f=>typeof f==="string"?f:f?.name):[];
 let onDisk=[];
 try{onDisk=fs.readdirSync(path.join(ROOT,"content/posts")).filter(name=>name.endsWith(".md"))}
 catch(_){if(!indexed.length)issues.push({kind:"post",issue:"posts-directory-unavailable"})}
 const candidates=[...new Set([...indexed,...onDisk])];
 for(const name of candidates){
  if(!/^[a-zA-Z0-9_.-]+\.md$/.test(name||""))continue;
  const sourcePath="content/posts/"+name,raw=read(sourcePath);
  if(raw===null){issues.push({kind:"post",file:name,issue:"indexed-file-missing"});continue}
  const {meta,body}=frontmatter(raw);
  if(meta.status==="draft"||meta.status==="unpublished")continue;
  const inPublishedIndex=indexed.includes(name);
  if(!inPublishedIndex)issues.push({kind:"post",file:name,issue:"unindexed-post-held-for-review"});
  add("post",meta.id||name.replace(/\.md$/,""),sourcePath,{title:meta.title||name,body}, {source:meta.source||"",book:meta.book||"",scholar:meta.scholar||"",date:meta.date||"",originalFile:name,sourceReviewBlocked:!inPublishedIndex});
 }
}
function scanQ(){
 const reg=json("q/_registry/shortlinks.json");
 if(!Array.isArray(reg?.links)){issues.push({kind:"qsource",issue:"missing-q-registry"});return}
 for(const r of reg.links){
  if(r.status==="deleted"||r.status==="draft")continue;
  const n=Number(r.number);
  if(!Number.isSafeInteger(n)||n<1)continue;
  const pagePath="q/"+n+"/index.html";
  // Only registry title/statement/context, not guessed translations of HTML or PDF/scan.
  add("qsource",String(n),"q/_registry/shortlinks.json",{
   title:r.title||"",topic:r.topic||"",statementSummary:r.statementSummary||""
  },{shortPath:r.shortPath||"/q/"+n+"/",targetPath:r.targetPath||"",speaker:r.speaker||"",sourceLabel:r.sourceLabel||"",postReference:r.postReference||"",htmlPageExists:fs.existsSync(path.join(ROOT,pagePath))});
 }
}
function scanHadith(){
 const canonical=json("apple-tv/hadith/catalog.json");
 if(Array.isArray(canonical?.series)){
  let found=0;
  for(const group of canonical.series){
   const relative=String(group.indexPath||"");
   if(!/^series\/[0-9-]+\/index\.json$/.test(relative))continue;
   const indexPath="apple-tv/hadith/"+relative,listing=json(indexPath);
   if(!Array.isArray(listing?.files)){issues.push({kind:"hadith",file:indexPath,issue:"series-index-unavailable"});continue}
   for(const filename of listing.files){
    if(!/^HAD-[0-9]+\.json$/.test(filename))continue;
    const sourcePath=path.posix.join(path.posix.dirname(indexPath),filename),item=json(sourcePath);
    if(!item?.id){issues.push({kind:"hadith",file:sourcePath,issue:"canonical-hadith-file-missing"});continue}
    if(item.status==="missing")continue;
    add("hadith",item.id,sourcePath,{
      narratorLine:item.narratorLine||"",speakerLabel:item.speakerLabel||"",
      textMarkdown:item.textMarkdown||"",sharhText:item.sharhText||""
    },{
      recordType:item.recordType||"hadith",source:item.source||"",sourceBook:item.sourceBook||"",
      sourceHadithNumber:item.sourceHadithNumber||"",grade:item.grade||"",
      sharhReference:item.sharhReference||"",sharhStatus:item.sharhStatus||"",sourceReviewBlocked:item.sharhStatus==="needs-review"||item.verificationStatus==="needs-review",
      arabicOriginal:item.arabic||item.arabicOriginal||""
    });
    found++;
   }
  }
  if(canonical.publishedCount&&found!==Number(canonical.publishedCount))
   issues.push({kind:"hadith",issue:"canonical-published-count-mismatch",expected:canonical.publishedCount,seen:found});
  return;
 }
 // Explicitly flagged fallback for incomplete development fixtures; never claim canonical parity.
 const sourcePath="test/data/hadith/search-index.json",rows=json(sourcePath);
 if(!Array.isArray(rows)){issues.push({kind:"hadith",issue:"canonical-hadith-source-unavailable"});return}
 for(const h of rows){
  if(!h?.id)continue;
  add("hadith",h.id,sourcePath,{german:h.german||"",chapterTitle:h.chapterTitle||"",bookTitle:h.bookTitle||""},{bookId:h.bookId||"",hadithNumber:h.hadithNumber||"",grade:h.grade||"",arabicOriginal:h.arabic||"",verifiedGerman:h.germanStatus==="verified"});
 }
 issues.push({kind:"hadith",issue:"fallback-staging-index-not-canonical"});
}
function scanDua(){
 const rows=json("content/duas/duas.json");
 if(!Array.isArray(rows)){issues.push({kind:"dua",issue:"dua-catalog-unavailable"});return}
 for(const d of rows){
  if(!d?.id)continue;
  // "tr" is transliteration, NOT Turkish! Preserve it as immutable phonetic source.
  add("dua",d.id,"content/duas/duas.json",{title:d.title||"",meaning:d.de||"",occasion:d.occasion||""},{arabicOriginal:d.ar||"",transliteration:d.tr||"",source:d.src||d.source||"",type:d.type||""});
 }
}
function scanQuiz(){
 const x=json("data/quiz-questions.json"),rows=Array.isArray(x)?x:x?.questions;
 if(!Array.isArray(rows)){issues.push({kind:"quiz",issue:"quiz-catalog-unavailable"});return}
 for(const q of rows){
  if(!q?.id||q.status==="draft")continue;
  add("quiz",q.id,"data/quiz-questions.json",{
   question:q.question||q.text||"",answers:Array.isArray(q.answers)?q.answers:[],explanation:q.explanation||"",topic:q.topic||"",category:q.category||""
  },{correctIndex:q.correctIndex,source:q.source||"",sourceLinks:q.sourceLinks||[],sensitivity:q.sensitivity||"",reviewStatus:q.reviewStatus||""});
 }
}
function scanLearning(){
 // Optional adult-specific JSON catalogs; never crawl independent Kids Academy.
 const candidates=["data/learning-content.json","content/learning/lessons-index.json"];
 let count=0;
 for(const sourcePath of candidates){
  const doc=json(sourcePath);
  const rows=Array.isArray(doc)?doc:Array.isArray(doc?.lessons)?doc.lessons:Array.isArray(doc?.items)?doc.items:null;
  if(!rows)continue;
  for(const l of rows){if(!l?.id)continue;add("learning",l.id,sourcePath,{title:l.title||"",body:l.body||l.text||"",explanation:l.explanation||""},{source:l.source||"",sourceLinks:l.sourceLinks||[]});count++}
 }
 // Adult learning pages such as /lernen/tawhid-iman-akhlaq/ contain dedicated
 // inline quizzes. Extract only a narrow, verified data literal pattern:
 // no eval, no execution, no alterations to original HTML.
 let entries=[];
 try{entries=fs.readdirSync(path.join(ROOT,"lernen"),{withFileTypes:true})}
 catch(_){}
 function decoded(quoted){try{return JSON.parse('"'+quoted+'"')}catch(_){return null}}
 for(const entry of entries){
  if(!entry.isDirectory()||!/^[a-zA-Z0-9_-]+$/.test(entry.name))continue;
  const slug=entry.name,sourcePath="lernen/"+slug+"/index.html",html=read(sourcePath);
  if(!html)continue;
  const script=html.match(/const\s+questions\s*=\s*\[([\s\S]*?)\]\s*;/);
  if(!script){issues.push({kind:"learning",file:sourcePath,issue:"html-learning-page-needs-structured-adapter"});continue}
  const patterns=[
   {re:/\{\s*q:"((?:\\.|[^"\\])*)"\s*,\s*a:\[([^\]]*)\]\s*,\s*correct:(\d+)\s*,\s*why:"((?:\\.|[^"\\])*)"\s*\}/g,style:"q-a"},
   {re:/\{\s*title:"((?:\\.|[^"\\])*)"\s*,\s*hint:"((?:\\.|[^"\\])*)"\s*,\s*options:\[([^\]]*)\]\s*,\s*correct:(\d+)\s*,\s*why:"((?:\\.|[^"\\])*)"\s*\}/g,style:"title-options"},
   {re:/\{\s*q:"((?:\\.|[^"\\])*)"\s*,\s*choices:\[([^\]]*)\]\s*,\s*correct:(\d+)\s*,\s*why:"((?:\\.|[^"\\])*)"\s*\}/g,style:"q-choices"}
  ];
  const matches=[];
  for(const pattern of patterns){let match;while((match=pattern.re.exec(script[1]))!==null)matches.push({match,index:match.index,style:pattern.style})}
  matches.sort((a,b)=>a.index-b.index);
  let parsed=0;
  for(const item of matches){
   const match=item.match,isTitle=item.style==="title-options",question=decoded(match[1]),why=decoded(match[isTitle?5:4]);
   let options=null;try{options=JSON.parse("["+match[isTitle?3:2]+"]")}catch(_){}
   const correct=Number(match[isTitle?4:3]);
   if(!question||!why||!Array.isArray(options)||!options.length||!Number.isSafeInteger(correct)||correct<0||correct>=options.length)continue;
   parsed++;count++;
   const hint=isTitle?decoded(match[2]):"";
   add("learning",slug+"-question-"+parsed,sourcePath,{question,answers:options,explanation:why,title:slug,hint},
   {correctIndex:correct,originalHtmlPath:sourcePath,sourcePage:"/lernen/"+slug+"/"});
  }
  if(!parsed)issues.push({kind:"learning",file:sourcePath,issue:"inline-learning-quiz-unparsed"});
 }
 if(!count)issues.push({kind:"learning",issue:"adult-learning-source-schema-not-yet-identified"});
}
function translationPath(item,locale){
 const dir=item.kind;
 const safe=item.id.slice(item.kind.length+1).replace(/[^a-zA-Z0-9._-]+/g,"-").slice(0,110);
 // Stable filename fingerprint must match canonical post-language manifests (raw ID bytes).
 const suffix=crypto.createHash("sha256").update(item.id).digest("hex").slice(0,10);
 return "desktop-preview/i18n-core-v1/translations/"+locale+"/"+dir+"/"+safe+"-"+suffix+".json";
}
function review(file,item,locale){
 if(item.immutable?.sourceReviewBlocked)return"blocked-source";
 if(!file||typeof file!=="object")return"pending";
 if(file.status!=="approved")return file.status==="draft"?"draft":"pending";
 if(file.id!==item.id||file.locale!==locale||file.sourceHash!==item.sourceHash)return"stale";
 if(!file.reviewer?.linguistic||!file.reviewer?.religious||!file.reviewedAt)return"invalid-review";
 const keys=Object.keys(item.fields),texts=file.fields||{};
 if(keys.some(k=>typeof item.fields[k]==="string"?!String(texts[k]||"").trim():!Array.isArray(texts[k])||texts[k].length!==item.fields[k].length))return"missing-fields";
 if(!file.reviewer?.arabicOriginalChecked||!file.reviewer?.sourcesChecked)return"invalid-review";
 return"approved";
}
scanPosts();scanQ();scanHadith();scanDua();scanQuiz();scanLearning();
items.sort((a,b)=>a.kind.localeCompare(b.kind)||a.id.localeCompare(b.id));
const previous=(()=>{try{return JSON.parse(fs.readFileSync(OUT,"utf8"))}catch(_){return null}})();
const old=new Map((previous?.items||[]).map(x=>[x.id,x.sourceHash]));
const queue=[],states={pending:0,draft:0,stale:0,approved:0,"invalid-review":0,"missing-fields":0,"blocked-source":0};
let newItems=0,changedItems=0;
for(const item of items){
 if(!old.has(item.id))newItems++;
 else if(old.get(item.id)!==item.sourceHash)changedItems++;
 const langs={};
 for(const locale of LOCALES){
  const file=translationPath(item,locale),payload=json(file),state=review(payload,item,locale);
  states[state]=(states[state]||0)+1;
  langs[locale]={state,translationPath:file};
  if(state!=="approved")queue.push({id:item.id,locale,kind:item.kind,sourceHash:item.sourceHash,sourcePath:item.sourcePath,translationPath:file,state});
 }
 item.languages=langs;
}
const removed=(previous?.items||[]).filter(x=>!items.some(z=>z.id===x.id)).length;
const result={schemaVersion:2,source:"adult-repository-canonical-content",locales:LOCALES,
 summary:{contentItems:items.length,translationTasks:items.length*LOCALES.length,unfinished:queue.length,newItems,changedItems,removedItems:removed,byKind:coverage,byState:states},
 issues,items,queue};
if(!CHECK){fs.mkdirSync(path.dirname(OUT),{recursive:true});fs.writeFileSync(OUT,JSON.stringify(result,null,2)+"\n")}
console.log(JSON.stringify({mode:CHECK?"check":"write",output:OUT,summary:result.summary,issues},null,2));
if(issues.some(x=>x.issue==="duplicate-id"||x.issue==="indexed-file-missing"))process.exitCode=2;
