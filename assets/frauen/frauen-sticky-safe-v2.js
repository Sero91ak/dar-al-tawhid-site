(function(global){
  "use strict";
  // Dedicated additive opt-in; no DOM relocation, scroll listener, touch lock
  // or replacement of the protected historical Frauen renderer.
  if(global.__DAR_FRAUEN_STICKY_SAFE_V2_ACTIVE)return;
  global.__DAR_FRAUEN_STICKY_SAFE_V2_ACTIVE=true;
  var observing=null,lastHero=null,frame=0,domObserver=null;
  function unwatch(){
    if(observing){observing.disconnect();observing=null;}
    lastHero=null;
  }
  function apply(){
    frame=0;
    watchApp();
    var app=document.getElementById("appView");
    var active=document.body&&document.body.classList.contains("is-frauen-route");
    if(!app||!active){unwatch();return;}
    var shell=app.querySelector(".frauen-library-shell,.frauen-library-list");
    var hero=shell&&shell.querySelector(":scope > .frauen-library-hero");
    var search=shell&&shell.querySelector(":scope > .frauen-library-search-wrap,:scope > .frauen-library-list-controls");
    if(!hero||!search){unwatch();return;}
    shell.setAttribute("data-dar-frauen-sticky-safe","1");
    function measure(){
      if(!hero.isConnected)return;
      var height=Math.round(hero.getBoundingClientRect().height);
      if(height>100&&height<1000){
        var v=height+"px";
        if(shell.style.getPropertyValue("--dar-frauen-sticky-hero-height")!==v)
          shell.style.setProperty("--dar-frauen-sticky-hero-height",v);
      }
    }
    measure();
    if(hero!==lastHero){
      unwatch();
      lastHero=hero;
      if(typeof ResizeObserver==="function"){
        observing=new ResizeObserver(measure);
        observing.observe(hero);
      }
    }
  }
  function queue(){if(frame)return;frame=(global.requestAnimationFrame||setTimeout)(apply);}
  function watchApp(){
    var app=document.getElementById("appView");
    if(!app||domObserver)return;
    domObserver=new MutationObserver(queue);
    // Reconcile after route rerenders that rebuild #appView children.
    // Our own style/attribute writes do not create childList mutations.
    domObserver.observe(app,{childList:true});
  }
  document.addEventListener("dar:frauen-render",queue);
  global.addEventListener("hashchange",queue);
  global.addEventListener("resize",queue,{passive:true});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",queue,{once:true});
  else queue();
  global.DARFrauenStickySafeV2={reconcile:queue};
})(window);
