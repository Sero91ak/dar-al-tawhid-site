#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const POSTS_DIR = path.join(ROOT, "content", "posts");
const OUT = path.join(ROOT, "data", "desktop-posts-index.json");

function unquote(v){
  v=String(v||"").trim();
  if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'"))) return v.slice(1,-1);
  return v;
}
function field(fm,key){
  const m=fm.match(new RegExp("^"+key+":\\s*(.+)$","mi"));
  return m?unquote(m[1]):"";
}
function cleanMd(s){
  return String(s||"")
    .replace(/<!--[\\s\\S]*?-->/g," ")
    .replace(/!\\[[^\\]]*\\]\\([^\\)]*\\)/g," ")
    .replace(/\\[([^\\]]+)\\]\\([^\\)]*\\)/g,"$1")
    .replace(/^#{1,6}\\s+/gm,"")
    .replace(/^>\\s?/gm,"")
    .replace(/[*_~]+/g,"")
    .replace(/\\x60+/g,"")
    .replace(/\\s+/g," ")
    .trim();
}
function parseLinks(fm){
  const lines=fm.split(/\\r?\\n/), out=[]; let cur=null, inLinks=false;
  for(const line of lines){
    if(/^links:\\s*$/.test(line)){inLinks=true;continue}
    if(inLinks && /^[A-Za-z0-9_-]+:/.test(line) && !/^\\s/.test(line)){break}
    if(!inLinks)continue;
    let m=line.match(/^\\s*-\\s+label:\\s*(.+)$/);
    if(m){cur={label:unquote(m[1]),url:""};out.push(cur);continue}
    m=line.match(/^\\s+url:\\s*(.+)$/);
    if(m&&cur)cur.url=unquote(m[1]);
  }
  return out.filter(x=>x.url);
}
const files=fs.readdirSync(POSTS_DIR).filter(n=>n.endsWith(".md")).sort();
const rows=[];
for(const file of files){
  const raw=fs.readFileSync(path.join(POSTS_DIR,file),"utf8");
  const fmMatch=raw.match(/^---\\s*\\r?\\n([\\s\\S]*?)\\r?\\n---\\s*\\r?\\n?/);
  const fm=fmMatch?fmMatch[1]:"";
  const body=fmMatch?raw.slice(fmMatch[0].length):raw;
  const id=field(fm,"id")||file.replace(/\\.md$/,"");
  const title=(field(fm,"title")||id).replace(/^📖\\s*/,"");
  const category=field(fm,"category")||"Beitrag";
  const topic=field(fm,"topic");
  const speaker=field(fm,"scholar")||field(fm,"speaker");
  const work=field(fm,"book")||field(fm,"work");
  const source=String(field(fm,"source")||"").replace(/^📝\\s*/,"");
  const date=field(fm,"date");
  const links=parseLinks(fm);
  const plain=cleanMd(body);
  rows.push({
    id,file,date,title,category,topic,speaker,work,reference:source,
    excerpt:plain.slice(0,560),
    body:plain.slice(0,7000),
    links
  });
}
rows.sort((a,b)=>String(b.date||"").localeCompare(String(a.date||""))||a.title.localeCompare(b.title,"de"));
fs.mkdirSync(path.dirname(OUT),{recursive:true});
fs.writeFileSync(OUT,JSON.stringify({version:1,generatedAt:new Date().toISOString(),count:rows.length,posts:rows},null,2)+"\\n");
console.log("desktop posts index:",rows.length,"→",path.relative(ROOT,OUT));
