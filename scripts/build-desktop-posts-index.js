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
    .replace(/<!--[\s\S]*?-->/g," ")
    .replace(/!\[[^\]]*\]\([^\)]*\)/g," ")
    .replace(/\[([^\]]+)\]\([^\)]*\)/g,"$1")
    .replace(/^#{1,6}\s+/gm,"")
    .replace(/^>\s?/gm,"")
    .replace(/[*_~]+/g,"")
    .replace(/\x60+/g,"")
    .replace(/\s+/g," ")
    .trim();
}
function parseLinks(fm){
  const lines=fm.split(/\r?\n/), out=[]; let cur=null, inLinks=false;
  for(const line of lines){
    if(/^links:\s*$/.test(line)){inLinks=true;continue}
    if(inLinks && /^[A-Za-z0-9_-]+:/.test(line) && !/^\s/.test(line)){break}
    if(!inLinks)continue;
    let m=line.match(/^\s*-\s+label:\s*(.+)$/);
    if(m){cur={label:unquote(m[1]),url:""};out.push(cur);continue}
    m=line.match(/^\s+url:\s*(.+)$/);
    if(m&&cur)cur.url=unquote(m[1]);
  }
  return out.filter(x=>x.url);
}
const files=fs.readdirSync(POSTS_DIR).filter(n=>n.endsWith(".md")).sort();
const rows=[];
for(const file of files){
  const raw=fs.readFileSync(path.join(POSTS_DIR,file),"utf8");
  const fmMatch=raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
  const fm=fmMatch?fmMatch[1]:"";
  const body=fmMatch?raw.slice(fmMatch[0].length):raw;
  const id=field(fm,"id")||file.replace(/\.md$/,"");
  const title=(field(fm,"title")||id).replace(/^📖\s*/,"");
  const category=field(fm,"category")||"Beitrag";
  const topic=field(fm,"topic");
  const speaker=field(fm,"scholar")||field(fm,"speaker");
  const work=field(fm,"book")||field(fm,"work");
  const source=String(field(fm,"source")||"").replace(/^📝\s*/,"");
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
fs.writeFileSync(OUT,JSON.stringify({version:1,generatedAt:new Date().toISOString(),count:rows.length,posts:rows},null,2)+"\n");
console.log("desktop posts index:",rows.length,"→",path.relative(ROOT,OUT));


/* Compact adult home publication window, generated from the same canonical posts.
   A build includes all posts for each calendar date, never "one per day".
   The client applies its own Europe/Berlin 2/3/5-day filter when opened. */
const RECENT_OUT=path.join(ROOT,"data","recent-posts.json");
const DAY_MS=86400000;
const berlinKey=(value)=>{
  const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Berlin",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(value);
  const m=Object.fromEntries(parts.map(x=>[x.type,x.value]));
  return m.year+"-"+m.month+"-"+m.day;
};
const dayEpoch=(key)=>Date.parse(key+"T00:00:00Z");
const todayEpoch=dayEpoch(berlinKey(new Date()));
const compact=rows.filter(r=>{
  if(!/^\d{4}-\d{2}-\d{2}/.test(String(r.date||"")))return false;
  const d=new Date(r.date);
  if(!Number.isFinite(d.getTime()))return false;
  const day=dayEpoch(berlinKey(d));
  const age=Math.round((todayEpoch-day)/DAY_MS);
  return age>=0&&age<=45;
}).map(r=>({
  id:r.id,
  date:r.date,
  title:r.title,
  category:r.category,
  speaker:r.speaker,
  excerpt:r.excerpt.slice(0,220),
  sourceUrl:(r.links.find(x=>/^\/q\/\d+\/?$/.test(x.url))||{}).url||"",
  language:"de"
}));
fs.writeFileSync(RECENT_OUT,JSON.stringify({schemaVersion:1,generatedAt:new Date().toISOString(),timezone:"Europe/Berlin",windowDays:45,count:compact.length,posts:compact},null,2)+"\n");
console.log("home recent posts index:",compact.length,"→",path.relative(ROOT,RECENT_OUT));
