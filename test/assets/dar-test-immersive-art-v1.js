/* DAR_TEST_IMMERSIVE_ART_V1 · decorative UI artwork, not a banner.
 * Only /test/. Never reparents the app view, changes routing, steals touch
 * gestures, forces scrolling or changes original content/source images. */
(function(win,doc){
"use strict";
if(!/^\/test(?:\/|$)/.test(String(win.location&&win.location.pathname||"")))return;
if(win.__DAR_TEST_IMMERSIVE_ART_V1)return;
win.__DAR_TEST_IMMERSIVE_ART_V1=true;
var rules=[
 ["is-home-route",".top-shell.theme-hero-shell > .header.theme-hero-surface","home",false],
 ["is-frauen-route","#appView .frauen-library-hero","women",false],
 ["is-topics-route","#appView .topics-hub > .view-head","topics",true],
 ["is-topic-route","#appView .topic-collection-page > .view-head","topic",true],
 ["is-hadith-route","#appView .hadith-hub > .view-head","hadith",true],
 ["is-dua-route","#appView .dua-hub > .view-head","dua",true],
 ["is-post-route","#appView .post-reader > .post-reader-title","post",true],
 ["is-quran-overview","#appView .qov-page > .view-head","quran",true],
 ["is-library-route","#appView .library-page > .view-head","library",true],
 ["is-scholars-route","#appView .scholars-index > .scholars-index__header","scholars",true]
];
var active=[],pending=0,bodyObserver,viewObserver,resizeObserver;
var observed=new WeakSet();
var reduced=!!(win.matchMedia&&win.matchMedia("(prefers-reduced-motion: reduce)").matches);
function allowed(){
 return doc.body&&!doc.body.classList.contains("is-feed-fullscreen")&&
 !doc.body.classList.contains("is-ilm-chat-route")&&
 !doc.body.classList.contains("is-quran-reader-route");
}
function height(el){
 if(!el||!el.isConnected||!el.parentElement)return;
 var h=Math.ceil(el.getBoundingClientRect().height);
 if(!(h>0))return;
 var value=h+"px",parent=el.parentElement;
 if(parent.style.getPropertyValue("--dar-art-hero-height")!==value)
   parent.style.setProperty("--dar-art-hero-height",value);
}
function paint(el,kind,sticky){
 if(el.dataset.darArtKind!==kind){
   el.dataset.darArtKind=kind;
   el.classList.add("dar-art-hero");
   if(sticky)el.dataset.darArtSticky="1";
 }
 if(!el.querySelector(":scope > .dar-art-layer")){
   var layer=doc.createElement("span");
   layer.className="dar-art-layer";
   layer.setAttribute("aria-hidden","true");
   el.appendChild(layer);
 }
 if(sticky){
   height(el);
   if(resizeObserver&&!observed.has(el)){
     resizeObserver.observe(el);observed.add(el);
   }
 }
}
function scroller(el){
 for(var p=el.parentElement;p&&p!==doc.body;p=p.parentElement){
   var y=win.getComputedStyle(p).overflowY;
   if(/^(auto|scroll|overlay)$/.test(y)&&p.scrollHeight>p.clientHeight+2)return p;
 }
 return doc.scrollingElement||doc.documentElement;
}
function depth(){
 if(reduced||!allowed())return;
 var positions=new Map();
 active.forEach(function(el){
   if(!el.isConnected)return;
   var root=scroller(el),position=positions.has(root)?positions.get(root):Number(root.scrollTop||0);
   positions.set(root,position);
   var value=String(Math.round(Math.min(1,Math.max(0,position/180))*100)/100);
   if(el.style.getPropertyValue("--dar-art-progress")!==value){
     el.style.setProperty("--dar-art-progress",value);
     el.style.setProperty("--dar-art-scale",String((1.045-Number(value)*.045).toFixed(4)));
   }
 });
}
function reconcile(){
 if(!allowed()){active=[];return;}
 var next=[],seen=new Set();
 rules.forEach(function(rule){
   if(!doc.body.classList.contains(rule[0]))return;
   doc.querySelectorAll(rule[1]).forEach(function(el){
     if(!el.isConnected||seen.has(el)||el.closest(".modal,[role='dialog'],.qov-reader"))return;
     seen.add(el);paint(el,rule[2],rule[3]);next.push(el);
   });
 });
 active=next;depth();
}
function tick(){pending=0;reconcile();}
function schedule(){if(!pending)pending=win.requestAnimationFrame(tick);}
function start(){
 doc.documentElement.classList.add("dar-test-immersive-art-v1");
 if(typeof ResizeObserver==="function"){
   resizeObserver=new ResizeObserver(function(entries){entries.forEach(function(e){height(e.target);});});
 }
 var view=doc.getElementById("appView");
 if(view&&typeof MutationObserver==="function"){
   viewObserver=new MutationObserver(schedule);
   viewObserver.observe(view,{subtree:true,childList:true});
   bodyObserver=new MutationObserver(schedule);
   bodyObserver.observe(doc.body,{attributes:true,attributeFilter:["class","data-frauen-view"]});
 }
 win.addEventListener("scroll",schedule,{passive:true});
 doc.addEventListener("scroll",schedule,true);
 win.addEventListener("resize",schedule,{passive:true});
 win.addEventListener("orientationchange",schedule,{passive:true});
 win.addEventListener("hashchange",schedule);
 win.addEventListener("pageshow",schedule);
 schedule();
}
win.DARTestImmersiveArtV1={
 audit:function(){return{version:"20261106",surface:"/test/",count:active.filter(function(e){return e.isConnected;}).length,
 kinds:active.filter(function(e){return e.isConnected;}).map(function(e){return e.dataset.darArtKind;}),
 oldFoldActive:doc.documentElement.classList.contains("dar-fold-v2-active")};},
 refresh:schedule
};
if(doc.readyState==="loading")doc.addEventListener("DOMContentLoaded",start,{once:true});else start();
})(window,document);
