#!/usr/bin/env node
/* KIDS_DUA_TRILINGUAL_GUARD_V1282
 * Ensures German meanings are complete for 120 Duʿāʾs and the three learning
 * layers stay synchronised, legible, cached, and identical on all entry pages.
 * Semantic correctness still requires scholarly/language editorial review.
 */
"use strict";
const fs=require("node:fs"), path=require("node:path"), vm=require("node:vm");
const ROOT=path.join(__dirname,"..");
const read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
const data=JSON.parse(read("kids/data/dua-kids.json"));
const context={window:{}};
vm.runInNewContext(read("kids/dua-word-meanings-v1.js"),context,{filename:"dua-word-meanings-v1.js",timeout:1500});
const glossary=context.window.DARKidsDuaWordMeanings;
const items=data.items||[],bad=[];
const fail=x=>{bad.push(x);console.error("KIDS_DUA_TRILINGUAL_GUARD FAIL:",x)};
if(items.length!==120)fail("Dua count must remain 120");
if(glossary.coverage()!==120)fail("Bilingual meaning coverage must be exactly 120");
let aligned=0;
for(const d of items){
 const rows=d.learningSegments||[];
 const meanings=glossary.get(d,rows);
 if(!rows.length||!meanings||meanings.length!==rows.length||meanings.some(x=>!String(x).trim()))fail("Missing/empty German segments: "+d.id);
 else aligned+=meanings.length;
 if(rows.some((s,i)=>s.index!==i))fail("Arabic word indexes changed: "+d.id);
}
if(aligned!==1366)fail("Word alignment count changed: "+aligned+" != 1366");
const js=read("kids/dua-smart-learn.js");
for(const token of ["id=\"dslGerman\"","class=\"dsl-word de\"","getSegments(currentDua)","german:String(","root.querySelectorAll(\"[data-seg]\")","attachPhraseFollow(","playWordSequence()","var reviewed=","fitReadingStage()","queueReaderFit()"]){
 if(!js.includes(token))fail("Runtime feature missing "+token);
}
new vm.Script(js,{filename:"dua-smart-learn.js"});
const css=read("kids/dua-learn-trilingual-v1282.css");
for(const token of ["KIDS_DUA_TRILINGUAL_LEARNING_V1282",".dsl-german",".dsl-word.active.de","font-size:var(--dsl-ar-size,40px)","font-size:var(--dsl-tr-size,19px)","font-size:var(--dsl-de-size,16px)","overflow-y:auto!important","border-bottom:0!important"]){
 if(!css.includes(token))fail("Trilingual styling missing "+token);
}
const v=JSON.parse(read("kids/version.json"));
if(v.visualSystem?.serviceWorkerCache!=="v1282"||v.buildId!=="kids-shell-v178-trilingual1282")fail("Kids release version mismatch");
for(const page of ["kids/index.html","kids/start.html","kids/shell.html"]){
 const html=read(page);
 for(const token of [v.buildId,"/kids/dua-word-meanings-v1.js?v=1","/kids/dua-smart-learn.js?v=1282","/kids/dua-learn-trilingual-v1282.css?v=1282"]){
  if(!html.includes(token))fail(page+" missing "+token);
 }
}
const sw=read("kids/sw.js");
for(const token of ['dar-al-tawhid-kids-v1282',v.buildId,"/kids/dua-word-meanings-v1.js?v=1","/kids/dua-smart-learn.js?v=1282","/kids/dua-learn-trilingual-v1282.css?v=1282"]){
 if(!sw.includes(token))fail("Offline precache missing "+token);
}
if(bad.length){console.error(bad.length+" trilingual QA failures");process.exit(1)}
console.log("KIDS_DUA_TRILINGUAL_GUARD OK · 120 Duʿāʾs · 1366 contextual German word meanings · 3-layer focus · 3 pages · offline V1282 · syntax passed");
