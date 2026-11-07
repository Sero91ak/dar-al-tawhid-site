#!/usr/bin/env node
"use strict";
/* DAR adult editorial/motion component acceptance contract.
 * Isolated reader DOM, no OS/navigator permissions or protected data. */
const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
const read=p=>fs.readFileSync(p,"utf8");
const js=read("assets/dar-adult-editorial-system-v1.js");
const css=read("assets/dar-adult-editorial-system-v1.css");
const router=read("cloudflare/site-router.js");
new vm.Script(js,{filename:"dar-adult-editorial-system-v1.js"});
assert.equal([...css].reduce((n,c)=>n+(c==="{")-(c==="}"),0),0,"Editorial CSS balanced");
assert.doesNotMatch(css,/!important/,"No competing imperative CSS patch layer");
assert.match(css,/@container dar-editorial/);
assert.match(css,/prefers-reduced-motion:reduce/);
assert.match(css,/data-hero-scroll="normal"/);
assert.doesNotMatch(css,/\b(?:#bottomNav|darAdultBrandHeaderV2|frauen-library-hero|dat-smart-prayer)\b/,"No foreign layout owner");
for(const id of ["darAdultEditorialCssV1","darAdultEditorialJsV1"]){
 assert.equal(router.split("'"+id+"'").length-1,1,"Exactly one visitor asset inclusion: "+id);
}
assert.match(router,/activateAdultGlobalBrandV2\(html\)/);
assert.match(css,/--dar-ed-reading-line/);
assert.match(js,/dar:view-rendered/);
assert.doesNotMatch(js,/MutationObserver|\.innerHTML\s*=|insertBefore|appendChild|\.style\./,"No duplicate DOM or layout controller");

function element(){
 return {attrs:{},isConnected:true,setAttribute(k,v){this.attrs[k]=String(v)},
   getAttribute(k){return this.attrs[k]??null}};
}
function harness(path,reduced,mode){
 const htmlClasses=new Set(),bodyClasses=new Set(["has-bottom-nav","is-post-route"]);
 const listeners={},queue=[],spkr=element(),separator=element(),reader=element(),bar=element(),hero=element();
 const normal=[hero];
 const doc={
  readyState:"complete",
  body:{classList:{contains:s=>bodyClasses.has(s)}},
  documentElement:{classList:{add:s=>htmlClasses.add(s),remove:s=>htmlClasses.delete(s)}},
  getElementById:()=>element(),
  addEventListener:(event,callback)=>{listeners[event]=callback},
  querySelector:(s)=>s.includes("post-reader-main")?reader:s.includes("post-slide-footer")?bar:null,
  querySelectorAll:(s)=>s.includes("post-reader-speaker")?[spkr,separator]:s.includes("data-hero-kind")?normal:[]
 };
 class IO{
  constructor(callback){this.callback=callback;IO.instance=this;this.list=[]}
  observe(el){this.list.push(el)}
  unobserve(el){this.list=this.list.filter(x=>x!==el)}
  disconnect(){this.list=[]}
 }
 const mq={matches:!!reduced,addEventListener:()=>{}};
 const win={document:doc,location:{pathname:path},navigator:{connection:{saveData:false}},
  matchMedia:()=>mq,IntersectionObserver:IO,requestAnimationFrame:fn=>{queue.push(fn);return queue.length},
  addEventListener:(n,fn)=>{listeners[n]=fn},
  startViewTransition:fn=>({ready:true,result:fn()})};
 doc.startViewTransition=win.startViewTransition;
 vm.runInNewContext(js,{window:win,document:doc},{timeout:2500});
 const flush=()=>{while(queue.length)queue.shift()()};
 return {win,doc,spkr,separator,reader,bar,hero,normal,IO,flush,htmlClasses,listeners};
}
const base=harness("/",false);
assert.ok(base.win.DarAdultEditorialMotionV1,"Visitor API exists");
base.flush();
assert.ok(base.htmlClasses.has("dar-adult-editorial-v1"));
assert.equal(base.reader.getAttribute("data-dar-ed-reader"),"1");
assert.equal(base.bar.getAttribute("data-dar-ed-toolbar"),"1");
assert.equal(base.spkr.getAttribute("data-dar-ed-reveal"),null,"Not hidden before intersection");
assert.equal(base.IO.instance.list.length,2,"One observer watches bounded reader nodes");
base.IO.instance.callback([{isIntersecting:true,target:base.spkr}]);
assert.equal(base.spkr.getAttribute("data-dar-ed-reveal"),"seen");
base.win.DarAdultEditorialMotionV1.refresh();base.flush();
assert.equal(base.IO.instance.list.length,1,"No duplicate speaker observation after rerender");
let transitioned=0;
base.win.DarAdultEditorialMotionV1.transitionSwap(null,()=>{transitioned++});
assert.equal(transitioned,1);
base.win.DarAdultEditorialMotionV1.destroy();
assert.ok(!base.htmlClasses.has("dar-adult-editorial-v1"));
const reduce=harness("/",true);
reduce.flush();
assert.equal(reduce.IO.instance,undefined,"Reduced motion skips intersection tracking");
assert.equal(reduce.spkr.getAttribute("data-dar-ed-reveal"),null);
const kids=harness("/kids/",false);
assert.equal(kids.win.DarAdultEditorialMotionV1,undefined,"Kids excluded");
const test=harness("/test/",false);
assert.equal(test.win.DarAdultEditorialMotionV1,undefined,"DAR TEST excluded");
const admin=harness("/admin/",false);
assert.equal(admin.win.DarAdultEditorialMotionV1,undefined,"Admin excluded");
const source=harness("/q/50/",false);
assert.equal(source.win.DarAdultEditorialMotionV1,undefined,"Public sources excluded");
console.log("PASS adult editorial CSS/JS syntax + bounded reader + reduced motion + shell isolation + DOM noninterference");
