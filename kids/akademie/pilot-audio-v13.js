/* KIDS Academy V16 – strict owner-preview: first play is synchronous with iOS tap.
 * This is a QA preview of FOUR still-unapproved recordings, not public lesson audio.
 * Do not generate synthetic device speech or bill any ElevenLabs credits here.
 */
(function(){
 "use strict";
 const qp=new URLSearchParams(location.search);
 const adultPilot=qp.get("voicePilot")==="1";
 const explicitGirlPreview=qp.get("previewProfil")==="maedchen"&&qp.get("previewAlter")==="4-5";
 // This is a QA-only preview. Real children's lessons do NOT auto-play unapproved clips.
 if(!(adultPilot||explicitGirlPreview)||!location.pathname.includes("/kids/akademie/"))return;
 const clips=[
  {text:"As-salāmu ʿalaykum, liebe Schwester.",src:"/kids/assets/kids-academy-audio/00ff589726b166dff6a9.m4a"},
  {text:"Schön, dass du da bist!",src:"/kids/assets/kids-academy-audio/f142bc78e8bcea3d8518.m4a"},
  {text:"Heute geht es darum, die Wahrheit zu sagen. Wir hören zu und überlegen zusammen. Du darfst eine Pause machen.",src:"/kids/assets/kids-academy-audio/08d1f46461d954d5e471.m4a"},
  {text:"Manchmal geht etwas aus Versehen kaputt.",src:"/kids/assets/kids-academy-audio/1a6097339111c8ac475c.m4a"}
 ];
 let current=null,runId=0;
 function status(message){
  for(const selector of ["#audioFeedback","#voiceStatus","#academyPilotStatus"]){
   const el=document.querySelector(selector);if(el)el.textContent=message;
  }
 }
 function stop(){
  runId++;
  const player=current;current=null;
  if(player){player.onended=player.onerror=player.onplaying=null;
   try{player.pause();player.removeAttribute("src");player.load()}catch(_){}}
 }
 function start(indices){
  // Called directly by the click event. No await, fetch, timeout, or generated voice.
  stop();
  try{window.DARKidsOwnerVoice?.stop?.()}catch(_){}
  try{window.speechSynthesis?.cancel?.()}catch(_){}
  let index=0;const id=runId;
  const player=new Audio();current=player;player.volume=1;player.muted=false;player.preload="auto";
  player.setAttribute("playsinline","");player.setAttribute("webkit-playsinline","");
  const fail=e=>{
   if(runId!==id||current!==player)return;
   const reason=e?.name||"Audio-Datei nicht abrufbar";
   status("Masteraufnahme konnte nicht abgespielt werden. Prüfe Verbindung und Medienlautstärke.");
   const d=document.querySelector("#audioDiagnostics");
   if(d)d.textContent="V4-Testaudio nicht abspielbar ("+reason+"). Prüfe die veröffentlichte Audiodatei.";
   stop();
  };
  const next=()=>{
   if(runId!==id||current!==player)return;
   if(index>=indices.length){status("Masterstimme abgespielt. Zum Wiederholen erneut tippen.");stop();return}
   const track=clips[indices[index]];
   player.src=track.src+"?v=kids-serhat-v13-20261010";
   player.playbackRate=1;
   status("Serhat-Masteraufnahme lädt: "+track.text);
   player.onplaying=()=>{if(runId===id&&current===player)status("Du hörst Serhats Masterstimme: "+track.text)};
   player.onerror=()=>fail({name:"Audiodatei nicht erreichbar"});
   player.onended=()=>{index++;next()};
   try{
    // This FIRST call executes in the trusted tap handler, retaining iOS playback permission.
    const p=player.play();
    if(p&&typeof p.catch==="function")p.catch(fail);
   }catch(e){fail(e)}
  };
  next();
 }
 function isGirl45(){
  // Never trust preview URL parameters over a real saved child profile.
  return document.body?.dataset?.profile==="girl"&&document.body?.dataset?.kidsAge==="4-5";
 }
 function matchesExactSidqText(){
  // Do not narrate Ṣidq audio over a different subject or another lesson.
  return document.querySelector("#welcomeFollowup")?.textContent?.trim()===clips[1].text&&
   document.querySelector("#lessonWelcomeBody")?.textContent?.trim()===clips[2].text;
 }
 document.addEventListener("click",event=>{
  const pilot=event.target.closest?.("[data-academy-pilot]");
  if(pilot&&adultPilot){
   const k=Number(pilot.dataset.academyPilot);
   if(!Number.isInteger(k)||k<0||k>=clips.length)return;
   event.preventDefault();event.stopImmediatePropagation();start([k]);return;
  }
  const welcome=event.target.closest?.('[data-speak-stage="0"]');
  if(welcome&&isGirl45()&&matchesExactSidqText()&&!document.querySelector("#lessonMain")?.hidden){
   event.preventDefault();event.stopImmediatePropagation();start([0,1,2]);return;
  }
  const stage=event.target.closest?.('[data-speak-stage="1"]');
  if(stage&&isGirl45()&&matchesExactSidqText()&&!document.querySelector("#lessonMain")?.hidden&&
   document.querySelectorAll("#explainWords [data-spoken]")?.[0]?.textContent?.trim()===clips[3].text){
   event.preventDefault();event.stopImmediatePropagation();start([3]);return;
  }
  if(current&&event.target.closest?.('[data-jump-step],[data-open-lesson],[data-open-category],#academyNavBack,#backToAcademy,#subjectBack')){
   stop();
  }
 },true);
 document.addEventListener("visibilitychange",()=>{if(document.hidden)stop()});
 window.addEventListener("pagehide",stop);
 function ready(){
  const panel=document.querySelector("#academyPilotControls");
  if(panel)panel.hidden=!adultPilot;
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ready,{once:true});
 else ready();
})();
