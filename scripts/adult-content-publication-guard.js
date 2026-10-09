#!/usr/bin/env node
"use strict";
// ADULT_CANONICAL_AUTOPUBLISH: validate new adult posts before live delivery.
// --check | --sync [--post content/posts/name.md]; --self-test
// No Kids changes and no OneSignal notification actions.
const fs=require("fs"),path=require("path"),root=path.resolve(__dirname,"..");
const posts=root+"/content/posts",series=root+"/apple-tv/hadith/series";
const report=process.env.AUTOPUBLISH_REPORT_PATH||"";
function block(reason,meta={}){
 if(report)fs.writeFileSync(report,JSON.stringify({ok:false,reason,...meta},null,2));
 console.error("ADULT_PUBLICATION_BLOCKED:",reason,JSON.stringify(meta));
 process.exit(2);
}
function norm(v){return String(v||"").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[ʿʾ‘’ʼ]/g,"").replace(/[^\p{L}\p{N}]+/gu," ").replace(/\s+/g," ").trim()}
function sim(a,b){
 const A=new Set(norm(a).split(" ").filter(x=>x.length>2)),B=new Set(norm(b).split(" ").filter(x=>x.length>2));
 if(!A.size||!B.size)return 0;let both=0;for(const x of A)if(B.has(x))both++;
 return both/Math.max(A.size,B.size);
}
function short(s){const m=String(s||"").match(/(?:\/q\/|dar-al-tawhid\.de\/q\/)(\d+)/);return m?m[1]:"";}
function readPost(text,file){
 const m=text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
 if(!m)throw Error(file+": YAML frontmatter missing");
 const fm={},lines=m[1].split(/\r?\n/);
 for(let i=0;i<lines.length;i++){
  const kv=lines[i].match(/^([a-zA-Z][\w-]*):\s*(.*)$/);if(!kv)continue;
  let v=kv[2].trim();
  if(v==="|"||v==="|-"||v===">"||v===">-"){
   const block=[];while(i+1<lines.length&&(/^\s+/.test(lines[i+1])||!lines[i+1].trim())){
    block.push(lines[++i]);
   }
   const indents=block.filter(x=>x.trim()).map(x=>x.match(/^\s*/)[0].length);
   const min=indents.length?Math.min(...indents):0;
   v=block.map(x=>x.slice(Math.min(x.length,min))).join(v[0]===">"?" ":"\n").trim();
  }else if(v[0]==='"'){try{v=JSON.parse(v)}catch{}}
  else if(v[0]==="'"&&v.endsWith("'"))v=v.slice(1,-1);
  fm[kv[1]]=v;
 }
 if(/^(?:slide|slides|skip)$/i.test(fm.type||fm.layout||fm.recordType||""))return {skip:true,file};
 let type=fm.recordType||fm.appleTvType||"";
 if(!type&&/Prophet|Gesandte|Muḥammad|Muhammad/i.test(fm.scholar||""))type="hadith";
 if(!type&&/Hadith|Ḥadīṯ/i.test(fm.category||""))type="hadith";
 if(!type&&fm.scholar&&(!fm.type||fm.type==="single")&&/🖋️/u.test(m[2])&&/„[^“]+“/u.test(m[2])&&!/^(?:allah|qur.an)$/i.test(norm(fm.scholar)))type="athar";
 if(type!=="hadith"&&type!=="athar")return {skip:true,file};
 let body=m[2],piece=body.split(/\n\s*(?:📝|🌙|\*\*Überlieferungsstatus|\*\*Quelle:)/u)[0];
 const first=piece.indexOf("„"),last=piece.lastIndexOf("“");
 if(first>=0&&last>first)piece=piece.slice(first+1,last);
 else piece=piece.replace(/^🖋️[^\n]*\n/u,"");
 return {file,id:fm.id||path.basename(file,".md"),fm,type,body,sourceLink:short(m[1])||short(body),text:piece.replace(/\*\*/g,"").trim()};
}
function duplicate(a,b){
 if(a.id&&b.id&&a.id===b.id)return "same post identifier";
 const similarity=sim(a.text,b.text),A=norm(a.text),B=norm(b.text);
 if(A.length>35&&A===B)return "identical content";
 if(a.q&&b.q&&a.q===b.q&&similarity>=0.6)return "same source page and text";
 const speakerA=norm(a.speaker),speakerB=norm(b.speaker);
 if(speakerA.length>8&&speakerB.length>8&&(speakerA.includes(speakerB)||speakerB.includes(speakerA))&&similarity>=0.87)return "same speaker and meaning";
 if(a.number&&b.number&&norm(a.number)===norm(b.number)&&similarity>=0.78)return "same hadith number and statement";
 return "";
}

