/* KIDS_PARENT_COMPACT_TIMER_V1436
 * Independent, per-profile daily countdown. Does not rewrite account,
 * learning progress, age selection, pictures, dock or original slider handler.
 */
(function(){
"use strict";
if(window.DARKidsDailyTimer1436)return;
/* The academy portal is an iframe: the parent owns the ONE global timer. */
if(new URLSearchParams(location.search).get("kidsPortal")==="1")return;
window.DARKidsDailyTimer1436=true;
var KEY="kids.dailyTimer.v1436.",MAX=24*60*60*1000;
var root=document.querySelector("#view-parents");
var academy=!root;
var slider=document.getElementById("minuteSlider");
var minuteValue=document.getElementById("minuteValue");
var panel=slider&&slider.closest(".parent-card");
var profileId="",state=null,rendered=false;
var shell=document.querySelector(".app > .shell");
var dock=document.querySelector(".app > .bottom-nav")||document.querySelector(".bottom-nav");
var previousDockMetrics="";
var screen=document.createElement("div");
screen.id="kidsLearningTimer1436";
screen.setAttribute("role","group");
screen.setAttribute("aria-label","Lernzeit-Countdown");
screen.hidden=true;
screen.innerHTML='<span class="kids-timer-label">◷ Lernzeit</span><strong class="kids-timer-digits" id="kidsTimerDigits1436">12:00</strong><span class="kids-timer-finished" id="kidsTimerFinished1437" role="status">Mā schāʾ Allāh! Deine Lernzeit ist beendet. Möge Allah dir nützliches Wissen schenken.</span><button type="button" id="kidsTimerToggle1436" aria-label="Lernzeit pausieren">Ⅱ</button>';
document.body.append(screen);
if(academy)document.body.classList.add("kids-timer-academy1436");
var digits=document.getElementById("kidsTimerDigits1436");
var toggle=document.getElementById("kidsTimerToggle1436");
var start=null,reset=null,note=null;
function today(){
 var d=new Date();
 return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
}
function activeProfile(){
 try{return localStorage.getItem("kids.activeProfile")||"guest:"+(document.querySelector(".app")?.dataset.gender||document.body.dataset.profile||localStorage.getItem("kids.guest.gender.v1")||"boy")}
 catch(_){return "guest"}
}
function duration(){
 var n=Number(slider?.value||localStorage.getItem("kids.minutes")||12);
 return Number.isFinite(n)?Math.max(5,Math.min(30,Math.round(n))):12;
}
function fresh(){var d=duration();return {day:today(),duration:d,remaining:d*60,running:false,until:0,visible:false,complete:false,dismissed:false}}
function store(){if(!state)return;try{localStorage.setItem(KEY+profileId,JSON.stringify(state))}catch(_){}}
function load(){
 profileId=activeProfile();var candidate=null;
 try{candidate=JSON.parse(localStorage.getItem(KEY+profileId)||"null")}catch(_){}
 if(!candidate||candidate.day!==today()||!Number.isFinite(candidate.remaining)||!Number.isFinite(candidate.duration)||
  candidate.duration<5||candidate.duration>30){state=fresh();return}
 state={day:candidate.day,duration:candidate.duration,remaining:Math.max(0,Math.min(candidate.duration*60,candidate.remaining)),
 running:!!candidate.running,until:Number(candidate.until)||0,visible:!!candidate.visible,complete:!!candidate.complete,dismissed:!!candidate.dismissed};
 if(state.running&&(!state.until||state.until-Date.now()>MAX)){state.running=false;state.until=0}
 if(state.running)remaining();
}
function remaining(){
 if(!state)return 0;
 if(state.running){
  state.remaining=Math.max(0,Math.ceil((state.until-Date.now())/1000));
  if(state.remaining<=0){
   state.remaining=0;state.running=false;state.until=0;state.complete=true;store();
  }
 }
 return state.remaining;
}
function fmt(t){t=Math.max(0,Math.ceil(t));return String(Math.floor(t/60)).padStart(2,"0")+":"+String(t%60).padStart(2,"0")}
function render(){
 if(!state)return;
 remaining();
 screen.hidden=!state.visible||state.dismissed;
 screen.classList.toggle("is-complete",!!state.complete);
 document.body.classList.toggle("kids-timer-visible1437",!screen.hidden);
 if(!screen.hidden){
  digits.textContent=fmt(state.remaining);
  toggle.textContent=state.complete?"×":state.running?"Ⅱ":"▶";
  toggle.setAttribute("aria-label",state.complete?"Abschlussmeldung schließen":state.running?"Lernzeit pausieren":"Lernzeit fortsetzen");
  toggle.disabled=false;
 }
 syncDock();
 if(start){
  start.textContent=state.complete?"Tagesziel erreicht":state.running?"Ⅱ Pausieren":state.visible?"▶ Fortsetzen":"▶ Timer starten";
  start.disabled=state.complete;
 }
 if(reset)reset.disabled=!state.visible&&!state.complete;
 if(note)note.textContent=state.complete?"Die heutige Lernzeit ist erreicht. Morgen beginnt ein neuer Tag.":
  state.running?"Lernzeit läuft · "+fmt(state.remaining):
  state.visible?"Pausiert · "+fmt(state.remaining):
  "Die gewählte Lernzeit wird beim Start heruntergezählt.";
}
function changeDuration(next){
 var n=Number(next);
 if(!Number.isFinite(n))return;
 n=Math.max(5,Math.min(30,Math.round(n)));
 remaining();
 var used=Math.max(0,state.duration*60-state.remaining);
 state.duration=n;state.remaining=Math.max(0,n*60-used);
 state.complete=state.remaining===0;state.dismissed=false;
 if(state.running){state.running=!state.complete;state.until=state.running?Date.now()+state.remaining*1000:0}
 state.visible=true;
 if(!state.complete&&!state.running){state.running=true;state.until=Date.now()+state.remaining*1000}
 store();render();
}
function toggleTimer(){
 if(!state)return;
 remaining();
 if(state.complete){state.dismissed=true;state.visible=false;store();render();return;}
 if(state.running){state.running=false;state.until=0}
 else{if(!state.visible&&state.remaining===0)state.remaining=state.duration*60;
  state.visible=true;state.running=true;state.until=Date.now()+state.remaining*1000}
 store();render();
}
function resetTimer(){
 if(!state)return;
 state=fresh();store();render();
}
function refreshProfile(){
 var id=activeProfile();
 if(id!==profileId||!state||today()!==state.day){
  load();
  if(slider&&state&&!state.visible&&state.duration!==duration()){state.duration=duration();state.remaining=state.duration*60}
 }
 render();
}

/* Keep bar geometrically attached to actual 5-tab bar, also above Academy.
   No extra navigation or scrollbar; only ONE displayed widget. */
function syncDock(){
 if(!dock||!dock.isConnected)dock=document.querySelector(".app > .bottom-nav")||document.querySelector(".bottom-nav");
 if(!dock||!state)return;
 var rect=dock.getBoundingClientRect();
 if(!rect.height||!rect.width)return;
 var viewportHeight=window.innerHeight||document.documentElement.clientHeight||0;
 var visible=state.visible&&!state.dismissed;
 var height=visible?Math.max(42,Math.ceil(screen.getBoundingClientRect().height||46)):0;
 var left=Math.max(4,Math.round(rect.left));
 var width=Math.max(220,Math.min(Math.floor(rect.width),Math.floor(window.innerWidth)-2*left));
 var bottom=Math.max(0,Math.round(viewportHeight-rect.top+7));
 var metrics=[left,width,bottom].join("/");
 if(metrics!==previousDockMetrics){
  screen.style.left=left+"px";screen.style.width=width+"px";screen.style.bottom=bottom+"px";
  previousDockMetrics=metrics;
 }
 var clearance=Math.max(92,Math.ceil(viewportHeight-rect.top+12)+(visible?height+9:0));
 document.documentElement.style.setProperty("--kids-timer-scroll-clearance1437",clearance+"px");
 var frame=document.getElementById("kidsAcademyPortalFrame");
 if(frame&&frame.contentDocument){
  try{
   var academyRoot=frame.contentDocument.documentElement;
   if(academyRoot.style.getPropertyValue("--kids-academy-dock-clearance")!==clearance+"px")
    academyRoot.style.setProperty("--kids-academy-dock-clearance",clearance+"px");
  }catch(_){}
 }
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

toggle.addEventListener("click",toggleTimer);
if(panel){
 var actions=document.createElement("div");
 actions.className="kids-parent-time-actions";
 start=document.createElement("button");start.type="button";start.textContent="▶ Timer starten";
 reset=document.createElement("button");reset.type="button";reset.textContent="Zurücksetzen";
 actions.append(start,reset);
 note=document.createElement("p");note.className="kids-parent-time-status";note.setAttribute("role","status");
 panel.querySelector(".parent-note")?.before(actions,note);
 if(!note.parentNode)panel.append(actions,note);
 start.addEventListener("click",toggleTimer);
 reset.addEventListener("click",resetTimer);
 // Original slider handler continues to own kids.minutes, we only subscribe.
 slider.addEventListener("input",function(){changeDuration(slider.value)});
}
load();render();rendered=true;
protectIdleTabs();
window.addEventListener("resize",syncDock,{passive:true});
window.addEventListener("orientationchange",function(){previousDockMetrics="";requestAnimationFrame(syncDock)},{passive:true});
window.visualViewport?.addEventListener("resize",syncDock,{passive:true});
if(dock&&typeof ResizeObserver==="function")new ResizeObserver(function(){requestAnimationFrame(syncDock)}).observe(dock);
if(document.getElementById("kidsAcademyPortal")&&typeof MutationObserver==="function")new MutationObserver(syncDock).observe(document.getElementById("kidsAcademyPortal"),{attributes:true,attributeFilter:["class","hidden"]});
window.addEventListener("storage",function(e){if(!e.key||e.key.indexOf(KEY)===0||e.key==="kids.activeProfile"||e.key==="kids.minutes")refreshProfile()});
document.addEventListener("visibilitychange",function(){if(!document.hidden)refreshProfile()});
window.addEventListener("pageshow",refreshProfile);
setInterval(refreshProfile,1000);
})();
