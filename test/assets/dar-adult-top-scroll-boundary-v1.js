/* DAR_ADULT_TOP_SCROLL_BOUNDARY_V3 · first-touch two-ended scroll stop for adult visitor and Dar Test.
 * Block the very FIRST outward vertical touch movement at both document edges.
 * Previous 7px axis delay let the native iOS spring gesture activate first.
 * Does not scrollTo, clone/reparent DOM, lock body overflow or alter sticky Heroes.
 * Nested readers scroll independently; horizontal swipes and momentum inside
 * available content are preserved. Never intercept the normal movement.
 */
(function(){
"use strict";
if(window.__darAdultTopScrollBoundaryV1)return;
var path=String(location.pathname||"");
if(/^\/(?:kids|test\/kids)(?:\/|$)/.test(path))return;
window.__darAdultTopScrollBoundaryV1=true;

var startTarget=null,scope=null,initialX=0,initialY=0,lastY=0,axis="";
var overlaySelector='dialog[open],[role="dialog"]:not([hidden]),.modal.open,.modal.is-open,#darInternalSourceV3:not([hidden])';
var gestureSelector='input[type="range"],.leaflet-container,.mapboxgl-map,.maplibregl-map,[data-native-pan],[data-dar-native-gesture]';
function adultShell(){return !!document.getElementById("appView")}
function reset(){startTarget=null;scope=null;initialX=0;initialY=0;lastY=0;axis=""}
/* Check whether the touched surface or one of its real scroll ancestors
 * can still move in the requested direction. The document remains the only
 * main page scroller. Overlay readers stop at their own bounds. */
function canScroll(direction){
 var target=startTarget, max;
 for(var node=target;node&&node!==document;node=node.parentElement){
  if(node.nodeType!==1)continue;
  // Body, app wrapper and #appView are not independent scrollers. Some
  // WebKit/Android CSS computes overflow-y:auto from overflow-x:hidden.
  // Treating them as nested scrollables silently re-enables overscroll.
  if(node===document.scrollingElement||node===document.documentElement)break;
  if(node===document.body||node.id==="appView"||
     (node.classList&&node.classList.contains("app")))continue;
  var cs=window.getComputedStyle(node);
  if(/^(auto|scroll|overlay)$/.test(cs.overflowY)&&node.scrollHeight>node.clientHeight+1){
   max=node.scrollHeight-node.clientHeight;
   if(direction==="up"&&node.scrollTop>0.5)return true;
   if(direction==="down"&&node.scrollTop<max-0.5)return true;
  }
  if(scope&&node===scope)return false;
 }
 if(scope)return false;
 var scroll=document.scrollingElement||document.documentElement;
 if(!scroll)return false;
 max=Math.max(0,scroll.scrollHeight-scroll.clientHeight);
 var offset=Math.max(0,scroll.scrollTop||window.scrollY||0);
 return direction==="up"?offset>0.5:offset<max-0.5;
}
document.addEventListener("touchstart",function(event){
 if(!adultShell()||!event.touches||event.touches.length!==1){reset();return}
 var target=event.target;
 // Touches can originate on text nodes; do not silently turn off the guard.
 if(target&&target.nodeType!==1)target=target.parentElement;
 if(!target||!target.closest){reset();return}
 if(target.closest(gestureSelector)){reset();return}
 startTarget=target;
 scope=target.closest(overlaySelector);
 var point=event.touches[0];
 initialX=point.clientX;initialY=point.clientY;lastY=initialY;axis="";
},{capture:true,passive:true});
document.addEventListener("touchmove",function(event){
 if(!startTarget||!event.touches||event.touches.length!==1)return;
 var point=event.touches[0],dx=point.clientX-initialX,dy=point.clientY-initialY;
 var stepY=point.clientY-lastY;
 lastY=point.clientY;
 // Decide direction on the first clear movement (not after 7px).
 // The former threshold could start UIKit rubber-banding before preventDefault.
 if(!axis){
  if(Math.abs(dy)>=1&&Math.abs(dy)>=Math.abs(dx)*1.12)axis="vertical";
  else if(Math.abs(dx)>=2&&Math.abs(dx)>=Math.abs(dy)*1.25)axis="horizontal";
 }
 if(axis!=="vertical"||stepY===0||event.defaultPrevented||!event.cancelable)return;
 // Finger down = scroll content toward its TOP; finger up = toward BOTTOM.
 // Never cancel when the document or a nested reader can really scroll.
 if(!canScroll(stepY>0?"up":"down"))event.preventDefault();
},{capture:true,passive:false});
document.addEventListener("touchend",reset,{capture:true,passive:true});
document.addEventListener("touchcancel",reset,{capture:true,passive:true});
})();

