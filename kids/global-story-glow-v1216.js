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
window.DARKidsStoryGlow=Object.freeze({version:1216,glow});
})();