/* KIDS_PARENTS_DASHBOARD_V1432
 * Presentation-only enhancement: never edit saved profiles, lesson progress,
 * parental time settings, account RPC or offline download data.
 * Native <details> keep controls keyboard/touch accessible.
 */
(function(){
"use strict";
const $=q=>document.querySelector(q);
const page=$("#view-parents");
if(!page||page.dataset.parentsDashboard==="1432")return;
page.dataset.parentsDashboard="1432";
const head=page.querySelector(".page-head");
const agePanel=$("#parentBirthPanel")?.closest(".parent-card");
const timePanel=$("#minuteSlider")?.closest(".parent-card");
const progressPanel=$("#parentStoriesDone")?.closest(".parent-card");
const profilePanel=$("#profileCard");
if(!head||!agePanel||!timePanel||!progressPanel||!profilePanel)return;
agePanel.classList.add("kids-parent-age-card");
timePanel.classList.add("kids-parent-time-card");
progressPanel.classList.add("kids-parent-progress-card");
const summary=document.createElement("section");
summary.className="kids-parent-overview parent-card";
summary.setAttribute("aria-label","Aktives Kinderprofil");
summary.innerHTML=
  '<div class="kids-parent-overview-top"><span class="kids-parent-eyebrow">AKTIVES KINDERPROFIL</span><span class="kids-parent-account-state" id="kidsParentAccountState"></span></div>'+
  '<div class="kids-parent-identity"><img id="kidsParentAvatar" alt="" width="68" height="68">'+
  '<div class="kids-parent-identity-copy"><strong id="kidsParentName">Kinderprofil</strong>'+
  '<span id="kidsParentIdentityMeta">Lernstufe wird geladen</span>'+
  '<small id="kidsParentAgeNote">Lernstand und Altersstufe</small></div></div>'+
  '<button type="button" id="kidsParentManage" class="kids-parent-manage">Kinderkonten verwalten <span aria-hidden="true">›</span></button>';
head.after(summary);
summary.after(progressPanel);
progressPanel.after(timePanel);
timePanel.after(agePanel);

function detailsWrap(panel,id,title,subtext){
 const outer=document.createElement("details");outer.className="kids-parent-fold";outer.id=id;
 const sum=document.createElement("summary");
 sum.className="kids-parent-fold-summary";
 const titleNode=document.createElement("strong");titleNode.textContent=title;
 const hint=document.createElement("small");hint.textContent=subtext;
 const arrow=document.createElement("span");arrow.className="kids-parent-fold-arrow";arrow.textContent="⌄";arrow.setAttribute("aria-hidden","true");
 const copy=document.createElement("span");copy.className="kids-parent-fold-copy";copy.append(titleNode,hint);
 sum.append(copy,arrow);
 panel.before(outer);outer.append(sum,panel);
 return outer;
}
const accountDetails=detailsWrap(profilePanel,"kidsParentAccounts","Kinderkonten","Profil wechseln, anmelden oder hinzufügen");
profilePanel.querySelector(".label-row")?.classList.add("kids-parent-old-label");
const modeCard=$("#kidsAgeMode");
agePanel.querySelector(".label-row")?.querySelector("strong")?.replaceChildren(document.createTextNode("Alter & Lernstufe"));
const ageTabs=agePanel.querySelector(".age-tabs");
const ageNote=document.createElement("p");
ageNote.className="kids-parent-current-age";
ageNote.id="kidsParentCurrentAge";
ageTabs?.before(ageNote);
const birthPanel=$("#parentBirthPanel");
let birthFold=null;
if(birthPanel){
 birthFold=document.createElement("details");
 birthFold.className="kids-parent-birth-fold";
 birthFold.id="kidsParentBirthFold";
 const sum=document.createElement("summary");sum.textContent="Geburtsmonat und Jahr bearbeiten";
 birthPanel.before(birthFold);
 birthFold.append(sum,birthPanel);
}
// Keep account form valid if parents reopen the age details: the original
// refreshBirthPanel() remains the single source of form values and validation.
function profileInfo(){
 try{
  const id=localStorage.getItem("kids.activeProfile");
  const profiles=JSON.parse(localStorage.getItem("kids.profiles.v1")||"[]");
  const p=Array.isArray(profiles)?profiles.find(x=>String(x?.id)===String(id)):null;
  return p&&id?p:null;
 }catch(_){return null}
}
const safeAge=x=>["4–5","6–8","9–10"].includes(x)?x:"6–8";
function paint(){
 const child=profileInfo(),app=$(".app");
 const girl=app?.dataset.gender==="girl";
 const birth=child&&window.DARKidsBirthMonth?.get(child.id)||"";
 const actual=birth?window.DARKidsBirthMonth.ageAt(birth):null;
 const group=birth?window.DARKidsBirthMonth.groupAt(birth):safeAge(app?.dataset.age||child?.age);
 const display=child?.name||"Gastprofil";
 $("#kidsParentAvatar").src=girl?"/kids/assets/profile-avatars/girl-hijab-pink-v1235.svg":"/kids/assets/profile-avatars/boy-kufi-v1235.svg";
 $("#kidsParentName").textContent=display;
 $("#kidsParentIdentityMeta").textContent=(girl?"Mädchen":"Junge")+" · "+(actual!==null?actual+" Jahre · ":"")+"Lernstufe "+group;
 $("#kidsParentAgeNote").textContent=child?(birth?"Automatisch ab dem 1. des Geburtsmonats":"Geburtsmonat für automatische Anpassung ergänzen"):"Ohne Anmeldung · manuelle Altersstufe";
 $("#kidsParentAccountState").textContent=child?"Angemeldet":"Gast";
 if(ageTabs)ageTabs.hidden=!!birth;
 const ageText=$("#kidsParentCurrentAge");
 if(ageText)ageText.textContent=birth?
   "Automatisch eingestellt: "+group+(actual!==null?" · "+actual+" Jahre":""):
   "Aktuelle Lernstufe: "+group+(child?" · Geburtsmonat noch nicht hinterlegt":" · manuell wählbar");
 if(birthFold){
   birthFold.hidden=!child;
   if(!child)birthFold.open=false;
 }
 if(modeCard)modeCard.textContent=birth?"AUTOMATISCH":"MANUELL";
 const stat=progressPanel.querySelector(".label-row span");
 if(stat)stat.textContent=child?"PROFILBEZOGEN":"DIESES GERÄT";
 checkBirthFields();
}
$("#kidsParentManage")?.addEventListener("click",function(){
 accountDetails.open=true;
 accountDetails.scrollIntoView({block:"start",behavior:"smooth"});
});
function expandForDelete(){
 if($("#profileAsk")&&!$("#profileAsk").hidden)accountDetails.open=true;
}
const accountList=$("#profileList");
if(accountList&&"MutationObserver" in window){
 new MutationObserver(()=>{paint();expandForDelete()}).observe(accountList,{childList:true});
}
if("MutationObserver" in window&&$(".app")){
 new MutationObserver(paint).observe($(".app"),{attributes:true,attributeFilter:["data-age","data-gender"]});
}
// Validation remains in the original handler; do not show success before save.
// Refresh only after its synchronous handler has run.
const birthSave=$("#parentBirthSave");
function checkBirthFields(){
 const month=$("#parentBirthMonth")?.value||"",year=$("#parentBirthYear")?.value||"";
 if(birthSave)birthSave.disabled=!window.DARKidsBirthMonth?.isEligible(year+"-"+month);
}
for(const id of ["parentBirthMonth","parentBirthYear"]){
 $("#"+id)?.addEventListener("change",checkBirthFields);
}
birthSave?.addEventListener("click",function(){
 const entered=($("#parentBirthYear")?.value||"")+"-"+($("#parentBirthMonth")?.value||"");
 setTimeout(function(){
   paint();checkBirthFields();
   const p=profileInfo();
   if(p&&window.DARKidsBirthMonth?.get(p.id)===entered){
     if(birthFold)birthFold.open=false;
     const note=$("#kidsParentCurrentAge");
     if(note)note.textContent="✓ Gespeichert · automatische Lernstufe "+window.DARKidsBirthMonth.groupAt(entered);
   }
 },50);
});
window.addEventListener("pageshow",paint);
window.addEventListener("storage",event=>{
 if(!event.key||["kids.activeProfile","kids.profiles.v1","kids.age"].includes(event.key)||event.key.startsWith("dar.kids.birthMonth.v1."))paint();
});
document.addEventListener("visibilitychange",()=>{if(!document.hidden)paint()});
// The offline card is dynamically inserted by its existing module. Reposition
// as a folded card between age settings and accounts without modifying its
// download/ServiceWorker message handlers.
function arrangeOffline(){
 const card=$("#kidsOfflineLibrary");if(!card)return;
 if(card.parentElement?.id==="kidsParentOffline")return;
 const folded=detailsWrap(card,"kidsParentOffline","Offline-Bibliothek","Downloads und Gerätespeicher");
 accountDetails.before(folded);
}
arrangeOffline();
if("MutationObserver" in window){
 const observer=new MutationObserver(()=>{if($("#kidsOfflineLibrary")&&!$("#kidsParentOffline"))arrangeOffline()});
 observer.observe(page,{childList:true});
}
function arrangeStorySettings(){
 const panel=$("#studioContentPreferences");
 if(!panel||$("#kidsParentStorySettings"))return;
 const details=detailsWrap(panel,"kidsParentStorySettings","Geschichten","Lesen, hören und Einstellungen");
 accountDetails.after(details);
}
arrangeStorySettings();
if("MutationObserver" in window){
 new MutationObserver(function(){
  if($("#studioContentPreferences")&&!$("#kidsParentStorySettings"))arrangeStorySettings();
 }).observe(page,{childList:true});
}
paint();
checkBirthFields();
})();