/* DAR_GLOBAL_ADULT_HERO_EDGE_BINDING_V5 · REAL OFFSET: extend REAL active hero artwork into
 * upper safe area in visitor, Test and Android PWA. No extra touch interception. */
(function(){
 "use strict";
 if(window.__darAdultHeroEdgeBindingV4)return;
 if(/^\/(?:kids|test\/kids)(?:\/|$)/.test(String(location.pathname||"")))return;
 window.__darAdultHeroEdgeBindingV4=true;
 var scheduled=false, edge=null;
 var candidates=[
  "#appView [data-hero-kind] .dar-hero",
  "body.is-frauen-route #appView .frauen-library-hero",
  "body.is-post-route #appView .post-reader > .post-reader-title",
  "body.is-topic-route #appView .topic-collection-page > .view-head",
  "body.is-topics-route #appView .topics-hub > .view-head",
  "body.is-hadith-route #appView .hadith-hub > .view-head",
  "body.is-dua-route #appView .dua-hub > .view-head",
  "body.is-area-route #appView .view-head",
  "#appView [data-dar-hero-image]"
 ];
 function artFor(node){
  var cs=getComputedStyle(node), val=cs.backgroundImage||"none";
  if(/url\(/i.test(val))return val;
  for(var i=0;i<2;i++){
   var p=getComputedStyle(node,i===0?"::before":"::after").backgroundImage||"none";
   if(/url\(/i.test(p))return p;
  }
  var vars=["--frauen-hero-img","--dar-hero-img","--dar-hero-image","--dar-immersive-top-image"];
  for(var j=0;j<vars.length;j++){
   val=cs.getPropertyValue(vars[j]).trim();
   if(/url\(/i.test(val))return val;
  }
  var img=node.querySelector("img[data-hero-art],.dar-hero-art img,.hero-image img,img.hero-image");
  if(img&&img.currentSrc)return 'url('+JSON.stringify(img.currentSrc)+')';
  return "";
 }
 /* V5: photo continuation extends to the actual hero top, not a fixed safe-area guess.
  * Non-interactive visual layer only; first-touch scroll guard stays untouched. */
 function findArt(){
  var maxGap=Math.min(360,Math.max(180,window.innerHeight*.31));
  for(var i=0;i<candidates.length;i++){
   var nodes=document.querySelectorAll(candidates[i]);
   for(var j=0;j<nodes.length;j++){
    var node=nodes[j];
    if(!node.getClientRects().length)continue;
    var rect=node.getBoundingClientRect();
    if(rect.width<90||rect.height<45||rect.bottom<=0||rect.top>maxGap)continue;
    var art=artFor(node);
    if(art)return {image:art,top:Math.max(0,rect.top)};
   }
  }
  return null;
 }
 function apply(){
  scheduled=false;
  if(!document.body||!document.getElementById("appView"))return;
  var active=findArt();
  if(!active||active.top<2){
   document.body.classList.remove("dar-hero-edge-active");
   return;
  }
  if(!edge){
   edge=document.createElement("div");
   edge.id="darHeroSafeTopFill";
   edge.setAttribute("aria-hidden","true");
   var surface=document.createElement("div");
   surface.className="dar-hero-edge-art";
   edge.appendChild(surface);
   document.body.appendChild(edge);
  }
  if(edge.style.getPropertyValue("--dar-hero-edge-image")!==active.image)
   edge.style.setProperty("--dar-hero-edge-image",active.image);
  var extent=Math.ceil(active.top+2)+"px";
  if(edge.style.getPropertyValue("--dar-hero-edge-height")!==extent)
   edge.style.setProperty("--dar-hero-edge-height",extent);
  document.body.classList.add("dar-hero-edge-active");
 }
 function schedule(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(apply);
 }
 function start(){
  var root=document.getElementById("appView");
  if(!root)return;
  new MutationObserver(schedule).observe(root,{childList:true});
  new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:["class"]});
  new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme","data-theme-variant"]});
  root.addEventListener("load",schedule,true);
  window.addEventListener("pageshow",schedule,{passive:true});
  window.addEventListener("resize",schedule,{passive:true});
  window.addEventListener("scroll",schedule,{passive:true});
  window.addEventListener("popstate",schedule,{passive:true});
  window.addEventListener("hashchange",schedule,{passive:true});
  schedule();
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
 else start();
})();
