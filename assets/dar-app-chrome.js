(function(){
  if(window.__darAppChromeInstalled)return;
  window.__darAppChromeInstalled=true;
  function isCopyTarget(el){
    if(!el||!el.closest)return false;
    return !!el.closest("input,textarea,select,[contenteditable='true'],[contenteditable=''],[data-copy],[data-selectable],.allow-copy");
  }
  /* Q_SOURCE_IN_FRAME_V1: a source citation is an internal app route,
     not a new browser/tab, on both official native shells and installed PWAs. */
  document.addEventListener("click",function(ev){
    if(ev.defaultPrevented||ev.button!==0||ev.metaKey||ev.ctrlKey||ev.altKey||ev.shiftKey)return;
    var a=ev.target&&ev.target.closest?ev.target.closest("a[href]"):null;
    if(!a||a.hasAttribute("download"))return;
    var url;try{url=new URL(a.getAttribute("href"),location.href)}catch(_){return}
    if(url.origin!==location.origin||!url.pathname.startsWith("/q/"))return;
    if(!/^\/q\/[1-9][0-9]*\/?$/.test(url.pathname))return;
    ev.preventDefault();ev.stopImmediatePropagation();
    location.assign(url.pathname.replace(/\/?$/,"/")+url.search+url.hash);
  },true);
  /* DAR_TOUCH_INTENT_GUARD_V1
     Navigation in the adult shell uses pointerup for fast activation. A finger
     that is scrolling/brushing a nav card must never activate it on release.
     Preserve immediate, deliberate taps and all normal scrolling. */
  var navPointer=null,dragClickTarget=null,dragClickUntil=0;
  function navHit(el){
    return el&&el.closest?el.closest("[data-nav],[data-bottom-nav],#backBtn,#homeBtn,#qovBackBtn,#qrcBackBtn"):null;
  }
  document.addEventListener("pointerdown",function(ev){
    if(ev.pointerType!=="touch"&&ev.pointerType!=="pen")return;
    if(ev.isPrimary===false){navPointer=null;return;}
    navPointer={id:ev.pointerId,x:ev.clientX,y:ev.clientY,moved:false};
  },{capture:true,passive:true});
  document.addEventListener("pointermove",function(ev){
    if(!navPointer||ev.pointerId!==navPointer.id)return;
    var dx=ev.clientX-navPointer.x,dy=ev.clientY-navPointer.y;
    if(dx*dx+dy*dy>144)navPointer.moved=true;
  },{capture:true,passive:true});
  document.addEventListener("pointerup",function(ev){
    if(!navPointer||ev.pointerId!==navPointer.id)return;
    var dx=ev.clientX-navPointer.x,dy=ev.clientY-navPointer.y;
    var moved=navPointer.moved||dx*dx+dy*dy>144;
    navPointer=null;
    if(!moved)return;
    var target=navHit(ev.target);
    if(!target)return;
    dragClickTarget=target;
    dragClickUntil=performance.now()+800;
    if(ev.cancelable)ev.preventDefault();
    ev.stopImmediatePropagation();
  },{capture:true,passive:false});
  document.addEventListener("pointercancel",function(ev){
    if(navPointer&&ev.pointerId===navPointer.id)navPointer=null;
  },{capture:true,passive:true});
  document.addEventListener("click",function(ev){
    if(!dragClickTarget||performance.now()>dragClickUntil){
      dragClickTarget=null;return;
    }
    if(ev.isTrusted===false||ev.detail===0)return;
    var target=navHit(ev.target);
    if(target&&(target===dragClickTarget||dragClickTarget.contains(target)||target.contains(dragClickTarget))){
      dragClickTarget=null;
      ev.preventDefault();
      ev.stopImmediatePropagation();
    }
  },true);
  document.addEventListener("gesturestart",function(ev){ev.preventDefault()},{passive:false,capture:true});
  document.addEventListener("gesturechange",function(ev){ev.preventDefault()},{passive:false,capture:true});
  document.addEventListener("gestureend",function(ev){ev.preventDefault()},{passive:false,capture:true});
  document.addEventListener("touchmove",function(ev){
    if(ev.touches&&ev.touches.length>1)ev.preventDefault();
  },{passive:false,capture:true});
  document.addEventListener("contextmenu",function(ev){
    if(!isCopyTarget(ev.target))ev.preventDefault();
  },{capture:true});
  document.addEventListener("selectstart",function(ev){
    if(!isCopyTarget(ev.target))ev.preventDefault();
  },{capture:true});
  function lockViewport(){
    var meta=document.querySelector('meta[name="viewport"]');
    var content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover";
    if(!meta){
      meta=document.createElement("meta");
      meta.name="viewport";
      document.head.appendChild(meta);
    }
    meta.setAttribute("content",content);
  }
  lockViewport();
  document.addEventListener("DOMContentLoaded",lockViewport);
  /* live v1099 · source-line text only */
  var sourceLineText="BEITRÄGE NACH QURʾĀN, SUNNAH & ĀTHĀR";
  function syncSourceLine(){
    try{
      document.querySelectorAll(".brand-kicker-row small,.dar-library-brandbar__meta").forEach(function(el){
        if(el&&el.textContent!==sourceLineText)el.textContent=sourceLineText;
      });
    }catch(e){}
  }
  /* Avoid scheduling three full-document brand scans for every unrelated
     childList mutation (Qurʾān, feed, players and progress frequently update). */
  var sourceLineFramePending=false;
  var sourceLineFollowUp=0;
  function scheduleSourceLine(){
    if(!sourceLineFramePending){
      sourceLineFramePending=true;
      requestAnimationFrame(function(){
        sourceLineFramePending=false;
        syncSourceLine();
      });
    }
    if(!sourceLineFollowUp){
      sourceLineFollowUp=setTimeout(function(){
        sourceLineFollowUp=0;
        syncSourceLine();
      },220);
    }
  }
  document.addEventListener("DOMContentLoaded",scheduleSourceLine);
  window.addEventListener("hashchange",scheduleSourceLine);
  window.addEventListener("pageshow",scheduleSourceLine);
  document.addEventListener("dar:view-rendered",scheduleSourceLine);
  try{
    new MutationObserver(function(records){
      for(var i=0;i<records.length;i++){
        var r=records[i],parent=r.target&&r.target.nodeType===1?r.target:r.target&&r.target.parentElement;
        if(parent&&parent.closest&&parent.closest(".brand-kicker-row,.dar-library-brandbar__meta")){
          scheduleSourceLine();return;
        }
        for(var j=0;j<r.addedNodes.length;j++){
          var n=r.addedNodes[j];
          if(n.nodeType===1&&(
            n.matches(".brand-kicker-row,.brand-kicker-row small,.dar-library-brandbar__meta")||
            n.querySelector(".brand-kicker-row small,.dar-library-brandbar__meta")
          )){scheduleSourceLine();return;}
        }
      }
    }).observe(document.documentElement,{childList:true,subtree:true});
  }catch(e){}
})();
