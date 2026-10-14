/* KIDS_GIRLS_SYSTEM_TINT_V1332 — browser theme-color follows
   the existing profile state. No new storage or navigation listeners. */
(function(){
  "use strict";
  var app=document.querySelector(".app");
  var meta=document.querySelector('meta[name="theme-color"]');
  if(!app||!meta)return;
  var neutral="#0c2636";
  function apply(){
    var next=app.getAttribute("data-gender")==="girl"?"#241b35":neutral;
    if(meta.getAttribute("content")!==next)meta.setAttribute("content",next);
  }
  apply();
  if(typeof MutationObserver==="function"){
    new MutationObserver(apply).observe(app,{attributes:true,attributeFilter:["data-gender"]});
  }
})();
