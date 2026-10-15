/* TAWḤĪD KIDS — V1422.
 * The Academy remains in its same-origin iframe, WITH the real Kids dock.
 * Reuse the one existing five-tab navigation; never clone tabs or reload Home.
 * Academy viewport ends above the dock's measured top edge (iOS safe areas).
 * Child profiles and lesson progress are never rewritten by navigation.
 */
(function(){
"use strict";
if(window.DARKidsAcademyPortalV1421)return;
var modal=null,frame=null,trigger=null,ready=false,closingTimer=null,previousTab=null,resizeObserver=null,openToken=0;
var GAP=8;
function one(selector,root){return(root||document).querySelector(selector)}
function dock(){return one(".app > .bottom-nav")||one(".bottom-nav")}
function dockClearance(){
 var nav=dock(),rect=nav&&nav.getBoundingClientRect();
 var viewportHeight=window.innerHeight||document.documentElement.clientHeight||0;
 return rect&&rect.height>0 ? Math.max(96,Math.ceil(viewportHeight-rect.top+GAP)) : 128;
}
function measure(){
 if(!modal||modal.hidden)return;
 var clearance=dockClearance()+"px";
 modal.style.setProperty("--kids-academy-dock-clearance",clearance);
 try{
   var root=frame&&frame.contentDocument&&frame.contentDocument.documentElement;
   if(root)root.style.setProperty("--kids-academy-dock-clearance",clearance);
 }catch(_){}
}
function selectLearn(){
 var nav=dock(),learn=one(".kids-academy-tab",nav);
 if(!learn)return;
 previousTab=one(".nav-btn.active",nav)||null;
 nav.querySelectorAll(".nav-btn").forEach(function(button){
   button.classList.toggle("active",button===learn);
 });
 learn.setAttribute("aria-current","page");
}
function restorePrevious(){
 var nav=dock(),learn=one(".kids-academy-tab",nav);
 if(!nav)return;
 var previous=previousTab&&previousTab.isConnected?previousTab:null;
 if(previous){
   nav.querySelectorAll(".nav-btn").forEach(function(button){button.classList.toggle("active",button===previous)});
 }else if(learn){
   learn.classList.remove("active");
 }
 if(learn)learn.removeAttribute("aria-current");
 previousTab=null;
}
function create(){
 if(modal)return modal;
 var nav=dock();
 if(!nav||!nav.parentNode)return null;
 modal=document.createElement("section");
 modal.id="kidsAcademyPortal";
 modal.className="kids-academy-portal";
 // Navigation remains interactive and outside this region; don't use aria-modal.
 modal.setAttribute("role","region");
 modal.setAttribute("aria-label","Meine Lernakademie");
 modal.hidden=true;
 // The underlying dock floats above a full-height scroll canvas.
 modal.style.setProperty("height","100dvh","important");
 modal.style.setProperty("max-height","100dvh","important");
 modal.style.setProperty("transform","none","important");
 modal.style.setProperty("transition","opacity 220ms cubic-bezier(.22,.75,.22,1)","important");
 var exit=document.createElement("button");
 exit.type="button";
 exit.className="kids-academy-portal-cancel";
 exit.setAttribute("aria-label","Zur Kinderwelt");
 exit.textContent="‹";
 exit.addEventListener("click",function(){close(false)});
 var loading=document.createElement("div");
 loading.className="kids-academy-portal-loading";
 loading.setAttribute("aria-hidden","true");
 loading.textContent="Lernakademie";
 loading.style.fontSize="15px";
 frame=document.createElement("iframe");
 frame.id="kidsAcademyPortalFrame";
 frame.title="Lernakademie";
 frame.loading="eager";
 frame.setAttribute("allow","microphone; autoplay");
 frame.addEventListener("load",function(){
   ready=true;
   measure();
   requestAnimationFrame(function(){if(modal)modal.classList.add("is-ready")});
 });
 modal.append(frame,loading,exit);
 // Critical: sibling of the SAME existing dock, in the SAME .app stacking context.
 // In particular, never append to body: that would hide the bottom navigation.
 nav.parentNode.insertBefore(modal,nav);
 if(typeof ResizeObserver==="function"){
   resizeObserver=new ResizeObserver(function(){requestAnimationFrame(measure)});
   resizeObserver.observe(nav);
 }
 return modal;
}
function open(event){
 if(event&&typeof event.preventDefault==="function")event.preventDefault();
 if(!create())return;
 trigger=(event&&event.currentTarget)||one(".kids-academy-tab");
 var girl=one(".app")?.getAttribute("data-gender")==="girl";
 modal.dataset.gender=girl?"girl":"boy";
 if(closingTimer){clearTimeout(closingTimer);closingTimer=null}
 modal.style.pointerEvents="";
 var wasOpen=!modal.hidden&&modal.classList.contains("is-open");
 var token=++openToken;
 modal.hidden=false;
 document.documentElement.classList.add("kids-academy-portal-active");
 document.body.classList.add("kids-academy-portal-active");
 if(!wasOpen)selectLearn();
 measure();
 if(!wasOpen){
   modal.classList.remove("is-open");
   requestAnimationFrame(function(){
     requestAnimationFrame(function(){
       if(token===openToken&&modal&&!modal.hidden)modal.classList.add("is-open");
     });
   });
 }
 if(!frame.getAttribute("src")){
   frame.src="/kids/akademie/index.html?kidsPortal=1&dockClearance="+dockClearance();
 }else if(ready){
   try{frame.contentWindow.postMessage({type:"DAR_KIDS_ACADEMY_RESUME_V1421"},location.origin)}catch(_){}
 }
}
function close(keepNewTab){
 if(!modal||modal.hidden)return;
 ++openToken;
 try{frame.contentWindow.postMessage({type:"DAR_KIDS_ACADEMY_PAUSE_V1421"},location.origin)}catch(_){}
 modal.classList.remove("is-open");
 modal.style.pointerEvents="none";
 if(keepNewTab){
   one(".kids-academy-tab",dock())?.removeAttribute("aria-current");
   previousTab=null;
 }else restorePrevious();
 if(closingTimer)clearTimeout(closingTimer);
 closingTimer=setTimeout(function(){
   if(modal.classList.contains("is-open"))return;
   modal.hidden=true;
   modal.style.pointerEvents="";
   document.documentElement.classList.remove("kids-academy-portal-active");
   document.body.classList.remove("kids-academy-portal-active");
   if(!keepNewTab)try{trigger?.focus({preventScroll:true})}catch(_){}
   closingTimer=null;
 },220);
}
function init(){
 var triggers=document.querySelectorAll("[data-academy-open]");
 if(!triggers.length)return;
 triggers.forEach(function(button){
   button.addEventListener("click",open,button.tagName==="A");
 });
 // The underlying global tabs stay clickable while the Academy is visible.
 // The original handlers then select Today/Hören/Du'a/Eltern normally.
 document.addEventListener("click",function(event){
   if(!modal||modal.hidden||!modal.classList.contains("is-open"))return;
   var button=event.target.closest(".bottom-nav .nav-btn");
   if(button&& !button.classList.contains("kids-academy-tab"))close(true);
 },true);
 window.addEventListener("message",function(event){
   if(event.origin!==location.origin||!frame||event.source!==frame.contentWindow)return;
   if(event.data&&event.data.type==="DAR_KIDS_ACADEMY_CLOSE_V1421"){
     var goHome=event.data.goHome===true;
     close(goHome);
     if(goHome)one('.bottom-nav .nav-btn[data-target="today"]')?.click();
   }
 });
 window.addEventListener("resize",measure,{passive:true});
 window.addEventListener("orientationchange",function(){requestAnimationFrame(measure)},{passive:true});
 window.visualViewport?.addEventListener("resize",measure,{passive:true});
 document.addEventListener("keydown",function(event){
   if(event.key==="Escape"&&modal&&!modal.hidden){event.preventDefault();close(false)}
 });
 window.DARKidsAcademyPortalV1421=Object.freeze({open,close,measure});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
else init();
})();