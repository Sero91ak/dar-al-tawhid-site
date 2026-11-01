/* DĀR TEST — Fold/Duo experimental controller retired 2026-10-28.
   Keep the existing public API for callers in the test HTML. No viewport flags,
   navigation relocation, custom split panes or custom layout CSS are applied.
   The original adult tablet/phone layout stays responsible for rendering. */
(function(global){
 "use strict";
 var doc=global.document||document;
 function measure(){
   var root=doc.documentElement;
   var width=(root&&root.clientWidth)||global.innerWidth||0;
   var height=(root&&root.clientHeight)||global.innerHeight||0;
   return {width:width,height:height,aspect:height?width/height:1,
     wide:false,landscape:width>height,keyboard:false};
 }
 function apply(){
   var root=doc.documentElement;
   if(root&&typeof root.removeAttribute==="function"){
     root.removeAttribute("data-dar-duo-axis");
     root.removeAttribute("data-dar-duo-size");
     root.removeAttribute("data-dar-duo-layout");
     root.style&&root.style.removeProperty&&root.style.removeProperty("--dar-duo-vw");
     root.style&&root.style.removeProperty&&root.style.removeProperty("--dar-duo-vh");
   }
   if(doc.body&&doc.body.classList)doc.body.classList.remove("dar-duo-side-active");
   return true;
 }
 function audit(){return {viewport:measure(),foldOverridesActive:false,sideNavigation:false,overflow:[]};}
 global.DARTestDuoAdaptive={measure:measure,apply:apply,syncNavigation:function(){return false;},audit:audit,
   retired:true};
 if(doc.readyState==="loading")doc.addEventListener("DOMContentLoaded",apply,{once:true});
 else apply();
})(typeof window!=="undefined"?window:this);
