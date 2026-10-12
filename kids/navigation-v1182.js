/* DĀR AL TAWḤĪD KIDS · Navigation + Scroll Authority v1182
   Global rule:
   - Main tabs always open at the top.
   - Detail/library back returns to the exact parent scroll position.
   - Pages change only through taps on tabs, category cards and explicit back buttons.
   - One bottom clearance only; no stacked empty scroll tail. */
(function(){
  "use strict";

  var root=document.documentElement;
  var shell=null;
  var stack=[];
  var index=-1;
  var replaying=false;
  var clickToken=0;

  function q(s,r){return (r||document).querySelector(s)}
  function qa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}

  function installLateLayout(){
    if(document.getElementById("kids-navigation-v1182-style"))return;
    var style=document.createElement("style");
    style.id="kids-navigation-v1182-style";
    style.textContent=[
      "html[data-kids-age] body .shell{",
      "  padding-bottom:calc(92px + env(safe-area-inset-bottom,0px))!important;",
      "  scroll-padding-bottom:calc(92px + env(safe-area-inset-bottom,0px))!important;",
      "}",
      "html[data-kids-age] body .shell > .view{",
      "  min-height:0!important;",
      "  height:auto!important;",
      "  max-height:none!important;",
      "  margin-bottom:0!important;",
      "}",
      "html[data-kids-age] body .shell > #view-today.view,",
      "html[data-kids-age] body .shell > #view-stories.view,",
      "html[data-kids-age] body .shell > #view-dua.view,",
      "html[data-kids-age] body .shell > #view-quran.view,",
      "html[data-kids-age] body .shell > #view-parents.view{",
      "  padding-bottom:0!important;",
      "  margin-bottom:0!important;",
      "}",
      "html[data-kids-age][data-view=\"stories\"] body .shell > #view-stories.ps-stories-home.view.active{",
      "  min-height:0!important;",
      "  padding-bottom:0!important;",
      "  margin-bottom:0!important;",
      "  scroll-padding-bottom:calc(92px + env(safe-area-inset-bottom,0px))!important;",
      "}",
      "html[data-kids-age] body .shell > .view.active > :last-child{margin-bottom:0!important;}",
      "/* CONTENT_FLOW_V1237 — one global bottom reserve only; no artificial 100dvh tails inside active Kids content. */",
      "html[data-kids-age] body .shell > .view.active{",
      "  min-height:0!important;",
      "  height:auto!important;",
      "  max-height:none!important;",
      "}",
      "html[data-kids-age] body #duaHubDetailScroll,",
      "html[data-kids-age] body .duahub-detail-scroll{",
      "  height:auto!important;",
      "  min-height:0!important;",
      "  max-height:none!important;",
      "  padding-bottom:14px!important;",
      "  scroll-padding-bottom:14px!important;",
      "}",
      "html[data-kids-age] body #view-dua.duahub-view{",
      "  padding-bottom:0!important;",
      "  margin-bottom:0!important;",
      "}",
      "html[data-kids-age] body #view-dua .duahub-detail,",
      "html[data-kids-age] body #view-dua .duahub-home{",
      "  height:auto!important;",
      "  min-height:0!important;",
      "  max-height:none!important;",
      "}",
      "#psLibraryScroll,#msLibraryScroll,#syLibraryScroll,#ghWorldScroll{",
      "  padding-bottom:calc(30px + env(safe-area-inset-bottom,0px))!important;",
      "  scroll-padding-bottom:calc(30px + env(safe-area-inset-bottom,0px))!important;",
      "}",
      "#psScroll,#msScroll,#syScroll,#ghPlayerScroll{",
      "  padding-bottom:calc(26px + env(safe-area-inset-bottom,0px))!important;",
      "  scroll-padding-bottom:calc(26px + env(safe-area-inset-bottom,0px))!important;",
      "}",
      "@media(max-width:380px){html[data-kids-age] body .shell{padding-bottom:calc(88px + env(safe-area-inset-bottom,0px))!important;}}",
      "@media(min-width:700px){html[data-kids-age] body .shell{padding-bottom:calc(98px + env(safe-area-inset-bottom,0px))!important;}}",
      "/* HOME_STABILITY_V1236 — one invariant hero geometry on first load and every return. */",
      "#view-today .hero{",
      "  min-height:var(--kids-home-hero-height-fixed,clamp(485px,122vw,535px))!important;",
      "  height:var(--kids-home-hero-height-fixed,clamp(485px,122vw,535px))!important;",
      "  max-height:var(--kids-home-hero-height-fixed,535px)!important;",
      "}",
      "#view-today .kids-wordmark{",
      "  top:var(--kids-home-title-top-fixed,82px)!important;",
      "  margin-top:0!important;",
      "}",
      "#view-today .kids-wordmark > .wm-kids span{",
      "  animation-play-state:running!important;",
      "}",
      "@media(max-width:390px){",
      "  #view-today .hero{min-height:var(--kids-home-hero-height-fixed,485px)!important;height:var(--kids-home-hero-height-fixed,485px)!important;max-height:var(--kids-home-hero-height-fixed,485px)!important;}",
      "}",
      "@media(min-width:700px){",
      "  #view-today .hero{min-height:var(--kids-home-hero-height-fixed,525px)!important;height:var(--kids-home-hero-height-fixed,525px)!important;max-height:var(--kids-home-hero-height-fixed,525px)!important;}",
      "}"
    ].join("\n");
    (document.head||root).appendChild(style);
  }

  function activeTab(){
    var b=q(".nav-btn.active[data-target]");
    if(b&&b.dataset.target)return b.dataset.target;
    var v=q(".view.active");
    return v&&v.id?v.id.replace(/^view-/,""):"today";
  }

  function surfaceIds(){
    var out=[];
    var fixed=[
      "knowledgeModal","duaModal","duaHubDetail","quizModal","quranModal","fullQuranModal","storyModal",
      "psLibraryPage","psModal","msLibraryPage","msModal","syLibraryPage","syModal","dlLibraryPage","dlModal",
      "ghWorld","ghPlayer"
    ];
    fixed.forEach(function(id){
      var el=document.getElementById(id);
      if(el&&el.classList.contains("open"))out.push(id);
    });
    qa(".kids-follow-reader.open[id]").forEach(function(el){out.push(el.id)});
    if(q("#kidsSalahDailyPage:not([hidden])"))out.push("kidsSalahDailyPage");
    if(q(".kids-salah-overlay:not([hidden])"))out.push("kidsSalahLocationOverlay");
    if(q("#duaSmartLearn.open"))out.push("duaSmartLearn");
    if(q("#studioContentModal.open"))out.push("studioContentModal");
    return out;
  }

  function signature(){
    return activeTab()+"|"+surfaceIds().join(">");
  }

  function scrollNodes(){
    var selectors=[
      ".shell",
      "#psLibraryScroll","#psScroll",
      "#msLibraryScroll","#msScroll",
      "#syLibraryScroll","#syScroll","#dlLibraryScroll","#dlScroll",
      "#ghWorldScroll","#ghPlayerScroll",
      "#knowledgeModal .modal-shell","#duaModal .modal-shell","#duaHubDetailScroll","#quizModal .modal-shell",
      "#quranModal .modal-shell","#fullQuranModal .modal-shell","#storyModal .modal-shell",
      ".kids-follow-reader.open .kfr-read"
    ];
    var seen=[],out=[];
    selectors.forEach(function(sel){
      qa(sel).forEach(function(el){
        if(seen.indexOf(el)>=0)return;
        seen.push(el);out.push(el);
      });
    });
    return out;
  }

  function scrollKey(el){
    if(el.classList&&el.classList.contains("shell"))return "shell";
    if(el.id)return "#"+el.id;
    var reader=el.closest&&el.closest(".kids-follow-reader[id]");
    if(reader&&el.classList.contains("kfr-read"))return "#"+reader.id+" .kfr-read";
    var modal=el.closest&&el.closest(".modal[id]");
    if(modal&&el.classList.contains("modal-shell"))return "#"+modal.id+" .modal-shell";
    return "";
  }

  function captureScrolls(){
    var data={};
    scrollNodes().forEach(function(el){
      var key=scrollKey(el);
      if(key)data[key]=Math.max(0,Number(el.scrollTop)||0);
    });
    return data;
  }

  function elementForScrollKey(key){
    if(key==="shell")return shell||q(".shell");
    try{return q(key)}catch(_){return null}
  }

  function restoreScrolls(data){
    if(!data)return;
    requestAnimationFrame(function(){
      Object.keys(data).forEach(function(key){
        var el=elementForScrollKey(key);
        if(!el)return;
        var y=Math.max(0,Number(data[key])||0);
        try{el.scrollTo({top:y,left:0,behavior:"auto"})}catch(_){el.scrollTop=y}
      });
      setTimeout(function(){
        Object.keys(data).forEach(function(key){
          var el=elementForScrollKey(key);
          if(!el)return;
          var y=Math.max(0,Number(data[key])||0);
          if(Math.abs((Number(el.scrollTop)||0)-y)>2)el.scrollTop=y;
        });
      },90);
    });
  }

  function saveCurrent(){
    if(index<0||!stack[index])return;
    stack[index].scrolls=captureScrolls();
    stack[index].signature=signature();
  }

  function resetMainTop(){
    shell=shell||q(".shell");
    if(!shell)return;
    try{shell.scrollTo({top:0,left:0,behavior:"auto"})}catch(_){shell.scrollTop=0}
  }

  /* On a genuine first open, WKWebView/Safari may restore the document
     viewport even though the app's internal .shell is already at top=0.
     Clear the document offset only while the Today screen is unobstructed.
     No synthetic scrolled-to-section entry and no animated jump. */
  function resetLaunchViewport(){
    var today=q("#view-today");
    if(!today||!today.classList.contains("active")||surfaceIds().length)return;
    var scrolling=document.scrollingElement;
    var y=Math.max(0,Number(window.scrollY)||0,Number(scrolling&&scrolling.scrollTop)||0);
    if(y<=1)return;
    try{window.scrollTo(0,0)}catch(_){}
    if(scrolling)scrolling.scrollTop=0;
  }

  function descriptorFor(target){
    if(!target||!target.closest)return null;
    var el=target.closest("button,a,[role='button'],[data-go],[data-story],[data-ps-id],[data-ms-id],[data-sy-id],[data-dl-id],[data-gh-id],[data-surah],[data-quran-ref]");
    if(!el)return null;
    var nav=el.closest(".nav-btn[data-target]");
    if(nav)return {type:"tab",target:nav.dataset.target,element:nav};

    var go=el.closest("[data-go]");
    if(go){
      if(go.id)return {type:"click-id",id:go.id,element:go};
      return {type:"tab",target:go.dataset.go,element:go};
    }

    if(el.id==="psProphetEntry")return {type:"ps-library",element:el};
    if(el.id==="msEntry")return {type:"ms-library",element:el};
    if(el.id==="syEntry")return {type:"sy-library",element:el};
    if(el.id==="deenEntry")return {type:"dl-library",element:el};

    var ps=el.closest("[data-ps-id]");
    if(ps)return {type:"ps-story",id:ps.dataset.psId,element:ps};
    var ms=el.closest("[data-ms-id]");
    if(ms)return {type:"ms-story",id:ms.dataset.msId,element:ms};
    var sy=el.closest("[data-sy-id]");
    if(sy)return {type:"sy-story",id:sy.dataset.syId,element:sy};
    var dl=el.closest("[data-dl-id]");
    if(dl)return {type:"dl-story",id:dl.dataset.dlId,element:dl};
    var shortStory=el.closest("[data-story]");
    if(shortStory)return {type:"short-story",id:shortStory.dataset.story,element:shortStory};
    var gh=el.closest("[data-gh-id]");
    if(gh){
      var cat=q(".gh-category.active[data-gh-cat]");
      return {type:"gh-story",id:gh.dataset.ghId,cat:cat&&cat.dataset.ghCat||"prophets",element:gh};
    }
    if(el.id)return {type:"click-id",id:el.id,element:el};
    return {type:"element",element:el};
  }

  function isBackControl(target){
    if(!target||!target.closest)return false;
    return !!target.closest(
      "[data-close],#duaHubBack,#psClose,#psLibraryBack,#msClose,#msBack,#syClose,#syBack,#dlClose,#dlBack,"+
      "#ghBack,#ghPlayerBack,#ghPlayerMin,.kfr-close,"+
      "#kidsSalahDayBack,#kidsSalahClose,#studioContentClose,#duaSmartLearn [data-dsl='close']"
    );
  }

  function pushState(desc,afterSig){
    if(!desc||!afterSig)return;
    if(index>=0&&stack[index]&&stack[index].signature===afterSig){
      stack[index].desc=desc;
      stack[index].scrolls=captureScrolls();
      return;
    }
    if(index<stack.length-1)stack=stack.slice(0,index+1);
    stack.push({desc:desc,signature:afterSig,scrolls:captureScrolls()});
    index=stack.length-1;
    if(stack.length>40){
      stack=stack.slice(stack.length-40);
      index=stack.length-1;
    }
  }

  function syncBackState(afterSig){
    var found=-1;
    for(var i=index-1;i>=0;i--){
      if(stack[i]&&stack[i].signature===afterSig){found=i;break}
    }
    if(found>=0){
      index=found;
      restoreScrolls(stack[index].scrolls);
      return true;
    }
    if(index>0){
      index-=1;
      stack[index].signature=afterSig;
      restoreScrolls(stack[index].scrolls);
      return true;
    }
    return false;
  }

  function afterClick(before,desc,back,token){
    if(token!==clickToken||replaying)return;
    var after=signature();
    if(after===before){
      if(desc&&desc.type==="tab"){
        resetMainTop();
        if(desc.target==="today")armHome();
      }
      return;
    }
    if(back){
      syncBackState(after);
      return;
    }
    pushState(desc,after);
    if(desc&&desc.type==="tab"){
      resetMainTop();
      if(desc.target==="today")armHome();
    }
  }

  /* KIDS_TOUCH_INTENT_GUARD_V1344
     A short drag/brush must never activate a tab, story or Back control.
     Observe without preventing scroll; intercept only the subsequent trusted
     click if the finger moved more than the tap tolerance. Keyboard and
     scripted clicks remain functional, and regular taps have zero delay. */
  var touchIntent=null;
  function onIntentTouchStart(e){
    if(!e.touches||e.touches.length!==1){touchIntent=null;return}
    var t=e.touches[0];
    touchIntent={id:t.identifier,x:t.clientX,y:t.clientY,moved:false,endedAt:-1};
  }
  function updateIntentMovement(t){
    if(!touchIntent||!t||t.identifier!==touchIntent.id)return;
    var dx=t.clientX-touchIntent.x,dy=t.clientY-touchIntent.y;
    if(dx*dx+dy*dy>144)touchIntent.moved=true;
  }
  function onIntentTouchMove(e){
    if(!touchIntent||!e.touches)return;
    for(var i=0;i<e.touches.length;i++)updateIntentMovement(e.touches[i]);
  }
  function onIntentTouchEnd(e){
    if(!touchIntent||!e.changedTouches)return;
    for(var i=0;i<e.changedTouches.length;i++){
      var t=e.changedTouches[i];
      if(t.identifier!==touchIntent.id)continue;
      updateIntentMovement(t);
      touchIntent.endedAt=performance.now();
      return;
    }
  }
  function accidentalTouchActivation(e){
    if(!touchIntent||!touchIntent.moved||touchIntent.endedAt<0||
       e.isTrusted===false||e.detail===0)return false;
    var age=performance.now()-touchIntent.endedAt;
    return age>=0&&age<800&&(isBackControl(e.target)||!!descriptorFor(e.target));
  }

  function onClickCapture(e){
    if(replaying)return;
    if(accidentalTouchActivation(e)){
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    var back=isBackControl(e.target);
    var desc=back?null:descriptorFor(e.target);
    if(!back&&!desc)return;
    saveCurrent();
    var before=signature();
    var token=++clickToken;
    setTimeout(function(){afterClick(before,desc,back,token)},70);
    if(desc&&desc.type==="click-id"){
      setTimeout(function(){afterClick(before,desc,back,token)},340);
    }
  }

  function clickId(id){
    var el=document.getElementById(id);
    if(!el)return false;
    el.click();return true;
  }

  function replay(desc){
    if(!desc)return false;
    if(desc.type==="tab"){
      var nav=q('.nav-btn[data-target="'+CSS.escape(desc.target)+'"]');
      if(nav){nav.click();return true}
    }
    if(desc.element&&desc.element.isConnected){
      try{desc.element.click();return true}catch(_){}
    }
    if(desc.type==="ps-library"&&window.DARKidsProphetStories?.openLibrary){window.DARKidsProphetStories.openLibrary();return true}
    if(desc.type==="ps-story"&&window.DARKidsProphetStories?.open){window.DARKidsProphetStories.open(desc.id);return true}
    if(desc.type==="ms-library"&&window.DARKidsMubashshirun?.openLibrary){window.DARKidsMubashshirun.openLibrary();return true}
    if(desc.type==="ms-story"&&window.DARKidsMubashshirun?.open){window.DARKidsMubashshirun.open(desc.id);return true}
    if(desc.type==="sy-library"&&window.DARKidsSahabiyyat?.openLibrary){window.DARKidsSahabiyyat.openLibrary();return true}
    if(desc.type==="sy-story"&&window.DARKidsSahabiyyat?.open){window.DARKidsSahabiyyat.open(desc.id);return true}
    if(desc.type==="dl-library"&&window.DARKidsDeenLessons?.openLibrary){window.DARKidsDeenLessons.openLibrary();return true}
    if(desc.type==="dl-story"&&window.DARKidsDeenLessons?.open){window.DARKidsDeenLessons.open(desc.id);return true}
    if(desc.type==="gh-story"&&window.DARKidsStoryHub?.openStory){window.DARKidsStoryHub.openStory(desc.cat||"prophets",desc.id);return true}
    if(desc.type==="short-story"){
      var row=q('[data-story="'+CSS.escape(desc.id)+'"]');
      if(row){row.click();return true}
      if(typeof window.openStory==="function"){window.openStory(desc.id);return true}
    }
    if(desc.type==="click-id")return clickId(desc.id);
    return false;
  }

  function replayIndex(nextIndex){
    if(nextIndex<0||nextIndex>=stack.length||!stack[nextIndex])return false;
    saveCurrent();
    var entry=stack[nextIndex];
    replaying=true;
    index=nextIndex;
    var ok=false;
    try{ok=replay(entry.desc)}catch(_){ok=false}
    setTimeout(function(){
      replaying=false;
      if(entry.desc&&entry.desc.type==="tab")resetMainTop();
      else restoreScrolls(entry.scrolls);
    },140);
    return ok;
  }

  function visibleBackButton(){
    var selectors=[
      ".kids-salah-overlay:not([hidden]) #kidsSalahClose",
      "#duaSmartLearn.open .dsl-close",
      "#studioContentModal.open #studioContentClose",
      "#kidsSalahDailyPage:not([hidden]) #kidsSalahDayBack",
      ".kids-follow-reader.open .kfr-close",
      "#psModal.open #psClose","#msModal.open #msClose","#syModal.open #syClose","#dlModal.open #dlClose",
      "#ghPlayer.open #ghPlayerBack",
      ".modal.open [data-close]","#duaHubDetail.open #duaHubBack",
      "#psLibraryPage.open #psLibraryBack","#msLibraryPage.open #msBack","#syLibraryPage.open #syBack","#dlLibraryPage.open #dlBack",
      "#ghWorld.open #ghBack"
    ];
    for(var i=0;i<selectors.length;i++){
      var el=q(selectors[i]);
      if(el&&el.isConnected&&el.getClientRects().length&&
         getComputedStyle(el).visibility!=="hidden"&&getComputedStyle(el).display!=="none")return el;
    }
    return null;
  }

  function back(){
    saveCurrent();
    var b=visibleBackButton();
    if(b){b.click();return true}
    if(index>0)return replayIndex(index-1);
    return false;
  }

  function forward(){
    saveCurrent();
    if(index<stack.length-1)return replayIndex(index+1);
    return false;
  }

  function lockHomeGeometry(force){
    var width=Math.max(320,Number(window.innerWidth)||390);
    var bucket=width>=700?"tablet":(width<=390?"compact":"phone");
    if(!force&&root.dataset.kidsHomeGeometryBucket===bucket&&
       root.style.getPropertyValue("--kids-home-title-top-fixed")&&
       root.style.getPropertyValue("--kids-home-hero-height-fixed"))return;

    var hero=q("#view-today .hero");
    var mark=q("#view-today .kids-wordmark");
    var heroHeight=0,markTop=0;
    if(hero&&mark){
      var hr=hero.getBoundingClientRect();
      var mr=mark.getBoundingClientRect();
      heroHeight=Math.round(hr.height||0);
      markTop=Math.round((mr.top||0)-(hr.top||0));
    }

    if(heroHeight<420||heroHeight>620){
      heroHeight=bucket==="tablet"?525:485;
    }
    if(markTop<28||markTop>150){
      markTop=bucket==="tablet"?64:(bucket==="compact"?54:56);
    }

    root.style.setProperty("--kids-home-hero-height-fixed",heroHeight+"px");
    root.style.setProperty("--kids-home-title-top-fixed",markTop+"px");
    root.dataset.kidsHomeGeometryBucket=bucket;
  }

  function restartHomeMotion(){
    var today=q("#view-today");
    if(!today||!today.classList.contains("active"))return;
    var letters=qa("#view-today .kids-wordmark > .wm-kids span");
    if(!letters.length)return;
    letters.forEach(function(el){el.style.setProperty("animation","none","important")});
    void today.offsetHeight;
    requestAnimationFrame(function(){
      letters.forEach(function(el){el.style.removeProperty("animation")});
    });
  }

  function armHome(){
    lockHomeGeometry(false);
    requestAnimationFrame(function(){
      requestAnimationFrame(restartHomeMotion);
    });
  }

  function init(){
    shell=q(".shell");
    /* Capture the approved first-entry geometry BEFORE the late lock is injected. */
    lockHomeGeometry(true);
    installLateLayout();
    if(shell){
      try{shell.scrollTo({top:0,left:0,behavior:"auto"})}catch(_){shell.scrollTop=0}
    }
    resetLaunchViewport();
    stack=[{desc:{type:"tab",target:activeTab()},signature:signature(),scrolls:captureScrolls()}];
    index=0;
    document.addEventListener("touchstart",onIntentTouchStart,{capture:true,passive:true});
    document.addEventListener("touchmove",onIntentTouchMove,{capture:true,passive:true});
    document.addEventListener("touchend",onIntentTouchEnd,{capture:true,passive:true});
    document.addEventListener("touchcancel",function(){touchIntent=null},{capture:true,passive:true});
    document.addEventListener("click",onClickCapture,true);

    window.addEventListener("pageshow",function(){
      installLateLayout();
      lockHomeGeometry(false);
      var active=activeTab();
      if(!surfaceIds().length&&active)resetMainTop();
      if(active==="today"){resetLaunchViewport();armHome();}
    });
    window.addEventListener("orientationchange",function(){
      root.style.removeProperty("--kids-home-hero-height-fixed");
      root.style.removeProperty("--kids-home-title-top-fixed");
      delete root.dataset.kidsHomeGeometryBucket;
      setTimeout(function(){lockHomeGeometry(true);if(activeTab()==="today")armHome()},220);
    });
    document.addEventListener("visibilitychange",function(){
      if(document.visibilityState==="visible"&&activeTab()==="today")armHome();
    });
    armHome();
    setTimeout(function(){if(activeTab()==="today")armHome()},320);
  }

  window.DARKidsNavigation={
    back:back,
    forward:forward,
    resetMainTop:resetMainTop,
    captureScrolls:captureScrolls,
    signature:signature,
    gestureVersion:"button-only-navigation-v1343"
  };

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();