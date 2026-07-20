#!/usr/bin/env python3
"""Patch offline download success dismiss + auto-retry in index.html and test/index.html."""

from pathlib import Path

FILES = [
    Path("/workspace/index.html"),
    Path("/workspace/test/index.html"),
]

OLD_STATE_BLOCK = (
    'let offlinePrepUiState={running:false,total:0,loaded:0,failed:0,bytes:0,percent:0,updatedAt:null,status:"idle"};'
    'let offlinePrepBusy=false;const OFFLINE_PREP_STALE_MS=45000;'
    'function offlinePrepIsStale(){const s=readOfflinePrepState();if(!s.running)return false;const ts=Date.parse(s.updatedAt||"");return!Number.isFinite(ts)||(Date.now()-ts)>OFFLINE_PREP_STALE_MS}'
    'function offlinePrepIsCorrupt(){const s=readOfflinePrepState();if(s.status!=="partial"&&s.status!=="error")return false;const total=Number(s.total||0),loaded=Number(s.loaded||0);return total<=0||loaded<0}'
    'function repairOfflinePrepState(){const s=readOfflinePrepState();if(offlinePrepIsCorrupt()){writeOfflinePrepState({running:false,status:"idle",total:0,loaded:0,failed:0,bytes:0,percent:0,updatedAt:new Date().toISOString()});return true}if(s.running&&offlinePrepIsStale()){writeOfflinePrepState({running:false,status:s.percent>=90&&s.total>0?"done":(s.percent>0&&s.total>0?"partial":"idle")});return true}if(s.status==="error"&&(s.percent||0)>=70&&(s.total||0)>0){writeOfflinePrepState({running:false,status:"partial"});return true}if((s.status==="partial"||s.status==="error")&&!(Number(s.total)>0)){writeOfflinePrepState({running:false,status:"idle",total:0,loaded:0,failed:0,bytes:0,percent:0});return true}return false}'
    'function offlinePrepShouldResume(){const s=readOfflinePrepState();if(offlinePrepIsCorrupt())return true;if(s.running&&!offlinePrepIsStale())return false;return s.status==="partial"||s.status==="error"||(s.percent>0&&s.percent<100&&s.total>0)}'
    'function offlinePrepShouldShowResume(){const s=readOfflinePrepState();if(s.status==="done"&&!(s.failed>0))return false;if(offlinePrepIsCorrupt())return true;if(s.status==="partial"||s.status==="error")return true;if((s.failed||0)>0&&(s.percent||0)<100)return true;if(s.running&&offlinePrepIsStale())return true;return offlinePrepShouldResume()}'
)

