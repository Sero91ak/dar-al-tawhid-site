#!/usr/bin/env node
"use strict";
/**
 * Only indexes audio URLs already present in the canonical, checked-in
 * children's manifests. Never generates speech, publishes audio, or approves it.
 * Stable SHA-bound review IDs ensure a replaced recording needs a new decision.
 */
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto"),vm=require("node:vm");
const root=path.resolve(__dirname,".."),sourcePath="kids/data/audio-review-sources-v1.json";
const registry=JSON.parse(fs.readFileSync(path.join(root,sourcePath),"utf8"));
const hash=s=>crypto.createHash("sha256").update(s).digest("hex");
const MAX=16000;
const seenGlobal=new Set(),sections=[];
const asset=/^\/kids\/assets\/[a-zA-Z0-9/_-]+\.(?:mp3|m4a|aac|ogg|wav)(?:\?[a-zA-Z0-9=&._-]+)?$/i;
const pretty=x=>String(x||"").replace(/[_-]+/g," ").replace(/\s+/g," ").trim();
const take=(s,n)=>String(s||"").slice(0,n);

const AREA_LABEL={
  sidq:"Ṣidq",
  akhlaq:"Charakter",
  adab:"Adab",
  fiqh:"Fiqh",
  aqidah:"ʿAqīdah",
  quran:"Qurʾān",
  sirah:"Sīrah",
  dua:"Duʿāʾ",
  family:"Familie",
  vocabulary:"Wörter"
};
const VOCAB_LABEL={
  adab:"Adab",akhlaq:"Akhlaq",aqidah:"ʿAqīdah",bismillah:"Bismillāh",
  dhikr:"Dhikr",dua:"Duʿāʾ",hadith:"Ḥadīth",ibadah:"ʿIbādah",
  ikhlas:"Ikhlāṣ",iman:"Īmān",nafs:"Nafs",niyyah:"Niyyah",
  qadar:"Qadar",rahmah:"Raḥmah",ramadan:"Ramaḍān",sahabah:"Ṣaḥābah",
  salaf:"Salaf",salah:"Ṣalāh",shirk:"Schirk",sira:"Sīrah",
  tabiin:"Tābiʿīn",taharah:"Ṭahārah",tarbiyah:"Tarbiyah",
  tawhid:"Tawḥīd",tazkiyah:"Tazkiyah",wudu:"Wuḍūʾ",zakat:"Zakāt"
};
const DEEN_CATEGORY_TITLE={
  "was-ist-tawhid":"Was ist Tawḥīd?",
  "was-ist-iman":"Was ist Īmān?",
  "asma-wa-sifat":"Asmāʾ wa-Ṣifāt",
  "was-ist-ibadah":"Was ist ʿIbādah?",
  "adab-und-akhlaq":"Adab und Akhlāq",
  "al-akhirah":"Die Āḫirah"
};
const AREA_ORDER=["sidq","akhlaq","adab","fiqh","aqidah","quran","sirah","dua","family","vocabulary"];

function loadLessonTitles(){
  const sandbox={window:{}};
  vm.createContext(sandbox);
  for(const ver of ["v1","v2","v22","v25","v26","v27","v28","v29"]){
    const p=path.join(root,"kids/akademie/curriculum-"+ver+".js");
    if(!fs.existsSync(p))continue;
    new vm.Script(fs.readFileSync(p,"utf8"),{filename:p}).runInContext(sandbox,{timeout:4000});
  }
  const catalog=sandbox.window.DARKidsAcademyCurriculum||{};
  const titles={sidq:"Ṣidq – Wahrhaftigkeit"};
  for(const [id,lesson] of Object.entries(catalog)){
    if(lesson&&typeof lesson==="object"&&(lesson.title||lesson.topic)){
      titles[lesson.id||id]=lesson.title||lesson.topic;
    }
  }
  return titles;
}
const LESSON_TITLES=loadLessonTitles();

function areaOf(lessonId){
  const id=String(lessonId||"");
  if(id==="sidq"||id.startsWith("sidq-"))return "sidq";
  if(id.startsWith("vocabulary-")||id==="vocabulary")return "vocabulary";
  const prefix=id.split("-")[0];
  return AREA_LABEL[prefix]?prefix:"weitere";
}
function lessonTitleOf(lessonId){
  const id=String(lessonId||"");
  if(LESSON_TITLES[id])return LESSON_TITLES[id];
  if(id.startsWith("vocabulary-")){
    const key=id.slice("vocabulary-".length);
    return "Wörter · "+(VOCAB_LABEL[key]||pretty(key));
  }
  return pretty(id)||"Lektion";
}
function groupLabel(lessonId){
  const area=areaOf(lessonId);
  const areaLabel=AREA_LABEL[area]||"Weitere";
  const title=lessonTitleOf(lessonId);
  return take(areaLabel+" · "+title,160);
}

