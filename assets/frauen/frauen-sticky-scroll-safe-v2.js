/* DAR_FRAUEN_STICKY_SCROLL_SAFE_V2 · OPT-IN TEST-ONLY geometry helper.
 * Never modifies/moves Hero children and never handles scroll or touch events.
 * Observe only size and route DOM changes. Images and source Frauen files stay as-is.
 */
(function(global){
  "use strict";
  if(global.__darFrauenStickyScrollSafeV2)return;
  global.__darFrauenStickyScrollSafeV2=true;
  var scheduled=false,observer=null,sizeObserver=null,tracked=null;
  function reconcile(){
    scheduled=false;
    if(!document.body||!document.body.classList.contains("is-frauen-route"))return;
    var root=document.getElementById("appView");
    if(!root)return;
    var shells=root.querySelectorAll(".frauen-library-shell,.frauen-library-list");
    shells.forEach(function(shell){
      var hero=shell.querySelector(":scope > .frauen-library-hero");
      var search=shell.querySelector(":scope > .frauen-library-search-wrap,:scope > .frauen-library-list-controls");
      if(!hero||!search)return;
      if(sizeObserver&&tracked!==hero){
        if(tracked)sizeObserver.unobserve(tracked);
        sizeObserver.observe(hero);
        tracked=hero;
      }
      var height=hero.getBoundingClientRect().height;
      var overlap=parseFloat(global.getComputedStyle(search).marginTop)||0;
      var top=Math.max(0,Math.round(height+overlap))+"px";
      if(shell.style.getPropertyValue("--dar-frauen-search-sticky-top")!==top)
        shell.style.setProperty("--dar-frauen-search-sticky-top",top);
    });
  }
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    global.requestAnimationFrame(reconcile);
  }
  function start(){
    var root=document.getElementById("appView");
    if(!root)return;
    if(typeof ResizeObserver==="function")
      sizeObserver=new ResizeObserver(schedule);
    observer=new MutationObserver(schedule);
    observer.observe(root,{childList:true,subtree:true});
    global.addEventListener("resize",schedule,{passive:true});
    document.addEventListener("dar:frauen-render",schedule);
    schedule();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})(window);
