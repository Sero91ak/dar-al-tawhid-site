/* DĀR AL TAWḤĪD KIDS — Global Card Interaction Runtime v3
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

  function mark(root=document){
    if(root.nodeType!==1 && root.nodeType!==9) return;
    if(root.matches?.(TAP_SELECTORS)) root.classList.add("kids-tap-card");
    root.querySelectorAll?.(TAP_SELECTORS).forEach(el=>el.classList.add("kids-tap-card"));

    if(root.matches?.(CONTROL_SELECTORS)) root.classList.add("kids-touch-control");
    root.querySelectorAll?.(CONTROL_SELECTORS).forEach(el=>el.classList.add("kids-touch-control"));

    if(root.matches?.(WIDE_SELECTORS)) root.classList.add("kids-wide-capsule");
    root.querySelectorAll?.(WIDE_SELECTORS).forEach(el=>el.classList.add("kids-wide-capsule"));
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

  function setPressed(el){
    if(!el) return;
    if(active && active!==el) active.classList.remove("is-kids-pressed");
    active=el;
    el.classList.add("is-kids-pressed");
    clearTimeout(releaseTimer);
  }

  function clearPressed(delay=70){
    clearTimeout(releaseTimer);
    releaseTimer=setTimeout(()=>{
      active?.classList.remove("is-kids-pressed");
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
    version:3,
    mark,
    tapSelector:TAP_SELECTORS
  };
})();
