#!/usr/bin/env python3
"""Fix offline download: auto-dismiss on complete, stop retry loop at 100%."""

from pathlib import Path

FILES = [Path("/workspace/index.html"), Path("/workspace/test/index.html")]

OLD_STATE = (
    'let offlinePrepUiState={running:false,total:0,loaded:0,failed:0,bytes:0,percent:0,updatedAt:null,status:"idle"};let offlinePrepBusy=false;const OFFLINE_PREP_STALE_MS=45000;'
    'function offlinePrepIsStale(){const s=readOfflinePrepState();if(!s.running)return false;const ts=Date.parse(s.updatedAt||"");return!Number.isFinite(ts)||(Date.now()-ts)>OFFLINE_PREP_STALE_MS}'
    'function offlinePrepIsCorrupt(){const s=readOfflinePrepState();if(s.status!=="partial"&&s.status!=="error")return false;const total=Number(s.total||0),loaded=Number(s.loaded||0);return total<=0||loaded<0}'
    'function repairOfflinePrepState(){const s=readOfflinePrepState();if(offlinePrepIsCorrupt()){writeOfflinePrepState({running:false,status:"idle",total:0,loaded:0,failed:0,bytes:0,percent:0,updatedAt:new Date().toISOString()});return true}if(s.running&&offlinePrepIsStale()){writeOfflinePrepState({running:false,status:s.percent>=90&&s.total>0?"done":(s.percent>0&&s.total>0?"partial":"idle")});return true}if(s.status==="error"&&(s.percent||0)>=70&&(s.total||0)>0){writeOfflinePrepState({running:false,status:"partial"});return true}if((s.status==="partial"||s.status==="error")&&!(Number(s.total)>0)){writeOfflinePrepState({running:false,status:"idle",total:0,loaded:0,failed:0,bytes:0,percent:0});return true}return false}'
    'function offlinePrepShouldResume(){const s=readOfflinePrepState();if(offlinePrepIsCorrupt())return true;if(s.running&&!offlinePrepIsStale())return false;return s.status==="partial"||s.status==="error"||(s.percent>0&&s.percent<100&&s.total>0)}'
    'function offlinePrepShouldShowResume(){const s=readOfflinePrepState();if(s.status==="done"&&!(s.failed>0))return false;if(offlinePrepIsCorrupt())return true;if(s.status==="partial"||s.status==="error")return true;if((s.failed||0)>0&&(s.percent||0)<100)return true;if(s.running&&offlinePrepIsStale())return true;return offlinePrepShouldResume()}'
)

