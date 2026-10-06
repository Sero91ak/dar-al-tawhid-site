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
      "  margin-bottom:0!important;",
      "}",
      "html[data-kids-age] body .shell > #view-today.view,",
      "html[data-kids-age] body .shell > #view-stories.view,",
      "html[data-kids-age] body .shell > #view-quran.view,",
      "html[data-kids-age] body .shell > #view-parents.view{",
      "  padding-bottom:0!important;",
      "}",
      "html[data-kids-age][data-view=\"stories\"] body .shell > #view-stories.ps-stories-home.view.active{",
      "  min-height:0!important;",
      "  padding-bottom:0!important;",
      "  margin-bottom:0!important;",
      "  scroll-padding-bottom:calc(92px + env(safe-area-inset-bottom,0px))!important;",
      "}",
      "html[data-kids-age] body .shell > .view.active > :last-child{margin-bottom:0!important;}",
      "@media(max-width:380px){html[data-kids-age] body .shell{padding-bottom:calc(88px + env(safe-area-inset-bottom,0px))!important;}}",
      "@media(min-width:700px){html[data-kids-age] body .shell{padding-bottom:calc(98px + env(safe-area-inset-bottom,0px))!important;}}"
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
      "knowledgeModal","duaModal","quizModal","quranModal","fullQuranModal","storyModal",
      "psLibraryPage","psModal","msLibraryPage","msModal","syLibraryPage","syModal",
      "ghWorld","ghPlayer"
    ];
    fixed.forEach(function(id){
      var el=document.getElementById(id);
      if(el&&el.classList.contains("open"))out.push(id);
    });
    qa(".kids-follow-reader.open[id]").forEach(function(el){out.push(el.id)});
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
      "#syLibraryScroll","#syScroll",
      "#ghWorldScroll","#ghPlayerScroll",
      "#knowledgeModal .modal-shell","#duaModal .modal-shell","#quizModal .modal-shell",
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
    var el=target.closest("button,a,[data-go],[data-story],[data-ps-id],[data-ms-id],[data-sy-id],[data-gh-id]");
    if(!el)return null;
    var nav=el.closest(".nav-btn[data-target]");
    if(nav)return {type:"tab",target:nav.dataset.target};

    var go=el.closest("[data-go]");
    if(go){
      if(go.id)return {type:"click-id",id:go.id};
      return {type:"tab",target:go.dataset.go};
    }

    if(el.id==="psProphetEntry")return {type:"ps-library"};
    if(el.id==="msEntry")return {type:"ms-library"};
    if(el.id==="syEntry")return {type:"sy-library"};

    var ps=el.closest("[data-ps-id]");
    if(ps)return {type:"ps-story",id:ps.dataset.psId};
    var ms=el.closest("[data-ms-id]");
    if(ms)return {type:"ms-story",id:ms.dataset.msId};
    var sy=el.closest("[data-sy-id]");
    if(sy)return {type:"sy-story",id:sy.dataset.syId};
    var shortStory=el.closest("[data-story]");
    if(shortStory)return {type:"short-story",id:shortStory.dataset.story};
    var gh=el.closest("[data-gh-id]");
    if(gh){
      var cat=q(".gh-category.active[data-gh-cat]");
      return {type:"gh-story",id:gh.dataset.ghId,cat:cat&&cat.dataset.ghCat||"prophets"};
    }
    if(el.id)return {type:"click-id",id:el.id};
    return null;
  }

  function isBackControl(target){
    if(!target||!target.closest)return false;
    return !!target.closest(
      "[data-close],#psClose,#psLibraryBack,#msClose,#msBack,#syClose,#syBack,"+
      "#ghBack,#ghPlayerBack,#ghPlayerMin,.kfr-close"
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
      if(desc&&desc.type==="tab")resetMainTop();
      return;
    }
    if(back){
      syncBackState(after);
      return;
    }
    pushState(desc,after);
    if(desc&&desc.type==="tab")resetMainTop();
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
    if(desc.type==="ps-library"&&window.DARKidsProphetStories?.openLibrary){window.DARKidsProphetStories.openLibrary();return true}
    if(desc.type==="ps-story"&&window.DARKidsProphetStories?.open){window.DARKidsProphetStories.open(desc.id);return true}
    if(desc.type==="ms-library"&&window.DARKidsMubashshirun?.openLibrary){window.DARKidsMubashshirun.openLibrary();return true}
    if(desc.type==="ms-story"&&window.DARKidsMubashshirun?.open){window.DARKidsMubashshirun.open(desc.id);return true}
    if(desc.type==="sy-library"&&window.DARKidsSahabiyyat?.openLibrary){window.DARKidsSahabiyyat.openLibrary();return true}
    if(desc.type==="sy-story"&&window.DARKidsSahabiyyat?.open){window.DARKidsSahabiyyat.open(desc.id);return true}
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
      ".kids-follow-reader.open .kfr-close",
      "#psModal.open #psClose","#msModal.open #msClose","#syModal.open #syClose",
      "#ghPlayer.open #ghPlayerBack",
      ".modal.open [data-close]",
      "#psLibraryPage.open #psLibraryBack","#msLibraryPage.open #msBack","#syLibraryPage.open #syBack",
      "#ghWorld.open #ghBack"
    ];
    for(var i=0;i<selectors.length;i++){
      var el=q(selectors[i]);
      if(el)return el;
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

  function ignoreGestureTarget(target){
    return !!(target&&target.closest&&target.closest(
      "input,textarea,select,[contenteditable='true'],[role='slider'],.gh-progress,.kfr-progress,.ayah-stage,.quiz-stage"
    ));
  }

  function pointerDown(e){
    if(e.isPrimary===false)return;
    if(e.pointerType==="mouse")return;
    if(ignoreGestureTarget(e.target))return;
    var edge=Math.max(26,Math.min(42,innerWidth*.095));
    var side=e.clientX<=edge?"back":(e.clientX>=innerWidth-edge?"forward":"");
    if(!side)return;
    gesture={id:e.pointerId,side:side,x:e.clientX,y:e.clientY,t:performance.now(),lastX:e.clientX,lastY:e.clientY};
  }

  function pointerMove(e){
    if(!gesture||e.pointerId!==gesture.id)return;
    gesture.lastX=e.clientX;gesture.lastY=e.clientY;
  }

  function pointerCancel(e){
    if(gesture&&(!e||e.pointerId===gesture.id))gesture=null;
  }

  function pointerUp(e){
    if(!gesture||e.pointerId!==gesture.id)return;
    var g=gesture;gesture=null;
    var x=Number(e.clientX);if(!Number.isFinite(x))x=g.lastX;
    var y=Number(e.clientY);if(!Number.isFinite(y))y=g.lastY;
    var dx=x-g.x,dy=y-g.y,dt=Math.max(1,performance.now()-g.t);
    var min=Math.max(68,Math.min(96,innerWidth*.22));
    var horizontal=Math.abs(dx)>Math.abs(dy)*1.25;
    var fast=Math.abs(dx)/dt>.16||Math.abs(dx)>125;
    var valid=g.side==="back"?dx>min:dx<-min;
    if(!valid||!horizontal||!fast)return;
    if(e.cancelable)e.preventDefault();
    if(typeof e.stopImmediatePropagation==="function")e.stopImmediatePropagation();
    if(g.side==="back")back();else forward();
  }

  function init(){
    shell=q(".shell");
    installLateLayout();
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

    window.addEventListener("pageshow",function(){
      installLateLayout();
      var active=activeTab();
      if(!surfaceIds().length&&active)resetMainTop();
    });
  }

  window.DARKidsNavigation={
    back:back,
    forward:forward,
    resetMainTop:resetMainTop,
    captureScrolls:captureScrolls,
    signature:signature
  };

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();