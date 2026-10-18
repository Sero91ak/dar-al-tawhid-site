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
console.log("PASS: staging-only notification settings, 5 prayers, Qibla, local iOS bridge and safe visitor guard");