NEW_STATE = (
    'let offlinePrepUiState={running:false,total:0,loaded:0,failed:0,bytes:0,percent:0,updatedAt:null,status:"idle",successPending:false};'
    'let offlinePrepBusy=false;const OFFLINE_PREP_STALE_MS=45000;const OFFLINE_PREP_SUCCESS_DISMISS_MS=5000;const OFFLINE_PREP_DISMISSED_KEY="darOfflinePrepDismissedV1";'
    'let offlinePrepSuccessDismissTimer=null;'
    'function offlinePrepIsComplete(s){const st=s||readOfflinePrepState();if(st.status==="done"&&!st.running)return true;const total=Number(st.total||0),loaded=Number(st.loaded||0),percent=Number(st.percent||0);return total>0&&(percent>=100||loaded>=total)}'
    'function offlinePrepShouldShowBox(){const s=readOfflinePrepState();if(s.successPending)return true;if(!navigator.onLine)return true;if(s.running)return true;if(offlinePrepIsComplete(s))return false;if(s.status==="partial"||s.status==="error")return true;return false}'
    'function dismissOfflineSuccessBox(){if(offlinePrepSuccessDismissTimer){clearTimeout(offlinePrepSuccessDismissTimer);offlinePrepSuccessDismissTimer=null}writeOfflinePrepState({successPending:false,status:"done",running:false});setJson(OFFLINE_PREP_DISMISSED_KEY,Date.now());updateOfflineBox()}'
    'function showOfflineSuccessPending(patch){writeOfflinePrepState({...(patch||{}),status:"done",successPending:true,running:false,percent:100});if(offlinePrepSuccessDismissTimer)clearTimeout(offlinePrepSuccessDismissTimer);offlinePrepSuccessDismissTimer=setTimeout(()=>dismissOfflineSuccessBox(),OFFLINE_PREP_SUCCESS_DISMISS_MS);updateOfflineBox()}'
    'function offlinePrepFinalizeIfComplete(){const s=readOfflinePrepState();if(!offlinePrepIsComplete(s))return false;writeOfflinePrepState({status:"done",running:false,successPending:false,percent:100,total:s.total,loaded:s.loaded,failed:s.failed,bytes:s.bytes});setJson(OFFLINE_PREP_DISMISSED_KEY,Date.now());return true}'
    'function offlinePrepIsStale(){const s=readOfflinePrepState();if(!s.running)return false;const ts=Date.parse(s.updatedAt||"");return!Number.isFinite(ts)||(Date.now()-ts)>OFFLINE_PREP_STALE_MS}'
    'function offlinePrepIsCorrupt(){const s=readOfflinePrepState();if(s.status!=="partial"&&s.status!=="error")return false;const total=Number(s.total||0),loaded=Number(s.loaded||0);return total<=0||loaded<0}'
    'function repairOfflinePrepState(){const s=readOfflinePrepState();if(offlinePrepIsCorrupt()){writeOfflinePrepState({running:false,status:"idle",total:0,loaded:0,failed:0,bytes:0,percent:0,successPending:false,updatedAt:new Date().toISOString()});return true}if(offlinePrepFinalizeIfComplete())return true;if(s.running&&offlinePrepIsStale()){if(offlinePrepIsComplete(s)){offlinePrepFinalizeIfComplete();return true}writeOfflinePrepState({running:false,status:s.percent>=98&&s.total>0?"done":"partial"});return true}if(s.status==="error"&&(s.percent||0)>=70&&(s.total||0)>0&&!offlinePrepIsComplete(s)){writeOfflinePrepState({running:false,status:"partial"});return true}if((s.status==="partial"||s.status==="error")&&!(Number(s.total)>0)){writeOfflinePrepState({running:false,status:"idle",total:0,loaded:0,failed:0,bytes:0,percent:0,successPending:false});return true}return false}'
    'function offlinePrepShouldResume(){const s=readOfflinePrepState();if(offlinePrepIsComplete(s)||s.successPending)return false;if(offlinePrepIsCorrupt())return true;if(s.running&&!offlinePrepIsStale())return false;if(s.status==="partial"||s.status==="error"){const percent=Number(s.percent||0),total=Number(s.total||0),loaded=Number(s.loaded||0);if(percent>=100||loaded>=total)return false;return true}return s.percent>0&&s.percent<100&&s.total>0}'
    'function offlinePrepShouldShowResume(){const s=readOfflinePrepState();if(s.successPending||offlinePrepIsComplete(s))return false;if(offlinePrepIsCorrupt())return true;if(s.status==="partial"||s.status==="error"){const percent=Number(s.percent||0),total=Number(s.total||0),loaded=Number(s.loaded||0);if(percent>=100||loaded>=total)return false;return true}if(s.running&&offlinePrepIsStale())return true;return false}'
)

OLD_STATUS = (
    'function renderOfflineStatusLine(){const s=readOfflinePrepState();const stamp=s.updatedAt?new Date(s.updatedAt).toLocaleString("de-DE"):"-";'
    'if(!navigator.onLine)return`Offline · Stand vom ${stamp}`;if(s.running)return"Online · Inhalte werden geprüft";'
    'if(s.status==="partial")return`Fast fertig · ${s.loaded||0}/${s.total||0} Dateien · Download fortsetzen`;'
    'if(s.status==="done")return`Aktuell · zuletzt synchronisiert um ${stamp}`;return"Online · Offline-Paket bereit zum Aktualisieren"}'
)

