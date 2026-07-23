#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const TARGETS = ["index.html", "test/index.html"];

const OLD_CURRENT_IDS =
  'function currentOneSignalPushIds(OS){const sub=OS?.User?.PushSubscription||{};return{externalId:localStorage.getItem(PUSH_USER_KEY)||"",subscriptionId:String(sub.id||""),token:String(sub.token||"")}}';

const NEW_PUSH_HELPERS = `function readOneSignalPushSubscriptionState(OS){
  const sub=OS?.User?.PushSubscription||{};
  let subscriptionId=String(sub.id||"").trim();
  if(!subscriptionId){try{subscriptionId=String(prayerPushDebug().subscriptionId||"").trim()}catch(e){}}
  const token=String(sub.token||"").trim();
  const optedIn=Boolean(sub.optedIn);
  return {subscriptionId,token,optedIn,ready:Boolean(subscriptionId&&optedIn)};
}
async function waitForPushSubscriptionReady(OS,{timeoutMs=25000,request=false}={}){
  const os=OS||await waitForOneSignalReady(timeoutMs);
  if(!os?.User?.PushSubscription)return {os:null,externalId:localStorage.getItem(PUSH_USER_KEY)||"",subscriptionId:"",token:"",optedIn:false,ready:false};
  await ensureOneSignalPushSubscription(os,{timeoutMs,request:Boolean(request)});
  const sub=os.User.PushSubscription;
  const start=Date.now();
  let state=readOneSignalPushSubscriptionState(os);
  while(!state.ready&&Date.now()-start<timeoutMs){
    await sleep(300);
    state=readOneSignalPushSubscriptionState(os);
    if(!state.optedIn&&request&&typeof sub.optIn==="function"){try{await sub.optIn()}catch(e){}}
  }
  if(!state.ready&&typeof sub.addEventListener==="function"){
    const remaining=Math.max(0,timeoutMs-(Date.now()-start));
    if(remaining>0){
      state=await new Promise(resolve=>{
        let settled=false;
        const done=(v)=>{if(settled)return;settled=true;try{sub.removeEventListener("change",onChange)}catch(e){}resolve(v)};
        const onChange=()=>{const s=readOneSignalPushSubscriptionState(os);if(s.ready)done(s)};
        sub.addEventListener("change",onChange);
        setTimeout(()=>done(readOneSignalPushSubscriptionState(os)),remaining);
        const now=readOneSignalPushSubscriptionState(os);
        if(now.ready)done(now);
      });
    }
  }
  return {os,externalId:localStorage.getItem(PUSH_USER_KEY)||"",...state};
}
function currentOneSignalPushIds(OS){const state=readOneSignalPushSubscriptionState(OS);return{externalId:localStorage.getItem(PUSH_USER_KEY)||"",subscriptionId:state.subscriptionId,token:state.token}}`;

const OLD_GET_STATUS = `function getPushConnectionStatus(){
  const permission=getNotificationPermission();
  const optedIn=Boolean(window.OneSignal?.User?.PushSubscription?.optedIn);
  const subId=String(window.OneSignal?.User?.PushSubscription?.id||"").trim();
  const pwa=isStandalonePwa();
  const ios=isIOSDevice();
  return {permission,optedIn,subId,pwa,ios,serverOk:optedIn&&!!subId,ready:permission==="granted"&&optedIn&&!!subId&&(!ios||pwa)};
}`;

const NEW_GET_STATUS = `function getPushConnectionStatus(){
  const permission=getNotificationPermission();
  const state=readOneSignalPushSubscriptionState(window.OneSignal);
  const optedIn=state.optedIn;
  const subId=state.subscriptionId;
  const pwa=isStandalonePwa();
  const ios=isIOSDevice();
  return {permission,optedIn,subId,pwa,ios,serverOk:optedIn&&!!subId,ready:permission==="granted"&&optedIn&&!!subId&&(!ios||pwa)};
}`;

const OLD_RENDER_STATUS_TAIL = `  return \`<details class="prayer-push-status"><summary>Push-Status auf diesem Gerät</summary><div class="prayer-push-status-body"><div class="prayer-push-status-grid">\${rows.map(([label,ok,val])=>\`<div class="prayer-push-status-item \${ok?"ok":"warn"}"><b>\${esc(label)}</b><span>\${esc(String(val))}</span></div>\`).join("")}</div><p class="prayer-push-status-note">Bei rotem Status: Startseite → Aktualisieren. Ein Klick stellt Push und Inhalte wieder her.</p></div></details>\`;
}`;

