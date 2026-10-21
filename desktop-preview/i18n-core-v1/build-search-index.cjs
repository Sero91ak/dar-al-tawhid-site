#!/usr/bin/env node
/* DĀR multilingual searchable source registry builder.
 * Source data stays untouched; there is NO machine translation.
 */
"use strict";
const fs=require("node:fs"),path=require("node:path");
const ROOT=path.resolve(__dirname,"../..");
const DEST=path.join(__dirname,"generated-source-index.json");
const stats={posts:0,hadith:0,library:0,dua:0,quran:0,quiz:0,qsource:0};
const records=[],seen=new Set();
const read=p=>{try{return JSON.parse(fs.readFileSync(path.join(ROOT,p),"utf8"))}catch(_){return null}};
const clean=(s,max=420)=>String(s||"").replace(/\*\*|__/g,"").replace(/[_*#]/g,"").replace(/\s+/g," ").trim().slice(0,max);
const direct=u=>{const p=String(u||"").replace(/^https:\/\/dar-al-tawhid\.de/,"");return /^\/(?!\/)[a-zA-Z0-9_\-/.?=%#]*$/.test(p)?p:null};
function add(kind,e){const id=String(e.id||"").trim(),title=clean(e.title,260),url=direct(e.url||"/");if(!id||!title||!url||seen.has(id))return;
 seen.add(id);records.push({id,title,kind,summary:clean(e.summary),reference:clean(e.reference,200),url,
 tags:(e.tags||[]).filter(Boolean).map(String).slice(0,20),canonicalTerms:(e.canonicalTerms||[]).slice(0,20),
 originalLocale:"de",translationStatus:{de:"original",ar:"pending",en:"pending",tr:"pending",ku:"pending",ckb:"pending",bs:"pending"}});
 stats[kind]=(stats[kind]||0)+1;
}
function metadata(raw){let top=(String(raw).match(/^---\s*\n([\s\S]*?)\n---/)||[])[1]||"",out={};top.split(/\r?\n/).forEach(line=>{let x=line.match(/^([\w-]+):\s*(.*)$/);if(x)out[x[1]]=x[2].trim().replace(/^["']|["']$/g,"")});return out}
function posts(){const idx=read("content/posts/posts-index.json")||{},a=idx.files||[];a.forEach(f=>{const name=typeof f==="string"?f:f?.name;if(!/^[\w.-]+\.md$/.test(name||""))return;
 const file=path.join(ROOT,"content/posts",name);if(!fs.existsSync(file))return;
 const raw=fs.readFileSync(file,"utf8"),m=metadata(raw),body=raw.replace(/^---[\s\S]*?---/,"");
 add("posts",{id:"post:"+(m.id||name),title:m.title||name,summary:body.slice(0,900),reference:[m.scholar,m.book,m.source].filter(Boolean).join(" · "),tags:[m.category,m.topic,m.scholar,m.book],url:"/?page=beitraege"});
})}
function library(){const x=read("data/library-publications.json")||{};(x.publications||[]).forEach(p=>{
 add("library",{id:"library:"+p.id,title:p.title,summary:p.description||p.subtitle||p.topic,reference:[p.editor,p.category,p.publishedAt].filter(Boolean).join(" · "),tags:[p.category,p.topic,...(p.tags||[]),...(p.searchAliases||[])],url:p.pdfUrl||"/?page=bibliothek"});
})}
function hadith(){const a=read("test/data/hadith/search-index.json")||[];(Array.isArray(a)?a:[]).forEach(p=>{
 add("hadith",{id:"hadith:"+p.id,title:[p.bookTitle,p.hadithNumber].filter(Boolean).join(" · "),summary:p.german,reference:[p.bookTitle,p.chapterTitle,p.grade].filter(Boolean).join(" · "),tags:[p.chapterTitle,p.bookTitle,...(p.tags||[])],url:"/?page=hadith"});
})}
function duas(){const x=read("content/duas/duas.json")||{};const a=Array.isArray(x)?x:x.duas||x.items||[];
 (Array.isArray(a)?a:[]).forEach(p=>add("dua",{id:"dua:"+p.id,title:p.title||p.name||"Duʿāʾ",summary:p.de||p.translation_de||p.meaning,reference:p.source||p.reference,tags:[p.occasion,p.category,...(p.tags||[])],url:"/?page=dua"}));
}
function quran(){const x=read("data/quran-search-index.json")||{};const a=Array.isArray(x)?x:x.entries||x.verses||[];
 (Array.isArray(a)?a:[]).forEach((p,i)=>{const ref=p.reference||p.ref||(p.surah&&p.ayah?p.surah+":"+p.ayah:null);if(!ref)return;
 add("quran",{id:"ayah:"+ref+":"+i,title:p.title||p.surahName||"Qurʾān "+ref,summary:p.de||p.textDe||p.translation||p.meaning,reference:String(ref),tags:[p.surahName,p.topic,p.category],url:"/?page=quran"});
 })}
function quiz(){const x=read("data/quiz-questions.json")||[];const a=Array.isArray(x)?x:x.questions||[];
 (Array.isArray(a)?a:[]).forEach((p,i)=>{if(!p.question&&!p.text)return;add("quiz",{id:"quiz:"+(p.id||i),title:p.question||p.text,summary:p.explanation,reference:p.source,tags:[p.category,p.topic],url:"/?page=quiz"})});
}
function qlinks(){const x=read("q/_registry/shortlinks.json")||{};(x.links||[]).forEach(p=>{const n=String(p.number||p.n||p.id||"");if(!/^\d+$/.test(n))return;
 add("qsource",{id:"q:"+n,title:p.title||"Quellenlink Q"+n,summary:p.summary,reference:p.source,tags:[p.topic,p.speaker],url:"/q/"+n+"/"});
})}
posts();library();hadith();duas();quran();quiz();qlinks();
records.sort((a,b)=>a.kind.localeCompare(b.kind)||a.title.localeCompare(b.title,"de"));
fs.writeFileSync(DEST,JSON.stringify({schemaVersion:1,generatedAt:new Date().toISOString(),source:"repo-canonical-no-generated-translations",coverage:stats,records},null,2)+"\n");
console.log(JSON.stringify({output:path.relative(ROOT,DEST),entries:records.length,coverage:stats},null,2));
