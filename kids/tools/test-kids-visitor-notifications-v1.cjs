"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const root=path.resolve(__dirname,"../.."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const html=["kids/index.html","kids/start.html","kids/shell.html"].map(read);
assert.equal(new Set(html).size,1,"All production Kids HTML entrypoints must be exactly identical");
for(const doc of html) {
  assert.ok(doc.includes("/kids/parent-notifications-visitor-v1.js?v=1"));
  assert.ok(doc.includes("/kids/parent-notifications-visitor-v1.css?v=1"));
  assert.ok(doc.includes('id="view-parents"'));
}
const code=read("kids/parent-notifications-visitor-v1.js");
new Function(code);
const css=read("kids/parent-notifications-visitor-v1.css");
const ios=read("ios/DarAlTawhidKids/DarAlTawhidKids/KidsWebAppView.swift");
assert.ok(css.includes("#kidsVisitorSettingsSheet"));
assert.ok(css.includes("#kidsVisitorSettingsIntro"));
assert.ok(css.includes('[data-gender="girl"]'));
assert.ok(code.includes('VISITOR_HOSTS=new Set(["dar-al-tawhid.de","www.dar-al-tawhid.de"])'));
assert.ok(code.includes('window.DAR_KIDS_TEST_CONTAINER===true'));
assert.ok(code.includes('darKidsVisitorNotifications'));
assert.ok(!code.includes("dar-al-tawhid-kids-creator.sero91ak.workers.dev"));
assert.ok(!code.includes("OneSignal.initialize")&&!code.includes("api.onesignal.com"));
assert.ok(!code.includes("ONESIGNAL_KIDS_API_KEY"));
assert.ok(!code.includes("KIDS TEST"));
assert.ok(code.includes("kids.visitor.notify.preferences.v1"));
assert.ok(code.includes("kids.visitor.qibla.place.v1"));
assert.ok(code.includes("darkids_kids_prayer_place_v1"));
assert.ok(code.includes("darkids_kids_prayer_days_v1"));
assert.ok(code.includes('action:"syncSchedule"'));
assert.ok(code.includes("48*3600000"));
assert.ok(code.includes("DeviceOrientationEvent.requestPermission"));
assert.ok(code.includes("geocoding-api.open-meteo.com"));
for(const prayer of ["fajr","dhuhr","asr","maghrib","isha"])assert.ok(code.includes('["'+prayer+'"'));
assert.ok(ios.includes('name: "darKidsVisitorNotifications"'));
assert.ok(ios.includes('case "darKidsVisitorNotifications":'));
assert.ok(ios.includes('case "syncSchedule":'));
assert.ok(ios.includes('kids.visitor.salah.'));
assert.ok(ios.includes('TimeZone(secondsFromGMT: 0)'));
assert.ok(ios.includes("UNUserNotificationCenter.current()"));
assert.ok(ios.includes("center.requestAuthorization"));
assert.ok(ios.includes("#if !KIDS_CREATOR_TEST"));
const noDomContext={
  location:{hostname:"dar-al-tawhid-kids-creator.sero91ak.workers.dev",pathname:"/kids/start"},
  window:{DAR_KIDS_TEST_CONTAINER:true},
  document:new Proxy({}, {get(){throw new Error("visitor code touched creator DOM")}})
};
vm.runInNewContext(code,noDomContext,{timeout:1000});
const source=code.match(/function qiblaBearing\(p\)\{[\s\S]*?\n\}/);
assert.ok(source,"Qibla calculation must exist");
const degrees=vm.runInNewContext(source[0]+";qiblaBearing({lat:50.6256,lon:6.9491})",{}, {timeout:1000});
assert.ok(degrees>120&&degrees<135,"Qibla plausible SE (~126°) at Rheinbach");
const timeSource=code.match(/function localPrayerMillis\(day,hm,tz\)\{[\s\S]*?\n\}/);
assert.ok(timeSource);
const moment=new Function(timeSource[0]+"\nreturn localPrayerMillis;")();
assert.equal(moment("2026-10-18","05:00","Europe/Berlin"),Date.parse("2026-10-18T03:00:00Z"));
assert.equal(moment("2026-12-18","05:00","Europe/Berlin"),Date.parse("2026-12-18T04:00:00Z"));
assert.equal(moment("2026-03-29","05:00","Europe/Berlin"),Date.parse("2026-03-29T03:00:00Z"));
console.log("PASS: visitor-only parent settings, native bridge isolation, five prayers, Qibla and DST");
