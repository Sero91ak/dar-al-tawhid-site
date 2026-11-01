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
  var qp;try{qp=new URLSearchParams(global.location.search||"");}catch(_){qp=null;}
  // The reading frame is an independent same-origin /test page whose media
  // queries receive the true pane width. Never nest the two-column controller.
  if(qp&&qp.get("duoPane")==="reader"){
    doc.documentElement.classList.add("dar-duo-reader-embedded");
    function reportRoute(){
      if(global.parent!==global)global.parent.postMessage(
        {type:"dar-test-duo-reader-route-v5",hash:String(global.location.hash||"#home")},
        global.location.origin);
    }
    global.addEventListener("hashchange",reportRoute);
    global.addEventListener("pageshow",reportRoute);
    global.addEventListener("load",reportRoute);
    return;
  }
  if(global.__DAR_TEST_DUO_WORKSPACE_V4)return;
  global.__DAR_TEST_DUO_WORKSPACE_V4=true;

  var root=doc.documentElement, NAV=[
    ["home","#home"],["quran","#quran"],["hadith","#hadith"],
    ["library","#bibliothek"],["topics","#themen"],["dua","#duas"],["more","#more"]
  ];
  var words={
    de:{choose:"Auswählen",read:"Lesen",home:"Start",quran:"Qurʾān",hadith:"Ḥadīṯ",library:"Bibliothek",topics:"Themen",dua:"Duʿāʾ",more:"Mehr",test:"SMART · AUSWAHL"},
    ar:{choose:"اختيار",read:"قراءة",home:"الرئيسية",quran:"القرآن",hadith:"الحديث",library:"المكتبة",topics:"المواضيع",dua:"الدعاء",more:"المزيد",test:"اختبار · اختيار ذكي"},
    en:{choose:"Select",read:"Read",home:"Home",quran:"Qurʾān",hadith:"Ḥadīth",library:"Library",topics:"Topics",dua:"Duʿāʾ",more:"More",test:"SMART · SELECT"},
    tr:{choose:"Seç",read:"Oku",home:"Ana sayfa",quran:"Kurʾân",hadith:"Hadis",library:"Kütüphane",topics:"Konular",dua:"Duâ",more:"Diğer",test:"AKILLI · SEÇİM"},
    ku:{choose:"Hilbijêre",read:"Bixwîne",home:"Destpêk",quran:"Qurʾan",hadith:"Hedîs",library:"Pirtûkxane",topics:"Mijar",dua:"Duʿa",more:"Zêdetir",test:"SMART · HILBIJARTIN"},
    ckb:{choose:"هەڵبژێرە",read:"بخوێنەوە",home:"سەرەکی",quran:"قورئان",hadith:"حەدیس",library:"کتێبخانە",topics:"بابەتەکان",dua:"دوعا",more:"زیاتر",test:"هەڵبژاردنی زیرەک"},
    bs:{choose:"Odaberi",read:"Čitaj",home:"Početna",quran:"Kurʾan",hadith:"Hadis",library:"Biblioteka",topics:"Teme",dua:"Dova",more:"Više",test:"SMART · ODABIR"},
    fr:{choose:"Choisir",read:"Lire",home:"Accueil",quran:"Coran",hadith:"Ḥadith",library:"Bibliothèque",topics:"Sujets",dua:"Duʿāʾ",more:"Plus",test:"SMART · CHOISIR"},
    es:{choose:"Elegir",read:"Leer",home:"Inicio",quran:"Corán",hadith:"Hadiz",library:"Biblioteca",topics:"Temas",dua:"Duʿāʾ",more:"Más",test:"SMART · ELEGIR"}
  };
  var left=null, view=null, bottom=null, readerFrame=null, active=false, started=false, frame=0;
  var savedView=null,savedBottom=null,lastHash="",lastLang="",lastContext="";
  var contextHistory=Object.create(null),timer=0,layoutObserver=null;
  var pendingContextSelection=null;
  var geometryObserver=null,observedView=null,observedDock=null;
  var resizeRecovery=[];
  var viewProps=["position","top","bottom","left","right","width","min-width","max-width","height","max-height",
    "margin","margin-left","margin-right","overflow","overflow-x","overflow-y","transform","translate",
    "z-index","box-sizing","overscroll-behavior-y","touch-action"];
  var bottomProps=["position","left","right","width","max-width","min-width","margin","margin-left","margin-right","transform","translate","transition","animation"];
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
    var rail=Math.round(Math.max(210,Math.min(300,w*.30)));
    var reader=w-rail;
    return {dual:w>=670&&h>=475&&reader>=440,rail:rail,reader:reader,gap:0};
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
    if(h.indexOf("#more")===0 || /^#(?:propheten|frauen|feed|ilm|quiz|scholars|books|prayer|jummah|settings|profile|account)/.test(h))return "more";
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
    var sw=make("div","dar-test-duo-search-wrap");
    var search=make("input","dar-test-duo-search");
    search.type="search";search.id="darTestDuoFilter";
    search.placeholder="Auswahl durchsuchen …";
    search.setAttribute("aria-label","Einträge durchsuchen");
    search.addEventListener("input",function(){
      var q=String(search.value||"").toLocaleLowerCase();
      left.querySelectorAll(".dar-test-duo-context-link").forEach(function(btn){
        btn.hidden=!!q&&!String(btn.textContent||"").toLocaleLowerCase().includes(q);
      });
    });
    sw.appendChild(search);left.appendChild(sw);
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
    left.querySelector("#darTestDuoLegend").textContent=t.choose+" · "+t.read;
    var filter=left.querySelector("#darTestDuoFilter");
    if(filter)filter.placeholder=t.choose+" …";
    NAV.forEach(function(pair){
      var a=left.querySelector('[data-duo-route="'+pair[0]+'"]');if(a)a.textContent=t[pair[0]];
    });
    lastLang=language();lastContext="";
  }
  function collectContext(){
    if(!view || !view.isConnected || !left)return;
    var current=family(global.location.hash);
    var list=[],seen=Object.create(null);
    // Match real existing SPA controls; Qurʾān surahs are BUTTONS with
    // data-nav="quran-surah" + data-value, NOT hash anchors. The previous
    // controller consequently showed no actual selection items at all.
    var nodes=view.querySelectorAll(
      current==="more"
        ? '[data-nav],.dm-cat,.dal-row-quick,[data-library-open],a[href^="#"]'
        : '[data-nav][data-value],[data-library-open],[data-qsrc-open],a[href^="#"]'
    );
    for(var i=0;i<nodes.length&&list.length<70;i++){
      var el=nodes[i];
      var hash=el.getAttribute("href")||"";
      var nav=el.getAttribute("data-nav")||"";
      var value=el.getAttribute("data-value")||"";
      var library=el.getAttribute("data-library-open")||"";
      var source=el.getAttribute("data-qsrc-open")||"";
      if(hash && (!hash.startsWith("#")||hash.length>150||hash.includes(" ")||family(hash)!==current))continue;
      if(!hash&&!nav&&!library&&!source &&
         !(current==="more"&&el.matches(".dm-cat,.dal-row-quick")))continue;
      var title=String(el.innerText||el.textContent||"").replace(/\s+/g," ").trim();
      if(title.length<3)continue;
      title=title.slice(0,96);
      var key=hash||[nav,value,library,source].join("|");
      if(key==="|||")key="label|"+title;
      if(seen[key])continue;
      seen[key]=true;
      list.push({key:key,hash:hash,nav:nav,value:value,library:library,
        sourceKey:source,title:title,original:el});
    }
    if(list.length>=3)contextHistory[current]=list;
    var entries=contextHistory[current]||list;
    var sig=current+"|"+entries.map(function(e){return e.key;}).join(";")+"|"+language();
    if(sig!==lastContext){
      lastContext=sig;
      var box=left.querySelector("#darTestDuoContext");
      if(!box)return;
      box.replaceChildren();
      if(entries.length){
        box.appendChild(make("h2","dar-test-duo-context-title",dict()[current]||current));
        var section=make("div","dar-test-duo-context-links");
        entries.forEach(function(entry,idx){
          var btn=make("button","dar-test-duo-context-link",entry.title);
          btn.type="button";
          btn.setAttribute("data-duo-context-index",String(idx));
          section.appendChild(btn);
        });
        box.appendChild(section);
      }
      box.hidden=!entries.length;
    }
    // After a detail route is replaced by its category overview, replay
    // the pending real app selection instead of fabricating deep links.
    if(pendingContextSelection && pendingContextSelection.family===current){
      var pending=pendingContextSelection;
      var match=nodes && Array.from(nodes).find(function(el){
        var hash=el.getAttribute("href")||"";
        var key=hash||[
          el.getAttribute("data-nav")||"",el.getAttribute("data-value")||"",
          el.getAttribute("data-library-open")||"",el.getAttribute("data-qsrc-open")||""
        ].join("|");
        return key===pending.key && el.isConnected;
      });
      if(match){
        pendingContextSelection=null;
        global.setTimeout(function(){if(match.isConnected)match.click();},30);
      }
    }
  }
  function activateContext(index){
    var current=family(global.location.hash);
    var entries=contextHistory[current]||[];
    var entry=entries[index];
    if(!entry)return;
    focusPane("right");
    if(view)view.scrollTop=0;
    if(current==="more"&&readerFrame&&readerFrame.contentWindow){
      var child=readerFrame.contentWindow;
      function triggerMore(){
        try{
          var doc=child.document;
          var candidates=Array.from(doc.querySelectorAll(
            "#appView [data-nav],#appView .dm-cat,#appView .dal-row-quick"
          ));
          var normalized=function(s){return String(s||"").replace(/\s+/g," ").trim().slice(0,96);};
          var match=candidates.find(function(el){
            if(entry.nav && el.getAttribute("data-nav")===entry.nav)return true;
            return normalized(el.innerText||el.textContent)===entry.title;
          });
          if(!match)return false;
          match.click();return true;
        }catch(_){return false;}
      }
      if(triggerMore())return;
      // If the reader is inside a subpage, reopen its real More menu before
      // activating the exact native control; never fabricate settings routes.
      try{child.location.hash="#more";}catch(_){}
      global.setTimeout(triggerMore,320);
      global.setTimeout(triggerMore,900);
      return;
    }
    if(entry.original && entry.original.isConnected){
      entry.original.click();return;
    }
    if(entry.hash){global.location.hash=entry.hash;return;}
    // The SPA replaces its source DOM on opening a chapter. First navigate
    // back to the legitimate category, then use its ORIGINAL control.
    var route=NAV.find(function(item){return item[0]===current;});
    if(!route)return;
    pendingContextSelection={family:current,key:entry.key};
    global.location.hash=route[1];
    global.setTimeout(function(){if(pendingContextSelection)collectContext();},200);
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
    // Original SPA remains as the live source of category controls, but
    // is not shown. The reader is a separate responsive browsing context.
    var values={
      "position":"fixed","top":"0px","bottom":"auto","left":"-200vw","right":"auto",
      "width":"100vw","min-width":"0px","max-width":"100vw",
      "height":"100dvh","max-height":"none","margin":"0px",
      "margin-left":"0px","margin-right":"0px","overflow":"hidden",
      "overflow-x":"hidden","overflow-y":"hidden","transform":"none",
      "translate":"none","z-index":"-1","box-sizing":"border-box",
      "overscroll-behavior-y":"contain","touch-action":"auto"
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
    // CSS transitions used to outrank the split geometry for several frames
    // after a Fold reopen. Do not animate the existing dock in workspace mode.
    set(bottom,"transition","none");
    set(bottom,"animation","none");
    set(bottom,"translate","none");
    observeGeometry();
  }
  function embeddedUrl(){
    var url=new URL(global.location.href);
    url.searchParams.set("duoPane","reader");
    url.searchParams.set("duo","0");
    url.hash=global.location.hash||"#home";
    return url.toString();
  }
  function syncReader(){
    if(!readerFrame||!readerFrame.isConnected)return;
    try{
      var win=readerFrame.contentWindow;
      var hash=global.location.hash||"#home";
      if(win&&win.location.hash!==hash)win.location.hash=hash;
    }catch(_){}
  }
  function ensureReader(){
    if(readerFrame&&readerFrame.isConnected)return;
    readerFrame=doc.getElementById("darTestDuoReaderFrame");
    if(readerFrame)return;
    readerFrame=make("iframe","dar-test-duo-reader-frame");
    readerFrame.id="darTestDuoReaderFrame";
    readerFrame.setAttribute("title","DĀR AL TAWḤĪD · "+dict().read);
    readerFrame.setAttribute("data-duo-pane","detail");
    readerFrame.setAttribute("loading","eager");
    readerFrame.setAttribute("allow","autoplay; fullscreen");
    readerFrame.addEventListener("load",syncReader);
    readerFrame.src=embeddedUrl();
    doc.body.appendChild(readerFrame);
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
    if(readerFrame)readerFrame.hidden=true;
  }
  function apply(){
    if(!started)return false;
    var dim=viewport(),calc=capacity(dim.width,dim.height);
    if(!calc.dual||disabled()||blocked()||!doc.getElementById("appView")){
      deactivate();return false;
    }
    root.style.setProperty("--dar-duo-rail-width",calc.rail+"px");
    if(!active){
      root.style.setProperty("--dar-duo-header-height",headerOffset()+"px");
      // Persist a marker only to correct the old glass dock after folding back.
      root.classList.add("dar-test-duo-ever-active");
      active=true;
      root.classList.add("dar-test-duo-active");
      root.setAttribute("data-dar-duo-focus","left");
      if(global.scrollY)global.scrollTo(0,0);
    }
    ensureLeft();
    ensureReader();
    left.hidden=false;
    if(readerFrame)readerFrame.hidden=false;
    positionView();
    // The original 5-tab dock is hidden only in dual mode. All category
    // routes remain accessible from the compact selection control panel.
    if(lastLang!==language())updateLabels();
    if(lastHash!==String(global.location.hash||"")){
      lastHash=String(global.location.hash||"");
      updateSelection();
      syncReader();
    }
    return true;
  }
  function schedule(){
    if(frame)return;
    frame=global.requestAnimationFrame(function(){frame=0;apply();});
  }
  // Other old Test controllers rewrite the five-tab dock after a Fold
  // orientation change (after the initial resize callback). Recheck the
  // measured viewport in a few coalesced phases, not on a perpetual timer.
  function afterResize(){
    schedule();
    resizeRecovery.forEach(function(id){global.clearTimeout(id);});
    resizeRecovery=[100,260,430,700,1100].map(function(delay){
      return global.setTimeout(function(){
        apply();
        if(active){positionView();syncReader();}
      },delay);
    });
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
    global.addEventListener("resize",afterResize,{passive:true});
    global.addEventListener("orientationchange",afterResize,{passive:true});
    global.addEventListener("hashchange",onRoute,{passive:true});
    global.addEventListener("message",function(event){
      if(!readerFrame||event.origin!==global.location.origin||
        event.source!==readerFrame.contentWindow)return;
      var data=event.data;
      if(data&&data.type==="dar-test-duo-reader-route-v5"){
        var h=String(data.hash||"");
        if(h.startsWith("#")&&h.length<250&&global.location.hash!==h)
          global.location.hash=h;
      }
    });
    global.addEventListener("pageshow",schedule,{passive:true});
    global.addEventListener("dar:localechange",schedule,{passive:true});
    global.addEventListener("dar:layoutchange",schedule,{passive:true});
    if(global.visualViewport)global.visualViewport.addEventListener("resize",afterResize,{passive:true});
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
      var fromLeft=e.target.closest("#darTestDuoWorkspaceNav");
      if(!fromLeft)return;
      var contextButton=e.target.closest("[data-duo-context-index]");
      if(contextButton){
        activateContext(Number(contextButton.getAttribute("data-duo-context-index")));
        return;
      }
      if(!a)return;
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
    version:"test-smart-chooser-responsive-reader-v5",testOnly:true
  };
  if(doc.readyState==="loading")doc.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})(typeof window!=="undefined"?window:this);
