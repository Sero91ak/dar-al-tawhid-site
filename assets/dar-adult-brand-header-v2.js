
(function(){
"use strict";
if(/^\/(?:kids|test\/kids)(?:\/|$)/.test(location.pathname))return;
if(window.__DAR_ADULT_GLOBAL_BRAND_HEADER_V2)return;
window.__DAR_ADULT_GLOBAL_BRAND_HEADER_V2=true;
var OPTIONS=[["light","Hell","#f8f2e5"],["soft","Sanft Elegant","#eacbc9"],["eisgold","Eisgold","#d4b76c"],["salbei","Salbei Elfenbein","#a1bca9"],["dark","Klassisch Dunkel","#141a15"],["royal","Royal Nachtblau","#112f4f"],["bordeaux","Bordeaux Royal","#592d42"],["dar-al-layl","Dār al-Layl","#1c3328"]];
function start(){
 if(!document.getElementById("appView")||document.getElementById("darAdultBrandHeaderV2"))return;
 var app=document.querySelector("body > .app")||document.querySelector(".app");
 if(!app||!document.body)return;
 var header=document.createElement("header");
 header.id="darAdultBrandHeaderV2";
 header.setAttribute("aria-label","DĀR AL TAWḤĪD · App-Kopf");
 header.innerHTML='<div class="dtbh-row"><img class="dtbh-logo" alt="DĀR AL TAWḤĪD Logo"><div class="dtbh-copy"><span class="dtbh-tagline">Beiträge nach Qurʾān, Sunnah und Āthār</span><strong class="dtbh-name">DĀR AL TAWḤĪD</strong></div><button type="button" class="dtbh-toggle" aria-label="Erscheinungsbild auswählen" title="Erscheinungsbild auswählen" aria-haspopup="true" aria-expanded="false" aria-controls="darAdultBrandPaletteV2"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M12 3a9 9 0 0 0 0 18c2 0 3.4-1.6 3.4-3.1 0-1.1-.9-1.8-.9-2.6 0-.8.7-1.4 1.8-1.4h1.8a3 3 0 0 0 3-3A9 9 0 0 0 12 3Z"></path><circle cx="7.6" cy="10" r="1"></circle><circle cx="10.8" cy="6.7" r="1"></circle><circle cx="6.9" cy="14.1" r="1"></circle></svg></button></div><div id="darAdultBrandPaletteV2" class="dtbh-panel" role="group" aria-label="Erscheinungsbild" hidden><span class="dtbh-panel-title">Erscheinungsbild auswählen</span><div class="dtbh-grid"></div></div>';
 document.body.insertBefore(header,document.body.firstChild);
 var logo=header.querySelector(".dtbh-logo");
 function syncLogo(){
  var original=document.querySelector(".top-shell img.logo,.top-shell .brand img.logo");
  var src=original&&(original.getAttribute("src")||original.currentSrc);
  if(src&&logo.getAttribute("src")!==src)logo.setAttribute("src",src);
  else if(!logo.getAttribute("src"))logo.setAttribute("src","/app-icon-512.png");
 }
 syncLogo();
 var spacer=document.createElement("div");
 spacer.id="darAdultBrandHeaderSpacerV2";
 spacer.setAttribute("aria-hidden","true");
 app.insertBefore(spacer,app.firstChild);
 /* FIXED_HEADER_OCCLUSION_V1: measure the actual native/browser header
    once, for the spacer, nested sticky sections and scroll targets. */
 function sizing(){
  var rect=header.getBoundingClientRect();
  var height=Math.ceil(rect.height);
  if(height>0&&height<260){
   document.documentElement.style.setProperty("--dar-adult-brand-header-height",height+"px");
   document.documentElement.style.setProperty("--dar-adult-header-obscured-top",Math.ceil(Math.max(0,rect.bottom))+"px");
  }
 }
 if(typeof ResizeObserver==="function")new ResizeObserver(sizing).observe(header);
 window.addEventListener("resize",sizing,{passive:true});
 window.addEventListener("orientationchange",sizing,{passive:true});
 window.addEventListener("pageshow",sizing);
 document.addEventListener("dar:view-rendered",sizing);
 if(window.visualViewport)window.visualViewport.addEventListener("resize",sizing,{passive:true});
 var panel=header.querySelector(".dtbh-panel");
 var toggle=header.querySelector(".dtbh-toggle");
 var grid=header.querySelector(".dtbh-grid");
 OPTIONS.forEach(function(item){
  var btn=document.createElement("button");
  btn.type="button";btn.className="dtbh-choice";btn.setAttribute("data-dtbh-theme",item[0]);
  var swatch=document.createElement("span");swatch.className="dtbh-swatch";swatch.style.background=item[2];swatch.setAttribute("aria-hidden","true");
  var name=document.createElement("span");name.textContent=item[1];
  btn.appendChild(swatch);btn.appendChild(name);grid.appendChild(btn);
 });
 function current(){
  var root=document.documentElement;
  return root.getAttribute("data-theme-variant")==="salbei"?"salbei":root.getAttribute("data-theme")||"dark";
 }
 function refresh(){
  var value=current();
  grid.querySelectorAll(".dtbh-choice").forEach(function(button){button.setAttribute("aria-pressed",String(button.getAttribute("data-dtbh-theme")===value));});
 }
 function close(){panel.hidden=true;toggle.setAttribute("aria-expanded","false");}
 toggle.addEventListener("click",function(e){
  e.stopPropagation();panel.hidden=!panel.hidden;toggle.setAttribute("aria-expanded",String(!panel.hidden));refresh();
 });
 grid.addEventListener("click",function(e){
  var btn=e.target.closest("[data-dtbh-theme]");if(!btn)return;
  var value=btn.getAttribute("data-dtbh-theme");close();
  var existing=document.querySelector('.theme-switch-btn[data-theme-select="'+value+'"]');
  if(existing){existing.click();refresh();return;}
  try{
   if(typeof applyTheme==="function"){applyTheme(value);refresh();return;}
   if(typeof window.applyTheme==="function"){window.applyTheme(value);refresh();return;}
  }catch(_){}
  try{if(typeof navigate==="function")navigate("settings","appearance");else location.hash="#settings";}catch(_){location.hash="#settings";}
 });
 document.addEventListener("click",function(e){if(!header.contains(e.target))close();});
 document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!panel.hidden){close();toggle.focus();}});
 new MutationObserver(refresh).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme","data-theme-variant"]});
 document.addEventListener("dar:view-rendered",syncLogo);
 window.addEventListener("pageshow",syncLogo);
 document.documentElement.classList.add("dar-adult-global-brand-ready");
 refresh();sizing();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
