(function(global){
  "use strict";
  var ENTRY_ATTR="data-dar-frauen-live-entry";
  var hookTimer=0,entryScheduled=false,painting=false;
  /* FRAUEN_RENDER_IDEMPOTENT_V1410:
   * The shared app shell may invoke window.render hundreds of times even if
   * Frauen data and route did not change. Never destroy input/sticky DOM or
   * reset scroll in that case. Preserve original frozen content renderer. */
  var lastFrauenRoute=null,lastFrauenMarkup=null;

  function decodePart(v){try{return decodeURIComponent(v)}catch(e){return v}}
  function hashRoute(){
    var h=String(location.hash||"").replace(/^#\/?/,"");
    if(!h)return null;
    var parts=h.split("/");
    if(parts[0]!=="frauen")return null;
    return {view:"frauen",value:parts.slice(1).map(decodePart).join("/")};
  }
  function route(){
    var h=hashRoute();
    if(h)return h;
    try{
      if(typeof global.readRoute==="function"){
        var r=global.readRoute();
        if(r&&r.view==="frauen")return {view:"frauen",value:String(r.value||"")};
      }
    }catch(e){}
    return null;
  }
  function isFrauen(){return !!route()}
  function cleanup(){
    lastFrauenRoute=null;
    lastFrauenMarkup=null;
    if(document.body){
      document.body.classList.remove("is-frauen-route");
      document.body.removeAttribute("data-frauen-view");
    }
    document.documentElement.classList.remove("dar-frauen-live");
  }
  function ensureBridgeStyle(){
    if(document.getElementById("darFrauenLiveBridgeStyle"))return;
    var s=document.createElement("style");
    s.id="darFrauenLiveBridgeStyle";
    s.textContent=[
      ".dar-frauen-live-entry{width:100%;cursor:pointer;text-align:left}",
      ".dar-frauen-live-entry__body{min-width:0;display:block}",
      ".dar-frauen-live-entry__body h4{margin:0 0 3px;font:700 14px/1.25 inherit}",
      ".dar-frauen-live-entry__body p{margin:0;font:500 11px/1.35 inherit;opacity:.72}",
      ".dar-frauen-live-entry .feature-icon img{width:100%;height:100%;object-fit:contain}",
      "body.is-frauen-route #appView{overflow-x:hidden}",
      "body.is-frauen-route #appView>.view-head{display:none!important}"
    ].join("");
    document.head.appendChild(s);
  }
  function womenHtml(value){
    if(!global.DARFrauenFiqh||typeof global.DARFrauenFiqh.render!=="function"){
      return '<p class="frauen-empty">Frauenbereich wird geladen…</p>';
    }
    return global.DARFrauenFiqh.render(value||"");
  }
  function paint(){
    var r=route();
    if(!r||painting)return false;
    var app=document.getElementById("appView");
    if(!app)return false;
    painting=true;
    try{
      ensureBridgeStyle();
      document.documentElement.classList.add("dar-frauen-live");
      if(document.body)document.body.classList.add("is-frauen-route");
      var key=String(r.value||"");
      var sameRoute=lastFrauenRoute===key;
      var markup=womenHtml(key);
      var present=app.querySelector(':scope > .dar-frauen-production-root[data-frauen-production="1"]');
      if(sameRoute&&present&&lastFrauenMarkup===markup)return false;
      /* A content refresh may change the list, but it must never jump the
       * document to the top or eat the active search caret. Only navigation
       * to a different Frauen route starts at scroll position zero. */
      var active=document.activeElement;
      var searchFocus=!!(sameRoute&&active&&active.matches&&active.matches("[data-frauen-q]"));
      var caret=searchFocus&&typeof active.selectionStart==="number"?active.selectionStart:null;
      var previousScroll=sameRoute?Math.max(0,global.scrollY||document.documentElement.scrollTop||0):0;
      /* FRAUEN_SEARCH_INCREMENTAL_V1414:
       * Search updates only content nodes, never the original photo,
       * controls, focused input or pinned stage. Preserve scrolling. */
      var incremental=false;
      if(sameRoute&&searchFocus&&present){
        var oldShell=present.querySelector(".frauen-library-shell,.frauen-library-list");
        var draft=document.createElement("template");
        draft.innerHTML=markup;
        var nextShell=draft.content.querySelector(".frauen-library-shell,.frauen-library-list");
        var pinned=oldShell&&oldShell.querySelector(":scope > .dar-immersive-hero-stage");
        if(oldShell&&nextShell&&pinned){
          oldShell.className=nextShell.className;
          Array.from(oldShell.children).forEach(function(child){
            if(child===pinned||child.classList.contains("dar-frauen-hero-spacer"))return;
            child.remove();
          });
          Array.from(nextShell.children).forEach(function(child){
            if(child.classList.contains("frauen-library-hero")||
               child.classList.contains("frauen-library-search-wrap")||
               child.classList.contains("frauen-library-list-controls"))return;
            oldShell.appendChild(child);
          });
          incremental=true;
        }
      }
      if(!incremental)app.innerHTML='<div class="dar-frauen-production-root" data-frauen-production="1">'+markup+'</div>';
      lastFrauenRoute=key;
      lastFrauenMarkup=markup;
      if(global.DARFrauenFiqh&&typeof global.DARFrauenFiqh.bind==="function")global.DARFrauenFiqh.bind();
      if(!sameRoute){
        try{app.scrollTop=0}catch(e){}
        try{global.scrollTo(0,0)}catch(e){}
      }else if(previousScroll>0&&!incremental){
        try{global.scrollTo(0,previousScroll)}catch(e){}
      }
      if(searchFocus&&!incremental){
        var current=app.querySelector("[data-frauen-q]");
        if(current&&typeof current.focus==="function"){
          current.focus({preventScroll:true});
          if(caret!==null&&typeof current.setSelectionRange==="function")
           try{current.setSelectionRange(caret,caret)}catch(e){}
        }
      }
      try{document.dispatchEvent(new CustomEvent("dar:frauen-render",{detail:{value:key}}))}catch(e){}
      return true;
    }finally{painting=false}
  }
  function go(value){
    var v=String(value||"").replace(/^\/+|\/+$/g,"");
    var hash="#frauen"+(v?"/"+v.split("/").map(function(x){return encodeURIComponent(x)}).join("/"):"");
    if(location.hash===hash){paint();return}
    location.hash=hash;
    setTimeout(paint,0);
    if(typeof requestAnimationFrame==="function")requestAnimationFrame(paint);
  }
  function foldText(v){
    var x=String(v||"").toLowerCase();
    try{x=x.normalize("NFD").replace(/[\u0300-\u036f]/g,"")}catch(e){}
    return x.replace(/[^a-z0-9]+/g," ").trim();
  }
  function learningTarget(){
    var app=document.getElementById("appView")||document.body;
    if(!app||!app.querySelectorAll)return null;
    var heads=app.querySelectorAll("h1,h2,h3,h4,.section-title,.more-section-title,.group-title,.card-title,.panel-title,.settings-title,.view-title,strong,b");
    for(var i=0;i<heads.length;i++){
      var t=foldText(heads[i].textContent||"");
      if(t==="lernen wissen"||t.indexOf("lernen wissen")===0||t.indexOf("lernen und wissen")===0){
        var sec=heads[i].closest("section,article,.more-section,.settings-group,.premium-card,.card,.panel,.dar-section,.learn-section")||heads[i].parentElement;
        return sec&&(sec.querySelector(".list,.more-list,.settings-list,.feature-list,.learning-list,.dar-list,.menu-list,.stack,.items")||sec);
      }
    }
    var blocks=app.querySelectorAll("section,article,.more-section,.settings-group,.premium-card,.card,.panel,.dar-section,.learn-section");
    for(var j=0;j<blocks.length;j++){
      var b=foldText(blocks[j].textContent||"");
      if(b.indexOf("die propheten")!==-1||b.indexOf("din quiz")!==-1||b.indexOf("beitrage")!==-1){
        return blocks[j].querySelector(".list,.more-list,.settings-list,.feature-list,.learning-list,.dar-list,.menu-list,.stack,.items")||blocks[j];
      }
    }
    return null;
  }
  /* MEHR_DUPLICATE_FRAUEN_ROW_REMOVED_V1
   * Frauen im Islam is already a featureCatalog tile in the upper learning grid.
   * Do not inject a second bottom entry. Retain routing and click handling. */
  function injectEntry(){
    document.querySelectorAll("["+ENTRY_ATTR+"]").forEach(function(entry){entry.remove()});
  }

  function scheduleEntry(){
    if(entryScheduled)return;
    entryScheduled=true;
    var done=function(){entryScheduled=false;try{injectEntry()}catch(e){}};
    if(typeof requestAnimationFrame==="function")requestAnimationFrame(done);else setTimeout(done,20);
  }
  function hookRender(){
    if(typeof global.render!=="function"||global.render.__darFrauenProductionBridge)return;
    var base=global.render;
    var wrapped=function(){
      if(isFrauen())return paint();
      cleanup();
      var out=base.apply(this,arguments);
      scheduleEntry();
      return out;
    };
    wrapped.__darFrauenProductionBridge=true;
    wrapped.__darFrauenBase=base;
    global.render=wrapped;
  }
  function boot(){
    ensureBridgeStyle();
    hookRender();
    if(isFrauen())paint();else scheduleEntry();
    if(!hookTimer){
      var tries=0;
      hookTimer=setInterval(function(){
        tries++;
        hookRender();
        if(isFrauen())paint();else scheduleEntry();
        if((global.render&&global.render.__darFrauenProductionBridge)||tries>80){clearInterval(hookTimer);hookTimer=0}
      },100);
    }
  }

  document.addEventListener("click",function(ev){
    var el=ev.target&&ev.target.closest?ev.target.closest('[data-nav="frauen"]'):null;
    if(!el)return;
    ev.preventDefault();
    ev.stopPropagation();
    if(typeof ev.stopImmediatePropagation==="function")ev.stopImmediatePropagation();
    go(el.getAttribute("data-value")||"");
  },true);
  global.addEventListener("hashchange",function(){hookRender();if(isFrauen())setTimeout(paint,0);else{cleanup();scheduleEntry()}});
  global.addEventListener("pageshow",boot);
  global.addEventListener("dar:live-sync-done",function(){
    if(!isFrauen())return;
    try{
      if(global.DARFrauenFiqh&&typeof global.DARFrauenFiqh.reload==="function"){
        global.DARFrauenFiqh.reload().then(function(){paint()}).catch(function(){paint()});
        return;
      }
    }catch(e){}
    paint();
  });
  document.addEventListener("dar:render",function(){hookRender();if(isFrauen())paint();else scheduleEntry()});
  if(document.documentElement){
    new MutationObserver(function(){if(isFrauen())return;scheduleEntry()}).observe(document.documentElement,{childList:true,subtree:true});
  }
  global.DAROpenFrauen=function(value){go(value||"")};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
})(window);