NEW_STATUS = (
    'function renderOfflineStatusLine(){const s=readOfflinePrepState();const stamp=s.updatedAt?new Date(s.updatedAt).toLocaleString("de-DE"):"-";'
    'if(s.successPending)return"Offline-Download abgeschlossen";'
    'if(!navigator.onLine)return`Offline · Stand vom ${stamp}`;if(s.running)return"Online · Inhalte werden geprüft";'
    'if(s.status==="partial")return`Fast fertig · ${s.loaded||0}/${s.total||0} Dateien · Download fortsetzen`;'
    'if(s.status==="done")return`Aktuell · zuletzt synchronisiert um ${stamp}`;return"Online · Offline-Paket bereit zum Aktualisieren"}'
)

OLD_PROGRESS = (
    'function offlineProgressHtml(){const s=readOfflinePrepState();if(!s.running&&s.status!=="done"&&s.status!=="error"&&s.status!=="partial"&&!offlinePrepShouldShowResume())return"";'
    'const p=Math.max(0,Math.min(100,Number(s.percent||0)));'
    'const label=s.running?"Offline-Paket wird vorbereitet":s.status==="partial"?"Offline-Paket fast fertig":s.status==="error"?"Offline-Download unvollständig":"Offline-Paket Status";'
    'const resumeBlock=offlinePrepShouldShowResume()?`<button type="button" class="offline-resume-btn" id="offlineResumeBtn">Download fortsetzen</button>`:"";'
    'return `<div class="offline-prep-progress"><div class="offline-prep-head"><b>${label}</b><span>${s.loaded||0}/${s.total||0} Dateien · ${p}% · ${storageBytesLabel(s.bytes)}</span></div><div class="offline-prep-bar"><span style="width:${p}%"></span></div>${s.failed?`<small>${s.failed} Dateien konnten nicht geladen werden. Tippe unten auf „Download fortsetzen“.</small>`:""}${resumeBlock}</div>`}'
)

NEW_PROGRESS = (
    'function offlineProgressHtml(){const s=readOfflinePrepState();'
    'if(s.successPending){const failedNote=s.failed?`<small>${s.failed} Dateien konnten nicht geladen werden. Der Rest ist offline verfügbar.</small>`:"";'
    'return `<div class="offline-prep-progress offline-prep-success"><div class="offline-prep-head"><b>Offline-Download abgeschlossen</b><span>${s.loaded||0}/${s.total||0} Dateien · 100%</span></div>${failedNote}<button type="button" class="offline-resume-btn offline-success-ok" id="offlineSuccessOkBtn">OK</button></div>`}'
    'if(!s.running&&s.status!=="done"&&s.status!=="error"&&s.status!=="partial"&&!offlinePrepShouldShowResume())return"";'
    'const p=Math.max(0,Math.min(100,Number(s.percent||0)));'
    'const label=s.running?"Offline-Paket wird vorbereitet":s.status==="partial"?"Offline-Paket fast fertig":s.status==="error"?"Offline-Download unvollständig":"Offline-Paket Status";'
    'const resumeBlock=offlinePrepShouldShowResume()?`<button type="button" class="offline-resume-btn" id="offlineResumeBtn">Download fortsetzen</button>`:"";'
    'const failNote=s.failed&&offlinePrepShouldShowResume()?`<small>${s.failed} Dateien konnten nicht geladen werden. Tippe unten auf „Download fortsetzen“.</small>`:"";'
    'return `<div class="offline-prep-progress"><div class="offline-prep-head"><b>${label}</b><span>${s.loaded||0}/${s.total||0} Dateien · ${p}% · ${storageBytesLabel(s.bytes)}</span></div><div class="offline-prep-bar"><span style="width:${p}%"></span></div>${failNote}${resumeBlock}</div>`}'
)

