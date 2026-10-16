/* DĀR AL TAWḤĪD · adult Dar Test only · Prayer motifs V6
 * Existing button and 3D icon DOM is untouched; the only inserted element
 * is a pointer-events:none decorative image behind each relevant card.
 */
(function(){
  "use strict";
  if(!/^\/test(?:\/|$)/.test(location.pathname))return;
  if(window.__DAR_PRAYER_MOTIFS_V6__)return;
  window.__DAR_PRAYER_MOTIFS_V6__=true;
  var BASE="/test/assets/prayer-motifs/";
  var VERSION="?v=20261016-motifs-v6";
  var REFERENCE={
    fajr:"fajr",sunrise:"fajr",dhuhr:"dhuhr",
    asr:"asr",maghrib:"maghrib",isha:"isha"
  };
  var observer=null, scheduled=false, observing=null;
  function classify(card){
    if(card.hasAttribute("data-notification-prayer")){
      var key=card.getAttribute("data-notification-prayer");
      return REFERENCE[key]||null;
    }
    var heading=card.querySelector("b");
    if(!heading)return null;
    var label=String(heading.textContent||"").toLowerCase().trim();
    if(label.indexOf("sonnenaufgang")>=0)return "fajr";
    if(label.indexOf("fajr")>=0)return "fajr";
    if(label.indexOf("dhuhr")>=0)return "dhuhr";
    if(label.indexOf("maghrib")>=0)return "maghrib";
    if(label.indexOf("asr")>=0||label.indexOf("aṣr")>=0||label.indexOf("ʿaṣr")>=0||label.indexOf("ʿa")>=0)return "asr";
    if(label.indexOf("isha")>=0||label.indexOf("ishā")>=0||label.indexOf("ʿish")>=0)return "isha";
    return null;
  }
  function decorate(card){
    var key=classify(card);
    if(!key)return;
    var image=card.querySelector(":scope > img[data-dar-prayer-motif]");
    if(!image){
      image=document.createElement("img");
      image.className="dar-prayer-motif-image";
      image.setAttribute("data-dar-prayer-motif",key);
      image.setAttribute("alt","");
      image.setAttribute("aria-hidden","true");
      image.setAttribute("draggable","false");
      image.setAttribute("decoding","async");
      image.setAttribute("loading","lazy");
      image.addEventListener("error",function(){
        card.classList.add("dar-photo-fallback");
      },{once:true});
      card.insertBefore(image,card.firstChild);
    }
    if(image.getAttribute("data-dar-prayer-motif")!==key || !image.getAttribute("src")){
      image.setAttribute("data-dar-prayer-motif",key);
      image.src=BASE+key+".webp"+VERSION;
    }
    card.classList.add("dar-photo-card");
  }
  function enhance(){
    scheduled=false;
    document.querySelectorAll("body.is-settings-route .notification-prayer-grid > .notification-prayer").forEach(decorate);
    document.querySelectorAll("#appView .prayer-page-noble .prayer-time-grid--top > .prayer-time-card").forEach(decorate);
  }
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(enhance);
  }
  function start(){
    var style=document.querySelector('link[data-dar-prayer-motifs-v6]');
    if(!style){
      style=document.createElement("link");
      style.rel="stylesheet";
      style.href=BASE+"live-photo-v6.css"+VERSION;
      style.setAttribute("data-dar-prayer-motifs-v6","");
      document.head.appendChild(style);
    }
    var host=document.getElementById("appView");
    if(host&&host!==observing){
      if(observer)observer.disconnect();
      observing=host;
      observer=new MutationObserver(schedule);
      observer.observe(host,{childList:true,subtree:true});
    }
    schedule();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});
  else start();
  window.addEventListener("hashchange",start,{passive:true});
  window.addEventListener("dar:view-rendered",start,{passive:true});
  window.addEventListener("pageshow",start,{passive:true});
})();