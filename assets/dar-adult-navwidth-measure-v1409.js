/* DAR_ADULT_NAVWIDTH_MEASURE_V1409
 * Measure the real rendered floating #bottomNav, which may be wider than the
 * legacy --dar-nav-width CSS token. Never resize or move the nav itself.
 * On Foldables, content max-width remains 100% of its own right-side pane.
 */
(function(){
"use strict";
if(window.__darAdultNavWidthMeasureV1409)return;
if(/^\/(?:kids|test\/kids)(?:\/|$)/.test(location.pathname||""))return;
window.__darAdultNavWidthMeasureV1409=true;
var scheduled=false,observed=null,ro=null,mo=null;
function measure(){
 scheduled=false;
 var nav=document.getElementById("bottomNav");
 if(!nav)return;
 var r=nav.getBoundingClientRect();
 if(ro&&observed!==nav){if(observed)ro.unobserve(observed);ro.observe(nav);observed=nav}
 if(r.width<100||!Number.isFinite(r.width))return;
 var width=Math.round(r.width)+"px";
 if(document.documentElement.style.getPropertyValue("--dar-actual-nav-width")!==width)
  document.documentElement.style.setProperty("--dar-actual-nav-width",width);
}
function queue(){if(scheduled)return;scheduled=true;requestAnimationFrame(measure)}
function start(){
 if(typeof ResizeObserver==="function")ro=new ResizeObserver(queue);
 if(document.body&&typeof MutationObserver==="function"){
  mo=new MutationObserver(queue);
  mo.observe(document.body,{childList:true,subtree:false});
 }
 window.addEventListener("resize",queue,{passive:true});
 window.addEventListener("orientationchange",queue,{passive:true});
 window.addEventListener("pageshow",queue,{passive:true});
 queue();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
else start();
})();