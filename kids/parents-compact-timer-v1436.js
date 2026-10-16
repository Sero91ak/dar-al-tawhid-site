/* KIDS_MINI_TIMER_PARENT_CONTROLS_V1438
 * Existing five-tab bar, original boy/girl themes, ages, lesson progress and
 * child account system are preserved. Time advances only while foregrounded.
 */
(function(){
"use strict";
if(window.DARKidsDailyTimer1436)return;
if(new URLSearchParams(location.search).get("kidsPortal")==="1")return;
window.DARKidsDailyTimer1436=true;
var KEY="kids.dailyTimer.v1436.";
var parent=document.querySelector("#view-parents");
var slider=document.getElementById("minuteSlider");
var minuteValue=document.getElementById("minuteValue");
var panel=slider&&slider.closest(".parent-card");
var shell=document.querySelector(".app > .shell");
var dock=document.querySelector(".app > .bottom-nav")||document.querySelector(".bottom-nav");
var profileId="",state=null,previousMetrics="",completionHandle=null;
var start=null,stop=null,reset=null,note=null;
var pill=document.createElement("span");
pill.id="kidsLearningTimer1436";
pill.className="kids-nav-timer-inline";
pill.setAttribute("role","status");
pill.hidden=true;
pill.setAttribute("aria-label","Lernzeit anzeigen – Elternbereich öffnen");
pill.innerHTML='<span class="kids-timer-symbol" aria-hidden="true">◷</span><strong class="kids-timer-digits" id="kidsTimerDigits1436">12:00</strong>';
/* Read-only numeric status inside the existing Lernen button: no new roof,
   no overlay on content, no draggable object and no nested button. */
var learnTab=dock&&dock.querySelector(".kids-academy-tab");
if(learnTab)learnTab.append(pill);
else if(dock)dock.append(pill);
else document.body.append(pill);
var digits=document.getElementById("kidsTimerDigits1436");

function today(){
 var d=new Date();
 return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
}
function activeProfile(){
 try{return localStorage.getItem("kids.activeProfile")||"guest:"+
 (document.querySelector(".app")?.dataset.gender||document.body.dataset.profile||
 localStorage.getItem("kids.guest.gender.v1")||"boy")}
 catch(_){return "guest"}
}
function limits(){
 return {min:Number(slider?.min)||5,max:Number(slider?.max)||20};
}
function clamp(n){
 var b=limits();return Math.min(b.max,Math.max(b.min,Math.round(Number(n)||12)));
}
function currentSelection(){
 var n=null;
 try{n=localStorage.getItem("kids.minutes")}catch(_){}
 return clamp(slider?.value||n||12);
}
function fresh(){
 var n=currentSelection();
 return {day:today(),duration:n,remaining:n*60,running:false,lastTick:0,
 visible:false,complete:false,dismissed:false,stopped:false};
}
function save(){
 try{if(state)localStorage.setItem(KEY+profileId,JSON.stringify(state))}catch(_){}
}
function pauseActive(){
 if(!state||!state.running)return;
 tickElapsed();
 state.running=false;state.lastTick=0;
 save();
 render();
}
function load(){
 profileId=activeProfile();
 var old=null;
 try{old=JSON.parse(localStorage.getItem(KEY+profileId)||"null")}catch(_){}
 if(!old||old.day!==today()||!Number.isFinite(old.remaining)||!Number.isFinite(old.duration)){state=fresh();return}
 var n=clamp(old.duration);
 state={day:today(),duration:n,remaining:Math.min(n*60,Math.max(0,Math.ceil(old.remaining))),
 running:false,lastTick:0,visible:!!old.visible,complete:!!old.complete,
 dismissed:!!old.dismissed,stopped:!!old.stopped};
 // A page reload/crash/restart must NEVER charge time spent outside the app.
 // Explicitly discard persisted "running" and old "until" wall-clock values.
 if(old.running)save();
}
function fmt(s){
 s=Math.max(0,Math.ceil(s));
 return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");
}
function complete(){
 state.running=false;state.remaining=0;state.lastTick=0;
 state.complete=true;state.visible=true;state.dismissed=false;
 save();
 if(completionHandle)clearTimeout(completionHandle);
 completionHandle=setTimeout(function(){
  completionHandle=null;
  if(!state||!state.complete||document.hidden)return;
  state.visible=false;state.dismissed=true;save();render();
 },4200);
}
function tickElapsed(){
 if(!state||!state.running||document.hidden)return;
 var now=Date.now(),seconds=Math.floor((now-state.lastTick)/1000);
 if(seconds<1)return;
 state.lastTick+=seconds*1000;
 state.remaining=Math.max(0,state.remaining-seconds);
 if(state.remaining===0)complete();
 else save();
}
function reflectMinutes(){
 if(!slider||!state)return;
 if(slider.value!==String(state.duration))slider.value=String(state.duration);
 if(minuteValue)minuteValue.textContent=state.duration+" Min.";
 var b=limits(),pct=(state.duration-b.min)/Math.max(1,b.max-b.min)*100;
 slider.style.setProperty("--kids-time-fill",pct+"%");
 slider.setAttribute("aria-valuetext",state.duration+" Minuten");
}
function render(){
 if(!state)return;
 if(!document.hidden)tickElapsed();
 var show=state.visible&&!state.dismissed;
 pill.hidden=!show;
 if(dock)dock.classList.toggle("kids-timer-inline-active",show);
 var lessonTab=dock&&dock.querySelector(".kids-academy-tab");
 if(lessonTab)lessonTab.classList.toggle("kids-timer-inline-tab",show);
 pill.classList.toggle("is-complete",!!state.complete);
 pill.classList.toggle("is-paused",!state.running&&!state.complete);
 document.body.classList.toggle("kids-timer-visible1437",show);
 digits.textContent=fmt(state.remaining);
 pill.setAttribute("aria-label",(state.complete?"Lernzeit beendet":state.running?"Lernzeit läuft":"Lernzeit pausiert")+" – Elternbereich öffnen");
 if(start){
  start.textContent=state.complete?"✓ Tagesziel erreicht":state.running?"Ⅱ Pausieren":show?"▶ Fortsetzen":"▶ Starten";
  start.disabled=state.complete;
 }
 if(stop)stop.disabled=!(show&&!state.complete);
 if(reset)reset.disabled=!state.visible&&!state.stopped&&!state.complete&&state.remaining===state.duration*60;
 if(note)note.textContent=state.complete?"Mā schāʾ Allāh! Deine Lernzeit ist beendet. Möge Allah dir nützliches Wissen schenken.":
  state.stopped?"Der Timer wurde gestoppt. Du kannst eine neue Lernzeit starten.":
  state.running?"Lernzeit läuft · "+fmt(state.remaining):
  show?"Pausiert · "+fmt(state.remaining):
  "Minuten wählen und mit Start beginnen.";
 reflectMinutes();
 syncDock();
}
function changeDuration(raw){
 var n=clamp(raw);
 if(!state)return;
 tickElapsed();
 if(state.complete){
  state=fresh();state.duration=n;state.remaining=n*60;
 }else{
  var used=state.visible?Math.max(0,state.duration*60-state.remaining):0;
  state.duration=n;state.remaining=Math.max(0,n*60-used);
  if(state.remaining===0&&state.visible)complete();
 }
 if(state.running)state.lastTick=Date.now();
 state.stopped=false;save();render();
}
function playPause(){
 if(!state||state.complete)return;
 if(state.running){
  pauseActive();return;
 }
 if(state.remaining===0)state.remaining=state.duration*60;
 state.running=true;state.visible=true;state.dismissed=false;state.stopped=false;
 state.lastTick=Date.now();
 save();render();
}
function stopTimer(){
 if(!state)return;
 if(completionHandle){clearTimeout(completionHandle);completionHandle=null}
 // Stop ENDS the session; unlike Pause no remaining countdown survives.
 var n=state.duration;
 state=fresh();state.duration=n;state.remaining=n*60;state.stopped=true;
 save();render();
}
function resetTimer(){
 if(!state)return;
 if(completionHandle){clearTimeout(completionHandle);completionHandle=null}
 var n=state.duration;
 state=fresh();state.duration=n;state.remaining=n*60;
 save();render();
}
function refreshProfile(){
 var id=activeProfile();
 if(id!==profileId||!state||state.day!==today()){
  pauseActive();
  load();
  if(slider)slider.value=String(state.duration);
 }
 if(document.hidden){pauseActive();return}
 render();
}
/* KIDS_INLINE_LEARN_STATUS_V1440.
 * The clock is displayed INSIDE the existing Lernen tab, never floating
 * above learning cards; icon artwork and other tabs remain unchanged.
 */
function syncDock(){
 if(!dock||!dock.isConnected){
  dock=document.querySelector(".app > .bottom-nav")||document.querySelector(".bottom-nav");
 }
 if(!dock||!state)return;
 var learn=dock.querySelector(".kids-academy-tab");
 if(learn&&pill.parentNode!==learn)learn.append(pill);
 var rect=dock.getBoundingClientRect();
 if(!rect.width||!rect.height)return;
 var viewport=window.innerHeight||document.documentElement.clientHeight||0;
 var clearance=Math.max(92,Math.ceil(viewport-rect.top+12));
 document.documentElement.style.setProperty("--kids-timer-scroll-clearance1437",clearance+"px");
 var frame=document.getElementById("kidsAcademyPortalFrame");
 if(frame&&frame.contentDocument)try{
  var root=frame.contentDocument.documentElement;
  if(root.style.getPropertyValue("--kids-academy-dock-clearance")!==clearance+"px")
   root.style.setProperty("--kids-academy-dock-clearance",clearance+"px");
 }catch(_){}
}
/* WebKit scroll-anchor regression: guard only an untouched main-tab top.
   Any real gesture, form interaction or inner reader releases the guard. */
function protectIdleTabs(){
 if(!shell)return;
 var released=false,initialY=null,queued=false;
 function eligible(){
  if(released||document.hidden||document.body.classList.contains("kids-academy-portal-active"))return false;
  var view=shell.querySelector(".view.active");
  return !!view&&["view-today","view-stories","view-dua","view-parents","view-quran"].includes(view.id);
 }
 function settle(){
  queued=false;
  if(!eligible())return;
  if(shell.scrollTop>1)shell.scrollTop=0;
  var outer=document.scrollingElement;
  if(outer&&outer!==shell&&outer.scrollTop>1)outer.scrollTop=0;
 }
 function queue(){
  if(queued||!eligible())return;
  queued=true;
  requestAnimationFrame(settle);
 }
 document.addEventListener("click",function(e){
  var element=e.target instanceof Element?e.target:null;
  if(!element)return;
  if(element.closest(".bottom-nav .nav-btn[data-target]")){
   released=false;queue();return;
  }
  if(element.closest(".shell :is(button,a,input,select,textarea,summary,[role='button'])"))released=true;
 },true);
 document.addEventListener("touchstart",function(e){
  initialY=e.touches&&e.touches[0]?e.touches[0].clientY:null;
 },{passive:true,capture:true});
 document.addEventListener("touchmove",function(e){
  var y=e.touches&&e.touches[0]?e.touches[0].clientY:null;
  if(y!==null&&initialY!==null&&Math.abs(y-initialY)>7)released=true;
 },{passive:true,capture:true});
 document.addEventListener("touchend",function(){initialY=null},{passive:true,capture:true});
 document.addEventListener("wheel",function(){released=true},{passive:true,capture:true});
 document.addEventListener("keydown",function(e){
  if(["ArrowUp","ArrowDown","PageUp","PageDown","Home","End"," "].includes(e.key))released=true;
 },true);
 shell.addEventListener("scroll",queue,{passive:true});
 window.addEventListener("pageshow",queue,{passive:true});
 window.addEventListener("resize",queue,{passive:true});
 window.visualViewport?.addEventListener("resize",queue,{passive:true});
 document.addEventListener("visibilitychange",function(){if(!document.hidden)queue()});
 queue();
}


if(panel){
 var actions=document.createElement("div");actions.className="kids-parent-time-actions";
 start=document.createElement("button");start.type="button";start.textContent="▶ Starten";
 stop=document.createElement("button");stop.type="button";stop.textContent="■ Stopp";
 reset=document.createElement("button");reset.type="button";reset.textContent="↺ Zurücksetzen";
 actions.append(start,stop,reset);
 note=document.createElement("p");note.className="kids-parent-time-status";
 note.setAttribute("role","status");
 panel.querySelector(".parent-note")?.before(actions,note);
 if(!note.parentNode)panel.append(actions,note);
 start.addEventListener("click",playPause);
 stop.addEventListener("click",stopTimer);
 reset.addEventListener("click",resetTimer);
 slider.addEventListener("input",function(){changeDuration(slider.value)});
}
load();render();
protectIdleTabs();
window.addEventListener("pagehide",pauseActive,{passive:true});
window.addEventListener("blur",pauseActive,{passive:true});
document.addEventListener("visibilitychange",function(){
 if(document.hidden)pauseActive();
 else refreshProfile();
});
window.addEventListener("pageshow",function(){refreshProfile()},{passive:true});
window.addEventListener("resize",function(){previousMetrics="";syncDock()},{passive:true});
window.addEventListener("orientationchange",function(){previousMetrics="";requestAnimationFrame(syncDock)},{passive:true});
window.visualViewport?.addEventListener("resize",syncDock,{passive:true});
if(dock&&typeof ResizeObserver==="function")new ResizeObserver(function(){requestAnimationFrame(syncDock)}).observe(dock);
window.addEventListener("storage",function(e){
 if(e.key==="kids.activeProfile"){refreshProfile();return}
 if(e.key&&e.key.indexOf(KEY)===0&&!state?.running){load();render()}
});
setInterval(function(){if(!document.hidden)refreshProfile()},350);
})();