function shaOk(value){
  return typeof value==="string" && /^[a-f0-9]{64}$/.test(value);
}
function pushEntry(entries,seenKeys,src,doc,{idKey,title,text,group,url,sha256,durationSec,modelId,sourceKey}){
  if(typeof url!=="string"||!asset.test(url))return;
  const key=src.id+"\n"+url+"\n"+String(idKey||"")+"\n"+String(text||"");
  if(seenKeys.has(key))return;
  seenKeys.add(key);
  seenGlobal.add(url.split("?")[0]);
  entries.push({
    id:hash(key).slice(0,24),
    title:take(title,220),
    text:take(text,600),
    group:group?take(group,160):undefined,
    url,
    sha256:shaOk(sha256)?sha256:null,
    durationSec:Number(durationSec||0)||null,
    modelId:take(modelId||doc.modelId||"",80),
    sourcePath:src.path,
    sourceKey:take(sourceKey,180),
    originalApproval:false,
    humanListeningApproved:false,
    releaseEnabled:false,
  });
  if(entries.length>MAX)throw Error(src.id+": too many audio URLs");
}

function gatherAcademy(src,doc){
  const entries=[],seenKeys=new Set(),seenUrls=new Set();
  const bag=doc&&doc.entries&&typeof doc.entries==="object"?doc.entries:{};
  const rows=[];
  for(const [clipKey,node] of Object.entries(bag)){
    if(!node||typeof node!=="object")continue;
    const lessonId=String(node.sourceLessonId||"");
    const spoken=take(node.spokenText||node.text||node.ttsText||clipKey,600);
    rows.push({
      area:areaOf(lessonId),
      lessonId,
      group:groupLabel(lessonId),
      title:take(spoken||pretty(clipKey),220),
      text:spoken,
      url:node.url,
      sha256:node.sha256,
      durationSec:node.durationSeconds||node.durationSec,
      modelId:node.modelId,
      sourceKey:"entries/"+lessonId,
      idKey:lessonId+"\n"+clipKey,
      approval:node
    });
  }
  rows.sort((a,b)=>{
    const ao=AREA_ORDER.indexOf(a.area),bo=AREA_ORDER.indexOf(b.area);
    const ak=ao<0?99:ao,bk=bo<0?99:bo;
    if(ak!==bk)return ak-bk;
    const groupCmp=String(a.group).localeCompare(String(b.group),"de");
    if(groupCmp)return groupCmp;
    const aAns=/^Antwort\s+\d+:/i.test(String(a.idKey||""));
    const bAns=/^Antwort\s+\d+:/i.test(String(b.idKey||""));
    if(aAns!==bAns)return aAns?1:-1;
    return String(a.title).localeCompare(String(b.title),"de");
  });
  for(const row of rows){
    const audioPath=String(row.url||"").split("?")[0];
    if(seenUrls.has(audioPath))continue;
    const start=entries.length;
    pushEntry(entries,seenKeys,src,doc,row);
    if(entries.length>start)seenUrls.add(audioPath);
    if(entries.length>start){
      const last=entries[entries.length-1];
      const node=row.approval||{};
      last.originalApproval=Boolean(node.humanListeningApproved===true && node.approvedForPlayback===true);
      last.humanListeningApproved=node.humanListeningApproved===true;
      last.releaseEnabled=node.releaseEnabled===true;
    }
  }
  return {id:src.id,title:src.title,subtitle:src.subtitle,order:src.order,count:entries.length,embedded:false,entries};
}

function gatherDeen(src,doc){
  const entries=[],seenKeys=new Set();
  const categories=Array.isArray(doc&&doc.categories)?doc.categories:[];
  for(const cat of categories){
    const catId=String(cat&&(cat.id||"")||"");
    const catTitle=take(cat&&(cat.title||cat.name)||DEEN_CATEGORY_TITLE[catId]||pretty(catId)||"Den Dīn",120);
    const lessons=Array.isArray(cat&&cat.lessons)?cat.lessons:[];
    for(const lesson of lessons){
      const audio=lesson&&lesson.audio&&typeof lesson.audio==="object"?lesson.audio
        :(lesson&&typeof lesson.audio==="string"?{url:lesson.audio}:null);
      if(!audio||typeof audio.url!=="string")continue;
      const title=take(lesson.title||lesson.id||"Lektion",220);
      pushEntry(entries,seenKeys,src,doc,{
        idKey:String(lesson.id||title),
        title,
        text:take(lesson.summary||lesson.title||"",600),
        group:catTitle,
        url:audio.url,
        sha256:audio.sha256,
        durationSec:audio.durationSeconds||audio.durationSec,
        modelId:audio.modelId,
        sourceKey:"categories/"+(cat.id||catTitle)+"/"+(lesson.id||title),
      });
      if(entries.length){
        const last=entries[entries.length-1];
        last.originalApproval=Boolean(audio.humanListeningApproved===true && audio.approvedForPlayback===true);
        last.humanListeningApproved=audio.humanListeningApproved===true;
        last.releaseEnabled=audio.releaseEnabled===true;
      }
    }
  }
  return {id:src.id,title:src.title,subtitle:src.subtitle,order:src.order,count:entries.length,embedded:false,entries};
}

