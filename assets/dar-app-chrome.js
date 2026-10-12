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
