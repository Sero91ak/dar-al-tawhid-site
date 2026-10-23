/* DAR_TEST_GLASS_NAVIGATION_20261023: original dock + detached search loupe.
   Isolated to /test/ adult route. Web glass only, not native Liquid Glass. */
(function(w,d){
 "use strict";
 if(!/^\/test(?:\/|$)/.test(w.location.pathname)||/^\/test\/kids(?:\/|$)/.test(w.location.pathname))return;
 if(w.DarV8GlassNavigation)return;
 var root=d.documentElement,dock=null,pill=null,lens=null,scheduled=false,observer=null;
 function active(){return dock&&(dock.querySelector(".bottom-nav-btn.active")||dock.querySelector('.bottom-nav-btn[aria-current="page"]'))}
 function keyboard(){var v=w.visualViewport,a=d.activeElement;return !!(v&&w.innerHeight-v.height>140&&a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName||""))}
 function nativeBar(){return root.classList.contains("dar-ios-native-app")}
 function search(){
  var existing=d.querySelector('#bottomNav [data-bottom-nav="search"]');
  if(existing){existing.click();return}
  if(typeof w.navigate==="function")w.navigate("search");else w.location.hash="#search";
  w.setTimeout(function(){
   var input=d.querySelector('#appView input[type="search"],#appView #searchInput,#appView .search-pro-input');
   if(input&&input.offsetParent!==null)input.focus({preventScroll:true});
  },180);
 }
 function ensure(){
  var el=d.querySelector("#bottomNav.bottom-nav");
  if(!el){root.classList.remove("dar-v8-glass-test");return false}
  if(el!==dock){
   if(observer)observer.disconnect();
   dock=el;pill=null;
   if(w.MutationObserver){observer=new MutationObserver(schedule);observer.observe(dock,{subtree:true,childList:true,attributes:true,attributeFilter:["class","aria-current"]})}
  }
  if(!pill||!pill.isConnected){
   pill=dock.querySelector("#darV8GlassSelection");
   if(!pill){pill=d.createElement("span");pill.id="darV8GlassSelection";pill.setAttribute("aria-hidden","true");dock.insertBefore(pill,dock.firstChild)}
  }
  if(!lens||!lens.isConnected){
   lens=d.getElementById("darV8GlassLens");
   if(!lens){
    lens=d.createElement("button");lens.id="darV8GlassLens";lens.type="button";
    lens.setAttribute("aria-label","Suche öffnen");lens.title="Suche";
    lens.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.7"/><path d="m15.7 15.7 5.2 5.2"/></svg>';
    d.body.append(lens);lens.addEventListener("click",search);
   }
  }
  if(!nativeBar()){root.classList.add("dar-v8-glass-test");root.dataset.v8GlassNav="20261023"}
  lens.hidden=keyboard()||nativeBar();
  return true
 }
 function sync(){
  scheduled=false;if(!ensure())return;
  var a=active();if(!a){pill.hidden=true;return}pill.hidden=false;
  var b=dock.getBoundingClientRect(),r=a.getBoundingClientRect();if(b.width<30||r.width<10)return;
  var rtl=w.getComputedStyle(dock).direction==="rtl",x=rtl?b.right-r.right:r.left-b.left;
  var props={"--v8-g-x":Math.round(Math.max(0,x))+"px","--v8-g-y":Math.round(Math.max(0,r.top-b.top))+"px","--v8-g-w":Math.round(r.width)+"px","--v8-g-h":Math.round(r.height)+"px"};
  Object.keys(props).forEach(function(key){if(dock.style.getPropertyValue(key)!==props[key])dock.style.setProperty(key,props[key])})
 }
 function schedule(){if(scheduled)return;scheduled=true;w.requestAnimationFrame(sync)}
 function boot(){
  schedule();w.addEventListener("hashchange",schedule,{passive:true});
  w.addEventListener("resize",schedule,{passive:true});w.addEventListener("pageshow",schedule,{passive:true});
  if(w.visualViewport)w.visualViewport.addEventListener("resize",schedule,{passive:true});
  d.addEventListener("dar:view-rendered",schedule);d.addEventListener("dar-adult-locale-changed",schedule);
  if(w.MutationObserver){var obs=new MutationObserver(schedule);obs.observe(d.body,{childList:true,subtree:false})}
 }
 w.DarV8GlassNavigation=Object.freeze({version:"20261023-glass-v1",refresh:schedule,status:function(){return {dock:!!dock,lens:!!(lens&&lens.isConnected)}}});
 if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})(window,document);
