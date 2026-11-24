/* DĀR AL TAWḤĪD · Visitor single-Home recovery · iOS/Android/PWA web only.
 * The native iOS WKWebView loads the same /?native_ios=1#home web shell in
 * portrait and landscape; Swift does not own a separate orientation Home.
 * This small boot guarantees that the approved parity Home actually mounts.
 * The existing parity renderer still owns all layout and hidden-legacy DOM.
 * No renderer duplication, page reload, cache purge, native change or push.
 */
(function(){
  "use strict";
  var path=String(location.pathname||"/");
  if(!(path==="/"||path==="/index.html"||path==="/pwa"||path==="/pwa/"||path==="/pwa/index.html"))return;
  if(window.__DAR_VISITOR_HOME_BOOT_V2)return;
  window.__DAR_VISITOR_HOME_BOOT_V2=true;
  var attempts=0,pending=false,timer=0,ownScript=null;
  var PARITY="/assets/dar-home-test-parity-visitor.js?v=20261124-single-home-boot-v2";
  function isHome(){return !!(document.body&&document.body.classList.contains("is-home-route"))}
  function found(){return !!document.getElementById("darHomeHtmlParityV1")}
  function retry(){
    if(attempts>=8)return;
    attempts++;
    if(timer)clearTimeout(timer);
    timer=setTimeout(queue,Math.min(180+attempts*170,960));
  }
  function check(){
    pending=false;
    if(!isHome()){attempts=0;return}
    if(found()){attempts=0;return}
    if(!document.querySelector(".top-shell")){retry();return}
    if(window.__darHomeHtmlParityV1){
      // The renderer loaded, but the Home root vanished or did not mount
      // during orientation. Reuse its existing idempotent sync() handler.
      document.dispatchEvent(new Event("dar:view-rendered"));
      if(!found())retry();
      return;
    }
    if(ownScript){retry();return}
    // An original defer script may still be loading. Do not force a second
    // import while it is pending; one bounded retry handles slow WebKit boot.
    if(document.querySelector('script[src*="dar-home-test-parity-visitor.js"]')&&attempts<3){
      retry();return;
    }
    ownScript=document.createElement("script");
    ownScript.id="darVisitorParityRescueV2";
    ownScript.src=PARITY;
    ownScript.async=true;
    ownScript.onload=function(){ownScript=null;queue()};
    ownScript.onerror=function(){
      console.warn("DĀR Visitor Home: canonical renderer unavailable; leaving legacy navigation functional");
      ownScript=null;
    };
    (document.body||document.documentElement).appendChild(ownScript);
    retry();
  }
  function queue(){
    if(pending)return;
    pending=true;
    if(typeof requestAnimationFrame==="function")requestAnimationFrame(check);
    else setTimeout(check,0);
  }
  function reset(){attempts=0;queue()}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",reset,{once:true});
  else queue();
  window.addEventListener("pageshow",reset,{passive:true});
  window.addEventListener("hashchange",reset,{passive:true});
  window.addEventListener("orientationchange",reset,{passive:true});
  window.addEventListener("dar:layoutchange",reset,{passive:true});
  window.addEventListener("resize",queue,{passive:true});
})();
