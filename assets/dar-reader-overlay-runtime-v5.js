/* DAR_READER_OVERLAY_RUNTIME_V5 · 2026-11-01
   Applies to the already mounted adult SPA; no navigation or source reload.
   Independent of stale dar-app-chrome.js: covers a previously cached V3 panel.
   Does not touch Kids, prayer, Qur'an or the five tabs when reader is closed. */
(function(){
  "use strict";
  if(window.__darReaderOverlayRuntimeV5||window.self!==window.top)return;
  window.__darReaderOverlayRuntimeV5=true;
  var PANEL="darInternalSourceV3", FRAME="darInternalSourceFrameV3", attached=null;
  var css="\n/* The old reader used bottom:80px and competed with the floating app dock.\n   Override using actual viewport height, not the app's scrolled container. */\nhtml:has(body > #darInternalSourceV3:not([hidden])),\nhtml:has(body > #darInternalSourceV3:not([hidden])) body{overflow:hidden!important;overscroll-behavior:none!important;}\nbody:has(> #darInternalSourceV3:not([hidden])) > :not(#darInternalSourceV3):not(script):not(style){visibility:hidden!important;pointer-events:none!important;}\nbody:has(> #darInternalSourceV3:not([hidden])) :is(#bottomNav,#bottomNavigation,#appBottomNav,.bottom-nav,.bottom-nav-global,.dar-bottom-nav,[data-bottom-nav-root]){display:none!important;visibility:hidden!important;pointer-events:none!important;}\n#darInternalSourceV3:not([hidden]){display:flex!important;position:fixed!important;inset:0!important;top:0!important;right:0!important;bottom:0!important;left:0!important;\n width:100vw!important;max-width:100vw!important;height:100vh!important;height:100dvh!important;max-height:100dvh!important;\n margin:0!important;padding:0!important;transform:none!important;z-index:2147483647!important;visibility:visible!important;opacity:1!important;\n background:#f8f5ef!important;isolation:isolate!important;overflow:hidden!important;box-sizing:border-box!important;flex-direction:column!important;}\n#darInternalSourceV3[hidden]{display:none!important;}\n#darInternalSourceV3 .dar-source-toolbar{flex:0 0 auto!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:7px!important;\n min-height:45px!important;margin:0!important;padding:calc(4px + env(safe-area-inset-top,0px)) max(11px,env(safe-area-inset-right,0px)) 5px max(11px,env(safe-area-inset-left,0px))!important;\n border-bottom:1px solid #dbd0bb!important;box-sizing:border-box!important;background:#f8f5ef!important;}\n#darInternalSourceV3 .dar-source-actions{display:flex!important;gap:5px!important;align-items:center!important;min-width:0!important;}\n#darInternalSourceV3 .dar-source-back,#darInternalSourceV3 .dar-source-home{display:inline-flex!important;align-items:center!important;justify-content:center!important;\n box-sizing:border-box!important;flex:0 0 auto!important;min-height:39px!important;border:1px solid #cfc2a8!important;border-radius:11px!important;\n background:transparent!important;padding:7px 11px!important;box-shadow:none!important;color:#4d422f!important;\n font:650 12px/1.25 -apple-system,BlinkMacSystemFont,system-ui,sans-serif!important;white-space:nowrap!important;}\n#darInternalSourceV3 .dar-source-home{border-color:transparent!important;color:#775d35!important;}\n#darInternalSourceV3 .dar-source-label{font:750 10px/1.3 -apple-system,BlinkMacSystemFont,system-ui,sans-serif!important;letter-spacing:.05em!important;\n overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;text-align:end!important;min-width:0!important;color:#786340!important;}\n#darInternalSourceV3 iframe{display:block!important;width:100%!important;max-width:100%!important;height:0!important;min-height:0!important;flex:1 1 0%!important;\n border:0!important;overflow:auto!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;background:#f8f5ef!important;}\n#darInternalSourceV3 :is(button,a):focus-visible{outline:2px solid #a58b54!important;outline-offset:2px!important;}\n@media(max-width:360px){#darInternalSourceV3 .dar-source-actions{gap:2px!important}#darInternalSourceV3 :is(.dar-source-home,.dar-source-back){padding:6px 8px!important;font-size:11px!important}#darInternalSourceV3 .dar-source-label{font-size:9px!important}}\nhtml[data-theme=\"dark\"] #darInternalSourceV3,html[data-theme=\"dar-al-layl\"] #darInternalSourceV3{background:#121714!important;color:#f4eddb!important}\nhtml[data-theme=\"dark\"] #darInternalSourceV3 .dar-source-toolbar,html[data-theme=\"dar-al-layl\"] #darInternalSourceV3 .dar-source-toolbar{background:#18201a!important;border-color:#5a5036!important}\nhtml[data-theme=\"dark\"] #darInternalSourceV3 :is(.dar-source-home,.dar-source-back),html[data-theme=\"dar-al-layl\"] #darInternalSourceV3 :is(.dar-source-home,.dar-source-back){color:#f4e6ca!important;border-color:#695a3d!important}\n";
  // We replace CSS_PLACEHOLDER during authoring with a valid JSON string.
  var style=document.getElementById("darReaderOverlayRuntimeV5Styles");
  if(!style){
    style=document.createElement("style");
    style.id="darReaderOverlayRuntimeV5Styles";
    style.textContent=css;
    (document.head||document.documentElement).appendChild(style);
  }
  function frameDocument(frame){try{return frame&&frame.contentDocument}catch(_){return null}}
  function applyFrame(frame){
    var doc=frameDocument(frame);
    if(!doc||!doc.documentElement)return;
    if(!doc.getElementById("darReaderFrameV5Styles")){
      var st=doc.createElement("style");
      st.id="darReaderFrameV5Styles";
      st.textContent=[
        "html,body{overscroll-behavior-y:contain!important;-webkit-overflow-scrolling:touch}",
        "body.qsource-body{min-height:100%!important;overflow-y:auto!important}",
        "body.qsource-body .qsource-page{width:min(calc(100% - 24px),820px)!important;max-width:100%!important;padding:5px 0 calc(54px + env(safe-area-inset-bottom,0px))!important;margin:0 auto!important}",
        "body.qsource-body .qsource-header{min-height:53px!important;padding:6px 0!important;gap:7px!important}",
        "body.qsource-body .qsource-logo{width:38px!important;height:38px!important;flex:0 0 38px!important}",
        "body.qsource-body .qsource-brand{font-size:clamp(19px,4.5vw,26px)!important;line-height:1.08!important}",
        "body.qsource-body .qsource-brand-top{font-size:8px!important;letter-spacing:.06em!important}",
        "body.qsource-body .qsource-sign{font-size:13px!important;margin-top:2px!important}",
        "body.qsource-body .qsource-hero{margin-top:6px!important;padding:9px 0!important}",
        "body.qsource-body .q49-language-static{margin:9px 0 12px!important;padding:10px!important}",
        "body.heritage-learning:not(.wqa-page){min-height:100%!important;overflow-y:auto!important}",
        "body.heritage-learning:not(.wqa-page) main{min-height:100%!important;width:min(calc(100% - 24px),820px)!important;padding:8px 0 calc(54px + env(safe-area-inset-bottom,0px))!important}",
        "body.heritage-learning:not(.wqa-page) main>header{padding:5px 0 10px!important}",
        "body.heritage-learning:not(.wqa-page) main>header .logo{width:38px!important;height:38px!important}",
        "body.heritage-learning.wqa-page{height:100dvh!important;overflow:hidden!important}",
        "body.heritage-learning.wqa-page main.wqa-shell{height:100dvh!important;min-height:0!important;overflow:auto!important}",
        "@media(min-width:920px){body.qsource-body .qsource-page,body.heritage-learning main{width:min(calc(100% - 64px),900px)!important}}"
      ].join("\n");
      (doc.head||doc.documentElement).appendChild(st);
    }
    if(doc.documentElement)doc.documentElement.setAttribute("data-dar-internal-reading","1");
  }
  function navigateHome(back){
    if(back)back.click(); // Proper close, scroll restoration and history cleanup in existing app.
    // Navigation happens only after the popstate/back close has completed;
    // never assign a new URL or trigger the initial app loader.
    var go=function(){
      try{
        if(typeof window.navigate==="function"){window.navigate("home");return}
        var home=document.querySelector('[data-nav="home"],[data-nav="start"],#bottomNav [data-view="home"]');
        if(home){home.click();return}
        if(location.hash!=="#home")location.hash="#home";
      }catch(error){console.warn("DĀR reader home navigation",error)}
    };
    if(window.history&&window.history.state&&window.history.state.__darInternalSourceV3){
      var once=false;
      function finish(){if(once)return;once=true;window.removeEventListener("popstate",finish);go()}
      window.addEventListener("popstate",finish);
      setTimeout(finish,150);
    }else setTimeout(go,0);
  }
  function ensureToolbar(panel){
    var bar=panel.querySelector(".dar-source-toolbar");
    if(!bar)return;
    var back=bar.querySelector(".dar-source-back");
    if(back){
      if(back.textContent&&/Zurück zum Beitrag/i.test(back.textContent))back.textContent="← Zurück";
      back.setAttribute("aria-label","Zum vorherigen Beitrag zurückkehren");
    }
    if(!bar.querySelector(".dar-source-home")){
      var home=document.createElement("button");
      home.type="button";home.className="dar-source-home";home.textContent="⌂ Startseite";
      home.setAttribute("aria-label","Zur Startseite zurückkehren");
      home.addEventListener("click",function(ev){ev.preventDefault();navigateHome(back)});
      var group=bar.querySelector(".dar-source-actions");
      if(!group){
        group=document.createElement("div");group.className="dar-source-actions";
        if(back)group.appendChild(back);
        bar.insertBefore(group,bar.firstChild);
      }
      group.appendChild(home);
    }
  }
  function sync(panel){
    if(!panel)return;
    var open=!panel.hidden;
    var html=document.documentElement,body=document.body;
    if(html)html.classList.toggle("dar-reader-overlay-active-v5",open);
    if(body)body.classList.toggle("dar-reader-overlay-active-v5",open);
    if(!open)return;
    ensureToolbar(panel);
    var frame=panel.querySelector("iframe")||document.getElementById(FRAME);
    if(frame)applyFrame(frame);
  }
  function attach(panel){
    if(!panel||attached===panel)return;
    attached=panel;
    ensureToolbar(panel);
    var frame=panel.querySelector("iframe");
    if(frame){
      frame.addEventListener("load",function(){applyFrame(frame)},{passive:true});
      applyFrame(frame);
    }
    new MutationObserver(function(records){
      for(var i=0;i<records.length;i++){
        if(records[i].attributeName==="hidden"){sync(panel);return}
      }
    }).observe(panel,{attributes:true,attributeFilter:["hidden"]});
    sync(panel);
  }
  function find(){var panel=document.getElementById(PANEL);if(panel)attach(panel)}
  if(document.body){
    new MutationObserver(function(records){
      for(var i=0;i<records.length;i++){
        var nodes=records[i].addedNodes;
        for(var j=0;j<nodes.length;j++){
          if(nodes[j].nodeType===1&&nodes[j].id===PANEL){attach(nodes[j]);return}
        }
      }
    }).observe(document.body,{childList:true});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",find,{once:true});else find();
  window.addEventListener("pageshow",find);
})();