/* DAR_DIRECT_READER_NAV_V1 · standalone website fallback only.
   Embedded readers use the mounted adult app toolbar (dar-app-chrome.js).
   No splash screen, no cloning app navigation and no source-content mutation. */
(function(){
 "use strict";
 if(window.__darDirectReaderNavV1||window.self!==window.top)return;
 if(!/^\/(?:q\/[1-9][0-9]*|lernen\/[a-z0-9-]+)\/(?:index\.html)?$/.test(location.pathname))return;
 window.__darDirectReaderNavV1=true;
 function init(){
  if(document.getElementById("darDirectReaderBarV1"))return;
  var q=/^\/q\//.test(location.pathname),header=document.createElement("nav");
  header.id="darDirectReaderBarV1";header.setAttribute("aria-label","Lese-Navigation");
  function button(label,action){
   var b=document.createElement("button");b.type="button";b.textContent=label;b.addEventListener("click",action);return b;
  }
  var back=button("← Zurück",function(){if(history.length>1)history.back();else location.assign("/")});
  var home=button("⌂ Startseite",function(){location.assign("/")});
  var left=document.createElement("div");left.className="dar-direct-reader-actions";left.append(back,home);
  var cap=document.createElement("span");cap.className="dar-direct-reader-caption";
  cap.textContent=q?"DĀR AL TAWḤĪD · Quellen":"DĀR AL TAWḤĪD · Lernen";
  header.append(left,cap);
  var st=document.createElement("style");st.id="darDirectReaderNavStylesV1";
  st.textContent=`
  #darDirectReaderBarV1{position:sticky;top:0;z-index:10900;display:flex;justify-content:space-between;align-items:center;gap:10px;
    box-sizing:border-box;min-height:46px;padding:calc(5px + env(safe-area-inset-top,0px)) max(12px,env(safe-area-inset-right,0px)) 5px max(12px,env(safe-area-inset-left,0px));
    background:var(--rq-page,#f8f5ef);color:var(--rq-ink,#29372e);border-bottom:1px solid var(--rq-line,#d8cebb)}
  #darDirectReaderBarV1 .dar-direct-reader-actions{display:flex;gap:6px;align-items:center;min-width:0}
  #darDirectReaderBarV1 button{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:7px 11px;border:1px solid var(--rq-line,#d8cebb);
    border-radius:12px;background:transparent;color:inherit;font:650 12px/1.2 -apple-system,BlinkMacSystemFont,system-ui,sans-serif;white-space:nowrap;cursor:pointer}
  #darDirectReaderBarV1 button+button{border-color:transparent}
  #darDirectReaderBarV1 button:focus-visible{outline:2px solid #a98b54;outline-offset:3px}
  #darDirectReaderBarV1 .dar-direct-reader-caption{color:var(--rq-gold,#80663d);text-align:end;font:750 10px/1.3 system-ui,sans-serif;letter-spacing:.04em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  body.qsource-body .qsource-page{width:min(calc(100% - 24px),820px)!important;padding-top:6px!important}
  body.qsource-body .qsource-header{min-height:54px!important;padding:6px 0!important}
  body.qsource-body .qsource-logo{width:38px!important;height:38px!important;flex:0 0 38px!important}
  body.qsource-body .qsource-brand{font-size:clamp(19px,4vw,25px)!important}
  body.qsource-body .qsource-brand-top{font-size:8px!important;letter-spacing:.07em!important}
  body.qsource-body .qsource-sign{font-size:13px!important}
  body.heritage-learning main{width:min(calc(100% - 24px),820px)!important;padding-top:7px!important}
  body.heritage-learning main>header{padding:5px 0 12px!important}
  body.heritage-learning main>header .logo{width:38px!important;height:38px!important}
  /* A single-screen teaching quiz must share its 100dvh with this header,
     not have a second 100dvh canvas clipped beneath it. */
  body.heritage-learning.wqa-page{display:flex!important;flex-direction:column!important;height:100dvh!important;min-height:0!important;overflow:hidden!important}
  body.heritage-learning.wqa-page #darDirectReaderBarV1{flex:0 0 auto!important}
  body.heritage-learning.wqa-page main.wqa-shell{flex:1 1 auto!important;height:auto!important;min-height:0!important;overflow-y:auto!important;overscroll-behavior-y:contain!important}

  @media(max-width:370px){#darDirectReaderBarV1 .dar-direct-reader-actions{gap:2px}#darDirectReaderBarV1 button{font-size:11px;padding-inline:8px}#darDirectReaderBarV1 .dar-direct-reader-caption{font-size:9px}}
  @media(prefers-color-scheme:dark){html[data-q-theme="dark"] #darDirectReaderBarV1{background:#14221c;color:#f2ecdf;border-color:#544a35}}
  `;
  document.head.appendChild(st);
  document.body.insertBefore(header,document.body.firstChild);
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();