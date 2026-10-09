#!/usr/bin/env node
"use strict";
/* KIDS_DUA_TRILINGUAL_INTEGRITY_V1
   Ensures all approved Du'a words have three exact-index display segments.
   This is a structural QA test, NOT a linguistic review or audio-forced alignment. */
function runKidsDuaTrilingualGuard(){
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const ROOT=path.resolve(__dirname,".."),errors=[];
const read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
const check=(ok,message)=>{if(!ok)errors.push(message)};
function loadWindow(p){
  const context={window:{}};
  vm.runInNewContext(read(p),context,{filename:p,timeout:5000});
  return context.window;
}
function arabicWords(dua){
  return String(dua.audioArabicText||dua.arabic||"").normalize("NFD").replace(/\s+/g," ").trim().split(/\s+/)
  .map(x=>x.replace(/[\u06D6-\u06DC]/g,"").replace(/^[،؛؟,.!…«»"'()\[\]{}]+|[،؛؟,.!…«»"'()\[\]{}]+$/g,""))
  .filter(x=>Boolean(x)&&/[\u0621-\u064A\u0671]/.test(x));
}
const data=JSON.parse(read("kids/data/dua-kids.json"));
const items=data.items||[];
check(items.length>=120,"mindestens 120 Duʿāʾs erforderlich, vorhanden: "+items.length);
const words=loadWindow("kids/dua-word-meanings-v1.js").DARKidsDuaWordMeanings;
const phonetic=loadWindow("kids/dua-phonetic-alignment-v1.js").DARKidsDuaPhoneticAlignment;
check(words&&typeof words.get==="function","German mapping API fehlt");
check(phonetic&&typeof phonetic.get==="function","phonetic mapping API fehlt");
let arabicCount=0,meaningCount=0,translitCount=0;
const ids=new Set();
for(const d of items){
  const id=String(d.id||"");
  check(id&&!ids.has(id),"Duʿāʾ-ID fehlt/dupliziert: "+id);
  ids.add(id);
  const ar=arabicWords(d),seg=Array.isArray(d.learningSegments)?d.learningSegments:[];
  arabicCount+=ar.length;
  check(ar.length===seg.length,id+": word/audio row count "+ar.length+"/"+seg.length);
  const de=words&&words.get(d,ar);
  check(Array.isArray(de)&&de.length===ar.length,id+": German indices misaligned");
  const phon=phonetic&&phonetic.get(d,ar);
  for(let i=0;i<ar.length;i++){
    const row=seg[i]||{};
    check(String(row.arabic||"").normalize("NFD")===ar[i],id+": Arabic index "+i+" differs");
    const german=String(row.german||row.meaning||(de&&de[i])||"").trim();
    const latin=String(row.transliteration||(phon&&phon[i])||"").trim();
    if(!german||/^[•—–\s]+$/.test(german))errors.push(id+": German meaning missing at "+i);else meaningCount++;
    if(!latin||/^[•—–\s]+$/.test(latin))errors.push(id+": Latin pronunciation missing at "+i);else translitCount++;
    check(Boolean(row.audioUrl),id+": native Fuṣḥā word clip missing at "+i);
  }
}
const js=read("kids/dua-smart-learn.js"),css=read("kids/dua-learn-trilingual-v1282.css");
for(const needle of ['class="dsl-german"','class="dsl-word de"','[data-seg]','function attachPhraseFollow','function playWordSequence','function fitReadingStage','seg.arabic,seg.transliteration,seg.german']){
 check(js.includes(needle),"Duʿāʾ runtime marker missing: "+needle);
}
for(const needle of [".dsl-german{",".dsl-reading-stage .dsl-translit{",".dsl-reading-stage .dsl-arabic{",".dsl-word.active.de","border-top:1px solid","border-bottom:0!important"]){
 check(css.includes(needle),"German/Arabic layout guard missing: "+needle);
}
const ver=JSON.parse(read("kids/version.json")),sw=read("kids/sw.js");
check(sw.includes('const KIDS_BUILD_ID="'+ver.buildId+'"'),"SW/build-ID mismatch");
for(const entry of ["/kids/dua-smart-learn.js?v=1285","/kids/dua-word-meanings-v1.js?v=2","/kids/dua-phonetic-alignment-v1.js?v=1","/kids/dua-learn-trilingual-v1282.css?v=1283"]){
 check(sw.includes(entry),"SW precache missing "+entry);
 for(const page of ["kids/index.html","kids/start.html","kids/shell.html"]){
  const body=read(page);check(body.includes(entry),page+" resource missing "+entry);
 }
}
check(sw.includes('dar-al-tawhid-kids-v1285'),"SW cache must advance after runtime update");
check(arabicCount===meaningCount&&arabicCount===translitCount,"3-language word counts differ");
if(errors.length){errors.forEach(e=>console.error("KIDS TRILINGUAL FAIL:",e));return errors.length}
console.log("KIDS TRILINGUAL PASS: "+items.length+" Duʿāʾs, "+arabicCount+" matching Arabic/Latin/German words, audio index and offline precache");
return 0;
}
if(require.main===module)process.exit(runKidsDuaTrilingualGuard()?1:0);
module.exports={runKidsDuaTrilingualGuard};
