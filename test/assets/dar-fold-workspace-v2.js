/* DĀR TEST — Fold Workspace V2 | single Test-only layout owner.
   Original SPA is the source of truth; a same-origin reader gets its own responsive viewport.
   No main-app, Kids, push, or content changes. ?darFoldV2=0 disables this experiment. */
(function (win, doc) {
  "use strict";
  if (win.__DAR_TEST_FOLD_WORKSPACE_V2) return;
  win.__DAR_TEST_FOLD_WORKSPACE_V2 = true;
  var params = new URLSearchParams(win.location.search);
  var embedded = params.get("darFoldPane") === "reader";
  var disabled = params.get("darFoldV2") === "0";
  var root = doc.documentElement;
  var CATEGORIES = [
    ["home", "#home", "Startseite"],
    ["quran", "#quran", "Qurʾān"],
    ["hadith", "#hadith", "Ḥadīṯ"],
    ["bibliothek", "#bibliothek", "Bibliothek"],
    ["themen", "#themen", "Themen"],
    ["dua", "#duas", "Duʿāʾ"],
    ["more", "#more", "Mehr"]
  ];
  if (embedded) {
    root.classList.add("dar-fold-v2-reader");
    var tell = function () {
      if (win.parent === win) return;
      try { win.parent.postMessage({type:"dar-fold-v2-route", hash:win.location.hash || "#home"}, win.location.origin); } catch (_) {}
    };
    win.addEventListener("hashchange", tell);
    win.addEventListener("pageshow", tell);
    doc.addEventListener("pointerdown", function () {
      if (win.parent !== win) try {win.parent.postMessage({type:"dar-fold-v2-focus"},win.location.origin);}catch(_){}
    }, {passive:true});
    return;
  }
  if (disabled || !/^\/test(?:\/|$)/.test(win.location.pathname)) return;

  var nav, frame, topbar, source, list, filter, contextTitle, active = false, raf = 0;
  var lastItems = "", lastContextEls = [], lastHash = "", lastWidth = 0, lastHeight = 0, resizeObserver, sourceObserver;
  var scrollByCategory = Object.create(null);
  var selectedCategory = "home";
  function viewport() {
    var w = Math.round(root.clientWidth || win.innerWidth || 0);
    var h = Math.round(root.clientHeight || win.innerHeight || 0);
    return {width:w,height:h};
  }
  function capacity(w,h) {
    var rail = Math.min(288,Math.max(184,Math.round(w*.265)));
    var pane = Math.max(0,w-rail);
    return {rail:rail,pane:pane,dual:w>=640 && h>=470 && pane>=390};
  }
  function category(hash) {
    hash=String(hash||"#home").toLowerCase();
    if (/^#quran/.test(hash)) return "quran";
    if (/^#hadith/.test(hash)) return "hadith";
    if (/^#(?:bibliothek|library|book|buecher)/.test(hash)) return "bibliothek";
    if (/^#(?:themen|topics|topic)/.test(hash)) return "themen";
    if (/^#(?:duas|dua)/.test(hash)) return "dua";
    if (/^#(?:more|mehr|settings|profile|prophet|propheten|frauen|zakat|qibla)/.test(hash)) return "more";
    return "home";
  }
  function make(tag, cls, label) {
    var el=doc.createElement(tag);
    if(cls)el.className=cls;
    if(label!=null)el.textContent=label;
    return el;
  }
  function createShell() {
    if (nav) return;
    topbar=make("header","dar-fold-v2-topbar");
    topbar.id="darFoldV2Topbar";
    var mark=make("span","dar-fold-v2-logo","DĀR AL TAWḤĪD");
    var hint=make("span","dar-fold-v2-hint","SMART READER · TEST");
    topbar.append(mark,hint);
    nav=make("aside","dar-fold-v2-rail");nav.id="darFoldV2Rail";
    nav.setAttribute("aria-label","Auswahl und Navigation");
    var intro=make("div","dar-fold-v2-intro");
    intro.append(make("div","dar-fold-v2-eyebrow","ENTDECKEN"),make("h2","dar-fold-v2-title","Wähle einen Bereich"));
    nav.appendChild(intro);
    var choices=make("nav","dar-fold-v2-categories");
    choices.setAttribute("aria-label","App-Bereiche");
    CATEGORIES.forEach(function (entry) {
      var b=make("button","dar-fold-v2-category",entry[2]);b.type="button";
      b.dataset.foldCategory=entry[0];
      b.addEventListener("click",function(){
        if(selectedCategory!==entry[0] && nav) scrollByCategory[selectedCategory]=nav.scrollTop;
        win.location.hash=entry[1];
        if(win.location.hash===entry[1]) onRoute();
      });
      choices.appendChild(b);
    });
    nav.appendChild(choices);
    var searchWrap=make("div","dar-fold-v2-search-wrap");
    filter=make("input","dar-fold-v2-search");
    filter.type="search";filter.autocomplete="off";filter.placeholder="In dieser Kategorie suchen";
    filter.setAttribute("aria-label","Auswahl durchsuchen");
    filter.addEventListener("input",function(){renderContext();});
    searchWrap.appendChild(filter);nav.appendChild(searchWrap);
    contextTitle=make("h3","dar-fold-v2-section","Auswahl");
    nav.appendChild(contextTitle);
    list=make("div","dar-fold-v2-options");nav.appendChild(list);
    frame=make("iframe","dar-fold-v2-frame");frame.id="darFoldV2Frame";
    frame.title="DĀR AL TAWḤĪD – unabhängiger Lesebereich";
    frame.loading="eager";frame.setAttribute("referrerpolicy","same-origin");
    frame.addEventListener("load",syncFrame);
    var u=new URL(win.location.href);
    u.searchParams.set("darFoldPane","reader");
    u.searchParams.set("darFoldV2","0");
    u.hash=win.location.hash||"#home";
    frame.src=u.toString();
    doc.body.append(topbar,nav,frame);
  }
  function discover() {
    var view=doc.getElementById("appView");
    if(view!==source) {
      if(sourceObserver)sourceObserver.disconnect();
      source=view;
      if(source && typeof MutationObserver==="function") {
        sourceObserver=new MutationObserver(scheduleContext);
        sourceObserver.observe(source,{childList:true,subtree:true});
      }
    }
    return source;
  }
  function candidates() {
    var view=discover(); if(!view)return [];
    var links=Array.from(view.querySelectorAll(
      "[data-nav],[data-library-open],[data-qsrc-open],a[href^='#'],.quran-surah-card,.dua-card,.lib-card,.post-card,.qsrc-card,button"
    ));
    var seen=new Set(), result=[];
    links.forEach(function(el){
      if(result.length>=160||el.closest("#darFoldV2Rail"))return;
      var text=String(el.getAttribute("aria-label")||el.innerText||el.textContent||"").replace(/\s+/g," ").trim();
      if(text.length<3||text.length>110)return;
      var hash=el.getAttribute("href")||"";
      if(hash && (!hash.startsWith("#") || hash.length>170)) return;
      var target=(hash||el.dataset.nav||el.dataset.libraryOpen||el.dataset.qsrcOpen||"").toLowerCase();
      if(hash && category(hash)!==selectedCategory && category(hash)!=="home")return;
      if(selectedCategory==="quran" && target && !/quran|surah|ayah|sure|vers/.test(target) && !/quran-surah/.test(el.className||""))return;
      var key=(target||text).slice(0,180);
      if(seen.has(key))return;seen.add(key);
      result.push({text:text,el:el,key:key});
    });
    return result;
  }
  function renderContext() {
    if(!active || !list)return;
    var items=candidates(), query=(filter.value||"").trim().toLocaleLowerCase();
    var shown=items.filter(function(x){return x.text.toLocaleLowerCase().includes(query);}).slice(0,90);
    var signature=selectedCategory+"|"+query+"|"+shown.map(function(x){return x.key+"="+x.text;}).join(";");
    if(signature===lastItems && shown.length===lastContextEls.length && shown.every(function(x,i){return x.el===lastContextEls[i];}))return;
    lastItems=signature;lastContextEls=shown.map(function(x){return x.el;});
    var fragment=doc.createDocumentFragment();
    shown.forEach(function(item){
      var b=make("button","dar-fold-v2-option",item.text);b.type="button";
      b.addEventListener("click",function(){
        var el=item.el;
        if(!el.isConnected){lastItems="";renderContext();return;}
        // The visible right frame owns real interactions. Trigger its matching
        // route/card control first, including route-local dialogs and reader UI.
        // The hidden source is a metadata fallback, never the primary action.
        var clicked=false;
        try {
          var child=frame && frame.contentDocument;
          if(child){
            var matches=Array.from(child.querySelectorAll(
              "[data-nav],[data-library-open],[data-qsrc-open],a[href^='#'],.quran-surah-card,.dua-card,.lib-card,.post-card,.qsrc-card,button"
            ));
            var wanted=String(item.text).replace(/\s+/g," ").trim();
            var match=matches.find(function(node){
              var label=String(node.getAttribute("aria-label")||node.innerText||node.textContent||"").replace(/\s+/g," ").trim();
              var route=node.getAttribute("href")||node.dataset.nav||node.dataset.libraryOpen||node.dataset.qsrcOpen||"";
              return label===wanted && (route===item.key || (!route && item.key===wanted.slice(0,180)));
            });
            if(match && !match.disabled){match.click();clicked=true;}
          }
        }catch(_){}
        if(!clicked){
          try{el.click();}catch(_){}
          var href=el.getAttribute("href");
          if(href && href.startsWith("#"))win.location.hash=href;
        }
        onRoute();
      });
      fragment.appendChild(b);
    });
    if(!shown.length)fragment.appendChild(make("p","dar-fold-v2-empty",query?"Keine passenden Einträge":"Inhalt rechts auswählen oder Bereich öffnen"));
    list.replaceChildren(fragment);
  }
  var contextRaf=0;
  function scheduleContext(){
    if(contextRaf || !active)return;
    contextRaf=win.requestAnimationFrame(function(){contextRaf=0;renderContext();});
  }
  function syncFrame(){
    if(!frame||!frame.isConnected)return;
    try{
      if(frame.contentWindow && frame.contentWindow.location.hash!==(win.location.hash||"#home"))
        frame.contentWindow.location.hash=win.location.hash||"#home";
    }catch(_){}
  }
  function onRoute(){
    var hash=win.location.hash||"#home", cat=category(hash);
    if(lastHash===hash && active){scheduleContext();return;}
    lastHash=hash;
    if(nav && selectedCategory!==cat){
      scrollByCategory[selectedCategory]=nav.scrollTop;
      selectedCategory=cat;
      if(filter) filter.value="";
      lastItems="";
      nav.scrollTop=scrollByCategory[cat]||0;
    }
    if(nav)nav.querySelectorAll("[data-fold-category]").forEach(function(b){
      var current=b.dataset.foldCategory===cat;
      b.classList.toggle("is-selected",current);
      if(current)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current");
    });
    if(contextTitle)contextTitle.textContent=CATEGORIES.find(function(x){return x[0]===cat;})?.[2]||"Auswahl";
    syncFrame();scheduleContext();
  }
  function apply() {
    if(!doc.body||!doc.getElementById("appView"))return false;
    var m=viewport(),c=capacity(m.width,m.height);
    if(!c.dual){
      if(active){
        active=false;root.classList.remove("dar-fold-v2-active");
        if(nav)nav.hidden=true;if(frame)frame.hidden=true;if(topbar)topbar.hidden=true;
      }
      return false;
    }
    createShell();discover();
    root.style.setProperty("--dar-fold-v2-rail",c.rail+"px");
    if(!active){
      active=true;root.classList.add("dar-fold-v2-active");
      nav.hidden=false;frame.hidden=false;topbar.hidden=false;
      lastHash="";lastItems="";onRoute();
    } else if(lastWidth!==m.width || lastHeight!==m.height) {
      scheduleContext();
    }
    lastWidth=m.width;lastHeight=m.height;
    return true;
  }
  function schedule(){
    if(raf)return;raf=win.requestAnimationFrame(function(){raf=0;apply();});
  }
  function start(){
    apply();
    win.addEventListener("resize",schedule,{passive:true});
    win.addEventListener("orientationchange",schedule,{passive:true});
    win.addEventListener("pageshow",schedule,{passive:true});
    win.addEventListener("hashchange",onRoute);
    win.addEventListener("message",function(ev){
      if(!frame || ev.origin!==win.location.origin || ev.source!==frame.contentWindow)return;
      if(ev.data && ev.data.type==="dar-fold-v2-route"){
        var h=String(ev.data.hash||"");
        if(h.startsWith("#")&&h.length<=170 && h!==win.location.hash)win.location.hash=h;
      }
    });
    if(typeof ResizeObserver==="function"){
      resizeObserver=new ResizeObserver(schedule);
      resizeObserver.observe(doc.documentElement);
    }
    if(win.visualViewport)win.visualViewport.addEventListener("resize",schedule,{passive:true});
    if(typeof MutationObserver==="function"){
      new MutationObserver(function(){if(!source) schedule();}).observe(doc.body,{childList:true});
    }
  }
  win.DARTestFoldV2={
    measure:viewport,capacity:capacity,apply:apply,
    audit:function(){
      var m=viewport(),c=capacity(m.width,m.height);
      var box=function(e){if(!e)return null;var r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,scrollTop:e.scrollTop,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight};};
      return {version:"20261101-v2",active:active,viewport:m,capacity:c,rail:box(nav),reader:box(frame),route:win.location.hash||"#home"};
    }
  };
  if(doc.readyState==="loading")doc.addEventListener("DOMContentLoaded",start,{once:true});else start();
})(window,document);
