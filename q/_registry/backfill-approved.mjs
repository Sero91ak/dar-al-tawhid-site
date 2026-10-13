#!/usr/bin/env node
// Q migration: publish only dossiers independently marked and checked as verified.
// Never exposes drafts or modifies content before --apply-reviewed.
import fs from "node:fs";
import path from "node:path";
import {execFileSync} from "node:child_process";
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),"../..");
const folder=path.join(root,"q/_registry/backfill-drafts");
const registryFile=path.join(root,"q/_registry/shortlinks.json");
const nextFile=path.join(root,"q/_registry/next-number.txt");
const escape=s=>String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const clean=s=>String(s||"").trim();
const allowed=["islamweb.net","shamela.ws","al-maktaba.org","ketabonline.com","dorar.net","archive.org","waqfeya.net","app.turath.io"];
function validUrl(value){
 try{
  const u=new URL(value);
  return u.protocol==="https:"&&allowed.some(d=>u.hostname===d||u.hostname.endsWith("."+d))&&(u.hash.includes(":~:text=")||/#page=\d+/.test(u.hash));
 }catch{return false;}
}
const reg=JSON.parse(fs.readFileSync(registryFile,"utf8"));
const items=(fs.existsSync(folder)?fs.readdirSync(folder):[]).filter(n=>n.endsWith(".json")).sort().map(n=>JSON.parse(fs.readFileSync(path.join(folder,n),"utf8")))).filter(x=>x.approved===true);
const checked=[];
for(const x of items){
 const r=x.review||{};
 if(x.reviewState!=="verified"||!r.approvedBy||!r.checkedAt||["originalChecked","translationChecked","bibliographyChecked","isnadChecked","linksChecked"].some(k=>r[k]!==true))throw Error("Review missing: "+x.postId);
 if(["postId","filename","speaker","title","bibliography","arabicOriginal","checkedGermanTranslation","attributionGrade"].some(k=>!clean(x[k])))throw Error("Missing source fields: "+x.postId);
 if(!/[\u0600-\u06ff]/.test(x.arabicOriginal))throw Error("Arabic original absent: "+x.postId);
 if(!Array.isArray(x.sourceLinks)||!x.sourceLinks.length||x.sourceLinks.some(s=>s.verified!==true||!s.title||!s.reference||!validUrl(s.url)))throw Error("Unverified direct evidence: "+x.postId);
 if(!/^[^/]+\.md$/.test(x.filename)||x.filename.includes(".."))throw Error("Bad post filename");
 const postFile=path.join(root,"content/posts",x.filename);
 const post=fs.readFileSync(postFile,"utf8");
 if(!post.includes('id: "'+x.postId+'"')&&!post.includes("id: "+x.postId))throw Error("Wrong post ID: "+x.postId);
 if(reg.links.some(e=>e.postReference===x.postId)||/\/q\/[1-9]\d*\//.test(post))throw Error("Already assigned Q: "+x.postId);
 checked.push({x,postFile,post});
}
if(!process.argv.includes("--apply-reviewed")){
 console.log(JSON.stringify({reviewed:checked.length,drafts:(fs.existsSync(folder)?fs.readdirSync(folder).length:0),action:"no files changed"}));
 process.exit(0);
}
const used=new Set(reg.links.map(x=>Number(x.number)));
let n=Math.max(Number(reg.nextNumber)||1,Number(fs.readFileSync(nextFile,"utf8"))||1);
const tpl=fs.readFileSync(path.join(root,"q/_registry/shortlink-template.html"),"utf8");
for(const e of checked){
 while(used.has(n)||fs.existsSync(path.join(root,"q",String(n))))n++;
 e.n=n++;used.add(e.n);
}
for(const e of checked){
 const x=e.x,q="/q/"+e.n+"/";
 const evidence=x.sourceLinks.map((s,i)=>'<a class="qsource-link web" href="'+escape(s.url)+'" target="_blank" rel="noopener noreferrer"><div class="qsource-link-icon">'+(i+1)+'</div><div class="qsource-link-body"><span class="qsource-link-title">'+escape(s.title)+'</span><span class="qsource-link-sub">'+escape(s.reference)+'</span></div></a>').join("");
 const meta=(label,value)=>'<div class="qsource-meta-row"><div class="qsource-meta-label">'+escape(label)+'</div><div class="qsource-meta-value">'+escape(value)+'</div></div>';
 const hero='<section class="qsource-hero"><p class="qsource-kicker">'+escape(x.topic||"Quellen")+'</p><h2 class="qsource-title">'+escape(x.title)+'</h2><div class="qsource-quote-line"></div><p class="qsource-quote">'+escape(x.checkedGermanTranslation)+'</p><div class="qsource-meta">'+meta("Sprecher",x.speaker)+meta("Werk",x.bibliography)+meta("Überlieferungsstatus",x.attributionGrade)+meta("Kurzlink",q)+'</div></section>';
 const section=(no,title,body)=>'<section class="qsource-section"><div class="qsource-section-head"><div class="qsource-num">'+no+'</div><h3 class="qsource-section-title">'+title+'</h3></div>'+body+'</section>';
 const detail=section(1,"Arabischer Originalwortlaut",'<p class="qsource-arabic" lang="ar" dir="rtl">'+escape(x.arabicOriginal)+'</p>')+
 section(2,"Geprüfte Übersetzung",'<p>'+escape(x.checkedGermanTranslation)+'</p>')+
 section(3,"Originalnachweise",'<div class="qsource-links">'+evidence+'</div>');
 let page=tpl.replaceAll("__NUMBER__",String(e.n)).replaceAll("__TARGET_PATH__",q);
 page=page.replace(/<section class="qsource-hero">[\s\S]*?<\/section>/,hero);
 const start=page.indexOf('    <div class="qsource-links">'),end=page.indexOf('    <nav class="qsource-social"',start);
 if(start<0||end<0)throw Error("Q template incompatible");
 page=page.slice(0,start)+detail+page.slice(end);
 page=page.replace("<title>DAR AL TAWḤĪD – Quellenbeleg</title>","<title>"+escape(x.title)+" – DAR AL TAWḤĪD</title>");
 fs.mkdirSync(path.join(root,"q",String(e.n)));
 fs.writeFileSync(path.join(root,"q",String(e.n),"index.html"),page);
 const m=e.post.match(/^(---\s*\r?\n)([\s\S]*?)(\r?\n---\s*\r?\n?)([\s\S]*)$/);
 if(!m)throw Error("Frontmatter lost");
 let front=m[2],block='links:\n  - label: "🔗 Originalquellen · q/'+e.n+'"\n    url: "'+q+'"';
 if(/^links:\s*$/m.test(front))front=front.replace(/^links:\s*$\r?\n(?:[ \t]+[^\r\n]*(?:\r?\n|$))*/m,block+"\n").trimEnd();
 else front=front+"\n"+block;
 fs.writeFileSync(e.postFile,m[1]+front+m[3]+m[4]);
 reg.links.push({number:e.n,shortPath:q,targetPath:q,title:x.title,topic:x.topic||"",speaker:x.speaker,postReference:x.postId,statementSummary:x.checkedGermanTranslation.slice(0,280),sourceLabel:x.bibliography,status:"active",createdAt:new Date().toISOString()});
}
if(checked.length){
 reg.nextNumber=n;reg.updatedAt=new Date().toISOString();
 fs.writeFileSync(registryFile,JSON.stringify(reg,null,2)+"\n");
 fs.writeFileSync(nextFile,String(n)+"\n");
 execFileSync(process.execPath,["scripts/sync-quellen-registry.cjs"],{cwd:root,stdio:"inherit"});
}
console.log("Q pages written (working tree only): "+checked.length+". Test/CI and release approval still required.");
