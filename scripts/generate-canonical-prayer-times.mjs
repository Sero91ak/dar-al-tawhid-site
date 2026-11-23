#!/usr/bin/env node
/**
 * Builds the public daily prayer-time contract from the canonical Worker source.
 * Does not alter the existing WebApp, notification schedules or user settings.
 * The root latest.json is Berlin-only; other locations MUST use a location-scoped
 * canonical WebApp response, never treat the Berlin file as their own location.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { computeCanonicalPrayerDay } from "../cloudflare/prayer-push-scheduler.js";

const zone = "Europe/Berlin";
const output = new URL("../content/prayer-times/", import.meta.url);
const timestamp = new Date().toISOString();

function berlinDay(date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(date).filter((p) => p.type !== "literal").map((p) => [p.type, p.value])
  );
  return parts.year + "-" + parts.month + "-" + parts.day;
}

function dayPlusUTC(yyyyMMdd, days) {
  const d = new Date(yyyyMMdd + "T12:00:00Z");
  if (Number.isNaN(d.getTime())) throw new Error("Invalid input day");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function validate(day) {
  const expected = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];
  if (day.schemaVersion !== 1 || day.timeZone !== zone ||
      !/^\d{4}-\d{2}-\d{2}$/.test(day.date) ||
      !Number.isFinite(Date.parse(day.generatedAt)) ||
      day.location.name !== "Berlin") throw new Error("Invalid canonical header");
  let previous = -Infinity;
  for (const name of expected) {
    const entry = day.prayers[name];
    if (!entry || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00[+-]\d{2}:\d{2}$/.test(entry.dateTime)) {
      throw new Error("Missing/invalid prayer: " + name);
    }
    const epoch = Date.parse(entry.dateTime);
    if (!Number.isFinite(epoch) || epoch <= previous || berlinDay(new Date(epoch)) !== day.date) {
      throw new Error("Invalid or unsorted absolute prayer epoch: " + name);
    }
    previous = epoch;
  }
}

await mkdir(output, { recursive: true });
const today = berlinDay(new Date());
const days = [0, 1, 2].map((distance) => dayPlusUTC(today, distance));
const payloads = [];
for (const date of days) {
  const day = computeCanonicalPrayerDay({
    date,
    lat: 52.52,
    lon: 13.405,
    timeZone: zone,
    locationName: "Berlin",
    angle: 12,
    asrFactor: 1,
    generatedAt: timestamp
  });
  validate(day);
  const file = join(output.pathname, date + ".json");
  await writeFile(file, JSON.stringify(day, null, 2) + "\n", "utf8");
  payloads.push(day);
}
await writeFile(join(output.pathname, "latest.json"), JSON.stringify(payloads[0], null, 2) + "\n", "utf8");
console.log("Canonical prayer times written: " + days.join(", ") + " (" + zone + ")");
