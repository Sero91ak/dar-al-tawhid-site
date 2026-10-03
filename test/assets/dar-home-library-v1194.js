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
      '<nav class="dt-hero-links" aria-label="Direkte Wissenszugänge">'+
        '<button type="button" class="dt-text-link" data-dt-nav="topics">Tawḥīd &amp; ʿAqīdah</button>'+
        '<button type="button" class="dt-text-link" data-dt-nav="quran">Qurʾān</button>'+
        '<button type="button" class="dt-text-link" data-dt-nav="hadith">Sunnah &amp; Ḥadīṯ</button>'+
        '<button type="button" class="dt-text-link" data-dt-nav="books">Quellen</button>'+
      '</nav>'+
      '<button type="button" class="dt-hero-search" data-dt-scroll="homeSearchTitle" aria-label="Wissen durchsuchen">'+
        '<img src="/test/assets/dar-3d-icons/ilm.png?v=1194" alt="" aria-hidden="true">'+
        '<span>Qurʾān, Ḥadīṯ, Gelehrte und Themen durchsuchen</span><b aria-hidden="true">→</b>'+
      '</button>';
    var brand=header.querySelector(".header-row--brand-only");
    if(brand)brand.insertAdjacentElement("afterend",hero);
    else header.appendChild(hero);
  }
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
function sync(){
  if(!document.documentElement||!document.body)return;
  if(!isHome()){
    document.documentElement.classList.remove("dar-home-v1194");
    return;
  }
  removeOldLayers();
  document.documentElement.classList.add("dar-home-v1194");
  ensureHero();
  ensureMain();
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
  window.addEventListener("hashchange",queue);
  window.addEventListener("pageshow",queue);
  document.addEventListener("dar:view-rendered",queue);
  queue();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",observe,{once:true});
else observe();
})();