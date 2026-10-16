/* KIDS_PARENT_COMPACT_TIMER_V1436
 * Independent, per-profile daily countdown. Does not rewrite account,
 * learning progress, age selection, pictures, dock or original slider handler.
 */
(function(){
"use strict";
if(window.DARKidsDailyTimer1436)return;
window.DARKidsDailyTimer1436=true;
var KEY="kids.dailyTimer.v1436.",MAX=24*60*60*1000;
var root=document.querySelector("#view-parents");
var academy=!root;
var slider=document.getElementById("minuteSlider");
var minuteValue=document.getElementById("minuteValue");
var panel=slider&&slider.closest(".parent-card");
var profileId="",state=null,rendered=false;
var screen=document.createElement("div");
screen.id="kidsLearningTimer1436";
screen.setAttribute("role","group");
screen.setAttribute("aria-label","Lernzeit-Countdown");
screen.hidden=true;
screen.innerHTML='<span aria-hidden="true">◷</span><span class="kids-timer-digits" id="kidsTimerDigits1436">12:00</span><button type="button" id="kidsTimerToggle1436" aria-label="Lernzeit pausieren">Ⅱ</button>';
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
function fresh(){var d=duration();return {day:today(),duration:d,remaining:d*60,running:false,until:0,visible:false,complete:false}}
function store(){if(!state)return;try{localStorage.setItem(KEY+profileId,JSON.stringify(state))}catch(_){}}
function load(){
 profileId=activeProfile();var candidate=null;
 try{candidate=JSON.parse(localStorage.getItem(KEY+profileId)||"null")}catch(_){}
 if(!candidate||candidate.day!==today()||!Number.isFinite(candidate.remaining)||!Number.isFinite(candidate.duration)||
  candidate.duration<5||candidate.duration>30){state=fresh();return}
 state={day:candidate.day,duration:candidate.duration,remaining:Math.max(0,Math.min(candidate.duration*60,candidate.remaining)),
 running:!!candidate.running,until:Number(candidate.until)||0,visible:!!candidate.visible,complete:!!candidate.complete};
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
 screen.hidden=!state.visible;
 if(state.visible){
  digits.textContent=fmt(state.remaining);
  toggle.textContent=state.running?"Ⅱ":"▶";
  toggle.setAttribute("aria-label",state.running?"Lernzeit pausieren":"Lernzeit fortsetzen");
  if(state.complete)toggle.setAttribute("aria-label","Tageslernzeit erreicht");
  toggle.disabled=state.complete;
 }
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
 state.complete=state.remaining===0;
 if(state.running){state.running=!state.complete;state.until=state.running?Date.now()+state.remaining*1000:0}
 state.visible=true;
 if(!state.complete&&!state.running){state.running=true;state.until=Date.now()+state.remaining*1000}
 store();render();
}
function toggleTimer(){
 if(!state)return;
 remaining();
 if(state.complete)return;
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
window.addEventListener("storage",function(e){if(!e.key||e.key.indexOf(KEY)===0||e.key==="kids.activeProfile"||e.key==="kids.minutes")refreshProfile()});
document.addEventListener("visibilitychange",function(){if(!document.hidden)refreshProfile()});
window.addEventListener("pageshow",refreshProfile);
setInterval(refreshProfile,1000);
})();
