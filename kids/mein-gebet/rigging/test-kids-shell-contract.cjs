#!/usr/bin/env node
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..", "..", "..");
const config = JSON.parse(fs.readFileSync(path.join(__dirname, "../config.json"), "utf8"));
const shells = ["kids/index.html", "kids/start.html", "kids/shell.html"].map((p) => ({
  p,
  html: fs.readFileSync(path.join(root, p), "utf8")
}));
let passed = 0;
function check(label, fn) {
  fn();
  passed += 1;
  console.log("PASS " + label);
}

check("config forbids a fifth capsule, bottom tab, merge and live", () => {
  assert.equal(config.permanentBottomTab, false);
  assert.equal(config.fifthHomeCapsule, false);
  assert.equal(config.mergeMain, false);
  assert.equal(config.liveDeploy, false);
  assert.equal(config.approvedToTeach, false);
});

shells.forEach(({ p, html }) => {
  check(p + " mounts the isolated preview script once", () => {
    const hits = html.match(/data-kids-mein-gebet-preview="1"/g) || [];
    assert.equal(hits.length, 1);
    assert.match(html, /src="\/kids\/mein-gebet\/preview-v1\.js\?v=2"/);
  });
  check(p + " keeps four existing bottom tabs and no Mein-Gebet tab", () => {
    const nav = html.match(/class="nav-btn[^"]*"/g) || [];
    assert.equal(nav.length, 4);
    assert.doesNotMatch(html, /data-target="mein-gebet"/);
    assert.match(html, /data-target="today"/);
    assert.match(html, /data-target="stories"/);
    assert.match(html, /data-target="quran"/);
    assert.match(html, /data-target="parents"/);
  });
  check(p + " keeps Home Hörwelten grid for the test entry hook", () => {
    assert.match(html, /id="view-today"/);
    assert.match(html, /class="big-choice-grid"/);
    assert.match(html, /<main class="shell">/);
  });
});

const a = shells[0].html.match(/src="\/kids\/mein-gebet\/preview-v1\.js\?v=\d+"/)[0];
check("index, start and shell share the same preview script pin", () => {
  shells.forEach(({ html }) => assert.ok(html.includes(a)));
});

console.log("OK kids shell contract: " + passed);