NEW_STATE_BLOCK = (
    'let offlinePrepUiState={running:false,total:0,loaded:0,failed:0,bytes:0,percent:0,updatedAt:null,status:"idle",successPending:false,autoRetryCount:0};'
    'let offlinePrepBusy=false;const OFFLINE_PREP_STALE_MS=45000;const OFFLINE_PREP_MAX_AUTO_RETRIES=3;const OFFLINE_PREP_SUCCESS_DISMISS_MS=6000;const OFFLINE_PREP_DISMISSED_KEY="darOfflinePrepDismissedV1";'
    'let offlinePrepAutoRetryTimer=null;let offlinePrepSuccessDismissTimer=null;'
    'function offlinePrepAutoRetryCount(){return Number(readOfflinePrepState().autoRetryCount||0)}'
    'function offlinePrepRetriesExhausted(){return offlinePrepAutoRetryCount()>=OFFLINE_PREP_MAX_AUTO_RETRIES}'
    'function offlinePrepNeedsAutoRetry(){const s=readOfflinePrepState();if(s.running||s.successPending)return false;if(s.status==="error")return!offlinePrepRetriesExhausted();if(s.status==="partial"&&(s.failed>0||s.percent<100))return!offlinePrepRetriesExhausted();return false}'
    'function offlinePrepTreatAsComplete(){const s=readOfflinePrepState();if(s.successPending)return true;if(s.status==="done"&&!s.running)return true;if(offlinePrepRetriesExhausted()&&s.total>0&&(s.percent>=98||s.loaded>=s.total))return true;return false}'
    'function offlinePrepShouldShowBox(){const s=readOfflinePrepState();if(s.successPending)return true;if(!navigator.onLine)return true;if(s.running)return true;if(offlinePrepNeedsAutoRetry())return true;if(s.status==="partial"||s.status==="error"){if(offlinePrepRetriesExhausted()&&!offlinePrepTreatAsComplete())return true;return false}return false}'
    'function scheduleOfflineAutoRetry(delay){if(offlinePrepAutoRetryTimer)clearTimeout(offlinePrepAutoRetryTimer);offlinePrepAutoRetryTimer=setTimeout(()=>{offlinePrepAutoRetryTimer=null;startOfflinePreparation(true).catch(()=>{})},delay||2000)}'
    'function showOfflineSuccessPending(patch){writeOfflinePrepState({...(patch||{}),status:"done",successPending:true,running:false,percent:100});if(offlinePrepSuccessDismissTimer)clearTimeout(offlinePrepSuccessDismissTimer);offlinePrepSuccessDismissTimer=setTimeout(()=>dismissOfflineSuccessBox(),OFFLINE_PREP_SUCCESS_DISMISS_MS);updateOfflineBox()}'
    'function dismissOfflineSuccessBox(){if(offlinePrepSuccessDismissTimer){clearTimeout(offlinePrepSuccessDismissTimer);offlinePrepSuccessDismissTimer=null}writeOfflinePrepState({successPending:false,status:"done",running:false});setJson(OFFLINE_PREP_DISMISSED_KEY,Date.now());updateOfflineBox()}'
    'function offlinePrepIsStale(){const s=readOfflinePrepState();if(!s.running)return false;const ts=Date.parse(s.updatedAt||"");return!Number.isFinite(ts)||(Date.now()-ts)>OFFLINE_PREP_STALE_MS}'
    'function offlinePrepIsCorrupt(){const s=readOfflinePrepState();if(s.status!=="partial"&&s.status!=="error")return false;const total=Number(s.total||0),loaded=Number(s.loaded||0);return total<=0||loaded<0}'
    'function repairOfflinePrepState(){const s=readOfflinePrepState();if(offlinePrepIsCorrupt()){writeOfflinePrepState({running:false,status:"idle",total:0,loaded:0,failed:0,bytes:0,percent:0,successPending:false,autoRetryCount:0,updatedAt:new Date().toISOString()});return true}if(s.running&&offlinePrepIsStale()){writeOfflinePrepState({running:false,status:s.percent>=98&&s.total>0?"done":"partial"});return true}if(s.status==="partial"&&s.percent>=100&&s.total>0&&!offlinePrepNeedsAutoRetry()){writeOfflinePrepState({status:"done",successPending:true,running:false});return true}if(s.status==="error"&&(s.percent||0)>=70&&(s.total||0)>0){writeOfflinePrepState({running:false,status:"partial"});return true}if((s.status==="partial"||s.status==="error")&&!(Number(s.total)>0)){writeOfflinePrepState({running:false,status:"idle",total:0,loaded:0,failed:0,bytes:0,percent:0,successPending:false,autoRetryCount:0});return true}return false}'
    'function offlinePrepShouldResume(){const s=readOfflinePrepState();if(s.successPending||offlinePrepTreatAsComplete())return false;if(offlinePrepIsCorrupt())return true;if(s.running&&!offlinePrepIsStale())return false;return offlinePrepNeedsAutoRetry()}'
    'function offlinePrepShouldShowResume(){const s=readOfflinePrepState();if(s.successPending||offlinePrepTreatAsComplete())return false;if(offlinePrepNeedsAutoRetry())return false;if(offlinePrepIsCorrupt())return true;if(offlinePrepRetriesExhausted()&&(s.status==="partial"||s.status==="error"))return true;if(s.running&&offlinePrepIsStale())return true;return false}'
)

OLD_STATUS_LINE = (
    'function renderOfflineStatusLine(){const s=readOfflinePrepState();const stamp=s.updatedAt?new Date(s.updatedAt).toLocaleString("de-DE"):"-";'
    'if(!navigator.onLine)return`Offline · Stand vom ${stamp}`;if(s.running)return"Online · Inhalte werden geprüft";'
    'if(s.status==="partial")return`Fast fertig · ${s.loaded||0}/${s.total||0} Dateien · Download fortsetzen`;'
    'if(s.status==="done")return`Aktuell · zuletzt synchronisiert um ${stamp}`;return"Online · Offline-Paket bereit zum Aktualisieren"}'
)

