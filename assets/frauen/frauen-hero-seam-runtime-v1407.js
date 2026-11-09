/* DAR_FRAUEN_ONE_STAGE_HEADER_SYNC_V1415
 * Structural ownership is entirely in frauen-live-adapter.js.
 * This module only publishes the real fixed brand's bottom edge for CSS.
 * The original Hero/search stay in document flow with native sticky layout.
 * No DOM reparenting, no margin shift, no scroll event, no touch interception.
 */
(function(){
"use strict";
if(window.__DAR_FRAUEN_HERO_SEAM_V1407)return;
window.__DAR_FRAUEN_HERO_SEAM_V1407=true;
var queued=false,header=null,resizeObserver=null;
function active(){return !!(document.body&&document.body.classList.contains("is-frauen-route"));}
function measure(){
 queued=false;
 var body=document.body;
 if(!body)return;
 if(!active()){
  if(header&&resizeObserver)resizeObserver.unobserve(header);
  header=null;
  body.style.removeProperty("--frauen-fixed-brand-bottom");
  return;
 }
 var current=document.getElementById("darAdultBrandHeaderV2")||
             document.getElementById("darTestBrandHeaderV1");
 if(current!==header){
  if(header&&resizeObserver)resizeObserver.unobserve(header);
  header=current;
  if(header&&resizeObserver)resizeObserver.observe(header);
 }
 if(!header)return;
 var bottom=Math.ceil(header.getBoundingClientRect().bottom);
 if(!Number.isFinite(bottom)||bottom<35||bottom>340)return;
 var next=bottom+"px";
 if(body.style.getPropertyValue("--frauen-fixed-brand-bottom")!==next)
  body.style.setProperty("--frauen-fixed-brand-bottom",next);
}
function schedule(){
 if(queued)return;
 queued=true;
 requestAnimationFrame(measure);
}
function start(){
 if(typeof ResizeObserver==="function")resizeObserver=new ResizeObserver(schedule);
 if(typeof MutationObserver==="function"){
  var host=document.querySelector("body > .app");
  if(host)new MutationObserver(schedule).observe(host,{childList:true});
  if(document.body)new MutationObserver(schedule).observe(document.body,{
   attributes:true,attributeFilter:["class","data-frauen-view"]
  });
 }
 document.addEventListener("dar:frauen-render",schedule);
 document.addEventListener("dar:view-rendered",schedule);
 window.addEventListener("hashchange",schedule);
 window.addEventListener("pageshow",schedule,{passive:true});
 window.addEventListener("resize",schedule,{passive:true});
 window.addEventListener("orientationchange",schedule,{passive:true});
 if(window.visualViewport)window.visualViewport.addEventListener("resize",schedule,{passive:true});
 measure();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
else start();
})();
