/* DAR_ADULT_TOP_SCROLL_BOUNDARY_V2 · two-ended scroll stop for adult visitor and Dar Test.
 * Suppress overshoot and spring-back at BOTH real document edges on iOS.
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
 if(!target||target.nodeType!==1||!target.closest){reset();return}
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
 if(!axis&&Math.abs(dx)+Math.abs(dy)>7)
  axis=Math.abs(dy)>Math.abs(dx)*1.15?"vertical":"horizontal";
 if(axis!=="vertical"||stepY===0||event.defaultPrevented||!event.cancelable)return;
 // A finger pulled DOWN scrolls content UP; a finger pushed UP scrolls DOWN.
 // Cancel only if every scroll ancestor has reached that exact boundary.
 if(!canScroll(stepY>0?"up":"down"))event.preventDefault();
},{capture:true,passive:false});
document.addEventListener("touchend",reset,{capture:true,passive:true});
document.addEventListener("touchcancel",reset,{capture:true,passive:true});
})();