NEW_STATUS_LINE = (
    'function renderOfflineStatusLine(){const s=readOfflinePrepState();const stamp=s.updatedAt?new Date(s.updatedAt).toLocaleString("de-DE"):"-";'
    'if(s.successPending)return"Offline-Download abgeschlossen";'
    'if(!navigator.onLine)return`Offline · Stand vom ${stamp}`;if(s.running)return"Online · Inhalte werden geprüft";'
    'if(s.status==="partial")return`Fast fertig · ${s.loaded||0}/${s.total||0} Dateien · Download fortsetzen`;'
    'if(s.status==="done")return`Aktuell · zuletzt synchronisiert um ${stamp}`;return"Online · Offline-Paket bereit zum Aktualisieren"}'
)

OLD_PROGRESS_HTML = (
    'function offlineProgressHtml(){const s=readOfflinePrepState();if(!s.running&&s.status!=="done"&&s.status!=="error"&&s.status!=="partial"&&!offlinePrepShouldShowResume())return"";'
    'const p=Math.max(0,Math.min(100,Number(s.percent||0)));'
    'const label=s.running?"Offline-Paket wird vorbereitet":s.status==="partial"?"Offline-Paket fast fertig":s.status==="error"?"Offline-Download unvollständig":"Offline-Paket Status";'
    'const resumeBlock=offlinePrepShouldShowResume()?`<button type="button" class="offline-resume-btn" id="offlineResumeBtn">Download fortsetzen</button>`:"";'
    'return `<div class="offline-prep-progress"><div class="offline-prep-head"><b>${label}</b><span>${s.loaded||0}/${s.total||0} Dateien · ${p}% · ${storageBytesLabel(s.bytes)}</span></div><div class="offline-prep-bar"><span style="width:${p}%"></span></div>${s.failed?`<small>${s.failed} Dateien konnten nicht geladen werden. Tippe unten auf „Download fortsetzen“.</small>`:""}${resumeBlock}</div>`}'
)

NEW_PROGRESS_HTML = (
    'function offlineProgressHtml(){const s=readOfflinePrepState();'
    'if(s.successPending){const failedNote=s.failed?`<small>${s.failed} Dateien konnten nicht geladen werden. Der Rest ist offline verfügbar.</small>`:"";'
    'return `<div class="offline-prep-progress offline-prep-success"><div class="offline-prep-head"><b>Offline-Download abgeschlossen</b><span>${s.loaded||0}/${s.total||0} Dateien · 100% · ${storageBytesLabel(s.bytes)}</span></div>${failedNote}<button type="button" class="offline-resume-btn offline-success-ok" id="offlineSuccessOkBtn">OK</button></div>`}'
    'if(!s.running&&s.status!=="done"&&s.status!=="error"&&s.status!=="partial"&&!offlinePrepShouldShowResume())return"";'
    'const p=Math.max(0,Math.min(100,Number(s.percent||0)));'
    'const label=s.running?"Offline-Paket wird vorbereitet":s.status==="partial"?"Offline-Paket fast fertig":s.status==="error"?"Offline-Download unvollständig":"Offline-Paket Status";'
    'const retryNote=offlinePrepNeedsAutoRetry()&&!s.running?`<small>Fehler beim Laden — automatischer Neuversuch (${offlinePrepAutoRetryCount()}/${OFFLINE_PREP_MAX_AUTO_RETRIES}) …</small>`:"";'
    'const resumeBlock=offlinePrepShouldShowResume()?`<button type="button" class="offline-resume-btn" id="offlineResumeBtn">Download fortsetzen</button>`:"";'
    'const failNote=s.failed&&!offlinePrepNeedsAutoRetry()?`<small>${s.failed} Dateien konnten nicht geladen werden. Tippe unten auf „Download fortsetzen“.</small>`:"";'
    'return `<div class="offline-prep-progress"><div class="offline-prep-head"><b>${label}</b><span>${s.loaded||0}/${s.total||0} Dateien · ${p}% · ${storageBytesLabel(s.bytes)}</span></div><div class="offline-prep-bar"><span style="width:${p}%"></span></div>${retryNote}${failNote}${resumeBlock}</div>`}'
)

