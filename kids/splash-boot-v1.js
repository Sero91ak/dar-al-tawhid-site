/* KIDS TEST only. Actual readiness checkpoints; no synthetic 100% or blocking all lessons. */
(function(){
 "use strict";
 if(window.__KIDS_CREATOR_SPLASH_2__)return;
 window.__KIDS_CREATOR_SPLASH_2__=true;
 document.documentElement.classList.add("kids-test-booting");
 var start=performance.now(), minDisplayMs=3500, maxWaitMs=9000;
 var display=0,target=1,root=null,fill=null,number=null,meter=null,status=null,retry=null;
 var ready=false,error=false,firstPaintReady=false,frame=null,nativeRevealed=false;
 function revealNativePoster(){
   if(nativeRevealed)return;
   nativeRevealed=true;
   try{
     if(window.webkit&&window.webkit.messageHandlers&&window.webkit.messageHandlers.darKidsCreatorSplashReady){
       window.webkit.messageHandlers.darKidsCreatorSplashReady.postMessage("poster-rendered");
     }
   }catch(e){}
 }
 var posterURL="/kids/assets/kids-splash-20261017-v1.jpg";
 var posterNatural=null;
 var homeURL="/kids/assets/kids-salah-v1272/hero-home.png?v=1274";
 function bind(){
   root=document.getElementById("kids-test-boot");
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
       if(ok&&src===posterURL)posterNatural={width:img.naturalWidth,height:img.naturalHeight};
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
 function makeShards(){
   var poster=root&&root.querySelector(".ktb-poster");
   if(!poster||!posterNatural||!posterNatural.width||!posterNatural.height)return null;
   var width=poster.clientWidth,height=poster.clientHeight;
   if(width<100||height<160)return null;
   // Only 45-54 lightweight fragments. The browser reuses one decoded JPEG.
   var portrait=height>=width,columns=portrait?6:9,rows=portrait?9:5;
   var scale=Math.max(width/posterNatural.width,height/posterNatural.height);
   var imageW=posterNatural.width*scale,imageH=posterNatural.height*scale;
   var imageX=(width-imageW)*.5,imageY=(height-imageH)*.5;
   var layer=document.createElement("div");
   layer.className="ktb-shards";
   layer.setAttribute("aria-hidden","true");
   var batch=document.createDocumentFragment();
   for(var r=0;r<rows;r++){
     for(var col=0;col<columns;col++){
       var left=width*col/columns,top=height*r/rows;
       var tileW=width/columns+.7,tileH=height/rows+.7;
       var seed=Math.sin((r+1)*17.3+(col+1)*8.9);
       var dx=Math.round(seed*Math.min(62,width*.11));
       var dy=Math.round(Math.min(172,height*.19)+r*4.7+(col%3)*11);
       var rz=(seed*14).toFixed(1);
       var shard=document.createElement("i");
       shard.className="ktb-shard";
       shard.style.left=left+"px";
       shard.style.top=top+"px";
       shard.style.width=tileW+"px";
       shard.style.height=tileH+"px";
       shard.style.backgroundImage='url("'+posterURL+'")';
       shard.style.backgroundSize=imageW+"px "+imageH+"px";
       shard.style.backgroundPosition=(imageX-left)+"px "+(imageY-top)+"px";
       shard.style.setProperty("--ktb-x",dx+"px");
       shard.style.setProperty("--ktb-y",dy+"px");
       shard.style.setProperty("--ktb-r",rz+"deg");
       shard.style.setProperty("--ktb-delay",Math.round((r%4)*23+(col%3)*26)+"ms");
       batch.appendChild(shard);
     }
   }
   layer.appendChild(batch);
   poster.appendChild(layer);
   return layer;
 }
 function finish(manual){
   if(ready||!root)return;
   ready=true;
   if(frame)cancelAnimationFrame(frame);
   if(!manual){display=100;paint()}
   revealNativePoster();
   var hold=manual?0:220;
   setTimeout(function(){
     if(!root)return;
     var reduce=!!(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches);
     var layers=null;
     try{if(!reduce)layers=makeShards()}catch(e){layers=null}
     // Make the already-constructed home visible immediately behind the cover.
     // Opaque shards physically move away; no blue intermediary, crossfade or double text.
     if(layers){
       root.classList.add("ktb-shatter");
       document.documentElement.classList.remove("kids-test-booting");
       requestAnimationFrame(function(){requestAnimationFrame(function(){
         if(layers&&root)layers.classList.add("ktb-shards-go");
       })});
       setTimeout(function(){if(root){root.remove();root=null}},1320);
     }else{
       // Accessible, cheap fallback: a directional wipe that reveals the home.
       document.documentElement.classList.remove("kids-test-booting");
       root.classList.add("ktb-wipe");
       setTimeout(function(){if(root){root.remove();root=null}},740);
     }
   },hold);
 }
 async function main(){
   await domReady();
   if(!bind()){document.documentElement.classList.remove("kids-test-booting");return}
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
     if(window.console&&console.warn)console.warn("KIDS TEST boot readiness:",e);
   }
 }
 // A static splash with no JS must never trap the page indefinitely.
 setTimeout(function(){
   if(!ready&&!error&&!root&&document.readyState!=="loading"){
     document.documentElement.classList.remove("kids-test-booting");
   }
 },9000);
 main();
})();
