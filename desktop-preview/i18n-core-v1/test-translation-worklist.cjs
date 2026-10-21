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
 assert.equal(first.summary.contentItems,9);
 assert.equal(first.summary.translationTasks,54);
 assert.equal(first.summary.unfinished,54);
 assert.equal(first.summary.newItems,9);
 assert.equal(first.items.find(x=>x.kind==="dua").immutable.transliteration,"Rabbanā");
 assert.equal(first.items.find(x=>x.kind==="dua").immutable.arabicOriginal,"رَبَّنَا");
 assert.equal(first.items.find(x=>x.kind==="quiz").immutable.correctIndex,0);
 assert.equal(first.summary.byKind.learning,4);
 const second=generate();assert.equal(second.summary.changedItems,0);assert.equal(second.summary.newItems,0);
 // Persisted drafts are reused at the same source revision and marked stale when German changes.
 const initialPost=second.items.find(x=>x.id==="post:one");
 const draftPath=initialPost.languages.tr.translationPath;
 write(draftPath,{id:"post:one",locale:"tr",sourceHash:initialPost.sourceHash,status:"draft",
  fields:{title:"Tevhid",body:"Türkçe inceleme taslağı"},reviewer:null});
 const draftState=generate();assert.equal(draftState.items.find(x=>x.id==="post:one").languages.tr.state,"draft");

 write("content/posts/one.md",'---\nid: "one"\ntitle: "Tawḥīd"\nsource: "Qurʾān 51:56"\n---\n\nVollständig revidierter Text.');
 const changed=generate();assert.equal(changed.summary.changedItems,1);
 assert.equal(changed.items.find(x=>x.id==="post:one").languages.tr.state,"stale");
 const q=changed.items.find(x=>x.kind==="post");const p=q.languages.ar.translationPath;
 write(p,{id:q.id,locale:"ar",sourceHash:q.sourceHash,status:"approved",fields:{title:"التوحيد",body:"متن عربي للمراجعة"},reviewer:{linguistic:"Reviewer A",religious:"Reviewer B",arabicOriginalChecked:true,sourcesChecked:true},reviewedAt:"2026-10-21"});
 const approved=generate();assert.equal(approved.summary.byState.approved,1);
 write("content/posts/one.md",'---\nid: "one"\ntitle: "Tawḥīd"\nsource: "Qurʾān 51:56"\n---\n\nEin erneuter Originaltext.');
 const stale=generate();assert.equal(stale.items.find(x=>x.id===q.id).languages.ar.state,"stale");
 assert.equal(stale.summary.byState.approved,0);
 console.log("PASS: six content types, 36 locale tasks, stable SHA, changed-source invalidation, Arabic original, transliteration, quiz index and reviewed approval.");
}catch(e){console.error(e);process.exitCode=1}finally{fs.rmSync(dir,{recursive:true,force:true})}
