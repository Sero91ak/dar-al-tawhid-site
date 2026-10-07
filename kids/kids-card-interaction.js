/* DĀR AL TAWḤĪD KIDS — Global Card Interaction Runtime v4
   KIDS_GLOBAL_TOUCH_GLOW
   Applies one touch language to all current and future Kids card/capsule surfaces.
*/
(()=>{
  "use strict";

  const TAP_SELECTORS=[
    "#view-today .resume",
    "#view-today .choice",
    "#view-today .knowledge-card",
    "#view-today .daily-step",
    "#view-stories .story-row",
    "#view-stories .story-feature",
    "#view-stories .deen-entry",
    "#view-stories .ps-prophet-entry",
    "#view-stories .ms-entry",
    "#view-quran .quran-action",
    "#view-quran .alphabet-entry",
    "#view-quran .surah-card",
    "#view-quran .verse-card",
    "#view-quran .full-quran",
    ".gh-entry",
    ".gh-category",
    ".gh-continue-card",
    ".gh-story",
    ".gh-next button",
    ".ps-muhammad-card",
    ".ps-story-row",
    ".ms-library-page .ms-story-row",
    ".dl-library-page .dl-story-row",
    ".studio-content-card",
    ".studio-story-row",
    ".kids-tap-card"
  ].join(",");

  const CONTROL_SELECTORS=[
    ".dl-detail-modes button",
    ".ms-detail-modes button",
    ".ps-prophet-modes button",
    ".dua-main-listen",
    ".dua-main-learn",
    ".dua-audio-de",
    ".dua-nav-btn",
    ".quiz-listen",
    ".quiz-next",
    "#view-parents .parent-card button",
    "#view-today .daily-start",
    ".knowledge-listen"
  ].join(",");

  const WIDE_SELECTORS=[
    "#view-today .resume",
    "#view-today .choice",
    "#view-today .knowledge-card",
    "#view-stories > .deen-entry",
    "#view-stories > .ps-prophet-entry",
    "#view-stories > .ms-entry",
    "#view-stories > .story-row",
    "#view-quran > .full-quran",
    ".ps-story-row",
    ".ms-library-page .ms-story-row"
  ].join(",");

  /* Future-proof contract: new clickable surfaces inside Kids views/libraries
     automatically inherit the global glow unless they are explicit navigation/close controls. */
  const AUTO_SURFACE_SELECTORS=[
    "#view-today button",
    "#view-stories button",
    "#view-quran button",
    "#view-quiz button",
    "#view-parents button",
    ".ps-library-page button",
    ".ms-library-page button",
    ".dl-library-page button",
    ".gh-page button",
    ".story-hub button",
    ".studio-content button"
  ].join(",");

  const EXCLUDE_SELECTORS=[
    ".nav-btn",
    ".bottom-nav button",
    ".tab-bar button",
    ".ms-back",
    ".ps-back",
    ".dl-back",
    ".ms-close",
    ".ps-close",
    ".dl-close",
    ".close-btn",
    "[data-close]",
    "[data-kids-no-glow]"
  ].join(",");

  function markOne(el){
    if(!el || el.nodeType!==1) return;
    if(el.matches?.(EXCLUDE_SELECTORS)) return;

    if(el.matches?.(CONTROL_SELECTORS)){
      el.classList.add("kids-touch-control");
      el.classList.remove("kids-tap-card");
    }else if(el.matches?.(TAP_SELECTORS) || el.matches?.(AUTO_SURFACE_SELECTORS)){
      el.classList.add("kids-tap-card");
    }

    if(el.matches?.(WIDE_SELECTORS)) el.classList.add("kids-wide-capsule");
  }

  function mark(root=document){
    if(root.nodeType!==1 && root.nodeType!==9) return;
    if(root.nodeType===1) markOne(root);
    root.querySelectorAll?.([TAP_SELECTORS,CONTROL_SELECTORS,AUTO_SURFACE_SELECTORS,WIDE_SELECTORS].join(","))
      .forEach(markOne);
  }

  mark();

  const mo=new MutationObserver(records=>{
    for(const rec of records){
      for(const node of rec.addedNodes){
        if(node.nodeType===1) mark(node);
      }
    }
  });
  mo.observe(document.documentElement,{childList:true,subtree:true});

  let active=null;
  let releaseTimer=0;

  /* Inline !important press lock: component-level !important shadows must never
     suppress the global iPhone/iPad touch glow. Previous inline values are restored. */
  const pressInlineState=new WeakMap();
  const PRESS_PROPS=["border-color","box-shadow","filter"];

  function rememberInline(el){
    if(pressInlineState.has(el)) return;
    const state={};
    PRESS_PROPS.forEach(prop=>{
      state[prop]={
        value:el.style.getPropertyValue(prop),
        priority:el.style.getPropertyPriority(prop)
      };
    });
    pressInlineState.set(el,state);
  }

  function applyInlinePress(el){
    rememberInline(el);
    const compact=el.classList.contains("kids-touch-control");
    el.style.setProperty("border-color","rgba(250,220,145,.82)","important");
    el.style.setProperty(
      "box-shadow",
      compact
        ? "inset 0 0 0 1px rgba(255,232,164,.28), inset 0 0 18px rgba(240,202,116,.12), 0 0 26px rgba(240,202,116,.22)"
        : "inset 0 0 0 1px rgba(255,232,164,.30), inset 0 0 28px rgba(240,202,116,.15), 0 0 0 1px rgba(250,220,145,.21), 0 0 36px rgba(240,202,116,.25), 0 14px 34px rgba(0,0,0,.18)",
      "important"
    );
    el.style.setProperty("filter",compact?"brightness(1.065)":"brightness(1.075) saturate(1.025)","important");
  }

  function restoreInlinePress(el){
    const state=pressInlineState.get(el);
    if(!state) return;
    PRESS_PROPS.forEach(prop=>{
      const prev=state[prop];
      if(prev.value) el.style.setProperty(prop,prev.value,prev.priority||"");
      else el.style.removeProperty(prop);
    });
    pressInlineState.delete(el);
  }

  function setPressed(el){
    if(!el) return;
    if(active && active!==el){
      active.classList.remove("is-kids-pressed");
      restoreInlinePress(active);
    }
    active=el;
    el.classList.add("is-kids-pressed");
    applyInlinePress(el);
    clearTimeout(releaseTimer);
  }

  function clearPressed(delay=70){
    clearTimeout(releaseTimer);
    releaseTimer=setTimeout(()=>{
      const el=active;
      if(el){
        el.classList.remove("is-kids-pressed");
        restoreInlinePress(el);
      }
      active=null;
    },delay);
  }

  document.addEventListener("pointerdown",e=>{
    const el=e.target.closest?.(".kids-tap-card,.kids-touch-control");
    if(!el || el.disabled || el.getAttribute("aria-disabled")==="true") return;
    setPressed(el);
  },{passive:true,capture:true});

  document.addEventListener("pointerup",()=>clearPressed(165),{passive:true,capture:true});
  document.addEventListener("pointercancel",()=>clearPressed(0),{passive:true,capture:true});
  document.addEventListener("pointerleave",e=>{
    if(active && e.target===active) clearPressed(0);
  },{passive:true,capture:true});

  let lastPointerAt=0;
  document.addEventListener("pointerdown",()=>{lastPointerAt=performance.now()},{passive:true,capture:true});
  document.addEventListener("touchstart",e=>{
    if(performance.now()-lastPointerAt<220)return;
    const el=e.target.closest?.(".kids-tap-card,.kids-touch-control");
    if(!el||el.disabled||el.getAttribute("aria-disabled")==="true")return;
    setPressed(el);
  },{passive:true,capture:true});
  document.addEventListener("touchend",()=>clearPressed(165),{passive:true,capture:true});
  document.addEventListener("touchcancel",()=>clearPressed(0),{passive:true,capture:true});

  window.DARKidsCardInteraction={
    version:4,
    mark,
    tapSelector:TAP_SELECTORS
  };
})();
