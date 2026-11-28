/* KIDS_PARENT_GATE_V1: adult-only challenge before the parents area, support e-mail, any link that leaves the app,
   and the privacy page. Children who cannot yet do multi-digit arithmetic cannot pass it.
   No data is stored beyond a short session marker; no network request is made. */
(function(){
"use strict";
if(window.DARKidsParentGate)return;
var GRACE_MS=10*60*1000, LOCK_MS=60*1000, MAX_TRIES=3;
var UNTIL_KEY="kids.parentGate.until.v1", LOCK_KEY="kids.parentGate.lock.v1";
var own={"dar-al-tawhid.de":1,"www.dar-al-tawhid.de":1,"dar-al-tawhid-kids-creator.sero91ak.workers.dev":1,"dar-al-tawhid-test.sero91ak.workers.dev":1};
var memUntil=0, tries=0, bypass=false, overlay=null, task=null, typed="", pendingPass=null, lastFocus=null;
function now(){return Date.now()}
function readNum(store,key){try{return Number(store.getItem(key))||0}catch(e){return 0}}
function writeNum(store,key,v){try{store.setItem(key,String(v))}catch(e){}}
function graceOpen(){return Math.max(memUntil,readNum(sessionStorage,UNTIL_KEY))>now()}
function allowed(kind){return kind==="parents"||kind==="privacy"?graceOpen():false}
function rand(a,b){return a+Math.floor(Math.random()*(b-a+1))}
function makeTask(){
  var a=rand(13,19),b=rand(4,9),c=rand(11,39);
  return{text:a+" × "+b+" + "+c,answer:a*b+c};
}
function css(){
  if(document.getElementById("kidsParentGateStyle"))return;
  var st=document.createElement("style");st.id="kidsParentGateStyle";
  st.textContent=[
  "#kidsParentGate{position:fixed;inset:0;z-index:2147483000;display:none;align-items:center;justify-content:center;padding:max(12px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));background:rgba(4,17,28,.82);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);font-family:Fredoka,system-ui,-apple-system,sans-serif}",
  "#kidsParentGate.open{display:flex}",
  "#kidsParentGate .kpg-card{box-sizing:border-box;width:min(100%,420px);max-height:100%;overflow:auto;-webkit-overflow-scrolling:touch;background:#0c2636;color:#f7efdc;border:1.5px solid rgba(229,196,125,.7);border-radius:26px;padding:clamp(16px,3.2dvh,26px) clamp(16px,4vw,26px);box-shadow:0 20px 60px rgba(0,0,0,.5);text-align:center}",
  "#kidsParentGate h2{margin:0 0 6px;font-size:clamp(20px,3.4dvh,26px);color:#e5c47d;font-weight:600}",
  "#kidsParentGate p{margin:0 0 10px;font-size:clamp(14px,2.2dvh,16px);line-height:1.4}",
  "#kidsParentGate .kpg-task{font-size:clamp(26px,5dvh,38px);font-weight:700;letter-spacing:.02em;margin:6px 0 4px}",
  "#kidsParentGate .kpg-answer{min-height:56px;display:flex;align-items:center;justify-content:center;margin:6px auto 10px;width:min(100%,220px);border-radius:16px;background:rgba(255,255,255,.08);border:1px solid rgba(229,196,125,.45);font-size:30px;font-weight:700;color:#fff}",
  "#kidsParentGate .kpg-pad{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:0 auto 10px;width:min(100%,300px)}",
  "#kidsParentGate button{font:inherit;min-height:48px;min-width:48px;border-radius:15px;border:1px solid rgba(229,196,125,.5);background:rgba(255,255,255,.1);color:#f7efdc;font-size:22px;font-weight:600;cursor:pointer;touch-action:manipulation}",
  "#kidsParentGate button:focus-visible{outline:3px solid #e5c47d;outline-offset:2px}",
  "#kidsParentGate button.kpg-ok{background:#e5c47d;color:#112536}",
  "#kidsParentGate button.kpg-cancel{display:block;width:100%;font-size:17px;background:transparent;margin-top:2px}",
  "#kidsParentGate .kpg-msg{min-height:20px;font-size:14px;color:#ffd7a8}",
  "@media(max-height:480px){#kidsParentGate .kpg-pad{grid-template-columns:repeat(6,1fr);width:min(100%,420px)}#kidsParentGate button{min-height:44px}}"
  ].join("\n");
  document.head.appendChild(st);
}
function build(){
  if(overlay)return;
  css();
  overlay=document.createElement("div");overlay.id="kidsParentGate";
  overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-labelledby","kpgTitle");
  overlay.innerHTML='<div class="kpg-card"><h2 id="kpgTitle">Nur für Erwachsene</h2><p id="kpgText">Bitte löse die Aufgabe, um weiterzugehen.</p><div class="kpg-task" id="kpgTask" aria-live="polite"></div><div class="kpg-answer" id="kpgAnswer" role="status" aria-label="Deine Antwort"></div><div class="kpg-msg" id="kpgMsg" role="alert"></div><div class="kpg-pad" id="kpgPad"></div><button type="button" class="kpg-cancel" id="kpgCancel">Abbrechen</button></div>';
  var pad=overlay.querySelector("#kpgPad");
  ["1","2","3","4","5","6","7","8","9","⌫","0","OK"].forEach(function(k){
    var b=document.createElement("button");b.type="button";b.textContent=k;b.dataset.k=k;
    if(k==="OK"){b.className="kpg-ok";b.setAttribute("aria-label","Antwort prüfen")}
    if(k==="⌫")b.setAttribute("aria-label","Letzte Ziffer löschen");
    pad.appendChild(b);
  });
  overlay.addEventListener("click",function(e){
    var t=e.target;
    if(t.id==="kpgCancel"){e.stopPropagation();close(false);return}
    var b=t.closest&&t.closest("button[data-k]");if(!b)return;
    e.stopPropagation();press(b.dataset.k);
  },true);
  overlay.addEventListener("keydown",function(e){
    if(e.key==="Escape"){close(false);return}
    if(/^[0-9]$/.test(e.key))press(e.key);
    else if(e.key==="Backspace")press("⌫");
    else if(e.key==="Enter"&&document.activeElement&&document.activeElement.tagName!=="BUTTON")press("OK");
  });
  document.body.appendChild(overlay);
}
function show(){
  task=makeTask();typed="";
  overlay.querySelector("#kpgTask").textContent="Wie viel ist "+task.text+"?";
  setAnswer();setMsg("");
  overlay.classList.add("open");
  lastFocus=document.activeElement;
  var first=overlay.querySelector('button[data-k="1"]');if(first)try{first.focus({preventScroll:true})}catch(e){}
}
function setAnswer(){overlay.querySelector("#kpgAnswer").textContent=typed||"…"}
function setMsg(t){overlay.querySelector("#kpgMsg").textContent=t||""}
function locked(){var until=readNum(localStorage,LOCK_KEY);return until>now()?until:0}
function press(k){
  var until=locked();
  if(until){setMsg("Bitte kurz warten und es dann nochmal versuchen.");return}
  if(k==="⌫"){typed=typed.slice(0,-1);setAnswer();return}
  if(k==="OK"){
    if(!typed){setMsg("Bitte eine Zahl eingeben.");return}
    if(Number(typed)===task.answer){
      var cb=pendingPass;memUntil=now()+GRACE_MS;writeNum(sessionStorage,UNTIL_KEY,memUntil);tries=0;
      close(true);if(cb)cb();return;
    }
    tries++;
    if(tries>=MAX_TRIES){tries=0;writeNum(localStorage,LOCK_KEY,now()+LOCK_MS);task=makeTask();typed="";
      overlay.querySelector("#kpgTask").textContent="Zu viele Versuche";setAnswer();setMsg("Bitte eine Minute warten.");return}
    task=makeTask();typed="";overlay.querySelector("#kpgTask").textContent="Wie viel ist "+task.text+"?";setAnswer();setMsg("Das war nicht richtig. Neue Aufgabe:");return;
  }
  if(typed.length<4){typed+=k;setAnswer()}
}
function close(passed){
  if(overlay)overlay.classList.remove("open");
  if(!passed)pendingPass=null;
  try{if(lastFocus&&lastFocus.focus)lastFocus.focus({preventScroll:true})}catch(e){}
}
function require(kind,onPass){
  if(allowed(kind)){if(onPass)onPass();return}
  var start=function(){build();pendingPass=onPass||null;show()};
  if(document.body)start();else document.addEventListener("DOMContentLoaded",start,{once:true});
}
function isExternal(a){
  var raw=a.getAttribute("href")||"";
  if(!raw||raw.charAt(0)==="#"||/^javascript:/i.test(raw))return false;
  if(/^(mailto|tel|sms|itms-apps|itms|facetime):/i.test(raw))return true;
  var u;try{u=new URL(a.href,location.href)}catch(e){return false}
  if(u.protocol!=="http:"&&u.protocol!=="https:")return true;
  return !own[u.hostname]&&u.hostname!==location.hostname;
}
document.addEventListener("click",function(e){
  if(bypass)return;
  var t=e.target;if(!t||!t.closest)return;
  var nav=t.closest('.nav-btn[data-target="parents"]');
  if(nav&&!allowed("parents")){
    e.preventDefault();e.stopImmediatePropagation();
    require("parents",function(){bypass=true;try{nav.click()}finally{bypass=false}});
    return;
  }
  var a=t.closest("a[href]");if(!a)return;
  var kind=a.getAttribute("data-parent-gate");
  var priv=kind==="privacy"||/\/kids\/datenschutz\.html/.test(a.getAttribute("href")||"");
  if(priv){
    if(allowed("privacy"))return;
    e.preventDefault();e.stopImmediatePropagation();
    require("privacy",function(){location.href=a.href});return;
  }
  if(kind==="support"||isExternal(a)){
    e.preventDefault();e.stopImmediatePropagation();
    var target=a.href,blank=a.target==="_blank";
    require("external",function(){if(blank&&/^https?:/i.test(target))window.open(target,"_blank","noopener");else location.href=target});
  }
},true);
var nativeOpen=window.open;
window.open=function(url){
  var args=arguments;
  var abs="";try{abs=new URL(String(url||""),location.href)}catch(e){}
  if(abs&&(abs.protocol!=="http:"&&abs.protocol!=="https:"||(!own[abs.hostname]&&abs.hostname!==location.hostname))){
    require("external",function(){nativeOpen.apply(window,args)});return null;
  }
  return nativeOpen.apply(window,args);
};
window.DARKidsParentGate=Object.freeze({require:require,allowed:allowed,version:"v1-20261128"});
})();
