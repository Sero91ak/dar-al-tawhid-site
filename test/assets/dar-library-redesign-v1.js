/* DAR Test · Library Redesign v1 · test/staging only */
(function(){
  "use strict";
  var ROOT_CLASS="dar-library-redesign-v1";
  var BRAND_ID="darLibBrandBarV1";
  var scheduled=false;

  function el(tag,cls){
    var n=document.createElement(tag);
    if(cls)n.className=cls;
    return n;
  }
  function makeBrandBar(){
    var bar=el("div","dar-lib-brandbar");
    bar.id=BRAND_ID;
    bar.setAttribute("aria-label","DĀR AL TAWḤĪD");
    var logo=el("img","dar-lib-brandbar__logo");
    logo.src="/watermark-my-logo-full.png";
    logo.alt="DĀR AL TAWḤĪD Logo";
    logo.decoding="async";
    var copy=el("div","dar-lib-brandbar__copy");
    var title=el("div","dar-lib-brandbar__title");
    title.textContent="DĀR AL TAWḤĪD";
    var line=el("div","dar-lib-brandbar__line");
    line.textContent="Tawḥīd · Qurʾān · Sunnah · Āthār";
    copy.appendChild(title);
    copy.appendChild(line);
    bar.appendChild(logo);
    bar.appendChild(copy);
    return bar;
  }
  function routeKind(){
    var b=document.body;
    if(!b)return "";
    if(b.classList.contains("is-home-route"))return "home";
    if(b.classList.contains("is-quiz-route"))return "quiz";
    if(b.classList.contains("is-quran-overview"))return "quran";
    if(b.classList.contains("is-more-route"))return "more";
    return "";
  }
  function ensureBrandBar(kind){
    var existing=document.getElementById(BRAND_ID);
    if(kind!=="quiz"&&kind!=="quran"&&kind!=="more"){
      if(existing)existing.remove();
      return;
    }
    var target=null;
    if(kind==="quran"){
      var main=document.querySelector(".qov-main");
      var header=main&&main.querySelector(".qov-header");
      if(main&&header)target={parent:main,before:header};
    }else{
      var view=document.getElementById("appView");
      var head=view&&view.querySelector(".view-head");
      if(view&&head)target={parent:view,before:head};
    }
    if(!target)return;
    if(existing){
      if(existing.parentNode!==target.parent||existing.nextSibling!==target.before){
        target.parent.insertBefore(existing,target.before);
      }
      return;
    }
    target.parent.insertBefore(makeBrandBar(),target.before);
  }
  function ensureHeroObject(kind){
    if(kind!=="quiz"&&kind!=="more")return;
    var view=document.getElementById("appView");
    var head=view&&view.querySelector(".view-head");
    if(!head)return;
    var old=head.querySelector(".dar-lib-hero-object");
    var src=kind==="quiz"?"/test/assets/dar-3d-icons/quiz.png":"/test/assets/dar-3d-icons/more.png";
    if(old){
      if(old.getAttribute("src")!==src)old.setAttribute("src",src);
      return;
    }
    var img=el("img","dar-lib-hero-object");
    img.src=src;
    img.alt="";
    img.setAttribute("aria-hidden","true");
    img.decoding="async";
    head.appendChild(img);
  }
  function decorateHome(){
    document.querySelectorAll(".home-v380-open-row").forEach(function(row){
      var k=row.querySelector(".home-v380-kicker");
      var t=(k&&k.textContent||"").trim().toLowerCase();
      row.classList.toggle("dar-lib-recommended",t==="heute empfohlen");
      row.classList.toggle("dar-lib-daily-dua",t.indexOf("duʿāʾ des tages")!==-1||t.indexOf("dua des tages")!==-1);
    });
  }
  function setCutout(slot,src){
    if(!slot)return;
    var existing=slot.querySelector("img.dar-lib-cutout");
    if(existing){
      if(existing.getAttribute("src")!==src)existing.setAttribute("src",src);
      return;
    }
    slot.textContent="";
    var img=el("img","dar-lib-cutout");
    img.src=src;
    img.alt="";
    img.setAttribute("aria-hidden","true");
    img.decoding="async";
    slot.appendChild(img);
  }
  function decorateQuiz(){
    document.querySelectorAll(".quiz-menu-card").forEach(function(card){
      var icon=card.firstElementChild;
      var value=card.getAttribute("data-value")||"";
      var id=card.id||"";
      var src="/test/assets/dar-3d-icons/quiz.png";
      if(value==="stats")src="/test/assets/dar-3d-icons/ilm.png";
      else if(value==="repeat")src="/test/assets/dar-3d-icons/library.png";
      else if(id==="quizResumeBtn")src="/test/assets/dar-3d-icons/play.png";
      setCutout(icon,src);
    });
  }
  function decorateQuran(){
    var header=document.querySelector(".qov-header");
    if(!header)return;
    if(!header.querySelector(".dar-lib-quran-cutout")){
      var img=el("img","dar-lib-quran-cutout");
      img.src="/test/assets/dar-3d-icons/quran.png";
      img.alt="";
      img.setAttribute("aria-hidden","true");
      img.decoding="async";
      img.style.cssText="position:absolute;right:16px;bottom:12px;width:80px;height:80px;object-fit:contain;filter:drop-shadow(0 14px 18px rgba(0,0,0,.34));pointer-events:none;z-index:0";
      header.appendChild(img);
    }
  }
  function decorate(){
    document.documentElement.classList.add(ROOT_CLASS);
    var kind=routeKind();
    ensureBrandBar(kind);
    ensureHeroObject(kind);
    if(kind==="home")decorateHome();
    if(kind==="quiz")decorateQuiz();
    if(kind==="quran")decorateQuran();
  }
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(function(){
      scheduled=false;
      try{decorate()}catch(e){console.warn("DAR library redesign:",e)}
    });
  }
  function init(){
    document.documentElement.classList.add(ROOT_CLASS);
    schedule();
    var root=document.getElementById("appView")||document.body;
    if(root&&window.MutationObserver){
      new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
    }
    window.addEventListener("hashchange",schedule,{passive:true});
    window.addEventListener("popstate",schedule,{passive:true});
    window.addEventListener("load",schedule,{once:true});
    setTimeout(schedule,250);
    setTimeout(schedule,900);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();