/* DAR Test · Library Redesign v1168
   Adds only reversible presentation helpers. Existing routes/functions remain authoritative.
*/
(function(){
  "use strict";
  var BRAND_ID="darLibraryBrandbarV1168";
  var RECOMMEND_ID="darLibraryRecommendV1168";

  function brandbar(){
    return '<section class="dar-library-brandbar" data-dar-library-brandbar="1">'+
      '<img class="dar-library-brandbar__logo" src="/watermark-my-logo-full.png" alt="DĀR AL TAWḤĪD Logo" decoding="sync">'+
      '<div class="dar-library-brandbar__copy">'+
        '<div class="dar-library-brandbar__title">DĀR AL TAWḤĪD</div>'+
        '<div class="dar-library-brandbar__meta">Tawḥīd · Qurʾān · Sunnah · Āthār</div><div class="dar-library-brandbar__sub">Wissen aus Qurʾān &amp; Sunnah</div>'+
      '</div>'+
    '</section>';
  }

  function ensureAreaBrandbar(){
    var body=document.body;
    if(!body)return;
    var host=null;
    if(body.classList.contains("is-quran-overview")){
      host=document.querySelector(".qov-main");
    }else if(body.classList.contains("is-quiz-route")||body.classList.contains("is-more-route")){
      host=document.getElementById("appView");
    }
    if(!host)return;
    if(host.querySelector('[data-dar-library-brandbar="1"]'))return;
    host.insertAdjacentHTML("afterbegin",brandbar());
  }

  function ensureHomeRecommendation(){
    if(!document.body||!document.body.classList.contains("is-home-route"))return;
    var shell=document.querySelector(".home-v380-shell");
    if(!shell||shell.querySelector('[data-dar-library-recommend="1"]'))return;
    try{
      if(typeof window.renderHomeRecommendedRow!=="function")return;
      var html=window.renderHomeRecommendedRow(new Set());
      if(!html)return;
      var temp=document.createElement("div");
      temp.innerHTML=html;
      var row=temp.firstElementChild;
      if(!row)return;
      row.setAttribute("data-dar-library-recommend","1");
      row.classList.add("dar-library-recommend");
      var anchor=shell.querySelector(".home-line-tawhid")||shell.children[1]||null;
      if(anchor)anchor.insertAdjacentElement("beforebegin",row);
      else shell.appendChild(row);
    }catch(e){}
  }

  function mark(){
    ensureAreaBrandbar();
    ensureHomeRecommendation();
  }

  function schedule(){
    requestAnimationFrame(function(){
      mark();
      setTimeout(mark,90);
      setTimeout(mark,360);
    });
  }

  document.addEventListener("DOMContentLoaded",schedule,{once:true});
  window.addEventListener("hashchange",schedule);
  window.addEventListener("load",schedule,{once:true});

  var target=document.getElementById("appView");
  if(target&&"MutationObserver" in window){
    new MutationObserver(function(){schedule()}).observe(target,{childList:true,subtree:false});
  }else{
    document.addEventListener("DOMContentLoaded",function(){
      var t=document.getElementById("appView");
      if(t&&"MutationObserver" in window)new MutationObserver(function(){schedule()}).observe(t,{childList:true,subtree:false});
    },{once:true});
  }

  window.DAR_LIBRARY_REDESIGN_V1168={
    refresh:mark,
    version:"1168",
    rollbackBranch:"backup/dar-test-pre-library-redesign-20261002"
  };
})();