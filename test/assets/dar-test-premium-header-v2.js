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
 language:"/test/assets/header-icons/globe-3d.svg",
 account:"/test/assets/header-icons/account-3d.svg",
 palette:"/test/assets/header-icons/palette-3d.svg"
};
function icon(kind){
 var i=document.createElement("img");
 i.className="dtbh-icon-3d";
 i.src=ICONS[kind]+"?v=20261023-no-broken-icon-v5";
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
  if(typeof navigate==="function"){navigate("account","login");return;}
  if(typeof window.navigate==="function"){window.navigate("account","login");return;}
 }catch(e){console.warn("DAR Test account shortcut",e);}
 location.hash="#account/login";
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
 account.addEventListener("click",function(e){e.preventDefault();openAccount();});
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
