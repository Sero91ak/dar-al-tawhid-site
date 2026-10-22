/* DAR TEST · V8 editorial home: one Salam, one welcome, the ORIGINAL source. */
(function(w,d){
"use strict";
if(!/^\/test(?:\/|$)/.test(w.location.pathname)||/^\/test\/kids(?:\/|$)/.test(w.location.pathname))return;
if(w.__DAR_V8_HOME_EDITORIAL_V1)return;w.__DAR_V8_HOME_EDITORIAL_V1=true;
var root=d.documentElement, frame=0, watcher=null;
function el(tag,cl,text){var x=d.createElement(tag);x.className=cl||"";if(text!=null)x.textContent=text;return x}
function refresh(){
 frame=0;
 root.classList.add("dar-v8-global-test");
 var area=d.body&&d.body.classList.contains("is-home-route")&&d.querySelector("#appView #dv3Home");
 if(!area){root.classList.remove("dar-v8-home-editorial-ready");return}
 var section=area.querySelector("#darV8EditorialHome");
 if(!section){
   section=el("section","dar-v8-editorial-home");section.id="darV8EditorialHome";
   section.setAttribute("aria-label","Begrüßung und unser Überlieferungsmaßstab");
   section.appendChild(el("div","dar-v8-editorial-overline","BEITRÄGE NACH QURʾĀN · SUNNAH · ĀṮĀR"));
   section.appendChild(el("h2","dar-v8-editorial-salam"));
   section.appendChild(el("p","dar-v8-editorial-welcome","Willkommen bei DĀR AL TAWḤĪD"));
   section.appendChild(el("p","dar-v8-editorial-description"));
   var source=el("div","dar-v8-editorial-source");source.id="darV8OriginalIsnad";section.appendChild(source);
   area.insertBefore(section,area.firstChild);
 }
 var hero=d.querySelector(".top-shell .hero-text");
 var text=hero&&hero.querySelector(".salam");
 if(text&&text.textContent.trim())section.querySelector(".dar-v8-editorial-salam").textContent=text.textContent.trim();
 var intro=hero&&hero.querySelector(".intro");
 if(intro&&intro.textContent.trim())section.querySelector(".dar-v8-editorial-description").textContent=intro.textContent.trim();
 var origin=d.querySelector(".top-shell > .isnad");
 var host=section.querySelector("#darV8OriginalIsnad");
 if(origin&&host&&(!host.firstElementChild||host.firstElementChild.textContent!==origin.textContent)){
   // Replicate the original source node, including citation and title, without
   // changing the original or replacing any publication/source reference.
   host.replaceChildren(origin.cloneNode(true));
 }
 root.classList.toggle("dar-v8-home-editorial-ready",!!(host&&host.firstElementChild));
}
function schedule(){if(frame)return;frame=w.requestAnimationFrame(refresh)}
function boot(){
 root.classList.add("dar-v8-global-test");schedule();
 var view=d.getElementById("appView");
 if(view&&w.MutationObserver){
  watcher=new MutationObserver(function(records){
   if(records.some(function(r){return Array.prototype.some.call(r.addedNodes,function(n){
    return n.nodeType===1&&(n.id==="dv3Home"||n.querySelector&&n.querySelector("#dv3Home")||n.classList&&n.classList.contains("view-head"));
   })}))schedule();
  });
  watcher.observe(view,{childList:true,subtree:false});
 }
 w.addEventListener("hashchange",schedule,{passive:true});
 d.addEventListener("dar:view-rendered",schedule);
 w.addEventListener("dar-adult-locale-changed",schedule);
 w.addEventListener("dar-adult-ui-languages-ready",schedule);
}
w.DARV8HomeEditorial=Object.freeze({refresh:schedule});
if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})(window,document);
