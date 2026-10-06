(function(global){
  "use strict";
  var ENTRY_ATTR="data-dar-frauen-live-entry";
  var hookTimer=0,entryScheduled=false,painting=false;

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
      app.innerHTML='<div class="dar-frauen-production-root" data-frauen-production="1">'+womenHtml(r.value)+'</div>';
      if(global.DARFrauenFiqh&&typeof global.DARFrauenFiqh.bind==="function")global.DARFrauenFiqh.bind();
      try{app.scrollTop=0}catch(e){}
      try{global.scrollTo(0,0)}catch(e){}
      try{document.dispatchEvent(new CustomEvent("dar:frauen-render",{detail:{value:r.value||""}}))}catch(e){}
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
  function injectEntry(){
    if(isFrauen())return;
    if(document.querySelector("["+ENTRY_ATTR+"]"))return;
    var body=document.body,h=String(location.hash||"");
    if(!(body&&body.classList.contains("is-more-route"))&&h.indexOf("#more")!==0)return;
    var target=learningTarget();
    if(!target)return;
    var btn=document.createElement("button");
    btn.type="button";
    btn.className="more-feature-row dar-frauen-live-entry";
    btn.setAttribute(ENTRY_ATTR,"1");
    btn.setAttribute("data-nav","frauen");
    btn.setAttribute("data-feature-search","frauen islam fiqh sahabiyyat wissen familie reinigung gebet fasten");
    btn.setAttribute("aria-label","Frauen im Islam öffnen");
    btn.innerHTML=
      '<span class="feature-icon more-feature-row__icon" aria-hidden="true"><img class="dar3d-icon" src="/assets/dar-3d-icons/frauen.png" alt=""></span>'+
      '<span class="dar-frauen-live-entry__body"><h4>Frauen im Islam <span class="feature-badge">Wissen</span></h4><p>Fiqh · Ṣaḥābiyyāt · Familie · Pflichtwissen</p></span>'+
      '<span aria-hidden="true">›</span>';
    var prophet=target.querySelector('.more-feature-row[data-nav="propheten"]');
    if(prophet&&prophet.nextSibling)target.insertBefore(btn,prophet.nextSibling);
    else target.appendChild(btn);
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
  document.addEventListener("dar:render",function(){hookRender();if(isFrauen())paint();else scheduleEntry()});
  if(document.documentElement){
    new MutationObserver(function(){if(isFrauen())return;scheduleEntry()}).observe(document.documentElement,{childList:true,subtree:true});
  }
  global.DAROpenFrauen=function(value){go(value||"")};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
})(window);
