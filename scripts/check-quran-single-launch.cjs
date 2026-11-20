#!/usr/bin/env node
"use strict";
// Regression: one Qur'an learning tap must not open Learn Studio and full player together.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const paths = ["assets/dar-quran-player.js", "test/assets/dar-quran-player.js"];
for (const path of paths) {
  const src = fs.readFileSync(path, "utf8");
  const launches = [...src.matchAll(/function onLearnLaunchTap\(ev\) \{[\s\S]*?\n  \}/g)].map(m => m[0]);
  const expected = path.startsWith("test/") ? 1 : 2;
  assert.equal(launches.length, expected, path + ": unexpected player engine count");
  assert.equal((src.match(/if \(!fullUiWanted \|\| !isFullPlayerRoute\(\)\)/g) || []).length, expected,
    path + ": full-screen player must stay inside its route");
  assert.ok(!src.includes('restoreLearning({ play: false, from: "continue-card" });'),
    path + ": redundant document click handler can launch twice");
  launches.forEach((source, i) => {
    function exercise(studioPresent, studioLauncher) {
      let launchesCount = 0, prevented = 0, stopped = 0;
      const btn = { closest: () => studioLauncher ? btn : null };
      const target = { closest: () => btn };
      const context = {
        window: studioPresent ? { DARQuranLearnStudio: { open() {} } } : {},
        launchLearnPlayer() { launchesCount += 1; },
        Date: { now: () => 1000 }
      };
      vm.runInNewContext("var learnTapAt=0;\n" + source + "\nthis.tap=onLearnLaunchTap;", context);
      const ev = { target, preventDefault() { prevented++; }, stopPropagation() { stopped++; } };
      return { first: context.tap(ev), second: context.tap(ev), calls: launchesCount, prevented, stopped };
    }
    const studio = exercise(true, true);
    assert.equal(studio.first, false, path + " engine " + i + ": studio tap claimed by full player");
    assert.equal(studio.calls, 0, path + " engine " + i + ": extra player route launched");
    assert.equal(studio.prevented, 0, path + " engine " + i + ": studio event blocked");
    const fallback = exercise(false, true);
    assert.equal(fallback.first, true, path + " engine " + i + ": legacy fallback lost");
    assert.equal(fallback.calls, 1, path + " engine " + i + ": pointerup+click duplicated");
    const resume = exercise(true, false);
    assert.equal(resume.first, true, path + " engine " + i + ": resume should remain handled");
    assert.equal(resume.calls, 1, path + " engine " + i + ": resume duplicated");
  });
}
console.log("Qur'an single-launch regression passed: all platform player engines.");
