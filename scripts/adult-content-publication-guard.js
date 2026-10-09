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
 const fm={};for(const line of m[1].split(/\r?\n/)){
  const kv=line.match(/^([a-zA-Z][\w-]*):\s*(.*)$/);if(!kv)continue;
  let v=kv[2].trim();if(v[0]==='"'){try{v=JSON.parse(v)}catch{}}else if(v[0]==="'"&&v.endsWith("'"))v=v.slice(1,-1);
  fm[kv[1]]=v;
 }
 if(/^(?:slide|slides|skip)$/i.test(fm.type||fm.layout||fm.recordType||""))return {skip:true,file};
 let type=fm.recordType||fm.appleTvType||"";
 if(!type&&/Prophet|Gesandte|Muḥammad|Muhammad/i.test(fm.scholar||""))type="hadith";
 if(!type&&/Hadith|Ḥadīṯ/i.test(fm.category||""))type="hadith";
 if(!type&&fm.scholar)type="athar";
 if(type!=="hadith"&&type!=="athar")return {skip:true,file};
 let body=m[2],piece=body.split(/\n\s*(?:📝|🌙|\*\*Überlieferungsstatus|\*\*Quelle:)/u)[0];
 const first=piece.indexOf("„"),last=piece.lastIndexOf("“");
 if(first>=0&&last>first)piece=piece.slice(first+1,last);
 else piece=piece.replace(/^🖋️[^\n]*\n/u,"");
 return {file,id:fm.id||path.basename(file,".md"),fm,type,body,text:piece.replace(/\*\*/g,"").trim()};
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
