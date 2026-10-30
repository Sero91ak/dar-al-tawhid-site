/* DĀR AL TAWḤĪD VISITOR · Profile + My DĀR Quick Dashboard V2
 * Shared adult iOS WebView, Android PWA and visitor app; no parallel account.
 */
(function(){
"use strict";
if(!(/^(\/|\/index\.html|\/pwa(?:\/|\/index\.html)?)$/.test(location.pathname)))return;
if(window.DAR_VISITOR_PROFILE_PICKER_V1)return;
function api(){return window.DAR_VISITOR_SMART_PROFILE_V1}
function account(){try{return api()?.account?.()||null}catch(_){return null}}
function locked(){return !!api()?.isLocked?.()}
function gender(){return api()?.get?.()?.gender||"neutral"}
function name(g){return g==="woman"?"Frau":g==="man"?"Mann":"Neutral"}
/* Profile cards may preview a locked account change; PIN is requested ONLY by Mein DĀR. */
var previewGender="";
function selectedGender(){return previewGender||gender()}
function image(g){return api()?.image?.(g)||"/assets/dar-3d-icons/library.png"}
function esc(x){return String(x==null?"":x).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function nav(route){try{if(typeof window.navigate==="function"){window.navigate(route);return}}catch(_){}
 try{if(typeof navigate==="function"){navigate(route);return}}catch(_){}location.hash="#"+route}
function options(){
 var current=selectedGender();
 return '<div class="dvp-chooser-options" role="group" aria-label="Wissensprofil">'+
 [["woman","Frau","Frauenwissen"],["man","Mann","Wissen entdecken"],["neutral","Neutral","Alle Bereiche"]].map(function(x){
 var chosen=x[0]===current;
 return '<button type="button" data-dvp-gender="'+x[0]+'" aria-pressed="'+chosen+'" class="'+(chosen?"is-active":"")+'" title="Wissensprofil auswählen">'+
 '<img src="'+image(x[0])+'" alt="" decoding="async"><span class="dvp-option-copy"><strong>'+x[1]+'</strong><small>'+x[2]+'</small></span>'+
 '<span class="dvp-check" aria-hidden="true">'+(chosen?"✓":"")+'</span></button>'
 }).join("")+'</div>'
}
function quick(){
 var g=selectedGender(),person=name(g),s=account(),loggedIn=!!s;
 return '<section class="dvp-quick" aria-label="Mein DĀR persönlich öffnen">'+
 '<span class="dvp-quick-eyebrow">DEIN WISSENSBEREICH</span>'+
 '<button type="button" class="dvp-hub-entry" data-dvp-quick="hub" aria-label="Mein DĀR öffnen: Notizen, Merkliste, Konto und Synchronisierung, Interessen">'+
 '<span class="dvp-hub-avatar"><img src="'+image(g)+'" alt="" decoding="async"></span>'+
 '<span class="dvp-hub-title">Mein DĀR</span>'+
 '<span class="dvp-hub-person">'+esc(person)+(loggedIn?' · Konto':' · Gast')+'</span>'+
 '<span class="dvp-hub-description">Notizen · Merkliste<br>Konto & Sync · Interessen</span>'+
 '<span class="dvp-hub-open">Bereich öffnen <span aria-hidden="true">›</span></span>'+
 '</button></section>'
}
function markup(){
 var g=gender(),isLocked=locked(),s=account();
 return '<div class="dvp-chooser-head"><span>MEIN DĀR · PERSÖNLICH</span><h2>Mein Wissensprofil</h2><p>Wähle links dein Wissensprofil. Rechts öffnest du Mein DĀR und bei Bedarf die Anmeldung.</p></div>'+
 '<div class="dvp-composite">'+
 '<section class="dvp-select" aria-label="Profilauswahl"><span class="dvp-column-label">WISSENSPROFIL</span>'+options()+'</section>'+
 '<div class="dvp-column-rule" aria-hidden="true"></div>'+quick()+'</div>'+
 '<div class="dvp-foot"><span>'+(previewGender&&isLocked?'Profil ausgewählt · Zum Bestätigen rechts „Mein DĀR“ öffnen.':isLocked?'Konto: '+esc(String(s?.username||""))+' · Profilwahl links, Anmeldung rechts.':s?'Dein gewähltes Konto-Profil wird geschützt.':'Gastmodus · Profil jederzeit wählbar.')+'</span></div>'
}
function reauthMarkup(g){
 var s=account();
 return '<div class="dvp-reauth"><span class="dvp-column-label">BESTÄTIGUNG DURCH ANMELDUNG</span>'+
 '<h3>Profil ändern</h3><p>Du möchtest von <strong>'+name(gender())+'</strong> zu <strong>'+name(g)+'</strong> wechseln. Melde dich dafür erneut mit deiner bestehenden Konto-PIN an.</p>'+
 '<div class="dvp-reauth-account">'+esc(String(s?.username||""))+'</div>'+
 '<label for="dvpProfilePin">Konto-PIN</label>'+
 '<input id="dvpProfilePin" type="password" inputmode="numeric" autocomplete="current-password" minlength="4" maxlength="8" placeholder="4–8 Ziffern">'+
 '<p class="dvp-reauth-error" id="dvpReauthError" role="alert" hidden></p>'+
 '<div class="dvp-reauth-actions"><button type="button" data-dvp-cancel>Zurück</button><button type="button" data-dvp-confirm="'+g+'">Erneut anmelden & ändern</button></div>'+
 '</div>'
}
function setup(){
 var h=document.getElementById("darAdultBrandHeaderV2"),row=h&&h.querySelector(".dtbh-row");
 if(!row||!api())return false;
 if(h.querySelector("#darVisitorProfileButtonV1"))return true;
 var panel=document.createElement("section");panel.id="darVisitorProfilePanelV1";panel.className="dvp-chooser";panel.hidden=true;
 panel.setAttribute("role","dialog");panel.setAttribute("aria-label","Persönliches Wissensprofil und Schnellzugriffe");
 var trigger=document.createElement("button");trigger.type="button";trigger.id="darVisitorProfileButtonV1";trigger.className="dvp-trigger";
 trigger.setAttribute("aria-haspopup","dialog");trigger.setAttribute("aria-controls","darVisitorProfilePanelV1");trigger.setAttribute("aria-expanded","false");
 var avatar=document.createElement("img");avatar.alt="";avatar.decoding="async";avatar.width=36;avatar.height=40;trigger.appendChild(avatar);
 var theme=row.querySelector(".dtbh-toggle");
 if(theme){
  var palette=document.createElement("img");palette.className="dvp-palette-icon";palette.src="/assets/header-icons/appearance-classic-v7.png";
  palette.alt="";palette.width=36;palette.height=36;palette.decoding="async";palette.draggable=false;
  theme.replaceChildren(palette);theme.setAttribute("aria-label","Erscheinungsbild auswählen");theme.title="Erscheinungsbild auswählen";
  row.insertBefore(trigger,theme);
 }else row.appendChild(trigger);
 h.appendChild(panel);
 var pending="",submitting=false;
 function sync(){
  var g=gender();
  if(avatar.getAttribute("src")!==image(g))avatar.src=image(g);
  trigger.setAttribute("aria-label","Wissensprofil: "+name(g)+". Mein DĀR öffnen");
  trigger.title="Profil: "+name(g)+" · Mein DĀR";
  if(!panel.hidden&&!pending)panel.innerHTML=markup();
 }
 function close(focus){pending="";previewGender="";panel.hidden=true;panel.innerHTML="";trigger.setAttribute("aria-expanded","false");if(focus)trigger.focus({preventScroll:true})}
 function open(){pending="";previewGender="";panel.innerHTML=markup();panel.hidden=false;trigger.setAttribute("aria-expanded","true");panel.querySelector(".dvp-chooser-options .is-active")?.focus({preventScroll:true})}
 function switchStart(g){
  if(!["woman","man","neutral"].includes(g))return;
  if(g===gender()){pending="";previewGender="";panel.innerHTML=markup();return}
  if(!locked()){pending="";previewGender="";api()?.setGender?.(g);sync();return}
  // Selecting a profile is NEVER an authentication action. Confirm at the right-hand hub.
  pending=g;previewGender=g;panel.innerHTML=markup();
  panel.querySelector('[data-dvp-gender="'+g+'"]')?.focus({preventScroll:true});
 }
 async function verify(g){
  if(submitting||!pending||g!==pending)return;
  var field=panel.querySelector("#dvpProfilePin"),error=panel.querySelector("#dvpReauthError"),pin=field?.value||"";
  if(!field)return;
  submitting=true;
  var button=panel.querySelector("[data-dvp-confirm]");if(button){button.disabled=true;button.textContent="Anmeldung wird geprüft …"}
  try{
   await api().changeGenderWithLogin(g,pin);
   field.value="";pending="";close(true);sync();nav("account");
  }catch(e){
   field.value="";if(error){error.hidden=false;error.textContent=String(e?.message||"Anmeldung fehlgeschlagen.")}
   if(button){button.disabled=false;button.textContent="Erneut anmelden & ändern"}
  }finally{submitting=false}
 }
 trigger.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();panel.hidden?open():close(false)});
 panel.addEventListener("click",function(e){
  var b=e.target.closest("[data-dvp-gender],[data-dvp-quick],[data-dvp-onboarding],[data-dvp-cancel],[data-dvp-confirm]");
  if(!b)return;e.preventDefault();e.stopPropagation();
  if(b.hasAttribute("data-dvp-gender")){switchStart(b.dataset.dvpGender);return}
  if(b.hasAttribute("data-dvp-cancel")){pending="";panel.innerHTML=markup();return}
  if(b.hasAttribute("data-dvp-confirm")){verify(b.dataset.dvpConfirm);return}
  if(b.hasAttribute("data-dvp-onboarding")){close(false);window.DAR_VISITOR_ONBOARDING_V1?.open?.();return}
  var type=b.dataset.dvpQuick;if(!type)return;
  if((type==="hub"||type==="account")&&pending&&locked()){
   panel.innerHTML=reauthMarkup(pending);
   panel.querySelector("#dvpProfilePin")?.focus({preventScroll:true});return;
  }
  close(false);
  if(type==="notes"){api()?.openNotes?.();return}
  if(type==="saved"){api()?.openSaved?.();return}
  if(type==="interests"){nav("account");setTimeout(function(){document.querySelector('[data-dsp-toggle="interests"]')?.click()},500);return}
  if(type==="hub"||type==="account")nav("account");
 });
 panel.addEventListener("keydown",function(e){if(e.key==="Enter"&&e.target.id==="dvpProfilePin"){e.preventDefault();verify(pending)}});
 document.addEventListener("click",function(e){if(!panel.hidden&&!panel.contains(e.target)&&!trigger.contains(e.target))close(false)});
 document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!panel.hidden){e.preventDefault();close(true)}});
 document.addEventListener("dar:view-rendered",sync);document.addEventListener("dar:visitor-profile-changed",sync);
 window.addEventListener("pageshow",sync);
 window.DAR_VISITOR_PROFILE_PICKER_V1={open,close,refresh:sync,switchStart};
 sync();return true
}
function boot(){if(setup())return;var n=0;var timer=setInterval(function(){n++;if(setup()||n>35)clearInterval(timer)},190)}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();