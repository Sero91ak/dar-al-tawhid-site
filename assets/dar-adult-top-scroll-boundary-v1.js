/* DAR_ADULT_TOP_SCROLL_BOUNDARY_V1 · root scroll stop for adult visitor and Dar Test.
 * Prevent iOS rubber-band/pull-to-refresh only at the actual top boundary.
 * Does not scrollTo, clone/reparent DOM, lock body overflow or alter sticky Heroes.
 * Nested readers may scroll upward independently; horizontal swipes remain native.
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
function hasScrollUp(){
 var target=startTarget;
 for(var node=target;node&&node!==document;node=node.parentElement){
  if(node.nodeType!==1)continue;
  if(node===document.documentElement)break;
  var cs=window.getComputedStyle(node);
  if(/^(auto|scroll|overlay)$/.test(cs.overflowY)&&
     node.scrollHeight>node.clientHeight+1&&node.scrollTop>0.5)return true;
  if(scope&&node===scope)return false;
 }
 if(scope)return false;
 var scroll=document.scrollingElement||document.documentElement;
 return !!((scroll&&scroll.scrollTop>0.5)||window.scrollY>0.5);
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
 if(axis!=="vertical"||stepY<=0||event.defaultPrevented||!event.cancelable)return;
 if(!hasScrollUp())event.preventDefault();
},{capture:true,passive:false});
document.addEventListener("touchend",reset,{capture:true,passive:true});
document.addEventListener("touchcancel",reset,{capture:true,passive:true});
})();