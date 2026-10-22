/* DĀR AL TAWḤĪD · V8 GLOBAL EXTERIOR — TEST ONLY.
   Coordinate all adult routes without rewriting, cloning or deleting their
   renderer markup, data, handlers, media players, readers or share dialogs. */
(function(w,d){
  "use strict";
  if(!/^\/test(?:\/|$)/.test(w.location.pathname))return;
  if(w.__DAR_V8_GLOBAL_APP_SHELL_V1)return;
  w.__DAR_V8_GLOBAL_APP_SHELL_V1=true;
  var root=d.documentElement;
  var enabled=true,frame=0,lastRoute="",observer=null,lastPrimary=null;
  var routeNames={
    home:"Start",ilm:"Wissen",topics:"Themen",topic:"Thema",recent:"Beiträge",post:"Beitrag",
    quran:"Qurʾān", "quran-surah":"Qurʾān-Leser","quran-topic":"Qurʾān-Thema",
    duas:"Duʿāʾ","dua":"Duʿāʾ","dua-cat":"Duʿāʾ-Sammlung",
    library:"Bibliothek","library-detail":"Bibliothek","library-reader":"Buch lesen",
    frauen:"Frauen","propheten":"Propheten",hadith:"Ḥadīṯ",settings:"Einstellungen",
    account:"Konto",prayer:"Gebetszeiten",qibla:"Qibla",more:"Mehr",calendar:"Kalender",
    quiz:"Quiz",zakat:"Zakāt",saved:"Gespeichert",about:"Über uns"
  };
  function currentRoute(){
    var s="";
    try{s=decodeURIComponent((w.location.hash||"#home").slice(1)).split("/")[0]||"home";}catch(_){s="home"}
    return s.toLowerCase();
  }
  function safeMode(){
    var b=d.body;
    return !!(b&&!b.classList.contains("is-ilm-chat-route")&&!b.classList.contains("is-feed-fullscreen"));
  }
  function setSkipLink(){
    if(!d.body||d.getElementById("darV8SkipToContent"))return;
    var a=d.createElement("a");
    a.id="darV8SkipToContent";
    a.className="dar-v8-skip";
    a.href="#appView";
    a.textContent="Direkt zum Inhalt";
    a.addEventListener("click",function(e){
      e.preventDefault();
      var main=d.getElementById("appView");
      if(main){
        if(!main.hasAttribute("tabindex"))main.setAttribute("tabindex","-1");
        main.focus({preventScroll:true});
        main.scrollIntoView({block:"start",behavior:"auto"});
      }
    });
    d.body.insertBefore(a,d.body.firstChild);
  }
  function sync(){
    frame=0;
    if(!d.body)return;
    var route=currentRoute();
    root.classList.toggle("dar-v8-global",enabled);
    root.setAttribute("data-v8-section",route);
    var view=d.getElementById("appView");
    if(view){
      view.classList.toggle("dar-v8-stage",enabled);
      if(!view.hasAttribute("role"))view.setAttribute("role","main");
      if(!view.hasAttribute("aria-label"))view.setAttribute("aria-label",routeNames[route]||"App-Inhalt");
      if(lastRoute!==route)view.setAttribute("aria-label",routeNames[route]||"App-Inhalt");
    }
    lastRoute=route;
    root.classList.toggle("dar-v8-reader-mode",["post","dua","quran-surah","library-reader","library-detail"].indexOf(route)>=0);
    root.classList.toggle("dar-v8-overlay-mode",!safeMode());
    // No DOM reshuffle: existing elements keep all listeners, source IDs,
    // links, share menus, current media position, form values and scroll.
    setSkipLink();
    if(w.DarV8DuoLab&&typeof w.DarV8DuoLab.refresh==="function"){
      w.DarV8DuoLab.refresh();
    }
  }
  function schedule(){
    if(frame)return;
    frame=(w.requestAnimationFrame||function(f){return w.setTimeout(f,0)})(sync);
  }
  function start(){
    if(!d.body)return;
    schedule();
    w.addEventListener("hashchange",schedule,{passive:true});
    w.addEventListener("popstate",schedule,{passive:true});
    w.addEventListener("resize",schedule,{passive:true});
    w.addEventListener("orientationchange",schedule,{passive:true});
    w.addEventListener("dar:layoutchange",schedule,{passive:true});
    d.addEventListener("dar:view-rendered",schedule);
    var app=d.getElementById("appView");
    if(app&&w.MutationObserver){
      observer=new MutationObserver(schedule);
      observer.observe(app,{childList:true,subtree:false});
      lastPrimary=app;
    }
    if(w.visualViewport)w.visualViewport.addEventListener("resize",schedule,{passive:true});
    d.addEventListener("visibilitychange",function(){if(!d.hidden)schedule()});
  }
  w.DarV8GlobalShell=Object.freeze({
    refresh:schedule,
    status:function(){return {enabled:enabled,route:lastRoute,stage:root.getAttribute("data-v8-duo-stage")||"compact"}},
    disable:function(){enabled=false;root.classList.remove("dar-v8-global");schedule()},
    enable:function(){enabled=true;schedule()}
  });
  if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})(window,document);
