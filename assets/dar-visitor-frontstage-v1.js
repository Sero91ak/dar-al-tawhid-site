/* DĀR Visitor Frontstage V1 · iOS front display, Fold cover, Android PWA & narrow windows
 * Layout-only. Does not alter native device screen settings, routes, storage or sessions.
 * Uses actual document/visual content space, never a handset model name. */
(function(global){
"use strict";
var p=global.location&&global.location.pathname||"/";
if(!(/^(\/|\/index\.html|\/pwa(?:\/|\/index\.html)?)$/.test(p))||global.DAR_VISITOR_FRONTSTAGE_V1)return;
var queued=false,last="",lastViewport="",latchedCompact=false;
function measure(){
 var doc=document.documentElement,client=doc.clientWidth||0,inner=global.innerWidth||0;
 var view=global.visualViewport;
 // On a pinch-zoom visualViewport shrinks; don't treat zoom as device folding.
 var vv=view&&Number(view.scale||1)<=1.08?Math.round(view.width||0):0;
 var box=document.querySelector("body > .app")||document.querySelector("body > #appRoot");
 var stage=box?Math.round(box.getBoundingClientRect().width):0;
 var viewport=client||inner||vv;
 if(vv>0&&vv<viewport&&Math.abs(vv-viewport)<viewport*.45)viewport=vv;
 // A phone's folded cover can be a narrow app stage inside a wider CSS canvas.
 var currentViewport=String(viewport)+"|"+String(inner)+"|"+String(client);
 // If a narrow stage was the only correctly reported front cover width,
 // keep that interpretation until the actual viewport changes. The CSS
 // below expands the app stage, so stage alone must never flip this class.
 if(currentViewport!==lastViewport){
  lastViewport=currentViewport;
  latchedCompact=stage>180&&stage<viewport*.85&&stage<=710;
 }
 var effective=latchedCompact?Math.min(stage||viewport,710):viewport;
 var compact=viewport>0&&(viewport<=710||latchedCompact);
 return {viewport:viewport,stage:stage,effective:effective,compact:compact}
}
function apply(){
 queued=false;
 var root=document.documentElement,m=measure(),mode=m.compact?"1":"0";
 if(root.getAttribute("data-dar-visitor-frontstage")!==mode)
  root.setAttribute("data-dar-visitor-frontstage",mode);
 var width=String(Math.round(m.effective||0));
 if(root.getAttribute("data-dar-visitor-front-width")!==width)
  root.setAttribute("data-dar-visitor-front-width",width);
 last=mode+"|"+width;
}
function schedule(){if(queued)return;queued=true;global.requestAnimationFrame(apply)}
function start(){
 apply();
 global.addEventListener("resize",schedule,{passive:true});
 global.addEventListener("orientationchange",schedule,{passive:true});
 global.addEventListener("pageshow",schedule,{passive:true});
 global.addEventListener("dar:layoutchange",schedule);
 if(global.visualViewport)global.visualViewport.addEventListener("resize",schedule,{passive:true});
 if(global.ResizeObserver){
  var ro=new ResizeObserver(schedule);
  ro.observe(document.documentElement);
  var app=document.querySelector("body > .app");if(app)ro.observe(app);
  global.__darVisitorFrontStageResizeObserver=ro;
 }
}
global.DAR_VISITOR_FRONTSTAGE_V1={measure:measure,refresh:schedule};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})(window);