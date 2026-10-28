/* DAR TEST iPhone Duo: viewport-size adaptation; no resize/style MutationObserver.
   The external 5.4" and internal 7.6" layouts are based on available CSS pixels,
   not model strings, physical pixels, or UIDevice orientation. */
(function(global){
 "use strict";
 if(global.DARTestDuoAdaptive)return;
 var root=document.documentElement;
 var navBackup=null,sideNav=null,raf=0,lastKey="";
 var styleKeys=["position","top","bottom","left","right","width","min-width","max-width",
   "height","min-height","max-height","transform","-webkit-transform","display",
   "flex-direction","grid-template-columns","margin","z-index"];
 function measure(){
   var cw=document.documentElement.clientWidth||0,ch=document.documentElement.clientHeight||0;
   var iw=global.innerWidth||0,ih=global.innerHeight||0;
   var w=Math.round(cw&&iw?Math.min(cw,iw):(cw||iw));
   var h=Math.round(ch&&ih?Math.min(ch,ih):(ch||ih));
   var vv=global.visualViewport;
   return {width:w,height:h,aspect:w&&h?+(w/h).toFixed(3):1,
     keyboard:!!(vv&&h-vv.height>140),wide:w>h&&w>=620,
     landscape:w>h};
 }
 function backup(nav){
   if(navBackup&&sideNav===nav)return;
   var values={};
   for(var i=0;i<styleKeys.length;i++){
     var p=styleKeys[i];values[p]=[nav.style.getPropertyValue(p),nav.style.getPropertyPriority(p)];
   }
   navBackup=values;sideNav=nav;
 }
 function style(nav,p,v){nav.style.setProperty(p,v,"important")}
 function release(nav){
   if(sideNav===nav&&navBackup){
     for(var i=0;i<styleKeys.length;i++){
       var p=styleKeys[i],entry=navBackup[p];
       if(entry&&entry[0])nav.style.setProperty(p,entry[0],entry[1]);
       else nav.style.removeProperty(p);
     }
   }
   sideNav=null;navBackup=null;
   document.body&&document.body.classList.remove("dar-duo-side-active");
 }
 // There is one navigation owner: fold-thumb-nav.js. The former DUO
 // inline 60px side rail fought that controller and re-centred the same node.
 function syncNavigation(){
   var owner=global.DarAdaptiveNavPlacement;
   if(owner && typeof owner.apply==="function") owner.apply();
 }

 function apply(){
   var m=measure();
   if(!m.width||!m.height)return;
   var axis=m.landscape?"landscape":"portrait";
   // Android window-size-class principles, with a capacity check so the
   // right reader never collapses into one-character-wide text.
   var available=m.width-(m.width>=1060?148:0)-32;
   var listWidth=Math.min(360,Math.max(270,available*.34));
   var isDual=m.width>=840&&m.height>=560&&!m.keyboard&&
     available-listWidth-18>=480;
   var size=m.width<600?"compact":m.width<840?"medium":"expanded";
   var segments=global.viewport&&global.viewport.segments;
   var hingeGap=0;
   if(segments&&segments.length===2){
     var a=segments[0],b=segments[1];
     if(a&&b&&Number(b.left)>Number(a.right)){
       hingeGap=Math.max(0,Math.min(80,Number(b.left)-Number(a.right)));
     }
   }
   var key=m.width+"x"+m.height+"|"+axis+"|"+size+"|"+m.keyboard+"|"+isDual+"|"+hingeGap;
   if(key!==lastKey){
     root.setAttribute("data-dar-duo-axis",axis);
     root.setAttribute("data-dar-duo-size",size);
     root.setAttribute("data-dar-duo-layout",isDual?"dual":"single");
     root.style.setProperty("--dar-duo-hinge-gap",hingeGap+"px");
     root.style.setProperty("--dar-duo-vw",m.width+"px");
     root.style.setProperty("--dar-duo-vh",m.height+"px");
     lastKey=key;
   }
   // Reposition original five tabs only through the shared owner.
   syncNavigation();
 }
 function schedule(){
   if(raf)return;
   raf=global.requestAnimationFrame(function(){raf=0;apply()});
 }
 function audit(){
   var m=measure(),arr=[];
   document.querySelectorAll(".app,#appView,#appView>*,#appView .dar-fold,#appView .dar-fold__rail,#appView .dar-fold__pane,#appView .feature-grid,#appView .more-group-grid,#appView .qov-surah-list,#appView .sf-feed,#bottomNav").forEach(function(el){
     var rect=el.getBoundingClientRect();
     if(rect.width<1||rect.height<1)return;
     if(el.scrollWidth>el.clientWidth+5||rect.left< -6||rect.right>m.width+6){
       arr.push({name:el.id||el.className||el.tagName,width:Math.round(rect.width),
         clientWidth:el.clientWidth,scrollWidth:el.scrollWidth,left:Math.round(rect.left),right:Math.round(rect.right)});
     }
   });
   return {viewport:m,overflow:arr,sideNavigation:!!document.body?.classList.contains("dar-duo-side-active")};
 }
 global.DARTestDuoAdaptive={measure:measure,syncNavigation:syncNavigation,apply:apply,audit:audit};
 document.addEventListener("DOMContentLoaded",schedule,{once:true});
 global.addEventListener("load",schedule,{once:true});
 global.addEventListener("resize",schedule,{passive:true});
 global.addEventListener("orientationchange",schedule,{passive:true});
 global.addEventListener("hashchange",function(){schedule();global.requestAnimationFrame(schedule)},{passive:true});
 global.addEventListener("dar:layoutchange",schedule,{passive:true});
 global.visualViewport?.addEventListener("resize",schedule,{passive:true});
 schedule();
})(window);
