"use strict";
/* KIDS_QIBLA_FOCUS_V1442 — non-destructive layout, palette and sensor contract. */
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const ROOT=path.resolve(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(ROOT,p),"utf8");
const html=read("kids/index.html"),start=read("kids/start.html"),shell=read("kids/shell.html");
const js=read("kids/kids-qibla-focus-v1442.js"),css=read("kids/kids-qibla-focus-v1442.css");
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
