(() => {
"use strict";
const selector=[
  "#view-stories #psProphetEntry",
  "#view-stories #msEntry",
  "#view-stories #syEntry",
  "#view-stories #deenEntry",
  "#view-stories .story-row",
  ".ps-library-page [data-ps-id]",
  ".ms-library-page [data-ms-id]",
  ".ms-library-page [data-sy-id]",
  ".dl-library-page [data-dl-id]",
  "#ghWorld .gh-category",
  "#ghWorld .gh-story",
  "[data-ps-mode]",
  "[data-ms-mode]",
  "[data-sy-mode]",
  "[data-dl-mode]"
].join(",");
const timers=new WeakMap();
function glow(target){
  if(!target||target.disabled||target.getAttribute("aria-disabled")==="true")return;
  target.classList.remove("kids-story-touch-glow");
  void target.offsetWidth;
  target.classList.add("kids-story-touch-glow");
  const old=timers.get(target);if(old)clearTimeout(old);
  timers.set(target,setTimeout(()=>{target.classList.remove("kids-story-touch-glow");timers.delete(target)},560));
}
function fromEvent(e){
  const target=e.target?.closest?.(selector);
  if(target)glow(target);
}
document.addEventListener("pointerdown",fromEvent,true);
document.addEventListener("click",e=>{if(e.detail===0)fromEvent(e)},true);
window.DARKidsStoryGlow=Object.freeze({version:1217,glow});
})();

/* DU'A HUB LOADER v1239 — use the direct shell includes when present; inject only as a fallback. */
(() => {
  "use strict";
  function ensureDuaHub(){
    if (!document.querySelector('link[href*="/kids/dua-hub-v1219.css"]')) {
      const link=document.createElement("link");
      link.rel="stylesheet";
      link.href="/kids/dua-hub-v1219.css?v=1238";
      link.dataset.kidsDuaHub="1239";
      document.head.appendChild(link);
    }
    if (!document.querySelector('script[src*="/kids/dua-hub-v1219.js"]')) {
      const script=document.createElement("script");
      script.src="/kids/dua-hub-v1219.js?v=1238";
      script.dataset.kidsDuaHub="1239";
      script.defer=true;
      (document.body||document.documentElement).appendChild(script);
    }
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",ensureDuaHub,{once:true});
  else ensureDuaHub();
})();
