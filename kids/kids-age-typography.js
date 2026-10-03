(() => {
"use strict";
const ROOT=document.documentElement;
const AGE_MAP=new Map([
  ["4–5","4-5"],["4-5","4-5"],["4—5","4-5"],
  ["6–8","6-8"],["6-8","6-8"],["6—8","6-8"],
  ["9–10","9-10"],["9-10","9-10"],["9—10","9-10"]
]);
function normalizedAge(v){return AGE_MAP.get(String(v||"").trim())||"6-8"}
function apply(){
  const app=document.querySelector(".app");
  const raw=app?.getAttribute("data-age")||"6–8";
  const age=normalizedAge(raw);
  if(ROOT.dataset.kidsAge!==age)ROOT.dataset.kidsAge=age;
  ROOT.style.setProperty("--kids-current-age",'"'+age+'"');
  window.dispatchEvent(new CustomEvent("darkids:typography-age",{detail:{age,raw}}));
}
function boot(){
  apply();
  const app=document.querySelector(".app");
  if(app&&"MutationObserver" in window){
    new MutationObserver(records=>{
      if(records.some(r=>r.attributeName==="data-age"))requestAnimationFrame(apply);
    }).observe(app,{attributes:true,attributeFilter:["data-age"]});
  }
  document.addEventListener("click",e=>{
    if(e.target.closest?.("[data-age],[data-set-age],.age-btn,.profile-age button"))setTimeout(apply,0);
  },true);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
window.DARKidsTypography={sync:apply,get age(){return ROOT.dataset.kidsAge||"6-8"}};
})();