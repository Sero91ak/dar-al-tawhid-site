/* DĀR TEST · Adaptive Knowledge Navigation + Daily Question · 2026-10-30
 * Strictly adult /test. Reuse existing smart profile, navigation and real content pages.
 * No Visitor, KIDS, push, prayer, Qibla or native shell changes.
 */
(function(){
"use strict";
if(!(/^(\/|\/index\.html|\/pwa(?:\/|\/index\.html)?)$/.test(location.pathname)))return;
if(window.DAR_VISITOR_DAILY_HUB_V1)return;
var KEY="darVisitorDailyKnowledgeV1:", lastProfile="", scheduled=false, seenHome=false;
var QUESTIONS=[
 {q:"Welche Sūrah enthält Āyat al-Kursī?",a:["Sūrat al-Fātiḥah","Sūrat al-Baqarah","Sūrat al-Ikhlāṣ"],ok:1,ref:"Qurʾān 2:255",why:"Āyat al-Kursī ist der Vers 255 aus Sūrat al-Baqarah."},
 {q:"Wie beginnt Sūrat al-Ikhlāṣ?",a:["Qul huwa llāhu aḥad","Al-ḥamdu li-llāh","Wa-l-ʿaṣr"],ok:0,ref:"Qurʾān 112:1",why:"Der erste Vers lautet: Qul huwa llāhu aḥad – Sprich: Er ist Allāh, ein Einziger."},
 {q:"Welche Sūrah beginnt mit „Al-ḥamdu li-llāhi rabbi l-ʿālamīn“?",a:["Sūrat an-Nās","Sūrat al-Fātiḥah","Sūrat al-Falaq"],ok:1,ref:"Qurʾān 1:2",why:"Diese Lobpreisung steht in Sūrat al-Fātiḥah, Vers 2."},
 {q:"Welche beiden Propheten errichteten die Grundmauern des Hauses?",a:["Ibrāhīm und Ismāʿīl","Mūsā und Hārūn","Dāwūd und Sulaymān"],ok:0,ref:"Qurʾān 2:127",why:"Ibrāhīm und Ismāʿīl erhoben die Grundmauern des Hauses, wie Sūrat al-Baqarah 2:127 berichtet."},
 {q:"In welcher Sūrah steht „Mit der Erschwernis geht Erleichterung einher“?",a:["Sūrat al-Fīl","Sūrat ash-Sharḥ","Sūrat al-Masad"],ok:1,ref:"Qurʾān 94:5–6",why:"In Sūrat ash-Sharḥ wird diese Aussage in den Versen 5 und 6 wiederholt."},
 {q:"In welcher Sūrah steht „Lies im Namen deines Herrn, Der erschaffen hat“?",a:["Sūrat al-ʿAlaq","Sūrat al-Kawthar","Sūrat al-Māʿūn"],ok:0,ref:"Qurʾān 96:1",why:"Sūrat al-ʿAlaq beginnt mit dem Aufruf „Lies“."},
 {q:"Welche Sūrah handelt in ihrem ersten Vers von der Zeit?",a:["Sūrat al-Qadr","Sūrat al-ʿAṣr","Sūrat an-Naṣr"],ok:1,ref:"Qurʾān 103:1",why:"Sūrat al-ʿAṣr beginnt mit dem Schwur bei der Zeit."},
 {q:"In welcher Sūrah wird um Schutz vor dem Übel des Neiders gebeten?",a:["Sūrat al-Falaq","Sūrat al-Kāfirūn","Sūrat al-Fātiḥah"],ok:0,ref:"Qurʾān 113:5",why:"Sūrat al-Falaq erwähnt ausdrücklich das Übel eines Neiders, wenn er neidet."},
 {q:"Welche Sūrah beginnt mit der Frage „Hast du nicht gesehen, wie dein Herr mit den Leuten des Elefanten verfuhr?“",a:["Sūrat Quraysh","Sūrat al-Fīl","Sūrat at-Tīn"],ok:1,ref:"Qurʾān 105:1",why:"Dies ist der Beginn von Sūrat al-Fīl."},
 {q:"In welcher Sūrah spricht Allāh über die Nacht der Bestimmung?",a:["Sūrat al-Qadr","Sūrat al-Kawthar","Sūrat al-Masad"],ok:0,ref:"Qurʾān 97:1–5",why:"Sūrat al-Qadr behandelt Laylat al-Qadr."},
 {q:"Wo steht „Euch eure Religion und mir meine Religion“?",a:["Sūrat al-Kāfirūn","Sūrat an-Nās","Sūrat al-Ikhlāṣ"],ok:0,ref:"Qurʾān 109:6",why:"Sūrat al-Kāfirūn endet mit dieser Aussage."},
 {q:"In welcher Sūrah bittet man den Herrn der Menschen um Schutz?",a:["Sūrat al-Fātiḥah","Sūrat an-Nās","Sūrat al-Māʿūn"],ok:1,ref:"Qurʾān 114:1",why:"Sūrat an-Nās beginnt mit der Zufluchtnahme beim Herrn der Menschen."}
];
function esc(x){return String(x==null?"":x).replace(/[&<>"']/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]})}
function profile(){try{return window.DAR_VISITOR_SMART_PROFILE_V1&&window.DAR_VISITOR_SMART_PROFILE_V1.get()}catch(_){return null}}
function owner(){try{if(typeof accountSession==="function"){var p=accountSession();if(p&&String(p.id||p.username||"").trim())return "account-"+String(p.id||p.username).replace(/[^a-zA-Z0-9_-]/g,"").slice(0,96)}}catch(_){}return "guest"}
function day(){return new Date().toLocaleDateString("sv-SE",{timeZone:"Europe/Berlin"})}
function idx(date){var n=Math.floor((Date.parse(date+"T12:00:00Z")-Date.parse("2026-01-01T12:00:00Z"))/86400000);return ((n%QUESTIONS.length)+QUESTIONS.length)%QUESTIONS.length}
function daily(){return QUESTIONS[idx(day())]}
function state(){try{var v=JSON.parse(localStorage.getItem(KEY+owner())||"{}");return v&&typeof v==="object"?v:{}}catch(_){return {}}}
function save(v){try{localStorage.setItem(KEY+owner(),JSON.stringify(v))}catch(e){console.warn("DĀR TEST Tagesfrage lokal nicht speicherbar",e)}}
function entry(){var s=state();return s[day()]||{}}
function patch(p){var s=state(),d=day();s[d]=Object.assign({},s[d]||{},p);Object.keys(s).forEach(function(k){if(/^\d{4}-\d\d-\d\d$/.test(k)&&k<new Date(Date.now()-45*86400000).toISOString().slice(0,10))delete s[k]});save(s)}
function navigateTo(name){try{if(typeof window.navigate==="function"){window.navigate(name,"");return true}}catch(_){}
 try{if(typeof navigate==="function"){navigate(name,"");return true}}catch(_){}
 location.hash="#"+name;return false}
function navSlot(){
 var bar=document.getElementById("bottomNav");if(!bar)return null;
 var buttons=Array.from(bar.querySelectorAll(".bottom-nav-btn[data-bottom-nav]"));
 var slot=bar.querySelector('[data-bottom-nav="quiz"]')||bar.querySelector("[data-dar-adaptive-tab]");
 if(slot)return slot;
 return buttons.find(function(b){return /^quiz$/i.test(String(b.textContent||"").trim())})||null
}
function syncNav(p){
 var slot=navSlot();if(!slot)return;
 if(!slot.dataset.darOriginalTab)slot.dataset.darOriginalTab=slot.getAttribute("data-bottom-nav")||"quiz";
 var female=p.gender==="woman";
 var target=female?"frauen":"topics",text=female?"Frauen":"Entdecken";
 // Male/neutral share Entdecken; Quiz remains reachable from Home and Mehr.
 if(slot.getAttribute("data-bottom-nav")!==target)slot.setAttribute("data-bottom-nav",target);
 slot.dataset.darAdaptiveTab=target;
 slot.setAttribute("aria-label",female?"Frauenbereich öffnen":"Wissensbereiche entdecken");
 slot.setAttribute("title",text);
 var label=slot.querySelector(".nav-label")||Array.from(slot.children).find(function(e){return e.classList&&e.classList.contains("nav-text")})||Array.from(slot.children).find(function(e){return e.tagName==="SPAN"&&!e.classList.contains("nav-icon")});
 if(label&&label.textContent!==text)label.textContent=text;
 var icon=slot.querySelector(".nav-icon");
 if(icon){
  var src="/assets/dar-3d-icons/"+(female?"frauen.png":"topics.png");
  var img=icon.querySelector("img");
  if(img){if(img.getAttribute("src")!==src)img.setAttribute("src",src)}
  else{icon.textContent="";img=document.createElement("img");img.src=src;img.alt="";img.className="dar3d-icon";img.setAttribute("aria-hidden","true");img.decoding="async";icon.appendChild(img)}
 }
}
function homeRoot(){return document.body&&document.body.classList.contains("is-home-route")?document.getElementById("darHomeHtmlParityV1"):null}
function cardMarkup(){
 var e=entry(),q=daily(),answered=Number.isInteger(e.answer),status=answered?"Heute beantwortet":e.skipped?"Heute übersprungen":"Deine tägliche Wissensfrage";
 return '<div class="ddh-card-inner"><div class="ddh-card-symbol" aria-hidden="true"><img src="/assets/dar-3d-icons/quiz.png" alt=""></div><div class="ddh-card-content"><span class="ddh-kicker">EIN MOMENT WISSEN · '+esc(day())+'</span><h2>Die Frage des Tages</h2><p>'+esc(q.q)+'</p><span class="ddh-caption">'+esc(status)+'</span></div><span class="ddh-card-arrow" aria-hidden="true">›</span></div>'
}
function syncCard(){
 var root=homeRoot();if(!root)return;
 var card=root.querySelector("#darDailyKnowledgeCardV1");
 if(!card){
  var welcome=root.querySelector(".dhp-welcome");if(!welcome)return;
  card=document.createElement("button");card.type="button";card.id="darDailyKnowledgeCardV1";card.className="ddh-card";card.dataset.ddhOpen="true";card.setAttribute("aria-haspopup","dialog");card.setAttribute("aria-label","Frage des Tages beantworten");
  var mount=root.querySelector(".dsp-mount");(mount||welcome).insertAdjacentElement("afterend",card);
 }
 var sig=owner()+"|"+day()+"|"+JSON.stringify(entry());
 if(card.dataset.ddhSig!==sig){card.innerHTML=cardMarkup();card.dataset.ddhSig=sig}
 if(!seenHome){seenHome=true;setTimeout(maybePrompt,1350)}
}
/* Mehr has a dedicated Quiz tile. The daily question stays on Home, not
   ahead of the Mehr page title. Remove any stale injection from prior renders. */
function moreButton(){
 var more=document.querySelector("#appView .dar-more-v15, #appView .dm15-shell");
 if(!more)return;
 more.querySelectorAll(".ddh-more-quiz").forEach(function(card){card.remove()});
}
function dialog(){var x=document.getElementById("darDailyKnowledgeDialogV1");if(x)return x;x=document.createElement("div");x.id="darDailyKnowledgeDialogV1";x.className="ddh-dialog-backdrop";x.hidden=true;x.setAttribute("aria-hidden","true");document.body.appendChild(x);return x}
var lastFocus=null;
function modalMarkup(){
 var q=daily(),e=entry(),answered=Number.isInteger(e.answer);
 return '<div class="ddh-dialog" role="dialog" aria-modal="true" aria-labelledby="ddhTitle" tabindex="-1"><div class="ddh-dialog-top"><div><span class="ddh-kicker">DĀR AL TAWḤĪD · DEIN TÄGLICHES WISSEN</span><h2 id="ddhTitle">Die Frage des Tages</h2></div><button type="button" class="ddh-close" data-ddh-close aria-label="Frage schließen">×</button></div><div class="ddh-question"><span>FRAGE · '+esc(day())+'</span><h3>'+esc(q.q)+'</h3></div><div class="ddh-answers" role="group" aria-label="Antwortmöglichkeiten">'+q.a.map(function(a,i){var selected=answered&&e.answer===i,right=answered&&i===q.ok;return '<button type="button" data-ddh-answer="'+i+'" '+(answered?"disabled":"")+' class="'+(right?"is-correct":selected?"is-wrong":"")+'" aria-pressed="'+(selected?"true":"false")+'"><span class="ddh-answer-letter">'+String.fromCharCode(65+i)+'</span><span>'+esc(a)+'</span><span aria-hidden="true">'+(right?"✓":selected?"×":"")+'</span></button>'}).join("")+'</div>'+
 (answered?'<div class="ddh-result" role="status"><strong>'+(e.answer===q.ok?"Richtig beantwortet.":"Die richtige Antwort ist: "+esc(q.a[q.ok]))+'</strong><p>'+esc(q.why)+'</p><small>Quelle: '+esc(q.ref)+'</small></div>':'<p class="ddh-note">Wähle eine Antwort. Du erhältst anschließend die Erklärung mit Quellenangabe.</p>')+
 '<footer class="ddh-dialog-footer"><button type="button" class="ddh-secondary" data-ddh-close>'+(answered?"Schließen":"Heute überspringen")+'</button><button type="button" class="ddh-primary" data-ddh-navigate="'+(answered?"quiz":"quran")+'">'+(answered?"Weitere Fragen":"Zum Qurʾān")+'</button></footer><label class="ddh-pref"><input type="checkbox" data-ddh-pref '+(state().automaticOff?"checked":"")+'><span>Tägliches Fenster nicht automatisch anzeigen</span></label></div>'
}
function open(){var x=dialog();lastFocus=document.activeElement;x.innerHTML=modalMarkup();x.hidden=false;x.setAttribute("aria-hidden","false");x.querySelector(".ddh-dialog").focus({preventScroll:true})}
function close(skip){var x=dialog();if(skip&&!Number.isInteger(entry().answer))patch({skipped:true,seen:true});x.hidden=true;x.innerHTML="";x.setAttribute("aria-hidden","true");if(lastFocus&&lastFocus.isConnected&&lastFocus.focus)lastFocus.focus({preventScroll:true});syncCard()}
function maybePrompt(){
 if(!homeRoot()||document.hidden||!profile()||window.DAR_VISITOR_ONBOARDING_ACTIVE)return;
 var e=entry(),s=state();
 if(s.automaticOff||e.seen||e.skipped||Number.isInteger(e.answer))return;
 if(document.querySelector("#dtbhProfilePopover:not([hidden]),#dspNotesOverlay:not([hidden]),[role=dialog][aria-modal=true]"))return;
 patch({seen:true});open()
}
function sync(){
 if(scheduled)return;scheduled=true;
 requestAnimationFrame(function(){scheduled=false;try{
  var p=profile();if(!p)return;
  syncNav(p);syncCard();moreButton();
  lastProfile=p.gender;
 }catch(e){console.warn("DAR VISITOR Daily Hub",e)}})
}
document.addEventListener("click",function(event){
 var slot=event.target.closest&&event.target.closest("#bottomNav [data-dar-adaptive-tab]");
 if(slot){
  var p=profile(),dest=p&&p.gender==="woman"?"frauen":"topics";
  event.preventDefault();event.stopImmediatePropagation();navigateTo(dest);setTimeout(sync,60);return;
 }
 var openButton=event.target.closest&&event.target.closest("[data-ddh-open]");
 if(openButton){event.preventDefault();event.stopPropagation();open();return}
 var answer=event.target.closest&&event.target.closest("[data-ddh-answer]");
 if(answer){event.preventDefault();var i=Number(answer.dataset.ddhAnswer);if(Number.isInteger(i)&&i>=0&&i<daily().a.length&&!Number.isInteger(entry().answer)){patch({answer:i,seen:true,skipped:false});dialog().innerHTML=modalMarkup();syncCard()}return}
 var closeButton=event.target.closest&&event.target.closest("[data-ddh-close]");
 if(closeButton){event.preventDefault();close(true);return}
 var navButton=event.target.closest&&event.target.closest("[data-ddh-navigate]");
 if(navButton){event.preventDefault();close(false);navigateTo(navButton.dataset.ddhNavigate);return}
 if(event.target.id==="darDailyKnowledgeDialogV1"){close(true);return}
 if(event.target.closest&&event.target.closest("[data-dtbh-profile],[data-dsp-gender],[data-dsp-reset]"))setTimeout(sync,0)
},true);
document.addEventListener("change",function(event){if(event.target.matches("[data-ddh-pref]")){var s=state();s.automaticOff=event.target.checked;save(s)}});
document.addEventListener("keydown",function(e){
 var x=document.getElementById("darDailyKnowledgeDialogV1");
 if(!x||x.hidden)return;
 if(e.key==="Escape"){e.preventDefault();close(true)}
 if(e.key==="Tab"){
  var buttons=Array.from(x.querySelectorAll("button:not([disabled]),input:not([disabled])"));
  if(!buttons.length)return;
  var i=buttons.indexOf(document.activeElement);
  if(e.shiftKey&&i<=0){e.preventDefault();buttons[buttons.length-1].focus()}
  if(!e.shiftKey&&i===buttons.length-1){e.preventDefault();buttons[0].focus()}
 }
});
function init(){
 sync();
 document.addEventListener("dar:view-rendered",sync);
 document.addEventListener("dar:visitor-profile-changed",sync);
 window.addEventListener("hashchange",sync);
 window.addEventListener("pageshow",sync);
 document.addEventListener("visibilitychange",function(){if(!document.hidden){seenHome=false;sync()}});
 var bar=document.getElementById("bottomNav");if(bar)new MutationObserver(sync).observe(bar,{childList:true,subtree:false});
 var view=document.getElementById("appView");if(view)new MutationObserver(sync).observe(view,{childList:true,subtree:false});
 new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:["class"]});
 setTimeout(sync,500);setTimeout(sync,1800);setTimeout(sync,3000);
}
window.DAR_VISITOR_DAILY_HUB_V1={question:daily,state:entry,refresh:sync,open:open,profileTab:function(){return profile()&&profile().gender==="woman"?"frauen":"topics"},bankSize:QUESTIONS.length};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();