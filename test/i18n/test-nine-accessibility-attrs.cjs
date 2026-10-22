#!/usr/bin/env node
"use strict";
/* Zero-network regression for accessible UI attributes across nine locales.
 * Content in canonical/source regions must never be translated. */
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const src=fs.readFileSync(path.join(__dirname,"../assets/dar-test-turkish-ui.js"),"utf8");
const catalog=JSON.parse(fs.readFileSync(path.join(__dirname,"adult-ui-locales-seven.json"),"utf8"));
const KEY="darAdultPreferredLocaleV1",state={code:"de"},listeners={};
function element(attrs,protectedSource=false){
 return {nodeType:1,attrs:{...attrs},closest:()=>protectedSource?{protectedSource:true}:null,
   getAttribute(name){return Object.hasOwn(this.attrs,name)?this.attrs[name]:null},
   setAttribute(name,value){this.attrs[name]=value}};
}
const photo=element({alt:"Startseite"});
const details=element({"aria-description":"Einstellungen öffnen",title:"Sprache auswählen"});
const field=element({placeholder:"Wissen durchsuchen","aria-label":"Startseite"});
const original=element({alt:"Startseite","aria-description":"Einstellungen öffnen"},true);
const nodes=[photo,details,field,original];
const document={
  documentElement:{lang:"de",dir:"ltr"},
  body:element({}),readyState:"loading",addEventListener(name,fn){listeners[name]=fn},
  createTreeWalker(){let pos=-1;return{nextNode(){return nodes[++pos]||null}}}
};
const window={document,location:{pathname:"/test/"},NodeFilter:{SHOW_ELEMENT:1,SHOW_TEXT:4},
 localStorage:{getItem(k){return k===KEY?state.code:null}},
 addEventListener(){}};
vm.runInNewContext(src,{window,Intl});
const runtime=window.DarTestTurkishUI;
assert(runtime.registerLocaleData(catalog));
for(const code of ["de","tr","en","ar","ku","ckb","bs","fr","es"]){
 state.code=code;runtime.apply();
 const d=catalog.translations[code]||{};
 assert.equal(photo.attrs.alt,code==="de"?"Startseite":d.Startseite,code+" image alt");
 assert.equal(details.attrs["aria-description"],code==="de"?"Einstellungen öffnen":d["Einstellungen öffnen"],code+" aria description");
 assert.equal(details.attrs.title,code==="de"?"Sprache auswählen":d["Sprache auswählen"],code+" tooltip");
 assert.equal(field.attrs.placeholder,code==="de"?"Wissen durchsuchen":d["Wissen durchsuchen"],code+" placeholder");
 assert.equal(field.attrs["aria-label"],code==="de"?"Startseite":d.Startseite,code+" aria label");
 assert.equal(document.documentElement.dir,["ar","ckb"].includes(code)?"rtl":"ltr",code+" direction");
 assert.equal(original.attrs.alt,"Startseite","Protected image alt was translated");
 assert.equal(original.attrs["aria-description"],"Einstellungen öffnen","Protected source attribute translated");
}
console.log("PASS: 9 language changes restore alt, aria-description, placeholder and title; canonical content excluded");
