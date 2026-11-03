/* DAR_IOS_FRAUEN_HERO_V1409_DOM_SAFE
 * Position EXISTING Hero and search on iOS. No DOM cloning or reparenting.
 * Android retains its original approved sticky hero and scroll owner.
 */
(function(){
"use strict";
var ua=String(navigator.userAgent||"");
var ios=!!(window.DAR_IOS_NATIVE_APP||document.documentElement.classList.contains("dar-ios-native-app")||
 /iPhone|iPad|iPod|DarAlTawhid-iOS/i.test(ua)||
 (navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1));
if(!ios)return;
if(window.__darIosFrauenHeroV1409)return;
window.__darIosFrauenHeroV1409=true;
window.__DAR_FRAUEN_HERO_SEAM_V1407=true; // iOS only: disable old negative shim
document.documentElement.classList.add("dar-ios-frauen-hero-v1409");
var queued=false,observer=null,bodyObserver=null,ro=null,watchHeader=null,watchHero=null,watchSearch=null,routeKey="";
function active(){return !!(document.body&&document.body.classList.contains("is-frauen-route")&&
 /^(hub|group|list)$/.test(document.body.getAttribute("data-frauen-view")||"hub"))}
function put(el,key,value){if(el.style.getPropertyValue(key)!==value)el.style.setProperty(key,value)}
function pageTop(){var r=document.scrollingElement||document.documentElement;
 return Math.max(0,window.scrollY||0,r?r.scrollTop||0:0)}
function reconcile(){
 queued=false;
 if(!active())return;
 var app=document.getElementById("appView");
 var shell=app&&app.querySelector(".frauen-library-shell,.frauen-library-list");
 var brand=document.getElementById("darAdultBrandHeaderV2")||document.getElementById("darTestBrandHeaderV1");
 if(!shell||!brand)return;
 var stage=shell.querySelector(":scope > .dar-immersive-hero-stage");
 var hero=stage?stage.querySelector(".frauen-library-hero"):shell.querySelector(":scope > .frauen-library-hero");
 var search=stage?stage.querySelector(".frauen-library-search-wrap,.frauen-library-list-controls"):
  shell.querySelector(":scope > .frauen-library-search-wrap,:scope > .frauen-library-list-controls");
 if(!hero)return; // renderer may be repainting; observer retries
 var bottom=brand.getBoundingClientRect().bottom;
 if(!Number.isFinite(bottom)||bottom<30||bottom>300)return;
 var title=hero.querySelector("h2");
 var key=(document.body.getAttribute("data-frauen-view")||"")+"|"+(title?title.textContent:"");
 if(routeKey!==key){routeKey=key;if(pageTop()>2)window.scrollTo(0,0)}
 var pane=shell.closest(".dar-fold__pane,.dar-fold-content,[data-fold-pane]");
 var paneRect=pane&&pane.getBoundingClientRect();
 var split=!!(paneRect&&paneRect.width>260&&paneRect.width<window.innerWidth-40);
 var left=split?Math.max(0,Math.round(paneRect.left)):0;
 var width=split?Math.round(paneRect.width):Math.round(document.documentElement.clientWidth||window.innerWidth);
 var hh=hero.getBoundingClientRect().height;
 if(!Number.isFinite(hh)||hh<90)return;
 var sh=search?search.getBoundingClientRect().height:0;
 var stageH=stage?stage.getBoundingClientRect().height:0;
 var rail=stage&&stageH>100?stageH:hh+Math.max(0,sh-(search?30:0));
 var nav=document.getElementById("bottomNav");
 var nw=nav?nav.getBoundingClientRect().width:0;
 var searchW=Math.min(width-20,nw>100?nw:width-20);
 put(document.body,"--dar-ios-frauen-header-bottom",Math.round(bottom)+"px");
 put(document.body,"--dar-ios-frauen-stage-left",left+"px");
 put(document.body,"--dar-ios-frauen-stage-width",Math.max(1,width)+"px");
 put(document.body,"--dar-ios-frauen-hero-height",Math.ceil(hh)+"px");
 put(document.body,"--dar-ios-frauen-rail-height",Math.ceil(rail)+"px");
 put(document.body,"--dar-ios-frauen-search-left",Math.round(left+(width-searchW)/2)+"px");
 put(document.body,"--dar-ios-frauen-search-width",Math.round(searchW)+"px");
 if(shell.style.getPropertyValue("--frauen-flow-seam-shift"))shell.style.removeProperty("--frauen-flow-seam-shift");
 shell.style.setProperty("margin-top","0px","important");
 if(ro){
  for(var pair of [[brand,"header"],[hero,"hero"],[search,"search"]]){
   var el=pair[0],kind=pair[1],old=kind==="header"?watchHeader:kind==="hero"?watchHero:watchSearch;
   if(el===old)continue;
   if(old)ro.unobserve(old);
   if(el)ro.observe(el);
   if(kind==="header")watchHeader=el;else if(kind==="hero")watchHero=el;else watchSearch=el;
  }
 }
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(reconcile)}
function focus(){
 var a=document.activeElement;
 var inside=!!(a&&a.closest&&a.closest("#appView .frauen-library-search-wrap,#appView .frauen-library-list-controls")&&
 /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName||""));
 if(active())document.body.setAttribute("data-dar-ios-frauen-input",inside?"1":"0");
 schedule();
}
function boot(){
 var app=document.getElementById("appView");
 if(app&&typeof MutationObserver==="function"){
  observer=new MutationObserver(schedule);observer.observe(app,{childList:true,subtree:true});
 }
 if(document.body&&typeof MutationObserver==="function"){
  bodyObserver=new MutationObserver(schedule);
  bodyObserver.observe(document.body,{attributes:true,attributeFilter:["class","data-frauen-view"]});
 }
 if(typeof ResizeObserver==="function")ro=new ResizeObserver(schedule);
 document.addEventListener("focusin",focus);
 document.addEventListener("focusout",function(){requestAnimationFrame(focus)});
 document.addEventListener("dar:frauen-render",schedule);
 window.addEventListener("pageshow",schedule,{passive:true});
 window.addEventListener("resize",schedule,{passive:true});
 window.addEventListener("orientationchange",schedule,{passive:true});
 window.addEventListener("hashchange",schedule,{passive:true});
 schedule();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
else boot();
})();