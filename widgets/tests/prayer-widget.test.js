/**
 * Automated tests for prayer widget core logic.
 * Run: node widgets/tests/prayer-widget.test.js
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadScript(rel) {
  const code = fs.readFileSync(path.join(__dirname, "..", rel), "utf8");
  const sandbox = {
    window: {},
    globalThis: {},
    console,
    Date,
    Math,
    Number,
    String,
    Array,
    Object,
    JSON,
    Intl,
    localStorage: (() => {
      const store = {};
      return {
        getItem: (k) => (k in store ? store[k] : null),
        setItem: (k, v) => { store[k] = String(v); },
        removeItem: (k) => { delete store[k]; }
      };
    })(),
    navigator: { platform: "test", userAgent: "node" },
    document: { addEventListener() {}, removeEventListener() {} }
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.runInNewContext(code, sandbox, { filename: rel });
  return sandbox;
}

const mathBox = loadScript("shared/prayer-math.js");
const storageBox = loadScript("storage/prayer-cache.js");
// share globals
storageBox.DarPrayerMath = mathBox.DarPrayerMath;
const themeBox = loadScript("theme/widget-theme.js");
const math = mathBox.DarPrayerMath;
const storage = storageBox.DarWidgetStorage;
const theme = themeBox.DarWidgetTheme;

function test(name, fn) {
  try {
    fn();
    console.log("OK:", name);
  } catch (e) {
    console.error("FAIL:", name, e.message);
    process.exitCode = 1;
  }
}

test("math version present", () => {
  assert.ok(math.VERSION);
});

test("calculate day times for Berlin sample", () => {
  const d = new Date(2026, 6, 18, 12, 0, 0); // July 18 2026
  const times = math.calculateDayTimes(d, 52.52, 13.405, { angle: 12, asrFactor: 1 });
  assert.equal(times.length, 6);
  times.forEach((t) => {
    assert.ok(t.time != null, t.key + " missing");
    assert.match(math.formatHour(t.time), /^\d{2}:\d{2}$/);
  });
});

test("chronological order", () => {
  const d = new Date(2026, 6, 18, 12, 0, 0);
  const times = math.calculateDayTimes(d, 50.94, 6.96, { angle: 12, asrFactor: 1 });
  const mins = times.map((t) => {
    const [h, m] = math.formatHour(t.time).split(":").map(Number);
    return h * 60 + m;
  });
  for (let i = 1; i < mins.length; i++) {
    assert.ok(mins[i] >= mins[i - 1], "order break at " + times[i].key);
  }
});

test("next prayer after isha rolls to fajr tomorrow", () => {
  const d = new Date(2026, 6, 18, 23, 50, 0);
  const next = math.nextPrayer(d, 50.94, 6.96, { angle: 12, asrFactor: 1 });
  assert.equal(next.key, "fajr");
  assert.equal(next.tomorrow, true);
});

test("countdown never negative / never NaN", () => {
  assert.equal(math.formatCountdown(-1000), "00:00");
  assert.equal(math.formatCountdown(NaN), "00:00");
  assert.match(math.formatCountdown(90 * 60 * 1000), /^\d{2}:\d{2}$/);
});

test("theme resolve auto from app", () => {
  assert.equal(theme.resolveMode("auto", "royal"), "royal");
  assert.equal(theme.resolveMode("auto", "light"), "light");
  assert.equal(theme.resolveMode("dark", "light"), "dark");
});

test("storage validates day packet", () => {
  const ok = {
    date: "2026-07-18",
    fajr: "04:18",
    sunrise: "05:42",
    dhuhr: "13:36",
    asr: "17:54",
    maghrib: "21:42",
    isha: "23:18"
  };
  assert.equal(storage.isValidDayPacket(ok), true);
  assert.equal(storage.isValidDayPacket({ ...ok, isha: "bad" }), false);
  assert.equal(storage.isValidDayPacket({ ...ok, fajr: "22:00", maghrib: "04:00" }), false);
});

test("sync cache 60 days with location", () => {
  storageBox.localStorage.setItem("darPrayerSettingsV1", JSON.stringify({
    city: "Teststadt",
    lat: 50.94,
    lon: 6.96,
    angle: 12,
    asrFactor: 1,
    locationGranted: true
  }));
  // reload storage helpers against same sandbox storage
  const res = storage.syncCache(math);
  assert.equal(res.ok, true, res.reason);
  assert.ok(Object.keys(res.cache.days).length >= 60);
});

test("corrupt new data does not wipe old cache", () => {
  const before = storage.getCache();
  assert.ok(Object.keys(before.days).length > 0);
  // force invalid by mocking calculate to return nulls
  const badMath = {
    ...math,
    calculateDayTimes() {
      return [
        { key: "fajr", name: "Fajr", time: null },
        { key: "sunrise", name: "Sonnenaufgang", time: null },
        { key: "dhuhr", name: "Ẓuhr", time: null },
        { key: "asr", name: "ʿAṣr", time: null },
        { key: "maghrib", name: "Maghrib", time: null },
        { key: "isha", name: "ʿIshāʾ", time: null }
      ];
    },
    formatHour: math.formatHour
  };
  const res = storage.syncCache(badMath);
  assert.equal(res.ok, false);
  const after = storage.getCache();
  assert.equal(Object.keys(after.days).length, Object.keys(before.days).length);
});

test("widget reset clears only widget keys", () => {
  storageBox.localStorage.setItem("darPrayerSettingsV1", JSON.stringify({
    city: "X", lat: 1, lon: 2, locationGranted: true, angle: 12, asrFactor: 1
  }));
  storage.setConfig({ enabled: true, themeMode: "royal" });
  storage.resetWidgetOnly();
  const cfg = storage.getConfig();
  assert.equal(cfg.enabled, false);
  assert.equal(cfg.themeMode, "auto");
  assert.ok(storageBox.localStorage.getItem("darPrayerSettingsV1"));
});

console.log("\nDone.");
