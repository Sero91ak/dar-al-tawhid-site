/* DĀR TEST · 50/50 Fold / Tablet workspace · 2026-11-01
 * Two real, fixed, independently scrollable work surfaces:
 * left = navigation + contextual chooser; right = the original #appView SPA.
 * No iframe, duplicated application, cross-origin content, modification to
 * visitor/KIDS, or second bottom-navigation node.
 * Use ?duo=0 to revert this Test-only experiment without changing data.
 */
(function (global) {
  "use strict";
  var doc=global.document;
  if(!doc || !/^\/test(?:\/|$)/.test(String(global.location && global.location.pathname||"")))return;
  if(global.__DAR_TEST_DUO_WORKSPACE_V4)return;
  global.__DAR_TEST_DUO_WORKSPACE_V4=true;

  var root=doc.documentElement, NAV=[
    ["home","#home"],["quran","#quran"],["hadith","#hadith"],
    ["library","#bibliothek"],["topics","#themen"],["dua","#duas"],["more","#more"]
  ];
  var words={
    de:{choose:"Auswählen",read:"Lesen",home:"Start",quran:"Qurʾān",hadith:"Ḥadīṯ",library:"Bibliothek",topics:"Themen",dua:"Duʿāʾ",more:"Mehr",test:"TEST · 50 / 50"},
    ar:{choose:"اختيار",read:"قراءة",home:"الرئيسية",quran:"القرآن",hadith:"الحديث",library:"المكتبة",topics:"المواضيع",dua:"الدعاء",more:"المزيد",test:"اختبار · ٥٠ / ٥٠"},
    en:{choose:"Select",read:"Read",home:"Home",quran:"Qurʾān",hadith:"Ḥadīth",library:"Library",topics:"Topics",dua:"Duʿāʾ",more:"More",test:"TEST · 50 / 50"},
    tr:{choose:"Seç",read:"Oku",home:"Ana sayfa",quran:"Kurʾân",hadith:"Hadis",library:"Kütüphane",topics:"Konular",dua:"Duâ",more:"Diğer",test:"TEST · 50 / 50"},
    ku:{choose:"Hilbijêre",read:"Bixwîne",home:"Destpêk",quran:"Qurʾan",hadith:"Hedîs",library:"Pirtûkxane",topics:"Mijar",dua:"Duʿa",more:"Zêdetir",test:"TEST · 50 / 50"},
    ckb:{choose:"هەڵبژێرە",read:"بخوێنەوە",home:"سەرەکی",quran:"قورئان",hadith:"حەدیس",library:"کتێبخانە",topics:"بابەتەکان",dua:"دوعا",more:"زیاتر",test:"تاقیکردنەوە · ٥٠ / ٥٠"},
    bs:{choose:"Odaberi",read:"Čitaj",home:"Početna",quran:"Kurʾan",hadith:"Hadis",library:"Biblioteka",topics:"Teme",dua:"Dova",more:"Više",test:"TEST · 50 / 50"},
    fr:{choose:"Choisir",read:"Lire",home:"Accueil",quran:"Coran",hadith:"Ḥadith",library:"Bibliothèque",topics:"Sujets",dua:"Duʿāʾ",more:"Plus",test:"TEST · 50 / 50"},
    es:{choose:"Elegir",read:"Leer",home:"Inicio",quran:"Corán",hadith:"Hadiz",library:"Biblioteca",topics:"Temas",dua:"Duʿāʾ",more:"Más",test:"TEST · 50 / 50"}
  };
  var left=null, view=null, bottom=null, active=false, started=false, frame=0;
  var savedView=null,savedBottom=null,lastHash="",lastLang="",lastContext="";
  var contextHistory=Object.create(null),timer=0,layoutObserver=null;
  var geometryObserver=null,observedView=null,observedDock=null;
  var viewProps=["position","top","bottom","left","right","width","min-width","max-width","height","max-height",
    "margin","margin-left","margin-right","overflow","overflow-x","overflow-y","transform","translate",
    "z-index","box-sizing","overscroll-behavior-y","touch-action"];
  var bottomProps=["position","left","right","width","max-width","min-width","margin","margin-left","margin-right","transform","translate"];
  function language(){
    var l="";
    try {l=String(global.localStorage.getItem("darAdultPreferredLocaleV1")||"");} catch(_){}
    if(!l)l=String(root.lang||"de");
    l=l.toLowerCase().split(/[-_]/)[0];
    return words[l]?l:"de";
  }
  function dict(){return words[language()]||words.de;}
  function viewport(){
    return {width:Math.round(root.clientWidth||global.innerWidth||0),
      height:Math.round(global.innerHeight||(global.visualViewport&&global.visualViewport.height)||root.clientHeight||0)};
  }
  function capacity(w,h){
    w=Math.max(0,Number(w)||0);h=Math.max(0,Number(h)||0);
    // Each half must be a usable touch/reading surface. Galaxy Fold open:
    // 726 x 512 => exactly 363 + 363, with 0px column overlap.
    return {dual:w>=680&&h>=480&&w/2>=320,rail:w/2,reader:w/2,gap:0};
  }
  function disabled(){
    try{return new URLSearchParams(global.location.search||"").get("duo")==="0";}catch(_){return false;}
  }
  function blocked(){
    return !!(doc.body && (doc.body.classList.contains("is-feed-fullscreen") ||
      doc.body.classList.contains("is-ilm-chat-route")));
  }
  function family(hash){
    var h=String(hash||"").toLowerCase();
    if(h.indexOf("#quran")===0)return "quran";
    if(h.indexOf("#hadith")===0)return "hadith";
    if(h.indexOf("#bibliothek")===0||h.indexOf("#library")===0)return "library";
    if(h.indexOf("#themen")===0||h.indexOf("#topic")===0||h.indexOf("#post")===0)return "topics";
    if(h.indexOf("#dua")===0)return "dua";
    if(h.indexOf("#more")===0)return "more";
    return "home";
  }
  function saveStyles(el,props){
    var copy=Object.create(null);
    props.forEach(function(p){copy[p]=[el.style.getPropertyValue(p),el.style.getPropertyPriority(p)];});
    return copy;
  }
  function restoreStyles(el,copy,props){
    if(!el||!copy)return;
    props.forEach(function(p){
      if(copy[p][0])el.style.setProperty(p,copy[p][0],copy[p][1]);
      else el.style.removeProperty(p);
    });
  }
  function set(el,p,v){
    if(el.style.getPropertyValue(p)!==v||el.style.getPropertyPriority(p)!=="important")
      el.style.setProperty(p,v,"important");
  }
  function make(tag,cls,text){
    var el=doc.createElement(tag);
    if(cls)el.className=cls;
    if(text!=null)el.textContent=text;
    return el;
  }
  function ensureLeft(){
    if(left&&left.isConnected)return;
    left=doc.getElementById("darTestDuoWorkspaceNav");
    if(left)return;
    left=make("nav","dar-test-duo-workspace-nav");
    left.id="darTestDuoWorkspaceNav";
    left.setAttribute("aria-label",dict().choose);
    left.setAttribute("data-duo-pane","master");
    left.appendChild(make("div","dar-test-duo-brand","DĀR AL TAWḤĪD"));
    var subtitle=make("div","dar-test-duo-caption");subtitle.id="darTestDuoCaption";left.appendChild(subtitle);
    var legend=make("div","dar-test-duo-legend");legend.id="darTestDuoLegend";left.appendChild(legend);
    var routes=make("div","dar-test-duo-links");routes.id="darTestDuoLinks";
    NAV.forEach(function(item){
      var a=make("a","dar-test-duo-link");
      a.href=item[1];
      a.setAttribute("data-duo-route",item[0]);
      routes.appendChild(a);
    });
    left.appendChild(routes);
    var context=make("section","dar-test-duo-context");
    context.id="darTestDuoContext";
    context.setAttribute("aria-label",dict().choose);
    context.hidden=true;
    left.appendChild(context);
    doc.body.appendChild(left);
    updateLabels();
  }
  function updateLabels(){
    if(!left)return;
    var t=dict();left.setAttribute("aria-label",t.choose);
    left.querySelector("#darTestDuoCaption").textContent=t.test;
    left.querySelector("#darTestDuoLegend").textContent=t.choose+"  /  "+t.read;
    NAV.forEach(function(pair){
      var a=left.querySelector('[data-duo-route="'+pair[0]+'"]');if(a)a.textContent=t[pair[0]];
    });
    lastLang=language();lastContext="";
  }
  function collectContext(){
    if(!view || !view.isConnected)return;
    var current=family(global.location.hash);
    var list=[],seen=Object.create(null);
    var nodes=view.querySelectorAll('a[href^="#"]');
    for(var i=0;i<nodes.length&&list.length<35;i++){
      var a=nodes[i],hash=a.getAttribute("href")||"";
      if(!/^#[\w/\-:]{2,150}$/.test(hash)||family(hash)!==current||seen[hash])continue;
      var title=String(a.textContent||"").replace(/\s+/g," ").trim();
      if(title.length<3||title.length>95)continue;
      seen[hash]=true;list.push({hash:hash,title:title});
    }
    if(list.length>=3)contextHistory[current]=list;
    var entries=contextHistory[current]||list;
    var sig=current+"|"+entries.map(function(e){return e.hash;}).join("|")+"|"+language();
    if(sig!==lastContext){
      lastContext=sig;
      var box=left&&left.querySelector("#darTestDuoContext");
      if(!box)return;
      box.replaceChildren();
      if(entries.length){
        box.appendChild(make("h2","dar-test-duo-context-title",dict()[current]||current));
        var section=make("div","dar-test-duo-context-links");
        entries.forEach(function(entry){
          var a=make("a","dar-test-duo-context-link",entry.title);
          a.href=entry.hash;section.appendChild(a);
        });
        box.appendChild(section);
      }
      box.hidden=!entries.length;
    }
  }
  function focusPane(which){
    if(!active)return;
    root.setAttribute("data-dar-duo-focus",which);
  }
  function updateSelection(){
    if(!left)return;
    var key=family(global.location.hash);
    NAV.forEach(function(item){
      var a=left.querySelector('[data-duo-route="'+item[0]+'"]');
      if(!a)return;
      var selected=item[0]===key;
      a.classList.toggle("is-current",selected);
      if(selected)a.setAttribute("aria-current","page");
      else a.removeAttribute("aria-current");
    });
    collectContext();
    left.querySelectorAll(".dar-test-duo-context-link").forEach(function(a){
      var selected=a.getAttribute("href")===global.location.hash;
      a.classList.toggle("is-current",selected);
      if(selected)a.setAttribute("aria-current","page");
      else a.removeAttribute("aria-current");
    });
  }
  function headerOffset(){
    // Real iOS/Android Fold screenshot: #appView begins just below header.
    // Snapshot before moving the SPA into the fixed detail surface.
    if(view&&!active){
      var y=Math.round(view.getBoundingClientRect().top+(global.scrollY||0));
      if(y>=30&&y<=100)return y;
    }
    return 52;
  }
  function observeGeometry(){
    if(typeof MutationObserver!=="function")return;
    if(!geometryObserver)geometryObserver=new MutationObserver(function(){
      if(active)schedule();
    });
    if(view && observedView!==view){
      geometryObserver.observe(view,{attributes:true,attributeFilter:["style"]});
      observedView=view;
    }
    if(bottom && observedDock!==bottom){
      geometryObserver.observe(bottom,{attributes:true,attributeFilter:["style","class"]});
      observedDock=bottom;
    }
  }
  function positionView(){
    var v=doc.getElementById("appView");
    if(!v)return;
    if(view!==v){
      if(view)restoreStyles(view,savedView,viewProps);
      view=v;savedView=saveStyles(view,viewProps);
    }
    var values={
      "position":"fixed","top":"var(--dar-duo-header-height, 52px)","bottom":"0px",
      "left":"50%","right":"0px","width":"50%","min-width":"0px","max-width":"50%",
      "height":"calc(100dvh - var(--dar-duo-header-height, 52px))","max-height":"none",
      "margin":"0px","margin-left":"0px","margin-right":"0px",
      "overflow":"auto","overflow-x":"hidden","overflow-y":"auto",
      "transform":"none","translate":"none","z-index":"20","box-sizing":"border-box",
      "overscroll-behavior-y":"contain","touch-action":"pan-y"
    };
    Object.keys(values).forEach(function(p){set(view,p,values[p]);});
    view.setAttribute("data-duo-pane","detail");
    observeGeometry();
  }
  function positionBottom(){
    var v=doc.getElementById("bottomNav");
    if(!v)return;
    if(bottom!==v){
      if(bottom)restoreStyles(bottom,savedBottom,bottomProps);
      bottom=v;savedBottom=saveStyles(bottom,bottomProps);
    }
    var w=viewport().width, cap=Math.max(240,Math.min(420,Math.floor(w/2)-20));
    set(bottom,"position","fixed");
    // All controls belong to the LEFT half; the reader stays unobstructed.
    set(bottom,"left","25%");
    set(bottom,"right","auto");
    set(bottom,"width",cap+"px");
    set(bottom,"max-width",cap+"px");
    set(bottom,"min-width","0px");
    set(bottom,"margin","0px");
    set(bottom,"margin-left","0px");
    set(bottom,"margin-right","0px");
    set(bottom,"transform","translateX(-50%)");
    set(bottom,"translate","none");
    observeGeometry();
  }
  function deactivate(){
    if(!active)return;
    active=false;
    root.classList.remove("dar-test-duo-active");
    root.removeAttribute("data-dar-duo-focus");
    root.style.removeProperty("--dar-duo-header-height");
    restoreStyles(view,savedView,viewProps);
    if(view)view.removeAttribute("data-duo-pane");
    restoreStyles(bottom,savedBottom,bottomProps);
    savedView=null;savedBottom=null;view=null;bottom=null;
    if(left)left.hidden=true;
  }
  function apply(){
    if(!started)return false;
    var dim=viewport(),calc=capacity(dim.width,dim.height);
    if(!calc.dual||disabled()||blocked()||!doc.getElementById("appView")){
      deactivate();return false;
    }
    if(!active){
      root.style.setProperty("--dar-duo-header-height",headerOffset()+"px");
      active=true;
      root.classList.add("dar-test-duo-active");
      root.setAttribute("data-dar-duo-focus","left");
      if(global.scrollY)global.scrollTo(0,0);
    }
    ensureLeft();
    left.hidden=false;
    positionView();
    positionBottom();
    if(lastLang!==language())updateLabels();
    if(lastHash!==String(global.location.hash||"")){
      lastHash=String(global.location.hash||"");
      updateSelection();
    }
    return true;
  }
  function schedule(){
    if(frame)return;
    frame=global.requestAnimationFrame(function(){frame=0;apply();});
  }
  function onRoute(){
    var h=String(global.location.hash||"");
    if(view&&h!==lastHash){
      view.scrollTop=0;
      focusPane("right");
    }
    schedule();
    global.clearTimeout(timer);
    timer=global.setTimeout(function(){apply();updateSelection();},160);
  }
  function start(){
    if(started)return;
    started=true;apply();
    global.addEventListener("resize",schedule,{passive:true});
    global.addEventListener("orientationchange",schedule,{passive:true});
    global.addEventListener("hashchange",onRoute,{passive:true});
    global.addEventListener("pageshow",schedule,{passive:true});
    global.addEventListener("dar:localechange",schedule,{passive:true});
    global.addEventListener("dar:layoutchange",schedule,{passive:true});
    if(global.visualViewport)global.visualViewport.addEventListener("resize",schedule,{passive:true});
    // Listen to actual reader DOM replacement; do not query the full body
    // on every attribute/style change (avoids mutation/animation loops).
    var reader=doc.getElementById("appView");
    if(reader && typeof MutationObserver==="function"){
      layoutObserver=new MutationObserver(function(){scheduleContext();});
      layoutObserver.observe(reader,{childList:true});
    }
    doc.addEventListener("pointerdown",function(e){
      if(!active||!e.target||!e.target.closest)return;
      if(e.target.closest("#darTestDuoWorkspaceNav"))focusPane("left");
      else if(e.target.closest("#appView,#darTestReadingOverlay"))focusPane("right");
    },{passive:true,capture:true});
    doc.addEventListener("focusin",function(e){
      if(!active||!e.target||!e.target.closest)return;
      if(e.target.closest("#darTestDuoWorkspaceNav"))focusPane("left");
      else if(e.target.closest("#appView,#darTestReadingOverlay"))focusPane("right");
    },true);
    doc.addEventListener("click",function(e){
      var a=e.target&&e.target.closest&&e.target.closest("a[href^='#']");
      if(!a || !e.target.closest("#darTestDuoWorkspaceNav"))return;
      focusPane("right");
      if(view)view.scrollTop=0;
      if(global.location.hash===a.getAttribute("href")){apply();updateSelection();}
    });
    global.addEventListener("storage",schedule,{passive:true});
  }
  var contextFrame=0;
  function scheduleContext(){
    if(contextFrame)return;
    contextFrame=global.requestAnimationFrame(function(){
      contextFrame=0;
      if(active){collectContext();updateSelection();}
    });
  }
  global.DARTestDuoAdaptive={
    measure:viewport,capacity:capacity,apply:apply,
    active:function(){return active;},
    audit:function(){
      var m=viewport(),c=capacity(m.width,m.height);
      var a=left&&left.getBoundingClientRect(),b=view&&view.getBoundingClientRect();
      return {viewport:m,capacity:c,active:active,
        split:a&&b?{left:[a.left,a.width],right:[b.left,b.width]}:null,
        focusedPane:root.getAttribute("data-dar-duo-focus"),
        route:String(global.location.hash||"")};
    },
    version:"test-dual-workspace-v4-50-50",testOnly:true
  };
  if(doc.readyState==="loading")doc.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})(typeof window!=="undefined"?window:this);
