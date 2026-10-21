/* DĀR AL TAWḤĪD – V4.7 authorised home layout. TEST ONLY.
   Existing prayer/search/navigation/theme/3D-icon engines stay in control. */
(function(){
"use strict";
if(!/^\/test(?:\/|$)/.test(location.pathname)||/^\/test\/kids(?:\/|$)/.test(location.pathname))return;
if(window.__darHomeV47Layout)return;window.__darHomeV47Layout=true;
var waiting=false;
function home(){return !!(document.body&&document.body.classList.contains("is-home-route"))}
function make(tag,cls,txt){var x=document.createElement(tag);x.className=cls;if(txt)x.textContent=txt;return x}
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
 // The fixed DĀR brand rail is the ONE brand authority. V4.7 used to
 // recreate a second gold lead-in + logo/title/subline below it. Keep the
 // original row in the DOM for older theme hooks, but never show it on Home.
 var hasFixedBrand=!!document.getElementById("darTestBrandHeaderV1");
 if(hasFixedBrand){
  if(lead&&lead.parentNode)lead.remove();
  row.hidden=true;row.setAttribute("aria-hidden","true");
  row.style.setProperty("display","none","important");
  row.style.setProperty("height","0","important");
  row.style.setProperty("min-height","0","important");
  row.style.setProperty("margin","0","important");
  row.style.setProperty("padding","0","important");
  var top=header.closest(".top-shell");
  if(top)top.style.setProperty("padding-top","0","important");
  header.style.setProperty("padding-top","0","important");
  // Real, live prayer hub, not a cloned or static replacement.
  if(prayer.parentElement===header&&header.firstElementChild!==prayer)
   header.insertBefore(prayer,header.firstElementChild);
 }else{
  row.hidden=false;row.removeAttribute("aria-hidden");row.style.removeProperty("display");
  if(lead.parentNode!==header||lead.nextElementSibling!==row)header.insertBefore(lead,row);
 }
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
 document.addEventListener("dar:view-rendered",queue);
 document.addEventListener("dar:brand-header-mounted",queue);
 window.addEventListener("hashchange",queue);
 window.addEventListener("pageshow",queue);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();