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
assert.equal(version.visualSystem.serviceWorkerCache,"v1448","manifest matches SW cache");
assert(serviceWorker.includes("dar-al-tawhid-kids-v1448"),"new SW cache version activated");
for(const asset of ["kids-qibla-focus-v1442.js?v=1448","kids-qibla-focus-v1442.css?v=1448","kids-profile-layout-contract-v1447.css?v=1447"])
 assert(serviceWorker.includes(asset),"missing offline precache: "+asset);
assert(html.includes("kids-profile-layout-contract-v1447.css?v=1447"),"latest profile colour authority not loaded");
assert.equal(html,start,"Kids start and index must be identical");
assert.equal(html,shell,"Kids shell and index must be identical");
assert.doesNotThrow(()=>new Function(js),"Qibla controller is valid JavaScript");
assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length,"CSS braces balance");
for(const asset of ["kids-qibla-focus-v1442.js?v=1448","kids-qibla-focus-v1442.css?v=1448"])
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
/* V1448: live Qibla only emits glow on real steady sensor alignment.
   Same prayer-pill selector/geometry for both buttons on every screen. */
assert(js.includes('launch.className="kids-salah-open-day kids-qibla-shortcut"'),
 "Qibla must use the ORIGINAL prayer pill class, no separate component design");
assert(js.includes('label.className="kids-shortcut-label"'),
 "prayer label must use same structure as Qibla label");
assert(css.includes(".kids-salah-shortcuts > .kids-salah-open-day"),
 "both shortcut pills must share one CSS geometry contract");
assert(css.includes("grid-template-columns:repeat(2,minmax(0,1fr))"),
 "even 50/50 grid required at iPhone/iPad/tablet sizes");
assert(css.includes("align-self:stretch!important")&&css.includes("border-radius:999px!important"),
 "height and roundings must match exactly");
assert(!css.includes(".kids-salah-shortcuts .kids-qibla-shortcut{"),
 "no Qibla-only colours or different capsule edges allowed");
assert(js.includes("QIBLA_ALIGN_ENTER=6,QIBLA_ALIGN_EXIT=9,QIBLA_ALIGN_STABLE_MS=250"),
 "steady alignment threshold/hysteresis required");
assert(js.includes("confidence&&difference<=QIBLA_ALIGN_ENTER")&&
 js.includes("Date.now()-alignmentCandidateAt>=QIBLA_ALIGN_STABLE_MS"),
 "sensor-only qualified stable heading must trigger success");
assert(js.includes("if(!confidence||difference>=QIBLA_ALIGN_EXIT||target===null)setAligned(false)"),
 "glow must disappear with poor calibration, no target or wrong heading");
assert(js.includes('else if(aligned)live.textContent="✨ Qibla gefunden!'),
 "visual success message must track actual sensor state");
assert(css.includes(".kids-qibla-focus.is-aligned .kq-compass")&&
 css.includes("@media(prefers-reduced-motion:reduce)"),
 "girl/boy palette glow and accessibility fallback required");
assert(!js.includes("window.location.reload(")&&!js.includes("window.location.assign("),
 "compass must not reboot Kids home");
const rad=n=>n*Math.PI/180;
const qibla=(lat,lon)=>{
 const a=rad(lat),b=rad(21.4225),delta=rad(39.8262-lon);
 return (Math.atan2(Math.sin(delta)*Math.cos(b),
  Math.cos(a)*Math.sin(b)-Math.sin(a)*Math.cos(b)*Math.cos(delta))*180/Math.PI+360)%360;
};
assert(Math.abs(qibla(50.626,6.95)-126.4)<0.5,"Rheinbach geographic bearing is about 126.4 degrees");
console.log("PASS Kids Qibla focus: structure, palette, GPS/sensor gate, and regression guard");
