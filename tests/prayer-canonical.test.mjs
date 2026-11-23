import test from "node:test";
import assert from "node:assert/strict";
import { canonicalLocalClock, computeCanonicalPrayerDay } from "../cloudflare/prayer-push-scheduler.js";

test("Berlin winter and summer wall-clock offsets resolve to distinct instants", () => {
  const winter = canonicalLocalClock("2026-01-15", "05:12", "Europe/Berlin");
  const summer = canonicalLocalClock("2026-07-15", "05:12", "Europe/Berlin");
  assert.equal(winter.dateTime, "2026-01-15T05:12:00+01:00");
  assert.equal(summer.dateTime, "2026-07-15T05:12:00+02:00");
  assert.equal(new Date(winter.epoch).toISOString(), "2026-01-15T04:12:00.000Z");
  assert.equal(new Date(summer.epoch).toISOString(), "2026-07-15T03:12:00.000Z");
});

test("Berlin DST switch dates cannot shift prayer instants by one hour", () => {
  assert.equal(
    canonicalLocalClock("2026-03-29", "05:12", "Europe/Berlin").dateTime,
    "2026-03-29T05:12:00+02:00"
  );
  assert.equal(
    canonicalLocalClock("2026-10-25", "05:12", "Europe/Berlin").dateTime,
    "2026-10-25T05:12:00+01:00"
  );
  assert.throws(() => canonicalLocalClock("2026-03-29", "02:30", "Europe/Berlin"));
  assert.throws(() => canonicalLocalClock("2026-10-25", "02:30", "Europe/Berlin"));
});

test("Malformed timestamps and impossible dates are rejected before publication", () => {
  for (const [day, clock] of [
    ["2026-02-30", "05:12"],
    ["2026-11-03", "25:00"],
    ["2026-11-03", "12:80"],
    ["2026/11/03", "12:03"],
    ["2026-11-03", "12:3"]
  ]) assert.throws(() => canonicalLocalClock(day, clock, "Europe/Berlin"));
  assert.throws(() => canonicalLocalClock("2026-11-03", "12:03", "Invalid/Zone"));
});

test("Daily canonical JSON provides six ordered epoch-bearing entries", () => {
  const today = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Berlin", day: "2-digit", month: "2-digit", year: "numeric"
    }).formatToParts(new Date()).filter((p) => p.type !== "literal").map((p) => [p.type, p.value])
  );
  const date = today.year + "-" + today.month + "-" + today.day;
  const day = computeCanonicalPrayerDay({
    date, locationName: "Berlin", lat: 52.52, lon: 13.405,
    timeZone: "Europe/Berlin", angle: 12, asrFactor: 1
  });
  assert.equal(day.schemaVersion, 1);
  assert.equal(day.date, date);
  assert.equal(day.timeZone, "Europe/Berlin");
  assert.deepEqual(Object.keys(day.prayers), ["fajr","sunrise","dhuhr","asr","maghrib","isha"]);
  const instants = Object.values(day.prayers).map((prayer) => Date.parse(prayer.dateTime));
  assert.ok(instants.every(Number.isFinite));
  assert.deepEqual(instants, instants.slice().sort((a,b) => a-b));
  assert.ok(day.generatedAt.endsWith("Z"));
});
