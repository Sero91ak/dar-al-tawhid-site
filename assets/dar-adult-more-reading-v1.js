/* DAR Adult Mehr: global Arabic, transliteration and German reading controls. */
(function(){
"use strict";
if(window.__DAR_MORE_READING_V1)return;window.__DAR_MORE_READING_V1=true;
var KEY="darQuranViewSettingsV1",pairs=[["showArabic","Arabisch"],["showTransliteration","Lautschrift"],["showGerman","Deutsch"]],queued=false;
function get(){try{var x=JSON.parse(localStorage.getItem(KEY)||"null");return x&&typeof x==="object"?x:{}}catch(e){return {}}}
function sync(p){var s=get();p.querySelectorAll("[data-dar-more-reading]").forEach(function(b){var active=s[b.getAttribute("data-dar-more-reading")]!==false;b.setAttribute("aria-pressed",String(active))})}
function mount(){
 queued=false;if(!document.body?.classList.contains("is-more-route"))return;
 var page=document.querySelector("#appView .dar-more-v15");if(!page)return;
 var panel=page.querySelector("#darAdultMoreReadingV1");
 if(!panel){
  panel=document.createElement("section");panel.id="darAdultMoreReadingV1";panel.className="dar-more-reading";
  panel.setAttribute("aria-label","Globale Leseansicht");
  var title=document.createElement("span");title.className="dar-more-reading-title";title.textContent="Lesen";panel.appendChild(title);
  var options=document.createElement("div");options.className="dar-more-reading-options";
  pairs.forEach(function(pair){var b=document.createElement("button");b.type="button";b.className="dar-more-reading-button";b.textContent=pair[1];b.setAttribute("data-dar-more-reading",pair[0]);b.setAttribute("aria-label",pair[1]+" anzeigen");options.appendChild(b)});
  panel.appendChild(options);
  var head=page.querySelector(":scope > .view-head");if(head)head.insertAdjacentElement("afterend",panel);else page.prepend(panel);
 }
 sync(panel);
}
function queue(){if(queued)return;queued=true;requestAnimationFrame(mount)}
document.addEventListener("click",function(e){
 var b=e.target?.closest?.("#darAdultMoreReadingV1 [data-dar-more-reading]");if(!b)return;
 e.preventDefault();var key=b.getAttribute("data-dar-more-reading");
 if(!pairs.some(function(p){return p[0]===key}))return;
 var next=get(),value=next[key]===false;next[key]=value;
 try{if(typeof window.setQuranViewSettings==="function")window.setQuranViewSettings({[key]:value});else localStorage.setItem(KEY,JSON.stringify(next))}
 catch(e){try{localStorage.setItem(KEY,JSON.stringify(next))}catch(_){}}
 document.querySelectorAll("[data-quran-view]").forEach(function(el){if(el.getAttribute("data-quran-view")===key)el.hidden=!value});
 var p=b.closest("#darAdultMoreReadingV1");if(p)sync(p);
 try{window.dispatchEvent(new CustomEvent("dar:quran-view-settings-changed",{detail:{key:key,enabled:value}}))}catch(e){}
});
function start(){
 var host=document.getElementById("appView");
 if(host&&typeof MutationObserver==="function")new MutationObserver(queue).observe(host,{childList:true,subtree:false});
 window.addEventListener("hashchange",queue,{passive:true});
 window.addEventListener("pageshow",queue,{passive:true});
 window.addEventListener("storage",function(e){if(e.key===KEY)queue()});
 queue();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();