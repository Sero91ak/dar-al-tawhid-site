/* Q_SOURCE_APP_VIEW_V1 · Mobile/Tablet source navigation only.
   Same-origin Q citations always use this view's main frame.
   External primary sources retain their explicit destinations. */
(function(){
  "use strict";
  var coarse = false;
  try { coarse = matchMedia("(pointer: coarse)").matches; } catch (_) {}
  var mobileOrTablet = coarse || /Android|iPhone|iPad|iPod|DarAlTawhid/i.test(navigator.userAgent || "");
  if (!mobileOrTablet) return;
  var viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) viewport.content = "width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover";
  ["gesturestart","gesturechange","gestureend"].forEach(function(type){
    document.addEventListener(type,function(event){if(event.cancelable)event.preventDefault();},{capture:true,passive:false});
  });
  document.addEventListener("touchmove",function(event){
    if(event.touches && event.touches.length > 1 && event.cancelable) event.preventDefault();
  },{capture:true,passive:false});
  document.addEventListener("click",function(event){
    if(event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    var anchor=event.target && event.target.closest ? event.target.closest("a[href]") : null;
    if(!anchor || anchor.hasAttribute("download")) return;
    var target;
    try { target=new URL(anchor.getAttribute("href"),location.href); } catch(_){return;}
    if(target.origin !== location.origin || !/^\/q\/[1-9][0-9]*\/?$/.test(target.pathname))return;
    // Keep every numbered DAR source in the existing PWA/WKWebView frame.
    event.preventDefault();
    event.stopImmediatePropagation();
    window.location.assign(target.pathname.replace(/\/?$/,"/")+target.search+target.hash);
  },true);
})();