OLD_UPDATE = (
    'function updateOfflineBox(){\n'
    '  repairOfflinePrepState();\n'
    '  const box=$("offlineBox");\n'
    '  if(!box)return;\n'
    '  const st=readOfflinePrepState();const show=!navigator.onLine||st.running||st.status==="partial"||st.status==="error"||(st.status==="done"&&(st.failed||0)>0);\n'
    '  box.classList.toggle("show",show);\n'
    '  if(!show)return;\n'
    '  const line=$("offlineStatusLine"),detail=$("offlineStatusDetail");\n'
    '  if(line)line.textContent=renderOfflineStatusLine();\n'
    '  if(detail)detail.textContent=`Lokaler Inhalt: ${offlineLibrarySummary()}. Lesestand, Favoriten, Einstellungen und Quiz-Fortschritt bleiben lokal aktiv.`;\n'
    '  const old=box.querySelector(".offline-prep-progress");\n'
    '  if(old)old.remove();\n'
    '  const wrap=document.createElement("div");\n'
    '  wrap.innerHTML=offlineProgressHtml();\n'
    '  if(wrap.firstElementChild)box.appendChild(wrap.firstElementChild);const resumeBtn=box.querySelector("#offlineResumeBtn");if(resumeBtn){resumeBtn.disabled=offlinePrepBusy||st.running&&!offlinePrepIsStale();resumeBtn.onclick=async(ev)=>{ev?.preventDefault?.();if(offlinePrepBusy)return;try{await startOfflinePreparation(true)}catch(e){const hint=$("offlinePrepHint");if(hint)hint.textContent=String(e?.message||e||"Download konnte nicht fortgesetzt werden");repairOfflinePrepState();updateOfflineBox()}}}\n'
    '}'
)

NEW_UPDATE = (
    'function updateOfflineBox(){\n'
    '  repairOfflinePrepState();\n'
    '  const box=$("offlineBox");\n'
    '  if(!box)return;\n'
    '  const st=readOfflinePrepState();const show=offlinePrepShouldShowBox();\n'
    '  box.classList.toggle("show",show);\n'
    '  if(!show)return;\n'
    '  const line=$("offlineStatusLine"),detail=$("offlineStatusDetail");\n'
    '  if(line)line.textContent=renderOfflineStatusLine();\n'
    '  if(detail)detail.textContent=`Lokaler Inhalt: ${offlineLibrarySummary()}. Lesestand, Favoriten, Einstellungen und Quiz-Fortschritt bleiben lokal aktiv.`;\n'
    '  const old=box.querySelector(".offline-prep-progress");\n'
    '  if(old)old.remove();\n'
    '  const wrap=document.createElement("div");\n'
    '  wrap.innerHTML=offlineProgressHtml();\n'
    '  if(wrap.firstElementChild)box.appendChild(wrap.firstElementChild);const okBtn=box.querySelector("#offlineSuccessOkBtn");if(okBtn){okBtn.onclick=(ev)=>{ev?.preventDefault?.();dismissOfflineSuccessBox()}}const resumeBtn=box.querySelector("#offlineResumeBtn");if(resumeBtn){resumeBtn.disabled=offlinePrepBusy||st.running&&!offlinePrepIsStale();resumeBtn.onclick=async(ev)=>{ev?.preventDefault?.();if(offlinePrepBusy)return;try{await startOfflinePreparation(true)}catch(e){const hint=$("offlinePrepHint");if(hint)hint.textContent=String(e?.message||e||"Download konnte nicht fortgesetzt werden");repairOfflinePrepState();updateOfflineBox()}}}\n'
    '}'
)

OLD_START = (
    'offlinePrepBusy=true;writeOfflinePrepState({running:true,status:"running",failed:resume?state.failed||0:0,loaded:resume?state.loaded||0:0,total:resume?state.total||0:0,percent:resume?state.percent||0:0,updatedAt:new Date().toISOString()});updateOfflineBox();'
)

NEW_START = (
    'try{localStorage.removeItem(OFFLINE_PREP_DISMISSED_KEY)}catch(e){}if(offlinePrepSuccessDismissTimer){clearTimeout(offlinePrepSuccessDismissTimer);offlinePrepSuccessDismissTimer=null}'
    'offlinePrepBusy=true;writeOfflinePrepState({running:true,status:"running",successPending:false,failed:resume?state.failed||0:0,loaded:resume?state.loaded||0:0,total:resume?state.total||0:0,percent:resume?state.percent||0:0,updatedAt:new Date().toISOString()});updateOfflineBox();'
)

