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
 function syncNavigation(nav){
   nav=nav||document.getElementById("bottomNav");
   if(!nav||!document.body)return;
   var m=measure();
   var body=document.body;
   var exclude=body.classList.contains("is-ilm-chat-route")||
     body.classList.contains("is-quran-player-route")||
     body.classList.contains("is-library-reader-route")||
     body.classList.contains("dar-test-reading-open")||
     body.classList.contains("image-editor-mode")||
     root.classList.contains("is-quran-player-route");
   var active=m.wide&&m.width<=1200&&m.height>=380&&m.height<=760&&!m.keyboard&&!exclude;
   if(!active){
     if(sideNav===nav||body.classList.contains("dar-duo-side-active"))release(nav);
     return;
   }
   backup(nav);
   body.classList.add("dar-duo-side-active");
   // Update only a handful of inline properties already owned by the test nav.
   // ensureBottomNavDock() calls us when it resets the bottom tabbar.
   style(nav,"position","fixed");
   style(nav,"top","50%");
   style(nav,"bottom","auto");
   style(nav,"left","max(8px,env(safe-area-inset-left,0px))");
   style(nav,"right","auto");
   style(nav,"width","60px");
   style(nav,"min-width","60px");
   style(nav,"max-width","60px");
   style(nav,"height","min(390px,calc(100dvh - 28px))");
   style(nav,"min-height","0");
   style(nav,"max-height","min(390px,calc(100dvh - 28px))");
   style(nav,"transform","translateY(-50%)");
   style(nav,"-webkit-transform","translateY(-50%)");
   style(nav,"display","flex");
   style(nav,"flex-direction","column");
   style(nav,"grid-template-columns","none");
   style(nav,"margin","0");
   style(nav,"z-index","80");
 }
 function apply(){
   var m=measure();
   if(!m.width||!m.height)return;
   var axis=m.landscape?"landscape":"portrait";
   var size=m.width<540?"compact":m.width<990?"medium":"wide";
   var key=m.width+"x"+m.height+"|"+axis+"|"+size+"|"+m.keyboard;
   if(key!==lastKey){
     root.setAttribute("data-dar-duo-axis",axis);
     root.setAttribute("data-dar-duo-size",size);
     root.style.setProperty("--dar-duo-vw",m.width+"px");
     root.style.setProperty("--dar-duo-vh",m.height+"px");
     lastKey=key;
   }
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
