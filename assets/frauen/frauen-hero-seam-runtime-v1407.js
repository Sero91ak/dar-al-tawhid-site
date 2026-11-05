/* DAR_FRAUEN_HERO_SEAM_RUNTIME_V1407
 * The photographed Hero/search stay ONE pinned surface. Measure only the
 * redundant initial gap below the real fixed brand and collapse that gap.
 * No scroll/touch interception or cloning; the missing wrapper is restored once.
 */
(function(){
"use strict";
if(window.__DAR_FRAUEN_HERO_SEAM_V1407)return;
window.__DAR_FRAUEN_HERO_SEAM_V1407=true;
var queued=false,resizeObserver=null,observedHeader=null,observedHero=null;
function top(){
 var r=document.scrollingElement||document.documentElement;
 return Math.max(0,window.scrollY||0,r?r.scrollTop||0:0);
}
function reconcile(){
 queued=false;
 var body=document.body;
 if(!body||!body.classList.contains("is-frauen-route"))return;
 var header=document.getElementById("darAdultBrandHeaderV2")||
            document.getElementById("darTestBrandHeaderV1");
 var hero=document.querySelector("#appView .frauen-library-hero");
 if(!header||!hero)return;
 var shell=hero.closest(".frauen-library-shell,.frauen-library-list");
 if(!shell)return;
 var headerBottom=Math.ceil(header.getBoundingClientRect().bottom);
 if(!Number.isFinite(headerBottom)||headerBottom<40||headerBottom>300)return;
 /* Header's physical bottom, not guessed safe-area height, is the sticky top. */
 var fixedTop=headerBottom+"px";
 if(body.style.getPropertyValue("--frauen-fixed-brand-bottom")!==fixedTop)
  body.style.setProperty("--frauen-fixed-brand-bottom",fixedTop);
 if(resizeObserver){
  if(observedHeader!==header){if(observedHeader)resizeObserver.unobserve(observedHeader);resizeObserver.observe(header);observedHeader=header;}
  if(observedHero!==hero){if(observedHero)resizeObserver.unobserve(observedHero);resizeObserver.observe(hero);observedHero=hero;}
 }
 /* Always restore the structural stage, even when a previous route retained
    scroll position; only margin reconciliation is restricted to scroll top. */
 var stage=shell.querySelector(":scope > .dar-immersive-hero-stage");
 /* The historical adult adapter was no longer loaded by the visitor/Test
    HTML shells. Build the SAME one-stage wrapper here, once, preserving the
    original nodes, events, value of the input and approved photograph. */
 if(!stage){
  var directHero=shell.querySelector(":scope > .frauen-library-hero");
  if(directHero){
   var search=shell.querySelector(":scope > .frauen-library-search-wrap,:scope > .frauen-library-list-controls");
   stage=document.createElement("div");
   stage.className="dar-immersive-hero-stage frauen-library-pinned-header";
   stage.dataset.hasSearch=search?"1":"0";
   shell.insertBefore(stage,directHero);
   stage.appendChild(directHero);
   if(search)stage.appendChild(search);
  }
 }
 /* Do not adjust the flow offset during an active reading scroll. */
 if(top()>1)return;
 var surface=stage||hero;
 var gap=surface.getBoundingClientRect().top-headerBottom;
 if(!Number.isFinite(gap)||gap<=1)return;
  /* Legacy app shells sometimes reserve more than 240px twice. Correct only
     measured positive empty space at scroll origin, with a viewport-aware
     safety limit instead of silently abandoning the visible Hero. */
  var viewportHeight=window.visualViewport?window.visualViewport.height:window.innerHeight;
  var maxGap=Math.max(480,Math.min(900,Math.ceil(viewportHeight*1.25)));
  if(gap>maxGap)return;
 var current=parseFloat(shell.style.getPropertyValue("--frauen-flow-seam-shift"))||0;
 var next=Math.max(-maxGap,Math.min(0,Math.round(current-gap)));
 if(Math.abs(next-current)<1)return;
 shell.style.setProperty("--frauen-flow-seam-shift",next+"px");
 /* Inline important wins over old app-level block margins on iOS shells. */
 shell.style.setProperty("margin-top","var(--frauen-flow-seam-shift)","important");
}
function schedule(){
 if(queued)return;
 queued=true;
 requestAnimationFrame(reconcile);
}
function setup(){
 if(typeof ResizeObserver==="function")resizeObserver=new ResizeObserver(schedule);
 var app=document.getElementById("appView");
 if(app&&typeof MutationObserver==="function")
  new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
 document.addEventListener("dar:view-rendered",schedule);
 /* The frozen production adapter may repaint immediately after render;
    restore the shared stage synchronously before the next browser paint. */
 document.addEventListener("dar:frauen-render",reconcile);
 window.addEventListener("pageshow",schedule);
 window.addEventListener("resize",schedule,{passive:true});
 window.addEventListener("orientationchange",schedule,{passive:true});
 if(window.visualViewport)window.visualViewport.addEventListener("resize",schedule,{passive:true});
 window.addEventListener("hashchange",schedule);
 window.addEventListener("scroll",function(){if(top()<=1)schedule();},{passive:true});
 reconcile();
 schedule();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup,{once:true});
else setup();
})();
