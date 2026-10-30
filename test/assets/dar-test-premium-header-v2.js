/* DAR TEST · PREMIUM RESPONSIVE HEADER V2 · 2026-10-23
 * Only the existing /test/ adult shell. Keep the native palette click handler,
 * nine-language availability guard and original account navigation.
 */
(function(){
"use strict";
if(!/^\/test(?:\/|$)/.test(location.pathname)||/^\/test\/kids(?:\/|$)/.test(location.pathname))return;
var HEADER_ID="darTestBrandHeaderV1";
var LOGO="/app-logo-original.png";
var ICONS={
 language:"/test/assets/header-icons/language-classic-v7.png",
 account:"/test/assets/smart-profile/avatar-neutral.svg",
 palette:"/test/assets/header-icons/appearance-classic-v7.png"
};
function icon(kind){
 var i=document.createElement("img");
 i.className="dtbh-icon-3d";
 i.src=kind==="account"?ICONS.account:ICONS[kind]+"?v=20261023-real-3d-png-v7";
 i.alt="";i.setAttribute("aria-hidden","true");
 i.width=36;i.height=36;i.decoding="async";i.draggable=false;
 return i;
}
function button(label,kind){
 var b=document.createElement("button");
 b.type="button";b.className="dtbh-action dtbh-action-"+kind;
 b.setAttribute("aria-label",label);b.setAttribute("title",label);
 b.appendChild(icon(kind));
 return b;
}
function picker(trigger,remaining){
 var p=window.DARAdultLanguagePickerV1;
 if(p&&typeof p.open==="function"){p.open("quick",trigger);return;}
 if(remaining===undefined)remaining=12;
 if(!document.querySelector('script[src*="adult-language-picker-v1.js"]')){
  var s=document.createElement("script");
  s.src="/assets/i18n/adult-language-picker-v1.js?v=20261022-01";
  s.async=true;document.head.appendChild(s);
 }
 if(remaining>0)setTimeout(function(){picker(trigger,remaining-1)},160);
 else{
  var old=document.querySelector('[data-dal-open="quick"],[data-dar-language-entry="quick"] button');
  if(old)old.click();
 }
}
function openAccount(){
 try{
  if(typeof navigate==="function"){navigate("account","");return;}
  if(typeof window.navigate==="function"){window.navigate("account","login");return;}
 }catch(e){console.warn("DAR Test account shortcut",e);}
 location.hash="#account";
}
function chooserMarkup(){
 var smart=window.DAR_TEST_SMART_PROFILE_V1;
 var current=smart&&typeof smart.get==="function"?smart.get().gender:"neutral";
 var items=[["neutral","Neutral","Alle Inhalte"],["woman","Frau","Frauenwissen"],["man","Mann","Wissensweg"]];
 return '<div class="dtbh-profile-head"><strong>Mein Profil</strong><small>Deinen Wissensbereich wählen</small></div><div class="dtbh-profile-options">'+items.map(function(item){return '<button type="button" class="dtbh-profile-choice'+(current===item[0]?" is-active":"")+'" data-dtbh-profile="'+item[0]+'" aria-pressed="'+String(current===item[0])+'"><img src="'+(smart&&typeof smart.image==="function"?smart.image(item[0]):item[0]==="woman"?"/test/assets/smart-profile/approved-woman-v1.webp":item[0]==="man"?"/test/assets/smart-profile/approved-man-v1.webp":"/test/assets/smart-profile/avatar-neutral.svg")+'" alt="" aria-hidden="true" width="43" height="49" loading="eager" decoding="async"><span><strong>'+item[1]+'</strong><small>'+item[2]+'</small></span></button>'}).join("")+'</div><button type="button" class="dtbh-profile-account" data-dtbh-open-account>Mein Profil & Konto öffnen</button>';
}
function setupChooser(h,account){
 var pop=document.createElement("div");
 pop.className="dtbh-profile-popover";
 pop.id="dtbhProfilePopover";
 pop.hidden=true;
 h.appendChild(pop);
 function close(){pop.hidden=true;account.setAttribute("aria-expanded","false")}
 function open(){pop.innerHTML=chooserMarkup();pop.hidden=false;account.setAttribute("aria-expanded","true")}
 window.DAR_TEST_PROFILE_CHOOSER={open:open,close:close};
 account.setAttribute("aria-haspopup","dialog");account.setAttribute("aria-controls","dtbhProfilePopover");account.setAttribute("aria-expanded","false");
 account.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();if(pop.hidden)open();else close()});
 pop.addEventListener("click",function(e){
  var choice=e.target.closest("[data-dtbh-profile]");
  if(choice){var api=window.DAR_TEST_SMART_PROFILE_V1;if(api&&typeof api.setGender==="function"){api.setGender(choice.dataset.dtbhProfile);close()}return}
  if(e.target.closest("[data-dtbh-open-account]")){close();openAccount()}
 });
 document.addEventListener("click",function(e){if(!pop.hidden&&!pop.contains(e.target)&&!account.contains(e.target))close()});
 document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!pop.hidden){close();account.focus()}});
}
function setup(){
 var h=document.getElementById(HEADER_ID);
 if(!h)return false;
 if(h.dataset.premiumHeaderV2==="ready")return true;
 var row=h.querySelector(".dtbh-row"),theme=row&&row.querySelector(".dtbh-toggle"),copy=row&&row.querySelector(".dtbh-copy");
 var logo=row&&row.querySelector(".dtbh-logo");
 if(!row||!theme||!copy||!logo)return false;
 var tagline=copy.querySelector(".dtbh-tagline");
 if(tagline){tagline.textContent="Beiträge aus Qurʾān, Sunnah und Āthār";tagline.setAttribute("data-dar-no-translate","true");}
 // Existing original brand artwork, never generated or upscaled.
 function keepOriginalLogo(){
  if(logo.getAttribute("src")!==LOGO)logo.setAttribute("src",LOGO);
 }
 logo.width=56;logo.height=56;
 logo.setAttribute("decoding","async");logo.setAttribute("loading","eager");
 logo.setAttribute("fetchpriority","high");
 keepOriginalLogo();
 new MutationObserver(keepOriginalLogo).observe(logo,{attributes:true,attributeFilter:["src"]});
 var actions=document.createElement("div");actions.className="dtbh-actions";
 actions.setAttribute("role","group");actions.setAttribute("aria-label","Schnellzugriffe");
 var language=button("Sprache auswählen","language");
 language.addEventListener("click",function(e){e.preventDefault();picker(language);});
 var account=button("Konto und Anmeldung","account");
 setupChooser(h,account);
 theme.setAttribute("title","Erscheinungsbild auswählen");
 theme.setAttribute("aria-label","Erscheinungsbild auswählen");
 // Preserve the original toggle element and its bound palette click listener.
 theme.replaceChildren(icon("palette"));
 actions.appendChild(language);actions.appendChild(account);actions.appendChild(theme);
 row.appendChild(actions);
 h.dataset.premiumHeaderV2="ready";
 document.documentElement.classList.add("dar-test-premium-header-v2");
 return true;
}
if(!setup()){
 var attempts=0;
 var timer=setInterval(function(){attempts++;if(setup()||attempts>=80)clearInterval(timer)},120);
 document.addEventListener("dar:brand-header-mounted",setup,{once:true});
}
})();
