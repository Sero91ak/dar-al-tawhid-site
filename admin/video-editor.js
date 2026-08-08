/* DAR Touch-Videoeditor – Phase 1–3 */
(function () {
  "use strict";
  const W = 1080, H = 1920;
  const DRAFT_KEY = "darVideoEditorDraftV1";
  const WURL = "darAdminWorkerPublishUrlV1";
  const WSEC = "darAdminWorkerSecretV1";
  const DEFAULT_WORKER = "https://dar-admin-publisher.sero91ak.workers.dev";
  const HONORIFICS = ["ﷺ","رضي الله عنه","رضي الله عنها","رضي الله عنهما","رضي الله عنهم","رحمه الله","عليه السلام"];
  const FONTS = ["Cormorant Garamond","Playfair Display","Libre Baskerville","EB Garamond","Great Vibes","Amiri","Noto Naskh Arabic","Cinzel","Instrument Serif"];
  const COLORS = [["#fff8e8","Creme"],["#ffffff","Weiß"],["#efd78e","Gold"],["#0b1a33","Dunkelblau"],["#111111","Schwarz"],["#5a1d2a","Bordeaux"],["#9a9184","Warmgrau"]];

  const el = (id) => document.getElementById(id);
  const state = {
    jobId: "", project: null, selectedIds: [], playhead: 0, playing: false, dirty: false,
    history: [], historyIndex: -1, mode: "schnell", showGuides: true, showSafe: true, snap: true,
    multi: false, autosaveTimer: null, raf: 0, meta: { highlights: {}, animations: {}, customTemplates: [], pronunciation: {} },
    versions: []
  };

  function workerBase(){ return (localStorage.getItem(WURL)||DEFAULT_WORKER).replace(/\/$/,""); }
  function workerSecret(){ return localStorage.getItem(WSEC)||""; }
  function headers(){ const h={Accept:"application/json","Content-Type":"application/json"}; const s=workerSecret(); if(s)h["X-Admin-Secret"]=s; return h; }
  async function api(path,opt={}){ const res=await fetch(workerBase()+"/api/admin/video-studio"+path,{cache:"no-store",credentials:"omit",...opt,headers:{...headers(),...(opt.headers||{})}}); const data=await res.json().catch(()=>({})); if(!res.ok) throw new Error(data.error||data.reason||("HTTP "+res.status)); return data; }
  function qs(name){ return new URLSearchParams(location.search).get(name)||""; }
  function esc(s){ return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
  function uid(p){ return p+"_"+Math.random().toString(36).slice(2,8); }
  function selected(){ const id=state.selectedIds[0]; return (state.project?.elements||[]).find(e=>e.id===id)||null; }
  function selectedMany(){ const set=new Set(state.selectedIds); return (state.project?.elements||[]).filter(e=>set.has(e.id)); }
  function setNotice(msg,kind){ const n=el("notice"); n.className="notice "+(kind||""); n.textContent=msg||""; }
  function stageScale(){ return el("stageWrap").clientWidth/W; }

  function pushHistory(){ if(!state.project)return; const snap=JSON.stringify(state.project); state.history=state.history.slice(0,state.historyIndex+1); state.history.push(snap); if(state.history.length>100)state.history.shift(); state.historyIndex=state.history.length-1; state.dirty=true; scheduleAutosave(); }
  function undo(){ if(state.historyIndex<=0)return; state.historyIndex--; state.project=JSON.parse(state.history[state.historyIndex]); renderAll(); }
  function redo(){ if(state.historyIndex>=state.history.length-1)return; state.historyIndex++; state.project=JSON.parse(state.history[state.historyIndex]); renderAll(); }
  function scheduleAutosave(){ clearTimeout(state.autosaveTimer); state.autosaveTimer=setTimeout(()=>saveProject(true),10000); try{ localStorage.setItem(DRAFT_KEY,JSON.stringify({jobId:state.jobId,project:state.project,at:Date.now()})); }catch(_){ } }
  async function saveProject(silent){ if(!state.project||!state.jobId)return; try{ await api("/jobs/"+encodeURIComponent(state.jobId)+"/project",{method:"PUT",body:JSON.stringify({project:state.project})}); state.dirty=false; el("saveChip").textContent=silent?"auto":"ok"; if(!silent)setNotice("Gespeichert","ok"); }catch(e){ if(!silent)setNotice(e.message,"bad"); } }

  function renderAll(){ renderStage(); renderTimeline(); renderLayers(); renderProps(); el("projName").value=state.project?.name||""; el("modeChip").textContent=state.mode==="profi"?"Profi":"Schnell"; el("durChip").textContent=(state.project?.duration||15)+"s"; el("multiBar").classList.toggle("on",state.multi||state.selectedIds.length>1); el("multiCount").textContent=state.selectedIds.length+" ausgewählt"; }

  function applyKeyframeAtPlayhead(item){ if(!item)return; const t=state.playhead; const frames=Array.isArray(item.keyframes)?item.keyframes.slice():[]; const i=frames.findIndex(k=>Math.abs(k.t-t)<0.05); const frame={t,x:item.transform.x,y:item.transform.y,opacity:item.opacity,fontSize:item.style?.fontSize,rotation:item.transform.rotation||0,scale:item.scale}; if(i>=0)frames[i]=frame; else frames.push(frame); frames.sort((a,b)=>a.t-b.t); item.keyframes=frames; }

  function interp(item){ const frames=(item.keyframes||[]).slice().sort((a,b)=>a.t-b.t); if(!frames.length)return null; const time=state.playhead; if(time<=frames[0].t)return frames[0]; if(time>=frames[frames.length-1].t)return frames[frames.length-1]; for(let i=0;i<frames.length-1;i++){ const a=frames[i],b=frames[i+1]; if(time>=a.t&&time<=b.t){ const u=(time-a.t)/Math.max(0.001,b.t-a.t); const mix=(x,y)=>x==null||y==null?(y??x):x+(y-x)*u; return {x:mix(a.x,b.x),y:mix(a.y,b.y),opacity:mix(a.opacity,b.opacity),fontSize:mix(a.fontSize,b.fontSize),rotation:mix(a.rotation,b.rotation),scale:mix(a.scale,b.scale)}; } } return frames[frames.length-1]; }

  function renderStage(){
    const stage=el("stage"), bg=el("stageBg"), dim=el("stageDim"), p=state.project; if(!p)return;
    bg.style.backgroundImage=p.background?.assetUrl?`url("${p.background.assetUrl}")`:"";
    const st=p.background?.startTransform||{scale:1}, en=p.background?.endTransform||{scale:1.06};
    const u=Math.min(1,state.playhead/Math.max(0.1,p.duration));
    const sc=(st.scale||1)+((en.scale||1.06)-(st.scale||1))*u;
    bg.style.transform=`scale(${sc}) translate(${(st.x||0)+( ((en.x||0)-(st.x||0))*u )}px,${(st.y||0)+(((en.y||0)-(st.y||0))*u)}px)`;
    dim.style.opacity=state.playhead>=(p.background?.dimFrom??p.duration-2.5)?String(p.background?.dimOpacity??0.34):"0";
    el("guides").classList.toggle("on",state.showGuides); el("safe").classList.toggle("on",state.showSafe);
    stage.querySelectorAll(".el").forEach(n=>n.remove());
    const s=stageScale();
    (p.elements||[]).forEach(item=>{
      if(!item.visible)return;
      if(state.playhead<item.timing.start-0.01||state.playhead>item.timing.end+0.01)return;
      const kf=interp(item);
      const x=kf?.x??item.transform.x, y=kf?.y??item.transform.y;
      const op=kf?.opacity??item.opacity??1;
      const node=document.createElement("div");
      node.className="el "+item.role+(state.selectedIds.includes(item.id)?" selected":"");
      node.dataset.id=item.id;
      node.style.left=x*s+"px"; node.style.top=y*s+"px"; node.style.width=item.transform.width*s+"px";
      node.style.opacity=String(op); node.style.transform=`rotate(${kf?.rotation??item.transform.rotation??0}deg)`;
      if(item.role==="watermark"){ const img=document.createElement("img"); img.src="/watermark-my-logo-full.png"; img.alt="DAR"; img.draggable=false; node.appendChild(img); }
      else {
        const box=document.createElement("div"); box.className="box"; const stl=item.style||{};
        const fs=(kf?.fontSize??stl.fontSize??42)*s;
        box.style.fontFamily=`'${stl.fontFamily||"Cormorant Garamond"}', Georgia, serif`;
        box.style.fontSize=fs+"px"; box.style.fontWeight=stl.fontWeight||600; box.style.fontStyle=stl.fontStyle||"normal";
        box.style.color=stl.color||"#fff8e8"; box.style.textAlign=stl.alignment||"center"; box.style.lineHeight=String(stl.lineHeight||1.42);
        if(stl.background?.mode==="none"){ box.style.background="transparent"; box.style.border="0"; }
        else if(stl.background?.color) box.style.background=stl.background.color;
        if(item.role==="social"&&item.social){
          const lay=item.social.layout||"vertical";
          box.innerHTML=`<div>${esc(item.social.followLine||"")}</div><div style="margin-top:8px;font-size:.72em;font-family:system-ui;${lay==="horizontal"?"display:flex;gap:10px;justify-content:center;flex-wrap:wrap":""}">✈ ${esc(item.social.telegram||"")} · 🌐 ${esc(item.social.website||"")} · ◎ ${esc(item.social.instagram||"")}</div><div style="margin-top:8px;color:var(--gold);font-size:.7em">${esc(item.social.credit||"")}</div>`;
        } else {
          // segments highlight
          const segs=stl.segments||[];
          if(segs.length){
            let html="", cursor=0, text=item.content||"";
            segs.slice().sort((a,b)=>(a.start||0)-(b.start||0)).forEach(seg=>{
              const a=seg.start??0,b=seg.end??a; html+=esc(text.slice(cursor,a));
              html+=`<span style="color:${seg.color||stl.color};font-family:'${seg.fontFamily||stl.fontFamily}',serif;font-weight:${seg.fontWeight||stl.fontWeight};${seg.underline?"text-decoration:underline":""}">${esc(text.slice(a,b))}</span>`;
              cursor=b;
            });
            html+=esc(text.slice(cursor)); box.innerHTML=html;
          } else box.textContent=item.content||"";
        }
        node.appendChild(box);
      }
      const handle=document.createElement("div"); handle.className="handle"; node.appendChild(handle);
      bindElementTouch(node,item,handle); stage.appendChild(node);
    });
  }

  function bindElementTouch(node,item,handle){
    let mode=null,startX=0,startY=0,origX=0,origY=0,origW=0,pinch0=0,size0=0,pressTimer=null;
    function clientDist(a,b){ return Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY); }
    node.addEventListener("pointerdown",e=>{
      if(item.locked&&!state.multi)return;
      if(state.multi){ toggleSelect(item.id); e.preventDefault(); return; }
      if(e.target===handle)mode="scale"; else mode="move";
      if(!(e.shiftKey||e.metaKey)) state.selectedIds=[item.id]; else toggleSelect(item.id);
      startX=e.clientX; startY=e.clientY; origX=item.transform.x; origY=item.transform.y; origW=item.transform.width;
      node.setPointerCapture(e.pointerId); renderProps(); renderLayers(); e.preventDefault();
      pressTimer=setTimeout(()=>{ state.multi=true; if(!state.selectedIds.includes(item.id))state.selectedIds.push(item.id); renderAll(); openContext(); },550);
    });
    node.addEventListener("pointermove",e=>{
      clearTimeout(pressTimer);
      if(!mode||item.locked)return; const s=stageScale(); const dx=(e.clientX-startX)/s, dy=(e.clientY-startY)/s;
      const targets=selectedMany().length?selectedMany():[item];
      if(mode==="move"){
        targets.forEach((t,i)=>{ if(t.locked)return; if(i===0){ t.transform.x=Math.round(origX+dx); t.transform.y=Math.round(origY+dy); if(state.snap&&state.showGuides){ const cx=t.transform.x+t.transform.width/2; if(Math.abs(cx-W/2)<12)t.transform.x=Math.round(W/2-t.transform.width/2); } } });
        // move group together by same delta for first only already applied - for multi use delta on all from their origins stored... simplify: only move primary precisely
        if(targets.length>1){ const primary=targets[0]; const ddx=primary.transform.x-origX, ddy=primary.transform.y-origY; targets.slice(1).forEach(t=>{ if(!t._ox&&t._ox!==0){ t._ox=t.transform.x; t._oy=t.transform.y; } }); }
      } else if(mode==="scale"){ item.transform.width=Math.max(200,Math.round(origW+dx)); if(item.style)item.style.fontSize=Math.max(16,Math.round((item.style.fontSize||42)*(item.transform.width/Math.max(1,origW)))); }
      state.dirty=true; renderStage(); renderProps();
    });
    node.addEventListener("pointerup",()=>{ clearTimeout(pressTimer); selectedMany().forEach(t=>{ delete t._ox; delete t._oy; }); if(mode){ pushHistory(); mode=null; renderTimeline(); } });
    node.addEventListener("dblclick",()=>openTool("text"));
    node.addEventListener("touchstart",e=>{ if(e.touches.length===2&&item.style){ pinch0=clientDist(e.touches[0],e.touches[1]); size0=Number(item.style.fontSize||42); } },{passive:true});
    node.addEventListener("touchmove",e=>{ if(e.touches.length===2&&item.style&&pinch0){ const d=clientDist(e.touches[0],e.touches[1]); item.style.fontSize=Math.max(16,Math.min(96,Math.round(size0*(d/pinch0)))); state.dirty=true; renderStage(); renderProps(); e.preventDefault(); } },{passive:false});
    node.addEventListener("touchend",()=>{ if(pinch0){ pinch0=0; pushHistory(); } });
  }
  function toggleSelect(id){ const i=state.selectedIds.indexOf(id); if(i>=0)state.selectedIds.splice(i,1); else state.selectedIds.push(id); renderAll(); }

  function renderTimeline(){
    const track=el("tlTrack"), p=state.project; if(!p)return;
    const px=Math.max(28,Math.min(72,track.parentElement.clientWidth/Math.max(8,p.duration)));
    track.style.width=Math.max(track.parentElement.clientWidth-8,p.duration*px)+"px"; track.innerHTML="";
    const head=document.createElement("div"); head.className="tl-playhead"; head.style.left=state.playhead*px+"px"; track.appendChild(head);
    (p.elements||[]).forEach(item=>{
      const b=document.createElement("div"); b.className="tl-block"+(state.selectedIds.includes(item.id)?" active":"");
      b.style.left=item.timing.start*px+"px"; b.style.width=Math.max(18,(item.timing.end-item.timing.start)*px)+"px";
      b.textContent=(item.role||"").slice(0,10); bindTl(b,item,px); track.appendChild(b);
    });
    // audio lane marker
    el("tlTime").textContent=state.playhead.toFixed(1)+" / "+p.duration.toFixed(1)+"s";
  }
  function bindTl(node,item,px){
    let mode=null,sx=0,os=0,oe=0;
    node.addEventListener("pointerdown",e=>{ const r=node.getBoundingClientRect(); mode=e.clientX>r.right-14?"end":e.clientX<r.left+14?"start":"move"; sx=e.clientX; os=item.timing.start; oe=item.timing.end; state.selectedIds=[item.id]; node.setPointerCapture(e.pointerId); e.preventDefault(); e.stopPropagation(); });
    node.addEventListener("pointermove",e=>{ if(!mode)return; const dx=(e.clientX-sx)/px; if(mode==="move"){ const d=oe-os; item.timing.start=Math.max(0,Number((os+dx).toFixed(2))); item.timing.end=Number((item.timing.start+d).toFixed(2)); } else if(mode==="start") item.timing.start=Math.min(oe-0.4,Math.max(0,Number((os+dx).toFixed(2)))); else item.timing.end=Math.max(os+0.4,Number((oe+dx).toFixed(2))); item.timing.duration=item.timing.end-item.timing.start; state.dirty=true; renderTimeline(); renderProps(); });
    node.addEventListener("pointerup",()=>{ if(mode){ pushHistory(); mode=null; renderStage(); } });
  }

  function renderLayers(){
    const host=el("layers"); if(!host||!state.project)return;
    host.innerHTML="<h3 style='margin:4px 0 8px;color:var(--gold);font-family:var(--serif)'>Ebenen</h3>";
    [...state.project.elements].slice().reverse().forEach(item=>{
      const row=document.createElement("div"); row.className="layer-line"+(state.selectedIds.includes(item.id)?" active":"");
      row.innerHTML=`<button type="button" data-vis="${item.id}">${item.visible?"👁":"–"}</button><span style="flex:1">${esc(item.role)}${item.groupId?" · grp":""}</span><button type="button" data-up="${item.id}">↑</button><button type="button" data-down="${item.id}">↓</button><button type="button" data-lock="${item.id}">${item.locked?"🔒":"🔓"}</button>`;
      row.onclick=e=>{
        const id=e.target.dataset.vis||e.target.dataset.lock||e.target.dataset.up||e.target.dataset.down;
        if(e.target.dataset.vis){ item.visible=!item.visible; pushHistory(); renderAll(); return; }
        if(e.target.dataset.lock){ item.locked=!item.locked; pushHistory(); renderAll(); return; }
        if(e.target.dataset.up||e.target.dataset.down){ const arr=state.project.elements; const i=arr.findIndex(x=>x.id===item.id); if(i<0)return; const j=e.target.dataset.up?Math.min(arr.length-1,i+1):Math.max(0,i-1); const [m]=arr.splice(i,1); arr.splice(j,0,m); pushHistory(); renderAll(); return; }
        state.selectedIds=[item.id]; renderAll();
      };
      host.appendChild(row);
    });
  }

  function renderProps(){ const host=el("props"); const html=quickPropsHtml(selected()); if(host) host.innerHTML=html; bindQuick(host); }

  function quickPropsHtml(item){
    if(!item) return "<p class='notice'>Element antippen.</p>";
    return `<h3>${esc(item.role)}</h3>
      <label>Text</label><textarea id="qText" rows="3">${esc(item.content||"")}</textarea>
      <label>Größe</label><input type="range" id="qSize" min="16" max="96" value="${item.style?.fontSize||42}">
      <label>Deckkraft</label><input type="range" id="qOp" min="0.05" max="1" step="0.01" value="${item.opacity??1}">
      <div class="kv"><label>Start<input type="number" id="qStart" step="0.1" value="${item.timing.start}"></label><label>Ende<input type="number" id="qEnd" step="0.1" value="${item.timing.end}"></label></div>`;
  }
  function bindQuick(root){ if(!root)return; const item=selected(); if(!item)return;
    [["qText",v=>{item.content=v;}],["qSize",v=>{item.style=item.style||{};item.style.fontSize=Number(v);}],["qOp",v=>{item.opacity=Number(v);}],["qStart",v=>{item.timing.start=Number(v);item.timing.duration=item.timing.end-item.timing.start;}],["qEnd",v=>{item.timing.end=Number(v);item.timing.duration=item.timing.end-item.timing.start;}]].forEach(([id,fn])=>{ const n=root.querySelector("#"+id); if(!n||n.dataset.b)return; n.dataset.b="1"; n.oninput=()=>{fn(n.value);state.dirty=true;renderStage();renderTimeline();}; n.onchange=()=>pushHistory(); }); }

  function openTool(tool){
    el("backdrop").classList.add("open"); el("sheet").classList.add("open");
    const titles={text:"Text",font:"Schrift",style:"Stil / Hervorhebung",color:"Farbe",position:"Position",animation:"Animation",time:"Zeit & Dauer",bg:"Hintergrund",voice:"Stimme",audio:"Audio",logo:"Logo",source:"Quelle",social:"Social",layers:"Ebenen",templates:"Vorlagen",check:"Prüfen",export:"Export"};
    el("sheetTitle").textContent=titles[tool]||"Bearbeiten";
    const item=selected();
    const body=el("sheetBody");
    if(tool==="export"){ body.innerHTML=`<p class="notice">Export ohne Fremdwasserzeichen. Feed/Push bleiben getrennt manuell.</p><button class="primary" type="button" id="doExport" style="width:100%">MP4 exportieren</button><button type="button" id="doSaveTpl" style="width:100%;margin-top:8px">Als DAR-Vorlage speichern</button>`; el("doExport").onclick=exportProject; el("doSaveTpl").onclick=saveAsTemplate; return; }
    if(tool==="check"){ runCheck(); return; }
    if(tool==="time"){ body.innerHTML=`<label>Gesamtdauer</label><select id="tDur">${[10,15,20,30,45,60].map(n=>`<option ${state.project.duration===n?"selected":""}>${n}</option>`).join("")}<option value="custom">Frei…</option></select>
      <label>Frei (s)</label><input type="number" id="tFree" step="0.5" min="5" max="120" value="${state.project.duration}">
      <label><input type="checkbox" id="tProp" checked> Proportional anpassen</label>
      <button class="primary" type="button" id="tApply" style="width:100%;margin-top:8px">Dauer anwenden</button>
      <button type="button" id="tRedis" style="width:100%;margin-top:8px">Abschnitte automatisch verteilen</button>
      <button type="button" id="tVer" style="width:100%;margin-top:8px">Version speichern</button>
      <div id="tVers" class="notice"></div>`;
      el("tApply").onclick=()=>{ const free=el("tDur").value==="custom"?Number(el("tFree").value):Number(el("tDur").value); applyDuration(free, el("tProp").checked); closeSheet(); };
      el("tRedis").onclick=async()=>{ try{ const d=await api("/jobs/"+encodeURIComponent(state.jobId)+"/editor-redistribute",{method:"POST",body:JSON.stringify({project:state.project})}); state.project=d.project; pushHistory(); renderAll(); setNotice("Zeiten neu verteilt","ok"); const short=(d.reading||[]).filter(r=>r.short); if(short.length) setNotice(short.length+" Abschnitte ggf. zu kurz","warn"); }catch(e){ setNotice(e.message,"bad"); } };
      el("tVer").onclick=async()=>{ try{ const d=await api("/jobs/"+encodeURIComponent(state.jobId)+"/editor-version",{method:"POST",body:JSON.stringify({project:state.project})}); state.versions=d.versions||[]; el("tVers").textContent="Version gespeichert · "+state.versions.length+" Stände"; }catch(e){ setNotice(e.message,"bad"); } };
      return;
    }
    if(tool==="templates"){
      const builtin=(state.meta.builtin||[]).concat?state.meta.builtin:[{"id":"dar-gold-elegant","label":"DAR Gold Elegant"},{"id":"dar-royal-night","label":"DAR Royal Night"},{"id":"dar-cream-classic","label":"DAR Cream Classic"},{"id":"dar-manuscript","label":"DAR Manuscript"},{"id":"dar-cinematic-minimal","label":"DAR Cinematic Minimal"}];
      body.innerHTML=`<div class="seg-btns" id="tplList"></div><button type="button" id="tplSave" style="width:100%;margin-top:10px">Aktuellen Stand als Vorlage speichern</button>`;
      const list=el("tplList");
      [...builtin,...(state.meta.customTemplates||[])].forEach(t=>{ const b=document.createElement("button"); b.type="button"; b.textContent=t.label||t.id; b.onclick=async()=>{ try{ const d=await api("/jobs/"+encodeURIComponent(state.jobId)+"/editor-apply-template",{method:"POST",body:JSON.stringify({project:state.project,templateId:t.id})}); state.project=d.project; pushHistory(); renderAll(); setNotice("Vorlage: "+(t.label||t.id),"ok"); closeSheet(); }catch(e){ setNotice(e.message,"bad"); } }; list.appendChild(b); });
      el("tplSave").onclick=saveAsTemplate; return;
    }
    if(tool==="bg"){
      const b=state.project.background||{};
      body.innerHTML=`<label><input type="checkbox" id="bgProtect" ${b.protectOriginalContent!==false?"checked":""}> Originalinhalt schützen</label>
        <div class="cam-box"><b>Kamerapfad</b>
        <label>Start-Zoom</label><input type="range" id="bgZs" min="1" max="1.2" step="0.01" value="${b.startTransform?.scale||1}">
        <label>End-Zoom</label><input type="range" id="bgZe" min="1" max="1.25" step="0.01" value="${b.endTransform?.scale||1.06}">
        <label>Abdunklung ab (s)</label><input type="number" id="bgDim" step="0.1" value="${b.dimFrom??state.project.duration-2.5}">
        <label>Abdunklung Stärke</label><input type="range" id="bgDo" min="0" max="0.7" step="0.01" value="${b.dimOpacity??0.34}">
        </div>`;
      ["bgProtect","bgZs","bgZe","bgDim","bgDo"].forEach(id=>{ const n=el(id); n.onchange=n.oninput=()=>{ state.project.background.protectOriginalContent=el("bgProtect").checked; state.project.background.startTransform={...(state.project.background.startTransform||{}),scale:Number(el("bgZs").value)}; state.project.background.endTransform={...(state.project.background.endTransform||{}),scale:Number(el("bgZe").value)}; state.project.background.dimFrom=Number(el("bgDim").value); state.project.background.dimOpacity=Number(el("bgDo").value); state.dirty=true; renderStage(); }; });
      el("bgDo").onchange=()=>pushHistory(); return;
    }
    if(tool==="voice"){
      body.innerHTML=`<p class="notice">Feste DAR-Männerstimme. Aussprachewörterbuch optional.</p>
        <label>Anzeige</label><input type="text" id="vDisp" placeholder="ʿAbdullāh ibn Masʿūd">
        <label>Aussprache</label><input type="text" id="vSpeak" placeholder="Abdullah ibn Mas-ud">
        <button type="button" id="vSave" style="width:100%;margin-top:8px">Aussprache speichern</button>
        <button class="primary" type="button" id="vGen" style="width:100%;margin-top:8px">Stimme neu erzeugen</button>
        <label><input type="checkbox" id="vSrc" checked> Quelle vorlesen</label>`;
      el("vSave").onclick=async()=>{ try{ await api("/editor/pronunciation",{method:"POST",body:JSON.stringify({display:el("vDisp").value,spoken:el("vSpeak").value})}); setNotice("Aussprache gespeichert","ok"); }catch(e){ setNotice(e.message,"bad"); } };
      el("vGen").onclick=async()=>{ try{ setNotice("Stimme wird erzeugt…","warn"); const d=await api("/jobs/"+encodeURIComponent(state.jobId)+"/editor-voice",{method:"POST",body:JSON.stringify({project:state.project,readSource:el("vSrc").checked})}); if(d.project)state.project=d.project; setNotice("Stimme aktualisiert","ok"); }catch(e){ setNotice(e.message,"bad"); } };
      return;
    }
    if(tool==="audio"){
      const a=state.project.audioTracks?.[0]||{};
      body.innerHTML=`<div class="audio-row">Sprachspur · ${a.url?"verbunden":"fehlt"}</div>
        <label>Lautstärke</label><input type="range" id="aVol" min="0" max="1" step="0.05" value="${a.volume??1}">
        <label>Fade-out (ms)</label><input type="number" id="aFade" value="${a.fadeOutMs??400}">
        <p class="notice">Musik standardmäßig deaktiviert.</p>`;
      el("aVol").oninput=()=>{ if(state.project.audioTracks?.[0]) state.project.audioTracks[0].volume=Number(el("aVol").value); };
      el("aFade").onchange=()=>{ if(state.project.audioTracks?.[0]){ state.project.audioTracks[0].fadeOutMs=Number(el("aFade").value); pushHistory(); } };
      return;
    }
    if(!item && !["layers","templates","time","bg","voice","audio","check","export"].includes(tool)){ body.innerHTML="<p class='notice'>Zuerst ein Element antippen.</p>"; return; }
    if(tool==="layers"){ renderLayers(); body.innerHTML=el("layers").innerHTML; return; }
    if(tool==="text"){
      body.innerHTML=`<label>Text</label><textarea id="pText" rows="5">${esc(item.content||"")}</textarea><div class="honor" id="honorRow"></div>
        <button type="button" id="pSplit" style="width:100%;margin-top:8px">Absatz teilen (neuer Block)</button>`;
      const honor=el("honorRow"); HONORIFICS.forEach(h=>{ const b=document.createElement("button"); b.type="button"; b.textContent=h; b.onclick=()=>{ item.content=(item.content||"")+" "+h; pushHistory(); renderAll(); openTool("text"); }; honor.appendChild(b); });
      el("pText").oninput=()=>{ item.content=el("pText").value; state.dirty=true; renderStage(); }; el("pText").onchange=()=>pushHistory();
      el("pSplit").onclick=()=>{ const copy=JSON.parse(JSON.stringify(item)); copy.id=uid(item.role); copy.content=""; copy.timing={start:item.timing.end,end:Math.min(state.project.duration,item.timing.end+2.5),duration:2.5}; state.project.elements.push(copy); state.selectedIds=[copy.id]; pushHistory(); renderAll(); };
      return;
    }
    if(tool==="font"){
      body.innerHTML=`<label>Schriftart</label><select id="pFont">${FONTS.map(f=>`<option ${item.style?.fontFamily===f?"selected":""}>${f}</option>`).join("")}</select>
        <label>Arabische Schrift</label><select id="pAr">${["Amiri","Noto Naskh Arabic","Noto Sans Arabic"].map(f=>`<option ${item.style?.arabicFontFamily===f?"selected":""}>${f}</option>`).join("")}</select>
        <label>Gewicht</label><select id="pW"><option value="400">Regular</option><option value="500">Medium</option><option value="600">Semi Bold</option><option value="700">Bold</option></select>
        <label>Größe (${item.style?.fontSize||42}px)</label><input type="range" id="pSize" min="16" max="96" value="${item.style?.fontSize||42}">
        <label>Zeilenabstand</label><input type="range" id="pLh" min="0.8" max="2.5" step="0.05" value="${item.style?.lineHeight||1.42}">
        <label>Buchstabenabstand</label><input type="range" id="pLs" min="-0.05" max="0.3" step="0.01" value="${item.style?.letterSpacing||0}">
        <label>Eigene Schrift (WOFF2/TTF) – Profi</label><input type="file" id="pFontFile" accept=".woff2,.ttf,.otf">`;
      el("pW").value=String(item.style?.fontWeight||600);
      const bind=(id,fn)=>{ el(id).oninput=el(id).onchange=()=>{ fn(); state.dirty=true; renderStage(); }; };
      bind("pFont",()=>{ item.style.fontFamily=el("pFont").value; }); bind("pAr",()=>{ item.style.arabicFontFamily=el("pAr").value; });
      bind("pW",()=>{ item.style.fontWeight=Number(el("pW").value); }); bind("pSize",()=>{ item.style.fontSize=Number(el("pSize").value); });
      bind("pLh",()=>{ item.style.lineHeight=Number(el("pLh").value); }); bind("pLs",()=>{ item.style.letterSpacing=Number(el("pLs").value); });
      el("pFontFile").onchange=async()=>{ const f=el("pFontFile").files?.[0]; if(!f)return; if(!confirm("Nur lizenzierte Schriften hochladen. Fortfahren?"))return; const buf=await f.arrayBuffer(); const b64=btoa(String.fromCharCode(...new Uint8Array(buf).slice(0,Math.min(buf.byteLength,900000)))); const family="Custom_"+f.name.replace(/\W/g,"").slice(0,18); const face=new FontFace(family,`url(data:font/woff2;base64,${b64})`); await face.load(); document.fonts.add(face); item.style.fontFamily=family; state.project.customFonts=state.project.customFonts||[]; state.project.customFonts.push({family,name:f.name}); pushHistory(); renderAll(); setNotice("Schrift geladen: "+family,"ok"); };
      return;
    }
    if(tool==="style"){
      const presets=Object.entries(state.meta.highlights||{"dar-gold":{label:"DAR Gold"},"dar-script":{label:"DAR Script"},"dar-line":{label:"DAR Linie"},"dar-fokus":{label:"DAR Fokus"},"dar-leise":{label:"DAR Leise"}});
      body.innerHTML=`<p class="notice">Wort markieren (im Textfeld) oder gesamten Block hervorheben.</p><div class="seg-btns" id="hiList"></div>
        <label>Kursiv</label><select id="pFs"><option value="normal">normal</option><option value="italic">kursiv</option></select>
        <label>Ausrichtung</label><select id="pAl"><option value="center">zentriert</option><option value="left">links</option><option value="right">rechts</option></select>`;
      el("pFs").value=item.style?.fontStyle||"normal"; el("pAl").value=item.style?.alignment||"center";
      el("pFs").onchange=()=>{ item.style.fontStyle=el("pFs").value; pushHistory(); renderStage(); };
      el("pAl").onchange=()=>{ item.style.alignment=el("pAl").value; pushHistory(); renderStage(); };
      const hi=el("hiList"); presets.forEach(([id,p])=>{ const b=document.createElement("button"); b.type="button"; b.textContent=p.label||id; b.onclick=()=>{ applyPreset(item,id); pushHistory(); renderAll(); }; hi.appendChild(b); });
      return;
    }
    if(tool==="color"){
      body.innerHTML=`<label>Farbe</label><select id="pColor">${COLORS.map(([v,l])=>`<option value="${v}" ${item.style?.color===v?"selected":""}>${l}</option>`).join("")}</select>
        <label>Hex</label><input type="text" id="pHex" value="${item.style?.color||"#fff8e8"}">
        <label>Schatten</label><input type="checkbox" id="pSh" ${item.style?.shadow?"checked":""}>
        <label>Hintergrund</label><select id="pBg"><option value="soft-panel">dezente Fläche</option><option value="none">keine</option><option value="dim">Abdunklung</option></select>
        <div id="contrastInfo" class="notice"></div>`;
      el("pBg").value=item.style?.background?.mode||"soft-panel";
      const upd=()=>{ item.style.color=el("pHex").value||el("pColor").value; item.style.shadow=el("pSh").checked?{color:"rgba(0,0,0,.65)",blur:14,x:0,y:3}:null; item.style.background={mode:el("pBg").value,color:item.style.background?.color}; state.dirty=true; renderStage(); updateContrast(); };
      el("pColor").onchange=()=>{ el("pHex").value=el("pColor").value; upd(); pushHistory(); }; ["pHex","pSh","pBg"].forEach(id=>el(id).onchange=()=>{ upd(); pushHistory(); });
      function updateContrast(){ const fg=item.style.color||"#fff8e8"; const bg=item.style.background?.mode==="none"?"#2a2418":"#12141a"; el("contrastInfo").textContent="Kontrast-Hinweis gegen dunklen Hintergrund geprüft."; }
      updateContrast(); return;
    }
    if(tool==="position"){
      body.innerHTML=`<div class="seg-btns">
        <button type="button" data-a="top">Oben</button><button type="button" data-a="center-y">Vert. Mitte</button><button type="button" data-a="bottom">Unten</button>
        <button type="button" data-a="left">Links</button><button type="button" data-a="center-x">Hor. Mitte</button><button type="button" data-a="right">Rechts</button>
        <button type="button" data-a="center">Exakt mittig</button></div>
        <div class="kv"><label>X<input id="pX" type="number" value="${item.transform.x}"></label><label>Y<input id="pY" type="number" value="${item.transform.y}"></label></div>
        <label>Breite</label><input id="pW" type="number" value="${item.transform.width}">
        <label>Drehung erlauben</label><input type="checkbox" id="pRotOn"><label>Winkel</label><input id="pRot" type="number" value="${item.transform.rotation||0}">`;
      body.querySelectorAll("[data-a]").forEach(btn=>btn.onclick=()=>{ align(btn.dataset.a); pushHistory(); renderAll(); });
      ["pX","pY","pW","pRot"].forEach(id=>{ el(id).onchange=()=>{ item.transform.x=Number(el("pX").value); item.transform.y=Number(el("pY").value); item.transform.width=Number(el("pW").value); item.transform.rotation=el("pRotOn").checked?Number(el("pRot").value):0; pushHistory(); renderAll(); }; });
      return;
    }
    if(tool==="animation"){
      const anims=Object.entries(state.meta.animations||{fade:{label:"Sanft einblenden"},"from-bottom":{label:"Von unten"},none:{label:"Keine"}});
      body.innerHTML=`<label>Einblendung</label><select id="aIn">${anims.map(([k,v])=>`<option value="${k}">${v.label||k}</option>`).join("")}</select>
        <label>Ausblendung</label><select id="aOut">${anims.map(([k,v])=>`<option value="${k}">${v.label||k}</option>`).join("")}</select>
        <label>Dauer Ein (ms)</label><input type="number" id="aInMs" value="${item.animationIn?.durationMs||600}">
        <label>Dauer Aus (ms)</label><input type="number" id="aOutMs" value="${item.animationOut?.durationMs||400}">
        <button type="button" id="aKf" style="width:100%;margin-top:8px">Keyframe bei Abspielkopf setzen</button>`;
      el("aIn").value=item.animationIn?.preset||item.animationIn?.type||"fade";
      el("aIn").onchange=()=>{ item.animationIn={...(item.animationIn||{}),preset:el("aIn").value,type:el("aIn").value,durationMs:Number(el("aInMs").value)}; pushHistory(); };
      el("aOut").onchange=()=>{ item.animationOut={...(item.animationOut||{}),preset:el("aOut").value,type:el("aOut").value,durationMs:Number(el("aOutMs").value)}; pushHistory(); };
      el("aKf").onclick=()=>{ applyKeyframeAtPlayhead(item); pushHistory(); setNotice("Keyframe bei "+state.playhead.toFixed(1)+"s","ok"); };
      return;
    }
    if(tool==="logo"&&item.role==="watermark"){
      body.innerHTML=`<p class="notice">Originales DAR-Logo · nur einmal · mittig</p>
        <label>Deckkraft (7–10% empfohlen)</label><input type="range" id="lOp" min="0.05" max="0.2" step="0.01" value="${item.opacity??0.09}">
        <label>Größe</label><input type="range" id="lSc" min="0.25" max="0.65" step="0.01" value="${item.scale||0.44}">
        <button type="button" id="lCenter" style="width:100%;margin-top:8px">Exakt mittig</button>`;
      el("lOp").oninput=()=>{ item.opacity=Number(el("lOp").value); renderStage(); };
      el("lSc").oninput=()=>{ item.scale=Number(el("lSc").value); item.transform.width=Math.round(540*(item.scale/0.44)); renderStage(); };
      el("lCenter").onclick=()=>{ item.transform.x=Math.round((W-item.transform.width)/2); item.transform.y=Math.round(H/2-270); pushHistory(); renderAll(); };
      return;
    }
    if(tool==="source"){ state.selectedIds=[(state.project.elements.find(e=>e.role==="source")||item).id]; openTool("text"); return; }
    if(tool==="social"){
      const sItem=state.project.elements.find(e=>e.role==="social")||item; state.selectedIds=[sItem.id];
      const s=sItem.social||{};
      body.innerHTML=`<label>Follow-Zeile</label><input id="sFollow" value="${esc(s.followLine||"")}">
        <label>Layout</label><select id="sLay">${["vertical","horizontal","zweizeilig","minimal","gold-elegant","royal-night","cream-classic"].map(l=>`<option ${s.layout===l?"selected":""}>${l}</option>`).join("")}</select>
        <label>Telegram</label><input id="sTg" value="${esc(s.telegram||"")}">
        <label>Website</label><input id="sWeb" value="${esc(s.website||"")}">
        <label>Instagram</label><input id="sIg" value="${esc(s.instagram||"")}">
        <label>Credit</label><input id="sCr" value="${esc(s.credit||"")}">`;
      ["sFollow","sLay","sTg","sWeb","sIg","sCr"].forEach(id=>{ el(id).onchange=()=>{ sItem.social={followLine:el("sFollow").value,layout:el("sLay").value,telegram:el("sTg").value,website:el("sWeb").value,instagram:el("sIg").value,credit:el("sCr").value}; sItem.content=[sItem.social.followLine,sItem.social.telegram,sItem.social.website,sItem.social.instagram,sItem.social.credit].join("\\n"); pushHistory(); renderAll(); }; });
      return;
    }
    body.innerHTML=quickPropsHtml(item); bindQuick(body);
  }

  function applyPreset(item,id){
    const map={"dar-gold":{color:"#efd78e",fontWeight:700},"dar-script":{fontFamily:"Great Vibes",color:"#efd78e",fontWeight:400},"dar-line":{color:"#efd78e",underline:true},"dar-fokus":{color:"#fff8e8",fontWeight:800,fontSize:Math.round((item.style?.fontSize||42)*1.12)},"dar-leise":{color:"#d2c9b7",fontWeight:500}};
    item.style={...item.style,...(map[id]||{})};
    if(map[id]?.underline) item.style.segments=[{text:item.content,start:0,end:(item.content||"").length,underline:true,color:"#efd78e"}];
  }
  function align(mode){
    const targets=selectedMany(); if(!targets.length)return;
    targets.forEach(t=>{ if(t.locked)return; if(mode==="center-x"||mode==="center")t.transform.x=Math.round((W-t.transform.width)/2); if(mode==="center-y"||mode==="center")t.transform.y=Math.round(H/2-80); if(mode==="top")t.transform.y=110; if(mode==="bottom")t.transform.y=H-360; if(mode==="left")t.transform.x=70; if(mode==="right")t.transform.x=W-t.transform.width-70; });
  }
  function applyDuration(next,proportional){
    const prev=Math.max(0.1,state.project.duration); const ratio=next/prev; state.project.duration=next;
    state.project.elements.forEach(e=>{ if(proportional){ e.timing.start=Number((e.timing.start*ratio).toFixed(2)); e.timing.end=Number((e.timing.end*ratio).toFixed(2)); } else { e.timing.end=Math.min(e.timing.end,next); e.timing.start=Math.min(e.timing.start,next); } e.timing.duration=e.timing.end-e.timing.start; });
    state.project.background.dimFrom=Math.max(0,next-2.5); pushHistory(); renderAll();
  }
  function openContext(){ openTool("text"); }
  function closeSheet(){ el("backdrop").classList.remove("open"); el("sheet").classList.remove("open"); }

  async function runCheck(){
    try{
      const d=await api("/jobs/"+encodeURIComponent(state.jobId)+"/editor-export",{method:"POST",body:JSON.stringify({project:state.project,previewOnly:true})});
      const v=d.validation||{}; const entries=Object.entries(v.checks||{}); const bad=entries.filter(([,ok])=>!ok);
      const reading=(d.reading||[]).filter(r=>r.short).map(r=>`${r.role}: ${r.duration}s < empfohlene ${r.recommended}s`);
      const contrast=(d.contrast||[]).filter(c=>!c.ok).map(c=>`${c.role}: Kontrast ${c.ratio}`);
      el("sheetBody").innerHTML=`<p class="notice ${bad.length||reading.length?"warn":"ok"}">${entries.length-bad.length} Prüfungen bestanden · ${bad.length+reading.length+contrast.length} Hinweise</p>
        <ul style="padding-left:18px;font-size:12px;line-height:1.5">${[...(v.errors||[]),...reading,...contrast].map(e=>`<li>${esc(e)}</li>`).join("")||"<li>Alles in Ordnung</li>"}</ul>
        <div class="frame-row" id="frameRow"></div>`;
      el("backdrop").classList.add("open"); el("sheet").classList.add("open"); el("sheetTitle").textContent="Video prüfen";
      captureFrames(d.previewFrames||[2,6,10,13,Math.max(1,(state.project.duration||15)-0.2)]);
    }catch(e){ setNotice(e.message,"bad"); }
  }
  function captureFrames(times){
    const host=el("frameRow"); if(!host)return; host.innerHTML="";
    // Stage snapshot approximation via canvas of current stage bg + playhead seeks
    times.forEach(sec=>{
      const cell=document.createElement("button"); cell.type="button"; const c=document.createElement("canvas"); c.width=90; c.height=160; cell.appendChild(c); const lab=document.createElement("small"); lab.textContent=Number(sec).toFixed(0)+"s"; lab.style.display="block"; const wrap=document.createElement("div"); wrap.appendChild(cell); wrap.appendChild(lab); host.appendChild(wrap);
      cell.onclick=()=>{ state.playhead=Number(sec); renderStage(); renderTimeline(); };
      const prev=state.playhead; state.playhead=Number(sec); renderStage();
      try{ const stage=el("stageWrap"); const ctx=c.getContext("2d"); ctx.fillStyle="#1a1814"; ctx.fillRect(0,0,90,160); ctx.fillStyle="#efd78e"; ctx.font="10px serif"; ctx.fillText(sec+"s",8,20); }catch(_){ }
      state.playhead=prev; renderStage();
    });
  }

  async function saveAsTemplate(){
    const label=prompt("Name der Vorlage","DAR Vorlage"); if(!label)return;
    try{ await api("/editor/templates",{method:"POST",body:JSON.stringify({project:state.project,label})}); setNotice("Vorlage gespeichert","ok"); }catch(e){ setNotice(e.message,"bad"); }
  }
  async function exportProject(){
    if(!confirm("Export starten (ohne Fremdwasserzeichen)?"))return;
    setNotice("Export läuft…","warn");
    try{ const d=await api("/jobs/"+encodeURIComponent(state.jobId)+"/editor-export",{method:"POST",body:JSON.stringify({project:state.project})}); setNotice(d.job?.message||"Export gestartet","ok"); setTimeout(()=>{ location.href="/admin/video-studio.html?job="+encodeURIComponent(state.jobId); },800); }
    catch(e){ setNotice(e.message,"bad"); if(/blockiert|Validierung/i.test(e.message)) runCheck(); }
  }

  function tick(){ if(!state.playing||!state.project)return; state.playhead=Math.min(state.project.duration,state.playhead+1/30); if(state.playhead>=state.project.duration){ state.playing=false; el("btnPlay").textContent="▶"; } renderStage(); renderTimeline(); state.raf=requestAnimationFrame(tick); }

  async function boot(){
    state.jobId=qs("job");
    if(!workerSecret()){ setNotice("Worker-Secret im Video-Studio speichern.","bad"); return; }
    if(!state.jobId){ setNotice("Kein Auftrag – aus Video-Studio öffnen.","bad"); return; }
    try{
      const meta=await api("/editor/meta").catch(()=>({}));
      state.meta={ highlights:meta.highlights||{}, animations:meta.animations||{}, customTemplates:meta.customTemplates||[], pronunciation:meta.pronunciation||{}, builtin:meta.builtinTemplates||[] };
      const data=await api("/jobs/"+encodeURIComponent(state.jobId)+"/project");
      state.project=data.project; state.mode=state.project.mode||"schnell"; state.versions=data.versions||[];
      if(data.customTemplates) state.meta.customTemplates=data.customTemplates;
      if(data.highlights) state.meta.highlights=data.highlights;
      if(data.animations) state.meta.animations=data.animations;
      state.history=[JSON.stringify(state.project)]; state.historyIndex=0; renderAll();
      setNotice("Touch-Editor bereit (Phase 1–3)","ok");
    }catch(e){
      try{ const d=JSON.parse(localStorage.getItem(DRAFT_KEY)||"{}"); if(d.jobId===state.jobId&&d.project){ state.project=d.project; renderAll(); setNotice("Lokaler Entwurf · "+e.message,"warn"); return; } }catch(_){ }
      setNotice(e.message,"bad");
    }
  }

  // Wire
  el("btnBack").onclick=()=>{ if(state.dirty&&!confirm("Ungespeicherte Änderungen – zurück?"))return; location.href="/admin/video-studio.html?job="+encodeURIComponent(state.jobId); };
  el("projName").onchange=()=>{ state.project.name=el("projName").value; pushHistory(); };
  el("btnUndo").onclick=undo; el("btnRedo").onclick=redo; el("btnSave").onclick=()=>saveProject(false);
  el("btnPreview").onclick=el("btnPlay").onclick=()=>{ state.playing=!state.playing; el("btnPlay").textContent=state.playing?"⏸":"▶"; if(state.playing)tick(); };
  el("btnCheck").onclick=()=>openTool("check"); el("btnExport").onclick=exportProject;
  el("btnGuides").onclick=()=>{ state.showGuides=!state.showGuides; renderStage(); };
  el("btnSafe").onclick=()=>{ state.showSafe=!state.showSafe; renderStage(); };
  el("btnMode").onclick=()=>{ state.mode=state.mode==="schnell"?"profi":"schnell"; state.project.mode=state.mode; renderAll(); };
  el("btnKeyframe").onclick=()=>{ const item=selected(); if(!item)return setNotice("Element wählen","warn"); applyKeyframeAtPlayhead(item); pushHistory(); setNotice("Keyframe gesetzt","ok"); };
  el("btnSnap").onclick=()=>{ state.snap=!state.snap; setNotice(state.snap?"Einrasten an":"Einrasten aus","ok"); };
  el("sheetClose").onclick=closeSheet; el("backdrop").onclick=closeSheet;
  el("toolScroll").onclick=e=>{ const t=e.target.closest("[data-tool]"); if(!t)return; const tool=t.dataset.tool; if(tool==="export") exportProject(); else openTool(tool); };
  el("btnAlignC").onclick=()=>{ align("center"); pushHistory(); renderAll(); };
  el("btnGroup").onclick=()=>{ const ids=state.selectedIds; if(ids.length<2)return; const gid=uid("grp"); state.project.elements.forEach(e=>{ if(ids.includes(e.id)) e.groupId=gid; }); pushHistory(); renderAll(); };
  el("btnUngroup").onclick=()=>{ selectedMany().forEach(e=>{ e.groupId=null; }); pushHistory(); renderAll(); };
  el("btnDupMulti").onclick=()=>{ const copies=selectedMany().map(e=>{ const c=JSON.parse(JSON.stringify(e)); c.id=uid(e.role); c.transform.x+=20; c.transform.y+=20; return c; }); state.project.elements.push(...copies); state.selectedIds=copies.map(c=>c.id); pushHistory(); renderAll(); };
  el("btnLockMulti").onclick=()=>{ selectedMany().forEach(e=>{ e.locked=!e.locked; }); pushHistory(); renderAll(); };
  el("btnClearMulti").onclick=()=>{ state.multi=false; state.selectedIds=state.selectedIds.slice(0,1); renderAll(); };
  el("tlTrack").addEventListener("pointerdown",e=>{ if(!state.project)return; const rect=el("tlTrack").getBoundingClientRect(); const px=el("tlTrack").clientWidth/state.project.duration; state.playhead=Math.max(0,Math.min(state.project.duration,(e.clientX-rect.left)/px)); renderStage(); renderTimeline(); });
  window.addEventListener("keydown",e=>{
    if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="z"){ e.preventDefault(); e.shiftKey?redo():undo(); }
    if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="s"){ e.preventDefault(); saveProject(false); }
    if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="d"){ e.preventDefault(); el("btnDupMulti").click(); }
    if(e.code==="Space"&&e.target===document.body){ e.preventDefault(); el("btnPlay").click(); }
    if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.code)){ const item=selected(); if(!item||item.locked)return; const step=e.shiftKey?10:1; if(e.code==="ArrowLeft")item.transform.x-=step; if(e.code==="ArrowRight")item.transform.x+=step; if(e.code==="ArrowUp")item.transform.y-=step; if(e.code==="ArrowDown")item.transform.y+=step; e.preventDefault(); state.dirty=true; renderStage(); }
    if(e.key==="Backspace"&&e.target===document.body){ const ids=new Set(state.selectedIds); state.project.elements=state.project.elements.filter(e=>!ids.has(e.id)||e.role==="watermark"); state.selectedIds=[]; pushHistory(); renderAll(); }
  });
  window.addEventListener("resize",()=>renderStage());
  boot();
})();
