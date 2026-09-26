(() => {
"use strict";

const WORKER_DEFAULT="https://dar-admin-publisher.sero91ak.workers.dev";
const WORKER_URL_KEY="darAdminWorkerPublishUrlV1";
const WORKER_SECRET_KEY="darAdminWorkerSecretV1";
const STUDIO_DRAFT_KEY="darVoiceContentStudioDraftV1";

let studioKind="story";
let contentId="";
let savedRevision=0;
let stagingPublished=false;
let coverFile=null;
let coverRemoteUrl="";
let coverAsset=null;
let audioAsset=null;
let contentStatus="draft";
let productionPhase="draft";
let productionError="";
let quizDraft=[];
let gameDraft={type:"choice",summary:"",instructions:"",voiceCues:[]};
let busy=false;

function q(id){return document.getElementById(id)}
function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
function workerBase(){
  try{return String(localStorage.getItem(WORKER_URL_KEY)||WORKER_DEFAULT).replace(/\/publish\/?$/,"").replace(/\/$/,"")}
  catch{return WORKER_DEFAULT}
}
function workerSecret(){
  try{return String(localStorage.getItem(WORKER_SECRET_KEY)||"").trim()}catch{return""}
}
function apiHeaders(){
  const h={"Content-Type":"application/json",Accept:"application/json"};
  const sec=workerSecret();
  if(sec)h["X-Admin-Secret"]=sec;
  return h;
}
async function adminApi(path,opt={}){
  const res=await fetch(workerBase()+path,{
    cache:"no-store",credentials:"omit",...opt,
    headers:{...apiHeaders(),...(opt.headers||{})}
  });
  const data=await res.json().catch(()=>({}));
  if(!res.ok||data?.ok===false)throw Error(data?.error||("Studio API "+res.status));
  return data;
}
function setStudioMessage(msg,type=""){
  const el=q("csMessage"); if(!el)return;
  el.textContent=msg||"";
  el.className="cs-message "+(type||"");
}
function statusLabel(){
  if(productionPhase==="producing")return"Produktion läuft";
  if(productionPhase==="awaiting-qa")return"QA erforderlich";
  if(productionPhase==="ready")return"Bereit";
  if(productionPhase==="test-published")return"Test veröffentlicht";
  if(productionPhase==="live-published")return"Live veröffentlicht";
  if(productionPhase==="error")return"Fehler";
  if(contentStatus==="published"&&stagingPublished)return"Test veröffentlicht";
  if(contentStatus==="review")return"Prüfung";
  if(contentStatus==="published")return"Veröffentlicht";
  return"Entwurf";
}
function renderStatus(){
  const el=q("csStatus"); if(!el)return;
  el.textContent=statusLabel();
  el.dataset.status=contentStatus;
  const live=q("csPublishLive");
  if(live)live.disabled=busy||!stagingPublished;
}
function injectStyles(){
  const st=document.createElement("style");
  st.id="contentStudioStyles";
  st.textContent=`
  .content-studio-nav{display:flex;align-items:center;gap:7px;padding:8px 4px 13px;overflow-x:auto;scrollbar-width:none}
  .content-studio-nav::-webkit-scrollbar{display:none}
  .cs-tab{border:1px solid var(--line);background:rgba(255,255,255,.035);color:#aab9bd;border-radius:10px;padding:9px 12px;font-size:11px;font-weight:800;white-space:nowrap;cursor:pointer}
  .cs-tab.active{border-color:rgba(217,182,111,.42);background:rgba(217,182,111,.09);color:#f1d59a}
  .cs-meta{margin:0 0 14px;padding:14px;border:1px solid var(--line);border-radius:14px;background:rgba(255,255,255,.025)}
  .cs-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}
  .cs-field{min-width:0}.cs-field.span2{grid-column:span 2}.cs-field.span4{grid-column:1/-1}
  .cs-field label{display:block;color:#81969b;font-size:9px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;margin:0 0 5px}
  .cs-field input,.cs-field select,.cs-field textarea{width:100%;border:1px solid var(--line);background:rgba(1,14,19,.62);color:#e9eeee;border-radius:9px;padding:9px 10px;min-height:38px;outline:none}
  .cs-field textarea{height:62px;min-height:62px;resize:vertical;line-height:1.4}
  .cs-modes{display:flex;gap:12px;align-items:center;min-height:38px}.cs-modes label{display:flex;gap:6px;align-items:center;margin:0;text-transform:none;letter-spacing:0;font-size:11px;color:#c6d2d4}.cs-modes input{width:auto;min-height:0}
  .cs-publish{display:grid;gap:9px}.cs-status-row{display:flex;align-items:center;justify-content:space-between;gap:10px}
  .cs-status{font-size:10px;font-weight:900;padding:6px 9px;border-radius:999px;border:1px solid var(--line);color:#bdc9cc}.cs-status[data-status="review"]{color:#f0d29a;border-color:rgba(217,182,111,.3)}.cs-status[data-status="published"]{color:#a9ddc6;border-color:rgba(121,190,160,.3)}
  .cs-cover{position:relative;aspect-ratio:4/5;border:1px dashed rgba(217,182,111,.28);border-radius:14px;overflow:hidden;background:linear-gradient(145deg,#0b242c,#102c34);display:grid;place-items:center;cursor:pointer}
  .cs-cover.drag{border-color:#e2c47d;background:#173138}.cs-cover img{width:100%;height:100%;object-fit:cover;display:block}.cs-cover .empty{padding:18px;text-align:center;color:#7f969a;font-size:11px;line-height:1.5}
  .cs-cover-overlay{position:absolute;inset:auto 0 0;padding:14px 12px 11px;background:linear-gradient(transparent,rgba(1,10,15,.86));pointer-events:none}.cs-cover-overlay b{display:block;color:#fff;font:700 17px Georgia,serif;line-height:1.14}.cs-cover-overlay span{font-size:9px;color:#efd78e;font-weight:800}
  .cs-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px}.cs-actions .btn{min-height:40px;font-size:11px}
  .cs-message{min-height:18px;font-size:10px;line-height:1.45;color:#93a7aa}.cs-message.good{color:#9bd8ba}.cs-message.warn{color:#f1c77c}.cs-message.bad{color:#ef9d9d}
  .cs-qa{display:grid;gap:6px}.cs-check{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:10px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.05)}.cs-check:last-child{border:0}.cs-check b{font-size:10px}
  .cs-library{display:grid;gap:6px;max-height:180px;overflow:auto}.cs-item{border:1px solid var(--line);border-radius:9px;padding:8px;background:rgba(255,255,255,.025);cursor:pointer}.cs-item b{display:block;font-size:11px}.cs-item small{font-size:9px;color:#7f9499}
  .cs-disabled-pane{padding:20px;border:1px solid var(--line);border-radius:14px;background:rgba(255,255,255,.025);color:#879a9e;font-size:12px;line-height:1.6}
  .cs-structured{margin:0 0 14px;padding:14px;border:1px solid var(--line);border-radius:14px;background:rgba(255,255,255,.018)}
  .cs-structured[hidden]{display:none}.cs-structured h3{margin:0 0 10px;font-size:13px;color:#f0d59a}
  .cs-question{padding:12px;border:1px solid rgba(255,255,255,.07);border-radius:12px;background:rgba(0,0,0,.12);margin:8px 0}
  .cs-question-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}.cs-question-head b{font-size:11px}.cs-question-head button{border:0;background:transparent;color:#df8686;cursor:pointer;font-size:11px}
  .cs-answer-grid,.cs-inline-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.cs-add{width:100%;margin-top:8px}
  @media(max-width:900px){.cs-grid{grid-template-columns:1fr 1fr}.cs-field.span4{grid-column:1/-1}}
  @media(max-width:600px){.cs-grid{grid-template-columns:1fr}.cs-field.span2,.cs-field.span4{grid-column:1}.cs-actions{grid-template-columns:1fr}}
  `;
  document.head.appendChild(st);
}
function navHtml(){
  return `<nav class="content-studio-nav" aria-label="Studio Bereiche">
    <button class="cs-tab active" data-cs-kind="story">Kids · Geschichten</button>
    <button class="cs-tab" data-cs-kind="quiz">Kids · Quiz</button>
    <button class="cs-tab" data-cs-kind="game">Kids · Spiele</button>
    <button class="cs-tab" data-cs-kind="ios">iOS · Inhalte</button>
  </nav>`;
}
function metaHtml(){
  return `<section id="csMeta" class="cs-meta">
    <div class="cs-grid">
      <div class="cs-field span2"><label for="csTitle">Titel</label><input id="csTitle" placeholder="z. B. Nūḥ und das Schiff"></div>
      <div class="cs-field"><label for="csCategory">Kategorie</label><input id="csCategory" value="Qurʾān · geprüft"></div>
      <div class="cs-field"><label for="csTopic">Thema</label><input id="csTopic" placeholder="Propheten · Tawḥīd"></div>
      <div class="cs-field"><label for="csProphet">Prophet / Person</label><input id="csProphet" placeholder="z. B. nuh"></div>
      <div class="cs-field"><label for="csAgeMin">Alter von</label><select id="csAgeMin"><option>4</option><option>5</option><option selected>6</option><option>7</option><option>8</option><option>9</option><option>10</option></select></div>
      <div class="cs-field"><label for="csAgeMax">Alter bis</label><select id="csAgeMax"><option>4</option><option>5</option><option>6</option><option>7</option><option>8</option><option>9</option><option selected>10</option></select></div>
      <div class="cs-field"><label>Modus</label><div class="cs-modes"><label><input id="csModeRead" type="checkbox" checked> Lesen</label><label><input id="csModeListen" type="checkbox" checked> Hören</label></div></div>
      <div class="cs-field span4"><label for="csSources">Quellen / Nachweise</label><textarea id="csSources" placeholder="Eine Quelle pro Zeile, z. B. Qurʾān 11:36–44"></textarea></div>
    </div>
  </section>\n  <section id="csStructured" class="cs-structured" hidden><div id="csStructuredBody"></div></section>`;\n}\nfunction publishHtml(){
  return `<section id="csPublishSection" class="side-section">
    <div class="side-title">Content Studio · Kids</div>
    <div class="cs-status-row"><span class="notice">Produktionspaket</span><span id="csStatus" class="cs-status" data-status="draft">Entwurf</span></div>
    <div id="csCover" class="cs-cover" tabindex="0">
      <div class="empty"><b>Cover</b><br>Bild hier hineinziehen<br>oder automatisch erzeugen</div>
      <div class="cs-cover-overlay"><span>DĀR AL TAWḤĪD Kids</span><b id="csCoverTitle">Neue Geschichte</b></div>
    </div>
    <input id="csCoverFile" type="file" accept="image/png,image/jpeg,image/webp,image/avif" hidden>
    <div class="cs-actions" style="margin-top:8px">
      <button id="csCoverGenerate" class="btn secondary" type="button">Cover erzeugen</button>
      <button id="csCoverChoose" class="btn quiet" type="button">Bild hineinladen</button>
    </div>
    <div class="cs-actions" style="margin-top:7px">
      <button id="csProduce" class="btn primary" type="button">Audio + Cover vorbereiten</button>
      <button id="csSave" class="btn secondary" type="button">Entwurf speichern</button>
    </div>
    <div class="cs-qa" style="margin-top:9px">
      <div class="cs-check"><span>Text</span><b id="csQaText" class="warn">fehlt</b></div>
      <div class="cs-check"><span>Serhat-Audio</span><b id="csQaAudio" class="warn">fehlt</b></div>
      <div class="cs-check"><span>Aussprache</span><b id="csQaPron" class="warn">offen</b></div>
      <div class="cs-check"><span>Cover</span><b id="csQaCover" class="warn">fehlt</b></div>
    </div>
    <div class="cs-actions" style="margin-top:9px">
      <button id="csPublishTest" class="btn primary" type="button">In Test-Kids veröffentlichen</button>
      <button id="csPublishLive" class="btn secondary" type="button" disabled>Live veröffentlichen</button>
    </div>
    <details style="margin-top:9px">
      <summary>Admin-Verbindung</summary>
      <div class="advanced">
        <label for="csWorkerUrl">Worker</label><input id="csWorkerUrl">
        <label for="csSecret" style="margin-top:8px">Admin-Secret</label><input id="csSecret" type="password" autocomplete="off">
        <button id="csSaveConnection" class="btn quiet" type="button" style="width:100%;margin-top:8px">Verbindung lokal speichern</button>
      </div>
    </details>
    <div id="csMessage" class="cs-message"></div>
  </section>
  <section id="csLibrarySection" class="side-section">
    <div class="side-title">Studio-Bibliothek</div>
    <div id="csLibrary" class="cs-library"><div class="notice">Staging-Inhalte werden geladen …</div></div>
  </section>`;
}
function mount(){
  if(q("csMeta"))return;
  injectStyles();
  const top=document.querySelector(".topbar");
  if(top)top.insertAdjacentHTML("afterend",navHtml());
  const heading=document.querySelector(".editor-panel .heading-row");
  if(heading)heading.insertAdjacentHTML("afterend",metaHtml());
  const oldKids=[...document.querySelectorAll(".side-section")].find(x=>x.querySelector(".side-title")?.textContent.trim()==="Kids-App");
  if(oldKids)oldKids.outerHTML=publishHtml(); else document.querySelector(".side-panel")?.insertAdjacentHTML("beforeend",publishHtml());

  q("csWorkerUrl").value=workerBase();
  q("csSecret").value=workerSecret();
  bind();
  restoreDraft();
  renderKindEditor();
  renderStatus();
  refreshQa();
  loadLibrary();
}
function bind(){
  document.querySelectorAll("[data-cs-kind]").forEach(btn=>btn.addEventListener("click",()=>switchKind(btn.dataset.csKind)));
  q("csTitle")?.addEventListener("input",()=>{q("csCoverTitle").textContent=q("csTitle").value||"Neue Geschichte";persistDraft();refreshQa()});
  ["csCategory","csTopic","csProphet","csAgeMin","csAgeMax","csModeRead","csModeListen","csSources"].forEach(id=>q(id)?.addEventListener("change",persistDraft));
  q("text")?.addEventListener("input",()=>{persistDraft();refreshQa()});
  q("csCoverChoose")?.addEventListener("click",()=>q("csCoverFile").click());
  q("csCoverFile")?.addEventListener("change",e=>handleCoverFile(e.target.files?.[0]));
  q("csCover")?.addEventListener("click",()=>q("csCoverFile").click());
  q("csCover")?.addEventListener("dragover",e=>{e.preventDefault();q("csCover").classList.add("drag")});
  q("csCover")?.addEventListener("dragleave",()=>q("csCover").classList.remove("drag"));
  q("csCover")?.addEventListener("drop",e=>{e.preventDefault();q("csCover").classList.remove("drag");handleCoverFile(e.dataTransfer?.files?.[0])});
  q("csCoverGenerate")?.addEventListener("click",generateCover);
  q("csProduce")?.addEventListener("click",produce);
  q("csSave")?.addEventListener("click",()=>saveDraftRemote(false));
  q("csPublishTest")?.addEventListener("click",publishTest);
  q("csPublishLive")?.addEventListener("click",publishLive);
  q("csSaveConnection")?.addEventListener("click",saveConnection);
  document.addEventListener("click",e=>{
    const item=e.target.closest?.("[data-cs-item]");
    if(item)loadRemoteItem(item.dataset.csItem);
  });
  setInterval(refreshQa,1200);
}
function switchKind(kind){
  studioKind=kind||"story";
  document.querySelectorAll("[data-cs-kind]").forEach(x=>x.classList.toggle("active",x.dataset.csKind===studioKind));
  const story=studioKind==="story";
  const ios=studioKind==="ios";
  q("csMeta").hidden=ios;
  q("csPublishSection").hidden=ios;
  q("csLibrarySection").hidden=ios;
  const title=document.querySelector(".editor-panel h1");
  const lead=document.querySelector(".editor-panel .lead");
  if(story){
    title.textContent="Kids-Geschichte produzieren";
    lead.textContent="Text, Serhat-Stimme, Cover und Altersfreigabe als ein Paket produzieren und direkt in die Kids-App veröffentlichen.";
    q("styleMode").value="kids_story";
  }else if(studioKind==="quiz"){
    title.textContent="Kids-Quiz produzieren";
    lead.textContent="Fragen, Antworten und Serhat-Sprachbausteine werden getrennt von Geschichten verwaltet.";
    q("csCategory").value="Quiz · geprüft";
    q("styleMode").value="kids_lesson";
  }else if(studioKind==="game"){
    title.textContent="Kids-Spiel produzieren";
    lead.textContent="Spielinhalte und wiederverwendbare Serhat-Sprachbausteine werden als eigenes Content-Paket verwaltet.";
    q("csCategory").value="Spiel";
    q("styleMode").value="kids_lesson";
  }else{
    title.textContent="iOS Content Studio";
    lead.textContent="Der gleiche Paketstandard ist für die offizielle iOS-App vorbereitet. Live-Anbindung folgt nach dem Kids-Staging-Test.";
  }
  contentId="";savedRevision=0;stagingPublished=false;contentStatus="draft";renderStatus();refreshQa();loadLibrary();
}
function saveConnection(){
  try{
    localStorage.setItem(WORKER_URL_KEY,String(q("csWorkerUrl").value||WORKER_DEFAULT).trim());
    localStorage.setItem(WORKER_SECRET_KEY,String(q("csSecret").value||"").trim());
  }catch{}
  setStudioMessage("Admin-Verbindung lokal gespeichert.","good");
  loadLibrary();
}
function fields(){
  const text=String(q("text")?.value||"").trim();
  return{
    id:contentId,
    kind:studioKind,
    appTarget:"kids",
    status:contentStatus,
    title:String(q("csTitle")?.value||"").trim(),
    category:String(q("csCategory")?.value||"").trim(),
    topic:String(q("csTopic")?.value||"").trim(),
    prophetId:String(q("csProphet")?.value||"").trim(),
    ageMin:Number(q("csAgeMin")?.value||4),
    ageMax:Number(q("csAgeMax")?.value||10),
    modes:{read:!!q("csModeRead")?.checked,listen:!!q("csModeListen")?.checked},
    text,
    sourceRefs:String(q("csSources")?.value||"").split(/\n+/).map(x=>x.trim()).filter(Boolean),
    cover:coverAsset||{},
    audio:audioAsset||{},
    verification:"studio-review",
    qa:{
      text:!!text,
      cover:!!coverAsset?.url,
      audio:!q("csModeListen")?.checked||!!audioAsset?.url,
      pronunciation:!q("csModeListen")?.checked||Boolean(qaConfirmed),
      source:true
    },
    push:{enabled:true}
  };
}
function persistDraft(){
  try{
    localStorage.setItem(STUDIO_DRAFT_KEY,JSON.stringify({
      kind:studioKind,title:q("csTitle")?.value||"",category:q("csCategory")?.value||"",
      topic:q("csTopic")?.value||"",prophetId:q("csProphet")?.value||"",
      ageMin:q("csAgeMin")?.value||"6",ageMax:q("csAgeMax")?.value||"10",
      read:q("csModeRead")?.checked!==false,listen:q("csModeListen")?.checked!==false,
      sources:q("csSources")?.value||""
    }));
  }catch{}
}
function restoreDraft(){
  try{
    const d=JSON.parse(localStorage.getItem(STUDIO_DRAFT_KEY)||"null");if(!d)return;
    q("csTitle").value=d.title||"";q("csCategory").value=d.category||"Qurʾān · geprüft";
    q("csTopic").value=d.topic||"";q("csProphet").value=d.prophetId||"";
    q("csAgeMin").value=d.ageMin||"6";q("csAgeMax").value=d.ageMax||"10";
    q("csModeRead").checked=d.read!==false;q("csModeListen").checked=d.listen!==false;
    q("csSources").value=d.sources||"";q("csCoverTitle").textContent=d.title||"Neue Geschichte";
  }catch{}
}
function handleCoverFile(file){
  if(!file)return;
  if(!/^image\/(png|jpeg|webp|avif)$/i.test(file.type)){setStudioMessage("Bitte PNG, JPEG, WEBP oder AVIF verwenden.","bad");return}
  if(file.size>12*1024*1024){setStudioMessage("Cover ist größer als 12 MB.","bad");return}
  coverFile=file;coverRemoteUrl="";coverAsset=null;
  const url=URL.createObjectURL(file);renderCover(url);
  setStudioMessage("Cover übernommen. Beim Speichern wird es versioniert hochgeladen.","good");refreshQa();
}
function renderCover(url){
  const box=q("csCover"); if(!box)return;
  box.querySelector("img")?.remove();
  const img=document.createElement("img");img.src=url;img.alt="Cover Vorschau";box.prepend(img);
}
async function generateCover(){
  if(busy)return;
  if(!workerSecret()){setStudioMessage("Admin-Verbindung fehlt. Unter „Admin-Verbindung“ Secret eintragen.","warn");return}
  const f=fields();
  if(!f.title&&!f.topic&&!f.text){setStudioMessage("Für ein Cover zuerst Titel oder Text eingeben.","warn");return}
  q("csCoverGenerate").disabled=true;q("csCoverGenerate").textContent="Cover wird erzeugt …";
  try{
    const d=await adminApi("/api/admin/kids-content/cover/generate",{method:"POST",body:JSON.stringify(f)});
    coverRemoteUrl=d.cover?.url||"";coverFile=null;coverAsset=null;
    if(!coverRemoteUrl)throw Error("Cover-URL fehlt");
    renderCover(coverRemoteUrl);
    setStudioMessage("Kids-Cover erzeugt. Propheten-/Historienregeln wurden im Prompt erzwungen.","good");
  }catch(e){setStudioMessage(e.message||String(e),"bad")}
  finally{q("csCoverGenerate").disabled=false;q("csCoverGenerate").textContent="Cover erzeugen";refreshQa()}
}
async function produce(){
  if(busy)return;
  busy=true;setStudioMessage("Produktion läuft: Stimme und Cover werden parallel vorbereitet …","warn");
  try{
    const tasks=[];
    const text=String(q("text")?.value||"").trim();
    if(!text)throw Error("Geschichtentext fehlt.");
    if(!lastAudio||lastGeneratedText!==text)tasks.push(generate());
    if(!coverFile&&!coverRemoteUrl&&!coverAsset&&workerSecret())tasks.push(generateCover());
    await Promise.all(tasks);
    setStudioMessage("Produktion vorbereitet. Audio anhören, Aussprache bestätigen und dann Test veröffentlichen.","good");
  }catch(e){setStudioMessage(e.message||String(e),"bad")}
  finally{busy=false;refreshQa()}
}
async function ensureId(){
  if(contentId)return contentId;
  if(!workerSecret())throw Error("Admin-Verbindung fehlt.");
  const d=await adminApi("/api/admin/kids-content/id",{method:"POST",body:JSON.stringify({kind:studioKind,title:q("csTitle")?.value||""})});
  contentId=d.id||"";if(!contentId)throw Error("Content-ID konnte nicht erstellt werden.");
  return contentId;
}
function blobToDataUrl(blob){
  return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||""));r.onerror=()=>reject(r.error||Error("Datei konnte nicht gelesen werden"));r.readAsDataURL(blob)});
}
async function uploadCover(){
  if(coverAsset?.url)return coverAsset;
  const id=await ensureId();
  let body=null;
  if(coverFile)body={id,role:"cover",staging:true,dataUrl:await blobToDataUrl(coverFile),originalName:coverFile.name,source:"studio-drop"};
  else if(coverRemoteUrl)body={id,role:"cover",staging:true,remoteUrl:coverRemoteUrl,source:"studio-generated"};
  else throw Error("Cover fehlt.");
  const d=await adminApi("/api/admin/kids-content/media",{method:"POST",body:JSON.stringify(body)});
  coverAsset=d.asset;renderCover(coverAsset.url);return coverAsset;
}
async function compactAudioBlob(){
  if(!lastAudio||lastGeneratedText!==String(q("text")?.value||"").trim())throw Error("Finale Audio für diesen Text fehlt.");
  if(!qaConfirmed)throw Error("Aussprache zuerst bestätigen.");
  const r=await localRequest("/publish-audio",{method:"GET"});
  if(!r.ok){const d=await r.json().catch(()=>({}));throw Error(d.error||"App-Audio konnte nicht vorbereitet werden.")}
  return await r.blob();
}
async function uploadAudio(){
  if(audioAsset?.url&&lastGeneratedText===String(q("text")?.value||"").trim())return audioAsset;
  const id=await ensureId();
  const blob=await compactAudioBlob();
  const d=await adminApi("/api/admin/kids-content/media",{method:"POST",body:JSON.stringify({
    id,role:"audio",staging:true,dataUrl:await blobToDataUrl(blob),originalName:"serhat-story.m4a",source:"serhat-mlx-master"
  })});
  audioAsset={...d.asset,codec:"aac-72k-mono"};
  try{audioAsset.durationSec=await getAudioDuration(blob)}catch{}
  return audioAsset;
}
function getAudioDuration(blob){
  return new Promise((resolve,reject)=>{
    const a=document.createElement("audio"),u=URL.createObjectURL(blob);
    a.preload="metadata";a.onloadedmetadata=()=>{const d=Number(a.duration||0);URL.revokeObjectURL(u);resolve(d)};
    a.onerror=()=>{URL.revokeObjectURL(u);reject(Error("Audio-Metadaten fehlen"))};a.src=u;
  });
}
async function prepareAssets(){
  const f=fields();
  const jobs=[];
  if(!coverAsset?.url)jobs.push(uploadCover());
  if(f.modes.listen&&!audioAsset?.url)jobs.push(uploadAudio());
  await Promise.all(jobs);
}
async function saveDraftRemote(withAssets){
  if(busy)return null;
  busy=true;contentStatus="draft";renderStatus();
  try{
    await ensureId();
    if(withAssets)await prepareAssets();
    const payload={...fields(),id:contentId,staging:true,status:"draft"};
    const d=await adminApi("/api/admin/kids-content/save",{method:"POST",body:JSON.stringify(payload)});
    savedRevision=d.item?.revision||savedRevision;contentStatus=d.item?.status||"draft";renderStatus();
    setStudioMessage("Entwurf sicher im Staging gespeichert.","good");await loadLibrary();return d.item;
  }catch(e){setStudioMessage(e.message||String(e),"bad");throw e}
  finally{busy=false;refreshQa()}
}
async function publishTest(){
  if(busy)return;
  busy=true;contentStatus="review";renderStatus();
  try{
    await ensureId();
    await prepareAssets();
    const payload={...fields(),id:contentId,staging:true,status:"review"};
    const saved=await adminApi("/api/admin/kids-content/save",{method:"POST",body:JSON.stringify(payload)});
    savedRevision=saved.item?.revision||0;
    const pub=await adminApi("/api/admin/kids-content/publish",{method:"POST",body:JSON.stringify({id:contentId,live:false,sendPush:false})});
    contentStatus="published";stagingPublished=true;renderStatus();
    setStudioMessage("In Test-Kids veröffentlicht. Kein Besucher-Push wurde gesendet.","good");await loadLibrary();
    return pub;
  }catch(e){contentStatus="draft";renderStatus();setStudioMessage(e.message||String(e),"bad")}
  finally{busy=false;refreshQa()}
}
async function publishLive(){
  if(busy||!stagingPublished)return;
  if(!confirm("Diese geprüfte Version jetzt LIVE in Kids veröffentlichen und den passenden Kids-Push senden?"))return;
  busy=true;renderStatus();
  try{
    const pub=await adminApi("/api/admin/kids-content/publish",{method:"POST",body:JSON.stringify({id:contentId,live:true,sendPush:true,triggerDeploy:true})});
    contentStatus="published";renderStatus();
    const p=pub.push||{};
    setStudioMessage(p.sent?"Live veröffentlicht · Kids-Push gesendet.":"Live veröffentlicht · Push: "+(p.reason||"kein Empfänger"),p.sent?"good":"warn");
  }catch(e){setStudioMessage(e.message||String(e),"bad")}
  finally{busy=false;renderStatus();refreshQa()}
}
async function loadLibrary(){
  const box=q("csLibrary");if(!box||!workerSecret()){if(box)box.innerHTML='<div class="notice">Admin-Verbindung herstellen, um Staging-Inhalte zu laden.</div>';return}
  try{
    const d=await adminApi("/api/admin/kids-content?staging=1",{method:"GET"});
    const items=(d.index?.items||[]).filter(x=>x.kind===studioKind).slice(0,30);
    box.innerHTML=items.length?items.map(x=>`<button class="cs-item" data-cs-item="${escapeHtml(x.id)}"><b>${escapeHtml(x.title||x.id)}</b><small>${escapeHtml(x.status)} · r${Number(x.revision||1)} · ${Number(x.ageMin)}–${Number(x.ageMax)} J.</small></button>`).join(""):'<div class="notice">Noch keine Inhalte in diesem Bereich.</div>';
  }catch(e){box.innerHTML='<div class="notice">Staging-Bibliothek nicht erreichbar: '+escapeHtml(e.message||String(e))+'</div>'}
}
async function loadRemoteItem(id){
  try{
    const d=await adminApi("/api/admin/kids-content?staging=1",{method:"GET"});
    const x=(d.index?.items||[]).find(i=>i.id===id);if(!x)return;
    studioKind=x.kind||"story";contentId=x.id;savedRevision=x.revision||0;contentStatus=x.status||"draft";stagingPublished=x.status==="published";
    document.querySelectorAll("[data-cs-kind]").forEach(b=>b.classList.toggle("active",b.dataset.csKind===studioKind));
    q("csTitle").value=x.title||"";q("csCategory").value=x.category||"";q("csTopic").value=x.topic||"";q("csProphet").value=x.prophetId||"";
    q("csAgeMin").value=String(x.ageMin||4);q("csAgeMax").value=String(x.ageMax||10);q("csModeRead").checked=x.modes?.read!==false;q("csModeListen").checked=x.modes?.listen!==false;
    q("csSources").value=(x.sourceRefs||[]).join("\n");q("text").value=x.text||"";coverAsset=x.cover?.url?x.cover:null;audioAsset=x.audio?.url?x.audio:null;
    coverFile=null;coverRemoteUrl="";if(coverAsset?.url)renderCover(coverAsset.url);q("csCoverTitle").textContent=x.title||"Geschichte";
    if(typeof renderAnalysis==="function")renderAnalysis();renderStatus();refreshQa();setStudioMessage("Staging-Paket geladen.","good");
  }catch(e){setStudioMessage(e.message||String(e),"bad")}
}
function refreshQa(){
  if(!q("csQaText"))return;
  const text=String(q("text")?.value||"").trim(),same=!!lastAudio&&lastGeneratedText===text;
  const cover=!!(coverFile||coverRemoteUrl||coverAsset?.url);
  const audio=!q("csModeListen")?.checked||same||!!audioAsset?.url;
  const pron=!q("csModeListen")?.checked||Boolean(qaConfirmed&&same)||Boolean(audioAsset?.url&&contentId);
  paintQa("csQaText",!!text,text?"bereit":"fehlt");paintQa("csQaCover",cover,cover?"bereit":"fehlt");paintQa("csQaAudio",audio,audio?"bereit":"fehlt");paintQa("csQaPron",pron,pron?"bestätigt":"offen");
  const test=q("csPublishTest");if(test)test.disabled=busy||!text||!cover||!audio||!pron||!q("csTitle")?.value.trim();
  renderStatus();
}
function paintQa(id,ok,label){const el=q(id);if(!el)return;el.textContent=label;el.className=ok?"good":"warn"}

window.DarContentStudio={mount,fields,loadLibrary,publishTest,publishLive,generateCover};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();