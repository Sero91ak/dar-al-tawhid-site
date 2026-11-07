/* DĀR AL TAWḤĪD | Adult Editorial & Motion Core v1
 * Web app only. One bounded observer, opt-in effects and no route reparenting.
 * The original shell owns sticky Header/Hero/search/nav, prayer and sources.
 */
(function(global){
"use strict";
if(global.DarAdultEditorialMotionV1)return;
var doc=global.document;
if(!doc||!global.location)return;
var path=String(global.location.pathname||"");
if(/^\/(?:kids|test|admin|quellen|lernen|q\/)/.test(path))return;
var reduced=global.matchMedia&&global.matchMedia("(prefers-reduced-motion: reduce)");
var saved=global.navigator&&global.navigator.connection&&global.navigator.connection.saveData;
var observer=null,raf=0,mounted=false;
var seen=typeof WeakSet==="function"?new WeakSet():null;
var revealed=typeof WeakSet==="function"?new WeakSet():null;
function canAnimate(){
 return !(reduced&&reduced.matches)&&!saved&&typeof global.IntersectionObserver==="function";
}
function stopObserver(){if(observer){observer.disconnect();observer=null}}
function getObserver(){
 if(!canAnimate())return null;
 if(!observer){
  observer=new global.IntersectionObserver(function(items){
   items.forEach(function(entry){
    if(!entry.isIntersecting)return;
    var el=entry.target;
    observer.unobserve(el);
    if(el.isConnected&&(!revealed||!revealed.has(el))){
     el.setAttribute("data-dar-ed-reveal","seen");
     if(revealed)revealed.add(el);
    }
   });
  },{root:null,rootMargin:"0px 0px -24px 0px",threshold:0.08});
 }
 return observer;
}
function ownsVisitor(){
 var body=doc.body;
 return !!(body&&body.classList.contains("has-bottom-nav")&&
    doc.getElementById("appView")&&!body.classList.contains("is-feed-fullscreen")&&
    !body.classList.contains("is-quran-reader-route")&&
    !body.classList.contains("dar-internal-reader-open"));
}
function annotate(root){
 var body=doc.body;if(!body||!ownsVisitor())return false;
 doc.documentElement.classList.add("dar-adult-editorial-v1");
 var scope=root&&root.querySelectorAll?root:doc;
 // Existing reader ownership stays in place. No wrapper and no inline sizing.
 if(body.classList.contains("is-post-route")){
  var reader=doc.querySelector("#appView .post-reader-main");
  if(reader)reader.setAttribute("data-dar-ed-reader","1");
  var toolbar=doc.querySelector("#appView .post-reader .post-slide-footer");
  if(toolbar)toolbar.setAttribute("data-dar-ed-toolbar","1");
  // Existing disclosure and action owners remain intact: only opt in to
  // non-geometric micro-motion; no clicks, handlers or aria state changes.
  var details=doc.querySelectorAll("#appView .post-reader-main details");
  for(var k=0;k<Math.min(details.length,12);k++)details[k].setAttribute("data-dar-ed-expand","1");
  var actions=doc.querySelectorAll("#appView .post-reader :is(.post-reader-top-btn,.post-slide-nav)");
  for(var a=0;a<Math.min(actions.length,12);a++)actions[a].setAttribute("data-dar-ed-spring","1");
  var targets=doc.querySelectorAll("#appView .post-reader-main .post-reader-speaker, #appView .post-reader-main .post-reader-sep");
  var io=getObserver();
  for(var i=0;i<Math.min(targets.length,16);i++){
   var element=targets[i];
   if(seen&&seen.has(element))continue;
   if(seen)seen.add(element);
   if(io)io.observe(element);
  }
 }
 // Reuse the same typographic scope on existing Hadith/Dua detail readers;
 // their own wrappers, sidebars, sticky covers and source links do not move.
 if(body.classList.contains("is-hadith-route")||body.classList.contains("is-dua-route")){
  var detail=doc.querySelector("#appView :is(.hadith-detail,.dua-detail) > .post-reader-main");
  if(detail)detail.setAttribute("data-dar-ed-reader","1");
 }
 // Existing topics filter strip owns its own horizontal touch scroll.
 // A 14px visual edge fade may opt in, but no scroll handler is installed.
 if(body.classList.contains("is-topics-route")){
  var filters=doc.querySelector("#appView .topics-hub .dar-tl-filterbar");
  if(filters)markOverflow(filters);
 }
 // Only original NONsticky opt-in Hero components may receive motion.
 var normals=scope.querySelectorAll('[data-hero-kind][data-hero-scroll="normal"]');
 for(var n=0;n<Math.min(normals.length,16);n++){
  normals[n].setAttribute("data-dar-ed-hero","normal");
 }
 return true;
}
function schedule(){
 if(raf)return;
 var request=global.requestAnimationFrame||function(fn){return global.setTimeout(fn,0)};
 raf=request(function(){raf=0;annotate(doc)});
}
function swap(owner,change){
 if(typeof change!=="function")return null;
 // A page owner can explicitly opt in to a same-document shared transition.
 // Do not intercept history, clicks, navigation or async content swaps.
 if(reduced&&reduced.matches||!doc.startViewTransition)return change();
 var active=doc.querySelector("dialog[open],#darInternalSourceV3:not([hidden])");
 if(active)return change();
 return doc.startViewTransition(change);
}
function markOverflow(el){
 if(!el||!el.setAttribute)return false;
 el.setAttribute("data-dar-ed-overflow","1");
 function refresh(){
  if(!el.isConnected)return;
  el.setAttribute("data-dar-ed-fade",String(el.scrollWidth>el.clientWidth+2));
 }
 refresh();
 return true;
}
var api={mount:annotate,refresh:schedule,transitionSwap:swap,markOverflow:markOverflow,
  destroy:function(){stopObserver();if(doc.documentElement)doc.documentElement.classList.remove("dar-adult-editorial-v1")}};
global.DarAdultEditorialMotionV1=api;
function start(){
 if(mounted)return;mounted=true;
 schedule();
 doc.addEventListener("dar:view-rendered",schedule,{passive:true});
 global.addEventListener("pageshow",schedule,{passive:true});
 global.addEventListener("popstate",schedule,{passive:true});
 global.addEventListener("hashchange",schedule,{passive:true});
 global.addEventListener("resize",schedule,{passive:true});
 if(reduced&&reduced.addEventListener)reduced.addEventListener("change",function(){
  if(reduced.matches)stopObserver();schedule();
 });
}
if(doc.readyState==="loading")doc.addEventListener("DOMContentLoaded",start,{once:true});else start();
})(typeof window!=="undefined"?window:this);
