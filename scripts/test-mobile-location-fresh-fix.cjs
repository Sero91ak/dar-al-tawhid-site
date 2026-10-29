#!/usr/bin/env node
"use strict";
// Adult visitor GPS contract tests. No real geolocation, requests or user data.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const sources = ["assets/dar-setup-hub.js", "test/assets/dar-setup-hub.js"];
const NOW = Date.now();

function boot(source, settings, options = {}) {
  const start = source.indexOf("/* DĀR AL TAWḤĪD · iOS GPS continuity V2");
  const end = source.indexOf("/* Opt-in control for iOS", start);
  assert(start !== -1 && end > start, "Mobile continuity IIFE must exist");
  const events = new Map(), docEvents = new Map(), tasks = [];
  const writes = [], nativeRequests = [], state = {...settings};
  let browserCalls = 0;
  const win = {
    addEventListener(name, callback) {
      const listeners = events.get(name) || [];
      events.set(name, [...listeners, callback]);
    },
    dispatchEvent(event) { (events.get(event.type) || []).forEach(fn => fn(event)); },
    CustomEvent: (type, opts) => ({type, detail:opts?.detail})
  };
  if (options.native) win.webkit = {messageHandlers:{darNative:{postMessage(msg) {
    nativeRequests.push(msg.type);
  }}}};
  if (options.cached) win.DAR_NATIVE_LOCATION = options.cached;
  const doc = {
    readyState: "loading", hidden: false,
    addEventListener(name, fn) { docEvents.set(name, fn); },
    getElementById() {return null;}
  };
  const navigator = {geolocation: options.browser ? {getCurrentPosition(success, failure, settings) {
    browserCalls += 1;
    options.browser(success, failure, settings);
  }} : undefined};
  const getPrayerSettings = () => ({...state});
  const setPrayerSettings = patch => {Object.assign(state, patch); writes.push({...patch});};
  const fakeStorage = {getItem:()=>null,setItem() {}};
  const run = new Function("window", "document", "navigator", "getPrayerSettings",
    "setPrayerSettings", "reversePrayerCity", "localStorage", "setTimeout",
    "clearTimeout", "CustomEvent", "fetch", "AbortController", source.slice(start,end));
  run(win, doc, navigator, getPrayerSettings, setPrayerSettings,
    () => Promise.resolve(options.city || "Bonn"), fakeStorage,
    fn => {tasks.push(fn); return tasks.length;}, () => {},
    win.CustomEvent, () => Promise.reject(new Error("network intentionally blocked")), undefined);
  return {
    state, writes, nativeRequests, tasks,
    browserCalls:() => browserCalls,
    fire:(type,detail) => win.dispatchEvent({type,detail}),
    start:() => docEvents.get("DOMContentLoaded")?.()
  };
}

async function testOne(file) {
  const source = fs.readFileSync(path.join(root,file), "utf8");
  assert(source.includes("lastAcceptedStamp") && source.includes("meters>=700"),
    "Moving from cached GPS to a fresh fix must bypass the duplicate-write throttle");
  assert(source.includes("function requestWebFix()"),
    "Safari/Android/PWA foreground GPS is missing");
  const detectStart=source.indexOf("  async function detectLocation() {");
  const detectEnd=source.indexOf("  function toggleManual()",detectStart);
  assert(detectStart>=0&&detectEnd>detectStart,"Mobile GPS action missing");
  const detect=source.slice(detectStart,detectEnd);
  const cancelled=detect.indexOf("if (serial !== requestId) return;");
  const firstWrite=detect.indexOf("save({lat:lat,lon:lon");
  assert(cancelled>0&&firstWrite>cancelled,
    "Late GPS answer must not overwrite a city selected while the request was pending");

  const old = {lat:52.5,lng:13.4,acc:40,timestamp:NOW-8*60000};
  const fresh = {lat:50.7,lng:7.1,acc:22,timestamp:NOW};
  const native=boot(source,{lat:old.lat,lon:old.lng,city:"Berlin",locationMode:"auto",
    locationGranted:true,locationUpdatedAt:NOW-8*60000},{native:true,cached:old});
  native.start();
  assert(native.nativeRequests.includes("location-resume"),"iOS must request GPS on resume");
  native.fire("dar-native-location", fresh);
  assert.equal(native.state.lat, fresh.lat,"A new 700m+ fix cannot be blocked within 10s");
  assert.equal(native.state.lon, fresh.lng);
  native.fire("dar-native-location",old);
  assert.equal(native.state.lat,fresh.lat,"An older replay must not roll back location");

  const web=boot(source,{locationMode:"auto",locationGranted:false},{
    browser:success=>success({coords:{latitude:51.45,longitude:7.01,accuracy:30},timestamp:NOW})
  });
  web.start();
  assert.equal(web.browserCalls(),1,"Web/PWA must request geolocation on opening");
  assert.equal(web.state.lat,51.45);
  assert.equal(web.state.locationGranted,true);

  const manual=boot(source,{locationMode:"manual",city:"Essen",lat:51.6,lon:7.2,
    locationGranted:true},{native:true, browser(){throw Error("manual override")}});
  manual.start();
  manual.fire("dar-native-location",fresh);
  assert.equal(manual.state.lat,51.6,"Manual location must always win");
  assert.equal(manual.nativeRequests.length,0);

  let browserFallback=0;
  const olderApp=boot(source,{locationMode:"auto"},{native:true,browser:success=>{
    browserFallback += 1;
    success({coords:{latitude:50.74,longitude:7.11,accuracy:50},timestamp:NOW});
  }});
  olderApp.start();
  assert.equal(olderApp.browserCalls(),0);
  const fallback = olderApp.tasks.find(fn => /requestWebFix/.test(fn.toString()));
  assert(fallback,"Missing native timeout recovery");
  fallback();
  assert.equal(browserFallback,1,"Native bridge timeout must fall back to browser GPS");
  assert.equal(olderApp.state.lat,50.74);

  const timedOut=boot(source,{locationMode:"auto"},{
    browser:(success,failure,opts)=>{
      if(opts.enableHighAccuracy) failure({code:3});
      else success({coords:{latitude:50.8,longitude:7.2,accuracy:1800},timestamp:NOW});
    }
  });
  timedOut.start();
  assert.equal(timedOut.browserCalls(),2,"Precise GPS timeout must retry low accuracy");
  assert.equal(timedOut.state.lat,50.8);
  console.log(file+": replay order, fresh travel, Safari/PWA, native fallback, manual mode, reduced GPS PASS");
}

(async()=>{
  for (const file of sources) await testOne(file);
  console.log("MOBILE_LOCATION_FRESH_GUARD PASS");
})().catch(error=>{console.error(error);process.exitCode=1;});