function allPosts(excluded){
 const idx=JSON.parse(fs.readFileSync(posts+"/posts-index.json","utf8")),out=[];
 for(const x of idx.files||[]){
  if(x.name===excluded||!x.name.endsWith(".md"))continue;
  const name=posts+"/"+x.name;if(!fs.existsSync(name))continue;
  const p=readPost(fs.readFileSync(name,"utf8"),x.name);
  if(!p.skip)out.push({ref:"content/posts/"+x.name,id:p.id,text:p.text,speaker:p.fm.scholar,q:p.sourceLink,number:p.fm.sourceHadithNumber});
 }
 return out;
}
function allTv(){
 const out=[];
 for(const dir of fs.readdirSync(series).filter(x=>/^\d+-\d+$/.test(x))){
  for(const file of fs.readdirSync(series+"/"+dir).filter(x=>/^HAD-\d+\.json$/.test(x))){
   const r=JSON.parse(fs.readFileSync(series+"/"+dir+"/"+file,"utf8"));
   out.push({ref:r.id,id:r.id,text:r.textMarkdown,speaker:(r.narratorLine||"")+" "+(r.speakerLabel||""),
    q:short((r.sourceSection||"")+" "+(r.verificationNote||"")),number:r.sourceHadithNumber,
    origin:(r.verificationNote||"").match(/post-id:\s*([^;\s]+)/)?.[1]||""});
  }
 }
 return out;
}
function seriesDirFor(n){
 const ranges=fs.readdirSync(series).filter(s=>/^\d+-\d+$/.test(s)).map(s=>{
  const p=s.split("-").map(Number);return {start:p[0],end:p[1],name:s};
 }).filter(r=>r.end>=r.start).sort((a,b)=>a.start-b.start);
 const hit=ranges.find(r=>n>=r.start&&n<=r.end);
 if(hit)return series+"/"+hit.name;
 const last=ranges[ranges.length-1];
 if(last&&n!==last.end+1)throw Error("Unsafe series gap before "+n);
 const start=last?last.end+1:1;
 return series+"/"+String(start).padStart(3,"0")+"-"+String(start+99);
}
function selected(){
 const at=process.argv.indexOf("--post"),all=at>=0?[process.argv[at+1]]:String(process.env.CHANGED_POST_FILES||"").split(/\r?\n/);
 return [...new Set(all.map(x=>String(x||"").trim()).filter(x=>/^content\/posts\/[a-z0-9][\w-]*\.md$/.test(x)))];
}
function validate(p,otherPosts,existingTv){
 if(p.skip)return "skip";
 if(!p.fm.scholar||!p.fm.source||p.text.length<36||p.text.length>20000)block("missing speaker, source or statement",{post:p.file});
 if(/^\s*#[\p{L}\p{N}_-]+\s*$/gmu.test(p.body)||/(?:^|\n)\s*(?:📥\s*Telegram|🌐\s*Website|📸\s*Instagram)\s*:/u.test(p.body))block("visible hashtags or outdated social footer",{post:p.file});
 const q=p.sourceLink;
 if(/^\s*(?:📝\s*(?:\*\*)?Quelle|🔗\s*(?:https?:\/\/)?(?:www\.)?dar-al-tawhid\.de\/q\/|(?:\*\*)?Überlieferungsstatus(?:\*\*)?\s*:)/mu.test(p.body))
  block("source, q link or isnad explanation duplicated in app statement; move to source card /q/",{post:p.file});
 if(!q||!fs.existsSync(root+"/q/"+q+"/index.html"))block("own source page /q/ missing",{post:p.file});
 const sourceHtml=fs.readFileSync(root+"/q/"+q+"/index.html","utf8");
 if(!sourceHtml.includes("qsource-links")||!sourceHtml.includes("#:~:text="))block("source page lacks verified direct text evidence",{post:p.file,q});
 if(/https?:\/\//i.test(p.body)&&!/https?:\/\/dar-al-tawhid\.de\/q\//i.test(p.body))block("external link in reader text",{post:p.file});
 const a={id:p.id,speaker:p.fm.scholar,text:p.text,q,number:p.fm.sourceHadithNumber};
 for(const e of otherPosts){const reason=duplicate(a,e);if(reason)block("existing adult post: "+reason,{post:p.file,existing:e.ref});}
 for(const e of existingTv){
  if(e.origin===p.id){
   if(norm(e.text)===norm(p.text))return "already-synced";
   block("already published Apple TV record differs; explicit update review required",{post:p.file,existing:e.ref});
  }
  const reason=duplicate(a,e);if(reason)block("existing Apple TV statement: "+reason,{post:p.file,existing:e.ref});
 }
 if(p.type==="hadith"){
  const required=["sharhText","sharhScholar","sharhBook","sharhReference","grade"];
  if(p.fm.sharhStatus!=="verified"||required.some(k=>!p.fm[k])||p.fm.sharhText.trim().length<30||p.fm.sharhReference.trim().length<15)
   block("Hadith missing verified Sharh and bibliographic reference",{post:p.file,missing:required.filter(k=>!p.fm[k])});
  if(/schwach|ungepruft|unterbrochen|da.if/i.test(norm(p.fm.grade)))block("Hadith grading requires manual verification",{post:p.file});
 }
 return q;
}
function makeRecord(p,q,n){
 const f=p.fm,h=p.type==="hadith";
 const r={id:"HAD-"+String(n).padStart(4,"0"),recordType:p.type,categoryLabel:h?"ḤADĪṮ":"ĀṮAR",language:"de",
  narratorLine:h?(f.narratorLine||f.scholar+" berichtete:"):"Über "+f.scholar+" wird überliefert:",
  speakerLabel:h?(f.speakerLabel||"Der Prophet ﷺ sagte:"):"Überlieferter Ausspruch:",
  textMarkdown:p.text,source:f.book||f.source,sourceBook:f.book||f.source,
  sourceVolume:f.sourceVolume||null,sourcePage:f.sourcePage||null,sourceSection:"DAR AL TAWḤĪD /q/"+q+"/",
  sourceHadithNumber:h?(f.sourceHadithNumber||null):null,
  grade:h?f.grade:(f.atharGrade||"Athar; Überlieferungsstatus nicht abschließend geprüft"),
  verificationNote:"post-id: "+p.id+"; "+f.source+"; Direktbelege /q/"+q+"/. "+(f.verificationNote||""),
  sharhStatus:h?"verified":null,sharhText:h?f.sharhText:null};
 if(h)Object.assign(r,{sharhLanguage:"de",sharhScholar:f.sharhScholar,sharhBook:f.sharhBook,
  sharhReference:f.sharhReference,sharhVolume:f.sharhVolume||null,sharhPage:f.sharhPage||null});
 return r;
}

function selfTest(){
 const a={id:"X1",speaker:"Umar ibn Abd al Aziz",text:"Die Pflichten erfüllen und das Verbotene meiden ist wahre Taqwa.",q:"38"};
 if(!duplicate(a,{...a,id:"X2"}))throw Error("duplicate detection broken");
 if(duplicate(a,{id:"X3",speaker:"Abu Hurayrah",text:"Ein ganz anderes Gebet.",q:"99"}))throw Error("false duplicate");
 const p=readPost('---\nid: "a"\nrecordType: "athar"\nscholar: "Umar"\nsource: "Werk"\n---\n🖋️ Umar\n\n„Die Pflichten erfüllen und die Verbote Allahs meiden ist wahre Taqwa.“\n\n📝 Quelle',"test.md");
 if(p.type!=="athar"||makeRecord(p,"38",3351).sharhStatus!==null)throw Error("Athar is not supposed to have Sharh");
 console.log("Adult content publication tests passed");
}
function main(){
 if(process.argv.includes("--self-test"))return selfTest();
 const write=process.argv.includes("--sync"),check=process.argv.includes("--validate");
 if(!write&&!check)throw Error("Usage: --validate or --sync or --self-test");
 const paths=selected();if(!paths.length){console.log("No new adult posts; no changes");return}
 const previous=allTv(),batch=[],made=[];
 let next=Math.max(0,...previous.map(x=>Number(x.id.match(/\d+/)?.[0]||0)));
 for(const file of paths){
  if(!fs.existsSync(root+"/"+file))block("Post file missing",{post:file});
  const p=readPost(fs.readFileSync(root+"/"+file,"utf8"),file);
  if(p.skip){console.log("SKIP: slide or non-hadith/athar",file);continue}
  for(const e of batch){
   const reason=duplicate({id:p.id,speaker:p.fm.scholar,text:p.text,q:p.sourceLink},
      {id:e.id,speaker:e.fm.scholar,text:e.text,q:e.sourceLink});
   if(reason)block("duplicate in new content batch: "+reason,{post:p.file,existing:e.file});
  }
  const q=validate(p,allPosts(path.basename(file)),[...previous,...made.map(x=>({id:x.id,ref:x.id,text:x.textMarkdown,speaker:x.narratorLine,q:short(x.sourceSection)}))]);
  if(q==="already-synced"){console.log("Already synced",p.id);continue}
  batch.push(p);
  if(write){
   const r=makeRecord(p,q,++next);
   const dir=seriesDirFor(next);
   fs.mkdirSync(dir,{recursive:true});
   const dest=dir+"/"+r.id+".json";
   if(fs.existsSync(dest))block("HAD number already allocated",{number:r.id});
   fs.writeFileSync(dest,JSON.stringify(r,null,2)+"\n");made.push(r);
   console.log("CREATED:",r.id,r.recordType);
  }else console.log("VALIDATED:",file,p.type);
 }
 const result={ok:true,validated:paths.length,created:made.map(x=>x.id)};
 if(report)fs.writeFileSync(report,JSON.stringify(result,null,2)+"\n");
 console.log("ADULT_CANONICAL_AUTOPUBLISH:",JSON.stringify(result));
}
if(require.main===module)try{main()}catch(error){block(error.message||String(error))}
module.exports={norm,sim,duplicate,readPost,makeRecord};
