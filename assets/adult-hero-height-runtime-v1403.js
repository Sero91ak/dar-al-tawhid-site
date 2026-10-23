/* DAR_ADULT_HERO_HEIGHT_RUNTIME_V1403
 * Adult visitor site / iOS WebView / Android PWA.
 * Read-only geometry adapter. Never moves/replaces heroes, search inputs,
 * ancestor nodes, imagery, Frauen bridge, body scroll or nav.
 * Does not initiate app loading, reload, touch interception or routing.
 */
(function(){
  "use strict";
  if(window.__DAR_ADULT_HERO_HEIGHT_V1403)return;
  window.__DAR_ADULT_HERO_HEIGHT_V1403=true;
  var root=null,scheduled=false,bodyObserver=null,childObserver=null,resizeObserver=null;
  var observed=typeof WeakSet==="function"?new WeakSet():null;
  var sections=[
    "#appView .topics-hub",
    "#appView .topic-collection-page",
    "#appView .hadith-hub",
    "#appView .dua-hub",
    "#appView .frauen-library-shell",
    "#appView .frauen-library-list"
  ].join(",");
  function directHero(section){
    try{return section.querySelector(":scope > .view-head, :scope > .frauen-library-hero");}
    catch(_){return null;}
  }
  function measure(section,hero){
    if(!section||!hero||!section.isConnected)return;
    var rect=hero.getBoundingClientRect();
    if(!rect||!isFinite(rect.height)||rect.height<=0)return;
    var height=Math.ceil(rect.height)+"px";
    if(section.style.getPropertyValue("--dar-immersive-hero-height")!==height){
      section.style.setProperty("--dar-immersive-hero-height",height);
    }
  }
  /* DAR_VISITOR_HOME_IMMERSIVE_MOTION_V1_20261023
   * One read-only, scroll-linked progress value. Never intercepts scrolling
   * or changes route/content/nav; the visual runs backwards automatically.
   */
  function updateHomeImmersive(){
    if(!document.body || !document.body.classList.contains("is-home-route"))return;
    var shell=root && root.querySelector(".home-v380-shell");
    if(!shell)return;
    var height=Math.max(1,window.innerHeight||document.documentElement.clientHeight||760);
    var bounds=shell.getBoundingClientRect();
    var progress=Math.max(0,Math.min(1,(height*.08-bounds.top)/Math.max(360,height*.86)));
    var reduced=!!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var fade=(1-progress).toFixed(3);
    var move=(reduced?0:Math.round(progress*42))+"px";
    if(shell.style.getPropertyValue("--dar-home-scene-fade")!==fade)
      shell.style.setProperty("--dar-home-scene-fade",fade);
    if(shell.style.getPropertyValue("--dar-home-scene-parallax")!==move)
      shell.style.setProperty("--dar-home-scene-parallax",move);
  }
  function reconcile(){
    scheduled=false;
    if(!root||!root.isConnected||!document.body)return;
    var list=root.querySelectorAll(sections);
    for(var i=0;i<list.length;i++){
      var section=list[i],hero=directHero(section);
      if(!hero)continue;
      if(resizeObserver&&(!observed||!observed.has(hero))){
        resizeObserver.observe(hero);
        if(observed)observed.add(hero);
      }
      measure(section,hero);
    }
    updateHomeImmersive();
  }
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    if(typeof requestAnimationFrame==="function")requestAnimationFrame(reconcile);
    else setTimeout(reconcile,0);
  }
  function attach(){
    root=document.getElementById("appView");
    if(!root){
      // App shell may initialize after this deferred script. Only retry on
      // DOMContentLoaded; do not keep a permanent polling/refresh loop.
      if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",attach,{once:true});
      return;
    }
    if(typeof ResizeObserver==="function"){
      resizeObserver=new ResizeObserver(schedule);
    }
    if(typeof MutationObserver==="function"){
      childObserver=new MutationObserver(schedule);
      childObserver.observe(root,{childList:true,subtree:true});
      bodyObserver=new MutationObserver(schedule);
      bodyObserver.observe(document.body,{attributes:true,attributeFilter:["class","data-frauen-view"]});
    }
    window.addEventListener("orientationchange",schedule,{passive:true});
    window.addEventListener("resize",schedule,{passive:true});
    window.addEventListener("scroll",schedule,{passive:true});
    document.addEventListener("scroll",schedule,{passive:true,capture:true});
    window.addEventListener("pageshow",schedule,{passive:true});
    document.addEventListener("dar:frauen-render",schedule);
    schedule();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",attach,{once:true});
  else attach();
})();