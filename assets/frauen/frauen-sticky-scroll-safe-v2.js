/* DAR_FRAUEN_STICKY_SCROLL_SAFE_V2 · OPT-IN TEST-ONLY geometry helper.
 * Never modifies/moves Hero children and never handles scroll or touch events.
 * Observe only size and route DOM changes. Images and source Frauen files stay as-is.
 */
(function(global){
  "use strict";
  if(global.__darFrauenStickyScrollSafeV2)return;
  global.__darFrauenStickyScrollSafeV2=true;
  var scheduled=false,observer=null,sizeObserver=null,bodyObserver=null,tracked=null;
  var originalRoot=null,previousX=null,previousY=null,previousXPriority="",previousYPriority="";
  // Only Frauen gets a new native-scroll owning element. Restore any inline
  // declarations as soon as this route is left. Do not touch body/html.
  function restoreOverflow(){
    if(!originalRoot)return;
    try{
      for(var item of [{key:"overflow-x",value:previousX,priority:previousXPriority},
                       {key:"overflow-y",value:previousY,priority:previousYPriority}]){
        if(item.value)originalRoot.style.setProperty(item.key,item.value,item.priority);
        else originalRoot.style.removeProperty(item.key);
      }
    }catch(err){}
    originalRoot=null;
  }
  function ensureOverflow(root){
    if(originalRoot!==root){
      restoreOverflow();
      originalRoot=root;
      previousX=root.style.getPropertyValue("overflow-x");
      previousY=root.style.getPropertyValue("overflow-y");
      previousXPriority=root.style.getPropertyPriority("overflow-x");
      previousYPriority=root.style.getPropertyPriority("overflow-y");
    }
    // Scoped inline important beats legacy #appView overflow rules that
    // otherwise create a never-scrolling sticky ancestor on iOS WebKit.
    if(root.style.getPropertyValue("overflow-x")!=="clip"||root.style.getPropertyValue("overflow-y")!=="visible"){
      root.style.setProperty("overflow-x","clip","important");
      root.style.setProperty("overflow-y","visible","important");
    }
  }
  function reconcile(){
    scheduled=false;
    if(!document.body||!document.body.classList.contains("is-frauen-route")){
      restoreOverflow();return;
    }
    var root=document.getElementById("appView");
    if(!root){restoreOverflow();return;}
    ensureOverflow(root);
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
    bodyObserver=new MutationObserver(schedule);
    bodyObserver.observe(document.body,{attributes:true,attributeFilter:["class"]});
    global.addEventListener("resize",schedule,{passive:true});
    document.addEventListener("dar:frauen-render",schedule);
    schedule();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
})(window);
