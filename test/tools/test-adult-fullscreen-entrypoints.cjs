#!/usr/bin/env node
"use strict";
// Verify the two adult Home capsules reuse the existing Mehr/native fullscreen
// Qibla launcher; no DOM, GPS sensor, network, or prayer-settings write.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const visitor=read("assets/dar-home-v31-visitor.js");
const test=read("test/assets/dar-home-html-parity-v1.js");
const native=read("ios/DarAlTawhid/DarAlTawhid/WebAppView.swift");

function extract(source,name,next){
 const a=source.indexOf("function "+name+"(){");
 const b=source.indexOf(next,a);
 assert.ok(a>=0&&b>a,name+" missing or not isolated");
 return source.slice(a,b);
}
for(const [file,src] of [["visitor",visitor],["test",test]]) {
 new vm.Script(src,{filename:file+".js"});
}
const launchers=[
 {name:"visitor",fn:"openVisitorQiblaQuick",src:extract(visitor,"openVisitorQiblaQuick","function isHome()"),
   route:/nativeNav\("qibla"\)/},
 {name:"test",fn:"openQuickQibla",src:extract(test,"openQuickQibla","function nativeText("),
   route:/route\("qibla"\)/}
];

for(const item of launchers){
 assert.match(item.src,/typeof openQiblaFromFloat==="function"/);
 assert.match(item.src,/typeof openQiblaQuickSheet==="function"/);
 assert.match(item.src,item.route);
 assert.doesNotMatch(item.src,/DARQiblaQuickView\.open\(|\.src\s*=.*qibla-quick-view\.js/,
   "Home must not start miniature Qibla popup");
 function run({float=true,sheet=true,throws=false,mini=false}={}){
   const calls=[];
   const win={DARQiblaQuickView:{
     isOpen:()=>mini, close:()=>calls.push("closeMini")
   }};
   const openFloat=float?()=>{calls.push("float");if(throws)throw Error("missing overlay")}:undefined;
   const openSheet=sheet?()=>calls.push("sheet"):undefined;
   const execute=new Function("window","nativeNav","route",
      "openQiblaFromFloat","openQiblaQuickSheet","console",
      item.src+"\nreturn "+item.fn+";")(
      win,view=>calls.push("navigate:"+view),view=>calls.push("route:"+view),
      openFloat,openSheet,{warn:()=>{}});
   execute();
   return calls;
 }
 assert.deepEqual(run(),["float"],item.name+" must use Mehr fullscreen first");
 assert.deepEqual(run({mini:true}),["closeMini","float"]);
 assert.deepEqual(run({float:false}),["sheet"],item.name+" native fallback");
 assert.deepEqual(run({throws:true}),["float","sheet"],item.name+" error recovery");
 assert.deepEqual(run({float:false,sheet:false}),
   [item.name==="visitor"?"navigate:qibla":"route:qibla"],
   item.name+" must use existing full Qibla page if no quick launcher exists");
}
assert.match(visitor,/data-dv3-qibla-quick="1"/);
assert.match(visitor,/openVisitorQiblaQuick\(\)/);
assert.match(test,/if\(name==="qibla"\)\{openQuickQibla\(\);return\}/);
assert.match(native,/openQiblaFromFloat\(\);return;[\s\S]{0,120}openQiblaQuickSheet\(\)/);
assert.ok(visitor.indexOf("data-dv3-qibla-quick")<visitor.indexOf('data-dv3-nav="bibliothek"'),
  "Qibla should be directly next to Bibliothek");
console.log("Adult Qibla fullscreen entrypoints: 2/2, float/sheet/route and focus safeguards passed");
