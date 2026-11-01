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
    if(document.body&&document.body.classList)document.body.classList.remove("dar-internal-reader-open");
    if(document.documentElement&&document.documentElement.classList)document.documentElement.classList.remove("dar-internal-reader-open");
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
    /* DAR_READING_EDGE_TO_EDGE_V4 */
    style.textContent="#darInternalSourceV3{position:fixed!important;inset:0!important;width:100%!important;height:100svh!important;height:100dvh!important;z-index:2147483000!important;background:#f8f5ef;color:#24352c;display:flex;flex-direction:column;overflow:hidden}\n#darInternalSourceV3[hidden]{display:none!important}\nhtml.dar-internal-reader-open,body.dar-internal-reader-open{overflow:hidden!important}\nbody.dar-internal-reader-open :is(#bottomNav,#bottomNavigation,#appBottomNav,.bottom-nav,.bottom-nav-global,.dar-bottom-nav,[data-bottom-nav-root]){visibility:hidden!important;pointer-events:none!important}\n#darInternalSourceV3 .dar-source-toolbar{flex:none;display:flex;align-items:center;justify-content:space-between;gap:7px;min-height:46px;padding:calc(5px + env(safe-area-inset-top,0px)) max(12px,env(safe-area-inset-right,0px)) 5px max(12px,env(safe-area-inset-left,0px));background:#f8f5ef;border-bottom:1px solid #d9d1c2;box-sizing:border-box}\n#darInternalSourceV3 .dar-source-actions{display:flex;align-items:center;gap:5px;min-width:0}\n#darInternalSourceV3 .dar-source-back,#darInternalSourceV3 .dar-source-home{appearance:none;display:inline-flex;align-items:center;justify-content:center;min-height:40px;background:transparent;color:#453b2b;border:1px solid #d8cbb4;border-radius:12px;padding:7px 11px;font:650 12px/1.25 -apple-system,BlinkMacSystemFont,system-ui,sans-serif;white-space:nowrap;cursor:pointer;box-shadow:none}\n#darInternalSourceV3 .dar-source-home{color:#705930;border-color:transparent}\n#darInternalSourceV3 .dar-source-label{font:750 10px/1.3 -apple-system,BlinkMacSystemFont,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;text-align:end;color:#7e6b46;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n#darInternalSourceV3 :is(.dar-source-back,.dar-source-home):focus-visible{outline:2px solid #a88b54!important;outline-offset:2px!important}\n#darInternalSourceV3 iframe{display:block;width:100%;height:100%;flex:1 1 auto;min-height:0;border:0;background:#f8f5ef;overscroll-behavior:contain}\n@media(max-width:370px){#darInternalSourceV3 .dar-source-actions{gap:2px}#darInternalSourceV3 :is(.dar-source-back,.dar-source-home){font-size:11px;padding-inline:8px}#darInternalSourceV3 .dar-source-label{font-size:9px}}\n@media(prefers-color-scheme:dark){html[data-theme='dark'] #darInternalSourceV3,html[data-theme='dar-al-layl'] #darInternalSourceV3{background:#121714;color:#f4eddb}html[data-theme='dark'] #darInternalSourceV3 .dar-source-toolbar,html[data-theme='dar-al-layl'] #darInternalSourceV3 .dar-source-toolbar{background:#18201a;border-color:#5a5036}}";
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
    back.textContent="← Zurück";
    back.addEventListener("click",function(){closeInternalSource(false)});
    var caption=document.createElement("span");
    caption.className="dar-source-label";
    caption.textContent="DĀR AL TAWḤĪD · Quellen";
    var actions=document.createElement("div");actions.className="dar-source-actions";
    var home=document.createElement("button");home.type="button";home.className="dar-source-home";home.textContent="⌂ Startseite";
    home.addEventListener("click",function(){
      var wasPushed=sourcePanelHistory;
      // Home is a *new internal app route*, not a browser back followed by
      // a competing route push (which could undo the intended Home action).
      closeInternalSource(true);
      try{
        if(wasPushed&&window.history&&typeof window.history.replaceState==="function"){
          var nextState=Object.assign({},window.history.state||{});
          delete nextState.__darInternalSourceV3;
          window.history.replaceState(nextState,"",location.href);
        }
        if(typeof window.navigate==="function"){window.navigate("home");return}
        var nav=document.querySelector('[data-nav="home"],[data-nav="start"]');
        if(nav){nav.click();return}
        location.hash="#home";
      }catch(_){}
    });
    actions.appendChild(back);actions.appendChild(home);
    toolbar.appendChild(actions);toolbar.appendChild(caption);
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
    if(document.body){document.body.style.overflow="hidden";if(document.body.classList)document.body.classList.add("dar-internal-reader-open")}
    if(document.documentElement&&document.documentElement.classList)document.documentElement.classList.add("dar-internal-reader-open");
    // Base tag keeps /assets/, /q/, /lernen/ and anchored links resolving correctly.
    // srcdoc presents the *already checked* HTML without another network round-trip
    // and, crucially, without reloading the application's soft boot.
    var base='<base href="'+location.origin+target.replace(/"/g,"&quot;")+'">';
    var src=/<head\b[^>]*>/i.test(html)?html.replace(/<head\b[^>]*>/i,function(m){return m+base;}):base+html;
    // Embedded reading mode stays inside the already mounted app, without boot loader.
    var readerCss='<style id="darEmbeddedReaderEdgeV4">'+"html,body{min-height:100%;overscroll-behavior-y:contain!important}body.qsource-body .qsource-page{width:min(calc(100% - 24px),820px)!important;max-width:100%!important;padding:5px 0 calc(24px + env(safe-area-inset-bottom,0px))!important;margin:auto!important}body.qsource-body .qsource-header{min-height:55px!important;padding:6px 0!important;gap:8px!important}body.qsource-body .qsource-logo{width:38px!important;height:38px!important;flex:0 0 38px!important}body.qsource-body .qsource-brand{font-size:clamp(18px,4vw,25px)!important;line-height:1.08!important}body.qsource-body .qsource-brand-top{font-size:8px!important;letter-spacing:.07em!important}body.qsource-body .qsource-sign{font-size:13px!important;margin:1px 0 0!important}body.qsource-body .qsource-hero{padding:10px 0 6px!important;margin-top:5px!important}body.qsource-body .qsource-title{font-size:clamp(24px,5.2vw,34px)!important}body.qsource-body .q49-language-static{margin:10px 0!important;padding:10px 12px!important;border-radius:13px!important}body.heritage-learning main{width:min(calc(100% - 24px),820px)!important;max-width:100%!important;min-height:100dvh!important;padding:10px 0 calc(24px + env(safe-area-inset-bottom,0px))!important}body.heritage-learning main>header{padding:4px 0 12px!important;margin:0!important}body.heritage-learning main>header .logo{width:39px!important;height:39px!important;margin:0 auto 4px!important}body.heritage-learning main>header h1{font-size:clamp(24px,5vw,34px)!important;margin:8px 0!important}body.heritage-learning main .card{margin:12px 0!important}@media(min-width:920px){body.qsource-body .qsource-page,body.heritage-learning main{width:min(calc(100% - 64px),900px)!important}}"+'</style>';
    var headEnd=src.toLowerCase().indexOf("</head>");
    src=headEnd>=0?src.slice(0,headEnd)+readerCss+src.slice(headEnd):readerCss+src;
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
