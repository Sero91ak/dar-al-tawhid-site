/* Original-area hero map for V8 preview. Visual only; does not touch original route state. */
(function(){
"use strict";
const root="https://dar-al-tawhid.de/";
const files={
home:"test/assets/area-heroes-v1290/quran-overview.webp",
quran:"test/assets/area-heroes-v1290/quran-overview.webp",
posts:"test/assets/area-heroes-v1290/topics.webp",
hadith:"test/assets/area-heroes-v1290/post-reader.webp",
library:"test/assets/area-heroes-v1290/library.webp",
women:"assets/frauen/library-v1224/03-erste-generationen.jpg",
knowledge:"test/assets/area-heroes-v1290/ilm-chat.webp",
prayer:"test/assets/area-heroes-v1290/prayer.webp",
dua:"test/assets/area-heroes-v1290/dua.webp",
quiz:"test/assets/area-heroes-v1290/quiz.webp",
more:"test/assets/area-heroes-v1290/more-hub.webp",
settings:"test/assets/area-heroes-v1290/more-hub.webp",
downloads:"test/assets/area-heroes-v1290/more-hub.webp",
bookmarks:"test/assets/area-heroes-v1290/library.webp",
search:"test/assets/area-heroes-v1290/ilm-chat.webp",
tech:"test/assets/area-heroes-v1290/more-hub.webp",
paths:"test/assets/area-heroes-v1290/quran-learn.webp"};
function route(){
 const h=decodeURIComponent(String(location.hash||"").replace(/^#\/?/,""));
 return (h.split("/")[0]||"home").toLowerCase();
}
let last="";
function apply(){
 const key=route();if(key===last)return;last=key;
 if(document.body)document.body.setAttribute("data-v8-original-route",key);
 const file=files[key]||files.home;
 document.documentElement.style.setProperty("--v8-original-route-image",'url("'+root+file+'")');
}
function boot(){apply();const view=document.getElementById("view");if(view){const obs=new MutationObserver(apply);obs.observe(view,{childList:true,subtree:false});}
window.addEventListener("hashchange",apply);window.addEventListener("popstate",apply);}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
