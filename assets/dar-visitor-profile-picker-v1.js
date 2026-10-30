/* DĀR AL TAWḤĪD VISITOR · classical gender profile selector · adult only */
(function(){
"use strict";
if(!(/^(\/|\/index\.html|\/pwa(?:\/|$))$/.test(location.pathname)))return;
if(window.DAR_VISITOR_PROFILE_PICKER_V1)return;
function api(){return window.DAR_VISITOR_SMART_PROFILE_V1}
function gender(){var p=api();return p&&p.get?p.get().gender:"neutral"}
function name(g){return g==="woman"?"Frau":g==="man"?"Mann":"Neutral"}
function image(g){var p=api();return p&&p.image?p.image(g):"/assets/dar-3d-icons/library.png"}
function markup(){
 var g=gender();
 return '<div class="dvp-chooser-head"><span>MEIN DĀR · PERSÖNLICH</span><h2>Mein Wissensprofil</h2><p>Wähle deinen persönlichen Schwerpunkt. Alle Bibliotheksinhalte bleiben zugänglich.</p></div>'+
 '<div class="dvp-chooser-options">'+[["woman","Frau","Frauenwissen und Fiqh direkt öffnen"],["man","Mann","Wissen, Tawḥīd, Qurʾān und Sunnah"],["neutral","Neutral","Allgemeine Wissenswelt"]].map(function(x){
 return '<button type="button" data-dvp-gender="'+x[0]+'" aria-pressed="'+String(g===x[0])+'" class="'+(g===x[0]?"is-active":"")+'"><img src="'+image(x[0])+'" alt="" decoding="async"><span><strong>'+x[1]+'</strong><small>'+x[2]+'</small></span><span class="dvp-check" aria-hidden="true">'+(g===x[0]?"✓":"")+'</span></button>'
 }).join("")+'</div><p class="dvp-chooser-foot">Die Auswahl ist jederzeit änderbar und beeinflusst nur Darstellung und Empfehlungen.</p>'
}
function setup(){
 var h=document.getElementById("darAdultBrandHeaderV2"),row=h&&h.querySelector(".dtbh-row");
 if(!row||!api())return false;
 if(h.querySelector("#darVisitorProfileButtonV1"))return true;
 var panel=document.createElement("section");
 panel.id="darVisitorProfilePanelV1";panel.className="dvp-chooser";panel.hidden=true;panel.setAttribute("role","dialog");
 panel.setAttribute("aria-label","Persönliches Wissensprofil auswählen");
 var trigger=document.createElement("button");
 trigger.type="button";trigger.id="darVisitorProfileButtonV1";trigger.className="dvp-trigger";
 trigger.setAttribute("aria-haspopup","dialog");trigger.setAttribute("aria-controls","darVisitorProfilePanelV1");trigger.setAttribute("aria-expanded","false");
 var avatar=document.createElement("img");avatar.alt="";avatar.decoding="async";avatar.width=36;avatar.height=40;trigger.appendChild(avatar);
 var theme=row.querySelector(".dtbh-toggle");
 if(theme)row.insertBefore(trigger,theme);else row.appendChild(trigger);
 h.appendChild(panel);
 function sync(){var g=gender();if(avatar.getAttribute("src")!==image(g))avatar.src=image(g);trigger.setAttribute("aria-label","Wissensprofil: "+name(g)+". Ändern");trigger.title="Profil: "+name(g);if(!panel.hidden)panel.innerHTML=markup()}
 function close(focus){panel.hidden=true;trigger.setAttribute("aria-expanded","false");if(focus)trigger.focus()}
 function open(){panel.innerHTML=markup();panel.hidden=false;trigger.setAttribute("aria-expanded","true");panel.querySelector("[data-dvp-gender].is-active")?.focus()}
 trigger.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();panel.hidden?open():close(false)});
 panel.addEventListener("click",function(e){var b=e.target.closest("[data-dvp-gender]");if(!b)return;
  e.preventDefault();var a=api();if(a&&a.setGender)a.setGender(b.dataset.dvpGender);
  document.dispatchEvent(new CustomEvent("dar:visitor-profile-changed",{detail:{gender:b.dataset.dvpGender}}));
  close(true);sync();
 });
 document.addEventListener("click",function(e){if(!panel.hidden&&!panel.contains(e.target)&&!trigger.contains(e.target))close(false)});
 document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!panel.hidden){e.preventDefault();close(true)}});
 document.addEventListener("dar:view-rendered",sync);document.addEventListener("dar:visitor-profile-changed",sync);
 window.addEventListener("pageshow",sync);
 window.DAR_VISITOR_PROFILE_PICKER_V1={open:open,close:close,refresh:sync};
 sync();return true
}
function boot(){if(setup())return;var n=0;var timer=setInterval(function(){n++;if(setup()||n>35)clearInterval(timer)},190)}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();