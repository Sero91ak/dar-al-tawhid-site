/* KIDS_ACADEMY_SEAMLESS_PORTAL_V1421
 * One visitor app, zero full-page redirects for Academy entry or exit.
 * Same-origin iframe preserves lesson storage and isolates its CSS.
 * No access to or modification of the saved child's identity or progress.
 */
(function(){
"use strict";
if(window.DARKidsAcademyPortalV1421)return;
var modal=null,frame=null,trigger=null,ready=false;
function one(s,r){return(r||document).querySelector(s)}
function create(){
 if(modal)return modal;
 modal=document.createElement("section");
 modal.id="kidsAcademyPortal";
 modal.className="kids-academy-portal";
 modal.setAttribute("role","dialog");
 modal.setAttribute("aria-label","Meine Lernakademie");
 modal.setAttribute("aria-modal","true");
 modal.hidden=true;
 var exit=document.createElement("button");
 exit.type="button";
 exit.className="kids-academy-portal-cancel";
 exit.setAttribute("aria-label","Zur Kinderwelt");
 exit.textContent="‹";
 exit.addEventListener("click",close);
 var loading=document.createElement("div");
 loading.className="kids-academy-portal-loading";
 loading.setAttribute("aria-hidden","true");
 loading.textContent="Lernakademie";
 frame=document.createElement("iframe");
 frame.id="kidsAcademyPortalFrame";
 frame.title="Lernakademie";
 frame.loading="eager";
 frame.setAttribute("allow","microphone; autoplay");
 frame.addEventListener("load",function(){
   ready=true;
   modal.classList.add("is-ready");
   if(!modal.hidden)frame.focus({preventScroll:true});
 });
 modal.append(frame,loading,exit);
 document.body.appendChild(modal);
 return modal;
}
function open(e){
 if(e&&typeof e.preventDefault==="function")e.preventDefault();
 create();
 trigger=(e&&e.currentTarget)||one(".kids-academy-tab");
 var girl=one(".app")?.getAttribute("data-gender")==="girl";
 modal.dataset.gender=girl?"girl":"boy";
 modal.hidden=false;
 modal.classList.add("is-open");
 document.documentElement.classList.add("kids-academy-portal-active");
 document.body.classList.add("kids-academy-portal-active");
 if(!frame.getAttribute("src")){
   frame.src="/kids/akademie/index.html?kidsPortal=1";
 }else if(ready){
   try{frame.contentWindow.postMessage({type:"DAR_KIDS_ACADEMY_RESUME_V1421"},location.origin)}catch(_){}
   frame.focus({preventScroll:true});
 }
}
function close(){
 if(!modal||modal.hidden)return;
 try{frame.contentWindow.postMessage({type:"DAR_KIDS_ACADEMY_PAUSE_V1421"},location.origin)}catch(_){}
 modal.classList.remove("is-open");
 modal.hidden=true;
 document.documentElement.classList.remove("kids-academy-portal-active");
 document.body.classList.remove("kids-academy-portal-active");
 try{trigger?.focus({preventScroll:true})}catch(_){}
}
function init(){
 var triggers=document.querySelectorAll("[data-academy-open]");
 if(!triggers.length)return;
 triggers.forEach(function(btn){
   // Both the central tab and Home's Academy hero open the same portal.
   // Capture on old anchors prevents browser navigation from stale markup.
   btn.addEventListener("click",open,btn.tagName==="A");
 });
 window.addEventListener("message",function(event){
   if(event.origin!==location.origin||!frame||event.source!==frame.contentWindow)return;
   if(event.data&&event.data.type==="DAR_KIDS_ACADEMY_CLOSE_V1421")close();
 });
 document.addEventListener("keydown",function(e){
   if(e.key==="Escape"&&modal&&!modal.hidden){e.preventDefault();close()}
 });
 window.DARKidsAcademyPortalV1421=Object.freeze({open,close});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
else init();
})();
