#!/usr/bin/env node
// DAR AL TAWHID: inspect EVERY canonical adult post without changing the visitor app.
// Modes: --audit (inventory only), --prepare (inventory + review drafts).
// Publication is deliberately delegated to backfill-approved.mjs.
import fs from "node:fs";
import path from "node:path";

const root=path.resolve(import.meta.dirname||path.dirname(new URL(import.meta.url).pathname),"../..");
const postRoot=path.join(root,"content/posts");
const qRoot=path.join(root,"q");
const reviewRoot=path.join(qRoot,"_registry","backfill-drafts");
const auditFile=path.join(qRoot,"_registry","backfill-audit.json");
const args=new Set(process.argv.slice(2));
if(args.has("--help")){
 console.log("node q/_registry/backfill-post-sources.mjs --audit | --prepare");
 process.exit(0);
}
if(args.has("--apply")||args.has("--publish")) throw Error("No automatic publishing. Use backfill-approved.mjs with approvals.");

function readJson(p){return JSON.parse(fs.readFileSync(p,"utf8"));}
function plain(s){return String(s||"").replace(/^["']|["']$/g,"").replace(/^📝\s*/u,"").trim();}
function clean(s){const x=String(s||"").trim();if(x[0]==='"'){try{return JSON.parse(x)}catch{}}return plain(x);}
function field(front,key){const match=front.match(new RegExp("^"+key+":\\s*(.*)$","m"));return match?clean(match[1]):"";}
function collectUrls(text){
 const urls=[...String(text||"").matchAll(/(?:https?:\/\/[^\s<>"']+|\/q\/[1-9]\d*\/?)/g)].map(m=>m[0].replace(/[),.;]+$/,""));
 return [...new Set(urls)];
}
function extractQ(url){
 const m=String(url).match(/(?:^|\/)q\/([1-9]\d*)\/?/);
 return m?Number(m[1]):null;
}
function isEvidence(url){
 try {
  const u=new URL(url);
  if(!["https:"].includes(u.protocol))return false;
  const valid=["islamweb.net","shamela.ws","al-maktaba.org","ketabonline.com","dorar.net","archive.org","waqfeya.net","app.turath.io"];
  return valid.some(d=>u.hostname===d||u.hostname.endsWith("."+d));
 }catch{return false;}
}
function parsePost(filename){
 const raw=fs.readFileSync(path.join(postRoot,filename),"utf8");
 const parts=raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/);
 if(!parts) return {filename,error:"YAML Frontmatter fehlt"};
 const front=parts[1],body=parts[2],id=field(front,"id")||filename.slice(0,-3);
 const external=collectUrls(raw).filter(x=>x.startsWith("https://")&&isEvidence(x));
 const otherExternal=collectUrls(raw).filter(x=>x.startsWith("http")&&!isEvidence(x)&&!x.includes("dar-al-tawhid.de"));
 const direct=external.filter(x=>x.includes("#:~:text=")||/#page=\d+/.test(x));
 const qLinks=[...new Set(collectUrls(raw).map(extractQ).filter(Boolean))];
 const quote=body.match(/(?:^|\n)\s*>\s*(.+(?:\n\s*>.+)*)/m);
 return {
  filename,id,title:field(front,"title"),topic:field(front,"topic"),category:field(front,"category"),
  speaker:field(front,"scholar"),book:field(front,"book"),bibliography:field(front,"source"),
  recordType:field(front,"recordType")||field(front,"type"),
  excerpt:quote?quote[1].replace(/\n\s*>\s*/g," ").trim():"",
  qLinks,externalLinks:external,otherExternalLinks:otherExternal,
  directLinkCount:direct.length,needsOriginalVerification:true
 };
}
const index=readJson(path.join(postRoot,"posts-index.json"));
const registry=readJson(path.join(qRoot,"_registry","shortlinks.json"));
if(!Array.isArray(index.files)||!Array.isArray(registry.links))throw Error("Invalid indexes");
const numberToReg=new Map(),idToQ=new Map();
const normalizeTitle=s=>String(s||"").normalize("NFKD").replace(/\p{Mark}/gu,"").toLowerCase().replace(/[^\p{Letter}\p{Number}]+/gu," ").trim();
const registryByTitle=new Map();
for(const q of registry.links){
 const key=normalizeTitle(q.title);
 if(key){
  const matches=registryByTitle.get(key)||[];
  matches.push(Number(q.number));registryByTitle.set(key,matches);
 }
}
const indexedFilenames=new Set(index.files.map(item=>item?.name).filter(Boolean));
const unindexedMarkdown=fs.readdirSync(postRoot).filter(n=>n.endsWith(".md")&&!indexedFilenames.has(n)).sort();
const unsafeIndexRows=index.files.filter(f=>!f?.name?.endsWith(".md")||f.name.includes("/")||f.name.includes("..")).map(f=>f?.name||"");
for(const entry of registry.links){
 const n=Number(entry.number);
 if(!Number.isSafeInteger(n)||n<1||numberToReg.has(n))throw Error("Duplicate or invalid Q registry number "+n);
 numberToReg.set(n,entry);
 if(entry.postReference&&!/^statement-\d+$/.test(entry.postReference)){
  const list=idToQ.get(entry.postReference)||[];
  list.push(n);idToQ.set(entry.postReference,list);
 }
}
const seenIds=new Set(),records=[];
for(const f of index.files){
 if(!f?.name?.endsWith(".md")||f.name.includes("/")||f.name.includes(".."))continue;
 let data;
 if(!fs.existsSync(path.join(postRoot,f.name)))data={filename:f.name,error:"Datei im Beitragsindex nicht gefunden"};
 else data=parsePost(f.name);
 if(seenIds.has(data.id))data.error="Doppelte Beitrags-ID";
 seenIds.add(data.id);
 const qs=[...new Set([...(data.qLinks||[]),...(idToQ.get(data.id)||[])])].sort((a,b)=>a-b);
 data.existingQ=qs;
 data.suspectedExistingQ=qs.length?[]:(registryByTitle.get(normalizeTitle(data.title))||[]);
 if(qs.some(n=>!numberToReg.has(n)||!fs.existsSync(path.join(qRoot,String(n),"index.html"))))
  data.error="Q-Referenz fehlt im Register oder Q-Datei";
 if(qs.length>1)data.error="Mehrdeutige Q-Referenzen";
 data.state=data.error?"blocked":qs.length===1?"linked":data.suspectedExistingQ.length?"possible-existing-q":data.directLinkCount>0?"review-direct-evidence":data.externalLinks?.length?"review-source-link":"research-required";
 records.push(data);
}
const duplicates=new Map();
for(const r of records){for(const n of r.existingQ||[]){const list=duplicates.get(n)||[];list.push(r.id);duplicates.set(n,list);}}
for(const r of records)if(r.existingQ?.some(n=>(duplicates.get(n)||[]).length>1)){
 r.state="blocked";r.error="Q-Nummer mehrfach auf verschiedene Beiträge verteilt";
}
const tallies={};
for(const r of records)tallies[r.state]=(tallies[r.state]||0)+1;
const output={
 schemaVersion:1,createdAt:new Date().toISOString(),source:"content/posts/posts-index.json",
 indexedCount:index.count??index.files.length,scanned:records.length,registeredQ:registry.links.length,
 nextRegisteredQ:registry.nextNumber,summary:tallies,unindexedMarkdown,unsafeIndexRows,
 rules:{
  noInventedArabic:true,noUnverifiedPublicLinks:true,existingQImmutable:true,
  noVisitorWrites:true,noKidsWrites:true,needsEditorialApproval:true
 },posts:records
};
fs.writeFileSync(auditFile,JSON.stringify(output,null,2)+"\n");
if(args.has("--prepare")){
 fs.mkdirSync(reviewRoot,{recursive:true});
 for(const r of records){
  if(r.state==="linked"||r.state==="blocked")continue;
  const filepath=path.join(reviewRoot,r.id.replace(/[^a-zA-Z0-9._-]/g,"_")+".json");
  if(fs.existsSync(filepath))continue; // preserve manual editor work
  const draft={
   postId:r.id,filename:r.filename,reviewState:r.state==="possible-existing-q"?"existing-Q-match-review":"not-verified",approved:false,
   suspectedExistingQ:r.suspectedExistingQ,
   title:r.title,topic:r.topic,speaker:r.speaker,bibliography:r.bibliography,book:r.book,
   existingExcerpt:r.excerpt,arabicOriginal:"",checkedGermanTranslation:"",
   attributionGrade:"",sourceVolume:"",sourcePage:"",sourceNumber:"",
   sourceLinks:r.externalLinks.map(url=>({title:"Originalnachweis prüfen",url,reference:"",verified:false})),
   review:{originalChecked:false,translationChecked:false,bibliographyChecked:false,isnadChecked:false,linksChecked:false,approvedBy:"",checkedAt:""},
   editorialNotes:"Alle übernommenen Altangaben sind Hinweise, KEINE geprüften Belege. Originalwortlaut, Fundstelle und Quellenlinks erst nach Verifikation freigeben. Wenn suspectedExistingQ befüllt ist, vorhandenen Q-Link zuordnen und niemals eine neue Q-Nummer für dieselbe Aussage erzeugen."
  };
  fs.writeFileSync(filepath,JSON.stringify(draft,null,2)+"\n");
 }
}
console.log(JSON.stringify({scanned:records.length,registeredQ:registry.links.length,summary:tallies,auditFile:args.has("--prepare")?"q/_registry/backfill-audit.json + redaktionelle Entwürfe":"q/_registry/backfill-audit.json"},null,2));