OLD_STATUS_MSG = (
    'if(data.type==="OFFLINE_PREPARE_STATUS"){if(data.running){writeOfflinePrepState({running:true,status:"running",updatedAt:new Date().toISOString()})}else if(data.progress&&Number(data.progress.total)>0){writeOfflinePrepState({running:false,status:"partial",total:Number(data.progress.total||0),loaded:Number(data.progress.loaded||0),failed:Number(data.progress.failed||0),bytes:Number(data.progress.bytes||0),percent:Number(data.progress.percent||0),updatedAt:data.progress.updatedAt||new Date().toISOString()})}else if(data.meta&&data.meta.ok){writeOfflinePrepState({running:false,status:data.meta.partial?"partial":"done",total:Number(data.meta.total||0),loaded:Number(data.meta.loaded||0),failed:Number(data.meta.failed||0),bytes:Number(data.meta.bytes||0),percent:100,updatedAt:data.meta.completedAt||new Date().toISOString()})}repairOfflinePrepState();updateOfflineBox();return}'
)

NEW_STATUS_MSG = (
    'if(data.type==="OFFLINE_PREPARE_STATUS"){if(data.running){writeOfflinePrepState({running:true,status:"running",updatedAt:new Date().toISOString()})}else if(data.progress&&Number(data.progress.total)>0){const pct=Number(data.progress.percent||0),tot=Number(data.progress.total||0),ld=Number(data.progress.loaded||0);const done=tot>0&&(pct>=100||ld>=tot);writeOfflinePrepState({running:false,status:done?"done":"partial",total:tot,loaded:ld,failed:Number(data.progress.failed||0),bytes:Number(data.progress.bytes||0),percent:done?100:pct,updatedAt:data.progress.updatedAt||new Date().toISOString()});if(done)offlinePrepFinalizeIfComplete()}else if(data.meta&&data.meta.ok){writeOfflinePrepState({running:false,status:"done",total:Number(data.meta.total||0),loaded:Number(data.meta.loaded||0),failed:Number(data.meta.failed||0),bytes:Number(data.meta.bytes||0),percent:100,updatedAt:data.meta.completedAt||new Date().toISOString()});offlinePrepFinalizeIfComplete()}repairOfflinePrepState();updateOfflineBox();return}'
)

OLD_DONE = (
    'if(data.type==="OFFLINE_PREPARE_DONE"){offlinePrepBusy=false;const ok=!!data.ok;const partial=!!data.partial;const total=Number(data.total||0),loaded=Number(data.loaded||0);if(!ok&&total<=0){writeOfflinePrepState({running:false,status:"idle",total:0,loaded:0,failed:0,bytes:0,percent:0,updatedAt:new Date().toISOString()});const hint=$("offlinePrepHint");if(hint)hint.textContent="Offline-Download konnte nicht fortgesetzt werden. Bitte erneut starten.";updateOfflineBox();return}const finalStatus=ok?(partial?"partial":"done"):"partial";writeOfflinePrepState({running:false,status:finalStatus,total,loaded,failed:Number(data.failed||0),bytes:Number(data.bytes||0),percent:ok&&!partial?100:Number(data.percent||readOfflinePrepState().percent||0),updatedAt:new Date().toISOString()});setJson(OFFLINE_SYNC_META_KEY,{appVersion:typeof APP_BUILD_ID==="string"?APP_BUILD_ID:"",contentVersion:String(window.__darRemoteBuildId||""),databaseSchemaVersion:OFFLINE_DB_VERSION,lastSuccessfulSync:ok?new Date().toISOString():(getJson(OFFLINE_SYNC_META_KEY,{lastSuccessfulSync:""}).lastSuccessfulSync||""),syncStatus:ok?(partial?"partial":"done"):"partial",pendingLocalChanges:getJson("darOfflineQueueCountV1",0),acknowledgedUpdateVersion:String(window.__darRemoteBuildId||"")});offlineDbSet("meta","syncStatus",{state:finalStatus,payload:data,at:new Date().toISOString()});const hint=$("offlinePrepHint");if(hint)hint.textContent=partial?`Offline-Paket fast fertig (${data.failed||0} Dateien fehlgeschlagen). Download kann fortgesetzt werden.`:ok?"Offline-Nutzung vollständig eingerichtet":"Offline-Download kann fortgesetzt werden.";updateOfflineBox();return}'
)

