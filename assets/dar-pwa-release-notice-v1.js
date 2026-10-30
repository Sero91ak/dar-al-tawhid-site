/* DĀR AL TAWḤĪD · Android PWA shell release notice · isolated /pwa/
 * Existing user profiles, account sessions, local notes, and offline media
 * are never erased or reloaded without the user's explicit interaction. */
(function(){
"use strict";
if(!/^\/pwa(?:\/|$)/.test(location.pathname)||window.DAR_ANDROID_PWA_RELEASE_NOTICE_V1)return;
var banner=null,latest="",dismissed="";
function esc(v){return String(v||"").replace(/[&<>"']/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]})}
function hide(){if(banner){banner.hidden=true;banner.setAttribute("aria-hidden","true")}}
function ensure(){
 if(banner&&banner.isConnected)return banner;
 banner=document.getElementById("darPwaLiveNoticeV1");
 if(banner)return banner;
 banner=document.createElement("aside");
 banner.id="darPwaLiveNoticeV1";banner.className="dar-pwa-live-notice";
 banner.hidden=true;banner.setAttribute("aria-hidden","true");
 banner.setAttribute("role","status");banner.setAttribute("aria-live","polite");
 (document.body||document.documentElement).appendChild(banner);
 return banner
}
function show(revision){
 latest=String(revision||"").slice(0,90);
 if(!latest||latest===dismissed)return;
 var e=ensure();
 e.innerHTML='<div class="dar-pwa-live-copy"><strong>Neue DĀR-Version verfügbar</strong><span>Das aktuelle Dashboard mit Frauen-, Männer- und neutralem Profil ist bereit.</span></div>'+
 '<button type="button" data-dar-pwa-update="true">Jetzt aktualisieren</button>'+
 '<button type="button" class="dar-pwa-live-close" data-dar-pwa-dismiss="true" aria-label="Hinweis schließen">×</button>';
 e.hidden=false;e.setAttribute("aria-hidden","false")
}
function update(){
 hide();
 // Preserve URL/hash and local databases; no cache deletion or logout.
 // The dedicated /pwa/ worker already cached the newer online shell.
 try{location.reload()}catch(_){location.assign("/pwa/?pwa=1"+(location.hash||""))}
}
function onMessage(event){
 // Only the browser's same-origin scoped service worker can send this
 // event; it never carries account, identity or note information.
 var d=event&&event.data;
 if(!d||d.type!=="DAR_PWA_VISITOR_SHELL_UPDATED")return;
 if(typeof d.revision!=="string"||!/^visitor-android-[a-z0-9-]{2,70}$/.test(d.revision))return;
 if(d.revision===dismissed)return;
 show(d.revision);
}
document.addEventListener("click",function(ev){
 var btn=ev.target&&ev.target.closest&&ev.target.closest("#darPwaLiveNoticeV1 [data-dar-pwa-update],#darPwaLiveNoticeV1 [data-dar-pwa-dismiss]");
 if(!btn)return;
 ev.preventDefault();ev.stopPropagation();
 if(btn.hasAttribute("data-dar-pwa-update"))update();
 else{dismissed=latest;hide()}
},true);
if("serviceWorker" in navigator){
 navigator.serviceWorker.addEventListener("message",onMessage);
 // Ask the already-installed PWA worker for the latest deployment on
 // return to the app, without repeatedly downloading the large HTML shell.
 window.addEventListener("pageshow",function(){
  navigator.serviceWorker.getRegistration("/pwa/").then(function(reg){
   if(reg&&typeof reg.update==="function")reg.update().catch(function(){});
  }).catch(function(){})
 });
}
window.DAR_ANDROID_PWA_RELEASE_NOTICE_V1={show:show,hide:hide};
})();