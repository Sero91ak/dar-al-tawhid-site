#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const sandbox = { window: {}, URL, Date };
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

const now = new Date().toISOString();
const config = Z.normalizeConfig(JSON.parse(fs.readFileSync(path.join(ROOT, "content/admin/zakat-config.json"), "utf8")));
config.prices = {
  ...config.prices,
  goldPerGramEur: 75,
  silverPerGramEur: 0.95,
  active: true,
  verifiedAt: now
};
config.priceFreshness = Z.priceFreshnessFromAge(now);

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
assert(result.resultCase === "C", "case C zakat due");

const noPrice = Z.computeZakat(
  { cash: 10000, nisabSinceDate: "2024-01-01", todayDate: "2026-06-18" },
  { ...config, prices: { active: false }, priceFreshness: null }
);
assert(noPrice.priceMissing === true, "blocks final without prices");
assert(noPrice.zakatableWealth === 10000, "cash still counted without prices");
assert(noPrice.liquidWealth === 10000, "liquid wealth tracked");

const liquidBug = Z.computeZakat(
  { cash: 200, bank: 1000, digital: 100, debtsDue: 5000 },
  { ...config, prices: { active: false }, priceFreshness: null }
);
assert(liquidBug.liquidWealth === 1300, "liquid 1300 EUR");
assert(liquidBug.zakatableWealth === 0, "zakatable 0 after debts");
assert(liquidBug.priceMissing === true, "price missing flag");

const goldUnvalued = Z.computeZakat(
  { cash: 200, bank: 1000, digital: 100, goldGrams: 50, debtsDue: 5000 },
  { ...config, prices: { active: false }, priceFreshness: null }
);
assert(goldUnvalued.goldUnvalued === true, "gold marked unvalued");
assert(goldUnvalued.liquidWealth === 1300, "liquid still 1300 with gold input");

const otherLiquid = Z.computeZakat(
  { cash: 100, bank: 200, digital: 50, otherLiquid: 150, debtsDue: 0 },
  config
);
assert(otherLiquid.liquidWealth === 500, "otherLiquid included in liquid sum");
assert(otherLiquid.modules.cashBreakdown.other === 150, "otherLiquid breakdown");

const belowNisab = Z.computeZakat({ cash: 100, bank: 100 }, config);
assert(belowNisab.resultCase === "A", "below nisab case A");
assert(belowNisab.zakatDue === 0, "zero zakat below nisab");
assert(belowNisab.nisab.reached === false, "nisab not reached");

assert(Z.roundMoney(218.749) === 218.75, "roundMoney half up");

const fresh = Z.priceFreshnessFromAge(now);
assert(fresh.canFinalize === true, "fresh prices can finalize");
assert(fresh.level === "realtime", "realtime within 15 min");

const pdfHtml = Z.buildPdfHtml(result, config, {
  siteOrigin: "https://dar-al-tawhid.de",
  input: { nisabSinceDate: "2024-01-01", todayDate: "2026-06-18" }
});
assert(pdfHtml.includes("Zakāt-Rechner Bericht"), "pdf title");
assert(pdfHtml.includes("Übersicht"), "pdf overview section");
assert(pdfHtml.includes("Niṣāb &amp; Marktdaten"), "pdf nisab section");
assert(pdfHtml.includes("Berechnung"), "pdf calculation section");
assert(pdfHtml.includes("Pflichtbetrag"), "pdf obligation section");
assert(pdfHtml.includes("Notizen"), "pdf notes section");
assert(pdfHtml.includes("dar-al-tawhid.de"), "pdf footer url");
assert(pdfHtml.includes("Gesamtvermögen (Brutto)"), "pdf gross wealth field");
assert(pdfHtml.includes("Zakat-Pflichtbetrag"), "pdf final amount field");
assert((pdfHtml.match(/class="zakat-pdf-page"/g) || []).length === 1, "pdf one page section");
assert(!pdfHtml.includes("Seite:</b> 2 /"), "pdf no second page");
assert(Z.buildPdfFilename({ reportId: "ZK-2026-000001" }) === "zakat-bericht-ZK-2026-000001.pdf", "pdf filename");

if (failed) process.exit(1);
console.log("\nAlle Zakāt-Engine-Tests bestanden.");
