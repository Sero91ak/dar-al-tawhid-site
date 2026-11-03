/* DAR_FRAUEN_HERO_SEAM_RUNTIME_V1406
 * One-time geometry correction for the first Frauen Hero under the fixed
 * brand: old app shells sometimes leave a duplicate top reservation.
 * No scrolling, no touch cancellation, no DOM movement/reparenting.
 * Existing WKWebView bounces=false + V5 edge clamp are unchanged.
 */
(function(){
"use strict";
if(window.__DAR_FRAUEN_HERO_SEAM_V1406)return;
window.__DAR_FRAUEN_HERO_SEAM_V1406=true;
var queued=false,resizeObserver=null,observedHeader=null,observedHero=null;
function rootScrollTop(){
 var doc=document.scrollingElement||document.documentElement;
 return Math.max(0,window.scrollY||0,doc?doc.scrollTop||0:0);
}
function reconcile(){
 queued=false;
 if(!document.body||!document.body.classList.contains("is-frauen-route"))return;
 if(rootScrollTop()>1)return;
 var h=document.getElementById("darAdultBrandHeaderV2")||
       document.getElementById("darTestBrandHeaderV1");
 var hero=document.querySelector("#appView .frauen-library-hero");
 if(!h||!hero)return;
 var shell=hero.closest(".frauen-library-shell,.frauen-library-list");
 if(!shell)return;
 if(resizeObserver){
  if(observedHeader!==h){if(observedHeader)resizeObserver.unobserve(observedHeader);resizeObserver.observe(h);observedHeader=h;}
  if(observedHero!==hero){if(observedHero)resizeObserver.unobserve(observedHero);resizeObserver.observe(hero);observedHero=hero;}
 }
 var headerBottom=h.getBoundingClientRect().bottom;
 var heroTop=hero.getBoundingClientRect().top;
 if(!Number.isFinite(headerBottom)||!Number.isFinite(heroTop)||headerBottom<40)return;
 var gap=heroTop-headerBottom;
 if(Math.abs(gap)<=2||Math.abs(gap)>240)return;
 var current=parseFloat(shell.style.getPropertyValue("--frauen-flow-seam-shift"))||0;
 var next=Math.max(-220,Math.min(0,Math.round(current-gap)));
 if(Math.abs(next-current)>=1)
  shell.style.setProperty("--frauen-flow-seam-shift",next+"px");
}
function schedule(){
 if(queued)return;
 queued=true;
 requestAnimationFrame(reconcile);
}
function setup(){
 if(typeof ResizeObserver==="function")resizeObserver=new ResizeObserver(schedule);
 var app=document.getElementById("appView");
 if(app&&typeof MutationObserver==="function"){
  new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
 }
 document.addEventListener("dar:view-rendered",schedule);
 document.addEventListener("dar:frauen-render",schedule);
 window.addEventListener("pageshow",schedule);
 window.addEventListener("resize",schedule,{passive:true});
 window.addEventListener("orientationchange",schedule,{passive:true});
 window.addEventListener("hashchange",schedule);
 window.addEventListener("scroll",function(){
  if(document.body&&document.body.classList.contains("is-frauen-route")&&rootScrollTop()<=1)schedule();
 },{passive:true});
 schedule();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup,{once:true});
else setup();
})();
