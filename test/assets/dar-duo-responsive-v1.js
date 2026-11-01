/* DĀR TEST only · Fold / tablet dual workspace v2 · 2026-11-01.
   One canonical in-app #appView on the right; an independently scrolling
   navigation on the left. No cloned app, iframe, route override, DOM reparent
   of existing tabs, prayer changes, or modifications to public visitor/KIDS.
   The previously retired experimental positioning code stays retired. */
(function (global) {
  "use strict";
  var doc = global.document;
  if (!doc || !/^\/test(?:\/|$)/.test(String(global.location && global.location.pathname || ""))) return;
  if (global.__DAR_TEST_DUO_WORKSPACE_V2) return;
  global.__DAR_TEST_DUO_WORKSPACE_V2 = true;

  var NAV = [
    ["home", "#home"],
    ["quran", "#quran"],
    ["hadith", "#hadith"],
    ["library", "#bibliothek"],
    ["topics", "#themen"],
    ["dua", "#duas"],
    ["more", "#more"]
  ];
  // New adult UI text always ships in all nine canonical UI languages.
  var words = {
    de: {choose:"Auswählen",read:"Lesen",home:"Start",quran:"Qurʾān",hadith:"Ḥadīṯ",library:"Bibliothek",topics:"Themen",dua:"Duʿāʾ",more:"Mehr",test:"TEST · Zwei Bereiche"},
    ar: {choose:"اختيار",read:"قراءة",home:"الرئيسية",quran:"القرآن",hadith:"الحديث",library:"المكتبة",topics:"المواضيع",dua:"الدعاء",more:"المزيد",test:"اختبار · قسمان"},
    en: {choose:"Select",read:"Read",home:"Home",quran:"Qurʾān",hadith:"Ḥadīth",library:"Library",topics:"Topics",dua:"Duʿāʾ",more:"More",test:"TEST · Two panes"},
    tr: {choose:"Seç",read:"Oku",home:"Ana sayfa",quran:"Kurʾân",hadith:"Hadis",library:"Kütüphane",topics:"Konular",dua:"Duâ",more:"Diğer",test:"TEST · İki bölüm"},
    ku: {choose:"Hilbijêre",read:"Bixwîne",home:"Destpêk",quran:"Qurʾan",hadith:"Hedîs",library:"Pirtûkxane",topics:"Mijar",dua:"Duʿa",more:"Zêdetir",test:"TEST · Du beş"},
    ckb: {choose:"هەڵبژێرە",read:"بخوێنەوە",home:"سەرەکی",quran:"قورئان",hadith:"حەدیس",library:"کتێبخانە",topics:"بابەتەکان",dua:"دوعا",more:"زیاتر",test:"تاقیکردنەوە · دوو بەش"},
    bs: {choose:"Odaberi",read:"Čitaj",home:"Početna",quran:"Kurʾan",hadith:"Hadis",library:"Biblioteka",topics:"Teme",dua:"Dova",more:"Više",test:"TEST · Dva dijela"},
    fr: {choose:"Choisir",read:"Lire",home:"Accueil",quran:"Coran",hadith:"Ḥadith",library:"Bibliothèque",topics:"Sujets",dua:"Duʿāʾ",more:"Plus",test:"TEST · Deux volets"},
    es: {choose:"Elegir",read:"Leer",home:"Inicio",quran:"Corán",hadith:"Hadiz",library:"Biblioteca",topics:"Temas",dua:"Duʿāʾ",more:"Más",test:"TEST · Dos paneles"}
  };
  var root = doc.documentElement;
  var started = false;
  var frame = 0;
  var rail = null;
  var lastLocale = "";
  var lastHash = "";
  var lastContext = "";
  var observer = null;
  var pendingTimeouts = [];

  function lang() {
    var selected = "";
    try { selected = String(global.localStorage.getItem("darAdultPreferredLocaleV1") || ""); } catch (_) {}
    if (!selected) selected = String(root.lang || doc.body && doc.body.lang || "de");
    selected = selected.toLowerCase().split(/[-_]/)[0];
    return Object.prototype.hasOwnProperty.call(words, selected) ? selected : "de";
  }
  function measure() {
    // Use the layout viewport rather than a stale visualViewport after rotation.
    var width = Math.round(root.clientWidth || global.innerWidth || 0);
    var height = Math.round(root.clientHeight || global.innerHeight || 0);
    return { width: width, height: height, landscape: width > height };
  }
  function capacity(width,height) {
    var w = Math.max(0,Number(width)||0), h = Math.max(0,Number(height)||0);
    var railWidth = Math.round(Math.max(196, Math.min(310,w*0.29)));
    var gutter = Math.max(12,Math.min(20,Math.round(w*0.02)));
    var remaining = w - railWidth - gutter*3;
    // Narrow cover and short phone landscape must remain the original app.
    var dual = w >= 640 && h >= 560 && remaining >= 390;
    return {dual:dual,rail:railWidth,gutter:gutter,reader:remaining};
  }
  function forcedOff() {
    try { return new URLSearchParams(global.location.search || "").get("duo") === "0"; }
    catch (_) { return false; }
  }
  function eligible() {
    if (forcedOff() || !doc.body || !doc.getElementById("appView")) return false;
    var b = doc.body.classList;
    if (b.contains("is-feed-fullscreen") || b.contains("is-ilm-chat-route") ||
        b.contains("dar-test-reading-open")) return false;
    var m = measure();
    return capacity(m.width,m.height).dual;
  }
  function itemLabel(key) { return (words[lang()] || words.de)[key] || words.de[key] || key; }
  function button(key,hash) {
    var a=doc.createElement("a");
    a.className="dar-test-duo-link";
    a.href=hash;
    a.setAttribute("data-duo-route",key);
    a.textContent=itemLabel(key);
    return a;
  }
  function ensureRail() {
    if (rail && rail.isConnected) return rail;
    rail = doc.getElementById("darTestDuoWorkspaceNav");
    if (rail) return rail;
    rail=doc.createElement("nav");
    rail.id="darTestDuoWorkspaceNav";
    rail.className="dar-test-duo-workspace-nav";
    rail.setAttribute("aria-label","DĀR Test workspace");
    var brand=doc.createElement("div");
    brand.className="dar-test-duo-brand";
    brand.textContent="DĀR AL TAWḤĪD";
    rail.appendChild(brand);
    var sub=doc.createElement("p");
    sub.className="dar-test-duo-caption";
    sub.id="darTestDuoCaption";
    sub.textContent=itemLabel("test");
    rail.appendChild(sub);
    var legend=doc.createElement("div");
    legend.className="dar-test-duo-legend";
    legend.id="darTestDuoLegend";
    rail.appendChild(legend);
    var list=doc.createElement("div");
    list.className="dar-test-duo-links";
    list.id="darTestDuoLinks";
    NAV.forEach(function(pair){ list.appendChild(button(pair[0],pair[1])); });
    rail.appendChild(list);
    // Mount outside the SPA renderer to preserve scroll and DOM identity.
    doc.body.appendChild(rail);
    return rail;
  }
  function updateLabels() {
    if (!rail) return;
    var t=words[lang()];
    var caption=doc.getElementById("darTestDuoCaption");
    if(caption)caption.textContent=t.test;
    var legend=doc.getElementById("darTestDuoLegend");
    if(legend)legend.textContent=t.choose+"  /  "+t.read;
    NAV.forEach(function(pair){
      var a=rail.querySelector('[data-duo-route="'+pair[0]+'"]');
      if(a)a.textContent=t[pair[0]];
    });
    rail.setAttribute("aria-label",t.choose+" · "+t.read);
    lastLocale=lang();
  }
  function updateActive() {
    if(!rail)return;
    var hash=String(global.location.hash||"#home").toLowerCase();
    var key="home";
    if(hash.indexOf("#quran")===0)key="quran";
    else if(hash.indexOf("#hadith")===0)key="hadith";
    else if(hash.indexOf("#bibliothek")===0||hash.indexOf("#library")===0)key="library";
    else if(hash.indexOf("#themen")===0||hash.indexOf("#topic")===0||hash.indexOf("#post")===0)key="topics";
    else if(hash.indexOf("#dua")===0)key="dua";
    else if(hash.indexOf("#more")===0)key="more";
    NAV.forEach(function(pair){
      var link=rail.querySelector('[data-duo-route="'+pair[0]+'"]');
      if(!link)return;
      var active=pair[0]===key;
      link.classList.toggle("is-current",active);
      if(active) link.setAttribute("aria-current","page");
      else link.removeAttribute("aria-current");
    });
    lastHash=hash;
  }
  function apply() {
    if(!started)return false;
    var m=measure(), c=capacity(m.width,m.height);
    var on=eligible();
    root.classList.toggle("dar-test-duo-active",on);
    if(on){
      var el=ensureRail();
      root.style.setProperty("--dar-test-duo-rail",c.rail+"px");
      root.style.setProperty("--dar-test-duo-gap",c.gutter+"px");
      el.hidden=false;
      if(lastLocale!==lang()) updateLabels();
      if(lastHash!==String(global.location.hash||"#home").toLowerCase()) updateActive();
    }else if(rail){
      rail.hidden=true;
    }
    return on;
  }
  function schedule() {
    if(frame)return;
    frame=global.requestAnimationFrame(function(){frame=0;apply();});
  }
  function afterRoute() {
    schedule();
    pendingTimeouts.forEach(global.clearTimeout);
    pendingTimeouts=[
      global.setTimeout(schedule,160),
      global.setTimeout(schedule,430)
    ];
  }
  function start() {
    if(started)return;
    started=true;
    apply();
    global.addEventListener("resize",schedule,{passive:true});
    global.addEventListener("orientationchange",afterRoute,{passive:true});
    global.addEventListener("hashchange",afterRoute,{passive:true});
    global.addEventListener("pageshow",afterRoute,{passive:true});
    global.addEventListener("dar:layoutchange",schedule,{passive:true});
    global.addEventListener("dar:localechange",schedule,{passive:true});
    if(global.visualViewport)global.visualViewport.addEventListener("resize",schedule,{passive:true});
    if(typeof MutationObserver==="function" && doc.body){
      observer=new MutationObserver(function(){schedule();});
      observer.observe(doc.body,{attributes:true,attributeFilter:["class"]});
    }
    doc.addEventListener("visibilitychange",function(){if(!doc.hidden)schedule();});
    doc.addEventListener("click",function(event){
      if(event.target && event.target.closest && event.target.closest("#darTestDuoWorkspaceNav a")) afterRoute();
    },{passive:true});
    // Locale may change via settings without a navigation event.
    global.addEventListener("storage",schedule,{passive:true});
  }
  global.DARTestDuoAdaptive={
    measure:measure, capacity:capacity, apply:apply, active:function(){return root.classList.contains("dar-test-duo-active");},
    audit:function(){var m=measure();var c=capacity(m.width,m.height);return {viewport:m,capacity:c,active:root.classList.contains("dar-test-duo-active"),railMounted:!!(rail&&rail.isConnected),route:String(global.location.hash||"")};},
    version:"test-dual-workspace-v2", testOnly:true
  };
  if(doc.readyState==="loading")doc.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})(typeof window!=="undefined"?window:this);
