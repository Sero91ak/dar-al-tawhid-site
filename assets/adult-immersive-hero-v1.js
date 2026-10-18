/* GLOBAL_HERO_IMMERSIVE_SCROLL_V1 · adult-only non-destructive DOM adapter.
 * No touchmove handlers, preventDefault, forced scroll, active input clone or data changes.
 */
(function(){
  "use strict";
  if(window.__DAR_IMMERSIVE_HERO_V1)return;
  window.__DAR_IMMERSIVE_HERO_V1=true;
  var queued=false,root=null,domObserver=null,bodyObserver=null;
  var sizes=typeof ResizeObserver==="function"?new ResizeObserver(function(){updateHeights();}):null;
  function women(){
    if(!document.body.classList.contains("is-frauen-route"))return;
    var sections=document.querySelectorAll("#appView .frauen-library-shell,#appView .frauen-library-list");
    sections.forEach(function(section){
      if(section.querySelector(":scope > .dar-immersive-hero-stage"))return;
      var hero=section.querySelector(":scope > .frauen-library-hero");
      if(!hero)return;
      var search=section.querySelector(":scope > .frauen-library-search-wrap,:scope > .frauen-library-list-controls");
      var stage=document.createElement("div");
      stage.className="dar-immersive-hero-stage frauen-library-pinned-header";
      stage.dataset.hasSearch=search?"1":"0";
      section.insertBefore(stage,hero);
      stage.appendChild(hero);
      if(search)stage.appendChild(search);
      var source=getComputedStyle(hero).getPropertyValue("--frauen-hero-img").trim();
      if(source&&source!=="none")stage.style.setProperty("--dar-immersive-top-image",source);
    });
  }
  function updateHeights(){
    if(!document.body)return;
    var els=document.querySelectorAll("#appView .hadith-hub,#appView .topics-hub,#appView .topic-collection-page");
    els.forEach(function(section){
      var hero=section.querySelector(":scope > .view-head");
      if(!hero)return;
      var height=Math.ceil(hero.getBoundingClientRect().height)+"px";
      if(section.style.getPropertyValue("--dar-immersive-hero-height")!==height)
        section.style.setProperty("--dar-immersive-hero-height",height);
      if(sizes)sizes.observe(hero);
    });
  }
  function reconcile(){queued=false;if(!document.body)return;women();updateHeights();}
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(reconcile);}
  function start(){
    root=document.getElementById("appView");
    if(!root){schedule();return;}
    domObserver=new MutationObserver(schedule);
    domObserver.observe(root,{childList:true,subtree:true});
    bodyObserver=new MutationObserver(schedule);
    bodyObserver.observe(document.body,{attributes:true,attributeFilter:["class","data-frauen-view"]});
    window.addEventListener("orientationchange",schedule,{passive:true});
    window.addEventListener("pageshow",schedule,{passive:true});
    schedule();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})();
