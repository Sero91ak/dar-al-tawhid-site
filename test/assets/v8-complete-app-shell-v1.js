/* DĀR AL TAWḤĪD · DAR TEST V8 COMPLETE APP SHELL · 2026-10-22
   UI presentation only: original articles, Qur'an text, Du'a, sources,
   share/deep links, account, player, prayer, GPS, themes and push remain owners.
   Entire module removable via TWO references in test/index.html. */
(function(w,d){
"use strict";
if(!/^\/test(?:\/|$)/.test(w.location.pathname)||/^\/test\/kids(?:\/|$)/.test(w.location.pathname))return;
if(w.__DAR_V8_COMPLETE_SHELL_V1)return;
w.__DAR_V8_COMPLETE_SHELL_V1=true;
var root=d.documentElement,sidebar=null,lastRoute="",frame=0,settingsRef=null;
var SECTIONS=[
 ["home","Start","home.png","Startseite"],
 ["quran","Qurʾān","quran.png","Qurʾān lesen"],
 ["recent","Beiträge","posts.png","Beiträge lesen"],
 ["topics","ʿIlm & Wissen","ilm.png","Themen und Wissen"],
 ["duas","Duʿāʾ","dua.png","Duʿāʾ-Bibliothek"],
 ["books","Quellen","library.png","Quellenbibliothek"],
 ["bibliothek","PDF-Bibliothek","library.png","PDF-Bibliothek"],
 ["hadith","Ḥadīṯ","hadith.png","Ḥadīṯ"],
 ["scholars","Gelehrte","scholars.png","Gelehrtenverzeichnis"],
 ["frauen","Frauen","frauen.png","Frauenbereich"],
 ["quiz","Quiz","quiz.png","Dīn-Quiz"],
 ["prayer","Gebetszeiten","prayer.png","Gebetszeiten"],
 ["saved","Favoriten","saved.png","Gespeicherte Beiträge"],
 ["account","Konto","lock.png","Konto und Anmeldung"],
 ["settings","Einstellungen","settings.png","Einstellungen"],
 ["more","Mehr","more.png","Weitere Bereiche"]
];
function make(tag,cls,txt){var el=d.createElement(tag);if(cls)el.className=cls;if(txt!=null)el.textContent=txt;return el}
function currentRoute(){
 var h=(w.location.hash||"#home").replace(/^#/,"").split("/")[0];
 return h||"home";
}
function sidebarParent(route){
 if(["post","topic","news","news-detail","series"].indexOf(route)>=0)return "recent";
 if(["quran-surah","quran-player","quran-topic","quran-topics","quran-search"].indexOf(route)>=0)return "quran";
 if(["dua","dua-cat","dua-detail"].indexOf(route)>=0)return "duas";
 if(["bibliothek-detail","bibliothek-reader"].indexOf(route)>=0)return "bibliothek";
 if(["quellen-book","quellen-scholar","book"].indexOf(route)>=0)return "books";
 if(["scholar","scholar-detail"].indexOf(route)>=0)return "scholars";
 if(["jummah","qibla","calendar"].indexOf(route)>=0)return "prayer";
 if(["notifications"].indexOf(route)>=0)return "settings";
 return route;
}
function navigate(view){
 if(typeof w.navigate==="function"){w.navigate(view);return}
 w.location.hash="#"+encodeURIComponent(view);
}
function ensureSideSections(){
 var rail=d.getElementById("darV8DuoRail");
 if(!rail||rail===sidebar)return;
 sidebar=rail;
 rail.classList.add("dar-v8-global-rail");
 var brand=rail.querySelector(".dar-v8-duo-rail-head");
 if(brand&&!brand.querySelector(".dar-v8-rail-expanded-title")){
  brand.appendChild(make("span","dar-v8-rail-expanded-title","DĀR AL TAWḤĪD"));
 }
 var wrap=rail.querySelector("#darV8GlobalSecondary");
 if(!wrap) {
  wrap=make("div","dar-v8-global-secondary");
  wrap.id="darV8GlobalSecondary";
  var label=make("span","dar-v8-global-secondary-label","WISSENSZENTRUM");
  wrap.appendChild(label);
  var list=make("div","dar-v8-global-secondary-list");
  for(var i=0;i<SECTIONS.length;i++){
   var spec=SECTIONS[i],button=make("button","dar-v8-section-link");
   button.type="button";button.dataset.v8SectionNav=spec[0];
   button.setAttribute("aria-label",spec[3]);
   var img=make("img","dar-v8-section-image");
   img.src="/test/assets/dar-3d-icons/"+spec[2];
   img.alt="";img.loading="lazy";img.decoding="async";
   img.onerror=function(){this.style.display="none"};
   var text=make("span","dar-v8-section-title",spec[1]);
   button.append(img,text);
   list.appendChild(button);
  }
  wrap.appendChild(list);
  rail.appendChild(wrap);
  rail.addEventListener("click",function(e){
   var target=e.target.closest("[data-v8-section-nav]");
   if(!target)return;
   e.preventDefault();navigate(target.dataset.v8SectionNav);
  });
 }
}
function syncSection(){
 var route=currentRoute();
 if(route!==lastRoute){
  lastRoute=route;
  root.dataset.v8Route=route;
 }
 if(sidebar){
  sidebar.querySelectorAll("[data-v8-section-nav]").forEach(function(button){
    var key=button.dataset.v8SectionNav;
    var active=key===sidebarParent(route);
    button.classList.toggle("is-active",active);
    if(active)button.setAttribute("aria-current","page");
    else button.removeAttribute("aria-current");
  });
 }
}
function enhanceHeader(){
 var shell=d.querySelector(".top-shell");
 if(!shell)return;
 // Original logo and prayer status are kept; only add semantic roles.
 shell.classList.add("dar-v8-header-shell");
 var brand=shell.querySelector(".brand-main");
 if(brand)brand.classList.add("dar-v8-brand");
 var actions=d.getElementById("darV8QuickActions");
 if(actions)actions.setAttribute("aria-label","Schnellzugriff auf Sprache, Konto und Erscheinungsbild");
}
function enhanceSettings(){
 var home=d.querySelector("body.is-settings-route #appView .dsh-home");
 if(!home||home===settingsRef)return;
 settingsRef=home;
 home.classList.add("dar-v8-settings-dashboard");
 // Existing colors, font, logo/icon, location and notification controls
 // are preserved and stay wired to their original handlers.
 var group=home.querySelector(".dar-v8-language-group");
 if(group)group.classList.add("dar-v8-settings-language");
}
function protectContent(){
 // Explicit markers for human and automated QA: no content replacement.
 var main=d.getElementById("appView");
 if(!main)return;
 var readers=main.querySelectorAll(
  ".post-reader,.quran-ayah-list,.quran-reader-shell,.qrc-shell,.dua-detail-box,.post-body,.article,.post-share-modal,.qrc-ayah-share");
 readers.forEach(function(el){el.dataset.v8OriginalReader="1"});
}
function update(){
 frame=0;if(!d.body)return;
 root.classList.add("dar-v8-shell");
 root.dataset.v8Viewport=(root.clientWidth||w.innerWidth)<600?"phone":((root.clientWidth||w.innerWidth)<1080?"medium":"wide");
 ensureSideSections();syncSection();enhanceHeader();enhanceSettings();protectContent();
 // Older V3 home code has a 7-language strip that bypasses the newer
 // availability checks. The v8 shell uses the authoritative 9-language picker.
}
function schedule(){
 if(frame)return;
 frame=w.requestAnimationFrame(update);
}
function start(){
 schedule();
 var host=d.getElementById("appView");
 if(host&&w.MutationObserver){
  var observer=new MutationObserver(schedule);
  observer.observe(host,{childList:true,subtree:false});
 }
 w.addEventListener("hashchange",schedule,{passive:true});
 w.addEventListener("resize",schedule,{passive:true});
 w.addEventListener("dar:layoutchange",schedule,{passive:true});
 d.addEventListener("dar:view-rendered",schedule);
 w.addEventListener("dar-adult-locale-changed",schedule);
}
w.DarV8CompleteShell=Object.freeze({sync:schedule,sections:SECTIONS.map(function(x){return x[0]})});
if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",start,{once:true});
else start();
})(window,document);
