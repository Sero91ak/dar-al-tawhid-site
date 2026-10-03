(() => {
"use strict";
const normalize=v=>{
  const s=String(v||"").trim().replace("-","–");
  if(s==="4–5")return "4-5";
  if(s==="9–10")return "9-10";
  return "6-8";
};
function sync(){
  const app=document.querySelector(".app");
  const value=normalize(app?.getAttribute("data-age")||"6–8");
  document.documentElement.dataset.kidsAge=value;
  document.body?.setAttribute("data-kids-age",value);
}
function boot(){
  sync();
  const app=document.querySelector(".app");
  if(app&&"MutationObserver" in window){
    new MutationObserver(sync).observe(app,{attributes:true,attributeFilter:["data-age"]});
  }
  addEventListener("pageshow",sync,{passive:true});
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)sync()},{passive:true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
window.DARKidsAgeTypography={sync};
})();