/* DAR_FRAUEN_FIXED_HERO_RUNTIME_V1408
 * Fixed ORIGINAL photo+search, measured spacer (NO cloned photograph).
 * The stage stays attached to the fixed brand while ordinary content scrolls
 * behind it; overscroll cannot pull the photo away from the brand.
 * Never changes native scroll ownership or intercepts touch gestures.
 */
(function(){
"use strict";
if(window.__darFrauenFixedHeroV1408)return;
window.__darFrauenFixedHeroV1408=true;
var queued=false,stageSeen=null,headerSeen=null,ro=null,appObserver=null,bodyObserver=null,routeKey="";
function isWomen(){
 return !!(document.body&&document.body.classList.contains("is-frauen-route"));
}
function rootTop(){
 var root=document.scrollingElement||document.documentElement;
 return Math.max(0,window.scrollY||0,root?root.scrollTop||0:0);
}
function set(el,key,value){
 if(el.style.getPropertyValue(key)!==value)el.style.setProperty(key,value);
}
function reconcile(){
 queued=false;
 if(!isWomen())return;
 var header=document.getElementById("darAdultBrandHeaderV2")||document.getElementById("darTestBrandHeaderV1");
 var stage=document.querySelector("#appView .frauen-library-shell > .dar-immersive-hero-stage,#appView .frauen-library-list > .dar-immersive-hero-stage");
 if(!header||!stage)return;
 var section=stage.parentElement;
 if(!section)return;
 var hero=stage.querySelector(".frauen-library-hero");
 if(!hero)return;
 var body=document.body;
 var key=(body.getAttribute("data-frauen-view")||"")+"|"+(hero.querySelector("h2")?.textContent||"");
 if(routeKey!==key){
  routeKey=key;
  // A new group must start BELOW the Hero, not at the previous route's offset.
  if(rootTop()>1){
   window.scrollTo(0,0);
   var scroll=document.scrollingElement||document.documentElement;
   if(scroll)scroll.scrollTop=0;
  }
 }
 var space=section.querySelector(":scope > .dar-frauen-hero-space-v1408");
 if(!space){
  space=document.createElement("div");
  space.className="dar-frauen-hero-space-v1408";
  space.setAttribute("aria-hidden","true");
  section.insertBefore(space,stage.nextSibling);
 }
 var rect=header.getBoundingClientRect();
 if(!Number.isFinite(rect.bottom)||rect.bottom<30)return;
 set(body,"--frauen-v1408-header-bottom",Math.round(rect.bottom)+"px");
 if(ro){
  if(headerSeen!==header){if(headerSeen)ro.unobserve(headerSeen);ro.observe(header);headerSeen=header;}
  if(stageSeen!==stage){if(stageSeen)ro.unobserve(stageSeen);ro.observe(stage);stageSeen=stage;}
 }
 var sr=section.getBoundingClientRect();
 var cs=getComputedStyle(section);
 var pl=parseFloat(cs.paddingLeft)||0,pr=parseFloat(cs.paddingRight)||0;
 var left=Math.round(sr.left+pl);
 var width=Math.round(Math.max(1,sr.width-pl-pr));
 set(body,"--frauen-v1408-stage-left",left+"px");
 set(body,"--frauen-v1408-stage-width",width+"px");
 // Suppress duplicate old offset entirely; no gesture-based margin adjustment.
 if(section.style.getPropertyValue("--frauen-flow-seam-shift"))
  section.style.removeProperty("--frauen-flow-seam-shift");
 var h=Math.ceil(stage.getBoundingClientRect().height);
 if(h>40&&h<1200)set(body,"--frauen-v1408-rail-height",h+"px");
}
function schedule(){
 if(queued)return;
 queued=true;
 requestAnimationFrame(reconcile);
}
function setFocus(){
 var active=document.activeElement,within=active&&active.closest&&active.closest("#appView .dar-immersive-hero-stage");
 var focus=!!(within&&/^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName));
 if(isWomen())document.body.setAttribute("data-frauen-v1408-input-active",focus?"1":"0");
 schedule();
}
function start(){
 if(typeof ResizeObserver==="function")ro=new ResizeObserver(schedule);
 var root=document.getElementById("appView");
 if(root&&typeof MutationObserver==="function"){
  appObserver=new MutationObserver(schedule);
  appObserver.observe(root,{childList:true,subtree:true});
 }
 if(document.body&&typeof MutationObserver==="function"){
  bodyObserver=new MutationObserver(schedule);
  bodyObserver.observe(document.body,{attributes:true,attributeFilter:["class","data-frauen-view"]});
 }
 document.addEventListener("focusin",setFocus,{passive:true});
 document.addEventListener("focusout",function(){requestAnimationFrame(setFocus);},{passive:true});
 document.addEventListener("dar:view-rendered",schedule);
 document.addEventListener("dar:frauen-render",schedule);
 window.addEventListener("resize",schedule,{passive:true});
 window.addEventListener("orientationchange",schedule,{passive:true});
 window.addEventListener("pageshow",schedule);
 window.addEventListener("hashchange",schedule);
 schedule();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
else start();
})();
