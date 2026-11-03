import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (name) => readFileSync(new URL("../" + name, import.meta.url), "utf8");

test("native widget data path must not calculate solar prayer times independently", () => {
  const daily = read("ios/DarAlTawhid/Shared/DarDailyContent.swift");
  const snapshot = read("ios/DarAlTawhid/Shared/DarWidgetSnapshot.swift");
  assert.doesNotMatch(daily, /DarPrayerEngine\.times\(/);
  assert.match(snapshot, /canonicalPrayerDays: \[DarCanonicalPrayerDay\]/);
  assert.match(snapshot, /nextAbsolutePrayer\(after/);
  assert.match(snapshot, /prayerTimeZone/);
});

test("Live Activity and widgets consume immutable absolute targets", () => {
  const native = read("ios/DarAlTawhid/DarAlTawhid/DarNativePermissions.swift");
  const widget = read("ios/DarAlTawhid/Widgets/DarAlTawhidWidgets.swift");
  assert.doesNotMatch(native.slice(native.indexOf("enum DarPrayerLiveActivityController")), /date\(bySettingHour:/);
  assert.match(native, /snapshot\.nextAbsolutePrayer\(after:/);
  assert.match(widget, /Text\(target, style: \.timer\)/);
  assert.match(widget, /Text\(context\.state\.targetDate, style: \.timer\)/);
  assert.match(widget, /ActivityConfiguration\(for: DarPrayerLiveAttributes\.self\)/);
  assert.match(widget, /DynamicIslandExpandedRegion/);
  assert.doesNotMatch(widget, /darPrayerDate\(time:/);
});

test("prayer JSON source is versioned and location-scoped", () => {
  const worker = read("cloudflare/worker.js");
  const sync = read("ios/DarAlTawhid/Shared/DarWidgetStore.swift");
  assert.match(worker, /url\.searchParams\.get\("format"\) === "canonical"/);
  assert.match(sync, /repositoryRoot/);
  assert.match(sync, /URLQueryItem\(name: "lat"/);
  assert.match(sync, /URLQueryItem\(name: "lon"/);
  assert.match(sync, /URLQueryItem\(name: "tz"/);
  assert.match(sync, /lastPrayerSyncAt/);
});
