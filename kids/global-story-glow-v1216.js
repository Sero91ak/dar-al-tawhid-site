/* KIDS_STORY_GLOW_PARITY_V1218: retire the old 560ms touch-glow timer.
   All press/focus feedback is owned by kids-card-interaction.js and kids-touch-rail.css.
   Keep the historical public API for compatibility with old bundles. */
(() => {
  "use strict";
  function clearLegacyGlow(){
    document.querySelectorAll(".kids-story-touch-glow").forEach(el=>el.classList.remove("kids-story-touch-glow"));
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",clearLegacyGlow,{once:true});
  else clearLegacyGlow();
  window.DARKidsStoryGlow=Object.freeze({version:1218,glow:()=>{}});
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
