#!/usr/bin/env node
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const root=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const js=read("test/assets/dar-test-immersive-art-v1.js");
const css=read("test/assets/dar-test-immersive-art-v1.css");
const worker=read("cloudflare/test-app-worker.js");
const contract=read("docs/immersive-images-contract.md");
new vm.Script(js,{filename:"test/assets/dar-test-immersive-art-v1.js"});
assert.match(worker,/DAR_TEST_FOLD_V2_RETIRED_20261106/);
assert.match(worker,/darTestImmersiveArtV1Css/);
assert.match(worker,/darTestImmersiveArtV1Js/);
assert.match(worker,/dar-test-immersive-art-v1\.css\?v=20261106/);
assert.match(worker,/dar-test-immersive-art-v1\.js\?v=20261106/);
assert.doesNotMatch(worker,/const foldJsV2\s*=/);
assert.doesNotMatch(worker,/const foldCssV2\s*=/);
assert.doesNotMatch(worker,/const foldBootstrap\s*=/);
assert.match(js,/^\/\* DAR_TEST_IMMERSIVE_ART_V1/);
assert.match(js,/\.frauen-library-hero/);
assert.match(js,/\.post-reader > \.post-reader-title/);
assert.match(js,/prefers-reduced-motion: reduce/);
assert.match(js,/ResizeObserver/);
assert.match(js,/requestAnimationFrame/);
assert.match(js,/passive:true/);
assert.doesNotMatch(js,/touchmove|preventDefault|scrollTo\(|scrollIntoView\(|innerHTML\s*=|appendChild\(view\)/);
assert.match(css,/position:sticky!important/);
assert.match(css,/--dar-art-scale/);
assert.match(css,/data-dar-art-inline="decorative"/);
assert.match(css,/prefers-reduced-motion:reduce/);
assert.match(contract,/Erst DĀR Test/);
for(const name of ["topics","topic-detail","book-detail","dua","post-reader","quran-overview","library","scholars"]){
 assert.ok(fs.existsSync(path.join(root,"test/assets/area-heroes-v1290",name+".webp")),"Missing original artwork: "+name);
}
for(const name of ["hero-mobile-adobe.jpg","hero-wide-adobe.jpg"]){
 assert.ok(fs.existsSync(path.join(root,"test/assets/home-v1194",name)),"Missing home artwork: "+name);
}
/* Tiny DOM integration smoke: append a decorative child, preserve the original
 * node and its parent, measure sticky height, and restore crop on scroll back. */
const callbacks={},queued=[];
const style={values:{},getPropertyValue(k){return this.values[k]||"";},setProperty(k,v){this.values[k]=v;}};
const body={classList:{contains(k){return k==="is-topics-route";}}};
const section={style,scrollHeight:1100,clientHeight:500,parentElement:body};
let photo=null;
const hero={
 dataset:{},isConnected:true,parentElement:section,style:{values:{},getPropertyValue(k){return this.values[k]||"";},setProperty(k,v){this.values[k]=v;}},
 classList:{add(k){this.value=k;}},
 getBoundingClientRect(){return{height:210};},
 querySelector(){return photo;},
 appendChild(el){photo=el;el.parentNode=this;},
 closest(){return null;}
};
const html={scrollTop:0,classList:{add(){},contains(){return false;}}};
const doc={
 readyState:"loading",body,documentElement:html,scrollingElement:html,
 addEventListener(name,fn){callbacks["doc:"+name]=fn;},
 getElementById(id){return id==="appView"?{}:null;},
 querySelectorAll(sel){return sel==="#appView .topics-hub > .view-head"?[hero]:[];},
 createElement(tag){return {tagName:tag,setAttribute(k,v){this[k]=v;}};}
};
const win={
 location:{pathname:"/test/"},matchMedia(){return{matches:false};},
 requestAnimationFrame(fn){queued.push(fn);return queued.length;},
 addEventListener(name,fn){callbacks["window:"+name]=fn;},
 getComputedStyle(){return {overflowY:"visible"};}
};
const ctx={window:win,document:doc,Map,Set,WeakSet};
vm.runInNewContext(js,ctx);
assert.equal(typeof win.DARTestImmersiveArtV1.audit,"function");
callbacks["doc:DOMContentLoaded"]();
queued.shift()();
assert.equal(hero.dataset.darArtKind,"topics");
assert.equal(hero.dataset.darArtSticky,"1");
assert.equal(photo.className,"dar-art-layer");
assert.equal(style.values["--dar-art-hero-height"],"210px");
assert.equal(win.DARTestImmersiveArtV1.audit().count,1);
assert.equal(hero.parentElement,section,"Hero must NOT be reparented");
html.scrollTop=90;callbacks["window:scroll"]();queued.shift()();
assert.equal(hero.style.values["--dar-art-progress"],"0.5");
html.scrollTop=0;callbacks["window:scroll"]();queued.shift()();
assert.equal(hero.style.values["--dar-art-progress"],"0");
console.log("PASS DAR Test immersive art: legacy Fold retired, photo assets, syntax, pinned owner, decorative DOM, reversible scroll and reduced-motion");
