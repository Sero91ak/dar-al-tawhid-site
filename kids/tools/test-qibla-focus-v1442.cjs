"use strict";
/* KIDS_QIBLA_FOCUS_V1442 — non-destructive layout, palette and sensor contract. */
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const ROOT=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
const html=read("kids/index.html"),start=read("kids/start.html"),shell=read("kids/shell.html");
const js=read("kids/kids-qibla-focus-v1442.js"),css=read("kids/kids-qibla-focus-v1442.css");
const plist=read("ios/DarAlTawhidKids/DarAlTawhidKids/Info.plist");
const contract=read("kids/kids-profile-layout-contract-v1447.css");
const serviceWorker=read("kids/sw.js");
const version=JSON.parse(read("kids/version.json"));
assert(plist.includes("<key>NSLocationWhenInUseUsageDescription</key>"),"Kids native GPS usage purpose is missing");
assert(plist.includes("<key>NSMotionUsageDescription</key>"),"Kids native motion purpose is missing");
assert(contract.includes("#view-parents.view > :not(.page-head)"),"new parent cards must inherit the container width");
assert(contract.includes("#kidsParentResume.kids-parent-resume"),"recently played must use the parent card rhythm");
assert(contract.includes("#kidsVisitorSettingsEntry.parent-card"),"notification entry must use parent palette");
assert(contract.includes("body:has(.app[data-gender="),"body-mounted girl panels inherit active profile");
assert(contract.includes(".ps-library-page .ps-story-row::before"),"girl story book overlay recoloured, image retained");
assert(contract.includes("--kids-ui-surface"),"new kids UI has semantic palette");
assert(!contract.includes("filter:grayscale")&&!contract.includes("filter:luminosity"),"illustrations retain their colours");
assert.equal(version.visualSystem.serviceWorkerCache,"v1447","manifest matches SW cache");
assert(serviceWorker.includes("dar-al-tawhid-kids-v1447"),"new SW cache version activated");
for(const asset of ["kids-qibla-focus-v1442.js?v=1442","kids-qibla-focus-v1442.css?v=1442","kids-profile-layout-contract-v1447.css?v=1447"])
 assert(serviceWorker.includes(asset),"missing offline precache: "+asset);
assert(html.includes("kids-profile-layout-contract-v1447.css?v=1447"),"latest profile colour authority not loaded");
assert.equal(html,start,"Kids start and index must be identical");
assert.equal(html,shell,"Kids shell and index must be identical");
assert.doesNotThrow(()=>new Function(js),"Qibla controller is valid JavaScript");
assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length,"CSS braces balance");
for(const asset of ["kids-qibla-focus-v1442.js?v=1442","kids-qibla-focus-v1442.css?v=1442"])
 assert(html.includes(asset),"missing new asset "+asset);
assert(html.indexOf("parent-notifications-visitor-v1.js")<html.lastIndexOf("kids-qibla-focus-v1442.js"),
 "Qibla entry needs to mount after the existing parents module");
for(const marker of ["kidsSalahOpenDay","kids-salah-shortcuts","kidsQiblaFocus",
 "getCurrentPosition","enableHighAccuracy:true","deviceorientationabsolute",
 "webkitCompassHeading","requestPermission","app.inert=true","stopCompass()",
 'data-gender="girl"',"kidsVisitorSettingsIntro","childList:true",
 "document.body.classList.remove","kids-salah-shortcuts"]){
 assert((js+css).includes(marker),"missing safeguard: "+marker);
}
for(const prohibited of ["location.reload(", "window.location.href=", "navigator.serviceWorker.register(",
 "OneSignal","DAR_PUSH","kids.profiles.v1"]){
 assert(!js.includes(prohibited),"unrelated/native/push functionality touched: "+prohibited);
}
const rad=n=>n*Math.PI/180;
const qibla=(lat,lon)=>{
 const a=rad(lat),b=rad(21.4225),delta=rad(39.8262-lon);
 return (Math.atan2(Math.sin(delta)*Math.cos(b),
  Math.cos(a)*Math.sin(b)-Math.sin(a)*Math.cos(b)*Math.cos(delta))*180/Math.PI+360)%360;
};
assert(Math.abs(qibla(50.626,6.95)-126.4)<0.5,"Rheinbach geographic bearing is about 126.4 degrees");
console.log("PASS Kids Qibla focus: structure, palette, GPS/sensor gate, and regression guard");
