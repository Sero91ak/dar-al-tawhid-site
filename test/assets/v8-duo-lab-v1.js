/* DĀR AL TAWḤĪD · V8 DUO LAB · isolated DAR TEST only · 2026-10-22
   Uses the existing SPA routes, bottom-nav controls, language-picker, themes,
   account and player. Never duplicates a live engine or changes local preferences.
   Remove the two script/style references to disable the entire redesign. */
(function (w,d) {
  "use strict";
  if (!/^\/test(?:\/|$)/.test(w.location.pathname)) return;
  if (w.__DAR_V8_DUO_LAB_V1) return;
  w.__DAR_V8_DUO_LAB_V1 = true;
  var root=d.documentElement, rail=null, topActions=null, navObserver=null, frame=0;
  var lastSignature="", lastSettings=null;
  function dom(tag,cls,txt) {
    var e=d.createElement(tag);
    if(cls)e.className=cls;
    if(txt!=null)e.textContent=txt;
    return e;
  }
  function metrics() {
    var vw=Math.round(root.clientWidth||w.innerWidth||0);
    var vh=Math.round(root.clientHeight||w.innerHeight||0);
    var vv=w.visualViewport;
    var focus=d.activeElement, input=focus&&(/^(INPUT|TEXTAREA|SELECT)$/.test(focus.tagName||"")||focus.isContentEditable);
    return {w:vw,h:vh,keyboard:!!(vv&&input&&vh-vv.height>140)};
  }
  function expanded() {
    var m=metrics();
    // Size/capacity, not a hard-coded device model, fold sensor or user-agent.
    // Allow 240px for a master list and 360px minimum for a reader.
    return m.w>=760 && m.h>=560 && m.w-88-240-14-28>=360 && !m.keyboard;
  }
  function ensureRail() {
    if(rail&&rail.isConnected)return rail;
    rail=dom("nav","dar-v8-duo-rail");
    rail.id="darV8DuoRail";
    rail.setAttribute("aria-label","Großbildschirm-Navigation");
    var head=dom("div","dar-v8-duo-rail-head");
    var mark=dom("span","dar-v8-duo-rail-mark","د");
    mark.setAttribute("aria-hidden","true");
    head.append(mark,dom("span","dar-v8-duo-rail-name","DĀR"));
    var links=dom("div","dar-v8-duo-rail-links");
    links.id="darV8DuoRailLinks";
    rail.append(head,links);
    d.body.appendChild(rail);
    rail.addEventListener("click",function(event){
      var btn=event.target.closest("[data-v8-target]");
      if(!btn)return;
      var nav=d.getElementById("bottomNav");
      var src=nav&&Array.prototype.find.call(nav.querySelectorAll("button[data-bottom-nav]"),function(x){
        return x.getAttribute("data-bottom-nav")===btn.getAttribute("data-v8-target");
      });
      if(src&&!src.disabled)src.click();
    });
    return rail;
  }
  function syncLinks() {
    if(!rail||!rail.isConnected)return;
    var nav=d.getElementById("bottomNav");
    if(!nav)return;
    var sources=Array.prototype.slice.call(nav.querySelectorAll("button[data-bottom-nav]"));
    var signature=sources.map(function(x){return x.getAttribute("data-bottom-nav")||"";}).join("|");
    var host=d.getElementById("darV8DuoRailLinks");
    if(!host)return;
    if(signature!==lastSignature) {
      lastSignature=signature;
      host.replaceChildren();
      sources.forEach(function(src){
        var btn=dom("button","dar-v8-duo-tab");
        btn.type="button";
        btn.setAttribute("data-v8-target",src.getAttribute("data-bottom-nav")||"");
        btn.setAttribute("aria-label",src.getAttribute("aria-label")||src.textContent.trim());
        var icon=src.querySelector(".nav-icon");
        if(icon)btn.appendChild(icon.cloneNode(true));
        btn.appendChild(dom("span","dar-v8-duo-tab-label",src.querySelector("span:last-child")?.textContent||src.textContent.trim()));
        host.appendChild(btn);
      });
    }
    sources.forEach(function(src){
      var key=src.getAttribute("data-bottom-nav");
      var button=Array.prototype.find.call(host.querySelectorAll("[data-v8-target]"),function(x){
        return x.getAttribute("data-v8-target")===key;
      });
      if(!button)return;
      var active=src.classList.contains("active")||src.classList.contains("is-active")||
        src.getAttribute("aria-current")==="page"||src.getAttribute("aria-selected")==="true";
      button.classList.toggle("is-active",active);
      if(active)button.setAttribute("aria-current","page");
      else button.removeAttribute("aria-current");
      button.disabled=src.disabled;
    });
    if(!navObserver&&w.MutationObserver) {
      navObserver=new MutationObserver(schedule);
      navObserver.observe(nav,{childList:true,subtree:true,attributes:true,attributeFilter:["class","aria-current","aria-selected","disabled"]});
    }
  }
  function ensureQuickAccess() {
    var row=d.querySelector(".top-shell .header-row--brand-only");
    if(!row)return;
    if(topActions&&!topActions.isConnected)topActions=null;
    if(topActions)return;
    topActions=dom("div","dar-v8-quick-actions");
    topActions.id="darV8QuickActions";
    var items=[
      ["language","🌐","Sprachauswahl öffnen"],
      ["account","♙","Konto öffnen"],
      ["appearance","◉","Farben und Erscheinungsbild öffnen"]
    ];
    items.forEach(function(a){
      var b=dom("button","dar-v8-quick-btn",a[1]);
      b.type="button";b.dataset.v8Quick=a[0];b.setAttribute("aria-label",a[2]);
      b.title=a[2];topActions.appendChild(b);
    });
    row.appendChild(topActions);
    topActions.addEventListener("click",function(event){
      var b=event.target.closest("[data-v8-quick]");
      if(!b)return;
      var action=b.getAttribute("data-v8-quick");
      if(action==="language"){
        var picker=w.DARAdultLanguagePickerV1;
        if(picker&&typeof picker.open==="function")picker.open("quick",b);
      } else {
        // Reuse the original SPA router, not an unbound synthetic button.
        var route=action==="account"?"account":"settings";
        var value=action==="appearance"?"appearance":"";
        if(typeof w.navigate==="function")w.navigate(route,value);
        else w.location.hash="#"+route+(value?"/"+value:"");
      }
    });
  }
  function enhanceSettings() {
    if(!d.body.classList.contains("is-settings-route"))return;
    var home=d.querySelector("#appView .dsh-shell.dsh-home");
    if(!home||home===lastSettings)return;
    lastSettings=home;
    var group=dom("section","dsh-group dar-v8-language-group");
    var header=dom("div","dsh-group-head"),label=dom("span","","Sprache & Region");
    header.appendChild(label);
    var list=dom("div","dsh-list dar-v8-language-list");
    var host=dom("div","dar-v8-language-host");
    host.setAttribute("data-dar-language-entry","settings");
    list.appendChild(host);
    var note=dom("p","dar-v8-locale-note","Neun Sprachen im Katalog. Nur tatsächlich verfügbare Sprachpakete sind auswählbar.");
    group.append(header,list,note);
    var info=home.querySelector(".dsh-note");
    if(info)home.insertBefore(group,info);else home.appendChild(group);
    var picker=w.DARAdultLanguagePickerV1;
    if(picker&&typeof picker.refresh==="function")picker.refresh();
    // Original settings navigation/theme/font/icon panels remain authoritative.
  }
  function apply() {
    frame=0;
    if(!d.body)return;
    ensureQuickAccess();
    enhanceSettings();
    var nav=d.getElementById("bottomNav");
    var use=!!nav&&expanded();
    root.classList.toggle("dar-v8-duo-open",use);
    root.setAttribute("data-v8-duo-stage",use?"expanded":"compact");
    if(use) {
      ensureRail();
      syncLinks();
    }
    if(rail)rail.hidden=!use;
  }
  function schedule() {
    if(frame)return;
    frame=w.requestAnimationFrame(apply);
  }
  function boot() {
    schedule();
    var app=d.getElementById("appView");
    if(app&&w.MutationObserver) {
      var observer=new MutationObserver(schedule);
      observer.observe(app,{childList:true,subtree:false});
    }
    w.addEventListener("resize",schedule,{passive:true});
    w.addEventListener("hashchange",schedule,{passive:true});
    w.addEventListener("dar:layoutchange",schedule,{passive:true});
    d.addEventListener("dar:view-rendered",schedule);
    if(w.visualViewport)w.visualViewport.addEventListener("resize",schedule,{passive:true});
  }
  w.DarV8DuoLab=Object.freeze({refresh:schedule,mode:function(){return expanded()?"expanded":"compact";}});
  if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})(window,document);