function gather(src){
 if(src.kind==="embedded")return {id:src.id,title:src.title,subtitle:src.subtitle,order:src.order,count:33,embedded:true,entries:[]};
 if(!/^kids\/data\/[a-z0-9-]+\.json$/.test(src.path))throw Error("Unsafe registry source: "+src.path);
 const doc=JSON.parse(fs.readFileSync(path.join(root,src.path),"utf8"));
 if(src.id==="academy")return gatherAcademy(src,doc);
 if(src.id==="deen")return gatherDeen(src,doc);
 const entries=[],seen=new Set();
 function walk(node,stack=[],context=""){
  if(!node || typeof node!=="object")return;
  if(Array.isArray(node)){for(let i=0;i<node.length;i++)walk(node[i],stack.concat(String(i)),context);return;}
  const ownTitle=take(node.title||node.question||node.name||node.label||node.displayTitle||node.person||"",190);
  const myContext=ownTitle||context;
  if(typeof node.url==="string"&&asset.test(node.url)){
   const audioPath=node.url.split("?")[0];
   if(!seen.has(audioPath) && !seenGlobal.has(audioPath)){
    seen.add(audioPath);seenGlobal.add(audioPath);
    const clipKey=stack.slice(-2).map(pretty).join(" / ");
    const spoken=take(node.text||node.ttsText||node.spokenText||node.originalText||"",600);
    const name=take(myContext||spoken||clipKey||audioPath.split("/").pop(),180);
    const label=take(clipKey && !name.includes(clipKey)?name+" · "+clipKey:name,220);
    entries.push({
      id:hash(src.id+"\n"+audioPath+"\n"+String(node.sha256||"")).slice(0,24),
      title:label,
      text:spoken,
      url:node.url,
      sha256:shaOk(node.sha256)?node.sha256:null,
      durationSec:Number(node.durationSeconds||node.durationSec||node.duration||0)||null,
      modelId:take(node.modelId||doc.modelId||"",80),
      sourcePath:src.path,
      sourceKey:stack.slice(0,4).join("/").slice(0,180),
      originalApproval:Boolean(node.humanListeningApproved===true && node.approvedForPlayback===true),
      humanListeningApproved:node.humanListeningApproved===true,
      releaseEnabled:node.releaseEnabled===true,
    });
    if(entries.length>MAX)throw Error(src.id+": too many audio URLs");
   }
  }
  for(const [k,v] of Object.entries(node)){
    if(k==="sourceRefs"||k==="image"||k==="sources"||k==="artwork"||k==="policy")continue;
    if(v && typeof v==="object")walk(v,stack.concat(k),myContext);
  }
 }
 walk(doc);
 return {id:src.id,title:src.title,subtitle:src.subtitle,order:src.order,count:entries.length,embedded:false,entries};
}
for(const src of registry.sources)sections.push(gather(src));
const catalog={schemaVersion:1,kind:"nonpublic-qa-audio-index",generatedFrom:sourcePath,releaseEnabled:false,automaticApproval:false,security:"No secret URLs, only existing published assets and immutable original review recordings",sections};
const output=path.join(root,"kids-audio-review-library-v1.json");
fs.writeFileSync(output,JSON.stringify(catalog)+"\n","utf8");
const n=sections.reduce((s,x)=>s+x.count,0);
console.log("AUDIO REVIEW REGISTRY: "+sections.length+" sections, "+n+" indexed original clips; zero synthesis or approval");
for(const s of sections)console.log("  "+s.id+": "+s.count);
const academy=sections.find(s=>s.id==="academy");
const deen=sections.find(s=>s.id==="deen");
if(sections.find(s=>s.id==="quiz-v4").count<450 || sections.find(s=>s.id==="dua-ar").count<100 || sections.find(s=>s.id==="dua-de").count<100)throw Error("Important original audio collections missing: refused to silently publish incomplete index");
if(!academy||academy.count<1800)throw Error("Akademie-Hörindex unvollständig: erwartet mindestens 1800 Clips");
if(!deen||deen.count<30)throw Error("Den-Dīn-Hörindex unvollständig: erwartet 30 Lektionen");
