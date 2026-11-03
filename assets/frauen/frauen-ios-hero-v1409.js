/* DAR_IOS_FRAUEN_HERO_V1409 — isolated WKWebView/iOS PWA repair.
 * Android intentionally keeps its existing working sticky Hero.
 * On iOS the ONE original Hero+search remains viewport-fixed below the brand;
 * an empty equal-height flow spacer lets chapter cards scroll beneath it.
 * No cloned photo, new scroll root, new native inset or touch handler.
 */
(function(){
 "use strict";
 var ua=String(navigator.userAgent||"");
 var isIOS=!!(window.DAR_IOS_NATIVE_APP||document.documentElement.classList.contains("dar-ios-native-app")||
   /iPhone|iPad|iPod|DarAlTawhid-iOS/i.test(ua)||
   (navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1));
 if(!isIOS)return;
 if(window.__darIosFrauenHeroV1409)return;
 window.__darIosFrauenHeroV1409=true;
 /* The former shared V1407 margin correction is what detached the hero on
  * iOS. The already connected Android/PWA behavior remains exactly as-is. */
 window.__DAR_FRAUEN_HERO_SEAM_V1407=true;
 document.documentElement.classList.add("dar-ios-frauen-hero-v1409");
 var pending=false,observer=null,bodyObserver=null,resizer=null;
 var headerWatch=null,stageWatch=null,routeKey="";
 function currentRoute(){
  if(!document.body||!document.body.classList.contains("is-frauen-route"))return false;
  return /^(hub|group|list)$/.test(document.body.getAttribute("data-frauen-view")||"hub");
 }
 function stageFor(shell){
  var stage=shell.querySelector(":scope > .dar-immersive-hero-stage");
  if(stage)return stage;
  var hero=shell.querySelector(":scope > .frauen-library-hero");
  if(!hero)return null;
  var search=shell.querySelector(":scope > .frauen-library-search-wrap,:scope > .frauen-library-list-controls");
  stage=document.createElement("div");
  stage.className="dar-immersive-hero-stage frauen-library-pinned-header";
  stage.dataset.hasSearch=search?"1":"0";
  shell.insertBefore(stage,hero);
  stage.appendChild(hero);
  if(search)stage.appendChild(search);
  var photo=getComputedStyle(hero).getPropertyValue("--frauen-hero-img").trim();
  if(photo&&photo!=="none")stage.style.setProperty("--dar-immersive-top-image",photo);
  return stage;
 }
 function set(target,key,value){
  if(target.style.getPropertyValue(key)!==value)target.style.setProperty(key,value);
 }
 function scrollTop(){
  var r=document.scrollingElement||document.documentElement;
  return Math.max(0,window.scrollY||0,r?r.scrollTop||0:0);
 }
 function reconcile(){
  pending=false;
  if(!currentRoute())return;
  var root=document.getElementById("appView");
  var shell=root&&root.querySelector(".frauen-library-shell,.frauen-library-list");
  var brand=document.getElementById("darAdultBrandHeaderV2")||document.getElementById("darTestBrandHeaderV1");
  if(!shell||!brand)return;
  var stage=stageFor(shell);
  if(!stage)return;
  var headline=stage.querySelector(".frauen-library-hero h2");
  var key=(document.body.getAttribute("data-frauen-view")||"")+"|"+(headline?headline.textContent:"");
  if(key!==routeKey){
   routeKey=key;
   if(scrollTop()>2)window.scrollTo(0,0); // Only once on an actual route change
  }
  var space=shell.querySelector(":scope > .dar-ios-frauen-hero-spacer-v1409");
  if(!space){
   space=document.createElement("div");
   space.className="dar-ios-frauen-hero-spacer-v1409";
   space.setAttribute("aria-hidden","true");
   shell.insertBefore(space,stage.nextSibling);
  }
  var brandBottom=brand.getBoundingClientRect().bottom;
  if(!Number.isFinite(brandBottom)||brandBottom<35||brandBottom>300)return;
  set(document.body,"--dar-ios-frauen-brand-bottom",Math.round(brandBottom)+"px");
  // In split-screen only the actual content pane owns the image.
  var pane=shell.closest(".dar-fold__pane,.dar-fold-content,[data-fold-pane]");
  var paneRect=pane&&pane.getBoundingClientRect();
  var split=!!(pane&&paneRect&&paneRect.width>260&&paneRect.width<window.innerWidth-40);
  var left=split?Math.max(0,Math.round(paneRect.left)):0;
  var width=split?Math.round(paneRect.width):Math.round(document.documentElement.clientWidth||window.innerWidth);
  set(document.body,"--dar-ios-frauen-stage-left",left+"px");
  set(document.body,"--dar-ios-frauen-stage-width",Math.max(1,width)+"px");
  // Undo only the abandoned V1407 negative shim, never another route's styles.
  if(shell.style.getPropertyValue("--frauen-flow-seam-shift"))shell.style.removeProperty("--frauen-flow-seam-shift");
  shell.style.setProperty("margin-top","0px","important");
  var height=stage.getBoundingClientRect().height;
  if(Number.isFinite(height)&&height>80&&height<1000)
   set(document.body,"--dar-ios-frauen-stage-height",Math.ceil(height)+"px");
  if(resizer){
   if(headerWatch!==brand){if(headerWatch)resizer.unobserve(headerWatch);resizer.observe(brand);headerWatch=brand;}
   if(stageWatch!==stage){if(stageWatch)resizer.unobserve(stageWatch);resizer.observe(stage);stageWatch=stage;}
  }
 }
 function schedule(){
  if(pending)return;
  pending=true;
  requestAnimationFrame(reconcile);
 }
 function focusMode(){
  var a=document.activeElement;
  var focus=!!(a&&a.closest&&a.closest("#appView .dar-immersive-hero-stage")&&
     /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName||""));
  if(document.body&&currentRoute())document.body.setAttribute("data-dar-ios-frauen-input",focus?"1":"0");
  schedule();
 }
 function start(){
  var app=document.getElementById("appView");
  if(app&&typeof MutationObserver==="function"){
   observer=new MutationObserver(schedule);
   observer.observe(app,{childList:true,subtree:true});
  }
  if(document.body&&typeof MutationObserver==="function"){
   bodyObserver=new MutationObserver(schedule);
   bodyObserver.observe(document.body,{attributes:true,attributeFilter:["class","data-frauen-view"]});
  }
  if(typeof ResizeObserver==="function")resizer=new ResizeObserver(schedule);
  document.addEventListener("focusin",focusMode);
  document.addEventListener("focusout",function(){requestAnimationFrame(focusMode)});
  document.addEventListener("dar:view-rendered",schedule);
  window.addEventListener("resize",schedule,{passive:true});
  window.addEventListener("orientationchange",schedule,{passive:true});
  window.addEventListener("pageshow",schedule,{passive:true});
  window.addEventListener("hashchange",schedule,{passive:true});
  schedule();
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
 else start();
})();
