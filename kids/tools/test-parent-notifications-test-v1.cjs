"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const root = path.resolve(__dirname, "../..");
const read = p => fs.readFileSync(path.join(root,p),"utf8");
const ui = read("kids/parent-notifications-test-v1.js");
const styles = read("kids/parent-notifications-test-v1.css");
const native = read("ios/DarAlTawhidKids/DarAlTawhidKids/KidsWebAppView.swift");
const pages = ["kids/start.html","kids/index.html","kids/shell.html"].map(read);
assert.equal(new Set(pages).size,1,"Kids HTML must remain identical");
assert.ok(styles.includes("#kidsTestSettingsSheet"));
assert.ok(styles.includes('.app[data-gender="girl"]'));
assert.ok(styles.includes("min-height:44px"));
assert.ok(styles.includes("prefers-reduced-motion"));
for(const html of pages) {
  assert.ok(html.includes("/kids/parent-notifications-test-v1.js?v=1"));
  assert.ok(html.includes("/kids/parent-notifications-test-v1.css?v=1"));
  assert.ok(html.includes('id="view-parents"'));
}
assert.ok(ui.includes('dar-al-tawhid-kids-creator.sero91ak.workers.dev'));
assert.ok(ui.includes("window.DAR_KIDS_TEST_CONTAINER!==true"));
assert.ok(ui.includes("darKidsTestNotifications"));
assert.ok(ui.includes("darkids_kids_prayer_place_v1"));
assert.ok(ui.includes("darkids_kids_prayer_days_v1"));
assert.ok(ui.includes("geocoding-api.open-meteo.com"));
assert.ok(ui.includes("21.4225")&&ui.includes("39.8262"));
assert.ok(ui.includes("DeviceOrientationEvent.requestPermission"));
assert.ok(ui.includes("knPermissionRequest"));
assert.ok(ui.includes("knSendTest"));
assert.ok(ui.includes("kids.test.notify.preferences.v1"));
assert.ok(ui.includes("kids.test.notify.welcome.v1"));
assert.ok(ui.includes("notification-preferences-changed"));
for (const prayer of ["fajr","dhuhr","asr","maghrib","isha"])
  assert.ok(ui.includes('["'+prayer+'"'));
assert.ok(!ui.includes("OneSignal.initialize"));
assert.ok(!ui.includes("api.onesignal.com"));
assert.ok(!ui.includes("ONESIGNAL_KIDS_API_KEY"));
assert.ok(native.includes('name: "darKidsTestNotifications"'));
assert.ok(native.includes('case "darKidsTestNotifications":'));
assert.ok(native.includes("UNUserNotificationCenter.current()"));
assert.ok(native.includes("UNTimeIntervalNotificationTrigger(timeInterval: 5"));
assert.ok(ui.includes('action:"syncSchedule"'), "local Salah sync from actual stored prayer times");
assert.ok(ui.includes("48*3600000"), "only 48-hour local reminder horizon");
assert.ok(native.includes('case "syncSchedule":'), "native creator bridge must schedule");
assert.ok(native.includes('components.timeZone = TimeZone(secondsFromGMT: 0)'), "native time zones must be explicit");
assert.ok(native.includes('kids.creator.salah.'), "only creator-scope local reminders");
assert.ok(ui.includes('oldPermission!=="granted"'), "notification status must not produce a scheduling loop");
assert.ok(native.includes("authorizationStatus"));
assert.ok(native.includes('#if KIDS_CREATOR_TEST'));
assert.ok(!native.includes("OneSignal.initialize"));
// Evaluation on visitor host should perform no DOM, storage, native calls.
const ctx={
  location:{hostname:"dar-al-tawhid.de"},
  window:{DAR_KIDS_TEST_CONTAINER:false},
  document:new Proxy({}, {get(){throw Error("Visitor UI must not be accessed")}})
};
vm.runInNewContext(ui, ctx, {timeout:1200});
// Independent great-circle Qibla calculation: Bonn region is SE (~127°).
const snippet=ui.match(/function qiblaBearing\(p\)\{[\s\S]*?\n\}/);
assert.ok(snippet,"Qibla function exists");
const bearing=vm.runInNewContext(snippet[0]+";qiblaBearing({lat:50.6256,lon:6.9491})",{}, {timeout:1000});
assert.ok(bearing>120&&bearing<135,"Rheinbach Qibla bearing must be approximately 127°");
async function testPrayerAPI(){
// Mock creator-only prayer API; no real network and no privileged APIs.
const workerSource=read("kids/creator-test/worker.js");
const program=new vm.Script(workerSource.replace("export default {","const worker = {")+"\nworker");
let upstreamCount=0,upstreamURL="";
const mock={
 URL,Headers,Response,
 fetch:async target=>{
  upstreamCount++;upstreamURL=String(target);
  return new Response(JSON.stringify({ok:true,times:{fajr:{time:"05:04"}}}),{
   status:200,headers:{"content-type":"application/json"}
  });
 }
};
const worker=program.runInNewContext(mock);
const apiURL="https://dar-al-tawhid-kids-creator.sero91ak.workers.dev/api/prayer/times?lat=50.6256&lon=6.9491&tz=Europe%2FBerlin&angle=12&asr=1&date=2026-10-18";
const valid=await worker.fetch(new Request(apiURL),{});
assert.equal(valid.status,200,"read-only prayer calculation available in creator test");
assert.equal((await valid.json()).times.fajr.time,"05:04");
assert.equal(upstreamCount,1);
assert.ok(upstreamURL.startsWith("https://dar-admin-publisher.sero91ak.workers.dev/api/prayer/times?"));
const bad=await worker.fetch(new Request(apiURL.replace("lat=50.6256","lat=999")),{});
assert.equal(bad.status,400,"invalid coordinates rejected before upstream");
assert.equal(upstreamCount,1);
const denied=await worker.fetch(new Request(apiURL,{method:"POST"}),{});
assert.equal(denied.status,405,"no API writes from creator test");
assert.equal(upstreamCount,1);

}
testPrayerAPI().then(()=>{
console.log("PASS: staging-only notification settings, 5 prayers, Qibla, local iOS bridge and safe visitor guard");
}).catch(err=>{console.error(err);process.exitCode=1});
