#!/usr/bin/env node
"use strict";
// Regression coverage for the shared browser/Swift Qibla bridge.
// No location access, sensors, network or iOS build required.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "../assets/qibla-quick-view.js"), "utf8");

function boot({native, prayer = null, bridge = true, angle = 0} = {}) {
  const messages = [], intervals = new Map(), listeners = new Map();
  let nextTimer = 1;
  const window = {
    DAR_NATIVE_LOCATION: native,
    DAR_NATIVE_HEADING: null,
    getPrayerSettings: () => prayer,
    setPrayerSettings: () => { throw Error("Unexpected prayer settings write"); },
    setInterval: (callback) => { const id=nextTimer++; intervals.set(id, callback); return id; },
    clearInterval: (id) => intervals.delete(id),
    addEventListener: (name, cb) => listeners.set(name, cb),
    removeEventListener: (name) => listeners.delete(name)
  };
  if (bridge) window.webkit = {messageHandlers: {darNative: {postMessage: v => messages.push(v)}}};
  const navigator = { geolocation: {getCurrentPosition(success) {
    success({coords:{latitude:50.7, longitude:7.1, accuracy:10}});
  }}};
  const document = {getElementById: id => id === "darQiblaPop" && window.__testCanonicalVisible ? {} : null};
  const context = {window, navigator, document, screen: {orientation:{angle}}, Date,
    console, setTimeout, clearTimeout};
  vm.runInNewContext(source, context, {filename:"qibla-quick-view.js",timeout:3000});
  return {window, messages, intervals, listeners, engine:window.DARQiblaEngine,
    calculator:window.DARQiblaCalculator};
}
async function main() {
  const now=Date.now();
  // Swift delivers {lat,lng,acc,timestamp}, while web code historically expected lon.
  const valid=boot({native:{lat:50.7,lng:7.1,acc:12,timestamp:now}});
  const got=valid.engine.location.cached();
  assert.equal(got.source,"native");
  assert.equal(got.lat,50.7);
  assert.equal(got.lon,7.1);
  assert.ok(valid.calculator.qiblaBearing(50.7,7.1)>100);
  assert.ok(valid.calculator.qiblaBearing(50.7,7.1)<160);
  assert.equal((await valid.engine.location.refresh()).lon,7.1);

  // A visitor-selected city must never be silently replaced by native GPS.
  const manual=boot({native:{lat:50.7,lng:7.1,timestamp:now},
    prayer:{lat:52.5,lon:13.4,city:"Berlin",locationMode:"manual"}});
  assert.equal(manual.engine.location.cached().city,"Berlin");
  assert.equal((await manual.engine.location.refresh(false)).lon,13.4);
  assert.match(source,/current\.locationMode === "manual"\) return;/);

  // Bad, missing and expired native coordinates must not create false Qibla.
  for (const n of [
    {lat:null,lng:7.1,timestamp:now},
    {lat:95,lng:7.1,timestamp:now},
    {lat:50.7,lng:210,timestamp:now},
    {lat:50.7,lng:7.1,timestamp:now-900000},
    {lat:50.7,lng:7.1,timestamp:now+900000}
  ]) {
    assert.equal(boot({native:n,bridge:false}).engine.location.cached(),null);
  }
  assert.equal((await boot({native:{lat:50.7,lng:7.1,timestamp:now-900000},
    bridge:false}).engine.location.refresh()).lon,7.1);

  // Relative alpha cannot be used to claim magnetic/true north.
  const web=boot({bridge:false});
  assert.equal(web.engine.heading._rawHeading({alpha:100,absolute:false}),null);
  assert.equal(web.engine.heading._rawHeading({alpha:100,absolute:true}),260);
  assert.equal(web.engine.heading._rawHeading({webkitCompassHeading:30}),30);

  // Live CoreLocation headings take priority, support rotated screens,
  // and native sensors are stopped on Qibla close.
  const native=boot({bridge:true,angle:90});
  let heading=null;
  native.engine.heading.start(h => {heading=h;});
  assert.equal(native.messages[0].type,"qibla-compass");
  native.window.DAR_NATIVE_HEADING=45;
  for (const interval of native.intervals.values()) interval();
  assert.equal(heading,135);
  assert.equal(native.engine.heading._rawHeading({alpha:100,absolute:false}),null);
  native.engine.heading._onEvent({webkitCompassHeading:12});
  assert.equal(heading,135,"Web heading must not override native heading");
  native.engine.heading.stop();
  assert.equal(native.messages.at(-1).type,"qibla-stop");
  assert.equal(native.intervals.size,0);

  // Pinned homepage and global quick action must open the identical gold
  // full-screen #darQiblaPop, never create an independent blue compass.
  const unified=boot({bridge:true});
  let opened=0,closed=0;
  unified.window.openQiblaQuickSheet=()=>{opened++;unified.window.__testCanonicalVisible=true;};
  unified.window.closeQiblaQuickSheet=()=>{closed++;unified.window.__testCanonicalVisible=false;};
  const view=unified.window.DARQiblaQuickView;
  view.open();
  assert.equal(opened,1,"Pinned Qibla must delegate to canonical gold quick search");
  assert.equal(view.isOpen(),true,"Shared opening state must reflect canonical sheet");
  assert.equal(unified.messages.length,0,"Do not create competing sensor bridge listeners");
  view.open();
  assert.equal(opened,1,"Second tap must not double-open the gold sheet");
  view.start(); view.pause(); view.resume();
  assert.equal(unified.messages.length,0,"Canonical sensor lifecycle must be exclusive");
  view.close();
  assert.equal(closed,1,"Close must use canonical close lifecycle");
  assert.equal(view.isOpen(),false);
  console.log("Qibla native GPS + compass bridge + unified home/quick entry tests passed.");
}
main().catch(err=>{console.error(err);process.exitCode=1;});
