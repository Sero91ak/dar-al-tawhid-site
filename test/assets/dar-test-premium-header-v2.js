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
 language:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-3.5 3.6-3.5 14.4 0 18M12 3c3.5 3.6 3.5 14.4 0 18"/>',
 account:'<circle cx="12" cy="8" r="3.5"/><path d="M5 21c.5-4.1 3-6.3 7-6.3s6.5 2.2 7 6.3"/>'
};
function button(label,kind){
 var b=document.createElement("button");
 b.type="button";b.className="dtbh-action dtbh-action-"+kind;
 b.setAttribute("aria-label",label);b.setAttribute("title",label);
 b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">'+ICONS[kind]+'</svg>';
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
 logo.width=64;logo.height=64;
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
