#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const OLD_ALREADY_SENT = `function welcomePushAlreadySent(subId){if(!subId)return true;try{if(localStorage.getItem(welcomePushStorageKey(subId))==="1")return true;if(localStorage.getItem(WELCOME_PUSH_SENT_KEY)==="1")return true}catch(e){}return false}`;
const NEW_ALREADY_SENT = `function welcomePushAlreadySent(subId){if(!subId)return true;try{if(localStorage.getItem(welcomePushStorageKey(subId))==="1")return true}catch(e){}return false}`;

const OLD_SEND = `async function sendWelcomePushIfNeeded(OS){
  try{
    const os=OS||await waitForOneSignalReady(8000);
    const subId=String(os?.User?.PushSubscription?.id||"").trim();
    if(!subId||!os?.User?.PushSubscription?.optedIn)return false;
    if(welcomePushAlreadySent(subId))return false;
    if(welcomePushInFlight)return false;
    welcomePushInFlight=true;
    const r=await fetch(\`\${PRAYER_PUSH_WORKER_URL}/api/push/welcome\`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({subscriptionId:subId})});
    const data=await r.json().catch(()=>({}));
    if(r.ok){markWelcomePushSent(subId);return Boolean(data.sent)}
  }catch(e){console.warn("Willkommens-Push:",e)}finally{welcomePushInFlight=false}
  return false;
}`;

const NEW_SEND = `async function sendWelcomePushIfNeeded(OS){
  try{
    const os=OS||await waitForOneSignalReady(8000);
    const subId=String(os?.User?.PushSubscription?.id||"").trim();
    if(!subId||!os?.User?.PushSubscription?.optedIn)return false;
    if(welcomePushAlreadySent(subId))return false;
    if(welcomePushInFlight)return false;
    welcomePushInFlight=true;
    const r=await fetch(\`\${PRAYER_PUSH_WORKER_URL}/api/push/welcome\`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({subscriptionId:subId})});
    const data=await r.json().catch(()=>({}));
    if(r.ok&&data.sent&&data.delivered!==false){markWelcomePushSent(subId);return true}
    if(!r.ok||!data.sent)console.warn("Willkommens-Push nicht zugestellt:",data.reason||r.status);
  }catch(e){console.warn("Willkommens-Push:",e)}finally{welcomePushInFlight=false}
  return false;
}`;

const OLD_MAINTAIN = `if(OS?.User?.PushSubscription?.optedIn){await syncPushRegistrationOnly(OS)}`;
const NEW_MAINTAIN = `if(OS?.User?.PushSubscription?.optedIn){await syncPushRegistrationOnly(OS);await sendWelcomePushIfNeeded(OS)}`;

const OLD_REPAIR_TAIL = `  setPrayerPushDebug({repairAt:new Date().toISOString(),subscriptionId:ids.subscriptionId,repairOk:ok});
  updatePushFloatButton();
  if(!silent){
    if(ok)alert("✓ Push-Verbindung repariert.\\n\\nBitte jetzt „Test senden“ antippen und Sperrbildschirm prüfen.");
    else alert("Push konnte nicht vollständig repariert werden:\\n\\n"+issues.join("\\n")+(isIOSDevice()&&!isStandalonePwa()?"\\n\\nWichtig: App vom Home-Bildschirm-Icon öffnen, nicht aus Safari.":""));
  }
  return {ok,issues,subscriptionId:ids.subscriptionId};
}`;

const NEW_REPAIR_TAIL = `  setPrayerPushDebug({repairAt:new Date().toISOString(),subscriptionId:ids.subscriptionId,repairOk:ok});
  updatePushFloatButton();
  let welcomed=false;
  if(ok){
    const freshOS=await waitForOneSignalReady(8000);
    if(!silent){try{const repairSub=String(freshOS?.User?.PushSubscription?.id||ids.subscriptionId||"").trim();if(repairSub)localStorage.removeItem(welcomePushStorageKey(repairSub))}catch(e){}}
    welcomed=await sendWelcomePushIfNeeded(freshOS||OS);
  }
  if(!silent){
    if(ok&&welcomed)alert("✓ Push-Verbindung repariert – Willkommens-Nachricht wurde gesendet.\\n\\nBitte Sperrbildschirm prüfen.");
    else if(ok)alert("✓ Push-Verbindung repariert.\\n\\nBitte jetzt „Test senden“ antippen und Sperrbildschirm prüfen.");
    else alert("Push konnte nicht vollständig repariert werden:\\n\\n"+issues.join("\\n")+(isIOSDevice()&&!isStandalonePwa()?"\\n\\nWichtig: App vom Home-Bildschirm-Icon öffnen, nicht aus Safari.":""));
  }
  return {ok,issues,subscriptionId:ids.subscriptionId,welcomed};
}`;

const OLD_ACTIVATE_BLOCK = `      if(OS&&subscribed){
        await ensurePostPushTags(OS);
        await syncDailyPushTags(getPrayerSettings(),{ensureOptIn:false});
        await savePushRegistration(getPrayerSettings(),OS);
      }
    }
    const ok=await syncPrayerPushTags(getPrayerSettings(),{retries:5});`;

const NEW_ACTIVATE_BLOCK = `      if(OS&&subscribed){
        await ensurePostPushTags(OS);
        await syncDailyPushTags(getPrayerSettings(),{ensureOptIn:false});
        await savePushRegistration(getPrayerSettings(),OS);
        await sendWelcomePushIfNeeded(OS);
      }
    }
    const ok=await syncPrayerPushTags(getPrayerSettings(),{retries:5});`;

function apply(file) {
  let html = fs.readFileSync(file, 'utf8');
  const steps = [
    [OLD_ALREADY_SENT, NEW_ALREADY_SENT],
    [OLD_SEND, NEW_SEND],
    [OLD_MAINTAIN, NEW_MAINTAIN],
    [OLD_REPAIR_TAIL, NEW_REPAIR_TAIL],
    [OLD_ACTIVATE_BLOCK, NEW_ACTIVATE_BLOCK],
  ];
  for (const [oldStr, newStr] of steps) {
    if (!html.includes(oldStr)) throw new Error(`Pattern missing in ${file}`);
    html = html.replace(oldStr, newStr);
  }
  fs.writeFileSync(file, html);
  console.log(`Applied welcome-push-delivery-fix to ${path.relative(ROOT, file)}`);
}

for (const rel of ['index.html', 'test/index.html']) {
  apply(path.join(ROOT, rel));
}
