#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),os=require("node:os"),path=require("node:path"),cp=require("node:child_process");
const dir=fs.mkdtempSync(path.join(os.tmpdir(),"dar-i18n-test-")),out=path.join(dir,"worklist.json");
const script=path.join(__dirname,"translation-worklist.cjs");
function write(name,value){
 const target=path.join(dir,name);fs.mkdirSync(path.dirname(target),{recursive:true});
 fs.writeFileSync(target,typeof value==="string"?value:JSON.stringify(value));
}
function generate(){
 cp.execFileSync(process.execPath,[script,"--root",dir,"--out",out],{stdio:"pipe"});
 return JSON.parse(fs.readFileSync(out,"utf8"));
}
try{
 const initialCodes=["de","ar","en","tr","ku","ckb","bs"];
 write("desktop-preview/i18n-core-v1/locales.json",{defaultLocale:"de",locales:Object.fromEntries(initialCodes.map(code=>[code,{name:code,dir:["ar","ckb"].includes(code)?"rtl":"ltr",messages:{}}]))});
 write("content/posts/posts-index.json",{files:[{name:"one.md"}]});
 write("content/posts/one.md",'---\nid: "one"\ntitle: "Tawḥīd"\nsource: "Qurʾān 51:56"\n---\n\nDeutscher Originaltext.');
 write("q/_registry/shortlinks.json",{links:[{number:47,title:"Q47",statementSummary:"Ein Nachweis",sourceLabel:"aṭ-Ṭabarī"}]});
 write("test/data/hadith/search-index.json",[{id:"HAD-1",german:"Überlieferung",bookTitle:"Bukhārī",hadithNumber:"1",grade:"Ṣaḥīḥ",germanStatus:"verified"}]);
 write("content/duas/duas.json",[{id:"dua-1",title:"Unser Herr",ar:"رَبَّنَا",tr:"Rabbanā",de:"Unser Herr",src:"Qurʾān 2:201"}]);
 write("data/quiz-questions.json",[{id:"quiz-1",question:"Frage?",answers:["Eins","Zwei"],correctIndex:0,explanation:"Auslegung",source:"Qurʾān 51:56",status:"published"}]);
 write("data/learning-content.json",{lessons:[{id:"lesson-1",title:"Lektion",body:"Lehrtext",source:"Qurʾān 112:1"}]});
 write("lernen/a/index.html",'<script>const questions=[{q:"Frage A?",a:["Ja","Nein"],correct:0,why:"Weil A."}];</script>');
 write("lernen/b/index.html",'<script>const questions=[{title:"Frage B?",hint:"Hinweis B",options:["Ja","Nein"],correct:1,why:"Weil B."}];</script>');
 write("lernen/c/index.html",'<script>const questions=[{q:"Frage C?",choices:["Ja","Nein"],correct:1,why:"Weil C."}];</script>');

 const first=generate();
 const canonicalId="post:one";
 const canonicalSuffix=require("node:crypto").createHash("sha256").update(canonicalId).digest("hex").slice(0,10);
 assert.equal(first.items.find(x=>x.id===canonicalId).languages.tr.translationPath,
  "desktop-preview/i18n-core-v1/translations/tr/post/one-"+canonicalSuffix+".json");
 assert.equal(first.summary.contentItems,9);
 assert.equal(first.summary.translationTasks,54);
 assert.equal(first.summary.unfinished,54);
 assert.equal(first.summary.newItems,9);
 assert.equal(first.items.find(x=>x.kind==="dua").immutable.transliteration,"Rabbanā");
 assert.equal(first.items.find(x=>x.kind==="dua").immutable.arabicOriginal,"رَبَّنَا");
 assert.equal(first.items.find(x=>x.kind==="quiz").immutable.correctIndex,0);
 assert.equal(first.summary.byKind.learning,4);
 const second=generate();assert.equal(second.summary.changedItems,0);assert.equal(second.summary.newItems,0);
 write("content/posts/one.md",'---\nid: "one"\ntitle: "Tawḥīd"\nsource: "Qurʾān 51:56"\n---\n\nVollständig revidierter Text.');
 const changed=generate();assert.equal(changed.summary.changedItems,1);
 const q=changed.items.find(x=>x.kind==="post");const p=q.languages.ar.translationPath;
 write(p,{id:q.id,locale:"ar",sourceHash:q.sourceHash,status:"approved",fields:{title:"التوحيد",body:"متن عربي للمراجعة"},reviewer:{linguistic:"Reviewer A",religious:"Reviewer B",arabicOriginalChecked:true,sourcesChecked:true},reviewedAt:"2026-10-21"});
 const approved=generate();assert.equal(approved.summary.byState.approved,1);
 write("content/posts/one.md",'---\nid: "one"\ntitle: "Tawḥīd"\nsource: "Qurʾān 51:56"\n---\n\nEin erneuter Originaltext.');
 const stale=generate();assert.equal(stale.items.find(x=>x.id===q.id).languages.ar.state,"stale");
 assert.equal(stale.summary.byState.approved,0);
 const catalog=JSON.parse(fs.readFileSync(path.join(dir,"desktop-preview/i18n-core-v1/locales.json"),"utf8"));
 catalog.locales.fr={name:"Français",dir:"ltr",messages:{}};
 write("desktop-preview/i18n-core-v1/locales.json",catalog);
 const expanded=generate();
 assert(expanded.locales.includes("fr"));
 assert.equal(expanded.summary.translationTasks,63);
 assert.equal(expanded.queue.filter(x=>x.locale==="fr").length,9);
 const batch=JSON.parse(cp.execFileSync(process.execPath,[path.join(__dirname,"select-post-batch.cjs"),"--inventory",out,"--batch","1"],{encoding:"utf8"}));
 assert.equal(batch.totalEligiblePosts,1);
 assert.deepEqual(batch.contentIds,["post:one"]);
 assert.equal(batch.targetLocales.length,7);
 assert(batch.items[0].openLocales.includes("fr"));
 console.log("PASS: nine canonical content records, 7→8 dynamic languages, stable SHA, stale review invalidation, immutable Arabic/quiz fields.");
}catch(e){console.error(e);process.exitCode=1}finally{fs.rmSync(dir,{recursive:true,force:true})}
