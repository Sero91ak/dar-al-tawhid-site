/* DĀR AL TAWḤĪD KIDS · Navigation + Scroll Authority v1182
   Global rule:
   - Main tabs always open at the top.
   - Detail/library back returns to the exact parent scroll position.
   - Edge swipe: left edge -> back, right edge -> forward.
   - One bottom clearance only; no stacked empty scroll tail. */
(function(){
  "use strict";

  var root=document.documentElement;
  var shell=null;
  var stack=[];
  var index=-1;
  var replaying=false;
  var clickToken=0;
  var gesture=null;
  var touchPathEnabled=false;
  var swipeAnimating=false;

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

  function onClickCapture(e){
    if(replaying)return;
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

  /* KIDS_INTERACTIVE_EDGE_SWIPE_V1246
     Smooth Kids back navigation:
     right edge -> swipe left = back
     left edge -> swipe right = back
     the active surface follows the finger and springs back on cancel.
  */
  function installInteractiveSwipeStyles(){
    if(document.getElementById("kids-interactive-edge-swipe-v1246"))return;
    var style=document.createElement("style");
    style.id="kids-interactive-edge-swipe-v1246";
    style.textContent=[
      "html.kids-nav-dragging,html.kids-nav-dragging body{overscroll-behavior-x:none!important;}",
      "html.kids-nav-dragging body{user-select:none!important;-webkit-user-select:none!important;}",
      ".kids-nav-swipe-surface{will-change:transform,opacity,box-shadow!important;backface-visibility:hidden!important;-webkit-backface-visibility:hidden!important;}",
      "@keyframes kidsNavSurfaceInV1246{from{opacity:.74;transform:translate3d(20px,0,0)}to{opacity:1;transform:translate3d(0,0,0)}}",
      "#psLibraryPage.open,#msLibraryPage.open,#syLibraryPage.open,#dlLibraryPage.open,#ghWorld.open{animation:kidsNavSurfaceInV1246 .34s cubic-bezier(.22,1,.36,1) both;}",
      "@media(prefers-reduced-motion:reduce){#psLibraryPage.open,#msLibraryPage.open,#syLibraryPage.open,#dlLibraryPage.open,#ghWorld.open{animation:none!important}}"
    ].join("\n");
    (document.head||root).appendChild(style);
  }

  function ignoreGestureTarget(target){
    return !!(target&&target.closest&&target.closest(
      "input,textarea,select,[contenteditable='true'],[role='slider'],.gh-progress,.kfr-progress,"+
      "[data-kids-horizontal-scroll],.dua-word-strip,.quran-strip,.alphabet-strip,"+
      ".story-strip-scroller,.surah-strip,.kids-carousel,[data-swipe-lock]"
    ));
  }

  function currentSwipeSurface(){
    var selectors=[
      ".kids-salah-overlay:not([hidden])","#duaSmartLearn.open","#studioContentModal.open",
      "#kidsSalahDailyPage:not([hidden])",
      ".kids-follow-reader.open",
      "#psModal.open","#msModal.open","#syModal.open","#dlModal.open",
      "#ghPlayer.open","#duaHubDetail.open",
      "#knowledgeModal.open","#duaModal.open","#quizModal.open","#quranModal.open","#fullQuranModal.open","#storyModal.open",
      "#psLibraryPage.open","#msLibraryPage.open","#syLibraryPage.open","#dlLibraryPage.open","#ghWorld.open"
    ];
    for(var i=0;i<selectors.length;i++){
      var el=q(selectors[i]);
      if(el)return el;
    }
    return index>0?q(".view.active"):null;
  }

  function rememberSwipeInline(el){
    var state={};
    ["transform","opacity","transition","will-change","box-shadow"].forEach(function(prop){
      state[prop]={value:el.style.getPropertyValue(prop),priority:el.style.getPropertyPriority(prop)};
    });
    return state;
  }

  function restoreSwipeInline(el,state){
    if(!el||!state)return;
    Object.keys(state).forEach(function(prop){
      var prev=state[prop];
      if(prev&&prev.value)el.style.setProperty(prop,prev.value,prev.priority||"");
      else el.style.removeProperty(prop);
    });
    el.classList.remove("kids-nav-swipe-surface");
  }

  function inwardDistance(g,x){return g.side==="left"?x-g.x:g.x-x}

  function applySwipePosition(g,raw){
    if(!g||!g.surface)return;
    var width=Math.max(1,Number(innerWidth)||390);
    var dist=Math.max(0,Math.min(width*1.04,raw));
    var sign=g.side==="left"?1:-1;
    var p=Math.max(0,Math.min(1,dist/width));
    var moved=dist*(.96-p*.035);
    g.distance=dist;
    g.surface.style.setProperty("transition","none","important");
    g.surface.style.setProperty("will-change","transform,opacity,box-shadow","important");
    g.surface.style.setProperty("transform","translate3d("+(sign*moved).toFixed(2)+"px,0,0)","important");
    g.surface.style.setProperty("opacity",String(1-p*.075),"important");
    g.surface.style.setProperty("box-shadow",(sign>0?"-18px 0 38px":"18px 0 38px")+" rgba(0,0,0,"+(0.10+p*.13).toFixed(3)+")","important");
  }

  function finishSwipeAnimation(g,commit){
    if(!g||!g.surface)return;
    var el=g.surface,reduced=false;
    swipeAnimating=true;
    try{reduced=matchMedia("(prefers-reduced-motion: reduce)").matches}catch(_){}
    if(commit){
      var sign=g.side==="left"?1:-1;
      var duration=reduced?120:245;
      el.style.setProperty("transition","transform "+duration+"ms cubic-bezier(.22,1,.36,1), opacity "+Math.max(100,duration-25)+"ms ease, box-shadow "+duration+"ms ease","important");
      el.style.setProperty("transform","translate3d("+(sign*104)+"vw,0,0)","important");
      el.style.setProperty("opacity",".91","important");
      setTimeout(function(){
        var didBack=false;
        try{didBack=back()}finally{
          requestAnimationFrame(function(){
            restoreSwipeInline(el,g.inline);
            root.classList.remove("kids-nav-dragging");
            swipeAnimating=false;
            if(didBack){
              root.classList.add("kids-nav-just-returned");
              setTimeout(function(){root.classList.remove("kids-nav-just-returned")},330);
            }
          });
        }
      },Math.max(95,duration-28));
      return;
    }
    var duration=reduced?130:285;
    el.style.setProperty("transition","transform "+duration+"ms cubic-bezier(.22,1,.36,1), opacity "+Math.max(100,duration-45)+"ms ease, box-shadow "+duration+"ms ease","important");
    el.style.setProperty("transform",g.inline.transform.value||"translate3d(0,0,0)",g.inline.transform.priority||"important");
    el.style.setProperty("opacity",g.inline.opacity.value||"1",g.inline.opacity.priority||"important");
    el.style.setProperty("box-shadow",g.inline["box-shadow"].value||"none",g.inline["box-shadow"].priority||"important");
    setTimeout(function(){
      restoreSwipeInline(el,g.inline);
      root.classList.remove("kids-nav-dragging");
      swipeAnimating=false;
    },duration+28);
  }

  function pointerDown(e){
    if(swipeAnimating||gesture||e.isPrimary===false||e.pointerType==="mouse"||
       (touchPathEnabled&&e.pointerType==="touch")||ignoreGestureTarget(e.target))return;
    if(!visibleBackButton()&&index<=0)return;
    var width=Math.max(320,Number(innerWidth)||390);
    var edge=Math.max(72,Math.min(128,width*.15));
    var side=e.clientX<=edge?"left":"";
    if(!side)return;
    var surface=currentSwipeSurface();
    if(!surface)return;
    gesture={id:e.pointerId,side:side,x:e.clientX,y:e.clientY,t:performance.now(),lastX:e.clientX,lastY:e.clientY,claimed:false,surface:surface,inline:rememberSwipeInline(surface),distance:0};
  }

  function pointerMove(e){
    if(!gesture||e.pointerId!==gesture.id)return;
    var g=gesture,dist=inwardDistance(g,e.clientX),dy=Math.abs(e.clientY-g.y);
    g.lastX=e.clientX;g.lastY=e.clientY;
    if(!g.claimed){
      if(dist>10&&dist>dy*1.18){
        g.claimed=true;
        g.surface.classList.add("kids-nav-swipe-surface");
        root.classList.add("kids-nav-dragging");
      }else if(dy>13&&dy>Math.max(12,Math.abs(dist))*1.18){
        gesture=null;
        return;
      }else return;
    }
    if(e.cancelable)e.preventDefault();
    if(typeof e.stopImmediatePropagation==="function")e.stopImmediatePropagation();
    applySwipePosition(g,Math.max(0,dist));
  }

  function pointerCancel(e){
    if(!gesture||(e&&e.pointerId!==gesture.id))return;
    var g=gesture;gesture=null;
    if(g.claimed)finishSwipeAnimation(g,false);
  }

  function pointerUp(e){
    if(!gesture||e.pointerId!==gesture.id)return;
    var g=gesture;gesture=null;
    if(!g.claimed)return;
    if(e.cancelable)e.preventDefault();
    if(typeof e.stopImmediatePropagation==="function")e.stopImmediatePropagation();
    var x=Number(e.clientX);if(!Number.isFinite(x))x=g.lastX;
    var y=Number(e.clientY);if(!Number.isFinite(y))y=g.lastY;
    var dist=Math.max(0,inwardDistance(g,x));
    var dy=Math.abs(y-g.y),dt=Math.max(1,performance.now()-g.t),velocity=dist/dt;
    var width=Math.max(320,Number(innerWidth)||390);
    var threshold=Math.max(78,Math.min(126,width*.255));
    var commit=dist>dy*1.18&&(dist>=threshold||(velocity>.48&&dist>34));
    finishSwipeAnimation(g,commit);
  }

  /* iOS WKWebView: touch events remain reliable when system edge gestures
     cancel PointerEvents. Handle exactly one finger; never steal vertical
     scrolling or a known horizontal carousel. All listeners are non-passive
     only where preventDefault is required after a horizontal claim. */
  function touchStart(e){
    if(swipeAnimating||gesture||!e.touches||e.touches.length!==1)return;
    var t=e.touches[0];
    pointerDown({pointerId:t.identifier+10000,pointerType:"touch-fallback",
      isPrimary:true,target:e.target,clientX:t.clientX,clientY:t.clientY});
  }
  function touchMove(e){
    if(!gesture||!e.touches||e.touches.length!==1)return;
    var t=e.touches[0];
    pointerMove({pointerId:t.identifier+10000,clientX:t.clientX,clientY:t.clientY,
      cancelable:e.cancelable,preventDefault:function(){e.preventDefault()},
      stopImmediatePropagation:function(){e.stopImmediatePropagation()}});
  }
  function touchEnd(e){
    if(!gesture||!e.changedTouches)return;
    for(var i=0;i<e.changedTouches.length;i++){
      var t=e.changedTouches[i];
      if(t.identifier+10000!==gesture.id)continue;
      pointerUp({pointerId:gesture.id,clientX:t.clientX,clientY:t.clientY,
        cancelable:e.cancelable,preventDefault:function(){e.preventDefault()},
        stopImmediatePropagation:function(){e.stopImmediatePropagation()}});
      break;
    }
  }
  function touchCancel(e){
    if(!gesture||!e.changedTouches)return;
    for(var i=0;i<e.changedTouches.length;i++){
      if(e.changedTouches[i].identifier+10000===gesture.id){
        pointerCancel({pointerId:gesture.id});break;
      }
    }
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
    installInteractiveSwipeStyles();
    if(shell){
      try{shell.scrollTo({top:0,left:0,behavior:"auto"})}catch(_){shell.scrollTop=0}
    }
    stack=[{desc:{type:"tab",target:activeTab()},signature:signature(),scrolls:captureScrolls()}];
    index=0;
    document.addEventListener("click",onClickCapture,true);
    document.addEventListener("pointerdown",pointerDown,true);
    document.addEventListener("pointermove",pointerMove,true);
    document.addEventListener("pointerup",pointerUp,true);
    document.addEventListener("pointercancel",pointerCancel,true);
    touchPathEnabled=("ontouchstart" in window)||(navigator.maxTouchPoints>0);
    if(touchPathEnabled){
      document.addEventListener("touchstart",touchStart,{capture:true,passive:true});
      document.addEventListener("touchmove",touchMove,{capture:true,passive:false});
      document.addEventListener("touchend",touchEnd,{capture:true,passive:false});
      document.addEventListener("touchcancel",touchCancel,{capture:true,passive:true});
    }

    window.addEventListener("pageshow",function(){
      installLateLayout();
      lockHomeGeometry(false);
      var active=activeTab();
      if(!surfaceIds().length&&active)resetMainTop();
      if(active==="today")armHome();
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
    gestureVersion:"interactive-touch-edge-swipe-v1280"
  };

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();