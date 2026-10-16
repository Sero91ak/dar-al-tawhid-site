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
/* KIDS_FAMILY_STRUCTURE_V1435 — same existing parent card, gender-scoped
 * design variables, profile ownership and login handlers. No new credentials. */
const family=document.createElement("div");
family.className="kids-parent-family";
family.setAttribute("aria-label","Kinderprofile auf diesem Gerät");
family.innerHTML=
 '<div class="kids-parent-family-heading"><strong>Kinderprofile</strong><small id="kidsParentFamilyCount"></small></div>'+
 '<div id="kidsParentFamilyGrid" class="kids-parent-family-grid"></div>';
const resume=document.createElement("div");
resume.id="kidsParentResume";
resume.className="kids-parent-resume";
resume.hidden=true;
resume.innerHTML=
 '<div class="kids-parent-activity-heading"><div><span class="kids-parent-activity-eyebrow">DEINE APP-AKTIVITÄT</span><strong>Zuletzt gehört</strong></div><span class="kids-parent-activity-tag">Hörbereich</span></div>'+
 '<div class="kids-parent-activity-content"><img id="kidsParentResumeArt" src="/kids/assets/kids-icons/headphones-real-v12.png" alt="" width="62" height="62" loading="lazy">'+
 '<div class="kids-parent-activity-text"><strong id="kidsParentResumeText">Noch keine Hörgeschichte</strong><small id="kidsParentResumePosition">Dein zuletzt gehörtes Hörbuch erscheint hier.</small>'+
 '<div id="kidsParentResumeProgress" class="kids-parent-activity-progress" hidden><span id="kidsParentResumeProgressBar"></span></div></div></div>'+
 '<div class="kids-parent-activity-actions"><small>Zuletzt auf diesem Gerät gehört</small><button type="button" id="kidsParentResumeOpen" disabled>▶ Weiterhören</button></div>';