const NEW_RENDER_STATUS_TAIL = `  return \`<details class="prayer-push-status"><summary>Push-Status auf diesem Gerät</summary><div class="prayer-push-status-body"><div class="prayer-push-status-grid">\${rows.map(([label,ok,val])=>\`<div class="prayer-push-status-item \${ok?"ok":"warn"}"><b>\${esc(label)}</b><span>\${esc(String(val))}</span></div>\`).join("")}</div><p class="prayer-push-status-note">Bei rotem Status: Startseite → Aktualisieren. Ein Klick stellt Push und Inhalte wieder her.</p></div></details>\`;
}
function refreshPushConnectionStatusUI(){
  try{
    const root=document.querySelector(".prayer-push-status .prayer-push-status-grid");
    if(!root)return;
    const s=getPushConnectionStatus();
    const rows=[
      ["App gespeichert",s.pwa||!s.ios,s.pwa?"Home-Bildschirm":(s.ios?"Safari-Tab – bitte speichern":"Browser")],
      ["Erlaubnis",s.permission==="granted",s.permission==="granted"?"erlaubt":s.permission],
      ["Server verbunden",s.serverOk,s.serverOk?\`…\${s.subId.slice(-8)}\`:"fehlt – Aktualisieren"]
    ];
    root.innerHTML=rows.map(([label,ok,val])=>\`<div class="prayer-push-status-item \${ok?"ok":"warn"}"><b>\${esc(label)}</b><span>\${esc(String(val))}</span></div>\`).join("");
  }catch(e){}
}`;

const OLD_WELCOME_SEND = `async function sendWelcomePushIfNeeded(OS){
  try{
    const os=OS||await waitForOneSignalReady(8000);
    const subId=String(os?.User?.PushSubscription?.id||"").trim();
    if(!subId||!os?.User?.PushSubscription?.optedIn)return false;`;

const NEW_WELCOME_SEND = `async function sendWelcomePushIfNeeded(OS){
  try{
    const resolved=await waitForPushSubscriptionReady(OS,{timeoutMs:20000,request:false});
    const subId=resolved.subscriptionId;
    if(!subId||!resolved.optedIn)return false;
    const os=resolved.os;`;

const OLD_OS_CHANGE =
  'try{OneSignal.User?.PushSubscription?.addEventListener?.("change",()=>{syncPushRegistrationOnly().catch(()=>{})})}catch(e){}';

const NEW_OS_CHANGE =
  'try{OneSignal.User?.PushSubscription?.addEventListener?.("change",()=>{syncPushRegistrationOnly().catch(()=>{});try{refreshPushConnectionStatusUI()}catch(e){}try{updatePushFloatButton()}catch(e){}})}catch(e){}';

const OLD_TEST_BLOCK = `    await ensureOneSignalServiceWorkerReady();
    let OS=await waitForOneSignalReady(12000);
    if(OS){
      await ensurePushUserLogin(OS);
      if(settings.reminder&&hasPrayerLocation(settings))await syncPrayerPushTags(settings,{retries:3});
      else{await ensureOneSignalPushSubscription(OS,{timeoutMs:20000,request:false});await savePushRegistration(settings,OS)}
    }
    let subId=String(OS?.User?.PushSubscription?.id||"").trim();
    let optedIn=Boolean(OS?.User?.PushSubscription?.optedIn);
    let serverOk=false;
    let serverReason="";
    if(subId&&optedIn){
      let test=await requestServerPrayerTest(subId,prayerKey,mode,settings);
      if(test.ok){serverOk=true}else{
        serverReason=test.reason;
        const repaired=await repairPushConnection({silent:true});
        if(repaired.ok){
          OS=await waitForOneSignalReady(8000);
          subId=String(OS?.User?.PushSubscription?.id||"").trim();
          optedIn=Boolean(OS?.User?.PushSubscription?.optedIn);
          if(subId&&optedIn){
            test=await requestServerPrayerTest(subId,prayerKey,mode,settings);
            if(test.ok)serverOk=true;else serverReason=test.reason;
          }
        }
      }
    }else{serverReason="Push-Verbindung zum Server fehlt (keine gültige Geräte-ID)."}`;

