#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),assert=require("node:assert/strict"),vm=require("node:vm");
const read=p=>fs.readFileSync(p,"utf8");
const locales=["de","ar","en","tr","ku","ckb","bs","fr","es"];
const data=JSON.parse(read("assets/q52-locales.json"));
const source=read("q/52/index.html"),lesson=read("lernen/khadijah-salam-paradies/index.html");
const code=read("assets/q52-localized.js");
assert.equal(data.qSourceId,52);assert.deepEqual(data.supported,locales);
assert.equal(data.canonicalUrl,"https://dar-al-tawhid.de/q/52/");
assert.match(source,/class="q52-ar" lang="ar" dir="rtl"/);
assert.equal((source.match(/https:\/\/dorar\.net\/hadith\/sharh\//g)||[]).length,2);
assert.match(source,/href="https:\/\/dar-al-tawhid\.de\/q\/52\/"/);
assert.match(source,/id="q52Statement"/);assert.match(source,/id="q52SharhStatement"/);
assert.match(lesson,/id="q52QuizPage"/);
for(const html of [source,lesson])assert.match(html,/q52-localized\.js\?v=/);
assert.doesNotMatch(code,/navigator\.language|navigator\.languages/);
new vm.Script(code);
for(const lang of locales){
 const p=data.locales[lang];
 assert.ok(p,lang+" missing");
 for(const k of ["title","intro","statement","sharh","reference","note","evidence1","evidence1Sub","evidence2","evidence2Sub"]){
  assert.ok(typeof p[k]==="string"&&p[k].length>9,lang+" "+k);
 }
 assert.ok(p.statement.length>120&&p.sharh.length>120,lang+" short content");
 assert.equal(p.questions.length,4);
 for(const q of p.questions)assert.ok(q.a.length===4&&q.a.every(Boolean)&&q.why&&q.q);
 for(const k of ["lang","brand","kicker","original","statement","sharh","proof","learn","quiz","question","of","correct","next","retry","result","yes","no","home"])assert.ok(p.ui[k],lang+" UI "+k);
 if(lang!=="de"){assert.notEqual(p.statement,data.locales.de.statement);assert.notEqual(p.sharh,data.locales.de.sharh)}
}
function n(id){
 let text="",children=[];
 return {id,disabled:false,hidden:false,value:"",attrs:{},listeners:{},
 get textContent(){return text},set textContent(v){text=String(v);if(id==="answers")children=[]},
 get children(){return children},appendChild(x){children.push(x)},
 setAttribute(k,v){this.attrs[k]=v},addEventListener(k,f){(this.listeners[k]??=[]).push(f)},
 fire(k){for(const f of this.listeners[k]||[])f()},
 querySelector(q){return n(q)}
 };
}
async function simulate(mode){
 const ids=mode==="source"?
 ["q52Source","q52Lang","q52LangLabel","q52BrandTop","q52Kicker","q52Title","q52Intro","q52OriginalTitle","q52Reference","q52GermanTitle","q52Statement","q52SharhTitle","q52SharhStatement","q52EvidenceTitle","q52Evidence1Title","q52Evidence1Sub","q52Evidence2Title","q52Evidence2Sub","q52EvidenceNote","q52Learning","q52Notice"]:
 ["q52QuizPage","lang","langLabel","q52QuizTitle","quiz","step","question","answers","feedback","next","retry","resultTitle","resultScore","notice","result"];
 const m=new Map(ids.map(id=>[id,n(id)]));
 const path=mode==="source"?"q/52/":"lernen/khadijah-salam-paradies/";
 const document={baseURI:"https://dar-al-tawhid.de/"+path+"?lang=de",documentElement:{lang:"de",dir:"ltr"},body:{classList:{toggle(){}}},getElementById:id=>m.get(id)||null,createElement:n,title:""};
 const store=new Map();
 const env={window:{},document,URL,encodeURIComponent,location:{href:"about:srcdoc",protocol:"about:",origin:"null"},
  localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},
  fetch:async()=>({ok:true,json:async()=>data}),history:{state:null,replaceState(){}},console};
 vm.runInNewContext(code,env,{timeout:2500});
 for(let i=0;i<12;i++)await Promise.resolve();
 const pick=m.get(mode==="source"?"q52Lang":"lang");
 for(const lang of locales){
  pick.value=lang;pick.fire("change");const p=data.locales[lang];
  assert.equal(document.documentElement.lang,lang);
  assert.equal(document.documentElement.dir,lang==="ar"||lang==="ckb"?"rtl":"ltr");
  assert.equal(store.get("darAdultPreferredLocaleV1"),lang);
  if(mode==="source"){
   assert.equal(m.get("q52Statement").textContent,p.statement);
   assert.equal(m.get("q52SharhStatement").textContent,p.sharh);
   assert.equal(m.get("q52Evidence1Title").textContent,p.evidence1);
   assert.equal(m.get("q52Learning").href,"/lernen/khadijah-salam-paradies/?lang="+lang);
  }else{
   assert.equal(m.get("question").textContent,p.questions[0].q);
   assert.equal(m.get("answers").children.length,4);
  }
 }
 console.log("Q52 "+mode+": nine languages, RTL, content and selection OK");
}
(async()=>{await simulate("source");await simulate("quiz");console.log("Q52 nine-locale gate OK");})().catch(e=>{console.error(e);process.exitCode=1});