summary.querySelector("#kidsParentManage").before(family);
summary.after(progressPanel);
progressPanel.after(resume);
resume.after(timePanel);
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
// KIDS_PARENTS_PLAIN_LANGUAGE_V1434: reduce technical wording for parents.
const intro=head.querySelector("p");
if(intro)intro.textContent="Kinderprofil, Lernfortschritt und Einstellungen auf einen Blick.";
const progressCopy=progressPanel.querySelector(".parent-note");
if(progressCopy)progressCopy.textContent="Die Zahlen zeigen deinen aktuellen Lernstand – ohne Ranglisten oder Vergleiche.";
const timeTag=document.createElement("small");
timeTag.className="kids-parent-time-eyebrow";
timeTag.textContent="ELTERNSTEUERUNG · LERNZEIT";
timePanel.prepend(timeTag);
const timeCopy=timePanel.querySelector(".parent-note");
if(timeCopy)timeCopy.textContent="Ein ruhiges Tagesziel statt endlosem Lernen. Du kannst es jederzeit anpassen.";
const accountsCopy=profilePanel.querySelector(".parent-note");
if(accountsCopy)accountsCopy.textContent="Kinderkonto hinzufügen, wechseln oder auf einem anderen Gerät anmelden. Ohne Konto ist die App weiterhin nutzbar.";
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
function profilesOnDevice(){
 try{
  const rows=JSON.parse(localStorage.getItem("kids.profiles.v1")||"[]");
  return Array.isArray(rows)?rows.filter(row=>row&&typeof row.id==="string"&&typeof row.name==="string"):[];
 }catch(_){return []}
}
function renderFamily(){
 const grid=$("#kidsParentFamilyGrid"),counter=$("#kidsParentFamilyCount");
 if(!grid||!counter)return;
 const rows=profilesOnDevice(),active=localStorage.getItem("kids.activeProfile");
 counter.textContent=rows.length===1?"1 Kind auf diesem Gerät":rows.length+" Kinder auf diesem Gerät";
 const fragment=document.createDocumentFragment();
 rows.slice(0,4).forEach(function(child){
  const isActive=String(child.id)===String(active);
  const button=document.createElement("button");
  button.type="button";button.className="kids-parent-family-child";
  if(isActive){button.classList.add("is-active");button.disabled=true;button.setAttribute("aria-current","true")}
  const img=document.createElement("img");
  img.alt="";img.width=32;img.height=32;
  img.src=child.gender==="girl"?"/kids/assets/profile-avatars/girl-hijab-pink-v1235.svg":"/kids/assets/profile-avatars/boy-kufi-v1235.svg";
  const copy=document.createElement("span");copy.className="kids-parent-family-child-copy";
  const name=document.createElement("strong");name.textContent=child.name;
  const hint=document.createElement("small");hint.textContent=isActive?"Aktiv":"Anmelden";
  copy.append(name,hint);button.append(img,copy);
  if(!isActive)button.addEventListener("click",function(){
   /* Delegate to the existing authenticated profile selector.
      Never bypass the current per-child password prompt. */
   const target=Array.from(document.querySelectorAll("#profileList [data-profile]"))
    .find(el=>el.getAttribute("data-profile")===String(child.id));
   if(target)target.click();
   else $("#kidsParentManage")?.click();
  });
  fragment.appendChild(button);
 });
 if(rows.length>4){
  const more=document.createElement("button");
  more.type="button";more.className="kids-parent-family-more";
  more.textContent="Alle "+rows.length+" Kinder ansehen";
  more.addEventListener("click",function(){$("#kidsParentManage")?.click()});
  fragment.appendChild(more);
 }else{
  const add=document.createElement("button");
  add.type="button";add.className="kids-parent-family-more";
  add.textContent=rows.length?"Weiteres Kind":"Kinderkonto anlegen";
  add.addEventListener("click",function(){$("#profileAdd")?.click()});
  fragment.appendChild(add);
 }
 grid.replaceChildren(fragment);
}
function readLastStory(){
 let item=null;
 try{item=JSON.parse(localStorage.getItem("kids.storyHub.last.v1")||"null")}catch(_){}
 if(!item||typeof item!=="object"||typeof item.title!=="string"||!item.title.trim()||
  typeof item.category!=="string"||typeof item.id!=="string"||
  !Number.isFinite(Number(item.time))||Number(item.time)<=2||item.completed===true)return null;
 return item;
}
const storyCategory={prophets:"Propheten",sahaba:"Ṣaḥābah",sahabiyyat:"Ṣaḥābiyyāt",deen:"Lern-Erzählungen"};
function listenTime(seconds){
 const n=Math.max(0,Math.floor(Number(seconds)||0));
 return Math.floor(n/60)+":"+String(n%60).padStart(2,"0");
}
function renderLastStory(){
 const wrap=$("#kidsParentResume"),label=$("#kidsParentResumeText");
 const info=$("#kidsParentResumePosition"),art=$("#kidsParentResumeArt");
 const track=$("#kidsParentResumeProgress"),bar=$("#kidsParentResumeProgressBar");
 const button=$("#kidsParentResumeOpen");
 if(!wrap||!label||!info||!art||!track||!bar||!button)return;
 const item=readLastStory();
 wrap.hidden=false;
 button.disabled=!item;
 if(!item){
  label.textContent="Noch keine Hörgeschichte";
  info.textContent="Deine zuletzt gehörte Geschichte erscheint hier.";
  art.src="/kids/assets/kids-icons/headphones-real-v12.png";
  track.hidden=true;bar.style.width="0%";
  return;
 }
 label.textContent=item.title.trim();
 info.textContent=(storyCategory[item.category]||"Hörgeschichte")+" · ab "+listenTime(item.time)+
  (Number(item.duration)>0?" von "+listenTime(item.duration):"");
 const safeArt=typeof item.artwork==="string"&&item.artwork.startsWith("/kids/assets/")&&!item.artwork.includes("..");
 art.src=safeArt?item.artwork:"/kids/assets/kids-icons/headphones-real-v12.png";
 const duration=Number(item.duration)||0;
 const pct=duration>0?Math.min(100,Math.max(0,Number(item.time)/duration*100)):0;
 track.hidden=!(duration>0);bar.style.width=pct.toFixed(1)+"%";
 track.setAttribute("role","progressbar");
 track.setAttribute("aria-label","Fortschritt der Hörgeschichte");
 track.setAttribute("aria-valuenow",String(Math.round(pct)));
 track.setAttribute("aria-valuemin","0");
 track.setAttribute("aria-valuemax","100");
}
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
 renderFamily();renderLastStory();
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
$("#kidsParentResumeOpen")?.addEventListener("click",function(){
 const item=readLastStory();
 if(!item)return;
 document.querySelector('.bottom-nav [data-target="stories"]')?.click();
 // Open the original Story Hub resume API at the saved second, no mock player.
 setTimeout(function(){
  if(window.DARKidsStoryHub&&typeof window.DARKidsStoryHub.openResume==="function"){
   window.DARKidsStoryHub.openResume(item.category,item.id,Number(item.time)||0);
  }else if(window.DARKidsStoryHub&&typeof window.DARKidsStoryHub.openStory==="function"){
   window.DARKidsStoryHub.openStory(item.category,item.id);
  }
 },180);
});
$("#kidsParentManage")?.addEventListener("click",function(){
 accountDetails.open=true;
 accountDetails.scrollIntoView({block:"nearest",behavior:"smooth"});
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
window.addEventListener("dar-kids-story-resume",renderLastStory);
window.addEventListener("storage",event=>{
 if(!event.key||["kids.activeProfile","kids.profiles.v1","kids.age"].includes(event.key)||event.key.startsWith("dar.kids.birthMonth.v1."))paint();
 if(!event.key||event.key==="kids.storyHub.last.v1")renderLastStory();
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
 const details=detailsWrap(panel,"kidsParentStorySettings","Geschichten-Einstellungen","Darstellung und Wiedergabe anpassen");
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
