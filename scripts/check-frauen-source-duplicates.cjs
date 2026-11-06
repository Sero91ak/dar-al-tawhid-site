#!/usr/bin/env node
"use strict";
/**
 * Fraueninhalte: verbindlicher Vorab-Dubletten-Guard fuer neue Datensaetze.
 * Vergleicht mit ALLEN data/frauen-*.json, Erwachsenen-Posts und Q-Register.
 * Keine Schreibzugriffe, keine Live-Publikation, keine Pushes.
 *
 * CI: DAR_DEDUPE_BASE=origin/main node scripts/check-frauen-source-duplicates.cjs
 * lokal: DAR_DEDUPE_BASE=main node scripts/check-frauen-source-duplicates.cjs
 */
const fs=require("node:fs");
const path=require("node:path");
const cp=require("node:child_process");
const root=path.resolve(__dirname,"..");
const base=process.env.DAR_DEDUPE_BASE||process.argv[2]||"origin/main";
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),"utf8"));
const git=(args)=>cp.execFileSync("git",args,{cwd:root,encoding:"utf8",maxBuffer:24*1024*1024});
function oldJson(p) {
  try {return JSON.parse(git(["show",base+":"+p]));}
  catch(e){return {eintraege:[]};}
}
function norm(s) {
  return String(s||"").toLowerCase().replace(/ß/g,"ss").replace(/ʿ|ʾ|[’'‘]/g,"")
   .replace(/ḫ/g,"kh").replace(/ǧ/g,"j").replace(/š/g,"sh").replace(/ṯ/g,"th")
   .normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
   .replace(/[^a-z0-9]+/g," ").replace(/\s+/g," ").trim();
}
const stop=new Set(("und eine einer einem einen der die das den dem des fur fuer von auch " +
 "bei mit ohne nach vor uber ueber uberlieferte bericht berichtet aussage prophet " +
 "allah frau frauen muslim muslima sahih quelle ersten ihren seine ihrem ihrem " +
 "khadijah aishah hafsah safiyyah sawdah zaynab maymunah umm habibah bint ibn")
 .split(/\s+/));
function words(x) {return new Set(norm(x).split(" ").filter(w=>w.length>=4&&!stop.has(w)));}
function near(a,b) {
  const A=words(a),B=words(b),common=[...A].filter(x=>B.has(x)).length;
  return {common,score:common/Math.max(1,Math.min(A.size,B.size))};
}
function refs(source) {
  const s=norm(source);
  const out=[];
  const rx=/\b(bukhari|muslim)\b.{0,140}?\b(?:nr|hadith|hadis|no)\s+(\d{2,5})/g;
  for(const m of s.matchAll(rx))out.push(m[1]+":"+m[2]);
  return [...new Set(out)];
}
function url(s) {
  let x=String(s||"").trim();
  if(!/^https?:\/\//.test(x))return "";
  try{const u=new URL(x);return u.hostname.toLowerCase()+u.pathname.replace(/\/+$/,"");}
  catch(e){return "";}
}
function item(e,file) {
  const title=e.titel||e.title||"",text=e.vollstaendigeAussage||e.inhalt||e.body||e.statementSummary||e.kurzvorschau||"";
  const src=e.quellenanzeige||e.source||e.sourceLabel||"";
  return {id:String(e.kennung||e.id||e.postReference||e.number||"?"),file,title,text,source:src,
    explicit:String(e.quellePrimaerId||"").trim().toLowerCase(),
    refs:refs(src),url:url(e.direktnachweisUrl),titleKey:norm(title)};
}
function candidates() {
  const dir=path.join(root,"data");
  const files=fs.readdirSync(dir).filter(n=>/^frauen-.*\.json$/.test(n)).map(n=>"data/"+n);
  const prev=[],fresh=[];
  for(const p of files) {
    const now=read(p),then=oldJson(p);
    const oldIds=new Set((then.eintraege||[]).map(x=>String(x.kennung||"")));
    for(const e of now.eintraege||[]) {
      const x=item(e,p);
      if(oldIds.has(x.id))prev.push(x);else fresh.push(x);
    }
    // Deleted records cannot be overwritten to evade the duplicate check.
    for(const e of then.eintraege||[])if(!(now.eintraege||[]).some(y=>y.kennung===e.kennung))
      prev.push(item(e,p+" (basis)"));
  }
  const postsDir=path.join(root,"content/posts");
  if(fs.existsSync(postsDir))for(const filename of fs.readdirSync(postsDir).filter(x=>x.endsWith(".md"))) {
    const raw=fs.readFileSync(path.join(postsDir,filename),"utf8");
    const front=(raw.match(/^---\s*\n([\s\S]*?)\n---/)||[])[1]||"";
    const attr=k=>{let m=front.match(new RegExp("^"+k+":\\s*(.*)$","m"));return m?m[1].trim().replace(/^["']|["']$/g,""):""};
    prev.push(item({id:attr("id")||filename,title:attr("title"),source:attr("source"),
      body:raw.slice(front.length+8,front.length+1000)},"content/posts/"+filename));
  }
  const reg=path.join(root,"q/_registry/shortlinks.json");
  if(fs.existsSync(reg))for(const q of read("q/_registry/shortlinks.json").links||[])
    prev.push(item({id:"q/"+q.number,title:q.title,source:q.sourceLabel,statementSummary:q.statementSummary},"q/_registry/shortlinks.json"));
  return {filesCount:files.length,previous:prev,newItems:fresh};
}
function compare(a,b) {
  const reasons=[];
  if(a.id===b.id)reasons.push("kennung");
  if(a.explicit&&a.explicit===b.explicit)reasons.push("quellePrimaerId");
  if(a.refs.some(x=>b.refs.includes(x)))reasons.push("gleiche-Hadith-Fundstelle");
  if(a.url&&a.url===b.url)reasons.push("identischer-Quellenlink");
  if(a.titleKey&&a.titleKey===b.titleKey)reasons.push("identischer-Titel");
  // Semantic smoke test; never claim proof from approximate similarity.
  const t=near(a.title,b.title),v=near(a.text,b.text);
  if((t.common>=3&&t.score>=.78)||(v.common>=7&&v.score>=.78))
    reasons.push("redaktioneller-Semantikverdacht");
  return reasons;
}
try {
  // Require a real Git base. Never silently accept all files as 'new'.
  git(["rev-parse","--verify",base]);
  const {filesCount,previous,newItems}=candidates();
  const errors=[],warnings=[],seen=[];
  for(const a of newItems) {
    if(!/^(bukhari|muslim):\d{2,5}$/.test(a.explicit))errors.push({id:a.id,problem:"quellePrimaerId fehlt/ungueltig"});
    if(!a.refs.includes(a.explicit))errors.push({id:a.id,problem:"quellePrimaerId widerspricht der Quellenanzeige"});
    for(const b of previous.concat(seen)) {
      const reasons=compare(a,b);
      if(!reasons.length)continue;
      const record={newId:a.id,existingId:b.id,existingFile:b.file,reasons};
      if(reasons.some(r=>r!=="redaktioneller-Semantikverdacht"))errors.push(record);
      else warnings.push(record);
    }
    seen.push(a);
  }
  const summary={ok:errors.length===0&&warnings.length===0,base,filesCount,
    legacyAndOtherRecords:previous.length,newRecords:newItems.length,
    errors:errors.slice(0,80),warnings:warnings.slice(0,80),
    note:"Quelle/ID/Titel/Link plus semantisches Vorsieb; redaktioneller Gesamtvergleich bleibt obligatorisch. Keine Freigabe oder Publikation."};
  process.stdout.write(JSON.stringify(summary,null,2)+"\n");
  if(!summary.ok)process.exitCode=2;
} catch(e) {console.error("Frauen-Dublettenpruefung fehlgeschlagen: "+e.message);process.exitCode=2;}
