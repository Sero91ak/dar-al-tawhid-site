/* KIDS VISITOR iOS only. Actual readiness checkpoints; no synthetic 100% or blocking all lessons. */
(function(){
 "use strict";
 if(window.__DAR_KIDS_VISITOR_SPLASH_ACTIVE__!==true||window.__KIDS_VISITOR_SPLASH_1__)return;
 window.__KIDS_VISITOR_SPLASH_1__=true;
 document.documentElement.classList.add("kids-visitor-booting");
 var start=performance.now(), minDisplayMs=1500, maxWaitMs=9000;
 var display=0,target=1,root=null,fill=null,number=null,meter=null,status=null,retry=null;
 var ready=false,error=false,firstPaintReady=false,frame=null,nativeRevealed=false;
 function revealNativePoster(){
   if(nativeRevealed)return;
   nativeRevealed=true;
   try{
     /* Visitor v1 has no separate native loading overlay; web splash is authoritative. */
   }catch(e){}
 }
 var posterURL="/kids/assets/kids-splash-20261017-v1.jpg";
 var homeURL="/kids/assets/kids-salah-v1272/hero-home.png?v=1274";
 function bind(){
   root=document.getElementById("kids-visitor-boot");
   if(!root)return false;
   fill=root.querySelector(".ktb-fill");number=root.querySelector(".ktb-percent");
   meter=root.querySelector(".ktb-track");status=root.querySelector(".ktb-status");
   retry=root.querySelector(".ktb-recover");
   retry.addEventListener("click",function(){
     if(document.getElementById("view-today")&&document.querySelector("#view-today .hero"))finish(true);
     else location.reload();
   });
   return true;
 }
 function pct(v){return Math.max(0,Math.min(100,Math.round(v)))}
 function paint(){
   if(fill)fill.style.width=display.toFixed(2)+"%";
   if(number)number.textContent=pct(display)+"%";
   if(meter)meter.setAttribute("aria-valuenow",String(pct(display)));
 }
 function setTarget(v){if(!ready&&!error)target=Math.max(target,Math.min(99,v))}
 function animate(){
   if(ready)return;
   var remaining=target-display;
   if(remaining>.04){
     display=Math.min(target,display+Math.max(.06,remaining*.11));
   }else display=target;
   paint();
   if(target===100&&display>=99.5){display=100;paint();finish(false);return}
   frame=requestAnimationFrame(animate);
 }
 function imageReady(src){
   return new Promise(function(resolve){
     var img=new Image(),done=false;
     function finish(ok){if(done)return;done=true;clearTimeout(timer);img.onload=img.onerror=null;
       resolve(ok)}
     var timer=setTimeout(function(){finish(false)},7200);
     img.onload=function(){finish(img.naturalWidth>0)};
     img.onerror=function(){finish(false)};
     img.src=src;
     if(img.complete&&img.naturalWidth>0)finish(true);
   });
 }
 function domReady(){return new Promise(function(resolve){
   if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",resolve,{once:true});
   else resolve();
 })}
 function loadReady(){return new Promise(function(resolve){
   if(document.readyState==="complete")resolve(true);
   else window.addEventListener("load",function(){resolve(true)},{once:true});
 })}
 function nextPaint(){return new Promise(function(resolve){requestAnimationFrame(function(){requestAnimationFrame(resolve)})})}
 function sleep(n){return new Promise(function(resolve){setTimeout(resolve,n)})}
 function fail(message){
   if(ready||error||!root)return;
   error=true;target=Math.min(target,99);revealNativePoster();
   if(frame)cancelAnimationFrame(frame);
   root.setAttribute("data-boot-error","1");
   status.textContent=message||"Das Laden dauert länger als erwartet.";
   retry.textContent=document.querySelector("#view-today .hero")?"App trotzdem öffnen":"Neu laden";
 }
 function finish(manual){
   if(ready||!root)return;
   ready=true;
   if(frame)cancelAnimationFrame(frame);
   if(!manual){display=100;paint()}
   revealNativePoster();
   // Keep a truthful, complete meter visible, then reveal the already-painted
   // homepage behind a single feathered mask. No image tiles, canvas or video.
   setTimeout(function(){
     if(!root)return;
     var reduce=!!(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches);
     var feathered=!reduce && !!(window.CSS&&window.CSS.supports&&
       (window.CSS.supports("-webkit-mask-image","linear-gradient(black,transparent)")||
        window.CSS.supports("mask-image","linear-gradient(black,transparent)")));
     document.documentElement.classList.remove("kids-visitor-booting");
     root.classList.add(feathered?"ktb-storybook":"ktb-soft-fallback");
     requestAnimationFrame(function(){requestAnimationFrame(function(){
       if(root)root.classList.add("ktb-transition-go");
     })});
     setTimeout(function(){if(root){root.remove();root=null}},feathered?1360:reduce?290:1000);
   },manual?0:190);
 }
 async function main(){
   await domReady();
   if(!bind()){document.documentElement.classList.remove("kids-visitor-booting");return}
   animate();setTarget(12);
   var expired=setTimeout(function(){fail("Der Start braucht länger. Du kannst es erneut versuchen.")},maxWaitMs);
   try{
     var home=document.getElementById("view-today");
     if(!home||!home.querySelector(".hero"))throw Error("Startseite nicht aufgebaut");
     setTarget(23);
     var art=await imageReady(posterURL);
     if(!art)throw Error("Startbild nicht geladen");
     await nextPaint();
     revealNativePoster();
     setTarget(39);
     var hero=await imageReady(homeURL);
     if(!hero)throw Error("Startseitenbild nicht geladen");
     setTarget(58);
     await loadReady();
     setTarget(82);
     // CSS and first-viewport images that are not lazy-loaded complete before window.load.
     // Loading every audio/story/image library before the start would be unbounded.
     if(document.fonts&&document.fonts.ready){
       await Promise.race([document.fonts.ready.catch(function(){}),sleep(750)]);
     }
     setTarget(91);
     await nextPaint();
     home=document.getElementById("view-today");
     var heroNode=home&&home.querySelector(".hero");
     if(!home||!heroNode||!home.getBoundingClientRect().width||!heroNode.getBoundingClientRect().height)
       throw Error("Startansicht nicht darstellbar");
     firstPaintReady=true;
     setTarget(92);
     var remain=minDisplayMs-(performance.now()-start);
     if(remain>0)await sleep(remain);
     if(error)return;
     clearTimeout(expired);
     target=100;
   }catch(e){
     clearTimeout(expired);
     fail("Die Startseite ist noch nicht bereit. Bitte erneut versuchen.");
     if(window.console&&console.warn)console.warn("KIDS VISITOR boot readiness:",e);
   }
 }
 // A static splash with no JS must never trap the page indefinitely.
 setTimeout(function(){
   if(!ready&&!error&&!root&&document.readyState!=="loading"){
     document.documentElement.classList.remove("kids-visitor-booting");
   }
 },9000);
 main();
})();
