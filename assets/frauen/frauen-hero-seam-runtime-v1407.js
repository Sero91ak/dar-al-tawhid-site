/* DAR_FRAUEN_SINGLE_LAYOUT_OWNER_V1414
 * The canonical Frauen renderer provides the original photo and search.
 * This controller alone assembles one viewport-pinned stage, a measured
 * in-flow spacer and the actual fixed brand-header offset. No scroll events,
 * negative margin, forced scroll, duplicate hero or touch cancellation.
 */
(function(){
"use strict";
if(window.__DAR_FRAUEN_HERO_SEAM_V1407)return;
window.__DAR_FRAUEN_HERO_SEAM_V1407=true;
var queued=false,resizeObserver=null,observedHeader=null,observedStage=null;
var frauenBodyOverflowSaved=null;
/* Legacy layout adapters force overflow-x:hidden on body with !important.
 * This coerces overflow-y:visible to auto and traps sticky under-scroll.
 * Enforce a single document scroll owner only while the Frauen route lives. */
function restoreBodyOverflow(){
 var saved=frauenBodyOverflowSaved;
 if(!saved)return;
 frauenBodyOverflowSaved=null;
 var el=saved.el;
 if(!el)return;
 ["overflow-x","overflow-y"].forEach(function(prop,i){
  var val=saved.values[i],priority=saved.priorities[i];
  if(val)el.style.setProperty(prop,val,priority||"");
  else el.style.removeProperty(prop);
 });
}
function frauenDocumentScroll(body){
 if(!frauenBodyOverflowSaved||frauenBodyOverflowSaved.el!==body){
  restoreBodyOverflow();
  frauenBodyOverflowSaved={el:body,
   values:["overflow-x","overflow-y"].map(function(p){return body.style.getPropertyValue(p)}),
   priorities:["overflow-x","overflow-y"].map(function(p){return body.style.getPropertyPriority(p)})};
 }
 if(body.style.getPropertyValue("overflow-x")!=="clip"||body.style.getPropertyPriority("overflow-x")!=="important")
  body.style.setProperty("overflow-x","clip","important");
 if(body.style.getPropertyValue("overflow-y")!=="visible"||body.style.getPropertyPriority("overflow-y")!=="important")
  body.style.setProperty("overflow-y","visible","important");
}
/* The frozen Frauen renderer already supplies the ORIGINAL photo and search.
 * Some adult shell hydration passes discard both first children after render.
 * Restore ONLY the missing surface from that SAME canonical renderer output;
 * never replace the chapter grid, source cards, live input or whole page. */
function restoreMissingSurface(){
 var shell=document.querySelector("#appView .frauen-library-shell,#appView .frauen-library-list");
 var source=window.DARFrauenFiqh;
 if(!shell||!source||typeof source.render!=="function")return null;
 /* Do not add a Hero to details, loading placeholders or unrelated routes. */
 if(!shell.querySelector(".frauen-library-section-head,.frauen-library-area-grid,.frauen-post-list"))return null;
 var value="";
 try{
  if(typeof window.readRoute==="function"){
   var route=window.readRoute();
   if(route&&route.view==="frauen")value=String(route.value||"");
  }
  if(!value&&/^#\/?frauen(?:\/|$)/.test(String(window.location.hash||""))){
   value=String(window.location.hash).replace(/^#\/?frauen\/?/,"")
    .split("/").map(function(x){try{return decodeURIComponent(x)}catch(_){return x}}).join("/");
  }
 }catch(_){}
 var html="";
 try{html=source.render(value)}catch(_){return null}
 if(typeof html!=="string"||html.indexOf("frauen-library-hero")<0)return null;
 var tpl=document.createElement("template");
 tpl.innerHTML=html;
 var originalHero=tpl.content.querySelector(".frauen-library-hero");
 if(!originalHero)return null;
 var hero=shell.querySelector(".frauen-library-hero");
 var stage=shell.querySelector(":scope > .dar-immersive-hero-stage");
 var search=tpl.content.querySelector(".frauen-library-search-wrap,.frauen-library-list-controls");
 var presentSearch=shell.querySelector(".frauen-library-search-wrap,.frauen-library-list-controls");
 if(!hero){
  hero=originalHero;
  if(stage)stage.insertBefore(hero,stage.firstChild);
  else shell.insertBefore(hero,shell.firstChild);
 }
 if(search&&!presentSearch){
  if(stage)stage.appendChild(search);
  else shell.insertBefore(search,hero.nextSibling);
  try{if(typeof source.bind==="function")source.bind()}catch(_){}
 }
 return hero;
}
function reconcile(){
 queued=false;
 var body=document.body;
 if(!body||!body.classList.contains("is-frauen-route")){
  restoreBodyOverflow();
  if(resizeObserver){
   if(observedHeader)resizeObserver.unobserve(observedHeader);
   if(observedStage)resizeObserver.unobserve(observedStage);
  }
  observedHeader=null;observedStage=null;
  return;
 }
 frauenDocumentScroll(body);
 var hero=document.querySelector("#appView .frauen-library-hero");
 var missingSearch=/^(hub|list)$/.test(body.getAttribute("data-frauen-view")||"")&&
  !document.querySelector("#appView .frauen-library-search-wrap,#appView .frauen-library-list-controls");
 if(!hero||missingSearch)hero=restoreMissingSurface()||hero;
 if(!hero)return;
 var shell=hero.closest(".frauen-library-shell,.frauen-library-list");
 if(!shell)return;
 var stage=shell.querySelector(":scope > .dar-immersive-hero-stage");
 if(!stage){
  var directHero=shell.querySelector(":scope > .frauen-library-hero");
  if(!directHero)return;
  var search=shell.querySelector(":scope > .frauen-library-search-wrap,:scope > .frauen-library-list-controls");
  stage=document.createElement("div");
  stage.className="dar-immersive-hero-stage frauen-library-pinned-header";
  shell.insertBefore(stage,directHero);
  stage.appendChild(directHero);
  if(search)stage.appendChild(search);
 }
 var looseSearch=shell.querySelector(":scope > .frauen-library-search-wrap,:scope > .frauen-library-list-controls");
 if(looseSearch)stage.appendChild(looseSearch);
 stage.dataset.hasSearch=stage.querySelector(":scope > .frauen-library-search-wrap,:scope > .frauen-library-list-controls")?"1":"0";
 var source=window.getComputedStyle(hero).getPropertyValue("--frauen-hero-img").trim();
 if(source&&source!=="none"&&stage.style.getPropertyValue("--dar-immersive-top-image")!==source)
  stage.style.setProperty("--dar-immersive-top-image",source);
 // One in-flow placeholder: the original stage is fixed and stays clickable.
 var spacer=shell.querySelector(":scope > .dar-frauen-hero-spacer");
 if(!spacer){
  spacer=document.createElement("div");
  spacer.className="dar-frauen-hero-spacer";
  spacer.setAttribute("aria-hidden","true");
  shell.insertBefore(spacer,stage);
 }
 var header=document.getElementById("darAdultBrandHeaderV2")||
            document.getElementById("darTestBrandHeaderV1");
 if(resizeObserver){
  if(observedHeader!==header){
   if(observedHeader)resizeObserver.unobserve(observedHeader);
   if(header)resizeObserver.observe(header);
   observedHeader=header;
  }
  if(observedStage!==stage){
   if(observedStage)resizeObserver.unobserve(observedStage);
   resizeObserver.observe(stage);
   observedStage=stage;
  }
 }
 if(header){
  var bottom=Math.ceil(header.getBoundingClientRect().bottom);
  if(Number.isFinite(bottom)&&bottom>=40&&bottom<=300){
   var fixedTop=bottom+"px";
   if(body.style.getPropertyValue("--frauen-fixed-brand-bottom")!==fixedTop)
    body.style.setProperty("--frauen-fixed-brand-bottom",fixedTop);
  }
 }
 var stageHeight=Math.ceil(stage.getBoundingClientRect().height);
 if(Number.isFinite(stageHeight)&&stageHeight>0){
  var height=stageHeight+"px";
  if(spacer.style.height!==height)spacer.style.height=height;
  if(body.style.getPropertyValue("--frauen-pinned-stage-height")!==height)
   body.style.setProperty("--frauen-pinned-stage-height",height);
 }
}
function schedule(){
 if(queued)return;
 queued=true;
 requestAnimationFrame(reconcile);
}
function setup(){
 if(typeof ResizeObserver==="function")resizeObserver=new ResizeObserver(schedule);
 var app=document.getElementById("appView");
 if(typeof MutationObserver==="function"){
  if(app)new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
  /* Brands are mounted OUTSIDE #appView. Watch only the direct insertion
     points and Frauen route state; never observe all app subtree twice. */
  var appShell=document.querySelector("body > .app");
  if(appShell)new MutationObserver(schedule).observe(appShell,{childList:true});
  if(document.body)new MutationObserver(schedule).observe(document.body,{
   childList:true,attributes:true,attributeFilter:["class","data-frauen-view"]
  });
 }
 document.addEventListener("dar:view-rendered",schedule);
 /* The frozen production adapter may repaint immediately after render;
    restore the shared stage synchronously before the next browser paint. */
 document.addEventListener("dar:frauen-render",reconcile);
 window.addEventListener("pageshow",schedule);
 window.addEventListener("resize",schedule,{passive:true});
 window.addEventListener("orientationchange",schedule,{passive:true});
 if(window.visualViewport)window.visualViewport.addEventListener("resize",schedule,{passive:true});
 window.addEventListener("hashchange",schedule);
 reconcile();
 schedule();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup,{once:true});
else setup();
})();
