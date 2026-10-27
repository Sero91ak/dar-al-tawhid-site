"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const scripts = ["assets/dar-setup-hub.js", "test/assets/dar-setup-hub.js"];
const coordinateValid = (lat, lon) =>
  Number.isFinite(lat) && Number.isFinite(lon) &&
  lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;

function emitter() {
  const listeners = new Map();
  return {
    addEventListener(type, callback) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(callback);
    },
    removeEventListener(type, callback) {
      listeners.get(type)?.delete(callback);
    },
    emit(type, detail) {
      for (const callback of [...(listeners.get(type) || [])]) callback({detail});
    },
    remaining() {
      return [...listeners.values()].reduce((sum, values) => sum + values.size, 0);
    }
  };
}

function loadPositionRequest(filename, window, browserPosition) {
  const source = fs.readFileSync(path.join(root, filename), "utf8");
  new vm.Script(source, {filename});
  const start = source.indexOf("  function requestDevicePosition() {");
  const end = source.indexOf("  async function detectLocation()", start);
  assert(start >= 0 && end > start, filename + ": native request helper missing");
  assert(source.includes("var pos = await requestDevicePosition()"), filename + ": GPS button must call native first");
  assert(source.includes("acc<=100000"), filename + ": approximate coordinates are discarded");
  assert(source.includes('locationPrecision'), filename + ": precision warning missing");
  return new Function("window", "validCoords", "requestBrowserPosition",
    "setTimeout", "clearTimeout",
    source.slice(start, end) + "\nreturn requestDevicePosition;"
  )(window, coordinateValid, browserPosition, () => 1, () => {});
}

async function verifyScript(filename) {
  const native = emitter();
  let requested = false;
  native.webkit = {messageHandlers:{darNative:{postMessage(message) {
    assert.equal(message.type, "location-resume");
    requested = true;
    native.emit("dar-native-location", {lat:200,lng:7.1,acc:12,timestamp:Date.now()});
    native.emit("dar-native-location", {lat:50.7,lng:7.1,acc:12,timestamp:Date.now()});
  }}}};
  const position = await loadPositionRequest(filename, native,
    () => {throw Error("Unexpected browser geolocation");})();
  assert(requested);
  assert.equal(position.coords.latitude, 50.7);
  assert.equal(position.coords.longitude, 7.1);
  assert.equal(native.remaining(), 0, "Native event listeners must be removed");

  const approximate = emitter();
  approximate.webkit = {messageHandlers:{darNative:{postMessage() {
    approximate.emit("dar-native-location", {
      lat:50.8,lng:7.2,acc:15000,timestamp:Date.now() - 20*60*1000
    });
  }}}};
  const coarse = await loadPositionRequest(filename, approximate,
    () => {throw Error("Unexpected browser geolocation");})();
  assert.equal(coarse.coords.accuracy, 15000);
  assert.equal(approximate.remaining(), 0);

  const denied = emitter();
  denied.webkit = {messageHandlers:{darNative:{postMessage() {
    denied.emit("dar-native-location-status", {authorization:"denied"});
  }}}};
  await assert.rejects(loadPositionRequest(filename, denied,
    () => {throw Error("Denied access must not trigger web fallback");})(),
    error => error.code === 1);
  assert.equal(denied.remaining(), 0);

  const browser = emitter();
  const web = await loadPositionRequest(filename, browser,
    () => Promise.resolve({coords:{latitude:51,longitude:8,accuracy:25}}))();
  assert.equal(web.coords.latitude, 51);
  console.log(filename + ": native GPS, coarse GPS, denied permission, web fallback PASS");
}

async function main() {
  const swift = fs.readFileSync(
    path.join(root, "ios/DarAlTawhid/DarAlTawhid/DarNativePermissions.swift"), "utf8");
  assert(swift.includes("let maximumAccuracy: CLLocationAccuracy = approximate ? 100_000 : 2_500"));
  assert(swift.includes("let maximumAge: TimeInterval = approximate ? 3_600 : 600"));
  assert(swift.indexOf("deliver(loc)\n        if unchangedForWidgets { return }") >= 0,
    "Location delivery must not be suppressed by widget throttling");
  const engine = fs.readFileSync(path.join(root, "ios/DarAlTawhid/Shared/DarPrayerEngine.swift"), "utf8");
  const daily = fs.readFileSync(path.join(root, "ios/DarAlTawhid/Shared/DarDailyContent.swift"), "utf8");
  const push = fs.readFileSync(path.join(root, "ios/DarAlTawhid/DarAlTawhid/DarPushNotifications.swift"), "utf8");
  assert(engine.includes("fajrAngle: Double = 12, asrFactor: Double = 1"));
  assert(engine.includes("clock(angle: angle, rising: false)"),
    "Asr must use the calculated sun altitude");
  assert(!engine.includes("clock(angle: 90 - angle, rising: false)"));
  assert(engine.includes('clock(angle: -abs(fajrAngle), rising: true)'));
  assert(engine.includes('clock(angle: -abs(fajrAngle), rising: false)'));
  assert(daily.includes("fajrAngle: snap.fajrAngle, asrFactor: snap.asrFactor"));
  assert(push.includes("fajrAngle: snap.fajrAngle, asrFactor: snap.asrFactor"));
  for (const filename of scripts) await verifyScript(filename);
  console.log("iOS GPS and prayer location regression guard PASS");
}

main().catch(error => {console.error(error);process.exitCode = 1;});
