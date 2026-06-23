#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const sandbox = { window: {}, URL };
sandbox.globalThis = sandbox.window;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, "assets/zakat-engine.js"), "utf8"), sandbox);
const Z = sandbox.window.DARZakat;

let failed = 0;
function assert(cond, msg) {
  if (cond) console.log("OK:", msg);
  else {
    console.error("FAIL:", msg);
    failed += 1;
  }
}

const config = Z.normalizeConfig(JSON.parse(fs.readFileSync(path.join(ROOT, "content/admin/zakat-config.json"), "utf8")));
config.prices = { ...config.prices, goldPerGramEur: 75, silverPerGramEur: 0.95, active: true, verifiedAt: "2026-06-18T12:00:00.000Z" };

const result = Z.computeZakat(
  {
    cash: 5000,
    bank: 5000,
    goldGrams: 10,
    debtsDue: 2000,
    nisabSinceDate: "2024-01-01",
    todayDate: "2026-06-18"
  },
  config
);

assert(Math.abs(result.zakatableWealth - 8750) < 0.01, "zakatable wealth 8750");
assert(result.nisab.reached === true, "nisab reached with test prices");
assert(result.hawl.fulfilled === true, "hawl fulfilled");
assert(Math.abs(result.zakatDue - 218.75) < 0.01, "zakat due 218.75 EUR");
assert(result.sources.length > 0, "sources attached");

const noPrice = Z.computeZakat({ cash: 10000, nisabSinceDate: "2024-01-01", todayDate: "2026-06-18" }, { ...config, prices: { active: false } });
assert(noPrice.priceMissing === true, "blocks final without prices");
assert(noPrice.previewOnly === true, "preview when price missing");

if (failed) process.exit(1);
console.log("\nAlle Zakāt-Engine-Tests bestanden.");
