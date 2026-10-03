/* DĀR AL TAWḤĪD · DAR TEST ONLY · Home Library v1194 */
(function(){
"use strict";
if(window.__DAR_HOME_LIBRARY_V1194)return;
var path=String(location.pathname||"");
if(!(path==="/test"||path.indexOf("/test/")===0)||path.indexOf("/test/kids")===0)return;
window.__DAR_HOME_LIBRARY_V1194=true;

var queued=false;
var observed=false;

var access=[
  {nav:"topics",icon:"topics.png",title:"Tawḥīd & ʿAqīdah",desc:"Grundlagen, Beweise und Aussagen der Salaf."},
  {nav:"quran",icon:"quran.png",title:"Qurʾān & Tafsīr",desc:"Lesen, suchen, verstehen und weiterlernen."},
  {nav:"hadith",icon:"hadith.png",title:"Sunnah & Ḥadīṯ",desc:"Authentische Überlieferungen und Ḥadīṯ-Bibliothek."},
  {nav:"scholars",icon:"scholars.png",title:"Ṣaḥābah, Salaf & Gelehrte",desc:"Überlieferer, frühe Imāme und ihre Werke."},
  {nav:"books",icon:"library.png",title:"Bücher & Quellen",desc:"Geprüfte Werke, Fundstellen und Veröffentlichungen."},
  {nav:"prophets",icon:"prophets.png",title:"Die Propheten",desc:"Qurʾān & authentische Sunnah"},
  {nav:"frauen",icon:"frauen.png",title:"Frauen im Islam",desc:"Fiqh, Ṣaḥābiyyāt & Wissen"},
  {nav:"dua",icon:"dua.png",title:"Duʿāʾ & Adab",desc:"Qurʾān & Sunnah"},
  {nav:"prayer",icon:"prayer.png",title:"Gebetszeiten",desc:"Zeiten & Erinnerungen"},
  {nav:"quiz",icon:"quiz.png",title:"Dīn-Quiz",desc:"Wissen prüfen"},
  {nav:"more",icon:"more.png",title:"Alle Bereiche",desc:"Vollständiger Zugang"}
];

function isHome(){
  return !!(document.body&&document.body.classList.contains("is-home-route"));
}
function navTo(route){
  try{if(typeof window.navigate==="function"){window.navigate(route);return}}catch(e){}
  try{if(typeof navigate==="function"){navigate(route);return}}catch(e){}
  location.hash="#"+route;
}
function bind(root){
  if(!root)return;
  root.querySelectorAll("[data-dt-nav]").forEach(function(el){
    if(el.dataset.dtBound==="1")return;
    el.dataset.dtBound="1";
    el.addEventListener("click",function(e){
      e.preventDefault();
      navTo(el.dataset.dtNav||"topics");
    });
  });
  root.querySelectorAll("[data-dt-scroll]").forEach(function(el){
    if(el.dataset.dtBound==="1")return;
    el.dataset.dtBound="1";
    el.addEventListener("click",function(e){
      e.preventDefault();
      var id=el.dataset.dtScroll||"homeSearchTitle";
      var target=document.getElementById(id);
      var section=target&&target.closest(".home-v380-section");
      if(!section)return;
      section.scrollIntoView({behavior:"smooth",block:"start"});
      setTimeout(function(){
        var input=section.querySelector("input[type='search'],input.search,input");
        try{if(input)input.focus({preventScroll:true})}catch(err){}
      },320);
    });
  });
}
function removeOldLayers(){
  [
    "dklKnowledgeStage","dklKnowledgeIndex","dklContinue",
    "dhHero1190","dhLibrary1190","dhContinue1190",
    "dhHero1192","dhLibrary1192","dhContinue1192",
    "dtHero1193","dtAccess1193","dtContinue1193","dtCore1193","dtStudy1193"
  ].forEach(function(id){
    var el=document.getElementById(id);
    if(el)el.remove();
  });
  if(document.body)document.body.classList.remove("dar-knowledge-home-v1183");
  document.documentElement.classList.remove("dar-home-v1190","dar-home-v1192");
}
function applyHomeAtmosphereV1204(){
  if(!isHome())return;
  var html=document.documentElement;
  var theme=String(html.getAttribute("data-theme")||"").toLowerCase();
  var light=(theme==="light"||theme==="soft"||theme==="eisgold");
  var body=document.body;
  var top=document.querySelector(".top-shell");
  var header=top&&top.querySelector(".header");
  var view=document.getElementById("appView");
  var page=(body&&getComputedStyle(body).getPropertyValue("--dt-page").trim())||(light?"#f5f1e7":"#050706");
  var heroImg=window.matchMedia&&window.matchMedia("(min-width:760px)").matches
    ? "/test/assets/home-v1194/hero-wide-adobe.jpg?v=1206"
    : "/test/assets/home-v1194/hero-mobile-adobe.jpg?v=1206";
  var studyImg="/test/assets/home-v1194/study-runway.jpg?v=1206";
  if(html){
    html.style.setProperty("background-color",page,"important");
    html.style.setProperty(
      "background-image",
      light
        ? "linear-gradient(90deg,rgba(249,246,238,.68),rgba(249,246,238,.30)),url('"+heroImg+"')"
        : "linear-gradient(90deg,rgba(2,3,2,.58),rgba(2,3,2,.10)),url('"+heroImg+"')",
      "important"
    );
    html.style.setProperty("background-repeat","no-repeat","important");
    html.style.setProperty("background-size","cover","important");
    html.style.setProperty("background-position","62% top","important");
  }
  if(body){
    body.style.setProperty("background-color",page,"important");
    body.style.setProperty("background-image","none","important");
  }
  if(top){
    top.style.setProperty("background-color",page,"important");
    top.style.setProperty(
      "background-image",
      light
        ? "linear-gradient(180deg,rgba(249,246,238,.58) 0%,rgba(249,246,238,.62) 36%,rgba(249,246,238,.84) 78%,rgba(249,246,238,.96) 100%),linear-gradient(90deg,rgba(249,246,238,.74) 0%,rgba(249,246,238,.48) 50%,rgba(249,246,238,.26) 100%),url('"+heroImg+"')"
        : "linear-gradient(180deg,rgba(2,3,2,.10) 0%,rgba(2,3,2,.18) 34%,rgba(2,3,2,.58) 72%,rgba(2,3,2,.98) 100%),linear-gradient(90deg,rgba(2,3,2,.58) 0%,rgba(2,3,2,.28) 48%,rgba(2,3,2,.08) 100%),url('"+heroImg+"')",
      "important"
    );
    top.style.setProperty("background-repeat","no-repeat","important");
    top.style.setProperty("background-size","100% 100%,100% 100%,cover","important");
    top.style.setProperty("background-position","center,center,62% 32%","important");
  }
  if(header){
    header.style.setProperty("background","transparent","important");
    header.style.setProperty("background-image","none","important");
  }
  if(view){
    view.style.setProperty("background-color",page,"important");
    view.style.setProperty(
      "background-image",
      light
        ? "linear-gradient(180deg,rgba(249,246,238,.94) 0%,rgba(249,246,238,.68) 14%,rgba(249,246,238,.56) 38%,rgba(249,246,238,.72) 72%,rgba(249,246,238,.96) 100%),linear-gradient(90deg,rgba(249,246,238,.72) 0%,rgba(249,246,238,.50) 52%,rgba(249,246,238,.34) 100%),url('"+studyImg+"')"
        : "linear-gradient(180deg,rgba(2,3,2,.96) 0%,rgba(2,3,2,.44) 12%,rgba(2,3,2,.24) 35%,rgba(2,3,2,.34) 70%,rgba(2,3,2,.96) 100%),linear-gradient(90deg,rgba(2,3,2,.62) 0%,rgba(2,3,2,.30) 52%,rgba(2,3,2,.16) 100%),url('"+studyImg+"')",
      "important"
    );
    view.style.setProperty("background-repeat","no-repeat","important");
    view.style.setProperty("background-size","100% 100%,100% 100%,100% auto","important");
    view.style.setProperty("background-position","center,center,center top","important");
  }
  document.querySelectorAll("#appView .home-v380-shell,#appView .home-v380-section,#appView .home-line-list,#appView .home-line-grid,.top-shell .header").forEach(function(el){
    el.style.setProperty("background-color","transparent","important");
    if(!el.classList.contains("header"))el.style.setProperty("background-image","none","important");
  });
}
function ensureHero(){
  var top=document.querySelector(".top-shell");
  var header=top&&top.querySelector(".header");
  if(!top||!header)return;

  var hero=header.querySelector("#dtHero1194");
  if(!hero){
    hero=document.createElement("section");
    hero.id="dtHero1194";
    hero.className="dt-hero";
    hero.setAttribute("aria-label","Bibliothek des Wissens");
    hero.innerHTML=
      '<div class="dt-hero-kicker">Bibliothek des Wissens</div>'+
      '<h1 class="dt-hero-title"><strong>TAWḤĪD</strong><span>Das Fundament allen Wissens.</span></h1>'+
      '<p class="dt-hero-lead">Qurʾān, authentische Sunnah und die Überlieferungen der Salaf – geordnet, nachvollziehbar und direkt zugänglich.</p>'+

      '<div class="dt-hero-search-slot" aria-label="Schnellsuche im Wissen"></div>';
    var brand=header.querySelector(".header-row--brand-only");
    if(brand)brand.insertAdjacentElement("afterend",hero);
    else header.appendChild(hero);
  }
  var staleLinks=hero.querySelector(".dt-hero-links");
  if(staleLinks)staleLinks.remove();
  bind(hero);

  var prayer=document.getElementById("headerPrayerStatus");
  if(prayer&&prayer.parentNode!==header)header.appendChild(prayer);

  var isnad=top.querySelector(".isnad")||document.querySelector(".isnad");
  if(isnad){
    isnad.classList.remove("dkl-isnad","dh2-isnad");
    isnad.classList.add("dt-isnad");
    if(isnad.parentNode!==top||header.nextElementSibling!==isnad)header.insertAdjacentElement("afterend",isnad);
  }
}
function accessHtml(item){
  return '<button type="button" class="dt-access-item" data-dt-nav="'+item.nav+'">'+
    '<span class="dt-access-icon" aria-hidden="true"><img src="/test/assets/dar-3d-icons/'+item.icon+'?v=1194" alt=""></span>'+
    '<span class="dt-access-copy"><b>'+item.title+'</b><span>'+item.desc+'</span></span>'+
    '<span class="dt-access-arrow" aria-hidden="true">→</span>'+
  '</button>';
}
function sectionByTitle(id){
  var title=document.getElementById(id);
  return title&&title.closest(".home-v380-section");
}
function placeAfter(node,anchor){
  if(!node||!anchor||node===anchor)return anchor;
  if(anchor.nextElementSibling!==node)anchor.insertAdjacentElement("afterend",node);
  return node;
}
function ensureFunctionalHeroSearch(){
  if(!isHome())return;
  var hero=document.getElementById("dtHero1194");
  var nativeSearch=sectionByTitle("homeSearchTitle");
  if(!hero||!nativeSearch)return;
  var slot=hero.querySelector(".dt-hero-search-slot");
  if(!slot){
    slot=document.createElement("div");
    slot.className="dt-hero-search-slot";
    slot.setAttribute("aria-label","Schnellsuche im Wissen");
    hero.appendChild(slot);
  }
  var stale=hero.querySelector(".dt-hero-search");
  if(stale)stale.remove();
  var existing=slot.querySelector(".home-v380-search-field");
  var field=nativeSearch.querySelector(".home-v380-search-field");
  if(field){
    if(existing&&existing!==field)existing.remove();
    if(field.parentNode!==slot)slot.appendChild(field);
  }else{
    field=existing;
  }
  if(field){
    field.classList.add("dt-hero-native-search");
    var input=field.querySelector("#homeSearchInput");
    if(input){
      input.setAttribute("placeholder","Qurʾān, Ḥadīṯ, Gelehrte und Themen durchsuchen");
      input.setAttribute("aria-label","Schnellsuche: Qurʾān, Ḥadīṯ, Gelehrte und Themen durchsuchen");
    }
  }
  nativeSearch.classList.add("dt-native-search-relocated");
}
function tuneSearch(){
  var title=document.getElementById("homeSearchTitle");
  if(title)title.textContent="Wissen durchsuchen";
  document.querySelectorAll(".home-v380-filter-chip").forEach(function(btn){
    var mode=btn.getAttribute("data-home-filter-open")||"";
    if(mode==="more"){
      btn.hidden=false;
      btn.classList.add("dt-filter-trigger");
      btn.textContent="Filter";
      btn.setAttribute("aria-label","Suchfilter öffnen");
    }else{
      btn.hidden=true;
      btn.setAttribute("aria-hidden","true");
    }
  });
}
function cleanupHomeDuplicates(shell){
  if(!shell)return;

  // Unwrap the real Qur'an resume row before removing the generated scene.
  ["dtContinue1194","dtContinue1193"].forEach(function(id){
    var wrap=shell.querySelector("#"+id);
    if(!wrap)return;
    var resume=wrap.querySelector(".home-v380-quran-hero");
    if(resume)wrap.insertAdjacentElement("beforebegin",resume);
    wrap.remove();
  });

  // Remove the duplicated presentation blocks that repeat native Home content.
  [
    "dtAccess1194","dtCore1194","dtStudy1194",
    "dtAccess1193","dtCore1193","dtStudy1193"
  ].forEach(function(id){
    var el=shell.querySelector("#"+id);
    if(el)el.remove();
  });

  // The library redesign used to inject another recommendation on Home.
  shell.querySelectorAll('[data-dar-library-recommend="1"]').forEach(function(el){el.remove()});

  // Keep exactly one functional Qur'an resume element.
  var resumes=Array.prototype.slice.call(shell.querySelectorAll(".home-v380-quran-hero"));
  resumes.slice(1).forEach(function(el){el.remove()});
}

function ensureMain(){
  var shell=document.querySelector("#appView .home-v380-shell");
  if(!shell)return;

  cleanupHomeDuplicates(shell);
  tuneSearch();
  ensureFunctionalHeroSearch();

  // Keep the native Home sections in their original order. Only rename headings.
  var rename={
    homeTodayTitle:"Heute im DĀR",
    homeLibrariesTitle:"Sammlungen & Quellen",
    homeDiscoverTitle:"Neu im Wissen"
  };
  Object.keys(rename).forEach(function(id){
    var el=document.getElementById(id);
    if(el)el.textContent=rename[id];
  });

  // The hero already has a direct search trigger. Do not show a second search surface.
  var nativeSearch=sectionByTitle("homeSearchTitle");
  if(nativeSearch)nativeSearch.classList.add("dt-native-search-single");

  document.querySelectorAll(
    ".home-header-update-chip,#homeRefreshBtn,.home-refresh-icon-btn--header,.home-refresh-panel,.home-update-row-v416"
  ).forEach(function(el){el.style.setProperty("display","none","important")});
}
function compactHomeFooter(){
  if(!isHome())return;
  var footer=document.querySelector(".footer");
  var view=document.getElementById("appView");
  var shell=document.querySelector("#appView .home-v380-shell");
  [view,shell].forEach(function(el){
    if(!el)return;
    el.style.setProperty("min-height","0","important");
    el.style.setProperty("height","auto","important");
    el.style.setProperty("max-height","none","important");
  });
  if(view){
    view.style.setProperty("padding-bottom","8px","important");
    view.style.setProperty("margin-bottom","0","important");
  }
  if(shell){
    shell.style.setProperty("padding-bottom","0","important");
    Array.prototype.forEach.call(shell.children,function(el){
      if(!el||!el.matches||!el.matches(".home-v380-section"))return;
      var hasControls=!!el.querySelector("a,button,input,select,textarea,[data-dt-nav],[data-quran-continue]");
      var hasText=String(el.textContent||"").replace(/\s+/g,"").length>0;
      if(!hasControls&&!hasText)el.style.setProperty("display","none","important");
    });
  }
  if(!footer)return;
  footer.style.setProperty("margin-top","0","important");
  footer.style.setProperty("text-align","center","important");
  footer.style.setProperty("align-items","center","important");
  footer.style.setProperty("justify-items","center","important");
  var links=Array.prototype.slice.call(footer.querySelectorAll("a,button")).filter(function(el){
    var hay=((el.textContent||"")+" "+(el.getAttribute("href")||"")+" "+(el.getAttribute("aria-label")||"")).toLowerCase();
    return /telegram|whatsapp|instagram/.test(hay);
  });
  if(links.length>=2){
    var group=links[0].parentElement;
    while(group&&group!==footer&&!links.every(function(el){return group.contains(el)}))group=group.parentElement;
    if(!group)group=footer;
    group.style.setProperty("display","flex","important");
    group.style.setProperty("flex-wrap","wrap","important");
    group.style.setProperty("align-items","center","important");
    group.style.setProperty("justify-content","center","important");
    group.style.setProperty("gap","10px 26px","important");
    group.style.setProperty("width","100%","important");
    group.style.setProperty("margin-left","auto","important");
    group.style.setProperty("margin-right","auto","important");
    group.style.setProperty("text-align","center","important");
    links.forEach(function(el){
      el.style.setProperty("margin-left","0","important");
      el.style.setProperty("margin-right","0","important");
      el.style.setProperty("text-align","center","important");
    });
  }
}
function cleanupHomeLiteralArtifacts(){
  if(!isHome()||!document.body)return;
  Array.prototype.slice.call(document.body.childNodes).forEach(function(node){
    if(node&&node.nodeType===3&&String(node.textContent||"").trim()==="\\n"){
      try{node.remove()}catch(e){if(node.parentNode)node.parentNode.removeChild(node)}
    }
  });
}
function sync(){
  if(!document.documentElement||!document.body)return;
  if(!isHome()){
    document.documentElement.classList.remove("dar-home-v1194");
    document.documentElement.style.removeProperty("background-color");
    document.documentElement.style.removeProperty("background-image");
    document.documentElement.style.removeProperty("background-repeat");
    document.documentElement.style.removeProperty("background-size");
    document.documentElement.style.removeProperty("background-position");
    return;
  }
  removeOldLayers();
  cleanupHomeLiteralArtifacts();
  document.documentElement.classList.add("dar-home-v1194");
  ensureHero();
  ensureMain();
  applyHomeAtmosphereV1204();
  compactHomeFooter();
}
function queue(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(function(){queued=false;sync()});
}
function observe(){
  if(observed)return;
  observed=true;
  var app=document.getElementById("appView");
  if(app)new MutationObserver(queue).observe(app,{childList:true,subtree:true});
  new MutationObserver(queue).observe(document.body,{attributes:true,attributeFilter:["class"]});
  new MutationObserver(queue).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme","data-theme-variant"]});
  window.addEventListener("hashchange",queue);
  window.addEventListener("pageshow",queue);
  document.addEventListener("dar:view-rendered",queue);
  queue();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",observe,{once:true});
else observe();
})();