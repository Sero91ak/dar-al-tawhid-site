/* KIDS creator staging only. Percentages are readiness checkpoints, NOT byte-download percentages. */
(function(){
 "use strict";
 if(window.__kidsCreatorBootV1)return;
 window.__kidsCreatorBootV1=true;
 document.documentElement.classList.add("kids-test-booting");
 var root=null,fill=null,num=null,status=null,recover=null;
 var progress=0,ready=false,dom=false,loaded=false,failed=false,settling=false;
 var hero="/kids/assets/kids-salah-v1272/hero-home.png?v=1274";
 function bind(){
  root=document.getElementById("kids-test-boot");if(!root)return false;
  fill=root.querySelector(".ktb-fill");num=root.querySelector(".ktb-percent");
  status=root.querySelector(".ktb-status");recover=root.querySelector(".ktb-recover");
  recover.addEventListener("click",function(){
   if(document.getElementById("view-today")&&document.querySelector("#view-today .hero")){
    open(true);
   } else {location.reload()}
  });
  render();return true;
 }
 function render(){if(!fill)return;fill.style.width=progress+"%";num.textContent=progress+"%";
  root.setAttribute("aria-valuenow",String(progress));
 }
 function stage(n,message){
  if(ready||failed)return;
  progress=Math.max(progress,Math.min(n,99));render();
  if(status&&message)status.textContent=message;
 }
 function waitImage(src,element){
  return new Promise(function(resolve){
   var image=element||new Image(),finished=false;
   function done(ok){if(finished)return;finished=true;image.removeEventListener("load",onload);
    image.removeEventListener("error",onerror);clearTimeout(watch);resolve(ok)}
   function onload(){done(true)}
   function onerror(){done(false)}
   var watch=setTimeout(function(){done(false)},7000);
   if(image.complete&&image.naturalWidth>0)return done(true);
   image.addEventListener("load",onload);image.addEventListener("error",onerror);
   if(!element)image.src=src;
  });
 }
 function withTimeout(promise,ms){
  return Promise.race([Promise.resolve(promise),new Promise(function(resolve){setTimeout(function(){resolve(false)},ms)})]);
 }
 function nextPaint(){
  return new Promise(function(resolve){requestAnimationFrame(function(){requestAnimationFrame(resolve)})});
 }
 function open(manual){
  if(ready)return;
  ready=true;
  if(!manual){progress=100;render();status.textContent="Fertig! Deine Lernwelt ist bereit."}
  root.classList.add("kids-test-boot-fade");
  document.documentElement.classList.remove("kids-test-booting");
  setTimeout(function(){root.remove()},380);
 }
 function fail(message){
  if(ready)return;
  failed=true;
  root.setAttribute("data-boot-error","1");
  status.textContent=message||"Die Lernwelt braucht noch einen Moment.";
  recover.textContent="Erneut versuchen";
  if(document.getElementById("view-today")&&document.querySelector("#view-today .hero")){
   recover.textContent="App trotzdem öffnen";
  }
 }
 async function boot(){
  if(settling)return;settling=true;
  if(!root&&!bind())return;
  if(!dom){stage(5,"Die Lernwelt wird vorbereitet");return}
  stage(30,"Startseite wird vorbereitet");
  if(!document.querySelector("#view-today .hero")){fail("Startseite konnte nicht geladen werden.");return}
  var icon=root.querySelector(".ktb-logo");
  var images=await Promise.all([waitImage("",icon),waitImage(hero,null)]);
  if(!images[0]){fail("Das KIDS-Logo konnte nicht geladen werden.");return}
  stage(60,"Bilder werden vorbereitet");
  if(!images[1]){fail("Das Startbild konnte nicht geladen werden.");return}
  // Fonts are cosmetic: wait briefly, but never block the app indefinitely on remote font hosts.
  if(document.fonts&&document.fonts.ready)await withTimeout(document.fonts.ready,1700);
  stage(82,"Darstellung wird geprüft");
  await nextPaint();
  var home=document.getElementById("view-today"),heroNode=home&&home.querySelector(".hero");
  if(!home||!heroNode||!home.getBoundingClientRect().width||!heroNode.getBoundingClientRect().height){
    fail("Die Startseite ist noch nicht darstellbar.");return;
  }
  if(document.readyState!=="complete"&&!loaded){
   await withTimeout(new Promise(function(resolve){window.addEventListener("load",resolve,{once:true})}),4500);
  }
  stage(95,"Fast fertig");
  await nextPaint();
  if(!document.getElementById("view-today")){fail("Die Startseite ist nicht bereit.");return}
  open(false);
 }
 function onDom(){dom=true;if(bind())boot()}
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",onDom,{once:true});
 else onDom();
 window.addEventListener("load",function(){loaded=true});
 setTimeout(function(){
  if(!ready&&!failed){if(!root)bind();if(root)fail("Der Start dauert zu lange. Bitte erneut versuchen.")}
 },15000);
})();
