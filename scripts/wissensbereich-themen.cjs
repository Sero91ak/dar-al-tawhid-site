#!/usr/bin/env node
"use strict";
// DĀR Wissensbereich Themen: read-only index and draft preflight. NO publishing/OneSignal.
const fs=require("node:fs"),path=require("node:path");
const ROOT=path.resolve(__dirname,".."),DRAFTS=path.join(ROOT,"content/admin/wissensbereich-themen-drafts");
const json=p=>JSON.parse(fs.readFileSync(p,"utf8"));
const norm=s=>String(s||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[ʿʾ‘’']/g,"").replace(/ß/g,"ss").replace(/[^\p{L}\p{N}]+/gu," ").toLowerCase().replace(/\s+/g," ").trim();
const STOP=new Set("und mit ein eine einer der die das den dem des zum zur fuer fur aus von was wer wie sich nicht bei ueber uber allah quran sunnah wissen beitrag islam ibn".split(" "));
const tokens=s=>[...new Set(norm(s).split(" ").filter(t=>t.length>2&&!STOP.has(t)))];
function score(a,b){let x=new Set(tokens(a)),y=new Set(tokens(b));if(!x.size||!y.size)return 0;let n=0;for(let t of x)if(y.has(t))n++;return n/Math.max(x.size,y.size)}
function fmValue(yaml,key){let m=yaml.match(new RegExp("^"+key+":\\s*(.*)$","m"));return m?m[1].trim().replace(/^["']|["']$/g,""):""}
function inventory(){
 const raw=json(path.join(ROOT,"content/posts/posts-index.json")),reg=json(path.join(ROOT,"q/_registry/shortlinks.json"));
 const lib=json(path.join(ROOT,"data/library-publications.json")),posts=[],missing=[];
 for(let item of raw.files||[]){
  if(!/^[\w.-]+\.md$/.test(item.name))continue;
  let f=path.join(ROOT,"content/posts",item.name);
  if(!fs.existsSync(f)){missing.push(item.name);continue}
  let txt=fs.readFileSync(f,"utf8"),m=txt.match(/^---\s*\n([\s\S]*?)\n---/),yaml=m?m[1]:"";
  posts.push({id:fmValue(yaml,"id"),title:fmValue(yaml,"title"),topic:fmValue(yaml,"topic"),category:fmValue(yaml,"category"),source:fmValue(yaml,"source"),file:item.name});
 }
 return {posts,q:(reg.links||[]).filter(q=>q.status==="active"),books:(lib.publications||[]).map(b=>({id:b.id,title:b.title,topic:b.topic||b.category,slug:b.slug})),missing};
}
function rank(q,items,display){return items.map(item=>({item,score:score(q,display(item))})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,25)}
function scan(q){
 if(!q)throw Error("Thema fehlt");
 let x=inventory(),p=rank(q,x.posts,v=>v.title+" "+v.topic+" "+v.category),src=rank(q,x.q,v=>v.title+" "+v.topic+" "+v.statementSummary),books=rank(q,x.books,v=>v.title+" "+v.topic);
 console.log(JSON.stringify({status:"read-only",query:q,counts:{posts:x.posts.length,qSources:x.q.length,library:x.books.length,missingPosts:x.missing.length},existingPosts:p.map(v=>({postId:v.item.id,title:v.item.title,category:v.item.category,score:+v.score.toFixed(3)})),existingQ:src.map(v=>({q:v.item.number,title:v.item.title,score:+v.score.toFixed(3)})),existingLibrary:books.map(v=>({id:v.item.id,title:v.item.title,score:+v.score.toFixed(3)})),notice:"Preliminary lookup, not a semantic/academic full-corpus proof. Also check lessons, drafts, exact Arabic references and transliteration variants before creating anything."},null,2))
}
function check(file){
 let full=path.resolve(ROOT,file);
 if(!full.startsWith(DRAFTS+path.sep)||!full.endsWith(".json"))throw Error("Only protected draft directory accepted");
 let d=json(full),inv=inventory(),errors=[],warnings=[];
 const err=v=>errors.push(v),ids=new Set(inv.posts.map(x=>x.id).filter(Boolean));
 const targets=Array.isArray(d.targets)?d.targets:[],reused=Array.isArray(d.reuse)?d.reuse:[],newPosts=Array.isArray(d.proposed)?d.proposed:[];
 if(d.schemaVersion!==1||d.status!=="draft"||!String(d.topic||"").trim())err("Invalid draft schemaVersion/status/topic");
 if(!targets.length||targets.some(a=>!["woman","man"].includes(a)))err("Only woman/man targets permitted");
 if(!reused.length&&!newPosts.length)err("No reused or proposed posts");
 for(let x of reused){
  if(!ids.has(x.postId))err("Unknown reused canonical post ID: "+x.postId);
  if(!Array.isArray(x.audiences)||!x.audiences.length||x.audiences.some(a=>!targets.includes(a)))err("Bad reuse audience "+x.postId);
 }
 const seen=new Set();
 for(let x of newPosts){
  let id=String(x.id||""),title=String(x.title||"");
  if(!/^[a-z0-9][a-z0-9-]{2,130}$/.test(id)||ids.has(id)||seen.has(id))err("Duplicate/invalid new ID: "+id);seen.add(id);
  if(title.trim().length<8)err("Missing full title "+id);
  if(!["woman","man","both"].includes(x.audience)||(x.audience!=="both"&&!targets.includes(x.audience)))err("Invalid audience: "+id);
  if(!Array.isArray(x.qRefs)||!x.qRefs.length)err("No verified Q reference: "+id);
  for(let n of x.qRefs||[]){
   if(!inv.q.some(q=>Number(q.number)===Number(n)))err("Unregistered Q source "+n+" for "+id);
   if(!fs.existsSync(path.join(ROOT,"q",String(n),"index.html")))err("Missing Q source page "+n+" for "+id);
  }
  if(x.sourceChecked!==true||x.editoriallyApproved!==true)err("Source/editorial approval not documented: "+id);
  const exact=inv.posts.filter(p=>norm(p.title)===norm(title));
  if(exact.length)err("Duplicate title for "+id+": "+exact.map(x=>x.id).join(","));
  const similar=rank(title,inv.posts,x=>x.title).filter(x=>x.score>=.7);
  if(similar.length)warnings.push({id,possibleDuplicates:similar.slice(0,5).map(y=>({postId:y.item.id,title:y.item.title,score:+y.score.toFixed(3)}))});
 }
 if(d.sendNotification===true||d.oneSignal||d.adminSecret)err("No device pushes or secrets permitted in draft");
 const ok=!errors.length&&!warnings.length;
 console.log(JSON.stringify({ok,mode:"read-only-preflight",draft:file,errors,warnings,notice:"Review still required; this program NEVER publishes or sends OneSignal."},null,2));
 if(!ok)process.exitCode=2;
}
function tests(){
 const list=[["normalize",norm("ʿAṣr – der Ḥadīṯ")===norm("Asr der Hadith")],["equal",score("Gebet am Freitag","Gebet am Freitag")===1],["unrelated",score("Ehe Familienrecht","Astronomie Erde")===0]];
 console.log(JSON.stringify({tests:list,ok:list.every(x=>x[1])},null,2));if(!list.every(x=>x[1]))process.exitCode=1;
}
try{let mode=process.argv[2];if(mode==="scan")scan(process.argv.slice(3).join(" "));else if(mode==="check")check(process.argv[3]||"");else if(mode==="self-test")tests();else throw Error("Usage: scan <topic> | check <draft-path> | self-test")}catch(e){console.error("Wissensbereich Themen: "+e.message);process.exitCode=1}
