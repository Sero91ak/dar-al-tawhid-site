/* Dar Test · owner visual editor local preview adapter v1.
 * Applies only locally saved editor styles to /test Home on THIS browser.
 * No server writes, no Kids or visitor app changes, no prayer logic changes. */
(function(){
"use strict";
if(!/^\/test(?:\/|$)/.test(location.pathname)||/^\/test\/kids(?:\/|$)/.test(location.pathname))return;
if(window.__DAR_TEST_EDITOR_LOCAL_V1)return;window.__DAR_TEST_EDITOR_LOCAL_V1=true;
var KEY="dar_v47_visual_editor_draft_v1",ENABLE="dar_v47_visual_editor_enabled_v1";
var targets={
 leadin:".dar-v47-leadin",
 logo:".brand-main .logo",
 brand:".brand-main .brand-title-refined",
 tools:"#dv3HeaderActions",
 prayer:"#headerPrayerStatus",
 current:"#headerPrayerStatus .header-prayer-zone--now",
 countdown:"#headerPrayerStatus .header-prayer-zone--middle",
 next:"#headerPrayerStatus .header-prayer-zone--next",
 meta:"#headerPrayerStatus .header-prayer-hub__status",
 salam:".dar-v47-salam",intro:".dar-v47-intro",
 search:"#dtHero1194 .dt-hero-search-slot",
 quote:".top-shell > .isnad",
 quick:"#dv3Home .dv3-quick-grid",
 posts:"#dv3Latest"
};
var editable={leadin:true,salam:true,intro:true};
var scheduled=false,observer=null;
function enabled(){try{return localStorage.getItem(ENABLE)==="1"}catch(e){return false}}
function read(){try{var v=JSON.parse(localStorage.getItem(KEY)||"null");return v&&v.version===1&&v.items&&typeof v.items==="object"?v.items:null}catch(e){return null}}
function cleanNum(x,min,max){return typeof x==="number"&&isFinite(x)?Math.min(max,Math.max(min,x)):null}
function apply(){
 if(!document.body||!document.body.classList.contains("is-home-route")||!enabled())return;
 var items=read();if(!items)return;
 for(var name in targets){
  if(!Object.prototype.hasOwnProperty.call(targets,name))continue;
  var val=items[name];if(!val||typeof val!=="object")continue;
  var el=document.querySelector(targets[name]);if(!el)continue;
  var rules=[
   ["font-size",cleanNum(val.font,8,86),"px"],
   ["margin-top",cleanNum(val.top,-50,100),"px"],
   ["line-height",cleanNum(val.line,.8,2.2),""],
   ["letter-spacing",cleanNum(val.tracking,-3,10),"px"],
   ["max-width",cleanNum(val.width,30,100),"%"]
  ];
  for(var i=0;i<rules.length;i++){var r=rules[i];if(r[1]!==null)el.style.setProperty(r[0],r[1]+r[2],"important")}
  var x=cleanNum(val.x,-130,130),y=cleanNum(val.y,-160,160);
  if(x!==null||y!==null)el.style.setProperty("translate",(x||0)+"px "+(y||0)+"px","important");
  if(editable[name]&&typeof val.text==="string"&&val.text.length<=4000&&el.textContent!==val.text){el.textContent=val.text}
 }
 var line=items.rule;
 if(line&&typeof line==="object"){
  var css=document.getElementById("darLocalEditorLineStyle");
  if(!css){css=document.createElement("style");css.id="darLocalEditorLineStyle";document.head.appendChild(css)}
  var width=cleanNum(line.width,30,100)||100, x=cleanNum(line.x,-130,130)||0,y=cleanNum(line.y,-160,160)||0;
  css.textContent="html.dar-home-v47-layout body.is-home-route .brand-main .brand-title-refined::after{width:"+width+"%!important;translate:"+x+"px "+y+"px!important}";
 }
}
function queue(){if(scheduled)return;scheduled=true;requestAnimationFrame(function(){scheduled=false;try{apply()}catch(e){}})}
function init(){
 if(!enabled())return;
 queue();
 var app=document.querySelector(".top-shell")||document.body;
 observer=new MutationObserver(queue);
 observer.observe(app,{childList:true,subtree:true});
 document.addEventListener("dar:view-rendered",queue);
 window.addEventListener("hashchange",queue);
 window.addEventListener("pageshow",queue);
 window.addEventListener("storage",queue);
 setTimeout(queue,500);setTimeout(queue,1600);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
else init();
})();