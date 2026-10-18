"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const read=p=>fs.readFileSync(path.resolve(__dirname,"../..",p),"utf8");
const html=["kids/index.html","kids/start.html","kids/shell.html"].map(read);
assert.equal(new Set(html).size,1,"All Kids HTML entrypoints must stay exactly identical");
const js=read("kids/parent-notifications-visitor-v1.js");
const css=read("kids/parent-notifications-visitor-v1.css");
new Function(js);
for(const p of html){
  assert.ok(p.includes("/kids/parent-notifications-visitor-v1.css?v=1"));
  assert.ok(p.includes("/kids/parent-notifications-visitor-v1.js?v=1"));
  assert.ok(p.includes('id="view-parents"'));
}
assert.ok(js.includes('VISITOR_HOSTS=new Set(["dar-al-tawhid.de","www.dar-al-tawhid.de"])'));
assert.ok(js.includes('window.DAR_KIDS_TEST_CONTAINER===true'));
assert.ok(js.includes('darKidsVisitorNotifications'));
assert.ok(js.includes("kids.visitor.notify.preferences.v1"));
assert.ok(js.includes("kids.visitor.qibla.place.v1"));
assert.ok(js.includes("darkids_kids_prayer_place_v1"));
assert.ok(js.includes("darkids_kids_prayer_days_v1"));
assert.ok(js.includes("kidsVisitorSettingsEntry"));
assert.ok(js.includes("kidsVisitorSettingsSheet"));
assert.ok(js.includes("DeviceOrientationEvent.requestPermission"));
assert.ok(js.includes("geocoding-api.open-meteo.com"));
assert.ok(!js.includes("api.onesignal.com")&&!js.includes("OneSignal.initialize"));
assert.ok(!js.includes("ONESIGNAL_KIDS_API_KEY"));
for(const prayer of ["fajr","dhuhr","asr","maghrib","isha"])assert.ok(js.includes('["'+prayer+'"'));
assert.ok(css.includes("#kidsVisitorSettingsEntry"));
assert.ok(css.includes("prefers-reduced-motion"));
assert.ok(css.includes('[data-gender="girl"]'));
vm.runInNewContext(js,{
 location:{hostname:"dar-al-tawhid-kids-creator.sero91ak.workers.dev",pathname:"/kids/start"},
 window:{DAR_KIDS_TEST_CONTAINER:true},
 document:new Proxy({},{get(){throw Error("Must not touch creator or adult DOM")}})
},{timeout:1000});
const q=js.match(/function qiblaBearing\(p\)\{[\s\S]*?\n\}/);
assert.ok(q);
const direction=vm.runInNewContext(q[0]+";qiblaBearing({lat:50.6256,lon:6.9491})",{}, {timeout:1000});
assert.ok(direction>120&&direction<135);
const t=js.match(/function localPrayerMillis\(day,hm,tz\)\{[\s\S]*?\n\}/);
assert.ok(t);
const utc=new Function(t[0]+"\nreturn localPrayerMillis;")();
assert.equal(utc("2026-10-18","05:00","Europe/Berlin"),Date.parse("2026-10-18T03:00:00Z"));
assert.equal(utc("2026-12-18","05:00","Europe/Berlin"),Date.parse("2026-12-18T04:00:00Z"));
assert.equal(utc("2026-03-29","05:00","Europe/Berlin"),Date.parse("2026-03-29T03:00:00Z"));
console.log("PASS: Kids visitor preferences & Qibla UI, distinct test/adult guards, timezone/DST");
