/* KIDS TEST Creator Studio V1: entirely device-local editorial work.
 * This script NEVER calls a write API and NEVER changes child progress or
 * production content. Preview profile is simulated only in this console.
 */
(()=>{"use strict";
const VERSION=1, STORAGE_KEY="dar_kids_creator_studio_v1", ID="kids-creator-local-studio";
const $=id=>document.getElementById(id);
const statuses=["unbearbeitet","entwurf","in-arbeit","quellenpruefung","audio-pruefung","testbereit"];
const moduleKeys=["home","quran","stories","dua","parents","academy"];
const initial=()=>({schema:ID,version:VERSION,selection:{age:"4-5",profile:"maedchen",module:"home"},weekStart:"",courses:{},modules:{},updatedAt:null});
let state=initial(),slots=[],chosen=null;
const notice=(msg,problem=false)=>{const el=$("studioMessage");if(!el)return;el.textContent=msg;el.classList.toggle("warning",problem)};
const safeStore=()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));return true}catch(_){notice("Browser-Speicher nicht verfügbar. Bitte deine Entwürfe per JSON exportieren.",true);return false}};
const now=()=>new Date().toISOString();
const validDay=s=>!s||(/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(new Date(s+"T12:00:00Z").valueOf()));
const monday=s=>{if(!s)return true;const d=new Date(s+"T12:00:00Z");return validDay(s)&&d.getUTCDay()===1};
function readStore(){
 try{const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return;const val=JSON.parse(raw);
 if(val&&val.schema===ID&&val.version===VERSION)state=normalize(val);
 }catch(_){notice("Lokale Einstellungen konnten nicht geladen werden. Ein neues Testprofil wurde geöffnet.",true)}
}
function normalize(input){
 const result=initial();
 if(!input||typeof input!=="object"||Array.isArray(input))return result;
 const sel=input.selection||{};
 result.selection={
  age:["4-5","6-8","9-10"].includes(sel.age)?sel.age:"4-5",
  profile:["maedchen","junge"].includes(sel.profile)?sel.profile:"maedchen",
  module:moduleKeys.includes(sel.module)?sel.module:"home"
 };
 result.weekStart=monday(input.weekStart)?String(input.weekStart||""):"";
 if(input.courses&&typeof input.courses==="object"&&!Array.isArray(input.courses))
 for(let key of Object.keys(input.courses).slice(0,208)){
   const n=Number(key),x=input.courses[key];
   if(!Number.isInteger(n)||n<1||n>208||!x||typeof x!=="object")continue;
   result.courses[String(n)]={
    status:statuses.includes(x.status)?x.status:"unbearbeitet",
    title:String(x.title||"").slice(0,180),
    notes:String(x.notes||"").slice(0,3500),
    plannedDate:validDay(x.plannedDate)?String(x.plannedDate||""):"",
    checks:{
      quelle:!!x.checks?.quelle,alter:!!x.checks?.alter,
      audio:!!x.checks?.audio,ui:!!x.checks?.ui
    },
    updatedAt:typeof x.updatedAt==="string"?x.updatedAt.slice(0,32):""
   }
 }
 if(input.modules&&typeof input.modules==="object"&&!Array.isArray(input.modules))
 for(const key of moduleKeys){
   const x=input.modules[key];
   if(x&&typeof x==="object")
     result.modules[key]={status:["offen","geprueft","fehler"].includes(x.status)?x.status:"offen",note:String(x.note||"").slice(0,1000),updatedAt:typeof x.updatedAt==="string"?x.updatedAt.slice(0,32):""};
 }
 result.updatedAt=typeof input.updatedAt==="string"?input.updatedAt.slice(0,32):null;
 return result;
}
function fmtDate(day){
 if(!day)return "noch nicht erfasst";
 const dt=new Date(day+"T12:00:00Z");
 return new Intl.DateTimeFormat("de-DE",{year:"numeric",month:"2-digit",day:"2-digit",timeZone:"UTC"}).format(dt);
}
function setInput(id,v){const el=$(id);if(el)el.value=v||""}
const val=id=>$(id)?.value||"";
function renderSummary(){
 const work=Object.values(state.courses||{}).filter(c=>c.status!=="unbearbeitet"||c.notes||c.title);
 $("studioDrafts").textContent=String(work.length);
 $("studioReady").textContent=String(work.filter(c=>c.status==="testbereit").length);
 const mods=Object.values(state.modules||{}).filter(m=>m.status==="geprueft");
 $("studioModules").textContent=String(mods.length)+"/6";
 $("studioSavedAt").textContent=state.updatedAt?new Date(state.updatedAt).toLocaleString("de-DE"):"noch nicht erfasst";
 $("releaseFlag").textContent="LIVE-PUSH GESPERRT · nur KIDS TEST";
}
function assignSlot(num,scroll=true){
 const id=Number(num);
 if(!Number.isInteger(id)||id<1||id>208)return;
 chosen=id;
 $("studioSlot").value=String(id);
 const e=slots.find(x=>x.slot===id),local=state.courses[String(id)]||{};
 $("studioSlotInfo").textContent="Woche "+(e?.week||"?")+" · "+(e?.day||"")+" · "+(e?.title||("Unterrichtsplatz "+id+" (noch offen)"));
 setInput("studioTitle",local.title||"");
 setInput("studioStatus",local.status||"unbearbeitet");
 setInput("studioNotes",local.notes||"");
 setInput("studioPlanDate",local.plannedDate||"");
 for(const key of ["quelle","alter","audio","ui"])$("check-"+key).checked=!!local.checks?.[key];
 if(scroll){
    const container=document.getElementById("kidsAdvancedEditor");
    if(container)container.open=true;
    $("studioEditor").scrollIntoView({block:"start",behavior:"smooth"});
  }
 notice("Unterrichtsplatz #"+id+" geladen. Änderungen werden erst nach „Lokal speichern“ gesichert.");
}
function saveCourse(){
 if(!chosen)return notice("Bitte zuerst einen Unterrichtsplatz auswählen.",true);
 const c={
  status:statuses.includes(val("studioStatus"))?val("studioStatus"):"unbearbeitet",
  title:val("studioTitle").trim().slice(0,180),notes:val("studioNotes").trim().slice(0,3500),
  plannedDate:val("studioPlanDate"),checks:{},updatedAt:now()
 };
 if(!validDay(c.plannedDate))return notice("Der geplante Termin ist ungültig.",true);
 for(const key of ["quelle","alter","audio","ui"])c.checks[key]=$("check-"+key).checked;
 state.courses[String(chosen)]=c;
 state.updatedAt=c.updatedAt;
 if(safeStore()){renderSummary();notice("Lokal gespeichert: Unterrichtsplatz #"+chosen+". Keine Änderung in GitHub oder Besucher-App.");}
}
function removeCourse(){
 if(!chosen)return;
 if(!confirm("Nur den LOKALEN Entwurf für Unterrichtsplatz #"+chosen+" entfernen? Die ursprüngliche Lektion bleibt unverändert."))return;
 delete state.courses[String(chosen)];state.updatedAt=now();
 if(safeStore()){assignSlot(chosen);renderSummary();notice("Nur der lokale Entwurf wurde entfernt.");}
}
function saveModule(){
 const key=val("moduleChoose");
 if(!moduleKeys.includes(key))return;
 state.modules[key]={status:val("moduleState"),note:val("moduleNote").trim().slice(0,1000),updatedAt:now()};
 state.updatedAt=now();
 if(safeStore()){renderSummary();notice("Die Modulprüfung wurde nur auf diesem Gerät gespeichert.");}
}
function chooseModule(){
 const key=val("moduleChoose"),item=state.modules[key]||{};
 setInput("moduleState",item.status||"offen");
 setInput("moduleNote",item.note||"");
}
function prefsChanged(){
 state.selection={age:val("testAge"),profile:val("testProfile"),module:val("testModule")};
 const date=val("cycleMonday");if(!monday(date)){ $("cycleMonday").setCustomValidity("Bitte einen Montag wählen.");$("cycleMonday").reportValidity();return}
 $("cycleMonday").setCustomValidity("");
 state.weekStart=date;state.updatedAt=now();
 if(safeStore()){renderSummary();notice("Testprofil und Planstart lokal gespeichert. Die KIDS-App selbst wird nicht automatisch umgestellt.");}
}
function renderUpcoming(){
 $("studioWeekDate").textContent=state.weekStart?
 "Zyklus-Montag "+fmtDate(state.weekStart)+" · 52 Wochen / 364 Tage · nach jedem Durchlauf erneut":
 "Start-Montag nicht festgelegt · kein erfundenes Unterrichtsdatum";
}
function download(filename,content){
 const blob=new Blob([content],{type:"application/json;charset=utf-8"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.download=filename;a.href=url;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3500);
}
function exportData(){
 download("dar-kids-test-arbeitsstand.json",JSON.stringify({...state,exportedAt:now()},null,2));
 notice("Lokale Testdaten als JSON gesichert. Keine Veröffentlichung ausgelöst.");
}
function importData(file){
 if(!file)return;
 if(file.size>512*1024){notice("Die Datei ist zu groß; maximal 512 KB.",true);return}
 file.text().then(text=>{
   const raw=JSON.parse(text);
   if(raw?.schema!==ID||raw.version!==VERSION)throw Error("Keine gültige KIDS-TEST-Arbeitsstanddatei");
   const normalized=normalize(raw);
   if(!confirm("Lokale Testnotizen auf DIESEM Gerät durch die importierte Sicherung ersetzen? Es wird nichts veröffentlicht."))return;
   state=normalized;state.updatedAt=now();
   if(safeStore()){renderInputs();notice("Arbeitsstand lokal importiert. Keine GitHub- oder Besucheränderung.");}
 }).catch(e=>notice("Import fehlgeschlagen: "+e.message,true));
}
function renderInputs(){
 setInput("testAge",state.selection.age);setInput("testProfile",state.selection.profile);setInput("testModule",state.selection.module);
 setInput("cycleMonday",state.weekStart);
 renderUpcoming();renderSummary();chooseModule();
 if(chosen)assignSlot(chosen,false);
}
function wire(){
 readStore();
 const list=$("studioSlot");
 for(const e of slots){const op=document.createElement("option");op.value=String(e.slot);op.textContent="#"+e.slot+" · W"+e.week+" · "+(e.title||"Noch offen");list.appendChild(op)}
 $("studioSave").addEventListener("click",saveCourse);
 $("studioDiscard").addEventListener("click",removeCourse);
 $("studioSlot").addEventListener("change",e=>assignSlot(e.target.value));
 $("studioExport").addEventListener("click",exportData);
 $("studioImport").addEventListener("change",e=>{importData(e.target.files?.[0]);e.target.value=""});
 $("studioClear").addEventListener("click",()=>{
   if(!confirm("ALLE lokalen KIDS-TEST-Einstellungen, Prüfnotizen und Entwürfe auf diesem Gerät löschen? Unumkehrbar ohne Export."))return;
   state=initial();chosen=null;localStorage.removeItem(STORAGE_KEY);renderInputs();assignSlot(1,false);notice("Nur die lokalen KIDS-TEST-Daten wurden gelöscht.");
 });
 $("studioProfileSave").addEventListener("click",()=>{prefsChanged();renderUpcoming()});
 $("moduleChoose").addEventListener("change",chooseModule);
 $("moduleSave").addEventListener("click",saveModule);
 document.getElementById("cards").addEventListener("click",e=>{
   const b=e.target.closest("button[data-test-slot]");
   if(!b)return;
   const slot=Number(b.getAttribute("data-test-slot"));
   const item=slots.find(x=>x.slot===slot);
   if(item?.catalogued&&item.id){
     location.assign("/kids/akademie/?lektion="+encodeURIComponent(item.id)+"&editor=1");
   }else{
     assignSlot(slot); // Unwritten curriculum slots remain local planning only.
   }
 });
 renderInputs();assignSlot(1);
}
fetch("/kids/test-console/catalogue-v1.json",{cache:"no-store",credentials:"omit"})
.then(r=>{if(!r.ok)throw Error("Katalog HTTP "+r.status);return r.json()})
.then(data=>{
 if(data.weeks!==52||data.entries?.length!==208||data.entries.filter(e=>e.catalogued).length!==38)throw Error("Der Unterrichtskatalog ist unvollständig");
 slots=data.entries;
 wire();
})
.catch(e=>notice("Redaktionsstudio konnte nicht starten: "+e.message,true));
if("serviceWorker" in navigator && location.protocol==="https:"){
 navigator.serviceWorker.register("/kids/test-console/sw.js",{scope:"/kids/test-console/"})
 .catch(()=>{});
}
})();