else start();
})();

/* DAR_ADULT_APP_HOME_GREETING_V5 · app-only, no desktop injection.
 * Keep the single fixed branded rail. Scrollable content begins with the
 * Qurʾān/Sunnah/Āthār source line, the ORIGINAL live prayer hub, then the
 * restored complete Salām and welcome text. Other routes unaffected. */
(function(){
"use strict";
if(/^\/(?:kids|test\/kids)(?:\/|$)/.test(location.pathname))return;
var queued=false;
function isHome(){return !!(document.body&&document.body.classList.contains("is-home-route"))}
function make(tag,id,cls,html){
 var x=document.createElement(tag);x.id=id;x.className=cls;x.innerHTML=html;return x;
}
function order(){
 var top=document.querySelector(".top-shell"),h=top&&top.querySelector(".header");
 if(!h||!document.body)return;
 if(!isHome()){
  h.style.removeProperty("padding-top");top.style.removeProperty("padding-top");return;
 }
 // Only the adult native app / dedicated PWA gets this injected header.
 if(!document.getElementById("darAdultBrandHeaderV2"))return;
 var p=h.querySelector("#headerPrayerStatus");if(!p)return;
 h.querySelectorAll(".dar-v47-leadin,#darHomeV47Leadin").forEach(function(el){el.remove()});
 var legacy=h.querySelector(".header-row--brand-only");
 if(legacy){
  legacy.hidden=true;legacy.setAttribute("aria-hidden","true");
  legacy.style.setProperty("display","none","important");
  legacy.style.setProperty("margin","0","important");
  legacy.style.setProperty("padding","0","important");
 }
 h.style.setProperty("padding-top","0","important");
 top.style.setProperty("padding-top","0","important");
 var kicker=h.querySelector("#darAdultHomeSourceV5");
 if(!kicker) kicker=make("div","darAdultHomeSourceV5","dar-adult-home-source-v5",
   "Beiträge nach Qurʾān, Sunnah und Āthār");
 var welcome=h.querySelector("#darAdultHomeWelcomeV5");
 if(!welcome)welcome=make("section","darAdultHomeWelcomeV5","dar-adult-home-welcome-v5",
  '<h2 class="dar-adult-home-salam-v5">As-Salāmu ʿalaykum wa Raḥmatullāhi wa Barakātuh</h2>'+
  '<span class="dar-adult-home-rule-v5" aria-hidden="true"></span>'+
  '<p>Willkommen bei <strong>DĀR AL TAWḤĪD</strong> – einer geordneten Wissens-App mit Beiträgen aus <strong>Qurʾān</strong>, <strong>Sunnah</strong>, den <strong>Āthār der frühen Imāme</strong> und einer umfangreichen Duʿāʾ-Sammlung aus Qurʾān und authentischer Sunnah.</p>');
 welcome.setAttribute("aria-label","Willkommen bei DĀR AL TAWḤĪD");
 // Idempotent three-part sequence: never clone prayer, disturb its data,
 // force scrollTop or create independent scroll containers.
 if(kicker.parentElement!==h||h.firstElementChild!==kicker)h.insertBefore(kicker,h.firstElementChild);
 if(p.previousElementSibling!==kicker)h.insertBefore(p,kicker.nextElementSibling);
 if(welcome.parentElement!==h||welcome.previousElementSibling!==p)
  h.insertBefore(welcome,p.nextElementSibling);
}
function queue(){
 if(queued)return;queued=true;
 requestAnimationFrame(function(){queued=false;try{order()}catch(e){console.warn("DAR home greeting",e)}});
}
document.addEventListener("dar:view-rendered",queue);
window.addEventListener("hashchange",queue);
window.addEventListener("pageshow",queue);
function boot(){
 queue();
 var h=document.querySelector(".top-shell .header");
 if(h)new MutationObserver(queue).observe(h,{childList:true});
 new MutationObserver(queue).observe(document.body,{attributes:true,attributeFilter:["class"]});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
else boot();
})();
