/* DĀR AL TAWḤĪD – V4.7 authorised home layout. TEST ONLY.
   Existing prayer/search/navigation/theme/3D-icon engines stay in control. */
(function(){
"use strict";
if(!/^\/test(?:\/|$)/.test(location.pathname)||/^\/test\/kids(?:\/|$)/.test(location.pathname))return;
if(window.__darHomeV47Layout)return;window.__darHomeV47Layout=true;
var waiting=false;
function home(){return !!(document.body&&document.body.classList.contains("is-home-route"))}
function make(tag,cls,txt){var x=document.createElement(tag);x.className=cls;if(txt)x.textContent=txt;return x}
var LANGUAGE_KEY="darAdultPreferredLocaleV1";
function language(){try{return localStorage.getItem(LANGUAGE_KEY)==="tr"?"tr":"de"}catch(_){return"de"}}
function switchLanguage(code){
 if(code!=="de"&&code!=="tr")return;
 try{localStorage.setItem(LANGUAGE_KEY,code)}catch(_){}
 syncLanguage();
 window.dispatchEvent(new CustomEvent("dar-adult-locale-changed",{detail:{locale:code}}));
}
function syncLanguage(){
 var box=document.getElementById("darHomeV47Language");if(!box)return;
 box.querySelectorAll("[data-dar-home-locale]").forEach(function(btn){btn.setAttribute("aria-pressed",String(btn.dataset.darHomeLocale===language()))});
}
function ensureLanguageStyle(){
 if(document.getElementById("dar-test-home-locale-style"))return;
 var style=document.createElement("style");style.id="dar-test-home-locale-style";
 style.textContent='body.is-home-route #darHomeV47Language{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:10px auto 14px;max-width:100%;padding:10px 0 0;border-top:1px solid color-mix(in srgb,currentColor 22%,transparent);background:transparent;color:inherit;font:600 12px/1.4 system-ui,-apple-system,sans-serif}#darHomeV47Language>span{opacity:.82;margin-right:3px}#darHomeV47Language button{min-height:40px;padding:8px 13px;border:1px solid color-mix(in srgb,currentColor 27%,transparent);border-radius:999px;background:transparent;color:inherit;font:600 12px system-ui,-apple-system,sans-serif;cursor:pointer;touch-action:manipulation}#darHomeV47Language button[aria-pressed="true"]{border-color:var(--gold,#bba273);background:color-mix(in srgb,var(--gold,#bba273) 13%,transparent)}#darHomeV47Language button:focus-visible{outline:2px solid var(--gold,#bba273);outline-offset:2px}';
 document.head.appendChild(style);
}
function mountLanguage(header,welcome){
 ensureLanguageStyle();
 var bar=document.getElementById("darHomeV47Language");
 if(!bar){
  bar=make("nav","dar-v47-language");bar.id="darHomeV47Language";
  bar.setAttribute("aria-label","Sprache wählen / Dil seçimi");
  bar.appendChild(make("span","","Sprache / Dil"));
  [["de","Deutsch"],["tr","Türkçe"]].forEach(function(pair){
   var btn=make("button","",pair[1]);btn.type="button";btn.dataset.darHomeLocale=pair[0];
   btn.addEventListener("click",function(){switchLanguage(pair[0])});bar.appendChild(btn);
  });
 }
 if(bar.parentElement!==header||bar.previousElementSibling!==welcome)welcome.insertAdjacentElement("afterend",bar);
 syncLanguage();
}
function sync(){
 if(!home()){document.documentElement.classList.remove("dar-home-v47-layout");return}
 var header=document.querySelector(".top-shell .header");
 var row=header&&header.querySelector(".header-row--brand-only");
 var prayer=document.getElementById("headerPrayerStatus");
 var hero=header&&header.querySelector("#dtHero1194");
 if(!header||!row||!prayer)return;
 document.documentElement.classList.add("dar-home-v47-layout");
 var lead=document.getElementById("darHomeV47Leadin");
 if(!lead){lead=make("p","dar-v47-leadin","BEITRÄGE NACH QURʾĀN, SUNNAH & ĀTHĀR");lead.id="darHomeV47Leadin"}
 if(lead.parentNode!==header||lead.nextElementSibling!==row)header.insertBefore(lead,row);
 var welcome=document.getElementById("darHomeV47Welcome");
 if(!welcome){
  welcome=make("section","dar-v47-welcome");welcome.id="darHomeV47Welcome";
  welcome.setAttribute("aria-label","Begrüßung");
  welcome.appendChild(make("h2","dar-v47-salam","As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh"));
  var intro=make("p","dar-v47-intro");
  intro.innerHTML='Willkommen bei <strong>DĀR AL TAWḤĪD</strong> – einer geordneten Wissens-App mit Beiträgen aus <strong>Qurʾān</strong>, <strong>Sunnah</strong>, den <strong>Āthār der frühen Imāme</strong> und einer umfangreichen Duʿāʾ-Sammlung aus Qurʾān und authentischer Sunnah.';
  welcome.appendChild(intro);
 }
 if(welcome.parentNode!==header)header.appendChild(welcome);
 mountLanguage(header,welcome);
 /* Original native prayer node stays in place with its own events/update calls. */
 prayer.classList.add("dar-v47-prayer");
 var search=hero&&hero.querySelector(".dt-hero-search-slot");
 if(search)search.classList.add("dar-v47-search");
 /* Reuse the V3 navigation and its original 3D icon images. */
 var quick=document.querySelector("#dv3Home .dv3-quick-grid");
 if(quick&&!quick.querySelector('[data-dv3-nav="frauen"]')){
  var b=make("button","dv3-quick dar-v47-women");b.type="button";b.dataset.dv3Nav="frauen";
  b.innerHTML='<span class="dv3-quick-icon"><img src="/test/assets/dar-3d-icons/frauen.png" alt="" loading="lazy"></span><span><b>Frauenbereich</b><small>Wissen &amp; Fiqh</small></span>';
  quick.appendChild(b);
 }
}
function queue(){
 if(waiting)return;waiting=true;
 requestAnimationFrame(function(){waiting=false;try{sync()}catch(e){console.warn("DĀR V4.7 Test layout",e)}});
}
function init(){
 queue();
 var view=document.getElementById("appView");
 if(view)new MutationObserver(queue).observe(view,{childList:true,subtree:false});
 var top=document.querySelector(".top-shell");
 if(top)new MutationObserver(queue).observe(top,{childList:true,subtree:true});
 new MutationObserver(queue).observe(document.body,{attributes:true,attributeFilter:["class"]});
 new MutationObserver(queue).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme","data-theme-variant"]});
 window.addEventListener("dar-adult-locale-changed",syncLanguage);
 window.addEventListener("storage",function(e){if(e.key===LANGUAGE_KEY)syncLanguage()});
 document.addEventListener("dar:view-rendered",queue);
 window.addEventListener("hashchange",queue);
 window.addEventListener("pageshow",queue);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();