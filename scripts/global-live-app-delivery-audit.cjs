#!/usr/bin/env node
"use strict";
/*
 * Read-only GLOBAL LIVE delivery audit for DĀR AL TAWḤĪD.
 * This verifies served code, app shells and content feeds, NOT native
 * binary install state, real GPS permissions, device layouts or audio playback.
 * No credentials, exact user location or protected routes are requested.
 */
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const root = path.join(__dirname, "..");
const site = String(process.env.DAR_LIVE_SITE || "https://dar-al-tawhid.de").replace(/\/+$/,"");
const strict = process.argv.includes("--strict");
const records = [];

const sha = text => crypto.createHash("sha256").update(text).digest("hex");
function local(file) { return fs.readFileSync(path.join(root, file), "utf8"); }
function check(condition, why) { if (!condition) throw Error(why); }
async function request(route, options = {}) {
  let last;
  for (let attempt=0; attempt<3; attempt++) {
    try {
      const target=site+route+(route.includes("?")?"&":"?")+"dar_audit="+Date.now()+"_"+attempt;
      const response=await fetch(target, {
        cache:"no-store", redirect:"follow",
        headers:{"Accept":options.json?"application/json":"*/*",
          "Cache-Control":"no-cache","User-Agent":options.ua||"DarAlTawhid-ReadOnlyLiveAudit/1.0"},
        signal:AbortSignal.timeout(12000)
      });
      const text=await response.text();
      if (response.status>=500 && attempt<2) throw Error("upstream HTTP "+response.status);
      return {status:response.status,text,type:String(response.headers.get("content-type")||"").toLowerCase(),
        surface:String(response.headers.get("x-dar-surface")||"")};
    } catch(e) {last=e;if(attempt<2)await new Promise(r=>setTimeout(r,1200));}
  }
  throw last;
}
async function run(name, required, probe) {
  try {const details=await probe();records.push({name,result:"PASS",required,details});}
  catch(error){records.push({name,result:required?"FAIL":"UNVERIFIED",required,
    details:String(error&&error.message||error).slice(0,300)});}
}
async function html(route, marker, options) {
  const r=await request(route,options);
  check(r.status===200,route+" HTTP "+r.status);
  check(r.type.includes("html"),route+" not HTML: "+r.type);
  check(r.text.includes(marker),route+" missing expected marker");
  return {status:r.status,marker,bytes:r.text.length,surface:r.surface};
}
async function json(route, predicate) {
  const r=await request(route,{json:true});
  check(r.status===200,route+" HTTP "+r.status);
  check(r.type.includes("json"),route+" not JSON: "+r.type);
  const data=JSON.parse(r.text);
  check(predicate(data),route+" invalid content");
  return {status:r.status,bytes:r.text.length};
}
async function parity(route,source) {
  const r=await request(route);
  check(r.status===200,route+" HTTP "+r.status);
  check(/javascript|text\/plain|octet-stream/.test(r.type),route+" not a script: "+r.type);
  const expected=sha(local(source)),actual=sha(r.text);
  check(expected===actual,route+" deployed SHA-256 differs from checked-out GitHub source");
  return {status:r.status,bytes:r.text.length,sha256:actual};
}
function selfTest(){
  check(sha("abc")==="ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad","hash broken");
  const src=local("scripts/test-mobile-location-fresh-fix.cjs");
  check(src.includes("MOBILE_LOCATION_FRESH_GUARD PASS"),"GPS regression suite missing");
  check(local("assets/dar-setup-hub.js").includes("function requestWebFix()"),"web/PWA GPS recovery missing");
  check(local("test/assets/dar-setup-hub.js").includes("lastAcceptedStamp"),"test GPS parity missing");
  console.log("GLOBAL LIVE AUDIT local self-test PASS");
}
async function main(){
  if(process.argv.includes("--self-test")) { selfTest(); return; }
  selfTest();
  await run("Public website – desktop",true,()=>html("/","DĀR AL TAWḤĪD",
    {ua:"Mozilla/5.0 (X11; Linux x86_64) Chrome/127.0"}));
  await run("Installed iOS visitor web shell",true,()=>html("/index.html",
    JSON.parse(local("version.json")).buildId,{ua:"DarAlTawhid-iOS/1.0 WKWebView"}));
  await run("Android/PWA visitor shell",true,()=>html("/pwa/?pwa=1",
    "darDedicatedPwaBootV2"));
  await run("DAR TEST web shell",true,()=>html("/test/index.html",
    JSON.parse(local("test/version.json")).buildId));
  await run("Live GPS code exactly matches production GitHub source",true,
    ()=>parity("/assets/dar-setup-hub.js","assets/dar-setup-hub.js"));
  await run("DAR TEST GPS code exactly matches GitHub source",true,
    ()=>parity("/test/assets/dar-setup-hub.js","test/assets/dar-setup-hub.js"));
  await run("Visitor Qibla script available",true,async()=>{
    const r=await request("/assets/qibla-quick-view.js");
    check(r.status===200&&r.text.includes("LocationProvider"),"Qibla browser source missing");
    return {status:r.status,bytes:r.text.length};
  });
  await run("Native-app version endpoint",true,()=>json("/version.json",
    x=>typeof x.buildId==="string"&&x.buildId===JSON.parse(local("version.json")).buildId));
  await run("DAR TEST version endpoint",true,()=>json("/test/version.json",
    x=>typeof x.buildId==="string"&&x.buildId===JSON.parse(local("test/version.json")).buildId));
  await run("Apple TV catalog/feed",true,()=>json("/apple-tv/catalog.json",
    x=>x&&x.home&&x.home.enabled===true&&Array.isArray(x.modules)));
  await run("Apple TV prayer configuration feed",true,()=>json("/apple-tv/prayer/catalog.json",
    x=>x&&x.feature==="adhan"&&Array.isArray(x.playback?.prayers)&&x.playback.prayers.length===5));
  await run("Apple TV Adhan catalog feed",true,()=>json("/apple-tv/prayer/adhan.json",
    x=>x&&Array.isArray(x.recordings)&&x.recordings.length>=5));
  await run("Kids published version metadata",false,()=>json("/kids/version.json",
    x=>x&&typeof x.buildId==="string"&&x.buildId.startsWith("kids-shell-")));
  await run("Watch / widgets web surface",false,async()=>{
    const r=await request("/widgets/");
    check(r.status===200&&/html/.test(r.type),"widgets surface is not public HTML");
    return {status:r.status,bytes:r.text.length};
  });
  await run("Kids restricted app surface (no login bypass)",false,async()=>{
    const r=await request("/kids/");
    check([200,401,403].includes(r.status),"/kids/ unexpected HTTP "+r.status);
    return {status:r.status,bytes:r.text.length,notice:"HTTP 401/403 indicates intentional access gate, not functionality"};
  });
  await run("Admin restricted surface (no login bypass)",false,async()=>{
    const r=await request("/admin/");
    check([200,401,403].includes(r.status),"/admin/ unexpected HTTP "+r.status);
    return {status:r.status,bytes:r.text.length,notice:"Read-only access check only"};
  });

  console.log("\nGLOBAL LIVE APP DELIVERY AUDIT");
  for(const item of records) console.log(item.result.padEnd(11)+item.name+" — "+JSON.stringify(item.details));
  console.log("LIVE AUDIT RESULT "+JSON.stringify({
    requiredPass:records.filter(x=>x.required&&x.result==="PASS").length,
    requiredTotal:records.filter(x=>x.required).length,
    unverified:records.filter(x=>x.result==="UNVERIFIED").length,
    failures:records.filter(x=>x.result==="FAIL").length,
    devices:"NOT TESTED — requires physical iPhone/iPad/Android/TV/Watch"
  }));
  if (strict && records.some(x=>x.result==="FAIL"))process.exitCode=1;
}
main().catch(e=>{console.error("GLOBAL LIVE AUDIT INTERNAL ERROR",e.message);process.exitCode=1;});