OLD_UPDATE_BOX = (
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

NEW_UPDATE_BOX = (
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

OLD_DONE_HANDLER = (
    'if(data.type==="OFFLINE_PREPARE_DONE"){offlinePrepBusy=false;const ok=!!data.ok;const partial=!!data.partial;const total=Number(data.total||0),loaded=Number(data.loaded||0);'
    'if(!ok&&total<=0){writeOfflinePrepState({running:false,status:"idle",total:0,loaded:0,failed:0,bytes:0,percent:0,updatedAt:new Date().toISOString()});const hint=$("offlinePrepHint");if(hint)hint.textContent="Offline-Download konnte nicht fortgesetzt werden. Bitte erneut starten.";updateOfflineBox();return}'
    'const finalStatus=ok?(partial?"partial":"done"):"partial";writeOfflinePrepState({running:false,status:finalStatus,total,loaded,failed:Number(data.failed||0),bytes:Number(data.bytes||0),percent:ok&&!partial?100:Number(data.percent||readOfflinePrepState().percent||0),updatedAt:new Date().toISOString()});'
    'setJson(OFFLINE_SYNC_META_KEY,{appVersion:typeof APP_BUILD_ID==="string"?APP_BUILD_ID:"",contentVersion:String(window.__darRemoteBuildId||""),databaseSchemaVersion:OFFLINE_DB_VERSION,lastSuccessfulSync:ok?new Date().toISOString():(getJson(OFFLINE_SYNC_META_KEY,{lastSuccessfulSync:""}).lastSuccessfulSync||""),syncStatus:ok?(partial?"partial":"done"):"partial",pendingLocalChanges:getJson("darOfflineQueueCountV1",0),acknowledgedUpdateVersion:String(window.__darRemoteBuildId||"")});'
    'offlineDbSet("meta","syncStatus",{state:finalStatus,payload:data,at:new Date().toISOString()});const hint=$("offlinePrepHint");'
    'if(hint)hint.textContent=partial?`Offline-Paket fast fertig (${data.failed||0} Dateien fehlgeschlagen). Download kann fortgesetzt werden.`:ok?"Offline-Nutzung vollständig eingerichtet":"Offline-Download kann fortgesetzt werden.";updateOfflineBox();return}'
)

NEW_DONE_HANDLER = (
    'if(data.type==="OFFLINE_PREPARE_DONE"){offlinePrepBusy=false;const ok=!!data.ok;const partial=!!data.partial;const total=Number(data.total||0),loaded=Number(data.loaded||0),failed=Number(data.failed||0);'
    'if(!ok&&total<=0){writeOfflinePrepState({running:false,status:"idle",total:0,loaded:0,failed:0,bytes:0,percent:0,successPending:false,autoRetryCount:0,updatedAt:new Date().toISOString()});const hint=$("offlinePrepHint");if(hint)hint.textContent="Offline-Download konnte nicht fortgesetzt werden. Bitte erneut starten.";updateOfflineBox();return}'
    'const bytes=Number(data.bytes||0),percent=Number(data.percent||readOfflinePrepState().percent||0);'
    'if(ok){if(partial&&failed>0&&!offlinePrepRetriesExhausted()){writeOfflinePrepState({running:false,status:"partial",total,loaded,failed,bytes,percent:percent||100,autoRetryCount:offlinePrepAutoRetryCount()+1,updatedAt:new Date().toISOString()});const hint=$("offlinePrepHint");if(hint)hint.textContent=`${failed} Dateien fehlgeschlagen — automatischer Neuversuch …`;updateOfflineBox();scheduleOfflineAutoRetry(2000);return}'
    'writeOfflinePrepState({running:false,status:"done",total,loaded,failed,bytes,percent:100,autoRetryCount:0,updatedAt:new Date().toISOString()});'
    'setJson(OFFLINE_SYNC_META_KEY,{appVersion:typeof APP_BUILD_ID==="string"?APP_BUILD_ID:"",contentVersion:String(window.__darRemoteBuildId||""),databaseSchemaVersion:OFFLINE_DB_VERSION,lastSuccessfulSync:new Date().toISOString(),syncStatus:"done",pendingLocalChanges:getJson("darOfflineQueueCountV1",0),acknowledgedUpdateVersion:String(window.__darRemoteBuildId||"")});'
    'offlineDbSet("meta","syncStatus",{state:"done",payload:data,at:new Date().toISOString()});const hint=$("offlinePrepHint");if(hint)hint.textContent="Offline-Nutzung vollständig eingerichtet";showOfflineSuccessPending({total,loaded,failed,bytes});return}'
    'if(!offlinePrepRetriesExhausted()){writeOfflinePrepState({running:false,status:"partial",total,loaded,failed,bytes,percent,autoRetryCount:offlinePrepAutoRetryCount()+1,updatedAt:new Date().toISOString()});updateOfflineBox();scheduleOfflineAutoRetry(2000);return}'
    'if(total>0&&loaded/total>=0.9){writeOfflinePrepState({running:false,status:"done",total,loaded,failed,bytes,percent:100,updatedAt:new Date().toISOString()});showOfflineSuccessPending({total,loaded,failed,bytes});return}'
    'writeOfflinePrepState({running:false,status:"error",total,loaded,failed,bytes,percent,updatedAt:new Date().toISOString()});updateOfflineBox();return}'
)

OLD_START_PREP = (
    'offlinePrepBusy=true;writeOfflinePrepState({running:true,status:"running",failed:resume?state.failed||0:0,loaded:resume?state.loaded||0:0,total:resume?state.total||0:0,percent:resume?state.percent||0:0,updatedAt:new Date().toISOString()});updateOfflineBox();'
)

NEW_START_PREP = (
    'try{localStorage.removeItem(OFFLINE_PREP_DISMISSED_KEY)}catch(e){}'
    'if(offlinePrepSuccessDismissTimer){clearTimeout(offlinePrepSuccessDismissTimer);offlinePrepSuccessDismissTimer=null}'
    'offlinePrepBusy=true;writeOfflinePrepState({running:true,status:"running",successPending:false,failed:resume?state.failed||0:0,loaded:resume?state.loaded||0:0,total:resume?state.total||0:0,percent:resume?state.percent||0:0,autoRetryCount:resume?state.autoRetryCount||0:0,updatedAt:new Date().toISOString()});updateOfflineBox();'
)

OLD_INIT_TAIL = (
    'if(navigator.onLine){flushOfflineQueue().catch(()=>{});if(offlinePrepShouldResume()&&!window.__darOfflineAutoResumeStarted){window.__darOfflineAutoResumeStarted=true;setTimeout(()=>startOfflinePreparation(true).catch(()=>{}),1800)}}updateOfflineBox();}'
)

NEW_INIT_TAIL = (
    'if(navigator.onLine){flushOfflineQueue().catch(()=>{});const boot=readOfflinePrepState();if(boot.status==="partial"&&boot.percent>=100&&boot.total>0&&!offlinePrepNeedsAutoRetry()&&!boot.successPending){showOfflineSuccessPending({total:boot.total,loaded:boot.loaded,failed:boot.failed,bytes:boot.bytes})}'
    'else if(offlinePrepShouldResume()&&!window.__darOfflineAutoResumeStarted){window.__darOfflineAutoResumeStarted=true;setTimeout(()=>startOfflinePreparation(true).catch(()=>{}),1800)}}updateOfflineBox();}'
)

OLD_CSS = '.offline-prep-bar span{display:block;height:100%;background:linear-gradient(90deg,var(--gold),var(--gold2))}'
NEW_CSS = (
    '.offline-prep-bar span{display:block;height:100%;background:linear-gradient(90deg,var(--gold),var(--gold2))}'
    '.offline-prep-success .offline-prep-head b{color:var(--gold2)}'
    '.offline-success-ok{border-color:rgba(120,220,140,.55);background:linear-gradient(180deg,rgba(120,220,140,.24),rgba(60,140,80,.14))}'
)


def patch_file(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    replacements = [
        (OLD_STATE_BLOCK, NEW_STATE_BLOCK),
        (OLD_STATUS_LINE, NEW_STATUS_LINE),
        (OLD_PROGRESS_HTML, NEW_PROGRESS_HTML),
        (OLD_UPDATE_BOX, NEW_UPDATE_BOX),
        (OLD_DONE_HANDLER, NEW_DONE_HANDLER),
        (OLD_START_PREP, NEW_START_PREP),
        (OLD_INIT_TAIL, NEW_INIT_TAIL),
        (OLD_CSS, NEW_CSS),
    ]
    for old, new in replacements:
        if old not in text:
            raise SystemExit(f"Missing expected block in {path}: {old[:80]}...")
        text = text.replace(old, new, 1)
    path.write_text(text, encoding="utf-8")
    print(f"Patched {path}")


def main() -> None:
    for f in FILES:
        patch_file(f)


if __name__ == "__main__":
    main()
