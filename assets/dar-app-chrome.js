(function(){
  if(window.__darAppChromeInstalled)return;
  window.__darAppChromeInstalled=true;
  function isCopyTarget(el){
    if(!el||!el.closest)return false;
    return !!el.closest("input,textarea,select,[contenteditable='true'],[contenteditable=''],[data-copy],[data-selectable],.allow-copy");
  }
  /* DAR_INTERNAL_READER_V3
     Q-source and teaching pages stay within the mounted adult app.
     Only the initial app launch may display the 0–100% brand loader.
     Source HTML is verified before it enters this frame, and the shell,
     selected post and five-tab navigation remain mounted throughout. */
  var sourceNavPending=false,sourcePanel=null,sourceFrame=null;
  var sourcePreviousOverflow=null,sourcePanelHistory=false;
  function showSourceUnavailable(){
    try{
      var toast=document.getElementById("darSourceNavigationError");
      if(!toast){
        toast=document.createElement("div");
        toast.id="darSourceNavigationError";
        toast.setAttribute("role","alert");
        toast.style.cssText="position:fixed;z-index:1301;left:16px;right:16px;bottom:max(95px,env(safe-area-inset-bottom,0px));margin:auto;max-width:520px;padding:16px 18px;border-radius:14px;background:#202a24;color:#fff;border:1px solid #aa915b;box-shadow:0 6px 24px rgba(0,0,0,.3);font:500 14px/1.5 system-ui,sans-serif;text-align:center;cursor:pointer";
        toast.textContent="Diese interne Seite konnte nicht geöffnet werden. Bitte versuche es erneut.";
        toast.addEventListener("click",function(){toast.remove()});
        (document.body||document.documentElement).appendChild(toast);
      }
      toast.hidden=false;
    }catch(_){}
  }
  function closeInternalSource(fromHistory){
    if(!sourcePanel||sourcePanel.hidden)return;
    sourcePanel.hidden=true;
    if(sourceFrame){sourceFrame.removeAttribute("src");sourceFrame.srcdoc="";}
    if(document.body){
      if(sourcePreviousOverflow===null)document.body.style.removeProperty("overflow");
      else document.body.style.overflow=sourcePreviousOverflow;
    }
    sourcePreviousOverflow=null;
    var pushed=sourcePanelHistory;
    sourcePanelHistory=false;
    sourceNavPending=false;
    if(!fromHistory&&pushed&&window.history&&window.history.state&&window.history.state.__darInternalSourceV3){
      window.history.back();
    }
  }
  function ensureInternalSourcePanel(){
    if(sourcePanel)return sourcePanel;
    var style=document.createElement("style");
    style.id="darInternalSourceStylesV3";
    style.textContent=[
      "#darInternalSourceV3{position:fixed;inset:0 0 calc(80px + env(safe-area-inset-bottom,0px)) 0;z-index:1100;background:#f8f5ec;color:#24352c;display:flex;flex-direction:column;overflow:hidden}",
      "#darInternalSourceV3[hidden]{display:none!important}",
      "#darInternalSourceV3 .dar-source-toolbar{flex:none;display:flex;align-items:center;gap:10px;justify-content:space-between;padding:calc(8px + env(safe-area-inset-top,0px)) max(12px,env(safe-area-inset-left,0px)) 9px max(12px,env(safe-area-inset-right,0px));background:#f9f6ef;border-bottom:1px solid #d8c9ab;min-height:53px}",
      "#darInternalSourceV3 .dar-source-back{background:#eee5d5;color:#463b27;border:1px solid #a6977b;border-radius:999px;min-height:42px;padding:8px 18px;font:700 14px/1.2 -apple-system,BlinkMacSystemFont,system-ui,sans-serif;cursor:pointer}",
      "#darInternalSourceV3 .dar-source-label{font:700 11px/1.3 -apple-system,BlinkMacSystemFont,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;text-align:right;color:#665735}",
      "#darInternalSourceV3 iframe{display:block;width:100%;height:100%;flex:1 1 auto;min-height:0;border:0;background:#f8f5ec}",
      "@media(prefers-color-scheme:dark){html[data-theme='dark'] #darInternalSourceV3,html[data-theme='dar-al-layl'] #darInternalSourceV3{background:#121714;color:#f4eddb}html[data-theme='dark'] #darInternalSourceV3 .dar-source-toolbar,html[data-theme='dar-al-layl'] #darInternalSourceV3 .dar-source-toolbar{background:#18201a;border-color:#5a5036}html[data-theme='dark'] #darInternalSourceV3 .dar-source-back,html[data-theme='dar-al-layl'] #darInternalSourceV3 .dar-source-back{background:#273329;color:#f5e6c8;border-color:#6f664a}}",
      "@media(max-width:390px){#darInternalSourceV3{bottom:calc(76px + env(safe-area-inset-bottom,0px))}}"
    ].join("\n");
    (document.head||document.documentElement).appendChild(style);
    var panel=document.createElement("section");
    panel.id="darInternalSourceV3";
    panel.hidden=true;
    panel.setAttribute("role","dialog");
    panel.setAttribute("aria-label","Interne Quellen und Lernseiten");
    var toolbar=document.createElement("div");
    toolbar.className="dar-source-toolbar";
    var back=document.createElement("button");
    back.className="dar-source-back";
    back.type="button";
    back.textContent="← Zurück zum Beitrag";
    back.addEventListener("click",function(){closeInternalSource(false)});
    var caption=document.createElement("span");
    caption.className="dar-source-label";
    caption.textContent="DĀR AL TAWḤĪD · Quellen";
    toolbar.appendChild(back);toolbar.appendChild(caption);
    var frame=document.createElement("iframe");
    frame.id="darInternalSourceFrameV3";
    frame.setAttribute("title","Quellenkarte und Lernbereich");
    frame.setAttribute("referrerpolicy","strict-origin-when-cross-origin");
    toolbar.setAttribute("data-dar-source-toolbar","1");
    panel.appendChild(toolbar);panel.appendChild(frame);
    (document.body||document.documentElement).appendChild(panel);
    sourcePanel=panel;sourceFrame=frame;
    return panel;
  }
  function openInternalSource(target,html){
    var panel=ensureInternalSourcePanel();
    if(document.body&&panel.hidden)sourcePreviousOverflow=document.body.style.overflow||"";
    if(document.body)document.body.style.overflow="hidden";
    // Base tag keeps /assets/, /q/, /lernen/ and anchored links resolving correctly.
    // srcdoc presents the *already checked* HTML without another network round-trip
    // and, crucially, without reloading the application's soft boot.
    var base='<base href="'+location.origin+target.replace(/"/g,"&quot;")+'">';
    var src=/<head\b[^>]*>/i.test(html)?html.replace(/<head\b[^>]*>/i,function(m){return m+base;}):base+html;
    sourceFrame.srcdoc=src;
    panel.hidden=false;
    var caption=panel.querySelector(".dar-source-label");
    if(caption)caption.textContent=target.indexOf("/lernen/")===0?"DĀR AL TAWḤĪD · Lernen":"DĀR AL TAWḤĪD · Quellen";
    if(window.history&&window.history.pushState&&!sourcePanelHistory){
      try{
        var state=Object.assign({},window.history.state||{},{__darInternalSourceV3:true});
        window.history.pushState(state,"",location.href);
        sourcePanelHistory=true;
      }catch(_){}
    }
    sourceNavPending=false;
  }
  document.addEventListener("click",function(ev){
    if(ev.defaultPrevented||ev.button!==0||ev.metaKey||ev.ctrlKey||ev.altKey||ev.shiftKey)return;
    var a=ev.target&&ev.target.closest?ev.target.closest("a[href]"):null;
    if(!a||a.hasAttribute("download")||a.getAttribute("target")==="_blank")return;
    var url;try{url=new URL(a.getAttribute("href"),location.href)}catch(_){return}
    if(url.origin!==location.origin||!(/^\/q\/[1-9][0-9]*\/?$/.test(url.pathname)||/^\/lernen\/[a-z0-9-]+\/?$/.test(url.pathname)))return;
    ev.preventDefault();ev.stopImmediatePropagation();
    if(sourceNavPending)return;
    var target=url.pathname.replace(/\/?$/,"/")+url.search+url.hash;
    sourceNavPending=true;
    var controller=typeof AbortController==="function"?new AbortController():null;
    var timeout=setTimeout(function(){if(controller)controller.abort()},8000);
    fetch(target,{cache:"default",credentials:"same-origin",headers:{"Accept":"text/html"},signal:controller?controller.signal:undefined})
      .then(function(res){
        if(!res.ok||!/text\/html/i.test(res.headers.get("content-type")||""))throw Error("Missing internal HTML");
        return res.text();
      })
      .then(function(html){
        var q=target.indexOf("/q/")===0;
        if(q){
          if(!/<body\b[^>]*\bqsource-body\b/i.test(html)||
            !/class\s*=\s*["'][^"']*\bqsource-links\b/i.test(html)||
            !/<a\b[^>]*\bqsource-link\b/i.test(html))throw Error("Q source page is not ready");
        }else if(!/id\s*=\s*["']quiz["']/.test(html)||!/<main\b/i.test(html)){
          throw Error("Learning page is not ready");
        }
        openInternalSource(target,html);
      })
      .catch(function(){sourceNavPending=false;showSourceUnavailable()})
      .finally(function(){clearTimeout(timeout)});
  },true);
  window.addEventListener("popstate",function(ev){
    if(sourcePanel&&!sourcePanel.hidden&&(!ev.state||!ev.state.__darInternalSourceV3))
      closeInternalSource(true);
  });
  document.addEventListener("keydown",function(ev){
    if(ev.key==="Escape"&&sourcePanel&&!sourcePanel.hidden){ev.preventDefault();closeInternalSource(false);}
  });
  // Switching an existing bottom tab dismisses the internal reader first.
  document.addEventListener("click",function(ev){
    if(!sourcePanel||sourcePanel.hidden)return;
    var hit=ev.target&&ev.target.closest?ev.target.closest("#bottomNav .bottom-nav-btn,[data-bottom-nav]"):null;
    if(hit)closeInternalSource(false);
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


/* DAR_VISITOR_HERO_PRAYER_LIBRARY_BOOT_V1 — adult visitor only.
   Loads independently of the protected push/runtime sources. */
(function(){
 "use strict";
 if(typeof window==="undefined" || typeof document==="undefined" || typeof location==="undefined")return;
 if(/^\/(?:test|kids|admin)(?:\/|$)/i.test(location.pathname))return;
 if(window.__DAR_VISITOR_VISUAL_BOOT_V1__)return;
 window.__DAR_VISITOR_VISUAL_BOOT_V1__=true;
 var style=document.createElement("link");
 style.rel="stylesheet";
 style.href="/assets/visitor-hero-prayer-v1.css?v=20261016-visitor-v1";
 style.setAttribute("data-dar-visitor-visual-v1","");
 document.head.appendChild(style);
 var script=document.createElement("script");
 script.src="/assets/visitor-hero-prayer-v1.js?v=20261016-visitor-v1";
 script.async=false;
 document.head.appendChild(script);
})();
