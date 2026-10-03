(function(){
  if(window.__darAppChromeInstalled)return;
  window.__darAppChromeInstalled=true;
  function isCopyTarget(el){
    if(!el||!el.closest)return false;
    return !!el.closest("input,textarea,select,[contenteditable='true'],[contenteditable=''],[data-copy],[data-selectable],.allow-copy");
  }
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
  function scheduleSourceLine(){
    syncSourceLine();
    setTimeout(syncSourceLine,80);
    setTimeout(syncSourceLine,360);
  }
  document.addEventListener("DOMContentLoaded",scheduleSourceLine);
  window.addEventListener("hashchange",scheduleSourceLine);
  window.addEventListener("pageshow",scheduleSourceLine);
  document.addEventListener("dar:view-rendered",scheduleSourceLine);
  try{
    new MutationObserver(function(){scheduleSourceLine()}).observe(document.documentElement,{childList:true,subtree:true});
  }catch(e){}
})();
