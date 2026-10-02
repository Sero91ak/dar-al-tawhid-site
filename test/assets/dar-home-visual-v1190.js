/* TEST ONLY · DĀR AL TAWḤĪD · Visual Home Authority v1192 */
(function(){
"use strict";
if(window.__DAR_HOME_VISUAL_V1192)return;
var p=String(location.pathname||"");
if(!(p==="/test"||p.indexOf("/test/")===0))return;
window.__DAR_HOME_VISUAL_V1192=true;

var queued=false,observed=false;

var paths=[
 {nav:"topics",icon:"topics.png",title:"Tawḥīd & ʿAqīdah",desc:"Grundlagen, Beweise und Aussagen der Salaf."},
 {nav:"quran",icon:"quran.png",title:"Qurʾān & Tafsīr",desc:"Lesen, suchen, verstehen und direkt weiterlernen."},
 {nav:"hadith",icon:"hadith.png",title:"Sunnah & Ḥadīṯ",desc:"Authentische Überlieferungen und die Ḥadīṯ-Bibliothek."},
 {nav:"scholars",icon:"scholars.png",title:"Ṣaḥābah, Salaf & Gelehrte",desc:"Überlieferer, frühe Imāme und ihre Werke."},
 {nav:"books",icon:"library.png",title:"Bücher & Quellen",desc:"Geprüfte Werke, Quellen und Veröffentlichungen."}
];

function isHome(){return !!(document.body&&document.body.classList.contains("is-home-route"))}
function navTo(n){
 try{if(typeof window.navigate==="function"){window.navigate(n);return}}catch(e){}
 try{if(typeof navigate==="function"){navigate(n);return}}catch(e){}
 location.hash="#"+n;
}
function bind(root){
 if(!root)return;
 root.querySelectorAll("[data-dh2-nav]").forEach(function(b){
   if(b.dataset.dh2Bound==="1")return;
   b.dataset.dh2Bound="1";
   b.addEventListener("click",function(e){e.preventDefault();navTo(b.dataset.dh2Nav||"topics")});
 });
 root.querySelectorAll("[data-dh2-scroll]").forEach(function(b){
   if(b.dataset.dh2Bound==="1")return;
   b.dataset.dh2Bound="1";
   b.addEventListener("click",function(e){
     e.preventDefault();
     var t=document.getElementById(b.dataset.dh2Scroll||"homeSearchTitle");
     var s=t&&t.closest(".home-v380-section");
     if(!s)return;
     s.scrollIntoView({behavior:"smooth",block:"start"});
     setTimeout(function(){
       var i=s.querySelector("input[type='search'],input.search,input");
       try{if(i)i.focus({preventScroll:true})}catch(x){}
     },360);
   });
 });
}
function cleanupLegacy(){
 ["dklKnowledgeStage","dklKnowledgeIndex","dklContinue","dhHero1190","dhLibrary1190","dhContinue1190"].forEach(function(id){
   var el=document.getElementById(id);if(el)el.remove();
 });
 if(document.body)document.body.classList.remove("dar-knowledge-home-v1183");
 document.documentElement.classList.remove("dar-home-v1190");
}
function ensureHero(){
 var top=document.querySelector(".top-shell");
 var h=top&&top.querySelector(".header");
 if(!h)return;

 var media=h.querySelector("#dhHeroMedia1192");
 if(!media){
   media=document.createElement("picture");
   media.id="dhHeroMedia1192";
   media.className="dh2-hero-media";
   media.setAttribute("aria-hidden","true");
   media.innerHTML='<source media="(min-width:760px)" srcset="/test/assets/home-v1190/hero-wide-runway.jpg?v=1192"><img src="/test/assets/home-v1190/hero-mobile-adobe.jpg?v=1192" alt="" decoding="async">';
   h.insertBefore(media,h.firstChild);
 }

 var hero=h.querySelector("#dhHero1192");
 if(!hero){
   hero=document.createElement("section");
   hero.id="dhHero1192";
   hero.setAttribute("aria-label","Bibliothek des Wissens");
   hero.innerHTML=
     '<div class="dh2-kicker">Bibliothek des Wissens</div>'+
     '<h1 class="dh2-title"><strong>TAWḤĪD</strong><span>Das Fundament allen Wissens.</span></h1>'+
     '<p class="dh2-lead">Qurʾān, authentische Sunnah und die Überlieferungen der Salaf – geordnet, nachvollziehbar und ohne Umwege zugänglich.</p>'+
     '<nav class="dh2-links" aria-label="Direkte Wissenszugänge">'+
       '<button type="button" class="dh2-link" data-dh2-nav="topics">Tawḥīd &amp; ʿAqīdah</button>'+
       '<button type="button" class="dh2-link" data-dh2-nav="quran">Qurʾān</button>'+
       '<button type="button" class="dh2-link" data-dh2-nav="hadith">Sunnah &amp; Ḥadīṯ</button>'+
       '<button type="button" class="dh2-link" data-dh2-nav="books">Quellen</button>'+
     '</nav>'+
     '<button type="button" class="dh2-search" data-dh2-scroll="homeSearchTitle" aria-label="Wissen durchsuchen">'+
       '<img src="/test/assets/dar-3d-icons/ilm.png?v=1165" alt="">'+
       '<span>Qurʾān, Ḥadīṯ, Gelehrte und Themen durchsuchen</span><b>⌕</b>'+
     '</button>';
   var brand=h.querySelector(".header-row--brand-only");
   if(brand)brand.insertAdjacentElement("afterend",hero);else h.appendChild(hero);
 }
 var prayer=h.querySelector("#headerPrayerStatus")||document.getElementById("headerPrayerStatus");
 if(prayer&&prayer.parentNode!==h)h.appendChild(prayer);
 bind(hero);

 var isnad=document.querySelector(".isnad");
 if(isnad&&top){
   isnad.classList.remove("dkl-isnad");
   isnad.classList.add("dh2-isnad");
   if(isnad.parentNode!==top || h.nextElementSibling!==isnad)h.insertAdjacentElement("afterend",isnad);
 }
}
function pathHtml(x){
 return '<button type="button" class="dh2-path" data-dh2-nav="'+x.nav+'">'+
   '<span class="dh2-path-icon" aria-hidden="true"><img src="/test/assets/dar-3d-icons/'+x.icon+'?v=1165" alt=""></span>'+
   '<span class="dh2-path-copy"><b>'+x.title+'</b><span>'+x.desc+'</span></span>'+
   '<span class="dh2-path-go" aria-hidden="true">→</span>'+
 '</button>';
}
function sectionByTitle(shell,id){
 var t=document.getElementById(id);
 return t&&t.closest(".home-v380-section");
}
function placeAfter(node,anchor){
 if(!node||!anchor||node===anchor)return anchor;
 if(anchor.nextElementSibling!==node)anchor.insertAdjacentElement("afterend",node);
 return node;
}
function ensureMain(){
 var s=document.querySelector("#appView .home-v380-shell");
 if(!s)return;

 var lib=s.querySelector("#dhLibrary1192");
 if(!lib){
   lib=document.createElement("section");
   lib.id="dhLibrary1192";
   lib.innerHTML=
     '<div class="dh2-main-kicker">Direkter Zugang</div>'+
     '<h2 class="dh2-main-title">Deine Bibliothek</h2>'+
     '<p class="dh2-main-sub">Fünf klare Wege. Wissen ohne Umwege erreichen.</p>'+
     '<div class="dh2-paths">'+paths.map(pathHtml).join("")+'</div>'+
     '<article class="dh2-source-scene" aria-label="Quellenbibliothek">'+
       '<img class="dh2-source-media" src="/test/assets/home-v1190/library-mobile-runway.jpg?v=1192" alt="" aria-hidden="true">'+
       '<div class="dh2-source-copy"><small>Quellen zuerst</small><h3>Zu den Werken</h3><p>Von Aussagen direkt zu geprüften Büchern, Quellen und Veröffentlichungen.</p><button type="button" class="dh2-source-action" data-dh2-nav="books">Quellenbibliothek öffnen →</button></div>'+
     '</article>';
 }
 if(s.firstElementChild!==lib)s.insertBefore(lib,s.firstChild);
 bind(lib);

 var q=s.querySelector(".home-v380-quran-hero");
 var cont=s.querySelector("#dhContinue1192");
 if(q){
   if(!cont){
     cont=document.createElement("section");
     cont.id="dhContinue1192";
     cont.innerHTML='<div class="dh2-section-title"><h2>Weiterlernen</h2><span>Dein letzter Stand</span></div><div class="dh2-continue-body"></div>';
   }
   var b=cont.querySelector(".dh2-continue-body");
   if(q.parentNode!==b)b.appendChild(q);
   if(lib.nextElementSibling!==cont)lib.insertAdjacentElement("afterend",cont);
 }

 var rename={homeSearchTitle:"Wissen durchsuchen",homeTodayTitle:"Heute im DĀR",homeLibrariesTitle:"Bibliotheken & Quellen",homeDiscoverTitle:"Neu im Wissen"};
 Object.keys(rename).forEach(function(id){var e=document.getElementById(id);if(e)e.textContent=rename[id]});

 var anchor=cont||lib;
 ["homeSearchTitle","homeTodayTitle","homeLibrariesTitle","homeDiscoverTitle"].forEach(function(id){
   var sec=sectionByTitle(s,id);if(sec)anchor=placeAfter(sec,anchor);
 });

 document.querySelectorAll(".home-header-update-chip,#homeRefreshBtn,.home-refresh-icon-btn--header,.home-refresh-panel,.home-update-row-v416").forEach(function(el){
   el.style.setProperty("display","none","important");
 });
}
function sync(){
 if(!document.documentElement||!document.body)return;
 if(!isHome()){
   document.documentElement.classList.remove("dar-home-v1192");
   return;
 }
 cleanupLegacy();
 document.documentElement.classList.add("dar-home-v1192");
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
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",observe,{once:true});else observe();
})();