const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "content", "ramadan", "staging.json");
const doc = JSON.parse(fs.readFileSync(file, "utf8"));
const errors = [];

function fail(message) { errors.push(message); }

if (doc.schemaVersion !== 1) fail("schemaVersion muss 1 sein.");
if (doc.environment !== "staging" && doc.environment !== "production") fail("environment ungültig.");
if (doc.timezone !== "Europe/Berlin") fail("timezone muss Europe/Berlin sein.");
if (doc.plannedDays !== 30) fail("plannedDays muss 30 sein.");
if (doc.actualDays !== null && ![29, 30].includes(doc.actualDays)) fail("actualDays muss null, 29 oder 30 sein.");
if (!Array.isArray(doc.days) || doc.days.length !== 30) fail("Es müssen genau 30 vorbereitete Tage vorhanden sein.");

const expected = Array.from({ length: 30 }, (_, index) => index + 1);
const actual = Array.isArray(doc.days) ? doc.days.map(day => day.day) : [];
if (JSON.stringify(actual) !== JSON.stringify(expected)) fail("Tage müssen lückenlos 1 bis 30 sein.");

const slugs = new Set();
for (const day of doc.days || []) {
  if (!day.slug || slugs.has(day.slug)) fail(`Tag ${day.day}: slug fehlt oder ist doppelt.`);
  slugs.add(day.slug);
  if (!["structure-test", "draft", "verified"].includes(day.contentStatus)) {
    fail(`Tag ${day.day}: contentStatus ungültig.`);
  }

  if (doc.environment === "production" || day.contentStatus === "verified") {
    const evidence = Array.isArray(day.evidence) ? day.evidence : [];
    for (const required of ["quran", "sunnah", "salaf"]) {
      const hit = evidence.find(item => item && item.type === required && item.verificationStatus === "verified");
      if (!hit) {
        fail(`Tag ${day.day}: verifizierter Nachweis für ${required} fehlt.`);
        continue;
      }
      if (!hit.sourceTitle || !hit.reference || !hit.internalShortlink) {
        fail(`Tag ${day.day}: ${required}-Nachweis ist unvollständig.`);
      }
      if (/https?:\/\//i.test(hit.internalShortlink)) {
        fail(`Tag ${day.day}: internalShortlink darf kein ausgeschriebenes http(s) enthalten.`);
      }
      if (!/^dar-al-tawhid\.de\/q\/\d+$/.test(hit.internalShortlink)) {
        fail(`Tag ${day.day}: internalShortlink entspricht nicht dar-al-tawhid.de/q/<nummer>.`);
      }
    }
  }
}

if (doc.environment === "production") {
  if (doc.testMode?.enabled) fail("Produktion darf nicht mit aktiviertem Testmodus laufen.");
  if (!doc.startDate || !/^\d{4}-\d{2}-\d{2}$/.test(doc.startDate)) fail("Produktion benötigt ein bestätigtes Startdatum YYYY-MM-DD.");
  if (![29, 30].includes(doc.actualDays)) fail("Produktion benötigt actualDays 29 oder 30.");
  if ((doc.days || []).some(day => day.contentStatus !== "verified")) fail("Produktion darf nur verifizierte Tage enthalten.");
}

if (doc.testMode?.enabled) {
  const d = Number(doc.testMode.overrideDay);
  if (!Number.isInteger(d) || d < 1 || d > 30) fail("overrideDay muss im Testmodus zwischen 1 und 30 liegen.");
}

if (errors.length) {
  console.error("\nRamaḍān-Validierung FEHLGESCHLAGEN:");
  errors.forEach(error => console.error(" - " + error));
  process.exit(1);
}

console.log("Ramaḍān-Validierung OK");
console.log(`30 Tage vorbereitet · Modus: ${doc.environment} · Testtag: ${doc.testMode?.overrideDay ?? "-"}`);
