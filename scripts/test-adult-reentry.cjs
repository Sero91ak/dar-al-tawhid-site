"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const assets = ["assets/dar-setup-hub.js", "test/assets/dar-setup-hub.js"];
function boot(source, mode, previouslyGranted, hasNative, browserPermission = "granted") {
  const from = source.indexOf("/* DĀR AL TAWḤĪD · iOS GPS continuity V2");
  const to = source.indexOf("/* Opt-in control for iOS significant-location", from);
  assert.ok(from >= 0 && to > from, "Continuity module missing");
  const callbacks = new Map();
  let requests = 0, nativeMessages = 0, writes = 0;
  let state = {
    lat: 50.7, lon: 7.1, city: "Bonn", locationMode: mode,
    locationGranted: previouslyGranted, locationUpdatedAt: Date.now() - 7200000
  };
  const win = {
    addEventListener(name, callback) { callbacks.set("window:" + name, callback); },
    dispatchEvent() {},
    webkit: hasNative ? {messageHandlers:{darNative:{postMessage(value) {
      assert.equal(value.type, "location-resume");
      nativeMessages++;
    }}}} : undefined
  };
  const document = {
    readyState: "complete", hidden: false,
    getElementById() { return null; },
    addEventListener(name, callback) { callbacks.set("document:" + name, callback); }
  };
  const navigator = {
    geolocation: { getCurrentPosition(onSuccess) {
      requests++;
      onSuccess({coords:{latitude:51.4, longitude:7.7, accuracy:40}, timestamp:Date.now()});
    } },
    permissions: { query: async () => ({state:browserPermission}) }
  };
  const localStorage = {getItem(){return null;},setItem(){}};
  const context = {
    window:win, document, navigator, localStorage,
    getPrayerSettings:()=>({...state}),
    setPrayerSettings(patch){state={...state,...patch};writes++;},
    reversePrayerCity:async()=>"Essen",
    setTimeout, clearTimeout, fetch:async()=>{throw Error("Unexpected remote fallback");}
  };
  vm.runInNewContext(source.slice(from,to),context,{timeout:3000});
  return {
    get requests(){return requests;},get nativeMessages(){return nativeMessages;},
    get writes(){return writes;},get state(){return state;},
    setMode(mode){state.locationMode=mode;},
    focus(){callbacks.get("window:focus")?.();},
    resume(){document.hidden=false;callbacks.get("document:visibilitychange")?.();}
  };
}
async function run(){
  for(const asset of assets){
    const js=fs.readFileSync(path.join(root,asset),"utf8");
    new vm.Script(js,{filename:asset});
    const browser=boot(js,"auto",true,false);
    await Promise.resolve();await Promise.resolve();
    assert.equal(browser.requests,1,"Existing consent refreshes automatically on entry");
    assert.equal(browser.state.lat,51.4);
    assert.equal(browser.state.lon,7.7);
    assert.equal(browser.state.locationMode,"auto");
    const writes=browser.writes;
    browser.setMode("manual");
    browser.focus();
    browser.resume();
    assert.equal(browser.requests,1,"Manual city must stop automatic GPS");
    assert.equal(browser.writes,writes,"Manual city must not be overwritten");
    const manual=boot(js,"manual",true,false);
    assert.equal(manual.requests,0,"Manual city must remain unchanged on page load");
    const native=boot(js,"auto",true,true);
    assert.equal(native.requests,0,"WKWebView must use CoreLocation, not web GPS");
    assert.equal(native.nativeMessages,1,"CoreLocation resume request missing");
    const grant=boot(js,"",false,false);
    await Promise.resolve();await Promise.resolve();
    assert.equal(grant.requests,1,"Previously granted browser permission must be reused");
    const prompt=boot(js,"",false,false,"prompt");
    await Promise.resolve();await Promise.resolve();
    assert.equal(prompt.requests,0,"First visit must not prompt without user action");
    console.log(asset+": auto resume, manual lock, native priority, granted-only PASS");
  }
  const native=fs.readFileSync(path.join(root,
    "ios/DarAlTawhid/DarAlTawhid/DarNativePermissions.swift"),"utf8");
  const app=fs.readFileSync(path.join(root,
    "ios/DarAlTawhid/DarAlTawhid/DarAlTawhidApp.swift"),"utf8");
  const view=fs.readFileSync(path.join(root,
    "ios/DarAlTawhid/DarAlTawhid/WebAppView.swift"),"utf8");
  assert.match(native,/func restoreLocationMonitoringAtLaunch\(\)/);
  assert.match(native,/func prayerSettingsDidChange\(\)/);
  assert.match(native,/requestLocationIfNeeded\(userInitiated: true\)/);
  assert.match(app,/DarNativePermissions\.shared\.restoreLocationMonitoringAtLaunch\(\)/);
  assert.match(view,/DarNativePermissions\.shared\.prayerSettingsDidChange\(\)/);
  console.log("Adult iOS foreground/background location lifecycle contract PASS");
}
run().catch(e=>{console.error(e);process.exitCode=1;});