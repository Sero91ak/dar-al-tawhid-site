/* DĀR AL TAWḤĪD — V8 UNIFIED APP SHELL (test branch only)
 * Presentation adapter for EVERY adult TEST route.
 * Never replaces #appView markup, readers, share actions, source links or engines.
 * Route, account, prayer/GPS, audio, icons, language, theme, and notifications
 * continue to be served by their existing original implementations.
 */
(function(w,d){
"use strict";
if(!/^\/test(?:\/|$)/.test(w.location.pathname)||/^\/test\/kids(?:\/|$)/.test(w.location.pathname))return;
if(w.__DAR_V8_UNIFIED_SHELL_V1)return;
w.__DAR_V8_UNIFIED_SHELL_V1=true;
var root=d.documentElement, scheduled=0, observed=null;
var ROUTES=[
 ["duas","Duʿāʾ","dua.png"],
 ["bibliothek","Bibliothek","library.png"],
 ["hadith","Ḥadīṯ","hadith.png"],
 ["frauen","Frauen","frauen.png"],
 ["prayer","Gebetszeiten","prayer.png"],
 ["quiz","Quiz","quiz.png"],
 ["settings","Einstellungen","settings.png"]
];
var ICON="/test/assets/dar-3d-icons/";
function elem(tag,cls,text){var e=d.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e}
function route(){
 var hash=decodeURIComponent((w.location.hash||"#home").replace(/^#/,""));
 var first=hash.split(/[/?]/)[0]||"home";
 var normalize={start:"home",beitraege:"topics",dua:"duas",mehr:"more",einstellungen:"settings",gebetszeiten:"prayer",qiblah:"qibla",bibliothek:"bibliothek"};
 return normalize[first]||first;
}
function routeFamily(v){
 if(["post","topics","topic","news","news-detail","saved"].indexOf(v)>=0)return "publications";
 if(["quran","quran-surah","quran-player","quran-topic"].indexOf(v)>=0)return "quran";
 if(["duas","dua","dua-cat"].indexOf(v)>=0)return "dua";
 if(["books","bibliothek","bibliothek-detail","bibliothek-reader","quellen-book","quellen-scholar"].indexOf(v)>=0)return "library";
 if(["more","settings","account","about","notifications"].indexOf(v)>=0)return "settings";
 if(["prayer","jummah","qibla","calendar"].indexOf(v)>=0)return "utilities";
 if(["quiz","ilm","hadith","frauen","scholars","propheten"].indexOf(v)>=0)return "learning";
 return v==="home"?"home":"general";
}
function go(route,value){
 if(typeof w.navigate==="function"){w.navigate(route,value||"");return}
 w.location.hash="#"+route+(value?"/"+encodeURIComponent(value):"");
}
function enhanceRail(){
 var rail=d.getElementById("darV8DuoRail");
 if(!rail)return;
 var aside=rail.querySelector("#darV8GlobalRailExtras");
 if(!aside){
  aside=elem("div","dar-v8-global-rail-extras");
  aside.id="darV8GlobalRailExtras";
  var label=elem("div","dar-v8-global-rail-label","BEREICHE");
  aside.appendChild(label);
  ROUTES.forEach(function(cfg){
   var b=elem("button","dar-v8-global-link");
   b.type="button";b.dataset.v8Goto=cfg[0];b.setAttribute("aria-label",cfg[1]);
   var img=d.createElement("img");img.src=ICON+cfg[2];img.alt="";img.loading="lazy";img.width=24;img.height=24;
   b.appendChild(img);b.appendChild(elem("span","dar-v8-global-link-text",cfg[1]));
   aside.appendChild(b);
  });
  rail.appendChild(aside);
  aside.addEventListener("click",function(e){
   var b=e.target.closest("[data-v8-goto]");if(b)go(b.dataset.v8Goto);
  });
 }
 var current=route();
 Array.prototype.forEach.call(aside.querySelectorAll("[data-v8-goto]"),function(b){
  var active=b.dataset.v8Goto===current;
  b.classList.toggle("is-current",active);
  if(active)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current");
 });
}
function enhanceToolbar(){
 var bar=d.querySelector(".app-bar");
 if(!bar||bar.querySelector("#darV8GlobalSearchBtn"))return;
 var b=elem("button","dar-v8-global-search","⌕");
 b.id="darV8GlobalSearchBtn";b.type="button";b.title="Inhalte und Quellen suchen";
 b.setAttribute("aria-label","Inhalte und Quellen suchen");
 bar.appendChild(b);
 b.addEventListener("click",function(){
  go("topics");
  w.requestAnimationFrame(function(){
   var input=d.querySelector("#homeSearchInput,.search-input-field,input[type=search]");
   if(input&&typeof input.focus==="function")input.focus();
  });
 });
}
function revealSocialLinks(){
 var name=route();
 if(name!=="more")return;
 var host=d.querySelector("#appView .more-page,#appView .dar-more-v15,#appView .dm15-page,#appView .dm15-shell");
 if(!host)return;
 if(host.querySelector("#darV8SocialDestinations"))return;
 var links=Array.prototype.slice.call(d.querySelectorAll("footer .footer-social-link")).filter(function(a){
  return /^https:\/\//.test(a.href);
 });
 if(!links.length)return;
 var section=elem("section","dar-v8-social");
 section.id="darV8SocialDestinations";
 section.appendChild(elem("span","dar-v8-social-kicker","UNSERE KANÄLE"));
 section.appendChild(elem("h2","","DĀR AL TAWḤĪD folgen"));
 section.appendChild(elem("p","","Originalkanäle öffnen. Beiträge, Duʿāʾ und Verse lassen sich weiterhin direkt in ihren Lesebereichen teilen."));
 var group=elem("div","dar-v8-social-links");
 links.forEach(function(link){
  var clone=link.cloneNode(true);clone.removeAttribute("id");clone.setAttribute("rel","noopener noreferrer");
  clone.setAttribute("target","_blank");group.appendChild(clone);
 });
 section.appendChild(group);host.appendChild(section);
}
function preserveShareUI(){
 // Read-only markers make QA possible; DO NOT move or rewrite share DOM.
 var view=d.getElementById("appView");
 if(!view)return;
 var names=[
  '[data-post-share-open]','#shareDuaBtn',
  '.post-share-quick-btn','[data-qrc-ayah-action="share"]',
  '[data-quran-share]','[data-share]'
 ];
 var found=names.some(function(s){return !!view.querySelector(s)});
 if(found)view.dataset.v8NativeShare="preserved";
}
function setSection(){
 var name=route(),family=routeFamily(name);
 if(root.dataset.v8Section!==name)root.dataset.v8Section=name;
 if(root.dataset.v8Family!==family)root.dataset.v8Family=family;
 root.classList.add("dar-v8-unified");
 var host=d.getElementById("appView");
 if(host&&host.dataset.v8Family!==family)host.dataset.v8Family=family;
 enhanceToolbar();if(!w.__DAR_V8_COMPLETE_SHELL_V1)enhanceRail();revealSocialLinks();preserveShareUI();
}
function raf(){
 if(scheduled)return;
 scheduled=w.requestAnimationFrame(function(){scheduled=0;setSection()});
}
function boot(){
 setSection();
 var host=d.getElementById("appView");
 if(host&&w.MutationObserver){
  observed=new MutationObserver(raf);
  observed.observe(host,{childList:true,subtree:false});
 }
 w.addEventListener("hashchange",raf,{passive:true});
 w.addEventListener("resize",raf,{passive:true});
 w.addEventListener("dar:layoutchange",raf,{passive:true});
 d.addEventListener("dar:view-rendered",raf);
 w.DarV8UnifiedShell=Object.freeze({refresh:raf,currentSection:route});
}
if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})(window,document);