const NEW_TEST_BLOCK = `    await ensureOneSignalServiceWorkerReady();
    let resolved=await waitForPushSubscriptionReady(null,{timeoutMs:20000,request:true});
    if(!resolved.ready){
      await repairPushConnection({silent:true});
      resolved=await waitForPushSubscriptionReady(null,{timeoutMs:20000,request:true});
    }
    let OS=resolved.os;
    if(OS){
      await ensurePushUserLogin(OS);
      if(settings.reminder&&hasPrayerLocation(settings))syncPrayerPushTags(settings,{retries:3}).catch(()=>{});
      else savePushRegistration(settings,OS).catch(()=>{});
    }
    let subId=resolved.subscriptionId;
    let optedIn=resolved.optedIn;
    let serverOk=false;
    let serverReason="";
    if(subId&&optedIn){
      let test=await requestServerPrayerTest(subId,prayerKey,mode,settings);
      if(test.ok){serverOk=true}else{
        serverReason=test.reason;
        const repaired=await repairPushConnection({silent:true});
        if(repaired.ok){
          resolved=await waitForPushSubscriptionReady(OS,{timeoutMs:15000,request:false});
          OS=resolved.os||OS;
          subId=resolved.subscriptionId||String(repaired.subscriptionId||"").trim();
          optedIn=resolved.optedIn;
          if(subId&&optedIn){
            test=await requestServerPrayerTest(subId,prayerKey,mode,settings);
            if(test.ok)serverOk=true;else serverReason=test.reason;
          }
        }
      }
    }else{serverReason="Push-Verbindung zum Server fehlt (keine gültige Geräte-ID). Bitte Startseite → Aktualisieren."}`;

const OLD_REPAIR_IDS = `  const ids=currentOneSignalPushIds(OS);
  const ok=Boolean(subscribed&&ids.subscriptionId&&(!isIOSDevice()||isStandalonePwa()));`;

const NEW_REPAIR_IDS = `  const resolved=await waitForPushSubscriptionReady(OS,{timeoutMs:12000,request:false});
  const ids=currentOneSignalPushIds(resolved.os||OS);
  const ok=Boolean(subscribed&&ids.subscriptionId&&resolved.optedIn&&(!isIOSDevice()||isStandalonePwa()));`;

function replaceOnce(content, oldStr, newStr, label) {
  if (!content.includes(oldStr)) throw new Error(`${label}: marker not found`);
  return content.replace(oldStr, newStr);
}

for (const file of TARGETS) {
  const filePath = path.join(ROOT, file);
  let html = fs.readFileSync(filePath, "utf8");
  html = replaceOnce(html, OLD_CURRENT_IDS, NEW_PUSH_HELPERS, `${file} currentOneSignalPushIds`);
  html = replaceOnce(html, OLD_GET_STATUS, NEW_GET_STATUS, `${file} getPushConnectionStatus`);
  html = replaceOnce(html, OLD_RENDER_STATUS_TAIL, NEW_RENDER_STATUS_TAIL, `${file} renderPushConnectionStatus`);
  html = replaceOnce(html, OLD_WELCOME_SEND, NEW_WELCOME_SEND, `${file} sendWelcomePushIfNeeded`);
  html = replaceOnce(html, OLD_OS_CHANGE, NEW_OS_CHANGE, `${file} OneSignal change listener`);
  html = replaceOnce(html, OLD_TEST_BLOCK, NEW_TEST_BLOCK, `${file} sendPrayerTestNotification`);
  html = replaceOnce(html, OLD_REPAIR_IDS, NEW_REPAIR_IDS, `${file} repairPushConnection`);
  fs.writeFileSync(filePath, html);
  console.log(`patched ${file}`);
}

const versionFiles = {
  "version.json": { buildId: "app-shell-v369", note: "v369 · Push-Geräte-ID zuverlässig auflösen + Server-Test-Reparatur" },
  "test/version.json": {
    buildId: "app-shell-v369-test",
    note: "Test-App v369-test · Push-Geräte-ID zuverlässig auflösen + Server-Test-Reparatur"
  }
};

for (const [file, patch] of Object.entries(versionFiles)) {
  const filePath = path.join(ROOT, file);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  Object.assign(data, patch, { updatedAt: new Date().toISOString() });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
  console.log(`updated ${file}`);
}

const swPath = path.join(ROOT, "service-worker.js");
let sw = fs.readFileSync(swPath, "utf8");
sw = sw.replace(/app-shell-v\d+(?:-test)?/g, (m) => (m.includes("-test") ? "app-shell-v369-test" : "app-shell-v369"));
fs.writeFileSync(swPath, sw);
console.log("updated service-worker.js");
