#!/usr/bin/env node
"use strict";
const vm=require("node:vm"),fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict"),crypto=require("node:crypto");
const source=fs.readFileSync(path.join(__dirname,"dar-adult-central-content.js"),"utf8");
const hash=x=>crypto.createHash("sha256").update(typeof x==="string"?x:JSON.stringify(x)).digest("hex");
const dua={id:"dua-1",title:"Unser Herr",de:"Gib uns Gutes",ar:"رَبَّنَا",tr:"Rabbanā",src:"Qurʾān 2:201"};
const quiz={id:"quiz-1",question:"Was ist Tawḥīd?",answers:["Eins","Zwei"],correctIndex:0,source:"Qurʾān 112:1",explanation:"Der Glaube"};
const learning={id:"lesson-1",title:"Die Lehre",body:"Deutscher Text",source:"Qurʾān 112:1"};
const cases=[
 {kind:"dua",ref:dua.id,fields:{title:dua.title,meaning:dua.de},immutable:{arabicOriginal:dua.ar,transliteration:dua.tr,source:dua.src,type:""},translated:{title:"Rabbimiz",meaning:"Bize iyilik ver"}},
 {kind:"quiz",ref:quiz.id,fields:{question:quiz.question,answers:quiz.answers,explanation:quiz.explanation},immutable:{correctIndex:0,source:quiz.source,sourceLinks:[],sensitivity:"",reviewStatus:""},translated:{question:"Tevhid nedir?",answers:["Bir","İki"],explanation:"İman"}},
 {kind:"learning",ref:learning.id,fields:{title:learning.title,body:learning.body},immutable:{source:learning.source,sourceLinks:[]},translated:{title:"Ders",body:"Türkçe metin"}}
];
const files={
 "/content/duas/duas.json":[dua],
 "/data/quiz-questions.json":{questions:[quiz]},
 "/data/learning-content.json":{lessons:[learning]}
};
const manifest={schemaVersion:1,locale:"tr",originalLocale:"de",scope:"adult-only",onlyApproved:true,records:{}};
for(const c of cases){
 const id=c.kind+":"+c.ref,sourceHash=hash({fields:c.fields,immutable:c.immutable});
 const filename="tr/"+c.kind+"/"+c.ref+"-"+hash(id).slice(0,10)+".json";
 manifest.records[id]={kind:c.kind,path:filename,sourceHash};
 files["/content/i18n/published/"+filename]={id,kind:c.kind,locale:"tr",sourceHash,status:"approved",fields:c.translated,immutable:c.immutable};
}
files["/content/i18n/published/tr/manifest.json"]=manifest;
const requested=[];
const win={crypto:crypto.webcrypto,TextEncoder,localStorage:{getItem:()=>"tr"},
 fetch:async url=>{requested.push(url);return {ok:Object.hasOwn(files,url),status:404,json:async()=>files[url]}}};
vm.runInNewContext(source,{window:win,TextEncoder,Uint8Array,Map,Set,Promise,Error,JSON});
(async()=>{
 const reader=win.DarAdultCentralContent.create();
 for(const c of cases){
  const item=await reader.resolveById(c.kind,c.kind+":"+c.ref);
  assert.equal(item.status,"approved",c.kind);
  assert.equal(item.displayLocale,"tr",c.kind);
  assert.equal(item.fields[Object.keys(c.translated)[0]],Object.values(c.translated)[0]);
 }
 const german=await reader.resolveById("dua","dua:dua-1","de");
 assert.equal(german.fields.meaning,dua.de);
 assert.equal(german.immutable.transliteration,"Rabbanā","Du'a tr source is transliteration, not Turkish translation");
 await assert.rejects(reader.resolveById("hadith","hadith:HAD-1"),/caller-supplied/);
 await assert.rejects(reader.resolveById("dua","dua:no-such-id"),/not indexed/);
 assert(requested.includes("/content/duas/duas.json"));
 console.log("PASS: one Turkish record per canonical Du'a/Quiz/Learning item; source, Arabic and answer keys unchanged");
})().catch(e=>{console.error(e);process.exitCode=1});
