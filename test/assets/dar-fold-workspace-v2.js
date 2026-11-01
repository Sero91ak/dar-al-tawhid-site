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

  var nav, pane, topbar, source, sourceHost, sourceSibling, list, filter, contextTitle, menu, menuToggle, contextPanel, railTitle, railSubtitle, countEl, active = false, raf = 0;
  var lastItems = "", lastContextEls = [], lastHash = "", lastWidth = 0, lastHeight = 0, resizeObserver, sourceObserver;
  var scrollByCategory = Object.create(null);
  var optionCache = Object.create(null);
  var selectedOptionKeys = Object.create(null);
  var menuOpen = false;
  var selectedCategory = "home";
  var pendingSelection = null;
  function viewport() {
    var w = Math.round(root.clientWidth || win.innerWidth || 0);
    var h = Math.round(root.clientHeight || win.innerHeight || 0);
    return {width:w,height:h};
  }
  function capacity(w,h) {
    var rail = Math.min(274,Math.max(194,Math.round(w*.255)));
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
  var AREA_HINT = {
    home:"Deine Übersicht",quran:"Suren und Verse",hadith:"Überlieferungen",
    bibliothek:"Bücher und Quellen",themen:"Wissen nach Themen",
    dua:"Bittgebete und Sammlungen",more:"Weitere Bereiche"
  };
  var ICON_PATHS = {
    home:'<path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9Z"/><path d="M9 21v-7h6v7"/>',
    quran:'<path d="M12 6c-2.7-2-5.5-2.5-9-2v14c3.5-.5 6.3 0 9 2 2.7-2 5.5-2.5 9-2V4c-3.5-.5-6.3 0-9 2Z"/><path d="M12 6v14"/>',
    hadith:'<path d="M5 3h11a3 3 0 0 1 3 3v15H6a3 3 0 0 1-3-3V5a2 2 0 0 1 2-2Z"/><path d="M3 17a3 3 0 0 1 3-3h13"/><path d="M7 8h8"/>',
    bibliothek:'<path d="M4 4v16M9 4v16M16 4l4 16M3 20h18"/><path d="M4 7h5M4 16h5"/>',
    themen:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    dua:'<path d="M7 20c-2-1.5-3-4-3-6V7a2 2 0 0 1 4 0v5"/><path d="M17 20c2-1.5 3-4 3-6V7a2 2 0 0 0-4 0v5"/><path d="M8 12V6a2 2 0 0 1 4 0v6"/><path d="M16 12V6a2 2 0 0 0-4 0v6"/><path d="M8 20h8"/>',
    more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    chevron:'<path d="m9 6 6 6-6 6"/>',
    down:'<path d="m6 9 6 6 6-6"/>',
    back:'<path d="m15 18-6-6 6-6"/>'
  };
  function pictogram(name){
    var span=make("span","dar-fold-v2-icon");
    span.setAttribute("aria-hidden","true");
    var svg=doc.createElementNS("http://www.w3.org/2000/svg","svg");
    svg.setAttribute("viewBox","0 0 24 24");
    svg.setAttribute("fill","none");svg.setAttribute("stroke","currentColor");
    svg.setAttribute("stroke-width","1.6");
    svg.setAttribute("stroke-linecap","round");svg.setAttribute("stroke-linejoin","round");
    svg.innerHTML=ICON_PATHS[name]||ICON_PATHS.more;
    span.appendChild(svg);return span;
  }
  function setMenu(open){
    menuOpen=!!open;
    if(!menu || !menuToggle || !contextPanel)return;
    menu.hidden=!menuOpen;
    contextPanel.hidden=menuOpen;
    menuToggle.classList.toggle("is-open",menuOpen);
    menuToggle.setAttribute("aria-expanded",String(menuOpen));
    menuToggle.querySelector(".dar-fold-v2-switch-copy").textContent=menuOpen?"Zur Auswahl zurück":"Bereich wechseln";
    if(menuOpen){
      menu.querySelectorAll("[data-fold-category]").forEach(function(b){
        var current=b.dataset.foldCategory===selectedCategory;
        b.classList.toggle("is-selected",current);
        if(current)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current");
      });
    } else {
      renderContext();
    }
  }
  function createShell() {
    if (nav)return;
    topbar=make("header","dar-fold-v2-topbar");topbar.id="darFoldV2Topbar";
    var mark=make("span","dar-fold-v2-logo","DĀR AL TAWḤĪD");
    var hint=make("span","dar-fold-v2-hint","WISSEN · LESEN · ENTDECKEN");
    topbar.append(mark,hint);
    nav=make("aside","dar-fold-v2-rail");nav.id="darFoldV2Rail";
    nav.setAttribute("aria-label","DĀR AL TAWḤĪD – Auswahlbereich");
    var intro=make("div","dar-fold-v2-intro");
    intro.appendChild(make("div","dar-fold-v2-eyebrow","DEINE BIBLIOTHEK"));
    railTitle=make("h2","dar-fold-v2-title","Qurʾān");
    railSubtitle=make("p","dar-fold-v2-subtitle","Suren und Verse");
    intro.append(railTitle,railSubtitle);
    nav.appendChild(intro);
    menuToggle=make("button","dar-fold-v2-switch");
    menuToggle.type="button";menuToggle.setAttribute("aria-controls","darFoldV2Menu");
    menuToggle.setAttribute("aria-expanded","false");
    menuToggle.append(pictogram("themen"),make("span","dar-fold-v2-switch-copy","Bereich wechseln"),pictogram("down"));
    menuToggle.addEventListener("click",function(){setMenu(!menuOpen);});
    nav.appendChild(menuToggle);
    menu=make("nav","dar-fold-v2-menu");menu.id="darFoldV2Menu";
    menu.hidden=true;menu.setAttribute("aria-label","Bereiche auswählen");
    menu.appendChild(make("div","dar-fold-v2-menu-label","BEREICHE"));
    CATEGORIES.forEach(function(entry){
      var button=make("button","dar-fold-v2-menu-row");button.type="button";
      button.dataset.foldCategory=entry[0];
      button.append(pictogram(entry[0]),make("span","dar-fold-v2-menu-copy",entry[2]),pictogram("chevron"));
      button.addEventListener("click",function(){
        setMenu(false);menuToggle.focus();
        if(selectedCategory!==entry[0]&&list)scrollByCategory[selectedCategory]=list.scrollTop;
        if(win.location.hash!==entry[1])win.location.hash=entry[1];else onRoute(true);
      });
      menu.appendChild(button);
    });
    nav.appendChild(menu);
    contextPanel=make("section","dar-fold-v2-context");
    contextPanel.id="darFoldV2Context";
    var searchWrap=make("div","dar-fold-v2-search-wrap");
    var searchIcon=pictogram("search");
    filter=make("input","dar-fold-v2-search");
    filter.type="search";filter.autocomplete="off";filter.placeholder="Inhalt suchen …";
    filter.setAttribute("aria-label","In diesem Bereich suchen");
    filter.addEventListener("input",function(){lastItems="";renderContext();});
    searchWrap.append(searchIcon,filter);contextPanel.appendChild(searchWrap);
    var listHeader=make("div","dar-fold-v2-list-heading");
    contextTitle=make("span","dar-fold-v2-section","AUSWAHL");
    countEl=make("span","dar-fold-v2-counter","");
    listHeader.append(contextTitle,countEl);
    contextPanel.appendChild(listHeader);
    list=make("div","dar-fold-v2-options");
    contextPanel.appendChild(list);nav.appendChild(contextPanel);
    // The actual, interactive SPA becomes the right content. Never clone it.
    pane=make("main","dar-fold-v2-pane");pane.id="darFoldV2Pane";
    pane.setAttribute("aria-label","Rechter DĀR AL TAWḤĪD Inhaltsbereich");
    doc.body.append(topbar,nav,pane);
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
  function moveContentRight(){
    var view=discover();if(!view||!pane)return false;
    if(view.parentNode!==pane){
      if(!sourceHost){sourceHost=view.parentNode;sourceSibling=view.nextSibling;}
      pane.appendChild(view);
    }
    return true;
  }
  function restoreContent(){
    if(!source||!sourceHost||source.parentNode!==pane)return;
    if(sourceSibling&&sourceSibling.parentNode===sourceHost)sourceHost.insertBefore(source,sourceSibling);
    else sourceHost.appendChild(source);
  }
  function candidates() {
    var view=discover();
    if(!view)return optionCache[selectedCategory]||[];
    var selectors={
      quran:".quran-surah-card,[data-nav^='quran-surah'],a[href^='#quran-surah/'],[data-surah-id]",
      hadith:".hadith-card,.hadith-book-card,[data-nav^='hadith'],a[href^='#hadith']",
      bibliothek:".lib-card,.qsrc-card,[data-library-open],[data-qsrc-open],a[href^='#bibliothek'],a[href^='#book']",
      themen:".topic-card,[data-nav^='topic'],a[href^='#themen'],a[href^='#topic']",
      dua:".dua-card,[data-nav^='dua'],a[href^='#dua']",
      more:"[data-nav],a[href^='#']",
      home:"[data-nav],a[href^='#']"
    };
    var links=Array.from(view.querySelectorAll(selectors[selectedCategory]||selectors.home));
    // A detail route does not replace the user's original master selection.
    // Keep the last discovered category choices when no overview items exist.
    if(!links.length && optionCache[selectedCategory]?.length)return optionCache[selectedCategory];
    var seen=new Set(),result=[];
    links.forEach(function(el){
      if(result.length>=180)return;
      var title=String(el.getAttribute("aria-label")||el.innerText||el.textContent||"").replace(/\s+/g," ").trim();
      if(title.length<2||title.length>105)return;
      var hash=el.getAttribute("href")||"";
      if(hash && (!hash.startsWith("#")||hash.length>170))return;
      var route=el.dataset.nav||el.dataset.libraryOpen||el.dataset.qsrcOpen||"";
      var value=el.getAttribute("data-value")||el.getAttribute("data-surah-id")||el.getAttribute("data-id")||"";
      if(hash && category(hash)!==selectedCategory && category(hash)!=="home")return;
      // quran-surah is a shared action; data-value distinguishes all 114 surahs.
      var key=(hash||[route,value,title].filter(Boolean).join("|")).slice(0,180);
      if(seen.has(key))return;seen.add(key);
      result.push({text:title,el:el,key:key,hash:hash,route:route,value:value});
    });
    if(result.length){
      optionCache[selectedCategory]=result;
      return result;
    }
    return optionCache[selectedCategory]||[];
  }
  function clickOption(item){
    if(item.el&&item.el.isConnected&&pane&&pane.contains(item.el)){
      try{item.el.click();onRoute();return true;}catch(_){}
    }
    if(item.hash&&item.hash.startsWith("#")){
      win.location.hash=item.hash;onRoute();return true;
    }
    lastItems="";scheduleContext();return false;
  }
  function renderContext(){
    if(!active||!list||menuOpen)return;
    var items=candidates(), query=(filter.value||"").trim().toLocaleLowerCase();
    var shown=items.filter(function(x){return x.text.toLocaleLowerCase().includes(query);}).slice(0,120);
    var signature=selectedCategory+"|"+query+"|"+shown.map(function(x){return x.key+"="+x.text;}).join(";");
    if(signature===lastItems && shown.length===lastContextEls.length&&
      shown.every(function(x,i){return x.el===lastContextEls[i];}))return;
    lastItems=signature;lastContextEls=shown.map(function(x){return x.el;});
    if(countEl)countEl.textContent=query?shown.length+" Treffer":items.length?String(items.length)+" Einträge":"";
    var fragment=doc.createDocumentFragment();
    shown.forEach(function(item,i){
      var button=make("button","dar-fold-v2-option");
      button.type="button";
      if(selectedOptionKeys[selectedCategory]===item.key){
        button.classList.add("is-selected");button.setAttribute("aria-current","true");
      }
      var label=make("span","dar-fold-v2-option-label",item.text);
      var side=make("span","dar-fold-v2-option-symbol");
      side.setAttribute("aria-hidden","true");side.appendChild(pictogram("chevron"));
      button.append(label,side);
      button.addEventListener("click",function(){
        list.querySelectorAll(".is-selected").forEach(function(old){
          old.classList.remove("is-selected");old.removeAttribute("aria-current");
        });
        selectedOptionKeys[selectedCategory]=item.key;
        button.classList.add("is-selected");button.setAttribute("aria-current","true");
        clickOption(item);
      });
      fragment.appendChild(button);
    });
    if(!shown.length){
      fragment.appendChild(make("p","dar-fold-v2-empty",query?"Keine passenden Einträge gefunden.":"Wähle rechts einen Inhalt oder öffne einen anderen Bereich."));
    }
    var oldTop=list.scrollTop;
    list.replaceChildren(fragment);
    list.scrollTop=oldTop;
  }
  var contextRaf=0;
  function scheduleContext(){
    if(contextRaf||!active)return;
    contextRaf=win.requestAnimationFrame(function(){contextRaf=0;renderContext();});
  }
  function syncDetail(){
    if(pane&&pane.scrollTop>0)pane.scrollTop=0;
  }
  function onRoute(force){
    var hash=win.location.hash||"#home",cat=category(hash);
    if(lastHash===hash && active&&!force){scheduleContext();return;}
    lastHash=hash;
    if(nav&&selectedCategory!==cat){
      if(list)scrollByCategory[selectedCategory]=list.scrollTop;
      selectedCategory=cat;
      if(filter)filter.value="";
      lastItems="";lastContextEls=[];
      if(list)list.scrollTop=scrollByCategory[cat]||0;
    }
    if(railTitle)railTitle.textContent=CATEGORIES.find(function(x){return x[0]===cat;})?.[2]||"Bibliothek";
    if(railSubtitle)railSubtitle.textContent=AREA_HINT[cat]||"Entdecken und lesen";
    if(contextTitle)contextTitle.textContent=cat==="quran"?"SUREN & VERSE":"IN DIESEM BEREICH";
    if(menu)menu.querySelectorAll("[data-fold-category]").forEach(function(b){
      var current=b.dataset.foldCategory===cat;
      b.classList.toggle("is-selected",current);
      if(current)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current");
    });
    syncDetail();scheduleContext();
  }
  function apply() {
    if(!doc.body||!doc.getElementById("appView"))return false;
    var m=viewport(),c=capacity(m.width,m.height);
    if(!c.dual){
      if(active){
        restoreContent();
        active=false;root.classList.remove("dar-fold-v2-active");
        if(nav)nav.hidden=true;if(pane)pane.hidden=true;if(topbar)topbar.hidden=true;
      }
      return false;
    }
    createShell();
    if(!moveContentRight())return false;
    root.style.setProperty("--dar-fold-v2-rail",c.rail+"px");
    if(!active){
      active=true;root.classList.add("dar-fold-v2-active");
      nav.hidden=false;pane.hidden=false;topbar.hidden=false;
      lastHash="";lastItems="";onRoute(true);
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
      return {version:"20261101-real-content-v4",active:active,viewport:m,capacity:c,rail:box(nav),reader:box(pane),contentInRight:!!(source&&pane&&source.parentNode===pane),route:win.location.hash||"#home"};
    }
  };
  if(doc.readyState==="loading")doc.addEventListener("DOMContentLoaded",start,{once:true});else start();
})(window,document);