NEW_DONE = (
    'if(data.type==="OFFLINE_PREPARE_DONE"){offlinePrepBusy=false;const ok=!!data.ok;const total=Number(data.total||0),loaded=Number(data.loaded||0),failed=Number(data.failed||0),bytes=Number(data.bytes||0);if(!ok&&total<=0){writeOfflinePrepState({running:false,status:"idle",total:0,loaded:0,failed:0,bytes:0,percent:0,successPending:false,updatedAt:new Date().toISOString()});const hint=$("offlinePrepHint");if(hint)hint.textContent="Offline-Download konnte nicht fortgesetzt werden. Bitte erneut starten.";updateOfflineBox();return}'
    'if(ok||offlinePrepIsComplete({total,loaded,percent:Number(data.percent||0),status:"partial"})){writeOfflinePrepState({running:false,status:"done",total,loaded,failed,bytes,percent:100,updatedAt:new Date().toISOString()});setJson(OFFLINE_SYNC_META_KEY,{appVersion:typeof APP_BUILD_ID==="string"?APP_BUILD_ID:"",contentVersion:String(window.__darRemoteBuildId||""),databaseSchemaVersion:OFFLINE_DB_VERSION,lastSuccessfulSync:new Date().toISOString(),syncStatus:"done",pendingLocalChanges:getJson("darOfflineQueueCountV1",0),acknowledgedUpdateVersion:String(window.__darRemoteBuildId||"")});offlineDbSet("meta","syncStatus",{state:"done",payload:data,at:new Date().toISOString()});const hint=$("offlinePrepHint");if(hint)hint.textContent="Offline-Nutzung vollständig eingerichtet";showOfflineSuccessPending({total,loaded,failed,bytes});return}'
    'writeOfflinePrepState({running:false,status:"partial",total,loaded,failed,bytes,percent:Number(data.percent||readOfflinePrepState().percent||0),updatedAt:new Date().toISOString()});updateOfflineBox();return}'
)

OLD_INIT = (
    'if(navigator.onLine){flushOfflineQueue().catch(()=>{});if(offlinePrepShouldResume()&&!window.__darOfflineAutoResumeStarted){window.__darOfflineAutoResumeStarted=true;setTimeout(()=>startOfflinePreparation(true).catch(()=>{}),1800)}}updateOfflineBox();}'
)

NEW_INIT = (
    'offlinePrepFinalizeIfComplete();if(navigator.onLine){flushOfflineQueue().catch(()=>{});if(offlinePrepShouldResume()&&!window.__darOfflineAutoResumeStarted){window.__darOfflineAutoResumeStarted=true;setTimeout(()=>startOfflinePreparation(true).catch(()=>{}),1800)}}updateOfflineBox();}'
)

OLD_CSS = '.offline-prep-bar span{display:block;height:100%;background:linear-gradient(90deg,var(--gold),var(--gold2))}'
NEW_CSS = (
    '.offline-prep-bar span{display:block;height:100%;background:linear-gradient(90deg,var(--gold),var(--gold2))}'
    '.offline-prep-success .offline-prep-head b{color:var(--gold2)}'
    '.offline-success-ok{border-color:rgba(120,220,140,.55);background:linear-gradient(180deg,rgba(120,220,140,.24),rgba(60,140,80,.14))}'
)

REPLACEMENTS = [
    (OLD_STATE, NEW_STATE),
    (OLD_STATUS, NEW_STATUS),
    (OLD_PROGRESS, NEW_PROGRESS),
    (OLD_UPDATE, NEW_UPDATE),
    (OLD_START, NEW_START),
    (OLD_STATUS_MSG, NEW_STATUS_MSG),
    (OLD_DONE, NEW_DONE),
    (OLD_INIT, NEW_INIT),
    (OLD_CSS, NEW_CSS),
]


def patch(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    for old, new in REPLACEMENTS:
        if old not in text:
            raise SystemExit(f"Missing block in {path}: {old[:60]}...")
        text = text.replace(old, new, 1)
    path.write_text(text, encoding="utf-8")
    print(f"Patched {path}")


if __name__ == "__main__":
    for f in FILES:
        patch(f)
